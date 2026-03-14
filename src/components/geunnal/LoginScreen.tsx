'use client'
import { useState, useRef, KeyboardEvent } from 'react'
import { Heart } from 'lucide-react'

interface LoginScreenProps {
  pageId: string
  groomName: string
  brideName: string
  mode: 'login' | 'setup'
  onLoginSuccess: (token: string) => void
}

export default function LoginScreen({ pageId, groomName, brideName, mode, onLoginSuccess }: LoginScreenProps) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputRefs = [
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

  const handleChange = (index: number, value: string, isConfirm: boolean) => {
    if (value.length > 1) return

    const target = isConfirm ? confirmPin : pin
    const setter = isConfirm ? setConfirmPin : setPin
    const refs = isConfirm ? confirmRefs : inputRefs

    const newPin = [...target]
    newPin[index] = value
    setter(newPin)
    setError('')

    if (value && index < 3) {
      refs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>, isConfirm: boolean) => {
    const target = isConfirm ? confirmPin : pin
    const refs = isConfirm ? confirmRefs : inputRefs

    if (e.key === 'Backspace' && !target[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
  }

  const handleSubmit = async () => {
    const password = pin.join('')
    if (password.length !== 4) {
      setError('4자리 비밀번호를 입력해주세요')
      return
    }

    if (mode === 'setup') {
      if (step === 'enter') {
        // Move to confirm step
        setStep('confirm')
        setError('')
        setTimeout(() => confirmRefs[0].current?.focus(), 100)
        return
      }

      // Confirm step - check match
      const confirmPassword = confirmPin.join('')
      if (confirmPassword.length !== 4) {
        setError('확인 비밀번호를 입력해주세요')
        return
      }
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다')
        setConfirmPin(['', '', '', ''])
        confirmRefs[0].current?.focus()
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/geunnal/${pageId}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode === 'setup' ? 'setup' : 'login',
          password,
        }),
      })

      const data = (await response.json()) as { error?: string; token?: string }

      if (!response.ok) {
        throw new Error(data.error || (mode === 'setup' ? '설정 실패' : '로그인 실패'))
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(`geunnal-token-${pageId}`, data.token || '')
      }

      onLoginSuccess(data.token || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      if (mode === 'setup') {
        setStep('enter')
        setConfirmPin(['', '', '', ''])
      }
      setPin(['', '', '', ''])
      inputRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const isSetupConfirmStep = mode === 'setup' && step === 'confirm'
  const currentPin = isSetupConfirmStep ? confirmPin : pin
  const currentRefs = isSetupConfirmStep ? confirmRefs : inputRefs
  const buttonDisabled = loading || currentPin.join('').length !== 4

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
          <p className="text-sm text-[#5A5270]">
            {mode === 'setup' ? '그날 비밀번호 설정' : '그날 관리 페이지'}
          </p>
        </div>

        {/* PIN Input */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <p className="text-center text-sm text-[#5A5270] mb-6">
            {mode === 'setup'
              ? isSetupConfirmStep
                ? '확인을 위해 한 번 더 입력해주세요'
                : '모임 관리를 위한 4자리 비밀번호를 설정해주세요'
              : '4자리 비밀번호를 입력하세요'}
          </p>

          <div className="flex gap-4 justify-center mb-6">
            {currentPin.map((digit, index) => (
              <input
                key={`${isSetupConfirmStep ? 'confirm' : 'enter'}-${index}`}
                ref={currentRefs[index]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value, isSetupConfirmStep)}
                onKeyDown={(e) => handleKeyDown(index, e, isSetupConfirmStep)}
                className="w-14 h-14 text-center text-2xl font-bold border-2 border-[#E8E4F0] rounded-xl focus:border-[#8B75D0] focus:outline-none transition-colors"
                disabled={loading}
              />
            ))}
          </div>

          {/* Step indicator for setup mode */}
          {mode === 'setup' && (
            <div className="flex justify-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${step === 'enter' ? 'bg-[#8B75D0]' : 'bg-[#E8E4F0]'}`} />
              <div className={`w-2 h-2 rounded-full ${step === 'confirm' ? 'bg-[#8B75D0]' : 'bg-[#E8E4F0]'}`} />
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-[#F44336] mb-4">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={buttonDisabled}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: buttonDisabled
                ? '#9B8CC4'
                : 'linear-gradient(135deg, #8B75D0 0%, #D4899A 100%)',
            }}
          >
            {loading
              ? '처리 중...'
              : mode === 'setup'
                ? isSetupConfirmStep ? '설정 완료' : '다음'
                : '로그인'}
          </button>

          {/* Back button in confirm step */}
          {isSetupConfirmStep && !loading && (
            <button
              onClick={() => {
                setStep('enter')
                setConfirmPin(['', '', '', ''])
                setError('')
                setTimeout(() => inputRefs[0].current?.focus(), 100)
              }}
              className="w-full mt-2 py-2 text-sm text-[#9B8CC4] hover:text-[#8B75D0] transition-colors"
            >
              이전으로
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#9B8CC4] mt-6">
          {mode === 'setup'
            ? '설정한 비밀번호는 다음 접속 시 필요합니다'
            : '비밀번호를 잊으셨나요? 관리자에게 문의하세요.'}
        </p>
      </div>
    </div>
  )
}
