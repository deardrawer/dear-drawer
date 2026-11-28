import type { NextRequest } from 'next/server'
import { getCurrentUser } from './ownerAuth'

/**
 * 사이트 관리자 인증.
 *  1) x-admin-password 헤더 == ADMIN_PASSWORD
 *  2) ADMIN_USER_ID(쉼표로 여러 개)가 설정돼 있으면 — 그 계정으로 로그인한 상태여야 함
 *     (설정 전에는 1만 확인 · 등록하는 동안 잠기지 않게)
 * Cloudflare 에서는 요청 핸들러 안에서 env 를 읽어야 하므로 호출 시점에 읽음.
 */

/** 관리자로 인정할 계정 번호 목록 — 비어 있으면 아직 계정 확인 안 함 */
export function adminUserIds(): string[] {
  return (process.env.ADMIN_USER_ID || '').split(',').map(s => s.trim()).filter(Boolean)
}

/** 비밀번호만 확인 (계정 번호 등록 화면용) */
export function verifyAdminPassword(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  const given = request.headers.get('x-admin-password') || ''
  // 길이 · 내용 비교를 한 글자씩 끝까지 (응답 시간으로 비밀번호를 짐작하지 못하게)
  let diff = given.length ^ adminPassword.length
  for (let i = 0; i < adminPassword.length; i++) diff |= adminPassword.charCodeAt(i) ^ (given.charCodeAt(i) || 0)
  return diff === 0
}

/** 등록된 관리자 계정으로 로그인했는지 (등록 전이면 통과) */
export async function isAdminAccount(request: NextRequest): Promise<boolean> {
  const ids = adminUserIds()
  if (!ids.length) return true
  const user = await getCurrentUser(request)
  return !!user && ids.includes(user.id)
}

export async function verifySiteAdmin(request: NextRequest): Promise<boolean> {
  return verifyAdminPassword(request) && (await isAdminAccount(request))
}

/** 서버 화면(관리자 페이지)용 — 쿠키로 관리자 계정인지 (등록 전이면 통과) */
export async function isAdminAccountViewer(): Promise<boolean> {
  const ids = adminUserIds()
  if (!ids.length) return true
  try {
    const { cookies } = await import('next/headers')
    const { verifyToken, getAuthCookieName } = await import('./auth')
    const token = (await cookies()).get(getAuthCookieName())?.value
    if (!token) return false
    const payload = await verifyToken(token)
    const id = (payload as { user?: { id?: string } } | null)?.user?.id
    return !!id && ids.includes(id)
  } catch {
    return false
  }
}
