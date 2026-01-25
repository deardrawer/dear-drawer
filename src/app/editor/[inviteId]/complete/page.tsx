'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditorCompletePage() {
  const params = useParams()
  const router = useRouter()
  const inviteId = params.inviteId as string

  // 템플릿 타입 (PARENTS가 아니면 OUR/FAMILY)
  const [templateType, setTemplateType] = useState<string | null>(null)

  // 비밀번호 입력
  const [password, setPassword] = useState(['', '', '', ''])
  const [confirmPassword, setConfirmPassword] = useState(['', '', '', ''])
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSettingPassword, setIsSettingPassword] = useState(false)
  const [isPasswordSet, setIsPasswordSet] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  // 링크 복사 상태
  const [isCopied, setIsCopied] = useState(false)

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const confirmInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // 관리자 상태 및 템플릿 타입 확인
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 초대장 정보 가져오기 (템플릿 타입 확인)
        const inviteRes = await fetch(`/api/invite/${inviteId}`)
        if (inviteRes.ok) {
          const inviteData: { template_id?: string } = await inviteRes.json()
          setTemplateType(inviteData.template_id || null)
        }

        // PARENTS 템플릿인 경우에만 관리자 상태 확인
        const res = await fetch(`/api/invite/${inviteId}/admin/setup`)
        if (res.ok) {
          const data: { hasAdmin?: boolean } = await res.json()
          setIsPasswordSet(data.hasAdmin ?? false)
        }
      } catch (error) {
        console.error('Failed to check status:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkStatus()
  }, [inviteId])

  // 비밀번호 입력 핸들러
  const handlePasswordChange = (index: number, value: string) => {
    // 숫자만 허용
    if (value && !/^\d$/.test(value)) return

    const newPassword = [...password]
    newPassword[index] = value
    setPassword(newPassword)
    setPasswordError('')

    // 다음 칸으로 자동 이동
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
    // 마지막 칸 입력 완료 시 확인 입력창으로 이동
    else if (value && index === 3) {
      const fullPassword = [...newPassword.slice(0, 3), value].join('')
      if (fullPassword.length === 4) {
        setShowConfirm(true)
        setTimeout(() => confirmInputRefs[0].current?.focus(), 100)
      }
    }
  }

  // 확인 비밀번호 입력 핸들러
  const handleConfirmPasswordChange = (index: number, value: string) => {
    // 숫자만 허용
    if (value && !/^\d$/.test(value)) return

    const newConfirmPassword = [...confirmPassword]
    newConfirmPassword[index] = value
    setConfirmPassword(newConfirmPassword)
    setPasswordError('')

    // 다음 칸으로 자동 이동
    if (value && index < 3) {
      confirmInputRefs[index + 1].current?.focus()
    }
  }

  // 키 입력 핸들러 (백스페이스)
  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean = false) => {
    const currentPassword = isConfirm ? confirmPassword : password
    const refs = isConfirm ? confirmInputRefs : inputRefs

    if (e.key === 'Backspace' && !currentPassword[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
    // 확인 입력의 첫 칸에서 백스페이스 시 원래 비밀번호로 돌아가기
    if (e.key === 'Backspace' && isConfirm && index === 0 && !confirmPassword[0]) {
      setShowConfirm(false)
      inputRefs[3].current?.focus()
    }
  }

  // 붙여넣기 핸들러
  const handlePaste = (e: React.ClipboardEvent, isConfirm: boolean = false) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData.length === 4) {
      if (isConfirm) {
        setConfirmPassword(pastedData.split(''))
      } else {
        setPassword(pastedData.split(''))
        setShowConfirm(true)
        setTimeout(() => confirmInputRefs[0].current?.focus(), 100)
      }
    }
  }

  // 비밀번호 초기화
  const handleResetPassword = () => {
    setPassword(['', '', '', ''])
    setConfirmPassword(['', '', '', ''])
    setShowConfirm(false)
    setPasswordError('')
    inputRefs[0].current?.focus()
  }

  // 비밀번호 설정
  const handleSetPassword = async () => {
    const fullPassword = password.join('')
    const fullConfirmPassword = confirmPassword.join('')

    if (fullPassword.length !== 4) {
      setPasswordError('4자리 숫자를 모두 입력해주세요')
      return
    }

    if (fullConfirmPassword.length !== 4) {
      setPasswordError('확인 비밀번호를 입력해주세요')
      confirmInputRefs[0].current?.focus()
      return
    }

    if (fullPassword !== fullConfirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다')
      setConfirmPassword(['', '', '', ''])
      confirmInputRefs[0].current?.focus()
      return
    }

    setIsSettingPassword(true)
    setPasswordError('')

    try {
      const res = await fetch(`/api/invite/${inviteId}/admin/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: fullPassword }),
      })

      const data: { success?: boolean; token?: string; error?: string; alreadySet?: boolean } = await res.json()

      if (res.ok && data.success) {
        setIsPasswordSet(true)
        // 토큰 저장 (바로 관리자 페이지 접근 가능하도록)
        if (data.token) {
          localStorage.setItem(`admin_token_${inviteId}`, data.token)
          // 설정 완료 후 대시보드로 자동 이동
          router.push(`/invite/${inviteId}/admin/dashboard`)
        }
      } else {
        setPasswordError(data.error || '설정에 실패했습니다')
        if (data.alreadySet) {
          setIsPasswordSet(true)
        }
      }
    } catch {
      setPasswordError('오류가 발생했습니다')
    } finally {
      setIsSettingPassword(false)
    }
  }

  // 게스트 관리 페이지로 이동
  const handleGoToGuestManager = () => {
    if (!isPasswordSet) {
      setPasswordError('먼저 비밀번호를 설정해주세요')
      inputRefs[0].current?.focus()
      return
    }
    router.push(`/invite/${inviteId}/admin`)
  }

  // 링크 복사
  const handleCopyLink = useCallback(async () => {
    const basePath = templateType === 'parents-formal' ? '/invite' : '/invitation'
    const url = `${window.location.origin}${basePath}/${inviteId}`
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // 폴백
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }, [inviteId, templateType])

  // 카카오톡 공유
  const handleKakaoShare = () => {
    const basePath = templateType === 'parents-formal' ? '/invite' : '/invitation'
    const url = `${window.location.origin}${basePath}/${inviteId}`
    // 카카오톡 공유 링크 (카카오 SDK 없이 간단히)
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(url)}`
    window.open(kakaoUrl, '_blank', 'width=600,height=700')
  }

  if (isCheckingStatus) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F5F3EE' }}
      >
        <div
          className="w-10 h-10 border-2 rounded-full animate-spin"
          style={{ borderColor: '#C9A962', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{
        backgroundColor: '#F5F3EE',
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
    >
      {/* Pretendard 폰트 */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
      />

      <div className="w-full max-w-[400px]">
        {/* 축하 헤더 */}
        <div className="text-center mb-8 pt-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: '#2C2C2C' }}
          >
            청첩장이 완성되었습니다!
          </h1>
          <p
            className="text-sm"
            style={{ color: '#888' }}
          >
            {templateType === 'parents-formal'
              ? '이제 게스트를 초대하고 관리할 수 있어요'
              : '링크를 공유하여 소중한 분들을 초대해보세요'}
          </p>
        </div>

        {/* 비밀번호 설정 섹션 - PARENTS 템플릿만 표시 */}
        {templateType === 'parents-formal' && (
          <div
            className="bg-white rounded-2xl p-6 mb-4"
            style={{ border: '1px solid #E8E4DD' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔐</span>
              <div>
                <h2
                  className="font-semibold"
                  style={{ color: '#2C2C2C' }}
                >
                  관리자 비밀번호 설정
                </h2>
                <p
                  className="text-xs"
                  style={{ color: '#888' }}
                >
                  게스트 관리 페이지 접속용
                </p>
              </div>
            </div>

            {/* 비밀번호 입력 */}
            {!isPasswordSet && (
              <p
                className="text-center text-xs mb-2"
                style={{ color: '#888' }}
              >
                {showConfirm ? '확인을 위해 한번 더 입력해주세요' : '4자리 숫자 비밀번호'}
              </p>
            )}

            {/* 첫 번째 비밀번호 입력 */}
            <div className={`flex justify-center gap-3 ${showConfirm && !isPasswordSet ? 'mb-2 opacity-50' : 'mb-4'}`}>
              {password.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasswordChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e, false)}
                  onPaste={index === 0 ? (e) => handlePaste(e, false) : undefined}
                  disabled={isPasswordSet || showConfirm}
                  className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: passwordError && !showConfirm ? '#DC2626' : isPasswordSet ? '#4CAF50' : showConfirm ? '#C9A962' : '#E8E4DD',
                    backgroundColor: isPasswordSet ? '#F0FDF4' : showConfirm ? '#FFFBF0' : '#FFF',
                    color: '#2C2C2C',
                  }}
                  onFocus={(e) => {
                    if (!isPasswordSet && !passwordError && !showConfirm) {
                      e.target.style.borderColor = '#C9A962'
                      e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)'
                    }
                  }}
                  onBlur={(e) => {
                    if (!isPasswordSet && !passwordError && !showConfirm) {
                      e.target.style.borderColor = '#E8E4DD'
                      e.target.style.boxShadow = 'none'
                    }
                  }}
                />
              ))}
            </div>

            {/* 확인 비밀번호 입력 */}
            {showConfirm && !isPasswordSet && (
              <div className="flex justify-center gap-3 mb-4">
                {confirmPassword.map((digit, index) => (
                  <input
                    key={`confirm-${index}`}
                    ref={confirmInputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleConfirmPasswordChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e, true)}
                    onPaste={index === 0 ? (e) => handlePaste(e, true) : undefined}
                    className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-150 focus:outline-none"
                    style={{
                      borderColor: passwordError ? '#DC2626' : '#E8E4DD',
                      backgroundColor: '#FFF',
                      color: '#2C2C2C',
                    }}
                    onFocus={(e) => {
                      if (!passwordError) {
                        e.target.style.borderColor = '#C9A962'
                        e.target.style.boxShadow = '0 0 0 3px rgba(201, 169, 98, 0.1)'
                      }
                    }}
                    onBlur={(e) => {
                      if (!passwordError) {
                        e.target.style.borderColor = '#E8E4DD'
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                  />
                ))}
              </div>
            )}

            {/* 에러 메시지 */}
            {passwordError && (
              <p
                className="text-center text-sm mb-4"
                style={{ color: '#DC2626' }}
              >
                {passwordError}
              </p>
            )}

            {/* 설정 완료 표시 또는 버튼 */}
            {isPasswordSet ? (
              <div
                className="flex items-center justify-center gap-2 py-3 rounded-xl"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <span style={{ color: '#4CAF50' }}>✓</span>
                <span
                  className="font-medium"
                  style={{ color: '#4CAF50' }}
                >
                  설정 완료됨
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleSetPassword}
                  disabled={isSettingPassword || !showConfirm || confirmPassword.some((d) => !d)}
                  className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  style={{ backgroundColor: '#C9A962' }}
                >
                  {isSettingPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#FFF' }}
                      />
                      설정 중...
                    </span>
                  ) : (
                    '설정 완료'
                  )}
                </button>
                {(password.some((d) => d) || showConfirm) && (
                  <button
                    onClick={handleResetPassword}
                    className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98]"
                    style={{ color: '#888' }}
                  >
                    다시 입력하기
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          {/* 청첩장 미리보기 */}
          <Link
            href={templateType === 'parents-formal' ? `/invite/${inviteId}` : `/invitation/${inviteId}`}
            target="_blank"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-medium transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: '#FFF',
              border: '1px solid #E8E4DD',
              color: '#2C2C2C',
            }}
          >
            <span className="text-xl">📱</span>
            청첩장 미리보기
          </Link>

          {/* 게스트 관리하기 - PARENTS 템플릿만 표시 */}
          {templateType === 'parents-formal' && (
            <button
              onClick={handleGoToGuestManager}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-medium transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: '#FFF',
                border: '1px solid #E8E4DD',
                color: '#2C2C2C',
              }}
            >
              <span className="text-xl">👥</span>
              게스트 관리하기
            </button>
          )}

          {/* 내 템플릿 보기 - OUR/FAMILY 템플릿만 표시 */}
          {templateType !== 'parents-formal' && (
            <Link
              href="/my-invitations"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-medium transition-all duration-150 active:scale-[0.98]"
              style={{
                backgroundColor: '#FFF',
                border: '1px solid #E8E4DD',
                color: '#2C2C2C',
              }}
            >
              <span className="text-xl">📋</span>
              청첩장 관리하기
            </Link>
          )}

          {/* 카카오톡 공유 */}
          <button
            onClick={handleKakaoShare}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-medium transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: '#FEE500',
              color: '#191919',
            }}
          >
            <span className="text-xl">💬</span>
            카카오톡 공유
          </button>

          {/* 링크 복사 */}
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-medium transition-all duration-150 active:scale-[0.98]"
            style={{
              backgroundColor: isCopied ? '#4CAF50' : '#2C2C2C',
              color: '#FFF',
            }}
          >
            <span className="text-xl">{isCopied ? '✓' : '📋'}</span>
            {isCopied ? '복사됨!' : '링크 복사'}
          </button>
        </div>

        {/* 하단 안내 */}
        <div
          className="text-center mt-8 pb-8"
          style={{ color: '#999' }}
        >
          {templateType === 'parents-formal' ? (
            <>
              <p className="text-xs mb-2">
                게스트 관리에서 개인화 링크를 생성할 수 있어요
              </p>
              <p className="text-xs">
                각 게스트에게 맞춤 인사말을 보내보세요 ✨
              </p>
            </>
          ) : (
            <>
              <p className="text-xs mb-2">
                카카오톡이나 링크로 청첩장을 공유해보세요
              </p>
              <p className="text-xs">
                소중한 분들에게 행복한 소식을 전해보세요 💕
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
