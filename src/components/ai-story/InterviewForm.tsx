'use client'

import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  InterviewFormData,
  INTERVIEW_TOPICS,
  POPULAR_QUESTIONS,
  QUESTION_CATEGORIES,
  getQuestionText,
  Version,
} from '@/types/ai-generator'

interface InterviewFormProps {
  data: InterviewFormData
  onChange: (data: InterviewFormData) => void
  onGenerate?: () => void
  isGenerating?: boolean
}

// 버전별 제한 (둘 다 2-3개 질문, 답변 상세함만 다름)
const VERSION_LIMITS = {
  short: { topicsMin: 2, topicsMax: 3, questionsMin: 2, questionsMax: 3 },
  rich: { topicsMin: 2, topicsMax: 3, questionsMin: 2, questionsMax: 3 }
}

// 섹션 컴포넌트
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-800 border-l-4 border-rose-400 pl-3">
        {title}
      </h4>
      <div className="space-y-4 pl-1">
        {children}
      </div>
    </div>
  )
}

// 필드 라벨 컴포넌트
function FieldLabel({
  children,
  required,
  hint,
  optional
}: {
  children: React.ReactNode
  required?: boolean
  hint?: string
  optional?: boolean
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700">
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-gray-400 ml-1 text-xs">(선택)</span>}
      </Label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

// 버전 카드 컴포넌트
function VersionCard({
  selected,
  onClick,
  children
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}

// 질문 카테고리 컴포넌트
function QuestionCategory({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-l-4 border-rose-200 pl-4 space-y-3">
      <h4 className="font-semibold text-gray-800">{title}</h4>
      {children}
    </div>
  )
}

export default function InterviewForm({
  data,
  onChange,
  onGenerate,
  isGenerating
}: InterviewFormProps) {
  const limits = VERSION_LIMITS[data.version]

  const updateField = <K extends keyof InterviewFormData>(
    field: K,
    value: InterviewFormData[K]
  ) => {
    const newData = { ...data, [field]: value }
    onChange(newData)
  }

  // 버전 변경시 선택 초기화
  const handleVersionChange = (version: Version) => {
    const newData = {
      ...data,
      version,
      topics: [],
      selectedQuestions: [],
      customQuestions: []
    }
    onChange(newData)
  }

  // 주제 토글
  const toggleTopic = (topicId: string) => {
    const current = data.topics || []
    let newTopics: string[]

    if (current.includes(topicId)) {
      newTopics = current.filter((t) => t !== topicId)
    } else if (current.length < limits.topicsMax) {
      newTopics = [...current, topicId]
    } else {
      return
    }

    const newData = { ...data, topics: newTopics }
    onChange(newData)
  }

  // 질문 토글
  const toggleQuestion = (qId: string) => {
    const current = data.selectedQuestions || []
    let newQuestions: string[]

    if (current.includes(qId)) {
      newQuestions = current.filter((q) => q !== qId)
    } else if (current.length < limits.questionsMax) {
      newQuestions = [...current, qId]
    } else {
      return
    }

    const newData = { ...data, selectedQuestions: newQuestions }
    onChange(newData)
  }

  // 직접 입력 질문 추가
  const addQuestion = () => {
    const current = data.customQuestions || []
    if (current.length >= limits.questionsMax) return

    const newData = {
      ...data,
      customQuestions: [
        ...current,
        { question: '', answerStyle: 'together' as const }
      ]
    }
    onChange(newData)
  }

  // 질문 삭제
  const removeQuestion = (index: number) => {
    const current = data.customQuestions || []
    const newData = {
      ...data,
      customQuestions: current.filter((_, i) => i !== index)
    }
    onChange(newData)
  }

  // 질문 업데이트
  const updateQuestion = (index: number, field: 'question' | 'answerStyle', value: string) => {
    const current = data.customQuestions || []
    const updated = [...current]
    updated[index] = { ...updated[index], [field]: value }
    const newData = { ...data, customQuestions: updated }
    onChange(newData)
  }

  // 힌트 업데이트
  const updateHint = (key: string, type: 'groom' | 'bride' | 'joint', value: string) => {
    const hints = { ...(data.hints || {}) }
    hints[key] = { ...(hints[key] || {}), [type]: value }
    const newData = { ...data, hints }
    onChange(newData)
  }

  // 유효성 검사 (모든 타입 공통: 2-3개 질문)
  const isValid = useMemo(() => {
    if (data.type === 'auto') {
      const topicsCount = data.topics?.length || 0
      return topicsCount >= 2 && topicsCount <= 3 && !!data.answerStyle
    }

    if (data.type === 'popular') {
      const questionsCount = data.selectedQuestions?.length || 0
      return questionsCount >= 2 && questionsCount <= 3
    }

    if (data.type === 'custom') {
      const questions = data.customQuestions || []
      if (questions.length < 2 || questions.length > 3) return false
      return questions.every(q => q.question.trim() && q.answerStyle)
    }

    return false
  }, [data])

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">웨딩 인터뷰</h2>
        <p className="text-sm text-gray-500 mt-1">두 분의 생각과 마음을 담은 인터뷰를 만들어드려요</p>
      </div>

      {/* 버전 선택 */}
      <Section title="답변 스타일을 선택해주세요">
        <div className="grid grid-cols-2 gap-4">
          <VersionCard
            selected={data.version === 'short'}
            onClick={() => handleVersionChange('short')}
          >
            <h4 className={`font-semibold ${data.version === 'short' ? 'text-rose-700' : 'text-gray-900'}`}>
              💬 간결한 답변
            </h4>
            <p className="font-semibold text-pink-600 text-sm mt-1">2-3개 질문</p>
            <p className="text-xs text-gray-600 mt-2">
              핵심 내용 중심으로 간결하게 (각 5-7문장)
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600 leading-relaxed">
              <p className="font-medium mb-1">예시:</p>
              <p className="whitespace-pre-line">{`일상 속 사소한 순간부터
슬픔과 기쁨까지
모든 걸 함께 나눌 수 있고,
어떤 일이 있을 때 가장 먼저 떠올릴 수 있는
내 편이 생긴다는 게
제일 큰 행복이라고 생각해요.`}</p>
            </div>
          </VersionCard>

          <VersionCard
            selected={data.version === 'rich'}
            onClick={() => handleVersionChange('rich')}
          >
            <h4 className={`font-semibold ${data.version === 'rich' ? 'text-rose-700' : 'text-gray-900'}`}>
              📝 풍부한 답변
            </h4>
            <p className="font-semibold text-pink-600 text-sm mt-1">2-3개 질문</p>
            <p className="text-xs text-gray-600 mt-2">
              구체적인 에피소드와 디테일 포함 (각 10-15문장)
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600 leading-relaxed">
              <p className="font-medium mb-1">예시:</p>
              <p className="whitespace-pre-line">{`사실 처음부터 순탄하진 않았어요.
원래는 2023년에 결혼을 하려고 했는데
여러 사정이 겹치면서 한 번 미뤄졌거든요.

그때 이후로는
'결혼'이라는 말이 괜히 어색하게
느껴지기도 했고요.

그러다 2025년 2월,
주경의 어머니의 한마디로
모든 게 정말 일사천리로 흘러갔어요...`}</p>
            </div>
          </VersionCard>
        </div>
      </Section>

      {/* 질문 선택 방식 탭 */}
      <Tabs value={data.type} onValueChange={(v) => updateField('type', v as 'auto' | 'popular' | 'custom')}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="auto" className="text-xs sm:text-sm">
            <span className="flex flex-col items-center gap-0.5">
              <span>✨ AI 자동</span>
              <span className="text-[10px] text-rose-500 font-medium">추천</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="popular" className="text-xs sm:text-sm">
            ⭐ 인기 질문
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs sm:text-sm">
            ✏️ 직접 입력
          </TabsTrigger>
        </TabsList>

        {/* 탭 1: AI 자동 생성 */}
        <TabsContent value="auto" className="mt-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 입력하신 스토리 정보를 바탕으로 2-3개의 질문을 만들어드려요
            </p>
            <p className="text-xs text-blue-600 mt-1">
              간결한 버전: 핵심 위주 답변 (5-7문장) / 풍부한 버전: 에피소드 포함 상세 답변 (10-15문장)
            </p>
          </div>

          <div className="space-y-2">
            <FieldLabel
              required
              hint="선택하신 주제로 질문을 생성해드려요"
            >
              어떤 주제의 질문을 원하세요? (2-3개 선택)
            </FieldLabel>
            <div className="space-y-2">
              {INTERVIEW_TOPICS.map((topic) => {
                const isSelected = data.topics?.includes(topic.id)
                const isDisabled = !isSelected && (data.topics?.length || 0) >= limits.topicsMax

                return (
                  <label
                    key={topic.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all min-h-[44px] ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50'
                        : isDisabled
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTopic(topic.id)}
                      disabled={isDisabled}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{topic.label}</span>
                      <p className="text-xs text-gray-500">{topic.description}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            {data.topics && (
              <p className="text-sm text-gray-500 mt-2">
                {data.topics.length}/3 선택됨
                {data.topics.length < 2 && ' (최소 2개 선택 필요)'}
                {data.topics.length > 3 && ' (최대 3개까지)'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel required>답변 스타일</FieldLabel>
            <div className="space-y-2">
              {[
                { value: 'individual', label: '신랑/신부 각각 답변', desc: '같은 질문에 대해 각자의 답변' },
                { value: 'together', label: '함께 답변', desc: '우리의 생각을 하나로' },
                { value: 'mixed', label: '섞어서', desc: '질문에 따라 각각 또는 함께' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all min-h-[44px] ${
                    data.answerStyle === option.value
                      ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="answerStyle"
                    value={option.value}
                    checked={data.answerStyle === option.value}
                    onChange={() => updateField('answerStyle', option.value as 'individual' | 'together' | 'mixed')}
                    className="w-4 h-4 mt-0.5 text-rose-500 border-gray-300 focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{option.label}</span>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 탭 2: 인기 질문 선택 */}
        <TabsContent value="popular" className="mt-6 space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              ⭐ 가장 많이 사용하는 질문들입니다. 2-3개를 선택해주세요
            </p>
            <p className="text-xs text-purple-600 mt-1">
              간결한 버전: 핵심 위주 / 풍부한 버전: 에피소드와 디테일 포함
            </p>
          </div>

          <div className="space-y-6">
            {QUESTION_CATEGORIES.map((category) => (
              <QuestionCategory key={category.id} title={category.title}>
                <div className="space-y-2">
                  {category.questions.map((qId) => {
                    const question = POPULAR_QUESTIONS[qId]
                    if (!question) return null

                    const isSelected = data.selectedQuestions?.includes(qId)
                    const isDisabled = !isSelected && (data.selectedQuestions?.length || 0) >= limits.questionsMax

                    return (
                      <label
                        key={qId}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all min-h-[44px] ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50'
                            : isDisabled
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleQuestion(qId)}
                          disabled={isDisabled}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <span className="text-sm">{question.text}</span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {question.answerStyle === 'individual' ? '🙋‍♂️ 신랑 / 🙋‍♀️ 신부 각각 답변' : '💑 함께 답변'}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </QuestionCategory>
            ))}
          </div>

          {/* 선택된 질문 미리보기 */}
          {data.selectedQuestions && data.selectedQuestions.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">
                선택된 질문 ({data.selectedQuestions.length}개)
              </h4>
              <ul className="space-y-1">
                {data.selectedQuestions.map((qId, index) => (
                  <li key={qId} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400">{index + 1}.</span>
                    <span>{getQuestionText(qId)}</span>
                  </li>
                ))}
              </ul>
              {data.selectedQuestions.length < 2 && (
                <p className="text-sm text-orange-600 mt-2">💡 최소 2개를 선택해주세요</p>
              )}
              {data.selectedQuestions.length > 3 && (
                <p className="text-sm text-orange-600 mt-2">💡 최대 3개까지 선택 가능합니다</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* 탭 3: 직접 입력 */}
        <TabsContent value="custom" className="mt-6 space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              ✏️ 우리만의 특별한 질문을 직접 만들어보세요 (2-3개)
            </p>
            <p className="text-xs text-green-600 mt-1">
              답변 힌트를 입력하면 선택하신 버전에 맞게 답변을 작성해드려요
            </p>
          </div>

          {/* 질문 목록 */}
          <div className="space-y-4">
            {data.customQuestions?.map((q, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">질문 {index + 1}</h4>
                  {(data.customQuestions?.length || 0) > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                    >
                      삭제
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel required>질문</FieldLabel>
                  <Textarea
                    placeholder="질문을 입력해주세요"
                    value={q.question}
                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel required>답변 스타일</FieldLabel>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(index, 'answerStyle', 'individual')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all min-h-[44px] ${
                        q.answerStyle === 'individual'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      🙋‍♂️🙋‍♀️ 신랑/신부 각각 답변
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuestion(index, 'answerStyle', 'together')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs transition-all min-h-[44px] ${
                        q.answerStyle === 'together'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      💑 함께 답변
                    </button>
                  </div>
                </div>

                {/* 답변 힌트 */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <FieldLabel optional hint="답변을 작성할 때 참고할 키워드나 내용을 적어주세요">
                    답변 힌트
                  </FieldLabel>
                  {q.answerStyle === 'individual' ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="🤵 신랑 답변 힌트"
                        value={data.hints?.[`q${index}`]?.groom || ''}
                        onChange={(e) => updateHint(`q${index}`, 'groom', e.target.value)}
                        className="text-sm"
                      />
                      <Input
                        placeholder="👰 신부 답변 힌트"
                        value={data.hints?.[`q${index}`]?.bride || ''}
                        onChange={(e) => updateHint(`q${index}`, 'bride', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ) : (
                    <Input
                      placeholder="💑 답변 힌트"
                      value={data.hints?.[`q${index}`]?.joint || ''}
                      onChange={(e) => updateHint(`q${index}`, 'joint', e.target.value)}
                      className="text-sm"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 질문 추가 버튼 */}
          {(!data.customQuestions || data.customQuestions.length < limits.questionsMax) && (
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              className="w-full min-h-[44px]"
            >
              + 질문 추가하기
            </Button>
          )}

          <p className="text-sm text-gray-500 text-center">
            {data.customQuestions?.length || 0}/3개
            (최소 2개, 최대 3개)
          </p>

          {/* 질문 없을 때 안내 */}
          {(!data.customQuestions || data.customQuestions.length === 0) && (
            <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm mb-3">아직 질문이 없어요</p>
              <Button
                type="button"
                variant="outline"
                onClick={addQuestion}
                className="min-h-[44px]"
              >
                첫 번째 질문 추가하기
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 초안 생성하기 버튼 */}
      {onGenerate && (
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={onGenerate}
            disabled={!isValid || isGenerating}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white min-h-[52px] text-base font-semibold shadow-lg"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                생성 중...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                ✨ 초안 생성하기
              </span>
            )}
          </Button>
          {!isValid && (
            <p className="text-xs text-red-500 text-center mt-2">
              {data.type === 'auto' && '주제 2-3개를 선택하고 답변 스타일을 선택해주세요'}
              {data.type === 'popular' && '질문을 2-3개 선택해주세요'}
              {data.type === 'custom' && '질문을 2-3개 작성해주세요'}
            </p>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 font-medium">💡 Tip</p>
        <p className="text-xs text-blue-700 mt-1">
          인터뷰 내용은 입력하신 정보를 바탕으로 자연스럽게 만들어드려요.
          생성 후 원하는 대로 수정할 수 있어요!
        </p>
      </div>
    </div>
  )
}
