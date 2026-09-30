import type { Metadata, Viewport } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '우리의 서랍 — POST DRAWER',
  robots: { index: false, follow: false }, // 개인 아카이브 — 검색 미노출
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }
export const dynamic = 'force-dynamic'

/**
 * [비공개] 개인 POST DRAWER — 통합 서랍(/post-drawer/mine)으로 일원화.
 * 청첩장별 개별 아카이브는 폐지하고 커플 단위 통합 서랍으로 리다이렉트한다.
 * (기존 북마크/링크 호환 유지. 청첩장별 설정은 /post-drawer/[archiveSlug]/settings에 그대로.)
 */
export default async function ArchivePage() {
  redirect('/post-drawer/mine')
}
