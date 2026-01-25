'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const params = useParams()
  const router = useRouter()
  const inviteId = params.inviteId as string

  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFirstSetup, setIsFirstSetup] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // 이미 로그인되어 있는지 확인
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(`admin_token_${inviteId}`)
      if (token) {
        try {
          const res = await fetch(`/api/invite/${inviteId}/admin/auth`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const data: { isAuthenticated?: boolean } = await res.json()
          if (data.isAuthenticated) {
            router.replace(`/invite/${inviteId}/admin/dashboard`)
            return
          }
        } catch {
          localStorage.removeItem(`admin_token_${inviteId}`)
        }
      }

      // 최초 설정인지 확인
      try {
        const res = await fetch(`/api/invite/${inviteId}/admin/auth`)
        const data: { hasAdmin?: boolean } = await res.json()
        setIsFirstSetup(!data.hasAdmin)
      } catch {
        // 에러 무시
      }
    }
    checkAuth()
  }, [inviteId, router])

  // 토스트 표시
  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  // 로그인 시도
  const handleLogin = useCallback(async (pin: string) => {
    if (pin.length !== 4) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/invite/${inviteId}/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pin }),
      })

      const data: { success?: boolean; token?: string; isFirstSetup?: boolean; error?: string } = await res.json()

      if (data.success) {
        localStorage.setItem(`admin_token_${inviteId}`, data.token || '')
        if (data.isFirstSetup) {
          showToastMessage('비밀번호가 설정되었습니다')
        }
        setTimeout(() => {
          router.push(`/invite/${inviteId}/admin/dashboard`)
        }, 300)
      } else {
        setPassword('')
        showToastMessage(data.error || '비밀번호가 틀렸습니다')
      }
    } catch {
      setPassword('')
      showToastMessage('오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [inviteId, router])

  // 숫자 입력
  const handleNumberClick = (num: string) => {
    if (password.length < 4 && !isLoading) {
      const newPassword = password + num
      setPassword(newPassword)
      if (newPassword.length === 4) {
        handleLogin(newPassword)
      }
    }
  }

  // 삭제
  const handleDelete = () => {
    if (!isLoading) {
      setPassword(prev => prev.slice(0, -1))
    }
  }

  // 전체 삭제
  const handleClear = () => {
    if (!isLoading) {
      setPassword('')
    }
  }

  return (
    <>
      {/* Pretendard 폰트 로드 */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
      />
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          backgroundColor: '#F5F3EE',
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        }}
      >
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <div
            className="text-xs tracking-[3px] mb-3 font-medium"
            style={{ color: '#C9A962' }}
          >
            FAMILY INVITATION
          </div>
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ color: '#2C2C2C' }}
          >
            관리자 페이지
          </h1>
          <p
            className="text-sm font-medium"
            style={{ color: '#666' }}
          >
            {isFirstSetup
              ? '4자리 비밀번호를 설정해주세요'
              : '비밀번호를 입력해주세요'}
          </p>
        </div>

      {/* 비밀번호 표시 */}
      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all duration-200"
            style={{
              backgroundColor: password.length > i ? '#C9A962' : 'transparent',
              border: `2px solid ${password.length > i ? '#C9A962' : '#D0D0D0'}`,
              transform: password.length > i ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* 숫자 키패드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 72px)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((key) => (
          <button
            key={key}
            onClick={() => {
              if (key === '←') handleDelete()
              else if (key === 'C') handleClear()
              else handleNumberClick(key)
            }}
            disabled={isLoading}
            className="transition-all duration-150 active:scale-95"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: key === 'C' || key === '←' ? '#E8E4DD' : '#FFFFFF',
              color: key === 'C' || key === '←' ? '#666' : '#2C2C2C',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              opacity: isLoading ? 0.5 : 1,
              fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              fontSize: key === 'C' || key === '←' ? '16px' : '24px',
              fontWeight: key === 'C' || key === '←' ? 500 : 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {key}
          </button>
        ))}
        </div>

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#666' }}>
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: '#C9A962', borderTopColor: 'transparent' }}
            />
            확인 중...
          </div>
        )}

        {/* 하단 안내 */}
        <div
          className="absolute bottom-8 text-center text-xs font-medium"
          style={{ color: '#999' }}
        >
          <p>게스트 관리 및 개인화 링크 생성</p>
        </div>

        {/* 토스트 메시지 */}
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300"
          style={{
            backgroundColor: '#2C2C2C',
            color: '#FFF',
            opacity: showToast ? 1 : 0,
            transform: `translateX(-50%) translateY(${showToast ? 0 : 20}px)`,
            pointerEvents: showToast ? 'auto' : 'none',
          }}
        >
          {toastMessage}
        </div>
      </div>
    </>
  )
}
