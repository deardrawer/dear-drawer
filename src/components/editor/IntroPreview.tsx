'use client'

import { useState, useEffect, useRef } from 'react'
import { IntroSettings } from '@/lib/introPresets'
import { X } from 'lucide-react'

interface IntroPreviewProps {
  settings: IntroSettings
  coverImage?: string
  onSkip?: () => void
  autoPlay?: boolean
  // 청첩장 정보 연동 (날짜, 장소만)
  weddingDate?: string
  weddingTime?: string
  venueName?: string
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

// 날짜 포맷팅 함수 (영어식: May 24, 2025)
function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

export default function IntroPreview({
  settings,
  coverImage,
  onSkip,
  autoPlay = true,
  weddingDate,
  weddingTime,
  venueName,
}: IntroPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [key, setKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 메인 타이틀: 프리셋 기본값 유지 (사용자가 커스터마이징 탭에서 수정 가능)
  // 날짜/장소: 청첩장 값이 있으면 청첩장 우선, 없으면 프리셋 기본값 사용
  const effectiveMainTitle = settings.mainTitle
  const effectiveDateText = weddingDate ? `${formatDate(weddingDate)}${weddingTime ? ` ${weddingTime}` : ''}` : settings.dateText
  const effectiveVenueText = venueName || settings.venueText || ''

  // settings에 청첩장 정보 반영
  const effectiveSettings = {
    ...settings,
    mainTitle: effectiveMainTitle,
    dateText: effectiveDateText,
    venueText: effectiveVenueText,
  }

  // 자동 재생
  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true)
      setKey(k => k + 1)
    }
  }, [settings.presetId, autoPlay])

  // backgroundScale을 cover 기반 줌으로 계산 (100 = cover, 150 = 줌인)
  const scale = settings.backgroundScale || 100
  const backgroundStyle = {
    backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #333 0%, #111 100%)',
    backgroundSize: scale > 100 ? `${scale}%` : 'cover',
    backgroundPosition: `${settings.backgroundPositionX ?? 50}% ${settings.backgroundPositionY ?? 50}%`,
    backgroundRepeat: 'no-repeat',
    filter: `brightness(${(settings.backgroundBrightness || 100) / 100})`,
  }

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${(settings.overlayOpacity || 30) / 100})`,
  }

  const titleStyle = {
    fontSize: `${settings.titleFontSize || 24}px`,
    letterSpacing: `${settings.titleLetterSpacing || 3}px`,
    fontFamily: settings.titleFontFamily || "'Noto Serif KR', serif",
    color: settings.titleColor || '#ffffff',
  }

  const subTitleStyle = {
    color: settings.subTitleColor || 'rgba(255,255,255,0.8)',
  }

  // 프리셋별 렌더링
  const renderIntro = () => {
    const commonProps = { key, settings: effectiveSettings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }

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
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black">
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

        /* 글자 좁아지기 */
        @keyframes introLetterSpread {
          0% { opacity: 0; letter-spacing: 3px; }
          100% { opacity: 1; letter-spacing: 1px; }
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

        /* 스플릿 reveal */
        @keyframes introSplitReveal {
          0% { opacity: 0; transform: scaleX(0); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        .intro-split-reveal { animation: introSplitReveal 0.8s ease-out forwards; transform-origin: center; opacity: 0; }

        /* 슬라이드 인 */
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

        /* 스케일 업 */
        @keyframes introScaleUp {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .intro-scale-up { animation: introScaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }

        /* 회전 */
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
        }

        /* ========== 꽃잎 ========== */
        @keyframes introPetalFall {
          0% { transform: translateY(-100px) rotate(0deg) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) translateX(100px); opacity: 0.3; }
        }
        .intro-petal {
          background: linear-gradient(135deg, #ffe4e9 0%, #ffc0cb 50%, #ffe4e9 100%);
          border-radius: 50% 0 50% 50%;
          animation: introPetalFall linear infinite;
          opacity: 0.7;
        }

        /* ========== 골드 파티클 ========== */
        @keyframes introGoldGather {
          0% { transform: translate(var(--target-x), var(--target-y)) scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        @keyframes introGoldShimmer {
          0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.8); transform: scale(1); }
          50% { box-shadow: 0 0 15px rgba(255, 215, 0, 1); transform: scale(1.2); }
        }
        .intro-gold-particle {
          opacity: var(--particle-opacity, 0.6);
          animation: introGoldGather 2s ease-out forwards, introGoldShimmer 3s ease-in-out infinite 2s;
          box-shadow: 0 0 4px currentColor;
        }

        /* ========== 빛 광선 ========== */
        @keyframes introRayExpand {
          0% { opacity: 0; transform: scaleY(0); }
          100% { opacity: 0.4; transform: scaleY(1); }
        }
        @keyframes introRayPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        .intro-light-ray {
          background: linear-gradient(to bottom, transparent, rgba(255, 248, 220, 0.6), transparent);
          transform-origin: center center;
          animation: introRayExpand 3s ease-out forwards, introRayPulse 4s ease-in-out infinite 3s;
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
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes introTextSpread {
          0% { opacity: 0; filter: blur(10px); transform: scale(1.1); }
          100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }
        .intro-watercolor-spread { animation: introWatercolorSpread 2s ease-out forwards; }
        .intro-watercolor-blob { animation: introWatercolorBlob 10s ease-in-out infinite; }
        .intro-text-spread { animation: introTextSpread 1.5s ease-out forwards; opacity: 0; }

        /* ========== 필름 ========== */
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
        .intro-film-overlay { background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px); }
        .intro-sepia-filter { filter: sepia(0.4) contrast(1.1) brightness(0.95); }

        /* ========== 물결 ========== */
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
          position: absolute; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 20%, rgba(200, 230, 255, 0.5) 50%, rgba(255, 255, 255, 0.4) 80%, transparent 100%);
          filter: blur(1px);
        }
        .intro-water-shine {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 0%, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%, transparent 100%);
          animation: introRippleShine 4s ease-in-out infinite;
        }
        .intro-water-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 100% 40% at 50% 100%, rgba(100, 180, 255, 0.35) 0%, rgba(150, 200, 255, 0.2) 30%, transparent 70%);
          animation: introRippleGlow 3s ease-in-out infinite;
        }

        /* ========== 포커스 ========== */
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

        /* ========== 기타 ========== */
        @keyframes introDarkToLight {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        .intro-dark-to-light { animation: introDarkToLight 3s ease-out forwards; }

        @keyframes introSlowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        .intro-slow-zoom { animation: introSlowZoom 8s ease-out forwards; }
      `}</style>

      {renderIntro()}

      {/* 스킵 버튼 */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 z-50 flex items-center gap-1 px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white/80 text-xs rounded-full backdrop-blur-sm transition-colors"
        >
          <X className="w-3 h-3" />
          건너뛰기
        </button>
      )}
    </div>
  )
}

// 공통 Props 타입
interface IntroComponentProps {
  settings: IntroSettings
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
        <p className="text-[16px] intro-letter-spread uppercase whitespace-nowrap" style={{ ...titleStyle, fontSize: '16px', fontFamily: "'Cormorant Garamond', serif" }}>
          {settings.mainTitle || 'Welcome to our wedding'}
        </p>
        {settings.dateText && (
          <p className="text-[12px] mt-3.5 intro-fade-in-delay" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', fontFamily: "'Cormorant Garamond', serif" }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 타이핑 인트로
function TypingIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  const [displayText, setDisplayText] = useState('')
  const [completed, setCompleted] = useState(false)
  const fullText = settings.mainTitle || '소중한 분들을 초대합니다'

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
          <p className="text-xs tracking-[3px] mb-6 intro-slide-up" style={subTitleStyle}>
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
          <p className="text-xs tracking-[4px] mb-4 intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '1.5s', opacity: 0 }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-fade-in-up" style={{ ...titleStyle, animationDelay: '2s', opacity: 0 }}>
          {settings.mainTitle || '우리 결혼합니다'}
        </p>
        <div className="w-16 h-px bg-white/50 my-6 intro-split-reveal" style={{ animationDelay: '2.5s' }} />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '2.8s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 줌 인트로
function ZoomIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-slow-zoom" style={backgroundStyle} />
      <div className="absolute inset-0 bg-black intro-dark-to-light" />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="relative z-10 h-full flex flex-col items-center justify-end pb-20 text-white px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[2px] mb-4 intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '2s', opacity: 0 }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl font-serif intro-fade-in-up" style={{ ...titleStyle, animationDelay: '2.4s', opacity: 0 }}>
          {settings.mainTitle || '평생을 약속합니다'}
        </p>
        <div className="w-16 h-px bg-white/50 my-6 intro-split-reveal" style={{ animationDelay: '2.8s' }} />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '3.2s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
      </div>
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
          <p className="text-xs tracking-[3px] mb-4 intro-letter-spread" style={subTitleStyle}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl font-serif intro-glow-in" style={{ ...titleStyle, animationDelay: '1s' }}>
          {settings.mainTitle || '두 사람이 하나 되는 날'}
        </p>
        <div className="w-16 h-px bg-amber-400/50 mx-auto my-6 intro-split-reveal" style={{ animationDelay: '1.8s' }} />
        {settings.dateText && (
          <p className="text-sm intro-glow-in" style={{ ...subTitleStyle, animationDelay: '2.2s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 편지 인트로 (봉투 열림 애니메이션)
function LetterIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0" style={{ ...backgroundStyle, filter: 'grayscale(100%) brightness(0.4)' }} />

      {/* 화이트 꽃잎 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[8, 18, 28, 38, 48, 58, 68, 78, 88, 13, 33, 53, 73, 93].map((left, i) => (
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
              animation: `introPetalFall ${8 + (i % 5) * 2}s linear ${i * 0.4}s infinite`,
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>

      {/* 봉투 */}
      <div className="relative mt-[50px]" style={{ animation: 'introEnvelopeDown 0.8s ease-in 3.5s forwards' }}>
        <div className="relative w-[280px] h-[260px]">
          <div className="absolute inset-0 bg-[#f5f0e8] shadow-lg" style={{ zIndex: 1 }} />
          <div
            className="absolute left-[15px] right-[15px] h-[180px] bg-white rounded-md shadow-xl flex flex-col items-center justify-center p-4 text-center"
            style={{ zIndex: 2, top: '80px', animation: 'introCardSlideOut 1.2s ease-out 1.5s forwards' }}
          >
            <p className="text-[8px] text-gray-400 tracking-[2px] mb-0.5">{settings.subTitle || 'WEDDING INVITATION'}</p>
            <p className="text-base text-gray-600 mb-3" style={{ color: titleStyle.color === '#ffffff' ? '#4a4a4a' : titleStyle.color }}>
              {settings.mainTitle || '우리 결혼합니다'}
            </p>
            <div className="w-8 h-px bg-[#d4a574] mb-3" />
            <p className="text-sm text-gray-600">{settings.dateText}</p>
          </div>
          <div className="absolute inset-x-0 top-0 bottom-0 bg-[#f5f0e8] shadow-sm" style={{ zIndex: 3, clipPath: 'polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)' }} />
          <div
            className="absolute top-0 left-0 right-0 h-[104px] bg-[#f5f0e8] shadow-sm origin-top"
            style={{ zIndex: 4, clipPath: 'polygon(0 0, 50% 100%, 100% 0)', transformStyle: 'preserve-3d', animation: 'introFlapOpen 1s ease-in-out 0.6s forwards' }}
          >
            <div className="absolute inset-0 bg-[#ebe6de]" style={{ clipPath: 'polygon(5% 5%, 50% 90%, 95% 5%)' }} />
          </div>
          <div
            className="absolute top-[60px] left-1/2 -translate-x-1/2 w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-md"
            style={{ zIndex: 5, animation: 'introSealBreak 0.5s ease-out 0.2s forwards' }}
          >
            <span className="text-white text-lg">♥</span>
          </div>
        </div>
      </div>

      {/* 최종 카드 */}
      <div
        className="absolute w-[280px] h-[360px] bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center p-6 text-center"
        style={{ opacity: 0, zIndex: 10, animation: 'introCardExpand 1s ease-out 4s forwards' }}
      >
        <p className="text-[11px] text-gray-400 tracking-[4px] mb-1">{settings.subTitle || 'WEDDING INVITATION'}</p>
        <p className="text-2xl text-gray-600 mb-4" style={{ color: titleStyle.color === '#ffffff' ? '#4a4a4a' : titleStyle.color }}>
          {settings.mainTitle || '우리 결혼합니다'}
        </p>
        <div className="w-12 h-px bg-[#d4a574] mb-4" />
        <p className="text-lg text-gray-600">{settings.dateText}</p>
        {settings.venueText && <p className="text-xs text-gray-400 mt-4">{settings.venueText}</p>}
      </div>
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
          <p className="text-xs tracking-[3px] mb-4 intro-wave-text" style={{ color: '#f472b6' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-xl font-serif intro-rotate-in" style={{ ...titleStyle, color: '#374151' }}>
          {settings.mainTitle || '꽃잎처럼 아름다운 날'}
        </p>
        <div className="w-20 h-px bg-pink-300 mx-auto my-6 intro-split-reveal" style={{ animationDelay: '0.8s' }} />
        {settings.dateText && (
          <p className="text-xs text-gray-400 intro-rotate-in-delay" style={{ animationDelay: '1.2s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 수채화 인트로
function WatercolorIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
      <div className="absolute inset-0 bg-white/60" />
      <div className="intro-watercolor-spread absolute inset-0">
        <div className="intro-watercolor-blob absolute inset-[-20%] opacity-30" style={{ background: 'radial-gradient(ellipse at 30% 30%, #e0f2fe, #bae6fd, #7dd3fc, transparent 70%)' }} />
        <div className="intro-watercolor-blob absolute inset-[-10%] opacity-40" style={{ background: 'radial-gradient(ellipse at 70% 60%, #fce7f3, #fbcfe8, #f9a8d4, transparent 60%)', animationDelay: '1s' }} />
        <div className="intro-watercolor-blob absolute inset-[-15%] opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 80%, #fef3c7, #fde68a, transparent 50%)', animationDelay: '2s' }} />
      </div>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 gap-3">
        {settings.subTitle && (
          <p className="text-xs text-cyan-600/70 tracking-[3px] intro-text-spread" style={{ animationDelay: '1.5s' }}>
            {settings.subTitle}
          </p>
        )}
        <div className="font-serif text-gray-700 intro-text-spread" style={{ animationDelay: '2s' }}>
          <p className="text-2xl">{settings.mainTitle || '우리의 새로운 이야기'}</p>
        </div>
        <div className="w-16 h-px bg-cyan-400/50 intro-text-spread" style={{ animationDelay: '2.4s' }} />
        {settings.dateText && (
          <p className="text-gray-500 text-sm intro-text-spread" style={{ animationDelay: '2.7s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
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
          <p className="text-xs tracking-[3px] mb-4 intro-slide-in-left" style={{ color: 'rgba(253,230,138,0.6)', animationDelay: '0.5s' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-glow-in" style={{ ...titleStyle, animationDelay: '1s' }}>
          {settings.mainTitle || '영원을 약속하는 날'}
        </p>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto my-6 intro-split-reveal" style={{ animationDelay: '1.8s' }} />
        {settings.dateText && (
          <p className="text-sm intro-slide-in-right" style={{ color: 'rgba(255,255,255,0.6)', animationDelay: '2.2s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 필름 인트로
function FilmIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center intro-sepia-filter intro-film-grain" style={backgroundStyle} />
      <div className="absolute inset-0 intro-film-overlay opacity-50" />
      <div className="absolute inset-0 intro-film-vignette" />
      <div className="absolute inset-0 intro-film-flicker bg-black/10" />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='200' y2='200' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 100px',
      }} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[3px] mb-4 intro-blur-to-sharp" style={{ color: 'rgba(254,243,199,0.8)', fontFamily: 'serif', opacity: 0 }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-blur-to-sharp" style={{ ...titleStyle, color: '#fef3c7', animationDelay: '1s', opacity: 0 }}>
          {settings.mainTitle || '우리의 순간에 초대합니다'}
        </p>
        <div className="w-16 h-px bg-amber-200/50 mx-auto my-6 intro-split-reveal" style={{ animationDelay: '2s' }} />
        {settings.dateText && (
          <p className="text-sm intro-blur-to-sharp" style={{ color: 'rgba(254,243,199,0.6)', animationDelay: '2.5s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 물결 인트로
function RippleIntro({ settings, backgroundStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden flex flex-col">
      <div className="relative h-1/2">
        <div className="absolute inset-0 bg-cover bg-bottom" style={backgroundStyle} />
      </div>
      <div className="relative h-1/2 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-top" style={{ ...backgroundStyle, transform: 'scaleY(-1)', opacity: 0.6 }} />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 to-sky-950/50" />
        {[20, 35, 50, 65, 80].map((top, i) => (
          <div key={i} className="intro-water-ripple-line" style={{ top: `${top}%`, animation: `introWaterDistort${i % 2 === 0 ? '' : '2'} ${2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
        ))}
        <div className="intro-water-shine" />
        <div className="intro-water-glow" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
        <div className="bg-black/30 backdrop-blur-sm px-8 py-6 rounded-lg">
          {settings.subTitle && (
            <p className="text-[10px] text-sky-200/80 tracking-[2px] mb-3 intro-wave-text">
              {settings.subTitle}
            </p>
          )}
          <p className="text-lg font-serif text-white mb-2 intro-wave-text-delay" style={titleStyle}>
            {settings.mainTitle || '두 사람이 하나가 되는 순간'}
          </p>
          <div className="w-12 h-px bg-sky-200/50 mx-auto my-3 intro-split-reveal" style={{ animationDelay: '1s' }} />
          {settings.dateText && (
            <p className="text-sky-100/70 text-xs intro-wave-text" style={{ animationDelay: '1.4s', opacity: 0 }}>
              {settings.dateText}
            </p>
          )}
        </div>
      </div>
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
          <p className="text-xs tracking-[3px] mb-4 intro-scale-up" style={{ color: 'rgba(251,191,36,0.6)', animationDelay: '1.5s' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-glow-in" style={{ ...titleStyle, color: '#fef3c7', animationDelay: '2s' }}>
          {settings.mainTitle || '소중한 날에 초대합니다'}
        </p>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto my-6 intro-split-reveal" style={{ animationDelay: '2.5s' }} />
        {settings.dateText && (
          <p className="text-sm intro-scale-up" style={{ color: 'rgba(253,230,138,0.6)', animationDelay: '2.9s' }}>
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p className="text-xs mt-2 intro-scale-up" style={{ color: 'rgba(253,230,138,0.4)', animationDelay: '3.2s' }}>
            {settings.venueText}
          </p>
        )}
      </div>
    </div>
  )
}

// 포커스 인트로
function FocusIntro({ settings, backgroundStyle, overlayStyle, titleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0" style={{ ...backgroundStyle, filter: 'blur(15px)' }} />
      <div className="absolute inset-0 intro-focus-pull" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[3px] mb-4 intro-letter-spread" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="text-2xl font-serif intro-depth-shift" style={{ ...titleStyle, animationDelay: '0.8s' }}>
          {settings.mainTitle || '두 사람의 이야기'}
        </p>
        <div className="w-16 h-px bg-white/50 my-6 intro-split-reveal" style={{ animationDelay: '1.4s' }} />
        {settings.dateText && (
          <p className="text-sm intro-slide-in-right" style={{ color: 'rgba(255,255,255,0.6)', animationDelay: '1.8s' }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}
