import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { buildGoogleAuthUrl, signOAuthState } from '@/lib/googleOAuth'

/**
 * 오너가 Google Drive 연결 시작. 로그인 + 초대장 소유 검증 후 서명된 state로 Google 동의화면 리다이렉트.
 * CSRF 방어: nonce를 signed state와 httpOnly 쿠키 양쪽에 심어 콜백에서 double-submit 검증.
 */
export async function GET(request: NextRequest) {
  const invitationId = new URL(request.url).searchParams.get('invitationId')
  if (!invitationId) {
    return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })
  }
  const owned = await getOwnedInvitation(request, invitationId)
  if (!owned) {
    return NextResponse.json({ error: '로그인 후 본인 청첩장에서만 연결할 수 있습니다.' }, { status: 403 })
  }

  const nonce = crypto.randomUUID()
  const state = await signOAuthState({ userId: owned.user.id, invitationId, nonce })
  const authUrl = await buildGoogleAuthUrl(state)

  const res = NextResponse.redirect(authUrl)
  res.cookies.set('g_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
