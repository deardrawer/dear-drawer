import { getInvitationBySlug, getInvitationById, getInvitationByAlias } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Viewport } from 'next'
import GuestShareClient from './GuestShareClient'
import { GsStatusScreen } from './GuestShareView'
import { buildShareLook, GUEST_SHARE_OPEN_DAYS } from '@/lib/guestShareLook'
import { daysSinceWeddingKST } from '@/lib/weddingLifecycle'

// 모바일 우선 — 핀치 줌 비활성화(기존 청첩장 페이지와 동일)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function GuestSharePage({ params }: PageProps) {
  const { slug } = await params

  // slug → id → alias (세션 API와 동일한 조회 순서)
  let invitation = await getInvitationBySlug(slug)
  if (!invitation) invitation = await getInvitationById(slug)
  if (!invitation) {
    const byAlias = await getInvitationByAlias(slug)
    if (byAlias) invitation = byAlias
  }
  if (!invitation) notFound()

  // 게이트: 사진 공유 켜짐 + 결제완료(워터마크 제거 가능) 청첩장만. (발행 여부와 무관)
  const enabled = (invitation.guest_share_enabled ?? 0) === 1 && (invitation.is_paid ?? 0) === 1
  const coupleName = [invitation.groom_name, invitation.bride_name].filter(Boolean).join(' · ') || '우리'
  const title = invitation.guest_share_title || ''
  const description = invitation.guest_share_description || ''
  const look = buildShareLook(invitation)
  const invitationHref = `/invitation/${invitation.id}`

  if (!enabled) return <GsStatusScreen look={look} kind="off" invitationHref={invitationHref} />

  // 업로드 창: 예식 당일(Day 0) ~ 예식+10일. 그 전엔 대기, 이후엔 마감 안내.
  //  (wedding_date 없으면 계산 불가 → 바로 업로드 허용)
  const since = daysSinceWeddingKST(invitation.wedding_date)
  if (since !== null && since < 0) return <GsStatusScreen look={look} kind="before" invitationHref={invitationHref} />
  if (since !== null && since > GUEST_SHARE_OPEN_DAYS) return <GsStatusScreen look={look} kind="closed" invitationHref={invitationHref} />

  return (
    <GuestShareClient slug={slug} coupleName={coupleName} title={title} description={description} look={look} invitationHref={invitationHref} />
  )
}
