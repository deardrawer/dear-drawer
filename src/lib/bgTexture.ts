import type { CSSProperties } from 'react'
import { isDarkColor } from './colorUtils'

// OUR / FAMILY 배경 재질 — 모두 코드로 그린 무늬(SVG 노이즈·그라데이션)라 이미지 파일 없이 동작한다.
// 사진·흰 팝업에는 깔지 않고, 테마 배경색(전체 배경·섹션 배경·카드 배경)을 칠하는 곳에만 겹친다.

export type BgTextureKind = 'none' | 'cotton' | 'laid' | 'emboss'

export const BG_TEXTURES: { id: BgTextureKind; label: string; desc: string }[] = [
  { id: 'none', label: '없음', desc: '단색' },
  { id: 'cotton', label: '코튼지', desc: '고르고 고운 면 종이 결' },
  { id: 'laid', label: '레이드지', desc: '고급 편지지의 가는 줄무늬 결' },
  { id: 'emboss', label: '엠보스', desc: '수채화용 코튼지처럼 부드러운 요철' },
]

// dark: 어두운 배경에서 쓸 버전 (없으면 image/blend 를 그대로 쓴다)
export type BgTextureLayers = { image: string; blend: string; dark?: { image: string; blend: string } }

const r = (n: number) => Math.round(n * 1000) / 1000

// 밝고 어두운 입자가 섞인 고운 결 (어느 배경색에서도 보이도록 회색 중심으로 대비만 준다)
function grain(id: string, size: number, freq: string, alpha: number, seed: number): string {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Cfilter id='${id}'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' seed='${seed}' stitchTiles='stitch'/%3E%3CfeColorMatrix values='2.4 0 0 0 -.7  2.4 0 0 0 -.7  2.4 0 0 0 -.7  0 0 0 0 ${r(alpha)}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23${id})'/%3E%3C/svg%3E")`
}

// 참고: 섹션마다 위쪽 빛 번짐을 넣으면 섹션 경계마다 밝은 띠가 생겨서, 여러 섹션이 이어지는 청첩장에는 결만 깐다

/** 재질 + 진하기(0.5~1.5, 기본 1) → 배경 이미지 레이어. 없음/모르는 값이면 null */
export function textureLayers(kind: unknown, strength?: unknown): BgTextureLayers | null {
  const k = typeof strength === 'number' && isFinite(strength) ? Math.max(0.5, Math.min(1.5, strength)) : 1
  if (kind === 'cotton') {
    return { image: grain('c', 220, '1.5', 0.07 * k, 5), blend: 'normal' }
  }
  if (kind === 'laid') {
    const h = `repeating-linear-gradient(0deg, rgba(255,255,255,${r(0.022 * k)}) 0 1px, rgba(0,0,0,${r(0.018 * k)}) 1px 2px, transparent 2px 4px)`
    const v = `repeating-linear-gradient(90deg, transparent 0 46px, rgba(0,0,0,${r(0.022 * k)}) 46px 47px, rgba(255,255,255,${r(0.018 * k)}) 47px 48px)`
    return { image: `${h}, ${v}, ${grain('l', 220, '1.5', 0.05 * k, 9)}`, blend: 'normal, normal, normal' }
  }
  if (kind === 'emboss') {
    // 수채화용 코튼지: 동글동글한 요철을 빛과 그림자로만 표현한다
    // 밝은 배경 = 그림자만 살짝(multiply), 어두운 배경 = 빛·그림자 모두(soft-light, 중간값 0.5 기준이라 배경색은 그대로)
    // color-interpolation-filters=sRGB: 필터 계산을 화면 색 기준으로 해서 중간값이 밝게 뜨지 않게
    const paper = (id: string, slope: number, intercept: number) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='${id}' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.12' numOctaves='2' seed='11' stitchTiles='stitch'/%3E%3CfeDiffuseLighting surfaceScale='1.1' lighting-color='%23ffffff' diffuseConstant='1'%3E%3CfeDistantLight azimuth='225' elevation='55'/%3E%3C/feDiffuseLighting%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='${r(slope)}' intercept='${r(intercept)}'/%3E%3CfeFuncG type='linear' slope='${r(slope)}' intercept='${r(intercept)}'/%3E%3CfeFuncB type='linear' slope='${r(slope)}' intercept='${r(intercept)}'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23${id})'/%3E%3C/svg%3E")`
    const ls = 0.08 * k
    const ds = 0.2 * k
    return {
      image: paper('el', ls, 1 - ls), blend: 'multiply',
      dark: { image: paper('ed', ds, 0.5 - ds * 0.91), blend: 'soft-light' },
    }
  }
  return null
}

/**
 * 배경 스타일: 재질이 있으면 색(또는 그라데이션) 위에 재질 레이어를 겹친다.
 * 재질이 없으면 기존과 똑같이 { background } 만 돌려준다 → 기존 청첩장 변화 없음.
 */
export function texBg(texture: BgTextureLayers | null | undefined, bg: string): CSSProperties {
  if (!texture) return { background: bg }
  if (/gradient\(/.test(bg)) {
    return { backgroundImage: `${texture.image}, ${bg}`, backgroundBlendMode: `${texture.blend}, normal` }
  }
  const t = texture.dark && isDarkColor(bg) ? texture.dark : texture
  return { backgroundColor: bg, backgroundImage: t.image, backgroundBlendMode: t.blend }
}
