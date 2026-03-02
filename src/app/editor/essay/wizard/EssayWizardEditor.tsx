'use client'

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import EssayWizardProgress, { EssayWizardStep, EssayWizardStepHeader } from './EssayWizardProgress'
import EssayWizardNavigation from './EssayWizardNavigation'
import type { EssayInvitationData } from '../page'

const EssayStepDesign = lazy(() => import('./steps/EssayStepDesign'))
const EssayStep1BasicInfo = lazy(() => import('./steps/EssayStep1BasicInfo'))
const EssayStep2Story = lazy(() => import('./steps/EssayStep2Story'))
const EssayStep3Details = lazy(() => import('./steps/EssayStep3Details'))
const EssayStep4Publish = lazy(() => import('./steps/EssayStep4Publish'))

interface Props {
  data: EssayInvitationData
  updateData: (updates: Partial<EssayInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  slug?: string | null
  onSave?: () => Promise<void>
  onStepChange?: (step: EssayWizardStep) => void
  onSlugChange?: (newSlug: string) => void
  initialStep?: EssayWizardStep
}

export default function EssayWizardEditor({ data, updateData, updateNestedData, invitationId, slug, onSave, onStepChange, onSlugChange, initialStep = 1 }: Props) {
  const [currentStep, setCurrentStep] = useState<EssayWizardStep>(initialStep)
  const [completedSteps, setCompletedSteps] = useState<EssayWizardStep[]>([])
  const [visitedSteps, setVisitedSteps] = useState<EssayWizardStep[]>([1])
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!visitedSteps.includes(currentStep)) setVisitedSteps(prev => [...prev, currentStep])
  }, [currentStep, visitedSteps])

  useEffect(() => { onStepChange?.(currentStep) }, [currentStep, onStepChange])

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const wizardScroll = document.getElementById('essay-wizard-scroll-area')
        if (wizardScroll && wizardScroll.scrollHeight > wizardScroll.clientHeight) {
          wizardScroll.scrollTop = 0
          return
        }
        const el = document.getElementById('essay-editor-scroll-container')
        if (el) el.scrollTop = 0
      })
    })
  }, [])

  const handleNext = useCallback(() => {
    setValidationError(null)
    if (!completedSteps.includes(currentStep)) setCompletedSteps(prev => [...prev, currentStep])
    if (currentStep < 5) { setCurrentStep((prev) => (prev + 1) as EssayWizardStep); scrollToTop() }
  }, [currentStep, completedSteps, scrollToTop])

  const handlePrev = useCallback(() => {
    setValidationError(null)
    if (currentStep > 1) { setCurrentStep((prev) => (prev - 1) as EssayWizardStep); scrollToTop() }
  }, [currentStep, scrollToTop])

  const handleStepClick = useCallback((step: EssayWizardStep) => {
    setValidationError(null); setCurrentStep(step); scrollToTop()
  }, [scrollToTop])

  const commonProps = { data, updateData, updateNestedData, invitationId }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <EssayStepDesign {...commonProps} />
      case 2: return <EssayStep1BasicInfo {...commonProps} />
      case 3: return <EssayStep2Story {...commonProps} />
      case 4: return <EssayStep3Details {...commonProps} />
      case 5: return <EssayStep4Publish {...commonProps} slug={slug} onSave={onSave} onSlugChange={onSlugChange} />
      default: return null
    }
  }

  return (
    <div className="flex flex-col h-full wizard-content">
      {/* 진행률 표시 - 상단 고정 */}
      <div className="shrink-0 wizard-sticky-header">
        <EssayWizardProgress currentStep={currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} visitedSteps={visitedSteps} />
      </div>

      {/* 스크롤 가능 영역 */}
      <div className="flex-1 overflow-y-auto" id="essay-wizard-scroll-area">
        {/* 큰 숫자 헤더 */}
        <EssayWizardStepHeader currentStep={currentStep} />

        {/* 스텝 콘텐츠 */}
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>}>
          {renderStep()}
        </Suspense>
      </div>

      {/* 네비게이션 - 하단 고정 */}
      <div className="shrink-0 wizard-sticky-footer">
        <EssayWizardNavigation currentStep={currentStep} onNext={handleNext} onPrev={handlePrev} validationError={validationError} />
      </div>
    </div>
  )
}
