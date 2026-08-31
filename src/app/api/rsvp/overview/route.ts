import { NextRequest, NextResponse } from 'next/server'
import { resolveRsvpAccess } from '@/lib/rsvpAccess'
import { getRsvpOverview } from '@/lib/rsvpShare'

/** [owner 또는 공유] 내(또는 공유 소유자) 모든 청첩장 RSVP 요약 + 전체 합계. */
export async function GET(request: NextRequest) {
  try {
    const shareSlug = new URL(request.url).searchParams.get('share')
    const access = await resolveRsvpAccess(request, shareSlug)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const overview = await getRsvpOverview(access.userId)
    return NextResponse.json({ ...overview, mode: access.mode })
  } catch (e) {
    console.error('rsvp overview error:', e)
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  }
}
