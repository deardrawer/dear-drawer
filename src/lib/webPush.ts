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
  tag?: string
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

// raw 32-byte EC key → PKCS8 DER wrapper
function wrapRawKeyInPkcs8(rawKey: Uint8Array): Uint8Array {
  const pkcs8Header = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06,
    0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01,
    0x01, 0x04, 0x20,
  ])
  return concatBuffers(pkcs8Header, rawKey)
}

async function importVapidPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const cleaned = privateKeyBase64.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '')
  const privateKeyBytes = base64UrlDecode(cleaned)
  const algo = { name: 'ECDSA', namedCurve: 'P-256' }

  // 32 bytes = raw key, wrap in PKCS8
  if (privateKeyBytes.length === 32) {
    const pkcs8 = wrapRawKeyInPkcs8(privateKeyBytes)
    return crypto.subtle.importKey('pkcs8', toBuffer(pkcs8), algo, false, ['sign'])
  }

  // Try PKCS8 directly
  try {
    return await crypto.subtle.importKey('pkcs8', toBuffer(privateKeyBytes), algo, false, ['sign'])
  } catch {
    // Fallback: extract raw 32-byte d value from the PKCS8/DER structure and re-wrap
    const dOffset = findRawKeyInDer(privateKeyBytes)
    if (dOffset >= 0) {
      const rawKey = privateKeyBytes.slice(dOffset, dOffset + 32)
      const pkcs8 = wrapRawKeyInPkcs8(rawKey)
      return crypto.subtle.importKey('pkcs8', toBuffer(pkcs8), algo, false, ['sign'])
    }
    throw new Error(`VAPID key import failed (length=${privateKeyBytes.length})`)
  }
}

function findRawKeyInDer(der: Uint8Array): number {
  // Look for 04 20 (OCTET STRING, 32 bytes) which holds the d value
  for (let i = 0; i < der.length - 33; i++) {
    if (der[i] === 0x04 && der[i + 1] === 0x20) {
      return i + 2
    }
  }
  return -1
}

async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject,
  })))

  const key = await importVapidPrivateKey(privateKeyBase64)

  const data = new TextEncoder().encode(`${header}.${payload}`)
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data)
  )

  // Web Crypto spec returns raw (r||s, 64 bytes), but some runtimes return DER
  let signature: Uint8Array
  if (signatureBytes.length === 64) {
    signature = signatureBytes
  } else if (signatureBytes[0] === 0x30) {
    signature = derToRaw(signatureBytes)
  } else {
    throw new Error(`Unexpected ECDSA signature format: length=${signatureBytes.length}, first_byte=0x${signatureBytes[0]?.toString(16)}`)
  }

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
): Promise<{ success: boolean; statusCode: number; expired?: boolean; responseBody?: string; debug?: Record<string, unknown> }> {
  const debug: Record<string, unknown> = {}

  try {
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload))
    const clientPublicKey = base64UrlDecode(subscription.p256dh)
    const clientAuth = base64UrlDecode(subscription.auth)
    debug.payloadLen = payloadBytes.length
    debug.clientPubKeyLen = clientPublicKey.length
    debug.clientAuthLen = clientAuth.length

    const { ciphertext, salt, serverPublicKey } = await encryptPayload(payloadBytes, clientPublicKey, clientAuth)
    debug.ciphertextLen = ciphertext.length
    debug.saltLen = salt.length
    debug.serverPubKeyLen = serverPublicKey.length

    const url = new URL(subscription.endpoint)
    const audience = `${url.protocol}//${url.host}`
    debug.audience = audience

    const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey)
    debug.jwtLen = jwt.length

    // JWT header/payload 디코딩 (signature 제외)
    const jwtParts = jwt.split('.')
    try {
      const hdrRaw = atob(jwtParts[0].replace(/-/g, '+').replace(/_/g, '/'))
      const plRaw = atob(jwtParts[1].replace(/-/g, '+').replace(/_/g, '/'))
      debug.jwtHeader = JSON.parse(hdrRaw)
      debug.jwtPayload = JSON.parse(plRaw)
      debug.jwtSignatureLen = jwtParts[2]?.length ?? 0
    } catch { /* ignore decode errors */ }

    debug.vapidPublicKeyPrefix = vapidPublicKey.slice(0, 20)
    debug.vapidPublicKeyLen = vapidPublicKey.length

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
    let responseBody: string | undefined
    if (response.status !== 201) {
      try { responseBody = await response.text() } catch { /* ignore */ }
    }
    return { success: response.status === 201, statusCode: response.status, expired, responseBody, debug }
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err))
    return {
      success: false,
      statusCode: 0,
      responseBody: `${e.name}: ${e.message}\n${e.stack || ''}`,
      debug,
    }
  }
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
