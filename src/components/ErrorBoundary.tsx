/**
 * ErrorBoundary 컴포넌트
 * - React 에러 경계
 * - 에러 추적 연동
 * - 복구 기능
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { trackError } from '@/lib/analytics'

// ============================================================
// Types
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKey?: string | number
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ============================================================
// ErrorBoundary Component
// ============================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // 에러 추적
    trackError(error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack || undefined
    })

    // 커스텀 에러 핸들러 호출
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // resetKey가 변경되면 에러 상태 초기화
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.resetError()
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================
// Default Error Fallback
// ============================================================

interface DefaultErrorFallbackProps {
  error: Error | null
  resetError: () => void
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          문제가 발생했습니다
        </h2>

        <p className="text-gray-600 mb-4">
          예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-left">
            <p className="text-sm font-mono text-red-600 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            다시 시도
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ErrorFallback Component (Exportable)
// ============================================================

interface ErrorFallbackProps {
  error?: Error | null
  resetError?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({
  error,
  resetError,
  title = '문제가 발생했습니다',
  description = '예기치 않은 오류가 발생했습니다.'
}: ErrorFallbackProps) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-600 mt-1">{description}</p>

          {process.env.NODE_ENV === 'development' && error && (
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700 overflow-auto max-h-32">
              {error.message}
            </pre>
          )}

          {resetError && (
            <button
              onClick={resetError}
              className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// withErrorBoundary HOC
// ============================================================

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}

// ============================================================
// useErrorHandler Hook
// ============================================================

export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    trackError(error, { component: 'useErrorHandler' })
    setError(error)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  // 에러가 있으면 throw하여 ErrorBoundary가 잡도록 함
  if (error) {
    throw error
  }

  return { handleError, resetError }
}

// ============================================================
// AsyncErrorBoundary for Suspense
// ============================================================

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

export function AsyncErrorBoundary({
  children,
  fallback,
  loadingFallback
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      <React.Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  )
}

function DefaultLoadingFallback() {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
