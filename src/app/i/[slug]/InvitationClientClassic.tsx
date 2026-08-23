'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'
import { DISPLAY_FONTS, KOREAN_FONTS } from '@/app/editor/the-simple/fontOptions'
import ClassicRsvpForm from './ClassicRsvpForm'
import ClassicLightbox from './ClassicLightbox'
import DdayPopupOverlay from '@/components/dday/DdayPopupOverlay'
import { normalizeDdayPopup } from '@/lib/ddayPopupNormalize'
import '@/components/dday/dday-popup.css'

/**
 * THE CLASSIC (혼주용) — 클래식 스테이셔너리 청첩장
 * 디자인: Clara & Elliot 핸드오프 (14 씬). P1 = 정적 구조(애니메이션 제외).
 * 콘텐츠 모델은 매거진과 동일(content.groom/bride/wedding/content/gallery ...).
 */

interface Props {
  invitation: Invitation
  content: InvitationContent | null
  isPaid?: boolean
  isPreview?: boolean
  overrideColorTheme?: string
  overrideFontStyle?: string
  skipIntro?: boolean
  introClickAdvance?: boolean // 풀스크린 미리보기: 프리뷰여도 클릭/스크롤로 본문 전환 허용
  guestInfo?: unknown
  isSample?: boolean
}

// ===== 디자인 토큰 (기본값; INK/IVORY/DEEP_BEIGE는 에디터 색 설정으로 오버라이드) =====
const INK_DEFAULT = '#351714'
const IVORY_DEFAULT = '#FFFFFF'
const DEEP_BEIGE_DEFAULT = '#DDD1BB'
const PAPER = '#FBF8F2'
const DARK_PHOTO = '#241110'
// hex('#RRGGBB') → "r,g,b" (rgba 알파 헬퍼용). 실패 시 fallback
const hexToRgb = (hex: string, fallback: string): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec((hex || '').trim())
  if (!m) return fallback
  const n = parseInt(m[1], 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

// 폰트 (layout.tsx에서 전역 로드된 CSS 변수) — 에디터 폰트 미선택 시 기본값
const F_DISPLAY_DEFAULT = "var(--font-italiana), 'Times New Roman', serif"
const F_LABEL_DEFAULT = "var(--font-eb-garamond), serif"
const F_BODY_DEFAULT = "var(--font-gowun-batang), serif"

const MONTHS_EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

const extractUrl = (im: unknown): string => (typeof im === 'string' ? im : (im && typeof im === 'object' && 'url' in im ? (im as { url: string }).url : '')) || ''

// 스크롤 리빌 + 인터랙션 스타일
const CLASSIC_STYLES = `
  /* ===== 모션 컨셉: "서랍에서 꺼낸 한 통의 편지" — 안착(Settle)·스밈(Ink)·긋기(Draw) ===== */
  .cl-reveal { opacity: 0; transform: translateY(14px); }
  .cl-reveal.is-in { opacity: 1; transform: none; transition: opacity 1.4s ease, transform 1.4s cubic-bezier(.22,.61,.36,1); }
  /* ===== 섹션별 등장(entrance) 모션 변형 — 기존 .cl-reveal/.is-in 위에 얹는 additive modifier ===== */
  /* 안착 계열: 작은 이동/스케일로 종이가 제자리에 놓이는 느낌 */
  .cl-reveal.cl-l { transform: translateX(-12px); }
  .cl-reveal.cl-l.is-in { transform: none; transition: opacity 1.3s ease, transform 1.3s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-r { transform: translateX(12px); }
  .cl-reveal.cl-r.is-in { transform: none; transition: opacity 1.3s ease, transform 1.3s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-up { transform: translateY(22px); }
  .cl-reveal.cl-up.is-in { transform: none; transition: opacity 1.5s ease, transform 1.5s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-drop { transform: translateY(-16px); }
  .cl-reveal.cl-drop.is-in { transform: none; transition: opacity 1.3s ease, transform 1.3s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-zoom { transform: translateY(10px) scale(.985); }
  .cl-reveal.cl-zoom.is-in { transform: none; transition: opacity 1.4s ease, transform 1.4s cubic-bezier(.22,.61,.36,1); }
  /* 스밈 계열: 세리프/이탤릭 문구가 잉크처럼 번지며 안착 (blur는 6px로 GPU 절제) */
  .cl-reveal.cl-blur { transform: translateY(14px) scale(.99); filter: blur(6px); }
  .cl-reveal.cl-blur.is-in { transform: none; filter: blur(0); transition: opacity 1.5s ease, transform 1.5s cubic-bezier(.22,.61,.36,1), filter 1.4s ease; }
  /* 긋기 계열: 마스크가 걷히며 사진이 드러나고, 그 안에서 사진이 숨쉬듯 정착 (scale 1.04→1) */
  .cl-reveal.cl-clip { opacity: 1; transform: scale(1.04); clip-path: inset(0 0 100% 0); }
  .cl-reveal.cl-clip.is-in { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); transition: clip-path 1.25s cubic-bezier(.22,.61,.36,1), transform 1.7s cubic-bezier(.22,.61,.36,1); }
  /* 방향 변형: 좌→우 / 우→좌 / 아래→위 커튼 리빌 (갤러리 에디토리얼 리듬) */
  .cl-reveal.cl-clip-l { opacity: 1; transform: scale(1.04); clip-path: inset(0 100% 0 0); }
  .cl-reveal.cl-clip-l.is-in { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); transition: clip-path 1.25s cubic-bezier(.22,.61,.36,1), transform 1.7s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-clip-r { opacity: 1; transform: scale(1.04); clip-path: inset(0 0 0 100%); }
  .cl-reveal.cl-clip-r.is-in { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); transition: clip-path 1.25s cubic-bezier(.22,.61,.36,1), transform 1.7s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-clip-up { opacity: 1; transform: scale(1.04); clip-path: inset(100% 0 0 0); }
  .cl-reveal.cl-clip-up.is-in { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); transition: clip-path 1.25s cubic-bezier(.22,.61,.36,1), transform 1.7s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-line { opacity: 1; transform: scaleY(0); transform-origin: top; }
  .cl-reveal.cl-line.is-in { opacity: 1; transform: scaleY(1); transition: transform 1.1s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-linex { opacity: 1; transform: scaleX(0); transform-origin: left; }
  .cl-reveal.cl-linex.is-in { transform: scaleX(1); transition: transform .7s cubic-bezier(.22,.61,.36,1); }
  /* 정적 계열: 이동 없이 조용히 떠오르는 fade (감사·푸터 등 "움직이지 않는 순간") */
  .cl-reveal.cl-fade { transform: none; }
  .cl-reveal.cl-fade.is-in { transform: none; transition: opacity 1.7s ease; }
  /* 필름 현상: 흑백의 밝은 인화지 상태에서 색이 차오르며 선명해짐 (이동 없음 — 갤러리 default 시그니처) */
  .cl-reveal.cl-develop { opacity: 1; transform: none; filter: grayscale(1) brightness(1.14) contrast(.95); }
  .cl-reveal.cl-develop.is-in { opacity: 1; transform: none; filter: grayscale(0) brightness(1) contrast(1); transition: filter 1.9s ease; }
  /* 프린트 안착: 인화 사진이 위에서 살짝 눌리며 앨범 페이지에 얹히는 느낌 (album 시그니처) */
  .cl-reveal.cl-place { opacity: 0; transform: translateY(-14px) scale(1.035); }
  .cl-reveal.cl-place.is-in { opacity: 1; transform: translateY(0) scale(1); transition: opacity .9s ease, transform 1.05s cubic-bezier(.22,.61,.36,1); }
  /* 잔잔·고급 전용 변형 (달력 섹션 등) */
  .cl-reveal.cl-soft { transform: scale(.98); }
  .cl-reveal.cl-soft.is-in { transform: none; transition: opacity .6s ease, transform .6s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-rise { transform: translateY(9px); }
  .cl-reveal.cl-rise.is-in { transform: none; transition: opacity .7s ease, transform .7s cubic-bezier(.22,.61,.36,1); }
  .cl-reveal.cl-pop { transform: scale(.92); }
  .cl-reveal.cl-pop.is-in { transform: none; transition: opacity .5s ease, transform .6s cubic-bezier(.22,.61,.36,1); }
  /* 장식(우표·새 등): 바운스 제거 → 잔잔한 안착 */
  .cl-reveal.cl-poof { transform: scale(.94); }
  .cl-reveal.cl-poof.is-in { transform: none; transition: opacity .7s ease, transform .8s cubic-bezier(.22,.61,.36,1); }
  /* 뿅 (달력 예식일 동그라미/말풍선): 살짝 오버슛하며 팝 */
  .cl-reveal.cl-boop { transform: scale(.4); }
  .cl-reveal.cl-boop.is-in { transform: none; transition: opacity .3s ease, transform .5s cubic-bezier(.34,1.56,.64,1); }
  /* RSVP: 카드가 봉투 뒤에서 차분히 솟아오르는 시그니처 (거리 줄여 안정적으로) */
  .cl-reveal.cl-env { transform: translateY(30px) scale(.995); }
  .cl-reveal.cl-env.is-in { transform: none; transition: opacity 1s ease, transform 1.05s cubic-bezier(.22,.61,.36,1); }
  /* 달력 페이지가 상단 축에 걸려 살짝 스윙하며 내려오는 벽걸이 달력 시그니처 (풀그리드) */
  .cl-reveal.cl-cal { opacity: 0; transform: perspective(1800px) rotateX(-13deg) translateY(-8px); transform-origin: top center; }
  .cl-reveal.cl-cal.is-in { opacity: 1; transform: perspective(1800px) rotateX(0deg) translateY(0); transition: opacity .85s ease, transform 1.15s cubic-bezier(.34,1.24,.5,1); }
  /* 어둠 속에서 초점이 맞으며 떠오르는 시네마틱 라이즈 (다크 대형 숫자) */
  .cl-reveal.cl-lux { transform: translateY(50px) scale(.955); filter: blur(12px); }
  .cl-reveal.cl-lux.is-in { transform: none; filter: blur(0); transition: opacity 1.8s ease, transform 1.9s cubic-bezier(.2,.6,.2,1), filter 1.7s ease; }
  /* 절취선이 좌우로 찢어지듯 벌어지는 티켓 대시라인 (티켓) */
  .cl-reveal.cl-tear { opacity: 1; transform: scaleX(0); transform-origin: center; }
  .cl-reveal.cl-tear.is-in { opacity: 1; transform: scaleX(1); transition: transform .9s cubic-bezier(.22,.61,.36,1); }
  @media (prefers-reduced-motion: reduce) {
    .cl-reveal, .cl-reveal.is-in,
    .cl-reveal.cl-l, .cl-reveal.cl-l.is-in,
    .cl-reveal.cl-r, .cl-reveal.cl-r.is-in,
    .cl-reveal.cl-up, .cl-reveal.cl-up.is-in,
    .cl-reveal.cl-drop, .cl-reveal.cl-drop.is-in,
    .cl-reveal.cl-zoom, .cl-reveal.cl-zoom.is-in,
    .cl-reveal.cl-blur, .cl-reveal.cl-blur.is-in,
    .cl-reveal.cl-clip, .cl-reveal.cl-clip.is-in,
    .cl-reveal.cl-clip-l, .cl-reveal.cl-clip-l.is-in,
    .cl-reveal.cl-clip-r, .cl-reveal.cl-clip-r.is-in,
    .cl-reveal.cl-clip-up, .cl-reveal.cl-clip-up.is-in,
    .cl-reveal.cl-line, .cl-reveal.cl-line.is-in,
    .cl-reveal.cl-fade, .cl-reveal.cl-fade.is-in,
    .cl-reveal.cl-develop, .cl-reveal.cl-develop.is-in,
    .cl-reveal.cl-place, .cl-reveal.cl-place.is-in,
    .cl-reveal.cl-soft, .cl-reveal.cl-soft.is-in,
    .cl-reveal.cl-rise, .cl-reveal.cl-rise.is-in,
    .cl-reveal.cl-linex, .cl-reveal.cl-linex.is-in,
    .cl-reveal.cl-pop, .cl-reveal.cl-pop.is-in,
    .cl-reveal.cl-poof, .cl-reveal.cl-poof.is-in,
    .cl-reveal.cl-boop, .cl-reveal.cl-boop.is-in,
    .cl-reveal.cl-cal, .cl-reveal.cl-cal.is-in,
    .cl-reveal.cl-lux, .cl-reveal.cl-lux.is-in,
    .cl-reveal.cl-tear, .cl-reveal.cl-tear.is-in,
    .cl-reveal.cl-env, .cl-reveal.cl-env.is-in {
      transition: none !important;
      opacity: 1;
      transform: none;
      filter: none;
      clip-path: inset(0 0 0 0);
    }
    /* 오프닝 등 인라인 키프레임 애니메이션도 정지 (요소는 최종 상태로 표시) */
    .cl-root [style*="animation"] { animation: none !important; }
  }
  /* 필름 스트립: 무한 마퀴 (상·하행 반대방향, 끊김 없이 루프) */
  .cl-film-row { overflow: hidden; }
  .cl-film-track { display: flex; width: max-content; will-change: transform; }
  .cl-film-track > * { flex: 0 0 auto; margin-right: 10px; }
  .cl-film-track--l { animation: cl-film-l 34s linear infinite; }
  .cl-film-track--r { animation: cl-film-r 34s linear infinite; }
  @keyframes cl-film-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes cl-film-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
  @media (prefers-reduced-motion: reduce) { .cl-film-track--l, .cl-film-track--r { animation: none !important; } }
  @keyframes cl-fade-soft { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes cl-main-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cl-swipe-fade { 0% { opacity: 0; transform: scale(1.03); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes cl-emerge { 0% { opacity: 0; transform: translateY(24px) scale(.955); filter: blur(6px); } 55% { filter: blur(0); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
  @keyframes cl-line-grow { 0% { transform: scaleY(0); opacity: 0; } 100% { transform: scaleY(1); opacity: 1; } }
  @keyframes cl-card-reveal { 0% { clip-path: inset(100% 0 0 0); } 100% { clip-path: inset(0 0 0 0); } }
  @keyframes cl-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
  @keyframes cl-nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
  @keyframes cl-seal-in { 0% { opacity: 0; transform: translateY(18px) scale(.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes cl-flip-enter { 0% { opacity: 0; transform: translateY(44px) scale(.9); filter: blur(7px); } 55% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
  /* 잉크 스밈: 흐릿하게 인쇄된 상태 → 서서히 진해짐 (빈 종이처럼 보이지 않게 시작 opacity 유지) */
  @keyframes cl-ink-in { 0% { opacity: .18; filter: blur(4px); } 60% { filter: blur(0); } 100% { opacity: 1; filter: blur(0); } }
  /* ===== 오프닝 5종 시그니처 등장 ===== */
  /* 프레임: 엠보스 프레임이 줌아웃되며 안착 */
  @keyframes cl-frame-in { 0% { opacity: 0; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
  /* 이름 타이포: 넓은 자간에서 좁혀지며 잉크처럼 맺힘 (100% 생략 → 원래 자간으로 수렴) */
  @keyframes cl-letters { 0% { opacity: 0; letter-spacing: .24em; filter: blur(7px); } 62% { opacity: 1; filter: blur(0); } }
  /* 실링: 봉투가 살짝 기울며 떠올라 안착 */
  @keyframes cl-env-in { 0% { opacity: 0; transform: translateY(64px) rotate(3deg) scale(.94); filter: blur(6px); } 60% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); filter: blur(0); } }
  /* 실링: 인장이 도장 찍히듯 눌림 (압인 — 바운스 아님) */
  @keyframes cl-stamp { 0% { opacity: 0; transform: scale(2.1); filter: blur(3px); } 55% { opacity: 1; transform: scale(.93); filter: blur(0); } 100% { opacity: 1; transform: scale(1); } }
  /* 트레이싱지: 서리 뒤 사진이 숨쉬듯 천천히 정착 (Ken Burns) */
  @keyframes cl-kenburns { 0% { transform: scale(1.12); } 100% { transform: scale(1); } }
  /* 접힌 편지: 종이가 위에서 살짝 기울며 낙하해 안착 */
  @keyframes cl-paper-drop { 0% { opacity: 0; transform: translateY(-54px) rotate(-4.5deg); filter: blur(5px); } 62% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: translateY(0) rotate(0deg); } }
  /* 사진 뒤집기: 카드가 3D로 스윙하며 들어옴 (뒤집기 인터랙션 예고) */
  @keyframes cl-swing-in { 0% { opacity: 0; transform: perspective(1200px) rotateY(-42deg) translateY(26px) scale(.95); filter: blur(5px); } 62% { opacity: 1; filter: blur(0); } 100% { opacity: 1; transform: perspective(1200px) rotateY(0deg) translateY(0) scale(1); filter: blur(0); } }
  @keyframes cl-caret { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  .cl-scroll::-webkit-scrollbar { display: none; }
`

// 숫자 카운트업: 화면 진입 시 0 → value (달력 디데이 강조용)
function CountUp({ value, style }: { value: number; style?: React.CSSProperties }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) { setN(value); return }
    let started = false
    const run = () => {
      if (started) return
      started = true
      const dur = 1000, t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur)
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect() } }), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [value])
  return <span ref={ref} style={style}>{n}</span>
}

// 타자기 효과: 화면 진입 시 한 글자씩 타이핑 + 깜빡이는 커서 (감사 인사 본문 등)
function TypeText({ text, style, speed = 60, caretColor }: { text: string; style?: React.CSSProperties; speed?: number; caretColor?: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) { setN(text.length); return }
    let started = false
    let raf = 0
    const run = () => {
      if (started) return
      started = true
      const t0 = performance.now()
      const tick = (t: number) => {
        const chars = Math.min(text.length, Math.floor((t - t0) / speed))
        setN(chars)
        if (chars < text.length) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect() } }), { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [text, speed])
  const done = n >= text.length
  return (
    <p ref={ref} style={style}>
      {text.slice(0, n)}
      <span style={{ display: 'inline-block', marginLeft: 1, color: caretColor, opacity: done ? 0 : 1, transition: 'opacity .5s ease', animation: 'cl-caret 1s step-end infinite' }}>|</span>
    </p>
  )
}

export default function InvitationClientClassic({ invitation, content, isPaid, isPreview, skipIntro, introClickAdvance }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [page, setPage] = useState<'intro' | 'main'>(skipIntro ? 'main' : 'intro')
  const [introLeaving, setIntroLeaving] = useState(false) // 인트로 → 본문 크로스페이드 중
  // 오프닝 인터랙션 상태 (리본/트레이싱지/접힌편지/사진뒤집기)
  const [ribbon, setRibbon] = useState(false)
  const [frost, setFrost] = useState(false)
  const [traceTyped, setTraceTyped] = useState(0) // 트레이싱지 시작 문구 타자기 효과 (표시 글자 수)
  const [fold, setFold] = useState(0)
  const [flip, setFlip] = useState(false)
  // 지도 스크롤 가로채기 방지: 1차 터치=안내, 2차 터치=활성화 (PARENTS와 동일)
  const [mapState, setMapState] = useState<'locked' | 'hint' | 'active'>('locked')
  const mapActive = mapState === 'active'
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapWrapRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [rsvpAttend, setRsvpAttend] = useState<'attending' | 'not_attending' | null>(null)
  // 갤러리 라이트박스
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIndex, setLbIndex] = useState(0)
  const [bgmPlaying, setBgmPlaying] = useState(false)
  const bgmRef = useRef<HTMLAudioElement>(null)
  const [dday, setDday] = useState<number | null>(null)
  const [infoIdx, setInfoIdx] = useState(0)
  // 갤러리 '스와이프' 레이아웃 전용: 현재 표시 중인 사진 인덱스
  const [galSwipeIdx, setGalSwipeIdx] = useState(0)
  const [galExpanded, setGalExpanded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  const c = (content || {}) as Record<string, any>
  const groom = c.groom || {}
  const bride = c.bride || {}
  const wedding = c.wedding || {}
  const venue = wedding.venue || {}
  const cc = c.content || {}
  const directions = wedding.directions || c.directions || {}

  // D-Day 팝업 (THE CLASSIC 전용 필드: content.classicDdayPopup — 다른 템플릿의 ddayPopup과 분리)
  const ddayPopup = normalizeDdayPopup(cc.classicDdayPopup)

  // ===== 폰트 (에디터 디자인 탭에서 선택; 미선택 시 기본값) =====
  const F_DISPLAY = DISPLAY_FONTS.find((f) => f.id === cc.classicDisplayFont)?.fontFamily || F_DISPLAY_DEFAULT
  const F_LABEL = DISPLAY_FONTS.find((f) => f.id === cc.classicDisplayFont)?.fontFamily || F_LABEL_DEFAULT
  const F_BODY = KOREAN_FONTS.find((f) => f.id === cc.classicBodyFont)?.fontFamily || F_BODY_DEFAULT

  // ===== 색 토큰 (에디터 색 설정 반영) =====
  // 포인트 컬러 → INK(본문·다크섹션·실링), 전체 배경 → IVORY, 섹션 배경 → DEEP_BEIGE
  const INK = c.customAccentColor || INK_DEFAULT
  const IVORY = c.customBgColor || IVORY_DEFAULT
  const DEEP_BEIGE = c.customSectionBgColor || DEEP_BEIGE_DEFAULT
  const inkA = (a: number) => `rgba(${hexToRgb(INK, '53,23,20')},${a})`
  const ivoryA = (a: number) => `rgba(${hexToRgb(IVORY, '242,238,230')},${a})`
  // 기본/틴티드 배경 텍스트 색상 (섹션별 기본↔틴티드 토글용)
  const TXT_DEFAULT = cc.classicDefaultTextColor || INK
  const TXT_TINT = cc.classicTintedTextColor || INK
  const BTN_TEXT = cc.classicButtonTextColor || IVORY // 채움 버튼(포인트 배경) 글자색
  const txtDefA = (a: number) => `rgba(${hexToRgb(TXT_DEFAULT, '53,23,20')},${a})`
  const txtTintA = (a: number) => `rgba(${hexToRgb(TXT_TINT, '53,23,20')},${a})`
  // 오프닝 스타일 5종. 프레임=바로시작 / 리본·트레이싱지=오프닝 / 접힌편지·사진뒤집기=예식장정보. 기본=프레임
  const OPENING_STYLES = ['프레임', '실링', '트레이싱지', '접힌 편지', '사진 뒤집기']
  const openingStyle: string = OPENING_STYLES.includes(cc.classicOpeningStyle) ? cc.classicOpeningStyle : '프레임'
  // 인트로 연출 완료 여부 (완료되면 터치·스크롤로 본문 이동 가능 → 가이드 표시)
  // 실링=봉투 열림 후 / 트레이싱지=걷어낸 후 / 그 외(프레임·접힌편지·사진뒤집기)=즉시
  const introDone = openingStyle === '실링' ? ribbon : openingStyle === '트레이싱지' ? frost : true
  // ===== 오프닝(인트로) 커스텀: 배경이미지 / 배경색 / 텍스트색 =====
  const openBgImg = extractUrl(cc.classicOpeningBgImage)
  const openBg = cc.classicOpeningBgColor || IVORY
  const openInk = cc.classicOpeningTextColor || INK
  const openInkA = (a: number) => `rgba(${hexToRgb(openInk, '53,23,20')},${a})`
  // 프레임 오프닝 전용 글자색: 이름·라벨·날짜·'터치 또는 스크롤' 모두 동일 적용 (미설정 시 오프닝 텍스트색=포인트색)
  const frameInk: string = cc.classicFrameHintColor || openInk
  const frameInkA = (a: number) => `rgba(${hexToRgb(frameInk, '53,23,20')},${a})`
  // 실링·접힌편지·사진뒤집기: 어두운 배경 오프닝 → 배경을 테마(틴티드/기본)와 무관한 고정 다크로
  const isDarkOpening = openingStyle === '실링' || openingStyle === '접힌 편지' || openingStyle === '사진 뒤집기'
  const traceText: string = cc.classicTraceStartText || '소중한 분을 초대합니다.'
  // 프레임(바로시작) 엠보스 프레임 (frame1/frame2/none) — multiply 블렌드로 배경색 위에 오버레이
  const openFrame: string = ['frame1', 'frame2', 'none'].includes(cc.classicOpeningFrame) ? cc.classicOpeningFrame : 'frame1'
  // 실링 인장 색상 (리본 매듭 인장에 적용, 미설정 시 기본 은색) + 각인 이니셜 자동 대비색
  const sealColor: string = cc.classicSealColor || ''
  const sealMono: string = (() => {
    if (!sealColor) return '#7A3A31'
    const [r, g, b] = hexToRgb(sealColor, '122,58,49').split(',').map(Number)
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#3A1A16' : 'rgba(245,240,232,.92)'
  })()

  // 이름
  // 영문 대소문자 옵션은 '본문 영문 라벨'에만 적용. 영문 이름은 기본정보 입력값 그대로 사용.
  const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s\-'])([a-z])/g, (_, p, c: string) => p + c.toUpperCase())
  const nameCase = (s: string) => (cc.classicNameCase === 'title' ? titleCase(s) : s.toUpperCase())
  const groomEn = groom.nameEn || groom.name || 'THEO'
  const brideEn = bride.nameEn || bride.name || 'ELISE'
  const groomKo = groom.name || '테오'
  const brideKo = bride.name || '엘리스'
  // 트레이싱지 걷어낸 사진 위 오버레이 (색상 + 투명도, 0=자연 사진)
  const traceVeil: string = cc.classicTraceVeilColor || '#141008'
  const traceVeilOp: number = typeof cc.classicTraceVeilOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicTraceVeilOpacity)) : 0
  // 접힌편지·사진뒤집기 배경 오버레이 색상 + 첫 사진 배경 투명도
  const infoOverlay: string = cc.classicInfoOverlayColor || '#1C100D'
  const infoPhotoOp: number = typeof cc.classicInfoPhotoOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicInfoPhotoOpacity)) : 0
  // 오버레이 투명도: 처음(어두운 상태) / 펼치거나 뒤집은 후(원본·밝은 상태). 원본 상태도 오버레이 설정 가능
  const infoDarkOverlayOp: number = typeof cc.classicInfoOverlayOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicInfoOverlayOpacity)) : 0.42
  const infoBrightOverlayOp: number = typeof cc.classicInfoBrightOverlayOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicInfoBrightOverlayOpacity)) : 0
  // 오시는 길 배경사진 오버레이 (색상 + 투명도, 기본 0 = 오버레이 없음)
  const dirOverlay: string = cc.classicDirectionsOverlayColor || '#1C100D'
  const dirOverlayOp: number = typeof cc.classicDirectionsOverlayOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicDirectionsOverlayOpacity)) : 0
  // 디자인 커스텀 스케일 (THE SIMPLE 참조): 본문 글자 / 상단문구. 기본 1
  const bodyScale: number = typeof cc.classicFontScale === 'number' ? Math.max(0.85, Math.min(1.3, cc.classicFontScale)) : 1
  const labelScale: number = typeof cc.classicEyebrowScale === 'number' ? Math.max(0.85, Math.min(1.3, cc.classicEyebrowScale)) : 1
  // 본문(F_BODY) / 라벨(F_LABEL·label()) 글자 크기 배수. 소수 1자리 반올림
  const bfs = (n: number) => Math.round(n * bodyScale * 10) / 10
  const lfs = (n: number) => Math.round(n * labelScale * 10) / 10
  // ===== THE CLASSIC 타이포 스케일 (역할별 통일 · base 값, *Scale 적용 전) =====
  const T_EYEBROW = 10.5   // 섹션 킥커 (GALLERY, LOCATION, INVITATION 등 대문자 라벨)
  const T_ROLE = 8.5       // 소형 역할 라벨 (GROOM / BRIDE / 부모 / 신랑측·신부측)
  const T_TITLE = 30       // 섹션 제목 (스크립트 이탤릭: Thank You, R.S.V.P, 예식장명 등)
  const T_SUBTITLE = 18    // 소제목 (안내 항목 제목 등)
  // 오프닝 이름 언어 (영문/한글) — 5종 공통
  const nameLang: string = cc.classicOpeningNameLang === 'ko' ? 'ko' : 'en'
  const nameGroom = nameLang === 'ko' ? groomKo : groomEn
  const nameBride = nameLang === 'ko' ? brideKo : brideEn
  const nameFont = nameLang === 'ko' ? F_BODY : F_DISPLAY

  // 혼주 (호칭 · 고인표시)
  const letterSign: string = ['parents', 'couple', 'hosts', 'none'].includes(cc.classicLetterSign) ? cc.classicLetterSign : 'parents'
  const hostSide: string = ['both', 'groom', 'bride'].includes(cc.classicHostSide) ? cc.classicHostSide : 'groom'
  const groomTitle = cc.classicGroomTitle ?? '아들'
  const brideTitle = cc.classicBrideTitle ?? '딸'
  const decStyle: string = cc.classicDeceasedStyle === 'hanja' ? 'hanja' : 'flower'
  const decMark = (d?: boolean): React.ReactNode => !d ? null : (decStyle === 'hanja'
    ? <span style={{ fontFamily: F_BODY }}>故&nbsp;</span>
    : <span aria-label="故" role="img" style={{ display: 'inline-block', width: '0.82em', height: '0.82em', marginRight: 3, verticalAlign: '-0.06em', opacity: 0.85, backgroundColor: 'currentColor', WebkitMaskImage: "url('/icons/chrysanthemum.svg')", maskImage: "url('/icons/chrysanthemum.svg')", WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />)
  const parentsJsx = (f?: { name?: string; deceased?: boolean }, m?: { name?: string; deceased?: boolean }): React.ReactNode[] | null => {
    const items: React.ReactNode[] = []
    if (f?.name) items.push(<span key="f">{decMark(f.deceased)}{f.name}</span>)
    if (m?.name) items.push(<span key="m">{decMark(m.deceased)}{m.name}</span>)
    if (!items.length) return null
    return items.reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, <span key={'d' + i}> · </span>, el]), [])
  }
  const coupleTogetherText: string = cc.coupleTogetherText || groom.profile?.tag || '오랜 시간 함께 걸어온 두 사람이\n이제 같은 이름으로 살아가려 합니다.'
  // 신랑·신부 소개: 에디터에서 각자/함께/이름만 선택 + 각자 소개 한마디 + 크롭 사진
  const introMode: string = cc.classicIntroMode === 'together' ? 'together' : cc.classicIntroMode === 'nameOnly' ? 'nameOnly' : 'each'
  const introTogether = introMode === 'together'
  // 각자 카드 프레임 (웨이브 플라크 / 우표)
  const eachFrame = cc.classicIntroEachFrame === 'stamp'
    ? { img: '/classic/stamp.webp', aspect: '770 / 484', pad: '22px 40px' }
    : { img: '/classic/plaque.webp', aspect: '1458 / 876', pad: '16px 46px' }
  // 함께 소개 프레임 (진주 / 필리그리 / 오벌)
  const togetherFrame = cc.classicIntroTogetherFrame === 'oval'
    ? { img: '/classic/frame-oval.webp', aspect: '2697 / 3376', photoW: '73%', photoH: '77%', photoLeft: '50%', photoTop: '50%', w: '74%', maxW: 268 }
    : cc.classicIntroTogetherFrame === 'filigree'
    ? { img: '/classic/frame-filigree.webp', aspect: '2760 / 1932', photoW: '80%', photoH: '79%', photoLeft: '50%', photoTop: '50%', w: '85%', maxW: 340 }
    : { img: '/classic/frame-together.webp', aspect: '882 / 1068', photoW: '54%', photoH: '67%', photoLeft: '50%', photoTop: '50%', w: '82%', maxW: 306 }
  // 오벌 프레임 색상 (선택 시 프레임을 multiply로 틴트 — 엠보스 유지)
  const togetherFrameColor: string = cc.classicIntroTogetherFrameColor || ''
  // 소개 한마디: 미설정 시 미리보기에서는 샘플 문구 노출(위치 확인용), 실제 페이지에서는 숨김
  const groomIntro: string = cc.classicGroomIntro || (isPreview ? '다정하고 든든한 사람입니다.' : '')
  const brideIntro: string = cc.classicBrideIntro || (isPreview ? '따뜻하고 밝은 사람입니다.' : '')
  // 인사말 카드 프레임 (웨이브 / 레이스 / 종이 / 없음)
  const letterNoFrame = cc.classicLetterFrame === 'none'
  const letterPaper = cc.classicLetterFrame === 'paper' // 풀블리드 사진 위 아이보리 종이 카드(이중 헤어라인)
  const letterFrame = cc.classicLetterFrame === 'lace'
    ? { img: '/classic/letter-lace2.webp', aspect: '940 / 1366', inset: '17% 15%' }
    : cc.classicLetterFrame === 'wavy'
    ? { img: '/classic/letter-wavy.webp', aspect: '934 / 1330', inset: '15% 16%' }
    : cc.classicLetterFrame === 'scallop'
    ? { img: '/classic/letter-scallop.webp', aspect: '882 / 1236', inset: '14% 13%' }
    : { img: '/classic/wave-frame-crop.webp', aspect: '938 / 1184', inset: '11% 12%' }
  // 인사말 배경 사진 유무: 있으면 다크 배경+스크림, 없으면 테마 배경색을 따름
  const greetingHasBg: boolean = !!extractUrl(cc.classicGreetingBgImage)
  // 프레임 없음일 때 인사말 텍스트 색 (없으면 배경 위에 바로 놓임: 사진 배경이면 밝은색, 아니면 테마 어두운색)
  const letterInk: string = letterNoFrame ? (cc.classicLetterTextColor || (greetingHasBg ? '#F7F3EC' : INK)) : INK
  const letterInkRgb: string = hexToRgb(letterInk, '53,23,20')
  const letterInkA = (a: number) => `rgba(${letterInkRgb},${a})`
  // 예식일정 사진 프레임 (하트 / 우표)
  const dateFrame: 'heart' | 'stamp' = cc.classicDateFrame === 'stamp' ? 'stamp' : 'heart'
  // 마무리 감사 인사 프레임 (없음 / 도일리)
  const thanksFrame: 'none' | 'doily' = cc.classicThanksFrame === 'doily' ? 'doily' : 'none'

  // 날짜
  const wdate = wedding.date ? new Date(wedding.date) : new Date('2027-06-21')
  const monthEn = MONTHS_EN[wdate.getMonth()]
  const day = wdate.getDate()
  const year = wdate.getFullYear()
  const mm = String(wdate.getMonth() + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  const dow = wdate.getDay() // 0=Sun
  const timeDisplay = wedding.timeDisplay || wedding.time || '오후 두 시'
  const dateFullEn = `${dd} ${monthEn} ${year}`
  const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토']
  const dateFullKo = `${year}년 ${wdate.getMonth() + 1}월 ${day}일 ${WEEK_KO[dow]}요일`
  const dateDotKo = `${year}.${mm}.${dd} ${WEEK_KO[dow]}요일`

  // 장소
  const venueName = venue.name || '더 클래식 하우스'
  const venueHall = venue.hall || ''
  const venueAddress = venue.address || '서울 중구 정동길 24'
  const venueFull = [venueHall, venueAddress].filter(Boolean).join(' · ')

  // ===== 예식일정 달력 변형 (2b 풀그리드 / 2c 다크 / 2d 티켓 / 2e 에디토리얼) =====
  const dateStyle: string = ['2b', '2c', '2d', '2e'].includes(cc.classicDateStyle) ? cc.classicDateStyle : 'classic'
  const datePoint: string = cc.classicDatePointColor || '#c06a5b' // 달력 포인트 색 (하트/동그라미/말풍선/디데이)
  // 달력 숫자 폰트: 기본은 디스플레이(영문) 폰트, 'body' 선택 시 본문(한글) 폰트 사용
  const F_NUM = cc.classicDateNumFont === 'body' ? F_BODY : F_DISPLAY
  const F_META = "'Pretendard', 'Noto Sans KR', sans-serif"
  // 채운 하트 (예식일 포인트)
  const heartFill = (size: number, color: string): React.ReactNode => (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color} />
    </svg>
  )
  // 예식일 셀: 숫자 위에 채운 하트 (포인트)
  const heartDayCell = (n: number, sizeBox: number, heartSize: number, heartColor: string, numColor: string, numSize: number): React.ReactNode => (
    <span style={{ position: 'relative', width: sizeBox, height: sizeBox, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{heartFill(heartSize, heartColor)}</span>
      <span style={{ position: 'relative', fontFamily: F_DISPLAY, fontSize: numSize, color: numColor, lineHeight: 1 }}>{n}</span>
    </span>
  )
  // 예식일 셀: 얇은 링 + 세리프 숫자 + 아래 작은 하트 도트 (클래식 포인트)
  const ringDayCell = (n: number, box: number, ringColor: string, numColor: string, numSize: number, accent: string): React.ReactNode => (
    <span style={{ position: 'relative', width: box, height: box, borderRadius: '50%', border: `1px solid ${ringColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: F_DISPLAY, fontSize: numSize, color: numColor, lineHeight: 1 }}>{n}</span>
      <span style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', display: 'block' }}>{heartFill(9, accent)}</span>
    </span>
  )
  // 장식 규칙선 (— ❦ —): 가는 선 + 중앙 오너먼트
  const ornRule = (color: string, w: number = 40): React.ReactNode => (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span style={{ width: w, height: 1, background: color }} />
      <span style={{ fontFamily: F_LABEL, fontSize: 11, color, lineHeight: 1 }}>&#10087;</span>
      <span style={{ width: w, height: 1, background: color }} />
    </span>
  )
  // 점선 리더 정보 행 (라벨 …… 값)
  const leaderRow = (labelCol: string, valCol: string, label: string, value: React.ReactNode): React.ReactNode => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: F_BODY, fontSize: 12, color: labelCol, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, borderBottom: `1px dotted ${labelCol}`, transform: 'translateY(-3px)', opacity: 0.6 }} />
      <span style={{ fontFamily: F_BODY, fontSize: 13, color: valCol, whiteSpace: 'nowrap', textAlign: 'right' }}>{value}</span>
    </div>
  )
  const monthIdx0 = wdate.getMonth()
  const firstDow0 = new Date(year, monthIdx0, 1).getDay()
  const daysInMonth0 = new Date(year, monthIdx0 + 1, 0).getDate()
  const monthCells: (number | null)[] = [...Array(firstDow0).fill(null), ...Array.from({ length: daysInMonth0 }, (_, i) => i + 1)]
  while (monthCells.length % 7 !== 0) monthCells.push(null)
  const weekDays: (number | null)[] = Array.from({ length: 7 }, (_, i) => day - dow + i).map((n) => (n >= 1 && n <= daysInMonth0 ? n : null))
  // 디데이 문구 (모든 변형 공통)
  const ddayLine = (color: string, numColor: string): React.ReactNode => {
    if (dday === null || dday < 0) return null
    if (dday === 0) return <span style={{ color }}>오늘입니다</span>
    return <span style={{ color }}>예식까지 <span style={{ fontFamily: F_NUM, fontSize: '1.3em', color: numColor }}>{dday}</span>일</span>
  }

  const renderDateVariant = (): React.ReactNode => {
    const sec = (bg: string, pad: string, extra?: React.CSSProperties): React.CSSProperties => ({ order: orderOf('date'), background: bg, padding: pad, display: 'flex', flexDirection: 'column', minHeight: '85vh', overflow: 'hidden', ...hide('date'), ...extra })
    const wk = (color: string) => WEEK_KO.map((w, i) => <span key={i} style={{ fontFamily: F_META, fontSize: 11, color, letterSpacing: '.04em', textAlign: 'center', paddingBottom: 18 }}>{w}</span>)
    // 다크(2c)는 기본 달력처럼 테마 틴티드 색상을 따름
    const dTx = fgC('date'); const dTxA = (a: number) => fgA('date', a); const dBg = secBg('date')

    if (dateStyle === '2b') {
      const weeks: (number | null)[][] = []
      for (let i = 0; i < monthCells.length; i += 7) weeks.push(monthCells.slice(i, i + 7))
      const monthEnT = MONTHS_EN[monthIdx0].charAt(0) + MONTHS_EN[monthIdx0].slice(1).toLowerCase()
      const WK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return (
        <section style={sec('#f3f0ea', '38px 0')}>
          <div style={{ padding: '0 28px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <p className="cl-reveal cl-up" style={{ margin: '10px 0 0', textAlign: 'center', fontFamily: F_META, fontSize: 11, letterSpacing: '.24em', paddingLeft: '.24em', color: '#9a917f' }}>{cc.classicDateHeading || 'WEDDING CALENDAR'}</p>
            <h2 className="cl-reveal cl-up" data-delay="80" style={{ margin: '6px 0 0', textAlign: 'center', fontFamily: F_DISPLAY, fontStyle: 'italic', fontSize: 30, lineHeight: 1.1, color: '#2b2724' }}>{monthEnT}</h2>
            <p className="cl-reveal cl-up" data-delay="140" style={{ margin: '8px 0 0', textAlign: 'center', fontFamily: F_BODY, fontSize: 11, letterSpacing: '.14em', color: '#9a917f' }}>{year}년 {monthIdx0 + 1}월</p>
            <div className="cl-reveal cl-up" data-delay="220" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', paddingBottom: 8, borderBottom: '1px solid rgba(43,39,36,.4)' }}>
              {WK_EN.map((w, i) => <span key={i} style={{ fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 13, color: '#6f6757', textAlign: 'center' }}>{w}</span>)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {weeks.map((wrow, ri) => (
                <div key={ri} className="cl-reveal cl-rise" data-delay={320 + ri * 100} style={{ minHeight: 44, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid rgba(43,39,36,.16)' }}>
                  {wrow.map((n, ci) => (
                    <div key={ci} style={{ padding: '7px 0 6px 8px' }}>
                      {n === null ? null : n === day
                        ? <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26 }}>
                            <span className="cl-reveal cl-boop" data-delay="1080" style={{ position: 'absolute', inset: -1, border: `2.5px solid ${datePoint}`, borderRadius: '52% 48% 49% 51% / 50% 52% 48% 50%' }} />
                            <span style={{ fontFamily: F_NUM, fontSize: 16, color: '#231f1b' }}>{n}</span>
                            <span className="cl-reveal cl-boop" data-delay="1260" style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 9, whiteSpace: 'nowrap', background: datePoint, color: '#fff', fontFamily: F_BODY, fontSize: 9, letterSpacing: '.14em', paddingLeft: '.14em', padding: '4px 9px', borderRadius: 4, zIndex: 6, pointerEvents: 'none' }}>
                              WEDDING DAY
                              <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${datePoint}` }} />
                            </span>
                          </span>
                        : <span style={{ fontFamily: F_NUM, fontSize: 16, color: '#5b5449' }}>{n}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 30, paddingTop: 22, borderTop: '1px solid rgba(43,39,36,.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontFamily: F_BODY, fontSize: 14, lineHeight: 1.7, color: '#3a352c' }}>{dateFullKo} {timeDisplay}</p>
                <p style={{ margin: 0, fontFamily: F_BODY, fontSize: 12, color: '#8b8271' }}>{venueName}{venueHall ? ` ${venueHall}` : ''}</p>
              </div>
              {dday !== null && dday >= 0 && (
                <span className="cl-reveal cl-pop" data-delay="960" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#2b2724', color: '#f3f0ea', padding: '8px 16px', borderRadius: 999, fontFamily: F_BODY, fontSize: 12, whiteSpace: 'nowrap' }}>{dday === 0 ? '오늘' : <>D-<b style={{ fontFamily: F_NUM, fontSize: 15, fontWeight: 500 }}>{dday}</b></>}</span>
              )}
            </div>
          </div>
        </section>
      )
    }

    if (dateStyle === '2c') {
      return (
        <section style={sec(dBg, '76px 34px 48px')}>
          <div className="cl-reveal cl-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <p style={{ margin: 0, textAlign: 'center', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 12, letterSpacing: '.06em', color: dTx }}>{groomKo} &amp; {brideKo}</p>
            {ornRule(dTxA(0.34), 34)}
          </div>
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <div className="cl-reveal cl-lux" data-delay="180" style={{ fontFamily: F_NUM, fontWeight: 300, fontSize: 'clamp(112px,38vw,148px)', lineHeight: 0.82, letterSpacing: '-.03em', color: dTx }}>{day}</div>
            <div className="cl-reveal cl-up" data-delay="380" style={{ marginTop: 22, fontFamily: F_BODY, fontSize: 12, letterSpacing: '.22em', paddingLeft: '.22em', color: dTxA(0.72) }}>{year}년 {monthIdx0 + 1}월 · {WEEK_KO[dow]}요일</div>
          </div>
          <p className="cl-reveal cl-blur" data-delay="240" style={{ margin: '40px 0 0', textAlign: 'center', fontFamily: F_BODY, fontSize: 15, lineHeight: 2, letterSpacing: '.02em', color: dTxA(0.82), whiteSpace: 'pre-line' }}>{'서로의 이름을 나란히 두는 날\n귀한 걸음으로 축복해 주시기 바랍니다'}</p>
          <div style={{ marginTop: 'auto' }}>
            <div className="cl-reveal cl-linex" data-delay="80" style={{ height: 1, background: dTxA(0.24), transformOrigin: 'center' }} />
            <div className="cl-reveal cl-up" data-delay="120" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', paddingTop: 14 }}>{wk(dTxA(0.5))}</div>
            <div className="cl-reveal cl-linex" data-delay="160" style={{ height: 1, background: dTxA(0.16), transformOrigin: 'center' }} />
            <div className="cl-reveal cl-up" data-delay="200" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', paddingTop: 6 }}>
              {weekDays.map((n, i) => (
                <div key={i} style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 7, borderRight: i < 6 ? `1px solid ${dTxA(0.1)}` : 'none' }}>
                  {n === null ? null : n === day
                    ? <span className="cl-reveal cl-boop" data-delay="260" style={{ fontFamily: F_NUM, fontWeight: 500, fontSize: 23, color: datePoint, lineHeight: 1 }}>{n}</span>
                    : <span style={{ fontFamily: F_NUM, fontWeight: 300, fontSize: 17, color: dTxA(0.68) }}>{n}</span>}
                </div>
              ))}
            </div>
            <div className="cl-reveal cl-linex" data-delay="300" style={{ height: 1, background: dTxA(0.24), transformOrigin: 'center' }} />
            {dday !== null && dday >= 0 && (
              <div className="cl-reveal cl-up" data-delay="360" style={{ marginTop: 28 }}>
                <div style={{ display: 'flex', width: '100%', alignItems: 'baseline', justifyContent: 'center', gap: 9, padding: '13px 0', border: `1px solid ${dTxA(0.28)}` }}>
                  <span style={{ fontFamily: F_BODY, fontSize: 11, letterSpacing: '.16em', paddingLeft: '.16em', color: dTxA(0.6) }}>{dday === 0 ? '오늘' : '예식까지'}</span>
                  {dday === 0 ? <span style={{ fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 22, color: dTx }}>예식일</span> : <><CountUp value={dday} style={{ fontFamily: F_NUM, fontWeight: 400, fontSize: 34, lineHeight: 1, color: dTx }} /><span style={{ fontFamily: F_BODY, fontSize: 12, color: dTxA(0.7) }}>일 남았습니다</span></>}
                </div>
              </div>
            )}
            <div style={{ marginTop: 22, textAlign: 'center', fontFamily: F_BODY, fontSize: 15, letterSpacing: '.08em', color: dTxA(0.72) }}>{timeDisplay} · {venueName}</div>
          </div>
        </section>
      )
    }

    if (dateStyle === '2d') {
      const panel: React.CSSProperties = { background: '#FFFFFF', border: '1px solid rgba(43,39,36,.1)' }
      return (
        <section style={sec('#efece4', '34px 24px')}>
         <div className="cl-reveal cl-clip" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ ...panel, borderRadius: '6px 6px 0 0', padding: '32px 26px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F_META, fontSize: 11, color: '#9a917f' }}>
              <span style={{ letterSpacing: '.2em' }}>INVITATION</span><span style={{ letterSpacing: '.08em' }}>NO. {mm}{dd}</span>
            </div>
            <p style={{ margin: '30px 0 0', fontFamily: F_BODY, fontSize: 15, color: '#3a352c', letterSpacing: '.08em' }}>{groomKo} <span style={{ color: '#b0a48c' }}>&amp;</span> {brideKo}</p>
            <div className="cl-reveal cl-blur" data-delay="140" style={{ margin: '20px 0 0', display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: F_NUM, fontWeight: 300, fontSize: 70, lineHeight: 0.85, color: '#231f1b' }}>{mm}.{dd}</span>
              <span style={{ fontFamily: F_BODY, fontSize: 14, color: '#8b8271' }}>{WEEK_KO[dow]}요일</span>
            </div>
            <p style={{ margin: '22px 0 0', fontFamily: F_BODY, fontSize: 13, lineHeight: 1.9, color: '#6f6757', whiteSpace: 'pre-line' }}>{timeDisplay} · {venueName}{venueHall ? ` ${venueHall}` : ''}{venueAddress ? `\n${venueAddress}` : ''}</p>
          </div>
          <div style={{ ...panel, borderTop: 'none', borderBottom: 'none', height: 24, display: 'flex', alignItems: 'center', padding: '0 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: -9, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: '#efece4', border: '1px solid rgba(43,39,36,.1)', clipPath: 'inset(0 0 0 50%)' }} />
            <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: '#efece4', border: '1px solid rgba(43,39,36,.1)', clipPath: 'inset(0 50% 0 0)' }} />
            <div className="cl-reveal cl-tear" data-delay="640" style={{ flex: 1, borderTop: '1px dashed rgba(43,39,36,.28)' }} />
          </div>
          <div style={{ ...panel, borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '26px 26px 30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>{WEEK_KO.map((w, i) => <span key={i} style={{ fontFamily: F_META, fontSize: 11, color: '#a0977f', textAlign: 'center', paddingBottom: 14 }}>{w}</span>)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
              {monthCells.map((n, i) => (
                <div key={i} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {n === null ? null : n === day
                    ? <span className="cl-reveal cl-boop" data-delay="360" style={{ width: 32, height: 32, background: datePoint, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F_NUM, fontWeight: 500, fontSize: 15, color: '#fff' }}>{n}</span>
                    : <span style={{ fontFamily: F_NUM, fontSize: 15, color: '#5b5449' }}>{n}</span>}
                </div>
              ))}
            </div>
            {dday !== null && dday >= 0 && (
              <div className="cl-reveal cl-pop" data-delay="300" style={{ marginTop: 'auto', paddingTop: 22, borderTop: '1px solid rgba(43,39,36,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontFamily: F_BODY, fontSize: 13, color: '#8b8271', letterSpacing: '.06em' }}>예식까지 남은 날</span>
                <span style={{ fontFamily: F_BODY, fontSize: 30, color: '#231f1b' }}>{dday === 0 ? '오늘입니다' : <><CountUp value={dday} style={{ fontFamily: F_NUM, fontSize: 40, fontWeight: 500, color: datePoint }} />일</>}</span>
              </div>
            )}
          </div>
         </div>
        </section>
      )
    }

    // 2e — Editorial
    return (
      <section style={sec('#e9e5dc', '64px 52px 44px')}>
        <p className="cl-reveal cl-up" style={{ margin: 0, fontFamily: F_BODY, fontSize: 11, letterSpacing: '.28em', paddingLeft: '.28em', color: '#8a8272' }}>{year}년 {monthIdx0 + 1}월</p>
        <div className="cl-reveal cl-clip-up" data-delay="200" style={{ margin: '16px 0 0', fontFamily: F_NUM, fontWeight: 300, fontSize: 'clamp(128px,44vw,172px)', lineHeight: 0.82, letterSpacing: '-.04em', color: 'transparent', WebkitTextStroke: '1.2px #4c4638' } as React.CSSProperties}>{day}</div>
        <div style={{ margin: '26px 0 0', display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span className="cl-reveal cl-up" data-delay="640" style={{ fontFamily: F_BODY, fontSize: 17, color: '#3f3a2f', letterSpacing: '.12em', whiteSpace: 'nowrap' }}>{WEEK_KO[dow]}요일 {timeDisplay}</span>
          <span className="cl-reveal cl-linex" data-delay="760" style={{ flex: 1, height: 1, background: 'rgba(43,39,36,.2)' }} />
          {dday !== null && dday >= 0 && <span className="cl-reveal cl-boop" data-delay="920" style={{ fontFamily: F_NUM, fontWeight: 400, fontSize: 30, lineHeight: 1, color: datePoint, whiteSpace: 'nowrap' }}>{dday === 0 ? '오늘' : `D-${dday}`}</span>}
        </div>
        <p className="cl-reveal cl-blur" data-delay="1040" style={{ margin: '34px 0 0', fontFamily: F_BODY, fontSize: 15, lineHeight: 2, color: '#5b5449', whiteSpace: 'pre-line' }}>{'함께 걸어온 시간을\n같은 이름으로 이어가고자 합니다.'}</p>
        <div className="cl-reveal cl-place" data-delay="1200" style={{ marginTop: 'auto', marginLeft: -22, marginRight: -22, background: '#FFFFFF', border: '1px solid rgba(43,39,36,.1)', padding: '22px 22px 20px', boxShadow: '0 18px 30px -26px rgba(20,10,8,.5)' }}>
          <div style={{ paddingBottom: 18, borderBottom: '1px solid rgba(43,39,36,.18)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>{WEEK_KO.map((w, i) => <span key={i} style={{ fontFamily: F_META, fontSize: 10, color: '#8b8271', letterSpacing: '.06em', textAlign: 'center', paddingBottom: 12 }}>{w}</span>)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', alignItems: 'center' }}>
              {weekDays.map((n, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  {n === null ? null : n === day
                    ? <span className="cl-reveal cl-boop" data-delay="420" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ display: 'block', margin: '0 auto' }}>{heartFill(12, datePoint)}</span>
                        <span style={{ fontFamily: F_NUM, fontWeight: 500, fontSize: 24, color: '#231f1b', lineHeight: 1 }}>{n}</span>
                      </span>
                    : <span style={{ fontFamily: F_NUM, fontWeight: 300, fontSize: 17, color: '#8b8271' }}>{n}</span>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ margin: '18px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <p style={{ margin: 0, fontFamily: F_BODY, fontSize: 14, lineHeight: 1.7, color: '#3a352c' }}>{venueName}{venueHall ? ` ${venueHall}` : ''}</p>
              {venueAddress && <p style={{ margin: 0, fontFamily: F_BODY, fontSize: 12, color: '#8b8271' }}>{venueAddress}</p>}
            </div>
            <span style={{ fontFamily: F_BODY, fontSize: 13, color: '#4c4638', letterSpacing: '.1em', whiteSpace: 'nowrap' }}>{groomKo} &amp; {brideKo}</span>
          </div>
        </div>
      </section>
    )
  }

  // 지도 오버레이 탭: 잠금→안내(3초 후 자동 잠금)→활성화
  const handleOverlayTap = useCallback(() => {
    setMapState((prev) => {
      if (prev === 'locked') {
        if (hintTimer.current) clearTimeout(hintTimer.current)
        hintTimer.current = setTimeout(() => setMapState((p) => (p === 'hint' ? 'locked' : p)), 3000)
        return 'hint'
      }
      if (prev === 'hint') {
        if (hintTimer.current) clearTimeout(hintTimer.current)
        return 'active'
      }
      return prev
    })
  }, [])

  // 지도 외부 터치 시 다시 잠금
  useEffect(() => {
    if (mapState === 'locked') return
    const handler = (e: TouchEvent | MouseEvent) => {
      if (mapWrapRef.current && !mapWrapRef.current.contains(e.target as Node)) {
        setMapState('locked')
        if (hintTimer.current) clearTimeout(hintTimer.current)
      }
    }
    document.addEventListener('touchstart', handler, { passive: true })
    document.addEventListener('mousedown', handler, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('mousedown', handler)
    }
  }, [mapState])
  useEffect(() => () => { if (hintTimer.current) clearTimeout(hintTimer.current) }, [])

  // 카카오맵 (다른 템플릿과 동일: 주소 지오코딩 → 지도+마커+말풍선). 실패 시 mapError로 폴백.
  // 주의: 인트로 페이지에서는 지도 컨테이너가 렌더되지 않으므로 page가 main일 때 초기화해야 함
  useEffect(() => {
    if (!venueAddress) return
    if (page !== 'main') return
    let cancelled = false
    let visObs: IntersectionObserver | null = null
    const initMap = () => {
      if (cancelled) return
      const container = mapContainerRef.current
      if (!container || !window.kakao?.maps?.services) return
      // 좌표(경도 x, 위도 y)로 지도 렌더
      const renderAt = (x: string, y: string) => {
        if (cancelled) return
        const center = new window.kakao.maps.LatLng(parseFloat(y), parseFloat(x))
        const map = new window.kakao.maps.Map(container, { center, level: 3 })
        const marker = new window.kakao.maps.Marker({ position: center })
        marker.setMap(map)
        const accent = INK
        const el = document.createElement('div')
        el.style.cssText = 'position:relative;transform:translateY(-8px);display:flex;flex-direction:column;align-items:center;'
        el.innerHTML = `<div style="background:${accent};color:#fff;font-size:12px;font-weight:500;letter-spacing:.02em;line-height:1;padding:7px 14px;border-radius:16px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.18);">${venueName}</div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${accent};margin-top:-1px;"></div>`
        new window.kakao.maps.CustomOverlay({ position: center, content: el, yAnchor: 1.55, xAnchor: 0.5 }).setMap(map)
        // 화면 밖/페이드 중 생성되면 타일이 blank로 남을 수 있어, 잠시 후 + 화면에 보일 때마다 재배치
        const relayout = () => { if (!cancelled) { map.relayout(); map.setCenter(center) } }
        window.setTimeout(relayout, 400)
        visObs = new IntersectionObserver((ents) => { ents.forEach((e) => { if (e.isIntersecting) relayout() }) }, { threshold: 0.05 })
        visObs.observe(container)
      }
      const OK = window.kakao.maps.services.Status.OK
      // 장소(키워드) 검색 폴백: 주소가 부정확해도 장소명/주소로 좌표를 찾음
      const keywordFallback = () => {
        if (cancelled || !window.kakao?.maps?.services?.Places) { setMapError(true); return }
        const places = new window.kakao.maps.services.Places()
        places.keywordSearch(venueAddress, (res: { x: string; y: string }[], st: string) => {
          if (cancelled) return
          if (st === OK && res[0]) { renderAt(res[0].x, res[0].y); return }
          if (venueName) {
            places.keywordSearch(venueName, (res2: { x: string; y: string }[], st2: string) => {
              if (cancelled) return
              if (st2 === OK && res2[0]) renderAt(res2[0].x, res2[0].y)
              else setMapError(true)
            })
          } else setMapError(true)
        })
      }
      const geocoder = new window.kakao.maps.services.Geocoder()
      geocoder.addressSearch(venueAddress, (result: { x: string; y: string }[], status: string) => {
        if (cancelled) return
        if (status === OK && result[0]) renderAt(result[0].x, result[0].y)
        else keywordFallback()
      })
    }
    if (window.kakao?.maps?.services) { initMap(); return () => { cancelled = true; visObs?.disconnect() } }
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
    const existing = document.getElementById('kakao-maps-sdk') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => window.kakao.maps.load(initMap))
      if (window.kakao?.maps) window.kakao.maps.load(initMap)
    } else {
      const script = document.createElement('script')
      script.id = 'kakao-maps-sdk'
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`
      script.async = true
      script.onload = () => { if (!cancelled) window.kakao.maps.load(initMap) }
      document.head.appendChild(script)
    }
    return () => { cancelled = true; visObs?.disconnect() }
  }, [venueAddress, venueName, page])

  // 인사말 배경 (크롭 사진 + 오버레이 색상/투명도)
  const greetingOverlay: string = cc.classicGreetingOverlayColor || '#241610'
  const greetingOverlayOp: number = typeof cc.classicGreetingOverlayOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicGreetingOverlayOpacity)) : 0.5
  // 인사말 / 인용
  const greeting: string = cc.greeting || '오랜 시간 나란히 걸어온 두 사람이\n이제 하나의 이름으로\n같은 길을 걸으려 합니다.\n\n귀한 걸음으로 오시어\n저희의 시작을 축복해 주세요.'
  const quoteText: string | undefined = cc.quote?.text
  const quoteAuthor: string | undefined = cc.quote?.author

  // 갤러리 (각 항목은 문자열 URL 또는 크롭 객체 {url,scale,positionX,positionY}) — 최대 30장 제한
  const galleryItems: unknown[] = (Array.isArray(c.gallery?.images) ? c.gallery.images : []).slice(0, 30)
  const gallery: string[] = galleryItems.map(extractUrl).filter(Boolean)
  const cover = extractUrl(c.cover?.image) || extractUrl(c.media?.cover) || gallery[0] || ''
  const photo = (i: number): string => gallery.length ? gallery[i % gallery.length] : cover
  // 갤러리 슬롯 → 원본 항목(크롭 정보 포함) 반환. 사진이 없으면 null (cropBg가 fallback 처리)
  const galItem = (i: number): unknown => (galleryItems.length ? galleryItems[i % galleryItems.length] : null)
  // 갤러리 슬롯(0~4) → 라이트박스 images(gallery) 배열 상 실제 인덱스 (모듈로 매칭)
  const galIdx = (i: number): number => (gallery.length ? i % gallery.length : 0)
  const openLightbox = (i: number) => { setLbIndex(galIdx(i)); setLbOpen(true) }
  // 히어로 레이아웃(start장) 이후 나머지 사진 '더보기' (기본/앨범/풀블리드 공통). 최대 30장.
  const galleryMore = (start: number, tone: 'ink' | 'ivory' = 'ink') => {
    if (gallery.length <= start) return null
    const rest = gallery.slice(start)
    const c1 = tone === 'ivory' ? ivoryA(0.9) : fgC('gallery')
    const cA = tone === 'ivory' ? ivoryA : (a: number) => fgA('gallery', a)
    return (
      <div style={{ margin: '46px 0 0' }}>
        {!galExpanded ? (
          <button type="button" onClick={() => setGalExpanded(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <span style={{ width: 30, height: 1, background: cA(0.3) }} />
            <span style={{ fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 15, letterSpacing: '.04em', color: c1 }}>사진 더보기</span>
            <span style={{ fontFamily: F_LABEL, fontSize: lfs(10), letterSpacing: '.28em', paddingLeft: '.28em', color: cA(0.5) }}>{String(rest.length).padStart(2, '0')} {nameCase('MORE')}</span>
          </button>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {rest.map((_, k) => (
                <div key={k} onClick={() => openLightbox(start + k)} style={{ aspectRatio: '1/1', cursor: 'pointer', ...cropBg(galItem(start + k), { background: DEEP_BEIGE }), animation: 'cl-fade-soft .8s cubic-bezier(.22,.61,.36,1) both', animationDelay: `${Math.min(k * 60, 600)}ms` }} />
              ))}
            </div>
            <button type="button" onClick={() => setGalExpanded(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%', margin: '28px 0 0', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <span style={{ fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 13, letterSpacing: '.04em', color: cA(0.6) }}>접기</span>
              <span style={{ width: 22, height: 1, background: cA(0.25) }} />
            </button>
          </>
        )}
      </div>
    )
  }
  // 스크롤 연동 갤러리 사진: 고정 프레임(overflow hidden) 안에서 사진이 스크롤에 따라 미세 확대(data-parallax)
  // inset:-4%로 살짝 크게 깔아 스케일이 커져도 프레임 가장자리가 비지 않음. anim=필름현상 등장(빈 문자열이면 부모 등장에 맡김)
  const galParallaxPhoto = (
    idx: number,
    box: React.CSSProperties,
    pos?: Record<string, string>,
    delay?: number,
    anim: string = 'cl-develop',
    frameAnim: string = 'cl-blur'
  ) => (
    <div
      onClick={() => openLightbox(idx)}
      className={frameAnim ? `cl-reveal ${frameAnim}` : undefined}
      data-delay={delay ? String(delay) : undefined}
      style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', ...box }}
    >
      <div
        className={anim ? `cl-reveal ${anim}` : undefined}
        style={{ position: 'absolute', inset: 0, ...cropBg(galItem(idx), { background: DEEP_BEIGE }, pos || {}) }}
      />
    </div>
  )

  // 갤러리 라이트박스 스타일 (1=에디토리얼 2=글라스 4=룩북 5=시네마 6=미니멀 7=매거진 9=필름)
  const lbVariant = Number(cc.classicLightboxVariant) || 1
  // 갤러리 레이아웃 타입 (기본/앨범 스프레드/풀블리드 시퀀스/스와이프 카드/필름 스트립) + 공통 캡션
  const galType: 'default' | 'album' | 'fullbleed' | 'swipe' | 'film' =
    ['default', 'album', 'fullbleed', 'swipe', 'film'].includes(cc.classicGalleryType) ? cc.classicGalleryType : 'default'
  const galCaption: string = cc.classicGalleryCaption || 'a quiet afternoon in June'
  const galCount = Math.max(gallery.length, 1)

  // 스와이프 갤러리: 자동 전환 (약 3.4초 간격)
  useEffect(() => {
    if (galType !== 'swipe' || galCount <= 1) return
    const id = window.setInterval(() => setGalSwipeIdx((i) => (i + 1) % galCount), 3400)
    return () => window.clearInterval(id)
  }, [galType, galCount])

  // 트레이싱지 시작 문구 타자기 효과 (한 글자씩)
  useEffect(() => {
    if (openingStyle !== '트레이싱지') { setTraceTyped(traceText.length); return }
    setTraceTyped(0)
    let i = 0
    let interval: ReturnType<typeof setInterval> | undefined
    const start = window.setTimeout(() => {
      interval = setInterval(() => {
        i += 1
        setTraceTyped(i)
        if (i >= traceText.length && interval) clearInterval(interval)
      }, 130)
    }, 500)
    return () => { clearTimeout(start); if (interval) clearInterval(interval) }
  }, [openingStyle, traceText])

  // 계좌
  type Acct = { line: string; who: string; copy: string }
  const buildAccts = (rows: { person: any; role: string }[]): Acct[] =>
    rows.map(({ person, role }) => {
      const b = person?.bank
      if (!b?.enabled || (!b?.account && !b?.bank)) return null
      const line = `${b.bank || ''} ${b.account || ''}`.trim()
      const who = [person.name, role].filter(Boolean).join(' · ')
      return { line, who, copy: b.account || line }
    }).filter(Boolean) as Acct[]
  const groomAccts = buildAccts([{ person: groom, role: '' }, { person: groom.father, role: '아버지' }, { person: groom.mother, role: '어머니' }])
  const brideAccts = buildAccts([{ person: bride, role: '' }, { person: bride.father, role: '아버지' }, { person: bride.mother, role: '어머니' }])
  // 표시: 추가정보에서 토글(enabled)한 계좌만 표시 (신랑측/신부측 자동)
  const acctSides = ([
    groomAccts.length ? { side: '신랑측', accts: groomAccts } : null,
    brideAccts.length ? { side: '신부측', accts: brideAccts } : null,
  ].filter(Boolean)) as { side: string; accts: Acct[] }[]

  // 오시는 길 rows
  const dirRows = [
    directions.publicTransport && { label: '대중교통', text: directions.publicTransport },
    directions.train && { label: '기차', text: directions.train },
    directions.expressBus && { label: '고속버스', text: directions.expressBus },
    directions.car && { label: '자가용', text: directions.car },
  ].filter(Boolean) as { label: string; text: string }[]
  const dirDisplay = dirRows.length ? dirRows : [
    { label: '대중교통', text: '1·2호선 시청역 4번 출구에서 도보 5분' },
    { label: '고속버스', text: '덕수궁 정류장 하차 · 간선 401, 405, 지선 7011' },
    { label: '자가용', text: '건물 지하 1~3층 주차 · 안내 데스크에서 3시간 무료' },
  ]

  // 안내 캐러셀
  const infoSlides: { title: string; body: string; pos: string; photo?: unknown }[] =
    (Array.isArray(cc.classicInfo) && cc.classicInfo.length ? cc.classicInfo : [
      { title: 'Ceremony', pos: '50% 34%', body: '예식은 오후 두 시에 시작됩니다.\n30분 전까지 도착하시어\n신랑 신부와 인사 나눠주세요.' },
      { title: 'Reception', pos: '40% 46%', body: '양식 정찬 코스가 준비되어 있습니다.\n웨딩 잔치국수까지 함께 즐겨주세요.' },
      { title: 'Parking', pos: '62% 40%', body: '건물 지하 1~3층 주차장을 이용하실 수 있습니다.\n안내 데스크에서 세 시간까지 무료입니다.' },
    ])
  // 배경음악
  const bgmUrl: string = (cc.classicBgmEnabled && cc.classicBgmUrl) ? cc.classicBgmUrl : ''
  // 결혼식 안내 섹션 배경 + 오버레이
  const infoSecBg = cc.classicInfoSectionBg
  const infoSecOverlay: string = cc.classicInfoSectionOverlayColor || '#1C100D'
  const infoSecOverlayOp: number = typeof cc.classicInfoSectionOverlayOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicInfoSectionOverlayOpacity)) : (extractUrl(infoSecBg) ? 0.45 : 0)
  const infoHasBg = !!extractUrl(infoSecBg)
  const infoImgText: string = cc.classicInfoImgTextColor || '#FFFFFF'
  const infoImgTextA = (a: number) => `rgba(${hexToRgb(infoImgText, '255,255,255')},${a})`
  // 커플소개 섹션 배경 사진 + 오버레이 + 이미지 위 텍스트
  const introSecBg = cc.classicIntroSectionBg
  const introSecOverlay: string = cc.classicIntroSectionOverlayColor || '#1C100D'
  const introSecOverlayOp: number = typeof cc.classicIntroSectionOverlayOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicIntroSectionOverlayOpacity)) : (extractUrl(introSecBg) ? 0.4 : 0)
  const introHasBg = !!extractUrl(introSecBg)
  const introImgText: string = cc.classicIntroImgTextColor || '#FFFFFF'
  const introImgTextA = (a: number) => `rgba(${hexToRgb(introImgText, '255,255,255')},${a})`
  // 감사인사(공유) 섹션 배경 사진 + 오버레이 + 이미지 위 텍스트
  const thanksSecBg = cc.classicThanksSectionBg
  const thanksSecOverlay: string = cc.classicThanksSectionOverlayColor || '#1C100D'
  const thanksSecOverlayOp: number = typeof cc.classicThanksSectionOverlayOpacity === 'number' ? Math.max(0, Math.min(1, cc.classicThanksSectionOverlayOpacity)) : (extractUrl(thanksSecBg) ? 0.4 : 0)
  const thanksHasBg = !!extractUrl(thanksSecBg)
  const thanksImgText: string = cc.classicThanksImgTextColor || '#FFFFFF'
  const thanksImgTextA = (a: number) => `rgba(${hexToRgb(thanksImgText, '255,255,255')},${a})`
  // 결혼식 안내(가이드) — 켠 섹션 + 켠 항목만
  const guideOn = cc.classicGuideEnabled === true
  const guideList: { title: string; body: string; photo?: unknown }[] = (Array.isArray(cc.classicGuide) ? cc.classicGuide : []).filter((it: { title?: string; body?: string; enabled?: boolean }) => it?.enabled && (it.title || it.body))

  // 섹션 순서 (전체) — flex order로 제어
  const CONTENT_KEYS = ['letter', 'intro', 'interstitials', 'gallery', 'date', 'directions', 'guide', 'accounts', 'links', 'rsvp']
  const contentOrder: string[] = (() => {
    const saved = Array.isArray(cc.classicContentOrder) ? (cc.classicContentOrder as string[]).filter((k) => CONTENT_KEYS.includes(k)) : []
    // 모든 키를 포함한 완전한 순서만 사용 (레거시 부분 순서는 폐기하여 미리보기와 어긋나지 않게 함)
    const complete = saved.length === CONTENT_KEYS.length && CONTENT_KEYS.every((k) => saved.includes(k))
    return complete ? saved : [...CONTENT_KEYS]
  })()
  const orderOf = (k: string) => 10 + (contentOrder.indexOf(k) < 0 ? CONTENT_KEYS.indexOf(k) : contentOrder.indexOf(k))
  const hiddenSet = new Set(Array.isArray(cc.classicHiddenSections) ? (cc.classicHiddenSections as string[]) : [])
  const hide = (k: string) => (hiddenSet.has(k) ? { display: 'none' as const } : {})
  // 섹션별 배경 모드: 'tinted'로 지정된 섹션은 틴티드 배경 + 틴티드 텍스트 적용, 그 외는 각 섹션 고유 디자인 유지
  const sectionBgMap = (cc.classicSectionBgMap && typeof cc.classicSectionBgMap === 'object') ? cc.classicSectionBgMap as Record<string, string> : {}
  const isTinted = (k: string) => sectionBgMap[k] === 'tinted'
  // 틴티드로 지정한 섹션: 배경=틴티드 배경, 텍스트=틴티드 배경 텍스트
  const TINTABLE = new Set(['intro', 'gallery', 'directions', 'guide', 'accounts', 'links', 'date', 'rsvp', 'interstitials'])
  const tintBg = (k: string) => (isTinted(k) && TINTABLE.has(k) ? { background: DEEP_BEIGE, backgroundImage: 'none' as const } : {})
  // 밝은 섹션 배경 위 전경색: 기본→기본 배경 텍스트, 틴티드→틴티드 배경 텍스트
  const fgC = (k: string) => (isTinted(k) && TINTABLE.has(k) ? TXT_TINT : TXT_DEFAULT)
  const fgA = (k: string, a: number) => (isTinted(k) && TINTABLE.has(k) ? txtTintA(a) : txtDefA(a))
  // 섹션-배경 위 텍스트: 이미지 배경이면 전용 색, 아니면 기본/틴티드
  const introFgC = introHasBg ? introImgText : fgC('intro')
  const introFgAf = (a: number) => (introHasBg ? introImgTextA(a) : fgA('intro', a))
  // 신랑신부 소개 프레임 '없음' + 텍스트 색상 (프레임 제거 시 배경 위에 바로 놓여 색 지정 가능)
  const eachNoFrame = cc.classicIntroEachFrame === 'none'
  const eachBox = cc.classicIntroEachFrame === 'box' // 깔끔한 네모박스(아이보리 + 얇은 테두리)
  const togetherNoFrame = cc.classicIntroTogetherFrame === 'none'
  const introTxtColor: string | undefined = typeof cc.classicIntroTextColor === 'string' && cc.classicIntroTextColor ? cc.classicIntroTextColor : undefined
  const introTxtA = (a: number) => (introTxtColor ? `rgba(${hexToRgb(introTxtColor, '53,23,20')},${a})` : introFgAf(a))
  // 각자: 프레임(밝은 플라크) 위면 테마 INK, 없음이면 커스텀 색 or 섹션 적응색
  const eachInk = eachNoFrame ? (introTxtColor || introFgC) : INK
  const eachInkA = (a: number) => (eachNoFrame ? introTxtA(a) : inkA(a))
  // 함께: 기본 introFgC, 없음이면 커스텀 색 우선
  const togetherInk = togetherNoFrame ? (introTxtColor || introFgC) : introFgC
  const togetherInkA = (a: number) => (togetherNoFrame ? introTxtA(a) : introFgAf(a))
  const infoFgC = infoHasBg ? infoImgText : fgC('guide')
  const infoFgAf = (a: number) => (infoHasBg ? infoImgTextA(a) : fgA('guide', a))
  const thanksFgC = thanksHasBg ? thanksImgText : fgC('links')
  const thanksFgAf = (a: number) => (thanksHasBg ? thanksImgTextA(a) : fgA('links', a))
  // 섹션 배경: 기본→기본 배경(customBgColor=IVORY), 틴티드→틴티드 배경(customSectionBgColor=DEEP_BEIGE)
  const secBg = (k: string) => (isTinted(k) && TINTABLE.has(k) ? DEEP_BEIGE : IVORY)
  // 예식일정·RSVP 전경색 (밝은 배경 위 → 기본/틴티드 텍스트)
  const dInk = fgC('date')
  const dInkA = (a: number) => fgA('date', a)
  const rInk = fgC('rsvp')
  const rInkA = (a: number) => fgA('rsvp', a)

  // 간지(interstitial) 동적 섹션: 타입별(사진2 / FULL사진 / 인용구). 사진은 크롭(ClassicPhoto)
  type Inter = { type: 'photo2' | 'photo1' | 'photoText'; photos?: unknown[]; images?: string[]; text?: string; caption?: string; bg?: unknown; overlayColor?: string; overlayOpacity?: number; textSize?: number; textAlign?: 'left' | 'center' | 'right' }
  const interstitials: Inter[] = (Array.isArray(cc.classicInterstitials) && cc.classicInterstitials.length)
    ? cc.classicInterstitials
    : [
        { type: 'photo1', text: 'The morning we chose each other, again.' },
      ]
  // 간지 사진 슬롯 → 크롭 렌더 (없으면 갤러리 사진 fallback)
  const interSrc = (item: Inter, i: number) => item.photos?.[i] ?? item.images?.[i]

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const doCopy = (text: string, key: string) => {
    try { navigator.clipboard.writeText(text) } catch {}
    setCopied(key)
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 1400)
  }
  const doShare = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({ title: `${brideKo} ♥ ${groomKo}`, text: '결혼식에 초대합니다', url: shareUrl }).catch(() => {})
    } else { doCopy(shareUrl, 'share') }
  }

  const bgPhoto = (i: number, extra: Record<string, string> = {}) => {
    const src = photo(i)
    return src ? { backgroundImage: `url(${src})`, backgroundSize: 'cover', ...extra } : { background: DEEP_BEIGE, ...extra }
  }
  const bgOf = (src: string, extra: Record<string, string> = {}) => (src ? { backgroundImage: `url(${src})`, backgroundSize: 'cover', ...extra } : { background: DEEP_BEIGE, ...extra })
  // 크롭 사진 필드(ClassicPhoto: {url,scale,positionX,positionY}) → THE SIMPLE 방식 렌더. 없으면 fallback 스타일
  const cropBg = (p: unknown, fallback: Record<string, string>, extra: Record<string, string> = {}) => {
    const url = extractUrl(p)
    if (!url) return { ...fallback, ...extra }
    const o = (p && typeof p === 'object' ? p : {}) as { scale?: number; positionX?: number; positionY?: number }
    const sc = o.scale ?? 1, px = o.positionX ?? 0, py = o.positionY ?? 0
    // 크롭 사진: 크롭 위치가 우선 (extra의 backgroundPosition 무시)
    const { backgroundPosition: _bp, ...restExtra } = extra
    return { backgroundImage: `url(${url})`, backgroundSize: sc > 1 ? `${sc * 100}%` : 'cover', backgroundPosition: `${50 - px}% ${50 - py}%`, backgroundRepeat: 'no-repeat', ...restExtra }
  }

  const label = (size: number, ls: number, color: string): React.CSSProperties => ({ margin: 0, fontFamily: F_LABEL, fontSize: Math.round(size * labelScale * 10) / 10, letterSpacing: `${ls}em`, color, paddingLeft: `${ls}em` })

  // 간지 풀화면 배경 오버레이 (사진2 / 인용구)
  const interOverlay = (item: Inter): React.ReactNode => {
    const hasBg = !!extractUrl(item.bg)
    const op = typeof item.overlayOpacity === 'number' ? Math.max(0, Math.min(1, item.overlayOpacity)) : (hasBg ? 0.4 : 0)
    if (op <= 0) return null
    return <div style={{ position: 'absolute', inset: 0, background: item.overlayColor || '#1C100D', opacity: op, pointerEvents: 'none', zIndex: 0 }} />
  }

  // 간지 섹션 렌더 (타입별)
  const renderInterstitial = (item: Inter, idx: number) => {
    const key = `inter-${idx}`
    const baseSize = item.type === 'photoText' ? 21 : item.type === 'photo1' ? 20 : 18
    const fs = typeof item.textSize === 'number' ? item.textSize : baseSize
    const ta = item.textAlign || (item.type === 'photoText' ? 'left' : 'center')
    if (item.type === 'photo1') {
      return (
        <section key={key} style={{ position: 'relative', minHeight: '72vh', background: DARK_PHOTO, overflow: 'hidden' }}>
          <div data-parallax className="cl-reveal cl-clip" style={{ position: 'absolute', inset: '-2%', ...cropBg(interSrc(item, 0), { background: 'transparent' }), willChange: 'transform' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(36,17,16,.34),rgba(36,17,16,.04) 42%,rgba(36,17,16,.6))' }} />
          <div style={{ position: 'absolute', inset: 20, border: `1px solid ${ivoryA(0.5)}`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 27, border: `1px solid ${ivoryA(0.22)}`, pointerEvents: 'none' }} />
          {item.text ? (
            <div className="cl-reveal cl-blur" style={{ position: 'absolute', left: 46, right: 46, bottom: 64, textAlign: ta }}>
              <p style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: fs, lineHeight: 1.5, color: IVORY, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{item.text}</p>
            </div>
          ) : null}
        </section>
      )
    }
    if (item.type === 'photoText') {
      return (
        <section key={key} style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '78px 0', ...cropBg(item.bg, { background: IVORY }), overflow: 'hidden' }}>
          {interOverlay(item)}
          <div className="cl-reveal cl-clip" data-delay="120" style={{ position: 'relative', zIndex: 1, margin: '0 auto 0 0', width: '82%', aspectRatio: '4/5', ...cropBg(interSrc(item, 0), { background: DEEP_BEIGE }), filter: 'saturate(.68)' }} />
          <div className="cl-reveal cl-blur" data-delay="380" style={{ position: 'relative', zIndex: 2, margin: '-58px 30px 0 auto', width: '78%', background: PAPER, padding: '34px 26px 30px', boxShadow: '0 26px 44px -36px rgba(53,23,20,.7)' }}>
            <blockquote style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: fs, lineHeight: 1.5, color: INK, textAlign: ta, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>“{item.text || ''}”</blockquote>
            {item.caption ? <p style={{ margin: '20px 0 0', fontFamily: F_BODY, fontSize: bfs(11), color: inkA(0.55), textAlign: ta }}>{item.caption}</p> : null}
          </div>
        </section>
      )
    }
    // photo2 (기본)
    return (
      <section key={key} style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '84px 30px', ...cropBg(item.bg, { background: INK }), overflow: 'hidden' }}>
        {interOverlay(item)}
        <div style={{ position: 'relative', zIndex: 1, height: 470 }}>
          <div className="cl-reveal cl-clip" style={{ transform: 'rotate(-2deg)', position: 'absolute', left: 0, top: 10, width: '58%', background: PAPER, padding: 9, boxShadow: '0 28px 42px -30px rgba(0,0,0,.95)' }}>
            <div style={{ aspectRatio: '3/4', ...cropBg(interSrc(item, 0), { background: DEEP_BEIGE }), filter: 'grayscale(.25) saturate(.65)' }} />
          </div>
          <div className="cl-reveal cl-clip" data-delay="420" style={{ transform: 'rotate(1.6deg)', position: 'absolute', right: 0, top: 206, width: '50%', background: PAPER, padding: 8, boxShadow: '0 28px 42px -30px rgba(0,0,0,.95)' }}>
            <div style={{ aspectRatio: '3/4', ...cropBg(interSrc(item, 1), { background: DEEP_BEIGE }), filter: 'grayscale(.25) saturate(.65)' }} />
          </div>
        </div>
        {item.text ? (
          <p className="cl-reveal cl-blur" data-delay="200" style={{ position: 'relative', zIndex: 1, margin: '40px 34px 0', textAlign: ta, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: fs, lineHeight: 1.55, color: ivoryA(0.85), whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{item.text}</p>
        ) : null}
      </section>
    )
  }

  // ===== 스크롤 리빌 + 스크롤 연동 =====
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        const el = e.target as HTMLElement
        const d = parseInt(el.dataset.delay || '0', 10)
        window.setTimeout(() => el.classList.add('is-in'), d)
        io.unobserve(el)
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -18% 0px' })
    root.querySelectorAll<HTMLElement>('.cl-reveal').forEach((el) => io.observe(el))

    let ticking = false
    const doScroll = () => {
      const intro = root.querySelector<HTMLElement>('[data-scene="opening"]')
      if (intro) {
        const r = intro.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, -r.top / (r.height * 0.62)))
        const inner = intro.querySelector<HTMLElement>('[data-intro-inner]')
        if (inner) { inner.style.transform = `translateY(${(-p * 90).toFixed(1)}px)`; inner.style.opacity = String(1 - p) }
      }
      const letter = root.querySelector<HTMLElement>('[data-scene="letter"]')
      if (letter) {
        const r = letter.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight * 0.9)))
        const photo = letter.querySelector<HTMLElement>('[data-letter-photo]')
        const scrim = letter.querySelector<HTMLElement>('[data-letter-scrim]')
        if (photo) { photo.style.opacity = (0.25 + 0.75 * p).toFixed(3); photo.style.transform = `scale(${(1.06 - 0.06 * p).toFixed(4)})` }
        if (scrim) scrim.style.opacity = (1 - 0.25 * p).toFixed(3)
      }
      root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const r = el.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height)))
        el.style.transform = `scale(${(1 + p * 0.03).toFixed(4)})`
      })
      // 리빌 폴백 (옵저버 누락 대비: 화면에 들어온 요소는 반드시 표시)
      root.querySelectorAll<HTMLElement>('.cl-reveal:not(.is-in)').forEach((el) => {
        const b = el.getBoundingClientRect()
        if (b.top < window.innerHeight * 0.84 && b.bottom > 0) {
          const d = parseInt(el.dataset.delay || '0', 10)
          window.setTimeout(() => el.classList.add('is-in'), d)
        }
      })
    }
    // rAF 스로틀: 스크롤 이벤트가 몰려도 프레임당 1회만 계산 → 저사양 60fps 유지
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => { doScroll(); ticking = false })
    }
    // capture:true → 내부 스크롤 컨테이너(에디터 미리보기 등)의 스크롤도 window에서 잡혀 리빌 fallback이 동작
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    doScroll()
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions) }
  }, [page, content])

  // 배경음악 자동재생 시도 (브라우저 정책상 첫 상호작용 후 재생)
  useEffect(() => {
    if (!bgmUrl || isPreview || cc.classicBgmAutoplay === false) return
    const a = bgmRef.current
    if (!a) return
    const tryPlay = () => { a.play().then(() => setBgmPlaying(true)).catch(() => {}) }
    tryPlay()
    const onFirst = () => { tryPlay() }
    window.addEventListener('pointerdown', onFirst, { once: true })
    window.addEventListener('touchstart', onFirst, { once: true, passive: true })
    return () => { window.removeEventListener('pointerdown', onFirst); window.removeEventListener('touchstart', onFirst) }
  }, [bgmUrl, isPreview, cc.classicBgmAutoplay])

  // 인트로 오프닝 완료 후 터치/스크롤 시 본문으로 (자동 전환 안 함)
  // 에디터 프리뷰(isPreview)에서는 상단 토글로만 전환 — 스크롤로 넘어가지 않음
  useEffect(() => {
    if (isPreview && !introClickAdvance) return
    if (page !== 'intro') return
    // 프레임(바로시작)은 인터랙션 없이 즉시 스크롤로 소개 이동 가능
    if (!introDone) return
    // 접힌편지·사진뒤집기는 카드 상호작용이 우선 — 다 펼치거나(fold 완료) 뒤집은 뒤에는 탭으로도 본문 전환 허용
    const clickAdvances = openingStyle === '접힌 편지' ? fold >= 2 : openingStyle === '사진 뒤집기' ? flip : true
    setIntroLeaving(false)
    let ready = false
    let fired = false
    const enable = setTimeout(() => { ready = true }, 500) // 오프닝 탭이 즉시 넘기지 않도록
    // 인트로가 먼저 부드럽게 사라진 뒤 본문으로 전환 (크로스페이드)
    const go = () => {
      if (!ready || fired) return
      fired = true
      setIntroLeaving(true)
      window.setTimeout(() => setPage('main'), 520)
    }
    // 짧은 스침으로 넘어가지 않도록 임계값: 스와이프 90px / 휠 누적 60 / 스크롤 40px
    let startY = 0
    let wheelAcc = 0
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => { if (startY - e.touches[0].clientY > 90) go() }
    const onWheel = (e: WheelEvent) => { wheelAcc = Math.max(0, wheelAcc + e.deltaY); if (wheelAcc > 60) go() }
    const onScroll = () => { if (window.scrollY > 40) go() }
    const onClick = () => go()
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    if (clickAdvances) window.addEventListener('click', onClick)
    return () => {
      clearTimeout(enable)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('click', onClick)
    }
  }, [isPreview, introClickAdvance, page, introDone, openingStyle, fold, flip])

  // 본문 진입 시 상단으로 (+ 입장 제스처의 관성 스크롤이 이어지지 않도록 잠깐 고정)
  useEffect(() => {
    if (page !== 'main') return
    window.scrollTo(0, 0)
    const until = Date.now() + 700
    const holdTop = () => { window.scrollTo(0, 0); if (Date.now() < until) window.requestAnimationFrame(holdTop) }
    window.requestAnimationFrame(holdTop)
  }, [page])

  // D-day 계산 (클라이언트에서만)
  useEffect(() => {
    const target = wedding.date ? new Date(wedding.date) : null
    if (!target || isNaN(target.getTime())) { setDday(null); return }
    target.setHours(0, 0, 0, 0)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    setDday(Math.round((target.getTime() - today.getTime()) / 86400000))
  }, [wedding.date])

  // 에디터 프리뷰 Intro/Main 토글 동기화
  useEffect(() => {
    setPage(skipIntro ? 'main' : 'intro')
  }, [skipIntro])

  // D-Day popup state
  const [showDdayPopup, setShowDdayPopup] = useState(false)
  useEffect(() => {
    if (isPreview) return
    if (ddayPopup?.enabled) {
      const t = setTimeout(() => setShowDdayPopup(true), 800)
      return () => clearTimeout(t)
    }
  }, [ddayPopup?.enabled, isPreview])

  return (
    <div style={{ minHeight: isPreview ? undefined : '100vh', height: isPreview && page === 'intro' ? '100%' : undefined, display: 'flex', justifyContent: 'center', background: '#c9c1b3' }}>
      {/* 워터마크 배너 (미결제 · 실제 페이지에서만) */}
      {!isPaid && !isPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
        </div>
      )}
      <div ref={rootRef} className="cl-root" style={{ width: '100%', maxWidth: 420, height: isPreview && page === 'intro' ? '100%' : undefined, position: 'relative', overflow: 'hidden', background: IVORY, boxShadow: '0 0 80px rgba(53,23,20,.2)', fontFamily: F_BODY, color: INK }}>
        <style dangerouslySetInnerHTML={{ __html: CLASSIC_STYLES }} />
        {/* Grain overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, opacity: 0.5, mixBlendMode: 'multiply', backgroundImage: 'repeating-linear-gradient(0deg,rgba(53,23,20,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(53,23,20,.03) 0 1px,transparent 1px 3px)' }} />

        {/* 배경음악 */}
        {bgmUrl && (
          <div style={{ position: 'sticky', top: 14, zIndex: 30, height: 0, display: 'flex', justifyContent: 'flex-end', padding: '0 14px', pointerEvents: 'none' }}>
            <audio ref={bgmRef} src={bgmUrl} loop preload="auto" />
            <button
              type="button"
              aria-label="배경음악"
              onClick={() => { const a = bgmRef.current; if (!a) return; if (a.paused) { a.play().then(() => setBgmPlaying(true)).catch(() => {}) } else { a.pause(); setBgmPlaying(false) } }}
              style={{ pointerEvents: 'auto', width: 38, height: 38, borderRadius: '50%', background: inkA(0.42), backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', border: `1px solid ${ivoryA(0.35)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={IVORY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ animation: bgmPlaying ? 'cl-spin 4.5s linear infinite' : 'none' }}>
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </button>
          </div>
        )}

        {/* ===== I. Opening (인트로: 실링/리본/트레이싱지/접힌편지/사진뒤집기) ===== */}
        {page === 'intro' && (
        <section data-scene="opening" style={{ position: 'relative', minHeight: isPreview ? '100%' : '100svh', height: isPreview ? '100%' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 30px', background: isDarkOpening ? DARK_PHOTO : openBg, overflow: 'hidden', opacity: introLeaving ? 0 : 1, transition: 'opacity .55s ease' }}>
          {openBgImg && openingStyle !== '프레임' && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${openBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />}
          {/* 엠보스 프레임 — 프레임(바로시작) 전용 · 배경색 위 multiply 오버레이 (frame1/frame2) */}
          {openingStyle === '프레임' && openFrame !== 'none' && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('/classic/${openFrame}.webp')`, backgroundSize: '100% 100%', mixBlendMode: 'multiply', pointerEvents: 'none', animation: 'cl-frame-in 1.6s cubic-bezier(.22,.61,.36,1) .1s both' }} />}

          {/* 리본 매듭·접힌 편지·사진 뒤집기: 처음엔 배경 살짝 어둡게 → 상호작용 시 밝아짐 (카드는 위에 떠 있음) */}
          {(openingStyle === '실링' || openingStyle === '접힌 편지' || openingStyle === '사진 뒤집기') && infoPhotoOp > 0 && (
            <div style={{ position: 'absolute', inset: 0, ...(openingStyle === '사진 뒤집기' ? cropBg(cc.classicFlipPhoto, { background: 'transparent' }) : { background: 'transparent' }), opacity: infoPhotoOp, pointerEvents: 'none' }} />
          )}
          {(openingStyle === '실링' || openingStyle === '접힌 편지' || openingStyle === '사진 뒤집기') && (
            <div style={{ position: 'absolute', inset: 0, background: `rgb(${hexToRgb(infoOverlay, '28,16,13')})`, opacity: ((openingStyle === '실링' && ribbon) || (openingStyle === '접힌 편지' && fold > 0) || (openingStyle === '사진 뒤집기' && flip)) ? infoBrightOverlayOp : infoDarkOverlayOp, transition: 'opacity 1.2s ease', pointerEvents: 'none' }} />
          )}

          {openingStyle === '트레이싱지' ? (
            <div data-intro-inner onClick={() => setFrost(true)} style={{ position: 'absolute', inset: 0, cursor: 'pointer', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, ...(openBgImg ? bgOf(openBgImg, { backgroundPosition: '52% 38%' }) : { background: DARK_PHOTO }), animation: 'cl-kenburns 7s ease-out .2s both', willChange: 'transform' }} />
              {traceVeilOp > 0 && <div style={{ position: 'absolute', inset: 0, background: traceVeil, opacity: traceVeilOp, pointerEvents: 'none' }} />}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <p style={{ ...label(9.5, 0.46, ivoryA(0.85)), textShadow: '0 1px 10px rgba(20,10,8,.55)', animation: frost ? 'cl-fade-soft .9s ease .35s both' : undefined }}>{nameCase('WE INVITE YOU')}</p>
                <h1 style={{ margin: '22px 0 0', fontFamily: nameFont, fontSize: 42, lineHeight: 1.12, color: IVORY, textShadow: '0 2px 14px rgba(20,10,8,.55)', animation: frost ? 'cl-emerge 1.2s cubic-bezier(.22,.61,.36,1) .55s both' : undefined }}>{nameGroom}<br />{nameBride}</h1>
                <p style={{ margin: '26px 0 0', fontFamily: F_BODY, fontSize: bfs(14), letterSpacing: '.04em', color: ivoryA(0.92), textShadow: '0 1px 10px rgba(20,10,8,.55)', animation: frost ? 'cl-fade-soft 1s ease 1.15s both' : undefined }}>{dateFullKo}</p>
                <p style={{ margin: '12px 0 0', fontFamily: F_BODY, fontSize: bfs(12), letterSpacing: '.02em', color: ivoryA(0.85), textShadow: '0 1px 10px rgba(20,10,8,.55)', animation: frost ? 'cl-fade-soft 1s ease 1.3s both' : undefined }}>{timeDisplay} · {venueName}</p>
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,241,233,.78)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', opacity: frost ? 0 : 1, transition: 'opacity 1.2s ease', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <p style={{ margin: 0, fontFamily: F_BODY, fontSize: bfs(15), letterSpacing: '.02em', color: inkA(0.62), minHeight: '1.4em' }}>{traceText.slice(0, traceTyped)}<span style={{ display: 'inline-block', marginLeft: 1, color: inkA(0.5), animation: 'cl-caret 1s step-end infinite' }}>|</span></p>
                <p style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 11.5, letterSpacing: '.1em', paddingLeft: '.1em', color: inkA(0.42), opacity: traceTyped >= traceText.length ? 1 : 0, transition: 'opacity .8s ease' }}>화면을 클릭해주세요.</p>
              </div>
            </div>
          ) : (
            <div data-intro-inner style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30, width: '100%', position: 'relative' }}>

              {/* 프레임 (바로 시작: 인장·탭 없이 커버 표시 → 스크롤 시 소개로) */}
              {openingStyle === '프레임' && (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 470 }}>
                  <div style={{ position: 'relative', textAlign: 'center' }}>
                    <p style={{ ...label(9.5, 0.46, frameInkA(0.5)), animation: 'cl-fade-soft .9s ease .2s both' }}>{nameCase('WE INVITE YOU')}</p>
                    <h1 style={{ margin: '22px 0 0', fontFamily: nameFont, fontWeight: 400, fontSize: nameLang === 'ko' ? 34 : 44, lineHeight: 1.12, letterSpacing: nameLang === 'ko' ? '.02em' : '.03em', color: frameInk, animation: 'cl-letters 1.5s cubic-bezier(.22,.61,.36,1) .45s both' }}>{nameGroom}<span style={{ display: 'block', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 20, letterSpacing: 0, opacity: 0.55, margin: '10px 0', lineHeight: 1 }}>and</span>{nameBride}</h1>
                    <div style={{ width: 1, height: 34, background: frameInkA(0.22), margin: '26px auto', transformOrigin: 'center', animation: 'cl-line-grow .85s ease .95s both' }} />
                    <p style={{ margin: 0, fontFamily: F_BODY, fontSize: bfs(14), letterSpacing: '.04em', color: frameInk, animation: 'cl-fade-soft 1s ease 1.2s both' }}>{dateFullKo}</p>
                    <p style={{ margin: '12px 0 0', fontFamily: F_BODY, fontSize: bfs(12), letterSpacing: '.02em', color: frameInkA(0.7), animation: 'cl-fade-soft 1s ease 1.35s both' }}>{timeDisplay} · {venueName}</p>
                  </div>
                </div>
              )}

              {/* 실링 — 편지봉투 안에서 편지(이름 카드)가 올라오는 연출 */}
              {openingStyle === '실링' && (
                <div onClick={() => setRibbon(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', minHeight: 470, cursor: ribbon ? 'default' : 'pointer' }}>
                  <div style={{ position: 'relative', width: 344, aspectRatio: '760 / 790', animation: 'cl-env-in 1.15s cubic-bezier(.22,.61,.36,1) .15s both' }}>
                    {/* (뒤) 열린 봉투 LT1 — 열릴 때 */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundImage: "url('/classic/lt-open.webp')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'drop-shadow(0 22px 34px rgba(53,23,20,.28))', opacity: ribbon ? 1 : 0, transform: ribbon ? 'scale(1)' : 'scale(1.02)', transformOrigin: '50% 42%', transition: 'opacity .6s ease .4s, transform .8s cubic-bezier(.22,.61,.36,1) .4s' }} />
                    {/* (중간) 편지 이름 카드 — 불투명 · 슬라이드 없이 위→아래로 나타남 */}
                    {ribbon && (
                      <div style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 2, transform: 'translate(-50%,-74%)' }}>
                        <div style={{ width: 232, background: PAPER, boxShadow: '0 18px 32px -18px rgba(53,23,20,.55)', border: `1px solid ${openInkA(0.1)}`, padding: '24px 20px 88px', textAlign: 'center', animation: 'cl-card-reveal 1.2s cubic-bezier(.22,.61,.36,1) .8s both' }}>
                          <p style={label(9, 0.44, openInkA(0.5))}>{nameCase('SAVE THE DATE')}</p>
                          <h1 style={{ margin: '14px 0 0', fontFamily: nameFont, fontSize: 26, lineHeight: 1.16, color: openInk }}>{nameGroom}<br />{nameBride}</h1>
                          <div style={{ width: 22, height: 1, background: openInkA(0.25), margin: '16px auto' }} />
                          <p style={{ margin: 0, fontFamily: F_BODY, fontSize: bfs(12), letterSpacing: '.03em', color: openInk }}>{dateFullKo}</p>
                          <p style={{ margin: '10px 0 0', fontFamily: F_BODY, fontSize: bfs(11), letterSpacing: '.02em', color: openInkA(0.65) }}>{timeDisplay} · {venueName}</p>
                        </div>
                      </div>
                    )}
                    {/* (앞) 봉투 앞주머니 LT2 — 편지 아래를 가려 봉투 속처럼 보이게 */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 3, backgroundImage: "url('/classic/lt-front.webp')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', opacity: ribbon ? 1 : 0, transform: ribbon ? 'scale(1)' : 'scale(1.02)', transformOrigin: '50% 42%', transition: 'opacity .6s ease .4s, transform .8s cubic-bezier(.22,.61,.36,1) .4s', pointerEvents: 'none' }} />
                    {/* (맨앞) 닫힌 봉투 커버 LETTER + 인장 — 열면 페이드 */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 4, opacity: ribbon ? 0 : 1, transform: ribbon ? 'translateY(14px) scale(.83)' : 'scale(.84)', transformOrigin: '50% 60%', transition: 'opacity .5s ease .3s, transform .75s cubic-bezier(.4,.1,.2,1) .3s', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/classic/letter.webp')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'drop-shadow(0 22px 34px rgba(53,23,20,.3))' }} />
                      <div style={{ position: 'absolute', left: '50%', top: '60%', width: 74, height: 74, marginLeft: -37, marginTop: -37, filter: 'drop-shadow(0 8px 13px rgba(53,23,20,.45))', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'cl-stamp .65s cubic-bezier(.3,.1,.25,1) 1.25s both' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/classic/shilling.webp')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
                        {sealColor && <div style={{ position: 'absolute', inset: 0, backgroundColor: sealColor, mixBlendMode: 'multiply', WebkitMaskImage: "url('/classic/shilling.webp')", maskImage: "url('/classic/shilling.webp')", WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F_DISPLAY, fontSize: 12, letterSpacing: '.12em', paddingLeft: '.12em', color: sealMono }}>{groomEn.charAt(0)}&nbsp;{brideEn.charAt(0)}</div>
                      </div>
                    </div>
                  </div>
                  <p style={{ position: 'absolute', bottom: 22, left: 0, right: 0, margin: 0, textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(14), lineHeight: 1.7, color: 'rgba(250,247,242,.9)', textShadow: '0 1px 6px rgba(20,10,8,.5)', opacity: ribbon ? 0 : 1, transition: 'opacity .5s ease', animation: 'cl-fade-soft .9s ease 1.8s backwards' }}>편지가 도착했어요.<br />클릭하여 편지를 열어주세요.</p>
                </div>
              )}

              {/* 접힌 편지 */}
              {openingStyle === '접힌 편지' && (
                <div onClick={() => { if (fold === 0) { setFold(1); window.setTimeout(() => setFold(2), 1100) } }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', cursor: fold === 0 ? 'pointer' : 'default' }}>
                  <div style={{ width: 270, background: PAPER, boxShadow: '0 26px 44px -32px rgba(53,23,20,.6)', animation: 'cl-paper-drop 1.15s cubic-bezier(.22,.61,.36,1) .15s both' }}>
                    <div style={{ padding: '34px 26px', textAlign: 'center', borderBottom: `1px solid ${openInkA(0.1)}` }}>
                      <p style={{ ...label(9, 0.44, openInkA(0.5)), animation: 'cl-ink-in .9s ease .7s both' }}>{nameCase('INVITATION')}</p>
                      <h1 style={{ margin: '18px 0 0', fontFamily: nameFont, fontSize: 30, lineHeight: 1.16, color: openInk, animation: 'cl-ink-in 1.3s ease .88s both' }}>{nameGroom}<br />{nameBride}</h1>
                    </div>
                    <div style={{ display: 'grid', gridTemplateRows: fold >= 1 ? '1fr' : '0fr', transition: 'grid-template-rows 1s cubic-bezier(.4,.1,.2,1)' }}>
                      <div style={{ overflow: 'hidden', minHeight: 0 }}>
                      <div style={{ padding: '30px 26px 32px', textAlign: 'center', borderBottom: `1px solid ${openInkA(0.1)}`, transform: fold >= 1 ? 'translateY(0)' : 'translateY(26px)', opacity: fold >= 1 ? 1 : 0, transition: 'transform .8s cubic-bezier(.22,.61,.36,1) .2s, opacity .6s ease .2s' }}>
                        <p style={label(9, 0.44, openInkA(0.45))}>{nameCase(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dow])}</p>
                        <p style={{ margin: '14px 0 0', fontFamily: F_BODY, fontSize: bfs(17), letterSpacing: '.02em', color: openInk }}>{dateFullKo}</p>
                        <p style={{ margin: '12px 0 0', fontFamily: F_BODY, fontSize: bfs(12), color: openInkA(0.65) }}>{timeDisplay}</p>
                      </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateRows: fold >= 2 ? '1fr' : '0fr', transition: 'grid-template-rows 1s cubic-bezier(.4,.1,.2,1)' }}>
                      <div style={{ overflow: 'hidden', minHeight: 0 }}>
                      <div style={{ padding: '32px 26px 34px', textAlign: 'center', background: INK, transform: fold >= 2 ? 'translateY(0)' : 'translateY(26px)', opacity: fold >= 2 ? 1 : 0, transition: 'transform .8s cubic-bezier(.22,.61,.36,1) .2s, opacity .6s ease .2s' }}>
                        <p style={label(9, 0.44, ivoryA(0.6))}>{nameCase('LOCATION')}</p>
                        <p style={{ margin: '14px 0 0', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 24, color: IVORY }}>{venueName}</p>
                        <div style={{ width: 24, height: 1, background: ivoryA(0.3), margin: '18px auto' }} />
                        <p style={{ margin: 0, fontFamily: F_BODY, fontSize: bfs(12), lineHeight: 1.95, color: ivoryA(0.78), wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{venueFull}</p>
                      </div>
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: '18px 0 0', textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(13), color: 'rgba(250,247,242,.9)', textShadow: '0 1px 6px rgba(20,10,8,.5)', opacity: fold > 0 ? 0 : 1, transition: 'opacity .5s ease', animation: 'cl-fade-soft .8s ease 1s backwards' }}>{cc.classicInfoStartText || '예식정보 바로보기'} <span style={{ opacity: 0.7 }}>(클릭)</span></p>
                </div>
              )}

              {/* 사진 뒤집기 */}
              {openingStyle === '사진 뒤집기' && (
                <div onClick={() => setFlip((v) => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', perspective: '1200px', cursor: 'pointer', animation: 'cl-swing-in 1.35s cubic-bezier(.22,.61,.36,1) .15s both' }}>
                  <div style={{ position: 'relative', width: 250, height: 330, transformStyle: 'preserve-3d', transform: flip ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 1.2s cubic-bezier(.4,.1,.2,1)', boxShadow: '0 30px 44px -30px rgba(53,23,20,.7)' }}>
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: PAPER, padding: '11px 11px 74px', boxSizing: 'border-box' }}>
                      <div style={{ width: '100%', height: '100%', ...cropBg(cc.classicFlipPhoto, { background: DEEP_BEIGE }, { backgroundPosition: '50% 34%' }), filter: 'saturate(.7)' }} />
                      <p style={{ margin: '14px 0 0', textAlign: 'center', fontFamily: nameFont, fontSize: 20, letterSpacing: '.06em', color: openInk, animation: 'cl-ink-in 1.3s ease .75s both' }}>{nameGroom} &amp; {nameBride}</p>
                      <p style={{ margin: '8px 0 0', textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(11), color: openInkA(0.5), animation: 'cl-ink-in 1s ease 1.2s both' }}>{cc.classicInfoStartText || '예식정보 바로보기'} <span style={{ opacity: 0.7 }}>(클릭)</span></p>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: PAPER, backgroundImage: 'repeating-linear-gradient(135deg,rgba(53,23,20,.022) 0 1px,transparent 1px 7px)', boxSizing: 'border-box', padding: 14 }}>
                      <div style={{ position: 'relative', width: '100%', height: '100%', border: `1px solid ${openInkA(0.2)}`, boxSizing: 'border-box', padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
                        <p style={label(8, 0.4, openInkA(0.45))}>{nameCase('THE WEDDING OF')}</p>
                        <p style={{ margin: '6px 0 0', fontFamily: nameFont, fontSize: 15, letterSpacing: '.06em', color: openInk }}>{nameGroom} &amp; {nameBride}</p>
                        <p style={{ margin: '24px 0 0', fontFamily: F_BODY, fontSize: bfs(16), lineHeight: 1.5, letterSpacing: '.02em', color: openInk }}>{dateDotKo}</p>
                        <div style={{ height: 1, background: openInkA(0.16), margin: '20px 0 16px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingRight: 52 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                            <span style={{ flex: '0 0 34px', fontFamily: F_LABEL, fontSize: lfs(7.5), letterSpacing: '.28em', color: openInkA(0.42) }}>{nameCase('TIME')}</span>
                            <span style={{ fontFamily: F_BODY, fontSize: bfs(12), color: openInkA(0.75) }}>{timeDisplay}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                            <span style={{ flex: '0 0 34px', fontFamily: F_LABEL, fontSize: lfs(7.5), letterSpacing: '.28em', color: openInkA(0.42) }}>{nameCase('PLACE')}</span>
                            <span style={{ fontFamily: F_BODY, fontSize: bfs(12), lineHeight: 1.7, color: openInkA(0.75), wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{venueFull}</span>
                          </div>
                        </div>
                        <div style={{ position: 'absolute', right: 16, bottom: 16, width: 44, height: 44, borderRadius: '50%', border: `1px solid ${openInkA(0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 13, color: openInkA(0.5) }}>C&amp;E</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
          {introDone && (
          <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, pointerEvents: 'none', zIndex: 6, animation: 'cl-fade-soft 1.1s ease both' }}>
            <span style={{ fontFamily: F_BODY, fontSize: bfs(12), letterSpacing: '.18em', paddingLeft: '.18em', color: openingStyle === '프레임' ? frameInk : 'rgba(250,247,242,.9)', textShadow: openingStyle === '프레임' ? undefined : '0 1px 6px rgba(20,10,8,.5)' }}>터치 또는 스크롤</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={openingStyle === '프레임' ? frameInk : 'rgba(250,247,242,.9)'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'cl-nudge 1.6s ease-in-out infinite', filter: openingStyle === '프레임' ? undefined : 'drop-shadow(0 1px 4px rgba(20,10,8,.5))' }}><path d="M6 9l6 6 6-6" /></svg>
          </div>
          )}
        </section>
        )}

        {page === 'main' && (
        <div style={{ display: 'flex', flexDirection: 'column', animation: skipIntro ? undefined : 'cl-main-in .8s ease both' }}>
        {/* ===== II. Letter (인사말) ===== */}
        <section data-scene="letter" style={{ order: orderOf('letter'), position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '52px 22px', background: greetingHasBg ? DARK_PHOTO : secBg('letter'), overflow: 'hidden', ...hide('letter') }}>
          {greetingHasBg && <div data-letter-photo style={{ position: 'absolute', inset: 0, ...cropBg(cc.classicGreetingBgImage, { background: 'transparent' }), filter: 'saturate(.78)', willChange: 'transform,opacity' }} />}
          {greetingHasBg && <div data-letter-scrim style={{ position: 'absolute', inset: 0, background: `rgba(${hexToRgb(greetingOverlay, '36,22,16')},${greetingOverlayOp})` }} />}
          <div style={{ position: 'relative', width: '100%', maxWidth: 356 }}>
          {(() => { const INK = letterInk; const inkA = letterInkA; const letterInner = (
              <>
                <p style={label(T_EYEBROW, 0.44, inkA(0.5))}>{nameCase('INVITATION')}</p>
                <p style={{ margin: '22px 0 0', width: '100%', maxWidth: '100%', fontFamily: F_BODY, fontSize: bfs(13), lineHeight: 2.1, color: INK, whiteSpace: 'pre-line', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>{greeting}</p>
                {letterSign !== 'none' && (<>
                <div className="cl-reveal cl-line" data-delay="760" style={{ width: 1, height: 22, background: inkA(0.25), margin: '22px auto 18px' }} />
                <div className="cl-reveal cl-blur" data-delay="900" style={{ display: 'flex', flexDirection: 'column', gap: 7, fontFamily: F_BODY, fontSize: bfs(11), color: inkA(0.7) }}>
                  {letterSign === 'couple' ? (
                    <p style={{ margin: 0 }}><span style={{ color: INK }}>{groomKo}</span> &amp; <span style={{ color: INK }}>{brideKo}</span> 올림</p>
                  ) : letterSign === 'hosts' ? (
                    hostSide === 'groom' ? (
                      <p style={{ margin: 0 }}><span style={{ color: INK }}>{parentsJsx(groom.father, groom.mother)}</span> 올림</p>
                    ) : hostSide === 'bride' ? (
                      <p style={{ margin: 0 }}><span style={{ color: INK }}>{parentsJsx(bride.father, bride.mother)}</span> 올림</p>
                    ) : (
                      <>
                        {parentsJsx(groom.father, groom.mother) && <p style={{ margin: 0 }}>신랑측 혼주 <span style={{ color: INK }}>{parentsJsx(groom.father, groom.mother)}</span></p>}
                        {parentsJsx(bride.father, bride.mother) && <p style={{ margin: 0 }}>신부측 혼주 <span style={{ color: INK }}>{parentsJsx(bride.father, bride.mother)}</span></p>}
                        <p style={{ margin: '2px 0 0' }}>올림</p>
                      </>
                    )
                  ) : (
                    <>
                      <p style={{ margin: 0 }}>{parentsJsx(groom.father, groom.mother) ? <>{parentsJsx(groom.father, groom.mother)} 의 {groomTitle} </> : `${groomTitle} `}<span style={{ color: INK }}>{groomKo}</span></p>
                      <p style={{ margin: 0 }}>{parentsJsx(bride.father, bride.mother) ? <>{parentsJsx(bride.father, bride.mother)} 의 {brideTitle} </> : `${brideTitle} `}<span style={{ color: INK }}>{brideKo}</span></p>
                    </>
                  )}
                </div>
                </>)}
              </>
            )
            return letterNoFrame ? (
              <div className="cl-reveal cl-up" data-delay="200" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', minWidth: 0, padding: '30px 18px' }}>{letterInner}</div>
            ) : letterPaper ? (
              // 풀블리드 웨딩 사진 위에 실제 인쇄물 한 장을 얹은 듯한 아이보리 종이 카드 (이중 헤어라인, 각진 모서리)
              <div className="cl-reveal cl-up" data-delay="200" style={{ position: 'relative', background: PAPER, padding: '58px 34px 54px', boxShadow: '0 14px 40px -32px rgba(20,10,8,.28)', minWidth: 0 }}>
                <div style={{ position: 'absolute', inset: 9, border: `1px solid ${inkA(0.26)}`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 13, border: `1px solid ${inkA(0.12)}`, pointerEvents: 'none' }} />
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', minWidth: 0 }}>{letterInner}</div>
              </div>
            ) : (
              <div className="cl-reveal cl-zoom" data-delay="200" style={{ position: 'relative', aspectRatio: letterFrame.aspect, backgroundImage: `url('${letterFrame.img}')`, backgroundColor: 'transparent', backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', filter: 'drop-shadow(0 18px 30px rgba(53,23,20,.2))' }}>
                <div className="cl-reveal cl-up" data-delay="420" style={{ position: 'absolute', inset: letterFrame.inset, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', minWidth: 0 }}>{letterInner}</div>
              </div>
            )
          })()}
          </div>
        </section>

        {/* ===== III. Introduction (각자 / 함께 토글) ===== */}
        <section style={{ order: orderOf('intro'), position: 'relative', isolation: 'isolate', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30, padding: '82px 30px', overflow: 'hidden', ...cropBg(introSecBg, { background: IVORY }), ...hide('intro'), ...(introHasBg ? {} : tintBg('intro')) }}>
          {introHasBg && introSecOverlayOp > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(${hexToRgb(introSecOverlay, '28,16,13')},${introSecOverlayOp})`, pointerEvents: 'none', zIndex: -1 }} />}
          {introMode === 'nameOnly' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, textAlign: 'center' }}>
              {([
                { side: groom, ko: groomKo, title: groomTitle, label: 'GROOM' },
                { side: bride, ko: brideKo, title: brideTitle, label: 'BRIDE' },
              ] as const).map((p, i) => (
                <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {!(cc.classicIntroShowParents !== false && parentsJsx(p.side.father, p.side.mother)) && <p className="cl-reveal cl-up" data-delay={String(160 + i * 260)} style={label(T_ROLE, 0.42, introFgAf(0.45))}>{nameCase(p.label)}</p>}
                  {cc.classicIntroShowParents !== false && parentsJsx(p.side.father, p.side.mother) && (
                    <p className="cl-reveal cl-up" data-delay={String(160 + i * 260)} style={{ margin: 0, fontFamily: F_BODY, fontSize: bfs(12), color: introFgAf(0.6), whiteSpace: 'nowrap' }}>{parentsJsx(p.side.father, p.side.mother)} 의 {p.title}</p>
                  )}
                  <p className="cl-reveal cl-blur" data-delay={String(300 + i * 260)} style={{ margin: '6px 0 0', fontFamily: F_BODY, fontSize: bfs(22), letterSpacing: '.01em', color: introFgC }}>{p.ko}</p>
                  {i === 0 && <div className="cl-reveal cl-line" data-delay="440" style={{ width: 1, height: 26, background: introFgAf(0.22), margin: '30px auto 0' }} />}
                </div>
              ))}
            </div>
          ) : !introTogether ? (
            (() => { const INK = eachInk; const inkA = eachInkA; return (
            <>
              <div className="cl-reveal cl-l" data-delay="180" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, ...(eachBox ? { padding: '22px 22px', background: PAPER, border: `1px solid ${inkA(0.24)}`, boxShadow: `inset 0 0 0 3px ${PAPER}, inset 0 0 0 4px ${inkA(0.12)}` } : eachNoFrame ? { padding: '2px 4px' } : { aspectRatio: eachFrame.aspect, padding: eachFrame.pad, backgroundImage: `url(${eachFrame.img})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', filter: 'drop-shadow(0 14px 18px rgba(53,23,20,.12))' }) }}>
                <div style={{ flex: '0 0 84px', height: 106, borderRadius: 2, ...cropBg(cc.classicGroomPhoto, { background: DEEP_BEIGE }), filter: 'saturate(.85)' }} />
                <div className="cl-reveal cl-up" data-delay="380" style={{ flex: 1, minWidth: 0 }}>
                  {!(cc.classicIntroShowParents !== false && parentsJsx(groom.father, groom.mother)) && <p style={label(T_ROLE, 0.4, inkA(0.45))}>{nameCase('GROOM')}</p>}
                  <p style={{ margin: '3px 0 0', fontFamily: F_BODY, fontSize: bfs(18), letterSpacing: '.01em', color: INK }}>{groomKo}</p>
                  {cc.classicIntroShowParents !== false && parentsJsx(groom.father, groom.mother) && (
                    <p style={{ margin: '2px 0 0', fontFamily: F_BODY, fontSize: bfs(11), color: inkA(0.55), whiteSpace: 'nowrap' }}>{parentsJsx(groom.father, groom.mother)} 의 {groomTitle}</p>
                  )}
                  {groomIntro && <p style={{ margin: '14px 0 0', width: '100%', maxWidth: '100%', minWidth: 0, fontFamily: F_BODY, fontSize: bfs(12), fontWeight: 600, lineHeight: 1.6, color: INK, wordBreak: 'keep-all', overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}>{groomIntro}</p>}
                </div>
              </div>
              <div className="cl-reveal cl-r" data-delay="340" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, ...(eachBox ? { padding: '22px 22px', background: PAPER, border: `1px solid ${inkA(0.24)}`, boxShadow: `inset 0 0 0 3px ${PAPER}, inset 0 0 0 4px ${inkA(0.12)}` } : eachNoFrame ? { padding: '2px 4px' } : { aspectRatio: eachFrame.aspect, padding: eachFrame.pad, backgroundImage: `url(${eachFrame.img})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', filter: 'drop-shadow(0 14px 18px rgba(53,23,20,.12))' }) }}>
                <div className="cl-reveal cl-up" data-delay="520" style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                  {!(cc.classicIntroShowParents !== false && parentsJsx(bride.father, bride.mother)) && <p style={label(T_ROLE, 0.4, inkA(0.45))}>{nameCase('BRIDE')}</p>}
                  <p style={{ margin: '3px 0 0', fontFamily: F_BODY, fontSize: bfs(18), letterSpacing: '.01em', color: INK }}>{brideKo}</p>
                  {cc.classicIntroShowParents !== false && parentsJsx(bride.father, bride.mother) && (
                    <p style={{ margin: '2px 0 0', fontFamily: F_BODY, fontSize: bfs(11), color: inkA(0.55), whiteSpace: 'nowrap' }}>{parentsJsx(bride.father, bride.mother)} 의 {brideTitle}</p>
                  )}
                  {brideIntro && <p style={{ margin: '14px 0 0', width: '100%', maxWidth: '100%', minWidth: 0, fontFamily: F_BODY, fontSize: bfs(12), fontWeight: 600, lineHeight: 1.6, color: INK, wordBreak: 'keep-all', overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}>{brideIntro}</p>}
                </div>
                <div style={{ flex: '0 0 84px', height: 106, borderRadius: 2, ...cropBg(cc.classicBridePhoto, { background: DEEP_BEIGE }), filter: 'saturate(.85)' }} />
              </div>
            </>
            ) })()
          ) : (
            (() => { const introFgC = togetherInk; const introFgAf = togetherInkA; return (
            <>
              <div className="cl-reveal cl-zoom" data-delay="160" style={{ position: 'relative', margin: '0 auto', ...(togetherNoFrame ? { width: '62%', maxWidth: 230, aspectRatio: '1 / 1' } : { width: togetherFrame.w, maxWidth: togetherFrame.maxW, aspectRatio: togetherFrame.aspect }) }}>
                <div style={{ position: 'absolute', left: togetherNoFrame ? '50%' : togetherFrame.photoLeft, top: togetherNoFrame ? '50%' : togetherFrame.photoTop, transform: 'translate(-50%,-50%)', ...(togetherNoFrame ? { width: '100%', height: '100%' } : { width: togetherFrame.photoW, height: togetherFrame.photoH }), borderRadius: '50%', overflow: 'hidden', ...cropBg(cc.classicTogetherPhoto, { background: DEEP_BEIGE }), filter: 'saturate(.82)' }} />
                {!togetherNoFrame && <img src={togetherFrame.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: cc.classicIntroTogetherFrame === 'filigree' ? 0.82 : 1 }} />}
                {cc.classicIntroTogetherFrame === 'oval' && togetherFrameColor && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: togetherFrameColor, mixBlendMode: 'multiply', WebkitMaskImage: `url(${togetherFrame.img})`, maskImage: `url(${togetherFrame.img})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', pointerEvents: 'none' }} />
                )}
              </div>
              <div className="cl-reveal cl-up" data-delay="260" style={{ textAlign: 'center', marginTop: cc.classicIntroTogetherFrame === 'oval' ? -6 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    {!(cc.classicIntroShowParents !== false && parentsJsx(groom.father, groom.mother)) && <p style={label(T_ROLE, 0.4, introFgAf(0.45))}>{nameCase('GROOM')}</p>}
                    <p style={{ margin: 0, fontFamily: F_BODY, fontSize: bfs(18), letterSpacing: '.01em', color: introFgC }}>{groomKo}</p>
                    {cc.classicIntroShowParents !== false && parentsJsx(groom.father, groom.mother) && (
                      <p style={{ margin: '4px 0 0', fontFamily: F_BODY, fontSize: bfs(11), color: introFgAf(0.68), whiteSpace: 'nowrap' }}>{parentsJsx(groom.father, groom.mother)} 의 {groomTitle}</p>
                    )}
                  </div>
                  <span style={{ width: 1, height: 34, background: introFgAf(0.2) }} />
                  <div style={{ textAlign: 'left' }}>
                    {!(cc.classicIntroShowParents !== false && parentsJsx(bride.father, bride.mother)) && <p style={label(T_ROLE, 0.4, introFgAf(0.45))}>{nameCase('BRIDE')}</p>}
                    <p style={{ margin: 0, fontFamily: F_BODY, fontSize: bfs(18), letterSpacing: '.01em', color: introFgC }}>{brideKo}</p>
                    {cc.classicIntroShowParents !== false && parentsJsx(bride.father, bride.mother) && (
                      <p style={{ margin: '4px 0 0', fontFamily: F_BODY, fontSize: bfs(11), color: introFgAf(0.68), whiteSpace: 'nowrap' }}>{parentsJsx(bride.father, bride.mother)} 의 {brideTitle}</p>
                    )}
                  </div>
                </div>
                <p style={{ margin: '18px 0 0', padding: '0 12px', textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(12), lineHeight: 2, color: introFgAf(0.7), wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{coupleTogetherText}</p>
              </div>
            </>
            ) })()
          )}
        </section>

        {/* ===== 간지 (동적: 사진2 / 사진1 / 사진+문구) ===== */}
        <div style={{ order: orderOf('interstitials'), display: 'flex', flexDirection: 'column', ...hide('interstitials'), ...tintBg('interstitials') }}>
          {interstitials.map((it, i) => renderInterstitial(it, i))}
        </div>

        {/* ===== VI. Gallery ===== */}
        <section style={{ order: orderOf('gallery'), padding: '82px 0', background: IVORY, ...hide('gallery'), ...tintBg('gallery') }}>
          {galType === 'default' && (() => { const inkA = (a: number) => fgA('gallery', a); return (<>
          <p className="cl-reveal cl-up" style={{ ...label(T_EYEBROW, 0.44, inkA(0.45)), margin: '0 30px 32px' }}>{nameCase('GALLERY')}</p>
          {galParallaxPhoto(0, { margin: '0 30px', aspectRatio: '3/4' }, { backgroundPosition: '50% 36%' })}
          <p className="cl-reveal cl-blur" data-delay="140" style={{ margin: '20px 30px 0', textAlign: 'right', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 16, color: inkA(0.6) }}>{galCaption}</p>
          {galParallaxPhoto(1, { margin: '46px 30px 0', aspectRatio: '4/3' }, { backgroundPosition: '26% 46%' }, 200)}
          <div style={{ position: 'relative', height: 310, margin: '54px 30px 0' }}>
            {galParallaxPhoto(2, { position: 'absolute', left: 0, top: 0, width: '58%', aspectRatio: '3/4' }, { backgroundPosition: '60% 30%' }, 120)}
            {galParallaxPhoto(3, { position: 'absolute', right: 0, bottom: 0, width: '52%', aspectRatio: '1/1', border: `7px solid ${secBg('gallery')}` }, { backgroundPosition: '40% 60%' }, 420)}
          </div>
          {galParallaxPhoto(4, { margin: '58px 30px 0', aspectRatio: '16/11' }, { backgroundPosition: '50% 44%' }, 200)}
          <div style={{ padding: '0 30px' }}>{galleryMore(5, 'ink')}</div>
          </>) })()}

          {/* 1A — 앨범 스프레드 */}
          {galType === 'album' && (
            <div style={{ margin: '-82px 0 -82px', padding: '76px 26px 74px', background: PAPER }}>
              <p className="cl-reveal cl-up" style={{ ...label(T_EYEBROW, 0.4, fgA('gallery', 0.5)), margin: '0 0 28px' }}>{nameCase('GALLERY')}</p>
              <div className="cl-reveal cl-place" style={{ background: '#FFFFFF', padding: '12px 12px 46px', boxShadow: '0 16px 26px -22px rgba(53,23,20,.6)' }}>
                {galParallaxPhoto(0, { aspectRatio: '4/5' }, undefined, undefined, '', '')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '20px 0 0' }}>
                <div className="cl-reveal cl-place" data-delay="120" style={{ background: '#FFFFFF', padding: '8px 8px 26px', boxShadow: '0 16px 26px -22px rgba(53,23,20,.6)' }}>
                  {galParallaxPhoto(1, { aspectRatio: '1/1' }, undefined, undefined, '', '')}
                </div>
                <div className="cl-reveal cl-place" data-delay="220" style={{ marginTop: 26, background: '#FFFFFF', padding: '8px 8px 26px', boxShadow: '0 16px 26px -22px rgba(53,23,20,.6)' }}>
                  {galParallaxPhoto(2, { aspectRatio: '1/1' }, undefined, undefined, '', '')}
                </div>
              </div>
              <p className="cl-reveal cl-blur" style={{ margin: '32px 0 0', textAlign: 'center', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 16, color: fgA('gallery', 0.6) }}>{galCaption}</p>
              <div className="cl-reveal cl-place" style={{ margin: '32px 0 0', background: '#FFFFFF', padding: '10px 10px 38px', boxShadow: '0 20px 32px -26px rgba(53,23,20,.6)' }}>
                {galParallaxPhoto(3, { aspectRatio: '3/2' }, undefined, undefined, '', '')}
              </div>
              {galleryMore(4, 'ink')}
            </div>
          )}

          {/* 1B — 풀블리드 시퀀스 */}
          {galType === 'fullbleed' && (
            <div style={{ margin: '-82px 0 -82px', padding: '76px 0 74px', background: INK }}>
              <div className="cl-reveal cl-clip" onClick={() => openLightbox(0)} style={{ position: 'relative', height: 420, cursor: 'pointer', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, ...cropBg(galItem(0), bgPhoto(0)) }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(36,17,16,.4),transparent 42%,rgba(36,17,16,.5))', pointerEvents: 'none' }} />
                <p style={{ ...label(T_EYEBROW, 0.4, ivoryA(0.7)), position: 'absolute', left: 24, top: 24, margin: 0 }}>{nameCase('GALLERY')}</p>
                <p style={{ position: 'absolute', left: 24, right: 24, bottom: 20, margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 16, color: ivoryA(0.85) }}>{galCaption}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginTop: 2 }}>
                <div className="cl-reveal cl-clip-l" onClick={() => openLightbox(1)} style={{ aspectRatio: '3/4', cursor: 'pointer', ...cropBg(galItem(1), bgPhoto(1)) }} />
                <div className="cl-reveal cl-clip-r" data-delay="120" onClick={() => openLightbox(2)} style={{ aspectRatio: '3/4', cursor: 'pointer', filter: 'grayscale(.4)', ...cropBg(galItem(2), bgPhoto(2)) }} />
              </div>
              <div className="cl-reveal cl-clip-up" onClick={() => openLightbox(3)} style={{ height: 300, marginTop: 2, cursor: 'pointer', ...cropBg(galItem(3), bgPhoto(3)) }} />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, marginTop: 2 }}>
                <div className="cl-reveal cl-clip-l" onClick={() => openLightbox(4)} style={{ aspectRatio: '1/1', cursor: 'pointer', ...cropBg(galItem(4), bgPhoto(4)) }} />
                <div style={{ background: INK, display: 'flex', alignItems: 'flex-end' }}>
                  <p style={{ margin: 0, padding: '0 0 16px 14px', writingMode: 'vertical-rl', fontFamily: F_LABEL, fontSize: lfs(13), letterSpacing: '.2em', color: ivoryA(0.75) }}>{nameGroom} &amp; {nameBride}</p>
                </div>
              </div>
              <div style={{ padding: '0 24px' }}>{galleryMore(5, 'ivory')}</div>
            </div>
          )}

          {/* 1C — 스와이프 카드 */}
          {galType === 'swipe' && (
            <div style={{ margin: '-82px 0 -82px', padding: '76px 26px 74px', background: IVORY }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p className="cl-reveal cl-up" style={{ ...label(T_EYEBROW, 0.4, fgA('gallery', 0.5)), margin: 0 }}>{nameCase('GALLERY')}</p>
                <p style={{ margin: 0, fontFamily: F_LABEL, fontSize: lfs(11), letterSpacing: '.06em', color: fgA('gallery', 0.5) }}>{galSwipeIdx + 1} / {galCount}</p>
              </div>
              <div style={{ margin: '26px 0 0', aspectRatio: '3/4', position: 'relative', overflow: 'hidden', background: DEEP_BEIGE }}>
                <div key={galSwipeIdx} onClick={() => openLightbox(galSwipeIdx)} style={{ position: 'absolute', inset: 0, cursor: 'pointer', ...cropBg(galItem(galSwipeIdx), { background: DEEP_BEIGE }), animation: 'cl-swipe-fade .7s cubic-bezier(.22,.61,.36,1) both' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, margin: '18px 0 0' }}>
                <button type="button" onClick={() => setGalSwipeIdx((i) => (i + galCount - 1) % galCount)} style={{ flex: 1, padding: '11px 0', border: `1px solid ${fgA('gallery', 0.35)}`, background: 'transparent', fontFamily: F_LABEL, fontSize: lfs(10), letterSpacing: '.3em', color: fgC('gallery'), cursor: 'pointer' }}>{nameCase('PREV')}</button>
                <button type="button" onClick={() => setGalSwipeIdx((i) => (i + 1) % galCount)} style={{ flex: 1, padding: '11px 0', border: 'none', background: INK, fontFamily: F_LABEL, fontSize: lfs(10), letterSpacing: '.3em', color: IVORY, cursor: 'pointer' }}>{nameCase('NEXT')}</button>
              </div>
              {gallery.length > 0 && (
                <div style={{ display: 'flex', gap: 8, margin: '18px 0 0', overflowX: 'auto' }}>
                  {gallery.map((_, i) => (
                    <div key={i} onClick={() => setGalSwipeIdx(i)} style={{ flex: '0 0 54px', aspectRatio: '1/1', cursor: 'pointer', opacity: i === galSwipeIdx ? 1 : 0.45, ...cropBg(galItem(i), { background: DEEP_BEIGE }) }} />
                  ))}
                </div>
              )}
              <p className="cl-reveal cl-blur" style={{ margin: '24px 0 0', textAlign: 'center', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 16, color: fgA('gallery', 0.6) }}>{galCaption}</p>
            </div>
          )}

          {/* 1D — 필름 스트립 (무한 마퀴: 상행 좌 / 하행 우, 반대방향 연속) */}
          {galType === 'film' && (
            <div style={{ margin: '-82px 0 -82px', padding: '76px 0 74px', background: IVORY }}>
              <p className="cl-reveal cl-up" style={{ ...label(T_EYEBROW, 0.4, fgA('gallery', 0.5)), margin: '0 26px 24px' }}>{nameCase('GALLERY')}</p>
              <div className="cl-film-row cl-reveal cl-clip-l">
                <div className="cl-film-track cl-film-track--l">
                  {[0, 1, 2, 3, 0, 1, 2, 3].map((i, k) => (
                    <div key={k} onClick={() => openLightbox(i)} style={{ width: 170, aspectRatio: '3/4', cursor: 'pointer', ...cropBg(galItem(i), { background: DEEP_BEIGE }) }} />
                  ))}
                </div>
              </div>
              <div style={{ height: 1, margin: '10px 0', background: fgA('gallery', 0.14) }} />
              <div className="cl-film-row cl-reveal cl-clip-r" data-delay="160">
                <div className="cl-film-track cl-film-track--r">
                  {[3, 4, 5, 6, 3, 4, 5, 6].map((i, k) => (
                    <div key={k} onClick={() => openLightbox(i)} style={{ width: 132, aspectRatio: '1/1', cursor: 'pointer', ...cropBg(galItem(i), { background: DEEP_BEIGE }) }} />
                  ))}
                </div>
              </div>
              <p className="cl-reveal cl-blur" style={{ margin: '24px 26px 0', textAlign: 'right', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 16, color: fgA('gallery', 0.6) }}>{galCaption}</p>
            </div>
          )}
        </section>

        {/* ===== VIII. Date ===== */}
        {dateStyle !== 'classic' ? renderDateVariant() : (
        <section style={{ order: orderOf('date'), position: 'relative', minHeight: '85vh', padding: '74px 30px 66px', background: IVORY, overflow: 'hidden', ...hide('date'), ...tintBg('date') }}>
          {(() => { const IVORY = dInk; const ivoryA = dInkA; return (<>
          <div className="cl-reveal cl-line" data-delay="100" style={{ position: 'absolute', left: 30, top: 0, bottom: 0, width: 1, background: ivoryA(0.14) }} />
          <p className="cl-reveal cl-rise" data-delay="180" style={{ margin: '0 0 12px', position: 'relative', fontFamily: F_BODY, fontStyle: 'italic', fontSize: 13, letterSpacing: '.03em', color: ivoryA(0.75) }}>{cc.classicDateHeading || '저희가 하나 되는 날'}</p>
          <h2 className="cl-reveal cl-rise" data-delay="320" style={{ margin: 0, position: 'relative', fontFamily: F_DISPLAY, fontSize: 70, lineHeight: 1, letterSpacing: '.01em', color: IVORY }}>{mm}<span style={{ fontFamily: F_BODY, fontSize: bfs(28), letterSpacing: 0 }}>월</span> {dd}<span style={{ fontFamily: F_BODY, fontSize: bfs(28), letterSpacing: 0 }}>일</span></h2>
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 14, margin: '20px 160px 0 0' }}>
            <span className="cl-reveal cl-linex" data-delay="560" style={{ flex: 1, height: 1, background: ivoryA(0.28) }} />
            <span className="cl-reveal cl-rise" data-delay="660" style={{ fontFamily: F_BODY, fontSize: bfs(18), letterSpacing: '.1em', color: ivoryA(0.72), paddingLeft: '.1em', whiteSpace: 'nowrap' }}>{year}년</span>
          </div>
          {cc.classicDatePhotoEnabled !== false && dateFrame === 'stamp' && (
            <div className="cl-reveal cl-poof" data-delay="1600" style={{ position: 'absolute', right: 8, top: 220, width: 150, aspectRatio: '1900 / 2275', zIndex: 2, filter: 'drop-shadow(0 9px 13px rgba(53,23,20,.2))' }}>
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '86%', height: '87%', ...cropBg(cc.classicDatePhoto, { background: DEEP_BEIGE }), filter: 'saturate(.85) contrast(1.02)' }} />
              <img src="/classic/frame-datestamp.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
            </div>
          )}
          {cc.classicDatePhotoEnabled !== false && dateFrame === 'heart' && (
            <div className="cl-reveal cl-poof" data-delay="1600" style={{ position: 'absolute', right: 8, top: 220, width: 184, aspectRatio: '424 / 376', zIndex: 2, filter: 'drop-shadow(0 9px 13px rgba(53,23,20,.2))' }}>
              <div style={{ position: 'absolute', inset: 0, ...cropBg(cc.classicDatePhoto, { background: DEEP_BEIGE }), filter: 'saturate(.85) contrast(1.02)', WebkitMaskImage: "url('/classic/heart-mask.png')", maskImage: "url('/classic/heart-mask.png')", WebkitMaskSize: '103% 103%', maskSize: '103% 103%', WebkitMaskPosition: 'center', maskPosition: 'center', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' }} />
              <img src="/classic/frame-heart.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
            </div>
          )}
          {cc.classicDatePhotoEnabled === false && cc.classicDateBird !== false && (
            <img src="/classic/bird.webp" alt="" className="cl-reveal cl-poof" data-delay="1600" style={{ position: 'absolute', right: 14, top: 200, width: 116, pointerEvents: 'none', zIndex: 2, filter: 'drop-shadow(0 8px 12px rgba(53,23,20,.16))' }} />
          )}
          <div style={{ position: 'relative', margin: '210px 0 0', borderTop: `1px solid ${ivoryA(0.22)}`, borderBottom: `1px solid ${ivoryA(0.22)}`, padding: '16px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', fontFamily: F_BODY, fontSize: bfs(13), letterSpacing: '.06em', color: ivoryA(0.6), textAlign: 'center' }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <span key={i} className="cl-reveal cl-rise" data-delay={720 + i * 30}>{d}</span>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginTop: 14, rowGap: 6, fontFamily: F_LABEL, fontSize: lfs(17), color: ivoryA(0.8), textAlign: 'center', alignItems: 'center' }}>
              {(() => {
                const start = day - dow // Sunday of that week
                return Array.from({ length: 7 }, (_, i) => start + i).map((n, i) => (
                  <span key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                    {n === day
                      ? <span className="cl-reveal cl-boop" data-delay={1120} style={{ width: 36, height: 36, borderRadius: '50%', background: datePoint, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F_BODY }}>{n}</span>
                      : <span className="cl-reveal cl-rise" data-delay={900 + i * 30}>{n >= 1 ? n : ''}</span>}
                  </span>
                ))
              })()}
            </div>
          </div>
          <p className="cl-reveal cl-rise" data-delay="1200" style={{ position: 'relative', textAlign: 'center', margin: '26px 0 0', fontFamily: F_BODY, fontSize: bfs(12), letterSpacing: '.06em', color: ivoryA(0.85) }}>{timeDisplay} · {venueName}</p>
          {dday !== null && dday >= 0 && (
            <p className="cl-reveal cl-rise" data-delay="1280" style={{ position: 'relative', textAlign: 'center', margin: '16px 0 0', fontFamily: F_BODY, fontSize: bfs(13), letterSpacing: '.02em', color: IVORY, wordBreak: 'keep-all' }}>
              {dday === 0 ? '오늘은 결혼식 날입니다' : <>결혼식 <span style={{ fontFamily: F_DISPLAY, fontSize: 18, letterSpacing: '.04em' }}>{dday}</span>일 남았습니다</>}
            </p>
          )}
          </>) })()}
        </section>
        )}

        {/* ===== IX. Directions ===== */}
        <section style={{ order: orderOf('directions'), position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '82px 0', background: IVORY, overflow: 'hidden', ...hide('directions'), ...tintBg('directions') }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '44%', ...cropBg(cc.classicDirectionsBg, { background: 'transparent' }), filter: 'grayscale(.55) saturate(.5) brightness(.92)' }} />
          {dirOverlayOp > 0 && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '44%', background: `rgb(${hexToRgb(dirOverlay, '28,16,13')})`, opacity: dirOverlayOp, pointerEvents: 'none' }} />}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '44%', background: 'linear-gradient(180deg,rgba(242,238,230,.2),rgba(242,238,230,.9))' }} />
          <div className="cl-reveal cl-fade" style={{ position: 'relative', margin: '0 26px' }}>
            <div ref={mapWrapRef} style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#E3DCCD' }}>
              {mapError ? (
                <a href={`https://map.kakao.com/?q=${encodeURIComponent(venueAddress)}`} target="_blank" rel="noreferrer" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F_BODY, fontSize: bfs(12), color: inkA(0.6) }}>지도에서 위치 보기</a>
              ) : (
                <>
                  <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                  {!mapActive && (
                    <div onClick={handleOverlayTap} style={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'pointer', background: 'rgba(53,23,20,.04)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12 }}>
                      <span style={{ fontFamily: F_BODY, fontSize: bfs(11), color: IVORY, background: inkA(0.62), padding: '5px 12px', borderRadius: 20 }}>{mapState === 'hint' ? '한 번 더 누르면 이동할 수 있어요' : '지도를 눌러 이동/확대'}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ position: 'absolute', inset: 0, border: `1px solid ${inkA(0.16)}`, pointerEvents: 'none' }} />
          </div>
          <div className="cl-reveal cl-zoom" data-delay="120" style={{ position: 'relative', zIndex: 2, margin: '-34px 26px 0', background: '#FFFFFF', padding: '34px 28px 30px', boxShadow: '0 18px 30px -26px rgba(20,10,8,.5)' }}>
            <p style={{ margin: 0, textAlign: 'center', ...label(T_EYEBROW, 0.44, inkA(0.45)) }}>{nameCase('LOCATION')}</p>
            <h2 className="cl-reveal cl-up" data-delay="300" style={{ margin: '14px 0 0', textAlign: 'center', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: T_TITLE, color: INK }}>{venueName}</h2>
            {venueHall && <p className="cl-reveal cl-rise" data-delay="400" style={{ margin: '8px 0 0', textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(12), color: inkA(0.6) }}>{venueHall}</p>}
            <div className="cl-reveal cl-rise" data-delay="480" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '10px 0 0' }}>
              <p style={{ margin: 0, textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(12), color: inkA(0.7) }}>{venueAddress}</p>
              <button onClick={() => doCopy(venueAddress, 'addr')} style={{ flexShrink: 0, fontFamily: F_BODY, fontSize: bfs(10), cursor: 'pointer', background: 'transparent', border: `1px solid ${inkA(0.3)}`, color: inkA(0.7), borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap' }}>{copied === 'addr' ? '복사됨' : '주소 복사'}</button>
            </div>
            <div style={{ height: 1, background: inkA(0.14), margin: '24px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {dirDisplay.map((r, i) => (
                <div key={i} className="cl-reveal cl-rise" data-delay={200 + i * 90} style={{ display: 'flex', gap: 14 }}>
                  <span style={{ flex: '0 0 54px', fontFamily: F_BODY, fontSize: bfs(11), fontWeight: 600, color: inkA(0.55), paddingTop: 2 }}>{r.label}</span>
                  <p style={{ margin: 0, flex: 1, fontFamily: F_BODY, fontSize: bfs(12), lineHeight: 1.85, color: inkA(0.72), wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{r.text}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 7, margin: '26px 0 0' }}>
              <a href={`https://map.naver.com/p/search/${encodeURIComponent(venueAddress)}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(12), padding: '11px 0', background: '#03C75A', color: '#fff', borderRadius: 6, whiteSpace: 'nowrap' }}>네이버</a>
              <a href={`https://map.kakao.com/?q=${encodeURIComponent(venueAddress)}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(12), padding: '11px 0', background: '#FEE500', color: '#3C1E1E', borderRadius: 6, whiteSpace: 'nowrap' }}>카카오</a>
              <a href={`tmap://search?name=${encodeURIComponent(venueName)}`} style={{ flex: 1, textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(12), padding: '11px 0', background: INK, color: BTN_TEXT, borderRadius: 6, whiteSpace: 'nowrap' }}>티맵</a>
            </div>
          </div>
        </section>

        {/* ===== X. 결혼식 안내 (가이드) ===== */}
        {guideOn && guideList.length > 0 && !hiddenSet.has('guide') && (
        <section style={{ order: orderOf('guide'), position: 'relative', isolation: 'isolate', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18, padding: '84px 30px', ...cropBg(infoSecBg, { background: IVORY, backgroundImage: 'radial-gradient(circle at 50% 24%,rgba(255,253,248,.34),transparent 62%)' }), overflow: 'hidden', ...(infoHasBg ? {} : tintBg('guide')) }}>
          {infoSecOverlayOp > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(${hexToRgb(infoSecOverlay, '28,16,13')},${infoSecOverlayOp})`, pointerEvents: 'none', zIndex: -1 }} />}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(135deg,rgba(53,23,20,.05) 0 1px,transparent 1px 9px)' }} />
          <div className="cl-reveal cl-up" style={{ position: 'relative', textAlign: 'center', marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: T_TITLE, letterSpacing: '.02em', color: infoFgC }}>{nameCase('Information')}</h2>
            <p style={{ margin: '10px 0 0', fontFamily: F_BODY, fontSize: bfs(12), letterSpacing: '.02em', color: infoFgAf(0.6) }}>결혼식 안내</p>
          </div>
          {guideList.map((g, i) => (
            <div key={i} className="cl-reveal cl-up" data-delay={i * 130} style={{ position: 'relative', background: '#FFFFFF', padding: extractUrl(g.photo) ? '14px 14px 26px' : '26px 24px', boxShadow: '0 18px 30px -26px rgba(20,10,8,.5)' }}>
              {extractUrl(g.photo) && <div style={{ aspectRatio: '4/3', margin: '0 0 20px', ...cropBg(g.photo, { background: DEEP_BEIGE }), filter: 'saturate(.75)' }} />}
              <p style={{ margin: 0, textAlign: 'center', fontFamily: F_LABEL, fontStyle: 'italic', fontSize: T_SUBTITLE, color: INK }}>{g.title}</p>
              <div style={{ width: 22, height: 1, background: inkA(0.25), margin: '13px auto' }} />
              <p style={{ margin: 0, textAlign: 'center', fontFamily: F_BODY, fontSize: bfs(13), lineHeight: 2, color: inkA(0.72), wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{g.body}</p>
            </div>
          ))}
        </section>
        )}

        {/* ===== XI. Accounts ===== */}
        {acctSides.length > 0 && !hiddenSet.has('accounts') && (
        <section style={{ order: orderOf('accounts'), position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: '84px 30px', background: IVORY, backgroundImage: 'repeating-linear-gradient(135deg,rgba(53,23,20,.035) 0 1px,transparent 1px 9px)', ...tintBg('accounts') }}>
          <div className="cl-reveal cl-up" style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: T_TITLE, color: fgC('accounts') }}>{nameCase('With Your Heart')}</h2>
            <p style={{ margin: '12px 0 0', fontFamily: F_BODY, fontSize: bfs(12), lineHeight: 1.9, color: fgA('accounts', 0.65), wordBreak: 'keep-all' }}>참석이 어려우신 분들을 위해<br />마음 전하실 곳을 안내드립니다.</p>
          </div>
          {acctSides.map((grp, gi) => (
            <div key={gi} className="cl-reveal cl-up" data-delay={gi * 150} style={{ background: '#FFFFFF', padding: '24px 22px', boxShadow: '0 18px 30px -26px rgba(20,10,8,.5)' }}>
              <p style={label(T_ROLE, 0.4, inkA(0.45))}>{grp.side}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '16px 0 0' }}>
                {grp.accts.map((a, ai) => (
                  <div key={ai}>
                    {ai > 0 && <div style={{ height: 1, background: inkA(0.12), marginBottom: 14 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontFamily: F_BODY, fontSize: bfs(12), color: INK }}>{a.line}</p>
                        <p style={{ margin: '5px 0 0', fontFamily: F_BODY, fontSize: bfs(11), color: inkA(0.55) }}>{a.who}</p>
                      </div>
                      <button onClick={() => doCopy(a.copy, `acc-${gi}-${ai}`)} style={{ fontFamily: F_BODY, fontSize: bfs(11), padding: '8px 13px', cursor: 'pointer', background: 'transparent', border: `1px solid ${inkA(0.3)}`, color: inkA(0.75), borderRadius: 4, whiteSpace: 'nowrap' }}>{copied === `acc-${gi}-${ai}` ? '복사됨' : '복사'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        )}

        {/* ===== XII. Links ===== */}
        <section style={{ order: orderOf('links'), position: 'relative', isolation: 'isolate', minHeight: '96vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26, padding: '88px 34px', overflow: 'hidden', ...cropBg(thanksSecBg, { background: IVORY }), ...hide('links'), ...(thanksHasBg ? {} : tintBg('links')) }}>
          {thanksHasBg && thanksSecOverlayOp > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(${hexToRgb(thanksSecOverlay, '28,16,13')},${thanksSecOverlayOp})`, pointerEvents: 'none', zIndex: -1 }} />}
          {(() => { const INK = thanksFgC; const inkA = (a: number) => thanksFgAf(a)
          const thanksBody = (col: string, colA: (a: number) => string) => (
            <>
              <p style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: T_TITLE, color: col }}>{nameCase('Thank You')}</p>
              <TypeText
                text={cc.classicThankYou || '귀한 걸음으로 축복해 주시는\n모든 분께 진심으로 감사드립니다.'}
                caretColor={colA(0.5)}
                speed={125}
                style={{ margin: '16px 0 0', fontFamily: F_BODY, fontSize: bfs(13), lineHeight: 2, color: colA(0.82), whiteSpace: 'pre-line', wordBreak: 'keep-all' }}
              />
            </>
          )
          return (<>
          {thanksFrame === 'doily' ? (
            <div className="cl-reveal cl-fade" style={{ position: 'relative', backgroundImage: "url('/classic/thanks-frame.webp')", backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', aspectRatio: '894 / 711', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16% 14%', boxSizing: 'border-box' }}>
              <div style={{ textAlign: 'center' }}>{thanksBody(fgC('links'), (a) => fgA('links', a))}</div>
            </div>
          ) : (
            <div className="cl-reveal cl-blur" style={{ position: 'relative', textAlign: 'center' }}>{thanksBody(INK, inkA)}</div>
          )}
          <div className="cl-reveal cl-up" data-delay="200" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={doShare} style={{ fontFamily: F_BODY, fontSize: bfs(13), letterSpacing: '.02em', padding: '15px 0', cursor: 'pointer', background: '#FEE500', border: '1px solid #FEE500', color: '#3C1E1E', whiteSpace: 'nowrap' }}>카카오톡 공유</button>
            <button onClick={() => doCopy(shareUrl, 'link')} style={{ fontFamily: F_BODY, fontSize: bfs(13), letterSpacing: '.02em', padding: '15px 0', cursor: 'pointer', background: 'transparent', border: `1px solid ${inkA(0.35)}`, color: INK, whiteSpace: 'nowrap' }}>{copied === 'link' ? '링크 복사됨' : '링크 복사'}</button>
          </div>
          </>) })()}
        </section>

        {/* ===== XIII. RSVP (봉투 → 참석 클릭 시 상세 폼) ===== */}
        <section style={{ order: orderOf('rsvp'), position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 30, padding: '84px 30px', background: IVORY, ...hide('rsvp'), ...tintBg('rsvp') }}>
          <div className="cl-reveal cl-up" style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: T_TITLE, color: rInk }}>R.S.V.P</h2>
            <p style={{ margin: '12px 0 0', fontFamily: F_BODY, fontSize: bfs(12), lineHeight: 1.9, color: rInkA(0.62), whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{cc.classicRsvpNotice || '참석 여부를 알려주시면\n정성껏 준비하겠습니다.'}</p>
          </div>

          {rsvpAttend === 'attending' ? (
            <div style={{ position: 'relative', width: '100%', maxWidth: 340, animation: 'cl-fade-soft .4s ease both' }}>
              <ClassicRsvpForm
                invitationId={invitation?.id ? String(invitation.id) : undefined}
                isPreview={isPreview}
                initialAttend="attending"
                hideNotice
                meal={cc.classicRsvpMeal}
                shuttle={cc.classicRsvpShuttle}
                phone={cc.classicRsvpPhone}
                sideDetail={cc.classicRsvpSideDetail}
                sideDetailOptions={cc.classicRsvpSideDetailOptions}
                messagePlaceholder={cc.classicRsvpMessagePlaceholder}
                onClose={() => setRsvpAttend(null)}
                tokens={{ INK, IVORY: BTN_TEXT, PAPER: '#FFFFFF', inkA, F_BODY, F_LABEL }}
              />
              <button onClick={() => setRsvpAttend(null)} style={{ display: 'block', margin: '16px auto 0', fontFamily: F_LABEL, fontSize: lfs(9), letterSpacing: '.4em', paddingLeft: '.4em', color: rInkA(0.6), background: 'transparent', border: 'none', cursor: 'pointer' }}>← 다시 선택</button>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', maxWidth: 300, minHeight: 310 }}>
              <div className="cl-reveal cl-up" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 208, backgroundImage: "url('/classic/letter.webp')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom center', filter: 'drop-shadow(0 26px 38px rgba(0,0,0,.55))', zIndex: 1 }} />
              {rsvpAttend !== 'not_attending' && (
                <div className="cl-reveal cl-env" data-delay="360" style={{ position: 'relative', zIndex: 2, margin: '0 8px 96px', background: '#FFFFFF', padding: '28px 22px 26px', textAlign: 'center', boxShadow: '0 18px 30px -26px rgba(20,10,8,.5)' }}>
                  <p style={{ ...label(T_EYEBROW, 0.46, inkA(0.5)) }}>{nameCase('INVITATION')}</p>
                  <p style={{ margin: '14px 0 0', fontFamily: F_BODY, fontSize: bfs(20), letterSpacing: '.06em', color: INK }}>초대합니다</p>
                  <div style={{ display: 'flex', gap: 8, margin: '22px 0 0' }}>
                    <button onClick={() => setRsvpAttend('attending')} style={{ flex: 1, fontFamily: F_BODY, fontSize: bfs(12), color: BTN_TEXT, background: INK, border: `1px solid ${INK}`, padding: '11px 0', cursor: 'pointer', whiteSpace: 'nowrap' }}>참석합니다</button>
                    <button onClick={() => setRsvpAttend('not_attending')} style={{ flex: 1, fontFamily: F_BODY, fontSize: bfs(12), color: INK, background: 'transparent', border: `1px solid ${inkA(0.35)}`, padding: '11px 0', cursor: 'pointer', whiteSpace: 'nowrap' }}>참석 어렵습니다</button>
                  </div>
                </div>
              )}
              {rsvpAttend === 'not_attending' && (
                <p style={{ position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center', margin: 0, fontFamily: F_BODY, fontSize: bfs(12), lineHeight: 1.9, color: rInkA(0.7) }}>마음 전해주셔서 감사합니다.<br /><button onClick={() => setRsvpAttend(null)} style={{ marginTop: 8, fontFamily: F_LABEL, fontSize: lfs(9), letterSpacing: '.3em', paddingLeft: '.3em', color: rInkA(0.55), background: 'transparent', border: 'none', cursor: 'pointer' }}>다시 선택</button></p>
              )}
            </div>
          )}
        </section>

        {/* ===== 푸터 ===== */}
        <footer style={{ order: 999, background: IVORY, textAlign: 'center', padding: '44px 30px 52px' }}>
          <p style={{ margin: 0, fontFamily: F_LABEL, fontStyle: 'italic', fontSize: 14, letterSpacing: '.03em', color: inkA(0.55), animation: 'cl-fade-soft 1.2s ease both' }}>Thank you for celebrating with us</p>
          <p style={{ margin: '12px 0 0', fontFamily: F_BODY, fontSize: bfs(9.5), letterSpacing: '.16em', paddingLeft: '.16em', color: inkA(0.32), animation: 'cl-fade-soft 1.2s ease .22s both' }}>Made with dear drawer</p>
        </footer>

        </div>
        )}

        {/* 갤러리 라이트박스 */}
        <ClassicLightbox images={gallery} index={lbIndex} open={lbOpen} variant={lbVariant} onClose={() => setLbOpen(false)} />
      </div>
      {showDdayPopup && ddayPopup?.enabled && (
        <DdayPopupOverlay
          data={ddayPopup}
          weddingDate={wedding.date}
          isPreview={isPreview}
          onDismiss={() => setShowDdayPopup(false)}
          pointColor={INK}
          fontFamily={F_BODY}
        />
      )}
    </div>
  )
}
