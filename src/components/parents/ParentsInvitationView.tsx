'use client'

import { useState, useRef } from 'react'
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

interface ParentsInvitationViewProps {
  data: ParentsInvitationContent
  guestInfo?: GuestInfo | null
  isPreview?: boolean
  isPaid?: boolean
  hideInternalFrame?: boolean  // 외부에서 프레임을 제공할 때 내부 프레임 숨김
}

export default function ParentsInvitationView({
  data,
  guestInfo,
  isPreview = false,
  isPaid = true,
  hideInternalFrame = false,
}: ParentsInvitationViewProps) {
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(isPreview)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

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

  return (
    <ThemeProvider themeId={data.colorTheme || 'burgundy'}>
      <div className={`relative max-w-[390px] mx-auto min-h-screen ${fontStyle.className}`} style={{ backgroundColor: theme.background }}>
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
            {/* 음악 재생 버튼 - 첫 섹션 상단에 고정 */}
            {!isPreview && (
              <>
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
                greeting={data.greeting}
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
                  } : undefined,
                  parking: data.wedding.directions?.parking?.enabled ? {
                    capacity: data.wedding.directions.parking.capacity || '',
                    free: data.wedding.directions.parking.free || '',
                    note: data.wedding.directions.parking.note || '',
                  } : undefined,
                }}
              />
            </div>
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
            {data.accounts?.enabled !== false && accounts.length > 0 && (
              <div id="preview-accounts">
                <SectionDivider />
                <AccountSection accounts={accounts} />
              </div>
            )}
            <SectionDivider />
            <ShareSection />
            <RsvpModal isPreview={isPreview} />
          </main>
        </SectionHighlightProvider>
      )}

      </div>
    </ThemeProvider>
  )
}
