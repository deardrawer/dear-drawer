'use client'

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import ThankYouWizardProgress, { ThankYouWizardStepHeader, type ThankYouWizardStep } from './ThankYouWizardProgress'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useThankYouEditorStore } from '@/store/thankYouEditorStore'

const ThankYouStep1Design = lazy(() => import('./steps/ThankYouStep1Design'))
const ThankYouStep2Info = lazy(() => import('./steps/ThankYouStep2Info'))
const ThankYouStep3Photos = lazy(() => import('./steps/ThankYouStep3Photos'))
const ThankYouStep4Message = lazy(() => import('./steps/ThankYouStep4Message'))
const ThankYouStep5Publish = lazy(() => import('./steps/ThankYouStep5Publish'))

interface ThankYouWizardEditorProps {
  invitationId: string | null
  slug?: string | null
  onSave?: () => Promise<void>
  onSlugChange?: (newSlug: string) => void
}

export default function ThankYouWizardEditor({
  invitationId,
  slug,
  onSave,
  onSlugChange,
}: ThankYouWizardEditorProps) {
  const { wizardStep, setWizardStep } = useThankYouEditorStore()
  const [completedSteps, setCompletedSteps] = useState<ThankYouWizardStep[]>([])
  const [visitedSteps, setVisitedSteps] = useState<ThankYouWizardStep[]>([1])

  useEffect(() => {
    if (!visitedSteps.includes(wizardStep)) {
      setVisitedSteps(prev => [...prev, wizardStep])
    }
  }, [wizardStep, visitedSteps])

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const wizardScroll = document.getElementById('thankyou-wizard-scroll-area')
        if (wizardScroll && wizardScroll.scrollHeight > wizardScroll.clientHeight) {
          wizardScroll.scrollTop = 0
          return
        }
        const scrollContainer = document.getElementById('thankyou-editor-scroll-container')
        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        }
      })
    })
  }, [])

  const handleNext = useCallback(() => {
    if (!completedSteps.includes(wizardStep)) {
      setCompletedSteps(prev => [...prev, wizardStep])
    }
    if (wizardStep < 5) {
      setWizardStep((wizardStep + 1) as ThankYouWizardStep)
      scrollToTop()
    }
  }, [wizardStep, completedSteps, scrollToTop, setWizardStep])

  const handlePrev = useCallback(() => {
    if (wizardStep > 1) {
      setWizardStep((wizardStep - 1) as ThankYouWizardStep)
      scrollToTop()
    }
  }, [wizardStep, scrollToTop, setWizardStep])

  const handleStepClick = useCallback((step: ThankYouWizardStep) => {
    setWizardStep(step)
    scrollToTop()
  }, [scrollToTop, setWizardStep])

  const renderStep = () => {
    switch (wizardStep) {
      case 1:
        return <ThankYouStep1Design invitationId={invitationId} />
      case 2:
        return <ThankYouStep2Info />
      case 3:
        return <ThankYouStep3Photos invitationId={invitationId} />
      case 4:
        return <ThankYouStep4Message />
      case 5:
        return <ThankYouStep5Publish invitationId={invitationId} slug={slug} onSave={onSave} onSlugChange={onSlugChange} />
      default:
        return null
    }
  }

  const isFirstStep = wizardStep === 1
  const isLastStep = wizardStep === 5

  return (
    <div className="flex flex-col h-full wizard-content">
      <div className="shrink-0 wizard-sticky-header">
        <ThankYouWizardProgress
          currentStep={wizardStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
          visitedSteps={visitedSteps}
        />
      </div>

      <div className="flex-1 overflow-y-auto" id="thankyou-wizard-scroll-area">
        <ThankYouWizardStepHeader currentStep={wizardStep} />
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#A37E69]/30 border-t-[#A37E69] rounded-full animate-spin" />
            </div>
          }
        >
          {renderStep()}
        </Suspense>
      </div>

      <div className="shrink-0 wizard-sticky-footer">
        <div className="px-6 py-4">
          {isLastStep ? (
            <button
              onClick={handlePrev}
              className="w-full neu-btn h-11 text-sm flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              이전 단계로
            </button>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex-1 neu-btn h-11 text-sm flex items-center justify-center ${isFirstStep ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                이전
              </button>
              <button
                onClick={handleNext}
                className="flex-[2] neu-btn-primary h-11 text-sm flex items-center justify-center rounded-xl"
              >
                다음 단계
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
