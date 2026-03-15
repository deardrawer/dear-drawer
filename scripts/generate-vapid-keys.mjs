/**
 * VAPID Key Generator for Web Push
 * Run: node scripts/generate-vapid-keys.mjs
 *
 * Output the keys and set them as environment variables:
 * - VAPID_PUBLIC_KEY (Cloudflare Pages env)
 * - VAPID_PRIVATE_KEY (Cloudflare Pages env, secret)
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY (same as VAPID_PUBLIC_KEY, for client)
 * - VAPID_SUBJECT (e.g., "mailto:hello@deardrawer.com")
 */

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateVapidKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  )

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  const publicKey = base64UrlEncode(publicKeyRaw)
  const privateKey = base64UrlEncode(privateKeyPkcs8)

  console.log('\n=== VAPID Keys Generated ===\n')
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`)
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
  console.log(`VAPID_SUBJECT=mailto:hello@deardrawer.com`)
  console.log('\n=== Set these in Cloudflare Pages Environment Variables ===\n')
}

generateVapidKeys().catch(console.error)
