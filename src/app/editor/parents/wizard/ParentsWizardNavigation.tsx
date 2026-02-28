'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ParentsWizardStep } from './ParentsWizardProgress'

interface ParentsWizardNavigationProps {
  currentStep: ParentsWizardStep
  onNext: () => void
  onPrev: () => void
  validationError?: string | null
}

export default function ParentsWizardNavigation({
  currentStep,
  onNext,
  onPrev,
  validationError,
}: ParentsWizardNavigationProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === 5

  // 마지막 단계는 자체 버튼 사용
  if (isLastStep) {
    return (
      <div className="px-6 py-4">
        <button
          onClick={onPrev}
          className="w-full neu-btn h-11 text-sm flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          이전 단계로
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      {/* 에러 메시지 */}
      {validationError && (
        <div className="mb-4 p-4 bg-red-50/80 border border-red-100 rounded-xl">
          <p className="text-sm text-red-600 whitespace-pre-line">{validationError}</p>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between gap-4">
        {/* 이전 버튼 */}
        <button
          onClick={onPrev}
          disabled={isFirstStep}
          className={`flex-1 neu-btn h-11 text-sm flex items-center justify-center ${isFirstStep ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          이전
        </button>

        {/* 다음 버튼 */}
        <button
          onClick={onNext}
          className="flex-[2] neu-btn-primary h-11 text-sm flex items-center justify-center rounded-xl"
        >
          다음 단계
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  )
}
