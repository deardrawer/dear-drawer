import { decryptSecret, encryptSecret } from './cloudTokens'
import { refreshAccessToken } from './googleOAuth'
import { updateConnectionAccessToken, type CloudConnection } from './cloudStorage'

/**
 * Google Drive API 헬퍼.
 * - drive.file 스코프: 앱이 생성/선택한 파일만 접근 → 폴더는 저장된 folder_id로 접근, 삭제된 경우에만 재생성.
 * - resumable 업로드는 서버가 세션 URI만 발급하고 바이트는 클라이언트가 직접 PUT.
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

/** 유효한 access_token 확보 (만료 임박 시 refresh_token으로 갱신 + DB 저장) */
export async function getValidAccessToken(conn: CloudConnection): Promise<string> {
  const expMs = conn.expires_at ? Date.parse(conn.expires_at) : 0
  const stillValid = conn.access_token_enc && conn.access_token_iv && expMs && expMs - Date.now() > 60_000
  if (stillValid) {
    return decryptSecret(conn.access_token_enc!, conn.access_token_iv!)
  }
  if (!conn.refresh_token_enc || !conn.refresh_token_iv) {
    if (conn.access_token_enc && conn.access_token_iv) return decryptSecret(conn.access_token_enc, conn.access_token_iv)
    throw new Error('access_token이 만료되었고 refresh_token이 없습니다. Google Drive를 다시 연결해주세요.')
  }
  const refresh = await decryptSecret(conn.refresh_token_enc, conn.refresh_token_iv)
  const tok = await refreshAccessToken(refresh)
  const enc = await encryptSecret(tok.access_token)
  const expiresAt = new Date(Date.now() + (tok.expires_in - 30) * 1000).toISOString()
  await updateConnectionAccessToken(conn.id, enc.enc, enc.iv, expiresAt)
  return tok.access_token
}

export async function getAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(`${DRIVE_API}/about?fields=user`, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) return null
  const data = (await res.json()) as { user?: { emailAddress?: string } }
  return data.user?.emailAddress ?? null
}

export async function folderExists(accessToken: string, folderId: string): Promise<boolean> {
  const res = await fetch(`${DRIVE_API}/files/${folderId}?fields=id,trashed`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return false
  const d = (await res.json()) as { trashed?: boolean }
  return d.trashed !== true
}

export async function createFolder(accessToken: string, name: string, parentId?: string): Promise<string> {
  const body: Record<string, unknown> = { name, mimeType: 'application/vnd.google-apps.folder' }
  if (parentId) body.parents = [parentId]
  const res = await fetch(`${DRIVE_API}/files?fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`폴더 생성 실패: ${res.status} ${await res.text()}`)
  const d = (await res.json()) as { id: string }
  return d.id
}

/**
 * 최초 연결 시 폴더 트리 생성:
 *   Dear Drawer / {신랑} & {신부} / 하객 사진
 * (drive.file 스코프는 이름 검색이 앱 파일로 제한되므로 최초엔 새로 생성)
 * @returns rootFolderId = 커플 폴더, guestFolderId = 하객 사진 폴더
 */
export async function ensureRootFolders(
  accessToken: string,
  groomName: string | null,
  brideName: string | null,
): Promise<{ rootFolderId: string; guestFolderId: string }> {
  const dearDrawer = await createFolder(accessToken, 'Dear Drawer')
  const couple = await createFolder(accessToken, `${groomName || '신랑'} & ${brideName || '신부'}`, dearDrawer)
  const guest = await createFolder(accessToken, '하객 사진', couple)
  return { rootFolderId: couple, guestFolderId: guest }
}

/** 저장된 guest_folder_id가 살아있으면 그대로, 삭제됐으면 재생성 (folder_id 기준 접근) */
export async function ensureGuestFolder(
  accessToken: string,
  storage: { root_folder_id: string | null; guest_folder_id: string | null },
  groomName: string | null,
  brideName: string | null,
): Promise<{ rootFolderId: string; guestFolderId: string }> {
  if (storage.guest_folder_id && (await folderExists(accessToken, storage.guest_folder_id))) {
    return { rootFolderId: storage.root_folder_id || storage.guest_folder_id, guestFolderId: storage.guest_folder_id }
  }
  // 커플 폴더가 살아있으면 그 아래 하객 폴더만 재생성
  if (storage.root_folder_id && (await folderExists(accessToken, storage.root_folder_id))) {
    const guest = await createFolder(accessToken, '하객 사진', storage.root_folder_id)
    return { rootFolderId: storage.root_folder_id, guestFolderId: guest }
  }
  // 전부 없으면 트리 재생성
  return ensureRootFolders(accessToken, groomName, brideName)
}

/** 하객별 하위 폴더 생성 → folderId 반환 */
export async function createGuestSubfolder(accessToken: string, guestFolderId: string, folderName: string): Promise<string> {
  return createFolder(accessToken, folderName, guestFolderId)
}

/**
 * resumable 업로드 세션 개시 → session URI(Location) 반환.
 * 클라이언트가 이 URI로 파일 바이트를 직접 PUT (Worker는 바이트 미경유).
 */
export async function createResumableSession(
  accessToken: string,
  meta: { name: string; mimeType: string; parents: string[] },
): Promise<string> {
  const res = await fetch(`${DRIVE_UPLOAD}/files?uploadType=resumable&fields=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': meta.mimeType,
    },
    body: JSON.stringify({ name: meta.name, parents: meta.parents }),
  })
  if (!res.ok) throw new Error(`resumable 세션 개시 실패: ${res.status} ${await res.text()}`)
  const loc = res.headers.get('location')
  if (!loc) throw new Error('resumable session URI(Location 헤더)가 응답에 없습니다.')
  return loc
}
