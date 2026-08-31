import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getCurrentUser } from '@/lib/ownerAuth'
import { getRsvpShareByUser, ensureRsvpShareSlug, setRsvpSharePassword } from '@/lib/rsvpShare'

/** [owner] RSVP 통합 공유 설정 조회/변경(링크 생성·비밀번호 설정/변경/해제). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const row = await getRsvpShareByUser(user.id)
  return NextResponse.json({ shareSlug: row?.share_slug ?? null, hasPassword: !!row?.password_hash })
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  try {
    const body = (await request.json()) as { enable?: boolean; password?: string; removePassword?: boolean }

    if (body.enable === true) {
      await ensureRsvpShareSlug(user.id)
    }
    if (body.removePassword === true) {
      await ensureRsvpShareSlug(user.id)
      await setRsvpSharePassword(user.id, null)
    } else if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 4) return NextResponse.json({ error: '비밀번호는 4자 이상이어야 합니다.' }, { status: 400 })
      await ensureRsvpShareSlug(user.id)
      const hash = await bcrypt.hash(body.password, 10)
      await setRsvpSharePassword(user.id, hash)
    }

    const row = await getRsvpShareByUser(user.id)
    return NextResponse.json({ shareSlug: row?.share_slug ?? null, hasPassword: !!row?.password_hash })
  } catch (e) {
    console.error('rsvp share patch error:', e)
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 })
  }
}
