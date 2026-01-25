'use client'

import { useState } from 'react'

type ModalType = 'none' | 'guestbook' | 'rsvp' | 'location' | 'account'
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

interface FloatingButtonProps {
  themeColors: {
    primary: string
    sectionBg: string
    cardBg: string
    text: string
    gray: string
    background: string
  }
  fonts: {
    displayKr: string
  }
  showTooltip?: boolean
  invitation?: {
    venue_name?: string
    venue_address?: string
    groom_name?: string
    bride_name?: string
    groom_father_name?: string
    groom_mother_name?: string
    bride_father_name?: string
    bride_mother_name?: string
    // 연락처 (6개)
    groom_phone?: string
    bride_phone?: string
    groom_father_phone?: string
    groom_mother_phone?: string
    bride_father_phone?: string
    bride_mother_phone?: string
    // 계좌 정보 (6개)
    groom_bank_info?: BankAccount
    groom_father_bank_info?: BankAccount
    groom_mother_bank_info?: BankAccount
    bride_bank_info?: BankAccount
    bride_father_bank_info?: BankAccount
    bride_mother_bank_info?: BankAccount
    // 오시는 길 정보
    directions?: DirectionsInfo
    // RSVP 설정
    rsvpEnabled?: boolean
    rsvpAllowGuestCount?: boolean
  }
}

export default function FloatingButton({ themeColors, fonts, invitation, showTooltip = false }: FloatingButtonProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>('none')
  const [directionsTab, setDirectionsTab] = useState<DirectionsTab>('car')
  const [guestbookForm, setGuestbookForm] = useState({ name: '', message: '' })
  const [rsvpForm, setRsvpForm] = useState({ name: '', attendance: '', guestCount: 1, message: '' })

  const openModal = (modal: ModalType) => {
    setIsBottomSheetOpen(false)
    setTimeout(() => setActiveModal(modal), 200)
  }

  const closeModal = () => {
    setActiveModal('none')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('복사되었습니다')
  }

  return (
    <>
      {/* Floating Button with Tooltip */}
      <div className="absolute bottom-12 right-4 z-40 flex items-center gap-2">
        {/* 안내 툴팁 (말풍선) - 왼쪽 */}
        {showTooltip && !isBottomSheetOpen && activeModal === 'none' && (
          <div className="relative animate-fade-in">
            <div
              className="px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap shadow-lg"
              style={{
                background: '#333',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              결혼식 정보는 여기에서
            </div>
            {/* 말풍선 꼬리 (오른쪽) */}
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2"
              style={{
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: '8px solid #333'
              }}
            />
          </div>
        )}
        {/* 햄버거 메뉴 버튼 */}
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{
            background: themeColors.cardBg,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={themeColors.text} strokeWidth={2} strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="14" y2="18" />
          </svg>
        </button>
      </div>

      {/* Bottom Sheet */}
      {isBottomSheetOpen && (() => {
        // 연락처 유무 체크 (축하 전하기)
        const hasContacts = !!(
          invitation?.groom_phone ||
          invitation?.bride_phone ||
          invitation?.groom_father_phone ||
          invitation?.groom_mother_phone ||
          invitation?.bride_father_phone ||
          invitation?.bride_mother_phone
        )
        // RSVP 활성화 체크 (참석 여부)
        const hasRsvp = !!invitation?.rsvpEnabled
        // 계좌 정보 유무 체크 (마음 전하기)
        const hasAccounts = !!(
          invitation?.groom_bank_info?.enabled ||
          invitation?.groom_father_bank_info?.enabled ||
          invitation?.groom_mother_bank_info?.enabled ||
          invitation?.bride_bank_info?.enabled ||
          invitation?.bride_father_bank_info?.enabled ||
          invitation?.bride_mother_bank_info?.enabled
        )

        const menuItems = [
          hasContacts && {
            key: 'guestbook',
            label: '축하 전하기',
            icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          },
          hasRsvp && {
            key: 'rsvp',
            label: '참석 여부',
            icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          },
          {
            key: 'location',
            label: '오시는 길',
            icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          },
          hasAccounts && {
            key: 'account',
            label: '마음 전하기',
            icon: <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
          },
        ].filter(Boolean) as { key: string; label: string; icon: React.ReactElement }[]

        return (
          <>
            <div className="absolute inset-0 bg-black/50 z-50" onClick={() => setIsBottomSheetOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-8" style={{ maxHeight: '70%', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              <h3 className="text-center text-sm mb-6" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>결혼식 정보</h3>
              <div className={`grid gap-3 ${menuItems.length <= 2 ? 'grid-cols-' + menuItems.length : 'grid-cols-2'}`}>
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl"
                    style={{ background: themeColors.sectionBg }}
                    onClick={() => openModal(item.key as ModalType)}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: themeColors.cardBg }}>
                      {item.icon}
                    </div>
                    <span className="text-[11px]" style={{ color: themeColors.text }}>{item.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setIsBottomSheetOpen(false)} className="w-full mt-6 py-3 rounded-xl text-xs font-light" style={{ background: themeColors.background, color: themeColors.gray }}>닫기</button>
            </div>
          </>
        )
      })()}

      {/* Guestbook Modal - 축하 전하기 */}
      {activeModal === 'guestbook' && (
        <>
          <div className="absolute inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 p-6 max-h-[70%] overflow-y-auto" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 className="text-center text-base mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>축하 전하기</h3>

            {/* 신랑측 */}
            {(invitation?.groom_name || invitation?.groom_father_name || invitation?.groom_mother_name) && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <p className="text-xs font-medium text-blue-700">신랑측</p>
                </div>
                <div className="space-y-2">
                  {invitation?.groom_name && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div>
                        <span className="text-xs font-medium text-blue-900">신랑</span>
                        <p className="text-[11px] text-blue-700">{invitation.groom_name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {invitation.groom_phone && (
                          <>
                            <a href={`sms:${invitation.groom_phone}`} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </a>
                            <a href={`tel:${invitation.groom_phone}`} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {invitation?.groom_father_name && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div>
                        <span className="text-xs font-medium text-blue-900">아버지</span>
                        <p className="text-[11px] text-blue-700">{invitation.groom_father_name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {invitation.groom_father_phone && (
                          <>
                            <a href={`sms:${invitation.groom_father_phone}`} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </a>
                            <a href={`tel:${invitation.groom_father_phone}`} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {invitation?.groom_mother_name && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div>
                        <span className="text-xs font-medium text-blue-900">어머니</span>
                        <p className="text-[11px] text-blue-700">{invitation.groom_mother_name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {invitation.groom_mother_phone && (
                          <>
                            <a href={`sms:${invitation.groom_mother_phone}`} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </a>
                            <a href={`tel:${invitation.groom_mother_phone}`} className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 신부측 */}
            {(invitation?.bride_name || invitation?.bride_father_name || invitation?.bride_mother_name) && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                  <p className="text-xs font-medium text-pink-700">신부측</p>
                </div>
                <div className="space-y-2">
                  {invitation?.bride_name && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-pink-50 border border-pink-100">
                      <div>
                        <span className="text-xs font-medium text-pink-900">신부</span>
                        <p className="text-[11px] text-pink-700">{invitation.bride_name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {invitation.bride_phone && (
                          <>
                            <a href={`sms:${invitation.bride_phone}`} className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </a>
                            <a href={`tel:${invitation.bride_phone}`} className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {invitation?.bride_father_name && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-pink-50 border border-pink-100">
                      <div>
                        <span className="text-xs font-medium text-pink-900">아버지</span>
                        <p className="text-[11px] text-pink-700">{invitation.bride_father_name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {invitation.bride_father_phone && (
                          <>
                            <a href={`sms:${invitation.bride_father_phone}`} className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </a>
                            <a href={`tel:${invitation.bride_father_phone}`} className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {invitation?.bride_mother_name && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-pink-50 border border-pink-100">
                      <div>
                        <span className="text-xs font-medium text-pink-900">어머니</span>
                        <p className="text-[11px] text-pink-700">{invitation.bride_mother_name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {invitation.bride_mother_phone && (
                          <>
                            <a href={`sms:${invitation.bride_mother_phone}`} className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </a>
                            <a href={`tel:${invitation.bride_mother_phone}`} className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center hover:bg-pink-200 transition-colors">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={closeModal} className="w-full py-3 rounded-xl text-sm" style={{ background: themeColors.background, color: themeColors.gray }}>닫기</button>
          </div>
        </>
      )}

      {/* RSVP Modal */}
      {activeModal === 'rsvp' && (
        <>
          <div className="absolute inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 p-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 className="text-center text-base mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>참석 여부</h3>
            <input
              type="text"
              placeholder="이름"
              value={rsvpForm.name}
              onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
              className="w-full p-3 rounded-xl mb-3 text-sm outline-none"
              style={{ background: themeColors.sectionBg, color: themeColors.text }}
            />
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setRsvpForm({ ...rsvpForm, attendance: 'yes' })}
                className={`flex-1 py-3 rounded-xl text-sm transition-all ${rsvpForm.attendance === 'yes' ? 'text-white' : ''}`}
                style={{ background: rsvpForm.attendance === 'yes' ? themeColors.primary : themeColors.sectionBg, color: rsvpForm.attendance === 'yes' ? 'white' : themeColors.text }}
              >참석</button>
              <button
                onClick={() => setRsvpForm({ ...rsvpForm, attendance: 'no' })}
                className={`flex-1 py-3 rounded-xl text-sm transition-all ${rsvpForm.attendance === 'no' ? 'text-white' : ''}`}
                style={{ background: rsvpForm.attendance === 'no' ? themeColors.primary : themeColors.sectionBg, color: rsvpForm.attendance === 'no' ? 'white' : themeColors.text }}
              >불참</button>
            </div>
            {invitation?.rsvpAllowGuestCount !== false && rsvpForm.attendance === 'yes' && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm" style={{ color: themeColors.text }}>참석 인원</span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setRsvpForm({ ...rsvpForm, guestCount: Math.max(1, rsvpForm.guestCount - 1) })}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: themeColors.sectionBg }}
                  >-</button>
                  <span className="w-8 text-center text-sm" style={{ color: themeColors.text }}>{rsvpForm.guestCount}</span>
                  <button
                    onClick={() => setRsvpForm({ ...rsvpForm, guestCount: rsvpForm.guestCount + 1 })}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: themeColors.sectionBg }}
                  >+</button>
                </div>
              </div>
            )}
            <textarea
              placeholder="메시지 (선택)"
              value={rsvpForm.message}
              onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
              className="w-full p-3 rounded-xl mb-4 text-sm outline-none resize-none h-16"
              style={{ background: themeColors.sectionBg, color: themeColors.text }}
            />
            <div className="flex gap-2">
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl text-sm" style={{ background: themeColors.sectionBg, color: themeColors.gray }}>취소</button>
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl text-sm text-white" style={{ background: themeColors.primary }}>제출하기</button>
            </div>
          </div>
        </>
      )}

      {/* Location Modal */}
      {activeModal === 'location' && (
        <>
          <div className="absolute inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 p-5 max-h-[80%] overflow-y-auto" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 className="text-center text-base mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>오시는 길</h3>
            <div className="text-center mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: themeColors.text }}>{invitation?.venue_name || '예식장'}</p>
              <p className="text-xs" style={{ color: themeColors.gray }}>{invitation?.venue_address || '주소를 입력해주세요'}</p>
            </div>

            {/* 지도 앱 버튼 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#03C75A' }}>
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <span className="text-[10px]" style={{ color: themeColors.text }}>네이버지도</span>
              </button>
              <button className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#FEE500' }}>
                  <span className="text-black text-xs font-bold">K</span>
                </div>
                <span className="text-[10px]" style={{ color: themeColors.text }}>카카오맵</span>
              </button>
              <button className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#4285F4' }}>
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span className="text-[10px]" style={{ color: themeColors.text }}>티맵</span>
              </button>
            </div>

            {/* 교통수단 탭 */}
            {(() => {
              const tabs = [
                { key: 'car' as DirectionsTab, label: '자가용', show: !!invitation?.directions?.car, icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h.01M16 17h.01M9 6h6m-6 0a2 2 0 00-2 2v9a2 2 0 002 2h6a2 2 0 002-2V8a2 2 0 00-2-2M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2m-6 5h6" />
                  </svg>
                )},
                { key: 'publicTransport' as DirectionsTab, label: '버스/지하철', show: !!invitation?.directions?.publicTransport, icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v10M16 7v10M8 11h8M5 21l2-4h10l2 4M12 3v4m-4 0h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z" />
                  </svg>
                )},
                { key: 'train' as DirectionsTab, label: '기차역', show: !!invitation?.directions?.train, icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 18h.01M16 18h.01M6 6h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2zm0 0V4h12v2M6 10h12" />
                  </svg>
                )},
                { key: 'expressBus' as DirectionsTab, label: '고속버스', show: !!invitation?.directions?.expressBus, icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 18h.01M16 18h.01M6 6h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2zm0 0V4h12v2M6 10h12" />
                  </svg>
                )},
              ].filter(tab => tab.show)

              return tabs.length > 1 ? (
                <div className="flex rounded-xl overflow-hidden mb-3" style={{ background: themeColors.sectionBg }}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setDirectionsTab(tab.key)}
                      className="flex-1 flex flex-col items-center py-2.5 transition-all"
                      style={{
                        background: directionsTab === tab.key ? themeColors.primary : 'transparent',
                        color: directionsTab === tab.key ? 'white' : themeColors.gray,
                      }}
                    >
                      {tab.icon}
                      <span className="text-[9px] mt-1">{tab.label}</span>
                    </button>
                  ))}
                </div>
              ) : null
            })()}

            {/* 교통수단별 정보 */}
            <div className="rounded-xl p-4 mb-3" style={{ background: themeColors.sectionBg, minHeight: '100px' }}>
              {directionsTab === 'car' && (
                invitation?.directions?.car ? (
                  <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>
                    {invitation.directions.car}
                  </p>
                ) : (
                  <p className="text-xs text-center py-4" style={{ color: themeColors.gray }}>
                    자가용 정보가 없습니다
                  </p>
                )
              )}

              {directionsTab === 'publicTransport' && invitation?.directions?.publicTransport && (
                <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>
                  {invitation.directions.publicTransport}
                </p>
              )}

              {directionsTab === 'train' && invitation?.directions?.train && (
                <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>
                  {invitation.directions.train}
                </p>
              )}

              {directionsTab === 'expressBus' && invitation?.directions?.expressBus && (
                <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: themeColors.text }}>
                  {invitation.directions.expressBus}
                </p>
              )}
            </div>

            <button
              onClick={() => copyToClipboard(invitation?.venue_address || '')}
              className="w-full py-2 rounded-xl text-xs mb-2"
              style={{ background: themeColors.sectionBg, color: themeColors.text }}
            >주소 복사</button>
            <button onClick={closeModal} className="w-full py-3 rounded-xl text-sm" style={{ background: themeColors.background, color: themeColors.gray }}>닫기</button>
          </div>
        </>
      )}

      {/* Account Modal */}
      {activeModal === 'account' && (
        <>
          <div className="absolute inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 p-6 max-h-[70%] overflow-y-auto" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 className="text-center text-base mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>마음 전하기</h3>

            {/* Groom Side - 블루 계열 */}
            {(invitation?.groom_bank_info?.enabled || invitation?.groom_father_bank_info?.enabled || invitation?.groom_mother_bank_info?.enabled) && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <p className="text-xs font-medium text-blue-700">신랑측</p>
                </div>
                <div className="space-y-2">
                  {invitation?.groom_bank_info?.enabled && invitation?.groom_bank_info?.account && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-900">신랑 {invitation?.groom_name}</span>
                        <button
                          onClick={() => copyToClipboard(`${invitation?.groom_bank_info?.bank || ''} ${invitation?.groom_bank_info?.account || ''}`)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >복사</button>
                      </div>
                      <p className="text-[10px] text-blue-600">{invitation?.groom_bank_info?.holder}</p>
                      <p className="text-xs text-blue-800">{invitation?.groom_bank_info?.bank} {invitation?.groom_bank_info?.account}</p>
                    </div>
                  )}
                  {invitation?.groom_father_bank_info?.enabled && invitation?.groom_father_bank_info?.account && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-900">아버지 {invitation?.groom_father_name}</span>
                        <button
                          onClick={() => copyToClipboard(`${invitation?.groom_father_bank_info?.bank || ''} ${invitation?.groom_father_bank_info?.account || ''}`)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >복사</button>
                      </div>
                      <p className="text-[10px] text-blue-600">{invitation?.groom_father_bank_info?.holder}</p>
                      <p className="text-xs text-blue-800">{invitation?.groom_father_bank_info?.bank} {invitation?.groom_father_bank_info?.account}</p>
                    </div>
                  )}
                  {invitation?.groom_mother_bank_info?.enabled && invitation?.groom_mother_bank_info?.account && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-900">어머니 {invitation?.groom_mother_name}</span>
                        <button
                          onClick={() => copyToClipboard(`${invitation?.groom_mother_bank_info?.bank || ''} ${invitation?.groom_mother_bank_info?.account || ''}`)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >복사</button>
                      </div>
                      <p className="text-[10px] text-blue-600">{invitation?.groom_mother_bank_info?.holder}</p>
                      <p className="text-xs text-blue-800">{invitation?.groom_mother_bank_info?.bank} {invitation?.groom_mother_bank_info?.account}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bride Side - 핑크 계열 */}
            {(invitation?.bride_bank_info?.enabled || invitation?.bride_father_bank_info?.enabled || invitation?.bride_mother_bank_info?.enabled) && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                  <p className="text-xs font-medium text-pink-700">신부측</p>
                </div>
                <div className="space-y-2">
                  {invitation?.bride_bank_info?.enabled && invitation?.bride_bank_info?.account && (
                    <div className="p-3 rounded-xl bg-pink-50 border border-pink-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-pink-900">신부 {invitation?.bride_name}</span>
                        <button
                          onClick={() => copyToClipboard(`${invitation?.bride_bank_info?.bank || ''} ${invitation?.bride_bank_info?.account || ''}`)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                        >복사</button>
                      </div>
                      <p className="text-[10px] text-pink-600">{invitation?.bride_bank_info?.holder}</p>
                      <p className="text-xs text-pink-800">{invitation?.bride_bank_info?.bank} {invitation?.bride_bank_info?.account}</p>
                    </div>
                  )}
                  {invitation?.bride_father_bank_info?.enabled && invitation?.bride_father_bank_info?.account && (
                    <div className="p-3 rounded-xl bg-pink-50 border border-pink-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-pink-900">아버지 {invitation?.bride_father_name}</span>
                        <button
                          onClick={() => copyToClipboard(`${invitation?.bride_father_bank_info?.bank || ''} ${invitation?.bride_father_bank_info?.account || ''}`)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                        >복사</button>
                      </div>
                      <p className="text-[10px] text-pink-600">{invitation?.bride_father_bank_info?.holder}</p>
                      <p className="text-xs text-pink-800">{invitation?.bride_father_bank_info?.bank} {invitation?.bride_father_bank_info?.account}</p>
                    </div>
                  )}
                  {invitation?.bride_mother_bank_info?.enabled && invitation?.bride_mother_bank_info?.account && (
                    <div className="p-3 rounded-xl bg-pink-50 border border-pink-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-pink-900">어머니 {invitation?.bride_mother_name}</span>
                        <button
                          onClick={() => copyToClipboard(`${invitation?.bride_mother_bank_info?.bank || ''} ${invitation?.bride_mother_bank_info?.account || ''}`)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                        >복사</button>
                      </div>
                      <p className="text-[10px] text-pink-600">{invitation?.bride_mother_bank_info?.holder}</p>
                      <p className="text-xs text-pink-800">{invitation?.bride_mother_bank_info?.bank} {invitation?.bride_mother_bank_info?.account}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 계좌가 하나도 없는 경우 */}
            {!(invitation?.groom_bank_info?.enabled || invitation?.groom_father_bank_info?.enabled || invitation?.groom_mother_bank_info?.enabled || invitation?.bride_bank_info?.enabled || invitation?.bride_father_bank_info?.enabled || invitation?.bride_mother_bank_info?.enabled) && (
              <p className="text-center text-xs py-8" style={{ color: themeColors.gray }}>등록된 계좌가 없습니다</p>
            )}

            <button onClick={closeModal} className="w-full py-3 rounded-xl text-sm" style={{ background: themeColors.background, color: themeColors.gray }}>닫기</button>
          </div>
        </>
      )}
    </>
  )
}
