'use client'

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import ProfileImageSlider from '@/components/editor/ProfileImageSlider'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'
import IntroAnimation from '@/components/invitation/IntroAnimation'
import { IntroSettings, getDefaultIntroSettings } from '@/lib/introPresets'
import { parseHighlight } from '@/lib/textUtils'

// 이미지 크롭 스타일 계산 헬퍼 함수
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

  // 기존 scale/position 방식 (호환성 유지)
  return {
    backgroundImage: `url(${img})`,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
  }
}

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
      className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95"
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

// 국화 아이콘 (고인 표시 - 꽃 스타일)
const ChrysanthemumIcon = () => (
  <img
    src="/icons/chrysanthemum.svg"
    alt="고인"
    className="inline w-3 h-3 mr-0.5 opacity-70 align-middle"
    style={{ verticalAlign: 'middle', marginTop: '-2px' }}
  />
);

// 한자 故 표시 (고인 표시 - 한자 스타일)
const HanjaDeceasedIcon = () => (
  <span className="inline-block mr-0.5 text-[10px] opacity-70">故</span>
);

// 부모님 이름 표시 (고인 시 선택된 스타일로 표시)
const ParentName = ({ name, deceased, displayStyle = 'flower' }: { name: string; deceased?: boolean; displayStyle?: 'hanja' | 'flower' }) => (
  <span>
    {deceased && (displayStyle === 'hanja' ? <HanjaDeceasedIcon /> : <ChrysanthemumIcon />)}
    {name}
  </span>
);

// Global CSS Animations - matching original template
const globalStyles = `
  /* Typography System - 3 Tiers */
  .typo-title {
    font-size: 18px;
    letter-spacing: 0.5px;
    line-height: 1.4;
    font-weight: 300;
  }

  .typo-body {
    font-size: 13px;
    letter-spacing: -0.3px;
    line-height: 1.6;
    font-weight: 300;
  }

  .typo-caption {
    font-size: 10px;
    letter-spacing: 1px;
    line-height: 1.5;
    font-weight: 300;
  }

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
    padding: 80px 28px;
  }

  .divider-section.chapter-break {
    min-height: 50vh;
    padding: 48px 28px;
  }

  .divider-line {
    width: 1px;
    height: 40px;
    margin: 24px 0;
    transform: scaleY(0);
    transition: transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .divider-line.top {
    transform-origin: bottom center;
  }

  .divider-line.bottom {
    transform-origin: top center;
    transition-delay: 1.5s;
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
    transition: opacity 2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                letter-spacing 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .divider-text-mask .text-line:nth-child(2) {
    transition-delay: 0.5s;
  }

  .divider-section.in-view .divider-text-mask .text-line {
    opacity: 1;
    letter-spacing: 3px;
    transform: scaleX(1);
  }

  .divider-section.in-view .divider-text-mask .text-line:nth-child(2) {
    transition-delay: 0.6s;
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
    animation: fadeInUp 1s ease forwards;
  }

  .quote-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .quote-section {
    animation: fadeInUp 1s ease forwards;
    animation-delay: 0.4s;
  }

  .greeting-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .greeting-section {
    animation: fadeInUp 1s ease forwards;
    animation-delay: 0.8s;
  }

  .parents-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .parents-section {
    animation: fadeInUp 1s ease forwards;
    animation-delay: 1.2s;
  }

  .wedding-info-card {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .wedding-info-card {
    animation: fadeInUp 1s ease forwards;
    animation-delay: 1.6s;
  }

  .next-story-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .next-story-section {
    animation: fadeInUp 1s ease forwards;
    animation-delay: 2s;
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
    transition: width 4s ease-out, left 4s ease-out;
  }

  .profile-label-animated.revealed::after {
    width: 100%;
    left: 0;
  }

  /* Gallery Lightbox */
  .gallery-lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }

  .gallery-lightbox.active {
    opacity: 1;
    visibility: visible;
  }

  .gallery-lightbox-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .gallery-lightbox-slides {
    display: flex;
    width: 100%;
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .gallery-lightbox-slide {
    min-width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .gallery-lightbox-slide img {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .gallery-lightbox-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    z-index: 10;
    transition: color 0.2s ease;
  }

  .gallery-lightbox-close:hover {
    color: #fff;
  }

  .gallery-lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    z-index: 10;
    transition: color 0.2s ease;
  }

  .gallery-lightbox-nav:hover {
    color: #fff;
  }

  .gallery-lightbox-nav.prev {
    left: 16px;
  }

  .gallery-lightbox-nav.next {
    right: 16px;
  }

  .gallery-lightbox-counter {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    letter-spacing: 2px;
  }

  body.lightbox-open {
    overflow: hidden;
  }

  /* Anniversary Counter Sequential Animation */
  .anniversary-counter {
    opacity: 1;
  }

  .anniversary-counter .counter-item {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }

  .anniversary-counter.in-view .counter-item:nth-child(1) {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0s;
  }

  .anniversary-counter.in-view .counter-item:nth-child(2) {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0.3s;
  }

  .anniversary-counter.in-view .counter-item:nth-child(3) {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0.6s;
  }

  .anniversary-counter .counter-divider {
    transform: scaleY(0);
    transform-origin: top center;
    transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transition-delay: 0s;
  }

  .anniversary-counter.in-view .counter-divider {
    transform: scaleY(1);
    transition-delay: 1.1s;
  }

  .anniversary-counter .counter-text {
    opacity: 0;
    transform: translateY(15px);
    transition: opacity 1s ease, transform 1s ease;
    transition-delay: 0s;
  }

  .anniversary-counter.in-view .counter-text {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 1.6s;
  }

  /* Guestbook Modal */
  .guestbook-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(250, 250, 250, 0.55);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }

  .guestbook-modal.active {
    opacity: 1;
    visibility: visible;
  }

  .guestbook-modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: #fff;
    border: none;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #999;
    transition: transform 0.2s;
    z-index: 10;
  }

  .guestbook-modal-close:hover {
    transform: scale(1.1);
  }

  .guestbook-stack {
    position: relative;
    width: 280px;
    height: 360px;
    perspective: 1000px;
  }

  .guestbook-stack-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 200px;
    padding: 32px 28px;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    text-align: center;
    transition: transform 0.4s ease, opacity 0.4s ease;
    touch-action: manipulation;
    cursor: grab;
    -webkit-user-select: none;
    user-select: none;
  }

  .guestbook-stack-card:active {
    cursor: grabbing;
  }

  .guestbook-stack-card:nth-child(2) {
    transform: translateY(20px) scale(0.95);
    opacity: 0.7;
    z-index: -1;
  }

  .guestbook-stack-card:nth-child(3) {
    transform: translateY(40px) scale(0.9);
    opacity: 0.4;
    z-index: -2;
  }

  .guestbook-stack-card:nth-child(n+4) {
    transform: translateY(50px) scale(0.85);
    opacity: 0;
    z-index: -3;
  }

  .guestbook-stack-card.swiping {
    transition: none;
  }

  .guestbook-stack-card.swipe-up {
    transform: translateY(-150%) rotate(-5deg);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .guestbook-stack-card.swipe-down {
    transform: translateY(150%) rotate(5deg);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .guestbook-swipe-hint {
    position: absolute;
    bottom: -50px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    color: #aaa;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .guestbook-swipe-hint::before {
    content: '↑';
    font-size: 16px;
    animation: swipeHintBounce 1.5s ease-in-out infinite;
  }

  @keyframes swipeHintBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  body.guestbook-modal-open {
    overflow: hidden;
  }

  body.guestbook-modal-open .mobile-frame-fixed-ui {
    visibility: hidden;
    pointer-events: none;
  }

  /* Desktop Mobile Frame Wrapper - No phone frame, clean display */
  @media (min-width: 768px) {
    .desktop-frame-wrapper {
      min-height: 100vh;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 0;
    }

    .mobile-frame {
      position: relative;
      width: 430px;
      min-height: 100vh;
      background: #fff;
      box-shadow: 0 0 40px rgba(0,0,0,0.1);
    }

    .mobile-frame-screen {
      width: 100%;
      height: 100%;
      background: #fff;
      overflow: hidden;
      position: relative;
    }

    .mobile-frame-content {
      width: 100%;
      min-height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      position: relative;
      transform: translateZ(0);
    }

    .mobile-frame-content::-webkit-scrollbar {
      display: none;
    }

    .mobile-frame-content {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Fixed UI container - positioned relative to mobile-frame-screen */
    .mobile-frame-fixed-ui {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 40;
    }

    .mobile-frame-fixed-ui > * {
      pointer-events: auto;
    }

    /* Override fixed positioning for elements inside fixed-ui container */
    .mobile-frame-fixed-ui .fixed {
      position: absolute !important;
    }

    /* Ensure inset-0 works correctly for overlays */
    .mobile-frame-fixed-ui .inset-0 {
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      left: 0 !important;
    }

    /* Fix bottom sheet positioning */
    .mobile-frame-fixed-ui .bottom-0 {
      bottom: 0 !important;
    }

    .mobile-frame-fixed-ui .left-0 {
      left: 0 !important;
    }

    .mobile-frame-fixed-ui .right-0 {
      right: 0 !important;
    }

    /* Fix modal centering */
    .mobile-frame-fixed-ui .inset-x-4 {
      left: 1rem !important;
      right: 1rem !important;
    }

    .mobile-frame-fixed-ui .top-1\/2 {
      top: 50% !important;
    }

    .mobile-frame-fixed-ui .-translate-y-1\/2 {
      transform: translateY(-50%) !important;
    }
  }

  @media (max-width: 767px) {
    .desktop-frame-wrapper {
      display: contents;
    }

    .mobile-frame {
      display: contents;
    }

    .mobile-frame-screen {
      display: contents;
    }

    .mobile-frame-content {
      display: contents;
    }

    .mobile-frame-fixed-ui {
      display: contents;
    }
  }

  /* Okticon Font for Romantic Style */
  @font-face {
    font-family: 'Okticon';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/Ownglyph_okticon-Bd.woff2') format('woff2');
    font-weight: 700;
    font-display: swap;
  }

  /* 로맨틱 폰트 크기 보정 */
  .font-romantic .text-\[11px\] { font-size: 12px !important; }
  .font-romantic .text-\[13px\] { font-size: 14px !important; }
  .font-romantic .text-xs { font-size: 13px !important; }
  .font-romantic .text-sm { font-size: 15px !important; }

  /* Full Height Divider Section (FAMILY Template) */
  @font-face {
    font-family: 'StrongComfort';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/naverfont_07@1.0/Kanginhan.woff') format('woff');
    font-weight: normal;
    font-display: swap;
  }

  .full-height-divider {
    position: relative;
    min-height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    overflow: hidden;
  }

  .full-height-divider-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    /* background-size와 background-position은 인라인 스타일로 제어 (getImageCropStyle) */
  }

  .full-height-divider-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.5) 50%,
      rgba(0, 0, 0, 0.4) 100%
    );
    z-index: 1;
  }

  .full-height-divider-content {
    position: relative;
    z-index: 2;
    padding: 60px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .full-height-divider-english {
    font-family: 'Cormorant Garamond', 'Times New Roman', serif;
    font-size: 14px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 2px;
    text-align: center;
    width: 100%;
    word-break: keep-all;
    overflow-wrap: break-word;
  }

  .full-height-divider-korean {
    font-family: 'StrongComfort', cursive;
    font-size: 26px;
    font-weight: normal;
    color: #ffffff;
    line-height: 1.7;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  }

  .full-height-divider-quote {
    position: relative;
  }

  /* Line Expand Divider */
  .line-expand-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 50px 24px;
    background: #ffffff;
  }

  .line-expand-wrapper {
    position: relative;
    width: 100%;
    max-width: 200px;
    height: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .line-expand-center {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(212, 165, 165, 0.6);
  }

  .line-expand-left,
  .line-expand-right {
    position: absolute;
    top: 50%;
    height: 1px;
    background: rgba(212, 165, 165, 0.4);
    transform: translateY(-50%);
  }

  .line-expand-left {
    --direction: left;
    right: 50%;
    margin-right: 6px;
  }

  .line-expand-right {
    --direction: right;
    left: 50%;
    margin-left: 6px;
  }

  /* Signature Animation */
  .signature-text {
    display: inline-block;
    background: linear-gradient(90deg, currentColor 50%, transparent 50%);
    background-size: 200% 100%;
    background-position: 100% 0;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .signature-text.revealed {
    animation: signatureReveal 1.5s ease-out 2.8s forwards;
  }

  @keyframes signatureReveal {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: 0% 0;
    }
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

// Section Highlight Context - for dimming inactive sections
const SectionHighlightContext = createContext<{
  activeSection: string
  registerSection: (id: string, ratio: number) => void
}>({
  activeSection: '',
  registerSection: () => {},
})

function useSectionHighlight(sectionId: string) {
  const ref = useRef<HTMLDivElement>(null)
  const { activeSection, registerSection } = useContext(SectionHighlightContext)
  const [hasAppeared, setHasAppeared] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAppeared) {
          setHasAppeared(true)
        }
        registerSection(sectionId, entry.intersectionRatio)
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-10% 0px -10% 0px'
      }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sectionId, registerSection, hasAppeared])

  const isActive = activeSection === sectionId

  return { ref, isActive, hasAppeared }
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

// Gallery Lightbox Component - Infinite Loop
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
  const [currentIndex, setCurrentIndex] = useState(initialIndex + 1) // +1 for clone
  const [isTransitioning, setIsTransitioning] = useState(false)
  const slidesRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  // Reset to initial index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex + 1)
      document.body.classList.add('lightbox-open')
    } else {
      document.body.classList.remove('lightbox-open')
    }
  }, [isOpen, initialIndex])

  // Handle infinite loop transition end
  useEffect(() => {
    const slides = slidesRef.current
    if (!slides) return

    const handleTransitionEnd = () => {
      setIsTransitioning(false)
      if (currentIndex === 0) {
        setCurrentIndex(images.length)
        slides.style.transition = 'none'
        slides.style.transform = `translateX(-${images.length * 100}%)`
      } else if (currentIndex === images.length + 1) {
        setCurrentIndex(1)
        slides.style.transition = 'none'
        slides.style.transform = `translateX(-100%)`
      }
    }

    slides.addEventListener('transitionend', handleTransitionEnd)
    return () => slides.removeEventListener('transitionend', handleTransitionEnd)
  }, [currentIndex, images.length])

  const goToPrev = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    if (slidesRef.current) {
      slidesRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
    setCurrentIndex(prev => prev - 1)
  }, [isTransitioning])

  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    if (slidesRef.current) {
      slidesRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
    setCurrentIndex(prev => prev + 1)
  }, [isTransitioning])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, goToPrev, goToNext])

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext()
      else goToPrev()
    }
  }

  // Calculate display index (1-based)
  let displayIndex = currentIndex
  if (currentIndex === 0) displayIndex = images.length
  else if (currentIndex === images.length + 1) displayIndex = 1

  if (!isOpen || images.length === 0) return null

  return (
    <div className={`gallery-lightbox ${isOpen ? 'active' : ''}`}>
      <div className="gallery-lightbox-container" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        {/* Close Button */}
        <button className="gallery-lightbox-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Prev Button */}
        <button className="gallery-lightbox-nav prev" onClick={goToPrev}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Slides */}
        <div
          ref={slidesRef}
          className="gallery-lightbox-slides"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Last clone */}
          <div className="gallery-lightbox-slide">
            <img src={images[images.length - 1]} alt="갤러리 이미지" />
          </div>
          {/* Actual slides */}
          {images.map((img, i) => (
            <div key={i} className="gallery-lightbox-slide">
              <img src={img} alt={`갤러리 이미지 ${i + 1}`} />
            </div>
          ))}
          {/* First clone */}
          <div className="gallery-lightbox-slide">
            <img src={images[0]} alt="갤러리 이미지" />
          </div>
        </div>

        {/* Next Button */}
        <button className="gallery-lightbox-nav next" onClick={goToNext}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Counter */}
        <div className="gallery-lightbox-counter">
          {displayIndex} / {images.length}
        </div>
      </div>
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
              lineHeight: 1.6
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

// Staggered Text Component - 글자별 순차 등장 효과
function StaggeredText({
  text,
  isVisible,
  delay = 0,
  charDelay = 0.05,
  className,
}: {
  text: string
  isVisible: boolean
  delay?: number
  charDelay?: number
  className?: string
}) {
  const lines = text.split('\n')

  return (
    <span className={className}>
      {lines.map((line, lineIndex) => {
        // 이전 줄들의 총 글자 수 계산 (딜레이용)
        const previousCharsCount = lines
          .slice(0, lineIndex)
          .reduce((sum, l) => sum + l.length, 0)

        return (
          <span key={lineIndex}>
            {line.split('').map((char, charIndex) => {
              const totalIndex = previousCharsCount + charIndex
              const charDelayTime = delay + totalIndex * charDelay

              return (
                <span
                  key={charIndex}
                  className="staggered-char"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    filter: isVisible ? 'blur(0)' : 'blur(8px)',
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.6s ease ${charDelayTime}s, filter 0.6s ease ${charDelayTime}s, transform 0.6s ease ${charDelayTime}s`,
                    display: 'inline-block',
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              )
            })}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        )
      })}
    </span>
  )
}

// Full Height Divider Section Component (FAMILY Template)
function FullHeightDividerSection({
  englishTitle,
  koreanText,
  image,
  imageSettings,
}: {
  englishTitle: string
  koreanText: string
  image?: string
  imageSettings?: {
    scale?: number
    positionX?: number
    positionY?: number
    cropX?: number
    cropY?: number
    cropWidth?: number
    cropHeight?: number
    grayscale?: number
    opacity?: number
  }
}) {
  const { ref, isVisible } = useScrollAnimation()

  const settings = imageSettings || {
    grayscale: 100,
    opacity: 100,
  }

  return (
    <div
      ref={ref}
      className={`full-height-divider ${isVisible ? 'in-view' : ''}`}
    >
      {/* Background Image */}
      {image && (
        <div
          className="full-height-divider-bg"
          style={{
            ...getImageCropStyle(image, settings),
            filter: `grayscale(${settings.grayscale ?? 100}%)`,
            opacity: (settings.opacity ?? 100) / 100,
          }}
        />
      )}

      {/* Overlay */}
      <div className="full-height-divider-overlay" />

      {/* Content */}
      <div className="full-height-divider-content">
        {/* English Title - Staggered Effect */}
        <p className="full-height-divider-english">
          <StaggeredText text={englishTitle} isVisible={isVisible} delay={0.3} charDelay={0.04} />
        </p>

        {/* Korean Text - Staggered Effect */}
        <div className="full-height-divider-quote">
          <p className="full-height-divider-korean">
            <StaggeredText text={koreanText} isVisible={isVisible} delay={1.5} charDelay={0.06} />
          </p>
        </div>
      </div>
    </div>
  )
}

// Line Expand Divider Section Component - 선 확장 애니메이션
function LineExpandDividerSection() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div ref={ref} className="line-expand-divider">
      <div className="line-expand-wrapper">
        <div
          className="line-expand-left"
          style={{
            width: isVisible ? '50%' : '0%',
            opacity: isVisible ? 1 : 0,
            transition: 'all 2.5s ease-out 0.3s',
          }}
        />
        <div
          className="line-expand-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0)',
            transition: 'all 0.8s ease-out',
          }}
        />
        <div
          className="line-expand-right"
          style={{
            width: isVisible ? '50%' : '0%',
            opacity: isVisible ? 1 : 0,
            transition: 'all 2.5s ease-out 0.3s',
          }}
        />
      </div>
    </div>
  )
}

// Parent Intro Section Component - 부모님 소개 섹션
function ParentIntroSection({
  parentNames,
  childOrder,
  childName,
  images,
  message,
  side,
  fonts,
  themeColors,
  textStyle,
}: {
  parentNames: string // "전아빠, 김엄마의"
  childOrder: string // "첫째"
  childName: string // "해온"
  images: string[]
  message: string
  side: 'groom' | 'bride'
  fonts: FontConfig
  themeColors: ColorConfig
  textStyle?: { lineHeight?: number; textAlign?: 'left' | 'center' | 'right' }
}) {
  const { ref, isVisible } = useScrollAnimation()
  const [currentSlide, setCurrentSlide] = useState(0)

  // 2장 이상일 때 자동 슬라이드
  useEffect(() => {
    if (images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length)
    }, 4000) // 4초마다 전환

    return () => clearInterval(interval)
  }, [images.length])

  const sideLabel = side === 'groom' ? '아들' : '딸'

  return (
    <div
      ref={ref}
      className="py-16"
      style={{ background: '#ffffff' }}
    >
      {/* Title */}
      <div className={`${side === 'groom' ? 'text-left' : 'text-right'} mb-8 px-6`}>
        <p
          className="typo-caption mb-2"
          style={{ color: themeColors.gray, fontFamily: fonts.body }}
        >
          <StaggeredText text={parentNames} isVisible={isVisible} delay={0.2} charDelay={0.04} />
        </p>
        <p
          className="typo-title font-light"
          style={{ color: themeColors.text, fontFamily: fonts.body }}
        >
          <StaggeredText text={`${childOrder === '표기안함' ? '' : childOrder + ' '}${sideLabel}, `} isVisible={isVisible} delay={0.8} charDelay={0.05} />
          <span style={{ color: themeColors.accent }}>
            <StaggeredText text={childName?.slice(1) || ''} isVisible={isVisible} delay={1.2} charDelay={0.08} />
          </span>
          <StaggeredText text=" 결혼합니다." isVisible={isVisible} delay={1.5} charDelay={0.05} />
        </p>
      </div>

      {/* Image Slider - 4:3 비율, 전체너비 */}
      <div
        className="relative w-full mb-10 overflow-hidden"
        style={{
          aspectRatio: '4/3',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 1.5s ease 0.3s, transform 1.5s ease 0.3s',
        }}
      >
        {images.map((img, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: currentSlide === index ? 1 : 0,
            }}
          >
            <img
              src={img}
              alt={`가족사진 ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* 슬라이드 인디케이터 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: currentSlide === index ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                  transform: currentSlide === index ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Message */}
      <div
        className="px-6"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 1.5s ease 0.6s, transform 1.5s ease 0.6s',
        }}
      >
        <p
          className="typo-body"
          style={{
            color: themeColors.text,
            fontFamily: fonts.body,
            lineHeight: textStyle?.lineHeight || 2.0,
            textAlign: textStyle?.textAlign || (side === 'groom' ? 'left' : 'right'),
          }}
          dangerouslySetInnerHTML={{ __html: parseHighlight(message) }}
        />
      </div>
    </div>
  )
}

// Why We Chose Section Title Component
function WhyWeChoseTitleSection({
  title,
  subtitle,
  fonts,
  themeColors,
}: {
  title: string
  subtitle: string
  fonts: FontConfig
  themeColors: ColorConfig
}) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div
      ref={ref}
      className="pb-8 px-7"
      style={{ background: '#ffffff', paddingTop: '64px' }}
    >
      <h2
        className="typo-title font-light mb-2"
        style={{
          color: themeColors.text,
          fontFamily: fonts.displayKr,
        }}
      >
        <StaggeredText text={title} isVisible={isVisible} delay={0.2} charDelay={0.05} />
      </h2>
      <p
        className="typo-body"
        style={{
          color: themeColors.gray,
          fontFamily: fonts.body,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1) 1s, transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 1s',
        }}
      >
        {subtitle}
      </p>
    </div>
  )
}

// Why We Chose Section Component - 서로를 선택한 이유
function WhyWeChoseSection({
  images,
  imageSettings,
  description,
  quote,
  name,
  side,
  fonts,
  themeColors,
  textStyle,
}: {
  images: string[]
  imageSettings?: { scale: number; positionX: number; positionY: number }[]
  description: string
  quote: string
  name: string
  side: 'groom' | 'bride'
  fonts: FontConfig
  themeColors: ColorConfig
  textStyle?: { lineHeight?: number; textAlign?: 'left' | 'center' | 'right' }
}) {
  const { ref, isVisible } = useScrollAnimation()
  const sideLabel = side === 'groom' ? '신랑' : '신부'

  // 강조 텍스트 처리 (** 로 감싼 텍스트를 강조색으로)
  const renderDescription = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={index} style={{ color: themeColors.highlight || themeColors.primary, fontWeight: 400 }}>
            {part.slice(2, -2)}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div
      ref={ref}
      className="pb-20 px-7"
      style={{ background: '#ffffff' }}
    >
      {/* Image Slider */}
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.98)',
          transition: 'opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1), transform 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <ProfileImageSlider
          images={images}
          imageSettings={imageSettings}
          className="mb-12"
        />
      </div>

      {/* Description Card with Grid Pattern */}
      <div
        className="relative overflow-hidden"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(35px)',
          transition: 'opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s, transform 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
        }}
      >
        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0"
          style={{
            background: themeColors.cardBg,
            backgroundImage: `
              linear-gradient(to right, ${themeColors.text}08 1px, transparent 1px),
              linear-gradient(to bottom, ${themeColors.text}08 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            border: `1px solid ${themeColors.text}20`,
          }}
        />

        {/* Content */}
        <div className="relative py-10 px-6">
          <p
            className="typo-body whitespace-pre-line"
            style={{
              color: themeColors.text,
              fontFamily: fonts.body,
              lineHeight: textStyle?.lineHeight || 2.2,
              textAlign: textStyle?.textAlign || 'center',
            }}
          >
            {renderDescription(description)}
          </p>
        </div>
      </div>

      {/* Quote Section */}
      <div
        className={`mt-20 ${side === 'groom' ? 'text-right' : 'text-left'}`}
      >
        {/* Quote Text - Word by Word */}
        <p
          className="typo-title mb-4"
          style={{
            color: themeColors.text,
            fontFamily: fonts.displayKr,
          }}
        >
          <span
            style={{
              opacity: isVisible ? 0.4 : 0,
              transition: 'opacity 0.8s ease-out',
            }}
          >
            &ldquo;
          </span>
          {quote.split(' ').map((word, index) => (
            <span
              key={index}
              style={{
                display: 'inline-block',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
                transition: `opacity 1.2s ease-out ${0.5 + index * 0.7}s, transform 1.2s ease-out ${0.5 + index * 0.7}s`,
                marginRight: '0.3em',
              }}
            >
              {word}
            </span>
          ))}
          <span
            style={{
              opacity: isVisible ? 0.4 : 0,
              transition: `opacity 0.8s ease-out ${0.3 + quote.split(' ').length * 0.4}s`,
            }}
          >
            &rdquo;
          </span>
        </p>

        {/* Attribution - Signature Style */}
        <p
          className="typo-caption"
          style={{ fontFamily: fonts.displayKr }}
        >
          <span
            className={`signature-text ${isVisible ? 'revealed' : ''}`}
            style={{ color: themeColors.gray }}
          >
            {sideLabel} {name}
          </span>
        </p>
      </div>
    </div>
  )
}

// Profile Section Component - with animated underline label
function ProfileSection({
  profile,
  fonts,
  themeColors,
  bgColor,
  textStyle,
}: {
  profile: { images: string[]; imageSettings?: { scale: number; positionX: number; positionY: number }[]; aboutLabel: string; subtitle: string; intro: string; tag?: string }
  fonts: FontConfig
  themeColors: ColorConfig
  bgColor: string
  textStyle?: { lineHeight?: number; textAlign?: 'left' | 'center' | 'right' }
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
      className="px-7 py-10"
      style={{ background: bgColor }}
    >
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 2.5s ease, transform 2.5s ease',
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
          className={`profile-label-animated typo-caption mb-1.5 ${labelRevealed ? 'revealed' : ''}`}
          style={{
            fontFamily: fonts.display,
            color: themeColors.gray,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 2.5s ease 0.5s, transform 2.5s ease 0.5s',
          }}
        >
          {profile.aboutLabel}
        </p>
        <p
          className="typo-caption"
          style={{
            color: '#999',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 2.5s ease 1s, transform 2.5s ease 1s',
          }}
        >
          {profile.subtitle}
        </p>
      </div>
      <div
        className="typo-body"
        style={{
          fontFamily: fonts.displayKr,
          color: themeColors.text,
          lineHeight: textStyle?.lineHeight || 2.2,
          textAlign: textStyle?.textAlign || 'left',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 2.5s ease 1.5s, transform 2.5s ease 1.5s',
        }}
        dangerouslySetInnerHTML={{ __html: parseHighlight(profile.intro) }}
      />
      {profile.tag && (
        <div
          className="inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md typo-caption"
          style={{
            background: 'rgba(0,0,0,0.03)',
            color: '#777',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 2.5s ease 2s, transform 2.5s ease 2s',
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
      className="px-6 py-6 mb-4"
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
        className={`profile-label-animated typo-body mb-4 flex items-center gap-2 ${titleRevealed ? 'revealed' : ''}`}
        style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 600 }}
      >
        <span
          className="w-[3px] h-[14px] rounded-sm flex-shrink-0"
          style={{ background: themeColors.accent }}
        />
        {title}
      </h4>

      {/* Content */}
      <p
        className="typo-body leading-[1.8]"
        style={{ color: '#666' }}
        dangerouslySetInnerHTML={{ __html: parseHighlight(content) }}
      />

      {/* Optional Button */}
      {buttonText && buttonUrl && (
        <button
          onClick={() => window.open(buttonUrl, '_blank')}
          className="mt-4 px-5 py-2.5 typo-caption transition-all hover:opacity-80"
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
  textStyle,
}: {
  interview: { question?: string; answer?: string; images?: string[] }
  fonts: FontConfig
  themeColors: ColorConfig
  bgColor: string
  textStyle?: { lineHeight?: number; textAlign?: 'left' | 'center' | 'right' }
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
      className="px-7 py-10"
      style={{ background: bgColor }}
    >
      {/* Images - Auto Slide for 2+ images */}
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 2.5s ease, transform 2.5s ease',
        }}
      >
        {interview.images && interview.images.length > 0 ? (
          <ProfileImageSlider
            images={interview.images}
            imageSettings={(interview as any).imageSettings || []}
            className="mb-8"
          />
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
            transition: 'opacity 2.5s ease 0.5s, transform 2.5s ease 0.5s',
          }}
        >
          <p
            className={`profile-label-animated typo-body font-light inline-block ${titleRevealed ? 'revealed' : ''}`}
            style={{ fontFamily: fonts.displayKr, color: themeColors.text }}
          >
            {interview.question}
          </p>
        </div>
      )}

      {/* Answer */}
      {interview.answer && (
        <p
          className="typo-body"
          style={{
            fontFamily: fonts.displayKr,
            color: themeColors.text,
            lineHeight: textStyle?.lineHeight || 2.0,
            textAlign: textStyle?.textAlign || 'left',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 2.5s ease 1.5s, transform 2.5s ease 1.5s',
          }}
          dangerouslySetInnerHTML={{ __html: parseHighlight(interview.answer) }}
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
        padding: '40px 28px',
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
          className="story-title font-light"
          style={{
            fontFamily: fonts.displayKr,
            fontSize: '15px',
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
            fontSize: '13px',
            fontWeight: 300,
            color: '#777',
            lineHeight: 1.6,
            marginBottom: '28px'
          }}
          dangerouslySetInnerHTML={{ __html: parseHighlight(story.desc) }}
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
          {story.images.slice(0, 3).map((img, i) => {
            const imgSettings = (story as any).imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }
            return (
              <div
                key={i}
                className={story.images!.length === 3 && i === 0 ? 'col-span-2' : ''}
                style={{
                  aspectRatio: story.images!.length === 3 && i === 0 ? '2/1' : '1',
                  ...(img ? getImageCropStyle(img, imgSettings) : {}),
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// Anniversary Counter Section Component with Sequential Animation
function AnniversaryCounterSection({
  startDate,
  closingText,
  fonts,
  themeColors,
}: {
  startDate: string
  closingText?: string
  fonts: FontConfig
  themeColors: ColorConfig
}) {
  const { ref, isVisible } = useScrollAnimation()
  const anniversary = calculateAnniversary(startDate)
  const displayClosingText = closingText || '그리고 이제 드디어 부르는 서로의 이름에 \'신랑\', \'신부\'라는 호칭을 담습니다.'

  return (
    <div
      ref={ref}
      className={`anniversary-counter ${isVisible ? 'in-view' : ''}`}
      style={{
        padding: '40px 28px',
        textAlign: 'center',
        background: `linear-gradient(180deg, ${themeColors.sectionBg} 0%, ${themeColors.cardBg} 100%)`
      }}
    >
      {/* 3-column numbers */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '32px', marginBottom: '40px' }}>
        <div className="counter-item" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: fonts.displayKr, fontSize: '16px', fontWeight: 400, color: themeColors.text }}>
            {anniversary.days.toLocaleString()}
            <span style={{ fontSize: '10px', fontWeight: 300, marginLeft: '2px', color: themeColors.gray }}>일</span>
          </p>
        </div>
        <div className="counter-item" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: fonts.displayKr, fontSize: '16px', fontWeight: 400, color: themeColors.text }}>
            {anniversary.weeks.toLocaleString()}
            <span style={{ fontSize: '10px', fontWeight: 300, marginLeft: '2px', color: themeColors.gray }}>주</span>
          </p>
        </div>
        <div className="counter-item" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: fonts.displayKr, fontSize: '16px', fontWeight: 400, color: themeColors.text }}>
            {anniversary.yearsMonths}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        className="counter-divider"
        style={{
          width: '1px',
          height: '20px',
          margin: '0 auto 28px',
          background: themeColors.divider
        }}
      />

      {/* Closing Message */}
      <p
        className="counter-text"
        style={{
          fontFamily: fonts.displayKr,
          fontSize: '13px',
          fontWeight: 300,
          lineHeight: 1.6,
          color: themeColors.gray
        }}
        dangerouslySetInnerHTML={{ __html: parseHighlight(displayClosingText) }}
      />
    </div>
  )
}

// Color themes
type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string; highlight?: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#C41050', secondary: '#B8956A', accent: '#B8956A', background: '#FFF8F5', sectionBg: '#FFE8E8', cardBg: '#FFFFFF', divider: '#d4b896', text: '#3d3d3d', gray: '#555555' },
  'modern-black': { primary: '#111111', secondary: '#555555', accent: '#111111', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#3d3d3d', gray: '#555555', highlight: '#888888' },
  'romantic-blush': { primary: '#A67A7A', secondary: '#8a7068', accent: '#8a7068', background: '#FDF8F6', sectionBg: '#F8EFEC', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#3d3d3d', gray: '#555555' },
  'nature-green': { primary: '#3A5A3A', secondary: '#6A7A62', accent: '#5A7A52', background: '#F5F7F4', sectionBg: '#EBF0E8', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3d3d3d', gray: '#555555', highlight: '#5A8A52' },
  'luxury-navy': { primary: '#0f2035', secondary: '#8A6A3A', accent: '#8A6A3A', background: '#F8F9FA', sectionBg: '#E8ECF0', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#3d3d3d', gray: '#555555', highlight: '#8A6A3A' },
  'sunset-coral': { primary: '#B85040', secondary: '#B88060', accent: '#B8683A', background: '#FFFAF7', sectionBg: '#FFEEE5', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#3d3d3d', gray: '#555555' },
}

// Font styles
type FontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'
interface FontConfig { display: string; displayKr: string; body: string }

const fontStyles: Record<FontStyle, FontConfig> = {
  classic: { display: "'Playfair Display', serif", displayKr: "'Ridibatang', serif", body: "'Ridibatang', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Pretendard', sans-serif", body: "'Pretendard', sans-serif" },
  romantic: { display: "'Lora', serif", displayKr: "'Okticon', serif", body: "'Okticon', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'JeonnamEducationBarun', sans-serif", body: "'JeonnamEducationBarun', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'ELandChoice', serif", body: "'ELandChoice', serif" },
}

// Mock invitation data
const mockInvitation = {
  id: 'demo-invitation-id',
  colorTheme: 'classic-rose' as ColorTheme,
  fontStyle: 'romantic' as FontStyle,
  accentTextColor: undefined as string | undefined,
  bodyTextColor: undefined as string | undefined,
  whyWeChoseTextStyle: undefined as { lineHeight?: number; textAlign?: 'left' | 'center' | 'right' } | undefined,

  groom: {
    name: '김민준',
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
    },
    directions: {
      car: '네비게이션: 더채플앳청담 또는 서울시 강남구 청담동 123-45\n주차: 건물 지하 1~3층 주차장 이용 가능 (3시간 무료)',
      publicTransport: '[지하철]\n압구정로데오역 5번 출구 도보 10분\n청담역 9번 출구 도보 15분\n\n[버스]\n간선: 146, 301, 401\n지선: 3422, 4412',
      train: '',
      expressBus: '',
      shuttle: '',
      extraInfoEnabled: false,
      extraInfoText: '',
    },
  },

  relationship: {
    startDate: '2020-03-15',
    stories: [
      {
        date: '2020.03',
        title: '운명처럼 다가온 만남',
        desc: '친구의 소개로 처음 만났던 그 날,\n어색한 인사를 나누며 시작된 우리의 이야기.\n카페에서 나눈 세 시간의 대화가\n우리 사랑의 첫 페이지가 되었습니다.',
        images: ['/sample/story1-1.png', '/sample/story1-2.png'],
      },
      {
        date: '2022.12',
        title: '함께한 첫 해외여행',
        desc: '제주도부터 시작해 일본, 유럽까지.\n함께 떠난 여행에서 서로를 더 깊이 알게 되었고,\n어떤 상황에서도 함께라면 즐거울 수 있다는 걸 깨달았습니다.',
        images: ['/sample/story2-1.png', '/sample/story2-2.png'],
      },
      {
        date: '2024.09',
        title: '프러포즈',
        desc: '우리가 처음 만났던 그 카페에서,\n떨리는 마음으로 건넨 반지와 함께\n평생을 약속했습니다.',
        images: ['/sample/story3-1.jpeg', '/sample/story3-2.png'],
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
        question: '상대방의 첫인상은 어땠나요?',
        answer: '처음 본 순간, 이 사람이다 싶었어요. 말로 설명하기 어려운 느낌이었는데, 대화를 나눌수록 확신이 들었습니다. 서로의 눈을 바라보며 웃던 그 순간을 잊을 수 없어요.',
        images: ['/sample/interview1-1.png', '/sample/interview1-2.png'],
        bgClass: 'pink-bg',
      },
      {
        question: '결혼을 결심하게 된 계기는?',
        answer: '함께 있을 때 가장 나다울 수 있었어요. 아무리 힘든 일이 있어도 이 사람 곁에 있으면 괜찮아지더라구요. 평생 이 사람과 함께라면 어떤 일이든 해낼 수 있을 것 같았습니다.',
        images: ['/sample/interview2-1.png', '/sample/interview2-2.png'],
        bgClass: 'white-bg',
      },
      {
        question: '앞으로의 결혼생활 계획은?',
        answer: '서로를 존중하고 배려하며 살고 싶어요. 작은 일상에서도 감사함을 잊지 않고, 함께 웃으며 나이 들어가고 싶습니다. 무엇보다 서로의 꿈을 응원하는 부부가 되고 싶어요.',
        images: ['/sample/interview3-1.png', '/sample/interview3-2.png'],
        bgClass: 'pink-bg',
      },
    ],
    guestbookQuestions: [
      '두 사람에게 해주고 싶은 말은?',
      '결혼생활에서 가장 중요한 건?',
      '두 사람의 첫인상은 어땠나요?',
    ],
    info: {
      dressCode: { title: '드레스코드', content: '단정한 복장으로 와주세요.\n흰색 계열 의상은 피해주시면 감사하겠습니다.', enabled: true },
      photoShare: { title: '사진 공유', content: '결혼식 사진을 공유해주세요!', buttonText: '사진 공유하기', url: '', enabled: false },
      photoBooth: { title: '포토부스', content: '로비에서 포토부스를 즐겨보세요!', enabled: false },
      flowerChild: { title: '화동 안내', content: '귀여운 화동이 함께합니다.\n화동: 김예은 (5세)', enabled: true },
      flowerGift: { title: '꽃 답례품 안내', content: '참석해주신 분들께\n감사의 마음을 담아\n작은 꽃다발을 준비했습니다.', enabled: true },
      wreath: { title: '화환 안내', content: '', enabled: false },
      shuttle: { title: '셔틀버스 안내', content: '강남역 10번 출구 앞\n13:00 / 13:30 / 14:00\n\n잠실역 8번 출구 앞\n13:00 / 13:30', enabled: true },
      reception: { title: '피로연 안내', content: '', enabled: false },
      customItems: [] as { id: string; title: string; content: string; enabled: boolean }[],
      itemOrder: ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception'],
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
    coverImageSettings: undefined as { scale?: number; positionX?: number; positionY?: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number } | undefined,
    infoImage: '/demo/info.jpg',
    bgm: '/samples/parents/wedding-bgm.mp3',
  },

  rsvpEnabled: true,
  rsvpDeadline: '2025-05-17',
  rsvpAllowGuestCount: true,

  // 고인 표시 스타일
  deceasedDisplayStyle: 'flower',

  profileTextStyle: undefined as { lineHeight: number; textAlign: 'left' | 'center' | 'right' } | undefined,
  interviewTextStyle: undefined as { lineHeight: number; textAlign: 'left' | 'center' | 'right' } | undefined,
  parentIntroTextStyle: undefined as { lineHeight: number; textAlign: 'left' | 'center' | 'right' } | undefined,

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
    url: '/samples/parents/wedding-bgm.mp3',
    autoplay: true,
  },

  // Intro animation settings
  intro: getDefaultIntroSettings('cinematic'),

  // Guidance section
  guidance: {
    enabled: true,
    title: '행복한 시간을 위한 안내',
    content: '',
    image: '/sample/info.png',
    imageSettings: { scale: 1, positionX: 0, positionY: 0 },
  },
}

// Guest info type
interface GuestInfo {
  id: string
  name: string
  relation: string | null
  honorific: string
  introGreeting: string | null
  customMessage: string | null
}

// Props interface for InvitationClient
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
    profileTextStyle: content.profileTextStyle,
    interviewTextStyle: content.interviewTextStyle,
    parentIntroTextStyle: content.parentIntroTextStyle,
    sectionVisibility: content.sectionVisibility || mockInvitation.sectionVisibility,
    design: content.design || mockInvitation.design,
    bgm: content.bgm || mockInvitation.bgm,
    guidance: content.guidance || mockInvitation.guidance,
    intro: content.intro || mockInvitation.intro,
    fullHeightDividers: content.fullHeightDividers,
    parentIntro: content.parentIntro,
    whyWeChose: content.whyWeChose,
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
type DirectionsTab = 'car' | 'publicTransport' | 'train' | 'expressBus' | 'shuttle'

interface PageProps {
  invitation: typeof mockInvitation
  invitationId: string
  fonts: FontConfig
  themeColors: ColorConfig
  onNavigate: (page: PageType) => void
  onScreenChange?: (screen: 'cover' | 'invitation') => void
  onOpenRsvp?: () => void
  onOpenLightbox?: (index: number) => void
  onOpenGuestbookModal?: (index: number, messages: GuestbookMessage[]) => void
  audioRef?: React.RefObject<HTMLAudioElement | null>
  showMusicToggle?: boolean
  shouldAutoPlay?: boolean
  isSample?: boolean
  introSettings?: IntroSettings
}

// 방명록 메시지 타입
interface GuestbookMessage {
  id: string
  guest_name: string
  message: string
  question: string | null
  created_at: string
}

// Intro Page Component - Screen-based transitions like original template
type IntroScreen = 'cover' | 'invitation'

function IntroPage({ invitation, invitationId: _invitationId, fonts, themeColors, onNavigate, onScreenChange, introSettings }: PageProps) {
  const [showDirections, setShowDirections] = useState(false)

  // 첫 번째 가능한 탭으로 초기화
  const directions = invitation.wedding.directions
  const getFirstAvailableTab = (): DirectionsTab => {
    if (directions.car) return 'car'
    if (directions.publicTransport) return 'publicTransport'
    if (directions.train) return 'train'
    if (directions.expressBus) return 'expressBus'
    if (directions.shuttle) return 'shuttle'
    return 'car'
  }
  const [directionsTab, setDirectionsTab] = useState<DirectionsTab>(getFirstAvailableTab)

  // Intro animation states (using IntroAnimation component)
  const [introComplete, setIntroComplete] = useState(false)
  const [showIntroAnimation, setShowIntroAnimation] = useState(true)
  const [coverAnimated, setCoverAnimated] = useState(false)

  // Screen transition states
  const [currentScreen, setCurrentScreen] = useState<IntroScreen>('cover')
  const [screenFadeOut, setScreenFadeOut] = useState(false)
  const [invitationAnimated, setInvitationAnimated] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Touch handling for swipe
  const touchStartY = useRef(0)

  // Get intro settings from invitation or use default
  const effectiveIntroSettings = introSettings || invitation.intro || getDefaultIntroSettings('cinematic')

  // Handle intro animation complete
  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true)
    setTimeout(() => {
      setShowIntroAnimation(false)
      setCoverAnimated(true)
    }, 500)
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

  const availableTabs: { key: DirectionsTab; label: string }[] = [
    ...(directions.car ? [{ key: 'car' as DirectionsTab, label: '자가용' }] : []),
    ...(directions.publicTransport ? [{ key: 'publicTransport' as DirectionsTab, label: '버스/지하철' }] : []),
    ...(directions.train ? [{ key: 'train' as DirectionsTab, label: '기차' }] : []),
    ...(directions.expressBus ? [{ key: 'expressBus' as DirectionsTab, label: '고속버스' }] : []),
    ...(directions.shuttle ? [{ key: 'shuttle' as DirectionsTab, label: '셔틀버스' }] : []),
  ]

  return (
    <div className="relative w-full h-screen">
      {/* INTRO ANIMATION - Using IntroAnimation component based on saved preset */}
      {showIntroAnimation && effectiveIntroSettings?.presetId && (
        <IntroAnimation
          settings={effectiveIntroSettings}
          coverImage={invitation.media.coverImage}
          coverImageSettings={invitation.media.coverImageSettings}
          groomName={invitation.groom.name}
          brideName={invitation.bride.name}
          weddingDate={invitation.wedding.date}
          venueName={invitation.wedding.venue.name}
          onComplete={handleIntroComplete}
          isComplete={introComplete}
        />
      )}

      {/* COVER SECTION - matching original template exactly */}
      {currentScreen === 'cover' && (
      <section
        className="fixed inset-0 flex flex-col justify-center items-center cursor-pointer z-40"
        style={{
          overflow: 'hidden',
          opacity: screenFadeOut ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}
        onClick={handleCoverClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Cover Background Image */}
        <div
          className="absolute inset-0"
          style={{
            ...(invitation.media.coverImage
              ? getImageCropStyle(invitation.media.coverImage, invitation.media.coverImageSettings || {})
              : { background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' }
            ),
            opacity: coverAnimated ? 1 : 0,
            transform: coverAnimated ? 'scale(1)' : 'scale(1.03)',
            transition: 'opacity 1.1s cubic-bezier(0.22, 1, 0.36, 1), transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />

        {/* Cover Overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.3)' }} />

        {/* Cover Content - centered */}
        <div
          className="relative z-10 w-full text-center text-white px-5"
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
        <p className="invitation-title typo-caption mb-9" style={{ color: themeColors.gray }}>INVITATION</p>

        {/* Quote Section */}
        {invitation.content.quote.text && (
          <div className="quote-section mb-9">
            <p className="typo-body" style={{ fontFamily: fonts.displayKr, color: themeColors.highlight || themeColors.primary }}>
              <StaggeredText text={invitation.content.quote.text} isVisible={invitationAnimated} delay={0.5} charDelay={0.05} />
            </p>
            {invitation.content.quote.author && <p className="typo-caption mt-2" style={{ color: themeColors.gray }}>{invitation.content.quote.author}</p>}
          </div>
        )}

        {/* Greeting Section */}
        <div className="greeting-section mb-11">
          <p className="text-[13px] font-light leading-[2.1]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: invitation.content.greeting ? parseHighlight(invitation.content.greeting) : '인사말을 입력해주세요' }} />
        </div>

        {/* Parents Info */}
        <div className="parents-section mb-9 text-center" style={{ fontFamily: fonts.displayKr }}>
          {(invitation.groom.father.name || invitation.groom.mother.name) && (
          <div className="mb-3">
            <p className="text-[11px] font-light leading-[2]" style={{ color: themeColors.text }}>
              {invitation.groom.father.name && <><ParentName name={invitation.groom.father.name} deceased={invitation.groom.father.deceased} displayStyle={invitation.deceasedDisplayStyle as 'hanja' | 'flower'} />{invitation.groom.mother.name && ' · '}</>}
              {invitation.groom.mother.name && <ParentName name={invitation.groom.mother.name} deceased={invitation.groom.mother.deceased} displayStyle={invitation.deceasedDisplayStyle as 'hanja' | 'flower'} />}
              <span style={{ color: themeColors.gray }}> 의 아들 </span>
              <span style={{ color: themeColors.highlight || themeColors.primary, fontWeight: 500 }}>{invitation.groom.name?.slice(1)}</span>
            </p>
          </div>
          )}
          {(invitation.bride.father.name || invitation.bride.mother.name) && (
          <div>
            <p className="text-[11px] font-light leading-[2]" style={{ color: themeColors.text }}>
              {invitation.bride.father.name && <><ParentName name={invitation.bride.father.name} deceased={invitation.bride.father.deceased} displayStyle={invitation.deceasedDisplayStyle as 'hanja' | 'flower'} />{invitation.bride.mother.name && ' · '}</>}
              {invitation.bride.mother.name && <ParentName name={invitation.bride.mother.name} deceased={invitation.bride.mother.deceased} displayStyle={invitation.deceasedDisplayStyle as 'hanja' | 'flower'} />}
              <span style={{ color: themeColors.gray }}> 의 딸 </span>
              <span style={{ color: themeColors.highlight || themeColors.primary, fontWeight: 500 }}>{invitation.bride.name?.slice(1)}</span>
            </p>
          </div>
          )}
        </div>

        {/* Wedding Info Card */}
        <div className="wedding-info-card rounded-2xl px-6 py-7 mb-9" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)' }}>
          <span className="inline-block typo-caption px-3 py-1 rounded-full mb-5" style={{ background: '#f0f0f0', color: '#888' }}>Until wedding {calculateDday(invitation.wedding.date)}</span>
          <div className="pb-4 mb-4 border-b border-gray-100">
            <p className="typo-title mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>{formatDateShort(invitation.wedding.date)}</p>
            <p className="typo-caption" style={{ color: '#777' }}>{invitation.wedding.timeDisplay}</p>
          </div>
          <div className="mb-5">
            <p className="typo-body mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>{invitation.wedding.venue.name} {invitation.wedding.venue.hall}</p>
            <p className="typo-caption" style={{ color: '#999' }}>{invitation.wedding.venue.address || '주소를 입력해주세요'}</p>
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
            className="text-[13px] font-light"
            style={{ color: themeColors.gray, fontFamily: fonts.displayKr }}
          >
            다음 이야기
          </button>
          <div className="flex flex-col items-center mt-4">
            <div
              style={{
                width: '1px',
                height: '24px',
                backgroundColor: themeColors.gray,
                opacity: 0.5
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: themeColors.gray,
                borderRadius: '50%',
                opacity: 0.7,
                marginTop: '4px',
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
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm whitespace-pre-line" style={{ color: themeColors.text }}>{directions.car}</p>
                </div>
              )}

              {directionsTab === 'publicTransport' && directions.publicTransport && (
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm whitespace-pre-line" style={{ color: themeColors.text }}>{directions.publicTransport}</p>
                </div>
              )}

              {directionsTab === 'train' && directions.train && (
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm whitespace-pre-line" style={{ color: themeColors.text }}>{directions.train}</p>
                </div>
              )}

              {directionsTab === 'expressBus' && directions.expressBus && (
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm whitespace-pre-line" style={{ color: themeColors.text }}>{directions.expressBus}</p>
                </div>
              )}

              {directionsTab === 'shuttle' && directions.shuttle && (
                <div className="p-4 rounded-xl bg-gray-50">
                  <p className="text-sm whitespace-pre-line" style={{ color: themeColors.text }}>{directions.shuttle}</p>
                </div>
              )}
            </div>

            {/* 추가 안내사항 */}
            {directions.extraInfoEnabled && directions.extraInfoText && (
              <div className="mt-6 p-4 rounded-xl border" style={{ background: `${themeColors.primary}10`, borderColor: `${themeColors.primary}30` }}>
                <p className="text-sm whitespace-pre-line" style={{ color: themeColors.text }}>{directions.extraInfoText}</p>
              </div>
            )}

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

    </div>
  )
}

// 샘플 방명록 메시지
const sampleGuestbookMessages: GuestbookMessage[] = [
  { id: 'sample-1', guest_name: '김지은', message: '두 분의 결혼을 진심으로 축하드려요! 항상 행복하세요 💕', question: '두 사람에게 해주고 싶은 말은?', created_at: '2025-05-20T10:30:00Z' },
  { id: 'sample-2', guest_name: '이준호', message: '결혼 축하해! 행복하게 잘 살아~', question: '두 사람에게 해주고 싶은 말은?', created_at: '2025-05-19T14:20:00Z' },
  { id: 'sample-3', guest_name: '박서윤', message: '예쁜 커플 결혼 축하드립니다. 오래오래 사랑하세요!', question: '두 사람에게 해주고 싶은 말은?', created_at: '2025-05-18T09:15:00Z' },
  { id: 'sample-4', guest_name: '최민수', message: '서로 배려하고 존중하는 마음이 가장 중요한 것 같아요', question: '결혼생활에서 가장 중요한 건?', created_at: '2025-05-17T16:45:00Z' },
  { id: 'sample-5', guest_name: '정하나', message: '처음 봤을 때 정말 잘 어울린다고 생각했어요!', question: '두 사람의 첫인상은 어땠나요?', created_at: '2025-05-16T11:30:00Z' },
  { id: 'sample-6', guest_name: '강민지', message: '행복한 가정 꾸리세요! 축하합니다 🎉', question: '두 사람에게 해주고 싶은 말은?', created_at: '2025-05-15T08:00:00Z' },
]

// Main Page Component - matching template exactly
function MainPage({ invitation, invitationId, fonts, themeColors, onNavigate, onOpenRsvp, onOpenLightbox, onOpenGuestbookModal, audioRef, showMusicToggle, shouldAutoPlay, isSample = false }: PageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Section Highlight 상태
  const [activeSection, setActiveSection] = useState('invitation')
  const visibilityRatios = useRef<Map<string, number>>(new Map())

  const registerSection = useCallback((id: string, ratio: number) => {
    visibilityRatios.current.set(id, ratio)

    // 가장 높은 가시성 비율을 가진 섹션 찾기
    let maxRatio = 0
    let maxId = 'invitation'

    visibilityRatios.current.forEach((r, sectionId) => {
      if (r > maxRatio) {
        maxRatio = r
        maxId = sectionId
      }
    })

    if (maxRatio > 0) {
      setActiveSection(maxId)
    }
  }, [])

  // 방명록 상태
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookMessage[]>(isSample ? sampleGuestbookMessages : [])
  const [guestName, setGuestName] = useState('')
  const [guestMessage, setGuestMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 방명록 메시지 불러오기 (샘플이 아닌 경우에만)
  useEffect(() => {
    if (isSample) return // 샘플 청첩장은 API 호출하지 않음

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/guestbook?invitationId=${invitationId}`)
        if (res.ok) {
          const data: { data?: GuestbookMessage[] } = await res.json()
          setGuestbookMessages(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch guestbook messages:', error)
      }
    }
    fetchMessages()
  }, [invitationId, isSample])

  // 방명록 메시지 등록
  const handleSubmitGuestbook = async () => {
    if (!guestName.trim() || !guestMessage.trim()) {
      alert('이름과 메시지를 입력해주세요.')
      return
    }

    if (guestMessage.length > 100) {
      alert('메시지는 100자 이내로 입력해주세요.')
      return
    }

    // 샘플 청첩장인 경우 로컬에서만 처리
    if (isSample) {
      const newMessage: GuestbookMessage = {
        id: `sample-new-${Date.now()}`,
        guest_name: guestName.trim(),
        message: guestMessage.trim(),
        question: invitation.content.guestbookQuestions[currentQuestionIndex] || null,
        created_at: new Date().toISOString(),
      }
      setGuestbookMessages((prev) => [newMessage, ...prev])
      setGuestName('')
      setGuestMessage('')
      alert('방명록이 등록되었습니다! (샘플 미리보기)')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: guestName.trim(),
          message: guestMessage.trim(),
          question: invitation.content.guestbookQuestions[currentQuestionIndex] || null,
        }),
      })

      if (res.ok) {
        const data: { data?: GuestbookMessage } = await res.json()
        if (data.data) {
          setGuestbookMessages((prev) => [data.data!, ...prev])
        }
        setGuestName('')
        setGuestMessage('')
        alert('방명록이 등록되었습니다!')
      } else {
        alert('등록에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('Failed to submit guestbook:', error)
      alert('등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    const questions = invitation.content.guestbookQuestions
    if (questions.length > 0) {
      setCurrentQuestionIndex((prev) => (prev + 1) % questions.length)
    }
  }

  // 방명록 카드 색상 배열
  const cardColors = ['#FFF9F0', '#F0F7FF', '#F5FFF0', '#FFF0F5', '#F0FFFF']

  // 방명록 모달 열기 (callback을 통해 상위 컴포넌트에서 관리)
  const openGuestbookModal = (index: number) => {
    onOpenGuestbookModal?.(index, guestbookMessages)
  }

  return (
    <SectionHighlightContext.Provider value={{ activeSection, registerSection }}>
    <div className="relative">
      {/* Title Section - FAMILY 템플릿 */}
      <div className="relative">
        {audioRef && <MusicToggle audioRef={audioRef} isVisible={showMusicToggle ?? false} shouldAutoPlay={shouldAutoPlay ?? false} />}
      </div>

      {/* 신랑측 부모님 소개 */}
      {(invitation as any).parentIntro?.groom?.enabled !== false && (
        <ParentIntroSection
          parentNames={(invitation as any).parentIntro?.groom?.parentNames || `${invitation.groom.father?.name || '아버지'}, ${invitation.groom.mother?.name || '어머니'}의`}
          childOrder={(invitation as any).parentIntro?.groom?.childOrder || '첫째'}
          childName={invitation.groom.name}
          images={(invitation as any).parentIntro?.groom?.images || ['/sample/story1.jpg']}
          message={(invitation as any).parentIntro?.groom?.message || '말벌보다 초승이 더 많았던 아이였습니다.\n잠든 얼굴을 한참 바라보다가\n\n\'이 아이가 어떤 사람과 함께할까\' 상상하던 밤이\n아직도 선명합니다.\n\n축구를 좋아해서 해 질 때까지 뛰던 아이가\n지금은 누군가를 찾게 하고, 지켜주고 싶다는 사람이\n되었습니다.\n\n처음으로, "이 사람이 있으면 마음이 편안해요"라고 말했을\n때 더는 더 이상 바랄 게 없겠다는 생각이 들었습니다.\n\n그렇게, 저희 아들이 사랑하는 사람과 인생의 길을 함께\n걸어가려 합니다.\n\n기쁘고, 설레는 이 시작에,\n모여서 따뜻한 마음으로 축복해주신다면\n부모로서 얼마나 감사하겠습니다.'}
          side="groom"
          fonts={fonts}
          themeColors={themeColors}
          textStyle={(invitation as any).parentIntroTextStyle}
        />
      )}

      {/* 선 확장 애니메이션 디바이더 */}
      {(invitation as any).parentIntro?.groom?.enabled !== false &&
       (invitation as any).parentIntro?.bride?.enabled !== false && (
        <LineExpandDividerSection />
      )}

      {/* 신부측 부모님 소개 */}
      {(invitation as any).parentIntro?.bride?.enabled !== false && (
        <ParentIntroSection
          parentNames={(invitation as any).parentIntro?.bride?.parentNames || `${invitation.bride.father?.name || '아버지'}, ${invitation.bride.mother?.name || '어머니'}의`}
          childOrder={(invitation as any).parentIntro?.bride?.childOrder || '첫째'}
          childName={invitation.bride.name}
          images={(invitation as any).parentIntro?.bride?.images || ['/sample/story2.jpg']}
          message={(invitation as any).parentIntro?.bride?.message || '어릴 적부터 마음이 따뜻했던 아이입니다.\n\n항상 주변 사람들을 먼저 생각하고\n작은 것에도 감사할 줄 아는 딸이었습니다.\n\n그런 아이가 평생을 함께할 사람을 만났다고 했을 때,\n부모로서 이보다 더 큰 기쁨이 없었습니다.\n\n두 사람이 서로를 아끼고 사랑하며\n행복한 가정을 이루길 진심으로 바랍니다.\n\n부디 오셔서 두 사람의 새로운 시작을\n축복해 주시면 감사하겠습니다.'}
          side="bride"
          fonts={fonts}
          themeColors={themeColors}
          textStyle={(invitation as any).parentIntroTextStyle}
        />
      )}

      {/* 첫 번째 디바이더 - 부모님 소개 섹션 하단 (부모님 소개 중 하나라도 켜져 있으면 표시) */}
      {((invitation as any).parentIntro?.groom?.enabled !== false || (invitation as any).parentIntro?.bride?.enabled !== false) && (
        <FullHeightDividerSection
          englishTitle={(invitation as any).fullHeightDividers?.items?.[0]?.englishTitle || 'From Our Family to Yours'}
          koreanText={(invitation as any).fullHeightDividers?.items?.[0]?.koreanText || '우리의 봄이, 누군가의 평생이 됩니다'}
          image={(invitation as any).fullHeightDividers?.items?.[0]?.image}
          imageSettings={(invitation as any).fullHeightDividers?.items?.[0]?.imageSettings}
        />
      )}

      {/* Why We Chose Each Other Section - 서로를 선택한 이유 */}
      {(invitation as any).whyWeChose?.enabled !== false && (
        <>
          <WhyWeChoseTitleSection
            title={(invitation as any).whyWeChose?.title || '우리가 서로를 선택한 이유'}
            subtitle={(invitation as any).whyWeChose?.subtitle || '오래 보아도 좋은 사람, 서로 그렇게 되기까지'}
            fonts={fonts}
            themeColors={themeColors}
          />

          {/* 신랑이 신부를 선택한 이유 - whyWeChose 전용 이미지 사용 (없으면 프로필 이미지 fallback) */}
          {(invitation as any).whyWeChose?.groom?.enabled !== false && (
            <WhyWeChoseSection
              images={(invitation as any).whyWeChose?.groom?.images?.length > 0
                ? (invitation as any).whyWeChose.groom.images
                : (invitation.groom.profile.images || ['/sample/groom-profile.jpg'])}
              imageSettings={(invitation as any).whyWeChose?.groom?.images?.length > 0
                ? (invitation as any).whyWeChose.groom.imageSettings
                : invitation.groom.profile.imageSettings}
              description={(invitation as any).whyWeChose?.groom?.description || '저는 신중한 편이고, 망설임이 많은 사람입니다.\n\n그래서 누군가에게 쉽게 다가가지도,\n쉽게 "함께하자"는 말을 하지도 않습니다.\n\n그런데 이 사람과 함께 있으면\n표현이 서툴러도 괜찮았고,\n**내가 다 준비되지 않아도 괜찮다는 생각**이 들었습니다.\n\n밝고 가벼운 말투 뒤에 있는 단단함을\n오랫동안 지켜봤고,\n그게 어느 순간 제 마음을 움직였습니다.\n\n**이 사람과 함께라면\n내가 더 따뜻한 사람이 될 수 있겠다는 마음**이 들었습니다.'}
              quote={(invitation as any).whyWeChose?.groom?.quote || '서로 아끼며 행복하게 살겠습니다.'}
              name={invitation.groom.name}
              side="groom"
              fonts={fonts}
              themeColors={themeColors}
              textStyle={(invitation as any).whyWeChoseTextStyle}
            />
          )}

          {/* 신부가 신랑을 선택한 이유 - whyWeChose 전용 이미지 사용 (없으면 프로필 이미지 fallback) */}
          {(invitation as any).whyWeChose?.bride?.enabled !== false && (
            <WhyWeChoseSection
              images={(invitation as any).whyWeChose?.bride?.images?.length > 0
                ? (invitation as any).whyWeChose.bride.images
                : (invitation.bride.profile.images || ['/sample/bride-profile.jpg'])}
              imageSettings={(invitation as any).whyWeChose?.bride?.images?.length > 0
                ? (invitation as any).whyWeChose.bride.imageSettings
                : invitation.bride.profile.imageSettings}
              description={(invitation as any).whyWeChose?.bride?.description || '저는 말도 빠르고, 마음도 앞서가는 사람이에요.\n좋아하면 티부터 나고,\n가끔은 걱정보다 웃음이 먼저 나오는 사람이에요.\n\n그런 저를\n이 사람은 한 번도 가볍다고 하지 않았습니다.\n\n오히려 감정이 넘칠 때마다\n조용히 곁에 머물러 주는 사람이었습니다.\n\n불안한 밤엔 말없이 손을 잡아주고,\n좋은 날엔 누구보다 먼저 축하주는 사람.\n그래서 생각했습니다.\n\n**내가 아무 나다워도 괜찮다고 말해주는 이 사람이라면\n오래오래 곁에 두고 싶다**고.'}
              quote={(invitation as any).whyWeChose?.bride?.quote || '늘 처음처럼 행복하게 살겠습니다.'}
              name={invitation.bride.name}
              side="bride"
              fonts={fonts}
              themeColors={themeColors}
              textStyle={(invitation as any).whyWeChoseTextStyle}
            />
          )}
        </>
      )}

      {/* 두 번째 디바이더 - 서로를 선택한 이유 섹션 하단 (whyWeChose 섹션이 켜져 있으면 표시) */}
      {(invitation as any).whyWeChose?.enabled !== false && (
        <FullHeightDividerSection
          englishTitle={(invitation as any).fullHeightDividers?.items?.[1]?.englishTitle || 'Why We Chose Each Other for Life'}
          koreanText={(invitation as any).fullHeightDividers?.items?.[1]?.koreanText || '서로의 부족한 점을 채워줄 수 있는\n사람을 만났습니다.'}
          image={(invitation as any).fullHeightDividers?.items?.[1]?.image}
          imageSettings={(invitation as any).fullHeightDividers?.items?.[1]?.imageSettings}
        />
      )}

      {/* Gallery Section */}
      <AnimatedSection className="px-5 py-10" style={{ background: themeColors.sectionBg }}>
        <div className="grid grid-cols-2 gap-2">
          {invitation.gallery.images && invitation.gallery.images.length > 0 ? invitation.gallery.images.map((img, i) => {
            const imgSettings = (invitation.gallery as any).imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }
            return (
              <div
                key={i}
                className="aspect-square overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => onOpenLightbox?.(i)}
              >
                <div className="w-full h-full bg-gray-100" style={img ? getImageCropStyle(img, imgSettings) : undefined} />
              </div>
            )
          }) : [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* 세 번째 디바이더 - 갤러리 섹션 하단 (갤러리에 이미지가 있으면 표시) */}
      {invitation.gallery.images && invitation.gallery.images.length > 0 && (
        <FullHeightDividerSection
          englishTitle={(invitation as any).fullHeightDividers?.items?.[2]?.englishTitle || 'Our way to marriage'}
          koreanText={(invitation as any).fullHeightDividers?.items?.[2]?.koreanText || '같은 시간, 같은 마음으로\n하나의 계절을 준비하고 있습니다.'}
          image={(invitation as any).fullHeightDividers?.items?.[2]?.image}
          imageSettings={(invitation as any).fullHeightDividers?.items?.[2]?.imageSettings}
        />
      )}

      {/* Interview Items - with visibility toggle */}
      {invitation.sectionVisibility?.interview !== false && invitation.content.interviews.map((interview, index) => interview.question || interview.answer ? (
        <InterviewSection
          key={index}
          interview={interview}
          fonts={fonts}
          themeColors={themeColors}
          bgColor="#ffffff"
          textStyle={invitation.interviewTextStyle}
        />
      ) : null)}

      {/* Info Section - matching original template */}
      <section
        className="px-6 py-6"
        style={{ background: themeColors.sectionBg }}
      >
        {/* Info Photo */}
        {invitation.guidance?.image && (
          <AnimatedSection className="mb-10">
            <div
              className="w-full aspect-[4/5] rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)'
              }}
            >
              <div
                className="w-full h-full"
                style={(() => {
                  const s = invitation.guidance.imageSettings as { scale?: number; positionX?: number; positionY?: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number } || {}
                  const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)
                  if (hasCropData) {
                    const cw = s.cropWidth || 1
                    const ch = s.cropHeight || 1
                    const cx = s.cropX || 0
                    const cy = s.cropY || 0
                    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
                    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
                    return {
                      backgroundImage: `url(${invitation.guidance.image})`,
                      backgroundSize: `${100 / cw}% ${100 / ch}%`,
                      backgroundPosition: `${posX}% ${posY}%`,
                      backgroundRepeat: 'no-repeat' as const,
                    }
                  }
                  return {
                    backgroundImage: `url(${invitation.guidance.image})`,
                    backgroundSize: 'cover' as const,
                    backgroundPosition: 'center' as const,
                    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
                  }
                })()}
              />
            </div>
          </AnimatedSection>
        )}

        {/* Section Title */}
        <AnimatedSection className="text-center mb-8">
          <h3
            className="text-[15px] font-light relative inline-block"
            style={{ fontFamily: fonts.displayKr, color: themeColors.text }}
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

        {/* Flower Child Block */}
        {invitation.content.info.flowerChild?.enabled && (
          <InfoBlock
            title={invitation.content.info.flowerChild.title}
            content={invitation.content.info.flowerChild.content}
            fonts={fonts}
            themeColors={themeColors}
          />
        )}

        {/* Flower Gift Block */}
        {invitation.content.info.flowerGift?.enabled && (
          <InfoBlock
            title={invitation.content.info.flowerGift.title}
            content={invitation.content.info.flowerGift.content}
            fonts={fonts}
            themeColors={themeColors}
          />
        )}

        {/* Photo Booth Block */}
        {invitation.content.info.photoBooth?.enabled && (
          <InfoBlock
            title={invitation.content.info.photoBooth.title}
            content={invitation.content.info.photoBooth.content}
            fonts={fonts}
            themeColors={themeColors}
          />
        )}

        {/* Wreath Block */}
        {invitation.content.info.wreath?.enabled && (
          <InfoBlock
            title={invitation.content.info.wreath.title}
            content={invitation.content.info.wreath.content}
            fonts={fonts}
            themeColors={themeColors}
          />
        )}

        {/* Shuttle Block */}
        {invitation.content.info.shuttle?.enabled && (
          <InfoBlock
            title={invitation.content.info.shuttle.title}
            content={invitation.content.info.shuttle.content}
            fonts={fonts}
            themeColors={themeColors}
          />
        )}

        {/* Reception Block */}
        {invitation.content.info.reception?.enabled && (
          <InfoBlock
            title={invitation.content.info.reception.title}
            content={invitation.content.info.reception.content}
            fonts={fonts}
            themeColors={themeColors}
          />
        )}

        {/* Custom Items */}
        {invitation.content.info.customItems?.map(item => item.enabled && (
          <InfoBlock
            key={item.id}
            title={item.title}
            content={item.content}
            fonts={fonts}
            themeColors={themeColors}
          />
        ))}
      </section>

      {/* Thank You Section */}
      <AnimatedSection className="min-h-[300px] flex flex-col justify-center items-center text-center px-7 py-12" style={{ background: themeColors.sectionBg }}>
        <h2 className="typo-title mb-7" style={{ fontFamily: fonts.display, color: themeColors.text }}>{invitation.content.thankYou.title}</h2>
        {invitation.content.thankYou.message ? (
          <p className="typo-body mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.content.thankYou.message) }} />
        ) : (
          <p className="typo-body text-gray-400 mb-7">감사 메시지를 입력해주세요</p>
        )}
        {invitation.content.thankYou.sign && <p className="typo-body" style={{ fontFamily: fonts.displayKr, color: themeColors.gray }}>{invitation.content.thankYou.sign}</p>}
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
        <AnimatedSection className="px-5 py-10 pb-14 text-center" style={{ background: themeColors.cardBg }}>
          <h3 className="typo-body mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>Guestbook</h3>
          <div className="max-w-[300px] mx-auto mb-9">
            <p className="typo-body font-medium mb-4 min-h-[40px]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>{invitation.content.guestbookQuestions[currentQuestionIndex] || '두 사람에게 하고 싶은 말을 남겨주세요'}</p>
            <div className="space-y-2 mb-2.5">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-3 border border-gray-200 rounded-lg typo-caption"
                style={{ background: '#fafafa', color: themeColors.text }}
                placeholder="이름"
                maxLength={20}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  className="flex-1 px-3.5 py-3 border border-gray-200 rounded-lg typo-caption"
                  style={{ background: '#fafafa', color: themeColors.text }}
                  placeholder="메시지 (100자 이내)"
                  maxLength={100}
                />
                <button
                  onClick={handleSubmitGuestbook}
                  disabled={isSubmitting}
                  className="px-4 py-3 rounded-lg typo-caption text-white disabled:opacity-50"
                  style={{ background: themeColors.text }}
                >
                  {isSubmitting ? '...' : '등록'}
                </button>
              </div>
            </div>
            {invitation.content.guestbookQuestions.length > 1 && (
              <button
                onClick={handleNextQuestion}
                className="typo-caption cursor-pointer hover:underline active:opacity-70 transition-all"
                style={{ color: themeColors.primary }}
              >
                다른 질문 보기 →
              </button>
            )}
          </div>
          {/* 방명록 메시지 표시 */}
          <div className="relative min-h-[200px]">
            {guestbookMessages.length === 0 ? (
              <p className="typo-caption text-gray-400 pt-10">아직 방명록이 없습니다. 첫 번째로 메시지를 남겨보세요!</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {guestbookMessages.slice(0, 6).map((msg, index) => (
                  <div
                    key={msg.id}
                    className="w-[130px] px-3 py-3.5 rounded-lg text-left shadow-sm cursor-pointer transition-transform hover:scale-105"
                    style={{
                      background: cardColors[index % cardColors.length],
                      transform: `rotate(${index % 2 === 0 ? -3 : 2}deg)`,
                    }}
                    onClick={() => openGuestbookModal(index)}
                  >
                    {msg.question && (
                      <p className="typo-caption text-gray-400 mb-1.5">{msg.question}</p>
                    )}
                    <p className="typo-caption mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>{msg.message}</p>
                    <p className="typo-caption text-gray-400">- {msg.guest_name}</p>
                  </div>
                ))}
              </div>
            )}
            {guestbookMessages.length > 6 && (
              <p className="typo-caption text-gray-400 mt-4">외 {guestbookMessages.length - 6}개의 메시지</p>
            )}
          </div>
        </AnimatedSection>
      )}

      {/* RSVP Section */}
      {invitation.rsvpEnabled && (
        <AnimatedSection className="px-6 py-10 text-center" style={{ background: themeColors.cardBg }}>
          <p className="typo-caption mb-6" style={{ color: themeColors.gray }}>RSVP</p>
          <p className="typo-body mb-4" style={{ color: '#666' }}>참석 여부를 알려주세요</p>
          <button
            onClick={() => onOpenRsvp?.()}
            className="w-full py-3 rounded-lg typo-caption"
            style={{ background: themeColors.primary, color: '#fff' }}
          >
            참석 여부 전달하기
          </button>
          {invitation.rsvpDeadline && <p className="typo-caption mt-3" style={{ color: '#999' }}>마감일: {formatDateShort(invitation.rsvpDeadline)}</p>}
        </AnimatedSection>
      )}

      {/* Footer */}
      <div className="px-6 py-10 text-center" style={{ background: themeColors.background }}>
        <p className="typo-caption" style={{ color: '#999' }}>Thank you for celebrating with us</p>
        <p className="typo-caption mt-2" style={{ color: '#ccc' }}>Made with dear drawer</p>
      </div>
    </div>
    </SectionHighlightContext.Provider>
  )
}

// Guestbook Modal Component with swipe functionality
function GuestbookModal({
  messages,
  isOpen,
  startIndex,
  onClose,
  cardColors,
  fonts,
  themeColors,
}: {
  messages: GuestbookMessage[]
  isOpen: boolean
  startIndex: number
  onClose: () => void
  cardColors: string[]
  fonts: { body: string; displayKr: string; display: string }
  themeColors: { text: string; primary: string; background: string; cardBg: string; gray: string; divider: string }
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [swipingDirection, setSwipingDirection] = useState<'none' | 'up' | 'down'>('none')
  const [dragY, setDragY] = useState(0)
  const touchStartY = useRef(0)
  const isDragging = useRef(false)

  // 무한 루프를 위한 인덱스 계산
  const getLoopedIndex = (index: number) => {
    const len = messages.length
    return ((index % len) + len) % len
  }

  const handleNextCard = () => {
    setSwipingDirection('up')
    setTimeout(() => {
      setCurrentIndex((prev) => getLoopedIndex(prev + 1))
      setSwipingDirection('none')
    }, 300)
  }

  const handlePrevCard = () => {
    setSwipingDirection('down')
    setTimeout(() => {
      setCurrentIndex((prev) => getLoopedIndex(prev - 1))
      setSwipingDirection('none')
    }, 300)
  }

  // Pointer Events - 마우스와 터치 통합 처리
  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId)
    touchStartY.current = e.clientY
    isDragging.current = true
    setDragY(0)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const deltaY = e.clientY - touchStartY.current
    setDragY(deltaY)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId)
    isDragging.current = false
    const swipeThreshold = 50
    const tapThreshold = 10

    if (dragY < -swipeThreshold) {
      handleNextCard()
    } else if (dragY > swipeThreshold) {
      handlePrevCard()
    } else if (Math.abs(dragY) < tapThreshold) {
      handleNextCard()
    }
    setDragY(0)
  }

  const handlePointerCancel = () => {
    isDragging.current = false
    setDragY(0)
  }

  // Get visible cards for infinite loop (current and next 2)
  const getVisibleCards = () => {
    const cards = []
    for (let i = 0; i < 3; i++) {
      const idx = getLoopedIndex(currentIndex + i)
      cards.push({ ...messages[idx], _displayIndex: idx })
    }
    return cards
  }
  const visibleCards = getVisibleCards()

  if (!isOpen || messages.length === 0) return null

  // 모달 인라인 스타일 - Portal에서도 확실하게 적용
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(250, 250, 250, 0.55)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  }

  // 닫기 버튼 스타일
  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    background: '#fff',
    border: 'none',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#666',
    zIndex: 10001,
    pointerEvents: 'auto',
    touchAction: 'manipulation',
  }

  // 카드 스택 스타일
  const stackStyle: React.CSSProperties = {
    position: 'relative',
    width: 280,
    height: 360,
    perspective: 1000,
    pointerEvents: 'auto',
  }

  return (
    <div
      style={modalStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        style={closeButtonStyle}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        onTouchEnd={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        ✕
      </button>

      <div style={stackStyle}>
        {visibleCards.map((msg, idx) => {
          const actualIndex = (msg as { _displayIndex: number })._displayIndex
          const isTopCard = idx === 0

          // 카드 스타일 - 인라인으로 전체 적용
          const cardStyle: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            minHeight: 200,
            padding: '32px 28px',
            background: cardColors[actualIndex % cardColors.length],
            borderRadius: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            textAlign: 'center',
            transition: dragY !== 0 ? 'none' : 'transform 0.4s ease, opacity 0.4s ease',
            zIndex: 3 - idx,
            transform: isTopCard && dragY !== 0
              ? `translateY(${dragY}px) rotate(${dragY > 0 ? 2 : -2}deg)`
              : isTopCard && swipingDirection === 'up'
              ? 'translateY(-150%) rotate(-5deg)'
              : isTopCard && swipingDirection === 'down'
              ? 'translateY(150%) rotate(5deg)'
              : idx === 1
              ? 'translateY(20px) scale(0.95)'
              : idx === 2
              ? 'translateY(40px) scale(0.9)'
              : undefined,
            opacity: isTopCard && (swipingDirection === 'up' || swipingDirection === 'down')
              ? 0
              : idx === 1
              ? 0.7
              : idx === 2
              ? 0.4
              : 1,
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            cursor: isTopCard ? 'pointer' : 'default',
            pointerEvents: isTopCard ? 'auto' : 'none',
            WebkitTapHighlightColor: 'transparent',
          }

          return (
            <div
              key={`${msg.id}-${currentIndex}-${idx}`}
              style={cardStyle}
              onPointerDown={isTopCard ? handlePointerDown : undefined}
              onPointerMove={isTopCard ? handlePointerMove : undefined}
              onPointerUp={isTopCard ? handlePointerUp : undefined}
              onPointerCancel={isTopCard ? handlePointerCancel : undefined}
              onClick={isTopCard ? (e) => {
                e.stopPropagation()
                if (Math.abs(dragY) < 10) {
                  handleNextCard()
                }
              } : undefined}
            >
              {msg.question && (
                <p className="typo-caption text-gray-400 mb-3">{msg.question}</p>
              )}
              <p className="typo-body mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
                {msg.message}
              </p>
              <p className="typo-caption text-gray-400">- {msg.guest_name}</p>
            </div>
          )
        })}

        {/* Swipe hint */}
        <div style={{
          position: 'absolute',
          bottom: -50,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: '#aaa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}>
          터치하거나 밀어서 넘기기
        </div>

        {/* Card counter */}
        <div style={{
          position: 'absolute',
          bottom: -80,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: '#aaa',
        }}>
          {currentIndex + 1} / {messages.length}
        </div>
      </div>
    </div>
  )
}

// 청첩장 전용 에러 Fallback
function InvitationErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">청첩장을 불러올 수 없습니다</h2>
        <p className="text-gray-500 text-sm mb-6">잠시 후 다시 시도해 주세요.</p>
        <button
          onClick={resetError}
          className="w-full px-5 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}

function InvitationClientContent({ invitation: dbInvitation, content, isPaid, isPreview = false, overrideColorTheme, overrideFontStyle, skipIntro = false, isSample = false }: InvitationClientProps) {
  // Transform DB data to display format
  const invitation = transformToDisplayData(dbInvitation, content)

  // Override colorTheme if provided via URL parameter
  const effectiveColorTheme = (overrideColorTheme && overrideColorTheme in colorThemes)
    ? overrideColorTheme as ColorTheme
    : invitation.colorTheme

  // Override fontStyle if provided via URL parameter
  const effectiveFontStyle = (overrideFontStyle && overrideFontStyle in fontStyles)
    ? overrideFontStyle as FontStyle
    : invitation.fontStyle

  // If skipIntro is true, start directly on main page
  const [currentPage, setCurrentPage] = useState<PageType>(skipIntro ? 'main' : 'intro')
  const [introScreen, setIntroScreen] = useState<'cover' | 'invitation'>('cover')
  const audioRef = useRef<HTMLAudioElement>(null)
  const [openModalType, setOpenModalType] = useState<'none' | 'rsvp'>('none')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Guestbook modal state (lifted from MainPage for proper positioning)
  const [guestbookModalOpen, setGuestbookModalOpen] = useState(false)
  const guestbookModalIndexRef = useRef(0)
  const [guestbookMessagesForModal, setGuestbookMessagesForModal] = useState<GuestbookMessage[]>([])

  // Tooltip delay - show after 3 seconds on invitation screen
  const [tooltipReady, setTooltipReady] = useState(false)
  useEffect(() => {
    if (currentPage === 'intro' && introScreen === 'invitation') {
      const timer = setTimeout(() => setTooltipReady(true), 3000)
      return () => clearTimeout(timer)
    } else {
      setTooltipReady(false)
    }
  }, [currentPage, introScreen])

  // 커스텀 텍스트 색상을 테마에 오버라이드 (사용자 설정이 있으면 적용)
  const baseThemeColors = colorThemes[effectiveColorTheme]
  const themeColors: ColorConfig = {
    ...baseThemeColors,
    text: invitation.bodyTextColor || baseThemeColors.text,
    highlight: invitation.accentTextColor || baseThemeColors.highlight || baseThemeColors.primary,
  }
  const fonts = fontStyles[effectiveFontStyle]

  // Show floating button only on invitation screen or main page
  const showFloatingButton = currentPage === 'main' || (currentPage === 'intro' && introScreen === 'invitation')

  // Show music toggle only when BGM is enabled (use bgm object, not media.bgm)
  const showMusicToggle = invitation.bgm?.enabled && !!invitation.bgm?.url

  // Scroll to appropriate position when page changes
  useEffect(() => {
    window.scrollTo(0, 0)
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
    invitation.groom?.bank?.enabled && { name: invitation.groom.name, bank: invitation.groom.bank, role: '신랑', side: 'groom' as const },
    (invitation.groom?.father as any)?.bank?.enabled && { name: invitation.groom.father.name, bank: (invitation.groom.father as any).bank, role: '아버지', side: 'groom' as const },
    (invitation.groom?.mother as any)?.bank?.enabled && { name: invitation.groom.mother.name, bank: (invitation.groom.mother as any).bank, role: '어머니', side: 'groom' as const },
    invitation.bride?.bank?.enabled && { name: invitation.bride.name, bank: invitation.bride.bank, role: '신부', side: 'bride' as const },
    (invitation.bride?.father as any)?.bank?.enabled && { name: invitation.bride.father.name, bank: (invitation.bride.father as any).bank, role: '아버지', side: 'bride' as const },
    (invitation.bride?.mother as any)?.bank?.enabled && { name: invitation.bride.mother.name, bank: (invitation.bride.mother as any).bank, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; bank: { bank: string; account: string; holder: string; enabled: boolean }; role: string; side: 'groom' | 'bride' }[]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div className="desktop-frame-wrapper">
        <div className="mobile-frame">
          <div className="mobile-frame-screen">
            <div className="mobile-frame-content">
              <WatermarkOverlay isPaid={isPaid || isPreview} className="relative w-full min-h-screen">
                <div
                  className={`relative w-full min-h-screen overflow-x-hidden theme-${invitation.colorTheme} ${effectiveFontStyle === 'romantic' ? 'font-romantic' : ''}`}
                  style={{
                    backgroundColor: themeColors.background,
                    fontFamily: fonts.body,
                    color: invitation.bodyTextColor || themeColors.text,
                    ...(invitation.accentTextColor ? { '--text-accent': invitation.accentTextColor } as React.CSSProperties : {}),
                  }}
                >
                  {/* Page Content */}
                  {currentPage === 'intro' ? (
                    <IntroPage
                      invitation={invitation}
                      invitationId={dbInvitation.id}
                      fonts={fonts}
                      themeColors={themeColors}
                      onNavigate={setCurrentPage}
                      onScreenChange={setIntroScreen}
                      introSettings={invitation.intro as IntroSettings}
                    />
                  ) : (
                    <MainPage
                      invitation={invitation}
                      invitationId={dbInvitation.id}
                      fonts={fonts}
                      themeColors={themeColors}
                      onNavigate={setCurrentPage}
                      onOpenRsvp={() => setOpenModalType('rsvp')}
                      onOpenLightbox={(index) => {
                        setLightboxIndex(index)
                        setLightboxOpen(true)
                      }}
                      onOpenGuestbookModal={(index, messages) => {
                        guestbookModalIndexRef.current = index
                        setGuestbookMessagesForModal(messages)
                        setGuestbookModalOpen(true)
                        document.body.classList.add('guestbook-modal-open')
                      }}
                      audioRef={audioRef}
                      showMusicToggle={showMusicToggle}
                      shouldAutoPlay={currentPage === 'main' && invitation.bgm?.autoplay === true}
                      isSample={isSample}
                    />
                  )}

                  {/* Background Music (use bgm object, not media.bgm) */}
                  {invitation.bgm?.enabled && invitation.bgm?.url && (
                    <audio ref={audioRef} loop preload="auto">
                      <source src={invitation.bgm.url} type="audio/mpeg" />
                    </audio>
                  )}
                </div>
              </WatermarkOverlay>
            </div>

            {/* Fixed UI elements - outside scroll container */}
            <div className="mobile-frame-fixed-ui">
              {/* Floating Button */}
              {showFloatingButton && (
                <GuestFloatingButton
                  themeColors={themeColors}
                  fonts={fonts}
                  openModal={openModalType}
                  onModalClose={() => setOpenModalType('none')}
                  showTooltip={currentPage === 'intro' && introScreen === 'invitation' && tooltipReady}
                  invitation={{
                    venue_name: invitation.wedding.venue.name,
                    venue_address: invitation.wedding.venue.address,
                    contacts,
                    accounts,
                    directions: invitation.wedding.directions,
                    rsvpEnabled: invitation.rsvpEnabled,
                    rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
                    invitationId: invitation.id,
                    groomName: invitation.groom.name,
                    brideName: invitation.bride.name,
                    weddingDate: invitation.wedding.date,
                    weddingTime: invitation.wedding.timeDisplay || invitation.wedding.time,
                    thumbnailUrl: content?.meta?.kakaoThumbnail || content?.meta?.ogImage || invitation.media?.coverImage || invitation.gallery?.images?.[0] || '',
                    shareTitle: content?.meta?.title,
                    shareDescription: content?.meta?.description,
                  }}
                />
              )}

              {/* Gallery Lightbox */}
              <GalleryLightbox
                images={invitation.gallery?.images || []}
                isOpen={lightboxOpen}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
              />

              {/* Guestbook Modal - Portal로 body에 직접 렌더링 */}
              {guestbookModalOpen && typeof document !== 'undefined' && createPortal(
                <GuestbookModal
                  key={`guestbook-${guestbookModalIndexRef.current}`}
                  messages={guestbookMessagesForModal}
                  isOpen={guestbookModalOpen}
                  startIndex={guestbookModalIndexRef.current}
                  onClose={() => {
                    setGuestbookModalOpen(false)
                    document.body.classList.remove('guestbook-modal-open')
                  }}
                  cardColors={['#FFF9F0', '#F0F7FF', '#F5FFF0', '#FFF0F5', '#F0FFFF']}
                  fonts={fonts}
                  themeColors={themeColors}
                />,
                document.body
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ErrorBoundary로 감싼 최종 컴포넌트 - FAMILY 템플릿 전용
export default function InvitationClientFamily(props: InvitationClientProps) {
  return (
    <ErrorBoundary
      fallback={<InvitationErrorFallback resetError={() => window.location.reload()} />}
    >
      <InvitationClientContent {...props} />
    </ErrorBoundary>
  )
}
