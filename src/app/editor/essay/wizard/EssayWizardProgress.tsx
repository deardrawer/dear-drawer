'use client'

import { Check } from 'lucide-react'

export type EssayWizardStep = 1 | 2 | 3 | 4 | 5

const STEP_INFO: { step: EssayWizardStep; label: string; shortLabel: string; optional?: boolean }[] = [
  { step: 1, label: '디자인', shortLabel: '디자인' },
  { step: 2, label: '기본정보', shortLabel: '기본정보' },
  { step: 3, label: '이야기', shortLabel: '이야기' },
  { step: 4, label: '부가기능', shortLabel: '부가기능', optional: true },
  { step: 5, label: '발행', shortLabel: '발행' },
]

export { STEP_INFO }

export function EssayWizardStepHeader({ currentStep }: { currentStep: EssayWizardStep }) {
  return (
    <div className="px-8 pt-6 pb-0">
      <h2 className="text-[22px] font-semibold tracking-tight text-[#2C2824]">
        {STEP_INFO[currentStep - 1].label}
      </h2>
      {STEP_INFO[currentStep - 1].optional && (
        <span className="text-sm text-[#8A8580] mt-1.5 inline-block">선택사항</span>
      )}
      <div
        className="mt-5"
        style={{ height: '1px', background: 'var(--ed-border)' }}
      />
    </div>
  )
}

interface Props {
  currentStep: EssayWizardStep
  onStepClick: (step: EssayWizardStep) => void
  completedSteps: EssayWizardStep[]
  visitedSteps: EssayWizardStep[]
}

export default function EssayWizardProgress({ currentStep, onStepClick, completedSteps, visitedSteps }: Props) {
  const progressPercent = Math.round((currentStep / 5) * 100)

  return (
    <div className="bg-transparent">
      {/* 상단 진행률 바 */}
      <div className="h-1 neu-progress-bar mx-6 mt-2 rounded-full">
        <div
          className="h-full transition-all duration-300 ease-out neu-progress-fill rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step 인디케이터 */}
      <div className="px-4 sm:px-8 py-3">
        <div className="flex items-center gap-2 sm:gap-5">
          {STEP_INFO.map(({ step, shortLabel }) => {
            const isCompleted = completedSteps.includes(step)
            const isCurrent = step === currentStep
            const isVisited = visitedSteps.includes(step)
            return (
              <button
                key={step}
                onClick={() => onStepClick(step)}
                className={`pb-1 text-[11px] sm:text-xs tracking-wider transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                  isCurrent
                    ? 'neu-tab-active'
                    : isCompleted
                    ? 'neu-tab text-[#A37E69]'
                    : isVisited
                    ? 'neu-tab text-[#8A8580]'
                    : 'neu-tab'
                }`}
              >
                {shortLabel}
                {isCompleted && !isCurrent && <Check className="w-3 h-3" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
