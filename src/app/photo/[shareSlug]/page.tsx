import type { Viewport } from 'next'
import { notFound } from 'next/navigation'
import GuestShareClient from '@/app/i/[slug]/share/GuestShareClient'
import { getCoupleGuestShareBySlug, getPrimaryPaidInvitation } from '@/lib/postDrawer'
import { daysSinceWeddingKST } from '@/lib/weddingLifecycle'

// 모바일 우선 — 핀치 줌 비활성화(기존 공유 페이지와 동일)
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ shareSlug: string }>
}

function Screen({ title, desc }: { title: string; desc: string }) {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-neutral-50 px-6 text-center">
      <div className="max-w-sm">
        <p className="text-4xl mb-4">🤍</p>
        <h1 className="text-lg font-semibold text-neutral-800 mb-2">{title}</h1>
        <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
      </div>
    </main>
  )
}

/**
 * [공개] 커플(서랍) 단위 하객 사진 공유 — 서랍당 링크 하나. 로그인 없이 업로드.
 * 업로드는 세션 API(coupleSlug)가 커플의 대표 청첩장 폴더로 저장(기존 Queue/Drive 재사용).
 */
export default async function CouplePhotoSharePage({ params }: PageProps) {
  const { shareSlug } = await params

  const couple = await getCoupleGuestShareBySlug(shareSlug)
  if (!couple) notFound()

  const primary = await getPrimaryPaidInvitation(couple.userId)
  const coupleName = primary ? [primary.groom_name, primary.bride_name].filter(Boolean).join(' · ') || '우리' : '우리'
  const title = couple.title || '사진 공유'
  const description = couple.description || '결혼식의 소중한 순간을 함께 나눠주세요 🤍'

  if (!couple.enabled || !primary) {
    return <Screen title="사진 공유가 아직 열리지 않았어요" desc="신랑·신부가 사진 공유를 준비 중이에요. 잠시 후 다시 방문해주세요." />
  }

  // 업로드 창: 예식 당일(Day 0) ~ 예식+10일. wedding_date 없으면 허용.
  const since = daysSinceWeddingKST(couple.weddingDate)
  if (since !== null && since < 0) {
    return <Screen title="결혼식 당일부터 열려요" desc={`${coupleName}의 결혼식 당일부터 이곳에서 사진을 함께 나눌 수 있어요. 그날 소중한 순간을 담아 보내주세요 🤍`} />
  }
  if (since !== null && since > 10) {
    return <Screen title="사진 공유가 마감되었어요" desc={`${coupleName}의 사진 공유 기간(예식 후 10일)이 끝났어요. 함께해 주셔서 감사합니다 🤍`} />
  }

  return <GuestShareClient slug="" coupleSlug={shareSlug} coupleName={coupleName} title={title} description={description} />
}
