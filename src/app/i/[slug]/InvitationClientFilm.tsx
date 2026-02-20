'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'

// ===== Types =====
type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral' | 'film-dark' | 'film-light'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string; highlight?: string; cardText?: string; cardGray?: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#C41050', secondary: '#B8956A', accent: '#B8956A', background: '#FFF8F5', sectionBg: '#FFE8E8', cardBg: '#FFFFFF', divider: '#d4b896', text: '#3d3d3d', gray: '#555555' },
  'modern-black': { primary: '#111111', secondary: '#555555', accent: '#111111', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#3d3d3d', gray: '#555555', highlight: '#888888' },
  'romantic-blush': { primary: '#A67A7A', secondary: '#8a7068', accent: '#8a7068', background: '#FDF8F6', sectionBg: '#F8EFEC', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#3d3d3d', gray: '#555555' },
  'nature-green': { primary: '#3A5A3A', secondary: '#6A7A62', accent: '#5A7A52', background: '#F5F7F4', sectionBg: '#EBF0E8', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3d3d3d', gray: '#555555', highlight: '#5A8A52' },
  'luxury-navy': { primary: '#0f2035', secondary: '#8A6A3A', accent: '#8A6A3A', background: '#F8F9FA', sectionBg: '#E8ECF0', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#3d3d3d', gray: '#555555', highlight: '#8A6A3A' },
  'sunset-coral': { primary: '#B85040', secondary: '#B88060', accent: '#B8683A', background: '#FFFAF7', sectionBg: '#FFEEE5', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#3d3d3d', gray: '#555555' },
  'film-dark': {
    primary: '#E8E4DF',
    secondary: '#2C2C2E',
    accent: '#D4838F',
    background: '#111111',
    sectionBg: '#111111',
    cardBg: '#FFFFFF',
    divider: '#2A2A2A',
    text: '#E8E4DF',
    gray: '#8E8E93',
    cardText: '#2A2A2A',
    cardGray: '#888888',
  },
  'film-light': {
    primary: '#1A1A1A',
    secondary: '#F5F5F5',
    accent: '#B8977E',
    background: '#FFFFFF',
    sectionBg: '#F8F6F3',
    cardBg: '#FFFFFF',
    divider: '#E5E0DA',
    text: '#1A1A1A',
    gray: '#999999',
  },
}

// Image crop helper
function getImageCropStyle(img: string, s: { scale?: number; positionX?: number; positionY?: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }) {
  const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)
  if (hasCropData) {
    const cw = s.cropWidth || 1
    const ch = s.cropHeight || 1
    const cx = s.cropX || 0
    const cy = s.cropY || 0
    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
    return {
      backgroundImage: `url(${img})`,
      backgroundSize: `${100 / cw}% ${100 / ch}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat' as const,
    }
  }
  return {
    backgroundImage: `url(${img})`,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
  }
}

// Accent color → light tint utility (blend with white)
function getAccentTint(hex: string, whiteMix: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const tr = Math.round(r + (255 - r) * whiteMix)
  const tg = Math.round(g + (255 - g) * whiteMix)
  const tb = Math.round(b + (255 - b) * whiteMix)
  return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`
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

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsVisible(true) }, { threshold })
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, isVisible }
}

// ===== Scene Cut (clean divider) =====
function SceneCut({ from, to }: { from?: string; to?: string } = {}) {
  const topColor = from || '#FFFFFF'
  const bottomColor = to || '#FFFFFF'
  return (
    <div style={{ height: '1px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
      }} />
    </div>
  )
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

// ===== Netflix-Style Cinematic Opening =====
function FilmPosterCover({ invitation, fonts, tc, onEnter }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; onEnter: () => void
}) {
  const [phase, setPhase] = useState(0)
  // 0: pure black (0~0.4s)
  // 1: light streak flash (0.4~0.8s) — TUDUM moment
  // 2: accent bar slams in + "presents" (0.8~1.6s)
  // 3: names punch in BIG (1.6~3s)
  // 4: date + venue slide in (3~4s)
  // 5: hold (4~5s)
  // 6: cinematic zoom-fade out (5~5.8s)
  const [flash, setFlash] = useState(false)

  const w = invitation.wedding
  const weddingDate = w?.date ? new Date(w.date) : new Date()
  const dateFormatted = `${weddingDate.getFullYear()}.${String(weddingDate.getMonth() + 1).padStart(2,'0')}.${String(weddingDate.getDate()).padStart(2,'0')}`
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = dayNames[weddingDate.getDay()]
  const groomName = invitation.groom?.nameEn || invitation.groom?.name || ''
  const brideName = invitation.bride?.nameEn || invitation.bride?.name || ''
  const venueName = invitation.wedding?.venue?.name || ''

  useEffect(() => {
    const timers = [
      setTimeout(() => { setPhase(1); setFlash(true) }, 400),
      setTimeout(() => setFlash(false), 700),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => setPhase(5), 4000),
      setTimeout(() => setPhase(6), 5000),
      setTimeout(() => onEnter(), 5800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const accent = tc.accent || '#D4838F'
  const isLight = tc.background === '#FFFFFF'
  const coverBg = isLight ? getAccentTint(accent, 0.92) : '#0A0A0A'
  const coverText = isLight ? tc.text : '#FFFFFF'
  const coverGray = isLight ? tc.gray : 'rgba(255,255,255,0.6)'
  const coverGrayDim = isLight ? `${tc.gray}60` : 'rgba(255,255,255,0.3)'
  const barColor = isLight ? tc.divider : '#000'

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: coverBg, overflow: 'hidden' }}>

      {/* Cinematic letterbox bars (dark theme only) */}
      {!isLight && (<>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: phase >= 3 ? '0px' : '60px',
          background: barColor, zIndex: 20,
          transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: phase >= 3 ? '0px' : '60px',
          background: barColor, zIndex: 20,
          transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </>)}

      {/* TUDUM flash — full screen light burst */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 50%, ${accent}40 0%, ${accent}15 30%, transparent 70%)`,
        opacity: flash ? 1 : 0,
        transition: flash ? 'opacity 0.05s ease' : 'opacity 0.4s ease',
      }} />

      {/* Horizontal light streak */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        height: '1px', zIndex: 14, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent 10%, ${accent}80 40%, #fff 50%, ${accent}80 60%, transparent 90%)`,
        opacity: flash ? 0.8 : 0,
        boxShadow: flash ? `0 0 30px 8px ${accent}50` : 'none',
        transition: flash ? 'opacity 0.05s ease' : 'opacity 0.5s ease',
        transform: 'translateY(-50%)',
      }} />

      {/* Ambient accent glow — persistent after flash */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 45%, ${accent}12 0%, transparent 60%)`,
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 1s ease',
      }} />

      {/* Main content */}
      <div style={{
        opacity: phase >= 6 ? 0 : 1,
        transform: phase >= 6 ? 'scale(1.15)' : 'scale(1)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', padding: '0 24px',
      }}>

        {/* Accent bar — slams in fast */}
        <div style={{
          width: phase >= 2 ? '56px' : '0px',
          height: '2px',
          background: accent,
          transition: phase >= 2 ? 'width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          marginBottom: '16px',
          boxShadow: phase >= 2 ? `0 0 24px 4px ${accent}50, 0 0 8px ${accent}80` : 'none',
        }} />

        {/* "A WEDDING FILM" tagline */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0) scaleY(1)' : 'translateY(-4px) scaleY(0.8)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          marginBottom: '32px',
        }}>
          <span style={{
            fontFamily: fonts.display,
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '8px',
            color: accent,
            textTransform: 'uppercase',
          }}>
            A Wedding Movie
          </span>
        </div>

        {/* Couple names — BIG punch-in with overshoot */}
        <div style={{
          textAlign: 'center',
          marginBottom: '8px',
        }}>
          {/* Groom */}
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(1.1)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <span style={{
              fontFamily: fonts.displayKr,
              fontSize: '36px',
              fontWeight: 300,
              color: coverText,
              letterSpacing: '8px',
              textShadow: isLight ? `0 0 40px ${accent}20` : `0 0 40px ${accent}30, 0 2px 20px rgba(0,0,0,0.5)`,
            }}>
              {groomName}
            </span>
          </div>

          {/* & symbol with glow */}
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'scale(1)' : 'scale(0.5)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s',
            margin: '6px 0',
          }}>
            <span style={{
              fontFamily: fonts.display,
              fontSize: '16px',
              color: accent,
              letterSpacing: '4px',
              textShadow: `0 0 20px ${accent}60`,
            }}>
              &amp;
            </span>
          </div>

          {/* Bride */}
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(1.1)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
          }}>
            <span style={{
              fontFamily: fonts.displayKr,
              fontSize: '36px',
              fontWeight: 300,
              color: coverText,
              letterSpacing: '8px',
              textShadow: isLight ? `0 0 40px ${accent}20` : `0 0 40px ${accent}30, 0 2px 20px rgba(0,0,0,0.5)`,
            }}>
              {brideName}
            </span>
          </div>
        </div>

        {/* Expanding divider line */}
        <div style={{
          width: phase >= 4 ? '120px' : '0px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
          transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          margin: '24px 0 20px',
        }} />

        {/* Date + Venue — slide up */}
        <div style={{
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: fonts.display,
            fontSize: '13px',
            fontWeight: 300,
            color: coverGray,
            letterSpacing: '5px',
            marginBottom: '8px',
          }}>
            {dateFormatted} {dayOfWeek && <span style={{ color: coverGrayDim, fontSize: '11px' }}>({dayOfWeek})</span>}
          </div>
          {venueName && (
            <div style={{
              fontFamily: fonts.displayKr,
              fontSize: '11px',
              fontWeight: 300,
              color: coverGrayDim,
              letterSpacing: '2px',
              opacity: phase >= 4 ? 1 : 0,
              transition: 'opacity 0.6s ease 0.3s',
            }}>
              {venueName}
            </div>
          )}
        </div>
      </div>

      {/* Skip button */}
      <div className="absolute" style={{
        bottom: '36px',
        opacity: (phase >= 2 && phase < 6) ? 0.5 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: (phase >= 2 && phase < 6) ? 'auto' : 'none',
        zIndex: 25,
      }}>
        <button onClick={onEnter} style={{
          fontFamily: fonts.display,
          fontSize: '9px',
          letterSpacing: '4px',
          color: coverGrayDim,
          background: 'none',
          border: `1px solid ${isLight ? `${tc.divider}60` : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '20px',
          cursor: 'pointer',
          padding: '8px 24px',
        }}>
          SKIP ▸
        </button>
      </div>

      {/* Movie grain overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
        opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  )
}

// ===== Minimal Header =====
function FilmHeader({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  return (
    <div className="sticky top-0 z-40 px-5 py-3 flex items-center justify-between"
      style={{ backgroundColor: tc.background, borderBottom: `1px solid ${tc.divider}40` }}>
      <div style={{ fontFamily: fonts.display, fontSize: '11px', fontWeight: 400, letterSpacing: '4px', color: tc.gray }}>
        {invitation.groom?.name || ''} & {invitation.bride?.name || ''}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.divider }}>
        MOVIE
      </div>
    </div>
  )
}

// ===== Chapter 1: The Beginning (Split Text + Blur to Focus) =====
function ChapterOne({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal()
  const greeting = invitation.content?.greeting || ''
  const lines = greeting.split('\n').filter(Boolean)

  // 대사(따옴표로 시작)와 나레이션 구분
  const isDialogue = (line: string) => line.startsWith('"') || line.startsWith('"') || line.startsWith("'")

  return (
    <div ref={ref} className="px-6 py-20" style={{ backgroundColor: tc.background }}>
      {/* Chapter label - letter spacing animation */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-3" style={{
          opacity: isVisible ? 1 : 0, transition: 'opacity 0.8s ease 0.2s',
        }}>
          <div style={{ height: '1px', width: '20px', background: tc.divider }} />
          <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '5px', color: tc.gray }}>01</span>
          <div style={{ height: '1px', width: '20px', background: tc.divider }} />
        </div>
        <h2 style={{
          fontFamily: fonts.display, fontSize: '13px', fontWeight: 400, color: tc.text,
          letterSpacing: isVisible ? '8px' : '20px',
          opacity: isVisible ? 1 : 0,
          transition: 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s',
        }}>
          THE BEGINNING
        </h2>
      </div>

      {/* Greeting - split text reveal + blur to focus */}
      <div style={{ maxWidth: '300px', margin: '0 auto' }}>
        {lines.map((line: string, i: number) => {
          const dialogue = isDialogue(line)
          return (
            <div key={i} className="film-text-reveal" style={{
              overflow: 'hidden', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: dialogue ? fonts.display : fonts.body,
                fontSize: dialogue ? '15px' : '13px',
                lineHeight: 2.2,
                color: dialogue ? tc.accent : (i < 3 ? tc.text : tc.gray),
                fontStyle: dialogue ? 'italic' : 'normal',
                fontWeight: dialogue ? 400 : 400,
                marginBottom: '2px',
                opacity: isVisible ? 1 : 0,
                filter: isVisible ? 'blur(0)' : 'blur(6px)',
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.5 + i * 0.15}s`,
              }}>
                {line}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quote - blur to focus with author */}
      {invitation.content?.quote?.text && (
        <div className="mt-14 text-center" style={{
          opacity: isVisible ? 1 : 0,
          filter: isVisible ? 'blur(0)' : 'blur(4px)',
          transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: `all 1.2s ease ${0.5 + lines.length * 0.15 + 0.3}s`,
        }}>
          <div style={{ width: '1px', height: '24px', background: tc.accent, margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ fontFamily: fonts.display, fontSize: '11px', fontStyle: 'italic', lineHeight: 2, color: tc.accent, opacity: 0.7 }}>
            &ldquo;{invitation.content.quote.text}&rdquo;
          </p>
          {invitation.content.quote.author && (
            <p style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: tc.gray, marginTop: '8px', opacity: 0.5 }}>
              &mdash; {invitation.content.quote.author}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ===== Chapter 2: Cast & Story =====
function ChapterTwo({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal(0.3)
  const groomProfile = invitation.groom?.profile
  const brideProfile = invitation.bride?.profile
  const groomImage = extractImageUrl(groomProfile?.images?.[0])
  const brideImage = extractImageUrl(brideProfile?.images?.[0])
  const groomName = invitation.groom?.name || ''
  const brideName = invitation.bride?.name || ''

  return (
    <div style={{ backgroundColor: tc.sectionBg }}>
      {/* CAST section */}
      <div ref={ref}>
        <div className="px-6 pt-16 pb-10 transition-all duration-1000"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}>
          {/* Chapter label */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ height: '1px', width: '20px', background: tc.divider }} />
              <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '5px', color: tc.gray }}>02</span>
              <div style={{ height: '1px', width: '20px', background: tc.divider }} />
            </div>
            <h2 style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 400, letterSpacing: '8px', color: tc.text }}>
              CAST
            </h2>
          </div>

          {/* Poster-style profile cards with scale reveal */}
          <div className="grid grid-cols-2 gap-3">
            {/* Groom */}
            <div style={{
              aspectRatio: '2/3',
              borderRadius: '4px',
              overflow: 'hidden',
              clipPath: isVisible ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
              transition: 'clip-path 1.2s cubic-bezier(0.77, 0, 0.175, 1) 0.2s',
            }}>
              <div className="relative w-full h-full">
                {groomImage ? (
                  <div className="w-full h-full"
                    style={{
                      ...getImageCropStyle(groomImage, groomProfile?.imageSettings?.[0] || {}),
                      transform: `${isVisible ? 'scale(1)' : 'scale(1.2)'} ${(groomProfile?.imageSettings?.[0] && !groomProfile.imageSettings[0].cropWidth) ? `translate(${groomProfile.imageSettings[0].positionX || 0}%, ${groomProfile.imageSettings[0].positionY || 0}%)` : ''}`,
                      transition: 'transform 2.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: tc.cardBg }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tc.gray} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: groomImage ? 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 45%)' : 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 45%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-4" style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.8s ease 1.2s',
                }}>
                  <div style={{ fontFamily: fonts.display, fontSize: '14px', letterSpacing: '3px', color: groomImage ? '#E8E4DF' : tc.text, fontWeight: 400 }}>
                    {groomName}
                  </div>
                  {groomProfile?.tag && (
                    <p style={{ fontFamily: fonts.body, fontSize: '10px', color: groomImage ? 'rgba(232,228,223,0.6)' : tc.gray, marginTop: '4px', lineHeight: 1.5 }}>
                      {groomProfile.tag}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Bride */}
            <div style={{
              aspectRatio: '2/3',
              borderRadius: '4px',
              overflow: 'hidden',
              clipPath: isVisible ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
              transition: 'clip-path 1.2s cubic-bezier(0.77, 0, 0.175, 1) 0.6s',
            }}>
              <div className="relative w-full h-full">
                {brideImage ? (
                  <div className="w-full h-full"
                    style={{
                      ...getImageCropStyle(brideImage, brideProfile?.imageSettings?.[0] || {}),
                      transform: `${isVisible ? 'scale(1)' : 'scale(1.2)'} ${(brideProfile?.imageSettings?.[0] && !brideProfile.imageSettings[0].cropWidth) ? `translate(${brideProfile.imageSettings[0].positionX || 0}%, ${brideProfile.imageSettings[0].positionY || 0}%)` : ''}`,
                      transition: 'transform 2.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: tc.cardBg }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={tc.gray} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: brideImage ? 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 45%)' : 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 45%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-4" style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.8s ease 1.6s',
                }}>
                  <div style={{ fontFamily: fonts.display, fontSize: '14px', letterSpacing: '3px', color: brideImage ? '#E8E4DF' : tc.text, fontWeight: 400 }}>
                    {brideName}
                  </div>
                  {brideProfile?.tag && (
                    <p style={{ fontFamily: fonts.body, fontSize: '10px', color: brideImage ? 'rgba(232,228,223,0.6)' : tc.gray, marginTop: '4px', lineHeight: 1.5 }}>
                      {brideProfile.tag}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ===== Sticky-Stack Movie Scenes =====
function FilmSceneCard({ item, idx, total, groomName, brideName, fonts, tc }: {
  item: any; idx: number; total: number; groomName: string; brideName: string; fonts: FontConfig; tc: ColorConfig
}) {
  const images = (item.images || []).map(extractImageUrl).filter(Boolean)
  const linesParsed = (item.answer || '').split('\n').filter(Boolean)
  const { ref, isVisible } = useScrollReveal()
  const ct = tc.cardText || tc.text
  const cg = tc.cardGray || tc.gray

  return (
    <div
      ref={ref}
      style={{
        padding: '0 20px', marginBottom: idx < total - 1 ? '20px' : '0',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s ease ${idx * 0.1}s, transform 0.8s ease ${idx * 0.1}s`,
      }}
    >
      <div style={{
        background: tc.cardBg, borderRadius: '4px', overflow: 'hidden',
        border: `1px solid ${tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.06)`,
        position: 'relative',
      }}>
        {/* Left margin line */}
        <div style={{ position: 'absolute', left: '36px', top: 0, bottom: 0, width: '1px', background: `${tc.accent}25`, zIndex: 1 }} />

        {/* Header */}
        <div style={{ padding: '24px 20px 14px 48px', borderBottom: `1px solid ${tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider}80` }}>
          <div className="flex items-center gap-4 mb-2">
            <span style={{ fontFamily: fonts.display, fontSize: '11px', fontWeight: 600, letterSpacing: '3px', color: ct }}>
              SCENE {String(idx + 1).padStart(2, '0')}
            </span>
            <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '2px', color: cg }}>TAKE 1</span>
          </div>
          <div style={{ fontFamily: fonts.displayKr, fontSize: '13px', fontWeight: 500, color: ct, paddingBottom: '2px' }}>
            {item.question}
          </div>
        </div>

        {/* Photos */}
        {images.length > 0 && (
          <div style={{ padding: '14px 16px 0 16px', display: 'flex', gap: '6px' }}>
            {images.slice(0, 2).map((img: string, imgIdx: number) => {
              const imgSettings = item.imageSettings?.[imgIdx] || {}
              return (
              <div key={imgIdx} className="relative overflow-hidden" style={{ flex: 1, aspectRatio: '1/1', borderRadius: '2px', border: `1px solid ${tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider}60` }}>
                <div className="w-full h-full" style={getImageCropStyle(img, imgSettings)} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.15) 100%)' }} />
                <div className="absolute top-2 right-3" style={{ fontFamily: fonts.display, fontSize: '8px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                  {String(idx + 1).padStart(2, '0')}:{String(imgIdx + 1).padStart(3, '0')}
                </div>
              </div>
              )
            })}
          </div>
        )}

        {/* Dialogue */}
        <div style={{ padding: '20px 20px 6px 48px' }}>
          {linesParsed.filter((line: string) => !(line.startsWith('"') || line.startsWith('\u201C') || line.startsWith("'"))).length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              {linesParsed.filter((line: string) => !(line.startsWith('"') || line.startsWith('\u201C') || line.startsWith("'"))).map((line: string, i: number) => (
                <p key={`action-${i}`} style={{ fontFamily: fonts.body, fontSize: '13px', lineHeight: 1.8, color: cg, marginBottom: '4px' }}>{line}</p>
              ))}
            </div>
          )}
          {linesParsed.filter((line: string) => line.startsWith('"') || line.startsWith('\u201C') || line.startsWith("'")).map((line: string, i: number) => (
            <div key={`dialogue-${i}`} style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: fonts.display, fontSize: '9px', fontWeight: 600, letterSpacing: '3px', color: tc.accent, marginBottom: '5px' }}>
                {i % 2 === 0 ? groomName : brideName}
              </div>
              <p style={{ fontFamily: fonts.body, fontSize: '14px', lineHeight: 1.8, color: ct }}>{line}</p>
            </div>
          ))}
        </div>

        {/* Page number */}
        <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
          <span style={{ fontFamily: fonts.display, fontSize: '9px', color: `${cg}80` }}>{idx + 1}.</span>
        </div>
      </div>
    </div>
  )
}

function FilmScenes({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const interviews = invitation.content?.interviews || []
  const groomName = invitation.groom?.name || ''
  const brideName = invitation.bride?.name || ''
  const { ref, isVisible } = useScrollReveal()

  if (interviews.length === 0) return null

  return (
    <div ref={ref} style={{ backgroundColor: tc.sectionBg }}>
      {/* Section label */}
      <div className="text-center pt-12 pb-8 px-6 transition-all duration-1000" style={{
        opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      }}>
        <div className="flex items-center justify-center gap-3 mb-3">
          <div style={{ height: '1px', width: '20px', background: tc.divider }} />
          <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '5px', color: tc.gray }}>OUR STORY</span>
          <div style={{ height: '1px', width: '20px', background: tc.divider }} />
        </div>
      </div>

      {/* Scene cards */}
      <div style={{ paddingBottom: '24px' }}>
        {interviews.map((item: any, idx: number) => (
          <FilmSceneCard key={idx} item={item} idx={idx} total={interviews.length} groomName={groomName} brideName={brideName} fonts={fonts} tc={tc} />
        ))}
      </div>
    </div>
  )
}

// ===== Chapter 3: Filmstrip Gallery =====
function ChapterThree({ invitation, fonts, tc, onOpenLightbox }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; onOpenLightbox: (idx: number) => void
}) {
  const { ref, isVisible } = useScrollReveal()
  const images = (invitation.gallery?.images || []).map(extractImageUrl).filter(Boolean)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isLight = tc.background === '#FFFFFF'
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-scroll: 이미지를 복제하여 무한 루프 스크롤
  useEffect(() => {
    if (!isVisible || images.length <= 1) return

    const scrollEl = scrollRef.current?.querySelector('.filmstrip-scroll') as HTMLDivElement | null
    if (!scrollEl) return

    // 한 세트 폭 = 프레임수 * (프레임폭 + gap)
    const frameWidth = 180
    const frameGap = 4
    const oneSetWidth = images.length * (frameWidth + frameGap)

    const startAutoScroll = () => {
      stopAutoScroll()
      pausedRef.current = false
      scrollEl.style.scrollSnapType = 'none'

      intervalRef.current = setInterval(() => {
        if (pausedRef.current || !scrollEl) return
        scrollEl.scrollLeft += 1
        // 한 세트만큼 스크롤되면 즉시 원위치 (끊김 없는 무한 루프)
        if (scrollEl.scrollLeft >= oneSetWidth) {
          scrollEl.scrollLeft -= oneSetWidth
        }
      }, 30)
    }

    const stopAutoScroll = () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }

    // 사용자 터치 시 일시 정지, 3초 후 자동 스크롤 재개
    const pauseAutoScroll = () => {
      pausedRef.current = true
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = setTimeout(() => {
        pausedRef.current = false
      }, 3000)
    }

    scrollEl.addEventListener('touchstart', pauseAutoScroll, { passive: true })
    scrollEl.addEventListener('mousedown', pauseAutoScroll)
    scrollEl.addEventListener('wheel', pauseAutoScroll, { passive: true })

    const initTimer = setTimeout(startAutoScroll, 1000)

    return () => {
      clearTimeout(initTimer)
      stopAutoScroll()
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      scrollEl.removeEventListener('touchstart', pauseAutoScroll)
      scrollEl.removeEventListener('mousedown', pauseAutoScroll)
      scrollEl.removeEventListener('wheel', pauseAutoScroll)
    }
  }, [isVisible, images.length])

  if (images.length === 0) return null

  return (
    <div ref={ref} className="py-16" style={{ backgroundColor: tc.background }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}>
        {/* Chapter label */}
        <div className="text-center mb-8 px-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
            <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '5px', color: tc.gray }}>03</span>
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
          </div>
          <h2 style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 400, letterSpacing: '8px', color: tc.text }}>
            MOVIE STILLS
          </h2>
        </div>

        {/* Movie strip - horizontal scroll */}
        <div className="filmstrip-container" ref={scrollRef} style={{ background: '#1A1A1A' }}>
          {/* Top perforations */}
          <div className="filmstrip-perforations">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="filmstrip-hole" style={{ background: '#FFFFFF' }} />
            ))}
          </div>

          {/* Scrollable images - 무한 루프를 위해 이미지 2세트 렌더링 */}
          <div className="filmstrip-scroll">
            {[...images, ...(images.length > 1 ? images : [])].map((img: string, i: number) => {
              const originalIdx = i % images.length
              const imgSettings = (invitation.gallery as any)?.imageSettings?.[originalIdx] || {}
              return (
              <div key={i} className="filmstrip-frame" onClick={() => onOpenLightbox(originalIdx)}>
                <div className="w-full h-full" style={getImageCropStyle(img, imgSettings)} />
              </div>
              )
            })}
          </div>

          {/* Bottom perforations */}
          <div className="filmstrip-perforations">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="filmstrip-hole" style={{ background: '#FFFFFF' }} />
            ))}
          </div>
        </div>

        <div className="text-center mt-4">
          <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.divider }}>
            SWIPE &rarr;
          </span>
        </div>

        {/* Gallery grid - all photos */}
        {images.length > 0 && (
          <div className="px-5 mt-8">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
              {images.map((img: string, i: number) => {
                const imgSettings = (invitation.gallery as any)?.imageSettings?.[i] || {}
                return (
                <div key={i} className="relative overflow-hidden" style={{ aspectRatio: '3/4', cursor: 'pointer' }}
                  onClick={() => onOpenLightbox(i)}>
                  <div className="w-full h-full" style={getImageCropStyle(img, imgSettings)} />
                </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== YouTube Video Section =====
function FilmVideoSection({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const youtube = invitation.youtube
  if (!youtube?.enabled || !youtube?.url) return null

  const match = youtube.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
  const videoId = match?.[1]
  if (!videoId) return null

  return (
    <div className="py-8 px-5" style={{ backgroundColor: tc.background }}>
      {youtube.title && (
        <p className="text-center mb-3" style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', color: tc.gray }}>{youtube.title}</p>
      )}
      <div style={{ aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden', background: '#000' }}>
        <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    </div>
  )
}

// ===== The Premiere (Wedding Details - Ticket Design) =====
function ThePremiere({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const ct = tc.cardText || tc.text
  const cg = tc.cardGray || tc.gray
  const { ref, isVisible } = useScrollReveal()
  const w = invitation.wedding || {}
  const date = w.date ? new Date(w.date) : null
  const dayNamesKr = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const groom = invitation.groom || {}
  const bride = invitation.bride || {}
  const groomName = groom.name || ''
  const brideName = bride.name || ''

  return (
    <div ref={ref} className="px-5 py-20" style={{ backgroundColor: tc.sectionBg }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}>

        {/* ===== TICKET CARD ===== */}
        <div className="premiere-ticket" style={{ background: tc.cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* Ticket Top - Title Area */}
          <div style={{ padding: '28px 24px 20px', borderBottom: `1px dashed ${tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider}`, position: 'relative' }}>
            {/* Notches */}
            <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: tc.sectionBg, top: '100%', left: '-10px', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: tc.sectionBg, top: '100%', right: '-10px', transform: 'translateY(-50%)' }} />

            <div className="flex items-center justify-between mb-4">
              <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.accent }}>ADMIT TWO</span>
              <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '2px', color: cg }}>PREMIERE</span>
            </div>

            {/* Parents + Names */}
            <div className="flex items-center justify-center my-6">
              <div className="text-center" style={{ flex: 1 }}>
                {invitation.sectionVisibility?.parentNames !== false && (groom.father?.name || groom.mother?.name) && (
                  <>
                    <p style={{ fontFamily: fonts.body, fontSize: '11px', color: cg, lineHeight: 1.8 }}>
                      {groom.father?.name && <>{(groom.father as any)?.deceased ? (invitation.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{groom.father.name} &middot; </>}
                      {groom.mother?.name && <>{(groom.mother as any)?.deceased ? (invitation.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{groom.mother.name}</>}
                    </p>
                    <p style={{ fontFamily: fonts.body, fontSize: '10px', color: cg, marginTop: '2px' }}>의 {groom.familyRole || '아들'}</p>
                  </>
                )}
                <p style={{ fontFamily: fonts.display, fontSize: '22px', fontWeight: 300, letterSpacing: '3px', color: ct, marginTop: '6px' }}>{groomName}</p>
              </div>
              <div className="flex-shrink-0" style={{ margin: '0 4px', alignSelf: 'flex-end', marginBottom: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={tc.accent} xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div className="text-center" style={{ flex: 1 }}>
                {invitation.sectionVisibility?.parentNames !== false && (bride.father?.name || bride.mother?.name) && (
                  <>
                    <p style={{ fontFamily: fonts.body, fontSize: '11px', color: cg, lineHeight: 1.8 }}>
                      {bride.father?.name && <>{(bride.father as any)?.deceased ? (invitation.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{bride.father.name} &middot; </>}
                      {bride.mother?.name && <>{(bride.mother as any)?.deceased ? (invitation.deceasedDisplayStyle === 'hanja' ? '故 ' : <><img src="/icons/chrysanthemum.svg" alt="고인" className="inline w-3 h-3 mr-0.5 opacity-70 align-middle" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />{' '}</>) : ''}{bride.mother.name}</>}
                    </p>
                    <p style={{ fontFamily: fonts.body, fontSize: '10px', color: cg, marginTop: '2px' }}>의 {bride.familyRole || '딸'}</p>
                  </>
                )}
                <p style={{ fontFamily: fonts.display, fontSize: '22px', fontWeight: 300, letterSpacing: '3px', color: ct, marginTop: '6px' }}>{brideName}</p>
              </div>
            </div>
          </div>

          {/* Ticket Middle - Date & Venue Info */}
          <div style={{ padding: '24px', borderBottom: `1px dashed ${tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider}`, position: 'relative' }}>
            {/* Notches */}
            <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: tc.sectionBg, top: '100%', left: '-10px', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: tc.sectionBg, top: '100%', right: '-10px', transform: 'translateY(-50%)' }} />

            {/* Date & Time Grid */}
            {date && (
              <>
                <div className="flex items-center justify-center mb-3">
                  <div style={{ fontFamily: fonts.body, fontSize: '13px', fontWeight: 400, color: ct, letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                    {date.getFullYear()}. {String(date.getMonth() + 1).padStart(2, '0')}. {String(date.getDate()).padStart(2, '0')}
                  </div>
                  <div style={{ width: '1px', height: '12px', background: tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider, margin: '0 10px' }} />
                  <div style={{ fontFamily: fonts.body, fontSize: '13px', color: ct, whiteSpace: 'nowrap' }}>
                    {dayNamesKr[date.getDay()]}
                  </div>
                  <div style={{ width: '1px', height: '12px', background: tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider, margin: '0 10px' }} />
                  <div style={{ fontFamily: fonts.body, fontSize: '13px', color: ct, whiteSpace: 'nowrap' }}>
                    {w.timeDisplay || w.time || ''}
                  </div>
                </div>
                {/* D-day */}
                <div className="text-center mb-6">
                  {(() => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const wDate = new Date(date)
                    wDate.setHours(0, 0, 0, 0)
                    const diff = Math.ceil((wDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    const label = diff > 0 ? `결혼식까지 ${diff}일` : diff === 0 ? '오늘 결혼합니다' : `결혼한 지 ${Math.abs(diff)}일`
                    return (
                      <span style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.accent, letterSpacing: '1px' }}>
                        {label}
                      </span>
                    )
                  })()}
                </div>
              </>
            )}

            {/* Venue */}
            <div style={{ background: getAccentTint(tc.accent, 0.85), borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '4px', color: tc.accent, marginBottom: '8px' }}>THEATER</div>
              <p style={{ fontFamily: fonts.displayKr, fontSize: '16px', fontWeight: 500, color: ct }}>{w.venue?.name || ''}</p>
              {w.venue?.hall && !w.venue?.hideHall && (
                <p style={{ fontFamily: fonts.body, fontSize: '12px', color: cg, marginTop: '4px' }}>{w.venue.hall}</p>
              )}
              <p style={{ fontFamily: fonts.body, fontSize: '11px', color: cg, marginTop: '6px', lineHeight: 1.6 }}>{w.venue?.address || ''}</p>
            </div>
          </div>

          {/* Ticket Bottom - Map */}
          <div style={{ padding: '24px' }}>
            {/* Map buttons */}
            {w.venue?.address && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'NAVER', color: '#03C75A', letter: 'N', url: `https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}` },
                  { label: 'KAKAO', color: '#FEE500', letter: 'K', letterColor: '#000', url: `https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}` },
                  { label: 'TMAP', color: '#4285F4', letter: 'T', url: `tmap://search?name=${encodeURIComponent(w.venue.name || '')}` },
                ].map(m => (
                  <a key={m.label} href={m.url} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center py-3" style={{ background: getAccentTint(tc.accent, 0.85), borderRadius: '8px' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1.5" style={{ background: m.color }}>
                      <span style={{ color: m.letterColor || '#fff', fontSize: '9px', fontWeight: 700 }}>{m.letter}</span>
                    </div>
                    <span style={{ fontFamily: fonts.display, fontSize: '7px', letterSpacing: '1px', color: cg }}>{m.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Directions - below ticket */}
        {w.directions && (w.directions.car || w.directions.publicTransport || w.directions.train || w.directions.expressBus || (w.directions.extraInfoEnabled && w.directions.extraInfoText)) && (
          <div className="mt-6 space-y-3">
            <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.accent, textAlign: 'center', marginBottom: '4px' }}>DIRECTIONS</div>
            {w.directions.car && (
              <div style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>BY CAR</div>
                {w.directions.car.split('\n').map((line: string, i: number) => (
                  <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg }}>{line}</p>
                ))}
              </div>
            )}
            {w.directions.publicTransport && (
              <div style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>PUBLIC TRANSIT</div>
                {w.directions.publicTransport.split('\n').map((line: string, i: number) => (
                  <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg }}>{line}</p>
                ))}
              </div>
            )}
            {w.directions.train && (
              <div style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>TRAIN</div>
                {(typeof w.directions.train === 'string' ? w.directions.train : '').split('\n').map((line: string, i: number) => (
                  <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg }}>{line}</p>
                ))}
              </div>
            )}
            {w.directions.expressBus && (
              <div style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>EXPRESS BUS</div>
                {(typeof w.directions.expressBus === 'string' ? w.directions.expressBus : '').split('\n').map((line: string, i: number) => (
                  <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg }}>{line}</p>
                ))}
              </div>
            )}
            {w.directions.extraInfoEnabled && w.directions.extraInfoText && (
              <div style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>{(w.directions.extraInfoTitle || 'INFO').toUpperCase()}</div>
                {w.directions.extraInfoText.split('\n').map((line: string, i: number) => (
                  <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg }}>{line}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Kakao Map Section =====
function MapSection({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { ref, isVisible } = useScrollReveal()
  const [mapError, setMapError] = useState(false)
  const w = invitation.wedding || {}
  const address = w.venue?.address
  const venueName = w.venue?.name || ''

  useEffect(() => {
    if (!address || !isVisible) return

    const initMap = () => {
      const geocoder = new window.kakao.maps.services.Geocoder()
      const container = mapContainerRef.current
      if (!container) return

      geocoder.addressSearch(address, (result: { x: string; y: string }[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          const lat = parseFloat(result[0].y)
          const lng = parseFloat(result[0].x)
          const center = new window.kakao.maps.LatLng(lat, lng)
          const map = new window.kakao.maps.Map(container, { center, level: 3 })
          const marker = new window.kakao.maps.Marker({ position: center })
          marker.setMap(map)
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;white-space:nowrap;">${venueName}</div>`,
          })
          infowindow.open(map, marker)
        } else {
          setMapError(true)
        }
      })
    }

    if (window.kakao?.maps?.services) {
      initMap()
      return
    }

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '0890847927f3189d845391481ead8ecc'
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => { window.kakao.maps.load(initMap) }
    document.head.appendChild(script)
  }, [address, venueName, isVisible])

  if (!address) return null

  return (
    <div ref={ref} className="px-5 py-12" style={{ backgroundColor: tc.background }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
            <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '5px', color: tc.gray }}>LOCATION</span>
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
          </div>
        </div>

        {/* Map container */}
        {!mapError ? (
          <div ref={mapContainerRef} style={{
            width: '100%', height: '240px', borderRadius: '8px', overflow: 'hidden',
            border: `1px solid ${tc.divider}`, background: tc.sectionBg,
          }} />
        ) : (
          <div className="text-center py-8" style={{ background: tc.sectionBg, borderRadius: '8px' }}>
            <p style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.gray }}>지도를 불러올 수 없습니다</p>
          </div>
        )}

        {/* Address copy */}
        <div className="mt-4 text-center">
          <p style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.gray, marginBottom: '8px' }}>{address}</p>
          <button onClick={() => { navigator.clipboard.writeText(address); alert('주소가 복사되었습니다.') }}
            style={{
              fontFamily: fonts.display, fontSize: '9px', letterSpacing: '2px', color: tc.accent,
              background: 'none', border: `1px solid ${tc.accent}40`, padding: '6px 16px', cursor: 'pointer', borderRadius: '4px',
            }}>
            주소 복사
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== Guidance Section =====
function GuidanceSection({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal()
  const info = invitation.content?.info
  const defaultItemOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
  const enabledItems = info ? [
    ...(info.itemOrder || defaultItemOrder).filter((key: string) => info[key]?.enabled && info[key]?.content),
    ...(info.customItems || []).filter((item: any) => item.enabled && item.content).map((_: any, i: number) => `custom-${i}`),
  ] : []

  if (enabledItems.length === 0 && !invitation.guidance?.enabled) return null

  return (
    <div ref={ref} className="py-12" style={{ backgroundColor: tc.background }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
        <div className="text-center mb-8 px-6">
          <h3 style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 400, letterSpacing: '6px', color: tc.text }}>INFORMATION</h3>
          <div style={{ width: '20px', height: '1px', background: tc.accent, margin: '10px auto 0', opacity: 0.5 }} />
        </div>

        {invitation.guidance?.image && (
          <div className="px-6 mb-8">
            <div className="w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <div className="w-full h-full" style={getImageCropStyle(invitation.guidance.image, (invitation.guidance as any).imageSettings || {})} />
            </div>
          </div>
        )}

        {enabledItems.length > 0 && (
          <div className="px-6 space-y-3">
            {enabledItems.map((key: string, i: number) => {
              const isCustom = key.startsWith('custom-')
              const item = isCustom ? info.customItems[parseInt(key.split('-')[1])] : info[key]
              if (!item?.enabled || !item?.content) return null
              return (
                <div key={i} style={{ padding: '14px', background: tc.cardBg, border: `1px solid ${tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider}` }}>
                  <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: tc.accent, marginBottom: '8px' }}>
                    {item.title?.toUpperCase()}
                  </div>
                  {item.content.split('\n').map((line: string, j: number) => (
                    <p key={j} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.cardGray || tc.gray }}>{line}</p>
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

// ===== Credits Roll (auto-scroll) =====
function CreditsSection({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal()
  const thankYou = invitation.content?.thankYou
  if (!thankYou) return null

  return (
    <div ref={ref} className="py-20 overflow-hidden" style={{ backgroundColor: tc.sectionBg }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0 }}>
        {/* Credits viewport */}
        <div className="credits-viewport">
          <div className={`credits-roll ${isVisible ? 'credits-animate' : ''}`}>
            {/* Title */}
            <div className="text-center mb-12">
              <h2 style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 400, letterSpacing: '8px', color: tc.text }}>
                {thankYou.title || 'SPECIAL THANKS'}
              </h2>
              <div style={{ width: '20px', height: '1px', background: tc.accent, margin: '14px auto 0', opacity: 0.5 }} />
            </div>

            {/* Credits content */}
            <div className="text-center space-y-1">
              {thankYou.message?.split('\n').map((line: string, i: number) => {
                const isRole = /^[A-Z\s]+$/.test(line.trim()) && line.trim().length > 0
                const isEmpty = line.trim().length === 0
                if (isEmpty) return <div key={i} style={{ height: '20px' }} />
                return (
                  <p key={i} style={{
                    fontFamily: isRole ? fonts.display : fonts.body,
                    fontSize: isRole ? '9px' : '13px',
                    letterSpacing: isRole ? '5px' : '0.5px',
                    lineHeight: isRole ? 3.5 : 2,
                    color: isRole ? tc.accent : tc.gray,
                  }}>{line}</p>
                )
              })}
            </div>

            {/* Sign */}
            {thankYou.sign && (
              <div className="text-center mt-10">
                <div style={{ width: '1px', height: '20px', background: `${tc.divider}40`, margin: '0 auto 12px' }} />
                <p style={{ fontFamily: fonts.displayKr, fontSize: '13px', color: tc.text, fontWeight: 400 }}>
                  {thankYou.sign}
                </p>
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
          <span style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.cardText || tc.text, marginLeft: '8px' }}>{acc.bank} {acc.account}</span>
          {(acc.holder || acc.name) && <span style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray, marginLeft: '6px' }}>{acc.holder || acc.name}</span>}
        </div>
        <button onClick={() => { navigator.clipboard.writeText(acc.account); alert('계좌번호가 복사되었습니다.') }}
          style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: tc.accent, background: 'none', border: `1px solid ${tc.accent}50`, padding: '4px 12px', cursor: 'pointer' }}>
          COPY
        </button>
      </div>
    ))
  }

  return (
    <div className="px-6 py-12" style={{ backgroundColor: tc.sectionBg }}>
      <div className="text-center mb-8">
        <h3 style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: tc.text, fontWeight: 400 }}>마음 전하실 곳</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(['groom', 'bride'] as const).map(side => (
          <button key={side} onClick={() => setExpandedSide(expandedSide === side ? null : side)}
            style={{
              fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px', padding: '11px',
              border: `1px solid ${expandedSide === side ? tc.accent : tc.divider}`,
              background: expandedSide === side ? tc.accent : tc.cardBg,
              color: expandedSide === side ? '#FFFFFF' : (tc.cardText || tc.text), cursor: 'pointer', transition: 'all 0.3s',
            }}>
            {side.toUpperCase()}
          </button>
        ))}
      </div>
      {expandedSide && (
        <div style={{ padding: '12px 14px', background: tc.cardBg }}>{renderAccounts(expandedSide)}</div>
      )}
    </div>
  )
}

// ===== Sample Guestbook Messages (Movie-themed) =====
const sampleGuestbookMessages = [
  { id: 'sample-1', guest_name: '김지은', message: '이 러브스토리의 결말이 너무 아름다워요. 두 주인공의 해피엔딩을 축하합니다!', question: '두 주인공에게 관람평을 남겨주세요', created_at: '2026-05-20T10:30:00Z' },
  { id: 'sample-2', guest_name: '이준호', message: '올해 본 로맨스 중 최고! 앞으로도 명장면 많이 만들어가길', question: '두 주인공에게 관람평을 남겨주세요', created_at: '2026-05-19T14:20:00Z' },
  { id: 'sample-3', guest_name: '박서윤', message: '두 분의 케미가 역대급이에요. 오래오래 사랑하세요!', question: '두 주인공에게 관람평을 남겨주세요', created_at: '2026-05-18T09:15:00Z' },
  { id: 'sample-4', guest_name: '최민수', message: '속편이 기대되는 영화! 다음 시즌도 함께 응원할게요', question: '두 주인공에게 관람평을 남겨주세요', created_at: '2026-05-17T16:45:00Z' },
  { id: 'sample-5', guest_name: '정하나', message: '캐스팅 완벽합니다. 처음 봤을 때부터 찰떡이었어요', question: '두 사람의 첫인상은 어땠나요?', created_at: '2026-05-16T11:30:00Z' },
  { id: 'sample-6', guest_name: '강민지', message: '감독님 다음 작품도 기대할게요. 행복한 가정 꾸리세요!', question: '두 주인공에게 관람평을 남겨주세요', created_at: '2026-05-15T08:00:00Z' },
  { id: 'sample-7', guest_name: '윤서준', message: '엔딩 크레딧까지 완벽한 영화였어요. 결혼 축하드립니다!', question: '두 주인공에게 관람평을 남겨주세요', created_at: '2026-05-14T13:00:00Z' },
]

// ===== Audience Reviews (Guestbook) =====
function AudienceReviews({ invitation, invitationId, fonts, tc, isSample }: {
  invitation: any; invitationId: string; fonts: FontConfig; tc: ColorConfig; isSample?: boolean
}) {
  const [messages, setMessages] = useState<any[]>(isSample ? sampleGuestbookMessages : [])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAllMessages, setShowAllMessages] = useState(false)
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
  const cdiv = tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider
  const inputStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `1px solid ${cdiv}`, background: tc.cardBg, outline: 'none', color: tc.cardText || tc.text, width: '100%' }

  return (
    <div ref={ref} className="px-6 py-12" style={{ backgroundColor: tc.background }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
      <div className="text-center mb-8">
        <h3 style={{ fontFamily: fonts.display, fontSize: '13px', fontWeight: 400, letterSpacing: '6px', color: tc.text }}>GUESTBOOK</h3>
        <div style={{ width: '20px', height: '1px', background: tc.accent, margin: '10px auto 0', opacity: 0.5 }} />
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
          style={{ width: '100%', fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', padding: '12px', background: tc.accent, color: '#FFFFFF', border: 'none', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
          SUBMIT
        </button>
      </div>
      {messages.length === 0 ? (
        <p className="text-center" style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.gray, padding: '16px 0' }}>첫 번째로 메시지를 남겨보세요!</p>
      ) : (
        <div className="space-y-3">
          {(showAllMessages ? messages : messages.slice(0, 5)).map((msg: any, i: number) => (
            <div key={msg.id || i} style={{ padding: '14px', border: `1px solid ${cdiv}`, background: tc.cardBg }}>
              {msg.question && <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.cardGray || tc.gray, marginBottom: '6px', opacity: 0.6 }}>Q. {msg.question}</p>}
              <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.cardText || tc.text, marginBottom: '8px' }}>{msg.message}</p>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.cardGray || tc.gray }}>&mdash; {msg.guest_name}</span>
                <span style={{ fontFamily: fonts.display, fontSize: '9px', color: tc.cardGray || tc.gray, opacity: 0.4 }}>{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          ))}
          {!showAllMessages && messages.length > 5 && (
            <button
              onClick={() => setShowAllMessages(true)}
              className="w-full py-3 text-center"
              style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', color: tc.accent, border: `1px solid ${cdiv}`, background: 'transparent', cursor: 'pointer' }}>
              +{messages.length - 5} MORE REVIEWS
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

// ===== Ticket-style RSVP =====
function TicketRsvp({ invitation, invitationId, fonts, tc }: {
  invitation: any; invitationId: string; fonts: FontConfig; tc: ColorConfig
}) {
  const { ref, isVisible } = useScrollReveal()
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState<'yes' | 'no'>('yes')
  const [guestCount, setGuestCount] = useState(1)
  const [rsvpMessage, setRsvpMessage] = useState('')
  const [side, setSide] = useState<'groom' | 'bride' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!invitation.rsvpEnabled) return null

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const attendanceMap: Record<string, string> = { yes: 'attending', no: 'not_attending' }
      const res = await fetch('/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, guestName: name, attendance: attendanceMap[attendance] || attendance, guestCount: attendance === 'yes' ? guestCount : 0, message: rsvpMessage, side: side || undefined }) })
      if (res.ok) setSubmitted(true)
    } catch {} setSubmitting(false)
  }

  const cdiv = tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider
  const inputStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `1px solid ${cdiv}`, background: tc.cardBg, outline: 'none', color: tc.cardText || tc.text, width: '100%' }

  if (submitted) {
    return (
      <div className="px-6 py-16 text-center" style={{ backgroundColor: tc.sectionBg }}>
        <div style={{ fontFamily: fonts.display, fontSize: '13px', letterSpacing: '6px', color: tc.text, marginBottom: '8px' }}>CONFIRMED</div>
        <p style={{ fontFamily: fonts.body, fontSize: '13px', color: tc.gray }}>참석 여부가 전달되었습니다.</p>
      </div>
    )
  }

  const w = invitation.wedding || {}
  const date = w.date ? new Date(w.date) : null

  return (
    <div ref={ref} className="px-6 py-12" style={{ backgroundColor: tc.sectionBg }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
      {/* Ticket card */}
      <div className="ticket-card" style={{ background: tc.cardBg, border: `1px solid ${cdiv}`, position: 'relative', overflow: 'hidden' }}>
        {/* Ticket top - event info */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px dashed ${cdiv}`, position: 'relative' }}>
          {/* Ticket notches */}
          <div className="ticket-notch-left" style={{ background: tc.sectionBg }} />
          <div className="ticket-notch-right" style={{ background: tc.sectionBg }} />

          <div className="flex items-center justify-between mb-3">
            <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: tc.accent }}>ADMIT ONE</span>
            <span style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '2px', color: tc.cardGray || tc.gray }}>
              {date ? `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}` : ''}
            </span>
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: '13px', letterSpacing: '6px', color: tc.cardText || tc.text, marginBottom: '4px' }}>
            RESERVATION
          </div>
          <div style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.cardGray || tc.gray }}>
            {w.venue?.name || ''} {w.timeDisplay || w.time || ''}
          </div>
        </div>

        {/* Ticket bottom - form */}
        <div style={{ padding: '16px 20px 20px' }}>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="성함" style={inputStyle} />
            <div className="grid grid-cols-2 gap-2">
              {([{ value: 'groom' as const, label: '신랑측' }, { value: 'bride' as const, label: '신부측' }]).map(opt => (
                <button key={opt.value} onClick={() => setSide(side === opt.value ? null : opt.value)}
                  style={{
                    fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px', padding: '11px',
                    border: `1px solid ${side === opt.value ? tc.accent : cdiv}`,
                    background: side === opt.value ? tc.accent : 'transparent',
                    color: side === opt.value ? '#FFFFFF' : (tc.cardText || tc.text), cursor: 'pointer', transition: 'all 0.3s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['yes', 'no'] as const).map(opt => (
                <button key={opt} onClick={() => setAttendance(opt)}
                  style={{
                    fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px', padding: '11px',
                    border: `1px solid ${attendance === opt ? tc.accent : cdiv}`,
                    background: attendance === opt ? tc.accent : 'transparent',
                    color: attendance === opt ? '#FFFFFF' : (tc.cardText || tc.text), cursor: 'pointer', transition: 'all 0.3s',
                  }}>
                  {opt === 'yes' ? 'ATTENDING' : 'REGRET'}
                </button>
              ))}
            </div>
            {attendance === 'yes' && invitation.rsvpAllowGuestCount && (
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.cardGray || tc.gray }}>참석 인원</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    style={{ width: '30px', height: '30px', border: `1px solid ${cdiv}`, background: 'transparent', cursor: 'pointer', fontSize: '14px', color: tc.cardText || tc.text }}>-</button>
                  <span style={{ fontFamily: fonts.display, fontSize: '14px', width: '28px', textAlign: 'center', color: tc.cardText || tc.text }}>{guestCount}</span>
                  <button onClick={() => setGuestCount(guestCount + 1)}
                    style={{ width: '30px', height: '30px', border: `1px solid ${cdiv}`, background: 'transparent', cursor: 'pointer', fontSize: '14px', color: tc.cardText || tc.text }}>+</button>
                </div>
              </div>
            )}
            <textarea value={rsvpMessage} onChange={e => setRsvpMessage(e.target.value)} placeholder="전하고 싶은 말 (선택)" rows={2}
              style={{ ...inputStyle, resize: 'none' as const }} />
            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: '100%', fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', padding: '13px', background: tc.accent, color: '#FFFFFF', border: 'none', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
              CONFIRM
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

// ===== Movie Footer =====
function FilmFooter({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  return (
    <div className="px-6 py-14 text-center" style={{ backgroundColor: tc.background, borderTop: `1px solid ${tc.divider}40` }}>
      <div style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 200, letterSpacing: '6px', color: tc.text, marginBottom: '12px', opacity: 0.6 }}>
        FIN.
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '4px', color: tc.gray, opacity: 0.5 }}>
        {invitation.groom?.name || ''} & {invitation.bride?.name || ''}
      </div>
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

  /* Movie grain - cover only */
  .film-grain {
    position: absolute; inset: 0; z-index: 10; pointer-events: none; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 128px 128px;
  }
  @keyframes grain {
    0%, 100% { transform: translate(0,0); }
    10% { transform: translate(-5%,-10%); }
    30% { transform: translate(7%,-25%); }
    50% { transform: translate(-15%,10%); }
    70% { transform: translate(0%,15%); }
    90% { transform: translate(-10%,10%); }
  }

  /* Scene horizontal scroll */
  .film-scene-scroll::-webkit-scrollbar { display: none; }

  /* Filmstrip gallery */
  .filmstrip-container {
    padding: 0 0; overflow: hidden;
    background: #1A1A1A;
  }
  .filmstrip-perforations {
    display: flex; gap: 12px; padding: 6px 8px; justify-content: center;
  }
  .filmstrip-hole {
    width: 10px; height: 7px; border-radius: 2px;
    background: #333; flex-shrink: 0;
  }
  .filmstrip-scroll {
    display: flex; gap: 4px; overflow-x: auto; padding: 4px 16px;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  .filmstrip-scroll::-webkit-scrollbar { display: none; }
  .filmstrip-frame {
    flex-shrink: 0; width: 180px; height: 240px;
    overflow: hidden; cursor: pointer;
  }
  .filmstrip-frame > div {
    transition: transform 0.5s ease;
  }
  .filmstrip-frame:hover > div {
    transform: scale(1.05);
  }

  /* Credits roll */
  .credits-viewport {
    height: 320px; overflow: hidden; position: relative;
    mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  }
  .credits-roll {
    padding: 0 24px;
    transform: translateY(100%);
    transition: none;
  }
  .credits-animate {
    animation: creditsScroll 18s linear infinite;
  }
  @keyframes creditsScroll {
    0% { transform: translateY(100%); }
    100% { transform: translateY(-100%); }
  }

  /* Ticket notches */
  .ticket-notch-left, .ticket-notch-right {
    position: absolute; width: 16px; height: 16px; border-radius: 50%;
    top: 50%; transform: translateY(-50%);
  }
  .ticket-notch-left { left: -8px; }
  .ticket-notch-right { right: -8px; }

  /* Enter button hover */
  .film-enter-btn:hover {
    border-color: rgba(232,228,223,0.5) !important;
  }
  .film-play-btn:hover {
    border-color: rgba(139,115,85,0.5) !important;
    background: rgba(139,115,85,0.06) !important;
  }
`

// ===== Transform data =====
function transformToDisplayData(invitation: Invitation, content: InvitationContent | null) {
  if (!content) return null
  return {
    id: invitation.id,
    colorTheme: (content.colorTheme || 'film-dark') as ColorTheme,
    fontStyle: (content.fontStyle || 'classic') as FontStyle,
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
    customAccentColor: content.customAccentColor,
  }
}

// ===== Main Component =====
function InvitationClientFilmContent({
  invitation: dbInvitation, content, isPaid, isPreview,
  overrideColorTheme, overrideFontStyle, skipIntro, guestInfo, isSample,
}: InvitationClientProps) {
  const invitation = transformToDisplayData(dbInvitation, content)

  const effectiveColorTheme = (overrideColorTheme && overrideColorTheme in colorThemes) ? overrideColorTheme as ColorTheme
    : (invitation?.colorTheme && invitation.colorTheme in colorThemes) ? invitation.colorTheme as ColorTheme : 'film-dark'
  const effectiveFontStyle = (overrideFontStyle && overrideFontStyle in fontStyles) ? overrideFontStyle as FontStyle
    : (invitation?.fontStyle && invitation.fontStyle in fontStyles) ? invitation.fontStyle as FontStyle : 'classic'

  const [currentPage, setCurrentPage] = useState<'cover' | 'main'>(skipIntro ? 'main' : 'cover')
  const audioRef = useRef<HTMLAudioElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // skipIntro prop 변경 시 페이지 전환 (에디터 미리보기용)
  useEffect(() => {
    setCurrentPage(skipIntro ? 'main' : 'cover')
  }, [skipIntro])

  const baseTc = colorThemes[effectiveColorTheme]
  const customAccent = invitation?.customAccentColor
  // film-light: 베이지(#F8F6F3) 대신 accent 틴트를 sectionBg로 사용
  const tc = (() => {
    const base = customAccent ? { ...baseTc, accent: customAccent } : { ...baseTc }
    if (!base.cardText) base.sectionBg = getAccentTint(base.accent, 0.85)
    return base
  })()
  const fonts = fontStyles[effectiveFontStyle]

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
                    <FilmPosterCover invitation={invitation} fonts={fonts} tc={tc} onEnter={() => setCurrentPage('main')} />
                  ) : (
                    <>
                      <FilmHeader invitation={invitation} fonts={fonts} tc={tc} />
                      <ChapterOne invitation={invitation} fonts={fonts} tc={tc} />
                      <SceneCut from={tc.background} to={tc.sectionBg} />
                      <ChapterTwo invitation={invitation} fonts={fonts} tc={tc} />
                      <FilmScenes invitation={invitation} fonts={fonts} tc={tc} />
                      <SceneCut from={tc.background} to={tc.background} />
                      <ChapterThree invitation={invitation} fonts={fonts} tc={tc} onOpenLightbox={(idx) => { setLightboxIndex(idx); setLightboxOpen(true) }} />
                      <FilmVideoSection invitation={invitation} fonts={fonts} tc={tc} />
                      <SceneCut from={tc.background} to={tc.sectionBg} />
                      <ThePremiere invitation={invitation} fonts={fonts} tc={tc} />
                      <GuidanceSection invitation={invitation} fonts={fonts} tc={tc} />
                      <CreditsSection invitation={invitation} fonts={fonts} tc={tc} />
                      {(invitation as any).magazineLayout?.bankAccountsInMain !== false && (
                        <GiftSection invitation={invitation} fonts={fonts} tc={tc} />
                      )}
                      <AudienceReviews invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} tc={tc} isSample={isSample} />
                      {(invitation as any).magazineLayout?.rsvpInMain !== false && (
                        <TicketRsvp invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} tc={tc} />
                      )}
                      <FilmFooter invitation={invitation} fonts={fonts} tc={tc} />
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
                <GuestFloatingButton themeColors={{...tc, primary: tc.cardText ? tc.accent : tc.primary, sectionBg: getAccentTint(tc.accent, 0.85), text: tc.cardText || tc.text, gray: tc.cardGray || tc.gray, background: getAccentTint(tc.accent, 0.82)}} fonts={fonts} openModal="none" onModalClose={() => {}} showTooltip={false} scrollContainerRef={scrollContainerRef}
                  invitation={{ venue_name: invitation.wedding?.venue?.name || '', venue_address: invitation.wedding?.venue?.address || '', contacts, accounts,
                    directions: invitation.wedding?.directions, rsvpEnabled: invitation.rsvpEnabled, rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
                    invitationId: dbInvitation.id, groomName: invitation.groom?.name || '', brideName: invitation.bride?.name || '',
                    weddingDate: invitation.wedding?.date || '', weddingTime: invitation.wedding?.timeDisplay || invitation.wedding?.time || '',
                    thumbnailUrl: content?.meta?.kakaoThumbnail || content?.meta?.ogImage || extractImageUrl(invitation.media?.coverImage) || '',
                    shareTitle: content?.meta?.title, shareDescription: content?.meta?.description }} />
              )}
              <MusicToggle audioRef={audioRef} isVisible={currentPage === 'main'} shouldAutoPlay={currentPage === 'main' && invitation.bgm?.autoplay === true} tc={tc} />
              <GalleryLightbox images={invitation.gallery?.images || []} isOpen={lightboxOpen} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function InvitationErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{ backgroundColor: '#FFFFFF' }}>
      <h2 className="text-lg font-medium mb-2" style={{ color: '#1A1A1A' }}>청첩장을 불러오는 중 오류가 발생했습니다</h2>
      <p className="text-sm text-gray-400 mb-4">잠시 후 다시 시도해주세요</p>
      <button onClick={resetError} className="px-4 py-2 text-sm" style={{ background: '#D4838F', color: '#FFFFFF' }}>다시 시도</button>
    </div>
  )
}

export default function InvitationClientFilm(props: InvitationClientProps) {
  return (
    <ErrorBoundary fallback={<InvitationErrorFallback resetError={() => window.location.reload()} />}>
      <InvitationClientFilmContent {...props} />
    </ErrorBoundary>
  )
}
