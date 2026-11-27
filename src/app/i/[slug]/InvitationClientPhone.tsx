'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { Invitation } from '@/types/invitation'
import RsvpForm from '@/components/invitation/RsvpForm'
import { normalizeRsvpSettings } from '@/lib/rsvpSettings'
import { PhoneFlow } from '@/components/invitation/phone/PhoneScreens'
import { normalizeDdayPopup } from '@/lib/ddayPopupNormalize'
import { normalizePhoneData, PHONE_W } from '@/components/invitation/phone/phoneTypes'
import { PHONE_FONT_VARS } from '@/components/invitation/phone/phoneFonts'

interface InvitationClientPhoneProps {
  invitation: Invitation
  content: unknown
  isPaid: boolean
  isPreview?: boolean
  isSample?: boolean
  /** 하객 사진 공유 주소 — 잠금화면 카메라 버튼 (없으면 숨김) */
  photoShareHref?: string | null
  [key: string]: unknown
}

const MAX_W = 430
// 첫 그림 전에 화면 폭에 맞는 배율을 넣어 둔다 (깜빡임 방지) — 바로 바깥 상자에 --pf
// 늘 폭에 꽉 맞춤 — 위아래가 짧은 화면은 잠금 · 홈 화면이 스스로 배치를 맞춤 (PhoneScreens 의 shortBy · gridScale)
const FIT_SCRIPT = `(function(){try{var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;var w=Math.min(document.documentElement.clientWidth||window.innerWidth||${PHONE_W},${MAX_W});r.style.setProperty('--pf',String(w/${PHONE_W}));if(window.innerHeight)document.documentElement.style.setProperty('--pf-vh',window.innerHeight+'px')}catch(e){}})()`

/**
 * THE PHONE 하객 화면 — 에디터와 같은 렌더러(PhoneFlow)를 폭에 맞춰 확대/축소해 보여준다.
 * 설계 폭 390 기준, 높이는 실제 화면 높이에 맞춰 늘어난다(잠금화면·홈 하단 바는 아래에 붙어 있음).
 */
export default function InvitationClientPhone({ invitation, content, isSample, photoShareHref = null }: InvitationClientPhoneProps) {
  const data = useMemo(() => {
    const d = normalizePhoneData(content)
    // DB 열에만 있는 값으로 빈칸 보충
    if (!d.groom.name && invitation.groom_name) d.groom.name = invitation.groom_name
    if (!d.bride.name && invitation.bride_name) d.bride.name = invitation.bride_name
    if (!d.wedding.date && invitation.wedding_date) d.wedding.date = String(invitation.wedding_date).slice(0, 10)
    if (!d.wedding.venue.name && invitation.venue_name) d.wedding.venue.name = invitation.venue_name
    if (!d.wedding.venue.address && invitation.venue_address) d.wedding.venue.address = invitation.venue_address
    // D-Day 팝업 — 예전 형식도 같은 모양으로
    if (d.ddayPopup) d.ddayPopup = normalizeDdayPopup(d.ddayPopup)
    return d
  }, [content, invitation])

  const rsvp = useMemo(() => normalizeRsvpSettings(invitation.template_id, content), [invitation.template_id, content])
  const boxRef = useRef<HTMLDivElement>(null)

  // 아이폰이 가로 화면 등에서 글자를 스스로 키우지 않게 (에디터와 같은 줄바꿈)
  useEffect(() => {
    const st = document.documentElement.style as CSSStyleDeclaration & { webkitTextSizeAdjust?: string }
    const prev = st.webkitTextSizeAdjust
    st.webkitTextSizeAdjust = '100%'
    return () => { st.webkitTextSizeAdjust = prev || '' }
  }, [])

  useEffect(() => {
    const fit = () => {
      const w = Math.min(document.documentElement.clientWidth || window.innerWidth, MAX_W)
      boxRef.current?.style.setProperty('--pf', String(w / PHONE_W))
      // 화면 높이 — 실제로 보이는 높이로 (삼성 인터넷 등은 100dvh 가 아래 도구 막대 뒤까지 잡혀 아래 버튼 줄이 가려짐)
      if (window.innerHeight) document.documentElement.style.setProperty('--pf-vh', `${window.innerHeight}px`)
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // 전체 화면에서 위쪽 카메라 구멍 자리까지 그림 (안 그러면 그 띠가 흰색으로 남음) — 내용은 그 아래부터 (env(safe-area-inset-top))
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
    if (!meta || /viewport-fit/.test(meta.content)) return
    const prev = meta.content
    meta.content = `${prev}, viewport-fit=cover`
    return () => { meta.content = prev }
  }, [])

  // 샘플은 회신 양식을 눌러 볼 수 있게 (보내지는 않음)
  const renderRsvp = rsvp.enabled || isSample
    ? (opts?: { attendance?: 'attending' | 'not_attending' | 'pending' }) => (
        <RsvpForm
          initialAttendance={opts?.attendance}
          invitationId={invitation.id}
          primaryColor={data.phone.accent}
          allowGuestCount={rsvp.allowGuestCount}
          showMealOption={rsvp.showMealOption}
          showShuttleOption={rsvp.showShuttleOption}
          showAfterPartyOption={rsvp.showAfterPartyOption}
          showPhoneOption={rsvp.showPhoneOption}
          showSideDetail={rsvp.showSideDetail}
          sideDetailOptions={rsvp.sideDetailOptions}
          notice={rsvp.notice}
          messagePlaceholder={rsvp.messagePlaceholder}
          demo={!!isSample}
        />
      )
    : undefined

  return (
    <div className={PHONE_FONT_VARS} style={{ minHeight: 'var(--pf-vh, 100dvh)', background: '#1A1816', display: 'flex', justifyContent: 'center', WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%' }}>
      <div ref={boxRef} style={{ position: 'relative', width: `min(100vw, ${MAX_W}px)`, height: 'var(--pf-vh, 100dvh)', overflow: 'hidden', background: 'var(--pf-top, transparent)', ['--pf' as string]: 1 }} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: FIT_SCRIPT }} />
        <div style={{ position: 'absolute', left: 0, top: 'env(safe-area-inset-top, 0px)', width: PHONE_W, height: 'calc((var(--pf-vh, 100dvh) - env(safe-area-inset-top, 0px)) / var(--pf))', transform: 'scale(var(--pf))', transformOrigin: '0 0' }}>
          <PhoneFlow data={data} height="100%" renderRsvp={renderRsvp} invitationId={invitation.id} photoShareHref={photoShareHref} />
        </div>
      </div>

    </div>
  )
}
