import { getDB } from './db'

export type GuestUploadFileStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'queued'
  | 'transferring'
  | 'completed'
  | 'failed'

export interface GuestUploadFile {
  id: string
  session_id: string
  invitation_id: string
  r2_key: string
  original_name: string | null
  mime_type: string | null
  size: number | null
  status: GuestUploadFileStatus
  google_file_id: string | null
  error_message: string | null
  attempt_count: number
  created_at: string
  uploaded_at: string | null
  transferred_at: string | null
  updated_at: string
}

const nowIso = () => new Date().toISOString()

export async function createGuestUploadFile(params: {
  id: string
  sessionId: string
  invitationId: string
  r2Key: string
  originalName: string | null
  mimeType: string | null
  size: number | null
}): Promise<void> {
  const db = await getDB()
  const ts = nowIso()
  await db
    .prepare(
      `INSERT INTO guest_upload_files
       (id, session_id, invitation_id, r2_key, original_name, mime_type, size, status, attempt_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    )
    .bind(params.id, params.sessionId, params.invitationId, params.r2Key, params.originalName, params.mimeType, params.size, ts, ts)
    .run()
}

export async function getGuestUploadFile(id: string): Promise<GuestUploadFile | null> {
  const db = await getDB()
  return db.prepare('SELECT * FROM guest_upload_files WHERE id = ? LIMIT 1').bind(id).first<GuestUploadFile>()
}

/** R2 검증 통과 → uploaded */
export async function markGuestFileUploaded(id: string): Promise<void> {
  const db = await getDB()
  const ts = nowIso()
  await db
    .prepare("UPDATE guest_upload_files SET status = 'uploaded', uploaded_at = ?, updated_at = ? WHERE id = ?")
    .bind(ts, ts, id)
    .run()
}

export async function setGuestFileStatus(id: string, status: GuestUploadFileStatus, errorMessage?: string | null): Promise<void> {
  const db = await getDB()
  await db
    .prepare('UPDATE guest_upload_files SET status = ?, error_message = ?, updated_at = ? WHERE id = ?')
    .bind(status, errorMessage ?? null, nowIso(), id)
    .run()
}

// ── Drive 연결이 끊겼던 동안 못 간 사진 ──────────────────────────────
// 로그인 정보 만료 · 연결 없음 · Drive 미연결(매핑 없음)로 실패한 사진은 다시 연결하면 다시 보낼 수 있다 (R2 에 그대로 있음)
const TOKEN_FAIL = "(error_message LIKE 'Google 토큰 갱신 실패%' OR error_message LIKE '%재연결 필요%')"
const RESENDABLE = `(${TOKEN_FAIL} OR error_message LIKE 'project_cloud_storage 매핑 없음%')`

/** 이 청첩장에서 sinceIso 이후 로그인 정보 문제로 Drive 에 못 간 사진 수 — 0 보다 크면 '다시 연결 필요' */
export async function countTokenFailedGuestFiles(invitationId: string, sinceIso: string): Promise<number> {
  const db = await getDB()
  const r = await db
    .prepare(`SELECT COUNT(*) AS n FROM guest_upload_files WHERE invitation_id = ? AND status = 'failed' AND ${TOKEN_FAIL} AND updated_at > ?`)
    .bind(invitationId, sinceIso)
    .first<{ n: number }>()
  return r?.n ?? 0
}

/**
 * 다시 연결한 직후 — 못 간 사진을 'uploaded' 로 되돌리고 id 목록을 돌려줌 (호출부가 큐에 다시 넣음).
 * Drive 이어 올리기 주소는 예전 계정 것일 수 있어 비우고, 완료된 사진이 없는 하객 폴더도 새로 만들게 비운다.
 */
export async function resetResendableGuestFiles(invitationId: string, limit = 500): Promise<string[]> {
  const db = await getDB()
  const rows = await db
    .prepare(`SELECT id FROM guest_upload_files WHERE invitation_id = ? AND status = 'failed' AND ${RESENDABLE} ORDER BY created_at LIMIT ?`)
    .bind(invitationId, limit)
    .all<{ id: string }>()
  const ids = (rows.results ?? []).map(r => r.id)
  if (!ids.length) return []
  const ts = nowIso()
  await db
    .prepare(
      `UPDATE guest_upload_sessions SET folder_id = NULL, updated_at = ?
       WHERE id IN (SELECT DISTINCT session_id FROM guest_upload_files WHERE invitation_id = ? AND status = 'failed' AND ${RESENDABLE})
         AND NOT EXISTS (SELECT 1 FROM guest_upload_files g WHERE g.session_id = guest_upload_sessions.id AND g.status = 'completed')`,
    )
    .bind(ts, invitationId)
    .run()
  for (const id of ids) {
    await db
      .prepare(
        `UPDATE guest_upload_files SET status = 'uploaded', error_message = NULL, attempt_count = 0,
         google_upload_uri = NULL, google_upload_offset = 0, google_upload_expires_at = NULL, updated_at = ?
         WHERE id = ? AND status = 'failed'`,
      )
      .bind(ts, id)
      .run()
  }
  return ids
}
