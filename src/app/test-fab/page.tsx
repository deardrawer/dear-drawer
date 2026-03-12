'use client'

import { useState, useEffect, useRef } from 'react'

// 테마 색상 (OUR 템플릿 기본)
const themeColors = {
  primary: '#D4A574',
  sectionBg: '#FDF8F4',
  cardBg: '#FFFFFF',
  text: '#2C2420',
  gray: '#9C9590',
  background: '#F5F0EB',
}

// ============================================================
// 방안 1: 텍스트 라벨 직접 표시
// ============================================================
function Option1_TextLabel() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-5 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: themeColors.cardBg, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={themeColors.text} strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
            <line x1="4" y1="18" x2="14" y2="18" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-medium" style={{ color: themeColors.text }}>결혼식 정보</span>
        </button>
      </div>
    </>
  )
}

// ============================================================
// 방안 2: 하단 고정 네비게이션 바 (인터랙티브)
// ============================================================
function Option2_BottomNav() {
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const items = [
    { key: 'contact', label: '축하 전하기', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
    )},
    { key: 'rsvp', label: '참석 여부', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { key: 'location', label: '오시는 길', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
    )},
    { key: 'account', label: '마음 전하기', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
    )},
    { key: 'share', label: '공유', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
    )},
  ]

  const handleTabClick = (key: string) => {
    if (activeTab === key) {
      setActiveTab(null)
    } else {
      setActiveTab(key)
    }
  }

  return (
    <>
      {/* 모달 오버레이 + 컨텐츠 */}
      {activeTab && (
        <div className="fixed inset-0 z-40 flex items-end" onClick={() => setActiveTab(null)}>
          <div className="absolute inset-0 bg-black/40 transition-opacity" />
          <div
            className="relative w-full bg-white rounded-t-3xl overflow-hidden flex flex-col animate-slide-up"
            style={{ maxHeight: '70vh', marginBottom: '72px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className="flex-1 py-3 text-[11px] font-medium transition-all relative"
                  style={{
                    color: activeTab === item.key ? themeColors.primary : themeColors.gray,
                  }}
                >
                  {item.label}
                  {activeTab === item.key && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ background: themeColors.primary }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* 모달 컨텐츠 */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* 축하 전하기 */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><p className="text-xs font-medium text-blue-700">신랑측</p></div>
                    <div className="space-y-2">
                      {[{ role: '아버지', name: '김철수' }, { role: '어머니', name: '박영희' }].map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <div><span className="text-xs font-medium text-blue-900">{c.role}</span><p className="text-[11px] text-blue-700">{c.name}</p></div>
                          <div className="flex gap-1.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /><p className="text-xs font-medium text-pink-700">신부측</p></div>
                    <div className="space-y-2">
                      {[{ role: '아버지', name: '이정호' }, { role: '어머니', name: '최미경' }].map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-pink-50 border border-pink-100">
                          <div><span className="text-xs font-medium text-pink-900">{c.role}</span><p className="text-[11px] text-pink-700">{c.name}</p></div>
                          <div className="flex gap-1.5">
                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 참석 여부 */}
              {activeTab === 'rsvp' && (
                <div className="space-y-3">
                  <input type="text" placeholder="이름" className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: themeColors.sectionBg, color: themeColors.text }} />
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-3 rounded-xl text-sm" style={{ background: themeColors.sectionBg, color: themeColors.text }}>신랑측</button>
                    <button className="py-3 rounded-xl text-sm" style={{ background: themeColors.sectionBg, color: themeColors.text }}>신부측</button>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 rounded-xl text-sm text-white" style={{ background: themeColors.primary }}>참석</button>
                    <button className="flex-1 py-3 rounded-xl text-sm" style={{ background: themeColors.sectionBg, color: themeColors.text }}>불참</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: themeColors.text }}>참석 인원</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: themeColors.sectionBg }}>-</button>
                      <span className="w-8 text-center text-sm" style={{ color: themeColors.text }}>1</span>
                      <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: themeColors.sectionBg }}>+</button>
                    </div>
                  </div>
                  <textarea placeholder="메시지 (선택)" className="w-full p-3 rounded-xl text-sm outline-none resize-none h-16" style={{ background: themeColors.sectionBg, color: themeColors.text }} />
                  <button className="w-full py-3 rounded-xl text-sm text-white" style={{ background: themeColors.primary }}>제출하기</button>
                </div>
              )}

              {/* 오시는 길 */}
              {activeTab === 'location' && (
                <div>
                  <div className="text-center mb-4">
                    <p className="text-sm font-medium mb-1" style={{ color: themeColors.text }}>더채플앳청담 그랜드블룸 5층</p>
                    <p className="text-xs" style={{ color: themeColors.gray }}>서울특별시 강남구 청담동 123-45</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#03C75A' }}><span className="text-white text-xs font-bold">N</span></div>
                      <span className="text-[10px]" style={{ color: themeColors.text }}>네이버지도</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#FEE500' }}><span className="text-black text-xs font-bold">K</span></div>
                      <span className="text-[10px]" style={{ color: themeColors.text }}>카카오맵</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#4285F4' }}><span className="text-white text-xs font-bold">T</span></div>
                      <span className="text-[10px]" style={{ color: themeColors.text }}>티맵</span>
                    </div>
                  </div>
                  <div className="flex rounded-xl overflow-hidden mb-3" style={{ background: themeColors.sectionBg }}>
                    <button className="flex-1 py-2.5 text-[10px] text-white" style={{ background: themeColors.primary }}>자가용</button>
                    <button className="flex-1 py-2.5 text-[10px]" style={{ color: themeColors.gray }}>버스/지하철</button>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: themeColors.sectionBg }}>
                    <p className="text-xs leading-relaxed" style={{ color: themeColors.text }}>
                      강남역에서 청담동 방면으로 약 10분<br />
                      주차장은 건물 지하 2층에 마련되어 있습니다.<br />
                      (2시간 무료 주차 가능)
                    </p>
                  </div>
                  <button className="w-full mt-4 py-2 rounded-xl text-xs" style={{ background: themeColors.sectionBg, color: themeColors.text }}>주소 복사</button>
                </div>
              )}

              {/* 마음 전하기 */}
              {activeTab === 'account' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><p className="text-xs font-medium text-blue-700">신랑측</p></div>
                    <div className="space-y-2">
                      {[{ role: '신랑', name: '김민준', bank: '카카오뱅크', account: '3333-01-1234567' }].map((a, i) => (
                        <div key={i} className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-blue-900">{a.role} {a.name}</span>
                            <button className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">복사</button>
                          </div>
                          <p className="text-xs text-blue-800">{a.bank} {a.account}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /><p className="text-xs font-medium text-pink-700">신부측</p></div>
                    <div className="space-y-2">
                      {[{ role: '신부', name: '이서연', bank: '국민은행', account: '940810-01-234567' }].map((a, i) => (
                        <div key={i} className="p-3 rounded-xl bg-pink-50 border border-pink-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-pink-900">{a.role} {a.name}</span>
                            <button className="text-[10px] px-2.5 py-1 rounded-full bg-pink-100 text-pink-700">복사</button>
                          </div>
                          <p className="text-xs text-pink-800">{a.bank} {a.account}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 공유하기 */}
              {activeTab === 'share' && (
                <div>
                  <p className="text-center text-sm mb-4" style={{ color: themeColors.text }}>청첩장을 공유해보세요</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex flex-col items-center justify-center p-4 rounded-xl" style={{ background: '#FEE500' }}>
                      <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" /></svg>
                      <span className="text-xs font-medium" style={{ color: '#3C1E1E' }}>카카오톡 공유</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 rounded-xl" style={{ background: themeColors.sectionBg }}>
                      <svg className="w-8 h-8 mb-2" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                      <span className="text-xs font-medium" style={{ color: themeColors.text }}>링크 복사</span>
                    </button>
                  </div>
                  <div className="mt-4 p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
                    <p className="text-[10px] text-center" style={{ color: themeColors.gray }}>
                      카카오톡으로 친구들에게 청첩장을 공유하거나<br />
                      링크를 복사하여 원하는 곳에 붙여넣기 하세요
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t" style={{ background: themeColors.cardBg, borderColor: '#eee' }}>
        <div className="flex items-center justify-around py-2 px-1">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key)}
              className="flex flex-col items-center gap-1 py-1 px-1 transition-all active:scale-95"
              style={{ minWidth: 0, color: activeTab === item.key ? themeColors.primary : themeColors.gray }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: activeTab === item.key ? `${themeColors.primary}15` : themeColors.sectionBg,
                }}
              >
                {item.icon}
              </div>
              <span
                className="text-[10px] leading-tight font-medium transition-colors"
                style={{ color: activeTab === item.key ? themeColors.primary : themeColors.text }}
              >
                {item.label}
              </span>
              {activeTab === item.key && (
                <span className="w-1 h-1 rounded-full" style={{ background: themeColors.primary }} />
              )}
            </button>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" style={{ background: themeColors.cardBg }} />
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

// ============================================================
// 방안 3: 최초 자동 펼침 후 축소
// ============================================================
function Option3_AutoExpand() {
  const [expanded, setExpanded] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => setExpanded(false), 4000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const quickItems = [
    { label: '참석', icon: '✓' },
    { label: '길찾기', icon: '📍' },
    { label: '축의금', icon: '💳' },
    { label: '공유', icon: '📤' },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-end gap-2">
      {/* 펼쳐진 메뉴 아이템들 */}
      <div
        className="flex items-center gap-1.5 overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxWidth: expanded ? '400px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        {quickItems.map((item, i) => (
          <button
            key={i}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-full shadow-md whitespace-nowrap transition-all hover:scale-105 active:scale-95"
            style={{ background: themeColors.cardBg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <span className="text-sm">{item.icon}</span>
            <span className="text-xs font-medium" style={{ color: themeColors.text }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* 메인 버튼 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0"
        style={{ background: themeColors.cardBg, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
      >
        <svg
          className="w-5 h-5 transition-transform duration-300"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          viewBox="0 0 24 24" fill="none" stroke={themeColors.text} strokeWidth={2}
        >
          <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
          <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
          <line x1="4" y1="18" x2="14" y2="18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ============================================================
// 방안 4: 현재 구조 유지 + 강화 (크기 확대 + 펄스 + 긴 툴팁)
// ============================================================
function Option4_Enhanced() {
  const [showTooltip, setShowTooltip] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 6000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* 말풍선 - 더 크게, 더 오래 */}
      <div
        className="transition-all duration-300"
        style={{
          opacity: showTooltip ? 1 : 0,
          visibility: showTooltip ? 'visible' : 'hidden',
          transform: showTooltip ? 'translateY(0)' : 'translateY(10px)'
        }}
      >
        <div
          className="relative px-4 py-3 rounded-2xl text-sm text-gray-700 whitespace-nowrap"
          style={{
            background: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          결혼식 정보 확인하기
          <div
            className="absolute"
            style={{
              bottom: '-8px', right: '20px',
              width: '0', height: '0',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid #fff',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
            }}
          />
        </div>
      </div>

      {/* 버튼 - 56px + 펄스 애니메이션 */}
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 animate-pulse-ring"
        style={{ background: themeColors.cardBg, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={themeColors.text} strokeWidth={2}>
          <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
          <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
          <line x1="4" y1="18" x2="14" y2="18" strokeLinecap="round" />
        </svg>
      </button>

      <style jsx>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(212, 165, 116, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(212, 165, 116, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 165, 116, 0); }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================================
// 방안 5: 텍스트 + 스크롤 반응형 (절충안)
// ============================================================
function Option5_ScrollResponsive() {
  const [collapsed, setCollapsed] = useState(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const container = document.getElementById('scroll-container-5')
    if (!container) return

    const handleScroll = () => {
      setCollapsed(true)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => setCollapsed(false), 1500)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
        style={{
          background: themeColors.cardBg,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          padding: collapsed ? '0' : '0',
        }}
      >
        <div
          className="flex items-center gap-2 transition-all duration-300 ease-in-out"
          style={{
            paddingLeft: collapsed ? '0.75rem' : '1.25rem',
            paddingRight: collapsed ? '0.75rem' : '1.25rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
          }}
        >
          <svg
            className="w-4 h-4 flex-shrink-0 transition-all duration-300"
            style={{ width: collapsed ? '1.25rem' : '1rem', height: collapsed ? '1.25rem' : '1rem' }}
            viewBox="0 0 24 24" fill="none" stroke={themeColors.text} strokeWidth={2}
          >
            <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
            <line x1="4" y1="18" x2="14" y2="18" strokeLinecap="round" />
          </svg>
          <span
            className="text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden"
            style={{
              color: themeColors.text,
              maxWidth: collapsed ? '0px' : '120px',
              opacity: collapsed ? 0 : 1,
            }}
          >
            결혼식 정보
          </span>
        </div>
      </button>
    </div>
  )
}

// ============================================================
// 현재 디자인 (비교용)
// ============================================================
function OptionCurrent() {
  const [showTooltip, setShowTooltip] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
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
          }}
        >
          결혼식 정보 확인하기
          <div
            className="absolute"
            style={{
              bottom: '-8px', right: '16px',
              width: '0', height: '0',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid #fff',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
            }}
          />
        </div>
      </div>
      <button
        onClick={() => setShowTooltip(!showTooltip)}
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
  )
}

// ============================================================
// 방안 6: 조합 - 인트로(방안2) + 메인(방안5)
// ============================================================
function Option6_Combined({ isIntro }: { isIntro: boolean }) {
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const items = [
    { key: 'contact', label: '축하 전하기', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
    )},
    { key: 'rsvp', label: '참석 여부', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { key: 'location', label: '오시는 길', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
    )},
    { key: 'account', label: '마음 전하기', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
    )},
    { key: 'share', label: '공유', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
    )},
  ]

  const handleTabClick = (key: string) => {
    setActiveTab(activeTab === key ? null : key)
  }

  // ---- 인트로 모드: 하단 네비바 (방안2) ----
  if (isIntro) {
    return (
      <>
        {activeTab && (
          <div className="fixed inset-0 z-40 flex items-end" onClick={() => setActiveTab(null)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative w-full bg-white rounded-t-3xl overflow-hidden flex flex-col animate-slide-up-combo" style={{ maxHeight: '70vh', marginBottom: '72px' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex border-b border-gray-100 flex-shrink-0">
                {items.map((item) => (
                  <button key={item.key} onClick={() => setActiveTab(item.key)} className="flex-1 py-3 text-[11px] font-medium transition-all relative" style={{ color: activeTab === item.key ? themeColors.primary : themeColors.gray }}>
                    {item.label}
                    {activeTab === item.key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: themeColors.primary }} />}
                  </button>
                ))}
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {activeTab === 'contact' && <DemoContactContent />}
                {activeTab === 'rsvp' && <DemoRsvpContent />}
                {activeTab === 'location' && <DemoLocationContent />}
                {activeTab === 'account' && <DemoAccountContent />}
                {activeTab === 'share' && <DemoShareContent />}
              </div>
            </div>
          </div>
        )}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t transition-all" style={{ background: themeColors.cardBg, borderColor: '#eee' }}>
          <div className="flex items-center justify-around py-2 px-1">
            {items.map((item) => (
              <button key={item.key} onClick={() => handleTabClick(item.key)} className="flex flex-col items-center gap-1 py-1 px-1 transition-all active:scale-95" style={{ minWidth: 0, color: activeTab === item.key ? themeColors.primary : themeColors.gray }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: activeTab === item.key ? `${themeColors.primary}15` : themeColors.sectionBg }}>{item.icon}</div>
                <span className="text-[10px] leading-tight font-medium transition-colors" style={{ color: activeTab === item.key ? themeColors.primary : themeColors.text }}>{item.label}</span>
                {activeTab === item.key && <span className="w-1 h-1 rounded-full" style={{ background: themeColors.primary }} />}
              </button>
            ))}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" style={{ background: themeColors.cardBg }} />
        </div>
        <style jsx>{`
          @keyframes slide-up-combo { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .animate-slide-up-combo { animation: slide-up-combo 0.3s ease-out; }
        `}</style>
      </>
    )
  }

  // ---- 메인 모드: 미니 하단바 (방안D) ----
  return (
    <>
      {/* 모달 */}
      {activeTab && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setActiveTab(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full bg-white rounded-t-3xl overflow-hidden flex flex-col animate-slide-up-combo" style={{ maxHeight: '70vh', marginBottom: '52px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {items.map((item) => (
                <button key={item.key} onClick={() => setActiveTab(item.key)} className="flex-1 py-3 text-[11px] font-medium transition-all relative" style={{ color: activeTab === item.key ? themeColors.primary : themeColors.gray }}>
                  {item.label}
                  {activeTab === item.key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: themeColors.primary }} />}
                </button>
              ))}
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'contact' && <DemoContactContent />}
              {activeTab === 'rsvp' && <DemoRsvpContent />}
              {activeTab === 'location' && <DemoLocationContent />}
              {activeTab === 'account' && <DemoAccountContent />}
              {activeTab === 'share' && <DemoShareContent />}
            </div>
          </div>
        </div>
      )}

      {/* 미니 하단바 - 아이콘만, 텍스트 없음 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 transition-all" style={{ background: `${themeColors.cardBg}ee`, backdropFilter: 'blur(8px)', borderTop: '1px solid #eee' }}>
        <div className="flex items-center justify-around py-1.5 px-2">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key)}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all active:scale-90"
              style={{ color: activeTab === item.key ? themeColors.primary : themeColors.gray }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: activeTab === item.key ? `${themeColors.primary}15` : 'transparent',
                }}
              >
                {item.icon}
              </div>
              {/* 선택된 탭만 점 표시 */}
              {activeTab === item.key ? (
                <span className="w-1 h-1 rounded-full" style={{ background: themeColors.primary }} />
              ) : (
                <span className="w-1 h-1" />
              )}
            </button>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" style={{ background: themeColors.cardBg }} />
      </div>

      <style jsx>{`
        @keyframes slide-up-combo { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-combo { animation: slide-up-combo 0.3s ease-out; }
      `}</style>
    </>
  )
}

// 데모 모달 콘텐츠 (공용)
function DemoContactContent() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><p className="text-xs font-medium text-blue-700">신랑측</p></div>
        <div className="space-y-2">
          {[{ role: '아버지', name: '김철수' }, { role: '어머니', name: '박영희' }].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div><span className="text-xs font-medium text-blue-900">{c.role}</span><p className="text-[11px] text-blue-700">{c.name}</p></div>
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /><p className="text-xs font-medium text-pink-700">신부측</p></div>
        <div className="space-y-2">
          {[{ role: '아버지', name: '이정호' }, { role: '어머니', name: '최미경' }].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-pink-50 border border-pink-100">
              <div><span className="text-xs font-medium text-pink-900">{c.role}</span><p className="text-[11px] text-pink-700">{c.name}</p></div>
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center"><svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center"><svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
function DemoRsvpContent() {
  return (
    <div className="space-y-3">
      <input type="text" placeholder="이름" className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: themeColors.sectionBg, color: themeColors.text }} />
      <div className="grid grid-cols-2 gap-2">
        <button className="py-3 rounded-xl text-sm" style={{ background: themeColors.sectionBg, color: themeColors.text }}>신랑측</button>
        <button className="py-3 rounded-xl text-sm" style={{ background: themeColors.sectionBg, color: themeColors.text }}>신부측</button>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-3 rounded-xl text-sm text-white" style={{ background: themeColors.primary }}>참석</button>
        <button className="flex-1 py-3 rounded-xl text-sm" style={{ background: themeColors.sectionBg, color: themeColors.text }}>불참</button>
      </div>
      <textarea placeholder="메시지 (선택)" className="w-full p-3 rounded-xl text-sm outline-none resize-none h-16" style={{ background: themeColors.sectionBg, color: themeColors.text }} />
      <button className="w-full py-3 rounded-xl text-sm text-white" style={{ background: themeColors.primary }}>제출하기</button>
    </div>
  )
}
function DemoLocationContent() {
  return (
    <div>
      <div className="text-center mb-4">
        <p className="text-sm font-medium mb-1" style={{ color: themeColors.text }}>더채플앳청담 그랜드블룸 5층</p>
        <p className="text-xs" style={{ color: themeColors.gray }}>서울특별시 강남구 청담동 123-45</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#03C75A' }}><span className="text-white text-xs font-bold">N</span></div>
          <span className="text-[10px]" style={{ color: themeColors.text }}>네이버지도</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#FEE500' }}><span className="text-black text-xs font-bold">K</span></div>
          <span className="text-[10px]" style={{ color: themeColors.text }}>카카오맵</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl" style={{ background: themeColors.sectionBg }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#4285F4' }}><span className="text-white text-xs font-bold">T</span></div>
          <span className="text-[10px]" style={{ color: themeColors.text }}>티맵</span>
        </div>
      </div>
      <div className="rounded-xl p-4" style={{ background: themeColors.sectionBg }}>
        <p className="text-xs leading-relaxed" style={{ color: themeColors.text }}>강남역에서 청담동 방면으로 약 10분<br />주차장은 건물 지하 2층에 마련되어 있습니다.</p>
      </div>
    </div>
  )
}
function DemoAccountContent() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><p className="text-xs font-medium text-blue-700">신랑측</p></div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-blue-900">신랑 김민준</span><button className="text-[10px] px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">복사</button></div>
          <p className="text-xs text-blue-800">카카오뱅크 3333-01-1234567</p>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /><p className="text-xs font-medium text-pink-700">신부측</p></div>
        <div className="p-3 rounded-xl bg-pink-50 border border-pink-100">
          <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-pink-900">신부 이서연</span><button className="text-[10px] px-2.5 py-1 rounded-full bg-pink-100 text-pink-700">복사</button></div>
          <p className="text-xs text-pink-800">국민은행 940810-01-234567</p>
        </div>
      </div>
    </div>
  )
}
function DemoShareContent() {
  return (
    <div>
      <p className="text-center text-sm mb-4" style={{ color: themeColors.text }}>청첩장을 공유해보세요</p>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex flex-col items-center justify-center p-4 rounded-xl" style={{ background: '#FEE500' }}>
          <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.643 1.765 4.966 4.412 6.286l-.893 3.27a.3.3 0 00.455.334l3.862-2.552c.67.097 1.357.148 2.055.148 5.523 0 10-3.463 10-7.777C22 6.463 17.523 3 12 3z" /></svg>
          <span className="text-xs font-medium" style={{ color: '#3C1E1E' }}>카카오톡 공유</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-xl" style={{ background: themeColors.sectionBg }}>
          <svg className="w-8 h-8 mb-2" fill="none" stroke={themeColors.primary} strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
          <span className="text-xs font-medium" style={{ color: themeColors.text }}>링크 복사</span>
        </button>
      </div>
    </div>
  )
}

// ============================================================
// 메인 테스트 페이지
// ============================================================
export default function TestFabPage() {
  const [activeOption, setActiveOption] = useState<number>(6)

  const options = [
    { id: 6, label: '조합: 인트로+메인', desc: '인트로=하단네비바(방안2), 메인=스크롤반응형(방안5)' },
    { id: 0, label: '현재 디자인', desc: '기존 48px 원형 + 말풍선 (3초 후 사라짐)' },
    { id: 1, label: '방안1: 텍스트 라벨', desc: '항상 "결혼식 정보" 텍스트가 보이는 필 버튼' },
    { id: 2, label: '방안2: 하단 네비 바', desc: '하단에 모든 메뉴를 탭바로 고정' },
    { id: 3, label: '방안3: 자동 펼침→축소', desc: '4초간 메뉴 펼침 후 원형으로 축소' },
    { id: 4, label: '방안4: 기존 강화', desc: '56px + 펄스 애니메이션 + 6초 툴팁' },
    { id: 5, label: '방안5: 스크롤 반응형', desc: '스크롤 시 축소, 멈추면 텍스트 펼침' },
  ]

  // 인트로 컨텐츠
  const IntroContent = () => (
    <div className="space-y-8" style={{ paddingBottom: activeOption === 6 || activeOption === 2 ? '100px' : '32px' }}>
      <div className="text-center pt-12 pb-8">
        <p className="text-sm tracking-widest mb-4" style={{ color: themeColors.primary }}>WEDDING INVITATION</p>
        <h1 className="text-2xl font-light mb-2" style={{ color: themeColors.text }}>민준 & 서연</h1>
        <p className="text-xs" style={{ color: themeColors.gray }}>2026. 12. 26 토요일 오후 2시</p>
      </div>

      <div className="mx-6 rounded-2xl overflow-hidden" style={{ background: themeColors.sectionBg }}>
        <div className="h-64 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeColors.primary}20, ${themeColors.primary}40)` }}>
          <span className="text-6xl opacity-30">📷</span>
        </div>
      </div>

      <div className="px-8 py-6 text-center">
        <p className="text-xs leading-loose" style={{ color: themeColors.text }}>
          사랑은 서로 마주보는 것이 아니라<br />
          함께 같은 방향을 바라보는 것이다
        </p>
        <p className="text-xs mt-3" style={{ color: themeColors.gray }}>생텍쥐페리</p>
      </div>

      <div className="h-px mx-8" style={{ background: `${themeColors.text}15` }} />

      <div className="px-8 text-center space-y-6">
        <p className="text-xs leading-loose" style={{ color: themeColors.text }}>서로 다른 길을 걸어온 두 사람이<br />이제 같은 길을 함께 걸어가려 합니다.</p>
        <p className="text-xs leading-loose" style={{ color: themeColors.text }}>저희의 새로운 시작을<br />축복해 주시면 감사하겠습니다.</p>
        <p className="text-xs leading-loose" style={{ color: themeColors.text }}>귀한 걸음 하시어<br />자리를 빛내주세요.</p>
      </div>

      <div className="px-8 text-center space-y-2">
        <p className="text-xs" style={{ color: themeColors.text }}>김철수 · 박영희 의 아들 <span style={{ color: themeColors.primary }}>김민준</span></p>
        <p className="text-xs" style={{ color: themeColors.text }}>이정호 · 최미경 의 딸 <span style={{ color: themeColors.primary }}>이서연</span></p>
      </div>

      <div className="mx-6 rounded-2xl p-8 text-center" style={{ background: themeColors.sectionBg }}>
        <div className="inline-block px-4 py-1.5 rounded-full text-[10px] mb-4" style={{ background: themeColors.cardBg, color: themeColors.gray }}>Until wedding D-292</div>
        <h2 className="text-xl font-light mb-2" style={{ color: themeColors.text }}>2026.12.26 Sat</h2>
        <p className="text-xs mb-4" style={{ color: themeColors.gray }}>오후 2시</p>
        <div className="h-px mb-4" style={{ background: `${themeColors.text}15` }} />
        <p className="text-sm font-medium mb-1" style={{ color: themeColors.text }}>더채플앳청담 그랜드블룸 5층</p>
        <p className="text-xs mb-4" style={{ color: themeColors.gray }}>서울특별시 강남구 청담동 123-45</p>
        <button className="px-6 py-2.5 rounded-full text-xs border" style={{ borderColor: themeColors.primary, color: themeColors.primary }}>오시는 길</button>
      </div>

      <div className="px-8 text-center">
        <p className="text-xs" style={{ color: themeColors.gray }}>다음 이야기</p>
        <p className="text-3xl mt-1" style={{ color: themeColors.gray }}>·</p>
      </div>
    </div>
  )

  // 메인 컨텐츠
  const MainContent = () => (
    <div className="space-y-8 pb-32">
      {/* 디바이더 (인트로→메인 전환) */}
      <div className="relative h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeColors.primary}30, ${themeColors.primary}10)` }}>
        <div className="text-center">
          <p className="text-[10px] tracking-[0.3em] mb-2" style={{ color: themeColors.primary }}>CHAPTER 1</p>
          <p className="text-lg font-light" style={{ color: themeColors.text }}>민준 & 서연</p>
          <p className="text-xs mt-1" style={{ color: themeColors.gray }}>결혼합니다</p>
        </div>
      </div>

      {/* 커플 프로필 */}
      <div className="px-6 space-y-6">
        <div className="rounded-2xl overflow-hidden" style={{ background: themeColors.sectionBg }}>
          <div className="h-72 flex items-center justify-center" style={{ background: `${themeColors.primary}15` }}><span className="text-5xl opacity-20">📷</span></div>
          <div className="p-6 text-center">
            <p className="text-xs tracking-widest mb-2" style={{ color: themeColors.primary }}>GROOM</p>
            <p className="text-sm font-medium mb-3" style={{ color: themeColors.text }}>김민준</p>
            <p className="text-xs leading-relaxed" style={{ color: themeColors.gray }}>당신과 함께하는 매 순간이<br />제 인생의 가장 빛나는 시간입니다.</p>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: themeColors.sectionBg }}>
          <div className="h-72 flex items-center justify-center" style={{ background: `${themeColors.primary}15` }}><span className="text-5xl opacity-20">📷</span></div>
          <div className="p-6 text-center">
            <p className="text-xs tracking-widest mb-2" style={{ color: themeColors.primary }}>BRIDE</p>
            <p className="text-sm font-medium mb-3" style={{ color: themeColors.text }}>이서연</p>
            <p className="text-xs leading-relaxed" style={{ color: themeColors.gray }}>당신이 있어 매일이 특별한 날입니다.<br />앞으로도 함께 걸어가요.</p>
          </div>
        </div>
      </div>

      {/* 스토리 */}
      <div className="relative h-36 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.3em] mb-2" style={{ color: themeColors.primary }}>OUR STORY</p>
          <p className="text-lg font-light" style={{ color: themeColors.text }}>사랑이 시작된</p>
          <p className="text-lg font-light" style={{ color: themeColors.text }}>작은 순간들</p>
        </div>
      </div>

      <div className="px-6 space-y-8">
        {['첫 만남', '첫 데이트', '프로포즈'].map((title, i) => (
          <div key={i} className="space-y-3">
            <p className="text-[10px]" style={{ color: themeColors.gray }}>2024.{String(i * 3 + 3).padStart(2, '0')}</p>
            <p className="text-sm font-medium" style={{ color: themeColors.text }}>{title}</p>
            <p className="text-xs leading-relaxed" style={{ color: themeColors.gray }}>소중한 순간의 이야기가 여기에 담겨있습니다.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-[4/5] rounded-xl flex items-center justify-center" style={{ background: `${themeColors.primary}10` }}><span className="text-2xl opacity-20">📷</span></div>
              <div className="aspect-[4/5] rounded-xl flex items-center justify-center" style={{ background: `${themeColors.primary}10` }}><span className="text-2xl opacity-20">📷</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* 갤러리 */}
      <div className="mx-6 rounded-2xl p-6" style={{ background: themeColors.sectionBg }}>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="aspect-square rounded-xl flex items-center justify-center" style={{ background: `${themeColors.primary}15` }}><span className="text-3xl opacity-20">📷</span></div>
          ))}
        </div>
      </div>

      <div className="h-16" />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: themeColors.background }}>
      {/* 상단 옵션 선택기 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-sm font-bold text-gray-800 mb-2">FAB 개선 방안 비교 테스트</h1>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setActiveOption(opt.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: activeOption === opt.id ? themeColors.primary : '#f3f4f6',
                  color: activeOption === opt.id ? 'white' : '#6b7280',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5">{options.find(o => o.id === activeOption)?.desc}</p>
        </div>
      </div>

      {/* 스크롤 가능 컨텐츠 영역 */}
      {activeOption === 6 ? (
        /* 조합 모드: 인트로 + 메인을 연결 */
        <div id="scroll-container-5" className="pt-[100px] overflow-y-auto" style={{ height: '100dvh' }}>
          {/* 인트로 영역 */}
          <div id="intro-section">
            <IntroContent />
          </div>
          {/* 메인 영역 */}
          <div id="main-section">
            <MainContent />
          </div>
          {/* 인트로/메인 전환 감지 컴포넌트 */}
          <CombinedFabController />
        </div>
      ) : (
        <div id="scroll-container-5" className="pt-[100px] overflow-y-auto" style={{ height: '100dvh' }}>
          <IntroContent />
          <MainContent />
        </div>
      )}

      {/* 기존 개별 방안 렌더링 */}
      {activeOption === 0 && <OptionCurrent />}
      {activeOption === 1 && <Option1_TextLabel />}
      {activeOption === 2 && <Option2_BottomNav />}
      {activeOption === 3 && <Option3_AutoExpand key="opt3" />}
      {activeOption === 4 && <Option4_Enhanced key="opt4" />}
      {activeOption === 5 && <Option5_ScrollResponsive />}
    </div>
  )
}

// 인트로↔메인 전환 감지 + FAB 렌더링
function CombinedFabController() {
  const [isIntro, setIsIntro] = useState(true)

  useEffect(() => {
    const mainSection = document.getElementById('main-section')
    if (!mainSection) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 메인 섹션이 30% 이상 보이면 메인 모드
        setIsIntro(!entry.isIntersecting)
      },
      { threshold: 0.05 }
    )

    observer.observe(mainSection)
    return () => observer.disconnect()
  }, [])

  return <Option6_Combined isIntro={isIntro} />
}
