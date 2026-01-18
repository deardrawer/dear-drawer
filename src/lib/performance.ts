/**
 * 성능 최적화 유틸리티
 * - 캐싱
 * - 디바운스/스로틀
 * - 지연 로딩
 * - 메모리 관리
 */

// ============================================================
// Types
// ============================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
}

interface CacheOptions {
  duration?: number // 캐시 유효 시간 (ms)
  maxSize?: number // 최대 캐시 항목 수
}

// ============================================================
// Cache Manager
// ============================================================

const DEFAULT_CACHE_DURATION = 5 * 60 * 1000 // 5분
const DEFAULT_MAX_SIZE = 100

class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private duration: number
  private maxSize: number

  constructor(options: CacheOptions = {}) {
    this.duration = options.duration || DEFAULT_CACHE_DURATION
    this.maxSize = options.maxSize || DEFAULT_MAX_SIZE
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > this.duration
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    // 캐시 히트 카운트 증가
    entry.hits++
    return entry.data
  }

  set(key: string, data: T): void {
    // 최대 크기 초과시 가장 적게 사용된 항목 제거
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    })
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const isExpired = Date.now() - entry.timestamp > this.duration
    if (isExpired) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  size(): number {
    return this.cache.size
  }

  private evictLRU(): void {
    let minHits = Infinity
    let minKey: string | null = null

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits
        minKey = key
      }
    }

    if (minKey) {
      this.cache.delete(minKey)
    }
  }
}

// 글로벌 캐시 인스턴스
export const apiCache = new CacheManager<unknown>({ duration: 5 * 60 * 1000 })
export const formCache = new CacheManager<unknown>({ duration: 30 * 60 * 1000 })

// ============================================================
// Cached API Result Functions
// ============================================================

export function getCachedResult<T>(key: string): T | null {
  return apiCache.get(key) as T | null
}

export function setCachedResult<T>(key: string, data: T): void {
  apiCache.set(key, data)
}

export function clearCache(): void {
  apiCache.clear()
  formCache.clear()
}

// ============================================================
// Debounce
// ============================================================

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

// 취소 가능한 디바운스
export function debounceWithCancel<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): {
  execute: (...args: Parameters<T>) => void
  cancel: () => void
  flush: () => void
} {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const execute = (...args: Parameters<T>) => {
    lastArgs = args

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
      lastArgs = null
    }, wait)
  }

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
      lastArgs = null
    }
  }

  const flush = () => {
    if (timeout && lastArgs) {
      clearTimeout(timeout)
      func(...lastArgs)
      timeout = null
      lastArgs = null
    }
  }

  return { execute, cancel, flush }
}

// ============================================================
// Throttle
// ============================================================

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastArgs: Parameters<T> | null = null

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
        if (lastArgs) {
          func(...lastArgs)
          lastArgs = null
        }
      }, limit)
    } else {
      lastArgs = args
    }
  }
}

// ============================================================
// Lazy Loading
// ============================================================

export function lazyLoadImages(): void {
  if (typeof window === 'undefined') return

  const images = document.querySelectorAll('img[data-src]')

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
              imageObserver.unobserve(img)
            }
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    )

    images.forEach((img) => imageObserver.observe(img))
  } else {
    // Fallback for older browsers
    images.forEach((img) => {
      const imgElement = img as HTMLImageElement
      if (imgElement.dataset.src) {
        imgElement.src = imgElement.dataset.src
        imgElement.removeAttribute('data-src')
      }
    })
  }
}

// ============================================================
// Request Animation Frame Throttle
// ============================================================

export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null

  return function executedFunction(...args: Parameters<T>) {
    if (rafId) return

    rafId = requestAnimationFrame(() => {
      func(...args)
      rafId = null
    })
  }
}

// ============================================================
// Memory Management
// ============================================================

export function getMemoryUsage(): { usedJSHeapSize?: number; totalJSHeapSize?: number } | null {
  if (typeof window === 'undefined') return null

  const performance = window.performance as Performance & {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
    }
  }

  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize
    }
  }

  return null
}

// ============================================================
// Performance Timing
// ============================================================

export function measureTime<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  if (label && process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
  }

  return { result, duration }
}

export async function measureTimeAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  if (label && process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
  }

  return { result, duration }
}

// ============================================================
// Batch Updates
// ============================================================

export function batchUpdates<T>(
  updates: Array<() => T>,
  batchSize: number = 10
): Promise<T[]> {
  return new Promise((resolve) => {
    const results: T[] = []
    let index = 0

    function processBatch() {
      const batch = updates.slice(index, index + batchSize)
      batch.forEach((update) => {
        results.push(update())
      })
      index += batchSize

      if (index < updates.length) {
        requestAnimationFrame(processBatch)
      } else {
        resolve(results)
      }
    }

    processBatch()
  })
}

// ============================================================
// Preload Resources
// ============================================================

export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map(preloadImage))
}

// ============================================================
// Export Types
// ============================================================

export type { CacheOptions }
