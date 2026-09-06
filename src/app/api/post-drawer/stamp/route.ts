import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { getDB } from '@/lib/db'
import { ensurePostDrawer, getPostDrawerByInvitationId, STAMP_MESSAGE_MAX } from '@/lib/postDrawer'

/**
 * [오너] 우표 '결혼식 한 조각'(post_drawers.stamp_message) 조회/저장.
 * - 선택 입력: 비우면 stamp_message = NULL (우표는 그대로 생성됨).
 * - invitation.content는 건드리지 않는다 — post_drawers 행만 갱신(구조 변경 없음, P2 재사용).
 */

// GET ?invitationId= → { stampMessage }
export async function GET(request: NextRequest) {
  try {
    const invitationId = new URL(request.url).searchParams.get('invitationId')
    if (!invitationId) return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })

    const owned = await getOwnedInvitation(request, invitationId)
    if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const row = await getPostDrawerByInvitationId(invitationId)
    return NextResponse.json({ stampMessage: row?.stamp_message ?? null, max: STAMP_MESSAGE_MAX })
  } catch (e) {
    console.error('stamp get error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '조회에 실패했습니다.' }, { status: 500 })
  }
}

// PATCH { invitationId, stampMessage } → { stampMessage }
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { invitationId?: string; stampMessage?: string | null }
    const invitationId = body.invitationId
    if (!invitationId) return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })

    const owned = await getOwnedInvitation(request, invitationId)
    if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    const trimmed = (body.stampMessage ?? '').toString().trim()
    if (trimmed.length > STAMP_MESSAGE_MAX) {
      return NextResponse.json({ error: `한 조각은 ${STAMP_MESSAGE_MAX}자까지 입력할 수 있습니다.` }, { status: 400 })
    }
    const finalMsg = trimmed.length ? trimmed : null

    await ensurePostDrawer(invitationId) // 행(+archive_slug) 확보
    const db = await getDB()
    await db
      .prepare('UPDATE post_drawers SET stamp_message = ?, updated_at = ? WHERE invitation_id = ?')
      .bind(finalMsg, new Date().toISOString(), invitationId)
      .run()

    return NextResponse.json({ stampMessage: finalMsg })
  } catch (e) {
    console.error('stamp patch error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '저장에 실패했습니다.' }, { status: 500 })
  }
}
