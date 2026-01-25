'use client'

import { useState, useEffect } from 'react'

type ModalType = 'none' | 'contact' | 'rsvp' | 'location' | 'account' | 'share'
type DirectionsTab = 'car' | 'publicTransport' | 'train' | 'expressBus'

interface BankAccount {
  bank: string
  account: string
  holder: string
  enabled: boolean
}

interface DirectionsInfo {
  car: string
  publicTransport: string
  train?: string
  expressBus?: string
}

interface ContactInfo {
  name: string
  phone: string
  role: string
  side: 'groom' | 'bride'
}

interface AccountInfo {
  name: string
  bank: BankAccount
  role: string
  side: 'groom' | 'bride'
}

interface GuestFloatingButtonProps {
  themeColors: {
    primary: string
    sectionBg: string
    cardBg: string
    text: string
    gray: string
    background: string
  }
  fonts: { displayKr: string }
  openModal?: ModalType
  onModalClose?: () => void
  showTooltip?: boolean
  invitation: {
    venue_name?: string
    venue_address?: string
    contacts: ContactInfo[]
    accounts: AccountInfo[]
    directions?: DirectionsInfo
    rsvpEnabled?: boolean
    rsvpAllowGuestCount?: boolean
    invitationId?: string
    groomName?: string
    brideName?: string
    weddingDate?: string
    weddingTime?: string
    thumbnailUrl?: string
    shareTitle?: string
    shareDescription?: string
  }
}

export default function GuestFloatingButton({ themeColors, fonts, invitation, openModal: externalOpenModal, onModalClose, showTooltip = false }: GuestFloatingButtonProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>('none')
  const [directionsTab, setDirectionsTab] = useState<DirectionsTab>('car')
  const [rsvpForm, setRsvpForm] = useState({ name: '', attendance: '', guestCount: 1, message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 외부에서 모달 열기
  useEffect(() => {
    if (externalOpenModal && externalOpenModal !== 'none') {
      setActiveModal(externalOpenModal)
    }
  }, [externalOpenModal])

  const openModal = (modal: ModalType) => {
    setIsBottomSheetOpen(false)
    setTimeout(() => setActiveModal(modal), 200)
  }

  const closeModal = () => {
    setActiveModal('none')
    onModalClose?.()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('복사되었습니다')
  }

  const handleRsvpSubmit = async () => {
    if (!rsvpForm.name || !rsvpForm.attendance) {
      alert('이름과 참석 여부를 입력해주세요.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: invitation.invitationId,
          guest_name: rsvpForm.name,
          attendance: rsvpForm.attendance,
          guest_count: rsvpForm.attendance === 'yes' ? rsvpForm.guestCount : 0,
          message: rsvpForm.message,
        }),
      })
      if (res.ok) {
        alert('참석 여부가 전달되었습니다. 감사합니다!')
        closeModal()
        setRsvpForm({ name: '', attendance: '', guestCount: 1, message: '' })
      } else {
        alert('전송에 실패했습니다. 다시 시도해주세요.')
      }
    } catch {
      alert('전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasContacts = invitation.contacts.length > 0
  const hasRsvp = !!invitation.rsvpEnabled
  const hasAccounts = invitation.accounts.some(a => a.bank.enabled)

  const handleKakaoShare = () => {
    const kakaoWindow = window as typeof window & {
      Kakao?: {
        isInitialized?: () => boolean
        Share?: { sendDefault: (config: object) => void }
      }
    }

    const invitationUrl = typeof window !== 'undefined' ? window.location.href : ''
    const groomName = invitation.groomName || '신랑'
    const brideName = invitation.brideName || '신부'

    if (typeof window !== 'undefined' && kakaoWindow.Kakao?.Share && kakaoWindow.Kakao.isInitialized?.()) {
      console.log('Kakao Share 호출:', { invitationUrl, groomName, brideName, thumbnailUrl: invitation.thumbnailUrl })

      // 날짜 포맷팅
      const formattedDate = invitation.weddingDate
        ? new Date(invitation.weddingDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })
        : '날짜 미정'

      // 시간 포맷팅
      const formattedTime = invitation.weddingTime || '시간 미정'

      // 장소 포맷팅
      const venueDisplay = invitation.venue_name || '장소 미정'
      const venueDetail = invitation.venue_address ? `\n${invitation.venue_address}` : ''

      // 기본 이미지
      const defaultImage = 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png'
      // 카카오 공유에 사용할 이미지 URL 결정
      let imageUrl = defaultImage

      if (invitation.thumbnailUrl) {
        if (invitation.thumbnailUrl.startsWith('https://')) {
          // 이미 https URL인 경우 그대로 사용
          imageUrl = invitation.thumbnailUrl
        } else if (invitation.thumbnailUrl.startsWith('/uploads/') || invitation.thumbnailUrl.startsWith('/api/r2/')) {
          // 업로드된 이미지 (상대 경로)를 절대 URL로 변환
          // localhost에서는 외부 접근 불가하므로 production URL 사용
          const productionUrl = 'https://dear-drawer.pages.dev'
          imageUrl = `${productionUrl}${invitation.thumbnailUrl}`
        }
        // /demo/ 경로 이미지는 기본 이미지 사용 (외부 접근 불가)
      }

      // 공유 제목
      const displayTitle = invitation.shareTitle || `${groomName} ❤️ ${brideName}의 결혼식`

      // 공유 설명
      const displayDescription = invitation.shareDescription ||
        `${formattedDate} ${formattedTime}\n${venueDisplay}${venueDetail}`

      // 피드형 템플릿 (objectType: 'feed')
      kakaoWindow.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: displayTitle,
          description: displayDescription,
          imageUrl,
          link: {
            mobileWebUrl: invitationUrl,
            webUrl: invitationUrl,
          },
        },
        buttons: [
          {
            title: '모바일 청첩장 보기',
            link: {
              mobileWebUrl: invitationUrl,
              webUrl: invitationUrl,
            },
          },
        ],
      })
      closeModal()
    } else {
      // 카카오 SDK 미초기화 시 링크 복사로 대체
      navigator.clipboard.writeText(invitationUrl)
      alert('카카오톡 공유를 사용할 수 없어 링크가 복사되었습니다.\n카카오톡에서 직접 붙여넣기 해주세요.')
    }
  }

  const handleCopyLink = () => {
    const invitationUrl = typeof window !== 'undefined' ? window.location.href : ''
    navigator.clipboard.writeText(invitationUrl)
    alert('링크가 복사되었습니다!')
  }

  const menuItems = [
    hasContacts && { key: 'contact', label: '축하 전하기', icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> },
    hasRsvp && { key: 'rsvp', label: '참석 여부', icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'location', label: '오시는 길', icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
    hasAccounts && { key: 'account', label: '마음 전하기', icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg> },
    { key: 'share', label: '공유하기', icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg> },
  ].filter(Boolean) as { key: string; label: string; icon: React.ReactElement }[]

  const groomContacts = invitation.contacts.filter(c => c.side === 'groom')
  const brideContacts = invitation.contacts.filter(c => c.side === 'bride')
  const groomAccounts = invitation.accounts.filter(a => a.side === 'groom' && a.bank.enabled)
  const brideAccounts = invitation.accounts.filter(a => a.side === 'bride' && a.bank.enabled)

  return (
    <>
      {/* Floating Button - 햄버거 메뉴 */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {/* Speech Bubble Tooltip */}
        <div
          className="transition-all duration-300"
          style={{
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
                right: '16px',
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

        {/* 햄버거 메뉴 버튼 */}
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: themeColors.cardBg, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={themeColors.text} strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
            <line x1="4" y1="18" x2="14" y2="18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Bottom Sheet */}
      {isBottomSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsBottomSheetOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-8" style={{ maxHeight: '70%' }}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <h3 className="text-center text-sm mb-6" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>결혼식 정보</h3>
            <div className={`grid gap-3 ${menuItems.length <= 2 ? 'grid-cols-' + menuItems.length : 'grid-cols-2'}`}>
              {menuItems.map((item) => (
                <button key={item.key} className="flex flex-col items-center justify-center p-5 rounded-2xl" style={{ background: themeColors.sectionBg }} onClick={() => openModal(item.key as ModalType)}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: themeColors.cardBg }}>{item.icon}</div>
                  <span className="text-[11px]" style={{ color: themeColors.text }}>{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setIsBottomSheetOpen(false)} className="w-full mt-6 py-3 rounded-xl text-xs" style={{ background: themeColors.background, color: themeColors.gray }}>닫기</button>
          </div>
        </>
      )}

      {/* Unified Modal with Tab Navigation */}
      {activeModal !== 'none' && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 max-h-[80%] overflow-hidden flex flex-col">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveModal(item.key as ModalType)}
                  className="flex-1 py-3 text-[11px] font-medium transition-all relative"
                  style={{
                    color: activeModal === item.key ? themeColors.primary : themeColors.gray,
                  }}
                >
                  {item.label}
                  {activeModal === item.key && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ background: themeColors.primary }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Contact Content */}
              {activeModal === 'contact' && (
                <>
            {groomContacts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><p className="text-xs font-medium text-blue-700">신랑측</p></div>
                <div className="space-y-2">
                  {groomContacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div><span className="text-xs font-medium text-blue-900">{c.role}</span><p className="text-[11px] text-blue-700">{c.name}</p></div>
                      <div className="flex gap-1.5">
                        <a href={`sms:${c.phone}`} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></a>
                        <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {brideContacts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /><p className="text-xs font-medium text-pink-700">신부측</p></div>
                <div className="space-y-2">
                  {brideContacts.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-pink-50 border border-pink-100">
                      <div><span className="text-xs font-medium text-pink-900">{c.role}</span><p className="text-[11px] text-pink-700">{c.name}</p></div>
                      <div className="flex gap-1.5">
                        <a href={`sms:${c.phone}`} className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center"><svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></a>
                        <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center"><svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                </>
              )}

              {/* RSVP Content */}
              {activeModal === 'rsvp' && (
                <>
                  <input type="text" placeholder="이름" value={rsvpForm.name} onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })} className="w-full p-3 rounded-xl mb-3 text-sm outline-none" style={{ background: themeColors.sectionBg, color: themeColors.text }} />
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setRsvpForm({ ...rsvpForm, attendance: 'yes' })} className="flex-1 py-3 rounded-xl text-sm transition-all" style={{ background: rsvpForm.attendance === 'yes' ? themeColors.primary : themeColors.sectionBg, color: rsvpForm.attendance === 'yes' ? 'white' : themeColors.text }}>참석</button>
                    <button onClick={() => setRsvpForm({ ...rsvpForm, attendance: 'no' })} className="flex-1 py-3 rounded-xl text-sm transition-all" style={{ background: rsvpForm.attendance === 'no' ? themeColors.primary : themeColors.sectionBg, color: rsvpForm.attendance === 'no' ? 'white' : themeColors.text }}>불참</button>
                  </div>
                  {invitation.rsvpAllowGuestCount !== false && rsvpForm.attendance === 'yes' && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm" style={{ color: themeColors.text }}>참석 인원</span>
                      <div className="flex items-center gap-2 ml-auto">
                        <button onClick={() => setRsvpForm({ ...rsvpForm, guestCount: Math.max(1, rsvpForm.guestCount - 1) })} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: themeColors.sectionBg }}>-</button>
                        <span className="w-8 text-center text-sm" style={{ color: themeColors.text }}>{rsvpForm.guestCount}</span>
                        <button onClick={() => setRsvpForm({ ...rsvpForm, guestCount: rsvpForm.guestCount + 1 })} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: themeColors.sectionBg }}>+</button>
                      </div>
                    </div>
                  )}
                  <textarea placeholder="메시지 (선택)" value={rsvpForm.message} onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })} className="w-full p-3 rounded-xl mb-4 text-sm outline-none resize-none h-16" style={{ background: themeColors.sectionBg, color: themeColors.text }} />
                  <button onClick={handleRsvpSubmit} disabled={isSubmitting} className="w-full py-3 rounded-xl text-sm text-white" style={{ background: themeColors.primary }}>{isSubmitting ? '전송중...' : '제출하기'}</button>
                </>
              )}

              {/* Location Content */}
              {activeModal === 'location' && (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm font-medium mb-1" style={{ color: themeColors.text }}>{invitation.venue_name || '예식장'}</p>
                    <p className="text-xs" style={{ color: themeColors.gray }}>{invitation.venue_address || '주소를 입력해주세요'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <a href={`https://map.naver.com/v5/search/${encodeURIComponent(invitation.venue_address || '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#03C75A' }}><span className="text-white text-xs font-bold">N</span></div>
                      <span className="text-[10px]" style={{ color: themeColors.text }}>네이버지도</span>
                    </a>
                    <a href={`https://map.kakao.com/link/search/${encodeURIComponent(invitation.venue_address || '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#FEE500' }}><span className="text-black text-xs font-bold">K</span></div>
                      <span className="text-[10px]" style={{ color: themeColors.text }}>카카오맵</span>
                    </a>
                    <a href={`tmap://search?name=${encodeURIComponent(invitation.venue_name || '')}`} className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#4285F4' }}><span className="text-white text-xs font-bold">T</span></div>
                      <span className="text-[10px]" style={{ color: themeColors.text }}>티맵</span>
                    </a>
                  </div>

                  {/* Transportation Tabs */}
                  {(() => {
                    const tabs = [
                      { key: 'car' as DirectionsTab, label: '자가용', show: !!invitation.directions?.car },
                      { key: 'publicTransport' as DirectionsTab, label: '버스/지하철', show: !!invitation.directions?.publicTransport },
                      { key: 'train' as DirectionsTab, label: '기차역', show: !!invitation.directions?.train },
                      { key: 'expressBus' as DirectionsTab, label: '고속버스', show: !!invitation.directions?.expressBus },
                    ].filter(t => t.show)

                    return tabs.length > 1 ? (
                      <div className="flex rounded-xl overflow-hidden mb-3" style={{ background: themeColors.sectionBg }}>
                        {tabs.map(tab => (
                          <button key={tab.key} onClick={() => setDirectionsTab(tab.key)} className="flex-1 py-2.5 text-[10px] transition-all" style={{ background: directionsTab === tab.key ? themeColors.primary : 'transparent', color: directionsTab === tab.key ? 'white' : themeColors.gray }}>{tab.label}</button>
                        ))}
                      </div>
                    ) : null
                  })()}

                  <div className="rounded-xl p-4 mb-3" style={{ background: themeColors.sectionBg, minHeight: '80px' }}>
                    {directionsTab === 'car' && (
                      invitation.directions?.car ? (
                        <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>{invitation.directions.car}</p>
                      ) : <p className="text-xs text-center py-4" style={{ color: themeColors.gray }}>자가용 정보가 없습니다</p>
                    )}
                    {directionsTab === 'publicTransport' && invitation.directions?.publicTransport && (
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>{invitation.directions.publicTransport}</p>
                    )}
                    {directionsTab === 'train' && invitation.directions?.train && (
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>{invitation.directions.train}</p>
                    )}
                    {directionsTab === 'expressBus' && invitation.directions?.expressBus && (
                      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>{invitation.directions.expressBus}</p>
                    )}
                  </div>
                  <button onClick={() => copyToClipboard(invitation.venue_address || '')} className="w-full py-2 rounded-xl text-xs" style={{ background: themeColors.sectionBg, color: themeColors.text }}>주소 복사</button>
                </>
              )}

              {/* Account Content */}
              {activeModal === 'account' && (
                <>
                  {groomAccounts.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><p className="text-xs font-medium text-blue-700">신랑측</p></div>
                      <div className="space-y-2">
                        {groomAccounts.map((a, i) => (
                          <div key={i} className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-900">{a.role} {a.name}</span>
                              <button onClick={() => copyToClipboard(`${a.bank.bank} ${a.bank.account}`)} className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">복사</button>
                            </div>
                            <p className="text-[10px] text-blue-600">{a.bank.holder}</p>
                            <p className="text-xs text-blue-800">{a.bank.bank} {a.bank.account}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {brideAccounts.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /><p className="text-xs font-medium text-pink-700">신부측</p></div>
                      <div className="space-y-2">
                        {brideAccounts.map((a, i) => (
                          <div key={i} className="p-3 rounded-xl bg-pink-50 border border-pink-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-pink-900">{a.role} {a.name}</span>
                              <button onClick={() => copyToClipboard(`${a.bank.bank} ${a.bank.account}`)} className="text-[10px] px-2.5 py-1 rounded-full bg-pink-100 text-pink-700">복사</button>
                            </div>
                            <p className="text-[10px] text-pink-600">{a.bank.holder}</p>
                            <p className="text-xs text-pink-800">{a.bank.bank} {a.bank.account}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Share Content */}
              {activeModal === 'share' && (
                <>
                  <p className="text-center text-sm mb-4" style={{ color: themeColors.text }}>
                    청첩장을 공유해보세요
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleKakaoShare}
                      className="flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: '#FEE500' }}
                    >
                      <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="#3C1E1E">
                        <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: '#3C1E1E' }}>카카오톡 공유</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: themeColors.sectionBg }}
                    >
                      <svg className="w-8 h-8 mb-2" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: themeColors.text }}>링크 복사</span>
                    </button>
                  </div>

                  <div className="mt-4 p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                    <p className="text-[10px] text-center" style={{ color: themeColors.gray }}>
                      카카오톡으로 친구들에게 청첩장을 공유하거나<br />
                      링크를 복사하여 원하는 곳에 붙여넣기 하세요
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Close Button */}
            <div className="p-4 pt-0 flex-shrink-0">
              <button onClick={closeModal} className="w-full py-3 rounded-xl text-sm" style={{ background: themeColors.background, color: themeColors.gray }}>닫기</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
