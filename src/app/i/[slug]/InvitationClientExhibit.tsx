'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'

// ============================================================
// Types
// ============================================================
interface GuestInfo {
  id: string
  name: string
  relation: string | null
  honorific: string | null
  introGreeting: string | null
  customMessage: string | null
}

interface Room {
  title: string
  subtitle: string
  images: string[]
  imageSettings?: { scale: number; positionX: number; positionY: number }[]
  galleryPreviewCount?: number
}

interface GuestbookMessage {
  id: string
  guest_name: string
  message: string
  question?: string | null
  created_at: string
}

interface InvitationClientProps {
  invitation: any
  content: any
  isPaid: boolean
  isPreview?: boolean
  overrideColorTheme?: string
  overrideFontStyle?: string
  skipIntro?: boolean
  guestInfo?: GuestInfo | null
  isSample?: boolean
}

// ============================================================
// Helper
// ============================================================
function extractImageUrl(img: unknown): string {
  if (!img) return ''
  if (typeof img === 'string') return img
  if (typeof img === 'object' && img !== null && 'url' in img) return (img as { url: string }).url || ''
  return ''
}

function getAvatarCropStyle(settings: { scale?: number; positionX?: number; positionY?: number } | null | undefined): React.CSSProperties | undefined {
  if (!settings) return undefined
  return { transform: `scale(${settings.scale || 1}) translate(${settings.positionX || 0}%, ${settings.positionY || 0}%)` }
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return `${Math.floor(diff / 604800)}주 전`
}

// ============================================================
// Global Styles — Instagram Theme
// ============================================================
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600&display=swap');

  /* Story progress bar animation */
  @keyframes storyProgress {
    from { width: 0%; }
    to { width: 100%; }
  }

  /* Rainbow border rotation */
  @keyframes rainbowRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Heart beat */
  @keyframes heartBeat {
    0%, 100% { transform: scale(1); }
    15% { transform: scale(1.25); }
    30% { transform: scale(1); }
    45% { transform: scale(1.15); }
    60% { transform: scale(1); }
  }

  /* Fade in row */
  @keyframes fadeInRow {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Slide up */
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Chevron bounce */
  @keyframes chevronBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
  }

  /* Equalizer animation (BGM button) */
  @keyframes eq-bar1 { 0%, 100% { height: 30%; } 50% { height: 100%; } }
  @keyframes eq-bar2 { 0%, 100% { height: 60%; } 30% { height: 20%; } 70% { height: 90%; } }
  @keyframes eq-bar3 { 0%, 100% { height: 80%; } 40% { height: 30%; } 80% { height: 70%; } }
  @keyframes eq-bar4 { 0%, 100% { height: 50%; } 60% { height: 100%; } 20% { height: 20%; } }

  /* Smooth scrollbar hide */
  .ig-scroll::-webkit-scrollbar { display: none; }
  .ig-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  /* Rainbow gradient border for profile/highlights */
  .ig-rainbow-border {
    background: conic-gradient(from 0deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #833ab4, #5851db, #405de6, #f09433);
    padding: 2.5px;
    border-radius: 50%;
  }

  .ig-rainbow-border-highlight {
    background: conic-gradient(from 0deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #833ab4, #5851db, #405de6, #f09433);
    padding: 2px;
    border-radius: 50%;
  }


`

// ============================================================
// Hooks
// ============================================================
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isRevealed }
}

// ============================================================
// Sub-components
// ============================================================

// === 1. Instagram Header (상단 고정 바) ===
function InstagramHeader({
  showHeader,
}: {
  showHeader: boolean
}) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        opacity: showHeader ? 1 : 0,
        pointerEvents: showHeader ? 'auto' : 'none',
        transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <div className="max-w-[430px] mx-auto">
        <div
          className="flex items-center justify-between px-4"
          style={{ height: 44, background: '#FFFFFF', borderBottom: '1px solid #DBDBDB' }}
        >
          {/* Left: camera icon (decorative) */}
          <div className="w-8 h-8 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="18" cy="7" r="1" fill="#262626" />
            </svg>
          </div>

          {/* Center: Logo */}
          <span
            className="text-[22px]"
            style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600, color: '#262626' }}
          >
            dear drawer
          </span>

          {/* Right: placeholder */}
          <div className="w-8 h-8" />
        </div>
      </div>
    </div>
  )
}

// === 1-1. Inline BGM Equalizer (커버 인트로 우상단, 스크롤 시 사라짐) ===
function InlineBgmEqualizer({
  audioRef,
  bgmEnabled,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  bgmEnabled: boolean
}) {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [audioRef])

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation() // CoverSection tap 이벤트 방지
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => { setIsPlaying(true); localStorage.setItem('musicEnabled', 'true') })
        .catch(console.error)
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
      localStorage.setItem('musicEnabled', 'false')
    }
  }

  if (!bgmEnabled) return null

  return (
    <button
      onClick={toggleMusic}
      className="absolute top-8 right-3 z-20 flex flex-col items-center gap-[3px]"
      aria-label={isPlaying ? '음악 끄기' : '음악 켜기'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 14 }}>
        {[
          { delay: '0s', anim: 'eq-bar1' },
          { delay: '0.15s', anim: 'eq-bar2' },
          { delay: '0.08s', anim: 'eq-bar3' },
          { delay: '0.22s', anim: 'eq-bar4' },
        ].map((bar, i) => (
          <div
            key={i}
            style={{
              width: 2,
              borderRadius: 1,
              background: isPlaying ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
              animation: isPlaying ? `${bar.anim} 0.8s ease-in-out ${bar.delay} infinite` : 'none',
              height: isPlaying ? undefined : 3,
              transition: 'background 0.3s, height 0.3s',
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: '0.5px',
          color: isPlaying ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
          transition: 'color 0.3s',
          textTransform: 'uppercase',
        }}
      >
        {isPlaying ? 'on' : 'off'}
      </span>
    </button>
  )
}

// === 2. Cover Section (Instagram Story Style — tap to navigate) ===
function CoverSection({ content, invitation, displayId, audioRef, bgmEnabled }: { content: any; invitation: any; displayId: string; audioRef: React.RefObject<HTMLAudioElement | null>; bgmEnabled: boolean }) {
  const coverImage = extractImageUrl(content?.media?.coverImage) || '/sample/cover.png'
  const miniAvatarImage = extractImageUrl(content?.media?.profileAvatar) || coverImage
  const miniAvatarSettings = content?.media?.profileAvatarSettings || null
  const groomName = content?.groom?.name || invitation?.groom_name || ''
  const brideName = content?.bride?.name || invitation?.bride_name || ''
  const date = content?.wedding?.date || invitation?.wedding_date || ''

  // Collect story images: coverImages array (if exists) OR cover + room first images
  const storyImages = useMemo(() => {
    // Use coverImages array if available (editor stores up to 4)
    const coverImages = content?.media?.coverImages
    if (coverImages && Array.isArray(coverImages) && coverImages.length > 0) {
      const imgs = coverImages.map((img: string) => extractImageUrl(img)).filter(Boolean)
      if (imgs.length > 0) return imgs.slice(0, 5)
    }

    // Fallback: cover + first image from each room
    const images: string[] = [coverImage]
    const rooms = content?.rooms || []
    for (const room of rooms) {
      if (room.images && room.images.length > 0) {
        const img = extractImageUrl(room.images[0])
        if (img && img !== coverImage) images.push(img)
      }
      if (images.length >= 5) break
    }
    // If no rooms, add story images
    if (images.length === 1) {
      const stories = content?.content?.stories || []
      for (const story of stories) {
        const img = extractImageUrl(story.image)
        if (img && img !== coverImage) images.push(img)
        if (images.length >= 5) break
      }
    }
    return images
  }, [content, coverImage])

  const STORY_DURATION = 5000 // 5 seconds per image
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(Date.now())
  const pausedProgressRef = useRef(0)

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    startTimeRef.current = Date.now() - (pausedProgressRef.current * STORY_DURATION)

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const pct = Math.min(elapsed / STORY_DURATION, 1)
      setProgress(pct)

      if (pct >= 1) {
        // Move to next story
        setCurrentIndex((prev) => {
          if (prev < storyImages.length - 1) return prev + 1
          return prev // Stay on last image
        })
        startTimeRef.current = Date.now()
        pausedProgressRef.current = 0
        setProgress(0)
      }
    }, 30)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, isPaused, storyImages.length])

  // Reset progress on index change
  useEffect(() => {
    startTimeRef.current = Date.now()
    pausedProgressRef.current = 0
    setProgress(0)
  }, [currentIndex])

  // Tap handler: left third = prev, right two-thirds = next
  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const third = rect.width / 3

    if (x < third) {
      // Tap left — go previous
      setCurrentIndex((prev) => Math.max(0, prev - 1))
    } else {
      // Tap right — go next
      setCurrentIndex((prev) => Math.min(storyImages.length - 1, prev + 1))
    }
  }, [storyImages.length])

  // Long press to pause (touch)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      pausedProgressRef.current = progress
      setIsPaused(true)
    }, 200)
  }, [progress])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (isPaused) {
      setIsPaused(false)
    }
  }, [isPaused])

  const formattedDate = useMemo(() => {
    if (!date) return ''
    const d = new Date(date)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}. ${m}. ${day}`
  }, [date])

  const currentImage = storyImages[currentIndex] || coverImage

  return (
    <div
      className="relative w-full select-none"
      style={{ height: '100vh', minHeight: 600 }}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Story progress bars */}
      <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
        {storyImages.map((_, i) => (
          <div key={i} className="flex-1 h-[2px] rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white/90 rounded-full transition-none"
              style={{
                width: i < currentIndex
                  ? '100%'
                  : i === currentIndex
                  ? `${progress * 100}%`
                  : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Top left: mini profile */}
      <div className="absolute top-8 left-3 z-20 flex items-center gap-2">
        <div className="ig-rainbow-border">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white">
            <img src={miniAvatarImage} alt="" className="w-full h-full object-cover" style={getAvatarCropStyle(miniAvatarSettings)} />
          </div>
        </div>
        <span className="text-[13px] text-white font-medium" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          {displayId}
        </span>
      </div>

      {/* BGM equalizer — top right, 인트로에만 표시 */}
      <InlineBgmEqualizer audioRef={audioRef} bgmEnabled={bgmEnabled} />

      {/* Story photos — crossfade */}
      <div className="absolute inset-0">
        {storyImages.map((img, i) => (
          <img
            key={i}
            src={img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: i === currentIndex ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Paused indicator */}
      {isPaused && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white" fillOpacity="0.6">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </div>
      )}

      {/* Bottom overlay text */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-16">
        <h1
          className="text-[26px] font-light text-white tracking-wide mb-2"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" }}
        >
          {groomName} & {brideName}
        </h1>
        <p className="text-[13px] text-white/70 tracking-wider">{formattedDate}</p>
      </div>

      {/* Swipe down hint — only on last story */}
      {currentIndex === storyImages.length - 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <svg
            width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"
            style={{ opacity: 0.6, animation: 'chevronBounce 1.5s ease-in-out infinite' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
    </div>
  )
}

// === 3. Profile Section (Instagram Profile) ===
function ProfileSection({
  content,
  invitation,
  allImagesCount,
  onRsvpClick,
  onGuestbookScroll,
  onContactClick,
  displayId,
}: {
  content: any
  invitation: any
  allImagesCount: number
  onRsvpClick: () => void
  onGuestbookScroll: () => void
  onContactClick: () => void
  displayId: string
}) {
  const { ref, isRevealed } = useScrollReveal(0.1)
  const coverImage = extractImageUrl(content?.media?.coverImage) || '/sample/cover.png'
  const avatarImage = extractImageUrl(content?.media?.profileAvatar) || coverImage
  const avatarSettings = content?.media?.profileAvatarSettings || null
  const groomName = content?.groom?.name || invitation?.groom_name || ''
  const brideName = content?.bride?.name || invitation?.bride_name || ''
  const greeting = content?.content?.greeting || invitation?.greeting_message || ''
  const date = content?.wedding?.date || invitation?.wedding_date || ''
  const time = content?.wedding?.timeDisplay || invitation?.wedding_time || ''
  const venueName = content?.wedding?.venue?.name || invitation?.venue_name || ''
  const venueHall = content?.wedding?.venue?.hall || ''

  const dDay = useMemo(() => {
    if (!date) return ''
    const target = new Date(date)
    const now = new Date()
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'D-Day'
    if (diff > 0) return `D-${diff}`
    return `D+${Math.abs(diff)}`
  }, [date])

  const formattedDate = useMemo(() => {
    if (!date) return ''
    const d = new Date(date)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
    return `${y}. ${m}. ${day} ${dayOfWeek}요일`
  }, [date])

  return (
    <div
      ref={ref}
      className="px-4 pt-4 pb-2"
      style={{
        background: '#FFFFFF',
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s ease-out',
      }}
    >
      {/* Top row: profile pic + stats */}
      <div className="flex items-center gap-6 mb-4">
        {/* Profile pic */}
        <div className="ig-rainbow-border flex-shrink-0">
          <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-white p-[2px]">
            <img src={avatarImage} alt="" className="w-full h-full rounded-full object-cover" style={getAvatarCropStyle(avatarSettings)} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 flex justify-around">
          <div className="text-center">
            <p className="text-[16px] font-semibold" style={{ color: '#262626' }}>{allImagesCount}</p>
            <p className="text-[13px]" style={{ color: '#8E8E8E' }}>게시물</p>
          </div>
          <div className="text-center">
            <p className="text-[16px] font-semibold" style={{ color: '#262626' }}>&#8734;</p>
            <p className="text-[13px]" style={{ color: '#8E8E8E' }}>팔로워</p>
          </div>
          <div className="text-center">
            <p className="text-[16px] font-semibold" style={{ color: '#262626' }}>{dDay}</p>
            <p className="text-[13px]" style={{ color: '#8E8E8E' }}>D-Day</p>
          </div>
        </div>
      </div>

      {/* Username */}
      <p className="text-[14px] font-semibold mb-1" style={{ color: '#262626' }}>
        @{displayId}
      </p>

      {/* Bio */}
      <div className="mb-3">
        <p className="text-[13px] leading-[1.5] mb-1" style={{ color: '#262626' }}>
          결혼합니다 💍
        </p>
        <p className="text-[13px] leading-[1.5]" style={{ color: '#262626' }}>
          {formattedDate} {time}
        </p>
        <p className="text-[13px] leading-[1.5]" style={{ color: '#262626' }}>
          {venueName}{venueHall ? ` ${venueHall}` : ''}
        </p>
      </div>

      {/* Greeting text (bio continuation) */}
      {greeting && (
        <p className="text-[13px] leading-[1.6] mb-3 whitespace-pre-line" style={{ color: '#262626' }}>
          {greeting}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 mb-2">
        <button
          onClick={onRsvpClick}
          className="flex-1 py-[7px] rounded-lg text-[13px] font-semibold text-white"
          style={{ background: '#0095F6' }}
        >
          참석 의사 전달하기
        </button>
        <button
          onClick={onGuestbookScroll}
          className="flex-1 py-[7px] rounded-lg text-[13px] font-semibold"
          style={{ background: '#EFEFEF', color: '#262626' }}
        >
          축하 메시지
        </button>
        <button
          onClick={onContactClick}
          className="py-[7px] px-3 rounded-lg"
          style={{ background: '#EFEFEF' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// === 4. Story Highlights (탭 방식 — 선택하면 해당 Room만 표시) ===
function StoryHighlights({
  rooms,
  activeRoom,
  onHighlightClick,
}: {
  rooms: Room[]
  activeRoom: number // -1 = all
  onHighlightClick: (index: number) => void
}) {
  if (rooms.length === 0) return null

  return (
    <div className="py-3 border-b" style={{ borderColor: '#DBDBDB', background: '#FFFFFF' }}>
      <div className="flex gap-4 px-4 overflow-x-auto ig-scroll">
        {/* All highlight */}
        <button
          className="flex flex-col items-center gap-1 flex-shrink-0"
          onClick={() => onHighlightClick(-1)}
        >
          <div style={{ padding: 2, borderRadius: '50%', background: activeRoom === -1 ? 'conic-gradient(from 0deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #833ab4, #5851db, #405de6, #f09433)' : '#DBDBDB' }}>
            <div className="w-[64px] h-[64px] rounded-full overflow-hidden bg-white p-[2px] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={activeRoom === -1 ? '#262626' : '#8E8E8E'} strokeWidth="1.5">
                <rect x="1" y="1" width="6.5" height="6.5" rx="0.5" />
                <rect x="8.75" y="1" width="6.5" height="6.5" rx="0.5" />
                <rect x="16.5" y="1" width="6.5" height="6.5" rx="0.5" />
                <rect x="1" y="8.75" width="6.5" height="6.5" rx="0.5" />
                <rect x="8.75" y="8.75" width="6.5" height="6.5" rx="0.5" />
                <rect x="16.5" y="8.75" width="6.5" height="6.5" rx="0.5" />
                <rect x="1" y="16.5" width="6.5" height="6.5" rx="0.5" />
                <rect x="8.75" y="16.5" width="6.5" height="6.5" rx="0.5" />
                <rect x="16.5" y="16.5" width="6.5" height="6.5" rx="0.5" />
              </svg>
            </div>
          </div>
          <span className="text-[11px]" style={{ color: activeRoom === -1 ? '#262626' : '#8E8E8E', fontWeight: activeRoom === -1 ? 600 : 400 }}>
            All
          </span>
        </button>

        {rooms.map((room, i) => {
          const firstImage = extractImageUrl(room.images[0])
          const isActive = activeRoom === i
          return (
            <button
              key={i}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              onClick={() => onHighlightClick(i)}
            >
              <div style={{ padding: 2, borderRadius: '50%', background: isActive ? 'conic-gradient(from 0deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #833ab4, #5851db, #405de6, #f09433)' : '#DBDBDB' }}>
                <div className="w-[64px] h-[64px] rounded-full overflow-hidden bg-white p-[2px]">
                  <img
                    src={firstImage || '/sample/cover.png'}
                    alt={room.title}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[11px] max-w-[64px] truncate" style={{ color: isActive ? '#262626' : '#8E8E8E', fontWeight: isActive ? 600 : 400 }}>
                {room.title}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// === 5. Tab Bar (게시물/사람/러브스토리) ===
type ContentTab = 'grid' | 'people' | 'story'

function TabBar({ activeTab, onTabChange }: { activeTab: ContentTab; onTabChange: (tab: ContentTab) => void }) {
  const tabs: { id: ContentTab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: 'grid',
      label: '갤러리',
      icon: (active) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#262626' : 'none'} stroke={active ? 'none' : '#8E8E8E'} strokeWidth="1.5">
          <rect x="1" y="1" width="6.5" height="6.5" rx="0.5" />
          <rect x="8.75" y="1" width="6.5" height="6.5" rx="0.5" />
          <rect x="16.5" y="1" width="6.5" height="6.5" rx="0.5" />
          <rect x="1" y="8.75" width="6.5" height="6.5" rx="0.5" />
          <rect x="8.75" y="8.75" width="6.5" height="6.5" rx="0.5" />
          <rect x="16.5" y="8.75" width="6.5" height="6.5" rx="0.5" />
          <rect x="1" y="16.5" width="6.5" height="6.5" rx="0.5" />
          <rect x="8.75" y="16.5" width="6.5" height="6.5" rx="0.5" />
          <rect x="16.5" y="16.5" width="6.5" height="6.5" rx="0.5" />
        </svg>
      ),
    },
    {
      id: 'people',
      label: '소개',
      icon: (active) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#262626' : '#8E8E8E'} strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'story',
      label: '러브스토리',
      icon: (active) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#262626' : '#8E8E8E'} strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="sticky top-0 z-30 border-b flex" style={{ borderColor: '#DBDBDB', background: '#FFFFFF' }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            className="flex-1 py-2.5 flex flex-col items-center gap-1"
            style={{ borderBottom: isActive ? '1px solid #262626' : '1px solid transparent' }}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon(isActive)}
            <span className="text-[10px]" style={{ color: isActive ? '#262626' : '#8E8E8E' }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// === 5-1. People Tab (신랑/신부 소개) ===
function ProfileCarousel({ images, imageSettings }: { images: string[]; imageSettings?: any }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const touchStartX = useRef(0)

  const getImageCropStyle = (img: string, s: any) => {
    if (!s) return { backgroundImage: `url(${img})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)
    if (hasCropData) {
      const cw = s.cropWidth || 1
      const ch = s.cropHeight || 1
      const cx = s.cropX || 0
      const cy = s.cropY || 0
      const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
      const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
      return { backgroundImage: `url(${img})`, backgroundSize: `${100 / cw}% ${100 / ch}%`, backgroundPosition: `${posX}% ${posY}%`, backgroundRepeat: 'no-repeat' as const }
    }
    return { backgroundImage: `url(${img})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const, transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)` }
  }

  if (images.length <= 1) {
    return (
      <div className="w-full overflow-hidden" style={{ aspectRatio: '4/5', background: '#FAFAFA', ...getImageCropStyle(images[0], imageSettings) }} />
    )
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: '4/5', background: '#FAFAFA' }}>
      <div
        className="w-full h-full overflow-hidden"
        style={getImageCropStyle(images[currentIdx], imageSettings)}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX
          if (Math.abs(diff) > 40) {
            if (diff > 0 && currentIdx < images.length - 1) setCurrentIdx(currentIdx + 1)
            if (diff < 0 && currentIdx > 0) setCurrentIdx(currentIdx - 1)
          }
        }}
      />
      {/* Dot indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
        {images.map((_, idx) => (
          <div
            key={idx}
            className="rounded-full transition-all"
            style={{
              width: idx === currentIdx ? 6 : 5,
              height: idx === currentIdx ? 6 : 5,
              background: idx === currentIdx ? '#0095F6' : 'rgba(255,255,255,0.6)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function PeopleTab({ content, profileImage, username }: { content: any; profileImage: string; username: string }) {
  const groom = content?.groom
  const bride = content?.bride
  const groomImages = (groom?.profile?.images || []).filter(Boolean)
  const brideImages = (bride?.profile?.images || []).filter(Boolean)
  const groomMainImage = extractImageUrl(groomImages[0]) || extractImageUrl(groom?.profile?.image) || extractImageUrl(content?.media?.groomImage) || profileImage
  const brideMainImage = extractImageUrl(brideImages[0]) || extractImageUrl(bride?.profile?.image) || extractImageUrl(content?.media?.brideImage) || profileImage
  const groomAllImages = groomImages.length > 0 ? groomImages.map(extractImageUrl).filter(Boolean) : [groomMainImage]
  const brideAllImages = brideImages.length > 0 ? brideImages.map(extractImageUrl).filter(Boolean) : [brideMainImage]

  // 이름에서 성 제거 (2글자면 그대로, 3글자 이상이면 첫 글자 제거)
  const getFirstName = (fullName: string) => {
    if (!fullName) return ''
    return fullName.length >= 3 ? fullName.slice(1) : fullName
  }

  const groomFirstName = getFirstName(groom?.name || '')
  const brideFirstName = getFirstName(bride?.name || '')

  // 이미지 크롭 스타일 계산 (for header avatar)
  const getImageCropStyle = (img: string, s: any) => {
    if (!s) return { backgroundImage: `url(${img})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)
    if (hasCropData) {
      const cw = s.cropWidth || 1
      const ch = s.cropHeight || 1
      const cx = s.cropX || 0
      const cy = s.cropY || 0
      const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
      const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
      return { backgroundImage: `url(${img})`, backgroundSize: `${100 / cw}% ${100 / ch}%`, backgroundPosition: `${posX}% ${posY}%`, backgroundRepeat: 'no-repeat' as const }
    }
    return { backgroundImage: `url(${img})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const, transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)` }
  }

  const people = [
    {
      name: groom?.name || '',
      firstName: groomFirstName,
      introducedBy: brideFirstName,
      role: '신랑',
      images: groomAllImages,
      image: groomMainImage,
      imageSettings: groom?.profile?.imageSettings,
      intro: groom?.profile?.intro || groom?.profile?.bio || '',
      subtitle: groom?.profile?.subtitle || '',
      color: '#0095F6',
    },
    {
      name: bride?.name || '',
      firstName: brideFirstName,
      introducedBy: groomFirstName,
      role: '신부',
      images: brideAllImages,
      image: brideMainImage,
      imageSettings: bride?.profile?.imageSettings,
      intro: bride?.profile?.intro || bride?.profile?.bio || '',
      subtitle: bride?.profile?.subtitle || '',
      color: '#E91E63',
    },
  ]

  return (
    <div style={{ background: '#FFFFFF' }}>
      {people.map((person, i) => (
        <div key={i} className="border-b" style={{ borderColor: '#EFEFEF' }}>
          {/* Post header */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={getImageCropStyle(person.image, person.imageSettings)} />

            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold" style={{ color: '#262626' }}>{person.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: person.color === '#0095F6' ? '#E8F4FD' : '#FFF0F5', color: person.color }}>
                {person.role}
              </span>
            </div>
          </div>

          {/* Portrait photo(s) */}
          <ProfileCarousel images={person.images} imageSettings={person.imageSettings} />

          {/* Caption */}
          <div className="px-3 py-3">
            <div className="flex items-center gap-4 mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-[13px] leading-[1.7] whitespace-pre-line" style={{ color: '#262626' }}>
              <span className="font-semibold">{person.subtitle || (person.role === '신랑' ? '신부가 소개하는 신랑 🤵' : '신랑이 소개하는 신부 👰')}</span>{' '}
              {person.intro || (person.role === '신랑'
                ? '처음 만났을 때부터 따뜻한 미소가 인상적이었던 사람. 항상 제 이야기에 귀 기울여주고, 힘들 때 묵묵히 곁에 있어주는 든든한 사람입니다.'
                : '밝은 웃음소리가 참 예쁜 사람. 제가 지칠 때마다 힘이 되어주고, 작은 것에도 감사할 줄 아는 따뜻한 마음의 소유자입니다.')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// === 5-2. Love Story Tab (러브스토리) ===
function LoveStoryTab({ content, profileImage, username }: { content: any; profileImage: string; username: string }) {
  const avatarSettings = content?.media?.profileAvatarSettings || null
  const stories = content?.content?.stories || []

  return (
    <div style={{ background: '#FFFFFF' }}>
      {stories.length > 0 ? (
        stories.map((story: any, i: number) => (
          <InstagramPost
            key={i}
            username={username}
            profileImage={profileImage}
            profileImageSettings={avatarSettings}
            caption={
              <div className="pb-3">
                <p className="text-[13px] leading-[1.7] whitespace-pre-line" style={{ color: '#262626' }}>
                  <span className="font-semibold">{username}</span>{' '}
                  {story.caption || story.content || ''}
                </p>
              </div>
            }
          >
            {story.image ? (
              <div
                className="w-full overflow-hidden"
                style={{
                  aspectRatio: '4/5',
                  background: '#FAFAFA',
                  ...(() => {
                    const s = story.imageSettings
                    if (!s) return { backgroundImage: `url(${story.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    const hasCrop = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)
                    if (hasCrop) {
                      const cw = s.cropWidth || 1, ch = s.cropHeight || 1, cx = s.cropX || 0, cy = s.cropY || 0
                      return { backgroundImage: `url(${story.image})`, backgroundSize: `${100/cw}% ${100/ch}%`, backgroundPosition: `${cw>=1?0:(cx/(1-cw))*100}% ${ch>=1?0:(cy/(1-ch))*100}%`, backgroundRepeat: 'no-repeat' }
                    }
                    return { backgroundImage: `url(${story.image})`, backgroundSize: 'cover', backgroundPosition: 'center', transform: `scale(${s.scale||1}) translate(${s.positionX||0}%,${s.positionY||0}%)` }
                  })(),
                }}
              />
            ) : (
              <div
                className="w-full flex items-center justify-center"
                style={{ aspectRatio: '4/5', background: '#FAFAFA' }}
              >
                <p className="text-[14px]" style={{ color: '#8E8E8E' }}>No photo</p>
              </div>
            )}
          </InstagramPost>
        ))
      ) : (
        <div className="py-16 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DBDBDB" strokeWidth="1" className="mx-auto mb-4">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <p className="text-[14px] font-medium mb-1" style={{ color: '#262626' }}>Our Love Story</p>
          <p className="text-[13px]" style={{ color: '#8E8E8E' }}>아직 러브스토리가 작성되지 않았습니다.</p>
        </div>
      )}
    </div>
  )
}

// === 6. Photo Grid (3열 세로 사진 그리드, 탭 필터링) ===
function PhotoGrid({
  rooms,
  activeRoom,
  onPhotoClick,
  onHighlightClick,
  galleryPreviewCount = 3,
}: {
  rooms: Room[]
  activeRoom: number // -1 = all
  onPhotoClick: (roomIndex: number, localIdx: number) => void
  onHighlightClick: (index: number) => void
  galleryPreviewCount?: number
}) {
  // Filter rooms based on active tab
  const visibleRooms = activeRoom === -1 ? rooms : [rooms[activeRoom]].filter(Boolean)
  const visibleRoomIndices = activeRoom === -1 ? rooms.map((_, i) => i) : [activeRoom]

  return (
    <div style={{ background: '#FFFFFF' }}>
      {visibleRooms.map((room, vi) => {
        const roomIdx = visibleRoomIndices[vi]
        const allImages = room.images.map(extractImageUrl).filter(Boolean)
        if (allImages.length === 0) return null

        // In "All" mode, limit images per room (per-room or global galleryPreviewCount)
        const isAllMode = activeRoom === -1
        const maxInAll = room.galleryPreviewCount || galleryPreviewCount
        const images = isAllMode ? allImages.slice(0, maxInAll) : allImages
        const hasMore = isAllMode && allImages.length > maxInAll

        // Build rows of 3
        const rows: string[][] = []
        for (let i = 0; i < images.length; i += 3) {
          rows.push(images.slice(i, i + 3))
        }

        return (
          <div key={roomIdx}>
            {/* Room header — only show in "All" mode */}
            {isAllMode && (
              <div className="flex items-center px-4 py-2" style={{ background: '#FAFAFA' }}>
                <div className="flex-1 h-[0.5px]" style={{ background: '#DBDBDB' }} />
                <span className="px-3 text-[11px] font-medium tracking-wider" style={{ color: '#8E8E8E' }}>
                  {room.title}
                </span>
                <div className="flex-1 h-[0.5px]" style={{ background: '#DBDBDB' }} />
              </div>
            )}

            {/* 3-col grid, portrait aspect */}
            <PhotoGridRows rows={rows} roomIdx={roomIdx} onPhotoClick={onPhotoClick} key={`grid-${roomIdx}-${activeRoom}`} />

            {/* "사진 더보기" button — only in All mode when room has more images */}
            {hasMore && (
              <button
                onClick={() => onHighlightClick(roomIdx)}
                className="w-full py-3 text-center text-[12px] font-medium flex items-center justify-center gap-1"
                style={{ color: '#0095F6', background: '#FAFAFA', borderBottom: '1px solid #EFEFEF' }}
              >
                사진 더보기 ({allImages.length - maxInAll}+)
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0095F6" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PhotoGridRows({
  rows,
  roomIdx,
  onPhotoClick,
}: {
  rows: string[][]
  roomIdx: number
  onPhotoClick: (roomIndex: number, localIdx: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Reset revealed rows when content changes
    setRevealedRows(new Set())
    const el = containerRef.current
    if (!el) return
    // Small delay for DOM to update
    const timer = setTimeout(() => {
      const rowEls = el.querySelectorAll('[data-row-idx]')
      const observers: IntersectionObserver[] = []
      rowEls.forEach((rowEl) => {
        const idx = Number(rowEl.getAttribute('data-row-idx'))
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setRevealedRows(prev => new Set(prev).add(idx))
              obs.disconnect()
            }
          },
          { threshold: 0.1 }
        )
        obs.observe(rowEl)
        observers.push(obs)
      })
      return () => observers.forEach(obs => obs.disconnect())
    }, 50)
    return () => clearTimeout(timer)
  }, [rows.length, roomIdx])

  return (
    <div ref={containerRef} className="grid gap-[1px]" style={{ background: '#FFFFFF' }}>
      {rows.map((row, rowIdx) => {
        const baseIdx = rowIdx * 3
        const isVisible = revealedRows.has(rowIdx)
        return (
          <div
            key={rowIdx}
            data-row-idx={rowIdx}
            className="grid grid-cols-3 gap-[1px]"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
              transition: `all 0.4s ease-out ${rowIdx * 0.08}s`,
            }}
          >
            {row.map((img, colIdx) => (
              <button
                key={colIdx}
                className="relative overflow-hidden"
                style={{ background: '#FAFAFA', aspectRatio: '3/4' }}
                onClick={() => onPhotoClick(roomIdx, baseIdx + colIdx)}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            {/* Fill empty cells */}
            {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: '3/4', background: '#FAFAFA' }} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// === 7. Instagram Post Layout (재사용) ===
function InstagramPost({
  username,
  profileImage,
  profileImageSettings,
  children,
  likes,
  caption,
}: {
  username: string
  profileImage: string
  profileImageSettings?: { scale?: number; positionX?: number; positionY?: number } | null
  children: React.ReactNode
  likes?: number
  caption?: React.ReactNode
}) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="border-t" style={{ borderColor: '#DBDBDB', background: '#FFFFFF' }}>
      {/* Post header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <img src={profileImage} alt="" className="w-full h-full object-cover" style={getAvatarCropStyle(profileImageSettings)} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: '#262626' }}>{username}</span>
      </div>

      {/* Post content */}
      {children}

      {/* Action bar */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={() => setLiked(!liked)}>
              {liked ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#ED4956">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              )}
            </button>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </div>

        {likes !== undefined && (
          <p className="text-[13px] font-semibold mb-1" style={{ color: '#262626' }}>
            좋아요 {likes.toLocaleString()}개
          </p>
        )}

        {caption}
      </div>
    </div>
  )
}

// === 8. Wedding Info Post (미니 캘린더 + 장소 카드 캐러셀) ===
function WeddingInfoPost({
  content,
  invitation,
  profileImage,
  username,
}: {
  content: any
  invitation: any
  profileImage: string
  username: string
}) {
  const { ref, isRevealed } = useScrollReveal(0.1)
  const [infoSlide, setInfoSlide] = useState(0)
  const wedding = content?.wedding || {}
  const venue = wedding?.venue || {}
  const date = wedding?.date || invitation?.wedding_date || ''
  const time = wedding?.timeDisplay || wedding?.time || invitation?.wedding_time || ''
  const venueName = venue?.name || invitation?.venue_name || ''
  const venueHall = venue?.hall || ''
  const venueAddress = venue?.address || invitation?.venue_address || ''
  const directions = wedding?.directions || {}

  // Parse date
  const dateObj = useMemo(() => {
    if (!date) return null
    return new Date(date)
  }, [date])

  const formattedDate = useMemo(() => {
    if (!dateObj) return ''
    const y = dateObj.getFullYear()
    const m = dateObj.getMonth() + 1
    const day = dateObj.getDate()
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()]
    return `${y}년 ${m}월 ${day}일 ${dayOfWeek}요일`
  }, [dateObj])

  // Calendar grid data
  const calendarData = useMemo(() => {
    if (!dateObj) return null
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth()
    const targetDay = dateObj.getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return { year, month, monthName: monthNames[month], firstDay, daysInMonth, targetDay }
  }, [dateObj])

  const totalSlides = 2
  const hasDirections = !!(directions?.car || directions?.publicTransport || directions?.train || directions?.expressBus)
  const avatarSettings = content?.media?.profileAvatarSettings || null

  return (
    <div ref={ref} style={{ opacity: isRevealed ? 1 : 0, transition: 'opacity 0.6s ease-out' }}>
      <InstagramPost
        username={username}
        profileImage={profileImage}
        profileImageSettings={avatarSettings}
        likes={128}
        caption={
          <div className="pb-3">
            <p className="text-[13px] mb-3" style={{ color: '#262626' }}>
              <span className="font-semibold">{username}</span>{' '}
              우리의 특별한 날에 초대합니다 💌
            </p>

            {/* Compact info row */}
            <div className="flex items-center gap-2 text-[13px] mb-2" style={{ color: '#262626' }}>
              <span>📅 {formattedDate}</span>
              <span style={{ color: '#DBDBDB' }}>·</span>
              <span>🕐 {time}</span>
            </div>
            <p className="text-[13px] mb-1" style={{ color: '#262626' }}>
              📍 {venueName}{venueHall ? ` ${venueHall}` : ''}
            </p>
            {venueAddress && <p className="text-[11px] mb-3" style={{ color: '#8E8E8E' }}>{venueAddress}</p>}

            {/* Directions — always expanded */}
            {hasDirections && (
              <div className="mt-2">
                <p className="text-[12px] font-semibold mb-2" style={{ color: '#262626' }}>
                  오시는 길 안내
                </p>
                <div className="space-y-2 rounded-lg p-3" style={{ background: '#FAFAFA' }}>
                  {directions.car && (
                    <div className="flex gap-2">
                      <span className="text-[13px] flex-shrink-0">🚗</span>
                      <div>
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#262626' }}>자가용 / 주차</p>
                        <p className="text-[11px] leading-[1.6] whitespace-pre-line" style={{ color: '#8E8E8E' }}>{directions.car}</p>
                      </div>
                    </div>
                  )}
                  {directions.publicTransport && (
                    <div className="flex gap-2">
                      <span className="text-[13px] flex-shrink-0">🚌</span>
                      <div>
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#262626' }}>버스 / 지하철</p>
                        <p className="text-[11px] leading-[1.6] whitespace-pre-line" style={{ color: '#8E8E8E' }}>{directions.publicTransport}</p>
                      </div>
                    </div>
                  )}
                  {directions.train && (
                    <div className="flex gap-2">
                      <span className="text-[13px] flex-shrink-0">🚆</span>
                      <div>
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#262626' }}>기차 (KTX/SRT)</p>
                        <p className="text-[11px] leading-[1.6] whitespace-pre-line" style={{ color: '#8E8E8E' }}>{directions.train}</p>
                      </div>
                    </div>
                  )}
                  {directions.expressBus && (
                    <div className="flex gap-2">
                      <span className="text-[13px] flex-shrink-0">🚍</span>
                      <div>
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#262626' }}>고속버스</p>
                        <p className="text-[11px] leading-[1.6] whitespace-pre-line" style={{ color: '#8E8E8E' }}>{directions.expressBus}</p>
                      </div>
                    </div>
                  )}
                  {(directions as any)?.extraInfoEnabled && (directions as any)?.extraInfoText && (
                    <div className="flex gap-2">
                      <span className="text-[13px] flex-shrink-0">📌</span>
                      <div>
                        <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#262626' }}>{(directions as any)?.extraInfoTitle || '추가 안내사항'}</p>
                        <p className="text-[11px] leading-[1.6] whitespace-pre-line" style={{ color: '#8E8E8E' }}>{(directions as any)?.extraInfoText}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        }
      >
        {/* Carousel: Calendar + Venue Card */}
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(-${infoSlide * 100}%)` }}
            >
              {/* Slide 1: Mini Calendar */}
              <div className="w-full flex-shrink-0 aspect-square flex items-center justify-center" style={{ background: '#FAFAFA' }}>
                {calendarData && (
                  <div className="w-[280px] text-center">
                    {/* Month & Year */}
                    <p className="text-[11px] tracking-[0.3em] uppercase mb-1" style={{ color: '#8E8E8E' }}>
                      {calendarData.monthName}
                    </p>
                    <p className="text-[64px] font-extralight leading-none mb-1" style={{ color: '#262626' }}>
                      {calendarData.targetDay}
                    </p>
                    <p className="text-[13px] mb-6" style={{ color: '#8E8E8E' }}>
                      {['일', '월', '화', '수', '목', '금', '토'][dateObj!.getDay()]}요일 {time}
                    </p>

                    {/* Mini calendar grid */}
                    <div className="grid grid-cols-7 gap-y-1 text-[10px] mx-auto" style={{ maxWidth: 220 }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="py-1 font-medium" style={{ color: '#DBDBDB' }}>{d}</div>
                      ))}
                      {/* Empty cells before first day */}
                      {Array.from({ length: calendarData.firstDay }).map((_, i) => (
                        <div key={`e-${i}`} />
                      ))}
                      {/* Days */}
                      {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const isTarget = day === calendarData.targetDay
                        return (
                          <div
                            key={day}
                            className="py-1 rounded-full flex items-center justify-center mx-auto"
                            style={{
                              width: isTarget ? 26 : 'auto',
                              height: isTarget ? 26 : 'auto',
                              background: isTarget ? '#262626' : 'transparent',
                              color: isTarget ? '#FFFFFF' : '#8E8E8E',
                              fontWeight: isTarget ? 600 : 400,
                              fontSize: isTarget ? 11 : 10,
                            }}
                          >
                            {day}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Slide 2: Venue Card with Map Link */}
              <div className="w-full flex-shrink-0 aspect-square flex flex-col items-center justify-center" style={{ background: '#FAFAFA' }}>
                <div className="w-[300px] text-center">
                  {/* Location pin with gradient circle */}
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F4FD, #F3E8FF)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <p className="text-[18px] font-medium mb-0.5" style={{ color: '#262626' }}>{venueName}</p>
                  {venueHall && <p className="text-[13px] mb-1.5" style={{ color: '#8E8E8E' }}>{venueHall}</p>}
                  <div className="w-8 h-[0.5px] mx-auto my-3" style={{ background: '#DBDBDB' }} />
                  {venueAddress && <p className="text-[11px] leading-[1.6] mb-2" style={{ color: '#8E8E8E' }}>{venueAddress}</p>}
                  <p className="text-[11px]" style={{ color: '#8E8E8E' }}>{formattedDate} {time}</p>

                  {/* Map buttons on venue card */}
                  {venueAddress && (
                    <div className="flex gap-2 mt-4 px-4">
                      <a
                        href={`https://map.kakao.com/?q=${encodeURIComponent(venueAddress || venueName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-center flex items-center justify-center gap-1"
                        style={{ background: '#FFF8E1', color: '#F9A825' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F9A825" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        카카오맵
                      </a>
                      <a
                        href={`https://map.naver.com/v5/search/${encodeURIComponent(venueAddress || venueName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-center flex items-center justify-center gap-1"
                        style={{ background: '#E8F4FD', color: '#0095F6' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0095F6" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        네이버맵
                      </a>
                      <a
                        href={`https://tmap.life/search?query=${encodeURIComponent(venueAddress || venueName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-center flex items-center justify-center gap-1"
                        style={{ background: '#F0F7FF', color: '#4285F4' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        티맵
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nav arrows */}
          {infoSlide > 0 && (
            <button
              onClick={() => setInfoSlide(infoSlide - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          {infoSlide < totalSlides - 1 && (
            <button
              onClick={() => setInfoSlide(infoSlide + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === infoSlide ? 6 : 5,
                  height: i === infoSlide ? 6 : 5,
                  background: i === infoSlide ? '#0095F6' : '#DBDBDB',
                }}
              />
            ))}
          </div>
        </div>
      </InstagramPost>
    </div>
  )
}

// === 9. Guidance Post (안내사항 포스트) ===
function GuidancePost({
  content,
  profileImage,
  username,
}: {
  content: any
  profileImage: string
  username: string
}) {
  const info = content?.content?.info
  if (!info) return null

  const items: { title: string; text: string; icon: string; buttonText?: string; url?: string }[] = []

  if (info.dressCode?.enabled) items.push({ title: info.dressCode.title || '드레스코드', text: info.dressCode.content, icon: '👔' })
  if (info.photoShare?.enabled) items.push({ title: info.photoShare.title || '사진 공유', text: info.photoShare.content, icon: '📸', buttonText: info.photoShare.buttonText, url: info.photoShare.url })
  if (info.photoBooth?.enabled) items.push({ title: info.photoBooth.title || '포토부스', text: info.photoBooth.content, icon: '📷' })
  if (info.flowerChild?.enabled) items.push({ title: info.flowerChild.title || '화동', text: info.flowerChild.content, icon: '🌸' })
  if (info.flowerGift?.enabled) items.push({ title: info.flowerGift.title || '화환', text: info.flowerGift.content, icon: '💐' })
  if (info.wreath?.enabled) items.push({ title: info.wreath.title || '화환', text: info.wreath.content, icon: '🎀' })
  if (info.shuttle?.enabled) items.push({ title: info.shuttle.title || '셔틀버스', text: info.shuttle.content, icon: '🚌' })
  if (info.reception?.enabled) items.push({ title: info.reception.title || '피로연', text: info.reception.content, icon: '🍽️' })

  // Custom items
  if (info.customItems && Array.isArray(info.customItems)) {
    info.customItems.forEach((item: any) => {
      if (item.enabled) items.push({ title: item.title, text: item.content, icon: item.emoji || '📋' })
    })
  }

  if (items.length === 0) return null

  const pastelBgs = ['#F0F7FF', '#FFF5F5', '#F5FFF0', '#FFF8E1', '#F3F0FF', '#FFF0F7', '#F0FFFA', '#FFFBF0']
  const [activeSlide, setActiveSlide] = useState(0)
  const avatarSettings = content?.media?.profileAvatarSettings || null

  return (
    <InstagramPost
      username={username}
      profileImage={profileImage}
      profileImageSettings={avatarSettings}
      caption={
        <div className="pb-3">
          <p className="text-[13px]" style={{ color: '#262626' }}>
            <span className="font-semibold">{username}</span>{' '}
            결혼식 안내사항을 알려드립니다 ✨
          </p>
        </div>
      }
    >
      {/* Carousel of guidance items */}
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                className="w-full flex-shrink-0 aspect-square flex items-center justify-center px-10"
                style={{ background: pastelBgs[i % pastelBgs.length] }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                    <span className="text-[32px]">{item.icon}</span>
                  </div>
                  <h4 className="text-[17px] font-semibold mb-3" style={{ color: '#262626' }}>{item.title}</h4>
                  <p className="text-[13px] leading-[1.8] whitespace-pre-line" style={{ color: '#666666' }}>{item.text}</p>
                  {item.buttonText && item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-5 px-6 py-2.5 rounded-full text-[13px] font-semibold text-white"
                      style={{ background: '#0095F6' }}
                    >
                      {item.buttonText}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav arrows */}
        {items.length > 1 && activeSlide > 0 && (
          <button
            onClick={() => setActiveSlide(activeSlide - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {items.length > 1 && activeSlide < items.length - 1 && (
          <button
            onClick={() => setActiveSlide(activeSlide + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {items.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === activeSlide ? 6 : 4,
                  height: i === activeSlide ? 6 : 4,
                  background: i === activeSlide ? '#0095F6' : '#DBDBDB',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </InstagramPost>
  )
}

// === 10. Guestbook Section (Instagram 댓글 스타일) ===
function GuestbookSection({
  invitationId,
  isSample,
  guestbookQuestions,
  sectionRef,
  sampleMessages,
}: {
  invitationId: string
  isSample: boolean
  guestbookQuestions: string[]
  sectionRef: React.RefObject<HTMLDivElement | null>
  sampleMessages?: GuestbookMessage[]
}) {
  const [messages, setMessages] = useState<GuestbookMessage[]>([])
  const [guestName, setGuestName] = useState('')
  const [guestMessage, setGuestMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Fetch guestbook messages (or use sample)
  useEffect(() => {
    if (isSample) {
      if (sampleMessages && sampleMessages.length > 0) {
        setMessages(sampleMessages)
      }
      return
    }
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/guestbook?invitationId=${invitationId}`)
        if (res.ok) {
          const data: { data?: GuestbookMessage[] } = await res.json()
          setMessages(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch guestbook messages:', error)
      }
    }
    fetchMessages()
  }, [invitationId, isSample, sampleMessages])

  const handleSubmit = async () => {
    if (!guestName.trim() || !guestMessage.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: guestName.trim(),
          message: guestMessage.trim(),
          question: guestbookQuestions[currentQuestionIndex] || null,
        }),
      })
      if (res.ok) {
        const data: { data?: GuestbookMessage } = await res.json()
        if (data.data) setMessages((prev) => [data.data!, ...prev])
        setGuestName('')
        setGuestMessage('')
        alert('방명록이 등록되었습니다!')
      }
    } catch (err) {
      console.error('Failed to post guestbook:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayMessages = showAll ? messages : messages.slice(0, 4)

  return (
    <div
      ref={sectionRef}
      className="border-t px-4 py-5"
      style={{ borderColor: '#DBDBDB', background: '#FFFFFF' }}
    >
      {/* Title */}
      <p className="text-[14px] font-semibold mb-3" style={{ color: '#262626' }}>
        방명록
      </p>

      {/* Question */}
      {guestbookQuestions.length > 0 && (
        <div className="mb-4">
          <p className="text-[13px] mb-2" style={{ color: '#262626' }}>
            {guestbookQuestions[currentQuestionIndex] || '축하 메시지를 남겨주세요'}
          </p>
          {guestbookQuestions.length > 1 && (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => (prev + 1) % guestbookQuestions.length)}
              className="text-[11px]"
              style={{ color: '#0095F6' }}
            >
              다른 질문 보기
            </button>
          )}
        </div>
      )}

      {/* Show all link */}
      {messages.length > 4 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-[13px] mb-3 block"
          style={{ color: '#8E8E8E' }}
        >
          댓글 {messages.length}개 모두 보기
        </button>
      )}

      {/* Messages */}
      <div className="space-y-3 mb-4">
        {displayMessages.map((msg) => (
          <div key={msg.id} className="flex gap-2.5">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-medium text-white" style={{ background: '#DBDBDB' }}>
              {msg.guest_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ color: '#262626' }}>
                <span className="font-semibold">{msg.guest_name}</span>{' '}
                <span className="font-normal">{msg.message}</span>
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#8E8E8E' }}>
                {timeAgo(msg.created_at)}
              </p>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-[13px] py-4 text-center" style={{ color: '#8E8E8E' }}>
            아직 댓글이 없습니다. 첫 번째로 축하 메시지를 남겨보세요!
          </p>
        )}
      </div>

      {/* Input area */}
      <div className="border-t pt-3 space-y-2" style={{ borderColor: '#DBDBDB' }}>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="이름"
          className="w-full text-[13px] py-2 px-3 rounded-lg outline-none"
          style={{ background: '#FAFAFA', border: '1px solid #DBDBDB', color: '#262626' }}
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={guestMessage}
            onChange={(e) => setGuestMessage(e.target.value)}
            placeholder="댓글 달기..."
            className="flex-1 text-[13px] py-2 px-3 rounded-lg outline-none"
            style={{ background: '#FAFAFA', border: '1px solid #DBDBDB', color: '#262626' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !guestName.trim() || !guestMessage.trim()}
            className="text-[13px] font-semibold px-3 py-2 disabled:opacity-30"
            style={{ color: '#0095F6' }}
          >
            게시
          </button>
        </div>
      </div>
    </div>
  )
}

// === 10-1. YouTube Video Post (영상) ===
function VideoPost({
  content,
  profileImage,
  username,
}: {
  content: any
  profileImage: string
  username: string
}) {
  const youtube = content?.youtube
  if (!youtube?.enabled || !youtube?.url) return null

  const match = youtube.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
  const videoId = match?.[1]
  if (!videoId) return null
  const avatarSettings = content?.media?.profileAvatarSettings || null

  return (
    <div className="border-b" style={{ borderColor: '#EFEFEF', background: '#FFFFFF' }}>
      {/* Post header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <img src={profileImage} alt="" className="w-full h-full object-cover" style={getAvatarCropStyle(avatarSettings)} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: '#262626' }}>{username}</span>
      </div>

      {/* Video embed */}
      <div style={{ aspectRatio: '16/9', background: '#000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Caption */}
      {youtube.title && (
        <div className="px-3 py-3">
          <p className="text-[13px]" style={{ color: '#262626' }}>
            <span className="font-semibold">{username}</span>{' '}
            {youtube.title}
          </p>
        </div>
      )}
    </div>
  )
}

// === 11. Account Post (계좌번호 안내) ===
function AccountPost({
  content,
  profileImage,
  username,
}: {
  content: any
  profileImage: string
  username: string
}) {
  const groom = content?.groom
  const bride = content?.bride

  const groomAccounts: { name: string; bank: string; account: string; holder: string; role: string }[] = []
  const brideAccounts: { name: string; bank: string; account: string; holder: string; role: string }[] = []

  if (groom?.bank?.enabled) groomAccounts.push({ name: groom.name, bank: groom.bank.bank, account: groom.bank.account, holder: groom.bank.holder, role: '신랑' })
  if (groom?.father?.bank?.enabled) groomAccounts.push({ name: groom.father.name, bank: groom.father.bank.bank, account: groom.father.bank.account, holder: groom.father.bank.holder, role: '아버지' })
  if (groom?.mother?.bank?.enabled) groomAccounts.push({ name: groom.mother.name, bank: groom.mother.bank.bank, account: groom.mother.bank.account, holder: groom.mother.bank.holder, role: '어머니' })

  if (bride?.bank?.enabled) brideAccounts.push({ name: bride.name, bank: bride.bank.bank, account: bride.bank.account, holder: bride.bank.holder, role: '신부' })
  if (bride?.father?.bank?.enabled) brideAccounts.push({ name: bride.father.name, bank: bride.father.bank.bank, account: bride.father.bank.account, holder: bride.father.bank.holder, role: '아버지' })
  if (bride?.mother?.bank?.enabled) brideAccounts.push({ name: bride.mother.name, bank: bride.mother.bank.bank, account: bride.mother.bank.account, holder: bride.mother.bank.holder, role: '어머니' })

  if (groomAccounts.length === 0 && brideAccounts.length === 0) return null

  const copyToClipboard = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '')
    navigator.clipboard.writeText(cleaned).then(() => {
      alert('계좌번호가 복사되었습니다.')
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = cleaned
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      alert('계좌번호가 복사되었습니다.')
    })
  }

  const [openSection, setOpenSection] = useState<'groom' | 'bride' | null>(null)

  const toggleSection = (section: 'groom' | 'bride') => {
    setOpenSection(openSection === section ? null : section)
  }

  const renderAccountCards = (accounts: typeof groomAccounts, side: 'groom' | 'bride') => (
    <div
      className="overflow-hidden transition-all duration-300"
      style={{
        maxHeight: openSection === side ? `${accounts.length * 100}px` : '0px',
        opacity: openSection === side ? 1 : 0,
      }}
    >
      <div className="pt-3 space-y-2.5">
        {accounts.map((acc, i) => (
          <div
            key={i}
            className="rounded-xl p-3.5"
            style={{ background: '#FFFFFF', border: '1px solid #EFEFEF' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: side === 'groom' ? '#E8F4FD' : '#FFF0F5', color: side === 'groom' ? '#0095F6' : '#E91E63' }}>
                    {acc.role}
                  </span>
                  {(acc.holder || acc.name) && <span className="text-[12px]" style={{ color: '#8E8E8E' }}>{acc.holder || acc.name}</span>}
                </div>
                <p className="text-[13px] font-medium tracking-wide" style={{ color: '#262626' }}>{acc.bank} {acc.account}</p>
              </div>
              <button
                onClick={() => copyToClipboard(acc.account)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ background: '#EFEFEF', color: '#262626' }}
              >
                복사
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const avatarSettings = content?.media?.profileAvatarSettings || null

  return (
    <InstagramPost
      username={username}
      profileImage={profileImage}
      profileImageSettings={avatarSettings}
      caption={
        <div className="pb-3">
          <p className="text-[13px]" style={{ color: '#262626' }}>
            <span className="font-semibold">{username}</span>{' '}
            전해주시는 축하와 응원, 오래도록 기억하겠습니다. 💛
          </p>
        </div>
      }
    >
      <div className="w-full" style={{ background: '#FAFAFA' }}>
        {/* Header area */}
        <div className="pt-10 pb-6 text-center px-8">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8E1, #FFE0B2)' }}>
            <span className="text-[28px]">💌</span>
          </div>
          <p className="text-[18px] font-medium mb-3" style={{ color: '#262626' }}>마음 전하실 곳</p>
          <p className="text-[13px] leading-[1.8]" style={{ color: '#8E8E8E' }}>
            멀리서도 함께해주시는 마음에 감사드립니다.
          </p>
        </div>

        {/* Accordion: 신랑측 */}
        <div className="px-6 pb-2">
          {groomAccounts.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => toggleSection('groom')}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors"
                style={{
                  background: openSection === 'groom' ? '#262626' : '#FFFFFF',
                  border: '1px solid #EFEFEF',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0095F6' }} />
                  <span className="text-[13px] font-semibold" style={{ color: openSection === 'groom' ? '#FFFFFF' : '#262626' }}>
                    신랑측
                  </span>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={openSection === 'groom' ? '#FFFFFF' : '#8E8E8E'} strokeWidth="2"
                  style={{ transform: openSection === 'groom' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {renderAccountCards(groomAccounts, 'groom')}
            </div>
          )}

          {/* Accordion: 신부측 */}
          {brideAccounts.length > 0 && (
            <div className="mb-3">
              <button
                onClick={() => toggleSection('bride')}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors"
                style={{
                  background: openSection === 'bride' ? '#262626' : '#FFFFFF',
                  border: '1px solid #EFEFEF',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#E91E63' }} />
                  <span className="text-[13px] font-semibold" style={{ color: openSection === 'bride' ? '#FFFFFF' : '#262626' }}>
                    신부측
                  </span>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={openSection === 'bride' ? '#FFFFFF' : '#8E8E8E'} strokeWidth="2"
                  style={{ transform: openSection === 'bride' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {renderAccountCards(brideAccounts, 'bride')}
            </div>
          )}
        </div>

        <div className="pb-6" />
      </div>
    </InstagramPost>
  )
}

// === 12. RSVP DM Modal (Instagram DM 스타일) ===
function RsvpDmModal({
  isOpen,
  onClose,
  username,
  profileImage,
  invitationId,
  allowGuestCount,
  isSample,
}: {
  isOpen: boolean
  onClose: () => void
  username: string
  profileImage: string
  invitationId: string
  allowGuestCount?: boolean
  isSample?: boolean
}) {
  const [step, setStep] = useState(0) // 0: form, 1: success
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [side, setSide] = useState<'groom' | 'bride' | null>(null)
  const [attendance, setAttendance] = useState<'attending' | 'not_attending' | 'pending' | null>(null)
  const [guestCount, setGuestCount] = useState(1)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    if (!name.trim()) { setError('이름을 입력해 주세요.'); return }
    if (!attendance) { setError('참석 여부를 선택해 주세요.'); return }

    if (isSample) {
      setStep(1)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: name.trim(),
          guestPhone: phone.trim() || undefined,
          attendance,
          guestCount: attendance === 'attending' ? guestCount : 0,
          message: message.trim() || undefined,
          side: side || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error || '전송에 실패했습니다.')
      }
      setStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '전송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset after animation
    setTimeout(() => {
      setStep(0)
      setName('')
      setPhone('')
      setSide(null)
      setAttendance(null)
      setGuestCount(1)
      setMessage('')
      setError(null)
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center" onClick={handleClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* DM Modal */}
      <div
        className="relative w-full max-w-[430px] rounded-t-2xl overflow-hidden"
        style={{ background: '#FFFFFF', maxHeight: '92vh', animation: 'slideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DM Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#DBDBDB' }}>
          <button onClick={handleClose} className="text-[14px] font-medium" style={{ color: '#262626' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden">
              <img src={profileImage} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[14px] font-semibold" style={{ color: '#262626' }}>{username}</span>
          </div>
          <div className="w-6" />
        </div>

        {step === 0 ? (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 56px)' }}>
            {/* Chat area */}
            <div className="px-4 py-4 space-y-3">
              {/* Received message bubble */}
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1">
                  <img src={profileImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-2.5" style={{ background: '#EFEFEF' }}>
                  <p className="text-[14px] leading-[1.5]" style={{ color: '#262626' }}>
                    결혼식에 와주실 수 있나요? 💌{'\n'}참석 여부를 알려주세요!
                  </p>
                </div>
              </div>
            </div>

            {/* Form area — styled as DM input */}
            <div className="px-4 pb-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#8E8E8E' }}>이름 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full text-[14px] py-2.5 px-4 rounded-2xl outline-none"
                  style={{ background: '#FAFAFA', border: '1px solid #DBDBDB', color: '#262626' }}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#8E8E8E' }}>연락처 뒷자리</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="뒷자리 4자리"
                  maxLength={4}
                  inputMode="numeric"
                  className="w-full text-[14px] py-2.5 px-4 rounded-2xl outline-none"
                  style={{ background: '#FAFAFA', border: '1px solid #DBDBDB', color: '#262626' }}
                />
              </div>

              {/* Side */}
              <div>
                <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#8E8E8E' }}>소속</label>
                <div className="flex gap-2">
                  {[{ value: 'groom' as const, label: '신랑측' }, { value: 'bride' as const, label: '신부측' }].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSide(side === opt.value ? null : opt.value)}
                      className="flex-1 py-2.5 rounded-2xl text-[13px] font-medium transition-colors"
                      style={{
                        background: side === opt.value ? '#262626' : '#FAFAFA',
                        color: side === opt.value ? '#FFFFFF' : '#8E8E8E',
                        border: `1px solid ${side === opt.value ? '#262626' : '#DBDBDB'}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance */}
              <div>
                <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#8E8E8E' }}>참석 여부 *</label>
                <div className="flex gap-2">
                  {[
                    { value: 'attending' as const, label: '참석', emoji: '🥰' },
                    { value: 'not_attending' as const, label: '불참', emoji: '😢' },
                    { value: 'pending' as const, label: '미정', emoji: '🤔' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAttendance(opt.value)}
                      className="flex-1 py-2.5 rounded-2xl text-[13px] font-medium transition-colors"
                      style={{
                        background: attendance === opt.value ? '#0095F6' : '#FAFAFA',
                        color: attendance === opt.value ? '#FFFFFF' : '#8E8E8E',
                        border: `1px solid ${attendance === opt.value ? '#0095F6' : '#DBDBDB'}`,
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Count */}
              {allowGuestCount && attendance === 'attending' && (
                <div>
                  <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#8E8E8E' }}>동반 인원 (본인 포함)</label>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[18px]"
                      style={{ background: '#EFEFEF', color: '#262626' }}
                    >
                      -
                    </button>
                    <span className="text-[18px] font-semibold w-8 text-center" style={{ color: '#262626' }}>{guestCount}</span>
                    <button
                      onClick={() => setGuestCount(Math.min(10, guestCount + 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[18px]"
                      style={{ background: '#EFEFEF', color: '#262626' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-[11px] font-medium mb-1.5 block" style={{ color: '#8E8E8E' }}>축하 메시지</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="축하 메시지를 남겨주세요..."
                  rows={3}
                  className="w-full text-[14px] py-2.5 px-4 rounded-2xl outline-none resize-none"
                  style={{ background: '#FAFAFA', border: '1px solid #DBDBDB', color: '#262626' }}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-[12px] text-center" style={{ color: '#ED4956' }}>{error}</p>
              )}

              {/* Send button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white disabled:opacity-50"
                style={{ background: '#0095F6' }}
              >
                {isSubmitting ? '전송 중...' : '보내기'}
              </button>
            </div>
          </div>
        ) : (
          /* Success state */
          <div className="px-6 py-16 text-center">
            <div className="mb-4">
              <svg
                width="56" height="56" viewBox="0 0 24 24" fill="#0095F6"
                className="mx-auto"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <p className="text-[18px] font-semibold mb-2" style={{ color: '#262626' }}>
              전송 완료!
            </p>
            <p className="text-[14px] mb-6" style={{ color: '#8E8E8E' }}>
              참석 여부가 전달되었습니다.{'\n'}감사합니다 💕
            </p>
            <button
              onClick={handleClose}
              className="px-8 py-2.5 rounded-2xl text-[14px] font-semibold"
              style={{ background: '#EFEFEF', color: '#262626' }}
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// === 13. RSVP Section ===
function RsvpSection({
  onRsvpClick,
  rsvpDeadline,
}: {
  onRsvpClick: () => void
  rsvpDeadline?: string
}) {
  const { ref, isRevealed } = useScrollReveal(0.2)

  const formattedDeadline = useMemo(() => {
    if (!rsvpDeadline) return ''
    const d = new Date(rsvpDeadline)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일까지`
  }, [rsvpDeadline])

  return (
    <div
      ref={ref}
      className="border-t py-12 px-6 text-center"
      style={{
        borderColor: '#DBDBDB',
        background: '#FFFFFF',
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s ease-out',
      }}
    >
      {/* Heart animation */}
      <div className="mb-6">
        <svg
          width="48" height="48" viewBox="0 0 24 24" fill="#ED4956"
          className="mx-auto"
          style={{ animation: 'heartBeat 1.5s ease-in-out infinite' }}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>

      <p className="text-[16px] font-semibold mb-2" style={{ color: '#262626' }}>
        참석 여부를 알려주세요
      </p>
      <p className="text-[13px] mb-6" style={{ color: '#8E8E8E' }}>
        소중한 자리에 함께해 주세요
      </p>

      <button
        onClick={onRsvpClick}
        className="px-8 py-3 rounded-lg text-[14px] font-semibold text-white flex items-center gap-2 mx-auto"
        style={{ background: '#0095F6' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        DM 보내기
      </button>

      {formattedDeadline && (
        <p className="text-[11px] mt-3" style={{ color: '#8E8E8E' }}>
          마감일: {formattedDeadline}
        </p>
      )}
    </div>
  )
}

// === 12. Thank You Post ===
function ThankYouPost({
  content,
  profileImage,
  username,
}: {
  content: any
  profileImage: string
  username: string
}) {
  const thankYou = content?.content?.thankYou
  if (!thankYou) return null
  const avatarSettings = content?.media?.profileAvatarSettings || null

  return (
    <InstagramPost
      username={username}
      profileImage={profileImage}
      profileImageSettings={avatarSettings}
      caption={
        <div className="pb-3">
          <p className="text-[13px]" style={{ color: '#262626' }}>
            <span className="font-semibold">{username}</span>{' '}
            {thankYou.caption || '축하해주셔서 감사합니다'}
          </p>
          {thankYou.sign && (
            <p className="text-[12px] mt-1" style={{ color: '#8E8E8E' }}>{thankYou.sign}</p>
          )}
        </div>
      }
    >
      <div
        className="w-full aspect-square flex items-center justify-center"
        style={{ background: '#FAFAFA' }}
      >
        <div className="text-center px-8">
          <p
            className="text-[24px] font-light tracking-wider mb-4"
            style={{ color: '#262626', fontFamily: "'Dancing Script', cursive" }}
          >
            {thankYou.title || 'Thank You'}
          </p>
          <div className="w-12 h-[0.5px] mx-auto mb-4" style={{ background: '#DBDBDB' }} />
          <p className="text-[13px] leading-[2] whitespace-pre-line" style={{ color: '#8E8E8E' }}>
            {thankYou.message || '함께해 주셔서 감사합니다'}
          </p>
        </div>
      </div>
    </InstagramPost>
  )
}

// === 13. Footer ===
function InstagramFooter() {
  return (
    <div className="py-8 text-center border-t" style={{ borderColor: '#DBDBDB', background: '#FAFAFA' }}>
      <p
        className="text-[16px] mb-1"
        style={{ fontFamily: "'Dancing Script', cursive", color: '#8E8E8E' }}
      >
        dear drawer
      </p>
      <p className="text-[10px] tracking-wider" style={{ color: '#DBDBDB' }}>
        WEDDING INVITATION
      </p>
    </div>
  )
}

// === Gallery Lightbox ===
function GalleryLightbox({
  images,
  isOpen,
  initialIndex,
  onClose,
}: {
  images: string[]
  isOpen: boolean
  initialIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIndex)
  useEffect(() => { setIdx(initialIndex) }, [initialIndex])
  if (!isOpen || images.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white z-10"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
        <span className="text-[13px] text-white/60 font-medium">
          {idx + 1} / {images.length}
        </span>
      </div>

      {/* Image */}
      <div className="w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <img src={images[idx]} alt="" className="max-w-full max-h-full object-contain" />
      </div>

      {/* Prev */}
      {idx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(idx - 1) }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next */}
      {idx < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx(idx + 1) }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================
function InvitationClientExhibitContent({
  invitation,
  content,
  isPaid,
  isPreview,
  guestInfo,
  isSample,
}: InvitationClientProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const guestbookRef = useRef<HTMLDivElement>(null)

  // Active room tab (-1 = show all rooms)
  const [activeRoom, setActiveRoom] = useState(-1)

  // Content tab (grid/people/story)
  const [contentTab, setContentTab] = useState<ContentTab>('grid')

  // Instagram header visibility (show after scrolling past cover)
  const [showHeader, setShowHeader] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY > window.innerHeight * 0.7)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-play BGM
  const bgmEnabled = !!(content?.bgm?.enabled && content?.bgm?.url)
  useEffect(() => {
    if (!bgmEnabled || !audioRef.current) return
    const savedPref = localStorage.getItem('musicEnabled')
    if (savedPref === 'false') return

    const tryPlay = () => {
      audioRef.current?.play().catch(() => {
        const handleInteraction = () => {
          audioRef.current?.play().catch(() => {})
          document.removeEventListener('click', handleInteraction)
          document.removeEventListener('touchstart', handleInteraction)
        }
        document.addEventListener('click', handleInteraction)
        document.addEventListener('touchstart', handleInteraction)
      })
    }
    setTimeout(tryPlay, 500)
  }, [bgmEnabled])

  // Rooms data
  const rooms: Room[] = useMemo(() => {
    if (content?.rooms && Array.isArray(content.rooms)) return content.rooms
    const galleryImages = content?.gallery?.images || []
    if (galleryImages.length > 0) {
      return [{ title: 'Gallery', subtitle: '', images: galleryImages.map(extractImageUrl) }]
    }
    return []
  }, [content])

  // Flatten all images for lightbox
  const allImages = useMemo(() => {
    return rooms.flatMap((room) => room.images.map(extractImageUrl).filter(Boolean))
  }, [rooms])

  // Room photo offsets for lightbox index
  const roomOffsets = useMemo(() => {
    const offsets: number[] = []
    let offset = 0
    rooms.forEach((room) => {
      offsets.push(offset)
      offset += room.images.filter((img) => extractImageUrl(img)).length
    })
    return offsets
  }, [rooms])

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const handlePhotoClick = useCallback(
    (roomIndex: number, localIdx: number) => {
      const globalIdx = roomOffsets[roomIndex] + localIdx
      setLightboxIndex(globalIdx)
      setLightboxOpen(true)
    },
    [roomOffsets]
  )

  // Handle highlight click -> switch tab (not scroll)
  const handleHighlightClick = useCallback((index: number) => {
    setActiveRoom(index)
  }, [])

  // Profile data
  const coverImage = extractImageUrl(content?.media?.coverImage) || '/sample/cover.png'
  const profileAvatar = extractImageUrl(content?.media?.profileAvatar) || ''
  const profileAvatarSettings = content?.media?.profileAvatarSettings || null
  const profileImage = profileAvatar || coverImage
  const groomName = content?.groom?.name || invitation?.groom_name || ''
  const brideName = content?.bride?.name || invitation?.bride_name || ''
  const displayId = content?.displayId || `${groomName}_${brideName}`
  const username = displayId

  // RSVP DM Modal
  const [rsvpDmOpen, setRsvpDmOpen] = useState(false)
  const handleRsvpClick = useCallback(() => {
    setRsvpDmOpen(true)
  }, [])

  // Contact click handler
  const handleContactClick = useCallback(() => {
    const contactBtn = document.querySelector('[data-action="contact"]') as HTMLButtonElement
    if (contactBtn) contactBtn.click()
  }, [])

  // Scroll to guestbook
  const handleGuestbookScroll = useCallback(() => {
    guestbookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Guestbook questions
  const guestbookQuestions = content?.content?.guestbookQuestions || ['축하 메시지를 남겨주세요']

  // Section visibility
  const showGuestbook = content?.sectionVisibility?.guestbook !== false
  const showGuidance = content?.sectionVisibility?.guidance !== false

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div className="ig-container">
        {!isPaid && !isPreview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 500 }}>결제 후 워터마크가 제거됩니다</span>
          </div>
        )}
        <WatermarkOverlay isPaid={isPaid || !!isPreview}>
          <div className="flex justify-center min-h-screen" style={{ background: '#FAFAFA' }}>
            <div
              ref={scrollContainerRef}
              className="w-full max-w-[430px] relative ig-scroll"
              style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif",
                background: '#FFFFFF',
              }}
            >
              {/* Instagram Header */}
              <InstagramHeader showHeader={showHeader} />

              {/* 1. Cover (Story style) */}
              <CoverSection content={content} invitation={invitation} displayId={displayId} audioRef={audioRef} bgmEnabled={bgmEnabled} />

              {/* 2. Profile Section */}
              <ProfileSection
                content={content}
                invitation={invitation}
                allImagesCount={allImages.length}
                onRsvpClick={handleRsvpClick}
                onGuestbookScroll={handleGuestbookScroll}
                onContactClick={handleContactClick}
                displayId={displayId}
              />

              {/* 3. Story Highlights (탭 전환) */}
              <StoryHighlights rooms={rooms} activeRoom={activeRoom} onHighlightClick={handleHighlightClick} />

              {/* 4. Tab Bar */}
              <TabBar activeTab={contentTab} onTabChange={setContentTab} />

              {/* 5. Tab Content */}
              {contentTab === 'grid' && (
                <PhotoGrid
                  rooms={rooms}
                  activeRoom={activeRoom}
                  onPhotoClick={handlePhotoClick}
                  onHighlightClick={handleHighlightClick}
                  galleryPreviewCount={content?.galleryPreviewCount || 3}
                />
              )}
              {contentTab === 'people' && (
                <PeopleTab content={content} profileImage={profileImage} username={username} />
              )}
              {contentTab === 'story' && (
                <LoveStoryTab content={content} profileImage={profileImage} username={username} />
              )}

              {/* 6. Video Post (영상) - 오시는길 상단 */}
              <VideoPost
                content={content}
                profileImage={profileImage}
                username={username}
              />

              {/* 7. Wedding Info Post */}
              <WeddingInfoPost
                content={content}
                invitation={invitation}
                profileImage={profileImage}
                username={username}
              />

              {/* 8. Guidance Post */}
              {showGuidance && (
                <GuidancePost
                  content={content}
                  profileImage={profileImage}
                  username={username}
                />
              )}

              {/* 8. Account Post (계좌번호 안내) */}
              <AccountPost
                content={content}
                profileImage={profileImage}
                username={username}
              />

              {/* 9. Thank You Post */}
              <ThankYouPost
                content={content}
                profileImage={profileImage}
                username={username}
              />

              {/* 9. Guestbook (Comments) */}
              {showGuestbook && (
                <GuestbookSection
                  invitationId={invitation?.id || ''}
                  isSample={!!isSample}
                  guestbookQuestions={guestbookQuestions}
                  sectionRef={guestbookRef}
                  sampleMessages={content?.content?.sampleGuestbook}
                />
              )}

              {/* 10. RSVP */}
              {content?.rsvpEnabled !== false && (
                <RsvpSection
                  onRsvpClick={handleRsvpClick}
                  rsvpDeadline={content?.rsvpDeadline}
                />
              )}

              {/* 11. Footer */}
              <InstagramFooter />

              {/* Bottom padding */}
              <div className="h-12" />
            </div>
          </div>

          {/* BGM Audio */}
          {bgmEnabled && (
            <audio ref={audioRef} loop preload="auto">
              <source src={content.bgm.url} type="audio/mpeg" />
            </audio>
          )}

        </WatermarkOverlay>

        {/* Gallery Lightbox */}
        <GalleryLightbox
          images={allImages}
          isOpen={lightboxOpen}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />

        {/* RSVP DM Modal */}
        <RsvpDmModal
          isOpen={rsvpDmOpen}
          onClose={() => setRsvpDmOpen(false)}
          username={username}
          profileImage={profileImage}
          invitationId={invitation?.id || ''}
          allowGuestCount={content?.rsvpAllowGuestCount}
          isSample={!!isSample}
        />
      </div>
    </>
  )
}

// Error Boundary Fallback
function InvitationErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-8">
        <p className="text-[13px]" style={{ color: '#8E8E8E' }}>
          청첩장을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    </div>
  )
}

// Main Export
export default function InvitationClientExhibit(props: InvitationClientProps) {
  return <InvitationClientExhibitContent {...props} />
}
