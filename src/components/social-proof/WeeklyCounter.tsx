'use client'

import { useState, useEffect } from 'react'

export default function WeeklyCounter() {
  const BASE_COUNT = 7
  const [weeklyCount, setWeeklyCount] = useState(BASE_COUNT)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then((data: any) => {
        if (data.weeklyCount && data.weeklyCount > 0) setWeeklyCount(BASE_COUNT + data.weeklyCount)
      })
      .catch(() => {})
  }, [])

  return (
    <p className="text-[10px] sm:text-sm text-gray-400 mt-4 sm:mt-6">
      최근 7일간 <span className="text-white font-medium">{weeklyCount}쌍</span>의 커플이 청첩장을 만들었어요
    </p>
  )
}
