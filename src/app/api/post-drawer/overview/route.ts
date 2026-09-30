import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/ownerAuth'
import { getUserDrawerOverview } from '@/lib/postDrawer'

/**
 * [owner 전용] 통합 내 서랍 — 로그인 유저의 모든 결제완료 청첩장을 하나로 집계.
 * 청첩장별 시크릿 링크/비번 상태 + 받은 마음(방명록·RSVP·근날) 통합 목록.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const overview = await getUserDrawerOverview(user.id)
    return NextResponse.json(overview)
  } catch (e) {
    console.error('post-drawer overview error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '조회에 실패했습니다.' }, { status: 500 })
  }
}
