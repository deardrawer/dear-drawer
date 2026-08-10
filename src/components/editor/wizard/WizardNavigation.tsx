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

  // 마지막 단계는 Step6Publish에서 자체 버튼 사용
  if (isLastStep) {
    return (
      <div className={`px-4 py-2 md:px-6 md:py-4 border-t ${isOurTemplate ? 'md:px-9 md:py-5 border-black/[0.04]' : 'border-gray-100 bg-white'}`}>
        <Button
          variant="outline"
          onClick={handlePrev}
          className={`w-full btn-cta-outline h-8 text-xs px-2.5 py-0 md:h-11 md:text-base md:px-4 ${isOurTemplate ? 'neu-btn text-[#8A8580]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <ChevronLeft className="w-4 h-4 mr-0.5 md:w-5 md:h-5 md:mr-1" />
          이전 단계로
        </Button>
      </div>
    )
  }

  return (
    <div className={`px-4 py-2 md:px-6 md:py-4 border-t ${isOurTemplate ? 'md:px-9 md:py-5 border-black/[0.04]' : 'border-gray-100 bg-white'}`}>
      {/* 에러 메시지 */}
      {validationError?.tab === 'wizard' && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600 whitespace-pre-line">{validationError.message}</p>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className={`flex items-center justify-between gap-2 md:gap-3`}>
        {/* 이전 버튼 */}
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep}
          className={`flex-1 btn-cta-outline h-8 text-xs px-2.5 py-0 md:h-11 md:text-base md:px-4 ${isOurTemplate ? 'neu-btn text-[#8A8580]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <ChevronLeft className="w-4 h-4 mr-0.5 md:w-5 md:h-5 md:mr-1" />
          이전
        </Button>

        {/* 다음 버튼 */}
        <Button
          onClick={handleNext}
          className={`flex-[2] btn-cta tracking-wide h-8 text-xs px-2.5 py-0 md:h-11 md:text-base md:px-4 ${isOurTemplate ? 'neu-btn-primary' : 'bg-black text-white hover:bg-gray-800'}`}
        >
          다음 단계
          <ChevronRight className="w-4 h-4 ml-0.5 md:w-5 md:h-5 md:ml-1" />
        </Button>
      </div>
    </div>
  )
}
