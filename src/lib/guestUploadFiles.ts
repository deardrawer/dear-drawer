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
