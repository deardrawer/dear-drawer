'use client'

// 포커스(블러) 인트로: 흐릿한 사진이 선명해지며 빛 망울이 떠다니고, 작은 문구 → 제목 → 선 → 날짜가 차례로 떠오른다.
// 하객 화면(IntroAnimation)과 에디터 미리보기(IntroPreview)가 같이 쓴다.
import { useState, type CSSProperties } from 'react'

export const BLUR_INTRO_CSS = `
  @keyframes introBlurToSharp { 0% { filter: blur(20px); opacity: 0; transform: scale(1.1); } 100% { filter: blur(0); opacity: 1; transform: scale(1); } }
  .intro-blur-to-sharp { animation: introBlurToSharp 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
  @keyframes introBlurFadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  .intro-blur-fade-in-up { animation: introBlurFadeInUp 1s ease-out forwards; }
  @keyframes introSplitReveal { 0% { opacity: 0; transform: scaleX(0); } 100% { opacity: 1; transform: scaleX(1); } }
  .intro-split-reveal { animation: introSplitReveal 0.8s ease-out forwards; transform-origin: center; opacity: 0; }
  @keyframes introBokehFloat { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 0.6; } 50% { transform: translateY(-30px) translateX(20px); opacity: 0.8; } 90% { opacity: 0.4; } }
  @keyframes introBokehPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
  .intro-bokeh-particle { filter: blur(4px); animation: introBokehFloat 18s ease-in-out infinite, introBokehPulse 5s ease-in-out infinite; will-change: transform, opacity; backface-visibility: hidden; }
`

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || '').replace('#', '')
  if (h.length < 6) return `rgba(255,255,255,${alpha})`
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${alpha})`
}

function BokehParticles({ count = 10 }: { count?: number }) {
  // 위치·크기는 처음 한 번만 정한다 (다시 그려도 망울이 튀지 않게)
  const [particles] = useState(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 25 + 8,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 12,
    opacity: Math.random() * 0.25 + 0.05,
  })))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div key={p.id} className="absolute rounded-full intro-bokeh-particle"
          style={{ width: p.size, height: p.size, left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, opacity: p.opacity, background: 'radial-gradient(circle at 30% 30%, rgba(255, 250, 240, 0.9), rgba(255, 255, 255, 0.3))' }} />
      ))}
    </div>
  )
}

export function BlurIntro({ settings, backgroundStyle, titleStyle, accentColor, overlayColor }: {
  settings: { mainTitle?: string; subTitle?: string; dateText?: string; overlayOpacity?: number }
  backgroundStyle: CSSProperties
  titleStyle: CSSProperties
  accentColor: string
  overlayColor: string
}) {
  const sub = hexToRgba(accentColor, 0.7)
  return (
    <div className="relative h-full w-full overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: BLUR_INTRO_CSS }} />
      <div className="absolute inset-0 intro-blur-to-sharp" style={backgroundStyle} />
      <div className="absolute inset-0" style={{ backgroundColor: hexToRgba(overlayColor, (settings.overlayOpacity ?? 30) / 100) }} />
      <BokehParticles count={10} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[4px] sm:tracking-[8px] mb-4 intro-blur-fade-in-up" style={{ color: sub, animationDelay: '1.5s', animationDuration: '1.5s', opacity: 0 }}>
            {settings.subTitle}
          </p>
        )}
        <p className="intro-blur-fade-in-up" style={{ ...titleStyle, animationDelay: '2s', animationDuration: '1.5s', opacity: 0 }}>
          {settings.mainTitle}
        </p>
        <div className="w-16 h-px my-6 intro-split-reveal" style={{ backgroundColor: `${accentColor}80`, animationDelay: '2.5s' }} />
        {settings.dateText && (
          <p className="text-sm intro-blur-fade-in-up" style={{ color: sub, animationDelay: '2.8s', animationDuration: '1.5s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}
