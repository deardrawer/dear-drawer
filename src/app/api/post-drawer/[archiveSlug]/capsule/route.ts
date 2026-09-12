import { NextRequest, NextResponse } from 'next/server'
import { getOwnedInvitation } from '@/lib/ownerAuth'
import { getInvitationById } from '@/lib/db'
import {
  getPostDrawerByArchiveSlug,
  getPostDrawerByInvitationId,
  resolveStamp,
  setTimeCapsule,
  buildCapsules,
  getCapsuleYears,
  incrementCapsuleYears,
} from '@/lib/postDrawer'
import { isPostDrawerActiveKST, milestoneStatuses } from '@/lib/weddingLifecycle'

/** 저장 후 최신 content로 타임라인을 재계산해 반환하는 헬퍼. */
async function freshCapsules(invId: string) {
  const fresh = await getInvitationById(invId)
  const freshRow = await getPostDrawerByInvitationId(invId)
  if (!fresh || !freshRow) return []
  const stamp = resolveStamp(fresh, freshRow)
  return buildCapsules(fresh.wedding_date ?? null, fresh.content ?? null, { photo: stamp.photo, message: stamp.message })
}

/**
 * [owner 전용] 타임머신 우표(마일스톤) 기록 저장.
 * - 서랍 전용(공개 컬렉션엔 노출 안 함). content.meta.timeCapsules에 저장(신규 컬럼 없음).
 * - '시점에 열림': 해당 마일스톤 날짜가 지나야(unlocked) 기록 가능.
 * - 사진 URL은 우리 업로드(R2/uploads)만 허용.
 */
function isAllowedUrl(url: string): boolean {
  return /^\/api\/r2\//.test(url) || /^\/uploads\//.test(url)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ archiveSlug: string }> }) {
  try {
    const { archiveSlug } = await params
    const row = await getPostDrawerByArchiveSlug(archiveSlug)
    if (!row) return NextResponse.json({ error: 'POST DRAWER를 찾을 수 없습니다.' }, { status: 404 })

    const owned = await getOwnedInvitation(request, row.invitation_id)
    if (!owned) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    const inv = owned.invitation

    if (!isPostDrawerActiveKST(inv.wedding_date)) {
      return NextResponse.json({ error: '예식 다음날부터 이용할 수 있습니다.' }, { status: 403 })
    }

    const body = (await request.json()) as {
      milestone?: string
      photo?: string
      removePhoto?: boolean
      message?: string | null
      addYear?: boolean
    }

    // 해마다 우표 한 칸 추가
    if (body.addYear === true) {
      await incrementCapsuleYears(inv.id)
      return NextResponse.json({ capsules: await freshCapsules(inv.id) })
    }

    const milestone = (body.milestone || '').toString()

    // 유효한 마일스톤 + 열림 상태 검증(동적 연 단위 개수 기준)
    const ms = milestoneStatuses(inv.wedding_date, getCapsuleYears(inv.content ?? null)).find((m) => m.key === milestone)
    if (!ms) return NextResponse.json({ error: '알 수 없는 시점입니다.' }, { status: 400 })
    if (!ms.unlocked) {
      return NextResponse.json({ error: `아직 열리지 않은 시점입니다. (D-${ms.dday})` }, { status: 403 })
    }

    const fields: { photo?: string | null; message?: string | null } = {}
    if (body.removePhoto === true) {
      fields.photo = null
    } else if (typeof body.photo === 'string' && body.photo.trim()) {
      const url = body.photo.trim()
      if (!isAllowedUrl(url)) return NextResponse.json({ error: '허용되지 않은 이미지 주소입니다.' }, { status: 400 })
      fields.photo = url
    }
    if (body.message !== undefined) fields.message = body.message

    if (fields.photo === undefined && fields.message === undefined) {
      return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })
    }

    await setTimeCapsule(inv.id, milestone, fields)
    return NextResponse.json({ capsules: await freshCapsules(inv.id) })
  } catch (e) {
    console.error('post-drawer capsule error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '저장에 실패했습니다.' }, { status: 500 })
  }
}
