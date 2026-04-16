'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'
import IntroAnimation from '@/components/invitation/IntroAnimation'
import { IntroSettings, getDefaultIntroSettings } from '@/lib/introPresets'
import { getSectionPaddingStyle, isHidden, getFontSize, type StyleOverrides } from '@/lib/styleOverrides'

// ===== Types =====
type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string; highlight?: string; buttonText?: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#C41050', secondary: '#D4768A', accent: '#C41050', background: '#FFFFFF', sectionBg: '#FFF5F5', cardBg: '#FFFFFF', divider: '#E8A0B0', text: '#3d3d3d', gray: '#555555' },
  'modern-black': { primary: '#111111', secondary: '#555555', accent: '#111111', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#3d3d3d', gray: '#555555', highlight: '#888888' },
  'romantic-blush': { primary: '#A67A7A', secondary: '#8a7068', accent: '#8a7068', background: '#FFFFFF', sectionBg: '#FAF5F3', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#3d3d3d', gray: '#555555' },
  'nature-green': { primary: '#3A5A3A', secondary: '#6A7A62', accent: '#5A7A52', background: '#FFFFFF', sectionBg: '#F3F7F1', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3d3d3d', gray: '#555555', highlight: '#5A8A52' },
  'luxury-navy': { primary: '#0f2035', secondary: '#8A6A3A', accent: '#8A6A3A', background: '#FFFFFF', sectionBg: '#F3F5F8', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#3d3d3d', gray: '#555555', highlight: '#8A6A3A' },
  'sunset-coral': { primary: '#B85040', secondary: '#B88060', accent: '#B8683A', background: '#FFFFFF', sectionBg: '#FFF5EF', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#3d3d3d', gray: '#555555' },
}

type FontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury' | 'gulim' | 'adulthand' | 'neathand' | 'roundhand' | 'roundgothic' | 'suit' | 'myungjo'
interface FontConfig { display: string; displayKr: string; body: string; scale?: number; isScript?: boolean }

const fontStyles: Record<FontStyle, FontConfig> = {
  classic: { display: "'Cinzel', serif", displayKr: "'Ridibatang', serif", body: "'Ridibatang', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Pretendard', sans-serif", body: "'Pretendard', sans-serif" },
  romantic: { display: "'Montserrat', sans-serif", displayKr: "'Okticon', serif", body: "'Okticon', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'JeonnamEducationBarun', sans-serif", body: "'JeonnamEducationBarun', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'ELandChoice', serif", body: "'ELandChoice', serif" },
  gulim: { display: "'Montserrat', sans-serif", displayKr: "'JoseonGulim', serif", body: "'JoseonGulim', serif" },
  adulthand: { display: "'Montserrat', sans-serif", displayKr: "'GangwonEducationModuche', sans-serif", body: "'GangwonEducationModuche', sans-serif" },
  neathand: { display: "'Montserrat', sans-serif", displayKr: "'OmuDaye', sans-serif", body: "'OmuDaye', sans-serif" },
  roundhand: { display: "'Montserrat', sans-serif", displayKr: "'OngleipKonkon', sans-serif", body: "'OngleipKonkon', sans-serif" },
  roundgothic: { display: "'Montserrat', sans-serif", displayKr: "'NanumSquareRound', sans-serif", body: "'NanumSquareRound', sans-serif" },
  suit: { display: "'Montserrat', sans-serif", displayKr: "'Suit', sans-serif", body: "'Suit', sans-serif" },
  myungjo: { display: "'Montserrat', sans-serif", displayKr: "'ChosunIlboMyungjo', serif", body: "'ChosunIlboMyungjo', serif" },
}

interface GuestInfo {
  id: string
  name: string
  relation: string | null
  honorific: string
  customMessage: string | null
}

interface InvitationClientProps {
  invitation: Invitation
  content: InvitationContent | null
  isPaid: boolean
  isPreview?: boolean
  overrideColorTheme?: string
  overrideFontStyle?: string
  skipIntro?: boolean
  guestInfo?: GuestInfo | null
  isSample?: boolean
}

// ===== Helper: extract image URL =====
function extractImageUrl(img: unknown): string {
  if (!img) return ''
  if (typeof img === 'string') return img
  if (typeof img === 'object' && img !== null && 'url' in img) return (img as { url: string }).url || ''
  return ''
}

// ===== Scroll Animation Hook =====
function useScrollReveal(options?: { rootMargin?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const rootMargin = options?.rootMargin || '0px 0px -40% 0px'

  useEffect(() => {
    return () => { observerRef.current?.disconnect() }
  }, [])

  const ref = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } },
      { threshold: 0.05, rootMargin }
    )
    observer.observe(node)
    observerRef.current = observer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ref, isVisible }
}

// ===== Music Toggle =====
function MusicToggle({ audioRef, isVisible, shouldAutoPlay }: { audioRef: React.RefObject<HTMLAudioElement | null>; isVisible: boolean; shouldAutoPlay: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const hasAutoPlayed = useRef(false)

  useEffect(() => {
    if (shouldAutoPlay && !hasAutoPlayed.current && audioRef.current) {
      hasAutoPlayed.current = true
      const savedPreference = localStorage.getItem('musicEnabled')
      if (savedPreference === 'false') return
      setTimeout(() => {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {})
      }, 100)
    }
  }, [shouldAutoPlay, audioRef])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    return () => { audio.removeEventListener('play', handlePlay); audio.removeEventListener('pause', handlePause) }
  }, [audioRef])

  const toggle = () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => { setIsPlaying(true); localStorage.setItem('musicEnabled', 'true') }).catch(console.error)
    } else {
      audioRef.current.pause(); setIsPlaying(false); localStorage.setItem('musicEnabled', 'false')
    }
  }

  if (!isVisible) return null
  return (
    <button onClick={toggle} className="fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110" style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {isPlaying ? (
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
      ) : (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
      )}
    </button>
  )
}


// ===== Magazine Intro Keyframes =====
const magazineIntroStyles = `
  @keyframes mag-fadeIn { to { opacity: 1; } }
  @keyframes mag-fadeSlideDown { to { opacity: 1; transform: translateY(0); } }
  @keyframes mag-fadeSlideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mag-lineGrowDown { to { height: 50px; } }
  @keyframes mag-btnPulse { 0%, 100% { border-color: var(--mag-pulse-color, #ccc); } 50% { border-color: var(--mag-pulse-active, #999); box-shadow: 0 0 0 4px rgba(0,0,0,0.03); } }
  @keyframes mag-btnPulseWhite { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; text-shadow: 0 0 8px rgba(255,255,255,0.3); } }
  @keyframes mag-lineDrawRight { to { transform: scaleX(1); } }
  @keyframes mag-kenBurnsOut { 0% { transform: scale(1.15); } 100% { transform: scale(1.0); } }
  @keyframes mag-charReveal { to { opacity: 1; transform: translateY(0); } }
  @keyframes mag-spacingCondense { 0% { opacity: 0; letter-spacing: 12px; } 100% { opacity: 1; letter-spacing: 5px; } }
  @keyframes mag-maskRevealUp { to { transform: translateY(0); opacity: 1; } }
  @keyframes mag-editorialKenBurns { 0% { opacity: 0; transform: scale(1.12); } 30% { opacity: 1; } 100% { opacity: 1; transform: scale(1.0); } }
  @keyframes mag-slideInLeft { to { opacity: 1; transform: translateX(0); } }
  @keyframes mag-slideInRight { to { opacity: 1; transform: translateX(0); } }
  @keyframes mag-blurReveal { to { opacity: 1; filter: blur(0px); } }
`

// ===== Magazine Section Scroll Animation Keyframes =====
const magazineSectionStyles = `
  @keyframes mag-sectionFadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mag-dropCapScale { from { opacity: 0; transform: scale(1.5); } to { opacity: 1; transform: scale(1); } }
  @keyframes mag-lineReveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mag-slideFromLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes mag-slideFromRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes mag-nameBlurReveal { from { opacity: 0; filter: blur(8px); transform: translateY(8px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }
  @keyframes mag-cardRotateIn { from { opacity: 0; transform: rotate(-1deg) translateY(30px); } to { opacity: 1; transform: rotate(0) translateY(0); } }
  @keyframes mag-imgKenBurns { from { transform: scale(1.08); } to { transform: scale(1); } }
  @keyframes mag-photoScale { from { opacity: 0; transform: scale(0.7) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes mag-photoScaleAlt { from { opacity: 0; transform: scale(0.75) rotate(-2deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
  @keyframes mag-curtainOpen { from { opacity: 0; clip-path: inset(50% 0); } to { opacity: 1; clip-path: inset(0% 0); } }
  @keyframes mag-digitSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mag-expandIn { from { opacity: 0; transform: scaleY(0.8) translateY(10px); } to { opacity: 1; transform: scaleY(1) translateY(0); } }
  @keyframes mag-paperUnfold { from { opacity: 0; clip-path: inset(0 0 100% 0); transform: scaleY(0.95); } to { opacity: 1; clip-path: inset(0 0 0% 0); transform: scaleY(1); } }
  @keyframes mag-iconSpin { from { opacity: 0; transform: rotate(-90deg); } to { opacity: 1; transform: rotate(0deg); } }
  @keyframes mag-scaleBlurReveal { from { opacity: 0; transform: scale(0.92); filter: blur(6px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
  @keyframes mag-cardFlipIn { from { opacity: 0; transform: perspective(800px) rotateY(-15deg); } to { opacity: 1; transform: perspective(800px) rotateY(0); } }
  @keyframes mag-msgSlideOdd { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes mag-msgSlideEven { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes mag-envelopeOpen { from { opacity: 0; clip-path: inset(0 0 100% 0); } to { opacity: 1; clip-path: inset(0 0 0% 0); } }
  @keyframes mag-formFadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mag-borderDrawRight { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes mag-footerTextFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes mag-highlightDraw { from { background-size: 0% 40%; } to { background-size: 100% 40%; } }
  @keyframes mag-barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  @keyframes mag-typingCursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
`

// ===== Character Reveal Helper =====
function CharReveal({ text, baseDelay, style, loaded }: { text: string; baseDelay: number; style: React.CSSProperties; loaded: boolean }) {
  return (
    <span style={style}>
      {[...text].map((ch, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: 0,
            transform: 'translateY(12px)',
            ...(loaded ? { animation: `mag-charReveal 0.5s ease ${baseDelay + i * 0.08}s both` } : {}),
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  )
}

// ===== Counting Number Animation =====
function CountUp({ target, duration = 1500, delay = 0, started }: { target: number; duration?: number; delay?: number; started: boolean }) {
  const [value, setValue] = useState(0)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!started || hasRun.current) return
    hasRun.current = true
    const timer = setTimeout(() => {
      const start = performance.now()
      const step = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timer)
  }, [started, target, duration, delay])

  return <>{value}</>
}

// ===== Typewriter Animation =====
function Typewriter({ text, delay = 0, speed = 80, started, style }: { text: string; delay?: number; speed?: number; started: boolean; style?: React.CSSProperties }) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!started || hasRun.current) return
    hasRun.current = true
    const timer = setTimeout(() => {
      setShowCursor(true)
      let i = 0
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          setTimeout(() => setShowCursor(false), 600)
        }
      }, speed)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [started, text, delay, speed])

  return (
    <span style={style}>
      {displayed}
      {showCursor && <span style={{ animation: 'mag-typingCursor 0.6s step-end infinite', marginLeft: '1px' }}>|</span>}
    </span>
  )
}

// =====Magazine Cover Section =====
function MagazineCover({ invitation, fonts, themeColors, onEnter, isPreview }: {
  invitation: any; fonts: FontConfig; themeColors: ColorConfig; onEnter: () => void; isPreview?: boolean
}) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const [loaded, setLoaded] = useState(false)
  const coverImage = extractImageUrl(invitation.media?.coverImage) || '/images/our-cover.png'
  const introStyle = invitation.magazineIntroStyle || 'cover'

  // Reset animation when introStyle changes (for editor preview)
  useEffect(() => {
    setLoaded(false)
    const timer = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [introStyle])

  const weddingDate = invitation.wedding?.date ? new Date(invitation.wedding.date) : new Date()
  const year = weddingDate.getFullYear()
  const month = String(weddingDate.getMonth() + 1).padStart(2, '0')
  const day = String(weddingDate.getDate()).padStart(2, '0')
  const dateStr = `${year}.${month}.${day}`
  const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][weddingDate.getDay()]

  const groomName = invitation.groom?.name || ''
  const brideName = invitation.bride?.name || ''

  // Style: clean — Elegant Reveal
  if (introStyle === 'clean') {
    return (
      <div className="relative w-full flex flex-col items-center justify-center" style={{ backgroundColor: themeColors.background, minHeight: isPreview ? '660px' : '100vh' }}>
        <style dangerouslySetInnerHTML={{ __html: magazineIntroStyles }} />
        {/* WEDDING INVITATION — letter-spacing condense */}
        <span style={{
          fontFamily: fonts.display, fontSize: '10px', color: themeColors.gray,
          display: 'block', width: '100%', textAlign: 'center', marginBottom: '40px',
          opacity: 0, letterSpacing: '12px',
          ...(loaded ? { animation: 'mag-spacingCondense 1.2s cubic-bezier(0.22,1,0.36,1) 0.3s both' } : {}),
        }}>
          WEDDING INVITATION
        </span>
        {/* Divider top — grows down */}
        <div style={{
          width: '1px', height: 0, background: themeColors.divider,
          margin: '0 auto 40px',
          ...(loaded ? { animation: 'mag-lineGrowDown 0.8s ease 0.8s both' } : {}),
        }} />
        {/* Groom name — mask reveal */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontFamily: fonts.displayKr || fonts.display, fontSize: '28px', fontWeight: 300,
            letterSpacing: '8px', color: themeColors.primary, lineHeight: 1.8,
            transform: 'translateY(100%)', opacity: 0,
            ...(loaded ? { animation: 'mag-maskRevealUp 0.7s cubic-bezier(0.22,1,0.36,1) 1.4s both' } : {}),
          }}>
            {groomName}
          </div>
        </div>
        {/* Ampersand */}
        <span style={{
          fontFamily: fonts.display, fontSize: '12px', letterSpacing: '5px', color: themeColors.gray,
          opacity: 0,
          ...(loaded ? { animation: 'mag-fadeIn 0.4s ease 1.6s both' } : {}),
        }}>&amp;</span>
        {/* Bride name — mask reveal */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontFamily: fonts.displayKr || fonts.display, fontSize: '28px', fontWeight: 300,
            letterSpacing: '8px', color: themeColors.primary, lineHeight: 1.8,
            transform: 'translateY(100%)', opacity: 0,
            ...(loaded ? { animation: 'mag-maskRevealUp 0.7s cubic-bezier(0.22,1,0.36,1) 1.8s both' } : {}),
          }}>
            {brideName}
          </div>
        </div>
        {/* Divider bottom — grows down */}
        <div style={{
          width: '1px', height: 0, background: themeColors.divider,
          margin: '40px auto',
          ...(loaded ? { animation: 'mag-lineGrowDown 0.8s ease 2.2s both' } : {}),
        }} />
        {/* Date + Venue */}
        <div style={{
          fontFamily: fonts.display, fontSize: '12px', letterSpacing: '3px',
          color: themeColors.primary, lineHeight: 2.4, textAlign: 'center',
          opacity: 0,
          ...(loaded ? { animation: 'mag-fadeSlideUp 0.7s ease 2.6s both' } : {}),
        }}>
          <span style={{ display: 'block' }}>{dateStr} {dayOfWeek}</span>
          {invitation.wedding?.venue?.name && (
            <span style={{ display: 'block', fontSize: '11px', letterSpacing: '2px' }}>{invitation.wedding.venue.name}</span>
          )}
        </div>
        {/* OPEN button with pulse */}
        <button
          onClick={onEnter}
          className="mt-12 hover:scale-105 active:scale-95"
          style={{
            fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px',
            color: themeColors.primary, background: 'transparent',
            border: `1px solid ${themeColors.divider}`, padding: '14px 40px', cursor: 'pointer',
            opacity: 0,
            ['--mag-pulse-color' as string]: themeColors.divider,
            ['--mag-pulse-active' as string]: themeColors.primary,
            ...(loaded ? { animation: 'mag-fadeIn 0.6s ease 3s both, mag-btnPulse 3s ease-in-out 3.6s infinite' } : {}),
          }}
        >
          {dt('OPEN')}
        </button>
      </div>
    )
  }

  // Style: editorial — Cinematic Entrance
  if (introStyle === 'editorial') {
    const coverSettings = invitation.media?.coverImageSettings || {} as any
    const hasCropData = coverSettings.cropWidth !== undefined && coverSettings.cropHeight !== undefined && (coverSettings.cropWidth < 1 || coverSettings.cropHeight < 1)
    const bgPos = hasCropData
      ? `${((coverSettings.cropX || 0) + (coverSettings.cropWidth || 1) / 2) * 100}% ${((coverSettings.cropY || 0) + (coverSettings.cropHeight || 1) / 2) * 100}%`
      : 'center'
    return (
      <div className="relative w-full flex flex-col" style={{ backgroundColor: '#000', height: isPreview ? '660px' : '100vh', overflow: 'hidden' }}>
        <style dangerouslySetInnerHTML={{ __html: magazineIntroStyles }} />
        {/* Full bleed cover — Ken Burns zoom out */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: bgPos,
              backgroundRepeat: 'no-repeat',
              transform: 'scale(1.12)',
              opacity: 0,
              ...(loaded ? { animation: 'mag-editorialKenBurns 5s ease both' } : {}),
            }}
          />
        </div>
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.7) 100%)',
            opacity: 0,
            ...(loaded ? { animation: 'mag-fadeIn 1.5s ease 0.8s both' } : {}),
          }}
        />
        {/* Top bar — slide in from edges */}
        <div className="relative z-10 px-7 pt-12 flex items-center justify-between">
          <span style={{
            fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px',
            color: 'rgba(255,255,255,0.9)',
            opacity: 0, transform: 'translateX(-30px)',
            ...(loaded ? { animation: 'mag-slideInLeft 0.8s cubic-bezier(0.22,1,0.36,1) 1.8s both' } : {}),
          }}>{dt('WEDDING')}</span>
          <span style={{
            fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px',
            color: 'rgba(255,255,255,0.7)',
            opacity: 0, transform: 'translateX(30px)',
            ...(loaded ? { animation: 'mag-slideInRight 0.8s cubic-bezier(0.22,1,0.36,1) 1.8s both' } : {}),
          }}>{dateStr}</span>
        </div>
        {/* Spacer */}
        <div className="flex-1" />
        {/* Bottom overlay — blur reveal names */}
        <div className="relative z-10 text-center pb-14">
          <div className="flex items-center justify-center gap-4">
            <span style={{
              fontFamily: fonts.displayKr || fonts.display, fontSize: '22px', fontWeight: 300,
              letterSpacing: '4px', color: '#ffffff',
              opacity: 0, filter: 'blur(8px)',
              ...(loaded ? { animation: 'mag-blurReveal 1s cubic-bezier(0.22,1,0.36,1) 2.2s both' } : {}),
            }}>
              {groomName}
            </span>
            <span style={{
              fontFamily: fonts.display, fontSize: '11px', color: 'rgba(255,255,255,0.45)',
              opacity: 0,
              ...(loaded ? { animation: 'mag-fadeIn 0.5s ease 2.4s both' } : {}),
            }}>&amp;</span>
            <span style={{
              fontFamily: fonts.displayKr || fonts.display, fontSize: '22px', fontWeight: 300,
              letterSpacing: '4px', color: '#ffffff',
              opacity: 0, filter: 'blur(8px)',
              ...(loaded ? { animation: 'mag-blurReveal 1s cubic-bezier(0.22,1,0.36,1) 2.5s both' } : {}),
            }}>
              {brideName}
            </span>
          </div>
          {/* Divider — grows down */}
          <div style={{
            width: '1px', height: 0,
            background: 'rgba(255,255,255,0.3)', margin: '20px auto 0',
            ...(loaded ? { animation: 'mag-lineGrowDown 0.6s ease 3s both' } : {}),
          }} />
          {/* OPEN button */}
          <button
            onClick={onEnter}
            className="mt-4 hover:opacity-70 active:scale-95"
            style={{
              fontFamily: fonts.display, fontSize: '9px', letterSpacing: '5px',
              color: 'rgba(255,255,255,0.8)', background: 'transparent',
              border: 'none', padding: '0', cursor: 'pointer',
              opacity: 0,
              ...(loaded ? { animation: 'mag-fadeIn 0.6s ease 3.3s both, mag-btnPulseWhite 3s ease-in-out 4s infinite' } : {}),
            }}
          >
            {dt('OPEN')}
          </button>
        </div>
      </div>
    )
  }

  // Style: cover — Magazine Unfold
  const charBaseDelay = 1.4
  const groomCharCount = [...groomName].length
  const ampDelay = charBaseDelay + groomCharCount * 0.08 + 0.1
  const brideBaseDelay = ampDelay + 0.15
  const brideCharCount = [...brideName].length
  const btnDelay = brideBaseDelay + brideCharCount * 0.08 + 0.4

  return (
    <div className="relative w-full flex flex-col" style={{ backgroundColor: themeColors.background, minHeight: isPreview ? '660px' : '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: magazineIntroStyles }} />
      {/* Top bar with line draw */}
      <div
        className="relative z-10 px-6 pt-10 pb-4"
        style={{
          opacity: 0, transform: 'translateY(-15px)',
          ...(loaded ? { animation: 'mag-fadeSlideDown 0.8s ease both' } : {}),
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '3px', color: themeColors.primary, fontWeight: 400 }}>
            WEDDING
          </span>
          <div style={{
            height: '0.5px', flex: 1, background: themeColors.divider,
            transform: 'scaleX(0)', transformOrigin: 'left',
            ...(loaded ? { animation: 'mag-lineDrawRight 1s ease 0.4s both' } : {}),
          }} />
          <span style={{
            fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.primary,
            opacity: 0,
            ...(loaded ? { animation: 'mag-fadeIn 0.6s ease 1s both' } : {}),
          }}>
            {dateStr}
          </span>
        </div>
      </div>
      {/* Cover image — Ken Burns zoom out */}
      <div
        className="relative z-10 overflow-hidden"
        style={{
          aspectRatio: '3/4',
          opacity: 0,
          ...(loaded ? { animation: 'mag-fadeIn 1.2s ease 0.2s both' } : {}),
        }}
      >
        <div style={{
          width: '100%', height: '100%',
          transform: 'scale(1.15)',
          ...(loaded ? { animation: 'mag-kenBurnsOut 4s ease 0.2s both' } : {}),
        }}>
          <CroppedImageDiv src={coverImage} crop={invitation.media?.coverImageSettings || {}} className="w-full h-full" />
        </div>
      </div>
      {/* Names — character by character reveal */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="text-center" style={{ lineHeight: 1.6 }}>
          <CharReveal
            text={groomName}
            baseDelay={charBaseDelay}
            loaded={loaded}
            style={{ fontFamily: fonts.displayKr || fonts.display, fontSize: '22px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary }}
          />
          <span style={{
            fontSize: '14px', letterSpacing: '4px', color: themeColors.gray, fontWeight: 300,
            display: 'inline-block', margin: '0 8px',
            opacity: 0,
            ...(loaded ? { animation: `mag-fadeIn 0.4s ease ${ampDelay}s both` } : {}),
          }}>&amp;</span>
          <CharReveal
            text={brideName}
            baseDelay={brideBaseDelay}
            loaded={loaded}
            style={{ fontFamily: fonts.displayKr || fonts.display, fontSize: '22px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary }}
          />
        </div>
        {/* OPEN button with pulse */}
        <button
          onClick={onEnter}
          className="mt-8 hover:scale-105 active:scale-95"
          style={{
            fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px',
            color: themeColors.primary, background: 'transparent',
            border: `1px solid ${themeColors.divider}`, padding: '12px 36px', cursor: 'pointer',
            opacity: 0,
            ['--mag-pulse-color' as string]: themeColors.divider,
            ['--mag-pulse-active' as string]: themeColors.primary,
            ...(loaded ? { animation: `mag-fadeIn 0.6s ease ${btnDelay}s both, mag-btnPulse 3s ease-in-out ${btnDelay + 0.6}s infinite` } : {}),
          }}
        >
          {dt('OPEN')}
        </button>
      </div>
    </div>
  )
}

// ===== Editor's Note Section =====
function EditorsNote({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
  const mst = invitation.magazineSectionTitles || {}
  const getTitle = (section: string, type: 'main' | 'sub', defaultVal: string) => {
    const val = (mst as any)[section]?.[type]
    if (val === '') return null
    return val ?? defaultVal
  }
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const greeting = invitation.content?.greeting || '두 사람이 함께 쓰는 새로운 이야기가 시작됩니다.'

  const noteImage = invitation.editorsNoteImage
  const noteImageSettings = invitation.editorsNoteImageSettings
  const noteImageRatio = invitation.editorsNoteImageRatio || 'landscape'

  return (
    <div style={{ position: 'sticky', top: '44px', zIndex: 5, backgroundColor: themeColors.background }}>
      {/* Editor's Note 상단 사진 (옵션) */}
      {noteImage && (
        <div className="px-6 pt-16 pb-0" style={{ opacity: 0, ...(show ? { animation: 'mag-sectionFadeIn 1s ease 0.2s both' } : {}) }}>
          <div className="overflow-hidden" style={{ aspectRatio: noteImageRatio === 'portrait' ? '3/4' : '16/9', ...(show ? { animation: 'mag-imgKenBurns 3s ease 0.4s both' } : { transform: 'scale(1.08)' }) }}>
            <CroppedImageDiv src={noteImage} crop={noteImageSettings || {}} className="w-full h-full" />
          </div>
        </div>
      )}
      <div className={`px-6 ${noteImage ? 'pt-6 pb-20' : 'py-20'}`}>
        <div style={{ opacity: 0, ...(show ? { animation: 'mag-sectionFadeIn 1s ease both' } : {}) }}>
          {/* Section Label */}
          {getTitle('editorsNote', 'main', "EDITOR'S NOTE") !== null && (
          <div className="flex items-center gap-3 mb-8" style={{ opacity: 0, ...(show ? { animation: 'mag-dropCapScale 0.8s ease 0.3s both' } : {}) }}>
            <div style={{ height: '0.5px', flex: 1, background: themeColors.divider }} />
            <span style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px', color: themeColors.gray }}>
              {getTitle('editorsNote', 'main', "EDITOR'S NOTE")}
            </span>
            <div style={{ height: '0.5px', flex: 1, background: themeColors.divider }} />
          </div>
          )}

          {/* Drop Cap Style Greeting */}
          <div style={{ maxWidth: '320px', margin: '0 auto' }}>
            {greeting.split('\n').map((line: string, i: number) => {
              if (line.trim().length === 0) return <div key={i} style={{ height: '12px' }} />
              return (
                <p
                  key={i}
                  style={{
                    fontFamily: fonts.body,
                    fontSize: '13px',
                    lineHeight: 2,
                    color: themeColors.gray,
                    fontWeight: 300,
                    textAlign: 'center',
                    marginBottom: '4px',
                    opacity: 0,
                    ...(show ? { animation: `mag-lineReveal 0.7s ease ${0.6 + i * 0.2}s both` } : {}),
                  }}
                >
                  {line}
                </p>
              )
            })}
          </div>

          {/* Quote */}
          {invitation.content?.quote?.text && (
            <div className="mt-12 text-center" style={{ opacity: 0, ...(show ? { animation: `mag-lineReveal 0.8s ease ${0.6 + greeting.split('\n').length * 0.2}s both` } : {}) }}>
              <div style={{ width: '20px', height: '1px', background: themeColors.primary, margin: '0 auto 16px' }} />
              <p style={{ fontFamily: fonts.displayKr, fontSize: '13px', fontStyle: 'italic', lineHeight: 1.8, color: themeColors.primary, whiteSpace: 'pre-line' }}>
                &ldquo;{invitation.content.quote.text}&rdquo;
              </p>
              {!invitation.content.quote.hideAuthor && invitation.content.quote.author && (
                <p style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px', color: themeColors.gray, marginTop: '8px' }}>
                  &mdash; {invitation.content.quote.author}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Meet The Couple (Interviewee Profile) =====
function MeetTheCouple({ invitation, fonts, themeColors, bgOverride }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string }) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const mst = invitation.magazineSectionTitles || {}
  const getTitle = (section: string, type: 'main' | 'sub', defaultVal: string) => {
    const val = (mst as any)[section]?.[type]
    if (val === '') return null
    return dt(val ?? defaultVal)
  }
  const { ref, isVisible } = useScrollReveal()
  const groomProfile = invitation.groom?.profile
  const brideProfile = invitation.bride?.profile
  const groomImages = (groomProfile?.images || []).map((img: unknown) => extractImageUrl(img)).filter(Boolean)
  const brideImages = (brideProfile?.images || []).map((img: unknown) => extractImageUrl(img)).filter(Boolean)
  const groomName = invitation.groom?.name || '신랑'
  const brideName = invitation.bride?.name || '신부'
  const hasGroomContent = groomImages.length > 0 || groomProfile?.tag
  const hasBrideContent = brideImages.length > 0 || brideProfile?.tag

  const [groomIdx, setGroomIdx] = useState(0)
  const [brideIdx, setBrideIdx] = useState(0)
  const groomTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const brideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const groomPauseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bridePauseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-slide for groom images
  useEffect(() => {
    if (!isVisible || groomImages.length <= 1) return
    const start = () => {
      if (groomTimerRef.current) clearInterval(groomTimerRef.current)
      groomTimerRef.current = setInterval(() => {
        setGroomIdx(prev => (prev + 1) % groomImages.length)
      }, 5000)
    }
    start()
    return () => { if (groomTimerRef.current) clearInterval(groomTimerRef.current); if (groomPauseRef.current) clearTimeout(groomPauseRef.current) }
  }, [isVisible, groomImages.length])

  // Auto-slide for bride images (same interval, 0.5s delayed start for consistent offset)
  useEffect(() => {
    if (!isVisible || brideImages.length <= 1) return
    const start = () => {
      if (brideTimerRef.current) clearInterval(brideTimerRef.current)
      brideTimerRef.current = setInterval(() => {
        setBrideIdx(prev => (prev + 1) % brideImages.length)
      }, 5000)
    }
    const delayId = setTimeout(start, 500)
    return () => { clearTimeout(delayId); if (brideTimerRef.current) clearInterval(brideTimerRef.current); if (bridePauseRef.current) clearTimeout(bridePauseRef.current) }
  }, [isVisible, brideImages.length])

  if (!hasGroomContent && !hasBrideContent) return null

  const isPortrait = invitation.profileFrameShape === 'portrait'

  const handleGroomTap = () => {
    if (groomImages.length > 1) {
      setGroomIdx(prev => (prev + 1) % groomImages.length)
      // Pause auto-slide, resume after 5s
      if (groomTimerRef.current) clearInterval(groomTimerRef.current)
      if (groomPauseRef.current) clearTimeout(groomPauseRef.current)
      groomPauseRef.current = setTimeout(() => {
        groomTimerRef.current = setInterval(() => {
          setGroomIdx(prev => (prev + 1) % groomImages.length)
        }, 5000)
      }, 5000)
    }
  }
  const handleBrideTap = () => {
    if (brideImages.length > 1) {
      setBrideIdx(prev => (prev + 1) % brideImages.length)
      if (brideTimerRef.current) clearInterval(brideTimerRef.current)
      if (bridePauseRef.current) clearTimeout(bridePauseRef.current)
      bridePauseRef.current = setTimeout(() => {
        brideTimerRef.current = setInterval(() => {
          setBrideIdx(prev => (prev + 1) % brideImages.length)
        }, 5000)
      }, 5000)
    }
  }

  // Shared image renderer with crossfade for multi-photo
  const renderProfileImage = (images: string[], currentIdx: number, settings: any[], onTap: () => void, placeholder: React.ReactNode) => {
    if (images.length === 0) return placeholder
    const hasMultiple = images.length > 1
    return (
      <div
        onClick={hasMultiple ? onTap : undefined}
        style={{ position: 'relative', width: '100%', height: '100%', cursor: hasMultiple ? 'pointer' : undefined }}
      >
        {images.map((img, i) => (
          <div key={i} style={{ position: i === 0 ? 'relative' : 'absolute', inset: i === 0 ? undefined : 0, width: '100%', height: '100%', opacity: i === currentIdx ? 1 : 0, transition: 'opacity 0.5s ease', zIndex: i === currentIdx ? 1 : 0 }}>
            <CroppedImageDiv src={img} crop={settings?.[i] || {}} className="w-full h-full" />
          </div>
        ))}
        {hasMultiple && (
          <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 2 }}>
            {images.map((_, i) => (
              <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: i === currentIdx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', transition: 'background 0.3s ease' }} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const groomPlaceholder = (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: themeColors.sectionBg, border: `1px solid ${themeColors.divider}` }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={themeColors.gray} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>
  )
  const bridePlaceholder = groomPlaceholder

  return (
    <div ref={ref} className="px-6 py-16" style={{ backgroundColor: bgOverride || themeColors.sectionBg }}>
      <div style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 1s ease both' } : {}) }}>
        {/* Section Label */}
        {(getTitle('meetTheCouple', 'sub', 'INTERVIEWEE') !== null || getTitle('meetTheCouple', 'main', 'MEET THE COUPLE') !== null) && (
        <div className="text-center mb-10" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 1s ease 0.3s both' } : {}) }}>
          {getTitle('meetTheCouple', 'sub', 'INTERVIEWEE') !== null && (
          <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
            {getTitle('meetTheCouple', 'sub', 'INTERVIEWEE')}
          </div>
          )}
          {getTitle('meetTheCouple', 'main', 'MEET THE COUPLE') !== null && (
          <h2 style={{ fontFamily: fonts.display, fontSize: '24px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary }}>
            {getTitle('meetTheCouple', 'main', 'MEET THE COUPLE')}
          </h2>
          )}
          <div style={{ width: '40px', height: '1px', background: themeColors.primary, margin: '16px auto 0' }} />
        </div>
        )}

        {isPortrait ? (
          /* Portrait: Grid card style with text outside */
          <div className="grid grid-cols-2 gap-4">
            {/* Groom */}
            {hasGroomContent && (
              <div className="flex flex-col items-center" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-slideFromLeft 1.2s cubic-bezier(0.22,1,0.36,1) 1.2s both' } : {}) }}>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden', width: '100%' }}>
                  {renderProfileImage(groomImages, groomIdx, groomProfile?.imageSettings, handleGroomTap, groomPlaceholder)}
                </div>
                <div className="text-center mt-3">
                  <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.primary, fontWeight: 500, opacity: 0, ...(isVisible ? { animation: 'mag-nameBlurReveal 1s ease 2.0s both' } : {}) }}>
                    {groomName}
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray, marginTop: '2px' }}>
                    {dt('GROOM')}
                  </div>
                  {groomProfile?.tag && (
                    <p style={{ fontFamily: fonts.body, fontSize: '10px', color: themeColors.gray, marginTop: '6px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {groomProfile.tag}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bride */}
            {hasBrideContent && (
              <div className="flex flex-col items-center" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-slideFromRight 1.2s cubic-bezier(0.22,1,0.36,1) 1.7s both' } : {}) }}>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden', width: '100%' }}>
                  {renderProfileImage(brideImages, brideIdx, brideProfile?.imageSettings, handleBrideTap, bridePlaceholder)}
                </div>
                <div className="text-center mt-3">
                  <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.primary, fontWeight: 500, opacity: 0, ...(isVisible ? { animation: 'mag-nameBlurReveal 1s ease 2.5s both' } : {}) }}>
                    {brideName}
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray, marginTop: '2px' }}>
                    {dt('BRIDE')}
                  </div>
                  {brideProfile?.tag && (
                    <p style={{ fontFamily: fonts.body, fontSize: '10px', color: themeColors.gray, marginTop: '6px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {brideProfile.tag}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Circle: Original style */
          <div className="flex justify-center items-start gap-10">
            {/* Groom */}
            {hasGroomContent && (
              <div className="flex flex-col items-center" style={{ maxWidth: '120px', opacity: 0, ...(isVisible ? { animation: 'mag-slideFromLeft 1.2s cubic-bezier(0.22,1,0.36,1) 1.2s both' } : {}) }}>
                <div
                  className="overflow-hidden mb-4"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    border: `1.5px solid ${themeColors.divider}`,
                    backgroundColor: groomImages.length === 0 ? themeColors.sectionBg : undefined,
                  }}
                >
                  {renderProfileImage(groomImages, groomIdx, groomProfile?.imageSettings, handleGroomTap,
                    <div className="w-full h-full flex items-center justify-center" style={{ color: themeColors.gray, fontSize: '24px' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.primary, fontWeight: 500, opacity: 0, ...(isVisible ? { animation: 'mag-nameBlurReveal 1s ease 2.0s both' } : {}) }}>
                  {groomName}
                </div>
                <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray, marginTop: '4px' }}>
                  {dt('GROOM')}
                </div>
                {groomProfile?.tag && (
                  <p style={{ fontFamily: fonts.body, fontSize: '11px', color: themeColors.gray, marginTop: '8px', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {groomProfile.tag}
                  </p>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: '40px' }}>
              <div style={{ width: '1px', height: '24px', background: themeColors.divider }} />
            </div>

            {/* Bride */}
            {hasBrideContent && (
              <div className="flex flex-col items-center" style={{ maxWidth: '120px', opacity: 0, ...(isVisible ? { animation: 'mag-slideFromRight 1.2s cubic-bezier(0.22,1,0.36,1) 1.7s both' } : {}) }}>
                <div
                  className="overflow-hidden mb-4"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    border: `1.5px solid ${themeColors.divider}`,
                    backgroundColor: brideImages.length === 0 ? themeColors.sectionBg : undefined,
                  }}
                >
                  {renderProfileImage(brideImages, brideIdx, brideProfile?.imageSettings, handleBrideTap,
                    <div className="w-full h-full flex items-center justify-center" style={{ color: themeColors.gray, fontSize: '24px' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.primary, fontWeight: 500, opacity: 0, ...(isVisible ? { animation: 'mag-nameBlurReveal 1s ease 2.5s both' } : {}) }}>
                  {brideName}
                </div>
                <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray, marginTop: '4px' }}>
                  {dt('BRIDE')}
                </div>
                {brideProfile?.tag && (
                  <p style={{ fontFamily: fonts.body, fontSize: '11px', color: themeColors.gray, marginTop: '8px', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {brideProfile.tag}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Feature Interview Section =====
function FeatureInterview({ invitation, fonts, themeColors, bgOverride }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string }) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const interviews = invitation.interviews?.length ? invitation.interviews : invitation.content?.interviews || []

  if (interviews.length === 0) return null

  return (
    <div style={{ backgroundColor: bgOverride || themeColors.sectionBg }}>
      {/* Section Header */}
      <div ref={headerRef} className="px-6 pt-16 pb-8 text-center" style={{ opacity: 0, ...(headerVisible ? { animation: 'mag-sectionFadeIn 1s ease both' } : {}) }}>
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
          {dt('EXCLUSIVE')}
        </div>
        <h2 style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary }}>
          {dt('THE INTERVIEW')}
        </h2>
        <div style={{ width: '40px', height: '1px', background: themeColors.primary, margin: '16px auto 0' }} />
      </div>

      {/* Interview Items */}
      {interviews.map((item: any, idx: number) => (
        <InterviewCard key={idx} item={item} index={idx} fonts={fonts} themeColors={themeColors} />
      ))}
    </div>
  )
}

function InterviewCard({ item, index, fonts, themeColors }: { item: any; index: number; fonts: FontConfig; themeColors: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal()
  const isEven = index % 2 === 0

  const images = (item.images || []).map(extractImageUrl).filter(Boolean)

  return (
    <div
      ref={ref}
      className="px-6 pb-12"
      style={{ opacity: 0, ...(isVisible ? { animation: `mag-cardRotateIn 0.8s ease ${0.15 * index}s both` } : {}) }}
    >
      {/* Interview number badge */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center"
          style={{
            width: '28px',
            height: '28px',
            border: `1px solid ${themeColors.primary}`,
            fontFamily: fonts.display,
            fontSize: '11px',
            color: themeColors.primary,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>
        <div style={{ height: '0.5px', flex: 1, background: themeColors.divider }} />
      </div>

      {/* Images above question: 1장=3:4 세로형, 2장=2열 그리드 */}
      {images.length === 1 && (
        <div className="w-full mb-6 overflow-hidden" style={{ aspectRatio: '3/4', ...(isVisible ? { animation: 'mag-imgKenBurns 3s ease both' } : { transform: 'scale(1.08)' }) }}>
          <CroppedImageDiv src={images[0]} crop={item.imageSettings?.[0] || {}} className="w-full h-full" />
        </div>
      )}
      {images.length === 2 && (
        <div className="mb-6 grid grid-cols-2 gap-1">
          {images.map((img: string, imgIdx: number) => (
            <div key={imgIdx} className="overflow-hidden" style={{ aspectRatio: '4/5', ...(isVisible ? { animation: `mag-imgKenBurns 3s ease ${imgIdx * 0.2}s both` } : { transform: 'scale(1.08)' }) }}>
              <CroppedImageDiv src={img} crop={item.imageSettings?.[imgIdx] || {}} className="w-full h-full" />
            </div>
          ))}
        </div>
      )}
      {images.length >= 3 && (
        <div className="mb-6 space-y-1">
          <div className="w-full overflow-hidden" style={{ aspectRatio: '3/4', ...(isVisible ? { animation: 'mag-imgKenBurns 3s ease both' } : { transform: 'scale(1.08)' }) }}>
            <CroppedImageDiv src={images[0]} crop={item.imageSettings?.[0] || {}} className="w-full h-full" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            {images.slice(1, 3).map((img: string, imgIdx: number) => (
              <div key={imgIdx} className="overflow-hidden" style={{ aspectRatio: '4/5', ...(isVisible ? { animation: `mag-imgKenBurns 3s ease ${(imgIdx + 1) * 0.2}s both` } : { transform: 'scale(1.08)' }) }}>
                <CroppedImageDiv src={img} crop={item.imageSettings?.[imgIdx + 1] || {}} className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Question - Magazine headline style */}
      <h3
        style={{
          fontFamily: fonts.displayKr,
          fontSize: '16px',
          fontWeight: 600,
          lineHeight: 1.5,
          color: themeColors.text,
          marginBottom: '16px',
          letterSpacing: '-0.3px',
          whiteSpace: 'pre-line',
          paddingLeft: '1.1em',
          textIndent: '-1.1em',
        }}
      >
        Q. {item.question}
      </h3>

      {/* Answer - Editorial body style */}
      <div style={{ position: 'relative', paddingLeft: '16px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
          background: themeColors.primary,
          transformOrigin: 'top',
          transform: 'scaleY(0)',
          ...(isVisible ? { animation: `mag-barGrow 0.8s cubic-bezier(0.22,1,0.36,1) ${0.3 + 0.15 * index}s both` } : {}),
        }} />
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: '13px',
            lineHeight: 1.9,
            color: themeColors.gray,
            whiteSpace: 'pre-line',
          }}
        >
          {item.answer}
        </p>
      </div>

    </div>
  )
}

// ===== Photo Spread Section =====
function PhotoSpread({ invitation, fonts, themeColors, onOpenLightbox, bgOverride }: {
  invitation: any; fonts: FontConfig; themeColors: ColorConfig; onOpenLightbox: (idx: number) => void; bgOverride?: string
}) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const mst = invitation.magazineSectionTitles || {}
  const getTitle = (section: string, type: 'main' | 'sub', defaultVal: string) => {
    const val = (mst as any)[section]?.[type]
    if (val === '') return null
    return dt(val ?? defaultVal)
  }
  const { ref, isVisible } = useScrollReveal()
  const allImages = (invitation.gallery?.images || []).map(extractImageUrl).filter(Boolean)
  const [showAll, setShowAll] = useState(false)

  if (allImages.length === 0) return null

  const images = showAll ? allImages : allImages.slice(0, 5)
  const hasMore = allImages.length > 5 && !showAll

  const renderGrid = (imgs: string[], startIdx: number) => {
    const pairCount = Math.floor(imgs.length / 2) * 2
    const paired = imgs.slice(0, pairCount)
    const lastSingle = imgs.length % 2 === 1 ? imgs[imgs.length - 1] : null
    const lastSingleIdx = imgs.length % 2 === 1 ? startIdx + imgs.length - 1 : -1
    return (
      <>
        {paired.length > 0 && (
          <div className="grid grid-cols-2 gap-1">
            {paired.map((img: string, i: number) => (
              <div
                key={i}
                className="overflow-hidden cursor-pointer"
                onClick={() => onOpenLightbox(startIdx + i)}
                style={{ aspectRatio: '4/5', opacity: 0, ...(isVisible ? { animation: `${(startIdx + i) % 2 === 0 ? 'mag-photoScale' : 'mag-photoScaleAlt'} 1s cubic-bezier(0.22,1,0.36,1) ${0.4 + (startIdx + i) * 0.2}s both` } : {}) }}
              >
                <CroppedImageDiv src={img} crop={invitation.gallery?.imageSettings?.[startIdx + i] || {}} className="w-full h-full transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        )}
        {lastSingle && (
          <div
            className="mt-1 overflow-hidden cursor-pointer"
            onClick={() => onOpenLightbox(lastSingleIdx)}
            style={{ aspectRatio: '4/5', opacity: 0, ...(isVisible ? { animation: `mag-photoScale 1s cubic-bezier(0.22,1,0.36,1) ${0.4 + lastSingleIdx * 0.2}s both` } : {}) }}
          >
            <CroppedImageDiv src={lastSingle} crop={invitation.gallery?.imageSettings?.[lastSingleIdx] || {}} className="w-full h-full transition-transform duration-700 hover:scale-105" />
          </div>
        )}
      </>
    )
  }

  return (
    <div ref={ref} className="py-16" style={{ backgroundColor: bgOverride || themeColors.background }}>
      <div style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 0.8s ease both' } : {}) }}>
        {/* Section Header */}
        {(getTitle('photoSpread', 'sub', 'GALLERY') !== null || getTitle('photoSpread', 'main', 'PHOTO SPREAD') !== null) && (
        <div className="px-6 mb-8 text-center">
          {getTitle('photoSpread', 'sub', 'GALLERY') !== null && (
          <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
            {getTitle('photoSpread', 'sub', 'GALLERY')}
          </div>
          )}
          {getTitle('photoSpread', 'main', 'PHOTO SPREAD') !== null && (
          <h2 style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary }}>
            {getTitle('photoSpread', 'main', 'PHOTO SPREAD')}
          </h2>
          )}
          <div style={{ width: '40px', height: '1px', background: themeColors.primary, margin: '16px auto 0' }} />
        </div>
        )}

        {/* Magazine-style grid */}
        <div className="px-3">
          {images[0] && (
            <div
              className="mb-1 overflow-hidden cursor-pointer"
              onClick={() => onOpenLightbox(0)}
              style={{ aspectRatio: '4/5', opacity: 0, ...(isVisible ? { animation: 'mag-photoScale 1s cubic-bezier(0.22,1,0.36,1) 0.2s both' } : {}) }}
            >
              <CroppedImageDiv src={images[0]} crop={invitation.gallery?.imageSettings?.[0] || {}} className="w-full h-full transition-transform duration-700 hover:scale-105" />
            </div>
          )}
          {images.length > 1 && renderGrid(images.slice(1), 1)}
          {hasMore && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-3 py-3 text-center transition-colors hover:opacity-80"
              style={{ border: `1px solid ${themeColors.divider}`, background: themeColors.cardBg }}
            >
              <span style={{ fontFamily: fonts.displayKr, fontSize: '13px', color: themeColors.primary }}>
                +{allImages.length - 5}장 더 보기
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== YouTube Section =====
function YouTubeSection({ invitation, fonts, themeColors, bgOverride }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string }) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const { ref, isVisible } = useScrollReveal()
  const [playing, setPlaying] = useState(false)
  const [thumbSrc, setThumbSrc] = useState('')
  const youtube = invitation.youtube
  if (!youtube?.enabled || !youtube?.url) return null

  const match = youtube.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
  const videoId = match?.[1]
  if (!videoId) return null
  if (!thumbSrc) setThumbSrc(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)

  return (
    <div ref={ref} className="px-6 py-12" style={{ backgroundColor: bgOverride || themeColors.sectionBg }}>
      <div className="text-center mb-6" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 0.7s ease both' } : {}) }}>
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '8px' }}>{dt('VIDEO')}</div>
        {youtube.title && (
          <p style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: themeColors.text }}>{youtube.title}</p>
        )}
      </div>
      <div className="w-full" style={{ aspectRatio: '16/9', opacity: 0, ...(isVisible ? { animation: 'mag-curtainOpen 0.8s ease 0.2s both' } : {}) }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        ) : (
          <div onClick={() => setPlaying(true)} style={{ cursor: 'pointer', position: 'relative', width: '100%', height: '100%' }}>
            <img src={thumbSrc} onError={() => setThumbSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="30" fill="rgba(0,0,0,0.6)"/><polygon points="24,18 24,42 44,30" fill="white"/></svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== The Details (Wedding Info) Section =====
function TheDetails({ invitation, fonts, themeColors, bgOverride }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string }) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const mst = invitation.magazineSectionTitles || {}
  const getTitle = (section: string, type: 'main' | 'sub', defaultVal: string) => {
    const val = (mst as any)[section]?.[type]
    if (val === '') return null
    return dt(val ?? defaultVal)
  }
  const { ref, isVisible } = useScrollReveal()
  const w = invitation.wedding || {}
  const date = w.date ? new Date(w.date) : null

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayNamesKr = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

  // Parents
  const groom = invitation.groom || {}
  const bride = invitation.bride || {}

  return (
    <div ref={ref} className="px-6 py-20" style={{ backgroundColor: bgOverride || themeColors.background }}>
      <div style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 0.8s ease both' } : {}) }}>
        {/* Section Header */}
        {(getTitle('theDetails', 'sub', 'DETAILS') !== null || getTitle('theDetails', 'main', 'THE WEDDING') !== null) && (
        <div className="text-center mb-12" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 0.7s ease 0.1s both' } : {}) }}>
          {getTitle('theDetails', 'sub', 'DETAILS') !== null && (
          <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
            {getTitle('theDetails', 'sub', 'DETAILS')}
          </div>
          )}
          {getTitle('theDetails', 'main', 'THE WEDDING') !== null && (
          <h2 style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary }}>
            {getTitle('theDetails', 'main', 'THE WEDDING')}
          </h2>
          )}
          <div style={{ width: '40px', height: '1px', background: themeColors.primary, margin: '16px auto 0' }} />
        </div>
        )}

        {/* Date Card */}
        {date && (
          <div className="text-center mb-12" style={{ padding: '28px 20px', border: `0.5px solid ${themeColors.divider}`, opacity: 0, ...(isVisible ? { animation: 'mag-expandIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both' } : {}) }}>
            <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '8px', opacity: 0, ...(isVisible ? { animation: 'mag-lineReveal 0.7s ease 0.6s both' } : {}) }}>
              {date.getFullYear()}. {String(date.getMonth() + 1).padStart(2, '0')}
            </div>
            <div className="flex items-center justify-center gap-4">
              <div style={{ height: '0.5px', width: '40px', background: themeColors.divider, transform: 'scaleX(0)', transformOrigin: 'right', ...(isVisible ? { animation: 'mag-borderDrawRight 0.6s ease 0.9s both' } : {}) }} />
              <div style={{ fontFamily: fonts.display, fontSize: '48px', fontWeight: 200, color: themeColors.primary, lineHeight: 1, opacity: 0, ...(isVisible ? { animation: 'mag-digitSlideDown 1s cubic-bezier(0.22,1,0.36,1) 0.8s both' } : {}) }}>
                {date.getDate()}
              </div>
              <div style={{ height: '0.5px', width: '40px', background: themeColors.divider, transform: 'scaleX(0)', transformOrigin: 'left', ...(isVisible ? { animation: 'mag-borderDrawRight 0.6s ease 0.9s both' } : {}) }} />
            </div>
            <div style={{ fontFamily: fonts.displayKr, fontSize: '12px', letterSpacing: '2px', color: themeColors.gray, marginTop: '8px', opacity: 0, ...(isVisible ? { animation: 'mag-lineReveal 0.7s ease 1.2s both' } : {}) }}>
              {dayNamesKr[date.getDay()]}
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: '14px', color: themeColors.text, marginTop: '12px', opacity: 0, ...(isVisible ? { animation: 'mag-lineReveal 0.7s ease 1.5s both' } : {}) }}>
              {w.timeDisplay || w.time || ''}
            </div>
            {/* D-Day Counter */}
            {(() => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const wedding = new Date(date)
              wedding.setHours(0, 0, 0, 0)
              const diffTime = wedding.getTime() - today.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              if (diffDays < 0) return null
              return (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `0.5px solid ${themeColors.divider}`, opacity: 0, ...(isVisible ? { animation: 'mag-scaleBlurReveal 0.8s ease 1.8s both' } : {}) }}>
                  <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '6px' }}>
                    {diffDays === 0 ? dt('TODAY') : dt('D-DAY')}
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '24px', fontWeight: 300, color: themeColors.primary, letterSpacing: '2px' }}>
                    {diffDays === 0 ? dt('THE DAY') : <>D-<CountUp target={diffDays} duration={1000} delay={1800} started={isVisible} /></>}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Venue */}
        <div className="text-center mb-12" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-lineReveal 0.7s ease 0.5s both' } : {}) }}>
          <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '8px' }}>
            {dt('VENUE')}
          </div>
          <p style={{ fontFamily: fonts.displayKr, fontSize: '16px', fontWeight: 500, color: themeColors.text }}>
            {w.venue?.name || ''}
          </p>
          {w.venue?.hall && !w.venue?.hideHall && (
            <p style={{ fontFamily: fonts.body, fontSize: '13px', color: themeColors.gray, marginTop: '4px' }}>
              {w.venue.hall}
            </p>
          )}
          {w.venue?.address && (
            <div className="flex items-center justify-center gap-1.5" style={{ marginTop: '8px' }}>
              <p style={{ fontFamily: fonts.body, fontSize: '12px', color: themeColors.gray }}>
                {w.venue.address}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(w.venue.address)
                    .then(() => {
                      const btn = document.getElementById('addr-copy-btn')
                      if (btn) { btn.textContent = '복사됨'; setTimeout(() => { btn.textContent = '' }, 1500) }
                    })
                }}
                className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
                title="주소 복사"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={themeColors.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span id="addr-copy-btn" style={{ fontFamily: fonts.body, fontSize: '9px', color: themeColors.gray, position: 'absolute', marginTop: '2px' }}></span>
              </button>
            </div>
          )}
          {!w.venue?.address && (
            <p style={{ fontFamily: fonts.body, fontSize: '12px', color: themeColors.gray, marginTop: '8px' }}></p>
          )}
        </div>

        {/* Parents Introduction - Magazine column style */}
        {invitation.sectionVisibility?.parentNames !== false && (groom.father?.name || groom.mother?.name || bride.father?.name || bride.mother?.name) && (
          <div style={{ borderTop: `0.5px solid ${themeColors.divider}`, paddingTop: '24px' }}>
            <div className="grid grid-cols-2 gap-6">
              {/* Groom side */}
              <div className="text-center">
                <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: themeColors.gray, marginBottom: '12px' }}>{dt('GROOM')}</div>
                <p style={{ fontFamily: fonts.body, fontSize: '12px', color: themeColors.gray, lineHeight: 1.8 }}>
                  {groom.father?.name && <>{(groom.father as any)?.deceased ? (invitation.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{groom.father.name} &middot; </>}
                  {groom.mother?.name && <>{(groom.mother as any)?.deceased ? (invitation.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{groom.mother.name}</>}
                </p>
                <p style={{ fontFamily: fonts.body, fontSize: '11px', color: themeColors.gray, marginTop: '2px' }}>
                  의 {groom.familyRole || '아들'}
                </p>
                <p style={{ fontFamily: fonts.displayKr, fontSize: '16px', fontWeight: 500, color: themeColors.text, marginTop: '6px' }}>
                  {groom.name || ''}
                </p>
              </div>

              {/* Bride side */}
              <div className="text-center">
                <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: themeColors.gray, marginBottom: '12px' }}>{dt('BRIDE')}</div>
                <p style={{ fontFamily: fonts.body, fontSize: '12px', color: themeColors.gray, lineHeight: 1.8 }}>
                  {bride.father?.name && <>{(bride.father as any)?.deceased ? (invitation.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{bride.father.name} &middot; </>}
                  {bride.mother?.name && <>{(bride.mother as any)?.deceased ? (invitation.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{bride.mother.name}</>}
                </p>
                <p style={{ fontFamily: fonts.body, fontSize: '11px', color: themeColors.gray, marginTop: '2px' }}>
                  의 {bride.familyRole || '딸'}
                </p>
                <p style={{ fontFamily: fonts.displayKr, fontSize: '16px', fontWeight: 500, color: themeColors.text, marginTop: '6px' }}>
                  {bride.name || ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Map Buttons */}
        {w.venue?.address && (() => {
          const mb = invitation.mapButtons || { naver: true, kakao: true, tmap: true }
          const buttons = [
            mb.naver !== false && { key: 'naver', href: `https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}`, target: '_blank', bg: '#03C75A', letter: 'N', textColor: 'white', label: 'NAVER' },
            mb.kakao !== false && { key: 'kakao', href: `https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}`, target: '_blank', bg: '#FEE500', letter: 'K', textColor: 'black', label: 'KAKAO' },
            mb.tmap !== false && { key: 'tmap', href: `tmap://search?name=${encodeURIComponent(w.venue.name || '')}`, target: undefined, bg: '#4285F4', letter: 'T', textColor: 'white', label: 'TMAP' },
          ].filter(Boolean) as { key: string; href: string; target?: string; bg: string; letter: string; textColor: string; label: string }[]
          if (buttons.length === 0) return null
          return (
            <div className="mt-8">
              <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '12px', textAlign: 'center' }}>
                MAP
              </div>
              <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${buttons.length}, 1fr)` }}>
                {buttons.map(btn => (
                  <a
                    key={btn.key}
                    href={btn.href}
                    target={btn.target}
                    rel={btn.target ? 'noopener noreferrer' : undefined}
                    className="flex flex-col items-center p-3"
                    style={{ border: `0.5px solid ${themeColors.divider}` }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: btn.bg }}>
                      <span className={`text-${btn.textColor} text-xs font-bold`} style={{ color: btn.textColor }}>{btn.letter}</span>
                    </div>
                    <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray }}>{dt(btn.label)}</span>
                  </a>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Directions */}
        {w.directions && (w.directions.car || w.directions.publicTransport || w.directions.train || w.directions.expressBus || (w.directions.extraInfoEnabled && w.directions.extraInfoText)) && (
          <div className="mt-8">
            <div style={{ fontFamily: fonts.displayKr, fontSize: '13px', color: themeColors.gray, marginBottom: '12px', textAlign: 'center' }}>
              오시는 길
            </div>
            <div className="space-y-4">
              {w.directions.car && (
                <DirectionItem label="자가용 이용시" text={w.directions.car} fonts={fonts} themeColors={themeColors} />
              )}
              {w.directions.publicTransport && (
                <DirectionItem label="대중교통 이용시" text={w.directions.publicTransport} fonts={fonts} themeColors={themeColors} />
              )}
              {w.directions.train && (
                <DirectionItem label="기차 이용시" text={typeof w.directions.train === 'string' ? w.directions.train : ''} fonts={fonts} themeColors={themeColors} />
              )}
              {w.directions.expressBus && (
                <DirectionItem label="고속버스 이용시" text={typeof w.directions.expressBus === 'string' ? w.directions.expressBus : ''} fonts={fonts} themeColors={themeColors} />
              )}
              {w.directions.extraInfoEnabled && w.directions.extraInfoText && (
                <DirectionItem label={w.directions.extraInfoTitle || '추가 안내사항'} text={w.directions.extraInfoText} fonts={fonts} themeColors={themeColors} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DirectionItem({ label, text, fonts, themeColors }: { label: string; text: string; fonts: FontConfig; themeColors: ColorConfig }) {
  return (
    <div style={{ padding: '12px 16px', background: themeColors.sectionBg, borderLeft: `2px solid ${themeColors.primary}` }}>
      <div style={{ fontFamily: fonts.displayKr, fontSize: '12px', fontWeight: 600, color: themeColors.primary, marginBottom: '6px' }}>
        {label}
      </div>
      <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: themeColors.gray, whiteSpace: 'pre-line' }}>
        {text}
      </p>
    </div>
  )
}

// ===== Guidance & Info Section =====
function GuidanceInfoSection({ invitation, fonts, themeColors, bgOverride }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string }) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const mst = invitation.magazineSectionTitles || {}
  const getTitle = (section: string, type: 'main' | 'sub', defaultVal: string) => {
    const val = (mst as any)[section]?.[type]
    if (val === '') return null
    return dt(val ?? defaultVal)
  }
  const { ref, isVisible } = useScrollReveal()
  const guidance = invitation.guidance
  const info = invitation.content?.info

  const defaultItemOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
  const enabledItems = info ? [
    ...(info.itemOrder || defaultItemOrder).filter((key: string) => {
      const item = info[key]
      return item?.enabled && item?.content
    }),
    ...(info.customItems || []).filter((item: any) => item.enabled && item.content).map((_: any, i: number) => `custom-${i}`),
  ] : []

  // sectionVisibility.guidance가 false면 렌더링하지 않음
  if (invitation.sectionVisibility?.guidance === false) return null
  // guidance가 없고 info 항목도 없으면 렌더링하지 않음
  if (!guidance?.enabled && enabledItems.length === 0) return null

  return (
    <div ref={ref} className="py-12" style={{ backgroundColor: bgOverride || themeColors.sectionBg }}>
      <div style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 0.8s ease both' } : {}) }}>
        {/* Section Header */}
        {(getTitle('guidance', 'sub', 'FOR YOUR HAPPY TIME') !== null || getTitle('guidance', 'main', 'INFORMATION') !== null) && (
        <div className="text-center mb-8 px-6">
          {getTitle('guidance', 'sub', 'FOR YOUR HAPPY TIME') !== null && (
          <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '6px' }}>
            {getTitle('guidance', 'sub', 'FOR YOUR HAPPY TIME')}
          </div>
          )}
          {getTitle('guidance', 'main', 'INFORMATION') !== null && (
          <div style={{ fontFamily: fonts.display, fontSize: '18px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary }}>
            {getTitle('guidance', 'main', 'INFORMATION')}
          </div>
          )}
          <div style={{ width: '25px', height: '1px', background: themeColors.primary, margin: '8px auto 0' }} />
        </div>
        )}

        {/* Guidance Image */}
        {guidance?.image && (
          <div className="px-6 mb-4">
            <div className="w-full overflow-hidden" style={{
              aspectRatio: '4/5',
              borderRadius: '8px',
              backgroundImage: `url(${guidance.image})`,
              backgroundSize: 'cover',
              backgroundPosition: `center ${50 - (guidance.imageSettings?.positionY || 0)}%`,
            }} />
          </div>
        )}

        {/* Info Items */}
        {enabledItems.length > 0 && (
          <div className="px-6 space-y-4">
            {enabledItems.map((key: string, i: number) => {
              const isCustom = key.startsWith('custom-')
              const item = isCustom ? info.customItems[parseInt(key.split('-')[1])] : info[key]
              if (!item?.enabled || !item?.content) return null

              return (
                <div key={i} style={{ padding: '16px', background: themeColors.cardBg, border: `0.5px solid ${themeColors.divider}`, transformOrigin: 'top center', opacity: 0, ...(isVisible ? { animation: `mag-expandIn 0.6s ease ${0.2 + i * 0.15}s both` } : {}) }}>
                  <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', color: themeColors.primary, marginBottom: '8px' }}>
                    {fonts.isScript ? item.title : item.title?.toUpperCase()}
                  </div>
                  <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: themeColors.gray, whiteSpace: 'pre-line' }}>{item.content}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Thank You Section =====
function ThankYouSection({ invitation, fonts, themeColors, bgOverride }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string }) {
  const { ref, isVisible } = useScrollReveal()
  const thankYou = invitation.content?.thankYou
  if (!thankYou) return null

  return (
    <div ref={ref} className="px-6 py-20 text-center" style={{ backgroundColor: bgOverride || themeColors.background }}>
      <div style={{ opacity: 0, ...(isVisible ? { animation: 'mag-scaleBlurReveal 0.9s ease both' } : {}) }}>
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
          CLOSING NOTE
        </div>
        <h2 style={{ fontFamily: fonts.display, fontSize: '24px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary, marginBottom: '20px' }}>
          {thankYou.title || 'THANK YOU'}
        </h2>
        <div style={{ width: '30px', height: '1px', background: themeColors.primary, margin: '0 auto 20px' }} />
        <p style={{ fontFamily: fonts.body, fontSize: '13px', lineHeight: 2, color: themeColors.gray, whiteSpace: 'pre-line' }}>{thankYou.message}</p>
        {thankYou.sign && (
          <p style={{ fontFamily: fonts.displayKr, fontSize: '13px', color: themeColors.text, marginTop: '16px', fontWeight: 500, minHeight: '20px' }}>
            <Typewriter text={thankYou.sign} delay={800} speed={100} started={isVisible} style={{ color: themeColors.text }} />
          </p>
        )}
      </div>
    </div>
  )
}

// ===== Contacts Section =====
function ContactsSection({ invitation, fonts, themeColors, bgOverride }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string }) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const { ref, isVisible } = useScrollReveal()
  const groom = invitation.groom || {}
  const bride = invitation.bride || {}

  const hasAccounts = [
    groom.bank?.enabled,
    (groom.father as any)?.bank?.enabled,
    (groom.mother as any)?.bank?.enabled,
    bride.bank?.enabled,
    (bride.father as any)?.bank?.enabled,
    (bride.mother as any)?.bank?.enabled,
  ].some(Boolean)

  const [expandedSide, setExpandedSide] = useState<'groom' | 'bride' | null>(null)

  if (!hasAccounts) return null

  const renderAccounts = (side: 'groom' | 'bride') => {
    const person = side === 'groom' ? groom : bride
    const accounts = [
      person.bank?.enabled && { name: person.name, ...person.bank, role: side === 'groom' ? '신랑' : '신부' },
      (person.father as any)?.bank?.enabled && { name: person.father.name, ...(person.father as any).bank, role: '아버지' },
      (person.mother as any)?.bank?.enabled && { name: person.mother.name, ...(person.mother as any).bank, role: '어머니' },
    ].filter(Boolean)

    return accounts.map((acc: any, i: number) => (
      <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: `0.5px solid ${themeColors.divider}` }}>
        <div>
          <span style={{ fontFamily: fonts.body, fontSize: '11px', color: themeColors.gray }}>{acc.role}</span>
          <span style={{ fontFamily: fonts.body, fontSize: '12px', color: themeColors.text, marginLeft: '8px' }}>{acc.bank} {acc.account}</span>
          {(acc.holder || acc.name) && <span style={{ fontFamily: fonts.body, fontSize: '11px', color: themeColors.gray, marginLeft: '6px' }}>{acc.holder || acc.name}</span>}
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(acc.account)
            alert('계좌번호가 복사되었습니다.')
          }}
          style={{
            fontFamily: fonts.display,
            fontSize: '10px',
            letterSpacing: '1px',
            color: themeColors.primary,
            background: 'none',
            border: `0.5px solid ${themeColors.primary}`,
            padding: '4px 12px',
            cursor: 'pointer',
          }}
        >
          COPY
        </button>
      </div>
    ))
  }

  return (
    <div ref={ref} className="px-6 py-12" style={{ backgroundColor: bgOverride || themeColors.sectionBg }}>
      <div className="text-center mb-8" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 0.7s ease both' } : {}) }}>
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '8px' }}>
          GIFT
        </div>
        <h3 style={{ fontFamily: fonts.displayKr, fontSize: '16px', color: themeColors.text }}>
          마음 전하실 곳
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setExpandedSide(expandedSide === 'groom' ? null : 'groom')}
          style={{
            fontFamily: fonts.display,
            fontSize: '11px',
            letterSpacing: '2px',
            padding: '12px',
            border: `0.5px solid ${expandedSide === 'groom' ? themeColors.primary : themeColors.divider}`,
            background: expandedSide === 'groom' ? themeColors.primary : themeColors.cardBg,
            color: expandedSide === 'groom' ? '#FFFFFF' : (themeColors.buttonText || themeColors.text),
            cursor: 'pointer',
            transition: 'all 0.3s',
            opacity: 0,
            ...(isVisible ? { animation: 'mag-cardFlipIn 0.6s ease 0.2s both' } : {}),
          }}
        >
          {dt('GROOM')}
        </button>
        <button
          onClick={() => setExpandedSide(expandedSide === 'bride' ? null : 'bride')}
          style={{
            fontFamily: fonts.display,
            fontSize: '11px',
            letterSpacing: '2px',
            padding: '12px',
            border: `0.5px solid ${expandedSide === 'bride' ? themeColors.primary : themeColors.divider}`,
            background: expandedSide === 'bride' ? themeColors.primary : themeColors.cardBg,
            color: expandedSide === 'bride' ? '#FFFFFF' : (themeColors.buttonText || themeColors.text),
            cursor: 'pointer',
            transition: 'all 0.3s',
            opacity: 0,
            ...(isVisible ? { animation: 'mag-cardFlipIn 0.6s ease 0.4s both' } : {}),
          }}
        >
          {dt('BRIDE')}
        </button>
      </div>

      {expandedSide && (
        <div className="transition-all duration-300" style={{ padding: '12px 16px', background: themeColors.cardBg }}>
          {renderAccounts(expandedSide)}
        </div>
      )}
    </div>
  )
}

// ===== Guestbook Section =====
const sampleGuestbookMessages = [
  { id: 'sample-1', guest_name: '김지은', message: '두 분의 결혼을 진심으로 축하드려요! 항상 행복하세요', question: '두 사람에게 해주고 싶은 말은?', created_at: '2025-05-20T10:30:00Z' },
  { id: 'sample-2', guest_name: '이준호', message: '결혼 축하해! 행복하게 잘 살아~', question: '두 사람에게 해주고 싶은 말은?', created_at: '2025-05-19T14:20:00Z' },
  { id: 'sample-3', guest_name: '박서윤', message: '예쁜 커플 결혼 축하드립니다. 오래오래 사랑하세요!', question: '두 사람에게 해주고 싶은 말은?', created_at: '2025-05-18T09:15:00Z' },
  { id: 'sample-4', guest_name: '최민수', message: '서로 배려하고 존중하는 마음이 가장 중요한 것 같아요', question: '결혼생활에서 가장 중요한 건?', created_at: '2025-05-17T16:45:00Z' },
  { id: 'sample-5', guest_name: '정하나', message: '처음 봤을 때 정말 잘 어울린다고 생각했어요!', question: '두 사람의 첫인상은 어땠나요?', created_at: '2025-05-16T11:30:00Z' },
  { id: 'sample-6', guest_name: '강민지', message: '행복한 가정 꾸리세요! 축하합니다', question: '두 사람에게 해주고 싶은 말은?', created_at: '2025-05-15T08:00:00Z' },
]

function GuestbookSection({ invitation, invitationId, fonts, themeColors, isSample, bgOverride }: {
  invitation: any; invitationId: string; fonts: FontConfig; themeColors: ColorConfig; isSample?: boolean; bgOverride?: string
}) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const { ref, isVisible } = useScrollReveal()
  const [messages, setMessages] = useState<any[]>(isSample ? sampleGuestbookMessages : [])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAllMessages, setShowAllMessages] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const questions: string[] = invitation.content?.guestbookQuestions || []
  const currentQuestion = questions[currentQuestionIndex] || '두 사람에게 하고 싶은 말을 남겨주세요'

  useEffect(() => {
    if (isSample) return
    fetch(`/api/guestbook?invitationId=${invitationId}`)
      .then(r => r.json())
      .then((data: any) => setMessages(data.messages || data.data || []))
      .catch(() => {})
  }, [invitationId, isSample])

  const handleNextQuestion = () => {
    if (questions.length > 1) {
      setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return

    if (isSample) {
      const newMessage = {
        id: `sample-${Date.now()}`,
        guest_name: name.trim(),
        message: message.trim(),
        question: questions[currentQuestionIndex] || null,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [newMessage, ...prev])
      setName(''); setMessage('')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: name.trim(),
          message: message.trim(),
          question: questions[currentQuestionIndex] || null,
        }),
      })
      if (res.ok) {
        const data = await res.json() as any
        setMessages(prev => [data.data || data, ...prev])
        setName(''); setMessage('')
      }
    } catch {}
    setSubmitting(false)
  }

  return (
    <div ref={ref} className="px-6 py-12" style={{ backgroundColor: bgOverride || themeColors.background }}>
      <div className="text-center mb-8" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 0.7s ease both' } : {}) }}>
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '8px' }}>
          {dt('MESSAGES')}
        </div>
        <h3 style={{ fontFamily: fonts.display, fontSize: '20px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary }}>
          {dt('GUESTBOOK')}
        </h3>
      </div>

      {/* Question */}
      <div className="text-center mb-6">
        <p
          key={`${currentQuestionIndex}-${isVisible}`}
          style={{
            fontFamily: fonts.displayKr,
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: 1.7,
            color: themeColors.text,
            minHeight: '24px',
            display: 'inline',
            backgroundImage: `linear-gradient(${themeColors.primary}25, ${themeColors.primary}25)`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'left bottom',
            backgroundSize: '0% 40%',
            ...(isVisible ? { animation: 'mag-highlightDraw 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both' } : {}),
            paddingBottom: '2px',
          }}
        >
          {currentQuestion}
        </p>
        {questions.length > 1 && (
          <button
            onClick={handleNextQuestion}
            style={{
              fontFamily: fonts.body,
              fontSize: '11px',
              color: themeColors.gray,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginTop: '8px',
              letterSpacing: '1px',
              display: 'block',
              width: '100%',
            }}
          >
            다른 질문 보기 &rarr;
          </button>
        )}
      </div>

      {/* Form */}
      <div className="mb-8 space-y-3" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-formFadeIn 0.7s ease 0.2s both' } : {}) }}>
        <input
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
            placeholder="이름"
            maxLength={20}
            style={{ fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, outline: 'none', width: '100%', color: themeColors.buttonText || themeColors.text }}
          />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
          placeholder="메시지를 남겨주세요 (100자 이내)"
          rows={3}
          maxLength={100}
          style={{ fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, outline: 'none', width: '100%', resize: 'none', color: themeColors.buttonText || themeColors.text }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%',
            fontFamily: fonts.display,
            fontSize: '11px',
            letterSpacing: '3px',
            padding: '12px',
            background: themeColors.primary,
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          {dt('LEAVE A MESSAGE')}
        </button>
      </div>

      {/* Messages */}
      {messages.length === 0 ? (
        <p className="text-center" style={{ fontFamily: fonts.body, fontSize: '12px', color: themeColors.gray, padding: '20px 0' }}>
          아직 방명록이 없습니다. 첫 번째로 메시지를 남겨보세요!
        </p>
      ) : (
        <div className="space-y-3">
          {(showAllMessages ? messages : messages.slice(0, 5)).map((msg: any, i: number) => (
            <div key={msg.id || i} style={{ padding: '14px 16px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, opacity: 0, ...(isVisible ? { animation: `${i % 2 === 0 ? 'mag-msgSlideOdd' : 'mag-msgSlideEven'} 0.6s ease ${0.3 + i * 0.1}s both` } : {}) }}>
              {msg.question && (
                <p style={{ fontFamily: fonts.body, fontSize: '10px', color: themeColors.gray, marginBottom: '6px', opacity: 0.7 }}>
                  Q. {msg.question}
                </p>
              )}
              <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: themeColors.text, marginBottom: '8px', whiteSpace: 'pre-line' }}>{msg.message}</p>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: fonts.body, fontSize: '11px', fontWeight: 500, color: themeColors.gray }}>— {msg.guest_name}</span>
                <span style={{ fontFamily: fonts.display, fontSize: '10px', color: themeColors.gray, opacity: 0.5 }}>
                  {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          ))}
          {!showAllMessages && messages.length > 5 && (
            <button
              onClick={() => setShowAllMessages(true)}
              className="w-full py-3 text-center"
              style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.primary, border: `0.5px solid ${themeColors.divider}`, background: 'transparent' }}
            >
              +{messages.length - 5} {dt('MORE MESSAGES')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ===== RSVP Section =====
function RsvpSection({ invitation, invitationId, fonts, themeColors, bgOverride }: {
  invitation: any; invitationId: string; fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string
}) {
  const dt = (text: string) => fonts.isScript ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const { ref, isVisible } = useScrollReveal()
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState<'yes' | 'no' | 'maybe'>('yes')
  const [guestCount, setGuestCount] = useState(1)
  const [rsvpMessage, setRsvpMessage] = useState('')
  const [side, setSide] = useState<'groom' | 'bride' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mealAttendance, setMealAttendance] = useState<'' | 'yes' | 'no'>('')
  const [shuttleBus, setShuttleBus] = useState<'' | 'yes' | 'no'>('')

  if (!invitation.rsvpEnabled) return null

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: name,
          attendance: ({ yes: 'attending', no: 'not_attending', maybe: 'pending' } as Record<string, string>)[attendance] || attendance,
          guestCount: attendance === 'yes' ? guestCount : 0,
          message: rsvpMessage,
          side: side || undefined,
          mealAttendance: attendance === 'yes' && mealAttendance ? mealAttendance : undefined,
          shuttleBus: attendance === 'yes' && shuttleBus ? shuttleBus : undefined,
        }),
      })
      if (res.ok) setSubmitted(true)
    } catch {}
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="px-6 py-16 text-center" style={{ backgroundColor: bgOverride || themeColors.sectionBg }}>
        <div style={{ fontFamily: fonts.display, fontSize: '24px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary, marginBottom: '12px' }}>
          RECEIVED
        </div>
        <p style={{ fontFamily: fonts.body, fontSize: '13px', color: themeColors.gray }}>
          참석 여부가 전달되었습니다. 감사합니다.
        </p>
      </div>
    )
  }

  return (
    <div ref={ref} className="px-6 py-12" style={{ backgroundColor: bgOverride || themeColors.sectionBg }}>
      <div className="text-center mb-8" style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 0.8s ease both' } : {}) }}>
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '8px' }}>
          {dt('ATTENDANCE')}
        </div>
        <h3 style={{ fontFamily: fonts.display, fontSize: '20px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary }}>
          {dt('RSVP')}
        </h3>
        {invitation.rsvpNotice && (
          <p style={{ fontFamily: fonts.body, fontSize: '12px', color: themeColors.gray, textAlign: 'center', lineHeight: 1.6, marginTop: '10px', whiteSpace: 'pre-line' }}>{invitation.rsvpNotice}</p>
        )}
      </div>

      <div style={{ background: '#FFFFFF', padding: '24px 20px', border: `0.5px solid ${themeColors.divider}`, transformOrigin: 'top center', opacity: 0, ...(isVisible ? { animation: 'mag-paperUnfold 1.2s cubic-bezier(0.22,1,0.36,1) 0.3s both' } : {}) }}>
      <div className="space-y-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
          placeholder="성함"
          style={{ fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, outline: 'none', width: '100%', color: themeColors.buttonText || themeColors.text }}
        />

        <div className="grid grid-cols-2 gap-2">
          {([{ value: 'groom' as const, label: '신랑측' }, { value: 'bride' as const, label: '신부측' }]).map(opt => (
            <button
              key={opt.value}
              onClick={() => setSide(side === opt.value ? null : opt.value)}
              style={{
                fontFamily: fonts.body,
                fontSize: '13px',
                padding: '12px',
                border: `0.5px solid ${side === opt.value ? themeColors.primary : themeColors.divider}`,
                background: side === opt.value ? themeColors.primary : themeColors.cardBg,
                color: side === opt.value ? '#FFFFFF' : (themeColors.buttonText || themeColors.text),
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['yes', 'maybe', 'no'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setAttendance(opt)}
              style={{
                fontFamily: fonts.body,
                fontSize: '13px',
                padding: '12px',
                border: `0.5px solid ${attendance === opt ? themeColors.primary : themeColors.divider}`,
                background: attendance === opt ? themeColors.primary : themeColors.cardBg,
                color: attendance === opt ? '#FFFFFF' : (themeColors.buttonText || themeColors.text),
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {{ yes: '참석', maybe: '미정', no: '불참' }[opt]}
            </button>
          ))}
        </div>

        {attendance === 'yes' && invitation.rsvpAllowGuestCount && (
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: fonts.body, fontSize: '13px', color: themeColors.gray }}>참석 인원</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                style={{ width: '32px', height: '32px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, cursor: 'pointer', fontSize: '16px', color: themeColors.buttonText || themeColors.text }}
              >
                -
              </button>
              <span style={{ fontFamily: fonts.display, fontSize: '14px', width: '32px', textAlign: 'center', color: themeColors.buttonText || themeColors.text }}>{guestCount}</span>
              <button
                onClick={() => setGuestCount(guestCount + 1)}
                style={{ width: '32px', height: '32px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, cursor: 'pointer', fontSize: '16px', color: themeColors.buttonText || themeColors.text }}
              >
                +
              </button>
            </div>
          </div>
        )}

        {invitation.rsvpMealOption && attendance === 'yes' && (
          <div>
            <span style={{ fontFamily: fonts.body, fontSize: '13px', color: themeColors.gray, display: 'block', marginBottom: '6px' }}>식사 여부</span>
            <div className="grid grid-cols-2 gap-2">
              {([{ v: 'yes' as const, l: '식사 예정' }, { v: 'no' as const, l: '식사 안 함' }]).map(opt => (
                <button key={opt.v} onClick={() => setMealAttendance(mealAttendance === opt.v ? '' : opt.v)}
                  style={{ fontFamily: fonts.body, fontSize: '13px', padding: '12px', border: `0.5px solid ${mealAttendance === opt.v ? themeColors.primary : themeColors.divider}`, background: mealAttendance === opt.v ? themeColors.primary : themeColors.cardBg, color: mealAttendance === opt.v ? '#FFFFFF' : (themeColors.buttonText || themeColors.text), cursor: 'pointer', transition: 'all 0.3s' }}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {invitation.rsvpShuttleOption && attendance === 'yes' && (
          <div>
            <span style={{ fontFamily: fonts.body, fontSize: '13px', color: themeColors.gray, display: 'block', marginBottom: '6px' }}>대절버스 이용 여부</span>
            <div className="grid grid-cols-2 gap-2">
              {([{ v: 'yes' as const, l: '이용 예정' }, { v: 'no' as const, l: '이용 안 함' }]).map(opt => (
                <button key={opt.v} onClick={() => setShuttleBus(shuttleBus === opt.v ? '' : opt.v)}
                  style={{ fontFamily: fonts.body, fontSize: '13px', padding: '12px', border: `0.5px solid ${shuttleBus === opt.v ? themeColors.primary : themeColors.divider}`, background: shuttleBus === opt.v ? themeColors.primary : themeColors.cardBg, color: shuttleBus === opt.v ? '#FFFFFF' : (themeColors.buttonText || themeColors.text), cursor: 'pointer', transition: 'all 0.3s' }}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={rsvpMessage}
          onChange={e => setRsvpMessage(e.target.value)}
          placeholder="전하고 싶은 말 (선택)"
          rows={2}
          onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
          style={{ fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, outline: 'none', width: '100%', resize: 'none', color: themeColors.buttonText || themeColors.text }}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%',
            fontFamily: fonts.display,
            fontSize: '11px',
            letterSpacing: '3px',
            padding: '14px',
            background: themeColors.primary,
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          {dt('SUBMIT')}
        </button>
      </div>
      </div>
    </div>
  )
}

// ===== Footer =====
function MagazineFooter({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal({ rootMargin: '0px 0px 0px 0px' })
  const groomEn = invitation.groom?.nameEn || ''
  const brideEn = invitation.bride?.nameEn || ''
  const hasEnglishNames = groomEn || brideEn
  return (
    <div ref={ref} className="px-6 py-8 text-center" style={{ backgroundColor: themeColors.background, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '0.5px', background: themeColors.divider, transformOrigin: 'left', transform: 'scaleX(0)', ...(isVisible ? { animation: 'mag-borderDrawRight 0.8s ease both' } : {}) }} />
      {hasEnglishNames && (
        <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '3px', color: themeColors.divider, opacity: 0, marginBottom: '6px', ...(isVisible ? { animation: 'mag-footerTextFade 0.6s ease 0.4s both' } : {}) }}>
          {groomEn} & {brideEn}
        </div>
      )}
      <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '2px', color: themeColors.divider, opacity: 0, ...(isVisible ? { animation: 'mag-footerTextFade 0.6s ease 0.6s both' } : {}) }}>
        2026. dear drawer. All rights reserved.
      </div>
    </div>
  )
}

// ===== Gallery Lightbox =====
function GalleryLightbox({ images, isOpen, initialIndex, onClose }: { images: string[]; isOpen: boolean; initialIndex: number; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => { setCurrentIndex(initialIndex) }, [initialIndex])

  if (!isOpen) return null

  const resolvedImages = images.map(extractImageUrl).filter(Boolean)

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl z-10 w-10 h-10 flex items-center justify-center">
        &times;
      </button>
      <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm opacity-60">
        {currentIndex + 1} / {resolvedImages.length}
      </div>
      {resolvedImages[currentIndex] && (
        <img
          src={resolvedImages[currentIndex]}
          alt=""
          className="max-w-full max-h-full object-contain"
          onClick={e => { e.stopPropagation(); if (resolvedImages.length > 1) setCurrentIndex((currentIndex + 1) % resolvedImages.length) }}
        />
      )}
    </div>
  )
}

// ===== Interview Popup Button =====
function InterviewPopupButton({ fonts, themeColors, bgOverride, onClick }: { fonts: FontConfig; themeColors: ColorConfig; bgOverride?: string; onClick: () => void }) {
  const dt = (text: string) => (fonts as any).isScript ? text.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const { ref, isVisible } = useScrollReveal()

  return (
    <div ref={ref} style={{ backgroundColor: bgOverride || themeColors.sectionBg, padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ opacity: 0, ...(isVisible ? { animation: 'mag-sectionFadeIn 1s ease both' } : {}) }}>
        <button
          onClick={onClick}
          style={{
            fontFamily: fonts.displayKr,
            fontSize: '13px',
            letterSpacing: '1px',
            color: themeColors.background,
            border: 'none',
            padding: '16px 32px',
            background: themeColors.primary,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            width: '100%',
            maxWidth: '280px',
          }}
        >
          신랑신부 인터뷰 보러가기
        </button>
      </div>
    </div>
  )
}

// ===== Interview Popup (Fullscreen Modal inside mobile frame) =====
function InterviewPopup({ invitation, fonts, themeColors, isOpen, onClose }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig; isOpen: boolean; onClose: () => void }) {
  const dt = (text: string) => (fonts as any).isScript ? text.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text
  const interviews = invitation.interviews?.length ? invitation.interviews : invitation.content?.interviews || []
  const [animating, setAnimating] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAnimating(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!animating && !isOpen) return null
  if (interviews.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px', height: '100vh',
      zIndex: 200, pointerEvents: visible ? 'auto' : 'none',
    }}>
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }} onClick={onClose} />

      {/* Modal panel */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: themeColors.background,
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          flexShrink: 0,
          borderBottom: `1px solid ${themeColors.divider}`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '5px', color: themeColors.gray, marginBottom: '2px' }}>
              {dt('EXCLUSIVE')}
            </div>
            <span style={{ fontFamily: fonts.display, fontSize: '12px', letterSpacing: '4px', color: themeColors.primary, fontWeight: 300 }}>
              {dt('INTERVIEW')}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: themeColors.text, fontSize: '22px',
              background: 'none', border: `1px solid ${themeColors.divider}`,
              cursor: 'pointer', lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ paddingTop: '24px', paddingBottom: '40px' }}>
            {interviews.map((item: any, idx: number) => (
              <InterviewCard key={idx} item={item} index={idx} fonts={fonts} themeColors={themeColors} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Global Styles =====
const globalStyles = `
  .desktop-frame-wrapper {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    background: #f0f0f0;
  }
  .mobile-frame {
    width: 100%;
    max-width: 430px;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 0 40px rgba(0,0,0,0.1);
  }
  .mobile-frame-screen {
    position: relative;
    width: 100%;
    min-height: 100vh;
  }
  .mobile-frame-content {
    width: 100%;
    min-height: 100vh;
  }
  .mobile-frame-fixed-ui {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    height: 100vh;
    pointer-events: none;
    z-index: 100;
  }
  .mobile-frame-fixed-ui > * {
    pointer-events: auto;
  }
  @media (max-width: 430px) {
    .desktop-frame-wrapper {
      background: #fff;
    }
    .mobile-frame {
      box-shadow: none;
    }
  }
`

// ===== Transform DB data =====
function transformToDisplayData(invitation: Invitation, content: InvitationContent | null) {
  if (!content) return null

  return {
    id: invitation.id,
    colorTheme: (content.colorTheme || 'modern-black') as ColorTheme,
    fontStyle: (content.fontStyle || 'modern') as FontStyle,
    groom: content.groom || {},
    bride: content.bride || {},
    wedding: { ...(content.wedding || {}), timeDisplay: content.wedding?.timeDisplay || invitation.wedding_time || formatTimeToDisplay(content.wedding?.time) || '' },
    relationship: content.relationship || {},
    content: content.content || {},
    gallery: content.gallery || {},
    media: content.media || {},
    rsvpEnabled: content.rsvpEnabled ?? true,
    rsvpDeadline: content.rsvpDeadline || '',
    rsvpAllowGuestCount: content.rsvpAllowGuestCount ?? true,
    rsvpMealOption: content.rsvpMealOption ?? false,
    rsvpShuttleOption: content.rsvpShuttleOption ?? false,
    rsvpNotice: content.rsvpNotice ?? '',
    sectionVisibility: content.sectionVisibility || {},
    design: content.design || {},
    bgm: content.bgm || {},
    guidance: content.guidance || {},
    interviews: (content as any).interviews?.length ? (content as any).interviews : (content as any).content?.interviews || [],
    intro: content.intro,
    youtube: content.youtube,
    customAccentColor: (content as any).customAccentColor,
    customBgColor: (content as any).customBgColor,
    customSectionBgColor: (content as any).customSectionBgColor,
    sectionTextColor: (content as any).sectionTextColor,
    accentTextColor: (content as any).accentTextColor || (content as any).colors?.accent,
    bodyTextColor: (content as any).bodyTextColor || (content as any).colors?.text,
    displayFont: (content as any).displayFont,
    deceasedDisplayStyle: content.deceasedDisplayStyle || 'flower',
    magazineIntroStyle: (content as any).magazineIntroStyle || 'cover',
    profileFrameShape: (content as any).profileFrameShape || 'circle',
    magazineSectionOrder: content.magazineSectionOrder,
    magazineSectionBgMap: (content as any).magazineSectionBgMap,
    styleOverrides: (content as any).styleOverrides,
    editorsNoteImage: (content as any).editorsNoteImage,
    editorsNoteImageSettings: (content as any).editorsNoteImageSettings,
    editorsNoteImageRatio: (content as any).editorsNoteImageRatio,
    interviewDisplay: (content as any).interviewDisplay,
    mapButtons: (content as any).mapButtons,
    magazineSectionTitles: (content as any).magazineSectionTitles,
  }
}

// 영문 디스플레이 폰트 맵
const displayFontMap: Record<string, string> = {
  playfair: "'Playfair Display', serif",
  cinzel: "'Cinzel', serif",
  montserrat: "'Montserrat', sans-serif",
  garamond: "'EB Garamond', serif",
  cormorant: "'Cormorant Garamond', serif",
  greatvibes: "'Great Vibes', cursive",
  lora: "'Lora', serif",
  'made-slab': "'MADELikesSlab', serif",
  italiana: "'Italiana', serif",
  majesty: "'Majesty', serif",
}

const MAGAZINE_DEFAULT_BG: Record<string, 'background' | 'sectionBg'> = {
  meetTheCouple: 'sectionBg',
  featureInterview: 'sectionBg',
  photoSpread: 'background',
  youtube: 'sectionBg',
  theDetails: 'background',
  guidance: 'sectionBg',
  thankYou: 'background',
  contacts: 'sectionBg',
  guestbook: 'background',
  rsvp: 'sectionBg',
}

// ===== Time Format Helper =====
function formatTimeToDisplay(time?: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (isNaN(h)) return ''
  const p = h < 12 ? '오전' : '오후'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${p} ${dh}시` : `${p} ${dh}시 ${m}분`
}

// ===== Main Component =====
function InvitationClientMagazineContent({
  invitation: dbInvitation,
  content,
  isPaid,
  isPreview,
  overrideColorTheme,
  overrideFontStyle,
  skipIntro,
  guestInfo,
  isSample,
}: InvitationClientProps) {
  const invitation = transformToDisplayData(dbInvitation, content)

  const effectiveColorTheme = (overrideColorTheme && overrideColorTheme in colorThemes)
    ? overrideColorTheme as ColorTheme
    : (invitation?.colorTheme && invitation.colorTheme in colorThemes)
      ? invitation.colorTheme as ColorTheme
      : 'modern-black'

  const effectiveFontStyle = (overrideFontStyle && overrideFontStyle in fontStyles)
    ? overrideFontStyle as FontStyle
    : (invitation?.fontStyle && invitation.fontStyle in fontStyles)
      ? invitation.fontStyle as FontStyle
      : 'modern'

  const [currentPage, setCurrentPage] = useState<'cover' | 'main'>(skipIntro ? 'main' : 'cover')
  const audioRef = useRef<HTMLAudioElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [interviewPopupOpen, setInterviewPopupOpen] = useState(false)

  // skipIntro prop 변경 시 페이지 전환 (에디터 미리보기용)
  useEffect(() => {
    setCurrentPage(skipIntro ? 'main' : 'cover')
  }, [skipIntro])

  const baseThemeColors = colorThemes[effectiveColorTheme]
  // 사용자 커스텀 색상 오버라이드
  const customAccent = (invitation as any)?.customAccentColor
  const customBodyText = (invitation as any)?.bodyTextColor
  const customAccentText = (invitation as any)?.accentTextColor
  const customBgColor = (invitation as any)?.customBgColor
  const customSectionBgColor = (invitation as any)?.customSectionBgColor
  const customSectionText = (invitation as any)?.sectionTextColor
  const themeColors: ColorConfig = {
    ...baseThemeColors,
    ...(customAccent ? { primary: customAccent, accent: customAccent, divider: customAccent + '60' } : {}),
    ...(customBodyText ? { text: customBodyText, gray: customBodyText + 'CC' } : {}),
    ...(customAccentText ? { highlight: customAccentText } : {}),
    ...(customBgColor ? { background: customBgColor, cardBg: customBgColor } : {}),
    ...(customSectionBgColor ? { sectionBg: customSectionBgColor } : {}),
    ...(customSectionText ? { sectionText: customSectionText } : {}),
  }
  const baseFonts = fontStyles[effectiveFontStyle]
  const isScriptFont = invitation?.displayFont === 'greatvibes'
  const fonts = invitation?.displayFont && displayFontMap[invitation.displayFont]
    ? { ...baseFonts, display: displayFontMap[invitation.displayFont], isScript: isScriptFont }
    : { ...baseFonts, isScript: isScriptFont }
  const dt = (text: string) => isScriptFont ? text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : text

  useEffect(() => { window.scrollTo(0, 0) }, [currentPage])

  if (!invitation) return null

  const contacts = [
    invitation.groom?.phone && (invitation.groom as any)?.phoneEnabled !== false && { name: invitation.groom.name, phone: invitation.groom.phone, role: '신랑', side: 'groom' as const },
    invitation.groom?.father?.phone && (invitation.groom?.father as any)?.phoneEnabled !== false && { name: invitation.groom.father.name, phone: invitation.groom.father.phone, role: '아버지', side: 'groom' as const },
    invitation.groom?.mother?.phone && (invitation.groom?.mother as any)?.phoneEnabled !== false && { name: invitation.groom.mother.name, phone: invitation.groom.mother.phone, role: '어머니', side: 'groom' as const },
    invitation.bride?.phone && (invitation.bride as any)?.phoneEnabled !== false && { name: invitation.bride.name, phone: invitation.bride.phone, role: '신부', side: 'bride' as const },
    invitation.bride?.father?.phone && (invitation.bride?.father as any)?.phoneEnabled !== false && { name: invitation.bride.father.name, phone: invitation.bride.father.phone, role: '아버지', side: 'bride' as const },
    invitation.bride?.mother?.phone && (invitation.bride?.mother as any)?.phoneEnabled !== false && { name: invitation.bride.mother.name, phone: invitation.bride.mother.phone, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; phone: string; role: string; side: 'groom' | 'bride' }[]

  const accounts = invitation.sectionVisibility?.bankAccounts === false ? [] : [
    invitation.groom?.name && invitation.groom?.bank?.enabled && invitation.groom?.bank?.account && { name: invitation.groom.name, bank: invitation.groom.bank, role: '신랑', side: 'groom' as const },
    (invitation.groom?.father as any)?.bank?.enabled && (invitation.groom?.father as any)?.bank?.account && { name: invitation.groom.father.name, bank: (invitation.groom.father as any).bank, role: '아버지', side: 'groom' as const },
    (invitation.groom?.mother as any)?.bank?.enabled && (invitation.groom?.mother as any)?.bank?.account && { name: invitation.groom.mother.name, bank: (invitation.groom.mother as any).bank, role: '어머니', side: 'groom' as const },
    invitation.bride?.name && invitation.bride?.bank?.enabled && invitation.bride?.bank?.account && { name: invitation.bride.name, bank: invitation.bride.bank, role: '신부', side: 'bride' as const },
    (invitation.bride?.father as any)?.bank?.enabled && (invitation.bride?.father as any)?.bank?.account && { name: invitation.bride.father.name, bank: (invitation.bride.father as any).bank, role: '아버지', side: 'bride' as const },
    (invitation.bride?.mother as any)?.bank?.enabled && (invitation.bride?.mother as any)?.bank?.account && { name: invitation.bride.mother.name, bank: (invitation.bride.mother as any).bank, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; bank: any; role: string; side: 'groom' | 'bride' }[]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles + magazineSectionStyles }} />
      <div className="desktop-frame-wrapper">
        {!isPaid && !isPreview && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px 16px', backgroundColor: 'rgba(0, 0, 0, 0.9)',
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '13px', fontWeight: 500 }}>
              결제 후 워터마크가 제거됩니다
            </span>
          </div>
        )}
        <div className="mobile-frame">
          <div className="mobile-frame-screen">
            <div className="mobile-frame-content" ref={scrollContainerRef}>
              <WatermarkOverlay isPaid={isPaid || !!isPreview} className="relative w-full min-h-screen">
                <div
                  className="relative w-full min-h-screen overflow-x-hidden"
                  style={{ backgroundColor: themeColors.background, fontFamily: fonts.body, color: themeColors.text }}
                >
                  {currentPage === 'cover' ? (
                    <MagazineCover
                      invitation={invitation}
                      fonts={fonts}
                      themeColors={themeColors}
                      onEnter={() => setCurrentPage('main')}
                      isPreview={isPreview}
                    />
                  ) : (
                    <>
                      {/* Magazine Nameplate Bar */}
                      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: themeColors.background, borderBottom: `0.5px solid ${themeColors.divider}` }}>
                        <div style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 300, letterSpacing: '3px', color: themeColors.primary }}>
                          {invitation.groom?.name || ''} & {invitation.bride?.name || ''}
                        </div>
                        <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '2px', color: themeColors.gray }}>
                          WEDDING
                        </div>
                      </div>

                      {/* EditorsNote 항상 첫 번째 */}
                      <EditorsNote invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      {/* 동적 섹션 순서 - relative z-10으로 EditorsNote(sticky) 위를 덮으며 올라옴 */}
                      <div style={{ position: 'relative', zIndex: 10 }}>
                      {(() => {
                        const sectionBgMap: Record<string, 'background' | 'sectionBg'> = invitation.magazineSectionBgMap || MAGAZINE_DEFAULT_BG
                        const getBg = (id: string) => themeColors[sectionBgMap[id] || MAGAZINE_DEFAULT_BG[id] || 'sectionBg']
                        const sectionTextColor = (themeColors as any).sectionText
                        const getColors = (id: string) => {
                          const isSec = (sectionBgMap[id] || MAGAZINE_DEFAULT_BG[id] || 'sectionBg') === 'sectionBg'
                          if (sectionTextColor && isSec) {
                            return { ...themeColors, text: sectionTextColor, gray: sectionTextColor + 'CC', buttonText: themeColors.text }
                          }
                          return { ...themeColors, buttonText: themeColors.text }
                        }
                        const so = (invitation as any).styleOverrides as StyleOverrides | undefined
                        // Map magazine sectionId → styleOverrides sectionId
                        const soMap: Record<string, string> = {
                          meetTheCouple: 'couple', featureInterview: 'interview',
                          photoSpread: 'gallery', theDetails: 'info',
                          guidance: 'info', thankYou: 'thankYou',
                          contacts: 'info', guestbook: 'guestbook', rsvp: 'rsvp',
                        }
                        return (invitation.magazineSectionOrder || ['meetTheCouple', 'featureInterview', 'photoSpread', 'youtube', 'theDetails', 'guidance', 'thankYou', 'contacts', 'guestbook', 'rsvp']).map((sectionId: string) => {
                          if (isHidden(so, sectionId)) return null
                          const padStyle = getSectionPaddingStyle(so, soMap[sectionId] || sectionId, 0, 0)
                          const hasSpacing = Object.keys(padStyle).length > 0 && Object.values(padStyle).some(v => v !== 0)
                          const wrapStyle = hasSpacing ? padStyle : undefined
                          const wrap = (el: React.ReactNode) => wrapStyle ? <div key={sectionId} style={wrapStyle}>{el}</div> : el
                          switch (sectionId) {
                            case 'meetTheCouple':
                              return wrap(<MeetTheCouple key={wrapStyle ? undefined : sectionId} invitation={invitation} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} />)
                            case 'featureInterview':
                              if (invitation.sectionVisibility?.interview === false) return null
                              if (invitation.interviewDisplay === 'popup') {
                                return wrap(<InterviewPopupButton key={wrapStyle ? undefined : sectionId} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} onClick={() => setInterviewPopupOpen(true)} />)
                              }
                              return wrap(<FeatureInterview key={wrapStyle ? undefined : sectionId} invitation={invitation} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} />)
                            case 'photoSpread':
                              return wrap(<PhotoSpread key={wrapStyle ? undefined : sectionId} invitation={invitation} fonts={fonts} themeColors={getColors(sectionId)} onOpenLightbox={(idx) => { setLightboxIndex(idx); setLightboxOpen(true) }} bgOverride={getBg(sectionId)} />)
                            case 'youtube':
                              return wrap(<YouTubeSection key={wrapStyle ? undefined : sectionId} invitation={invitation} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} />)
                            case 'theDetails':
                              return wrap(<TheDetails key={wrapStyle ? undefined : sectionId} invitation={invitation} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} />)
                            case 'guidance':
                              return wrap(<GuidanceInfoSection key={wrapStyle ? undefined : sectionId} invitation={invitation} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} />)
                            case 'thankYou':
                              return wrap(<ThankYouSection key={wrapStyle ? undefined : sectionId} invitation={invitation} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} />)
                            case 'contacts':
                              if (invitation.sectionVisibility?.bankAccounts === false) return null
                              return (invitation as any).magazineLayout?.bankAccountsInMain !== false
                                ? wrap(<ContactsSection key={wrapStyle ? undefined : sectionId} invitation={invitation} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} />)
                                : null
                            case 'guestbook':
                              if (invitation.sectionVisibility?.guestbook === false) return null
                              return wrap(<GuestbookSection key={wrapStyle ? undefined : sectionId} invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} themeColors={getColors(sectionId)} isSample={isSample} bgOverride={getBg(sectionId)} />)
                            case 'rsvp':
                              if (invitation.rsvpEnabled === false) return null
                              return (invitation as any).magazineLayout?.rsvpInMain !== false
                                ? wrap(<RsvpSection key={wrapStyle ? undefined : sectionId} invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} themeColors={getColors(sectionId)} bgOverride={getBg(sectionId)} />)
                                : null
                            default:
                              return null
                          }
                        })
                      })()}
                      {/* MagazineFooter 항상 마지막 */}
                      <MagazineFooter invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      </div>
                    </>
                  )}

                  {/* BGM */}
                  {invitation.bgm?.enabled && invitation.bgm?.url && (
                    <audio ref={audioRef} loop preload="auto">
                      <source src={invitation.bgm.url} type="audio/mpeg" />
                    </audio>
                  )}
                </div>
              </WatermarkOverlay>
            </div>

            {/* Fixed UI */}
            <div className="mobile-frame-fixed-ui">
              {currentPage === 'main' && !isPreview && (
                <GuestFloatingButton
                  themeColors={themeColors}
                  fonts={fonts}
                  openModal="none"
                  onModalClose={() => {}}
                  showTooltip={false}
                  scrollContainerRef={scrollContainerRef}
                  navStyle={content?.navStyle || 'hamburger'}
                  invitation={{
                    venue_name: invitation.wedding?.venue?.name || '',
                    venue_address: invitation.wedding?.venue?.address || '',
                    contacts,
                    accounts,
                    directions: invitation.wedding?.directions,
                    rsvpEnabled: invitation.rsvpEnabled,
                    rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
                    rsvpMealOption: invitation.rsvpMealOption,
                    rsvpShuttleOption: invitation.rsvpShuttleOption,
                    rsvpNotice: invitation.rsvpNotice,
                    invitationId: dbInvitation.id,
                    groomName: invitation.groom?.name || '',
                    brideName: invitation.bride?.name || '',
                    weddingDate: invitation.wedding?.date || '',
                    weddingTime: invitation.wedding?.timeDisplay || invitation.wedding?.time || '',
                    thumbnailUrl: content?.meta?.kakaoThumbnail || content?.meta?.ogImage || extractImageUrl(invitation.media?.coverImage) || '',
                    shareTitle: content?.meta?.title,
                    shareDescription: content?.meta?.description,
                  }}
                />
              )}
              {invitation.bgm?.enabled && invitation.bgm?.url && (
                <MusicToggle audioRef={audioRef} isVisible={currentPage === 'main'} shouldAutoPlay={currentPage === 'main' && invitation.bgm?.autoplay === true} />
              )}
              <GalleryLightbox
                images={invitation.gallery?.images || []}
                isOpen={lightboxOpen}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
              />
              <InterviewPopup
                invitation={invitation}
                fonts={fonts}
                themeColors={themeColors}
                isOpen={interviewPopupOpen}
                onClose={() => setInterviewPopupOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function InvitationErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h2 className="text-lg font-medium mb-2">청첩장을 불러오는 중 오류가 발생했습니다</h2>
      <p className="text-sm text-gray-500 mb-4">잠시 후 다시 시도해주세요</p>
      <button onClick={resetError} className="px-4 py-2 bg-black text-white text-sm">다시 시도</button>
    </div>
  )
}

export default function InvitationClientMagazine(props: InvitationClientProps) {
  return (
    <ErrorBoundary fallback={<InvitationErrorFallback resetError={() => window.location.reload()} />}>
      <InvitationClientMagazineContent {...props} />
    </ErrorBoundary>
  )
}
