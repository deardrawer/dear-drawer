'use client'

import { useRef, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Highlighter } from 'lucide-react'

interface HighlightTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

/**
 * 하이라이트 기능이 있는 Textarea 컴포넌트
 *
 * 사용법:
 * - 텍스트 선택 후 노란색/핑크색 버튼 클릭
 * - ==텍스트== : 노란색 하이라이트
 * - ~~텍스트~~ : 핑크색 하이라이트
 */
export default function HighlightTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  className = ''
}: HighlightTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const applyHighlight = useCallback((type: 'yellow' | 'white') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    if (!selectedText) {
      // 선택된 텍스트가 없으면 알림
      return
    }

    const wrapper = type === 'yellow' ? ['==', '=='] : ['~~', '~~']

    // 이미 하이라이트가 적용되어 있는지 확인
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)

    // 이미 같은 타입의 하이라이트가 적용되어 있으면 제거
    if (
      beforeText.endsWith(wrapper[0]) &&
      afterText.startsWith(wrapper[1])
    ) {
      const newValue =
        beforeText.slice(0, -wrapper[0].length) +
        selectedText +
        afterText.slice(wrapper[1].length)
      onChange(newValue)

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
    onChange(newValue)

    // 커서 위치 조정
    setTimeout(() => {
      textarea.selectionStart = start + wrapper[0].length
      textarea.selectionEnd = end + wrapper[0].length
      textarea.focus()
    }, 0)
  }, [value, onChange])

  return (
    <div className="space-y-1.5">
      {/* 하이라이트 툴바 */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400 mr-0.5">강조하고 싶은 텍스트 선택 후 클릭 →</span>
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
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
    </div>
  )
}
