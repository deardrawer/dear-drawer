import { NextRequest, NextResponse } from 'next/server'
import { getInvitationById } from '@/lib/db'
import { verifyToken, getAuthCookieName } from '@/lib/auth'
import { verifyOAuthState, exchangeCodeForTokens, GOOGLE_DRIVE_SCOPE } from '@/lib/googleOAuth'
import { encryptSecret } from '@/lib/cloudTokens'
import { saveCloudConnection, saveProjectStorage, getProjectStorage } from '@/lib/cloudStorage'
import { getAccountEmail, ensureRootFolders, ensureGuestFolder } from '@/lib/googleDrive'

/**
 * Google OAuth 콜백. state 서명 + nonce 쿠키(CSRF) + 로그인 사용자/소유권 재검증 후
 * 토큰 암호화 저장 + Drive 폴더 준비 + project_cloud_storage 매핑.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const redirectTo = (ok: boolean, msg: string, invId?: string) => {
    const u = new URL(invId ? `/dashboard/${invId}` : '/my-invitations', url)
    u.searchParams.set(ok ? 'drive' : 'drive_error', ok ? 'connected' : msg)
    return NextResponse.redirect(u)
  }

  try {
    if (url.searchParams.get('error')) return redirectTo(false, 'google_denied')
    const code = url.searchParams.get('code')
    const stateRaw = url.searchParams.get('state')
    if (!code || !stateRaw) return redirectTo(false, 'missing_params')

    const state = await verifyOAuthState(stateRaw)
    if (!state) return redirectTo(false, 'invalid_state')

    // CSRF: nonce 쿠키 double-submit
    const nonceCookie = request.cookies.get('g_oauth_nonce')?.value
    if (!nonceCookie || nonceCookie !== state.nonce) return redirectTo(false, 'csrf')

    // 현재 로그인 사용자 재확인 + state.userId 일치
    const token = request.cookies.get(getAuthCookieName())?.value
    const payload = token ? await verifyToken(token) : null
    const currentUserId = (payload as { user?: { id?: string } } | null)?.user?.id
    if (!currentUserId || currentUserId !== state.userId) return redirectTo(false, 'auth_mismatch')

    // 초대장 소유권 서버 재검증
    const invitation = await getInvitationById(state.invitationId)
    if (!invitation || invitation.user_id !== currentUserId) return redirectTo(false, 'not_owner', state.invitationId)

    // 토큰 교환 + 암호화 (access/refresh 각각 독립 IV)
    const tok = await exchangeCodeForTokens(code)
    const accessEnc = await encryptSecret(tok.access_token)
    const refreshEnc = tok.refresh_token ? await encryptSecret(tok.refresh_token) : null
    const expiresAt = new Date(Date.now() + (tok.expires_in - 30) * 1000).toISOString()
    const email = await getAccountEmail(tok.access_token)

    const conn = await saveCloudConnection({
      userId: currentUserId,
      provider: 'google',
      accountEmail: email,
      accessTokenEnc: accessEnc.enc,
      accessTokenIv: accessEnc.iv,
      refreshTokenEnc: refreshEnc?.enc ?? null,
      refreshTokenIv: refreshEnc?.iv ?? null,
      scope: tok.scope || GOOGLE_DRIVE_SCOPE,
      expiresAt,
    })

    // 폴더 준비: 기존 매핑 있으면 folder_id 기준 접근/재생성, 없으면 트리 신규 생성
    const existing = await getProjectStorage(state.invitationId)
    const folders = existing
      ? await ensureGuestFolder(tok.access_token, existing, invitation.groom_name, invitation.bride_name)
      : await ensureRootFolders(tok.access_token, invitation.groom_name, invitation.bride_name)

    await saveProjectStorage({
      invitationId: state.invitationId,
      connectionId: conn.id,
      rootFolderId: folders.rootFolderId,
      guestFolderId: folders.guestFolderId,
    })

    const res = redirectTo(true, 'connected', state.invitationId)
    res.cookies.delete('g_oauth_nonce')
    return res
  } catch (e) {
    console.error('Google Drive callback error:', e)
    return redirectTo(false, 'server_error')
  }
}
