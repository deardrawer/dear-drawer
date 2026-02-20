'use client'

import { useState, useEffect, useRef } from 'react'

export default function SocialProofCounter() {
  const [targetCount, setTargetCount] = useState(47)
  const [displayCount, setDisplayCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch stats
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then((data: any) => {
        if (data.totalCount) setTargetCount(data.totalCount)
      })
      .catch(() => {
        // fallback to base count
      })
  }, [])

  // Count-up animation with IntersectionObserver
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasAnimated])

  useEffect(() => {
    if (!hasAnimated) return

    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayCount(Math.floor(eased * targetCount))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [hasAnimated, targetCount])

  return (
    <div ref={ref} className="text-center py-3 sm:py-4">
      <p className="text-xs sm:text-sm text-gray-500">
        지금까지{' '}
        <span className="font-bold text-gray-800 text-sm sm:text-base tabular-nums">
          {displayCount.toLocaleString()}쌍
        </span>
        의 커플이 청첩장을 만들었어요
      </p>
    </div>
  )
}
