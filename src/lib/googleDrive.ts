import { decryptSecret, encryptSecret } from './cloudTokens'
import { refreshAccessToken } from './googleOAuth'
import { updateConnectionAccessToken, type CloudConnection } from './cloudStorage'

/**
 * Google Drive 헬퍼 (Next 앱 측). REST 프리미티브는 env-비의존 core에서 re-export,
 * 여기서는 DB/토큰 암복호화가 필요한 getValidAccessToken만 유지한다.
 * (Worker는 core를 직접 import — 이 파일은 import하지 않는다: cloudTokens/googleOAuth가 env 의존)
 */

export {
  getAccountEmail,
  folderExists,
  createFolder,
  ensureRootFolders,
  ensureGuestFolder,
  createGuestSubfolder,
  startResumableSession,
  getFileView,
} from './guest-drive-core/drive'
export type { DriveFileView } from './guest-drive-core/drive'

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
