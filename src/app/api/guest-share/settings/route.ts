import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { updateGuestShareSettings } from '@/lib/cloudStorage'

/**
 * [오너] 하객 사진 공유 설정 변경 (enabled / title / description).
 * 로그인 + 초대장 소유 검증. 전달된 필드만 부분 업데이트.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      invitationId?: string
      enabled?: boolean
      title?: string | null
      description?: string | null
    }
    const invitationId = body.invitationId
    if (!invitationId) return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })

    const owned = await getOwnedInvitation(request, invitationId)
    if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    await updateGuestShareSettings(invitationId, {
      enabled: body.enabled,
      title: body.title === undefined ? undefined : (body.title || null),
      description: body.description === undefined ? undefined : (body.description || null),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('guest-share settings error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '설정 저장에 실패했습니다.' }, { status: 500 })
  }
}
