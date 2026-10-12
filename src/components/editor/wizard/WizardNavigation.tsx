'use client'

import { useEditorStore } from '@/store/editorStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WizardNavigationProps {
  onSave?: () => void
  isSaving?: boolean
  isOurTemplate?: boolean
}

export default function WizardNavigation({ onSave, isSaving, isOurTemplate }: WizardNavigationProps) {
  const { wizardStep, nextWizardStep, prevWizardStep, validationError } = useEditorStore()

  const isFirstStep = wizardStep === 1
  const isLastStep = wizardStep === 5

  // 스크롤 최상단 이동 헬퍼
  const scrollEditorToTop = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 패널 내부 스크롤 영역 우선 (데스크탑)
        const wizardScroll = document.getElementById('wizard-scroll-area')
        if (wizardScroll && wizardScroll.scrollHeight > wizardScroll.clientHeight) {
          wizardScroll.scrollTop = 0
          return
        }
        // 폴백: 페이지 스크롤 (모바일)
        const scrollContainer = document.getElementById('editor-scroll-container')
        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        }
      })
    })
  }

  const handleNext = () => {
    nextWizardStep()
    scrollEditorToTop()
  }

  const handlePrev = () => {
    prevWizardStep()
    scrollEditorToTop()
  }

  // 마지막 단계는 Step6Publish에서 자체 발행 버튼 사용 → 여기선 조용한 '이전'만
  if (isLastStep) {
    return (
      <div className={`hidden md:block px-4 py-2 md:px-6 md:py-4 border-t ${isOurTemplate ? 'md:px-9 md:py-4 border-black/[0.04]' : 'border-gray-100 bg-white'}`}>
        <button
          type="button"
          onClick={handlePrev}
          className="inline-flex items-center gap-1 text-sm py-2 pr-2 text-[color:var(--ed-text-muted)] hover:text-[color:var(--ed-text)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          이전 단계로
        </button>
      </div>
    )
  }

  return (
    <div className={`hidden md:block px-4 py-2 md:px-6 md:py-4 border-t ${isOurTemplate ? 'md:px-9 md:py-5 border-black/[0.04]' : 'border-gray-100 bg-white'}`}>
      {/* 에러 메시지 */}
      {validationError?.tab === 'wizard' && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600 whitespace-pre-line">{validationError.message}</p>
        </div>
      )}

      {/* 버튼 영역 — '이전'은 조용한 고스트(왼쪽), '다음'은 강조·자연 폭(오른쪽) */}
      <div className="flex items-center justify-between gap-3">
        {/* 이전 (첫 단계에서는 숨김, 자리 유지) */}
        {!isFirstStep ? (
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center gap-1 text-sm py-2 pr-2 text-[color:var(--ed-text-muted)] hover:text-[color:var(--ed-text)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
        ) : (
          <span />
        )}

        {/* 다음 단계 (주 액션) */}
        <Button
          onClick={handleNext}
          className={`tracking-wide h-10 text-sm px-6 ${isOurTemplate ? 'neu-btn-primary' : 'bg-black text-white hover:bg-gray-800'}`}
        >
          다음 단계
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
