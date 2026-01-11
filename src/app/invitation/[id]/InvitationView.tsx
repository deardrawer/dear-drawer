'use client'

import { useState, useRef, useEffect } from 'react'
import type { Invitation } from '@/types/invitation'
import type { InvitationContent } from '@/store/editorStore'
import GuestFloatingButton from '@/components/invitation/GuestFloatingButton'

// 테마 색상 정의
const colorThemes: Record<string, {
  primary: string
  secondary: string
  accent: string
  background: string
  sectionBg: string
  cardBg: string
  text: string
  gray: string
  divider: string
}> = {
  'classic-rose': {
    primary: '#C4A484',
    secondary: '#E8DCD0',
    accent: '#D4B896',
    background: '#FAF8F5',
    sectionBg: '#F5F2EF',
    cardBg: '#FFFFFF',
    text: '#4A4A4A',
    gray: '#9A9A9A',
    divider: '#E0D5C7',
  },
  'modern-black': {
    primary: '#2C2C2C',
    secondary: '#F5F5F5',
    accent: '#8B8B8B',
    background: '#FFFFFF',
    sectionBg: '#F5F5F5',
    cardBg: '#F8F8F8',
    text: '#1A1A1A',
    gray: '#6B6B6B',
    divider: '#E0E0E0',
  },
  'romantic-blush': {
    primary: '#E8B4B8',
    secondary: '#FDF5F5',
    accent: '#D4919A',
    background: '#FFF9F9',
    sectionBg: '#FDF5F5',
    cardBg: '#FFFFFF',
    text: '#5C4A4A',
    gray: '#A08888',
    divider: '#F0D8DA',
  },
  'nature-green': {
    primary: '#7D9471',
    secondary: '#E8EDE5',
    accent: '#9DB08F',
    background: '#F7FAF6',
    sectionBg: '#EDF2EA',
    cardBg: '#FFFFFF',
    text: '#3D4A38',
    gray: '#7A8A74',
    divider: '#D4DDD0',
  },
  'luxury-navy': {
    primary: '#2C3E50',
    secondary: '#ECF0F1',
    accent: '#34495E',
    background: '#F8FAFB',
    sectionBg: '#ECF0F1',
    cardBg: '#FFFFFF',
    text: '#2C3E50',
    gray: '#7F8C8D',
    divider: '#BDC3C7',
  },
  'sunset-coral': {
    primary: '#E07A5F',
    secondary: '#F4E9E4',
    accent: '#F2CC8F',
    background: '#FDF8F5',
    sectionBg: '#F9F0EB',
    cardBg: '#FFFFFF',
    text: '#5C4033',
    gray: '#A08070',
    divider: '#E8D5C8',
  },
}

// 폰트 스타일 정의
const fontStyles: Record<string, {
  body: string
  displayKr: string
  displayEn: string
}> = {
  classic: {
    body: '"Noto Serif KR", serif',
    displayKr: '"Nanum Myeongjo", serif',
    displayEn: '"Cormorant Garamond", serif',
  },
  modern: {
    body: '"Pretendard", sans-serif',
    displayKr: '"Pretendard", sans-serif',
    displayEn: '"Montserrat", sans-serif',
  },
  romantic: {
    body: '"Nanum Myeongjo", serif',
    displayKr: '"Nanum Myeongjo", serif',
    displayEn: '"Playfair Display", serif',
  },
  contemporary: {
    body: '"Pretendard", sans-serif',
    displayKr: '"Pretendard", sans-serif',
    displayEn: '"Inter", sans-serif',
  },
  luxury: {
    body: '"Noto Serif KR", serif',
    displayKr: '"Noto Serif KR", serif',
    displayEn: '"Cinzel", serif',
  },
}

// 날짜 포맷 함수
function formatDateDisplay(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = dayNames[date.getDay()]
  return `${year}년 ${month}월 ${day}일 ${dayOfWeek}요일`
}

interface InvitationViewProps {
  invitation: Invitation
  content: InvitationContent | null
  isPaid: boolean
}

export default function InvitationView({ invitation, content, isPaid }: InvitationViewProps) {
  const [openModalType, setOpenModalType] = useState<'none' | 'rsvp'>('none')
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // content가 있으면 content 사용, 없으면 invitation 기본 필드 사용
  const displayData = content || {
    groom: { name: invitation.groom_name || '', phone: '', father: { name: '', phone: '' }, mother: { name: '', phone: '' }, bank: { bank: '', account: '', holder: '', enabled: false } },
    bride: { name: invitation.bride_name || '', phone: '', father: { name: '', phone: '' }, mother: { name: '', phone: '' }, bank: { bank: '', account: '', holder: '', enabled: false } },
    wedding: {
      date: invitation.wedding_date || '',
      time: invitation.wedding_time || '',
      timeDisplay: invitation.wedding_time || '',
      venue: {
        name: invitation.venue_name || '',
        address: invitation.venue_address || '',
        hall: invitation.venue_detail || '',
      },
      directions: { car: { desc: '', route: '' }, subway: [], bus: { main: [], branch: [] }, parking: { location: '', fee: '' } },
    },
    content: {
      greeting: invitation.greeting_message || '',
      quote: { text: '', author: '' },
    },
    media: { coverImage: invitation.main_image || '', bgm: '' },
    colorTheme: 'classic-rose' as const,
    fontStyle: 'classic' as const,
    rsvpEnabled: true,
    rsvpAllowGuestCount: true,
  }

  const themeColors = colorThemes[displayData.colorTheme] || colorThemes['classic-rose']
  const fonts = fontStyles[displayData.fontStyle] || fontStyles['classic']

  const toggleMusic = () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error)
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

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
    displayData.groom?.bank && { name: displayData.groom.name, bank: displayData.groom.bank, role: '신랑', side: 'groom' as const },
    displayData.bride?.bank && { name: displayData.bride.name, bank: displayData.bride.bank, role: '신부', side: 'bride' as const },
  ].filter(Boolean) as { name: string; bank: { bank: string; account: string; holder: string; enabled: boolean }; role: string; side: 'groom' | 'bride' }[]

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: themeColors.background,
        fontFamily: fonts.body,
        color: themeColors.text,
        paddingTop: isPaid ? 0 : '40px', // 워터마크 배너 높이만큼
      }}
    >
      {/* 커버 섹션 */}
      <section
        className="relative h-screen flex flex-col items-center justify-center text-center"
        style={{
          backgroundImage: displayData.media?.coverImage ? `url(${displayData.media.coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {displayData.media?.coverImage && (
          <div className="absolute inset-0 bg-black/30" />
        )}
        <div className="relative z-10 text-white">
          <p className="text-sm tracking-[0.3em] mb-4" style={{ fontFamily: fonts.displayEn }}>
            WEDDING INVITATION
          </p>
          <h1 className="text-3xl mb-6" style={{ fontFamily: fonts.displayKr }}>
            {displayData.groom?.name || '신랑'} & {displayData.bride?.name || '신부'}
          </h1>
          <p className="text-sm opacity-80">
            {formatDateDisplay(displayData.wedding?.date || '')}
          </p>
          <p className="text-sm opacity-80 mt-1">
            {displayData.wedding?.venue?.name}
          </p>
        </div>
        {/* 스크롤 안내 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs tracking-widest">SCROLL</span>
            <div className="w-px h-8 bg-white/50 animate-pulse" />
          </div>
        </div>
      </section>

      {/* 인사말 섹션 */}
      <section className="px-6 py-16 text-center" style={{ backgroundColor: themeColors.cardBg }}>
        <p className="text-xs tracking-[0.3em] mb-8" style={{ color: themeColors.gray, fontFamily: fonts.displayEn }}>
          INVITATION
        </p>
        {displayData.content?.quote?.text && (
          <div className="mb-8">
            <p className="text-sm leading-relaxed italic" style={{ color: themeColors.primary, fontFamily: fonts.displayKr }}>
              {displayData.content.quote.text}
            </p>
            {displayData.content.quote.author && (
              <p className="text-xs mt-2" style={{ color: themeColors.gray }}>
                - {displayData.content.quote.author}
              </p>
            )}
          </div>
        )}
        <div className="max-w-sm mx-auto">
          <p className="text-sm leading-[2] whitespace-pre-line" style={{ fontFamily: fonts.displayKr }}>
            {displayData.content?.greeting || '소중한 분들을 초대합니다.'}
          </p>
        </div>
      </section>

      {/* 예식 정보 섹션 */}
      <section className="px-6 py-16 text-center" style={{ backgroundColor: themeColors.background }}>
        <p className="text-xs tracking-[0.3em] mb-8" style={{ color: themeColors.gray, fontFamily: fonts.displayEn }}>
          WEDDING DAY
        </p>
        <h3 className="text-lg mb-4" style={{ fontFamily: fonts.displayKr }}>
          {formatDateDisplay(displayData.wedding?.date || '')}
        </h3>
        <p className="text-sm mb-6" style={{ color: themeColors.gray }}>
          {displayData.wedding?.timeDisplay}
        </p>
        <div className="border-t border-b py-6 mx-auto max-w-xs" style={{ borderColor: themeColors.divider }}>
          <p className="font-medium mb-2">{displayData.wedding?.venue?.name}</p>
          <p className="text-sm" style={{ color: themeColors.gray }}>{displayData.wedding?.venue?.hall}</p>
          <p className="text-sm mt-2" style={{ color: themeColors.gray }}>{displayData.wedding?.venue?.address}</p>
        </div>
      </section>

      {/* RSVP 섹션 */}
      {displayData.rsvpEnabled && (
        <section className="px-6 py-16 text-center" style={{ backgroundColor: themeColors.cardBg }}>
          <p className="text-xs tracking-[0.3em] mb-8" style={{ color: themeColors.gray, fontFamily: fonts.displayEn }}>
            RSVP
          </p>
          <p className="text-sm mb-6" style={{ color: themeColors.text }}>
            참석 여부를 알려주세요
          </p>
          <button
            onClick={() => setOpenModalType('rsvp')}
            className="px-8 py-3 rounded-full text-sm text-white"
            style={{ backgroundColor: themeColors.primary }}
          >
            참석 여부 전달하기
          </button>
        </section>
      )}

      {/* 푸터 */}
      <footer className="px-6 py-10 text-center" style={{ backgroundColor: themeColors.background }}>
        <p className="text-xs" style={{ color: themeColors.gray }}>
          Thank you for celebrating with us
        </p>
        <p className="text-xs mt-2" style={{ color: themeColors.divider }}>
          Made with dear drawer
        </p>
      </footer>

      {/* 플로팅 버튼 */}
      <GuestFloatingButton
        themeColors={themeColors}
        fonts={fonts}
        openModal={openModalType}
        onModalClose={() => setOpenModalType('none')}
        invitation={{
          venue_name: displayData.wedding?.venue?.name || '',
          venue_address: displayData.wedding?.venue?.address || '',
          contacts,
          accounts,
          directions: displayData.wedding?.directions,
          rsvpEnabled: displayData.rsvpEnabled,
          rsvpAllowGuestCount: displayData.rsvpAllowGuestCount,
          invitationId: invitation.id,
        }}
      />

      {/* 음악 토글 버튼 */}
      {displayData.media?.bgm && (
        <>
          <button
            onClick={toggleMusic}
            className="fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-50"
            style={{
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              top: isPaid ? '16px' : '56px', // 워터마크 배너 아래
            }}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            )}
          </button>
          <audio ref={audioRef} loop preload="auto">
            <source src={displayData.media.bgm} type="audio/mpeg" />
          </audio>
        </>
      )}
    </div>
  )
}
