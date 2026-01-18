'use client'

import { useState, useCallback, useEffect } from 'react'
import type { AllFormData, GeneratedContent } from '@/types/ai-generator'
import {
  getRegenStatus,
  getAllRegenStatuses,
  resetRegenCounts,
  incrementRegenCount,
  canRegenerate,
  getRegenLimitError,
  getSectionName,
  type RegenStatus,
  type SectionKey
} from '@/lib/regen-utils'

// ============================================================
// Types
// ============================================================

export interface UseGenerateContentReturn {
  // State
  isLoading: boolean
  progress: string
  error: string | null
  generatedContent: GeneratedContent | null
  regenStatuses: Record<SectionKey, RegenStatus>

  // Actions
  generate: (
    formData: AllFormData,
    groomName: string,
    brideName: string
  ) => Promise<GeneratedContent>
  regenerate: (
    section: string,
    formData: AllFormData,
    groomName: string,
    brideName: string,
    currentContent: GeneratedContent
  ) => Promise<GeneratedContent>
  setGeneratedContent: (content: GeneratedContent | null) => void
  clearError: () => void
  updateRegenStatuses: () => void
}

// ============================================================
// Hook Implementation
// ============================================================

export function useGenerateContent(): UseGenerateContentReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [regenStatuses, setRegenStatuses] = useState<Record<SectionKey, RegenStatus>>(
    {} as Record<SectionKey, RegenStatus>
  )

  // 재생성 상태 업데이트
  const updateRegenStatuses = useCallback(() => {
    setRegenStatuses(getAllRegenStatuses())
  }, [])

  // 컴포넌트 마운트 시 재생성 상태 로드
  useEffect(() => {
    updateRegenStatuses()
  }, [updateRegenStatuses])

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 전체 콘텐츠 생성
   */
  const generate = useCallback(
    async (
      formData: AllFormData,
      groomName: string,
      brideName: string
    ): Promise<GeneratedContent> => {
      setIsLoading(true)
      setError(null)
      setProgress('AI가 콘텐츠를 생성하고 있어요...')

      try {
        // 새로 생성시 카운터 리셋
        resetRegenCounts()

        const response = await fetch('/api/ai/story/full-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData,
            groomName,
            brideName
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as { error?: string }
          throw new Error(errorData.error || '콘텐츠 생성에 실패했습니다.')
        }

        const result = (await response.json()) as GeneratedContent

        setGeneratedContent(result)
        updateRegenStatuses()
        setProgress('생성 완료!')

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [updateRegenStatuses]
  )

  /**
   * 개별 섹션 재생성
   */
  const regenerate = useCallback(
    async (
      section: string,
      formData: AllFormData,
      groomName: string,
      brideName: string,
      currentContent: GeneratedContent
    ): Promise<GeneratedContent> => {
      // 재생성 제한 체크
      if (!canRegenerate(section)) {
        const limitError = getRegenLimitError(section)
        setError(limitError)
        throw new Error(limitError)
      }

      setIsLoading(true)
      setError(null)
      const sectionName = getSectionName(section)
      setProgress(`${sectionName}을(를) 재생성하고 있어요...`)

      try {
        const response = await fetch('/api/ai/story/regenerate-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section,
            formData,
            groomName,
            brideName,
            currentContent
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as { error?: string }
          throw new Error(errorData.error || '재생성에 실패했습니다.')
        }

        const result = (await response.json()) as {
          content?: string
          interview?: GeneratedContent['interview']
          story?: GeneratedContent['story']
        }

        // 재생성 카운트 증가
        const newCount = incrementRegenCount(section)

        // 업데이트된 콘텐츠 생성
        let updated: GeneratedContent

        if (section === 'story') {
          // 스토리 전체 재생성
          updated = {
            ...currentContent,
            story: result.story || currentContent.story
          }
        } else if (section.startsWith('story.')) {
          // 스토리 하위 섹션 재생성
          const key = section.split('.')[1] as 'first' | 'together' | 'preparation'
          updated = {
            ...currentContent,
            story: {
              ...currentContent.story,
              [key]: result.content || currentContent.story[key]
            }
          }
        } else if (section === 'interview') {
          // 인터뷰 재생성
          updated = {
            ...currentContent,
            interview: result.interview || currentContent.interview
          }
        } else {
          // 일반 섹션 재생성
          updated = {
            ...currentContent,
            [section]: result.content || (currentContent as unknown as Record<string, unknown>)[section]
          }
        }

        setGeneratedContent(updated)
        updateRegenStatuses()
        setProgress(`재생성 완료! (${newCount}/5회 사용)`)

        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : '재생성에 실패했습니다.'
        if (!message.includes('최대 재생성')) {
          setError(message)
        }
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [updateRegenStatuses]
  )

  return {
    isLoading,
    progress,
    error,
    generatedContent,
    regenStatuses,
    generate,
    regenerate,
    setGeneratedContent,
    clearError,
    updateRegenStatuses
  }
}

export default useGenerateContent
