'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import RsvpForm from '@/components/invitation/RsvpForm'
import { parseHighlight } from '@/lib/textUtils'
import type { Invitation } from '@/types/invitation'

// ===== Types =====
type EssayColorTheme = 'essay-ivory' | 'essay-blush' | 'essay-sage' | 'essay-mono' | 'essay-sky' | 'essay-coral'
type DesignConcept = 'default' | 'paper' | 'book'
type EssayFontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'

interface EssayFontConfig { display: string; displayKr: string; body: string }

const essayFontStyles: Record<EssayFontStyle, EssayFontConfig> = {
  classic: { display: "'Playfair Display', serif", displayKr: "'Ridibatang', serif", body: "'Ridibatang', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Pretendard', sans-serif", body: "'Pretendard', sans-serif" },
  romantic: { display: "'Lora', serif", displayKr: "'Okticon', serif", body: "'Okticon', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'JeonnamEducationBarun', sans-serif", body: "'JeonnamEducationBarun', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'ELandChoice', serif", body: "'ELandChoice', serif" },
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
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', letterSpacing: '6px', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{coverTitle}</div>
        </div>

        {/* 하단 텍스트 */}
        <div className="relative z-10 pb-16 text-center w-full px-8">
          <div className="transition-all duration-[1200ms] delay-500" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '26px', fontWeight: 200, letterSpacing: '10px', lineHeight: 1.2, color: '#fff' }}>{groomName}</div>
          </div>
          <div className="my-4 transition-all duration-[1500ms] delay-700" style={{ opacity: loaded ? 1 : 0 }}>
            <div className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>&</div>
          </div>
          <div className="transition-all duration-[1200ms] delay-900" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '26px', fontWeight: 200, letterSpacing: '10px', lineHeight: 1.2, color: '#fff' }}>{brideName}</div>
          </div>
          <div className="mt-8 transition-all duration-[1200ms] delay-[1100ms]" style={{ opacity: loaded ? 1 : 0 }}>
            <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.4)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', letterSpacing: '4px', color: 'rgba(255,255,255,0.8)' }}>
              {typedText}<span className="animate-pulse" style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            </div>
            <div className="mt-2 transition-all duration-500 delay-[2000ms]" style={{ opacity: loaded ? 1 : 0 }}>
              <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.6)' }}>{dayOfWeek}</div>
            </div>
          </div>
        </div>
        {scrollHint}
      </div>
    )
  }

  // ── 센터 (center): 원형 프레임 중앙, 위아래 텍스트 ──
  if (coverDesign === 'center' && coverImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: theme.background }}>
        {/* 상단 장식선 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-[2000ms]" style={{ width: '1px', height: loaded ? '60px' : '0px', background: theme.divider }} />

        {/* 타이틀 */}
        <div className="transition-all duration-1000 delay-200" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-12px)' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', letterSpacing: '6px', color: theme.gray, marginBottom: '32px', textAlign: 'center' }}>{coverTitle}</div>
        </div>

        {/* 원형 이미지 */}
        <div className="transition-all duration-[1200ms] delay-400" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'scale(1)' : 'scale(0.9)' }}>
          <div style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', border: `1px solid ${theme.divider}`, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
            <img src={coverImage} alt="" className="w-full h-full object-cover" style={cropStyle} />
          </div>
        </div>

        {/* 이름 */}
        <div className="text-center mt-10 relative z-10">
          <div className="transition-all duration-[1200ms] delay-600" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)' }}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '24px', fontWeight: 200, letterSpacing: '10px', lineHeight: 1.2, color: theme.heading }}>{groomName}</div>
          </div>
          <div className="my-4 transition-all duration-[1500ms] delay-800" style={{ opacity: loaded ? 1 : 0 }}>
            <div className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', fontStyle: 'italic', color: theme.accent, lineHeight: 1 }}>&</div>
          </div>
          <div className="transition-all duration-[1200ms] delay-[1000ms]" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)' }}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '24px', fontWeight: 200, letterSpacing: '10px', lineHeight: 1.2, color: theme.heading }}>{brideName}</div>
          </div>
        </div>

        {/* 날짜 */}
        <div className="mt-10 transition-all duration-[1200ms] delay-[1200ms]" style={{ opacity: loaded ? 1 : 0 }}>
          <div style={{ width: '32px', height: '1px', background: theme.divider, margin: '0 auto 12px' }} />
          <div className="text-center">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', letterSpacing: '4px', color: theme.accent }}>
              {typedText}<span className="animate-pulse" style={{ color: theme.divider }}>|</span>
            </div>
            <div className="mt-2 transition-all duration-500 delay-[2000ms]" style={{ opacity: loaded ? 1 : 0 }}>
              <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '3px', color: theme.gray }}>{dayOfWeek}</div>
            </div>
          </div>
        </div>
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
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 300, letterSpacing: '8px', lineHeight: 1.3, color: theme.heading }}>
            {coverTitle.split(' ').map((word: string, i: number) => (
              <div key={i}>{word}</div>
            ))}
          </div>
        </div>

        {/* 작은 이미지 + 이름 */}
        <div className="flex items-end gap-5 mt-10 transition-all duration-[1200ms] delay-500" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}>
          <div style={{ width: '100px', height: '130px', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${theme.divider}`, flexShrink: 0 }}>
            <img src={coverImage} alt="" className="w-full h-full object-cover" style={cropStyle} />
          </div>
          <div className="text-left pb-1">
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 300, letterSpacing: '4px', color: theme.heading, lineHeight: 1.8 }}>{groomName}</div>
            <div className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', fontStyle: 'italic', color: theme.accent, lineHeight: 1, margin: '4px 0' }}>&</div>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '16px', fontWeight: 300, letterSpacing: '4px', color: theme.heading, lineHeight: 1.8 }}>{brideName}</div>
          </div>
        </div>

        {/* 날짜 */}
        <div className="mt-12 transition-all duration-[1200ms] delay-[900ms]" style={{ opacity: loaded ? 1 : 0 }}>
          <div style={{ width: '32px', height: '1px', background: theme.divider, margin: '0 auto 12px' }} />
          <div className="text-center">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', letterSpacing: '4px', color: theme.accent }}>
              {typedText}<span className="animate-pulse" style={{ color: theme.divider }}>|</span>
            </div>
            <div className="mt-2 transition-all duration-500 delay-[2000ms]" style={{ opacity: loaded ? 1 : 0 }}>
              <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '3px', color: theme.gray }}>{dayOfWeek}</div>
            </div>
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
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', letterSpacing: '6px', color: theme.gray, marginBottom: '48px', textAlign: 'center' }}>{coverTitle}</div>
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
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', letterSpacing: '4px', color: theme.accent }}>
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
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '5px', color: theme.accent }}>INVITATION</div>
        </div>

        {/* Drop cap - 첫 글자만 크게 */}
        {lines.length > 0 && (
          <div className="relative">
            <span className="transition-all duration-700" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '52px', fontWeight: 300, lineHeight: 1,
              color: theme.accent, float: 'left',
              marginRight: '8px', marginTop: '4px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            }}>
              {lines[0].trim().charAt(0)}
            </span>
            {lines.map((line: string, i: number) => (
              <p key={i} className="es-f15 transition-all duration-600 ease-out" style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '15px', lineHeight: 2.4,
                color: theme.text,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: `${200 + i * 80}ms`,
              }}>
                {i === 0 ? line.trim().substring(1) : (line || '\u00A0')}
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
        fontFamily: "'Playfair Display', serif", fontSize: '120px', fontWeight: 700,
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
                  fontFamily: "'Playfair Display', serif", fontSize: '11px', fontStyle: 'italic',
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
              {lines.map((line: string, j: number) => {
                const isHero = /^>>.*<<$/.test(line.trim())
                if (isHero) {
                  const heroText = line.trim().replace(/^>>/, '').replace(/<<$/, '')
                  return (
                    <p key={j} className="transition-all duration-600 ease-out" style={{
                      fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 400, fontStyle: 'italic',
                      lineHeight: 1.8, color: theme.heading, textAlign: 'center', margin: '16px 0',
                      opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                      transitionDelay: `${300 + j * 60}ms`,
                    }}>{heroText}</p>
                  )
                }
                const hasMarkup = /==|~~|\*\*/.test(line)
                return hasMarkup ? (
                  <p key={j} className="es-f14 transition-all duration-600 ease-out" style={{
                    fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 2.4,
                    color: theme.text,
                    opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                    transitionDelay: `${300 + j * 60}ms`,
                  }} dangerouslySetInnerHTML={{ __html: parseHighlight(line) }} />
                ) : (
                  <p key={j} className="es-f14 transition-all duration-600 ease-out" style={{
                    fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 2.4,
                    color: theme.text,
                    opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                    transitionDelay: `${300 + j * 60}ms`,
                  }}>{line || '\u00A0'}</p>
                )
              })}
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
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '72px', color: theme.divider, lineHeight: 0.5 }}>&ldquo;</div>
        <div className="mt-4">
          {quote.text.split('\n').map((line: string, i: number) => (
            <p key={i} className="es-f18" style={{
              fontFamily: "'Playfair Display', serif",
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
          fontFamily: "'Playfair Display', serif", fontSize: '10px',
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
            fontFamily: "'Playfair Display', serif", fontSize: '10px', fontStyle: 'italic',
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
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '5px', color: theme.accent, marginBottom: '12px' }}>WEDDING DAY</div>
            <div className="flex items-center justify-center gap-3 py-2">
              <div style={{ width: '40px', height: '0.5px', background: theme.divider }} />
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill={theme.divider} /></svg>
              <div style={{ width: '40px', height: '0.5px', background: theme.divider }} />
            </div>
          </div>
          <div className="text-center mb-8">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '48px', fontWeight: 300, color: theme.heading, lineHeight: 1 }}>{weddingDate.getDate()}</div>
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
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '3px', color: theme.gray, marginBottom: '10px' }}>{side.toUpperCase()}</div>
                    <p className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: theme.gray, lineHeight: 1.8 }}>
                      {p.father?.name && <>{p.father.deceased ? '故 ' : ''}{p.father.name} · </>}{p.mother?.name && <>{p.mother.deceased ? '故 ' : ''}{p.mother.name}</>}
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
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: theme.gray, marginBottom: '12px', textAlign: 'center' }}>MAP</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { href: `https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}`, bg: '#03C75A', label: 'N', name: 'NAVER' },
                  { href: `https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}`, bg: '#FEE500', label: 'K', name: 'KAKAO', dark: true },
                  { href: `tmap://search?name=${encodeURIComponent(w.venue?.name || '')}`, bg: '#4285F4', label: 'T', name: 'TMAP' },
                ].map(m => (
                  <a key={m.name} href={m.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3" style={{ border: `0.5px solid ${theme.divider}` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: m.bg }}><span className={`text-xs font-bold ${m.dark ? 'text-black' : 'text-white'}`}>{m.label}</span></div>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '1px', color: theme.gray }}>{m.name}</span>
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
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '5px', color: theme.gray, marginBottom: '8px' }}>CONTACT</div>
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
        <button onClick={() => { navigator.clipboard.writeText(acc.account); alert('계좌번호가 복사되었습니다.') }} style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '1px', color: theme.accent, background: 'none', border: `0.5px solid ${theme.accent}`, padding: '4px 12px', cursor: 'pointer' }}>COPY</button>
      </div>
    ))
  }
  return (
    <ScrollSection>
      <div className="px-8 py-12" style={{ backgroundColor: theme.sectionBg }}>
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '5px', color: theme.gray, marginBottom: '8px' }}>GIFT</div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: theme.heading }}>마음 전하실 곳</h3>
          </div>
          {hasAccounts ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(['groom', 'bride'] as const).map(side => (
                  <button key={side} onClick={() => setExpandedSide(expandedSide === side ? null : side)} style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', letterSpacing: '2px', padding: '12px', border: `0.5px solid ${expandedSide === side ? theme.accent : theme.divider}`, background: expandedSide === side ? theme.accent : theme.cardBg, color: expandedSide === side ? '#FFF' : theme.text, cursor: 'pointer', transition: 'all 0.3s' }}>{side.toUpperCase()}</button>
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
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '5px', color: theme.gray, marginBottom: '8px' }}>MESSAGES</div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: theme.heading }}>방명록</h3>
          </div>
          <p className="text-center mb-6" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', fontWeight: 500, color: theme.heading }}>{questions[currentQ]}</p>
          {questions.length > 1 && <button onClick={() => setCurrentQ((currentQ + 1) % questions.length)} className="block mx-auto mb-4" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: theme.gray, background: 'none', border: 'none', cursor: 'pointer' }}>다른 질문 보기 →</button>}
          <div className="space-y-3 mb-8">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" maxLength={20} className="w-full px-4 py-3 text-sm outline-none" style={{ border: `0.5px solid ${theme.divider}`, background: theme.cardBg, color: theme.text }} />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="축하 메시지를 남겨주세요" rows={3} maxLength={500} className="w-full px-4 py-3 text-sm outline-none resize-none" style={{ border: `0.5px solid ${theme.divider}`, background: theme.cardBg, color: theme.text }} />
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
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '5px', color: theme.gray, marginBottom: '8px' }}>RSVP</div>
            <h3 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', color: theme.heading }}>참석 여부</h3>
            {data.rsvpDeadline && <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', color: theme.gray, marginTop: '8px' }}>{new Date(data.rsvpDeadline).toLocaleDateString('ko-KR')}까지 알려주세요</p>}
          </div>
          <RsvpForm invitationId={invitationId} primaryColor={theme.accent} />
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
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '5px', color: theme.accent, marginBottom: '20px' }}>THANK YOU</div>
          <div className="mt-8">{ty.message.split('\n').map((line: string, i: number) => <p key={i} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 2.2, color: theme.text }}>{line || '\u00A0'}</p>)}</div>
          {ty.sign && <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: theme.gray, marginTop: '24px' }}>{ty.sign}</div>}
        </div>
      </div>
    </ScrollSection>
  )
}

function EssayFooter({ theme }: { theme: ThemeConfig }) {
  return (
    <div className="py-8 text-center" style={{ backgroundColor: theme.background }}>
      <div style={{ width: '1px', height: '30px', background: theme.divider, margin: '0 auto 16px' }} />
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '3px', color: theme.gray }}>DEAR DRAWER</p>
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
          fontFamily: "'Playfair Display', serif",
          fontSize: '22px', fontWeight: 400, color: paperColors.text,
          lineHeight: 1.8, letterSpacing: '2px',
        }}>
          {groomName} & {brideName}
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
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
            fontFamily: "'Playfair Display', serif",
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
              fontFamily: "'Playfair Display', serif",
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

        {(chapter.body || '').split('\n').map((line: string, j: number) => {
          const isHero = /^>>.*<<$/.test(line.trim())
          if (isHero) {
            const heroText = line.trim().replace(/^>>/, '').replace(/<<$/, '')
            return (
              <PaperReveal key={j} delay={250 + j * 40}>
                <p style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 400, fontStyle: 'italic',
                  lineHeight: 1.8, color: paperColors.text, textAlign: 'center', margin: '16px 0',
                }}>{heroText}</p>
              </PaperReveal>
            )
          }
          const hasMarkup = /==|~~|\*\*/.test(line)
          return (
          <PaperReveal key={j} delay={250 + j * 40}>
            {hasMarkup ? (
              <p className="es-f16" style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '16px', lineHeight: 1.8, color: paperColors.text,
                marginBottom: line.trim() === '' ? '16px' : '0',
              }} dangerouslySetInnerHTML={{ __html: parseHighlight(line) }} />
            ) : (
              <p className="es-f16" style={{
                fontFamily: "'Pretendard', sans-serif",
                fontSize: '16px', lineHeight: 1.8, color: paperColors.text,
                marginBottom: line.trim() === '' ? '16px' : '0',
              }}>
                {line || '\u00A0'}
              </p>
            )}
          </PaperReveal>
          )
        })}
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
              fontFamily: "'Playfair Display', serif",
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
            fontFamily: "'Playfair Display', serif",
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
                      {p.father?.name && <>{p.father.deceased ? '故 ' : ''}{p.father.name} · </>}{p.mother?.name && <>{p.mother.deceased ? '故 ' : ''}{p.mother.name}</>}
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

  const handleSubmit = async () => {
    if (!selected || !name.trim()) return
    try {
      await fetch('/api/rsvp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, guestName: name.trim(), attendance: selected === 'attend' ? 'yes' : 'no', guestCount: 1, message: '' }),
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
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 1.85, color: paperColors.text, marginBottom: '32px' }}>
                참석 여부를 알려주시면<br />저희의 다음 문장을 준비하겠습니다.
              </p>
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
            <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" maxLength={20} style={{
              width: '100%', padding: '12px 16px', fontFamily: "'Pretendard', sans-serif", fontSize: '14px',
              color: paperColors.text, background: 'transparent', border: `1px solid ${paperColors.accent}`, borderRadius: '4px', outline: 'none',
            }} />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="메시지를 남겨주세요" rows={3} maxLength={500} style={{
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
}

const bookInfoColorsByTheme: Record<string, BookInfoColorConfig> = {
  'essay-ivory': {
    bg: '#F5F4F1', pageBg: '#F9F8F5', text: '#2C2C2C', heading: '#1A1A1A',
    muted: '#8C8C86', accent: '#6B6355', divider: '#E0DDD8', cardBg: '#FFFFFF',
    toolbar: '#EDECE8', toolbarText: '#5A5A54', progressBg: '#E0DDD8', progressFill: '#6B6355',
  },
  'essay-blush': {
    bg: '#F9F2F0', pageBg: '#FBF5F3', text: '#3A2A2E', heading: '#1A1A1A',
    muted: '#9A8488', accent: '#A06070', divider: '#E0D0D4', cardBg: '#FFFFFF',
    toolbar: '#F2EAEA', toolbarText: '#7A6468', progressBg: '#E0D0D4', progressFill: '#A06070',
  },
  'essay-sage': {
    bg: '#F0F2EE', pageBg: '#F5F7F3', text: '#2A2E28', heading: '#1A1A1A',
    muted: '#828C7E', accent: '#5A7A4E', divider: '#C8D8BE', cardBg: '#FFFFFF',
    toolbar: '#E8ECE4', toolbarText: '#5A6A52', progressBg: '#C8D8BE', progressFill: '#5A7A4E',
  },
  'essay-mono': {
    bg: '#F5F5F5', pageBg: '#FAFAFA', text: '#1A1A1A', heading: '#000000',
    muted: '#888888', accent: '#444444', divider: '#D0D0D0', cardBg: '#FFFFFF',
    toolbar: '#EEEEEE', toolbarText: '#555555', progressBg: '#D0D0D0', progressFill: '#444444',
  },
  'essay-sky': {
    bg: '#EEF2F8', pageBg: '#F4F8FC', text: '#2A3440', heading: '#1A2A3A',
    muted: '#7A8E9E', accent: '#4A7A9E', divider: '#B0C8DC', cardBg: '#FFFFFF',
    toolbar: '#E4ECF4', toolbarText: '#5A7080', progressBg: '#B0C8DC', progressFill: '#4A7A9E',
  },
  'essay-coral': {
    bg: '#F6EEEA', pageBg: '#FAF4F0', text: '#3A2A24', heading: '#1A1A1A',
    muted: '#9A8078', accent: '#B86A54', divider: '#DCC0B4', cardBg: '#FFFFFF',
    toolbar: '#F0E4DE', toolbarText: '#7A6058', progressBg: '#DCC0B4', progressFill: '#B86A54',
  },
}
const bookInfoColorsIvory = bookInfoColorsByTheme['essay-ivory']

function getBookColors(theme?: string) {
  return bookColorsByTheme[theme || 'essay-ivory'] || bookColorsByTheme['essay-ivory']
}
function getBookInfoColors(theme?: string) {
  return bookInfoColorsByTheme[theme || 'essay-ivory'] || bookInfoColorsByTheme['essay-ivory']
}

// -- Book: 애니메이션 CSS --
const bookAnimCSS = `
@keyframes bkFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bkFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bkScaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
@keyframes bkDrawLine { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes bkSlideRight { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes bkHighlight { from { background-size: 0% 100%; } to { background-size: 100% 100%; } }
.book-page-content .bk-page { min-height: calc(100vh - 80px); }
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
  type: 'cover' | 'intro' | 'toc' | 'greeting' | 'chapter' | 'quote' | 'info-intro' | 'wedding' | 'wedding-date' | 'wedding-venue' | 'guidance' | 'contacts' | 'bank' | 'guestbook' | 'rsvp' | 'thankyou' | 'end' | 'bonus-intro' | 'bonus-interview' | 'bonus-end'
  title?: string
  data?: any
}

function BookConcept({ data, invitationId, isSample, skipIntro }: { data: any; invitationId: string; isSample?: boolean; skipIntro?: boolean }) {
  const bookColors = getBookColors(data.colorTheme)
  const bookInfoColors = getBookInfoColors(data.colorTheme)

  const [currentPage, setCurrentPage] = useState(skipIntro ? 1 : 0)
  const [showToc, setShowToc] = useState(false)
  const hasBonusContent = (data.content?.bonusInterviews || []).some((bi: any) => bi.question?.trim() && bi.answer?.trim())
  const [showBonus, setShowBonus] = useState(hasBonusContent)
  const [pageTransition, setPageTransition] = useState<'none' | 'next' | 'prev'>('none')
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentMode = data.contentMode || 'story'
  const isEditorial = true

  // 페이지 목록 생성 (목차는 사이드바로만 접근)
  const pages: BookPage[] = []
  pages.push({ id: 'cover', type: 'cover', title: '표지' })
  if (data.intro?.enabled !== false) pages.push({ id: 'intro', type: 'intro', title: '프롤로그' })
  if (data.greeting) pages.push({ id: 'greeting', type: 'greeting', title: '초대의 글' })
  if (contentMode === 'story' && data.chapters?.length) {
    data.chapters.forEach((ch: any, i: number) => {
      pages.push({ id: `chapter-${i}`, type: 'chapter', title: ch.title || `Chapter ${i + 1}`, data: { chapter: ch, index: i } })
    })
  }
  if (contentMode === 'interview' && data.interviews?.length) {
    data.interviews.forEach((qa: any, i: number) => {
      pages.push({ id: `interview-${i}`, type: 'chapter', title: qa.question?.substring(0, 15) + '...', data: { interview: qa, index: i } })
    })
  }
  if (data.quote?.text) pages.push({ id: 'quote', type: 'quote', title: '인용문' })
  pages.push({ id: 'info-intro', type: 'info-intro', title: '예식 안내' })
  pages.push({ id: 'wedding-date', type: 'wedding-date' as any, title: '그 날' })
  pages.push({ id: 'wedding-venue', type: 'wedding-venue' as any, title: '그 곳' })
  // 행복한 시간을 위한 안내 (info 항목이 하나라도 있을 때)
  const infoObj = data.info || {}
  const defaultItemOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
  const infoItemOrder = infoObj.itemOrder || defaultItemOrder
  const enabledInfoItems = [
    ...infoItemOrder.filter((key: string) => infoObj[key]?.enabled && infoObj[key]?.content),
    ...(infoObj.customItems || []).filter((item: any) => item.enabled && item.content).map((_: any, i: number) => `custom-${i}`),
  ]
  if (enabledInfoItems.length > 0) pages.push({ id: 'guidance', type: 'guidance' as any, title: '안내' })
  if (data.sectionVisibility?.contacts !== false) pages.push({ id: 'contacts', type: 'contacts', title: '연락처' })
  if (data.sectionVisibility?.bankAccounts !== false) pages.push({ id: 'bank', type: 'bank', title: '마음 전하기' })
  if (data.thankYou?.message) pages.push({ id: 'thankyou', type: 'thankyou', title: '감사 인사' })
  if (data.sectionVisibility?.guestbook !== false) pages.push({ id: 'guestbook', type: 'guestbook', title: '방명록' })
  if (data.rsvpEnabled && data.sectionVisibility?.rsvp !== false) pages.push({ id: 'rsvp', type: 'rsvp', title: '참석 여부' })
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
    setPageTransition(pageIndex > currentPage ? 'next' : 'prev')
    setTimeout(() => {
      setCurrentPage(pageIndex)
      setPageTransition('none')
    }, 200)
  }, [currentPage, totalPages])

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

  // 인터랙티브 요소 판별
  const isInteractiveTarget = useCallback((target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false
    return !!target.closest('a, button, input, textarea, select, [role="button"]')
  }, [])

  // 탭 오버레이 비활성화 페이지 (텍스트 입력이 있는 폼)
  const isFormPage = useCallback(() => {
    const p = pages[currentPage]
    return p?.type === 'guestbook' || p?.type === 'rsvp'
  }, [currentPage, pages])

  // 탭/스와이프 통합 처리 (터치)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isFormPage()) return
    if (isInteractiveTarget(e.target)) return

    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const dx = endX - touchStartX.current
    const dy = endY - touchStartY.current

    // 스와이프: 가로 이동 > 50px
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) nextPage()
      else prevPage()
      return
    }

    // 탭: 거의 이동 없음 (< 10px)
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = touchStartX.current - rect.left
      const w = rect.width
      if (x < w * 0.35) prevPage()
      else if (x > w * 0.65) nextPage()
      // 가운데는 무시 (스크롤 등 자연스러운 동작 허용)
    }
  }, [nextPage, prevPage, isFormPage, isInteractiveTarget])

  // 마우스 클릭 (데스크톱)
  const handleTap = useCallback((e: React.MouseEvent) => {
    if (isFormPage()) return
    if (isInteractiveTarget(e.target)) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const w = rect.width
    if (x < w * 0.35) prevPage()
    else if (x > w * 0.65) nextPage()
  }, [nextPage, prevPage, isFormPage, isInteractiveTarget])

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

  const page = pages[currentPage]

  // 헤더 타이틀: 그룹화된 이름 표시
  const storyPageTypes = new Set(['intro', 'greeting', 'chapter', 'quote'])
  const infoPageTypes = new Set(['info-intro', 'wedding-date', 'wedding-venue', 'guidance', 'contacts', 'bank', 'thankyou', 'guestbook', 'rsvp'])
  const bonusPageTypes = new Set(['bonus-intro', 'bonus-interview', 'bonus-end'])
  const isInfoPage = infoPageTypes.has(page?.type || '')
  const isQuoteDark = isEditorial && page?.type === 'quote'
  const bookQuoteDarkColors = {
    ...bookColors,
    bg: '#2C2820', pageBg: '#2C2820', muted: '#A09882', divider: '#5C5444',
    toolbarText: '#A09882', progressBg: '#5C5444', progressFill: '#A09882',
  }
  const activeColors = isQuoteDark ? bookQuoteDarkColors : isInfoPage ? bookInfoColors : bookColors

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 select-none"
      style={{ background: activeColors.bg, fontFamily: "'Pretendard', sans-serif", transition: 'background 0.4s ease' }}
    >
      {/* 애니메이션 키프레임 */}
      <style dangerouslySetInnerHTML={{ __html: bookAnimCSS }} />



      {/* 상단 툴바 */}
      {currentPage > 0 && (
        <div className="fixed top-0 left-0 z-40 flex items-center px-4" style={{ height: '44px', background: 'transparent', transition: 'background 0.4s ease' }}>
          <button onClick={(e) => { e.stopPropagation(); setShowToc(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke={activeColors.muted} strokeWidth="1.2">
              <line x1="0" y1="1" x2="18" y2="1" /><line x1="0" y1="7" x2="14" y2="7" /><line x1="0" y1="13" x2="10" y2="13" />
            </svg>
          </button>
        </div>
      )}

      {/* 좌우 탭 영역 (투명 오버레이) - 폼 페이지가 아닐 때만 */}
      {currentPage > 0 && !isFormPage() && (
        <>
          <div
            className="fixed left-0 z-30"
            style={{ top: '44px', bottom: '36px', width: '35%' }}
            onClick={(e) => { e.stopPropagation(); prevPage() }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0]
              const dx = Math.abs(touch.clientX - touchStartX.current)
              const dy = Math.abs(touch.clientY - touchStartY.current)
              if (dx < 15 && dy < 15) { e.stopPropagation(); prevPage() }
            }}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY }}
          />
          <div
            className="fixed right-0 z-30"
            style={{ top: '44px', bottom: '36px', width: '35%' }}
            onClick={(e) => { e.stopPropagation(); nextPage() }}
            onTouchEnd={(e) => {
              const touch = e.changedTouches[0]
              const dx = Math.abs(touch.clientX - touchStartX.current)
              const dy = Math.abs(touch.clientY - touchStartY.current)
              if (dx < 15 && dy < 15) { e.stopPropagation(); nextPage() }
            }}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY }}
          />
        </>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className="fixed inset-0 overflow-y-auto" style={{
        paddingTop: currentPage > 0 ? '44px' : '0',
        paddingBottom: currentPage > 0 ? '36px' : '0',
      }}>
        <div key={currentPage} className="book-page-content" style={{
          opacity: pageTransition !== 'none' ? 0 : 1,
          transform: pageTransition === 'next' ? 'translateX(-16px) scale(0.98)' : pageTransition === 'prev' ? 'translateX(16px) scale(0.98)' : 'translateX(0) scale(1)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          minHeight: '100%',
        }}>
          {page?.type === 'cover' && <BookCover data={data} onNext={nextPage} />}
          {page?.type === 'intro' && <BookIntro data={data} />}
          {page?.type === 'toc' && <BookToc pages={pages} currentPage={currentPage} onGoTo={(i) => { setShowToc(false); goToPage(i) }} colorTheme={data.colorTheme} />}
          {page?.type === 'greeting' && <BookGreeting data={data} />}
          {page?.type === 'chapter' && page.data?.chapter && <BookChapter chapter={page.data.chapter} index={page.data.index} ed={isEditorial} colorTheme={data.colorTheme} />}
          {page?.type === 'chapter' && page.data?.interview && <BookInterview qa={page.data.interview} index={page.data.index} ed={isEditorial} colorTheme={data.colorTheme} />}
          {page?.type === 'quote' && <BookQuote data={data} ed={isEditorial} />}
          {page?.type === 'info-intro' && <BookInfoIntro data={data} />}
          {page?.type === 'wedding-date' && <BookWeddingDate data={data} />}
          {page?.type === 'wedding-venue' && <BookWeddingVenue data={data} />}
          {page?.type === 'guidance' && <BookGuidance data={data} />}
          {page?.type === 'contacts' && <BookContacts data={data} />}
          {page?.type === 'bank' && <BookBank data={data} />}
          {page?.type === 'thankyou' && <BookThankYou data={data} />}
          {page?.type === 'guestbook' && <BookGuestbook data={data} invitationId={invitationId} isSample={isSample} />}
          {page?.type === 'rsvp' && <BookRsvp data={data} invitationId={invitationId} />}
          {page?.type === 'end' && <BookEnd data={data} onRestart={() => goToPage(0)} showBonus={showBonus} onShowBonus={hasBonusContent ? () => { setShowBonus(true); setPendingBonusNav(true) } : undefined} />}
          {page?.type === 'bonus-intro' && <BookBonusIntro data={data} />}
          {page?.type === 'bonus-interview' && page.data?.bonusInterview && <BookBonusInterview interview={page.data.bonusInterview} index={page.data.index} total={page.data.total} colorTheme={data.colorTheme} />}
          {page?.type === 'bonus-end' && <BookBonusEnd data={data} onRestart={() => goToPage(0)} />}
        </div>
      </div>

      {/* 좌우 네비게이션 버튼 (전자책 스타일 - 화면 중앙 양옆) */}
      {currentPage > 0 && (
        <>
          {currentPage > 0 && (
            <button
              className="fixed z-40"
              onClick={(e) => { e.stopPropagation(); prevPage() }}
              style={{ left: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 4px', opacity: 0.3, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.3' }}
            >
              <svg width="10" height="20" viewBox="0 0 10 20" fill="none" stroke={activeColors.toolbarText} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8,1 2,10 8,19" />
              </svg>
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button
              className="fixed z-40"
              onClick={(e) => { e.stopPropagation(); nextPage() }}
              style={{ right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 4px', opacity: 0.3, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.3' }}
            >
              <svg width="10" height="20" viewBox="0 0 10 20" fill="none" stroke={activeColors.toolbarText} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,1 8,10 2,19" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* 하단 진행률 바 */}
      {currentPage > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40" style={{ height: '36px', background: 'transparent', transition: 'background 0.4s ease' }}>
          <div className="flex items-center h-full px-5 gap-3">
            <span style={{ fontSize: '9px', fontFamily: "'Playfair Display', serif", color: activeColors.muted, flexShrink: 0, opacity: 0.6 }}>{Math.round(progress)}%</span>
            <div className="flex-1 relative" style={{ height: '2px', background: activeColors.progressBg, borderRadius: '1px', opacity: 0.5 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: activeColors.progressFill, borderRadius: '1px', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* 목차 오버레이 */}
      {showToc && (() => {
        // 그룹화된 목차 생성
        const storyTypes = new Set(['intro', 'greeting', 'chapter', 'quote'])
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
        if (storyStart >= 0) tocItems.push({ label: '우리의 이야기', pageIndex: storyStart, active: isInStory, section: 'STORY' })

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
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', letterSpacing: '4px', color: bookColors.muted, marginBottom: '24px' }}>CONTENTS</div>
                {tocItems.map((item, i) => (
                  <div key={i}>
                    {item.section && (
                      <div style={{ paddingTop: i === 0 ? '0' : '16px', paddingBottom: '8px' }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '3px', color: bookColors.muted }}>{item.section}</span>
                      </div>
                    )}
                    <button onClick={() => { setShowToc(false); goToPage(item.pageIndex) }} className="w-full text-left py-3 flex items-center justify-between" style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: `0.5px solid ${bookColors.divider}`, opacity: item.active ? 1 : 0.6 }}>
                      <span style={{ fontSize: '13px', color: item.active ? bookColors.accent : bookColors.text, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
                      <span style={{ fontSize: '10px', fontFamily: "'Playfair Display', serif", color: bookColors.muted }}>{item.pageIndex + 1}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// -- Book: Cover --
function BookCover({ data, onNext }: { data: any; onNext: () => void }) {
  const bookColors = getBookColors(data.colorTheme)
  const [loaded, setLoaded] = useState(false)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const coverTitle = data.design?.coverTitle || 'OUR WEDDING ESSAY'
  const coverDesign = data.design?.coverDesign || 'full'
  const coverImage = data.media?.coverImage || ''
  const weddingDate = data.wedding?.date ? new Date(data.wedding.date) : new Date()
  const dateStr = `${weddingDate.getFullYear()}`

  useEffect(() => { setTimeout(() => setLoaded(true), 200) }, [])

  const openButton = (
    <button
      onClick={(e) => { e.stopPropagation(); onNext() }}
      className="mt-10"
      style={{
        background: (coverDesign === 'full' || coverDesign === 'typo') && coverImage ? 'rgba(255,255,255,0.15)' : `${bookColors.accent}10`,
        border: `1.5px solid ${(coverDesign === 'full' || coverDesign === 'typo') && coverImage ? 'rgba(255,255,255,0.6)' : bookColors.accent}`,
        padding: '12px 32px',
        cursor: 'pointer', fontFamily: "'Playfair Display', serif", fontSize: '11px',
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
      <div className="min-h-screen flex flex-col items-center justify-end relative overflow-hidden" style={{ background: '#000' }}>
        <div className="absolute inset-0">
          <img src={coverImage} alt="" className="w-full h-full object-cover" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1.2s ease-out', ...bookCropStyle }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.6) 100%)' }} />
        </div>

        {/* 상단 타이틀 */}
        <div className="absolute top-0 left-0 right-0 pt-14 text-center" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s 0.3s' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', letterSpacing: '5px', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>{coverTitle}</div>
        </div>

        {/* 하단 텍스트 */}
        <div className="relative z-10 pb-8 text-center" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.8s 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 300, letterSpacing: '6px', color: '#fff', lineHeight: 1.8 }}>
            {groomName}
          </div>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 300, letterSpacing: '6px', color: '#fff', lineHeight: 1.8 }}>
            {brideName}
          </div>
          <div className="mt-4">
            <div style={{ width: '30px', height: '0.5px', background: 'rgba(255,255,255,0.4)', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', letterSpacing: '4px', color: 'rgba(255,255,255,0.7)' }}>{dateStr}</div>
          </div>
          {openButton}
        </div>
      </div>
    )
  }

  // ── 타이포 (typo): 전면 이미지 배경 + 중앙 화이트 카드 ──
  if (coverDesign === 'typo' && coverImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#000' }}>
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
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 300, letterSpacing: '6px', lineHeight: 1.4, color: '#1a1a1a' }}>
              {coverTitle.split(' ').map((word: string, i: number) => (
                <div key={i}>{word}</div>
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ width: '40px', height: '0.5px', background: '#ccc', margin: '0 auto 24px' }} />

          {/* 이름 */}
          <div className="text-center" style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 300, letterSpacing: '4px', color: '#1a1a1a', lineHeight: 2 }}>{groomName}</div>
            <div className="essay-ampersand" style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', fontStyle: 'italic', color: '#999', lineHeight: 1, margin: '2px 0' }}>&</div>
            <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 300, letterSpacing: '4px', color: '#1a1a1a', lineHeight: 2 }}>{brideName}</div>
          </div>

          {/* 하단 연도 */}
          <div className="text-center">
            <div style={{ width: '40px', height: '0.5px', background: '#ccc', margin: '0 auto 12px' }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', letterSpacing: '4px', color: '#999' }}>{dateStr}</div>
          </div>
        </div>
        {openButton}
      </div>
    )
  }

  // ── 센터 (center) 또는 기본: 원형 프레임 중앙 ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: bookColors.bg }}>
      <div className="relative" style={{
        width: '260px', padding: coverImage ? '32px 32px 48px' : '48px 32px',
        border: `1px solid ${bookColors.divider}`,
        background: '#FFFFFF',
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* 상단 장식 라인 */}
        <div className="text-center" style={{ marginBottom: coverImage ? '20px' : '36px' }}>
          <div style={{ width: '40px', height: '0.5px', background: bookColors.accent, margin: '0 auto' }} />
        </div>

        {/* 커버 이미지 (원형) */}
        {coverImage && (
          <div className="flex justify-center" style={{ marginBottom: '20px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: `1px solid ${bookColors.divider}` }}>
              <img src={coverImage} alt="" className="w-full h-full object-cover" style={bookCropStyle} />
            </div>
          </div>
        )}

        {/* 이름 */}
        <div className="text-center">
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 300, letterSpacing: '6px', color: bookColors.heading, lineHeight: 1.8 }}>
            {groomName}
          </div>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 300, letterSpacing: '6px', color: bookColors.heading, lineHeight: 1.8 }}>
            {brideName}
          </div>
          <div style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', color: bookColors.muted, marginTop: '16px', letterSpacing: '1px' }}>
            {coverTitle}
          </div>
        </div>

        {/* 하단 연도 */}
        <div className="text-center" style={{ marginTop: '36px' }}>
          <div style={{ width: '40px', height: '0.5px', background: bookColors.accent, margin: '0 auto 16px' }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', letterSpacing: '4px', color: bookColors.muted }}>{dateStr}</div>
        </div>
      </div>
      {openButton}
    </div>
  )
}

// -- Book: TOC --
function BookToc({ pages, currentPage, onGoTo, colorTheme }: { pages: BookPage[]; currentPage: number; onGoTo: (i: number) => void; colorTheme?: string }) {
  const bookColors = getBookColors(colorTheme)
  const contentPages = pages.filter(p => !['cover', 'toc', 'end'].includes(p.type))
  return (
    <div className="bk-page flex items-center" style={{ background: bookColors.pageBg }}>
      <div className="w-full px-10 py-16 max-w-md mx-auto">
        <div className="text-center mb-12">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '6px', color: bookColors.muted }}>CONTENTS</div>
          <div className="mt-4" style={{ width: '24px', height: '0.5px', background: bookColors.accent, margin: '0 auto' }} />
        </div>
        <div className="space-y-0">
          {contentPages.map((p, i) => {
            const pageIndex = pages.findIndex(pp => pp.id === p.id)
            return (
              <button key={p.id} onClick={(e) => { e.stopPropagation(); onGoTo(pageIndex) }} className="w-full flex items-baseline gap-3 py-3" style={{ background: 'none', border: 'none', cursor: 'pointer', borderBottom: `0.5px solid ${bookColors.divider}` }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', color: bookColors.muted, flexShrink: 0, width: '24px', textAlign: 'right' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-left" style={{ fontSize: '14px', color: bookColors.text, letterSpacing: '0.5px' }}>{p.title}</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', color: bookColors.muted, flexShrink: 0 }}>{pageIndex + 1}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// -- Book: Intro (사진 없는 이유) --
function BookIntro({ data }: { data: any }) {
  const bookColors = getBookColors(data?.colorTheme)
  const intro = data?.intro
  const title = intro?.title || '우리만의 에세이'
  const subtitle = intro?.subtitle || '— 사진 없는 청첩장 —'
  const bodyText = intro?.body || '사진이 없는 이유는 단순합니다.\n우리의 이야기가 더 잘 보이길 바라서입니다.\n\n수많은 이미지 속에서\n스쳐 지나가는 대신,\n한 문장이라도 천천히 읽히고 싶었습니다.\n\n이곳은 우리의 기록이고,\n작은 에세이입니다.'
  const lines = bodyText.split('\n')
  return (
    <div className="bk-page flex items-center justify-center" style={{ background: bookColors.pageBg }}>
      <div className="w-full px-12 py-16 max-w-md mx-auto text-center">
        <BA d={0} type="fade" className="mb-8">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookColors.muted }}>BEFORE WE BEGIN</div>
          <div className="mt-3"><BLine width="20px" color={bookColors.accent} d={300} center /></div>
        </BA>
        <BA d={200} className="mb-10">
          <p className="es-f18" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '18px', fontWeight: 600, lineHeight: 1.6, color: bookColors.heading }}>{title}</p>
          <p className="es-f12" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12px', letterSpacing: '2px', color: bookColors.muted, marginTop: '6px' }}>{subtitle}</p>
        </BA>
        <div>
          {lines.map((line: string, i: number) => (
            <BA key={i} d={400 + i * 80}>
              <p className="es-f14" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '14px', lineHeight: 2.4, color: bookColors.text }}>{line || '\u00A0'}</p>
            </BA>
          ))}
        </div>
      </div>
    </div>
  )
}

// -- Book: Greeting --
function BookGreeting({ data }: { data: any }) {
  const bookColors = getBookColors(data.colorTheme)
  const text = data.greeting || ''
  const lines = text.split('\n')
  return (
    <div className="bk-page flex items-center" style={{ background: bookColors.pageBg }}>
      <div className="w-full px-10 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="mb-10">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookColors.muted }}>PROLOGUE</div>
          <div className="mt-3"><BLine width="20px" color={bookColors.accent} d={300} /></div>
        </BA>
        <div>
          {lines.map((line: string, i: number) => (
            <BA key={i} d={300 + i * 100}>
              <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }}>{line || '\u00A0'}</p>
            </BA>
          ))}
        </div>
      </div>
    </div>
  )
}

// -- Book: Chapter --
function BookChapter({ chapter, index, ed = false, colorTheme }: { chapter: any; index: number; ed?: boolean; colorTheme?: string }) {
  const bookColors = getBookColors(colorTheme)
  const lines = (chapter.body || '').split('\n')
  const firstTextIdx = lines.findIndex((l: string) => l.trim().length > 0)
  const chapterNum = String(index + 1).padStart(2, '0')

  // 에디토리얼: 텍스트 정렬 변주 (0: left, 1: right, 2: center)
  const alignments: ('left' | 'right' | 'center')[] = ['left', 'right', 'left']
  const textAlign = ed ? alignments[index % 3] : 'left' as 'left' | 'right' | 'center'

  // 본문에서 >>텍스트<< 강조 문구 감지 (에디토리얼 아닐 때도 적용)
  const heroLineIdx = lines.findIndex((l: string) => /^>>.*<<$/.test(l.trim()))

  return (
    <div className="bk-page flex items-center" style={{ background: bookColors.pageBg, position: 'relative', overflow: 'hidden' }}>
      {/* 에디토리얼: 배경 챕터 넘버 */}
      {ed && (
        <div style={{
          position: 'absolute',
          top: textAlign === 'right' ? '60px' : '80px',
          [textAlign === 'right' ? 'left' : 'right']: '-10px',
          fontFamily: "'Playfair Display', serif",
          fontSize: '180px', fontWeight: 300, lineHeight: 1,
          color: bookColors.accent, opacity: 0.06,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {chapterNum}
        </div>
      )}

      <div className="w-full px-10 py-16 max-w-md mx-auto" style={{ textAlign: ed ? textAlign : 'left' }}>
        {/* 챕터 번호 */}
        <BA d={0} type="fade" className="mb-2">
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: ed ? '11px' : '10px', letterSpacing: '4px', color: bookColors.muted }}>
            {ed ? chapterNum : `CHAPTER ${chapterNum}`}
          </span>
        </BA>

        {/* 챕터 제목 */}
        <BA d={150}>
          <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: ed ? '22px' : '20px', fontWeight: 600, color: bookColors.heading, lineHeight: 1.5, marginBottom: '6px' }}>
            {chapter.title}
          </h2>
        </BA>

        {/* 영문 부제 */}
        {chapter.subtitle && (
          <BA d={250} type="fade">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', fontStyle: 'italic', color: bookColors.muted, letterSpacing: '2px', marginBottom: '20px' }}>
              {chapter.subtitle}
            </div>
          </BA>
        )}

        <BA d={350}><BLine width={ed ? '32px' : '24px'} color={bookColors.accent} d={0} center={ed && textAlign === 'center'} /></BA>
        <div style={{ marginBottom: '24px' }} />

        {/* 본문 */}
        <div className={`theme-${colorTheme || 'essay-ivory'}`} style={{ textAlign: 'left' }}>
          {lines.map((line: string, j: number) => {
            const isDropCap = j === firstTextIdx && line.trim().length > 0

            // >>텍스트<< 강조 문구 (큰 이탤릭)
            if (j === heroLineIdx) {
              const heroText = line.trim().replace(/^>>/, '').replace(/<<$/, '')
              return (
                <BA key={j} d={450 + j * 60}>
                  <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '22px', fontWeight: 400, fontStyle: 'italic',
                    lineHeight: 1.8, color: bookColors.heading,
                    margin: '20px 0', textAlign: 'center',
                    padding: '0 4px',
                  }}>{heroText}</p>
                </BA>
              )
            }

            if (isDropCap) {
              const trimmedLine = line.trim()
              // 첫 글자가 마크업 기호(==, ~~, **, >>)이면 드롭캡 건너뛰기
              if (/^(==|~~|\*\*|>>)/.test(trimmedLine)) {
                const hasMarkup = /==|~~|\*\*/.test(line)
                return (
                  <BA key={j} d={450 + j * 60}>
                    {hasMarkup ? (
                      <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(line) }} />
                    ) : (
                      <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }}>{line || '\u00A0'}</p>
                    )}
                  </BA>
                )
              }
              const firstChar = trimmedLine[0]
              const rest = trimmedLine.slice(1)
              const hasMarkup = /==|~~|\*\*/.test(rest)
              return (
                <BA key={j} d={450 + j * 60}>
                  <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }}>
                    <span style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: ed ? '64px' : '48px', fontWeight: 300, lineHeight: 0.8,
                      float: 'left', marginRight: ed ? '10px' : '8px', marginTop: ed ? '8px' : '6px',
                      color: bookColors.accent,
                    }}>{firstChar}</span>
                    {hasMarkup ? <span dangerouslySetInnerHTML={{ __html: parseHighlight(rest) }} /> : rest}
                  </p>
                </BA>
              )
            }
            const hasMarkup = /==|~~|\*\*/.test(line)
            return (
              <BA key={j} d={450 + j * 60}>
                {hasMarkup ? (
                  <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(line) }} />
                ) : (
                  <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }}>{line || '\u00A0'}</p>
                )}
              </BA>
            )
          })}
        </div>

        {/* 하단 장식 */}
        <div className="mt-12" style={{ textAlign: ed ? textAlign : 'center' }}>
          <BLine width="16px" color={bookColors.divider} d={800} center={!ed || textAlign === 'center'} />
        </div>
      </div>
    </div>
  )
}

// -- Book: Interview (Q&A) --
function BookInterview({ qa, index, ed = false, colorTheme }: { qa: any; index: number; ed?: boolean; colorTheme?: string }) {
  const bookColors = getBookColors(colorTheme)
  const answerLines = (qa.answer || '').split('\n')
  const qNum = String(index + 1).padStart(2, '0')

  return (
    <div className="bk-page flex items-center" style={{ background: bookColors.pageBg, position: 'relative', overflow: 'hidden' }}>
      {/* 에디토리얼: 배경 Q 넘버 */}
      {ed && (
        <div style={{
          position: 'absolute', top: '50px', right: '-20px',
          fontFamily: "'Playfair Display', serif",
          fontSize: '200px', fontWeight: 300, lineHeight: 1,
          color: bookColors.accent, opacity: 0.04,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          Q
        </div>
      )}

      <div className="w-full px-10 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="mb-8">
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: ed ? '11px' : '10px', letterSpacing: '4px', color: bookColors.muted }}>
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
          {answerLines.map((line: string, j: number) => {
            const hasMarkup = /==|~~|\*\*/.test(line)
            return (
              <BA key={j} d={500 + j * 70}>
                {hasMarkup ? (
                  <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(line) }} />
                ) : (
                  <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookColors.text }}>{line || '\u00A0'}</p>
                )}
              </BA>
            )
          })}
        </div>

        {qa.answerer && qa.answerer !== 'both' && (
          <BA d={700} type="fade">
            <div className="mt-8 text-right">
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', fontStyle: 'italic', color: bookColors.muted }}>
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
  const bookColors = getBookColors(data.colorTheme)
  const quote = data.quote
  if (!quote?.text) return null
  const quoteLines = quote.text.split('\n')

  // 에디토리얼: 다크 반전 배경
  const darkBg = '#2C2820'
  const darkText = '#F5F0E8'
  const darkMuted = '#A09882'
  const darkDivider = '#5C5444'

  const bg = ed ? darkBg : bookColors.bg
  const textColor = ed ? darkText : bookColors.heading
  const mutedColor = ed ? darkMuted : bookColors.muted
  const quoteMarkColor = ed ? darkDivider : bookColors.divider

  return (
    <div className="bk-page flex items-center" style={{ background: bg, transition: 'background 0.4s ease' }}>
      <div className="w-full px-10 py-16 max-w-md mx-auto text-center">
        <BA d={0} type="scale">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: ed ? '96px' : '72px', color: quoteMarkColor, lineHeight: 0.5, marginBottom: ed ? '36px' : '28px' }}>&ldquo;</div>
        </BA>
        {quoteLines.map((line: string, i: number) => (
          <BA key={i} d={300 + i * 120}>
            <p className={ed ? 'es-f20' : 'es-f18'} style={{ fontFamily: "'Playfair Display', serif", fontSize: ed ? '20px' : '18px', fontWeight: ed ? 300 : 400, fontStyle: 'italic', lineHeight: 2.4, color: textColor, letterSpacing: ed ? '0.5px' : '0' }}>{line || '\u00A0'}</p>
          </BA>
        ))}
        {quote.author && (
          <BA d={500 + quoteLines.length * 120} type="fade">
            <div className="mt-10" style={{ fontSize: '11px', color: mutedColor, letterSpacing: '3px' }}>— {quote.author}</div>
          </BA>
        )}
      </div>
    </div>
  )
}

// -- Book: Wedding Date (그 날) --
// -- Book: Info Intro (STORY→INFO 전환 페이지) --
function BookInfoIntro({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  const weddingDate = data.wedding?.date ? new Date(data.wedding.date) : new Date()
  const dateStr = `${weddingDate.getFullYear()}. ${String(weddingDate.getMonth() + 1).padStart(2, '0')}. ${String(weddingDate.getDate()).padStart(2, '0')}`
  const venueName = data.wedding?.venue?.name || ''
  return (
    <div className="bk-page flex items-center justify-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-12 py-16 max-w-md mx-auto text-center">
        <BA d={0}><BLine width="40px" color={bookInfoColors.divider} d={0} center /></BA>
        <BA d={200} type="fade"><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '11px', letterSpacing: '4px', color: bookInfoColors.muted, marginBottom: '24px', marginTop: '32px' }}>INFORMATION</p></BA>
        <BA d={400}><p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '22px', fontWeight: 300, color: bookInfoColors.heading, lineHeight: 1.8 }}>예식 안내</p></BA>
        <BA d={600} type="scale"><div style={{ width: '1px', height: '40px', background: bookInfoColors.divider, margin: '24px auto' }} /></BA>
        <BA d={800} type="fade"><p style={{ fontSize: '14px', color: bookInfoColors.text, letterSpacing: '1px', lineHeight: 2 }}>{dateStr}</p></BA>
        {venueName && <BA d={900} type="fade"><p style={{ fontSize: '13px', color: bookInfoColors.muted, marginTop: '4px' }}>{venueName}</p></BA>}
        <BA d={1000}><BLine width="40px" color={bookInfoColors.divider} d={0} center /></BA>
      </div>
    </div>
  )
}

function BookWeddingDate({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
  const w = data.wedding || {}; const groom = data.groom || {}; const bride = data.bride || {}
  const weddingDate = w.date ? new Date(w.date) : new Date()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  // 에세이: 이 날을 고른 이유
  const dateEssay = data.wedding?.dateEssay || `${weddingDate.getFullYear()}년 ${weddingDate.getMonth() + 1}월,\n우리가 처음 만났던 계절이\n다시 돌아오는 날.\n\n그때의 설렘을 다시 한번,\n이번에는 영원히 간직하고 싶어\n이 날을 골랐습니다.`

  const essayLines = dateEssay.split('\n')
  return (
    <div className="bk-page flex items-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-8 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="mb-2">
          <span style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '10px', letterSpacing: '4px', color: bookInfoColors.muted }}>예식 일시</span>
        </BA>
        <BA d={150}>
          <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '20px', fontWeight: 600, color: bookInfoColors.heading, marginBottom: '6px' }}>
            {data.wedding?.dateEssayTitle || '저희 결혼합니다.'}
          </h2>
        </BA>
        <BA d={350}><BLine width="24px" color={bookInfoColors.accent} d={0} /></BA>
        <div style={{ marginBottom: '24px' }} />

        {/* 날짜 카드 */}
        <BA d={500} type="scale">
          <div className="my-8 py-6 px-6" style={{ background: bookInfoColors.cardBg, border: `0.5px solid ${bookInfoColors.divider}` }}>
            <div className="text-center">
              <div className="es-f16" style={{ fontSize: '16px', fontWeight: 400, color: bookInfoColors.heading, lineHeight: 1 }}>{weddingDate.getFullYear()}년 {weddingDate.getMonth() + 1}월 {weddingDate.getDate()}일</div>
              <div className="es-f13 mt-3" style={{ fontSize: '13px', color: bookInfoColors.muted }}>
                {dayNames[weddingDate.getDay()]}요일 {w.timeDisplay || ''}
              </div>
              {(() => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const target = new Date(weddingDate)
                target.setHours(0, 0, 0, 0)
                const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                if (diff > 0) return <div className="mt-4 pt-3" style={{ borderTop: `0.5px solid ${bookInfoColors.divider}`, fontSize: '12px', color: bookInfoColors.accent }}>D-{diff}</div>
                if (diff === 0) return <div className="mt-4 pt-3" style={{ borderTop: `0.5px solid ${bookInfoColors.divider}`, fontSize: '12px', color: bookInfoColors.accent }}>D-DAY</div>
                return null
              })()}
            </div>
          </div>
        </BA>

        {/* 에세이 */}
        <div className="mt-6">
          {essayLines.map((line: string, i: number) => (
            <BA key={i} d={700 + i * 60}>
              <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookInfoColors.text }}>{line || '\u00A0'}</p>
            </BA>
          ))}
        </div>

        {/* 양가 */}
      </div>
    </div>
  )
}

// -- Book: Wedding Venue (예식 장소) --
function BookWeddingVenue({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
  const w = data.wedding || {}

  // 에세이: 이 장소를 고른 이유
  const venueEssay = data.wedding?.venueEssay || `높은 천장 아래로\n따뜻한 빛이 쏟아지던 곳.\n\n처음 이곳에 왔을 때,\n\"여기서 우리 결혼식을 하자\"\n동시에 같은 말을 했습니다.\n\n그 마음 그대로,\n이곳에서 여러분을 기다리겠습니다.`

  const essayLines = venueEssay.split('\n')
  return (
    <div className="bk-page flex items-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-8 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="mb-2">
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookInfoColors.muted }}>THE PLACE</span>
        </BA>
        <BA d={150}>
          <h2 style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '20px', fontWeight: 600, color: bookInfoColors.heading, marginBottom: '6px' }}>{data.wedding?.venueEssayTitle || '초대합니다'}</h2>
        </BA>
        <BA d={350}><BLine width="24px" color={bookInfoColors.accent} d={0} /></BA>
        <div style={{ marginBottom: '24px' }} />

        {/* 장소 정보 카드 */}
        <BA d={500} type="scale">
          <div className="my-8 py-6 px-6" style={{ background: bookInfoColors.cardBg, border: `0.5px solid ${bookInfoColors.divider}` }}>
            <div className="text-center">
              <div className="es-f17" style={{ fontSize: '17px', fontWeight: 600, color: bookInfoColors.heading }}>{w.venue?.name || ''}</div>
              {w.venue?.hall && !w.venue?.hideHall && <div className="es-f13" style={{ fontSize: '13px', color: bookInfoColors.text, marginTop: '4px' }}>{w.venue.hall}</div>}
              <div className="es-f12" style={{ fontSize: '12px', color: bookInfoColors.muted, marginTop: '6px' }}>{w.venue?.address || ''}</div>
            </div>
          </div>
        </BA>

        {/* 에세이 */}
        <div className="mt-6">
          {essayLines.map((line: string, i: number) => (
            <BA key={i} d={700 + i * 60}>
              <p className="es-f15" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', lineHeight: 2.2, color: bookInfoColors.text }}>{line || '\u00A0'}</p>
            </BA>
          ))}
        </div>

        {/* 지도 링크 */}
        {w.venue?.address && (
          <BA d={1000} type="fade">
            <div className="mt-10 grid grid-cols-3 gap-2">
              {[
                { href: `https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}`, label: 'NAVER' },
                { href: `https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}`, label: 'KAKAO' },
                { href: `tmap://search?name=${encodeURIComponent(w.venue.name || '')}`, label: 'TMAP' },
              ].map(m => (
                <a key={m.label} href={m.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center justify-center py-2" style={{ border: `0.5px solid ${bookInfoColors.divider}`, fontSize: '10px', letterSpacing: '1px', color: bookInfoColors.muted }}>
                  {m.label}
                </a>
              ))}
            </div>
          </BA>
        )}

        {/* 오시는 길 */}
        {w.directions && (w.directions.car || w.directions.publicTransport || w.directions.train || w.directions.expressBus) && (
          <BA d={1100} type="fade">
            <div className="mt-6 space-y-3">
              {[{ key: 'car', label: '자가용' }, { key: 'publicTransport', label: '대중교통' }, { key: 'train', label: '기차 (KTX/SRT)' }, { key: 'expressBus', label: '고속버스' }].map(d => w.directions[d.key] && (
                <div key={d.key} style={{ padding: '10px 14px', borderLeft: `2px solid ${bookInfoColors.accent}`, background: bookInfoColors.bg }}>
                  <div className="es-f11" style={{ fontSize: '11px', fontWeight: 600, color: bookInfoColors.accent, marginBottom: '4px' }}>{d.label}</div>
                  {w.directions[d.key].split('\n').map((line: string, i: number) => <p key={i} className="es-f12" style={{ fontSize: '12px', lineHeight: 1.7, color: bookInfoColors.muted }}>{line}</p>)}
                </div>
              ))}
            </div>
          </BA>
        )}

        {/* 추가 안내사항 */}
        {w.directions?.extraInfoEnabled && w.directions.extraInfoText && (
          <BA d={1200} type="fade">
            <div className="mt-5" style={{ padding: '12px 14px', background: bookInfoColors.bg, borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: bookInfoColors.accent, marginBottom: '6px' }}>
                {w.directions.extraInfoTitle || '추가 안내사항'}
              </div>
              {w.directions.extraInfoText.split('\n').map((line: string, i: number) => (
                <p key={i} className="es-f12" style={{ fontSize: '12px', lineHeight: 1.7, color: bookInfoColors.muted }}>{line}</p>
              ))}
            </div>
          </BA>
        )}
      </div>
    </div>
  )
}

// -- Book: Guidance (행복한 시간을 위한 안내) --
function BookGuidance({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
  const info = data.info || {}
  const defaultItemOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
  const itemOrder = info.itemOrder || defaultItemOrder
  const enabledItems = [
    ...itemOrder.filter((key: string) => info[key]?.enabled && info[key]?.content),
    ...(info.customItems || []).filter((item: any) => item.enabled && item.content).map((_: any, i: number) => `custom-${i}`),
  ]
  if (enabledItems.length === 0) return null

  return (
    <div className="bk-page flex items-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-8 py-16 max-w-md mx-auto">
        {/* 타이틀 */}
        <div className="text-center mb-10">
          <BA d={0} type="fade"><div style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '4px', color: bookInfoColors.muted }}>INFORMATION</div></BA>
          <BA d={150}><BLine width="20px" color={bookInfoColors.accent} d={0} center /></BA>
          <BA d={300}><p className="mt-4" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '15px', fontWeight: 500, color: bookInfoColors.heading }}>행복한 시간을 위한 안내</p></BA>
        </div>

        {/* 안내 항목 리스트 */}
        <div className="space-y-4">
          {enabledItems.map((key: string, i: number) => {
            const isCustom = key.startsWith('custom-')
            const item = isCustom ? info.customItems[parseInt(key.split('-')[1])] : info[key]
            if (!item?.enabled || !item?.content) return null
            return (
              <BA key={i} d={450 + i * 120}>
                <div style={{
                  background: bookInfoColors.cardBg,
                  border: `1px solid ${bookInfoColors.divider}`,
                  padding: '16px 18px',
                }}>
                  {/* 항목 제목 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{ width: '3px', height: '14px', background: bookInfoColors.accent, opacity: 0.6 }} />
                    <span className="es-f13" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', fontWeight: 600, color: bookInfoColors.heading, letterSpacing: '0.3px' }}>
                      {item.title}
                    </span>
                  </div>
                  {/* 항목 내용 */}
                  <div style={{ paddingLeft: '11px' }}>
                    {item.content.split('\n').map((line: string, j: number) => (
                      <p key={j} className="es-f13" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '12.5px', lineHeight: 1.9, color: bookInfoColors.text, opacity: 0.85 }}>
                        {line || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </div>
              </BA>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// -- Book: Contacts --
function BookContacts({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
  const groom = data.groom || {}; const bride = data.bride || {}
  const contactsEssay = data.content?.contactsEssay || `축하의 마음을 전하고 싶으시다면,\n편하게 연락해 주세요.\n\n한 통의 전화, 짧은 문자 하나에도\n저희는 크게 웃을 수 있답니다.`
  const contacts = [
    groom.phoneEnabled !== false && groom.phone && { label: `신랑 ${groom.name || ''}`, phone: groom.phone },
    groom.father?.phoneEnabled && groom.father?.phone && { label: `신랑측 아버지 ${groom.father.name || ''}`, phone: groom.father.phone },
    groom.mother?.phoneEnabled && groom.mother?.phone && { label: `신랑측 어머니 ${groom.mother.name || ''}`, phone: groom.mother.phone },
    bride.phoneEnabled !== false && bride.phone && { label: `신부 ${bride.name || ''}`, phone: bride.phone },
    bride.father?.phoneEnabled && bride.father?.phone && { label: `신부측 아버지 ${bride.father.name || ''}`, phone: bride.father.phone },
    bride.mother?.phoneEnabled && bride.mother?.phone && { label: `신부측 어머니 ${bride.mother.name || ''}`, phone: bride.mother.phone },
  ].filter(Boolean)

  return (
    <div className="bk-page flex items-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-8 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="text-center mb-6">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookInfoColors.muted }}>CONTACT</div>
          <div className="mt-3"><BLine width="20px" color={bookInfoColors.accent} d={200} center /></div>
        </BA>
        <BA d={300} className="text-center mb-8">
          {contactsEssay.split('\n').map((line: string, i: number) => (
            <p key={i} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 2, color: bookInfoColors.text, opacity: 0.85 }}>{line || '\u00A0'}</p>
          ))}
        </BA>
        {contacts.length > 0 ? (
        <>
        {/* 연락처 카드 */}
        <BA d={600} type="fade">
        <div style={{ background: bookInfoColors.cardBg, border: `0.5px solid ${bookInfoColors.divider}`, padding: '4px 16px' }}>
          {contacts.map((c: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < contacts.length - 1 ? `0.5px solid ${bookInfoColors.divider}` : 'none' }}>
              <span style={{ fontSize: '13px', color: bookInfoColors.text }}>{c.label}</span>
              <div className="flex items-center gap-2">
                <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="flex items-center justify-center w-8 h-8 rounded-full" style={{ border: `0.5px solid ${bookInfoColors.accent}` }}>
                  <svg className="w-4 h-4" fill="none" stroke={bookInfoColors.accent} viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                </a>
                <a href={`sms:${c.phone}`} onClick={e => e.stopPropagation()} className="flex items-center justify-center w-8 h-8 rounded-full" style={{ border: `0.5px solid ${bookInfoColors.accent}` }}>
                  <svg className="w-4 h-4" fill="none" stroke={bookInfoColors.accent} viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                </a>
              </div>
            </div>
          ))}
        </div>
        </BA>
        </>
        ) : (
          <BA d={600} type="fade">
            <p className="text-center" style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: bookInfoColors.muted }}>연락처 정보가 등록되면 이곳에 표시됩니다.</p>
          </BA>
        )}
      </div>
    </div>
  )
}

// -- Book: Bank --
function BookBank({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
  const groom = data.groom || {}; const bride = data.bride || {}
  const groomName = groom.name || '신랑'; const brideName = bride.name || '신부'
  const bankEssay = data.content?.bankEssay || `직접 오시지 못하더라도\n마음만으로 충분히 감사합니다.\n\n혹 축하의 마음을 전하고 싶으시다면,\n아래를 통해 보내주실 수 있습니다.`
  const [expandedSide, setExpandedSide] = useState<'groom' | 'bride' | null>(null)
  const hasAccounts = [groom.bank?.enabled, groom.father?.bank?.enabled, groom.mother?.bank?.enabled, bride.bank?.enabled, bride.father?.bank?.enabled, bride.mother?.bank?.enabled].some(Boolean)

  const renderAccounts = (side: 'groom' | 'bride') => {
    const person = side === 'groom' ? groom : bride
    const accs = [person.bank?.enabled && { name: person.name, ...person.bank, role: side === 'groom' ? '신랑' : '신부' }, person.father?.bank?.enabled && { name: person.father.name, ...person.father.bank, role: '아버지' }, person.mother?.bank?.enabled && { name: person.mother.name, ...person.mother.bank, role: '어머니' }].filter(Boolean)
    return (
      <div style={{ background: bookInfoColors.cardBg, border: `0.5px solid ${bookInfoColors.divider}`, padding: '4px 16px' }}>
        {accs.map((acc: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < accs.length - 1 ? `0.5px solid ${bookInfoColors.divider}` : 'none' }}>
            <div>
              <span style={{ fontSize: '11px', color: bookInfoColors.muted }}>{acc.role}</span>
              <span style={{ fontSize: '12px', color: bookInfoColors.text, marginLeft: '8px' }}>{acc.bank} {acc.account}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(acc.account); alert('복사되었습니다.') }} style={{ fontSize: '10px', letterSpacing: '1px', color: bookInfoColors.accent, background: 'none', border: `0.5px solid ${bookInfoColors.accent}`, padding: '4px 10px', cursor: 'pointer' }}>COPY</button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bk-page flex items-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-8 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="text-center mb-6">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookInfoColors.muted }}>GIFT</div>
          <div className="mt-3"><BLine width="20px" color={bookInfoColors.accent} d={200} center /></div>
        </BA>
        {/* Essay */}
        <BA d={300} className="text-center mb-8">
          {bankEssay.split('\n').map((line: string, i: number) => (
            <p key={i} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 2, color: bookInfoColors.text, opacity: 0.85 }}>{line || '\u00A0'}</p>
          ))}
        </BA>
        {hasAccounts ? (
          <>
            <BA d={600} className="grid grid-cols-2 gap-3 mb-6">
              {(['groom', 'bride'] as const).map(side => (
                <button key={side} onClick={(e) => { e.stopPropagation(); setExpandedSide(expandedSide === side ? null : side) }} style={{
                  fontFamily: "'Playfair Display', serif", fontSize: '11px', letterSpacing: '2px', padding: '12px',
                  border: `0.5px solid ${expandedSide === side ? bookInfoColors.accent : bookInfoColors.divider}`,
                  background: expandedSide === side ? bookInfoColors.accent : 'transparent',
                  color: expandedSide === side ? '#FFF' : bookInfoColors.text, cursor: 'pointer', transition: 'all 0.3s',
                }}>{side.toUpperCase()}</button>
              ))}
            </BA>
            {expandedSide && renderAccounts(expandedSide)}
          </>
        ) : (
          <BA d={600} className="text-center">
            <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', color: bookInfoColors.muted }}>계좌 정보가 등록되면 이곳에 표시됩니다.</p>
          </BA>
        )}
      </div>
    </div>
  )
}

// -- Book: Thank You --
function BookThankYou({ data }: { data: any }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
  const ty = data.thankYou
  const groomName = data.groom?.name || '신랑'; const brideName = data.bride?.name || '신부'
  const thankYouEssay = data.content?.thankYouEssay || `이 긴 이야기를 끝까지 읽어주셔서\n진심으로 감사합니다.\n\n여러분 한 분 한 분의 축복이\n저희의 새 출발에 큰 힘이 됩니다.\n\n앞으로도 함께 웃고, 함께 걸어가는\n${groomName}과 ${brideName}이 되겠습니다.`
  const message = ty?.message || ''
  if (!message && !thankYouEssay) return null
  return (
    <div className="bk-page flex items-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-8 py-16 max-w-md mx-auto text-center">
        <BA d={0} type="fade"><div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookInfoColors.muted, marginBottom: '24px' }}>EPILOGUE</div></BA>
        <BA d={200}><BLine width="20px" color={bookInfoColors.accent} d={0} center /></BA>
        <div style={{ marginBottom: '24px' }} />
        {/* Essay */}
        <div className="mb-8">
          {thankYouEssay.split('\n').map((line: string, i: number) => (
            <BA key={i} d={400 + i * 80}>
              <p style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 2, color: bookInfoColors.text, opacity: 0.85 }}>{line || '\u00A0'}</p>
            </BA>
          ))}
        </div>
        {ty?.sign && <BA d={800} type="fade"><div className="mt-8" style={{ fontSize: '13px', color: bookInfoColors.muted }}>{ty.sign}</div></BA>}
      </div>
    </div>
  )
}

// -- Book: Guestbook --
function BookGuestbook({ data, invitationId, isSample }: { data: any; invitationId: string; isSample?: boolean }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
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
    <div className="bk-page flex items-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-8 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="text-center mb-6">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookInfoColors.muted }}>GUEST NOTE</div>
          <div className="mt-3"><BLine width="20px" color={bookInfoColors.accent} d={200} center /></div>
        </BA>
        {/* Essay */}
        <BA d={300} className="text-center mb-8">
          {guestbookEssay.split('\n').map((line: string, i: number) => (
            <p key={i} style={{ fontFamily: "'Pretendard', sans-serif", fontSize: '13px', lineHeight: 2, color: bookInfoColors.text, opacity: 0.85 }}>{line || '\u00A0'}</p>
          ))}
        </BA>
        <BA d={600} className="space-y-3 mb-6">
          <input value={name} onChange={e => setName(e.target.value)} onClick={e => e.stopPropagation()} placeholder="이름" maxLength={20} className="w-full px-4 py-3 text-sm outline-none" style={{ border: `0.5px solid ${bookInfoColors.divider}`, background: bookInfoColors.cardBg, color: bookInfoColors.text }} />
          <textarea value={message} onChange={e => setMessage(e.target.value)} onClick={e => e.stopPropagation()} placeholder="축하 메시지를 남겨주세요" rows={3} maxLength={500} className="w-full px-4 py-3 text-sm outline-none resize-none" style={{ border: `0.5px solid ${bookInfoColors.divider}`, background: bookInfoColors.cardBg, color: bookInfoColors.text }} />
          <button onClick={(e) => { e.stopPropagation(); handleSubmit() }} disabled={submitting || !name.trim() || !message.trim()} className="w-full py-3 text-sm disabled:opacity-50" style={{ background: bookInfoColors.accent, color: '#FFF', border: 'none', cursor: 'pointer' }}>{submitting ? '등록 중...' : '메시지 남기기'}</button>
        </BA>
        {/* 메시지 카드 */}
        {messages.length > 0 && (
          <div style={{ background: bookInfoColors.cardBg, border: `0.5px solid ${bookInfoColors.divider}`, padding: '4px 16px' }}>
            {messages.slice(0, 3).map((m: any, i: number) => (
              <div key={m.id} className="py-3" style={{ borderBottom: i < Math.min(messages.length, 3) - 1 ? `0.5px solid ${bookInfoColors.divider}` : 'none' }}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: bookInfoColors.heading }}>{m.guest_name}</span>
                  <span style={{ fontSize: '10px', color: bookInfoColors.muted }}>{new Date(m.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.7, color: bookInfoColors.text }}>{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// -- Book: RSVP --
function BookRsvp({ data, invitationId }: { data: any; invitationId: string }) {
  const bookInfoColors = getBookInfoColors(data.colorTheme)
  return (
    <div className="bk-page flex items-center" style={{ background: bookInfoColors.pageBg }}>
      <div className="w-full px-8 py-16 max-w-md mx-auto">
        <BA d={0} type="fade" className="text-center mb-8">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookInfoColors.muted }}>RSVP</div>
          <div className="mt-3"><BLine width="20px" color={bookInfoColors.accent} d={200} center /></div>
          {data.rsvpDeadline && <p className="mt-4" style={{ fontSize: '12px', color: bookInfoColors.muted }}>{new Date(data.rsvpDeadline).toLocaleDateString('ko-KR')}까지 알려주세요</p>}
        </BA>
        <BA d={400}>
          <div onClick={e => e.stopPropagation()}>
            <RsvpForm invitationId={invitationId} primaryColor={bookInfoColors.accent} />
          </div>
        </BA>
      </div>
    </div>
  )
}

// -- Book: End --
function BookEnd({ data, onRestart, onShowBonus, showBonus }: { data: any; onRestart: () => void; onShowBonus?: () => void; showBonus?: boolean }) {
  const bookColors = getBookColors(data.colorTheme)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  return (
    <div className="bk-page flex flex-col items-center justify-center" style={{ background: bookColors.bg }}>
      <div className="text-center">
        <BA d={0} type="fade"><div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '6px', color: bookColors.muted, marginBottom: '24px' }}>THE END</div></BA>
        <BA d={300}><BLine width="32px" color={bookColors.accent} d={0} center /></BA>
        <div style={{ marginBottom: '24px' }} />
        <BA d={500}><p style={{ fontSize: '14px', color: bookColors.text, lineHeight: 2 }}>이 이야기를 함께 읽어주셔서<br />감사합니다.</p></BA>
        <BA d={700} type="fade"><p className="mt-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', fontStyle: 'italic', color: bookColors.muted }}>
          {groomName} & {brideName}
        </p></BA>
        <BA d={900} type="scale"><div className="flex flex-col items-center gap-3 mt-8">
          <button onClick={(e) => { e.stopPropagation(); onRestart() }} style={{
            background: 'none', border: `1px solid ${bookColors.divider}`, padding: '10px 24px',
            cursor: 'pointer', fontFamily: "'Playfair Display', serif", fontSize: '10px',
            letterSpacing: '3px', color: bookColors.muted, width: '200px',
          }}>
            READ AGAIN
          </button>
          {!showBonus && onShowBonus && (
            <button onClick={(e) => { e.stopPropagation(); onShowBonus() }} style={{
              background: bookColors.accent, border: 'none', padding: '12px 24px',
              cursor: 'pointer', fontFamily: "'Pretendard', sans-serif", fontSize: '13px',
              color: '#FFF', width: '200px', letterSpacing: '0.5px',
            }}>
              더 많은 이야기 보러가기 →
            </button>
          )}
        </div></BA>
      </div>
      <BA d={1100} type="fade"><div className="mt-16">
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '3px', color: bookColors.muted }}>DEAR DRAWER</p>
      </div></BA>
    </div>
  )
}

// -- Book: Bonus Intro --
function BookBonusIntro({ data }: { data: any }) {
  const bookColors = getBookColors(data.colorTheme)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  return (
    <div className="bk-page flex items-center justify-center" style={{ background: bookColors.pageBg }}>
      <div className="w-full px-12 py-16 max-w-md mx-auto text-center">
        <div className="mb-8">
          <BA d={0} type="fade"><div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '4px', color: bookColors.muted }}>BONUS CHAPTER</div></BA>
          <BA d={200}><BLine width="20px" color={bookColors.accent} d={0} center /></BA>
        </div>
        <div className="mb-8">
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
function BookBonusInterview({ interview, index, total, colorTheme }: { interview: any; index: number; total: number; colorTheme?: string }) {
  const bookColors = getBookColors(colorTheme)
  const answer = interview.answer || ''
  return (
    <div className="bk-page flex items-center" style={{ background: bookColors.pageBg }}>
      <div className="w-full px-10 py-16 max-w-md mx-auto">
        <div className="text-center mb-8">
          <BA d={0} type="fade"><div style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '3px', color: bookColors.muted }}>Q{index + 1} OF {total}</div></BA>
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
  const bookColors = getBookColors(data.colorTheme)
  const groomName = data.groom?.name || '신랑'
  const brideName = data.bride?.name || '신부'
  return (
    <div className="bk-page flex flex-col items-center justify-center" style={{ background: bookColors.bg }}>
      <div className="text-center">
        <BA d={0} type="fade"><div style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', letterSpacing: '6px', color: bookColors.muted, marginBottom: '24px' }}>FIN</div></BA>
        <BA d={200}><BLine width="32px" color={bookColors.accent} d={0} center /></BA>
        <BA d={400}><p style={{ fontSize: '14px', color: bookColors.text, lineHeight: 2 }}>저희의 이야기에<br />귀 기울여 주셔서 감사합니다.</p></BA>
        <BA d={550}><p className="mt-2" style={{ fontSize: '13px', color: bookColors.text, lineHeight: 2, opacity: 0.7 }}>여러분의 축복이 가장 큰 선물입니다.</p></BA>
        <BA d={700} type="fade"><p className="mt-4" style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', fontStyle: 'italic', color: bookColors.muted }}>
          {groomName} & {brideName}
        </p></BA>
        <BA d={900} type="scale"><button onClick={(e) => { e.stopPropagation(); onRestart() }} className="mt-8" style={{
          background: 'none', border: `1px solid ${bookColors.divider}`, padding: '10px 24px',
          cursor: 'pointer', fontFamily: "'Playfair Display', serif", fontSize: '10px',
          letterSpacing: '3px', color: bookColors.muted, width: '200px',
        }}>
          READ AGAIN
        </button></BA>
      </div>
      <BA d={1100} type="fade"><div className="mt-16">
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '3px', color: bookColors.muted }}>DEAR DRAWER</p>
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
    .essay-font-container [style*="Playfair Display"]:not(.essay-ampersand) { font-family: ${fonts.display} !important; }
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

  // 커스텀 하이라이트 색상 (CSS 변수로 컨테이너에 직접 설정)
  const customHighlightStyle = data.highlightColor ? { '--custom-highlight-color': data.highlightColor } as React.CSSProperties : {}

  const allCSS = [fontOverrideCSS, fontSizeCSS].filter(Boolean).join('\n')

  // Book concept - e-book reader style
  if (concept === 'book') {
    return (
      <>
        {allCSS && <style>{allCSS}</style>}
        {!isPaid && !isPreview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
          </div>
        )}
        <div className={`essay-font-container theme-${themeKey}`} style={customHighlightStyle}>
          <BookConcept data={data} invitationId={invitationId} isSample={isSample} skipIntro={isPreview} />
        </div>
        {hasBgm && <audio ref={audioRef} loop preload="auto"><source src={bgm.url} type="audio/mpeg" /></audio>}
        {hasBgm && <EssayMusicToggle audioRef={audioRef} theme={theme} />}
      </>
    )
  }

  // Paper concept - completely different layout
  if (concept === 'paper') {
    return (
      <>
        {allCSS && <style>{allCSS}</style>}
        {!isPaid && !isPreview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
          </div>
        )}
        <div className={`essay-font-container theme-${themeKey}`} style={customHighlightStyle}>
          <PaperConcept data={data} invitationId={invitationId} isSample={isSample} />
        </div>
        {hasBgm && <audio ref={audioRef} loop preload="auto"><source src={bgm.url} type="audio/mpeg" /></audio>}
        {hasBgm && <EssayMusicToggle audioRef={audioRef} theme={theme} />}
      </>
    )
  }

  // Default concept
  return (
    <>
      {allCSS && <style>{allCSS}</style>}
      {!isPaid && !isPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
        </div>
      )}
      <div className={`essay-font-container theme-${themeKey}`} style={{ backgroundColor: theme.background, minHeight: '100vh', ...customHighlightStyle }}>
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
        <WeddingInfoSection data={data} theme={theme} />
        {data.sectionVisibility?.contacts !== false && <ContactsSection data={data} theme={theme} />}
        {data.sectionVisibility?.bankAccounts !== false && <BankAccountsSection data={data} theme={theme} />}
        <ThankYouSection data={data} theme={theme} />
        {data.sectionVisibility?.guestbook !== false && <GuestbookSection data={data} invitationId={invitationId} theme={theme} isSample={isSample} />}
        {data.rsvpEnabled && data.sectionVisibility?.rsvp !== false && <RsvpSection data={data} invitationId={invitationId} theme={theme} />}
        <EssayFooter theme={theme} />
      </div>
      {hasBgm && <audio ref={audioRef} loop preload="auto"><source src={bgm.url} type="audio/mpeg" /></audio>}
      {hasBgm && <EssayMusicToggle audioRef={audioRef} theme={theme} />}
    </>
  )
}
