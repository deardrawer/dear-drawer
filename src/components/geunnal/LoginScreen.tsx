'use client'
import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react'
import { Heart } from 'lucide-react'

interface LoginScreenProps {
  pageId: string
  groomName: string
  brideName: string
  onLoginSuccess: (token: string) => void
}

export default function LoginScreen({ pageId, groomName, brideName, onLoginSuccess }: LoginScreenProps) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setError('')

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleSubmit = async () => {
    const password = pin.join('')
    if (password.length !== 4) {
      setError('4자리 비밀번호를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/geunnal/${pageId}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '로그인 실패')
      }

      // Save token to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`geunnal-token-${pageId}`, data.token)
      }

      onLoginSuccess(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다')
      setPin(['', '', '', ''])
      inputRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'linear-gradient(135deg, #EDE9FA 0%, #FAE9F0 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white shadow-lg">
            <Heart className="w-10 h-10 text-[#D4899A]" fill="#D4899A" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-[#2A2240] mb-2">
            {groomName} ♥ {brideName}
          </h1>
          <p className="text-sm text-[#5A5270]">그날 관리 페이지</p>
        </div>

        {/* PIN Input */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <p className="text-center text-sm text-[#5A5270] mb-6">
            4자리 비밀번호를 입력하세요
          </p>

          <div className="flex gap-4 justify-center mb-6">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-2xl font-bold border-2 border-[#E8E4F0] rounded-xl focus:border-[#8B75D0] focus:outline-none transition-colors"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-[#F44336] mb-4">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || pin.join('').length !== 4}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading || pin.join('').length !== 4
                ? '#9B8CC4'
                : 'linear-gradient(135deg, #8B75D0 0%, #D4899A 100%)',
            }}
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#9B8CC4] mt-6">
          비밀번호를 잊으셨나요? 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  )
}
