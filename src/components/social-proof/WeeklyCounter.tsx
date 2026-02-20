'use client'

import { useState, useEffect } from 'react'

export default function WeeklyCounter() {
  const [weeklyCount, setWeeklyCount] = useState(0)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then((data: any) => {
        if (data.weeklyCount) setWeeklyCount(data.weeklyCount)
      })
      .catch(() => {})
  }, [])

  if (weeklyCount === 0) return null

  return (
    <p className="text-[10px] sm:text-sm text-gray-400 mt-4 sm:mt-6">
      이번 주 <span className="text-white font-medium">{weeklyCount}쌍</span>의 커플이 청첩장을 만들고 있어요
    </p>
  )
}
