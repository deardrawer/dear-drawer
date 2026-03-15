/**
 * Web Push implementation using Web Crypto API (Cloudflare Workers compatible)
 * - VAPID JWT signing (ECDSA P-256)
 * - RFC 8291 payload encryption (ECDH + AES-128-GCM)
 */

interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

interface PushPayload {
  title: string
  body: string
  url?: string
}

// Helper: Uint8Array → ArrayBuffer (for strict TS)
function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer
}

// ── Base64URL helpers ──

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function concatBuffers(...buffers: (Uint8Array | ArrayBuffer)[]): Uint8Array {
  const arrays = buffers.map(b => b instanceof Uint8Array ? b : new Uint8Array(b))
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

// ── VAPID JWT ──

async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject,
  })))

  const privateKeyBytes = base64UrlDecode(privateKeyBase64)
  const key = await crypto.subtle.importKey(
    'pkcs8',
    toBuffer(privateKeyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const data = new TextEncoder().encode(`${header}.${payload}`)
  const signatureDer = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data)

  // Convert DER signature to raw (r || s, 32 bytes each)
  const signature = derToRaw(new Uint8Array(signatureDer))
  return `${header}.${payload}.${base64UrlEncode(signature)}`
}

function derToRaw(der: Uint8Array): Uint8Array {
  // DER format: 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
  const raw = new Uint8Array(64)
  let offset = 2 // skip 0x30 and total length

  // Parse r
  offset++ // skip 0x02
  let rLen = der[offset++]
  let rStart = offset
  if (rLen === 33 && der[rStart] === 0) { rStart++; rLen = 32 }
  raw.set(der.slice(rStart, rStart + 32), 32 - Math.min(rLen, 32))
  offset = rStart + (rLen === 33 ? 32 : rLen)

  // Parse s
  offset++ // skip 0x02
  let sLen = der[offset++]
  let sStart = offset
  if (sLen === 33 && der[sStart] === 0) { sStart++; sLen = 32 }
  raw.set(der.slice(sStart, sStart + 32), 64 - Math.min(sLen, 32))

  return raw
}

// ── RFC 8291 Encryption ──

async function encryptPayload(
  payload: Uint8Array,
  clientPublicKeyBytes: Uint8Array,
  clientAuthBytes: Uint8Array
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  // Generate server ECDH key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
  )

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    toBuffer(clientPublicKeyBytes),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: clientPublicKey },
      serverKeyPair.privateKey,
      256
    )
  )

  // Generate salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // HKDF to derive keys
  const authInfo = concatBuffers(
    new TextEncoder().encode('WebPush: info\0'),
    clientPublicKeyBytes,
    serverPublicKeyRaw
  )

  // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info" || 0x00 || client_pub || server_pub, 32)
  const ikmKey = await crypto.subtle.importKey('raw', toBuffer(clientAuthBytes), { name: 'HKDF' }, false, ['deriveBits'])
  const prkBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toBuffer(sharedSecret), info: toBuffer(authInfo) },
    ikmKey,
    256
  )

  // CEK = HKDF(salt, IKM, "Content-Encoding: aes128gcm" || 0x00, 16)
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0')
  const prkKey = await crypto.subtle.importKey('raw', prkBits, { name: 'HKDF' }, false, ['deriveBits'])
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toBuffer(salt), info: toBuffer(cekInfo) },
    prkKey,
    128
  )

  // Nonce = HKDF(salt, IKM, "Content-Encoding: nonce" || 0x00, 12)
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0')
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toBuffer(salt), info: toBuffer(nonceInfo) },
    prkKey,
    96
  )

  // Encrypt with AES-128-GCM
  const cek = await crypto.subtle.importKey('raw', cekBits, { name: 'AES-GCM' }, false, ['encrypt'])
  // Pad payload: add delimiter byte 0x02 (final record)
  const paddedPayload = concatBuffers(payload, new Uint8Array([2]))
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonceBits, tagLength: 128 },
      cek,
      toBuffer(paddedPayload)
    )
  )

  // Build aes128gcm content coding header:
  // salt (16) || rs (4, big-endian uint32) || idlen (1) || keyid (65 = server public key)
  const rs = new Uint8Array(4)
  new DataView(rs.buffer as ArrayBuffer).setUint32(0, 4096, false)

  const header = concatBuffers(
    salt,
    rs,
    new Uint8Array([65]),
    serverPublicKeyRaw
  )

  const ciphertext = concatBuffers(header, encrypted)
  return { ciphertext, salt, serverPublicKey: serverPublicKeyRaw }
}

// ── Main Send Function ──

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; statusCode: number; expired?: boolean }> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload))
  const clientPublicKey = base64UrlDecode(subscription.p256dh)
  const clientAuth = base64UrlDecode(subscription.auth)

  const { ciphertext } = await encryptPayload(payloadBytes, clientPublicKey, clientAuth)

  // Build VAPID Authorization
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey)
  const vapidAuth = `vapid t=${jwt}, k=${vapidPublicKey}`

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': vapidAuth,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body: toBuffer(ciphertext),
  })

  const expired = response.status === 404 || response.status === 410
  return { success: response.status === 201, statusCode: response.status, expired }
}

// ── VAPID Key Generation (run once with Node.js) ──

export async function generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  )

  const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey))
  const privateKeyPkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey))

  return {
    publicKey: base64UrlEncode(publicKeyRaw),
    privateKey: base64UrlEncode(privateKeyPkcs8),
  }
}
