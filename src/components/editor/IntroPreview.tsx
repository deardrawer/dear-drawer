'use client'

import { useState, useEffect, useRef } from 'react'
import { IntroSettings, IntroImageSettings, presetAccentColors, presetCustomColors } from '@/lib/introPresets'
import { ImageSettings } from '@/store/editorStore'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import { X } from 'lucide-react'
import { isInteractiveIntro } from '@/lib/introPresets'
import { BlurIntro } from '@/components/invitation/BlurIntro'
import InteractiveIntro, { hasInteractiveRenderer } from '@/components/invitation/intros/InteractiveIntro'
import { buildIntroData, type IntroData } from '@/components/invitation/intros/shared'
import { parseDateOnly } from '@/lib/dateOnly'

interface IntroPreviewProps {
  settings: IntroSettings
  coverImage?: string
  coverImageSettings?: Partial<ImageSettings>
  introImage?: string
  introImageSettings?: Partial<IntroImageSettings>
  onSkip?: () => void
  autoPlay?: boolean
  // 청첩장 정보 연동 (날짜, 장소만)
  weddingDate?: string
  weddingTime?: string
  weddingTimeDisplay?: string
  venueName?: string
  // 매거진 인트로 스타일
  magazineIntroStyle?: 'cover' | 'clean' | 'editorial'
  groomName?: string
  brideName?: string
  // 커버(인트로 애니메이션 뒤에 자동으로 넘어가 보여줄 실제 커버 화면) 제목
  coverTitle?: string
  // 인터랙티브 인트로용 청첩장 정보 (이름·사진·갤러리)
  introData?: IntroData
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = parseDateOnly(dateString)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

// 한글 날짜 포맷 (2026년 10월 10일 토요일) — 게스트 커버와 동일
function formatDateKo(dateString: string): string {
  if (!dateString) return ''
  const date = parseDateOnly(dateString)
  if (isNaN(date.getTime())) return ''
  const w = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${w}요일`
}

// hex to rgba 변환 함수
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 미리보기는 휴대폰 화면(폭 390px) 기준으로 그린 뒤 칸 크기에 맞춰 통째로 줄인다.
// 칸이 좁다고 글자 크기·줄바꿈·요소 배치가 달라지지 않아, 실제 청첩장과 같은 구도로 보인다.
const STAGE_W = 390
function PreviewStage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current; if (!el) return
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  const k = box.w / STAGE_W
  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden bg-black">
      {box.w > 0 && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: STAGE_W, height: box.h / k, transform: `scale(${k})`, transformOrigin: '0 0' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// 인터랙티브 스타일은 실제 하객 화면과 같은 컴포넌트로 미리보기한다
export default function IntroPreview(props: IntroPreviewProps) {
  return <PreviewStage><IntroPreviewInner {...props} /></PreviewStage>
}

function IntroPreviewInner(props: IntroPreviewProps) {
  const { settings } = props
  const [round, setRound] = useState(0)
  // 스타일 설정을 바꾸면 바로 결과가 보이도록 완료 화면으로 (다 보고 넘기면 다시 처음부터)
  const optsKey = JSON.stringify((settings.styleOptions as Record<string, unknown> | undefined)?.[settings.presetId] ?? {})
  const [seenOpts, setSeenOpts] = useState(optsKey)
  const [showDone, setShowDone] = useState(false)
  if (optsKey !== seenOpts) { setSeenOpts(optsKey); setShowDone(true) }
  if (isInteractiveIntro(settings.presetId) && hasInteractiveRenderer(settings.presetId)) {
    const data = props.introData || buildIntroData({
      groom: { name: props.groomName }, bride: { name: props.brideName },
      wedding: { date: props.weddingDate, timeDisplay: props.weddingTimeDisplay, venue: { name: props.venueName } },
      media: { coverImage: props.coverImage }, intro: settings,
    })
    return (
      <div className="relative w-full h-full overflow-hidden bg-black">
        <InteractiveIntro key={`${settings.presetId}-${round}-${showDone ? 'done' : 'play'}`} embedded startFinished={showDone} styleId={settings.presetId} settings={settings} data={data}
          onNext={() => setTimeout(() => { setShowDone(false); setRound(r => r + 1) }, 700)} />
      </div>
    )
  }
  return <CinematicPreview {...props} />
}

function CinematicPreview({
  settings,
  coverImage,
  coverImageSettings,
  introImage,
  introImageSettings,
  onSkip,
  autoPlay = true,
  weddingDate,
  weddingTime,
  weddingTimeDisplay,
  venueName,
  magazineIntroStyle,
  groomName,
  brideName,
  coverTitle,
}: IntroPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [key, setKey] = useState(0)
  // 인트로 애니메이션이 끝나면 실제 커버 화면으로 자동 전환(게스트 뷰와 동일한 흐름 재현)
  const [showCover, setShowCover] = useState(false)
  const [coverAnimated, setCoverAnimated] = useState(false)
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

  // 인트로 애니메이션 재생 후 커버 화면으로 자동 전환 (프리셋 변경/다시보기 시 리셋)
  useEffect(() => {
    setShowCover(false)
    setCoverAnimated(false)
    const t = setTimeout(() => setShowCover(true), 4500)
    return () => clearTimeout(t)
  }, [settings.presetId, key])

  // 커버 등장 애니메이션(이미지 스케일/페이드 + 텍스트 순차 등장) 트리거
  useEffect(() => {
    if (!showCover) return
    const r = requestAnimationFrame(() => setCoverAnimated(true))
    return () => cancelAnimationFrame(r)
  }, [showCover])

  // 인트로 전용 이미지 결정: prop > settings.introImage > coverImage 폴백
  const resolvedIntroImage = introImage || settings.introImage
  const resolvedIntroImageSettings = introImage ? introImageSettings : settings.introImageSettings
  const effectiveImage = resolvedIntroImage || coverImage
  const effectiveImageSettings = resolvedIntroImage ? resolvedIntroImageSettings : coverImageSettings

  // imageMode에 따른 배경 분기
  const imageMode = settings.imageMode ?? 'photo'

  // 크롭 설정을 반영한 배경 스타일 계산
  const cropX = effectiveImageSettings?.cropX ?? 0
  const cropY = effectiveImageSettings?.cropY ?? 0
  const cropWidth = effectiveImageSettings?.cropWidth ?? 1
  const cropHeight = effectiveImageSettings?.cropHeight ?? 1
  const hasCrop = cropWidth < 1 || cropHeight < 1

  // 크롭 영역을 container에 맞게 확대 (비율 유지를 위해 단일 스케일 사용)
  const scaleX = 100 / cropWidth
  const scaleY = 100 / cropHeight
  // cover 효과를 위해 더 큰 스케일 사용 (비율 유지)
  const baseScale = Math.max(scaleX, scaleY)

  // 사용자 정의 스케일: 크롭이 있으면 크롭 스케일만 사용 (실제 페이지 getImageCropStyle과 동일)
  const userScale = settings.backgroundScale || 100
  const finalScale = hasCrop ? baseScale : baseScale * (userScale / 100)

  // 위치 계산: 크롭 시작점 기준
  const positionX = hasCrop ? (cropX / (1 - cropWidth)) * 100 : (settings.backgroundPositionX ?? 50)
  const positionY = hasCrop ? (cropY / (1 - cropHeight)) * 100 : (settings.backgroundPositionY ?? 50)

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
    return {
      backgroundImage: effectiveImage ? `url(${effectiveImage})` : 'linear-gradient(135deg, #333 0%, #111 100%)',
      backgroundSize: hasCrop ? `${finalScale}%` : (userScale > 100 ? `${userScale}%` : 'cover'),
      backgroundPosition: `${Math.min(Math.max(positionX, 0), 100)}% ${Math.min(Math.max(positionY, 0), 100)}%`,
      backgroundRepeat: 'no-repeat' as const,
      filter: `brightness(${(settings.backgroundBrightness || 100) / 100})`,
    }
  }

  const backgroundStyle = computeBackgroundStyle()

  // 커버(실제 청첩장 첫 화면) 배경 — coverImage + coverImageSettings 크롭 반영
  const coverBackgroundStyle: React.CSSProperties = (() => {
    if (!coverImage) return { background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' }
    const cs = coverImageSettings || {}
    const cw = cs.cropWidth ?? 1
    const ch = cs.cropHeight ?? 1
    const cx = cs.cropX ?? 0
    const cy = cs.cropY ?? 0
    const hasC = cw < 1 || ch < 1
    const scale = Math.max(100 / cw, 100 / ch)
    const posX = cw < 1 ? (cx / (1 - cw)) * 100 : 50
    const posY = ch < 1 ? (cy / (1 - ch)) * 100 : 50
    return {
      backgroundImage: `url(${coverImage})`,
      backgroundSize: hasC ? `${scale}%` : 'cover',
      backgroundPosition: `${Math.min(Math.max(posX, 0), 100)}% ${Math.min(Math.max(posY, 0), 100)}%`,
      backgroundRepeat: 'no-repeat',
    }
  })()

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

  // accentColor: 사용자 설정 우선, 없으면 프리셋 기본값
  const accentColor = settings.accentColor || presetAccentColors[settings.presetId] || '#d4a574'
  const overlayColor = settings.overlayColor || presetCustomColors[settings.presetId]?.overlayColor || '#000000'

  // 타임드 인트로: 포커스(블러) 또는 시네마틱 (그 외 스타일은 인터랙티브 인트로로 별도 렌더)
  const renderIntro = () => settings.presetId === 'blur' ? (
    <BlurIntro key={key} settings={effectiveSettings} backgroundStyle={backgroundStyle} titleStyle={titleStyle} accentColor={accentColor} overlayColor={overlayColor} />
  ) : (
    <CinematicIntro key={key} settings={effectiveSettings} backgroundStyle={backgroundStyle} overlayStyle={overlayStyle}
      photo={imageMode === 'photo' && effectiveImage ? { src: effectiveImage, crop: effectiveImageSettings as Partial<ImageSettings> | undefined } : undefined}
      titleStyle={titleStyle} subTitleStyle={subTitleStyle} accentColor={accentColor} overlayColor={overlayColor} />
  )

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black">
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
      `}</style>

      {/* 인트로 애니메이션 — 커버 등장 시 함께 페이드아웃(게스트 뷰와 동일) */}
      <div
        className="absolute inset-0"
        style={{ opacity: showCover ? 0 : 1, transition: 'opacity 0.6s ease', pointerEvents: showCover ? 'none' : 'auto' }}
      >
        {renderIntro()}
      </div>

      {/* 인트로 애니메이션 뒤에 자동으로 넘어가는 커버 화면 (게스트 뷰 커버와 동일 흐름) */}
      {showCover && (
        <div className="absolute inset-0 z-40 flex flex-col justify-center items-center overflow-hidden">
          {/* 커버 배경: 스케일+페이드 인 */}
          <div
            className="absolute inset-0"
            style={{
              ...coverBackgroundStyle,
              opacity: coverAnimated ? 1 : 0,
              transform: coverAnimated ? 'scale(1)' : 'scale(1.08)',
              transition: 'opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1), transform 6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.3)' }} />
          <div className="relative z-10 w-full text-center text-white px-5">
            {(groomName || brideName) && (
              <p style={{ fontSize: '13px', fontWeight: 300, letterSpacing: '2px', marginBottom: '14px', opacity: coverAnimated ? 1 : 0, transform: coverAnimated ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s' }}>
                {groomName} &amp; {brideName}
              </p>
            )}
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 600, letterSpacing: '6px', marginBottom: '18px', opacity: coverAnimated ? 1 : 0, transform: coverAnimated ? 'translateY(0)' : 'translateY(10px)', filter: coverAnimated ? 'blur(0px)' : 'blur(3px)', transition: 'opacity 1.1s cubic-bezier(0.22,1,0.36,1) 0.4s, transform 1.1s cubic-bezier(0.22,1,0.36,1) 0.4s, filter 1.1s cubic-bezier(0.22,1,0.36,1) 0.4s' }}>
              {coverTitle || 'OUR WEDDING'}
            </h1>
            {effectiveVenueText && (
              <p style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '4px', marginBottom: '6px', opacity: coverAnimated ? 1 : 0, transform: coverAnimated ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s' }}>
                {effectiveVenueText}
              </p>
            )}
            {weddingDate && (
              <p style={{ fontSize: '14px', fontWeight: 300, letterSpacing: '1px', opacity: coverAnimated ? 1 : 0, transform: coverAnimated ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.8s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.8s' }}>
                {formatDateKo(weddingDate)}{weddingTimeDisplay ? ` ${weddingTimeDisplay}` : (weddingTime ? ` ${weddingTime}` : '')}
              </p>
            )}
          </div>
          {/* 넘김 안내 문구 (하객 화면 커버 하단과 같은 자리) */}
          {settings.guideEnabled && (
            <p className="absolute left-0 right-0 text-center text-[11px] font-light"
              style={{ bottom: 92, color: 'rgba(255,255,255,0.85)', letterSpacing: '1px', opacity: coverAnimated ? 1 : 0, transition: 'opacity 0.6s ease-out 1.8s' }}>
              {settings.guideText || '터치하거나 아래로 넘겨주세요'}
            </p>
          )}
        </div>
      )}

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
  accentColor: string
  overlayColor: string
  /** 사진 배경: 원본 크기를 재서 크롭 영역을 정확히 맞춘다 (근사 계산은 세로로 긴 사진에서 위아래가 잘렸다) */
  photo?: { src: string; crop?: Partial<ImageSettings> }
}

// 시네마틱 인트로
function CinematicIntro({ settings, backgroundStyle, titleStyle, subTitleStyle, accentColor, overlayColor, photo }: IntroComponentProps) {
  const overlayOpacity = (settings.overlayOpacity ?? 30) / 100
  const customOverlayStyle = {
    backgroundColor: hexToRgba(overlayColor, overlayOpacity),
  }
  // 서브텍스트 색상을 accentColor에서 파생 (80% 불투명도)
  const cinematicSubStyle = { ...subTitleStyle, color: hexToRgba(accentColor, 0.8) }

  return (
    <div className="relative h-full">
      {photo ? (
        <CroppedImageDiv src={photo.src} crop={photo.crop} className="absolute inset-0 intro-fade-in intro-zoom-out" style={{ filter: backgroundStyle.filter }} />
      ) : (
        <div className="absolute inset-0 intro-fade-in intro-zoom-out" style={backgroundStyle} />
      )}
      <div className="absolute inset-0" style={customOverlayStyle} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <div className="intro-line-expand h-px mb-5" style={{ backgroundColor: `${accentColor}80` }} />
        <p className="intro-letter-spread uppercase whitespace-nowrap" style={titleStyle}>
          {settings.mainTitle || 'Welcome to our wedding'}
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

