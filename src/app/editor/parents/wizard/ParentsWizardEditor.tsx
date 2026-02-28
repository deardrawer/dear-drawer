'use client'

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import ParentsWizardProgress, { ParentsWizardStep, ParentsWizardStepHeader } from './ParentsWizardProgress'
import ParentsWizardNavigation from './ParentsWizardNavigation'
import type { ParentsInvitationData, ImageCropData } from '../page'

// Lazy load step components
const ParentsStep1Design = lazy(() => import('./steps/ParentsStep1Design'))
const ParentsStep2Envelope = lazy(() => import('./steps/ParentsStep2Envelope'))
const ParentsStep3Content = lazy(() => import('./steps/ParentsStep3Content'))
const ParentsStep4Publish = lazy(() => import('./steps/ParentsStep4Publish'))
const ParentsStep5Guests = lazy(() => import('./steps/ParentsStep5Guests'))

interface Guest {
  id: string
  name: string
  relation: string | null
  honorific: string
  intro_greeting: string | null
  custom_message: string | null
}

interface ParentsWizardEditorProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  selectedGuest?: { name: string; honorific: string; relation?: string; intro_greeting?: string; custom_message?: string } | null
  onSelectGuest?: (guest: { name: string; honorific: string; relation?: string; intro_greeting?: string; custom_message?: string } | null) => void
  slug?: string | null
  onSave?: () => Promise<void>
  onStepChange?: (step: ParentsWizardStep) => void
  setActiveSection?: (section: string | null) => void
  onSlugChange?: (newSlug: string) => void
  initialStep?: ParentsWizardStep // 초기 스텝 (리마운트 시 복원용)
}

export default function ParentsWizardEditor({
  data,
  updateData,
  updateNestedData,
  invitationId,
  selectedGuest,
  onSelectGuest,
  slug,
  onSave,
  onStepChange,
  setActiveSection,
  onSlugChange,
  initialStep = 1,
}: ParentsWizardEditorProps) {
  const [currentStep, setCurrentStep] = useState<ParentsWizardStep>(initialStep)
  const [completedSteps, setCompletedSteps] = useState<ParentsWizardStep[]>([])
  const [visitedSteps, setVisitedSteps] = useState<ParentsWizardStep[]>([1])
  const [validationError, setValidationError] = useState<string | null>(null)

  // 현재 스텝을 방문 처리
  useEffect(() => {
    if (!visitedSteps.includes(currentStep)) {
      setVisitedSteps(prev => [...prev, currentStep])
    }
  }, [currentStep, visitedSteps])

  // 스텝 변경 시 콜백 호출
  useEffect(() => {
    onStepChange?.(currentStep)
  }, [currentStep, onStepChange])

  // 스크롤 최상단 이동
  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 내부 위자드 스크롤 영역 먼저 시도
        const wizardScroll = document.getElementById('parents-wizard-scroll-area')
        if (wizardScroll && wizardScroll.scrollHeight > wizardScroll.clientHeight) {
          wizardScroll.scrollTop = 0
          return
        }
        // 모바일: 페이지 레벨 스크롤
        const scrollContainer = document.getElementById('parents-editor-scroll-container')
        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        }
      })
    })
  }, [])

  // 다음 단계
  const handleNext = useCallback(() => {
    setValidationError(null)

    // 현재 단계 완료 처리
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as ParentsWizardStep)
      scrollToTop()
    }
  }, [currentStep, completedSteps, scrollToTop])

  // 이전 단계
  const handlePrev = useCallback(() => {
    setValidationError(null)
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as ParentsWizardStep)
      scrollToTop()
    }
  }, [currentStep, scrollToTop])

  // 특정 단계로 이동
  const handleStepClick = useCallback((step: ParentsWizardStep) => {
    setValidationError(null)
    setCurrentStep(step)
    scrollToTop()
  }, [scrollToTop])

  // 단계별 컴포넌트 렌더링
  const renderStep = () => {
    const commonProps = {
      data,
      updateData,
      updateNestedData,
      invitationId,
    }

    switch (currentStep) {
      case 1:
        return <ParentsStep1Design {...commonProps} />
      case 2:
        return <ParentsStep2Envelope {...commonProps} />
      case 3:
        return <ParentsStep3Content {...commonProps} setActiveSection={setActiveSection} />
      case 4:
        return <ParentsStep4Publish {...commonProps} slug={slug} onSave={onSave} onSlugChange={onSlugChange} />
      case 5:
        return (
          <ParentsStep5Guests
            {...commonProps}
            selectedGuest={selectedGuest}
            onSelectGuest={onSelectGuest}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full wizard-content">
      {/* 진행률 바 - 상단 고정 (shrink-0) */}
      <div className="shrink-0 wizard-sticky-header">
        <ParentsWizardProgress
          currentStep={currentStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
          visitedSteps={visitedSteps}
        />
      </div>

      {/* 스크롤 가능 영역 */}
      <div className="flex-1 overflow-y-auto" id="parents-wizard-scroll-area">
        {/* 큰 숫자 헤더 */}
        <ParentsWizardStepHeader currentStep={currentStep} />

        {/* 스텝 콘텐츠 */}
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

      {/* 네비게이션 버튼 - 하단 고정 (shrink-0) */}
      <div className="shrink-0 wizard-sticky-footer">
        <ParentsWizardNavigation
          currentStep={currentStep}
          onNext={handleNext}
          onPrev={handlePrev}
          validationError={validationError}
        />
      </div>
    </div>
  )
}
