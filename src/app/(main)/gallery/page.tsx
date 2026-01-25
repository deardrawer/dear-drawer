'use client'

import { useState } from 'react'
import Link from 'next/link'
import { templates, Template } from '@/lib/templates'

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

export default function GalleryPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0])
  const [selectedColor, setSelectedColor] = useState(colorThemes[0])
  const [selectedFont, setSelectedFont] = useState(fontStyles[2]) // romantic as default
  const [iframeKey, setIframeKey] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isFontExpanded, setIsFontExpanded] = useState(false)
  const [isColorExpanded, setIsColorExpanded] = useState(false)

  // 템플릿에 따른 샘플 URL (컬러 테마, 폰트 파라미터 포함)
  // 스타일 변경 시에는 skipIntro=true로 인트로 스킵
  const skipIntroParam = hasInteracted ? '&skipIntro=true' : ''
  const getSampleUrl = () => {
    if (selectedTemplate.narrativeType === 'our') {
      return `/i/sample-our?preview=true&colorTheme=${selectedColor.id}&fontStyle=${selectedFont.id}${skipIntroParam}`
    } else if (selectedTemplate.narrativeType === 'family') {
      return `/i/sample-family?preview=true&colorTheme=${selectedColor.id}&fontStyle=${selectedFont.id}${skipIntroParam}`
    } else {
      return `/sample/parents?preview=true${skipIntroParam}`
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

  // iframe 새로고침 (인트로부터 다시 보기)
  const refreshPreview = () => {
    setHasInteracted(false)
    setIframeKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-24 px-6 text-center border-b border-gray-100 bg-white">
        <p className="text-[10px] tracking-[0.3em] text-gray-700 uppercase mb-6">
          AI-Powered Wedding Invitation
        </p>
        <h1 className="text-4xl md:text-5xl font-medium text-black mb-6 tracking-wide">
          Your Story,
          <br />
          <span className="font-semibold">Beautifully Told</span>
        </h1>
        <p className="text-base text-gray-800 max-w-lg mx-auto mb-10 font-light leading-relaxed">
          간단한 질문에 답하면 AI가 두 분만의 이야기를 담은
          <br />
          청첩장을 만들어 드립니다.
        </p>
        <div className="flex items-center justify-center gap-8 text-xs text-gray-700 tracking-wider">
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            Free to Start
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            15 Min Setup
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            AI Generated
          </span>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Left: Mobile Preview with iframe */}
            <div className="flex justify-center lg:sticky lg:top-8 lg:self-start">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-[320px] md:w-[360px] bg-black rounded-[3rem] p-3 shadow-2xl">
                  <div className="rounded-[2.5rem] overflow-hidden bg-white" style={{ height: '680px' }}>
                    {/* Notch */}
                    <div className="h-7 bg-black flex items-center justify-center">
                      <div className="w-20 h-5 bg-black rounded-b-2xl" />
                    </div>

                    {/* iframe Preview */}
                    <div className="h-[calc(100%-28px)] relative">
                      <iframe
                        key={`${selectedTemplate.narrativeType}-${iframeKey}`}
                        src={sampleUrl}
                        className="w-full h-full border-0"
                        title="Wedding Invitation Preview"
                      />
                    </div>
                  </div>
                </div>

                {/* Refresh Button */}
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

            {/* Right: Template Selection & Options */}
            <div className="space-y-8">
              {/* Template Selection - 신랑신부용 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💍</span>
                  <h2 className="text-lg font-medium text-gray-900">신랑신부가 직접 만드는 청첩장</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {coupleTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`relative p-5 rounded-2xl border-2 transition-all text-left ${
                        selectedTemplate.id === template.id
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {selectedTemplate.id === template.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="text-2xl mb-2">{template.emoji}</div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selection - 혼주용 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💌</span>
                  <h2 className="text-lg font-medium text-gray-900">혼주가 보내는 청첩장</h2>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">NEW</span>
                </div>
                <button
                  onClick={() => setSelectedTemplate(parentsTemplate)}
                  className={`relative w-full p-5 rounded-2xl border-2 transition-all text-left ${
                    selectedTemplate.id === parentsTemplate.id
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {selectedTemplate.id === parentsTemplate.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{parentsTemplate.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{parentsTemplate.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{parentsTemplate.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {parentsTemplate.features.map((feature) => (
                          <span key={feature} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Color Theme Selection - 혼주용이 아닐 때만 표시 */}
              {selectedTemplate.narrativeType !== 'parents' && (
                <div>
                  <button
                    onClick={() => setIsColorExpanded(!isColorExpanded)}
                    className="w-full flex items-center justify-between mb-4"
                  >
                    <h2 className="text-lg font-medium text-gray-900">컬러 테마</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="w-5 h-5 rounded-full border border-gray-200"
                          style={{ backgroundColor: selectedColor.colors[0] }}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-gray-200"
                          style={{ backgroundColor: selectedColor.colors[1] }}
                        />
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isColorExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isColorExpanded && (
                    <div className="grid grid-cols-3 gap-3">
                      {colorThemes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => handleColorChange(theme)}
                          className={`relative p-3 rounded-xl border-2 transition-all ${
                            selectedColor.id === theme.id
                              ? 'border-black'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex gap-1 mb-2 justify-center">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: theme.colors[0] }}
                            />
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: theme.colors[1] }}
                            />
                          </div>
                          <p className="text-xs font-medium text-gray-700 truncate">{theme.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Font Style Selection - 혼주용이 아닐 때만 표시 */}
              {selectedTemplate.narrativeType !== 'parents' && (
                <div>
                  <button
                    onClick={() => setIsFontExpanded(!isFontExpanded)}
                    className="w-full flex items-center justify-between mb-4"
                  >
                    <h2 className="text-lg font-medium text-gray-900">폰트 스타일</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{selectedFont.name}</span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isFontExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isFontExpanded && (
                    <div className="grid grid-cols-1 gap-2">
                      {fontStyles.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => handleFontChange(font)}
                          className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                            selectedFont.id === font.id
                              ? 'border-black bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
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
                          <p className="text-xs text-gray-500 mt-0.5">{font.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Template Features */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedTemplate.name} 템플릿 특징
                </h2>
                <ul className="space-y-3">
                  {selectedTemplate.narrativeType === 'our' ? (
                    <>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span><strong>커플 서사 중심</strong> - 두 사람의 만남과 사랑 이야기</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>시네마틱 인트로 애니메이션</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>커플 프로필 & 인터뷰 섹션</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>우리의 이야기 (러브스토리) 타임라인</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>AI가 자동으로 스토리 생성</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>6가지 컬러 & 5가지 폰트 테마</span>
                      </li>
                    </>
                  ) : selectedTemplate.narrativeType === 'family' ? (
                    <>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span><strong>가족 서사 중심</strong> - 양가가 함께하는 이야기</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>시네마틱 인트로 애니메이션</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>양가 부모님 소개 & 인사말</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>신랑 & 신부 성장 스토리</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>AI가 자동으로 스토리 생성</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>6가지 컬러 & 5가지 폰트 테마</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span><strong>혼주 시점</strong> - 부모님이 보내는 청첩장</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>3D 봉투 오프닝 애니메이션</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>하객별 개인화된 인사말 (명단 업로드)</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>자녀 성장 사진 타임라인</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>결혼식 안내 (셔틀버스, 화환, 답례품, 포토부스)</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>6가지 프리미엄 컬러 테마</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* CTA Button */}
              <Link
                href={selectedTemplate.narrativeType === 'parents' ? '/editor/parents' : `/editor?template=${selectedTemplate.id}`}
                className={`block w-full py-4 text-white text-center rounded-xl font-medium transition-colors ${
                  selectedTemplate.narrativeType === 'parents'
                    ? 'bg-[#722F37] hover:bg-[#5a252c]'
                    : 'bg-black hover:bg-gray-800'
                }`}
              >
                이 템플릿으로 시작하기
              </Link>

              {/* Sample Links */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-sm font-medium text-gray-900 mb-3 text-center">샘플 청첩장 직접 보기</p>
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    href="/i/sample-our"
                    target="_blank"
                    className="flex items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-all"
                  >
                    OUR
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                  <Link
                    href="/i/sample-family"
                    target="_blank"
                    className="flex items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-all"
                  >
                    FAMILY
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                  <Link
                    href="/sample/parents"
                    target="_blank"
                    className="flex items-center justify-center gap-1 px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-all"
                  >
                    PARENTS
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-medium text-center text-gray-900 mb-12">
            왜 dear drawer인가요?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">AI 스토리 생성</h3>
              <p className="text-sm text-gray-500">
                질문에 답하면 AI가 두 분만의
                <br />
                특별한 이야기를 만들어 드려요
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">완벽한 커스터마이징</h3>
              <p className="text-sm text-gray-500">
                색상, 폰트, 레이아웃까지
                <br />
                원하는 대로 수정 가능해요
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">모바일 최적화</h3>
              <p className="text-sm text-gray-500">
                카카오톡으로 바로 공유하고
                <br />
                모바일에서 완벽하게 보여요
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
