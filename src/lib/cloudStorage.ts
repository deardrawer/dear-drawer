import { getDB } from './db'

/**
 * 하객 사진 공유 — 클라우드 연결/저장위치/업로드세션 DB 헬퍼.
 * 토큰은 이미 암호화된 상태(cloudTokens)로만 이 레이어에 전달/저장한다.
 */

export interface CloudConnection {
  id: string
  user_id: string
  provider: string
  account_email: string | null
  access_token_enc: string | null
  access_token_iv: string | null
  refresh_token_enc: string | null
  refresh_token_iv: string | null
  scope: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface ProjectCloudStorage {
  invitation_id: string
  connection_id: string
  root_folder_id: string | null
  guest_folder_id: string | null
  created_at: string
  updated_at: string
}

export interface GuestUploadSession {
  id: string
  invitation_id: string
  guest_name: string | null
  folder_id: string | null
  file_count: number
  total_bytes: number
  ip_hash: string | null
  status: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

const nowIso = () => new Date().toISOString()

// ── cloud_connections ─────────────────────────────────────────────
export async function getCloudConnectionByUser(userId: string, provider = 'google'): Promise<CloudConnection | null> {
  const db = await getDB()
  return db
    .prepare('SELECT * FROM cloud_connections WHERE user_id = ? AND provider = ? LIMIT 1')
    .bind(userId, provider)
    .first<CloudConnection>()
}

export async function getCloudConnectionById(id: string): Promise<CloudConnection | null> {
  const db = await getDB()
  return db.prepare('SELECT * FROM cloud_connections WHERE id = ? LIMIT 1').bind(id).first<CloudConnection>()
}

/**
 * 연결 저장(upsert). refresh_token은 새 값이 있을 때만 갱신하고, 없으면 기존 값을 유지한다.
 * (Google은 재연결 시 refresh_token을 다시 주지 않을 수 있음)
 */
export async function saveCloudConnection(params: {
  userId: string
  provider?: string
  accountEmail: string | null
  accessTokenEnc: string
  accessTokenIv: string
  refreshTokenEnc: string | null
  refreshTokenIv: string | null
  scope: string | null
  expiresAt: string | null
}): Promise<CloudConnection> {
  const db = await getDB()
  const provider = params.provider || 'google'
  const existing = await getCloudConnectionByUser(params.userId, provider)
  const ts = nowIso()

  if (existing) {
    // refresh_token은 새 값이 있을 때만 교체 (없으면 기존 유지 — 절대 NULL 덮어쓰기 금지)
    const refreshEnc = params.refreshTokenEnc ?? existing.refresh_token_enc
    const refreshIv = params.refreshTokenEnc ? params.refreshTokenIv : existing.refresh_token_iv
    await db
      .prepare(
        `UPDATE cloud_connections SET account_email = ?, access_token_enc = ?, access_token_iv = ?,
         refresh_token_enc = ?, refresh_token_iv = ?, scope = ?, expires_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        params.accountEmail,
        params.accessTokenEnc,
        params.accessTokenIv,
        refreshEnc,
        refreshIv,
        params.scope,
        params.expiresAt,
        ts,
        existing.id,
      )
      .run()
    return (await getCloudConnectionById(existing.id))!
  }

  const id = `cc_${crypto.randomUUID()}`
  await db
    .prepare(
      `INSERT INTO cloud_connections
       (id, user_id, provider, account_email, access_token_enc, access_token_iv,
        refresh_token_enc, refresh_token_iv, scope, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      params.userId,
      provider,
      params.accountEmail,
      params.accessTokenEnc,
      params.accessTokenIv,
      params.refreshTokenEnc,
      params.refreshTokenIv,
      params.scope,
      params.expiresAt,
      ts,
      ts,
    )
    .run()
  return (await getCloudConnectionById(id))!
}

/** access_token(+만료)만 갱신 (refresh 후) */
export async function updateConnectionAccessToken(
  id: string,
  accessTokenEnc: string,
  accessTokenIv: string,
  expiresAt: string | null,
): Promise<void> {
  const db = await getDB()
  await db
    .prepare('UPDATE cloud_connections SET access_token_enc = ?, access_token_iv = ?, expires_at = ?, updated_at = ? WHERE id = ?')
    .bind(accessTokenEnc, accessTokenIv, expiresAt, nowIso(), id)
    .run()
}

// ── project_cloud_storage ────────────────────────────────────────
export async function getProjectStorage(invitationId: string): Promise<ProjectCloudStorage | null> {
  const db = await getDB()
  return db
    .prepare('SELECT * FROM project_cloud_storage WHERE invitation_id = ? LIMIT 1')
    .bind(invitationId)
    .first<ProjectCloudStorage>()
}

export async function saveProjectStorage(params: {
  invitationId: string
  connectionId: string
  rootFolderId: string | null
  guestFolderId: string | null
}): Promise<void> {
  const db = await getDB()
  const ts = nowIso()
  await db
    .prepare(
      `INSERT INTO project_cloud_storage (invitation_id, connection_id, root_folder_id, guest_folder_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(invitation_id) DO UPDATE SET
         connection_id = excluded.connection_id,
         root_folder_id = excluded.root_folder_id,
         guest_folder_id = excluded.guest_folder_id,
         updated_at = excluded.updated_at`,
    )
    .bind(params.invitationId, params.connectionId, params.rootFolderId, params.guestFolderId, ts, ts)
    .run()
}

export async function deleteProjectStorage(invitationId: string): Promise<void> {
  const db = await getDB()
  await db.prepare('DELETE FROM project_cloud_storage WHERE invitation_id = ?').bind(invitationId).run()
}

// ── invitations.guest_share_* ────────────────────────────────────
export async function updateGuestShareSettings(
  invitationId: string,
  s: { enabled?: boolean; title?: string | null; description?: string | null },
): Promise<void> {
  const db = await getDB()
  const sets: string[] = []
  const vals: unknown[] = []
  if (s.enabled !== undefined) { sets.push('guest_share_enabled = ?'); vals.push(s.enabled ? 1 : 0) }
  if (s.title !== undefined) { sets.push('guest_share_title = ?'); vals.push(s.title) }
  if (s.description !== undefined) { sets.push('guest_share_description = ?'); vals.push(s.description) }
  if (!sets.length) return
  sets.push("updated_at = datetime('now')")
  vals.push(invitationId)
  await db.prepare(`UPDATE invitations SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run()
}

// ── guest_upload_sessions ────────────────────────────────────────
export async function createGuestUploadSession(params: {
  invitationId: string
  guestName: string | null
  folderId: string | null
  fileCount: number
  totalBytes: number
  ipHash: string | null
  expiresAt: string | null
}): Promise<GuestUploadSession> {
  const db = await getDB()
  const id = `gus_${crypto.randomUUID()}`
  const ts = nowIso()
  await db
    .prepare(
      `INSERT INTO guest_upload_sessions
       (id, invitation_id, guest_name, folder_id, file_count, total_bytes, ip_hash, status, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    )
    .bind(id, params.invitationId, params.guestName, params.folderId, params.fileCount, params.totalBytes, params.ipHash, params.expiresAt, ts, ts)
    .run()
  return (await db.prepare('SELECT * FROM guest_upload_sessions WHERE id = ?').bind(id).first<GuestUploadSession>())!
}

export async function updateGuestUploadSessionStatus(id: string, status: 'pending' | 'completed' | 'failed'): Promise<void> {
  const db = await getDB()
  await db.prepare('UPDATE guest_upload_sessions SET status = ?, updated_at = ? WHERE id = ?').bind(status, nowIso(), id).run()
}

/** rate limit: 최근 sinceIso 이후 해당 초대장/ip_hash의 세션 개수 */
export async function countRecentSessions(params: { invitationId?: string; ipHash?: string; sinceIso: string }): Promise<number> {
  const db = await getDB()
  const conds: string[] = ['created_at >= ?']
  const vals: unknown[] = [params.sinceIso]
  if (params.invitationId) { conds.push('invitation_id = ?'); vals.push(params.invitationId) }
  if (params.ipHash) { conds.push('ip_hash = ?'); vals.push(params.ipHash) }
  const row = await db
    .prepare(`SELECT COUNT(*) as c FROM guest_upload_sessions WHERE ${conds.join(' AND ')}`)
    .bind(...vals)
    .first<{ c: number }>()
  return row?.c ?? 0
}
