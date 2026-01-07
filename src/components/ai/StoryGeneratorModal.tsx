'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { aiQuestions, AIQuestion } from '@/lib/ai-questions'
import { GeneratedStory } from '@/app/api/ai/generate-story/route'

type Step = 'questions' | 'generating' | 'results'

const exampleAnswers: Record<string, string> = {
  couple_story: '대학교 동아리에서 처음 만났어요. 같은 프로젝트 팀이 되면서 밤새 작업하다가 자연스럽게 가까워졌습니다.',
  proposal_story: '제주도 여행 중 성산일출봉에서 일출을 보며 프로포즈했어요. 해가 떠오르는 순간 반지를 꺼냈습니다.',
  wedding_theme: '따뜻하고 감성적인',
  guest_relation: '고르게 섞여 있음',
  special_message: '바쁘신 와중에도 저희의 새 출발을 축하해 주셔서 감사합니다.',
  couple_hobby: '함께 등산하는 것을 좋아해요. 주말마다 산에 다니며 많은 대화를 나눴습니다.',
  wedding_wish: '서로를 존중하고 응원하는 따뜻한 가정을 만들고 싶어요.',
  formality_level: '적당히 격식있게',
  venue_description: '한강이 보이는 호텔에서 진행해요. 통유리창으로 노을이 예쁘게 보입니다.',
  additional_info: '주차는 2시간 무료이며, 드레스코드는 세미 포멀입니다.',
}

const sectionLabels: Record<keyof GeneratedStory, { title: string; description: string }> = {
  ourStory: {
    title: '우리의 이야기',
    description: '두 사람의 만남과 사랑 이야기',
  },
  decision: {
    title: '결혼을 결심하며',
    description: '결혼을 결심하게 된 계기',
  },
  invitation: {
    title: '초대의 말씀',
    description: '하객들에게 전하는 인사',
  },
}

interface StoryGeneratorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (story: GeneratedStory) => void
}

export default function StoryGeneratorModal({
  open,
  onOpenChange,
  onComplete,
}: StoryGeneratorModalProps) {
  const [step, setStep] = useState<Step>('questions')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion: AIQuestion = aiQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / aiQuestions.length) * 100

  const handleNext = () => {
    if (currentAnswer.trim() || !currentQuestion.required) {
      const newAnswers = {
        ...answers,
        [currentQuestion.id]: currentAnswer.trim(),
      }
      setAnswers(newAnswers)
      setCurrentAnswer('')

      if (currentQuestionIndex < aiQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        generateStory(newAnswers)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setCurrentAnswer(answers[aiQuestions[currentQuestionIndex - 1].id] || '')
    }
  }

  const handleSkip = () => {
    if (!currentQuestion.required) {
      setCurrentAnswer('')
      if (currentQuestionIndex < aiQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        generateStory(answers)
      }
    }
  }

  const handleExampleAnswer = () => {
    const example = exampleAnswers[currentQuestion.id]
    if (example) {
      setCurrentAnswer(example)
    }
  }

  const generateStory = async (finalAnswers: Record<string, string>) => {
    setStep('generating')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '스토리 생성에 실패했습니다.')
      }

      const story: GeneratedStory = await response.json()
      setGeneratedStory(story)
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : '스토리 생성 중 오류가 발생했습니다.')
      setStep('questions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateSection = async (section: keyof GeneratedStory) => {
    if (!generatedStory) return

    setRegeneratingSection(section)
    setError(null)

    try {
      const response = await fetch('/api/ai/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          answers,
          currentContent: generatedStory[section],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '섹션 재생성에 실패했습니다.')
      }

      const result = await response.json()
      setGeneratedStory({
        ...generatedStory,
        [section]: result[section],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '섹션 재생성 중 오류가 발생했습니다.')
    } finally {
      setRegeneratingSection(null)
    }
  }

  const handleBackToQuestions = () => {
    setStep('questions')
    setCurrentQuestionIndex(0)
    setCurrentAnswer(answers[aiQuestions[0].id] || '')
  }

  const handleUseStory = () => {
    if (generatedStory) {
      onComplete(generatedStory)
      onOpenChange(false)
    }
  }

  const resetModal = () => {
    setStep('questions')
    setCurrentQuestionIndex(0)
    setAnswers({})
    setCurrentAnswer('')
    setGeneratedStory(null)
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetModal()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'questions' && 'AI 스토리 생성'}
            {step === 'generating' && 'AI가 스토리를 작성 중입니다...'}
            {step === 'results' && '생성된 스토리'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Questions Step */}
        {step === 'questions' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>질문 {currentQuestionIndex + 1} / {aiQuestions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {currentQuestion.question}
                  {currentQuestion.required && (
                    <span className="text-rose-500 ml-1">*</span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">{currentQuestion.description}</p>
              </div>

              {currentQuestion.type === 'select' && currentQuestion.options ? (
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={currentAnswer === option ? 'default' : 'outline'}
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => setCurrentAnswer(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  rows={4}
                  className="resize-none"
                />
              )}

              {currentQuestion.type !== 'select' && exampleAnswers[currentQuestion.id] && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:text-rose-700"
                  onClick={handleExampleAnswer}
                >
                  예시 답변 사용하기
                </Button>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                이전
              </Button>
              <div className="flex gap-2">
                {!currentQuestion.required && (
                  <Button type="button" variant="ghost" onClick={handleSkip}>
                    건너뛰기
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={currentQuestion.required && !currentAnswer.trim()}
                >
                  {currentQuestionIndex === aiQuestions.length - 1 ? 'AI 생성 시작' : '다음'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generating Step */}
        {step === 'generating' && (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-rose-200 border-t-rose-600 mb-4" />
            <p className="text-gray-600">
              AI가 두 분의 이야기를 바탕으로
              <br />
              청첩장 문구를 작성하고 있습니다...
            </p>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && generatedStory && (
          <div className="space-y-4">
            {(Object.keys(sectionLabels) as Array<keyof GeneratedStory>).map((section) => (
              <Card key={section}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {sectionLabels[section].title}
                      </CardTitle>
                      <p className="text-xs text-gray-500">
                        {sectionLabels[section].description}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateSection(section)}
                      disabled={regeneratingSection !== null}
                    >
                      {regeneratingSection === section ? (
                        <span className="flex items-center gap-1">
                          <span className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                          재생성 중
                        </span>
                      ) : (
                        '재생성'
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {generatedStory[section]}
                  </p>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleBackToQuestions}>
                질문으로 돌아가기
              </Button>
              <Button type="button" onClick={handleUseStory}>
                이대로 사용하기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
