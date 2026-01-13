'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/providers/AuthProvider'

// 카카오 OAuth URL 생성 (클라이언트 사이드)
function getKakaoLoginUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI

  if (!clientId || !redirectUri) {
    console.error('Kakao OAuth 환경변수가 설정되지 않았습니다.')
    return '#'
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'profile_nickname profile_image account_email',
  })

  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
}

// 에러 메시지 사용자 친화적으로 변환
function getErrorMessage(error: string): { title: string; description: string } {
  const errorMap: Record<string, { title: string; description: string }> = {
    'no_code': {
      title: '인증 코드 오류',
      description: '카카오 로그인 인증 코드가 전달되지 않았습니다.',
    },
    'access_denied': {
      title: '접근 거부됨',
      description: '카카오 로그인이 취소되었습니다.',
    },
  }

  return errorMap[error] || {
    title: '로그인 실패',
    description: error,
  }
}

export default function LoginGate() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useAuth()

  const [showError, setShowError] = useState(false)
  const [errorDetails, setErrorDetails] = useState<{ title: string; description: string } | null>(null)
  const [showErrorDetail, setShowErrorDetail] = useState(false)
  const [rawError, setRawError] = useState<string>('')

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/my-invitations')
    }
  }, [status, router])

  // URL 에러 파라미터 처리
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setRawError(decodeURIComponent(error))
      setErrorDetails(getErrorMessage(error))
      setShowError(true)

      // URL에서 에러 파라미터 제거
      window.history.replaceState({}, '', '/')
    }
  }, [searchParams])

  // 로딩 중 화면
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 tracking-wide">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 이미 로그인된 경우 (리다이렉트 대기)
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 tracking-wide">이동 중...</p>
        </div>
      </div>
    )
  }

  const handleKakaoLogin = () => {
    const url = getKakaoLoginUrl()
    if (url !== '#') {
      window.location.href = url
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* 에러 토스트 */}
      {showError && errorDetails && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-white border border-red-100 rounded-2xl shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{errorDetails.title}</p>
                <p className="text-xs text-gray-500 mt-1">{errorDetails.description}</p>
                {rawError && rawError !== errorDetails.description && (
                  <button
                    onClick={() => setShowErrorDetail(!showErrorDetail)}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-2 underline underline-offset-2"
                  >
                    {showErrorDetail ? '접기' : '자세히 보기'}
                  </button>
                )}
                {showErrorDetail && rawError && (
                  <p className="text-xs text-gray-400 mt-2 p-2 bg-gray-50 rounded-lg break-all font-mono">
                    {rawError}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowError(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[420px]">
          {/* 로그인 카드 */}
          <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8 sm:p-10">
            {/* 로고/아이콘 */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-5">
                {/* 편지 아이콘 */}
                <svg
                  className="w-7 h-7 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <div className="relative h-8 w-36">
                <Image
                  src="/logo.png"
                  alt="Dear Drawer"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* 헤드라인 */}
            <div className="text-center mb-8">
              <h1 className="text-[22px] sm:text-[24px] font-semibold text-gray-900 leading-tight mb-3 tracking-tight">
                우리의 이야기를,
                <br />
                가장 예쁘게 기록하는 청첩장
              </h1>
              <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed">
                AI 가이드로 스토리를 완성하고,
                <br />
                링크로 간편하게 공유하세요.
              </p>
            </div>

            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              className="w-full h-[52px] bg-[#FEE500] hover:bg-[#FDDC3F] active:bg-[#F5D000] rounded-xl flex items-center justify-center gap-2.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2"
            >
              {/* 카카오 로고 */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 3C6.477 3 2 6.463 2 10.691c0 2.732 1.8 5.127 4.5 6.477-.2.727-.7 2.618-.8 3.018-.127.491.18.482.379.35.155-.103 2.479-1.683 3.479-2.358.47.063.96.094 1.442.094 5.523 0 10-3.463 10-7.691C22 6.463 17.523 3 12 3z"
                  fill="#391B1B"
                />
              </svg>
              <span className="text-[15px] font-medium text-[#391B1B]">
                카카오로 시작하기
              </span>
            </button>

          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="py-6 px-5">
        <div className="flex items-center justify-center gap-3 text-[11px] text-gray-400">
          <span>© Dear Drawer</span>
          <span className="w-px h-3 bg-gray-200" />
          <Link
            href="/privacy"
            className="hover:text-gray-500 transition-colors"
          >
            개인정보처리방침
          </Link>
        </div>
      </footer>
    </div>
  )
}
