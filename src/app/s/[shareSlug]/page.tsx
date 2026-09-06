import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { getPostDrawerByShareSlug, shareCookieToken } from '@/lib/postDrawer'
import { getInvitationById } from '@/lib/db'
import { isPostDrawerActiveKST } from '@/lib/weddingLifecycle'
import { verifyToken, getAuthCookieName } from '@/lib/auth'
import { InvitationBody } from '@/app/i/[slug]/renderInvitation'
import SharePasswordForm from './SharePasswordForm'

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }
// share_slug/쿠키 기반 — 요청 시 렌더
export const dynamic = 'force-dynamic'

function Screen({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f1', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 360 }}>
        <p style={{ fontSize: 40, margin: '0 0 18px' }}>{emoji}</p>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#3a352c', margin: '0 0 10px' }}>{title}</h1>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#8b8271', margin: 0 }}>{desc}</p>
      </div>
    </main>
  )
}

/**
 * [공개, 비밀번호] 결혼 후 비공개 청첩장. /i 접근제어와 완전 분리.
 * - 공유 비활성/미설정 → 안내. 예식 전(Day<=0) → 준비중. 인증 쿠키 불일치 → 비밀번호 폼.
 * - 인증되면 렌더 코어(InvitationBody)로 청첩장 표시(공개 cutoff 미적용 → Day 31 이후에도 유지).
 */
export default async function SharePage({ params }: { params: Promise<{ shareSlug: string }> }) {
  const { shareSlug } = await params

  const row = await getPostDrawerByShareSlug(shareSlug)
  if (!row) {
    return <Screen emoji="🔒" title="비공개 청첩장" desc="존재하지 않는 링크입니다." />
  }

  const inv = await getInvitationById(row.invitation_id)
  if (!inv || !isPostDrawerActiveKST(inv.wedding_date)) {
    return <Screen emoji="🤍" title="아직 이용할 수 없어요" desc="결혼 후 비공개 청첩장은 예식 다음날부터 열람할 수 있습니다." />
  }

  const cookieStore = await cookies()

  // 신랑신부(owner)는 비밀번호 없이 자기 비밀 청첩장을 연다. 하객 접근제어와는 별개(라우트 분리 유지).
  let isOwner = false
  try {
    const token = cookieStore.get(getAuthCookieName())?.value
    if (token) {
      const payload = await verifyToken(token)
      const uid = (payload as { user?: { id?: string } } | null)?.user?.id
      isOwner = !!uid && uid === inv.user_id
    }
  } catch {
    isOwner = false
  }

  // 비밀번호가 설정된 경우에만 하객 인증 필요. 비번 미설정이면 링크만으로 열람(항상 활성).
  if (!isOwner && row.share_password_hash) {
    // 인증 쿠키 = sha256(shareSlug:password_hash). 비밀번호 변경/해제 시 불일치 → 재인증.
    const cookie = cookieStore.get(`pds_${shareSlug}`)?.value
    const expected = await shareCookieToken(shareSlug, row.share_password_hash)
    if (cookie !== expected) {
      const coupleName = [inv.groom_name, inv.bride_name].filter(Boolean).join(' · ')
      return <SharePasswordForm shareSlug={shareSlug} coupleName={coupleName} />
    }
  }

  let content: unknown = null
  try {
    content = inv.content ? JSON.parse(inv.content) : null
  } catch {
    content = null
  }
  return <InvitationBody invitation={inv} content={content} isPaid={inv.is_paid === 1} />
}
