function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h: number
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    default: h = ((r - g) / d + 4) / 6; break
  }

  return { h, s, l }
}

function hslToHex(h: number, s: number, l: number): string {
  if (s === 0) {
    const v = Math.round(l * 255)
    return `#${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}`
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
  const g = Math.round(hue2rgb(p, q, h) * 255)
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * sectionBg 기반으로 모달 버튼 배경색 생성.
 * 흰 배경 모달 위에서 확실히 보이도록 lightness를 0.80~0.85 범위로 조정.
 */
export function getButtonBgColor(sectionBg: string): string {
  const { h, s } = hexToHSL(sectionBg)
  const newS = Math.min(1, s + 0.1)
  return hslToHex(h, newS, 0.82)
}

/**
 * 닫기/제출 버튼용 — buttonBg보다 살짝 연한 톤.
 */
export function getButtonBgLightColor(sectionBg: string): string {
  const { h, s } = hexToHSL(sectionBg)
  return hslToHex(h, s, 0.88)
}

// ─── 배경 대비 자동 보정 (OUR / FAMILY 섹션 배경이 어두울 때 본문 글자를 밝게) ───

function toHex6(hex: string): string | null {
  if (typeof hex !== 'string') return null
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  return `#${h.toLowerCase()}`
}

function luminance(hex6: string): number {
  const ch = [1, 3, 5].map((i) => parseInt(hex6.slice(i, i + 2), 16) / 255)
  const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** 배경색이 어두운지 (흰 글자가 검은 글자보다 잘 읽히는 색) */
export function isDarkColor(hex: string): boolean {
  const h = toHex6(hex)
  if (!h) return false
  return contrast(h, '#ffffff') > contrast(h, '#000000')
}

const LIGHT_TEXT = '#f4f1ec'
const LIGHT_SUB = '#cfc8bf'
const DARK_TEXT = '#3d3d3d'
const DARK_SUB = '#555555'

// 포인트 색은 색상(hue)은 살리고 밝기만 옮겨 배경 위에서 보이게
function shiftForBg(color: string, bg: string, min: number): string {
  const c = toHex6(color)
  if (!c || contrast(c, bg) >= min) return color
  const { h, s } = hexToHSL(c)
  const dark = isDarkColor(bg)
  for (let i = 0; i <= 10; i++) {
    const l = dark ? 0.6 + i * 0.035 : 0.4 - i * 0.03
    const next = hslToHex(h, s, l)
    if (contrast(next, bg) >= min) return next
  }
  return dark ? LIGHT_TEXT : DARK_TEXT
}

/**
 * 배경(bg) 위에서 읽히도록 테마 글자색을 보정한다. (OUR / FAMILY)
 * - 어두운 배경: 대비가 부족한 본문·보조·포인트 색을 밝게
 * - 밝은 배경: 사용자가 본문색을 밝게 골라 안 보일 때만 본문·보조 색을 어둡게 (포인트 색은 그대로)
 * 이미 대비가 충분한 색은 그대로 둔다 → 기본 테마는 아무것도 바뀌지 않는다.
 * 한 번 보정된 색을 다른 배경에 다시 보정할 때는 사용자가 고른 원래 색부터 다시 따진다.
 */
type Readable = { text: string; gray: string; primary: string; secondary: string; accent: string; highlight?: string; divider: string }
type RawKeep = { __raw?: Readable }
export function readableOn<T extends Readable>(tc: T, bg: string): T {
  const b = toHex6(bg)
  if (!b) return tc
  const src: Readable = (tc as T & RawKeep).__raw || tc
  const dark = isDarkColor(b)
  const ok = (c: string | undefined, min: number) => { const h = c ? toHex6(c) : null; return !h || contrast(h, b) >= min }
  let next: Readable
  if (dark) {
    next = {
      text: ok(src.text, 4.5) ? src.text : LIGHT_TEXT,
      gray: ok(src.gray, 3) ? src.gray : LIGHT_SUB,
      primary: shiftForBg(src.primary, b, 2.5),
      secondary: shiftForBg(src.secondary, b, 2.5),
      accent: shiftForBg(src.accent, b, 2.5),
      highlight: src.highlight ? shiftForBg(src.highlight, b, 2.5) : src.highlight,
      divider: ok(src.divider, 1.4) ? src.divider : '#6b645c',
    }
  } else {
    next = {
      text: ok(src.text, 3) ? src.text : DARK_TEXT,
      gray: ok(src.gray, 2.5) ? src.gray : DARK_SUB,
      primary: src.primary, secondary: src.secondary, accent: src.accent, highlight: src.highlight, divider: src.divider,
    }
  }
  const same = (Object.keys(next) as (keyof Readable)[]).every((k) => next[k] === tc[k])
  if (same) return tc
  return { ...tc, ...next, __raw: src } as T
}
