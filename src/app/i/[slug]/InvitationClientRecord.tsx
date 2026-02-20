'use client'

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'

// Preview context - skip scroll reveal animations in editor preview
const PreviewModeContext = createContext(false)

// ===== Types =====
type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral' | 'film-dark' | 'film-light' | 'record-coral' | 'record-rose' | 'record-peach' | 'record-bw' | 'record-lilac' | 'record-mint'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string; highlight?: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#C41050', secondary: '#B8956A', accent: '#B8956A', background: '#FFF8F5', sectionBg: '#FFE8E8', cardBg: '#FFFFFF', divider: '#d4b896', text: '#3d3d3d', gray: '#555555' },
  'modern-black': { primary: '#111111', secondary: '#555555', accent: '#111111', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#3d3d3d', gray: '#555555', highlight: '#888888' },
  'romantic-blush': { primary: '#A67A7A', secondary: '#8a7068', accent: '#8a7068', background: '#FDF8F6', sectionBg: '#F8EFEC', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#3d3d3d', gray: '#555555' },
  'nature-green': { primary: '#3A5A3A', secondary: '#6A7A62', accent: '#5A7A52', background: '#F5F7F4', sectionBg: '#EBF0E8', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3d3d3d', gray: '#555555', highlight: '#5A8A52' },
  'luxury-navy': { primary: '#0f2035', secondary: '#8A6A3A', accent: '#8A6A3A', background: '#F8F9FA', sectionBg: '#E8ECF0', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#3d3d3d', gray: '#555555', highlight: '#8A6A3A' },
  'sunset-coral': { primary: '#B85040', secondary: '#B88060', accent: '#B8683A', background: '#FFFAF7', sectionBg: '#FFEEE5', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#3d3d3d', gray: '#555555' },
  'film-dark': { primary: '#E8E4DF', secondary: '#2C2C2E', accent: '#B8977E', background: '#1C1C1E', sectionBg: '#2C2C2E', cardBg: '#3A3A3C', divider: '#48484A', text: '#E8E4DF', gray: '#8E8E93' },
  'film-light': { primary: '#1A1A1A', secondary: '#F5F5F5', accent: '#B8977E', background: '#FFFFFF', sectionBg: '#F8F6F3', cardBg: '#FFFFFF', divider: '#E5E0DA', text: '#1A1A1A', gray: '#999999' },
  'record-coral': {
    primary: '#E89B8F',
    secondary: '#F5F1ED',
    accent: '#D4766A',
    background: '#FAF7F4',
    sectionBg: '#F5F1ED',
    cardBg: '#FFFFFF',
    divider: '#E8DDD5',
    text: '#3D3D3D',
    gray: '#888888',
  },
  'record-rose': {
    primary: '#E07088',
    secondary: '#FFF0F3',
    accent: '#D45C78',
    background: '#FFF5F7',
    sectionBg: '#FFF0F3',
    cardBg: '#FFFFFF',
    divider: '#F5C8D5',
    text: '#3D3D3D',
    gray: '#888888',
  },
  'record-peach': {
    primary: '#E8885A',
    secondary: '#FFF2EA',
    accent: '#DD7548',
    background: '#FFF7F0',
    sectionBg: '#FFF2EA',
    cardBg: '#FFFFFF',
    divider: '#F5D5C0',
    text: '#3D3D3D',
    gray: '#888888',
  },
  'record-bw': {
    primary: '#1A1A1A',
    secondary: '#F5F5F5',
    accent: '#333333',
    background: '#FFFFFF',
    sectionBg: '#F7F7F7',
    cardBg: '#FFFFFF',
    divider: '#E0E0E0',
    text: '#1A1A1A',
    gray: '#999999',
  },
  'record-lilac': {
    primary: '#BDB0D0',
    secondary: '#F3F0F7',
    accent: '#A89BBF',
    background: '#FAF8FC',
    sectionBg: '#F3F0F7',
    cardBg: '#FFFFFF',
    divider: '#D8D2E2',
    text: '#3D3D3D',
    gray: '#888888',
  },
  'record-mint': {
    primary: '#9CAF88',
    secondary: '#F0F3EC',
    accent: '#8A9D78',
    background: '#F8FAF5',
    sectionBg: '#F0F3EC',
    cardBg: '#FFFFFF',
    divider: '#CDD8C2',
    text: '#3D3D3D',
    gray: '#888888',
  },
}

type FontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'
interface FontConfig { display: string; displayKr: string; body: string; scale?: number }

const fontStyles: Record<FontStyle, FontConfig> = {
  classic: { display: "'Playfair Display', serif", displayKr: "'Ridibatang', serif", body: "'Ridibatang', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Pretendard', sans-serif", body: "'Pretendard', sans-serif" },
  romantic: { display: "'Lora', serif", displayKr: "'Okticon', serif", body: "'Okticon', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'JeonnamEducationBarun', sans-serif", body: "'JeonnamEducationBarun', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'ELandChoice', serif", body: "'ELandChoice', serif" },
}

interface GuestInfo { id: string; name: string; relation: string | null; honorific: string; customMessage: string | null }

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

function extractImageUrl(img: unknown): string {
  if (!img) return ''
  if (typeof img === 'string') return img
  if (typeof img === 'object' && img !== null && 'url' in img) return (img as { url: string }).url || ''
  return ''
}

// Image crop style helper - supports both cropX/Y/Width/Height format and legacy scale/position format
function getImageCropStyle(imgUrl: string, s: { scale?: number; positionX?: number; positionY?: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }): React.CSSProperties {
  const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)
  if (hasCropData) {
    const cw = s.cropWidth || 1
    const ch = s.cropHeight || 1
    const cx = s.cropX || 0
    const cy = s.cropY || 0
    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
    return {
      backgroundImage: `url(${imgUrl})`,
      backgroundSize: `${100 / cw}% ${100 / ch}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat',
    }
  }
  return {
    backgroundImage: `url(${imgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
  }
}

function useScrollReveal(threshold = 0.15) {
  const isPreview = useContext(PreviewModeContext)
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(isPreview)
  useEffect(() => {
    if (isPreview) { setIsVisible(true); return }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsVisible(true) }, { threshold })
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, isPreview])
  return { ref, isVisible }
}

// ===== Track Config =====
const TRACK_CONFIG: Record<string, { duration: string; bpm: number }> = {
  '01': { duration: '3:42', bpm: 72 },
  '02': { duration: '2:58', bpm: 85 },
  '03': { duration: '4:15', bpm: 68 },
  '04': { duration: '3:24', bpm: 90 },
  '05': { duration: '5:01', bpm: 76 },
  'bonus': { duration: '2:33', bpm: 60 },
}

// ===== useCurrentTrack Hook =====
function useCurrentTrack() {
  const [currentTrack, setCurrentTrack] = useState(1)
  const [progress, setProgress] = useState(0)
  const trackRefs = useRef<(HTMLDivElement | null)[]>([])

  const setTrackRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    trackRefs.current[index] = el
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const refs = trackRefs.current.filter(Boolean)
      if (refs.length === 0) return

      const viewportCenter = window.scrollY + window.innerHeight / 2

      let closestIdx = 0
      let closestDist = Infinity
      refs.forEach((el, idx) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const elCenter = window.scrollY + rect.top + rect.height / 2
        const dist = Math.abs(viewportCenter - elCenter)
        if (dist < closestDist) { closestDist = dist; closestIdx = idx }
      })

      setCurrentTrack(closestIdx + 1)

      // Calculate progress within current track section
      const currentEl = refs[closestIdx]
      if (currentEl) {
        const rect = currentEl.getBoundingClientRect()
        const sectionTop = window.scrollY + rect.top
        const sectionHeight = rect.height
        const scrollInSection = window.scrollY + window.innerHeight - sectionTop
        const prog = Math.max(0, Math.min(1, scrollInSection / sectionHeight))
        setProgress(prog)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { currentTrack, progress, setTrackRef }
}

// ===== Music Toggle =====
function MusicToggle({ audioRef, isVisible, shouldAutoPlay, tc }: { audioRef: React.RefObject<HTMLAudioElement | null>; isVisible: boolean; shouldAutoPlay: boolean; tc: ColorConfig }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const hasAutoPlayed = useRef(false)

  useEffect(() => {
    if (shouldAutoPlay && !hasAutoPlayed.current && audioRef.current) {
      hasAutoPlayed.current = true
      const saved = localStorage.getItem('musicEnabled')
      if (saved === 'false') return
      setTimeout(() => { audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {}) }, 100)
    }
  }, [shouldAutoPlay, audioRef])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause) }
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
    <button onClick={toggle} className="fixed top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110"
      style={{ background: `${tc.sectionBg}E6`, backdropFilter: 'blur(10px)', border: `1px solid ${tc.divider}40`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {isPlaying ? (
        <svg className="w-4 h-4" style={{ color: tc.text }} viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
      ) : (
        <svg className="w-4 h-4" style={{ color: tc.gray }} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
      )}
    </button>
  )
}

// ===== Vinyl Record Cover =====
function VinylRecordCover({ invitation, fonts, tc, onEnter }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; onEnter: () => void
}) {
  const [phase, setPhase] = useState(0)
  const [isSpinning, setIsSpinning] = useState(true)
  const coverImage = extractImageUrl(invitation.media?.coverImage) || '/images/our-cover.png'
  const coverSettings = invitation.media?.coverImageSettings || {}

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const w = invitation.wedding
  const weddingDate = w?.date ? new Date(w.date) : new Date()
  const dateStr = `${String(weddingDate.getFullYear()).slice(2)}.${String(weddingDate.getMonth() + 1).padStart(2, '0')}.${String(weddingDate.getDate()).padStart(2, '0')}`
  const groomName = invitation.groom?.name || '신랑'
  const brideName = invitation.bride?.name || '신부'

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${tc.primary} 0%, ${tc.accent} 100%)` }}>

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      }} />

      {/* Top area - label style */}
      <div className="relative z-10 text-center mb-8" style={{
        opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.8s ease',
      }}>
        <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '5px', color: 'rgba(255,255,255,0.5)' }}>
          A LOVE RECORD
        </div>
      </div>

      {/* Vinyl Record */}
      <div className="relative z-10" style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1)' : 'scale(0.8)',
        transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}>
        <div className="vinyl-record-wrapper" onClick={() => setIsSpinning(!isSpinning)}>
          <div className={`vinyl-disc ${isSpinning ? 'vinyl-spinning' : 'vinyl-paused'}`}>
            <div className="vinyl-photo-bg">
              <div className="w-full h-full" style={getImageCropStyle(coverImage, coverSettings)} />
            </div>
            <div className="vinyl-grooves" />
            <div className="vinyl-label" style={{ background: `linear-gradient(135deg, ${tc.primary}, ${tc.accent})` }} />
          </div>
          <div className="vinyl-play-hint" style={{
            opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.5s ease',
          }}>
            <span style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)' }}>
              {isSpinning ? 'TAP TO PAUSE' : 'TAP TO PLAY'}
            </span>
          </div>
        </div>
      </div>

      {/* Title & Info */}
      <div className="relative z-10 text-center mt-10 px-6" style={{
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s ease 0.3s',
      }}>
        <h1 style={{
          fontFamily: fonts.display, fontSize: '18px', fontWeight: 300, letterSpacing: '5px',
          color: '#FFFFFF', marginBottom: '12px', lineHeight: 1.6,
        }}>
          {invitation.design?.coverTitle || 'Our Love, Our Song'}
        </h1>
        <div style={{ width: '30px', height: '1px', background: 'rgba(255,255,255,0.3)', margin: '0 auto 12px' }} />
        <p style={{ fontFamily: fonts.display, fontSize: '12px', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }}>
          {groomName} & {brideName}
        </p>
        <p style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
          {dateStr}
        </p>
        {invitation.wedding?.venue?.name && (
          <p style={{ fontFamily: fonts.body, fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            {invitation.wedding.venue.name}
          </p>
        )}
      </div>

      {/* Enter button */}
      <div className="relative z-10 mt-12" style={{
        opacity: phase >= 3 ? 1 : 0, transition: 'opacity 1s ease 0.5s',
      }}>
        <button onClick={onEnter} className="transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            fontFamily: fonts.display, fontSize: '10px', letterSpacing: '5px',
            color: '#FFFFFF', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)', padding: '12px 40px', cursor: 'pointer',
            borderRadius: '30px',
          }}>
          PLAY ALBUM
        </button>
      </div>
    </div>
  )
}

// ===== Record Header (Sticky) with Equalizer =====
function RecordHeader({ invitation, fonts, tc, currentTrack, progress }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; currentTrack: number; progress: number
}) {
  const trackNames = ['THE BEGINNING', 'THE COUPLE', 'OUR JOURNEY', 'GALLERY', 'THE WEDDING DAY', 'INFORMATION', 'LINER NOTES']
  const trackName = trackNames[Math.min(currentTrack - 1, trackNames.length - 1)] || ''
  const trackNum = currentTrack <= 5 ? String(currentTrack).padStart(2, '0') : currentTrack === 6 ? 'INFO' : 'B+'

  return (
    <div className="sticky top-0 z-40" style={{ backgroundColor: `${tc.background}F0`, backdropFilter: 'blur(12px)' }}>
      <div className="px-5 py-3 flex items-center justify-center gap-3">
        {/* 3-bar equalizer */}
        <div className="equalizer-container flex items-end gap-[2px]" style={{ height: '14px' }}>
          <div className="equalizer-bar" style={{ width: '2px', background: tc.primary, animationDelay: '0s' }} />
          <div className="equalizer-bar" style={{ width: '2px', background: tc.primary, animationDelay: '0.2s' }} />
          <div className="equalizer-bar" style={{ width: '2px', background: tc.primary, animationDelay: '0.4s' }} />
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: '11px', fontWeight: 500, letterSpacing: '3px', color: tc.text }}>
          {invitation.groom?.name || ''} & {invitation.bride?.name || ''}
        </div>
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.primary }}>
          TRACK {trackNum}
        </span>
      </div>
      {/* Progress bar */}
      <div style={{ height: '2px', background: tc.divider, position: 'relative' }}>
        <div className="mini-player-seekbar" style={{
          height: '100%', background: tc.primary, width: `${progress * 100}%`,
        }} />
      </div>
    </div>
  )
}

// ===== Section Divider =====
function SectionDivider({ type, tc, fonts }: {
  type: 'notes' | 'sideA' | 'sideB' | 'waveform' | 'line'; tc: ColorConfig; fonts: FontConfig
}) {
  if (type === 'notes') {
    return (
      <div className="flex items-center justify-center py-6" style={{ color: `${tc.primary}60` }}>
        <span style={{ fontFamily: fonts.display, fontSize: '12px', letterSpacing: '8px' }}>
          &#9834; &#9835; &#9834; &#9835; &#9834;
        </span>
      </div>
    )
  }

  if (type === 'sideA') {
    return (
      <div className="flex items-center justify-center py-8 gap-4">
        <div style={{ flex: 1, maxWidth: '60px', height: '1px', background: tc.divider }} />
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.gray, opacity: 0.6 }}>
          SIDE A
        </span>
        <div style={{ flex: 1, maxWidth: '60px', height: '1px', background: tc.divider }} />
      </div>
    )
  }

  if (type === 'sideB') {
    return (
      <div className="flex items-center justify-center py-8 gap-4">
        <div style={{ flex: 1, maxWidth: '60px', height: '1px', background: tc.divider }} />
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.gray, opacity: 0.6 }}>
          SIDE B
        </span>
        <div style={{ flex: 1, maxWidth: '60px', height: '1px', background: tc.divider }} />
      </div>
    )
  }

  if (type === 'waveform') {
    return (
      <div className="flex items-center justify-center py-6 px-10">
        <div className="waveform-divider" style={{ width: '100%', height: '20px', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
          {Array.from({ length: 40 }).map((_, i) => {
            const h = Math.sin((i / 40) * Math.PI * 3) * 8 + 4
            return <div key={i} style={{ width: '2px', height: `${h}px`, background: `${tc.primary}30`, borderRadius: '1px' }} />
          })}
        </div>
      </div>
    )
  }

  // line
  return (
    <div className="py-4 px-10">
      <div style={{ height: '1px', background: `${tc.divider}60` }} />
    </div>
  )
}

// ===== TRACK 01: The Beginning (Lyric Sheet Style) =====
function TrackGreeting({ invitation, fonts, tc, trackRef }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; trackRef: (el: HTMLDivElement | null) => void
}) {
  const { ref, isVisible } = useScrollReveal()
  const greeting = invitation.content?.greeting || ''
  const lines = greeting.split('\n').filter(Boolean)

  return (
    <div ref={(el) => { (ref as any).current = el; trackRef(el) }} className="px-5 py-10" style={{ position: 'relative' }}>
      {/* Staff lines background */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            position: 'absolute', left: '20px', right: '20px',
            top: `${20 + i * 15}%`, height: '1px', background: tc.text,
          }} />
        ))}
      </div>

      {/* Track label */}
      <div className="mb-6">
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.primary, opacity: 0.7 }}>
          TRACK 01
        </span>
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '2px', color: tc.gray, marginLeft: '12px', opacity: 0.5 }}>
          {TRACK_CONFIG['01'].duration}
        </span>
      </div>

      {/* Lyric sheet content */}
      <div style={{
        borderLeft: `3px solid ${tc.primary}40`,
        paddingLeft: '20px',
        textAlign: 'left',
      }}>
        {lines.map((line: string, i: number) => (
          <p key={i} className="transition-all" style={{
            fontFamily: fonts.body, fontSize: '13px', lineHeight: 2.4, color: tc.text,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
            transition: `all 0.6s ease ${i * 0.15}s`,
          }}>
            {line}
          </p>
        ))}
      </div>

      {/* Quote */}
      {invitation.content?.quote?.text && (
        <div style={{
          textAlign: 'center', marginTop: '24px', padding: '20px',
          background: `${tc.sectionBg}80`, borderRadius: '0',
          borderTop: `1px solid ${tc.divider}60`,
          borderBottom: `1px solid ${tc.divider}60`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.5s',
        }}>
          <p style={{ fontFamily: fonts.display, fontSize: '11px', fontStyle: 'italic', lineHeight: 1.8, color: tc.accent }}>
            &ldquo;{invitation.content.quote.text}&rdquo;
          </p>
          {invitation.content.quote.author && (
            <p style={{ fontFamily: fonts.display, fontSize: '9px', color: tc.gray, marginTop: '6px', letterSpacing: '2px' }}>
              &mdash; {invitation.content.quote.author}
            </p>
          )}
        </div>
      )}

      {/* Waveform divider at bottom */}
      <div className="mt-8 flex items-center gap-[1.5px] justify-center" style={{ opacity: 0.15 }}>
        {Array.from({ length: 60 }).map((_, i) => {
          const h = Math.sin((i / 60) * Math.PI * 4) * 6 + 3
          return <div key={i} style={{ width: '1.5px', height: `${h}px`, background: tc.primary, borderRadius: '1px' }} />
        })}
      </div>
    </div>
  )
}

// ===== TRACK 02: The Couple (Mini Vinyl Portrait) =====
function TrackCouple({ invitation, fonts, tc, trackRef }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; trackRef: (el: HTMLDivElement | null) => void
}) {
  const { ref, isVisible } = useScrollReveal()
  const groomProfile = invitation.groom?.profile
  const brideProfile = invitation.bride?.profile
  const groomImage = extractImageUrl(groomProfile?.images?.[0])
  const brideImage = extractImageUrl(brideProfile?.images?.[0])
  const groomImgSettings = groomProfile?.imageSettings?.[0] || {}
  const brideImgSettings = brideProfile?.imageSettings?.[0] || {}
  const groomName = invitation.groom?.name || ''
  const brideName = invitation.bride?.name || ''

  return (
    <div ref={(el) => { (ref as any).current = el; trackRef(el) }} className="px-5 py-10">
      {/* Track label */}
      <div className="mb-6 text-center">
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.primary, opacity: 0.7 }}>
          TRACK 02
        </span>
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '2px', color: tc.gray, marginLeft: '12px', opacity: 0.5 }}>
          {TRACK_CONFIG['02'].duration}
        </span>
      </div>

      {/* Mini vinyl portraits */}
      <div className="flex items-center justify-center gap-6" style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.85)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Groom vinyl */}
        <div className="text-center">
          <div className="relative" style={{ width: '120px', height: '120px', margin: '0 auto 12px' }}>
            {groomImage ? (
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden',
                border: `3px solid ${tc.divider}`,
              }}>
                <div className="w-full h-full" style={getImageCropStyle(groomImage, groomImgSettings)} />
              </div>
            ) : (
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: tc.sectionBg, border: `3px solid ${tc.divider}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: fonts.display, fontSize: '24px', color: tc.primary, opacity: 0.3 }}>&#9834;</span>
              </div>
            )}
          </div>
          <p style={{ fontFamily: fonts.display, fontSize: '14px', fontWeight: 500, letterSpacing: '2px', color: tc.text }}>
            {groomName}
          </p>
          {groomProfile?.tag && (
            <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.gray, marginTop: '4px' }}>{groomProfile.tag}</p>
          )}
        </div>

        {/* & separator with notes */}
        <div className="flex flex-col items-center gap-1" style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}>
          <span style={{ fontFamily: fonts.display, fontSize: '10px', color: `${tc.primary}60` }}>&#9834;</span>
          <span style={{ fontFamily: fonts.display, fontSize: '18px', fontWeight: 300, color: tc.primary, letterSpacing: '2px' }}>&</span>
          <span style={{ fontFamily: fonts.display, fontSize: '10px', color: `${tc.primary}60` }}>&#9834;</span>
        </div>

        {/* Bride vinyl */}
        <div className="text-center">
          <div className="relative" style={{ width: '120px', height: '120px', margin: '0 auto 12px' }}>
            {brideImage ? (
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden',
                border: `3px solid ${tc.divider}`,
              }}>
                <div className="w-full h-full" style={getImageCropStyle(brideImage, brideImgSettings)} />
              </div>
            ) : (
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: tc.sectionBg, border: `3px solid ${tc.divider}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: fonts.display, fontSize: '24px', color: tc.primary, opacity: 0.3 }}>&#9835;</span>
              </div>
            )}
          </div>
          <p style={{ fontFamily: fonts.display, fontSize: '14px', fontWeight: 500, letterSpacing: '2px', color: tc.text }}>
            {brideName}
          </p>
          {brideProfile?.tag && (
            <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.gray, marginTop: '4px' }}>{brideProfile.tag}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== TRACK 03: Our Journey (Lyric Book + Staff) =====
function TrackOurJourney({ invitation, fonts, tc, trackRef }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; trackRef: (el: HTMLDivElement | null) => void
}) {
  const { ref, isVisible } = useScrollReveal()
  const interviews = invitation.content?.interviews || []
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  if (interviews.length === 0) return null

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const scrollLeft = el.scrollLeft
    const cardWidth = el.offsetWidth
    const idx = Math.round(scrollLeft / cardWidth)
    setActiveIdx(Math.min(idx, interviews.length - 1))
  }, [interviews.length])

  return (
    <div ref={(el) => { (ref as any).current = el; trackRef(el) }} className="py-10"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.7s ease',
      }}>
      {/* Track label */}
      <div className="px-5 mb-6 flex items-center gap-2">
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.primary, opacity: 0.7 }}>
          TRACK 03
        </span>
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '2px', color: tc.gray, opacity: 0.5 }}>
          {TRACK_CONFIG['03'].duration}
        </span>
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.primary, marginLeft: 'auto', opacity: 0.4 }}>
          VERSE {activeIdx + 1}
        </span>
      </div>

      {/* Lyric cards - horizontal scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="record-lyric-scroll"
        style={{
          display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          padding: '0 20px',
        }}
      >
        {interviews.map((item: any, idx: number) => {
          const images = (item.images || []).map(extractImageUrl).filter(Boolean)
          const mainImg = images[0] || ''
          const lines = (item.answer || '').split('\n').filter(Boolean)
          const trackProgress = ((idx + 1) / interviews.length) * 100
          return (
            <div key={idx} style={{ flex: '0 0 calc(100% - 16px)', scrollSnapAlign: 'center', marginRight: idx < interviews.length - 1 ? '12px' : '0' }}>
              <div style={{
                background: tc.cardBg, borderRadius: '12px', overflow: 'hidden',
                border: `1px solid ${tc.divider}60`,
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                position: 'relative',
              }}>
                {/* Tape corner decoration */}
                <div className="absolute top-2 left-2 w-6 h-6 opacity-20" style={{
                  background: `linear-gradient(135deg, ${tc.primary}40, transparent)`,
                  borderRadius: '0 0 6px 0',
                }} />
                <div className="absolute top-2 right-2 w-6 h-6 opacity-20" style={{
                  background: `linear-gradient(225deg, ${tc.primary}40, transparent)`,
                  borderRadius: '0 0 0 6px',
                }} />

                {/* Image */}
                {mainImg && (() => {
                  const imgSettings = item.imageSettings?.[0] || {}
                  return (
                    <div style={{ aspectRatio: '16/10', overflow: 'hidden' }}>
                      <div className="w-full h-full" style={getImageCropStyle(mainImg, imgSettings)} />
                    </div>
                  )
                })()}

                {/* Question & Answer */}
                <div style={{ padding: '16px 18px' }}>
                  {/* Note marker */}
                  <div className="flex items-start gap-2 mb-2">
                    <span style={{ fontFamily: fonts.display, fontSize: '12px', color: `${tc.primary}50`, lineHeight: 1 }}>&#9834;</span>
                    <p style={{ fontFamily: fonts.display, fontSize: '11px', fontWeight: 600, letterSpacing: '1px', color: tc.primary }}>
                      {item.question}
                    </p>
                  </div>
                  {lines.map((line: string, i: number) => (
                    <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.9, color: tc.text }}>{line}</p>
                  ))}
                </div>

                {/* Individual seekbar per card */}
                <div style={{ padding: '0 18px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '2px', background: tc.divider, borderRadius: '1px', position: 'relative' }}>
                    <div style={{ width: `${trackProgress}%`, height: '100%', background: tc.primary, borderRadius: '1px', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontFamily: fonts.display, fontSize: '7px', color: tc.gray, opacity: 0.6 }}>
                    {idx + 1}/{interviews.length}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation: arrows + dot indicators */}
      {interviews.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 px-5">
          {/* Prev arrow */}
          <button
            onClick={() => {
              const prev = Math.max(0, activeIdx - 1)
              scrollRef.current?.scrollTo({ left: prev * (scrollRef.current?.offsetWidth || 0), behavior: 'smooth' })
            }}
            style={{
              background: 'none', border: `1px solid ${tc.divider}`, borderRadius: '50%',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: activeIdx === 0 ? 'default' : 'pointer', opacity: activeIdx === 0 ? 0.3 : 0.7,
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={tc.text}><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>

          {/* Dots */}
          {interviews.map((_: any, idx: number) => (
            <button key={idx}
              onClick={() => { scrollRef.current?.scrollTo({ left: idx * (scrollRef.current?.offsetWidth || 0), behavior: 'smooth' }) }}
              style={{
                width: activeIdx === idx ? '18px' : '6px', height: '6px', borderRadius: '3px',
                background: activeIdx === idx ? tc.primary : `${tc.divider}`, border: 'none',
                cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
              }} />
          ))}

          {/* Next arrow */}
          <button
            onClick={() => {
              const next = Math.min(interviews.length - 1, activeIdx + 1)
              scrollRef.current?.scrollTo({ left: next * (scrollRef.current?.offsetWidth || 0), behavior: 'smooth' })
            }}
            style={{
              background: 'none', border: `1px solid ${tc.divider}`, borderRadius: '50%',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: activeIdx === interviews.length - 1 ? 'default' : 'pointer', opacity: activeIdx === interviews.length - 1 ? 0.3 : 0.7,
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={tc.text}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ===== TRACK 04: Gallery (Music Player Style) =====
function TrackGallery({ invitation, fonts, tc, onOpenLightbox, trackRef }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; onOpenLightbox: (idx: number) => void; trackRef: (el: HTMLDivElement | null) => void
}) {
  const { ref, isVisible } = useScrollReveal()
  const images = (invitation.gallery?.images || []).map(extractImageUrl).filter(Boolean)
  const [currentIdx, setCurrentIdx] = useState(0)
  if (images.length === 0) return null

  const goNext = () => setCurrentIdx((prev) => (prev + 1) % images.length)
  const goPrev = () => setCurrentIdx((prev) => (prev - 1 + images.length) % images.length)
  const progressPct = ((currentIdx + 1) / images.length) * 100

  return (
    <div ref={(el) => { (ref as any).current = el; trackRef(el) }} className="py-10"
      style={{
        background: `linear-gradient(180deg, ${tc.primary}18 0%, ${tc.background} 100%)`,
      }}>
      <div className="px-5" style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.7s ease',
      }}>
        {/* Large album art photo */}
        <div onClick={() => onOpenLightbox(currentIdx)} style={{
          width: '100%', aspectRatio: '3/4', borderRadius: '16px', overflow: 'hidden',
          cursor: 'pointer', boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          position: 'relative',
        }}>
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${images[currentIdx]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'opacity 0.4s ease',
            }}
          />
          {/* Subtle gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16" style={{
            background: 'linear-gradient(transparent, rgba(0,0,0,0.08))',
          }} />
        </div>

        {/* Track info */}
        <div className="mt-5 flex items-center justify-between">
          <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: tc.primary, opacity: 0.7 }}>
            TRACK {currentIdx + 1} / {images.length}
          </span>
          <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '2px', color: tc.gray, opacity: 0.5 }}>
            GALLERY
          </span>
        </div>

        {/* Seekbar */}
        <div className="mt-3" style={{ position: 'relative' }}>
          <div style={{ height: '3px', background: `${tc.divider}80`, borderRadius: '2px', position: 'relative' }}>
            <div style={{
              height: '100%', background: tc.primary, borderRadius: '2px',
              width: `${progressPct}%`, transition: 'width 0.4s ease',
            }} />
            {/* Seekbar thumb */}
            <div style={{
              position: 'absolute', top: '50%', left: `${progressPct}%`,
              transform: 'translate(-50%, -50%)',
              width: '10px', height: '10px', borderRadius: '50%',
              background: tc.primary, boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              transition: 'left 0.4s ease',
            }} />
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-10 mt-6 mb-2">
          {/* Previous */}
          <button onClick={goPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={tc.text} style={{ opacity: 0.5 }}>
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause (shows as pause = currently viewing) */}
          <button onClick={() => onOpenLightbox(currentIdx)} style={{
            background: tc.primary, border: 'none', cursor: 'pointer',
            width: '56px', height: '56px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${tc.primary}40`,
            transition: 'transform 0.2s',
          }}
            className="hover:scale-105 active:scale-95"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>

          {/* Next */}
          <button onClick={goNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={tc.text} style={{ opacity: 0.5 }}>
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* CD BOOKLET grid - separate section */}
        {images.length > 1 && (
          <div className="mt-10">
            {/* SIDE B divider */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div style={{ flex: 1, maxWidth: '60px', height: '1px', background: tc.divider }} />
              <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.gray, opacity: 0.6 }}>
                CD BOOKLET
              </span>
              <div style={{ flex: 1, maxWidth: '60px', height: '1px', background: tc.divider }} />
            </div>

            {/* First photo full width */}
            <div onClick={() => onOpenLightbox(0)} style={{
              width: '100%', aspectRatio: '16/10', borderRadius: '10px', overflow: 'hidden',
              cursor: 'pointer', marginBottom: '6px',
              border: `1px solid ${tc.divider}30`,
            }}>
              <div className="w-full h-full" style={getImageCropStyle(images[0], invitation.gallery?.imageSettings?.[0] || {})} />
            </div>

            {/* Rest in 2-col grid */}
            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-[6px]">
                {images.slice(1).map((img: string, i: number) => (
                  <div key={i} onClick={() => onOpenLightbox(i + 1)} style={{
                    aspectRatio: '1/1', borderRadius: '10px', overflow: 'hidden',
                    cursor: 'pointer',
                    border: `1px solid ${tc.divider}30`,
                  }}>
                    <div className="w-full h-full" style={getImageCropStyle(img, invitation.gallery?.imageSettings?.[i + 1] || {})} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== YouTube Video Section =====
function RecordVideoSection({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const youtube = invitation.youtube
  if (!youtube?.enabled || !youtube?.url) return null

  const match = youtube.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
  const videoId = match?.[1]
  if (!videoId) return null

  return (
    <div className="py-8 px-5" style={{ backgroundColor: tc.background }}>
      {youtube.title && (
        <p className="text-center mb-3" style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', color: tc.gray }}>{youtube.title.toUpperCase()}</p>
      )}
      <div style={{ aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
        <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    </div>
  )
}

// ===== TRACK 05: The Wedding Day (Concert Ticket Style) =====
function TrackWeddingDay({ invitation, fonts, tc, trackRef }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; trackRef: (el: HTMLDivElement | null) => void
}) {
  const { ref, isVisible } = useScrollReveal()
  const w = invitation.wedding || {}
  const date = w.date ? new Date(w.date) : null
  const dayNamesKr = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const dayNamesKr2 = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const groom = invitation.groom || {}
  const bride = invitation.bride || {}

  return (
    <div ref={(el) => { (ref as any).current = el; trackRef(el) }} className="px-5 py-10">
      {/* Track label */}
      <div className="mb-6">
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.primary, opacity: 0.7 }}>
          TRACK 05
        </span>
        <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '2px', color: tc.gray, marginLeft: '12px', opacity: 0.5 }}>
          {TRACK_CONFIG['05'].duration}
        </span>
      </div>

      {/* Concert ticket */}
      <div className="transition-all" style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) rotate(0deg)' : 'translateY(40px) rotate(-2deg)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{
          background: tc.cardBg, borderRadius: '12px', overflow: 'hidden',
          border: `2px dashed ${tc.divider}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          position: 'relative',
        }}>
          {/* Perforation edges */}
          <div className="absolute top-0 left-0 right-0 flex justify-between px-2" style={{ transform: 'translateY(-50%)' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: tc.background }} />
            ))}
          </div>

          {/* LIVE stamp */}
          <div className="absolute top-4 right-4" style={{
            fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px',
            color: tc.primary, border: `1.5px solid ${tc.primary}`,
            padding: '3px 10px', borderRadius: '2px',
            transform: 'rotate(12deg)', opacity: 0.6,
          }}>
            LIVE
          </div>

          {/* Ticket content */}
          <div style={{ padding: '28px 20px 20px' }}>
            {/* ADMIT ONE */}
            <div className="text-center mb-4">
              <span style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '5px', color: tc.gray, opacity: 0.5 }}>
                ADMIT ONE
              </span>
            </div>

            {/* Large date */}
            {date && (
              <div className="text-center mb-6">
                <p style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '3px', color: tc.text, lineHeight: 1.2 }}>
                  {String(date.getFullYear()).slice(2)}.{String(date.getMonth() + 1).padStart(2, '0')}.{String(date.getDate()).padStart(2, '0')}
                </p>
                <p style={{ fontFamily: fonts.display, fontSize: '12px', letterSpacing: '4px', color: tc.gray, marginTop: '4px' }}>
                  {dayNamesKr2[date.getDay()]}
                </p>
                <p style={{ fontFamily: fonts.body, fontSize: '13px', color: tc.gray, marginTop: '4px' }}>
                  {w.timeDisplay || w.time || ''}
                </p>
              </div>
            )}

            <div style={{ width: '40px', height: '1px', background: tc.primary, margin: '0 auto 20px', opacity: 0.4 }} />

            {/* PRESENTED BY */}
            <div className="text-center mb-4">
              <span style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '4px', color: tc.gray, opacity: 0.5 }}>
                PRESENTED BY
              </span>
            </div>

            {/* Parents & Names */}
            <div className="flex items-center justify-center my-4">
              <div className="text-center" style={{ flex: 1 }}>
                {invitation.sectionVisibility?.parentNames !== false && (
                <>
                <p style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray, lineHeight: 1.8 }}>
                  {groom.father?.name && <>{(groom.father as any)?.deceased ? '故 ' : ''}{groom.father.name} &middot; </>}
                  {groom.mother?.name && <>{(groom.mother as any)?.deceased ? '故 ' : ''}{groom.mother.name}</>}
                </p>
                {(groom.father?.name || groom.mother?.name) && (
                  <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.gray, marginTop: '2px' }}>의 {groom.familyRole || '아들'}</p>
                )}
                </>
                )}
                <p style={{ fontFamily: fonts.display, fontSize: '20px', fontWeight: 400, letterSpacing: '2px', color: tc.text, marginTop: '6px' }}>
                  {groom.name || ''}
                </p>
              </div>
              <div className="flex-shrink-0 mx-2" style={{ alignSelf: 'flex-end', marginBottom: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={tc.primary} xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div className="text-center" style={{ flex: 1 }}>
                {invitation.sectionVisibility?.parentNames !== false && (
                <>
                <p style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray, lineHeight: 1.8 }}>
                  {bride.father?.name && <>{(bride.father as any)?.deceased ? '故 ' : ''}{bride.father.name} &middot; </>}
                  {bride.mother?.name && <>{(bride.mother as any)?.deceased ? '故 ' : ''}{bride.mother.name}</>}
                </p>
                {(bride.father?.name || bride.mother?.name) && (
                  <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.gray, marginTop: '2px' }}>의 {bride.familyRole || '딸'}</p>
                )}
                </>
                )}
                <p style={{ fontFamily: fonts.display, fontSize: '20px', fontWeight: 400, letterSpacing: '2px', color: tc.text, marginTop: '6px' }}>
                  {bride.name || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Tear line */}
          <div className="flex justify-between px-2" style={{ borderTop: `1px dashed ${tc.divider}` }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ width: '6px', height: '3px', borderRadius: '0 0 3px 3px', background: tc.background, transform: 'translateY(-1px)' }} />
            ))}
          </div>

          {/* Venue section (below tear line) */}
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ background: tc.sectionBg, borderRadius: '10px', padding: '16px', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '4px', color: tc.primary, marginBottom: '8px' }}>VENUE</div>
              <p style={{ fontFamily: fonts.displayKr, fontSize: '15px', fontWeight: 500, color: tc.text }}>{w.venue?.name || ''}</p>
              {w.venue?.hall && !w.venue?.hideHall && (
                <p style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.gray, marginTop: '4px' }}>{w.venue.hall}</p>
              )}
              <p style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray, marginTop: '6px', lineHeight: 1.6 }}>{w.venue?.address || ''}</p>
            </div>

            {/* Map buttons */}
            {w.venue?.address && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'NAVER', color: '#03C75A', letter: 'N', url: `https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}` },
                  { label: 'KAKAO', color: '#FEE500', letter: 'K', letterColor: '#000', url: `https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}` },
                  { label: 'TMAP', color: '#4285F4', letter: 'T', url: `tmap://search?name=${encodeURIComponent(w.venue.name || '')}` },
                ].map(m => (
                  <a key={m.label} href={m.url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center py-3" style={{ background: tc.sectionBg, borderRadius: '8px' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1.5" style={{ background: m.color }}>
                      <span style={{ color: m.letterColor || '#fff', fontSize: '9px', fontWeight: 700 }}>{m.letter}</span>
                    </div>
                    <span style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '1px', color: tc.gray }}>{m.label}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Directions */}
            {w.directions && (w.directions.car || w.directions.publicTransport || w.directions.train || w.directions.expressBus) && (
              <div className="mt-4 space-y-3">
                {w.directions.car && (
                  <div style={{ padding: '14px 16px', background: tc.sectionBg, borderRadius: '10px', borderLeft: `3px solid ${tc.primary}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.primary, marginBottom: '6px' }}>자가용</div>
                    {w.directions.car.split('\n').map((line: string, i: number) => (
                      <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.gray }}>{line}</p>
                    ))}
                  </div>
                )}
                {w.directions.publicTransport && (
                  <div style={{ padding: '14px 16px', background: tc.sectionBg, borderRadius: '10px', borderLeft: `3px solid ${tc.primary}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.primary, marginBottom: '6px' }}>대중교통</div>
                    {w.directions.publicTransport.split('\n').map((line: string, i: number) => (
                      <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.gray }}>{line}</p>
                    ))}
                  </div>
                )}
                {w.directions.train && (
                  <div style={{ padding: '14px 16px', background: tc.sectionBg, borderRadius: '10px', borderLeft: `3px solid ${tc.primary}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.primary, marginBottom: '6px' }}>기차</div>
                    {w.directions.train.split('\n').map((line: string, i: number) => (
                      <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.gray }}>{line}</p>
                    ))}
                  </div>
                )}
                {w.directions.expressBus && (
                  <div style={{ padding: '14px 16px', background: tc.sectionBg, borderRadius: '10px', borderLeft: `3px solid ${tc.primary}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.primary, marginBottom: '6px' }}>고속버스</div>
                    {w.directions.expressBus.split('\n').map((line: string, i: number) => (
                      <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.gray }}>{line}</p>
                    ))}
                  </div>
                )}
                {w.directions.extraInfoEnabled && w.directions.extraInfoText && (
                  <div style={{ padding: '14px 16px', background: tc.sectionBg, borderRadius: '10px', borderLeft: `3px solid ${tc.primary}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.primary, marginBottom: '6px' }}>{w.directions.extraInfoTitle || '추가 안내사항'}</div>
                    {w.directions.extraInfoText.split('\n').map((line: string, i: number) => (
                      <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.gray }}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom perforation */}
          <div className="flex justify-between px-2" style={{ transform: 'translateY(50%)' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: tc.background }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Guidance Section (Setlist Notes style) =====
function GuidanceSection({ invitation, fonts, tc, trackRef }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; trackRef: (el: HTMLDivElement | null) => void
}) {
  const { ref, isVisible } = useScrollReveal()
  const info = invitation.content?.info
  const defaultItemOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
  const enabledItems = info ? [
    ...(info.itemOrder || defaultItemOrder).filter((key: string) => info[key]?.enabled && info[key]?.content),
    ...(info.customItems || []).filter((item: any) => item.enabled && item.content).map((_: any, i: number) => `custom-${i}`),
  ] : []

  if (enabledItems.length === 0 && !invitation.guidance?.enabled) return null

  return (
    <div ref={(el) => { (ref as any).current = el; trackRef(el) }} className="py-10 px-5" style={{ backgroundColor: tc.background }}>
      <div className="transition-all duration-700" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}>
        <div className="text-center mb-6">
          <h3 style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 500, letterSpacing: '5px', color: tc.text }}>INFORMATION</h3>
          <div style={{ width: '20px', height: '1px', background: tc.primary, margin: '10px auto 0', opacity: 0.5 }} />
        </div>

        {invitation.guidance?.image && (
          <div className="mb-6">
            <div className="w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
              <div className="w-full h-full" style={getImageCropStyle(invitation.guidance.image, invitation.guidance?.imageSettings || {})} />
            </div>
          </div>
        )}

        {enabledItems.length > 0 && (
          <div className="space-y-3">
            {enabledItems.map((key: string, i: number) => {
              const isCustom = key.startsWith('custom-')
              const item = isCustom ? info.customItems[parseInt(key.split('-')[1])] : info[key]
              if (!item?.enabled || !item?.content) return null
              return (
                <div key={i} style={{
                  padding: '14px', background: tc.cardBg, borderRadius: '10px',
                  border: `1px solid ${tc.divider}60`,
                  borderBottom: `1px dashed ${tc.divider}80`,
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: tc.primary, fontSize: '10px', opacity: 0.5 }}>&#10003;</span>
                    <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: tc.primary }}>
                      {item.title?.toUpperCase()}
                    </span>
                  </div>
                  {item.content.split('\n').map((line: string, j: number) => (
                    <p key={j} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.gray }}>{line}</p>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== BONUS TRACK: Album Liner Notes =====
function BonusTrack({ invitation, fonts, tc, trackRef }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; trackRef: (el: HTMLDivElement | null) => void
}) {
  const { ref, isVisible } = useScrollReveal()
  const thankYou = invitation.content?.thankYou
  if (!thankYou) return null

  return (
    <div ref={(el) => { (ref as any).current = el; trackRef(el) }} className="px-5 py-10">
      <div className="transition-all" style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 1s ease',
      }}>
        <div style={{
          background: tc.cardBg, borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: `1px solid ${tc.divider}60`,
          position: 'relative',
        }}>
          {/* Vinyl groove texture in bg */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'repeating-radial-gradient(circle at 50% 120%, transparent 0px, transparent 20px, rgba(0,0,0,0.008) 20px, rgba(0,0,0,0.008) 21px)',
          }} />

          {/* Bonus track ribbon */}
          <div style={{
            background: `linear-gradient(135deg, ${tc.accent}, ${tc.primary})`,
            padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'relative',
          }}>
            {/* Pill badge */}
            <div className="flex items-center gap-2">
              <span style={{
                fontFamily: fonts.display, fontSize: '7px', letterSpacing: '2px', color: '#FFFFFF',
                background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px',
              }}>
                B+
              </span>
              <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: '#FFFFFF', fontWeight: 600 }}>
                BONUS TRACK
              </span>
            </div>
            <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }}>
              {TRACK_CONFIG['bonus'].duration}
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: '28px 24px', textAlign: 'center', position: 'relative' }}>
            <h3 style={{
              fontFamily: fonts.display, fontSize: '13px', letterSpacing: '5px', color: tc.text, marginBottom: '16px',
              fontStyle: 'italic',
            }}>
              {thankYou.title || 'LINER NOTES'}
            </h3>

            {/* Musical note divider */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div style={{ width: '20px', height: '1px', background: tc.primary, opacity: 0.3 }} />
              <span style={{ fontSize: '10px', color: `${tc.primary}50` }}>&#9835;</span>
              <div style={{ width: '20px', height: '1px', background: tc.primary, opacity: 0.3 }} />
            </div>

            {thankYou.message?.split('\n').map((line: string, i: number) => {
              const isEmpty = line.trim().length === 0
              if (isEmpty) return <div key={i} style={{ height: '16px' }} />
              return (
                <p key={i} style={{
                  fontFamily: fonts.body, fontSize: '13px', lineHeight: 2, color: tc.gray,
                  fontStyle: 'italic',
                }}>{line}</p>
              )
            })}
            {thankYou.sign && (
              <div className="mt-8">
                <div style={{ width: '1px', height: '20px', background: `${tc.divider}40`, margin: '0 auto 10px' }} />
                <p style={{ fontFamily: fonts.displayKr, fontSize: '13px', color: tc.text, fontWeight: 400 }}>{thankYou.sign}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Gift Section =====
function GiftSection({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const groom = invitation.groom || {}
  const bride = invitation.bride || {}
  const hasAccounts = [groom.bank?.enabled, (groom.father as any)?.bank?.enabled, (groom.mother as any)?.bank?.enabled,
    bride.bank?.enabled, (bride.father as any)?.bank?.enabled, (bride.mother as any)?.bank?.enabled].some(Boolean)
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
      <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${tc.divider}` }}>
        <div>
          <span style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray }}>{acc.role}</span>
          <span style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.text, marginLeft: '8px' }}>{acc.holder || acc.name}</span>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(`${acc.bank} ${acc.account}`); alert('계좌번호가 복사되었습니다.') }}
          style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: tc.primary, background: 'none', border: `1px solid ${tc.primary}50`, padding: '4px 12px', cursor: 'pointer', borderRadius: '4px' }}>
          COPY
        </button>
      </div>
    ))
  }

  return (
    <div className="px-5 py-10" style={{ backgroundColor: tc.background }}>
      <div className="text-center mb-6">
        <span style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '3px', color: tc.gray, opacity: 0.4, display: 'block', marginBottom: '6px' }}>
          &#9834; A-SIDE
        </span>
        <h3 style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: tc.text, fontWeight: 400 }}>마음 전하실 곳</h3>
        <div style={{ width: '20px', height: '1px', background: tc.primary, margin: '10px auto 0', opacity: 0.5 }} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(['groom', 'bride'] as const).map(side => (
          <button key={side} onClick={() => setExpandedSide(expandedSide === side ? null : side)}
            style={{
              fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px', padding: '11px',
              borderRadius: '8px',
              border: `1px solid ${expandedSide === side ? tc.primary : tc.divider}`,
              background: expandedSide === side ? tc.primary : tc.cardBg,
              color: expandedSide === side ? '#FFFFFF' : tc.text, cursor: 'pointer', transition: 'all 0.3s',
            }}>
            {side === 'groom' ? '신랑측' : '신부측'}
          </button>
        ))}
      </div>
      {expandedSide && (
        <div style={{ padding: '12px 14px', background: tc.cardBg, borderRadius: '10px' }}>{renderAccounts(expandedSide)}</div>
      )}
    </div>
  )
}

// ===== Fan Mail (Guestbook) =====
function FanMailSection({ invitation, invitationId, fonts, tc, isSample }: {
  invitation: any; invitationId: string; fonts: FontConfig; tc: ColorConfig; isSample?: boolean
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const questions: string[] = invitation.content?.guestbookQuestions || []
  const currentQ = questions[qIdx] || '두 사람에게 하고 싶은 말을 남겨주세요'

  useEffect(() => {
    if (isSample) return
    fetch(`/api/guestbook?invitationId=${invitationId}`).then(r => r.json()).then((d: any) => setMessages(d.messages || d.data || [])).catch(() => {})
  }, [invitationId, isSample])

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return
    if (isSample) {
      setMessages(prev => [{ id: `s-${Date.now()}`, guest_name: name.trim(), message: message.trim(), question: questions[qIdx] || null, created_at: new Date().toISOString() }, ...prev])
      setName(''); setMessage(''); return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, guestName: name.trim(), message: message.trim(), question: questions[qIdx] || null }) })
      if (res.ok) { const data: any = await res.json(); setMessages(prev => [data.data || data, ...prev]); setName(''); setMessage('') }
    } catch {} setSubmitting(false)
  }

  const { ref, isVisible } = useScrollReveal()
  const inputStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `1px solid ${tc.divider}`, borderRadius: '8px', background: tc.cardBg, outline: 'none', color: tc.text, width: '100%' }

  return (
    <div ref={ref} className="px-5 py-10" style={{ backgroundColor: tc.background }}>
      <div className="transition-all duration-700" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}>
        <div className="text-center mb-6">
          <span style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '3px', color: tc.gray, opacity: 0.4, display: 'block', marginBottom: '6px' }}>
            &#9835; B-SIDE
          </span>
          <h3 style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 500, letterSpacing: '5px', color: tc.text }}>FAN MAIL</h3>
          <div style={{ width: '20px', height: '1px', background: tc.primary, margin: '10px auto 0', opacity: 0.5 }} />
        </div>
        <div className="text-center mb-6">
          <p style={{ fontFamily: fonts.displayKr, fontSize: '14px', fontWeight: 400, lineHeight: 1.7, color: tc.text }}>{currentQ}</p>
          {questions.length > 1 && (
            <button onClick={() => setQIdx((qIdx + 1) % questions.length)}
              style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray, background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px' }}>
              다른 질문 보기 &rarr;
            </button>
          )}
        </div>
        <div className="mb-8 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" maxLength={20} style={inputStyle} />
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="메시지를 남겨주세요 (100자 이내)" rows={3} maxLength={100}
            style={{ ...inputStyle, resize: 'none' as const }} />
          <button onClick={handleSubmit} disabled={submitting}
            style={{ width: '100%', fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', padding: '12px', background: tc.primary, color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
            SUBMIT
          </button>
        </div>
        {messages.length === 0 ? (
          <p className="text-center" style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.gray, padding: '16px 0' }}>첫 번째로 메시지를 남겨보세요!</p>
        ) : (
          <div className="space-y-3">
            {messages.slice(0, 6).map((msg: any, i: number) => (
              <div key={msg.id || i} style={{ padding: '14px', borderRadius: '10px', border: `1px solid ${tc.divider}60`, background: tc.cardBg }}>
                {msg.question && <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.gray, marginBottom: '6px', opacity: 0.6 }}>Q. {msg.question}</p>}
                <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.text, marginBottom: '8px' }}>{msg.message}</p>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray }}>&mdash; {msg.guest_name}</span>
                  <span style={{ fontFamily: fonts.display, fontSize: '9px', color: tc.gray, opacity: 0.4 }}>{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== RSVP Section =====
function RsvpSection({ invitation, invitationId, fonts, tc }: {
  invitation: any; invitationId: string; fonts: FontConfig; tc: ColorConfig
}) {
  const { ref, isVisible } = useScrollReveal()
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState<'yes' | 'no'>('yes')
  const [guestCount, setGuestCount] = useState(1)
  const [rsvpMessage, setRsvpMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!invitation.rsvpEnabled) return null

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, guestName: name, attendance, guestCount: attendance === 'yes' ? guestCount : 0, message: rsvpMessage, mealType: 'none' }) })
      if (res.ok) setSubmitted(true)
    } catch {} setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `1px solid ${tc.divider}`, borderRadius: '8px', background: tc.cardBg, outline: 'none', color: tc.text, width: '100%' }

  if (submitted) {
    return (
      <div className="px-5 py-14 text-center" style={{ backgroundColor: tc.background }}>
        <div style={{ fontFamily: fonts.display, fontSize: '13px', letterSpacing: '5px', color: tc.text, marginBottom: '8px' }}>CONFIRMED</div>
        <p style={{ fontFamily: fonts.body, fontSize: '13px', color: tc.gray }}>참석 여부가 전달되었습니다.</p>
      </div>
    )
  }

  const w = invitation.wedding || {}
  const date = w.date ? new Date(w.date) : null

  return (
    <div ref={ref} className="px-5 py-10" style={{ backgroundColor: tc.background }}>
      <div className="transition-all duration-700" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}>
        <div className="text-center mb-6">
          <span style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '3px', color: tc.gray, opacity: 0.4, display: 'block', marginBottom: '6px' }}>
            &#9834; ENCORE
          </span>
          <h3 style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 500, letterSpacing: '5px', color: tc.text }}>RSVP</h3>
          <div style={{ width: '20px', height: '1px', background: tc.primary, margin: '10px auto 0', opacity: 0.5 }} />
          {date && (
            <p style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray, marginTop: '8px' }}>
              {String(date.getFullYear()).slice(2)}.{String(date.getMonth()+1).padStart(2,'0')}.{String(date.getDate()).padStart(2,'0')} {w.venue?.name || ''}
            </p>
          )}
        </div>
        <div style={{ background: tc.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${tc.divider}60` }}>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="성함" style={inputStyle} />
            <div className="grid grid-cols-2 gap-2">
              {(['yes', 'no'] as const).map(opt => (
                <button key={opt} onClick={() => setAttendance(opt)}
                  style={{
                    fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px', padding: '11px',
                    borderRadius: '8px',
                    border: `1px solid ${attendance === opt ? tc.primary : tc.divider}`,
                    background: attendance === opt ? tc.primary : 'transparent',
                    color: attendance === opt ? '#FFFFFF' : tc.text, cursor: 'pointer', transition: 'all 0.3s',
                  }}>
                  {opt === 'yes' ? 'ATTENDING' : 'REGRET'}
                </button>
              ))}
            </div>
            {attendance === 'yes' && invitation.rsvpAllowGuestCount && (
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.gray }}>참석 인원</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    style={{ width: '30px', height: '30px', border: `1px solid ${tc.divider}`, borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: tc.text }}>-</button>
                  <span style={{ fontFamily: fonts.display, fontSize: '14px', width: '28px', textAlign: 'center', color: tc.text }}>{guestCount}</span>
                  <button onClick={() => setGuestCount(guestCount + 1)}
                    style={{ width: '30px', height: '30px', border: `1px solid ${tc.divider}`, borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: tc.text }}>+</button>
                </div>
              </div>
            )}
            <textarea value={rsvpMessage} onChange={e => setRsvpMessage(e.target.value)} placeholder="전하고 싶은 말 (선택)" rows={2}
              style={{ ...inputStyle, resize: 'none' as const }} />
            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: '100%', fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', padding: '13px', background: tc.primary, color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
              CONFIRM
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== MiniPlayerBar =====
function MiniPlayerBar({ currentTrack, progress, isAudioPlaying, fonts, tc }: {
  currentTrack: number; progress: number; isAudioPlaying: boolean; fonts: FontConfig; tc: ColorConfig
}) {
  const trackNames = ['THE BEGINNING', 'THE COUPLE', 'OUR JOURNEY', 'GALLERY', 'THE WEDDING DAY', 'INFORMATION', 'LINER NOTES']
  const trackKeys = ['01', '02', '03', '04', '05', 'bonus', 'bonus']
  const trackName = trackNames[Math.min(currentTrack - 1, trackNames.length - 1)] || ''
  const trackKey = trackKeys[Math.min(currentTrack - 1, trackKeys.length - 1)] || '01'
  const duration = TRACK_CONFIG[trackKey]?.duration || '3:42'
  const trackNum = currentTrack <= 5 ? String(currentTrack).padStart(2, '0') : 'B+'

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px', height: '56px',
      background: `${tc.cardBg}F0`, backdropFilter: 'blur(16px)',
      borderTop: `1px solid ${tc.divider}40`,
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px',
      zIndex: 90,
    }}>
      {/* Mini vinyl disc */}
      <div className={`flex-shrink-0 ${isAudioPlaying ? 'mini-vinyl-spin' : ''}`} style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: `conic-gradient(from 0deg, ${tc.primary}20, ${tc.primary}, ${tc.primary}20)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: tc.cardBg, border: `1px solid ${tc.divider}`,
        }} />
        {/* Grooves */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 3px)',
        }} />
      </div>

      {/* Track info + seekbar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '2px', color: tc.text, fontWeight: 500 }}>
            {trackNum}. {trackName}
          </span>
          <span style={{ fontFamily: fonts.display, fontSize: '8px', color: tc.gray, opacity: 0.6 }}>
            {duration}
          </span>
        </div>
        <div style={{ height: '2px', background: tc.divider, borderRadius: '1px', position: 'relative' }}>
          <div className="mini-player-seekbar" style={{
            height: '100%', background: tc.primary, borderRadius: '1px',
            width: `${progress * 100}%`,
          }} />
        </div>
      </div>

      {/* Equalizer bars */}
      <div className="flex-shrink-0 flex items-end gap-[2px]" style={{ height: '16px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: '2px', borderRadius: '1px',
            background: tc.primary,
            opacity: isAudioPlaying ? 0.7 : 0.2,
            height: isAudioPlaying ? undefined : '4px',
            animation: isAudioPlaying ? `equalizerBar 0.8s ease-in-out ${i * 0.15}s infinite alternate` : 'none',
          }} />
        ))}
      </div>
    </div>
  )
}

// ===== Record Footer =====
function RecordFooter({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  return (
    <div className="px-6 text-center" style={{ backgroundColor: tc.background, borderTop: `1px solid ${tc.divider}40`, paddingTop: '56px', paddingBottom: '90px' }}>
      {/* Mini vinyl icon */}
      <div className="flex justify-center mb-4">
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: tc.text, opacity: 0.1,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '6px', height: '6px', borderRadius: '50%', background: tc.background,
          }} />
        </div>
      </div>

      <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '5px', color: tc.gray, marginBottom: '14px', opacity: 0.4 }}>
        END OF ALBUM
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '4px', color: tc.gray, marginBottom: '10px', opacity: 0.6 }}>
        Thank you for listening.
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: '14px', letterSpacing: '3px', color: tc.text, fontWeight: 400 }}>
        {invitation.groom?.name || ''} & {invitation.bride?.name || ''}
      </div>
      <div style={{ width: '30px', height: '1px', background: tc.primary, margin: '14px auto 0', opacity: 0.3 }} />
    </div>
  )
}

// ===== Lightbox =====
function GalleryLightbox({ images, isOpen, initialIndex, onClose }: { images: string[]; isOpen: boolean; initialIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(initialIndex)
  useEffect(() => { setIdx(initialIndex) }, [initialIndex])
  if (!isOpen) return null
  const resolved = images.map(extractImageUrl).filter(Boolean)
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl z-10 w-10 h-10 flex items-center justify-center">&times;</button>
      <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm opacity-60">{idx + 1} / {resolved.length}</div>
      {resolved[idx] && <img src={resolved[idx]} alt="" className="max-w-full max-h-full object-contain" onClick={e => { e.stopPropagation(); setIdx((idx + 1) % resolved.length) }} />}
    </div>
  )
}

// ===== CSS =====
const globalStyles = `
  .desktop-frame-wrapper {
    min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; background: #F0EDE8;
  }
  .mobile-frame {
    width: 100%; max-width: 430px; min-height: 100vh; position: relative; overflow: hidden;
    background: #FFFFFF; box-shadow: 0 0 40px rgba(0,0,0,0.08);
  }
  .mobile-frame-screen { position: relative; width: 100%; min-height: 100vh; }
  .mobile-frame-content { width: 100%; min-height: 100vh; }
  .mobile-frame-fixed-ui {
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 430px; height: 100vh; pointer-events: none; z-index: 100;
  }
  .mobile-frame-fixed-ui > * { pointer-events: auto; }
  @media (max-width: 430px) {
    .desktop-frame-wrapper { background: #FFFFFF; }
    .mobile-frame { box-shadow: none; }
  }

  /* Vinyl Record */
  .vinyl-record-wrapper {
    position: relative; cursor: pointer;
    width: 260px; height: 260px;
  }
  .vinyl-disc {
    width: 260px; height: 260px; border-radius: 50%;
    background: #1A1A1A;
    position: relative; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255,255,255,0.05);
  }
  .vinyl-spinning {
    animation: vinylSpin 8s linear infinite;
  }
  .vinyl-paused {
    animation: vinylSpin 8s linear infinite;
    animation-play-state: paused;
  }
  @keyframes vinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .vinyl-photo-bg {
    position: absolute; inset: 0; border-radius: 50%;
    overflow: hidden; z-index: 0;
  }
  .vinyl-grooves {
    position: absolute; inset: 0; border-radius: 50%; z-index: 1;
    background: repeating-radial-gradient(
      circle at center,
      transparent 0px,
      transparent 2.5px,
      rgba(0,0,0,0.12) 2.5px,
      rgba(0,0,0,0.12) 3.5px
    );
  }
  .vinyl-label {
    position: absolute;
    top: 50%; left: 50%;
    width: 80px; height: 80px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    z-index: 3;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.15), 0 2px 12px rgba(0,0,0,0.2);
  }
  .vinyl-play-hint {
    position: absolute; bottom: -28px; left: 0; right: 0;
    text-align: center;
  }
  .vinyl-disc::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(0,0,0,0.4);
    transform: translate(-50%, -50%);
    z-index: 5;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.2);
  }

  /* Lyric card scroll */
  .record-lyric-scroll::-webkit-scrollbar { display: none; }
  .record-lyric-scroll { scrollbar-width: none; -ms-overflow-style: none; }

  /* === NEW ANIMATIONS === */

  /* Equalizer bar animation */
  @keyframes equalizerBar {
    0% { height: 4px; }
    100% { height: 14px; }
  }

  .equalizer-bar {
    animation: equalizerBar 0.6s ease-in-out infinite alternate;
    border-radius: 1px;
  }

  /* Mini vinyl spin for mini player */
  .mini-vinyl-spin {
    animation: miniVinylSpin 4s linear infinite;
  }
  @keyframes miniVinylSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Seekbar smooth transition */
  .mini-player-seekbar {
    transition: width 0.3s ease;
  }

  /* Waveform pulse */
  @keyframes waveformPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }

  /* Push GuestFloatingButton up to avoid mini player overlap */
  .mobile-frame-fixed-ui .fixed.bottom-6 {
    bottom: 72px !important;
  }
`

// ===== Transform data =====
function transformToDisplayData(invitation: Invitation, content: InvitationContent | null) {
  if (!content) return null
  return {
    id: invitation.id,
    colorTheme: (content.colorTheme || 'record-coral') as ColorTheme,
    fontStyle: (content.fontStyle || 'modern') as FontStyle,
    groom: content.groom || {}, bride: content.bride || {},
    wedding: content.wedding || {}, relationship: content.relationship || {},
    content: content.content || {}, gallery: content.gallery || {},
    media: content.media || {}, rsvpEnabled: content.rsvpEnabled ?? true,
    rsvpDeadline: content.rsvpDeadline || '', rsvpAllowGuestCount: content.rsvpAllowGuestCount ?? true,
    sectionVisibility: content.sectionVisibility || {},
    design: content.design || {}, bgm: content.bgm || {},
    guidance: content.guidance || {}, intro: content.intro,
    youtube: content.youtube,
    deceasedDisplayStyle: content.deceasedDisplayStyle || 'flower',
  }
}

// ===== Main Component =====
function InvitationClientRecordContent({
  invitation: dbInvitation, content, isPaid, isPreview,
  overrideColorTheme, overrideFontStyle, skipIntro, guestInfo, isSample,
}: InvitationClientProps) {
  const invitation = transformToDisplayData(dbInvitation, content)

  const effectiveColorTheme = (overrideColorTheme && overrideColorTheme in colorThemes) ? overrideColorTheme as ColorTheme
    : (invitation?.colorTheme && invitation.colorTheme in colorThemes) ? invitation.colorTheme as ColorTheme : 'record-coral'
  const effectiveFontStyle = (overrideFontStyle && overrideFontStyle in fontStyles) ? overrideFontStyle as FontStyle
    : (invitation?.fontStyle && invitation.fontStyle in fontStyles) ? invitation.fontStyle as FontStyle : 'modern'

  const [currentPage, setCurrentPage] = useState<'cover' | 'main'>(skipIntro ? 'main' : 'cover')

  // skipIntro prop 변경 시 페이지 전환 (에디터 미리보기용)
  useEffect(() => {
    setCurrentPage(skipIntro ? 'main' : 'cover')
  }, [skipIntro])

  const audioRef = useRef<HTMLAudioElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  const tc = colorThemes[effectiveColorTheme]
  const fonts = fontStyles[effectiveFontStyle]

  // Track current track via scroll
  const { currentTrack, progress, setTrackRef } = useCurrentTrack()

  // Listen for audio play/pause events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsAudioPlaying(true)
    const onPause = () => setIsAudioPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause) }
  }, [currentPage])

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

  const accounts = [
    invitation.groom?.name && invitation.groom?.bank?.enabled && { name: invitation.groom.name, bank: invitation.groom.bank, role: '신랑', side: 'groom' as const },
    (invitation.groom?.father as any)?.bank?.enabled && { name: invitation.groom.father.name, bank: (invitation.groom.father as any).bank, role: '아버지', side: 'groom' as const },
    (invitation.groom?.mother as any)?.bank?.enabled && { name: invitation.groom.mother.name, bank: (invitation.groom.mother as any).bank, role: '어머니', side: 'groom' as const },
    invitation.bride?.name && invitation.bride?.bank?.enabled && { name: invitation.bride.name, bank: invitation.bride.bank, role: '신부', side: 'bride' as const },
    (invitation.bride?.father as any)?.bank?.enabled && { name: invitation.bride.father.name, bank: (invitation.bride.father as any).bank, role: '아버지', side: 'bride' as const },
    (invitation.bride?.mother as any)?.bank?.enabled && { name: invitation.bride.mother.name, bank: (invitation.bride.mother as any).bank, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; bank: any; role: string; side: 'groom' | 'bride' }[]

  return (
    <PreviewModeContext.Provider value={!!isPreview}>
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div className="desktop-frame-wrapper">
        {!isPaid && !isPreview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
          </div>
        )}
        <div className="mobile-frame">
          <div className="mobile-frame-screen">
            <div className="mobile-frame-content" ref={scrollContainerRef}>
              <WatermarkOverlay isPaid={isPaid || !!isPreview} className="relative w-full min-h-screen">
                <div className="relative w-full min-h-screen overflow-x-hidden" style={{ backgroundColor: tc.background, fontFamily: fonts.body, color: tc.text }}>
                  {currentPage === 'cover' ? (
                    <VinylRecordCover invitation={invitation} fonts={fonts} tc={tc} onEnter={() => setCurrentPage('main')} />
                  ) : (
                    <>
                      <RecordHeader invitation={invitation} fonts={fonts} tc={tc} currentTrack={currentTrack} progress={progress} />
                      <TrackGreeting invitation={invitation} fonts={fonts} tc={tc} trackRef={setTrackRef(0)} />
                      <SectionDivider type="notes" tc={tc} fonts={fonts} />
                      <TrackCouple invitation={invitation} fonts={fonts} tc={tc} trackRef={setTrackRef(1)} />
                      <SectionDivider type="sideA" tc={tc} fonts={fonts} />
                      <TrackOurJourney invitation={invitation} fonts={fonts} tc={tc} trackRef={setTrackRef(2)} />
                      <SectionDivider type="waveform" tc={tc} fonts={fonts} />
                      <TrackGallery invitation={invitation} fonts={fonts} tc={tc} onOpenLightbox={(idx) => { setLightboxIndex(idx); setLightboxOpen(true) }} trackRef={setTrackRef(3)} />
                      <RecordVideoSection invitation={invitation} fonts={fonts} tc={tc} />
                      <SectionDivider type="sideB" tc={tc} fonts={fonts} />
                      <TrackWeddingDay invitation={invitation} fonts={fonts} tc={tc} trackRef={setTrackRef(4)} />
                      <SectionDivider type="line" tc={tc} fonts={fonts} />
                      <GuidanceSection invitation={invitation} fonts={fonts} tc={tc} trackRef={setTrackRef(5)} />
                      <BonusTrack invitation={invitation} fonts={fonts} tc={tc} trackRef={setTrackRef(6)} />
                      {invitation.sectionVisibility?.bankAccounts !== false && (
                        <GiftSection invitation={invitation} fonts={fonts} tc={tc} />
                      )}
                      <FanMailSection invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} tc={tc} isSample={isSample} />
                      {invitation.sectionVisibility?.rsvp !== false && (
                        <RsvpSection invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} tc={tc} />
                      )}
                      <RecordFooter invitation={invitation} fonts={fonts} tc={tc} />
                    </>
                  )}
                  {invitation.bgm?.enabled && invitation.bgm?.url && (
                    <audio ref={audioRef} loop preload="auto"><source src={invitation.bgm.url} type="audio/mpeg" /></audio>
                  )}
                </div>
              </WatermarkOverlay>
            </div>
            <div className="mobile-frame-fixed-ui">
              {currentPage === 'main' && (
                <>
                  <GuestFloatingButton themeColors={tc} fonts={fonts} openModal="none" onModalClose={() => {}} showTooltip={false} scrollContainerRef={scrollContainerRef}
                    invitation={{ venue_name: invitation.wedding?.venue?.name || '', venue_address: invitation.wedding?.venue?.address || '', contacts, accounts,
                      directions: invitation.wedding?.directions, rsvpEnabled: invitation.rsvpEnabled, rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
                      invitationId: dbInvitation.id, groomName: invitation.groom?.name || '', brideName: invitation.bride?.name || '',
                      weddingDate: invitation.wedding?.date || '', weddingTime: invitation.wedding?.timeDisplay || invitation.wedding?.time || '',
                      thumbnailUrl: content?.meta?.kakaoThumbnail || content?.meta?.ogImage || extractImageUrl(invitation.media?.coverImage) || '',
                      shareTitle: content?.meta?.title, shareDescription: content?.meta?.description }} />
                  <MiniPlayerBar currentTrack={currentTrack} progress={progress} isAudioPlaying={isAudioPlaying} fonts={fonts} tc={tc} />
                </>
              )}
              <MusicToggle audioRef={audioRef} isVisible={currentPage === 'main'} shouldAutoPlay={currentPage === 'main' && invitation.bgm?.autoplay === true} tc={tc} />
              <GalleryLightbox images={invitation.gallery?.images || []} isOpen={lightboxOpen} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
            </div>
          </div>
        </div>
      </div>
    </>
    </PreviewModeContext.Provider>
  )
}

function InvitationErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{ backgroundColor: '#FAF7F4' }}>
      <h2 className="text-lg font-medium mb-2" style={{ color: '#3D3D3D' }}>청첩장을 불러오는 중 오류가 발생했습니다</h2>
      <p className="text-sm text-gray-400 mb-4">잠시 후 다시 시도해주세요</p>
      <button onClick={resetError} className="px-4 py-2 text-sm rounded-lg" style={{ background: '#E89B8F', color: '#FFFFFF' }}>다시 시도</button>
    </div>
  )
}

export default function InvitationClientRecord(props: InvitationClientProps) {
  return (
    <ErrorBoundary fallback={<InvitationErrorFallback resetError={() => window.location.reload()} />}>
      <InvitationClientRecordContent {...props} />
    </ErrorBoundary>
  )
}
