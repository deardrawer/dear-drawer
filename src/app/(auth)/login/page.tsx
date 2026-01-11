'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()

  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI

    if (!clientId || !redirectUri) {
      alert('카카오 로그인 설정이 되어있지 않습니다.')
      return
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'profile_nickname profile_image',
    })

    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
  }

  // Check if already logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          router.replace('/my-invitations')
        }
      })
      .catch(() => {
        // Not logged in, stay on login page
      })
  }, [router])

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-gray-200 p-10">
        <div className="text-center mb-10">
          <Link href="/" className="text-xl font-light tracking-wider text-black uppercase">
            dear drawer
          </Link>
          <p className="text-gray-400 mt-3 text-sm font-light">Sign in to manage your invitations</p>
        </div>

        <div className="space-y-5">
          {/* Kakao Login Button */}
          <button
            onClick={handleKakaoLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium text-sm tracking-wider transition-all duration-200"
          >
            {/* Kakao Icon */}
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.734 1.8 5.127 4.5 6.47-.156.561-.988 3.538-1.02 3.766 0 0-.02.167.088.231.109.064.237.015.237.015.314-.044 3.636-2.371 4.2-2.773.627.089 1.303.143 1.995.143 5.523 0 10-3.463 10-7.852S17.523 3 12 3" />
            </svg>
            카카오로 시작하기
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>로그인하면 서비스 이용약관과</p>
          <p>개인정보처리방침에 동의하게 됩니다.</p>
        </div>
      </div>
    </div>
  )
}
