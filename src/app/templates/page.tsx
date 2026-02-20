'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import SocialProofCounter from '@/components/social-proof/SocialProofCounter'

// 랜덤 슬러그 생성
const generateRandomSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `invitation-${randomPart}`
}

type TemplateCategory = null | 'story' | 'mini' | 'parents'

export default function TemplatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as TemplateCategory
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>(initialCategory)

  // 카테고리 선택 시 히스토리에 상태 기록
  const selectCategory = useCallback((category: TemplateCategory) => {
    setSelectedCategory(category)
    if (category) {
      window.history.pushState({ category }, '', `/templates?category=${category}`)
    }
  }, [])

  // 뒤로가기 시 카테고리 상태 복원
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.category) {
        setSelectedCategory(e.state.category)
      } else {
        setSelectedCategory(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    const autoSlug = generateRandomSlug()
    if (templateId === 'narrative-parents') {
      router.push(`/editor/parents?slug=${autoSlug}`)
    } else if (templateId === 'narrative-exhibit') {
      router.push(`/editor/feed?slug=${autoSlug}`)
    } else {
      router.push(`/editor?template=${templateId}&slug=${autoSlug}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Dear Drawer" className="h-5 w-auto" />
          </Link>
          <Link href="/my-invitations" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            내 청첩장
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">

          <SocialProofCounter />

          {/* Step 1: 카테고리 선택 */}
          {!selectedCategory && (
            <div>
              <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                  어떤 청첩장을 원하세요?
                </h1>
                <p className="text-xs sm:text-base text-gray-500">
                  스타일을 선택하면 맞춤 템플릿을 추천해 드려요
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-5 max-w-2xl mx-auto">
                {/* 스토리형 */}
                <button
                  onClick={() => selectCategory('story')}
                  className="group relative p-5 sm:p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-rose-300 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-3xl sm:text-5xl flex-shrink-0">📖</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-xl font-semibold text-gray-900">스토리형</h3>
                        <span className="px-2 py-0.5 text-[9px] sm:text-xs bg-rose-50 text-rose-500 rounded-full font-medium">깊이 있는 이야기</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                        우리의 사랑 이야기를 풍부하게 담는 청첩장
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400">OUR &middot; FAMILY</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-rose-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* 미니 스토리형 */}
                <button
                  onClick={() => selectCategory('mini')}
                  className="group relative p-5 sm:p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-gray-800 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-3xl sm:text-5xl flex-shrink-0">✨</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-xl font-semibold text-gray-900">미니 스토리형</h3>
                        <span className="px-2 py-0.5 text-[9px] sm:text-xs bg-gray-100 text-gray-600 rounded-full font-medium">감각적 디자인</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                        감각적인 디자인에 이야기를 간결하게 담는 청첩장
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400">MAGAZINE &middot; MOVIE &middot; RECORD</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-800 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* 혼주용 */}
                <button
                  onClick={() => selectCategory('parents')}
                  className="group relative p-5 sm:p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-amber-300 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-3xl sm:text-5xl flex-shrink-0">🎎</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-xl font-semibold text-gray-900">혼주용</h3>
                        <span className="px-2 py-0.5 text-[9px] sm:text-xs bg-amber-50 text-amber-600 rounded-full font-medium">격식 있는</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                        부모님이 지인분들께 보내는 격식 있는 청첩장
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400">PARENTS</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: 스토리형 → OUR, FAMILY */}
          {selectedCategory === 'story' && (
            <div>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-rose-400 uppercase mb-2">Story Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">스토리형 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">우리의 이야기를 깊이 있게 전달하는 템플릿</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* OUR */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-rose-300 transition-all duration-300 overflow-hidden">
                  <div className="p-5 sm:p-8">
                    <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">💕</div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">OUR</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-6">커플의 서사가 중심이 되는 청첩장</p>
                    <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-8 text-xs sm:text-sm text-gray-500">
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 장기연애를 해온 커플</p>
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 특별한 스토리가 있는 커플</p>
                      <p className="flex items-center gap-2"><span className="text-rose-400">♥</span> 우리만의 이야기를 담고 싶은 커플</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTemplateSelect('narrative-our')} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl text-center transition-colors">
                        시작하기
                      </button>
                      <a href="/i/sample-our" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>

                {/* FAMILY */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
                  <div className="p-5 sm:p-8">
                    <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">👨‍👩‍👧‍👦</div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">FAMILY</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-6">두 가족의 축복으로 완성되는 청첩장</p>
                    <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-8 text-xs sm:text-sm text-gray-500">
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 양가 부모님의 축하 인사말</p>
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 서로가 선택한 이유 (신랑/신부 소개)</p>
                      <p className="flex items-center gap-2"><span className="text-blue-400">♥</span> 커플 인터뷰 & 풀스크린 포토</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTemplateSelect('narrative-family')} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl text-center transition-colors">
                        시작하기
                      </button>
                      <a href="/i/sample-family" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 미니 스토리형 → MAGAZINE, MOVIE, RECORD */}
          {selectedCategory === 'mini' && (
            <div>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-gray-800 uppercase mb-2">Mini Story Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">미니 스토리형 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">감각적인 디자인에 이야기를 간결하게 담는 템플릿</p>
              </div>

              <div className="flex flex-col gap-4 sm:gap-5 max-w-2xl mx-auto">
                {/* MAGAZINE */}
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 bg-gray-50 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
                      <div className="text-4xl sm:text-5xl mb-2">📰</div>
                      <h2 className="text-lg font-bold text-gray-900">MAGAZINE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">매거진 인터뷰 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium bg-gray-900 text-white rounded-full mb-3">세련된 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#모던</span>
                        <span className="text-[11px] text-gray-400">#인터뷰형식</span>
                        <span className="text-[11px] text-gray-400">#미니멀</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 모던하고 세련된 분위기를 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> Q&A 인터뷰로 서로를 소개하고 싶은 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 고급스럽고 깔끔한 레이아웃을 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-magazine')} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors">
                          시작하기
                        </button>
                        <a href="/i/sample-magazine" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOVIE */}
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 bg-gray-50 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-100">
                      <div className="text-4xl sm:text-5xl mb-2">🎬</div>
                      <h2 className="text-lg font-bold text-gray-900">MOVIE</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">시네마틱 무드</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium bg-gray-800 text-white rounded-full mb-3">감성적인 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#시네마틱</span>
                        <span className="text-[11px] text-gray-400">#무드있는</span>
                        <span className="text-[11px] text-gray-400">#다크테마</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 영화 같은 분위기를 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 무드 있는 사진이 많은 커플</p>
                        <p className="flex items-start gap-2"><span className="text-gray-800 mt-0.5 text-xs">&#10003;</span> 남들과 다른 독특한 연출을 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-film')} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors">
                          시작하기
                        </button>
                        <a href="/i/sample-film" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECORD */}
                <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ borderColor: '#F5E6E3' }}>
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#FDF8F6', borderColor: '#F5E6E3' }}>
                      <div className="text-4xl sm:text-5xl mb-2">🎵</div>
                      <h2 className="text-lg font-bold text-gray-900">RECORD</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">뮤직 앨범 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#E89B8F' }}>음악을 사랑하는 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#아날로그</span>
                        <span className="text-[11px] text-gray-400">#따뜻한톤</span>
                        <span className="text-[11px] text-gray-400">#LP감성</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 음악이 우리 사랑의 배경인 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 아날로그 감성을 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#E89B8F' }} className="mt-0.5 text-xs">&#10003;</span> 따뜻하고 포근한 분위기를 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-record')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#E89B8F' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-record" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FEED */}
                <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ borderColor: '#E4E0F5' }}>
                  <div className="flex flex-col sm:flex-row">
                    {/* 왼쪽: 비주얼 */}
                    <div className="sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-5 sm:p-6 border-b sm:border-b-0 sm:border-r" style={{ background: '#F8F6FD', borderColor: '#E4E0F5' }}>
                      <div className="text-4xl sm:text-5xl mb-2">📸</div>
                      <h2 className="text-lg font-bold text-gray-900">FEED</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">인스타 포토 스타일</p>
                    </div>
                    {/* 오른쪽: 추천 정보 */}
                    <div className="flex-1 p-5 sm:p-6">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-medium text-white rounded-full mb-3" style={{ background: '#8B5CF6' }}>사진이 많은 커플에게 추천</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] text-gray-400">#SNS감성</span>
                        <span className="text-[11px] text-gray-400">#포토중심</span>
                        <span className="text-[11px] text-gray-400">#캐주얼</span>
                      </div>
                      <div className="space-y-1.5 mb-4 text-[13px] text-gray-600">
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> 스냅 사진이 자산인 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> SNS 감성을 좋아하는 커플</p>
                        <p className="flex items-start gap-2"><span style={{ color: '#8B5CF6' }} className="mt-0.5 text-xs">&#10003;</span> 캐주얼하고 트렌디한 분위기를 원할 때</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTemplateSelect('narrative-exhibit')} className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ background: '#8B5CF6' }}>
                          시작하기
                        </button>
                        <a href="/i/sample-feed" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-500 text-sm rounded-xl transition-colors">
                          샘플 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 혼주용 → PARENTS */}
          {selectedCategory === 'parents' && (
            <div>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                다른 스타일 보기
              </button>
              <div className="text-center mb-8">
                <p className="text-xs tracking-widest text-amber-500 uppercase mb-2">Parents Type</p>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">혼주용 청첩장</h1>
                <p className="text-xs sm:text-base text-gray-500">부모님이 지인분들께 보내는 격식 있는 청첩장</p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-amber-300 transition-all duration-300 overflow-hidden text-center">
                  <div className="p-6 sm:p-10">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-5">🎎</div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-3">PARENTS</h2>
                    <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-8">
                      간결한 인사말과 예식 정보 중심의<br />
                      격식 있는 청첩장
                    </p>
                    <div className="space-y-1 sm:space-y-2 mb-5 sm:mb-8 text-xs sm:text-sm text-gray-500 text-left max-w-xs mx-auto">
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 봉투 오프닝 연출</p>
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 혼주 시점 인사말</p>
                      <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> 부모님 지인 대상 최적화</p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => handleTemplateSelect('narrative-parents')} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors">
                        시작하기
                      </button>
                      <a href="/sample/parents" target="_blank" rel="noopener noreferrer" className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                        샘플
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
