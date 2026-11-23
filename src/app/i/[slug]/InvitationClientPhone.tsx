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
// 위아래가 짧은 화면(브라우저 주소창 · 아래 바가 큰 경우)은 폭 대신 높이에 맞춰 줄임 — 설계 높이 MIN_H 아래로는 배치를 누르지 않음
//   (안 그러면 잠금화면 사진이 짧아져 알림이 얼굴을 가리는 등 에디터와 달라짐). 좌우에 생기는 여백은 바깥 바탕색
const MIN_H = 760
const FIT_SCRIPT = `(function(){try{var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;var w=Math.min(document.documentElement.clientWidth||window.innerWidth||${PHONE_W},${MAX_W});var h=window.innerHeight||${MIN_H};var f=Math.min(w/${PHONE_W},h/${MIN_H});r.style.setProperty('--pf',String(f));r.style.width=(${PHONE_W}*f)+'px'}catch(e){}})()`

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
      const f = Math.min(w / PHONE_W, (window.innerHeight || MIN_H) / MIN_H)
      boxRef.current?.style.setProperty('--pf', String(f))
      if (boxRef.current) boxRef.current.style.width = `${PHONE_W * f}px`
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
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
    <div className={PHONE_FONT_VARS} style={{ minHeight: '100dvh', background: '#1A1816', display: 'flex', justifyContent: 'center', WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%' }}>
      <div ref={boxRef} style={{ position: 'relative', width: `min(100vw, ${MAX_W}px)`, height: '100dvh', overflow: 'hidden', ['--pf' as string]: 1 }} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: FIT_SCRIPT }} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: PHONE_W, height: 'calc(100dvh / var(--pf))', transform: 'scale(var(--pf))', transformOrigin: '0 0' }}>
          <PhoneFlow data={data} height="100%" renderRsvp={renderRsvp} invitationId={invitation.id} photoShareHref={photoShareHref} />
        </div>
      </div>

    </div>
  )
}
