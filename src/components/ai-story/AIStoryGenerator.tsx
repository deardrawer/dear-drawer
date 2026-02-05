'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import ProfileForm from './ProfileForm'
import StoryForm from './StoryForm'
import ParentsGreetingForm, { defaultParentsGreetingForm, ParentsGreetingFormData } from './ParentsGreetingForm'
import WhyWeChoseForm from './WhyWeChoseForm'
import InterviewForm from './InterviewForm'
import ThanksForm from './ThanksForm'
import ResultViewer from './ResultViewer'
import {
  StepId,
  Step,
  STEPS,
  FAMILY_STEPS,
  GeneratedContent,
  defaultGreetingForm,
  defaultProfileForm,
  defaultStoryForm,
  defaultInterviewForm,
  defaultWhyWeChoseForm,
} from '@/types/ai-generator'
import type { AllFormData } from '@/types/ai-generator'

// localStorage 키 (기존 청첩장용 - invitationId가 있는 경우에만 사용)
const STORAGE_KEY = 'ai-story-generator-data'
const RESULT_STORAGE_KEY = 'ai-story-generator-result'
// 새 템플릿의 경우 storage를 사용하지 않음 (React 상태만 사용)
// 같은 페이지에 있는 동안만 데이터 유지, 페이지 이동시 초기화됨

interface StoredData {
  formData: AllFormData
  currentStep: StepId
  invitationId?: string // 어떤 청첩장에 대한 데이터인지 추적
  templateId?: string // 새 템플릿의 경우 template 파라미터 추적
}

interface AIStoryGeneratorProps {
  onApply?: (content: GeneratedContent) => void
  groomName?: string
  brideName?: string
  invitationId?: string // 현재 편집 중인 청첩장 ID
  templateId?: string // 새 템플릿의 경우 template 파라미터
  onClose?: () => void
}

// 데이터 불러오기
// invitationId 있을 때만 localStorage 사용 (기존 청첩장 편집)
// 새 템플릿(invitationId 없음)은 storage 사용 안함 - React 상태만 사용
function loadStoredData(invitationId?: string): StoredData | null {
  if (typeof window === 'undefined') return null
  if (!invitationId) return null // 새 템플릿은 storage 사용 안함

  try {
    // 기존 청첩장: localStorage 사용
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as StoredData
      if (data.invitationId === invitationId) {
        return data
      }
    }
  } catch {
    // 파싱 오류 무시
  }
  return null
}

// 결과 불러오기
// invitationId 있을 때만 localStorage 사용
function loadStoredResult(invitationId?: string): GeneratedContent | null {
  if (typeof window === 'undefined') return null
  if (!invitationId) return null // 새 템플릿은 storage 사용 안함

  try {
    // 기존 청첩장: localStorage 사용
    const stored = localStorage.getItem(RESULT_STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as { result: GeneratedContent; invitationId?: string }
      if (data.invitationId === invitationId) {
        return data.result
      }
    }
  } catch {
    // 파싱 오류 무시
  }
  return null
}

// 데이터 저장
// invitationId 있을 때만 localStorage 저장
function saveData(data: StoredData) {
  if (typeof window === 'undefined') return
  if (!data.invitationId) return // 새 템플릿은 storage 저장 안함

  // 기존 청첩장: localStorage에 저장
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 결과 저장
// invitationId 있을 때만 localStorage 저장
function saveResult(result: GeneratedContent | null, invitationId?: string) {
  if (typeof window === 'undefined') return
  if (!result) return
  if (!invitationId) return // 새 템플릿은 storage 저장 안함

  localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ result, invitationId }))
}

// 데이터 삭제
// invitationId 있을 때만 localStorage 삭제
function clearStoredData(invitationId?: string) {
  if (typeof window === 'undefined') return
  if (!invitationId) return // 새 템플릿은 storage 사용 안함

  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(RESULT_STORAGE_KEY)
}

export default function AIStoryGenerator({
  onApply,
  groomName = '',
  brideName = '',
  invitationId,
  templateId,
  onClose
}: AIStoryGeneratorProps) {
  // FAMILY 템플릿 여부 확인
  const isFamilyTemplate = templateId === 'narrative-family'

  // 현재 템플릿에 맞는 스텝 사용
  const currentSteps: Step[] = isFamilyTemplate ? FAMILY_STEPS : STEPS

  // 초기 상태 생성
  const createInitialFormData = useCallback((): AllFormData => ({
    greeting: defaultGreetingForm,
    groomProfile: { ...defaultProfileForm, name: groomName },
    brideProfile: { ...defaultProfileForm, name: brideName },
    story: defaultStoryForm,
    interview: defaultInterviewForm,
    parentsGreeting: { ...defaultParentsGreetingForm, childName: brideName || groomName },
    whyWeChose: { ...defaultWhyWeChoseForm, groomName: groomName || '', brideName: brideName || '' },
  }), [groomName, brideName])

  // OUR 템플릿은 'profile', FAMILY 템플릿은 'whyWeChose'로 시작
  const [currentStep, setCurrentStep] = useState<StepId>(isFamilyTemplate ? 'whyWeChose' : 'profile')
  const [formData, setFormData] = useState<AllFormData>(createInitialFormData)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // 컴포넌트 마운트 시 저장된 데이터 복원
  // invitationId가 있을 때만 localStorage에서 복원
  // 새 템플릿(invitationId 없음)은 항상 초기 상태로 시작
  useEffect(() => {
    const storedData = loadStoredData(invitationId)
    const storedResult = loadStoredResult(invitationId)

    if (storedData) {
      setFormData(storedData.formData)
      // 저장된 스텝이 현재 템플릿에 유효한지 확인
      const validSteps = isFamilyTemplate
        ? ['whyWeChose', 'interview', 'thanks', 'result']
        : ['profile', 'story', 'interview', 'thanks', 'result']
      if (validSteps.includes(storedData.currentStep)) {
        setCurrentStep(storedData.currentStep)
      } else {
        // 유효하지 않으면 첫 스텝으로 설정
        setCurrentStep(isFamilyTemplate ? 'whyWeChose' : 'profile')
      }
    } else {
      // 저장된 데이터가 없으면 초기화
      setFormData(createInitialFormData())
      // OUR 템플릿은 'profile', FAMILY 템플릿은 'whyWeChose'로 시작
      setCurrentStep(isFamilyTemplate ? 'whyWeChose' : 'profile')
    }

    if (storedResult) {
      setGeneratedContent(storedResult)
    } else {
      setGeneratedContent(null)
    }

    setIsInitialized(true)
  }, [invitationId, createInitialFormData, isFamilyTemplate])

  // formData 변경 시 저장 (invitationId 있을 때만)
  useEffect(() => {
    if (!isInitialized) return
    if (!invitationId) return // 새 템플릿은 storage 저장 안함

    saveData({
      formData,
      currentStep,
      invitationId,
    })
  }, [formData, currentStep, invitationId, isInitialized])

  // 결과 변경 시 저장 (invitationId 있을 때만)
  useEffect(() => {
    if (!isInitialized) return
    if (!invitationId) return // 새 템플릿은 storage 저장 안함

    if (generatedContent) {
      saveResult(generatedContent, invitationId)
    }
  }, [generatedContent, invitationId, isInitialized])

  const currentStepIndex = currentSteps.findIndex((s) => s.id === currentStep)
  const currentStepData = currentSteps[currentStepIndex]

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId)
    setError(null)
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < currentSteps.length) {
      setCurrentStep(currentSteps[nextIndex].id)
      setError(null)
    }
  }

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(currentSteps[prevIndex].id)
      setError(null)
    }
  }

  // 새로 시작 (모든 데이터 초기화)
  const handleReset = () => {
    const confirmed = window.confirm('입력한 모든 내용이 삭제됩니다. 계속하시겠습니까?')
    if (confirmed) {
      clearStoredData(invitationId)
      setFormData(createInitialFormData())
      setGeneratedContent(null)
      // OUR 템플릿은 'profile', FAMILY 템플릿은 'whyWeChose'로 시작
      setCurrentStep(isFamilyTemplate ? 'whyWeChose' : 'profile')
      setError(null)
    }
  }

  const generateContent = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // FAMILY 템플릿: whyWeChose 폼에서 이름 가져오기
      // OUR 템플릿: groomProfile/brideProfile에서 이름 가져오기
      const finalGroomName = isFamilyTemplate
        ? (formData.whyWeChose?.groomName || groomName)
        : (formData.groomProfile.name || groomName)
      const finalBrideName = isFamilyTemplate
        ? (formData.whyWeChose?.brideName || brideName)
        : (formData.brideProfile.name || brideName)

      const response = await fetch('/api/ai/story/full-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          groomName: finalGroomName,
          brideName: finalBrideName,
          templateId, // FAMILY 템플릿 구분용
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(errorData.error || '생성에 실패했습니다.')
      }

      const result = await response.json() as GeneratedContent
      setGeneratedContent(result)
      setCurrentStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }, [formData, groomName, brideName, templateId, isFamilyTemplate])

  const regenerateSection = useCallback(async (section: string) => {
    if (!generatedContent) return

    setIsGenerating(true)
    setError(null)

    try {
      // FAMILY 템플릿: whyWeChose 폼에서 이름 가져오기
      // OUR 템플릿: groomProfile/brideProfile에서 이름 가져오기
      const finalGroomName = isFamilyTemplate
        ? (formData.whyWeChose?.groomName || groomName)
        : (formData.groomProfile.name || groomName)
      const finalBrideName = isFamilyTemplate
        ? (formData.whyWeChose?.brideName || brideName)
        : (formData.brideProfile.name || brideName)

      const response = await fetch('/api/ai/story/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          formData,
          groomName: finalGroomName,
          brideName: finalBrideName,
          currentContent: generatedContent,
        }),
      })

      if (!response.ok) {
        throw new Error('재생성에 실패했습니다.')
      }

      const result = await response.json() as {
        content?: string
        interview?: GeneratedContent['interview']
        story?: GeneratedContent['story']
      }

      // Update the specific section
      if (section === 'story') {
        // 전체 스토리 재생성: API가 { story: { first, together, preparation } }를 반환
        setGeneratedContent({
          ...generatedContent,
          story: result.story || generatedContent.story,
        })
      } else if (section.startsWith('story.')) {
        // 스토리 개별 섹션 재생성
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
  }, [formData, generatedContent, groomName, brideName, isFamilyTemplate])

  const handleApply = (content: GeneratedContent) => {
    onApply?.(content)
    onClose?.()
  }

  // 로딩 중 표시
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Step Progress */}
      <div className="flex items-center justify-center px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {currentSteps.map((step, index) => (
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

        {/* FAMILY 템플릿: 서로를 선택한 이유 */}
        {currentStep === 'whyWeChose' && formData.whyWeChose && (
          <WhyWeChoseForm
            data={formData.whyWeChose}
            onChange={(data) => setFormData({ ...formData, whyWeChose: data })}
          />
        )}

        {currentStep === 'interview' && (
          <InterviewForm
            data={formData.interview}
            onChange={(data) => setFormData({ ...formData, interview: data })}
          />
        )}

        {currentStep === 'thanks' && (
          <ThanksForm
            data={formData.greeting}
            onChange={(data) => setFormData({ ...formData, greeting: data })}
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStepIndex === 0}
            className="text-sm"
          >
            이전
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            새로 시작
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 결과가 있으면 결과 보기 버튼 표시 */}
          {generatedContent && currentStep !== 'result' && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep('result')}
              className="text-sm text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              결과 보기
            </Button>
          )}

          {currentStep === 'thanks' ? (
            <Button
              onClick={generateContent}
              disabled={isGenerating}
              className="bg-rose-500 hover:bg-rose-600 text-white text-sm"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  생성 중...
                </>
              ) : (
                '초안 생성하기'
              )}
            </Button>
          ) : currentStep === 'result' ? (
            generatedContent && (
              <Button
                onClick={() => handleApply(generatedContent)}
                className="bg-rose-500 hover:bg-rose-600 text-white text-sm"
              >
                에디터에 적용하기
              </Button>
            )
          ) : (
            <Button
              onClick={goNext}
              className="bg-rose-500 hover:bg-rose-600 text-white text-sm"
            >
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// 외부에서 데이터 초기화를 위한 함수 export
export function clearAIStoryData() {
  clearStoredData()
}
