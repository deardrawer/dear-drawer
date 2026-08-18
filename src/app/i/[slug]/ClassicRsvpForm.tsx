'use client'

import { useState } from 'react'

interface Tokens {
  INK: string
  IVORY: string
  PAPER: string
  inkA: (a: number) => string
  F_BODY: string
  F_LABEL: string
}

interface Props {
  invitationId?: string
  isPreview?: boolean
  meal?: boolean
  shuttle?: boolean
  phone?: boolean
  sideDetail?: boolean
  sideDetailOptions?: Record<string, boolean>
  notice?: string
  messagePlaceholder?: string
  initialAttend?: 'attending' | 'not_attending'
  hideNotice?: boolean
  onClose?: () => void
  tokens: Tokens
}

type Attend = 'attending' | 'not_attending' | 'pending'

/** THE CLASSIC RSVP 폼 — 식사 여부 · 연락처 뒷자리 · 신랑/신부·본인/아버지/어머니 구분 · 축하메시지 */
const SIDE_ITEMS = [
  { key: 'groomSelf', label: '신랑', side: 'groom' as const, detail: 'self' as const },
  { key: 'groomFather', label: '신랑 아버지', side: 'groom' as const, detail: 'father' as const },
  { key: 'groomMother', label: '신랑 어머니', side: 'groom' as const, detail: 'mother' as const },
  { key: 'brideSelf', label: '신부', side: 'bride' as const, detail: 'self' as const },
  { key: 'brideFather', label: '신부 아버지', side: 'bride' as const, detail: 'father' as const },
  { key: 'brideMother', label: '신부 어머니', side: 'bride' as const, detail: 'mother' as const },
]

export default function ClassicRsvpForm({ invitationId, isPreview, meal, shuttle, phone, sideDetail, sideDetailOptions, notice, messagePlaceholder, initialAttend, hideNotice, onClose, tokens }: Props) {
  const { INK, IVORY, PAPER, inkA, F_BODY, F_LABEL } = tokens
  const [name, setName] = useState('')
  const [tel, setTel] = useState('')
  const [side, setSide] = useState<'groom' | 'bride' | null>(null)
  const [detail, setDetail] = useState<'self' | 'father' | 'mother' | null>(null)
  const [attend, setAttend] = useState<Attend | null>(initialAttend ?? null)
  const [mealYn, setMealYn] = useState<'yes' | 'no' | null>(null)
  const [shuttleYn, setShuttleYn] = useState<'yes' | 'no' | null>(null)
  const [count, setCount] = useState(1)
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const inputStyle: React.CSSProperties = { width: '100%', fontFamily: F_BODY, fontSize: 13, color: INK, background: '#fff', border: `1px solid ${inkA(0.2)}`, padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { display: 'block', margin: '0 0 7px', fontFamily: F_LABEL, fontSize: 9.5, letterSpacing: '.28em', paddingLeft: '.28em', color: inkA(0.5) }

  const Choice = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} style={{ flex: 1, fontFamily: F_BODY, fontSize: 12.5, padding: '10px 0', cursor: 'pointer', whiteSpace: 'nowrap', background: active ? INK : 'transparent', color: active ? IVORY : inkA(0.6), border: `1px solid ${active ? INK : inkA(0.25)}`, transition: 'all .2s ease' }}>{children}</button>
  )

  const submit = async () => {
    if (isPreview) { setErr('미리보기에서는 전송되지 않습니다.'); return }
    if (!invitationId) { setErr('저장 후 이용할 수 있습니다.'); return }
    if (!name.trim()) { setErr('성함을 입력해주세요.'); return }
    if (!attend) { setErr('참석 여부를 선택해주세요.'); return }
    if (phone && tel && !/^\d{4}$/.test(tel)) { setErr('연락처 뒷자리 4자리를 숫자로 입력해주세요.'); return }
    setSubmitting(true); setErr(null)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: name.trim(),
          guestPhone: phone && tel ? tel : undefined,
          attendance: attend,
          guestCount: attend === 'attending' ? count : 0,
          message: msg.trim() || undefined,
          side: side || undefined,
          sideDetail: sideDetail && detail ? detail : undefined,
          mealAttendance: meal && attend === 'attending' ? (mealYn || undefined) : undefined,
          shuttleBus: shuttle && attend === 'attending' ? (shuttleYn || undefined) : undefined,
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setErr(data.error || '전송에 실패했습니다.'); return }
      setDone(true)
    } catch { setErr('전송 중 오류가 발생했습니다.') } finally { setSubmitting(false) }
  }

  if (done) {
    return (
      <div style={{ background: PAPER, padding: '40px 26px', textAlign: 'center', boxShadow: '0 24px 38px -32px rgba(53,23,20,.7)' }}>
        <p style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 22, color: INK }}>Thank you</p>
        <p style={{ margin: '14px 0 0', fontFamily: F_BODY, fontSize: 12.5, lineHeight: 1.9, color: inkA(0.65) }}>참석 여부를 전해주셔서 감사합니다.</p>
        {onClose && (
          <button type="button" onClick={onClose} style={{ margin: '22px auto 0', display: 'block', padding: '10px 28px', border: `1px solid ${inkA(0.3)}`, background: 'transparent', fontFamily: F_LABEL, fontSize: 11, letterSpacing: '.22em', paddingLeft: 'calc(28px + .22em)', color: INK, cursor: 'pointer' }}>닫기</button>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: PAPER, padding: '30px 24px 32px', boxShadow: '0 24px 38px -32px rgba(53,23,20,.7)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {notice && !hideNotice && <p style={{ margin: 0, textAlign: 'center', fontFamily: F_BODY, fontSize: 11.5, lineHeight: 1.9, color: inkA(0.6), whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{notice}</p>}

      {/* 1단계: 참석 여부 (봉투 버튼에서 넘겨받으면 숨김) */}
      {!initialAttend && (
        <div>
          <span style={labelStyle}>참석 여부</span>
          <div style={{ display: 'flex', gap: 7 }}>
            <Choice active={attend === 'attending'} onClick={() => setAttend('attending')}>참석합니다</Choice>
            <Choice active={attend === 'not_attending'} onClick={() => setAttend('not_attending')}>참석 어렵습니다</Choice>
          </div>
        </div>
      )}

      {/* 2단계: 참석/미참석 선택 시 상세 폼 */}
      {attend && (
        <>
          {sideDetail ? (
            <div>
              <span style={labelStyle}>구분</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                {SIDE_ITEMS.filter((it) => sideDetailOptions?.[it.key] !== false).map((it) => (
                  <Choice key={it.key} active={side === it.side && detail === it.detail} onClick={() => { setSide(it.side); setDetail(it.detail) }}>{it.label}</Choice>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <span style={labelStyle}>SIDE</span>
              <div style={{ display: 'flex', gap: 7 }}>
                <Choice active={side === 'groom'} onClick={() => setSide('groom')}>신랑측</Choice>
                <Choice active={side === 'bride'} onClick={() => setSide('bride')}>신부측</Choice>
              </div>
            </div>
          )}

          <div>
            <span style={labelStyle}>성함</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="성함" style={inputStyle} />
          </div>

          {phone && (
            <div>
              <span style={labelStyle}>연락처 뒷자리</span>
              <input value={tel} onChange={(e) => setTel(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="0000" maxLength={4} style={inputStyle} />
            </div>
          )}

          {attend === 'attending' && (
            <>
              <div>
                <span style={labelStyle}>참석 인원</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} style={{ width: 34, height: 34, fontFamily: F_BODY, fontSize: 18, color: INK, background: 'transparent', border: `1px solid ${inkA(0.25)}`, cursor: 'pointer' }}>−</button>
                  <span style={{ fontFamily: F_BODY, fontSize: 15, color: INK, minWidth: 24, textAlign: 'center' }}>{count}</span>
                  <button type="button" onClick={() => setCount((c) => Math.min(100, c + 1))} style={{ width: 34, height: 34, fontFamily: F_BODY, fontSize: 18, color: INK, background: 'transparent', border: `1px solid ${inkA(0.25)}`, cursor: 'pointer' }}>+</button>
                </div>
              </div>
              {meal && (
                <div>
                  <span style={labelStyle}>식사 여부</span>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <Choice active={mealYn === 'yes'} onClick={() => setMealYn('yes')}>식사 예정</Choice>
                    <Choice active={mealYn === 'no'} onClick={() => setMealYn('no')}>식사 안 함</Choice>
                  </div>
                </div>
              )}
              {shuttle && (
                <div>
                  <span style={labelStyle}>대절버스 이용 여부</span>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <Choice active={shuttleYn === 'yes'} onClick={() => setShuttleYn('yes')}>이용 예정</Choice>
                    <Choice active={shuttleYn === 'no'} onClick={() => setShuttleYn('no')}>이용 안 함</Choice>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <span style={labelStyle}>축하 메시지 (선택)</span>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={messagePlaceholder || '축하의 마음을 전해주세요.'} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
          </div>

          {err && <p style={{ margin: 0, fontFamily: F_BODY, fontSize: 11, color: '#B4462F', textAlign: 'center' }}>{err}</p>}

          <button type="button" onClick={submit} disabled={submitting} style={{ fontFamily: F_LABEL, fontSize: 10, letterSpacing: '.4em', padding: '15px 0', paddingLeft: '.4em', cursor: submitting ? 'default' : 'pointer', background: INK, border: `1px solid ${INK}`, color: IVORY, opacity: submitting ? 0.6 : 1, whiteSpace: 'nowrap' }}>{submitting ? 'SENDING…' : 'SEND RSVP'}</button>
        </>
      )}
    </div>
  )
}
