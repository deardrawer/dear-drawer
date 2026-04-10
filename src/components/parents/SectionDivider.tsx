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
      className="flex items-center justify-center py-12"
      style={{ backgroundColor: theme.background }}
    >
      <div
        className="w-full max-w-[280px] transition-all duration-700 ease-out"
        style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${theme.accent}40, transparent)`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />
    </div>
  )
}
