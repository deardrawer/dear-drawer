import { NextRequest, NextResponse } from 'next/server'
import { resolveRsvpAccess } from '@/lib/rsvpAccess'
import { getRsvpResponses } from '@/lib/rsvpShare'

/** [owner 또는 공유] 통합 RSVP 응답 목록(필터·검색·정렬·페이지네이션). */
export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams
    const access = await resolveRsvpAccess(request, sp.get('share'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const result = await getRsvpResponses(access.userId, {
      invitationId: sp.get('invitation') || undefined,
      status: sp.get('status') || undefined,
      side: sp.get('side') || undefined,
      q: sp.get('q') || undefined,
      sort: sp.get('sort') || undefined,
      page: parseInt(sp.get('page') || '1', 10) || 1,
      pageSize: parseInt(sp.get('pageSize') || '30', 10) || 30,
    })
    return NextResponse.json(result)
  } catch (e) {
    console.error('rsvp responses error:', e)
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  }
}
