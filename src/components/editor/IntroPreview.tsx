'use client'

import { useState, useEffect, useRef } from 'react'
import { IntroSettings } from '@/lib/introPresets'
import { ImageSettings } from '@/store/editorStore'
import { X } from 'lucide-react'

interface IntroPreviewProps {
  settings: IntroSettings
  coverImage?: string
  coverImageSettings?: Partial<ImageSettings>
  onSkip?: () => void
  autoPlay?: boolean
  // 청첩장 정보 연동 (날짜, 장소만)
  weddingDate?: string
  weddingTime?: string
  venueName?: string
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
  coverImageSettings,
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
  const effectiveDateText = settings.dateText || (weddingDate ? `${formatDate(weddingDate)}${weddingTime ? ` ${weddingTime}` : ''}` : '')
  const effectiveVenueText = settings.venueText || venueName || ''

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

  // 크롭 설정을 반영한 배경 스타일 계산
  const cropX = coverImageSettings?.cropX ?? 0
  const cropY = coverImageSettings?.cropY ?? 0
  const cropWidth = coverImageSettings?.cropWidth ?? 1
  const cropHeight = coverImageSettings?.cropHeight ?? 1
  const hasCrop = cropWidth < 1 || cropHeight < 1

  // 크롭 영역을 container에 맞게 확대 (비율 유지를 위해 단일 스케일 사용)
  const scaleX = 100 / cropWidth
  const scaleY = 100 / cropHeight
  // cover 효과를 위해 더 큰 스케일 사용 (비율 유지)
  const baseScale = Math.max(scaleX, scaleY)

  // 사용자 정의 스케일 추가 (기본 100)
  const userScale = settings.backgroundScale || 100
  const finalScale = baseScale * (userScale / 100)

  // 위치 계산: 크롭 시작점 기준
  const positionX = hasCrop ? (cropX / (1 - cropWidth)) * 100 : (settings.backgroundPositionX ?? 50)
  const positionY = hasCrop ? (cropY / (1 - cropHeight)) * 100 : (settings.backgroundPositionY ?? 50)

  const backgroundStyle = {
    backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #333 0%, #111 100%)',
    backgroundSize: hasCrop ? `${finalScale}%` : (userScale > 100 ? `${userScale}%` : 'cover'),
    backgroundPosition: `${Math.min(Math.max(positionX, 0), 100)}% ${Math.min(Math.max(positionY, 0), 100)}%`,
    backgroundRepeat: 'no-repeat',
    filter: `brightness(${(settings.backgroundBrightness || 100) / 100})`,
  }

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${(settings.overlayOpacity ?? 30) / 100})`,
  }

  const titleStyle = {
    fontSize: `${settings.titleFontSize || 24}px`,
    letterSpacing: `${settings.titleLetterSpacing || 3}px`,
    fontFamily: settings.titleFontFamily || "'Gowun Batang', serif",
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
        }

        /* ========== 꽃잎 ========== */
        @keyframes introPetalFall {
          0% { transform: translateY(-100px) rotate(0deg) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) translateX(100px); opacity: 0.3; }
        }
        .intro-petal {
          background: rgba(180, 160, 150, 0.12);
          border-radius: 50% 0 50% 50%;
          animation: introPetalFall linear infinite;
          opacity: 0.2;
        }

        /* ========== 빛 광선 ========== */
        @keyframes introRayExpand {
          0% { opacity: 0; transform: scaleY(0); }
          100% { opacity: 0.15; transform: scaleY(1); }
        }
        @keyframes introRayPulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        .intro-light-ray {
          background: linear-gradient(to bottom, transparent, rgba(255, 248, 220, 0.3), transparent);
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
          50% { transform: scale(1.01); }
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
function CinematicIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 intro-fade-in intro-zoom-out" style={{ ...backgroundStyle, filter: `${backgroundStyle.filter} grayscale(100%)` }} />
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <div className="intro-line-expand h-px bg-[#F8F6F3]/50 mb-5" />
        <p className="intro-letter-spread uppercase whitespace-nowrap" style={titleStyle}>
          {settings.mainTitle || 'Welcome to our wedding'}
        </p>
        {settings.dateText && (
          <p className="text-[12px] mt-3.5 intro-fade-in-delay" style={{ ...subTitleStyle, letterSpacing: '2px' }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 타이핑 인트로 (상하 분할 레이아웃)
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

  // 밝은 배경용 텍스트 색상 보정
  const adjustedTitleStyle = {
    ...titleStyle,
    color: titleStyle.color === '#ffffff' ? '#2c2c2c' : titleStyle.color,
  }
  const adjustedSubColor = (() => {
    const c = subTitleStyle.color as string
    if (c && c.startsWith('rgba(255,255,255,')) return 'rgba(0,0,0,0.35)'
    if (c === 'rgba(255,255,255,0.8)') return 'rgba(0,0,0,0.35)'
    return c
  })()

  return (
    <div className="relative h-full flex flex-col">
      {/* 상단: 사진 영역 55% */}
      <div className="relative" style={{ height: '55%' }}>
        <div className="absolute inset-0 intro-fade-in" style={backgroundStyle} />
        <div className="absolute inset-0" style={overlayStyle} />
        {/* 물결 경계 (2레이어) */}
        <div className="absolute bottom-[8px] left-0 right-0 z-10">
          <svg className="w-[200%] intro-wave-drift" viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ height: 22, display: 'block', animationDuration: '8s' }}>
            <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z" fill="rgba(250,248,245,0.45)" />
          </svg>
        </div>
        <div className="absolute bottom-[-1px] left-0 right-0 z-10">
          <svg className="w-[200%] intro-wave-drift" viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ height: 28, display: 'block' }}>
            <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z" fill="#FAF8F5" />
          </svg>
        </div>
      </div>

      {/* 하단: 텍스트 영역 45% */}
      <div className="relative flex-1 bg-[#FAF8F5] flex flex-col items-center justify-center text-center px-6">
        {settings.subTitle && (
          <p className="text-[10px] tracking-[4px] mb-5 intro-slide-up" style={{ color: adjustedSubColor }}>
            {settings.subTitle}
          </p>
        )}
        <p className="mb-2" style={adjustedTitleStyle}>
          {displayText}
          {!completed && <span className="intro-typing-cursor">|</span>}
        </p>
        <div className="w-16 h-px bg-gray-300/40 my-5 intro-split-reveal" style={{ animationDelay: '2.8s' }} />
        {settings.dateText && (
          <p className="text-xs intro-fade-in-up" style={{ color: adjustedSubColor, animationDelay: '3.2s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p className="text-[11px] mt-1.5 intro-fade-in-up" style={{ color: 'rgba(0,0,0,0.3)', animationDelay: '3.5s', opacity: 0 }}>
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
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 intro-blur-to-sharp" style={backgroundStyle} />
      <div className="absolute inset-0" style={overlayStyle} />
      <BokehParticles count={10} color="white" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {settings.subTitle && (
          <p className="text-xs tracking-[4px] mb-4 intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '1.5s', opacity: 0 }}>
            {settings.subTitle}
          </p>
        )}
        <p className="intro-fade-in-up" style={{ ...titleStyle, animationDelay: '2s', opacity: 0 }}>
          {settings.mainTitle || '우리 결혼합니다'}
        </p>
        <div className="w-16 h-px bg-[#F8F6F3]/50 my-6 intro-split-reveal" style={{ animationDelay: '2.5s' }} />
        {settings.dateText && (
          <p className="text-sm intro-fade-in-up" style={{ ...subTitleStyle, animationDelay: '2.8s', opacity: 0 }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

// 줌 인트로 (중앙 확대 레이아웃)
function ZoomIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  // 밝은 배경용 텍스트 색상 보정
  const adjustedTitleStyle = {
    ...titleStyle,
    color: titleStyle.color === '#ffffff' ? '#2c2c2c' : titleStyle.color,
  }
  const adjustedSubColor = (() => {
    const c = subTitleStyle.color as string
    if (c && c.startsWith('rgba(255,255,255,')) return 'rgba(0,0,0,0.35)'
    if (c === 'rgba(255,255,255,0.8)') return 'rgba(0,0,0,0.35)'
    return c
  })()

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden bg-[#F7F5F2]">
      {/* 서브타이틀 (사진 위) */}
      {settings.subTitle && (
        <p className="text-[10px] tracking-[4px] mb-6 intro-fade-in-up relative z-10" style={{ color: adjustedSubColor, opacity: 0, animationDelay: '0.5s' }}>
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
      <p className="mt-6 intro-fade-in-up relative z-10" style={{ ...adjustedTitleStyle, opacity: 0, animationDelay: '1.5s' }}>
        {settings.mainTitle || '새로운 시작을 함께해주세요'}
      </p>
      <div className="w-16 h-px bg-gray-300/40 my-4 intro-split-reveal relative z-10" style={{ animationDelay: '2s', opacity: 0 }} />
      {settings.dateText && (
        <p className="text-xs intro-fade-in-up relative z-10" style={{ color: adjustedSubColor, opacity: 0, animationDelay: '2.3s' }}>
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p className="text-[11px] mt-1.5 intro-fade-in-up relative z-10" style={{ color: 'rgba(0,0,0,0.25)', opacity: 0, animationDelay: '2.6s' }}>
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

// 편지 인트로 (봉투 열림 애니메이션)
function LetterIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  // 편지 카드 내부는 밝은 배경이므로 흰색 텍스트면 어두운 색으로 변환
  const cardTitleColor = titleStyle.color === '#ffffff' ? '#4a4a4a' : titleStyle.color
  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0" style={{ ...backgroundStyle, filter: `${backgroundStyle.filter} grayscale(100%)` }} />

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
            className="absolute left-[15px] right-[15px] h-[180px] bg-[#F8F6F3] rounded-md shadow-xl flex flex-col items-center justify-center p-4 text-center"
            style={{ zIndex: 2, top: '80px', animation: 'introCardSlideOut 1.2s ease-out 1.5s forwards' }}
          >
            <p className="text-[8px] tracking-[2px] mb-0.5" style={{ color: subTitleStyle.color === 'rgba(255,255,255,0.8)' ? '#9ca3af' : subTitleStyle.color }}>{settings.subTitle || 'WEDDING INVITATION'}</p>
            <p className="mb-3" style={{ ...titleStyle, color: cardTitleColor, fontSize: `${Math.min(parseInt(titleStyle.fontSize as string) || 24, 20)}px` }}>
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
        className="absolute w-[280px] h-[360px] bg-[#F8F6F3] rounded-lg shadow-2xl flex flex-col items-center justify-center p-6 text-center"
        style={{ opacity: 0, zIndex: 10, animation: 'introCardExpand 1s ease-out 4s forwards' }}
      >
        <p className="text-[11px] tracking-[4px] mb-1" style={{ color: subTitleStyle.color === 'rgba(255,255,255,0.8)' ? '#9ca3af' : subTitleStyle.color }}>{settings.subTitle || 'WEDDING INVITATION'}</p>
        <p className="mb-4" style={{ ...titleStyle, color: cardTitleColor }}>
          {settings.mainTitle || '우리 결혼합니다'}
        </p>
        <div className="w-12 h-px bg-[#d4a574] mb-4" />
        <p className="text-lg text-gray-600">{settings.dateText}</p>
        {settings.venueText && <p className="text-xs text-gray-400 mt-4">{settings.venueText}</p>}
      </div>
    </div>
  )
}

// 꽃잎 인트로 (원형 윈도우 레이아웃)
function PetalIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  // 밝은 배경이므로 흰색 텍스트면 어두운 색으로 변환
  const adjustedTitleColor = titleStyle.color === '#ffffff' ? '#374151' : titleStyle.color
  const adjustedSubColor = subTitleStyle.color === 'rgba(255,255,255,0.8)' ? '#9ca3af' : subTitleStyle.color
  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden bg-[#FDF6F4]">
      {/* 꽃잎: 전체 영역에 걸쳐 떨어짐 */}
      <FallingPetals count={10} />

      {/* 서브타이틀 (원 위) */}
      {settings.subTitle && (
        <p className="text-[10px] tracking-[4px] mb-6 intro-fade-in-up relative z-10" style={{ color: adjustedSubColor, opacity: 0, animationDelay: '0.3s' }}>
          {settings.subTitle}
        </p>
      )}

      {/* 원형 사진 윈도우 */}
      <div className="relative w-[190px] h-[190px] rounded-full overflow-hidden intro-scale-up z-10" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="absolute inset-0" style={backgroundStyle} />
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(settings.overlayOpacity ?? 10) / 100})` }} />
      </div>

      {/* 메인타이틀 (원 아래) */}
      <p className="mt-6 intro-fade-in-up relative z-10" style={{ ...titleStyle, color: adjustedTitleColor, opacity: 0, animationDelay: '0.6s' }}>
        {settings.mainTitle || '꽃잎처럼 아름다운 날'}
      </p>
      <div className="w-16 h-px bg-gray-300/40 my-4 intro-split-reveal relative z-10" style={{ animationDelay: '1s', opacity: 0 }} />
      {settings.dateText && (
        <p className="text-xs intro-fade-in-up relative z-10" style={{ color: adjustedSubColor, opacity: 0, animationDelay: '1.3s' }}>
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p className="text-[11px] mt-1.5 intro-fade-in-up relative z-10" style={{ color: 'rgba(0,0,0,0.3)', opacity: 0, animationDelay: '1.6s' }}>
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

// 수채화 인트로 (아치 윈도우 레이아웃)
function WatercolorIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  // 밝은 배경이므로 흰색 텍스트면 어두운 색으로 변환
  const adjustedTitleColor = titleStyle.color === '#ffffff' ? '#374151' : titleStyle.color
  const adjustedSubColor = subTitleStyle.color === 'rgba(255,255,255,0.8)' ? 'rgba(120,113,108,0.7)' : subTitleStyle.color
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
        <p className="text-center" style={{ ...titleStyle, color: adjustedTitleColor }}>{settings.mainTitle || 'A New Chapter Begins'}</p>
      </div>
      <div
        className="w-14 h-px bg-gray-300/40 my-4 intro-text-spread relative z-10"
        style={{ opacity: 0, animationDelay: '1.6s' }}
      />
      {settings.subTitle && (
        <p
          className="text-[10px] tracking-[4px] intro-text-spread relative z-10"
          style={{ color: adjustedSubColor, opacity: 0, animationDelay: '2s' }}
        >
          {settings.subTitle}
        </p>
      )}
      {settings.dateText && (
        <p
          className="text-xs mt-4 intro-text-spread relative z-10"
          style={{ color: adjustedSubColor, opacity: 0, animationDelay: '2.3s' }}
        >
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p
          className="text-[11px] mt-1.5 intro-text-spread relative z-10"
          style={{ color: 'rgba(0,0,0,0.3)', opacity: 0, animationDelay: '2.6s' }}
        >
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

// 빛의 커튼 인트로 (대각 분할 레이아웃)
function LightrayIntro({ settings, backgroundStyle, overlayStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  // 밝은 배경용 텍스트 색상 보정
  const adjustedTitleColor = titleStyle.color === '#ffffff' ? '#374151' : titleStyle.color
  const adjustedSubColor = (() => {
    const c = subTitleStyle.color as string
    if (c && c.startsWith('rgba(255,255,255,')) return 'rgba(212,165,116,0.8)'
    if (c === 'rgba(255,255,255,0.8)') return 'rgba(212,165,116,0.8)'
    if (c && c.startsWith('rgba(253,230,138')) return c
    return c
  })()

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
          <p className="text-[10px] tracking-[4px] mb-4 intro-slide-in-left" style={{ color: adjustedSubColor, opacity: 0, animationDelay: '0.8s' }}>
            {settings.subTitle}
          </p>
        )}
        <p className="intro-fade-in-up" style={{ ...titleStyle, color: adjustedTitleColor, opacity: 0, animationDelay: '1.2s' }}>
          {settings.mainTitle || '영원을 약속하는 날'}
        </p>
        <div className="w-16 h-px bg-[#d4a574]/30 my-4 intro-line-expand" style={{ animationDelay: '1.8s' }} />
        {settings.dateText && (
          <p className="text-xs intro-fade-in-up" style={{ color: adjustedSubColor, opacity: 0, animationDelay: '2.2s' }}>
            {settings.dateText}
          </p>
        )}
        {settings.venueText && (
          <p className="text-[11px] mt-1.5 intro-fade-in-up" style={{ color: 'rgba(0,0,0,0.25)', opacity: 0, animationDelay: '2.5s' }}>
            {settings.venueText}
          </p>
        )}
      </div>
    </div>
  )
}

// 필름 인트로 (폴라로이드 레이아웃)
function FilmIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  // 밝은 배경이므로 밝은 텍스트면 어두운 색으로 변환
  const adjustedTitleColor = (() => {
    const c = titleStyle.color as string
    if (c === '#ffffff' || c === '#fef3c7') return '#4a4a4a'
    return c
  })()
  const adjustedSubColor = (() => {
    const c = subTitleStyle.color as string
    if (c && (c.startsWith('rgba(254,243,199') || c.startsWith('rgba(255,255,255'))) return '#9ca3af'
    if (c === 'rgba(255,255,255,0.8)') return '#9ca3af'
    return c
  })()

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden bg-[#F5F3F0]">
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
              color: adjustedSubColor,
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
        style={{ ...titleStyle, color: adjustedTitleColor, opacity: 0, animationDelay: '1.2s' }}
      >
        {settings.mainTitle || '우리의 순간에 초대합니다'}
      </p>
      <div className="w-14 h-px bg-gray-300/40 my-4 intro-split-reveal relative z-10" style={{ animationDelay: '1.5s', opacity: 0 }} />
      {settings.dateText && (
        <p
          className="text-xs intro-fade-in-up relative z-10"
          style={{ color: adjustedSubColor, opacity: 0, animationDelay: '1.8s' }}
        >
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p
          className="text-[11px] mt-1.5 intro-fade-in-up relative z-10"
          style={{ color: 'rgba(0,0,0,0.3)', opacity: 0, animationDelay: '2.1s' }}
        >
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

// 필름 스트립 인트로
function FilmstripIntro({ settings, backgroundStyle, titleStyle, subTitleStyle }: IntroComponentProps) {
  const sprocketCount = 12
  const sprockets = Array.from({ length: sprocketCount }, (_, i) => i)

  return (
    <div className="relative h-full flex flex-col items-center justify-center overflow-hidden bg-[#1a1a1a]">
      {/* 필름 스트립 프레임 */}
      <div
        className="relative intro-film-slide-in z-10"
        style={{ width: 280 }}
      >
        {/* 필름 상단 바 + 스프로킷 홀 */}
        <div className="relative bg-[#111] h-[22px] flex items-center justify-between px-2">
          {sprockets.map((i) => (
            <div key={`t${i}`} className="w-[10px] h-[7px] rounded-[1.5px] bg-[#1a1a1a]" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }} />
          ))}
        </div>

        {/* 사진 영역 */}
        <div className="relative bg-[#111] px-[6px]">
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 2' }}>
            <div className="absolute inset-0 intro-slow-zoom" style={backgroundStyle} />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(settings.overlayOpacity ?? 5) / 100})` }} />
          </div>
        </div>

        {/* 필름 하단 바 + 스프로킷 홀 */}
        <div className="relative bg-[#111] h-[22px] flex items-center justify-between px-2">
          {sprockets.map((i) => (
            <div key={`b${i}`} className="w-[10px] h-[7px] rounded-[1.5px] bg-[#1a1a1a]" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }} />
          ))}
        </div>

        {/* 필름 프레임 번호 */}
        <div className="absolute bottom-[26px] right-[14px] text-[8px] text-amber-200/30 font-mono intro-fade-in-delay-2">
          15A
        </div>
      </div>

      {/* 텍스트 영역 */}
      <p
        className="mt-7 intro-cinema-reveal relative z-10 text-center"
        style={{ ...titleStyle, opacity: 0, animationDelay: '1s' }}
      >
        {settings.mainTitle || '우리의 한 장면'}
      </p>
      <div className="w-14 h-px bg-[#F8F6F3]/15 my-4 intro-line-expand relative z-10" style={{ animationDelay: '1.8s', opacity: 0 }} />
      {settings.subTitle && (
        <p
          className="text-[10px] tracking-[4px] intro-slide-in-right relative z-10"
          style={{ ...subTitleStyle, opacity: 0, animationDelay: '2.1s' }}
        >
          {settings.subTitle}
        </p>
      )}
      {settings.dateText && (
        <p
          className="text-xs mt-3 intro-fade-in-up relative z-10"
          style={{ ...subTitleStyle, opacity: 0, animationDelay: '2.4s' }}
        >
          {settings.dateText}
        </p>
      )}
      {settings.venueText && (
        <p
          className="text-[11px] mt-1.5 intro-fade-in-up relative z-10"
          style={{ color: 'rgba(255,255,255,0.2)', opacity: 0, animationDelay: '2.7s' }}
        >
          {settings.venueText}
        </p>
      )}
    </div>
  )
}

