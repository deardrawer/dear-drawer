'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import ProfileImageSlider from '@/components/editor/ProfileImageSlider'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'

// Music Toggle Component
function MusicToggle({
  audioRef,
  isVisible,
  shouldAutoPlay,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isVisible: boolean
  shouldAutoPlay: boolean
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const hasAutoPlayed = useRef(false)

  // Auto-play when shouldAutoPlay becomes true (triggered by user interaction)
  useEffect(() => {
    if (shouldAutoPlay && !hasAutoPlayed.current && audioRef.current) {
      hasAutoPlayed.current = true

      const savedPreference = localStorage.getItem('musicEnabled')
      if (savedPreference === 'false') return

      // Small delay to ensure audio is ready
      setTimeout(() => {
        audioRef.current?.play()
          .then(() => setIsPlaying(true))
          .catch((e) => console.log('Auto-play failed:', e))
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

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [audioRef])

  const toggleMusic = () => {
    if (!audioRef.current) return

    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
          localStorage.setItem('musicEnabled', 'true')
        })
        .catch(console.error)
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
      localStorage.setItem('musicEnabled', 'false')
    }
  }

  if (!isVisible) return null

  return (
    <button
      onClick={toggleMusic}
      className="fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95"
      style={{
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      aria-label={isPlaying ? '음악 끄기' : '음악 켜기'}
    >
      {isPlaying ? (
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      )}
    </button>
  )
}

// Global CSS Animations - matching original template
const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scrollDown {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(6px); opacity: 0.5; }
  }

  @keyframes scrollDotMove {
    0%, 100% {
      opacity: 0;
      transform: translateY(-28px);
    }
    20% {
      opacity: 1;
    }
    50% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 1;
      transform: translateY(-14px);
    }
    90% {
      opacity: 0;
      transform: translateY(0);
    }
  }

  /* Divider Line Expand Animation */
  @keyframes expandFromRight {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  @keyframes expandFromLeft {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  .divider-bar-left {
    transform-origin: right center;
    animation: expandFromRight 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .divider-bar-right {
    transform-origin: left center;
    animation: expandFromLeft 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.1s;
    transform: scaleX(0);
  }

  /* Cinematic Intro Animations */
  .cinematic-bg {
    opacity: 0;
    transform: scale(1.1);
    transition: opacity 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .cinematic-bg.active {
    opacity: 1;
    transform: scale(1);
  }

  .cinematic-content {
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .cinematic-content.show {
    opacity: 1;
    transform: translateY(0);
  }

  .cinematic-line {
    width: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.5);
    transition: width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .cinematic-content.show .cinematic-line {
    width: 50px;
  }

  .cinematic-text {
    opacity: 0;
    letter-spacing: 6px;
    transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s,
                letter-spacing 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s;
  }
  .cinematic-content.show .cinematic-text {
    opacity: 1;
    letter-spacing: 3px;
  }

  .cinematic-subtext {
    opacity: 0;
    transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s;
  }
  .cinematic-content.show .cinematic-subtext {
    opacity: 1;
  }

  /* Divider Section - matching original template */
  .divider-section {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 180px 28px;
  }

  .divider-section.chapter-break {
    min-height: 50vh;
    padding: 100px 28px;
  }

  .divider-line {
    width: 1px;
    height: 40px;
    margin: 24px 0;
    transform: scaleY(0);
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .divider-line.top {
    transform-origin: bottom center;
  }

  .divider-line.bottom {
    transform-origin: top center;
    transition-delay: 0.6s;
  }

  .divider-section.in-view .divider-line {
    transform: scaleY(1);
  }

  /* Divider Text Animation - Center Expand */
  .divider-text-mask {
    position: relative;
    display: block;
    text-align: center;
    padding: 10px 0;
  }

  .divider-text-mask .text-line {
    display: block;
    opacity: 0;
    letter-spacing: -2px;
    transform: scaleX(0.8);
    transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                letter-spacing 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .divider-text-mask .text-line:nth-child(2) {
    transition-delay: 0.2s;
  }

  .divider-section.in-view .divider-text-mask .text-line {
    opacity: 1;
    letter-spacing: 3px;
    transform: scaleX(1);
  }

  .divider-section.in-view .divider-text-mask .text-line:nth-child(2) {
    transition-delay: 0.25s;
  }

  /* Story Section Animations */
  .story-section {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 1.2s ease, transform 1.2s ease;
  }

  .story-section.in-view {
    opacity: 1;
    transform: translateY(0);
  }

  .story-date {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s;
  }

  .story-section.in-view .story-date {
    opacity: 1;
    transform: translateY(0);
  }

  .story-title {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1.2s ease 0.6s, transform 1.2s ease 0.6s;
  }

  .story-section.in-view .story-title {
    opacity: 1;
    transform: translateY(0);
  }

  .story-desc {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1.2s ease 0.9s, transform 1.2s ease 0.9s;
  }

  .story-section.in-view .story-desc {
    opacity: 1;
    transform: translateY(0);
  }

  .story-photos {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1.2s ease 1.2s, transform 1.2s ease 1.2s;
  }

  .story-section.in-view .story-photos {
    opacity: 1;
    transform: translateY(0);
  }

  /* Invitation Section Animations - matching original template */
  .invitation-section {
    opacity: 0;
  }

  .invitation-section.in-view {
    opacity: 1;
  }

  .invitation-title {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .invitation-title {
    animation: fadeInUp 0.8s ease forwards;
  }

  .quote-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .quote-section {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 0.3s;
  }

  .greeting-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .greeting-section {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 0.6s;
  }

  .parents-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .parents-section {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 0.8s;
  }

  .wedding-info-card {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .wedding-info-card {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 1s;
  }

  .next-story-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .next-story-section {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 1.2s;
  }

  /* Wave Animation */
  @keyframes waveBack {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-3%); }
  }

  @keyframes waveMid {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(2%); }
  }

  @keyframes waveFront {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-2%); }
  }

  /* Profile Label Underline Animation */
  .profile-label-animated {
    position: relative;
    display: inline-block;
  }

  .profile-label-animated::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    width: 0;
    height: 1px;
    background: currentColor;
    opacity: 0.4;
    transition: width 1s ease-out, left 1s ease-out;
  }

  .profile-label-animated.revealed::after {
    width: 100%;
    left: 0;
  }
`

// Scroll Animation Hook
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // 마운트 후 약간의 지연을 두어 초기 스타일이 적용된 후 애니메이션 시작
    const mountTimer = setTimeout(() => setIsMounted(true), 50)
    return () => clearTimeout(mountTimer)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [isMounted])

  return { ref, isVisible }
}

// Animated Section Component
function AnimatedSection({ children, className, style, delay = 0 }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
}) {
  const { ref, isVisible } = useScrollAnimation()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

// Divider Section Component - matching original template exactly
function DividerSection({
  lines,
  dividerColor,
  fontFamily,
  textColor,
  bgColor,
  isChapterBreak = false
}: {
  lines: string[]
  dividerColor: string
  fontFamily: string
  textColor: string
  bgColor: string
  isChapterBreak?: boolean
}) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div
      ref={ref}
      className={`divider-section ${isChapterBreak ? 'chapter-break' : ''} ${isVisible ? 'in-view' : ''}`}
      style={{ background: bgColor }}
    >
      {/* Top Divider Line */}
      <div
        className="divider-line top"
        style={{ background: dividerColor }}
      />

      {/* Text with Center Expand Animation */}
      <div className="divider-text-mask">
        {lines.map((line, index) => (
          <span
            key={index}
            className="text-line"
            style={{
              fontFamily,
              fontSize: '14px',
              color: textColor,
              lineHeight: 1.9
            }}
          >
            {line}
          </span>
        ))}
      </div>

      {/* Bottom Divider Line */}
      <div
        className="divider-line bottom"
        style={{ background: dividerColor }}
      />
    </div>
  )
}

// Profile Section Component - with animated underline label
function ProfileSection({
  profile,
  fonts,
  themeColors,
  bgColor,
}: {
  profile: { images: string[]; imageSettings?: { scale: number; positionX: number; positionY: number }[]; aboutLabel: string; subtitle: string; intro: string; tag?: string }
  fonts: FontConfig
  themeColors: ColorConfig
  bgColor: string
}) {
  const { ref, isVisible } = useScrollAnimation()
  const [labelRevealed, setLabelRevealed] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Delay underline animation slightly after section becomes visible
      const timer = setTimeout(() => setLabelRevealed(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  return (
    <div
      ref={ref}
      className="px-7 py-14"
      style={{ background: bgColor }}
    >
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 1.2s ease, transform 1.2s ease',
        }}
      >
        <ProfileImageSlider
          images={profile.images}
          imageSettings={profile.imageSettings}
          className="mb-10"
        />
      </div>
      <div className="text-center mb-8">
        <p
          className={`profile-label-animated text-[10px] font-light mb-1.5 ${labelRevealed ? 'revealed' : ''}`}
          style={{
            fontFamily: fonts.display,
            color: themeColors.gray,
            letterSpacing: '3px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s',
          }}
        >
          {profile.aboutLabel}
        </p>
        <p
          className="text-[11px] font-light"
          style={{
            color: '#999',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease 0.6s, transform 1.2s ease 0.6s',
          }}
        >
          {profile.subtitle}
        </p>
      </div>
      <div
        className="text-xs font-light leading-[2.2] text-left"
        style={{
          fontFamily: fonts.displayKr,
          color: themeColors.text,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1.2s ease 0.9s, transform 1.2s ease 0.9s',
        }}
        dangerouslySetInnerHTML={{ __html: profile.intro.replace(/\n/g, '<br/>') }}
      />
      {profile.tag && (
        <div
          className="inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md text-[10px] font-light"
          style={{
            background: 'rgba(0,0,0,0.03)',
            color: '#777',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease 1.2s, transform 1.2s ease 1.2s',
          }}
        >
          &#9829; {profile.tag}
        </div>
      )}
    </div>
  )
}

// Info Block Component - with animated underline
function InfoBlock({
  title,
  content,
  buttonText,
  buttonUrl,
  fonts,
  themeColors,
}: {
  title: string
  content: string
  buttonText?: string
  buttonUrl?: string
  fonts: FontConfig
  themeColors: ColorConfig
}) {
  const { ref, isVisible } = useScrollAnimation()
  const [titleRevealed, setTitleRevealed] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setTitleRevealed(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  return (
    <div
      ref={ref}
      className="rounded-[20px] px-6 py-6 mb-4"
      style={{
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.04)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {/* Title with accent bar and animated underline */}
      <h4
        className={`profile-label-animated text-[13px] mb-4 flex items-center gap-2 ${titleRevealed ? 'revealed' : ''}`}
        style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}
      >
        <span
          className="w-[3px] h-[14px] rounded-sm flex-shrink-0"
          style={{ background: themeColors.accent }}
        />
        {title}
      </h4>

      {/* Content */}
      <p
        className="text-xs font-light leading-[2]"
        style={{ color: '#666' }}
        dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
      />

      {/* Optional Button */}
      {buttonText && buttonUrl && (
        <button
          onClick={() => window.open(buttonUrl, '_blank')}
          className="mt-4 px-5 py-2.5 rounded-full text-[11px] font-light transition-all hover:opacity-80"
          style={{
            background: themeColors.primary,
            color: '#fff',
          }}
        >
          {buttonText}
        </button>
      )}
    </div>
  )
}

// Interview Section Component - with animated underline
function InterviewSection({
  interview,
  fonts,
  themeColors,
  bgColor,
}: {
  interview: { question?: string; answer?: string; images?: string[] }
  fonts: FontConfig
  themeColors: ColorConfig
  bgColor: string
}) {
  const { ref, isVisible } = useScrollAnimation()
  const [titleRevealed, setTitleRevealed] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setTitleRevealed(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  return (
    <div
      ref={ref}
      className="px-7 py-14"
      style={{ background: bgColor }}
    >
      {/* Images */}
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 1.2s ease, transform 1.2s ease',
        }}
      >
        {interview.images && interview.images.length > 0 ? (
          interview.images.length === 1 ? (
            <div className="w-full aspect-[4/5] rounded-xl mb-8 overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center bg-gray-100"
                style={{ backgroundImage: interview.images[0] ? `url(${interview.images[0]})` : undefined }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-8">
              {interview.images.slice(0, 2).map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center bg-gray-100"
                    style={{ backgroundImage: img ? `url(${img})` : undefined }}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="w-full aspect-[4/5] rounded-xl mb-8 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Interview Image</span>
          </div>
        )}
      </div>

      {/* Question with animated underline */}
      {interview.question && (
        <div
          className="text-center mb-5"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s',
          }}
        >
          <p
            className={`profile-label-animated text-sm inline-block ${titleRevealed ? 'revealed' : ''}`}
            style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}
          >
            {interview.question}
          </p>
        </div>
      )}

      {/* Answer */}
      {interview.answer && (
        <p
          className="text-[11px] font-light leading-[2.2]"
          style={{
            fontFamily: fonts.displayKr,
            color: themeColors.text,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease 0.6s, transform 1.2s ease 0.6s',
          }}
          dangerouslySetInnerHTML={{ __html: interview.answer.replace(/\n/g, '<br/>') }}
        />
      )}
    </div>
  )
}

// Story Section Component - matching original template
function StorySection({
  story,
  fonts,
  themeColors,
}: {
  story: { date?: string; title?: string; desc?: string; images?: string[] }
  fonts: FontConfig
  themeColors: ColorConfig
}) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div
      ref={ref}
      className={`story-section ${isVisible ? 'in-view' : ''}`}
      style={{
        padding: '60px 28px',
        background: themeColors.sectionBg,
        textAlign: 'center'
      }}
    >
      {story.date && (
        <p
          className="story-date"
          style={{
            fontFamily: fonts.display,
            fontSize: '10px',
            fontWeight: 300,
            letterSpacing: '2px',
            color: themeColors.gray,
            marginBottom: '12px'
          }}
        >
          {story.date}
        </p>
      )}

      {story.title && (
        <p
          className="story-title"
          style={{
            fontFamily: fonts.displayKr,
            fontSize: '15px',
            fontWeight: 400,
            color: themeColors.text,
            marginBottom: '12px'
          }}
        >
          {story.title}
        </p>
      )}

      {story.desc && (
        <p
          className="story-desc"
          style={{
            fontSize: '11px',
            fontWeight: 300,
            color: '#777',
            lineHeight: 1.9,
            marginBottom: '28px'
          }}
          dangerouslySetInnerHTML={{ __html: story.desc.replace(/\n/g, '<br/>') }}
        />
      )}

      {story.images && story.images.length > 0 && (
        <div
          className="story-photos"
          style={{
            display: 'grid',
            gridTemplateColumns: story.images.length === 1 ? '1fr' : '1fr 1fr',
            gap: '12px'
          }}
        >
          {story.images.slice(0, 3).map((img, i) => (
            <div
              key={i}
              className={story.images!.length === 3 && i === 0 ? 'col-span-2' : ''}
              style={{
                aspectRatio: story.images!.length === 3 && i === 0 ? '2/1' : '1',
                backgroundImage: img ? `url(${img})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Color themes
type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#E91E63', secondary: '#D4A574', accent: '#d4a574', background: '#FFF8F5', sectionBg: '#FFE8E8', cardBg: '#FFFFFF', divider: '#d4b896', text: '#333333', gray: '#666666' },
  'modern-black': { primary: '#1A1A1A', secondary: '#888888', accent: '#1A1A1A', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#1A1A1A', gray: '#666666' },
  'romantic-blush': { primary: '#D4A5A5', secondary: '#C9B8A8', accent: '#C9B8A8', background: '#FDF8F6', sectionBg: '#F8EFEC', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#5C4B4B', gray: '#8B7676' },
  'nature-green': { primary: '#6B8E6B', secondary: '#A8B5A0', accent: '#8FA888', background: '#F5F7F4', sectionBg: '#EBF0E8', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3D4A3D', gray: '#6B7B6B' },
  'luxury-navy': { primary: '#1E3A5F', secondary: '#C9A96E', accent: '#C9A96E', background: '#F8F9FA', sectionBg: '#E8ECF0', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#1E3A5F', gray: '#5A6B7C' },
  'sunset-coral': { primary: '#E8846B', secondary: '#F5C7A9', accent: '#E8A87C', background: '#FFFAF7', sectionBg: '#FFEEE5', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#5C4035', gray: '#8B6B5C' },
}

// Font styles
type FontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'
interface FontConfig { display: string; displayKr: string; body: string }

const fontStyles: Record<FontStyle, FontConfig> = {
  classic: { display: "'Playfair Display', serif", displayKr: "'Nanum Myeongjo', serif", body: "'Nanum Myeongjo', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Noto Sans KR', sans-serif", body: "'Noto Sans KR', sans-serif" },
  romantic: { display: "'Lora', serif", displayKr: "'Gowun Batang', serif", body: "'Gowun Batang', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'Gowun Dodum', sans-serif", body: "'Gowun Dodum', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'Nanum Myeongjo', serif", body: "'Nanum Myeongjo', serif" },
}

// Mock invitation data
const mockInvitation = {
  id: 'demo-invitation-id',
  colorTheme: 'classic-rose' as ColorTheme,
  fontStyle: 'romantic' as FontStyle,

  groom: {
    name: '김민준',
    nameEn: 'Minjun Kim',
    phone: '010-1234-5678',
    father: { name: '김철수', phone: '010-1111-2222', deceased: false },
    mother: { name: '이영희', phone: '010-3333-4444', deceased: false },
    bank: { bank: '신한은행', account: '110-123-456789', holder: '김민준', enabled: true },
    profile: {
      images: ['/demo/groom1.jpg', '/demo/groom2.jpg'],
      imageSettings: [
        { scale: 1, positionX: 0, positionY: 0 },
        { scale: 1, positionX: 0, positionY: 0 },
      ],
      aboutLabel: 'ABOUT GROOM',
      subtitle: '신부가 소개하는 신랑',
      intro: '처음 만났을 때부터 따뜻한 미소가 인상적이었던 사람.\n항상 제 이야기에 귀 기울여주고, 힘들 때 묵묵히 곁에 있어주는 든든한 사람입니다.\n\n요리를 좋아하고, 주말마다 새로운 레시피에 도전하는 모습이 참 사랑스러워요.',
      tag: '세상에서 가장 따뜻한 사람',
    },
  },
  bride: {
    name: '이서연',
    nameEn: 'Seoyeon Lee',
    phone: '010-5678-1234',
    father: { name: '이정호', phone: '010-5555-6666', deceased: false },
    mother: { name: '박미경', phone: '010-7777-8888', deceased: false },
    bank: { bank: '국민은행', account: '123-45-678901', holder: '이서연', enabled: true },
    profile: {
      images: ['/demo/bride1.jpg', '/demo/bride2.jpg'],
      imageSettings: [
        { scale: 1, positionX: 0, positionY: 0 },
        { scale: 1, positionX: 0, positionY: 0 },
      ],
      aboutLabel: 'ABOUT BRIDE',
      subtitle: '신랑이 소개하는 신부',
      intro: '밝은 웃음소리가 참 예쁜 사람.\n제가 지칠 때마다 힘이 되어주고, 작은 것에도 감사할 줄 아는 따뜻한 마음의 소유자입니다.\n\n그림 그리기를 좋아하고, 가끔 저를 위해 그려주는 그림들이 우리 집의 보물이에요.',
      tag: '매일 웃게 해주는 사람',
    },
  },

  wedding: {
    date: '2025-05-24',
    time: '14:00',
    timeDisplay: '오후 2시',
    dayOfWeek: '토요일',
    title: 'OUR WEDDING',
    venue: {
      name: '더채플앳청담',
      hall: '루체홀 5층',
      address: '서울특별시 강남구 청담동 123-45',
      mapUrl: '',
      naverMapUrl: '',
      kakaoMapUrl: '',
    },
    directions: {
      car: {
        desc: '네비게이션에 "더채플앳청담" 검색',
        route: '강남역 방면에서 청담사거리 방향으로 직진 후 우회전',
      },
      subway: [
        '압구정로데오역 5번 출구 도보 10분',
        '청담역 9번 출구 도보 15분',
      ],
      bus: {
        main: ['146', '301', '401'],
        branch: ['3422', '4412'],
      },
      parking: {
        location: '건물 지하 1~3층 주차장 이용 가능',
        fee: '3시간 무료 주차권 제공',
      },
    },
  },

  relationship: {
    startDate: '2020-03-15',
    stories: [
      {
        date: '2020.03',
        title: '운명처럼 다가온 만남',
        desc: '친구의 소개로 처음 만났던 그 날,\n어색한 인사를 나누며 시작된 우리의 이야기.\n카페에서 나눈 세 시간의 대화가\n우리 사랑의 첫 페이지가 되었습니다.',
        images: ['/demo/story1.jpg'],
      },
      {
        date: '2022.12',
        title: '함께한 첫 해외여행',
        desc: '제주도부터 시작해 일본, 유럽까지.\n함께 떠난 여행에서 서로를 더 깊이 알게 되었고,\n어떤 상황에서도 함께라면 즐거울 수 있다는 걸 깨달았습니다.',
        images: ['/demo/story2.jpg', '/demo/story3.jpg'],
      },
      {
        date: '2024.09',
        title: '프러포즈',
        desc: '우리가 처음 만났던 그 카페에서,\n떨리는 마음으로 건넨 반지와 함께\n평생을 약속했습니다.',
        images: ['/demo/story4.jpg'],
      },
    ],
    closingText: '그리고 이제 드디어 부르는 서로의 이름에 \'신랑\', \'신부\'라는 호칭을 담습니다.',
  },

  content: {
    greeting: '서로 다른 길을 걸어온 두 사람이\n이제 같은 길을 함께 걸어가려 합니다.\n\n저희의 새로운 시작을\n축복해 주시면 감사하겠습니다.\n\n귀한 걸음 하시어\n자리를 빛내주세요.',
    quote: {
      text: '사랑한다는 것은\n같은 방향을 바라보는 것이다.',
      author: '생텍쥐페리',
    },
    thankYou: {
      title: 'THANK YOU',
      message: '바쁘신 와중에도 저희의 결혼을\n축하해 주셔서 진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.',
      sign: '민준 & 서연 올림',
    },
    interviews: [
      {
        question: '첫 만남의 기억이 어떠셨나요?',
        answer: '처음 본 순간, 이 사람이다 싶었어요. 말로 설명하기 어려운 느낌이었는데, 대화를 나눌수록 확신이 들었습니다. 서로의 눈을 바라보며 웃던 그 순간을 잊을 수 없어요.',
        images: ['/demo/interview1.jpg'],
        bgClass: 'pink-bg',
      },
      {
        question: '결혼을 결심하게 된 계기는?',
        answer: '함께 있을 때 가장 나다울 수 있었어요. 아무리 힘든 일이 있어도 이 사람 곁에 있으면 괜찮아지더라구요. 평생 이 사람과 함께라면 어떤 일이든 해낼 수 있을 것 같았습니다.',
        images: ['/demo/interview2.jpg'],
        bgClass: 'white-bg',
      },
    ],
    guestbookQuestions: [
      '두 사람에게 해주고 싶은 말은?',
      '결혼생활에서 가장 중요한 건?',
      '두 사람의 첫인상은 어땠나요?',
    ],
    info: {
      dressCode: { title: 'Dress Code', content: '단정한 복장으로 와주세요.\n흰색 계열 의상은 피해주시면 감사하겠습니다.', enabled: true },
      photoShare: { title: 'Photo Sharing', content: '결혼식 사진을 공유해주세요!', buttonText: '사진 공유하기', url: '', enabled: false },
      photoBooth: { title: 'Photo Booth', content: '로비에서 포토부스를 즐겨보세요!', enabled: false },
      flowerChild: { title: '화동 안내', content: '', enabled: false },
      customItems: [],
    },
  },

  gallery: {
    images: [
      '/demo/gallery1.jpg',
      '/demo/gallery2.jpg',
      '/demo/gallery3.jpg',
      '/demo/gallery4.jpg',
      '/demo/gallery5.jpg',
      '/demo/gallery6.jpg',
    ],
  },

  media: {
    coverImage: '/demo/cover.jpg',
    infoImage: '/demo/info.jpg',
    bgm: '/audio/wedding-bgm.mp3',
  },

  rsvpEnabled: true,
  rsvpDeadline: '2025-05-17',
  rsvpAllowGuestCount: true,

  // Section visibility toggles
  sectionVisibility: {
    coupleProfile: true,
    ourStory: true,
    interview: true,
    guidance: true,
    bankAccounts: true,
    guestbook: true,
  },

  // Design settings
  design: {
    introAnimation: 'fade-in' as const,
    coverTitle: 'OUR WEDDING',
    sectionDividers: {
      invitation: 'INVITATION',
      ourStory: 'OUR STORY',
      aboutUs: 'ABOUT US',
      interview: 'INTERVIEW',
      gallery: 'GALLERY',
      information: 'INFORMATION',
      location: 'LOCATION',
      rsvp: 'RSVP',
      thankYou: 'THANK YOU',
      guestbook: 'GUESTBOOK',
    },
  },

  // Background music settings
  bgm: {
    enabled: true,
    url: '/audio/wedding-bgm.mp3',
    autoplay: true,
  },

  // Guidance section
  guidance: {
    enabled: false,
    title: '행복한 시간을 위한 안내',
    content: '',
    image: '',
    imageSettings: { scale: 1, positionX: 0, positionY: 0 },
  },
}

// Props interface for InvitationClient
interface InvitationClientProps {
  invitation: Invitation
  content: InvitationContent | null
  isPaid: boolean
}

// Type for display invitation data
type DisplayInvitation = typeof mockInvitation

// Transform DB data to the expected format
function transformToDisplayData(dbInvitation: Invitation, content: InvitationContent | null): DisplayInvitation {
  if (!content) {
    // Return mock data as fallback
    return mockInvitation
  }

  return {
    id: dbInvitation.id,
    colorTheme: (content.colorTheme || 'classic-rose') as ColorTheme,
    fontStyle: (content.fontStyle || 'romantic') as FontStyle,
    groom: content.groom || mockInvitation.groom,
    bride: content.bride || mockInvitation.bride,
    wedding: content.wedding || mockInvitation.wedding,
    relationship: content.relationship || mockInvitation.relationship,
    content: content.content || mockInvitation.content,
    gallery: content.gallery || mockInvitation.gallery,
    media: content.media || mockInvitation.media,
    rsvpEnabled: content.rsvpEnabled ?? true,
    rsvpDeadline: content.rsvpDeadline || '',
    rsvpAllowGuestCount: content.rsvpAllowGuestCount ?? true,
    sectionVisibility: content.sectionVisibility || mockInvitation.sectionVisibility,
    design: content.design || mockInvitation.design,
    bgm: content.bgm || mockInvitation.bgm,
    guidance: content.guidance || mockInvitation.guidance,
  } as unknown as DisplayInvitation
}

function formatDateDisplay(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  const y = date.getFullYear(), m = date.getMonth() + 1, day = date.getDate()
  const w = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${y}년 ${m}월 ${day}일 ${w}요일`
}

function formatDateShort(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  const y = date.getFullYear(), m = date.getMonth() + 1, day = date.getDate()
  const w = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
  return `${y}.${m}.${day} ${w}`
}

function calculateDday(d: string): string {
  if (!d) return ''
  const wedding = new Date(d), today = new Date()
  today.setHours(0, 0, 0, 0); wedding.setHours(0, 0, 0, 0)
  const diff = Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? `D-${diff}` : diff === 0 ? 'D-Day' : `D+${Math.abs(diff)}`
}

// Calculate anniversary stats (days, weeks, years/months)
function calculateAnniversary(startDate: string): { days: number; weeks: number; yearsMonths: string } {
  if (!startDate) return { days: 0, weeks: 0, yearsMonths: '0년 0개월' }

  const start = new Date(startDate), today = new Date()
  start.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0)

  // Days calculation (start date counts as day 1)
  const diffTime = today.getTime() - start.getTime()
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

  // Weeks calculation
  const weeks = Math.floor(days / 7)

  // Years/months calculation
  let years = today.getFullYear() - start.getFullYear()
  let months = today.getMonth() - start.getMonth()

  if (today.getDate() < start.getDate()) {
    months--
  }
  if (months < 0) {
    years--
    months += 12
  }

  return {
    days,
    weeks,
    yearsMonths: `${years}년 ${months}개월`
  }
}

// Format date as "November 4, 2026"
function formatDateEnglish(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

// Types for page components
type PageType = 'intro' | 'main'
type DirectionsTab = 'car' | 'subway' | 'bus' | 'parking'

interface PageProps {
  invitation: typeof mockInvitation
  fonts: FontConfig
  themeColors: ColorConfig
  onNavigate: (page: PageType) => void
  onScreenChange?: (screen: 'cover' | 'invitation') => void
  onOpenRsvp?: () => void
}

// Intro Page Component - Screen-based transitions like original template
type IntroScreen = 'cover' | 'invitation'

function IntroPage({ invitation, fonts, themeColors, onNavigate, onScreenChange }: PageProps) {
  const [showDirections, setShowDirections] = useState(false)
  const [directionsTab, setDirectionsTab] = useState<DirectionsTab>('car')

  // Cinematic intro states
  const [cinematicActive, setCinematicActive] = useState(false)
  const [showText, setShowText] = useState(false)
  const [cinematicHidden, setCinematicHidden] = useState(false)
  const [cinematicFadeOut, setCinematicFadeOut] = useState(false)
  const [coverAnimated, setCoverAnimated] = useState(false)

  // Screen transition states
  const [currentScreen, setCurrentScreen] = useState<IntroScreen>('cover')
  const [screenFadeOut, setScreenFadeOut] = useState(false)
  const [invitationAnimated, setInvitationAnimated] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Touch handling for swipe
  const touchStartY = useRef(0)

  // Trigger cinematic animations on mount - matching original template timing
  useEffect(() => {
    const bgTimer = setTimeout(() => setCinematicActive(true), 100)
    const textTimer = setTimeout(() => setShowText(true), 1000)
    const fadeOutTimer = setTimeout(() => setCinematicFadeOut(true), 3200)
    const coverTimer = setTimeout(() => setCoverAnimated(true), 3500)
    const hideTimer = setTimeout(() => setCinematicHidden(true), 4200)

    return () => {
      clearTimeout(bgTimer)
      clearTimeout(textTimer)
      clearTimeout(fadeOutTimer)
      clearTimeout(coverTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  // Switch screen function - matching original template
  const switchScreen = (from: IntroScreen, to: IntroScreen) => {
    if (screenFadeOut) return // Prevent double transition

    setScreenFadeOut(true)

    setTimeout(() => {
      setCurrentScreen(to)
      setScreenFadeOut(false)

      // Trigger invitation animations
      if (to === 'invitation') {
        setTimeout(() => setInvitationAnimated(true), 50)
        // Show tooltip after 1.5s
        setTimeout(() => setShowTooltip(true), 1500)
      }
      // Notify parent of screen change
      onScreenChange?.(to)
    }, 500)
  }

  // Cover screen event handlers
  const handleCoverClick = () => {
    if (currentScreen === 'cover') {
      switchScreen('cover', 'invitation')
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY
    if (touchStartY.current - touchEndY > 50) {
      // Swipe up
      if (currentScreen === 'cover') {
        switchScreen('cover', 'invitation')
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentScreen === 'cover') {
      switchScreen('cover', 'invitation')
    }
  }

  // Invitation screen click -> go to main
  const handleInvitationClick = (e: React.MouseEvent) => {
    // Don't trigger on button clicks
    if ((e.target as HTMLElement).closest('button')) return
    if (currentScreen === 'invitation') {
      onNavigate('main')
    }
  }

  const directions = invitation.wedding.directions
  const availableTabs: { key: DirectionsTab; label: string }[] = [
    { key: 'car', label: '자가용' },
    ...(directions.subway && directions.subway.length > 0 ? [{ key: 'subway' as DirectionsTab, label: '지하철' }] : []),
    ...(directions.bus && (directions.bus.main?.length > 0 || directions.bus.branch?.length > 0) ? [{ key: 'bus' as DirectionsTab, label: '버스' }] : []),
    ...(directions.parking && (directions.parking.location || directions.parking.fee) ? [{ key: 'parking' as DirectionsTab, label: '주차' }] : []),
  ]

  return (
    <div>
      {/* CINEMATIC INTRO - Fixed overlay that auto fades out (matching original template) */}
      {!cinematicHidden && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-center items-center"
          style={{
            background: '#000',
            opacity: cinematicFadeOut ? 0 : 1,
            transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none'
          }}
        >
          {/* Background Image with zoom animation */}
          <div
            className={`cinematic-bg absolute inset-0 ${cinematicActive ? 'active' : ''}`}
            style={{
              backgroundImage: invitation.media.coverImage
                ? `url(${invitation.media.coverImage})`
                : 'linear-gradient(135deg, #333 0%, #111 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(100%)'
            }}
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.45)' }} />

          {/* Cinematic Content */}
          <div className={`cinematic-content relative z-10 text-center ${showText ? 'show' : ''}`}>
            {/* Horizontal Line */}
            <div className="cinematic-line mx-auto mb-5" />

            {/* Welcome Text */}
            <p
              className="cinematic-text text-[16px] font-normal text-white uppercase"
              style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
            >
              Welcome to our wedding
            </p>

            {/* Date in English */}
            <p
              className="cinematic-subtext text-[12px] font-normal mt-3.5"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '2px'
              }}
            >
              {formatDateEnglish(invitation.wedding.date)}
            </p>
          </div>
        </div>
      )}

      {/* COVER SECTION - matching original template exactly */}
      {currentScreen === 'cover' && (
      <section
        className="relative flex flex-col justify-center items-center cursor-pointer"
        style={{
          height: '100vh',
          overflow: 'hidden',
          opacity: screenFadeOut ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}
        onClick={handleCoverClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Cover Background Image - grayscale like original */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: invitation.media.coverImage
              ? `url(${invitation.media.coverImage})`
              : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%)',
            opacity: coverAnimated ? 1 : 0,
            transform: coverAnimated ? 'scale(1)' : 'scale(1.03)',
            transition: 'opacity 1.1s cubic-bezier(0.22, 1, 0.36, 1), transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />

        {/* Cover Overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.3)' }} />

        {/* Cover Content - centered */}
        <div
          className="relative z-10 text-center text-white px-5"
        >
          {/* Names */}
          <p
            style={{
              fontFamily: fonts.displayKr,
              fontSize: '13px',
              fontWeight: 300,
              letterSpacing: '2px',
              marginBottom: '16px',
              opacity: coverAnimated ? 1 : 0,
              transform: coverAnimated ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s'
            }}
          >
            {invitation.groom.name} & {invitation.bride.name}
          </p>

          {/* Main Title */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '24px',
              fontWeight: 400,
              letterSpacing: '6px',
              marginBottom: '18px',
              opacity: coverAnimated ? 1 : 0,
              transform: coverAnimated ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s'
            }}
          >
            {invitation.wedding.title || 'OUR WEDDING'}
          </h1>

          {/* Venue */}
          <p
            style={{
              fontSize: '10px',
              fontWeight: 300,
              letterSpacing: '4px',
              marginBottom: '10px',
              opacity: coverAnimated ? 1 : 0,
              transform: coverAnimated ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.6s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.6s'
            }}
          >
            {invitation.wedding.venue.name}
          </p>

          {/* Date */}
          <p
            style={{
              fontFamily: fonts.displayKr,
              fontSize: '11px',
              fontWeight: 300,
              letterSpacing: '1px',
              opacity: coverAnimated ? 1 : 0,
              transform: coverAnimated ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.8s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.8s'
            }}
          >
            {formatDateDisplay(invitation.wedding.date)} {invitation.wedding.timeDisplay}
          </p>
        </div>

        {/* Scroll indicator - matching original template */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{
            bottom: '50px',
            opacity: coverAnimated ? 1 : 0,
            transition: 'opacity 0.6s ease-out 1.8s'
          }}
        >
          <div
            style={{
              width: '1px',
              height: '32px',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0))'
            }}
          />
          <div
            style={{
              width: '4px',
              height: '4px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '50%',
              animation: coverAnimated ? 'scrollDotMove 2.4s ease-in-out infinite 2s' : 'none'
            }}
          />
        </div>
      </section>
      )}

      {/* Invitation Section - with staggered animations matching original template */}
      {currentScreen === 'invitation' && (
      <section
        id="invitation-section"
        className={`invitation-section px-7 py-10 text-center ${invitationAnimated ? 'in-view' : ''}`}
        style={{
          background: themeColors.background,
          minHeight: '100vh',
          opacity: screenFadeOut ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}
        onClick={handleInvitationClick}
      >
        {/* INVITATION Title */}
        <p className="invitation-title text-[10px] font-light mb-9" style={{ color: themeColors.gray, letterSpacing: '4px' }}>INVITATION</p>

        {/* Quote Section */}
        {invitation.content.quote.text && (
          <div className="quote-section mb-9">
            {/* Top divider bar with animation */}
            <div className="flex items-center justify-center mb-5">
              <div
                className="divider-bar-left h-[1px] flex-1"
                style={{ background: themeColors.divider }}
              />
              <div
                className="divider-bar-right h-[1px] flex-1"
                style={{ background: themeColors.divider }}
              />
            </div>

            <p className="text-[13px] font-light leading-[1.9] mb-2" style={{ fontFamily: fonts.displayKr, color: themeColors.primary }} dangerouslySetInnerHTML={{ __html: invitation.content.quote.text.replace(/\n/g, '<br/>') }} />
            {invitation.content.quote.author && <p className="text-[11px] font-light mb-5" style={{ color: themeColors.gray }}>{invitation.content.quote.author}</p>}

            {/* Bottom divider bar with animation */}
            <div className="flex items-center justify-center">
              <div
                className="divider-bar-left h-[1px] flex-1"
                style={{ background: themeColors.divider, animationDelay: '0.2s' }}
              />
              <div
                className="divider-bar-right h-[1px] flex-1"
                style={{ background: themeColors.divider, animationDelay: '0.5s' }}
              />
            </div>
          </div>
        )}

        {/* Greeting Section */}
        <div className="greeting-section mb-11">
          <p className="text-[13px] font-light leading-[2.1]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: invitation.content.greeting ? invitation.content.greeting.replace(/\n/g, '<br/>') : '인사말을 입력해주세요' }} />
        </div>

        {/* Parents Info */}
        <div className="parents-section mb-9 text-center" style={{ fontFamily: fonts.displayKr }}>
          <div className="mb-1">
            <p className="text-[11px] font-light leading-[1.5]" style={{ color: themeColors.text }}>
              {invitation.groom.father.name} · {invitation.groom.mother.name}
              <span style={{ color: themeColors.gray }}> 의 아들 </span>
              <span style={{ color: themeColors.primary, fontWeight: 500 }}>{invitation.groom.name}</span>
            </p>
          </div>
          {/* Heart */}
          <div className="my-2">
            <span style={{ color: themeColors.primary, fontSize: '12px' }}>♥</span>
          </div>
          <div>
            <p className="text-[11px] font-light leading-[1.5]" style={{ color: themeColors.text }}>
              {invitation.bride.father.name} · {invitation.bride.mother.name}
              <span style={{ color: themeColors.gray }}> 의 딸 </span>
              <span style={{ color: themeColors.primary, fontWeight: 500 }}>{invitation.bride.name}</span>
            </p>
          </div>
        </div>

        {/* Wedding Info Card */}
        <div className="wedding-info-card rounded-2xl px-6 py-7 mb-9" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)' }}>
          <span className="inline-block text-[9px] font-light px-3 py-1 rounded-full mb-5" style={{ background: '#f0f0f0', color: '#888' }}>Until wedding {calculateDday(invitation.wedding.date)}</span>
          <div className="pb-4 mb-4 border-b border-gray-100">
            <p className="text-lg font-light mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '3px' }}>{formatDateShort(invitation.wedding.date)}</p>
            <p className="text-[11px] font-light" style={{ color: '#777' }}>{invitation.wedding.timeDisplay}</p>
          </div>
          <div className="mb-5">
            <p className="text-xs mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>{invitation.wedding.venue.name} {invitation.wedding.venue.hall}</p>
            <p className="text-[10px] font-light" style={{ color: '#999' }}>{invitation.wedding.venue.address || '주소를 입력해주세요'}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDirections(true)
            }}
            className="px-7 py-2.5 border border-gray-300 rounded-md text-[10px] font-light"
            style={{ color: '#666' }}
          >
            오시는 길
          </button>
        </div>

        {/* Next Story Navigation */}
        <div className="next-story-section flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate('main')
            }}
            className="text-[11px] font-light"
            style={{ color: themeColors.gray }}
          >
            Next Story
          </button>
          <div className="flex flex-col items-center mt-4">
            <div
              style={{
                width: '1px',
                height: '32px',
                background: `linear-gradient(to bottom, ${themeColors.gray}60, transparent)`
              }}
            />
            <div
              style={{
                width: '4px',
                height: '4px',
                background: themeColors.gray,
                borderRadius: '50%',
                animation: 'scrollDotMove 2.4s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </section>
      )}

      {/* Directions Modal */}
      {showDirections && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDirections(false)} />
          <div
            className="relative w-full max-w-lg rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto"
            style={{ background: themeColors.cardBg }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium" style={{ color: themeColors.text }}>오시는 길</h3>
              <button onClick={() => setShowDirections(false)} className="p-2 rounded-full hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Venue Info */}
            <div className="mb-6 p-4 rounded-xl" style={{ background: themeColors.sectionBg }}>
              <p className="text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                {invitation.wedding.venue.name} {invitation.wedding.venue.hall}
              </p>
              <p className="text-xs" style={{ color: themeColors.gray }}>{invitation.wedding.venue.address}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {availableTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDirectionsTab(tab.key)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    directionsTab === tab.key
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={directionsTab === tab.key ? { background: themeColors.primary } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {directionsTab === 'car' && directions.car && (
                <div className="space-y-3">
                  {directions.car.desc && (
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-xs font-medium mb-1" style={{ color: themeColors.gray }}>네비게이션</p>
                      <p className="text-sm" style={{ color: themeColors.text }}>{directions.car.desc}</p>
                    </div>
                  )}
                  {directions.car.route && (
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-xs font-medium mb-1" style={{ color: themeColors.gray }}>경로 안내</p>
                      <p className="text-sm" style={{ color: themeColors.text }}>{directions.car.route}</p>
                    </div>
                  )}
                </div>
              )}

              {directionsTab === 'subway' && directions.subway && (
                <div className="space-y-2">
                  {directions.subway.map((line, i) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50">
                      <p className="text-sm" style={{ color: themeColors.text }}>{line}</p>
                    </div>
                  ))}
                </div>
              )}

              {directionsTab === 'bus' && directions.bus && (
                <div className="space-y-3">
                  {directions.bus.main && directions.bus.main.length > 0 && (
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-xs font-medium mb-2" style={{ color: themeColors.gray }}>간선버스</p>
                      <div className="flex flex-wrap gap-2">
                        {directions.bus.main.map((bus, i) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {bus}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {directions.bus.branch && directions.bus.branch.length > 0 && (
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-xs font-medium mb-2" style={{ color: themeColors.gray }}>지선버스</p>
                      <div className="flex flex-wrap gap-2">
                        {directions.bus.branch.map((bus, i) => (
                          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {bus}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {directionsTab === 'parking' && directions.parking && (
                <div className="space-y-3">
                  {directions.parking.location && (
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-xs font-medium mb-1" style={{ color: themeColors.gray }}>주차장 위치</p>
                      <p className="text-sm" style={{ color: themeColors.text }}>{directions.parking.location}</p>
                    </div>
                  )}
                  {directions.parking.fee && (
                    <div className="p-4 rounded-xl bg-gray-50">
                      <p className="text-xs font-medium mb-1" style={{ color: themeColors.gray }}>주차 요금</p>
                      <p className="text-sm" style={{ color: themeColors.text }}>{directions.parking.fee}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: '#03C75A' }}
                onClick={() => window.open(`https://map.naver.com/v5/search/${encodeURIComponent(invitation.wedding.venue.address)}`, '_blank')}
              >
                네이버 지도
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium text-black"
                style={{ background: '#FEE500' }}
                onClick={() => window.open(`https://map.kakao.com/?q=${encodeURIComponent(invitation.wedding.venue.address)}`, '_blank')}
              >
                카카오맵
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speech Bubble Tooltip */}
      {currentScreen === 'invitation' && (
        <div
          className="fixed z-50 transition-all duration-300"
          style={{
            bottom: '80px',
            right: '8px',
            opacity: showTooltip ? 1 : 0,
            visibility: showTooltip ? 'visible' : 'hidden',
            transform: showTooltip ? 'translateY(0)' : 'translateY(10px)'
          }}
        >
          <div
            className="relative px-4 py-2.5 rounded-2xl text-xs text-gray-700 whitespace-nowrap"
            style={{
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            결혼식 정보는 여기에서
            {/* Speech bubble tail */}
            <div
              className="absolute"
              style={{
                bottom: '-8px',
                right: '20px',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid #fff',
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
              }}
            />
          </div>
        </div>
      )}

    </div>
  )
}

// Main Page Component - matching template exactly
function MainPage({ invitation, fonts, themeColors, onNavigate, onOpenRsvp }: PageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const handleNextQuestion = () => {
    const questions = invitation.content.guestbookQuestions
    if (questions.length > 0) {
      setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
    }
  }

  return (
    <div className="relative">
      {/* Back to Intro Button */}
      <button
        onClick={() => onNavigate('intro')}
        className="fixed top-4 left-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-light"
        style={{
          background: 'rgba(255,255,255,0.9)',
          color: themeColors.gray,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Intro
      </button>

      {/* Mini Hero */}
      <section className="relative h-[200px] flex items-end justify-center" style={{ backgroundImage: invitation.media.coverImage ? `url(${invitation.media.coverImage})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="relative z-10 text-center text-white pb-8"><p className="text-xs font-light" style={{ fontFamily: fonts.displayKr, letterSpacing: '1.5px' }}>{invitation.groom.name} & {invitation.bride.name}<br/>Getting Married</p></div>
      </section>

      {/* Title Section - with divider bar animations */}
      <DividerSection
        lines={[
          `${invitation.groom.name} & ${invitation.bride.name}`,
          'Getting Married'
        ]}
        dividerColor={themeColors.divider}
        fontFamily={fonts.displayKr}
        textColor={themeColors.text}
        bgColor={themeColors.cardBg}
        isChapterBreak={true}
      />

      {/* Wave Divider - transitions to section background */}
      {invitation.sectionVisibility?.coupleProfile !== false && invitation.bride.profile.intro && (
        <div className="relative w-full h-[60px] overflow-hidden" style={{ background: themeColors.cardBg }}>
          <svg
            viewBox="0 0 2880 120"
            preserveAspectRatio="none"
            className="absolute bottom-0 w-[250%] h-full"
            style={{ left: '-5%' }}
          >
            <path
              className="wave-back"
              d="M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40 T1800,40 T2160,40 T2520,40 T2880,40 L2880,120 L0,120 Z"
              style={{ fill: themeColors.sectionBg, opacity: 0.3, animation: 'waveBack 8s ease-in-out infinite' }}
            />
            <path
              className="wave-mid"
              d="M0,50 Q240,90 480,50 T960,50 T1440,50 T1920,50 T2400,50 T2880,50 L2880,120 L0,120 Z"
              style={{ fill: themeColors.sectionBg, opacity: 0.5, animation: 'waveMid 6s ease-in-out infinite' }}
            />
            <path
              className="wave-front"
              d="M0,70 Q360,100 720,70 T1440,70 T2160,70 T2880,70 L2880,120 L0,120 Z"
              style={{ fill: themeColors.sectionBg, animation: 'waveFront 7s ease-in-out infinite' }}
            />
          </svg>
        </div>
      )}

      {/* Bride Profile Section - with visibility toggle */}
      {invitation.sectionVisibility?.coupleProfile !== false && invitation.bride.profile.intro && (
        <ProfileSection
          profile={invitation.bride.profile}
          fonts={fonts}
          themeColors={themeColors}
          bgColor={themeColors.sectionBg}
        />
      )}

      {/* Groom Profile Section - with visibility toggle */}
      {invitation.sectionVisibility?.coupleProfile !== false && invitation.groom.profile.intro && (
        <ProfileSection
          profile={invitation.groom.profile}
          fonts={fonts}
          themeColors={themeColors}
          bgColor={themeColors.sectionBg}
        />
      )}

      {/* Our Story Title Section - with divider bar animations and visibility toggle */}
      {invitation.sectionVisibility?.ourStory !== false && invitation.relationship.stories.some(s => s.title || s.desc) && (
        <DividerSection
          lines={['Beginning of Love', 'Our Moments']}
          dividerColor={themeColors.divider}
          fontFamily={fonts.displayKr}
          textColor={themeColors.text}
          bgColor={themeColors.cardBg}
          isChapterBreak={true}
        />
      )}

      {/* Story Items - with staggered animations and visibility toggle */}
      {invitation.sectionVisibility?.ourStory !== false && invitation.relationship.stories.map((story, index) => story.title || story.desc ? (
        <StorySection
          key={index}
          story={story}
          fonts={fonts}
          themeColors={themeColors}
        />
      ) : null)}

      {/* Anniversary Counter Section - with visibility toggle */}
      {invitation.sectionVisibility?.ourStory !== false && invitation.relationship.startDate && (() => {
        const anniversary = calculateAnniversary(invitation.relationship.startDate)
        const closingText = invitation.relationship.closingText || '그리고 이제 드디어 부르는 서로의 이름에 \'신랑\', \'신부\'라는 호칭을 담습니다.'
        return (
          <AnimatedSection
            className="py-14 px-7 text-center"
            style={{ background: `linear-gradient(180deg, ${themeColors.sectionBg} 0%, ${themeColors.cardBg} 100%)` }}
          >
            {/* 3-column numbers */}
            <div className="flex justify-center items-baseline gap-8 mb-10">
              <div className="text-center">
                <p className="text-[16px] font-normal" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
                  {anniversary.days.toLocaleString()}
                  <span className="text-[10px] font-light ml-0.5" style={{ color: themeColors.gray }}>일</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-normal" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
                  {anniversary.weeks.toLocaleString()}
                  <span className="text-[10px] font-light ml-0.5" style={{ color: themeColors.gray }}>주</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-normal" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
                  {anniversary.yearsMonths}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-5 mx-auto mb-7" style={{ background: themeColors.divider }} />

            {/* Closing Message */}
            <p
              className="text-[11px] font-light leading-[2]"
              style={{ fontFamily: fonts.displayKr, color: themeColors.gray }}
              dangerouslySetInnerHTML={{ __html: closingText.replace(/\n/g, '<br/>') }}
            />
          </AnimatedSection>
        )
      })()}

      {/* Gallery Section */}
      <AnimatedSection className="px-5 py-10" style={{ background: themeColors.cardBg }}>
        <div className="grid grid-cols-2 gap-2">
          {invitation.gallery.images && invitation.gallery.images.length > 0 ? invitation.gallery.images.map((img, i) => (
            <div key={i} className="aspect-square rounded overflow-hidden">
              <div className="w-full h-full bg-cover bg-center bg-gray-100" style={{ backgroundImage: img ? `url(${img})` : undefined }} />
            </div>
          )) : [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square rounded bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Interview Title Section - with divider bar animations and visibility toggle */}
      {invitation.sectionVisibility?.interview !== false && invitation.content.interviews.some(i => i.question || i.answer) && (
        <DividerSection
          lines={['About Marriage', 'Our Story']}
          dividerColor={themeColors.divider}
          fontFamily={fonts.displayKr}
          textColor={themeColors.text}
          bgColor={themeColors.cardBg}
          isChapterBreak={true}
        />
      )}

      {/* Interview Items - with visibility toggle */}
      {invitation.sectionVisibility?.interview !== false && invitation.content.interviews.map((interview, index) => interview.question || interview.answer ? (
        <InterviewSection
          key={index}
          interview={interview}
          fonts={fonts}
          themeColors={themeColors}
          bgColor={index % 2 === 0 ? themeColors.sectionBg : themeColors.cardBg}
        />
      ) : null)}

      {/* Info Section - matching original template */}
      <section
        className="px-6 py-14"
        style={{ background: `linear-gradient(180deg, ${themeColors.sectionBg} 0%, ${themeColors.background} 100%)` }}
      >
        {/* Info Photo */}
        {invitation.media.infoImage && (
          <AnimatedSection className="mb-10">
            <div
              className="w-full aspect-[4/5] rounded-2xl bg-cover bg-center"
              style={{
                backgroundImage: `url(${invitation.media.infoImage})`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)'
              }}
            />
          </AnimatedSection>
        )}

        {/* Section Title */}
        <AnimatedSection className="text-center mb-8">
          <h3
            className="text-[15px] relative inline-block"
            style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}
          >
            행복한 시간을 위한 안내
          </h3>
          <div className="w-10 h-px mx-auto mt-4" style={{ background: themeColors.divider }} />
        </AnimatedSection>

        {/* Dress Code Block */}
        {invitation.content.info.dressCode.enabled && (
          <InfoBlock
            title={invitation.content.info.dressCode.title}
            content={invitation.content.info.dressCode.content}
            fonts={fonts}
            themeColors={themeColors}
          />
        )}

        {/* Photo Share Block */}
        {invitation.content.info.photoShare.enabled && (
          <InfoBlock
            title={invitation.content.info.photoShare.title}
            content={invitation.content.info.photoShare.content}
            buttonText={invitation.content.info.photoShare.buttonText}
            buttonUrl={invitation.content.info.photoShare.url}
            fonts={fonts}
            themeColors={themeColors}
          />
        )}
      </section>

      {/* Thank You Section */}
      <AnimatedSection className="min-h-[300px] flex flex-col justify-center items-center text-center px-7 py-20" style={{ background: themeColors.sectionBg }}>
        <h2 className="text-lg mb-7" style={{ fontFamily: fonts.display, color: themeColors.text, fontWeight: 400, letterSpacing: '4px' }}>{invitation.content.thankYou.title}</h2>
        {invitation.content.thankYou.message ? (
          <p className="text-[11px] font-light leading-[2.2] mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: invitation.content.thankYou.message.replace(/\n/g, '<br/>') }} />
        ) : (
          <p className="text-[11px] text-gray-400 italic mb-7">감사 메시지를 입력해주세요</p>
        )}
        {invitation.content.thankYou.sign && <p className="text-[11px] font-light" style={{ fontFamily: fonts.displayKr, color: themeColors.gray }}>{invitation.content.thankYou.sign}</p>}
      </AnimatedSection>

      {/* Wave Divider before Guestbook */}
      <div className="relative w-full h-[60px] overflow-hidden" style={{ background: themeColors.sectionBg }}>
        <svg
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-[250%] h-full"
          style={{ left: '-5%' }}
        >
          <path
            className="wave-back"
            d="M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40 T1800,40 T2160,40 T2520,40 T2880,40 L2880,120 L0,120 Z"
            style={{ fill: themeColors.cardBg, opacity: 0.3, animation: 'waveBack 8s ease-in-out infinite' }}
          />
          <path
            className="wave-mid"
            d="M0,50 Q240,90 480,50 T960,50 T1440,50 T1920,50 T2400,50 T2880,50 L2880,120 L0,120 Z"
            style={{ fill: themeColors.cardBg, opacity: 0.5, animation: 'waveMid 6s ease-in-out infinite' }}
          />
          <path
            className="wave-front"
            d="M0,70 Q360,100 720,70 T1440,70 T2160,70 T2880,70 L2880,120 L0,120 Z"
            style={{ fill: themeColors.cardBg, animation: 'waveFront 7s ease-in-out infinite' }}
          />
        </svg>
      </div>

      {/* Guestbook Section - with visibility toggle */}
      {invitation.sectionVisibility?.guestbook !== false && (
        <AnimatedSection className="px-5 py-14 pb-20 text-center" style={{ background: themeColors.cardBg }}>
          <h3 className="text-sm mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>Guestbook</h3>
          <div className="max-w-[300px] mx-auto mb-9">
            <p className="text-xs font-light leading-[1.7] mb-4 min-h-[40px]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>{invitation.content.guestbookQuestions[currentQuestionIndex] || '두 사람에게 하고 싶은 말을 남겨주세요'}</p>
            <div className="flex gap-2 mb-2.5">
              <input type="text" className="flex-1 px-3.5 py-3 border border-gray-200 rounded-lg text-[11px] font-light" style={{ background: '#fafafa', color: themeColors.text }} placeholder="20자 이내" />
              <button className="px-4 py-3 rounded-lg text-[10px] font-light text-white" style={{ background: themeColors.text }}>등록</button>
            </div>
            {invitation.content.guestbookQuestions.length > 1 && (
              <button
                onClick={handleNextQuestion}
                className="text-[10px] font-light cursor-pointer hover:underline active:opacity-70 transition-all"
                style={{ color: themeColors.primary }}
              >
                다른 질문 보기 →
              </button>
            )}
          </div>
          <div className="relative min-h-[200px]">
            <div className="absolute w-[130px] px-3 py-3.5 bg-[#FFF9F0] rounded-lg text-left shadow-sm" style={{ transform: 'rotate(-3deg)', top: '10px', left: '20px' }}>
              <p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">두 사람에게 하고 싶은 말?</p>
              <p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>행복하세요!</p>
            </div>
            <div className="absolute w-[130px] px-3 py-3.5 bg-[#F0F7FF] rounded-lg text-left shadow-sm" style={{ transform: 'rotate(2deg)', top: '80px', right: '20px' }}>
              <p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">결혼생활에서 가장 중요한 건?</p>
              <p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>서로를 믿는 것</p>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* RSVP Section */}
      {invitation.rsvpEnabled && (
        <AnimatedSection className="px-6 py-14 text-center" style={{ background: themeColors.cardBg }}>
          <p className="text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>RSVP</p>
          <p className="text-sm mb-4" style={{ color: '#666' }}>참석 여부를 알려주세요</p>
          <button
            onClick={() => onOpenRsvp?.()}
            className="w-full py-3 rounded-lg text-xs"
            style={{ background: themeColors.primary, color: '#fff' }}
          >
            참석 여부 전달하기
          </button>
          {invitation.rsvpDeadline && <p className="text-[10px] font-light mt-3" style={{ color: '#999' }}>마감일: {formatDateShort(invitation.rsvpDeadline)}</p>}
        </AnimatedSection>
      )}

      {/* Footer */}
      <div className="px-6 py-10 text-center" style={{ background: themeColors.background }}>
        <p className="text-[10px] font-light" style={{ color: '#999' }}>Thank you for celebrating with us</p>
        <p className="text-[9px] font-light mt-2" style={{ color: '#ccc' }}>Made with dear drawer</p>
      </div>
    </div>
  )
}

export default function InvitationClient({ invitation: dbInvitation, content, isPaid }: InvitationClientProps) {
  // Transform DB data to display format
  const invitation = transformToDisplayData(dbInvitation, content)

  const [currentPage, setCurrentPage] = useState<PageType>('intro')
  const [introScreen, setIntroScreen] = useState<'cover' | 'invitation'>('cover')
  const audioRef = useRef<HTMLAudioElement>(null)
  const [openModalType, setOpenModalType] = useState<'none' | 'rsvp'>('none')

  const themeColors = colorThemes[invitation.colorTheme]
  const fonts = fontStyles[invitation.fontStyle]

  // Show floating button only on invitation screen or main page
  const showFloatingButton = currentPage === 'main' || (currentPage === 'intro' && introScreen === 'invitation')

  // Show music toggle only on main page
  const showMusicToggle = currentPage === 'main' && !!invitation.media.bgm

  // Scroll to appropriate position when page changes
  useEffect(() => {
    if (currentPage === 'main') {
      // Scroll past the mini hero (200px) to show divider section at top
      window.scrollTo(0, 200)
    } else {
      window.scrollTo(0, 0)
    }
  }, [currentPage])

  // Prepare contacts for FloatingButton
  const contacts = [
    invitation.groom.phone && { name: invitation.groom.name, phone: invitation.groom.phone, role: '신랑', side: 'groom' as const },
    invitation.groom.father.phone && { name: invitation.groom.father.name, phone: invitation.groom.father.phone, role: '아버지', side: 'groom' as const },
    invitation.groom.mother.phone && { name: invitation.groom.mother.name, phone: invitation.groom.mother.phone, role: '어머니', side: 'groom' as const },
    invitation.bride.phone && { name: invitation.bride.name, phone: invitation.bride.phone, role: '신부', side: 'bride' as const },
    invitation.bride.father.phone && { name: invitation.bride.father.name, phone: invitation.bride.father.phone, role: '아버지', side: 'bride' as const },
    invitation.bride.mother.phone && { name: invitation.bride.mother.name, phone: invitation.bride.mother.phone, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; phone: string; role: string; side: 'groom' | 'bride' }[]

  // Prepare accounts for FloatingButton
  const accounts = [
    { name: invitation.groom.name, bank: invitation.groom.bank, role: '신랑', side: 'groom' as const },
    { name: invitation.bride.name, bank: invitation.bride.bank, role: '신부', side: 'bride' as const },
  ]

  return (
    <div
      className={`relative w-full min-h-screen overflow-x-hidden theme-${invitation.colorTheme}`}
      style={{
        backgroundColor: themeColors.background,
        fontFamily: fonts.body,
        color: themeColors.text,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      {/* Page Content */}
      {currentPage === 'intro' ? (
        <IntroPage
          invitation={invitation}
          fonts={fonts}
          themeColors={themeColors}
          onNavigate={setCurrentPage}
          onScreenChange={setIntroScreen}
        />
      ) : (
        <MainPage
          invitation={invitation}
          fonts={fonts}
          themeColors={themeColors}
          onNavigate={setCurrentPage}
          onOpenRsvp={() => setOpenModalType('rsvp')}
        />
      )}

      {/* Floating Button */}
      {showFloatingButton && (
        <GuestFloatingButton
          themeColors={themeColors}
          fonts={fonts}
          openModal={openModalType}
          onModalClose={() => setOpenModalType('none')}
          showTooltip={currentPage === 'intro' && introScreen === 'invitation'}
          invitation={{
            venue_name: invitation.wedding.venue.name,
            venue_address: invitation.wedding.venue.address,
            contacts,
            accounts,
            directions: invitation.wedding.directions,
            rsvpEnabled: invitation.rsvpEnabled,
            rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
            invitationId: invitation.id,
          }}
        />
      )}

      {/* Music Toggle */}
      <MusicToggle audioRef={audioRef} isVisible={showMusicToggle} shouldAutoPlay={currentPage === 'main'} />

      {/* Background Music */}
      {invitation.media.bgm && (
        <audio ref={audioRef} loop preload="auto">
          <source src={invitation.media.bgm} type="audio/mpeg" />
        </audio>
      )}
    </div>
  )
}
