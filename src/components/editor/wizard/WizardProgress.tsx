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

interface WizardProgressProps {
  isOurTemplate?: boolean
}

export function WizardStepHeader({ isOurTemplate }: WizardProgressProps) {
  const { wizardStep } = useEditorStore()

  if (!isOurTemplate) return null

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
        {String(wizardStep).padStart(2, '0')}
      </div>
      <h2 className="text-[22px] font-semibold tracking-tight text-[#2C2824]" style={{ marginTop: '-12px' }}>
        {STEP_INFO[wizardStep - 1].label}
      </h2>
      {STEP_INFO[wizardStep - 1].optional && (
        <span className="text-sm text-[#8A8580] mt-1.5 inline-block">선택사항</span>
      )}
      <div
        className="mt-5"
        style={{ height: '1px', background: 'linear-gradient(to right, rgba(163,126,105,0.12), transparent 70%)' }}
      />
    </div>
  )
}

export default function WizardProgress({ isOurTemplate }: WizardProgressProps) {
  const { wizardStep, setWizardStep, wizardVisitedSteps, wizardSavedSteps, validateWizardStep } = useEditorStore()

  const progressPercent = Math.round((wizardStep / 5) * 100)

  const handleStepClick = (step: WizardStep) => {
    setWizardStep(step)
    // 스크롤 최상단 이동
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const wizardScroll = document.getElementById('wizard-scroll-area')
        if (wizardScroll && wizardScroll.scrollHeight > wizardScroll.clientHeight) {
          wizardScroll.scrollTop = 0
          return
        }
        const scrollContainer = document.getElementById('editor-scroll-container')
        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        }
      })
    })
  }

  const isStepSaved = (step: WizardStep) => {
    if (!wizardSavedSteps?.includes(step)) return false
    if (step === 1) {
      const validation = validateWizardStep(step)
      return validation.valid
    }
    return true
  }

  const isStepVisited = (step: WizardStep) => {
    return wizardVisitedSteps?.includes(step) || false
  }

  return (
    <div className={isOurTemplate ? 'bg-transparent' : 'border-b border-gray-100 bg-white'}>
      {/* 상단 진행률 바 */}
      <div className={`h-1 ${isOurTemplate ? 'neu-progress-bar mx-6 mt-2 rounded-full' : 'bg-gray-100'}`}>
        <div
          className={`h-full transition-all duration-300 ease-out ${isOurTemplate ? 'neu-progress-fill rounded-full' : 'bg-black'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step 표시 */}
      <div className={isOurTemplate ? 'px-4 sm:px-8 py-3' : 'px-6 py-4'}>
        {!isOurTemplate && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-gray-900">
              {STEP_INFO[wizardStep - 1].label}
            </h2>
            <span className="text-sm text-gray-500">
              {STEP_INFO[wizardStep - 1].optional && (
                <span className="mr-2 text-gray-400">선택</span>
              )}
              {wizardStep}/5
            </span>
          </div>
        )}

        {/* Step 인디케이터 */}
        <div className={`flex items-center ${isOurTemplate ? 'gap-2 sm:gap-5' : 'gap-2'}`}>
          {STEP_INFO.map(({ step, shortLabel }) => {
            const isSaved = isStepSaved(step)
            const isCurrent = step === wizardStep
            const isVisited = isStepVisited(step)

            if (isOurTemplate) {
              return (
                <button
                  key={step}
                  onClick={() => handleStepClick(step)}
                  className={`pb-1 text-[11px] sm:text-xs tracking-wider transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                    isCurrent
                      ? 'neu-tab-active'
                      : isSaved
                      ? 'neu-tab text-[#A37E69]'
                      : isVisited
                      ? 'neu-tab text-[#8A8580]'
                      : 'neu-tab'
                  }`}
                >
                  <span className="text-[9px] sm:text-[10px] font-bold">{String(step).padStart(2, '0')}</span>
                  {shortLabel}
                  {isSaved && !isCurrent && <Check className="w-3 h-3" />}
                </button>
              )
            }

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
