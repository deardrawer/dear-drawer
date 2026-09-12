import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { setDrawerLabel } from '@/lib/postDrawer'

/**
 * [오너] 내 서랍 목록용 청첩장 별칭 저장. content.meta.drawerLabel(최대 40자, 빈 값=해제).
 * 로그인 + 본인 청첩장 검증.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { invitationId?: string; label?: string }
    const invitationId = (body.invitationId || '').toString()
    if (!invitationId) return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })

    const owned = await getOwnedInvitation(request, invitationId)
    if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const label = await setDrawerLabel(invitationId, body.label ?? null)
    return NextResponse.json({ ok: true, label })
  } catch (e) {
    console.error('drawer label error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '저장에 실패했습니다.' }, { status: 500 })
  }
}
