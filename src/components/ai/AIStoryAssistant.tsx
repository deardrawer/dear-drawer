'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  COUPLE_INTRO_QUESTIONS,
  OUR_STORY_QUESTIONS,
  INTERVIEW_QUESTIONS,
  type StoryQuestion,
} from '@/lib/openrouter'

type StoryType = 'couple_intro' | 'our_story' | 'interview'
type ModificationType = 'romantic' | 'concise' | 'humorous' | 'grammar' | 'custom'

interface AIStoryAssistantProps {
  type: StoryType
  groomName: string
  brideName: string
  currentText: string
  onApply: (text: string) => void
  onClose: () => void
}

const STORY_TYPE_LABELS: Record<StoryType, string> = {
  couple_intro: '커플 소개',
  our_story: '우리의 이야기',
  interview: '인터뷰',
}

const QUESTIONS_MAP: Record<StoryType, StoryQuestion[]> = {
  couple_intro: COUPLE_INTRO_QUESTIONS,
  our_story: OUR_STORY_QUESTIONS,
  interview: INTERVIEW_QUESTIONS,
}

const MODIFICATION_OPTIONS: { type: ModificationType; label: string; icon: string }[] = [
  { type: 'romantic', label: '더 로맨틱하게', icon: '💕' },
  { type: 'concise', label: '더 간결하게', icon: '✂️' },
  { type: 'humorous', label: '더 유머러스하게', icon: '😄' },
  { type: 'grammar', label: '문법/맞춤법 교정', icon: '📝' },
]

export default function AIStoryAssistant({
  type,
  groomName,
  brideName,
  currentText,
  onApply,
  onClose,
}: AIStoryAssistantProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'ai'>('ai')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [generatedText, setGeneratedText] = useState('')
  const [manualText, setManualText] = useState(currentText)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isModifying, setIsModifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customInstruction, setCustomInstruction] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const questions = QUESTIONS_MAP[type]

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleGenerate = async () => {
    // Check required fields
    const missingRequired = questions
      .filter((q) => q.required && !answers[q.id]?.trim())
      .map((q) => q.question)

    if (missingRequired.length > 0) {
      setError(`다음 질문에 답해주세요: ${missingRequired.join(', ')}`)
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          answers,
          groomName: groomName || '신랑',
          brideName: brideName || '신부',
        }),
      })

      const data: { content?: string; error?: string } = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '스토리 생성에 실패했습니다.')
      }

      setGeneratedText(data.content || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleModify = async (modificationType: ModificationType) => {
    const textToModify = generatedText || manualText
    if (!textToModify.trim()) {
      setError('수정할 텍스트가 없습니다.')
      return
    }

    if (modificationType === 'custom' && !customInstruction.trim()) {
      setError('수정 지시사항을 입력해주세요.')
      return
    }

    setIsModifying(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/story/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToModify,
          modificationType,
          customInstruction: modificationType === 'custom' ? customInstruction : undefined,
        }),
      })

      const data: { content?: string; error?: string } = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '텍스트 수정에 실패했습니다.')
      }

      setGeneratedText(data.content || '')
      setShowCustomInput(false)
      setCustomInstruction('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsModifying(false)
    }
  }

  const handleApply = () => {
    const textToApply = activeTab === 'ai' ? generatedText : manualText
    if (textToApply.trim()) {
      onApply(textToApply)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {STORY_TYPE_LABELS[type]} 작성
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'ai')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2">
            <TabsTrigger value="write">직접 작성</TabsTrigger>
            <TabsTrigger value="ai">AI 도움받기</TabsTrigger>
          </TabsList>

          {/* 직접 작성 탭 */}
          <TabsContent value="write" className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <Textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="직접 내용을 작성해주세요..."
                className="min-h-[300px] resize-none"
              />

              {/* 수정 옵션 */}
              {manualText.trim() && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">AI로 수정하기</p>
                  <div className="flex flex-wrap gap-2">
                    {MODIFICATION_OPTIONS.map((option) => (
                      <Button
                        key={option.type}
                        variant="outline"
                        size="sm"
                        disabled={isModifying}
                        onClick={() => handleModify(option.type)}
                        className="text-xs"
                      >
                        {option.icon} {option.label}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isModifying}
                      onClick={() => setShowCustomInput(!showCustomInput)}
                      className="text-xs"
                    >
                      ✏️ 직접 입력
                    </Button>
                  </div>

                  {showCustomInput && (
                    <div className="flex gap-2">
                      <Input
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        placeholder="예: 더 따뜻한 느낌으로 바꿔줘"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        disabled={isModifying || !customInstruction.trim()}
                        onClick={() => handleModify('custom')}
                      >
                        수정
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI 도움받기 탭 */}
          <TabsContent value="ai" className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* 질문 폼 */}
              {!generatedText && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    아래 질문에 답해주시면 AI가 {STORY_TYPE_LABELS[type]}를 작성해드립니다.
                  </p>
                  {questions.map((q) => (
                    <div key={q.id} className="space-y-1.5">
                      <Label className="text-sm">
                        {q.question}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder}
                      />
                    </div>
                  ))}

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        스토리 생성 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        스토리 생성하기
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* 생성된 결과 */}
              {generatedText && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">생성된 스토리</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGeneratedText('')}
                      className="text-xs text-gray-500"
                    >
                      다시 작성하기
                    </Button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {generatedText}
                    </p>
                  </div>

                  {/* 수정 옵션 */}
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">스토리 수정하기</p>
                    <div className="flex flex-wrap gap-2">
                      {MODIFICATION_OPTIONS.map((option) => (
                        <Button
                          key={option.type}
                          variant="outline"
                          size="sm"
                          disabled={isModifying}
                          onClick={() => handleModify(option.type)}
                          className="text-xs"
                        >
                          {option.icon} {option.label}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isModifying}
                        onClick={() => setShowCustomInput(!showCustomInput)}
                        className="text-xs"
                      >
                        ✏️ 직접 입력
                      </Button>
                    </div>

                    {showCustomInput && (
                      <div className="flex gap-2">
                        <Input
                          value={customInstruction}
                          onChange={(e) => setCustomInstruction(e.target.value)}
                          placeholder="예: 더 따뜻한 느낌으로 바꿔줘"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          disabled={isModifying || !customInstruction.trim()}
                          onClick={() => handleModify('custom')}
                        >
                          수정
                        </Button>
                      </div>
                    )}

                    {isModifying && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                        수정 중...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              (activeTab === 'ai' && !generatedText.trim()) ||
              (activeTab === 'write' && !manualText.trim())
            }
          >
            이 스토리 사용하기
          </Button>
        </div>
      </div>
    </div>
  )
}
