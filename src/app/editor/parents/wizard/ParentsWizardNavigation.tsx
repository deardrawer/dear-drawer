'use client'

import { Button } from '@/components/ui/button'
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
      <div className="border-t border-gray-100 bg-white px-6 py-4">
        <Button
          variant="outline"
          onClick={onPrev}
          className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 h-11 text-sm"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          이전 단계로
        </Button>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-100 bg-white px-6 py-4">
      {/* 에러 메시지 */}
      {validationError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600 whitespace-pre-line">{validationError}</p>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between gap-4">
        {/* 이전 버튼 */}
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isFirstStep}
          className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 h-11 text-sm"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          이전
        </Button>

        {/* 다음 버튼 */}
        <Button
          onClick={onNext}
          className="flex-[2] bg-black text-white hover:bg-gray-800 h-11 text-sm"
        >
          다음 단계
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>

      {/* 건너뛰기 (선택 단계: 2, 3, 4) */}
      {(currentStep === 2 || currentStep === 3 || currentStep === 4) && (
        <button
          onClick={onNext}
          className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 underline"
        >
          나중에 할게요
        </button>
      )}
    </div>
  )
}
