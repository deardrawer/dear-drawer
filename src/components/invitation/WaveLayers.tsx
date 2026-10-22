'use client'

import type { CSSProperties } from 'react'
import { texBg, type BgTextureLayers } from '@/lib/bgTexture'

// OUR / FAMILY 섹션 사이 물결 3겹 (뒤·가운데·앞)
const WAVES = [
  { cls: 'wave-back', d: 'M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40 T1800,40 T2160,40 T2520,40 T2880,40 L2880,120 L0,120 Z', opacity: 0.3, animation: 'waveBack 8s ease-in-out infinite' },
  { cls: 'wave-mid', d: 'M0,50 Q240,90 480,50 T960,50 T1440,50 T1920,50 T2400,50 T2880,50 L2880,120 L0,120 Z', opacity: 0.5, animation: 'waveMid 6s ease-in-out infinite' },
  { cls: 'wave-front', d: 'M0,70 Q360,100 720,70 T1440,70 T2160,70 T2880,70 L2880,120 L0,120 Z', opacity: 1, animation: 'waveFront 7s ease-in-out infinite' },
]

const maskOf = (d: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2880 120' preserveAspectRatio='none'><path d='${d}'/></svg>`)}")`

/**
 * 물결 3겹. 배경 재질이 없으면 기존과 똑같은 단색 SVG,
 * 재질이 있으면 '재질 입힌 면을 물결 모양으로 오려낸' 층으로 그려 위아래 섹션과 같은 결이 이어진다.
 */
export default function WaveLayers({ fill, texture }: { fill: string; texture?: BgTextureLayers | null }) {
  if (!texture) {
    return (
      <svg viewBox="0 0 2880 120" preserveAspectRatio="none" className="absolute bottom-0 w-[250%] h-full" style={{ left: '-5%' }}>
        {WAVES.map((w) => (
          <path key={w.cls} className={w.cls} d={w.d} style={{ fill, ...(w.opacity < 1 ? { opacity: w.opacity } : {}), animation: w.animation }} />
        ))}
      </svg>
    )
  }
  return (
    <>
      {WAVES.map((w) => {
        const mask = maskOf(w.d)
        const style: CSSProperties = {
          ...texBg(texture, fill),
          opacity: w.opacity,
          animation: w.animation,
          maskImage: mask,
          WebkitMaskImage: mask,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
        }
        return <div key={w.cls} aria-hidden className={`${w.cls} absolute bottom-0 w-[250%] h-full`} style={{ left: '-5%', ...style }} />
      })}
    </>
  )
}
