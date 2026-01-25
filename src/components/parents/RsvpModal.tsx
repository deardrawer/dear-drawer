'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from './ThemeContext'

interface RsvpModalProps {
  onSubmit?: (data: {
    name: string
    attendance: 'yes' | 'no' | 'maybe'
    guestCount: number
    message: string
  }) => void
  isPreview?: boolean
}

export default function RsvpModal({ onSubmit, isPreview = false }: RsvpModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    attendance: 'yes' as 'yes' | 'no' | 'maybe',
    guestCount: 1,
    message: '',
  })
  const [hoveredButton, setHoveredButton] = useState<'minus' | 'plus' | null>(null)

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

  // 키보드 감지 및 스크롤 방지
  useEffect(() => {
    if (typeof window === 'undefined') return

    let scrollY = 0

    // input focus 시 스크롤 위치 저장 및 복원
    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        scrollY = window.scrollY
        setIsKeyboardOpen(true)
        // 스크롤 위치 복원
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY)
        })
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setIsKeyboardOpen(false)
      }
    }

    // visualViewport API 사용 (iOS/Android 키보드 감지)
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height
        const windowHeight = window.innerHeight
        const isOpen = viewportHeight < windowHeight * 0.8
        setIsKeyboardOpen(isOpen)
        // 키보드가 열릴 때 스크롤 방지
        if (isOpen) {
          window.scrollTo(0, scrollY)
        }
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    window.visualViewport?.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formData)
    } else {
      alert('참석 의사가 전달되었습니다. 감사합니다!')
    }
  }

  return (
    <div ref={ref} className="min-h-[50vh]" style={{ backgroundColor: theme.background }}>
      <div
        ref={formRef}
        className={`${isPreview ? 'absolute' : 'fixed'} left-0 right-0 transition-all duration-500 ease-out`}
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          maxWidth: '390px',
          margin: '0 auto',
          zIndex: 100,
          bottom: isKeyboardOpen ? 'auto' : 0,
          top: isKeyboardOpen ? '10%' : 'auto',
          maxHeight: isKeyboardOpen ? '80vh' : 'auto',
          overflowY: isKeyboardOpen ? 'auto' : 'visible',
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs mb-2" style={{ color: '#999' }}>
                성함
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="성함을 입력해주세요"
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: '#E8E4DC', color: theme.text }}
                onFocus={(e) => { e.currentTarget.style.borderColor = theme.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E4DC' }}
              />
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
                    onClick={() => setFormData({ ...formData, attendance: option.value as 'yes' | 'no' | 'maybe' })}
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
                    onClick={() => setFormData({ ...formData, guestCount: Math.max(1, formData.guestCount - 1) })}
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
                    onClick={() => setFormData({ ...formData, guestCount: formData.guestCount + 1 })}
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
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="신랑신부에게 전할 메시지를 남겨주세요"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all resize-none"
                style={{ borderColor: '#E8E4DC', color: theme.text }}
                onFocus={(e) => { e.currentTarget.style.borderColor = theme.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E4DC' }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-lg text-sm tracking-wider transition-all"
              style={{
                backgroundColor: theme.primary,
                color: '#FFFFFF',
              }}
            >
              전달하기
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
