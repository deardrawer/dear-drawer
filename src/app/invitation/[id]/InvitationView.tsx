'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'
import { type IntroSettings, getDefaultIntroSettings } from '@/lib/introPresets'
import { parseHighlight } from '@/lib/textUtils'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'
import IntroAnimation from '@/components/invitation/IntroAnimation'
import ProfileImageSlider from '@/components/editor/ProfileImageSlider'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// 갤러리 라이트박스 컴포넌트 (무한 루프 슬라이더)
interface GalleryLightboxProps {
  images: string[]
  imageSettings?: { scale: number; positionX: number; positionY: number }[]
  initialIndex: number
  onClose: () => void
}

function GalleryLightbox({ images, imageSettings, initialIndex, onClose }: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex + 1) // 클론 때문에 +1
  const [isTransitioning, setIsTransitioning] = useState(false)
  const slidesRef = useRef<HTMLDivElement>(null)

  // 실제 표시할 인덱스 계산
  const getDisplayIndex = () => {
    if (currentIndex === 0) return images.length
    if (currentIndex === images.length + 1) return 1
    return currentIndex
  }

  // 슬라이드 이동
  const updateSlidePosition = (instant = false) => {
    if (!slidesRef.current) return
    if (instant) {
      slidesRef.current.style.transition = 'none'
    } else {
      slidesRef.current.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
    slidesRef.current.style.transform = `translateX(-${currentIndex * 100}%)`
  }

  // 트랜지션 끝날 때 무한 루프 처리
  const handleTransitionEnd = () => {
    setIsTransitioning(false)
    if (currentIndex === 0) {
      setCurrentIndex(images.length)
      setTimeout(() => updateSlidePosition(true), 0)
    } else if (currentIndex === images.length + 1) {
      setCurrentIndex(1)
      setTimeout(() => updateSlidePosition(true), 0)
    }
  }

  const goToPrev = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => prev - 1)
  }

  const goToNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => prev + 1)
  }

  // 슬라이드 위치 업데이트
  useEffect(() => {
    updateSlidePosition()
  }, [currentIndex])

  // 키보드 & 터치 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, isTransitioning])

  // 터치 스와이프
  const touchStartX = useRef(0)
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

  // 클론 포함한 슬라이드 배열 생성
  const slidesWithClones = [images[images.length - 1], ...images, images[0]]

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all hover:rotate-90"
      >
        <svg className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* 이전 버튼 */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all group"
      >
        <svg className="w-5 h-5 text-white/90 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* 다음 버튼 */}
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all group"
      >
        <svg className="w-5 h-5 text-white/90 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* 슬라이드 컨테이너 */}
      <div
        className="w-full h-full flex items-center justify-center px-5 py-16"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="relative w-full max-w-[600px] overflow-hidden">
          <div
            ref={slidesRef}
            className="flex"
            onTransitionEnd={handleTransitionEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {slidesWithClones.map((img, i) => (
              <div key={i} className="min-w-full flex items-center justify-center">
                <img
                  src={img}
                  alt={`갤러리 이미지`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 카운터 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/85 text-xs tracking-widest">
        {getDisplayIndex()} / {images.length}
      </div>
    </div>
  )
}

// 방명록 스택 모달 (스와이프로 카드 넘기기)
interface GuestbookModalProps {
  messages: { question: string; answer: string; color: string }[]
  initialIndex: number
  onClose: () => void
  fonts: { displayKr: string }
  themeColors: { text: string }
}

function GuestbookModal({ messages, initialIndex, onClose, fonts, themeColors }: GuestbookModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [swipeY, setSwipeY] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    const diff = touchStartY.current - e.touches[0].clientY
    setSwipeY(diff)
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (swipeY > 80) {
      // 위로 스와이프 - 다음 카드
      if (currentIndex < messages.length - 1) {
        setCurrentIndex(prev => prev + 1)
      }
    } else if (swipeY < -80) {
      // 아래로 스와이프 - 모달 닫기
      onClose()
    }
    setSwipeY(0)
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all text-white/70 hover:text-white text-xl"
      >
        ✕
      </button>

      {/* 카드 스택 */}
      <div className="relative w-[280px] h-[360px]" style={{ perspective: '1000px' }}>
        {messages.slice(currentIndex, currentIndex + 4).map((msg, i) => {
          const isTop = i === 0
          const cardStyle: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            background: msg.color,
            borderRadius: '16px',
            padding: '28px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            transform: isTop
              ? `translateY(${-swipeY}px) rotate(${swipeY > 0 ? -swipeY * 0.05 : 0}deg)`
              : `translateY(${i * 20}px) scale(${1 - i * 0.05})`,
            opacity: i === 3 ? 0 : 1 - i * 0.3,
            zIndex: 10 - i,
            transition: isSwiping && isTop ? 'none' : 'transform 0.4s ease, opacity 0.4s ease',
            cursor: isTop ? 'grab' : 'default',
            touchAction: 'pan-y',
          }

          return (
            <div
              key={currentIndex + i}
              style={cardStyle}
              onTouchStart={isTop ? handleTouchStart : undefined}
              onTouchMove={isTop ? handleTouchMove : undefined}
              onTouchEnd={isTop ? handleTouchEnd : undefined}
            >
              <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">"{msg.question}"</p>
              <p className="text-xl leading-relaxed mb-6" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
                {msg.answer}
              </p>
              <p className="text-[11px] text-gray-400">
                {currentIndex + i + 1} / {messages.length}
              </p>
            </div>
          )
        })}

        {/* 스와이프 힌트 */}
        <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          위로 스와이프
        </p>
      </div>
    </div>
  )
}

// 테마 색상 정의
type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#C41050', secondary: '#B8956A', accent: '#B8956A', background: '#FFF8F5', sectionBg: '#FFE8E8', cardBg: '#FFFFFF', divider: '#d4b896', text: '#2a2a2a', gray: '#444444' },
  'modern-black': { primary: '#111111', secondary: '#555555', accent: '#111111', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#2a2a2a', gray: '#444444' },
  'romantic-blush': { primary: '#A67A7A', secondary: '#8a7068', accent: '#8a7068', background: '#FDF8F6', sectionBg: '#F8EFEC', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#2a2a2a', gray: '#444444' },
  'nature-green': { primary: '#3A5A3A', secondary: '#6A7A62', accent: '#5A7A52', background: '#F5F7F4', sectionBg: '#EBF0E8', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#2a2a2a', gray: '#444444' },
  'luxury-navy': { primary: '#0f2035', secondary: '#8A6A3A', accent: '#8A6A3A', background: '#F8F9FA', sectionBg: '#E8ECF0', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#2a2a2a', gray: '#444444' },
  'sunset-coral': { primary: '#B85040', secondary: '#B88060', accent: '#B8683A', background: '#FFFAF7', sectionBg: '#FFEEE5', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#2a2a2a', gray: '#444444' },
}

// 폰트 스타일 정의
type FontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'
interface FontConfig { display: string; displayKr: string; body: string }

const fontStyles: Record<FontStyle, FontConfig> = {
  classic: { display: "'Playfair Display', serif", displayKr: "'Ridibatang', serif", body: "'Ridibatang', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Pretendard', sans-serif", body: "'Pretendard', sans-serif" },
  romantic: { display: "'Lora', serif", displayKr: "'Okticon', serif", body: "'Okticon', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'JeonnamEducationBarun', sans-serif", body: "'JeonnamEducationBarun', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'ELandChoice', serif", body: "'ELandChoice', serif" },
}

// 날짜 포맷
function formatDateDisplay(d: string): string {
  if (!d) return '2024.11.04'
  const date = new Date(d), y = date.getFullYear(), m = date.getMonth() + 1, day = date.getDate()
  const w = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
  return y + '.' + m + '.' + day + ' ' + w
}

function calculateDday(d: string): string {
  if (!d) return 'D-000'
  const wedding = new Date(d), today = new Date()
  today.setHours(0, 0, 0, 0); wedding.setHours(0, 0, 0, 0)
  const diff = Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? 'D-' + diff : diff === 0 ? 'D-Day' : 'D+' + Math.abs(diff)
}

// 국화 아이콘 (고인 표시)
const ChrysanthemumIcon = () => (
  <img
    src="/icons/chrysanthemum.svg"
    alt="고인"
    className="inline w-3 h-3 mr-0.5 opacity-70 align-middle"
    style={{ verticalAlign: 'middle', marginTop: '-2px' }}
  />
)

// 부모님 이름 표시
const ParentName = ({ name, deceased }: { name: string; deceased?: boolean }) => (
  <span>
    {deceased && <ChrysanthemumIcon />}
    {name}
  </span>
)

// BGM Player
function BgmPlayer({ bgm }: { bgm?: { enabled?: boolean; url?: string; autoplay?: boolean } }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (bgm?.enabled && bgm.autoplay && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false))
    }
  }, [bgm])

  if (!bgm?.enabled || !bgm.url) return null

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={bgm.url} loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      <button
        onClick={togglePlay}
        className="fixed bottom-24 right-4 z-50 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </>
  )
}

interface InvitationViewProps {
  invitation: Invitation
  content: InvitationContent | null
  isPaid: boolean
}

// 한글 이름을 성/이름으로 분리하는 헬퍼 함수
function splitKoreanName(fullName: string): { lastName: string; firstName: string } {
  if (!fullName || fullName.length === 0) {
    return { lastName: '', firstName: '' }
  }

  // 한글 이름인 경우 첫 글자를 성으로 가정
  if (/^[가-힣]+$/.test(fullName)) {
    return {
      lastName: fullName.charAt(0),
      firstName: fullName.slice(1)
    }
  }

  // 한글이 아닌 경우 그대로 반환
  return { lastName: '', firstName: fullName }
}

// 기본값 생성 함수
function createDefaultContent(invitation: Invitation): InvitationContent {
  // 신랑/신부 이름 자동 분리
  const groomNameParts = splitKoreanName(invitation.groom_name || '')
  const brideNameParts = splitKoreanName(invitation.bride_name || '')

  return {
    groom: {
      name: invitation.groom_name || '',
      lastName: groomNameParts.lastName,
      firstName: groomNameParts.firstName,
      phone: '',
      father: { name: '', phone: '', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
      mother: { name: '', phone: '', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
      bank: { bank: '', account: '', holder: '', enabled: false },
      profile: { images: [], imageSettings: [], aboutLabel: 'ABOUT GROOM', subtitle: '', intro: '', tag: '' }
    },
    bride: {
      name: invitation.bride_name || '',
      lastName: brideNameParts.lastName,
      firstName: brideNameParts.firstName,
      phone: '',
      father: { name: '', phone: '', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
      mother: { name: '', phone: '', deceased: false, bank: { bank: '', account: '', holder: '', enabled: false } },
      bank: { bank: '', account: '', holder: '', enabled: false },
      profile: { images: [], imageSettings: [], aboutLabel: 'ABOUT BRIDE', subtitle: '', intro: '', tag: '' }
    },
    wedding: { date: invitation.wedding_date || '', time: '', timeDisplay: invitation.wedding_time || '', dayOfWeek: '', title: 'OUR WEDDING', venue: { name: invitation.venue_name || '', hall: '', address: invitation.venue_address || '' }, directions: { car: '', publicTransport: '', train: '', expressBus: '' } },
    relationship: { startDate: '', stories: [], closingText: '' },
    content: { greeting: invitation.greeting_message || '', quote: { text: '', author: '' }, thankYou: { title: 'THANK YOU', message: '', sign: '' }, info: { dressCode: { title: '', content: '', enabled: false }, photoShare: { title: '', content: '', buttonText: '', url: '', enabled: false }, photoBooth: { title: '', content: '', enabled: false }, flowerChild: { title: '', content: '', enabled: false }, flowerGift: { title: '', content: '', enabled: false }, wreath: { title: '', content: '', enabled: false }, shuttle: { title: '', content: '', enabled: false }, reception: { title: '', content: '', venue: '', datetime: '', enabled: false }, customItems: [], itemOrder: ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception'] }, interviews: [], guestbookQuestions: [], parentsGreeting: '', parentsSign: '', interviewIntro: '' },
    gallery: { images: [], imageSettings: [] },
    media: { coverImage: invitation.main_image || '', infoImage: '', bgm: '' },
    meta: { title: '', description: '', ogImage: '', kakaoThumbnail: '', kakaoTitle: '', kakaoDescription: '' },
    templateId: 'narrative-our',
    primaryColor: '#E91E63',
    secondaryColor: '#D4A574',
    accentColor: '#d4a574',
    backgroundColor: '#FFF8F5',
    textColor: '#333333',
    fontStyle: 'classic',
    colorTheme: 'classic-rose',
    rsvpEnabled: true,
    rsvpDeadline: '',
    rsvpAllowGuestCount: true,
    deceasedDisplayStyle: 'flower',
    sectionVisibility: { coupleProfile: true, ourStory: true, parentsGreeting: true, interview: true, guidance: false, bankAccounts: true, guestbook: true, contacts: true },
    profileOrder: 'groom-first',
    design: { introAnimation: 'fade-in', coverTitle: 'OUR WEDDING', sectionDividers: { invitation: 'INVITATION', ourStory: 'OUR STORY', aboutUs: 'ABOUT US', interview: 'INTERVIEW', gallery: 'GALLERY', information: 'INFORMATION', location: 'LOCATION', rsvp: 'RSVP', thankYou: 'THANK YOU', guestbook: 'GUESTBOOK' } },
    bgm: { enabled: false, url: '', autoplay: false },
    guidance: { enabled: false, title: '', content: '', image: '', imageSettings: { scale: 1, positionX: 0, positionY: 0 } },
    intro: getDefaultIntroSettings('cinematic'),
    fullHeightDividers: {
      enabled: false,
      items: [
        { id: 'divider-1', englishTitle: '', koreanText: '', image: '', imageSettings: { scale: 1, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 } },
        { id: 'divider-2', englishTitle: '', koreanText: '', image: '', imageSettings: { scale: 1, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 } },
        { id: 'divider-3', englishTitle: '', koreanText: '', image: '', imageSettings: { scale: 1, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 } },
      ],
    },
    ourStory: '',
    decision: '',
    invitation: '',
  } as InvitationContent
}

export default function InvitationView({ invitation, content, isPaid }: InvitationViewProps) {
  const [showIntroAnimation, setShowIntroAnimation] = useState(true)
  const [introAnimationComplete, setIntroAnimationComplete] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'cover' | 'invitation' | 'main'>('cover')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showWhiteOverlay, setShowWhiteOverlay] = useState(false)

  // content가 없으면 기본값 사용
  let displayData: InvitationContent = content || createDefaultContent(invitation)

  // content가 있지만 lastName/firstName이 없는 경우 자동 분리 (기존 데이터 호환)
  if (displayData.groom && (!displayData.groom.lastName || !displayData.groom.firstName) && displayData.groom.name) {
    const groomParts = splitKoreanName(displayData.groom.name)
    displayData = {
      ...displayData,
      groom: {
        ...displayData.groom,
        lastName: groomParts.lastName,
        firstName: groomParts.firstName
      }
    }
  }
  if (displayData.bride && (!displayData.bride.lastName || !displayData.bride.firstName) && displayData.bride.name) {
    const brideParts = splitKoreanName(displayData.bride.name)
    displayData = {
      ...displayData,
      bride: {
        ...displayData.bride,
        lastName: brideParts.lastName,
        firstName: brideParts.firstName
      }
    }
  }

  const groomName = displayData.groom?.name || 'Groom'
  const brideName = displayData.bride?.name || 'Bride'
  const fonts = fontStyles[displayData.fontStyle || 'classic']
  const themeColors = colorThemes[displayData.colorTheme || 'classic-rose']

  // 인트로 애니메이션 완료 핸들러
  const handleIntroAnimationComplete = () => {
    setIntroAnimationComplete(true)
    setTimeout(() => setShowIntroAnimation(false), 500)
  }

  // 화면 전환 핸들러 (흰색 페이드 효과)
  const switchScreen = (to: 'cover' | 'invitation' | 'main') => {
    if (isTransitioning) return
    setIsTransitioning(true)

    // 1. 흰색 오버레이 fade-in
    setShowWhiteOverlay(true)

    setTimeout(() => {
      // 2. 화면 전환
      setCurrentScreen(to)
      window.scrollTo({ top: 0, behavior: 'auto' })

      setTimeout(() => {
        // 3. 흰색 오버레이 fade-out
        setShowWhiteOverlay(false)
        setIsTransitioning(false)
      }, 100)
    }, 500) // fade-in 완료 후 전환
  }

  // 커버 클릭 → 인비테이션 화면
  const handleCoverClick = () => {
    switchScreen('invitation')
  }

  // Next Story 클릭 → 메인 화면
  const goToMainPage = () => {
    switchScreen('main')
  }

  // 인트로로 돌아가기
  const goBackToCover = () => {
    switchScreen('cover')
  }

  // 인트로 설정
  const introSettings = displayData.intro as IntroSettings | undefined

  // 연락처 정보
  const contacts = [
    displayData.groom?.phone && { name: displayData.groom.name, phone: displayData.groom.phone, role: '신랑', side: 'groom' as const },
    displayData.groom?.father?.phone && { name: displayData.groom.father.name, phone: displayData.groom.father.phone, role: '아버지', side: 'groom' as const },
    displayData.groom?.mother?.phone && { name: displayData.groom.mother.name, phone: displayData.groom.mother.phone, role: '어머니', side: 'groom' as const },
    displayData.bride?.phone && { name: displayData.bride.name, phone: displayData.bride.phone, role: '신부', side: 'bride' as const },
    displayData.bride?.father?.phone && { name: displayData.bride.father.name, phone: displayData.bride.father.phone, role: '아버지', side: 'bride' as const },
    displayData.bride?.mother?.phone && { name: displayData.bride.mother.name, phone: displayData.bride.mother.phone, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; phone: string; role: string; side: 'groom' | 'bride' }[]

  // 계좌 정보
  const accounts = [
    displayData.groom?.bank?.enabled && { name: displayData.groom.name, bank: displayData.groom.bank, role: '신랑', side: 'groom' as const },
    displayData.groom?.father?.bank?.enabled && { name: displayData.groom.father.name, bank: displayData.groom.father.bank, role: '아버지', side: 'groom' as const },
    displayData.groom?.mother?.bank?.enabled && { name: displayData.groom.mother.name, bank: displayData.groom.mother.bank, role: '어머니', side: 'groom' as const },
    displayData.bride?.bank?.enabled && { name: displayData.bride.name, bank: displayData.bride.bank, role: '신부', side: 'bride' as const },
    displayData.bride?.father?.bank?.enabled && { name: displayData.bride.father.name, bank: displayData.bride.father.bank, role: '아버지', side: 'bride' as const },
    displayData.bride?.mother?.bank?.enabled && { name: displayData.bride.mother.name, bank: displayData.bride.mother.bank, role: '어머니', side: 'bride' as const },
  ].filter(Boolean) as { name: string; bank: { bank: string; account: string; holder: string; enabled: boolean }; role: string; side: 'groom' | 'bride' }[]

  return (
    <div
      className={`relative min-h-screen theme-${displayData.colorTheme || 'classic-rose'}`}
      style={{
        fontFamily: fonts.body,
        color: themeColors.text,
        letterSpacing: '-0.3px',
        paddingTop: isPaid ? 0 : '40px',
      }}
    >
      {/* 미결제 워터마크 배너 */}
      {!isPaid && (
        <div
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2.5 text-xs"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
            color: '#fff',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>미리보기 모드 - 결제 후 워터마크가 제거됩니다</span>
        </div>
      )}

      {/* 인트로 애니메이션 (전체 화면 오버레이) */}
      {showIntroAnimation && introSettings?.presetId && (
        <IntroAnimation
          settings={introSettings}
          coverImage={displayData.media?.coverImage}
          coverImageSettings={displayData.media?.coverImageSettings}
          groomName={groomName}
          brideName={brideName}
          weddingDate={displayData.wedding?.date}
          venueName={displayData.wedding?.venue?.name}
          onComplete={handleIntroAnimationComplete}
          isComplete={introAnimationComplete}
        />
      )}

      {/* BGM Player */}
      <BgmPlayer bgm={displayData.bgm} />

      {/* 흰색 페이드 전환 오버레이 */}
      {showWhiteOverlay && (
        <div
          className="screen-transition-overlay fade-in"
          style={{ opacity: showWhiteOverlay ? 1 : 0 }}
        />
      )}

      {/* 3-Screen 구조: Cover → Invitation → Main */}
      <div style={{ opacity: showIntroAnimation && introSettings?.presetId ? 0 : 1, transition: 'opacity 0.5s ease' }}>
        {/* 커버 화면 */}
        {currentScreen === 'cover' && (
          <CoverScreen
            invitation={displayData}
            groomName={groomName}
            brideName={brideName}
            fonts={fonts}
            themeColors={themeColors}
            isPaid={isPaid}
            onCoverClick={handleCoverClick}
          />
        )}

        {/* 인비테이션 화면 (인사말, 부모님 정보, 예식 정보) */}
        {currentScreen === 'invitation' && (
          <InvitationScreen
            invitation={displayData}
            groomName={groomName}
            brideName={brideName}
            fonts={fonts}
            themeColors={themeColors}
            isPaid={isPaid}
            onNextPage={goToMainPage}
            onBackToCover={goBackToCover}
          />
        )}

        {/* 메인 콘텐츠 화면 */}
        {currentScreen === 'main' && (
          <MainPage
            invitation={displayData}
            groomName={groomName}
            brideName={brideName}
            fonts={fonts}
            themeColors={themeColors}
            invitationId={invitation.id}
            isPaid={isPaid}
            onBackToIntro={goBackToCover}
          />
        )}
      </div>

      {/* Floating Buttons - 모든 페이지에서 표시 */}
      <GuestFloatingButton
        themeColors={themeColors}
        fonts={fonts}
        showTooltip={currentScreen === 'invitation'}
        invitation={{
          venue_name: displayData.wedding?.venue?.name || '',
          venue_address: displayData.wedding?.venue?.address || '',
          contacts,
          accounts,
          directions: displayData.wedding?.directions,
          rsvpEnabled: displayData.rsvpEnabled,
          rsvpAllowGuestCount: displayData.rsvpAllowGuestCount,
          invitationId: invitation.id,
          groomName,
          brideName,
          weddingDate: displayData.wedding?.date,
          weddingTime: displayData.wedding?.timeDisplay || displayData.wedding?.time,
          thumbnailUrl: displayData.meta?.kakaoThumbnail || displayData.meta?.ogImage || displayData.media?.coverImage || displayData.gallery?.images?.[0] || '',
          shareTitle: displayData.meta?.title,
          shareDescription: displayData.meta?.description,
        }}
      />
    </div>
  )
}

// Props 타입
interface PageProps {
  invitation: InvitationContent
  groomName: string
  brideName: string
  fonts: FontConfig
  themeColors: ColorConfig
  invitationId?: string
  isPaid?: boolean
  onNextPage?: () => void
  onBackToIntro?: () => void
  onCoverClick?: () => void
  onBackToCover?: () => void
}

// === COVER SCREEN (첫 번째 화면 - 클릭하면 인비테이션으로 전환) ===
function CoverScreen({ invitation, groomName, brideName, fonts, themeColors, isPaid, onCoverClick }: PageProps) {
  const introAnimation = invitation.design?.introAnimation || 'fade-in'
  const coverTitle = invitation.design?.coverTitle || invitation.wedding?.title || 'OUR WEDDING'

  return (
    <div
      className="min-h-screen cursor-pointer"
      onClick={onCoverClick}
    >
      {/* 커버 섹션 - 전체 화면 */}
      <WatermarkOverlay isPaid={isPaid ?? false} className="relative flex flex-col justify-center items-center" style={{ minHeight: '100vh' }}>
        <section
          className={`absolute inset-0 ${introAnimation !== 'none' ? `intro-animation-${introAnimation}` : ''}`}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: invitation.media?.coverImage ? `url(${invitation.media.coverImage})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'top',
              filter: 'grayscale(100%)'
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </section>
        <div className="relative z-10 text-center text-white px-5">
          <p className="text-[13px] font-light mb-4" style={{ fontFamily: fonts.displayKr, letterSpacing: '2px' }}>
            {groomName} & {brideName}
          </p>
          <h1 className="text-2xl mb-5" style={{ fontFamily: fonts.display, letterSpacing: '6px', fontWeight: 400 }}>
            {coverTitle}
          </h1>
          <p className="text-[10px] font-light mb-2" style={{ letterSpacing: '4px' }}>
            {invitation.wedding?.venue?.name || 'VENUE NAME'}
          </p>
          <p className="text-[11px] font-light" style={{ fontFamily: fonts.displayKr, letterSpacing: '1px' }}>
            {formatDateDisplay(invitation.wedding?.date || '')} {invitation.wedding?.timeDisplay || '2:00 PM'}
          </p>
        </div>

        {/* 클릭 안내 표시 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          <span className="text-[10px] text-white/70 mb-2">Tap to Open</span>
          <div className="w-px h-6 bg-gradient-to-b from-white/60 to-transparent" />
          <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce mt-1" />
        </div>
      </WatermarkOverlay>
    </div>
  )
}

// === INVITATION SCREEN (두 번째 화면 - 인사말, 부모님 정보, 예식 정보) ===
function InvitationScreen({ invitation, groomName, brideName, fonts, themeColors, isPaid, onNextPage, onBackToCover }: PageProps) {
  // 화면 등장 시 순차 애니메이션을 위한 스타일 (더 느리게)
  const entryAnimation = (delay: number) => ({
    animation: `screenFadeIn 1.2s ease-out ${delay}s forwards`,
    opacity: 0,
  })

  return (
    <div className="min-h-screen" style={{ background: themeColors.background }}>
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBackToCover}
        className="fixed top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/10 backdrop-blur-sm text-[10px] hover:bg-black/20 transition-colors"
        style={{ color: themeColors.text, ...entryAnimation(0.3) }}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Cover
      </button>

      {/* 인사말 섹션 */}
      <section className="px-7 py-16 text-center">
        <p
          className="text-[10px] font-light mb-9"
          style={{ color: themeColors.gray, letterSpacing: '4px', ...entryAnimation(0.1) }}
        >
          INVITATION
        </p>

        {invitation.content?.quote?.text && (
          <div
            className="py-5 mb-9"
            style={{ borderTop: `1px solid ${themeColors.divider}`, borderBottom: `1px solid ${themeColors.divider}`, ...entryAnimation(0.2) }}
          >
            <p
              className="text-[13px] font-light leading-[1.9] mb-2"
              style={{ fontFamily: fonts.displayKr, color: themeColors.primary }}
              dangerouslySetInnerHTML={{ __html: invitation.content.quote.text.replace(/\n/g, '<br/>') }}
            />
            {invitation.content.quote.author && (
              <p className="text-[11px] font-light" style={{ color: themeColors.gray }}>
                {invitation.content.quote.author}
              </p>
            )}
          </div>
        )}

        <div className="mb-11" style={entryAnimation(0.3)}>
          <p
            className="text-[13px] font-light leading-[2.1]"
            style={{ fontFamily: fonts.displayKr, color: themeColors.text }}
            dangerouslySetInnerHTML={{ __html: invitation.content?.greeting ? invitation.content.greeting.replace(/\n/g, '<br/>') : '소중한 분들을 초대합니다.' }}
          />
        </div>

        {/* 부모님 정보 */}
        <div className="mb-9 text-center" style={{ fontFamily: fonts.displayKr, ...entryAnimation(0.4) }}>
          <div className="mb-3">
            <p className="text-[11px] font-light leading-[2]" style={{ color: themeColors.text }}>
              {invitation.groom?.father?.name && <><ParentName name={invitation.groom.father.name} deceased={invitation.groom.father.deceased} /> · </>}
              {invitation.groom?.mother?.name && <><ParentName name={invitation.groom.mother.name} deceased={invitation.groom.mother.deceased} /></>}
              {(invitation.groom?.father?.name || invitation.groom?.mother?.name) && <span style={{ color: themeColors.gray }}> 의 아들 </span>}
              <span style={{ color: themeColors.primary, fontWeight: 500 }}>{groomName}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-light leading-[2]" style={{ color: themeColors.text }}>
              {invitation.bride?.father?.name && <><ParentName name={invitation.bride.father.name} deceased={invitation.bride.father.deceased} /> · </>}
              {invitation.bride?.mother?.name && <><ParentName name={invitation.bride.mother.name} deceased={invitation.bride.mother.deceased} /></>}
              {(invitation.bride?.father?.name || invitation.bride?.mother?.name) && <span style={{ color: themeColors.gray }}> 의 딸 </span>}
              <span style={{ color: themeColors.primary, fontWeight: 500 }}>{brideName}</span>
            </p>
          </div>
        </div>

        {/* 예식 정보 카드 */}
        <div
          className="rounded-2xl px-6 py-7 mb-9"
          style={{
            background: themeColors.cardBg,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)',
            ...entryAnimation(0.5)
          }}
        >
          <span
            className="inline-block text-[9px] font-light px-3 py-1 rounded-full mb-5"
            style={{ background: '#f0f0f0', color: '#888' }}
          >
            Until wedding {calculateDday(invitation.wedding?.date || '')}
          </span>
          <div className="pb-4 mb-4 border-b border-gray-100">
            <p className="text-lg font-light mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '3px' }}>
              {formatDateDisplay(invitation.wedding?.date || '')}
            </p>
            <p className="text-[11px] font-light" style={{ color: '#777' }}>
              {invitation.wedding?.timeDisplay || '2:00 PM'}
            </p>
          </div>
          <div className="mb-5">
            <p className="text-xs mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>
              {invitation.wedding?.venue?.name} {invitation.wedding?.venue?.hall}
            </p>
            <p className="text-[10px] font-light" style={{ color: '#999' }}>
              {invitation.wedding?.venue?.address || ''}
            </p>
          </div>
          <button
            className="px-7 py-2.5 border border-gray-300 rounded-md text-[10px] font-light"
            style={{ color: '#666' }}
          >
            Get Directions
          </button>
        </div>

        {/* Next Story 버튼 - 클릭하면 MainPage로 이동 */}
        <div className="flex flex-col items-center justify-center w-full" style={entryAnimation(0.6)}>
          <button
            onClick={onNextPage}
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity py-4"
          >
            <span className="text-[11px] font-light" style={{ color: themeColors.gray }}>Next Story</span>
            <div className="flex flex-col items-center mt-4">
              <div className="w-px h-8 bg-gradient-to-b from-gray-400/30 to-transparent" />
              <div className="w-1 h-1 bg-gray-400 rounded-full opacity-30 animate-bounce" />
            </div>
          </button>
        </div>

        {/* 하단 여백 (플로팅 버튼 공간) */}
        <div className="h-20" />
      </section>
    </div>
  )
}

// === MAIN PAGE ===
function MainPage({ invitation, groomName, brideName, fonts, themeColors, isPaid, onBackToIntro }: PageProps) {
  const sectionVisibility = invitation.sectionVisibility || {
    coupleProfile: true, ourStory: true, interview: true, guidance: true, bankAccounts: true, guestbook: true
  }

  // 스크롤 애니메이션 훅
  const scrollContainerRef = useScrollAnimation()

  // 갤러리 라이트박스 상태
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // 방명록 모달 상태
  const [guestbookModalOpen, setGuestbookModalOpen] = useState(false)

  // 갤러리 이미지 클릭 핸들러
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // 샘플 방명록 메시지 (실제로는 API에서 가져옴)
  const guestbookMessages = [
    { question: '두 사람에게 해주고 싶은 말은?', answer: '행복하세요!', color: '#FFF9F0' },
    { question: '결혼생활에서 가장 중요한 건?', answer: '서로 믿는 것', color: '#F0F7FF' },
    { question: '축하의 말을 전해주세요', answer: '행복하게 살아요!', color: '#F5FFF0' },
  ]

  return (
    <>
      {/* 갤러리 라이트박스 */}
      {lightboxOpen && invitation.gallery?.images && invitation.gallery.images.length > 0 && (
        <GalleryLightbox
          images={invitation.gallery.images}
          imageSettings={invitation.gallery.imageSettings}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* 방명록 모달 */}
      {guestbookModalOpen && (
        <GuestbookModal
          messages={guestbookMessages}
          initialIndex={0}
          onClose={() => setGuestbookModalOpen(false)}
          fonts={fonts}
          themeColors={themeColors}
        />
      )}
    <div ref={scrollContainerRef} className="relative min-h-screen">
      {/* 상단 커버 배너 */}
      <section className="relative h-[200px] flex items-end justify-center" style={{ backgroundImage: invitation.media?.coverImage ? `url(${invitation.media.coverImage})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', backgroundSize: 'cover', backgroundPosition: 'top' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Back to Intro 버튼 */}
        <button
          onClick={onBackToIntro}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] hover:bg-white/30 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Intro
        </button>
        <div className="relative z-10 text-center text-white pb-8">
          <p className="text-xs font-light" style={{ fontFamily: fonts.displayKr, letterSpacing: '1.5px' }}>{groomName} & {brideName}<br />결혼합니다.</p>
        </div>
      </section>

      {/* 구분선 섹션 */}
      <section className="anim-section py-20 px-7 text-center" style={{ background: themeColors.cardBg }}>
        <div className="anim-line anim-line-top w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} />
        <div className="anim-title" style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: themeColors.text, letterSpacing: '3px', lineHeight: 1.9 }}>
          <span className="block">{groomName} & {brideName}</span>
          <span className="block">결혼합니다.</span>
        </div>
        <div className="anim-line anim-line-bottom w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} />
      </section>

      {/* Couple Profile Section */}
      {sectionVisibility.coupleProfile && invitation.bride?.profile?.intro && (
        <section className="anim-section px-7 py-14" style={{ background: themeColors.sectionBg }}>
          <ProfileImageSlider images={invitation.bride.profile.images} imageSettings={invitation.bride.profile.imageSettings} className="anim-image mb-10" />
          <div className="anim-stagger text-center mb-8">
            <p className="text-[10px] font-light mb-4 anim-underline" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '3px', display: 'inline-block' }}>{invitation.bride.profile.aboutLabel}</p>
            <p className="text-[11px] font-light" style={{ color: '#999' }}>{invitation.bride.profile.subtitle}</p>
          </div>
          <div className="anim-paragraph text-xs font-light leading-[2.2] text-left" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.bride.profile.intro) }} />
          {invitation.bride.profile.tag && <div className="anim-fade inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md text-[10px] font-light" style={{ background: 'rgba(0,0,0,0.03)', color: '#777' }}>&#9829; {invitation.bride.profile.tag}</div>}
        </section>
      )}
      {sectionVisibility.coupleProfile && invitation.groom?.profile?.intro && (
        <section className="anim-section px-7 py-14" style={{ background: themeColors.sectionBg }}>
          <ProfileImageSlider images={invitation.groom.profile.images} imageSettings={invitation.groom.profile.imageSettings} className="anim-image mb-10" />
          <div className="anim-stagger text-center mb-8">
            <p className="text-[10px] font-light mb-4 anim-underline" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '3px', display: 'inline-block' }}>{invitation.groom.profile.aboutLabel}</p>
            <p className="text-[11px] font-light" style={{ color: '#999' }}>{invitation.groom.profile.subtitle}</p>
          </div>
          <div className="anim-paragraph text-xs font-light leading-[2.2] text-left" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.groom.profile.intro) }} />
          {invitation.groom.profile.tag && <div className="anim-fade inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md text-[10px] font-light" style={{ background: 'rgba(0,0,0,0.03)', color: '#777' }}>&#9829; {invitation.groom.profile.tag}</div>}
        </section>
      )}

      {/* Our Story Section */}
      {sectionVisibility.ourStory && invitation.relationship?.stories?.some(s => s.title || s.desc) && (
        <>
          <section className="anim-section py-16 px-7 text-center" style={{ background: themeColors.cardBg }}>
            <div className="anim-line anim-line-top w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} />
            <p className="anim-title text-sm font-light mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '1px' }}>사랑이 시작된 작은 순간들</p>
            <div className="anim-line anim-line-bottom w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} />
          </section>
          {invitation.relationship.stories.map((story, index) => story.title || story.desc ? (
            <section key={index} className="anim-section px-7 py-14 text-center" style={{ background: themeColors.sectionBg }}>
              {story.date && <p className="anim-fade text-[10px] font-light mb-3" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '2px' }}>{story.date}</p>}
              {story.title && <p className="anim-title text-[15px] mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>{story.title}</p>}
              {story.desc && <p className="anim-paragraph text-[11px] font-light leading-[1.9] mb-7" style={{ color: '#777' }} dangerouslySetInnerHTML={{ __html: parseHighlight(story.desc) }} />}
              {story.images && story.images.length > 0 && (
                <div className={`anim-stagger grid gap-3 ${story.images.length === 1 ? 'grid-cols-1' : story.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {story.images.slice(0, 3).map((img, i) => {
                    const s = story.imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }
                    return (
                      <div key={i} className={`rounded-lg overflow-hidden ${story.images && story.images.length === 3 && i === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}>
                        <div className="w-full h-full bg-cover bg-center transition-transform duration-300" style={{ backgroundImage: `url(${img})`, transform: `scale(${s.scale}) translate(${s.positionX}%, ${s.positionY}%)` }} />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null)}
          {/* Closing Text */}
          <section className="anim-section px-7 py-10 text-center" style={{ background: themeColors.sectionBg }}>
            <p className="anim-paragraph text-sm leading-relaxed" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              {invitation.relationship.closingText || "그리고 이제 드디어 부르는 서로의 이름에\n'신랑', '신부'라는 호칭을 담습니다."}
            </p>
          </section>
        </>
      )}

      {/* Gallery Section */}
      <section className="anim-section px-5 py-10" style={{ background: themeColors.cardBg }}>
        <p className="anim-title text-[10px] font-light text-center mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>GALLERY</p>
        <div className="anim-stagger grid grid-cols-2 gap-2">
          {invitation.gallery?.images && invitation.gallery.images.length > 0 ? invitation.gallery.images.map((img, i) => {
            const s = invitation.gallery?.imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }
            return (
              <div
                key={i}
                className="aspect-square rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openLightbox(i)}
              >
                <div className="w-full h-full bg-cover bg-center transition-transform duration-300" style={{ backgroundImage: `url(${img})`, transform: `scale(${s.scale}) translate(${s.positionX}%, ${s.positionY}%)` }} />
              </div>
            )
          }) : [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square rounded bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          ))}
        </div>
      </section>

      {/* Interview Section */}
      {sectionVisibility.interview && invitation.content?.interviews?.some(i => i.question || i.answer) && (
        <>
          <section className="anim-section py-16 px-7 text-center" style={{ background: themeColors.cardBg }}>
            <div className="anim-line anim-line-top w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} />
            <p className="anim-title text-sm font-light mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '1px' }}>{invitation.content?.interviewIntro || '결혼에 관한 우리의 이야기'}</p>
            <div className="anim-line anim-line-bottom w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} />
          </section>
          {invitation.content.interviews.map((interview, index) => interview.question || interview.answer ? (
            <section key={index} className="anim-section px-7 py-14" style={{ background: interview.bgClass === 'pink-bg' ? themeColors.sectionBg : themeColors.cardBg }}>
              {interview.images && interview.images.length > 0 ? (
                <ProfileImageSlider
                  images={interview.images}
                  imageSettings={interview.imageSettings}
                  className="anim-image mb-8"
                  autoPlay={true}
                  autoPlayInterval={4000}
                />
              ) : (
                <div className="w-full aspect-[3/4] rounded-xl mb-8 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Interview Image</span>
                </div>
              )}
              {interview.question && <p className="anim-title text-sm mb-5 text-center"><span className="anim-underline" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400, display: 'inline-block' }}>{interview.question}</span></p>}
              {interview.answer && <p className="anim-paragraph text-[11px] font-light leading-[2.2]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(interview.answer) }} />}
            </section>
          ) : null)}
        </>
      )}

      {/* Guidance Section */}
      {sectionVisibility.guidance && (
        <section className="anim-section px-6 py-14" style={{ background: themeColors.background }}>
          {invitation.guidance?.image && (
            <div className="anim-image w-full aspect-[4/5] rounded-2xl mb-8 bg-cover bg-center overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)' }}>
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-300"
                style={{
                  backgroundImage: `url(${invitation.guidance.image})`,
                  transform: `scale(${invitation.guidance.imageSettings?.scale || 1}) translate(${invitation.guidance.imageSettings?.positionX || 0}%, ${invitation.guidance.imageSettings?.positionY || 0}%)`
                }}
              />
            </div>
          )}
          <h3 className="anim-title text-[15px] text-center mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400, letterSpacing: '1px' }}>
            {invitation.guidance?.title || '행복한 시간을 위한 안내'}
          </h3>
          <div className="anim-line w-10 h-px mx-auto mb-8" style={{ background: `linear-gradient(90deg, transparent, ${themeColors.divider}, transparent)` }} />

          {/* Info Blocks */}
          {invitation.content?.info?.dressCode?.enabled && (
            <div className="anim-card rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {invitation.content.info.dressCode.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.dressCode.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content?.info?.photoShare?.enabled && (
            <div className="anim-card rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {invitation.content.info.photoShare.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.photoShare.content.replace(/\n/g, '<br/>') }} />
              <button className="mt-4 px-7 py-3.5 rounded-xl text-xs" style={{ background: 'linear-gradient(135deg, #f5ebe0 0%, #ede4d8 100%)', color: '#6b5a48', fontWeight: 400, letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(180,150,120,0.12)' }}>
                {invitation.content.info.photoShare.buttonText}
              </button>
            </div>
          )}
          {invitation.content?.info?.photoBooth?.enabled && (
            <div className="anim-card rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {invitation.content.info.photoBooth.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.photoBooth.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content?.info?.flowerChild?.enabled && (
            <div className="anim-card rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {invitation.content.info.flowerChild.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.flowerChild.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content?.info?.customItems?.map(item => item.enabled && (
            <div key={item.id} className="anim-card rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {item.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br/>') }} />
            </div>
          ))}
        </section>
      )}

      {/* Thank You Section */}
      <section className="anim-section min-h-[300px] flex flex-col justify-center items-center text-center px-7 py-20" style={{ background: themeColors.sectionBg }}>
        <p className="anim-fade text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>THANK YOU</p>
        <h2 className="anim-title text-lg mb-7" style={{ fontFamily: fonts.display, color: themeColors.text, fontWeight: 400, letterSpacing: '4px' }}>{invitation.content?.thankYou?.title || 'THANK YOU'}</h2>
        {invitation.content?.thankYou?.message ? (
          <p className="anim-paragraph text-[11px] font-light leading-[2.2] mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: invitation.content.thankYou.message.replace(/\n/g, '<br/>') }} />
        ) : (
          <p className="anim-paragraph text-[11px] text-gray-400 mb-7">참석해 주셔서 감사합니다.</p>
        )}
        {invitation.content?.thankYou?.sign && <p className="anim-fade text-[11px] font-light" style={{ fontFamily: fonts.displayKr, color: themeColors.gray }}>{invitation.content.thankYou.sign}</p>}
      </section>

      {/* 웨이브 디자인 */}
      <div className="relative h-[60px] overflow-hidden" style={{ background: themeColors.sectionBg }}>
        <div className="absolute bottom-0 left-0 w-full h-full" style={{ background: themeColors.cardBg }} />
        <svg className="absolute bottom-0 w-[250%]" viewBox="0 0 2880 120" preserveAspectRatio="none" style={{ left: '-5%', height: '100%' }}>
          <path fill={`${themeColors.cardBg}66`} d="M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40 T1800,40 T2160,40 T2520,40 T2880,40 L2880,120 L0,120 Z" />
          <path fill={`${themeColors.cardBg}99`} d="M0,50 Q240,90 480,50 T960,50 T1440,50 T1920,50 T2400,50 T2880,50 L2880,120 L0,120 Z" />
          <path fill={themeColors.cardBg} d="M0,70 Q360,100 720,70 T1440,70 T2160,70 T2880,70 L2880,120 L0,120 Z" />
        </svg>
      </div>

      {/* Guestbook Section */}
      {sectionVisibility.guestbook && (
        <section className="anim-section px-5 py-14 pb-20 text-center" style={{ background: themeColors.cardBg }}>
          <p className="anim-fade text-[10px] font-light mb-4" style={{ color: themeColors.gray, letterSpacing: '4px' }}>GUESTBOOK</p>
          <h3 className="anim-title text-sm mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>축하의 한마디</h3>
          <div className="max-w-[300px] mx-auto mb-9">
            <p className="text-xs font-light leading-[1.7] mb-4 min-h-[40px]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>{invitation.content?.guestbookQuestions?.[0] || '두 사람에게 해주고 싶은 말은?'}</p>
            <div className="flex gap-2 mb-2.5">
              <input type="text" className="flex-1 px-3.5 py-3 border border-gray-200 rounded-lg text-[11px] font-light" style={{ background: '#fafafa', color: themeColors.text }} placeholder="20자 이내로 답해주세요" disabled />
              <button className="px-4 py-3 rounded-lg text-[10px] font-light text-white" style={{ background: themeColors.text }}>남기기</button>
            </div>
            <button className="text-[10px] font-light" style={{ color: '#aaa' }}>다른 질문 보기</button>
          </div>
          <div
            className="relative min-h-[200px] cursor-pointer"
            onClick={() => setGuestbookModalOpen(true)}
          >
            <div className="absolute w-[130px] px-3 py-3.5 bg-[#FFF9F0] rounded-lg text-left shadow-sm hover:shadow-md transition-shadow" style={{ transform: 'rotate(-3deg)', top: '10px', left: '20px' }}>
              <p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">두 사람에게 해주고 싶은 말은?</p>
              <p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>행복하세요!</p>
            </div>
            <div className="absolute w-[130px] px-3 py-3.5 bg-[#F0F7FF] rounded-lg text-left shadow-sm hover:shadow-md transition-shadow" style={{ transform: 'rotate(2deg)', top: '80px', right: '20px' }}>
              <p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">결혼생활에서 가장 중요한 건?</p>
              <p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>서로 믿는 것</p>
            </div>
            {/* 확대 안내 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              탭하여 전체 보기
            </div>
          </div>
        </section>
      )}

      {/* RSVP Section */}
      {invitation.rsvpEnabled && (
        <section className="anim-section px-6 py-14 text-center" style={{ background: themeColors.cardBg }}>
          <p className="anim-fade text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>RSVP</p>
          <p className="anim-paragraph text-sm mb-4" style={{ color: '#666' }}>참석 여부를 알려주세요</p>
          <button className="anim-card w-full py-3 rounded-lg text-xs" style={{ background: themeColors.primary, color: '#fff' }}>참석 여부 전달하기</button>
          {invitation.rsvpDeadline && <p className="anim-fade text-[10px] font-light mt-3" style={{ color: '#999' }}>마감일: {formatDateDisplay(invitation.rsvpDeadline)}</p>}
        </section>
      )}

      {/* Footer */}
      <div className="px-6 py-10 text-center" style={{ background: themeColors.background }}>
        <p className="text-[10px] font-light" style={{ color: '#999' }}>Thank you for celebrating with us</p>
        <p className="text-[9px] font-light mt-2" style={{ color: '#ccc' }}>Made with dear drawer</p>
      </div>
    </div>
    </>
  )
}
