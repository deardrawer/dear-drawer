'use client'

import { useState } from 'react'

type ModalType = 'none' | 'guestbook' | 'rsvp' | 'location' | 'account'

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
  invitation?: {
    venue_name?: string
    venue_address?: string
    groom_name?: string
    bride_name?: string
    groom_father_name?: string
    groom_mother_name?: string
    bride_father_name?: string
    bride_mother_name?: string
    groom_account?: string
    bride_account?: string
    groom_bank?: string
    bride_bank?: string
  }
}

export default function FloatingButton({ themeColors, fonts, invitation }: FloatingButtonProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>('none')
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
      {/* Floating Button */}
      <button
        onClick={() => setIsBottomSheetOpen(true)}
        className="absolute bottom-12 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 z-40"
        style={{
          background: themeColors.primary,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="14" y2="18" />
        </svg>
      </button>

      {/* Bottom Sheet */}
      {isBottomSheetOpen && (
        <>
          <div className="absolute inset-0 bg-black/50 z-50" onClick={() => setIsBottomSheetOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-8" style={{ maxHeight: '70%', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <h3 className="text-center text-sm mb-6" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>결혼식 정보</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-5 rounded-2xl" style={{ background: themeColors.sectionBg }} onClick={() => openModal('guestbook')}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: themeColors.cardBg }}>
                  <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                </div>
                <span className="text-[11px]" style={{ color: themeColors.text }}>축하 전하기</span>
              </button>
              <button className="flex flex-col items-center justify-center p-5 rounded-2xl" style={{ background: themeColors.sectionBg }} onClick={() => openModal('rsvp')}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: themeColors.cardBg }}>
                  <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-[11px]" style={{ color: themeColors.text }}>참석 여부</span>
              </button>
              <button className="flex flex-col items-center justify-center p-5 rounded-2xl" style={{ background: themeColors.sectionBg }} onClick={() => openModal('location')}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: themeColors.cardBg }}>
                  <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                </div>
                <span className="text-[11px]" style={{ color: themeColors.text }}>오시는 길</span>
              </button>
              <button className="flex flex-col items-center justify-center p-5 rounded-2xl" style={{ background: themeColors.sectionBg }} onClick={() => openModal('account')}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: themeColors.cardBg }}>
                  <svg className="w-5 h-5" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                </div>
                <span className="text-[11px]" style={{ color: themeColors.text }}>마음 전하기</span>
              </button>
            </div>
            <button onClick={() => setIsBottomSheetOpen(false)} className="w-full mt-6 py-3 rounded-xl text-xs font-light" style={{ background: themeColors.background, color: themeColors.gray }}>닫기</button>
          </div>
        </>
      )}

      {/* Guestbook Modal */}
      {activeModal === 'guestbook' && (
        <>
          <div className="absolute inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 p-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 className="text-center text-base mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>축하 메시지</h3>
            <input
              type="text"
              placeholder="이름"
              value={guestbookForm.name}
              onChange={(e) => setGuestbookForm({ ...guestbookForm, name: e.target.value })}
              className="w-full p-3 rounded-xl mb-3 text-sm outline-none"
              style={{ background: themeColors.sectionBg, color: themeColors.text }}
            />
            <textarea
              placeholder="축하 메시지를 남겨주세요"
              value={guestbookForm.message}
              onChange={(e) => setGuestbookForm({ ...guestbookForm, message: e.target.value })}
              className="w-full p-3 rounded-xl mb-4 text-sm outline-none resize-none h-24"
              style={{ background: themeColors.sectionBg, color: themeColors.text }}
            />
            <div className="flex gap-2">
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl text-sm" style={{ background: themeColors.sectionBg, color: themeColors.gray }}>취소</button>
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl text-sm text-white" style={{ background: themeColors.primary }}>등록하기</button>
            </div>
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
            {rsvpForm.attendance === 'yes' && (
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
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 p-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 className="text-center text-base mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>오시는 길</h3>
            <div className="text-center mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: themeColors.text }}>{invitation?.venue_name || '예식장'}</p>
              <p className="text-xs" style={{ color: themeColors.gray }}>{invitation?.venue_address || '주소를 입력해주세요'}</p>
            </div>
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
            <button
              onClick={() => copyToClipboard(invitation?.venue_address || '')}
              className="w-full py-2 rounded-xl text-xs mb-3"
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

            {/* Groom Side */}
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: themeColors.gray }}>신랑측</p>
              <div className="p-4 rounded-xl" style={{ background: themeColors.sectionBg }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: themeColors.text }}>{invitation?.groom_name || '신랑'}</span>
                  <button
                    onClick={() => copyToClipboard(`${invitation?.groom_bank || ''} ${invitation?.groom_account || ''}`)}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: themeColors.cardBg, color: themeColors.primary }}
                  >복사</button>
                </div>
                <p className="text-xs" style={{ color: themeColors.gray }}>{invitation?.groom_bank || '은행'} {invitation?.groom_account || '계좌번호'}</p>
              </div>
            </div>

            {/* Bride Side */}
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: themeColors.gray }}>신부측</p>
              <div className="p-4 rounded-xl" style={{ background: themeColors.sectionBg }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: themeColors.text }}>{invitation?.bride_name || '신부'}</span>
                  <button
                    onClick={() => copyToClipboard(`${invitation?.bride_bank || ''} ${invitation?.bride_account || ''}`)}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: themeColors.cardBg, color: themeColors.primary }}
                  >복사</button>
                </div>
                <p className="text-xs" style={{ color: themeColors.gray }}>{invitation?.bride_bank || '은행'} {invitation?.bride_account || '계좌번호'}</p>
              </div>
            </div>

            <button onClick={closeModal} className="w-full py-3 rounded-xl text-sm" style={{ background: themeColors.background, color: themeColors.gray }}>닫기</button>
          </div>
        </>
      )}
    </>
  )
}
