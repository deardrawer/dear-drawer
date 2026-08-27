import { SignJWT, jwtVerify } from 'jose'
import { getServerEnv } from './serverEnv'

/**
 * Google OAuth (오너=신랑신부 전용). 최소 권한 scope, offline access, 서명된 state로 CSRF 방어.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

// 최소 권한: 앱이 생성/선택한 파일만 접근. 전체 drive 권한 사용하지 않음.
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

async function stateSecret(): Promise<Uint8Array> {
  const s = await getServerEnv('JWT_SECRET')
  if (!s) throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.')
  return new TextEncoder().encode(s)
}

export interface OAuthStatePayload {
  userId: string
  invitationId: string
  nonce: string
}

/** state = 서명(JWT, 10분 만료) — userId+invitationId+nonce 포함 */
export async function signOAuthState(p: OAuthStatePayload): Promise<string> {
  return new SignJWT({ userId: p.userId, invitationId: p.invitationId, nonce: p.nonce })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(await stateSecret())
}

export async function verifyOAuthState(token: string): Promise<OAuthStatePayload | null> {
  try {
    const { payload } = await jwtVerify(token, await stateSecret())
    if (!payload.userId || !payload.invitationId || !payload.nonce) return null
    return { userId: String(payload.userId), invitationId: String(payload.invitationId), nonce: String(payload.nonce) }
  } catch {
    return null
  }
}

export async function getGoogleConfig() {
  const clientId = await getServerEnv('GOOGLE_CLIENT_ID')
  const clientSecret = await getServerEnv('GOOGLE_CLIENT_SECRET')
  const redirectUri = await getServerEnv('GOOGLE_REDIRECT_URI')
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI 환경변수가 필요합니다.')
  }
  return { clientId, clientSecret, redirectUri }
}

export async function buildGoogleAuthUrl(state: string): Promise<string> {
  const { clientId, redirectUri } = await getGoogleConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_DRIVE_SCOPE,
    access_type: 'offline', // refresh_token 발급
    prompt: 'consent', // 최초/재연결 시 refresh_token 확실히 재발급
    include_granted_scopes: 'true',
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  token_type: string
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = await getGoogleConfig()
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }).toString(),
  })
  if (!res.ok) throw new Error(`Google 토큰 교환 실패: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = await getGoogleConfig()
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })
  if (!res.ok) throw new Error(`Google 토큰 갱신 실패: ${res.status} ${await res.text()}`)
  return res.json()
}
