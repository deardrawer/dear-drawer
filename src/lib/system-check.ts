/**
 * 시스템 검증 유틸리티
 * 브라우저 콘솔에서 실행하여 모든 유틸리티 동작 확인
 */

import { apiCache, debounce, throttle, measureTime, getCachedResult, setCachedResult, clearCache } from './performance'
import { trackEvent, trackPageView, trackPerformance, trackAPIUsage, getAPIUsageSummary, getOrCreateSession } from './analytics'

// ============================================================
// System Check Functions
// ============================================================

interface CheckResult {
  name: string
  status: 'pass' | 'fail'
  message: string
  duration?: number
}

export async function runSystemCheck(): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  // 1. Cache Manager Test
  results.push(checkCacheManager())

  // 2. Debounce Test
  results.push(await checkDebounce())

  // 3. Throttle Test
  results.push(await checkThrottle())

  // 4. MeasureTime Test
  results.push(checkMeasureTime())

  // 5. Analytics Event Test
  results.push(checkAnalyticsEvent())

  // 6. API Usage Tracking Test
  results.push(checkAPIUsageTracking())

  // 7. Session Management Test
  results.push(checkSessionManagement())

  // 8. LocalStorage Test
  results.push(checkLocalStorage())

  // Print Summary
  printSummary(results)

  return results
}

// ============================================================
// Individual Checks
// ============================================================

function checkCacheManager(): CheckResult {
  try {
    const testKey = 'test-cache-key'
    const testValue = { data: 'test-value', timestamp: Date.now() }

    // Set
    setCachedResult(testKey, testValue)

    // Get
    const retrieved = getCachedResult<typeof testValue>(testKey)

    if (!retrieved || retrieved.data !== testValue.data) {
      return { name: 'Cache Manager', status: 'fail', message: 'Cache get/set mismatch' }
    }

    // Clear
    clearCache()
    const afterClear = getCachedResult<typeof testValue>(testKey)

    if (afterClear !== null) {
      return { name: 'Cache Manager', status: 'fail', message: 'Cache clear failed' }
    }

    return { name: 'Cache Manager', status: 'pass', message: 'All cache operations work correctly' }
  } catch (error) {
    return { name: 'Cache Manager', status: 'fail', message: `Error: ${(error as Error).message}` }
  }
}

async function checkDebounce(): Promise<CheckResult> {
  return new Promise((resolve) => {
    try {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 50)

      // Call multiple times rapidly
      debouncedFn()
      debouncedFn()
      debouncedFn()
      debouncedFn()
      debouncedFn()

      // Wait for debounce to complete
      setTimeout(() => {
        if (callCount === 1) {
          resolve({ name: 'Debounce', status: 'pass', message: 'Debounce correctly batched 5 calls into 1' })
        } else {
          resolve({ name: 'Debounce', status: 'fail', message: `Expected 1 call, got ${callCount}` })
        }
      }, 100)
    } catch (error) {
      resolve({ name: 'Debounce', status: 'fail', message: `Error: ${(error as Error).message}` })
    }
  })
}

async function checkThrottle(): Promise<CheckResult> {
  return new Promise((resolve) => {
    try {
      let callCount = 0
      const throttledFn = throttle(() => {
        callCount++
      }, 50)

      // Call multiple times rapidly
      throttledFn() // This should execute immediately
      throttledFn() // This should be throttled
      throttledFn() // This should be throttled

      // Wait for throttle to complete
      setTimeout(() => {
        if (callCount >= 1 && callCount <= 2) {
          resolve({ name: 'Throttle', status: 'pass', message: `Throttle correctly limited calls (${callCount} executions)` })
        } else {
          resolve({ name: 'Throttle', status: 'fail', message: `Unexpected call count: ${callCount}` })
        }
      }, 150)
    } catch (error) {
      resolve({ name: 'Throttle', status: 'fail', message: `Error: ${(error as Error).message}` })
    }
  })
}

function checkMeasureTime(): CheckResult {
  try {
    const { result, duration } = measureTime(() => {
      // Simple computation
      let sum = 0
      for (let i = 0; i < 1000; i++) {
        sum += i
      }
      return sum
    }, 'Test Computation')

    if (typeof result === 'number' && typeof duration === 'number' && duration >= 0) {
      return { name: 'MeasureTime', status: 'pass', message: `Measured ${duration.toFixed(2)}ms`, duration }
    }

    return { name: 'MeasureTime', status: 'fail', message: 'Invalid measurement result' }
  } catch (error) {
    return { name: 'MeasureTime', status: 'fail', message: `Error: ${(error as Error).message}` }
  }
}

function checkAnalyticsEvent(): CheckResult {
  try {
    // These will just log in development mode
    trackEvent('system-check', 'test', 'test-label', 1)
    trackPageView('/system-check', 'System Check Page')
    trackPerformance('test-metric', 100)

    return { name: 'Analytics Events', status: 'pass', message: 'Event tracking functions work correctly' }
  } catch (error) {
    return { name: 'Analytics Events', status: 'fail', message: `Error: ${(error as Error).message}` }
  }
}

function checkAPIUsageTracking(): CheckResult {
  try {
    // Track a test API usage
    trackAPIUsage('/api/test', 100, 250, true)

    const summary = getAPIUsageSummary()

    if (typeof summary.totalCalls === 'number' && typeof summary.totalTokens === 'number') {
      return {
        name: 'API Usage Tracking',
        status: 'pass',
        message: `Tracking works: ${summary.totalCalls} calls, ${summary.totalTokens} tokens`
      }
    }

    return { name: 'API Usage Tracking', status: 'fail', message: 'Invalid summary data' }
  } catch (error) {
    return { name: 'API Usage Tracking', status: 'fail', message: `Error: ${(error as Error).message}` }
  }
}

function checkSessionManagement(): CheckResult {
  try {
    const session = getOrCreateSession()

    if (session && session.id && session.startedAt) {
      return {
        name: 'Session Management',
        status: 'pass',
        message: `Session ID: ${session.id.substring(0, 20)}...`
      }
    }

    return { name: 'Session Management', status: 'fail', message: 'Invalid session data' }
  } catch (error) {
    return { name: 'Session Management', status: 'fail', message: `Error: ${(error as Error).message}` }
  }
}

function checkLocalStorage(): CheckResult {
  try {
    if (typeof window === 'undefined') {
      return { name: 'LocalStorage', status: 'pass', message: 'Server-side: skipped' }
    }

    const testKey = 'system-check-test'
    const testValue = 'test-value-' + Date.now()

    localStorage.setItem(testKey, testValue)
    const retrieved = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)

    if (retrieved === testValue) {
      return { name: 'LocalStorage', status: 'pass', message: 'LocalStorage read/write works correctly' }
    }

    return { name: 'LocalStorage', status: 'fail', message: 'Value mismatch' }
  } catch (error) {
    return { name: 'LocalStorage', status: 'fail', message: `Error: ${(error as Error).message}` }
  }
}

// ============================================================
// Summary Output
// ============================================================

function printSummary(results: CheckResult[]): void {
  console.log('\n========================================')
  console.log('          SYSTEM CHECK RESULTS')
  console.log('========================================\n')

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✓' : '✗'
    const color = result.status === 'pass' ? '\x1b[32m' : '\x1b[31m'
    console.log(`${color}${icon}\x1b[0m ${result.name}: ${result.message}`)
  })

  console.log('\n----------------------------------------')
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  console.log('========================================\n')
}

// ============================================================
// Export for Console
// ============================================================

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as Window & { runSystemCheck?: typeof runSystemCheck }).runSystemCheck = runSystemCheck
}

export default runSystemCheck
