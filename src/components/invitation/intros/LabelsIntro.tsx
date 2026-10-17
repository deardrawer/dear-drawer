'use client'

// 라벨 문구: 가운데 사진 카드를 누르면 뒤집혀 두 번째 사진이 나오고,
// 사진 가장자리에 문장 라벨이 한 줄씩 붙은 뒤 사진 아래로 초대 한 줄이 타자 치듯 써진다.
import { useEffect, useRef, useState } from 'react'
import { type IntroStyleProps, paperLayer, coupleNames, cropOf, hasHangul, isDark, lines, nameFont, photoOf, str } from './shared'
import IntroPhoto from './IntroPhoto'

export default function LabelsIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const rows = lines(opts.lines, "NEVER\nTHOUGHT\nI'D\nFIND YOU")
  const color = str(opts.labelColor, '#F2B53A')
  const pointInk = str(opts.labelTextColor, 'dark') === 'white' ? '#FFFFFF' : '#141414'
  const INVITE = str(opts.invite, '소중한 당신을 초대합니다!')
  const bg = str(opts.bgColor, '#EDEBE7')
  const dark = isDark(bg)
  const ink = dark ? { title: '#F4F1EC', sub: 'rgba(244,241,236,.7)' } : { title: '#141414', sub: '#6d6a64' }
  // 뒷면(뒤집은 뒤) = 'photo' — 예전에 고른 사진·크롭이 그대로 뒷면이 된다
  const photo = photoOf(opts, 'photo', data)
  const crop = cropOf(opts, 'photo')
  const front = photoOf(opts, 'frontPhoto', data, 'gallery0')
  const frontCrop = cropOf(opts, 'frontPhoto')
  // 사진이 한 장뿐이면 앞면은 흑백, 뒷면은 컬러
  const samePhoto = front === photo
  const instant = finished || reduced

  const pw = Math.round(w * (w < 340 ? 0.62 : 0.52)), px = Math.round((w - pw) / 2)
  const phh = Math.round(h * 0.42), HEAD = 64, TAIL = 36
  const py = Math.round((h - (HEAD + phh + TAIL)) / 2 + HEAD)
  const lineH = 34, ly = py + phh * 0.5 - ((rows.length - 1) * lineH) / 2
  const STEP = [0, 22]

  const [placed, setPlaced] = useState(instant ? rows.length : 0)
  const [typed, setTyped] = useState(instant ? Array.from(INVITE).length : 0)
  const [hint, setHint] = useState(false)
  const [flipped, setFlipped] = useState(instant)
  const [started, setStarted] = useState(instant)
  const completed = useRef(false)

  // 탭: 카드를 뒤집고, 다 뒤집히면 라벨이 붙기 시작한다
  const start = () => {
    if (flipped) return
    setFlipped(true)
    setHint(false)
  }
  useEffect(() => {
    if (!flipped || started) return
    const t = setTimeout(() => setStarted(true), 950)
    return () => clearTimeout(t)
  }, [flipped, started])

  useEffect(() => {
    if (instant || flipped) return
    const t = setTimeout(() => setHint(true), 1800)
    return () => clearTimeout(t)
  }, [instant, flipped])

  // 라벨을 한 줄씩
  useEffect(() => {
    if (!started || placed >= rows.length) return
    const t = setTimeout(() => setPlaced(n => n + 1), placed === 0 ? 0 : 170)
    return () => clearTimeout(t)
  })
  // 라벨 다 붙으면 초대 한 줄 타이핑
  const total = Array.from(INVITE).length
  useEffect(() => {
    if (!started || placed < rows.length || typed >= total) return
    const t = setTimeout(() => setTyped(n => n + 1), typed === 0 ? 350 : 85)
    return () => clearTimeout(t)
  })
  useEffect(() => {
    if (typed >= total && !completed.current) { completed.current = true; onComplete() }
  })

  const [seenSignal, setSeenSignal] = useState(signal)
  if (signal !== seenSignal) { setSeenSignal(signal); setFlipped(true); setStarted(true); setHint(false); setPlaced(rows.length); setTyped(Array.from(INVITE).length) }

  const names = str(opts.headTitle, coupleNames(data))
  const headKorean = hasHangul(names)

  return (
    <div className="absolute inset-0" style={{ background: bg }} onClick={() => start()}>
      <div style={paperLayer(dark)} />
      <div className="absolute flex flex-col gap-[5px]" style={{ left: px, top: py - HEAD }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: '.2em', color: ink.sub }}>{str(opts.headLabel, 'THE WEDDING OF')}</span>
        <span style={{ fontFamily: nameFont(opts.font, 'gowun'), fontSize: headKorean ? 20 : Math.min(24, w * 0.074), whiteSpace: 'nowrap', color: ink.title }}>{names}</span>
      </div>
      {/* 사진 카드: 앞면 → (탭) 0.9초 동안 뒤집혀 뒷면 */}
      <div className="absolute" style={{ left: px, top: py, width: pw, height: phh, perspective: 1100 }}>
        <div className={`w-full h-full ${hint && !flipped ? 'dd-labels-wiggle' : ''}`}>
          <div className="relative w-full h-full" style={{
            transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none',
            transition: instant ? 'none' : 'transform .9s cubic-bezier(.45,.05,.2,1)',
          }}>
            <div className="absolute inset-0 overflow-hidden bg-[#d8d4cc]" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', boxShadow: '0 8px 20px -10px rgba(0,0,0,.35)' }}>
              <IntroPhoto src={front} crop={frontCrop} className="w-full h-full" style={samePhoto ? { filter: 'grayscale(1) contrast(1.05)' } : undefined} />
            </div>
            <div className="absolute inset-0 overflow-hidden bg-[#d8d4cc]" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: '0 8px 20px -10px rgba(0,0,0,.35)' }}>
              <IntroPhoto src={photo} crop={crop} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
      {rows.map((l, i) => {
        const on = i < placed
        const ko = hasHangul(l)
        const last = i === rows.length - 1
        return (
          <span key={i} className="absolute whitespace-nowrap"
            style={{
              left: Math.max(10, px - 30 + STEP[i % 2]), top: Math.round(ly + i * lineH),
              background: last ? color : '#fff', color: last ? pointInk : '#141414', padding: '7px 11px 6px 12px',
              fontFamily: ko ? "'Noto Sans KR', sans-serif" : "'Inter', sans-serif", fontWeight: ko ? 500 : 600,
              fontSize: ko ? 13.5 : 12.5, letterSpacing: ko ? '.12em' : '.16em',
              transform: on ? 'none' : 'translateX(-10px)', opacity: on ? 1 : 0,
              transition: instant ? 'none' : 'transform .55s cubic-bezier(.2,.7,.2,1), opacity .35s ease',
            }}>{l}</span>
        )
      })}
      <p className="absolute m-0 whitespace-nowrap" style={{ right: px, top: py + phh + 12, fontFamily: nameFont(opts.font, 'gowun'), fontSize: 13.5, letterSpacing: '.02em', color: ink.title }}>
        <span style={{ visibility: 'hidden' }}>{INVITE}</span>
        <span className="absolute left-0 top-0">
          {Array.from(INVITE).slice(0, typed).join('')}
          {started && typed < total && placed >= rows.length && <span className="dd-labels-caret" />}
        </span>
      </p>
      <p className="absolute left-0 right-0 m-0 text-center pointer-events-none"
        style={{ bottom: 40, fontSize: 12, color: ink.sub, opacity: hint ? 1 : 0, transition: 'opacity .6s' }}>화면을 눌러보세요</p>
      <style jsx>{`
        .dd-labels-caret { display: inline-block; width: 1px; height: 13px; background: currentColor; margin-left: 2px; vertical-align: -2px; animation: ddLc 1s steps(1) infinite; }
        @keyframes ddLc { 50% { opacity: 0; } }
        .dd-labels-wiggle { animation: ddLw 2.4s ease-in-out infinite; }
        @keyframes ddLw { 0%, 62%, 100% { transform: perspective(1100px) rotateY(0); } 72% { transform: perspective(1100px) rotateY(-12deg); } 84% { transform: perspective(1100px) rotateY(6deg); } }
      `}</style>
    </div>
  )
}
