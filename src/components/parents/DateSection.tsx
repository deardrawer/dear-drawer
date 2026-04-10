'use client'

import { useState, useEffect, useRef } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

interface DateSectionProps {
  weddingDate?: string
  weddingTime?: string
  weddingTimeDisplay?: string
}

const stagger = (hasAppeared: boolean, delay: number) => ({
  opacity: hasAppeared ? 1 : 0,
  transform: hasAppeared ? 'translateY(0)' : 'translateY(18px)',
  transition: 'opacity 0.8s ease, transform 0.8s ease',
  transitionDelay: hasAppeared ? `${delay}s` : '0s',
})

/** D-day 숫자가 0에서 target까지 롤링되는 카운터 */
function RollingCounter({ target, isActive, hasStarted, theme }: {
  target: number
  isActive: boolean
  hasStarted: boolean
  theme: { accent: string }
}) {
  const [count, setCount] = useState(0)
  const animating = useRef(false)

  useEffect(() => {
    if (!hasStarted || animating.current) return
    animating.current = true

    const absTarget = Math.abs(target)
    const duration = 1800
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo for dramatic slowdown at end
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(eased * absTarget))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [hasStarted, target])

  return (
    <span
      style={{
        color: isActive ? theme.accent : `${theme.accent}80`,
        fontWeight: 500,
        fontFamily: "'Cormorant Garamond', 'Georgia', serif",
        fontSize: '20px',
        display: 'inline-block',
        minWidth: '2ch',
        textAlign: 'center',
        transition: 'color 0.5s',
      }}
    >
      {count}
    </span>
  )
}

export default function DateSection({
  weddingDate = '2027-01-09',
  weddingTime = '16:00',
  weddingTimeDisplay = 'Saturday, 4pm',
}: DateSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('date')
  const theme = useTheme()

  const date = new Date(weddingDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weddingDay = day.toString()

  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const weddingDayOfWeek = dayNames[date.getDay()]

  const [hourStr] = weddingTime.split(':')
  const hour = parseInt(hourStr)
  const ampm = hour < 12 ? '오전' : '오후'
  const displayHour = hour > 12 ? hour - 12 : hour
  const timeKorean = `${weddingDayOfWeek} ${ampm} ${displayHour}시`

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const calendarDays: string[][] = []
  let currentWeek: string[] = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push('')
  }

  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d.toString())
    if (currentWeek.length === 7) {
      calendarDays.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push('')
    }
    calendarDays.push(currentWeek)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const monthNamesEn = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  const dayHeaders = ['일', '월', '화', '수', '목', '금', '토']

  // D-day counter 시작 시점: badge가 등장한 후
  const [counterStarted, setCounterStarted] = useState(false)
  useEffect(() => {
    if (hasAppeared && !counterStarted) {
      const timer = setTimeout(() => setCounterStarted(true), 800)
      return () => clearTimeout(timer)
    }
  }, [hasAppeared, counterStarted])

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-16 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        filter: isActive ? 'none' : 'grayscale(30%)',
        opacity: isActive ? 1 : 0.3,
        transition: 'filter 0.5s, opacity 0.5s',
      }}
    >
      {/* WEDDING DAY label */}
      <p
        className="text-[10px] tracking-[6px] mb-6"
        style={{
          color: isActive ? `${theme.accent}80` : '#bbb',
          fontWeight: 300,
          ...stagger(hasAppeared, 0),
        }}
      >
        WEDDING DAY
      </p>

      {/* Large date typography */}
      <div className="text-center mb-2" style={stagger(hasAppeared, 0.15)}>
        <p
          className="text-sm tracking-[4px] mb-1"
          style={{
            fontFamily: "'Cormorant Garamond', 'Georgia', serif",
            fontWeight: 300,
            color: isActive ? `${theme.accent}80` : '#bbb',
          }}
        >
          {year}
        </p>
        <p
          className="text-[32px] leading-[1.2] tracking-[2px]"
          style={{
            fontFamily: "'Cormorant Garamond', 'Georgia', serif",
            fontWeight: 300,
            color: isActive ? theme.text : '#999',
          }}
        >
          {month}월 {day}일
        </p>
        <p
          className="text-xs tracking-[2px] mt-2"
          style={{ color: isActive ? theme.textLight : '#aaa' }}
        >
          {timeKorean}
        </p>
      </div>

      {/* Calendar card */}
      <div
        className="w-full max-w-[300px] mt-8 rounded-2xl p-6"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: isActive ? '0 2px 20px rgba(0,0,0,0.04)' : '0 1px 8px rgba(0,0,0,0.02)',
          opacity: hasAppeared ? 1 : 0,
          transform: hasAppeared ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 0.8s ease, transform 0.8s ease, box-shadow 0.5s',
          transitionDelay: hasAppeared ? '0.35s' : '0s',
        }}
      >
        <p
          className="text-center text-[10px] tracking-[3px] mb-5"
          style={{ color: isActive ? `${theme.accent}80` : '#bbb', fontWeight: 400 }}
        >
          {monthNamesEn[month - 1]} {year}
        </p>

        <div className="grid grid-cols-7 gap-0.5 mb-2">
          {dayHeaders.map((dayName, i) => (
            <div
              key={`header-${i}`}
              className="text-center text-[10px] py-2"
              style={{
                color: i === 0 ? '#D4897A' : i === 6 ? '#7A9CB8' : (isActive ? `${theme.accent}80` : '#bbb'),
                fontWeight: 400,
              }}
            >
              {dayName}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.flat().map((dayNum, index) => {
            const isWeddingDay = dayNum === weddingDay
            const dayOfWeek = index % 7
            const isSunday = dayOfWeek === 0
            const isSaturday = dayOfWeek === 6

            return (
              <div
                key={index}
                className="text-center text-sm py-2 relative"
                style={{ fontWeight: isWeddingDay ? 500 : 300 }}
              >
                {isWeddingDay && (
                  <>
                    {/* Pulse ring - 바깥 원이 확장되며 사라짐 */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
                      style={{
                        border: `1.5px solid ${theme.accent}`,
                        opacity: 0,
                        animation: hasAppeared ? 'weddingDayPulse 2.5s ease-out 1.2s infinite' : 'none',
                      }}
                    />
                    {/* Static bg circle */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: hasAppeared ? '32px' : '0px',
                        height: hasAppeared ? '32px' : '0px',
                        backgroundColor: theme.accent,
                        opacity: 0.12,
                        transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transitionDelay: hasAppeared ? '0.8s' : '0s',
                      }}
                    />
                  </>
                )}
                <span
                  className="relative"
                  style={{
                    color: isWeddingDay
                      ? theme.accent
                      : isSunday
                      ? '#D4897A'
                      : isSaturday
                      ? '#7A9CB8'
                      : (isActive ? theme.text : '#999'),
                  }}
                >
                  {dayNum}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* D-day badge with rolling counter */}
      <div style={stagger(hasAppeared, 0.6)}>
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-3xl text-xs mt-6"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
            color: isActive ? theme.textLight : '#aaa',
          }}
        >
          {diffDays > 0
            ? (
              <>
                결혼식까지{' '}
                <RollingCounter
                  target={diffDays}
                  isActive={isActive}
                  hasStarted={counterStarted}
                  theme={theme}
                />
                일 남았습니다
              </>
            )
            : diffDays === 0
            ? '오늘 결혼식입니다'
            : (
              <>
                결혼식으로부터{' '}
                <RollingCounter
                  target={diffDays}
                  isActive={isActive}
                  hasStarted={counterStarted}
                  theme={theme}
                />
                일 지났습니다
              </>
            )
          }
        </div>
      </div>
    </section>
  )
}
