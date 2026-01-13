import { Suspense } from 'react'
import LoginGate from '@/components/auth/LoginGate'

// 로딩 폴백 컴포넌트
function LoginGateLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 tracking-wide">로딩 중...</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoginGateLoading />}>
      <LoginGate />
    </Suspense>
  )
}
