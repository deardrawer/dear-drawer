'use client'

import { useState } from 'react'
import Link from 'next/link'
import { templates, Template } from '@/lib/templates'

// 색상 테마 정의
const colorThemes = [
  { id: 'classic-rose', name: 'Classic Rose', primary: '#A67B5B', bg: '#FDF8F5', text: '#3D3D3D' },
  { id: 'modern-black', name: 'Modern Black', primary: '#1A1A1A', bg: '#FFFFFF', text: '#1A1A1A' },
  { id: 'romantic-blush', name: 'Romantic Blush', primary: '#D4A5A5', bg: '#FFF5F5', text: '#4A4A4A' },
  { id: 'nature-green', name: 'Nature Green', primary: '#6B8E6B', bg: '#F5F8F5', text: '#3D4A3D' },
  { id: 'luxury-navy', name: 'Luxury Navy', primary: '#1E3A5F', bg: '#F8FAFC', text: '#1E3A5F' },
  { id: 'sunset-coral', name: 'Sunset Coral', primary: '#E8846B', bg: '#FFF8F5', text: '#4A3D3D' },
]

export default function GalleryPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0])
  const [selectedColor, setSelectedColor] = useState(colorThemes[0])
  const [iframeKey, setIframeKey] = useState(0)

  // 템플릿에 따른 샘플 URL
  const sampleUrl = selectedTemplate.narrativeType === 'our'
    ? '/i/sample-our?preview=true'
    : '/i/sample-family?preview=true'

  // iframe 새로고침
  const refreshPreview = () => {
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
            5 Min Setup
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
                        key={iframeKey}
                        src={sampleUrl}
                        className="w-full h-full border-0"
                        title="Wedding Invitation Preview"
                        style={{ background: selectedColor.bg }}
                      />

                      {/* Loading overlay (brief) */}
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center pointer-events-none opacity-0 animate-pulse" id="loading-overlay">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      </div>
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
              {/* Template Selection */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">템플릿 선택</h2>
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template) => (
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

              {/* Color Theme Selection */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">컬러 테마</h2>
                <div className="grid grid-cols-3 gap-3">
                  {colorThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedColor(theme)}
                      className={`relative p-3 rounded-xl border-2 transition-all ${
                        selectedColor.id === theme.id
                          ? 'border-black'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded-lg mb-2"
                        style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.bg} 100%)` }}
                      />
                      <p className="text-xs font-medium text-gray-700 truncate">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </div>

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
                        <span>시네마틱 인트로 애니메이션</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>3페이지 스토리 구조 (커버 → 초대 → 메인)</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>커플 프로필 & 인터뷰 섹션</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>우리의 이야기 타임라인</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>플로팅 메뉴 (연락처, 축의금, 위치, 공유)</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>전통적인 청첩장 형식</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>양가 부모님 중심 소개</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>격식 있는 인사말</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>깔끔한 단일 페이지 레이아웃</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* CTA Button */}
              <Link
                href={`/editor?template=${selectedTemplate.id}&color=${selectedColor.id}`}
                className="block w-full py-4 bg-black text-white text-center rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                이 템플릿으로 시작하기
              </Link>

              {/* Sample Links */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">샘플 청첩장 직접 보기</p>
                <div className="flex justify-center gap-4">
                  <Link
                    href="/i/sample-our"
                    target="_blank"
                    className="text-sm text-gray-600 hover:text-black underline"
                  >
                    OUR 템플릿 →
                  </Link>
                  <Link
                    href="/i/sample-family"
                    target="_blank"
                    className="text-sm text-gray-600 hover:text-black underline"
                  >
                    FAMILY 템플릿 →
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
