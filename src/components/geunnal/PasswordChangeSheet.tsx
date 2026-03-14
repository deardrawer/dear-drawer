'use client'
import { useState, useRef, KeyboardEvent } from 'react'
import BottomSheet from './BottomSheet'

interface PasswordChangeSheetProps {
  open: boolean
  onClose: () => void
  pageId: string
  onPasswordChanged: (newToken: string) => void
}

export default function PasswordChangeSheet({ open, onClose, pageId, onPasswordChanged }: PasswordChangeSheetProps) {
  const [currentPin, setCurrentPin] = useState(['', '', '', ''])
  const [newPin, setNewPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const currentRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const newRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const confirmRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const handleChange = (
    index: number,
    value: string,
    target: string[],
    setter: (v: string[]) => void,
    refs: React.RefObject<HTMLInputElement | null>[],
    nextRefs?: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (value.length > 1) return
    const updated = [...target]
    updated[index] = value
    setter(updated)
    setError('')
    setSuccess('')

    if (value && index < 3) {
      refs[index + 1].current?.focus()
    } else if (value && index === 3 && nextRefs) {
      nextRefs[0].current?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
    target: string[],
    refs: React.RefObject<HTMLInputElement | null>[],
    prevRefs?: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (e.key === 'Backspace' && !target[index]) {
      if (index > 0) {
        refs[index - 1].current?.focus()
      } else if (prevRefs) {
        prevRefs[3].current?.focus()
      }
    }
  }

  const resetAll = () => {
    setCurrentPin(['', '', '', ''])
    setNewPin(['', '', '', ''])
    setConfirmPin(['', '', '', ''])
    setError('')
    setSuccess('')
    setLoading(false)
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const handleSubmit = async () => {
    const current = currentPin.join('')
    const newPw = newPin.join('')
    const confirm = confirmPin.join('')

    if (current.length !== 4) {
      setError('현재 비밀번호 4자리를 입력해주세요')
      return
    }
    if (newPw.length !== 4) {
      setError('새 비밀번호 4자리를 입력해주세요')
      return
    }
    if (newPw !== confirm) {
      setError('새 비밀번호가 일치하지 않습니다')
      setConfirmPin(['', '', '', ''])
      confirmRefs[0].current?.focus()
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/geunnal/${pageId}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change',
          currentPassword: current,
          newPassword: newPw,
        }),
      })

      const data = (await response.json()) as { error?: string; token?: string }

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 변경 실패')
      }

      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem(`geunnal-token-${pageId}`, data.token)
      }

      setSuccess('비밀번호가 변경되었습니다')
      onPasswordChanged(data.token || '')

      setTimeout(() => {
        handleClose()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 변경 중 오류가 발생했습니다')
      setCurrentPin(['', '', '', ''])
      setNewPin(['', '', '', ''])
      setConfirmPin(['', '', '', ''])
      currentRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const allFilled = currentPin.join('').length === 4 && newPin.join('').length === 4 && confirmPin.join('').length === 4

  const renderPinGroup = (
    label: string,
    pins: string[],
    setter: (v: string[]) => void,
    refs: React.RefObject<HTMLInputElement | null>[],
    nextRefs?: React.RefObject<HTMLInputElement | null>[],
    prevRefs?: React.RefObject<HTMLInputElement | null>[]
  ) => (
    <div className="mb-5">
      <p className="text-sm text-[#5A5270] mb-2">{label}</p>
      <div className="flex gap-3 justify-center">
        {pins.map((digit, index) => (
          <input
            key={index}
            ref={refs[index]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value, pins, setter, refs, nextRefs)}
            onKeyDown={(e) => handleKeyDown(index, e, pins, refs, prevRefs)}
            className="w-12 h-12 text-center text-xl font-bold border-2 border-[#E8E4F0] rounded-xl focus:border-[#8B75D0] focus:outline-none transition-colors"
            disabled={loading}
          />
        ))}
      </div>
    </div>
  )

  return (
    <BottomSheet open={open} onClose={handleClose} title="비밀번호 변경">
      <div className="pb-4">
        {renderPinGroup('현재 비밀번호', currentPin, setCurrentPin, currentRefs, newRefs)}
        {renderPinGroup('새 비밀번호', newPin, setNewPin, newRefs, confirmRefs, currentRefs)}
        {renderPinGroup('새 비밀번호 확인', confirmPin, setConfirmPin, confirmRefs, undefined, newRefs)}

        {error && (
          <p className="text-center text-sm text-[#F44336] mb-4">{error}</p>
        )}
        {success && (
          <p className="text-center text-sm text-[#4CAF50] mb-4">{success}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !allFilled}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: loading || !allFilled
              ? '#9B8CC4'
              : 'linear-gradient(135deg, #8B75D0 0%, #D4899A 100%)',
          }}
        >
          {loading ? '변경 중...' : '변경하기'}
        </button>
      </div>
    </BottomSheet>
  )
}
