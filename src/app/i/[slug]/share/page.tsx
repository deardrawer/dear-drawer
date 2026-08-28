import { getInvitationBySlug, getInvitationById, getInvitationByAlias } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Viewport } from 'next'
import GuestShareClient from './GuestShareClient'

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

  const enabled = (invitation.guest_share_enabled ?? 0) === 1 && (invitation.is_published ?? 0) === 1
  const coupleName = [invitation.groom_name, invitation.bride_name].filter(Boolean).join(' · ') || '우리'
  const title = invitation.guest_share_title || '사진 공유'
  const description = invitation.guest_share_description || '결혼식의 소중한 순간을 함께 나눠주세요 🤍'

  if (!enabled) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-neutral-50 px-6 text-center">
        <div className="max-w-sm">
          <p className="text-4xl mb-4">🤍</p>
          <h1 className="text-lg font-semibold text-neutral-800 mb-2">사진 공유가 아직 열리지 않았어요</h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            신랑·신부가 사진 공유를 준비 중이에요. 잠시 후 다시 방문해주세요.
          </p>
        </div>
      </main>
    )
  }

  return (
    <GuestShareClient slug={slug} coupleName={coupleName} title={title} description={description} />
  )
}
