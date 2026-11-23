// PARENTS(혼주용) C안 디자인 토큰 — 흰 바탕 · 먹색 글씨 · 가는 선 · 장식 없음
import type { CSSProperties } from 'react'

export const C_BG = '#FFFFFF'
export const C_INK = '#1F1D1A'
export const C_SUB = '#8A8378'
export const C_BODY = '#5B554D'
export const C_LINE = 'rgba(31,29,26,0.1)'
export const C_FIELD = '#F4F4F5'
export const C_OUTLINE = 'inset 0 0 0 1px var(--parents-outline, rgba(31,29,26,0.18))'

// ── 섹션 배경에 맞춰 바뀌는 글씨 · 선 색 (어두운 배경이면 밝게) ──
export const C_TXT = 'var(--parents-ink, #1F1D1A)'
export const C_TXT_SUB = 'var(--parents-sub, #8A8378)'
export const C_TXT_BODY = 'var(--parents-body, #5B554D)'
export const C_HAIR = 'var(--parents-line, rgba(31,29,26,0.1))'

/** 배경색이 어두운지 (hex만 판정, 그 외는 밝은 것으로 봄) */
export function isDarkColor(color?: string): boolean {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(color || '')
  if (!m) return false
  const n = parseInt(m[1], 16)
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.5
}

/** 섹션(또는 루트)에 줄 배경 + 글씨 변수. 밝은 배경이면 기본 글씨색(제목 · 부제는 고객 지정색) */
export function sectionTone(bg: string): CSSProperties {
  const dark = isDarkColor(bg)
  return dark
    ? {
        backgroundColor: bg,
        ['--parents-ink' as string]: '#FFFFFF',
        ['--parents-sub' as string]: 'rgba(255,255,255,0.62)',
        ['--parents-body' as string]: 'rgba(255,255,255,0.82)',
        ['--parents-line' as string]: 'rgba(255,255,255,0.18)',
        ['--parents-outline' as string]: 'rgba(255,255,255,0.42)',
        ['--parents-title' as string]: '#FFFFFF',
        ['--parents-caption' as string]: 'rgba(255,255,255,0.65)',
        // 어두운 배경: 기본(먹색) 포인트는 흰색으로, 고객이 고른 포인트는 그대로
        ['--parents-point' as string]: 'var(--parents-point-dark, #FFFFFF)',
        ['--parents-on-point' as string]: 'var(--parents-on-point-dark, #1F1D1A)',
      }
    : {
        backgroundColor: bg,
        ['--parents-ink' as string]: '#1F1D1A',
        ['--parents-sub' as string]: '#8A8378',
        ['--parents-body' as string]: '#5B554D',
        ['--parents-line' as string]: 'rgba(31,29,26,0.1)',
        ['--parents-outline' as string]: 'rgba(31,29,26,0.18)',
        ['--parents-title' as string]: 'var(--parents-title-light, #1F1D1A)',
        ['--parents-caption' as string]: 'var(--parents-caption-light, #8A8378)',
        ['--parents-point' as string]: 'var(--parents-point-light, #1F1D1A)',
        ['--parents-on-point' as string]: 'var(--parents-on-point-light, #FFFFFF)',
      }
}

/** 흰 바탕 섬(첫 화면 · 참석 여부 시트 · 계좌 창)은 섹션 배경과 상관없이 기본 글씨색 */
export const C_WHITE_ISLAND: CSSProperties = (() => {
  const t = sectionTone('#FFFFFF')
  delete t.backgroundColor
  return t
})()
/** 포인트 색 — 루트에서 --parents-point 로 지정 (기본 먹색) */
export const C_POINT = `var(--parents-point, ${C_INK})`
/** 포인트 색 위 글씨 — 포인트가 밝으면 먹색, 어두우면 흰색 */
export const C_ON_POINT = 'var(--parents-on-point, #FFFFFF)'
/** 부제(작은 캡션) 색 — 기본: 포인트 색을 고른 경우 포인트, 아니면 보조 회색 */
export const C_CAPTION = `var(--parents-caption, ${C_SUB})`
/** 제목 색 — 기본 먹색 */
export const C_TITLE = `var(--parents-title, ${C_INK})`
/** 포인트 색을 흰색에 연하게 섞은 색 (선택 상태 배경 등) */
export const cPointTint = (pct = 8) => `color-mix(in srgb, ${C_POINT} ${pct}%, #FFFFFF)`

/** 메인(제목) 서체 — 루트에서 --parents-heading-font 로 지정, 없으면 조선일보명조 */
export const C_KSERIF = "var(--parents-heading-font, 'ChosunIlboMyungjo', 'Noto Serif KR', serif)"
export const C_SERIF = "var(--font-instrument-serif), 'Instrument Serif', serif"
export const C_SANS = "'Pretendard Variable', 'Pretendard', sans-serif"
/** 고객이 고른 본문 서체 (ParentsInvitationView 루트에서 --parents-body-font 로 지정) */
export const C_BODY_FONT = `var(--parents-body-font, ${C_SANS})`

/** 작은 한글 캡션 (모시는 글 · 오시는 길 …) */
export const cCaption: CSSProperties = { fontSize: 12.5, color: C_CAPTION, letterSpacing: '0.02em', margin: 0 }

/** 한글 제목 (조선일보명조) */
export const cTitle = (size = 23, mt = 12): CSSProperties => ({
  fontFamily: C_KSERIF,
  fontWeight: 400,
  fontSize: size,
  lineHeight: 1.45,
  letterSpacing: '-0.02em',
  margin: `${mt}px 0 0`,
  color: C_TITLE,
  wordBreak: 'keep-all',
})

/** 본문 단락 */
export const cBody = (mt = 18): CSSProperties => ({
  fontFamily: C_BODY_FONT,
  fontSize: 15.5,
  lineHeight: 1.9,
  color: C_TXT_BODY,
  margin: `${mt}px 0 0`,
  wordBreak: 'keep-all',
})

/** 알약 버튼 — dark: 먹색 채움 / 아니면 1px 안쪽 테두리 */
export const cPill = (dark = true, h = 52): CSSProperties => ({
  height: h,
  flex: 1,
  minWidth: 0,
  borderRadius: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontFamily: C_SANS,
  fontSize: h >= 50 ? 15 : 14,
  fontWeight: 600,
  background: dark ? C_POINT : 'transparent',
  color: dark ? C_ON_POINT : C_TXT,
  boxShadow: dark ? undefined : C_OUTLINE,
  whiteSpace: 'nowrap',
  border: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
})

/** 작은 알약 버튼 (복사 등) */
export const cMiniPill = (active = false): CSSProperties => ({
  height: 34,
  padding: '0 14px',
  borderRadius: 999,
  boxShadow: active ? undefined : C_OUTLINE,
  background: active ? C_POINT : 'transparent',
  color: active ? C_ON_POINT : C_TXT,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: C_SANS,
  fontSize: 13.5,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s, color 0.2s',
})

/** 포인트 색 위에 올릴 글씨 색 (밝은 색이면 먹색) */
export function onPointColor(hex?: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex || '')
  if (!m) return '#FFFFFF'
  const n = parseInt(m[1], 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.62 ? C_INK : '#FFFFFF'
}

/** (사용 안 함 — 포인트 색은 고른 그대로 사용) 고객이 직접 고른 색이 너무 밝으면 글씨용으로 어둡게 */
export function readablePoint(hex?: string): string {
  if (!hex) return C_INK
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (lum <= 0.5) return `#${m[1]}`
  const f = 0.45
  return `rgb(${Math.round(r * (1 - f))}, ${Math.round(g * (1 - f))}, ${Math.round(b * (1 - f))})`
}

// ── 한글 이름 → 영문 표기 (영문 이름 필드가 없어 표시용으로만 자동 변환) ──
const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'oo', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
const JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']

/** 이름용 로마자 표기 (예: 지훈 → Jihoon, 서연 → Seoyeon). 한글이 아니면 그대로 */
export function romanizeName(name?: string): string {
  const src = (name || '').trim()
  if (!src) return ''
  let out = ''
  for (const ch of src) {
    const code = ch.charCodeAt(0) - 0xac00
    if (code < 0 || code > 11171) { out += ch; continue }
    const cho = Math.floor(code / 588)
    const jung = Math.floor((code % 588) / 28)
    const jong = code % 28
    let v = JUNG[jung]
    if (jung === 13 && cho === 11) v = 'woo'          // 우 → woo
    else if (jung === 17 && jong !== 0) v = 'yoo'     // 윤 → yoon
    out += CHO[cho] + v + JONG[jong]
  }
  return out.charAt(0).toUpperCase() + out.slice(1)
}

/** 받침 유무에 따라 '서연이가' / '지훈이가' 처럼 부르는 말 */
export function childCallName(name: string): string {
  const n = (name || '').trim()
  if (!n) return ''
  const last = n.charCodeAt(n.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return n
  return (last - 0xac00) % 28 === 0 ? n : `${n}이`
}

/** 고객이 비워 둔 경우 쓰는 기본 제목 */
export const DEFAULT_GREETING_TITLE = '귀한 걸음 하시어\n축복해 주시면 감사하겠습니다'
export const DEFAULT_TIMELINE_TITLE = '저희 가족이 걸어온 날들'

// ── 기존 PARENTS 섹션 애니메이션 (원본과 같은 값) ──
/** 처음 화면에 들어올 때 아래에서 떠오르며 선명해지는 순차 등장 */
export const cStagger = (hasAppeared: boolean, delay: number): CSSProperties => ({
  opacity: hasAppeared ? 1 : 0,
  transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
  filter: hasAppeared ? 'blur(0px)' : 'blur(6px)',
  transition: 'opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), filter 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
  transitionDelay: hasAppeared ? `${delay}s` : '0s',
})
/** 지금 보고 있는 섹션만 또렷하게, 나머지는 흐리게 */
export const cDim = (isActive: boolean): CSSProperties => ({
  filter: isActive ? 'none' : 'grayscale(30%)',
  opacity: isActive ? 1 : 0.3,
  transition: 'filter 0.5s, opacity 0.5s',
})
