'use client'

import { useState, useEffect, useRef, useCallback, ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface DebouncedInputProps extends Omit<ComponentProps<typeof Input>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

/**
 * 입력 시 깜빡임을 방지하는 Debounced Input 컴포넌트
 * - 로컬 상태로 입력값 관리
 * - debounce 후 또는 blur 시 스토어 업데이트
 */
export function DebouncedInput({
  value,
  onChange,
  debounceMs = 300,
  ...props
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 외부 value가 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (!debounceTimerRef.current) {
      setLocalValue(value)
    }
  }, [value])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue)
      debounceTimerRef.current = null
    }, debounceMs)
  }, [onChange, debounceMs])

  const handleBlur = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (localValue !== value) {
      onChange(localValue)
    }
  }, [localValue, value, onChange])

  return (
    <Input
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={(e) => {
        handleBlur()
        props.onBlur?.(e)
      }}
    />
  )
}

interface DebouncedTextareaProps extends Omit<ComponentProps<typeof Textarea>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

/**
 * 입력 시 깜빡임을 방지하는 Debounced Textarea 컴포넌트
 */
export function DebouncedTextarea({
  value,
  onChange,
  debounceMs = 300,
  ...props
}: DebouncedTextareaProps) {
  const [localValue, setLocalValue] = useState(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!debounceTimerRef.current) {
      setLocalValue(value)
    }
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue)
      debounceTimerRef.current = null
    }, debounceMs)
  }, [onChange, debounceMs])

  const handleBlur = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (localValue !== value) {
      onChange(localValue)
    }
  }, [localValue, value, onChange])

  return (
    <Textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={(e) => {
        handleBlur()
        props.onBlur?.(e)
      }}
    />
  )
}
