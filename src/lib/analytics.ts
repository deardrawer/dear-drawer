/**
 * 분석 및 모니터링 유틸리티
 * - 이벤트 추적
 * - 페이지 뷰 추적
 * - 에러 추적
 * - 성능 메트릭
 * - API 사용량 추적
 */

// ============================================================
// Types
// ============================================================

interface EventData {
  category: string
  action: string
  label?: string
  value?: number
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

interface APIUsage {
  endpoint: string
  tokens: number
  duration: number
  timestamp: number
  success: boolean
}

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  [key: string]: unknown
}

// ============================================================
// Environment Check
// ============================================================

const isDev = process.env.NODE_ENV === 'development'
const isBrowser = typeof window !== 'undefined'

// ============================================================
// Event Tracking
// ============================================================

export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  const eventData: EventData = { category, action, label, value }

  if (isDev) {
    console.log('[Analytics] Event:', eventData)
    return
  }

  if (!isBrowser) return

  // Google Analytics 4
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (gtag) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    })
  }
}

// ============================================================
// Page View Tracking
// ============================================================

export function trackPageView(path: string, title?: string): void {
  if (isDev) {
    console.log('[Analytics] Page view:', { path, title })
    return
  }

  if (!isBrowser) return

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (gtag) {
    gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: path,
      page_title: title
    })
  }
}

// ============================================================
// Error Tracking
// ============================================================

export function trackError(
  error: Error,
  context?: ErrorContext
): void {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context
  }

  console.error('[Analytics] Error:', errorData)

  if (isDev) return
  if (!isBrowser) return

  // Sentry 또는 다른 에러 트래킹 서비스
  const Sentry = (window as unknown as { Sentry?: { captureException: (e: Error, ctx?: unknown) => void } }).Sentry
  if (Sentry) {
    Sentry.captureException(error, {
      extra: context
    })
  }

  // 커스텀 에러 로깅 API
  try {
    fetch('/api/log/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(() => {
      // 실패해도 무시
    })
  } catch {
    // 실패해도 무시
  }
}

// ============================================================
// Performance Tracking
// ============================================================

const performanceMetrics: PerformanceMetric[] = []

export function trackPerformance(metric: string, value: number): void {
  const data: PerformanceMetric = {
    name: metric,
    value,
    timestamp: Date.now()
  }

  performanceMetrics.push(data)

  // 최근 100개만 유지
  if (performanceMetrics.length > 100) {
    performanceMetrics.shift()
  }

  if (isDev) {
    console.log('[Analytics] Performance:', data)
    return
  }

  if (!isBrowser) return

  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (gtag) {
    gtag('event', 'timing_complete', {
      name: metric,
      value: Math.round(value),
      event_category: 'Performance'
    })
  }
}

export function getPerformanceMetrics(): PerformanceMetric[] {
  return [...performanceMetrics]
}

// ============================================================
// API Usage Tracking
// ============================================================

const USAGE_STORAGE_KEY = 'wedding-ai-api-usage'
const MAX_USAGE_HISTORY = 100

export function trackAPIUsage(
  endpoint: string,
  tokens: number,
  duration: number,
  success: boolean = true
): void {
  const usage: APIUsage = {
    endpoint,
    tokens,
    duration,
    timestamp: Date.now(),
    success
  }

  if (isDev) {
    console.log('[Analytics] API Usage:', usage)
  }

  if (!isBrowser) return

  try {
    const history = getAPIUsageHistory()
    history.push(usage)

    // 최근 기록만 유지
    while (history.length > MAX_USAGE_HISTORY) {
      history.shift()
    }

    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save API usage:', error)
  }
}

export function getAPIUsageHistory(): APIUsage[] {
  if (!isBrowser) return []

  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function getAPIUsageSummary(): {
  totalCalls: number
  totalTokens: number
  avgDuration: number
  successRate: number
} {
  const history = getAPIUsageHistory()

  if (history.length === 0) {
    return {
      totalCalls: 0,
      totalTokens: 0,
      avgDuration: 0,
      successRate: 100
    }
  }

  const totalCalls = history.length
  const totalTokens = history.reduce((sum, u) => sum + u.tokens, 0)
  const avgDuration = history.reduce((sum, u) => sum + u.duration, 0) / totalCalls
  const successCount = history.filter((u) => u.success).length
  const successRate = (successCount / totalCalls) * 100

  return {
    totalCalls,
    totalTokens,
    avgDuration: Math.round(avgDuration),
    successRate: Math.round(successRate * 100) / 100
  }
}

export function clearAPIUsageHistory(): void {
  if (!isBrowser) return
  localStorage.removeItem(USAGE_STORAGE_KEY)
}

// ============================================================
// User Session Tracking
// ============================================================

const SESSION_KEY = 'wedding-ai-session'

interface Session {
  id: string
  startedAt: number
  lastActiveAt: number
  pageViews: number
  events: number
}

export function getOrCreateSession(): Session {
  if (!isBrowser) {
    return {
      id: 'server',
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      pageViews: 0,
      events: 0
    }
  }

  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      const session: Session = JSON.parse(stored)
      session.lastActiveAt = Date.now()
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      return session
    }

    const newSession: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      pageViews: 0,
      events: 0
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
    return newSession
  } catch {
    return {
      id: 'unknown',
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      pageViews: 0,
      events: 0
    }
  }
}

export function updateSessionActivity(type: 'pageView' | 'event'): void {
  if (!isBrowser) return

  try {
    const session = getOrCreateSession()
    session.lastActiveAt = Date.now()

    if (type === 'pageView') {
      session.pageViews++
    } else {
      session.events++
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // 실패해도 무시
  }
}

// ============================================================
// Web Vitals Tracking (Optional)
// ============================================================

export function trackWebVitals(): void {
  if (!isBrowser) return

  // First Contentful Paint (FCP)
  const paintEntries = performance.getEntriesByType('paint')
  const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint')
  if (fcp) {
    trackPerformance('FCP', fcp.startTime)
  }

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        trackPerformance('LCP', lastEntry.startTime)
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming
          trackPerformance('FID', fidEntry.processingStart - fidEntry.startTime)
        })
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
    } catch {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            clsValue += layoutShiftEntry.value
          }
        })
        trackPerformance('CLS', clsValue)
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
    } catch {
      // CLS not supported
    }
  }
}

// ============================================================
// Export Types
// ============================================================

export type { EventData, PerformanceMetric, APIUsage, ErrorContext, Session }
