'use client'

import { useState, useEffect, useRef, RefObject } from 'react'
import Link from 'next/link'
import { templates, Template } from '@/lib/templates'

// 스크롤 애니메이션 훅
function useScrollAnimation<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return [ref, isVisible]
}

// 템플릿 분류
const coupleTemplates = templates.filter(t => t.narrativeType === 'our' || t.narrativeType === 'family')
const parentsTemplate = templates.find(t => t.narrativeType === 'parents')!

// 색상 테마 정의 (에디터와 동일)
const colorThemes = [
  { id: 'classic-rose', name: 'Classic Rose', colors: ['#E91E63', '#D4A574'] },
  { id: 'modern-black', name: 'Modern Black', colors: ['#1A1A1A', '#888888'] },
  { id: 'romantic-blush', name: 'Romantic Blush', colors: ['#D4A5A5', '#C9B8A8'] },
  { id: 'nature-green', name: 'Nature Green', colors: ['#6B8E6B', '#A8B5A0'] },
  { id: 'luxury-navy', name: 'Luxury Navy', colors: ['#1E3A5F', '#C9A96E'] },
  { id: 'sunset-coral', name: 'Sunset Coral', colors: ['#E8846B', '#F5C7A9'] },
]

// 폰트 스타일 정의
const fontStyles = [
  { id: 'classic', name: 'Classic Elegance', desc: 'Playfair Display + 나눔명조' },
  { id: 'modern', name: 'Modern Minimal', desc: 'Montserrat + Noto Sans KR' },
  { id: 'romantic', name: 'Romantic', desc: 'Lora + 고운바탕' },
  { id: 'contemporary', name: 'Contemporary', desc: 'Cinzel + 고운돋움' },
  { id: 'luxury', name: 'Premium Luxury', desc: 'EB Garamond + 나눔명조' },
]

// PARENTS 템플릿용 색상 테마
const parentsColorThemes = [
  { id: 'burgundy', name: '버건디', colors: ['#722F37', '#C9A962'] },
  { id: 'navy', name: '네이비', colors: ['#1E3A5F', '#C9A96E'] },
  { id: 'sage', name: '세이지', colors: ['#7D8471', '#D4C5A9'] },
  { id: 'dustyRose', name: '더스티로즈', colors: ['#C4A4A4', '#E8D5D5'] },
  { id: 'emerald', name: '에메랄드', colors: ['#2D5A4A', '#B8C9A9'] },
  { id: 'slateBlue', name: '슬레이트블루', colors: ['#6B7B8C', '#D1D5DB'] },
]

// PARENTS 템플릿용 폰트 스타일 (실제 지원되는 스타일)
const parentsFontStyles = [
  { id: 'elegant', name: '정갈한 명조', desc: '나눔명조' },
  { id: 'soft', name: '부드러운 바탕', desc: '고운바탕' },
  { id: 'classic', name: '고전 세리프', desc: '함렛 (Hahmlet)' },
  { id: 'brush', name: '전통 붓글씨', desc: '송명 (Song Myung)' },
  { id: 'modern', name: '모던 고딕', desc: 'IBM Plex Sans KR' },
  { id: 'friendly', name: '친근한 고딕', desc: '나눔고딕' },
]

export default function GalleryPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0])
  const [selectedColor, setSelectedColor] = useState(colorThemes[0])
  const [selectedFont, setSelectedFont] = useState(fontStyles[2]) // romantic as default
  const [selectedParentsColor, setSelectedParentsColor] = useState(parentsColorThemes[0])
  const [selectedParentsFont, setSelectedParentsFont] = useState(parentsFontStyles[0])
  const [iframeKey, setIframeKey] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isFontExpanded, setIsFontExpanded] = useState(true)  // 기본으로 펼침
  const [isColorExpanded, setIsColorExpanded] = useState(true)  // 기본으로 펼침

  // 스크롤 애니메이션 refs
  const [section1Ref, section1Visible] = useScrollAnimation<HTMLElement>()
  const [section2Ref, section2Visible] = useScrollAnimation<HTMLElement>()
  const [section3Ref, section3Visible] = useScrollAnimation<HTMLElement>()
  const [section4Ref, section4Visible] = useScrollAnimation<HTMLElement>()

  // 애니메이션 클래스
  const animationClass = (isVisible: boolean) =>
    `transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`

  // 순차적 애니메이션 클래스 (딜레이 포함)
  const staggeredClass = (isVisible: boolean, index: number) =>
    `transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`

  const staggeredStyle = (isVisible: boolean, index: number) => ({
    transitionDelay: isVisible ? `${index * 150}ms` : '0ms'
  })

  // 템플릿에 따른 샘플 URL (컬러 테마, 폰트 파라미터 포함)
  // 스타일 변경 시에는 skipIntro=true로 인트로 스킵
  const skipIntroParam = hasInteracted ? '&skipIntro=true' : ''
  const getSampleUrl = () => {
    if (selectedTemplate.narrativeType === 'our') {
      return `/i/sample-our?preview=true&colorTheme=${selectedColor.id}&fontStyle=${selectedFont.id}${skipIntroParam}`
    } else if (selectedTemplate.narrativeType === 'family') {
      return `/i/sample-family?preview=true&colorTheme=${selectedColor.id}&fontStyle=${selectedFont.id}${skipIntroParam}`
    } else {
      return `/sample/parents?preview=true&colorTheme=${selectedParentsColor.id}&fontStyle=${selectedParentsFont.id}${skipIntroParam}`
    }
  }
  const sampleUrl = getSampleUrl()

  // 컬러/폰트 변경 핸들러 (인트로 스킵 활성화)
  const handleColorChange = (theme: typeof colorThemes[0]) => {
    setHasInteracted(true)
    setSelectedColor(theme)
  }

  const handleFontChange = (font: typeof fontStyles[0]) => {
    setHasInteracted(true)
    setSelectedFont(font)
  }

  const handleParentsColorChange = (theme: typeof parentsColorThemes[0]) => {
    setHasInteracted(true)
    setSelectedParentsColor(theme)
  }

  const handleParentsFontChange = (font: typeof parentsFontStyles[0]) => {
    setHasInteracted(true)
    setSelectedParentsFont(font)
  }

  // iframe 새로고침 (인트로부터 다시 보기)
  const refreshPreview = () => {
    setHasInteracted(false)
    setIframeKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== 섹션 0: 히어로 ===== */}
      <section className="py-20 md:py-24 px-6 text-center bg-gradient-to-b from-white via-white to-gray-50/50">
        <p className="text-[10px] tracking-[0.3em] text-gray-700 uppercase mb-6">
          AI-Powered Wedding Invitation
        </p>
        <h1 className="text-xl sm:text-2xl md:text-5xl font-medium text-black mb-4 md:mb-6 tracking-wide">
          Your Story,
          <br />
          <span className="font-semibold">Beautifully Told</span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-800 max-w-lg mx-auto mb-8 font-light leading-relaxed px-4 md:px-0">
          간단한 질문에 답하면
          <br />
          AI가 두 분만의 이야기를 담은 청첩장을 만들어 드립니다.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-gray-600 tracking-wider mb-8">
          <span className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
            <span className="text-green-500">✓</span>
            무료로 시작
          </span>
          <span className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
            <span>⏱</span>
            15분이면 완성
          </span>
          <span className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
            <span>✨</span>
            AI 스토리 생성
          </span>
        </div>
        <Link
          href="#templates"
          className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105 shadow-lg"
        >
          템플릿 선택하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Link>
      </section>

      {/* ===== 섹션 1: 템플릿 선택 (3개 카드) ===== */}
      <section
        ref={section1Ref}
        id="templates"
        className={`py-16 px-4 md:px-6 bg-white border-y border-gray-100 scroll-mt-4 ${animationClass(section1Visible)}`}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-gray-900 mb-2">
              어떤 청첩장을 만들까요?
            </h2>
            <p className="text-sm text-gray-500">원하는 템플릿을 선택하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 justify-items-center">
            {/* OUR, FAMILY 카드 */}
            {coupleTemplates.map((template, index) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template)
                  document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`relative w-full max-w-sm p-6 rounded-2xl border-2 text-left group ${staggeredClass(section1Visible, index)} ${
                  selectedTemplate.id === template.id
                    ? 'border-black bg-gray-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-400 hover:shadow-xl hover:scale-[1.02] bg-white'
                }`}
                style={staggeredStyle(section1Visible, index)}
              >
                {selectedTemplate.id === template.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="text-3xl mb-3">{template.emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{template.description}</p>
              </button>
            ))}

            {/* PARENTS 카드 */}
            <button
              onClick={() => {
                setSelectedTemplate(parentsTemplate)
                document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={`relative w-full max-w-sm p-6 rounded-2xl border-2 text-left group ${staggeredClass(section1Visible, 2)} ${
                selectedTemplate.id === parentsTemplate.id
                  ? 'border-black bg-gray-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-xl hover:scale-[1.02] bg-white'
              }`}
              style={staggeredStyle(section1Visible, 2)}
            >
              {selectedTemplate.id === parentsTemplate.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="absolute top-4 left-4 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">NEW</span>
              <div className="text-3xl mb-3 mt-4">{parentsTemplate.emoji}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{parentsTemplate.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{parentsTemplate.description}</p>
            </button>
          </div>
        </div>
      </section>

      {/* ===== 섹션 2: 프리뷰 + 스타일 옵션 ===== */}
      <section
        ref={section2Ref}
        id="preview"
        className={`py-12 px-4 md:px-6 scroll-mt-4 ${animationClass(section2Visible)}`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* 왼쪽: 프리뷰 */}
            <div className="flex justify-center lg:sticky lg:top-8 lg:self-start">
              <div className="relative">
                <div className="w-[340px] md:w-[380px] bg-black rounded-[3rem] p-3 shadow-2xl">
                  <div className="rounded-[2.5rem] overflow-hidden bg-white" style={{ height: '700px' }}>
                    <iframe
                      key={`${selectedTemplate.narrativeType}-${iframeKey}`}
                      src={sampleUrl}
                      className="w-full h-full border-0"
                      title="Wedding Invitation Preview"
                    />
                  </div>
                </div>
                <button
                  onClick={refreshPreview}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white rounded-full shadow-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  새로고침
                </button>
              </div>
            </div>

            {/* 오른쪽: 스타일 옵션 + CTA */}
            <div className="space-y-6">
              {/* 선택된 템플릿 표시 */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{selectedTemplate.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedTemplate.name} 템플릿</h3>
                    <p className="text-xs text-gray-500">선택됨</p>
                  </div>
                </div>
                <ul className="grid grid-cols-2 gap-2">
                  {selectedTemplate.narrativeType === 'our' ? (
                    <>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 커플 서사 중심</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 시네마틱 인트로</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 러브스토리 타임라인</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> AI 스토리 생성</li>
                    </>
                  ) : selectedTemplate.narrativeType === 'family' ? (
                    <>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 가족 서사 중심</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 시네마틱 인트로</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 부모님 소개</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> AI 스토리 생성</li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 혼주 시점</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 봉투 오프닝</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 개인화 인사말</li>
                      <li className="flex items-center gap-2 text-xs text-gray-600"><span className="text-green-500">✓</span> 성장 타임라인</li>
                    </>
                  )}
                </ul>
              </div>

              {/* 컬러/폰트 - OUR, FAMILY */}
              {selectedTemplate.narrativeType !== 'parents' && (
                <>
                  {/* 컬러 테마 */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">컬러 테마</h3>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">에디터에서 수정가능</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {colorThemes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => handleColorChange(theme)}
                          className={`p-2.5 rounded-xl border-2 transition-all ${
                            selectedColor.id === theme.id ? 'border-black' : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex gap-1 mb-1.5 justify-center">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors[0] }} />
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors[1] }} />
                          </div>
                          <p className="text-[10px] text-gray-600 truncate">{theme.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 폰트 스타일 */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">폰트 스타일</h3>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">에디터에서 수정가능</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {fontStyles.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => handleFontChange(font)}
                          className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                            selectedFont.id === font.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {selectedFont.id === font.id && (
                            <div className="absolute top-3 right-3 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <p className="font-medium text-gray-900 text-sm">{font.name}</p>
                          <p className="text-xs text-gray-500">{font.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 컬러/폰트 - PARENTS */}
              {selectedTemplate.narrativeType === 'parents' && (
                <>
                  {/* 컬러 테마 */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">봉투 컬러</h3>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">에디터에서 수정가능</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {parentsColorThemes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => handleParentsColorChange(theme)}
                          className={`p-2.5 rounded-xl border-2 transition-all ${
                            selectedParentsColor.id === theme.id ? 'border-black' : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex gap-1 mb-1.5 justify-center">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors[0] }} />
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors[1] }} />
                          </div>
                          <p className="text-[10px] text-gray-600 truncate">{theme.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 폰트 스타일 */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">폰트 스타일</h3>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">에디터에서 수정가능</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {parentsFontStyles.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => handleParentsFontChange(font)}
                          className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                            selectedParentsFont.id === font.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {selectedParentsFont.id === font.id && (
                            <div className="absolute top-3 right-3 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <p className="font-medium text-gray-900 text-sm">{font.name}</p>
                          <p className="text-xs text-gray-500">{font.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* CTA 버튼 */}
              <Link
                href={selectedTemplate.narrativeType === 'parents' ? '/editor/parents' : `/editor?template=${selectedTemplate.id}`}
                className={`block w-full py-4 text-white text-center rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] ${
                  selectedTemplate.narrativeType === 'parents' ? 'bg-[#722F37] hover:bg-[#5a252c]' : 'bg-black hover:bg-gray-800'
                }`}
              >
                이 템플릿으로 시작하기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 섹션 3: 왜 dear drawer? ===== */}
      <section
        ref={section3Ref}
        className={`py-16 px-6 bg-white border-t border-gray-100 ${animationClass(section3Visible)}`}
      >
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-center text-gray-900 mb-3">
            왜 dear drawer인가요?
          </h2>
          <p className="text-sm text-gray-500 text-center mb-10">
            AI가 만드는 세상에서 하나뿐인 청첩장
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`text-center p-6 rounded-2xl hover:bg-gray-50 hover:shadow-md group ${staggeredClass(section3Visible, 0)}`}
              style={staggeredStyle(section3Visible, 0)}
            >
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">AI 스토리 생성</h3>
              <p className="text-sm text-gray-500">질문에 답하면 AI가 두 분만의<br />특별한 이야기를 만들어 드려요</p>
            </div>
            <div
              className={`text-center p-6 rounded-2xl hover:bg-gray-50 hover:shadow-md group ${staggeredClass(section3Visible, 1)}`}
              style={staggeredStyle(section3Visible, 1)}
            >
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">완벽한 커스터마이징</h3>
              <p className="text-sm text-gray-500">색상, 폰트, 레이아웃까지<br />원하는 대로 수정 가능해요</p>
            </div>
            <div
              className={`text-center p-6 rounded-2xl hover:bg-gray-50 hover:shadow-md group ${staggeredClass(section3Visible, 2)}`}
              style={staggeredStyle(section3Visible, 2)}
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">모바일 최적화</h3>
              <p className="text-sm text-gray-500">카카오톡으로 바로 공유하고<br />모바일에서 완벽하게 보여요</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 섹션 4: 샘플 청첩장 ===== */}
      <section
        ref={section4Ref}
        className={`py-16 px-6 bg-gray-50 border-t border-gray-100 ${animationClass(section4Visible)}`}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-3">
            샘플 청첩장 직접 보기
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            실제 청첩장이 어떻게 보이는지 확인해보세요
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Link
              href="/i/sample-our"
              target="_blank"
              className={`flex items-center justify-center gap-2 px-6 py-4 bg-white rounded-2xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-black hover:text-black hover:shadow-lg group ${staggeredClass(section4Visible, 0)}`}
              style={staggeredStyle(section4Visible, 0)}
            >
              <span className="text-lg">💕</span>
              OUR
              <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <Link
              href="/i/sample-family"
              target="_blank"
              className={`flex items-center justify-center gap-2 px-6 py-4 bg-white rounded-2xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-black hover:text-black hover:shadow-lg group ${staggeredClass(section4Visible, 1)}`}
              style={staggeredStyle(section4Visible, 1)}
            >
              <span className="text-lg">👨‍👩‍👧‍👦</span>
              FAMILY
              <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <Link
              href="/sample/parents"
              target="_blank"
              className={`flex items-center justify-center gap-2 px-6 py-4 bg-white rounded-2xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-black hover:text-black hover:shadow-lg group ${staggeredClass(section4Visible, 2)}`}
              style={staggeredStyle(section4Visible, 2)}
            >
              <span className="text-lg">🎎</span>
              PARENTS
              <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
