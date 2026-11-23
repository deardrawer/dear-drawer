'use client'

import { useEffect, useRef, useState } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { parseDateOnly } from '@/lib/dateOnly'
import { C_TXT_BODY, C_TXT, C_ON_POINT, C_POINT, C_SERIF, C_TXT_SUB, cCaption, cDim, cStagger } from './cStyle'

interface DateSectionProps {
  weddingDate?: string
  weddingTime?: string
  weddingTimeDisplay?: string
  venueName?: string  // C안: 날짜 아래 한 줄로 함께 표시 (선택)
  venueHall?: string
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** D-day 숫자가 0에서 target까지 올라가는 카운터 (기존과 같은 1.8초) */
function RollingCounter({ target, hasStarted }: { target: number; hasStarted: boolean }) {
  const [count, setCount] = useState(0)
  const animating = useRef(false)

  useEffect(() => {
    if (!hasStarted || animating.current) return
    animating.current = true
    const absTarget = Math.abs(target)
    const duration = 1800
    const startTime = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(eased * absTarget))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [hasStarted, target])

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
}

export default function DateSection({
  weddingDate = '2027-01-09',
  weddingTimeDisplay = '',
  venueName,
  venueHall,
}: DateSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('date')
  const point = C_POINT

  const date = parseDateOnly(weddingDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 시간은 에디터 '시간 표시'(timeDisplay) 값을 그대로 사용.
  // (parents 템플릿엔 HH:MM 시간 필드가 없으므로 재계산하지 않음. 영문 기본값은 무시)
  const timeText = weddingTimeDisplay && !/[A-Za-z]/.test(weddingTimeDisplay)
    ? weddingTimeDisplay.trim()
    : ''
  const timeKorean = timeText ? `${DAY_NAMES[date.getDay()]} ${timeText}` : DAY_NAMES[date.getDay()]
  const venueText = [venueName, venueHall].map(v => (v || '').trim()).filter(Boolean).join(' ')
  const subLine = venueText ? `${timeKorean} · ${venueText}` : timeKorean

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // D-day 카운터 시작: 섹션이 나타나고 0.8초 뒤 (기존과 동일)
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
      style={{ backgroundColor: 'transparent', padding: '72px 28px 80px', ...cDim(isActive) }}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ ...cCaption, ...cStagger(hasAppeared, 0) }}>예식 일시</p>
        <div style={cStagger(hasAppeared, 0.15)}>
          <div style={{ fontFamily: C_SERIF, fontSize: 46, lineHeight: 1.1, marginTop: 14, color: C_TXT }}>
            {MONTHS_EN[month - 1]} {day}, {year}
          </div>
          <p style={{ fontSize: 15, color: C_TXT_BODY, margin: '10px 0 0', wordBreak: 'keep-all' }}>{subLine}</p>
        </div>
      </div>

      <div
        style={{
          margin: '36px auto 0',
          maxWidth: 300,
          opacity: hasAppeared ? 1 : 0,
          transform: hasAppeared ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          filter: hasAppeared ? 'blur(0px)' : 'blur(6px)',
          transition: 'opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), filter 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          transitionDelay: hasAppeared ? '0.35s' : '0s',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            rowGap: 12,
            fontSize: 14,
            color: C_TXT_BODY,
            textAlign: 'center',
          }}
        >
          {DAY_HEADERS.map((w, i) => (
            <span key={`h-${i}`} style={{ fontFamily: C_SERIF, fontSize: 14, color: C_TXT_SUB }}>{w}</span>
          ))}
          {cells.map((d, i) => (
            <span key={i} style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {d === day ? (
                <>
                  {/* 바깥으로 퍼지며 사라지는 링 (기존 weddingDayPulse) */}
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute', top: '50%', left: '50%', width: 30, height: 30, borderRadius: '50%',
                      border: `1.5px solid ${point}`, opacity: 0, pointerEvents: 'none',
                      animation: hasAppeared ? 'weddingDayPulse 2.5s ease-out 1.2s infinite' : 'none',
                    }}
                  />
                  {/* 채워지는 원 — 등장 후 커지며 나타남 */}
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute', top: '50%', left: '50%', borderRadius: '50%', background: point, pointerEvents: 'none',
                      width: hasAppeared ? 30 : 0, height: hasAppeared ? 30 : 0,
                      transform: 'translate(-50%, -50%)',
                      transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transitionDelay: hasAppeared ? '0.8s' : '0s',
                    }}
                  />
                  <span style={{ position: 'relative', color: C_ON_POINT, fontWeight: 600 }}>{d}</span>
                </>
              ) : d}
            </span>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: C_TXT_SUB, margin: '30px 0 0', ...cStagger(hasAppeared, 0.6) }}>
        {diffDays > 0 ? (
          <>결혼식까지 <b style={{ color: point, fontWeight: 700 }}><RollingCounter target={diffDays} hasStarted={counterStarted} />일</b></>
        ) : diffDays === 0 ? (
          <b style={{ color: point, fontWeight: 700 }}>오늘 결혼식입니다</b>
        ) : (
          <>결혼식을 올린 지 <b style={{ color: point, fontWeight: 700 }}><RollingCounter target={diffDays} hasStarted={counterStarted} />일</b></>
        )}
      </p>
    </section>
  )
}
