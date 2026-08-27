import { NextRequest, NextResponse } from 'next/server'
import { getInvitationBySlug, getInvitationById, getInvitationByAlias } from '@/lib/db'
import { createGuestUploadSession, countRecentSessions } from '@/lib/cloudStorage'
import { createGuestUploadFile } from '@/lib/guestUploadFiles'
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
    const body = (await request.json()) as { slug?: string; guestName?: string; files?: FileMetaInput[] }
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

    // 세션 생성
    const guestName = sanitizeGuestName(body.guestName || '')
    const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0)
    const expiresAt = new Date(Date.now() + PRESIGN_EXPIRES_SECONDS * 1000).toISOString()
    const session = await createGuestUploadSession({
      invitationId: invitation.id,
      guestName,
      folderId: null, // Drive 폴더는 B2 이전 시 결정
      fileCount: files.length,
      totalBytes,
      ipHash,
      expiresAt,
    })

    // 파일별 key + presigned URL
    const out: { fileId: string; uploadUrl: string; contentType: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const v = validated[i].v
      const fileId = crypto.randomUUID()
      const contentType = f.mimeType || extToMime(v.ext!)
      const r2Key = buildR2Key(invitation.id, session.id, fileId, v.ext!)
      await createGuestUploadFile({
        id: fileId,
        sessionId: session.id,
        invitationId: invitation.id,
        r2Key,
        originalName: (f.name || '').slice(0, 200) || null,
        mimeType: contentType,
        size: f.size,
      })
      const uploadUrl = await createPresignedPutUrl(r2Key, contentType)
      out.push({ fileId, uploadUrl, contentType })
    }

    return NextResponse.json({ sessionId: session.id, files: out })
  } catch (e) {
    console.error('guest-share session error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '세션 생성에 실패했습니다.' }, { status: 500 })
  }
}
