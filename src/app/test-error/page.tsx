'use client'

import { useState } from 'react'
import { ErrorBoundary, ErrorFallback, AsyncErrorBoundary } from '@/components/ErrorBoundary'

// 의도적으로 에러를 발생시키는 컴포넌트
function BuggyCounter() {
  const [count, setCount] = useState(0)

  if (count === 3) {
    throw new Error('카운터가 3에 도달했습니다! 의도적인 에러입니다.')
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-medium mb-2">버그가 있는 카운터</h3>
      <p className="text-gray-600 text-sm mb-3">카운터가 3이 되면 에러가 발생합니다.</p>
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold">{count}</span>
        <button
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          +1 증가
        </button>
      </div>
    </div>
  )
}

// 비동기 에러 컴포넌트
function AsyncErrorComponent() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('비동기 컴포넌트에서 에러가 발생했습니다!')
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-medium mb-2">비동기 에러 테스트</h3>
      <p className="text-gray-600 text-sm mb-3">버튼을 클릭하면 에러가 발생합니다.</p>
      <button
        onClick={() => setShouldError(true)}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        에러 발생시키기
      </button>
    </div>
  )
}

// 커스텀 폴백 UI
function CustomFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg text-center">
      <div className="text-4xl mb-2">🔮</div>
      <h3 className="font-bold text-purple-800 mb-2">커스텀 에러 UI</h3>
      <p className="text-purple-600 text-sm mb-3">이것은 커스텀 fallback UI입니다.</p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        복구하기
      </button>
    </div>
  )
}

// resetKey를 사용한 컴포넌트
function ResetKeyDemo() {
  const [key, setKey] = useState(0)
  const [triggerError, setTriggerError] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTriggerError(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          에러 발생
        </button>
        <button
          onClick={() => {
            setKey(k => k + 1)
            setTriggerError(false)
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          resetKey로 복구
        </button>
      </div>

      <ErrorBoundary resetKey={key}>
        <div className="p-4 bg-white rounded-lg shadow">
          {triggerError ? (
            <ThrowError />
          ) : (
            <p className="text-gray-600">resetKey: {key} - 정상 상태입니다.</p>
          )}
        </div>
      </ErrorBoundary>
    </div>
  )
}

function ThrowError(): never {
  throw new Error('resetKey 테스트 에러!')
}

export default function TestErrorPage() {
  const [showTests, setShowTests] = useState({
    basic: true,
    custom: true,
    resetKey: true,
    async: true
  })

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ErrorBoundary 테스트</h1>
          <p className="text-gray-600">
            다양한 에러 시나리오를 테스트하고 ErrorBoundary의 동작을 확인합니다.
          </p>
        </div>

        {/* 테스트 토글 */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="font-medium mb-3">테스트 항목 선택</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(showTests).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setShowTests(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="w-4 h-4 text-rose-500"
                />
                <span className="text-sm">{key}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {/* 1. 기본 ErrorBoundary 테스트 */}
          {showTests.basic && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                기본 ErrorBoundary
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                카운터가 3에 도달하면 에러가 발생합니다. 기본 fallback UI가 표시됩니다.
              </p>
              <ErrorBoundary>
                <BuggyCounter />
              </ErrorBoundary>
            </section>
          )}

          {/* 2. 커스텀 Fallback UI */}
          {showTests.custom && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                커스텀 Fallback UI
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                커스텀 fallback 컴포넌트를 사용한 에러 처리입니다.
              </p>
              <ErrorBoundary
                fallback={<CustomFallback resetError={() => window.location.reload()} />}
              >
                <AsyncErrorComponent />
              </ErrorBoundary>
            </section>
          )}

          {/* 3. resetKey를 이용한 복구 */}
          {showTests.resetKey && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
                resetKey를 이용한 복구
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                resetKey prop을 변경하면 ErrorBoundary가 자동으로 리셋됩니다.
              </p>
              <ResetKeyDemo />
            </section>
          )}

          {/* 4. AsyncErrorBoundary */}
          {showTests.async && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
                AsyncErrorBoundary (Suspense + Error)
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Suspense와 ErrorBoundary가 결합된 컴포넌트입니다.
              </p>
              <AsyncErrorBoundary
                loadingFallback={
                  <div className="p-4 bg-white rounded-lg shadow animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                }
              >
                <div className="p-4 bg-white rounded-lg shadow">
                  <h3 className="font-medium mb-2">AsyncErrorBoundary 테스트</h3>
                  <p className="text-gray-600 text-sm">
                    이 컴포넌트는 Suspense 로딩과 에러 처리를 모두 지원합니다.
                  </p>
                </div>
              </AsyncErrorBoundary>
            </section>
          )}

          {/* 5. ErrorFallback 컴포넌트 직접 사용 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">5</span>
              ErrorFallback 컴포넌트 (직접 사용)
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              ErrorFallback 컴포넌트를 독립적으로 사용할 수 있습니다.
            </p>
            <ErrorFallback
              error={new Error('예시 에러 메시지입니다.')}
              title="커스텀 에러 제목"
              description="이것은 ErrorFallback 컴포넌트의 직접 사용 예시입니다."
              resetError={() => alert('복구 버튼이 클릭되었습니다!')}
            />
          </section>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 p-6 bg-gray-800 text-white rounded-lg">
          <h2 className="text-lg font-semibold mb-4">사용법</h2>
          <pre className="text-sm overflow-x-auto">
{`import { ErrorBoundary, ErrorFallback, AsyncErrorBoundary } from '@/components/ErrorBoundary'

// 기본 사용
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// 커스텀 fallback
<ErrorBoundary fallback={<CustomError />}>
  <MyComponent />
</ErrorBoundary>

// resetKey로 복구
<ErrorBoundary resetKey={someKey}>
  <MyComponent />
</ErrorBoundary>

// Async + Error 처리
<AsyncErrorBoundary loadingFallback={<Loading />}>
  <AsyncComponent />
</AsyncErrorBoundary>`}
          </pre>
        </div>
      </div>
    </div>
  )
}
