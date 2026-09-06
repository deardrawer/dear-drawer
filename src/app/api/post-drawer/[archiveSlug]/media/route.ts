import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { getPostDrawerByArchiveSlug } from '@/lib/postDrawer'
import { isPostDrawerActiveKST } from '@/lib/weddingLifecycle'
import { getDB } from '@/lib/db'
import { getProjectStorage, getCloudConnectionById, getCloudConnectionByUser } from '@/lib/cloudStorage'
import { getValidAccessToken, getFileView } from '@/lib/googleDrive'

/**
 * [비공개] 함께 남겨준 순간 — Guest Share 미디어 표시용 URL 발급 (on-demand).
 *
 * 원칙(요청사항 3):
 * - 사진 원본은 Google Drive에 그대로 둔다. 우리 서버에 저장/프록시하지 않는다.
 * - 서버는 커플의 Drive 토큰으로 thumbnailLink(서명 임시 URL)만 발급해 반환.
 * - 실제 이미지 바이트는 브라우저가 Google CDN에서 직접 로드한다.
 * - 파일을 public 공유로 바꾸지 않는다.
 *
 * 권한(요청사항 7): archiveSlug/sessionId/google_file_id를 안다고 접근 불가.
 *   반드시 owner 검증 + 요청 파일이 owner의 invitation 소속인지 서버에서 재검증(invitation_id 필터).
 *
 * 쿼리: scope=all | bundle, key=msg_<id>|ses_<id>(bundle), offset, limit
 */

const GRID_SIZE = 400 // 그리드 썸네일
const FULL_SIZE = 1600 // 라이트박스용 큰 썸네일(원본 다운로드 아님 — 프록시/공개 없이 표시 가능한 상한)
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60

interface FileRow {
  id: string
  google_file_id: string | null
  mime_type: string | null
  guest_name?: string | null
}

/** Google 썸네일 링크의 크기 파라미터(=s220 등)를 원하는 크기로 교체. 형식이 다르면 원본 유지. */
function sized(link: string | null, size: number): string | null {
  if (!link) return null
  return /=s\d+(-[a-z]+)?$/.test(link) ? link.replace(/=s\d+(-[a-z]+)?$/, `=s${size}`) : link
}

function isVideoMime(mime: string | null): boolean {
  return !!mime && mime.toLowerCase().startsWith('video')
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ archiveSlug: string }> }) {
  try {
    const { archiveSlug } = await params
    const row = await getPostDrawerByArchiveSlug(archiveSlug)
    if (!row) return NextResponse.json({ error: 'POST DRAWER를 찾을 수 없습니다.' }, { status: 404 })

    // owner 검증 (URL을 안다는 이유만으로 권한 없음)
    const owned = await getOwnedInvitation(request, row.invitation_id)
    if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    const invitationId = owned.invitation.id

    if (!isPostDrawerActiveKST(owned.invitation.wedding_date)) {
      return NextResponse.json({ pending: true })
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') === 'bundle' ? 'bundle' : 'all'
    const key = searchParams.get('key') || ''
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0)
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))

    const db = await getDB()

    // ── 대상 파일 목록(google_file_id 있는 것만 = Drive에 실제 존재) ────────
    // invitation_id 필터로 소속 재검증. 파일별 소유권은 이 필터가 보장한다.
    let total = 0
    let fileRows: FileRow[] = []

    if (scope === 'bundle') {
      if (key.startsWith('msg_')) {
        const messageId = key.slice(4)
        // 이 메시지에 연결된 세션들(소속 invitation 내에서만)
        const sess = (
          await db
            .prepare('SELECT id FROM guest_upload_sessions WHERE invitation_id = ? AND guestbook_message_id = ?')
            .bind(invitationId, messageId)
            .all<{ id: string }>()
        ).results || []
        const sessionIds = sess.map((s) => s.id)
        if (sessionIds.length === 0) {
          return NextResponse.json({ items: [], total: 0, offset, limit, nextOffset: null })
        }
        const ph = sessionIds.map(() => '?').join(',')
        const totalRow = await db
          .prepare(`SELECT COUNT(*) AS c FROM guest_upload_files WHERE invitation_id = ? AND google_file_id IS NOT NULL AND session_id IN (${ph})`)
          .bind(invitationId, ...sessionIds)
          .first<{ c: number }>()
        total = totalRow?.c ?? 0
        fileRows = (
          await db
            .prepare(
              `SELECT id, google_file_id, mime_type FROM guest_upload_files
               WHERE invitation_id = ? AND google_file_id IS NOT NULL AND session_id IN (${ph})
               ORDER BY created_at ASC LIMIT ? OFFSET ?`,
            )
            .bind(invitationId, ...sessionIds, limit, offset)
            .all<FileRow>()
        ).results || []
      } else if (key.startsWith('ses_')) {
        const sessionId = key.slice(4)
        // 세션이 이 invitation 소속인지 재검증
        const own = await db
          .prepare('SELECT id FROM guest_upload_sessions WHERE id = ? AND invitation_id = ?')
          .bind(sessionId, invitationId)
          .first<{ id: string }>()
        if (!own) return NextResponse.json({ items: [], total: 0, offset, limit, nextOffset: null })
        const totalRow = await db
          .prepare('SELECT COUNT(*) AS c FROM guest_upload_files WHERE invitation_id = ? AND session_id = ? AND google_file_id IS NOT NULL')
          .bind(invitationId, sessionId)
          .first<{ c: number }>()
        total = totalRow?.c ?? 0
        fileRows = (
          await db
            .prepare(
              `SELECT id, google_file_id, mime_type FROM guest_upload_files
               WHERE invitation_id = ? AND session_id = ? AND google_file_id IS NOT NULL
               ORDER BY created_at ASC LIMIT ? OFFSET ?`,
            )
            .bind(invitationId, sessionId, limit, offset)
            .all<FileRow>()
        ).results || []
      } else {
        return NextResponse.json({ error: '잘못된 key입니다.' }, { status: 400 })
      }
    } else {
      // scope=all — 전체 사진(업로더 이름 포함), 최신순
      const totalRow = await db
        .prepare('SELECT COUNT(*) AS c FROM guest_upload_files WHERE invitation_id = ? AND google_file_id IS NOT NULL')
        .bind(invitationId)
        .first<{ c: number }>()
      total = totalRow?.c ?? 0
      fileRows = (
        await db
          .prepare(
            `SELECT f.id AS id, f.google_file_id AS google_file_id, f.mime_type AS mime_type, s.guest_name AS guest_name
             FROM guest_upload_files f
             LEFT JOIN guest_upload_sessions s ON f.session_id = s.id
             WHERE f.invitation_id = ? AND f.google_file_id IS NOT NULL
             ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
          )
          .bind(invitationId, limit, offset)
          .all<FileRow>()
      ).results || []
    }

    if (fileRows.length === 0) {
      return NextResponse.json({ items: [], total, offset, limit, nextOffset: null })
    }

    // ── Drive 연결/토큰 확보 (없거나 실패 시 화면 안 깨지게 안내용 에러 반환) ──
    const storage = await getProjectStorage(invitationId)
    const conn =
      (storage?.connection_id ? await getCloudConnectionById(storage.connection_id) : null) ||
      (await getCloudConnectionByUser(owned.invitation.user_id))
    if (!conn) {
      return NextResponse.json({ error: 'drive_disconnected', reconnectUrl: `/dashboard/${invitationId}` }, { status: 200 })
    }
    let accessToken: string
    try {
      accessToken = await getValidAccessToken(conn)
    } catch {
      return NextResponse.json({ error: 'drive_disconnected', reconnectUrl: `/dashboard/${invitationId}` }, { status: 200 })
    }

    // ── 파일별 표시용 URL 발급(썸네일/보기 링크). 바이트는 받지 않음. ──
    const items = await Promise.all(
      fileRows.map(async (f) => {
        const view = await getFileView(accessToken, f.google_file_id as string)
        const isVid = view ? view.isVideo : isVideoMime(f.mime_type)
        if (!view || !view.thumbnailLink) {
          // Drive get 실패/썸네일 없음 → 자리표시자 + 재시도용 error 플래그
          return {
            id: f.id,
            kind: isVid ? ('video' as const) : ('image' as const),
            thumb: null as string | null,
            full: null as string | null,
            view: view?.webViewLink ?? null,
            name: (f.guest_name ?? null) as string | null,
            error: true,
          }
        }
        return {
          id: f.id,
          kind: isVid ? ('video' as const) : ('image' as const),
          thumb: sized(view.thumbnailLink, GRID_SIZE),
          full: sized(view.thumbnailLink, FULL_SIZE),
          view: view.webViewLink ?? null,
          name: (f.guest_name ?? null) as string | null,
          error: false,
        }
      }),
    )

    const nextOffset = offset + limit < total ? offset + limit : null
    return NextResponse.json({ items, total, offset, limit, nextOffset })
  } catch (e) {
    console.error('post-drawer media error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '미디어 조회에 실패했습니다.' }, { status: 500 })
  }
}
