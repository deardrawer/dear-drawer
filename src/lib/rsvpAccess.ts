import type { NextRequest } from 'next/server'
import { getCurrentUser } from './ownerAuth'
import { getRsvpShareBySlug, rsvpShareCookieToken } from './rsvpShare'

/**
 * RSVP 통합 데이터 접근 권한 해석.
 * - share 슬러그가 주어지면: 공유 링크(비번 있으면 쿠키 검증) → 공유 소유자 userId, mode='shared'
 * - 아니면: 로그인 owner → userId, mode='owner'
 */
export type RsvpAccess = { ok: true; userId: string; mode: 'owner' | 'shared' } | { ok: false; status: number; error: string }

export function rsvpShareCookieName(slug: string): string {
  return `rsvps_${slug}`
}

export async function resolveRsvpAccess(request: NextRequest, shareSlug?: string | null): Promise<RsvpAccess> {
  if (shareSlug) {
    const share = await getRsvpShareBySlug(shareSlug)
    if (!share || !share.share_slug) return { ok: false, status: 404, error: '공유를 찾을 수 없습니다.' }
    if (share.password_hash) {
      const cookie = request.cookies.get(rsvpShareCookieName(shareSlug))?.value
      const expected = await rsvpShareCookieToken(shareSlug, share.password_hash)
      if (cookie !== expected) return { ok: false, status: 401, error: 'password_required' }
    }
    return { ok: true, userId: share.user_id, mode: 'shared' }
  }
  const user = await getCurrentUser(request)
  if (!user) return { ok: false, status: 401, error: '로그인이 필요합니다.' }
  return { ok: true, userId: user.id, mode: 'owner' }
}
