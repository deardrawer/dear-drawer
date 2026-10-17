'use client'

// 글자 타일: 흑백 사진 위로 흩어진 글자 타일이 하나씩 날아와 문장이 되고, 다 맞춰지면
// 사진이 컬러로 바뀌며 하트가 피어나고, 마지막에 한글 문구가 나타난다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { type IntroStyleProps, cropOf, hasHangul, lines, nameFont, photoOf, str, tint } from './shared'
import IntroPhoto from './IntroPhoto'

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}

function Heart({ x, y, size, rot, white, color = '#8FABC5' }: { x: number; y: number; size: number; rot: number; white?: boolean; color?: string }) {
  const t = `translate(${x} ${y}) rotate(${rot}) scale(${size})`
  if (white) return <path transform={t} d="M0 .34C-.56 -.04 -.52 -.62 0 -.3C.52 -.62 .56 -.04 0 .34Z" fill="#fff" opacity={0.9} />
  return (
    <g transform={t} style={{ filter: 'drop-shadow(0 2px 2px rgba(28,40,51,.28))' }}>
      <path d="M0 .36C-.58 -.04 -.53 -.64 0 -.3Z" fill={tint(color, 0.55)} />
      <path d="M0 -.3C.53 -.64 .58 -.04 0 .36Z" fill={color} />
    </g>
  )
}

export default function TilesIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const rows = lines(opts.lines, 'WE ARE\nGETTING\nMARRIED').slice(0, 3)
  const photo = photoOf(opts, 'photo', data)
  const crop = cropOf(opts, 'photo')
  const instant = finished || reduced
  const heart = str(opts.heartColor, '#8FABC5')
  const ko = rows.some(hasHangul)
  const caption = str(opts.caption, '저희 결혼합니다')
  const ymd = /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date.replace(/-/g, '.') : ''
  const sub = [`${data.groomGiven} · ${data.brideGiven}`, ymd].filter(Boolean).join(' · ')

  const rowsKey = rows.join('\n')
  const tiles = useMemo(() => {
    const rs = rowsKey.split('\n')
    const r = rng(88)
    const maxLen = Math.max(...rs.map(l => Array.from(l).length), 1), gap = 6
    const s = Math.min(ko ? 46 : 38, Math.floor((w - 40 - (maxLen - 1) * gap) / maxLen))
    const out: { c: string; x: number; y: number; a: number; sx: number; sy: number; sa: number; s: number }[] = []
    // 얼굴을 가리지 않도록 화면 가운데 아래에 놓는다 (아래 한글 문구 자리는 남긴다)
    const blockH = rs.length * s + (rs.length - 1) * (gap + 10)
    const y0 = Math.max(h * 0.3, Math.min(h * 0.5, h - blockH - 150))
    rs.forEach((line, li) => {
      const ch = Array.from(line), tw = ch.length * s + (ch.length - 1) * gap
      const x0 = (w - tw) / 2 + (li % 2 ? -s * 0.35 : s * 0.25)
      ch.forEach((c, ci) => {
        if (c === ' ') return
        out.push({
          c, s, x: x0 + ci * (s + gap) + (r() - 0.5) * 4, y: y0 + li * (s + gap + 10) + (r() - 0.5) * 5, a: (r() - 0.5) * 6,
          sx: w * 0.18 + r() * w * 0.55, sy: h * 0.76 + r() * h * 0.1, sa: (r() - 0.5) * 80,
        })
      })
    })
    return out
  }, [rowsKey, w, h, ko])

  const decor = useMemo(() => {
    const r = rng(44)
    const big = [[.14, .17, .15, -17], [.31, .075, .075, 14], [.57, .13, .11, 11], [.84, .27, .095, -13], [.08, .45, .085, 17], [.92, .41, .1, -14], [.73, .06, .065, 7]]
    const small = Array.from({ length: 12 }, () => [0.05 + r() * 0.9, 0.04 + r() * 0.42, 9 + r() * 7, (r() - 0.5) * 46])
    return { big, small }
  }, [])

  const [placed, setPlaced] = useState(instant)
  const [hint, setHint] = useState(false)
  // 다 맞춰진 뒤: bloom(컬러 사진 + 하트) → caption(한글 문구)
  const [bloom, setBloom] = useState(instant)
  const [showCaption, setShowCaption] = useState(instant)
  const completed = useRef(false)

  useEffect(() => {
    if (instant || placed) return
    const t = setTimeout(() => setHint(true), 2000)
    return () => clearTimeout(t)
  }, [instant, placed])
  useEffect(() => {
    if (!placed || completed.current) return
    if (instant) { completed.current = true; onComplete(); return }
    const land = tiles.length * 55 + 750
    const ts = [
      setTimeout(() => setBloom(true), land),
      setTimeout(() => setShowCaption(true), land + 900),
      setTimeout(() => { completed.current = true; onComplete() }, land + 1700),
    ]
    return () => ts.forEach(clearTimeout)
  }, [placed]) // eslint-disable-line react-hooks/exhaustive-deps
  const [seenSignal, setSeenSignal] = useState(signal)
  // 사진 위에선 흰 글자, 사진이 없으면 밝은 바탕이라 진한 글자
  const ink: React.CSSProperties = photo ? { color: '#fff', textShadow: '0 1px 10px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.3)' } : { color: '#2a2a2a' }
  const bottom = tiles.length ? Math.max(...tiles.map(t => t.y + t.s)) : h * 0.5
  if (signal !== seenSignal) { setSeenSignal(signal); setPlaced(true) }

  return (
    <div className="absolute inset-0 bg-[#F2F1EE]" onClick={() => { setHint(false); setPlaced(true) }}>
      <div className="absolute overflow-hidden" style={{ inset: 10 }}>
        <IntroPhoto src={photo} crop={crop} className="w-full h-full" style={{ filter: bloom ? 'none' : 'grayscale(1) contrast(1.08)', transition: instant ? 'none' : 'filter 1.8s ease' }} />
      </div>
      <svg className="absolute inset-0 pointer-events-none" width={w} height={h} aria-hidden>
        {/* 큰 종이 하트는 하나씩 톡톡 붙고, 작은 흰 하트는 반짝이며 떠오른다 */}
        {decor.big.map(([x, y, s, r], i) => (
          <g key={i} style={{
            transformBox: 'fill-box', transformOrigin: 'center', opacity: bloom ? 1 : 0, transform: bloom ? 'scale(1)' : 'scale(0.2)',
            transition: instant ? 'none' : `transform .6s cubic-bezier(.3,1.7,.5,1) ${i * 110}ms, opacity .25s ease ${i * 110}ms`,
          }}>
            <Heart x={w * x} y={h * y} size={w * s} rot={r} color={heart} />
          </g>
        ))}
        {decor.small.map(([x, y, s, r], i) => (
          <g key={'s' + i} style={{
            opacity: bloom ? 1 : 0, transform: bloom ? 'none' : 'translateY(10px)',
            transition: instant ? 'none' : `transform 1.2s ease ${300 + i * 70}ms, opacity 1s ease ${300 + i * 70}ms`,
          }}>
            <Heart x={w * x} y={h * y} size={s} rot={r} white />
          </g>
        ))}
      </svg>
      {tiles.map((t, i) => (
        <div key={i} className="absolute left-0 top-0 flex items-center justify-center"
          style={{
            width: t.s, height: t.s, background: '#FBFBF9', color: '#2a2a2a',
            boxShadow: '0 1px 1.5px rgba(0,0,0,.18), 0 3px 7px rgba(0,0,0,.12)',
            fontFamily: ko ? "'Noto Sans KR', sans-serif" : "'Inter', sans-serif", fontSize: Math.round(t.s * (ko ? 0.46 : 0.5)),
            transform: placed ? `translate(${t.x}px, ${t.y}px) rotate(${t.a}deg)` : `translate(${t.sx}px, ${t.sy}px) rotate(${t.sa}deg)`,
            transition: instant ? 'none' : `transform .75s cubic-bezier(.3,1.25,.45,1) ${placed ? i * 55 : 0}ms`,
            zIndex: placed ? 30 : 10 + (i % 7),
          }}>
          <span>{t.c}</span>
          <i style={{ position: 'absolute', right: 3, top: 2, fontStyle: 'normal', fontFamily: "'Inter', sans-serif", fontSize: 7, color: '#9a958d' }}>{i + 1}</i>
        </div>
      ))}
      <div className="absolute left-0 right-0 text-center pointer-events-none"
        style={{ top: bottom + 30, ...ink, opacity: showCaption ? 1 : 0, transform: showCaption ? 'none' : 'translateY(8px)', transition: instant ? 'none' : 'opacity 1s ease, transform 1s ease' }}>
        <p className="m-0" style={{ fontFamily: nameFont(opts.captionFont, 'gowun'), fontSize: 21, letterSpacing: '.06em' }}>{caption}</p>
        {sub && <p className="m-0" style={{ marginTop: 8, fontFamily: "'Inter', 'Noto Sans KR', sans-serif", fontSize: 11, letterSpacing: '.1em', opacity: 0.92 }}>{sub}</p>}
      </div>
      <p className="absolute left-0 right-0 m-0 text-center pointer-events-none"
        style={{ top: '69%', fontSize: 12, ...ink, opacity: hint && !placed ? 1 : 0, transition: 'opacity .6s' }}>
        화면을 눌러 글자를 맞춰보세요
      </p>
    </div>
  )
}
