import { cookies } from 'next/headers'

/**
 * 사이트 관리자(/admin) 열람용 쿠키.
 *  - /api/admin/login 성공 시 httpOnly 쿠키를 심는다.
 *  - 게스트 청첩장 서버 컴포넌트가 이 쿠키를 읽어, 공개 종료된 청첩장이라도
 *    사이트 관리자에게는 그대로 노출(우회)한다.
 *  - 쿠키 값에는 비밀번호 원문을 넣지 않고 SHA-256 해시 토큰만 저장한다.
 */
export const ADMIN_COOKIE = 'dd_admin'

// ADMIN_PASSWORD로부터 유추 불가능한 쿠키 토큰(SHA-256) 생성. 비밀번호 미설정 시 null.
export async function adminCookieToken(): Promise<string | null> {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  const data = new TextEncoder().encode(`dear-drawer-admin:${pw}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// 서버 컴포넌트에서 현재 뷰어가 사이트 관리자인지 확인(쿠키 기반).
export async function isAdminViewer(): Promise<boolean> {
  try {
    const token = await adminCookieToken()
    if (!token) return false
    const store = await cookies()
    return store.get(ADMIN_COOKIE)?.value === token
  } catch {
    return false
  }
}
