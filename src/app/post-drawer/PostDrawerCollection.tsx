'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Stamp } from '@/lib/postDrawer'
import { pickLoveFragment } from '@/lib/postDrawerConstants'

const PAGE_SIZE = 20

type Filter = 'all' | 'month' | 'week'

function dayNum(dateStr: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (!m) return null
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000)
}
function fmtDate(wd: string | null): string {
  if (!wd) return ''
  const s = wd.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.replace(/-/g, '.') : s
}

export default function PostDrawerCollection({ stamps }: { stamps: Stamp[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  // 우표 위에 '결혼식 한 조각'을 겹쳐 보여줄 대상(모바일 탭 토글용). PC는 CSS hover로도 표시.
  const [revealed, setRevealed] = useState<number | null>(null)

  // KST 기준 이번 달 / 이번 주
  const { monthKey, monthLabel, weekStart, weekEnd } = useMemo(() => {
    const kstMs = Date.now() + 9 * 3600 * 1000
    const todayNum = Math.floor(kstMs / 86400000)
    const d = new Date(todayNum * 86400000)
    const y = d.getUTCFullYear()
    const mo = d.getUTCMonth() + 1
    const dow = d.getUTCDay() // 0=일
    return {
      monthKey: `${y}-${String(mo).padStart(2, '0')}`,
      monthLabel: `${y}년 ${mo}월`,
      weekStart: todayNum - dow,
      weekEnd: todayNum + (6 - dow),
    }
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return stamps
    return stamps.filter((s) => {
      if (!s.weddingDate) return false
      if (filter === 'month') return s.weddingDate.slice(0, 7) === monthKey
      const n = dayNum(s.weddingDate)
      return n !== null && n >= weekStart && n <= weekEnd
    })
  }, [stamps, filter, monthKey, weekStart, weekEnd])

  useEffect(() => {
    setVisible(PAGE_SIZE)
    setRevealed(null)
  }, [filter])

  const monthCount = useMemo(() => stamps.filter((s) => s.weddingDate?.slice(0, 7) === monthKey).length, [stamps, monthKey])

  // Esc로 열린 한 조각 접기
  useEffect(() => {
    if (revealed === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRevealed(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed])

  const shown = filtered.slice(0, visible)

  return (
    <>
      {/* 필터 */}
      <div className="filter">
        <div className="chips">
          <button type="button" className={`chip${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>
            전체 {stamps.length.toLocaleString('ko-KR')}
          </button>
          <button type="button" className={`chip${filter === 'month' ? ' on' : ''}`} onClick={() => setFilter('month')}>
            {monthLabel}
            {monthCount > 0 ? ` ${monthCount}` : ''}
          </button>
          <button type="button" className={`chip${filter === 'week' ? ' on' : ''}`} onClick={() => setFilter('week')}>
            이번 주
          </button>
        </div>
        <div className="t13 lalt sb">최근 순</div>
      </div>

      {/* 우표 그리드 */}
      {shown.length > 0 ? (
        <div className="grid">
          {shown.map((s, i) => (
            <button
              key={i}
              type="button"
              className={`stamp${s.photo ? '' : ' nophoto'}${revealed === i ? ' revealed' : ''}`}
              onClick={() => setRevealed((r) => (r === i ? null : i))}
              aria-label={`${s.weddingDate ? fmtDate(s.weddingDate) + ' ' : ''}결혼식 우표 — 결혼식 한 조각 보기`}
            >
              <div className="ph">
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo} alt="" />
                ) : (
                  <div className="txt">
                    사진 없이<br />남은 기록
                  </div>
                )}
                {s.weddingDate && <span className="dtin">{fmtDate(s.weddingDate)}</span>}
                {/* 결혼식 한 조각 — hover(PC)/탭(모바일) 시 사진 위에 겹쳐 표시.
                    미입력 우표는 사랑 문구를 대신(우표마다 다르게) 얹는다. */}
                <div className={`pconoverlay${s.message ? '' : ' fragment'}`} aria-hidden={revealed !== i}>
                  <p>{s.message ? s.message : pickLoveFragment(s.weddingDate || String(i))}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-all">아직 이 조건의 우표가 없습니다.</p>
      )}

      {/* 더보기 */}
      {filtered.length > visible && (
        <div className="more">
          <button type="button" className="btn btn-m btn-assist" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            우표 더 보기
          </button>
        </div>
      )}
    </>
  )
}
