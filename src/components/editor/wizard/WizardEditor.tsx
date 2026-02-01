'use client'

import { lazy, Suspense } from 'react'
import { useEditorStore } from '@/store/editorStore'
import WizardProgress from './WizardProgress'
import WizardNavigation from './WizardNavigation'

// Step 컴포넌트들 (동적 로드) - 템플릿 선택은 /templates 페이지에서 처리
const Step1Style = lazy(() => import('./steps/Step2Style'))
const Step2Invitation = lazy(() => import('./steps/Step3Invitation'))
const Step3Content = lazy(() => import('./steps/Step4Content'))
const Step4MenuSettings = lazy(() => import('./steps/Step5MenuSettings'))
const Step5Publish = lazy(() => import('./steps/Step6Publish'))

// 로딩 스피너
function StepLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
    </div>
  )
}

interface WizardEditorProps {
  onOpenIntroSelector?: () => void
  onOpenAIStoryGenerator?: () => void
  onOpenShareModal?: () => void
  onScrollPreviewToTop?: () => void
  invitationId?: string | null
  templateId?: string
  onSave?: () => void
  onPublish?: (slug: string) => Promise<void>
  isSaving?: boolean
}

export default function WizardEditor({
  onOpenIntroSelector,
  onOpenAIStoryGenerator,
  onOpenShareModal,
  onScrollPreviewToTop,
  invitationId,
  templateId,
  onSave,
  onPublish,
  isSaving,
}: WizardEditorProps) {
  const { wizardStep } = useEditorStore()

  // 현재 Step에 해당하는 컴포넌트 렌더링
  const renderStep = () => {
    const props = {
      onOpenIntroSelector,
      onOpenAIStoryGenerator,
      onScrollPreviewToTop,
      invitationId,
      templateId,
    }

    switch (wizardStep) {
      case 1:
        return <Step1Style {...props} />
      case 2:
        return <Step2Invitation {...props} />
      case 3:
        return <Step3Content {...props} />
      case 4:
        return <Step4MenuSettings />
      case 5:
        return <Step5Publish {...props} invitationId={invitationId} onPublish={onPublish} onOpenShareModal={onOpenShareModal} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col bg-white">
      {/* 진행률 바 - sticky 상단 고정 */}
      <div className="sticky top-0 z-10 bg-white">
        <WizardProgress />
      </div>

      {/* Step 콘텐츠 - 자연스러운 페이지 스크롤 */}
      <div className="flex-1">
        <Suspense fallback={<StepLoading />}>
          {renderStep()}
        </Suspense>
      </div>

      {/* 네비게이션 버튼 - sticky 하단 고정 */}
      <div className="sticky bottom-0 z-10 bg-white">
        <WizardNavigation
          onSave={onSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  )
}
