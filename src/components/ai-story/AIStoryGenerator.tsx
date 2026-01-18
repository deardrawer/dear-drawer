'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import GreetingForm from './GreetingForm'
import ProfileForm from './ProfileForm'
import StoryForm from './StoryForm'
import InterviewForm from './InterviewForm'
import ResultViewer from './ResultViewer'
import {
  StepId,
  STEPS,
  AllFormData,
  GeneratedContent,
  defaultGreetingForm,
  defaultProfileForm,
  defaultStoryForm,
  defaultInterviewForm,
} from '@/types/ai-generator'

interface AIStoryGeneratorProps {
  onApply?: (content: GeneratedContent) => void
  groomName?: string
  brideName?: string
}

export default function AIStoryGenerator({
  onApply,
  groomName = '',
  brideName = ''
}: AIStoryGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('greeting')
  const [formData, setFormData] = useState<AllFormData>({
    greeting: defaultGreetingForm,
    groomProfile: { ...defaultProfileForm, name: groomName },
    brideProfile: { ...defaultProfileForm, name: brideName },
    story: defaultStoryForm,
    interview: defaultInterviewForm,
  })
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)
  const currentStepData = STEPS[currentStepIndex]

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId)
    setError(null)
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
      setError(null)
    }
  }

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
      setError(null)
    }
  }

  const generateContent = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/story/full-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          groomName: formData.groomProfile.name || groomName,
          brideName: formData.brideProfile.name || brideName,
        }),
      })

      if (!response.ok) {
        throw new Error('생성에 실패했습니다.')
      }

      const result = await response.json() as GeneratedContent
      setGeneratedContent(result)
      setCurrentStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }, [formData, groomName, brideName])

  const regenerateSection = useCallback(async (section: string) => {
    if (!generatedContent) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/story/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          formData,
          groomName: formData.groomProfile.name || groomName,
          brideName: formData.brideProfile.name || brideName,
          currentContent: generatedContent,
        }),
      })

      if (!response.ok) {
        throw new Error('재생성에 실패했습니다.')
      }

      const result = await response.json() as { content?: string; interview?: GeneratedContent['interview'] }

      // Update the specific section
      if (section.startsWith('story.')) {
        const key = section.split('.')[1] as 'first' | 'together' | 'preparation'
        setGeneratedContent({
          ...generatedContent,
          story: {
            ...generatedContent.story,
            [key]: result.content,
          },
        })
      } else if (section === 'interview') {
        setGeneratedContent({
          ...generatedContent,
          interview: result.interview || generatedContent.interview,
        })
      } else {
        setGeneratedContent({
          ...generatedContent,
          [section]: result.content,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '재생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }, [formData, generatedContent, groomName, brideName])

  const handleApply = (content: GeneratedContent) => {
    onApply?.(content)
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Step Progress */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                currentStep === step.id
                  ? 'bg-rose-500 text-white'
                  : index < currentStepIndex
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {index + 1}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Title */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{currentStepData?.title}</h2>
        <p className="text-sm text-gray-500">{currentStepData?.description}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {currentStep === 'greeting' && (
          <GreetingForm
            data={formData.greeting}
            onChange={(data) => setFormData({ ...formData, greeting: data })}
          />
        )}

        {currentStep === 'profile' && (
          <div className="space-y-8">
            <ProfileForm
              data={formData.groomProfile}
              onChange={(data) => setFormData({ ...formData, groomProfile: data })}
              role="groom"
            />
            <hr className="border-gray-200" />
            <ProfileForm
              data={formData.brideProfile}
              onChange={(data) => setFormData({ ...formData, brideProfile: data })}
              role="bride"
            />
          </div>
        )}

        {currentStep === 'story' && (
          <StoryForm
            data={formData.story}
            onChange={(data) => setFormData({ ...formData, story: data })}
          />
        )}

        {currentStep === 'interview' && (
          <InterviewForm
            data={formData.interview}
            onChange={(data) => setFormData({ ...formData, interview: data })}
            onGenerate={generateContent}
            isGenerating={isGenerating}
          />
        )}

        {currentStep === 'result' && (
          <ResultViewer
            content={generatedContent}
            isLoading={isGenerating}
            onRegenerate={regenerateSection}
            onApply={handleApply}
            formData={formData}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStepIndex === 0}
        >
          이전
        </Button>

        <div className="flex gap-2">
          {/* 인터뷰 스텝에서는 폼 내부 버튼 사용, result 스텝에서는 버튼 없음 */}
          {currentStep !== 'result' && currentStep !== 'interview' && (
            <Button onClick={goNext}>
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
