'use client'

import { useState, useEffect, useRef } from 'react'
import { IntroSettings, IntroImageSettings, presetAccentColors, presetCustomColors } from '@/lib/introPresets'
import { ImageSettings } from '@/store/editorStore'

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface IntroAnimationProps {
  settings: IntroSettings
  coverImage?: string
  coverImageSettings?: Partial<ImageSettings>
  groomName: string
  brideName: string
  weddingDate?: string
  venueName?: string
  onComplete: () => void
  isComplete: boolean
}

// 보케(빛 입자) 컴포넌트
function BokehParticles({ count = 12, color = 'white' }: { count?: number; color?: 'warm' | 'gold' | 'white' }) {
  const colors = {
    warm: 'rgba(255, 215, 180, 0.25)',
    gold: 'rgba(255, 215, 0, 0.3)',
    white: 'rgba(255, 255, 255, 0.3)',
  }
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 25 + 8,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 12,
    opacity: Math.random() * 0.25 + 0.05,
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
function FallingPetals({ count = 8 }: { count?: number }) {
  const petals = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 10 + (i * 80) / count + Math.random() * 10,
    delay: Math.random() * 3,
    duration: Math.random() * 5 + 12,
    size: Math.random() * 10 + 18,
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

// 빛 광선 컴포넌트
function LightRays({ count = 6 }: { count?: number }) {
  const rays = Array.from({ length: count }, (_, i) => ({
    id: i,
    rotation: (360 / count) * i,
    delay: i * 0.15,
    width: 1 + Math.random() * 1,
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


export default function IntroAnimation({
  settings,
  coverImage,
  coverImageSettings,
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

  // 인트로 전용 이미지 결정: introImage 우선, 없으면 coverImage 폴백
  const effectiveImage = settings.introImage || coverImage
  const effectiveImageSettings = settings.introImage
    ? settings.introImageSettings
    : coverImageSettings

  // imageMode에 따른 배경 분기
  const imageMode = settings.imageMode ?? 'photo'

  // 크롭 설정을 반영한 배경 스타일 계산
  const cropX = effectiveImageSettings?.cropX ?? 0
  const cropY = effectiveImageSettings?.cropY ?? 0
  const cropWidth = effectiveImageSettings?.cropWidth ?? 1
  const cropHeight = effectiveImageSettings?.cropHeight ?? 1
  const hasCrop = cropWidth < 1 || cropHeight < 1

  // 이미지 위치 설정 (크롭이 없을 때도 positionX/Y 사용)
  const imgScale = effectiveImageSettings?.scale ?? 1
  const imgPositionX = effectiveImageSettings?.positionX ?? 0
  const imgPositionY = effectiveImageSettings?.positionY ?? 0

  // 크롭 영역을 container에 맞게 확대 (비율 유지를 위해 단일 스케일 사용)
  const scaleX = 100 / cropWidth
  const scaleY = 100 / cropHeight
  // cover 효과를 위해 더 큰 스케일 사용 (비율 유지)
  const baseScale = Math.max(scaleX, scaleY)

  // 사용자 정의 스케일: 크롭이 있으면 크롭 스케일만 사용 (getImageCropStyle과 동일)
  const userScale = settings.backgroundScale || 100
  const finalScale = hasCrop ? baseScale : baseScale * (userScale / 100)

  // 위치 계산: 크롭이 있으면 크롭 시작점 기준, 없으면 coverImageSettings의 position 사용
  const positionX = hasCrop ? (cropX / (1 - cropWidth)) * 100 : 50
  const positionY = hasCrop ? (cropY / (1 - cropHeight)) * 100 : 50

  // 배경 스타일 계산 (imageMode에 따라 분기)
  const computeBackgroundStyle = (): React.CSSProperties => {
    if (imageMode === 'solid') {
      return {
        background: settings.solidColor || '#F8F6F3',
        filter: `brightness(${(settings.backgroundBrightness || 100) / 100})`,
      }
    }
    if (imageMode === 'gradient') {
      const angle = settings.gradientAngle ?? 135
      return {
        background: `linear-gradient(${angle}deg, ${settings.gradientFrom || '#F8F6F3'} 0%, ${settings.gradientTo || '#e8e0d4'} 100%)`,
        filter: `brightness(${(settings.backgroundBrightness || 100) / 100})`,
      }
    }
    // imageMode === 'photo'
    if (hasCrop) {
      return {
        backgroundImage: effectiveImage ? `url(${effectiveImage})` : 'linear-gradient(135deg, #333 0%, #111 100%)',
        backgroundSize: `${finalScale}%`,
        backgroundPosition: `${Math.min(Math.max(positionX, 0), 100)}% ${Math.min(Math.max(positionY, 0), 100)}%`,
        backgroundRepeat: 'no-repeat' as const,
        filter: `brightness(${(settings.backgroundBrightness || 100) / 100})`,
      }
    }
    return {
      backgroundImage: effectiveImage ? `url(${effectiveImage})` : 'linear-gradient(135deg, #333 0%, #111 100%)',
      backgroundSize: imgScale > 1 ? `${imgScale * 100}%` : 'cover',
      backgroundPosition: `${50 - imgPositionX}% ${50 - imgPositionY}%`,
      backgroundRepeat: 'no-repeat' as const,
      filter: `brightness(${(settings.backgroundBrightness || 100) / 100})`,
    }
  }

  const backgroundStyle = computeBackgroundStyle()

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${(settings.overlayOpacity ?? 30) / 100})`,
  }

  const titleStyle = {
    fontSize: `${settings.titleFontSize || 24}px`,
    letterSpacing: `${settings.titleLetterSpacing || 3}px`,
    color: settings.titleColor || '#ffffff',
    fontFamily: settings.titleFontFamily || "'Gowun Batang', serif",
  }

  const subTitleStyle = {
    color: settings.subTitleColor || 'rgba(255,255,255,0.8)',
  }

  // 기본값 설정
  const mainTitle = settings.mainTitle || `${groomName} & ${brideName}`
  const subTitle = settings.subTitle || 'WEDDING INVITATION'
  const dateText = settings.dateText || (weddingDate ? formatDate(weddingDate) : '')
  const venueText = settings.venueText || venueName || ''

  // accentColor: 사용자 설정 우선, 없으면 프리셋 기본값
  const accentColor = settings.accentColor || presetAccentColors[settings.presetId] || '#d4a574'
  const overlayColor = settings.overlayColor || presetCustomColors[settings.presetId]?.overlayColor || '#000000'
  const bodyTextColor = settings.bodyTextColor || presetCustomColors[settings.presetId]?.bodyTextColor || '#2c2c2c'
  const bgColor = settings.bgColor || presetCustomColors[settings.presetId]?.bgColor || '#F8F6F3'
  const waveColor = settings.waveColor || presetCustomColors[settings.presetId]?.waveColor || '#FAF8F5'
  const envelopeColor = settings.envelopeColor || presetCustomColors[settings.presetId]?.envelopeColor || '#f5f0e8'

  // 프리셋별 렌더링
  const renderIntro = () => {
    const commonProps = { settings: { ...settings, mainTitle, subTitle, dateText, venueText }, backgroundStyle, overlayStyle, titleStyle, subTitleStyle, accentColor, overlayColor, bodyTextColor, bgColor, waveColor, envelopeColor }

    switch (settings.presetId) {
      case 'cinematic':
        return <CinematicIntro {...commonProps} />
      case 'typing':
        return <TypingIntro {...commonProps} />
      case 'blur':
        return <BlurIntro {...commonProps} />
      case 'zoom':
        return <ZoomIntro {...commonProps} />
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
      case 'filmstrip':
        return <FilmstripIntro {...commonProps} />
      default:
        return <CinematicIntro {...commonProps} />
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
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
          0% { opacity: 0; }
          100% { opacity: 1; }
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


        /* ========== 보케 파티클 ========== */
        @keyframes introBokehFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          50% { transform: translateY(-30px) translateX(20px); opacity: 0.8; }
          90% { opacity: 0.4; }
        }
        @keyframes introBokehPulse {
          0%, 100% { transform: scale(1); box-shadow: none; }
          50% { transform: scale(1.1); box-shadow: none; }
        }
        .intro-bokeh-particle {
          filter: blur(4px);
          animation: introBokehFloat 18s ease-in-out infinite, introBokehPulse 5s ease-in-out infinite;
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
          background: rgba(180, 160, 150, 0.12);
          border-radius: 50% 0 50% 50%;
          animation: introPetalFall linear infinite;
          opacity: 0.2;
          will-change: transform;
          backface-visibility: hidden;
        }


        /* ========== 빛 광선 ========== */
        @keyframes introRayExpand {
          0% { opacity: 0; transform: rotate(var(--rotation)) scaleY(0); }
          30% { opacity: 0.1; }
          70% { opacity: 0.2; }
          100% { opacity: 0.15; transform: rotate(var(--rotation)) scaleY(1); }
        }
        @keyframes introRayPulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        .intro-light-ray {
          background: linear-gradient(to bottom, transparent, rgba(255, 248, 220, 0.3), transparent);
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
          50% { transform: scale(1.01) translateZ(0); }
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

        /* ========== 폴라로이드 드롭 ========== */
        @keyframes introPolaroidDrop {
          0% { opacity: 0; transform: rotate(3deg) translateY(-60px) scale(0.92); }
          60% { opacity: 1; transform: rotate(-3deg) translateY(8px) scale(1.01); }
          80% { transform: rotate(-1.5deg) translateY(-3px) scale(1); }
          100% { opacity: 1; transform: rotate(-2deg) translateY(0) scale(1); }
        }
        .intro-polaroid-drop { animation: introPolaroidDrop 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }

        /* ========== 필름 슬라이드 인 ========== */
        @keyframes introFilmSlideIn {
          0% { opacity: 0; transform: translateX(-100%); }
          60% { opacity: 1; transform: translateX(4%); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .intro-film-slide-in { animation: introFilmSlideIn 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }

        /* ========== 시네마 리빌 (좌→우 클립) ========== */
        @keyframes introCinemaReveal {
          0% { clip-path: inset(0 100% 0 0); opacity: 0; }
          15% { opacity: 1; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }
        .intro-cinema-reveal { animation: introCinemaReveal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; opacity: 0; }

        /* ========== 줌 어프로치 (사진이 다가오는 느낌) ========== */
        @keyframes introZoomApproach {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        .intro-zoom-approach { animation: introZoomApproach 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

        /* ========== 물결 흘러가기 ========== */
        @keyframes introWaveDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .intro-wave-drift { animation: introWaveDrift 6s linear infinite; }

        /* ========== 대각선 리빌 ========== */
        @keyframes introDiagonalReveal {
          0% { clip-path: polygon(0 0, 0 0, 0 0, 0 0); opacity: 0; }
          100% { clip-path: polygon(0 0, 100% 0, 100% 50%, 0 68%); opacity: 1; }
        }
        .intro-diagonal-reveal { animation: introDiagonalReveal 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; opacity: 0; }
      `}</style>

      {/* 9:16 고정 비율 컨테이너 — 모든 기기에서 동일한 사진 비율 유지 */}
      <div
        className="relative overflow-hidden"
        style={{
          width: 'min(100%, calc(100vh * 9 / 16))',
          height: 'min(100%, calc(100vw * 16 / 9))',
        }}
      >
        {renderIntro()}
      </div>

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

// 날짜 포맷 헬퍼 (영어식: May 24, 2025)
function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

// 공통 Props 타입
interface IntroComponentProps {
  settings: IntroSettings & { mainTitle: string; subTitle: string; dateText: string; venueText: string }
  backgroundStyle: React.CSSProperties
  overlayStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  subTitleStyle: React.CSSProperties
  accentColor: string
  overlayColor: string
  bodyTextColor: string
  bgColor: string
  waveColor: string
  envelopeColor: string
}

// 시네마틱 인트로
function CinematicIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle, accentColor, overlayColor }: IntroComponentProps) {
  const customOverlayStyle = {
    backgroundColor: hexToRgba(overlayColor, (settings.overlayOpacity ?? 30) / 100)
  }
  // 서브텍스트 색상을 accentColor에서 파생 (80% 불투명도)
  const cinematicSubStyle = { ...subTitleStyle, color: hexToRgba(accentColor, 0.8) }
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 intro-fade-in intro-zoom-out" style={backgroundStyle} />
      <div className="absolute inset-0" style={customOverlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <div className="intro-line-expand h-px mb-5" style={{ backgroundColor: `${accentColor}80` }} />
        <p className="intro-letter-spread uppercase text-center break-words max-w-full" style={titleStyle}>
          {settings.mainTitle}
        </p>
        {settings.dateText && (
          <p className="text-[12px] mt-3.5 intro-fade-in-delay" style={{ ...cinematicSubStyle, letterSpacing: '2px' }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 타이핑 인트로 (상하 분할 레이아웃)
function TypingIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle, accentColor, bodyTextColor, waveColor }: IntroComponentProps) {
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

  // Subtitle and date/venue colors derived from accentColor
  const typingSubColor = hexToRgba(accentColor, 0.6)
  const typingDateColor = hexToRgba(accentColor, 0.5)
  const typingVenueColor = hexToRgba(accentColor, 0.4)

  return (
    <div className="relative h-full flex flex-col">
      {/* 상단: 사진 영역 55% */}
      <div className="relative" style={{ height: '55%' }}>
        <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
        <div className="absolute inset-0" style={overlayStyle} />
        {/* 물결 경계 (2레이어) */}
        <div className="absolute bottom-[8px] left-0 right-0 z-10">
          <svg className="w-[200%] intro-wave-drift" viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ height: 22, display: 'block', animationDuration: '8s' }}>
            <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z" fill={hexToRgba(waveColor, 0.45)} />
          </svg>
        </div>
        <div className="absolute bottom-[-1px] left-0 right-0 z-10">
          <svg className="w-[200%] intro-wave-drift" viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ height: 28, display: 'block' }}>
            <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z" fill={waveColor} />
          </svg>
        </div>
      </div>

      {/* 하단: 텍스트 영역 45% */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6" style={{ backgroundColor: waveColor }}>
        {settings.subTitle && (
          <p className="text-[10px] tracking-[4px] mb-5 intro-slide-up" style={{ color: typingSubColor }}>
            {settings.subTitle}
          </p>
        )}
        <p className="mb-2" style={titleStyle}>
          {displayText}
          {!completed && <span className="intro-typing-cursor">|</span>}
        </p>
        <div className="w-16 h-px my-5 intro-split-reveal" style={{ backgroundColor: `${accentColor}66`, animationDelay: '2.8s' }} />
        {settings.dateText && (
          <p className="text-xs intro-fade-in-up" style={{ color: typingDateColor, animationDelay: '3.2s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p className="text-[11px] mt-1.5 intro-fade-in-up" style={{ color: typingVenueColor, animationDelay: '3.5s', opacity: 0 }}>
            {settings.venueText}
          </p>
        )}
      </div>
    </div>
  )
}

// 블러 인트로
function BlurIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle, accentColor, overlayColor }: IntroComponentProps) {
  const customOverlayStyle = {
    backgroundColor: hexToRgba(overlayColor, (settings.overlayOpacity ?? 30) / 100)
  }
  const blurSubColor = hexToRgba(accentColor, 0.7)
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-blur-to-sharp" style={backgroundStyle} />
      <div className="absolute inset-0" style={customOverlayStyle} />
      <BokehParticles count={10} color="white" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[4px] sm:tracking-[8px] mb-4 intro-fade-in-up" style={{ color: blurSubColor, animationDelay: '1.5s', animationDuration: '1.5s', opacity: 0 }}>
            {settings.subTitle}
          </p>
        )}
        <p className="intro-fade-in-up" style={{ ...titleStyle, animationDelay: '2s', animationDuration: '1.5s', opacity: 0 }}>
          {settings.mainTitle}
        </p>
        <div className="w-16 h-px my-6 intro-split-reveal" style={{ backgroundColor: `${accentColor}80`, animationDelay: '2.5s' }} />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-up" style={{ color: blurSubColor, animationDelay: '2.8s', animationDuration: '1.5s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 줌 인트로 (중앙 확대 레이아웃)
function ZoomIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle, accentColor, bodyTextColor }: IntroComponentProps) {
  const zoomSubColor = hexToRgba(accentColor, 0.6)
  const zoomDateColor = hexToRgba(accentColor, 0.5)
  const zoomVenueColor = hexToRgba(accentColor, 0.4)

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden bg-[#F7F5F2]">
      {/* 서브타이틀 (사진 위) */}
      {settings.subTitle && (
        <p className="text-[10px] tracking-[4px] mb-6 intro-fade-in-up relative z-10" style={{ color: zoomSubColor, opacity: 0, animationDelay: '0.5s' }}>
          {settings.subTitle}
        </p>
      )}

      {/* 중앙 사진 프레임 (고정) - 안의 사진이 다가옴 */}
      <div
        className="relative overflow-hidden intro-fade-in z-10"
        style={{
          width: '70%',
          maxWidth: 280,
          aspectRatio: '3 / 4',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        <div className="absolute inset-0 intro-zoom-approach" style={backgroundStyle} />
        <div className="absolute inset-0" style={overlayStyle} />
      </div>

      {/* 메인타이틀 (사진 아래) */}
      <p className="mt-6 intro-fade-in-up relative z-10" style={{ ...titleStyle, opacity: 0, animationDelay: '1.5s' }}>
        {settings.mainTitle}
      </p>
      <div className="w-16 h-px my-4 intro-split-reveal relative z-10" style={{ backgroundColor: `${accentColor}66`, animationDelay: '2s', opacity: 0 }} />
      {settings.dateText && (
        <p className="text-xs intro-fade-in-up relative z-10" style={{ color: zoomDateColor, opacity: 0, animationDelay: '2.3s' }}>
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p className="text-[11px] mt-1.5 intro-fade-in-up relative z-10" style={{ color: zoomVenueColor, opacity: 0, animationDelay: '2.6s' }}>
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

// 편지 인트로 (봉투 열림 애니메이션)
function LetterIntro({ settings, backgroundStyle, titleStyle, subTitleStyle, accentColor, overlayColor, envelopeColor }: IntroComponentProps) {
  // 편지 카드 내부는 밝은 배경이므로 흰색 텍스트면 어두운 색으로 변환
  const cardTitleColor = titleStyle.color === '#ffffff' ? '#4a4a4a' : titleStyle.color
  const letterSubColor = hexToRgba(accentColor, 0.7)

  // 봉투 내부 플랩 색상 (envelopeColor보다 약간 어둡게)
  const innerFlapColor = (() => {
    const r = parseInt(envelopeColor.slice(1, 3), 16)
    const g = parseInt(envelopeColor.slice(3, 5), 16)
    const b = parseInt(envelopeColor.slice(5, 7), 16)
    const darken = (val: number) => Math.max(0, val - 15)
    return `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`
  })()

  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
      {/* 흑백 웨딩사진 배경 */}
      <div className="absolute inset-0" style={{ ...backgroundStyle, filter: `${backgroundStyle.filter} grayscale(100%)` }} />

      {/* 배경 어둡게 - overlayColor 사용 */}
      <div className="absolute inset-0" style={{ backgroundColor: hexToRgba(overlayColor, (settings.overlayOpacity ?? 40) / 100) }} />

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
          <div className="absolute inset-0 shadow-lg" style={{ zIndex: 1, backgroundColor: envelopeColor }} />

          {/* 카드 */}
          <div
            className="absolute left-[15px] right-[15px] h-[180px] bg-[#F8F6F3] rounded-md shadow-xl flex flex-col items-center justify-center p-4 text-center"
            style={{
              zIndex: 2,
              top: '80px',
              animation: 'introCardSlideOut 1.2s ease-out 1.5s forwards',
            }}
          >
            <p className="text-[8px] tracking-[2px] mb-0.5" style={{ color: letterSubColor }}>{settings.subTitle}</p>
            <p className="mb-3" style={{ ...titleStyle, color: cardTitleColor, fontSize: `${Math.min(parseInt(titleStyle.fontSize as string) || 24, 20)}px` }}>
              {settings.mainTitle}
            </p>
            <div className="w-8 h-px mb-3" style={{ backgroundColor: accentColor }} />
            <p className="text-sm" style={{ color: letterSubColor }}>{settings.dateText}</p>
            {settings.venueText && <p className="text-xs mt-1" style={{ color: hexToRgba(accentColor, 0.5) }}>{settings.venueText}</p>}
          </div>

          {/* 봉투 앞면 */}
          <div
            className="absolute inset-x-0 top-0 bottom-0 shadow-sm"
            style={{
              zIndex: 3,
              clipPath: 'polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)',
              backgroundColor: envelopeColor,
            }}
          />

          {/* 봉투 뚜껑 */}
          <div
            className="absolute top-0 left-0 right-0 h-[104px] shadow-sm origin-top"
            style={{
              zIndex: 4,
              clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              transformStyle: 'preserve-3d',
              animation: 'introFlapOpen 1s ease-in-out 0.6s forwards',
              backgroundColor: envelopeColor,
            }}
          >
            <div
              className="absolute inset-0"
              style={{ clipPath: 'polygon(5% 5%, 50% 90%, 95% 5%)', backgroundColor: innerFlapColor }}
            />
          </div>

          {/* 씰 스티커 */}
          <div
            className="absolute top-[60px] left-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center shadow-md"
            style={{
              backgroundColor: accentColor,
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
        className="absolute w-[280px] h-[360px] bg-[#F8F6F3] rounded-lg shadow-2xl flex flex-col items-center justify-center p-6 text-center"
        style={{
          opacity: 0,
          zIndex: 10,
          animation: 'introCardExpand 1s ease-out 4s forwards',
        }}
      >
        <p className="text-[11px] tracking-[4px] mb-1" style={{ color: letterSubColor }}>{settings.subTitle}</p>
        <p className="mb-4" style={{ ...titleStyle, color: cardTitleColor }}>
          {settings.mainTitle}
        </p>
        <div className="w-12 h-px mb-4" style={{ backgroundColor: accentColor }} />
        <p className="text-lg" style={{ color: letterSubColor }}>{settings.dateText}</p>
        {settings.venueText && <p className="text-xs mt-4" style={{ color: hexToRgba(accentColor, 0.5) }}>{settings.venueText}</p>}
      </div>
    </div>
  )
}

// 꽃잎 인트로 (원형 윈도우 레이아웃)
function PetalIntro({ settings, backgroundStyle, titleStyle, subTitleStyle, accentColor, bodyTextColor, bgColor }: IntroComponentProps) {
  const petalSubColor = hexToRgba(accentColor, 0.8)
  const petalVenueColor = hexToRgba(accentColor, 0.5)

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* 꽃잎: 전체 영역에 걸쳐 떨어짐 */}
      <FallingPetals count={10} />

      {/* 서브타이틀 (원 위) */}
      {settings.subTitle && (
        <p className="text-[10px] tracking-[4px] mb-6 intro-fade-in-up relative z-10" style={{ color: petalSubColor, opacity: 0, animationDelay: '0.3s' }}>
          {settings.subTitle}
        </p>
      )}

      {/* 원형 사진 윈도우 */}
      <div className="relative w-[190px] h-[190px] rounded-full overflow-hidden intro-scale-up z-10" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="absolute inset-0" style={backgroundStyle} />
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(settings.overlayOpacity ?? 10) / 100})` }} />
      </div>

      {/* 메인타이틀 (원 아래) */}
      <p className="mt-6 intro-fade-in-up relative z-10" style={{ ...titleStyle, opacity: 0, animationDelay: '0.6s' }}>
        {settings.mainTitle}
      </p>
      <div className="w-16 h-px my-4 intro-split-reveal relative z-10" style={{ backgroundColor: `${accentColor}66`, animationDelay: '1s', opacity: 0 }} />
      {settings.dateText && (
        <p className="text-xs intro-fade-in-up relative z-10" style={{ color: petalSubColor, opacity: 0, animationDelay: '1.3s' }}>
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p className="text-[11px] mt-1.5 intro-fade-in-up relative z-10" style={{ color: petalVenueColor, opacity: 0, animationDelay: '1.6s' }}>
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

// 수채화 인트로 (아치 윈도우 레이아웃)
function WatercolorIntro({ settings, backgroundStyle, titleStyle, subTitleStyle, accentColor, bodyTextColor }: IntroComponentProps) {
  const watercolorSubColor = hexToRgba(accentColor, 0.7)
  const watercolorVenueColor = hexToRgba(accentColor, 0.5)

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden bg-[#F8F6F3]">
      {/* 수채화 블롭 배경 (은은하게) */}
      <div className="intro-watercolor-spread absolute inset-0">
        <div
          className="intro-watercolor-blob absolute inset-[-20%] opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse at 30% 70%, #e0f2fe, #dbeafe, transparent 70%)' }}
        />
      </div>

      {/* 아치 윈도우 */}
      <div
        className="relative overflow-hidden intro-fade-in z-10"
        style={{
          width: 210,
          height: 280,
          borderRadius: '105px 105px 4px 4px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        <div className="absolute inset-0" style={backgroundStyle} />
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(settings.overlayOpacity ?? 10) / 100})` }} />
      </div>

      {/* 텍스트 영역 (아치 아래) */}
      <div
        className="intro-text-spread mt-7 relative z-10"
        style={{ opacity: 0, animationDelay: '1.2s' }}
      >
        <p className="text-center" style={titleStyle}>{settings.mainTitle}</p>
      </div>
      <div
        className="w-14 h-px my-4 intro-text-spread relative z-10"
        style={{ backgroundColor: `${accentColor}66`, opacity: 0, animationDelay: '1.6s' }}
      />
      {settings.subTitle && (
        <p
          className="text-[10px] tracking-[4px] intro-text-spread relative z-10"
          style={{ color: watercolorSubColor, opacity: 0, animationDelay: '2s' }}
        >
          {settings.subTitle}
        </p>
      )}
      {settings.dateText && (
        <p
          className="text-xs mt-4 intro-text-spread relative z-10"
          style={{ color: watercolorSubColor, opacity: 0, animationDelay: '2.3s' }}
        >
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p
          className="text-[11px] mt-1.5 intro-text-spread relative z-10"
          style={{ color: watercolorVenueColor, opacity: 0, animationDelay: '2.6s' }}
        >
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

// 빛의 커튼 인트로 (대각 분할 레이아웃)
function LightrayIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle, accentColor, bodyTextColor }: IntroComponentProps) {
  const lightraySubColor = hexToRgba(accentColor, 0.8)
  const lightrayDateColor = hexToRgba(accentColor, 0.7)
  const lightrayVenueColor = hexToRgba(accentColor, 0.5)

  return (
    <div className="relative h-full overflow-hidden bg-[#F8F6F3]">
      {/* 대각선으로 잘린 사진 영역 */}
      <div
        className="absolute inset-0 intro-diagonal-reveal"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 68%)' }}
      >
        <div className="absolute inset-0 intro-slow-zoom" style={backgroundStyle} />
        <div className="absolute inset-0" style={overlayStyle} />
      </div>

      {/* 하단 텍스트 영역 (좌측 정렬) */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start px-8 pb-16 z-20">
        {settings.subTitle && (
          <p className="text-[10px] tracking-[4px] mb-4 intro-slide-in-left" style={{ color: lightraySubColor, opacity: 0, animationDelay: '0.8s' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="intro-fade-in-up" style={{ ...titleStyle, opacity: 0, animationDelay: '1.2s' }}>
          {settings.mainTitle}
        </p>
        <div className="w-16 h-px my-4 intro-line-expand" style={{ backgroundColor: `${accentColor}4D`, animationDelay: '1.8s' }} />
        {settings.dateText && (
          <p className="text-xs intro-fade-in-up" style={{ color: lightrayDateColor, opacity: 0, animationDelay: '2.2s' }}>
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p className="text-[11px] mt-1.5 intro-fade-in-up" style={{ color: lightrayVenueColor, opacity: 0, animationDelay: '2.5s' }}>
            {settings.venueText}
          </p>
        )}
      </div>
    </div>
  )
}

// 필름 인트로 (폴라로이드 레이아웃)
function FilmIntro({ settings, backgroundStyle, titleStyle, subTitleStyle, accentColor, bodyTextColor, bgColor }: IntroComponentProps) {
  const filmSubColor = hexToRgba(accentColor, 0.7)
  const filmVenueColor = hexToRgba(accentColor, 0.5)

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* 미세한 노이즈 텍스처 */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* 폴라로이드 카드 */}
      <div
        className="relative bg-[#F8F6F3] p-[10px] pb-[42px] intro-polaroid-drop z-10"
        style={{
          width: 230,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* 사진 영역 */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
          <div className="absolute inset-0 intro-slow-zoom" style={backgroundStyle} />
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(settings.overlayOpacity ?? 5) / 100})` }} />
        </div>
        {/* 폴라로이드 하단 캡션 */}
        {settings.subTitle && (
          <p
            className="text-center mt-3 intro-fade-in-delay-2"
            style={{
              fontFamily: "'Gowun Batang', serif",
              fontSize: '11px',
              color: filmSubColor,
              letterSpacing: '1px',
            }}
          >
            {settings.subTitle}
          </p>
        )}
      </div>

      {/* 텍스트 영역 (폴라로이드 아래) */}
      <p
        className="mt-7 intro-fade-in-up relative z-10 text-center"
        style={{ ...titleStyle, opacity: 0, animationDelay: '1.2s' }}
      >
        {settings.mainTitle}
      </p>
      <div className="w-14 h-px my-4 intro-split-reveal relative z-10" style={{ backgroundColor: `${accentColor}66`, animationDelay: '1.5s', opacity: 0 }} />
      {settings.dateText && (
        <p
          className="text-xs intro-fade-in-up relative z-10"
          style={{ color: filmSubColor, opacity: 0, animationDelay: '1.8s' }}
        >
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p
          className="text-[11px] mt-1.5 intro-fade-in-up relative z-10"
          style={{ color: filmVenueColor, opacity: 0, animationDelay: '2.1s' }}
        >
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

// 필름 스트립 인트로
function FilmstripIntro({ settings, backgroundStyle, titleStyle, subTitleStyle, accentColor, bgColor }: IntroComponentProps) {
  const sprocketCount = 12
  const sprockets = Array.from({ length: sprocketCount }, (_, i) => i)

  // bgColor보다 약간 어둡게
  const filmBaseColor = (() => {
    const r = parseInt(bgColor.slice(1, 3), 16)
    const g = parseInt(bgColor.slice(3, 5), 16)
    const b = parseInt(bgColor.slice(5, 7), 16)
    const darken = (val: number) => Math.max(0, Math.floor(val * 0.85))
    return `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`
  })()

  const filmstripSubColor = hexToRgba(accentColor, 0.5)
  const filmstripVenueColor = hexToRgba(accentColor, 0.3)

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* 필름 스트립 프레임 */}
      <div
        className="relative intro-film-slide-in z-10"
        style={{ width: 280 }}
      >
        {/* 필름 상단 바 + 스프로킷 홀 */}
        <div className="relative h-[22px] flex items-center justify-between px-2" style={{ backgroundColor: filmBaseColor }}>
          {sprockets.map((i) => (
            <div key={`t${i}`} className="w-[10px] h-[7px] rounded-[1.5px]" style={{ backgroundColor: bgColor, boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }} />
          ))}
        </div>

        {/* 사진 영역 */}
        <div className="relative px-[6px]" style={{ backgroundColor: filmBaseColor }}>
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 2' }}>
            <div className="absolute inset-0 intro-slow-zoom" style={backgroundStyle} />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(settings.overlayOpacity ?? 5) / 100})` }} />
          </div>
        </div>

        {/* 필름 하단 바 + 스프로킷 홀 */}
        <div className="relative h-[22px] flex items-center justify-between px-2" style={{ backgroundColor: filmBaseColor }}>
          {sprockets.map((i) => (
            <div key={`b${i}`} className="w-[10px] h-[7px] rounded-[1.5px]" style={{ backgroundColor: bgColor, boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }} />
          ))}
        </div>

        {/* 필름 프레임 번호 */}
        <div className="absolute bottom-[26px] right-[14px] text-[8px] font-mono intro-fade-in-delay-2" style={{ color: filmstripVenueColor }}>
          15A
        </div>
      </div>

      {/* 텍스트 영역 */}
      <p
        className="mt-7 intro-cinema-reveal relative z-10 text-center"
        style={{ ...titleStyle, opacity: 0, animationDelay: '1s' }}
      >
        {settings.mainTitle}
      </p>
      <div className="w-14 h-px my-4 intro-line-expand relative z-10" style={{ backgroundColor: `${accentColor}26`, animationDelay: '1.8s', opacity: 0 }} />
      {settings.subTitle && (
        <p
          className="text-[10px] tracking-[4px] intro-slide-in-right relative z-10"
          style={{ color: filmstripSubColor, opacity: 0, animationDelay: '2.1s' }}
        >
          {settings.subTitle}
        </p>
      )}
      {settings.dateText && (
        <p
          className="text-xs mt-3 intro-fade-in-up relative z-10"
          style={{ color: filmstripSubColor, opacity: 0, animationDelay: '2.4s' }}
        >
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p
          className="text-[11px] mt-1.5 intro-fade-in-up relative z-10"
          style={{ color: filmstripVenueColor, opacity: 0, animationDelay: '2.7s' }}
        >
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

