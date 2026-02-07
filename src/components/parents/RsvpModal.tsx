'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from './ThemeContext'

interface RsvpModalProps {
  onSubmit?: (data: {
    name: string
    attendance: 'yes' | 'no' | 'maybe'
    guestCount: number
    message: string
  }) => void
  isPreview?: boolean
  invitationId?: string  // RSVP 저장을 위한 청첩장 ID
}

export default function RsvpModal({ onSubmit, isPreview = false, invitationId }: RsvpModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    side: null as 'groom' | 'bride' | null,
    attendance: 'yes' as 'yes' | 'no' | 'maybe',
    guestCount: 1,
    message: '',
  })
  const [hoveredButton, setHoveredButton] = useState<'minus' | 'plus' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // 풀스크린 모드 진입/해제
  const enterFullscreen = () => {
    setIsFullscreen(true)
    document.body.style.overflow = 'hidden'
  }

  const exitFullscreen = () => {
    setIsFullscreen(false)
    document.body.style.overflow = ''
    // 모든 input blur 처리
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // 이름 필수 체크
    if (!formData.name.trim()) {
      setSubmitError('이름을 입력해 주세요.')
      return
    }

    // 커스텀 onSubmit이 있으면 사용
    if (onSubmit) {
      onSubmit(formData)
      exitFullscreen()
      return
    }

    // invitationId가 없으면 미리보기 모드
    if (!invitationId) {
      alert('참석 의사가 전달되었습니다. 감사합니다!')
      exitFullscreen()
      return
    }

    // API 호출
    setIsSubmitting(true)
    try {
      // attendance 값 변환 (yes -> attending, no -> not_attending, maybe -> pending)
      const attendanceMap = {
        yes: 'attending',
        no: 'not_attending',
        maybe: 'pending',
      } as const

      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: formData.name.trim(),
          attendance: attendanceMap[formData.attendance],
          guestCount: formData.attendance === 'yes' ? formData.guestCount : 0,
          message: formData.message.trim() || undefined,
          side: formData.side || undefined,
        }),
      })

      if (!response.ok) {
        const data: { error?: string } = await response.json()
        throw new Error(data.error || '제출에 실패했습니다.')
      }

      setIsSubmitted(true)
      exitFullscreen()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 성공 메시지 컨텐츠
  const successContent = (
    <div className="text-center py-8">
      <div
        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ backgroundColor: `${theme.primary}20` }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: theme.primary }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2" style={{ color: theme.text }}>감사합니다!</h3>
      <p className="text-sm" style={{ color: '#999' }}>
        참석 여부가 성공적으로 전달되었습니다.
      </p>
      {formData.attendance === 'yes' && (
        <p className="text-sm mt-1" style={{ color: '#999' }}>
          결혼식에서 뵙겠습니다.
        </p>
      )}
    </div>
  )

  // 폼 컨텐츠 (JSX 변수로 정의 - 함수 컴포넌트로 만들면 리렌더링 시 unmount됨)
  const formContent = isSubmitted ? successContent : (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {submitError}
        </div>
      )}
      <div>
        <label className="block text-xs mb-2" style={{ color: '#999' }}>
          성함 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="성함을 입력해주세요"
          className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
          style={{ borderColor: '#E8E4DC', color: theme.text }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.primary
            if (!isFullscreen) enterFullscreen()
          }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E4DC' }}
        />
      </div>

      <div>
        <label className="block text-xs mb-2" style={{ color: '#999' }}>
          소속
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, side: prev.side === 'groom' ? null : 'groom' }))}
            className="py-3 rounded-lg border text-sm transition-all"
            style={{
              borderColor: formData.side === 'groom' ? '#3B82F6' : '#E8E4DC',
              backgroundColor: formData.side === 'groom' ? '#3B82F610' : '#FFFFFF',
              color: formData.side === 'groom' ? '#3B82F6' : '#666',
            }}
          >
            신랑측
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, side: prev.side === 'bride' ? null : 'bride' }))}
            className="py-3 rounded-lg border text-sm transition-all"
            style={{
              borderColor: formData.side === 'bride' ? '#EC4899' : '#E8E4DC',
              backgroundColor: formData.side === 'bride' ? '#EC489910' : '#FFFFFF',
              color: formData.side === 'bride' ? '#EC4899' : '#666',
            }}
          >
            신부측
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs mb-2" style={{ color: '#999' }}>
          참석 여부
        </label>
        <div className="flex gap-2">
          {[
            { value: 'yes', label: '참석' },
            { value: 'no', label: '불참' },
            { value: 'maybe', label: '미정' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, attendance: option.value as 'yes' | 'no' | 'maybe' }))}
              className="flex-1 py-3 rounded-lg border text-sm transition-all"
              style={{
                borderColor: formData.attendance === option.value ? theme.primary : '#E8E4DC',
                backgroundColor: formData.attendance === option.value ? `${theme.primary}10` : '#FFFFFF',
                color: formData.attendance === option.value ? theme.primary : '#666',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {formData.attendance === 'yes' && (
        <div>
          <label className="block text-xs mb-2" style={{ color: '#999' }}>
            참석 인원
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
              onMouseEnter={() => setHoveredButton('minus')}
              onMouseLeave={() => setHoveredButton(null)}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all"
              style={{ borderColor: hoveredButton === 'minus' ? theme.primary : '#E8E4DC', color: '#666' }}
            >
              -
            </button>
            <span className="text-lg font-serif" style={{ color: theme.text }}>
              {formData.guestCount}명
            </span>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, guestCount: prev.guestCount + 1 }))}
              onMouseEnter={() => setHoveredButton('plus')}
              onMouseLeave={() => setHoveredButton(null)}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all"
              style={{ borderColor: hoveredButton === 'plus' ? theme.primary : '#E8E4DC', color: '#666' }}
            >
              +
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs mb-2" style={{ color: '#999' }}>
          축하 메시지 (선택)
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="신랑신부에게 전할 메시지를 남겨주세요"
          rows={3}
          className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all resize-none"
          style={{ borderColor: '#E8E4DC', color: theme.text }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.primary
            if (!isFullscreen) enterFullscreen()
          }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E4DC' }}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !formData.name.trim()}
        className="w-full py-4 rounded-lg text-sm tracking-wider transition-all disabled:opacity-50"
        style={{
          backgroundColor: theme.primary,
          color: '#FFFFFF',
        }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            전송 중...
          </span>
        ) : (
          '전달하기'
        )}
      </button>
    </form>
  )

  // 풀스크린 모달 컨텐츠
  const fullscreenModal = isFullscreen && typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[10000] flex flex-col"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: '#E8E4DC' }}
      >
        <button
          type="button"
          onClick={exitFullscreen}
          className="text-sm px-3 py-1"
          style={{ color: '#666' }}
        >
          취소
        </button>
        <h3
          className="font-serif text-base tracking-wider"
          style={{ color: theme.text }}
        >
          참석 의사 전달
        </h3>
        <button
          type="button"
          onClick={handleSubmit}
          className="text-sm px-3 py-1 font-medium"
          style={{ color: theme.primary }}
        >
          완료
        </button>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {formContent}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      {/* 풀스크린 모달 (Portal로 body에 렌더링) */}
      {fullscreenModal}

      {/* 기본 바텀시트 */}
      <div ref={ref} className="min-h-[50vh]" style={{ backgroundColor: theme.background }}>
        <div
          ref={formRef}
          className={`${isPreview ? 'absolute' : 'fixed'} left-0 right-0 bottom-0 transition-all duration-500 ease-out`}
          style={{
            transform: isVisible && !isFullscreen ? 'translateY(0)' : 'translateY(100%)',
            maxWidth: '390px',
            margin: '0 auto',
            zIndex: 100,
          }}
        >
          <div
            className="rounded-t-[32px] px-6 pt-8 pb-12"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div
              className="w-12 h-1 rounded-full mx-auto mb-6"
              style={{ backgroundColor: '#E8E4DC' }}
            />

            <h3
              className="font-serif text-lg text-center mb-6 tracking-wider"
              style={{ color: '#1A1A1A' }}
            >
              참석 의사 전달
            </h3>

            {formContent}
          </div>
        </div>
      </div>
    </>
  )
}
