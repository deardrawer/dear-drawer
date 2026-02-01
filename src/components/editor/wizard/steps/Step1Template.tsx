'use client'

import { useEditorStore } from '@/store/editorStore'
import { getTemplateById, templates } from '@/lib/templates'
import Image from 'next/image'

interface Step1TemplateProps {
  templateId?: string
}

// 템플릿별 상세 정보
const TEMPLATE_DETAILS = {
  'narrative-our': {
    icon: '💕',
    title: 'OUR',
    subtitle: '커플 중심의 러브스토리',
    description: '두 사람의 만남과 사랑 이야기를 중심으로 구성된 청첩장입니다.',
    target: '본인들이 직접 보내는 청첩장에 적합해요',
    coverImage: '/images/our-cover.png',
    features: [
      { icon: '💑', text: '커플 프로필 소개' },
      { icon: '📖', text: '우리의 러브스토리 (타임라인)' },
      { icon: '🎤', text: '커플 인터뷰 Q&A' },
      { icon: '📸', text: '갤러리' },
    ],
    flow: [
      '인트로 (커버 이미지)',
      '인사말 & 날짜/장소',
      '커플 프로필',
      '러브스토리',
      '인터뷰',
      '갤러리',
      '안내사항',
      '축의금 & RSVP',
    ],
    tags: ['로맨틱', '커플 중심', '10문항'],
    tagColors: ['pink', 'rose', 'purple'],
  },
  'narrative-family': {
    icon: '👨‍👩‍👧‍👦',
    title: 'FAMILY',
    subtitle: '두 가족의 축복으로 완성되는 청첩장',
    description: '양가 부모님의 인사말과 서로가 선택한 이유를 담은 청첩장입니다.',
    target: '가족의 축복을 함께 전하고 싶은 커플에게 적합해요',
    coverImage: '/samples/parents/1.png',
    features: [
      { icon: '👨‍👩‍👧', text: '양가 부모님 인사말' },
      { icon: '💕', text: '서로가 선택한 이유' },
      { icon: '🎤', text: '커플 인터뷰' },
      { icon: '🖼️', text: '풀스크린 포토 디바이더' },
    ],
    flow: [
      '인트로 (가족 분위기)',
      '부모님 인사말',
      '서로가 선택한 이유',
      '커플 인터뷰',
      '갤러리',
      '오시는 길',
      '축의금 & RSVP',
    ],
    tags: ['가족 중심', '축복', '12문항'],
    tagColors: ['blue', 'navy', 'purple'],
  },
}

export default function Step1Template({ templateId }: Step1TemplateProps) {
  const { invitation, template, initInvitation, updateNestedField } = useEditorStore()

  // OUR와 FAMILY 템플릿만 표시 (PARENTS 제외)
  const availableTemplates = templates.filter(t => t.id !== 'narrative-parents')

  const handleTemplateSelect = (selectedTemplateId: string) => {
    const newTemplate = getTemplateById(selectedTemplateId)
    if (newTemplate) {
      // 기존 데이터를 유지하면서 템플릿만 변경
      if (invitation) {
        useEditorStore.getState().setTemplate(newTemplate)
        // 커버 이미지가 없거나 기본 이미지인 경우 새 템플릿의 기본 이미지로 업데이트
        const currentCover = invitation.media?.coverImage || ''
        const defaultImages = [
          '/images/our-cover.png',
          '/samples/parents/1.png',
          '/demo/cover.jpg',
        ]
        const isDefaultOrEmpty = !currentCover ||
          currentCover.includes('unsplash.com') ||
          defaultImages.includes(currentCover)
        if (isDefaultOrEmpty && newTemplate.defaultCoverImage) {
          updateNestedField('media.coverImage', newTemplate.defaultCoverImage)
        }
      } else {
        initInvitation(newTemplate)
      }
    }
  }

  const currentTemplateId = invitation?.templateId || templateId || 'narrative-our'

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h3 className="text-xl font-medium text-gray-900 mb-2">템플릿을 선택해주세요</h3>
        <p className="text-sm text-blue-600">
          💡 청첩장의 전체적인 분위기와 구성을 결정합니다.
        </p>
      </div>

      {/* 템플릿 카드들 */}
      <div className="space-y-4">
        {availableTemplates.map((t) => {
          const isSelected = currentTemplateId === t.id
          const details = TEMPLATE_DETAILS[t.id as keyof typeof TEMPLATE_DETAILS]
          if (!details) return null

          return (
            <button
              key={t.id}
              onClick={() => handleTemplateSelect(t.id)}
              className={`relative w-full rounded-2xl border-2 transition-all text-left overflow-hidden ${
                isSelected
                  ? 'border-black ring-2 ring-black/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* 선택 표시 */}
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* 상단: 커버 이미지 미리보기 */}
              <div className="relative h-40 bg-gray-100">
                <img
                  src={details.coverImage}
                  alt={details.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                <div className="absolute bottom-3 left-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{details.icon}</span>
                    <span className="text-xl font-medium">{details.title}</span>
                  </div>
                  <p className="text-xs text-white/80">{details.subtitle}</p>
                </div>
              </div>

              {/* 하단: 설명 */}
              <div className="p-4 space-y-3">
                {/* 설명 */}
                <p className="text-sm text-gray-600">{details.description}</p>

                {/* 타겟 */}
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">💡</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{details.target}</p>
                </div>

                {/* 주요 구성 */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">주요 구성</p>
                  <div className="grid grid-cols-2 gap-2">
                    {details.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{feature.icon}</span>
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 흐름 */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">청첩장 흐름</p>
                  <div className="flex flex-wrap gap-1">
                    {details.flow.map((step, idx) => (
                      <span key={idx} className="inline-flex items-center text-[10px] text-gray-500">
                        {step}
                        {idx < details.flow.length - 1 && <span className="mx-1">→</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 태그 */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {details.tags.map((tag, idx) => {
                    const colorMap: Record<string, string> = {
                      pink: 'bg-pink-100 text-pink-700',
                      rose: 'bg-rose-100 text-rose-700',
                      purple: 'bg-purple-100 text-purple-700',
                      blue: 'bg-blue-100 text-blue-700',
                      navy: 'bg-indigo-100 text-indigo-700',
                    }
                    const color = colorMap[details.tagColors[idx]] || 'bg-gray-100 text-gray-700'
                    return (
                      <span key={idx} className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
                        {tag}
                      </span>
                    )
                  })}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 안내 */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-700">
          💡 템플릿을 변경해도 입력한 내용은 그대로 유지됩니다.
        </p>
      </div>
    </div>
  )
}
