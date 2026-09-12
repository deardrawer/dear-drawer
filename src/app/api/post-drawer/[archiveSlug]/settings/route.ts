import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import {
  getPostDrawerByArchiveSlug,
  getPostDrawerByInvitationId,
  ensurePostDrawer,
  ensureShareSlug,
  updateShare,
  setInvitationPublicHidden,
  drawerStampPhotoOf,
  kakaoThumbnailOf,
  setDrawerStampPhoto,
  setStampMessage,
  STAMP_MESSAGE_MAX,
} from '@/lib/postDrawer'
import { isPostDrawerActiveKST, isWeddingArchivedKST } from '@/lib/weddingLifecycle'
import type { Invitation } from '@/types/invitation'

/**
 * [owner 전용] 내 서랍 > 설정.
 * - archive_slug(=owner 식별자)로 소유 검증. share_slug(공개용)는 여기서 절대 쓰지 않는다.
 * - Mode 1: /i/[slug] 공개 링크 수동 비공개 토글(Day 1~30)
 * - Mode 2: 결혼 후 비밀번호 청첩장(/s) 공유 on/off + 비밀번호 (Day 1부터)
 */

async function resolveOwned(request: NextRequest, archiveSlug: string): Promise<
  | { ok: true; invitation: Invitation }
  | { ok: false; status: number; error: string }
> {
  const row = await getPostDrawerByArchiveSlug(archiveSlug)
  if (!row) return { ok: false, status: 404, error: '서랍을 찾을 수 없습니다.' }
  const owned = await getOwnedInvitation(request, row.invitation_id)
  if (!owned) return { ok: false, status: 403, error: '권한이 없습니다.' }
  return { ok: true, invitation: owned.invitation }
}

async function stateOf(invitation: Invitation) {
  const active = isPostDrawerActiveKST(invitation.wedding_date)
  const archived = isWeddingArchivedKST(invitation.wedding_date)
  // 활성(Day 1+)이면 비밀 청첩장 링크는 항상 존재 — 없으면 생성
  if (active) {
    await ensurePostDrawer(invitation.id)
    await ensureShareSlug(invitation.id)
  }
  const row = await getPostDrawerByInvitationId(invitation.id)
  const content = (invitation as unknown as { content?: string | null }).content ?? null
  const customPhoto = drawerStampPhotoOf(content)
  const kakao = kakaoThumbnailOf(content)
  return {
    invitationId: invitation.id,
    weddingDate: invitation.wedding_date ?? null,
    active, // Day 1+
    archived, // Day 31+
    canTogglePublic: active && !archived, // Day 1~30
    publicHidden: (invitation as unknown as { public_hidden?: number }).public_hidden === 1,
    // 우표 사진(서랍 전용값 || 카카오 썸네일) + 결혼식 한 조각(한마디)
    stamp: {
      photo: customPhoto || kakao,
      hasCustomPhoto: !!customPhoto,
      kakaoThumbnail: kakao,
      message: row?.stamp_message ?? null,
      messageMax: STAMP_MESSAGE_MAX,
    },
    // 비밀 청첩장: 링크는 항상 활성, 비밀번호는 선택
    share: {
      hasPassword: !!row?.share_password_hash,
      shareSlug: row?.share_slug ?? null,
    },
  }
}

/** 우표 사진 URL은 우리 업로드 결과(R2/uploads)만 허용 — 외부 임의 URL 차단. */
function isAllowedStampUrl(url: string): boolean {
  return /^\/api\/r2\//.test(url) || /^\/uploads\//.test(url)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ archiveSlug: string }> }) {
  try {
    const { archiveSlug } = await params
    const r = await resolveOwned(request, archiveSlug)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    return NextResponse.json(await stateOf(r.invitation))
  } catch (e) {
    console.error('settings get error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '조회 실패' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ archiveSlug: string }> }) {
  try {
    const { archiveSlug } = await params
    const r = await resolveOwned(request, archiveSlug)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
    const inv = r.invitation
    const archived = isWeddingArchivedKST(inv.wedding_date)
    const body = (await request.json()) as {
      publicHidden?: boolean
      sharePassword?: string
      removePassword?: boolean
      stampPhoto?: string
      removeStampPhoto?: boolean
      stampMessage?: string | null
    }

    // ── 우표 사진 / 한마디 (라이프사이클 무관 — owner는 언제든 수정) ──
    if (body.removeStampPhoto === true) {
      await setDrawerStampPhoto(inv.id, null) // 카카오 썸네일로 fallback
    } else if (typeof body.stampPhoto === 'string' && body.stampPhoto.trim()) {
      const url = body.stampPhoto.trim()
      if (!isAllowedStampUrl(url)) {
        return NextResponse.json({ error: '허용되지 않은 이미지 주소입니다.' }, { status: 400 })
      }
      await setDrawerStampPhoto(inv.id, url)
    }
    if (body.stampMessage !== undefined) {
      await setStampMessage(inv.id, body.stampMessage)
    }

    // ── Mode 1/2 는 예식 다음날(Day 1)부터만 ──
    const wantsLifecycle =
      typeof body.publicHidden === 'boolean' ||
      body.removePassword === true ||
      (typeof body.sharePassword === 'string' && body.sharePassword.length > 0)
    if (wantsLifecycle && !isPostDrawerActiveKST(inv.wedding_date)) {
      return NextResponse.json({ error: '예식 다음날부터 이용할 수 있습니다.' }, { status: 403 })
    }

    // ── Mode 1: 공개 링크 수동 비공개 (Day 1~30만) ──
    if (typeof body.publicHidden === 'boolean') {
      if (archived) {
        return NextResponse.json({ error: '공개 기간이 종료되어 변경할 수 없습니다.' }, { status: 400 })
      }
      await setInvitationPublicHidden(inv.id, body.publicHidden)
    }

    // ── Mode 2: 비밀 청첩장 비밀번호 (링크는 항상 활성, 비번만 선택) ──
    // 비번 설정/변경 → 기존 인증 쿠키는 해시 변경으로 자동 무효화. 해제 → 링크만으로 공개.
    if (body.removePassword === true) {
      await ensurePostDrawer(inv.id)
      await ensureShareSlug(inv.id)
      await updateShare(inv.id, { share_password_hash: null })
    } else if (typeof body.sharePassword === 'string' && body.sharePassword.length > 0) {
      if (body.sharePassword.length < 4) {
        return NextResponse.json({ error: '비밀번호는 4자 이상이어야 합니다.' }, { status: 400 })
      }
      await ensurePostDrawer(inv.id)
      await ensureShareSlug(inv.id)
      const hash = await bcrypt.hash(body.sharePassword, 10)
      await updateShare(inv.id, { share_password_hash: hash })
    }

    // 방금 저장한 content(우표 사진)를 반영하려면 invitation을 다시 읽는다.
    const fresh = await resolveOwned(request, archiveSlug)
    return NextResponse.json(await stateOf(fresh.ok ? fresh.invitation : inv))
  } catch (e) {
    console.error('settings patch error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '저장 실패' }, { status: 500 })
  }
}
