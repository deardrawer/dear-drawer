import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { deleteProjectStorage } from '@/lib/cloudStorage'

/**
 * 오너용: 이 청첩장의 Drive 저장 매핑 해제.
 * cloud_connections(계정 토큰)는 다른 청첩장이 공유할 수 있어 유지한다 (MVP).
 */
export async function POST(request: NextRequest) {
  let invitationId = new URL(request.url).searchParams.get('invitationId') || undefined
  if (!invitationId) {
    try {
      const body = (await request.json()) as { invitationId?: string }
      invitationId = body.invitationId
    } catch {
      /* noop */
    }
  }
  if (!invitationId) return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })

  const owned = await getOwnedInvitation(request, invitationId)
  if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  await deleteProjectStorage(invitationId)
  return NextResponse.json({ ok: true })
}
