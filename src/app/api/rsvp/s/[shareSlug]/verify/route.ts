import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getRsvpShareBySlug, rsvpShareCookieToken } from '@/lib/rsvpShare'
import { rsvpShareCookieName } from '@/lib/rsvpAccess'

/** 공유 RSVP 비밀번호 확인 → 인증 쿠키 발급. 인메모리 rate-limit(10분/5회 실패 → 429). */
const attempts = new Map<string, number[]>()
const WINDOW = 10 * 60 * 1000
const MAX_FAILS = 5

function clientIp(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ shareSlug: string }> }) {
  try {
    const { shareSlug } = await params
    const share = await getRsvpShareBySlug(shareSlug)
    if (!share || !share.share_slug) return NextResponse.json({ error: '공유를 찾을 수 없습니다.' }, { status: 404 })
    if (!share.password_hash) return NextResponse.json({ ok: true }) // 비번 없음 → 통과

    const key = `${shareSlug}:${clientIp(request)}`
    const now = Date.now()
    const recent = (attempts.get(key) || []).filter((t) => now - t < WINDOW)
    if (recent.length >= MAX_FAILS) {
      return NextResponse.json({ error: '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const { password } = (await request.json()) as { password?: string }
    const ok = !!password && (await bcrypt.compare(password, share.password_hash))
    if (!ok) {
      recent.push(now)
      attempts.set(key, recent)
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }
    attempts.delete(key)

    const token = await rsvpShareCookieToken(shareSlug, share.password_hash)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(rsvpShareCookieName(shareSlug), token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e) {
    console.error('rsvp verify error:', e)
    return NextResponse.json({ error: '확인에 실패했습니다.' }, { status: 500 })
  }
}
