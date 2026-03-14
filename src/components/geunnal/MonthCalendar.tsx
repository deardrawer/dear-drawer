'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GeunnalEvent } from '@/types/geunnal'
import GeunnalBadge from './Badge'

interface MonthCalendarProps {
  events: GeunnalEvent[]
  onDateClick?: (date: Date) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function MonthCalendar({ events, onDateClick }: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    // Restore from sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('geunnal-calendar-month')
      if (saved) {
        return new Date(saved)
      }
    }
    return new Date()
  })

  // Save to sessionStorage when month changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('geunnal-calendar-month', currentDate.toISOString())
    }
  }, [currentDate])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Calculate calendar grid
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay()

  // Generate calendar days
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  // Group events by date
  const eventsByDate = new Map<string, GeunnalEvent[]>()
  events.forEach((event) => {
    const dateKey = event.date.split('T')[0] // YYYY-MM-DD
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, [])
    }
    eventsByDate.get(dateKey)!.push(event)
  })

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDateClick = (day: number) => {
    if (onDateClick) {
      onDateClick(new Date(year, month, day))
    }
  }

  const formatDateKey = (day: number) => {
    const d = new Date(year, month, day)
    return d.toISOString().split('T')[0]
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4F0] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-[#F9F7FD] rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#5A5270]" />
        </button>
        <h3 className="text-lg font-semibold text-[#2A2240]">
          {year}년 {month + 1}월
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-[#F9F7FD] rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#5A5270]" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={idx}
            className={`text-center text-xs font-medium py-2 ${
              idx === 0 ? 'text-[#D4899A]' : idx === 6 ? 'text-[#8B75D0]' : 'text-[#5A5270]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />
          }

          const dateKey = formatDateKey(day)
          const dayEvents = eventsByDate.get(dateKey) || []
          const hasEvents = dayEvents.length > 0
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear()

          const dayOfWeek = (startDayOfWeek + day - 1) % 7

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`aspect-square p-1 rounded-lg text-sm transition-colors ${
                isToday
                  ? 'bg-[#8B75D0] text-white font-bold'
                  : hasEvents
                  ? 'bg-[#F9F7FD] hover:bg-[#EDE9FA]'
                  : 'hover:bg-[#F9F7FD]'
              } ${!isToday && (dayOfWeek === 0 ? 'text-[#D4899A]' : dayOfWeek === 6 ? 'text-[#8B75D0]' : 'text-[#2A2240]')}`}
            >
              <div className="flex flex-col items-center justify-start h-full">
                <span className={`${isToday ? 'font-bold' : ''}`}>{day}</span>
                {hasEvents && (
                  <div className="flex flex-col gap-0.5 mt-1 w-full">
                    {dayEvents.slice(0, 2).map((event, eventIdx) => (
                      <div
                        key={event.id}
                        className="text-[8px] leading-tight px-1 py-0.5 rounded truncate w-full"
                        style={{
                          backgroundColor:
                            event.side === 'groom'
                              ? '#90CAF9'
                              : event.side === 'bride'
                              ? '#F48FB1'
                              : '#EDE9FA',
                          color: '#2A2240',
                        }}
                        title={`${event.name} (${event.meal_type === 'lunch' ? '점심' : event.meal_type === 'dinner' ? '저녁' : '기타'})`}
                      >
                        {event.name.length > 4 ? event.name.slice(0, 4) + '.' : event.name}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] text-[#9B8CC4] text-center">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E8E4F0]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#90CAF9' }} />
          <span className="text-xs text-[#5A5270]">신랑</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F48FB1' }} />
          <span className="text-xs text-[#5A5270]">신부</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EDE9FA' }} />
          <span className="text-xs text-[#5A5270]">공통</span>
        </div>
      </div>
    </div>
  )
}
