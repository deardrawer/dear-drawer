import { NextRequest, NextResponse } from 'next/server'
import { getInvitationBySlug, getInvitationById, getInvitationByAlias, getDB } from '@/lib/db'
import { countRecentSessions } from '@/lib/cloudStorage'
import {
  validateFile,
  validateBatch,
  sanitizeGuestName,
  buildR2Key,
  extToMime,
  RATE_LIMIT,
  PRESIGN_EXPIRES_SECONDS,
  type FileMetaInput,
} from '@/lib/guestShareLimits'
import { createPresignedPutUrl } from '@/lib/r2Presign'

async function hashIp(ip: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

/**
 * [공개] 하객 업로드 세션 생성 + 파일별 R2 presigned PUT URL 발급.
 * 브라우저는 slug + 파일 메타만 보내고, key/URL은 서버가 결정한다. (토큰/버킷 자격증명 미노출)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: string; guestName?: string; message?: string; files?: FileMetaInput[] }
    const slug = (body.slug || '').trim()
    const files = Array.isArray(body.files) ? body.files : []
    if (!slug) return NextResponse.json({ error: 'slug가 필요합니다.' }, { status: 400 })

    // 초대장 조회 (slug → id → alias)
    let invitation = await getInvitationBySlug(slug)
    if (!invitation) invitation = await getInvitationById(slug)
    if (!invitation) {
      const byAlias = await getInvitationByAlias(slug)
      if (byAlias) invitation = byAlias
    }
    if (!invitation) return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })

    // 공유 활성 + 발행 확인
    if ((invitation.guest_share_enabled ?? 0) !== 1 || (invitation.is_published ?? 0) !== 1) {
      return NextResponse.json({ error: '사진 공유가 활성화되어 있지 않습니다.' }, { status: 403 })
    }

    // 파일 검증 (개수/총량 + 개별 타입/크기)
    const batch = validateBatch(files)
    if (!batch.ok) return NextResponse.json({ error: batch.error }, { status: 400 })
    const validated = files.map((f) => ({ f, v: validateFile(f) }))
    const bad = validated.find((x) => !x.v.ok)
    if (bad) return NextResponse.json({ error: `${bad.f.name}: ${bad.v.error}` }, { status: 400 })

    // rate limit (IP / 초대장)
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'
    const ipHash = await hashIp(ip)
    const sinceIso = new Date(Date.now() - 3600_000).toISOString()
    const [ipCount, invCount] = await Promise.all([
      countRecentSessions({ ipHash, sinceIso }),
      countRecentSessions({ invitationId: invitation.id, sinceIso }),
    ])
    if (ipCount >= RATE_LIMIT.perIpSessionsPerHour || invCount >= RATE_LIMIT.perInvitationSessionsPerHour) {
      return NextResponse.json({ error: '요청이 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    // 이름(필수, sanitize) + 메시지(선택, 200자 clamp). 메시지가 있으면 방명록(photo_share, 비공개)으로 저장.
    const guestName = sanitizeGuestName(body.guestName || '')
    const message = ((body.message ?? '').trim().slice(0, 200)) || null
    const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0)
    const expiresAt = new Date(Date.now() + PRESIGN_EXPIRES_SECONDS * 1000).toISOString()

    // id/키를 미리 생성 → guestbook(선택)+session+files를 단일 batch로 원자적 기록.
    // (검증·rate limit 통과 후에만 실행. 하나라도 실패하면 전부 롤백 → guestbook orphan 방지)
    const db = await getDB()
    const ts = new Date().toISOString()
    const sessionId = `gus_${crypto.randomUUID()}`
    const guestbookId = message ? `gbm_${crypto.randomUUID()}` : null
    const fileEntries = files.map((f, i) => {
      const v = validated[i].v
      const fileId = crypto.randomUUID()
      const contentType = f.mimeType || extToMime(v.ext!)
      return {
        fileId,
        contentType,
        r2Key: buildR2Key(invitation.id, sessionId, fileId, v.ext!),
        originalName: (f.name || '').slice(0, 200) || null,
        size: f.size,
      }
    })

    const stmts: ReturnType<typeof db.prepare>[] = []
    if (guestbookId) {
      // 기존 guestbook_messages 재사용. source='photo_share', is_public=0 → 공개 청첩장 미노출, 오너만 확인.
      stmts.push(
        db
          .prepare(
            `INSERT INTO guestbook_messages (id, invitation_id, guest_name, message, question, source, is_public, created_at)
             VALUES (?, ?, ?, ?, NULL, 'photo_share', 0, ?)`,
          )
          .bind(guestbookId, invitation.id, guestName, message, ts),
      )
    }
    stmts.push(
      db
        .prepare(
          `INSERT INTO guest_upload_sessions
           (id, invitation_id, guest_name, guestbook_message_id, folder_id, file_count, total_bytes, ip_hash, status, expires_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'pending', ?, ?, ?)`,
        )
        .bind(sessionId, invitation.id, guestName, guestbookId, files.length, totalBytes, ipHash, expiresAt, ts, ts),
    )
    for (const fe of fileEntries) {
      stmts.push(
        db
          .prepare(
            `INSERT INTO guest_upload_files
             (id, session_id, invitation_id, r2_key, original_name, mime_type, size, status, attempt_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
          )
          .bind(fe.fileId, sessionId, invitation.id, fe.r2Key, fe.originalName, fe.contentType, fe.size, ts, ts),
      )
    }
    await db.batch(stmts) // 원자적 — 부분 실패 시 전부 롤백

    // presigned URL 발급 (DB 아님 — batch 성공 후)
    const out: { fileId: string; uploadUrl: string; contentType: string }[] = []
    for (const fe of fileEntries) {
      const uploadUrl = await createPresignedPutUrl(fe.r2Key, fe.contentType)
      out.push({ fileId: fe.fileId, uploadUrl, contentType: fe.contentType })
    }

    return NextResponse.json({ sessionId, files: out })
  } catch (e) {
    console.error('guest-share session error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '세션 생성에 실패했습니다.' }, { status: 500 })
  }
}
