'use client'

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import FeedWizardProgress, { FeedWizardStep } from './FeedWizardProgress'
import FeedWizardNavigation from './FeedWizardNavigation'
import type { FeedInvitationData } from '../page'

// Lazy load step components
const FeedStep1BasicInfo = lazy(() => import('./steps/FeedStep1BasicInfo'))
const FeedStep2CoverProfile = lazy(() => import('./steps/FeedStep2CoverProfile'))
const FeedStep3Rooms = lazy(() => import('./steps/FeedStep3Rooms'))
const FeedStep4Stories = lazy(() => import('./steps/FeedStep4Stories'))
const FeedStep5Details = lazy(() => import('./steps/FeedStep5Details'))
const FeedStep6Publish = lazy(() => import('./steps/FeedStep6Publish'))

interface FeedWizardEditorProps {
  data: FeedInvitationData
  updateData: (updates: Partial<FeedInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  slug?: string | null
  onSave?: () => Promise<void>
  onStepChange?: (step: FeedWizardStep) => void
  onSlugChange?: (newSlug: string) => void
  initialStep?: FeedWizardStep
}

export default function FeedWizardEditor({
  data,
  updateData,
  updateNestedData,
  invitationId,
  slug,
  onSave,
  onStepChange,
  onSlugChange,
  initialStep = 1,
}: FeedWizardEditorProps) {
  const [currentStep, setCurrentStep] = useState<FeedWizardStep>(initialStep)
  const [completedSteps, setCompletedSteps] = useState<FeedWizardStep[]>([])
  const [visitedSteps, setVisitedSteps] = useState<FeedWizardStep[]>([1])
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
        const scrollContainer = document.getElementById('feed-editor-scroll-container')
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

    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as FeedWizardStep)
      scrollToTop()
    }
  }, [currentStep, completedSteps, scrollToTop])

  // 이전 단계
  const handlePrev = useCallback(() => {
    setValidationError(null)
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as FeedWizardStep)
      scrollToTop()
    }
  }, [currentStep, scrollToTop])

  // 특정 단계로 이동
  const handleStepClick = useCallback((step: FeedWizardStep) => {
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
        return <FeedStep1BasicInfo {...commonProps} />
      case 2:
        return <FeedStep2CoverProfile {...commonProps} />
      case 3:
        return <FeedStep3Rooms {...commonProps} />
      case 4:
        return <FeedStep4Stories {...commonProps} />
      case 5:
        return <FeedStep5Details {...commonProps} />
      case 6:
        return (
          <FeedStep6Publish
            {...commonProps}
            slug={slug}
            onSave={onSave}
            onSlugChange={onSlugChange}
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
        <FeedWizardProgress
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
        <FeedWizardNavigation
          currentStep={currentStep}
          onNext={handleNext}
          onPrev={handlePrev}
          validationError={validationError}
        />
      </div>
    </div>
  )
}
