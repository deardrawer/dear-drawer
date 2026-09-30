import type { Metadata, Viewport } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: '설정 — 내 서랍', robots: { index: false, follow: false } }
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }
export const dynamic = 'force-dynamic'

/**
 * 청첩장별 설정 페이지는 통합 서랍(/post-drawer/mine)으로 일원화되어 폐지.
 * - 하객 사진 공유 → 서랍 '사진 공유'(커플 단위)
 * - 우표 사진/한 조각(공개 컬렉션) → 관리자(/admin/stamp) 전용 / 커플 비공개 우표는 서랍 우표
 * - 기존 청첩장 공개 · 비밀번호 → 서랍 '내 청첩장' 카드 인라인
 * (설정 API /api/post-drawer/[archiveSlug]/settings는 비번/공개 토글에 계속 사용)
 */
export default async function SettingsPage() {
  redirect('/post-drawer/mine')
}
