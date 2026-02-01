'use client'

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import ParentsWizardProgress, { ParentsWizardStep } from './ParentsWizardProgress'
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
  onPublish?: (slug: string) => Promise<void>
  onStepChange?: (step: ParentsWizardStep) => void
}

export default function ParentsWizardEditor({
  data,
  updateData,
  updateNestedData,
  invitationId,
  selectedGuest,
  onSelectGuest,
  onPublish,
  onStepChange,
}: ParentsWizardEditorProps) {
  const [currentStep, setCurrentStep] = useState<ParentsWizardStep>(1)
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
        return <ParentsStep3Content {...commonProps} />
      case 4:
        return <ParentsStep4Publish {...commonProps} onPublish={onPublish} />
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
    <div className="flex flex-col bg-white">
      {/* 진행률 표시 - sticky 상단 고정 */}
      <div className="sticky top-0 z-10 bg-white">
        <ParentsWizardProgress
          currentStep={currentStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
          visitedSteps={visitedSteps}
        />
      </div>

      {/* 스텝 콘텐츠 - 자연스러운 페이지 스크롤 */}
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          }
        >
          {renderStep()}
        </Suspense>
      </div>

      {/* 네비게이션 - sticky 하단 고정 */}
      <div className="sticky bottom-0 z-10 bg-white">
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
