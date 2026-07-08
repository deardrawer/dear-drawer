'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import RsvpForm from '@/components/invitation/RsvpForm'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import type { Invitation } from '@/types/invitation'
import DdayPopupOverlay from '@/components/dday/DdayPopupOverlay'
import { resolveKoreanFontFamily } from '@/app/editor/the-simple/fontOptions'
import { normalizeDdayPopup } from '@/lib/ddayPopupNormalize'
import '@/components/dday/dday-popup.css'

// ===== Types =====
type EssayColorTheme = 'essay-ivory' | 'essay-blush' | 'essay-sage' | 'essay-mono' | 'essay-sky' | 'essay-coral'
type DesignConcept = 'default' | 'paper' | 'book'
type EssayFontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury' | 'gulim' | 'adulthand' | 'neathand' | 'roundhand' | 'roundgothic' | 'suit' | 'myungjo'
interface EssayFontConfig { display: string; displayKr: string; body: string }

const essayFontStyles: Record<EssayFontStyle, EssayFontConfig> = {
  classic: { display: "'Cinzel', serif", displayKr: "'Ridibatang', serif", body: "'Ridibatang', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Pretendard', sans-serif", body: "'Pretendard', sans-serif" },
  romantic: { display: "'Montserrat', sans-serif", displayKr: "'Okticon', serif", body: "'Okticon', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'JeonnamEducationBarun', sans-serif", body: "'JeonnamEducationBarun', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'ELandChoice', serif", body: "'ELandChoice', serif" },
  gulim: { display: "'EB Garamond', serif", displayKr: "'JoseonGulim', serif", body: "'JoseonGulim', serif" },
  adulthand: { display: "'Montserrat', sans-serif", displayKr: "'GangwonEducationModuche', sans-serif", body: "'GangwonEducationModuche', sans-serif" },
  neathand: { display: "'Montserrat', sans-serif", displayKr: "'OmuDaye', sans-serif", body: "'OmuDaye', sans-serif" },
  roundhand: { display: "'Montserrat', sans-serif", displayKr: "'OngleipKonkon', sans-serif", body: "'OngleipKonkon', sans-serif" },
  roundgothic: { display: "'Montserrat', sans-serif", displayKr: "'NanumSquareRound', sans-serif", body: "'NanumSquareRound', sans-serif" },
  suit: { display: "'Montserrat', sans-serif", displayKr: "'Suit', sans-serif", body: "'Suit', sans-serif" },
  myungjo: { display: "'Montserrat', sans-serif", displayKr: "'ChosunIlboMyungjo', serif", body: "'ChosunIlboMyungjo', serif" },
}

interface ThemeConfig {
  background: string; sectionBg: string; text: string; heading: string
  accent: string; divider: string; gray: string; quoteBg: string; cardBg: string
}

const essayThemes: Record<EssayColorTheme, ThemeConfig> = {
  'essay-ivory': { background: '#FAF8F3', sectionBg: '#F5F0E8', text: '#3D3028', heading: '#5C4A3A', accent: '#8B7355', divider: '#D4C4AC', gray: '#7A6E60', quoteBg: '#F0EBE0', cardBg: '#FFFFFF' },
  'essay-blush': { background: '#FDF6F4', sectionBg: '#F9EDED', text: '#4A3238', heading: '#8C5060', accent: '#C4818E', divider: '#E8C8CE', gray: '#8A6E74', quoteBg: '#F5E6EA', cardBg: '#FFFFFF' },
  'essay-sage': { background: '#F5F7F3', sectionBg: '#EBF0E6', text: '#2E3A2A', heading: '#4A5E42', accent: '#6B8A5E', divider: '#B8CCAE', gray: '#6A7A62', quoteBg: '#E5EDE0', cardBg: '#FFFFFF' },
  'essay-mono': { background: '#FFFFFF', sectionBg: '#F5F5F5', text: '#1A1A1A', heading: '#000000', accent: '#555555', divider: '#D0D0D0', gray: '#666666', quoteBg: '#F0F0F0', cardBg: '#FFFFFF' },
  'essay-sky': { background: '#F4F8FC', sectionBg: '#E8F0F8', text: '#2A3440', heading: '#3A5068', accent: '#5B8CB5', divider: '#B8D0E4', gray: '#6A7E90', quoteBg: '#E0ECF6', cardBg: '#FFFFFF' },
  'essay-coral': { background: '#FEF6F2', sectionBg: '#FAECE6', text: '#3E2E28', heading: '#A05440', accent: '#D4836B', divider: '#E8C4B8', gray: '#8A7068', quoteBg: '#F5E0D6', cardBg: '#FFFFFF' },
}

interface GuestInfo { id: string; name: string; relation: string | null; honorific: string; customMessage: string | null }

interface InvitationClientProps {
  invitation: Invitation; content: any; isPaid: boolean; isPreview?: boolean
  overrideColorTheme?: string; overrideFontStyle?: string; skipIntro?: boolean
  guestInfo?: GuestInfo | null; isSample?: boolean
}

// ===== Scroll Animation Hook =====
function useScrollReveal(threshold = 0.15) {
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  useEffect(() => { return () => { observerRef.current?.disconnect() } }, [])
  const ref = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(node)
    observerRef.current = observer
  }, [threshold])
  return { ref, isVisible }
}

// Helper: InlineCropEditor의 cropX/cropY/cropWidth/cropHeight를 CSS 스타일로 변환
function getCropStyle(settings: any): React.CSSProperties {
  if (!settings || settings.cropWidth === undefined) return {}
  const cX = settings.cropX ?? 0
  const cY = settings.cropY ?? 0
  const cW = settings.cropWidth ?? 1
  const cH = settings.cropHeight ?? 1
  if (cW >= 0.98 && cH >= 0.98) return {} // 크롭 없음
  const centerX = (cX + cW / 2) * 100
  const centerY = (cY + cH / 2) * 100
  const scale = 1 / Math.max(cW, cH)
  return {
    objectPosition: `${centerX.toFixed(1)}% ${centerY.toFixed(1)}%`,
    transform: `scale(${scale.toFixed(3)})`,
    transformOrigin: `${centerX.toFixed(1)}% ${centerY.toFixed(1)}%`,
  }
}

function ScrollSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal()
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ===== Shared Gallery Components =====

function EssayGalleryViewer({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [visible, setVisible] = useState(false)
  const [imgFade, setImgFade] = useState(true)
  const touchStartX = useRef(0)

  // 열릴 때 fade-in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 350)
  }, [onClose])

  const goTo = useCallback((idx: number) => {
    setImgFade(false)
    setTimeout(() => {
      setCurrentIndex(idx)
      setImgFade(true)
    }, 150)
  }, [])

  // 순환형 이동
  const goNext = useCallback(() => goTo((currentIndex + 1) % images.length), [currentIndex, images.length, goTo])
  const goPrev = useCallback(() => goTo((currentIndex - 1 + images.length) % images.length), [currentIndex, images.length, goTo])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, goNext, goPrev])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev() }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10002,
        background: 'rgba(30,27,23,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transition: 'opacity 0.35s ease, visibility 0.35s',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClose}
    >
      {/* Close button */}
      <div
        onClick={(e) => { e.stopPropagation(); handleClose() }}
        style={{
          position: 'absolute', top: 18, right: 18,
          fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 200,
          color: 'rgba(244,241,235,0.6)', cursor: 'pointer', padding: '8px', lineHeight: 1, zIndex: 2,
        }}
      >&#10005;</div>

      {/* Prev arrow */}
      <div
        onClick={(e) => { e.stopPropagation(); goPrev() }}
        style={{
          position: 'absolute', top: '50%', left: 4, transform: 'translateY(-50%)',
          fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 200,
          color: 'rgba(244,241,235,0.45)', cursor: 'pointer', padding: '16px', lineHeight: 1, zIndex: 2,
        }}
      >&#8249;</div>

      {/* Image */}
      <img
        src={images[currentIndex]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '92%', maxHeight: '78%', objectFit: 'contain', filter: 'saturate(0.65)',
          opacity: imgFade ? 1 : 0, transition: 'opacity 0.3s',
        }}
      />

      {/* Next arrow */}
      <div
        onClick={(e) => { e.stopPropagation(); goNext() }}
        style={{
          position: 'absolute', top: '50%', right: 4, transform: 'translateY(-50%)',
          fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 200,
          color: 'rgba(244,241,235,0.45)', cursor: 'pointer', padding: '16px', lineHeight: 1, zIndex: 2,
        }}
      >&#8250;</div>

      {/* Counter */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontFamily: "'Cormorant Garamond', serif", fontSize: '9px', fontWeight: 400,
        letterSpacing: '3px', color: 'rgba(244,241,235,0.35)',
      }}>
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}

function EssayGalleryGrid({ images, onImageClick, colors }: {
  images: string[]; onImageClick: (index: number) => void; colors: { bg: string; muted: string; accent: string }
}) {
  if (!images || images.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
      {images.map((src: string, i: number) => (
        <div key={i} style={{ overflow: 'hidden', aspectRatio: '1/1' }}>
          <img
            src={src}
            alt=""
            onClick={() => onImageClick(i)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              filter: 'saturate(0.55) contrast(1.08)', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              opacity: 0,
              animation: `bkGalImg 0.8s cubic-bezier(.33,1,.68,1) ${0.4 + i * 0.12}s forwards`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ===== Music Toggle =====
function EssayMusicToggle({ audioRef, theme }: { audioRef: React.RefObject<HTMLAudioElement | null>; theme: ThemeConfig }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const hasAutoPlayed = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause) }
  }, [audioRef])

  const startAutoPlay = useCallback(() => {
    if (hasAutoPlayed.current || !audioRef.current) return
    hasAutoPlayed.current = true
    const saved = localStorage.getItem('musicEnabled')
    if (saved === 'false') return
    setTimeout(() => { audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {}) }, 100)
  }, [audioRef])

  useEffect(() => { startAutoPlay() }, [startAutoPlay])

  const toggle = () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => { setIsPlaying(true); localStorage.setItem('musicEnabled', 'true') }).catch(console.error)
    } else {
      audioRef.current.pause(); setIsPlaying(false); localStorage.setItem('musicEnabled', 'false')
    }
  }

  return (
    <button onClick={toggle} className="fixed top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110"
      style={{ background: `${theme.sectionBg}E6`, backdropFilter: 'blur(10px)', border: `1px solid ${theme.divider}40`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {isPlaying ? (
        <svg className="w-4 h-4" style={{ color: theme.text }} viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
      ) : (
        <svg className="w-4 h-4" style={{ color: theme.gray }} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
      )}
    </button>
  )
}

// ====================================================================
// COVER SECTION - 풀네임 + 타이핑 효과
// ====================================================================
function CoverSection({ data, theme }: { data: any; theme: ThemeConfig }) {
  const [loaded, setLoaded] = useState(false)
  const [typedText, setTypedText] = useState('')

  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const coverTitle = data.design?.coverTitle || 'OUR WEDDING ESSAY'
  const coverDesign = data.design?.coverDesign || 'full'
  const coverImage = data.media?.coverImage || ''
  const weddingDate = data.wedding?.date ? new Date(data.wedding.date) : new Date()
  const dateStr = `${weddingDate.getFullYear()}.${String(weddingDate.getMonth() + 1).padStart(2, '0')}.${String(weddingDate.getDate()).padStart(2, '0')}`
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const dayOfWeek = dayNames[weddingDate.getDay()]
  const venueName = data.wedding?.venue?.name || ''

  useEffect(() => { setTimeout(() => setLoaded(true), 100) }, [])

  // Typing effect for date
  useEffect(() => {
    if (!loaded) return
    let i = 0
    const timer = setInterval(() => {
      if (i <= dateStr.length) { setTypedText(dateStr.substring(0, i)); i++ }
      else clearInterval(timer)
    }, 100)
    return () => clearInterval(timer)
  }, [loaded, dateStr])

  const scrollHint = (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce" style={{ opacity: loaded ? 0.4 : 0, transition: 'opacity 1s', transitionDelay: '2.5s' }}>
      <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke={coverDesign === 'full' && coverImage ? '#fff' : theme.gray} strokeWidth="1">
        <rect x="1" y="1" width="14" height="22" rx="7" />
        <line x1="8" y1="6" x2="8" y2="10" />
      </svg>
    </div>
  )

  // 크롭 스타일 (모든 커버 디자인 공용)
  const cropStyle = getCropStyle(data.media?.coverImageSettings)

  // ── 전면 (full): 이미지가 화면 전체, 텍스트 오버레이 ──
  if (coverDesign === 'full' && coverImage) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-end" style={{ background: '#000' }}>
        {/* 배경 이미지 */}
        <div className="absolute inset-0">
          <img src={coverImage} alt="" className="w-full h-full object-cover" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.5s ease-out', ...cropStyle }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 100%)' }} />
        </div>

        {/* 상단 타이틀 */}
        <div className="absolute top-0 left-0 right-0 pt-14 text-center transition-all duration-1000 delay-300" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-12px)' }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '12px', letterSpacing: '6px', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{coverTitle}</div>
        </div>

        {/* 하단 텍스트 */}
        <div className="relative z-10 pb-16 text-center w-full px-8">
          <div className="transition-all duration-[1200ms] delay-500" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '20px', fontWeight: 200, letterSpacing: '8px', color: '#fff' }}>
              {groomName} <span className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>&</span> {brideName}
            </div>
          </div>
          <div className="mt-6 transition-all duration-[1200ms] delay-[900ms]" style={{ opacity: loaded ? 1 : 0 }}>
            <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.4)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '11px', letterSpacing: '4px', color: 'rgba(255,255,255,0.8)' }}>
              {typedText}<span className="animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            </div>
            <div className="mt-2 transition-all duration-500 delay-[2000ms]" style={{ opacity: loaded ? 1 : 0 }}>
              <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.6)' }}>{dayOfWeek}</div>
            </div>
            {venueName && (
              <div className="mt-3" style={{ fontFamily: "'Okticon', serif", fontSize: '12px', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>{venueName}</div>
            )}
          </div>
        </div>
        {scrollHint}
      </div>
    )
  }

  // ── 센터 (center): 스크랩북 스타일 ──
  if (coverDesign === 'center' && coverImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6" style={{ background: '#EDEBE6' }}>
        {/* 스크립트 타이틀 */}
        <div className="transition-all duration-1000 delay-200" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-16px)' }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '28px', fontWeight: 300, letterSpacing: '6px', lineHeight: 1.4, color: '#3D3028', marginBottom: '32px', textAlign: 'center' }}>
            {(coverTitle || 'save the date').split(' ').map((word: string, i: number) => (
              <div key={i}>{word}</div>
            ))}
          </div>
        </div>

        {/* 테이프 장식 사진 - 상단 중앙 */}
        <div className="relative transition-all duration-[1200ms] delay-400" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '50%', zIndex: 2, width: '60px', height: '18px', background: 'linear-gradient(135deg, rgba(220,210,190,0.85), rgba(200,190,170,0.65))', transform: 'translateX(-50%) rotate(-2deg)', borderRadius: '1px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
          <div style={{ width: '220px', height: '270px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
            <img src={coverImage} alt="" className="w-full h-full object-cover" style={cropStyle} />
          </div>
        </div>

        {/* 날짜 */}
        <div className="mt-10 transition-all duration-[1200ms] delay-700" style={{ opacity: loaded ? 1 : 0 }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '22px', fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: '#3D3028', textAlign: 'center' }}>
            {typedText}<span className="animate-pulse" style={{ color: 'rgba(0,0,0,0.12)' }}>|</span>
          </div>
        </div>

        {/* 이름 나란히 */}
        <div className="mt-4 transition-all duration-[1200ms] delay-900" style={{ opacity: loaded ? 1 : 0 }}>
          <div className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', fontWeight: 400, letterSpacing: '5px', color: '#3D3028', textTransform: 'uppercase' as const }}>
            {groomName} & {brideName}
          </div>
          <div className="text-center mt-1" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '9px', fontWeight: 300, letterSpacing: '4px', color: '#8B7A68' }}>
            ARE GETTING MARRIED
          </div>
        </div>

        {/* 장소 */}
        {venueName && (
          <div className="mt-10 transition-all duration-[1200ms] delay-[1100ms]" style={{ opacity: loaded ? 1 : 0 }}>
            <div style={{ fontFamily: "'Okticon', serif", fontSize: '16px', fontStyle: 'italic', color: '#5C5040', textAlign: 'center' }}>
              {venueName}
            </div>
          </div>
        )}

        {scrollHint}
      </div>
    )
  }

  // ── 타이포 (typo): 큰 타이포그래피 + 작은 이미지 ──
  if (coverDesign === 'typo' && coverImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-8" style={{ background: theme.background }}>
        {/* 상단 장식선 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-[2000ms]" style={{ width: '1px', height: loaded ? '60px' : '0px', background: theme.divider }} />

        {/* 큰 타이틀 */}
        <div className="text-center transition-all duration-1000 delay-200" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-16px)' }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '32px', fontWeight: 300, letterSpacing: '8px', lineHeight: 1.3, color: theme.heading }}>
            {coverTitle.split(' ').map((word: string, i: number) => (
              <div key={i}>{word}</div>
            ))}
          </div>
        </div>

        {/* 작은 이미지 + 이름 나란히 */}
        <div className="flex items-end gap-5 mt-10 transition-all duration-[1200ms] delay-500" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}>
          <div style={{ width: '100px', height: '130px', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${theme.divider}`, flexShrink: 0 }}>
            <img src={coverImage} alt="" className="w-full h-full object-cover" style={cropStyle} />
          </div>
          <div className="text-left pb-1">
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 300, letterSpacing: '4px', color: theme.heading, lineHeight: 1.8 }}>
              {groomName} <span className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', fontStyle: 'italic', color: theme.accent }}>&</span> {brideName}
            </div>
          </div>
        </div>

        {/* 날짜 + 장소 */}
        <div className="mt-12 transition-all duration-[1200ms] delay-[900ms]" style={{ opacity: loaded ? 1 : 0 }}>
          <div style={{ width: '32px', height: '1px', background: theme.divider, margin: '0 auto 12px' }} />
          <div className="text-center">
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '12px', letterSpacing: '4px', color: theme.accent }}>
              {typedText}<span className="animate-pulse" style={{ color: theme.divider }}>|</span>
            </div>
            <div className="mt-2 transition-all duration-500 delay-[2000ms]" style={{ opacity: loaded ? 1 : 0 }}>
              <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '3px', color: theme.gray }}>{dayOfWeek}</div>
            </div>
            {venueName && (
              <div className="mt-3" style={{ fontFamily: "'Okticon', serif", fontSize: '12px', fontStyle: 'italic', color: theme.gray }}>{venueName}</div>
            )}
          </div>
        </div>
        {scrollHint}
      </div>
    )
  }

  // ── 엠보싱 (emboss): 단색 배경 + 양각 텍스트 (이미지 없을 때 기본) ──
  if (coverDesign === 'emboss' || !coverImage) {
    const embossColors: Record<string, { bg: string; text: string; highlight: string; shadow: string; line: string }> = {
      'dusty-blue': { bg: '#8E9EAB', text: 'rgba(255,255,255,0.5)', highlight: 'rgba(255,255,255,0.35)', shadow: 'rgba(0,0,0,0.12)', line: 'rgba(255,255,255,0.25)' },
      'beige':      { bg: '#C2B9A7', text: 'rgba(255,255,255,0.5)', highlight: 'rgba(255,255,255,0.4)', shadow: 'rgba(0,0,0,0.1)', line: 'rgba(255,255,255,0.22)' },
      'teal':       { bg: '#7A8B8B', text: 'rgba(255,255,255,0.55)', highlight: 'rgba(255,255,255,0.45)', shadow: 'rgba(0,0,0,0.22)', line: 'rgba(255,255,255,0.2)' },
      'gray':       { bg: '#9BA3A6', text: 'rgba(255,255,255,0.5)', highlight: 'rgba(255,255,255,0.35)', shadow: 'rgba(0,0,0,0.15)', line: 'rgba(255,255,255,0.22)' },
      'dark':       { bg: '#4A4A48', text: 'rgba(212,185,150,0.55)', highlight: 'rgba(255,235,200,0.35)', shadow: 'rgba(0,0,0,0.3)', line: 'rgba(212,185,150,0.25)' },
    }
    const ec = embossColors[data.design?.embossColor || 'teal'] || embossColors['teal']
    const embossStyle = (size: 'sm' | 'md' | 'lg') => ({
      color: ec.text,
      textShadow: size === 'lg'
        ? `0 2px 3px ${ec.highlight}, 0 -1px 2px ${ec.shadow}`
        : size === 'md'
        ? `0 1px 2px ${ec.highlight}, 0 -1px 1px ${ec.shadow}`
        : `0 1px 1px ${ec.highlight}, 0 -1px 1px ${ec.shadow}`,
    })

    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: ec.bg }}>
        {/* Decorative top line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-[2000ms]" style={{ width: '1px', height: loaded ? '80px' : '0px', background: ec.line }} />

        {/* 큰 타이틀 */}
        <div className="transition-all duration-1000 delay-200" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-20px)' }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '28px', fontWeight: 300, letterSpacing: '6px', lineHeight: 1.4, marginBottom: '40px', textAlign: 'center', ...embossStyle('lg') }}>
            {coverTitle.split(' ').map((word: string, i: number) => (
              <div key={i}>{word}</div>
            ))}
          </div>
        </div>

        {/* 이름 나란히 */}
        <div className="text-center relative z-10 transition-all duration-[1200ms] delay-500" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 200, letterSpacing: '6px', ...embossStyle('md') }}>
            {groomName} <span className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', fontStyle: 'italic' }}>&</span> {brideName}
          </div>
        </div>

        {/* 날짜 + 장소 */}
        <div className="mt-12 transition-all duration-[1200ms] delay-[900ms]" style={{ opacity: loaded ? 1 : 0 }}>
          <div style={{ width: '32px', height: '1px', background: ec.line, margin: '0 auto 14px' }} />
          <div className="text-center">
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '12px', letterSpacing: '4px', ...embossStyle('md') }}>
              {typedText}<span className="animate-pulse" style={{ color: ec.line }}>|</span>
            </div>
            <div className="mt-2 transition-all duration-500 delay-[2000ms]" style={{ opacity: loaded ? 1 : 0 }}>
              <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '3px', ...embossStyle('sm') }}>{dayOfWeek}</div>
            </div>
            {venueName && (
              <div className="mt-3" style={{ fontFamily: "'Okticon', serif", fontSize: '11px', fontStyle: 'italic', ...embossStyle('sm') }}>{venueName}</div>
            )}
          </div>
        </div>
        {scrollHint}
      </div>
    )
  }

  // ── 기본 (이미지 없거나 알 수 없는 디자인): 기존 텍스트 전용 ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: theme.background }}>
      {/* Decorative top line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-[2000ms]" style={{ width: '1px', height: loaded ? '80px' : '0px', background: theme.divider }} />

      {/* Top label */}
      <div className="transition-all duration-1000 delay-200" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-20px)' }}>
        <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '11px', letterSpacing: '6px', color: theme.gray, marginBottom: '48px', textAlign: 'center' }}>{coverTitle}</div>
      </div>

      {/* Names - full names in elegant layout */}
      <div className="text-center relative z-10">
        <div className="transition-all duration-[1200ms] delay-300" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '28px', fontWeight: 200, letterSpacing: '12px', lineHeight: 1.2, color: theme.heading }}>{groomName}</div>
        </div>

        <div className="my-6 transition-all duration-[1500ms] delay-500" style={{ opacity: loaded ? 1 : 0 }}>
          <div className="relative inline-block">
            <div className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontStyle: 'italic', color: theme.accent, lineHeight: 1 }}>&</div>
          </div>
        </div>

        <div className="transition-all duration-[1200ms] delay-700" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '28px', fontWeight: 200, letterSpacing: '12px', lineHeight: 1.2, color: theme.heading }}>{brideName}</div>
        </div>
      </div>

      {/* Decorative divider */}
      <div className="mt-12 mb-4 transition-all duration-[1800ms] delay-900" style={{ opacity: loaded ? 1 : 0 }}>
        <div style={{ width: '32px', height: '1px', background: theme.divider, margin: '0 auto' }} />
      </div>

      {/* Date + Day */}
      <div className="text-center transition-all duration-[1200ms] delay-[1100ms]" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)' }}>
        <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '12px', letterSpacing: '4px', color: theme.accent }}>
          {typedText}<span className="animate-pulse" style={{ color: theme.divider }}>|</span>
        </div>
        <div className="mt-2 transition-all duration-500 delay-[2000ms]" style={{ opacity: loaded ? 1 : 0 }}>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '3px', color: theme.gray }}>{dayOfWeek}</div>
        </div>
      </div>
      {scrollHint}
    </div>
  )
}

// ====================================================================
// GREETING SECTION - 인사말 (대담한 첫 글자 + 라인 스태거)
// ====================================================================
function GreetingSection({ data, theme }: { data: any; theme: ThemeConfig }) {
  const { ref, isVisible } = useScrollReveal(0.2)
  const text = data.greeting || ''
  const lines = text.split('\n')

  return (
    <div ref={ref} className="px-8 py-24" style={{ background: theme.background }}>
      <div className="max-w-sm mx-auto">
        {/* Label */}
        <div className="text-center mb-12 transition-all duration-500" style={{ opacity: isVisible ? 1 : 0 }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', letterSpacing: '5px', color: theme.accent }}>INVITATION</div>
        </div>

        {/* 인사말 본문 */}
        {lines.length > 0 && (
          <div>
            {lines.map((line: string, i: number) => (
              <p key={i} className="es-f15 transition-all duration-600 ease-out" style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '15px', lineHeight: 2.4,
                color: theme.text,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: `${200 + i * 80}ms`,
              }}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ====================================================================
// CHAPTER SECTION - 스토리 챕터 (로마 숫자 + 세로 타이틀 + 본문)
// ====================================================================
function ChapterSection({ chapter, index, theme }: { chapter: any; index: number; theme: ThemeConfig }) {
  const { ref, isVisible } = useScrollReveal(0.15)
  const lines = (chapter.body || '').split('\n')
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V']

  return (
    <div ref={ref} className="py-20 relative" style={{ background: index % 2 === 0 ? theme.background : theme.sectionBg }}>
      {/* Background chapter number watermark */}
      <div className="absolute top-4 right-4 pointer-events-none transition-all duration-1000 ease-out" style={{
        fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '120px', fontWeight: 700,
        color: theme.heading, opacity: isVisible ? 0.04 : 0, lineHeight: 1,
        transform: isVisible ? 'translateX(0)' : 'translateX(60px)',
      }}>
        {romanNumerals[index] || `${index + 1}`}
      </div>

      <div className="px-8 relative z-10">
        <div className="max-w-sm mx-auto">
          {/* Chapter header with vertical title */}
          <div className="flex gap-6 mb-8">
            {/* Vertical Korean title */}
            <div className="transition-all duration-800 ease-out flex-shrink-0" style={{
              writingMode: 'vertical-rl',
              fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 700,
              color: theme.heading, letterSpacing: '6px',
              transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
              opacity: isVisible ? 1 : 0,
            }}>
              {chapter.title}
            </div>

            {/* Right side: subtitle + body */}
            <div className="flex-1 pt-2">
              {/* English subtitle */}
              {chapter.subtitle && (
                <div className="transition-all duration-700 ease-out" style={{
                  fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '11px', fontStyle: 'italic',
                  color: theme.gray, letterSpacing: '3px', marginBottom: '8px',
                  transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
                  opacity: isVisible ? 1 : 0,
                }}>{chapter.subtitle}</div>
              )}

              {/* Accent line - extends from left */}
              <div className="transition-all duration-600" style={{
                width: '28px', height: '1px', background: theme.accent,
                marginBottom: '16px',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transitionDelay: '200ms',
              }} />

              {/* Body text - staggered line reveal */}
              {lines.map((line: string, j: number) => (
                  <p key={j} className="es-f14 transition-all duration-600 ease-out" style={{
                    fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 2.4,
                    color: theme.text,
                    opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                    transitionDelay: `${300 + j * 60}ms`,
                  }}>{line || '\u00A0'}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ====================================================================
// QUOTE SECTION - 인용문 (풀폭 대형 텍스트 + scale reveal)
// ====================================================================
function QuoteSection({ data, theme }: { data: any; theme: ThemeConfig }) {
  const { ref, isVisible } = useScrollReveal(0.25)
  const quote = data.quote
  if (!quote?.text) return null

  return (
    <div ref={ref} className="min-h-[60vh] flex items-center justify-center px-8" style={{ background: theme.quoteBg }}>
      <div className="text-center max-w-sm transition-all duration-1000 ease-out" style={{
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        opacity: isVisible ? 1 : 0,
      }}>
        {/* Large quotation mark */}
        <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '72px', color: theme.divider, lineHeight: 0.5 }}>&ldquo;</div>
        <div className="mt-4">
          {quote.text.split('\n').map((line: string, i: number) => (
            <p key={i} className="es-f18" style={{
              fontFamily: "'BonmyeongjoSourceHanSerif', serif",
              fontSize: '18px', fontWeight: 300, fontStyle: 'italic',
              lineHeight: 2.2, color: theme.heading,
            }}>{line || '\u00A0'}</p>
          ))}
        </div>
        {quote.author && (
          <div className="mt-8" style={{
            fontFamily: "'Pretendard', sans-serif", fontSize: '11px',
            color: theme.gray, letterSpacing: '2px',
          }}>— {quote.author}</div>
        )}
      </div>
    </div>
  )
}

// ====================================================================
// GALLERY SECTION - Default concept
// ====================================================================
function DefaultGallerySection({ data, theme }: { data: any; theme: ThemeConfig }) {
  const { ref, isVisible } = useScrollReveal(0.15)
  const images: string[] = data.gallery?.images || []
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (images.length === 0) return null

  return (
    <div ref={ref} style={{ padding: '60px 16px', background: theme.sectionBg }}>
      <div className="max-w-sm mx-auto" style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: '8px', fontWeight: 400,
          letterSpacing: '4px', color: theme.gray, textTransform: 'uppercase' as const,
          textAlign: 'center', marginBottom: '18px',
        }}>Gallery</div>
        <EssayGalleryGrid
          images={images}
          onImageClick={(i) => { setViewerIndex(i); setViewerOpen(true) }}
          colors={{ bg: theme.sectionBg, muted: theme.gray, accent: theme.accent }}
        />
      </div>
      {viewerOpen && (
        <EssayGalleryViewer images={images} startIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  )
}

// ====================================================================
// INTERVIEW SECTION - Q&A 모드
// ====================================================================
function InterviewSection({ interviews, theme }: { interviews: any[]; theme: ThemeConfig }) {
  if (!interviews || interviews.length === 0) return null

  return (
    <>
      {interviews.map((qa: any, i: number) => (
        <InterviewItem key={i} qa={qa} index={i} theme={theme} />
      ))}
    </>
  )
}

function InterviewItem({ qa, index, theme }: { qa: any; index: number; theme: ThemeConfig }) {
  const { ref, isVisible } = useScrollReveal(0.15)

  return (
    <div ref={ref} className="py-16" style={{ background: index % 2 === 0 ? theme.background : theme.sectionBg }}>
      <div className="px-8 max-w-sm mx-auto">
        {/* Question number */}
        <div className="transition-all duration-700" style={{
          fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px',
          letterSpacing: '4px', color: theme.accent, marginBottom: '12px',
          opacity: isVisible ? 1 : 0,
        }}>
          Q.{String(index + 1).padStart(2, '0')}
        </div>

        {/* Question - bold, large */}
        <h3 className="es-f18 transition-all duration-700" style={{
          fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 700,
          lineHeight: 1.6, color: theme.heading, marginBottom: '20px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
          transitionDelay: '100ms',
        }}>
          {qa.question}
        </h3>

        {/* Accent line */}
        <div className="transition-all duration-600" style={{
          width: '24px', height: '1px', background: theme.accent,
          marginBottom: '16px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transitionDelay: '300ms',
        }} />

        {/* Answer */}
        <div className="transition-all duration-700" style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: '400ms',
        }}>
          {(qa.answer || '').split('\n').map((line: string, j: number) => (
            <p key={j} className="es-f14" style={{
              fontFamily: "'Pretendard', sans-serif", fontSize: '14px',
              lineHeight: 2.4, color: theme.text,
            }}>{line || '\u00A0'}</p>
          ))}
        </div>

        {/* Answerer tag */}
        {qa.answerer && qa.answerer !== 'both' && (
          <div className="mt-4 text-right transition-all duration-500" style={{
            fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', fontStyle: 'italic',
            color: theme.gray, letterSpacing: '2px',
            opacity: isVisible ? 1 : 0, transitionDelay: '600ms',
          }}>
            — {qa.answerer === 'groom' ? '신랑' : '신부'}
          </div>
        )}
      </div>
    </div>
  )
}

// ====================================================================
// SHARED COMMON SECTIONS
// ====================================================================
function WeddingInfoSection({ data, theme }: { data: any; theme: ThemeConfig }) {
  const w = data.wedding || {}; const groom = data.groom || {}; const bride = data.bride || {}
  const weddingDate = w.date ? new Date(w.date) : new Date()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return (
    <ScrollSection>
      <div className="px-8 py-16" style={{ backgroundColor: theme.background }}>
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-10">
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '5px', color: theme.accent, marginBottom: '12px' }}>WEDDING DAY</div>
            <div className="flex items-center justify-center gap-3 py-2">
              <div style={{ width: '40px', height: '0.5px', background: theme.divider }} />
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill={theme.divider} /></svg>
              <div style={{ width: '40px', height: '0.5px', background: theme.divider }} />
            </div>
          </div>
          <div className="text-center mb-8">
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '48px', fontWeight: 300, color: theme.heading, lineHeight: 1 }}>{weddingDate.getDate()}</div>
            <div className="es-f13" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: theme.gray, marginTop: '8px' }}>{weddingDate.getFullYear()}년 {weddingDate.getMonth() + 1}월 {dayNames[weddingDate.getDay()]}요일</div>
            <div className="es-f13" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: theme.text, marginTop: '4px' }}>{w.timeDisplay || ''}</div>
          </div>
          <div className="text-center py-6" style={{ borderTop: `0.5px solid ${theme.divider}`, borderBottom: `0.5px solid ${theme.divider}` }}>
            <div className="es-f16" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 600, color: theme.heading }}>{w.venue?.name || ''}</div>
            {w.venue?.hall && !w.venue?.hideHall && <div className="es-f13" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: theme.text, marginTop: '4px' }}>{w.venue.hall}</div>}
            <div className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: theme.gray, marginTop: '8px' }}>{w.venue?.address || ''}</div>
          </div>
          {data.sectionVisibility?.parentNames !== false && (groom.father?.name || groom.mother?.name || bride.father?.name || bride.mother?.name) && (
            <div className="mt-8 grid grid-cols-2 gap-6 text-center">
              {['groom', 'bride'].map(side => {
                const p = side === 'groom' ? groom : bride
                return (
                  <div key={side}>
                    <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', letterSpacing: '3px', color: theme.gray, marginBottom: '10px' }}>{side.toUpperCase()}</div>
                    <p className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: theme.gray, lineHeight: 1.8 }}>
                      {p.father?.name && <>{p.father.deceased ? (data.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{p.father.name} · </>}{p.mother?.name && <>{p.mother.deceased ? (data.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{p.mother.name}</>}
                    </p>
                    <p className="es-f11" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: theme.gray, marginTop: '2px' }}>의 {side === 'groom' ? '아들' : '딸'}</p>
                    <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 500, color: theme.heading, marginTop: '4px' }}>{p.name || ''}</p>
                  </div>
                )
              })}
            </div>
          )}
          {w.venue?.address && (
            <div className="mt-10">
              <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '4px', color: theme.gray, marginBottom: '12px', textAlign: 'center' }}>MAP</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { href: `https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}`, bg: '#03C75A', label: 'N', name: 'NAVER' },
                  { href: `https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}`, bg: '#FEE500', label: 'K', name: 'KAKAO', dark: true },
                  { href: `tmap://search?name=${encodeURIComponent(w.venue?.name || '')}`, bg: '#4285F4', label: 'T', name: 'TMAP' },
                ].map(m => (
                  <a key={m.name} href={m.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3" style={{ border: `0.5px solid ${theme.divider}` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: m.bg }}><span className={`text-xs font-bold ${m.dark ? 'text-black' : 'text-white'}`}>{m.label}</span></div>
                    <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', letterSpacing: '1px', color: theme.gray }}>{m.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          {w.directions && (w.directions.car || w.directions.publicTransport) && (
            <div className="mt-10">
              <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 600, color: theme.heading, marginBottom: '12px', textAlign: 'center' }}>오시는 길</div>
              <div className="space-y-4">
                {[{ key: 'car', label: '자가용 이용시' }, { key: 'publicTransport', label: '대중교통 이용시' }].map(d => w.directions[d.key] && (
                  <div key={d.key} style={{ padding: '12px 16px', background: theme.sectionBg, borderLeft: `2px solid ${theme.accent}` }}>
                    <div className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: theme.accent, marginBottom: '6px' }}>{d.label}</div>
                    {w.directions[d.key].split('\n').map((line: string, i: number) => <p key={i} className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', lineHeight: 1.7, color: theme.gray }}>{line}</p>)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollSection>
  )
}

function ContactsSection({ data, theme }: { data: any; theme: ThemeConfig }) {
  const groom = data.groom || {}; const bride = data.bride || {}
  const hasContacts = groom.phone || bride.phone || (groom.father?.phoneEnabled && groom.father?.phone) || (groom.mother?.phoneEnabled && groom.mother?.phone) || (bride.father?.phoneEnabled && bride.father?.phone) || (bride.mother?.phoneEnabled && bride.mother?.phone)
  const ContactButton = ({ label, phone }: { label: string; phone: string }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `0.5px solid ${theme.divider}` }}>
      <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: theme.text }}>{label}</span>
      <div className="flex items-center gap-2">
        {[{ href: `tel:${phone}`, icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z' },
          { href: `sms:${phone}`, icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' }
        ].map((a, i) => (
          <a key={i} href={a.href} className="flex items-center justify-center w-8 h-8 rounded-full" style={{ border: `0.5px solid ${theme.accent}` }}>
            <svg className="w-4 h-4" fill="none" stroke={theme.accent} viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
          </a>
        ))}
      </div>
    </div>
  )
  const contacts = [
    groom.phoneEnabled !== false && groom.phone && { label: `신랑 ${groom.name || ''}`, phone: groom.phone },
    groom.father?.phoneEnabled && groom.father?.phone && { label: `신랑측 아버지 ${groom.father.name || ''}`, phone: groom.father.phone },
    groom.mother?.phoneEnabled && groom.mother?.phone && { label: `신랑측 어머니 ${groom.mother.name || ''}`, phone: groom.mother.phone },
    bride.phoneEnabled !== false && bride.phone && { label: `신부 ${bride.name || ''}`, phone: bride.phone },
    bride.father?.phoneEnabled && bride.father?.phone && { label: `신부측 아버지 ${bride.father.name || ''}`, phone: bride.father.phone },
    bride.mother?.phoneEnabled && bride.mother?.phone && { label: `신부측 어머니 ${bride.mother.name || ''}`, phone: bride.mother.phone },
  ].filter(Boolean)
  return (
    <ScrollSection>
      <div className="px-8 py-12" style={{ backgroundColor: theme.sectionBg }}>
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '5px', color: theme.gray, marginBottom: '8px' }}>CONTACT</div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: theme.heading }}>연락하기</h3>
          </div>
          {contacts.length > 0 ? (
            <div>{contacts.map((c: any, i: number) => <ContactButton key={i} label={c.label} phone={c.phone} />)}</div>
          ) : (
            <p className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: theme.gray }}>연락처 정보가 등록되면 이곳에 표시됩니다.</p>
          )}
        </div>
      </div>
    </ScrollSection>
  )
}

function BankAccountsSection({ data, theme }: { data: any; theme: ThemeConfig }) {
  const groom = data.groom || {}; const bride = data.bride || {}
  const [expandedSide, setExpandedSide] = useState<'groom' | 'bride' | null>(null)
  const hasAccounts = [groom.bank?.enabled, groom.father?.bank?.enabled, groom.mother?.bank?.enabled, bride.bank?.enabled, bride.father?.bank?.enabled, bride.mother?.bank?.enabled].some(Boolean)
  const renderAccounts = (side: 'groom' | 'bride') => {
    const person = side === 'groom' ? groom : bride
    return [person.bank?.enabled && { name: person.name, ...person.bank, role: side === 'groom' ? '신랑' : '신부' }, person.father?.bank?.enabled && { name: person.father.name, ...person.father.bank, role: '아버지' }, person.mother?.bank?.enabled && { name: person.mother.name, ...person.mother.bank, role: '어머니' }].filter(Boolean).map((acc: any, i: number) => (
      <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: `0.5px solid ${theme.divider}` }}>
        <div><span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: theme.gray }}>{acc.role}</span><span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: theme.text, marginLeft: '8px' }}>{acc.bank} {acc.account}</span></div>
        <button onClick={() => { navigator.clipboard.writeText(acc.account); alert('계좌번호가 복사되었습니다.') }} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '1px', color: theme.accent, background: 'none', border: `0.5px solid ${theme.accent}`, padding: '4px 12px', cursor: 'pointer' }}>COPY</button>
      </div>
    ))
  }
  return (
    <ScrollSection>
      <div className="px-8 py-12" style={{ backgroundColor: theme.sectionBg }}>
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '5px', color: theme.gray, marginBottom: '8px' }}>GIFT</div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: theme.heading }}>마음 전하실 곳</h3>
          </div>
          {hasAccounts ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(['groom', 'bride'] as const).map(side => (
                  <button key={side} onClick={() => setExpandedSide(expandedSide === side ? null : side)} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', letterSpacing: '1px', padding: '12px', border: `0.5px solid ${expandedSide === side ? theme.accent : theme.divider}`, background: expandedSide === side ? theme.accent : theme.cardBg, color: expandedSide === side ? '#FFF' : theme.text, cursor: 'pointer', transition: 'all 0.3s' }}>{side === 'groom' ? '신랑측' : '신부측'}</button>
                ))}
              </div>
              {expandedSide && <div style={{ padding: '12px 16px', background: theme.cardBg }}>{renderAccounts(expandedSide)}</div>}
            </>
          ) : (
            <p className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: theme.gray }}>계좌 정보가 등록되면 이곳에 표시됩니다.</p>
          )}
        </div>
      </div>
    </ScrollSection>
  )
}

function GuestbookSection({ data, invitationId, theme, isSample }: { data: any; invitationId: string; theme: ThemeConfig; isSample?: boolean }) {
  const sampleMessages = data.content?.sampleGuestbook || []
  const [messages, setMessages] = useState<any[]>(isSample ? sampleMessages : [])
  const [name, setName] = useState(''); const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false); const [showAll, setShowAll] = useState(false)
  const questions: string[] = data.content?.guestbookQuestions || ['두 사람에게 축하 메시지를 남겨주세요']
  const [currentQ, setCurrentQ] = useState(0)
  useEffect(() => { if (isSample) return; fetch(`/api/guestbook?invitationId=${invitationId}`).then(r => r.json()).then((d: any) => setMessages(d.messages || d.data || [])).catch(() => {}) }, [invitationId, isSample])
  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return
    if (isSample) { setMessages(prev => [{ id: `s-${Date.now()}`, guest_name: name.trim(), message: message.trim(), created_at: new Date().toISOString() }, ...prev]); setName(''); setMessage(''); return }
    setSubmitting(true)
    try { const res = await fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId, guestName: name.trim(), message: message.trim(), question: questions[currentQ] || null }) }); if (res.ok) { const d = await res.json() as any; setMessages(prev => [d.data || d, ...prev]); setName(''); setMessage('') } } catch {}
    setSubmitting(false)
  }
  const visible = showAll ? messages : messages.slice(0, 3)
  return (
    <ScrollSection>
      <div className="px-8 py-12" style={{ backgroundColor: theme.background }}>
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '5px', color: theme.gray, marginBottom: '8px' }}>MESSAGES</div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: theme.heading }}>방명록</h3>
          </div>
          <p className="text-center mb-6" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 500, color: theme.heading }}>{questions[currentQ]}</p>
          {questions.length > 1 && <button onClick={() => setCurrentQ((currentQ + 1) % questions.length)} className="block mx-auto mb-4" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: theme.gray, background: 'none', border: 'none', cursor: 'pointer' }}>다른 질문 보기 →</button>}
          <div className="space-y-3 mb-8">
            <input value={name} onChange={e => setName(e.target.value)} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} placeholder="이름" maxLength={20} className="w-full px-4 py-3 text-sm outline-none" style={{ border: `0.5px solid ${theme.divider}`, background: theme.cardBg, color: theme.text }} />
            <textarea value={message} onChange={e => setMessage(e.target.value)} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} placeholder="축하 메시지를 남겨주세요" rows={3} maxLength={500} className="w-full px-4 py-3 text-sm outline-none resize-none" style={{ border: `0.5px solid ${theme.divider}`, background: theme.cardBg, color: theme.text }} />
            <button onClick={handleSubmit} disabled={submitting || !name.trim() || !message.trim()} className="w-full py-3 text-sm font-medium disabled:opacity-50" style={{ background: theme.accent, color: '#FFF' }}>{submitting ? '등록 중...' : '메시지 남기기'}</button>
          </div>
          {visible.length > 0 && <div className="space-y-3">
            {visible.map((m: any) => (
              <div key={m.id} className="p-4" style={{ background: theme.sectionBg }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 600, color: theme.heading }}>{m.guest_name}</span>
                  <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', color: theme.gray }}>{new Date(m.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 1.7, color: theme.text }}>{m.message}</p>
              </div>
            ))}
            {!showAll && messages.length > 3 && <button onClick={() => setShowAll(true)} className="w-full py-3 text-sm" style={{ color: theme.gray, background: 'none', border: `0.5px solid ${theme.divider}`, cursor: 'pointer' }}>더 보기 ({messages.length - 3}개)</button>}
          </div>}
        </div>
      </div>
    </ScrollSection>
  )
}

function RsvpSection({ data, invitationId, theme }: { data: any; invitationId: string; theme: ThemeConfig }) {
  return (
    <ScrollSection>
      <div className="px-8 py-12" style={{ backgroundColor: theme.sectionBg }}>
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '5px', color: theme.gray, marginBottom: '8px' }}>RSVP</div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: theme.heading }}>참석 여부</h3>
            {data.rsvpDeadline && <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: theme.gray, marginTop: '8px' }}>{new Date(data.rsvpDeadline).toLocaleDateString('ko-KR')}까지 알려주세요</p>}
          </div>
          <RsvpForm invitationId={invitationId} primaryColor={theme.accent} showMealOption={data.rsvpMealOption} showShuttleOption={data.rsvpShuttleOption} showPhoneOption={data.rsvpPhoneOption} showSideDetail={data.rsvpSideDetail} sideDetailOptions={data.rsvpSideDetailOptions} notice={data.rsvpNotice} messagePlaceholder={data.rsvpMessagePlaceholder} />
        </div>
      </div>
    </ScrollSection>
  )
}

function ThankYouSection({ data, theme }: { data: any; theme: ThemeConfig }) {
  const ty = data.thankYou; if (!ty?.message) return null
  return (
    <ScrollSection>
      <div className="px-8 py-20" style={{ backgroundColor: theme.background }}>
        <div className="max-w-sm mx-auto text-center">
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '5px', color: theme.accent, marginBottom: '20px' }}>THANK YOU</div>
          <div className="mt-8">{ty.message.split('\n').map((line: string, i: number) => <p key={i} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 2.2, color: theme.text }}>{line || '\u00A0'}</p>)}</div>
          {ty.sign && <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: theme.gray, marginTop: '24px' }}>{ty.sign}</div>}
        </div>
      </div>
    </ScrollSection>
  )
}

// 스크롤 힌트 오버레이 (default/paper 컨셉용 - 페이지 스크롤 기반)
function ScrollHintOverlay({ theme }: { theme: ThemeConfig }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) setShow(false)
      else setShow(true)
    }
    // 초기 체크: 스크롤 가능한지 확인
    requestAnimationFrame(() => {
      if (document.documentElement.scrollHeight <= window.innerHeight + 10) {
        setShow(false)
      }
    })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="essay-scroll-hint-overlay" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      paddingBottom: '28px', height: '100px',
      background: `linear-gradient(transparent 0%, ${theme.background} 50%)`,
      pointerEvents: 'none',
      opacity: show ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      <span style={{
        fontSize: '18px', fontWeight: 200, color: theme.accent,
        display: 'inline-block',
        animation: 'bkScrollBob 2.5s ease-in-out infinite',
      }}>↓</span>
    </div>
  )
}

function EssayFooter({ theme }: { theme: ThemeConfig }) {
  return (
    <div className="py-8 text-center" style={{ backgroundColor: theme.background }}>
      <div style={{ width: '1px', height: '30px', background: theme.divider, margin: '0 auto 16px' }} />
      <p style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', letterSpacing: '3px', color: theme.gray }}>DEAR DRAWER</p>
    </div>
  )
}

// ====================================================================
// PAPER CONCEPT - "우리의 에세이" 종이 질감 미니멀 컨셉
// 가독성 최우선 · 과한 애니메이션 금지 · transform+opacity만 사용
// ====================================================================

const paperColors = {
  bg: '#F6F1EA',
  paper: '#FAF7F2',
  text: '#3A2F2A',
  charcoal: '#2B2B2B',
  accent: '#D8CEC4',
  muted: '#9A8E84',
  dustyRose: '#C4A69A',
  mutedBlue: '#8A9AAE',
}

// Grain overlay: SVG-based noise texture at 2-3% opacity
const grainOverlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
  opacity: 0.025,
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: '128px 128px',
}

// Typing hook for date
function useTypingEffect(text: string, speed = 35, startDelay = 600) {
  const [typed, setTyped] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  useEffect(() => {
    let i = 0
    const delayTimer = setTimeout(() => {
      const timer = setInterval(() => {
        if (i <= text.length) { setTyped(text.substring(0, i)); i++ }
        else { clearInterval(timer); setTimeout(() => setShowCursor(false), 1000) }
      }, speed)
      return () => clearInterval(timer)
    }, startDelay)
    return () => clearTimeout(delayTimer)
  }, [text, speed, startDelay])
  return { typed, showCursor }
}

// Paper scroll reveal - 30% threshold, only translateY(12) + opacity
function usePaperReveal() {
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  useEffect(() => { return () => { observerRef.current?.disconnect() } }, [])
  const ref = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    observer.observe(node)
    observerRef.current = observer
  }, [])
  return { ref, isVisible }
}

const paperTransition = 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'

function PaperReveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = usePaperReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
      transition: paperTransition,
      transitionDelay: `${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// -- Paper: IntroCover --
function PaperCover({ data, onOpen }: { data: any; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const weddingDate = data.wedding?.date ? new Date(data.wedding.date) : new Date()
  const dateStr = `${weddingDate.getFullYear()}.${String(weddingDate.getMonth() + 1).padStart(2, '0')}.${String(weddingDate.getDate()).padStart(2, '0')}`

  useEffect(() => { setTimeout(() => setLoaded(true), 100) }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative cursor-pointer"
      style={{ background: paperColors.bg }}
      onClick={onOpen}
    >
      <div className="text-center" style={{
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(12px)',
        transition: paperTransition,
      }}>
        <div style={{
          fontFamily: "'Pretendard', sans-serif",
          fontSize: '12px', letterSpacing: '6px', color: paperColors.muted,
          marginBottom: '32px',
        }}>
          우리의 에세이
        </div>
        <div style={{
          fontFamily: "'BonmyeongjoSourceHanSerif', serif",
          fontSize: '22px', fontWeight: 400, color: paperColors.text,
          lineHeight: 1.8, letterSpacing: '2px',
        }}>
          {groomName} & {brideName}
        </div>
        <div style={{
          fontFamily: "'BonmyeongjoSourceHanSerif', serif",
          fontSize: '13px', color: paperColors.muted,
          marginTop: '8px', letterSpacing: '3px',
        }}>
          {dateStr}
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2" style={{
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.6s',
        transitionDelay: '1.2s',
      }}>
        <div style={{
          fontFamily: "'Pretendard', sans-serif",
          fontSize: '11px', color: paperColors.muted,
          letterSpacing: '2px',
        }}>
          Tap to open
        </div>
      </div>
    </div>
  )
}

// -- Paper: EssayPage (Chapter) --
function PaperEssayPage({ chapter, index }: { chapter: any; index: number }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: paperColors.paper }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '80px 32px' }}>
        <PaperReveal>
          <div style={{
            fontFamily: "'BonmyeongjoSourceHanSerif', serif",
            fontSize: '10px', letterSpacing: '5px', color: paperColors.muted,
            marginBottom: '24px',
          }}>
            CHAPTER {String(index + 1).padStart(2, '0')}
          </div>
        </PaperReveal>

        <PaperReveal delay={100}>
          <h2 style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '20px', fontWeight: 600, color: paperColors.charcoal,
            lineHeight: 1.6, marginBottom: '32px',
          }}>
            {chapter.title}
          </h2>
        </PaperReveal>

        {chapter.subtitle && (
          <PaperReveal delay={150}>
            <div style={{
              fontFamily: "'BonmyeongjoSourceHanSerif', serif",
              fontSize: '12px', fontStyle: 'italic', color: paperColors.muted,
              letterSpacing: '2px', marginBottom: '24px',
            }}>
              {chapter.subtitle}
            </div>
          </PaperReveal>
        )}

        <PaperReveal delay={200}>
          <div style={{
            width: '24px', height: '1px', background: paperColors.accent,
            marginBottom: '28px',
          }} />
        </PaperReveal>

        {(chapter.body || '').split('\n').map((line: string, j: number) => (
          <PaperReveal key={j} delay={250 + j * 40}>
            <p className="es-f16" style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '16px', lineHeight: 1.8, color: paperColors.text,
              marginBottom: line.trim() === '' ? '16px' : '0',
            }}>
              {line || '\u00A0'}
            </p>
          </PaperReveal>
        ))}
      </div>
    </div>
  )
}

// -- Paper: Greeting --
function PaperGreeting({ text }: { text: string }) {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', background: paperColors.bg }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '80px 32px' }}>
        {text.split('\n').map((line, i) => (
          <PaperReveal key={i} delay={i * 60}>
            <p className="es-f17" style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '17px', lineHeight: 1.85, color: paperColors.text,
              textAlign: 'center',
            }}>
              {line || '\u00A0'}
            </p>
          </PaperReveal>
        ))}
      </div>
    </div>
  )
}

// -- Paper: Quote --
function PaperQuote({ quote }: { quote: any }) {
  if (!quote?.text) return null
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', background: paperColors.bg }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <PaperReveal>
          <div style={{
            width: '32px', height: '1px', background: paperColors.accent,
            margin: '0 auto 28px',
          }} />
        </PaperReveal>
        {quote.text.split('\n').map((line: string, i: number) => (
          <PaperReveal key={i} delay={100 + i * 60}>
            <p className="es-f17" style={{
              fontFamily: "'BonmyeongjoSourceHanSerif', serif",
              fontSize: '17px', fontStyle: 'italic', fontWeight: 300,
              lineHeight: 2, color: paperColors.charcoal,
            }}>
              {line || '\u00A0'}
            </p>
          </PaperReveal>
        ))}
        {quote.author && (
          <PaperReveal delay={300}>
            <div style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '11px', color: paperColors.muted,
              marginTop: '20px', letterSpacing: '1px',
            }}>
              — {quote.author}
            </div>
          </PaperReveal>
        )}
      </div>
    </div>
  )
}

// -- Paper: Gallery --
function PaperGallery({ data }: { data: any }) {
  const images: string[] = data.gallery?.images || []
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (images.length === 0) return null

  return (
    <div style={{ minHeight: '50vh', padding: '60px 16px', background: paperColors.bg }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <PaperReveal>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: '8px', fontWeight: 400,
            letterSpacing: '4px', color: paperColors.muted, textTransform: 'uppercase' as const,
            textAlign: 'center', marginBottom: '18px',
          }}>Gallery</div>
        </PaperReveal>
        <PaperReveal delay={100}>
          <EssayGalleryGrid
            images={images}
            onImageClick={(i) => { setViewerIndex(i); setViewerOpen(true) }}
            colors={{ bg: paperColors.bg, muted: paperColors.muted, accent: paperColors.accent }}
          />
        </PaperReveal>
      </div>
      {viewerOpen && (
        <EssayGalleryViewer images={images} startIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  )
}

// -- Paper: InvitationInfo --
function PaperInvitationInfo({ data }: { data: any }) {
  const w = data.wedding || {}
  const groom = data.groom || {}
  const bride = data.bride || {}
  const weddingDate = w.date ? new Date(w.date) : new Date()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const { typed, showCursor } = useTypingEffect(
    `${weddingDate.getFullYear()}.${String(weddingDate.getMonth() + 1).padStart(2, '0')}.${String(weddingDate.getDate()).padStart(2, '0')}`,
    35, 300
  )

  return (
    <div style={{ background: paperColors.paper }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <PaperReveal>
          <div style={{ width: '100%', height: '1px', background: paperColors.accent, marginBottom: '40px' }} />
        </PaperReveal>

        <PaperReveal delay={100}>
          <div style={{
            fontFamily: "'BonmyeongjoSourceHanSerif', serif",
            fontSize: '11px', letterSpacing: '4px', color: paperColors.muted,
            marginBottom: '24px',
          }}>
            {typed}{showCursor && <span style={{ animation: 'blink 0.8s step-end infinite' }}>|</span>}
          </div>
        </PaperReveal>

        <PaperReveal delay={200}>
          <div className="es-f15" style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '15px', lineHeight: 2, color: paperColors.text,
          }}>
            <div>{weddingDate.getFullYear()}년 {weddingDate.getMonth() + 1}월 {weddingDate.getDate()}일 {dayNames[weddingDate.getDay()]}요일</div>
            <div>{w.timeDisplay || ''}</div>
          </div>
        </PaperReveal>

        <PaperReveal delay={300}>
          <div style={{ marginTop: '28px' }}>
            <div className="es-f16" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 600, color: paperColors.charcoal }}>{w.venue?.name || ''}</div>
            {w.venue?.hall && !w.venue?.hideHall && <div className="es-f13" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: paperColors.text, marginTop: '4px' }}>{w.venue.hall}</div>}
            <div className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: paperColors.muted, marginTop: '8px' }}>{w.venue?.address || ''}</div>
          </div>
        </PaperReveal>

        {data.sectionVisibility?.parentNames !== false && (groom.father?.name || groom.mother?.name || bride.father?.name || bride.mother?.name) && (
          <PaperReveal delay={400}>
            <div className="mt-10 grid grid-cols-2 gap-8 text-center">
              {['groom', 'bride'].map(side => {
                const p = side === 'groom' ? groom : bride
                return (
                  <div key={side}>
                    <p className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: paperColors.muted, lineHeight: 1.8 }}>
                      {p.father?.name && <>{p.father.deceased ? (data.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{p.father.name} · </>}{p.mother?.name && <>{p.mother.deceased ? (data.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{p.mother.name}</>}
                    </p>
                    <p className="es-f11" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: paperColors.muted, marginTop: '2px' }}>의 {side === 'groom' ? '아들' : '딸'}</p>
                    <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 500, color: paperColors.charcoal, marginTop: '4px' }}>{p.name || ''}</p>
                  </div>
                )
              })}
            </div>
          </PaperReveal>
        )}

        {w.venue?.address && (
          <PaperReveal delay={500}>
            <div className="mt-10">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { href: `https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}`, bg: '#03C75A', label: 'N', name: '네이버' },
                  { href: `https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}`, bg: '#FEE500', label: 'K', name: '카카오', dark: true },
                  { href: `tmap://search?name=${encodeURIComponent(w.venue?.name || '')}`, bg: '#4285F4', label: 'T', name: '티맵' },
                ].map(m => (
                  <a key={m.name} href={m.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3" style={{ border: `1px solid ${paperColors.accent}`, borderRadius: '4px' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center mb-1" style={{ background: m.bg }}><span className={`text-xs font-bold ${m.dark ? 'text-black' : 'text-white'}`}>{m.label}</span></div>
                    <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', color: paperColors.muted }}>{m.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </PaperReveal>
        )}

        {w.directions && (w.directions.car || w.directions.publicTransport) && (
          <PaperReveal delay={600}>
            <div className="mt-8 space-y-4 text-left">
              {[{ key: 'car', label: '자가용' }, { key: 'publicTransport', label: '대중교통' }].map(d => w.directions[d.key] && (
                <div key={d.key} style={{ padding: '12px 16px', borderLeft: `2px solid ${paperColors.dustyRose}`, background: paperColors.bg }}>
                  <div className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 600, color: paperColors.dustyRose, marginBottom: '6px' }}>{d.label}</div>
                  {w.directions[d.key].split('\n').map((line: string, i: number) => <p key={i} className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', lineHeight: 1.7, color: paperColors.muted }}>{line}</p>)}
                </div>
              ))}
            </div>
          </PaperReveal>
        )}
      </div>
    </div>
  )
}

// -- Paper: RSVP - 문장형 UI --
function PaperRsvp({ data, invitationId }: { data: any; invitationId: string }) {
  const [selected, setSelected] = useState<'attend' | 'decline' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [mealAttendance, setMealAttendance] = useState<'' | 'yes' | 'no'>('')
  const [shuttleBus, setShuttleBus] = useState<'' | 'yes' | 'no'>('')

  const handleSubmit = async () => {
    if (!selected || !name.trim()) return
    try {
      await fetch('/api/rsvp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, guestName: name.trim(), attendance: selected === 'attend' ? 'yes' : 'no', guestCount: 1, message: '', mealAttendance: selected === 'attend' && mealAttendance ? mealAttendance : undefined, shuttleBus: selected === 'attend' && shuttleBus ? shuttleBus : undefined }),
      })
    } catch {}
    setSubmitted(true)
  }

  return (
    <div style={{ background: paperColors.bg }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <PaperReveal>
          <div style={{ width: '100%', height: '1px', background: paperColors.accent, marginBottom: '40px' }} />
        </PaperReveal>

        {submitted ? (
          <PaperReveal>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 1.85, color: paperColors.text }}>
              감사합니다.<br />소중한 마음을 전해주셨습니다.
            </p>
          </PaperReveal>
        ) : (
          <>
            <PaperReveal>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 1.85, color: paperColors.text, marginBottom: data.rsvpNotice ? '16px' : '32px' }}>
                참석 여부를 알려주시면<br />저희의 다음 문장을 준비하겠습니다.
              </p>
              {data.rsvpNotice && (
                <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: paperColors.muted, marginBottom: '32px', lineHeight: 1.6, textAlign: 'center', whiteSpace: 'pre-line' }}>{data.rsvpNotice}</p>
              )}
            </PaperReveal>

            <PaperReveal delay={100}>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="이름"
                maxLength={20}
                style={{
                  width: '100%', maxWidth: '280px', padding: '12px 16px',
                  fontFamily: "'Pretendard', sans-serif", fontSize: '14px',
                  color: paperColors.text, background: 'transparent',
                  border: `1px solid ${paperColors.accent}`, borderRadius: '4px',
                  outline: 'none', textAlign: 'center', marginBottom: '20px',
                }}
              />
            </PaperReveal>

            <PaperReveal delay={200}>
              <div className="flex flex-col gap-3" style={{ maxWidth: '280px', margin: '0 auto' }}>
                <button
                  onClick={() => setSelected('attend')}
                  style={{
                    fontFamily: "'Pretendard', sans-serif", fontSize: '14px',
                    padding: '14px 24px', cursor: 'pointer',
                    color: selected === 'attend' ? '#FFF' : paperColors.text,
                    background: selected === 'attend' ? paperColors.dustyRose : 'transparent',
                    border: `1px solid ${selected === 'attend' ? paperColors.dustyRose : paperColors.accent}`,
                    borderRadius: '4px',
                    transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                  }}
                >
                  함께하겠습니다
                </button>
                <button
                  onClick={() => setSelected('decline')}
                  style={{
                    fontFamily: "'Pretendard', sans-serif", fontSize: '14px',
                    padding: '14px 24px', cursor: 'pointer',
                    color: selected === 'decline' ? '#FFF' : paperColors.text,
                    background: selected === 'decline' ? paperColors.muted : 'transparent',
                    border: `1px solid ${selected === 'decline' ? paperColors.muted : paperColors.accent}`,
                    borderRadius: '4px',
                    transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                  }}
                >
                  마음으로 축하합니다
                </button>
              </div>
            </PaperReveal>

            {selected === 'attend' && data.rsvpMealOption && (
              <PaperReveal delay={0}>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: paperColors.muted, marginBottom: '8px' }}>식사 여부</p>
                  <div className="flex gap-3" style={{ maxWidth: '280px', margin: '0 auto' }}>
                    {([{ v: 'yes' as const, l: '식사 예정' }, { v: 'no' as const, l: '식사 안 함' }]).map(opt => (
                      <button key={opt.v} onClick={() => setMealAttendance(mealAttendance === opt.v ? '' : opt.v)}
                        style={{ flex: 1, fontFamily: "'Pretendard', sans-serif", fontSize: '14px', padding: '14px 24px', cursor: 'pointer', color: mealAttendance === opt.v ? '#FFF' : paperColors.text, background: mealAttendance === opt.v ? paperColors.dustyRose : 'transparent', border: `1px solid ${mealAttendance === opt.v ? paperColors.dustyRose : paperColors.accent}`, borderRadius: '4px', transition: 'all 0.2s' }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              </PaperReveal>
            )}
            {selected === 'attend' && data.rsvpShuttleOption && (
              <PaperReveal delay={0}>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: paperColors.muted, marginBottom: '8px' }}>대절버스 이용 여부</p>
                  <div className="flex gap-3" style={{ maxWidth: '280px', margin: '0 auto' }}>
                    {([{ v: 'yes' as const, l: '이용 예정' }, { v: 'no' as const, l: '이용 안 함' }]).map(opt => (
                      <button key={opt.v} onClick={() => setShuttleBus(shuttleBus === opt.v ? '' : opt.v)}
                        style={{ flex: 1, fontFamily: "'Pretendard', sans-serif", fontSize: '14px', padding: '14px 24px', cursor: 'pointer', color: shuttleBus === opt.v ? '#FFF' : paperColors.text, background: shuttleBus === opt.v ? paperColors.dustyRose : 'transparent', border: `1px solid ${shuttleBus === opt.v ? paperColors.dustyRose : paperColors.accent}`, borderRadius: '4px', transition: 'all 0.2s' }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              </PaperReveal>
            )}
            {selected && name.trim() && (
              <PaperReveal delay={0}>
                <button
                  onClick={handleSubmit}
                  style={{
                    fontFamily: "'Pretendard', sans-serif", fontSize: '13px',
                    marginTop: '20px', padding: '10px 32px', cursor: 'pointer',
                    color: paperColors.muted, background: 'transparent',
                    border: `1px solid ${paperColors.accent}`, borderRadius: '4px',
                    letterSpacing: '1px',
                  }}
                >
                  전송하기
                </button>
              </PaperReveal>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// -- Paper: ThankYou --
function PaperThankYou({ data }: { data: any }) {
  const ty = data.thankYou
  if (!ty?.message) return null
  return (
    <div style={{ background: paperColors.paper }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '60px 32px', textAlign: 'center' }}>
        {ty.message.split('\n').map((line: string, i: number) => (
          <PaperReveal key={i} delay={i * 50}>
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 1.85, color: paperColors.text }}>{line || '\u00A0'}</p>
          </PaperReveal>
        ))}
        {ty.sign && (
          <PaperReveal delay={300}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: paperColors.muted, marginTop: '20px' }}>{ty.sign}</div>
          </PaperReveal>
        )}
      </div>
    </div>
  )
}

// -- Paper: Contacts --
function PaperContacts({ data }: { data: any }) {
  const groom = data.groom || {}; const bride = data.bride || {}
  const contacts = [
    groom.phoneEnabled !== false && groom.phone && { label: `신랑 ${groom.name || ''}`, phone: groom.phone },
    bride.phoneEnabled !== false && bride.phone && { label: `신부 ${bride.name || ''}`, phone: bride.phone },
    groom.father?.phoneEnabled && groom.father?.phone && { label: `신랑 아버지`, phone: groom.father.phone },
    groom.mother?.phoneEnabled && groom.mother?.phone && { label: `신랑 어머니`, phone: groom.mother.phone },
    bride.father?.phoneEnabled && bride.father?.phone && { label: `신부 아버지`, phone: bride.father.phone },
    bride.mother?.phoneEnabled && bride.mother?.phone && { label: `신부 어머니`, phone: bride.mother.phone },
  ].filter(Boolean)

  return (
    <div style={{ background: paperColors.bg }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '40px 32px' }}>
        <PaperReveal>
          <div style={{ width: '100%', height: '1px', background: paperColors.accent, marginBottom: '32px' }} />
        </PaperReveal>
        <PaperReveal delay={100}>
          <div className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', letterSpacing: '3px', color: paperColors.muted, marginBottom: '20px' }}>
            연락처
          </div>
        </PaperReveal>
        {contacts.length > 0 ? contacts.map((c: any, i: number) => (
          <PaperReveal key={i} delay={150 + i * 50}>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${paperColors.accent}` }}>
              <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: paperColors.text }}>{c.label}</span>
              <div className="flex items-center gap-2">
                <a href={`tel:${c.phone}`} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: paperColors.muted, padding: '4px 12px', border: `1px solid ${paperColors.accent}`, borderRadius: '4px', textDecoration: 'none' }}>
                  전화
                </a>
                <a href={`sms:${c.phone}`} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: paperColors.muted, padding: '4px 12px', border: `1px solid ${paperColors.accent}`, borderRadius: '4px', textDecoration: 'none' }}>
                  문자
                </a>
              </div>
            </div>
          </PaperReveal>
        )) : (
          <PaperReveal delay={150}>
            <p className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: paperColors.muted }}>연락처 정보가 등록되면 이곳에 표시됩니다.</p>
          </PaperReveal>
        )}
      </div>
    </div>
  )
}

// -- Paper: BankAccounts --
function PaperBankAccounts({ data }: { data: any }) {
  const groom = data.groom || {}; const bride = data.bride || {}
  const [expandedSide, setExpandedSide] = useState<'groom' | 'bride' | null>(null)
  const hasAccounts = [groom.bank?.enabled, groom.father?.bank?.enabled, groom.mother?.bank?.enabled, bride.bank?.enabled, bride.father?.bank?.enabled, bride.mother?.bank?.enabled].some(Boolean)

  const renderAccounts = (side: 'groom' | 'bride') => {
    const person = side === 'groom' ? groom : bride
    return [
      person.bank?.enabled && { name: person.name, ...person.bank, role: side === 'groom' ? '신랑' : '신부' },
      person.father?.bank?.enabled && { name: person.father.name, ...person.father.bank, role: '아버지' },
      person.mother?.bank?.enabled && { name: person.mother.name, ...person.mother.bank, role: '어머니' },
    ].filter(Boolean).map((acc: any, i: number) => (
      <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${paperColors.accent}` }}>
        <div>
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: paperColors.muted }}>{acc.role} </span>
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: paperColors.text }}>{acc.bank} {acc.account}</span>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(acc.account); alert('복사되었습니다.') }} style={{
          fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: paperColors.muted,
          background: 'transparent', border: `1px solid ${paperColors.accent}`, borderRadius: '4px',
          padding: '4px 12px', cursor: 'pointer',
        }}>복사</button>
      </div>
    ))
  }

  return (
    <div style={{ background: paperColors.paper }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '40px 32px' }}>
        <PaperReveal>
          <div className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', letterSpacing: '3px', color: paperColors.muted, marginBottom: '20px' }}>마음 전하실 곳</div>
        </PaperReveal>
        {hasAccounts ? (
          <>
            <PaperReveal delay={100}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(['groom', 'bride'] as const).map(side => (
                  <button key={side} onClick={() => setExpandedSide(expandedSide === side ? null : side)} style={{
                    fontFamily: "'Pretendard', sans-serif", fontSize: '13px',
                    padding: '12px', cursor: 'pointer', borderRadius: '4px',
                    border: `1px solid ${expandedSide === side ? paperColors.dustyRose : paperColors.accent}`,
                    background: expandedSide === side ? paperColors.dustyRose : 'transparent',
                    color: expandedSide === side ? '#FFF' : paperColors.text,
                    transition: 'all 0.2s',
                  }}>{side === 'groom' ? '신랑측' : '신부측'}</button>
                ))}
              </div>
            </PaperReveal>
            {expandedSide && <div>{renderAccounts(expandedSide)}</div>}
          </>
        ) : (
          <PaperReveal delay={100}>
            <p className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: paperColors.muted }}>계좌 정보가 등록되면 이곳에 표시됩니다.</p>
          </PaperReveal>
        )}
      </div>
    </div>
  )
}

// -- Paper: Guestbook --
function PaperGuestbook({ data, invitationId, isSample }: { data: any; invitationId: string; isSample?: boolean }) {
  const sampleMessages = data.content?.sampleGuestbook || []
  const [messages, setMessages] = useState<any[]>(isSample ? sampleMessages : [])
  const [name, setName] = useState(''); const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => { if (isSample) return; fetch(`/api/guestbook?invitationId=${invitationId}`).then(r => r.json()).then((d: any) => setMessages(d.messages || d.data || [])).catch(() => {}) }, [invitationId, isSample])
  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return
    if (isSample) { setMessages(prev => [{ id: `s-${Date.now()}`, guest_name: name.trim(), message: message.trim(), created_at: new Date().toISOString() }, ...prev]); setName(''); setMessage(''); return }
    setSubmitting(true)
    try { const res = await fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId, guestName: name.trim(), message: message.trim() }) }); if (res.ok) { const d = await res.json() as any; setMessages(prev => [d.data || d, ...prev]); setName(''); setMessage('') } } catch {}
    setSubmitting(false)
  }

  return (
    <div style={{ background: paperColors.bg }}>
      <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto', padding: '40px 32px' }}>
        <PaperReveal>
          <div className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', letterSpacing: '3px', color: paperColors.muted, marginBottom: '24px' }}>방명록</div>
        </PaperReveal>
        <PaperReveal delay={100}>
          <div className="space-y-3 mb-6">
            <input value={name} onChange={e => setName(e.target.value)} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} placeholder="이름" maxLength={20} style={{
              width: '100%', padding: '12px 16px', fontFamily: "'Pretendard', sans-serif", fontSize: '14px',
              color: paperColors.text, background: 'transparent', border: `1px solid ${paperColors.accent}`, borderRadius: '4px', outline: 'none',
            }} />
            <textarea value={message} onChange={e => setMessage(e.target.value)} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} placeholder="메시지를 남겨주세요" rows={3} maxLength={500} style={{
              width: '100%', padding: '12px 16px', fontFamily: "'Pretendard', sans-serif", fontSize: '14px',
              color: paperColors.text, background: 'transparent', border: `1px solid ${paperColors.accent}`, borderRadius: '4px', outline: 'none', resize: 'none',
            }} />
            <button onClick={handleSubmit} disabled={submitting || !name.trim() || !message.trim()} style={{
              width: '100%', padding: '12px', fontFamily: "'Pretendard', sans-serif", fontSize: '14px',
              background: paperColors.dustyRose, color: '#FFF', border: 'none', borderRadius: '4px',
              cursor: 'pointer', opacity: (!name.trim() || !message.trim()) ? 0.5 : 1,
            }}>{submitting ? '등록 중...' : '메시지 남기기'}</button>
          </div>
        </PaperReveal>
        {messages.slice(0, 5).map((m: any) => (
          <PaperReveal key={m.id}>
            <div style={{ padding: '12px 0', borderBottom: `1px solid ${paperColors.accent}` }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 600, color: paperColors.charcoal }}>{m.guest_name}</span>
                <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', color: paperColors.muted }}>{new Date(m.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 1.7, color: paperColors.text }}>{m.message}</p>
            </div>
          </PaperReveal>
        ))}
      </div>
    </div>
  )
}

// -- Paper: Footer --
function PaperFooter() {
  return (
    <div style={{ padding: '40px 32px', textAlign: 'center', background: paperColors.bg }}>
      <div style={{ width: '1px', height: '24px', background: paperColors.accent, margin: '0 auto 12px' }} />
      <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '9px', letterSpacing: '3px', color: paperColors.muted }}>DEAR DRAWER</p>
    </div>
  )
}

// -- Paper: Full Layout --
function PaperConcept({ data, invitationId, isSample }: { data: any; invitationId: string; isSample?: boolean }) {
  const [opened, setOpened] = useState(false)

  return (
    <>
      {/* Grain texture overlay */}
      <div style={grainOverlayStyle} />

      {/* Cursor blink keyframe */}
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>

      {!opened ? (
        <PaperCover data={data} onOpen={() => setOpened(true)} />
      ) : (
        <div style={{ background: paperColors.bg }}>
          {/* Greeting */}
          {data.greeting && <PaperGreeting text={data.greeting} />}

          {/* Chapters */}
          {data.chapters?.map((chapter: any, i: number) => (
            <PaperEssayPage key={i} chapter={chapter} index={i} />
          ))}

          {/* Quote */}
          <PaperQuote quote={data.quote} />

          {/* Gallery */}
          {data.gallery?.images?.length > 0 && <PaperGallery data={data} />}

          {/* Wedding Info */}
          <PaperInvitationInfo data={data} />

          {/* Contacts */}
          {data.sectionVisibility?.contacts !== false && <PaperContacts data={data} />}

          {/* Bank */}
          {data.sectionVisibility?.bankAccounts !== false && <PaperBankAccounts data={data} />}

          {/* Thank You */}
          <PaperThankYou data={data} />

          {/* Guestbook */}
          {data.sectionVisibility?.guestbook !== false && <PaperGuestbook data={data} invitationId={invitationId} isSample={isSample} />}

          {/* RSVP */}
          {data.rsvpEnabled && data.sectionVisibility?.rsvp !== false && <PaperRsvp data={data} invitationId={invitationId} />}

          {/* Footer */}
          <PaperFooter />
        </div>
      )}
    </>
  )
}

// ====================================================================
// BOOK CONCEPT - 전자책 리더 (밀리의서재/킨들 스타일)
// 페이지 단위 넘김, 진행률 바, 목차 사이드바
// ====================================================================

// -- Custom theme color generation utilities --
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function toHex(r: number, g: number, b: number): string {
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return '#' + [cl(r), cl(g), cl(b)].map(v => v.toString(16).padStart(2, '0')).join('')
}
function blendColors(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = parseHex(c1)
  const [r2, g2, b2] = parseHex(c2)
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
function lightenColor(hex: string, amount: number): string {
  return blendColors(hex, '#FFFFFF', amount)
}
function darkenColor(hex: string, amount: number): string {
  return blendColors(hex, '#000000', amount)
}
function desaturateColor(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex)
  const gray = r * 0.299 + g * 0.587 + b * 0.114
  return toHex(r + (gray - r) * amount, g + (gray - g) * amount, b + (gray - b) * amount)
}

function generateBookColors(frame: string, accent: string, text: string, pageBg?: string): BookColorConfig {
  const bg = pageBg || frame
  return {
    bg,
    pageBg: pageBg ? lightenColor(pageBg, 0.02) : lightenColor(frame, 0.02),
    text,
    heading: darkenColor(text, 0.1),
    muted: blendColors(text, bg, 0.45),
    accent,
    divider: blendColors(accent, bg, 0.7),
    highlight: blendColors(accent, bg, 0.85),
    toolbar: blendColors(frame, accent, 0.08),
    toolbarText: blendColors(text, frame, 0.4),
    progressBg: blendColors(accent, frame, 0.7),
    progressFill: accent,
  }
}

function generateBookInfoColors(frame: string, accent: string, text: string, pageBg?: string): BookInfoColorConfig {
  const bg = pageBg || frame
  const infoBg = darkenColor(desaturateColor(bg, 0.3), 0.04)
  const muted = desaturateColor(blendColors(text, bg, 0.45), 0.3)
  const divider = desaturateColor(blendColors(accent, bg, 0.7), 0.3)
  const toolbar = desaturateColor(blendColors(frame, accent, 0.08), 0.3)
  const toolbarText = desaturateColor(blendColors(text, frame, 0.4), 0.3)
  return {
    bg: infoBg,
    pageBg: blendColors(infoBg, '#FFFFFF', 0.05),
    text: darkenColor(text, 0.05),
    heading: darkenColor(text, 0.15),
    muted,
    accent: darkenColor(accent, 0.1),
    divider,
    cardBg: '#FFFFFF',
    toolbar,
    toolbarText,
    progressBg: divider,
    progressFill: darkenColor(desaturateColor(accent, 0.2), 0.1),
    frameBg: darkenColor(frame, 0.08),
  }
}

function generateQuoteDarkColors(bg: string, accent: string, text: string): Partial<BookColorConfig> {
  const darkBg = darkenColor(blendColors(text, bg, 0.15), 0.3)
  const mutedLight = lightenColor(blendColors(text, accent, 0.5), 0.3)
  const dividerDark = blendColors(darkBg, mutedLight, 0.3)
  return {
    bg: darkBg, pageBg: darkBg,
    muted: mutedLight, divider: dividerDark,
    toolbarText: mutedLight, progressBg: dividerDark, progressFill: mutedLight,
  }
}

function generateDarkColors(bg: string, accent: string, text: string): { bg: string; text: string; muted: string } {
  const darkBg = darkenColor(blendColors(text, bg, 0.15), 0.3)
  return {
    bg: darkBg,
    text: lightenColor(bg, 0.2),
    muted: lightenColor(blendColors(text, accent, 0.5), 0.3),
  }
}

interface BookColorConfig {
  bg: string; pageBg: string; text: string; heading: string
  muted: string; accent: string; divider: string; highlight: string
  toolbar: string; toolbarText: string; progressBg: string; progressFill: string
}

const bookColorsByTheme: Record<string, BookColorConfig> = {
  'essay-ivory': {
    bg: '#FDFBF7', pageBg: '#FFFEF9', text: '#2C2417', heading: '#3A2F24',
    muted: '#9E9184', accent: '#8B7355', divider: '#E5DFD5', highlight: '#FFF4D6',
    toolbar: '#F5F0E8', toolbarText: '#6B5F50', progressBg: '#E8E2D8', progressFill: '#8B7355',
  },
  'essay-blush': {
    bg: '#FDF6F4', pageBg: '#FFFAF8', text: '#4A3238', heading: '#5C3040',
    muted: '#B09098', accent: '#C4818E', divider: '#E8C8CE', highlight: '#FFE8EC',
    toolbar: '#F9EDED', toolbarText: '#8A6E74', progressBg: '#E8C8CE', progressFill: '#C4818E',
  },
  'essay-sage': {
    bg: '#F5F7F3', pageBg: '#FAFCF8', text: '#2E3A2A', heading: '#3A4E32',
    muted: '#8A9E82', accent: '#6B8A5E', divider: '#B8CCAE', highlight: '#E8F2E0',
    toolbar: '#EBF0E6', toolbarText: '#6A7A62', progressBg: '#B8CCAE', progressFill: '#6B8A5E',
  },
  'essay-mono': {
    bg: '#FFFFFF', pageBg: '#FFFFFF', text: '#1A1A1A', heading: '#000000',
    muted: '#888888', accent: '#555555', divider: '#D0D0D0', highlight: '#F0F0F0',
    toolbar: '#F5F5F5', toolbarText: '#666666', progressBg: '#D0D0D0', progressFill: '#555555',
  },
  'essay-sky': {
    bg: '#F4F8FC', pageBg: '#F8FBFE', text: '#2A3440', heading: '#3A5068',
    muted: '#8A9EAE', accent: '#5B8CB5', divider: '#B8D0E4', highlight: '#DCE8F4',
    toolbar: '#E8F0F8', toolbarText: '#5A7A90', progressBg: '#B8D0E4', progressFill: '#5B8CB5',
  },
  'essay-coral': {
    bg: '#FEF6F2', pageBg: '#FFFAF7', text: '#3E2E28', heading: '#6A3E30',
    muted: '#B0908A', accent: '#D4836B', divider: '#E8C4B8', highlight: '#FCEADE',
    toolbar: '#FAECE6', toolbarText: '#8A6A60', progressBg: '#E8C4B8', progressFill: '#D4836B',
  },
}
const bookColorsIvory = bookColorsByTheme['essay-ivory']

// INFO 영역 컬러 (쿨톤 전환)
interface BookInfoColorConfig {
  bg: string; pageBg: string; text: string; heading: string
  muted: string; accent: string; divider: string; cardBg: string
  toolbar: string; toolbarText: string; progressBg: string; progressFill: string
  frameBg: string
}

const bookInfoColorsByTheme: Record<string, BookInfoColorConfig> = {
  'essay-ivory': {
    bg: '#F5F4F1', pageBg: '#F9F8F5', text: '#2C2C2C', heading: '#1A1A1A',
    muted: '#8C8C86', accent: '#6B6355', divider: '#E0DDD8', cardBg: '#FFFFFF',
    toolbar: '#EDECE8', toolbarText: '#5A5A54', progressBg: '#E0DDD8', progressFill: '#6B6355',
    frameBg: '#E5E1D8',
  },
  'essay-blush': {
    bg: '#F9F2F0', pageBg: '#FBF5F3', text: '#3A2A2E', heading: '#1A1A1A',
    muted: '#9A8488', accent: '#A06070', divider: '#E0D0D4', cardBg: '#FFFFFF',
    toolbar: '#F2EAEA', toolbarText: '#7A6468', progressBg: '#E0D0D4', progressFill: '#A06070',
    frameBg: '#E8DCDA',
  },
  'essay-sage': {
    bg: '#F0F2EE', pageBg: '#F5F7F3', text: '#2A2E28', heading: '#1A1A1A',
    muted: '#828C7E', accent: '#5A7A4E', divider: '#C8D8BE', cardBg: '#FFFFFF',
    toolbar: '#E8ECE4', toolbarText: '#5A6A52', progressBg: '#C8D8BE', progressFill: '#5A7A4E',
    frameBg: '#DDE0D8',
  },
  'essay-mono': {
    bg: '#F5F5F5', pageBg: '#FAFAFA', text: '#1A1A1A', heading: '#000000',
    muted: '#888888', accent: '#444444', divider: '#D0D0D0', cardBg: '#FFFFFF',
    toolbar: '#EEEEEE', toolbarText: '#555555', progressBg: '#D0D0D0', progressFill: '#444444',
    frameBg: '#E2E2E2',
  },
  'essay-sky': {
    bg: '#EEF2F8', pageBg: '#F4F8FC', text: '#2A3440', heading: '#1A2A3A',
    muted: '#7A8E9E', accent: '#4A7A9E', divider: '#B0C8DC', cardBg: '#FFFFFF',
    toolbar: '#E4ECF4', toolbarText: '#5A7080', progressBg: '#B0C8DC', progressFill: '#4A7A9E',
    frameBg: '#D8DEE6',
  },
  'essay-coral': {
    bg: '#F6EEEA', pageBg: '#FAF4F0', text: '#3A2A24', heading: '#1A1A1A',
    muted: '#9A8078', accent: '#B86A54', divider: '#DCC0B4', cardBg: '#FFFFFF',
    toolbar: '#F0E4DE', toolbarText: '#7A6058', progressBg: '#DCC0B4', progressFill: '#B86A54',
    frameBg: '#E5DDD8',
  },
}
const bookInfoColorsIvory = bookInfoColorsByTheme['essay-ivory']

function getBookColors(theme?: string, customColors?: { bg: string; pageBg: string; accent: string; text: string }) {
  if (theme === 'essay-custom' && customColors) {
    return generateBookColors(customColors.bg, customColors.accent, customColors.text, customColors.pageBg)
  }
  return bookColorsByTheme[theme || 'essay-ivory'] || bookColorsByTheme['essay-ivory']
}
function getBookInfoColors(theme?: string, customColors?: { bg: string; pageBg: string; accent: string; text: string }) {
  if (theme === 'essay-custom' && customColors) {
    return generateBookInfoColors(customColors.bg, customColors.accent, customColors.text, customColors.pageBg)
  }
  return bookInfoColorsByTheme[theme || 'essay-ivory'] || bookInfoColorsByTheme['essay-ivory']
}

// -- Book: 애니메이션 CSS --
const bookAnimCSS = `
@font-face {
  font-family: 'Ridibatang';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}
@font-face {
  font-family: 'BonmyeongjoSourceHanSerif';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NotoSerifKR.woff') format('woff');
  font-weight: normal;
  font-display: swap;
}
@keyframes bkFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bkFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bkGalImg { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: scale(1); } }
@keyframes bkScaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
@keyframes bkDrawLine { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes bkSlideRight { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes bkHighlight { from { background-size: 0% 100%; } to { background-size: 100% 100%; } }
@keyframes bkPageInL { from { opacity: 0; transform: translateX(-12%); } to { opacity: 1; transform: none; } }
@keyframes bkPageInR { from { opacity: 0; transform: translateX(12%); } to { opacity: 1; transform: none; } }
@keyframes bkPageOutL { to { opacity: 0; transform: translateX(-18%) scale(0.94); } }
@keyframes bkPageOutR { to { opacity: 0; transform: translateX(18%) scale(0.94); } }
.book-page-content .bk-page { min-height: 100vh; padding-top: 52px; box-sizing: border-box; }
.book-page-content .bk-page > .w-full { padding-left: 52px; padding-right: 52px; }
.book-page-content:has(.bk-card) { display: flex; flex-direction: column; min-height: 100vh; }
.book-page-content .bk-page.bk-card { min-height: calc(100vh - 20px); margin: 10px; border-radius: 14px; box-shadow: 0 4px 30px rgba(46,42,38,0.08); overflow: hidden; position: relative; padding-top: 0; }
.bk-scroll-area { scrollbar-width: none; -ms-overflow-style: none; }
.bk-scroll-area::-webkit-scrollbar { display: none; }
.bk-scroll-hint {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 4;
  display: flex; justify-content: center; align-items: flex-end;
  padding-bottom: 28px; height: 100px;
  pointer-events: none; opacity: 0; transition: opacity 0.5s ease;
}
.bk-scroll-hint.show { opacity: 1; }
.bk-scroll-hint span {
  font-size: 18px; font-weight: 200; display: inline-block;
  animation: bkScrollBob 2.5s ease-in-out infinite;
}
@keyframes bkScrollBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
@keyframes bkSwipeX { 0%,100% { transform: translateX(0); } 50% { transform: translateX(12px); } }
@keyframes bkSwipePulse { 0%,100% { opacity: 0.7; } 50% { opacity: 0.35; } }
@keyframes bkClipCx { from { clip-path: inset(0 50%); } to { clip-path: inset(0); } }
`

// -- Book: 애니메이션 헬퍼 --
// d=delay(ms), type: up(기본)/fade/scale/right
function BA({ children, d = 0, type = 'up', className = '' }: {
  children: React.ReactNode; d?: number; type?: 'up' | 'fade' | 'scale' | 'right'; className?: string
}) {
  const anim = type === 'scale' ? 'bkScaleIn' : type === 'fade' ? 'bkFadeIn' : type === 'right' ? 'bkSlideRight' : 'bkFadeUp'
  const dur = type === 'scale' ? '0.7s' : '0.6s'
  return <div className={className} style={{ animation: `${anim} ${dur} ease-out ${d}ms both` }}>{children}</div>
}

// 구분선 애니메이션 (좌→우 그려지는 효과)
function BLine({ width = '24px', color = bookColorsIvory.accent, d = 0, center = false, height = '0.5px' }: {
  width?: string; color?: string; d?: number; center?: boolean; height?: string
}) {
  return (
    <div style={{
      width, height, background: color,
      transformOrigin: center ? 'center' : 'left',
      animation: `bkDrawLine 0.8s ease-out ${d}ms both`,
      ...(center ? { margin: '0 auto' } : {}),
    }} />
  )
}

// -- Book: Page wrapper (한 화면 = 한 페이지) --
interface BookPage {
  id: string
  type: 'cover' | 'intro' | 'toc' | 'greeting' | 'chapter' | 'quote' | 'gallery' | 'info-intro' | 'wedding' | 'date-essay' | 'wedding-date' | 'venue-essay' | 'wedding-venue' | 'guidance' | 'contacts' | 'bank' | 'guestbook' | 'rsvp' | 'thankyou' | 'end' | 'bonus-intro' | 'bonus-interview' | 'bonus-end'
  title?: string
  data?: any
}

function BookConcept({ data, invitationId, isSample, skipIntro }: { data: any; invitationId: string; isSample?: boolean; skipIntro?: boolean }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)

  const [currentPage, setCurrentPage] = useState(skipIntro ? 1 : 0)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const hasBonusContent = false
  const [showBonus, setShowBonus] = useState(false)
  const [pageTransition, setPageTransition] = useState<'none' | 'next' | 'prev'>('none')
  const [leavingPage, setLeavingPage] = useState<number | null>(null)
  const [leavingDir, setLeavingDir] = useState<'next' | 'prev'>('next')
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 슬라이드 네비게이션 상태
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)
  const dragDirectionRef = useRef<'none' | 'horizontal' | 'vertical'>('none')
  const containerWidthRef = useRef(0)
  const dragStartTimeRef = useRef(0)
  const scrollableRef = useRef<HTMLDivElement>(null)
  const contentMode = data.contentMode || 'story'
  const isEditorial = true

  // GuestFloatingButton 모달 상태
  const [openModalType, setOpenModalType] = useState<'none' | 'contact' | 'rsvp' | 'location' | 'account' | 'share'>('none')

  // GuestFloatingButton용 데이터 매핑
  const gfbContacts = [
    data.groom?.phone && data.groom?.phoneEnabled !== false && { name: data.groom.name, phone: data.groom.phone, role: '신랑', side: 'groom' as const },
    data.groom?.father?.phone && data.groom?.father?.phoneEnabled !== false && { name: data.groom.father.name, phone: data.groom.father.phone, role: '아버지', side: 'groom' as const },
    data.groom?.mother?.phone && data.groom?.mother?.phoneEnabled !== false && { name: data.groom.mother.name, phone: data.groom.mother.phone, role: '어머니', side: 'groom' as const },
    data.bride?.phone && data.bride?.phoneEnabled !== false && { name: data.bride.name, phone: data.bride.phone, role: '신부', side: 'bride' as const },
    data.bride?.father?.phone && data.bride?.father?.phoneEnabled !== false && { name: data.bride.father.name, phone: data.bride.father.phone, role: '아버지', side: 'bride' as const },
    data.bride?.mother?.phone && data.bride?.mother?.phoneEnabled !== false && { name: data.bride.mother.name, phone: data.bride.mother.phone, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; phone: string; role: string; side: 'groom' | 'bride' }[]

  const gfbAccounts = [
    data.groom?.bank?.enabled && { name: data.groom.name, bank: data.groom.bank, role: '신랑', side: 'groom' as const },
    data.groom?.father?.bank?.enabled && { name: data.groom.father.name, bank: data.groom.father.bank, role: '아버지', side: 'groom' as const },
    data.groom?.mother?.bank?.enabled && { name: data.groom.mother.name, bank: data.groom.mother.bank, role: '어머니', side: 'groom' as const },
    data.bride?.bank?.enabled && { name: data.bride.name, bank: data.bride.bank, role: '신부', side: 'bride' as const },
    data.bride?.father?.bank?.enabled && { name: data.bride.father.name, bank: data.bride.father.bank, role: '아버지', side: 'bride' as const },
    data.bride?.mother?.bank?.enabled && { name: data.bride.mother.name, bank: data.bride.mother.bank, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; bank: { bank: string; account: string; holder: string; enabled: boolean }; role: string; side: 'groom' | 'bride' }[]

  // 페이지 목록 생성 (목차는 사이드바로만 접근)
  // info 관련 사전 계산
  const infoObj = data.info || {}
  const defaultItemOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
  const infoItemOrder = infoObj.itemOrder || defaultItemOrder
  const enabledInfoItems = [
    ...infoItemOrder.filter((key: string) => infoObj[key]?.enabled && infoObj[key]?.content),
    ...(infoObj.customItems || []).filter((item: any) => item.enabled && item.content).map((_: any, i: number) => `custom-${i}`),
  ]

  const defaultSectionOrder = [
    'intro', 'greeting', 'story', 'quote', 'gallery',
    'info', 'contacts', 'bank', 'thankyou', 'guestbook', 'rsvp'
  ]

  const sectionBuilders: Record<string, () => BookPage[]> = {
    intro: () => data.intro?.enabled !== false ? [{ id: 'intro', type: 'intro', title: '프롤로그' }] : [],
    greeting: () => (data.greeting && data.sectionVisibility?.greeting !== false) ? [{ id: 'greeting', type: 'greeting', title: '초대의 글' }] : [],
    story: () => {
      if (data.sectionVisibility?.story === false) return []
      const result: BookPage[] = []
      if (contentMode === 'story' && data.chapters?.length) {
        data.chapters.forEach((ch: any, i: number) => {
          result.push({ id: `chapter-${i}`, type: 'chapter', title: ch.title || `Chapter ${i + 1}`, data: { chapter: ch, index: i } })
        })
      }
      if (contentMode === 'interview' && data.interviews?.length) {
        data.interviews.forEach((qa: any, i: number) => {
          result.push({ id: `interview-${i}`, type: 'chapter', title: qa.question?.substring(0, 15) + '...', data: { interview: qa, index: i } })
        })
      }
      return result
    },
    quote: () => (data.quote?.text && data.sectionVisibility?.quote !== false) ? [{ id: 'quote', type: 'quote', title: '인용문' }] : [],
    gallery: () => (data.gallery?.images?.length > 0 && data.sectionVisibility?.gallery !== false) ? [{ id: 'gallery', type: 'gallery', title: '갤러리' }] : [],
    info: () => {
      if (data.sectionVisibility?.info === false) return []
      const result: BookPage[] = [
        { id: 'info-intro', type: 'info-intro', title: '예식 안내' },
        { id: 'date-essay', type: 'date-essay' as any, title: '날짜 에세이' },
        { id: 'wedding-date', type: 'wedding-date' as any, title: '그 날' },
        { id: 'venue-essay', type: 'venue-essay' as any, title: '장소 에세이' },
        { id: 'wedding-venue', type: 'wedding-venue' as any, title: '그 곳' },
      ]
      if (enabledInfoItems.length > 0 && data.sectionVisibility?.guidance !== false) {
        result.push({ id: 'guidance', type: 'guidance' as any, title: '안내' })
      }
      return result
    },
    contacts: () => data.sectionVisibility?.contacts !== false ? [{ id: 'contacts', type: 'contacts', title: '연락처' }] : [],
    bank: () => data.sectionVisibility?.bankAccounts !== false ? [{ id: 'bank', type: 'bank', title: '마음 전하기' }] : [],
    thankyou: () => (data.thankYou?.message && data.sectionVisibility?.thankyou !== false) ? [{ id: 'thankyou', type: 'thankyou', title: '감사 인사' }] : [],
    guestbook: () => data.sectionVisibility?.guestbook !== false ? [{ id: 'guestbook', type: 'guestbook', title: '방명록' }] : [],
    rsvp: () => (data.rsvpEnabled && data.sectionVisibility?.rsvp !== false) ? [{ id: 'rsvp', type: 'rsvp', title: '참석 여부' }] : [],
  }

  const pages: BookPage[] = []
  pages.push({ id: 'cover', type: 'cover', title: '표지' })
  const sectionOrder = data.sectionOrder || defaultSectionOrder
  for (const sectionId of sectionOrder) {
    const builder = sectionBuilders[sectionId]
    if (builder) pages.push(...builder())
  }
  pages.push({ id: 'end', type: 'end', title: '끝' })

  // 보너스 인터뷰 (더 많은 이야기)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const bonusInterviews = data.content?.bonusInterviews || [
    { question: '우리에게 결혼의 의미', answer: `결혼은 저희에게 "함께 늙어가자"는 약속입니다.\n\n연애할 때는 설렘이 전부인 줄 알았는데,\n시간이 지나며 알게 되었습니다.\n\n진짜 사랑은 일상을 함께 견디는 것,\n그리고 그 일상이 충분히 아름다울 수 있다는\n믿음이라는 것을요.`, answerer: 'both' },
    { question: '1년 해외여행을 신혼여행으로 선택한 이유', answer: `산에서 만난 우리니까,\n세상의 더 많은 길을 함께 걷고 싶었습니다.\n\n히말라야 트레킹, 산티아고 순례길,\n파타고니아의 끝없는 초원까지.\n\n"1년이면 충분할까?"\n"부족하면 더 가면 되지."\n\n그 대화로 결정되었습니다.`, answerer: 'both' },
    { question: '결혼을 준비하며 든 생각', answer: `결혼 준비는 생각보다 복잡했지만,\n하나 확실히 알게 된 게 있습니다.\n\n이 사람이 아니면 안 된다는 것.\n\n의견이 다를 때도, 지칠 때도,\n결국 마주 보고 웃게 되는 사람.\n그런 사람을 만난 건 정말 행운입니다.`, answerer: 'both' },
  ]

  if (showBonus) {
    const validBonus = bonusInterviews.filter((bi: any) => bi.question?.trim() || bi.answer?.trim())
    if (validBonus.length > 0) {
      pages.push({ id: 'bonus-intro', type: 'bonus-intro', title: '웨딩 인터뷰' })
      validBonus.forEach((bi: any, i: number) => {
        pages.push({ id: `bonus-${i}`, type: 'bonus-interview', title: bi.question?.substring(0, 10) + '...', data: { bonusInterview: bi, index: i, total: validBonus.length } })
      })
      pages.push({ id: 'bonus-end', type: 'bonus-end', title: '끝' })
    }
  }

  const totalPages = pages.length
  const progress = ((currentPage) / (totalPages - 1)) * 100

  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= totalPages || pageIndex === currentPage) return
    if (pageTransition !== 'none') return // 전환 중 추가 스와이프 방지
    const dir = pageIndex > currentPage ? 'next' : 'prev'
    setLeavingPage(currentPage)
    setLeavingDir(dir)
    setPageTransition(dir)
    setCurrentPage(pageIndex)
    setTimeout(() => {
      setPageTransition('none')
      setLeavingPage(null)
    }, 1150)
  }, [currentPage, totalPages, pageTransition])

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])

  // 보너스 활성화 시 자동으로 다음 페이지 이동
  const [pendingBonusNav, setPendingBonusNav] = useState(false)
  useEffect(() => {
    if (pendingBonusNav && showBonus) {
      setPendingBonusNav(false)
      goToPage(currentPage + 1)
    }
  }, [showBonus, pendingBonusNav, currentPage, goToPage])

  // 탭 오버레이 비활성화 페이지 (텍스트 입력이 있는 폼)
  const isFormPage = useCallback(() => {
    const p = pages[currentPage]
    return p?.type === 'guestbook' || p?.type === 'rsvp'
  }, [currentPage, pages])


  // 슬라이드 페이지 전환 (스냅 애니메이션)
  const slideTo = useCallback((direction: 'next' | 'prev' | 'back') => {
    const w = containerWidthRef.current || window.innerWidth
    setIsSnapping(true)
    if (direction === 'back') {
      setDragOffset(0)
      setTimeout(() => {
        setIsSnapping(false)
        setIsDragging(false)
      }, 300)
    } else {
      setDragOffset(direction === 'next' ? -w : w)
      setTimeout(() => {
        setIsSnapping(false)
        setIsDragging(false)
        setDragOffset(0)
        setCurrentPage(prev => direction === 'next' ? Math.min(prev + 1, totalPages - 1) : Math.max(prev - 1, 0))
      }, 300)
    }
  }, [totalPages])

  // 네이티브 터치 이벤트 리스너 등록 (passive: false 필요)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let startX = 0
    let startY = 0
    let startTime = 0
    let lastTouchY = 0
    let locked: 'none' | 'horizontal' | 'vertical' = 'none'
    let dragging = false

    const onTouchStart = (e: TouchEvent) => {
      if (isSnapping) return
      // 폼 페이지면 터치 핸들러 스킵
      const p = pages[currentPage]
      if (p?.type === 'guestbook' || p?.type === 'rsvp') return
      // 인터랙티브 요소 클릭은 스킵 (SVG 아이콘 포함 — Element로 체크)
      if (e.target instanceof Element && e.target.closest('a, button, input, textarea, select, [role="button"]')) return

      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      lastTouchY = startY
      startTime = Date.now()
      locked = 'none'
      dragging = false
      containerWidthRef.current = el.getBoundingClientRect().width
      touchStartX.current = startX
      touchStartY.current = startY
      dragStartTimeRef.current = startTime
      dragDirectionRef.current = 'none'
    }

    const onTouchMove = (e: TouchEvent) => {
      if (isSnapping) return
      const p = pages[currentPage]
      if (p?.type === 'guestbook' || p?.type === 'rsvp') return
      if (e.target instanceof Element && e.target.closest('a, button, input, textarea, select, [role="button"]')) return

      const cx = e.touches[0].clientX
      const cy = e.touches[0].clientY
      const dx = cx - startX
      const dy = cy - startY

      // 방향 잠금 결정 (10px 이상 이동 후)
      if (locked === 'none') {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
          dragDirectionRef.current = locked
        } else {
          if (e.cancelable) e.preventDefault()
          return
        }
      }

      if (locked === 'vertical') {
        // 수직 스크롤을 JS로 직접 처리
        const scrollEl = scrollableRef.current
        if (scrollEl) {
          const deltaY = lastTouchY - cy
          scrollEl.scrollTop += deltaY
        }
        lastTouchY = cy
        if (e.cancelable) e.preventDefault()
        return
      }

      // 수평 드래그 비활성화 - 기본 동작만 방지
      if (e.cancelable) e.preventDefault()
      return
    }

    const onTouchEnd = (e: TouchEvent) => {
      const p = pages[currentPage]
      if (p?.type === 'guestbook' || p?.type === 'rsvp') return
      // 인터랙티브 요소 탭은 네비게이션 스킵 (touchstart에서 startX 미설정 → stale 값 방지)
      if (e.target instanceof Element && e.target.closest('a, button, input, textarea, select, [role="button"]')) return

      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const dx = endX - startX
      const dy = endY - startY

      // 스와이프 감지 (매거진 방식: 35px 이상 수평 이동)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
        if (dx < 0) nextPage()
        else prevPage()
      }
      // 탭: 거의 이동 없음 (< 10px)
      else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        const rect = el.getBoundingClientRect()
        const x = startX - rect.left
        const w = rect.width
        if (x < w * 0.35) prevPage()
        else if (x > w * 0.65) nextPage()
      }

      locked = 'none'
      dragging = false
      dragDirectionRef.current = 'none'
    }

    // --- 마우스 드래그 (데스크톱) ---
    let mouseDown = false

    const onMouseDown = (e: MouseEvent) => {
      if (isSnapping) return
      const p = pages[currentPage]
      if (p?.type === 'guestbook' || p?.type === 'rsvp') return
      if (e.target instanceof Element && e.target.closest('a, button, input, textarea, select, [role="button"]')) return

      mouseDown = true
      startX = e.clientX
      startY = e.clientY
      startTime = Date.now()
      locked = 'none'
      dragging = false
      containerWidthRef.current = el.getBoundingClientRect().width
      touchStartX.current = startX
      touchStartY.current = startY
      dragStartTimeRef.current = startTime
      dragDirectionRef.current = 'none'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDown || isSnapping) return
      const p = pages[currentPage]
      if (p?.type === 'guestbook' || p?.type === 'rsvp') return

      const cx = e.clientX
      const cy = e.clientY
      const dx = cx - startX
      const dy = cy - startY

      if (locked === 'none') {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
          dragDirectionRef.current = locked
        } else {
          return
        }
      }

      if (locked === 'vertical') return

      // 수평 드래그 비활성화
      e.preventDefault()
      return
    }

    const onMouseUp = (e: MouseEvent) => {
      if (!mouseDown) return
      mouseDown = false

      const p = pages[currentPage]
      if (p?.type === 'guestbook' || p?.type === 'rsvp') return

      const dx = e.clientX - startX
      const dy = e.clientY - startY

      // 스와이프 감지 (매거진 방식: 35px 이상 수평 이동)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
        if (dx < 0) nextPage()
        else prevPage()
      }
      // 탭: 거의 이동 없음 (< 10px)
      else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        if (e.target instanceof Element && e.target.closest('a, button, input, textarea, select, [role="button"]')) { locked = 'none'; dragging = false; dragDirectionRef.current = 'none'; return }
        const rect = el.getBoundingClientRect()
        const x = startX - rect.left
        const w = rect.width
        if (x < w * 0.35) prevPage()
        else if (x > w * 0.65) nextPage()
      }

      locked = 'none'
      dragging = false
      dragDirectionRef.current = 'none'
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseup', onMouseUp)
    el.addEventListener('mouseleave', onMouseUp)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('mouseleave', onMouseUp)
    }
  }, [currentPage, totalPages, isSnapping, pages, nextPage, prevPage, slideTo])

  // 키보드
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextPage() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [nextPage, prevPage])

  // 스크롤 힌트: 페이지 변경 시 스크롤 리셋 + 오버플로 체크
  useEffect(() => {
    const scrollEl = scrollableRef.current
    if (scrollEl) {
      scrollEl.scrollTop = 0
    }
    // 페이지 전환 애니메이션 후 레이아웃 안정화 시점에 오버플로 체크
    const timer = setTimeout(() => {
      const el = scrollableRef.current
      if (el) {
        setShowScrollHint(el.scrollHeight > el.clientHeight + 10)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [currentPage])

  // 스크롤 힌트: 스크롤 시 숨기기/표시
  useEffect(() => {
    const scrollEl = scrollableRef.current
    if (!scrollEl) return
    const onScroll = () => {
      if (scrollEl.scrollTop > 40) setShowScrollHint(false)
      else if (scrollEl.scrollHeight > scrollEl.clientHeight + 10) setShowScrollHint(true)
    }
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [currentPage])

  // 마우스 휠: 탭 오버레이가 wheel 이벤트를 가로채므로 컨테이너에서 직접 스크롤 처리
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const scrollEl = scrollableRef.current
      if (!scrollEl) return
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight
      if (maxScroll <= 0) return
      scrollEl.scrollTop = Math.max(0, Math.min(maxScroll, scrollEl.scrollTop + e.deltaY))
      e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [currentPage])

  const page = pages[currentPage]

  // 헤더 타이틀: 그룹화된 이름 표시
  const storyPageTypes = new Set(['intro', 'greeting', 'chapter', 'quote'])
  const infoPageTypes = new Set(['info-intro', 'date-essay', 'wedding-date', 'venue-essay', 'wedding-venue', 'guidance', 'contacts', 'bank', 'thankyou', 'guestbook', 'rsvp'])
  const bonusPageTypes = new Set(['bonus-intro', 'bonus-interview', 'bonus-end'])
  const isInfoPage = infoPageTypes.has(page?.type || '')
  const isInfoIntroPage = page?.type === 'info-intro'
  const isWarmEssayPage = page?.type === 'date-essay' || page?.type === 'venue-essay'
  const isIntroPage = page?.type === 'intro'
  const isQuoteDark = isEditorial && page?.type === 'quote'
  const isEndPage = page?.type === 'end'
  const quoteDarkByTheme: Record<string, Partial<BookColorConfig>> = {
    'essay-ivory':  { bg: '#2C2820', pageBg: '#2C2820', muted: '#A09882', divider: '#5C5444', toolbarText: '#A09882', progressBg: '#5C5444', progressFill: '#A09882' },
    'essay-blush':  { bg: '#3A2028', pageBg: '#3A2028', muted: '#B08890', divider: '#6C3848', toolbarText: '#B08890', progressBg: '#6C3848', progressFill: '#B08890' },
    'essay-sage':   { bg: '#1E2A1C', pageBg: '#1E2A1C', muted: '#82A078', divider: '#3E5C34', toolbarText: '#82A078', progressBg: '#3E5C34', progressFill: '#82A078' },
    'essay-mono':   { bg: '#1A1A1A', pageBg: '#1A1A1A', muted: '#888888', divider: '#444444', toolbarText: '#888888', progressBg: '#444444', progressFill: '#888888' },
    'essay-sky':    { bg: '#1C2830', pageBg: '#1C2830', muted: '#7A9AB0', divider: '#3A5468', toolbarText: '#7A9AB0', progressBg: '#3A5468', progressFill: '#7A9AB0' },
    'essay-coral':  { bg: '#2E1E18', pageBg: '#2E1E18', muted: '#B08878', divider: '#6A3E30', toolbarText: '#B08878', progressBg: '#6A3E30', progressFill: '#B08878' },
  }
  const customQuoteDark = data.colorTheme === 'essay-custom' && data.customThemeColors
    ? generateQuoteDarkColors(data.customThemeColors.pageBg || data.customThemeColors.bg, data.customThemeColors.accent, data.customThemeColors.text)
    : null
  const bookQuoteDarkColors = {
    ...bookColors,
    ...(customQuoteDark || quoteDarkByTheme[data.colorTheme || 'essay-ivory'] || quoteDarkByTheme['essay-ivory']),
  }
  const introAccent = data.intro?.backgroundColor || bookColors.accent
  const introText = data.colorTheme === 'essay-custom' && data.customThemeColors?.accentText
    ? data.customThemeColors.accentText
    : (data.intro?.textColor || '#FFFFFF')
  const bookIntroColors = {
    ...bookColors,
    bg: introAccent, pageBg: introAccent,
    muted: `${introText}80`, text: `${introText}E6`,
  }
  const endDarkForToolbar = (() => {
    const endDark: Record<string, Partial<BookColorConfig>> = {
      'essay-ivory':  { bg: '#2C2820', pageBg: '#2C2820', toolbar: '#2C2820', muted: '#9B9088', toolbarText: '#9B9088', progressBg: '#5C5444', progressFill: '#9B9088' },
      'essay-blush':  { bg: '#3A2028', pageBg: '#3A2028', toolbar: '#3A2028', muted: '#B08890', toolbarText: '#B08890', progressBg: '#6C3848', progressFill: '#B08890' },
      'essay-sage':   { bg: '#1E2A1C', pageBg: '#1E2A1C', toolbar: '#1E2A1C', muted: '#82A078', toolbarText: '#82A078', progressBg: '#3E5C34', progressFill: '#82A078' },
      'essay-mono':   { bg: '#1A1A1A', pageBg: '#1A1A1A', toolbar: '#1A1A1A', muted: '#888888', toolbarText: '#888888', progressBg: '#444444', progressFill: '#888888' },
      'essay-sky':    { bg: '#1C2830', pageBg: '#1C2830', toolbar: '#1C2830', muted: '#7A9AB0', toolbarText: '#7A9AB0', progressBg: '#3A5468', progressFill: '#7A9AB0' },
      'essay-coral':  { bg: '#2E1E18', pageBg: '#2E1E18', toolbar: '#2E1E18', muted: '#B08878', toolbarText: '#B08878', progressBg: '#6A3E30', progressFill: '#B08878' },
    }
    if (data.colorTheme === 'essay-custom' && data.customThemeColors) {
      const d = generateDarkColors(data.customThemeColors.pageBg || data.customThemeColors.bg, data.customThemeColors.accent, data.customThemeColors.text)
      return { ...bookColors, bg: d.bg, pageBg: d.bg, toolbar: d.bg, muted: d.muted, toolbarText: d.muted, progressBg: darkenColor(d.bg, 0.1), progressFill: d.muted }
    }
    return { ...bookColors, ...(endDark[data.colorTheme || 'essay-ivory'] || endDark['essay-ivory']) }
  })()
  const activeColors = isEndPage ? endDarkForToolbar : isIntroPage ? bookIntroColors : isQuoteDark ? bookQuoteDarkColors : isInfoPage ? bookInfoColors : bookColors

  // 페이지 콘텐츠 렌더 헬퍼 (현재+인접 페이지에서 재사용)
  const renderPageContent = useCallback((p: BookPage | undefined) => {
    if (!p) return null
    switch (p.type) {
      case 'cover': return <BookCover data={data} onNext={nextPage} />
      case 'intro': return <BookIntro data={data} onOpenModal={setOpenModalType} />
      case 'toc': return <BookToc pages={pages} currentPage={currentPage} onGoTo={(i) => { setShowToc(false); goToPage(i) }} colorTheme={data.colorTheme} customThemeColors={data.customThemeColors} />
      case 'greeting': return <BookGreeting data={data} />
      case 'chapter':
        if (p.data?.chapter) return <BookChapter chapter={p.data.chapter} index={p.data.index} ed={isEditorial} colorTheme={data.colorTheme} customThemeColors={data.customThemeColors} />
        if (p.data?.interview) return <BookInterview qa={p.data.interview} index={p.data.index} ed={isEditorial} colorTheme={data.colorTheme} customThemeColors={data.customThemeColors} />
        return null
      case 'quote': return <BookQuote data={data} ed={isEditorial} />
      case 'gallery': return <BookGallery data={data} />
      case 'info-intro': return <BookInfoIntro data={data} />
      case 'date-essay': return <BookDateEssay data={data} />
      case 'wedding-date': return <BookWeddingDate data={data} />
      case 'venue-essay': return <BookVenueEssay data={data} />
      case 'wedding-venue': return <BookWeddingVenue data={data} />
      case 'guidance': return <BookGuidance data={data} />
      case 'contacts': return <BookContacts data={data} />
      case 'bank': return <BookBank data={data} />
      case 'thankyou': return <BookThankYou data={data} />
      case 'guestbook': return <BookGuestbook data={data} invitationId={invitationId} isSample={isSample} />
      case 'rsvp': return <BookRsvp data={data} invitationId={invitationId} />
      case 'end': return <BookEnd data={data} onRestart={() => goToPage(0)} showBonus={showBonus} onShowBonus={hasBonusContent ? () => { setShowBonus(true); setPendingBonusNav(true) } : undefined} />
      case 'bonus-intro': return <BookBonusIntro data={data} />
      case 'bonus-interview': return p.data?.bonusInterview ? <BookBonusInterview interview={p.data.bonusInterview} index={p.data.index} total={p.data.total} colorTheme={data.colorTheme} customThemeColors={data.customThemeColors} /> : null
      case 'bonus-end': return <BookBonusEnd data={data} onRestart={() => goToPage(0)} />
      default: return null
    }
  }, [data, invitationId, isSample, currentPage, pages, nextPage, goToPage, showBonus, hasBonusContent, isEditorial])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 select-none"
      style={{ background: bookColors.bg, fontFamily: "'Pretendard', sans-serif", touchAction: 'none' }}
    >
      {/* 애니메이션 키프레임 */}
      <style dangerouslySetInnerHTML={{ __html: bookAnimCSS }} />



      {/* 상단 툴바 (메뉴 + 페이지 번호 + 프로그레스 바) */}
      {currentPage > 0 && (
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-2.5 pointer-events-none" style={{ height: '52px', padding: '20px 20px 8px 20px', background: 'transparent', ...(isInfoPage ? { top: '10px', left: '10px', right: '10px', borderRadius: '14px 14px 0 0' } : {}) }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowToc(true) }}
            className="pointer-events-auto"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '18px', color: activeColors.muted, opacity: 0.55, letterSpacing: '1px', lineHeight: 1, flexShrink: 0 }}
          >&#8801;</button>
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '9px', fontWeight: 400, letterSpacing: '1.5px', color: activeColors.muted, opacity: 0.6, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
          </span>
          <div className="flex-1 relative bk-progress-bar" style={{ height: '1.5px', background: `${activeColors.muted}1F`, marginRight: '40px' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: activeColors.muted, opacity: 0.35, transition: 'width 0.9s cubic-bezier(.16,1,.3,1)' }} />
          </div>
        </div>
      )}

      {/* 좌우 탭 네비게이션은 onTouchEnd / onMouseUp 핸들러에서 처리 */}

      {/* 메인 콘텐츠 영역 - 슬라이드 방식 */}
      <div className="fixed inset-0 overflow-hidden" style={{
        paddingTop: 0,
        paddingBottom: 0,
        touchAction: 'none',
      }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* 이전 페이지 (드래그 중에만 렌더) */}
          {isDragging && currentPage > 0 && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflowY: 'auto', touchAction: 'none',
              background: infoPageTypes.has(pages[currentPage - 1]?.type || '') ? bookInfoColors.frameBg : undefined,
              transform: `translateX(${-((containerWidthRef.current || window.innerWidth)) + dragOffset}px)`,
              transition: isSnapping ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
              willChange: 'transform',
            }}>
              <div className="book-page-content" style={{ minHeight: '100%' }}>
                {renderPageContent(pages[currentPage - 1])}
              </div>
            </div>
          )}

          {/* 퇴장 페이지 (exit animation) */}
          {leavingPage !== null && (() => {
            const isLeavingInfo = infoPageTypes.has(pages[leavingPage]?.type || '')
            return isLeavingInfo ? (
              /* info 페이지: frameBg 고정, 카드만 애니메이션 */
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                zIndex: 1, pointerEvents: 'none',
                background: bookInfoColors.frameBg,
              }}>
                <div style={{
                  animation: leavingDir === 'next'
                    ? 'bkPageOutL 1.1s cubic-bezier(.33,1,.68,1) forwards'
                    : 'bkPageOutR 1.1s cubic-bezier(.33,1,.68,1) forwards',
                  minHeight: '100%',
                }}>
                  <div className="book-page-content" style={{ minHeight: '100%' }}>
                    {renderPageContent(pages[leavingPage])}
                  </div>
                </div>
              </div>
            ) : (
              /* 비-info 페이지: 전체 전환 */
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                zIndex: 1, pointerEvents: 'none',
                animation: leavingDir === 'next'
                  ? 'bkPageOutL 1.1s cubic-bezier(.33,1,.68,1) forwards'
                  : 'bkPageOutR 1.1s cubic-bezier(.33,1,.68,1) forwards',
              }}>
                <div className="book-page-content" style={{ minHeight: '100%' }}>
                  {renderPageContent(pages[leavingPage])}
                </div>
              </div>
            )
          })()}

          {/* 현재 페이지 */}
          <div ref={scrollableRef} className="bk-scroll-area" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 2,
            background: isInfoPage ? bookInfoColors.frameBg : undefined,
            overflowY: (isDragging || isSnapping) ? 'hidden' : 'auto',
            touchAction: isFormPage() ? 'auto' : 'none',
            transform: (isDragging || isSnapping) ? `translateX(${dragOffset}px)` : 'none',
            opacity: 1,
            transition: isSnapping ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
            willChange: (isDragging || isSnapping) ? 'transform' : 'auto',
            animation: (isInfoPage && pageTransition !== 'none') ? 'none' : (pageTransition === 'next' ? 'bkPageInR 1.1s cubic-bezier(.33,1,.68,1) forwards' : pageTransition === 'prev' ? 'bkPageInL 1.1s cubic-bezier(.33,1,.68,1) forwards' : 'none'),
          }}>
            <div key={currentPage} className="book-page-content" style={{
              minHeight: '100%',
              animation: (isInfoPage && pageTransition !== 'none')
                ? (pageTransition === 'next' ? 'bkPageInR 1.1s cubic-bezier(.33,1,.68,1) forwards' : 'bkPageInL 1.1s cubic-bezier(.33,1,.68,1) forwards')
                : 'none',
            }}>
              {renderPageContent(page)}
            </div>
          </div>

          {/* 스크롤 힌트 (콘텐츠 오버플로 시 하단 화살표) — info 페이지는 자체 스크롤 영역 사용 */}
          <div className={`bk-scroll-hint ${showScrollHint && !isInfoPage && !isIntroPage ? 'show' : ''}`} style={{
            background: `linear-gradient(transparent 0%, ${activeColors.pageBg || activeColors.bg} 50%)`,
          }}>
            <span style={{ color: activeColors.muted }}>↓</span>
          </div>

          {/* 다음 페이지 (드래그 중에만 렌더) */}
          {isDragging && currentPage < totalPages - 1 && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflowY: 'auto', touchAction: 'none',
              background: infoPageTypes.has(pages[currentPage + 1]?.type || '') ? bookInfoColors.frameBg : undefined,
              transform: `translateX(${(containerWidthRef.current || window.innerWidth) + dragOffset}px)`,
              transition: isSnapping ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
              willChange: 'transform',
            }}>
              <div className="book-page-content" style={{ minHeight: '100%' }}>
                {renderPageContent(pages[currentPage + 1])}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 좌우 화살표 버튼 제거됨 — 탭/스와이프로 네비게이션 */}

      {/* 하단 진행률 바 제거됨 — 상단 툴바로 통합 */}

      {/* 목차 오버레이 */}
      {showToc && (() => {
        // 그룹화된 목차 생성
        const storyTypes = new Set(['intro', 'greeting', 'chapter', 'quote', 'gallery'])
        const weddingDateType = 'wedding-date'
        const weddingVenueType = 'wedding-venue'
        const bonusTypes = new Set(['bonus-intro', 'bonus-interview'])
        const utilTypes = new Set(['guidance', 'contacts', 'bank', 'guestbook', 'rsvp'])

        // 각 그룹의 첫 페이지 인덱스 찾기
        const storyStart = pages.findIndex(p => storyTypes.has(p.type))
        const weddingDateStart = pages.findIndex(p => p.type === weddingDateType)
        const weddingVenueStart = pages.findIndex(p => p.type === weddingVenueType)
        const bonusStart = pages.findIndex(p => bonusTypes.has(p.type))

        // 현재 페이지가 해당 그룹에 있는지
        const isInStory = storyTypes.has(pages[currentPage]?.type)
        const isOnWeddingDate = pages[currentPage]?.type === weddingDateType
        const isOnWeddingVenue = pages[currentPage]?.type === weddingVenueType
        const isInBonus = bonusTypes.has(pages[currentPage]?.type)

        type TocItem = { label: string; pageIndex: number; active: boolean; section?: string }
        const tocItems: TocItem[] = []

        // — STORY 섹션 —
        if (storyStart >= 0) tocItems.push({ label: '우리의 이야기', pageIndex: storyStart, active: isInStory && pages[currentPage]?.type !== 'gallery', section: 'STORY' })
        // 갤러리 (STORY 그룹 내 별도 항목)
        const galleryIndex = pages.findIndex(p => p.type === 'gallery')
        if (galleryIndex >= 0) tocItems.push({ label: '갤러리', pageIndex: galleryIndex, active: pages[currentPage]?.type === 'gallery' })

        // — INFO 섹션 —
        if (weddingDateStart >= 0) tocItems.push({ label: '예식 일시', pageIndex: weddingDateStart, active: isOnWeddingDate, section: 'INFO' })
        if (weddingVenueStart >= 0) tocItems.push({ label: '예식 장소', pageIndex: weddingVenueStart, active: isOnWeddingVenue })
        pages.forEach((p, i) => {
          if (utilTypes.has(p.type)) tocItems.push({ label: p.title || '', pageIndex: i, active: currentPage === i })
        })

        // — BONUS 섹션 —
        if (bonusStart >= 0) tocItems.push({ label: '웨딩 인터뷰', pageIndex: bonusStart, active: isInBonus, section: 'BONUS' })

        return (
          <div className="fixed inset-0 z-50" onClick={() => setShowToc(false)}>
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
            <div className="absolute top-0 left-0 bottom-0 overflow-y-auto" style={{ width: '280px', background: bookColors.pageBg, boxShadow: '4px 0 20px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '11px', letterSpacing: '4px', color: bookColors.muted, marginBottom: '24px' }}>CONTENTS</div>
                {tocItems.map((item, i) => (
                  <div key={i}>
                    {item.section && (
                      <div style={{ paddingTop: i === 0 ? '0' : '16px', paddingBottom: '8px' }}>
                        <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', letterSpacing: '3px', color: bookColors.muted }}>{item.section}</span>
                      </div>
                    )}
                    <button onClick={() => { setShowToc(false); goToPage(item.pageIndex) }} className="w-full text-left py-3 flex items-center justify-between" style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: `0.5px solid ${bookColors.divider}`, opacity: item.active ? 1 : 0.6 }}>
                      <span style={{ fontSize: '13px', color: item.active ? bookColors.accent : bookColors.text, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
                      <span style={{ fontSize: '10px', fontFamily: "'BonmyeongjoSourceHanSerif', serif", color: bookColors.muted }}>{item.pageIndex + 1}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 플로팅 + 버튼 (축의금/연락처 빠른 접근) */}
      {currentPage > 0 && page?.type !== 'intro' && page?.type !== 'end' && openModalType === 'none' && (
        <BookFloatingActions
          onOpenModal={setOpenModalType}
          bookColors={bookColors}
          sectionVisibility={data?.sectionVisibility}
        />
      )}

      {/* 풀스크린 모달 */}
      {openModalType !== 'none' && (
        <BookFullscreenModal
          type={openModalType}
          onChangeType={setOpenModalType}
          onClose={() => setOpenModalType('none')}
          data={data}
          invitationId={invitationId}
          contacts={gfbContacts}
          accounts={gfbAccounts}
          bookColors={bookColors}
        />
      )}
    </div>
  )
}

// -- Book: Fullscreen Modal (연락처/참석여부/오시는길/마음전하기) --
type ModalTab = 'contact' | 'rsvp' | 'location' | 'account' | 'share'

function BookFullscreenModal({ type, onChangeType, onClose, data, invitationId, contacts, accounts, bookColors }: {
  type: ModalTab
  onChangeType: (t: ModalTab) => void
  onClose: () => void
  data: any
  invitationId: string
  contacts: { name: string; phone: string; role: string; side: 'groom' | 'bride' }[]
  accounts: { name: string; bank: { bank: string; account: string; holder: string; enabled: boolean }; role: string; side: 'groom' | 'bride' }[]
  bookColors: BookColorConfig
}) {
  const [rsvpForm, setRsvpForm] = useState({ name: '', phone: '', side: '' as '' | 'groom' | 'bride', sideDetail: '' as '' | 'self' | 'father' | 'mother', attendance: '', guestCount: 1, message: '', mealAttendance: '' as '' | 'yes' | 'no', shuttleBus: '' as '' | 'yes' | 'no' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const accent = bookColors.accent

  const tabs: { key: ModalTab; label: string }[] = [
    contacts.length > 0 ? { key: 'contact', label: '연락하기' } : null,
    data.rsvpEnabled ? { key: 'rsvp', label: '참석여부' } : null,
    { key: 'location', label: '오시는길' },
    accounts.length > 0 ? { key: 'account', label: '마음전하기' } : null,
    { key: 'share', label: '공유하기' },
  ].filter(Boolean) as { key: ModalTab; label: string }[]

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert('복사되었습니다') }

  const handleRsvpSubmit = async () => {
    if (!rsvpForm.name || !rsvpForm.attendance) { alert('이름과 참석 여부를 입력해주세요.'); return }
    setIsSubmitting(true)
    try {
      const attendanceMap: Record<string, string> = { yes: 'attending', no: 'not_attending', maybe: 'pending' }
      const res = await fetch('/api/rsvp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, guestName: rsvpForm.name, guestPhone: rsvpForm.phone.trim() || undefined, attendance: attendanceMap[rsvpForm.attendance] || rsvpForm.attendance, guestCount: rsvpForm.attendance === 'yes' ? rsvpForm.guestCount : 0, message: rsvpForm.message, side: rsvpForm.side || undefined, sideDetail: rsvpForm.sideDetail || undefined, mealAttendance: rsvpForm.attendance === 'yes' && rsvpForm.mealAttendance ? rsvpForm.mealAttendance : undefined, shuttleBus: rsvpForm.attendance === 'yes' && rsvpForm.shuttleBus ? rsvpForm.shuttleBus : undefined }),
      })
      if (res.ok) { alert('참석 여부가 전달되었습니다. 감사합니다!'); onClose(); setRsvpForm({ name: '', phone: '', side: '', sideDetail: '', attendance: '', guestCount: 1, message: '', mealAttendance: '', shuttleBus: '' }) }
      else { const d = (await res.json().catch(() => ({}))) as { error?: string }; alert(d.error || '전송에 실패했습니다.') }
    } catch { alert('전송에 실패했습니다.') } finally { setIsSubmitting(false) }
  }

  const handleKakaoShare = () => {
    const w = window as any; const url = window.location.href
    if (w.Kakao?.Share && w.Kakao.isInitialized?.()) {
      const ratioSizes: Record<string, { w: number; h: number }> = { '3:4': { w: 900, h: 1200 }, '1:1': { w: 800, h: 800 }, '3:2': { w: 1200, h: 800 } }
      const imgSize = ratioSizes[data.meta?.kakaoThumbnailRatio || '1:1']
      const thumbUrl = data.meta?.kakaoThumbnail || data.meta?.ogImage || data.media?.coverImage || ''
      let imageUrl = 'https://invite.deardrawer.com/og-image.png'
      if (thumbUrl) {
        if (typeof thumbUrl === 'string' && thumbUrl.startsWith('https://')) imageUrl = thumbUrl
        else if (typeof thumbUrl === 'string' && thumbUrl.startsWith('/')) imageUrl = `https://invite.deardrawer.com${thumbUrl}`
      }
      w.Kakao.Share.sendDefault({ objectType: 'feed', content: { title: `${data.groom?.name || '신랑'} ❤️ ${data.bride?.name || '신부'}의 결혼식`, description: `${data.wedding?.date || ''}\n${data.wedding?.venue?.name || ''}`, imageUrl, imageWidth: imgSize.w, imageHeight: imgSize.h, link: { mobileWebUrl: url, webUrl: url } }, buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }] })
      onClose()
    } else { navigator.clipboard.writeText(url); alert('링크가 복사되었습니다!') }
  }

  const groomContacts = contacts.filter(c => c.side === 'groom')
  const brideContacts = contacts.filter(c => c.side === 'bride')
  const groomAccounts = accounts.filter(a => a.side === 'groom')
  const brideAccounts = accounts.filter(a => a.side === 'bride')
  const venue = data.wedding?.venue || {}
  const directions = data.wedding?.directions

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />

      {/* 모달 카드 */}
      <div
        className="relative z-10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 32px)', height: 'calc(100% - 80px)', maxWidth: '420px',
          background: bookColors.pageBg, borderRadius: '16px',
          animation: 'bkFadeUp 0.3s ease-out both',
        }}
      >
        {/* 헤더: 닫기 버튼 */}
        <div className="flex items-center justify-end flex-shrink-0 px-3 pt-3 pb-1">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: `${bookColors.muted}15` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={bookColors.muted} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: bookColors.divider }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => onChangeType(tab.key)} className="flex-1 py-3 text-[11px] font-medium relative transition-colors" style={{ color: type === tab.key ? accent : bookColors.muted }}>
              {tab.label}
              {type === tab.key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full" style={{ background: accent }} />}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-5" style={{ touchAction: 'auto' }}>

          {/* 연락하기 */}
          {type === 'contact' && (
            <div>
              {groomContacts.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#60A5FA' }} /><p className="text-xs font-medium" style={{ color: accent }}>신랑측</p></div>
                  {groomContacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < groomContacts.length - 1 ? `0.5px solid ${bookColors.divider}` : 'none' }}>
                      <div><span className="text-xs font-medium" style={{ color: bookColors.heading }}>{c.role}</span><p className="text-[11px]" style={{ color: bookColors.muted }}>{c.name}</p></div>
                      <div className="flex gap-2">
                        <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `0.5px solid ${accent}` }}>
                          <svg className="w-4 h-4" fill="none" stroke={accent} viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                        </a>
                        <a href={`sms:${c.phone}`} onClick={e => e.stopPropagation()} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `0.5px solid ${accent}` }}>
                          <svg className="w-4 h-4" fill="none" stroke={accent} viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {brideContacts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F472B6' }} /><p className="text-xs font-medium" style={{ color: accent }}>신부측</p></div>
                  {brideContacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < brideContacts.length - 1 ? `0.5px solid ${bookColors.divider}` : 'none' }}>
                      <div><span className="text-xs font-medium" style={{ color: bookColors.heading }}>{c.role}</span><p className="text-[11px]" style={{ color: bookColors.muted }}>{c.name}</p></div>
                      <div className="flex gap-2">
                        <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `0.5px solid ${accent}` }}>
                          <svg className="w-4 h-4" fill="none" stroke={accent} viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                        </a>
                        <a href={`sms:${c.phone}`} onClick={e => e.stopPropagation()} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `0.5px solid ${accent}` }}>
                          <svg className="w-4 h-4" fill="none" stroke={accent} viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 참석여부 */}
          {type === 'rsvp' && (
            <div>
              {data.rsvpNotice && (
                <p className="text-xs text-center mb-3 whitespace-pre-line leading-relaxed" style={{ color: bookColors.muted, lineHeight: 1.6 }}>{data.rsvpNotice}</p>
              )}
              <input type="text" placeholder="이름" value={rsvpForm.name} onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} className="w-full p-3 rounded-xl mb-3 text-sm outline-none" style={{ background: `${accent}08`, color: bookColors.text }} />
              {data.rsvpPhoneOption && (
                <input type="text" inputMode="numeric" maxLength={4} placeholder="연락처 뒷자리 4자리" value={rsvpForm.phone} onChange={(e) => setRsvpForm({ ...rsvpForm, phone: e.target.value.replace(/\D/g, '').slice(0, 4) })} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} className="w-full p-3 rounded-xl mb-3 text-sm outline-none" style={{ background: `${accent}08`, color: bookColors.text }} />
              )}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => setRsvpForm({ ...rsvpForm, side: rsvpForm.side === 'groom' ? '' : 'groom', sideDetail: '' })} className="py-3 rounded-xl text-sm transition-all" style={{ background: rsvpForm.side === 'groom' ? accent : `${accent}08`, color: rsvpForm.side === 'groom' ? '#fff' : bookColors.text }}>신랑측</button>
                <button onClick={() => setRsvpForm({ ...rsvpForm, side: rsvpForm.side === 'bride' ? '' : 'bride', sideDetail: '' })} className="py-3 rounded-xl text-sm transition-all" style={{ background: rsvpForm.side === 'bride' ? accent : `${accent}08`, color: rsvpForm.side === 'bride' ? '#fff' : bookColors.text }}>신부측</button>
              </div>
              {data.rsvpSideDetail && rsvpForm.side && (
                <div className="mb-3">
                  <p className="text-xs font-medium mb-2" style={{ color: bookColors.text }}>초대 경로</p>
                  <div className="flex gap-2 flex-wrap" style={{ wordBreak: 'keep-all' }}>
                    {((rsvpForm.side === 'groom' && (data.rsvpSideDetailOptions?.groomSelf ?? true)) || (rsvpForm.side === 'bride' && (data.rsvpSideDetailOptions?.brideSelf ?? true))) && (
                      <button onClick={() => setRsvpForm({ ...rsvpForm, sideDetail: 'self' })} className="flex-1 min-w-0 py-2 px-1 rounded-xl text-xs text-center transition-all" style={{ background: rsvpForm.sideDetail === 'self' ? accent : `${accent}08`, color: rsvpForm.sideDetail === 'self' ? '#fff' : bookColors.text }}>{rsvpForm.side === 'groom' ? '신랑' : '신부'}</button>
                    )}
                    {((rsvpForm.side === 'groom' && (data.rsvpSideDetailOptions?.groomFather ?? true)) || (rsvpForm.side === 'bride' && (data.rsvpSideDetailOptions?.brideFather ?? true))) && (
                      <button onClick={() => setRsvpForm({ ...rsvpForm, sideDetail: 'father' })} className="flex-1 min-w-0 py-2 px-1 rounded-xl text-xs text-center transition-all" style={{ background: rsvpForm.sideDetail === 'father' ? accent : `${accent}08`, color: rsvpForm.sideDetail === 'father' ? '#fff' : bookColors.text }}>{rsvpForm.side === 'groom' ? '신랑' : '신부'} 아버지</button>
                    )}
                    {((rsvpForm.side === 'groom' && (data.rsvpSideDetailOptions?.groomMother ?? true)) || (rsvpForm.side === 'bride' && (data.rsvpSideDetailOptions?.brideMother ?? true))) && (
                      <button onClick={() => setRsvpForm({ ...rsvpForm, sideDetail: 'mother' })} className="flex-1 min-w-0 py-2 px-1 rounded-xl text-xs text-center transition-all" style={{ background: rsvpForm.sideDetail === 'mother' ? accent : `${accent}08`, color: rsvpForm.sideDetail === 'mother' ? '#fff' : bookColors.text }}>{rsvpForm.side === 'groom' ? '신랑' : '신부'} 어머니</button>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mb-3">
                <button onClick={() => setRsvpForm({ ...rsvpForm, attendance: 'yes' })} className="flex-1 py-3 rounded-xl text-sm" style={{ background: rsvpForm.attendance === 'yes' ? accent : `${accent}08`, color: rsvpForm.attendance === 'yes' ? '#fff' : bookColors.text }}>참석</button>
                <button onClick={() => setRsvpForm({ ...rsvpForm, attendance: 'no' })} className="flex-1 py-3 rounded-xl text-sm" style={{ background: rsvpForm.attendance === 'no' ? accent : `${accent}08`, color: rsvpForm.attendance === 'no' ? '#fff' : bookColors.text }}>불참</button>
              </div>
              {rsvpForm.attendance === 'yes' && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm" style={{ color: bookColors.text }}>참석 인원</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <button onClick={() => setRsvpForm({ ...rsvpForm, guestCount: Math.max(1, rsvpForm.guestCount - 1) })} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${accent}08` }}>-</button>
                    <span className="w-8 text-center text-sm" style={{ color: bookColors.text }}>{rsvpForm.guestCount}</span>
                    <button onClick={() => setRsvpForm({ ...rsvpForm, guestCount: rsvpForm.guestCount + 1 })} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${accent}08` }}>+</button>
                  </div>
                </div>
              )}
              {data.rsvpMealOption && rsvpForm.attendance === 'yes' && (
                <div className="mb-3">
                  <span className="text-sm mb-1.5 block" style={{ color: bookColors.text }}>식사 여부</span>
                  <div className="grid grid-cols-2 gap-2">
                    {([{ v: 'yes' as const, l: '식사 예정' }, { v: 'no' as const, l: '식사 안 함' }]).map(opt => (
                      <button key={opt.v} onClick={() => setRsvpForm({ ...rsvpForm, mealAttendance: rsvpForm.mealAttendance === opt.v ? '' : opt.v })} className="py-3 rounded-xl text-sm transition-all" style={{ background: rsvpForm.mealAttendance === opt.v ? accent : `${accent}08`, color: rsvpForm.mealAttendance === opt.v ? '#fff' : bookColors.text }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {data.rsvpShuttleOption && rsvpForm.attendance === 'yes' && (
                <div className="mb-3">
                  <span className="text-sm mb-1.5 block" style={{ color: bookColors.text }}>대절버스 이용 여부</span>
                  <div className="grid grid-cols-2 gap-2">
                    {([{ v: 'yes' as const, l: '이용 예정' }, { v: 'no' as const, l: '이용 안 함' }]).map(opt => (
                      <button key={opt.v} onClick={() => setRsvpForm({ ...rsvpForm, shuttleBus: rsvpForm.shuttleBus === opt.v ? '' : opt.v })} className="py-3 rounded-xl text-sm transition-all" style={{ background: rsvpForm.shuttleBus === opt.v ? accent : `${accent}08`, color: rsvpForm.shuttleBus === opt.v ? '#fff' : bookColors.text }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <textarea placeholder={data.rsvpMessagePlaceholder || "메시지 (선택)"} value={rsvpForm.message} onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} className="w-full p-3 rounded-xl mb-4 text-sm outline-none resize-none h-20" style={{ background: `${accent}08`, color: bookColors.text }} />
              <button onClick={handleRsvpSubmit} disabled={isSubmitting || !rsvpForm.name.trim() || !rsvpForm.attendance} className="w-full py-3 rounded-xl text-sm text-white" style={{ background: accent, opacity: (!rsvpForm.name.trim() || !rsvpForm.attendance) ? 0.4 : 1 }}>{isSubmitting ? '전송중...' : '제출하기'}</button>
            </div>
          )}

          {/* 오시는길 */}
          {type === 'location' && (
            <div>
              <div className="text-center mb-5">
                <p className="text-sm font-medium mb-1" style={{ color: bookColors.heading }}>{venue.name || '예식장'}</p>
                <p className="text-xs" style={{ color: bookColors.muted }}>{venue.address || ''}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                <a href={`https://map.naver.com/v5/search/${encodeURIComponent(venue.address || '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3 rounded-xl" style={{ background: `${accent}08` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#03C75A' }}><span className="text-white text-xs font-bold">N</span></div>
                  <span className="text-[10px]" style={{ color: bookColors.text }}>네이버지도</span>
                </a>
                <a href={`https://map.kakao.com/link/search/${encodeURIComponent(venue.address || '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3 rounded-xl" style={{ background: `${accent}08` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#FEE500' }}><span className="text-black text-xs font-bold">K</span></div>
                  <span className="text-[10px]" style={{ color: bookColors.text }}>카카오맵</span>
                </a>
                <a href={`tmap://search?name=${encodeURIComponent(venue.name || '')}`} className="flex flex-col items-center p-3 rounded-xl" style={{ background: `${accent}08` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#4285F4' }}><span className="text-white text-xs font-bold">T</span></div>
                  <span className="text-[10px]" style={{ color: bookColors.text }}>티맵</span>
                </a>
              </div>
              {directions?.car && (
                <div className="mb-4">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: accent }}>자가용</p>
                  <div className="rounded-xl p-3" style={{ background: `${accent}08` }}>
                    <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: bookColors.text }}>{directions.car}</p>
                  </div>
                </div>
              )}
              {directions?.publicTransport && (
                <div className="mb-4">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: accent }}>대중교통</p>
                  <div className="rounded-xl p-3" style={{ background: `${accent}08` }}>
                    <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: bookColors.text }}>{directions.publicTransport}</p>
                  </div>
                </div>
              )}
              <button onClick={() => copyToClipboard(venue.address || '')} className="w-full py-2.5 rounded-xl text-xs" style={{ background: `${accent}08`, color: bookColors.text }}>주소 복사</button>
            </div>
          )}

          {/* 마음전하기 */}
          {type === 'account' && (
            <div>
              {groomAccounts.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#60A5FA' }} /><p className="text-xs font-medium" style={{ color: accent }}>신랑측</p></div>
                  {groomAccounts.map((a, i) => (
                    <div key={i} className="p-3 rounded-xl mb-2" style={{ background: `${accent}08` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: bookColors.heading }}>{a.role} {a.name}</span>
                        <button onClick={() => copyToClipboard(a.bank.account.replace(/[^0-9]/g, ''))} className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: `${accent}15`, color: accent }}>복사</button>
                      </div>
                      <p className="text-[10px]" style={{ color: bookColors.muted }}>{a.bank.holder}</p>
                      <p className="text-xs" style={{ color: bookColors.text }}>{a.bank.bank} {a.bank.account}</p>
                    </div>
                  ))}
                </div>
              )}
              {brideAccounts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F472B6' }} /><p className="text-xs font-medium" style={{ color: accent }}>신부측</p></div>
                  {brideAccounts.map((a, i) => (
                    <div key={i} className="p-3 rounded-xl mb-2" style={{ background: `${accent}08` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: bookColors.heading }}>{a.role} {a.name}</span>
                        <button onClick={() => copyToClipboard(a.bank.account.replace(/[^0-9]/g, ''))} className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: `${accent}15`, color: accent }}>복사</button>
                      </div>
                      <p className="text-[10px]" style={{ color: bookColors.muted }}>{a.bank.holder}</p>
                      <p className="text-xs" style={{ color: bookColors.text }}>{a.bank.bank} {a.bank.account}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 공유하기 */}
          {type === 'share' && (
            <div>
              <p className="text-center text-sm mb-5" style={{ color: bookColors.text }}>청첩장을 공유해보세요</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleKakaoShare} className="flex flex-col items-center justify-center p-5 rounded-xl active:scale-[0.98]" style={{ background: '#FEE500' }}>
                  <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" /></svg>
                  <span className="text-xs font-medium" style={{ color: '#3C1E1E' }}>카카오톡 공유</span>
                </button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('링크가 복사되었습니다!') }} className="flex flex-col items-center justify-center p-5 rounded-xl active:scale-[0.98]" style={{ background: `${accent}08` }}>
                  <svg className="w-8 h-8 mb-2" fill="none" stroke={accent} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                  <span className="text-xs font-medium" style={{ color: bookColors.text }}>링크 복사</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// -- Book: Cover --
function BookCover({ data, onNext }: { data: any; onNext: () => void }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const [loaded, setLoaded] = useState(false)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const coverTitle = data.design?.coverTitle || 'OUR WEDDING ESSAY'
  const coverDesign = data.design?.coverDesign || 'full'
  const coverImage = data.media?.coverImage || ''
  const weddingDate = data.wedding?.date ? new Date(data.wedding.date) : new Date()
  const dateStr = `${weddingDate.getFullYear()}.${String(weddingDate.getMonth() + 1).padStart(2, '0')}.${String(weddingDate.getDate()).padStart(2, '0')}`
  const venueName = data.wedding?.venue?.name || ''

  useEffect(() => { setTimeout(() => setLoaded(true), 200) }, [])

  const openButton = (
    <button
      onClick={(e) => { e.stopPropagation(); onNext() }}
      className="mt-10"
      style={{
        background: (coverDesign === 'full' || coverDesign === 'typo') && coverImage ? 'rgba(255,255,255,0.15)' : `${bookColors.accent}10`,
        border: `1.5px solid ${(coverDesign === 'full' || coverDesign === 'typo') && coverImage ? 'rgba(255,255,255,0.6)' : bookColors.accent}`,
        padding: '12px 32px',
        cursor: 'pointer', fontFamily: "'Pretendard', sans-serif", fontSize: '11px',
        letterSpacing: '4px',
        color: (coverDesign === 'full' || coverDesign === 'typo') && coverImage ? '#fff' : bookColors.heading,
        fontWeight: 500,
        opacity: loaded ? 1 : 0, transition: 'opacity 0.6s 0.6s',
        backdropFilter: (coverDesign === 'full' || coverDesign === 'typo') && coverImage ? 'blur(4px)' : 'none',
      }}
    >
      OPEN BOOK
    </button>
  )

  // 이미지 크롭 설정 (모든 커버 디자인 공용)
  const bookCropStyle = getCropStyle(data.media?.coverImageSettings)

  // ── 전면 (full): 이미지가 화면 전체를 채움, 텍스트 오버레이 ──
  if (coverDesign === 'full' && coverImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-end relative overflow-hidden" onClick={onNext} style={{ background: '#000', cursor: 'pointer' }}>
        <div className="absolute inset-0">
          <img src={coverImage} alt="" className="w-full h-full object-cover" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease-out', ...bookCropStyle }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.6) 100%)' }} />
        </div>

        {/* 상단 타이틀 */}
        <div className="absolute top-0 left-0 right-0 pt-14 text-center" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s 0.3s' }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '12px', letterSpacing: '5px', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{coverTitle}</div>
        </div>

        {/* 하단 텍스트 */}
        <div className="relative z-10 pb-8 text-center" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.8s 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 300, letterSpacing: '6px', color: '#fff' }}>
            {groomName} <span className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>&</span> {brideName}
          </div>
          <div className="mt-4">
            <div style={{ width: '30px', height: '0.5px', background: 'rgba(255,255,255,0.4)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '12px', letterSpacing: '4px', color: 'rgba(255,255,255,0.7)' }}>{dateStr}</div>
            {venueName && (
              <div className="mt-2" style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>{venueName}</div>
            )}
          </div>
          {openButton}
        </div>
      </div>
    )
  }

  // ── 타이포 (typo): 전면 이미지 배경 + 중앙 화이트 카드 ──
  if (coverDesign === 'typo' && coverImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" onClick={onNext} style={{ background: '#000', cursor: 'pointer' }}>
        {/* 전면 배경 이미지 */}
        <div className="absolute inset-0">
          <img src={coverImage} alt="" className="w-full h-full object-cover" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease-out', ...bookCropStyle }} />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
        </div>

        {/* 중앙 화이트 카드 */}
        <div className="relative z-10" style={{
          width: '260px', padding: '40px 28px',
          background: '#fff',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          {/* 큰 타이틀 */}
          <div className="text-center" style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '24px', fontWeight: 300, letterSpacing: '6px', lineHeight: 1.4, color: '#1a1a1a' }}>
              {coverTitle.split(' ').map((word: string, i: number) => (
                <div key={i}>{word}</div>
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ width: '40px', height: '0.5px', background: '#ccc', margin: '0 auto 24px' }} />

          {/* 이름 나란히 */}
          <div className="text-center" style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 300, letterSpacing: '4px', color: '#1a1a1a' }}>
              {groomName} <span className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', fontStyle: 'italic', color: '#999' }}>&</span> {brideName}
            </div>
          </div>

          {/* 날짜 + 장소 */}
          <div className="text-center">
            <div style={{ width: '40px', height: '0.5px', background: '#ccc', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '12px', letterSpacing: '4px', color: '#999' }}>{dateStr}</div>
            {venueName && (
              <div className="mt-2" style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '11px', letterSpacing: '2px', color: '#999' }}>{venueName}</div>
            )}
          </div>
        </div>
        {openButton}
      </div>
    )
  }

  // ── 센터 (center): 스크랩북 스타일 ──
  if (coverDesign === 'center' && coverImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" onClick={onNext} style={{ background: '#EDEBE6', cursor: 'pointer' }}>
        {/* 스크립트 타이틀 */}
        <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s 0.3s' }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '24px', fontWeight: 300, letterSpacing: '6px', lineHeight: 1.4, color: '#3D3028', marginBottom: '28px', textAlign: 'center' }}>
            {(coverTitle || 'save the date').split(' ').map((word: string, i: number) => (
              <div key={i}>{word}</div>
            ))}
          </div>
        </div>

        {/* 테이프 장식 사진 - 상단 중앙 */}
        <div className="relative" style={{ opacity: loaded ? 1 : 0, transition: 'all 0.8s 0.5s', transform: loaded ? 'translateY(0)' : 'translateY(16px)' }}>
          <div style={{ position: 'absolute', top: '-8px', left: '50%', zIndex: 2, width: '52px', height: '16px', background: 'linear-gradient(135deg, rgba(220,210,190,0.85), rgba(200,190,170,0.65))', transform: 'translateX(-50%) rotate(-2deg)', borderRadius: '1px' }} />
          <div style={{ width: '180px', height: '220px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <img src={coverImage} alt="" className="w-full h-full object-cover" style={bookCropStyle} />
          </div>
        </div>

        {/* 날짜 - 크고 이탤릭 */}
        <div className="mt-8 text-center" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s 0.7s' }}>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '20px', fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: '#3D3028' }}>{dateStr}</div>
        </div>

        {/* 이름 나란히 + ARE GETTING MARRIED */}
        <div className="mt-3 text-center" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s 0.8s' }}>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', fontWeight: 400, letterSpacing: '5px', color: '#3D3028', textTransform: 'uppercase' as const }}>{groomName} & {brideName}</div>
          <div className="mt-1" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '9px', fontWeight: 300, letterSpacing: '4px', color: '#8B7A68' }}>ARE GETTING MARRIED</div>
        </div>

        {/* 장소 */}
        {venueName && (
          <div className="mt-8" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s 1s' }}>
            <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '13px', letterSpacing: '2px', color: '#5C5040', textAlign: 'center' }}>{venueName}</div>
          </div>
        )}

        <button onClick={(e) => { e.stopPropagation(); onNext() }} className="mt-8" style={{
          background: 'transparent', border: '1.5px solid #3D3028',
          padding: '12px 32px', cursor: 'pointer',
          fontFamily: "'Pretendard', sans-serif", fontSize: '11px', letterSpacing: '4px',
          color: '#3D3028', fontWeight: 500,
          opacity: loaded ? 1 : 0, transition: 'opacity 0.6s 1.1s',
        }}>
          OPEN BOOK
        </button>
      </div>
    )
  }

  // ── 엠보싱 (emboss) / 이미지 없음 / 기본 폴백 ──
  const bkEmbossColors: Record<string, { bg: string; text: string; highlight: string; shadow: string; line: string }> = {
    'dusty-blue': { bg: '#8E9EAB', text: 'rgba(255,255,255,0.5)', highlight: 'rgba(255,255,255,0.35)', shadow: 'rgba(0,0,0,0.12)', line: 'rgba(255,255,255,0.25)' },
    'beige':      { bg: '#C2B9A7', text: 'rgba(255,255,255,0.5)', highlight: 'rgba(255,255,255,0.4)', shadow: 'rgba(0,0,0,0.1)', line: 'rgba(255,255,255,0.22)' },
    'teal':       { bg: '#7A8B8B', text: 'rgba(255,255,255,0.55)', highlight: 'rgba(255,255,255,0.45)', shadow: 'rgba(0,0,0,0.22)', line: 'rgba(255,255,255,0.2)' },
    'gray':       { bg: '#9BA3A6', text: 'rgba(255,255,255,0.5)', highlight: 'rgba(255,255,255,0.35)', shadow: 'rgba(0,0,0,0.15)', line: 'rgba(255,255,255,0.22)' },
    'dark':       { bg: '#4A4A48', text: 'rgba(212,185,150,0.55)', highlight: 'rgba(255,235,200,0.35)', shadow: 'rgba(0,0,0,0.3)', line: 'rgba(212,185,150,0.25)' },
  }
  const bkEc = bkEmbossColors[data.design?.embossColor || 'teal'] || bkEmbossColors['teal']
  const bkEmbossStyle = (size: 'sm' | 'md' | 'lg') => ({
    color: bkEc.text,
    textShadow: size === 'lg'
      ? `0 2px 3px ${bkEc.highlight}, 0 -1px 2px ${bkEc.shadow}`
      : size === 'md'
      ? `0 1px 2px ${bkEc.highlight}, 0 -1px 1px ${bkEc.shadow}`
      : `0 1px 1px ${bkEc.highlight}, 0 -1px 1px ${bkEc.shadow}`,
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" onClick={onNext} style={{ background: bkEc.bg, cursor: 'pointer' }}>
      {/* 상단 장식선 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-[2000ms]" style={{ width: '1px', height: loaded ? '60px' : '0px', background: bkEc.line }} />

      {/* 큰 타이틀 */}
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s 0.3s' }}>
        <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '28px', fontWeight: 300, letterSpacing: '6px', lineHeight: 1.4, marginBottom: '36px', textAlign: 'center', ...bkEmbossStyle('lg') }}>
          {coverTitle.split(' ').map((word: string, i: number) => (
            <div key={i}>{word}</div>
          ))}
        </div>
      </div>

      {/* 이름 나란히 */}
      <div className="text-center" style={{ opacity: loaded ? 1 : 0, transition: 'all 0.8s 0.5s', transform: loaded ? 'translateY(0)' : 'translateY(16px)' }}>
        <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 200, letterSpacing: '6px', ...bkEmbossStyle('md') }}>
          {groomName} <span className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', fontStyle: 'italic' }}>&</span> {brideName}
        </div>
        <div className="mt-6">
          <div style={{ width: '30px', height: '0.5px', background: bkEc.line, margin: '0 auto 12px' }} />
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '12px', letterSpacing: '4px', ...bkEmbossStyle('sm') }}>{dateStr}</div>
          {venueName && (
            <div className="mt-2" style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '11px', letterSpacing: '2px', ...bkEmbossStyle('sm') }}>{venueName}</div>
          )}
        </div>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onNext() }} className="mt-10" style={{
        background: 'transparent', border: `1.5px solid ${bkEc.line}`,
        padding: '12px 32px', cursor: 'pointer',
        fontFamily: "'Pretendard', sans-serif", fontSize: '11px', letterSpacing: '4px',
        fontWeight: 500, opacity: loaded ? 1 : 0, transition: 'opacity 0.6s 0.8s',
        ...bkEmbossStyle('sm'),
      }}>
        OPEN BOOK
      </button>
    </div>
  )
}

// -- Book: TOC --
function BookToc({ pages, currentPage, onGoTo, colorTheme, customThemeColors }: { pages: BookPage[]; currentPage: number; onGoTo: (i: number) => void; colorTheme?: string; customThemeColors?: { bg: string; pageBg: string; accent: string; text: string } }) {
  const bookColors = getBookColors(colorTheme, customThemeColors)
  const contentPages = pages.filter(p => !['cover', 'toc', 'end'].includes(p.type))
  return (
    <div className="bk-page flex items-center" style={{ background: bookColors.pageBg }}>
      <div className="w-full px-10 py-16 max-w-md mx-auto">
        <div className="text-center mb-12">
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '6px', color: bookColors.muted }}>CONTENTS</div>
          <div className="mt-4" style={{ width: '24px', height: '0.5px', background: bookColors.accent, margin: '0 auto' }} />
        </div>
        <div className="space-y-0">
          {contentPages.map((p, i) => {
            const pageIndex = pages.findIndex(pp => pp.id === p.id)
            return (
              <button key={p.id} onClick={(e) => { e.stopPropagation(); onGoTo(pageIndex) }} className="w-full flex items-baseline gap-3 py-3" style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: `0.5px solid ${bookColors.divider}` }}>
                <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', color: bookColors.muted, flexShrink: 0, width: '24px', textAlign: 'right' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-left" style={{ fontSize: '14px', color: bookColors.text, letterSpacing: '0.5px' }}>{p.title}</span>
                <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', color: bookColors.muted, flexShrink: 0 }}>{pageIndex + 1}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// -- Book: Intro (사진 없는 이유) --
function BookIntro({ data, onOpenModal }: { data: any; onOpenModal?: (modal: 'contact' | 'rsvp' | 'location' | 'account') => void }) {
  const bookColors = getBookColors(data?.colorTheme, data?.customThemeColors)
  const intro = data?.intro
  const title = intro?.title || '우리만의 에세이'
  const subtitle = intro?.subtitle || '— 사진 없는 청첩장 —'
  const bodyText = intro?.body || '사진이 없는 이유는 단순합니다.\n우리의 이야기가 더 잘 보이길 바라서입니다.\n\n수많은 이미지 속에서\n스쳐 지나가는 대신,\n한 문장이라도 천천히 읽히고 싶었습니다.\n\n이곳은 우리의 기록이고,\n작은 에세이입니다.'
  const lines = bodyText.split('\n')

  // 텍스트 컬러 (커스텀 테마 accentText > intro textColor > 기본 흰색)
  const tc = (data?.colorTheme === 'essay-custom' && data?.customThemeColors?.accentText) || intro?.textColor || '#FFFFFF'
  const hexToRgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  const tcFull = tc
  const tcSub = hexToRgba(tc, 0.6)
  const tcBody = hexToRgba(tc, 0.9)
  const tcNav = hexToRgba(tc, 0.7)
  const tcNavLabel = hexToRgba(tc, 0.5)
  const tcNavBg = hexToRgba(tc, 0.12)
  const tcHint = hexToRgba(tc, 0.4)
  const tcHintArrow = hexToRgba(tc, 0.6)

  // 하단 네비게이션 아이템 (팝업 모달로 연결, sectionVisibility 반영)
  const sv = data?.sectionVisibility
  const navItems = [
    sv?.contacts !== false ? { modal: 'contact' as const, label: '연락하기', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg> } : null,
    data?.rsvpEnabled && sv?.rsvp !== false ? { modal: 'rsvp' as const, label: '참석여부', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> } : null,
    { modal: 'location' as const, label: '오시는길', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
    sv?.bankAccounts !== false ? { modal: 'account' as const, label: '마음전하기', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> } : null,
  ].filter(Boolean) as { modal: 'contact' | 'rsvp' | 'location' | 'account'; label: string; icon: React.ReactNode }[]

  return (
    <div className="bk-page flex flex-col items-center justify-center" style={{ background: intro?.backgroundColor || bookColors.accent, position: 'relative' }}>
      <div className="w-full px-12 py-16 max-w-md mx-auto text-center flex-1 flex flex-col justify-center">
        <BA d={200} className="mb-10">
          <p className="es-f18" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 600, lineHeight: 1.6, color: tcFull }}>{title}</p>
          <p className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', letterSpacing: '2px', color: tcSub, marginTop: '6px' }}>{subtitle}</p>
        </BA>
        <div>
          {lines.map((line: string, i: number) => (
            <BA key={i} d={400 + i * 80}>
              <p className="es-f14" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 2.4, color: tcBody }}>{line || '\u00A0'}</p>
            </BA>
          ))}
        </div>
      </div>

      {/* 하단 퀵 네비게이션 (팝업 모달) */}
      {onOpenModal && (
        <BA d={800} type="fade">
          <div className="w-full pb-6 pt-2">
            <div className="flex items-center justify-center gap-6 px-8">
              {navItems.map((item) => (
                <button
                  key={item.modal}
                  onClick={(e) => { e.stopPropagation(); onOpenModal(item.modal) }}
                  className="flex flex-col items-center gap-1.5 transition-opacity active:opacity-60"
                  style={{ color: tcNav }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: tcNavBg, backdropFilter: 'blur(4px)' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '9px', letterSpacing: '0.5px', color: tcNavLabel }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </BA>
      )}

      {/* 우측 탭 유도 힌트 - 원형 */}
      <div style={{
        position: 'absolute', top: '50%', right: '28px', transform: 'translateY(-50%)',
        width: '44px', height: '44px', borderRadius: '50%',
        border: `1px solid ${tcHint}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, animation: 'bkFadeIn 1.2s ease-out 2000ms forwards, bkSwipePulse 3s ease-in-out 3200ms infinite',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'bkSwipeX 1.8s ease-in-out 2800ms infinite' }}>
          <path d="M9 6l6 6-6 6" stroke={tcHintArrow} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// -- Book: Greeting --
function BookGreeting({ data }: { data: any }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const text = data.greeting || ''
  const lines = text.split('\n')
  return (
    <div className="bk-page" style={{ background: bookColors.pageBg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* 인사말 본문: 우하단 정렬 */}
      <div style={{ marginTop: 'auto', marginBottom: '80px', marginLeft: 'auto', textAlign: 'right' as const, maxWidth: '240px', paddingRight: '48px' }}>
        {lines.map((line: string, i: number) => (
          <span key={i} className="es-f15" style={{
            display: 'block',
            fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 200,
            lineHeight: 2.5, letterSpacing: '0.2px', color: bookColors.text,
            opacity: 0, animation: `bkFadeIn 1.4s ease-out ${400 + i * 300}ms forwards`,
          }}>{line || '\u00A0'}</span>
        ))}
      </div>
    </div>
  )
}

// -- Book: Chapter --
function BookChapter({ chapter, index, ed = false, colorTheme, customThemeColors }: { chapter: any; index: number; ed?: boolean; colorTheme?: string; customThemeColors?: { bg: string; pageBg: string; accent: string; text: string } }) {
  const bookColors = getBookColors(colorTheme, customThemeColors)
  const lines = (chapter.body || '').split('\n')

  return (
    <div className="bk-page" style={{ background: bookColors.pageBg, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 스크롤 영역 */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* 챕터 헤더 */}
        <div style={{ padding: '100px 44px 0' }}>
          <div style={{ opacity: 0, animation: 'bkFadeIn 1.4s ease-out 300ms forwards' }}>
            <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '26px', fontWeight: 300, color: bookColors.heading, lineHeight: 1.6, letterSpacing: '0.5px', marginTop: 0 }}>
              {chapter.title}
            </h2>
          </div>
          {chapter.subtitle && (
            <div style={{ opacity: 0, animation: 'bkFadeIn 1s ease-out 600ms forwards' }}>
              <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '8.5px', fontWeight: 400, letterSpacing: '3px', color: bookColors.muted, textTransform: 'uppercase' as const, marginTop: '10px' }}>
                {chapter.subtitle}
              </div>
            </div>
          )}
        </div>

        {/* 사진 */}
        {chapter.photo && (
          <div style={{ opacity: 0, animation: 'bkFadeIn 1.8s ease-out 500ms forwards', position: 'relative', zIndex: 1, width: chapter.photoStyle === 'square' ? '160px' : '100%', margin: '28px 0 0', padding: 0, marginLeft: chapter.photoStyle === 'square' ? '44px' : undefined, overflow: 'hidden', aspectRatio: chapter.photoStyle === 'square' ? '1/1' : '16/9' }}>
            {chapter.photoCrop ? (
              <img
                src={chapter.photo}
                alt={chapter.title}
                style={{
                  position: 'absolute',
                  width: `${10000 / chapter.photoCrop.width}%`,
                  height: `${10000 / chapter.photoCrop.height}%`,
                  left: `${-chapter.photoCrop.x * 100 / chapter.photoCrop.width}%`,
                  top: `${-chapter.photoCrop.y * 100 / chapter.photoCrop.height}%`,
                  maxWidth: 'none',
                  display: 'block',
                  filter: 'saturate(0.85)',
                }}
              />
            ) : (
              <img
                src={chapter.photo}
                alt={chapter.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(0.85)' }}
              />
            )}
            {(chapter.location || chapter.date) && (
              <div style={{ position: 'absolute', bottom: '14px', left: '16px', zIndex: 2 }}>
                {chapter.location && (
                  <span style={{ display: 'block', fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', letterSpacing: '3px', color: `rgba(244,241,235,0.5)`, textTransform: 'uppercase' as const }}>
                    {chapter.location}
                  </span>
                )}
                {chapter.date && (
                  <span style={{ display: 'block', fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', letterSpacing: '3px', color: `rgba(244,241,235,0.5)`, textTransform: 'uppercase' as const }}>
                    {chapter.date}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 메타 정보 (위치/날짜) - 사진 아래 */}
        {(chapter.location || chapter.date) && (
          <div style={{ opacity: 0, animation: 'bkFadeIn 1.2s ease-out 900ms forwards', padding: '24px 44px 0' }}>
            {chapter.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '1px', color: bookColors.muted }}>
                <span style={{ fontSize: '9px', opacity: 0.5, width: '14px', textAlign: 'center' as const }}>◎</span>
                {chapter.location}
              </div>
            )}
            {chapter.date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0', fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '1px', color: bookColors.muted }}>
                <span style={{ fontSize: '9px', opacity: 0.5, width: '14px', textAlign: 'center' as const }}>▪</span>
                {chapter.date}
              </div>
            )}
            <div style={{ width: '100%', height: '1px', background: `${bookColors.muted}18`, marginTop: '16px' }} />
          </div>
        )}

        {/* 본문 */}
        <div style={{ padding: '0 44px 40px' }} className={`theme-${colorTheme || 'essay-ivory'}`}>
          <div style={{ paddingTop: (chapter.location || chapter.date) ? '0' : '28px', opacity: 0, animation: 'bkFadeIn 2s ease-out 1300ms forwards' }}>
            {lines.map((line: string, j: number) => (
              <p key={j} className="es-f13" style={{
                fontFamily: "'Pretendard', sans-serif", fontSize: '12.5px', lineHeight: 2.4,
                fontWeight: 300, color: `${bookColors.heading}BF`, letterSpacing: '0.2px',
                maxWidth: '210px',
              }}>{line || '\u00A0'}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// -- Book: Interview (Q&A) --
function BookInterview({ qa, index, ed = false, colorTheme, customThemeColors }: { qa: any; index: number; ed?: boolean; colorTheme?: string; customThemeColors?: { bg: string; pageBg: string; accent: string; text: string } }) {
  const bookColors = getBookColors(colorTheme, customThemeColors)
  const answerLines = (qa.answer || '').split('\n')
  const qNum = String(index + 1).padStart(2, '0')

  return (
    <div className="bk-page flex items-center" style={{ background: bookColors.pageBg, position: 'relative', overflow: 'hidden' }}>
      {/* 에디토리얼: 배경 Q 넘버 */}
      {ed && (
        <div style={{
          position: 'absolute', top: '50px', right: '-20px',
          fontFamily: "'BonmyeongjoSourceHanSerif', serif",
          fontSize: '200px', fontWeight: 300, lineHeight: 1,
          color: bookColors.accent, opacity: 0.04,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          Q
        </div>
      )}

      <div className="w-full px-10 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="mb-8">
          <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: ed ? '11px' : '10px', letterSpacing: '4px', color: bookColors.muted }}>
            Q.{qNum}
          </span>
        </BA>

        {/* 질문 */}
        <BA d={200} type="right" className="mb-6">
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: ed ? '18px' : '17px', fontWeight: 600, lineHeight: 1.7, color: bookColors.heading }}>
              {qa.question}
            </h3>
        </BA>

        <BA d={400}><BLine width={ed ? '32px' : '24px'} color={bookColors.accent} d={0} /></BA>
        <div style={{ marginBottom: '20px' }} />

        {/* 답변 */}
        <div className={`theme-${colorTheme || 'essay-ivory'}`}>
          {answerLines.map((line: string, j: number) => (
              <BA key={j} d={500 + j * 70}>
                <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }}>{line || '\u00A0'}</p>
              </BA>
          ))}
        </div>

        {qa.answerer && qa.answerer !== 'both' && (
          <BA d={700} type="fade">
            <div className="mt-8 text-right">
              <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '11px', fontStyle: 'italic', color: bookColors.muted }}>
                — {qa.answerer === 'groom' ? '신랑' : '신부'}
              </span>
            </div>
          </BA>
        )}
      </div>
    </div>
  )
}

// -- Book: Quote --
function BookQuote({ data, ed = false }: { data: any; ed?: boolean }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const quote = data.quote
  if (!quote?.text) return null
  const quoteLines = quote.text.split('\n')

  // 테마별 다크 반전 배경
  const darkColorsByTheme: Record<string, { bg: string; text: string; muted: string }> = {
    'essay-ivory':  { bg: '#2C2820', text: '#F5F0E8', muted: '#A09882' },
    'essay-blush':  { bg: '#3A2028', text: '#FBE8ED', muted: '#B08890' },
    'essay-sage':   { bg: '#1E2A1C', text: '#E8F2E0', muted: '#82A078' },
    'essay-mono':   { bg: '#1A1A1A', text: '#F0F0F0', muted: '#888888' },
    'essay-sky':    { bg: '#1C2830', text: '#E0ECF8', muted: '#7A9AB0' },
    'essay-coral':  { bg: '#2E1E18', text: '#FCE8DE', muted: '#B08878' },
  }
  const darkColors = data.colorTheme === 'essay-custom' && data.customThemeColors
    ? generateDarkColors(data.customThemeColors.pageBg || data.customThemeColors.bg, data.customThemeColors.accent, data.customThemeColors.text)
    : (darkColorsByTheme[data.colorTheme || 'essay-ivory'] || darkColorsByTheme['essay-ivory'])

  return (
    <div className="bk-page" style={{
      background: darkColors.bg, display: 'flex', justifyContent: 'center',
      alignItems: 'center', padding: '0 40px', textAlign: 'center' as const,
    }}>
      <div>
        <div style={{ marginBottom: '40px' }}>
          {quoteLines.map((line: string, i: number) => (
            <span key={i} className="es-f18" style={{
              display: 'block',
              fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 200,
              fontStyle: 'italic', lineHeight: 2.6, letterSpacing: '0.3px',
              color: darkColors.text,
              opacity: 0, animation: `bkFadeIn 1.6s ease-out ${500 + i * 800}ms forwards`,
            }}>{line || '\u00A0'}</span>
          ))}
        </div>
        {quote.author && (
          <div style={{
            fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', fontWeight: 400,
            letterSpacing: '4px', color: darkColors.text, textTransform: 'uppercase' as const,
            opacity: 0, animation: `bkFadeIn 1.2s ease-out ${500 + quoteLines.length * 800 + 300}ms forwards`,
          }}>{quote.author}</div>
        )}
      </div>
    </div>
  )
}

// -- Book: Gallery --
function BookGallery({ data }: { data: any }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const images: string[] = data.gallery?.images || []
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (images.length === 0) return null

  return (
    <div className="bk-page" style={{ background: bookColors.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '72px 14px 40px', WebkitOverflowScrolling: 'touch' }}>
        <BA d={200} type="fade">
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: '8px', fontWeight: 400,
            letterSpacing: '4px', color: bookColors.muted, textTransform: 'uppercase' as const,
            textAlign: 'center', marginBottom: '18px',
          }}>Gallery</div>
        </BA>
        <BA d={400} type="fade">
          <EssayGalleryGrid
            images={images}
            onImageClick={(i) => { setViewerIndex(i); setViewerOpen(true) }}
            colors={{ bg: bookColors.bg, muted: bookColors.muted, accent: bookColors.accent }}
          />
        </BA>
      </div>
      {viewerOpen && (
        <EssayGalleryViewer images={images} startIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  )
}

// -- Book: Wedding Date (그 날) --
// -- Book: Date Essay (날짜 에세이 - warm transition page) --
function BookDateEssay({ data }: { data: any }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const weddingDate = data.wedding?.date ? new Date(data.wedding.date) : new Date()
  const dateEssay = data.wedding?.dateEssay || `${weddingDate.getFullYear()}년 ${weddingDate.getMonth()+1}월,\n우리가 처음 만났던 계절이\n다시 돌아오는 날.\n\n가장 따뜻한 햇살 아래에서\n시작되는 이야기를\n함께해 주세요.`
  const lines = dateEssay.split('\n')

  return (
    <div
      className="bk-page bk-card"
      style={{
        background: bookInfoColors.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 48px'
      }}
    >
      <div style={{ opacity: 0, animation: 'bkFadeIn 1s ease-out 300ms forwards' }}>
        <div style={{
          fontFamily: "'BonmyeongjoSourceHanSerif', serif",
          fontSize: '8px',
          fontWeight: 400,
          letterSpacing: '4px',
          color: bookInfoColors.muted,
          textTransform: 'uppercase',
          marginBottom: '20px'
        }}>Date</div>
      </div>
      <div style={{
        width: '20px',
        height: '1px',
        background: `${bookInfoColors.muted}40`,
        margin: '0 auto 28px',
        opacity: 0,
        animation: 'bkFadeIn 0.8s ease-out 600ms forwards'
      }} />
      <div style={{ opacity: 0, animation: 'bkFadeIn 1.8s ease-out 800ms forwards' }}>
        {lines.map((line: string, i: number) => (
          <p key={i} style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '13.5px',
            fontWeight: 200,
            lineHeight: 2.4,
            letterSpacing: '0.2px',
            color: bookInfoColors.text,
            margin: 0
          }}>{line || '\u00A0'}</p>
        ))}
      </div>
    </div>
  )
}

// -- Book: Venue Essay (장소 에세이 - warm transition page) --
function BookVenueEssay({ data }: { data: any }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const venueEssay = data.wedding?.venueEssay || `높은 천장 아래로\n따뜻한 빛이 쏟아지던 곳.\n\n처음 이곳에 왔을 때,\n\"여기서 우리 결혼식을 하자\"\n동시에 같은 말을 했습니다.\n\n그 마음 그대로,\n이곳에서 여러분을 기다리겠습니다.`
  const lines = venueEssay.split('\n')

  return (
    <div
      className="bk-page bk-card"
      style={{
        background: bookInfoColors.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 48px'
      }}
    >
      <div style={{ opacity: 0, animation: 'bkFadeIn 1s ease-out 300ms forwards' }}>
        <div style={{
          fontFamily: "'BonmyeongjoSourceHanSerif', serif",
          fontSize: '8px',
          fontWeight: 400,
          letterSpacing: '4px',
          color: bookInfoColors.muted,
          textTransform: 'uppercase',
          marginBottom: '20px'
        }}>Venue</div>
      </div>
      <div style={{
        width: '20px',
        height: '1px',
        background: `${bookInfoColors.muted}40`,
        margin: '0 auto 28px',
        opacity: 0,
        animation: 'bkFadeIn 0.8s ease-out 600ms forwards'
      }} />
      <div style={{ opacity: 0, animation: 'bkFadeIn 1.8s ease-out 800ms forwards' }}>
        {lines.map((line: string, i: number) => (
          <p key={i} style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '13.5px',
            fontWeight: 200,
            lineHeight: 2.4,
            letterSpacing: '0.2px',
            color: bookInfoColors.text,
            margin: 0
          }}>{line || '\u00A0'}</p>
        ))}
      </div>
    </div>
  )
}

// -- Book: Info Intro (STORY→INFO 전환 페이지) --
function BookInfoIntro({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const weddingDate = data.wedding?.date ? new Date(data.wedding.date) : new Date()
  const dateStr = `${weddingDate.getFullYear()}. ${String(weddingDate.getMonth() + 1).padStart(2, '0')}. ${String(weddingDate.getDate()).padStart(2, '0')}`
  const venueName = data.wedding?.venue?.name || ''
  const coverImage = data.media?.coverImage

  return (
    <div className="bk-page bk-card" style={{ padding: 0, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: bookInfoColors.accent }}>
      {/* Background image (if exists) */}
      {coverImage && (
        <>
          <img
            src={coverImage}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(0.4) contrast(1.1)',
              opacity: 0,
              animation: 'bkFadeIn 1.8s ease-out forwards'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(44,40,32,0.55)',
            zIndex: 1
          }} />
        </>
      )}

      {/* Content */}
      <div className="w-full px-12 py-16 max-w-md mx-auto text-center" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ opacity: 0, animation: 'bkFadeIn 1s ease-out 400ms forwards' }}>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', letterSpacing: '4px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Information</p>
        </div>
        <div style={{ opacity: 0, animation: 'bkFadeIn 1.2s ease-out 600ms forwards' }}>
          <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 300, color: '#fff', lineHeight: 1.8, marginBottom: '16px' }}>예식 안내</p>
        </div>
        <div style={{ opacity: 0, animation: 'bkFadeIn 1.4s ease-out 800ms forwards' }}>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', lineHeight: 2 }}>{dateStr}</p>
          {venueName && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{venueName}</p>}
        </div>
      </div>
    </div>
  )
}

// -- Book: Wedding Date (날짜 - magazine big number style) --
function BookWeddingDate({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const w = data.wedding || {}
  const weddingDate = w.date ? new Date(w.date) : new Date()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = weddingDate.getDay()
  const dateDay = weddingDate.getDate()
  const year = weddingDate.getFullYear()
  const month = weddingDate.getMonth()

  // 시간 표시
  const timeStr = w.timeDisplay || '오후 2시'
  const korDay = `${dayNames[dayOfWeek]}요일`

  // D-day 계산
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(weddingDate)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  let ddayStr = ''
  if (diff > 0) ddayStr = `D-${diff}`
  else if (diff === 0) ddayStr = 'D-DAY'

  // 달력 데이터 생성
  const firstDay = new Date(year, month, 1).getDay() // 0=일 ~ 6=토
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calWeeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { calWeeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    calWeeks.push(week)
  }

  const calHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="bk-page bk-card" style={{
      background: bookInfoColors.pageBg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '52px 32px 36px',
    }}>
      {/* WEDDING DATE 라벨 */}
      <div style={{ opacity: 0, animation: 'bkFadeIn 0.8s ease-out 200ms forwards' }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '10px', fontWeight: 400, letterSpacing: '6px',
          color: bookInfoColors.muted, textTransform: 'uppercase',
          textAlign: 'center', marginBottom: '24px',
        }}>Wedding Date</div>
      </div>

      {/* 날짜 숫자 */}
      <div style={{ opacity: 0, animation: 'bkFadeIn 0.8s ease-out 400ms forwards' }}>
        <div style={{
          fontFamily: "'Pretendard', sans-serif",
          fontSize: '26px', fontWeight: 300, letterSpacing: '2px',
          color: bookInfoColors.heading, textAlign: 'center',
          marginBottom: '12px',
        }}>
          {year}.{String(month + 1).padStart(2, '0')}.{String(dateDay).padStart(2, '0')}
        </div>
      </div>

      {/* 요일 · 시간 */}
      <div style={{ opacity: 0, animation: 'bkFadeIn 0.8s ease-out 600ms forwards' }}>
        <div style={{
          fontFamily: "'Pretendard', sans-serif",
          fontSize: '11.5px', fontWeight: 300, letterSpacing: '0.8px',
          color: bookInfoColors.text, textAlign: 'center',
          marginBottom: '32px',
        }}>
          {korDay} &middot; {timeStr}
        </div>
      </div>

      {/* 달력 */}
      <div style={{
        width: '100%', maxWidth: '280px',
        opacity: 0, animation: 'bkFadeIn 1s ease-out 700ms forwards',
      }}>
        {/* 요일 헤더 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center',
          paddingBottom: '10px', marginBottom: '6px',
          borderBottom: `1px solid ${bookInfoColors.divider}`,
        }}>
          {calHeaders.map((h, i) => (
            <div key={i} style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '11px', fontWeight: 400, letterSpacing: '1px',
              color: i === 0 ? bookInfoColors.accent : i === 6 ? bookInfoColors.accent : bookInfoColors.muted,
              opacity: (i === 0 || i === 6) ? 0.8 : 1,
            }}>{h}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {calWeeks.map((wk, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
            {wk.map((d, di) => {
              const isWeddingDay = d === dateDay
              const isSunday = di === 0
              const isSaturday = di === 6
              return (
                <div key={di} style={{
                  padding: '8px 0',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isWeddingDay && (
                    <svg
                      style={{ position: 'absolute' }}
                      width="30" height="30" viewBox="0 0 24 24"
                      fill={bookInfoColors.accent}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  )}
                  {d && (
                    <span style={{
                      fontFamily: "'Pretendard', sans-serif",
                      fontSize: '12px',
                      fontWeight: isWeddingDay ? 500 : 300,
                      color: isWeddingDay
                        ? bookInfoColors.pageBg
                        : isSunday ? bookInfoColors.accent
                        : isSaturday ? bookInfoColors.accent
                        : bookInfoColors.text,
                      opacity: isWeddingDay ? 1 : (isSunday || isSaturday) ? 0.7 : 1,
                      position: 'relative', zIndex: 1,
                      lineHeight: 1,
                    }}>
                      {d}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* D-day */}
      {ddayStr && (
        <div style={{
          marginTop: '36px',
          opacity: 0, animation: 'bkFadeIn 0.8s ease-out 1200ms forwards',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '10px', fontWeight: 400, letterSpacing: '3px',
            color: bookInfoColors.muted,
          }}>{ddayStr}</div>
        </div>
      )}
    </div>
  )
}

// -- Book: Wedding Venue (장소 - magazine scrollable style) --
function BookWeddingVenue({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const w = data.wedding || {}

  return (
    <div className="bk-page bk-card" style={{ background: bookInfoColors.pageBg, display: 'flex', flexDirection: 'column' }}>
      {/* Scrollable content */}
      <div className="bk-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '72px 48px 62px', WebkitOverflowScrolling: 'touch' }}>
        {/* Venue name */}
        <div style={{ opacity: 0, animation: 'bkFadeIn 0.9s ease-out 400ms forwards' }}>
          <div style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '18px',
            fontWeight: 600,
            color: bookInfoColors.heading,
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>{w.venue?.name || ''}</div>
          {w.venue?.hall && !w.venue?.hideHall && (
            <div style={{
              fontFamily: "'Pretendard', sans-serif",
              fontSize: '13px',
              fontWeight: 300,
              color: bookInfoColors.text,
              marginBottom: '12px'
            }}>{w.venue.hall}</div>
          )}
        </div>

        {/* Address */}
        <div style={{ opacity: 0, animation: 'bkFadeIn 0.9s ease-out 600ms forwards' }}>
          <div style={{
            fontFamily: "'Pretendard', sans-serif",
            fontSize: '12px',
            fontWeight: 300,
            color: bookInfoColors.muted,
            lineHeight: 1.8,
            marginBottom: '20px'
          }}>{w.venue?.address || ''}</div>
        </div>

        {/* Map links */}
        {w.venue?.address && (
          <div style={{ opacity: 0, animation: 'bkFadeIn 0.9s ease-out 800ms forwards', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { href: `https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}`, label: 'NAVER' },
                { href: `https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}`, label: 'KAKAO' },
                { href: `tmap://search?name=${encodeURIComponent(w.venue.name || '')}`, label: 'TMAP' },
              ].map(m => (
                <a key={m.label} href={m.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 0',
                    border: `0.5px solid ${bookInfoColors.divider}`,
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: '10px',
                    letterSpacing: '1.5px',
                    color: bookInfoColors.muted,
                    textDecoration: 'none'
                  }}
                >
                  {m.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Directions */}
        {w.directions && (w.directions.car || w.directions.publicTransport || w.directions.train || w.directions.expressBus) && (
          <div style={{ opacity: 0, animation: 'bkFadeIn 0.9s ease-out 1000ms forwards' }}>
            <div style={{ marginBottom: '16px' }}>
              {[
                { key: 'car', label: '자가용' },
                { key: 'publicTransport', label: '대중교통' },
                { key: 'train', label: '기차 (KTX/SRT)' },
                { key: 'expressBus', label: '고속버스' }
              ].map((d, idx) => w.directions[d.key] && (
                <div key={d.key} style={{
                  marginBottom: idx < 3 ? '20px' : '0',
                  paddingBottom: idx < 3 ? '20px' : '0',
                  borderBottom: idx < 3 ? `1px solid ${bookInfoColors.divider}15` : 'none'
                }}>
                  <div style={{
                    fontFamily: "'Pretendard', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: bookInfoColors.accent,
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}>{d.label}</div>
                  {w.directions[d.key].split('\n').map((line: string, i: number) => (
                    <p key={i} style={{
                      fontFamily: "'Pretendard', sans-serif",
                      fontSize: '12px',
                      fontWeight: 300,
                      lineHeight: 1.8,
                      color: bookInfoColors.text,
                      margin: 0,
                      opacity: 0.85
                    }}>{line}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extra info */}
        {w.directions?.extraInfoEnabled && w.directions.extraInfoText && (
          <div style={{ opacity: 0, animation: 'bkFadeIn 0.9s ease-out 1200ms forwards', marginTop: '12px' }}>
            <div style={{
              padding: '16px 18px',
              background: bookInfoColors.bg,
              borderRadius: '4px'
            }}>
              <div style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: bookInfoColors.accent,
                marginBottom: '8px',
                letterSpacing: '0.3px'
              }}>
                {w.directions.extraInfoTitle || '추가 안내사항'}
              </div>
              {w.directions.extraInfoText.split('\n').map((line: string, i: number) => (
                <p key={i} style={{
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '12px',
                  fontWeight: 300,
                  lineHeight: 1.8,
                  color: bookInfoColors.text,
                  margin: 0,
                  opacity: 0.85
                }}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// -- Book: Guidance (행복한 시간을 위한 안내) --
function BookGuidance({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const info = data.info || {}
  const defaultItemOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
  const itemOrder = info.itemOrder || defaultItemOrder
  const enabledItems = [
    ...itemOrder.filter((key: string) => info[key]?.enabled && info[key]?.content),
    ...(info.customItems || []).filter((item: any) => item.enabled && item.content).map((_: any, i: number) => `custom-${i}`),
  ]
  if (enabledItems.length === 0) return null

  return (
    <div className="bk-page bk-card" style={{ background: bookInfoColors.pageBg, display: 'flex', flexDirection: 'column' }}>
      <div className="bk-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '72px 48px 62px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ paddingTop: '12px' }}>
          <div style={{ fontSize: '20px', fontWeight: 200, letterSpacing: '0.3px', color: bookInfoColors.heading, marginBottom: '8px', opacity: 0, animation: 'bkFadeIn 1.4s ease-out 200ms forwards' }}>안내</div>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '8px', fontWeight: 400, letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1s ease-out 500ms forwards' }}>Information</div>
          {enabledItems.map((key: string, i: number) => {
            const isCustom = key.startsWith('custom-')
            const item = isCustom ? info.customItems[parseInt(key.split('-')[1])] : info[key]
            if (!item?.enabled || !item?.content) return null
            return (
              <div key={i} style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: `1px solid ${bookInfoColors.divider}40`, opacity: 0, animation: `bkFadeIn 1.2s ease-out ${600 + i * 300}ms forwards` }}>
                <div style={{ fontSize: '13px', fontWeight: 400, color: bookInfoColors.heading, marginBottom: '8px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: bookInfoColors.muted, lineHeight: 2 }}>
                  {item.content.split('\n').map((line: string, j: number) => (
                    <span key={j}>{line}{j < item.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// -- Book: Contacts (Magazine accordion style) --
function BookContacts({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const groom = data.groom || {}; const bride = data.bride || {}
  const contactsEssay = data.content?.contactsEssay || `축하의 마음을 전하고 싶으시다면,\n편하게 연락해 주세요.\n\n한 통의 전화, 짧은 문자 하나에도\n저희는 크게 웃을 수 있답니다.`
  const [openSide, setOpenSide] = useState<Record<string, boolean>>({})

  const groomContacts = [
    groom.phoneEnabled !== false && groom.phone && { name: groom.name || '신랑', role: '', phone: groom.phone },
    groom.father?.phoneEnabled && groom.father?.phone && { name: groom.father.name || '', role: '아버지', phone: groom.father.phone },
    groom.mother?.phoneEnabled && groom.mother?.phone && { name: groom.mother.name || '', role: '어머니', phone: groom.mother.phone },
  ].filter(Boolean) as { name: string; role: string; phone: string }[]

  const brideContacts = [
    bride.phoneEnabled !== false && bride.phone && { name: bride.name || '신부', role: '', phone: bride.phone },
    bride.father?.phoneEnabled && bride.father?.phone && { name: bride.father.name || '', role: '아버지', phone: bride.father.phone },
    bride.mother?.phoneEnabled && bride.mother?.phone && { name: bride.mother.name || '', role: '어머니', phone: bride.mother.phone },
  ].filter(Boolean) as { name: string; role: string; phone: string }[]

  const toggleSide = (key: string) => setOpenSide(prev => ({ ...prev, [key]: !prev[key] }))

  const renderAccordion = (label: string, contacts: { name: string; role: string; phone: string }[], key: string, delay: number) => (
    <div style={{ marginBottom: '20px', opacity: 0, animation: `bkFadeIn 1.2s ease-out ${delay}ms forwards` }}>
      <div role="button" onClick={(e) => { e.stopPropagation(); toggleSide(key) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 0', borderBottom: `1px solid ${bookInfoColors.divider}40` }}>
        <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', fontWeight: 400, letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const }}>{label}</span>
        <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '16px', fontWeight: 300, color: bookInfoColors.muted, lineHeight: 1, transition: 'transform 0.35s ease', transform: openSide[key] ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      <div style={{ maxHeight: openSide[key] ? '300px' : '0', overflow: 'hidden', transition: 'max-height 0.45s cubic-bezier(.33,1,.68,1)' }}>
        {contacts.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < contacts.length - 1 ? `1px solid ${bookInfoColors.divider}20` : 'none' }}>
            <div><span style={{ fontSize: '13.5px', fontWeight: 300, color: bookInfoColors.text }}>{c.name}</span>{c.role && <span style={{ fontSize: '11px', color: bookInfoColors.muted, marginLeft: '5px', fontWeight: 300 }}>{c.role}</span>}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', letterSpacing: '1.5px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, textDecoration: 'none', padding: '5px 11px', border: `1px solid ${bookInfoColors.divider}40` }}>Tel</a>
              <a href={`sms:${c.phone}`} onClick={e => e.stopPropagation()} style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', letterSpacing: '1.5px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, textDecoration: 'none', padding: '5px 11px', border: `1px solid ${bookInfoColors.divider}40` }}>Sms</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bk-page bk-card" style={{ background: bookInfoColors.pageBg, display: 'flex', flexDirection: 'column' }}>
      <div className="bk-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '72px 48px 62px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ paddingTop: '12px' }}>
          <div style={{ fontSize: '20px', fontWeight: 200, letterSpacing: '0.3px', color: bookInfoColors.heading, marginBottom: '8px', opacity: 0, animation: 'bkFadeIn 1.4s ease-out 200ms forwards' }}>연락처</div>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '8px', fontWeight: 400, letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1s ease-out 500ms forwards' }}>Contact</div>
          <div style={{ fontSize: '12.5px', fontWeight: 300, lineHeight: 2.3, letterSpacing: '0.2px', color: bookInfoColors.text, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1.8s ease-out 700ms forwards' }}>
            {contactsEssay.split('\n').map((line: string, i: number) => <p key={i} style={{ margin: 0 }}>{line || '\u00A0'}</p>)}
          </div>
          <div style={{ width: '28px', height: '1px', background: `${bookInfoColors.muted}40`, marginBottom: '28px', opacity: 0, animation: 'bkFadeIn 1s ease-out 1000ms forwards' }} />
          {groomContacts.length > 0 && renderAccordion('Groom', groomContacts, 'groom', 500)}
          {brideContacts.length > 0 && renderAccordion('Bride', brideContacts, 'bride', 900)}
        </div>
      </div>
    </div>
  )
}

// -- Book: Bank (Magazine accordion style) --
function BookBank({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const groom = data.groom || {}; const bride = data.bride || {}
  const bankEssay = data.content?.bankEssay || `직접 오시지 못하더라도\n마음만으로 충분히 감사합니다.\n\n혹 축하의 마음을 전하고 싶으시다면,\n아래를 통해 보내주실 수 있습니다.`
  const [openSide, setOpenSide] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState('')

  const getAccounts = (side: 'groom' | 'bride') => {
    const person = side === 'groom' ? groom : bride
    return [
      person.bank?.enabled && { name: person.name, bank: person.bank.bank, account: person.bank.account, holder: person.bank.holder || person.name, role: side === 'groom' ? '신랑' : '신부' },
      person.father?.bank?.enabled && { name: person.father.name, bank: person.father.bank.bank, account: person.father.bank.account, holder: person.father.bank.holder || person.father.name, role: '아버지' },
      person.mother?.bank?.enabled && { name: person.mother.name, bank: person.mother.bank.bank, account: person.mother.bank.account, holder: person.mother.bank.holder || person.mother.name, role: '어머니' },
    ].filter(Boolean) as { name: string; bank: string; account: string; holder: string; role: string }[]
  }

  const groomAccounts = getAccounts('groom')
  const brideAccounts = getAccounts('bride')
  const toggleSide = (key: string) => setOpenSide(prev => ({ ...prev, [key]: !prev[key] }))
  const copyAccount = (id: string, account: string) => { navigator.clipboard.writeText(account); setCopiedId(id); setTimeout(() => setCopiedId(''), 2000) }

  const renderAccordion = (label: string, accounts: { name: string; bank: string; account: string; holder: string; role: string }[], key: string, delay: number) => (
    <div style={{ marginBottom: '20px', opacity: 0, animation: `bkFadeIn 1.2s ease-out ${delay}ms forwards` }}>
      <div role="button" onClick={(e) => { e.stopPropagation(); toggleSide(key) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 0', borderBottom: `1px solid ${bookInfoColors.divider}40` }}>
        <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', fontWeight: 400, letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const }}>{label}</span>
        <span style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '16px', fontWeight: 300, color: bookInfoColors.muted, lineHeight: 1, transition: 'transform 0.35s ease', transform: openSide[key] ? 'rotate(45deg)' : 'none' }}>+</span>
      </div>
      <div style={{ maxHeight: openSide[key] ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.45s cubic-bezier(.33,1,.68,1)' }}>
        {accounts.map((acc, i) => {
          const accId = `${key}-${i}`
          return (
            <div key={i} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: i < accounts.length - 1 ? `1px solid ${bookInfoColors.divider}20` : 'none' }}>
              <div style={{ fontSize: '11px', fontWeight: 300, color: bookInfoColors.muted, marginBottom: '4px' }}>{acc.role}</div>
              <div style={{ fontSize: '13.5px', fontWeight: 300, color: bookInfoColors.text, marginBottom: '9px' }}>{acc.holder}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 300, color: bookInfoColors.muted, letterSpacing: '0.3px' }}>{acc.bank} {acc.account}</span>
                <button onClick={(e) => { e.stopPropagation(); copyAccount(accId, acc.account) }} style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', letterSpacing: '2px', color: copiedId === accId ? bookInfoColors.pageBg : bookInfoColors.muted, textTransform: 'uppercase' as const, padding: '5px 12px', border: `1px solid ${bookInfoColors.divider}40`, background: copiedId === accId ? bookInfoColors.text : 'none', cursor: 'pointer', transition: 'all 0.3s' }}>{copiedId === accId ? 'Done' : 'Copy'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="bk-page bk-card" style={{ background: bookInfoColors.pageBg, display: 'flex', flexDirection: 'column' }}>
      <div className="bk-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '72px 48px 62px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ paddingTop: '12px' }}>
          <div style={{ fontSize: '20px', fontWeight: 200, letterSpacing: '0.3px', color: bookInfoColors.heading, marginBottom: '8px', opacity: 0, animation: 'bkFadeIn 1.4s ease-out 200ms forwards' }}>축의금</div>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '8px', fontWeight: 400, letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1s ease-out 500ms forwards' }}>Gift</div>
          <div style={{ fontSize: '12.5px', fontWeight: 300, lineHeight: 2.3, letterSpacing: '0.2px', color: bookInfoColors.text, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1.8s ease-out 700ms forwards' }}>
            {bankEssay.split('\n').map((line: string, i: number) => <p key={i} style={{ margin: 0 }}>{line || '\u00A0'}</p>)}
          </div>
          <div style={{ width: '28px', height: '1px', background: `${bookInfoColors.muted}40`, marginBottom: '28px', opacity: 0, animation: 'bkFadeIn 1s ease-out 1000ms forwards' }} />
          {groomAccounts.length > 0 && renderAccordion('Groom', groomAccounts, 'groom', 500)}
          {brideAccounts.length > 0 && renderAccordion('Bride', brideAccounts, 'bride', 900)}
        </div>
      </div>
    </div>
  )
}

// -- Book: Thank You (Magazine epilogue style - left-aligned, bottom) --
function BookThankYou({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const groomName = data.groom?.name || '신랑'; const brideName = data.bride?.name || '신부'
  const thankYouEssay = data.content?.thankYouEssay || `바쁘신 와중에도\n저희의 결혼을 축하해 주셔서\n진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며\n살겠습니다.`
  const lines = thankYouEssay.split('\n')
  return (
    <div className="bk-page bk-card" style={{ background: bookInfoColors.pageBg, display: 'flex', flexDirection: 'column', padding: '0 48px', position: 'relative' }}>
      <span style={{ position: 'absolute', top: '58px', right: '48px', fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', fontWeight: 400, letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, opacity: 0, animation: 'bkFadeIn 0.8s ease-out 150ms forwards' }}>Epilogue</span>
      <div style={{ marginTop: 'auto', marginBottom: '80px', maxWidth: '260px' }}>
        {lines.map((line: string, i: number) => (
          <span key={i} style={{ display: 'block', fontSize: '14px', fontWeight: 200, lineHeight: 2.4, letterSpacing: '0.2px', color: bookInfoColors.text, opacity: 0, animation: `bkFadeIn 1.4s ease-out ${500 + i * 300}ms forwards` }}>{line || '\u00A0'}</span>
        ))}
        <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', fontWeight: 400, letterSpacing: '2px', color: bookInfoColors.muted, marginTop: '28px', opacity: 0, animation: `bkFadeIn 1s ease-out ${500 + lines.length * 300 + 500}ms forwards` }}>
          {groomName} & {brideName} 올림
        </div>
      </div>
    </div>
  )
}

// -- Book: Guestbook --
function BookGuestbook({ data, invitationId, isSample }: { data: any; invitationId: string; isSample?: boolean }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  const guestbookEssay = data.content?.guestbookEssay || `이야기의 마지막 페이지는\n여러분의 따뜻한 한 마디로 채워집니다.\n\n축하, 응원, 혹은 그냥 안부 한 줄도\n저희에게는 소중한 선물이에요.`
  const sampleMessages = data.content?.sampleGuestbook || []
  const [messages, setMessages] = useState<any[]>(isSample ? sampleMessages : [])
  const [name, setName] = useState(''); const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => { if (isSample) return; fetch(`/api/guestbook?invitationId=${invitationId}`).then(r => r.json()).then((d: any) => setMessages(d.messages || d.data || [])).catch(() => {}) }, [invitationId, isSample])
  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return
    if (isSample) { setMessages(prev => [{ id: `s-${Date.now()}`, guest_name: name.trim(), message: message.trim(), created_at: new Date().toISOString() }, ...prev]); setName(''); setMessage(''); return }
    setSubmitting(true)
    try { const res = await fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId, guestName: name.trim(), message: message.trim() }) }); if (res.ok) { const d = await res.json() as any; setMessages(prev => [d.data || d, ...prev]); setName(''); setMessage('') } } catch {}
    setSubmitting(false)
  }

  return (
    <div className="bk-page bk-card" style={{ background: bookInfoColors.bg, display: 'flex', flexDirection: 'column' }}>
      <div className="bk-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '72px 48px 62px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ paddingTop: '12px' }}>
          <div style={{ fontSize: '20px', fontWeight: 200, letterSpacing: '0.3px', color: bookInfoColors.heading, marginBottom: '8px', opacity: 0, animation: 'bkFadeIn 1.4s ease-out 200ms forwards' }}>방명록</div>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '8px', fontWeight: 400, letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1s ease-out 500ms forwards' }}>Guestbook</div>
          <div style={{ fontSize: '12.5px', fontWeight: 300, lineHeight: 2.3, letterSpacing: '0.2px', color: bookInfoColors.text, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1.8s ease-out 700ms forwards' }}>
            {guestbookEssay.split('\n').map((line: string, i: number) => <p key={i} style={{ margin: 0 }}>{line || '\u00A0'}</p>)}
          </div>
          <div style={{ width: '28px', height: '1px', background: `${bookInfoColors.muted}40`, marginBottom: '28px', opacity: 0, animation: 'bkFadeIn 1s ease-out 1000ms forwards' }} />
          {/* Form */}
          <div style={{ background: bookInfoColors.pageBg, padding: '20px 22px', marginBottom: '20px', opacity: 0, animation: 'bkFadeIn 1.2s ease-out 400ms forwards' }}>
            <input value={name} onChange={e => setName(e.target.value)} onClick={e => e.stopPropagation()} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} placeholder="이름" maxLength={20} style={{ width: '100%', border: 'none', borderBottom: `1px solid ${bookInfoColors.divider}40`, background: 'none', padding: '9px 0', fontFamily: "'Pretendard', sans-serif", fontSize: '12.5px', fontWeight: 300, color: bookInfoColors.text, outline: 'none' }} />
            <textarea value={message} onChange={e => setMessage(e.target.value)} onClick={e => e.stopPropagation()} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} placeholder="축하 메시지를 남겨주세요" maxLength={500} style={{ width: '100%', border: 'none', borderBottom: `1px solid ${bookInfoColors.divider}40`, background: 'none', padding: '9px 0', fontFamily: "'Pretendard', sans-serif", fontSize: '12.5px', fontWeight: 300, color: bookInfoColors.text, outline: 'none', resize: 'none', lineHeight: 1.8, marginTop: '10px', height: '68px' }} />
            <button onClick={(e) => { e.stopPropagation(); handleSubmit() }} disabled={submitting || !name.trim() || !message.trim()} style={{ display: 'block', marginTop: '14px', marginLeft: 'auto', fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, padding: '7px 18px', border: `1px solid ${bookInfoColors.divider}40`, background: 'none', cursor: 'pointer', opacity: (submitting || !name.trim() || !message.trim()) ? 0.5 : 1 }}>{submitting ? '...' : 'Submit'}</button>
          </div>
          {/* Messages */}
          {messages.length > 0 && (
            <div style={{ opacity: 0, animation: 'bkFadeIn 1.2s ease-out 800ms forwards' }}>
              {messages.slice(0, 5).map((m: any, i: number) => (
                <div key={m.id} style={{ background: bookInfoColors.pageBg, padding: '16px 20px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 400, color: bookInfoColors.heading, marginBottom: '4px' }}>{m.guest_name}</div>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: bookInfoColors.muted, lineHeight: 1.8 }}>{m.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// -- Book: RSVP (Magazine warm style) --
function BookRsvp({ data, invitationId }: { data: any; invitationId: string }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme, data.customThemeColors)
  return (
    <div className="bk-page bk-card" style={{ background: bookInfoColors.bg, display: 'flex', flexDirection: 'column' }}>
      <div className="bk-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '72px 48px 62px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ paddingTop: '12px' }}>
          <div style={{ fontSize: '20px', fontWeight: 200, letterSpacing: '0.3px', color: bookInfoColors.heading, marginBottom: '8px', opacity: 0, animation: 'bkFadeIn 1.4s ease-out 200ms forwards' }}>참석 여부</div>
          <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '8px', fontWeight: 400, letterSpacing: '3px', color: bookInfoColors.muted, textTransform: 'uppercase' as const, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1s ease-out 500ms forwards' }}>RSVP</div>
          {data.rsvpDeadline && <div style={{ fontSize: '11.5px', fontWeight: 300, color: bookInfoColors.muted, marginBottom: '24px', opacity: 0, animation: 'bkFadeIn 1s ease-out 300ms forwards' }}>{new Date(data.rsvpDeadline).toLocaleDateString('ko-KR')}까지 회신 부탁드립니다</div>}
          <div style={{ background: bookInfoColors.pageBg, padding: '24px 22px', opacity: 0, animation: 'bkFadeIn 1.2s ease-out 500ms forwards' }} onClick={e => e.stopPropagation()}>
            <RsvpForm invitationId={invitationId} primaryColor={bookInfoColors.accent} showMealOption={data.rsvpMealOption} showShuttleOption={data.rsvpShuttleOption} notice={data.rsvpNotice} />
          </div>
        </div>
      </div>
    </div>
  )
}

// -- Book: Floating Actions (+ 버튼 → 축의금/연락처) --
function BookFloatingActions({ onOpenModal, bookColors, sectionVisibility }: {
  onOpenModal: (modal: 'contact' | 'rsvp' | 'location' | 'account') => void
  bookColors: ReturnType<typeof getBookColors>
  sectionVisibility?: any
}) {
  const [expanded, setExpanded] = useState(false)
  const sv = sectionVisibility
  const hasContact = sv?.contacts !== false
  const hasAccount = sv?.bankAccounts !== false

  const items = [
    hasAccount ? { modal: 'account' as const, label: '축의금',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
    } : null,
    hasContact ? { modal: 'contact' as const, label: '연락처',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
    } : null,
    { modal: 'location' as const, label: '오시는길',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
    },
    sv?.rsvp !== false ? { modal: 'rsvp' as const, label: '참석여부',
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    } : null,
  ].filter(Boolean) as { modal: 'contact' | 'account' | 'location' | 'rsvp'; label: string; icon: React.ReactNode }[]

  if (items.length === 0) return null

  return (
    <div className="fixed z-30" style={{ bottom: '24px', right: '24px' }}>
      {/* 펼쳐진 메뉴 아이템 */}
      {items.map((item, i) => (
        <div key={item.modal} style={{
          position: 'absolute',
          bottom: expanded ? `${(items.length - i) * 52 + 4}px` : '0',
          right: '0',
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'scale(1)' : 'scale(0.5)',
          transition: `all 0.25s cubic-bezier(.33,1,.68,1) ${expanded ? i * 60 : 0}ms`,
          pointerEvents: expanded ? 'auto' : 'none',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false); onOpenModal(item.modal) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: bookColors.pageBg, border: `1px solid ${bookColors.divider}`,
              borderRadius: '24px', padding: '8px 16px 8px 12px',
              cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              whiteSpace: 'nowrap', minWidth: '110px',
            }}
          >
            <span style={{ color: bookColors.muted }}>{item.icon}</span>
            <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', fontWeight: 400, color: bookColors.text, letterSpacing: '0.3px' }}>{item.label}</span>
          </button>
        </div>
      ))}

      {/* ♥ 버튼 */}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev) }}
        style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: bookColors.pageBg, border: `1px solid ${bookColors.divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
          transition: 'all 0.3s cubic-bezier(.33,1,.68,1)',
        }}
      >
        {expanded ? (
          <svg width="18" height="18" fill="none" stroke={bookColors.text} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill={bookColors.muted} stroke="none"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
        )}
      </button>
    </div>
  )
}

// -- Book: End --
function BookEnd({ data, onRestart, onShowBonus, showBonus }: { data: any; onRestart: () => void; onShowBonus?: () => void; showBonus?: boolean }) {
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const endingPhoto = data.media?.endingPhoto || data.media?.coverImage
  const endingMessage = data.endingMessage || '이 이야기를\n함께 읽어주셔서\n감사합니다.'
  const endDarkByTheme: Record<string, { bg: string; text: string; muted: string }> = {
    'essay-ivory':  { bg: '#2C2820', text: 'rgba(244,241,235,0.65)', muted: '#9B9088' },
    'essay-blush':  { bg: '#3A2028', text: 'rgba(253,246,244,0.65)', muted: '#B08890' },
    'essay-sage':   { bg: '#1E2A1C', text: 'rgba(245,247,243,0.65)', muted: '#82A078' },
    'essay-mono':   { bg: '#1A1A1A', text: 'rgba(245,245,245,0.65)', muted: '#888888' },
    'essay-sky':    { bg: '#1C2830', text: 'rgba(244,248,252,0.65)', muted: '#7A9AB0' },
    'essay-coral':  { bg: '#2E1E18', text: 'rgba(254,246,242,0.65)', muted: '#B08878' },
  }
  const dk = data.colorTheme === 'essay-custom' && data.customThemeColors
    ? generateDarkColors(data.customThemeColors.pageBg || data.customThemeColors.bg, data.customThemeColors.accent, data.customThemeColors.text)
    : (endDarkByTheme[data.colorTheme || 'essay-ivory'] || endDarkByTheme['essay-ivory'])

  return (
    <div className="bk-page flex flex-col items-center justify-center" style={{ background: dk.bg, padding: '0 48px', position: 'relative' }}>
      {endingPhoto && (
        <div style={{
          width: '80px', height: '80px', overflow: 'hidden', marginBottom: '32px',
          clipPath: 'inset(0 50%)',
          animation: 'bkClipCx 1.6s cubic-bezier(.16,1,.3,1) 300ms forwards'
        }}>
          <img src={endingPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.4) brightness(0.85)' }} />
        </div>
      )}
      <div style={{ opacity: 0, animation: 'bkFadeIn 1s ease-out 800ms forwards' }}>
        <div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '8px', fontWeight: 400, letterSpacing: '6px', color: dk.muted, textTransform: 'uppercase' as const, marginBottom: '28px' }}>The End</div>
      </div>
      <div style={{ opacity: 0, animation: 'bkFadeIn 1.6s ease-out 1100ms forwards' }}>
        <p style={{ fontSize: '14px', fontWeight: 200, lineHeight: 2.3, textAlign: 'center', color: dk.text }}>{endingMessage.split('\n').map((line: string, i: number, arr: string[]) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}</p>
      </div>
      <div style={{ opacity: 0, animation: 'bkFadeIn 1s ease-out 1500ms forwards' }}>
        <p style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', fontWeight: 400, letterSpacing: '2px', color: dk.muted, fontStyle: 'italic', marginTop: '24px' }}>
          {groomName} & {brideName}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
        <div style={{ opacity: 0, animation: 'bkFadeIn 1s ease-out 1800ms forwards' }}>
          <button onClick={(e) => { e.stopPropagation(); onRestart() }} style={{
            fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '7.5px', fontWeight: 400,
            letterSpacing: '3px', color: `${dk.muted}90`, textTransform: 'uppercase' as const,
            background: 'none', border: `1px solid ${dk.muted}25`, padding: '10px 28px', cursor: 'pointer', width: '200px',
          }}>Read Again</button>
        </div>
        {!showBonus && onShowBonus && (
          <div style={{ opacity: 0, animation: 'bkFadeIn 1s ease-out 2000ms forwards' }}>
            <button onClick={(e) => { e.stopPropagation(); onShowBonus() }} style={{
              background: dk.muted, border: 'none', padding: '12px 24px', cursor: 'pointer',
              fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: dk.bg, width: '200px', letterSpacing: '0.5px',
            }}>더 많은 이야기 보러가기 →</button>
          </div>
        )}
      </div>
      <span style={{ position: 'absolute', bottom: '28px', fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '8px', letterSpacing: '1px', color: dk.muted, opacity: 0.35 }}>Dear Drawer</span>
    </div>
  )
}

// -- Book: Bonus Intro --
function BookBonusIntro({ data }: { data: any }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  return (
    <div className="bk-page flex items-center justify-center" style={{ background: bookColors.pageBg }}>
      <div className="w-full px-12 py-16 max-w-md mx-auto text-center">
        <div className="mb-12">
          <BA d={0} type="fade"><div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '4px', color: bookColors.muted, marginBottom: '16px' }}>BONUS CHAPTER</div></BA>
          <BA d={200}><BLine width="20px" color={bookColors.accent} d={0} center /></BA>
        </div>
        <div className="mb-10">
          <BA d={400}><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '20px', fontWeight: 600, color: bookColors.heading, lineHeight: 1.6 }}>웨딩 인터뷰</p></BA>
          <BA d={550} type="fade"><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: bookColors.muted, marginTop: '8px', letterSpacing: '1px' }}>— {groomName} & {brideName} —</p></BA>
        </div>
        <div>
          <BA d={700}><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 2.2, color: bookColors.text, opacity: 0.85 }}>청첩장에 다 담지 못한</p></BA>
          <BA d={760}><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 2.2, color: bookColors.text, opacity: 0.85 }}>솔직한 이야기들을 모았습니다.</p></BA>
          <BA d={820}><p style={{ height: '16px' }}>{'\u00A0'}</p></BA>
          <BA d={880}><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 2.2, color: bookColors.text, opacity: 0.85 }}>결혼을 앞둔 두 사람의</p></BA>
          <BA d={940}><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 2.2, color: bookColors.text, opacity: 0.85 }}>작은 인터뷰를 공유합니다.</p></BA>
        </div>
      </div>
    </div>
  )
}

// -- Book: Bonus Interview --
function BookBonusInterview({ interview, index, total, colorTheme, customThemeColors }: { interview: any; index: number; total: number; colorTheme?: string; customThemeColors?: { bg: string; pageBg: string; accent: string; text: string } }) {
  const bookColors = getBookColors(colorTheme, customThemeColors)
  const answer = interview.answer || ''
  return (
    <div className="bk-page flex items-center" style={{ background: bookColors.pageBg }}>
      <div className="w-full px-10 py-16 max-w-md mx-auto">
        <div className="text-center mb-8">
          <BA d={0} type="fade"><div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', letterSpacing: '3px', color: bookColors.muted, marginBottom: '16px' }}>Q{index + 1} OF {total}</div></BA>
          <BA d={150}><BLine width="20px" color={bookColors.accent} d={0} center /></BA>
        </div>
        {/* Question */}
        <div className="text-center mb-10">
          <BA d={300} type="right"><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '17px', fontWeight: 600, color: bookColors.heading, lineHeight: 1.8 }}>
            {interview.question}
          </p></BA>
        </div>
        {/* Answer */}
        <div className="text-center">
          {answer.split('\n').map((line: string, i: number) => (
            <BA key={i} d={500 + i * 60}><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 2.2, color: bookColors.text }}>{line || '\u00A0'}</p></BA>
          ))}
        </div>
      </div>
    </div>
  )
}

// -- Book: Bonus End --
function BookBonusEnd({ data, onRestart }: { data: any; onRestart: () => void }) {
  const bookColors = getBookColors(data.colorTheme, data.customThemeColors)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  return (
    <div className="bk-page flex flex-col items-center justify-center" style={{ background: bookColors.bg }}>
      <div className="text-center">
        <BA d={0} type="fade"><div style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '10px', letterSpacing: '6px', color: bookColors.muted, marginBottom: '24px' }}>FIN</div></BA>
        <BA d={200}><div style={{ marginBottom: '24px' }}><BLine width="20px" color={bookColors.accent} d={0} center /></div></BA>
        <BA d={400}><p style={{ fontSize: '14px', color: bookColors.text, lineHeight: 2 }}>저희의 이야기에<br />귀 기울여 주셔서 감사합니다.</p></BA>
        <BA d={550}><p className="mt-2" style={{ fontSize: '13px', color: bookColors.text, lineHeight: 2, opacity: 0.7 }}>여러분의 축복이 가장 큰 선물입니다.</p></BA>
        <BA d={700} type="fade"><p className="mt-4" style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '13px', fontStyle: 'italic', color: bookColors.muted }}>
          {groomName} & {brideName}
        </p></BA>
        <BA d={900} type="scale"><button onClick={(e) => { e.stopPropagation(); onRestart() }} className="mt-8" style={{
          background: 'none', border: `1px solid ${bookColors.divider}`, padding: '10px 24px',
          cursor: 'pointer', fontFamily: "'Pretendard', sans-serif", fontSize: '10px',
          letterSpacing: '3px', color: bookColors.muted, width: '200px',
        }}>
          READ AGAIN
        </button></BA>
      </div>
      <BA d={1100} type="fade"><div className="mt-16">
        <p style={{ fontFamily: "'BonmyeongjoSourceHanSerif', serif", fontSize: '9px', letterSpacing: '3px', color: bookColors.muted }}>DEAR DRAWER</p>
      </div></BA>
    </div>
  )
}

// ====================================================================
// MAIN COMPONENT
// ====================================================================
export default function InvitationClientEssay({ invitation, content, isPaid, isPreview, overrideColorTheme, guestInfo, isSample }: InvitationClientProps) {
  const data = content || {}
  const themeKey = (overrideColorTheme || data.colorTheme || 'essay-ivory') as EssayColorTheme
  const theme = essayThemes[themeKey] || essayThemes['essay-ivory']
  const invitationId = invitation.id || ''
  const contentMode = data.contentMode || 'story'
  const concept = (data.designConcept || 'default') as DesignConcept

  // Font style
  const fontStyleKey = (data.fontStyle && data.fontStyle in essayFontStyles) ? data.fontStyle as EssayFontStyle : 'modern'
  const fonts = essayFontStyles[fontStyleKey]

  // D-Day popup
  const ddayPopup = normalizeDdayPopup(data.ddayPopup)
  const [showDdayPopup, setShowDdayPopup] = useState(false)
  useEffect(() => {
    if (isPreview) return
    if (ddayPopup?.enabled) {
      const t = setTimeout(() => setShowDdayPopup(true), 800)
      return () => clearTimeout(t)
    }
  }, [ddayPopup?.enabled, isPreview])

  // BGM
  const audioRef = useRef<HTMLAudioElement>(null)
  const bgm = data.bgm || {}
  const hasBgm = bgm.enabled && bgm.url

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Montserrat:wght@300;400;600&family=Lora:ital,wght@0,400;0,600;1,400&family=Cinzel:wght@400;600&family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
  }, [])

  // Generate font override CSS for non-default font styles
  const fontOverrideCSS = fontStyleKey !== 'modern' ? `
    .essay-font-container [style*="Pretendard"] { font-family: ${fonts.body} !important; }
    .essay-font-container [style*="BonmyeongjoSourceHanSerif"]:not(.essay-ampersand) { font-family: ${fonts.display} !important; }
  ` : ''

  // Font size level CSS (body text scaling)
  const fsl = data.fontSizeLevel || 0
  const fontSizeCSS = fsl !== 0 ? `
    .essay-font-container .es-f11 { font-size: ${11 + fsl}px !important; }
    .essay-font-container .es-f12 { font-size: ${12 + fsl}px !important; }
    .essay-font-container .es-f13 { font-size: ${13 + fsl}px !important; }
    .essay-font-container .es-f14 { font-size: ${14 + fsl}px !important; }
    .essay-font-container .es-f15 { font-size: ${15 + fsl}px !important; }
    .essay-font-container .es-f16 { font-size: ${16 + fsl}px !important; }
    .essay-font-container .es-f17 { font-size: ${17 + fsl}px !important; }
    .essay-font-container .es-f18 { font-size: ${18 + fsl}px !important; }
    .essay-font-container .es-f20 { font-size: ${20 + fsl}px !important; }
  ` : ''

  // Line height level CSS (행 간격 조절, 각 레벨당 ±0.15)
  const lhl = data.lineHeightLevel || 0
  const lineHeightCSS = lhl !== 0 ? `
    .essay-font-container .es-f11,
    .essay-font-container .es-f12,
    .essay-font-container .es-f13,
    .essay-font-container .es-f14,
    .essay-font-container .es-f15,
    .essay-font-container .es-f16,
    .essay-font-container .es-f17,
    .essay-font-container .es-f18,
    .essay-font-container .es-f20 { line-height: ${2.2 + lhl * 0.15} !important; }
  ` : ''

  // 커스텀 하이라이트 색상 (CSS 변수로 컨테이너에 직접 설정)
  const customHighlightStyle = data.highlightColor ? { '--custom-highlight-color': data.highlightColor } as React.CSSProperties : {}

  const allCSS = [fontOverrideCSS, fontSizeCSS, lineHeightCSS].filter(Boolean).join('\n')

  // Book concept - e-book reader style
  if (concept === 'book') {
    return (
      <>
        {allCSS && <style>{allCSS}</style>}
        <style>{`
          @media (min-width: 640px) {
            .essay-book-desktop-wrapper {
              display: flex; justify-content: center; min-height: 100vh; background: #E8E4DF;
            }
            .essay-book-desktop-wrapper > .essay-font-container {
              width: 100%; max-width: 430px; position: relative; box-shadow: 0 0 40px rgba(0,0,0,0.15);
            }
            .essay-book-desktop-wrapper .fixed.inset-0 {
              left: calc(50% - 215px) !important; right: calc(50% - 215px) !important;
              width: 430px !important;
            }
            .essay-book-desktop-wrapper .fixed.left-0:not(.inset-0):not(.bottom-0) {
              left: calc(50% - 215px) !important;
            }
            .essay-book-desktop-wrapper .fixed.right-0:not(.inset-0):not(.bottom-0) {
              right: calc(50% - 215px) !important; left: auto !important;
            }
            .essay-book-desktop-wrapper .fixed.bottom-0.left-0.right-0 {
              left: calc(50% - 215px) !important;
              right: calc(50% - 215px) !important;
            }
            .essay-book-desktop-wrapper .fixed.top-0.left-0.right-0 {
              left: calc(50% - 215px) !important;
              right: calc(50% - 215px) !important;
            }
            .essay-book-desktop-wrapper > button.fixed {
              right: calc(50% - 215px + 16px) !important; left: auto !important;
            }
            .essay-book-desktop-wrapper .bk-tap-left {
              left: calc(50% - 215px) !important;
              width: 215px !important;
            }
            .essay-book-desktop-wrapper .bk-tap-right {
              right: calc(50% - 215px) !important;
              left: auto !important;
              width: 215px !important;
            }
            .essay-book-desktop-wrapper .bk-arrow-left {
              left: calc(50% - 215px + 6px) !important;
            }
            .essay-book-desktop-wrapper .bk-arrow-right {
              right: calc(50% - 215px + 6px) !important;
            }
          }
        `}</style>
        <div className="essay-book-desktop-wrapper">
        {!isPaid && !isPreview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
          </div>
        )}
        <div className={`essay-font-container theme-${themeKey}`} style={{ wordBreak: 'keep-all', overflowWrap: 'anywhere', ...customHighlightStyle }}>
          <BookConcept data={data} invitationId={invitationId} isSample={isSample} />
        </div>
        {hasBgm && <audio ref={audioRef} loop preload="auto"><source src={bgm.url} type="audio/mpeg" /></audio>}
        {hasBgm && <EssayMusicToggle audioRef={audioRef} theme={theme} />}
        </div>
        {showDdayPopup && ddayPopup?.enabled && (
          <DdayPopupOverlay
            data={ddayPopup}
            weddingDate={data.wedding?.date}
            onDismiss={() => setShowDdayPopup(false)}
            pointColor={theme.accent}
            fontFamily={resolveKoreanFontFamily(data.fontStyle)}
          />
        )}
      </>
    )
  }

  // Desktop wrapper CSS for scroll/paper concepts (same pattern as book)
  const desktopWrapperCSS = `
    @media (min-width: 640px) {
      .essay-desktop-wrapper {
        display: flex; justify-content: center; min-height: 100vh; background: ${theme.background};
      }
      .essay-desktop-wrapper > .essay-font-container {
        width: 100%; max-width: 430px; position: relative; box-shadow: 0 0 40px rgba(0,0,0,0.15);
      }
      .essay-desktop-wrapper > button.fixed {
        right: calc(50% - 215px + 16px) !important; left: auto !important;
        top: 16px !important;
      }
      .essay-desktop-wrapper > .essay-scroll-hint-overlay {
        left: calc(50% - 215px) !important;
        right: calc(50% - 215px) !important;
      }
    }
  `

  // Scrollbar hide + scroll hint CSS (default/paper 공통)
  const scrollHintCSS = `
    html { scrollbar-width: none; -ms-overflow-style: none; }
    html::-webkit-scrollbar { display: none; }
    @keyframes bkScrollBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
  `

  // Paper concept - completely different layout
  if (concept === 'paper') {
    return (
      <>
        {allCSS && <style>{allCSS}</style>}
        <style>{desktopWrapperCSS}</style>
        {!isPreview && <style>{scrollHintCSS}</style>}
        <div className="essay-desktop-wrapper">
        {!isPaid && !isPreview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
          </div>
        )}
        <div className={`essay-font-container theme-${themeKey}`} style={{ wordBreak: 'keep-all', overflowWrap: 'anywhere', ...customHighlightStyle }}>
          <PaperConcept data={data} invitationId={invitationId} isSample={isSample} />
        </div>
        {!isPreview && <ScrollHintOverlay theme={theme} />}
        {hasBgm && <audio ref={audioRef} loop preload="auto"><source src={bgm.url} type="audio/mpeg" /></audio>}
        {hasBgm && <EssayMusicToggle audioRef={audioRef} theme={theme} />}
        </div>
        {showDdayPopup && ddayPopup?.enabled && (
          <DdayPopupOverlay
            data={ddayPopup}
            weddingDate={data.wedding?.date}
            onDismiss={() => setShowDdayPopup(false)}
            pointColor={theme.accent}
            fontFamily={resolveKoreanFontFamily(data.fontStyle)}
          />
        )}
      </>
    )
  }

  // Default concept
  return (
    <>
      {allCSS && <style>{allCSS}</style>}
      <style>{desktopWrapperCSS}</style>
      {!isPreview && <style>{scrollHintCSS}</style>}
      <div className="essay-desktop-wrapper">
      {!isPaid && !isPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
        </div>
      )}
      <div className={`essay-font-container theme-${themeKey}`} style={{ backgroundColor: theme.background, minHeight: '100vh', wordBreak: 'keep-all', overflowWrap: 'anywhere', ...customHighlightStyle }}>
        <CoverSection data={data} theme={theme} />
        {data.greeting && <GreetingSection data={data} theme={theme} />}
        {contentMode === 'interview' && data.interviews?.length > 0 ? (
          <InterviewSection interviews={data.interviews} theme={theme} />
        ) : (
          data.chapters?.map((chapter: any, i: number) => (
            <ChapterSection key={i} chapter={chapter} index={i} theme={theme} />
          ))
        )}
        <QuoteSection data={data} theme={theme} />
        {data.gallery?.images?.length > 0 && <DefaultGallerySection data={data} theme={theme} />}
        <WeddingInfoSection data={data} theme={theme} />
        {data.sectionVisibility?.contacts !== false && <ContactsSection data={data} theme={theme} />}
        {data.sectionVisibility?.bankAccounts !== false && <BankAccountsSection data={data} theme={theme} />}
        <ThankYouSection data={data} theme={theme} />
        {data.sectionVisibility?.guestbook !== false && <GuestbookSection data={data} invitationId={invitationId} theme={theme} isSample={isSample} />}
        {data.rsvpEnabled && data.sectionVisibility?.rsvp !== false && <RsvpSection data={data} invitationId={invitationId} theme={theme} />}
        <EssayFooter theme={theme} />
      </div>
      {!isPreview && <ScrollHintOverlay theme={theme} />}
      {hasBgm && <audio ref={audioRef} loop preload="auto"><source src={bgm.url} type="audio/mpeg" /></audio>}
      {hasBgm && <EssayMusicToggle audioRef={audioRef} theme={theme} />}
      </div>
      {showDdayPopup && ddayPopup?.enabled && (
        <DdayPopupOverlay
          data={ddayPopup}
          weddingDate={data.wedding?.date}
          onDismiss={() => setShowDdayPopup(false)}
          pointColor={theme.accent}
          fontFamily={resolveKoreanFontFamily(data.fontStyle)}
        />
      )}
    </>
  )
}
