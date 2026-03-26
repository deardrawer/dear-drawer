'use client'

import { Check } from 'lucide-react'

export type ThankYouWizardStep = 1 | 2 | 3 | 4 | 5

const STEP_INFO: { step: ThankYouWizardStep; label: string; shortLabel: string }[] = [
  { step: 1, label: '디자인을 선택해주세요', shortLabel: '디자인' },
  { step: 2, label: '기본 정보를 입력해요', shortLabel: '정보' },
  { step: 3, label: '사진을 추가해요', shortLabel: '사진' },
  { step: 4, label: '감사 인사를 작성해요', shortLabel: '감사인사' },
  { step: 5, label: '감사장을 발행해요', shortLabel: '발행' },
]

export function ThankYouWizardStepHeader({ currentStep }: { currentStep: ThankYouWizardStep }) {
  return (
    <div className="px-8 pt-7 pb-0">
      <div
        style={{
          fontSize: '72px',
          fontWeight: 200,
          lineHeight: 1,
          background: 'linear-gradient(135deg, rgba(163,126,105,0.18), rgba(163,126,105,0.05))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {String(currentStep).padStart(2, '0')}
      </div>
      <h2 className="text-[22px] font-semibold tracking-tight text-[#2C2824]" style={{ marginTop: '-12px' }}>
        {STEP_INFO[currentStep - 1].label}
      </h2>
      <div
        className="mt-5"
        style={{ height: '1px', background: 'linear-gradient(to right, rgba(163,126,105,0.12), transparent 70%)' }}
      />
    </div>
  )
}

interface ThankYouWizardProgressProps {
  currentStep: ThankYouWizardStep
  onStepClick: (step: ThankYouWizardStep) => void
  completedSteps: ThankYouWizardStep[]
  visitedSteps: ThankYouWizardStep[]
}

export default function ThankYouWizardProgress({
  currentStep,
  onStepClick,
  completedSteps,
  visitedSteps,
}: ThankYouWizardProgressProps) {
  const progressPercent = Math.round((currentStep / 5) * 100)

  return (
    <div className="bg-transparent">
      <div className="h-1 neu-progress-bar mx-6 mt-2 rounded-full">
        <div
          className="h-full neu-progress-fill rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
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
                <span className="text-[9px] sm:text-[10px] font-bold">{String(step).padStart(2, '0')}</span>
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
