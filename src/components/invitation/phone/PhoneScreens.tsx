'use client'

/**
 * THE PHONE 렌더러 — 에디터 캔버스와 하객 화면이 함께 쓴다.
 * 모든 좌표는 폭 390 기준 설계 px. 하객 화면은 바깥에서 폭에 맞춰 확대/축소한다.
 *
 * 글자 치수는 레퍼런스 잠금화면 9장 측정값 기준:
 * - 시계 숫자 높이 = 화면 폭의 약 20% (길쭉한 숫자는 약 50%), 가운데 정렬, 기본 회색
 * - 굵거나 길쭉한 숫자는 자간을 좁힌다 (숫자 사이 틈 = 숫자 높이의 4~8%)
 * - 날짜 줄은 시계 바로 위에 바짝 (틈 ≤ 12px)
 */
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import ZoomableImage from '@/components/invitation/ZoomableImage'
import { YouTubeLite } from '@/components/invitation/YouTubeLite'
import { loadKakaoMapSDK } from '@/lib/geunnalKakaoMap'
import { getBgmPresetByUrl } from '@/lib/bgmPresets'
import {
  krPhoneFamily, homePagesOf, FOLDER_DEFAULT_APPS, defaultSearchItems, youtubeId, APP_META, GRID, PHONE_W, SIZE_SPAN, POSTER_PHOTO_H,
  cellX, cellY, cellHFor, spanH, spanW, ddayCount, PHONE_H, ddayText, weddingParts,
  titleFontOf, numberFontOf, titleNames, coverOf, lettersOf, letterLockedUntil, isWeddingDay, LETTER_KINDS, letterHandOf, isDark, themeOf, parseWeddingDate, screenStyle, isEmptyApp, isAppOff, screenCoverOf, foldersOf, withLockNumber, screenText, dockOf, GIFT_TITLE, GIFT_MESSAGE,
  type PhoneAppId, type PhoneData, type PhoneLetter, type PhoneImageSettings, type PhoneScreenId, type PhoneTheme, type PhoneWidget, type PhoneSearchItem, type WidgetSize, type PhoneTitleFont,
} from './phoneTypes'

/* ───────── 우리 노래 재생 ───────── */
const MusicCtx = createContext<{ playing: boolean; toggle: () => void; has?: boolean } | null>(null)
/** 청첩장을 처음 열 때 잠금화면 등장 연출 (화면 켜짐 → 시계가 예식 시각으로 → 알림 도착 → 밀어서 열기 안내) */
const LockIntroCtx = createContext(false)
/** 홈 칸 사이 세로 간격 — 짧은 화면에서는 줄어듦 (위젯 안 글자 맞춤에 씀) */
const GapCtx = createContext<number>(GRID.gapY)
/** 펼친 폴더 · 검색 화면을 그릴 곳 — 홈 위젯을 통째로 줄여도 덮개는 화면 끝까지 */
const OverlayHostCtx = createContext<HTMLElement | null>(null)
/** 사진 크게 보기 · 펼친 폴더처럼 화면을 덮는 창이 열린 동안 — 오른쪽 위 음악 버튼을 숨김 (닫기 버튼과 겹치지 않게) */
const ChromeHideCtx = createContext<((d: number) => void) | null>(null)
function useHideChrome() {
  const bump = useContext(ChromeHideCtx)
  useEffect(() => { if (!bump) return; bump(1); return () => bump(-1) }, [bump])
}
function PfOverlay({ children }: { children: ReactNode }) {
  useHideChrome()
  const host = useContext(OverlayHostCtx)
  return host ? createPortal(children, host) : <>{children}</>
}
const LOCK_INTRO_CSS = `
@keyframes pfWake { 0% { filter: brightness(0); transform: scale(1.05); } 35% { filter: brightness(0.35); } 100% { filter: none; transform: none; } }
@keyframes pfUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes pfPop { 0% { opacity: 0; transform: translateY(26px) scale(0.94); } 60% { opacity: 1; transform: translateY(-4px) scale(1.01); } 100% { opacity: 1; transform: none; } }
@keyframes pfRoll { from { transform: translateY(0); } to { transform: translateY(calc(var(--n) * -1em)); } }
@keyframes pfNudge { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(22px); } 55% { transform: translateX(0); } 70% { transform: translateX(9px); } }
.pf-intro { animation: pfWake 0.9s cubic-bezier(0.22, 0.7, 0.2, 1) both; transform-origin: 50% 40%; }
.pf-intro [data-ed="clock"] > * { animation: pfUp 0.6s cubic-bezier(0.22, 0.7, 0.2, 1) both; }
.pf-intro [data-ed="clock"] > *:nth-child(1) { animation-delay: 0.35s; }
.pf-intro [data-ed="clock"] > *:nth-child(2) { animation-delay: 0.45s; }
.pf-intro [data-ed="clock"] > *:nth-child(n+3) { animation-delay: 1.9s; }
.pf-intro [data-ed="notice"] > * { animation: pfPop 0.6s cubic-bezier(0.22, 0.7, 0.2, 1) 2.15s both; }
.pf-intro .pf-roll { animation: pfRoll 1.15s cubic-bezier(0.25, 0.9, 0.25, 1) both; }
.pf-intro .pf-knob { animation: pfNudge 1.3s ease-in-out 4.2s 2; }
@media (prefers-reduced-motion: reduce) { .pf-intro, .pf-intro * { animation: none !important; } }`
/** 시계 숫자가 지금 시각에서 예식 시각으로 촤르르 돌아감 (처음 열 때만) */
function RollClock({ to }: { to: string }) {
  const intro = useContext(LockIntroCtx)
  const [from, setFrom] = useState<string | null>(null)
  // 지금 시각은 화면에 붙은 뒤에 (서버 그림과 어긋나지 않게)
  useEffect(() => { if (!intro) return; const id = requestAnimationFrame(() => { const d = new Date(); setFrom(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`) }); return () => cancelAnimationFrame(id) }, [intro])
  if (!intro || !from) return <>{to}</>
  const f = to.length === from.length ? from : from.replace(/^0/, '')
  if (f.length !== to.length) return <>{to}</>
  return <>{to.split('').map((ch, i) => {
    const a = f[i]
    if (!/\d/.test(ch) || !/\d/.test(a)) return <span key={i}>{ch}</span>
    // 한 바퀴 더 돌고 멈춤
    const from0 = +a, to0 = +ch, steps = 10 + ((to0 - from0 + 10) % 10)
    const seq = Array.from({ length: steps + 1 }, (_, k) => (from0 + k) % 10)
    return (
      <span key={i} style={{ display: 'inline-block', height: '1em', overflow: 'hidden', verticalAlign: 'top' }}>
        <span className="pf-roll" style={{ display: 'block', ['--n' as string]: steps, animationDelay: `${0.75 + i * 0.09}s` }}>
          {seq.map((d, j) => <span key={j} style={{ display: 'block', height: '1em', lineHeight: 1 }}>{d}</span>)}
        </span>
      </span>
    )
  })}</>
}

/* ───────── 방명록 — 하객 화면에선 실제 글, 에디터에선 예시 ───────── */
interface GbMsg { id: string; name: string; message: string; at?: string; mine?: boolean }
const GuestbookCtx = createContext<{ list: GbMsg[]; post: (name: string, message: string) => Promise<boolean> } | null>(null)
const GB_SAMPLE: GbMsg[] = [
  { id: 's1', name: '하늘', message: '결혼 진심으로 축하해! 둘이 정말 잘 어울려 🤍' },
  { id: 's2', name: '수빈', message: '청첩장 너무 예쁘다. 그날 꼭 갈게!' },
  { id: 's3', name: '태오', message: '오래오래 지금처럼 웃으면서 살자. 축하한다 친구야' },
  { id: 's4', name: '이모', message: '예쁜 가정 이루길 바란다. 축하해' },
]
function useGuestbook() {
  const ctx = useContext(GuestbookCtx)
  return ctx || { list: GB_SAMPLE, post: async () => false }
}
const gbDate = (at?: string) => { if (!at) return ''; const d = new Date(at); return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일` }

/* ───────── 아이콘 (선 아이콘, 스스로 그림) ───────── */
export function PhoneIcon({ name, color, size = 26, stroke = 1.5 }: { name: string; color: string; size?: number; stroke?: number }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<string, ReactNode> = {
    message: <path {...p} d="M4 5h16v10H9l-5 4z" />,
    photo: <><path {...p} d="M3 5h18v14H3z" /><path {...p} d="M3 16l5-5 4 4 3-3 6 6" /></>,
    memo: <><path {...p} d="M6 3h12v18H6z" /><path {...p} d="M9 8h6M9 12h6M9 16h4" /></>,
    gift: <><path {...p} d="M4 9h16v11H4z M3 6h18v3H3z M12 6v14" /><path {...p} d="M12 6c-2-3-6-3-6 0M12 6c2-3 6-3 6 0" /></>,
    rsvp: <><path {...p} d="M3 6h18v12H3z" /><path {...p} d="M3 6l9 7 9-7" /></>,
    call: <path {...p} d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
    map: <><path {...p} d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle {...p} cx="12" cy="9" r="2.5" /></>,
    music: <><path {...p} d="M9 18V6l11-2v12" /><circle {...p} cx="6.5" cy="18" r="2.5" /><circle {...p} cx="17.5" cy="16" r="2.5" /></>,
    back: <path {...p} d="M14.5 3.5L6.5 12l8 8.5" />,
    send: <path {...p} d="M20.5 3.5L3.5 10.2l6.6 2.9 2.9 6.6zM10.1 13.1l4.6-4.6" />,
    copy: <><path {...p} d="M9 9h11v11H9z" /><path {...p} d="M5 15H4V4h11v1" /></>,
    calendar: <><rect {...p} x="3" y="5" width="18" height="16" rx="3" /><path {...p} d="M3 10h18M8 3v4M16 3v4" /></>,
    check: <path {...p} d="M5 12.5l4.5 4.5L19 7.5" />,
    close: <path {...p} d="M6 6l12 12M18 6L6 18" />,
    question: <><path {...p} d="M9.2 9a3 3 0 1 1 4.3 2.7c-.9.4-1.5 1.2-1.5 2.2v.6" /><circle cx="12" cy="18" r="1" fill={color} /></>,
    play: <path d="M8 5.5v13l11-6.5z" fill={color} />,
    chevron: <path {...p} d="M9 5l7 7-7 7" />,
    star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill={color} />,
    camera: <><path {...p} d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z" /><circle {...p} cx="12" cy="13.3" r="3.4" /></>,
    pen: <><path {...p} d="M4 20h4L19 9l-4-4L4 16z" /><path {...p} d="M13.5 6.5l4 4" /></>,
    heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill={color} />,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>{paths[name] || paths.memo}</svg>
}

/* ───────── 사진 ───────── */
function Photo({ src, crop, style, empty, mono }: { src?: string; crop?: PhoneImageSettings; style?: CSSProperties; empty?: ReactNode; mono?: boolean }) {
  const st: CSSProperties = { ...style, ...(mono ? { filter: 'grayscale(1) contrast(1.02)' } : null) }
  if (!src) return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>{empty}</div>
  if (crop && (crop.cropWidth || crop.scale)) return <CroppedImageDiv src={src} crop={crop} className="w-full h-full" style={st} />
  return <div style={{ width: '100%', height: '100%', backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center 30%', ...st }} />
}

/* ───────── 글꼴 도우미 ───────── */
/** 숫자 — 숫자 '높이'(cap)로 크기를 정한다. 글꼴마다 같은 높이로 보이게 */
function numCss(data: PhoneData, cap: number): CSSProperties {
  const f = numberFontOf(data)
  return { fontFamily: f.family, fontWeight: f.weight, letterSpacing: f.letterSpacing, fontVariantNumeric: 'lining-nums tabular-nums', fontSize: Math.round(cap / f.capRatio), lineHeight: 1, whiteSpace: 'nowrap' }
}
/** 시계 숫자 높이 — 원하는 높이와 '폭 한도' 중 작은 쪽 (레퍼런스: 보통 시계 폭 ≤ 화면 66%, 큰 시계 ≤ 86%) */
function clockCap(data: PhoneData, want: number, maxW: number) {
  return Math.min(want, maxW / numberFontOf(data).clockW)
}
function titleCss(data: PhoneData, size: number): CSSProperties {
  const f = titleFontOf(data)
  return { fontFamily: f.family, fontWeight: f.weight, letterSpacing: f.letterSpacing, fontSize: Math.round(size * f.scale), lineHeight: 1.05 }
}
/** 고른 한글 본문 글꼴을 화면 전체에 — 폰 앱 모양 화면(시스템 글꼴 자리)까지 --pf-body 로 넘김 */
function BodyFont({ data, children }: { data: PhoneData; children: ReactNode }) {
  const kr = krPhoneFamily(data.phone.fonts?.body)
  if (!kr) return <>{children}</>
  return <div style={{ display: 'contents', ['--pf-body' as string]: kr } as CSSProperties}>{children}</div>
}
/** 글자 폭 대략값(em) — 긴 이름은 한 줄에 들어가게 줄인다 */
const TITLE_W: Record<PhoneTitleFont, number> = { instrument: 0.4, cormorant: 0.43, playfair: 0.5, bodoni: 0.52, script: 0.42, gothic: 0.92 }
function fitTitle(data: PhoneData, text: string, maxW: number, maxSize: number) {
  const id = data.phone.fonts?.title || 'instrument'
  const f = titleFontOf(data)
  const est = Math.max(1, text.length) * TITLE_W[id] * f.scale
  return Math.max(26, Math.min(maxSize, maxW / est))
}
/** 영문 큰 글자는 고른 제목 글꼴(세리프 등)로, 한글은 본문 고딕 굵게 — 한글 글꼴이 섞여 보이지 않게 */
const isLatin = (s: string) => /^[\x20-\x7E\u00C0-\u024F♥·]+$/.test(s.trim())
function displayCss(data: PhoneData, text: string, size: number): CSSProperties {
  if (isLatin(text) && titleFontOf(data).latin) return { ...titleCss(data, size * 1.22), lineHeight: 1.05 }
  return { fontSize: size, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }
}
const firstName = (n: string) => (n.length === 3 ? n.slice(1) : n)
const givenName = (p: PhoneData['groom'], fallback: string) => p.firstName || firstName(p.name || fallback)

/* ───────── 위젯 ───────── */
export function WidgetView({ w, data, t: theme, onOpenApp, editing, ch = GRID.cellH }: { w: PhoneWidget; data: PhoneData; t: PhoneTheme; onOpenApp?: (a: PhoneAppId) => void; editing?: boolean; ch?: number }) {
  // 바탕 투명 — 칸 색 · 테두리 없이, 글자는 홈 바탕 글자색으로
  // 위젯마다 꾸민 칸 — 바탕색(진하기) · 바탕 사진. 글자색은 바탕에 맞춰 자동
  const own = !w.props.clear && (w.props.bg || w.props.bgImg)
  const alpha = Math.max(0, Math.min(100, w.props.bgAlpha ?? 100)) / 100
  const ownBg = w.props.bg ? (() => { const h = w.props.bg!.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})` })() : 'transparent'
  const ownInk = w.props.bgImg ? '#FFFFFF' : alpha < 0.45 ? theme.ink : isDark(w.props.bg || '#FFFFFF') ? '#FFFFFF' : '#1F1F1F'
  const t: PhoneTheme = w.props.clear
    ? { ...theme, card: 'transparent', cardBorder: 'rgba(0,0,0,0)', cardInk: theme.ink, cardSub: theme.sub, icon: 'transparent', iconBorder: 'rgba(0,0,0,0)', iconInk: theme.labelInk }
    : own
      ? { ...theme, card: ownBg, cardBorder: 'rgba(0,0,0,0)', cardInk: ownInk, cardSub: ownInk === '#FFFFFF' ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.55)', icon: ownBg, iconBorder: 'rgba(0,0,0,0)', iconInk: ownInk }
      : theme
  // 배경음악 재생 중인지 — 음악 위젯이 켜짐 · 꺼짐을 보여 줌
  const music = useContext(MusicCtx)
  const gbList = useGuestbook().list
  const letterUnread = useLetterUnread(data)
  const revealing = useContext(HomeRevealCtx) && !editing
  const gy = useContext(GapCtx)
  // 홈 위젯 숫자 — 잠금화면 시계보다 한 단계 작고 가볍게 (산세리프는 굵기 500)
  const wn = (cap: number): CSSProperties => {
    const c = numCss(data, Math.round(cap * 0.86))
    return numberFontOf(data).weight === 600 ? { ...c, fontWeight: 500, letterSpacing: '-0.02em' } : c
  }
  const accent = data.phone.accent
  // 글자에 쓰는 포인트 색 — 따로 고를 수 있고, 사진 위(글래스)에서는 기본으로 밝은 글자색
  // 포인트 글자색 — 칸을 따로 꾸몄고 글자가 흰색이면(어두운 칸 · 사진) 흰빛으로
  const tAccent = own && t.cardInk === '#FFFFFF' ? t.cardSub : data.phone.accentText || (t.homeBg === 'photo' || isDark(t.card) ? t.cardSub : accent)
  const wp = weddingParts(data)
  const big = w.size === 'L'
  const wide = w.size === 'W'
  const mono = w.props.mono ?? false
  const card: CSSProperties = { width: '100%', height: '100%', borderRadius: 22, background: t.card, border: `1px solid ${t.cardBorder}`, color: t.cardInk, boxSizing: 'border-box', overflow: 'hidden' }
  if (w.props.bgImg && !w.props.clear) Object.assign(card, { backgroundColor: 'transparent', backgroundImage: `linear-gradient(rgba(0,0,0,${0.12 + (1 - alpha) * 0.5}), rgba(0,0,0,${0.32 + (1 - alpha) * 0.4}))` })
  const dateLine = wp.d ? `${wp.year}. ${wp.month}. ${wp.day} ${wp.dayKo}` : '예식일을 입력해 주세요'
  const fallbackPhoto = w.props.src || data.gallery.images[0] || data.phone.wallpaper
  const tap = (a: PhoneAppId) => (editing ? undefined : () => onOpenApp?.(a))

  switch (w.type) {
    case 'dday': {
      const n = ddayText(ddayCount(data.wedding.date))
      const pair = `${givenName(data.groom, '신랑')} ♡ ${givenName(data.bride, '신부')}`
      if (w.variant === 5) {
        // 사진 — 사진 위에 하트 · 날짜, 오른쪽 아래 큰 D-day (디데이 앱 위젯처럼)
        const ph = w.props.src || data.gallery.images[0] || data.phone.wallpaper
        const sm = w.size === 'S'
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: sm ? 16 : 22, overflow: 'hidden', position: 'relative', background: '#3A3A3A', color: '#FFFFFF' }}>
            {ph && <Photo src={ph} crop={w.props.src ? w.props.crop : undefined} mono={mono} />}
            <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)' }} />
            <span style={{ position: 'absolute', left: sm ? 8 : 12, top: sm ? 8 : 11, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <PhoneIcon name="heart" color="#FFFFFF" size={sm ? 12 : 16} />
              {!sm && <span style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.85, fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{wp.d ? `${wp.monthEn?.slice(0, 3)} ${wp.day}, ${wp.year} (${(wp.dayEn || '').slice(0, 3)})` : ''}</span>}
            </span>
            <span style={{ position: 'absolute', right: sm ? 8 : 12, bottom: sm ? 6 : 10, ...wn(sm ? 12 : wide ? 18 : 20), fontWeight: 600, textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}><CountUp text={n} on={revealing} font={data.phone.fonts.number} /></span>
          </div>
        )
      }
      if (w.size === 'H' && w.variant !== 5) {
        // 2×1 — 한 줄 높이에 맞춘 작은 디데이 (모양마다)
        const label = w.props.label || '우리 결혼식까지'
        const num = <CountUp text={n} on={revealing} font={data.phone.fonts.number} />
        if (w.variant === 1) return (
          // 숫자만 — 칸 없이
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.ink, gap: 2 }}>
            <span style={wn(28)}>{num}</span>
            <span style={{ fontSize: 11, color: t.sub }}>{label}</span>
          </div>
        )
        if (w.variant === 2) {
          // 링 — 왼쪽 원 · 오른쪽 숫자
          const dn = Math.max(0, Math.min(365, Number(n.replace(/\D/g, '')) || 0))
          const R = 17, C = 2 * Math.PI * R
          return (
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
              <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden style={{ flexShrink: 0 }}>
                <circle cx="21" cy="21" r={R} fill="none" stroke={t.cardSub} strokeOpacity={0.18} strokeWidth="3.5" />
                <circle cx="21" cy="21" r={R} fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (dn / 365)} transform="rotate(-90 21 21)" />
              </svg>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, color: t.cardSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                <span style={wn(22)}>{num}</span>
              </span>
            </div>
          )
        }
        if (w.variant === 3) return (
          // 타일 — 두 사람 이름 + 숫자
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, textAlign: 'center', padding: '0 10px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{pair}</span>
            <span style={wn(22)}>{hy(n, data.phone.fonts.number)}</span>
          </div>
        )
        if (w.variant === 4) {
          // 플립 — 남은 날만 넘김 숫자로
          return <DdayFlipHalf data={data} t={t} label={label} />
        }
        return (
          // 카드 — 위 문구 · 아래 큰 숫자 · 날짜
          <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 16px', gap: 2 }}>
            <span style={{ fontSize: 11, color: t.cardSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
              <span style={wn(24)}>{num}</span>
              {wp.d && <span style={{ fontSize: 10.5, color: t.cardSub, whiteSpace: 'nowrap' }}>{wp.month}. {wp.day}</span>}
            </span>
          </div>
        )
      }
      if (w.size === 'S') {
        // 1×1 — 모양마다 다르게
        const head = n === 'D-DAY' ? 'TODAY' : n.startsWith('D+') ? 'SINCE' : 'D-DAY'
        const v = n === 'D-DAY' ? '♥' : n.slice(2)
        if (w.variant === 1) return (
          // 숫자만 — 칸 없이 큰 숫자
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.ink }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: t.sub, letterSpacing: '0.04em' }}>D-</span>
            <span style={wn(v.length > 3 ? 18 : 22)}><CountUp text={v} on={revealing} /></span>
          </div>
        )
        if (w.variant === 2) {
          // 링 — 남은 날만큼 비어 가는 원 (1년 기준)
          const dn = Math.max(0, Math.min(365, Number(v) || 0))
          const R = 24, C = 2 * Math.PI * R
          return (
            <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden style={{ position: 'absolute' }}>
                <circle cx="30" cy="30" r={R} fill="none" stroke={t.cardSub} strokeOpacity={0.18} strokeWidth="4" />
                <circle cx="30" cy="30" r={R} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (dn / 365)} transform="rotate(-90 30 30)" />
              </svg>
              <span style={wn(v.length > 3 ? 11 : 13)}>{v}</span>
            </div>
          )
        }
        if (w.variant === 3) return (
          // 타일 — 하트 + 숫자
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <PhoneIcon name="heart" color={accent} size={14} />
            <span style={wn(v.length > 3 ? 13 : 15)}>{hy(n, data.phone.fonts.number)}</span>
          </div>
        )
        if (w.variant === 4) return (
          // 플립 — 흰 칸 하나에 숫자, 아래 D-DAY
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: t.ink }}>
            <FlipTile v={v} w={Math.max(42, v.length * 14 + 10)} h={38} data={data} />
            <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', color: t.sub }}>{head}</span>
          </div>
        )
        return (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', color: tAccent }}>{head}</span>
            <span style={wn(17)}><CountUp text={v} on={revealing} /></span>
          </div>
        )
      }
      if (w.variant === 4) return <DdayFlip data={data} wide={wide} t={t} label={w.props.label || '우리 결혼식까지'} sec={!w.props.hideSec} />
      if (w.variant === 3) return (
        // 숫자 타일 — 두 사람 이름과 숫자만 (레퍼런스: baby ♡ 46)
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: wide ? 2 : 6, textAlign: 'center' }}>
          <span style={{ fontSize: wide ? 13 : 14, fontWeight: 600 }}>{w.props.label && w.props.label !== '우리 결혼식까지' ? w.props.label : pair}</span>
          <span style={wn(wide ? 20 : 28)}>{hy(n, data.phone.fonts.number)}</span>
        </div>
      )
      if (w.variant === 1) return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: wide ? 'flex-start' : 'center', color: t.ink, padding: wide ? '0 6px' : 0 }}>
          <span style={wn(wide ? 34 : 44)}><CountUp text={n} on={revealing} font={data.phone.fonts.number} /></span>
          <span style={{ fontSize: 12, marginTop: 8, color: t.sub }}>{w.props.label || '우리 결혼식까지'}</span>
        </div>
      )
      if (w.variant === 2) {
        // 링 — 남은 날만큼 비어 가는 원 (1년 기준, 1×1 과 같은 방식)
        const dn = Math.max(0, Math.min(365, Number(n.replace(/\D/g, '')) || 0))
        const sz = wide ? 46 : 104, sw = wide ? 3.5 : 6, R = (sz - sw) / 2, C = 2 * Math.PI * R
        const ring = (
          <span style={{ position: 'relative', width: sz, height: sz, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} aria-hidden style={{ position: 'absolute', inset: 0 }}>
              <circle cx={sz / 2} cy={sz / 2} r={R} fill="none" stroke={t.cardSub} strokeOpacity={0.18} strokeWidth={sw} />
              <circle cx={sz / 2} cy={sz / 2} r={R} fill="none" stroke={accent} strokeWidth={sw} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (dn / 365)} transform={`rotate(-90 ${sz / 2} ${sz / 2})`} style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
            </svg>
            {wide ? <PhoneIcon name="heart" color={accent} size={16} /> : <span style={wn(20)}><CountUp text={n} on={revealing} font={data.phone.fonts.number} /></span>}
          </span>
        )
        return (
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexDirection: wide ? 'row' : 'column' }}>
            {ring}
            {wide && <span style={wn(26)}>{hy(n, data.phone.fonts.number)}</span>}
            <span style={{ fontSize: 11.5, color: t.cardSub }}>{w.props.label || '우리 결혼식까지'}</span>
          </div>
        )
      }
      return (
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', justifyContent: wide ? 'space-between' : 'flex-start' }}>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: t.cardSub }}>{w.props.label || '우리 결혼식까지'}</span>
          <span style={{ ...wn(wide ? 20 : 22), marginTop: wide ? 0 : 6 }}><CountUp text={n} on={revealing} font={data.phone.fonts.number} /></span>
          {!wide && <span style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <LiveLeft data={data} color={tAccent} />
            <span style={{ fontSize: 12, color: t.cardSub, fontVariantNumeric: 'tabular-nums' }}>{dateLine}</span>
          </span>}
        </div>
      )
    }
    case 'clock': {
      const info = [wp.d ? `${wp.month}월 ${wp.day}일 ${wp.dayKo}요일` : '', data.wedding.venue.name].filter(Boolean)
      const [hh, mm] = (wp.clock || '14:00').split(':').map(Number)
      const ampm = hh < 12 ? 'am' : 'pm'
      const h12 = `${String(hh % 12 || 12).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}`
      if (w.variant === 5) {
        // 알람 — 폰 알람 앱처럼 시각 · 이름 · 켜진 스위치
        const ap = hh < 12 ? '오전' : '오후'
        const h1 = `${hh % 12 || 12}:${String(mm || 0).padStart(2, '0')}`
        const sw = (sc = 1) => (
          <span aria-hidden style={{ width: 44 * sc, height: 26 * sc, borderRadius: 13 * sc, background: accent, position: 'relative', flexShrink: 0, display: 'inline-block' }}>
            <span style={{ position: 'absolute', right: 2 * sc, top: 2 * sc, width: 22 * sc, height: 22 * sc, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
          </span>
        )
        const label = `${givenName(data.groom, '신랑')} ♥ ${givenName(data.bride, '신부')} 결혼식`
        if (w.size === 'S') return (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="13" r="7.5" fill="none" stroke={tAccent} strokeWidth="2" /><path d="M12 9.5V13l2.2 1.6M4.5 5.5l3-2.2M19.5 5.5l-3-2.2" fill="none" stroke={tAccent} strokeWidth="2" strokeLinecap="round" /></svg>
            <span style={wn(12)}>{h1}</span>
          </div>
        )
        if (w.size === 'M') return (
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: tAccent, display: 'flex', alignItems: 'center', gap: 4 }}><svg width="13" height="13" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="13" r="7.5" fill="none" stroke={tAccent} strokeWidth="2.2" /><path d="M12 9.5V13l2.2 1.6M4.5 5.5l3-2.2M19.5 5.5l-3-2.2" fill="none" stroke={tAccent} strokeWidth="2.2" strokeLinecap="round" /></svg>알람</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{ap}</span><span style={{ ...wn(30), fontWeight: 300 }}>{h1}</span></span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ fontSize: 11, color: t.cardSub, lineHeight: 1.3, minWidth: 0 }}>{wp.month}월 {wp.day}일<br />결혼식</span>
              {sw(0.85)}
            </span>
          </div>
        )
        const big2 = w.size === 'L'
        return (
          <div style={{ ...card, padding: w.size === 'H' ? '0 12px' : '0 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: big2 ? 8 : 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={{ fontSize: big2 ? 18 : w.size === 'H' ? 11 : 14, fontWeight: 500 }}>{ap}</span><span style={{ ...wn(big2 ? 46 : w.size === 'H' ? 19 : 30), fontWeight: 300 }}>{h1}</span></span>
                {w.size !== 'H' && <span style={{ display: 'block', fontSize: big2 ? 14 : 12, color: t.cardSub, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}, {wp.month}월 {wp.day}일 {wp.dayKo}요일</span>}
              </span>
              {sw(w.size === 'H' ? 0.75 : big2 ? 1.15 : 1)}
            </span>
            {big2 && <span style={{ borderTop: `0.5px solid ${t.cardSub}`, opacity: 0.6, paddingTop: 8, fontSize: 12, color: t.cardSub }}>{data.wedding.venue.name} · {ddayText(ddayCount(data.wedding.date))}</span>}
          </div>
        )
      }
      if (w.size === 'H') {
        // 2×1 — 모양마다 다르게
        const md = `${wp.month}.${wp.day} ${(wp.dayEn || '').slice(0, 3).toUpperCase()}`
        if (w.variant === 1) return (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: t.ink }}>
            <span style={wn(22)}>{wp.clock || '14:00'}</span>
            <span style={{ fontSize: 10.5, color: t.sub, letterSpacing: '0.04em' }}>{md}</span>
          </div>
        )
        if (w.variant === 2) return (
          <div style={{ ...card, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "var(--font-courier-prime), 'Courier Prime', monospace", fontWeight: 700 }}>
            <span style={{ fontSize: 22, letterSpacing: '-0.04em' }}>{h12}<span style={{ fontSize: 12 }}> {ampm}</span></span>
            <span style={{ fontSize: 10.5, textAlign: 'right', lineHeight: 1.25 }}>{(wp.dayEn || '').slice(0, 3).toUpperCase()}<br />{wp.monthEn?.slice(0, 3)} {wp.day}</span>
          </div>
        )
        if (w.variant === 3) return (
          <div style={{ ...card, padding: '9px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, minWidth: 0 }}><PhoneIcon name="map" color={t.cardInk} size={12} stroke={2} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.wedding.venue.name || '예식장'}</span></span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}><span style={wn(18)}>{wp.clock || '14:00'}</span><span style={{ fontSize: 10.5, fontWeight: 600 }}>{hh < 12 ? '오전' : '오후'}</span></span>
          </div>
        )
        if (w.variant === 4) return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', color: t.ink }}>
            <span style={{ display: 'flex', gap: 4 }}><FlipTile v={String(hh).padStart(2, '0')} w={34} h={36} data={data} /><FlipTile v={String(mm || 0).padStart(2, '0')} w={34} h={36} data={data} /></span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: t.sub, textAlign: 'right', lineHeight: 1.4 }}>{(wp.dayEn || '').slice(0, 3).toUpperCase()}<br />{(wp.monthEn || '').slice(0, 3).toUpperCase()} {wp.day}</span>
          </div>
        )
        return (
          <div style={{ ...card, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={wn(20)}>{wp.clock || '14:00'}</span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: tAccent, letterSpacing: '0.08em' }}>WEDDING</span>
              <span style={{ fontSize: 11, color: t.cardSub }}>{md}</span>
            </span>
          </div>
        )
      }
      if (w.size === 'S') {
        // 1×1 — 모양마다 다르게
        if (w.variant === 0) {
          // 바늘 시계 — 예식 시각을 가리킴
          const ha = ((hh % 12) + (mm || 0) / 60) * 30, ma = (mm || 0) * 6
          return (
            <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="58" height="58" viewBox="0 0 60 60" aria-hidden>
                <circle cx="30" cy="30" r="28" fill={isDark(t.card === 'transparent' ? theme.bg : t.card) ? '#1C1C1E' : '#FFFFFF'} stroke={t.cardSub} strokeOpacity={0.25} />
                {Array.from({ length: 12 }, (_, k) => <line key={k} x1="30" y1="5" x2="30" y2={k % 3 === 0 ? 10 : 8} stroke={t.cardInk} strokeOpacity={k % 3 === 0 ? 0.8 : 0.35} strokeWidth={k % 3 === 0 ? 2 : 1.2} transform={`rotate(${k * 30} 30 30)`} />)}
                <line x1="30" y1="30" x2="30" y2="16" stroke={t.cardInk} strokeWidth="3" strokeLinecap="round" transform={`rotate(${ha} 30 30)`} />
                <line x1="30" y1="30" x2="30" y2="9" stroke={t.cardInk} strokeWidth="2" strokeLinecap="round" transform={`rotate(${ma} 30 30)`} />
                <circle cx="30" cy="30" r="2.6" fill={accent} />
              </svg>
            </div>
          )
        }
        if (w.variant === 1) return (
          // 가운데 — 칸 없이 시각 + 날짜
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: t.ink }}>
            <span style={wn(15)}>{wp.clock || '14:00'}</span>
            <span style={{ fontSize: 9.5, color: t.sub, letterSpacing: '0.04em' }}>{wp.month}.{wp.day} {(wp.dayEn || '').slice(0, 3)}</span>
          </div>
        )
        if (w.variant === 2) return (
          // 타자기
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-courier-prime), 'Courier Prime', monospace", fontWeight: 700 }}>
            <span style={{ fontSize: 17, letterSpacing: '-0.04em', lineHeight: 1 }}>{h12}</span>
            <span style={{ fontSize: 11 }}>{ampm}</span>
          </div>
        )
        if (w.variant === 3) return (
          // 날씨형 — 핀 + 시각
          <div style={{ ...card, padding: '8px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <PhoneIcon name="map" color={tAccent} size={13} stroke={2} />
            <span style={wn(14)}>{wp.clock || '14:00'}</span>
          </div>
        )
        return (
          // 플립 — 시 · 분 작은 칸 두 개
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: t.ink }}>
            <span style={{ display: 'flex', gap: 3 }}><FlipTile v={String(hh).padStart(2, '0')} w={30} h={30} data={data} /><FlipTile v={String(mm || 0).padStart(2, '0')} w={30} h={30} data={data} /></span>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', color: t.sub }}>{(wp.dayEn || '').slice(0, 3).toUpperCase()}</span>
          </div>
        )
      }
      if (w.size === 'M' && w.variant !== 4) {
        const mono2: CSSProperties = { fontFamily: "var(--font-courier-prime), 'Courier Prime', monospace", fontWeight: 700, fontVariantNumeric: 'tabular-nums' }
        if (w.variant === 1) return (
          // 가운데 — 칸 없이 큰 시각
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: t.ink }}>
            <span style={wn(30)}>{wp.clock || '14:00'}</span>
            <span style={{ fontSize: 11.5, color: t.sub }}>{wp.d ? `${wp.month}월 ${wp.day}일 ${wp.dayKo}요일` : ''}</span>
          </div>
        )
        if (w.variant === 2) return (
          // 타자기
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ ...mono2, fontSize: 28, letterSpacing: '-0.04em', lineHeight: 1 }}>{h12}<span style={{ fontSize: 15 }}> {ampm}</span></span>
            <span style={{ ...mono2, fontSize: 12, lineHeight: 1.3 }}>{wp.dayFull.toUpperCase()}<br />{wp.monthEn} {wp.day}</span>
          </div>
        )
        if (w.variant === 3) return (
          // 날씨형 — 위 장소, 아래 큰 시각
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><PhoneIcon name="map" color={t.cardInk} size={13} stroke={2} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.wedding.venue.name || '예식장'}</span></span>
            <span>
              <span style={{ display: 'block', fontSize: 11.5, color: t.cardSub }}>{wp.d ? `${wp.month}월 ${wp.day}일 ${wp.dayKo}요일` : ''}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}><span style={wn(26)}>{wp.clock || '14:00'}</span><span style={{ fontSize: 11, fontWeight: 600 }}>{hh < 12 ? '오전' : '오후'}</span></span>
            </span>
          </div>
        )
        return (
          // 왼쪽 정렬
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: tAccent, letterSpacing: '0.08em' }}>WEDDING DAY</span>
            <span style={wn(28)}>{wp.clock || '14:00'}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: 11.5, color: t.cardSub }}>{info.map((x, k) => <span key={k} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x}</span>)}</span>
          </div>
        )
      }
      if (w.variant === 4) {
        // 플립 — 둥근 흰 칸 두 개에 시 · 분, 위에 요일 · 아래 날짜 (레퍼런스: SÁBADO / 22 32 / ABRIL, 11)
        const tw = w.size === 'M' ? 54 : big ? 78 : 44
        const tile = (v: string) => (
          <span style={{ position: 'relative', width: tw, height: tw * 0.96, borderRadius: tw * 0.2, background: '#FFFFFF', color: '#1C1C1E', boxShadow: '0 1px 1px rgba(0,0,0,0.05), 0 8px 18px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <span style={{ ...wn(tw * 0.42), color: '#1C1C1E' }}>{v}</span>
            <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.07)' }} />
          </span>
        )
        const tiles = <span style={{ display: 'flex', gap: tw * 0.12 }}>{tile(String(hh).padStart(2, '0'))}{tile(String(mm || 0).padStart(2, '0'))}</span>
        const sub: CSSProperties = { fontSize: w.size === 'M' ? 11 : 11.5, fontWeight: 600, letterSpacing: '0.14em', color: t.sub }
        if (wide) return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', color: t.ink }}>
            {tiles}
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={sub}>{wp.dayFull.toUpperCase()}</span>
              <span style={{ ...sub, color: t.ink }}>{(wp.monthEn || '').toUpperCase()}, {wp.day}</span>
            </span>
          </div>
        )
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: t.ink }}>
            <span style={sub}>{wp.dayFull.toUpperCase()}</span>
            {tiles}
            <span style={sub}>{(wp.monthEn || '').toUpperCase()}, {wp.day}</span>
          </div>
        )
      }
      if (w.variant === 2) {
        // 타자기 — 10:46 pm / SATURDAY / June 20
        const mono: CSSProperties = { fontFamily: "var(--font-courier-prime), 'Courier Prime', monospace", fontWeight: 700, fontVariantNumeric: 'tabular-nums' }
        return (
          <div style={{ ...card, padding: big ? '18px 24px' : '0 20px', display: 'flex', flexDirection: big ? 'column' : 'row', justifyContent: big ? 'center' : 'space-between', alignItems: big ? 'flex-start' : 'center' }}>
            <span style={{ ...mono, fontSize: big ? 50 : 32, lineHeight: 1, letterSpacing: '-0.04em' }}>{h12} <span style={{ fontSize: big ? 30 : 18 }}>{ampm}</span></span>
            <span style={{ ...mono, display: 'flex', flexDirection: 'column', alignItems: big ? 'flex-start' : 'flex-end', marginTop: big ? 10 : 0, fontSize: big ? 18 : 12, lineHeight: 1.15 }}>
              <span>{wp.dayFull.toUpperCase()}</span>
              <span style={{ fontSize: big ? 24 : 14 }}>{wp.monthEn} {wp.day}</span>
            </span>
          </div>
        )
      }
      if (w.variant === 3) return (
        // 날씨형 — 위에 날짜 · 장소, 가운데 큰 시각
        <div style={{ ...card, padding: big ? '18px 20px' : '10px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
            <span>{wp.d ? `${wp.month}월 ${wp.day}일 ${wp.dayKo}요일` : '예식일'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: t.cardSub, fontWeight: 600, maxWidth: '50%', overflow: 'hidden', whiteSpace: 'nowrap' }}><PhoneIcon name="map" color={accent} size={13} stroke={2} />{data.wedding.venue.name || '예식장'}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: big ? 40 : 26, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{wp.clock || '14:00'} <span style={{ fontSize: big ? 15 : 12, fontWeight: 600 }}>{hh < 12 ? '오전' : '오후'}</span></span>
            {big && <span style={{ fontSize: 13, fontWeight: 700, color: tAccent }}>{ddayText(ddayCount(data.wedding.date))}</span>}
          </span>
        </div>
      )
      if (w.variant === 1) return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.ink }}>
          <span style={wn(big ? 64 : 40)}>{wp.clock || '14:00'}</span>
          <span style={{ marginTop: 8, fontSize: 13, color: t.sub }}>{info.join(' · ')}</span>
        </div>
      )
      return (
        <div style={{ ...card, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={wn(big ? 40 : 24)}>{wp.clock || '14:00'}</span>
          {/* 오른쪽 끝에 붙여 가운데가 비지 않게 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: tAccent, letterSpacing: '0.08em' }}>WEDDING DAY</span>
            {info.map((s, i) => <span key={i} style={{ fontSize: 13, color: i ? t.cardSub : t.cardInk, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>)}
          </div>
        </div>
      )
    }
    case 'calendar': {
      if (!wp.d) return <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: t.cardSub }}>예식일을 입력해 주세요</div>
      if (w.size === 'S') {
        // 1×1 — 모양마다 다르게
        if (w.variant === 1) return (
          // 큰 날짜 — 칸 없이 요일 + 큰 숫자
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.ink }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', color: t.sub }}>{(wp.dayEn || '').slice(0, 3)}</span>
            <span style={wn(26)}>{wp.day}</span>
          </div>
        )
        if (w.variant === 2) return (
          // 일정 — 날짜 + 예식 시각 한 줄
          <div style={{ ...card, padding: '9px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={wn(18)}>{wp.day}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600 }}><span style={{ width: 3, height: 11, borderRadius: 2, background: accent }} />{wp.clock}</span>
          </div>
        )
        return (
          // 달력 — 폰 달력 아이콘처럼 위에 월 띠
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ width: '100%', padding: '5px 0 3px', textAlign: 'center', background: accent, color: '#FFFFFF', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em' }}>{(wp.monthEn || '').slice(0, 3).toUpperCase()}</span>
            <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}><span style={wn(22)}>{wp.day}</span></span>
          </div>
        )
      }
      if (wide && w.variant === 1) return (
        // 4×1 큰 날짜 — 칸 없이 큰 숫자 + 요일 · 월
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '0 6px', color: t.ink }}>
          <span style={wn(34)}>{wp.day}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{wp.dayFull}</span>
            <span style={{ fontSize: 11.5, color: t.sub, letterSpacing: '0.04em' }}>{wp.monthEn} {wp.year}</span>
          </span>
        </div>
      )
      if (wide && w.variant === 2) return (
        // 4×1 일정 — 캘린더 일정 한 줄
        <div style={{ ...card, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 4, alignSelf: 'stretch', margin: '16px 0', borderRadius: 2, background: accent }} />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{givenName(data.groom, '신랑')} ♥ {givenName(data.bride, '신부')} 결혼식</span>
            <span style={{ fontSize: 12, color: t.cardSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wp.month}월 {wp.day}일 {wp.timeShort || ''} · {data.wedding.venue.name}</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: tAccent }}>{ddayText(ddayCount(data.wedding.date))}</span>
        </div>
      )
      if (wide) {
        // 4×1 — 왼쪽 날짜, 오른쪽 그 주 7일
        const start = new Date(wp.d); start.setDate(wp.day! - wp.d.getDay())
        const week = Array.from({ length: 7 }, (_, k) => { const x = new Date(start); x.setDate(start.getDate() + k); return x })
        return (
          <div style={{ ...card, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 54 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: tAccent }}>{wp.monthEn.slice(0, 3).toUpperCase()}</span>
              <span style={wn(20)}>{wp.year}</span>
            </span>
            <span style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: 2 }}>
              {week.map((x, k) => (
                <span key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 9.5, color: t.cardSub, fontWeight: 600 }}>{'SMTWTFS'[k]}</span>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', background: x.getDate() === wp.day ? t.cardInk : 'transparent', color: x.getDate() === wp.day ? (isDark(t.cardInk) ? '#FFFFFF' : '#1F1F1F') : t.cardInk }}>{x.getDate()}</span>
                </span>
              ))}
            </span>
          </div>
        )
      }
      if (w.variant === 3 && big) {
        // 날짜 + 달력 — 왼쪽 2027 / 05/22 / Sat, 오른쪽 그 달 (레퍼런스)
        const first = new Date(wp.year!, wp.month! - 1, 1).getDay()
        const days = new Date(wp.year!, wp.month!, 0).getDate()
        const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
        return (
          <div style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 104 }}>
              <span style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{wp.year}</span>
              <span style={{ ...wn(26), margin: '8px 0' }}>{String(wp.month).padStart(2, '0')}/{String(wp.day).padStart(2, '0')}</span>
              <span style={{ fontSize: 15 }}>{wp.dayShort}</span>
            </span>
            <span style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', rowGap: 2, fontSize: 10, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {'SMTWTFS'.split('').map((d, i) => <span key={'h' + i} style={{ fontWeight: 700 }}>{d}</span>)}
              {cells.map((x, i) => <span key={i} style={{ lineHeight: '17px' }}>{x === wp.day ? <span style={{ display: 'inline-flex', width: 17, height: 17, borderRadius: '50%', background: t.cardInk, color: isDark(t.cardInk) ? '#FFFFFF' : '#1F1F1F', alignItems: 'center', justifyContent: 'center' }}>{x}</span> : x ?? ''}</span>)}
            </span>
          </div>
        )
      }
      if (w.variant === 1) return (
        <div style={{ ...card, padding: big ? 22 : 18, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: big ? 14 : 12.5, fontWeight: 600, letterSpacing: '0.02em' }}>{(wp.monthEn || '').toUpperCase().slice(0, 3)} {wp.year}</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 6 }}>
            <span style={wn(big ? 46 : 32)}>{wp.day}</span>
            <span style={{ fontSize: big ? 13 : 11, fontWeight: 600, color: t.cardSub, letterSpacing: '0.04em' }}>{(wp.dayEn || '').slice(0, 3)}</span>
          </span>
        </div>
      )
      if (w.variant === 2) return (
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: t.cardSub }}>{wp.dayFull.toUpperCase()}</span>
          <span style={{ ...wn(26), marginTop: 6 }}>{wp.day}</span>
          <div style={{ marginTop: 'auto', borderLeft: `3px solid ${accent}`, paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>결혼식</span>
            <span style={{ fontSize: 11.5, color: t.cardSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums' }}>{[wp.timeShort, data.wedding.venue.name].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
      )
      const first = new Date(wp.year!, wp.month! - 1, 1).getDay()
      const days = new Date(wp.year!, wp.month!, 0).getDate()
      const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
      const fs = big ? 10.5 : 9.5
      return (
        <div style={{ ...card, padding: big ? '12px 18px' : '12px 12px', display: 'flex', flexDirection: 'column', gap: big ? 4 : 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ ...titleCss(data, big ? 20 : 15) }}>{wp.monthEn}</span>
            <span style={{ fontSize: 10.5, color: t.cardSub }}>{wp.year}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: big ? 1 : 2, textAlign: 'center', fontSize: fs, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={'h' + i} style={{ color: t.cardSub }}>{d}</span>)}
            {cells.map((n, i) => (
              <span key={i} style={{ lineHeight: `${fs + (big ? 5 : 7)}px` }}>
                {n === wp.day
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: fs + 9, height: fs + 9, borderRadius: '50%', background: accent, color: '#FFFFFF' }}>{n}</span>
                  : n ?? ''}
              </span>
            ))}
          </div>
        </div>
      )
    }
    case 'photo': {
      if (!fallbackPhoto && !editing) return null
      const empty = <span style={{ fontSize: 11.5, color: t.cardSub }}>{editing ? '사진을 넣어 주세요' : ''}</span>
      const crop = w.props.src ? w.props.crop : undefined
      // 사진 넘기기 — 이 위젯 사진 + 사진첩 사진
      const slides = w.props.slideshow ? Array.from(new Set([w.props.src, ...data.gallery.images].filter(Boolean) as string[])).slice(0, 8) : []
      if (slides.length > 1 && (w.variant === 0 || w.variant === 1 || w.variant === 2)) {
        const inner = <SlidePhotos srcs={slides} mono={mono} />
        if (w.variant === 1) return (
          <div style={{ width: '100%', height: '100%', padding: '8px 8px 26px', background: '#FBFBFA', boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 8px 18px rgba(0,0,0,0.12)', transform: `rotate(${w.props.rotate ?? -2}deg)`, boxSizing: 'border-box' }}>
            <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>{inner}</div>
          </div>
        )
        const r = w.variant === 2 && SIZE_SPAN[w.size].w === SIZE_SPAN[w.size].h ? '50%' : w.size === 'S' ? 16 : 22
        return <div style={{ width: '100%', height: '100%', borderRadius: r, overflow: 'hidden', background: t.card }}>{inner}</div>
      }
      if (w.variant === 1) return (
        <div style={{ width: '100%', height: '100%', padding: '8px 8px 26px', background: '#FBFBFA', boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 8px 18px rgba(0,0,0,0.12)', transform: `rotate(${w.props.rotate ?? -2}deg)`, boxSizing: 'border-box' }}>
          <Photo src={fallbackPhoto} crop={crop} empty={empty} mono={mono} style={{ backgroundColor: '#EEEEEE' }} />
        </div>
      )
      if (w.variant === 3) return (
        <div style={{ width: '100%', height: '100%', borderRadius: '48% 52% 42% 58% / 55% 45% 55% 45%', overflow: 'hidden', border: '7px solid #FFFFFF', boxShadow: '0 6px 16px rgba(0,0,0,0.16)', transform: `rotate(${w.props.rotate ?? -5}deg)`, boxSizing: 'border-box', background: '#EEE' }}>
          <Photo src={fallbackPhoto} crop={crop} empty={empty} mono={mono} />
        </div>
      )
      if (w.variant === 4) {
        // 투명 PNG — 바탕 · 모서리 · 자르기 없이 이미지 그대로 (칸 안에 맞춤)
        if (!w.props.src) return editing ? <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px dashed ${t.cardSub}` }}>{empty}</div> : null
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={w.props.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: mono ? 'grayscale(1)' : undefined, pointerEvents: 'none' }} />
      }
      const radius = w.variant === 2 && SIZE_SPAN[w.size].w === SIZE_SPAN[w.size].h ? '50%' : w.size === 'S' ? 16 : 22
      return <div style={{ width: '100%', height: '100%', borderRadius: radius, overflow: 'hidden', background: t.card }}><Photo src={fallbackPhoto} crop={crop} empty={empty} mono={mono} /></div>
    }
    case 'quote': {
      if (w.variant === 4) {
        const small = w.size === 'M'
        return (
          <div style={{ ...card, padding: small ? 14 : '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontFamily: "var(--font-noto-serif-kr), 'Noto Serif KR', serif", fontWeight: 600, fontSize: small ? 20 : 26, letterSpacing: '-0.02em' }}>{w.props.label || '결혼 (結婚)'}</span>
            <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: small ? 12.5 : 14.5, color: t.cardSub, marginTop: 2 }}>{w.props.title || '[gyeol·hon] noun'}</span>
            <span style={{ width: small ? 70 : 110, height: 1, background: t.cardInk, opacity: 0.8, margin: small ? '8px 0' : '10px 0' }} />
            <span style={{ fontFamily: "var(--font-noto-serif-kr), 'Noto Serif KR', serif", fontSize: small ? 11.5 : 13, lineHeight: 1.65, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{w.props.text || '두 사람이 같은 방향을 보기로 한 약속.'}</span>
          </div>
        )
      }
      if (w.variant === 6) {
        // 인용구 — 좋아하는 문장 + 출처
        const q = w.props.text || '사랑은 서로를 바라보는 것이 아니라\n함께 같은 방향을 바라보는 것이다.'
        const by = w.props.artist ?? '생텍쥐페리'
        const small = w.size === 'M' || w.size === 'S'
        return (
          <div style={{ ...card, padding: small ? 14 : '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: small ? 6 : 8, textAlign: w.props.align || 'left' }}>
            <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: small ? 34 : 42, lineHeight: 0.5, height: small ? 14 : 18, color: tAccent }}>&ldquo;</span>
            <span style={{ fontFamily: "var(--font-noto-serif-kr), 'Noto Serif KR', serif", fontSize: small ? 12.5 : 14.5, lineHeight: 1.7, whiteSpace: 'pre-line', wordBreak: 'keep-all', display: '-webkit-box', WebkitLineClamp: w.size === 'L' ? 7 : small ? 4 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q}</span>
            {by && <span style={{ fontSize: 11.5, color: t.cardSub }}>— {by}</span>}
          </div>
        )
      }
      const text = w.props.text || 'forever starts here'
      const len = text.replace(/\n/g, '').length
      // 사용자가 고른 정렬 · 세로 위치 (없으면 모양마다 기본)
      const ha = w.props.align
      const va = w.props.valign
      const jx = (d: 'left' | 'center' | 'right'): CSSProperties['justifyContent'] => ({ left: 'flex-start', center: 'center', right: 'flex-end' })[ha || d]
      const jy = (d: 'top' | 'middle' | 'bottom'): CSSProperties['alignItems'] => ({ top: 'flex-start', middle: 'center', bottom: 'flex-end' })[va || d]
      const ta = (d: 'left' | 'center' | 'right') => ha || d
      if (w.variant === 5) return (
        // 말풍선 — 메시지 한 통처럼 (레퍼런스)
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: jy('middle'), justifyContent: jx('right'), padding: 4, boxSizing: 'border-box' }}>
          <span style={{ maxWidth: '86%', padding: w.size === 'S' ? '6px 9px' : '9px 13px', borderRadius: '16px 16px 4px 16px', background: t.card, color: t.cardInk, fontSize: w.size === 'S' ? 10.5 : 13, lineHeight: 1.4, whiteSpace: 'pre-line', wordBreak: 'keep-all', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>{text}</span>
        </div>
      )
      if (w.size === 'S') return (
        <div style={{ ...card, padding: 8, display: 'flex', alignItems: jy('middle'), justifyContent: jx('center'), textAlign: ta('center') }}>
          <span style={{ ...titleCss(data, 15), lineHeight: 1.1, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{text}</span>
        </div>
      )
      if (w.variant === 3) {
        const base = w.size === 'M' ? 30 : 38
        const fs = Math.max(18, Math.min(base, Math.round(base * (w.size === 'M' ? 18 : 28) / Math.max(len, 1))))
        return (
          <div style={{ ...card, padding: 18, display: 'flex', alignItems: jy('middle'), justifyContent: jx('left'), textAlign: ta('left') }}>
            <span style={{ fontFamily: "var(--pf-body, 'Pretendard Variable'), sans-serif", fontWeight: 800, fontSize: fs, lineHeight: 1.02, letterSpacing: '-0.04em', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{text}</span>
          </div>
        )
      }
      // 2×1 — 칸이 작아 글자 크기를 줄이고 가운데로
      // 한 줄 칸 — 2×1 · 3×1 (가운데 정렬, 작은 글자)
      const half = w.size === 'H' || w.size === 'U'
      const base = w.size === 'M' ? 30 : w.size === 'L' ? 40 : w.size === 'U' ? 26 : half ? 22 : 30
      const fs0 = Math.max(half ? 15 : 16, Math.min(base, Math.round(base * (w.size === 'M' ? 16 : w.size === 'U' ? 24 : half ? 22 : 26) / Math.max(len, 1))))
      // 영문 · 한글을 줄마다 섞어 쓴 글 — 영문 제목 글꼴은 같은 크기에서 한글보다 훨씬 작아 보여서
      // 영문만 있는 줄은 키우고, 전체 크기는 '가장 긴 줄'과 칸 높이에 맞춰 정함 (전체 글자 수로 줄이지 않음)
      const tLines = text.split(/\n/)
      const hasKo = /[가-힣]/.test(text)
      const mixed = hasKo && /[A-Za-z]/.test(text)
      const latinBoost = (titleFontOf(data).latin ? 1.3 : 1) * (w.props.latinScale ?? 1)
      const userScale = w.props.textScale ?? 1
      const isLatinLine = (l: string) => !/[가-힣]/.test(l) && /[A-Za-z]/.test(l)
      const lineEm = (l: string) => [...l].reduce((n, ch) => n + (/[가-힣]/.test(ch) ? 1 : ch === ' ' ? 0.28 : 0.46 * (isLatinLine(l) ? latinBoost : 1)), 0)
      const fsFit = mixed || (hasKo && tLines.length > 1)
        ? Math.max(11, Math.min(base, Math.floor((spanW(w.size) - (w.variant === 2 ? 32 : 14)) / Math.max(1, ...tLines.map(lineEm))), Math.floor((spanH(w.size, ch) - (GRID.gapY - gy) * (SIZE_SPAN[w.size].h - 1) - (w.variant === 2 ? 30 : 10)) / (tLines.reduce((n, l) => n + (isLatinLine(l) ? latinBoost : 1), 0) * 1.18))))
        : fs0
      // 사용자가 고른 크기 (칸을 넘칠 수 있어 가장자리는 잘리지 않게 줄바꿈)
      const fs = Math.round(fsFit * userScale * 10) / 10
      const quoteBody = mixed
        ? tLines.map((l, k) => <span key={k} style={{ display: 'block', fontSize: isLatinLine(l) ? `${latinBoost}em` : undefined }}>{l || ' '}</span>)
        : text
      if (w.variant === 2) return (
        <div style={{ ...card, padding: half ? '8px 12px' : 16, display: 'flex', alignItems: jy('middle'), justifyContent: jx('center'), textAlign: ta('center') }}>
          <span style={{ ...titleCss(data, Math.min(fs, 26)), lineHeight: 1.2, whiteSpace: 'pre-line' }}>{quoteBody}</span>
        </div>
      )
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: jy('middle'), justifyContent: jx(wide || half ? 'center' : 'left'), padding: '4px 6px', color: t.ink, textAlign: ta(wide || half ? 'center' : 'left'), boxSizing: 'border-box' }}>
          <span style={{ ...titleCss(data, fs), lineHeight: mixed ? 1.15 : 1.05, fontStyle: w.variant === 1 ? 'italic' : 'normal', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{quoteBody}</span>
        </div>
      )
    }
    case 'music': {
      const on = !!music?.playing
      const preset = data.bgm?.enabled && data.bgm.url ? getBgmPresetByUrl(data.bgm.url) : undefined
      const title = w.props.title || preset?.name || '우리의 노래'
      const artist = w.props.artist || (preset ? preset.description : '배경음악')
      const nowLabel = on ? 'NOW PLAYING' : 'MUSIC'
      const art = w.props.src || w.props.bgImg || data.gallery.images[1] || fallbackPhoto
      if (w.variant === 5) {
        // CD 플레이어 — 흰 상자 속 사진 CD (재생하면 돎) + 오른쪽 슬라이더 · 버튼
        const cd = (sz: number) => (
          <span style={{ position: 'relative', width: sz, height: sz, borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.06)', animation: on ? 'pfSpin 4s linear infinite' : undefined, overflow: 'hidden', background: accent }}>
            {art && <Photo src={art} mono={mono} />}
            <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 20deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.35) 30deg, rgba(255,255,255,0) 70deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.22) 210deg, rgba(255,255,255,0) 250deg)' }} />
            <span aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', width: '26%', height: '26%', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'rgba(240,240,240,0.85)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
            <span aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', width: '10%', height: '10%', transform: 'translate(-50%,-50%)', borderRadius: '50%', background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
          </span>
        )
        const box: CSSProperties = { width: '100%', height: '100%', borderRadius: w.size === 'S' ? 16 : 20, background: 'linear-gradient(180deg, #FFFFFF, #F1F0EE)', boxShadow: '0 1px 1px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(0,0,0,0.04)', boxSizing: 'border-box', position: 'relative', color: '#2A2A2A' }
        const screw = (pos: CSSProperties) => <span aria-hidden style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: '#2A2A2A', opacity: 0.75, ...pos }} />
        const controls = (h: number) => (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: h, flexShrink: 0 }}>
            <span style={{ width: 10, flex: 1, borderRadius: 5, background: '#F7F7F5', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)', position: 'relative' }}>
              <span style={{ position: 'absolute', left: -3, right: -3, top: on ? '55%' : '10%', height: 14, borderRadius: 4, background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'top 0.8s ease' }} />
            </span>
            <span style={{ width: 22, height: 22, marginTop: 6, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {on ? <svg width="9" height="9" viewBox="0 0 24 24" aria-hidden><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#2A2A2A" /></svg> : <PhoneIcon name="play" color="#2A2A2A" size={10} />}
            </span>
          </span>
        )
        if (w.size === 'S') return <div style={{ ...box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cd(52)}</div>
        if (w.size === 'H') return (
          <div style={{ ...box, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {cd(48)}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 2.5, height: 18 }}>
              {[0.4, 0.8, 0.55, 1, 0.65, 0.85].map((h, i) => <span key={i} style={{ width: 2.5, height: `${h * 100}%`, borderRadius: 2, background: '#2A2A2A', opacity: on ? 0.75 : 0.25, transformOrigin: 'center', animation: on ? `pfEq ${0.7 + (i % 3) * 0.15}s ease-in-out ${i * 0.08}s infinite alternate` : undefined }} />)}
            </span>
          </div>
        )
        if (w.size === 'M') return (
          <div style={{ ...box, padding: '14px 12px 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {screw({ left: 8, top: 8 })}{screw({ right: 8, top: 8 })}{screw({ left: 8, bottom: 8 })}{screw({ right: 8, bottom: 8 })}
            {cd(104)}
            {controls(104)}
          </div>
        )
        return (
          <div style={{ ...box, padding: wide ? '0 16px 0 12px' : '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            {!wide && <>{screw({ left: 9, top: 9 })}{screw({ right: 9, top: 9 })}{screw({ left: 9, bottom: 9 })}{screw({ right: 9, bottom: 9 })}</>}
            {cd(wide ? 52 : 128)}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#8E8E93' }}>{on ? 'NOW PLAYING' : 'CD'}</span>
              <span style={{ fontSize: wide ? 14 : 17, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
              {!wide && <span style={{ fontSize: 12, color: '#8E8E93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</span>}
            </span>
            {wide
              ? <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on ? <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#2A2A2A" /></svg> : <PhoneIcon name="play" color="#2A2A2A" size={11} />}</span>
              : controls(128)}
          </div>
        )
      }
      if (w.size === 'S') {
        // 1×1 — 카드: 앨범 표지 칸 / 디스크: 도는 LP 판 (가운데 재생 버튼)
        if (w.variant === 3) return (
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'repeating-radial-gradient(circle, #151515 0 1.3px, #2A2A2A 1.3px 2.6px)', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', position: 'relative', animation: on ? 'pfSpin 3.2s linear infinite' : undefined }}>
            <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.2) 35deg, rgba(255,255,255,0) 75deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.13) 215deg, rgba(255,255,255,0) 255deg)' }} />
            <span style={{ position: 'absolute', inset: '30%', borderRadius: '50%', overflow: 'hidden', background: accent }}>{art && <Photo src={art} mono={mono} />}</span>
            <span aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', width: 6, height: 6, transform: 'translate(-50%, -50%)', borderRadius: '50%', background: '#1A1A1A', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.6)' }} />
          </div>
        )
        return <div style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.16)', background: `linear-gradient(160deg, ${accent}, ${accent}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{art ? <Photo src={art} mono={mono} /> : <PhoneIcon name="music" color="#FFFFFF" size={24} stroke={1.8} />}</div>
      }
      if (w.size === 'H') {
        // 2×1 — 작은 표지(디스크면 판이 살짝 보임) + 제목 · 재생 상태
        const s0 = 46
        return (
          <div style={{ ...card, padding: '0 48px 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ position: 'relative', width: w.variant === 3 ? s0 * 1.45 : s0, height: s0, flexShrink: 0 }}>
              {w.variant === 3 && (
                <span style={{ position: 'absolute', left: on ? s0 * 0.42 : s0 * 0.3, transition: 'left 0.6s cubic-bezier(0.32, 0.72, 0, 1)', top: 0, width: s0, height: s0, borderRadius: '50%', background: 'repeating-radial-gradient(circle, #151515 0 1.2px, #2A2A2A 1.2px 2.4px)', animation: on ? 'pfSpin 3.2s linear infinite' : undefined }}>
                  <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.2) 35deg, rgba(255,255,255,0) 75deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.13) 215deg, rgba(255,255,255,0) 255deg)' }} />
                  <span style={{ position: 'absolute', inset: '32%', borderRadius: '50%', overflow: 'hidden' }}><Photo src={art} mono={mono} /></span>
                </span>
              )}
              <span style={{ position: 'absolute', left: 0, top: 0, width: s0, height: s0, borderRadius: w.variant === 2 ? 4 : 9, overflow: 'hidden', boxShadow: '0 3px 8px rgba(0,0,0,0.18)' }}><Photo src={art} mono={mono} /></span>
            </span>
            {/* 칸이 좁아 제목 대신 소리 막대 — 재생하면 출렁임 */}
            <span aria-hidden style={{ flex: 1, minWidth: 0, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5 }}>
              {[0.35, 0.7, 0.5, 0.95, 0.6, 0.8, 0.4, 0.65].map((h, i) => (
                <span key={i} style={{ width: 2.5, height: `${h * 100}%`, borderRadius: 2, background: tAccent, opacity: on ? 0.9 : 0.35, transformOrigin: 'center', animation: on ? `pfEq ${0.7 + (i % 3) * 0.15}s ease-in-out ${i * 0.08}s infinite alternate` : undefined }} />
              ))}
            </span>
          </div>
        )
      }
      if (w.variant === 4) {
        // 재생기 — 앨범 · 제목 · 진행 막대 · 버튼 (레퍼런스: 잠금화면 음악)
        const compact = wide
        const ctl = (sz: number) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: compact ? 14 : 26, color: t.cardInk }}>
            <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true"><path d="M11 6L3 12l8 6zM21 6l-8 6 8 6z" fill={t.cardInk} /></svg>
            <svg width={sz + 4} height={sz + 4} viewBox="0 0 24 24" aria-hidden="true"><path d={on ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M7 4.5v15l12-7.5z'} fill={t.cardInk} /></svg>
            <svg width={sz} height={sz} viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l8 6-8 6zM13 6l8 6-8 6z" fill={t.cardInk} /></svg>
          </span>
        )
        if (compact) return (
          <div style={{ ...card, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}><Photo src={art} mono={mono} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
              <span style={{ display: 'block', height: 3, borderRadius: 2, background: t.cardBorder === 'rgba(0,0,0,0)' ? '#E2E2E2' : t.cardBorder, marginTop: 7 }}><span style={{ display: 'block', width: '38%', height: '100%', borderRadius: 2, background: t.cardInk }} /></span>
            </span>
            {ctl(14)}
          </div>
        )
        return (
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}><Photo src={art} mono={mono} /></span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: t.cardSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</span>
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: t.cardSub, fontVariantNumeric: 'tabular-nums' }}>
              0:52<span style={{ flex: 1, height: 4, borderRadius: 2, background: '#E2E2E2' }}><span style={{ display: 'block', width: '38%', height: '100%', borderRadius: 2, background: t.cardInk }} /></span>−2:14
            </span>
            <span style={{ display: 'flex', justifyContent: 'center' }}>{ctl(20)}</span>
          </div>
        )
      }
      if (w.variant === 1) return (
        <div style={{ ...card, borderRadius: 999, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {on
            ? <span aria-hidden style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, width: 20, justifyContent: 'center' }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 3, height: '100%', borderRadius: 2, background: accent, transformOrigin: 'bottom', animation: `pfEq 0.9s ease-in-out ${i * 0.15}s infinite alternate` }} />)}</span>
            : <PhoneIcon name="music" color={accent} size={20} />}
          <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</span>
          <span style={{ fontSize: 12, color: t.cardSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</span>
        </div>
      )
      if (w.variant === 2) {
        // 아이팟 — 은색 몸체, 화면 + 클릭 휠
        const vertical = w.size === 'M'
        const wheel = vertical ? 86 : wide ? 56 : 112
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: 24, background: 'linear-gradient(180deg,#ECECEC,#C9C9C9)', boxShadow: 'inset 0 1px 0 #FFFFFF, 0 4px 10px rgba(0,0,0,0.14)', display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: vertical ? 10 : 14, padding: vertical ? 12 : wide ? '8px 14px' : 14, boxSizing: 'border-box' }}>
            <div style={{ flex: vertical ? '0 0 auto' : 1, width: vertical ? '100%' : undefined, height: vertical ? 64 : '100%', borderRadius: 8, background: '#D8DADC', border: '2px solid #707070', display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', boxSizing: 'border-box', minWidth: 0 }}>
              <div style={{ width: wide ? 34 : 50, height: wide ? 34 : 50, borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}><Photo src={art} mono={mono} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, color: '#1E1E1E' }}>
                <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                <span style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</span>
              </div>
            </div>
            <div style={{ width: wheel, height: wheel, borderRadius: '50%', background: '#F6F6F6', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)', position: 'relative', flexShrink: 0 }}>
              {wheel > 70 && <span style={{ position: 'absolute', top: wheel * 0.08, left: 0, right: 0, textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#9A9A9A' }}>MENU</span>}
              <span style={{ position: 'absolute', top: '50%', left: '50%', width: wheel * 0.38, height: wheel * 0.38, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: '#E4E4E4', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.12)' }} />
            </div>
          </div>
        )
      }
      if (w.variant === 3) {
        // 디스크 — 앨범 표지 옆으로 LP 판이 빠져나와 있고, 재생하면 판이 돌아감
        const sleeve = (sz: number) => (
          <span style={{ position: 'relative', width: sz * 1.42, height: sz, flexShrink: 0, display: 'block' }}>
            <span style={{ position: 'absolute', left: sz * 0.42, top: 0, width: sz, height: sz, borderRadius: '50%', background: 'repeating-radial-gradient(circle, #151515 0 1.4px, #2A2A2A 1.4px 2.8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.05)', transform: on ? 'translateX(6%)' : 'none', transition: 'transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)' }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', animation: on ? 'pfSpin 3.2s linear infinite' : undefined }}>
                <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.2) 35deg, rgba(255,255,255,0) 75deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.13) 215deg, rgba(255,255,255,0) 255deg)' }} />
                <span style={{ position: 'absolute', inset: '31%', borderRadius: '50%', overflow: 'hidden' }}><Photo src={art} mono={mono} /></span>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.08))' }} />
              </span>
              <span style={{ position: 'absolute', left: '50%', top: '50%', width: Math.max(4, sz * 0.06), height: Math.max(4, sz * 0.06), transform: 'translate(-50%,-50%)', borderRadius: '50%', background: t.card === 'transparent' ? '#EEE' : t.card }} />
            </span>
            <span style={{ position: 'absolute', left: 0, top: 0, width: sz, height: sz, borderRadius: Math.max(4, sz * 0.06), overflow: 'hidden', boxShadow: '0 6px 14px rgba(0,0,0,0.22)', zIndex: 1 }}><Photo src={art} mono={mono} /></span>
          </span>
        )
        const text = (center?: boolean) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, alignItems: center ? 'center' : 'flex-start', textAlign: center ? 'center' : 'left' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: tAccent }}>{nowLabel}</span>
            <span style={{ fontSize: wide ? 14 : 15.5, fontWeight: 700, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
            {!wide && <span style={{ fontSize: 12, color: t.cardSub, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</span>}
          </div>
        )
        if (w.size === 'M') return (
          <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {sleeve(78)}
            <div style={{ width: '100%', minWidth: 0, display: 'flex', justifyContent: 'center' }}>{text(true)}</div>
          </div>
        )
        return (
          <div style={{ ...card, padding: wide ? '0 14px' : '0 20px', display: 'flex', alignItems: 'center', gap: wide ? 12 : 18 }}>
            {sleeve(wide ? 48 : 112)}
            {text()}
          </div>
        )
      }
      const artS = big ? 120 : w.size === 'M' ? 64 : 52
      return (
        <div style={{ ...card, padding: big || w.size === 'M' ? 14 : '0 14px', display: 'flex', flexDirection: w.size === 'M' ? 'column' : 'row', alignItems: w.size === 'M' ? 'flex-start' : 'center', gap: w.size === 'M' ? 10 : 14 }}>
          <div style={{ width: artS, height: artS, borderRadius: big ? 14 : 10, overflow: 'hidden', flexShrink: 0, background: accent }}><Photo src={art} mono={mono} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, maxWidth: '100%' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: tAccent }}>{nowLabel}</span>
            <span style={{ fontSize: big ? 18 : 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
            <span style={{ fontSize: 12, color: t.cardSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</span>
          </div>
        </div>
      )
    }
    case 'guestbook':
      // 한 사람씩 — 몇 초마다 다음 축하로 넘어감
      return <GuestbookTicker list={gbList} size={w.size} memo={w.variant === 1} memoColor={w.props.memoColor} labelColor={w.props.labelColor} textColor={w.props.textColor} t={t} accent={tAccent} onOpen={tap('guestbook')} editing={!!editing} card={card} />
    case 'search':
      return <SearchWidget data={data} size={w.size} variant={w.variant} hint={w.props.text} items={w.props.searches} rotate={!w.props.noRotate} t={t} editing={!!editing} onOpenApp={onOpenApp} navKey={`search:${w.id}`} />
    case 'folder':
      return <FolderWidget data={data} apps={w.props.apps} label={w.props.label} size={w.size} t={t} ch={ch} editing={!!editing} onOpenApp={onOpenApp} mono={mono} navKey={`folder:${w.id}`} appLabels={w.props.appLabels} appIcons={w.props.appIcons} />
    case 'letters':
      return <LettersWidget data={data} size={w.size} variant={w.variant} t={t} card={card} accent={tAccent} editing={!!editing} onOpen={tap('letter')} mono={mono} ch={ch} />
    case 'intro':
      return <IntroWidget data={data} size={w.size} variant={w.variant} t={t} accent={tAccent} card={card} onOpen={tap('intro')} editing={!!editing} ch={ch} text={w.props.text} />
    case 'venue':
      // 흑백 — 지도 색까지 회색으로 (흑백 홈과 어울리게)
      return <div style={{ width: '100%', height: '100%', filter: mono ? 'grayscale(1)' : undefined }}><VenueWidget data={data} size={w.size} variant={w.variant} t={t} accent={tAccent} card={card} onOpen={tap('memo')} editing={!!editing} mono={mono} /></div>
    case 'story':
      return <StoryWidget data={data} size={w.size} variant={w.variant} t={t} accent={tAccent} card={card} onOpen={tap('story')} editing={!!editing} mono={mono} />
    case 'todo': {
      const v = data.wedding.venue
      const auto = [
        wp.d ? `${wp.month}월 ${wp.day}일 ${wp.timeShort || ''}${w.size === 'M' ? '' : ' 비워두기'}`.replace(/\s+/g, ' ').trim() : '예식일 비워두기',
        [v.name, v.hall].filter(Boolean).join(' ') || '예식장 확인하기',
        '축하 한마디 남기기',
      ]
      const items = (w.props.items && w.props.items.filter(Boolean).length ? w.props.items.filter(Boolean) : auto).slice(0, 3)
      const small = w.size === 'M'
      // 제목 없이 목록만 — 목록: 동그라미 / 번호: 01 02 03
      return (
        <button type="button" onClick={tap('memo')} style={{ ...card, padding: small ? '10px 14px' : '12px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left', cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
          {items.map((s, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: small ? 8 : 12, padding: small ? '8px 0' : '11px 0', borderBottom: i < items.length - 1 ? `1px dashed ${isDark(t.card === 'transparent' ? '#FFFFFF' : t.card) ? 'rgba(255,255,255,0.2)' : '#DDDDDD'}` : undefined, fontSize: small ? 12 : 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {w.variant === 1
                ? <span style={{ ...wn(small ? 9 : 11), color: tAccent, width: small ? 15 : 19, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                : <i style={{ width: small ? 15 : 19, height: small ? 15 : 19, borderRadius: '50%', border: `1.5px solid ${t.cardSub}`, flexShrink: 0 }} />}
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
            </span>
          ))}
        </button>
      )
    }
    case 'app': {
      const app = w.props.app || 'memo'
      const meta = APP_META[app]
      const label = w.props.label || meta.label
      // 칸이 낮은 작은 폰에서는 아이콘을 줄여 이름이 아래 위젯에 가리지 않게
      // 폰 홈 아이콘 비율 — 칸 폭(70.5)의 약 90%, 아이콘 사이 간격이 iOS 처럼 26px 남짓 (이름은 아래 틈으로 내려감)
      const ic = Math.max(40, Math.min(64, ch - (w.props.hideLabel ? 2 : 10)))
      const base = w.props.src || w.props.clear ? null : iconLook(data, app)
      // 1×1 아이콘 — '위젯 색'은 아이콘 칸 색, '그림 색'은 그림 색 (안 고르면 칸 밝기에 맞춰 자동)
      const tileBg = w.size === 'S' && w.props.bg && !w.props.clear && !w.props.src
      const look = tileBg
        ? { bg: ownBg, ink: w.props.glyph || (alpha >= 0.45 && isDark(w.props.bg!) ? '#FFFFFF' : data.phone.accent), shadow: '0 1px 3px rgba(0,0,0,0.12), inset 0 0 0 0.5px rgba(0,0,0,0.06)' }
        : base && w.props.glyph ? { ...base, ink: w.props.glyph, glyph: undefined } : base
      // 방명록 — 새 글 수 빨간 배지 (진짜 폰 알림처럼)
      const badgeN = app === 'guestbook' ? gbList.length : app === 'letter' ? letterUnread : 0
      const badge = badgeN ? (
        <span style={{ position: 'absolute', top: -5, right: -6, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: '#FF3B30', color: '#FFFFFF', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9)', fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif" }}>{badgeN > 99 ? '99+' : badgeN}</span>
      ) : null
      if (w.size !== 'S') {
        // 크게 늘린 앱 — 2×2 카드 · 4×1 한 줄 (아이콘 + 이름 + 한 줄 설명)
        const wp2 = weddingParts(data)
        const sub = ({
          story: `${data.phone.story.filter(m => m.side === 'date').length}개의 이야기`,
          album: `사진 ${data.gallery.images.length}장`,
          memo: wp2.d ? `${wp2.month}월 ${wp2.day}일 ${wp2.timeShort || ''}`.trim() : '예식 안내',
          gift: '마음 전하실 곳',
          rsvp: '참석 여부 알려 주기',
          call: '신랑 · 신부에게 연락',
          guestbook: `축하 ${gbList.length}개`,
          intro: `${givenName(data.groom, '신랑')} · ${givenName(data.bride, '신부')}`,
          letter: `편지 ${lettersOf(data).length}통`,
        } as Record<PhoneAppId, string>)[app]
        const iconBox = (sz: number) => (
          <span style={{ ...look?.css, width: sz, height: sz, borderRadius: sz * 0.27, background: look ? look.bg : t.icon, boxShadow: look?.shadow, filter: undefined, border: look ? 0 : `1px solid ${t.iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
            <span style={{ display: 'flex', filter: look?.glyph }}><AppGlyph app={app} color={look ? look.ink : t.iconInk} size={Math.round(sz * 0.56)} /></span>
          </span>
        )
        if (w.size === 'W') return (
          <button type="button" onClick={tap(app)} aria-label={label} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 0 12px', cursor: editing ? 'inherit' : 'pointer', font: 'inherit', textAlign: 'left' }}>
            {w.props.src ? <span style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}><Photo src={w.props.src} crop={w.props.crop} mono={mono} /></span> : iconBox(46)}
            <span style={{ flex: 1, minWidth: 0 }}>
              {!w.props.hideLabel && <>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{label}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: t.cardSub, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
              </>}
            </span>
            <PhoneIcon name="chevron" color={t.cardSub} size={16} stroke={2.2} />
          </button>
        )
        // 2×2 — 폰 위젯처럼 이름은 칸 아래에 (이름 숨기기면 칸이 꽉 참)
        return (
          <button type="button" onClick={tap(app)} aria-label={label} style={{ width: '100%', height: '100%', border: 0, background: 'transparent', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
            <span style={{ ...card, height: w.props.hideLabel ? '100%' : 'calc(100% - 20px)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: w.props.src ? 0 : 16, textAlign: 'left' }}>
              {w.props.src
                ? <Photo src={w.props.src} crop={w.props.crop} mono={mono} />
                : <>
                    {iconBox(54)}
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.cardSub }}>{sub}</span>
                  </>}
            </span>
            {!w.props.hideLabel && <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, color: t.labelInk, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{label}</span>}
          </button>
        )
      }
      return (
        <button type="button" onClick={tap(app)} aria-label={label}
          style={{ width: '100%', height: '100%', border: 0, background: 'transparent', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
          <span style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
          {badge}
          <span style={{ ...look?.css, width: ic, height: ic, borderRadius: ic * 0.27, background: look ? look.bg : w.props.src && w.props.noBg ? 'transparent' : t.icon, border: w.props.src || look ? 0 : `1px solid ${t.iconBorder}`, boxShadow: look?.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden', flexShrink: 0 }}>
            {w.props.src ? (w.props.noBg
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={w.props.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: mono ? 'grayscale(1)' : undefined }} />
              : <Photo src={w.props.src} crop={w.props.crop} mono={mono} />) : <span style={{ display: 'flex', filter: look?.glyph }}><AppGlyph app={app} color={look ? look.ink : t.iconInk} size={Math.round(ic * 0.56)} /></span>}
          </span>
          </span>
          {!w.props.hideLabel && <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, color: t.labelInk, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{label}</span>}
        </button>
      )
    }
  }
}

/* ───────── 앱 아이콘 색 — 컬러 앱 (앱마다 다른 색 + 흰 그림) · 흰색 ───────── */
const APP_TINTS: Record<PhoneAppId, [string, string]> = {
  memo: ['#FFC66B', '#FF9500'],
  rsvp: ['#6CC0FF', '#1E7CF2'],
  gift: ['#FF94AA', '#F2476A'],
  call: ['#72E485', '#28B84C'],
  story: ['#BFA0FF', '#7C5CEB'],
  album: ['#FFB27A', '#FF6A3D'],
  guestbook: ['#62E2D2', '#10AE9F'],
  intro: ['#FF8FB1', '#E8517F'],
  video: ['#FF6B6B', '#E5252A'],
  camera: ['#8E8E93', '#3A3A3C'],
  letter: ['#8FB4FF', '#4A78E8'],
}
/** 아이콘 칸 모양 — null 이면 원래 색 (버튼 색) */
function iconLook(data: PhoneData, app: PhoneAppId): { bg: string; ink: string; shadow?: string; css?: CSSProperties; glyph?: string } | null {
  const st = data.phone.iconStyle
  if (st === 'glass') {
    // 유리 — 뒤가 비치는 반투명 칸 + 흰 그림. 바탕이 밝으면 칸을 살짝 어둡게 해서 흰 그림이 보이게
    const t = themeOf(data)
    const lightBg = isDark(t.ink) // 글자가 어두우면 바탕이 밝은 것
    return lightBg
      ? { bg: 'linear-gradient(160deg, rgba(30,30,30,0.46), rgba(30,30,30,0.30))', ink: '#FFFFFF', shadow: 'inset 0 1px 0.5px rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.25), 0 6px 16px rgba(0,0,0,0.10)', css: { backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)' }, glyph: 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))' }
      : { bg: 'linear-gradient(160deg, rgba(255,255,255,0.42), rgba(255,255,255,0.14))', ink: '#FFFFFF', shadow: 'inset 0 1px 0.5px rgba(255,255,255,0.75), inset 0 0 0 1px rgba(255,255,255,0.32), 0 6px 16px rgba(0,0,0,0.14)', css: { backdropFilter: 'blur(14px) saturate(1.5)', WebkitBackdropFilter: 'blur(14px) saturate(1.5)' }, glyph: 'drop-shadow(0 1px 2px rgba(0,0,0,0.22))' }
  }
  if (st === 'color') { const [a, b] = APP_TINTS[app]; return { bg: `linear-gradient(180deg, ${a}, ${b})`, ink: '#FFFFFF', shadow: 'inset 0 1px 0 rgba(255,255,255,0.35)' } }
  if (st === 'white') return { bg: '#FFFFFF', ink: data.phone.accent, shadow: '0 1px 3px rgba(0,0,0,0.12), inset 0 0 0 0.5px rgba(0,0,0,0.06)' }
  return null
}

/** 홈 방명록 위젯 — 축하 한 개씩 차례로 (말풍선 · 메모) */
/** 메모지 색 — 글마다 바뀔 때 차례로 */
export const MEMO_COLORS = ['#FFF1A8', '#FFD9DE', '#D9ECFF', '#DDF2D4', '#EADCFF', '#FFE2C2']
function GuestbookTicker({ list, size, memo, memoColor, labelColor, textColor, t, accent, onOpen, editing, card }: { list: GbMsg[]; size: WidgetSize; memo: boolean; memoColor?: string; labelColor?: string; textColor?: string; t: PhoneTheme; accent: string; onOpen?: () => void; editing: boolean; card: CSSProperties }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (list.length < 2) return
    const id = setInterval(() => setI(v => v + 1), 3800)
    return () => clearInterval(id)
  }, [list.length])
  const m = list.length ? list[i % list.length] : undefined
  const small = size === 'M'
  const lines = size === 'L' ? 5 : small ? 3 : 2
  const dots = list.length > 1 && (
    <span style={{ display: 'flex', gap: 3 }}>
      {list.slice(0, 6).map((_, k) => <span key={k} style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: k === i % Math.min(6, list.length) ? 0.9 : 0.25 }} />)}
    </span>
  )
  const body = (ink: string, sub: string) => m && size === 'W' ? (
    // 4×1 — 한 줄에 글 + 이름
    <span key={m.id + i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', minWidth: 0, animation: 'pfGbIn 0.5s ease' }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, color: ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.message}</span>
      <span style={{ fontSize: 12, color: sub, flexShrink: 0 }}>— {m.name}</span>
    </span>
  ) : m ? (
    <span key={m.id + i} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, animation: 'pfGbIn 0.5s ease' }}>
      <span style={{ fontSize: size === 'L' ? 17 : small ? 14 : 14.5, lineHeight: 1.45, fontWeight: 600, color: ink, display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'keep-all' }}>{m.message}</span>
      <span style={{ fontSize: 12, color: sub }}>— {m.name}</span>
    </span>
  ) : <span style={{ fontSize: 13.5, color: sub }}>첫 축하를 남겨 주세요</span>
  // 메모지 색 — 고른 색, 'cycle' 이면 글이 바뀔 때마다 다음 색
  const paper = memoColor === 'cycle' ? MEMO_COLORS[i % MEMO_COLORS.length] : memoColor || '#FFF1A8'
  const paperInk = isDark(paper) ? '#FFFFFF' : '#3A3320'
  const style: CSSProperties = memo
    ? { ...card, borderRadius: 4, border: 0, overflow: 'visible', position: 'relative', background: paper, transition: 'background-color 0.6s ease', color: paperInk, boxShadow: '0 1px 1px rgba(0,0,0,0.06), 0 8px 16px rgba(120,100,20,0.16)' }
    : card
  return (
    <button type="button" onClick={onOpen} style={{ ...style, padding: small ? 14 : '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, textAlign: 'left', cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
      <style>{'@keyframes pfGbIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }'}</style>
      {memo && <>
        <span aria-hidden style={{ position: 'absolute', left: '50%', top: -8, width: 56, height: 18, transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.55)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }} />
        <span aria-hidden style={{ position: 'absolute', right: 0, bottom: 0, width: 18, height: 18, background: 'linear-gradient(135deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.12) 50%, rgba(255,255,255,0.55) 70%)' }} />
      </>}
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: memo ? (paperInk === '#FFFFFF' ? 'rgba(255,255,255,0.7)' : 'rgba(58,51,32,0.6)') : accent }}>
        <span style={{ color: labelColor || undefined }}>{memo ? '방명록' : 'GUESTBOOK'}</span>
        <span style={{ letterSpacing: 0, fontWeight: 600, color: memo ? (paperInk === '#FFFFFF' ? 'rgba(255,255,255,0.7)' : 'rgba(58,51,32,0.6)') : t.cardSub, display: 'flex', alignItems: 'center', gap: 6 }}>{dots}{list.length}</span>
      </span>
      {body(textColor || (memo ? paperInk : t.cardInk), memo ? (paperInk === '#FFFFFF' ? 'rgba(255,255,255,0.7)' : 'rgba(58,51,32,0.6)') : t.cardSub)}
    </button>
  )
}

/* ───────── 폴더 — 앱 여러 개를 한 칸에 (누르면 폰 폴더처럼 펼쳐짐) ───────── */
function FolderWidget({ data, apps: raw, label, size, t, ch, editing, onOpenApp, mono, navKey = 'folder', appLabels, appIcons }: { navKey?: string; appLabels?: Partial<Record<PhoneAppId, string>>; appIcons?: Partial<Record<PhoneAppId, string>>; data: PhoneData; apps?: PhoneAppId[]; label?: string; size: WidgetSize; t: PhoneTheme; ch: number; editing: boolean; onOpenApp?: (a: PhoneAppId) => void; mono?: boolean }) {
  const nav = useContext(ReturnCtx)
  const gy = useContext(GapCtx)
  const [open, setOpen] = useState(() => !editing && nav?.startOpen === navKey)
  const apps = (raw && raw.length ? raw : FOLDER_DEFAULT_APPS).filter(a => APP_META[a] && !isAppOff(data, a))
  const name = label?.trim() || '폴더'
  const glass = t.card === 'transparent' ? 'rgba(255,255,255,0.35)' : t.card
  // 앱 아이콘 하나 (홈의 앱 아이콘과 같은 모양)
  const icon = (a: PhoneAppId, sz: number, inFolder = false) => {
    const look = iconLook(data, a)
    const plainBg = inFolder ? (isDark(t.card) ? 'rgba(255,255,255,0.16)' : '#FFFFFF') : t.icon
    // 직접 올린 아이콘 사진
    const own = appIcons?.[a]
    if (own) return <span style={{ width: sz, height: sz, borderRadius: sz * 0.27, overflow: 'hidden', flexShrink: 0, position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}><Photo src={own} mono={mono} /></span>
    return (
      <span style={{ ...look?.css, width: sz, height: sz, borderRadius: sz * 0.27, background: look ? look.bg : plainBg, border: look || inFolder ? 0 : `1px solid ${t.iconBorder}`, boxShadow: look?.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box', filter: mono ? 'grayscale(1)' : undefined }}>
        <span style={{ display: 'flex', filter: look?.glyph }}><AppGlyph app={a} color={look ? look.ink : t.iconInk} size={Math.round(sz * 0.56)} /></span>
      </span>
    )
  }
  const tile = (box: number, cols: number) => {
    const pad = box * (cols === 3 ? 0.1 : 0.12)
    const gap = box * (cols === 3 ? 0.06 : 0.08)
    const cell = (box - pad * 2 - gap * (cols - 1)) / cols
    return (
      <span style={{ width: box, height: box, borderRadius: box * 0.27, background: glass, boxShadow: `inset 0 0 0 1px ${t.cardBorder}`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px`, gap, padding: pad, boxSizing: 'border-box', alignContent: 'start' }}>
        {apps.slice(0, cols * cols).map(a => <span key={a} style={{ display: 'flex' }}>{icon(a, cell, true)}</span>)}
      </span>
    )
  }
  const big = size === 'M'
  // 4개 이하는 2 × 2, 그보다 많으면 3줄씩
  const cols = apps.length <= 4 ? 2 : 3
  const ic = Math.max(40, Math.min(64, ch - 10))
  return (
    <>
      <button type="button" onClick={() => { if (!editing) setOpen(true) }} aria-label={`${name} 폴더`}
        style={{ width: '100%', height: '100%', border: 0, background: 'transparent', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: big ? 'flex-start' : undefined, gap: 6, cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
        {big ? tile(Math.min(spanW('M'), spanH('M', ch) - (GRID.gapY - gy) - 20), cols) : tile(ic, cols)}
        <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, color: t.labelInk, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{name}</span>
      </button>
      {open && (<PfOverlay>
        // 펼친 폴더 — 홈 위 흐린 막, 가운데 둥근 판에 앱 아이콘
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,20,20,0.3)', backdropFilter: 'blur(26px) saturate(1.4)', WebkitBackdropFilter: 'blur(26px) saturate(1.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, animation: 'pfFadeIn 0.25s ease' }}>
          <style>{'@keyframes pfFadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes pfFolder { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: none; } }'}</style>
          <span style={{ width: cols === 2 ? 220 : 300, padding: '0 6px', boxSizing: 'border-box', textAlign: 'center', fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif", fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textShadow: '0 1px 8px rgba(0,0,0,0.18)' }}>{name}</span>
          <div onClick={e => e.stopPropagation()} style={{ width: cols === 2 ? 220 : 300, borderRadius: 38, padding: '24px 18px 18px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: 'inset 0 1px 0.5px rgba(255,255,255,0.55)', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, rowGap: 16, animation: 'pfFolder 0.38s cubic-bezier(0.32, 0.72, 0, 1)' }}>
            {apps.map(a => (
              <button key={a} type="button" onClick={() => { setOpen(false); if (nav) nav.go(a, navKey); else onOpenApp?.(a) }} style={{ border: 0, background: 'transparent', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', font: 'inherit' }}>
                {icon(a, 62)}
                <span style={{ fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif", fontSize: 11.5, fontWeight: 500, color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>{appLabels?.[a]?.trim() || APP_META[a].label}</span>
              </button>
            ))}
          </div>
        </div>
      </PfOverlay>)}
    </>
  )
}

/** 검색창 · 폴더에서 화면을 열면 — 뒤로 가기로 그 검색 · 폴더가 다시 열린 채 돌아오게 */
export const ReturnCtx = createContext<{ startOpen: string | null; go: (a: PhoneAppId, key: string) => void } | null>(null)

/* ───────── 검색창 — 누르면 검색 화면, 신랑·신부가 정한 검색어를 눌러 그 화면으로 ───────── */
function SearchWidget({ data, size, variant, hint, items: raw, rotate = true, t, editing, onOpenApp, navKey = 'lock-search' }: { navKey?: string; data: PhoneData; size: WidgetSize; variant: number; hint?: string; items?: PhoneSearchItem[]; rotate?: boolean; t: PhoneTheme; editing: boolean; onOpenApp?: (a: PhoneAppId) => void }) {
  const nav = useContext(ReturnCtx)
  const [open, setOpen] = useState(() => !editing && nav?.startOpen === navKey)
  const [q, setQ] = useState('')
  // 강조한 검색어가 먼저 (나머지는 정한 순서대로)
  const items0 = (raw && raw.length ? raw : defaultSearchItems(data)).filter(x => x.label.trim() && APP_META[x.app] && !isAppOff(data, x.app))
  const items = [...items0.filter(x => x.pin), ...items0.filter(x => !x.pin)]
  const dark = variant === 1
  const outline = variant === 2
  const glassy = variant === 3
  // 기본은 '검색' 한 단어 — 칸이 좁아도 잘리지 않게
  const placeholder = hint?.trim() || '검색'
  const ink = dark || glassy ? '#FFFFFF' : t.cardInk
  const sub = dark ? 'rgba(255,255,255,0.6)' : glassy ? 'rgba(255,255,255,0.85)' : t.cardSub
  const SYSF = "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif"
  const glass = (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
  )
  // 검색창 안 글 — 추천 검색어가 번갈아 올라옴 (안내 글 → 검색어 1 → 검색어 2 …)
  const cycle = rotate && items.length ? [placeholder, ...items.map(x => `#${x.label.replace(/\s+/g, '')}`)] : [placeholder]
  const [ci, setCi] = useState(0)
  useEffect(() => {
    if (cycle.length < 2) return
    const id = setInterval(() => setCi(v => v + 1), 2600)
    return () => clearInterval(id)
  }, [cycle.length])
  const shownHint = cycle[ci % cycle.length]
  const shown = items.filter(x => !q.trim() || x.label.replace(/\s/g, '').includes(q.replace(/\s/g, '')))
  return (
    <>
      <button type="button" onClick={() => { if (!editing) { setQ(''); setOpen(true) } }} aria-label="검색"
        style={{ width: '100%', height: '100%', border: 0, padding: 0, background: 'transparent', display: 'flex', alignItems: 'center', cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
        <span style={{ ...(glassy ? { backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' } : null), width: '100%', height: size === 'H' ? 46 : 52, borderRadius: 999, background: glassy ? 'rgba(255,255,255,0.2)' : outline ? (t.card === 'transparent' ? 'rgba(255,255,255,0.6)' : '#FFFFFF') : dark ? '#111111' : t.card === 'transparent' ? 'rgba(255,255,255,0.75)' : t.card, boxShadow: glassy ? 'inset 0 1px 0.5px rgba(255,255,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.22)' : outline ? `inset 0 0 0 2px ${t.cardInk}` : dark ? '0 4px 14px rgba(0,0,0,0.18)' : `inset 0 0 0 1px ${t.cardBorder}`, color: ink, display: 'flex', alignItems: 'center', gap: 10, padding: size === 'H' ? '0 14px 0 18px' : '0 18px 0 22px', boxSizing: 'border-box' }}>
          <span style={{ flex: 1, minWidth: 0, height: '1.4em', overflow: 'hidden', position: 'relative', fontSize: size === 'H' ? 13 : 14.5, lineHeight: 1.4, color: sub, textAlign: 'left' }}>
            <style>{'@keyframes pfHintUp { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }'}</style>
            <span key={ci} style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', animation: cycle.length > 1 ? 'pfHintUp 0.45s cubic-bezier(0.32, 0.72, 0, 1)' : undefined }}>{shownHint}</span>
          </span>
          {/* 돋보기는 오른쪽 */}
          <span style={{ display: 'flex', color: dark || glassy ? '#FFFFFF' : t.cardInk, flexShrink: 0 }}>{glass}</span>
        </span>
      </button>
      {open && (<PfOverlay>
        // 검색 화면 — 위에 입력칸, 아래 추천 검색어
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(250,250,250,0.88)', backdropFilter: 'blur(26px) saturate(1.3)', WebkitBackdropFilter: 'blur(26px) saturate(1.3)', fontFamily: SYSF, color: '#111111', animation: 'pfFadeIn 0.22s ease', display: 'flex', flexDirection: 'column' }}>
          <style>{'@keyframes pfFadeIn { from { opacity: 0; } to { opacity: 1; } }'}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '58px 16px 12px' }}>
            <label style={{ flex: 1, height: 42, borderRadius: 12, background: 'rgba(118,118,128,0.14)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: '#8E8E93' }}>
              {glass}
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontSize: 16, color: '#111111', fontFamily: 'inherit' }} />
            </label>
            <button type="button" onClick={() => setOpen(false)} style={{ border: 0, background: 'transparent', fontSize: 16, color: data.phone.accent, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>취소</button>
          </div>
          <div style={{ padding: '6px 20px', fontSize: 13, fontWeight: 600, color: '#8E8E93', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>{q.trim() ? '검색 결과' : '추천 검색어'}</span>
            <span style={{ fontWeight: 400, fontSize: 12 }}>누르면 그 화면이 열려요</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
            {shown.map((x, i) => (
              <button key={i} type="button" onClick={() => { setOpen(false); if (nav) nav.go(x.app, navKey); else onOpenApp?.(x.app) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', border: 0, borderBottom: '0.5px solid rgba(0,0,0,0.08)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <span style={{ display: 'flex', color: x.pin ? data.phone.accent : '#8E8E93' }}>{glass}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 16, color: x.pin ? data.phone.accent : '#111111', fontWeight: x.pin ? 700 : 400, wordBreak: 'keep-all' }}>{x.label}</span>
                {x.pin && <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', background: data.phone.accent, padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>추천</span>}
                <span style={{ fontSize: 12.5, color: '#8E8E93', whiteSpace: 'nowrap' }}>{APP_META[x.app].label}</span>
              </button>
            ))}
            {!shown.length && <p style={{ fontSize: 14, color: '#8E8E93', padding: '14px 4px' }}>찾는 내용이 없어요</p>}
          </div>
        </div>
      </PfOverlay>)}
    </>
  )
}

/* ───────── 앱 아이콘 그림 — 폰 앱처럼 꽉 찬 모양 (구멍은 evenodd 로 뚫어 칸 색이 비침) ───────── */
const APP_GLYPHS: Record<PhoneAppId, string> = {
  // 예식 안내 — 지도 핀
  memo: 'M12 2.2c-4 0-7.2 3.1-7.2 7.1 0 5.3 7.2 12.5 7.2 12.5s7.2-7.2 7.2-12.5c0-4-3.2-7.1-7.2-7.1zm0 4.2a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8z',
  // 참석 회신 — 봉투
  rsvp: 'M2.8 7.2c0-1.1.9-2 2-2h14.4c1.1 0 2 .9 2 2v9.6c0 1.1-.9 2-2 2H4.8c-1.1 0-2-.9-2-2zM4.4 6.8L12 12.3l7.6-5.5v2.1L12 14.4 4.4 8.9z',
  // 마음 전하기 — 선물 상자
  gift: 'M4 11h16v8.4c0 .9-.7 1.6-1.6 1.6H5.6c-.9 0-1.6-.7-1.6-1.6zM3 7.6c0-.6.4-1.1 1-1.1h16c.6 0 1 .5 1 1.1V10H3zM12 6.5C10.4 3.3 6.8 3.3 6.8 5.2c0 1.1 1.1 1.3 5.2 1.3zm0 0c1.6-3.2 5.2-3.2 5.2-1.3 0 1.1-1.1 1.3-5.2 1.3zM11.1 6.5h1.8V21h-1.8z',
  // 연락하기 — 수화기
  call: 'M7.1 3.3c.6-.3 1.3 0 1.6.5l1.9 3.3c.3.6.2 1.3-.3 1.7l-1.6 1.3c1 2.2 2.8 4 5 5l1.3-1.6c.4-.5 1.1-.6 1.7-.3l3.3 1.9c.6.3.8 1 .5 1.6l-.9 2c-.4.9-1.3 1.4-2.3 1.3C9.6 19.3 4.7 14.4 4.1 6.7c-.1-1 .4-1.9 1.3-2.3z',
  // 우리 이야기 — 말풍선 + 하트
  story: 'M12 3.4c-5 0-9.1 3.4-9.1 7.6 0 2.4 1.3 4.5 3.4 5.9l-.8 3.6 3.9-2.1c.8.2 1.7.3 2.6.3 5 0 9.1-3.4 9.1-7.7S17 3.4 12 3.4zm0 11.3s-3.7-2.2-3.7-4.6c0-1.2.9-2 1.9-2 .8 0 1.4.4 1.8 1 .4-.6 1-1 1.8-1 1 0 1.9.8 1.9 2 0 2.4-3.7 4.6-3.7 4.6z',
  // 사진첩 — 사진 (산 · 해)
  album: 'M3 6.6C3 5.2 4.2 4 5.6 4h12.8C19.8 4 21 5.2 21 6.6v10.8c0 1.4-1.2 2.6-2.6 2.6H5.6C4.2 20 3 18.8 3 17.4zM5.2 17.8l4.5-5.5 3.1 3.5 2.4-2.6 3.6 4.6zM15.6 7a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8z',
  // 방명록 — 펜
  guestbook: 'M15.4 3.7a2.1 2.1 0 0 1 3 0l1.9 1.9a2.1 2.1 0 0 1 0 3L9 19.9 3.6 21.3 5 15.9zM13.6 5.5l4.9 4.9-1.1 1.1-4.9-4.9z',
  // 커플 소개 — 두 사람
  intro: 'M8.5 4.5a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6zM15.8 5.5a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8zM2.5 19c0-3.3 2.7-5.9 6-5.9s6 2.6 6 5.9zM14.3 19c0-1.7-.5-3.2-1.4-4.4.9-.5 1.9-.8 2.9-.8 3 0 5.7 2.3 5.7 5.2z',
  // 영상 — 둥근 화면 + 재생
  video: 'M2.5 7.4c0-1.9 1.4-3.3 3.3-3.5 2-.2 4.1-.3 6.2-.3s4.2.1 6.2.3c1.9.2 3.3 1.6 3.3 3.5v9.2c0 1.9-1.4 3.3-3.3 3.5-2 .2-4.1.3-6.2.3s-4.2-.1-6.2-.3c-1.9-.2-3.3-1.6-3.3-3.5zM10 8.7v6.6l5.6-3.3z',
  // 카메라
  camera: 'M8.6 4.4c.3-.6.9-.9 1.5-.9h3.8c.6 0 1.2.3 1.5.9l.9 1.6h2.6C20.4 6 21.5 7.1 21.5 8.6v8.8c0 1.4-1.1 2.6-2.6 2.6H5.1c-1.4 0-2.6-1.2-2.6-2.6V8.6C2.5 7.1 3.7 6 5.1 6h2.6zM12 8.6a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6zm0 2.1a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4z',
  // 편지 — 종이비행기 (Phosphor Icons · MIT, 256 칸)
  letter: 'M231.4,44.34s0,.1,0,.15l-58.2,191.94a15.88,15.88,0,0,1-14,11.51q-.69.06-1.38.06a15.86,15.86,0,0,1-14.42-9.15L107,164.15a4,4,0,0,1,.77-4.58l57.92-57.92a8,8,0,0,0-11.31-11.31L96.43,148.26a4,4,0,0,1-4.58.77L17.08,112.64a16,16,0,0,1,2.49-29.8l191.94-58.2.15,0A16,16,0,0,1,231.4,44.34Z',
}
export function AppGlyph({ app, color, size }: { app: PhoneAppId; color: string; size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox={app === 'letter' ? '0 0 256 256' : '0 0 24 24'} style={{ flexShrink: 0 }}>
      <path d={APP_GLYPHS[app]} fill={color} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  )
}

/* ───────── 홈이 살아 있게 — 열릴 때 숫자 올라가기 · 초 단위 남은 시간 · 사진 넘기기 ───────── */
/** 홈이 방금 열렸는지 (열리는 연출용) */
const HomeRevealCtx = createContext(false)
/** 'D-188' 의 '-' — 글꼴마다 낮거나 기울어 보여서 숫자 가운데 높이의 반듯한 막대로 */
function hy(text: string, font?: string): ReactNode {
  if (!text.includes('-') || (font && !['serif', 'instrument', 'didone'].includes(font))) return text
  const bold = font === 'didone'
  return text.split('-').map((part, i) => (
    <span key={i}>{i > 0 && <span aria-hidden style={{ display: 'inline-block', width: '0.28em', height: bold ? '0.09em' : '0.055em', minHeight: 1.2, background: 'currentColor', verticalAlign: '0.27em', margin: '0 0.06em', borderRadius: 1 }} />}{part}</span>
  ))
}
/** 숫자가 0부터 목표까지 빠르게 올라감 — 'D-188' 같은 글에서 숫자만 */
function CountUp({ text, on, font }: { text: string; on: boolean; font?: string }) {
  const m = text.match(/^(\D*)(\d+)(.*)$/)
  const target = m ? Number(m[2]) : 0
  const [v, setV] = useState(on && m ? 0 : target)
  useEffect(() => {
    if (!on || !m) return
    const start = performance.now(), dur = 1100
    let raf = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - start - 250) / dur)
      setV(Math.round(target * (1 - Math.pow(1 - Math.max(0, p), 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, target])
  return <>{hy(m ? `${m[1]}${v}${m[3]}` : text, font)}</>
}
/** 예식까지 남은 시 · 분 · 초 (예식 시각 기준, 지나면 null) */
function useCountdown(data: PhoneData) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => { const tick = () => setNow(Date.now()); const t0 = setTimeout(tick, 0); const id = setInterval(tick, 1000); return () => { clearTimeout(t0); clearInterval(id) } }, [])
  const d = parseWeddingDate(data.wedding.date)
  if (!d || now === null) return null
  const [hh, mm] = (data.wedding.time || '12:00').split(':').map(Number)
  d.setHours(hh || 0, mm || 0, 0, 0)
  const ms = d.getTime() - now
  if (ms <= 0) return null
  const s = Math.floor(ms / 1000) % 86400
  const p = (x: number) => String(x).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`
}
/** 남은 일 · 시 · 분 · 초 (처음 그릴 땐 null — 서버 · 화면 차이 방지) */
function useCountdownParts(data: PhoneData) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => { const tick = () => setNow(Date.now()); const t0 = setTimeout(tick, 0); const id = setInterval(tick, 1000); return () => { clearTimeout(t0); clearInterval(id) } }, [])
  const d = parseWeddingDate(data.wedding.date)
  if (!d || now === null) return null
  const [hh, mm] = (data.wedding.time || '12:00').split(':').map(Number)
  d.setHours(hh || 0, mm || 0, 0, 0)
  const ms = Math.max(0, d.getTime() - now)
  const t = Math.floor(ms / 1000)
  return { d: Math.floor(t / 86400), h: Math.floor(t / 3600) % 24, m: Math.floor(t / 60) % 60, s: t % 60 }
}
/** 플립 칸 하나 — 값이 바뀌면 위에서 넘어가듯 */
function FlipTile({ v, w, h, data }: { v: string; w: number; h: number; data: PhoneData }) {
  const f = numberFontOf(data)
  return (
    <span style={{ position: 'relative', width: w, height: h, borderRadius: Math.min(w, h) * 0.2, background: '#FFFFFF', boxShadow: '0 1px 1px rgba(0,0,0,0.05), 0 8px 18px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', perspective: 200 }}>
      <span key={v} style={{ fontFamily: f.family, fontWeight: f.weight === 600 ? 500 : f.weight, fontVariantNumeric: 'lining-nums tabular-nums', fontSize: Math.round(h * 0.52), lineHeight: 1, color: '#1C1C1E', letterSpacing: '-0.02em', animation: 'pfFlip 0.45s ease', transformOrigin: '50% 0' }}>{v}</span>
      <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.07)' }} />
    </span>
  )
}
/** 디데이 2×1 플립 — 남은 날 숫자를 넘김 카드로 */
function DdayFlipHalf({ data, t, label }: { data: PhoneData; t: PhoneTheme; label: string }) {
  const p = useCountdownParts(data)
  const days = p ? String(p.d) : '—'
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: t.ink }}>
      <span style={{ display: 'flex', gap: 3 }}>
        {days.split('').map((ch, i) => (
          <span key={i} style={{ width: 24, height: 34, borderRadius: 6, background: t.card, boxShadow: '0 2px 6px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 21, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: t.cardInk }}>
            {ch}
            <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.08)' }} />
          </span>
        ))}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>일</span>
        <span style={{ fontSize: 10.5, color: t.sub, whiteSpace: 'nowrap' }}>{label}</span>
      </span>
    </div>
  )
}
function DdayFlip({ data, wide, t, label, sec }: { data: PhoneData; wide: boolean; t: PhoneTheme; label: string; sec: boolean }) {
  const p = useCountdownParts(data)
  const two = (x: number) => String(x).padStart(2, '0')
  const all: [string, string][] = p ? [[String(p.d), '일'], [two(p.h), '시'], [two(p.m), '분'], [two(p.s), '초']] : [['—', '일'], ['--', '시'], ['--', '분'], ['--', '초']]
  // 초는 고를 수 있게 — 끄면 일 · 시 · 분만 (분이 바뀔 때만 넘어감)
  const cells = sec ? all : all.slice(0, 3)
  const unit: CSSProperties = { fontSize: 10, fontWeight: 600, color: t.sub, marginTop: 4, letterSpacing: '0.04em' }
  const css = <style>{'@keyframes pfFlip { from { transform: rotateX(-80deg); opacity: 0.3; } to { transform: none; opacity: 1; } }'}</style>
  if (wide) {
    // 4×1 — 일 · 시 · 분 · 초 네 칸을 한 줄로
    const th = 40
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', color: t.ink }}>
        {css}
        {/* 문구는 왼쪽 (2×2 와 같은 작은 글씨), 숫자 칸은 오른쪽 — 가운데가 비지 않게 */}
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1.45, color: t.sub, minWidth: 0, maxWidth: 92, wordBreak: 'keep-all', paddingBottom: 14 }}>{label}</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          {cells.map(([v, u], k) => (
            <span key={u} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <FlipTile v={v} w={k === 0 ? Math.max(38, v.length * 14 + 10) : 34} h={th} data={data} />
              <span style={unit}>{u}</span>
            </span>
          ))}
        </span>
      </div>
    )
  }
  // 2×2 — 위에 '며칠' 큰 칸, 아래 시 · 분 · 초 작은 칸
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.ink }}>
      {css}
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', color: t.sub }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <FlipTile v={cells[0][0]} w={Math.max(52, cells[0][0].length * 20 + 16)} h={48} data={data} />
        <span style={{ fontSize: 12, fontWeight: 600, color: t.sub }}>일</span>
      </span>
      <span style={{ display: 'flex', gap: 5 }}>
        {cells.slice(1).map(([v, u]) => (
          <span key={u} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FlipTile v={v} w={34} h={30} data={data} />
            <span style={{ ...unit, marginTop: 3 }}>{u}</span>
          </span>
        ))}
      </span>
    </div>
  )
}
function LiveLeft({ data, color }: { data: PhoneData; color: string }) {
  const left = useCountdown(data)
  if (!left) return null
  return <span style={{ fontSize: 12, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>{left} 남음</span>
}
/** 사진첩 사진을 천천히 바꿔 보여 줌 (겹치며 사라짐) */
function SlidePhotos({ srcs, mono }: { srcs: string[]; mono?: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (srcs.length < 2) return
    const id = setInterval(() => setI(v => (v + 1) % srcs.length), 3600)
    return () => clearInterval(id)
  }, [srcs.length])
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {srcs.map((src, k) => (
        <div key={src + k} style={{ position: 'absolute', inset: 0, opacity: k === i ? 1 : 0, transform: k === i ? 'scale(1.04)' : 'scale(1)', transition: 'opacity 1.2s ease, transform 4.8s ease' }}>
          <Photo src={src} mono={mono} />
        </div>
      ))}
    </div>
  )
}
/** 홈 '우리 이야기' 위젯 — 이야기를 하나씩 넘기며 미리 보여 줌 (누르면 우리 이야기) */
function StoryWidget({ data, size, variant, t, accent, card, onOpen, editing, mono }: { data: PhoneData; size: WidgetSize; variant: number; mono: boolean; t: PhoneTheme; accent: string; card: CSSProperties; onOpen?: () => void; editing: boolean }) {
  const chs = chaptersOf(data).filter(c => c.title || c.src || c.lines.length)
  const [i, setI] = useState(0)
  useEffect(() => {
    if (chs.length < 2 || variant === 2) return
    const id = setInterval(() => setI(v => v + 1), 4500)
    return () => clearInterval(id)
  }, [chs.length, variant])
  const c = chs.length ? chs[i % chs.length] : undefined
  const k = chs.length ? i % chs.length : 0
  const when = (x?: Chapter) => { const d = x?.date && parseWeddingDate(x.date); return d ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}` : '' }
  const line = (x?: Chapter) => (x?.lines[0]?.text || '').replace(/\n/g, ' ')
  const btn: CSSProperties = { cursor: editing ? 'inherit' : 'pointer', font: 'inherit', textAlign: 'left', border: 0, padding: 0 }
  const dots = chs.length > 1 && (
    <span style={{ display: 'flex', gap: 4 }}>{chs.slice(0, 6).map((_, n) => <span key={n} style={{ width: n === k % 6 ? 12 : 4, height: 4, borderRadius: 2, background: 'currentColor', opacity: n === k % 6 ? 0.95 : 0.4, transition: 'width 0.3s' }} />)}</span>
  )
  const fade = { animation: 'pfStoryIn 0.7s ease' }
  const css = <style>{'@keyframes pfStoryIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }'}</style>
  if (!c) return <button type="button" onClick={onOpen} style={{ ...card, ...btn, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.cardSub, fontSize: 12.5 }}>{editing ? '우리 이야기를 써 주세요' : ''}</button>

  // 목차 — 이야기 제목과 날짜 목록
  if (variant === 2) return (
    <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: size === 'W' ? '0 16px' : '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: size === 'W' ? 'center' : 'flex-start', gap: 8 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ ...titleCss(data, 17) }}>{storyTitleOf(data)}</span>
        <span style={{ fontSize: 11, color: t.cardSub }}>{chs.length}편</span>
      </span>
      {size !== 'W' && chs.slice(0, size === 'P' ? 6 : size === 'M' ? 3 : 4).map((x, n) => (
        <span key={n} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13, borderTop: n ? `0.5px solid ${t.cardBorder === 'rgba(0,0,0,0)' ? 'rgba(0,0,0,0.08)' : t.cardBorder}` : undefined, paddingTop: n ? 7 : 0 }}>
          <span style={{ fontSize: 11, color: accent, fontVariantNumeric: 'tabular-nums', width: 18 }}>{String(n + 1).padStart(2, '0')}</span>
          <span style={{ flex: 1, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.title || `${n + 1}번째 이야기`}</span>
          {size === 'L' && <span style={{ fontSize: 11, color: t.cardSub, fontVariantNumeric: 'tabular-nums' }}>{when(x)}</span>}
        </span>
      ))}
    </button>
  )

  // 책갈피 — 왼쪽 사진, 오른쪽 제목 · 첫 문장 (넓은 칸)
  if (variant === 1 || size === 'W') return (
    <button type="button" onClick={onOpen} style={{ ...card, ...btn, display: 'flex', alignItems: 'stretch' }}>
      {css}
      <span key={'p' + k} style={{ width: size === 'W' ? 76 : '42%', flexShrink: 0, ...fade }}>{c.src ? <Photo src={c.src} crop={c.crop} mono={mono} /> : <span style={{ display: 'block', width: '100%', height: '100%', background: accent, opacity: 0.15 }} />}</span>
      <span key={'t' + k} style={{ flex: 1, minWidth: 0, padding: size === 'W' ? '0 14px' : '16px 16px 14px', display: 'flex', flexDirection: 'column', justifyContent: size === 'W' ? 'center' : 'space-between', gap: 4, ...fade }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', color: accent }}>{storyTitleOf(data).toUpperCase()}</span>
        <span>
          <span style={{ display: 'block', fontSize: size === 'W' ? 15 : 17, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
          {size !== 'W' && line(c) && <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 12.5, lineHeight: 1.55, color: t.cardSub, marginTop: 4, wordBreak: 'keep-all' }}>{line(c)}</span>}
        </span>
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: t.cardSub, fontVariantNumeric: 'tabular-nums' }}>{when(c)}<span style={{ color: t.cardSub }}>{dots}</span></span>
      </span>
    </button>
  )

  // 사진 카드 — 사진 위에 제목 · 날짜 (스토리처럼 위에 진행 막대)
  return (
    <button type="button" onClick={onOpen} style={{ ...card, ...btn, position: 'relative', color: '#FFFFFF', background: c.src ? '#222' : accent }}>
      {css}
      <span key={'p' + k} style={{ position: 'absolute', inset: 0, ...fade }}>{c.src && <Photo src={c.src} crop={c.crop} mono={mono} />}</span>
      <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)' }} />
      {chs.length > 1 && (
        <span style={{ position: 'absolute', left: 10, right: 10, top: 9, display: 'flex', gap: 3 }}>
          {chs.slice(0, 8).map((_, n) => <span key={n} style={{ flex: 1, height: 2, borderRadius: 1, background: '#FFFFFF', opacity: n === k % 8 ? 1 : 0.4 }} />)}
        </span>
      )}
      <span key={'t' + k} style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', flexDirection: 'column', gap: 2, ...fade }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', opacity: 0.85 }}>{storyTitleOf(data).toUpperCase()}</span>
        <span style={{ fontSize: size === 'M' ? 15 : 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, wordBreak: 'keep-all' }}>{c.title}</span>
        {(size === 'L' || size === 'P') && line(c) && <span style={{ fontSize: 12.5, opacity: 0.88, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{line(c)}</span>}
        {when(c) && <span style={{ fontSize: 11, opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}>{when(c)}</span>}
      </span>
    </button>
  )
}

/** 홈 '오시는 길' 위젯 — 폰의 지도 · 교통 앱 위젯처럼. 누르면 예식 안내 */
type DirKind = 'subway' | 'bus' | 'car' | 'parking' | 'etc'
/** 교통 수단 배지 — 교통 앱처럼 색 동그라미 · 네모 */
function DirBadge({ kind, text, sz = 20 }: { kind: DirKind; text: string; sz?: number }) {
  const line = text.match(/(\d+)\s*호선/)?.[1]
  const st: CSSProperties = { width: sz, height: sz, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: sz * 0.55, fontWeight: 800, fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif" }
  if (kind === 'subway') {
    const c = ({ '1': '#0052A4', '2': '#00A84D', '3': '#EF7C1C', '4': '#00A5DE', '5': '#996CAC', '6': '#CD7C2F', '7': '#747F00', '8': '#E6186C', '9': '#BDB092' } as Record<string, string>)[line || ''] || '#00A84D'
    return <span style={{ ...st, borderRadius: '50%', background: c }}>{line || 'M'}</span>
  }
  if (kind === 'bus') return <span style={{ ...st, borderRadius: sz * 0.28, background: '#3D5BAB' }}><svg width={sz * 0.6} height={sz * 0.6} viewBox="0 0 24 24" aria-hidden><path d="M5 4h14a1 1 0 0 1 1 1v12H4V5a1 1 0 0 1 1-1zM4 11h16M7 20v-3M17 20v-3" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" /></svg></span>
  if (kind === 'parking') return <span style={{ ...st, borderRadius: sz * 0.28, background: '#2F6FE0' }}>P</span>
  if (kind === 'car') return <span style={{ ...st, borderRadius: sz * 0.28, background: '#6B6B70' }}><svg width={sz * 0.62} height={sz * 0.62} viewBox="0 0 24 24" aria-hidden><path d="M5 16v-4l2-5h10l2 5v4M4 16h16" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
  return <span style={{ ...st, borderRadius: '50%', background: '#8E8E93' }}>i</span>
}
function VenueWidget({ data, size, variant, t, card, onOpen, editing }: { data: PhoneData; size: WidgetSize; variant: number; t: PhoneTheme; accent: string; card: CSSProperties; onOpen?: () => void; editing: boolean; mono?: boolean }) {
  const v = data.wedding.venue
  const name = v.name || '예식장'
  const dirs = (data.phone.directions || []).filter(x => x.text.trim())
  const btn: CSSProperties = { cursor: editing ? 'inherit' : 'pointer', font: 'inherit', textAlign: 'left', border: 0, padding: 0 }
  const SYSF = "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif"
  // 앱 아이콘 배지 (위젯 왼쪽 위 — 폰 위젯처럼 어떤 앱인지)
  const badge = (sz = 22) => (
    <span style={{ width: sz, height: sz, borderRadius: sz * 0.26, background: 'linear-gradient(180deg, #FFC66B, #FF9500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
      <AppGlyph app="memo" color="#FFFFFF" size={Math.round(sz * 0.62)} />
    </span>
  )
  const pin = (sz: number) => (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ width: sz, height: sz, borderRadius: '50%', background: '#FF3B30', border: `${Math.max(2, sz * 0.12)}px solid #FFFFFF`, boxShadow: '0 3px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
        <PhoneIcon name="heart" color="#FFFFFF" size={sz * 0.42} />
      </span>
    </span>
  )
  // 지도 앱 느낌의 바탕 (도로 · 공원 · 강)
  const art = (
    <span aria-hidden style={{ position: 'absolute', inset: 0, background: '#F1EFE9', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', right: '-25%', top: '58%', width: '90%', height: '42%', borderRadius: '50%', background: '#C9DDF0', transform: 'rotate(-12deg)' }} />
      <span style={{ position: 'absolute', left: '-8%', top: '6%', width: '36%', height: '30%', borderRadius: 16, background: '#D6E8CC' }} />
      <span style={{ position: 'absolute', left: '-5%', right: '-5%', top: '44%', height: 8, background: '#FFD98A', transform: 'rotate(-7deg)', boxShadow: '0 0 0 1.5px #F2C45E' }} />
      <span style={{ position: 'absolute', top: '-5%', bottom: '-5%', left: '62%', width: 6, background: '#FFFFFF', transform: 'rotate(8deg)', boxShadow: '0 0 0 1px #E2DED5' }} />
      <span style={{ position: 'absolute', top: 0, bottom: 0, left: '24%', width: 4, background: '#FFFFFF', boxShadow: '0 0 0 1px #E2DED5' }} />
      <span style={{ position: 'absolute', left: 0, right: 0, top: '78%', height: 4, background: '#FFFFFF', boxShadow: '0 0 0 1px #E2DED5' }} />
    </span>
  )
  const sys: CSSProperties = { fontFamily: SYSF }

  // ── 길 안내 — 교통 앱 위젯처럼 노선 배지 + 한 줄
  if (variant === 1 && size !== 'S') {
    const list = dirs.length ? dirs : [{ kind: 'etc' as const, text: v.address || '주소를 넣어 주세요' }]
    const max = size === 'H' || size === 'W' ? 1 : 3
    return (
      <button type="button" onClick={onOpen} style={{ ...card, ...btn, ...sys, padding: size === 'H' || size === 'W' ? '0 14px' : '14px 14px', display: 'flex', flexDirection: 'column', justifyContent: size === 'H' || size === 'W' ? 'center' : 'flex-start', gap: size === 'H' || size === 'W' ? 5 : 9 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {badge(size === 'H' ? 18 : 20)}
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>오시는 길</span>
          {(size === 'W' || size === 'L') && <span style={{ fontSize: 11.5, color: t.cardSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>}
        </span>
        {list.slice(0, max).map((d, i) => (
          <span key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
            <DirBadge kind={d.kind} text={d.text} sz={size === 'H' ? 16 : 20} />
            <span style={{ fontSize: size === 'H' ? 11.5 : 12.5, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.text}</span>
          </span>
        ))}
      </button>
    )
  }

  // ── 주소 카드 — 지도 앱의 장소 카드처럼
  if (variant === 2 && size !== 'S') {
    const col = size === 'M' || size === 'L'
    return (
      <button type="button" onClick={onOpen} style={{ ...card, ...btn, ...sys, padding: size === 'H' ? '0 12px' : 14, display: 'flex', flexDirection: col ? 'column' : 'row', alignItems: col ? 'stretch' : 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ display: 'flex', flexDirection: col ? 'column' : 'row', alignItems: col ? 'flex-start' : 'center', gap: col ? 8 : 10, minWidth: 0 }}>
          {badge(size === 'H' ? 30 : 36)}
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: size === 'H' ? 13 : 15, fontWeight: 700, ...(col ? { wordBreak: 'keep-all', lineHeight: 1.3 } : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>{name}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: t.cardSub, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{size === 'L' || size === 'W' ? [v.hall, v.address].filter(Boolean).join(' · ') : '예식장 · 오시는 길'}</span>
          </span>
        </span>
        {size !== 'H' && (
          <span style={{ display: 'flex', gap: 6, alignSelf: col ? 'stretch' : 'center' }}>
            <span style={{ flex: col ? 1 : undefined, height: 30, padding: '0 12px', borderRadius: 999, background: '#007AFF', color: '#FFFFFF', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden><path d="M3 11l18-8-8 18-2-8z" fill="#FFFFFF" /></svg>길찾기
            </span>
          </span>
        )}
      </button>
    )
  }

  // ── 지도 — 지도 앱 위젯처럼 꽉 찬 지도 + 왼쪽 위 앱 배지 + 아래 장소
  if (size === 'S') return (
    <button type="button" onClick={onOpen} style={{ ...card, ...btn, position: 'relative' }}>
      {art}
      <span style={{ position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%, -50%)' }}>{pin(22)}</span>
      <span style={{ position: 'absolute', left: 6, top: 6 }}>{badge(16)}</span>
    </button>
  )
  const row = size === 'H' || size === 'W'
  return (
    <button type="button" onClick={onOpen} style={{ ...card, ...btn, ...sys, position: 'relative' }}>
      {art}
      <span style={{ position: 'absolute', left: row ? (size === 'H' ? '18%' : '30%') : '50%', top: row ? '50%' : '42%', transform: 'translate(-50%, -50%)' }}>{pin(row ? 22 : size === 'L' ? 30 : 26)}</span>
      <span style={{ position: 'absolute', left: 8, top: 8 }}>{badge(row ? 18 : 22)}</span>
      <span style={{ position: 'absolute', ...(row ? { right: 6, top: 6, bottom: 6, width: size === 'H' ? '64%' : '52%' } : { left: 8, right: 8, bottom: 8 }), padding: size === 'H' ? '5px 8px' : '7px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.94)', color: '#111111', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#FF9500', letterSpacing: '0.02em' }}>오시는 길</span>
        <span style={{ fontSize: size === 'H' ? 11.5 : row ? 12.5 : 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>{name}</span>
        {(size === 'L' || size === 'W') && <span style={{ fontSize: 11, color: '#6C6C70', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.address}</span>}
      </span>
    </button>
  )
}

/* ───────── 화면 바탕 ───────── */
function Backdrop({ data, t, dim, home }: { data: PhoneData; t: PhoneTheme; dim: number; home?: boolean }) {
  // 홈 — 홈 바탕 사진(커스텀 · 글래스 공용), 없으면 대표 사진
  const own = home && !!data.phone.homeImage
  const wp = own ? data.phone.homeImage : data.phone.wallpaper
  const crop = own ? data.phone.homeImageCrop : data.phone.wallpaperCrop
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: wp ? '#6E6861' : `linear-gradient(160deg, ${t.bg}, #8A8278)` }}>
        {wp && <Photo src={wp} crop={crop} mono={!!data.phone.photoMono} />}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(20,16,12,${dim})` }} />
    </>
  )
}
/** 밝은 바탕 (테마 색 + 모눈 무늬) */
function LightBg({ t }: { t: PhoneTheme }) {
  const bg = t.homeBg === 'photo' ? '#EFEFED' : t.bg
  const grid = t.pattern === 'grid' ? { backgroundImage: 'linear-gradient(rgba(0,0,0,0.075) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.075) 1px, transparent 1px)', backgroundSize: '22px 22px' } : null
  return <div style={{ position: 'absolute', inset: 0, background: bg, ...grid, pointerEvents: 'none' }} />
}

/* ───────── 잠금화면 — 사진·컬러 / 포스터 (날짜·시간·이름·장소·열기 버튼은 모두) ───────── */
/** 밀어서 청첩장 열기 — 동그라미를 오른쪽 끝까지 밀면 열림 (막대를 눌러도 끝까지 미끄러지며 열림) */
function SlideToOpen({ onOpen, onDark, accent, label }: { onOpen?: () => void; onDark: boolean; accent: string; label?: string }) {
  const KNOB = 42
  const PAD = 4
  const trackRef = useRef<HTMLDivElement>(null)
  const start = useRef<{ px: number; scale: number; moved: boolean } | null>(null)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  // 밀 수 있는 거리 — 막대 폭이 바뀌면 다시 잼
  const [span, setSpan] = useState(150)
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSpan(Math.max(1, el.offsetWidth - KNOB - PAD * 2)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // 전체 화면 요청은 손가락을 뗀 그 순간에 (카카오톡 등 앱 안 브라우저는 잠깐 뒤에 부르면 거절함) → PhoneFlow 가 받음
  const finish = () => { window.dispatchEvent(new Event('pf-open-gesture')); setX(span); setTimeout(() => { onOpen?.(); setX(0) }, 260) }
  const ink = onDark ? '#FFFFFF' : '#2A2A2A'
  const dim = onDark ? 'rgba(255,255,255,0.62)' : 'rgba(40,40,40,0.45)'
  const ratio = Math.min(1, x / span)
  return (
    <div ref={trackRef} role="button" tabIndex={0} aria-label="밀어서 청첩장 열기"
      onClick={() => { if (!start.current?.moved) finish() }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish() } }}
      style={{ position: 'relative', flex: 1, margin: '0 12px', height: 50, borderRadius: 25, background: onDark ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.06)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: onDark ? 'inset 0 0 0 1px rgba(255,255,255,0.18)' : 'inset 0 0 0 1px rgba(0,0,0,0.05)', cursor: 'pointer', touchAction: 'none', userSelect: 'none', overflow: 'hidden' }}>
      <span className="pf-shine" style={{ position: 'absolute', left: KNOB + PAD + 4, right: 10, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        backgroundImage: `linear-gradient(90deg, ${dim} 0%, ${dim} 38%, ${ink} 50%, ${dim} 62%, ${dim} 100%)`, backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'pfShine 2.8s linear infinite', opacity: 1 - ratio * 1.6, transition: dragging ? 'none' : 'opacity 0.3s' }}>{label?.trim() || '밀어서 청첩장 열기'}</span>
      <span
        onPointerDown={e => {
          e.stopPropagation()
          const el = trackRef.current
          const scale = el ? el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1 : 1
          start.current = { px: e.clientX - x * scale, scale, moved: false }
          setDragging(true)
          try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ }
        }}
        onPointerMove={e => {
          const st = start.current
          if (!st || !dragging) return
          const nx = Math.max(0, Math.min(span, (e.clientX - st.px) / st.scale))
          if (Math.abs(nx - x) > 2) st.moved = true
          setX(nx)
        }}
        onPointerUp={() => {
          setDragging(false)
          if (!start.current) return
          if (x > span * 0.8) finish()
          else setX(0)
          // 막대 onClick 이 끌기 끝을 '누름'으로 보지 않게 잠깐 남겨 둠
          setTimeout(() => { start.current = null }, 0)
        }}
        onPointerCancel={() => { setDragging(false); start.current = null; setX(0) }}
        className="pf-knob"
        style={{ position: 'absolute', left: PAD, top: PAD, width: KNOB, height: KNOB, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateX(${x}px)`, transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)', cursor: 'grab', touchAction: 'none' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 6.5l5.5 5.5L8 17.5" fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 6.5L18 12l-5.5 5.5" fill="none" stroke={accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  )
}

/** cameraHref — 하객 사진 공유 주소 (null 이면 숨김, 비우면 에디터 미리보기라 모양만) */
export function LockScreen(props: Parameters<typeof LockScreenInner>[0]) {
  return <BodyFont data={props.data}><LockScreenInner {...props} /></BodyFont>
}
function LockScreenInner({ data: base, onOpen, onOpenVenue, onOpenApp, cameraHref }: { data: PhoneData; onOpen?: () => void; onOpenVenue?: () => void; /** 잠금화면 검색창에서 고른 화면 */ onOpenApp?: (a: PhoneAppId) => void; cameraHref?: string | null }) {
  // 결혼식 당일 — 따로 써 둔 당일 알림 문구로
  const dayNotice = base.phone.lockNoticeDay?.trim()
  const raw = dayNotice && isWeddingDay(base) ? { ...base, phone: { ...base.phone, lockNotice: dayNotice } } : base
  const data = withLockNumber(raw)
  const music = useContext(MusicCtx)
  const t = themeOf(data)
  // 알림이 아래 '열기' 버튼을 가리지 않게 — 화면 높이와 알림 높이를 재서 아래 한도를 둔다
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [noticeMaxTop, setNoticeMaxTop] = useState(9999)
  // 화면 높이 — 설계(844)보다 짧은 화면에선 포스터 사진을 그만큼 줄여 시계 · 날짜를 덮지 않게
  const [rootH, setRootH] = useState(PHONE_H)
  useEffect(() => {
    const r = rootRef.current
    if (!r) return
    const fit = () => { if (r.offsetHeight) setRootH(r.offsetHeight) }
    const ro = new ResizeObserver(fit)
    ro.observe(r); fit()
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    const r = rootRef.current, c = cardRef.current
    if (!r || !c) return
    const fit = () => setNoticeMaxTop(r.offsetHeight - 118 - (raw.phone.lockSearch ? 72 + Math.max(0, raw.phone.lockSearchY || 0) : 0) - c.offsetHeight)
    const ro = new ResizeObserver(fit)
    ro.observe(r); ro.observe(c); fit()
    return () => ro.disconnect()
  })
  const wp = weddingParts(data)
  const names = [data.groom.name, data.bride.name].filter(Boolean).join(' · ') || '신랑 · 신부'
  const venue = data.wedding.showVenue !== false ? data.wedding.venue.name : ''
  const dateKo = wp.d ? `${wp.month}월 ${wp.day}일 ${wp.dayKo}요일` : '예식일'
  // 시계 위 한마디 — 문구만 (비우면 영문 날짜)
  const caption = (data.phone.lockCaption ?? 'our wedding day').trim()
  const dateEn = wp.d ? `${wp.dayShort} ${wp.day}` : ''
  const clock = wp.clock || '14:00'
  const style = data.phone.lockStyle || 'photo'
  const nf = numberFontOf(data)
  // 시계 묶음 위치 · 정렬 · 크기 (에디터에서 조절)
  const lc = data.phone.lockClock || {}
  const dy = lc.y || 0
  const sz = lc.size || 1
  const al = lc.align || 'center'
  // 짧은 화면(카카오톡 등 위아래 바가 큰 브라우저) — 사진 자리를 지키도록 시계 묶음을 위로 올리고 살짝 줄임
  const shortBy = Math.max(0, PHONE_H - rootH)
  const shortScale = 1 - Math.min(0.22, shortBy / 900)
  const block = (top: number): CSSProperties => ({ position: 'absolute', left: al === 'center' ? 0 : 28, right: al === 'center' ? 0 : 28, top: shortBy ? Math.max(52, top + dy - shortBy * 0.45) : top + dy, zIndex: 2,
    ...(shortBy ? { transform: `scale(${shortScale})`, transformOrigin: al === 'left' ? '0 0' : al === 'right' ? '100% 0' : '50% 0' } : {}), pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: al === 'left' ? 'flex-start' : al === 'right' ? 'flex-end' : 'center', textAlign: al })
  const cap = (want: number, maxW: number) => clockCap(data, want * sz, Math.min(al === 'center' ? 350 : 334, maxW * Math.max(1, sz)))
  const ny = data.phone.lockNoticeY || 0
  const vv = data.wedding.venue
  /** 알림 카드 속 예식장 정보 + 바로 보기 (옵션) */
  const venueBox = (sub: string, line: string, btnBg: string, btnInk: string) => data.phone.lockVenue !== false && (vv.name || vv.address) ? (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, paddingTop: 10, borderTop: `1px solid ${line}` }}>
      <span style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <PhoneIcon name="map" color={sub} size={16} stroke={1.8} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{[vv.name, vv.hall].filter(Boolean).join(' ') || '예식장'}</span>
          {vv.address && <span style={{ fontSize: 12, color: sub }}>{vv.address}</span>}
        </span>
      </span>
      <button type="button" onClick={e => { e.stopPropagation(); (onOpenVenue || onOpen)?.() }}
        style={{ height: 36, borderRadius: 12, border: 0, background: btnBg, color: btnInk, fontSize: 13, fontWeight: 600, cursor: 'pointer', font: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        예식장 정보 바로 보기<PhoneIcon name="chevron" color={btnInk} size={14} stroke={2} />
      </button>
    </span>
  ) : null
  // 사용자가 고른 시계 · 문구 색 (없으면 디자인 기본)
  const cc = data.phone.lockClockColor
  const tc = data.phone.lockTextColor
  const infoLine = [[wp.d ? `${wp.month}월 ${wp.day}일 ${wp.dayKo}요일` : '', wp.timeKo].filter(Boolean).join(' '), venue].filter(Boolean).join(' · ')
  /** 시계 아래 두 줄 — 세 디자인 모두 같은 방식 */
  const below = (nameInk: string, infoInk: string, mt: number, shadow?: string) => (
    <>
      <span style={{ marginTop: mt, fontSize: 15, fontWeight: 700, color: tc || nameInk, textShadow: shadow }}>{names}</span>
      {infoLine && <span style={{ marginTop: 4, fontSize: 13, fontWeight: 500, color: tc || infoInk, opacity: tc ? 0.85 : 1, textShadow: shadow }}>{infoLine}</span>}
    </>
  )
  const homeBar = (c: string) => <span style={{ width: 134, height: 5, borderRadius: 3, background: c }} />
  // 알림 사진 — 따로 올린 사진이 있으면 그것, 없으면 대표 사진
  const thumbSrc = data.phone.lockNoticePhoto || coverOf(data)
  const thumbCrop = data.phone.lockNoticePhoto ? data.phone.lockNoticePhotoCrop : data.phone.wallpaper ? data.phone.wallpaperCrop : undefined

  /** 알림 — 디자인 3가지 (알림 카드 · 메시지 · 편지). mode = 바탕이 사진 / 밝은 색 / 어두운 색 */
  const noticeEl = (mode: 'photo' | 'light' | 'dark', pos: CSSProperties) => (
    <div ref={cardRef} data-ed="notice" style={{ position: 'absolute', left: 0, right: 0, zIndex: 1, ...pos }}>{noticeInner(mode)}</div>
  )
  const noticeInner = (mode: 'photo' | 'light' | 'dark') => {
    const ns = data.phone.lockNoticeStyle || 'card'
    const onDark = mode === 'dark'
    const sub = onDark ? 'rgba(255,255,255,0.72)' : '#6E665D'
    const ink = onDark ? '#FFFFFF' : '#2A2622'
    const line = onDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'
    const base: CSSProperties = { position: 'relative', margin: '0 16px', cursor: 'pointer' }
    const thumbEl = (s: number, r: number | string) => thumbSrc
      ? <span style={{ width: s, height: s, borderRadius: r, overflow: 'hidden', flexShrink: 0 }}><Photo src={thumbSrc} crop={data.phone.lockNoticePhoto ? thumbCrop : undefined} mono={!!data.phone.photoMono} /></span>
      : <span style={{ width: s, height: s, borderRadius: r, background: data.phone.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="heart" color="#FFFFFF" size={s * 0.42} /></span>

    if (ns === 'message') {
      const bubble = mode === 'photo' ? 'rgba(255,255,255,0.92)' : onDark ? 'rgba(255,255,255,0.16)' : '#ECECEE'
      const nameInk = mode === 'photo' ? 'rgba(255,255,255,0.92)' : sub
      return (
        <div onClick={onOpen} style={{ ...base, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          {thumbEl(38, '50%')}
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: nameInk, marginLeft: 12, textShadow: mode === 'photo' ? '0 1px 8px rgba(0,0,0,0.3)' : undefined }}>{names}</span>
            <span style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxWidth: '100%', padding: '11px 15px', borderRadius: '20px 20px 20px 6px', background: bubble, color: ink, fontSize: 15, lineHeight: 1.45 }}>
              <span style={{ whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.lockNotice}</span>
              {venueBox(sub, line, onDark ? 'rgba(255,255,255,0.18)' : data.phone.accent, onDark ? '#FFFFFF' : '#FFFFFF')}
            </span>
            <span style={{ fontSize: 11, color: nameInk, marginLeft: 12 }}>지금 · 눌러서 열기</span>
          </span>
        </div>
      )
    }
    if (ns === 'live') {
      // 라이브 활동 — 어두운 막대, 디데이 + 남은 날 진행 막대
      const n = ddayCount(data.wedding.date)
      const pct = n == null ? 0 : Math.max(4, Math.min(100, Math.round((1 - Math.min(n, 365) / 365) * 100)))
      return (
        <div onClick={onOpen} style={{ ...base, borderRadius: 26, background: onDark ? 'rgba(255,255,255,0.14)' : 'rgba(18,18,18,0.88)', color: '#FFFFFF', padding: '14px 16px 14px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {thumbEl(44, 12)}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{names}</span>
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.phone.lockNotice}</span>
            </span>
            <span style={{ ...numCss(data, 22), color: '#FFFFFF' }}>{ddayText(n)}</span>
          </span>
          <span style={{ marginTop: 12, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
            <span style={{ display: 'block', width: `${pct}%`, height: '100%', borderRadius: 3, background: data.phone.accent }} />
          </span>
          <span style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
            <span>오늘</span><span>{wp.d ? `${wp.month}.${wp.day} ${wp.dayKo} ${wp.timeShort}` : '예식일'}</span>
          </span>
          {venueBox('rgba(255,255,255,0.7)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.16)', '#FFFFFF')}
        </div>
      )
    }
    if (ns === 'calendar') {
      // 캘린더 초대 — 날짜 블록 + 일정 제목
      const bg = mode === 'photo' ? 'rgba(255,255,255,0.92)' : onDark ? 'rgba(255,255,255,0.14)' : '#FFFFFF'
      return (
        <div onClick={onOpen} style={{ ...base, borderRadius: 22, background: bg, color: ink, padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', boxShadow: mode === 'light' ? '0 6px 20px rgba(0,0,0,0.07)' : undefined }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: sub }}>
            <PhoneIcon name="calendar" color={sub} size={14} stroke={1.8} /><span style={{ flex: 1 }}>캘린더 · 새 초대</span><span>지금</span>
          </span>
          <span style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10 }}>
            <span style={{ width: 54, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingRight: 12, borderRight: `1px solid ${line}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: data.phone.accent }}>{wp.d ? wp.monthShort.toUpperCase() : 'DATE'}</span>
              <span style={{ ...numCss(data, 24), marginTop: 4 }}>{wp.day ?? '—'}</span>
              <span style={{ fontSize: 11, color: sub, marginTop: 4 }}>{wp.dayKo ? `${wp.dayKo}요일` : ''}</span>
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em' }}>{names} 결혼식</span>
              <span style={{ fontSize: 13, color: sub, fontVariantNumeric: 'tabular-nums' }}>{[wp.timeShort, venue].filter(Boolean).join(' · ')}</span>
              <span style={{ fontSize: 13, lineHeight: 1.45, marginTop: 2, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.lockNotice}</span>
            </span>
          </span>
          {venueBox(sub, line, onDark ? 'rgba(255,255,255,0.18)' : data.phone.accent, '#FFFFFF')}
        </div>
      )
    }
    if (ns === 'memory') {
      // 사진 추억 — 사진 위 제목, 아래 문구
      const tn = titleNames(data)
      return (
        <div onClick={onOpen} style={{ ...base, borderRadius: 24, overflow: 'hidden', background: onDark ? 'rgba(255,255,255,0.14)' : mode === 'photo' ? 'rgba(255,255,255,0.92)' : '#FFFFFF', color: ink, boxShadow: mode === 'light' ? '0 8px 24px rgba(0,0,0,0.08)' : undefined }}>
          <span style={{ display: 'block', position: 'relative', height: 150, background: `linear-gradient(150deg, ${data.phone.accent}, #2A2622)` }}>
            {thumbSrc && <Photo src={thumbSrc} crop={thumbCrop} mono={!!data.phone.photoMono} />}
            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)' }} />
            <span style={{ position: 'absolute', left: 16, top: 12, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)' }}>OUR DAY</span>
            <span style={{ position: 'absolute', left: 16, right: 16, bottom: 12, color: '#FFFFFF' }}>
              <span style={{ display: 'block', ...titleCss(data, 26), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tn.a} {tn.latin ? <span style={{ fontStyle: 'italic' }}>&amp;</span> : '&'} {tn.b}</span>
              <span style={{ display: 'block', fontSize: 12.5, marginTop: 4, opacity: 0.9, fontVariantNumeric: 'tabular-nums' }}>{[dateKo, wp.timeShort].filter(Boolean).join(' · ')}</span>
            </span>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px 14px' }}>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.lockNotice}</span>
            {venueBox(sub, line, onDark ? 'rgba(255,255,255,0.18)' : data.phone.accent, '#FFFFFF')}
          </span>
        </div>
      )
    }
    if (ns === 'letter') {
      return (
        <div onClick={onOpen} style={{ ...base, margin: '0 24px', borderRadius: 6, background: '#FFFFFF', color: '#2A2622', padding: '24px 22px 20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.14)', outline: '1px solid rgba(0,0,0,0.08)', outlineOffset: -8 }}>
          <span style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: `1.5px dashed ${data.phone.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="heart" color={data.phone.accent} size={14} /></span>
          <span style={{ display: 'block', fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 12.5, fontWeight: 500, letterSpacing: '0.32em', color: data.phone.accent }}>INVITATION</span>
          <span style={{ display: 'block', fontFamily: "var(--font-noto-serif-kr), 'Noto Serif KR', serif", fontSize: 18, fontWeight: 600, marginTop: 10, letterSpacing: '-0.02em' }}>{names}</span>
          <span style={{ display: 'block', width: 24, height: 1, background: data.phone.accent, margin: '12px auto' }} />
          <span style={{ display: 'block', fontFamily: "var(--font-noto-serif-kr), 'Noto Serif KR', serif", fontSize: 13.5, lineHeight: 1.7, color: '#5A534C', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.lockNotice}</span>
          <span style={{ display: 'block', textAlign: 'left' }}>{venueBox('#6E665D', 'rgba(0,0,0,0.08)', data.phone.accent, '#FFFFFF')}</span>
        </div>
      )
    }
    // card — 폰 알림
    const bg = mode === 'photo' ? 'rgba(255,255,255,0.84)' : onDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.045)'
    return (
      <div onClick={onOpen} style={{ ...base, borderRadius: 22, background: bg, color: ink, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {thumbEl(22, 6)}
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{names}의 청첩장</span>
          <span style={{ padding: '2px 8px', borderRadius: 999, background: data.phone.accent, color: '#FFFFFF', fontSize: 11, flexShrink: 0 }}>초대장</span>
        </span>
        <span style={{ fontSize: 15, lineHeight: 1.5, marginTop: 4, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.lockNotice}</span>
        {venueBox(sub, line, onDark ? 'rgba(255,255,255,0.18)' : data.phone.accent, '#FFFFFF')}
      </div>
    )
  }

  // 사진이 없으면 고른 색 바탕 (밝은 색은 회색 시계, 어두운 색은 흰 글씨)
  const bgColor = data.phone.lockBg || (t.homeBg === 'photo' ? '#FFFFFF' : t.bg)
  const dark = isDark(bgColor)
  const ink = dark
    ? { date: 'rgba(255,255,255,0.86)', clock: 'rgba(255,255,255,0.9)', info: 'rgba(255,255,255,0.72)', card: 'rgba(255,255,255,0.14)', cardInk: '#FFFFFF', cardSub: 'rgba(255,255,255,0.72)', pill: 'rgba(255,255,255,0.18)', pillInk: '#FFFFFF', bar: 'rgba(255,255,255,0.85)' }
    : { date: '#6E6E6E', clock: '#7A7A7A', info: '#5A5A5A', card: 'rgba(0,0,0,0.045)', cardInk: '#2A2A2A', cardSub: '#6E6E6E', pill: 'rgba(0,0,0,0.06)', pillInk: '#2A2A2A', bar: 'rgba(0,0,0,0.75)' }
  // 아래 줄 — 왼쪽 음악 · 가운데 '밀어서 청첩장 열기' · 오른쪽 카메라(하객 사진 공유). 폰 잠금화면처럼 한 줄에 높이를 맞춤
  const circle = (onDark: boolean): CSSProperties => ({ width: 50, height: 50, borderRadius: '50%', border: 0, padding: 0, flexShrink: 0, background: onDark ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.06)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' })
  const hasSong = music ? !!music.has : !!(data.bgm?.enabled && data.bgm.url)
  const bottomBar = (onDark: boolean, bar: string) => {
    const ink = onDark ? '#FFFFFF' : '#2A2A2A'
    return (
      <>
      {data.phone.lockSearch && (
        // 검색창 — 추천 검색어가 번갈아 보이고, 고르면 잠금이 풀리며 그 화면으로 (위치 · 모양은 사용자가)
        <div data-ed="search" style={{ position: 'absolute', left: 22, right: 22, bottom: 104 + Math.max(0, data.phone.lockSearchY || 0), height: 52, zIndex: 6 }} onClick={e => e.stopPropagation()}>
          <SearchWidget data={data} size="W" variant={data.phone.lockSearchStyle ?? (onDark ? 3 : 0)} hint={data.phone.lockSearchHint} items={data.phone.lockSearches} t={t} editing={!onOpenApp} onOpenApp={onOpenApp} />
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 3 }}>
        <style>{'@keyframes pfShine { from { background-position: 100% 0; } to { background-position: -100% 0; } } @media (prefers-reduced-motion: reduce) { .pf-shine { animation: none !important; } }'}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', height: 50 }}>
          {hasSong
            ? <button type="button" aria-label={music?.playing ? '음악 끄기' : '음악 켜기'} onClick={e => { e.stopPropagation(); music?.toggle() }} style={circle(onDark)}>
                {music?.playing
                  ? <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill={ink} /></svg>
                  : <PhoneIcon name="music" color={ink} size={22} stroke={1.7} />}
              </button>
            : <span style={{ width: 50 }} />}
          <SlideToOpen onOpen={onOpen} onDark={onDark} accent={data.phone.accent} label={data.phone.lockSlideText} />
          {cameraHref === null
            ? <span style={{ width: 50 }} />
            : <a href={cameraHref || undefined} aria-label="사진 공유" onClick={e => { e.stopPropagation(); if (!cameraHref) e.preventDefault() }} style={{ ...circle(onDark), cursor: cameraHref ? 'pointer' : 'default' }}>
                <PhoneIcon name="camera" color={ink} size={23} stroke={1.7} />
              </a>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '22px 0 9px' }}>{homeBar(bar)}</div>
      </div>
      </>
    )
  }
  if (style !== 'poster' && !data.phone.wallpaper) return (
    <div ref={rootRef} data-ed="lockbg" style={{ position: 'absolute', inset: 0, fontFamily: t.body, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor, ...(t.pattern === 'grid' && !dark ? { backgroundImage: 'linear-gradient(rgba(0,0,0,0.075) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.075) 1px, transparent 1px)', backgroundSize: '22px 22px' } : null) }} />
      <div data-ed="clock" style={block(96)}>
        <span style={{ fontSize: 20, fontWeight: 500, color: tc || ink.date }}>{caption || dateEn}</span>
        <span style={{ ...numCss(data, cap(80, 258)), color: cc || ink.clock, marginTop: 10 }}><RollClock to={clock} /></span>
        {below(dark ? '#FFFFFF' : '#3A3A3A', ink.info, 18)}
      </div>
      {data.phone.lockNoticeShow !== false && noticeEl(dark ? 'dark' : 'light', { bottom: 128 + (data.phone.lockSearch ? 64 + Math.max(0, data.phone.lockSearchY || 0) : 0), transform: ny ? `translateY(${Math.min(ny, 18)}px)` : undefined })}
      {bottomBar(dark, ink.bar)}
    </div>
  )

  if (style === 'poster') {
    // 길쭉한 숫자면 화면 폭 86% 까지 크게, 아니면 보통 크기
    const tall = data.phone.fonts?.number === 'condensed'
    return (
      <div ref={rootRef} data-ed="lockbg" style={{ position: 'absolute', inset: 0, color: '#2A2A2A', fontFamily: t.body, overflow: 'hidden' }}>
        {data.phone.lockBg && !dark ? <div style={{ position: 'absolute', inset: 0, background: data.phone.lockBg }} /> : <LightBg t={t} />}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.max(220, (data.phone.posterH ?? POSTER_PHOTO_H) - shortBy * 0.6), WebkitMaskImage: (data.phone.posterFade ?? 38) > 0 ? `linear-gradient(180deg, transparent 0%, #000 ${data.phone.posterFade ?? 38}%)` : undefined, maskImage: (data.phone.posterFade ?? 38) > 0 ? `linear-gradient(180deg, transparent 0%, #000 ${data.phone.posterFade ?? 38}%)` : undefined }}>
          <Photo src={coverOf(data)} crop={data.phone.wallpaper ? data.phone.wallpaperCrop : undefined} mono={!!data.phone.photoMono} />
        </div>
        <div data-ed="clock" style={block(tall ? 88 : 100)}>
          <span style={{ fontSize: 20, fontWeight: 500, color: tc || '#3A3A3A' }}>{caption || dateEn}</span>
          <span style={{ ...numCss(data, tall ? cap(136, 262) : cap(84, 258)), color: cc || '#A0A0A0', marginTop: tall ? 4 : 10, letterSpacing: tall ? '-0.03em' : nf.letterSpacing }}><RollClock to={clock} /></span>
          {below('#3A3A3A', '#6A6A6A', tall ? 14 : 18)}
        </div>
        {data.phone.lockNoticeShow === true && noticeEl('photo', { bottom: 128, transform: ny ? `translateY(${Math.min(ny, 18)}px)` : undefined })}
        {bottomBar(true, 'rgba(255,255,255,0.9)')}
      </div>
    )
  }

  // photo — 배경화면 사진 위 흰 글씨
  const shadow = '0 1px 12px rgba(0,0,0,0.25)'
  return (
    <div ref={rootRef} data-ed="lockbg" style={{ position: 'absolute', inset: 0, color: '#FFFFFF', fontFamily: t.body }}>
      <Backdrop data={data} t={t} dim={0.16} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 320, background: 'linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0))' }} />
      <div data-ed="clock" style={{ ...block(84), textShadow: shadow }}>
        <span style={{ fontSize: 20, fontWeight: 500, color: tc }}>{caption || dateKo}</span>
        <span style={{ ...numCss(data, cap(76, 258)), marginTop: 10, color: cc }}><RollClock to={clock} /></span>
        {below('#FFFFFF', 'rgba(255,255,255,0.92)', 14)}
      </div>
      {data.phone.lockNoticeShow !== false && noticeEl('photo', { top: Math.max(120, Math.min(318 + ny, noticeMaxTop)) })}
      {bottomBar(true, 'rgba(255,255,255,0.85)')}
    </div>
  )
}

/** 비밀번호로 열리는 움직임 (하객 흐름 · 에디터 캔버스 모두에서 쓰려고 컴포넌트가 직접 넣는다) */
const REVEAL_CSS = `@keyframes pfRise { from { opacity: 0; transform: translateY(18px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes pfBeat { 0% { transform: scale(1); } 35% { transform: scale(1.18); } 60% { transform: scale(0.96); } 100% { transform: scale(1); } }
@keyframes pfNextKey { 0%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.32), 0 0 0 0 rgba(255,255,255,0.0); background: rgba(255,255,255,0.16); } 50% { box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.9), 0 0 0 10px rgba(255,255,255,0.14); background: rgba(255,255,255,0.32); } }
.pf-next-key { animation: pfNextKey 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .pf-reveal, .pf-reveal * { animation: none !important; transition: none !important; } }`

/* ───────── 비밀번호 ───────── */
export function PasscodeScreen(props: Parameters<typeof PasscodeScreenInner>[0]) {
  return <BodyFont data={props.data}><PasscodeScreenInner {...props} /></BodyFont>
}
function PasscodeScreenInner({ data: raw, onDone, onCancel }: { data: PhoneData; onDone: () => void; onCancel: () => void }) {
  const data = withLockNumber(raw)
  const t = themeOf(data)
  const wp = weddingParts(data)
  const answer = wp.d ? `${String(wp.month).padStart(2, '0')}${String(wp.day).padStart(2, '0')}` : ''
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')

  const [opened, setOpened] = useState(false)
  const press = (n: string) => {
    if (opened) return
    const next = (code + n).slice(0, 4)
    if (next.length < 4) { setCode(next); setErr(''); return }
    if (next === answer) {
      setCode(next); setErr('')
      // 네 번째 점이 찬 걸 잠깐 보여 준 뒤 열림
      setTimeout(() => setOpened(true), 160)
      setTimeout(onDone, 160 + 1050)
    } else { setCode(''); setErr('날짜를 다시 확인해 주세요') }
  }
  const ease = 'cubic-bezier(0.32, 0.72, 0, 1)'
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']
  return (
    <div className="pf-reveal" style={{ position: 'absolute', inset: 0, color: '#FFFFFF', fontFamily: t.body, overflow: 'hidden' }}>
      <style>{REVEAL_CSS}</style>
      {/* 잠금화면 배경이 흐리게 비치도록 */}
      {data.phone.wallpaper
        ? <div style={{ position: 'absolute', inset: -30, filter: opened ? 'blur(0px)' : 'blur(16px)', transform: opened ? 'scale(1)' : 'scale(1.06)', transition: `filter 0.9s ${ease}, transform 0.9s ${ease}` }}><Backdrop data={data} t={t} dim={0} /></div>
        : <div style={{ position: 'absolute', inset: 0, background: data.phone.lockBg || (t.homeBg === 'photo' ? '#8A8278' : t.bg) }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,12,0.26)', opacity: opened ? 0 : 1, transition: `opacity 0.9s ${ease}` }} />
      {/* 열리는 순간 — 점 네 개가 모여 하트 하나 */}
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '50%', display: 'flex', justifyContent: 'center', transform: `translateY(-50%) scale(${opened ? 1 : 0.4})`, opacity: opened ? 1 : 0, transition: `transform 0.6s ${ease} 0.1s, opacity 0.35s ease 0.1s`, pointerEvents: 'none', zIndex: 2 }}>
        <span style={{ width: 64, height: 64, borderRadius: '50%', background: data.phone.wallpaper ? 'rgba(255,255,255,0.18)' : data.phone.accent, backdropFilter: 'blur(10px)', boxShadow: data.phone.wallpaper ? 'inset 0 0 0 1px rgba(255,255,255,0.4)' : '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: opened ? 'pfBeat 0.9s ease 0.35s both' : undefined }}>
          <PhoneIcon name="heart" color="#FFFFFF" size={28} />
        </span>
      </div>
      {/* 화면 세로 가운데 — 폰 비밀번호 화면처럼 맨 아래 줄 0 양옆에 '취소' · '그냥 열기' */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 20, opacity: opened ? 0 : 1, transform: opened ? 'translateY(12px) scale(0.97)' : 'none', transition: `opacity 0.35s ease, transform 0.5s ${ease}`, pointerEvents: opened ? 'none' : 'auto' }}>
        <span style={{ fontSize: 13, letterSpacing: '0.2em', opacity: 0.85 }}>WEDDING INVITATION</span>
        <span style={{ marginTop: 10, fontSize: 18, fontWeight: 600 }}>{[data.groom.name, data.bride.name].filter(Boolean).join(' · ') || '저희'} 결혼식에 초대합니다</span>
        <span style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>{wp.d ? `${wp.month}월 ${wp.day}일, 그날의 날짜 네 자리로 열어 주세요` : '결혼식 날짜 네 자리로 열어 주세요'}</span>
        <div style={{ marginTop: 24, display: 'flex', gap: opened ? 0 : 18, transition: `gap 0.3s ${ease}` }}>
          {[0, 1, 2, 3].map(i => <span key={i} style={{ transition: 'background 0.15s', width: 14, height: 14, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.9)', background: i < code.length ? '#FFFFFF' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)' }} />)}
        </div>
        <span style={{ marginTop: 14, height: 18, fontSize: 13, color: '#FFD9CF' }}>{err}</span>
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 76px)', gap: '16px 24px' }}>
          {keys.map((k, i) => k
            ? <button key={i} type="button" onClick={() => press(k)} className={!opened && answer && answer[code.length] === k ? 'pf-next-key' : undefined} style={{ width: 76, height: 76, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.32), inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 18px rgba(0,0,0,0.12)', color: '#FFFFFF', fontSize: 30, fontWeight: 300, cursor: 'pointer' }}>{k}</button>
            : i === 9
            ? <button key={i} type="button" onClick={onCancel} style={{ width: 76, height: 76, border: 0, background: 'transparent', color: '#FFFFFF', fontSize: 15, cursor: 'pointer', font: 'inherit' }}>취소</button>
            // 폰 비밀번호 화면처럼 — 숫자를 누르면 '건너뛰기' 자리가 '지우기'로 (한 칸씩)
            : code.length && !opened
            ? <button key={i} type="button" onClick={() => { setCode(c => c.slice(0, -1)); setErr('') }} style={{ width: 76, height: 76, border: 0, background: 'transparent', color: '#FFFFFF', fontSize: 15, cursor: 'pointer', font: 'inherit' }}>지우기</button>
            : <button key={i} type="button" onClick={onDone} style={{ width: 76, height: 76, border: 0, background: 'transparent', color: '#FFFFFF', fontSize: 15, cursor: 'pointer', font: 'inherit' }}>건너뛰기</button>)}
        </div>
      </div>
    </div>
  )
}

/* ───────── 홈 화면 ───────── */
export interface HomeEditing {
  selectedId: string | null
  draggingId?: string | null
  ghost?: { col: number; row: number; size: WidgetSize; ok: boolean } | null
  onWidgetPointerDown: (e: ReactPointerEvent, w: PhoneWidget) => void
  onBackgroundPointerDown: () => void
  /** 고른 위젯 오른쪽 아래 손잡이를 끌어 크기 바꾸기 (크기가 여러 개인 위젯만) */
  onResizePointerDown?: (e: ReactPointerEvent, w: PhoneWidget) => void
  canResize?: (w: PhoneWidget) => boolean
  /** 위젯 왼쪽 위 '−' — 바로 빼기 */
  onRemove?: (w: PhoneWidget) => void
  /** 지금 고치는 홈 화면 장 (0부터) */
  page?: number
  /** 깔끔하게 — 칸 점선은 끌 때만, '−' 는 고른 위젯에만 (휴대폰 꾸미기) */
  clean?: boolean
}

export function HomeScreen(props: Parameters<typeof HomeScreenInner>[0]) {
  return <BodyFont data={props.data}><HomeScreenInner {...props} /></BodyFont>
}
function HomeScreenInner({ data, onOpenApp, editing, reveal }: { data: PhoneData; onOpenApp?: (a: PhoneAppId) => void; editing?: HomeEditing; reveal?: boolean }) {
  const t = themeOf(data)
  const accent = data.phone.accent
  // 아래 독 — 하객이 꼭 쓰는 네 곳 (위 앱 아이콘과 겹치지 않게)
  // 하단 바 — 사용자가 고른 화면 (예식 안내는 지도 아이콘)
  const dockAll: { app: PhoneAppId; icon: string; label: string }[] = dockOf(data).map(a => ({ app: a, icon: a === 'memo' ? 'map' : APP_META[a].icon, label: APP_META[a].label }))
  // 하객 화면에서는 내용이 빈 앱을 숨긴다 (에디터에서는 모두 보임)
  const dock = editing ? dockAll.filter(d => !isAppOff(data, d.app)) : dockAll.filter(d => !isEmptyApp(data, d.app))
  const music = useContext(MusicCtx)
  const barDark = t.homeBg === 'photo' ? !isDark(t.labelInk) : isDark(t.bar)
  const open = (a: PhoneAppId) => { if (!editing) onOpenApp?.(a) }
  // 실제 화면 높이(설계 px)에 맞춰 칸 높이를 정한다
  const rootRef = useRef<HTMLDivElement>(null)
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [screenH, setScreenH] = useState(PHONE_H)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setScreenH(el.offsetHeight || PHONE_H))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // 하객 화면 — 위젯 모양은 그대로 두고, 화면이 짧으면 빈 곳(위 여백 · 칸 사이 · 하단 바 아래)부터 줄임
  // 그래도 모자랄 때만 위젯 · 하단 바를 통째로 조금 줄임 (바탕 · 펼친 폴더는 꽉 채움)
  const compact = !editing
  const ch = compact ? GRID.cellH : cellHFor(screenH)
  const onPhoto = t.homeBg === 'photo'
  // 바탕 흐림 — 가장자리가 비지 않게 살짝 키움
  const hb = Math.max(0, Math.min(40, data.phone.homeBlur ?? 0))
  // 장 — 에디터는 고치는 장만, 하객은 모든 장을 옆으로
  const pageTotal = homePagesOf(data)
  const shownPages = editing ? [Math.min(editing.page ?? 0, pageTotal - 1)] : Array.from({ length: pageTotal }, (_, k) => k)
  const multi = shownPages.length > 1
  const lay = (() => {
    if (!compact) return null
    const shown = data.phone.widgets.filter(w => !(w.type === 'app' && isEmptyApp(data, w.props.app || 'memo')))
    const rows = Math.max(1, ...shown.map(w => w.row + SIZE_SPAN[w.size].h))
    const dockH = dock.length > 0 ? 98 : 0
    // f 0 → 1 : 넉넉한 간격 → 가장 좁은 간격
    const at = (f: number) => {
      // 위 여백 = 아래 여백(하단 바 아래) — 위아래가 같아 보이게
      const db = 22 - 12 * f, top = db, gap = GRID.gapY - 6 * f, below = (multi ? 30 : 14) - 6 * f
      return { top, gap, db, need: top + rows * ch + (rows - 1) * gap + below + dockH + db }
    }
    const avail = screenH
    const loose = at(0), tight = at(1)
    if (loose.need <= avail) return { ...loose, k: 1, h: avail }
    if (tight.need <= avail) return { ...at((loose.need - avail) / (loose.need - tight.need)), k: 1, h: avail }
    return { ...tight, k: avail / tight.need, h: tight.need }
  })()
  const rowY = (row: number) => lay ? lay.top + row * (ch + lay.gap) : cellY(row, ch)
  const boxH = (size: WidgetSize) => lay ? SIZE_SPAN[size].h * ch + (SIZE_SPAN[size].h - 1) * lay.gap : spanH(size, ch)
  const pagerRef = useRef<HTMLDivElement>(null)
  const [pg, setPg] = useState(0)
  // 마우스로도 넘기기 (PC 미리보기) — 끌면 따라오고, 놓으면 가까운 장으로. 끈 뒤엔 눌림으로 치지 않음
  const mDrag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const [mDragging, setMDragging] = useState(false)
  const goPage = (k: number) => { const el = pagerRef.current; if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' }) }
  const blurCss: CSSProperties = hb ? { position: 'absolute', inset: 0, filter: `blur(${hb}px)`, transform: `scale(${1 + hb / 120})` } : { position: 'absolute', inset: 0 }
  return (
    <OverlayHostCtx.Provider value={editing ? null : host}>
    <GapCtx.Provider value={lay ? lay.gap : GRID.gapY}>
    <div ref={el => { rootRef.current = el; setHost(el) }} data-ed="homebg" style={{ position: 'absolute', inset: 0, fontFamily: t.body, color: t.ink, overflow: 'hidden' }}
      onPointerDown={editing ? (e) => { if (e.target === e.currentTarget) editing.onBackgroundPointerDown() } : undefined}>
      {reveal && <style>{REVEAL_CSS}</style>}
      {onPhoto
        ? <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}><div style={blurCss}><Backdrop data={data} t={t} home dim={Math.max(0, -(data.phone.homeDim ?? -34) / 100)} /></div>{(data.phone.homeDim ?? 0) > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(255,255,255,${data.phone.homeDim! / 100})` }} />}</div>
        : data.phone.homeImage
        ? <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: t.bg, overflow: 'hidden' }}><div style={blurCss}><Photo src={data.phone.homeImage} crop={data.phone.homeImageCrop} mono={!!data.phone.photoMono} /></div><div style={{ position: 'absolute', inset: 0, background: (data.phone.homeDim ?? -12) < 0 ? `rgba(0,0,0,${-(data.phone.homeDim ?? -12) / 100})` : `rgba(255,255,255,${(data.phone.homeDim ?? 0) / 100})` }} />{data.phone.homeTint && <div style={{ position: 'absolute', inset: 0, background: data.phone.homeTint, opacity: (data.phone.homeTintAlpha ?? 35) / 100, mixBlendMode: 'normal' }} />}</div>
        : <LightBg t={t} />}

      {editing && (!editing.clean || !!editing.ghost || !!editing.draggingId) && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {Array.from({ length: GRID.rows * GRID.cols }, (_, i) => (
            <div key={i} style={{ position: 'absolute', left: cellX(i % GRID.cols), top: cellY(Math.floor(i / GRID.cols), ch), width: GRID.cellW, height: ch, borderRadius: 14, border: `1px dashed ${onPhoto ? 'rgba(255,255,255,0.28)' : 'rgba(43,42,40,0.12)'}` }} />
          ))}
        </div>
      )}

      {editing?.ghost && (
        <div style={{ position: 'absolute', left: cellX(editing.ghost.col), top: cellY(editing.ghost.row, ch), width: spanW(editing.ghost.size), height: spanH(editing.ghost.size, ch), borderRadius: 22, background: editing.ghost.ok ? `${accent}33` : 'rgba(200,60,60,0.18)', border: `2px solid ${editing.ghost.ok ? accent : '#C83C3C'}`, pointerEvents: 'none' }} />
      )}

      <div style={lay ? { position: 'absolute', top: 0, left: (PHONE_W * (1 - lay.k)) / 2, width: PHONE_W, height: lay.h, ...(lay.k < 1 ? { transform: `scale(${lay.k})`, transformOrigin: '0 0' } : null) } : { display: 'contents' }}>
      <HomeRevealCtx.Provider value={!!reveal}>
      {/* 홈 화면 장 — 에디터는 고치는 장 하나, 하객은 옆으로 넘김 */}
      <div ref={pagerRef} onScroll={multi ? (e => { const el = e.currentTarget; setPg(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))) }) : undefined}
        onPointerDown={multi && !editing ? (e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; mDrag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false } }) : undefined}
        onPointerMove={multi && !editing ? (e => {
          const d = mDrag.current
          if (!d) return
          const dx = e.clientX - d.x
          if (!d.moved && Math.abs(dx) < 6) return
          if (!d.moved) { d.moved = true; setMDragging(true); try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ } }
          const sc = e.currentTarget.getBoundingClientRect().width / (e.currentTarget.offsetWidth || 1) || 1
          e.currentTarget.scrollLeft = d.left - dx / sc
        }) : undefined}
        onPointerUp={multi && !editing ? (e => {
          const d = mDrag.current
          mDrag.current = null
          if (!d?.moved) return
          setMDragging(false)
          const el = e.currentTarget, w = Math.max(1, el.clientWidth), pos = el.scrollLeft / w, base = Math.round(d.left / w)
          goPage(Math.max(0, Math.min(shownPages.length - 1, pos > base + 0.15 ? base + 1 : pos < base - 0.15 ? base - 1 : base)))
        }) : undefined}
        onClickCapture={multi ? (e => { if (mDragging) { e.preventDefault(); e.stopPropagation() } }) : undefined}
        style={multi ? { position: 'absolute', inset: 0, display: 'flex', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: mDragging ? 'none' : 'x mandatory', cursor: mDragging ? 'grabbing' : undefined, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } : { position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {shownPages.map(pgIdx => (
      <div key={pgIdx} style={{ ...(multi ? { position: 'relative', flex: '0 0 100%', height: '100%', scrollSnapAlign: 'start' } : { position: 'absolute', inset: 0 }) }}>
      {data.phone.widgets.filter(w => (w.page || 0) === pgIdx).map(w => {
        if (!editing && w.type === 'app' && isEmptyApp(data, w.props.app || 'memo')) return null
        const offInEditor = !!editing && w.type === 'app' && isAppOff(data, w.props.app || 'memo')
        const sel = editing?.selectedId === w.id
        const hasSong = !!(data.bgm?.enabled && data.bgm.url) || !!w.props.audio
        const playable = !editing && w.type === 'music' && hasSong && !!music
        const span = SIZE_SPAN[w.size]
        return (
          <div key={w.id} data-widget-id={w.id}
            onPointerDown={editing ? (e) => editing.onWidgetPointerDown(e, w) : undefined}
            style={{
              pointerEvents: 'auto',
              position: 'absolute', left: cellX(w.col), top: rowY(w.row), width: spanW(w.size), height: boxH(w.size),
              opacity: editing?.draggingId === w.id || offInEditor ? 0.35 : 1, touchAction: editing ? 'none' : undefined, cursor: editing ? 'grab' : undefined,
              outline: sel ? `1.5px solid ${accent}` : undefined, outlineOffset: sel ? 3 : undefined, borderRadius: span.w === 1 ? 16 : 22,
              animation: reveal ? `pfRise 0.6s cubic-bezier(0.32, 0.72, 0, 1) ${0.05 + (w.row * 4 + w.col) * 0.025}s both` : undefined,
            }}>
            <div style={{ position: 'absolute', inset: 0 }}>
            {w.props.bgImg && !w.props.clear && w.type !== 'photo' && w.type !== 'music' && !(w.type === 'app' && w.size === 'S') && (
              <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: span.w === 1 ? 16 : 22, overflow: 'hidden', background: '#3A3A3A' }}><Photo src={w.props.bgImg} crop={w.props.bgImgCrop} mono={w.props.mono ?? false} /></div>
            )}
            {w.props.bgImg && !w.props.clear && w.type !== 'photo' && w.type !== 'music'
              ? <div style={{ position: 'relative', width: '100%', height: '100%' }}><WidgetView w={w} data={data} t={t} onOpenApp={open} editing={!!editing} ch={ch} /></div>
              : <WidgetView w={w} data={data} t={t} onOpenApp={open} editing={!!editing} ch={ch} />}
            {/* 사진 위젯 — 사진첩 바로가기 */}
            {!editing && w.type === 'photo' && w.props.openAlbum && !isAppOff(data, 'album') && (
              <button type="button" aria-label="사진첩 열기" onClick={() => open('album')} style={{ position: 'absolute', inset: 0, border: 0, padding: 0, background: 'transparent', cursor: 'pointer', zIndex: 2 }} />
            )}
            </div>
            {editing?.onRemove && editing.draggingId !== w.id && (!editing.clean || sel) && (
              <button type="button" aria-label="위젯 빼기" onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); editing.onRemove!(w) }}
                style={{ position: 'absolute', left: -8, top: -8, width: 22, height: 22, borderRadius: '50%', border: 0, padding: 0, background: 'rgba(120,120,128,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4 }}>
                <span style={{ width: 10, height: 2, borderRadius: 1, background: '#FFFFFF' }} />
              </button>
            )}
            {sel && editing?.onResizePointerDown && editing.canResize?.(w) && (
              <span aria-label="끌어서 크기 바꾸기" title="끌어서 크기 바꾸기" onPointerDown={e => editing.onResizePointerDown!(e, w)}
                style={{ position: 'absolute', right: -9, bottom: -9, width: 30, height: 30, cursor: 'nwse-resize', touchAction: 'none', zIndex: 3 }}>
                {/* 모서리를 감싸는 얇은 곡선 손잡이 (태블릿 위젯 크기 조절처럼) */}
                <span aria-hidden style={{ position: 'absolute', right: 5, bottom: 5, width: 18, height: 18, borderRight: `3px solid ${accent}`, borderBottom: `3px solid ${accent}`, borderBottomRightRadius: span.w === 1 ? 14 : 20, boxSizing: 'border-box', filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.8))' }} />
              </span>
            )}
            {w.type === 'music' && (
              <button type="button" onClick={playable ? music!.toggle : undefined} aria-label={music?.playing ? '음악 멈춤' : '음악 재생'}
                style={{ position: 'absolute', inset: 0, border: 0, background: 'transparent', cursor: playable ? 'pointer' : 'inherit', padding: 0, pointerEvents: playable ? 'auto' : 'none' }}>
                {/* 재생 · 멈춤 버튼 — 재생기 모양은 가운데 버튼이 이미 있어 생략. 한 줄 · 2×1 은 오른쪽 가운데 */}
                {((w.variant !== 4 && w.variant !== 5) || w.size === 'H' || (w.variant === 5 && w.size === 'S')) && (() => {
                  const mid = w.variant === 1 || w.size === 'H' || w.size === 'W'
                  const one = w.size === 'S'
                  return (
                    <span style={{ position: 'absolute', right: one ? (w.variant === 3 || w.variant === 5 ? 'calc(14.6% - 12px)' : -3) : mid ? 12 : 10, top: one ? undefined : mid ? '50%' : 10, bottom: one ? (w.variant === 3 || w.variant === 5 ? 'calc(14.6% - 12px)' : -3) : undefined, transform: mid && !one ? 'translateY(-50%)' : undefined, width: one ? 24 : 30, height: one ? 24 : 30, borderRadius: '50%', background: 'rgba(20,20,20,0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {music?.playing
                        ? (one
                          ? <span style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 10 }}>{[0, 1, 2].map(k => <span key={k} style={{ width: 2, height: '100%', borderRadius: 1, background: '#FFFFFF', transformOrigin: 'bottom', animation: `pfEq 0.8s ease-in-out ${k * 0.15}s infinite alternate` }} />)}</span>
                          : <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#FFFFFF" /></svg>)
                        : <PhoneIcon name="play" color="#FFFFFF" size={one ? 11 : 13} />}
                    </span>
                  )
                })()}
              </button>
            )}
          </div>
        )
      })}
      </div>
      ))}
      </div>
      </HomeRevealCtx.Provider>
      {multi && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: lay ? lay.db + (dock.length > 0 ? 100 : 2) : dock.length > 0 ? 122 : 24, display: 'flex', justifyContent: 'center', gap: 0, pointerEvents: 'none' }}>
          {/* 점을 눌러도 그 장으로 */}
          {shownPages.map((k, i) => (
            <button key={k} type="button" aria-label={`홈 ${i + 1}`} onClick={editing ? undefined : () => goPage(i)}
              style={{ width: 19, height: 19, border: 0, padding: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: editing ? 'default' : 'pointer', pointerEvents: editing ? 'none' : 'auto' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.labelInk, opacity: k === pg ? 0.85 : 0.28, transition: 'opacity 0.2s' }} />
            </button>
          ))}
        </div>
      )}

      {dock.length > 0 && <div data-ed="dock" style={{ position: 'absolute', left: 14, right: 14, bottom: lay ? lay.db : 22, height: 98, borderRadius: 30, ...(data.phone.iconStyle === 'glass' ? { background: isDark(t.bg) || onPhoto || !!data.phone.homeImage ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.45)', backdropFilter: 'blur(22px) saturate(1.6)', WebkitBackdropFilter: 'blur(22px) saturate(1.6)', boxShadow: 'inset 0 1px 0.5px rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.22)' } : { background: t.bar }), display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, dock.length)}, minmax(0, 1fr))`, alignItems: 'center', justifyItems: 'center' }}>
        {dock.map(d => {
          const look = iconLook(data, d.app)
          return (
          <button key={d.app} type="button" onClick={() => open(d.app)}
            style={{ font: 'inherit', border: 0, background: 'transparent', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: editing ? 'default' : 'pointer' }}>
            <span style={{ ...look?.css, width: 60, height: 60, borderRadius: 16.5, background: look ? look.bg : t.dockBtn || accent, boxShadow: look?.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ display: 'flex', filter: look?.glyph }}><AppGlyph app={d.app} color={look ? look.ink : t.dockInk || '#FFFFFF'} size={31} /></span>
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: barDark ? 'rgba(255,255,255,0.92)' : '#3A3A3A', whiteSpace: 'nowrap' }}>{d.label}</span>
          </button>
          )
        })}
      </div>}
      </div>
    </div>
    </GapCtx.Provider>
    </OverlayHostCtx.Provider>
  )
}

/* ───────── 앱 화면 공용 ───────── */
function copyText(s: string) {
  try { navigator.clipboard?.writeText(s) } catch { /* noop */ }
}
interface Chapter { title: string; src?: string; src2?: string; crop?: PhoneImageSettings; crop2?: PhoneImageSettings; date?: string; lines: { side: 'a' | 'b' | 'p'; text: string }[] }
function chaptersOf(data: PhoneData): Chapter[] {
  const out: Chapter[] = []
  for (const m of data.phone.story) {
    if (m.side === 'date') { out.push({ title: m.text, src: m.src, src2: m.src2, crop: m.srcCrop, crop2: m.src2Crop, date: m.date, lines: [] }); continue }
    if (!out.length) out.push({ title: '', lines: [] })
    if (m.text.trim()) out[out.length - 1].lines.push({ side: m.side, text: m.text })
  }
  // 이야기 사진은 사진첩과 따로 — 장마다 올린 사진만 (첫 칸이 비고 둘째만 있으면 앞으로)
  return out.map(c => (c.src ? c : { ...c, src: c.src2, crop: c.crop2, src2: undefined, crop2: undefined }))
}

/* ───────── 우리 이야기 — 디자인 3가지 (스토리 넘기기 · 타임라인 · 줄글 에세이) ───────── */
interface StoryInk { ink: string; sub: string; line: string; accent: string }

/** 한 장의 글 — 대화는 인용문 + 이름, 문단은 그대로 */
function StoryLines({ c, nm, ink, size = 16, quoteStyle = 'plain' }: { c: Chapter; nm: { a: string; b: string }; ink: StoryInk; size?: number; quoteStyle?: 'plain' | 'pull' }) {
  return (
    <>
      {c.lines.map((l, j) => l.side === 'p' ? (
        <p key={j} style={{ fontSize: size - 0.5, lineHeight: 1.85, color: ink.ink, margin: j ? '14px 0 0' : 0, whiteSpace: 'pre-line', wordBreak: 'keep-all', letterSpacing: '-0.01em' }}>{l.text}</p>
      ) : (
        <div key={j} style={{ margin: j ? '16px 0 0' : 0, ...(quoteStyle === 'pull' ? { borderLeft: `2px solid ${ink.accent}`, paddingLeft: 14 } : null) }}>
          <div style={{ fontSize: quoteStyle === 'pull' ? size + 1 : size, lineHeight: 1.65, color: ink.ink, whiteSpace: 'pre-line', wordBreak: 'keep-all', letterSpacing: '-0.01em' }}>&ldquo;{l.text}&rdquo;</div>
          <div style={{ fontSize: 12.5, color: ink.sub, marginTop: 4 }}>— {l.side === 'a' ? nm.a : nm.b}</div>
        </div>
      ))}
    </>
  )
}

/** 타임라인 — 세로선 위 점 하나가 한 장 */
function StoryTimeline({ chs, nm, ink, data }: { chs: Chapter[]; nm: { a: string; b: string }; ink: StoryInk; data: PhoneData }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 26 }}>
      <span style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 1.5, background: ink.line }} />
      {chs.map((c, i) => (
        <div key={i} style={{ position: 'relative', paddingBottom: i < chs.length - 1 ? 34 : 0 }}>
          <span style={{ position: 'absolute', left: -26, top: 2, width: 14, height: 14, borderRadius: '50%', background: i === chs.length - 1 ? ink.accent : 'transparent', border: `2px solid ${ink.accent}`, boxSizing: 'border-box' }} />
          {c.title && <div style={{ fontSize: 13, fontWeight: 700, color: ink.accent, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>{c.title}</div>}
          {c.src && <div style={{ height: 170, borderRadius: 16, overflow: 'hidden', marginTop: 12 }}><Photo src={c.src} crop={c.crop} /></div>}
          {c.lines.length > 0 && <div style={{ marginTop: 14 }}><StoryLines c={c} nm={nm} ink={ink} size={15.5} /></div>}
        </div>
      ))}
      {data.wedding.date && (
        <div style={{ position: 'relative', marginTop: 34 }}>
          <span style={{ position: 'absolute', left: -28, top: 0, width: 18, height: 18, borderRadius: '50%', background: ink.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="heart" color="#FFFFFF" size={10} /></span>
          <div style={{ fontSize: 13, fontWeight: 700, color: ink.accent }}>{ddayText(ddayCount(data.wedding.date))} · 우리 결혼합니다</div>
        </div>
      )}
    </div>
  )
}

/** 줄글 에세이 — 장 번호 · 제목 · 꽉 찬 사진 · 문단 */
function StoryEssay({ chs, nm, ink, data, bleed }: { chs: Chapter[]; nm: { a: string; b: string }; ink: StoryInk; data: PhoneData; bleed: number }) {
  return (
    <>
      {chs.map((c, i) => (
        <div key={i} style={{ marginTop: i ? 44 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ ...numCss(data, 11), color: ink.accent }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ flex: 1, height: 1, background: ink.line, transform: 'translateY(-4px)' }} />
          </div>
          {c.title && <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', color: ink.ink, marginTop: 10, lineHeight: 1.4 }}>{c.title}</div>}
          {c.src && <div style={{ height: 250, margin: `18px -${bleed}px 0` }}><Photo src={c.src} crop={c.crop} /></div>}
          {c.lines.length > 0 && <div style={{ marginTop: 20 }}><StoryLines c={c} nm={nm} ink={ink} size={16} quoteStyle="pull" /></div>}
        </div>
      ))}
      <div style={{ textAlign: 'center', marginTop: 40, color: ink.accent, fontSize: 16 }}>✶</div>
    </>
  )
}

/** 뒤로 — 모든 앱 화면 같은 자리: 왼쪽 위 top 52 · left 12 · 40px 동그라미 (오른쪽 위 음악 버튼과 같은 줄)
 *  - 스크롤 영역 바깥(화면 맨 위 층)에 형제로 두면 그대로 고정
 *  - 화면 전체가 스크롤되는 곳은 sticky — 스크롤 영역의 '첫 자식'으로 (내용을 내려도 그 자리에 떠 있음)
 *  dark: 사진 · 어두운 화면 (어두운 반투명 + 흰 테두리) / 아니면 밝은 반투명 + 옅은 그림자 */
function BackCircle({ onClick, ink, dark, bg, sticky, label = '뒤로' }: { onClick?: () => void; ink?: string; dark?: boolean; bg?: string; sticky?: boolean; label?: string }) {
  const btn = (
    <button type="button" onClick={onClick} aria-label={label} style={{ position: 'absolute', top: 52, left: 12, zIndex: 4, width: 40, height: 40, borderRadius: '50%', border: 0, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg || (dark ? 'rgba(0,0,0,0.26)' : 'rgba(255,255,255,0.82)'), backdropFilter: 'blur(12px) saturate(1.3)', WebkitBackdropFilter: 'blur(12px) saturate(1.3)', boxShadow: dark ? 'inset 0 0 0 1px rgba(255,255,255,0.16)' : '0 2px 10px rgba(0,0,0,0.12)' }}>
      <PhoneIcon name="back" color={ink || (dark ? '#FFFFFF' : '#111111')} size={22} stroke={2} />
    </button>
  )
  return sticky ? <div style={{ position: 'sticky', top: 0, height: 0, zIndex: 6 }}>{btn}</div> : btn
}

/** 스토리 넘기기 — 사진이 화면을 채우고, 눌러서 다음 장 */
function StorySlides({ data, chs, nm, onBack }: { data: PhoneData; chs: Chapter[]; nm: { a: string; b: string }; onBack?: () => void }) {
  const [i, setI] = useState(0)
  const n = Math.max(1, chs.length)
  const c = chs[Math.min(i, n - 1)] || { title: '', lines: [] }
  const white: StoryInk = { ink: '#FFFFFF', sub: 'rgba(255,255,255,0.75)', line: 'rgba(255,255,255,0.3)', accent: '#FFFFFF' }
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#111', color: '#FFFFFF', fontFamily: "var(--pf-body, 'Pretendard Variable'), sans-serif", overflow: 'hidden' }}>
      <div key={i} style={{ position: 'absolute', inset: 0 }}>{c.src ? <Photo src={c.src} crop={c.crop} /> : <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${data.phone.accent}, #1A1816)` }} />}</div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.78) 100%)' }} />
      {/* 왼쪽 · 오른쪽 눌러서 이전 · 다음 */}
      <button type="button" aria-label="이전" onClick={() => setI(v => Math.max(0, v - 1))} style={{ position: 'absolute', left: 0, top: 90, bottom: 0, width: '35%', border: 0, background: 'transparent', cursor: 'pointer', zIndex: 1 }} />
      <button type="button" aria-label="다음" onClick={() => setI(v => Math.min(n - 1, v + 1))} style={{ position: 'absolute', right: 0, top: 90, bottom: 0, width: '65%', border: 0, background: 'transparent', cursor: 'pointer', zIndex: 1 }} />
      {/* 진행 막대는 뒤로 · 음악 버튼 줄(52~92) 바로 위 */}
      <div style={{ position: 'absolute', top: 42, left: 14, right: 14, display: 'flex', gap: 4, zIndex: 2 }}>
        {Array.from({ length: n }, (_, k) => <i key={k} style={{ flex: 1, height: 3, borderRadius: 2, background: k <= i ? '#FFFFFF' : 'rgba(255,255,255,0.38)' }} />)}
      </div>
      {/* 뒤로 — 왼쪽 위 (오른쪽 위는 음악 버튼 자리), 이름은 그 옆 */}
      <BackCircle onClick={onBack} dark />
      <div style={{ position: 'absolute', top: 52, left: 62, right: 60, height: 40, display: 'flex', alignItems: 'center', zIndex: 2, pointerEvents: 'none' }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm.a} · {nm.b}</span>
      </div>
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 64, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ ...numCss(data, 11), letterSpacing: '0.2em', opacity: 0.85 }}>{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</div>
        {c.title && <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 10, lineHeight: 1.2, wordBreak: 'keep-all' }}>{c.title}</div>}
        {c.lines.length > 0 && <div style={{ marginTop: 16, maxHeight: 300, overflow: 'hidden' }}><StoryLines c={c} nm={nm} ink={white} size={16} /></div>}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>{i < n - 1 ? '다음' : ''}</div>
    </div>
  )
}

const bankShort = (b: string) => (b || '').replace(/은행|뱅크/g, '').slice(0, 2) || '₩'

/** 참석 회신 양식 그리기 — 앞에서 고른 참석 여부를 넘길 수 있다 */
export type RenderRsvp = (opts?: { attendance?: 'attending' | 'not_attending' | 'pending' }) => ReactNode
interface AppProps { app: PhoneAppId; data: PhoneData; onBack?: () => void; onNavigate?: (a: PhoneAppId) => void; renderRsvp?: RenderRsvp }

/** 우리 이야기의 '축하' 버튼이 갈 곳 — 방명록, 꺼져 있으면 참석 회신 */
const cheerTo = (data: PhoneData): PhoneAppId | null => (!isAppOff(data, 'guestbook') ? 'guestbook' : !isAppOff(data, 'rsvp') ? 'rsvp' : null)

/** 앱 화면 — 화면마다 고른 디자인으로 */
export function AppScreen(props: Parameters<typeof AppScreenInner>[0]) {
  return <BodyFont data={props.data}><AppScreenInner {...props} /></BodyFont>
}
function AppScreenInner(props: AppProps) {
  // 연락처 · 메시지의 프로필 사진을 누르면 크게 (전화 · 문자 링크로 넘어가지 않게)
  const [zoom, setZoom] = useState<string | null>(null)
  return (
    <AvatarZoomCtx.Provider value={setZoom}>
    <div style={{ position: 'absolute', inset: 0, ['--pa' as string]: props.data.phone.accent }}>
      <AppScreenBody {...props} />
      {zoom && <ZoomOverlay src={zoom} onClose={() => setZoom(null)} />}
    </div>
    </AvatarZoomCtx.Provider>
  )
}
function AppScreenBody(props: AppProps) {
  const st = screenStyle(props.data, props.app)
  switch (props.app) {
    case 'memo':
      if (st === 'map') return <MemoMap {...props} />
      if (st === 'pass') return <MemoPass {...props} />
      if (st === 'mappass') return <MemoPass {...props} withMap />
      if (st === 'tiles') return <MemoTiles {...props} />
      return <InviteApp {...props} />
    case 'story':
      if (st === 'playlist') return <StoryPlaylist {...props} />
      if (st === 'feed') return <StoryFeed {...props} />
      return st === 'journal' ? <NativeApp {...props} /> : <InviteApp {...props} />
    case 'gift':
      return st === 'invite' ? <InviteApp {...props} /> : <NativeApp {...props} />
    case 'call':
      if (st === 'keypad') return <CallKeypad {...props} />
      if (st === 'chats') return <CallChats {...props} />
      return st === 'contacts' ? <NativeApp {...props} /> : <InviteApp {...props} />
    case 'album':
      if (st === 'memories') return <AlbumMemories {...props} />
      return st === 'photos' ? <NativeApp {...props} /> : <InviteApp {...props} />
    case 'guestbook':
      return <GuestbookApp {...props} />
    case 'intro':
      return <IntroApp {...props} />
    case 'video':
      return <VideoApp {...props} />
    case 'camera':
      return <CameraApp {...props} />
    case 'letter':
      return <LetterApp {...props} />
    default:
      if (st === 'poll') return <RsvpPoll {...props} />
      if (st === 'invite') return <InviteApp {...props} />
      return <NativeApp {...props} />
  }
}
/** 예전 이름 (에디터 · 확인 페이지에서 씀) */
export const AppView = AppScreen

/* ───────── 편지 — 받은편지함 · 편지 · 스토리 보기 · 예식 후 감사 인사 ───────── */
/** 에디터에서는 잠긴 감사 인사도 열어서 보여 줌 */
export const LetterPreviewCtx = createContext(false)
// 읽은 편지 — 이 기기에 기억해서 안 읽은 편지만 배지 · 테두리로
const LETTER_READ_KEY = 'pf-letter-read'
const letterRead = new Set<string>()
let letterReadLoaded = false
let letterReadVer = 0
const letterSubs = new Set<() => void>()
const letterNotify = () => { letterReadVer++; letterSubs.forEach(f => f()) }
function letterSubscribe(f: () => void) {
  letterSubs.add(f)
  if (!letterReadLoaded) {
    letterReadLoaded = true
    try { (JSON.parse(localStorage.getItem(LETTER_READ_KEY) || '[]') as string[]).forEach(x => letterRead.add(x)) } catch { /* 저장 불가 */ }
    letterNotify()
  }
  return () => { letterSubs.delete(f) }
}
function markLetterRead(id: string) {
  if (letterRead.has(id)) return
  letterRead.add(id)
  try { localStorage.setItem(LETTER_READ_KEY, JSON.stringify([...letterRead].slice(-60))) } catch { /* 저장 불가 */ }
  letterNotify()
}
const letterKey = (data: PhoneData, l: PhoneLetter) => `${data.groom.name}|${data.bride.name}|${l.id}`
function useLetterRead() { useSyncExternalStore(letterSubscribe, () => letterReadVer, () => 0); return letterRead }
/** 안 읽은 (열린) 편지 수 — 1×1 편지 아이콘 배지 */
function useLetterUnread(data: PhoneData) {
  const read = useLetterRead()
  const preview = useContext(LetterPreviewCtx)
  return lettersOf(data).filter(l => (preview || !letterLockedUntil(data, l)) && !read.has(letterKey(data, l))).length
}
// 동그라미 위젯에서 고른 편지 — 편지 앱이 열리면 그 편지부터 (스토리처럼)
let pendingLetter: { id: string; story: boolean } | null = null
const LETTER_SERIF = "'ChosunIlboMyungjo', var(--font-noto-serif-kr), serif"
const LETTER_HAND = "'GriunEverydayJeong', 'ChosunIlboMyungjo', serif"
function letterNames(data: PhoneData) { return { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') } }
function letterFrom(data: PhoneData, l: PhoneLetter) {
  const { a, b } = letterNames(data)
  return l.kind === 'groom' ? `신랑 ${a}` : l.kind === 'bride' ? `신부 ${b}` : `${a} · ${b}`
}
/** 미리보기 한 줄 — 본문, 없으면 대화 */
const letterSnippet = (l: PhoneLetter) => (l.body.trim() || (l.lines || []).map(x => x.text.trim()).filter(Boolean).join(' ')).replace(/\n+/g, ' ')
const letterTitle = (l: PhoneLetter) => l.title?.trim() || LETTER_KINDS[l.kind].title
const letterCircleLabel = (data: PhoneData, l: PhoneLetter) => (l.kind === 'groom' || l.kind === 'bride' ? letterFrom(data, l) : '두 사람')
const LockGlyph = ({ c = '#FFFFFF', s = 16 }: { c?: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><rect x="5" y="10" width="14" height="10" rx="2.2" fill={c} /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke={c} strokeWidth="2" /></svg>
)

/** 홈 위젯 — 편지 수만큼 동그라미 (2×1 · 3×1 · 4×1), 동그라미 하나가 앱 아이콘 한 칸 자리 */
function LettersWidget(props: { data: PhoneData; size: WidgetSize; variant: number; t: PhoneTheme; card: CSSProperties; accent: string; editing: boolean; onOpen?: () => void; mono: boolean; ch: number }) {
  if (props.variant === 1 && props.size === 'L') return <LetterPreviewWidget {...props} />
  if (props.variant === 2 && props.size === 'W') return <LetterNoticeWidget {...props} />
  return <LetterCircles {...props} />
}
/** 위젯이 보여 줄 편지 — 열린 편지 중 안 읽은 것, 없으면 첫 편지 (초대의 글 먼저) */
function useFeaturedLetter(data: PhoneData) {
  const read = useLetterRead()
  const preview = useContext(LetterPreviewCtx)
  const open = lettersOf(data).filter(l => preview || !letterLockedUntil(data, l))
  const unread = open.filter(l => !read.has(letterKey(data, l)))
  return { letter: unread[0] || open[0], unread: unread.length }
}
const SendGlyph = ({ c, s }: { c: string; s: number }) => <AppGlyph app="letter" color={c} size={s} />
/** 편지 미리보기 (4×2) — 제목 · 본문 두 줄 · 서명 · 이어서 읽기 */
function LetterPreviewWidget({ data, t, card, accent, editing, onOpen }: { data: PhoneData; t: PhoneTheme; card: CSSProperties; accent: string; editing: boolean; onOpen?: () => void }) {
  const { letter: l } = useFeaturedLetter(data)
  const nm = letterNames(data)
  const tn = titleNames(data)
  const go = editing || !l ? undefined : () => { pendingLetter = { id: l.id, story: false }; onOpen?.() }
  return (
    <button type="button" onClick={go} aria-label="편지 읽기" style={{ ...card, display: 'flex', flexDirection: 'column', padding: '16px 18px', textAlign: 'left', cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.cardSub }}><SendGlyph c={t.cardSub} s={13} />편지 · {l ? letterFrom(data, l) : `${nm.a} · ${nm.b}`}</span>
      <span style={{ fontFamily: LETTER_SERIF, fontSize: 20, color: t.cardInk, marginTop: 9, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l ? letterTitle(l) : '편지를 써 주세요'}</span>
      <span style={{ fontSize: 13.5, lineHeight: 1.6, color: t.cardInk, opacity: 0.78, marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'keep-all' }}>{l ? letterSnippet(l) : '초대의 글 · 신랑 · 신부의 편지를 에디터에서 써요'}</span>
      <span style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={tn.latin ? { ...titleCss(data, 16), fontStyle: 'italic', color: t.cardInk, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : { fontFamily: LETTER_SERIF, fontSize: 14, color: t.cardInk }}>{tn.latin ? `${tn.a} & ${tn.b}` : `${nm.a} · ${nm.b}`}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: accent, flexShrink: 0 }}>이어서 읽기 ›</span>
      </span>
    </button>
  )
}
/** 새 편지 알림 (4×1) — 메일 알림처럼 한 줄 */
function LetterNoticeWidget({ data, t, card, editing, onOpen }: { data: PhoneData; t: PhoneTheme; card: CSSProperties; editing: boolean; onOpen?: () => void }) {
  const { letter: l, unread } = useFeaturedLetter(data)
  const nm = letterNames(data)
  const go = editing || !l ? undefined : () => { pendingLetter = { id: l.id, story: false }; onOpen?.() }
  return (
    <button type="button" onClick={go} aria-label="새 편지" style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', textAlign: 'left', cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
      <span style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, background: data.phone.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <SendGlyph c="#FFFFFF" s={22} />
        {unread > 0 && <span style={{ position: 'absolute', top: -5, right: -6, minWidth: 18, height: 18, padding: '0 4px', boxSizing: 'border-box', borderRadius: 9, background: '#FF3B30', color: '#FFFFFF', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}><b style={{ color: t.cardInk }}>{l ? letterFrom(data, l) : `${nm.a} · ${nm.b}`}</b><span style={{ color: t.cardSub, fontSize: 11.5, flexShrink: 0 }}>{unread > 0 ? '새 편지' : '편지'}</span></span>
        <span style={{ display: 'block', fontSize: 12.5, color: t.cardSub, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><b style={{ fontWeight: 600, color: t.cardInk }}>{l ? letterTitle(l) : '편지를 써 주세요'}</b>{l ? ` — ${letterSnippet(l)}` : ''}</span>
      </span>
    </button>
  )
}
/** 편지 동그라미 — 편지 수만큼 (2×1 · 3×1 · 4×1), 동그라미 하나가 앱 아이콘 한 칸 자리 */
function LetterCircles({ data, size, t, editing, onOpen, mono, ch }: { data: PhoneData; size: WidgetSize; t: PhoneTheme; editing: boolean; onOpen?: () => void; mono: boolean; ch: number }) {
  const read = useLetterRead()
  const preview = useContext(LetterPreviewCtx)
  const cols = SIZE_SPAN[size].w
  const list = lettersOf(data).slice(0, cols)
  const d = Math.max(36, Math.min(56, ch - 24))
  const accent = data.phone.accent
  const dim = isDark(t.bg) || t.homeBg === 'photo' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.13)'
  if (!list.length && !editing) return null
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: GRID.gapX }}>
      {Array.from({ length: cols }, (_, i) => {
        const l = list[i]
        if (!l) return (
          <span key={i} style={{ width: GRID.cellW, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            {editing && <span style={{ width: d + 6, height: d + 6, borderRadius: '50%', border: `1.5px dashed ${dim}`, boxSizing: 'border-box' }} />}
            {editing && <span style={{ fontSize: 11, color: t.labelInk, opacity: 0.5 }}>편지</span>}
          </span>
        )
        const locked = !preview && letterLockedUntil(data, l)
        const unread = !locked && !read.has(letterKey(data, l))
        const src = l.photos?.[0] || coverOf(data)
        const crop = l.photos?.[0] ? l.crops?.[l.photos[0]] : undefined
        return (
          <button key={l.id} type="button" aria-label={`${letterCircleLabel(data, l)} 편지`} onClick={editing ? undefined : () => { pendingLetter = { id: l.id, story: true }; onOpen?.() }}
            style={{ width: GRID.cellW, flexShrink: 0, border: 0, padding: 0, background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: editing ? 'inherit' : 'pointer', font: 'inherit' }}>
            {/* 테두리 — 안 읽은 편지는 버튼 색, 읽은 편지는 연한 회색 (사진은 정가운데) */}
            <span style={{ position: 'relative', width: d + 6, height: d + 6, borderRadius: '50%', background: unread ? accent : dim, flexShrink: 0 }}>
              <span style={{ position: 'absolute', inset: 2, borderRadius: '50%', border: `3px solid ${t.homeBg === 'photo' ? 'rgba(255,255,255,0.9)' : t.bg}`, overflow: 'hidden', background: '#E5E5E5', boxSizing: 'border-box' }}>
                {src && <Photo src={src} crop={crop} mono={mono} style={locked ? { filter: 'grayscale(1) blur(2px) brightness(0.85)', transform: 'scale(1.1)' } : undefined} />}
                {locked && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LockGlyph /></span>}
              </span>
            </span>
            <span style={{ fontSize: 11, fontWeight: unread ? 600 : 500, lineHeight: 1.3, color: t.labelInk, opacity: locked ? 0.6 : 1, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{letterCircleLabel(data, l)}</span>
          </button>
        )
      })}
    </div>
  )
}


/** 편지 — 메시지 모양: 편지마다 이름 · 말풍선(문단마다) · 사진, 신랑은 왼쪽 · 신부는 오른쪽 */
function LetterChat({ data, list, lockOf, focus, onBack, onNavigate }: { data: PhoneData; list: PhoneLetter[]; lockOf: (l: PhoneLetter) => Date | null; focus?: string; onBack?: () => void; onNavigate?: (a: PhoneAppId) => void }) {
  const nm = letterNames(data)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const [zoom, setZoom] = useState<{ src: string; imgs: string[] } | null>(null)
  useEffect(() => { list.forEach(l => { if (!lockOf(l)) markLetterRead(letterKey(data, l)) }) })
  useEffect(() => { if (focus) refs.current[focus]?.scrollIntoView({ block: 'start' }) }, [focus])
  const cover = coverOf(data)
  let n = 0
  const delay = () => `${Math.min(n++, 14) * 0.22}s`
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF', color: '#1C1C1E', fontFamily: SYS, overflow: 'hidden' }}>
      <style>{'@keyframes pfMsgIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }'}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, padding: '50px 0 10px', background: 'rgba(250,250,250,0.94)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: `0.5px solid ${IOS.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: data.phone.accent, position: 'relative' }}>{(data.phone.letterAvatar?.src || cover) && <Photo src={data.phone.letterAvatar?.src || cover} crop={data.phone.letterAvatar?.crop} />}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{nm.a} · {nm.b}</span>
      </div>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '124px 12px 104px' }}>
        {list.length === 0 && <div style={{ padding: '60px 0', textAlign: 'center', color: IOS.gray, fontSize: 14.5 }}>아직 편지가 없어요</div>}
        {list.map(l => {
          const lock = lockOf(l)
          const right = l.kind === 'bride'
          const label = l.kind === 'groom' ? nm.a : l.kind === 'bride' ? nm.b : `${nm.a} · ${nm.b}`
          const own: { side: 'L' | 'R'; text: string; bold?: boolean }[] = [letterTitle(l), ...l.body.split(/\n\s*\n/)].map(x => x.trim()).filter(Boolean).map((t, k) => ({ side: right ? 'R' : 'L', text: t, bold: k === 0 }))
          const talk = (l.lines || []).filter(x => x.text.trim()).map(x => ({ side: (x.who === 'bride' ? 'R' : 'L') as 'L' | 'R', text: x.text.trim(), bold: false }))
          const bubbles = [...own, ...talk]
          const nameOf = (side: 'L' | 'R', k: number) => (k < own.length ? label : side === 'R' ? nm.b : nm.a)
          return (
            <div key={l.id} ref={el => { refs.current[l.id] = el }} style={{ scrollMarginTop: 118 }}>
              <div style={{ textAlign: 'center', fontSize: 11.5, color: IOS.gray, margin: '18px 0 6px' }}>{LETTER_KINDS[l.kind].label}</div>
              {lock ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: IOS.gray, background: IOS.group, borderRadius: 12, padding: '7px 12px' }}><LockGlyph c={IOS.gray} s={12} />{lock.getMonth() + 1}월 {lock.getDate()}일에 도착해요</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: right ? 'flex-end' : 'flex-start', gap: 4 }}>
                  {bubbles.map((b, k) => {
                    const R = b.side === 'R'
                    const who = nameOf(b.side, k)
                    const showName = k === 0 || who !== nameOf(bubbles[k - 1].side, k - 1)
                    return (
                      <span key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: R ? 'flex-end' : 'flex-start', alignSelf: R ? 'flex-end' : 'flex-start', maxWidth: '78%', gap: 4, marginTop: showName && k > 0 ? 8 : 0 }}>
                        {showName && <span style={{ fontSize: 11.5, color: IOS.gray, margin: R ? '0 10px 0 0' : '0 0 0 10px' }}>{who}</span>}
                        <span style={{ padding: '9px 14px', borderRadius: 19, background: R ? 'var(--pa, #8C6A5A)' : '#E9E9EB', color: R ? '#FFFFFF' : '#1C1C1E', fontSize: 15.5, lineHeight: 1.45, whiteSpace: 'pre-line', wordBreak: 'keep-all', fontWeight: b.bold ? 600 : 400, animation: 'pfMsgIn 0.4s ease both', animationDelay: delay() }}>{b.text}</span>
                      </span>
                    )
                  })}
                  {(l.photos || []).length > 0 && (
                    <span style={{ display: 'grid', gridTemplateColumns: (l.photos || []).length === 1 ? '1fr' : '1fr 1fr', gap: 3, width: '64%', borderRadius: 16, overflow: 'hidden', animation: 'pfMsgIn 0.4s ease both', animationDelay: delay() }}>
                      {(l.photos || []).slice(0, 4).map((src, k) => (
                        <button key={k} type="button" onClick={() => setZoom({ src, imgs: l.photos || [] })} aria-label="사진 크게" style={{ border: 0, padding: 0, aspectRatio: (l.photos || []).length === 1 ? '4 / 5' : '1 / 1', position: 'relative', overflow: 'hidden', cursor: 'zoom-in', background: '#EEE' }}>
                          <Photo src={src} crop={l.crops?.[src]} />
                          {k === 3 && (l.photos || []).length > 4 && <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', color: '#FFFFFF', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{(l.photos || []).length - 4}</span>}
                        </button>
                      ))}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: IOS.gray, margin: right ? '0 8px' : '0 8px', animation: 'pfMsgIn 0.4s ease both', animationDelay: delay() }}>{l.sign?.trim() || (right ? '' : '')}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!isAppOff(data, 'guestbook') && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 12px 30px', background: 'rgba(255,255,255,0.96)', borderTop: `0.5px solid ${IOS.line}` }}>
          <button type="button" onClick={() => onNavigate?.('guestbook')} style={{ width: '100%', height: 40, borderRadius: 20, border: `1px solid ${IOS.line}`, background: '#FFFFFF', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 15, color: IOS.gray, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}>축하 메시지 남기기</button>
        </div>
      )}
      <BackCircle onClick={onBack} ink="var(--pa, #8C6A5A)" />
      {zoom && <ZoomOverlay src={zoom.src} imgs={zoom.imgs} onClose={() => setZoom(null)} />}
    </div>
  )
}

/** 손편지 — 메모장 앱처럼 편지 종이가 차례로 (스크롤), 편지마다 종이 색 · 손글씨 */
function LetterNotes({ data, list, focus, onBack }: { data: PhoneData; list: PhoneLetter[]; focus?: string; onBack?: () => void }) {
  const nm = letterNames(data)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const [zoom, setZoom] = useState<{ src: string; imgs: string[] } | null>(null)
  useEffect(() => { list.forEach(l => markLetterRead(letterKey(data, l))) })
  useEffect(() => { if (focus) refs.current[focus]?.scrollIntoView({ block: 'start' }) }, [focus])
  const title = screenText(data, 'letter', 'title', '초대의 글')
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF', color: '#2B2926', fontFamily: SYS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '0 0 48px' }}>
        {/* 뒤로 자리 — 버튼은 스크롤 바깥에 고정 (아래) */}
        <div aria-hidden style={{ height: 44, marginTop: 50 }} />
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</div>
          <div style={{ fontSize: 13.5, color: IOS.gray, marginTop: 3 }}>{screenText(data, 'letter', 'eyebrow', `${nm.a} · ${nm.b}의 편지`)} {list.length}통</div>
        </div>
        {list.length === 0 && <div style={{ padding: '60px 24px', textAlign: 'center', color: IOS.gray, fontSize: 14.5 }}>아직 편지가 없어요</div>}
        {list.map(l => {
          const hand = letterHandOf(l.hand || data.phone.letterHand)
          const paper = l.paper || '#FFFFFF'
          const photos = l.photos || []
          // 본문과 대화 사이는 한 줄 띄움
          const talk = (l.lines || []).filter(x => x.text.trim()).map(x => `${x.who === 'groom' ? nm.a : nm.b}: ${x.text.trim()}`).join('\n')
          const lines = [l.body.trim(), talk].filter(Boolean).join('\n\n')
          return (
            <div key={l.id} ref={el => { refs.current[l.id] = el }} style={{ scrollMarginTop: 12, margin: '0 16px 20px', background: paper, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 14px 30px -22px rgba(0,0,0,0.3)', padding: '24px 22px 28px', position: 'relative', backgroundImage: 'repeating-linear-gradient(transparent 0 33px, rgba(60,80,120,0.12) 33px 34px)', backgroundPosition: '0 22px' }}>
              <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.42)', marginBottom: 6, fontFamily: SYS }}>{letterFrom(data, l)}</div>
              <div style={{ fontFamily: `${hand.family}, ${LETTER_HAND}`, fontSize: 20, lineHeight: '34px', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
                {`${letterTitle(l)}\n\n${lines}\n\n`}
                <span style={{ display: 'block', textAlign: 'right' }}>{l.sign?.trim() || `${nm.a} · ${nm.b} 드림`}</span>
              </div>
              {photos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 20 }}>
                  {photos.map((src, k) => (
                    <button key={k} type="button" onClick={() => setZoom({ src, imgs: photos })} aria-label="사진 크게"
                      style={{ width: photos.length === 1 ? 200 : 128, padding: '7px 7px 20px', background: '#FFFFFF', border: 0, boxShadow: '0 8px 18px -10px rgba(0,0,0,0.35)', transform: `rotate(${k % 2 ? 3 : -2.5}deg)`, cursor: 'zoom-in', position: 'relative' }}>
                      <span aria-hidden style={{ position: 'absolute', top: -8, left: '50%', width: 44, height: 15, marginLeft: -22, background: 'rgba(225,215,190,0.75)', transform: 'rotate(-4deg)' }} />
                      <span style={{ display: 'block', aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden' }}><Photo src={src} crop={l.crops?.[src]} /></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <BackCircle onClick={onBack} ink="var(--pa, #8C6A5A)" />
      {zoom && <ZoomOverlay src={zoom.src} imgs={zoom.imgs} onClose={() => setZoom(null)} />}
    </div>
  )
}

/** 편지 앱 — 받은편지함 → 편지 (사진 여러 장). 동그라미 위젯에서 열면 스토리처럼 한 통씩 */
function LetterApp({ data, onBack, onNavigate }: AppProps) {
  const read = useLetterRead()
  const preview = useContext(LetterPreviewCtx)
  const list = lettersOf(data)
  const nm = letterNames(data)
  const [fromWidget] = useState(() => (pendingLetter && list.some(l => l.id === pendingLetter!.id) ? pendingLetter : null))
  const [view, setView] = useState<{ id: string; story: boolean } | null>(() => fromWidget)
  const [zoom, setZoom] = useState<{ src: string; imgs: string[] } | null>(null)
  useEffect(() => { pendingLetter = null }, [])
  const lockOf = (l: PhoneLetter) => (preview ? null : letterLockedUntil(data, l))
  const cur = view ? list.find(l => l.id === view.id) : undefined
  useEffect(() => { if (cur && !lockOf(cur)) markLetterRead(letterKey(data, cur)) })
  const close = () => { if (fromWidget && view?.id === fromWidget.id && view.story === fromWidget.story) onBack?.(); else setView(null) }
  const ac = 'var(--pa, #8C6A5A)'
  const title = screenText(data, 'letter', 'title', '초대의 글')
  const st = screenStyle(data, 'letter')
  const openLabel = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`
  // 위쪽 뒤로 줄 자리 (버튼은 왼쪽 위에 고정 — 스크롤해도 그 자리)
  const headGap = <div aria-hidden style={{ height: 44, marginTop: 50 }} />
  const back = (label: string, onClick?: () => void, sticky?: boolean) => <BackCircle onClick={onClick} ink={ac} sticky={sticky} label={label ? `뒤로 · ${label}` : '뒤로'} />
  const avatar = (s: number) => {
    const own = data.phone.letterAvatar
    const c = own?.src || coverOf(data)
    return <span style={{ width: s, height: s, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: data.phone.accent, display: 'block', position: 'relative' }}>{c && <Photo src={c} crop={own?.src ? own.crop : undefined} />}</span>
  }

  // 스토리 — 사진 가득 + 편지 앞부분, 옆을 누르면 다음 편지
  if (cur && view?.story && !lockOf(cur)) {
    const open = list.filter(l => !lockOf(l))
    const i = Math.max(0, open.findIndex(l => l.id === cur.id))
    const go = (d: number) => { const n = open[i + d]; if (n) setView({ id: n.id, story: true }); else if (d > 0) close() }
    const src = cur.photos?.[0] || coverOf(data)
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#000', color: '#FFFFFF', fontFamily: SYS, overflow: 'hidden' }}>
        <div key={cur.id} style={{ position: 'absolute', inset: 0, animation: 'pfLetterIn 0.35s ease' }}>{src && <Photo src={src} crop={cur.photos?.[0] ? cur.crops?.[src] : undefined} />}</div>
        <style>{'@keyframes pfLetterIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: none; } }'}</style>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.8) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: '100px 0 220px', display: 'flex' }}>
          <button type="button" aria-label="이전 편지" onClick={() => go(-1)} style={{ flex: 1, border: 0, background: 'transparent', cursor: 'pointer' }} />
          <button type="button" aria-label="다음 편지" onClick={() => go(1)} style={{ flex: 2, border: 0, background: 'transparent', cursor: 'pointer' }} />
        </div>
        {/* 진행 막대는 뒤로 · 음악 버튼 줄(52~92) 바로 위 */}
        <div style={{ position: 'absolute', top: 42, left: 12, right: 12, display: 'flex', gap: 4 }}>
          {open.map((l, k) => <span key={l.id} style={{ flex: 1, height: 2.5, borderRadius: 2, background: k <= i ? '#FFFFFF' : 'rgba(255,255,255,0.35)' }} />)}
        </div>
        {/* 뒤로 — 왼쪽 위 (오른쪽 위는 음악 버튼 자리), 보낸 사람은 그 옆 */}
        <div style={{ position: 'absolute', top: 52, left: 62, right: 60, height: 40, display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>
          {avatar(32)}
          <b style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{letterFrom(data, cur)}</b>
        </div>
        <BackCircle onClick={close} dark />
        <div style={{ position: 'absolute', left: 24, right: 24, bottom: 54 }}>
          <div style={{ fontFamily: LETTER_SERIF, fontSize: 25, lineHeight: 1.35, letterSpacing: '-0.02em', wordBreak: 'keep-all' }}>{letterTitle(cur)}</div>
          {letterSnippet(cur) && <div style={{ fontSize: 15.5, lineHeight: 1.75, marginTop: 12, opacity: 0.94, whiteSpace: 'pre-line', wordBreak: 'keep-all', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cur.body.trim() || letterSnippet(cur)}</div>}
          <button type="button" onClick={() => setView({ id: cur.id, story: false })} style={{ marginTop: 18, height: 38, padding: '0 16px', borderRadius: 19, border: '1px solid rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', font: 'inherit', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>편지 전체 보기</button>
        </div>
      </div>
    )
  }


  // ── 메시지 — 두 사람이 보낸 문자처럼, 말풍선이 차례로 ──
  if (st === 'message' && !view?.story) return (
    <LetterChat data={data} list={list} lockOf={lockOf} focus={view?.id} onBack={fromWidget && view ? onBack : onBack} onNavigate={onNavigate} />
  )

  // ── 손편지 — 메모장처럼 편지들을 아래로 넘겨 보기 (편지마다 종이 색 · 글씨) ──
  if (st === 'hand' && !view?.story) return (
    <LetterNotes data={data} list={list} focus={view?.id} onBack={onBack} />
  )

  // 편지 한 통
  if (cur) {
    const lock = lockOf(cur)
    const photos = cur.photos || []
    const acts = ([
      !isAppOff(data, 'guestbook') && (['guestbook', '축하 남기기'] as const),
      !isAppOff(data, 'rsvp') && (['rsvp', '참석 회신'] as const),
      !isEmptyApp(data, 'gift') && (['gift', '마음 전하기'] as const),
    ].filter(Boolean) as (readonly [PhoneAppId, string])[])
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF', color: '#1C1C1E', fontFamily: SYS, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: acts.length && !lock ? 90 : 40 }}>
          {headGap}
          {lock ? (
            <div style={{ padding: '120px 36px 0', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><LockGlyph c="#1C1C1E" s={44} /></div>
              <div style={{ fontFamily: LETTER_SERIF, fontSize: 24, marginTop: 22 }}>{letterTitle(cur)}</div>
              <div style={{ fontSize: 15.5, color: IOS.gray, marginTop: 10, lineHeight: 1.7 }}>결혼식 다음 날인<br /><b style={{ color: '#1C1C1E' }}>{openLabel(lock)}</b>에 열려요</div>
              <div style={{ fontSize: 13, color: IOS.gray, marginTop: 28 }}>그날 이 청첩장을 다시 열어 주세요</div>
            </div>
          ) : (
            <div style={{ padding: '6px 22px 0' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 16, borderBottom: `0.5px solid ${IOS.line}` }}>
                {avatar(44)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 16 }}>{letterFrom(data, cur)}</b>
                  <div style={{ fontSize: 13.5, color: IOS.gray, marginTop: 2 }}>받는 사람: 소중한 분께</div>
                </div>
              </div>
              <div style={{ fontFamily: LETTER_SERIF, fontSize: 25, lineHeight: 1.4, letterSpacing: '-0.02em', marginTop: 22, wordBreak: 'keep-all' }}>{letterTitle(cur)}</div>
              {cur.body.trim() && <div style={{ fontSize: 16, lineHeight: 1.85, color: '#3A3A3C', marginTop: 16, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{cur.body}</div>}
              {(cur.lines || []).filter(x => x.text.trim()).map((x, k) => (
                <div key={k} style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ac }}>{x.who === 'groom' ? `신랑 ${nm.a}` : `신부 ${nm.b}`}</div>
                  <div style={{ fontSize: 16, lineHeight: 1.75, color: '#3A3A3C', marginTop: 2, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{x.text}</div>
                </div>
              ))}
              {photos.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: photos.length === 1 ? '1fr' : photos.length === 2 ? '1fr 1fr' : '2fr 1fr', gridTemplateRows: photos.length >= 3 ? '96px 96px' : undefined, gap: 4, borderRadius: 14, overflow: 'hidden', marginTop: 22 }}>
                    {photos.slice(0, 3).map((src, k) => (
                      <button key={k} type="button" onClick={() => setZoom({ src, imgs: photos })} aria-label="사진 크게"
                        style={{ gridRow: photos.length >= 3 && k === 0 ? '1 / 3' : undefined, height: photos.length >= 3 ? undefined : photos.length === 1 ? 230 : 180, border: 0, padding: 0, position: 'relative', overflow: 'hidden', cursor: 'zoom-in', background: '#EEE' }}>
                        <Photo src={src} crop={cur.crops?.[src]} />
                        {k === 2 && photos.length > 3 && <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', color: '#FFFFFF', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{photos.length - 3}</span>}
                      </button>
                    ))}
                  </div>
                  {photos.length > 1 && <div style={{ fontSize: 12, color: IOS.gray, marginTop: 8 }}>사진 {photos.length}장 · 눌러서 크게 보기</div>}
                </>
              )}
              <div style={{ marginTop: 26, fontFamily: LETTER_SERIF, fontSize: 16 }}>{cur.sign?.trim() || `${nm.a} · ${nm.b} 드림`}</div>
            </div>
          )}
        </div>
        {!lock && acts.length > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, borderTop: `0.5px solid ${IOS.line}`, background: 'rgba(250,250,250,0.94)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            {acts.map(([a, label]) => <button key={a} type="button" onClick={() => onNavigate?.(a)} style={{ border: 0, background: 'transparent', color: ac, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', font: 'inherit' }}>{label}</button>)}
          </div>
        )}
        {back(list.length > 1 || !fromWidget ? title : '홈', close)}
        {zoom && <ZoomOverlay src={zoom.src} imgs={zoom.imgs} onClose={() => setZoom(null)} />}
      </div>
    )
  }

  // 받은편지함
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF', color: '#1C1C1E', fontFamily: SYS, overflowY: 'auto' }}>
      {/* 이 화면은 전체가 스크롤 — 뒤로는 sticky 로 첫 자식 */}
      {back('', onBack, true)}
      {headGap}
      <div style={{ padding: '2px 20px 12px' }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</div>
        <div style={{ fontSize: 13.5, color: IOS.gray, marginTop: 3 }}>{screenText(data, 'letter', 'eyebrow', `${nm.a} · ${nm.b}의 편지`)} {list.length}통</div>
      </div>
      {list.length === 0 && <div style={{ padding: '70px 24px', textAlign: 'center', color: IOS.gray, fontSize: 14.5 }}>아직 편지가 없어요</div>}
      {list.map(l => {
        const lock = lockOf(l)
        const unread = !lock && !read.has(letterKey(data, l))
        const ph = l.photos || []
        return (
          <button key={l.id} type="button" onClick={() => setView({ id: l.id, story: false })}
            style={{ display: 'flex', gap: 8, width: '100%', padding: '13px 20px 13px 8px', border: 0, borderBottom: `0.5px solid ${IOS.line}`, background: 'transparent', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', opacity: lock ? 0.55 : 1 }}>
            <span style={{ width: 12, display: 'flex', justifyContent: 'center', paddingTop: 7, flexShrink: 0 }}>{unread && <span style={{ width: 9, height: 9, borderRadius: '50%', background: ac }} />}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <b style={{ fontSize: 16.5 }}>{letterFrom(data, l)}</b>
                <span style={{ fontSize: 13.5, color: IOS.gray, flexShrink: 0 }}>{lock ? openLabel(lock) : LETTER_KINDS[l.kind].label} ›</span>
              </span>
              <span style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>{lock && <LockGlyph c={IOS.gray} s={13} />}{letterTitle(l)}</span>
                  <span style={{ display: '-webkit-box', fontSize: 14.5, color: IOS.gray, marginTop: 3, lineHeight: 1.45, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-line' }}>{lock ? '결혼식 다음 날 열려요' : letterSnippet(l)}</span>
                  {!lock && ph.length > 1 && <span style={{ display: 'block', fontSize: 12.5, color: IOS.gray, marginTop: 6 }}>사진 {ph.length}장</span>}
                </span>
                {!lock && ph[0] && (
                  <span style={{ position: 'relative', width: 58, height: 58, borderRadius: 10, overflow: 'hidden', flexShrink: 0, marginTop: 2 }}>
                    <Photo src={ph[0]} crop={l.crops?.[ph[0]]} />
                    {ph.length > 1 && <span style={{ position: 'absolute', right: 4, bottom: 4, fontSize: 10.5, fontWeight: 700, color: '#FFFFFF', background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '1px 5px' }}>+{ph.length - 1}</span>}
                  </span>
                )}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}


function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (key: string, s: string) => { copyText(s); setCopied(key); setTimeout(() => setCopied(null), 1400) }
  return { copied, copy }
}

/** 사진 보기 — 누르면 크게 · 좌우로 넘기기 · 두 손가락(두 번 탭)으로 확대 (다른 템플릿 라이트박스와 같은 확대) */
function ZoomOverlay({ src, onClose, imgs }: { src: string; onClose: () => void; imgs?: string[] }) {
  useHideChrome()
  const list = imgs && imgs.includes(src) ? imgs : [src]
  const [i, setI] = useState(Math.max(0, list.indexOf(src)))
  const [zoomed, setZoomed] = useState(false)
  const n = list.length
  const go = (d: 1 | -1) => setI(v => Math.min(n - 1, Math.max(0, v + d)))
  const arrow = (d: 1 | -1) => (
    <button type="button" aria-label={d < 0 ? '이전 사진' : '다음 사진'} onClick={() => go(d)} disabled={d < 0 ? i === 0 : i === n - 1}
      style={{ position: 'absolute', top: '50%', [d < 0 ? 'left' : 'right']: 8, transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.14)', display: zoomed ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (d < 0 ? i === 0 : i === n - 1) ? 0.25 : 1 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d={d < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: '#000000', color: '#FFFFFF', fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif" }}>
      <div style={{ position: 'absolute', top: 62, left: 0, right: 0, textAlign: 'center', fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{n > 1 ? `${i + 1} / ${n}` : ''}</div>
      <button type="button" onClick={onClose} aria-label="닫기" style={{ position: 'absolute', top: 52, right: 14, width: 40, height: 40, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
        <PhoneIcon name="close" color="#FFFFFF" size={18} stroke={2.2} />
      </button>
      <div style={{ position: 'absolute', top: 110, left: 0, right: 0, bottom: n > 1 ? 130 : 60 }}>
        <ZoomableImage src={list[i]} className="w-full h-full" onZoomChange={setZoomed} resetKey={i} onSwipe={n > 1 ? go : undefined} />
        {n > 1 && <>{arrow(-1)}{arrow(1)}</>}
      </div>
      {n > 1 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 50, display: 'flex', gap: 3, overflowX: 'auto', padding: '0 12px', justifyContent: n < 8 ? 'center' : undefined }}>
          {list.map((p, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`사진 ${k + 1}`} style={{ width: k === i ? 44 : 32, height: 52, flexShrink: 0, border: 0, padding: 0, borderRadius: 3, overflow: 'hidden', opacity: k === i ? 1 : 0.55, cursor: 'pointer', transition: 'width 0.2s' }}><Photo src={p} /></button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 사진 다 본 뒤 — 다음 폴더 카드 (마지막 폴더면 첫 폴더로) */
function NextFolder({ data, cur, onPick, dark }: { data: PhoneData; cur: number; onPick: (i: number) => void; dark?: boolean }) {
  const fs = foldersOf(data)
  if (fs.length < 2 || cur < 0) return null
  const ni = (cur + 1) % fs.length
  const f = fs[ni]
  const toTop = (el: HTMLElement | null) => {
    // 가장 가까운 세로 스크롤 영역을 맨 위로
    for (let p = el?.parentElement; p; p = p.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) { p.scrollTo({ top: 0, behavior: 'smooth' }); return }
    }
  }
  return (
    <button type="button" onClick={e => { onPick(ni); toTop(e.currentTarget) }}
      style={{ font: 'inherit', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, border: 0, cursor: 'pointer', textAlign: 'left',
        background: dark ? 'rgba(255,255,255,0.12)' : '#F4F4F6', color: dark ? '#FFFFFF' : '#111111' }}>
      <span style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: dark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }}>{f.images[0] && <Photo src={f.images[0]} />}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12, opacity: 0.6 }}>{ni === 0 ? '처음 폴더' : '다음 폴더'}</span>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 700, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name || `폴더 ${ni + 1}`}</span>
        <span style={{ display: 'block', fontSize: 12.5, opacity: 0.6, marginTop: 1 }}>사진 {f.images.length}장</span>
      </span>
      <PhoneIcon name="chevron" color={dark ? '#FFFFFF' : '#8E8E93'} size={18} stroke={2.2} />
    </button>
  )
}

/** 지금 보여 줄 폴더 묶음 — -1(전체)이면 모든 폴더, 아니면 그 폴더 하나 */
const folderSections = (data: PhoneData, cur: number) => { const fs = foldersOf(data); return cur < 0 ? fs : [fs[cur]].filter(Boolean) }
const folderImages = (data: PhoneData, cur: number) => folderSections(data, cur).flatMap(f => f.images)
/** 전체 보기에서 폴더 제목 줄 */
function FolderHead({ name, count, i, dark }: { name: string; count: number; i: number; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: i ? '24px 2px 10px' : '4px 2px 10px' }}>
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{name || `폴더 ${i + 1}`}</span>
      <span style={{ fontSize: 13, opacity: dark ? 0.6 : 0.45 }}>{count}</span>
    </div>
  )
}

/** 사진첩 폴더 탭 — 폴더가 2개 이상일 때만 */
function FolderTabs({ data, cur, onPick, dark }: { data: PhoneData; cur: number; onPick: (i: number) => void; dark?: boolean }) {
  const fs = foldersOf(data)
  if (fs.length < 2) return null
  const total = fs.reduce((n, f) => n + f.images.length, 0)
  const tabs = [{ name: '전체', images: { length: total } }, ...fs]
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0' }}>
      {tabs.map((f, k) => { const i = k - 1; return (
        <button key={i} type="button" onClick={() => onPick(i)} style={{ font: 'inherit', flexShrink: 0, height: 32, padding: '0 14px', borderRadius: 999, border: 0, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
          background: cur === i ? (dark ? '#FFFFFF' : '#111111') : (dark ? 'rgba(255,255,255,0.14)' : '#EFEFF4'), color: cur === i ? (dark ? '#111111' : '#FFFFFF') : (dark ? '#FFFFFF' : '#111111') }}>
          {f.name || `폴더 ${i + 1}`}<span style={{ marginLeft: 5, opacity: 0.55, fontWeight: 500 }}>{f.images.length}</span>
        </button>
      ) })}
    </div>
  )
}

/* ───────── 앱 화면 · 초대장 형식 (사진 + 흐린 배경 + 유리 카드) ───────── */
const GLASS_DARK: CSSProperties = { background: 'rgba(255,255,255,0.13)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)', borderRadius: 22 }
const DIM_DARK = 'rgba(255,255,255,0.72)'

function InviteApp({ app, data, onBack, onNavigate, renderRsvp }: AppProps) {
  const t = themeOf(data)
  const accent = data.phone.accent
  // 유리 카드 색 — 검정(어두운 유리 · 흰 글자) / 흰색(밝은 유리 · 검은 글자)
  const light = data.phone.glassTone === 'light'
  const INK = light ? '#1C1A18' : '#FFFFFF'
  const DIM = light ? 'rgba(28,26,24,0.6)' : DIM_DARK
  const LN = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'
  const FILL = light ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.16)'
  const EDGE = light ? 'inset 0 0 0 1px rgba(0,0,0,0.06)' : 'inset 0 0 0 1px rgba(255,255,255,0.14)'
  const SOLID = light ? '#1C1A18' : '#FFFFFF'
  const ON_SOLID = light ? '#FFFFFF' : '#2A221E'
  const GLASS: CSSProperties = light ? { background: 'rgba(255,255,255,0.62)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.8)', borderRadius: 22 } : GLASS_DARK
  const wp = weddingParts(data)
  const sc = screenCoverOf(data, app)
  const cover = sc.src
  const coverCrop = sc.crop
  const { copied, copy } = useCopy()
  const [zoom, setZoom] = useState<string | null>(null)
  const [folder, setFolder] = useState(-1)
  const folderImgs = folderImages(data, folder)
  const [giftSide, setGiftSide] = useState<'groom' | 'bride'>('groom')
  const go = (a: PhoneAppId) => onNavigate?.(a)
  const v = data.wedding.venue
  const q = encodeURIComponent(v.name || v.address || '')
  const tn = titleNames(data)
  const dday = ddayText(ddayCount(data.wedding.date))
  const dateFull = wp.d ? `${wp.year}년 ${wp.month}월 ${wp.day}일 ${wp.dayKo}요일` : '예식일'

  const section = (label: string, right?: ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '26px 4px 10px', fontSize: 13, fontWeight: 700, color: DIM }}>{label}{right}</div>
  )
  const row = (icon: string, title: ReactNode, sub: ReactNode, right?: ReactNode, onClick?: () => void, last?: boolean) => (
    <div onClick={onClick} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: last ? undefined : `1px solid ${LN}`, cursor: onClick ? 'pointer' : undefined }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: FILL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PhoneIcon name={icon} color={INK} size={19} stroke={1.8} /></span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 13, color: DIM, fontVariantNumeric: 'tabular-nums' }}>{sub}</span>
      </span>
      {right && <span style={{ fontSize: 13, color: DIM, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>{right}</span>}
    </div>
  )
  const pill = (label: ReactNode, onClick: () => void, solid?: boolean, h = 46): ReactNode => (
    <button type="button" onClick={onClick} style={{ height: h, borderRadius: 999, border: 0, background: solid ? SOLID : FILL, color: solid ? ON_SOLID : INK, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', font: 'inherit', padding: '0 14px', boxShadow: solid ? undefined : EDGE }}>{label}</button>
  )

  const linkPill: CSSProperties = { height: 46, borderRadius: 999, background: FILL, boxShadow: EDGE, color: INK, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }

  // 흐린 표지 배경 + 뒤로 버튼 — 모든 화면 공통
  const frame = (children: ReactNode, hero?: number) => (
    <div style={{ position: 'absolute', inset: 0, background: light ? '#F2F0EE' : '#2A2420', color: INK, fontFamily: t.body, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: -70, backgroundImage: cover ? `url(${cover})` : `linear-gradient(160deg, ${accent}, #2A2420)`, backgroundSize: 'cover', backgroundPosition: 'center', filter: `blur(46px) saturate(1.15) brightness(${light ? 1.05 : 0.6})`, transform: 'scale(1.15)' }} />
      {light && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.55)' }} />}
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {hero ? (
          <div style={{ position: 'relative', height: hero, WebkitMaskImage: 'linear-gradient(180deg,#000 62%,transparent 100%)', maskImage: 'linear-gradient(180deg,#000 62%,transparent 100%)' }}>
            <Photo src={cover} crop={coverCrop} />
          </div>
        ) : null}
        {children}
      </div>
      {/* 스크롤 영역 바깥 — 내용을 내려도 왼쪽 위 고정. 밝은 유리면 밝은 동그라미 */}
      <BackCircle onClick={onBack} dark={!light} ink={INK} />
      {zoom && <ZoomOverlay src={zoom} imgs={app === 'album' ? folderImgs : data.gallery.images} onClose={() => setZoom(null)} />}
    </div>
  )
  const pageTitle = (en: string, ko: string, sub?: string) => (
    <div style={{ padding: '108px 22px 0' }}>
      <div style={displayCss(data, titleFontOf(data).latin ? en : ko, 34)}>{titleFontOf(data).latin ? en : ko}</div>
      {sub && <div style={{ fontSize: 14.5, color: DIM, marginTop: 8 }}>{sub}</div>}
    </div>
  )

  if (app === 'memo') {
    const titleText = `${tn.a} & ${tn.b}`
    const fs = fitTitle(data, titleText, 340, 60)
    const rsvpOn = data.rsvpEnabled !== false
    const pics = data.gallery.images.slice(0, 5)
    return frame(
      <div style={{ marginTop: -150, position: 'relative', padding: '0 18px 60px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...titleCss(data, fs), lineHeight: 1.02, textShadow: light ? undefined : '0 2px 20px rgba(0,0,0,0.25)', wordBreak: 'keep-all' }}>
            {tn.a} {tn.latin ? <span style={{ fontStyle: 'italic' }}>&amp;</span> : '&'} {tn.b}
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 14, fontVariantNumeric: 'tabular-nums' }}>{dateFull}{wp.timeShort ? ` · ${wp.timeShort}` : ''}</div>
          {v.name && <div style={{ fontSize: 15, color: DIM, marginTop: 4 }}>{v.name}</div>}
        </div>
        {rsvpOn && (
          <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {pill(<><PhoneIcon name="check" color={ON_SOLID} size={17} stroke={2.2} />참석</>, () => go('rsvp'), true)}
            {pill(<><PhoneIcon name="close" color={INK} size={15} stroke={2.2} />불참</>, () => go('rsvp'))}
            {pill(<><PhoneIcon name="question" color={INK} size={17} stroke={2} />미정</>, () => go('rsvp'))}
          </div>
        )}
        {data.phone.greeting && <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14.5, lineHeight: 1.75, color: DIM, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.greeting}</p>}
        <div style={{ ...GLASS, marginTop: 24, padding: '2px 16px' }}>
          {row('calendar', wp.d ? `${wp.dayKo}요일, ${wp.month}월 ${wp.day}일` : '예식일', wp.timeShort || wp.timeKo || '', dday)}
          {row('map', v.name || '예식장', [v.hall, v.address].filter(Boolean).join(' · '), v.address ? (copied === 'addr' ? '복사됨' : '복사') : undefined, v.address ? () => copy('addr', v.address) : undefined, true)}
        </div>
        {q && <>
          {section('오시는 길')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            <a href={`https://map.naver.com/p/search/${q}`} target="_blank" rel="noreferrer" style={linkPill}>네이버 지도</a>
            <a href={`https://map.kakao.com/link/search/${q}`} target="_blank" rel="noreferrer" style={linkPill}>카카오맵</a>
          </div>
        </>}
        {(data.phone.directions || []).some(x => x.text.trim()) && <>
          {!q && section('오시는 길')}
          <div style={{ ...GLASS, marginTop: q ? 10 : 0, padding: '2px 16px' }}>
            <Directions data={data} ink={INK} sub={DIM} line={LN} icon={INK} />
          </div>
        </>}
        {data.phone.memo.filter(Boolean).length > 0 && <>
          {section('알려드려요')}
          <div style={{ ...GLASS, padding: '2px 16px' }}>
            {data.phone.memo.map((m, i) => ({ m, t: (data.phone.memoTitles?.[i] || '').trim() })).filter(x => x.m).map(({ m, t: mt }, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '13px 0', borderBottom: i < arr.length - 1 ? `1px solid ${LN}` : undefined, fontSize: 14.5, lineHeight: 1.55 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: INK, opacity: 0.7, marginTop: 8, flexShrink: 0 }} />
                <span style={{ whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{mt && <b style={{ display: 'block', fontWeight: 700, marginBottom: 2 }}>{mt}</b>}{m}</span>
              </div>
            ))}
          </div>
        </>}
        {pics.length > 0 && <>
          {section('사진', <button type="button" onClick={() => go('album')} style={{ font: 'inherit', border: 0, background: 'transparent', color: DIM, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>모두 보기<PhoneIcon name="chevron" color={DIM} size={14} stroke={2} /></button>)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, borderRadius: 18, overflow: 'hidden' }}>
            {pics.map((src, i) => <button key={i} type="button" onClick={() => setZoom(src)} aria-label={`사진 ${i + 1}`} style={{ aspectRatio: '1', border: 0, padding: 0, cursor: 'pointer' }}><Photo src={src} /></button>)}
            <button type="button" onClick={() => go('album')} style={{ font: 'inherit', aspectRatio: '1', border: 0, background: FILL, color: INK, fontSize: 13, cursor: 'pointer' }}>+{Math.max(0, data.gallery.images.length - pics.length) || ''} 더 보기</button>
          </div>
        </>}
        {section('마음 · 연락')}
        <div style={{ ...GLASS, padding: '2px 16px' }}>
          {!isAppOff(data, 'gift') && row('gift', '마음 전하기', '마음 전하실 곳', <PhoneIcon name="chevron" color={DIM} size={16} stroke={2} />, () => go('gift'))}
          {!isAppOff(data, 'call') && row('call', '연락하기', '신랑 · 신부에게 전화와 문자', <PhoneIcon name="chevron" color={DIM} size={16} stroke={2} />, () => go('call'), true)}
        </div>
      </div>, 470)
  }

  if (app === 'story') {
    const chs = chaptersOf(data)
    const span = chs.filter(c => c.title).map(c => c.title)
    const nm = { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') }
    const ss = data.phone.storyStyle
    const sub = span.length > 1 ? `${span[0]}부터 ${span[span.length - 1]}까지` : span[0]
    if (ss === 'stories') return <StorySlides data={data} chs={chs} nm={nm} onBack={onBack} />
    if (ss === 'timeline' || ss === 'essay') {
      const ink: StoryInk = { ink: INK, sub: DIM, line: LN, accent: INK }
      return frame(
        <>
          {pageTitle(storyTitleOf(data), storyTitleOf(data), sub)}
          <div style={{ padding: '26px 22px 70px' }}>
            {ss === 'timeline' ? <StoryTimeline chs={chs} nm={nm} ink={ink} data={data} /> : <StoryEssay chs={chs} nm={nm} ink={ink} data={data} bleed={22} />}
          </div>
        </>)
    }
    return frame(
      <>
        {pageTitle(storyTitleOf(data), storyTitleOf(data), span.length > 1 ? `${span[0]}부터 ${span[span.length - 1]}까지` : span[0])}
        <div style={{ padding: '22px 18px 60px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chs.map((c, i) => (
            <div key={i} style={{ ...GLASS, overflow: 'hidden' }}>
              {c.src && (
                <div style={{ height: i === 0 ? 250 : 210, position: 'relative' }}>
                  <Photo src={c.src} crop={c.crop} />
                  {c.title && <span style={{ position: 'absolute', left: 12, top: 12, height: 28, padding: '0 12px', borderRadius: 999, background: 'rgba(0,0,0,0.38)', color: '#FFFFFF', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center' }}>{c.title}</span>}
                </div>
              )}
              {(c.lines.length > 0 || (!c.src && c.title)) && (
                <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {!c.src && c.title && <span style={{ fontSize: 12.5, fontWeight: 700, color: DIM }}>{c.title}</span>}
                  <StoryLines c={c} nm={nm} ink={{ ink: INK, sub: DIM, line: LN, accent: INK }} size={16.5} />
                </div>
              )}
            </div>
          ))}
        </div>
      </>)
  }

  if (app === 'album') return frame(
    <>
      {pageTitle(screenText(data, 'album', 'title', 'Gallery'), screenText(data, 'album', 'title', '사진첩'), `${data.gallery.images.length}장`)}
      <div style={{ padding: '22px 18px 60px' }}>
        <div style={{ marginBottom: 12 }}><FolderTabs data={data} cur={folder} onPick={setFolder} dark={!light} /></div>
        {folderImgs.length === 0
          ? <p style={{ fontSize: 14, color: DIM }}>아직 사진이 없어요.</p>
          : folderSections(data, folder).map((f, si, all) => (
              <div key={si}>
                {all.length > 1 && <FolderHead name={f.name} count={f.images.length} i={si} dark={!light} />}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, borderRadius: 18, overflow: 'hidden' }}>
                  {f.images.map((src, i) => <button key={i} type="button" onClick={() => setZoom(src)} aria-label={`사진 ${i + 1}`} style={{ aspectRatio: '1', border: 0, padding: 0, cursor: 'pointer' }}><Photo src={src} /></button>)}
                </div>
              </div>
            ))}
        <div style={{ marginTop: 16 }}><NextFolder data={data} cur={folder} onPick={setFolder} dark={!light} /></div>
      </div>
    </>)

  if (app === 'gift') {
    const p = data[giftSide]
    const parents = giftSide === 'groom' ? '신랑' : '신부'
    return frame(
      <div style={{ position: 'relative', marginTop: -170, minHeight: 700, borderRadius: '34px 34px 0 0', background: light ? 'rgba(255,255,255,0.72)' : 'rgba(40,32,28,0.62)', boxShadow: light ? '0 -8px 30px rgba(0,0,0,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.18)', padding: '10px 20px 60px' }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.35)', margin: '0 auto' }} />
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 22 }}>{data.phone.giftTitle || GIFT_TITLE}</div>
        <div style={{ fontSize: 14, color: DIM, marginTop: 6, lineHeight: 1.6, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.giftMessage ?? GIFT_MESSAGE}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 14, background: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)', marginTop: 20 }}>
          {(['groom', 'bride'] as const).map(s => (
            <button key={s} type="button" onClick={() => setGiftSide(s)} style={{ font: 'inherit', height: 38, borderRadius: 11, border: 0, background: giftSide === s ? (light ? '#FFFFFF' : 'rgba(255,255,255,0.92)') : 'transparent', color: giftSide === s ? '#2A221E' : DIM, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{s === 'groom' ? '신랑 측' : '신부 측'}</button>
          ))}
        </div>
        <div style={{ ...GLASS, marginTop: 16, padding: '2px 16px' }}>
          {p.accounts.length === 0 && <p style={{ padding: '16px 0', fontSize: 14, color: DIM }}>등록된 계좌가 없어요.</p>}
          {p.accounts.map((a, i) => {
            const key = giftSide + i
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < p.accounts.length - 1 ? `1px solid ${LN}` : undefined }}>
                <span style={{ width: 38, height: 38, borderRadius: '50%', background: accent, color: '#FFFFFF', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{bankShort(a.bank)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{a.relation && <span style={{ fontSize: 12.5, fontWeight: 500, color: DIM, marginRight: 6 }}>{a.relation}</span>}{a.holder || p.name || parents}</span>
                  <span style={{ display: 'block', fontSize: 13.5, color: DIM, marginTop: 2, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em' }}>{a.bank} {a.number}</span>
                </span>
                <button type="button" onClick={() => copy(key, `${a.bank} ${a.number}`)} style={{ font: 'inherit', height: 34, padding: '0 14px', borderRadius: 999, border: 0, background: copied === key ? SOLID : FILL, color: copied === key ? ON_SOLID : INK, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{copied === key ? '복사됨' : '복사'}</button>
              </div>
            )
          })}
        </div>
      </div>, 300)
  }

  if (app === 'call') {
    const person = (c: ContactRow, last?: boolean) => (
      <div key={c.k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: last ? undefined : `1px solid ${LN}` }}>
        <Avatar av={c.av} size={c.couple ? 46 : 40} bg={FILL} color={INK} dim={c.deceased} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 12.5, color: DIM }}>{c.rel}</span>
          <span style={{ display: 'block', fontSize: c.couple ? 17 : 16, fontWeight: 600, marginTop: 2 }}><ContactName c={c} data={data} /></span>
        </span>
        {c.deceased ? null : c.phone
          ? <>
              <a href={`tel:${c.phone}`} aria-label={`${c.rel}에게 전화`} style={{ width: 44, height: 44, borderRadius: '50%', background: SOLID, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="call" color={ON_SOLID} size={20} stroke={1.8} /></a>
              <a href={`sms:${c.phone}`} aria-label={`${c.rel}에게 문자`} style={{ width: 44, height: 44, borderRadius: '50%', background: FILL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="message" color={INK} size={20} stroke={1.8} /></a>
            </>
          : <span style={{ fontSize: 13, color: DIM }}>번호 없음</span>}
      </div>
    )
    return frame(
      <>
        {pageTitle(screenText(data, 'call', 'title', 'Contact'), screenText(data, 'call', 'title', '연락하기'))}
        <div style={{ padding: '22px 18px 60px' }}>
          {contactsOf(data).some(c => !c.couple)
            ? (['groom', 'bride'] as const).map(sd => {
                const list = contactsOf(data, sd)
                return (
                  <div key={sd}>
                    {section(sd === 'groom' ? '신랑 측' : '신부 측')}
                    <div style={{ ...GLASS, padding: '2px 16px' }}>{list.map((c, i) => person(c, i === list.length - 1))}</div>
                  </div>
                )
              })
            : <div style={{ ...GLASS, padding: '2px 16px' }}>{contactsOf(data).map((c, i, a) => person(c, i === a.length - 1))}</div>}
        </div>
      </>)
  }

  // rsvp — 초대장 첫 화면처럼 대표 사진 위 제목, 아래에서 올라온 흰 시트에 회신 양식
  const rsvpTitle = titleFontOf(data).latin ? 'RSVP' : '참석 회신'
  return frame(
    <div style={{ marginTop: -150, position: 'relative' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <div style={{ ...displayCss(data, rsvpTitle, 40), textShadow: light ? undefined : '0 2px 18px rgba(0,0,0,0.25)' }}>{rsvpTitle}</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 10, fontVariantNumeric: 'tabular-nums' }}>{dateFull}{wp.timeShort ? ` · ${wp.timeShort}` : ''}</div>
        {v.name && <div style={{ fontSize: 14, color: DIM, marginTop: 3 }}>{v.name}</div>}
      </div>
      <div style={{ marginTop: 26, minHeight: 560, borderRadius: '28px 28px 0 0', background: '#FFFFFF', color: '#2A2622', padding: '10px 20px 60px', boxShadow: '0 -10px 30px rgba(0,0,0,0.18)' }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: '#E2E0DD', margin: '0 auto 18px' }} />
        <div style={{ fontSize: 14, color: '#7A736B', textAlign: 'center', marginBottom: 6 }}>참석 여부를 알려 주세요</div>
        {renderRsvp ? renderRsvp() : <p style={{ padding: '14px 0', fontSize: 14, color: '#6E665D', lineHeight: 1.6, textAlign: 'center' }}>실제 청첩장에서 회신 양식이 보여요.</p>}
      </div>
    </div>, 360)
}

/* ───────── 앱 화면 · 폰 앱 형식 (메모 · 메시지 · 캘린더 · 지갑 · 연락처 · 사진) ───────── */
// 누구나 아는 폰 기본 앱의 모습을 빌려, 같은 내용을 '익숙한 앱'으로 보여 준다
const SYS = "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif"
const IOS = { gray: '#8E8E93', line: 'rgba(0,0,0,0.08)', group: '#F4F4F5', blue: 'var(--pa, #8C6A5A)', red: 'var(--pa, #8C6A5A)', amber: 'var(--pa, #8C6A5A)', bubble: '#F0F0F2' }
/** 고급스러운 바탕 — 위쪽에 포인트 색이 아주 옅게 번진다 */
const TINT = 'none'
/** 부드럽게 퍼지는 그림자 */
const SOFT = '0 1px 2px rgba(0,0,0,0.04), 0 10px 28px rgba(0,0,0,0.06)'
/** 큰 제목 위 작은 영문 머리말 */
const eyebrow = (t: string) => <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.26em', color: 'var(--pa, #8C6A5A)', marginBottom: 8 }}>{t}</div>

function NativeApp({ app, data, onBack, onNavigate, renderRsvp }: AppProps) {
  const accent = data.phone.accent
  const wp = weddingParts(data)
  const v = data.wedding.venue
  const names = `${data.groom.name || '신랑'} · ${data.bride.name || '신부'}`
  const nm = { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') }
  const cover = coverOf(data)
  const { copied, copy } = useCopy()
  const [zoom, setZoom] = useState<string | null>(null)
  const [folder, setFolder] = useState(-1)
  const [who, setWho] = useState<'groom' | 'bride'>('groom')
  // 연락처 — 가족을 누르면 번호가 펼쳐짐
  const [famOpen, setFamOpen] = useState<string | null>(null)
  const [unfold, setUnfold] = useState(false)
  const [pick, setPick] = useState<'yes' | 'maybe' | 'no' | null>(null)
  const go = (a: PhoneAppId) => onNavigate?.(a)

  const shell = (bg: string, children: ReactNode, bottom?: ReactNode) => (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: bg, backgroundImage: TINT, color: '#111111', fontFamily: SYS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>{children}</div>
      {bottom}
      {zoom && <ZoomOverlay src={zoom} imgs={app === 'album' ? folderImages(data, folder) : data.gallery.images} onClose={() => setZoom(null)} />}
    </div>
  )
  // 뒤로 — 내용을 내려도 왼쪽 위에 떠 있음 (오른쪽 위 음악 버튼과 같은 줄). 줄 안에는 같은 폭 빈 칸
  const nav = (label: string, color: string, bg: string, right?: ReactNode, center?: ReactNode) => (
    <>
    <div style={{ position: 'sticky', top: 0, height: 0, zIndex: 6 }}>
      <button type="button" onClick={onBack} aria-label={label ? `뒤로 · ${label}` : '뒤로'} style={{ position: 'absolute', top: 52, left: 12, width: 40, height: 40, borderRadius: '50%', border: 0, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bg === '#000000' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: bg === '#000000' ? undefined : '0 2px 10px rgba(0,0,0,0.12)' }}>
        <PhoneIcon name="back" color={color} size={22} stroke={2} />
      </button>
    </div>
    <div style={{ position: 'relative', zIndex: 2, background: bg === '#000000' ? bg : 'transparent', padding: '59px 10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
      <span aria-hidden style={{ width: 40, height: 40, flexShrink: 0 }} />
      {center}
      <span style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end' }}>{right}</span>
    </div>
    </>
  )
  const avatar = (s: number) => (
    <span style={{ width: s, height: s, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: `linear-gradient(160deg, #B9B9BE, #8E8E93)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {cover ? <Photo src={cover} /> : <PhoneIcon name="heart" color="#FFFFFF" size={s * 0.45} />}
    </span>
  )

  /* 예식 안내 — 폰 앱 형식에서는 지도 */
  if (app === 'memo') return <MemoMap data={data} onBack={onBack} onNavigate={onNavigate} />

  /* 저널 앱 모양 — 우리 이야기 (제목 Our Story, 장마다 기록 카드 한 장) */
  if (app === 'story') {
    const chs = chaptersOf(data)
    return shell(IOS.group, (
      <>
        {nav('', IOS.blue, IOS.group)}
        <div style={{ padding: '0 18px 6px' }}>
          <div style={displayCss(data, storyTitleOf(data), 34)}>{storyTitleOf(data)}</div>
          <div style={{ fontSize: 14, color: IOS.gray, marginTop: 2 }}>{nm.a} · {nm.b}의 기록 {chs.length}개</div>
        </div>
        <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {chs.map((c, i) => {
            return (
              <div key={i} style={{ background: '#FFFFFF', borderRadius: 22, overflow: 'hidden', boxShadow: SOFT }}>
                {c.src && (
                  <div style={{ height: 196 }}>
                    <button type="button" onClick={() => setZoom(c.src!)} style={{ width: '100%', height: '100%', border: 0, padding: 0, cursor: 'pointer', display: 'block' }}><Photo src={c.src} crop={c.crop} /></button>
                  </div>
                )}
                <div style={{ padding: '14px 16px 12px' }}>
                  {c.title && <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>{c.title}</div>}
                  <div style={{ marginTop: c.title ? 6 : 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {c.lines.map((l, j) => l.side === 'p'
                      ? <p key={j} style={{ fontSize: 15, lineHeight: 1.6, color: '#3A3A3C', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{l.text}</p>
                      : <p key={j} style={{ fontSize: 15, lineHeight: 1.6, color: '#3A3A3C', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>&ldquo;{l.text}&rdquo; <span style={{ color: IOS.gray, fontSize: 13 }}>— {l.side === 'a' ? nm.a : nm.b}</span></p>)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: `0.5px solid ${IOS.line}` }}>
                    <span style={{ fontSize: 12.5, color: IOS.gray, fontVariantNumeric: 'tabular-nums' }}>{(() => {
                      // 날짜를 넣은 장만 '2020년 9월 14일 월요일' 처럼
                      const d = c.date && parseWeddingDate(c.date)
                      return d ? `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일` : ''
                    })()}</span>
                    <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <PhoneIcon name="heart" color={i === chs.length - 1 ? IOS.red : '#C7C7CC'} size={16} />
                      <span style={{ fontSize: 13, color: '#C7C7CC', fontWeight: 800, letterSpacing: 1 }}>···</span>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </>
    ), (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 30, display: 'flex', justifyContent: 'center' }}>
        {cheerTo(data) && (
        <button type="button" onClick={() => go(cheerTo(data)!)} style={{ font: 'inherit', height: 48, padding: '0 22px', borderRadius: 999, border: 0, background: 'var(--pa, #8C6A5A)', color: '#FFFFFF', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 10px 28px rgba(40,30,20,0.22)', cursor: 'pointer' }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>축하 남기기
        </button>
        )}
      </div>
    ))
  }

  /* 캘린더 — 참석 회신 */
  if (app === 'rsvp') {
    const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return (h || 0) * 60 + (m || 0) }
    const base = toMin(data.wedding.time || '14:00')
    const own = (data.phone.schedule || []).filter(e => e.time && e.title.trim())
    const events = (own.length
      ? own.map(e => { const s = toMin(e.time); const en = e.end ? toMin(e.end) : s + 30; return { s, e: Math.max(en, s + 20), title: e.title, sub: '' } })
      : [{ s: base, e: base + 120, title: `${nm.a} ♥ ${nm.b} 결혼식`, sub: v.name }]).sort((a, b) => a.s - b.s)
    // 겹치는 일정은 옆으로 나란히
    const lanes: number[] = []
    const placed = events.map(ev => { let l = lanes.findIndex(end => end <= ev.s); if (l < 0) { l = lanes.length; lanes.push(0) } lanes[l] = ev.e; return { ...ev, lane: l } })
    const nLanes = Math.max(1, lanes.length)
    const startM = events[0].s
    const endM = Math.max(...events.map(e => e.e))
    const h0 = Math.floor(startM / 60)
    const hours = Array.from({ length: Math.max(3, Math.ceil(endM / 60) - h0 + 1) }, (_, i) => h0 + i)
    // 짧은 일정(20분 등)도 글자가 들어가게 — 가장 짧은 일정이 24px 이상
    const minDur = Math.min(...events.map(e => e.e - e.s))
    const PX = Math.min(84, Math.max(44, Math.ceil((24 * 60) / Math.max(1, minDur))))
    const hLabel = (x: number) => `${x < 12 ? '오전' : '오후'} ${x % 12 || 12}시`
    const mLabel = (m: number) => { const h = Math.floor(m / 60) % 24; const mm = m % 60; return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${mm ? ` ${mm}분` : ''}` }
    const clock = (m: number) => `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')}`
    const group = (children: ReactNode) => <div style={{ margin: '0 16px 16px', background: '#FFFFFF', borderRadius: 18, overflow: 'hidden', boxShadow: SOFT }}>{children}</div>
    const gRow = (l: ReactNode, r: ReactNode, last?: boolean) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: last ? undefined : `0.5px solid ${IOS.line}`, fontSize: 16 }}>{l}<span style={{ color: IOS.gray, display: 'flex', alignItems: 'center', gap: 6 }}>{r}</span></div>
    )
    const picks: [typeof pick, string][] = [['yes', '수락'], ['maybe', '미정'], ['no', '거절']]
    return shell(IOS.group, (
      <>
        {nav('캘린더', IOS.red, IOS.group)}
        <div style={{ padding: '0 16px 14px' }}>
          {eyebrow(screenText(data, 'rsvp', 'eyebrow', 'RSVP'))}<div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>{screenText(data, 'rsvp', 'title', `${names} 결혼식`)}</div>
          <div style={{ fontSize: 15, color: IOS.gray, marginTop: 4 }}>{[v.name, v.hall].filter(Boolean).join(' ')}</div>
          <div style={{ fontSize: 15, marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>{wp.d ? `${wp.year}년 ${wp.month}월 ${wp.day}일 (${wp.dayKo})` : '예식일'}</div>
          <div style={{ fontSize: 15, color: IOS.gray, marginTop: 2 }}>{mLabel(startM)}부터 {mLabel(endM)}까지</div>
        </div>
        {group(
          <div style={{ padding: '16px 12px 4px', position: 'relative' }}>
            {hours.map(x => (
              <div key={x} style={{ height: PX, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ width: 52, fontSize: 11, color: IOS.gray, transform: 'translateY(-6px)', flexShrink: 0 }}>{hLabel(x)}</span>
                <span style={{ flex: 1, height: 0.5, background: IOS.line }} />
              </div>
            ))}
            {placed.map((ev, i) => {
              const h = ((ev.e - ev.s) / 60) * PX - 2
              const roomy = h >= 38
              return (
                <div key={i} style={{ position: 'absolute', left: `calc(72px + (100% - 84px) * ${ev.lane / nLanes})`, width: `calc((100% - 84px) / ${nLanes} - 3px)`, top: 16 + ((ev.s - h0 * 60) / 60) * PX + 1, height: h, borderRadius: 6, background: `${accent}26`, borderLeft: `3px solid ${accent}`, padding: roomy ? '5px 9px' : '0 9px', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: roomy ? 'column' : 'row', alignItems: roomy ? 'flex-start' : 'center', gap: roomy ? 1 : 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: accent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{ev.title}</span>
                  <span style={{ fontSize: 11.5, color: accent, opacity: 0.8, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{ev.sub || `${clock(ev.s)} – ${clock(ev.e)}`}</span>
                </div>
              )
            })}
          </div>
        )}
        {group(<>
          {gRow('초대한 사람', <>{avatar(24)}<span>{nm.a} · {nm.b}</span></>)}
          {gRow('알림', <>1일 전<PhoneIcon name="chevron" color="#C7C7CC" size={14} stroke={2.4} /></>)}
          {gRow('장소', <span style={{ maxWidth: 190, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.address || v.name}</span>, true)}
        </>)}
        {group(
          <div style={{ padding: '14px 16px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: IOS.gray, marginBottom: 6 }}>회신 보내기</div>
            {renderRsvp ? renderRsvp({ attendance: pick === 'yes' ? 'attending' : pick === 'no' ? 'not_attending' : 'pending' }) : <p style={{ fontSize: 14, color: IOS.gray, lineHeight: 1.6 }}>하객이 이름 · 참석 여부 · 인원을 남기는 칸이에요. 실제 청첩장에서 작동해요.</p>}
          </div>
        )}
        <div style={{ height: 100 }} />
      </>
    ), (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, background: 'rgba(249,249,249,0.96)', borderTop: `0.5px solid ${IOS.line}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', alignItems: 'center' }}>
        {picks.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setPick(k)} style={{ border: 0, background: 'transparent', color: IOS.red, fontSize: 17, fontWeight: pick === k ? 800 : 500, cursor: 'pointer', font: 'inherit' }}>
            {pick === k ? `✓ ${l}` : l}
          </button>
        ))}
      </div>
    ))
  }

  /* 메일 — 마음 전하기 (두 사람이 보낸 메일 한 통, 계좌는 첨부처럼 눌러야 펼쳐진다) */
  if (app === 'gift') {
    const attach = (k: 'groom' | 'bride') => {
      const p = data[k]
      const opened = who === k && unfold
      // 신랑 측 · 신부 측 색을 나눠 한눈에 (차분한 블루 · 로즈)
      const tone = k === 'groom' ? { ink: '#5B7A9E', soft: '#EEF3F8' } : { ink: '#B86B7E', soft: '#F8EEF1' }
      return (
        <div key={k} style={{ border: `1px solid ${opened ? tone.ink + '55' : IOS.line}`, borderRadius: 14, overflow: 'hidden', marginTop: 10 }}>
          <button type="button" onClick={() => { setWho(k); setUnfold(v => (who === k ? !v : true)) }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: 0, background: tone.soft, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PhoneIcon name="heart" color={tone.ink} size={18} stroke={1.6} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#111111' }}><span style={{ color: tone.ink }}>{k === 'groom' ? '신랑' : '신부'} 측</span></span>
              <span style={{ display: 'block', fontSize: 12.5, color: IOS.gray, marginTop: 2 }}>{opened ? '접기' : '눌러서 보기'}</span>
            </span>
            <span style={{ transform: opened ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.25s', display: 'flex' }}><PhoneIcon name="chevron" color="#C7C7CC" size={16} stroke={2.2} /></span>
          </button>
          {opened && (
            <div style={{ padding: '4px 14px 8px', background: '#FFFFFF' }}>
              {p.accounts.length === 0 && <p style={{ fontSize: 13.5, color: IOS.gray, padding: '10px 0' }}>적어 둔 곳이 없어요.</p>}
              {p.accounts.map((a, i) => {
                const key = k + i
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: i < p.accounts.length - 1 ? `0.5px solid ${IOS.line}` : undefined }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 500 }}>{a.relation && <span style={{ fontSize: 12.5, color: IOS.gray, marginRight: 6 }}>{a.relation}</span>}{a.holder || p.name}</span>
                      <span style={{ display: 'block', fontSize: 13.5, color: IOS.gray, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{a.bank} {a.number}</span>
                    </span>
                    <button type="button" onClick={() => copy(key, `${a.bank} ${a.number}`)} style={{ border: 0, background: 'transparent', padding: 0, fontSize: 14, color: copied === key ? IOS.gray : IOS.blue, cursor: 'pointer', font: 'inherit', flexShrink: 0 }}>{copied === key ? '복사됨' : '복사'}</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }
    return shell('#FFFFFF', (
      <>
        {nav('받은편지함', IOS.blue, 'rgba(255,255,255,0.95)')}
        <div style={{ padding: '6px 20px 120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {avatar(42)}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{nm.a} · {nm.b}</span>
                <span style={{ fontSize: 13, color: IOS.gray }}>{wp.d ? `${wp.month}월 ${wp.day}일` : ''}</span>
              </span>
              <span style={{ display: 'block', fontSize: 13.5, color: IOS.gray, marginTop: 2 }}>받는 사람: 소중한 분께</span>
            </span>
          </div>
          <div style={{ height: 0.5, background: IOS.line, margin: '14px 0' }} />
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{data.phone.giftTitle || GIFT_TITLE}</div>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: '#2C2C2E', marginTop: 14, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
            {data.phone.giftMessage ?? GIFT_MESSAGE}
          </p>
          <p style={{ fontSize: 15, color: '#2C2C2E', marginTop: 14 }}>{nm.a}, {nm.b} 드림</p>
          <div style={{ fontSize: 13, fontWeight: 600, color: IOS.gray, marginTop: 26 }}>첨부 2개</div>
          {attach('groom')}
          {attach('bride')}
        </div>
      </>
    ), (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, background: 'rgba(249,249,249,0.96)', borderTop: `0.5px solid ${IOS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cheerTo(data) && (
        <button type="button" onClick={() => go(cheerTo(data)!)} style={{ font: 'inherit', border: 0, background: 'transparent', color: IOS.blue, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 7L4 12l6 5M4 12h10a6 6 0 0 1 6 6" fill="none" stroke={IOS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          축하 답장하기
        </button>
        )}
      </div>
    ))
  }

  /* 연락처 — 연락하기 */
  if (app === 'call') {
    const p = data[who]
    const role = who === 'groom' ? '신랑' : '신부'
    const actCss = (on: boolean): CSSProperties => ({ font: 'inherit', flex: 1, height: 60, borderRadius: 16, border: 0, background: '#FFFFFF', boxShadow: SOFT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: on ? IOS.blue : '#C7C7CC', fontSize: 11.5, textDecoration: 'none', pointerEvents: on ? 'auto' : 'none', cursor: 'pointer' })
    const action = (icon: string, label: string, href?: string) => (
      <a href={href} style={actCss(!!href)}><PhoneIcon name={icon} color={href ? IOS.blue : '#C7C7CC'} size={20} stroke={1.8} />{label}</a>
    )
    return shell(IOS.group, (
      <>
        {nav('연락처', IOS.blue, IOS.group)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 2, margin: '0 16px', borderRadius: 9, background: '#E3E3E8' }}>
          {(['groom', 'bride'] as const).map(s => <button key={s} type="button" onClick={() => { setWho(s); setFamOpen(null) }} style={{ font: 'inherit', height: 30, borderRadius: 7, border: 0, background: who === s ? '#FFFFFF' : 'transparent', boxShadow: who === s ? '0 1px 3px rgba(0,0,0,0.12)' : undefined, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>{s === 'groom' ? '신랑' : '신부'}</button>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 16px 18px' }}>
          <span style={{ borderRadius: '50%', boxShadow: SOFT }}><Avatar av={contactsOf(data, who)[0].av} size={96} bg="linear-gradient(160deg, color-mix(in srgb, var(--pa) 70%, white), var(--pa))" /></span>
          <span style={{ fontSize: 28, fontWeight: 700, marginTop: 12, letterSpacing: '-0.02em' }}>{p.name || role}</span>
          <span style={{ fontSize: 14, color: IOS.gray, marginTop: 2 }}>{role}{p.nameEn ? ` · ${p.nameEn}` : ''}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
          {action('message', '메시지', p.phone ? `sms:${p.phone}` : undefined)}
          {action('call', '전화', p.phone ? `tel:${p.phone}` : undefined)}
          {!isAppOff(data, 'gift') && <button type="button" onClick={() => go('gift')} style={actCss(true)}><PhoneIcon name="gift" color={IOS.blue} size={20} stroke={1.8} />마음 전하기</button>}
        </div>
        <div style={{ margin: '16px 16px 0', background: '#FFFFFF', borderRadius: 18, padding: '14px 18px', boxShadow: SOFT }}>
          <div style={{ fontSize: 13, color: '#111111' }}>휴대전화</div>
          {p.phone ? <a href={`tel:${p.phone}`} style={{ fontSize: 17, color: IOS.blue, textDecoration: 'none', fontVariantNumeric: 'tabular-nums' }}>{p.phone}</a> : <span style={{ fontSize: 15, color: IOS.gray }}>번호가 없어요</span>}
        </div>
        {(() => {
          const fam = contactsOf(data, who).filter(c => !c.couple)
          if (!fam.length) return <div style={{ height: 60 }} />
          return (
            <>
              <div style={{ fontSize: 13, color: IOS.gray, margin: '22px 32px 8px' }}>가족</div>
              <div style={{ margin: '0 16px 60px', background: '#FFFFFF', borderRadius: 18, padding: '2px 16px', boxShadow: SOFT }}>
                {fam.map((c, i) => {
                  const open = famOpen === c.k && !!c.phone
                  return (
                  <div key={c.k} style={{ borderBottom: i < fam.length - 1 ? `0.5px solid ${IOS.line}` : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>
                    <button type="button" onClick={() => c.phone && setFamOpen(open ? null : c.k)} aria-expanded={open}
                      style={{ font: 'inherit', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, border: 0, background: 'transparent', padding: 0, textAlign: 'left', color: 'inherit', cursor: c.phone ? 'pointer' : 'default' }}>
                      <Avatar av={c.av} size={40} bg="color-mix(in srgb, var(--pa) 55%, white)" dim={c.deceased} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 16, fontWeight: 600 }}><ContactName c={c} data={data} /></span>
                        <span style={{ display: 'block', fontSize: 12.5, color: IOS.gray, marginTop: 1 }}>{c.short}</span>
                      </span>
                    </button>
                    {c.phone && <>
                      <a href={`sms:${c.phone}`} aria-label={`${c.rel}에게 문자`} style={{ width: 36, height: 36, borderRadius: '50%', background: IOS.group, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="message" color={IOS.blue} size={17} stroke={1.8} /></a>
                      <a href={`tel:${c.phone}`} aria-label={`${c.rel}에게 전화`} style={{ width: 36, height: 36, borderRadius: '50%', background: IOS.group, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="call" color={IOS.blue} size={17} stroke={1.8} /></a>
                    </>}
                  </div>
                  {open && (
                    // 펼친 번호 — 누르면 전화
                    <div style={{ padding: '0 0 12px 52px' }}>
                      <div style={{ fontSize: 12, color: IOS.gray }}>휴대전화</div>
                      <a href={`tel:${c.phone}`} style={{ fontSize: 16, color: IOS.blue, textDecoration: 'none', fontVariantNumeric: 'tabular-nums' }}>{c.phone}</a>
                    </div>
                  )}
                  </div>
                  )
                })}
              </div>
            </>
          )
        })()}
      </>
    ))
  }

  /* 사진 — 사진첩 */
  if (app === 'album') {
    const imgs = folderImages(data, folder)
    return shell('#FFFFFF', (
      <>
        {nav('', IOS.blue, '#FFFFFF')}
        <div style={{ padding: '0 16px 10px' }}>
          {eyebrow(screenText(data, 'album', 'eyebrow', 'GALLERY'))}<div style={{ fontSize: 31, fontWeight: 700, letterSpacing: '-0.035em' }}>{screenText(data, 'album', 'title', '보관함')}</div>
          <div style={{ fontSize: 14, color: IOS.gray, marginTop: 2 }}>{wp.d ? `${wp.year}년 ${wp.month}월 ${wp.day}일` : ''}</div>
          <div style={{ marginTop: 10 }}><FolderTabs data={data} cur={folder} onPick={setFolder} /></div>
        </div>
        {folderSections(data, folder).map((f, si, all) => (
          <div key={si}>
            {all.length > 1 && <div style={{ padding: '0 16px' }}><FolderHead name={f.name} count={f.images.length} i={si} /></div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2 }}>
              {f.images.map((src, i) => <button key={i} type="button" onClick={() => setZoom(src)} aria-label={`사진 ${i + 1}`} style={{ aspectRatio: '1', border: 0, padding: 0, cursor: 'pointer', background: '#EEE' }}><Photo src={src} /></button>)}
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', fontSize: 13, color: IOS.gray, fontWeight: 600, padding: '14px 0 14px' }}>사진 {imgs.length}장</div>
        <div style={{ padding: '0 16px 120px' }}><NextFolder data={data} cur={folder} onPick={setFolder} /></div>
      </>
    ), (
      <div style={{ position: 'absolute', left: '50%', bottom: 30, transform: 'translateX(-50%)', display: 'flex', gap: 2, padding: 3, borderRadius: 999, background: 'rgba(235,235,240,0.92)', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', fontSize: 13, fontWeight: 600 }}>
        {['연', '월', '일', '모든 사진'].map((l, i) => <span key={l} style={{ whiteSpace: 'nowrap', padding: '7px 13px', borderRadius: 999, background: i === 3 ? '#FFFFFF' : 'transparent', color: i === 3 ? '#111111' : '#6C6C70' }}>{l}</span>)}
      </div>
    ))
  }

  return <InviteApp app={app} data={data} onBack={onBack} onNavigate={onNavigate} renderRsvp={renderRsvp} />
}

/* ───────── 예식 안내 — 디자인 3가지 (지도 · 탑승권 · 위젯 모음) ───────── */
interface MemoProps { data: PhoneData; onBack?: () => void; onNavigate?: (a: PhoneAppId) => void }

function useMemoInfo(data: PhoneData) {
  const wp = weddingParts(data)
  const v = data.wedding.venue
  return {
    wp, v,
    q: encodeURIComponent(v.name || v.address || ''),
    names: `${data.groom.name || '신랑'} · ${data.bride.name || '신부'}`,
    dateFull: wp.d ? `${wp.year}년 ${wp.month}월 ${wp.day}일 ${wp.dayKo}요일` : '예식일',
    dday: ddayText(ddayCount(data.wedding.date)),
    notes: data.phone.memo.filter(Boolean),
    // 안내 사항 제목 (notes 와 같은 순서)
    noteTitles: data.phone.memo.map((m, i) => (m ? (data.phone.memoTitles?.[i] || '').trim() : null)).filter((x): x is string => x !== null),
  }
}
// 예식 안내 화면들 — 스크롤 영역 바깥에 두어 고정 (top 52 · left 12 · 40px)
const backCircle = (onBack?: () => void, dark?: boolean) => <BackCircle onClick={onBack} dark={dark} />


/** 지도처럼 그린 바탕 (실제 지도 아님) — 지도 · 지도 탑승권이 함께 쓴다 */
/** 하트 핀 + 예식장 이름 (지도 위에 얹음) */
function MapPin({ label, top }: { label: string; top: number }) {
  return (
    <div style={{ position: 'absolute', left: '50%', top, transform: 'translate(-50%, -100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, pointerEvents: 'none' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: IOS.red, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ transform: 'rotate(45deg)', display: 'flex' }}><PhoneIcon name="heart" color="#FFFFFF" size={18} /></span>
      </span>
      <span style={{ marginTop: 8, padding: '3px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.94)', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

/**
 * 실제 지도 — 카카오맵(주소 → 좌표) 또는 구글 지도(키 없는 임베드).
 * 예식장이 pinTop 높이에 오도록 지도 높이를 pinTop × 2 로 두고 가운데에 맞춘다.
 * 스크롤을 가로채지 않게 움직이지 않는 지도로 두고, 길찾기는 아래 버튼으로.
 */
function VenueMap({ data, height, pinTop }: { data: PhoneData; height: number | string; pinTop: number }) {
  const v = data.wedding.venue
  const provider = data.phone.mapProvider || 'kakao'
  const label = v.name || '예식장'
  const ref = useRef<HTMLDivElement>(null)
  const query = (v.address || v.name || '').trim()
  const [res, setRes] = useState<{ q: string; s: 'ok' | 'fail' } | null>(null)
  const state: 'loading' | 'ok' | 'fail' = res && res.q === query ? res.s : 'loading'
  const setState = (st: 'ok' | 'fail') => setRes({ q: query, s: st })
  useEffect(() => {
    if (provider !== 'kakao' || !query) return
    let cancelled = false
    if (ref.current) ref.current.innerHTML = ''
    // 지도 스크립트가 막히거나 늦으면 그림 지도로
    const giveUp = setTimeout(() => { if (!cancelled && !ref.current?.childElementCount) setState('fail') }, 8000)
    loadKakaoMapSDK().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kakao = (window as any).kakao
      if (cancelled || !ref.current || !kakao?.maps?.services) { if (!cancelled) setState('fail'); return }
      const draw = (lat: string, lng: string) => {
        if (cancelled || !ref.current) return
        const pos = new kakao.maps.LatLng(parseFloat(lat), parseFloat(lng))
        const map = new kakao.maps.Map(ref.current, { center: pos, level: 3, draggable: false, scrollwheel: false, disableDoubleClickZoom: true, keyboardShortcuts: false })
        map.setZoomable(false)
        setState('ok')
      }
      new kakao.maps.services.Geocoder().addressSearch(v.address || '', (r: { x: string; y: string }[], st: string) => {
        if (st === kakao.maps.services.Status.OK && r[0]) return draw(r[0].y, r[0].x)
        new kakao.maps.services.Places().keywordSearch([v.name, v.address].filter(Boolean).join(' '), (p: { x: string; y: string }[], ps: string) => {
          if (ps === kakao.maps.services.Status.OK && p[0]) draw(p[0].y, p[0].x)
          else if (!cancelled) setState('fail')
        })
      })
    }).catch(() => { if (!cancelled) setState('fail') })
    return () => { cancelled = true; clearTimeout(giveUp) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, query, v.address, v.name])

  const box: CSSProperties = { position: 'absolute', left: 0, right: 0, top: 0, height, overflow: 'hidden' }
  if (provider === 'google' && query) return (
    <div style={{ ...box, background: '#E9EEE4' }}>
      <iframe title={label} src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=ko&z=16&output=embed`}
        style={{ position: 'absolute', left: 0, top: -60, width: '100%', height: pinTop * 2 + 120, border: 0, pointerEvents: 'none', filter: 'saturate(0.85)' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      {/* 구글 지도는 자체 빨간 핀을 쓴다 — 위쪽 '지도에서 열기' 상자는 잘라 낸다 */}
    </div>
  )
  if (provider === 'kakao' && query && state !== 'fail') return (
    <div style={{ ...box, background: '#E9EEE4' }}>
      <div ref={ref} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: pinTop * 2, filter: 'saturate(0.8) brightness(1.02)', pointerEvents: 'none' }} />
      <MapPin label={label} top={pinTop} />
    </div>
  )
  return <MapArt label={label} height={height} pinTop={pinTop} />
}

function MapArt({ label, height, pinTop = 232 }: { label: string; height: number | string; pinTop?: number }) {
  const road = (style: CSSProperties) => <span style={{ position: 'absolute', background: '#FFFFFF', boxShadow: '0 0 0 1px rgba(0,0,0,0.03)', ...style }} />
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height, overflow: 'hidden', background: '#E9EEE4' }}>
      <span style={{ position: 'absolute', left: -40, top: 40, width: 220, height: 160, borderRadius: '50%', background: '#D5E5CC' }} />
      <span style={{ position: 'absolute', right: -60, top: 210, width: 260, height: 120, borderRadius: '50%', background: '#CFE1EF', transform: 'rotate(-12deg)' }} />
      {road({ left: 0, right: 0, top: 160, height: 14, transform: 'rotate(-8deg)' })}
      {road({ left: 0, right: 0, top: 300, height: 9 })}
      {road({ left: 120, top: 0, bottom: 0, width: 10 })}
      {road({ left: 270, top: 0, bottom: 0, width: 7, transform: 'rotate(6deg)' })}
      {road({ left: 0, right: 0, top: 84, height: 6 })}
      <div style={{ position: 'absolute', left: '50%', top: pinTop, transform: 'translate(-50%, -100%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ width: 44, height: 44, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: IOS.red, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ transform: 'rotate(45deg)', display: 'flex' }}><PhoneIcon name="heart" color="#FFFFFF" size={18} /></span>
        </span>
        <span style={{ marginTop: 8, padding: '3px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.92)', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    </div>
  )
}

/** 1. 지도 — 지도 위 핀 + 아래에서 올라온 장소 카드 */
function MemoMap({ data, onBack, onNavigate }: MemoProps) {
  const { wp, v, q, dateFull, dday, notes, noteTitles } = useMemoInfo(data)
  const { copied, copy } = useCopy()
  const act = (icon: string, label: string, primary: boolean, props: { href?: string; onClick?: () => void }) => {
    const css: CSSProperties = { font: 'inherit', flex: 1, height: 56, borderRadius: 14, border: 0, background: primary ? IOS.blue : '#EFEFF4', color: primary ? '#FFFFFF' : IOS.blue, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 12.5, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }
    const inner = <><PhoneIcon name={icon} color={primary ? '#FFFFFF' : IOS.blue} size={20} stroke={1.9} />{label}</>
    return props.href ? <a href={props.href} target="_blank" rel="noreferrer" style={css}>{inner}</a> : <button type="button" onClick={props.onClick} style={css}>{inner}</button>
  }
  const row = (icon: string, title: ReactNode, sub?: ReactNode, right?: ReactNode, last?: boolean, k?: number) => (
    <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: last ? undefined : `0.5px solid ${IOS.line}` }}>
      <PhoneIcon name={icon} color={IOS.gray} size={20} stroke={1.8} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15.5, fontWeight: 500, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{title}</span>
        {sub && <span style={{ display: 'block', fontSize: 13, color: IOS.gray, marginTop: 1 }}>{sub}</span>}
      </span>
      {right}
    </div>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', overflow: 'hidden', background: '#E9EEE4' }}>
      <VenueMap data={data} height="62%" pinTop={232} />
      {backCircle(onBack)}
      {/* 장소 카드 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: '40%', bottom: 0, background: '#FFFFFF', borderRadius: '22px 22px 0 0', boxShadow: '0 -6px 24px rgba(0,0,0,0.12)', overflowY: 'auto' }}>
        <div style={{ width: 38, height: 5, borderRadius: 3, background: '#D1D1D6', margin: '8px auto 0' }} />
        <div style={{ padding: '12px 18px 40px' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{v.name || '예식장'}</div>
          <div style={{ fontSize: 14, color: IOS.gray, marginTop: 2 }}>웨딩홀{v.hall ? ` · ${v.hall}` : ''}</div>
          {/* 인사말 — 모든 디자인에서 보이게 */}
          {data.phone.greeting && <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.65, color: '#3A3A3C', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.greeting}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {act('map', '네이버 길찾기', true, { href: q ? `https://map.naver.com/p/search/${q}` : undefined })}
            {act('map', '카카오맵', false, { href: q ? `https://map.kakao.com/link/search/${q}` : undefined })}
            {act('copy', copied === 'addr' ? '복사됨' : '주소 복사', false, { onClick: () => copy('addr', v.address) })}
          </div>
          <div style={{ marginTop: 16, background: '#F7F7FA', borderRadius: 14, padding: '2px 14px' }}>
            {row('calendar', dateFull, wp.timeShort || wp.timeKo, <span style={{ fontSize: 12, fontWeight: 700, color: data.phone.accent }}>{dday}</span>)}
            {row('map', v.address || '주소', v.hall, undefined, !notes.length)}
            {notes.map((m, i) => (noteTitles[i] ? row('memo', noteTitles[i], m, undefined, i === notes.length - 1, i) : row('memo', m, undefined, undefined, i === notes.length - 1, i)))}
          </div>
          {(data.phone.directions || []).some(x => x.text.trim()) && (
            <div style={{ marginTop: 12, background: '#F7F7FA', borderRadius: 14, padding: '2px 14px' }}>
              <Directions data={data} ink="#111111" sub="#6C6C70" line={IOS.line} icon={IOS.gray} />
            </div>
          )}
          {!isAppOff(data, 'rsvp') && <button type="button" onClick={() => onNavigate?.('rsvp')} style={{ font: 'inherit', marginTop: 14, width: '100%', height: 50, borderRadius: 14, border: 0, background: '#111111', color: '#FFFFFF', fontSize: 15.5, fontWeight: 700, cursor: 'pointer' }}>참석 여부 알려 주기</button>}
        </div>
      </div>
    </div>
  )
}

/** 2. 탑승권 — 지갑 속 웨딩 패스 (withMap: 지도 위에 패스를 올린 '지도 탑승권') */
function MemoPass({ data, onBack, onNavigate, withMap }: MemoProps & { withMap?: boolean }) {
  const { wp, v, q, dday, notes, noteTitles } = useMemoInfo(data)
  const { copied, copy } = useCopy()
  const accent = data.phone.accent
  const tn = titleNames(data)
  const field = (label: string, value: ReactNode, align: 'left' | 'right' = 'left') => (
    <div style={{ textAlign: align }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', overflow: 'hidden', backgroundColor: '#F4F4F5', backgroundImage: undefined }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        {withMap && <VenueMap data={data} height={340} pinTop={150} />}
        <div style={{ position: 'relative', padding: withMap ? '200px 20px 50px' : '104px 20px 50px' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.16)' }}>
            <div style={{ background: accent, color: '#FFFFFF', padding: '18px 20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em' }}>WEDDING PASS</span>
                <PhoneIcon name="heart" color="#FFFFFF" size={18} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', opacity: 0.7 }}>GROOM</div>
                  <div style={{ ...displayCss(data, tn.a, 24), marginTop: 3 }}>{tn.a}</div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, margin: '14px 12px 0' }}>
                  <span style={{ flex: 1, borderTop: '1.5px dashed rgba(255,255,255,0.6)' }} />
                  <PhoneIcon name="heart" color="#FFFFFF" size={14} />
                  <span style={{ flex: 1, borderTop: '1.5px dashed rgba(255,255,255,0.6)' }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', opacity: 0.7 }}>BRIDE</div>
                  <div style={{ ...displayCss(data, tn.b, 24), marginTop: 3 }}>{tn.b}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 16, columnGap: 12, marginTop: 24 }}>
                {field('DATE', wp.d ? `${wp.month}.${wp.day} ${wp.dayShort.toUpperCase()}` : '—')}
                {field('TIME', wp.clock || '—', 'right')}
                {field('HALL', v.hall || '—')}
                {field('BOARDING', dday, 'right')}
              </div>
            </div>
            {/* 절취선 */}
            <div style={{ position: 'relative', height: 0, borderTop: '2px dashed #D9D9DE', background: '#FFFFFF' }}>
              <span style={{ position: 'absolute', left: -12, top: -12, width: 22, height: 22, borderRadius: '50%', background: '#F4F4F5' }} />
              <span style={{ position: 'absolute', right: -12, top: -12, width: 22, height: 22, borderRadius: '50%', background: '#F4F4F5' }} />
            </div>
            <div style={{ background: '#FFFFFF', padding: '18px 20px 20px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', color: IOS.gray }}>VENUE</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>{v.name || '예식장'}</div>
              {v.address && <div style={{ fontSize: 13, color: IOS.gray, marginTop: 2 }}>{v.address}</div>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 18 }}>
            {q && <a href={`https://map.naver.com/p/search/${q}`} target="_blank" rel="noreferrer" style={{ height: 44, borderRadius: 12, background: '#FFFFFF', color: '#111111', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>네이버 지도</a>}
            {q && <a href={`https://map.kakao.com/link/search/${q}`} target="_blank" rel="noreferrer" style={{ height: 44, borderRadius: 12, background: '#FFFFFF', color: '#111111', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>카카오맵</a>}
            {v.address && <button type="button" onClick={() => copy('addr', v.address)} style={{ font: 'inherit', height: 44, borderRadius: 12, border: 0, background: '#FFFFFF', color: '#111111', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>{copied === 'addr' ? '복사됨' : '주소 복사'}</button>}
          </div>
          {data.phone.greeting && <div style={{ marginTop: 14, background: '#FFFFFF', borderRadius: 14, padding: '14px 16px', fontSize: 14, lineHeight: 1.65, color: '#3A3A3C', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.greeting}</div>}
          {(data.phone.directions || []).some(x => x.text.trim()) && (
            <div style={{ marginTop: 14, background: '#FFFFFF', borderRadius: 14, padding: '2px 16px' }}>
              <Directions data={data} ink="#111111" sub="#6C6C70" line={IOS.line} icon={IOS.gray} />
            </div>
          )}
          {notes.length > 0 && (
            <div style={{ marginTop: 14, background: '#FFFFFF', borderRadius: 14, padding: '6px 16px' }}>
              {notes.map((m, i) => <div key={i} style={{ fontSize: 14, lineHeight: 1.55, padding: '9px 0', borderBottom: i < notes.length - 1 ? `0.5px solid ${IOS.line}` : undefined, wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{noteTitles[i] && <b style={{ display: 'block', fontWeight: 700, marginBottom: 1 }}>{noteTitles[i]}</b>}{m}</div>)}
            </div>
          )}
          {!isAppOff(data, 'rsvp') && <button type="button" onClick={() => onNavigate?.('rsvp')} style={{ font: 'inherit', marginTop: 14, width: '100%', height: 50, borderRadius: 14, border: 0, background: '#111111', color: '#FFFFFF', fontSize: 15.5, fontWeight: 700, cursor: 'pointer' }}>참석 여부 알려 주기</button>}
        </div>
      </div>
      {backCircle(onBack)}
    </div>
  )
}

/** 3. 위젯 모음 — 정보 하나가 타일 하나 */
function MemoTiles({ data, onBack, onNavigate }: MemoProps) {
  const { wp, v, q, dday, notes, noteTitles } = useMemoInfo(data)
  const { copied, copy } = useCopy()
  const accent = data.phone.accent
  const tile: CSSProperties = { background: '#FFFFFF', borderRadius: 22, boxShadow: SOFT, padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }
  const cap = (s: string, c: string = IOS.gray) => <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', color: c }}>{s}</span>
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', overflow: 'hidden', backgroundColor: IOS.group, backgroundImage: TINT }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <div style={{ padding: '114px 16px 50px' }}>
          <div style={{ paddingLeft: 2, marginBottom: 14 }}>{eyebrow(screenText(data, 'memo', 'eyebrow', 'THE WEDDING'))}<div style={{ fontSize: 31, fontWeight: 700, letterSpacing: '-0.035em' }}>{screenText(data, 'memo', 'title', '예식 안내')}</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 'minmax(104px, auto)', gap: 12 }}>
            {data.phone.greeting && <div style={{ ...tile, gridColumn: 'span 2', fontSize: 14, lineHeight: 1.65, color: '#3A3A3C', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.greeting}</div>}
            <div style={{ ...tile, gridRow: 'span 2', justifyContent: 'space-between' }}>
              {cap(wp.dayEn || 'DATE', accent)}
              <span style={{ ...numCss(data, 64) }}>{wp.day ?? '—'}</span>
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{wp.d ? `${wp.year}년 ${wp.month}월` : ''}</span>
                <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 9px', borderRadius: 999, background: accent, color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>{dday}</span>
              </span>
            </div>
            <div style={{ ...tile, justifyContent: 'space-between' }}>
              {cap('TIME')}
              <span style={{ ...numCss(data, 26) }}>{wp.clock || '—'}</span>
              <span style={{ fontSize: 12.5, color: IOS.gray }}>{wp.timeKo}</span>
            </div>
            <div style={{ ...tile, justifyContent: 'space-between' }}>
              {cap('HALL')}
              <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, wordBreak: 'keep-all' }}>{v.hall || '—'}</span>
            </div>
            <div style={{ ...tile, gridColumn: 'span 2', gridRow: 'span 2', padding: 0 }}>
              <div style={{ height: 110, position: 'relative', background: '#E9EEE4', backgroundImage: 'linear-gradient(0deg, transparent 46%, #FFFFFF 46%, #FFFFFF 52%, transparent 52%), linear-gradient(90deg, transparent 34%, #FFFFFF 34%, #FFFFFF 37%, transparent 37%)' }}>
                <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -70%)', width: 30, height: 30, borderRadius: '50%', background: IOS.red, border: '3px solid #FFFFFF', boxShadow: '0 3px 8px rgba(0,0,0,0.25)' }} />
              </div>
              <div style={{ padding: '10px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{v.name || '예식장'}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: IOS.gray, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.address}</span>
                </span>
                {q && <a href={`https://map.naver.com/p/search/${q}`} target="_blank" rel="noreferrer" style={{ height: 34, padding: '0 12px', borderRadius: 999, background: accent, color: '#FFFFFF', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>길찾기</a>}
                {v.address && <button type="button" onClick={() => copy('addr', v.address)} style={{ font: 'inherit', height: 34, padding: '0 12px', borderRadius: 999, border: 0, background: '#EFEFF4', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{copied === 'addr' ? '복사됨' : '복사'}</button>}
              </div>
            </div>
            {(data.phone.directions || []).some(x => x.text.trim()) && (
              <div style={{ ...tile, gridColumn: 'span 2', padding: '2px 16px' }}>
                <Directions data={data} ink="#111111" sub="#6C6C70" line={IOS.line} icon={accent} />
              </div>
            )}
            {notes.map((m, i) => (
              <div key={i} style={{ ...tile, gridColumn: notes.length % 2 === 1 && i === notes.length - 1 ? 'span 2' : undefined, justifyContent: 'space-between' }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: `${accent}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="memo" color={accent} size={17} stroke={1.9} /></span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {noteTitles[i] && <span style={{ fontSize: 13.5, fontWeight: 800, wordBreak: 'keep-all' }}>{noteTitles[i]}</span>}
                  <span style={{ fontSize: 13.5, lineHeight: 1.4, fontWeight: noteTitles[i] ? 500 : 600, wordBreak: 'keep-all', whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: noteTitles[i] ? 3 : 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m}</span>
                </span>
              </div>
            ))}
            {!isAppOff(data, 'rsvp') && (
            <button type="button" onClick={() => onNavigate?.('rsvp')} style={{ ...tile, gridColumn: 'span 2', border: 0, background: '#111111', color: '#FFFFFF', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}>
              {cap('RSVP', 'rgba(255,255,255,0.6)')}
              <span style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', fontSize: 18, fontWeight: 800 }}>참석 여부 알려 주기<PhoneIcon name="chevron" color="#FFFFFF" size={20} stroke={2.2} /></span>
            </button>
            )}
          </div>
        </div>
      </div>
      {backCircle(onBack)}
    </div>
  )
}

/* ───────── 우리 이야기 — 앱 모양 2가지 (플레이리스트 · 피드) ───────── */
const storyTitleOf = (data: PhoneData) => (data.phone.storyTitle || '').trim() || 'Our Story'

/** 음악 앱 플레이리스트 — 장 하나가 한 곡, 누르면 가사처럼 글이 펼쳐진다 */
function StoryPlaylist({ data, onBack, onNavigate }: AppProps) {
  const chs = chaptersOf(data)
  const nm = { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') }
  const cover = coverOf(data)
  const accent = data.phone.accent
  const [open, setOpen] = useState(0)
  const cur = chs[open] || chs[0]
  // 재생 — 이야기를 가사처럼 한 줄씩 밝히며 다음 곡으로 넘어감 (배경음악도 함께)
  const music = useContext(MusicCtx)
  const [auto, setAuto] = useState(false)
  const [line, setLine] = useState(0)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => {
    if (!auto) return
    const n = Math.max(1, chs[open]?.lines.length || 0)
    const id = setTimeout(() => {
      if (line < n - 1) { setLine(line + 1); return }
      if (open < chs.length - 1) { setOpen(open + 1); setLine(0); rowRefs.current[open + 1]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) } else setAuto(false)
    }, line === 0 ? 2600 : 2200)
    return () => clearTimeout(id)
  }, [auto, open, line, chs])
  const togglePlay = (from?: number) => {
    if (auto && from === undefined) { setAuto(false); if (music?.playing) music.toggle(); return }
    setOpen(from ?? open); setLine(0); setAuto(true)
    if (music?.has && !music.playing) music.toggle()
  }
  const progress = chs.length ? (open + (line + 1) / Math.max(1, chs[open]?.lines.length || 1)) / chs.length : 0
  // 곡 아래 작은 글씨 — 날짜 (첫 줄은 펼치면 바로 보여서 겹침)
  const dateOf = (c: Chapter) => { const d = c.date && parseWeddingDate(c.date); return d ? `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일` : '' }
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <div style={{ position: 'relative', padding: '96px 22px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', background: `linear-gradient(180deg, ${accent}33, #FFFFFF 70%)` }}>
          <div style={{ width: 228, height: 228, borderRadius: 14, overflow: 'hidden', boxShadow: auto ? '0 22px 48px rgba(0,0,0,0.28)' : '0 12px 30px rgba(0,0,0,0.18)', background: accent, position: 'relative', transform: auto ? 'scale(1)' : 'scale(0.9)', transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.5s' }}>
            {/* 펼친 이야기의 사진으로 바뀜 — 사진 없는 이야기는 대표 사진 */}
            <style>{'@keyframes pfFadeIn { from { opacity: 0; } to { opacity: 1; } }'}</style>
            {(cur?.src || cover) && <div key={cur?.src ? open : 'cover'} style={{ position: 'absolute', inset: 0, animation: 'pfFadeIn 0.45s ease' }}><Photo src={cur?.src || cover} crop={cur?.src ? cur.crop : data.phone.wallpaper ? data.phone.wallpaperCrop : undefined} /></div>}
          </div>
          <div style={{ ...displayCss(data, storyTitleOf(data), 23), marginTop: 20, textAlign: 'center' }}>{storyTitleOf(data)}</div>
          <div style={{ fontSize: 16, color: accent, fontWeight: 600, marginTop: 4 }}>{nm.a} &amp; {nm.b}</div>
          <div style={{ fontSize: 12.5, color: IOS.gray, marginTop: 4 }}>{chs.length}곡{data.wedding.date ? ` · ${data.wedding.date.slice(0, 4)}` : ''}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginTop: 18 }}>
            <button type="button" onClick={() => (auto ? togglePlay() : togglePlay(0))} style={{ font: 'inherit', height: 46, borderRadius: 12, border: 0, background: auto ? accent : '#F4F4F5', color: auto ? '#FFFFFF' : accent, fontSize: 15.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.25s, color 0.25s' }}>
              {auto
                ? <><svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#FFFFFF" /></svg>일시정지</>
                : <><PhoneIcon name="play" color={accent} size={14} />재생</>}
            </button>
            {cheerTo(data) && <button type="button" onClick={() => onNavigate?.(cheerTo(data)!)} style={{ font: 'inherit', height: 46, borderRadius: 12, border: 0, background: '#F4F4F5', color: accent, fontSize: 15.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}><PhoneIcon name="heart" color={accent} size={15} />축하하기</button>}
          </div>
        </div>
        <div style={{ padding: '14px 0 150px' }}>
          {chs.map((c, i) => (
            <div key={i} ref={el => { rowRefs.current[i] = el }}>
              <button type="button" onClick={() => { setOpen(i); setLine(0); if (auto) togglePlay(i) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '11px 22px', border: 0, background: open === i ? '#F7F7FA' : 'transparent', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
                <span style={{ width: 20, fontSize: 15, color: open === i ? accent : IOS.gray, fontWeight: 600, fontVariantNumeric: 'tabular-nums', display: 'flex', justifyContent: 'center' }}>{open === i ? (auto ? <span aria-hidden style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>{[0, 1, 2].map(k => <span key={k} style={{ width: 3, height: '100%', borderRadius: 2, background: accent, transformOrigin: 'bottom', animation: `pfEq 0.9s ease-in-out ${k * 0.15}s infinite alternate` }} />)}</span> : <PhoneIcon name="music" color={accent} size={16} stroke={2} />) : i + 1}</span>
                <span style={{ flex: 1, minWidth: 0, borderBottom: `0.5px solid ${IOS.line}`, paddingBottom: 11, marginBottom: -11 }}>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 600, color: open === i ? accent : '#111111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title || `${i + 1}번째 이야기`}</span>
                  {dateOf(c) && <span style={{ display: 'block', fontSize: 13, color: IOS.gray, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{dateOf(c)}</span>}
                </span>
              </button>
              {open === i && c.lines.length > 0 && (
                <div style={{ padding: '14px 22px 18px 56px', background: '#F7F7FA' }}>
                  {c.lines.map((l, j) => (
                    // 멈춤: 편하게 읽는 본문 / 재생: 가사처럼 지금 줄만 진하게 (글자 굵기는 그대로 — 줄바꿈이 흔들리지 않게)
                    <p key={j} style={{ fontSize: 15.5, fontWeight: auto ? 600 : 500, lineHeight: 1.65, letterSpacing: '-0.01em', color: auto ? (j <= line ? '#111111' : '#C4C4CA') : l.side === 'p' ? '#2A2A2A' : '#4A4A4F', margin: j ? '12px 0 0' : 0, whiteSpace: 'pre-line', wordBreak: 'keep-all', transition: 'color 0.6s ease' }}>
                      {l.side === 'p' ? l.text : <>“{l.text}”<span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: IOS.gray, marginTop: 2 }}>— {l.side === 'a' ? nm.a : nm.b}</span></>}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* 재생바 뒤로 목록이 자연스럽게 사라지게 */}
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 130, background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.92) 55%, #FFFFFF)', pointerEvents: 'none' }} />
      {/* 지금 재생 중 */}
      <style>{'@keyframes pfEq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }'}</style>
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 26, height: 62, borderRadius: 16, background: 'rgba(245,245,247,0.96)', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px 0 8px', overflow: 'hidden' }}>
        <span aria-hidden style={{ position: 'absolute', left: 0, bottom: 0, height: 2.5, width: `${(auto || open > 0 ? progress : 0) * 100}%`, background: accent, transition: 'width 0.6s ease' }} />
        <span style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: accent }}>{(cur?.src || cover) && <Photo src={cur?.src || cover} crop={cur?.src ? cur.crop : undefined} />}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur?.title || storyTitleOf(data)}</span>
          <span style={{ display: 'block', fontSize: 12.5, color: IOS.gray }}>{nm.a} &amp; {nm.b}</span>
        </span>
        <button type="button" onClick={() => togglePlay()} aria-label={auto ? '일시정지' : '재생'} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 6, display: 'flex' }}>
          {auto ? <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#111111" /></svg> : <PhoneIcon name="play" color="#111111" size={24} />}
        </button>
        <button type="button" onClick={() => { const n = Math.min(chs.length - 1, open + 1); setOpen(n); setLine(0); rowRefs.current[n]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }} aria-label="다음 이야기" style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 6, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6l8 6-8 6zM12 6l8 6-8 6z" fill="#111111" /></svg>
        </button>
      </div>
      <BackCircle onClick={onBack} />
    </div>
  )
}

/* ───────── 영상 — 유튜브 앱처럼 (위에 재생, 아래 다른 영상 목록) ───────── */
function VideoApp({ data, onBack, onNavigate }: AppProps) {
  // 영상은 최대 3개
  const vids = (data.phone.videos || []).slice(0, 3).map((v, i) => ({ id: youtubeId(v.url), title: v.title?.trim() || `우리 영상 ${i + 1}`, i })).filter((v): v is { id: string; title: string; i: number } => !!v.id)
  const [cur, setCur] = useState(0)
  const [liked, setLiked] = useState(false)
  const music = useContext(MusicCtx)
  const v = vids[Math.min(cur, Math.max(0, vids.length - 1))]
  const nm = { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') }
  const accent = data.phone.accent
  const cover = coverOf(data)
  const title = screenText(data, 'video', 'title', '우리 영상')
  const wp = weddingParts(data)
  const red = '#FF0033'
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title: v?.title || title, url: window.location.href }) } catch { /* 취소 */ }
  }
  const cheer = cheerTo(data)
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#0F0F0F', background: '#FFFFFF', overflow: 'hidden' }}>
      {/* 위 막대 — 로고처럼 */}
      {/* 줄 높이 52~92 — 왼쪽 위 뒤로(아래 고정 버튼) · 오른쪽 위 음악 버튼과 같은 줄. 뒤로 자리는 빈 칸 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 98, boxSizing: 'border-box', padding: '52px 14px 0 12px', background: '#FFFFFF', zIndex: 3 }}>
        <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden style={{ width: 40, height: 40, flexShrink: 0 }} />
          <span style={{ width: 30, height: 21, borderRadius: 6, background: red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden><path d="M0 0l10 5.5L0 11z" fill="#FFFFFF" /></svg>
          </span>
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.04em' }}>{title}</span>
        </div>
      </div>
      <BackCircle onClick={onBack} ink="#0F0F0F" />
      <div style={{ position: 'absolute', top: 98, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}>
        {!v ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#606060', fontSize: 14.5 }}>아직 올린 영상이 없어요</div>
        ) : (
          <>
            {/* 재생 — 누르면 유튜브 재생 (배경음악은 잠시 멈춤) */}
            <div key={v.id} style={{ background: '#000' }}>
              <YouTubeLite videoId={v.id} onPlay={() => { if (music?.playing) music.toggle() }} />
            </div>
            <div style={{ padding: '12px 14px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.02em', wordBreak: 'keep-all' }}>{v.title}</div>
              <div style={{ fontSize: 12.5, color: '#606060', marginTop: 4 }}>{nm.a} · {nm.b}{wp.d ? ` · ${wp.year}. ${wp.month}. ${wp.day}` : ''}</div>
            </div>
            {/* 채널 줄 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 0' }}>
              <span style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: accent }}>{cover && <Photo src={cover} />}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{nm.a} ♥ {nm.b}</span>
                <span style={{ display: 'block', fontSize: 12, color: '#606060' }}>영상 {vids.length}개</span>
              </span>
              {cheer && <button type="button" onClick={() => onNavigate?.(cheer)} style={{ border: 0, height: 36, padding: '0 16px', borderRadius: 999, background: '#0F0F0F', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>축하하기</button>}
            </div>
            {/* 좋아요 · 공유 */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 14px 0' }}>
              <button type="button" onClick={() => setLiked(l => !l)} style={{ border: 0, height: 34, padding: '0 14px', borderRadius: 999, background: '#F2F2F2', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#0F0F0F' }}>
                <PhoneIcon name="heart" color={liked ? red : '#0F0F0F'} size={16} stroke={2} />{liked ? '좋아요 했어요' : '좋아요'}
              </button>
              <button type="button" onClick={share} style={{ border: 0, height: 34, padding: '0 14px', borderRadius: 999, background: '#F2F2F2', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#0F0F0F' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path d="M14 5l7 7-7 7M21 12H9a6 6 0 0 0-6 6" fill="none" stroke="#0F0F0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>공유
              </button>
            </div>
            {/* 다른 영상 */}
            {vids.length > 1 && (
              <div style={{ padding: '22px 14px 60px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {vids.map((x, k) => (
                  <button key={x.i} type="button" onClick={() => setCur(k)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: 0, padding: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', opacity: k === cur ? 0.45 : 1 }}>
                    <span style={{ position: 'relative', width: 160, aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', background: '#E5E5E5', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://img.youtube.com/vi/${x.id}/hqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {k === cur && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 11.5, fontWeight: 700, background: 'rgba(0,0,0,0.45)' }}>재생 중</span>}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, lineHeight: 1.35, color: '#0F0F0F', wordBreak: 'keep-all' }}>{x.title}</span>
                      <span style={{ display: 'block', fontSize: 12, color: '#606060', marginTop: 3 }}>{nm.a} · {nm.b}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ───────── 카메라 — 하객 사진 공유로 바로 (청첩장 주소가 자동으로 연결됨) ───────── */
/** 하객 사진 공유 주소 — 하객 화면 · 에디터가 넣어 줌 (없으면 아직 안 켬) */
export const PhotoShareCtx = createContext<string | null>(null)
function CameraApp({ data, onBack }: AppProps) {
  const href = useContext(PhotoShareCtx)
  const cover = coverOf(data)
  const nm = { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') }
  const grid = 'linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px) 0 33.33% / 100% 33.33%, linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px) 33.33% 0 / 33.33% 100%'
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000000', color: '#FFFFFF', fontFamily: SYS, overflow: 'hidden' }}>
      {/* 위 — 닫기 · 안내 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 108, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14, boxSizing: 'border-box' }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.24em', color: '#FFD60A' }}>PHOTO BOX</span>
      </div>
      <BackCircle onClick={onBack} dark bg="rgba(255,255,255,0.14)" />
      {/* 뷰파인더 — 대표 사진 위에 격자 */}
      <div style={{ position: 'absolute', top: 108, left: 0, right: 0, height: 470, overflow: 'hidden', background: '#1C1C1E' }}>
        {cover && <Photo src={cover} />}
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: grid, pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '40px 20px 18px', background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.55))', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{nm.a} · {nm.b}에게 사진 보내기</span>
          <span style={{ display: 'block', fontSize: 12.5, opacity: 0.8, marginTop: 4 }}>{href ? '결혼식에서 찍은 사진과 영상을 보내 주세요' : '신랑·신부가 사진 공유를 켜면 여기서 보낼 수 있어요'}</span>
        </span>
      </div>
      {/* 아래 — 모드 글자 · 셔터 */}
      <div style={{ position: 'absolute', top: 596, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
        <span style={{ opacity: 0.5 }}>영상</span><span style={{ color: '#FFD60A' }}>사진</span><span style={{ opacity: 0.5 }}>보내기</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {href
          ? <a href={href} aria-label="사진 · 영상 보내러 가기" style={{ width: 78, height: 78, borderRadius: '50%', border: '4px solid #FFFFFF', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 62, height: 62, borderRadius: '50%', background: '#FFFFFF' }} /></a>
          : <span aria-hidden style={{ width: 78, height: 78, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.35)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} /></span>}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontSize: 12, opacity: 0.7 }}>{href ? '누르면 사진 공유 페이지로 가요' : '아직 열리지 않았어요'}</div>
    </div>
  )
}

/** SNS 피드 — 프로필 + 장마다 사진 게시물 한 개 */
function StoryFeed({ data, onBack, onNavigate }: AppProps) {
  const chs = chaptersOf(data)
  const nm = { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') }
  const cover = coverOf(data)
  const accent = data.phone.accent
  const [liked, setLiked] = useState<Record<number, boolean>>({})
  const [zoom, setZoom] = useState<string | null>(null)
  const handle = `${nm.a} ♥ ${nm.b}`
  const ava = (s: number) => (
    <span style={{ width: s, height: s, borderRadius: '50%', padding: 2, background: `linear-gradient(135deg, ${accent}, #E8B4A0)`, flexShrink: 0, display: 'flex' }}>
      <span style={{ flex: 1, borderRadius: '50%', overflow: 'hidden', border: '2px solid #FFFFFF', background: '#DDD' }}>{cover && <Photo src={cover} />}</span>
    </span>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', overflow: 'hidden', backgroundColor: '#FFFFFF', backgroundImage: TINT }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        {/* 위 막대 — 스크롤 영역의 첫 자식 sticky 라 내용을 내려도 고정. 뒤로는 막대 안 왼쪽 위(top 52 · left 12), 줄 안에는 같은 폭 빈 칸 */}
        <div style={{ position: 'sticky', top: 0, zIndex: 2, background: 'rgba(255,255,255,0.95)', padding: '52px 56px 8px 12px', display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, borderBottom: `0.5px solid ${IOS.line}` }}>
          <span aria-hidden style={{ width: 40, height: 40, flexShrink: 0 }} />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{storyTitleOf(data)}</span>
          <BackCircle onClick={onBack} />
        </div>
        {/* 프로필 */}
        <div style={{ padding: '16px 16px 14px', display: 'flex', alignItems: 'center', gap: 22 }}>
          {ava(84)}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
            {[[String(chs.length), '이야기'], [ddayText(ddayCount(data.wedding.date)), '결혼까지'], [String(data.gallery.images.length), '사진']].map(([n, l]) => (
              <span key={l}><span style={{ display: 'block', fontSize: 17, fontWeight: 800 }}>{n}</span><span style={{ fontSize: 12.5, color: '#3A3A3C' }}>{l}</span></span>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{handle}</div>
          {data.phone.greeting && <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 2, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{data.phone.greeting}</div>}
          {!isAppOff(data, 'rsvp') && <button type="button" onClick={() => onNavigate?.('rsvp')} style={{ font: 'inherit', marginTop: 12, width: '100%', height: 34, borderRadius: 8, border: 0, background: accent, color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>축하하러 가기</button>}
        </div>
        {/* 게시물 */}
        {chs.map((c, i) => (
          <div key={i} style={{ borderTop: `0.5px solid ${IOS.line}`, paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
              {ava(34)}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700 }}>{handle}</span>
                {c.title && <span style={{ display: 'block', fontSize: 11.5, color: '#3A3A3C' }}>{c.title}</span>}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1, color: '#3A3A3C' }}>···</span>
            </div>
            {c.src && <button type="button" onClick={() => setZoom(c.src!)} onDoubleClick={() => setLiked(v => ({ ...v, [i]: true }))} style={{ display: 'block', width: '100%', aspectRatio: '1', border: 0, padding: 0, cursor: 'pointer' }}><Photo src={c.src} crop={c.crop} /></button>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px 4px' }}>
              <button type="button" onClick={() => setLiked(v => ({ ...v, [i]: !v[i] }))} aria-label="좋아요" style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex' }}>
                {liked[i] ? <PhoneIcon name="heart" color="#FF3040" size={26} /> : <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="none" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" /></svg>}
              </button>
              {cheerTo(data) && <button type="button" onClick={() => onNavigate?.(cheerTo(data)!)} aria-label="축하 남기기" style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex' }}><PhoneIcon name="message" color="#111111" size={25} stroke={1.8} /></button>}
            </div>
            <div style={{ padding: '2px 14px 0', fontSize: 14, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>좋아요 {liked[i] ? '1' : '0'}개</span>
              {c.lines.map((l, j) => (
                <p key={j} style={{ margin: '4px 0 0', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
                  {j === 0 && <b style={{ marginRight: 6 }}>{handle}</b>}
                  {l.side === 'p' ? l.text : <>&ldquo;{l.text}&rdquo; <span style={{ color: IOS.gray }}>— {l.side === 'a' ? nm.a : nm.b}</span></>}
                </p>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: 60 }} />
      </div>
      {zoom && <ZoomOverlay src={zoom} imgs={data.gallery.images} onClose={() => setZoom(null)} />}
    </div>
  )
}

/* ───────── 연락하기 · 사진첩 · 참석 회신 — 앱 모양 더 ───────── */
// 뒤로 — 화면 위에 떠 있어서, 내용을 올려도 겹쳐 보이지 않게 반투명 동그라미 위에
// (스크롤 영역 바깥에 형제로 둘 것 — 같은 BackCircle)
const backBtn = (onBack?: () => void, color = '#111111', bg?: string) => <BackCircle onClick={onBack} ink={color} dark={color === '#FFFFFF'} bg={bg} />

/* ───────── 연락처 — 신랑 · 신부 + 가족 ───────── */
interface AvatarInfo { kind?: 'initial' | 'emoji' | 'photo'; emoji?: string; photo?: string; crop?: PhoneImageSettings; initial: string }
interface ContactRow { k: string; side: 'groom' | 'bride'; short: string; rel: string; name: string; phone?: string; deceased?: boolean; couple: boolean; av: AvatarInfo }
function contactsOf(data: PhoneData, side?: 'groom' | 'bride'): ContactRow[] {
  return (['groom', 'bride'] as const).filter(sd => !side || sd === side).flatMap(sd => {
    const p = data[sd]
    const role = sd === 'groom' ? '신랑' : '신부'
    const me: ContactRow = {
      k: sd, side: sd, short: role, rel: role, name: p.name, phone: p.phone, couple: true,
      av: { kind: p.avatarKind, emoji: p.avatarEmoji, photo: p.avatarPhoto, crop: p.avatarCrop, initial: (p.lastName || p.name || role).slice(0, 1) },
    }
    const fam = (p.family || []).filter(f => f.name.trim()).map((f, i): ContactRow => ({
      k: `${sd}-f${i}`, side: sd, short: f.relation || '가족', rel: `${role} ${f.relation || '가족'}`, name: f.name, phone: f.deceased ? undefined : f.phone, deceased: f.deceased, couple: false,
      av: { kind: f.avatarKind, emoji: f.avatarEmoji, photo: f.avatarPhoto, crop: f.avatarCrop, initial: f.name.slice(0, 1) },
    }))
    return [me, ...fam]
  })
}
/** 연락처 동그라미 — 사진 · 이모지 · 성 */
const AvatarZoomCtx = createContext<((src: string) => void) | null>(null)
function Avatar({ av, size, bg, color = '#FFFFFF', dim }: { av: AvatarInfo; size: number; bg: string; color?: string; dim?: boolean }) {
  const zoom = useContext(AvatarZoomCtx)
  const base: CSSProperties = { width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: dim ? 'grayscale(1)' : undefined, opacity: dim ? 0.75 : 1 }
  if (av.kind === 'photo' && av.photo) return (
    <span style={{ ...base, cursor: zoom ? 'zoom-in' : undefined }} onClick={zoom ? (e => { e.preventDefault(); e.stopPropagation(); zoom(av.photo!) }) : undefined}><Photo src={av.photo} crop={av.crop} /></span>
  )
  if (av.kind === 'emoji' && av.emoji) return <span style={{ ...base, background: 'transparent', fontSize: size * 0.7, lineHeight: 1 }}>{av.emoji}</span>
  return <span style={{ ...base, background: bg, color, fontSize: size * 0.4, fontWeight: 600 }}>{av.initial}</span>
}
/** 이름 + 고인 표시 (故 · 국화) */
function ContactName({ c, data }: { c: ContactRow; data: PhoneData }) {
  if (!c.deceased) return <>{c.name || c.short}</>
  return data.phone.deceasedStyle === 'flower'
    // eslint-disable-next-line @next/next/no-img-element
    ? <><img src="/icons/chrysanthemum.svg" alt="고인" style={{ display: 'inline-block', width: '1em', height: '1em', verticalAlign: '-0.12em', marginRight: 4 }} />{c.name}</>
    : <><span style={{ fontWeight: 400, marginRight: 3 }}>故</span>{c.name}</>
}

/** 전화 키패드 — 번호가 입력된 채로, 초록 통화 버튼 */
function CallKeypad({ data, onBack }: AppProps) {
  const [who, setWho] = useState<'groom' | 'bride'>('groom')
  const [pick, setPick] = useState(0)
  const list = contactsOf(data, who).filter(c => !c.deceased)
  const p = list[Math.min(pick, list.length - 1)]
  const keys: [string, string][] = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']]
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', backgroundColor: '#FFFFFF', backgroundImage: TINT, overflow: 'hidden' }}>
      {backBtn(onBack, IOS.blue)}
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 2, borderRadius: 9, background: '#E3E3E8', width: 180 }}>
          {(['groom', 'bride'] as const).map(s => <button key={s} type="button" onClick={() => { setWho(s); setPick(0) }} style={{ font: 'inherit', height: 28, borderRadius: 7, border: 0, background: who === s ? '#FFFFFF' : 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{s === 'groom' ? '신랑' : '신부'}</button>)}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 130, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums', minHeight: 42 }}>{p.phone || '—'}</div>
        <div style={{ fontSize: 15, color: IOS.blue, marginTop: 6 }}>{[p.rel, p.name].filter(Boolean).join(' ')}</div>
        {list.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            {list.map((c, i) => <button key={c.k} type="button" onClick={() => setPick(i)} style={{ font: 'inherit', height: 26, padding: '0 11px', borderRadius: 999, border: 0, background: p.k === c.k ? IOS.blue : '#EFEFF4', color: p.k === c.k ? '#FFFFFF' : '#111111', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>{c.short}</button>)}
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', top: list.length > 1 ? 262 : 240, left: 0, right: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 78px)', justifyContent: 'center', gap: list.length > 1 ? '12px 26px' : '16px 26px' }}>
        {keys.map(([n, l]) => (
          <span key={n} style={{ width: 78, height: 78, borderRadius: '50%', background: '#E5E5EA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 34, fontWeight: 400, lineHeight: 1 }}>{n}</span>
            {l && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', marginTop: 2 }}>{l}</span>}
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 54, left: 0, right: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 78px)', justifyContent: 'center', gap: 26, alignItems: 'center' }}>
        {p.phone ? <a href={`sms:${p.phone}`} style={{ fontSize: 15, color: IOS.blue, textDecoration: 'none', textAlign: 'center' }}>문자</a> : <span />}
        {p.phone
          ? <a href={`tel:${p.phone}`} aria-label="전화 걸기" style={{ width: 78, height: 78, borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="call" color="#FFFFFF" size={32} stroke={2} /></a>
          : <span style={{ width: 78, height: 78, borderRadius: '50%', background: '#C7C7CC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PhoneIcon name="call" color="#FFFFFF" size={32} stroke={2} /></span>}
        <span />
      </div>
    </div>
  )
}

/** 메시지 목록 — 신랑 · 신부와의 대화방 */
function CallChats({ data, onBack }: AppProps) {
  const accent = data.phone.accent
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', backgroundColor: '#FFFFFF', backgroundImage: TINT, overflow: 'hidden' }}>
      {/* 가족이 많으면 목록이 길어짐 — 스크롤 영역, 뒤로는 그 바깥에 고정 */}
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: 40 }}>
      <div style={{ padding: '114px 18px 0' }}>
        {eyebrow(screenText(data, 'call', 'eyebrow', 'MESSAGES'))}<div style={{ fontSize: 31, fontWeight: 700, letterSpacing: '-0.035em' }}>{screenText(data, 'call', 'title', '메시지')}</div>
        <div style={{ marginTop: 12, height: 36, borderRadius: 10, background: '#EEEEF0', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6, color: IOS.gray, fontSize: 15 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke={IOS.gray} strokeWidth="2" /><path d="M20 20l-4-4" stroke={IOS.gray} strokeWidth="2" strokeLinecap="round" /></svg>검색
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {contactsOf(data).filter(c => !c.deceased).map(c => {
          const { k, phone } = c
          const inner = (
            <>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: phone && c.couple ? IOS.blue : 'transparent', flexShrink: 0 }} />
              <Avatar av={c.av} size={50} bg={c.couple ? `linear-gradient(160deg, ${accent}, ${accent}AA)` : `linear-gradient(160deg, #B9B9BF, #9A9AA1)`} />
              <span style={{ flex: 1, minWidth: 0, borderBottom: `0.5px solid ${IOS.line}`, padding: '12px 0' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16.5, fontWeight: 700 }}>{[c.rel, c.name].filter(Boolean).join(' ')}</span>
                  <span style={{ fontSize: 14, color: IOS.gray }}>지금</span>
                </span>
                <span style={{ display: 'block', fontSize: 15, color: IOS.gray, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phone ? (c.couple ? '축하 메시지를 보내 주세요' : '축하 인사를 전해 주세요') : '번호가 없어요'}</span>
              </span>
            </>
          )
          const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 0 8px', textDecoration: 'none', color: '#111111' }
          return phone ? <a key={k} href={`sms:${phone}`} style={row}>{inner}</a> : <div key={k} style={row}>{inner}</div>
        })}
      </div>
      </div>
      {backBtn(onBack, IOS.blue)}
    </div>
  )
}

/** 추억 — 큰 표지 카드 + 사진 모음 */
function AlbumMemories({ data, onBack }: AppProps) {
  const [folder, setFolder] = useState(-1)
  const imgs = folderImages(data, folder)
  const wp = weddingParts(data)
  const [zoom, setZoom] = useState<string | null>(null)
  const season = wp.d ? ['겨울', '겨울', '봄', '봄', '봄', '여름', '여름', '여름', '가을', '가을', '가을', '겨울'][wp.d.getMonth()] : ''
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', backgroundColor: '#FFFFFF', backgroundImage: TINT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <div style={{ padding: '114px 16px 60px' }}>
          {eyebrow(screenText(data, 'album', 'eyebrow', 'MEMORIES'))}<div style={{ fontSize: 31, fontWeight: 700, letterSpacing: '-0.035em' }}>{screenText(data, 'album', 'title', '추억')}</div>
          <div style={{ marginTop: 10 }}><FolderTabs data={data} cur={folder} onPick={setFolder} /></div>
          {folderSections(data, folder).map((f, si) => {
            const cv = f.images[0]
            return (
              <div key={si}>
                {cv && (
                  <button type="button" onClick={() => setZoom(cv)} style={{ position: 'relative', display: 'block', width: '100%', height: si ? 300 : 420, marginTop: si ? 26 : 14, borderRadius: 18, overflow: 'hidden', border: 0, padding: 0, cursor: 'pointer' }}>
                    <Photo src={cv} />
                    <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)' }} />
                    <span style={{ position: 'absolute', left: 18, bottom: 18, color: '#FFFFFF', textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{f.name || `우리의 ${season || '날들'}`}</span>
                      <span style={{ display: 'block', fontSize: 14, opacity: 0.9, marginTop: 2 }}>{wp.d ? `${wp.year}년 ${wp.month}월` : ''} · 사진 {f.images.length}장</span>
                    </span>
                  </button>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                  {f.images.slice(1).map((src, k) => (
                    <button key={k} type="button" onClick={() => setZoom(src)} style={{ aspectRatio: k % 3 === 0 ? '1 / 1.3' : '1', borderRadius: 12, overflow: 'hidden', border: 0, padding: 0, cursor: 'pointer' }}><Photo src={src} /></button>
                  ))}
                </div>
              </div>
            )
          })}
          {!imgs.length && <p style={{ marginTop: 20, fontSize: 15, color: IOS.gray }}>아직 사진이 없어요.</p>}
          <div style={{ marginTop: 16 }}><NextFolder data={data} cur={folder} onPick={setFolder} /></div>
        </div>
      </div>
      {backBtn(onBack, IOS.blue)}
      {zoom && <ZoomOverlay src={zoom} imgs={imgs} onClose={() => setZoom(null)} />}
    </div>
  )
}

/** 투표 — 참석 · 불참 · 미정 중 고르면 회신 양식이 열린다 */
function RsvpPoll({ data, onBack, renderRsvp }: AppProps) {
  const accent = data.phone.accent
  const [pick, setPick] = useState<number | null>(null)
  const opts = ['참석할게요', '마음으로 축하할게요', '아직 모르겠어요']
  const nm = { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') }
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', backgroundColor: IOS.group, backgroundImage: TINT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <div style={{ padding: '104px 16px 60px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '20px 18px 16px', boxShadow: SOFT }}>
            <div style={{ fontSize: 12.5, color: IOS.gray, fontWeight: 600 }}>{nm.a} · {nm.b}의 투표</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 6 }}>결혼식에 오시나요?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {opts.map((o, k) => (
                <button key={o} type="button" onClick={() => setPick(k)}
                  style={{ font: 'inherit', position: 'relative', height: 50, borderRadius: 12, border: `1.5px solid ${pick === k ? accent : '#E5E5EA'}`, background: '#FFFFFF', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontSize: 15.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ position: 'absolute', inset: 0, width: pick === k ? '100%' : '0%', background: `${accent}14`, transition: 'width 0.35s' }} />
                  <span style={{ position: 'relative', width: 20, height: 20, borderRadius: '50%', border: pick === k ? 0 : '1.6px solid #C7C7CC', background: pick === k ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pick === k && <PhoneIcon name="check" color="#FFFFFF" size={13} stroke={2.8} />}</span>
                  <span style={{ position: 'relative' }}>{o}</span>
                </button>
              ))}
            </div>
          </div>
          {(
            <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '16px 18px 18px', marginTop: 12, boxShadow: SOFT }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: IOS.gray, marginBottom: 6 }}>회신 보내기</div>
              {renderRsvp ? renderRsvp({ attendance: pick === 0 ? 'attending' : pick === 1 ? 'not_attending' : 'pending' }) : <p style={{ fontSize: 14, color: IOS.gray, lineHeight: 1.6 }}>실제 청첩장에서 이름 · 인원을 남기는 칸이 열려요.</p>}
            </div>
          )}
        </div>
      </div>
      {backBtn(onBack, IOS.blue)}
    </div>
  )
}

/* ───────── 오시는 길 (교통 안내) ───────── */
const DIR_LABEL = { subway: '지하철', bus: '버스', car: '자가용', parking: '주차', etc: '안내' } as const
function DirIcon({ kind, color }: { kind: keyof typeof DIR_LABEL; color: string }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const d: Record<string, ReactNode> = {
    subway: <><rect {...p} x="5" y="3" width="14" height="14" rx="3" /><path {...p} d="M5 11h14M8 21l2-4M16 21l-2-4" /><circle cx="9" cy="14" r="1" fill={color} /><circle cx="15" cy="14" r="1" fill={color} /></>,
    bus: <><rect {...p} x="4" y="3" width="16" height="15" rx="3" /><path {...p} d="M4 10h16M7 21v-3M17 21v-3" /><circle cx="8" cy="14" r="1" fill={color} /><circle cx="16" cy="14" r="1" fill={color} /></>,
    car: <><path {...p} d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2" /><circle cx="8" cy="13.5" r="1" fill={color} /><circle cx="16" cy="13.5" r="1" fill={color} /></>,
    parking: <><rect {...p} x="4" y="4" width="16" height="16" rx="4" /><path {...p} d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" /></>,
    etc: <><circle {...p} cx="12" cy="12" r="8" /><path {...p} d="M12 11v5M12 8h.01" /></>,
  }
  return <svg aria-hidden width={18} height={18} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>{d[kind]}</svg>
}
/** 오시는 길 목록 — 디자인마다 글자색 · 선 색만 바꿔 쓴다 */
function Directions({ data, ink, sub, line, icon }: { data: PhoneData; ink: string; sub: string; line: string; icon: string }) {
  const list = (data.phone.directions || []).filter(x => x.text.trim())
  if (!list.length) return null
  return (
    <>
      {list.map((x, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < list.length - 1 ? `0.5px solid ${line}` : undefined }}>
          <DirIcon kind={x.kind} color={icon} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: ink }}>{x.title?.trim() || DIR_LABEL[x.kind]}</span>
            <span style={{ display: 'block', fontSize: 13.5, lineHeight: 1.55, color: sub, marginTop: 2, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{x.text}</span>
          </span>
        </div>
      ))}
    </>
  )
}

/* ───────── 방명록 — 축하 대화방 · 메모 보드 ───────── */
function GuestbookApp({ data, onBack }: AppProps) {
  const { list, post } = useGuestbook()
  const accent = data.phone.accent
  const gst = screenStyle(data, 'guestbook')
  const board = gst === 'board'
  const title = data.phone.guestbookTitle || ({ board: '축하 메모', post: '저희 결혼합니다', notify: '축하 알림' } as Record<string, string>)[gst] || '축하 메시지'
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState('')
  const [sheet, setSheet] = useState(false)
  const send = async () => {
    if (!name.trim() || !msg.trim() || sending) { setNote(!name.trim() ? '이름을 적어 주세요' : '메시지를 적어 주세요'); return }
    setSending(true)
    const ok = await post(name.trim(), msg.trim())
    setSending(false)
    if (ok) { setMsg(''); setNote(''); setSheet(false) } else setNote('실제 청첩장에서 남길 수 있어요')
  }
  const field: CSSProperties = { font: 'inherit', border: 0, outline: 0, background: '#F2F2F5', borderRadius: 18, padding: '0 14px', fontSize: 15, color: '#111111', minWidth: 0 }
  const form = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" maxLength={20} style={{ ...field, height: 36, width: 120 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="축하 메시지" maxLength={500} rows={1} style={{ ...field, flex: 1, minHeight: 38, maxHeight: 96, padding: '9px 14px', resize: 'none', lineHeight: 1.4 }} />
        <button type="button" onClick={send} aria-label="보내기" style={{ width: 38, height: 38, borderRadius: '50%', border: 0, background: msg.trim() ? accent : '#D1D1D6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      {note && <span style={{ fontSize: 12, color: IOS.gray, paddingLeft: 4 }}>{note}</span>}
    </div>
  )

  const sheetUI = sheet && (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 5, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSheet(false)}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#FFFFFF', borderRadius: '24px 24px 0 0', padding: '10px 18px 40px', color: '#111111' }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: '#E2E0DD', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{board ? '축하 메모' : '축하 한마디'}</div>
        {form}
      </div>
    </div>
  )
  const fab = (label: string) => (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 30, display: 'flex', justifyContent: 'center', zIndex: 2 }}>
      <button type="button" onClick={() => setSheet(true)} style={{ font: 'inherit', height: 48, padding: '0 22px', borderRadius: 999, border: 0, background: accent, color: '#FFFFFF', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 10px 28px rgba(40,30,20,0.22)', cursor: 'pointer' }}>
        <PhoneIcon name="pen" color="#FFFFFF" size={17} stroke={2} />{label}
      </button>
    </div>
  )

  // 게시물 댓글 — 두 사람 사진 한 장 + 축하 댓글
  if (gst === 'post') {
    const sc = screenCoverOf(data, 'guestbook')
    const nm = { a: givenName(data.groom, '신랑'), b: givenName(data.bride, '신부') }
    return (
      <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, paddingTop: 52, boxSizing: 'border-box', textAlign: 'center', fontSize: 16, fontWeight: 700, background: '#FFFFFF', borderBottom: `0.5px solid ${IOS.line}`, zIndex: 3 }}>게시물</div>
        <div style={{ position: 'absolute', top: 100, left: 0, right: 0, bottom: 150, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 3.5px ${accent}` }}><Photo src={sc.src} crop={sc.crop} /></span>
            <span style={{ fontSize: 14.5, fontWeight: 700 }}>{nm.a} · {nm.b}</span>
          </div>
          <div style={{ width: '100%', aspectRatio: '1', background: '#EEE' }}><Photo src={sc.src} crop={sc.crop} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px 6px' }}>
            <PhoneIcon name="heart" color={accent} size={25} />
            <PhoneIcon name="message" color="#111111" size={24} stroke={1.8} />
            <span style={{ marginLeft: 'auto', fontSize: 13, color: IOS.gray }}>{gbDate(new Date().toISOString())}</span>
          </div>
          <div style={{ padding: '0 14px', fontSize: 14.5, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, marginRight: 6 }}>{nm.a} · {nm.b}</span>{title}
            <div style={{ fontSize: 13.5, color: IOS.gray, marginTop: 6 }}>축하 댓글 {list.length}개</div>
          </div>
          <div style={{ padding: '10px 14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {list.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: m.mine ? accent : '#E9E9EE', color: m.mine ? '#FFFFFF' : '#555', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.name.slice(0, 1)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, lineHeight: 1.5, wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
                  <span style={{ fontWeight: 700, marginRight: 6 }}>{m.name}</span>{m.message}
                  {gbDate(m.at) && <span style={{ display: 'block', fontSize: 12, color: IOS.gray, marginTop: 2 }}>{gbDate(m.at)}</span>}
                </span>
                <PhoneIcon name="heart" color="#D1D1D6" size={13} />
              </div>
            ))}
            {!list.length && <p style={{ fontSize: 14, color: IOS.gray }}>첫 댓글을 남겨 주세요.</p>}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 14px 34px', background: '#FFFFFF', borderTop: `0.5px solid ${IOS.line}` }}>{form}</div>
        {backBtn(onBack, '#111111')}
      </div>
    )
  }

  // 알림 — 흐린 사진 위에 축하가 알림처럼 쌓임
  if (gst === 'notify') {
    const sc = screenCoverOf(data, 'guestbook')
    return (
      <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#FFFFFF', background: '#2A2420', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: -60, filter: 'blur(40px) saturate(1.2) brightness(0.72)', transform: 'scale(1.1)' }}><Photo src={sc.src} crop={sc.crop} /></div>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
          <div style={{ padding: '114px 12px 140px' }}>
            <div style={{ padding: '0 8px', fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', textShadow: '0 2px 14px rgba(0,0,0,0.2)' }}>{title}</div>
            <div style={{ padding: '0 8px', fontSize: 14, opacity: 0.8, marginTop: 4 }}>알림 {list.length}개</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
              {list.map(m => (
                <div key={m.id} style={{ background: 'rgba(250,250,250,0.78)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 20, padding: '12px 14px', color: '#111111', display: 'flex', gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PhoneIcon name="pen" color="#FFFFFF" size={18} stroke={2} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>{m.name}<span style={{ fontSize: 12.5, fontWeight: 500, color: '#6C6C70' }}>{m.mine ? '지금' : gbDate(m.at)}</span></span>
                    <span style={{ display: 'block', fontSize: 14, lineHeight: 1.45, marginTop: 1, wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{m.message}</span>
                  </span>
                </div>
              ))}
              {!list.length && <p style={{ padding: '0 8px', fontSize: 15, opacity: 0.85 }}>첫 축하를 보내 주세요.</p>}
            </div>
          </div>
        </div>
        {backBtn(onBack, '#FFFFFF', 'rgba(0,0,0,0.25)')}
        {fab('축하 보내기')}
        {sheetUI}
      </div>
    )
  }

  if (board) {
    const tints = ['#FFF4B8', '#FFE1E1', '#E2F0FF', '#E5F5E0', '#F1E6FF']
    return (
      <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
          <div style={{ padding: '114px 16px 140px' }}>
            {eyebrow(screenText(data, 'guestbook', 'eyebrow', 'GUESTBOOK'))}<div style={{ fontSize: 31, fontWeight: 700, letterSpacing: '-0.035em' }}>{title}</div>
            <div style={{ fontSize: 14, color: IOS.gray, marginTop: 2 }}>{list.length}개의 축하</div>
            <div style={{ columnCount: 2, columnGap: 10, marginTop: 16 }}>
              {list.map((m, i) => (
                <div key={m.id} style={{ breakInside: 'avoid', marginBottom: 10, background: tints[i % tints.length], borderRadius: 4, padding: '14px 14px 12px', boxShadow: '0 4px 10px rgba(60,50,30,0.10)', transform: `rotate(${[-1.2, 0.8, -0.4, 1.1][i % 4]}deg)` }}>
                  <div style={{ fontSize: 14.5, lineHeight: 1.55, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{m.message}</div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}><span>— {m.name}</span><span>{gbDate(m.at)}</span></div>
                </div>
              ))}
            </div>
            {!list.length && <p style={{ fontSize: 15, color: IOS.gray, marginTop: 24 }}>첫 축하 메모를 붙여 주세요.</p>}
          </div>
        </div>
        {backBtn(onBack, IOS.blue)}
        {fab('메모 남기기')}
        {sheetUI}
      </div>
    )
  }

  // 축하 대화방 — 하객 메시지는 왼쪽, 내가 보낸 건 오른쪽
  const shown = [...list].reverse()
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color: '#111111', background: '#FFFFFF', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 50, height: 110, boxSizing: 'border-box', background: 'rgba(249,249,249,0.94)', borderBottom: `0.5px solid ${IOS.line}`, zIndex: 3, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, color: IOS.gray, marginTop: 2 }}>{list.length}명이 축하했어요</div>
      </div>
      <div style={{ position: 'absolute', top: 110, left: 0, right: 0, bottom: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
        <div style={{ padding: '16px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.mine ? 'flex-end' : 'flex-start' }}>
              {!m.mine && <span style={{ fontSize: 12, color: IOS.gray, margin: '0 0 3px 12px' }}>{m.name}{gbDate(m.at) ? ` · ${gbDate(m.at)}` : ''}</span>}
              <span style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: 18, background: m.mine ? accent : '#EFEFF2', color: m.mine ? '#FFFFFF' : '#111111', fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{m.message}</span>
            </div>
          ))}
          {!list.length && <p style={{ textAlign: 'center', fontSize: 14, color: IOS.gray, marginTop: 40 }}>첫 축하 메시지를 보내 주세요.</p>}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 14px 34px', background: 'rgba(249,249,249,0.96)', borderTop: `0.5px solid ${IOS.line}` }}>{form}</div>
      {backBtn(onBack, IOS.blue)}
    </div>
  )
}

/* ───────── D-Day 팝업 — 폰 알림창처럼 (다른 템플릿과 같은 설정 ddayPopup) ───────── */
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const shiftYmd = (s: string, n: number) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + n); return ymd(d) }
/** 오늘 보여 줄지 — 기간 안 + '오늘 하루 안 보기'를 안 눌렀을 때 */
export function ddayPopupDue(data: PhoneData): boolean {
  const v = data.ddayPopup
  const wd = data.wedding.date
  if (!v?.enabled || !wd || !(v.pages || []).length) return false
  const today = ymd(new Date())
  const start = v.displayStart || shiftYmd(wd, -7)
  const end = v.displayEnd || wd
  if (today < start || today > end) return false
  try { if (localStorage.getItem(`pf-dday-${wd}-${today}`)) return false } catch { /* noop */ }
  return true
}
export function DdayPhonePopup(props: Parameters<typeof DdayPhonePopupInner>[0]) {
  return <BodyFont data={props.data}><DdayPhonePopupInner {...props} /></BodyFont>
}
function DdayPhonePopupInner({ data, onClose, preview }: { data: PhoneData; onClose: () => void; preview?: boolean }) {
  const v = data.ddayPopup
  const [pi, setPi] = useState(0)
  const [ii, setIi] = useState(0)
  const [leaving, setLeaving] = useState(false)
  // 알림 배너(기본) — 위에서 내려오고, 누르면 펼쳐짐. 안내 카드 — 바로 가운데 카드
  const banner = (data.phone.ddayLook || 'banner') === 'banner'
  const [expanded, setExpanded] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)
  if (!v) return null
  const pages = v.pages || []
  const page = pages[Math.min(pi, pages.length - 1)]
  const accent = v.pointColor || data.phone.accent
  const n = ddayCount(data.wedding.date)
  const ddayLabel = n === null ? '' : n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : `D+${-n}`
  const align = v.textAlign || 'left'
  const close = (today?: boolean) => {
    if (today && !preview) { try { localStorage.setItem(`pf-dday-${data.wedding.date}-${ymd(new Date())}`, '1') } catch { /* noop */ } }
    setLeaving(true)
    setTimeout(onClose, 220)
  }
  const ds = v.ddayStyle || 'pill'
  const badge = ddayLabel && v.showDday ? (
    ds === 'circle' ? <span style={{ width: 54, height: 54, borderRadius: '50%', background: accent, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>{ddayLabel}</span>
      : ds === 'outline' ? <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${accent}`, color: accent, fontSize: 12.5, fontWeight: 800 }}>{ddayLabel}</span>
        : ds === 'minimal' ? <span style={{ color: accent, fontSize: 13, fontWeight: 800, letterSpacing: '0.04em' }}>{ddayLabel}</span>
          : ds === 'elegant' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: accent, fontSize: 13, fontWeight: 700, letterSpacing: '0.12em' }}><span style={{ width: 18, height: 1, background: accent }} />{ddayLabel}<span style={{ width: 18, height: 1, background: accent }} /></span>
            : <span style={{ display: 'inline-block', padding: '4px 11px', borderRadius: 999, background: accent, color: '#FFFFFF', fontSize: 12.5, fontWeight: 800 }}>{ddayLabel}</span>
  ) : null
  const imgs = page?.images || []
  // 사진 모양 — 가로 · 정사각 · 세로 · 사진 꽉 채움(글은 사진 위)
  const shape = data.phone.ddayPhoto || 'wide'
  const full = !banner && shape === 'full' && imgs.length > 0
  const ink = full ? '#FFFFFF' : '#111111'
  const bs = v.buttonStyle || 'solid'
  const line = full ? '#FFFFFF' : accent
  const btn: CSSProperties = {
    font: 'inherit', width: '100%', height: 48, border: 0, cursor: 'pointer', fontSize: 15.5, fontWeight: 700,
    borderRadius: bs === 'pill' ? 999 : 14,
    background: bs === 'solid' || bs === 'pill' ? accent : bs === 'soft' ? (full ? 'rgba(255,255,255,0.2)' : `${accent}1F`) : 'transparent',
    color: bs === 'solid' || bs === 'pill' ? '#FFFFFF' : line,
    boxShadow: bs === 'outline' ? `inset 0 0 0 1.5px ${line}` : undefined,
  }
  const ratio = shape === 'tall' ? '4 / 5' : shape === 'square' ? '1 / 1' : '16 / 10'
  const carousel = (
    <div key={pi} style={full ? { position: 'absolute', inset: 0 } : { position: 'relative', flexShrink: 0 }}>
      <div className="pf-noscroll" onScroll={e => { const el = e.currentTarget; setIi(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))) }}
        style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', height: full ? '100%' : undefined }}>
        {imgs.map((im, k) => (
          // 누르면 크게 (넘기기 · 확대)
          <button key={k} type="button" aria-label={`사진 ${k + 1} 크게 보기`} onClick={e => { e.stopPropagation(); setZoom(im.url) }}
            style={{ flex: '0 0 100%', aspectRatio: full ? undefined : ratio, height: full ? '100%' : undefined, scrollSnapAlign: 'start', border: 0, padding: 0, cursor: 'zoom-in', display: 'block', position: 'relative' }}>
            <Photo src={im.url} />
            {!full && <span aria-hidden style={{ position: 'absolute', right: 8, top: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>}
          </button>
        ))}
      </div>
      {imgs.length > 1 && (
        <span style={{ position: 'absolute', left: 0, right: 0, top: full ? 16 : undefined, bottom: full ? undefined : 10, display: 'flex', justifyContent: 'center', gap: 5, pointerEvents: 'none' }}>
          {imgs.map((_, k) => <span key={k} style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF', opacity: k === ii ? 1 : 0.5, boxShadow: '0 0 4px rgba(0,0,0,0.3)' }} />)}
        </span>
      )}
    </div>
  )
  const appIcon = (sz: number) => (
    <span style={{ width: sz, height: sz, borderRadius: sz * 0.24, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <PhoneIcon name="calendar" color="#FFFFFF" size={Math.round(sz * 0.52)} stroke={1.9} />
    </span>
  )
  if (banner && !expanded) {
    // 접힌 알림 — 화면 가운데에, 뒤를 어둡게. 알림을 눌러야만 넘어감 (바깥을 눌러도 안 닫힘)
    const head = v.title || page?.title || 'D-Day 알림'
    const line = v.title ? page?.title || page?.body : page?.body
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px', fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif", opacity: leaving ? 0 : 1, transition: 'opacity 0.25s' }}>
        <style>{'@keyframes pfDrop { from { transform: translateY(-28px) scale(0.94); opacity: 0; } to { transform: none; opacity: 1; } } @keyframes pfNudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }'}</style>
        <button type="button" onClick={e => { e.stopPropagation(); setExpanded(true) }} aria-label="알림 펼치기"
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 14px 12px', borderRadius: 24, border: 0, background: 'rgba(252,252,252,0.94)', backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)', boxShadow: '0 18px 44px rgba(0,0,0,0.26)', textAlign: 'left', font: 'inherit', cursor: 'pointer', color: '#111111', animation: 'pfDrop 0.55s cubic-bezier(0.32, 0.72, 0, 1)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            {appIcon(44)}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#6C6C70' }}><span>{ddayLabel && v.showDday ? `${ddayLabel} · ` : ''}청첩장 알림</span><span>지금</span></span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{head}</span>
              {line && <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 14, color: '#3A3A3C', lineHeight: 1.4, marginTop: 1 }}>{line}</span>}
            </span>
            {imgs[0] && <span style={{ width: 54, height: 54, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}><Photo src={imgs[0].url} /></span>}
          </span>
          <span style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: accent, animation: 'pfNudge 1.6s ease-in-out infinite' }}>
            눌러서 자세히 보기
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </button>
      </div>
    )
  }
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif", opacity: leaving ? 0 : 1, transition: 'opacity 0.22s' }}>
      <style>{'@keyframes pfPop { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: none; } } .pf-noscroll { scrollbar-width: none; } .pf-noscroll::-webkit-scrollbar { display: none; }'}</style>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 330, maxHeight: '86%', aspectRatio: full ? '3 / 4.3' : undefined, background: full ? '#111111' : '#FFFFFF', borderRadius: 26, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.28)', animation: 'pfPop 0.32s cubic-bezier(0.32, 0.72, 0, 1)', color: ink }}>
        {full && carousel}
        {full && <>
          <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 22%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)', pointerEvents: 'none' }} />
          <span style={{ flex: 1, pointerEvents: 'none' }} />
        </>}
        {/* 사진 + 글이 함께 스크롤 (사진이 커도 글이 잘리지 않게) */}
        <div className={full ? undefined : 'pf-noscroll'} style={full ? { position: 'relative', flexShrink: 0 } : { flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {!full && !banner && imgs.length > 0 && carousel}
        <div style={{ position: 'relative', padding: '22px 22px 18px', textAlign: align }}>
          {banner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, textAlign: 'left' }}>
              {appIcon(26)}
              <span style={{ flex: 1, fontSize: 12.5, color: '#6C6C70' }}>청첩장 알림</span>
              {badge}
            </div>
          )}
          {!banner && badge && <div style={{ marginBottom: 12 }}>{badge}</div>}
          {v.title && <div style={{ fontSize: 12.5, fontWeight: 700, color: full ? 'rgba(255,255,255,0.8)' : accent, letterSpacing: '-0.01em' }}>{v.title}</div>}
          {page?.title && <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginTop: v.title ? 4 : 0, lineHeight: 1.35, wordBreak: 'keep-all' }}>{page.title}</div>}
          {page?.body && <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.65, color: full ? 'rgba(255,255,255,0.86)' : '#4A4A4F', whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{page.body}</p>}
          {banner && imgs.length > 0 && <div style={{ marginTop: 14, borderRadius: 14, overflow: 'hidden', textAlign: 'left' }}>{carousel}</div>}
          {(page?.links || []).filter(l => l.url).length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, justifyContent: v.linkAlign === 'center' ? 'center' : v.linkAlign === 'right' ? 'flex-end' : 'flex-start' }}>
              {(page?.links || []).filter(l => l.url).map((l, k) => (
                <a key={k} href={preview ? undefined : l.url} target="_blank" rel="noreferrer" onClick={e => { if (preview) e.preventDefault() }}
                  style={{ height: 34, padding: '0 14px', borderRadius: 999, background: full ? 'rgba(255,255,255,0.2)' : '#F2F2F5', color: ink, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                  {l.label || '바로 가기'}<PhoneIcon name="chevron" color={full ? '#FFFFFF' : '#8E8E93'} size={13} stroke={2.2} />
                </a>
              ))}
            </div>
          )}
        </div>
        </div>
        {pages.length > 1 && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 10px' }}>
            <button type="button" aria-label="이전 안내" disabled={pi === 0} onClick={() => { setPi(p => Math.max(0, p - 1)); setIi(0) }} style={{ border: 0, background: 'transparent', padding: 6, cursor: 'pointer', opacity: pi === 0 ? 0.25 : 1, display: 'flex' }}><PhoneIcon name="back" color={ink} size={18} stroke={2.2} /></button>
            <span style={{ display: 'flex', gap: 6 }}>{pages.map((_, k) => <span key={k} style={{ width: k === pi ? 16 : 6, height: 6, borderRadius: 3, background: k === pi ? (full ? '#FFFFFF' : accent) : full ? 'rgba(255,255,255,0.4)' : '#D9D9DE', transition: 'width 0.2s' }} />)}</span>
            <button type="button" aria-label="다음 안내" disabled={pi === pages.length - 1} onClick={() => { setPi(p => Math.min(pages.length - 1, p + 1)); setIi(0) }} style={{ border: 0, background: 'transparent', padding: 6, cursor: 'pointer', opacity: pi === pages.length - 1 ? 0.25 : 1, display: 'flex' }}><PhoneIcon name="chevron" color={ink} size={18} stroke={2.2} /></button>
          </div>
        )}
        <div style={{ position: 'relative', padding: '0 18px 18px', flexShrink: 0 }}>
          <button type="button" onClick={() => close()} style={btn}>{v.buttonLabel || '확인했습니다'}</button>
          {v.showDismissToday && <button type="button" onClick={() => close(true)} style={{ font: 'inherit', width: '100%', marginTop: 6, height: 36, border: 0, background: 'transparent', color: full ? 'rgba(255,255,255,0.7)' : '#8E8E93', fontSize: 13, cursor: 'pointer' }}>오늘 하루 안 보기</button>}
        </div>
      </div>
      {zoom && <ZoomOverlay src={zoom} imgs={imgs.map(m => m.url)} onClose={() => setZoom(null)} />}
    </div>
  )
}

/* ───────── 커플 소개 — 다섯 가지 디자인 ───────── */
interface IntroP { k: 'groom' | 'bride'; role: string; name: string; en?: string; photo?: string; crop?: PhoneImageSettings; bg?: string; bgCrop?: PhoneImageSettings; bio: string; items: { q: string; a: string }[] }
function introPeople(data: PhoneData): IntroP[] {
  return (['groom', 'bride'] as const).map(k => {
    const p = data[k]
    const ip = data.phone.intro?.[k] || {}
    return {
      k, role: k === 'groom' ? '신랑' : '신부', name: p.name || (k === 'groom' ? '신랑' : '신부'), en: p.nameEn,
      photo: ip.photo || p.avatarPhoto || data.gallery.images[k === 'groom' ? 0 : 1], crop: ip.photo ? ip.photoCrop : p.avatarCrop,
      bg: ip.bg, bgCrop: ip.bgCrop,
      bio: ip.bio || '', items: (ip.items || []).filter(x => x.q.trim() && x.a.trim()),
    }
  })
}
const metDays = (data: PhoneData) => { const d = data.phone.intro?.metDate && parseWeddingDate(data.phone.intro.metDate); if (!d) return null; const t = new Date(); return Math.floor((new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() - d.getTime()) / 86400000) + 1 }
/** 커플 소개 · 명함 — 카드를 누르면 카카오톡 프로필처럼 (배경 사진 · 큰 프로필 · 소개) */
function IntroProfileView({ data, ps, start, onClose, onZoom }: { data: PhoneData; ps: IntroP[]; start: number; onClose: () => void; onZoom: (src: string) => void }) {
  useHideChrome()
  const [i, setI] = useState(start)
  const p = ps[i]
  const sx = useRef<number | null>(null)
  const go = (d: number) => setI(v => Math.max(0, Math.min(ps.length - 1, v + d)))
  const latin = titleFontOf(data).latin && !!p.en
  const bg = p.bg || p.photo
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#1C1C1E', color: '#FFFFFF', overflow: 'hidden', animation: 'pfProfIn 0.32s cubic-bezier(0.32, 0.72, 0, 1)' }}
      onPointerDown={e => { sx.current = e.clientX }}
      onPointerUp={e => { if (sx.current === null) return; const dx = e.clientX - sx.current; sx.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1) }}>
      <style>{'@keyframes pfProfIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } } @keyframes pfProfSwap { from { opacity: 0; } to { opacity: 1; } }'}</style>
      {/* 배경 — 따로 고른 사진, 없으면 프로필 사진 */}
      {/* 배경을 누르면 배경 사진 크게 */}
      <div key={`bg${i}`} onClick={() => bg && onZoom(bg)} style={{ position: 'absolute', inset: 0, animation: 'pfProfSwap 0.4s ease', cursor: bg ? 'zoom-in' : undefined }}>
        {/* 카톡 프로필처럼 — 흐리지 않게, 전체를 살짝 어둡게 + 아래쪽 글자 자리만 조금 더 */}
        {bg && <Photo src={bg} crop={p.bg ? p.bgCrop : p.crop} />}
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }} />
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)' }} />
      </div>
      {/* 위 — 닫기 · 넘기기 점 */}
      <BackCircle onClick={onClose} dark />
      {ps.length > 1 && (
        <div style={{ position: 'absolute', top: 68, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 2, pointerEvents: 'none' }}>
          {ps.map((x, k) => <button key={x.k} type="button" aria-label={x.role} onClick={() => setI(k)} style={{ pointerEvents: 'auto', width: k === i ? 18 : 6, height: 6, borderRadius: 3, border: 0, padding: 0, background: '#FFFFFF', opacity: k === i ? 0.95 : 0.45, cursor: 'pointer', transition: 'all 0.25s' }} />)}
        </div>
      )}
      {/* 아래 — 큰 프로필 · 이름 · 소개 · 나를 소개하는 것 */}
      <div key={`p${i}`} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 22px 46px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'pfProfSwap 0.4s ease', pointerEvents: 'none' }}>
        <button type="button" onClick={() => p.photo && onZoom(p.photo)} aria-label="프로필 사진 크게" style={{ pointerEvents: 'auto', width: 132, height: 132, borderRadius: '38%', overflow: 'hidden', border: 0, padding: 0, background: 'rgba(255,255,255,0.18)', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', cursor: p.photo ? 'zoom-in' : 'default', position: 'relative' }}>
          {p.photo ? <Photo src={p.photo} crop={p.crop} /> : <span style={{ fontSize: 44, fontWeight: 700 }}>{p.name.slice(-2, -1)}</span>}
        </button>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.28em', opacity: 0.75, marginTop: 18 }}>{p.role === '신랑' ? 'GROOM' : 'BRIDE'}</div>
        <div style={{ ...titleCss(data, 30), color: '#FFFFFF', marginTop: 6, lineHeight: 1.1 }}>{latin ? p.en : p.name}</div>
        <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 4 }}>{latin ? `${p.role} ${p.name}` : p.role}</div>
        {p.bio && <div style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 12, maxWidth: 300, wordBreak: 'keep-all' }}>{p.bio}</div>}
        {p.items.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {p.items.map((x, k) => (
              <span key={k} style={{ fontSize: 12.5, padding: '6px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}>
                <span style={{ opacity: 0.7, marginRight: 5 }}>{x.q}</span><b style={{ fontWeight: 700 }}>{x.a}</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function IntroApp({ data, onBack }: AppProps) {
  const st = screenStyle(data, 'intro')
  const ps = introPeople(data)
  const [who, setWho] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const [matched, setMatched] = useState(false)
  // 사진을 누르면 독사진 크게 (두 사람 사진을 넘겨 볼 수 있음)
  const [zoom, setZoom] = useState<string | null>(null)
  // 명함 — 누르면 카톡 프로필처럼
  const [profile, setProfile] = useState<number | null>(null)
  const [press, setPress] = useState<number | null>(null)
  const zoomOn = (p: IntroP) => (e: { stopPropagation: () => void }) => { if (!p.photo) return; e.stopPropagation(); setZoom(p.photo) }
  useEffect(() => { if (st !== 'match') return; const t = setTimeout(() => setMatched(true), 350); return () => clearTimeout(t) }, [st])
  const accent = data.phone.accent
  const days = metDays(data)
  const avatar = (p: IntroP, sz: number, ring?: string) => (
    <span onClick={zoomOn(p)} style={{ cursor: p.photo ? 'zoom-in' : undefined, width: sz, height: sz, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: `linear-gradient(160deg, ${accent}AA, ${accent})`, boxShadow: ring ? `0 0 0 3px #FFFFFF, 0 0 0 ${ring === 'thin' ? 4 : 5.5}px ${accent}` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: sz * 0.38, fontWeight: 600 }}>
      {p.photo ? <Photo src={p.photo} crop={p.crop} /> : p.name.slice(-2, -1) || p.name.slice(0, 1)}
    </span>
  )
  const seg = (dark?: boolean) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 2, borderRadius: 9, background: dark ? 'rgba(255,255,255,0.12)' : '#E3E3E8' }}>
      {ps.map((p, i) => <button key={p.k} type="button" onClick={() => setWho(i)} style={{ font: 'inherit', height: 30, borderRadius: 7, border: 0, background: who === i ? (dark ? '#FFFFFF' : '#FFFFFF') : 'transparent', color: dark && who !== i ? '#FFFFFF' : '#111111', boxShadow: who === i ? '0 1px 3px rgba(0,0,0,0.12)' : undefined, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>{p.role}</button>)}
    </div>
  )
  // 머리말 — 작은 영문 + 제목 글꼴로 두 사람 이름 (굵은 큰 글씨 대신)
  const tn = titleNames(data)
  const introHead = (pb: number) => (
    <div style={{ padding: `0 4px ${pb}px` }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.26em', color: accent }}>{screenText(data, 'intro', 'eyebrow', 'ABOUT US')}</div>
      <div style={{ ...titleCss(data, 30), marginTop: 6, lineHeight: 1.1 }}>{screenText(data, 'intro', 'title', `${tn.a} ${tn.latin ? '&' : '·'} ${tn.b}`)}</div>
    </div>
  )
  const empty = <p style={{ fontSize: 13.5, color: IOS.gray, padding: '14px 0' }}>소개를 적어 주세요.</p>
  const wrap = (bg: string, children: ReactNode, color = '#111111') => (
    <div style={{ position: 'absolute', inset: 0, fontFamily: SYS, color, background: bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>{children}</div>
      {backBtn(onBack, color === '#111111' ? IOS.blue : '#FFFFFF')}
      {profile !== null && <IntroProfileView data={data} ps={ps} start={profile} onClose={() => setProfile(null)} onZoom={setZoom} />}
      {zoom && <ZoomOverlay src={zoom} imgs={(() => { const l = ps.map(x => x.photo).filter((x): x is string => !!x); return l.includes(zoom) ? l : [zoom] })()} onClose={() => setZoom(null)} />}
    </div>
  )

  // 0) 사진 크게 — 두 사람 사진이 화면을 채우고, 이름 · 소개는 사진 위에
  if (st === 'portrait') {
    const tn2 = titleNames(data)
    return wrap('#FFFFFF', (
      <div style={{ padding: '114px 16px 60px' }}>
        <div style={{ padding: '0 4px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.26em', color: accent }}>{screenText(data, 'intro', 'eyebrow', 'ABOUT US')}</div>
          <div style={{ ...titleCss(data, 30), marginTop: 6, lineHeight: 1.1 }}>{screenText(data, 'intro', 'title', `${tn2.a} ${tn2.latin ? '&' : '·'} ${tn2.b}`)}</div>
          {days && <div style={{ fontSize: 12.5, color: IOS.gray, marginTop: 6 }}>사랑한 지 {days.toLocaleString()}일</div>}
        </div>
        {ps.map(p => (
          <div key={p.k} style={{ marginBottom: 20 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', borderRadius: 22, overflow: 'hidden', background: `linear-gradient(160deg, ${accent}AA, ${accent})` }}>
              {p.photo && <Photo src={p.photo} crop={p.crop} />}{p.photo && <span aria-hidden onClick={zoomOn(p)} style={{ position: 'absolute', inset: 0, cursor: 'zoom-in', zIndex: 1 }} />}
              <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,0.62) 100%)' }} />
              <span style={{ position: 'absolute', left: 18, top: 16, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.26em', color: '#FFFFFF', opacity: 0.85 }}>{p.role === '신랑' ? 'GROOM' : 'BRIDE'}</span>
              <span style={{ position: 'absolute', left: 18, right: 18, bottom: 18, color: '#FFFFFF' }}>
                <span style={{ display: 'block', ...titleCss(data, 28), lineHeight: 1.05, color: '#FFFFFF' }}>{p.en && titleFontOf(data).latin ? p.en : p.name}</span>
                <span style={{ display: 'block', fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>{p.en && titleFontOf(data).latin ? `${p.role} ${p.name}` : p.role}</span>
                {p.bio && <span style={{ display: 'block', fontSize: 14, lineHeight: 1.55, marginTop: 8, wordBreak: 'keep-all' }}>{p.bio}</span>}
              </span>
            </div>
            {p.items.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {p.items.map((x, i) => (
                  <span key={i} style={{ fontSize: 12.5, padding: '6px 11px', borderRadius: 999, background: '#F4F4F6' }}>
                    <span style={{ color: IOS.gray, marginRight: 5 }}>{x.q}</span><b style={{ fontWeight: 700 }}>{x.a}</b>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ))
  }

  // 1) 프로필 — SNS 프로필 한 장씩
  if (st === 'profile') {
    const p = ps[who]
    return wrap('#FFFFFF', (
      <div style={{ padding: '114px 18px 60px' }}>
        {seg()}
        <div key={p.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 26, animation: 'pfFadeIn 0.4s ease' }}>
          {avatar(p, 112, 'ring')}
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 16 }}>{p.name}</div>
          <div style={{ fontSize: 13, color: IOS.gray, marginTop: 2 }}>{p.role}{p.en ? ` · ${p.en}` : ''}</div>
          {p.bio && <div style={{ fontSize: 15, lineHeight: 1.6, textAlign: 'center', marginTop: 12, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{p.bio}</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 24 }}>
          {p.items.map((x, i) => (
            <div key={i} style={{ background: '#F5F5F7', borderRadius: 16, padding: '12px 14px', gridColumn: x.a.length > 14 ? 'span 2' : undefined }}>
              <div style={{ fontSize: 11.5, color: IOS.gray, fontWeight: 600 }}>{x.q}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3, wordBreak: 'keep-all', lineHeight: 1.4 }}>{x.a}</div>
            </div>
          ))}
        </div>
        {!p.items.length && !p.bio && empty}
        <style>{'@keyframes pfFadeIn { from { opacity: 0; } to { opacity: 1; } }'}</style>
      </div>
    ))
  }

  // 2) 매칭 — 두 카드가 겹치며 It's a Match
  if (st === 'match') return wrap(`linear-gradient(180deg, ${accent}, #2A2420)`, (
    <div style={{ padding: '110px 18px 60px', textAlign: 'center' }}>
      <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 40, lineHeight: 1, opacity: matched ? 1 : 0, transform: matched ? 'none' : 'scale(0.8)', transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1) 0.4s' }}>It&apos;s a Match!</div>
      <div style={{ fontSize: 13.5, opacity: 0.8, marginTop: 8 }}>{days ? `사랑한 지 ${days.toLocaleString()}일` : '서로를 알아본 두 사람'}</div>
      <div style={{ position: 'relative', height: 200, marginTop: 28 }}>
        {ps.map((p, i) => (
          <span key={p.k} style={{ position: 'absolute', top: 0, left: '50%', width: 150, height: 196, borderRadius: 18, overflow: 'hidden', background: '#444', boxShadow: '0 14px 30px rgba(0,0,0,0.35)', border: '4px solid #FFFFFF', transition: 'transform 0.8s cubic-bezier(0.32, 0.72, 0, 1)', transform: `translateX(${i ? (matched ? 4 : 180) : (matched ? -154 : -330)}px) rotate(${i ? 7 : -7}deg)` }}>
            {p.photo && <Photo src={p.photo} crop={p.crop} />}{p.photo && <span aria-hidden onClick={zoomOn(p)} style={{ position: 'absolute', inset: 0, cursor: 'zoom-in', zIndex: 1 }} />}
          </span>
        ))}
        <span style={{ position: 'absolute', left: '50%', top: 82, transform: `translateX(-50%) scale(${matched ? 1 : 0})`, transition: 'transform 0.5s cubic-bezier(0.32, 1.4, 0.5, 1) 0.6s', width: 52, height: 52, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,0.3)', zIndex: 2 }}><PhoneIcon name="heart" color="#FF3B5C" size={26} /></span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 30, textAlign: 'left' }}>
        {ps.map(p => (
          <div key={p.k} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: '14px 16px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 17, fontWeight: 800 }}>{p.name}</span><span style={{ fontSize: 12, opacity: 0.7 }}>{p.role}</span></div>
            {p.bio && <div style={{ fontSize: 14, opacity: 0.88, marginTop: 4, lineHeight: 1.5, wordBreak: 'keep-all' }}>{p.bio}</div>}
            {p.items.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>{p.items.map((x, i) => <span key={i} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.16)' }}>{x.a}</span>)}</div>}
          </div>
        ))}
      </div>
    </div>
  ), '#FFFFFF')

  // 3) 설정 — 폰 설정 화면처럼
  if (st === 'settings') return wrap(IOS.group, (
    <div style={{ padding: '114px 16px 60px' }}>
      {introHead(14)}
      {ps.map(p => (
        <div key={p.k} style={{ marginBottom: 22 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {avatar(p, 58)}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 19, fontWeight: 600 }}>{p.name}</span>
              <span style={{ display: 'block', fontSize: 12.5, color: IOS.gray, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.bio || `${p.role} · 프로필`}</span>
            </span>
            <PhoneIcon name="chevron" color="#C7C7CC" size={16} stroke={2.2} />
          </div>
          {p.items.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: 14, marginTop: 10, padding: '0 14px' }}>
              {p.items.map((x, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < p.items.length - 1 ? `0.5px solid ${IOS.line}` : undefined }}>
                  <span style={{ width: 28, height: 28, borderRadius: 7, background: ['#FF9500', '#34C759', '#007AFF', '#AF52DE', '#FF2D55', '#5AC8FA'][i % 6], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PhoneIcon name="heart" color="#FFFFFF" size={14} /></span>
                  <span style={{ fontSize: 15.5, flex: 1 }}>{x.q}</span>
                  <span style={{ fontSize: 15, color: IOS.gray, maxWidth: '45%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.a}</span>
                  <PhoneIcon name="chevron" color="#C7C7CC" size={14} stroke={2.2} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  ))

  // 4) 명함 — 지갑 카드처럼 겹쳐 있다가 누르면 펼침
  // 4) 명함 — 실제 명함 비율 · 종이 질감, 절반은 사진 (신랑 왼쪽 · 신부 오른쪽, 번갈아). 누르면 살짝 커지며 카톡 프로필로
  if (st === 'card') {
    const latin = titleFontOf(data).latin
    const paper = 'radial-gradient(rgba(0,0,0,0.035) 0.6px, transparent 0.7px) 0 0 / 3px 3px, linear-gradient(140deg, #FDFBF7, #F3EFE8)'
    const ink = `linear-gradient(140deg, ${accent}, color-mix(in srgb, ${accent} 74%, #000))`
    // 은박 느낌 — 빛이 천천히 지나감
    const foil: CSSProperties = { backgroundImage: 'linear-gradient(110deg, #F4F1EA 0%, #FFFFFF 22%, #CFC8BC 38%, #FFFFFF 52%, #E6E0D5 70%, #FFFFFF 100%)', backgroundSize: '220% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'pfFoil 5s ease-in-out infinite' }
    const open = (i: number) => { setPress(i); setTimeout(() => { setPress(null); setProfile(i) }, 220) }
    return wrap('#F2F1EE', (
      <div style={{ padding: '114px 16px 60px' }}>
        <style>{'@keyframes pfCardIn { from { opacity: 0; transform: translateY(26px) rotate(-1.5deg); } to { opacity: 1; transform: none; } } @keyframes pfFoil { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0% 0; } } @media (prefers-reduced-motion: reduce) { .pf-card { animation: none !important; } }'}</style>
        {introHead(16)}
        {ps.map((p, i) => {
          const dark = i === 1
          const name = p.en && latin ? p.en : p.name
          return (
            <button key={p.k} type="button" className="pf-card" onClick={() => open(i)}
              style={{ font: 'inherit', display: 'flex', flexDirection: dark ? 'row-reverse' : 'row', width: '100%', aspectRatio: '1.75 / 1', textAlign: 'left', border: 0, padding: 0, cursor: 'pointer', marginTop: i ? 14 : 0, borderRadius: 10, overflow: 'hidden', position: 'relative', background: dark ? ink : paper, color: dark ? '#FFFFFF' : '#1C1C1E', boxShadow: press === i ? '0 18px 40px rgba(0,0,0,0.22)' : '0 1px 1px rgba(0,0,0,0.05), 0 10px 24px rgba(0,0,0,0.10)', transform: press === i ? 'scale(1.04)' : 'none', transition: 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.22s', animation: `pfCardIn 0.6s cubic-bezier(0.32, 0.72, 0, 1) ${0.08 + i * 0.14}s both` }}>
              {/* 왼쪽 — 사진 (명함 절반) */}
              <span style={{ position: 'relative', width: '44%', height: '100%', flexShrink: 0, overflow: 'hidden', background: dark ? 'rgba(255,255,255,0.08)' : '#E6E0D6' }}>
                {p.photo ? <Photo src={p.photo} crop={p.crop} /> : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 600, opacity: 0.5 }}>{p.name.slice(-2, -1)}</span>}
              </span>
              {/* 오른쪽 — 이름 · 소개 */}
              <span style={{ position: 'relative', flex: 1, minWidth: 0, padding: '16px 26px 14px 18px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.3em', opacity: 0.55 }}>{p.role === '신랑' ? 'GROOM' : 'BRIDE'}</span>
                <span style={{ ...titleCss(data, 25), marginTop: 'auto', lineHeight: 1.08, ...(dark ? foil : null) }}>{name}</span>
                <span style={{ fontSize: 11.5, opacity: 0.65, marginTop: 4 }}>{p.en && latin ? p.name : p.role}</span>
                <span style={{ width: 22, height: 1, background: 'currentColor', opacity: 0.3, margin: '10px 0 8px' }} />
                {p.bio && <span style={{ fontSize: 11.5, lineHeight: 1.5, opacity: 0.85, wordBreak: 'keep-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.bio}</span>}
                <span aria-hidden style={{ position: 'absolute', right: 12, bottom: 10, fontSize: 15, lineHeight: 1, opacity: 0.45 }}>›</span>
              </span>
            </button>
          )
        })}
      </div>
    ))
  }

  // 5) 퀴즈 — 문제를 누르면 정답
  const qs = ps.flatMap(p => p.items.map(x => ({ p, x })))
  return wrap('#FFFFFF', (
    <div style={{ padding: '114px 18px 60px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.26em', color: accent }}>{screenText(data, 'intro', 'eyebrow', 'COUPLE QUIZ')}</div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 6 }}>{screenText(data, 'intro', 'title', `${givenName(data.groom, '신랑')} · ${givenName(data.bride, '신부')} 퀴즈`)}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>{ps.map(p => <span key={p.k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>{avatar(p, 30)}{p.name}</span>)}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {qs.map(({ p, x }, i) => {
          const on = open === i
          return (
            <button key={i} type="button" onClick={() => setOpen(on ? null : i)} style={{ font: 'inherit', textAlign: 'left', border: 0, cursor: 'pointer', borderRadius: 16, padding: '14px 16px', background: on ? `${accent}14` : '#F5F5F7', boxShadow: on ? `inset 0 0 0 1.5px ${accent}` : undefined, transition: 'background 0.2s' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: accent }}>Q{i + 1}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 2 }}>{quizQ(p.role, x.q)}</div>
              <div style={{ fontSize: 14.5, marginTop: 8, color: on ? '#111111' : IOS.gray, filter: on ? 'none' : 'blur(5px)', transition: 'filter 0.3s', userSelect: on ? 'auto' : 'none' }}>{on ? x.a : '눌러서 정답 보기'}</div>
            </button>
          )
        })}
        {!qs.length && empty}
      </div>
    </div>
  ))
}

/** 퀴즈 문장 — '신랑의 MBTI는?' · '신랑이 생각한 서연의 첫인상은?' (받침에 맞춰 은/는) */
function quizQ(role: string, q: string) {
  const last = q.trim().slice(-1)
  const code = last.charCodeAt(0) - 0xac00
  const josa = /[A-Za-z0-9]$/.test(last) ? (/[LMNlmn136780]$/.test(last) ? '은' : '는') : code >= 0 && code < 11172 ? (code % 28 ? '은' : '는') : '는'
  return q.includes('의 ') ? `${role}이 생각한 ${q}${josa}?` : `${role}의 ${q}${josa}?`
}
/** 홈 '커플 소개' 위젯 — 두 사람 사진이 살짝 겹침 */
function IntroWidget({ data, size, variant, t, accent, card, onOpen, editing, ch = GRID.cellH, text }: { data: PhoneData; size: WidgetSize; variant: number; text?: string; t: PhoneTheme; accent: string; card: CSSProperties; onOpen?: () => void; editing: boolean; ch?: number }) {
  const ps = introPeople(data)
  // 1×1 폴더 — 누르면 진짜 폴더처럼 펼쳐짐
  const [folder, setFolder] = useState(false)
  const days = metDays(data)
  const btn: CSSProperties = { cursor: editing ? 'inherit' : 'pointer', font: 'inherit', textAlign: 'left', border: 0 }
  const av = (p: IntroP, sz: number) => (
    <span style={{ width: sz, height: sz, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: `linear-gradient(160deg, ${accent}AA, ${accent})`, boxShadow: `0 0 0 2.5px ${t.card === 'transparent' ? '#FFFFFF' : t.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: sz * 0.38, fontWeight: 600 }}>
      {p.photo ? <Photo src={p.photo} crop={p.crop} /> : p.name.slice(-2, -1)}
    </span>
  )
  const pair = (sz: number) => <span style={{ display: 'flex' }}>{av(ps[0], sz)}<span style={{ marginLeft: -sz * 0.28 }}>{av(ps[1], sz)}</span></span>
  const names = `${givenName(data.groom, '신랑')} ♥ ${givenName(data.bride, '신부')}`
  const line = variant === 1 && days ? `사랑한 지 ${days.toLocaleString()}일` : (ps[0].bio || ps[1].bio || '우리를 소개합니다')
  // 하트 프레임 — 두 사람 사진을 하트 모양으로 오려 살짝 겹침
  if (variant === 2 && size !== 'S') {
    const HEART = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 22'><path d='M12 21.5S.5 14.6.5 6.9A6.2 6.2 0 0 1 12 3.6 6.2 6.2 0 0 1 23.5 6.9C23.5 14.6 12 21.5 12 21.5z'/></svg>\")"
    const heart = (p: IntroP, sz: number, rot: number) => (
      <span style={{ position: 'relative', display: 'block', width: sz, height: sz * 0.92, flexShrink: 0, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.14))' }}>
        <span style={{ position: 'absolute', inset: 0, background: '#FFFFFF', WebkitMaskImage: HEART, maskImage: HEART, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }} />
        <span style={{ position: 'absolute', inset: sz * 0.06, background: `linear-gradient(160deg, ${accent}AA, ${accent})`, WebkitMaskImage: HEART, maskImage: HEART, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', overflow: 'hidden' }}>
          {p.photo && <Photo src={p.photo} crop={p.crop} />}
        </span>
      </span>
    )
    const hs = size === 'H' ? 44 : size === 'W' ? 52 : 70
    const hearts = <span style={{ display: 'flex', alignItems: 'center' }}>{heart(ps[0], hs, -8)}<span style={{ display: 'flex', marginLeft: -hs * 0.24, marginTop: hs * 0.18 }}>{heart(ps[1], hs, 8)}</span></span>
    // 이름 — 홈 화면에서 고른 제목 글꼴 (영문 글꼴이면 영문 이름)
    const tn = titleNames(data)
    // 이름 · 문구는 절대 잘리지 않게 — 말줄임 대신 두 줄 + 길이에 맞춰 글자 크기를 줄임
    const fitFs = (base: number, room: number, str: string) => Math.max(10, Math.min(base, Math.floor((room * 2) / Math.max(1, str.length * 0.62))))
    const script = (fs: number) => text?.trim() ? <span style={{ ...titleCss(data, fitFs(fs, size === 'M' ? 150 : 210, text.trim())), lineHeight: 1.15, color: t.cardInk, textAlign: size === 'M' ? 'center' : 'left', wordBreak: 'keep-all', overflowWrap: 'anywhere', maxWidth: '100%' }}>{text}</span> : <span style={{ ...titleCss(data, fs), lineHeight: 1.1, color: t.cardInk, whiteSpace: 'nowrap' }}>{tn.a}<span style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 0.28em', transform: 'translateY(-0.06em)' }}><PhoneIcon name="heart" color={accent} size={Math.round(fs * 0.42)} /></span>{tn.b}</span>
    if (size === 'M') return (
      <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {hearts}
        {script(Math.min(19, Math.round(250 / Math.max(10, tn.a.length + tn.b.length + 3))))}
      </button>
    )
    return (
      <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: size === 'H' ? '0 10px' : '0 18px', display: 'flex', alignItems: 'center', justifyContent: size === 'H' ? 'center' : undefined, gap: size === 'H' ? 7 : 14 }}>
        {hearts}
        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {size === 'H' ? (text?.trim()
            ? <span style={{ ...titleCss(data, fitFs(12, 52, text.trim())), color: t.cardInk, lineHeight: 1.18, wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>{text}</span>
            // 이름 두 줄 — '지훈' / '& 서연'
            : <span style={{ ...titleCss(data, fitFs(12.5, 52, givenName(data.groom, '신랑') + givenName(data.bride, '신부'))), color: t.cardInk, lineHeight: 1.22, whiteSpace: 'nowrap' }}>{givenName(data.groom, '신랑')}<br /><span style={{ opacity: 0.55 }}>&amp;</span> {givenName(data.bride, '신부')}</span>) : script(Math.min(22, Math.round(300 / Math.max(10, tn.a.length + tn.b.length + 3))))}
          {size === 'W' && days && <span style={{ fontSize: 11.5, color: t.cardSub }}>사랑한 지 {days.toLocaleString()}일</span>}
        </span>
      </button>
    )
  }
  // 연애 카운터 — 두 프로필을 잇는 점선, 가운데서 뛰는 하트, 다음 기념일까지
  if (variant === 3 && size !== 'S') {
    const d = days || 0
    const next = (Math.floor(d / 100) + 1) * 100
    const beat = <style>{'@keyframes pfLove { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.25); } 30% { transform: scale(0.95); } 45% { transform: scale(1.12); } } @media (prefers-reduced-motion: reduce) { .pf-love { animation: none !important; } }'}</style>
    const link = (sz: number, gap: number) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {av(ps[0], sz)}
        <span style={{ position: 'relative', width: gap, height: sz, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ position: 'absolute', left: 2, right: 2, top: '50%', borderTop: `1.5px dashed ${t.cardSub}`, opacity: 0.5 }} />
          <span className="pf-love" style={{ position: 'relative', display: 'flex', animation: 'pfLove 1.4s ease-in-out infinite' }}><PhoneIcon name="heart" color={accent} size={Math.round(sz * 0.32)} /></span>
        </span>
        {av(ps[1], sz)}
      </span>
    )
    if (size === 'H') return (
      <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {beat}{link(30, 22)}
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9.5, color: t.cardSub, whiteSpace: 'nowrap' }}>사랑한 지</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}><span style={numCss(data, 12)}>{d ? d.toLocaleString() : '—'}</span><span style={{ fontSize: 10.5, fontWeight: 600 }}>일</span></span>
        </span>
      </button>
    )
    if (size === 'W') return (
      <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        {beat}{link(40, 40)}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}><span style={{ fontSize: 11.5, color: t.cardSub }}>사랑한 지</span><span style={numCss(data, 16)}>{d ? d.toLocaleString() : '—'}</span><span style={{ fontSize: 12, fontWeight: 600 }}>일</span></span>
          {d > 0 && <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>{next.toLocaleString()}일까지 {next - d}일</span>}
        </span>
      </button>
    )
    return (
      <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center' }}>
        {beat}{link(46, 36)}
        <span>
          <span style={{ display: 'block', fontSize: 11, color: t.cardSub }}>사랑한 지</span>
          <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, marginTop: 2 }}><span style={numCss(data, 22)}>{d ? d.toLocaleString() : '—'}</span><span style={{ fontSize: 13, fontWeight: 600 }}>일</span></span>
          {d > 0 && <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10.5, fontWeight: 600, color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)`, padding: '3px 8px', borderRadius: 999 }}>{next.toLocaleString()}일까지 D-{next - d}</span>}
        </span>
      </button>
    )
  }
  if (size === 'S') {
    // 1×1 — 폰 폴더처럼: 반투명 칸 안에 두 사람 사진, 아래 이름
    const ic = Math.max(40, Math.min(64, ch - 10))
    return (
      <>
      <button type="button" onClick={() => { if (!editing) setFolder(true) }} aria-label="커플 소개" style={{ ...btn, width: '100%', height: '100%', background: 'transparent', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ width: ic, height: ic, borderRadius: ic * 0.27, background: t.card === 'transparent' ? 'rgba(255,255,255,0.35)' : t.card, boxShadow: `inset 0 0 0 1px ${t.cardBorder}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: ic * 0.06, padding: ic * 0.09, boxSizing: 'border-box', alignContent: 'center' }}>
          {ps.map(p => (
            <span key={p.k} style={{ aspectRatio: '1', borderRadius: '28%', overflow: 'hidden', background: `linear-gradient(160deg, ${accent}AA, ${accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: ic * 0.16, fontWeight: 700 }}>
              {p.photo ? <Photo src={p.photo} crop={p.crop} /> : p.name.slice(-2, -1)}
            </span>
          ))}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, color: t.labelInk, whiteSpace: 'nowrap' }}>커플 소개</span>
      </button>
      {folder && (<PfOverlay>
        // 펼친 폴더 — 홈 위에 흐린 막, 가운데 둥근 판에 두 사람 아이콘
        <div onClick={() => setFolder(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,20,20,0.3)', backdropFilter: 'blur(26px) saturate(1.4)', WebkitBackdropFilter: 'blur(26px) saturate(1.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, animation: 'pfFadeIn 0.25s ease' }}>
          <style>{'@keyframes pfFadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes pfFolder { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: none; } }'}</style>
          {/* 폴더 이름 — 폰 폴더처럼 판 위 왼쪽, 시스템 글꼴 굵게 */}
          <span style={{ width: 300, padding: '0 6px', boxSizing: 'border-box', textAlign: 'center', fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif", fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textShadow: '0 1px 8px rgba(0,0,0,0.18)', animation: 'pfFadeIn 0.3s ease' }}>커플 소개</span>
          <div onClick={e => e.stopPropagation()} style={{ width: 300, borderRadius: 38, padding: '24px 18px 18px', boxSizing: 'border-box', background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: 'inset 0 1px 0.5px rgba(255,255,255,0.55)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', rowGap: 16, animation: 'pfFolder 0.38s cubic-bezier(0.32, 0.72, 0, 1)' }}>
            {ps.map(p => (
              <button key={p.k} type="button" onClick={() => { setFolder(false); onOpen?.() }} style={{ ...btn, background: 'transparent', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 62, height: 62, borderRadius: 15, overflow: 'hidden', background: `linear-gradient(160deg, ${accent}AA, ${accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 24, fontWeight: 600 }}>
                  {p.photo ? <Photo src={p.photo} crop={p.crop} /> : p.name.slice(-2, -1)}
                </span>
                <span style={{ fontFamily: "var(--pf-body, 'Pretendard Variable'), 'Pretendard', sans-serif", fontSize: 11.5, fontWeight: 500, color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>{p.role} {givenName(data[p.k], p.role)}</span>
              </button>
            ))}
          </div>
        </div>
      </PfOverlay>)}
      </>
    )
  }
  if (size === 'H') return (
    <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
      {pair(34)}
      {variant === 1 && days ? (
        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: accent, letterSpacing: '0.02em' }}><PhoneIcon name="heart" color={accent} size={9} />사랑한 지</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}><span style={numCss(data, 13)}>{days.toLocaleString()}</span><span style={{ fontSize: 11, fontWeight: 600 }}>일</span></span>
        </span>
      ) : (
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, wordBreak: 'keep-all' }}>{names}</span>
          <span style={{ display: 'block', fontSize: 10.5, color: t.cardSub }}>커플 소개</span>
        </span>
      )}
    </button>
  )
  if (size === 'W') return (
    <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      {pair(46)}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{names}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: t.cardSub, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line}</span>
      </span>
      <PhoneIcon name="chevron" color={t.cardSub} size={15} stroke={2.2} />
    </button>
  )
  return (
    <button type="button" onClick={onOpen} style={{ ...card, ...btn, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center' }}>
      {pair(62)}
      <span>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{names}</span>
        <span style={{ fontSize: 11.5, color: variant === 1 ? accent : t.cardSub, fontWeight: variant === 1 ? 700 : 400, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{line}</span>
      </span>
    </button>
  )
}

/* ───────── 한 화면 묶음 (하객용 흐름) ───────── */
// 진짜 폰처럼: 잠금화면이 위로 밀려 올라가고 홈이 살짝 커졌다 제자리로, 앱은 작게 시작해 펼쳐진다
const FLOW_CSS = `
@keyframes pfLockOut { from { transform: translateY(var(--pf-from, 0px)); } to { transform: translateY(-100%); } }
@keyframes pfHomeIn { from { transform: scale(1.08); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pfAppIn { from { transform: scale(0.86); opacity: 0; border-radius: 44px; } to { transform: scale(1); opacity: 1; border-radius: 0; } }
@keyframes pfSpin { to { transform: rotate(360deg); } }
@keyframes pfEq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
@keyframes pfPing { 0% { transform: scale(1); opacity: 0.9; } 100% { transform: scale(1.6); opacity: 0; } }
@keyframes pfHomeBack { from { transform: scale(1.04); } to { transform: scale(1); } }
@keyframes pfAppOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.9); opacity: 0; border-radius: 44px; } }
.pf-lock-out { animation: pfLockOut 0.5s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
.pf-home-in { animation: pfHomeIn 0.55s cubic-bezier(0.32, 0.72, 0, 1) both; }
.pf-app-in { animation: pfAppIn 0.42s cubic-bezier(0.32, 0.72, 0, 1) both; overflow: hidden; }
.pf-home-back { animation: pfHomeBack 0.4s cubic-bezier(0.32, 0.72, 0, 1) both; }
.pf-app-out { animation: pfAppOut 0.34s cubic-bezier(0.32, 0.72, 0, 1) both; overflow: hidden; z-index: 5; }
@media (prefers-reduced-motion: reduce) { .pf-lock-out, .pf-home-in, .pf-app-in, .pf-home-back { animation: none; } .pf-app-out { display: none; } }
`

const isAppScreen = (s: PhoneScreenId | 'code'): s is PhoneAppId => s !== 'lock' && s !== 'code' && s !== 'home'

export function PhoneFlow({ data, height, renderRsvp, startScreen = 'lock', invitationId, photoShareHref, onScreen }: { data: PhoneData; height: number | string; renderRsvp?: RenderRsvp; startScreen?: PhoneScreenId; invitationId?: string; photoShareHref?: string | null; /** 화면이 바뀔 때 (에디터 미리보기 — 왼쪽 목록을 따라 바꿈) */ onScreen?: (s: PhoneScreenId) => void }) {
  const [screen, setScreen] = useState<PhoneScreenId | 'code'>(startScreen)
  // 처음 열 때만 잠금화면 등장 연출 — 잠금화면을 떠나거나 6초 지나면 끝
  const [intro, setIntro] = useState(startScreen === 'lock')
  useEffect(() => { if (!intro) return; const id = setTimeout(() => setIntro(false), 7000); return () => clearTimeout(id) }, [intro])
  useEffect(() => { if (screen !== 'lock') setIntro(false) }, [screen])
  // 화면 사이를 옮겨 다닌 길 — 뒤로 가기는 이전 화면으로, 처음 화면에서는 홈으로
  const [hist, setHist] = useState<PhoneAppId[]>([])
  // 잠금화면 검색에서 고른 화면 — 비밀번호를 연 뒤 그 화면으로
  const pendingApp = useRef<PhoneAppId | null>(null)
  // 검색창 · 폴더 · 잠금화면에서 연 화면 — 뒤로 가면 그곳으로 (검색 · 폴더는 다시 열린 채)
  const backTo = useRef<{ screen: 'lock' | 'home'; key: string } | null>(null)
  const [reopen, setReopen] = useState<string | null>(null)
  const goBack = () => {
    const cur = isAppScreen(screen) ? screen : null
    setPlainIn(false)
    if (hist.length) { const prev = hist[hist.length - 1]; setHist(h => h.slice(0, -1)); setAnim(null); setUnder(cur); setScreen(prev); return }
    const b = backTo.current
    backTo.current = null
    setUnder(null); setLeaving(cur)
    if (b) { setReopen(b.key || null); setAnim(null); setScreen(b.screen); return }
    setReopen(null); setAnim('back'); setScreen('home')
  }
  // 화면을 덮는 창이 열린 수 — 0 보다 크면 음악 버튼 숨김
  const [chromeHide, setChromeHide] = useState(0)
  const bumpChrome = useRef((d: number) => setChromeHide(n => Math.max(0, n + d))).current
  // 하객 화면 — 앱을 열 때마다 브라우저 기록에 한 칸. 안드로이드 뒤로 · 아이폰 왼쪽 끝 밀기 · 브라우저 뒤로가 청첩장 안에서 한 단계 뒤로
  const goBackRef = useRef(goBack)
  useEffect(() => { goBackRef.current = goBack })
  const histDepth = useRef(0)
  const ignorePop = useRef(0)
  useEffect(() => {
    if (!invitationId) return
    const want = isAppScreen(screen) ? 1 + hist.length : 0
    if (want > histDepth.current) { while (histDepth.current < want) { histDepth.current += 1; window.history.pushState({ ...(window.history.state || {}), pfDepth: histDepth.current }, '') } }
    else if (want < histDepth.current) { const n = histDepth.current - want; histDepth.current = want; ignorePop.current += 1; window.history.go(-n) }
  }, [screen, hist.length, invitationId])
  useEffect(() => {
    if (!invitationId) return
    const onPop = () => {
      if (ignorePop.current) { ignorePop.current -= 1; return }
      if (histDepth.current > 0) { histDepth.current -= 1; goBackRef.current() }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [invitationId])
  // 왼쪽 끝에서 오른쪽으로 밀어 뒤로 — 손가락을 따라 화면이 밀려나고, 3분의 1 넘게 밀면 뒤로
  const [swipe, setSwipe] = useState(0)
  // 처음 앱을 열었을 때 한 번만 — 밀어서 뒤로 갈 수 있다는 짧은 안내 (하객 화면, 방문마다 한 번)
  const [swipeHint, setSwipeHint] = useState(false)
  useEffect(() => {
    if (!invitationId || !isAppScreen(screen)) return
    const key = `pf-swipe-hint-${invitationId}`
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1') } catch { return }
    const t0 = setTimeout(() => setSwipeHint(true), 450)
    const t1 = setTimeout(() => setSwipeHint(false), 3400)
    return () => { clearTimeout(t0); clearTimeout(t1) }
  }, [screen, invitationId])
  const [swiping, setSwiping] = useState(false)
  // 손으로 밀기 시작하면 안내는 바로 끝
  useEffect(() => { if (swiping) setSwipeHint(false) }, [swiping])
  const [nudging, setNudging] = useState(false)
  useEffect(() => {
    if (!swipeHint) return
    let raf = 0
    const t0 = performance.now()
    const ease = (x: number) => x * x * (3 - 2 * x)
    setNudging(true)
    const tick = (now: number) => {
      const u = (now - t0) / 1000 - 0.15
      let off = 0
      ;[[0, 30], [0.8, 20]].forEach(([at, amp]) => { const v = (u - at) / 0.7; if (v >= 0 && v <= 1) off = Math.max(off, Math.sin(Math.PI * ease(v)) * amp) })
      if (swipeSt.current?.on) { setNudging(false); return }
      setSwipe(off)
      if (u < 1.6) raf = requestAnimationFrame(tick)
      else { setSwipe(0); setNudging(false) }
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); setNudging(false) }
  }, [swipeHint])
  const swipeSt = useRef<{ x: number; y: number; sc: number; on: boolean } | null>(null)
  const swipeToHome = !hist.length && (!backTo.current || backTo.current.screen === 'home')
  // 화면 왼쪽 절반 어디서 시작해도 오른쪽으로 밀면 뒤로 (설계 px).
  // 단, 옆으로 밀리는 칸(사진 넘기기 등) · 입력칸 · data-noswipe 위에서는 그 동작을 우선 — 맨 왼쪽 끝(EDGE)은 언제나 뒤로
  const EDGE = 24
  const swipeOk = (target: EventTarget | null, xDesign: number) => {
    if (xDesign <= EDGE) return true
    if (xDesign > PHONE_W / 2) return false
    let el = target as HTMLElement | null
    const root = rootRef.current
    while (el && el !== root) {
      if (el.dataset?.noswipe !== undefined || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false
      // 옆으로 넘기는 칸 — 가로로 꽤 넘치고, 세로로는 안 넘치거나(가로 전용) 가로 스냅이 걸린 곳 (세로 스크롤 화면은 해당 없음)
      if (el.scrollWidth > el.clientWidth + 24) {
        const cs = getComputedStyle(el)
        if (/auto|scroll/.test(cs.overflowX) && (el.scrollHeight <= el.clientHeight + 4 || /x|both/.test(cs.scrollSnapType))) return false
      }
      el = el.parentElement
    }
    return true
  }
  const onSwipeDown = (e: React.PointerEvent) => {
    // 손가락은 아래 터치 처리(touchmove 를 막아야 안드로이드 · 카카오톡이 가로 밀기를 가져가지 않음), 여기는 마우스만
    if (e.pointerType !== 'mouse') return
    if (!isAppScreen(screen) || anim) return
    const r = rootRef.current?.getBoundingClientRect()
    if (!r) return
    const sc = r.width / PHONE_W || 1
    if (chromeHide > 0 || !swipeOk(e.target, (e.clientX - r.left) / sc)) return
    swipeSt.current = { x: e.clientX, y: e.clientY, sc, on: false }
  }
  const onSwipeMove = (e: React.PointerEvent) => {
    const st = swipeSt.current
    if (!st) return
    const dx = (e.clientX - st.x) / st.sc, dy = (e.clientY - st.y) / st.sc
    if (!st.on) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { swipeSt.current = null; return }
      if (dx < 8) return
      st.on = true; setSwiping(true)
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* noop */ }
    }
    setSwipe(Math.max(0, dx))
  }
  const onSwipeUp = () => {
    const st = swipeSt.current
    swipeSt.current = null
    if (!st?.on) return
    setSwiping(false)
    if (swipe > PHONE_W * 0.33) {
      setSwipe(PHONE_W)
      setTimeout(() => { goBack(); setLeaving(null); setUnder(null); setAnim(null); setSwipe(0) }, 180)
    } else setSwipe(0)
  }
  // 손가락 밀기 — 직접 터치 이벤트로 받고, 밀기가 시작되면 브라우저의 가로 동작을 막음 (passive: false)
  const swipeLive = useRef({ swipe: 0, canStart: false })
  useEffect(() => { swipeLive.current = { swipe, canStart: isAppScreen(screen) && !anim && chromeHide === 0 } })
  const swipeOkRef = useRef(swipeOk)
  useEffect(() => { swipeOkRef.current = swipeOk })
  const onSwipeUpRef = useRef(onSwipeUp)
  useEffect(() => { onSwipeUpRef.current = onSwipeUp })
  useEffect(() => {
    const root = rootRef.current
    if (!root || !invitationId) return
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !swipeLive.current.canStart) return
      const r = root.getBoundingClientRect(), t = e.touches[0]
      const sc = r.width / PHONE_W || 1
      if (!swipeOkRef.current(e.target, (t.clientX - r.left) / sc)) return
      swipeSt.current = { x: t.clientX, y: t.clientY, sc, on: false }
    }
    const move = (e: TouchEvent) => {
      const st = swipeSt.current
      if (!st) return
      const t = e.touches[0]
      const dx = (t.clientX - st.x) / st.sc, dy = (t.clientY - st.y) / st.sc
      if (!st.on) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { swipeSt.current = null; return }
        if (dx < 6) return
        st.on = true; setSwiping(true)
      }
      if (e.cancelable) e.preventDefault()
      setSwipe(Math.max(0, dx))
    }
    const end = () => { onSwipeUpRef.current() }
    root.addEventListener('touchstart', start, { passive: true })
    root.addEventListener('touchmove', move, { passive: false })
    root.addEventListener('touchend', end)
    root.addEventListener('touchcancel', end)
    return () => { root.removeEventListener('touchstart', start); root.removeEventListener('touchmove', move); root.removeEventListener('touchend', end); root.removeEventListener('touchcancel', end) }
  }, [invitationId])
  const onScreenRef = useRef(onScreen)
  useEffect(() => { onScreenRef.current = onScreen })
  useEffect(() => { if (screen !== 'code') onScreenRef.current?.(screen) }, [screen])
  // D-Day 팝업 — 열고 0.8초 뒤 (기간 · 오늘 하루 안 보기는 ddayPopupDue 가 판단)
  const [ddayOn, setDdayOn] = useState(false)
  useEffect(() => {
    if (!invitationId) return
    const t = setTimeout(() => { if (ddayPopupDue(data)) setDdayOn(true) }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationId])
  // 방명록 — 다른 템플릿과 같은 /api/guestbook
  // 샘플 청첩장은 예시 축하 글을 보여 주고, 남긴 글은 이 화면에만 (서버로 보내지 않음)
  const isSampleInv = !!invitationId && invitationId.startsWith('sample')
  const [gb, setGb] = useState<GbMsg[] | null>(isSampleInv ? GB_SAMPLE : null)
  useEffect(() => {
    if (!invitationId || isSampleInv) return
    let off = false
    fetch(`/api/guestbook?invitationId=${invitationId}`).then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => { if (!off) setGb((d.data || d.messages || []).map((m: any) => ({ id: String(m.id), name: m.guest_name, message: m.message, at: m.created_at }))) })
      .catch(() => { if (!off) setGb([]) })
    return () => { off = true }
  }, [invitationId, isSampleInv])
  const postGb = async (name: string, message: string) => {
    if (!invitationId) return false
    if (isSampleInv) { setGb(prev => [{ id: `me-${Date.now()}`, name, message, at: new Date().toISOString(), mine: true }, ...(prev || [])]); return true }
    try {
      const res = await fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId, guestName: name, message }) })
      if (!res.ok) return false
      setGb(prev => [{ id: `me-${Date.now()}`, name, message, at: new Date().toISOString(), mine: true }, ...(prev || [])])
      return true
    } catch { return false }
  }
  // 배경음악 — 설정한 음악 (예전 노래 위젯의 음악도 받아 줌). 잠금 해제(손가락 터치) 때 자동 재생
  const bgmOn = !!(data.bgm?.enabled && data.bgm.url)
  const audioUrl = bgmOn ? data.bgm!.url : data.phone.widgets.find(w => w.type === 'music' && w.props.audio)?.props.audio
  const autoplay = bgmOn && data.bgm!.autoplay !== false
  const [hint, setHint] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => () => { audioRef.current?.pause() }, [])
  const toggleMusic = () => {
    if (!audioUrl) return
    if (!audioRef.current || audioRef.current.src !== new URL(audioUrl, window.location.href).href) {
      audioRef.current?.pause()
      audioRef.current = new Audio(audioUrl)
      audioRef.current.loop = true
      audioRef.current.onpause = () => setPlaying(false)
      audioRef.current.onplay = () => setPlaying(true)
    }
    if (audioRef.current.paused) { audioRef.current.play().catch(() => setPlaying(false)); try { localStorage.setItem('musicEnabled', 'true') } catch { /* noop */ } }
    else { audioRef.current.pause(); try { localStorage.setItem('musicEnabled', 'false') } catch { /* noop */ } }
  }
  /** 잠금을 풀 때 — 사용자가 끈 적이 없으면 음악을 켠다 */
  const startMusic = () => {
    if (!audioUrl) return
    let off = false
    try { off = localStorage.getItem('musicEnabled') === 'false' } catch { /* noop */ }
    if (autoplay && !off) { if (!audioRef.current || audioRef.current.paused) toggleMusic() }
    else if (bgmOn && data.bgm!.showNotification) { setHint(true); setTimeout(() => setHint(false), 4000) }
  }
  const [anim, setAnim] = useState<'unlock' | 'home' | 'back' | 'reveal' | null>(null)
  // 화면 전환 중 까만 바탕이 보이지 않게 — 새 화면이 커지며 나타나는 동안 이전 화면(홈 · 앱)을 뒤에 남겨 두고,
  // 뒤로 갈 때는 나가는 앱이 홈 위에서 작아지며 사라짐
  const [under, setUnder] = useState<PhoneAppId | 'home' | null>(null)
  const [leaving, setLeaving] = useState<PhoneAppId | null>(null)
  const [plainIn, setPlainIn] = useState(false)
  const [lockOut, setLockOut] = useState(false)
  const [drag, setDrag] = useState(0)
  const next: PhoneScreenId | 'code' = data.phone.usePasscode && data.wedding.date ? 'code' : 'home'

  /** 밀어서 열 때 전체 화면 — 손가락 동작 안에서만 허락됨. 지원 안 하는 기기(아이폰 등)는 조용히 넘어감 */
  const goFullscreen = () => {
    if (!invitationId || data.phone.fullscreen === false) return
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
    if (document.fullscreenElement) return
    try {
      if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'show' }).catch(() => {})
      else el.webkitRequestFullscreen?.()
    } catch { /* 지원 안 함 */ }
  }
  useEffect(() => {
    if (!invitationId) return
    window.addEventListener('pf-open-gesture', goFullscreen)
    // 휴대폰에서 전체 화면이 거절됐거나(앱 안 브라우저가 가끔 거절) 뒤로 가기로 풀렸으면 — 다음 터치 때 다시
    const retap = () => { if (screen !== 'lock' && !document.fullscreenElement && window.matchMedia('(pointer: coarse)').matches) goFullscreen() }
    window.addEventListener('click', retap, true)
    return () => { window.removeEventListener('pf-open-gesture', goFullscreen); window.removeEventListener('click', retap, true) }
  })
  // 주소창 색 — 지금 화면 맨 위 색을 브라우저 바에 (하객 화면만)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!invitationId) return
    const pick = () => {
      const root = rootRef.current
      if (!root) return
      const r = root.getBoundingClientRect()
      let el = document.elementFromPoint(r.left + r.width / 2, r.top + 3) as HTMLElement | null
      let color = ''
      while (el && el !== root.parentElement) {
        const cs = getComputedStyle(el)
        if (el.tagName === 'IMG' || /url\(/.test(cs.backgroundImage)) { color = '#1A1816'; break }
        const bg = cs.backgroundColor
        if (bg && bg !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(bg)) { color = bg; break }
        el = el.parentElement
      }
      if (!color) return
      let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
      if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta) }
      meta.content = color
      document.documentElement.style.backgroundColor = color
      // 전체 화면의 카메라 구멍 띠(위쪽)도 같은 색으로 — InvitationClientPhone 이 씀
      document.documentElement.style.setProperty('--pf-top', color)
    }
    const id = setTimeout(pick, 520)
    return () => clearTimeout(id)
  }, [invitationId, screen, anim])

  const unlock = (from = 0) => {
    goFullscreen()
    startMusic()
    setDrag(from)
    setLockOut(true)
    setAnim('unlock')
    setScreen(next)
  }

  /** 잠금화면 검색에서 화면 바로 열기 — 비밀번호 없이 (홈은 여전히 비밀번호로 열림) */
  const lockOpen = (a: PhoneAppId) => { goFullscreen(); startMusic(); setDrag(0); setLockOut(true); setAnim(null); setHist([]); setUnder(null); setLeaving(null); setPlainIn(true); setScreen(a) }
  const showHomeBehind = screen === 'lock' && drag < 0 && next === 'home'
  return (
    <ChromeHideCtx.Provider value={bumpChrome}>
    <PhotoShareCtx.Provider value={photoShareHref ?? null}>
    <GuestbookCtx.Provider value={invitationId ? { list: gb || [], post: postGb } : null}>
    <MusicCtx.Provider value={{ playing, toggle: toggleMusic, has: !!audioUrl }}>
    <div ref={rootRef} style={{ position: 'relative', width: PHONE_W, height, overflow: 'hidden', background: '#000' }}>
      <style>{FLOW_CSS}</style>
      {/* 밀어서 뒤로 · 처음 안내 동안엔 뒤 화면을 계속 그려 둠 (밀었다 돌아올 때마다 새로 그리면 깜빡임) */}
      {(screen === 'home' || showHomeBehind || under === 'home' || ((swipe > 0 || nudging || swipeHint) && swipeToHome)) && (
        <div aria-hidden={screen !== 'home' && under === 'home' ? true : undefined} className={screen === 'home' ? (anim === 'unlock' || anim === 'home' ? 'pf-home-in' : anim === 'back' ? 'pf-home-back' : undefined) : undefined}
          style={{ position: 'absolute', inset: 0, ...(screen !== 'home' && under === 'home' ? { pointerEvents: 'none' } : null), ...(showHomeBehind ? { transform: `scale(${1.08 + (drag / 844) * 0.08})`, opacity: Math.min(1, -drag / 300) } : null) }}
          onAnimationEnd={() => setAnim(null)}>
          <ReturnCtx.Provider value={{ startOpen: reopen, go: (a, key) => { backTo.current = { screen: 'home', key }; setReopen(null); setAnim(null); setHist([]); setLeaving(null); setPlainIn(false); setUnder('home'); setScreen(a) } }}>
          <HomeScreen data={data} reveal={anim === 'reveal' || anim === 'unlock'} onOpenApp={a => { backTo.current = null; setReopen(null); setAnim(null); setHist([]); setLeaving(null); setPlainIn(false); setUnder('home'); setScreen(a) }} />
          </ReturnCtx.Provider>
        </div>
      )}
      {screen === 'code' && (
        <div className={anim === 'unlock' ? 'pf-home-in' : undefined} style={{ position: 'absolute', inset: 0 }} onAnimationEnd={() => setAnim(null)}>
          <PasscodeScreen data={data} onDone={() => { const a = pendingApp.current; pendingApp.current = null; if (a) { setAnim(null); setHist([]); setScreen(a) } else { setAnim('reveal'); setScreen('home') } }} onCancel={() => { setAnim(null); setScreen('lock') }} />
        </div>
      )}
      {/* 앱 화면들 — 같은 key 로 이어 그려서 이전 화면이 다시 마운트되지 않음 (스크롤 유지) */}
      {[
        ...(under && under !== 'home' && under !== screen ? [{ a: under, role: 'under' as const }] : []),
        ...((swipe > 0 || nudging || swipeHint) && hist.length && !(under && under !== 'home') ? [{ a: hist[hist.length - 1], role: 'under' as const }] : []),
        ...(isAppScreen(screen) ? [{ a: screen, role: 'cur' as const }] : []),
        ...(leaving && leaving !== screen ? [{ a: leaving, role: 'out' as const }] : []),
      ].map(({ a, role }) => (
        <div key={a} aria-hidden={role !== 'cur' ? true : undefined}
          className={role === 'cur' ? (plainIn ? undefined : 'pf-app-in') : role === 'out' ? 'pf-app-out' : undefined}
          style={{ position: 'absolute', inset: 0, ...(role !== 'cur' ? { pointerEvents: 'none' } : null),
            // 들어올 때 애니메이션(transform 고정)이 손가락 따라가기를 덮지 않게 끔 · 끄는 동안 글자 선택 막음
            ...(role === 'cur' && swipe > 0 ? { transform: `translateX(${swipe}px)`, animation: 'none', transition: swiping || nudging ? 'none' : 'transform 0.2s ease-out', boxShadow: '-12px 0 30px rgba(0,0,0,0.18)', zIndex: 3, userSelect: 'none', WebkitUserSelect: 'none' } : null),
            ...(role === 'cur' ? { touchAction: 'pan-y' } : null) }}
          onPointerDown={role === 'cur' && invitationId ? onSwipeDown : undefined} onPointerMove={role === 'cur' && invitationId ? onSwipeMove : undefined}
          onPointerUp={role === 'cur' && invitationId ? onSwipeUp : undefined} onPointerCancel={role === 'cur' && invitationId ? onSwipeUp : undefined}
          onAnimationEnd={e => { if (e.target !== e.currentTarget) return; if (role === 'cur') setUnder(null); else if (role === 'out') setLeaving(null) }}>
          <AppScreen key={a} app={a} data={data} onBack={goBack} onNavigate={n => { setHist(h => [...h, a]); setPlainIn(false); setUnder(a); setScreen(n) }} renderRsvp={renderRsvp} />
        </div>
      ))}
      {screen === 'lock' && (
        <div className={intro ? 'pf-intro' : undefined} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          {intro && <style>{LOCK_INTRO_CSS}</style>}
          <LockIntroCtx.Provider value={intro}>
          <ReturnCtx.Provider value={{ startOpen: reopen, go: (a, key) => { backTo.current = { screen: 'lock', key }; setReopen(null); lockOpen(a) } }}>
          <LockScreen data={data} cameraHref={photoShareHref ?? null} onOpen={() => { setReopen(null); unlock(0) }} onOpenVenue={() => { if (next !== 'home') return unlock(0); backTo.current = { screen: 'lock', key: '' }; setDrag(0); setLockOut(true); setAnim(null); setUnder(null); setLeaving(null); setPlainIn(true); setScreen('memo') }}
            onOpenApp={lockOpen} />
          </ReturnCtx.Provider>
          </LockIntroCtx.Provider>
        </div>
      )}
      {/* 배경음악 버튼 — 잠금 해제 뒤 오른쪽 위 */}
      {swipeHint && isAppScreen(screen) && (
        <div aria-hidden style={{ position: 'absolute', left: swipe, top: 0, bottom: 0, width: 240, zIndex: 25, pointerEvents: 'none', animation: 'pfSwHint 2.95s ease both' }}>
          <style>{'@keyframes pfSwHint { 0% { opacity: 0; } 12% { opacity: 1; } 84% { opacity: 1; } 100% { opacity: 0; } } @keyframes pfSwArrow { 0%, 100% { transform: translateX(0); opacity: 0.55; } 50% { transform: translateX(4px); opacity: 1; } }'}</style>
          {/* 왼쪽 끝 — 포인트 색이 은은하게 번짐 */}
          <span style={{ position: 'absolute', left: 0, top: '50%', width: 110, height: 300, transform: 'translateY(-50%)', background: `radial-gradient(ellipse 100% 50% at 0% 50%, ${data.phone.accent}66 0%, ${data.phone.accent}26 45%, ${data.phone.accent}00 75%)` }} />
          <span style={{ position: 'absolute', left: 26, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px 0 10px', borderRadius: 17, background: 'rgba(255,255,255,0.96)', boxShadow: '0 3px 12px rgba(0,0,0,0.14)', color: data.phone.accent, fontFamily: SYS, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ animation: 'pfSwArrow 0.9s ease-in-out infinite' }}><path d="M6 6l6 6-6 6M13 6l6 6-6 6" fill="none" stroke={data.phone.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            밀어서 돌아가기
          </span>
        </div>
      )}
      {audioUrl && screen !== 'lock' && screen !== 'code' && chromeHide === 0 && (
        // 앱 화면에서는 왼쪽 위 '뒤로'(top 52, 40px)와 같은 줄 가운데에 맞춤
        <div style={{ position: 'absolute', top: screen === 'home' ? 8 : 55, right: screen === 'home' ? 8 : 14, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          {hint && <span style={{ padding: '7px 11px', borderRadius: 999, background: 'rgba(20,20,20,0.82)', color: '#FFFFFF', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{data.bgm?.notificationText || '배경음악이 준비되어 있어요'}</span>}
          <button type="button" onClick={toggleMusic} aria-label={playing ? '배경음악 끄기' : '배경음악 켜기'}
            style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.88)', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {hint && <span style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)', animation: 'pfPing 1.2s ease-out infinite' }} />}
            {playing
              ? <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>
        </div>
      )}
      {lockOut && screen !== 'lock' && (
        <div className="pf-lock-out" style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', ['--pf-from' as string]: `${drag}px` }}
          onAnimationEnd={() => { setLockOut(false); setDrag(0) }}>
          <LockScreen data={data} cameraHref={photoShareHref ?? null} />
        </div>
      )}
    </div>
    {ddayOn && <DdayPhonePopup data={data} onClose={() => setDdayOn(false)} />}
    </MusicCtx.Provider>
    </GuestbookCtx.Provider>
    </PhotoShareCtx.Provider>
    </ChromeHideCtx.Provider>
  )
}
