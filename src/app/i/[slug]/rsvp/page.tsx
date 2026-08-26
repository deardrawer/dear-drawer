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
