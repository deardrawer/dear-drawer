import { getServerEnv } from './serverEnv'

/**
 * OAuth 토큰 암/복호화 (AES-GCM, WebCrypto).
 * - 키는 TOKEN_ENCRYPTION_KEY(Cloudflare secret, base64 32바이트)에서만 로드 → D1에 저장 금지.
 * - 각 암호화 호출마다 새 12바이트 IV 생성 → 동일 key+IV 재사용 방지 (access/refresh 각각 독립 IV).
 * - AES-GCM auth tag는 WebCrypto가 ciphertext 뒤에 포함하므로 별도 컬럼 불필요.
 */

async function getKey(): Promise<CryptoKey> {
  const b64 = await getServerEnv('TOKEN_ENCRYPTION_KEY')
  if (!b64) throw new Error('TOKEN_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.')
  const raw = b64ToBytes(b64)
  if (raw.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY는 base64 인코딩된 32바이트여야 합니다.')
  return crypto.subtle.importKey('raw', raw as unknown as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function bytesToB64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}
function b64ToBytes(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function encryptSecret(plaintext: string): Promise<{ enc: string; iv: string }> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    new TextEncoder().encode(plaintext) as unknown as BufferSource,
  )
  return { enc: bytesToB64(new Uint8Array(ct)), iv: bytesToB64(iv) }
}

export async function decryptSecret(enc: string, iv: string): Promise<string> {
  const key = await getKey()
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(iv) as unknown as BufferSource },
    key,
    b64ToBytes(enc) as unknown as BufferSource,
  )
  return new TextDecoder().decode(pt)
}
