'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'

// Context 타입
interface SectionHighlightContextType {
  activeSection: string
  registerSection: (id: string, ratio: number) => void
}

// Context 생성
export const SectionHighlightContext = createContext<SectionHighlightContextType>({
  activeSection: '',
  registerSection: () => {},
})

// Provider 컴포넌트
export function SectionHighlightProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState('greeting')
  const visibilityRatios = useRef<Map<string, number>>(new Map())

  const registerSection = useCallback((id: string, ratio: number) => {
    visibilityRatios.current.set(id, ratio)

    let maxRatio = 0
    let maxId = 'greeting'

    visibilityRatios.current.forEach((r, sectionId) => {
      if (r > maxRatio) {
        maxRatio = r
        maxId = sectionId
      }
    })

    if (maxRatio > 0) {
      setActiveSection(maxId)
    }
  }, [])

  return (
    <SectionHighlightContext.Provider value={{ activeSection, registerSection }}>
      {children}
    </SectionHighlightContext.Provider>
  )
}

// 섹션 하이라이트 훅
export function useSectionHighlight(sectionId: string) {
  const ref = useRef<HTMLElement>(null)
  const { activeSection, registerSection } = useContext(SectionHighlightContext)
  const [hasAppeared, setHasAppeared] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAppeared) {
          setHasAppeared(true)
        }
        registerSection(sectionId, entry.intersectionRatio)
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-10% 0px -10% 0px'
      }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sectionId, registerSection, hasAppeared])

  const isActive = activeSection === sectionId

  return { ref, isActive, hasAppeared }
}
