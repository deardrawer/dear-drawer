import type { NextRequest } from 'next/server'
import { verifyToken, getAuthCookieName } from './auth'
import { getInvitationById } from './db'
import type { Invitation } from '@/types/invitation'

export interface AuthedUser {
  id: string
}

/** 쿠키 JWT에서 현재 로그인 사용자 추출 */
export async function getCurrentUser(request: NextRequest): Promise<AuthedUser | null> {
  const token = request.cookies.get(getAuthCookieName())?.value
  if (!token) return null
  const payload = await verifyToken(token)
  const user = (payload as { user?: { id?: string } } | null)?.user
  if (!user?.id) return null
  return { id: user.id }
}

/** 로그인 + 초대장 소유 검증. 통과 시 {user, invitation}, 아니면 null */
export async function getOwnedInvitation(
  request: NextRequest,
  invitationId: string,
): Promise<{ user: AuthedUser; invitation: Invitation } | null> {
  const user = await getCurrentUser(request)
  if (!user) return null
  const invitation = await getInvitationById(invitationId)
  if (!invitation || invitation.user_id !== user.id) return null
  return { user, invitation }
}
