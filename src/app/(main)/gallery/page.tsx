'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { templates, Template } from '@/lib/templates'

// ============================================
// 🖼️ 배경 이미지 설정 (여기서 쉽게 변경 가능)
// ============================================
const BACKGROUND_IMAGES = {
  hero: '/sample/cover.jpg',           // 섹션 1: 히어로
  philosophy: '/sample/couple2.jpg',   // 섹션 2: 왜 청첩장에 우리의 이야기를...
  features: '/sample/couple3.jpg',     // 섹션 4: 왜 dear drawer인가요?
}

// 템플릿 분류
const coupleTemplates = templates.filter(t => t.narrativeType === 'our' || t.narrativeType === 'family')
const parentsTemplate = templates.find(t => t.narrativeType === 'parents')!

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
      {/* 섹션 인디케이터 */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {Array.from({ length: totalSections }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToSection(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
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
          className="h-screen flex flex-col items-center justify-center px-6 pb-20 relative bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACKGROUND_IMAGES.hero})` }}
        >
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black/40" />

          <div className="text-center max-w-3xl relative z-10">
            <p className="text-[10px] tracking-[0.4em] text-white/80 uppercase mb-8 animate-fade-in">
              Story-Driven Wedding Invitation
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
              Your Story,
              <br />
              <span className="font-bold">Beautifully Told</span>
            </h1>
            <p className="text-base sm:text-lg text-white/90 mb-12">
              세상에 하나뿐인 여러분의 스토리를 담아보세요.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white">
              <span className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span>💌</span> 읽고 싶어지는 청첩장
              </span>
              <span className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span>💕</span> 하객이 감동받는 이야기
              </span>
              <span className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span>✨</span> 우리를 더 알게 되는 순간
              </span>
            </div>
          </div>
        </section>

        {/* ===== 섹션 2: 브랜드 철학 ===== */}
        <section
          className="h-screen flex flex-col items-center justify-center px-6 pb-20 relative bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACKGROUND_IMAGES.philosophy})` }}
        >
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="text-center max-w-2xl relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-10 leading-relaxed drop-shadow-lg">
              왜 청첩장에<br />
              <span className="text-rose-300 font-bold">우리의 이야기</span>를<br />
              담아야 할까요?
            </h2>
            <div className="space-y-8 text-base sm:text-lg text-white/90 leading-relaxed">
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

        {/* ===== 섹션 3: 템플릿 선택 ===== */}
        <section className="h-screen flex flex-col items-center justify-center px-6 pb-20 bg-gradient-to-br from-rose-50 via-white to-blue-50">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                어떤 이야기를 담을까요?
              </h2>
              <p className="text-gray-600">두 분에게 맞는 템플릿을 선택하세요</p>
            </div>

            {/* 템플릿 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* OUR 카드 */}
              <div className="group relative p-8 rounded-3xl border-2 border-gray-100 bg-white/90 backdrop-blur-sm shadow-lg hover:border-rose-400 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="text-5xl mb-4">💕</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">OUR</h3>
                <p className="text-gray-600 mb-6">커플의 서사가 중심이 되는 청첩장</p>
                <div className="space-y-2 mb-8 text-sm text-gray-500">
                  <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 장기연애를 해온 커플</p>
                  <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 특별한 스토리가 있는 커플</p>
                  <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 우리만의 이야기를 담고 싶은 커플</p>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    href="/editor?template=narrative-our"
                    className="text-sm text-rose-500 font-medium hover:underline"
                  >
                    시작하기 →
                  </Link>
                  <a
                    href="/i/sample-our"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    샘플 보기
                  </a>
                </div>
              </div>

              {/* FAMILY 카드 */}
              <div className="group relative p-8 rounded-3xl border-2 border-gray-100 bg-white/90 backdrop-blur-sm shadow-lg hover:border-blue-400 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">FAMILY</h3>
                <p className="text-gray-600 mb-6">가족의 이야기로 하나가 되는 청첩장</p>
                <div className="space-y-2 mb-8 text-sm text-gray-500">
                  <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 두 가정이 하나 됨을 표현하고 싶은 커플</p>
                  <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 부모님의 이야기와 함께 전하고 싶은 커플</p>
                  <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 가족의 의미를 담고 싶은 커플</p>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    href="/editor?template=narrative-family"
                    className="text-sm text-blue-500 font-medium hover:underline"
                  >
                    시작하기 →
                  </Link>
                  <a
                    href="/i/sample-family"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    샘플 보기
                  </a>
                </div>
              </div>
            </div>

            {/* PARENTS 서브 */}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-3">부모님용 청첩장도 준비되어 있어요</p>
              <Link
                href="/editor/parents"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-sm"
              >
                <span className="text-xl">🎎</span>
                <span className="text-gray-700">PARENTS - 혼주용 청첩장</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== 섹션 4: 왜 dear drawer? ===== */}
        <section
          className="h-screen flex flex-col items-center justify-center px-6 pb-20 relative bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BACKGROUND_IMAGES.features})` }}
        >
          {/* 어두운 오버레이 */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="w-full max-w-4xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow-lg">
                왜 dear drawer인가요?
              </h2>
              <p className="text-white/90">우리만의 이야기를 담을 수 있는 청첩장</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-3xl">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🪄</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">스토리 초안 작성</h3>
                <p className="text-white/80 leading-relaxed">
                  질문에 답하면<br />
                  디어드로어가<br />
                  스토리 초안을 작성해 드려요
                </p>
              </div>
              <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-3xl">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📖</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">인터랙티브 스토리</h3>
                <p className="text-white/80 leading-relaxed">
                  스크롤만 하는 청첩장은 그만<br />
                  클릭할수록 빠져드는<br />
                  이야기형 청첩장
                </p>
              </div>
              <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-3xl">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✉️</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">하객 맞춤 개인화</h3>
                <p className="text-white/80 leading-relaxed">
                  하객별 개인화 링크로<br />
                  "OO님, 초대합니다"<br />
                  특별한 환영 메시지
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 섹션 5: CTA ===== */}
        <section className="h-screen flex flex-col items-center justify-center px-6 pb-20 bg-black text-white">
          <div className="text-center max-w-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
              지금 바로<br />
              <span className="font-bold">시작해보세요</span>
            </h2>
            <p className="text-lg text-gray-400 mb-12">
              세상에 하나뿐인 우리의 이야기를 담은 청첩장
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/editor?template=narrative-our"
                className="px-10 py-4 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-all hover:scale-105"
              >
                청첩장 만들기
              </Link>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Link href="/i/sample-our" target="_blank" className="hover:text-white transition-colors">
                  OUR 샘플
                </Link>
                <span>·</span>
                <Link href="/i/sample-family" target="_blank" className="hover:text-white transition-colors">
                  FAMILY 샘플
                </Link>
                <span>·</span>
                <Link href="/sample/parents" target="_blank" className="hover:text-white transition-colors">
                  PARENTS 샘플
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
