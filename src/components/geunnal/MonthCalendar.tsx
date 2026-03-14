'use client'
import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import GeunnalCard from './Card'
import type { GeunnalEvent, MealType } from '@/types/geunnal'

interface MonthCalendarProps {
  events: GeunnalEvent[]
  onDateClick?: (dateStr: string) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const MEAL_SHORT: Record<MealType, string> = {
  lunch: '점심',
  dinner: '저녁',
  other: '기타',
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getTodayStr(): string {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
}

function getMealColor(meal: MealType): string {
  if (meal === 'lunch') return 'text-amber-600'
  if (meal === 'dinner') return 'text-indigo-400'
  return 'text-[#9B8CC4]'
}

function getInitialMonth(events: GeunnalEvent[]): { year: number; month: number } {
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('geunnal-calendar-month')
    if (saved) {
      try {
        const { year, month } = JSON.parse(saved) as { year: number; month: number }
        if (typeof year === 'number' && typeof month === 'number') return { year, month }
      } catch { /* ignore */ }
    }
  }
  const today = new Date()
  const todayStr = getTodayStr()
  const futureEvents = events
    .filter(e => e.date !== 'TBD' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (futureEvents.length > 0) {
    const d = new Date(futureEvents[0].date)
    return { year: d.getFullYear(), month: d.getMonth() }
  }
  return { year: today.getFullYear(), month: today.getMonth() }
}

export default function MonthCalendar({ events, onDateClick }: MonthCalendarProps) {
  const initial = useMemo(() => getInitialMonth(events), [events])
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const todayStr = getTodayStr()

  useEffect(() => {
    sessionStorage.setItem('geunnal-calendar-month', JSON.stringify({ year, month }))
  }, [year, month])

  const eventMap = useMemo(() => {
    const map: Record<string, GeunnalEvent[]> = {}
    for (const evt of events) {
      if (evt.date === 'TBD') continue
      const dateKey = evt.date.split('T')[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(evt)
    }
    return map
  }, [events])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <GeunnalCard className="p-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EDE9FA]/40 transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={1.5} className="text-[#5A5270]" />
        </button>
        <span className="text-[15px] font-medium text-[#2A2240]">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EDE9FA]/40 transition-colors"
        >
          <ChevronRight size={18} strokeWidth={1.5} className="text-[#5A5270]" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-center text-[11px] font-medium py-1 ${
              i === 0 ? 'text-[#D4899A]' : i === 6 ? 'text-[#8B75D0]' : 'text-[#9B8CC4]'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[72px]" />
          }

          const dateStr = toDateStr(year, month, day)
          const isToday = dateStr === todayStr
          const dayEvents = eventMap[dateStr] || []
          const dayOfWeek = (firstDay + day - 1) % 7

          return (
            <button
              key={dateStr}
              onClick={() => onDateClick?.(dateStr)}
              className={`
                min-h-[72px] flex flex-col items-start p-0.5
                rounded-lg transition-colors relative text-left
                ${isToday ? 'bg-[#EDE9FA]' : 'hover:bg-[#F9F7FD]'}
              `}
            >
              {/* Day number + side icons */}
              <div className="flex items-center gap-0.5 ml-0.5 mb-0.5">
                <span
                  className={`text-[12px] leading-none ${
                    isToday
                      ? 'font-semibold text-[#8B75D0]'
                      : dayOfWeek === 0
                        ? 'text-[#D4899A]'
                        : dayOfWeek === 6
                          ? 'text-[#8B75D0]'
                          : 'text-[#2A2240]'
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-[1px] flex-wrap">
                    {dayEvents.slice(0, 3).map(evt => (
                      <span key={evt.id} className="text-[9px] leading-none">
                        {evt.side === 'groom' ? (
                          <span className="text-[#8B75D0]">{'\u2665'}</span>
                        ) : evt.side === 'bride' ? (
                          <span className="text-[#D4899A]">{'\u2665'}</span>
                        ) : (
                          <span className="text-[#BDBDBD]">{'\u25CF'}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Event details */}
              <div className="flex flex-col gap-[2px] w-full overflow-hidden">
                {dayEvents.slice(0, 2).map(evt => (
                  <div key={evt.id} className="flex flex-col w-full">
                    <span className="text-[9px] leading-[1.2] font-medium text-[#2A2240] truncate w-full">
                      {evt.name.length > 6 ? evt.name.slice(0, 5) + '...' : evt.name}
                    </span>
                    <span className={`text-[8px] leading-[1.2] ${getMealColor(evt.meal_type)}`}>
                      {MEAL_SHORT[evt.meal_type]}
                    </span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[8px] text-[#9B8CC4]">+{dayEvents.length - 2}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </GeunnalCard>
  )
}
