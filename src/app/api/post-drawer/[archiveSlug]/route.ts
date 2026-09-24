import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { getPostDrawerByArchiveSlug, getPostDrawerByInvitationId, getPostDrawerData, ensureShareSlug, stampHiddenOf, isPostDrawerLockedByExpiry } from '@/lib/postDrawer'

/**
 * [비공개] 개인 POST DRAWER 데이터 (방명록 + photo_share 비공개 메시지 + 파일 카운트).
 * P2: 로그인 owner만 허용. (P3에서 sharing_enabled=true + 공유 비밀번호 인증 분기를 추가한다.)
 * URL(archive_slug)을 안다는 이유만으로 권한을 주지 않는다 — 반드시 서버에서 owner 검증.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ archiveSlug: string }> }) {
  try {
    const { archiveSlug } = await params
    const row = await getPostDrawerByArchiveSlug(archiveSlug)
    if (!row) return NextResponse.json({ error: 'POST DRAWER를 찾을 수 없습니다.' }, { status: 404 })

    // A. 로그인 owner. (B. 공유 인증은 P3에서 추가)
    const owned = await getOwnedInvitation(request, row.invitation_id)
    if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

    // 관리자가 우표를 숨긴 청첩장은 서랍도 열리지 않는다(소유자 본인 포함). 데이터는 보존.
    if (stampHiddenOf(owned.invitation.content)) {
      return NextResponse.json({ hidden: true }, { status: 403 })
    }

    // 장기보관 미신청 + 예식+30일 경과 → 자동 잠금(안내). 데이터는 보존, admin이 장기보관 on 하면 재개방.
    if (isPostDrawerLockedByExpiry(owned.invitation.content, owned.invitation.wedding_date)) {
      return NextResponse.json({ expired: true, weddingDate: owned.invitation.wedding_date ?? null })
    }

    // 내 서랍은 결제완료(is_paid) 시 바로 열린다 — 예식 전이어도 접근 가능
    //  (하객 메시지·사진이 쌓이는 걸 미리 보고, Drive 연결 등 준비를 할 수 있도록).
    //  기존 "예식 다음날부터 활성" 게이트 제거.

    // 비밀 청첩장 링크는 활성 시 항상 존재(없으면 생성) → 최신 row로 반환
    await ensureShareSlug(owned.invitation.id)
    const freshRow = (await getPostDrawerByInvitationId(owned.invitation.id)) || row
    const data = await getPostDrawerData(owned.invitation, freshRow)
    return NextResponse.json({ data })
  } catch (e) {
    console.error('post-drawer get error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'POST DRAWER 조회에 실패했습니다.' }, { status: 500 })
  }
}
