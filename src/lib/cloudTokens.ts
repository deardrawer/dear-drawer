import { getServerEnv } from './serverEnv'
import { encryptSecretWithKey, decryptSecretWithKey } from './guest-drive-core/crypto'

/**
 * OAuth 토큰 암/복호화 (AES-GCM). 실제 로직은 env-비의존 core(guest-drive-core/crypto)에 있고,
 * 여기서는 TOKEN_ENCRYPTION_KEY(Cloudflare secret)를 주입하는 thin wrapper만 유지한다.
 * (public 시그니처 불변 → 기존 호출부 수정 없음. Worker는 core를 직접 사용.)
 */

async function keyB64(): Promise<string> {
  const b64 = await getServerEnv('TOKEN_ENCRYPTION_KEY')
  if (!b64) throw new Error('TOKEN_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.')
  return b64
}

export async function encryptSecret(plaintext: string): Promise<{ enc: string; iv: string }> {
  return encryptSecretWithKey(plaintext, await keyB64())
}

export async function decryptSecret(enc: string, iv: string): Promise<string> {
  return decryptSecretWithKey(enc, iv, await keyB64())
}
