'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * 로컬 스토리지 훅
 * - SSR 안전 (서버에서는 초기값 반환)
 * - 타입 안전
 * - 자동 JSON 직렬화/역직렬화
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // 초기 상태 (SSR 안전)
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // 클라이언트에서 실제 값 로드
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`로컬스토리지 읽기 실패 (${key}):`, error)
    }
    setIsHydrated(true)
  }, [key])

  // 값 설정
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.error(`로컬스토리지 저장 실패 (${key}):`, error)
      }
    },
    [key, storedValue]
  )

  // 값 삭제
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`로컬스토리지 삭제 실패 (${key}):`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * 세션 스토리지 훅
 * - 탭 종료시 자동 삭제
 * - SSR 안전
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.sessionStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`세션스토리지 읽기 실패 (${key}):`, error)
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.error(`세션스토리지 저장 실패 (${key}):`, error)
      }
    },
    [key, storedValue]
  )

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`세션스토리지 삭제 실패 (${key}):`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * 만료 기능이 있는 로컬 스토리지 훅
 */
interface StoredValueWithExpiry<T> {
  value: T
  expiry: number
}

export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  ttl: number // 밀리초 단위
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        const parsed: StoredValueWithExpiry<T> = JSON.parse(item)
        const now = Date.now()

        if (now < parsed.expiry) {
          setStoredValue(parsed.value)
        } else {
          // 만료됨 - 삭제
          window.localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error(`로컬스토리지 읽기 실패 (${key}):`, error)
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== 'undefined') {
          const item: StoredValueWithExpiry<T> = {
            value: valueToStore,
            expiry: Date.now() + ttl
          }
          window.localStorage.setItem(key, JSON.stringify(item))
        }
      } catch (error) {
        console.error(`로컬스토리지 저장 실패 (${key}):`, error)
      }
    },
    [key, storedValue, ttl]
  )

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`로컬스토리지 삭제 실패 (${key}):`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

export default useLocalStorage
