import { getInvitationBySlug, getInvitationById, getInvitationByAlias } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import type { Viewport } from 'next'
import RsvpForm from '@/components/invitation/RsvpForm'
import { normalizeRsvpSettings } from '@/lib/rsvpSettings'
import { resolveKoreanFontFamily } from '@/app/editor/the-simple/fontOptions'

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

// 상대경로 이미지를 절대 URL로 변환
function toAbsoluteImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  if (imageUrl.startsWith('/')) return `${baseUrl}${imageUrl}`
  return `${baseUrl}/${imageUrl}`
}

/**
 * 별도 RSVP 링크의 카카오톡/OG 공유 메타데이터.
 * 제목·설명·썸네일은 에디터에서 커스텀 가능(rsvp.shareTitle/shareDescription/shareImage).
 * 제목·설명 미설정 시 기본 문구 사용, 썸네일은 커스텀 설정 시에만 표시(미설정 시 이미지 없음).
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

  // 썸네일: RSVP 전용 커스텀 썸네일만 사용 (미설정 시 이미지 없음 — 카카오 버튼과 통일)
  const thumb = rsvp.shareImage ? toAbsoluteImageUrl(rsvp.shareImage, baseUrl) : ''

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

  // 예식 정보 (top-level 컬럼 — 템플릿 무관)
  const WD = ['일', '월', '화', '수', '목', '금', '토']
  let weddingDateText = ''
  if (invitation.wedding_date) {
    const d = new Date(invitation.wedding_date + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      weddingDateText = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${WD[d.getDay()]})`
      if (invitation.wedding_time) weddingDateText += ` ${invitation.wedding_time}`
    }
  }
  const venueName = invitation.venue_name || ''
  // 예식홀: content(wedding.venue.hall)에 저장됨 (top-level 컬럼 미매핑) → 기본 표시
  const venueDetail =
    (content as { wedding?: { venue?: { hall?: string } } } | null)?.wedding?.venue?.hall ||
    invitation.venue_detail ||
    ''
  const inviteUrl = `/i/${invitation.slug || invitation.id}`

  // D-Day (KST 기준) + 예식 종료 여부
  let dDayText = ''
  let isPast = false
  const weddingDateOnly = invitation.wedding_date ? invitation.wedding_date.slice(0, 10) : ''
  if (weddingDateOnly) {
    const toNum = (s: string) => {
      const [y, m, d] = s.split('-').map(Number)
      return Date.UTC(y, (m || 1) - 1, d || 1) / 86400000
    }
    const todayKst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
    const diff = toNum(weddingDateOnly) - toNum(todayKst)
    if (diff > 0) dDayText = `D-${diff}`
    else if (diff === 0) dDayText = 'D-DAY'
    else isPast = true
  }

  // 옵션 사진: 에디터에서 RSVP 링크 전용 상단 사진을 올린 경우에만 표시
  const topPhoto = rsvp.pagePhoto || ''

  // 구글 캘린더 추가 링크
  const weddingTime24 = (content as { wedding?: { time?: string } } | null)?.wedding?.time || ''
  let gcalUrl = ''
  if (weddingDateOnly) {
    const dateCompact = weddingDateOnly.replace(/-/g, '')
    const [hhRaw, mmRaw] = (weddingTime24 || '12:00').split(':')
    const hh = String(hhRaw || '12').padStart(2, '0')
    const mm = String(mmRaw || '00').padStart(2, '0')
    const endHh = String((Number(hh) + 2) % 24).padStart(2, '0')
    const text = `${groomName} ♥ ${brideName} 결혼식`
    const loc = [venueName, venueDetail, invitation.venue_address].filter(Boolean).join(' ')
    gcalUrl =
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}` +
      `&dates=${dateCompact}T${hh}${mm}00/${dateCompact}T${endHh}${mm}00&ctz=Asia/Seoul` +
      (loc ? `&location=${encodeURIComponent(loc)}` : '')
  }

  // 오시는 길(지도) 링크
  const mapAddress = invitation.venue_address || venueName
  const naverMapUrl = mapAddress ? `https://map.naver.com/p/search/${encodeURIComponent(mapAddress)}` : ''

  // 청첩장이 설정한 한글 폰트를 상단 영역에 적용 (classic은 classicBodyFont, 그 외는 fontStyle)
  const fontId =
    invitation.template_id === 'narrative-classic'
      ? (content as { content?: { classicBodyFont?: string } } | null)?.content?.classicBodyFont
      : (content as { fontStyle?: string } | null)?.fontStyle
  const rsvpFontFamily = resolveKoreanFontFamily(fontId)

  return (
    <main
      className="min-h-[100dvh] w-full flex items-start justify-center bg-stone-50 px-4 py-10"
      style={{ WebkitTextSizeAdjust: '100%' }}
    >
      <div className="w-full max-w-[420px]" style={{ fontFamily: rsvpFontFamily }}>
        <header className="text-center mb-5">
          {topPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={topPhoto}
              alt=""
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-sm ring-1 ring-stone-200"
            />
          )}
          <p className="text-[11px] tracking-[0.2em] text-stone-400 uppercase">R.S.V.P</p>
          <h1 className="mt-2 text-lg text-stone-800">
            {groomName} <span className="text-stone-300">&amp;</span> {brideName}
          </h1>

          <div className="mt-4 flex items-center justify-center gap-3" aria-hidden>
            <span className="h-px w-10 bg-stone-200" />
            <span className="h-1 w-1 rotate-45" style={{ backgroundColor: rsvp.primaryColor, opacity: 0.55 }} />
            <span className="h-px w-10 bg-stone-200" />
          </div>

          {!isPast && (
            <p className="mt-4 text-[13px] text-stone-500 leading-relaxed break-keep">
              참석 여부를 알려주시면 정성껏 준비하겠습니다.
            </p>
          )}
        </header>

        <div className="rounded-2xl bg-white border border-stone-200 shadow-sm p-5">
          {(dDayText || weddingDateText || venueName) && (
            <div className="text-center pb-4 mb-4 border-b border-stone-100">
              {dDayText && (
                <p
                  className="text-[11px] font-medium tracking-wider"
                  style={{ color: rsvp.primaryColor, opacity: 0.75 }}
                >
                  {dDayText === 'D-DAY' ? 'D-DAY' : `D − ${dDayText.slice(2)}`}
                </p>
              )}
              {weddingDateText && <p className="mt-0.5 text-sm text-stone-700">{weddingDateText}</p>}
              {venueName && (
                <p className="mt-0.5 text-[13px] text-stone-400">
                  {venueName}
                  {venueDetail ? ` · ${venueDetail}` : ''}
                </p>
              )}
              {(gcalUrl || naverMapUrl) && (
                <div className="mt-3.5 flex justify-center gap-2">
                  {gcalUrl && (
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 max-w-[8.5rem] inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-2 text-[11px] text-stone-600 transition-colors hover:bg-stone-100"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-stone-400">
                        <rect x="3" y="4.5" width="18" height="17" rx="2" />
                        <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
                      </svg>
                      캘린더에 추가
                    </a>
                  )}
                  {naverMapUrl && (
                    <a
                      href={naverMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 max-w-[8.5rem] inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-2 text-[11px] text-stone-600 transition-colors hover:bg-stone-100"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-stone-400">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      오시는 길
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          {isPast ? (
            <div className="text-center py-4">
              <p className="text-[15px] text-stone-700">참석 여부 접수가 마감되었습니다.</p>
              <p className="mt-1.5 text-[13px] text-stone-400">함께해 주셔서 감사합니다.</p>
            </div>
          ) : (
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
              inviteUrl={inviteUrl}
            />
          )}
        </div>

        <a
          href={inviteUrl}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl border border-stone-300 bg-white py-3.5 text-[13px] text-stone-700 shadow-sm transition-colors hover:bg-stone-100"
        >
          청첩장 보러가기
          <span aria-hidden className="text-stone-400">→</span>
        </a>

        <p className="text-center text-[11px] text-stone-300 mt-6">dear drawer</p>
      </div>
    </main>
  )
}
