'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Type } from 'lucide-react'

interface HighlightTextareaProps {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  placeholder?: string
  rows?: number
  className?: string
}

/**
 * 하이라이트 기능이 있는 Textarea 컴포넌트
 *
 * 사용법:
 * - 텍스트 선택 후 버튼 클릭
 * - ==텍스트== : 노란색 하이라이트
 * - ~~텍스트~~ : 흰색 하이라이트
 * - **텍스트** : 강조 색상 (테마별 메인 컬러)
 */
export default function HighlightTextarea({
  value,
  onChange,
  onFocus,
  placeholder,
  rows = 4,
  className = ''
}: HighlightTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 로컬 상태로 입력값 관리 (깜빡임 방지)
  const [localValue, setLocalValue] = useState(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 외부 value가 변경되면 로컬 상태 동기화 (blur 후 외부에서 변경된 경우)
  useEffect(() => {
    // debounce 중이 아닐 때만 외부 값으로 동기화
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

  // 로컬 값 변경 시 debounce로 스토어 업데이트
  const handleLocalChange = useCallback((newValue: string) => {
    setLocalValue(newValue)

    // 기존 타이머 클리어
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 500ms 후 스토어 업데이트 (Preview 리렌더링 빈도 감소)
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue)
      debounceTimerRef.current = null
    }, 500)
  }, [onChange])

  // blur 시 즉시 스토어 업데이트
  const handleBlur = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (localValue !== value) {
      onChange(localValue)
    }
  }, [localValue, value, onChange])

  const applyHighlight = useCallback((type: 'yellow' | 'white' | 'accent') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = localValue.substring(start, end)

    if (!selectedText) {
      // 선택된 텍스트가 없으면 알림
      return
    }

    const wrapper = type === 'yellow' ? ['==', '=='] : type === 'white' ? ['~~', '~~'] : ['**', '**']

    // 이미 하이라이트가 적용되어 있는지 확인
    const beforeText = localValue.substring(0, start)
    const afterText = localValue.substring(end)

    // 이미 같은 타입의 하이라이트가 적용되어 있으면 제거
    if (
      beforeText.endsWith(wrapper[0]) &&
      afterText.startsWith(wrapper[1])
    ) {
      const newValue =
        beforeText.slice(0, -wrapper[0].length) +
        selectedText +
        afterText.slice(wrapper[1].length)
      setLocalValue(newValue)
      onChange(newValue) // 하이라이트 적용은 즉시 반영

      // 커서 위치 조정
      setTimeout(() => {
        textarea.selectionStart = start - wrapper[0].length
        textarea.selectionEnd = end - wrapper[0].length
        textarea.focus()
      }, 0)
      return
    }

    // 하이라이트 적용
    const newValue =
      beforeText +
      wrapper[0] + selectedText + wrapper[1] +
      afterText
    setLocalValue(newValue)
    onChange(newValue) // 하이라이트 적용은 즉시 반영

    // 커서 위치 조정
    setTimeout(() => {
      textarea.selectionStart = start + wrapper[0].length
      textarea.selectionEnd = end + wrapper[0].length
      textarea.focus()
    }, 0)
  }, [localValue, onChange])

  return (
    <div className="space-y-1.5">
      {/* 하이라이트 툴바 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-gray-400 mr-0.5">텍스트 선택 후 →</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[10px] gap-1"
          onClick={() => applyHighlight('yellow')}
          title="텍스트를 드래그한 후 클릭하면 노란색 하이라이트가 적용됩니다"
        >
          <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(transparent 50%, #FFEB3B 50%)' }} />
          노란색
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[10px] gap-1"
          onClick={() => applyHighlight('white')}
          title="텍스트를 드래그한 후 클릭하면 흰색 하이라이트가 적용됩니다"
        >
          <span className="w-3 h-3 rounded-sm border border-gray-300" style={{ background: 'linear-gradient(transparent 50%, rgba(255,255,255,0.9) 50%)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }} />
          흰색
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[10px] gap-1"
          onClick={() => applyHighlight('accent')}
          title="텍스트를 드래그한 후 클릭하면 테마 강조색이 적용됩니다"
        >
          <Type className="w-3 h-3 text-rose-500" />
          강조색
        </Button>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => handleLocalChange(e.target.value)}
        onFocus={onFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
    </div>
  )
}
