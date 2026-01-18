'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from '@/components/ui/card'
import { GeneratedContent, AllFormData } from '@/types/ai-generator'
import {
  getRegenStatus,
  canRegenerate,
  incrementRegenCount,
  MAX_REGEN_PER_SECTION,
  getRegenCounts,
  type RegenStatus
} from '@/lib/regen-utils'
import {
  saveGeneratedContent,
  updateGeneratedContent,
  loadGeneratedContent,
} from '@/lib/storage'

// ============================================================
// Types
// ============================================================

interface ResultViewerProps {
  content: GeneratedContent | null
  isLoading: boolean
  onRegenerate: (section: string) => void
  onApply: (content: GeneratedContent) => void
  formData?: AllFormData
}

interface SectionCardProps {
  title: string
  icon: string
  content: string
  sectionKey: string
  isEditing: boolean
  editedText: string
  isRegenerating: boolean
  regenStatus: RegenStatus
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRegenerate: () => void
  onCopy: () => void
  onTextChange: (text: string) => void
  compact?: boolean
  hideRegenerate?: boolean
}

interface InterviewItemProps {
  item: {
    question: string
    groomAnswer?: string
    brideAnswer?: string
    jointAnswer?: string
  }
  index: number
  groomName: string
  brideName: string
  isEditing: boolean
  onEdit: () => void
  onSave: (item: InterviewItemProps['item']) => void
  onCancel: () => void
}

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
}

// ============================================================
// Toast Component
// ============================================================

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  }[type]

  const icon = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠',
  }[type]

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up max-w-md`}
      role="alert"
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  )
}

// ============================================================
// RegenBadge Component
// ============================================================

function RegenBadge({ status }: { status: RegenStatus }) {
  if (status.remaining === 0) {
    return (
      <span className="text-xs text-red-500 ml-1" title="최대 재생성 횟수에 도달했습니다">
        (제한 도달)
      </span>
    )
  }

  return (
    <span
      className={`text-xs ml-1 ${status.remaining <= 2 ? 'text-amber-500' : 'text-gray-400'}`}
      title={`${status.remaining}회 남음`}
    >
      ({status.remaining}회 남음)
    </span>
  )
}

// ============================================================
// SectionCard Component
// ============================================================

function SectionCard({
  title,
  icon,
  content,
  sectionKey,
  isEditing,
  editedText,
  isRegenerating,
  regenStatus,
  onEdit,
  onSave,
  onCancel,
  onRegenerate,
  onCopy,
  onTextChange,
  compact = false,
  hideRegenerate = false,
}: SectionCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const charCount = isEditing ? editedText.length : content.length
  const canRegen = regenStatus.canRegenerate

  // 편집 모드 진입시 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
    }
  }, [isEditing])

  // 키보드 단축키
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onSave()
    }
  }

  if (compact) {
    return (
      <div
        className={`bg-gray-50 rounded-lg p-4 transition-all duration-300 ${
          isEditing ? 'ring-2 ring-rose-300 bg-rose-50/30' : ''
        } ${isRegenerating ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800">{title}</h4>
          {!isEditing && !isRegenerating && (
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                aria-label={`${title} 수정`}
              >
                수정
              </button>
              <button
                onClick={onCopy}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                aria-label={`${title} 복사`}
              >
                복사
              </button>
            </div>
          )}
          {isEditing && (
            <div className="flex gap-1">
              <button
                onClick={onCancel}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={onSave}
                className="text-xs text-white bg-rose-500 hover:bg-rose-600 px-2 py-1 rounded transition-colors"
              >
                저장
              </button>
            </div>
          )}
        </div>

        {isRegenerating ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin mr-2" />
            <span className="text-sm text-gray-500">생성 중...</span>
          </div>
        ) : isEditing ? (
          <div>
            <Textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              className="w-full text-sm resize-none"
              placeholder="내용을 입력하세요..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {charCount}자 | Ctrl+Enter로 저장, Esc로 취소
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
              {content || '(내용 없음)'}
            </p>
            <p className="text-xs text-gray-400 mt-2">{charCount}자</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card
      className={`transition-all duration-300 ${
        isEditing ? 'ring-2 ring-rose-300 shadow-lg' : 'shadow-sm'
      } ${isRegenerating ? 'opacity-60' : ''} animate-fade-in`}
    >
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>{icon}</span>
          {title}
        </CardTitle>
        <CardAction>
          {!isEditing && !isRegenerating && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="text-xs h-8"
                aria-label={`${title} 수정`}
              >
                ✏️ 수정
              </Button>
              {!hideRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={!canRegen}
                  className={`text-xs h-8 ${
                    canRegen
                      ? 'text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300'
                      : 'text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                  aria-label={`${title} 다시 생성`}
                  title={!canRegen ? '최대 재생성 횟수에 도달했습니다' : undefined}
                >
                  🔄 다시 생성
                  <RegenBadge status={regenStatus} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="text-xs h-8"
                aria-label={`${title} 복사`}
              >
                📋 복사
              </Button>
            </div>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs h-8"
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                className="text-xs h-8 bg-rose-500 hover:bg-rose-600"
              >
                저장
              </Button>
            </div>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="pt-4">
        {isRegenerating ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin mr-3" />
            <span className="text-gray-600">새로운 내용을 생성하고 있어요...</span>
          </div>
        ) : isEditing ? (
          <div>
            <Textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={8}
              className="w-full resize-none"
              placeholder="내용을 입력하세요..."
            />
            <p className="text-sm text-gray-500 mt-2 text-right">
              {charCount}자 | Ctrl+Enter로 저장, Esc로 취소
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {content || '(내용 없음)'}
            </p>
            <p className="text-sm text-gray-500 mt-4">{charCount}자</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// InterviewItem Component
// ============================================================

function InterviewItem({
  item,
  index,
  groomName,
  brideName,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: InterviewItemProps) {
  const [editedItem, setEditedItem] = useState(item)

  useEffect(() => {
    setEditedItem(item)
  }, [item])

  const handleSave = () => {
    onSave(editedItem)
  }

  return (
    <div
      className={`border-l-4 border-rose-200 pl-4 py-3 transition-all duration-300 ${
        isEditing ? 'bg-rose-50/50 border-rose-400 rounded-r-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-700 flex-1">
          Q{index + 1}. {item.question}
        </h4>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors ml-2"
            aria-label={`질문 ${index + 1} 답변 수정`}
          >
            수정
          </button>
        ) : (
          <div className="flex gap-1 ml-2">
            <button
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="text-xs text-white bg-rose-500 hover:bg-rose-600 px-2 py-1 rounded transition-colors"
            >
              저장
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {(item.groomAnswer !== undefined || !item.jointAnswer) && (
            <div>
              <label className="text-sm font-medium text-blue-600 mb-1 flex items-center gap-1">
                🙋‍♂️ {groomName}
              </label>
              <Textarea
                value={editedItem.groomAnswer || ''}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, groomAnswer: e.target.value })
                }
                rows={2}
                className="w-full text-sm"
                placeholder="신랑 답변..."
              />
            </div>
          )}

          {(item.brideAnswer !== undefined || !item.jointAnswer) && (
            <div>
              <label className="text-sm font-medium text-pink-600 mb-1 flex items-center gap-1">
                🙋‍♀️ {brideName}
              </label>
              <Textarea
                value={editedItem.brideAnswer || ''}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, brideAnswer: e.target.value })
                }
                rows={2}
                className="w-full text-sm"
                placeholder="신부 답변..."
              />
            </div>
          )}

          {item.jointAnswer !== undefined && (
            <div>
              <label className="text-sm font-medium text-purple-600 mb-1 flex items-center gap-1">
                💑 함께
              </label>
              <Textarea
                value={editedItem.jointAnswer || ''}
                onChange={(e) =>
                  setEditedItem({ ...editedItem, jointAnswer: e.target.value })
                }
                rows={2}
                className="w-full text-sm"
                placeholder="공동 답변..."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {item.groomAnswer && (
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1 flex items-center gap-1">
                🙋‍♂️ {groomName}
              </p>
              <p className="text-gray-800 whitespace-pre-wrap pl-5">
                {item.groomAnswer}
              </p>
            </div>
          )}

          {item.brideAnswer && (
            <div>
              <p className="text-sm font-medium text-pink-600 mb-1 flex items-center gap-1">
                🙋‍♀️ {brideName}
              </p>
              <p className="text-gray-800 whitespace-pre-wrap pl-5">
                {item.brideAnswer}
              </p>
            </div>
          )}

          {item.jointAnswer && (
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1 flex items-center gap-1">
                💑 함께
              </p>
              <p className="text-gray-800 whitespace-pre-wrap pl-5">
                {item.jointAnswer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Main ResultViewer Component
// ============================================================

export default function ResultViewer({
  content,
  isLoading,
  onRegenerate,
  onApply,
  formData,
}: ResultViewerProps) {
  const [editedContent, setEditedContent] = useState<GeneratedContent | null>(
    content
  )
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editedText, setEditedText] = useState('')
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(
    null
  )
  const [editingInterviewIndex, setEditingInterviewIndex] = useState<
    number | null
  >(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  } | null>(null)
  const [regenStatuses, setRegenStatuses] = useState<Record<string, RegenStatus>>({})

  // D1 저장 관련 상태
  const [savedId, setSavedId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // content 변경시 editedContent 동기화
  useEffect(() => {
    setEditedContent(content)
  }, [content])

  // 재생성 상태 업데이트
  const updateRegenStatuses = useCallback(() => {
    const sections = [
      'greeting', 'thanks', 'groomProfile', 'brideProfile',
      'story', 'story.first', 'story.together', 'story.preparation', 'interview'
    ]
    const statuses: Record<string, RegenStatus> = {}
    sections.forEach(section => {
      statuses[section] = getRegenStatus(section)
    })
    setRegenStatuses(statuses)
  }, [])

  // 컴포넌트 마운트 시 재생성 상태 로드
  useEffect(() => {
    updateRegenStatuses()
  }, [updateRegenStatuses])

  const groomName = formData?.groomProfile?.name || '신랑'
  const brideName = formData?.brideProfile?.name || '신부'

  // 토스트 표시
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      setToast({ message, type })
    },
    []
  )

  // 클립보드 복사
  const copyToClipboard = useCallback(
    async (text: string, sectionName: string) => {
      try {
        await navigator.clipboard.writeText(text)
        showToast(`${sectionName} 복사 완료!`, 'success')
      } catch {
        showToast('복사에 실패했습니다.', 'error')
      }
    },
    [showToast]
  )

  // D1 데이터베이스에 저장
  const handleSave = useCallback(async () => {
    if (!editedContent || !formData) {
      showToast('저장할 콘텐츠가 없습니다.', 'error')
      return
    }

    setIsSaving(true)

    try {
      const regenCounts = getRegenCounts()

      if (savedId) {
        // 기존 데이터 수정
        const result = await updateGeneratedContent(savedId, editedContent, regenCounts)
        if (result.success) {
          setLastSavedAt(new Date())
          showToast('수정 저장되었습니다!', 'success')
        } else {
          showToast(`저장 실패: ${result.error}`, 'error')
        }
      } else {
        // 새로 저장
        const result = await saveGeneratedContent(
          formData,
          editedContent,
          'anonymous', // TODO: 실제 사용자 ID 연동
          regenCounts
        )

        if (result.success && result.id) {
          setSavedId(result.id)
          setLastSavedAt(new Date())
          showToast(`저장되었습니다! (ID: ${result.id.slice(0, 12)}...)`, 'success')
        } else {
          showToast(`저장 실패: ${result.error}`, 'error')
        }
      }
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다.', 'error')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [editedContent, formData, savedId, showToast])

  // ID로 불러오기
  const handleLoad = useCallback(async (id: string) => {
    try {
      const result = await loadGeneratedContent(id)
      if (result.success && result.data) {
        setEditedContent(result.data.generatedContent)
        setSavedId(id)
        showToast('불러오기 완료!', 'success')
      } else {
        showToast(`불러오기 실패: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('불러오기 중 오류가 발생했습니다.', 'error')
      console.error('Load error:', error)
    }
  }, [showToast])

  // 섹션 수정 시작
  const startEdit = useCallback((section: string, currentText: string) => {
    setEditingSection(section)
    setEditedText(currentText)
  }, [])

  // 섹션 수정 저장
  const saveEdit = useCallback(
    (section: string) => {
      if (!editedContent) return

      const updated = { ...editedContent }

      if (section.startsWith('story.')) {
        const storyPart = section.split('.')[1] as
          | 'first'
          | 'together'
          | 'preparation'
        updated.story = { ...updated.story, [storyPart]: editedText }
      } else {
        ;(updated as Record<string, unknown>)[section] = editedText
      }

      setEditedContent(updated)
      setEditingSection(null)
      setEditedText('')
      showToast('수정 사항이 저장되었습니다.', 'success')
    },
    [editedContent, editedText, showToast]
  )

  // 섹션 수정 취소
  const cancelEdit = useCallback(() => {
    setEditingSection(null)
    setEditedText('')
  }, [])

  // 섹션 재생성
  const handleRegenerate = useCallback(
    async (section: string) => {
      // 재생성 가능 여부 확인
      if (!canRegenerate(section)) {
        showToast(
          `${section === 'greeting' ? '인사말' : section === 'thanks' ? '감사말' : section}은(는) 최대 재생성 횟수(${MAX_REGEN_PER_SECTION}회)에 도달했습니다. 직접 수정해주세요.`,
          'warning'
        )
        return
      }

      setRegeneratingSection(section)
      try {
        await onRegenerate(section)
        // 재생성 카운트 증가
        incrementRegenCount(section)
        updateRegenStatuses()

        const status = getRegenStatus(section)
        showToast(
          `새로운 내용이 생성되었습니다. (${status.count}/${status.maxCount}회 사용)`,
          'success'
        )
      } catch {
        showToast('재생성에 실패했습니다.', 'error')
      } finally {
        setRegeneratingSection(null)
      }
    },
    [onRegenerate, showToast, updateRegenStatuses]
  )

  // 인터뷰 항목 저장
  const saveInterviewItem = useCallback(
    (
      index: number,
      updatedItem: {
        question: string
        groomAnswer?: string
        brideAnswer?: string
        jointAnswer?: string
      }
    ) => {
      if (!editedContent) return

      const updatedInterview = [...editedContent.interview]
      updatedInterview[index] = updatedItem

      setEditedContent({ ...editedContent, interview: updatedInterview })
      setEditingInterviewIndex(null)
      showToast('인터뷰 답변이 저장되었습니다.', 'success')
    },
    [editedContent, showToast]
  )

  // 전체 인터뷰 복사
  const copyAllInterview = useCallback(() => {
    if (!editedContent) return

    const interviewText = editedContent.interview
      .map((item, i) => {
        let text = `Q${i + 1}. ${item.question}\n`
        if (item.groomAnswer) text += `${groomName}: ${item.groomAnswer}\n`
        if (item.brideAnswer) text += `${brideName}: ${item.brideAnswer}\n`
        if (item.jointAnswer) text += `함께: ${item.jointAnswer}\n`
        return text
      })
      .join('\n')

    copyToClipboard(interviewText, '웨딩 인터뷰')
  }, [editedContent, groomName, brideName, copyToClipboard])

  // 기본 재생성 상태 (로드 전)
  const defaultRegenStatus: RegenStatus = {
    canRegenerate: true,
    count: 0,
    maxCount: MAX_REGEN_PER_SECTION,
    remaining: MAX_REGEN_PER_SECTION
  }

  // 로딩 상태
  if (isLoading && !regeneratingSection) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </div>
        <p className="text-gray-700 font-medium">AI가 텍스트를 생성하고 있어요...</p>
        <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
      </div>
    )
  }

  // 콘텐츠 없음
  if (!content || !editedContent) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📝</div>
        <p className="text-gray-600 font-medium">생성된 결과가 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">
          이전 단계를 완료하고 생성 버튼을 눌러주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 헤더 */}
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ✨ 생성이 완료되었어요!
        </h2>
        <p className="text-gray-600">
          각 섹션을 확인하고 원하시면 수정하거나 다시 생성할 수 있어요
        </p>
        <p className="text-xs text-gray-400 mt-1">
          섹션당 최대 {MAX_REGEN_PER_SECTION}회까지 재생성할 수 있습니다
        </p>
      </div>

      {/* 1. 인사말 */}
      <SectionCard
        title="인사말"
        icon="📝"
        content={editedContent.greeting}
        sectionKey="greeting"
        isEditing={editingSection === 'greeting'}
        editedText={editedText}
        isRegenerating={regeneratingSection === 'greeting'}
        regenStatus={regenStatuses['greeting'] || defaultRegenStatus}
        onEdit={() => startEdit('greeting', editedContent.greeting)}
        onSave={() => saveEdit('greeting')}
        onCancel={cancelEdit}
        onRegenerate={() => handleRegenerate('greeting')}
        onCopy={() => copyToClipboard(editedContent.greeting, '인사말')}
        onTextChange={setEditedText}
      />

      {/* 2. 감사말 */}
      <SectionCard
        title="감사 인사"
        icon="💕"
        content={editedContent.thanks}
        sectionKey="thanks"
        isEditing={editingSection === 'thanks'}
        editedText={editedText}
        isRegenerating={regeneratingSection === 'thanks'}
        regenStatus={regenStatuses['thanks'] || defaultRegenStatus}
        onEdit={() => startEdit('thanks', editedContent.thanks)}
        onSave={() => saveEdit('thanks')}
        onCancel={cancelEdit}
        onRegenerate={() => handleRegenerate('thanks')}
        onCopy={() => copyToClipboard(editedContent.thanks, '감사 인사')}
        onTextChange={setEditedText}
      />

      {/* 3. 신랑 소개 */}
      <SectionCard
        title={`신랑 소개 (${groomName})`}
        icon="🤵"
        content={editedContent.groomProfile}
        sectionKey="groomProfile"
        isEditing={editingSection === 'groomProfile'}
        editedText={editedText}
        isRegenerating={regeneratingSection === 'groomProfile'}
        regenStatus={regenStatuses['groomProfile'] || defaultRegenStatus}
        onEdit={() => startEdit('groomProfile', editedContent.groomProfile)}
        onSave={() => saveEdit('groomProfile')}
        onCancel={cancelEdit}
        onRegenerate={() => handleRegenerate('groomProfile')}
        onCopy={() => copyToClipboard(editedContent.groomProfile, '신랑 소개')}
        onTextChange={setEditedText}
      />

      {/* 4. 신부 소개 */}
      <SectionCard
        title={`신부 소개 (${brideName})`}
        icon="👰"
        content={editedContent.brideProfile}
        sectionKey="brideProfile"
        isEditing={editingSection === 'brideProfile'}
        editedText={editedText}
        isRegenerating={regeneratingSection === 'brideProfile'}
        regenStatus={regenStatuses['brideProfile'] || defaultRegenStatus}
        onEdit={() => startEdit('brideProfile', editedContent.brideProfile)}
        onSave={() => saveEdit('brideProfile')}
        onCancel={cancelEdit}
        onRegenerate={() => handleRegenerate('brideProfile')}
        onCopy={() => copyToClipboard(editedContent.brideProfile, '신부 소개')}
        onTextChange={setEditedText}
      />

      {/* 5. 러브스토리 */}
      <Card className="animate-fade-in shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>💑</span>
            우리의 러브스토리
          </CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRegenerate('story')}
              disabled={!!regeneratingSection || !regenStatuses['story']?.canRegenerate}
              className={`text-xs h-8 ${
                regenStatuses['story']?.canRegenerate
                  ? 'text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300'
                  : 'text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              {regeneratingSection === 'story' ? '생성 중...' : '🔄 전체 다시 생성'}
              {regenStatuses['story'] && <RegenBadge status={regenStatuses['story']} />}
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* 1단계: 연애의 시작 */}
          <SectionCard
            title="1단계: 연애의 시작"
            icon=""
            content={editedContent.story.first}
            sectionKey="story.first"
            isEditing={editingSection === 'story.first'}
            editedText={editedText}
            isRegenerating={regeneratingSection === 'story.first'}
            regenStatus={regenStatuses['story.first'] || defaultRegenStatus}
            onEdit={() => startEdit('story.first', editedContent.story.first)}
            onSave={() => saveEdit('story.first')}
            onCancel={cancelEdit}
            onRegenerate={() => handleRegenerate('story.first')}
            onCopy={() =>
              copyToClipboard(editedContent.story.first, '연애의 시작')
            }
            onTextChange={setEditedText}
            compact
            hideRegenerate
          />

          {/* 2단계: 함께 성장한 시간 */}
          <SectionCard
            title="2단계: 함께 성장한 시간"
            icon=""
            content={editedContent.story.together}
            sectionKey="story.together"
            isEditing={editingSection === 'story.together'}
            editedText={editedText}
            isRegenerating={regeneratingSection === 'story.together'}
            regenStatus={regenStatuses['story.together'] || defaultRegenStatus}
            onEdit={() =>
              startEdit('story.together', editedContent.story.together)
            }
            onSave={() => saveEdit('story.together')}
            onCancel={cancelEdit}
            onRegenerate={() => handleRegenerate('story.together')}
            onCopy={() =>
              copyToClipboard(editedContent.story.together, '함께 성장한 시간')
            }
            onTextChange={setEditedText}
            compact
            hideRegenerate
          />

          {/* 3단계: 결혼 준비 */}
          <SectionCard
            title="3단계: 결혼 준비"
            icon=""
            content={editedContent.story.preparation}
            sectionKey="story.preparation"
            isEditing={editingSection === 'story.preparation'}
            editedText={editedText}
            isRegenerating={regeneratingSection === 'story.preparation'}
            regenStatus={regenStatuses['story.preparation'] || defaultRegenStatus}
            onEdit={() =>
              startEdit('story.preparation', editedContent.story.preparation)
            }
            onSave={() => saveEdit('story.preparation')}
            onCancel={cancelEdit}
            onRegenerate={() => handleRegenerate('story.preparation')}
            onCopy={() =>
              copyToClipboard(editedContent.story.preparation, '결혼 준비')
            }
            onTextChange={setEditedText}
            compact
            hideRegenerate
          />
        </CardContent>
      </Card>

      {/* 6. 웨딩 인터뷰 */}
      {editedContent.interview && editedContent.interview.length > 0 && (
        <Card className="animate-fade-in shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>🎤</span>
              웨딩 인터뷰
            </CardTitle>
            <CardAction>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAllInterview}
                  className="text-xs h-8"
                >
                  📋 전체 복사
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate('interview')}
                  disabled={!!regeneratingSection || !regenStatuses['interview']?.canRegenerate}
                  className={`text-xs h-8 ${
                    regenStatuses['interview']?.canRegenerate
                      ? 'text-rose-600 hover:text-rose-700 border-rose-200 hover:border-rose-300'
                      : 'text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  {regeneratingSection === 'interview'
                    ? '생성 중...'
                    : '🔄 전체 다시 생성'}
                  {regenStatuses['interview'] && <RegenBadge status={regenStatuses['interview']} />}
                </Button>
              </div>
            </CardAction>
          </CardHeader>

          <CardContent className="pt-4">
            {regeneratingSection === 'interview' ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin mr-3" />
                <span className="text-gray-600">
                  새로운 인터뷰를 생성하고 있어요...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {editedContent.interview.map((item, index) => (
                  <InterviewItem
                    key={index}
                    item={item}
                    index={index}
                    groomName={groomName}
                    brideName={brideName}
                    isEditing={editingInterviewIndex === index}
                    onEdit={() => setEditingInterviewIndex(index)}
                    onSave={(updatedItem) => saveInterviewItem(index, updatedItem)}
                    onCancel={() => setEditingInterviewIndex(null)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 하단 액션 버튼 */}
      <div className="flex flex-col items-center gap-4 pt-6 animate-fade-in">
        {/* 저장 상태 표시 */}
        {savedId && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            저장됨 {lastSavedAt && `(${lastSavedAt.toLocaleTimeString()})`}
          </div>
        )}

        <div className="flex gap-4">
          {/* 저장 버튼 */}
          <Button
            onClick={handleSave}
            size="lg"
            variant="outline"
            disabled={isSaving}
            className="px-8 py-6 text-lg font-medium border-2 border-gray-300 hover:border-gray-400 transition-all duration-300"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></span>
                저장 중...
              </>
            ) : savedId ? (
              '💾 수정 저장'
            ) : (
              '💾 저장하기'
            )}
          </Button>

          {/* 적용 버튼 */}
          <Button
            onClick={() => onApply(editedContent)}
            size="lg"
            className="bg-rose-500 hover:bg-rose-600 text-white px-12 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            ✨ 청첩장에 적용하기
          </Button>
        </div>
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
