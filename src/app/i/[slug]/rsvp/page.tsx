import { getInvitationBySlug, getInvitationById, getInvitationByAlias } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import type { Viewport } from 'next'
import RsvpForm from '@/components/invitation/RsvpForm'
import { normalizeRsvpSettings } from '@/lib/rsvpSettings'

// 청첩장 본문과 동일하게 확대 방지
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

interface PageProps {
  params: Promise<{ slug: string }>
}

// 이미지 값(string | {url}) → URL 문자열
function extractImageUrl(img: unknown): string {
  if (!img) return ''
  if (typeof img === 'string') return img
  if (typeof img === 'object' && img !== null && 'url' in img) return (img as { url: string }).url || ''
  return ''
}

// 상대경로 이미지를 절대 URL로 변환
function toAbsoluteImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  if (imageUrl.startsWith('/')) return `${baseUrl}${imageUrl}`
  return `${baseUrl}/${imageUrl}`
}

/**
 * 별도 RSVP 링크의 카카오톡/OG 공유 메타데이터.
 * 공유 제목·설명은 에디터에서 커스텀 가능(rsvp.shareTitle/shareDescription),
 * 미설정 시 신랑·신부 이름 기반 기본값을 사용한다. 썸네일은 본문과 동일 우선순위로 추출.
 */
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const baseUrl = 'https://invite.deardrawer.com'

  let invitation = await getInvitationBySlug(slug)
  if (!invitation) invitation = await getInvitationById(slug)
  if (!invitation) {
    const byAlias = await getInvitationByAlias(slug)
    if (byAlias) invitation = byAlias
  }
  if (!invitation) return { title: 'RSVP' }

  let content: unknown = null
  if (invitation.content) {
    try { content = JSON.parse(invitation.content) } catch { content = null }
  }
  const rsvp = normalizeRsvpSettings(invitation.template_id, content)

  const title = rsvp.shareTitle || '참석 여부 안내'
  const description = rsvp.shareDescription || '예식 준비를 위해 참석 여부를 미리 알려주시면 감사하겠습니다.'

  // 썸네일: 본문 페이지와 동일 우선순위
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (content ?? {}) as any
  let theSimpleGalleryFirst = ''
  if (c?.galleries) {
    for (const key of Object.keys(c.galleries)) {
      const imgs = c.galleries[key]
      if (Array.isArray(imgs) && imgs.length > 0) {
        theSimpleGalleryFirst = imgs[0]?.webUrl || imgs[0]?.url || ''
        if (theSimpleGalleryFirst) break
      }
    }
  }
  const rawThumb =
    (c?.meta?.ogImageCropped as string) ||
    extractImageUrl(c?.meta?.ogImage) ||
    extractImageUrl(c?.media?.coverImage) ||
    extractImageUrl(c?.heroImage) ||
    extractImageUrl(c?.mainImage) ||
    extractImageUrl(c?.sections?.intro?.photo) ||
    extractImageUrl(c?.gallery?.images?.[0]) ||
    theSimpleGalleryFirst ||
    (c?.content?.classicOpeningBgImage as string) ||
    ''
  const thumb = toAbsoluteImageUrl(rawThumb, baseUrl)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website' as const,
      url: `${baseUrl}/i/${slug}/rsvp`,
      siteName: 'dear drawer - 모바일 청첩장',
      locale: 'ko_KR',
      ...(thumb && { images: [{ url: thumb, width: 800, height: 400, alt: title }] }),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      ...(thumb && { images: [thumb] }),
    },
  }
}

/**
 * 별도 RSVP 링크 페이지 — /i/[slug]/rsvp
 * 청첩장 전체를 렌더하지 않고, 해당 청첩장의 RSVP 설정을 그대로 읽어 폼만 보여준다.
 * 제출은 기존 /api/rsvp 로 동일 invitationId에 저장 → 기존 응답 목록·대시보드에 통합.
 * 'sharedRsvpEnabled'가 켜진 경우에만 접근 가능(꺼져 있으면 notFound).
 */
export default async function SharedRsvpPage({ params }: PageProps) {
  const { slug } = await params

  // 기존 청첩장 로더 재사용 (slug → id → alias)
  let invitation = await getInvitationBySlug(slug)
  if (!invitation) invitation = await getInvitationById(slug)
  if (!invitation) {
    const byAlias = await getInvitationByAlias(slug)
    if (byAlias) redirect(`/i/${byAlias.slug || byAlias.id}/rsvp`)
  }
  if (!invitation) notFound()

  let content: unknown = null
  if (invitation.content) {
    try {
      content = JSON.parse(invitation.content)
    } catch {
      content = null
    }
  }

  const rsvp = normalizeRsvpSettings(invitation.template_id, content)

  // 별도 RSVP 링크는 이 토글만으로 독립 동작한다.
  // (본문에 RSVP 섹션을 넣지 않아도/숨겨도, sharedRsvpEnabled만 켜면 RSVP 폼 링크가 열림)
  if (!rsvp.sharedEnabled) notFound()

  const groomName = invitation.groom_name || '신랑'
  const brideName = invitation.bride_name || '신부'

  return (
    <main
      className="min-h-[100dvh] w-full flex items-start justify-center bg-stone-50 px-4 py-10"
      style={{ WebkitTextSizeAdjust: '100%' }}
    >
      <div className="w-full max-w-[420px]">
        <header className="text-center mb-6">
          <p className="text-[11px] tracking-[0.2em] text-stone-400 uppercase mb-2">R.S.V.P</p>
          <h1 className="text-lg text-stone-800">
            {groomName} <span className="text-stone-300">&amp;</span> {brideName}
          </h1>
          <p className="mt-2 text-[13px] text-stone-500 leading-relaxed">
            참석 여부를 전해주시면
            <br />
            정성껏 준비하겠습니다.
          </p>
        </header>

        <div className="rounded-2xl bg-white border border-stone-200 shadow-sm p-5">
          <RsvpForm
            invitationId={invitation.id}
            primaryColor={rsvp.primaryColor}
            allowGuestCount={rsvp.allowGuestCount}
            showMealOption={rsvp.showMealOption}
            showShuttleOption={rsvp.showShuttleOption}
            showAfterPartyOption={rsvp.showAfterPartyOption}
            showPhoneOption={rsvp.showPhoneOption}
            showSideDetail={rsvp.showSideDetail}
            sideDetailOptions={rsvp.sideDetailOptions}
            notice={rsvp.notice}
            messagePlaceholder={rsvp.messagePlaceholder}
          />
        </div>

        <p className="text-center text-[11px] text-stone-300 mt-6">dear drawer</p>
      </div>
    </main>
  )
}
