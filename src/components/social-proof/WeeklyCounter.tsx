'use client'

import { useState, useEffect } from 'react'

export default function WeeklyCounter() {
  const [weeklyCount, setWeeklyCount] = useState(0)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then((data: any) => {
        if (data.weeklyCount && data.weeklyCount > 0) setWeeklyCount(data.weeklyCount)
      })
      .catch(() => {})
  }, [])

  if (weeklyCount <= 0) return null

  return (
    <p className="text-[10px] sm:text-sm text-gray-400 mt-4 sm:mt-6 leading-relaxed">
      이번 주에도 <span className="text-white font-medium">{weeklyCount}쌍</span>의 새로운 커플들이<br />
      디어드로어로 청첩장을 만들고 있어요
    </p>
  )
}
