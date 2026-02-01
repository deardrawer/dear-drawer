'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { templates, Template } from '@/lib/templates'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const touchStartY = useRef(0)

  // URL 설정 모달 상태
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customSlug, setCustomSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [slugError, setSlugError] = useState('')
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

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

  // 템플릿 선택 시 모달 열기
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setCustomSlug('')
    setSlugError('')
    setSlugStatus('idle')
    setSlugSuggestions([])
  }

  // 슬러그 유효성 검사
  const validateSlug = (slug: string) => {
    if (!slug.trim()) return '주소를 입력해주세요'
    if (slug.length < 3) return '3자 이상 입력해주세요'
    if (slug.length > 30) return '30자 이하로 입력해주세요'
    if (!/^[a-z0-9-]+$/.test(slug)) return '영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다'
    if (slug.startsWith('-') || slug.endsWith('-')) return '하이픈으로 시작하거나 끝날 수 없습니다'
    return ''
  }

  // 실시간 중복 검사
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const error = validateSlug(customSlug)
    if (error || !customSlug.trim()) {
      setSlugStatus('idle')
      setSlugSuggestions([])
      return
    }

    setSlugStatus('checking')

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/invitations/check-slug?slug=${customSlug}`)
        if (!res.ok) {
          setSlugStatus('available')
          setSlugSuggestions([])
          setSlugError('')
          return
        }

        const data: { available?: boolean; suggestions?: string[] } = await res.json()
        if (data.available) {
          setSlugStatus('available')
          setSlugSuggestions([])
          setSlugError('')
        } else {
          setSlugStatus('unavailable')
          if (data.suggestions?.length) setSlugSuggestions(data.suggestions)
        }
      } catch {
        setSlugStatus('idle')
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [customSlug])

  // 시작하기 버튼 클릭
  const handleStart = async () => {
    const error = validateSlug(customSlug)
    if (error) {
      setSlugError(error)
      setSlugSuggestions([])
      return
    }

    setIsChecking(true)
    setSlugError('')
    setSlugSuggestions([])

    try {
      const res = await fetch(`/api/invitations/check-slug?slug=${customSlug}`)
      if (!res.ok) {
        if (selectedTemplate === 'narrative-parents') {
          router.push(`/editor/parents?slug=${customSlug}`)
        } else {
          router.push(`/editor?template=${selectedTemplate}&slug=${customSlug}`)
        }
        return
      }

      const data: { available?: boolean; error?: string; suggestions?: string[] } = await res.json()
      if (!data.available) {
        setSlugError(data.error || '이미 사용 중인 주소입니다')
        if (data.suggestions?.length) setSlugSuggestions(data.suggestions)
        setIsChecking(false)
        return
      }

      if (selectedTemplate === 'narrative-parents') {
        router.push(`/editor/parents?slug=${customSlug}`)
      } else {
        router.push(`/editor?template=${selectedTemplate}&slug=${customSlug}`)
      }
    } catch {
      setSlugError('확인 중 오류가 발생했습니다')
      setSlugSuggestions([])
      setIsChecking(false)
    }
  }

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedTemplate(null)
    setCustomSlug('')
    setSlugStatus('idle')
    setSlugError('')
    setSlugSuggestions([])
  }

  // 템플릿별 색상
  const getTemplateColor = () => {
    switch (selectedTemplate) {
      case 'narrative-our': return 'bg-rose-500 hover:bg-rose-600'
      case 'narrative-family': return 'bg-blue-500 hover:bg-blue-600'
      case 'narrative-parents': return 'bg-amber-500 hover:bg-amber-600'
      default: return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getTemplateName = () => {
    switch (selectedTemplate) {
      case 'narrative-our': return 'OUR'
      case 'narrative-family': return 'FAMILY'
      case 'narrative-parents': return 'PARENTS'
      default: return ''
    }
  }

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
                <span className="text-[10px] sm:text-base">💌</span> 읽고 싶어지는 청첩장
              </span>
              <span className="flex items-center gap-0.5 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-[10px] sm:text-base">💕</span> 하객이 감동받는 이야기
              </span>
              <span className="flex items-center gap-0.5 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-[10px] sm:text-base">✨</span> 우리를 더 알게 되는 순간
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

        {/* ===== 섹션 3: 템플릿 선택 ===== */}
        <section className="h-screen flex flex-col items-center justify-center px-3 sm:px-6 py-4 sm:py-10 overflow-hidden bg-gradient-to-br from-rose-50 via-white to-blue-50">
          <div className="w-full max-w-4xl overflow-y-auto overflow-x-hidden max-h-full">
            <div className="text-center mb-3 sm:mb-12">
              <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-3">
                어떤 이야기를 담을까요?
              </h2>
              <p className="text-[10px] sm:text-base text-gray-600">두 분에게 맞는 템플릿을 선택하세요</p>
            </div>

            {/* 템플릿 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6 mb-3 sm:mb-8">
              {/* OUR 카드 */}
              <div className="group relative p-3 sm:p-8 rounded-xl sm:rounded-3xl border border-gray-100 bg-white/90 backdrop-blur-sm shadow-md hover:border-rose-400 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="text-2xl sm:text-5xl mb-1 sm:mb-4">💕</div>
                <h3 className="text-sm sm:text-2xl font-semibold text-gray-900 mb-0.5 sm:mb-2">OUR</h3>
                <p className="text-[10px] sm:text-base text-gray-600 mb-2 sm:mb-6">커플의 서사가 중심이 되는 청첩장</p>
                <div className="space-y-0.5 sm:space-y-2 mb-2 sm:mb-8 text-[9px] sm:text-sm text-gray-500">
                  <p className="flex items-center gap-1 sm:gap-2"><span className="text-rose-400">♥</span> 장기연애를 해온 커플</p>
                  <p className="flex items-center gap-1 sm:gap-2"><span className="text-rose-400">♥</span> 특별한 스토리가 있는 커플</p>
                  <p className="flex items-center gap-1 sm:gap-2"><span className="text-rose-400">♥</span> 우리만의 이야기를 담고 싶은 커플</p>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleTemplateSelect('narrative-our')}
                    className="text-[10px] sm:text-sm text-rose-500 font-medium hover:underline"
                  >
                    시작하기 →
                  </button>
                  <a
                    href="/i/sample-our"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    샘플 보기
                  </a>
                </div>
              </div>

              {/* FAMILY 카드 */}
              <div className="group relative p-3 sm:p-8 rounded-xl sm:rounded-3xl border border-gray-100 bg-white/90 backdrop-blur-sm shadow-md hover:border-blue-400 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                <div className="text-2xl sm:text-5xl mb-1 sm:mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-sm sm:text-2xl font-semibold text-gray-900 mb-0.5 sm:mb-2">FAMILY</h3>
                <p className="text-[10px] sm:text-base text-gray-600 mb-2 sm:mb-6">두 가족의 축복으로 완성되는 청첩장</p>
                <div className="space-y-0.5 sm:space-y-2 mb-2 sm:mb-8 text-[9px] sm:text-sm text-gray-500">
                  <p className="flex items-center gap-1 sm:gap-2"><span className="text-blue-400">♥</span> 양가 부모님의 축하 인사말</p>
                  <p className="flex items-center gap-1 sm:gap-2"><span className="text-blue-400">♥</span> 서로가 선택한 이유 (신랑/신부 소개)</p>
                  <p className="flex items-center gap-1 sm:gap-2"><span className="text-blue-400">♥</span> 커플 인터뷰 & 풀스크린 포토</p>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleTemplateSelect('narrative-family')}
                    className="text-[10px] sm:text-sm text-blue-500 font-medium hover:underline"
                  >
                    시작하기 →
                  </button>
                  <a
                    href="/i/sample-family"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    샘플 보기
                  </a>
                </div>
              </div>
            </div>

            {/* PARENTS 서브 */}
            <div className="text-center">
              <p className="text-[9px] sm:text-xs text-gray-400 mb-1.5 sm:mb-3">부모님용 청첩장도 준비되어 있어요</p>
              <div className="inline-flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-1.5 sm:py-3 rounded-full border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-[10px] sm:text-sm">
                <span className="text-base sm:text-xl">🎎</span>
                <button
                  onClick={() => handleTemplateSelect('narrative-parents')}
                  className="text-gray-700 hover:text-amber-600 transition-colors"
                >
                  PARENTS - 혼주용
                </button>
                <span className="text-gray-300">|</span>
                <a
                  href="/sample/parents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-amber-600 transition-colors"
                >
                  샘플보기
                </a>
              </div>
            </div>
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
                <div className="w-10 h-10 sm:w-20 sm:h-20 bg-white/20 rounded-xl sm:rounded-3xl flex items-center justify-center mx-auto mb-2 sm:mb-6 group-hover:bg-white/30 transition-colors">
                  <span className="text-lg sm:text-4xl">🪄</span>
                </div>
                <h3 className="text-xs sm:text-lg font-bold text-white mb-1 sm:mb-3">스토리 초안 작성</h3>
                <p className="text-[9px] sm:text-base text-white/80 leading-relaxed">
                  질문에 답하면<br />
                  디어드로어가<br />
                  스토리 초안을 작성해 드려요
                </p>
              </div>
              <div className="text-center p-3 sm:p-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-3xl hover:bg-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="w-10 h-10 sm:w-20 sm:h-20 bg-white/20 rounded-xl sm:rounded-3xl flex items-center justify-center mx-auto mb-2 sm:mb-6 group-hover:bg-white/30 transition-colors">
                  <span className="text-lg sm:text-4xl">📖</span>
                </div>
                <h3 className="text-xs sm:text-lg font-bold text-white mb-1 sm:mb-3">인터랙티브 스토리</h3>
                <p className="text-[9px] sm:text-base text-white/80 leading-relaxed">
                  스크롤만 하는 청첩장은 그만<br />
                  클릭할수록 빠져드는<br />
                  이야기형 청첩장
                </p>
              </div>
              <div className="text-center p-3 sm:p-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-3xl hover:bg-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="w-10 h-10 sm:w-20 sm:h-20 bg-white/20 rounded-xl sm:rounded-3xl flex items-center justify-center mx-auto mb-2 sm:mb-6 group-hover:bg-white/30 transition-colors">
                  <span className="text-lg sm:text-4xl">✉️</span>
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
          </div>
        </section>
      </div>

      {/* 커스텀 URL 설정 모달 */}
      <Dialog open={!!selectedTemplate} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>청첩장 주소 설정</DialogTitle>
            <DialogDescription>
              {getTemplateName()} 템플릿으로 시작합니다. 청첩장 주소를 설정해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                청첩장 주소
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  invite.deardrawer.com/i/
                </span>
                <Input
                  value={customSlug}
                  onChange={(e) => {
                    setCustomSlug(e.target.value.toLowerCase())
                    setSlugError('')
                  }}
                  placeholder="my-wedding"
                  className="flex-1"
                />
              </div>
              {/* 실시간 상태 표시 */}
              {slugStatus === 'checking' && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  확인 중...
                </p>
              )}
              {slugStatus === 'available' && !slugError && (
                <p className="text-xs text-green-600 mt-1">✓ 사용할 수 있는 주소입니다</p>
              )}
              {slugStatus === 'unavailable' && !slugError && (
                <p className="text-xs text-red-500 mt-1">✗ 이미 사용 중인 주소입니다</p>
              )}
              {slugError && (
                <p className="text-xs text-red-500 mt-1">{slugError}</p>
              )}
              {slugSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">추천 주소:</p>
                  <div className="flex flex-wrap gap-1">
                    {slugSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setCustomSlug(suggestion)
                          setSlugError('')
                          setSlugSuggestions([])
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                영문 소문자, 숫자, 하이픈(-)만 사용 가능 (3~30자)
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                💙 이 주소는 나중에 변경할 수 없으니 신중하게 설정해주세요.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleStart}
              disabled={isChecking || !customSlug.trim() || slugStatus === 'checking' || slugStatus === 'unavailable'}
              className={`flex-1 text-white ${getTemplateColor()}`}
            >
              {isChecking ? '확인 중...' : '시작하기'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
