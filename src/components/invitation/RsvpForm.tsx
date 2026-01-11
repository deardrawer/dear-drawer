'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Attendance = 'attending' | 'not_attending' | 'pending'

interface RsvpFormProps {
  invitationId: string
  primaryColor: string
  onSuccess?: () => void
  allowGuestCount?: boolean
}

export default function RsvpForm({
  invitationId,
  primaryColor,
  onSuccess,
  allowGuestCount = true,
}: RsvpFormProps) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [guestCount, setGuestCount] = useState(1)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!guestName.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }

    if (!attendance) {
      setError('참석 여부를 선택해 주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim() || undefined,
          attendance,
          guestCount: attendance === 'attending' ? guestCount : 0,
          message: message.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data: { error?: string } = await response.json()
        throw new Error(data.error || '제출에 실패했습니다.')
      }

      setIsSubmitted(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: primaryColor }}
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
        <h3 className="text-lg font-medium mb-2">감사합니다!</h3>
        <p className="text-sm text-gray-500">
          참석 여부가 성공적으로 전달되었습니다.
        </p>
        {attendance === 'attending' && (
          <p className="text-sm text-gray-500 mt-1">
            결혼식에서 뵙겠습니다.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 이름 */}
      <div className="space-y-2">
        <Label htmlFor="guestName">
          이름 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="guestName"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="홍길동"
          required
        />
      </div>

      {/* 연락처 */}
      <div className="space-y-2">
        <Label htmlFor="guestPhone">연락처</Label>
        <Input
          id="guestPhone"
          type="tel"
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          placeholder="010-1234-5678"
        />
      </div>

      {/* 참석 여부 */}
      <div className="space-y-2">
        <Label>
          참석 여부 <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAttendance('attending')}
            className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
              attendance === 'attending'
                ? 'text-white'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
            style={
              attendance === 'attending'
                ? { backgroundColor: primaryColor, borderColor: primaryColor }
                : {}
            }
          >
            참석
          </button>
          <button
            type="button"
            onClick={() => setAttendance('not_attending')}
            className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
              attendance === 'not_attending'
                ? 'bg-gray-700 text-white border-gray-700'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            불참
          </button>
          <button
            type="button"
            onClick={() => setAttendance('pending')}
            className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
              attendance === 'pending'
                ? 'bg-gray-500 text-white border-gray-500'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            미정
          </button>
        </div>
      </div>

      {/* 동반 인원 (참석 시만, allowGuestCount가 true일 때만) */}
      {allowGuestCount && attendance === 'attending' && (
        <div className="space-y-2">
          <Label htmlFor="guestCount">동반 인원 (본인 포함)</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-300"
            >
              -
            </button>
            <span className="text-xl font-medium w-8 text-center">{guestCount}</span>
            <button
              type="button"
              onClick={() => setGuestCount(Math.min(10, guestCount + 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-300"
            >
              +
            </button>
            <span className="text-sm text-gray-500">명</span>
          </div>
        </div>
      )}

      {/* 축하 메시지 */}
      <div className="space-y-2">
        <Label htmlFor="message">축하 메시지</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="신랑 신부에게 전할 축하 메시지를 남겨주세요"
          rows={3}
          className="resize-none"
        />
      </div>

      {/* 제출 버튼 */}
      <Button
        type="submit"
        className="w-full py-6 text-base"
        disabled={isSubmitting || !guestName.trim() || !attendance}
        style={{ backgroundColor: primaryColor }}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            전송 중...
          </span>
        ) : (
          '참석 여부 전송하기'
        )}
      </Button>
    </form>
  )
}
