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
import { aiQuestions, familyWhyWeChoseQuestions, groomQuoteOptions, brideQuoteOptions, AIQuestion } from '@/lib/ai-questions'
import { GeneratedStory, FamilyWhyWeChoseStory } from '@/app/api/ai/generate-story/route'

type Step = 'questions' | 'generating' | 'results'
type TemplateType = 'default' | 'family'

// FAMILY 템플릿 전체 결과 타입
export type FamilyGeneratedResult = FamilyWhyWeChoseStory & {
  groomQuote: string
  brideQuote: string
  interview: GeneratedStory
}

const exampleAnswers: Record<string, string> = {
  // 기본 질문 예시
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
  // FAMILY 서로를 선택한 이유 예시
  groom_self_personality: '급하고 걱정이 많은 편이에요. 계획대로 되지 않으면 불안해합니다.',
  groom_self_weakness: '감정 표현이 서툴러요. 고마운 마음도 잘 말하지 못해요.',
  groom_partner_complement: '제가 급할 때 차분하게 정리해주고, 괜찮다고 안심시켜줘요.',
  bride_self_personality: '감성적이고 예민한 편이에요. 작은 일에도 쉽게 울어요.',
  bride_self_weakness: '결정을 잘 못해요. 우유부단하다는 말을 많이 들어요.',
  bride_partner_complement: '결정을 못할 때 방향을 제시해주고, 힘들 때 묵묵히 곁에 있어줘요.',
}

const sectionLabels: Record<keyof GeneratedStory, { title: string; description: string }> = {
  ourStory: {
    title: '두 분은 어떻게 만나셨나요?',
    description: '두 사람의 만남과 사랑 이야기',
  },
  decision: {
    title: '결혼을 결심하게 된 계기는?',
    description: '결혼을 결심하게 된 계기',
  },
  invitation: {
    title: '하객분들께 전하고 싶은 말씀은?',
    description: '하객들에게 전하는 인사',
  },
}

interface StoryGeneratorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateType?: TemplateType
  onComplete: (story: GeneratedStory) => void
  onFamilyComplete?: (story: FamilyGeneratedResult) => void
}

export default function StoryGeneratorModal({
  open,
  onOpenChange,
  templateType = 'default',
  onComplete,
  onFamilyComplete,
}: StoryGeneratorModalProps) {
  const [step, setStep] = useState<Step>('questions')
  const [phase, setPhase] = useState<'whyWeChose' | 'interview'>('whyWeChose') // FAMILY용 단계
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')

  // 결과 상태
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null)
  const [familyWhyWeChose, setFamilyWhyWeChose] = useState<FamilyWhyWeChoseStory | null>(null)
  const [groomQuote, setGroomQuote] = useState(groomQuoteOptions[0])
  const [brideQuote, setBrideQuote] = useState(brideQuoteOptions[0])

  const [isLoading, setIsLoading] = useState(false)
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 현재 질문 세트 결정
  const getCurrentQuestions = (): AIQuestion[] => {
    if (templateType === 'family') {
      return phase === 'whyWeChose' ? familyWhyWeChoseQuestions : aiQuestions
    }
    return aiQuestions
  }

  const questions = getCurrentQuestions()
  const currentQuestion: AIQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleNext = () => {
    if (currentAnswer.trim() || !currentQuestion.required) {
      const newAnswers = {
        ...answers,
        [currentQuestion.id]: currentAnswer.trim(),
      }
      setAnswers(newAnswers)
      setCurrentAnswer('')

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // 마지막 질문
        if (templateType === 'family' && phase === 'whyWeChose') {
          // FAMILY: 서로를 선택한 이유 질문 완료 → 인터뷰 질문으로
          generateFamilyWhyWeChose(newAnswers)
        } else {
          // 기본 또는 FAMILY 인터뷰 완료
          generateStory(newAnswers)
        }
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setCurrentAnswer(answers[questions[currentQuestionIndex - 1].id] || '')
    }
  }

  const handleSkip = () => {
    if (!currentQuestion.required) {
      setCurrentAnswer('')
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        if (templateType === 'family' && phase === 'whyWeChose') {
          generateFamilyWhyWeChose(answers)
        } else {
          generateStory(answers)
        }
      }
    }
  }

  const handleExampleAnswer = () => {
    const example = exampleAnswers[currentQuestion.id]
    if (example) {
      setCurrentAnswer(example)
    }
  }

  // FAMILY: 서로를 선택한 이유 생성
  const generateFamilyWhyWeChose = async (whyWeChoseAnswers: Record<string, string>) => {
    setStep('generating')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: whyWeChoseAnswers,
          templateType: 'family-why-we-chose'
        }),
      })

      if (!response.ok) {
        const errorData: { error?: string } = await response.json()
        throw new Error(errorData.error || '스토리 생성에 실패했습니다.')
      }

      const story: FamilyWhyWeChoseStory = await response.json()
      setFamilyWhyWeChose(story)

      // 인터뷰 질문으로 이동
      setPhase('interview')
      setCurrentQuestionIndex(0)
      setStep('questions')
    } catch (err) {
      setError(err instanceof Error ? err.message : '스토리 생성 중 오류가 발생했습니다.')
      setStep('questions')
    } finally {
      setIsLoading(false)
    }
  }

  // 기본/인터뷰 스토리 생성
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
        const errorData: { error?: string } = await response.json()
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
        const errorData: { error?: string } = await response.json()
        throw new Error(errorData.error || '섹션 재생성에 실패했습니다.')
      }

      const result: Record<string, string> = await response.json()
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

  // FAMILY: 서로를 선택한 이유 재생성
  const handleRegenerateFamilySection = async (section: 'groomDescription' | 'brideDescription') => {
    if (!familyWhyWeChose) return

    setRegeneratingSection(section)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          templateType: 'family-why-we-chose'
        }),
      })

      if (!response.ok) {
        const errorData: { error?: string } = await response.json()
        throw new Error(errorData.error || '섹션 재생성에 실패했습니다.')
      }

      const result: FamilyWhyWeChoseStory = await response.json()
      setFamilyWhyWeChose({
        ...familyWhyWeChose,
        [section]: result[section],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '섹션 재생성 중 오류가 발생했습니다.')
    } finally {
      setRegeneratingSection(null)
    }
  }

  const handleBackToQuestions = () => {
    if (templateType === 'family') {
      // FAMILY: 서로를 선택한 이유 질문으로 돌아가기
      setPhase('whyWeChose')
    }
    setStep('questions')
    setCurrentQuestionIndex(0)
    const firstQuestion = templateType === 'family' ? familyWhyWeChoseQuestions[0] : aiQuestions[0]
    setCurrentAnswer(answers[firstQuestion.id] || '')
  }

  const handleUseStory = () => {
    if (templateType === 'family' && familyWhyWeChose && generatedStory && onFamilyComplete) {
      onFamilyComplete({
        groomDescription: familyWhyWeChose.groomDescription,
        brideDescription: familyWhyWeChose.brideDescription,
        groomQuote,
        brideQuote,
        interview: generatedStory,
      })
    } else if (generatedStory) {
      onComplete(generatedStory)
    }
    onOpenChange(false)
  }

  const resetModal = () => {
    setStep('questions')
    setPhase('whyWeChose')
    setCurrentQuestionIndex(0)
    setAnswers({})
    setCurrentAnswer('')
    setGeneratedStory(null)
    setFamilyWhyWeChose(null)
    setGroomQuote(groomQuoteOptions[0])
    setBrideQuote(brideQuoteOptions[0])
    setError(null)
  }

  // 현재 단계 타이틀
  const getStepTitle = () => {
    if (step === 'generating') return 'AI가 스토리를 작성 중입니다...'
    if (step === 'results') return '생성된 스토리'
    if (templateType === 'family') {
      return phase === 'whyWeChose' ? '서로를 선택한 이유' : '인터뷰 질문'
    }
    return 'AI 스토리 생성'
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
          <DialogTitle>{getStepTitle()}</DialogTitle>
          {templateType === 'family' && step === 'questions' && (
            <p className="text-sm text-gray-500 mt-1">
              {phase === 'whyWeChose' ? '1단계: 서로를 선택한 이유' : '2단계: 인터뷰'}
            </p>
          )}
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
                {/* FAMILY whyWeChose 단계: 신랑/신부 구분 표시 */}
                {templateType === 'family' && phase === 'whyWeChose' && currentQuestion.person ? (
                  <span>
                    {currentQuestion.person === 'groom' ? '신랑' : '신부'}{' '}
                    {currentQuestion.person === 'groom'
                      ? currentQuestionIndex + 1
                      : currentQuestionIndex - 2}{' '}
                    / 3
                  </span>
                ) : (
                  <span>질문 {currentQuestionIndex + 1} / {questions.length}</span>
                )}
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4">
              <div>
                {/* B: 신랑/신부 배지 표시 */}
                {templateType === 'family' && phase === 'whyWeChose' && currentQuestion.person && (
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${
                      currentQuestion.person === 'groom'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-pink-100 text-pink-700'
                    }`}
                  >
                    {currentQuestion.person === 'groom' ? '👨 신랑' : '👩 신부'}
                  </span>
                )}
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
                  {currentQuestionIndex === questions.length - 1
                    ? (templateType === 'family' && phase === 'whyWeChose' ? '다음 단계로' : 'AI 생성 시작')
                    : '다음'}
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
              {templateType === 'family' && phase === 'whyWeChose'
                ? '"서로를 선택한 이유"를 작성하고 있습니다...'
                : '청첩장 문구를 작성하고 있습니다...'}
            </p>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && (
          <div className="space-y-4">
            {/* FAMILY: 서로를 선택한 이유 결과 */}
            {templateType === 'family' && familyWhyWeChose && (
              <>
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-medium text-gray-900 mb-3">서로를 선택한 이유</h3>

                  {/* 신랑 Description */}
                  <Card className="mb-3">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">신랑이 선택한 이유</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateFamilySection('groomDescription')}
                          disabled={regeneratingSection !== null}
                        >
                          {regeneratingSection === 'groomDescription' ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                              재생성 중
                            </span>
                          ) : '재생성'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                        {familyWhyWeChose.groomDescription}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 신랑 Quote 선택 */}
                  <div className="mb-4 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">신랑 마무리 한마디</p>
                    <div className="space-y-1">
                      {groomQuoteOptions.map((quote) => (
                        <label key={quote} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="groomQuote"
                            value={quote}
                            checked={groomQuote === quote}
                            onChange={(e) => setGroomQuote(e.target.value)}
                            className="text-rose-600"
                          />
                          <span className="text-sm text-gray-700">{quote}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 신부 Description */}
                  <Card className="mb-3">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">신부가 선택한 이유</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateFamilySection('brideDescription')}
                          disabled={regeneratingSection !== null}
                        >
                          {regeneratingSection === 'brideDescription' ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                              재생성 중
                            </span>
                          ) : '재생성'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                        {familyWhyWeChose.brideDescription}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 신부 Quote 선택 */}
                  <div className="pl-4 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">신부 마무리 한마디</p>
                    <div className="space-y-1">
                      {brideQuoteOptions.map((quote) => (
                        <label key={quote} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="brideQuote"
                            value={quote}
                            checked={brideQuote === quote}
                            onChange={(e) => setBrideQuote(e.target.value)}
                            className="text-rose-600"
                          />
                          <span className="text-sm text-gray-700">{quote}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 인터뷰 결과 */}
                {generatedStory && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">인터뷰</h3>
                    {(Object.keys(sectionLabels) as Array<keyof GeneratedStory>).map((section) => (
                      <Card key={section} className="mb-3">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm">{sectionLabels[section].title}</CardTitle>
                              <p className="text-xs text-gray-500">{sectionLabels[section].description}</p>
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
                              ) : '재생성'}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                            {generatedStory[section]}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 기본: 인터뷰 결과만 */}
            {templateType === 'default' && generatedStory && (
              <>
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
              </>
            )}

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
