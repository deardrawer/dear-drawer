'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
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


type FontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury' | 'gulim' | 'adulthand' | 'neathand' | 'roundhand' | 'roundgothic' | 'suit' | 'myungjo' | 'film'
interface FontConfig { display: string; displayKr: string; body: string; scale?: number; ds?: number }

const fontStyles: Record<FontStyle, FontConfig> = {
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
  film: { display: "'Playfair Display', serif", displayKr: "'Inter', sans-serif", body: "'Inter', sans-serif" },
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
function FilmPosterCover({ invitation, fonts, tc, onEnter, isPreview }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; onEnter: () => void; isPreview?: boolean
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
  const hasGroomEn = !!invitation.groom?.nameEn
  const hasBrideEn = !!invitation.bride?.nameEn
  const venueName = invitation.wedding?.venue?.name || ''
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`

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
    <div className="relative w-full flex flex-col items-center justify-center"
      style={{ backgroundColor: coverBg, overflow: 'hidden', minHeight: isPreview ? '660px' : '100vh' }}>

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
              fontFamily: hasGroomEn ? fonts.display : fonts.displayKr,
              fontSize: hasGroomEn ? dfs(36) : '36px',
              fontWeight: 300,
              color: coverText,
              letterSpacing: hasGroomEn ? '4px' : '8px',
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
              fontSize: dfs(16),
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
              fontFamily: hasBrideEn ? fonts.display : fonts.displayKr,
              fontSize: hasBrideEn ? dfs(36) : '36px',
              fontWeight: 300,
              color: coverText,
              letterSpacing: hasBrideEn ? '4px' : '8px',
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

// ===== Cinematic Photo Cover (B version) =====
function FilmCinematicCover({ invitation, fonts, tc, onEnter, isPreview }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; onEnter: () => void; isPreview?: boolean
}) {
  const [phase, setPhase] = useState(0)
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`

  const w = invitation.wedding
  const weddingDate = w?.date ? new Date(w.date) : new Date()
  const dateFormatted = `${weddingDate.getFullYear()}.${String(weddingDate.getMonth() + 1).padStart(2,'0')}.${String(weddingDate.getDate()).padStart(2,'0')}`
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = dayNames[weddingDate.getDay()]
  const groomName = invitation.groom?.nameEn || invitation.groom?.name || ''
  const brideName = invitation.bride?.nameEn || invitation.bride?.name || ''
  const venueName = invitation.wedding?.venue?.name || ''
  const coverImage = invitation.media?.coverImage || ''
  const cropSettings = invitation.media?.coverImageSettings || {}
  const cropPosX = 50 + (cropSettings.positionX || 0)
  const cropPosY = 50 + (cropSettings.positionY || 0)
  const cropScale = cropSettings.scale || 1
  const hasGroomEn = !!invitation.groom?.nameEn
  const hasBrideEn = !!invitation.bride?.nameEn

  const accent = tc.accent || '#D4838F'
  const coverGray = 'rgba(255,255,255,0.55)'
  const coverGrayDim = 'rgba(255,255,255,0.3)'

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),    // photo fade-in + slow zoom
      setTimeout(() => setPhase(2), 1600),   // top label
      setTimeout(() => setPhase(3), 2400),   // names
      setTimeout(() => setPhase(4), 3400),   // date + venue
      setTimeout(() => setPhase(5), 5000),   // hold
      setTimeout(() => setPhase(6), 5600),   // fade out
      setTimeout(() => onEnter(), 6400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="relative w-full" style={{ height: isPreview ? '660px' : '100dvh', overflow: 'hidden', backgroundColor: '#0A0A0A' }}>

      {/* Photo background with slow Ken Burns zoom + crop settings */}
      {coverImage && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: `${cropPosX}% ${cropPosY}%`,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1.12)' : 'scale(1)',
          transition: phase >= 1
            ? 'opacity 2s ease, transform 16s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : 'none',
        }} />
      )}

      {/* Dark overlay — cinematic bottom-heavy gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.92) 100%)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 2s ease',
      }} />

      {/* Fade out overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 15,
        background: '#0A0A0A',
        opacity: phase >= 6 ? 1 : 0,
        transition: 'opacity 0.8s ease',
        pointerEvents: 'none',
      }} />

      {/* Top: "A FILM" */}
      <div style={{
        position: 'absolute', top: '32px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 1s ease',
      }}>
        <span style={{
          fontFamily: fonts.display, fontSize: dfs(8), fontWeight: 400,
          letterSpacing: '6px', color: coverGray,
        }}>A Film</span>
      </div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute', bottom: '80px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center', padding: '0 30px',
      }}>
        {/* Names — stacked vertical */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(18px)',
            transition: 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>
            <span style={{
              fontFamily: hasGroomEn ? fonts.display : fonts.displayKr, fontSize: hasGroomEn ? dfs(38) : '38px', fontWeight: 400,
              color: '#FFFFFF', letterSpacing: hasGroomEn ? '2px' : '8px',
              textShadow: '0 2px 24px rgba(0,0,0,0.6)',
            }}>{groomName}</span>
          </div>
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'scale(1)' : 'scale(0.7)',
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s',
            margin: '-2px 0',
          }}>
            <span style={{
              fontFamily: fonts.display, fontSize: dfs(20), fontWeight: 400,
              color: accent, textShadow: `0 0 16px ${accent}40`,
            }}>&amp;</span>
          </div>
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(-18px)',
            transition: 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s',
          }}>
            <span style={{
              fontFamily: hasBrideEn ? fonts.display : fonts.displayKr, fontSize: hasBrideEn ? dfs(38) : '38px', fontWeight: 400,
              color: '#FFFFFF', letterSpacing: hasBrideEn ? '2px' : '8px',
              textShadow: '0 2px 24px rgba(0,0,0,0.6)',
            }}>{brideName}</span>
          </div>
        </div>

        {/* Thin accent line */}
        <div style={{
          width: phase >= 4 ? '50px' : '0px', height: '1px',
          background: `${accent}80`,
          margin: '0 auto 18px',
          transition: 'width 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }} />

        {/* Date + Venue */}
        <div style={{
          opacity: phase >= 4 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          <div style={{
            fontFamily: fonts.display, fontSize: dfs(12), fontWeight: 300,
            color: coverGray, letterSpacing: '4px',
          }}>
            {dateFormatted} {dayOfWeek && <span style={{ fontSize: dfs(10), color: coverGrayDim }}>({dayOfWeek})</span>}
          </div>
          {venueName && (
            <div style={{
              fontFamily: fonts.displayKr, fontSize: '11px', fontWeight: 300,
              color: coverGrayDim, letterSpacing: '2px', marginTop: '6px',
            }}>
              {venueName}
            </div>
          )}
        </div>
      </div>

      {/* Skip button */}
      <div className="absolute" style={{
        bottom: '36px', left: 0, right: 0,
        textAlign: 'center',
        opacity: (phase >= 2 && phase < 6) ? 0.5 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: (phase >= 2 && phase < 6) ? 'auto' : 'none',
        zIndex: 25,
      }}>
        <button onClick={onEnter} style={{
          fontFamily: fonts.display,
          fontSize: dfs(9),
          letterSpacing: '4px',
          color: coverGrayDim,
          background: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
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
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  return (
    <div className="absolute top-0 left-0 right-0 z-40 px-5 py-3 flex items-center justify-between"
      style={{ backgroundColor: tc.background, borderBottom: `1px solid ${tc.divider}40` }}>
      <div style={{ fontFamily: fonts.displayKr, fontSize: '11px', fontWeight: 400, letterSpacing: '4px', color: tc.gray }}>
        {invitation.groom?.name || ''} & {invitation.bride?.name || ''}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '3px', color: tc.divider }}>
        Movie
      </div>
    </div>
  )
}

// ===== Chapter 1: The Beginning (Split Text + Blur to Focus) =====
function ChapterOne({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const { ref, isVisible } = useScrollReveal()
  const greeting = invitation.content?.greeting || ''
  const greetingDialogue = invitation.content?.greetingDialogue || ''

  // 새 필드(greetingDialogue)가 있으면 분리 모드, 없으면 기존 파싱 유지
  const hasNewFields = !!greetingDialogue.trim()

  // 나레이션 줄
  const narrationLines = greeting.split('\n')
  // 대사 줄
  const dialogueLines = greetingDialogue.split('\n').filter((l: string) => l.trim().length > 0)

  // 하위호환: 기존 방식 (따옴표로 구분)
  const isDialogue = (line: string) => line.startsWith('"') || line.startsWith('\u201C') || line.startsWith("'")
  const legacyLines = greeting.split('\n')

  // 총 줄 수 (애니메이션 타이밍용)
  const totalLineCount = hasNewFields ? narrationLines.length + dialogueLines.length : legacyLines.length
  let lineCounter = 0

  return (
    <div ref={ref} className="px-6" style={{ backgroundColor: tc.background }}>
      {/* Chapter label - letter spacing animation */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-3" style={{
          opacity: isVisible ? 1 : 0, transition: 'opacity 0.8s ease 0.2s',
        }}>
          <span style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '6px', color: tc.gray, textTransform: 'uppercase' as const }}>PROLOGUE</span>
        </div>
        <h2 style={{
          fontFamily: fonts.display, fontSize: dfs(26), fontWeight: 400, fontStyle: 'italic', color: tc.accent,
          letterSpacing: isVisible ? '2px' : '12px',
          opacity: isVisible ? 1 : 0,
          transition: 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s',
        }}>
          The Beginning
        </h2>
      </div>

      {/* Greeting - split text reveal + blur to focus */}
      <div style={{ maxWidth: '300px', margin: '0 auto' }}>
        {hasNewFields ? (
          <>
            {/* 나레이션 */}
            {narrationLines.map((line: string, i: number) => {
              if (line.trim().length === 0) return <div key={`n-${i}`} style={{ height: '12px' }} />
              const idx = lineCounter++
              return (
                <div key={`n-${i}`} className="film-text-reveal" style={{ overflow: 'hidden', textAlign: 'center' }}>
                  <p style={{
                    fontFamily: fonts.body, fontSize: '13px', lineHeight: 2.2,
                    color: tc.text,
                    fontWeight: 400, marginBottom: '2px',
                    opacity: isVisible ? 1 : 0,
                    filter: isVisible ? 'blur(0)' : 'blur(6px)',
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.5 + idx * 0.15}s`,
                  }}>{line}</p>
                </div>
              )
            })}
            {/* 대사 */}
            {dialogueLines.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {dialogueLines.map((line: string, i: number) => {
                  const idx = lineCounter++
                  return (
                    <div key={`d-${i}`} className="film-text-reveal" style={{ overflow: 'hidden', textAlign: 'center' }}>
                      <p style={{
                        fontFamily: fonts.displayKr, fontSize: '15px', lineHeight: 2.2,
                        color: tc.accent, fontStyle: 'italic', fontWeight: 400, marginBottom: '2px',
                        opacity: isVisible ? 1 : 0,
                        filter: isVisible ? 'blur(0)' : 'blur(6px)',
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.5 + idx * 0.15}s`,
                      }}>{line}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* 하위호환: 기존 따옴표 파싱 */
          legacyLines.map((line: string, i: number) => {
            if (line.trim().length === 0) return <div key={i} style={{ height: '12px' }} />
            const dialogue = isDialogue(line)
            return (
              <div key={i} className="film-text-reveal" style={{ overflow: 'hidden', textAlign: 'center' }}>
                <p style={{
                  fontFamily: dialogue ? fonts.displayKr : fonts.body,
                  fontSize: dialogue ? '15px' : '13px',
                  lineHeight: 2.2,
                  color: dialogue ? tc.accent : (i < 3 ? tc.text : tc.gray),
                  fontStyle: dialogue ? 'italic' : 'normal',
                  fontWeight: 400, marginBottom: '2px',
                  opacity: isVisible ? 1 : 0,
                  filter: isVisible ? 'blur(0)' : 'blur(6px)',
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0.5 + i * 0.15}s`,
                }}>{line}</p>
              </div>
            )
          })
        )}
      </div>

      {/* Quote - blur to focus with author */}
      {invitation.content?.quote?.text && (
        <div className="mt-14 text-center" style={{
          opacity: isVisible ? 1 : 0,
          filter: isVisible ? 'blur(0)' : 'blur(4px)',
          transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: `all 1.2s ease ${0.5 + totalLineCount * 0.15 + 0.3}s`,
        }}>
          <div style={{ width: '1px', height: '24px', background: tc.accent, margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ fontFamily: fonts.displayKr, fontSize: '11px', fontStyle: 'italic', lineHeight: 2, color: tc.accent, opacity: 0.7, whiteSpace: 'pre-line' }}>
            {invitation.content.quote.text}
          </p>
          {invitation.content.quote.author && (
            <p style={{ fontFamily: fonts.displayKr, fontSize: '9px', letterSpacing: '3px', color: tc.gray, marginTop: '8px', opacity: 0.5 }}>
              &mdash; {invitation.content.quote.author}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ===== Chapter 2: Cast & Story =====
function ChapterTwo({ invitation, fonts, tc, bgOverride }: { invitation: any; fonts: FontConfig; tc: ColorConfig; bgOverride?: string }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const { ref, isVisible } = useScrollReveal(0.3)
  const groomProfile = invitation.groom?.profile
  const brideProfile = invitation.bride?.profile
  const groomImage = extractImageUrl(groomProfile?.images?.[0])
  const brideImage = extractImageUrl(brideProfile?.images?.[0])
  const groomName = invitation.groom?.name || ''
  const brideName = invitation.bride?.name || ''

  return (
    <div style={{ backgroundColor: bgOverride || tc.sectionBg }}>
      {/* CAST section */}
      <div ref={ref}>
        <div className="px-6 transition-all duration-1000"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}>
          {/* Chapter label */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '6px', color: tc.gray, textTransform: 'uppercase' as const }}>STARRING</span>
            </div>
            <h2 style={{ fontFamily: fonts.display, fontSize: dfs(26), fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: tc.accent }}>
              Cast
            </h2>
          </div>

          {/* Poster-style profile cards with scale reveal */}
          <div className="grid grid-cols-2 gap-3">
            {/* Groom */}
            <div>
              <div style={{
                aspectRatio: '2/3',
                borderRadius: '4px',
                overflow: 'hidden',
                clipPath: isVisible ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
                transition: 'clip-path 1.2s cubic-bezier(0.77, 0, 0.175, 1) 0.2s',
              }}>
                <div className="relative w-full h-full">
                  {groomImage ? (
                    <CroppedImageDiv
                      src={groomImage}
                      crop={groomProfile?.imageSettings?.[0] || {}}
                      className="w-full h-full"
                      style={{
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
                </div>
              </div>
              {/* Name + tag + role label below photo */}
              <div style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.6s ease 1.4s',
                marginTop: '12px',
              }}>
                <div style={{ width: '20px', height: '1px', backgroundColor: tc.accent, marginBottom: '10px' }} />
                <div style={{ fontFamily: fonts.displayKr, fontSize: '14px', letterSpacing: '3px', color: tc.text, fontWeight: 400 }}>
                  {groomName}
                </div>
                {groomProfile?.tag && (
                  <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.gray, marginTop: '5px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {groomProfile.tag}
                  </p>
                )}
                <div style={{ fontFamily: fonts.display, fontSize: dfs(9), letterSpacing: '4px', color: tc.gray, marginTop: '8px', opacity: 0.6 }}>
                  As Groom
                </div>
              </div>
            </div>
            {/* Bride */}
            <div>
              <div style={{
                aspectRatio: '2/3',
                borderRadius: '4px',
                overflow: 'hidden',
                clipPath: isVisible ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
                transition: 'clip-path 1.2s cubic-bezier(0.77, 0, 0.175, 1) 0.6s',
              }}>
                <div className="relative w-full h-full">
                  {brideImage ? (
                    <CroppedImageDiv
                      src={brideImage}
                      crop={brideProfile?.imageSettings?.[0] || {}}
                      className="w-full h-full"
                      style={{
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
                </div>
              </div>
              {/* Name + tag + role label below photo */}
              <div style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.6s ease 1.8s',
                marginTop: '12px',
              }}>
                <div style={{ width: '20px', height: '1px', backgroundColor: tc.accent, marginBottom: '10px' }} />
                <div style={{ fontFamily: fonts.displayKr, fontSize: '14px', letterSpacing: '3px', color: tc.text, fontWeight: 400 }}>
                  {brideName}
                </div>
                {brideProfile?.tag && (
                  <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.gray, marginTop: '5px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {brideProfile.tag}
                  </p>
                )}
                <div style={{ fontFamily: fonts.display, fontSize: dfs(9), letterSpacing: '4px', color: tc.gray, marginTop: '8px', opacity: 0.6 }}>
                  As Bride
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
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const images = (item.images || []).map(extractImageUrl).filter(Boolean)
  const ref = useRef<HTMLDivElement>(null)
  // Scene은 어두운 배경 위에 직접 렌더 → 밝은 텍스트 사용 (HTML: #ffffff)
  const ct = tc.text
  const cg = tc.gray

  // 새 필드 존재 여부 확인
  const hasNewFields = !!(item.groomDialogue?.trim() || item.brideDialogue?.trim() || item.narration?.trim())

  // 하위호환용: 기존 answer 파싱
  const linesParsed = (item.answer || '').split('\n').filter((l: string) => l.trim().length > 0)

  // 새 필드의 표기명
  const groomLabel = item.groomDisplayName || groomName
  const brideLabel = item.brideDisplayName || brideName

  // displayOrder (비어있는 블록은 필터)
  const displayOrder: ('groom' | 'bride' | 'narration')[] = item.displayOrder || ['narration', 'groom', 'bride']

  const renderBlock = (type: 'groom' | 'bride' | 'narration', key: string) => {
    if (type === 'narration') {
      const text = (item.narration || '').trim()
      if (!text) return null
      return (
        <div key={key} style={{ marginBottom: '14px' }}>
          {text.split('\n').map((line: string, i: number) =>
            line.trim().length === 0
              ? <div key={i} style={{ height: '12px' }} />
              : <p key={i} style={{ fontFamily: fonts.body, fontSize: '13px', lineHeight: 1.8, color: cg, marginBottom: '4px' }}>{line}</p>
          )}
        </div>
      )
    }
    if (type === 'groom') {
      const text = (item.groomDialogue || '').trim()
      if (!text) return null
      return (
        <div key={key} style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: fonts.displayKr, fontSize: '9px', fontWeight: 600, letterSpacing: '3px', color: tc.accent, marginBottom: '5px' }}>
            {groomLabel}
          </div>
          {text.split('\n').map((line: string, i: number) =>
            line.trim().length === 0
              ? <div key={i} style={{ height: '12px' }} />
              : <p key={i} style={{ fontFamily: fonts.body, fontSize: '14px', lineHeight: 1.8, color: ct }}>{line}</p>
          )}
        </div>
      )
    }
    if (type === 'bride') {
      const text = (item.brideDialogue || '').trim()
      if (!text) return null
      return (
        <div key={key} style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: fonts.displayKr, fontSize: '9px', fontWeight: 600, letterSpacing: '3px', color: tc.accent, marginBottom: '5px' }}>
            {brideLabel}
          </div>
          {text.split('\n').map((line: string, i: number) =>
            line.trim().length === 0
              ? <div key={i} style={{ height: '12px' }} />
              : <p key={i} style={{ fontFamily: fonts.body, fontSize: '14px', lineHeight: 1.8, color: ct }}>{line}</p>
          )}
        </div>
      )
    }
    return null
  }

  // 사진 레이아웃: 1장=16/9, 2장=3/4, 3장+=1/1
  const photoAspect = images.length === 1 ? '16/9' : images.length === 2 ? '3/4' : '1/1'
  const maxPhotos = images.length === 1 ? 1 : images.length === 2 ? 2 : 3

  // dialogue 렌더 (HTML 스타일: "speaker —" + 줄바꿈 + 대사)
  const renderDialogueBlock = (label: string, text: string, key: string) => {
    if (!text?.trim()) return null
    return (
      <div key={key} style={{ marginBottom: '8px' }}>
        <span style={{ fontFamily: fonts.body, color: tc.accent, fontWeight: 500, fontSize: '10px', letterSpacing: '2px' }}>
          {label} &mdash;
        </span>
        <br />
        {(() => {
          const lines = text.split('\n')
          const nonEmptyLines = lines.filter(l => l.trim().length > 0)
          const firstNonEmpty = lines.findIndex(l => l.trim().length > 0)
          const lastNonEmpty = lines.length - 1 - [...lines].reverse().findIndex(l => l.trim().length > 0)
          const alreadyQuoted = nonEmptyLines[0]?.startsWith('"') || nonEmptyLines[0]?.startsWith('\u201C')
          return lines.map((line: string, i: number) => {
            if (line.trim().length === 0) return <div key={i} style={{ height: '8px' }} />
            let displayLine = line
            if (!alreadyQuoted) {
              if (i === firstNonEmpty) displayLine = `\u201C${displayLine}`
              if (i === lastNonEmpty) displayLine = `${displayLine}\u201D`
            }
            return <span key={i} style={{ fontFamily: fonts.body, fontSize: '12px', fontWeight: 300, lineHeight: 1.8, color: ct, letterSpacing: '0.3px' }}>{displayLine}<br /></span>
          })
        })()}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="scene-card-inner"
      style={{ padding: '0' }}
    >
      {/* Scene card - HTML style: left border, no card background */}
      <div className="scene-card-body" style={{
        padding: '20px',
        borderLeft: `3px solid ${tc.accent}26`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Header: SCENE 01 / TAKE 1 */}
        <div className="scene-header flex items-baseline gap-2.5" style={{ marginBottom: '12px' }}>
          <span className="scene-num" style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 500, letterSpacing: '4px', color: tc.accent }}>
            SCENE {String(idx + 1).padStart(2, '0')}
          </span>
          <span className="scene-take" style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '2px', color: cg }}>
            TAKE 1
          </span>
        </div>

        {/* Question - italic like HTML */}
        <div className="scene-question" style={{ fontFamily: fonts.displayKr, fontSize: '15px', fontWeight: 500, fontStyle: 'italic', color: ct, marginBottom: '12px', lineHeight: 1.6, letterSpacing: '0.5px' }}>
          {item.question}
        </div>

        {/* Dialogue - HTML style: speaker — + dialogue */}
        <div className="scene-dialogue">
          {hasNewFields ? (
            displayOrder.map((type, i) => {
              if (type === 'narration') {
                const text = (item.narration || '').trim()
                if (!text) return null
                return (
                  <div key={`${type}-${i}`} style={{ marginBottom: '8px' }}>
                    {text.split('\n').map((line: string, li: number) =>
                      line.trim().length === 0
                        ? <div key={li} style={{ height: '8px' }} />
                        : <p key={li} style={{ fontFamily: fonts.body, fontSize: '12px', fontWeight: 300, lineHeight: 1.8, color: cg, letterSpacing: '0.3px' }}>{line}</p>
                    )}
                  </div>
                )
              }
              if (type === 'groom') return renderDialogueBlock(groomLabel, item.groomDialogue, `${type}-${i}`)
              if (type === 'bride') return renderDialogueBlock(brideLabel, item.brideDialogue, `${type}-${i}`)
              return null
            })
          ) : (
            <>
              {linesParsed.filter((line: string) => !(line.startsWith('"') || line.startsWith('\u201C') || line.startsWith("'"))).length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  {linesParsed.filter((line: string) => !(line.startsWith('"') || line.startsWith('\u201C') || line.startsWith("'"))).map((line: string, i: number) => (
                    <p key={`action-${i}`} style={{ fontFamily: fonts.body, fontSize: '12px', fontWeight: 300, lineHeight: 1.8, color: cg, letterSpacing: '0.3px' }}>{line}</p>
                  ))}
                </div>
              )}
              {linesParsed.filter((line: string) => line.startsWith('"') || line.startsWith('\u201C') || line.startsWith("'")).map((line: string, i: number) => (
                renderDialogueBlock(i % 2 === 0 ? groomName : brideName, line, `dialogue-${i}`)
              ))}
            </>
          )}
        </div>

        {/* Photos at bottom - varying aspect ratios, delayed animation */}
        {images.length > 0 && (
          <div className={`scene-photos photos-${Math.min(images.length, 3)}`}>
            {images.slice(0, maxPhotos).map((img: string, imgIdx: number) => {
              const imgSettings = item.imageSettings?.[imgIdx] || {}
              return (
                <div key={imgIdx} className="scene-photo-wrap">
                  <CroppedImageDiv src={img} crop={imgSettings} className="scene-photo w-full h-full" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FilmScenes({ invitation, fonts, tc, bgOverride, sceneStep = 0 }: { invitation: any; fonts: FontConfig; tc: ColorConfig; bgOverride?: string; sceneStep?: number }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const interviews = invitation.content?.interviews || []
  const groomName = invitation.groom?.name || ''
  const brideName = invitation.bride?.name || ''

  if (interviews.length === 0) return null

  return (
    <div style={{ backgroundColor: bgOverride || tc.sectionBg, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Section label - 상단 고정 */}
      <div className="text-center pt-10 pb-4 px-6" style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '6px', color: tc.gray, textTransform: 'uppercase' as const, marginBottom: '6px' }}>
          OUR STORY
        </div>
        <h2 style={{ fontFamily: fonts.display, fontSize: dfs(26), fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: tc.accent }}>
          Scenes
        </h2>
      </div>

      {/* Scene cards - 나머지 공간에서 세로 중앙 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="scene-stack">
          {interviews.map((item: any, idx: number) => {
            const num = idx + 1
            const cls = sceneStep >= num + 1 ? 'scene-timed scene-collapsed'
                      : sceneStep === num ? 'scene-timed scene-show'
                      : 'scene-timed'
            return (
              <div key={idx} className={cls}>
                <FilmSceneCard item={item} idx={idx} total={interviews.length} groomName={groomName} brideName={brideName} fonts={fonts} tc={tc} />
              </div>
            )
          })}
        </div>

        {/* Scene progress */}
        <div style={{ textAlign: 'center', padding: '12px', color: tc.gray, fontSize: '10px', letterSpacing: '3px' }}>
          <span style={{ color: tc.accent }}>{Math.min(sceneStep, interviews.length)}</span> / {interviews.length}
        </div>
      </div>
    </div>
  )
}

// ===== Chapter 3: Filmstrip Gallery =====
function ChapterThree({ invitation, fonts, tc, onOpenLightbox, bgOverride }: {
  invitation: any; fonts: FontConfig; tc: ColorConfig; onOpenLightbox: (idx: number) => void; bgOverride?: string
}) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const { ref, isVisible } = useScrollReveal()
  const images = (invitation.gallery?.images || []).map(extractImageUrl).filter(Boolean)
  const [showAllGrid, setShowAllGrid] = useState(false)
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
    <div ref={ref} style={{ backgroundColor: bgOverride || tc.background }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}>
        {/* Chapter label */}
        <div className="text-center mb-8 px-6">
          <div style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '6px', color: tc.gray, textTransform: 'uppercase' as const, marginBottom: '6px' }}>
            GALLERY
          </div>
          <h2 style={{ fontFamily: fonts.display, fontSize: dfs(26), fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: tc.accent }}>
            Movie Stills
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
                <CroppedImageDiv src={img} crop={imgSettings} className="w-full h-full" />
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
          <span style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '3px', color: tc.divider }}>
            Swipe &rarr;
          </span>
        </div>

        {/* Gallery grid - with show more for 6+ photos */}
        {images.length > 0 && (() => {
          const hasMoreGrid = images.length > 6 && !showAllGrid
          const visibleGridImages = hasMoreGrid ? images.slice(0, 6) : images
          return (
            <div className="px-5 mt-8">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                {visibleGridImages.map((img: string, i: number) => {
                  const imgSettings = (invitation.gallery as any)?.imageSettings?.[i] || {}
                  return (
                    <div key={i} className="relative overflow-hidden" style={{ aspectRatio: '3/4', cursor: 'pointer' }}
                      onClick={() => onOpenLightbox(i)}>
                      <CroppedImageDiv src={img} crop={imgSettings} className="w-full h-full" />
                      {hasMoreGrid && i === 5 && (
                        <div
                          className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setShowAllGrid(true) }}
                        >
                          <span className="text-white text-lg font-light">+{images.length - 6}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {hasMoreGrid && (
                <button
                  onClick={() => setShowAllGrid(true)}
                  className="w-full mt-3 py-3 text-center transition-colors hover:opacity-80"
                  style={{ border: `1px solid ${tc.divider}`, background: tc.background }}
                >
                  <span style={{ fontFamily: fonts.display, fontSize: dfs(13), color: tc.text }}>
                    +{images.length - 6}장 더 보기
                  </span>
                </button>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ===== YouTube Video Section =====
function FilmVideoSection({ invitation, fonts, tc, bgOverride }: { invitation: any; fonts: FontConfig; tc: ColorConfig; bgOverride?: string }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const youtube = invitation.youtube
  if (!youtube?.enabled || !youtube?.url) return null

  const match = youtube.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
  const videoId = match?.[1]
  if (!videoId) return null

  return (
    <div className="py-8 px-5" style={{ backgroundColor: bgOverride || tc.background }}>
      {youtube.title && (
        <p className="text-center mb-3" style={{ fontFamily: fonts.display, fontSize: dfs(10), letterSpacing: '3px', color: tc.gray }}>{youtube.title}</p>
      )}
      <div style={{ aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden', background: '#000' }}>
        <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    </div>
  )
}

// ===== The Premiere (Wedding Details - Ticket Design) =====
function ThePremiere({ invitation, fonts, tc, bgOverride }: { invitation: any; fonts: FontConfig; tc: ColorConfig; bgOverride?: string }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const ct = tc.cardText || tc.text
  const cg = tc.cardGray || tc.gray
  const { ref, isVisible } = useScrollReveal()
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const w = invitation.wedding || {}
  const date = w.date ? new Date(w.date) : null
  const dayNamesKr = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const groom = invitation.groom || {}
  const bride = invitation.bride || {}
  const groomName = groom.name || ''
  const brideName = bride.name || ''

  return (
    <div ref={ref} className="px-5 py-4" style={{ backgroundColor: bgOverride || tc.sectionBg }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Chapter Title */}
        <div className="text-center" style={{ marginBottom: '24px' }}>
          <div className="flex items-center justify-center gap-3" style={{ marginBottom: '12px' }}>
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
            <span style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '6px', color: tc.gray, textTransform: 'uppercase' as const }}>THE PREMIERE</span>
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: dfs(26), fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: tc.accent }}>Wedding Day</div>
        </div>

        {/* ===== TICKET CARD ===== */}
        <div className="premiere-ticket" style={{ background: tc.cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', position: 'relative', alignSelf: 'stretch' }}>

          {/* ADMIT TWO stamp overlay */}
          <div className={`premiere-stamp ${isVisible ? 'stamp-visible' : ''}`} style={{ color: tc.accent, borderColor: tc.accent }}>
            <span style={{ fontFamily: fonts.display, fontSize: dfs(7), letterSpacing: '2px', color: tc.accent, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>Admit<br />Two</span>
          </div>

          {/* Ticket Top - Title Area */}
          <div style={{ padding: '28px 24px 20px', borderBottom: `1px dashed ${tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider}`, position: 'relative' }}>
            {/* Notches */}
            <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: bgOverride || tc.sectionBg, top: '100%', left: '-10px', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: bgOverride || tc.sectionBg, top: '100%', right: '-10px', transform: 'translateY(-50%)' }} />

            <div className="flex items-center justify-between mb-4">
              <span style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '4px', color: tc.accent }}>Admit Two</span>
              <span style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '2px', color: cg }}>Premiere</span>
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
                <p style={{ fontFamily: fonts.displayKr, fontSize: '22px', fontWeight: 300, letterSpacing: '3px', color: ct, marginTop: '6px' }}>{groomName}</p>
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
                <p style={{ fontFamily: fonts.displayKr, fontSize: '22px', fontWeight: 300, letterSpacing: '3px', color: ct, marginTop: '6px' }}>{brideName}</p>
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
                    const label = diff > 0 ? `결혼식까지 ${diff}일 남았어요.` : diff === 0 ? '오늘 결혼합니다' : `결혼한 지 ${Math.abs(diff)}일`
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
              <div style={{ fontFamily: fonts.display, fontSize: dfs(7), letterSpacing: '4px', color: tc.accent, marginBottom: '8px' }}>Theater</div>
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
                    <span style={{ fontFamily: fonts.display, fontSize: dfs(7), letterSpacing: '1px', color: cg }}>{m.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Directions - trigger button */}
        {w.directions && (w.directions.car || w.directions.publicTransport || w.directions.train || w.directions.expressBus || (w.directions.extraInfoEnabled && w.directions.extraInfoText)) && (
          <button
            onClick={() => setDirectionsOpen(true)}
            className="mt-6 flex items-center justify-center gap-2 w-full py-3"
            style={{ background: tc.accent, border: 'none', borderRadius: '10px', cursor: 'pointer' }}
          >
            <span style={{ fontFamily: fonts.body, fontSize: '12px', letterSpacing: '2px', color: '#FFFFFF', fontWeight: 500 }}>오시는 길</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        )}

        {/* Directions Bottom Sheet */}
        {directionsOpen && (
          <div className="directions-overlay open" onClick={() => setDirectionsOpen(false)}>
            <div className="directions-sheet" onClick={(e) => e.stopPropagation()} style={{ background: bgOverride || tc.sectionBg }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
                <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: tc.divider }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px 16px' }}>
                <span style={{ fontFamily: fonts.body, fontSize: '13px', letterSpacing: '1px', color: tc.accent, fontWeight: 500 }}>오시는 길</span>
                <button onClick={() => setDirectionsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: cg, cursor: 'pointer', padding: '4px' }}>&times;</button>
              </div>
              <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {w.directions.car && (
                  <div className="direction-card revealed" style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>By Car</div>
                    <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg, whiteSpace: 'pre-line' }}>{w.directions.car}</p>
                  </div>
                )}
                {w.directions.publicTransport && (
                  <div className="direction-card revealed" style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>Public Transit</div>
                    <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg, whiteSpace: 'pre-line' }}>{w.directions.publicTransport}</p>
                  </div>
                )}
                {w.directions.train && (
                  <div className="direction-card revealed" style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>Train</div>
                    <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg, whiteSpace: 'pre-line' }}>{typeof w.directions.train === 'string' ? w.directions.train : ''}</p>
                  </div>
                )}
                {w.directions.expressBus && (
                  <div className="direction-card revealed" style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>Express Bus</div>
                    <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg, whiteSpace: 'pre-line' }}>{typeof w.directions.expressBus === 'string' ? w.directions.expressBus : ''}</p>
                  </div>
                )}
                {w.directions.extraInfoEnabled && w.directions.extraInfoText && (
                  <div className="direction-card revealed" style={{ padding: '14px 16px', background: tc.cardBg, borderRadius: '10px', borderLeft: `3px solid ${tc.accent}50` }}>
                    <div style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '3px', color: tc.accent, marginBottom: '6px' }}>{(w.directions.extraInfoTitle || 'Info').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</div>
                    <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: cg, whiteSpace: 'pre-line' }}>{w.directions.extraInfoText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Kakao Map Section =====
function MapSection({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
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
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => { window.kakao.maps.load(initMap) }
    document.head.appendChild(script)
  }, [address, venueName, isVisible])

  if (!address) return null

  return (
    <div ref={ref} className="px-5" style={{ backgroundColor: tc.background }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
            <span style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '5px', color: tc.gray }}>Location</span>
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
              fontFamily: fonts.display, fontSize: dfs(9), letterSpacing: '2px', color: tc.accent,
              background: 'none', border: `1px solid ${tc.accent}40`, padding: '6px 16px', cursor: 'pointer', borderRadius: '4px',
            }}>
            주소 복사
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== Guidance Section (with integrated Gift accordion) =====
function GuidanceSection({ invitation, fonts, tc, bgOverride }: { invitation: any; fonts: FontConfig; tc: ColorConfig; bgOverride?: string }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const { ref, isVisible } = useScrollReveal()
  const info = invitation.content?.info
  const defaultItemOrder = ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']
  const enabledItems = info ? [
    ...(info.itemOrder || defaultItemOrder).filter((key: string) => info[key]?.enabled && info[key]?.content),
    ...(info.customItems || []).filter((item: any) => item.enabled && item.content).map((_: any, i: number) => `custom-${i}`),
  ] : []

  if (invitation.sectionVisibility?.guidance === false) return null
  if (enabledItems.length === 0 && !invitation.guidance?.enabled) return null

  const isDark = !!tc.cardText
  const cardBorder = isDark ? tc.divider : getAccentTint(tc.accent, 0.70)

  return (
    <div ref={ref} style={{ backgroundColor: bgOverride || tc.background }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
        {/* Chapter title with animation */}
        <div className="text-center mb-8 px-6">
          <div className="flex items-center justify-center gap-3" style={{ marginBottom: '12px' }}>
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
            <span style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '6px', color: tc.gray, textTransform: 'uppercase' as const }}>NOTICE</span>
            <div style={{ height: '1px', width: '20px', background: tc.divider }} />
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: dfs(26), fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: tc.accent }}>Information</div>
        </div>

        {invitation.guidance?.image && (
          <div className="px-6 mb-8">
            <div className="w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <CroppedImageDiv src={invitation.guidance.image} crop={(invitation.guidance as any).imageSettings || {}} className="w-full h-full" />
            </div>
          </div>
        )}

        {/* Info cards with slide-in animation */}
        {enabledItems.length > 0 && (
          <div className="px-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {enabledItems.map((key: string, i: number) => {
              const isCustom = key.startsWith('custom-')
              const item = isCustom ? info.customItems[parseInt(key.split('-')[1])] : info[key]
              if (!item?.enabled || !item?.content) return null
              return (
                <div key={i}
                  className={`info-card-anim ${isVisible ? 'info-visible' : ''}`}
                  style={{
                    padding: '20px',
                    background: isDark ? '#1A1A1A' : tc.cardBg,
                    border: `0.5px solid ${cardBorder}`,
                    borderLeft: `3px solid ${tc.accent}40`,
                    position: 'relative', overflow: 'hidden',
                    animationDelay: isVisible ? `${0.8 + i * 0.2}s` : undefined,
                  }}
                >
                  <div style={{ fontFamily: fonts.body, fontSize: '10px', fontWeight: 500, letterSpacing: '3px', color: tc.accent, marginBottom: '10px', textTransform: 'uppercase' as const }}>
                    {item.title?.toUpperCase()}
                  </div>
                  <p style={{ fontFamily: fonts.body, fontSize: '12px', fontWeight: 300, lineHeight: 1.8, color: isDark ? tc.text : (tc.cardGray || tc.gray), whiteSpace: 'pre-line', letterSpacing: '0.3px' }}>{item.content}</p>
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
function CreditsSection({ invitation, fonts, tc, bgOverride }: { invitation: any; fonts: FontConfig; tc: ColorConfig; bgOverride?: string }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const { ref, isVisible } = useScrollReveal()
  const thankYou = invitation.content?.thankYou
  if (!thankYou) return null

  // Star positions (10 stars with varied sizes, positions, timing)
  const stars = [
    { top: '8%', left: '12%', dur: '2.5s', delay: '0s', brightness: 0.5 },
    { top: '15%', left: '78%', dur: '3.2s', delay: '0.8s', brightness: 0.7 },
    { top: '25%', left: '45%', dur: '2.8s', delay: '1.5s', brightness: 0.4 },
    { top: '35%', left: '88%', dur: '3.5s', delay: '0.3s', brightness: 0.6 },
    { top: '50%', left: '6%', dur: '2.2s', delay: '1.2s', brightness: 0.5 },
    { top: '60%', left: '92%', dur: '3.0s', delay: '0.6s', brightness: 0.8 },
    { top: '70%', left: '22%', dur: '2.7s', delay: '1.8s', brightness: 0.4 },
    { top: '78%', left: '65%', dur: '3.3s', delay: '0.2s', brightness: 0.6 },
    { top: '88%', left: '35%', dur: '2.4s', delay: '1.0s', brightness: 0.5 },
    { top: '92%', left: '82%', dur: '3.1s', delay: '1.4s', brightness: 0.7 },
  ]

  return (
    <div ref={ref} className="overflow-hidden" style={{ backgroundColor: bgOverride || tc.sectionBg, position: 'relative' }}>
      {/* Twinkling stars */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {stars.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', top: s.top, left: s.left,
            width: '2px', height: '2px', background: '#fff', borderRadius: '50%',
            opacity: 0,
            animation: isVisible ? `twinkle ${s.dur} ease-in-out ${s.delay} infinite` : 'none',
            ['--brightness' as string]: s.brightness,
          } as React.CSSProperties} />
        ))}
      </div>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0 }}>
        {/* Credits viewport */}
        <div className="credits-viewport">
          <div className={`credits-roll ${isVisible ? 'credits-animate' : ''}`}>
            {/* Title - section-sub-title style (accent italic) */}
            <div className="text-center mb-12">
              <div style={{ fontFamily: fonts.display, fontSize: dfs(26), fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: tc.accent }}>
                {(thankYou.title || 'Special Thanks').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
              </div>
            </div>

            {/* Credits content - bright white text */}
            <div className="text-center space-y-1">
              {thankYou.message?.split('\n').map((line: string, i: number) => {
                const isRole = /^[A-Z\s]+$/.test(line.trim()) && line.trim().length > 0
                const isEmpty = line.trim().length === 0
                if (isEmpty) return <div key={i} style={{ height: '20px' }} />
                return (
                  <p key={i} style={{
                    fontFamily: isRole ? fonts.display : fonts.body,
                    fontSize: isRole ? '9px' : '14px',
                    fontStyle: isRole ? undefined : 'italic',
                    letterSpacing: isRole ? '6px' : '1px',
                    lineHeight: isRole ? 3.5 : 2,
                    color: isRole ? tc.accent : tc.text,
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
function GiftSection({ invitation, fonts, tc, bgOverride }: { invitation: any; fonts: FontConfig; tc: ColorConfig; bgOverride?: string }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
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
          style={{ fontFamily: fonts.display, fontSize: dfs(9), letterSpacing: '1px', color: tc.accent, background: 'none', border: `1px solid ${tc.accent}50`, padding: '4px 12px', cursor: 'pointer' }}>
          Copy
        </button>
      </div>
    ))
  }

  return (
    <div className="px-6 py-12" style={{ backgroundColor: bgOverride || tc.sectionBg }}>
      <div className="text-center mb-8">
        <h3 style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: tc.text, fontWeight: 400 }}>마음 전하실 곳</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(['groom', 'bride'] as const).map(side => (
          <button key={side} onClick={() => setExpandedSide(expandedSide === side ? null : side)}
            style={{
              fontFamily: fonts.displayKr, fontSize: '10px', letterSpacing: '2px', padding: '11px',
              border: `1px solid ${expandedSide === side ? tc.accent : tc.divider}`,
              background: expandedSide === side ? tc.accent : tc.cardBg,
              color: expandedSide === side ? '#FFFFFF' : (tc.cardText || tc.text), cursor: 'pointer', transition: 'all 0.3s',
            }}>
            {side === 'groom' ? '신랑측' : '신부측'}
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
function AudienceReviews({ invitation, invitationId, fonts, tc, isSample, bgOverride }: {
  invitation: any; invitationId: string; fonts: FontConfig; tc: ColorConfig; isSample?: boolean; bgOverride?: string
}) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const [messages, setMessages] = useState<any[]>(isSample ? sampleGuestbookMessages : [])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAllMessages, setShowAllMessages] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [carouselExit, setCarouselExit] = useState(-1)
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const carouselIdxRef = useRef(0)
  const questions: string[] = invitation.content?.guestbookQuestions || []
  const currentQ = questions[qIdx] || '두 사람에게 하고 싶은 말을 남겨주세요'
  const useCarousel = messages.length >= 3

  useEffect(() => {
    if (isSample) return
    fetch(`/api/guestbook?invitationId=${invitationId}`).then(r => r.json()).then((d: any) => setMessages(d.messages || d.data || [])).catch(() => {})
  }, [invitationId, isSample])

  // Keep ref in sync with state
  useEffect(() => { carouselIdxRef.current = carouselIdx }, [carouselIdx])

  // Auto-advance carousel
  useEffect(() => {
    if (!useCarousel) return
    carouselTimer.current = setInterval(() => {
      const currentIdx = carouselIdxRef.current
      setCarouselExit(currentIdx)
      setCarouselIdx((currentIdx + 1) % messages.length)
      setTimeout(() => setCarouselExit(-1), 600)
    }, 3500)
    return () => { if (carouselTimer.current) clearInterval(carouselTimer.current) }
  }, [useCarousel, messages.length])

  const goToSlide = useCallback((idx: number) => {
    if (idx === carouselIdxRef.current) return
    if (carouselTimer.current) clearInterval(carouselTimer.current)
    setCarouselExit(carouselIdxRef.current)
    setCarouselIdx(idx)
    setTimeout(() => setCarouselExit(-1), 600)
    carouselTimer.current = setInterval(() => {
      const currentIdx = carouselIdxRef.current
      setCarouselExit(currentIdx)
      setCarouselIdx((currentIdx + 1) % messages.length)
      setTimeout(() => setCarouselExit(-1), 600)
    }, 3500)
  }, [messages.length])

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
  const isDark = !!tc.cardText
  const inputStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `1px solid ${cdiv}`, background: tc.cardBg, outline: 'none', color: tc.cardText || tc.text, width: '100%' }

  const renderReviewCard = (msg: any, isActive: boolean, isExit: boolean) => (
    <div
      className={`review-card-anim ${isActive ? 'review-active' : ''} ${isExit ? 'review-exit' : ''}`}
      style={{ padding: '16px 18px', border: `0.5px solid ${tc.divider}`, background: isDark ? '#1A1A1A' : tc.cardBg }}
    >
      {/* Star rating with bounce animation */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star}
            className={`review-star-anim ${isActive ? 'star-active' : ''}`}
            style={{
              fontSize: '11px',
              color: isActive ? tc.accent : '#333',
              animationDelay: isActive ? `${star * 0.1}s` : undefined,
            }}>&#9733;</span>
        ))}
      </div>
      {msg.question && <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.gray, marginBottom: '6px', opacity: 0.7 }}>Q. {msg.question}</p>}
      <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: isDark ? tc.text : (tc.cardText || tc.text), marginBottom: '8px', whiteSpace: 'pre-line' }}>{msg.message}</p>
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: fonts.body, fontSize: '11px', fontWeight: 500, color: tc.gray }}>&mdash; {msg.guest_name}</span>
        <span style={{ fontFamily: fonts.display, fontSize: dfs(10), color: tc.gray, opacity: 0.5 }}>{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}</span>
      </div>
    </div>
  )

  return (
    <div ref={ref} className="px-6" style={{ backgroundColor: bgOverride || tc.background }}>
      <div className="transition-all duration-1000" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
      {/* Chapter label area - MESSAGES / REVIEWS */}
      <div className="text-center" style={{ marginBottom: '32px' }}>
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: '8px' }}>
          <span style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '6px', color: tc.gray, textTransform: 'uppercase' as const }}>MESSAGES</span>
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: dfs(26), fontWeight: 400, fontStyle: 'italic', letterSpacing: '2px', color: tc.accent }}>Reviews</div>
      </div>
      <div className="text-center mb-6">
        <p className={`gb-question-highlight ${isVisible ? 'highlight-visible' : ''}`}
          style={{ fontFamily: fonts.displayKr, fontSize: '14px', fontWeight: 400, lineHeight: 1.7, color: tc.text }}>{currentQ}</p>
        {questions.length > 1 && (
          <button onClick={() => setQIdx((qIdx + 1) % questions.length)}
            style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.gray, background: 'none', border: 'none', cursor: 'pointer', marginTop: '12px', display: 'block', width: '100%' }}>
            다른 질문 보기 &rarr;
          </button>
        )}
      </div>
      <div className="mb-8 space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" maxLength={20} style={inputStyle} />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="메시지를 남겨주세요 (100자 이내)" rows={3} maxLength={100}
          style={{ ...inputStyle, resize: 'none' as const }} />
        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', fontFamily: fonts.displayKr, fontSize: '10px', letterSpacing: '3px', padding: '12px', background: tc.accent, color: '#FFFFFF', border: 'none', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
          Submit
        </button>
      </div>
      {messages.length === 0 ? (
        <p className="text-center" style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.gray, padding: '16px 0' }}>첫 번째로 메시지를 남겨보세요!</p>
      ) : useCarousel ? (
        /* ===== Carousel mode (3+ messages) ===== */
        <div>
          <div className="review-carousel">
            {messages.map((msg: any, i: number) => (
              <Fragment key={msg.id || i}>
                {renderReviewCard(msg, i === carouselIdx, i === carouselExit)}
              </Fragment>
            ))}
          </div>
          {/* Dot navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
            {messages.map((_: any, i: number) => (
              <button key={i} onClick={() => goToSlide(i)}
                style={{
                  width: i === carouselIdx ? '16px' : '4px', height: '4px',
                  borderRadius: i === carouselIdx ? '2px' : '50%',
                  background: i === carouselIdx ? tc.accent : tc.gray,
                  opacity: i === carouselIdx ? 1 : 0.3,
                  transition: 'all 0.3s ease', border: 'none', padding: 0, cursor: 'pointer',
                }}
              />
            ))}
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '2px', background: tc.divider, marginTop: '16px', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: tc.accent, width: `${((carouselIdx + 1) / messages.length) * 100}%`, transition: 'width 0.3s ease', borderRadius: '1px' }} />
          </div>
          {/* Counter + Nav arrows */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
            <button onClick={() => goToSlide((carouselIdx - 1 + messages.length) % messages.length)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: tc.gray, fontSize: '14px', opacity: 0.6 }}
              aria-label="Previous review">&lsaquo;</button>
            <div style={{ fontFamily: fonts.body, fontSize: '10px', fontWeight: 300, letterSpacing: '3px', color: tc.gray, opacity: 0.5 }}>
              <span style={{ color: tc.accent, fontSize: '12px', opacity: 1 }}>{carouselIdx + 1}</span> / {messages.length}
            </div>
            <button onClick={() => goToSlide((carouselIdx + 1) % messages.length)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: tc.gray, fontSize: '14px', opacity: 0.6 }}
              aria-label="Next review">&rsaquo;</button>
          </div>
        </div>
      ) : (
        /* ===== List mode (<3 messages) ===== */
        <div className="space-y-3">
          {(showAllMessages ? messages : messages.slice(0, 5)).map((msg: any, i: number) => (
            <div key={msg.id || i} style={{ padding: '14px', border: `1px solid ${cdiv}`, background: tc.cardBg }}>
              {msg.question && <p style={{ fontFamily: fonts.body, fontSize: '10px', color: tc.cardGray || tc.gray, marginBottom: '6px', opacity: 0.6 }}>Q. {msg.question}</p>}
              <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: tc.cardText || tc.text, marginBottom: '8px', whiteSpace: 'pre-line' }}>{msg.message}</p>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.cardGray || tc.gray }}>&mdash; {msg.guest_name}</span>
                <span style={{ fontFamily: fonts.display, fontSize: dfs(9), color: tc.cardGray || tc.gray, opacity: 0.4 }}>{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          ))}
          {!showAllMessages && messages.length > 5 && (
            <button
              onClick={() => setShowAllMessages(true)}
              className="w-full py-3 text-center"
              style={{ fontFamily: fonts.display, fontSize: dfs(10), letterSpacing: '3px', color: tc.accent, border: `1px solid ${cdiv}`, background: 'transparent', cursor: 'pointer' }}>
              +{messages.length - 5} More Reviews
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

// ===== Ticket-style RSVP =====
function TicketRsvp({ invitation, invitationId, fonts, tc, bgOverride }: {
  invitation: any; invitationId: string; fonts: FontConfig; tc: ColorConfig; bgOverride?: string
}) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const { ref, isVisible } = useScrollReveal()
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState<'yes' | 'no' | 'maybe'>('yes')
  const [guestCount, setGuestCount] = useState(1)
  const [rsvpMessage, setRsvpMessage] = useState('')
  const [side, setSide] = useState<'groom' | 'bride' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [giftExpanded, setGiftExpanded] = useState<'groom' | 'bride' | null>(null)

  // Gift accounts
  const groom = invitation.groom || {}
  const bride = invitation.bride || {}
  const hasAccounts = [groom.bank?.enabled, (groom.father as any)?.bank?.enabled, (groom.mother as any)?.bank?.enabled,
    bride.bank?.enabled, (bride.father as any)?.bank?.enabled, (bride.mother as any)?.bank?.enabled].some(Boolean)

  if (!invitation.rsvpEnabled && !hasAccounts) return null

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const attendanceMap: Record<string, string> = { yes: 'attending', no: 'not_attending', maybe: 'pending' }
      const res = await fetch('/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, guestName: name, attendance: attendanceMap[attendance] || attendance, guestCount: attendance === 'yes' ? guestCount : 0, message: rsvpMessage, side: side || undefined }) })
      if (res.ok) setSubmitted(true)
    } catch {} setSubmitting(false)
  }

  const cdiv = tc.cardText ? getAccentTint(tc.accent, 0.70) : tc.divider
  const inputStyle: React.CSSProperties = { fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `1px solid ${cdiv}`, background: tc.cardBg, outline: 'none', color: tc.cardText || tc.text, width: '100%' }

  if (submitted) {
    return (
      <div className="px-6 py-16 text-center" style={{ backgroundColor: bgOverride || tc.sectionBg }}>
        <div style={{ fontFamily: fonts.display, fontSize: dfs(13), letterSpacing: '6px', color: tc.text, marginBottom: '8px' }}>Confirmed</div>
        <p style={{ fontFamily: fonts.body, fontSize: '13px', color: tc.gray }}>참석 여부가 전달되었습니다.</p>
      </div>
    )
  }

  const renderAccounts = (accSide: 'groom' | 'bride') => {
    const person = accSide === 'groom' ? groom : bride
    const accounts = [
      person.bank?.enabled && { name: person.name, ...person.bank, role: accSide === 'groom' ? '신랑' : '신부' },
      (person.father as any)?.bank?.enabled && { name: person.father.name, ...(person.father as any).bank, role: '아버지' },
      (person.mother as any)?.bank?.enabled && { name: person.mother.name, ...(person.mother as any).bank, role: '어머니' },
    ].filter(Boolean)
    return accounts.map((acc: any, i: number) => (
      <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${tc.divider}` }}>
        <div>
          <span style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.cardGray || tc.gray }}>{acc.role}</span>
          <span style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.cardText || tc.text, marginLeft: '8px' }}>{acc.bank} {acc.account}</span>
          {(acc.holder || acc.name) && <span style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.cardGray || tc.gray, marginLeft: '6px' }}>{acc.holder || acc.name}</span>}
        </div>
        <button onClick={() => { navigator.clipboard.writeText(acc.account); alert('계좌번호가 복사되었습니다.') }}
          style={{ fontFamily: fonts.display, fontSize: dfs(9), letterSpacing: '1px', color: tc.accent, background: 'none', border: `1px solid ${tc.accent}50`, padding: '4px 12px', cursor: 'pointer' }}>
          Copy
        </button>
      </div>
    ))
  }

  const w = invitation.wedding || {}
  const date = w.date ? new Date(w.date) : null
  const revealedClass = isVisible ? 'rsvp-section-revealed' : ''

  return (
    <div ref={ref} className={`px-6 ${revealedClass}`} style={{ backgroundColor: bgOverride || tc.sectionBg, position: 'relative', overflow: 'hidden' }}>
      {/* RSVP section */}
      {invitation.rsvpEnabled && <>
      {/* Phase 1: "NOW SHOWING" / "YOUR RESERVATION" intro text */}
      <div className="rsvp-intro">
        <div style={{ fontFamily: fonts.display, fontSize: dfs(11), fontWeight: 400, letterSpacing: '10px', color: tc.accent, }}>
          Now Showing
        </div>
        <div className="rsvp-intro-line" style={{ background: tc.accent, margin: '12px auto', height: '0.5px' }} />
        <div style={{ fontFamily: fonts.body, fontSize: '9px', fontWeight: 300, letterSpacing: '4px', color: tc.gray }}>
          YOUR RESERVATION
        </div>
      </div>

      {/* Phase 2: Spotlight widens */}
      <div className="rsvp-spotlight" style={{ background: `radial-gradient(ellipse at 50% 0%, ${tc.accent}1F 0%, transparent 70%)` }} />

      {/* Phase 3: Ticket 3D flip entrance */}
      <div className="rsvp-reveal">
        {/* Ticket card */}
        <div className="rsvp-ticket-flash" style={{ background: tc.cardBg, border: `1px solid ${cdiv}`, position: 'relative', overflow: 'hidden' }}>
          {/* CONFIRMED stamp */}
          <div className="rsvp-stamp" style={{ color: tc.accent, borderColor: tc.accent }}>
            <span style={{ fontFamily: fonts.display, fontSize: dfs(6), letterSpacing: '1.5px', color: tc.accent, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>Confirmed</span>
          </div>

          {/* Ticket top - event info */}
          <div style={{ padding: '20px 20px 16px', borderBottom: `1px dashed ${cdiv}`, position: 'relative' }}>
            <div className="ticket-notch-left" style={{ background: bgOverride || tc.sectionBg }} />
            <div className="ticket-notch-right" style={{ background: bgOverride || tc.sectionBg }} />

            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '4px', color: tc.accent }}>Admit One</span>
              <span style={{ fontFamily: fonts.display, fontSize: dfs(8), letterSpacing: '2px', color: tc.cardGray || tc.gray }}>
                {date ? `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}` : ''}
              </span>
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: dfs(13), letterSpacing: '6px', color: tc.cardText || tc.text, marginBottom: '4px' }}>
              Reservation
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: '11px', color: tc.cardGray || tc.gray }}>
              {w.venue?.name || ''} {w.timeDisplay || w.time || ''}
            </div>
          </div>

          {/* Ticket bottom - form with staggered field animation */}
          <div className="rsvp-form-animated" style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="성함" style={inputStyle} />
            <div className="grid grid-cols-2 gap-2">
              {([{ value: 'groom' as const, label: '신랑측' }, { value: 'bride' as const, label: '신부측' }]).map(opt => (
                <button key={opt.value} onClick={() => setSide(side === opt.value ? null : opt.value)}
                  style={{
                    fontFamily: fonts.displayKr, fontSize: '10px', letterSpacing: '2px', padding: '11px',
                    border: `1px solid ${side === opt.value ? tc.accent : cdiv}`,
                    background: side === opt.value ? tc.accent : 'transparent',
                    color: side === opt.value ? '#FFFFFF' : (tc.cardText || tc.text), cursor: 'pointer', transition: 'all 0.3s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['yes', 'maybe', 'no'] as const).map(opt => (
                <button key={opt} onClick={() => setAttendance(opt)}
                  style={{
                    fontFamily: fonts.displayKr, fontSize: '10px', letterSpacing: '2px', padding: '11px',
                    border: `1px solid ${attendance === opt ? tc.accent : cdiv}`,
                    background: attendance === opt ? tc.accent : 'transparent',
                    color: attendance === opt ? '#FFFFFF' : (tc.cardText || tc.text), cursor: 'pointer', transition: 'all 0.3s',
                  }}>
                  {{ yes: '참석', maybe: '미정', no: '불참' }[opt]}
                </button>
              ))}
            </div>
            {attendance === 'yes' && invitation.rsvpAllowGuestCount && (
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: fonts.body, fontSize: '12px', color: tc.cardGray || tc.gray }}>참석 인원</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    style={{ width: '30px', height: '30px', border: `1px solid ${cdiv}`, background: 'transparent', cursor: 'pointer', fontSize: '14px', color: tc.cardText || tc.text }}>-</button>
                  <span style={{ fontFamily: fonts.display, fontSize: dfs(14), width: '28px', textAlign: 'center', color: tc.cardText || tc.text }}>{guestCount}</span>
                  <button onClick={() => setGuestCount(guestCount + 1)}
                    style={{ width: '30px', height: '30px', border: `1px solid ${cdiv}`, background: 'transparent', cursor: 'pointer', fontSize: '14px', color: tc.cardText || tc.text }}>+</button>
                </div>
              </div>
            )}
            <textarea value={rsvpMessage} onChange={e => setRsvpMessage(e.target.value)} placeholder="전하고 싶은 말 (선택)" rows={2}
              style={{ ...inputStyle, resize: 'none' as const }} />
            <button onClick={handleSubmit} disabled={submitting} className="rsvp-confirm-btn"
              style={{ width: '100%', fontFamily: fonts.displayKr, fontSize: '10px', letterSpacing: '3px', padding: '13px', background: tc.accent, color: '#FFFFFF', border: 'none', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
              Confirm
            </button>
          </div>
        </div>
      </div>
      </>}

      {/* Gift accounts */}
      {hasAccounts && invitation.sectionVisibility?.bankAccounts !== false && (
        <div className="mt-8 rsvp-gift-section">
          <div className="text-center mb-6">
            <h4 style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: tc.text, fontWeight: 400, letterSpacing: '2px' }}>마음 전하실 곳</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['groom', 'bride'] as const).map(giftSide => {
              const person = giftSide === 'groom' ? groom : bride
              const hasAcc = [person.bank?.enabled, (person.father as any)?.bank?.enabled, (person.mother as any)?.bank?.enabled].some(Boolean)
              if (!hasAcc) return null
              const isOpen = giftExpanded === giftSide
              return (
                <div key={giftSide} style={{ border: `1px solid ${tc.divider}`, overflow: 'hidden' }}>
                  <button
                    onClick={() => setGiftExpanded(isOpen ? null : giftSide)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', background: tc.cardBg, border: 'none', cursor: 'pointer',
                      transition: 'background 0.3s',
                    }}
                  >
                    <span style={{ fontFamily: fonts.displayKr, fontSize: '11px', letterSpacing: '3px', color: tc.cardText || tc.text }}>{giftSide === 'groom' ? '신랑측' : '신부측'}</span>
                    <span className={`gift-acc-chevron ${isOpen ? 'gift-chevron-open' : ''}`} style={{ fontSize: '14px', color: tc.accent }}>&#9660;</span>
                  </button>
                  <div className={`gift-acc-panel ${isOpen ? 'gift-open' : ''}`}>
                    <div style={{ padding: '12px 14px', background: tc.cardBg }}>
                      {renderAccounts(giftSide)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Movie Footer =====
function FilmFooter({ invitation, fonts, tc }: { invitation: any; fonts: FontConfig; tc: ColorConfig }) {
  const dfs = (px: number) => `${Math.round(px * (fonts.ds || 1))}px`
  const { ref, isVisible } = useScrollReveal()
  const vis = isVisible ? 'fin-visible' : ''
  return (
    <div ref={ref} className="text-center" style={{ backgroundColor: tc.background, position: 'relative', overflow: 'hidden', padding: '0 24px' }}>
      {/* Top subtle accent line */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40px', height: '2px', background: `${tc.accent}40` }} />
      {/* Spotlight cone */}
      <div className={`fin-spotlight ${vis}`} style={{ background: `radial-gradient(ellipse at 50% 0%, ${tc.accent}1F 0%, transparent 70%)` }} />
      {/* FIN. text with letter-spacing reveal */}
      <div className={`fin-text-anim ${vis}`} style={{ fontFamily: fonts.display, fontSize: dfs(52), fontWeight: 400, fontStyle: 'italic', letterSpacing: '16px', color: tc.text, position: 'relative', zIndex: 1 }}>
        Fin.
      </div>
      {/* Expanding accent line */}
      <div className={`fin-line-anim ${vis}`} style={{ background: tc.accent, margin: '24px auto', position: 'relative', zIndex: 1 }} />
      {/* Couple names fade up */}
      <div className={`fin-couple-anim ${vis}`} style={{ fontFamily: fonts.body, fontSize: '11px', fontWeight: 300, letterSpacing: '8px', color: tc.text, position: 'relative', zIndex: 1 }}>
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');

  .desktop-frame-wrapper {
    min-height: 100vh; display: flex; justify-content: center; align-items: flex-start; background: #F0EDE8;
  }
  .mobile-frame {
    width: 100%; max-width: 430px; height: 100vh; height: 100dvh; position: relative; overflow: hidden;
    background: #FFFFFF; box-shadow: 0 0 40px rgba(0,0,0,0.08);
  }
  .mobile-frame-screen { position: relative; width: 100%; height: 100vh; height: 100dvh; }
  .mobile-frame-content {
    width: 100%; height: 100vh; height: 100dvh;
    overflow-y: auto; overflow-x: hidden;
    scroll-snap-type: y mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .mobile-frame-content.no-snap {
    scroll-snap-type: none; height: auto; min-height: 100vh;
  }
  .snap-section {
    height: 100vh; height: 100dvh;
    scroll-snap-align: start;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    position: relative;
    padding: 80px 0;
    box-sizing: border-box;
    overflow: hidden;
  }
  .snap-section > * { width: 100%; }
  .snap-long {
    min-height: 100vh; height: auto;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    display: flex; flex-direction: column; justify-content: center;
    padding: 80px 0;
    box-sizing: border-box;
  }
  /* Scene stacking layout */
  .scene-stack {
    display: flex; flex-direction: column; gap: 0;
    padding: 0 16px; width: 100%;
  }
  /* Scene timed cards (matches HTML sample) */
  .scene-timed {
    opacity: 0; max-height: 0; overflow: hidden;
    transform: translateY(20px);
    transition: opacity 0.8s ease, transform 0.8s ease, max-height 0.8s ease, padding 0.8s ease, border-left-color 0.5s ease;
    padding: 0 16px; margin-bottom: 0;
    position: relative;
  }
  .scene-timed.scene-show {
    opacity: 1; max-height: 800px; transform: translateY(0);
    padding: 0 16px; margin-bottom: 8px;
    background: rgba(212,131,143,0.03); border-radius: 4px;
  }
  .scene-timed.scene-show .scene-card-body {
    border-left-color: rgba(212,131,143,0.4) !important;
  }
  /* Clap flash on scene appear */
  .scene-timed.scene-show::after {
    content: ''; position: absolute; inset: 0;
    background: rgba(255,255,255,0.08);
    animation: clapFlash 0.3s ease both;
    pointer-events: none;
  }
  @keyframes clapFlash {
    0% { opacity: 0.4; }
    100% { opacity: 0; }
  }
  /* Collapsed state */
  .scene-timed.scene-collapsed {
    opacity: 0.35; max-height: 52px; transform: translateY(0) scale(0.95);
    transform-origin: top center; padding: 0 16px; margin-bottom: 4px;
    background: transparent; border-radius: 0;
  }
  .scene-timed.scene-collapsed .scene-card-body {
    border-left-color: rgba(212,131,143,0.08) !important;
    padding: 8px 16px !important;
  }
  .scene-collapsed .scene-card-inner { pointer-events: none; }
  .scene-collapsed .scene-dialogue {
    opacity: 0; max-height: 0; overflow: hidden; margin: 0;
    transition: opacity 0.4s ease, max-height 0.4s ease;
  }
  .scene-collapsed .scene-question {
    font-size: 11px !important; margin-bottom: 0 !important;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .scene-collapsed .scene-header { margin-bottom: 4px !important; }
  .scene-collapsed .scene-photos { display: none; }
  /* Scene photos - delayed animation */
  .scene-photos {
    margin-top: 14px; display: flex; gap: 6px;
    opacity: 0; transform: translateY(10px);
    transition: opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s;
  }
  .scene-timed.scene-show .scene-photos {
    opacity: 1; transform: translateY(0);
  }
  .scene-photo-wrap {
    flex: 1; min-width: 0; overflow: hidden;
    border-radius: 3px;
  }
  .scene-photo { filter: saturate(0.7) contrast(1.05); transition: filter 0.4s ease; }
  .scene-photo-wrap:hover .scene-photo { filter: saturate(1) contrast(1.1); }
  .photos-1 .scene-photo-wrap { aspect-ratio: 16/9; border-radius: 4px; }
  .photos-2 .scene-photo-wrap { aspect-ratio: 3/4; }
  .photos-3 .scene-photo-wrap { aspect-ratio: 1/1; border-radius: 2px; }
  .directions-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); z-index: 200;
    display: flex; align-items: flex-end; justify-content: center;
    opacity: 0; transition: opacity 0.3s ease;
  }
  .directions-overlay.open { opacity: 1; }
  .directions-sheet {
    width: 100%; max-width: 430px;
    max-height: 70vh; overflow-y: auto;
    border-radius: 16px 16px 0 0;
    transform: translateY(100%);
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .directions-overlay.open .directions-sheet {
    transform: translateY(0);
  }
  .direction-card {
    opacity: 0; transform: translateY(12px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .direction-card.revealed {
    opacity: 1; transform: translateY(0);
  }
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
    animation: creditsScroll 12s linear infinite;
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

  /* ===== RSVP dramatic animations ===== */
  @keyframes rsvpIntroIn {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); filter: blur(6px); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); }
  }
  @keyframes rsvpIntroOut {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); filter: blur(4px); }
  }
  @keyframes rsvpSpotlight {
    0% { width: 0; opacity: 0; }
    100% { width: 350px; opacity: 1; }
  }
  @keyframes rsvpTicketFlip {
    0% { opacity: 0; transform: perspective(1200px) rotateX(90deg) translateY(80px); }
    30% { opacity: 1; }
    60% { transform: perspective(1200px) rotateX(-6deg) translateY(-10px); }
    80% { transform: perspective(1200px) rotateX(2deg) translateY(4px); }
    100% { opacity: 1; transform: perspective(1200px) rotateX(0) translateY(0); }
  }
  @keyframes ticketFlash {
    0% { opacity: 0.5; }
    100% { opacity: 0; }
  }
  @keyframes rsvpStampSlam {
    0% { transform: scale(4) rotate(-20deg); opacity: 0; }
    50% { transform: scale(0.85) rotate(-10deg); opacity: 1; }
    100% { transform: scale(1) rotate(-10deg); opacity: 0.5; }
  }
  @keyframes rsvpFieldIn {
    0% { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes confirmGlow {
    0% { box-shadow: 0 0 0 0 rgba(212,131,143,0); }
    100% { box-shadow: 0 0 24px 6px rgba(212,131,143,0.3); }
  }

  /* ===== Stars twinkle ===== */
  @keyframes twinkle {
    0%, 100% { opacity: 0; transform: scale(0.5); }
    50% { opacity: var(--brightness, 0.6); transform: scale(1); }
  }

  /* ===== Footer spotlight ===== */
  @keyframes spotlightWiden {
    0% { opacity: 0; width: 40px; }
    100% { opacity: 1; width: 260px; }
  }
  @keyframes finReveal {
    0% { opacity: 0; letter-spacing: 40px; filter: blur(8px); }
    60% { opacity: 1; filter: blur(0); }
    100% { opacity: 0.6; letter-spacing: 20px; filter: blur(0); }
  }
  @keyframes fadeUp {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 0.5; transform: translateY(0); }
  }
  @keyframes lineExpand {
    0% { width: 0; opacity: 0; }
    100% { width: 60px; opacity: 0.5; }
  }
  @keyframes lineExpand2 {
    0% { width: 0; opacity: 0; }
    100% { width: 80px; opacity: 0.6; }
  }

  /* ===== Info card slide ===== */
  @keyframes infoCardSlide {
    0% { opacity: 0; transform: translateX(-20px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes borderGlow {
    0% { opacity: 0; box-shadow: 0 0 0 rgba(212,131,143,0); }
    50% { opacity: 0.8; box-shadow: 0 0 8px rgba(212,131,143,0.4); }
    100% { opacity: 0; }
  }
  @keyframes infoTitleIn {
    0% { opacity: 0; letter-spacing: 12px; filter: blur(4px); }
    100% { opacity: 1; letter-spacing: 6px; filter: blur(0); }
  }
  @keyframes infoLineExpand {
    0% { width: 0; opacity: 0; }
    100% { width: 30px; opacity: 0.6; }
  }

  /* ===== Star rating fill ===== */
  @keyframes starFill {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.3); }
    100% { transform: scale(1); opacity: 1; }
  }

  /* ===== Question highlight draw ===== */
  @keyframes highlightDraw {
    from { background-size: 0% 40%; }
    to { background-size: 100% 40%; }
  }
  .gb-question-highlight {
    display: inline;
    background-image: linear-gradient(rgba(212,131,143,0.2), rgba(212,131,143,0.2));
    background-repeat: no-repeat;
    background-position: left bottom;
    background-size: 0% 40%;
    padding-bottom: 2px;
  }
  .gb-question-highlight.highlight-visible {
    animation: highlightDraw 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both;
  }

  /* ===== Stamp slam for premiere ===== */
  @keyframes stampSlam {
    0% { transform: scale(3) rotate(-25deg); opacity: 0; }
    60% { transform: scale(0.9) rotate(-12deg); opacity: 1; }
    100% { transform: scale(1) rotate(-12deg); opacity: 0.6; }
  }

  /* ===== Review carousel ===== */
  .review-carousel { position: relative; min-height: 180px; overflow: hidden; }
  .review-card-anim { position: absolute; top: 0; left: 0; right: 0; opacity: 0; transform: translateY(40px); transition: opacity 0.6s ease, transform 0.6s ease; pointer-events: none; }
  .review-card-anim.review-active { opacity: 1; transform: translateY(0); pointer-events: auto; position: relative; }
  .review-card-anim.review-exit { opacity: 0; transform: translateY(-30px); pointer-events: none; }

  /* Star rating bounce animation */
  .review-star-anim { transform: scale(0); opacity: 0; display: inline-block; }
  .review-star-anim.star-active { animation: starFill 0.3s ease both; }

  /* ===== RSVP section classes ===== */
  .rsvp-intro { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; text-align: center; opacity: 0; pointer-events: none; }
  .rsvp-intro-line { width: 0; }
  .rsvp-section-revealed .rsvp-intro { animation: rsvpIntroIn 0.8s ease 0.1s both, rsvpIntroOut 0.6s ease 1.2s both; }
  .rsvp-section-revealed .rsvp-intro-line { animation: lineExpand2 0.6s ease 0.4s both; }
  .rsvp-spotlight { position: absolute; top: -20%; left: 50%; transform: translateX(-50%); width: 0; height: 140%; background: radial-gradient(ellipse at 50% 0%, rgba(212,131,143,0.12) 0%, transparent 70%); opacity: 0; pointer-events: none; z-index: 0; }
  .rsvp-section-revealed .rsvp-spotlight { animation: rsvpSpotlight 1.2s cubic-bezier(0.25,0.46,0.45,0.94) 1.0s both; }
  .rsvp-reveal { opacity: 0; transform: perspective(1200px) rotateX(90deg) translateY(80px); transform-origin: bottom center; position: relative; z-index: 1; }
  .rsvp-section-revealed .rsvp-reveal { animation: rsvpTicketFlip 1.4s cubic-bezier(0.16, 1, 0.3, 1) 1.4s both; }
  .rsvp-ticket-flash::before { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,0.3); pointer-events: none; z-index: 10; opacity: 0; }
  .rsvp-section-revealed .rsvp-ticket-flash::before { animation: ticketFlash 0.4s ease 2.4s both; }
  .rsvp-stamp { position: absolute; top: 12px; right: 12px; width: 52px; height: 52px; border: 2px solid currentColor; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: scale(4) rotate(-20deg); opacity: 0; z-index: 15; pointer-events: none; }
  .rsvp-section-revealed .rsvp-stamp { animation: rsvpStampSlam 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 2.6s both; }
  .rsvp-form-animated > * { opacity: 0; transform: translateY(12px); }
  .rsvp-section-revealed .rsvp-form-animated > *:nth-child(1) { animation: rsvpFieldIn 0.5s ease 2.8s both; }
  .rsvp-section-revealed .rsvp-form-animated > *:nth-child(2) { animation: rsvpFieldIn 0.5s ease 2.95s both; }
  .rsvp-section-revealed .rsvp-form-animated > *:nth-child(3) { animation: rsvpFieldIn 0.5s ease 3.1s both; }
  .rsvp-section-revealed .rsvp-form-animated > *:nth-child(4) { animation: rsvpFieldIn 0.5s ease 3.25s both; }
  .rsvp-section-revealed .rsvp-form-animated > *:nth-child(5) { animation: rsvpFieldIn 0.5s ease 3.4s both; }
  .rsvp-section-revealed .rsvp-form-animated > *:nth-child(6) { animation: rsvpFieldIn 0.5s ease 3.55s both; }
  .rsvp-section-revealed .rsvp-confirm-btn { animation: rsvpFieldIn 0.5s ease 3.55s both, confirmGlow 2s ease-in-out 4.2s infinite alternate; }
  .rsvp-gift-section { opacity: 0; transform: translateY(20px); }
  .rsvp-section-revealed .rsvp-gift-section { animation: rsvpFieldIn 0.8s ease 4.2s both; }

  /* ===== Premiere stamp ===== */
  .premiere-stamp { position: absolute; top: 20px; right: 20px; width: 56px; height: 56px; border: 2px solid currentColor; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: scale(3) rotate(-25deg); opacity: 0; z-index: 10; }
  .premiere-stamp.stamp-visible { animation: stampSlam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both; }

  /* ===== Footer reveal ===== */
  .fin-spotlight { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 40px; height: 100%; opacity: 0; pointer-events: none; }
  .fin-spotlight.fin-visible { animation: spotlightWiden 2s ease both; }
  .fin-text-anim { opacity: 0; }
  .fin-text-anim.fin-visible { animation: finReveal 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both; }
  .fin-line-anim { width: 0; height: 0.5px; opacity: 0; }
  .fin-line-anim.fin-visible { animation: lineExpand 1.2s ease 1s both; }
  .fin-couple-anim { opacity: 0; }
  .fin-couple-anim.fin-visible { animation: fadeUp 1s ease 1.5s both; }

  /* ===== Info section animations ===== */
  .info-title-anim { opacity: 0; }
  .info-title-anim.info-visible { animation: infoTitleIn 0.8s ease 0.2s both; }
  .info-line-anim { width: 0; height: 1px; opacity: 0; }
  .info-line-anim.info-visible { animation: infoLineExpand 0.6s ease 0.6s both; }
  .info-card-anim { opacity: 0; transform: translateX(-20px); }
  .info-card-anim.info-visible { animation: infoCardSlide 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }

  /* ===== Gift accordion ===== */
  .gift-acc-panel { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  .gift-acc-panel.gift-open { max-height: 400px; }
  .gift-acc-chevron { transition: transform 0.35s ease; }
  .gift-acc-chevron.gift-chevron-open { transform: rotate(180deg); }

  /* ===== Editor Preview Mode ===== */
  .film-preview-mode.desktop-frame-wrapper {
    min-height: auto;
    background: transparent;
  }
  .film-preview-mode .mobile-frame {
    height: auto !important;
    overflow: visible !important;
    box-shadow: none;
  }
  .film-preview-mode .mobile-frame-screen {
    height: auto !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .film-preview-mode .mobile-frame-content,
  .film-preview-mode .mobile-frame-content.no-snap {
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
  }
  .film-preview-mode .snap-section {
    height: auto !important;
    min-height: auto !important;
    scroll-snap-align: none !important;
    padding: 32px 0 !important;
    overflow: visible !important;
  }
  .film-preview-mode .snap-long {
    min-height: auto !important;
    scroll-snap-align: none !important;
    padding: 32px 0 !important;
  }
  .film-preview-mode .mobile-frame-fixed-ui {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    transform: none !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    order: -1 !important;
  }
  .film-preview-mode .mobile-frame-fixed-ui > div {
    position: relative !important;
  }
  .film-preview-mode .mobile-frame-fixed-ui > button {
    display: none !important;
  }
  .film-preview-mode .directions-overlay {
    position: absolute !important;
  }
  .film-preview-mode .scene-timed {
    opacity: 1 !important;
    max-height: none !important;
    transform: translateY(0) !important;
    padding: 0 16px !important;
    margin-bottom: 8px !important;
  }
  .film-preview-mode .scene-timed .scene-card-body {
    border-left-color: rgba(212,131,143,0.4) !important;
  }
  .film-preview-mode .scene-timed::after {
    display: none !important;
  }
  .film-preview-mode .scene-timed .scene-photos {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`

function formatTimeToDisplay(time?: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (isNaN(h)) return ''
  const p = h < 12 ? '오전' : '오후'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${p} ${dh}시` : `${p} ${dh}시 ${m}분`
}

// ===== Transform data =====
function transformToDisplayData(invitation: Invitation, content: InvitationContent | null) {
  if (!content) return null
  return {
    id: invitation.id,
    colorTheme: (content.colorTheme || 'film-dark') as ColorTheme,
    fontStyle: (content.fontStyle || 'classic') as FontStyle,
    groom: content.groom || {}, bride: content.bride || {},
    wedding: { ...(content.wedding || {}), timeDisplay: content.wedding?.timeDisplay || invitation.wedding_time || formatTimeToDisplay(content.wedding?.time) || '' }, relationship: content.relationship || {},
    content: content.content || {}, gallery: content.gallery || {},
    media: content.media || {}, rsvpEnabled: content.rsvpEnabled ?? true,
    rsvpDeadline: content.rsvpDeadline || '', rsvpAllowGuestCount: content.rsvpAllowGuestCount ?? true,
    sectionVisibility: content.sectionVisibility || {},
    design: content.design || {}, bgm: content.bgm || {},
    guidance: content.guidance || {}, intro: content.intro,
    youtube: content.youtube,
    deceasedDisplayStyle: content.deceasedDisplayStyle || 'flower',
    customAccentColor: content.customAccentColor,
    displayFont: (content as any).displayFont,
    filmIntroStyle: (content as any).filmIntroStyle,
    magazineSectionOrder: content.magazineSectionOrder,
    magazineSectionBgMap: (content as any).magazineSectionBgMap,
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
  italianno: "'Italianno', cursive",
}

const displayFontScale: Record<string, number> = {
  italianno: 1.35,
  greatvibes: 1.2,
}

const FILM_DEFAULT_SECTION_ORDER = [
  'chapterTwo', 'filmScenes', 'chapterThree', 'video',
  'premiere', 'guidance', 'credits', 'guestbook', 'rsvp'
]

const FILM_DEFAULT_BG: Record<string, 'background' | 'sectionBg'> = {
  chapterTwo: 'sectionBg',
  filmScenes: 'sectionBg',
  chapterThree: 'background',
  video: 'background',
  premiere: 'sectionBg',
  guidance: 'background',
  credits: 'sectionBg',
  guestbook: 'background',
  rsvp: 'sectionBg',
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
    : (invitation?.fontStyle && invitation.fontStyle in fontStyles) ? invitation.fontStyle as FontStyle : 'film'

  const [currentPage, setCurrentPage] = useState<'cover' | 'main'>(skipIntro ? 'main' : 'cover')
  const audioRef = useRef<HTMLAudioElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Scene stacking state
  const [sceneStep, setSceneStep] = useState(0)
  const sceneCount = (invitation?.content?.interviews || []).length
  const sceneSectionRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const touchStartYRef = useRef(0)
  const sceneStepRef = useRef(0)

  // ref mirror 동기화
  useEffect(() => { sceneStepRef.current = sceneStep }, [sceneStep])

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
  const baseFonts = fontStyles[effectiveFontStyle]
  const ds = displayFontScale[invitation?.displayFont || ''] || 1
  const dfs = (px: number) => `${Math.round(px * ds)}px`
  const fonts = invitation?.displayFont && displayFontMap[invitation.displayFont]
    ? { ...baseFonts, display: displayFontMap[invitation.displayFont], ds }
    : { ...baseFonts, ds }

  // Scene 섹션 위에 있는지 판단
  const isOnSceneSection = useCallback(() => {
    const container = scrollContainerRef.current
    const sceneEl = sceneSectionRef.current
    if (!container || !sceneEl) return false
    const cRect = container.getBoundingClientRect()
    const sRect = sceneEl.getBoundingClientRect()
    return Math.abs(sRect.top - cRect.top) < 80
  }, [])

  // snap-long 섹션 내부에서 아직 스크롤할 내용이 남았는지
  const canScrollInLongSection = useCallback((direction: 'down' | 'up') => {
    const container = scrollContainerRef.current
    if (!container) return false
    const longSections = container.querySelectorAll('.snap-long')
    for (const section of longSections) {
      const cRect = container.getBoundingClientRect()
      const sRect = section.getBoundingClientRect()
      if (Math.abs(sRect.top - cRect.top) < 80) {
        if (direction === 'down') return sRect.bottom > cRect.bottom + 10
        if (direction === 'up') return sRect.top < cRect.top - 10
      }
    }
    return false
  }, [])

  // Wheel handler
  const handleWheel = useCallback((e: WheelEvent) => {
    if (currentPage === 'cover' || isPreview) return

    const direction = e.deltaY > 0 ? 'down' : 'up'

    // snap-long 섹션 내부 스크롤 허용 (scene 섹션 제외)
    if (!isOnSceneSection() && canScrollInLongSection(direction)) return

    e.preventDefault()
    if (isScrollingRef.current) return
    isScrollingRef.current = true
    setTimeout(() => { isScrollingRef.current = false }, 800)

    if (direction === 'down') {
      if (isOnSceneSection() && sceneStepRef.current <= sceneCount) {
        setSceneStep(prev => prev + 1)
        return
      }
      scrollContainerRef.current?.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
    } else {
      if (isOnSceneSection() && sceneStepRef.current > 1) {
        setSceneStep(prev => prev - 1)
        return
      }
      scrollContainerRef.current?.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })
    }
  }, [currentPage, isPreview, sceneCount, isOnSceneSection, canScrollInLongSection])

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (currentPage === 'cover' || isPreview) return
    const deltaY = touchStartYRef.current - e.touches[0].clientY
    const direction = deltaY > 0 ? 'down' : 'up'
    // snap-long 내부 스크롤은 네이티브 허용 (scene 섹션 제외)
    if (!isOnSceneSection() && canScrollInLongSection(direction)) return
    e.preventDefault()
  }, [currentPage, isPreview, isOnSceneSection, canScrollInLongSection])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (currentPage === 'cover' || isPreview) return

    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY
    if (Math.abs(deltaY) < 50) return

    const direction = deltaY > 0 ? 'down' : 'up'

    // snap-long 내부 스크롤은 네이티브가 처리
    if (!isOnSceneSection() && canScrollInLongSection(direction)) return

    if (isScrollingRef.current) return
    isScrollingRef.current = true
    setTimeout(() => { isScrollingRef.current = false }, 800)

    if (direction === 'down') {
      if (isOnSceneSection() && sceneStepRef.current <= sceneCount) {
        setSceneStep(prev => prev + 1)
        return
      }
      scrollContainerRef.current?.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
    } else {
      if (isOnSceneSection() && sceneStepRef.current > 1) {
        setSceneStep(prev => prev - 1)
        return
      }
      scrollContainerRef.current?.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })
    }
  }, [currentPage, isPreview, sceneCount, isOnSceneSection, canScrollInLongSection])

  // Keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (currentPage === 'cover' || isPreview) return
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    const downKeys = ['ArrowDown', 'PageDown', ' ']
    const upKeys = ['ArrowUp', 'PageUp']

    if (!downKeys.includes(e.key) && !upKeys.includes(e.key)) return
    e.preventDefault()

    if (isScrollingRef.current) return
    isScrollingRef.current = true
    setTimeout(() => { isScrollingRef.current = false }, 800)

    if (downKeys.includes(e.key)) {
      if (isOnSceneSection() && sceneStepRef.current <= sceneCount) {
        setSceneStep(prev => prev + 1)
        return
      }
      scrollContainerRef.current?.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
    } else {
      if (isOnSceneSection() && sceneStepRef.current > 1) {
        setSceneStep(prev => prev - 1)
        return
      }
      scrollContainerRef.current?.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })
    }
  }, [currentPage, isPreview, sceneCount, isOnSceneSection])

  // Attach event listeners
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || currentPage === 'cover' || isPreview) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentPage, isPreview, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown])

  // Scene section IntersectionObserver
  useEffect(() => {
    if (!sceneSectionRef.current || !scrollContainerRef.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setSceneStep(0)
      else if (sceneStepRef.current === 0) setSceneStep(1)
    }, { root: scrollContainerRef.current, threshold: 0.3 })
    observer.observe(sceneSectionRef.current)
    return () => observer.disconnect()
  }, [currentPage])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
  }, [currentPage])

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

  // 동적 accent 색상 CSS (포인트 컬러 반영)
  const accentRgb = (() => {
    const hex = tc.accent || '#D4838F'
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
  })()
  const dynamicAccentCSS = `
    .scene-timed.scene-show { background: rgba(${accentRgb},0.03) !important; }
    .scene-timed.scene-show .scene-card-body { border-left-color: rgba(${accentRgb},0.4) !important; }
    .scene-timed.scene-collapsed .scene-card-body { border-left-color: rgba(${accentRgb},0.08) !important; }
    .film-preview-mode .scene-timed .scene-card-body { border-left-color: rgba(${accentRgb},0.4) !important; }
    .gb-question-highlight { background-image: linear-gradient(rgba(${accentRgb},0.2), rgba(${accentRgb},0.2)) !important; }
    .scene-photo-wrap { border: 1px solid rgba(${accentRgb},0.2) !important; }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <style dangerouslySetInnerHTML={{ __html: dynamicAccentCSS }} />
      <div className={`desktop-frame-wrapper${isPreview ? ' film-preview-mode' : ''}`}>
        {!isPaid && !isPreview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
          </div>
        )}
        <div className="mobile-frame">
          <div className="mobile-frame-screen">
            <div className={`mobile-frame-content${currentPage === 'cover' || isPreview ? ' no-snap' : ''}`} ref={scrollContainerRef}>
              <WatermarkOverlay isPaid={isPaid || !!isPreview} className="relative w-full min-h-screen">
                <div className="relative w-full min-h-screen overflow-x-hidden" style={{ backgroundColor: tc.background, fontFamily: fonts.body, color: tc.text }}>
                  {currentPage === 'cover' ? (
                    invitation.filmIntroStyle === 'cinematic'
                      ? <FilmCinematicCover invitation={invitation} fonts={fonts} tc={tc} onEnter={() => setCurrentPage('main')} isPreview={isPreview} />
                      : <FilmPosterCover invitation={invitation} fonts={fonts} tc={tc} onEnter={() => setCurrentPage('main')} isPreview={isPreview} />
                  ) : (
                    <>
                      <div className="snap-section" style={{ backgroundColor: tc.background }}><ChapterOne invitation={invitation} fonts={fonts} tc={tc} /></div>
                      {(() => {
                        const sectionBgMap: Record<string, 'background' | 'sectionBg'> = invitation.magazineSectionBgMap || FILM_DEFAULT_BG
                        const getBg = (id: string) => tc[sectionBgMap[id] || FILM_DEFAULT_BG[id] || 'sectionBg']
                        const order = invitation.magazineSectionOrder || FILM_DEFAULT_SECTION_ORDER
                        return order.map((sectionId: string, idx: number) => {
                          const prevBg = idx === 0 ? tc.background : getBg(order[idx - 1])
                          const curBg = getBg(sectionId)
                          const sceneCut = <SceneCut key={`cut-${sectionId}`} from={prevBg} to={curBg} />
                          const snapClass = ['guestbook', 'rsvp'].includes(sectionId) ? 'snap-long' : 'snap-section'
                          switch (sectionId) {
                            case 'chapterTwo':
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg }}>{sceneCut}<ChapterTwo invitation={invitation} fonts={fonts} tc={tc} bgOverride={curBg} /></div>
                            case 'filmScenes':
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg, justifyContent: 'flex-start' }} ref={sceneSectionRef}>{sceneCut}<FilmScenes invitation={invitation} fonts={fonts} tc={tc} bgOverride={curBg} sceneStep={sceneStep} /></div>
                            case 'chapterThree':
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg }}>{sceneCut}<ChapterThree invitation={invitation} fonts={fonts} tc={tc} onOpenLightbox={(i) => { setLightboxIndex(i); setLightboxOpen(true) }} bgOverride={curBg} /></div>
                            case 'video':
                              if (!(invitation as any).youtube?.enabled) return null
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg }}>{sceneCut}<FilmVideoSection invitation={invitation} fonts={fonts} tc={tc} bgOverride={curBg} /></div>
                            case 'premiere':
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg }}>{sceneCut}<ThePremiere invitation={invitation} fonts={fonts} tc={tc} bgOverride={curBg} /></div>
                            case 'guidance':
                              if (invitation.sectionVisibility?.guidance === false) return null
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg }}>{sceneCut}<GuidanceSection invitation={invitation} fonts={fonts} tc={tc} bgOverride={curBg} /></div>
                            case 'credits':
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg }}>{sceneCut}<CreditsSection invitation={invitation} fonts={fonts} tc={tc} bgOverride={curBg} /></div>
                            case 'gift':
                              return null
                            case 'guestbook':
                              if (invitation.sectionVisibility?.guestbook === false) return null
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg }}>{sceneCut}<AudienceReviews invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} tc={tc} isSample={isSample} bgOverride={curBg} /></div>
                            case 'rsvp':
                              if (!invitation.rsvpEnabled) return null
                              return <div key={sectionId} className={snapClass} style={{ backgroundColor: curBg }}>{sceneCut}<TicketRsvp invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} tc={tc} bgOverride={curBg} /></div>
                            default:
                              return null
                          }
                        })
                      })()}
                      <div className="snap-section" style={{ backgroundColor: tc.background }}><FilmFooter invitation={invitation} fonts={fonts} tc={tc} /></div>
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
                <FilmHeader invitation={invitation} fonts={fonts} tc={tc} />
              )}
              {currentPage === 'main' && !isPreview && (
                <GuestFloatingButton themeColors={{...tc, primary: tc.cardText ? tc.accent : tc.primary, sectionBg: getAccentTint(tc.accent, 0.85), text: tc.cardText || tc.text, gray: tc.cardGray || tc.gray, background: getAccentTint(tc.accent, 0.82)}} fonts={fonts} openModal="none" onModalClose={() => {}} showTooltip={false} scrollContainerRef={scrollContainerRef}
                  navStyle={content?.navStyle || 'hamburger'}
                  invitation={{ venue_name: invitation.wedding?.venue?.name || '', venue_address: invitation.wedding?.venue?.address || '', contacts, accounts,
                    directions: invitation.wedding?.directions, rsvpEnabled: invitation.rsvpEnabled, rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
                    invitationId: dbInvitation.id, groomName: invitation.groom?.name || '', brideName: invitation.bride?.name || '',
                    weddingDate: invitation.wedding?.date || '', weddingTime: invitation.wedding?.timeDisplay || invitation.wedding?.time || '',
                    thumbnailUrl: content?.meta?.kakaoThumbnail || content?.meta?.ogImage || extractImageUrl(invitation.media?.coverImage) || '',
                    shareTitle: content?.meta?.title, shareDescription: content?.meta?.description }} />
              )}
              {invitation.bgm?.enabled && invitation.bgm?.url && (
                <MusicToggle audioRef={audioRef} isVisible={currentPage === 'main'} shouldAutoPlay={currentPage === 'main' && invitation.bgm?.autoplay === true} tc={tc} />
              )}
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
