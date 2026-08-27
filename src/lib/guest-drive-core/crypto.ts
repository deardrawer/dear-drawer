/**
 * env-비의존 순수 crypto (AES-GCM, WebCrypto).
 * Next 앱과 drive-transfer Worker가 공유. getServerEnv 등 런타임 의존성 없음 — 키는 파라미터로 받는다.
 * - 각 암호화 호출마다 새 12바이트 IV. AES-GCM auth tag는 ciphertext 뒤에 포함(별도 컬럼 불필요).
 */

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

export async function importAesKey(keyB64: string): Promise<CryptoKey> {
  if (!keyB64) throw new Error('TOKEN_ENCRYPTION_KEY가 비어있습니다.')
  const raw = b64ToBytes(keyB64)
  if (raw.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY는 base64 인코딩된 32바이트여야 합니다.')
  return crypto.subtle.importKey('raw', raw as unknown as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encryptSecretWithKey(plaintext: string, keyB64: string): Promise<{ enc: string; iv: string }> {
  const key = await importAesKey(keyB64)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    new TextEncoder().encode(plaintext) as unknown as BufferSource,
  )
  return { enc: bytesToB64(new Uint8Array(ct)), iv: bytesToB64(iv) }
}

export async function decryptSecretWithKey(enc: string, iv: string, keyB64: string): Promise<string> {
  const key = await importAesKey(keyB64)
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(iv) as unknown as BufferSource },
    key,
    b64ToBytes(enc) as unknown as BufferSource,
  )
  return new TextDecoder().decode(pt)
}
