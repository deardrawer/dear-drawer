'use client'
/* eslint-disable @next/next/no-img-element */
// ESSAY 템플릿 — '모던 북' 컨셉 (designConcept: 'modern')
// 흰 종이 + 남색 포인트, 한 화면 = 한 페이지. 러닝헤드·쪽번호·장 번호·fig. 캡션·판권면(예식 일시)·각주형 교통 안내·바코드 뒤표지.
// 기존 에세이 콘텐츠 필드(chapters/interviews, greeting, gallery, wedding, accounts, rsvp…)를 그대로 읽는다 — 새 필수 필드 없음.
import { useState, useEffect, useRef, useCallback, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import RsvpForm from '@/components/invitation/RsvpForm'
import { parseDateOnly } from '@/lib/dateOnly'

// ===== 데이터 타입 (에세이 콘텐츠 중 이 컨셉이 읽는 부분) =====
interface MBank { bank?: string; account?: string; holder?: string; enabled?: boolean }
interface MParent { name?: string; phone?: string; phoneEnabled?: boolean; deceased?: boolean; isDeceased?: boolean; bank?: MBank }
interface MPerson { name?: string; nameEn?: string; firstName?: string; phone?: string; phoneEnabled?: boolean; father?: MParent; mother?: MParent; bank?: MBank }
interface MChapter { title?: string; subtitle?: string; body?: string; photo?: string; photoCrop?: { x: number; y: number; width: number; height: number }; location?: string; date?: string }
interface MInterview { question?: string; answer?: string; answerer?: string }
interface MInfoItem { title?: string; content?: string; enabled?: boolean; buttonText?: string; url?: string }
interface MGuestMsg { id?: string; guest_name?: string; message?: string; created_at?: string }
interface MCropSettings { cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }

export interface ModernEssayData {
  groom?: MPerson
  bride?: MPerson
  wedding?: {
    date?: string; time?: string; timeDisplay?: string; showDate?: boolean; showVenue?: boolean
    venue?: { name?: string; hall?: string; hideHall?: boolean; address?: string }
    directions?: { car?: string; publicTransport?: string; train?: string; expressBus?: string; extraInfoEnabled?: boolean; extraInfoText?: string; extraInfoTitle?: string }
  }
  greeting?: string
  contentMode?: string
  chapters?: MChapter[]
  interviews?: MInterview[]
  quote?: { text?: string; author?: string }
  thankYou?: { message?: string; sign?: string }
  gallery?: { images?: unknown[] }
  media?: { coverImage?: string; coverImageSettings?: MCropSettings }
  design?: { coverTitle?: string }
  content?: { bankEssay?: string; guestbookEssay?: string; thankYouEssay?: string; sampleGuestbook?: MGuestMsg[] }
  info?: { itemOrder?: string[]; customItems?: MInfoItem[] } & Record<string, unknown>
  sectionVisibility?: Record<string, boolean | undefined>
  rsvpEnabled?: boolean
  rsvpDeadline?: string
  rsvpMealOption?: boolean
  rsvpShuttleOption?: boolean
  rsvpAfterPartyOption?: boolean
  rsvpNotice?: string
  deceasedDisplayStyle?: string
}

export type ModernModalTab = 'contact' | 'rsvp' | 'location' | 'account' | 'share'

// ===== 연락처·계좌 (BookFullscreenModal 형식) =====
type Side = 'groom' | 'bride'
export function modernContacts(d: ModernEssayData) {
  const out: { name: string; phone: string; role: string; side: Side }[] = []
  const push = (p: MPerson | MParent | undefined, role: string, side: Side) => {
    if (p?.phone && p.phoneEnabled !== false) out.push({ name: p.name || '', phone: p.phone, role, side })
  }
  push(d.groom, '신랑', 'groom'); push(d.groom?.father, '아버지', 'groom'); push(d.groom?.mother, '어머니', 'groom')
  push(d.bride, '신부', 'bride'); push(d.bride?.father, '아버지', 'bride'); push(d.bride?.mother, '어머니', 'bride')
  return out
}
export function modernAccounts(d: ModernEssayData) {
  const out: { name: string; bank: { bank: string; account: string; holder: string; enabled: boolean }; role: string; side: Side }[] = []
  const push = (p: MPerson | MParent | undefined, role: string, side: Side) => {
    const b = p?.bank
    if (b?.enabled && b.account) out.push({ name: p?.name || '', bank: { bank: b.bank || '', account: b.account, holder: b.holder || p?.name || '', enabled: true }, role, side })
  }
  push(d.groom, '신랑', 'groom'); push(d.groom?.father, '아버지', 'groom'); push(d.groom?.mother, '어머니', 'groom')
  push(d.bride, '신부', 'bride'); push(d.bride?.father, '아버지', 'bride'); push(d.bride?.mother, '어머니', 'bride')
  return out
}

// ===== 디자인 토큰 =====
const INK = '#141414', SUB = '#5E5E5E', MUTE = '#9B9B9B', LINE = '#E7E7E7', ACC = '#22409A', PAPER = '#FFFFFF', BACK = '#F2F3F3'
const KSERIF = "'ChosunIlboMyungjo', serif"
const SANS = "var(--mb-sans)"
const LSERIF = "var(--font-instrument-serif), 'Instrument Serif', serif"
const BODY = "var(--mb-body)"

const mbCSS = `
.mb-root { --mb-sans: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif; }
.mb-col { container-type: size; }
.mb-page { position: absolute; inset: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; overscroll-behavior: contain; }
.mb-page::-webkit-scrollbar { display: none; }
.mb-inner { min-height: 100%; display: flex; flex-direction: column; box-sizing: border-box; }
/* base 레이어 + :where() — Tailwind 유틸리티(RsvpForm 등 재사용 컴포넌트의 버튼 스타일)를 덮지 않는다 */
@layer base {
  :where(.mb-root button) { font: inherit; color: inherit; background: none; border: none; padding: 0; cursor: pointer; }
  :where(.mb-root a) { color: inherit; text-decoration: none; }
}
@keyframes mbIn { from { opacity: 0; transform: translateX(26px); } to { opacity: 1; transform: none; } }
@keyframes mbInBack { from { opacity: 0; transform: translateX(-26px); } to { opacity: 1; transform: none; } }
@keyframes mbFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes bkFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .mb-anim { animation: none !important; } }
`

// ===== 유틸 =====
const paras = (t: string) => t.split(/\n\s*\n/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean)
const hasHangul = (t: string) => /[가-힣]/.test(t)
const titleCase = (t?: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '')
const firstName = (p?: MPerson) => p?.firstName || (p?.name && p.name.length >= 3 ? p.name.slice(1) : p?.name) || ''
const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토']
const WEEK_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function timeLabel(w: ModernEssayData['wedding']) {
  if (w?.timeDisplay) return w.timeDisplay
  const m = /^(\d{1,2}):(\d{2})/.exec(w?.time || '')
  if (!m) return ''
  const h = Number(m[1]), min = Number(m[2])
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}시${min ? ` ${min}분` : ''}`
}

function cropStyle(s?: MCropSettings): CSSProperties {
  if (!s || s.cropWidth === undefined) return {}
  const cX = s.cropX ?? 0, cY = s.cropY ?? 0, cW = s.cropWidth ?? 1, cH = s.cropHeight ?? 1
  if (cW >= 0.98 && cH >= 0.98) return {}
  const x = (cX + cW / 2) * 100, y = (cY + cH / 2) * 100
  return { objectPosition: `${x.toFixed(1)}% ${y.toFixed(1)}%`, transform: `scale(${(1 / Math.max(cW, cH)).toFixed(3)})`, transformOrigin: `${x.toFixed(1)}% ${y.toFixed(1)}%` }
}

function Photo({ src, style, pos = '50% 40%', crop, imgStyle }: { src: string; style?: CSSProperties; pos?: string; crop?: MChapter['photoCrop']; imgStyle?: CSSProperties }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#ECEDED', ...style }}>
      {crop ? (
        <img src={src} alt="" style={{ position: 'absolute', width: `${10000 / crop.width}%`, height: `${10000 / crop.height}%`, left: `${-crop.x * 100 / crop.width}%`, top: `${-crop.y * 100 / crop.height}%`, maxWidth: 'none', display: 'block' }} />
      ) : (
        <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, display: 'block', ...imgStyle }} />
      )}
    </div>
  )
}

function ParentName({ p, hanja }: { p?: MParent; hanja: boolean }) {
  if (!p?.name) return null
  const dead = p.deceased || p.isDeceased
  return (
    <>
      {dead && (hanja ? '故 ' : <img src="/icons/chrysanthemum.svg" alt="고인" style={{ display: 'inline', width: 11, height: 11, marginRight: 2, opacity: 0.7, verticalAlign: 'middle', marginTop: -2 }} />)}
      {p.name}
    </>
  )
}
function Parents({ p, hanja }: { p?: MPerson; hanja: boolean }) {
  const f = p?.father?.name, m = p?.mother?.name
  if (!f && !m) return null
  return <><ParentName p={p?.father} hanja={hanja} />{f && m ? ' · ' : ''}<ParentName p={p?.mother} hanja={hanja} /></>
}

function Barcode({ seed, w = 112, h = 34 }: { seed: string; w?: number; h?: number }) {
  const digits = (seed.replace(/\D/g, '') || '20260101') + '7319'
  const bars: { x: number; bw: number }[] = []
  let x = 0, i = 0
  while (x < w) {
    const d = Number(digits[i % digits.length])
    const bw = d % 3 === 0 ? 2.4 : d % 2 ? 1 : 1.6
    if (x + bw > w) break
    bars.push({ x, bw })
    x += bw + (d % 4 === 0 ? 2.6 : 1.5)
    i++
  }
  return (
    <svg width={w} height={h} style={{ display: 'block' }} aria-hidden>
      {bars.map((b, k) => <rect key={k} x={b.x} y={0} width={b.bw} height={h} fill={INK} />)}
    </svg>
  )
}

// ===== 공통 조각 (모듈 레벨 — 렌더 중 재생성되면 폼 입력이 초기화되므로) =====
function Sheet({ children, folio, bg = PAPER, head, bookTitle, headPad, onPrev, onNext, hasNext }: { children: ReactNode; folio?: number; bg?: string; head?: string; bookTitle: string; headPad: number; onPrev: () => void; onNext: () => void; hasNext: boolean }) {
  return (
    <div className="mb-inner" style={{ background: bg }}>
      {head !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: `24px ${headPad}px 0 24px`, fontFamily: SANS, fontSize: 10.5, color: MUTE, letterSpacing: '0.02em', minHeight: 40, boxSizing: 'border-box' }}>
          <span style={{ fontFamily: KSERIF, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bookTitle}</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '55%' }}>{head}</span>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
      {folio !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 14px 18px', fontFamily: LSERIF, color: MUTE }}>
          <button onClick={onPrev} aria-label="이전 페이지" style={{ width: 40, height: 32, fontSize: 18, color: '#C4C4C4' }}>‹</button>
          <span style={{ fontSize: 14 }}>{folio}</span>
          <button onClick={onNext} aria-label="다음 페이지" style={{ width: 40, height: 32, fontSize: 18, color: hasNext ? '#C4C4C4' : 'transparent' }}>›</button>
        </div>
      )}
    </div>
  )
}
function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: ACC, letterSpacing: '0.04em', ...style }}>{children}</div>
}
function Title({ ko, en }: { ko: string; en?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: KSERIF, fontSize: 25, letterSpacing: '-0.02em', color: INK }}>{ko}</span>
      {en && <span style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 15, color: MUTE }}>{en}</span>}
    </div>
  )
}
function Body({ text, size = 15, style }: { text: string; size?: number; style?: CSSProperties }) {
  return (
    <div style={style}>
      {paras(text).map((p, i) => (
        <p key={i} className={size >= 15 ? 'es-f15' : 'es-f14'} style={{ fontFamily: BODY, fontSize: size, lineHeight: 1.86, color: '#262626', margin: i ? '11px 0 0' : 0, letterSpacing: '-0.01em', wordBreak: 'keep-all', textIndent: i ? '1em' : 0 }}>{p}</p>
      ))}
    </div>
  )
}
function Caption({ c, n }: { c: MChapter; n: number }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 11, lineHeight: 1.6, color: MUTE }}>
      {c.location && <div>{c.location}</div>}
      {c.date && <div>{c.date}</div>}
      <div style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 13 }}>fig. {n}</div>
    </div>
  )
}
function ChapterHead({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: LSERIF, fontSize: 46, lineHeight: 1, color: ACC }}>{n}</span>
      <span style={{ fontFamily: KSERIF, fontSize: 25, letterSpacing: '-0.02em', color: INK, wordBreak: 'keep-all' }}>{title}</span>
      {sub && <span style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 15, color: MUTE }}>{sub}</span>}
    </div>
  )
}

// ===== 페이지 모델 =====
type PageKind = 'cover' | 'preface' | 'chapter' | 'plates' | 'date' | 'location' | 'gift' | 'guestbook' | 'rsvp' | 'back'
interface MPage { kind: PageKind; head: string; toc: string; num?: string; chapter?: MChapter; idx?: number; interview?: MInterview }

interface Props {
  data: ModernEssayData
  invitationId: string
  isSample?: boolean
  hasBgm?: boolean
  bodyFont?: string
  renderModal: (type: ModernModalTab, setType: (t: ModernModalTab) => void, close: () => void) => ReactNode
  renderGallery: (images: string[], start: number, close: () => void) => ReactNode
}

export default function EssayModernBook({ data, invitationId, isSample, hasBgm, bodyFont, renderModal, renderGallery }: Props) {
  const sv = data.sectionVisibility || {}
  const w = data.wedding || {}
  const showDate = w.showDate !== false
  const showVenue = w.showVenue !== false
  const hanja = data.deceasedDisplayStyle === 'hanja'
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const rawTitle = (data.design?.coverTitle || '').trim()
  const bookTitle = rawTitle || '우리의 이야기'
  const images = (data.gallery?.images || []).filter((s): s is string => typeof s === 'string' && !!s)
  const contacts = modernContacts(data)
  const accounts = modernAccounts(data)
  const date = w.date ? parseDateOnly(w.date) : null
  const time = timeLabel(w)

  const infoItems: MInfoItem[] = (() => {
    if (sv.guidance === false || !data.info) return []
    const info = data.info
    const order = info.itemOrder || ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
    const keyed = order.map((k) => info[k] as MInfoItem | undefined).filter((it): it is MInfoItem => !!it?.enabled && !!it.content)
    const custom = (info.customItems || []).filter((it) => it.enabled && it.content)
    return [...keyed, ...custom]
  })()

  // ── 페이지 목록 ──
  const pages: MPage[] = [{ kind: 'cover', head: '', toc: '표지' }]
  pages.push({ kind: 'preface', head: '책머리에', toc: '책머리에' })
  if (sv.story !== false) {
    if (data.contentMode === 'interview') {
      (data.interviews || []).filter((q) => q.question || q.answer).forEach((q, i) => {
        const n = String(i + 1).padStart(2, '0')
        pages.push({ kind: 'chapter', head: `${n} · 문답`, toc: q.question || '', num: n, interview: q, idx: i })
      })
    } else {
      (data.chapters || []).filter((c) => c.title || c.body).forEach((c, i) => {
        const n = String(i + 1).padStart(2, '0')
        pages.push({ kind: 'chapter', head: `${n} · ${c.title || ''}`, toc: c.title || '', num: n, chapter: c, idx: i })
      })
    }
  }
  const hasQuote = sv.quote !== false && !!data.quote?.text
  const hasGallery = sv.gallery !== false && images.length > 0
  if (hasQuote || hasGallery) pages.push({ kind: 'plates', head: hasGallery ? '그날의 기록' : '제사(題詞)', toc: hasGallery ? '그날의 기록' : '제사' })
  if (sv.info !== false) {
    if (showDate && date) pages.push({ kind: 'date', head: '그날', toc: '판권 — 예식 안내' })
    if (showVenue) pages.push({ kind: 'location', head: '오시는 길', toc: '오시는 길' })
  }
  const showAccounts = sv.bankAccounts !== false && accounts.length > 0
  const showContacts = sv.contacts !== false && contacts.length > 0
  if (showAccounts || showContacts) {
    const t = showAccounts ? '마음 전하실 곳' : '연락처'
    pages.push({ kind: 'gift', head: t, toc: t })
  }
  if (sv.guestbook !== false) pages.push({ kind: 'guestbook', head: '방명록', toc: '방명록' })
  if (data.rsvpEnabled && sv.rsvp !== false) pages.push({ kind: 'rsvp', head: '회신', toc: '회신' })
  pages.push({ kind: 'back', head: '', toc: '맺음말' })

  const total = pages.length
  const folioOf = (i: number) => 3 + i * 2

  // ── 넘김 상태 ──
  const [cur, setCur] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev' | 'none'>('none')
  const [modal, setModal] = useState<ModernModalTab | null>(null)
  const [viewer, setViewer] = useState<number | null>(null)
  const colRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null)

  const goTo = useCallback((i: number) => {
    setCur((c) => {
      if (i < 0 || i >= total || i === c) return c
      setDir(i > c ? 'next' : 'prev')
      return i
    })
  }, [total])
  const next = useCallback(() => setCur((c) => { if (c >= total - 1) return c; setDir('next'); return c + 1 }), [total])
  const prev = useCallback(() => setCur((c) => { if (c <= 0) return c; setDir('prev'); return c - 1 }), [])

  const page = pages[Math.min(cur, total - 1)]
  const isFormPage = page.kind === 'rsvp' || page.kind === 'guestbook'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      if (modal || viewer !== null) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') next()
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, modal, viewer])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
  }
  const onPointerUp = (e: ReactPointerEvent) => {
    const s = startRef.current
    startRef.current = null
    if (!s) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    const target = e.target instanceof Element ? e.target : null
    if (target?.closest('input, textarea, select')) return
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); return }
    if (target?.closest('a, button, label, [role="button"], .mb-no-turn')) return
    if (isFormPage) return
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && Date.now() - s.t < 600) {
      const r = colRef.current?.getBoundingClientRect()
      if (!r) return
      const x = (e.clientX - r.left) / r.width
      if (x < 0.3) prev()
      else if (x > 0.7) next()
    }
  }

  // ── 공통 조각 ──
  const sheetProps = { bookTitle, headPad: hasBgm ? 64 : 24, onPrev: prev, onNext: next, hasNext: cur < total - 1 }

  // ── 페이지별 렌더 ──
  const renderPage = (p: MPage, i: number): ReactNode => {
    const folio = folioOf(i)
    switch (p.kind) {
      case 'cover': {
        const cover = data.media?.coverImage || images[0] || (data.chapters || []).find((c) => c.photo)?.photo || ''
        const en = data.groom?.nameEn && data.bride?.nameEn ? `${titleCase(data.groom.nameEn)} & ${titleCase(data.bride.nameEn)}` : ''
        const latinTitle = !hasHangul(bookTitle)
        return (
          <div className="mb-inner" style={{ background: PAPER, padding: '0 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 26, paddingRight: hasBgm ? 40 : 0 }}>
              <span style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 16, color: INK }}>dear drawer</span>
              <span style={{ fontFamily: SANS, fontSize: 10, letterSpacing: '0.14em', color: MUTE }}>ESSAY{date ? ` · ${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}` : ''}</span>
            </div>
            <div style={{ marginTop: 'min(9cqh, 72px)' }}>
              <div style={{ fontFamily: latinTitle ? LSERIF : KSERIF, fontSize: latinTitle ? 46 : 44, lineHeight: latinTitle ? 1.02 : 1.22, letterSpacing: latinTitle ? '-0.01em' : '-0.035em', color: INK, wordBreak: 'keep-all', maxWidth: 300 }}>{bookTitle}</div>
              <div style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 20, color: SUB, marginTop: 14 }}>{en || 'A Wedding Essay'}</div>
            </div>
            <div style={{ flex: '1 1 0', minHeight: 200, display: 'flex', margin: '28px -28px 0 0', position: 'relative' }}>
              <div style={{ width: 36, flexShrink: 0, fontFamily: LSERIF, fontSize: 12, color: MUTE, writingMode: 'vertical-rl', whiteSpace: 'nowrap' }}>{en ? `${en}${date ? ` — ${date.getFullYear()}` : ''}` : date ? `${date.getFullYear()}` : ''}</div>
              {cover ? (
                <Photo src={cover} style={{ flex: 1 }} pos="50% 30%" imgStyle={cropStyle(data.media?.coverImageSettings)} />
              ) : (
                <div style={{ flex: 1, borderTop: `1px solid ${INK}`, borderLeft: `1px solid ${LINE}` }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, padding: '26px 0 36px' }}>
              <div style={{ fontFamily: SANS, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{groomName} · {brideName} <span style={{ fontWeight: 400, color: SUB }}>지음</span></div>
                {(showDate && date) || (showVenue && w.venue?.name) ? (
                  <div style={{ fontSize: 12, color: SUB, marginTop: 6, lineHeight: 1.5 }}>
                    {showDate && date ? `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()} ${WEEK_KO[date.getDay()]}요일${time ? ` ${time}` : ''}` : ''}
                    {showDate && date && showVenue && w.venue?.name ? ' · ' : ''}
                    {showVenue ? w.venue?.name || '' : ''}
                  </div>
                ) : null}
              </div>
              <button onClick={next} style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: ACC, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '8px 0' }}>펼치기 <span style={{ fontSize: 15 }}>→</span></button>
            </div>
          </div>
        )
      }

      case 'preface': {
        const showGreeting = sv.greeting !== false && !!data.greeting
        const showParents = sv.parentNames !== false && (data.groom?.father?.name || data.groom?.mother?.name || data.bride?.father?.name || data.bride?.mother?.name)
        const toc = pages.map((pg, k) => ({ pg, k })).filter(({ pg }) => pg.kind !== 'cover' && pg.kind !== 'preface')
        return (
          <Sheet {...sheetProps} head={p.head} folio={folio}>
            <div style={{ padding: '44px 28px 0' }}>
              {showGreeting && (
                <>
                  <Label>책머리에</Label>
                  <div style={{ marginTop: 18 }}>
                    {(data.greeting || '').split(/\n\s*\n/).map((pp, k) => (
                      <p key={k} className="es-f17" style={{ fontFamily: BODY, fontSize: 17, lineHeight: 1.9, margin: k ? '14px 0 0' : 0, letterSpacing: '-0.02em', whiteSpace: 'pre-line', color: INK, wordBreak: 'keep-all' }}>{pp.trim()}</p>
                    ))}
                  </div>
                </>
              )}
              {showParents && (
                <div style={{ fontFamily: SANS, fontSize: 12, color: SUB, marginTop: showGreeting ? 20 : 0, lineHeight: 1.7 }}>
                  <div><Parents p={data.groom} hanja={hanja} />의 아들 {firstName(data.groom)}</div>
                  <div><Parents p={data.bride} hanja={hanja} />의 딸 {firstName(data.bride)}</div>
                </div>
              )}
            </div>
            <div style={{ margin: `${showGreeting || showParents ? 36 : 8}px 28px 0`, borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
              <Label>차례</Label>
              <div style={{ marginTop: 8 }}>
                {toc.map(({ pg, k }) => (
                  <button key={k} onClick={() => goTo(k)} style={{ display: 'flex', alignItems: 'baseline', width: '100%', minHeight: 31, padding: '3px 0', textAlign: 'left' }}>
                    <span style={{ width: 34, flexShrink: 0, fontFamily: LSERIF, fontSize: 17, color: ACC }}>{pg.kind === 'chapter' ? pg.num : ''}</span>
                    <span style={{ flex: 1, fontFamily: KSERIF, fontSize: 15, color: pg.kind === 'chapter' ? INK : SUB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>{pg.toc}</span>
                    <span style={{ fontFamily: LSERIF, fontSize: 14, color: MUTE }}>{folioOf(k)}</span>
                  </button>
                ))}
              </div>
            </div>
          </Sheet>
        )
      }

      case 'chapter': {
        if (p.interview) {
          const q = p.interview
          const who = q.answerer === 'groom' ? groomName : q.answerer === 'bride' ? brideName : `${groomName} · ${brideName}`
          return (
            <Sheet {...sheetProps} head={p.head} folio={folio}>
              <div style={{ padding: '52px 28px 0' }}>
                <span style={{ fontFamily: LSERIF, fontSize: 46, lineHeight: 1, color: ACC }}>{p.num}</span>
                <div style={{ fontFamily: KSERIF, fontSize: 23, lineHeight: 1.5, letterSpacing: '-0.02em', color: INK, marginTop: 14, wordBreak: 'keep-all' }}>{q.question}</div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, color: MUTE, marginTop: 10 }}>답한 사람 — {who}</div>
                <Body text={q.answer || ''} style={{ marginTop: 26 }} />
              </div>
            </Sheet>
          )
        }
        const c = p.chapter || {}
        const n = (p.idx || 0) + 1
        const v = (p.idx || 0) % 3
        if (!c.photo) {
          return (
            <Sheet {...sheetProps} head={p.head} folio={folio}>
              <div style={{ padding: '56px 28px 0' }}>
                <ChapterHead n={p.num || ''} title={c.title || ''} />
                {c.subtitle && <div style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 15, color: MUTE, marginTop: 6 }}>{c.subtitle}</div>}
                {(c.location || c.date) && <div style={{ fontFamily: SANS, fontSize: 11, color: MUTE, marginTop: 10 }}>{[c.location, c.date].filter(Boolean).join(', ')}</div>}
                <Body text={c.body || ''} style={{ marginTop: 26 }} />
              </div>
            </Sheet>
          )
        }
        if (v === 0) {
          return (
            <Sheet {...sheetProps} head={p.head} folio={folio}>
              <Photo src={c.photo} crop={c.photoCrop} style={{ marginTop: 16, height: 'min(38cqh, 340px)', flexShrink: 0 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 24px 0', fontFamily: SANS, fontSize: 11, color: MUTE }}>
                <span>{[c.location, c.date].filter(Boolean).join(', ')}</span>
                <span style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 13 }}>fig. {n}</span>
              </div>
              <div style={{ padding: '34px 28px 0' }}>
                <ChapterHead n={p.num || ''} title={c.title || ''} sub={c.subtitle} />
                <Body text={c.body || ''} style={{ marginTop: 22 }} />
              </div>
            </Sheet>
          )
        }
        if (v === 1) {
          return (
            <Sheet {...sheetProps} head={p.head} folio={folio}>
              <div style={{ padding: '44px 28px 0' }}>
                <ChapterHead n={p.num || ''} title={c.title || ''} />
                {c.subtitle && <div style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 15, color: MUTE, marginTop: 6 }}>{c.subtitle}</div>}
                <Body text={c.body || ''} style={{ marginTop: 22 }} />
              </div>
              <div style={{ flex: 1, minHeight: 24 }} />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, paddingLeft: 28, marginTop: 8 }}>
                <div style={{ width: 72, flexShrink: 0 }}><Caption c={c} n={n} /></div>
                <Photo src={c.photo} crop={c.photoCrop} style={{ flex: 1, height: 'min(30cqh, 260px)' }} />
              </div>
            </Sheet>
          )
        }
        return (
          <Sheet {...sheetProps} head={p.head} folio={folio}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 16 }}>
              <Photo src={c.photo} crop={c.photoCrop} style={{ width: '70%', height: 'min(34cqh, 300px)', flexShrink: 0 }} />
              <div style={{ paddingRight: 20 }}><Caption c={c} n={n} /></div>
            </div>
            <div style={{ padding: '30px 28px 0' }}>
              <ChapterHead n={p.num || ''} title={c.title || ''} sub={c.subtitle} />
              <Body text={c.body || ''} size={14.5} style={{ marginTop: 22 }} />
            </div>
          </Sheet>
        )
      }

      case 'plates': {
        const big = images[0], thumbs = images.slice(1, 4)
        return (
          <Sheet {...sheetProps} head={p.head} folio={folio}>
            {hasQuote && (
              <div style={{ alignSelf: 'flex-end', width: 'min(260px, 75%)', textAlign: 'right', padding: hasGallery ? '44px 28px 0 0' : '0 28px 0 0', marginTop: hasGallery ? 0 : 'auto', marginBottom: hasGallery ? 0 : 'auto' }}>
                <div style={{ fontFamily: BODY, fontSize: hasGallery ? 14.5 : 18, lineHeight: 1.8, color: hasGallery ? SUB : INK, whiteSpace: 'pre-line', letterSpacing: '-0.02em', wordBreak: 'keep-all' }}>{data.quote?.text}</div>
                {data.quote?.author && <div style={{ fontFamily: SANS, fontSize: 11, color: MUTE, marginTop: 8 }}>— {data.quote.author}</div>}
              </div>
            )}
            {hasGallery && (
              <div style={{ padding: `${hasQuote ? 32 : 44}px 28px 0` }}>
                <Label>그날의 기록</Label>
                <button onClick={() => setViewer(0)} style={{ display: 'block', width: '100%', marginTop: 14 }} aria-label="사진 크게 보기">
                  <Photo src={big} pos="50% 30%" style={{ height: thumbs.length ? 'min(36cqh, 320px)' : 'min(52cqh, 460px)' }} />
                </button>
                {thumbs.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {thumbs.map((s, k) => (
                      <button key={k} onClick={() => setViewer(k + 1)} style={{ flex: 1, display: 'block' }} aria-label="사진 크게 보기">
                        <Photo src={s} pos="50% 25%" style={{ height: 'min(15cqh, 132px)' }} />
                      </button>
                    ))}
                    {Array.from({ length: 3 - thumbs.length }).map((_, k) => <div key={`e${k}`} style={{ flex: 1 }} />)}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontFamily: SANS, fontSize: 11.5, color: MUTE }}>
                  <span style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 13 }}>pl. 1{images.length > 1 ? ` – ${Math.min(images.length, 4)}` : ''}</span>
                  <button onClick={() => setViewer(0)} style={{ color: ACC, fontWeight: 600, padding: '6px 0' }}>사진 {images.length}장 모두 보기 →</button>
                </div>
              </div>
            )}
          </Sheet>
        )
      }

      case 'date': {
        if (!date) return null
        const y = date.getFullYear(), m = date.getMonth(), d = date.getDate()
        const firstDow = new Date(y, m, 1).getDay()
        const days = new Date(y, m + 1, 0).getDate()
        const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, k) => k + 1)]
        const rows: [string, ReactNode][] = [
          ['초판 1쇄', `${y}년 ${m + 1}월 ${d}일 ${WEEK_KO[date.getDay()]}요일${time ? ` ${time}` : ''}`],
          ['지은이', `${groomName} · ${brideName}`],
        ]
        if (sv.parentNames !== false && (data.groom?.father?.name || data.groom?.mother?.name || data.bride?.father?.name || data.bride?.mother?.name)) {
          rows.push(['함께 펴낸 이', <><Parents p={data.groom} hanja={hanja} />{(data.groom?.father?.name || data.groom?.mother?.name) && (data.bride?.father?.name || data.bride?.mother?.name) ? ' / ' : ''}<Parents p={data.bride} hanja={hanja} /></>])
        }
        if (showVenue && w.venue?.name) rows.push(['펴낸 곳', `${w.venue.name}${w.venue.hall && !w.venue.hideHall ? ` ${w.venue.hall}` : ''}`])
        if (showVenue && w.venue?.address) rows.push(['주소', w.venue.address])
        return (
          <Sheet {...sheetProps} head={p.head} folio={folio}>
            <div style={{ padding: '44px 28px 0' }}>
              <Label>그날</Label>
              <div style={{ fontFamily: LSERIF, fontSize: 'min(128px, 33cqw)', lineHeight: 1, letterSpacing: '-0.02em', color: INK, marginTop: 8 }}>{m + 1}.{d}</div>
              <div style={{ fontFamily: KSERIF, fontSize: 20, marginTop: 4, letterSpacing: '-0.02em', color: INK }}>{WEEK_KO[date.getDay()]}요일{time ? ` ${time}` : ''}</div>
              <div style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 15, color: MUTE, marginTop: 4 }}>{WEEK_EN[date.getDay()]}, {MONTH_EN[m]} {d}, {y}</div>
            </div>
            <div style={{ padding: '30px 28px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', fontFamily: SANS, fontSize: 10.5, color: MUTE, textAlign: 'center', marginBottom: 4 }}>
                {WEEK_KO.map((k) => <span key={k}>{k}</span>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2, textAlign: 'center' }}>
                {cells.map((c, k) => (
                  <span key={k} style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c && <span style={{ width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 12.5, background: c === d ? ACC : 'transparent', color: c === d ? '#fff' : k % 7 === 0 ? MUTE : INK, fontWeight: c === d ? 600 : 400 }}>{c}</span>}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 28 }} />
            <div style={{ margin: '0 28px', borderTop: `1px solid ${INK}`, paddingTop: 12 }}>
              {rows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', fontFamily: SANS, fontSize: 12, lineHeight: 1.5, padding: '5px 0' }}>
                  <span style={{ width: 86, color: MUTE, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: '#2A2A2A', wordBreak: 'keep-all' }}>{v}</span>
                </div>
              ))}
            </div>
          </Sheet>
        )
      }

      case 'location': {
        const venue = w.venue || {}
        const dr = w.directions || {}
        const notes: { k: string; v: string; btn?: { text: string; url: string } }[] = []
        if (dr.publicTransport) notes.push({ k: '대중교통', v: dr.publicTransport })
        if (dr.car) notes.push({ k: '자가용', v: dr.car })
        if (dr.train) notes.push({ k: '기차', v: dr.train })
        if (dr.expressBus) notes.push({ k: '고속버스', v: dr.expressBus })
        if (dr.extraInfoEnabled && dr.extraInfoText) notes.push({ k: dr.extraInfoTitle || '추가 안내', v: dr.extraInfoText })
        infoItems.forEach((it) => notes.push({ k: it.title || '안내', v: it.content || '', btn: it.buttonText && it.url ? { text: it.buttonText, url: it.url } : undefined }))
        const links = venue.address ? [
          { href: `https://map.naver.com/v5/search/${encodeURIComponent(venue.address)}`, label: '네이버 지도' },
          { href: `https://map.kakao.com/link/search/${encodeURIComponent(venue.address)}`, label: '카카오맵' },
          { href: `tmap://search?name=${encodeURIComponent(venue.name || '')}`, label: '티맵' },
        ] : []
        return (
          <Sheet {...sheetProps} head={p.head} folio={folio}>
            <div style={{ padding: '44px 28px 0' }}>
              <Title ko="오시는 길" en="Directions" />
              <div style={{ fontFamily: KSERIF, fontSize: 22, letterSpacing: '-0.02em', color: INK, marginTop: 26 }}>{venue.name}</div>
              {venue.hall && !venue.hideHall && <div style={{ fontFamily: SANS, fontSize: 13.5, color: SUB, marginTop: 4 }}>{venue.hall}</div>}
              {venue.address && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', fontFamily: SANS, fontSize: 12.5, color: SUB, marginTop: 8 }}>
                  <span>{venue.address}</span>
                  <CopyText text={venue.address} label="주소 복사" />
                </div>
              )}
            </div>
            {links.length > 0 && (
              <div style={{ display: 'flex', margin: '22px 28px 0', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
                {links.map((l, k) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', fontFamily: SANS, fontSize: 12.5, fontWeight: 500, padding: '13px 0', borderLeft: k ? `1px solid ${LINE}` : 'none', color: INK }}>
                    {l.label} <span style={{ color: ACC }}>↗</span>
                  </a>
                ))}
              </div>
            )}
            {notes.length > 0 && (
              <div style={{ padding: '24px 28px 0' }}>
                {notes.map((d, k) => (
                  <div key={k} style={{ display: 'flex', gap: 10, fontFamily: SANS, fontSize: 12.5, lineHeight: 1.65, marginBottom: 14 }}>
                    <span style={{ fontFamily: LSERIF, fontSize: 14, color: ACC, width: 14, flexShrink: 0, lineHeight: 1.45 }}>{k + 1}</span>
                    <span style={{ width: 56, color: MUTE, flexShrink: 0, wordBreak: 'keep-all' }}>{d.k}</span>
                    <span style={{ color: '#2A2A2A', wordBreak: 'keep-all', whiteSpace: 'pre-line', minWidth: 0 }}>
                      {d.v}
                      {d.btn && <a href={d.btn.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: ACC, fontWeight: 600, marginTop: 4 }}>{d.btn.text} ↗</a>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Sheet>
        )
      }

      case 'gift': {
        const essay = data.content?.bankEssay ? paras(data.content.bankEssay).join(' ') : '직접 오시지 못하더라도 마음만으로 충분히 감사합니다. 축하의 마음을 전하실 분들을 위해 적어 둡니다.'
        const groupAcc = (side: Side) => accounts.filter((a) => a.side === side)
        return (
          <Sheet {...sheetProps} head={p.head} folio={folio}>
            <div style={{ padding: '44px 28px 0' }}>
              <Title ko={p.head} />
              {showAccounts && <div className="es-f14" style={{ fontFamily: BODY, fontSize: 14.5, lineHeight: 1.8, color: SUB, marginTop: 14, wordBreak: 'keep-all' }}>{essay}</div>}
            </div>
            {showAccounts && (['groom', 'bride'] as const).map((side) => groupAcc(side).length > 0 && (
              <div key={side} style={{ padding: '22px 28px 0' }}>
                <Label style={{ marginBottom: 4 }}>{side === 'groom' ? '신랑 측' : '신부 측'}</Label>
                {groupAcc(side).map((a, k) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', minHeight: 52, padding: '7px 0', borderBottom: `1px solid ${LINE}`, fontFamily: SANS }}>
                    <div style={{ width: 88, flexShrink: 0 }}>
                      <div style={{ fontSize: 10.5, color: MUTE }}>{a.role}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginTop: 1, color: INK }}>{a.bank.holder}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: SUB, fontVariantNumeric: 'tabular-nums', lineHeight: 1.45 }}>{a.bank.bank}<br /><span style={{ color: INK, wordBreak: 'break-all' }}>{a.bank.account}</span></div>
                    <CopyText text={a.bank.account} label="복사" />
                  </div>
                ))}
              </div>
            ))}
            {showContacts && (
              <div style={{ padding: '28px 28px 0' }}>
                <Label style={{ marginBottom: 6 }}>연락하기</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20 }}>
                  {(['groom', 'bride'] as const).map((side) => (
                    <div key={side}>
                      {contacts.filter((c) => c.side === side).map((c, k) => (
                        <div key={k} style={{ padding: '10px 0', borderBottom: `1px solid ${LINE}`, fontFamily: SANS }}>
                          <div style={{ fontSize: 10.5, color: MUTE }}>{side === 'groom' ? '신랑 측' : '신부 측'} {c.role}</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 13.5, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: ACC, whiteSpace: 'nowrap' }}>
                              <a href={`tel:${c.phone}`} style={{ padding: '6px 2px' }}>전화</a>
                              <span style={{ color: LINE, margin: '0 3px' }}>·</span>
                              <a href={`sms:${c.phone}`} style={{ padding: '6px 2px' }}>문자</a>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Sheet>
        )
      }

      case 'guestbook':
        return (
          <Sheet {...sheetProps} head={p.head} folio={folio}>
            <Guestbook data={data} invitationId={invitationId} isSample={isSample} />
          </Sheet>
        )

      case 'rsvp':
        return (
          <Sheet {...sheetProps} head={p.head} folio={folio}>
            <div style={{ padding: '44px 28px 0' }}>
              <Title ko="회신" en="R.S.V.P." />
              <div className="es-f14" style={{ fontFamily: BODY, fontSize: 14.5, lineHeight: 1.8, color: SUB, marginTop: 12, wordBreak: 'keep-all' }}>
                {data.rsvpDeadline ? `${parseDateOnly(data.rsvpDeadline).getMonth() + 1}월 ${parseDateOnly(data.rsvpDeadline).getDate()}일까지 ` : ''}참석 여부를 알려주시면 정성껏 자리를 준비하겠습니다.
              </div>
              <div className="mb-no-turn" style={{ marginTop: 24 }}>
                <RsvpForm invitationId={invitationId} primaryColor={ACC} showMealOption={data.rsvpMealOption} showShuttleOption={data.rsvpShuttleOption} showAfterPartyOption={data.rsvpAfterPartyOption} notice={data.rsvpNotice} />
              </div>
            </div>
          </Sheet>
        )

      case 'back': {
        const showThanks = sv.thankyou !== false
        const thanks = data.thankYou?.message || data.content?.thankYouEssay || '바쁘신 와중에도\n저희의 결혼을 축하해 주셔서\n진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.'
        const sign = data.thankYou?.sign || `${firstName(data.groom)} & ${firstName(data.bride)} 올림`
        const photo = images[images.length - 1] || data.media?.coverImage || ''
        const isbn = date ? `ISBN ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${/^(\d{1,2}):(\d{2})/.test(w.time || '') ? `-${(w.time || '').replace(':', '').padStart(4, '0')}` : ''}` : 'ISBN —'
        return (
          <div className="mb-inner" style={{ background: BACK, padding: `0 28px` }}>
            <div style={{ paddingTop: 64, paddingRight: hasBgm ? 24 : 0 }}>
              {showThanks && (
                <>
                  <Label>맺음말</Label>
                  <div style={{ marginTop: 20 }}>
                    {thanks.split(/\n\s*\n/).map((pp, k) => (
                      <p key={k} className="es-f18" style={{ fontFamily: BODY, fontSize: 18, lineHeight: 1.9, margin: k ? '16px 0 0' : 0, letterSpacing: '-0.02em', whiteSpace: 'pre-line', color: INK, wordBreak: 'keep-all' }}>{pp.trim()}</p>
                    ))}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: SUB, marginTop: 22 }}>{sign}</div>
                </>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 32 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
              <div style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 22, lineHeight: 1.25, color: SUB, maxWidth: 170 }}>Thank you for reading our story.</div>
              {photo && <Photo src={photo} pos="50% 25%" style={{ width: 'min(150px, 40cqw)', height: 'min(196px, 24cqh)', flexShrink: 0 }} />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, padding: '32px 0 36px' }}>
              <div style={{ background: '#fff', padding: '10px 12px 8px' }}>
                <Barcode seed={isbn} />
                <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: '0.12em', marginTop: 5, color: SUB, whiteSpace: 'nowrap' }}>{isbn}</div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: SANS }}>
                <div style={{ fontFamily: LSERIF, fontStyle: 'italic', fontSize: 16, color: INK }}>dear drawer</div>
                <button onClick={() => setModal('share')} style={{ display: 'block', marginLeft: 'auto', fontSize: 11.5, color: ACC, fontWeight: 600, marginTop: 8, padding: '2px 0' }}>공유하기 ↗</button>
                <button onClick={() => goTo(0)} style={{ display: 'block', marginLeft: 'auto', fontSize: 11.5, color: ACC, fontWeight: 600, marginTop: 6, padding: '2px 0' }}>처음부터 다시 읽기 ↺</button>
              </div>
            </div>
          </div>
        )
      }
    }
  }

  return (
    <div className="fixed inset-0 mb-root" style={{ background: '#ECEDED', fontFamily: SANS, ['--mb-body' as string]: bodyFont || KSERIF } as CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: mbCSS }} />
      <div
        ref={colRef}
        className="mb-col"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { startRef.current = null }}
        style={{ position: 'relative', height: '100%', maxWidth: 430, margin: '0 auto', background: PAPER, overflow: 'hidden', touchAction: 'pan-y' }}
      >
        <div
          key={cur}
          className="mb-page mb-anim"
          data-mb-page={page.kind}
          style={{ animation: dir === 'none' ? 'mbFade 0.6s ease-out both' : `${dir === 'next' ? 'mbIn' : 'mbInBack'} 0.45s cubic-bezier(.22,1,.36,1) both` }}
        >
          {renderPage(page, cur)}
        </div>
      </div>
      {modal && renderModal(modal, setModal, () => setModal(null))}
      {viewer !== null && renderGallery(images, viewer, () => setViewer(null))}
    </div>
  )
}

function CopyText({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800) }).catch(() => {})
      }}
      style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: ACC, padding: '8px 0 8px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      {done ? '복사됨' : label}
    </button>
  )
}

function Guestbook({ data, invitationId, isSample }: { data: ModernEssayData; invitationId: string; isSample?: boolean }) {
  const essay = data.content?.guestbookEssay ? paras(data.content.guestbookEssay).join(' ') : '이야기의 마지막 페이지는 여러분의 한 마디로 채워집니다. 축하, 응원, 안부 한 줄도 저희에게는 소중한 선물이에요.'
  const [messages, setMessages] = useState<MGuestMsg[]>(isSample ? data.content?.sampleGuestbook || [] : [])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    if (isSample || !invitationId) return
    fetch(`/api/guestbook?invitationId=${invitationId}`)
      .then((r) => r.json() as Promise<{ messages?: MGuestMsg[]; data?: MGuestMsg[] }>)
      .then((d) => setMessages(d.messages || d.data || []))
      .catch(() => {})
  }, [invitationId, isSample])
  const submit = async () => {
    if (!name.trim() || !message.trim()) return
    if (isSample) { setMessages((prev) => [{ id: `s-${Date.now()}`, guest_name: name.trim(), message: message.trim() }, ...prev]); setName(''); setMessage(''); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId, guestName: name.trim(), message: message.trim() }) })
      if (res.ok) { const d = await res.json() as { data?: MGuestMsg } & MGuestMsg; setMessages((prev) => [d.data || d, ...prev]); setName(''); setMessage('') }
    } catch { /* 무시 */ }
    setSubmitting(false)
  }
  const inputStyle: CSSProperties = { width: '100%', border: 'none', borderBottom: `1px solid ${INK}`, background: 'none', padding: '10px 0', fontFamily: SANS, fontSize: 14, color: INK, outline: 'none', borderRadius: 0 }
  const disabled = submitting || !name.trim() || !message.trim()
  return (
    <div style={{ padding: '44px 28px 0' }}>
      <Title ko="방명록" en="Guestbook" />
      <div className="es-f14" style={{ fontFamily: BODY, fontSize: 14.5, lineHeight: 1.8, color: SUB, marginTop: 12, wordBreak: 'keep-all' }}>{essay}</div>
      <div style={{ marginTop: 22 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="성함" maxLength={20} style={inputStyle} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="축하의 한 마디를 남겨 주세요" maxLength={500} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.7, marginTop: 6 }} />
        <button onClick={submit} disabled={disabled} style={{ display: 'block', width: '100%', height: 48, marginTop: 16, background: INK, color: '#fff', fontFamily: SANS, fontSize: 14, fontWeight: 600, opacity: disabled ? 0.35 : 1 }}>{submitting ? '남기는 중…' : '남기기'}</button>
      </div>
      {messages.length > 0 && (
        <div style={{ marginTop: 26 }}>
          {messages.slice(0, 5).map((m, k) => (
            <div key={m.id || k} style={{ padding: '14px 0', borderTop: `1px solid ${LINE}`, fontFamily: SANS }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{m.guest_name}</div>
              <div style={{ fontSize: 13, color: SUB, lineHeight: 1.7, marginTop: 4, wordBreak: 'keep-all' }}>{m.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
