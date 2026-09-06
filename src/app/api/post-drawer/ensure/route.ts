import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { ensurePostDrawer } from '@/lib/postDrawer'

/**
 * [오너] 내 청첩장의 POST DRAWER archive_slug 확보(없으면 lazy 생성).
 * 로그인 + invitation 소유 검증. URL을 안다고 권한 부여하지 않음.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { invitationId?: string }
    const invitationId = body.invitationId
    if (!invitationId) return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })

    const owned = await getOwnedInvitation(request, invitationId)
    if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    // POST DRAWER(내 서랍)는 결제완료 청첩장만 활성
    if (owned.invitation.is_paid !== 1) {
      return NextResponse.json({ error: '결제완료된 청첩장만 이용할 수 있습니다.' }, { status: 403 })
    }

    const row = await ensurePostDrawer(invitationId)
    return NextResponse.json({ archiveSlug: row.archive_slug })
  } catch (e) {
    console.error('post-drawer ensure error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'POST DRAWER 준비에 실패했습니다.' }, { status: 500 })
  }
}
