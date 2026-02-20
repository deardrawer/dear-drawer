'use client'

import { Check } from 'lucide-react'

export type FeedWizardStep = 1 | 2 | 3 | 4 | 5 | 6

const STEP_INFO: { step: FeedWizardStep; label: string; shortLabel: string; optional?: boolean }[] = [
  { step: 1, label: '디자인을 설정해주세요', shortLabel: '디자인' },
  { step: 2, label: '기본 정보를 입력해주세요', shortLabel: '인트로' },
  { step: 3, label: '포토 룸을 꾸며보세요', shortLabel: '포토룸' },
  { step: 4, label: '콘텐츠를 작성해주세요', shortLabel: '스토리', optional: true },
  { step: 5, label: '추가 기능을 설정해주세요', shortLabel: '추가기능', optional: true },
  { step: 6, label: '청첩장을 발행해요', shortLabel: '발행' },
]

interface FeedWizardProgressProps {
  currentStep: FeedWizardStep
  onStepClick: (step: FeedWizardStep) => void
  completedSteps: FeedWizardStep[]
  visitedSteps: FeedWizardStep[]
}

export default function FeedWizardProgress({
  currentStep,
  onStepClick,
  completedSteps,
  visitedSteps,
}: FeedWizardProgressProps) {
  const progressPercent = Math.round((currentStep / 6) * 100)

  const isStepCompleted = (step: FeedWizardStep) => {
    return completedSteps.includes(step)
  }

  const isStepVisited = (step: FeedWizardStep) => {
    return visitedSteps.includes(step)
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
            {STEP_INFO[currentStep - 1].label}
          </h2>
          <span className="text-sm text-gray-500">
            {STEP_INFO[currentStep - 1].optional && (
              <span className="text-gray-400 mr-2">선택</span>
            )}
            {currentStep}/6
          </span>
        </div>

        {/* Step 인디케이터 */}
        <div className="flex items-center gap-2">
          {STEP_INFO.map(({ step, shortLabel }) => {
            const isCompleted = isStepCompleted(step)
            const isCurrent = step === currentStep
            const isVisited = isStepVisited(step)

            return (
              <button
                key={step}
                onClick={() => onStepClick(step)}
                className={`flex-1 py-2 text-xs rounded transition-all flex items-center justify-center gap-1 ${
                  isCurrent
                    ? 'bg-black text-white font-medium'
                    : isCompleted
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : isVisited
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {isCompleted && !isCurrent && <Check className="w-3 h-3" />}
                {shortLabel}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
