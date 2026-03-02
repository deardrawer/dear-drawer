'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { EssayWizardStep } from './EssayWizardProgress'

interface Props {
  currentStep: EssayWizardStep
  onNext: () => void
  onPrev: () => void
  validationError?: string | null
}

export default function EssayWizardNavigation({ currentStep, onNext, onPrev, validationError }: Props) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === 5

  if (isLastStep) {
    return (
      <div className="px-9 py-5 border-t border-black/[0.04]">
        <Button variant="outline" onClick={onPrev} className="w-full btn-cta-outline neu-btn text-[#8A8580]">
          <ChevronLeft className="w-5 h-5 mr-1" />이전 단계로
        </Button>
      </div>
    )
  }

  return (
    <div className="px-9 py-5 border-t border-black/[0.04]">
      {validationError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600 whitespace-pre-line">{validationError}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onPrev} disabled={isFirstStep} className="flex-1 btn-cta-outline neu-btn text-[#8A8580]">
          <ChevronLeft className="w-5 h-5 mr-1" />이전
        </Button>
        <Button onClick={onNext} className="flex-[2] btn-cta tracking-wide neu-btn-primary">
          다음 단계<ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
