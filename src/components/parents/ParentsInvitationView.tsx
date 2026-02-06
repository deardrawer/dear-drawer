'use client'

import { useState, useRef, useEffect } from 'react'
import { SectionHighlightProvider } from './SectionHighlightContext'
import EnvelopeScreen from './EnvelopeScreen'
import SectionDivider from './SectionDivider'
import GreetingSection from './GreetingSection'
import TimelineSection from './TimelineSection'
import MainPhotoSection from './MainPhotoSection'
import DateSection from './DateSection'
import VenueSection from './VenueSection'
import WeddingInfoSection from './WeddingInfoSection'
import AccountSection from './AccountSection'
import ShareSection from './ShareSection'
import RsvpModal from './RsvpModal'
import { COLOR_THEMES, FONT_STYLES, type ParentsInvitationContent, type GuestInfo } from './types'
import { ThemeProvider } from './ThemeContext'

// 글자 크기 타입
type FontSizeLevel = 'normal' | 'large' | 'xlarge'

// 글자 크기 설정 (zoom 사용)
const FONT_SIZE_CONFIG: Record<FontSizeLevel, { label: string; zoom: number; icon: string }> = {
  normal: { label: '보통', zoom: 1, icon: '가' },
  large: { label: '크게', zoom: 1.12, icon: '가+' },
  xlarge: { label: '아주 크게', zoom: 1.24, icon: '가++' },
}

const FONT_SIZE_ORDER: FontSizeLevel[] = ['normal', 'large', 'xlarge']

interface ParentsInvitationViewProps {
  data: ParentsInvitationContent
  guestInfo?: GuestInfo | null
  isPreview?: boolean
  isPaid?: boolean
  hideInternalFrame?: boolean  // 외부에서 프레임을 제공할 때 내부 프레임 숨김
  invitationId?: string  // RSVP 저장을 위한 청첩장 ID
}

export default function ParentsInvitationView({
  data,
  guestInfo,
  isPreview = false,
  isPaid = true,
  hideInternalFrame = false,
  invitationId,
}: ParentsInvitationViewProps) {
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(isPreview)
  const [isPlaying, setIsPlaying] = useState(false)
  const [fontSize, setFontSize] = useState<FontSizeLevel>('normal')
  const [showFontSizeToast, setShowFontSizeToast] = useState(false)
  const [fontSizeToastMessage, setFontSizeToastMessage] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)

  // localStorage에서 글자 크기 설정 불러오기 + 첫 방문 안내
  useEffect(() => {
    if (typeof window !== 'undefined' && !isPreview) {
      const saved = localStorage.getItem('parents-invitation-font-size')
      const hasSeenGuide = localStorage.getItem('parents-font-size-guide-seen')

      if (saved && FONT_SIZE_ORDER.includes(saved as FontSizeLevel)) {
        setFontSize(saved as FontSizeLevel)
      }

      // 첫 방문자에게 안내 (봉투 열린 후 2초 뒤)
      if (!hasSeenGuide) {
        const timer = setTimeout(() => {
          setFontSizeToastMessage('좌측 상단 버튼으로 글자 크기를 조절할 수 있어요')
          setShowFontSizeToast(true)
          localStorage.setItem('parents-font-size-guide-seen', 'true')
          setTimeout(() => setShowFontSizeToast(false), 4000)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [isPreview, isEnvelopeOpen])

  // 글자 크기 변경
  const cycleFontSize = () => {
    const currentIndex = FONT_SIZE_ORDER.indexOf(fontSize)
    const nextIndex = (currentIndex + 1) % FONT_SIZE_ORDER.length
    const nextSize = FONT_SIZE_ORDER[nextIndex]
    setFontSize(nextSize)

    if (typeof window !== 'undefined') {
      localStorage.setItem('parents-invitation-font-size', nextSize)
    }

    // 변경 알림 토스트
    setFontSizeToastMessage(`글자 크기: ${FONT_SIZE_CONFIG[nextSize].label}`)
    setShowFontSizeToast(true)
    setTimeout(() => setShowFontSizeToast(false), 1500)
  }

  // 컬러 테마
  const theme = COLOR_THEMES[data.colorTheme || 'burgundy']

  // 폰트 스타일
  const fontStyle = FONT_STYLES[data.fontStyle || 'elegant']

  // 게스트 정보 처리
  const recipientName = guestInfo?.name || data.envelope.defaultGreeting?.replace(/님께$|께$|님$|에게$/, '') || '소중한 분'
  const recipientTitle = guestInfo?.honorific || data.envelope.defaultGreeting?.match(/님께$|께$|님$|에게$/)?.[0] || '께'

  // 부모님 서명 생성
  const senderSignature = data.sender.signature ||
    `아버지 ${data.sender.fatherName || '○○○'} · 어머니 ${data.sender.motherName || '○○○'} 드림`

  // 자녀 이름 (sender side에 따라) - 인사말에는 이름만, 다른 곳에는 풀네임
  const childFirstName = data.sender.side === 'groom' ? data.groom.firstName : data.bride.firstName
  const groomFullName = `${data.groom.lastName || ''}${data.groom.firstName || ''}`
  const brideFullName = `${data.bride.lastName || ''}${data.bride.firstName || ''}`

  // 갤러리 사진 (크롭 데이터 포함)
  const photos = data.gallery.images.length > 0
    ? data.gallery.images
        .filter(img => typeof img === 'string' ? img : img.url) // URL이 있는 것만
        .map((img, i) => ({
          id: i + 1,
          url: typeof img === 'string' ? img : img.url,
          cropX: typeof img === 'string' ? 0 : img.cropX,
          cropY: typeof img === 'string' ? 0 : img.cropY,
          cropWidth: typeof img === 'string' ? 1 : img.cropWidth,
          cropHeight: typeof img === 'string' ? 1 : img.cropHeight,
        }))
    : [
        { id: 1, url: '/samples/parents/1.png' },
        { id: 2, url: '/samples/parents/2.png' },
        { id: 3, url: '/samples/parents/3.png' },
        { id: 4, url: '/samples/parents/4.png' },
        { id: 5, url: '/samples/parents/5.png' },
      ]

  // 계좌 정보
  const accounts = data.accounts?.list?.filter(acc => acc.name || acc.bank || acc.accountNumber).map(acc => ({
    name: acc.name || '예금주',
    bank: acc.bank || '은행',
    account: acc.accountNumber || '계좌번호',
  })) || [
    { name: `아버지 ${data.sender.fatherName || '○○○'}`, bank: '국민은행', account: '123-45-6789012' },
    { name: `어머니 ${data.sender.motherName || '○○○'}`, bank: '신한은행', account: '110-456-789012' },
  ]

  // 음악 재생/일시정지
  const toggleMusic = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        try {
          await audioRef.current.play()
          setIsPlaying(true)
        } catch (error) {
          console.error('Audio play failed:', error)
        }
      }
    }
  }

  // 현재 글자 크기 설정
  const currentFontConfig = FONT_SIZE_CONFIG[fontSize]

  return (
    <ThemeProvider themeId={data.colorTheme || 'burgundy'}>
      <div
        className={`relative max-w-[390px] mx-auto min-h-screen ${fontStyle.className}`}
        style={{
          backgroundColor: theme.background,
          zoom: currentFontConfig.zoom,
          // Firefox 대응 (zoom 미지원)
          MozTransform: currentFontConfig.zoom !== 1 ? `scale(${currentFontConfig.zoom})` : undefined,
          MozTransformOrigin: currentFontConfig.zoom !== 1 ? 'top center' : undefined,
        }}
      >
        {/* 봉투 화면 */}
        {!isEnvelopeOpen && (
          <EnvelopeScreen
          recipientName={recipientName}
          recipientTitle={recipientTitle}
          message={data.envelope.message}
          signature={senderSignature}
          onOpen={() => setIsEnvelopeOpen(true)}
          isPreview={isPreview}
          themeColor={theme.primary}
          accentColor={theme.accent}
          fontClassName={fontStyle.className}
          fontFamily={fontStyle.cssVariable}
        />
      )}

      {/* 본문 */}
      {isEnvelopeOpen && (
        <SectionHighlightProvider>
          {/* 라운드 테두리 프레임 - 실제 청첩장에서만 표시 (외부 프레임이 있으면 숨김) */}
          {!isPreview && !hideInternalFrame && (
            <div
              style={{
                position: 'fixed',
                inset: '8px',
                border: `2px solid ${theme.primary}`,
                borderRadius: '32px',
                pointerEvents: 'none',
                zIndex: 9999,
                boxShadow: `0 0 0 100px ${theme.primary}`,
              }}
            />
          )}
          <main className="animate-fade-in relative">
            {/* 상단 컨트롤 버튼들 */}
            {!isPreview && (
              <>
                {/* 글자 크기 조절 버튼 - 좌측 상단 */}
                <button
                  onClick={cycleFontSize}
                  className="flex items-center gap-1.5 transition-all active:scale-95"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 100,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    borderRadius: '20px',
                    padding: '8px 14px',
                    height: '40px',
                  }}
                  title={`글자 크기: ${currentFontConfig.label}`}
                >
                  <span style={{ color: theme.primary, fontSize: '16px', fontWeight: 600 }}>
                    가
                  </span>
                  <span style={{ color: '#666', fontSize: '11px', fontWeight: 500 }}>
                    {currentFontConfig.label}
                  </span>
                </button>

                {/* 글자 크기 안내 토스트 */}
                {showFontSizeToast && (
                  <div
                    className="animate-fade-in"
                    style={{
                      position: 'absolute',
                      top: '70px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 100,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      color: '#fff',
                      padding: '10px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {fontSizeToastMessage}
                  </div>
                )}

                {/* 음악 재생 버튼 - 우측 상단 */}
                <audio ref={audioRef} loop preload="auto">
                  <source src="/samples/parents/wedding-bgm.mp3" type="audio/mpeg" />
                </audio>
                <button
                  onClick={toggleMusic}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 100,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill={theme.primary} viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill={theme.primary} viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </>
            )}
            <div id="preview-greeting">
              <GreetingSection
                childName={childFirstName || '○○'}
                greeting={guestInfo?.custom_message || data.greeting}
                parentSignature={`아버지 ${data.sender.fatherName || '○○○'} · 어머니 ${data.sender.motherName || '○○○'}`}
                senderSide={data.sender.side}
              />
            </div>
            {data.timelineEnabled !== false && (
              <div id="preview-timeline">
                <SectionDivider />
                <TimelineSection items={data.timeline} />
              </div>
            )}
            <div id="preview-couple">
              <SectionDivider />
              <MainPhotoSection
                photos={photos}
                mainImage={data.mainImage}
                groomName={groomFullName || '신랑'}
                brideName={brideFullName || '신부'}
                groomParents={`${data.groom.fatherName || '○○○'} · ${data.groom.motherName || '○○○'}의 아들`}
                brideParents={`${data.bride.fatherName || '○○○'} · ${data.bride.motherName || '○○○'}의 딸`}
              />
            </div>
            <div id="preview-wedding">
              <SectionDivider />
              <DateSection
                weddingDate={data.wedding.date || '2027-01-09'}
                weddingTimeDisplay={data.wedding.timeDisplay || 'Saturday, 4pm'}
              />
              <SectionDivider />
              <div id="preview-venue">
              <VenueSection
                venue={{
                  name: data.wedding.venue.name || '예식장',
                  hall: data.wedding.venue.hall || '',
                  address: data.wedding.venue.address || '주소를 입력해주세요',
                }}
                directions={{
                  bus: data.wedding.directions?.bus?.enabled ? {
                    lines: data.wedding.directions.bus.lines || '',
                    stop: data.wedding.directions.bus.stop || '',
                  } : undefined,
                  subway: data.wedding.directions?.subway?.enabled ? {
                    line: data.wedding.directions.subway.line || '',
                    station: data.wedding.directions.subway.station || '',
                    exit: data.wedding.directions.subway.exit || '',
                    walk: data.wedding.directions.subway.walk || '',
                    lines: data.wedding.directions.subway.lines,
                  } : undefined,
                  parking: data.wedding.directions?.parking?.enabled ? {
                    capacity: data.wedding.directions.parking.capacity || '',
                    free: data.wedding.directions.parking.free || '',
                    note: data.wedding.directions.parking.note || '',
                  } : undefined,
                  extraInfoEnabled: data.wedding.directions?.extraInfoEnabled,
                  extraInfoText: data.wedding.directions?.extraInfoText,
                }}
              />
              </div>
            </div>
            {/* 결혼식 안내 - 활성화된 항목이 있을 때만 표시 */}
            {data.weddingInfo?.enabled && (
              data.weddingInfo?.flowerGift?.enabled ||
              data.weddingInfo?.wreath?.enabled ||
              data.weddingInfo?.flowerChild?.enabled ||
              data.weddingInfo?.reception?.enabled ||
              data.weddingInfo?.photoBooth?.enabled ||
              data.weddingInfo?.shuttle?.enabled
            ) && (
              <div id="preview-weddingInfo">
                <SectionDivider />
                <WeddingInfoSection
                  enabled={data.weddingInfo?.enabled}
                  flowerGift={data.weddingInfo?.flowerGift}
                  wreath={data.weddingInfo?.wreath}
                  flowerChild={data.weddingInfo?.flowerChild}
                  reception={data.weddingInfo?.reception}
                  photoBooth={data.weddingInfo?.photoBooth}
                  shuttle={data.weddingInfo?.shuttle}
                />
              </div>
            )}
            {/* 계좌 안내 - 활성화되고 계좌가 있을 때만 표시 */}
            {data.accounts?.enabled !== false && accounts.length > 0 && (
              <div id="preview-accounts">
                <SectionDivider />
                <AccountSection accounts={accounts} />
              </div>
            )}
            <SectionDivider />
            <ShareSection />
            <RsvpModal isPreview={isPreview} invitationId={invitationId} />
          </main>
        </SectionHighlightProvider>
      )}

      </div>
    </ThemeProvider>
  )
}
