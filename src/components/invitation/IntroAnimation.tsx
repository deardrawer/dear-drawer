'use client'

import { BlurIntro } from './BlurIntro'

import { useEffect, useRef } from 'react'
import { IntroSettings, presetAccentColors, presetCustomColors } from '@/lib/introPresets'
import { ImageSettings } from '@/store/editorStore'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import { parseDateOnly } from '@/lib/dateOnly'

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
  introDurationMs?: number // 인트로 표시(홀드) 시간. 기본 4000ms. (예: OUR/FAMILY는 6000)
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
  introDurationMs = 4000,
}: IntroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 자동 완료 (기본 4초, prop으로 조정 가능)
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, introDurationMs)

    return () => clearTimeout(timer)
  }, [onComplete, introDurationMs])

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

  // 타임드 인트로: 포커스(블러) 또는 시네마틱 (그 외 스타일은 인터랙티브 인트로로 별도 렌더)
  const renderIntro = () => settings.presetId === 'blur' ? (
    <BlurIntro settings={{ ...settings, mainTitle, subTitle, dateText }} backgroundStyle={backgroundStyle} titleStyle={titleStyle} accentColor={accentColor} overlayColor={overlayColor} />
  ) : (
    <CinematicIntro settings={{ ...settings, mainTitle, subTitle, dateText, venueText }} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle}
      photo={imageMode === 'photo' && effectiveImage ? { src: effectiveImage, crop: effectiveImageSettings } : undefined}
      titleStyle={titleStyle} subTitleStyle={subTitleStyle} accentColor={accentColor} overlayColor={overlayColor} introDurationMs={introDurationMs} />
  )

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
        @keyframes introFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .intro-fade-in { animation: introFadeIn 1s ease-out forwards; }
        .intro-fade-in-delay { animation: introFadeIn 1s ease-out 0.5s forwards; opacity: 0; }
        .intro-fade-in-delay-2 { animation: introFadeIn 1s ease-out 1s forwards; opacity: 0; }
        .intro-fade-in-delay-3 { animation: introFadeIn 1s ease-out 1.5s forwards; opacity: 0; }
        @keyframes introFadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .intro-fade-in-up { animation: introFadeInUp 1s ease-out forwards; }
        .intro-fade-in-up-delay { animation: introFadeInUp 1s ease-out 0.5s forwards; opacity: 0; }
        .intro-fade-in-up-delay-2 { animation: introFadeInUp 1s ease-out 1s forwards; opacity: 0; }
        @keyframes introZoomOut {
          from { transform: scale(1.1); }
          to { transform: scale(1); }
        }
        .intro-zoom-out { animation: introZoomOut 2.5s ease-out forwards; }
        @keyframes introLetterSpread {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .intro-letter-spread { animation: introLetterSpread 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards; opacity: 0; }
        @keyframes introLineExpand {
          from { width: 0; }
          to { width: 50px; }
        }
        .intro-line-expand { animation: introLineExpand 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .intro-frame { width: 100%; height: 100%; }
        @media (min-width: 768px) {
          .intro-frame { width: min(100%, calc(100dvh * 9 / 16)); height: 100%; }
        }
      `}</style>

      <div className="relative overflow-hidden intro-frame">
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
  const date = parseDateOnly(dateString)
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
  introDurationMs?: number
  /** 사진 배경: 원본 크기를 재서 크롭 영역을 정확히 맞춘다 (근사 계산은 세로로 긴 사진에서 위아래가 잘렸다) */
  photo?: { src: string; crop?: Partial<ImageSettings> }
}

// 시네마틱 인트로
function CinematicIntro({ settings, backgroundStyle, titleStyle, subTitleStyle, accentColor, overlayColor, introDurationMs = 4000, photo }: IntroComponentProps) {
  const customOverlayStyle = {
    backgroundColor: hexToRgba(overlayColor, (settings.overlayOpacity ?? 30) / 100)
  }
  // 서브텍스트 색상을 accentColor에서 파생 (80% 불투명도)
  const cinematicSubStyle = { ...subTitleStyle, color: hexToRgba(accentColor, 0.8) }
  return (
    <div className="relative h-full">
      {photo ? (
        <CroppedImageDiv src={photo.src} crop={photo.crop} className="absolute inset-0 intro-fade-in intro-zoom-out"
          style={{ filter: backgroundStyle.filter, animationDuration: `${introDurationMs}ms`, animationTimingFunction: 'linear' }} />
      ) : (
        <div className="absolute inset-0 intro-fade-in intro-zoom-out" style={{ ...backgroundStyle, animationDuration: `${introDurationMs}ms`, animationTimingFunction: 'linear' }} />
      )}
      <div className="absolute inset-0" style={customOverlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        {/* 인트로 길이에 비례해 라인→제목→날짜가 차근차근 등장 (opacity/transform만) */}
        <div className="intro-line-expand h-px mb-5" style={{ backgroundColor: `${accentColor}80`, animationDelay: `${Math.round(introDurationMs * 0.05)}ms` }} />
        <p className="intro-letter-spread uppercase text-center break-words max-w-full" style={{ ...titleStyle, animationDelay: `${Math.round(introDurationMs * 0.28)}ms` }}>
          {settings.mainTitle}
        </p>
        {settings.dateText && (
          <p className="text-[12px] mt-3.5 intro-fade-in-delay" style={{ ...cinematicSubStyle, letterSpacing: '2px', animationDelay: `${Math.round(introDurationMs * 0.62)}ms` }}>
            {settings.dateText}
          </p>
        )}
      </div>
    </div>
  )
}

