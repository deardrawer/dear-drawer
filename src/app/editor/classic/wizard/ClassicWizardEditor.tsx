'use client'

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import ClassicWizardProgress, { ClassicWizardStep, ClassicWizardStepHeader } from './ClassicWizardProgress'
import ClassicWizardNavigation from './ClassicWizardNavigation'
import type { ClassicInvitationData } from '../page'

const ClassicStepDesign = lazy(() => import('./steps/ClassicStepDesign'))
const ClassicStepBasicInfo = lazy(() => import('./steps/ClassicStepBasicInfo'))
const ClassicStepGreeting = lazy(() => import('./steps/ClassicStepGreeting'))
const ClassicStepContent = lazy(() => import('./steps/ClassicStepContent'))
const ClassicStepPublish = lazy(() => import('./steps/ClassicStepPublish'))

interface Props {
  data: ClassicInvitationData
  updateData: (updates: Partial<ClassicInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  slug?: string | null
  onSave?: () => Promise<void>
  onStepChange?: (step: ClassicWizardStep) => void
  onSlugChange?: (newSlug: string) => void
  onDdayPreview?: () => void
  initialStep?: ClassicWizardStep
}

export default function ClassicWizardEditor({ data, updateData, updateNestedData, invitationId, slug, onSave, onStepChange, onSlugChange, onDdayPreview, initialStep = 1 }: Props) {
  const [currentStep, setCurrentStep] = useState<ClassicWizardStep>(initialStep)
  const [completedSteps, setCompletedSteps] = useState<ClassicWizardStep[]>([])
  const [visitedSteps, setVisitedSteps] = useState<ClassicWizardStep[]>([1])
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!visitedSteps.includes(currentStep)) setVisitedSteps(prev => [...prev, currentStep])
  }, [currentStep, visitedSteps])

  useEffect(() => { onStepChange?.(currentStep) }, [currentStep, onStepChange])

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const wizardScroll = document.getElementById('classic-wizard-scroll-area')
        if (wizardScroll && wizardScroll.scrollHeight > wizardScroll.clientHeight) {
          wizardScroll.scrollTop = 0
          return
        }
        const el = document.getElementById('classic-editor-scroll-container')
        if (el) el.scrollTop = 0
      })
    })
  }, [])

  const handleNext = useCallback(() => {
    setValidationError(null)
    if (!completedSteps.includes(currentStep)) setCompletedSteps(prev => [...prev, currentStep])
    if (currentStep < 5) { setCurrentStep((prev) => (prev + 1) as ClassicWizardStep); scrollToTop() }
  }, [currentStep, completedSteps, scrollToTop])

  const handlePrev = useCallback(() => {
    setValidationError(null)
    if (currentStep > 1) { setCurrentStep((prev) => (prev - 1) as ClassicWizardStep); scrollToTop() }
  }, [currentStep, scrollToTop])

  const handleStepClick = useCallback((step: ClassicWizardStep) => {
    setValidationError(null); setCurrentStep(step); scrollToTop()
  }, [scrollToTop])

  const commonProps = { data, updateData, updateNestedData, invitationId }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <ClassicStepDesign {...commonProps} />
      case 2: return <ClassicStepBasicInfo {...commonProps} onDdayPreview={onDdayPreview} />
      case 3: return <ClassicStepGreeting {...commonProps} />
      case 4: return <ClassicStepContent {...commonProps} />
      case 5: return <ClassicStepPublish {...commonProps} slug={slug} onSave={onSave} onSlugChange={onSlugChange} />
      default: return null
    }
  }

  return (
    <div className="flex flex-col h-full wizard-content">
      {/* 진행률 표시 - 상단 고정 */}
      <div className="shrink-0 wizard-sticky-header">
        <ClassicWizardProgress currentStep={currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} visitedSteps={visitedSteps} />
      </div>

      {/* 스크롤 가능 영역 */}
      <div className="flex-1 overflow-y-auto" id="classic-wizard-scroll-area">
        {/* 큰 숫자 헤더 */}
        <ClassicWizardStepHeader currentStep={currentStep} />

        {/* 스텝 콘텐츠 */}
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>}>
          {renderStep()}
        </Suspense>
      </div>

      {/* 네비게이션 - 하단 고정 */}
      <div className="shrink-0 wizard-sticky-footer">
        <ClassicWizardNavigation currentStep={currentStep} onNext={handleNext} onPrev={handlePrev} validationError={validationError} />
      </div>
    </div>
  )
}
