'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SocialProofCounter from '@/components/social-proof/SocialProofCounter'
import WeeklyCounter from '@/components/social-proof/WeeklyCounter'

// ============================================
// 🖼️ 배경 이미지 설정 (여기서 쉽게 변경 가능)
// ============================================
const BACKGROUND_IMAGES = {
  hero: '/sample/cover.jpg',           // 섹션 1: 히어로
  philosophy: '/sample/couple2.jpg',   // 섹션 2: 왜 청첩장에 우리의 이야기를...
  features: '/sample/couple3.jpg',     // 섹션 4: 왜 dear drawer인가요?
}

export default function GalleryPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const touchStartY = useRef(0)

  const totalSections = 5

  // 섹션 이동 함수
  const scrollToSection = (index: number) => {
    if (index < 0 || index >= totalSections || isScrolling.current) return

    isScrolling.current = true
    setCurrentSection(index)

    setTimeout(() => {
      isScrolling.current = false
    }, 1000)
  }

  // 모바일에서 섹션 1 이후에는 헤더 숨기기
  useEffect(() => {
    if (currentSection > 0) {
      document.body.classList.add('gallery-scrolled')
    } else {
      document.body.classList.remove('gallery-scrolled')
    }
    return () => {
      document.body.classList.remove('gallery-scrolled')
    }
  }, [currentSection])

  // 휠 이벤트 핸들러
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (isScrolling.current) return

      if (e.deltaY > 0) {
        scrollToSection(currentSection + 1)
      } else {
        scrollToSection(currentSection - 1)
      }
    }

    // 터치 이벤트 핸들러
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling.current) return

      const touchEndY = e.changedTouches[0].clientY
      const diff = touchStartY.current - touchEndY

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          scrollToSection(currentSection + 1)
        } else {
          scrollToSection(currentSection - 1)
        }
      }
    }

    // 키보드 이벤트 핸들러
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        scrollToSection(currentSection + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollToSection(currentSection - 1)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      container.addEventListener('touchstart', handleTouchStart, { passive: true })
      container.addEventListener('touchend', handleTouchEnd, { passive: true })
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
        container.removeEventListener('touchstart', handleTouchStart)
        container.removeEventListener('touchend', handleTouchEnd)
      }
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentSection])

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-hidden bg-white"
    >
      {/* 섹션 인디케이터 - 모바일에서는 작게 */}
      <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 sm:gap-3">
        {Array.from({ length: totalSections }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToSection(i)}
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
              currentSection === i
                ? 'bg-black scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`섹션 ${i + 1}로 이동`}
          />
        ))}
      </div>

      {/* 스크롤 다운 힌트 */}
      {currentSection < totalSections - 1 && (
        <button
          onClick={() => scrollToSection(currentSection + 1)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors animate-bounce"
        >
          <span className="text-xs tracking-wider">SCROLL</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* 섹션 컨테이너 */}
      <div
        className="transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateY(-${currentSection * 100}vh)` }}
      >
        {/* ===== 섹션 1: 히어로 ===== */}
        <section
          className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-10 relative overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACKGROUND_IMAGES.hero})` }}
        >
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black/40" />

          <div className="text-center max-w-3xl relative z-10 px-2">
            <p className="text-[8px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] text-white/80 uppercase mb-4 sm:mb-8 animate-fade-in">
              Story-Driven Wedding Invitation
            </p>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-6 tracking-tight leading-tight drop-shadow-lg">
              Your Story,
              <br />
              <span className="font-bold">Beautifully Told</span>
            </h1>
            <p className="text-xs sm:text-lg text-white/90 mb-6 sm:mb-12">
              세상에 하나뿐인 여러분의 스토리를 담아보세요.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-4 text-[9px] sm:text-sm text-white">
              <span className="flex items-center gap-0.5 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-rose-400/20 rounded-full">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span> 읽고 싶어지는 청첩장
              </span>
              <span className="flex items-center gap-0.5 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-pink-400/20 rounded-full">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span> 하객이 감동받는 이야기
              </span>
              <span className="flex items-center gap-0.5 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-violet-400/20 rounded-full">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-violet-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l1.8 6.2L20 12l-6.2 1.8L12 20l-1.8-6.2L4 12l6.2-1.8z" />
                  </svg>
                </span> 우리를 더 알게 되는 순간
              </span>
            </div>
          </div>
        </section>

        {/* ===== 섹션 2: 브랜드 철학 ===== */}
        <section
          className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-10 relative overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACKGROUND_IMAGES.philosophy})` }}
        >
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="text-center max-w-2xl relative z-10 px-2">
            <h2 className="text-lg sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-10 leading-relaxed drop-shadow-lg">
              왜 청첩장에<br />
              <span className="text-rose-300 font-bold">우리의 이야기</span>를<br />
              담아야 할까요?
            </h2>
            <div className="space-y-4 sm:space-y-8 text-xs sm:text-lg text-white/90 leading-relaxed">
              <p>
                청첩장은 단순히 날짜와 장소를 알리는 것이 아닙니다.
              </p>
              <p>
                <span className="text-white">우리가 어떻게 만났는지,</span><br />
                <span className="text-white">왜 서로를 선택했는지,</span><br />
                <span className="text-white">어떤 여정을 함께 해왔는지.</span>
              </p>
              <p>
                이 이야기를 담은 청첩장은<br />
                받는 분들이 두 사람을 더 깊이 이해하고,<br />
                <span className="text-white font-bold">진심으로 축하하게 만듭니다.</span>
              </p>
            </div>
          </div>
        </section>

        {/* ===== 섹션 3: 템플릿 쇼케이스 ===== */}
        <section className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-10 overflow-hidden bg-gradient-to-br from-rose-50 via-white to-blue-50">
          <div className="w-full max-w-4xl">

            <div className="text-center mb-4 sm:mb-10">
              <p className="text-[9px] sm:text-xs tracking-widest text-gray-400 uppercase mb-2 sm:mb-3">7 Templates</p>
              <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-3">
                다양한 스타일, 하나의 이야기
              </h2>
              <p className="text-[10px] sm:text-sm text-gray-500">우리에게 맞는 청첩장을 골라보세요</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 max-w-2xl mx-auto mb-4 sm:mb-8">
              <div className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-1.5 sm:mb-3">
                  <div className="absolute -inset-1 bg-rose-200 rounded-full opacity-[0.12] blur-[10px]" />
                  <div className="relative w-full h-full bg-rose-50/80 border border-rose-100/60 rounded-full flex items-center justify-center">
                    <svg className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="rgba(253,164,175,0.15)" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">스토리형</h3>
                <p className="text-[10px] sm:text-sm text-gray-500 leading-relaxed">우리의 이야기를 깊이 있게</p>
                <p className="text-[9px] sm:text-xs text-gray-400 mt-1">OUR · FAMILY</p>
              </div>
              <div className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-1.5 sm:mb-3">
                  <div className="absolute -inset-1 bg-violet-200 rounded-full opacity-[0.12] blur-[10px]" />
                  <div className="relative w-full h-full bg-violet-50/80 border border-violet-100/60 rounded-full flex items-center justify-center">
                    <svg className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="9" rx="1.5" fill="rgba(196,181,253,0.15)" />
                      <rect x="14" y="3" width="7" height="5" rx="1.5" />
                      <rect x="3" y="15" width="7" height="6" rx="1.5" />
                      <rect x="14" y="11" width="7" height="10" rx="1.5" fill="rgba(196,181,253,0.1)" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">미니 스토리형</h3>
                <p className="text-[10px] sm:text-sm text-gray-500 leading-relaxed">감각적 디자인에 간결하게</p>
                <p className="text-[9px] sm:text-xs text-gray-400 mt-1">MAGAZINE · MOVIE · RECORD · FEED</p>
              </div>
              <div className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-1.5 sm:mb-3">
                  <div className="absolute -inset-1 bg-sky-200 rounded-full opacity-[0.12] blur-[10px]" />
                  <div className="relative w-full h-full bg-sky-50/80 border border-sky-100/60 rounded-full flex items-center justify-center">
                    <svg className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="7" r="4" />
                      <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" fill="rgba(125,211,252,0.15)" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1">혼주용</h3>
                <p className="text-[10px] sm:text-sm text-gray-500 leading-relaxed">부모님이 보내는 격식 있는</p>
                <p className="text-[9px] sm:text-xs text-gray-400 mt-1">PARENTS</p>
              </div>
            </div>

            <SocialProofCounter />

          </div>
        </section>

        {/* ===== 섹션 4: 왜 dear drawer? ===== */}
        <section
          className="h-screen flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-10 relative overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACKGROUND_IMAGES.features})` }}
        >
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="w-full max-w-4xl relative z-10">
            <div className="text-center mb-4 sm:mb-16">
              <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-3 drop-shadow-lg">
                왜 dear drawer인가요?
              </h2>
              <p className="text-[10px] sm:text-base text-white/90">우리만의 이야기를 담을 수 있는 청첩장</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-8">
              <div className="text-center p-3 sm:p-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-3xl hover:bg-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="relative w-10 h-10 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-6">
                  <div className="absolute -inset-1 bg-rose-400 rounded-full opacity-[0.1] blur-[8px]" />
                  <div className="relative w-full h-full bg-white/10 border border-rose-300/15 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-8 sm:h-8 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="rgba(253,164,175,0.08)" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xs sm:text-lg font-bold text-white mb-1 sm:mb-3">스토리 초안 작성</h3>
                <p className="text-[9px] sm:text-base text-white/80 leading-relaxed">
                  질문에 답하면<br />
                  디어드로어가<br />
                  스토리 초안을 작성해 드려요
                </p>
              </div>
              <div className="text-center p-3 sm:p-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-3xl hover:bg-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="relative w-10 h-10 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-6">
                  <div className="absolute -inset-1 bg-violet-400 rounded-full opacity-[0.1] blur-[8px]" />
                  <div className="relative w-full h-full bg-white/10 border border-violet-300/15 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-8 sm:h-8 text-violet-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7" fill="rgba(196,181,253,0.08)" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xs sm:text-lg font-bold text-white mb-1 sm:mb-3">인터랙티브 스토리</h3>
                <p className="text-[9px] sm:text-base text-white/80 leading-relaxed">
                  스크롤만 하는 청첩장은 그만<br />
                  클릭할수록 빠져드는<br />
                  이야기형 청첩장
                </p>
              </div>
              <div className="text-center p-3 sm:p-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-3xl hover:bg-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="relative w-10 h-10 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-6">
                  <div className="absolute -inset-1 bg-sky-400 rounded-full opacity-[0.1] blur-[8px]" />
                  <div className="relative w-full h-full bg-white/10 border border-sky-300/15 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-8 sm:h-8 text-sky-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" fill="rgba(125,211,252,0.08)" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xs sm:text-lg font-bold text-white mb-1 sm:mb-3">하객 맞춤 개인화</h3>
                <p className="text-[9px] sm:text-base text-white/80 leading-relaxed">
                  하객별 개인화 링크로<br />
                  "OO님, 초대합니다"<br />
                  특별한 환영 메시지
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 섹션 5: CTA ===== */}
        <section className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-10 overflow-hidden bg-black text-white">
          <div className="text-center max-w-2xl">
            <h2 className="text-xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-6 leading-tight">
              지금 바로<br />
              <span className="font-bold">시작해보세요</span>
            </h2>
            <p className="text-xs sm:text-lg text-gray-400 mb-6 sm:mb-12">
              세상에 하나뿐인 우리의 이야기를 담은 청첩장
            </p>
            <Link
              href="/templates"
              className="px-5 sm:px-10 py-2 sm:py-4 text-xs sm:text-base bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-all hover:scale-105"
            >
              청첩장 만들기
            </Link>
            <WeeklyCounter />
          </div>
        </section>
      </div>
    </div>
  )
}
