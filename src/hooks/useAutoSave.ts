'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// ============================================================
// Types
// ============================================================

interface AutoSaveOptions {
  delay?: number // 저장 지연 시간 (ms)
  onSaveStart?: () => void
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

interface AutoSaveReturn {
  isSaving: boolean
  lastSavedAt: Date | null
  save: () => void
  hasUnsavedChanges: boolean
}

// ============================================================
// useAutoSave Hook
// ============================================================

export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => void | Promise<void>,
  options: AutoSaveOptions = {}
): AutoSaveReturn {
  const {
    delay = 5000,
    onSaveStart,
    onSaveSuccess,
    onSaveError
  } = options

  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<string>(JSON.stringify(data))
  const saveInProgressRef = useRef(false)

  // 수동 저장 함수
  const save = useCallback(async () => {
    if (saveInProgressRef.current) return

    saveInProgressRef.current = true
    setIsSaving(true)
    onSaveStart?.()

    try {
      await saveFunction(data)
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)
      previousDataRef.current = JSON.stringify(data)
      onSaveSuccess?.()
    } catch (error) {
      onSaveError?.(error instanceof Error ? error : new Error('저장 실패'))
    } finally {
      setIsSaving(false)
      saveInProgressRef.current = false
    }
  }, [data, saveFunction, onSaveStart, onSaveSuccess, onSaveError])

  // 자동 저장 로직
  useEffect(() => {
    const currentDataString = JSON.stringify(data)

    // 데이터가 변경되었는지 확인
    if (currentDataString !== previousDataRef.current) {
      setHasUnsavedChanges(true)

      // 기존 타이머 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 새 타이머 설정
      timeoutRef.current = setTimeout(() => {
        save()
      }, delay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, save])

  // 컴포넌트 언마운트 시 저장
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && !saveInProgressRef.current) {
        // 동기적으로 저장 시도 (best effort)
        try {
          const key = 'wedding-ai-autosave-backup'
          localStorage.setItem(key, JSON.stringify(data))
        } catch {
          // 실패해도 무시
        }
      }
    }
  }, [data, hasUnsavedChanges])

  return {
    isSaving,
    lastSavedAt,
    save,
    hasUnsavedChanges
  }
}

// ============================================================
// useDebounce Hook (보조)
// ============================================================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================================
// useThrottle Hook (보조)
// ============================================================

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

export default useAutoSave
