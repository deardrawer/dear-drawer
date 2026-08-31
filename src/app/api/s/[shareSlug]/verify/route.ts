import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPostDrawerByShareSlug, shareCookieToken } from '@/lib/postDrawer'
import { getInvitationById } from '@/lib/db'
import { isPostDrawerActiveKST } from '@/lib/weddingLifecycle'

/**
 * [공개, 비밀번호] 결혼 후 비밀번호 청첩장(/s/[shareSlug]) 인증.
 * - /i 접근제어와 완전 분리. shareSlug만으론 접근 불가(비밀번호 필수).
 * - brute-force 최소 방어: bcrypt(느린 해시) + IP+shareSlug 슬라이딩 윈도우(모듈 메모리).
 * - 인증 성공 쿠키는 share_password_hash에서 파생 → 비밀번호 변경 시 자동 무효화.
 */

// 최소 in-memory 레이트리밋(인스턴스 단위 1차 방어; bcrypt가 2차 방어)
const fails = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000 // 10분
const MAX_FAILS = 5 // 10분당 실패 5회

function ipOf(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}
function recentFails(key: string): number[] {
  const now = Date.now()
  const arr = (fails.get(key) || []).filter((t) => now - t < WINDOW_MS)
  fails.set(key, arr)
  return arr
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ shareSlug: string }> }) {
  try {
    const { shareSlug } = await params
    const key = `${shareSlug}:${ipOf(request)}`

    if (recentFails(key).length >= MAX_FAILS) {
      return NextResponse.json({ error: '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const row = await getPostDrawerByShareSlug(shareSlug)
    // 비밀번호가 설정된 경우에만 인증 대상. (비번 미설정이면 링크만으로 열람 → 인증 불필요)
    if (!row || !row.share_password_hash) {
      return NextResponse.json({ error: '접근할 수 없습니다.' }, { status: 403 })
    }
    // 예식 다음날(Day 1)부터만
    const inv = await getInvitationById(row.invitation_id)
    if (!inv || !isPostDrawerActiveKST(inv.wedding_date)) {
      return NextResponse.json({ error: '아직 이용할 수 없습니다.' }, { status: 403 })
    }

    const body = (await request.json()) as { password?: string }
    const ok = typeof body.password === 'string' && body.password.length > 0
      ? await bcrypt.compare(body.password, row.share_password_hash)
      : false

    if (!ok) {
      const arr = recentFails(key)
      arr.push(Date.now())
      fails.set(key, arr)
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    // 인증 성공 → 해시 파생 쿠키(비밀번호 변경/공유OFF 시 무효화). 경로 스코프 한정.
    const token = await shareCookieToken(shareSlug, row.share_password_hash)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(`pds_${shareSlug}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/s/${shareSlug}`,
      maxAge: 60 * 60 * 6, // 6시간
    })
    return res
  } catch (e) {
    console.error('share verify error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : '인증 실패' }, { status: 500 })
  }
}
