'use client'

// 타자 오프닝: 트레이싱지 위에 문장이 타자 치듯 써지고, 다 써지면 종이가 걷히며 뒤의 사진이 드러난다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { type IntroStyleProps, PAPER_TEXTURE, coupleNames, cropOf, dateDots, hasHangul, photoOf, str } from './shared'
import IntroPhoto from './IntroPhoto'
import RevealCaption from './RevealCaption'

const FONTS: Record<string, string> = {
  // 나눔명조는 가로획이 아주 가늘어 일반 해상도 화면에서 '두'가 '누'처럼 깨져 보인다 → 획이 또렷한 노토 세리프
  myeongjo: "'Noto Serif KR', 'Nanum Myeongjo', serif",
  gothic: "Pretendard, 'Noto Sans KR', sans-serif",
}

type Ch = { c: string; it: boolean } | { br: true }

export default function TypedIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const sentence = str(opts.sentence, 'We found a love\nthat feels like *home*,\nand we’d like\nyou there.')
  const fontKey = str(opts.font, 'myeongjo')
  // 영문 문장은 명조 대신 클래식 세리프(Cormorant)로
  const font = !hasHangul(sentence) && fontKey !== 'gothic' ? "'Cormorant Garamond', 'Noto Serif KR', serif" : FONTS[fontKey] || FONTS.myeongjo
  const photo = photoOf(opts, 'photo', data)
  const crop = cropOf(opts, 'photo')
  const korean = hasHangul(sentence)

  const chars = useMemo<Ch[]>(() => {
    const out: Ch[] = []
    sentence.split('\n').forEach((line, li, arr) => {
      let it = false
      Array.from(line).forEach(c => { if (c === '*') { it = !it; return } out.push({ c, it }) })
      if (li < arr.length - 1) out.push({ br: true })
    })
    return out
  }, [sentence])

  const instant = finished || reduced
  // 타자 속도: 느리게·보통·빠르게, 문장이 길어도 다 써지는 데 걸리는 시간이 너무 길지 않게 (보통 기준 약 6초 상한)
  const speed = { slow: 1.35, normal: 1, fast: 0.65 }[str(opts.speed, 'normal')] ?? 1
  const letters = chars.filter(c => !('br' in c)).length
  const pace = speed * Math.min(1, 6000 / Math.max(1, letters * (korean ? 140 : 90)))
  const [count, setCount] = useState(instant ? chars.length : 0)
  const [phase, setPhase] = useState<'typing' | 'reveal'>(instant ? 'reveal' : 'typing')
  const completed = useRef(false)

  const complete = () => {
    if (completed.current) return
    completed.current = true
    onComplete()
  }

  // 타이핑
  useEffect(() => {
    if (phase !== 'typing' || count >= chars.length) return
    const ch = chars[count]
    const wait = count === 0 ? 900 : ('br' in ch ? 420 : /[,.]/.test(ch.c) ? 260 : (korean ? 120 : 70) + Math.random() * 40) * pace
    const t = setTimeout(() => setCount(n => n + 1), wait)
    return () => clearTimeout(t)
  }, [phase, count, chars, korean, pace])

  // 다 써지면 잠시 머문 뒤 종이를 걷는다
  const typedAll = phase === 'typing' && count >= chars.length
  useEffect(() => {
    if (!typedAll) return
    const t = setTimeout(() => setPhase('reveal'), 1600)
    return () => clearTimeout(t)
  }, [typedAll])

  useEffect(() => { if (phase === 'reveal') complete() })

  // 건너뛰기·스크롤
  const [seenSignal, setSeenSignal] = useState(signal)
  if (signal !== seenSignal) { setSeenSignal(signal); setCount(chars.length); setPhase('reveal') }

  const reveal = phase === 'reveal'
  const t = instant ? 'none' : undefined

  return (
    <div className="absolute inset-0 bg-[#DEDAD2]">
      {photo && (
        <IntroPhoto src={photo} crop={crop} className="absolute inset-0"
          style={{ filter: reveal ? 'none' : 'blur(9px)', transform: reveal ? 'scale(1)' : 'scale(1.06)', transition: t ?? 'filter 2.2s ease, transform 2.6s cubic-bezier(.2,.7,.2,1)' }} />
      )}
      {/* 트레이싱지 */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: 'rgba(251,250,246,.8)', backgroundImage: PAPER_TEXTURE, backgroundSize: '240px 240px',
          opacity: reveal ? 0 : 1, transition: t ?? 'opacity 1.6s ease',
        }} />
      <p className="absolute m-0"
        style={{
          left: korean ? '25%' : '28%', top: '43%', fontFamily: font, fontWeight: korean && fontKey !== 'gothic' ? 500 : 400, fontSize: korean ? 16 : 21, lineHeight: korean ? 1.75 : 1.32,
          color: '#1c1b19', letterSpacing: korean ? '-0.01em' : '0.005em', opacity: reveal ? 0 : 1, transition: t ?? 'opacity 1s ease',
        }}>
        {chars.slice(0, count).map((ch, i) =>
          'br' in ch ? <br key={i} /> : ch.it
            ? <em key={i} style={korean ? { fontStyle: 'normal', textDecoration: 'underline', textUnderlineOffset: 4, textDecorationThickness: '0.5px' } : undefined}>{ch.c}</em>
            : <span key={i}>{ch.c}</span>)}
        {phase === 'typing' && !typedAll && <span className="dd-typed-caret" />}
      </p>
      {/* 사진이 드러난 뒤: 공용 '열린 뒤 사진 위 문구' */}
      <RevealCaption w={w} h={h} opts={opts} data={data} open={reveal} instant={instant} />
      {/* 써지는 동안 아래 이름·날짜 */}
      <p className="absolute left-0 right-0 m-0 text-center"
        style={{ bottom: 64, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 9.5, letterSpacing: '.32em', color: '#2a2826', opacity: typedAll ? 1 : 0, transition: 'opacity 1s ease' }}>
        {coupleNames(data).toUpperCase()}{data.date ? `  ·  ${dateDots(data.date)}` : ''}
      </p>
      <style jsx>{`
        .dd-typed-caret { display: inline-block; width: 1px; height: 1em; background: #1c1b19; margin-left: 1px; vertical-align: -0.12em; animation: ddCaret 1s steps(1) infinite; }
        @keyframes ddCaret { 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
