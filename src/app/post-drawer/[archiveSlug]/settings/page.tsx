import type { Metadata, Viewport } from 'next'
import SettingsClient from './SettingsClient'

export const metadata: Metadata = { title: '설정 — 내 서랍', robots: { index: false, follow: false } }
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }
export const dynamic = 'force-dynamic'

// owner 검증은 클라이언트가 호출하는 GET /api/post-drawer/[archiveSlug]/settings에서 수행.
export default async function SettingsPage({ params }: { params: Promise<{ archiveSlug: string }> }) {
  const { archiveSlug } = await params
  return <SettingsClient archiveSlug={archiveSlug} />
}
