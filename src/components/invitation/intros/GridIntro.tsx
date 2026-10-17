'use client'

// 그리드 포스터: 흐린 흑백 사진 위 격자에 문장이 한 칸에 한 글자씩 저절로 채워지고,
// 다 채워지면 사진이 선명한 컬러로 바뀐다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { type IntroStyleProps, coupleNames, cropOf, dateDots, hasHangul, isDark, photoOf, str, tint, weekdayEn } from './shared'
import IntroPhoto from './IntroPhoto'

const C = 10

function layout(text: string, R: number) {
  let words: string[][] = []
  text.trim().split(/\s+/).forEach(x => { const a = Array.from(x); while (a.length > C) words.push(a.splice(0, C)); if (a.length) words.push(a) })
  words = words.slice(0, Math.max(1, R - 2))
  const n = words.length
  const extra = Math.min(2 * (n - 1), Math.max(0, Math.min(R - 3, Math.max(n - 1, Math.round(R * 0.6))) - (n - 1)))
  const gaps: number[] = Array(Math.max(0, n - 1)).fill(1)
  for (let i = 0; i < extra && n > 1; i++) gaps[i % (n - 1)]++
  const span = gaps.reduce((s, g) => s + g, 0)
  let row = Math.max(1, Math.floor((R - 1 - span) * 0.42)), x = 0, px = 0, pl = 0
  const cells: { r: number; c: number; ch: string; w: number }[] = []
  words.forEach((wd, k) => {
    const len = wd.length
    if (k === 0) x = n === 1 ? Math.floor((C - len) / 2) : len <= C - 1 ? 1 : 0
    else { x = px + pl - 1; if (x + len > C) x = Math.max(0, Math.min(C - len, k % 2 ? 1 : 2)); row += gaps[k - 1] }
    wd.forEach((ch, j) => cells.push({ r: row, c: x + j, ch, w: k }))
    px = x; pl = len
  })
  return cells
}

export default function GridIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const phrase = str(opts.phrase, 'We are getting married')
  const accent = str(opts.accentColor, '#F190AC')
  const photo = photoOf(opts, 'photo', data)
  const crop = cropOf(opts, 'photo')
  const instant = finished || reduced

  const cell = Math.floor((w - 32) / C)
  const R = Math.max(8, Math.min(16, Math.floor((h - 200) / cell)))
  const gw = cell * C, gh = cell * R
  const cells = useMemo(() => layout(phrase, R), [phrase, R])

  const [shown, setShown] = useState(instant ? cells.length : 0)
  const [ready, setReady] = useState(instant)
  const [focus, setFocus] = useState(instant)
  const completed = useRef(false)

  useEffect(() => { if (!instant) { const t = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(t) } }, [instant])

  // 한 단어씩 저절로 채운다 (단어 안에서는 한 글자씩)
  useEffect(() => {
    if (!ready || shown >= cells.length) return
    const first = shown === 0
    const newWord = !first && cells[shown].w !== cells[shown - 1].w
    const t = setTimeout(() => setShown(n => n + 1), first ? 1300 : newWord ? 420 : 85)
    return () => clearTimeout(t)
  }, [ready, shown, cells])

  useEffect(() => {
    if (shown < cells.length || focus) return
    const t = setTimeout(() => setFocus(true), 380)
    return () => clearTimeout(t)
  }, [shown, cells.length, focus])
  useEffect(() => {
    if (!focus || completed.current) return
    const t = setTimeout(() => { completed.current = true; onComplete() }, instant ? 0 : 1600)
    return () => clearTimeout(t)
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps

  const [seenSignal, setSeenSignal] = useState(signal)
  if (signal !== seenSignal) { setSeenSignal(signal); setShown(cells.length); setFocus(true) }

  const paper = str(opts.bgColor, tint(accent, 0.7))
  const names = str(opts.names, coupleNames(data, ' and '))
  const caps: React.CSSProperties = { fontFamily: "'Inter', sans-serif", fontStyle: 'italic', fontSize: 12.5, lineHeight: 1.25, color: isDark(paper) ? '#F4F1EC' : '#1A1A1A' }
  const nextIdx = shown < cells.length ? shown : -1

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: paper }}>
      <div style={{ width: gw + 1 }}>
        <div className="flex justify-between items-end" style={{ ...caps, marginBottom: 8 }}>
          <span><small style={{ display: 'block', fontSize: 8.5, fontStyle: 'normal', marginBottom: 3 }}>{dateDots(data.date)}</small>{str(opts.title, 'Our Wedding')}</span>
          <span className="text-right">{names}</span>
        </div>
        <div className="relative overflow-hidden" style={{ width: gw + 1, height: gh + 1, background: '#9a9a9a' }}>
          {photo && (
            <IntroPhoto src={photo} crop={crop} className="absolute inset-0"
              style={{ filter: focus ? 'none' : 'grayscale(1) blur(7px) contrast(1.1)', transform: focus ? 'scale(1)' : 'scale(1.04)', transition: instant ? 'none' : 'filter 2.2s cubic-bezier(.4,0,.2,1), transform 2.4s ease' }} />
          )}
          <div className="absolute inset-0"
            style={{
              boxShadow: 'inset -1px -1px 0 #141414',
              backgroundImage: 'linear-gradient(to right,#141414 1px,transparent 1px),linear-gradient(to bottom,#141414 1px,transparent 1px)',
              backgroundSize: `${cell}px ${cell}px`, clipPath: ready ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
              transition: instant ? 'none' : 'clip-path .95s cubic-bezier(.6,0,.2,1)',
            }} />
          {cells.slice(0, shown).map((c, i) => (
            <span key={i} className="absolute flex items-center justify-center"
              style={{
                left: c.c * cell, top: c.r * cell, width: cell + 1, height: cell + 1, background: accent, boxShadow: 'inset 0 0 0 1px #141414',
                fontFamily: hasHangul(c.ch) ? "'Noto Sans KR', sans-serif" : "'Inter', sans-serif", fontWeight: hasHangul(c.ch) ? 500 : 400,
                fontSize: cell * (hasHangul(c.ch) ? 0.58 : 0.74), lineHeight: 1, color: '#141414',
              }}>{c.ch}</span>
          ))}
          {nextIdx >= 0 && ready && (
            <span className="absolute dd-grid-cursor" style={{ left: cells[nextIdx].c * cell, top: cells[nextIdx].r * cell, width: cell + 1, height: cell + 1, boxShadow: `inset 0 0 0 1px #141414, inset 0 0 0 3px ${accent}` }} />
          )}
        </div>
        <div className="flex justify-between" style={{ ...caps, marginTop: 9 }}>
          <span>{data.venue}</span>
          <span>{[weekdayEn(data.date), data.timeDisplay].filter(Boolean).join(', ')}</span>
        </div>
      </div>
      <style jsx>{`
        .dd-grid-cursor { animation: ddGridBlink 1.05s steps(1, end) infinite; }
        @keyframes ddGridBlink { 0% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
