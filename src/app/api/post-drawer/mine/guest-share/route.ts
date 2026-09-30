import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/ownerAuth'
import { ensureCoupleGuestShareSlug, getCoupleGuestShareByUser, setCoupleGuestShare, getPrimaryPaidInvitation } from '@/lib/postDrawer'
import { getCloudConnectionByUser } from '@/lib/cloudStorage'

/**
 * [owner 전용] 커플(서랍) 단위 하객 사진 공유 설정.
 * - 서랍당 링크 하나(/photo/[slug]). 켜기/제목/문구는 커플 단위(drawer_profiles).
 * - Drive 연결은 계정 공용(cloud_connections). 업로드는 대표 청첩장 폴더로.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureCoupleGuestShareSlug(user.id)
    const share = await getCoupleGuestShareByUser(user.id)
    const primary = await getPrimaryPaidInvitation(user.id)
    const conn = await getCloudConnectionByUser(user.id)
    return NextResponse.json({
      slug: share?.slug ?? null,
      enabled: share?.enabled ?? false,
      title: share?.title ?? null,
      description: share?.description ?? null,
      connected: !!conn,
      accountEmail: conn?.account_email ?? null,
      primaryInvitationId: primary?.id ?? null,
    })
  } catch (e) {
    console.error('couple guest-share GET error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = (await request.json()) as { enabled?: boolean; title?: string | null; description?: string | null }
    await setCoupleGuestShare(user.id, body)
    const share = await getCoupleGuestShareByUser(user.id)
    return NextResponse.json({ ok: true, enabled: share?.enabled ?? false, title: share?.title ?? null, description: share?.description ?? null })
  } catch (e) {
    console.error('couple guest-share POST error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '저장 실패' }, { status: 500 })
  }
}
