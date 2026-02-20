'use client'

import { useState, useEffect } from 'react'

export default function WeeklyCounter() {
  const [weeklyCount, setWeeklyCount] = useState(5)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then((data: any) => {
        if (data.weeklyCount && data.weeklyCount > 0) setWeeklyCount(data.weeklyCount)
      })
      .catch(() => {})
  }, [])

  return (
    <p className="text-[10px] sm:text-sm text-gray-400 mt-4 sm:mt-6">
      지금 <span className="text-white font-medium">{weeklyCount}쌍</span>의 커플이 청첩장을 만들고 있어요
    </p>
  )
}
