import type { Viewport } from 'next'
import { notFound } from 'next/navigation'
import GuestShareClient from '@/app/i/[slug]/share/GuestShareClient'
import { GsStatusScreen } from '@/app/i/[slug]/share/GuestShareView'
import { getCoupleGuestShareBySlug, resolveCoupleShareInvitation } from '@/lib/postDrawer'
import { buildShareLook, GUEST_SHARE_OPEN_DAYS } from '@/lib/guestShareLook'

// 모바일 우선 — 핀치 줌 비활성화(기존 공유 페이지와 동일)
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#FFFFFF' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ shareSlug: string }>
  searchParams: Promise<{ preview?: string }>
}

/**
 * [공개] 커플(서랍) 단위 하객 사진 공유 — 서랍당 링크 하나. 로그인 없이 업로드.
 * 업로드는 세션 API(coupleSlug)가 커플의 대표 청첩장 폴더로 저장(기존 Queue/Drive 재사용).
 * ?preview=1 — 신랑·신부가 하객 화면을 단계별로 미리 봄 (업로드 안 함 · 열림/마감과 무관)
 */
export default async function CouplePhotoSharePage({ params, searchParams }: PageProps) {
  const { shareSlug } = await params
  const { preview } = await searchParams

  const couple = await getCoupleGuestShareBySlug(shareSlug)
  if (!couple) notFound()

  const primary = await resolveCoupleShareInvitation(couple.userId)
  const coupleName = primary ? [primary.groom_name, primary.bride_name].filter(Boolean).join(' · ') || '우리' : '우리'
  const title = couple.title || ''
  const description = couple.description || ''
  const look = buildShareLook(primary, couple.weddingDate, couple.cover, couple.nameStyle, couple.coverY, couple.coverCrop)
  const invitationHref = primary ? `/invitation/${primary.id}` : null

  if (preview === '1') {
    return <GuestShareClient slug="" coupleSlug={shareSlug} coupleName={coupleName} title={title} description={description} look={look} invitationHref={invitationHref} preview />
  }

  if (!couple.enabled || !primary) return <GsStatusScreen look={look} kind="off" invitationHref={invitationHref} />

  // 업로드 창: 예식 당일(Day 0) ~ 예식+10일. wedding_date 없으면 허용. '미리 열기'를 켜면 예식 전에도 받음.
  // 대표 청첩장의 현재 예식일을 기준으로(서랍 프로필의 시드 스냅샷은 예식일 변경 시 어긋날 수 있음).
  const since = look.since
  if (since !== null && since < 0 && !couple.earlyOpen) return <GsStatusScreen look={look} kind="before" invitationHref={invitationHref} />
  if (since !== null && since > GUEST_SHARE_OPEN_DAYS) return <GsStatusScreen look={look} kind="closed" invitationHref={invitationHref} />

  return <GuestShareClient slug="" coupleSlug={shareSlug} coupleName={coupleName} title={title} description={description} look={look} invitationHref={invitationHref} />
}
