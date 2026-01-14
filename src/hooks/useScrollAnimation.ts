'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean  // true면 한 번만 애니메이션 실행
}

/**
 * 스크롤 기반 애니메이션을 위한 커스텀 훅
 * IntersectionObserver를 사용하여 요소가 뷰포트에 들어올 때 애니메이션 클래스 추가
 */
export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -50px 0px',
    once = true
  } = options

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 모션 감소 설정 체크
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      // 모션 감소 시 즉시 모든 요소 표시
      container.querySelectorAll('.anim-section').forEach(el => el.classList.add('visible'))
      container.querySelectorAll('.anim-title, .anim-line, .anim-paragraph, .anim-card, .anim-image, .anim-fade, .anim-stagger, .anim-underline')
        .forEach(el => el.classList.add('revealed'))
      return
    }

    // 섹션 Observer
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            if (once) {
              sectionObserver.unobserve(entry.target)
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    // 텍스트/요소 Observer
    const elementObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            // 메모리 최적화: will-change 정리
            setTimeout(() => {
              (entry.target as HTMLElement).style.willChange = 'auto'
            }, 1000)
            if (once) {
              elementObserver.unobserve(entry.target)
            }
          }
        })
      },
      { threshold, rootMargin }
    )

    // 섹션 관찰
    container.querySelectorAll('.anim-section').forEach(el => {
      sectionObserver.observe(el)
    })

    // 애니메이션 요소 관찰
    container.querySelectorAll('.anim-title, .anim-line, .anim-paragraph, .anim-card, .anim-image, .anim-fade, .anim-stagger, .anim-underline')
      .forEach(el => {
        elementObserver.observe(el)
      })

    return () => {
      sectionObserver.disconnect()
      elementObserver.disconnect()
    }
  }, [threshold, rootMargin, once])

  return containerRef
}

/**
 * 개별 요소에 스크롤 애니메이션을 적용하는 훅
 */
export function useElementAnimation<T extends HTMLElement = HTMLDivElement>(
  animationType: 'title' | 'line' | 'paragraph' | 'card' | 'image' | 'fade' | 'stagger' = 'fade',
  options: ScrollAnimationOptions = {}
) {
  const {
    threshold = 0.2,
    rootMargin = '0px 0px -30px 0px',
    once = true
  } = options

  const elementRef = useRef<T>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // 모션 감소 설정 체크
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      element.classList.add('revealed')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            setTimeout(() => {
              (entry.target as HTMLElement).style.willChange = 'auto'
            }, 1000)
            if (once) {
              observer.unobserve(entry.target)
            }
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return elementRef
}

export default useScrollAnimation
