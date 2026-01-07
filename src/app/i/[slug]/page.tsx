export const runtime = 'edge'

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ImageGallery from '@/components/invitation/ImageGallery'
import RsvpForm from '@/components/invitation/RsvpForm'

// Mock invitation data - in production, this would come from Supabase
const mockInvitation = {
  id: 'demo-invitation-id',
  groomName: '김민수',
  brideName: '이지영',
  weddingDate: '2024-12-25',
  weddingTime: '14:00',
  venueName: '그랜드 웨딩홀',
  venueAddress: '서울특별시 강남구 테헤란로 123',
  venueMapUrl: 'https://map.kakao.com/...',
  greeting: `저희 두 사람이 사랑과 믿음으로 한 가정을 이루게 되었습니다.

대학교 동아리에서 처음 만나 서로의 꿈을 응원하며 함께 성장해 왔습니다. 밤새 이야기를 나누던 그 시간들이 모여 오늘 이 자리에 서게 되었습니다.

평생을 함께할 동반자를 만났다는 확신이 들었을 때, 우리는 결혼을 결심했습니다. 서로의 부족함을 채워주고, 함께 웃고 울 수 있는 사람이라는 것을 알았기 때문입니다.

바쁘신 와중에도 저희의 새 출발을 축하해 주시면 감사하겠습니다. 귀한 걸음으로 자리를 빛내 주세요.`,
  mainImage: '/demo/main.jpg',
  galleryImages: [
    '/demo/gallery1.jpg',
    '/demo/gallery2.jpg',
    '/demo/gallery3.jpg',
    '/demo/gallery4.jpg',
  ],
  primaryColor: '#D4A5A5',
  secondaryColor: '#F5E6E0',
  accentColor: '#7D8471',
  backgroundColor: '#FDF9F7',
  textColor: '#4A4A4A',
  rsvpEnabled: true,
  rsvpDeadline: '2024-12-20',
  groomBank: '신한은행',
  groomAccount: '110-123-456789',
  groomAccountHolder: '김민수',
  brideBank: '국민은행',
  brideAccount: '123-45-678901',
  brideAccountHolder: '이지영',
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[date.getDay()]
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`
}

function formatTime(timeString: string): string {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':').map(Number)
  const period = hours >= 12 ? '오후' : '오전'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return minutes > 0 ? `${period} ${displayHours}시 ${minutes}분` : `${period} ${displayHours}시`
}

function getDday(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weddingDate = new Date(dateString)
  weddingDate.setHours(0, 0, 0, 0)
  const diff = weddingDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function InvitationPage() {
  const params = useParams()
  const slug = params.slug as string
  const [invitation, setInvitation] = useState(mockInvitation)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)

  // In production, fetch invitation data from Supabase
  useEffect(() => {
    // TODO: Fetch invitation by slug from Supabase
    console.log('Loading invitation for slug:', slug)
  }, [slug])

  const dday = getDday(invitation.weddingDate)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAccount(type)
    setTimeout(() => setCopiedAccount(null), 2000)
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: invitation.backgroundColor }}
    >
      {/* Hero Section */}
      <section className="px-6 py-16 text-center">
        <p
          className="text-xs tracking-[0.3em] mb-6"
          style={{ color: invitation.accentColor }}
        >
          WEDDING INVITATION
        </p>

        {/* Main Image */}
        {invitation.mainImage && (
          <div className="mb-8 mx-auto max-w-sm">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg bg-gray-100">
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        <h1
          className="text-3xl font-medium mb-3"
          style={{ color: invitation.textColor }}
        >
          {invitation.groomName} & {invitation.brideName}
        </h1>

        <div
          className="w-12 h-px mx-auto my-6"
          style={{ backgroundColor: invitation.accentColor }}
        />

        <p className="text-base" style={{ color: invitation.textColor }}>
          {formatDate(invitation.weddingDate)}
        </p>
        <p className="text-base" style={{ color: invitation.textColor }}>
          {formatTime(invitation.weddingTime)}
        </p>
        <p className="text-base opacity-80" style={{ color: invitation.textColor }}>
          {invitation.venueName}
        </p>

        {/* D-Day */}
        {dday >= 0 && (
          <div
            className="mt-6 inline-block px-4 py-2 rounded-full text-sm"
            style={{ backgroundColor: `${invitation.primaryColor}20`, color: invitation.primaryColor }}
          >
            {dday === 0 ? 'D-Day' : `D-${dday}`}
          </div>
        )}
      </section>

      {/* Greeting Section */}
      <section
        className="px-6 py-12"
        style={{ backgroundColor: invitation.secondaryColor }}
      >
        <h2
          className="text-lg font-medium text-center mb-6"
          style={{ color: invitation.primaryColor }}
        >
          초대합니다
        </h2>
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap text-center max-w-sm mx-auto"
          style={{ color: invitation.textColor }}
        >
          {invitation.greeting}
        </p>
      </section>

      {/* Gallery Section */}
      <section className="px-6 py-12">
        <h2
          className="text-lg font-medium text-center mb-6"
          style={{ color: invitation.primaryColor }}
        >
          갤러리
        </h2>
        <div className="max-w-sm mx-auto">
          <ImageGallery
            images={invitation.galleryImages}
            primaryColor={invitation.primaryColor}
          />
        </div>
      </section>

      {/* Venue Section */}
      <section
        className="px-6 py-12"
        style={{ backgroundColor: invitation.secondaryColor }}
      >
        <h2
          className="text-lg font-medium text-center mb-6"
          style={{ color: invitation.primaryColor }}
        >
          오시는 길
        </h2>
        <div className="max-w-sm mx-auto text-center">
          <p className="font-medium mb-1" style={{ color: invitation.textColor }}>
            {invitation.venueName}
          </p>
          <p className="text-sm opacity-80 mb-4" style={{ color: invitation.textColor }}>
            {invitation.venueAddress}
          </p>

          {/* Map Placeholder */}
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-xs">지도</p>
            </div>
          </div>

          {/* Map Links */}
          <div className="flex gap-2 justify-center">
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(invitation.venueAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-medium"
            >
              카카오맵
            </a>
            <a
              href={`https://map.naver.com/v5/search/${encodeURIComponent(invitation.venueAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium"
            >
              네이버지도
            </a>
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="px-6 py-12">
        <h2
          className="text-lg font-medium text-center mb-6"
          style={{ color: invitation.primaryColor }}
        >
          마음 전하실 곳
        </h2>
        <div className="max-w-sm mx-auto space-y-3">
          {/* Groom Account */}
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: invitation.secondaryColor }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: invitation.textColor }}>
                신랑측
              </span>
              <button
                onClick={() => copyToClipboard(invitation.groomAccount, 'groom')}
                className="text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: `${invitation.primaryColor}20`, color: invitation.primaryColor }}
              >
                {copiedAccount === 'groom' ? '복사됨!' : '복사'}
              </button>
            </div>
            <p className="text-sm opacity-80" style={{ color: invitation.textColor }}>
              {invitation.groomBank} {invitation.groomAccount}
            </p>
            <p className="text-sm opacity-80" style={{ color: invitation.textColor }}>
              예금주: {invitation.groomAccountHolder}
            </p>
          </div>

          {/* Bride Account */}
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: invitation.secondaryColor }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: invitation.textColor }}>
                신부측
              </span>
              <button
                onClick={() => copyToClipboard(invitation.brideAccount, 'bride')}
                className="text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: `${invitation.primaryColor}20`, color: invitation.primaryColor }}
              >
                {copiedAccount === 'bride' ? '복사됨!' : '복사'}
              </button>
            </div>
            <p className="text-sm opacity-80" style={{ color: invitation.textColor }}>
              {invitation.brideBank} {invitation.brideAccount}
            </p>
            <p className="text-sm opacity-80" style={{ color: invitation.textColor }}>
              예금주: {invitation.brideAccountHolder}
            </p>
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      {invitation.rsvpEnabled && (
        <section
          className="px-6 py-12"
          style={{ backgroundColor: invitation.secondaryColor }}
        >
          <h2
            className="text-lg font-medium text-center mb-2"
            style={{ color: invitation.primaryColor }}
          >
            참석 여부
          </h2>
          <p className="text-sm text-center mb-6 opacity-70" style={{ color: invitation.textColor }}>
            {formatDate(invitation.rsvpDeadline)}까지 알려주세요
          </p>
          <div className="max-w-sm mx-auto bg-white rounded-2xl p-6 shadow-sm">
            <RsvpForm
              invitationId={invitation.id}
              primaryColor={invitation.primaryColor}
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-6 py-8 text-center">
        <p className="text-xs opacity-50" style={{ color: invitation.textColor }}>
          Thank you for celebrating with us
        </p>
        <p className="text-xs opacity-30 mt-2" style={{ color: invitation.textColor }}>
          Made with dear drawer
        </p>
      </footer>

      {/* Share Floating Button */}
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: `${invitation.groomName} & ${invitation.brideName} 결혼합니다`,
              url: window.location.href,
            })
          } else {
            navigator.clipboard.writeText(window.location.href)
            alert('링크가 복사되었습니다!')
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white z-50"
        style={{ backgroundColor: invitation.primaryColor }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>
    </div>
  )
}
