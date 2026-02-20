'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'
import IntroAnimation from '@/components/invitation/IntroAnimation'
import { IntroSettings, getDefaultIntroSettings } from '@/lib/introPresets'

// ===== Types =====
type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string; highlight?: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#C41050', secondary: '#D4768A', accent: '#C41050', background: '#FFFFFF', sectionBg: '#FFF5F5', cardBg: '#FFFFFF', divider: '#E8A0B0', text: '#3d3d3d', gray: '#555555' },
  'modern-black': { primary: '#111111', secondary: '#555555', accent: '#111111', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#3d3d3d', gray: '#555555', highlight: '#888888' },
  'romantic-blush': { primary: '#A67A7A', secondary: '#8a7068', accent: '#8a7068', background: '#FFFFFF', sectionBg: '#FAF5F3', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#3d3d3d', gray: '#555555' },
  'nature-green': { primary: '#3A5A3A', secondary: '#6A7A62', accent: '#5A7A52', background: '#FFFFFF', sectionBg: '#F3F7F1', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3d3d3d', gray: '#555555', highlight: '#5A8A52' },
  'luxury-navy': { primary: '#0f2035', secondary: '#8A6A3A', accent: '#8A6A3A', background: '#FFFFFF', sectionBg: '#F3F5F8', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#3d3d3d', gray: '#555555', highlight: '#8A6A3A' },
  'sunset-coral': { primary: '#B85040', secondary: '#B88060', accent: '#B8683A', background: '#FFFFFF', sectionBg: '#FFF5EF', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#3d3d3d', gray: '#555555' },
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
function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    return () => { observerRef.current?.disconnect() }
  }, [])

  const ref = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(node)
    observerRef.current = observer
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

// ===== Image Crop Style Helper =====
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

// ===== Magazine Cover Section =====
function MagazineCover({ invitation, fonts, themeColors, onEnter }: {
  invitation: any; fonts: FontConfig; themeColors: ColorConfig; onEnter: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const coverImage = extractImageUrl(invitation.media?.coverImage) || '/images/our-cover.png'
  const introStyle = invitation.magazineIntroStyle || 'cover'

  useEffect(() => { setTimeout(() => setLoaded(true), 100) }, [])

  const weddingDate = invitation.wedding?.date ? new Date(invitation.wedding.date) : new Date()
  const year = weddingDate.getFullYear()
  const month = String(weddingDate.getMonth() + 1).padStart(2, '0')
  const day = String(weddingDate.getDate()).padStart(2, '0')
  const dateStr = `${year}.${month}.${day}`
  const dayOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][weddingDate.getDay()]

  const groomName = invitation.groom?.name || ''
  const brideName = invitation.bride?.name || ''

  // Style: clean (텍스트 중심 미니멀)
  if (introStyle === 'clean') {
    return (
      <div className="relative w-full min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: themeColors.background }}>
        <div
          className="text-center transition-all duration-[1500ms]"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <span style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '5px', color: themeColors.gray, display: 'block', marginBottom: '40px' }}>
            WEDDING INVITATION
          </span>
          <div style={{ width: '1px', height: '50px', background: themeColors.divider, margin: '0 auto 40px' }} />
          <div style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '8px', color: themeColors.primary, lineHeight: 1.8 }}>
            {groomName}
          </div>
          <span style={{ fontFamily: fonts.display, fontSize: '12px', letterSpacing: '5px', color: themeColors.gray }}>&amp;</span>
          <div style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '8px', color: themeColors.primary, lineHeight: 1.8 }}>
            {brideName}
          </div>
          <div style={{ width: '1px', height: '50px', background: themeColors.divider, margin: '40px auto' }} />
          <div style={{ fontFamily: fonts.display, fontSize: '12px', letterSpacing: '3px', color: themeColors.gray, lineHeight: 2.4 }}>
            <span style={{ display: 'block' }}>{dateStr} {dayOfWeek}</span>
            {invitation.wedding?.venue?.name && (
              <span style={{ display: 'block', fontSize: '11px', letterSpacing: '2px' }}>{invitation.wedding.venue.name}</span>
            )}
          </div>
          <button
            onClick={onEnter}
            className="mt-12 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px', color: themeColors.primary, background: 'transparent', border: `1px solid ${themeColors.divider}`, padding: '14px 40px', cursor: 'pointer' }}
          >
            OPEN
          </button>
        </div>
      </div>
    )
  }

  // Style: editorial (에디토리얼 - 사진 위 타이포그래피 오버레이)
  if (introStyle === 'editorial') {
    return (
      <div className="relative w-full min-h-screen" style={{ backgroundColor: '#000' }}>
        {/* Full bleed cover */}
        <div className="absolute inset-0">
          <div className="w-full h-full" style={{ ...getImageCropStyle(coverImage, invitation.media?.coverImageSettings || {}), opacity: loaded ? 1 : 0, transition: 'opacity 2s ease' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.5) 100%)' }} />
        </div>
        {/* Top bar */}
        <div
          className="relative z-10 px-6 pt-10 flex items-center justify-between transition-all duration-[1200ms]"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-10px)' }}
        >
          <span style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.9)' }}>WEDDING</span>
          <span style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }}>{dateStr}</span>
        </div>
        {/* Bottom overlay text */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-16 transition-all duration-[1500ms] delay-300"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <div style={{ fontFamily: fonts.display, fontSize: '34px', fontWeight: 300, letterSpacing: '10px', color: '#ffffff', lineHeight: 1.3 }}>
            {groomName}
          </div>
          <div className="flex items-center gap-3 my-2">
            <div style={{ height: '0.5px', width: '24px', background: 'rgba(255,255,255,0.5)' }} />
            <span style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '5px', color: 'rgba(255,255,255,0.7)' }}>&amp;</span>
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: '34px', fontWeight: 300, letterSpacing: '10px', color: '#ffffff', lineHeight: 1.3 }}>
            {brideName}
          </div>
          <button
            onClick={onEnter}
            className="mt-8 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '5px', color: '#ffffff', background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', padding: '12px 36px', cursor: 'pointer' }}
          >
            OPEN
          </button>
        </div>
      </div>
    )
  }

  // Style: cover (기존 - 사진 중심 매거진 커버)
  return (
    <div className="relative w-full min-h-screen flex flex-col" style={{ backgroundColor: themeColors.background }}>
      <div
        className="relative z-10 px-6 pt-10 pb-4 transition-all duration-[1200ms]"
        style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-10px)' }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '3px', color: themeColors.primary, fontWeight: 400 }}>
            WEDDING
          </span>
          <div style={{ height: '0.5px', flex: 1, background: themeColors.divider }} />
          <span style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.gray }}>
            {dateStr}
          </span>
        </div>
      </div>
      <div
        className="relative z-10 mx-6 overflow-hidden transition-all duration-[2000ms]"
        style={{ aspectRatio: '3/4', opacity: loaded ? 1 : 0, transform: loaded ? 'scale(1)' : 'scale(1.02)' }}
      >
        <div className="w-full h-full" style={getImageCropStyle(coverImage, invitation.media?.coverImageSettings || {})} />
      </div>
      <div
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 transition-all duration-[1500ms] delay-500"
        style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)' }}
      >
        <div className="text-center">
          <div style={{ fontFamily: fonts.display, fontSize: '22px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary, lineHeight: 1.6 }}>
            {groomName} <span style={{ fontSize: '14px', letterSpacing: '4px', color: themeColors.gray, fontWeight: 300 }}>&amp;</span> {brideName}
          </div>
        </div>
        <button
          onClick={onEnter}
          className="mt-8 transition-all duration-300 hover:scale-105 active:scale-95"
          style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px', color: themeColors.primary, background: 'transparent', border: `1px solid ${themeColors.divider}`, padding: '12px 36px', cursor: 'pointer' }}
        >
          OPEN
        </button>
      </div>
    </div>
  )
}

// ===== Editor's Note Section =====
function EditorsNote({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal()

  const greeting = invitation.content?.greeting || '두 사람이 함께 쓰는 새로운 이야기가 시작됩니다.'

  return (
    <div ref={ref} className="px-6 py-20" style={{ backgroundColor: themeColors.background }}>
      <div
        className="transition-all duration-1000"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}
      >
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-8">
          <div style={{ height: '0.5px', flex: 1, background: themeColors.divider }} />
          <span style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px', color: themeColors.gray }}>
            EDITOR&apos;S NOTE
          </span>
          <div style={{ height: '0.5px', flex: 1, background: themeColors.divider }} />
        </div>

        {/* Drop Cap Style Greeting */}
        <div style={{ maxWidth: '320px', margin: '0 auto' }}>
          {greeting.split('\n').filter(Boolean).map((line: string, i: number) => (
            <p
              key={i}
              style={{
                fontFamily: i === 0 ? fonts.displayKr : fonts.body,
                fontSize: i === 0 ? '15px' : '13px',
                lineHeight: 2,
                color: i === 0 ? themeColors.text : themeColors.gray,
                fontWeight: i === 0 ? 500 : 300,
                textAlign: 'center',
                marginBottom: '4px',
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Quote */}
        {invitation.content?.quote?.text && (
          <div className="mt-12 text-center">
            <div style={{ width: '20px', height: '1px', background: themeColors.primary, margin: '0 auto 16px' }} />
            <p style={{ fontFamily: fonts.displayKr, fontSize: '13px', fontStyle: 'italic', lineHeight: 1.8, color: themeColors.primary }}>
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
  )
}

// ===== Meet The Couple (Interviewee Profile) =====
function MeetTheCouple({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal()
  const groomProfile = invitation.groom?.profile
  const brideProfile = invitation.bride?.profile
  const groomImage = extractImageUrl(groomProfile?.images?.[0])
  const brideImage = extractImageUrl(brideProfile?.images?.[0])
  const groomName = invitation.groom?.name || '신랑'
  const brideName = invitation.bride?.name || '신부'
  const hasGroomContent = groomImage || groomProfile?.tag
  const hasBrideContent = brideImage || brideProfile?.tag

  if (!hasGroomContent && !hasBrideContent) return null

  return (
    <div ref={ref} className="px-6 py-16" style={{ backgroundColor: themeColors.sectionBg }}>
      <div
        className="transition-all duration-1000"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}
      >
        {/* Section Label */}
        <div className="text-center mb-10">
          <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
            INTERVIEWEE
          </div>
          <h2 style={{ fontFamily: fonts.display, fontSize: '24px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary }}>
            MEET THE COUPLE
          </h2>
          <div style={{ width: '40px', height: '1px', background: themeColors.primary, margin: '16px auto 0' }} />
        </div>

        {/* Two circular portraits side by side */}
        <div className="flex justify-center items-start gap-10">
          {/* Groom */}
          {hasGroomContent && (
            <div className="flex flex-col items-center" style={{ maxWidth: '120px' }}>
              <div
                className="overflow-hidden mb-4"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: `1.5px solid ${themeColors.divider}`,
                  backgroundColor: groomImage ? undefined : themeColors.sectionBg,
                }}
              >
                {groomImage ? (
                  <div className="w-full h-full" style={getImageCropStyle(groomImage, groomProfile?.imageSettings?.[0] || {})} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: themeColors.gray, fontSize: '24px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.primary, fontWeight: 500 }}>
                {groomName}
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray, marginTop: '4px' }}>
                GROOM
              </div>
              {groomProfile?.tag && (
                <p style={{ fontFamily: fonts.body, fontSize: '11px', color: themeColors.gray, marginTop: '8px', textAlign: 'center', lineHeight: 1.5 }}>
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
            <div className="flex flex-col items-center" style={{ maxWidth: '120px' }}>
              <div
                className="overflow-hidden mb-4"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: `1.5px solid ${themeColors.divider}`,
                  backgroundColor: brideImage ? undefined : themeColors.sectionBg,
                }}
              >
                {brideImage ? (
                  <div className="w-full h-full" style={getImageCropStyle(brideImage, brideProfile?.imageSettings?.[0] || {})} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: themeColors.gray, fontSize: '24px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '2px', color: themeColors.primary, fontWeight: 500 }}>
                {brideName}
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray, marginTop: '4px' }}>
                BRIDE
              </div>
              {brideProfile?.tag && (
                <p style={{ fontFamily: fonts.body, fontSize: '11px', color: themeColors.gray, marginTop: '8px', textAlign: 'center', lineHeight: 1.5 }}>
                  {brideProfile.tag}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Feature Interview Section =====
function FeatureInterview({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
  const interviews = invitation.content?.interviews || []

  return (
    <div style={{ backgroundColor: themeColors.sectionBg }}>
      {/* Section Header */}
      <div className="px-6 pt-16 pb-8 text-center">
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
          EXCLUSIVE
        </div>
        <h2 style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary }}>
          THE INTERVIEW
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
      className="px-6 pb-12 transition-all duration-1000"
      style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}
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

      {/* Question - Magazine headline style */}
      <h3
        style={{
          fontFamily: fonts.displayKr,
          fontSize: '18px',
          fontWeight: 600,
          lineHeight: 1.5,
          color: themeColors.text,
          marginBottom: '16px',
          letterSpacing: '-0.3px',
        }}
      >
        Q. {item.question}
      </h3>

      {/* Main image - full width portrait */}
      {images.length > 0 && (
        <div className="w-full mb-6 overflow-hidden" style={{ aspectRatio: '4/5' }}>
          <div className="w-full h-full" style={getImageCropStyle(images[0], item.imageSettings?.[0] || {})} />
        </div>
      )}

      {/* Answer - Editorial body style */}
      <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: `2px solid ${themeColors.primary}` }}>
        {item.answer?.split('\n').filter(Boolean).map((line: string, i: number) => (
          <p
            key={i}
            style={{
              fontFamily: fonts.body,
              fontSize: '13px',
              lineHeight: 1.9,
              color: themeColors.gray,
              marginBottom: '4px',
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Sub image - single */}
      {images.length === 2 && (
        <div className="mt-6 overflow-hidden" style={{ aspectRatio: '4/5' }}>
          <div className="w-full h-full" style={getImageCropStyle(images[1], item.imageSettings?.[1] || {})} />
        </div>
      )}
      {/* Sub images - 2 photos side by side */}
      {images.length >= 3 && (
        <div className="mt-6 grid grid-cols-2 gap-1">
          {images.slice(1, 3).map((img: string, imgIdx: number) => (
            <div key={imgIdx} className="overflow-hidden" style={{ aspectRatio: '4/5' }}>
              <div className="w-full h-full" style={getImageCropStyle(img, item.imageSettings?.[imgIdx + 1] || {})} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Photo Spread Section =====
function PhotoSpread({ invitation, fonts, themeColors, onOpenLightbox }: {
  invitation: any; fonts: FontConfig; themeColors: ColorConfig; onOpenLightbox: (idx: number) => void
}) {
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
                style={{ aspectRatio: '4/5' }}
              >
                <div className="w-full h-full transition-transform duration-700 hover:scale-105" style={getImageCropStyle(img, invitation.gallery?.imageSettings?.[startIdx + i] || {})} />
              </div>
            ))}
          </div>
        )}
        {lastSingle && (
          <div
            className="mt-1 overflow-hidden cursor-pointer"
            onClick={() => onOpenLightbox(lastSingleIdx)}
            style={{ aspectRatio: '4/5' }}
          >
            <div className="w-full h-full transition-transform duration-700 hover:scale-105" style={getImageCropStyle(lastSingle, invitation.gallery?.imageSettings?.[lastSingleIdx] || {})} />
          </div>
        )}
      </>
    )
  }

  return (
    <div ref={ref} className="py-16" style={{ backgroundColor: themeColors.background }}>
      <div
        className="transition-all duration-1000"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}
      >
        {/* Section Header */}
        <div className="px-6 mb-8 text-center">
          <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
            GALLERY
          </div>
          <h2 style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary }}>
            PHOTO SPREAD
          </h2>
          <div style={{ width: '40px', height: '1px', background: themeColors.primary, margin: '16px auto 0' }} />
        </div>

        {/* Magazine-style grid */}
        <div className="px-3">
          {images[0] && (
            <div
              className="mb-1 overflow-hidden cursor-pointer"
              onClick={() => onOpenLightbox(0)}
              style={{ aspectRatio: '4/5' }}
            >
              <div className="w-full h-full transition-transform duration-700 hover:scale-105" style={getImageCropStyle(images[0], invitation.gallery?.imageSettings?.[0] || {})} />
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
function YouTubeSection({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
  const youtube = invitation.youtube
  if (!youtube?.enabled || !youtube?.url) return null

  const match = youtube.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
  const videoId = match?.[1]
  if (!videoId) return null

  return (
    <div className="px-6 py-12" style={{ backgroundColor: themeColors.sectionBg }}>
      <div className="text-center mb-6">
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '8px' }}>VIDEO</div>
        {youtube.title && (
          <p style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: themeColors.text }}>{youtube.title}</p>
        )}
      </div>
      <div className="w-full" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </div>
    </div>
  )
}

// ===== The Details (Wedding Info) Section =====
function TheDetails({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
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
    <div ref={ref} className="px-6 py-20" style={{ backgroundColor: themeColors.background }}>
      <div
        className="transition-all duration-1000"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
            DETAILS
          </div>
          <h2 style={{ fontFamily: fonts.display, fontSize: '28px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary }}>
            THE WEDDING
          </h2>
          <div style={{ width: '40px', height: '1px', background: themeColors.primary, margin: '16px auto 0' }} />
        </div>

        {/* Date Card */}
        {date && (
          <div className="text-center mb-12" style={{ padding: '28px 20px', border: `0.5px solid ${themeColors.divider}` }}>
            <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '8px' }}>
              {date.getFullYear()}. {String(date.getMonth() + 1).padStart(2, '0')}
            </div>
            <div className="flex items-center justify-center gap-4">
              <div style={{ height: '0.5px', width: '40px', background: themeColors.divider }} />
              <div style={{ fontFamily: fonts.display, fontSize: '48px', fontWeight: 200, color: themeColors.primary, lineHeight: 1 }}>
                {date.getDate()}
              </div>
              <div style={{ height: '0.5px', width: '40px', background: themeColors.divider }} />
            </div>
            <div style={{ fontFamily: fonts.displayKr, fontSize: '12px', letterSpacing: '2px', color: themeColors.gray, marginTop: '8px' }}>
              {dayNamesKr[date.getDay()]}
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: '14px', color: themeColors.text, marginTop: '12px' }}>
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
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `0.5px solid ${themeColors.divider}` }}>
                  <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '6px' }}>
                    {diffDays === 0 ? 'TODAY' : 'D-DAY'}
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '24px', fontWeight: 300, color: themeColors.primary, letterSpacing: '2px' }}>
                    {diffDays === 0 ? 'THE DAY' : `D-${diffDays}`}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Venue */}
        <div className="text-center mb-12">
          <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '8px' }}>
            VENUE
          </div>
          <p style={{ fontFamily: fonts.displayKr, fontSize: '16px', fontWeight: 500, color: themeColors.text }}>
            {w.venue?.name || ''}
          </p>
          {w.venue?.hall && !w.venue?.hideHall && (
            <p style={{ fontFamily: fonts.body, fontSize: '13px', color: themeColors.gray, marginTop: '4px' }}>
              {w.venue.hall}
            </p>
          )}
          <p style={{ fontFamily: fonts.body, fontSize: '12px', color: themeColors.gray, marginTop: '8px' }}>
            {w.venue?.address || ''}
          </p>
        </div>

        {/* Parents Introduction - Magazine column style */}
        {invitation.sectionVisibility?.parentNames !== false && (groom.father?.name || groom.mother?.name || bride.father?.name || bride.mother?.name) && (
          <div style={{ borderTop: `0.5px solid ${themeColors.divider}`, paddingTop: '24px' }}>
            <div className="grid grid-cols-2 gap-6">
              {/* Groom side */}
              <div className="text-center">
                <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: themeColors.gray, marginBottom: '12px' }}>GROOM</div>
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
                <div style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '3px', color: themeColors.gray, marginBottom: '12px' }}>BRIDE</div>
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
        {w.venue?.address && (
          <div className="mt-8">
            <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '12px', textAlign: 'center' }}>
              MAP
            </div>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(w.venue.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-3"
                style={{ border: `0.5px solid ${themeColors.divider}` }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: '#03C75A' }}>
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray }}>NAVER</span>
              </a>
              <a
                href={`https://map.kakao.com/link/search/${encodeURIComponent(w.venue.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-3"
                style={{ border: `0.5px solid ${themeColors.divider}` }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: '#FEE500' }}>
                  <span className="text-black text-xs font-bold">K</span>
                </div>
                <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray }}>KAKAO</span>
              </a>
              <a
                href={`tmap://search?name=${encodeURIComponent(w.venue.name || '')}`}
                className="flex flex-col items-center p-3"
                style={{ border: `0.5px solid ${themeColors.divider}` }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: '#4285F4' }}>
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span style={{ fontFamily: fonts.display, fontSize: '9px', letterSpacing: '1px', color: themeColors.gray }}>TMAP</span>
              </a>
            </div>
          </div>
        )}

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
      {text.split('\n').map((line, i) => (
        <p key={i} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: themeColors.gray }}>
          {line}
        </p>
      ))}
    </div>
  )
}

// ===== Guidance & Info Section =====
function GuidanceInfoSection({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
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

  // guidance가 없고 info 항목도 없으면 렌더링하지 않음
  if (!guidance?.enabled && enabledItems.length === 0) return null

  return (
    <div ref={ref} className="py-12" style={{ backgroundColor: themeColors.sectionBg }}>
      <div
        className="transition-all duration-1000"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)' }}
      >
        {/* Section Header */}
        <div className="text-center mb-8 px-6">
          <div style={{ fontFamily: fonts.display, fontSize: '8px', letterSpacing: '4px', color: themeColors.gray, marginBottom: '6px' }}>
            FOR YOUR HAPPY TIME
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: '18px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary }}>
            INFORMATION
          </div>
          <div style={{ width: '25px', height: '1px', background: themeColors.primary, margin: '8px auto 0' }} />
        </div>

        {/* Guidance Image */}
        {guidance?.image && (
          <div className="px-6 mb-8">
            <div className="w-full overflow-hidden" style={{ aspectRatio: '4/5' }}>
              <div className="w-full h-full" style={getImageCropStyle(guidance.image, guidance.imageSettings || {})} />
            </div>
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
                <div key={i} style={{ padding: '16px', background: themeColors.cardBg, border: `0.5px solid ${themeColors.divider}` }}>
                  <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '3px', color: themeColors.primary, marginBottom: '8px' }}>
                    {item.title?.toUpperCase()}
                  </div>
                  {item.content.split('\n').map((line: string, j: number) => (
                    <p key={j} style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: themeColors.gray }}>{line}</p>
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

// ===== Thank You Section =====
function ThankYouSection({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
  const { ref, isVisible } = useScrollReveal()
  const thankYou = invitation.content?.thankYou
  if (!thankYou) return null

  return (
    <div ref={ref} className="px-6 py-20 text-center" style={{ backgroundColor: themeColors.background }}>
      <div
        className="transition-all duration-1000"
        style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)' }}
      >
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '12px' }}>
          CLOSING NOTE
        </div>
        <h2 style={{ fontFamily: fonts.display, fontSize: '24px', fontWeight: 300, letterSpacing: '6px', color: themeColors.primary, marginBottom: '20px' }}>
          {thankYou.title || 'THANK YOU'}
        </h2>
        <div style={{ width: '30px', height: '1px', background: themeColors.primary, margin: '0 auto 20px' }} />
        {thankYou.message?.split('\n').map((line: string, i: number) => (
          <p key={i} style={{ fontFamily: fonts.body, fontSize: '13px', lineHeight: 2, color: themeColors.gray }}>{line}</p>
        ))}
        {thankYou.sign && (
          <p style={{ fontFamily: fonts.displayKr, fontSize: '13px', color: themeColors.text, marginTop: '16px', fontWeight: 500 }}>
            {thankYou.sign}
          </p>
        )}
      </div>
    </div>
  )
}

// ===== Contacts Section =====
function ContactsSection({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
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
    <div className="px-6 py-12" style={{ backgroundColor: themeColors.sectionBg }}>
      <div className="text-center mb-8">
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
            color: expandedSide === 'groom' ? '#FFFFFF' : themeColors.text,
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
        >
          GROOM
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
            color: expandedSide === 'bride' ? '#FFFFFF' : themeColors.text,
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
        >
          BRIDE
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

function GuestbookSection({ invitation, invitationId, fonts, themeColors, isSample }: {
  invitation: any; invitationId: string; fonts: FontConfig; themeColors: ColorConfig; isSample?: boolean
}) {
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
    <div className="px-6 py-12" style={{ backgroundColor: themeColors.background }}>
      <div className="text-center mb-8">
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '8px' }}>
          MESSAGES
        </div>
        <h3 style={{ fontFamily: fonts.display, fontSize: '20px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary }}>
          GUESTBOOK
        </h3>
      </div>

      {/* Question */}
      <div className="text-center mb-6">
        <p style={{
          fontFamily: fonts.displayKr,
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: 1.7,
          color: themeColors.text,
          minHeight: '24px',
        }}>
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
            }}
          >
            다른 질문 보기 &rarr;
          </button>
        )}
      </div>

      {/* Form */}
      <div className="mb-8 space-y-3">
        <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="이름"
            maxLength={20}
            style={{ fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, outline: 'none', width: '100%', color: themeColors.text }}
          />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="메시지를 남겨주세요 (100자 이내)"
          rows={3}
          maxLength={100}
          style={{ fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, outline: 'none', width: '100%', resize: 'none', color: themeColors.text }}
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
          LEAVE A MESSAGE
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
            <div key={msg.id || i} style={{ padding: '14px 16px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg }}>
              {msg.question && (
                <p style={{ fontFamily: fonts.body, fontSize: '10px', color: themeColors.gray, marginBottom: '6px', opacity: 0.7 }}>
                  Q. {msg.question}
                </p>
              )}
              <p style={{ fontFamily: fonts.body, fontSize: '12px', lineHeight: 1.7, color: themeColors.text, marginBottom: '8px' }}>{msg.message}</p>
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
              +{messages.length - 5} MORE MESSAGES
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ===== RSVP Section =====
function RsvpSection({ invitation, invitationId, fonts, themeColors }: {
  invitation: any; invitationId: string; fonts: FontConfig; themeColors: ColorConfig
}) {
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
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: name,
          attendance: ({ yes: 'attending', no: 'not_attending' } as Record<string, string>)[attendance] || attendance,
          guestCount: attendance === 'yes' ? guestCount : 0,
          message: rsvpMessage,
          side: side || undefined,
        }),
      })
      if (res.ok) setSubmitted(true)
    } catch {}
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="px-6 py-16 text-center" style={{ backgroundColor: themeColors.sectionBg }}>
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
    <div className="px-6 py-12" style={{ backgroundColor: themeColors.sectionBg }}>
      <div className="text-center mb-8">
        <div style={{ fontFamily: fonts.display, fontSize: '10px', letterSpacing: '6px', color: themeColors.gray, marginBottom: '8px' }}>
          ATTENDANCE
        </div>
        <h3 style={{ fontFamily: fonts.display, fontSize: '20px', fontWeight: 300, letterSpacing: '4px', color: themeColors.primary }}>
          RSVP
        </h3>
      </div>

      <div className="space-y-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="성함"
          style={{ fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, outline: 'none', width: '100%', color: themeColors.text }}
        />

        <div className="grid grid-cols-2 gap-2">
          {([{ value: 'groom' as const, label: '신랑측' }, { value: 'bride' as const, label: '신부측' }]).map(opt => (
            <button
              key={opt.value}
              onClick={() => setSide(side === opt.value ? null : opt.value)}
              style={{
                fontFamily: fonts.display,
                fontSize: '11px',
                letterSpacing: '2px',
                padding: '12px',
                border: `0.5px solid ${side === opt.value ? themeColors.primary : themeColors.divider}`,
                background: side === opt.value ? themeColors.primary : themeColors.cardBg,
                color: side === opt.value ? '#FFFFFF' : themeColors.text,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['yes', 'no'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setAttendance(opt)}
              style={{
                fontFamily: fonts.display,
                fontSize: '11px',
                letterSpacing: '2px',
                padding: '12px',
                border: `0.5px solid ${attendance === opt ? themeColors.primary : themeColors.divider}`,
                background: attendance === opt ? themeColors.primary : themeColors.cardBg,
                color: attendance === opt ? '#FFFFFF' : themeColors.text,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {opt === 'yes' ? 'ATTENDING' : 'REGRET'}
            </button>
          ))}
        </div>

        {attendance === 'yes' && invitation.rsvpAllowGuestCount && (
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: fonts.body, fontSize: '13px', color: themeColors.gray }}>참석 인원</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                style={{ width: '32px', height: '32px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, cursor: 'pointer', fontSize: '16px', color: themeColors.text }}
              >
                -
              </button>
              <span style={{ fontFamily: fonts.display, fontSize: '14px', width: '32px', textAlign: 'center', color: themeColors.text }}>{guestCount}</span>
              <button
                onClick={() => setGuestCount(guestCount + 1)}
                style={{ width: '32px', height: '32px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, cursor: 'pointer', fontSize: '16px', color: themeColors.text }}
              >
                +
              </button>
            </div>
          </div>
        )}

        <textarea
          value={rsvpMessage}
          onChange={e => setRsvpMessage(e.target.value)}
          placeholder="전하고 싶은 말 (선택)"
          rows={2}
          style={{ fontFamily: fonts.body, fontSize: '13px', padding: '10px 12px', border: `0.5px solid ${themeColors.divider}`, background: themeColors.cardBg, outline: 'none', width: '100%', resize: 'none', color: themeColors.text }}
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
          SUBMIT
        </button>
      </div>
    </div>
  )
}

// ===== Footer =====
function MagazineFooter({ invitation, fonts, themeColors }: { invitation: any; fonts: FontConfig; themeColors: ColorConfig }) {
  return (
    <div className="px-6 py-8 text-center" style={{ backgroundColor: themeColors.background, borderTop: `0.5px solid ${themeColors.divider}` }}>
      <div style={{ fontFamily: fonts.display, fontSize: '11px', letterSpacing: '3px', color: themeColors.divider }}>
        {invitation.groom?.name || ''} & {invitation.bride?.name || ''}
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
          onClick={e => { e.stopPropagation(); setCurrentIndex((currentIndex + 1) % resolvedImages.length) }}
        />
      )}
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
    wedding: content.wedding || {},
    relationship: content.relationship || {},
    content: content.content || {},
    gallery: content.gallery || {},
    media: content.media || {},
    rsvpEnabled: content.rsvpEnabled ?? true,
    rsvpDeadline: content.rsvpDeadline || '',
    rsvpAllowGuestCount: content.rsvpAllowGuestCount ?? true,
    sectionVisibility: content.sectionVisibility || {},
    design: content.design || {},
    bgm: content.bgm || {},
    guidance: content.guidance || {},
    intro: content.intro,
    youtube: content.youtube,
    accentTextColor: (content as any).colors?.accent,
    bodyTextColor: (content as any).colors?.text,
    deceasedDisplayStyle: content.deceasedDisplayStyle || 'flower',
  }
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

  // skipIntro prop 변경 시 페이지 전환 (에디터 미리보기용)
  useEffect(() => {
    setCurrentPage(skipIntro ? 'main' : 'cover')
  }, [skipIntro])

  const themeColors = colorThemes[effectiveColorTheme]
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

                      <EditorsNote invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      <MeetTheCouple invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      <FeatureInterview invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      <PhotoSpread
                        invitation={invitation}
                        fonts={fonts}
                        themeColors={themeColors}
                        onOpenLightbox={(idx) => { setLightboxIndex(idx); setLightboxOpen(true) }}
                      />
                      <YouTubeSection invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      <TheDetails invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      <GuidanceInfoSection invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      <ThankYouSection invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      {(invitation as any).magazineLayout?.bankAccountsInMain !== false && (
                        <ContactsSection invitation={invitation} fonts={fonts} themeColors={themeColors} />
                      )}
                      <GuestbookSection invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} themeColors={themeColors} isSample={isSample} />
                      {(invitation as any).magazineLayout?.rsvpInMain !== false && (
                        <RsvpSection invitation={invitation} invitationId={dbInvitation.id} fonts={fonts} themeColors={themeColors} />
                      )}
                      <MagazineFooter invitation={invitation} fonts={fonts} themeColors={themeColors} />
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
              {currentPage === 'main' && (
                <GuestFloatingButton
                  themeColors={themeColors}
                  fonts={fonts}
                  openModal="none"
                  onModalClose={() => {}}
                  showTooltip={false}
                  scrollContainerRef={scrollContainerRef}
                  invitation={{
                    venue_name: invitation.wedding?.venue?.name || '',
                    venue_address: invitation.wedding?.venue?.address || '',
                    contacts,
                    accounts,
                    directions: invitation.wedding?.directions,
                    rsvpEnabled: invitation.rsvpEnabled,
                    rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
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
              <MusicToggle audioRef={audioRef} isVisible={currentPage === 'main'} shouldAutoPlay={currentPage === 'main' && invitation.bgm?.autoplay === true} />
              <GalleryLightbox
                images={invitation.gallery?.images || []}
                isOpen={lightboxOpen}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
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
