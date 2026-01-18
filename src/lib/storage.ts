/**
 * Cloudflare D1 스토리지 유틸리티
 * AI 생성 콘텐츠의 저장/조회/수정/삭제
 */

import type { GeneratedContent, AllFormData } from '@/types/ai-generator'

// ============================================================
// Types
// ============================================================

export interface SavedContent {
  id: string
  userId: string
  formData: AllFormData
  generatedContent: GeneratedContent
  metadata: {
    greetingVersion: string | null
    profileVersion: string | null
    storyVersion: string | null
    interviewVersion: string | null
    tone: string | null
  }
  regenCounts: Record<string, number>
  createdAt: string
  updatedAt: string
}

export interface ListItem {
  id: string
  greeting: string
  tone: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ListResponse extends ApiResponse<ListItem[]> {
  pagination?: PaginationInfo
}

export interface SaveResponse extends ApiResponse<never> {
  id?: string
}

// ============================================================
// API Functions
// ============================================================

/**
 * 생성된 콘텐츠 저장
 */
export async function saveGeneratedContent(
  formData: AllFormData,
  generatedContent: GeneratedContent,
  userId: string = 'anonymous',
  regenCounts: Record<string, number> = {}
): Promise<SaveResponse> {
  try {
    const response = await fetch('/api/texts/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formData,
        generatedContent,
        userId,
        regenCounts
      })
    })

    const result = await response.json() as SaveResponse
    return result
  } catch (error) {
    console.error('저장 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
    }
  }
}

/**
 * ID로 조회
 */
export async function loadGeneratedContent(
  id: string
): Promise<ApiResponse<SavedContent>> {
  try {
    const response = await fetch(`/api/texts/${id}`)
    const result = await response.json() as ApiResponse<SavedContent>
    return result
  } catch (error) {
    console.error('조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '조회 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 수정
 */
export async function updateGeneratedContent(
  id: string,
  generatedContent: Partial<GeneratedContent>,
  regenCounts?: Record<string, number>
): Promise<ApiResponse<never>> {
  try {
    const response = await fetch('/api/texts/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        generatedContent,
        regenCounts
      })
    })

    const result = await response.json() as ApiResponse<never>
    return result
  } catch (error) {
    console.error('수정 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 삭제
 */
export async function deleteGeneratedContent(
  id: string
): Promise<ApiResponse<never>> {
  try {
    const response = await fetch(`/api/texts/${id}`, {
      method: 'DELETE'
    })

    const result = await response.json() as ApiResponse<never>
    return result
  } catch (error) {
    console.error('삭제 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 목록 조회
 */
export async function listGeneratedContent(
  userId: string = 'anonymous',
  limit: number = 50,
  offset: number = 0
): Promise<ListResponse> {
  try {
    const params = new URLSearchParams({
      userId,
      limit: limit.toString(),
      offset: offset.toString()
    })

    const response = await fetch(`/api/texts/list?${params}`)
    const result = await response.json() as ListResponse
    return result
  } catch (error) {
    console.error('목록 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '목록 조회 중 오류가 발생했습니다.'
    }
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * 저장된 콘텐츠가 있는지 확인
 */
export async function hasExistingContent(id: string): Promise<boolean> {
  const result = await loadGeneratedContent(id)
  return result.success && !!result.data
}

/**
 * 자동 저장 (debounce 적용 권장)
 */
export async function autoSave(
  id: string | null,
  formData: AllFormData,
  generatedContent: GeneratedContent,
  userId: string = 'anonymous',
  regenCounts: Record<string, number> = {}
): Promise<SaveResponse | ApiResponse<never>> {
  if (id) {
    // 기존 데이터 수정
    return updateGeneratedContent(id, generatedContent, regenCounts)
  } else {
    // 새로 저장
    return saveGeneratedContent(formData, generatedContent, userId, regenCounts)
  }
}

/**
 * 콘텐츠 복제
 */
export async function duplicateContent(
  id: string,
  userId: string = 'anonymous'
): Promise<SaveResponse> {
  // 기존 콘텐츠 조회
  const existing = await loadGeneratedContent(id)

  if (!existing.success || !existing.data) {
    return {
      success: false,
      error: '복제할 콘텐츠를 찾을 수 없습니다.'
    }
  }

  // 새로 저장 (새 ID 부여)
  return saveGeneratedContent(
    existing.data.formData,
    existing.data.generatedContent,
    userId,
    {}
  )
}

// ============================================================
// Export Types
// ============================================================

export type {
  GeneratedContent,
  AllFormData
}
