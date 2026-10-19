// 인터랙티브 인트로 공용 타입과 도우미
import type { CSSProperties } from 'react'
import type { IntroSettings, IntroStyleId } from '@/lib/introPresets'

export interface IntroData {
  groomName: string
  brideName: string
  groomGiven: string
  brideGiven: string
  groomEn: string
  brideEn: string
  /** ISO yyyy-mm-dd (노웨딩이면 빈 값) */
  date: string
  timeDisplay: string
  /** 'HH:MM' 24시간 (별자리 하늘 계산용) */
  time: string
  venue: string
  /** 예식장 주소 (별자리 하늘의 도시 찾기용) */
  address: string
  /** 대표 사진: 인트로 사진 > 커버 사진 */
  photo: string
  gallery: string[]
  /** 노웨딩: 날짜·장소를 모두 숨긴 청첩장 — 초대 문구 대신 소식을 전하는 문구를 쓴다 */
  noWedding: boolean
}

export interface IntroStyleProps {
  w: number
  h: number
  opts: Record<string, unknown>
  data: IntroData
  /** 재방문·모션 줄이기: 완료 상태로 바로 그린다 */
  finished: boolean
  reduced: boolean
  /** 셸이 "지금 완료해" 를 요청할 때마다 1씩 증가 (스크롤·건너뛰기) */
  signal: number
  onComplete: () => void
}

type InvitationLike = {
  groom?: { name?: string; nameEn?: string; firstName?: string }
  bride?: { name?: string; nameEn?: string; firstName?: string }
  wedding?: { date?: string; time?: string; timeDisplay?: string; showDate?: boolean; showVenue?: boolean; venue?: { name?: string; address?: string } }
  media?: { coverImage?: string }
  gallery?: { images?: string[] }
  intro?: IntroSettings
}

function given(full: string, first?: string) {
  if (first) return first
  const n = (full || '').trim()
  return n.length === 3 ? n.slice(1) : n
}

export function buildIntroData(inv: InvitationLike): IntroData {
  const groomName = inv.groom?.name || '신랑'
  const brideName = inv.bride?.name || '신부'
  return {
    groomName,
    brideName,
    groomGiven: given(groomName, inv.groom?.firstName),
    brideGiven: given(brideName, inv.bride?.firstName),
    groomEn: (inv.groom?.nameEn || '').trim(),
    brideEn: (inv.bride?.nameEn || '').trim(),
    date: inv.wedding?.showDate !== false ? inv.wedding?.date || '' : '',
    timeDisplay: inv.wedding?.showDate !== false ? inv.wedding?.timeDisplay || '' : '',
    time: inv.wedding?.showDate !== false ? inv.wedding?.time || '' : '',
    venue: inv.wedding?.showVenue !== false ? inv.wedding?.venue?.name || '' : '',
    address: inv.wedding?.showVenue !== false ? inv.wedding?.venue?.address || '' : '',
    photo: inv.intro?.introImage || inv.media?.coverImage || '',
    gallery: (inv.gallery?.images || []).filter(Boolean),
    noWedding: inv.wedding?.showDate === false && inv.wedding?.showVenue === false,
  }
}

/**
 * 인트로별 이름 (styleOptions[스타일].groomName / brideName).
 * 적은 글자를 그 인트로의 모든 이름 자리에 그대로 쓴다 — 한글로 적으면 영문 이름은 쓰지 않고,
 * 영문으로 적으면 영문 자리에 들어간다. 둘 다 비우면 청첩장 정보의 이름.
 */
export function withStyleNames(d: IntroData, opts: Record<string, unknown>): IntroData {
  const g = str(opts.groomName).trim(), b = str(opts.brideName).trim()
  if (!g && !b) return d
  const out = { ...d }
  const put = (v: string, side: 'groom' | 'bride') => {
    if (!v) return
    if (hasHangul(v)) {
      if (side === 'groom') { out.groomName = v; out.groomGiven = v; out.groomEn = '' } else { out.brideName = v; out.brideGiven = v; out.brideEn = '' }
    } else if (side === 'groom') { out.groomEn = v; out.groomName = v; out.groomGiven = v } else { out.brideEn = v; out.brideName = v; out.brideGiven = v }
  }
  put(g, 'groom'); put(b, 'bride')
  // 한쪽만 영문이면 짝이 맞지 않으니 영문 표기를 쓰지 않는다
  if (!out.groomEn || !out.brideEn) { out.groomEn = ''; out.brideEn = '' }
  return out
}

/** 영문 이름이 둘 다 있으면 영문, 아니면 한글 */
export function coupleNames(d: IntroData, sep = ' & ') {
  return d.groomEn && d.brideEn ? `${d.groomEn}${sep}${d.brideEn}` : `${d.groomName}${sep}${d.brideName}`
}

export const hasHangul = (s: string) => /[ㄱ-ㆎ가-힣]/.test(s)

export function dateDots(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export function weekdayEn(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]
}

export function str(v: unknown, fallback = '') {
  return typeof v === 'string' && v.trim() ? v : fallback
}

export function lines(v: unknown, fallback: string) {
  return str(v, fallback).split('\n').map(l => l.trim()).filter(Boolean)
}

/** 컬러를 흰색과 섞어 연한 바탕색을 만든다 */
export function tint(hex: string, amount = 0.72) {
  const h = hex.replace('#', '')
  if (h.length < 6) return '#F6EFEA'
  const mix = (i: number) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - amount) + 255 * amount)
  return `rgb(${mix(0)}, ${mix(2)}, ${mix(4)})`
}

/** 어두운 바탕이면 글자를 밝게 바꾸기 위한 판정 */
export function isDark(hex: string) {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  return r * 0.299 + g * 0.587 + b * 0.114 < 140
}

/** 이름 글꼴 — 시네마틱과 같은 한글 글꼴 6종 (두 장의 사진·라벨 문구) */
export const NAME_FONTS: Record<string, string> = {
  pretendard: "Pretendard, 'Noto Sans KR', sans-serif",
  notoserif: "'Noto Serif KR', serif",
  myeongjo: "'Nanum Myeongjo', serif",
  nanumgothic: "'Nanum Gothic', sans-serif",
  gowun: "'Gowun Batang', serif",
  handwriting: "'NostalgicPoliceFairness', cursive",
}
export const nameFont = (v: unknown, fallback = 'pretendard') => NAME_FONTS[str(v, fallback)] || NAME_FONTS[fallback]

// 노이즈 밝기를 lo~hi 회색으로 펴서 (불투명) 겹친다 — 곱하기면 lo만큼 어두운 결이, 오버레이면 밝고 어두운 결이 생긴다
const svgNoise = (id: string, freq: string, oct: number, seed: number, lo: number, hi: number, size: number) => {
  const k = (hi - lo).toFixed(3), c = lo.toFixed(3)
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='${id}'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${oct}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='${k} 0 0 0 ${c}  ${k} 0 0 0 ${c}  ${k} 0 0 0 ${c}  0 0 0 0 1'/></filter><rect width='100%25' height='100%25' filter='url(%23${id})'/></svg>")`
}
// 재생지 티끌: 고운 노이즈의 가장 진한 몇 %만 남겨 작은 점으로 흩뿌린다
const svgSpecks = (seed: number, rgb: string, size: number) =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${rgb.split(',')[0]}  0 0 0 0 ${rgb.split(',')[1]}  0 0 0 0 ${rgb.split(',')[2]}  14 0 0 0 -10.3'/><feComponentTransfer><feFuncA type='discrete' tableValues='0 0 .45 .8'/></feComponentTransfer></filter><rect width='100%25' height='100%25' filter='url(%23s)'/></svg>")`
const PAPER_LIGHT = [svgSpecks(21, '.24,.22,.2', 260), svgNoise('f', '0.035 0.11', 3, 11, 0.95, 1, 420), svgNoise('g', '.9', 3, 3, 0.84, 1, 200), svgNoise('m', '.012', 2, 7, 0.975, 1, 600)]
const PAPER_DARK = [svgSpecks(21, '.92,.9,.86', 260), svgNoise('f', '0.035 0.11', 3, 11, 0.42, 0.58, 420), svgNoise('g', '.9', 3, 3, 0.28, 0.72, 200), svgNoise('m', '.01', 2, 7, 0.47, 0.53, 600)]
/**
 * 진한 종이 질감 레이어 (배경 위 absolute 레이어로 깐다): 재생지 티끌 + 희미한 섬유 결 + 고운 입자 + 옅은 얼룩 톤.
 * 밝은 종이는 곱하기로 결이 비치고, 어두운 종이는 오버레이로 밝고 어두운 결이 함께 드러난다.
 */
export function paperLayer(dark = false, strength = 1): CSSProperties {
  return {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: (dark ? PAPER_DARK : PAPER_LIGHT).join(', '),
    backgroundSize: '260px 260px, 420px 420px, 200px 200px, 600px 600px',
    backgroundBlendMode: 'normal, multiply, multiply, normal',
    mixBlendMode: dark ? 'overlay' : 'multiply',
    opacity: (dark ? 0.32 : 0.45) * strength,
  }
}

export const PAPER_TEXTURE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='t'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' seed='2'/><feColorMatrix values='0 0 0 0 .42  0 0 0 0 .39  0 0 0 0 .34  0 0 0 .16 -.01'/></filter><rect width='100%25' height='100%25' filter='url(%23t)'/></svg>\")"

export type { IntroStyleId }

/** 인트로 화면이 실제로 몇 배로 보이는지 — 에디터 미리보기는 휴대폰 크기로 그린 뒤 통째로 줄여서(transform) 보여주므로,
 *  손가락 좌표·이동 거리를 이 값으로 나눠 인트로 안의 좌표로 되돌린다. 실제 청첩장에선 1 */
export function stageScale(el: Element | null | undefined): number {
  const f = el?.closest?.('[data-intro-frame]') as HTMLElement | null
  if (!f || !f.offsetWidth) return 1
  return f.getBoundingClientRect().width / f.offsetWidth || 1
}

export interface PhotoCrop { cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number; scale?: number; positionX?: number; positionY?: number }

/** 사진 필드의 실제 사진: 직접 고른 사진 > 대체 사진 (대표 사진 또는 갤러리 n번) */
export function photoOf(opts: Record<string, unknown>, key: string, data: IntroData, fallback: 'photo' | 'gallery0' | 'gallery1' = 'photo') {
  const fb = fallback === 'gallery0' ? data.gallery[0] || data.photo : fallback === 'gallery1' ? data.gallery[1] || data.photo : data.photo
  return str(opts[key], fb)
}

/** 크롭 편집기에서 정한 사진 크기·위치 (opts[`${key}Crop`]) */
export function cropOf(opts: Record<string, unknown>, key: string): PhotoCrop | undefined {
  const c = opts[`${key}Crop`]
  return c && typeof c === 'object' ? (c as PhotoCrop) : undefined
}
