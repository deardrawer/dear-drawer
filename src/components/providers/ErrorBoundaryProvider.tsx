'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { trackError } from '@/lib/analytics'

interface ErrorBoundaryProviderProps {
  children: ReactNode
}

// 전역 에러 fallback UI
function GlobalErrorFallback({ error, resetError }: { error: Error | null; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* 아이콘 */}
        <div className="w-20 h-20 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          앗! 문제가 발생했어요
        </h1>

        {/* 설명 */}
        <p className="text-gray-600 mb-6">
          예기치 않은 오류가 발생했습니다.<br />
          잠시 후 다시 시도해 주세요.
        </p>

        {/* 개발 모드에서만 에러 표시 */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-xs text-gray-500 mb-1">Error Details:</p>
            <p className="text-sm font-mono text-red-600 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-6 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
          >
            다시 시도
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            홈으로 이동
          </button>
        </div>

        {/* 지원 링크 */}
        <p className="mt-6 text-sm text-gray-400">
          문제가 계속되면{' '}
          <a href="mailto:support@deardrawer.com" className="text-rose-500 hover:underline">
            고객센터
          </a>
          로 문의해 주세요.
        </p>
      </div>
    </div>
  )
}

export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  const handleError = (error: Error) => {
    // 에러 추적
    trackError(error, {
      component: 'GlobalErrorBoundary',
      action: 'uncaught_error'
    })
  }

  return (
    <ErrorBoundary
      fallback={<GlobalErrorFallback error={null} resetError={() => window.location.reload()} />}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  )
}
