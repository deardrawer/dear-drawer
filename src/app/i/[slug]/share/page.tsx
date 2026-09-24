import { getInvitationBySlug, getInvitationById, getInvitationByAlias } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Viewport } from 'next'
import GuestShareClient from './GuestShareClient'
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

  // 업로드 창: 예식 당일(Day 0) ~ 예식+10일. 그 전엔 대기, 이후엔 마감 안내.
  //  (wedding_date 없으면 계산 불가 → 바로 업로드 허용)
  const since = daysSinceWeddingKST(invitation.wedding_date)
  const beforeWedding = since !== null && since < 0
  const afterWindow = since !== null && since > 10
  if (beforeWedding || afterWindow) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-neutral-50 px-6 text-center">
        <div className="max-w-sm">
          <p className="text-4xl mb-4">🤍</p>
          {beforeWedding ? (
            <>
              <h1 className="text-lg font-semibold text-neutral-800 mb-2">결혼식 당일부터 열려요</h1>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {coupleName}의 결혼식 당일부터<br />
                이곳에서 사진을 함께 나눌 수 있어요.<br />
                그날 소중한 순간을 담아 보내주세요 🤍
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-neutral-800 mb-2">사진 공유가 마감되었어요</h1>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {coupleName}의 사진 공유 기간(예식 후 10일)이<br />
                끝났어요. 함께해 주셔서 감사합니다 🤍
              </p>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <GuestShareClient slug={slug} coupleName={coupleName} title={title} description={description} />
  )
}
