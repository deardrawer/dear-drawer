/**
 * env-비의존 Google OAuth 토큰 갱신 (Next 앱 + Worker 공유).
 * client_id/secret은 파라미터로 받는다. refresh는 redirect_uri 불필요.
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope?: string
  token_type: string
}

export async function refreshAccessTokenWith(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<GoogleTokenResponse> {
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
  if (!res.ok) {
    // 응답 본문에 token성 값이 없지만, 방어적으로 status만 노출
    throw new Error(`Google 토큰 갱신 실패: ${res.status}`)
  }
  return res.json()
}
