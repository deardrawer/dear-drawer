'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from './ThemeContext'

export default function SectionDivider() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center py-12"
      style={{ backgroundColor: theme.background }}
    >
      {/* 세로선 */}
      <div
        className="w-px transition-all duration-700 ease-out"
        style={{
          backgroundColor: theme.accent,
          height: isVisible ? '32px' : '0px',
          opacity: isVisible ? 0.4 : 0,
        }}
      />
      {/* 점 */}
      <div
        className="mt-2 transition-all duration-500"
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: theme.accent,
          opacity: isVisible ? 0.5 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0)',
        }}
      />
    </div>
  )
}
