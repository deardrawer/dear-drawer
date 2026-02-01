'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { templates } from '@/lib/templates'

// 템플릿 분류
const ourTemplate = templates.find(t => t.narrativeType === 'our')!
const familyTemplate = templates.find(t => t.narrativeType === 'family')!
const parentsTemplate = templates.find(t => t.narrativeType === 'parents')!

// 랜덤 슬러그 생성
const generateRandomSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `invitation-${randomPart}`
}

export default function TemplatesPage() {
  const router = useRouter()

  // 모바일 비교 카드 인덱스
  const [compareIndex, setCompareIndex] = useState(0)

  // 템플릿 선택 시 자동 URL 생성 후 바로 에디터 이동
  const handleTemplateSelect = (templateId: string) => {
    const autoSlug = generateRandomSlug()

    if (templateId === 'narrative-parents') {
      router.push(`/editor/parents?slug=${autoSlug}`)
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
          <Link
            href="/my-invitations"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            내 청첩장
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 타이틀 */}
          <div className="text-center mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              어떤 이야기를 담을까요?
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              두 분에게 맞는 템플릿을 선택하세요
            </p>
          </div>

          {/* 메인 템플릿 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* OUR 카드 */}
            <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-rose-300 transition-all duration-300 overflow-hidden">
              {/* 배지 */}
              <div className="absolute top-4 right-4 z-10">
                <span className="px-3 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
                  커플 중심
                </span>
              </div>

              {/* 썸네일 영역 */}
              <div className="h-48 relative overflow-hidden">
                <img
                  src={ourTemplate.defaultCoverImage}
                  alt="OUR 템플릿"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* 콘텐츠 */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">OUR</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {ourTemplate.description}
                </p>

                {/* 특징 리스트 */}
                <div className="space-y-2 mb-6">
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-rose-400">✓</span> 연인의 시선으로 서로 소개
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-rose-400">✓</span> 러브스토리 타임라인
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-rose-400">✓</span> 커플 인터뷰
                  </p>
                </div>

                {/* 버튼 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleTemplateSelect('narrative-our')}
                    className="flex-1 mr-3 py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl text-center transition-colors"
                  >
                    이 템플릿으로 시작
                  </button>
                  <a
                    href="/i/sample-our"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
                  >
                    샘플
                  </a>
                </div>
              </div>
            </div>

            {/* FAMILY 카드 */}
            <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
              {/* 배지 */}
              <div className="absolute top-4 right-4 z-10">
                <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  가족 중심
                </span>
              </div>

              {/* 썸네일 영역 */}
              <div className="h-48 relative overflow-hidden">
                <img
                  src={familyTemplate.defaultCoverImage}
                  alt="FAMILY 템플릿"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* 콘텐츠 */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">FAMILY</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {familyTemplate.description}
                </p>

                {/* 특징 리스트 */}
                <div className="space-y-2 mb-6">
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-blue-400">✓</span> 양가 부모님 인사말
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-blue-400">✓</span> 서로를 선택한 이유
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-blue-400">✓</span> 커플 인터뷰
                  </p>
                </div>

                {/* 버튼 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleTemplateSelect('narrative-family')}
                    className="flex-1 mr-3 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl text-center transition-colors"
                  >
                    이 템플릿으로 시작
                  </button>
                  <a
                    href="/i/sample-family"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
                  >
                    샘플
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 비교 테이블 - 데스크톱 */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-12">
            <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">템플릿 비교</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 px-4 text-left text-gray-500 font-medium">섹션</th>
                    <th className="py-3 px-4 text-center text-rose-600 font-medium">OUR</th>
                    <th className="py-3 px-4 text-center text-blue-600 font-medium">FAMILY</th>
                    <th className="py-3 px-4 text-center text-amber-600 font-medium">PARENTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="py-3 px-4 text-gray-700">인트로</td>
                    <td className="py-3 px-4 text-center text-rose-500">✓</td>
                    <td className="py-3 px-4 text-center text-blue-500">✓</td>
                    <td className="py-3 px-4 text-center text-xs text-amber-500">봉투 오프닝</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">인사말</td>
                    <td className="py-3 px-4 text-center text-rose-500">✓</td>
                    <td className="py-3 px-4 text-center text-blue-500">✓</td>
                    <td className="py-3 px-4 text-center text-xs text-amber-500">혼주 인사말</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">신랑신부 소개</td>
                    <td className="py-3 px-4 text-center text-xs text-rose-500">연인의 시선으로 소개</td>
                    <td className="py-3 px-4 text-center text-xs text-blue-500">부모님 인사 + 자녀소개</td>
                    <td className="py-3 px-4 text-center text-xs text-amber-500">우리 아들/딸 결혼합니다</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">우리들의 이야기</td>
                    <td className="py-3 px-4 text-center text-xs text-rose-500">러브스토리</td>
                    <td className="py-3 px-4 text-center text-xs text-blue-500">서로를 선택한 이유</td>
                    <td className="py-3 px-4 text-center text-gray-300">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">인터뷰</td>
                    <td className="py-3 px-4 text-center text-rose-500">✓</td>
                    <td className="py-3 px-4 text-center text-blue-500">✓</td>
                    <td className="py-3 px-4 text-center text-gray-300">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">갤러리</td>
                    <td className="py-3 px-4 text-center text-rose-500">✓</td>
                    <td className="py-3 px-4 text-center text-blue-500">✓</td>
                    <td className="py-3 px-4 text-center text-amber-500">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">안내사항</td>
                    <td className="py-3 px-4 text-center text-rose-500">✓</td>
                    <td className="py-3 px-4 text-center text-blue-500">✓</td>
                    <td className="py-3 px-4 text-center text-amber-500">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">감사인사</td>
                    <td className="py-3 px-4 text-center text-rose-500">✓</td>
                    <td className="py-3 px-4 text-center text-blue-500">✓</td>
                    <td className="py-3 px-4 text-center text-gray-300">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">방명록</td>
                    <td className="py-3 px-4 text-center text-rose-500">✓</td>
                    <td className="py-3 px-4 text-center text-blue-500">✓</td>
                    <td className="py-3 px-4 text-center text-xs text-amber-500">비공개</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-gray-700">마음 전하실 곳</td>
                    <td className="py-3 px-4 text-center text-rose-500">✓</td>
                    <td className="py-3 px-4 text-center text-blue-500">✓</td>
                    <td className="py-3 px-4 text-center text-amber-500">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 비교 카드 - 모바일 */}
          <div className="md:hidden bg-white rounded-2xl border border-gray-100 shadow-lg p-5 mb-12">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">템플릿 비교</h3>

            {/* 탭 버튼 */}
            <div className="flex gap-2 mb-5">
              {[
                { idx: 0, name: 'OUR', color: 'rose' },
                { idx: 1, name: 'FAMILY', color: 'blue' },
                { idx: 2, name: 'PARENTS', color: 'amber' },
              ].map((tab) => (
                <button
                  key={tab.idx}
                  onClick={() => setCompareIndex(tab.idx)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    compareIndex === tab.idx
                      ? tab.color === 'rose'
                        ? 'bg-rose-500 text-white shadow-md'
                        : tab.color === 'blue'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-amber-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* OUR 카드 */}
            {compareIndex === 0 && (
              <div className="space-y-2.5">
                {[
                  { section: '인트로', value: '✓' },
                  { section: '인사말', value: '✓' },
                  { section: '신랑신부 소개', value: '연인의 시선으로 소개' },
                  { section: '우리들의 이야기', value: '러브스토리' },
                  { section: '인터뷰', value: '✓' },
                  { section: '갤러리', value: '✓' },
                  { section: '안내사항', value: '✓' },
                  { section: '감사인사', value: '✓' },
                  { section: '방명록', value: '✓' },
                  { section: '마음 전하실 곳', value: '✓' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-rose-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.section}</span>
                    <span className="text-sm font-medium text-rose-600">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* FAMILY 카드 */}
            {compareIndex === 1 && (
              <div className="space-y-2.5">
                {[
                  { section: '인트로', value: '✓' },
                  { section: '인사말', value: '✓' },
                  { section: '신랑신부 소개', value: '부모님 인사 + 자녀소개' },
                  { section: '우리들의 이야기', value: '서로를 선택한 이유' },
                  { section: '인터뷰', value: '✓' },
                  { section: '갤러리', value: '✓' },
                  { section: '안내사항', value: '✓' },
                  { section: '감사인사', value: '✓' },
                  { section: '방명록', value: '✓' },
                  { section: '마음 전하실 곳', value: '✓' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.section}</span>
                    <span className="text-sm font-medium text-blue-600">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* PARENTS 카드 */}
            {compareIndex === 2 && (
              <div className="space-y-2.5">
                {[
                  { section: '인트로', value: '봉투 오프닝' },
                  { section: '인사말', value: '혼주 인사말' },
                  { section: '신랑신부 소개', value: '우리 아들/딸 결혼합니다' },
                  { section: '우리들의 이야기', value: '-', disabled: true },
                  { section: '인터뷰', value: '-', disabled: true },
                  { section: '갤러리', value: '✓' },
                  { section: '안내사항', value: '✓' },
                  { section: '감사인사', value: '-', disabled: true },
                  { section: '방명록', value: '비공개' },
                  { section: '마음 전하실 곳', value: '✓' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${item.disabled ? 'bg-gray-50' : 'bg-amber-50'}`}>
                    <span className={`text-sm ${item.disabled ? 'text-gray-400' : 'text-gray-700'}`}>{item.section}</span>
                    <span className={`text-sm font-medium ${item.disabled ? 'text-gray-300' : 'text-amber-600'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PARENTS 카드 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-amber-300 transition-all duration-300 overflow-hidden max-w-md mx-auto">
            {/* 썸네일 영역 */}
            <div className="h-40 relative overflow-hidden">
              <img
                src={parentsTemplate.defaultCoverImage}
                alt="PARENTS 템플릿"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  혼주용
                </span>
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">PARENTS</h2>
              <p className="text-sm text-gray-600 mb-4">
                {parentsTemplate.description}
              </p>

              {/* 특징 리스트 */}
              <div className="space-y-2 mb-6">
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-amber-400">✓</span> 봉투 오프닝 연출
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-amber-400">✓</span> 혼주 시점 인사말
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-amber-400">✓</span> 타임라인 형식
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleTemplateSelect('narrative-parents')}
                  className="flex-1 mr-3 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl text-center transition-colors"
                >
                  이 템플릿으로 시작
                </button>
                <a
                  href="/sample/parents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors"
                >
                  샘플
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}
