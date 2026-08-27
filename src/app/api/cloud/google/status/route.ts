import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { getProjectStorage, getCloudConnectionById } from '@/lib/cloudStorage'

/** 오너용: 이 청첩장의 Google Drive 연결 상태 조회 */
export async function GET(request: NextRequest) {
  const invitationId = new URL(request.url).searchParams.get('invitationId')
  if (!invitationId) return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })

  const owned = await getOwnedInvitation(request, invitationId)
  if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const storage = await getProjectStorage(invitationId)
  const conn = storage ? await getCloudConnectionById(storage.connection_id) : null

  return NextResponse.json({
    connected: !!storage && !!conn,
    accountEmail: conn?.account_email ?? null,
    guestFolderReady: !!storage?.guest_folder_id,
    guestShareEnabled: (owned.invitation.guest_share_enabled ?? 0) === 1,
    guestShareTitle: owned.invitation.guest_share_title ?? null,
    guestShareDescription: owned.invitation.guest_share_description ?? null,
  })
}
