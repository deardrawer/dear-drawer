'use client'

import { useEditorStore } from '@/store/editorStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WizardNavigationProps {
  onSave?: () => void
  isSaving?: boolean
}

export default function WizardNavigation({ onSave, isSaving }: WizardNavigationProps) {
  const { wizardStep, nextWizardStep, prevWizardStep, validationError } = useEditorStore()

  const isFirstStep = wizardStep === 1
  const isLastStep = wizardStep === 5

  // 스크롤 최상단 이동 헬퍼
  const scrollEditorToTop = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
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

  // 마지막 단계는 Step6Publish에서 자체 버튼 사용
  if (isLastStep) {
    return (
      <div className="border-t border-gray-100 bg-white px-6 py-4">
        <Button
          variant="outline"
          onClick={handlePrev}
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
      {validationError?.tab === 'wizard' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600 whitespace-pre-line">{validationError.message}</p>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between gap-4">
        {/* 이전 버튼 */}
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep}
          className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 h-11 text-sm"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          이전
        </Button>

        {/* 다음 버튼 */}
        <Button
          onClick={handleNext}
          className="flex-[2] bg-black text-white hover:bg-gray-800 h-11 text-sm"
        >
          다음 단계
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
