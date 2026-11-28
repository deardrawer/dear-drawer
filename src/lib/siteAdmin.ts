import type { NextRequest } from 'next/server'

/**
 * 사이트 관리자 API 인증 — x-admin-password 헤더 == ADMIN_PASSWORD.
 * (Cloudflare 에서는 요청 핸들러 안에서 env 를 읽어야 하므로 호출 시점에 읽음)
 */
export function verifySiteAdmin(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false
  const given = request.headers.get('x-admin-password') || ''
  // 길이 · 내용 비교를 한 글자씩 끝까지 (응답 시간으로 비밀번호를 짐작하지 못하게)
  let diff = given.length ^ adminPassword.length
  for (let i = 0; i < adminPassword.length; i++) diff |= adminPassword.charCodeAt(i) ^ (given.charCodeAt(i) || 0)
  return diff === 0
}
