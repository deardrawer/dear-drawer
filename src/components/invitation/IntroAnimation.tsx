'use client'

import { useState, useEffect, useRef } from 'react'
import { IntroSettings } from '@/lib/introPresets'

interface IntroAnimationProps {
  settings: IntroSettings
  coverImage?: string
  groomName: string
  brideName: string
  weddingDate?: string
  venueName?: string
  onComplete: () => void
  isComplete: boolean
}

// 보케(빛 입자) 컴포넌트
function BokehParticles({ count = 20, color = 'warm' }: { count?: number; color?: 'warm' | 'gold' | 'white' }) {
  const colors = {
    warm: 'rgba(255, 215, 180, 0.4)',
    gold: 'rgba(255, 215, 0, 0.5)',
    white: 'rgba(255, 255, 255, 0.4)',
  }
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 30 + 10,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
    opacity: Math.random() * 0.5 + 0.1,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full intro-bokeh-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
            background: `radial-gradient(circle at 30% 30%, rgba(255, 250, 240, 0.9), ${colors[color]})`,
          }}
        />
      ))}
    </div>
  )
}

// 꽃잎 컴포넌트
function FallingPetals({ count = 20 }: { count?: number }) {
  const petals = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 5 + 8,
    size: Math.random() * 15 + 10,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute intro-petal"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: p.size,
            height: p.size,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// 골드 파티클 컴포넌트
function GoldParticles({ count = 50 }: { count?: number }) {
  const goldColors = ['#C9A24D', '#E6C87A', '#B08D3A']
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: 5 + Math.random() * 90,
    top: 5 + Math.random() * 90,
    delay: Math.random() * 2,
    targetX: (Math.random() - 0.5) * 50,
    targetY: (Math.random() - 0.5) * 50,
    opacity: 0.2 + Math.random() * 0.6,
    color: goldColors[Math.floor(Math.random() * 3)],
  }))

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full intro-gold-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            '--target-x': `${p.targetX}px`,
            '--target-y': `${p.targetY}px`,
            '--particle-opacity': p.opacity,
            background: `radial-gradient(circle at 30% 30%, ${p.color}, ${p.color}88)`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// 빛 광선 컴포넌트
function LightRays({ count = 8 }: { count?: number }) {
  const rays = Array.from({ length: count }, (_, i) => ({
    id: i,
    rotation: (360 / count) * i,
    delay: i * 0.1,
    width: 2 + Math.random() * 3,
  }))

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rays.map((r) => (
        <div
          key={r.id}
          className="absolute intro-light-ray"
          style={{
            transform: `rotate(${r.rotation}deg)`,
            animationDelay: `${r.delay}s`,
            width: `${r.width}px`,
            height: '150%',
          }}
        />
      ))}
    </div>
  )
}

// 스크롤 인디케이터 컴포넌트
function ScrollIndicator({ color = 'white' }: { color?: 'white' | 'amber' | 'pink' | 'sky' | 'gray' }) {
  const colors = {
    white: { text: 'text-white/50', line: 'from-white/50', dot: 'bg-white/60', bar: 'bg-white/30' },
    amber: { text: 'text-amber-200/50', line: 'from-amber-200/50', dot: 'bg-amber-200/60', bar: 'bg-amber-200/30' },
    pink: { text: 'text-pink-300/50', line: 'from-pink-300/50', dot: 'bg-pink-300/60', bar: 'bg-pink-300/30' },
    sky: { text: 'text-sky-200/50', line: 'from-sky-200/50', dot: 'bg-sky-200/60', bar: 'bg-sky-200/30' },
    gray: { text: 'text-gray-400/50', line: 'from-gray-400/50', dot: 'bg-gray-400/60', bar: 'bg-gray-400/30' },
  }
  const c = colors[color]

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center intro-fade-in-delay-3">
      <span className={`text-[10px] ${c.text} mb-2`}>Scroll</span>
      <div className={`w-px h-6 bg-gradient-to-b ${c.line} to-transparent`} />
      <div className={`w-1.5 h-1.5 ${c.dot} rounded-full mt-1 intro-float`} />
      <div className={`w-8 h-px ${c.bar} mt-3`} />
    </div>
  )
}

export default function IntroAnimation({
  settings,
  coverImage,
  groomName,
  brideName,
  weddingDate,
  venueName,
  onComplete,
  isComplete,
}: IntroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 자동 완료 (4초 후)
  const INTRO_DURATION = 4000
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, INTRO_DURATION)

    return () => clearTimeout(timer)
  }, [onComplete])

  // backgroundScale을 cover 기반 줌으로 계산 (100 = cover, 150 = 줌인)
  const scale = settings.backgroundScale || 100
  const backgroundStyle = {
    backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #333 0%, #111 100%)',
    backgroundSize: scale > 100 ? `${scale}%` : 'cover',
    backgroundPosition: `${settings.backgroundPositionX ?? 50}% ${settings.backgroundPositionY ?? 50}%`,
    backgroundRepeat: 'no-repeat' as const,
    filter: `brightness(${(settings.backgroundBrightness || 100) / 100})`,
  }

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${(settings.overlayOpacity || 30) / 100})`,
  }

  const titleStyle = {
    fontSize: `${settings.titleFontSize || 24}px`,
    letterSpacing: `${settings.titleLetterSpacing || 3}px`,
    color: settings.titleColor || '#ffffff',
  }

  const subTitleStyle = {
    color: settings.subTitleColor || 'rgba(255,255,255,0.8)',
  }

  // 기본값 설정
  const mainTitle = settings.mainTitle || `${groomName} & ${brideName}`
  const subTitle = settings.subTitle || 'WEDDING INVITATION'
  const dateText = settings.dateText || (weddingDate ? formatDate(weddingDate) : '')
  const venueText = settings.venueText || venueName || ''

  // 프리셋별 렌더링
  const renderIntro = () => {
    const commonProps = { settings: { ...settings, mainTitle, subTitle, dateText, venueText }, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }

    switch (settings.presetId) {
      case 'cinematic':
        return <CinematicIntro {...commonProps} />
      case 'typing':
        return <TypingIntro {...commonProps} />
      case 'blur':
        return <BlurIntro {...commonProps} />
      case 'zoom':
        return <ZoomIntro {...commonProps} />
      case 'bokeh':
        return <BokehIntro {...commonProps} />
      case 'letter':
        return <LetterIntro {...commonProps} />
      case 'petal':
        return <PetalIntro {...commonProps} />
      case 'watercolor':
        return <WatercolorIntro {...commonProps} />
      case 'lightray':
        return <LightrayIntro {...commonProps} />
      case 'film':
        return <FilmIntro {...commonProps} />
      case 'ripple':
        return <RippleIntro {...commonProps} />
      case 'gold':
        return <GoldIntro {...commonProps} />
      case 'focus':
        return <FocusIntro {...commonProps} />
      default:
        return <CinematicIntro {...commonProps} />
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black"
      style={{
        opacity: isComplete ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: isComplete ? 'none' : 'auto',
      }}
    >
      <style jsx global>{`
        /* ========== 기본 애니메이션 ========== */

        /* 타이핑 커서 */
        @keyframes introBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .intro-typing-cursor {
          animation: introBlink 1s infinite;
          margin-left: 2px;
        }

        /* 페이드 인 */
        @keyframes introFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .intro-fade-in { animation: introFadeIn 1s ease-out forwards; }
        .intro-fade-in-delay { animation: introFadeIn 1s ease-out 0.5s forwards; opacity: 0; }
        .intro-fade-in-delay-2 { animation: introFadeIn 1s ease-out 1s forwards; opacity: 0; }
        .intro-fade-in-delay-3 { animation: introFadeIn 1s ease-out 1.5s forwards; opacity: 0; }

        /* 페이드 인 업 */
        @keyframes introFadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .intro-fade-in-up { animation: introFadeInUp 1s ease-out forwards; }
        .intro-fade-in-up-delay { animation: introFadeInUp 1s ease-out 0.5s forwards; opacity: 0; }
        .intro-fade-in-up-delay-2 { animation: introFadeInUp 1s ease-out 1s forwards; opacity: 0; }

        /* 슬라이드 업 */
        @keyframes introSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .intro-slide-up { animation: introSlideUp 0.8s ease-out forwards; }
        .intro-slide-up-delay { animation: introSlideUp 0.8s ease-out 0.3s forwards; opacity: 0; }

        /* 줌 아웃 */
        @keyframes introZoomOut {
          from { transform: scale(1.1); }
          to { transform: scale(1); }
        }
        .intro-zoom-out { animation: introZoomOut 2.5s ease-out forwards; }

        /* 블러 → 선명 */
        @keyframes introBlurToSharp {
          0% { filter: blur(20px); opacity: 0; transform: scale(1.1); }
          100% { filter: blur(0); opacity: 1; transform: scale(1); }
        }
        .intro-blur-to-sharp { animation: introBlurToSharp 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

        /* 글자 좁아지기 (시네마틱) */
        @keyframes introLetterSpread {
          0% { opacity: 0; letter-spacing: 6px; }
          100% { opacity: 1; letter-spacing: 3px; }
        }
        .intro-letter-spread { animation: introLetterSpread 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards; opacity: 0; }

        /* 라인 확장 */
        @keyframes introLineExpand {
          from { width: 0; }
          to { width: 50px; }
        }
        .intro-line-expand { animation: introLineExpand 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

        /* 플로팅 */
        @keyframes introFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .intro-float { animation: introFloat 3s ease-in-out infinite; }

        /* 글로우 효과 */
        @keyframes introGlowIn {
          0% { opacity: 0; text-shadow: 0 0 0 transparent; }
          50% { text-shadow: 0 0 30px currentColor; }
          100% { opacity: 1; text-shadow: 0 0 10px currentColor; }
        }
        .intro-glow-in { animation: introGlowIn 1.5s ease-out forwards; opacity: 0; }
        .intro-glow-in-delay { animation: introGlowIn 1.5s ease-out 0.5s forwards; opacity: 0; }

        /* 스플릿 reveal */
        @keyframes introSplitReveal {
          0% { opacity: 0; transform: scaleX(0); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        .intro-split-reveal { animation: introSplitReveal 0.8s ease-out forwards; transform-origin: center; opacity: 0; }

        /* 슬라이드 인 (좌우) */
        @keyframes introSlideInLeft {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes introSlideInRight {
          0% { opacity: 0; transform: translateX(30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .intro-slide-in-left { animation: introSlideInLeft 0.8s ease-out forwards; opacity: 0; }
        .intro-slide-in-right { animation: introSlideInRight 0.8s ease-out forwards; opacity: 0; }
        .intro-slide-in-left-delay { animation: introSlideInLeft 0.8s ease-out 0.5s forwards; opacity: 0; }
        .intro-slide-in-right-delay { animation: introSlideInRight 0.8s ease-out 0.5s forwards; opacity: 0; }

        /* 스케일 업 */
        @keyframes introScaleUp {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .intro-scale-up { animation: introScaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }
        .intro-scale-up-delay { animation: introScaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards; opacity: 0; }

        /* 회전하며 나타남 */
        @keyframes introRotateIn {
          0% { opacity: 0; transform: rotate(-10deg) scale(0.9); }
          100% { opacity: 1; transform: rotate(0) scale(1); }
        }
        .intro-rotate-in { animation: introRotateIn 0.8s ease-out forwards; }
        .intro-rotate-in-delay { animation: introRotateIn 0.8s ease-out 0.5s forwards; opacity: 0; }

        /* 물결 텍스트 */
        @keyframes introWaveText {
          0% { opacity: 0; transform: translateY(20px) rotate(3deg); }
          50% { transform: translateY(-5px) rotate(-1deg); }
          100% { opacity: 1; transform: translateY(0) rotate(0); }
        }
        .intro-wave-text { animation: introWaveText 1s ease-out forwards; }
        .intro-wave-text-delay { animation: introWaveText 1s ease-out 0.5s forwards; opacity: 0; }

        /* ========== 보케 파티클 ========== */
        @keyframes introBokehFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          50% { transform: translateY(-30px) translateX(20px); opacity: 0.8; }
          90% { opacity: 0.4; }
        }
        @keyframes introBokehPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 215, 180, 0.3); }
          50% { transform: scale(1.2); box-shadow: 0 0 40px rgba(255, 215, 180, 0.5); }
        }
        .intro-bokeh-particle {
          filter: blur(2px);
          animation: introBokehFloat 15s ease-in-out infinite, introBokehPulse 4s ease-in-out infinite;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* ========== 꽃잎 ========== */
        @keyframes introPetalFall {
          0% {
            transform: translateY(-100px) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% { opacity: 1; }
          100% {
            transform: translateY(100vh) rotate(720deg) translateX(100px);
            opacity: 0.3;
          }
        }
        .intro-petal {
          background: linear-gradient(135deg, #ffe4e9 0%, #ffc0cb 50%, #ffe4e9 100%);
          border-radius: 50% 0 50% 50%;
          animation: introPetalFall linear infinite;
          opacity: 0.7;
          will-change: transform;
          backface-visibility: hidden;
        }

        /* ========== 골드 파티클 ========== */
        @keyframes introGoldGather {
          0% {
            transform: translate(var(--target-x), var(--target-y)) scale(0);
            opacity: 0;
          }
          50% { opacity: 1; }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes introGoldShimmer {
          0%, 100% {
            box-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 15px rgba(255, 215, 0, 1);
            transform: scale(1.2);
          }
        }
        .intro-gold-particle {
          opacity: var(--particle-opacity, 0.6);
          animation: introGoldGather 2s ease-out forwards, introGoldShimmer 3s ease-in-out infinite 2s;
          will-change: transform, opacity;
          backface-visibility: hidden;
          box-shadow: 0 0 4px currentColor;
        }

        /* ========== 빛 광선 ========== */
        @keyframes introRayExpand {
          0% { opacity: 0; transform: rotate(var(--rotation)) scaleY(0); }
          30% { opacity: 0.3; }
          70% { opacity: 0.6; }
          100% { opacity: 0.4; transform: rotate(var(--rotation)) scaleY(1); }
        }
        @keyframes introRayPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        .intro-light-ray {
          background: linear-gradient(to bottom, transparent, rgba(255, 248, 220, 0.6), transparent);
          transform-origin: center center;
          animation: introRayExpand 3s ease-out forwards, introRayPulse 4s ease-in-out infinite 3s;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        /* ========== 편지 봉투 ========== */
        @keyframes introFlapOpen {
          0% { transform: perspective(500px) rotateX(0deg); z-index: 4; }
          99% { z-index: 4; }
          100% { transform: perspective(500px) rotateX(-180deg); z-index: 1; }
        }
        @keyframes introCardSlideOut {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-160px); }
        }
        @keyframes introCardExpand {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes introSealBreak {
          0% { opacity: 1; transform: scale(1) rotate(0deg); }
          100% { opacity: 0; transform: scale(0.5) rotate(45deg); }
        }
        @keyframes introEnvelopeDown {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(100px); }
        }

        /* ========== 수채화 ========== */
        @keyframes introWatercolorSpread {
          0% { clip-path: circle(0% at 50% 50%); opacity: 0; }
          100% { clip-path: circle(100% at 50% 50%); opacity: 1; }
        }
        @keyframes introWatercolorBlob {
          0%, 100% { transform: scale(1) translateZ(0); }
          50% { transform: scale(1.02) translateZ(0); }
        }
        @keyframes introTextSpread {
          0% { opacity: 0; filter: blur(10px); transform: scale(1.1) translateZ(0); }
          100% { opacity: 1; filter: blur(0); transform: scale(1) translateZ(0); }
        }
        .intro-watercolor-spread { animation: introWatercolorSpread 2s ease-out forwards; will-change: clip-path, opacity; }
        .intro-watercolor-blob { animation: introWatercolorBlob 10s ease-in-out infinite; will-change: transform; }
        .intro-text-spread { animation: introTextSpread 1.5s ease-out forwards; opacity: 0; }

        /* ========== 필름 빈티지 ========== */
        @keyframes introFilmGrain {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0.1%, 0.1%); }
        }
        @keyframes introFilmFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.97; }
        }
        @keyframes introFilmVignette {
          0% { box-shadow: inset 0 0 150px 60px rgba(0,0,0,0.9); }
          100% { box-shadow: inset 0 0 100px 40px rgba(0,0,0,0.5); }
        }
        .intro-film-grain { animation: introFilmGrain 2s ease-in-out infinite; }
        .intro-film-flicker { animation: introFilmFlicker 3s ease-in-out infinite; }
        .intro-film-vignette { animation: introFilmVignette 2s ease-out forwards; }
        .intro-film-overlay {
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px);
        }
        .intro-sepia-filter { filter: sepia(0.4) contrast(1.1) brightness(0.95); }

        /* ========== 물결 반사 ========== */
        @keyframes introWaterDistort {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes introWaterDistort2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes introRippleShine {
          0% { opacity: 0; transform: translateX(-100%) skewX(-15deg); }
          50% { opacity: 0.5; }
          100% { opacity: 0; transform: translateX(100%) skewX(-15deg); }
        }
        @keyframes introRippleGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .intro-water-ripple-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 20%, rgba(200, 230, 255, 0.5) 50%, rgba(255, 255, 255, 0.4) 80%, transparent 100%);
          filter: blur(1px);
          will-change: transform;
        }
        .intro-water-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 0%, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%, transparent 100%);
          animation: introRippleShine 4s ease-in-out infinite;
        }
        .intro-water-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 100% 40% at 50% 100%, rgba(100, 180, 255, 0.35) 0%, rgba(150, 200, 255, 0.2) 30%, transparent 70%);
          animation: introRippleGlow 3s ease-in-out infinite;
        }

        /* ========== 포커스 전환 ========== */
        @keyframes introFocusPull {
          0% { filter: blur(15px); transform: scale(1.05); opacity: 0.5; }
          30% { filter: blur(20px); opacity: 0.7; }
          100% { filter: blur(0px); transform: scale(1); opacity: 1; }
        }
        @keyframes introDepthShift {
          0% { filter: blur(8px); opacity: 0.3; }
          50% { filter: blur(15px); opacity: 0.5; }
          100% { filter: blur(0px); opacity: 1; }
        }
        .intro-focus-pull { animation: introFocusPull 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .intro-depth-shift { animation: introDepthShift 3s ease-out forwards; opacity: 0; }

        /* ========== 어두웠다 밝아지기 ========== */
        @keyframes introDarkToLight {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        .intro-dark-to-light { animation: introDarkToLight 3s ease-out forwards; }

        /* ========== 슬로우 줌 ========== */
        @keyframes introSlowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        .intro-slow-zoom { animation: introSlowZoom 8s ease-out forwards; }
      `}</style>

      {renderIntro()}

      {/* 스킵 버튼 */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 z-50 flex items-center gap-1 px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white/80 text-xs rounded-full backdrop-blur-sm transition-colors"
      >
        건너뛰기
      </button>
    </div>
  )
}

// 날짜 포맷 헬퍼
function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}.${month}.${day}`
}

// 공통 Props 타입
interface IntroComponentProps {
  settings: IntroSettings & { mainTitle: string; subTitle: string; dateText: string; venueText: string }
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
}

// 시네마틱 인트로
function CinematicIntro({ settings, backgroundStyle, overlayStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 intro-fade-in intro-zoom-out" style={{ ...backgroundStyle, filter: `${backgroundStyle.filter} grayscale(100%)` }} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <div className="intro-line-expand h-px bg-white/50 mb-5" />
        <p className="text-[16px] intro-letter-spread uppercase whitespace-nowrap" style={{ ...titleStyle, fontFamily: "'Cormorant Garamond', serif" }}>
          {settings.mainTitle}
        </p>
        {settings.dateText && (
          <p className="text-[12px] mt-3.5 intro-fade-in-delay" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', fontFamily: "'Cormorant Garamond', serif" }}>
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator />
    </div>
  )
}

// 타이핑 인트로
function TypingIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  const [displayText, setDisplayText] = useState('')
  const [completed, setCompleted] = useState(false)
  const fullText = settings.mainTitle

  useEffect(() => {
    let index = 0
    const startTimer = setTimeout(() => {
      setDisplayText(fullText.slice(0, 1))
      index = 1

      const timer = setInterval(() => {
        if (index < fullText.length) {
          index++
          setDisplayText(fullText.slice(0, index))
        } else {
          clearInterval(timer)
          setTimeout(() => setCompleted(true), 300)
        }
      }, 100)

      return () => clearInterval(timer)
    }, 800)

    return () => clearTimeout(startTimer)
  }, [fullText])

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-6 intro-slide-up" style={subTitleStyle}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl mb-2" style={titleStyle}>
          {displayText}
          {!completed && <span className="intro-typing-cursor">|</span>}
        </p>
        <div className="w-20 h-px bg-white/50 my-6 intro-split-reveal" style={{ animationDelay: '2.8s' }} />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '3.2s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p className="text-xs text-white/50 mt-2 intro-fade-in-up" style={{ animationDelay: '3.5s', opacity: 0 }}>
            {settings.venueText}
          </p>
        )}
      </div>
      <ScrollIndicator />
    </div>
  )
}

// 블러 인트로
function BlurIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 intro-blur-to-sharp" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[8px] mb-4 intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '1.5s', animationDuration: '1.5s', opacity: 0 }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-fade-in-up" style={{ ...titleStyle, animationDelay: '2s', animationDuration: '1.5s', opacity: 0 }}>
          {settings.mainTitle}
        </p>
        <div className="w-16 h-px bg-white/50 my-6 intro-split-reveal" style={{ animationDelay: '2.5s' }} />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '2.8s', animationDuration: '1.5s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator />
    </div>
  )
}

// 줌 인트로
function ZoomIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-slow-zoom" style={backgroundStyle} />
      {/* 어두웠다가 밝아지는 오버레이 */}
      <div className="absolute inset-0 bg-black intro-dark-to-light" />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="relative z-10 h-full flex flex-col items-center justify-end pb-20 text-white px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[4px] mb-4 intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '2s', animationDuration: '1.5s', opacity: 0 }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl font-serif intro-fade-in-up" style={{ ...titleStyle, animationDelay: '2.4s', animationDuration: '1.5s', opacity: 0 }}>
          {settings.mainTitle}
        </p>
        <div className="w-16 h-px bg-white/50 my-6 intro-split-reveal" style={{ animationDelay: '2.8s' }} />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '3.2s', animationDuration: '1.5s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator />
    </div>
  )
}

// 보케 인트로
function BokehIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      <BokehParticles count={35} color="warm" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4" style={{ ...subTitleStyle, animation: 'introLetterSpread 2s ease-out forwards', animationDuration: '2s' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl font-serif intro-glow-in" style={{ ...titleStyle, animationDelay: '1s', animationDuration: '2s' }}>
          {settings.mainTitle}
        </p>
        <div className="w-16 h-px bg-amber-400/50 mx-auto my-6 intro-split-reveal" style={{ animationDelay: '1.8s' }} />
        {settings.dateText && (
          <p className="text-sm intro-glow-in" style={{ ...subTitleStyle, animationDelay: '2.2s', animationDuration: '2s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator color="amber" />
    </div>
  )
}

// 편지 인트로 (봉투 열림 애니메이션)
function LetterIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
      {/* 흑백 웨딩사진 배경 */}
      <div className="absolute inset-0" style={{ ...backgroundStyle, filter: 'grayscale(100%) brightness(0.4)' }} />

      {/* 화이트 꽃잎 날림 효과 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[8, 18, 28, 38, 48, 58, 68, 78, 88, 13, 33, 53, 73, 93, 23, 43, 63, 83, 3].map((left, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: '-20px',
              width: `${10 + (i % 4) * 5}px`,
              height: `${10 + (i % 4) * 5}px`,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)',
              borderRadius: '50% 0 50% 50%',
              boxShadow: '0 2px 8px rgba(255,255,255,0.3)',
              animation: `introPetalFall ${8 + (i % 5) * 2}s linear ${i * 0.4}s infinite`,
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>

      {/* 봉투 래퍼 */}
      <div
        className="relative mt-[50px]"
        style={{ animation: 'introEnvelopeDown 0.8s ease-in 3.5s forwards' }}
      >
        {/* 봉투 본체 */}
        <div className="relative w-[280px] h-[260px]">
          {/* 봉투 뒷면 */}
          <div className="absolute inset-0 bg-[#f5f0e8] shadow-lg" style={{ zIndex: 1 }} />

          {/* 카드 */}
          <div
            className="absolute left-[15px] right-[15px] h-[180px] bg-white rounded-md shadow-xl flex flex-col items-center justify-center p-4 text-center"
            style={{
              zIndex: 2,
              top: '80px',
              animation: 'introCardSlideOut 1.2s ease-out 1.5s forwards',
            }}
          >
            <p className="text-[8px] text-gray-400 tracking-[2px] mb-0.5">{settings.subTitle}</p>
            <p className="text-base text-gray-600 mb-3" style={{ color: titleStyle.color === '#ffffff' ? '#4a4a4a' : titleStyle.color }}>
              {settings.mainTitle}
            </p>
            <div className="w-8 h-px bg-[#d4a574] mb-3" />
            <p className="text-sm text-gray-600">{settings.dateText}</p>
            {settings.venueText && <p className="text-xs text-gray-500 mt-1">{settings.venueText}</p>}
          </div>

          {/* 봉투 앞면 */}
          <div
            className="absolute inset-x-0 top-0 bottom-0 bg-[#f5f0e8] shadow-sm"
            style={{
              zIndex: 3,
              clipPath: 'polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)',
            }}
          />

          {/* 봉투 뚜껑 */}
          <div
            className="absolute top-0 left-0 right-0 h-[104px] bg-[#f5f0e8] shadow-sm origin-top"
            style={{
              zIndex: 4,
              clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              transformStyle: 'preserve-3d',
              animation: 'introFlapOpen 1s ease-in-out 0.6s forwards',
            }}
          >
            <div
              className="absolute inset-0 bg-[#ebe6de]"
              style={{ clipPath: 'polygon(5% 5%, 50% 90%, 95% 5%)' }}
            />
          </div>

          {/* 씰 스티커 */}
          <div
            className="absolute top-[60px] left-1/2 -translate-x-1/2 w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-md"
            style={{
              zIndex: 5,
              animation: 'introSealBreak 0.5s ease-out 0.2s forwards',
            }}
          >
            <span className="text-white text-lg">♥</span>
          </div>
        </div>
      </div>

      {/* 최종 카드 (봉투 사라진 후) */}
      <div
        className="absolute w-[280px] h-[360px] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center p-6 text-center"
        style={{
          opacity: 0,
          zIndex: 10,
          animation: 'introCardExpand 1s ease-out 4s forwards',
        }}
      >
        <p className="text-[11px] text-gray-400 tracking-[4px] mb-1">{settings.subTitle}</p>
        <p className="text-2xl text-gray-600 mb-4" style={{ color: titleStyle.color === '#ffffff' ? '#4a4a4a' : titleStyle.color }}>
          {settings.mainTitle}
        </p>
        <div className="w-12 h-px bg-[#d4a574] mb-4" />
        <p className="text-lg text-gray-600">{settings.dateText}</p>
        {settings.venueText && <p className="text-xs text-gray-400 mt-4">{settings.venueText}</p>}
      </div>
      <ScrollIndicator color="gray" />
    </div>
  )
}

// 꽃잎 인트로
function PetalIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff5f5]/70 to-[#ffe4e6]/80" />
      <FallingPetals count={25} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-wave-text" style={{ color: '#f472b6' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl font-serif intro-rotate-in" style={{ ...titleStyle, color: '#374151' }}>
          {settings.mainTitle}
        </p>
        <div className="w-20 h-px bg-pink-300 mx-auto my-6 intro-split-reveal" style={{ animationDelay: '0.8s' }} />
        {settings.dateText && (
          <p className="text-xs text-gray-400 intro-rotate-in-delay" style={{ animationDelay: '1.2s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator color="pink" />
    </div>
  )
}

// 수채화 인트로
function WatercolorIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0 bg-white/60" />
      {/* 수채화 배경 */}
      <div className="intro-watercolor-spread absolute inset-0">
        <div
          className="intro-watercolor-blob absolute inset-[-20%] opacity-30"
          style={{ background: 'radial-gradient(ellipse at 30% 30%, #e0f2fe, #bae6fd, #7dd3fc, transparent 70%)' }}
        />
        <div
          className="intro-watercolor-blob absolute inset-[-10%] opacity-40"
          style={{ background: 'radial-gradient(ellipse at 70% 60%, #fce7f3, #fbcfe8, #f9a8d4, transparent 60%)', animationDelay: '1s' }}
        />
        <div
          className="intro-watercolor-blob absolute inset-[-15%] opacity-30"
          style={{ background: 'radial-gradient(ellipse at 50% 80%, #fef3c7, #fde68a, transparent 50%)', animationDelay: '2s' }}
        />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 gap-3">
        {settings.subTitle && (
          <p
            className="text-xs text-cyan-600/70 tracking-[6px] intro-text-spread"
            style={{ animationDelay: '1.5s' }}
          >
            {settings.subTitle}
          </p>
        )}
        <div
          className="font-serif text-gray-700 intro-text-spread"
          style={{ animationDelay: '2s' }}
        >
          <p className="text-2xl">{settings.mainTitle}</p>
        </div>
        <div
          className="w-16 h-px bg-cyan-400/50 intro-text-spread"
          style={{ animationDelay: '2.4s' }}
        />
        {settings.dateText && (
          <p
            className="text-gray-500 text-sm intro-text-spread"
            style={{ animationDelay: '2.7s' }}
          >
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator color="sky" />
    </div>
  )
}

// 빛의 커튼 인트로
function LightrayIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <BokehParticles count={20} color="gold" />
      <LightRays count={12} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p
            className="text-xs tracking-[6px] mb-4 intro-slide-in-left"
            style={{ color: 'rgba(253,230,138,0.6)', animationDelay: '0.5s' }}
          >
            {settings.subTitle}
          </p>
        )}
        <p
          className="text-2xl font-serif intro-glow-in"
          style={{ ...titleStyle, animationDelay: '1s' }}
        >
          {settings.mainTitle}
        </p>
        <div
          className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto my-6 intro-split-reveal"
          style={{ animationDelay: '1.8s' }}
        />
        {settings.dateText && (
          <p
            className="text-sm intro-slide-in-right"
            style={{ color: 'rgba(255,255,255,0.6)', animationDelay: '2.2s' }}
          >
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator color="amber" />
    </div>
  )
}

// 필름 인트로
function FilmIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      {/* 배경 이미지 - 세피아 + 그레인 */}
      <div
        className="absolute inset-0 bg-cover bg-center intro-sepia-filter intro-film-grain"
        style={backgroundStyle}
      />

      {/* 필름 효과 오버레이 */}
      <div className="absolute inset-0 intro-film-overlay opacity-50" />
      <div className="absolute inset-0 intro-film-vignette" />
      <div className="absolute inset-0 intro-film-flicker bg-black/10" />

      {/* 필름 스크래치 */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='200' y2='200' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 100px',
      }} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p
            className="text-xs tracking-[6px] mb-4 intro-blur-to-sharp"
            style={{ color: 'rgba(254,243,199,0.8)', fontFamily: 'serif' }}
          >
            {settings.subTitle}
          </p>
        )}
        <p
          className="text-2xl font-serif intro-blur-to-sharp"
          style={{ ...titleStyle, color: '#fef3c7', animationDelay: '1s' }}
        >
          {settings.mainTitle}
        </p>
        <div className="w-16 h-px bg-amber-200/50 mx-auto my-6 intro-split-reveal" style={{ animationDelay: '2s' }} />
        {settings.dateText && (
          <p
            className="text-sm intro-blur-to-sharp"
            style={{ color: 'rgba(254,243,199,0.6)', animationDelay: '2.5s' }}
          >
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator color="amber" />
    </div>
  )
}

// 물결 반사 인트로
function RippleIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden flex flex-col">
      {/* 상단: 원본 이미지 */}
      <div className="relative h-1/2">
        <div
          className="absolute inset-0 bg-cover bg-bottom"
          style={backgroundStyle}
        />
      </div>

      {/* 하단: 반사 이미지 (뒤집힘 + 물결) */}
      <div className="relative h-1/2 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{
            ...backgroundStyle,
            transform: 'scaleY(-1)',
            opacity: 0.6,
          }}
        />
        {/* 물결 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 to-sky-950/50" />

        {/* 물결 라인들 */}
        {[20, 35, 50, 65, 80].map((top, i) => (
          <div
            key={i}
            className="intro-water-ripple-line"
            style={{
              top: `${top}%`,
              animation: `introWaterDistort${i % 2 === 0 ? '' : '2'} ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}

        <div className="intro-water-shine" />
        <div className="intro-water-glow" />
      </div>

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
        <div className="bg-black/30 backdrop-blur-sm px-8 py-6 rounded-lg">
          {settings.subTitle && (
            <p className="text-[10px] text-sky-200/80 tracking-[4px] mb-3 intro-wave-text">
              {settings.subTitle}
            </p>
          )}
          <p className="text-lg font-serif text-white mb-2 intro-wave-text-delay" style={titleStyle}>
            {settings.mainTitle}
          </p>
          <div className="w-12 h-px bg-sky-200/50 mx-auto my-3 intro-split-reveal" style={{ animationDelay: '1s' }} />
          {settings.dateText && (
            <p
              className="text-sky-100/70 text-xs intro-wave-text"
              style={{ animationDelay: '1.4s', opacity: 0 }}
            >
              {settings.dateText}
            </p>
          )}
        </div>
      </div>
      <ScrollIndicator color="sky" />
    </div>
  )
}

// 골드 인트로
function GoldIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0 bg-black/60" />
      <GoldParticles count={60} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p
            className="text-xs tracking-[6px] mb-4 intro-scale-up"
            style={{ color: 'rgba(251,191,36,0.6)', animationDelay: '1.5s' }}
          >
            {settings.subTitle}
          </p>
        )}
        <p
          className="text-2xl font-serif intro-glow-in"
          style={{ ...titleStyle, color: '#fef3c7', animationDelay: '2s' }}
        >
          {settings.mainTitle}
        </p>
        <div
          className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto my-6 intro-split-reveal"
          style={{ animationDelay: '2.5s' }}
        />
        {settings.dateText && (
          <p
            className="text-sm intro-scale-up"
            style={{ color: 'rgba(253,230,138,0.6)', animationDelay: '2.9s' }}
          >
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p
            className="text-xs mt-2 intro-scale-up"
            style={{ color: 'rgba(253,230,138,0.4)', animationDelay: '3.2s' }}
          >
            {settings.venueText}
          </p>
        )}
      </div>
      <ScrollIndicator color="amber" />
    </div>
  )
}

// 포커스 인트로
function FocusIntro({ settings, backgroundStyle, overlayStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      {/* 배경 (아웃포커스) */}
      <div className="absolute inset-0" style={{ ...backgroundStyle, filter: 'blur(15px)' }} />

      {/* 전경 (인포커스) */}
      <div className="absolute inset-0 intro-focus-pull" style={backgroundStyle} />

      <div className="absolute inset-0" style={overlayStyle} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[6px] mb-4 intro-letter-spread" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-depth-shift" style={{ ...titleStyle, animationDelay: '0.8s' }}>
          {settings.mainTitle}
        </p>
        <div className="w-16 h-px bg-white/50 my-6 intro-split-reveal" style={{ animationDelay: '1.4s' }} />
        {settings.dateText && (
          <p className="text-sm intro-slide-in-right-delay" style={{ color: 'rgba(255,255,255,0.6)', animationDelay: '1.8s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
      <ScrollIndicator />
    </div>
  )
}
