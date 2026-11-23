import type { Metadata, Viewport } from 'next'
import MineClient from './MineClient'

export const metadata: Metadata = {
  title: '내 서랍 — POST DRAWER',
  robots: { index: false, follow: false },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }
export const dynamic = 'force-dynamic'

/**
 * 로그인 사용자의 개인 서랍 리졸버.
 * 청첩장 1개 → 해당 서랍으로 자동 이동, 여러 개 → 선택, 없음/비로그인 → 안내.
 */
export default async function MinePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  // ?view=share — 내 청첩장 페이지의 '하객 사진 공유'에서 바로 들어올 때
  const { view } = await searchParams
  return <MineClient initialView={view === 'share' || view === 'invitations' ? view : 'home'} />
}
