'use client'

import { useEditorStore, WizardStep } from '@/store/editorStore'
import { Check } from 'lucide-react'

// 사용자 친화적 Step 이름 (템플릿 선택은 /templates 페이지에서 처리)
const STEP_INFO: { step: WizardStep; label: string; shortLabel: string; optional?: boolean }[] = [
  { step: 1, label: '디자인을 선택해주세요', shortLabel: '디자인' },
  { step: 2, label: '인트로를 꾸며볼까요?', shortLabel: '인트로', optional: true },
  { step: 3, label: '스토리를 담아보세요', shortLabel: '스토리', optional: true },
  { step: 4, label: '추가 기능을 설정해요', shortLabel: '추가기능', optional: true },
  { step: 5, label: '청첩장을 발행해요', shortLabel: '발행' },
]

export default function WizardProgress() {
  const { wizardStep, setWizardStep, wizardVisitedSteps, wizardSavedSteps, validateWizardStep } = useEditorStore()

  const progressPercent = Math.round((wizardStep / 5) * 100)

  // 자유롭게 이동 가능 (검증 없이)
  const handleStepClick = (step: WizardStep) => {
    // 스텝 변경
    setWizardStep(step)
    // DOM 업데이트 후 스크롤
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const scrollContainer = document.getElementById('editor-scroll-container')
        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        }
      })
    })
  }

  // Step 저장 완료 여부 확인 (저장된 스텝 + 검증 통과)
  const isStepSaved = (step: WizardStep) => {
    if (!wizardSavedSteps?.includes(step)) return false
    // Step 1만 필수 검증 (기본 정보)
    if (step === 1) {
      const validation = validateWizardStep(step)
      return validation.valid
    }
    return true
  }

  // Step 방문 여부
  const isStepVisited = (step: WizardStep) => {
    return wizardVisitedSteps?.includes(step) || false
  }

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* 상단 진행률 바 */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-black transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step 표시 */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-gray-900">
            {STEP_INFO[wizardStep - 1].label}
          </h2>
          <span className="text-sm text-gray-500">
            {STEP_INFO[wizardStep - 1].optional && (
              <span className="text-gray-400 mr-2">선택</span>
            )}
            {wizardStep}/5
          </span>
        </div>

        {/* Step 인디케이터 */}
        <div className="flex items-center gap-2">
          {STEP_INFO.map(({ step, shortLabel, optional }) => {
            const isSaved = isStepSaved(step)
            const isCurrent = step === wizardStep
            const isVisited = isStepVisited(step)

            return (
              <button
                key={step}
                onClick={() => handleStepClick(step)}
                className={`flex-1 py-2 text-xs rounded transition-all flex items-center justify-center gap-1 ${
                  isCurrent
                    ? 'bg-black text-white font-medium'
                    : isSaved
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : isVisited
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {isSaved && !isCurrent && <Check className="w-3 h-3" />}
                {shortLabel}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
