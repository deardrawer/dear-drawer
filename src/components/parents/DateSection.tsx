'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

interface DateSectionProps {
  weddingDate?: string // 'YYYY-MM-DD' format
  weddingTime?: string // 'HH:mm' format
  weddingTimeDisplay?: string // e.g., 'Saturday, 4pm'
}

export default function DateSection({
  weddingDate = '2027-01-09',
  weddingTime = '16:00',
  weddingTimeDisplay = 'Saturday, 4pm',
}: DateSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('date')
  const theme = useTheme()

  // Parse date
  const date = new Date(weddingDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weddingDay = day.toString()

  // Generate calendar data
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const calendarDays: string[][] = []
  let currentWeek: string[] = []

  // Fill empty days at the start
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push('')
  }

  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d.toString())
    if (currentWeek.length === 7) {
      calendarDays.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill empty days at the end
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push('')
    }
    calendarDays.push(currentWeek)
  }

  // D-day calculation
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-20 transition-all duration-500 min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <p
        className="font-serif text-2xl tracking-wider mb-2 transition-colors duration-500"
        style={{ color: isActive ? theme.text : '#999' }}
      >
        {year}. {month}. {day}
      </p>
      <p
        className="font-serif text-base italic tracking-wider mb-10 transition-colors duration-500"
        style={{ color: isActive ? theme.accent : `${theme.accent}80` }}
      >
        {weddingTimeDisplay}
      </p>

      <div className="w-full max-w-[280px]">
        <p
          className="text-center font-serif text-sm tracking-wider mb-4 transition-colors duration-500"
          style={{ color: isActive ? theme.accent : `${theme.accent}80` }}
        >
          {monthNames[month - 1]} {year}
        </p>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((dayName, i) => (
            <div
              key={dayName}
              className="text-center text-xs py-2 transition-colors duration-500"
              style={{ color: i === 0 ? '#E57373' : i === 6 ? '#64B5F6' : (isActive ? '#999' : '#bbb') }}
            >
              {dayName}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.flat().map((dayNum, index) => {
            const isWeddingDay = dayNum === weddingDay
            const dayOfWeek = index % 7
            const isSunday = dayOfWeek === 0
            const isSaturday = dayOfWeek === 6

            return (
              <div
                key={index}
                className={`text-center text-sm py-2 transition-all duration-500 ${isWeddingDay ? 'rounded-full' : ''}`}
                style={{
                  backgroundColor: isWeddingDay ? theme.accent : 'transparent',
                  color: isWeddingDay
                    ? '#FFFFFF'
                    : isSunday
                    ? '#E57373'
                    : isSaturday
                    ? '#64B5F6'
                    : (isActive ? theme.text : '#999'),
                  fontWeight: isWeddingDay ? '600' : '400',
                }}
              >
                {dayNum}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-10 text-center">
        <p
          className="font-serif text-sm tracking-wide transition-colors duration-500"
          style={{ color: isActive ? '#888' : '#aaa' }}
        >
          {diffDays > 0
            ? <>결혼식까지 <span style={{ color: isActive ? theme.accent : `${theme.accent}80` }}>{diffDays}일</span> 남았습니다</>
            : diffDays === 0
            ? '오늘 결혼식입니다'
            : <>결혼식으로부터 <span style={{ color: isActive ? theme.accent : `${theme.accent}80` }}>{Math.abs(diffDays)}일</span> 지났습니다</>
          }
        </p>
      </div>
    </section>
  )
}
