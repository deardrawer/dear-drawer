import type { Metadata, Viewport } from 'next'
import ArchiveClient from './ArchiveClient'

export const metadata: Metadata = {
  title: '우리의 서랍 — POST DRAWER',
  robots: { index: false, follow: false }, // 개인 아카이브 — 검색 미노출
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

// owner 검증은 클라이언트가 호출하는 GET /api/post-drawer/[archiveSlug]에서 수행(쿠키 JWT).
export const dynamic = 'force-dynamic'

/**
 * [비공개] 개인 POST DRAWER(결혼식 서랍). owner만 데이터 조회 가능.
 * 진입: 내 청첩장 카드 → ensure로 archive_slug 확보 후 이동.
 */
export default async function ArchivePage({ params }: { params: Promise<{ archiveSlug: string }> }) {
  const { archiveSlug } = await params
  return <ArchiveClient archiveSlug={archiveSlug} />
}
