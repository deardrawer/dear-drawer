'use client'

import { lazy, Suspense, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Monitor, X } from 'lucide-react'
import WizardProgress, { WizardStepHeader } from './WizardProgress'
import WizardNavigation from './WizardNavigation'

// Step 컴포넌트들 (동적 로드) - 템플릿 선택은 /templates 페이지에서 처리
const Step1Style = lazy(() => import('./steps/Step2Style'))
const Step2Invitation = lazy(() => import('./steps/Step3Invitation'))
const Step3Content = lazy(() => import('./steps/Step4Content'))
const Step4MenuSettings = lazy(() => import('./steps/Step5MenuSettings'))
const Step5Publish = lazy(() => import('./steps/Step6Publish'))

// 매거진 전용 Step 컴포넌트들
const Step2Magazine = lazy(() => import('./steps/Step3Magazine'))
const Step3MagazineContent = lazy(() => import('./steps/Step4Magazine'))

// Movie 전용 Step 컴포넌트들
const Step2Film = lazy(() => import('./steps/Step2Film'))
const Step3FilmContent = lazy(() => import('./steps/Step3Film'))

// Record 전용 Step 컴포넌트들
const Step2Record = lazy(() => import('./steps/Step2Record'))
const Step3RecordContent = lazy(() => import('./steps/Step3Record'))

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
  slug?: string | null
  onSave?: () => Promise<void>
  isSaving?: boolean
  onSlugChange?: (newSlug: string) => void | Promise<void>
}

export default function WizardEditor({
  onOpenIntroSelector,
  onOpenAIStoryGenerator,
  onOpenShareModal,
  onScrollPreviewToTop,
  invitationId,
  templateId,
  slug,
  onSave,
  isSaving,
  onSlugChange,
}: WizardEditorProps) {
  const { wizardStep, invitation } = useEditorStore()
  const [showDesktopBanner, setShowDesktopBanner] = useState(true)
  const isMagazine = templateId === 'narrative-magazine' || invitation?.templateId === 'narrative-magazine'
  const isFilm = templateId === 'narrative-film' || invitation?.templateId === 'narrative-film'
  const isRecord = templateId === 'narrative-record' || invitation?.templateId === 'narrative-record'
  // 뉴모피즘 테마: 모든 템플릿에 적용 (테스트 후 분기 정리 예정)
  const isOurTemplate = true

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
        if (isMagazine) return <Step2Magazine {...props} />
        if (isFilm) return <Step2Film {...props} />
        if (isRecord) return <Step2Record {...props} />
        return <Step2Invitation {...props} />
      case 3:
        if (isMagazine) return <Step3MagazineContent />
        if (isFilm) return <Step3FilmContent {...props} />
        if (isRecord) return <Step3RecordContent {...props} />
        return <Step3Content {...props} />
      case 4:
        return <Step4MenuSettings />
      case 5:
        return <Step5Publish {...props} invitationId={invitationId} slug={slug} onSave={onSave} onOpenShareModal={onOpenShareModal} onSlugChange={onSlugChange} />
      default:
        return null
    }
  }

  return (
    <div className={`flex flex-col h-full ${isOurTemplate ? 'wizard-content' : 'bg-white'}`}>
      {/* 진행률 바 - 상단 고정 (shrink-0) */}
      <div className={`shrink-0 ${isOurTemplate ? 'wizard-sticky-header' : 'bg-white'}`}>
        <WizardProgress isOurTemplate={isOurTemplate} />
      </div>

      {/* 스크롤 가능 영역 */}
      <div className="flex-1 overflow-y-auto" id="wizard-scroll-area">
        {/* 모바일 데스크탑 안내 배너 */}
        {showDesktopBanner && (
          <div className="md:hidden mx-4 mt-3 mb-1 px-4 py-3 bg-amber-50/80 border border-amber-200/60 rounded-xl flex items-start gap-3">
            <Monitor className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-amber-800 flex-1">
              PC에서 작성하시면 미리보기를 함께 보며 더 편리하게 편집할 수 있어요.
            </p>
            <button
              onClick={() => setShowDesktopBanner(false)}
              className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 큰 숫자 헤더 */}
        <WizardStepHeader isOurTemplate={isOurTemplate} />

        {/* Step 콘텐츠 */}
        <Suspense fallback={<StepLoading />}>
          {renderStep()}
        </Suspense>
      </div>

      {/* 네비게이션 버튼 - 하단 고정 (shrink-0) */}
      <div className={`shrink-0 ${isOurTemplate ? 'wizard-sticky-footer' : 'border-t border-gray-100 bg-white'}`}>
        <WizardNavigation
          onSave={onSave}
          isSaving={isSaving}
          isOurTemplate={isOurTemplate}
        />
      </div>
    </div>
  )
}
