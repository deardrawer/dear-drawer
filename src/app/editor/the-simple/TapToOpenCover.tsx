'use client'

import { useState, useCallback } from 'react'
import './tap-to-open.css'

/** coverVariant 번호 → CSS 클래스 매핑 (0 = 없음) */
const VARIANT_CLASS: Record<number, string> = {
  1: 'v1',
  2: 'v2',
  3: 'v3',
  4: 'v4',
  5: 'v5',
  6: 'v6',
  7: 'v7',
  8: 'v8',
  9: 'v9',
  10: 'v11',
}

export const COVER_VARIANTS: { value: number; label: string }[] = [
  { value: 0, label: '없음' },
  { value: 1, label: '키카드' },
  { value: 2, label: '왁스씰' },
  { value: 3, label: '엠보스' },
  { value: 4, label: '에디토리얼' },
  { value: 5, label: '커튼슬릿' },
  { value: 6, label: '페이퍼폴드' },
  { value: 7, label: '레터프레스' },
  { value: 8, label: '봉투(블랙)' },
  { value: 9, label: '포스트카드' },
  { value: 10, label: '블랙커튼' },
]

interface CoverData {
  groomName: string
  brideName: string
  groomNameEn: string
  brideNameEn: string
  weddingDate: string
  weddingTime: string
  venueName: string
  venueHall: string
}

interface TapToOpenCoverProps {
  variant: number
  data: CoverData
  onOpen?: () => void
  /** V11 블랙커튼: 커튼 열리기 시작할 때 호출 (본문 리마운트용) */
  onStartOpen?: () => void
  /** 에디터 미리보기 모드 (클릭 시 열리지 않음) */
  previewMode?: boolean
}

/** 날짜 문자열을 포맷팅 */
function formatDateKr(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdays[d.getDay()]}요일`
}

function formatDateEn(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatDateDot(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const weekdays = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  return `${y}. ${m}. ${dd}. ${weekdays[d.getDay()]}`
}

function getMonthYear(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

function getDay(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return String(d.getDate())
}

function getPostmarkDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${dd}`
}

function getYear(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return isNaN(d.getTime()) ? '' : String(d.getFullYear())
}

/** 이름 첫 글자 추출 */
function initial(name: string): string {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

/* ──────────────────────────────────────────── */
/* Variant Renderers                            */
/* ──────────────────────────────────────────── */

function V1Cover({ data }: { data: CoverData }) {
  const names = `${data.groomNameEn || data.groomName} & ${data.brideNameEn || data.brideName}`
  return (
    <>
      <div className="border-frame" />
      <div className="mono-label">No. 001</div>
      <div className="gold-line" />
      <div className="headline">
        <svg className="hl-svg" viewBox="0 0 280 90" xmlns="http://www.w3.org/2000/svg">
          <text className="hl-stroke" x="140" y="34" textAnchor="middle">We&apos;re</text>
          <text className="hl-stroke hl-stroke-2" x="140" y="76" textAnchor="middle">Getting Married</text>
        </svg>
      </div>
      <div className="sub-names">{names}</div>
      <div className="date-info">
        {formatDateEn(data.weddingDate)}<br />
        {data.venueName}{data.venueHall ? ` · ${data.venueHall}` : ''}
      </div>
      <div className="tap-hint">
        <div className="tap-icon">
          <svg viewBox="0 0 12 12"><path d="M6 2 L6 10 M3 7 L6 10 L9 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <span>Tap to open</span>
      </div>
    </>
  )
}

function V2Cover({ data }: { data: CoverData }) {
  return (
    <>
      <div className="texture" />
      <div className="seal">
        <img src="/images/shilling _simple.png" alt="" className="seal-bg" />
        <div className="seal-text">
          <span className="seal-initial">{initial(data.groomNameEn || data.groomName)}</span>
          <span className="seal-amp">&amp;</span>
          <span className="seal-initial">{initial(data.brideNameEn || data.brideName)}</span>
        </div>
      </div>
      <div className="heading">You are cordially invited</div>
      <div className="couple-names">Wedding<br />Invitation</div>
      <div className="divider-dot" />
      <div className="date-kr">
        {formatDateKr(data.weddingDate)}<br />
        {data.weddingTime}
      </div>
      <div className="tap-area">
        <div className="line" />
        <span>Open invitation</span>
      </div>
    </>
  )
}

function V3Cover({ data }: { data: CoverData }) {
  return (
    <>
      <div className="emboss-text">Wedding</div>
      <div className="emboss-sub">Invitation</div>
      <div className="center-line" />
      <div className="names-kr">
        {data.groomName && data.brideName
          ? `${data.groomName} · ${data.brideName}`
          : '우리 결혼합니다'}
      </div>
      <div className="tap-circle">
        <div className="arrow" />
      </div>
    </>
  )
}

function V4Cover({ data }: { data: CoverData }) {
  const venue = data.venueName + (data.venueHall ? ` · ${data.venueHall}` : '')
  return (
    <>
      <div className="top-bar">
        <span className="issue">The Invitation — No. 001</span>
        <span className="date-en">{getMonthYear(data.weddingDate)}</span>
      </div>
      <div className="main-area">
        <div className="big-number">{getDay(data.weddingDate) || '16'}</div>
        <div className="title-block">
          <div className="eyebrow">Save the Date</div>
          <div className="names-display">
            <span className="tw-word tw-1">Together</span>
            <span className="tw-word tw-2">with</span>
            <span className="tw-word tw-3">Joy</span>
          </div>
          <div className="venue-info">
            {formatDateEn(data.weddingDate)}{data.weddingTime ? `, ${data.weddingTime}` : ''}<br />
            {venue}
          </div>
        </div>
      </div>
      <div className="bottom-bar">
        <div className="page-num">01 / 01</div>
        <div className="tap-down">
          <div className="tap-down-circle">
            <svg viewBox="0 0 12 12"><path d="M6 2 L6 10 M3 7 L6 10 L9 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span>Tap to open</span>
        </div>
        <div className="page-num" style={{ visibility: 'hidden' }}>01 / 01</div>
      </div>
    </>
  )
}

function V5Cover({ data }: { data: CoverData }) {
  return (
    <>
      <div className="left-panel" />
      <div className="right-panel" />
      <div className="slit-line-h" />
      <div className="slit-content">
        <div className="slit-names">We are</div>
        <div className="slit-and">GETTING</div>
        <div className="slit-names">Married</div>
        <div className="slit-date">{formatDateDot(data.weddingDate)}</div>
      </div>
      <div className="slit-tap">
        <div className="line-l" />
        <span>Tap to open</span>
        <div className="line-r" />
      </div>
    </>
  )
}

function V6Cover({ data }: { data: CoverData }) {
  return (
    <>
      <div className="fold-crease top" />
      <div className="fold-crease bot" />
      <div className="top-section">
        <div className="mono">No. {data.weddingDate?.replace(/-/g, '') || '20260516'}</div>
        <div className="mark">The Invitation</div>
      </div>
      <div className="mid-section">
        <div className="kr-title">청 첩 장</div>
        <div className="names-vert">
          <span className="name-col">우리</span>
          <span className="name-col">결혼합니다</span>
        </div>
        <div className="date-line">{formatDateDot(data.weddingDate)}. {data.weddingTime ? `PM ${data.weddingTime}` : ''}</div>
      </div>
      <div className="bot-section">
        <div className="unfold-icon">
          <svg viewBox="0 0 20 20">
            <path d="M4 8 L10 14 L16 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 4 L10 10 L16 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span>Unfold</span>
      </div>
    </>
  )
}

function V7Cover({ data }: { data: CoverData }) {
  const names = `${data.groomNameEn || data.groomName} & ${data.brideNameEn || data.brideName}`
  const venue = data.venueName + (data.venueHall ? ` · ${data.venueHall}` : '')
  return (
    <>
      <div className="press-border" />
      <div className="press-border-inner" />
      <div className="press-top-ornament">
        <div className="orn-line" />
        <div className="orn-diamond" />
        <div className="orn-line" />
      </div>
      <div className="press-heading">{names}</div>
      <div className="press-names">Wedding<br />Invitation</div>
      <div className="press-rule" />
      <div className="press-info">
        {formatDateDot(data.weddingDate)}<br />
        {venue}
      </div>
      <div className="press-tap">
        <div className="ring" />
        <span>Open</span>
      </div>
    </>
  )
}

function V8Cover() {
  return (
    <>
      <div className="envelope-body">
        <div className="liner" />
      </div>
      <div className="flap" />
      <div className="wax-seal">
        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
      </div>
      <div className="envelope-bottom">
        <div className="env-label">Wedding Invitation</div>
        <div className="env-line-anim" />
      </div>
      <div className="env-tap">
        <div className="pulse-ring">
          <svg viewBox="0 0 12 12"><path d="M6 2 L6 10 M3 7 L6 10 L9 7" /></svg>
        </div>
        <span>Tap to open</span>
      </div>
    </>
  )
}

function V9Cover({ data }: { data: CoverData }) {
  return (
    <>
      <div className="airmail-top" />
      <div className="airmail-bot" />
      <div className="stamp">
        <div className="heart">&hearts;</div>
        <div className="stamp-text">{getYear(data.weddingDate) || '2026'}</div>
      </div>
      <div className="postmark">
        <span className="postmark-date">{getPostmarkDate(data.weddingDate)}</span>
      </div>
      <div className="to-area">
        <div className="to-label">To.</div>
        <div className="to-message">
          <span className="typing-line"><em>You</em> are</span>
          <span className="typing-line">cordially invited<span className="cursor-blink" /></span>
        </div>
        <div className="underline-deco" />
      </div>
      <div className="from-area">
        <div className="from-label">with love</div>
        <div className="from-tap">
          <div className="from-tap-circle">
            <svg viewBox="0 0 12 12"><path d="M6 2 L6 10 M3 7 L6 10 L9 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span>Tap to open</span>
        </div>
      </div>
    </>
  )
}

function V11Cover() {
  return (
    <>
      <div className="curtain-l" />
      <div className="curtain-r" />
      <div className="curtain-center">
        <div className="c-line" />
        <div className="c-diamond" />
        <div className="c-text">Wedding Invitation</div>
        <div className="c-diamond" />
        <div className="c-line" />
      </div>
      <div className="curtain-tap">
        <div className="ct-line" />
        <span>Tap to open</span>
        <div className="ct-line" />
      </div>
    </>
  )
}

/* ──────────────────────────────────────────── */
/* Main Component                               */
/* ──────────────────────────────────────────── */

export default function TapToOpenCover({ variant, data, onOpen, onStartOpen, previewMode }: TapToOpenCoverProps) {
  const [opened, setOpened] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const cls = VARIANT_CLASS[variant]
  if (!cls) return null

  /** dismiss 애니메이션 시간 (ms) — CSS와 동기화 */
  const DISMISS_DURATION = 1200

  const handleTap = useCallback(() => {
    if (previewMode || dismissing) return

    // V5(커튼슬릿): 패널 열리면서 본문이 바로 비침
    if (variant === 5 && !opened) {
      setOpened(true)
      onStartOpen?.()
      setTimeout(() => onOpen?.(), 1000)
      return
    }

    // V8: 열리는 애니메이션 → 딜레이 → dismiss 애니메이션 → onOpen
    if (variant === 8 && !opened) {
      setOpened(true)
      setTimeout(() => {
        setDismissing(true)
        setTimeout(() => onStartOpen?.(), 500)
        setTimeout(() => onOpen?.(), DISMISS_DURATION)
      }, 1200)
      return
    }

    // V11(블랙커튼): 커튼이 충분히 열린 후 본문 마운트
    if (variant === 10 && !opened) {
      setOpened(true)
      setTimeout(() => onStartOpen?.(), 600)
      setTimeout(() => onOpen?.(), 1400)
      return
    }

    // 나머지: 블러 중반에 본문 마운트 (크로스페이드) → 완료 후 커버 제거
    setDismissing(true)
    setTimeout(() => onStartOpen?.(), 500)
    setTimeout(() => onOpen?.(), DISMISS_DURATION)
  }, [variant, opened, onOpen, onStartOpen, previewMode, dismissing])

  const className = [
    'ts-cover',
    cls,
    opened ? 'opened' : '',
    dismissing ? 'dismissing' : '',
  ].filter(Boolean).join(' ')

  const renderContent = () => {
    switch (variant) {
      case 1: return <V1Cover data={data} />
      case 2: return <V2Cover data={data} />
      case 3: return <V3Cover data={data} />
      case 4: return <V4Cover data={data} />
      case 5: return <V5Cover data={data} />
      case 6: return <V6Cover data={data} />
      case 7: return <V7Cover data={data} />
      case 8: return <V8Cover />
      case 9: return <V9Cover data={data} />
      case 10: return <V11Cover />
      default: return null
    }
  }

  return (
    <div className={className} onClick={handleTap}>
      {renderContent()}
    </div>
  )
}
