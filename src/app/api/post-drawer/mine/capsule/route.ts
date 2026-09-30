import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/ownerAuth'
import {
  getDrawerProfile,
  ensureDrawerProfile,
  buildCapsulesForUser,
  setUserTimeCapsule,
  setUserWeddingStamp,
  incrementUserCapsuleYears,
} from '@/lib/postDrawer'
import { milestoneStatuses } from '@/lib/weddingLifecycle'

/**
 * [owner 전용] 커플(user) 단위 우표 기록.
 * - 결혼식 우표(key='wedding') → drawer_profiles.stamp_photo/stamp_message
 * - 마일스톤(d100/y1…) → drawer_profiles.time_capsules
 * - '시점에 열림': 해당 마일스톤 날짜가 지나야 기록 가능. 사진 URL은 우리 업로드(R2/uploads)만.
 */
export const dynamic = 'force-dynamic'
function isAllowedUrl(url: string): boolean {
  return /^\/api\/r2\//.test(url) || /^\/uploads\//.test(url)
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })

    const body = (await request.json()) as {
      milestone?: string
      photo?: string
      removePhoto?: boolean
      message?: string | null
      addYear?: boolean
    }

    const profile = await ensureDrawerProfile(user.id)

    if (body.addYear === true) {
      await incrementUserCapsuleYears(user.id)
      return NextResponse.json({ capsules: await buildCapsulesForUser(user.id) })
    }

    const milestone = (body.milestone || '').toString()
    if (!milestone) return NextResponse.json({ error: '시점이 필요합니다.' }, { status: 400 })

    // 사진 검증
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

    if (milestone === 'wedding') {
      // 결혼식 우표는 항상 열림
      await setUserWeddingStamp(user.id, fields)
    } else {
      // 마일스톤: 열림 상태 검증(커플 프로필의 예식일·연 수 기준)
      const fresh = await getDrawerProfile(user.id)
      const years = Math.max(3, Math.min(30, fresh?.capsule_years || 3))
      const ms = milestoneStatuses(fresh?.wedding_date ?? profile.wedding_date, years).find((m) => m.key === milestone)
      if (!ms) return NextResponse.json({ error: '알 수 없는 시점입니다.' }, { status: 400 })
      if (!ms.unlocked) return NextResponse.json({ error: `아직 열리지 않은 시점입니다. (D-${ms.dday})` }, { status: 403 })
      await setUserTimeCapsule(user.id, milestone, fields)
    }

    return NextResponse.json({ capsules: await buildCapsulesForUser(user.id) })
  } catch (e) {
    console.error('mine capsule error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '저장에 실패했습니다.' }, { status: 500 })
  }
}
