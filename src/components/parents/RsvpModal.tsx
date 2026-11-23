'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { C_BG, C_INK, C_KSERIF, C_SANS, C_SUB, cCaption, cPill, cTitle, onPointColor, C_WHITE_ISLAND } from './cStyle'
import { useTheme } from './ThemeContext'

const C_BORDER = 'rgba(31,29,26,0.16)'

interface RsvpModalProps {
  onSubmit?: (data: {
    name: string
    attendance: 'yes' | 'no' | 'maybe'
    guestCount: number
    message: string
  }) => void
  isPreview?: boolean
  invitationId?: string  // RSVP 저장을 위한 청첩장 ID
  rsvpMealOption?: boolean
  rsvpShuttleOption?: boolean
  rsvpAfterPartyOption?: boolean
  rsvpNotice?: string
  rsvpPhoneOption?: boolean
  rsvpSideDetail?: boolean
  rsvpSideDetailOptions?: { groomSelf?: boolean; groomFather?: boolean; groomMother?: boolean; brideSelf?: boolean; brideFather?: boolean; brideMother?: boolean }
  rsvpMessagePlaceholder?: string
  senderSide?: 'groom' | 'bride'
}

export default function RsvpModal({ onSubmit, isPreview = false, invitationId, rsvpMealOption = false, rsvpShuttleOption = false, rsvpAfterPartyOption = false, rsvpNotice, rsvpPhoneOption = false, rsvpSideDetail = false, rsvpSideDetailOptions, rsvpMessagePlaceholder, senderSide }: RsvpModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  // 포인트 색 (고객이 고르지 않았으면 먹색)
  const P = useTheme().point || C_INK
  const PT = `color-mix(in srgb, ${P} 8%, #FFFFFF)`
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    side: (senderSide || null) as 'groom' | 'bride' | null,
    sideDetail: '' as '' | 'self' | 'father' | 'mother',
    attendance: null as 'yes' | 'no' | 'maybe' | null,
    mealAttendance: null as 'yes' | 'no' | null,
    shuttleBus: null as 'yes' | 'no' | null,
    afterParty: null as 'yes' | 'no' | null,
    guestCount: 1,
    message: '',
  })
  const [hoveredButton, setHoveredButton] = useState<'minus' | 'plus' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // 청첩장 맨 끝에 닿으면 참석 여부 시트가 아래에서 올라옴 (기존 동작 그대로)
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

    // 참석 여부 필수 체크
    if (!formData.attendance) {
      setSubmitError('참석 여부를 선택해 주세요.')
      return
    }

    // 커스텀 onSubmit이 있으면 사용
    if (onSubmit) {
      onSubmit({ ...formData, attendance: formData.attendance! })
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
          guestPhone: formData.phone.trim() || undefined,
          attendance: attendanceMap[formData.attendance!],
          guestCount: formData.attendance === 'yes' ? formData.guestCount : 0,
          message: formData.message.trim() || undefined,
          side: formData.side || undefined,
          sideDetail: formData.sideDetail || undefined,
          mealAttendance: formData.attendance === 'yes' ? formData.mealAttendance : undefined,
          shuttleBus: formData.attendance === 'yes' ? formData.shuttleBus : undefined,
          afterParty: formData.attendance === 'yes' ? formData.afterParty : undefined,
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
        style={{ backgroundColor: `color-mix(in srgb, ${P} 12%, #FFFFFF)` }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: P }}
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
      <h3 className="mb-2" style={{ color: C_INK, fontFamily: C_KSERIF, fontSize: 20, fontWeight: 400 }}>감사합니다</h3>
      <p className="text-sm" style={{ color: C_SUB }}>
        참석 여부가 잘 전달되었습니다.
      </p>
      {formData.attendance === 'yes' && (
        <p className="text-sm mt-1" style={{ color: C_SUB }}>
          결혼식에서 뵙겠습니다.
        </p>
      )}
    </div>
  )

  // 폼 컨텐츠 (JSX 변수로 정의 - 함수 컴포넌트로 만들면 리렌더링 시 unmount됨)
  const formContent = isSubmitted ? successContent : (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rsvpNotice && (
        <p className="text-xs text-center whitespace-pre-line leading-relaxed" style={{ color: C_SUB }}>
          {rsvpNotice}
        </p>
      )}
      {submitError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {submitError}
        </div>
      )}
      <div>
        <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
          성함 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="성함을 입력해주세요"
          className="w-full px-4 py-3 rounded-lg border text-[15px] outline-none transition-all"
          style={{ borderColor: C_BORDER, color: C_INK }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = P
            if (!isFullscreen) enterFullscreen()
            const el = e.currentTarget
            setTimeout(() => {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 350)
          }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C_BORDER }}
        />
      </div>

      {rsvpPhoneOption && (
      <div>
        <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
          연락처 뒷자리
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
          placeholder="뒷자리 4자리"
          className="w-full px-4 py-3 rounded-lg border text-[15px] outline-none transition-all"
          style={{ borderColor: C_BORDER, color: C_INK }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = P
            if (!isFullscreen) enterFullscreen()
            const el = e.currentTarget
            setTimeout(() => {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 350)
          }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C_BORDER }}
        />
      </div>
      )}

      {!senderSide && (
      <div>
        <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
          소속
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, side: prev.side === 'groom' ? null : 'groom', sideDetail: '' }))}
            className="py-3 rounded-full border text-[15px] transition-all"
            style={{
              borderColor: formData.side === 'groom' ? P : C_BORDER,
              backgroundColor: formData.side === 'groom' ? PT : '#FFFFFF',
              color: formData.side === 'groom' ? P : '#666',
            }}
          >
            신랑측
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, side: prev.side === 'bride' ? null : 'bride', sideDetail: '' }))}
            className="py-3 rounded-full border text-[15px] transition-all"
            style={{
              borderColor: formData.side === 'bride' ? P : C_BORDER,
              backgroundColor: formData.side === 'bride' ? PT : '#FFFFFF',
              color: formData.side === 'bride' ? P : '#666',
            }}
          >
            신부측
          </button>
        </div>
      </div>
      )}

      {rsvpSideDetail && formData.side && (
      <div>
        <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
          초대 경로
        </label>
        <div className="flex gap-2 flex-wrap" style={{ wordBreak: 'keep-all' as const }}>
          {((formData.side === 'groom' && (rsvpSideDetailOptions?.groomSelf ?? true)) || (formData.side === 'bride' && (rsvpSideDetailOptions?.brideSelf ?? true))) && (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, sideDetail: 'self' }))}
            className="flex-1 py-3 rounded-full border text-[15px] transition-all"
            style={{
              borderColor: formData.sideDetail === 'self' ? P : C_BORDER,
              backgroundColor: formData.sideDetail === 'self' ? PT : '#FFFFFF',
              color: formData.sideDetail === 'self' ? P : '#666',
            }}
          >
            {formData.side === 'groom' ? '신랑' : '신부'}
          </button>
          )}
          {((formData.side === 'groom' && (rsvpSideDetailOptions?.groomFather ?? true)) || (formData.side === 'bride' && (rsvpSideDetailOptions?.brideFather ?? true))) && (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, sideDetail: 'father' }))}
            className="flex-1 py-3 rounded-full border text-[15px] transition-all"
            style={{
              borderColor: formData.sideDetail === 'father' ? P : C_BORDER,
              backgroundColor: formData.sideDetail === 'father' ? PT : '#FFFFFF',
              color: formData.sideDetail === 'father' ? P : '#666',
            }}
          >
            {formData.side === 'groom' ? '신랑' : '신부'} 아버지
          </button>
          )}
          {((formData.side === 'groom' && (rsvpSideDetailOptions?.groomMother ?? true)) || (formData.side === 'bride' && (rsvpSideDetailOptions?.brideMother ?? true))) && (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, sideDetail: 'mother' }))}
            className="flex-1 py-3 rounded-full border text-[15px] transition-all"
            style={{
              borderColor: formData.sideDetail === 'mother' ? P : C_BORDER,
              backgroundColor: formData.sideDetail === 'mother' ? PT : '#FFFFFF',
              color: formData.sideDetail === 'mother' ? P : '#666',
            }}
          >
            {formData.side === 'groom' ? '신랑' : '신부'} 어머니
          </button>
          )}
        </div>
      </div>
      )}

      <div>
        <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
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
              className="flex-1 py-3 rounded-full border text-[15px] transition-all"
              style={{
                borderColor: formData.attendance === option.value ? P : C_BORDER,
                backgroundColor: formData.attendance === option.value ? PT : '#FFFFFF',
                color: formData.attendance === option.value ? P : '#666',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {formData.attendance === 'yes' && (
        <div>
          <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
            참석 인원
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
              onMouseEnter={() => setHoveredButton('minus')}
              onMouseLeave={() => setHoveredButton(null)}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all"
              style={{ borderColor: hoveredButton === 'minus' ? P : C_BORDER, color: C_INK }}
            >
              -
            </button>
            <span className="text-lg" style={{ color: C_INK, fontFamily: C_KSERIF }}>
              {formData.guestCount}명
            </span>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, guestCount: prev.guestCount + 1 }))}
              onMouseEnter={() => setHoveredButton('plus')}
              onMouseLeave={() => setHoveredButton(null)}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all"
              style={{ borderColor: hoveredButton === 'plus' ? P : C_BORDER, color: C_INK }}
            >
              +
            </button>
          </div>
        </div>
      )}

      {rsvpMealOption && formData.attendance === 'yes' && (
        <div>
          <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
            식사 여부
          </label>
          <div className="flex gap-2">
            {[
              { value: 'yes', label: '식사 예정' },
              { value: 'no', label: '식사 안 함' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, mealAttendance: option.value as 'yes' | 'no' }))}
                className="flex-1 py-3 rounded-full border text-[15px] transition-all"
                style={{
                  borderColor: formData.mealAttendance === option.value ? P : C_BORDER,
                  backgroundColor: formData.mealAttendance === option.value ? PT : '#FFFFFF',
                  color: formData.mealAttendance === option.value ? P : '#666',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {rsvpShuttleOption && formData.attendance === 'yes' && (
        <div>
          <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
            대절버스 이용 여부
          </label>
          <div className="flex gap-2">
            {[
              { value: 'yes', label: '이용 예정' },
              { value: 'no', label: '이용 안 함' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, shuttleBus: option.value as 'yes' | 'no' }))}
                className="flex-1 py-3 rounded-full border text-[15px] transition-all"
                style={{
                  borderColor: formData.shuttleBus === option.value ? P : C_BORDER,
                  backgroundColor: formData.shuttleBus === option.value ? PT : '#FFFFFF',
                  color: formData.shuttleBus === option.value ? P : '#666',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {rsvpAfterPartyOption && formData.attendance === 'yes' && (
        <div>
          <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
            애프터파티 참석 여부
          </label>
          <div className="flex gap-2">
            {[
              { value: 'yes', label: '참석' },
              { value: 'no', label: '불참' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, afterParty: option.value as 'yes' | 'no' }))}
                className="flex-1 py-3 rounded-full border text-[15px] transition-all"
                style={{
                  borderColor: formData.afterParty === option.value ? P : C_BORDER,
                  backgroundColor: formData.afterParty === option.value ? PT : '#FFFFFF',
                  color: formData.afterParty === option.value ? P : '#666',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-[13px] mb-2" style={{ color: C_SUB }}>
          축하 메시지 (선택)
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder={rsvpMessagePlaceholder || "신랑신부에게 전할 메시지를 남겨주세요"}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border text-[15px] outline-none transition-all resize-none"
          style={{ borderColor: C_BORDER, color: C_INK }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = P
            if (!isFullscreen) enterFullscreen()
            // 키보드가 textarea 를 가리지 않도록 스크롤
            const el = e.currentTarget
            setTimeout(() => {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 350)
          }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C_BORDER }}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !formData.name.trim() || !formData.attendance}
        className="w-full transition-all disabled:opacity-50"
        style={{ ...cPill(true), flex: 'none' }}
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
      className="fixed left-0 right-0 top-0 z-[10000] flex flex-col"
      style={{
        backgroundColor: '#FFFFFF',
        // 본문 밖(body)에 그려지므로 포인트 색을 직접 지정
        ['--parents-point' as string]: P,
        ['--parents-on-point' as string]: onPointColor(P),
        height: '100dvh',
        maxHeight: '100dvh',
      }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: C_BORDER }}
      >
        <button
          type="button"
          onClick={exitFullscreen}
          className="text-sm px-3 py-1"
          style={{ color: C_INK }}
        >
          취소
        </button>
        <h3 style={{ fontFamily: C_KSERIF, fontSize: 17, fontWeight: 400, color: C_INK, margin: 0 }}>
          참석 여부 알려 주기
        </h3>
        <button
          type="button"
          onClick={handleSubmit}
          className="text-sm px-3 py-1 font-medium"
          style={{ color: C_INK }}
        >
          완료
        </button>
      </div>

      {/* 폼 - 키보드가 올라와도 스크롤 가능하도록 여유 패딩 추가 */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 280px)',
          WebkitOverflowScrolling: 'touch',
          scrollPaddingBottom: '320px',
        }}
      >
        {formContent}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      {/* 풀스크린 모달 (Portal로 body에 렌더링) */}
      {fullscreenModal}

      {/* 기본 바텀시트 — 맨 끝에서 올라옴 */}
      <div ref={ref} className="min-h-[50vh]" style={{ backgroundColor: 'transparent' }}>
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
            style={{
              ...C_WHITE_ISLAND,
              backgroundColor: C_BG,
              borderRadius: '24px 24px 0 0',
              padding: '14px 28px 40px',
              boxShadow: '0 -1px 0 rgba(31,29,26,0.08), 0 -10px 30px rgba(31,29,26,0.06)',
              fontFamily: C_SANS,
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(31,29,26,0.14)', margin: '0 auto 26px' }} />
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <p style={cCaption}>참석 여부</p>
              <h3 style={cTitle(21, 10)}>
                함께해 주실 수 있는지
                <br />
                알려 주세요
              </h3>
            </div>
            {formContent}
          </div>
        </div>
      </div>
    </>
  )
}
