import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { getProjectStorage, getCloudConnectionById } from '@/lib/cloudStorage'
import { getValidAccessToken, createResumableSession } from '@/lib/googleDrive'

/**
 * [Phase 2 SPIKE 전용] 오너 인증 하에 테스트 파일용 resumable 세션 URI를 1개 발급한다.
 * 브라우저가 이 URI로 직접 PUT 하여 CORS/progress를 검증하기 위한 최소 엔드포인트.
 * (본구현의 /api/guest-share/session 로 대체될 예정)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { invitationId?: string; fileName?: string; mimeType?: string }
    const invitationId = body.invitationId
    if (!invitationId) return NextResponse.json({ error: 'invitationId 필요' }, { status: 400 })

    const owned = await getOwnedInvitation(request, invitationId)
    if (!owned) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const storage = await getProjectStorage(invitationId)
    if (!storage?.guest_folder_id) return NextResponse.json({ error: 'Drive 미연결 (먼저 연결하세요)' }, { status: 409 })
    const conn = await getCloudConnectionById(storage.connection_id)
    if (!conn) return NextResponse.json({ error: '연결 정보 없음' }, { status: 409 })

    const accessToken = await getValidAccessToken(conn)
    const sessionUri = await createResumableSession(accessToken, {
      name: body.fileName || `spike_test_${Date.now()}`,
      mimeType: body.mimeType || 'application/octet-stream',
      parents: [storage.guest_folder_id],
    })

    return NextResponse.json({ sessionUri })
  } catch (e) {
    console.error('Drive spike error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'spike 실패' }, { status: 500 })
  }
}
