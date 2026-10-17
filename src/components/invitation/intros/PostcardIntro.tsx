'use client'

// 넘겨 읽는 엽서: 필름 느낌 배경 위로 가로형 엽서가 도착하고 소인이 쾅 찍힌다.
// 옆으로 넘기면 뒷면 왼쪽 절반을 채운 사진과 오른쪽 손글씨 메모가 펜으로 쓰듯 한 줄씩 써지고, 마지막에 하트를 그린다.
import { useEffect, useId, useRef, useState } from 'react'
import { type IntroStyleProps, PAPER_TEXTURE, cropOf, lines, photoOf, str } from './shared'
import IntroPhoto from './IntroPhoto'
import { POSTCARD_DEFAULT_PHOTO } from '@/lib/introStyles'

// 손글씨 (눈누 무료 글꼴): 어른 = 교보 손글씨 2020 박도연, 아이 = 어비 마이센체
const HANDS = {
  adult: { family: 'KyoboHandwriting2020A', url: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2112@1.0/KyoboHandwriting2020A.woff', size: 17, lh: 1.38, rot: -3 },
  kid: { family: 'UhBeemysen', url: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_five@1.0/UhBeemysen.woff', size: 21, lh: 1.34, rot: -2 },
}
type HandKey = keyof typeof HANDS

function useHandFont(key: HandKey) {
  useEffect(() => {
    const h = HANDS[key]
    if (document.querySelector(`style[data-hand="${key}"]`)) return
    const el = document.createElement('style')
    el.setAttribute('data-hand', key)
    el.textContent = `@font-face{font-family:'${h.family}';src:url('${h.url}') format('woff');font-display:swap}`
    document.head.appendChild(el)
  }, [key])
}

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .22 0'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>\")"

/** 기본 서명: '지훈이랑 서연' / '민수랑 서연' (받침에 따라 이랑·랑, 한글이 아니면 &) */
function withRang(a: string, b: string) {
  const last = a.charCodeAt(a.length - 1) - 0xac00
  if (last < 0 || last > 11171) return `${a} & ${b}`
  return `${a}${last % 28 ? '이랑' : '랑'} ${b}`
}

/** 톱니 테두리 우표 (가장자리만 구멍을 뚫는다) */
function Stamp({ id, w, h, src, label }: { id: string; w: number; h: number; src: string; label: string }) {
  const holes: [number, number][] = []
  const gap = 5.2, r = 1.9
  for (let x = gap / 2; x < w; x += gap) holes.push([x, 0], [x, h])
  for (let y = gap / 2; y < h; y += gap) holes.push([0, y], [w, y])
  return (
    <svg width={w} height={h} style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,.28))', overflow: 'visible' }} aria-hidden>
      <defs>
        <mask id={id}><rect width={w} height={h} fill="#fff" />{holes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={r} fill="#000" />)}</mask>
      </defs>
      <g mask={`url(#${id})`}>
        <rect width={w} height={h} fill="#FFFFFF" />
        {src && <image href={src} x={4.5} y={4.5} width={w - 9} height={h - 17} preserveAspectRatio="xMidYMid slice" />}
        <text x={w - 5} y={h - 5} textAnchor="end" fontSize={6.6} fontWeight={600} letterSpacing=".06em" fill="#3a3530" fontFamily="'Inter', sans-serif">{label}</text>
      </g>
    </svg>
  )
}

/** 소인: 이중 원 + 둥근 글자 + 물결 */
function Postmark({ id, d, top, center, sub }: { id: string; d: number; top: string; center: string; sub: string }) {
  // 지름 d에 맞춰 줄어드는 소인 (물결은 원 왼쪽으로 짧게)
  const WL = Math.round(d * 0.62), r = d / 2 - 1.5, cx = WL + d / 2 - 2, cy = d / 2, k = d / 70
  const arc = `M ${cx - r + 4.5 * k} ${cy} A ${r - 4.5 * k} ${r - 4.5 * k} 0 0 1 ${cx + r - 4.5 * k} ${cy}`
  const seg = WL / 3
  const wave = (y: number) => `M 0 ${y} q ${seg / 2} -3.5 ${seg} 0 t ${seg} 0 t ${seg} 0`
  return (
    <svg width={WL + d} height={d} viewBox={`0 0 ${WL + d} ${d}`} aria-hidden style={{ overflow: 'visible' }}>
      <defs><path id={id} d={arc} /></defs>
      <g fill="none" stroke="#fff" strokeWidth={1.1}>
        <circle cx={cx} cy={cy} r={r} />
        <circle cx={cx} cy={cy} r={r - 2.6 * k} strokeWidth={0.6} />
        {[cy - 6 * k, cy, cy + 6 * k].map((y, i) => <path key={i} d={wave(y)} strokeWidth={0.9} />)}
      </g>
      <text fill="#fff" fontSize={Math.max(4.6, 6 * k)} fontWeight={600} letterSpacing=".08em" fontFamily="'Inter', sans-serif">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{top}</textPath>
      </text>
      <text x={cx} y={cy + 3.5 * k} textAnchor="middle" fill="#fff" fontSize={(center.length > 5 ? 8 : 11) * k} fontWeight={600} fontFamily="'Inter', sans-serif">{center}</text>
      {sub && <text x={cx} y={cy + 11.5 * k} textAnchor="middle" fill="#fff" fontSize={Math.max(4.4, 5.6 * k)} letterSpacing=".18em" fontFamily="'Inter', sans-serif">{sub}</text>}
    </svg>
  )
}

export default function PostcardIntro({ w, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const instant = finished || reduced
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const handKey: HandKey = str(opts.hand, 'kid') === 'adult' ? 'adult' : 'kid'
  const hand = HANDS[handKey]
  useHandFont(handKey)

  // 앞면·배경은 비워두면 기본 사진
  const front = str(opts.frontPhoto, POSTCARD_DEFAULT_PHOTO)
  const back = photoOf(opts, 'backPhoto', data, 'gallery0')
  const bg = str(opts.bgPhoto, POSTCARD_DEFAULT_PHOTO)
  const note = lines(opts.note, '소중한 분들을\n초대합니다!').slice(0, 6)
  const sign = str(opts.sign, withRang(data.groomGiven, data.brideGiven))
  const rows = [...note, sign]
  const noteKey = note.join('')

  // 소인 글자: 이름 + 날짜 (노웨딩이면 날짜 대신 하트)
  const [yy, mm, dd] = /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date.split('-') : ['', '', '']
  const pmTop = (data.groomEn && data.brideEn ? `${data.groomEn} & ${data.brideEn}` : `${data.groomGiven} & ${data.brideGiven}`).toUpperCase()
  const pmCenter = yy ? `${mm}.${dd}` : '♥'
  const stampLabel = yy || 'LOVE'

  const cw = w - 36, ch = Math.round(cw * 0.68)
  // 메모는 오른쪽 절반 안에 들어가도록 가장 긴 줄 기준으로 글자 크기를 맞춘다
  const longest = Math.max(...rows.map(l => Array.from(l).length), 1)
  const fs = Math.min(hand.size, w * (handKey === 'kid' ? 0.064 : 0.05), (cw * 0.42) / (longest * 0.88))
  const sw = Math.round(cw * 0.15), sh = Math.round(sw * 1.22), pmD = Math.round(cw * 0.175)

  const [arrived, setArrived] = useState(instant)
  const [stamped, setStamped] = useState(instant)
  const [flipped, setFlipped] = useState(instant)
  const [written, setWritten] = useState(instant ? rows.length : 0)
  const [heart, setHeart] = useState(instant)
  const [hint, setHint] = useState(false)
  const [drag, setDrag] = useState<number | null>(null)
  const completed = useRef(false)

  const flip = () => { if (!flipped) { setFlipped(true); setHint(false); setDrag(null) } }

  // 도착 → 소인 쾅
  useEffect(() => {
    if (instant) return
    const a = requestAnimationFrame(() => setArrived(true))
    const t = setTimeout(() => setStamped(true), 950)
    return () => { cancelAnimationFrame(a); clearTimeout(t) }
  }, [instant])
  useEffect(() => {
    if (instant || flipped) return
    const t = setTimeout(() => setHint(true), 2400)
    return () => clearTimeout(t)
  }, [instant, flipped])

  // 뒤집힌 뒤 손글씨가 한 줄씩 (글꼴이 준비된 다음 쓰기 시작)
  const [fontReady, setFontReady] = useState(instant)
  useEffect(() => {
    if (!flipped || fontReady) return
    let alive = true
    const go = () => { if (alive) setFontReady(true) }
    const t = setTimeout(go, 1800)
    document.fonts?.load(`20px '${hand.family}'`, noteKey).then(go, go)
    return () => { alive = false; clearTimeout(t) }
  }, [flipped, fontReady, hand.family, noteKey])
  const lineMs = (i: number) => Math.max(380, Array.from(rows[i] || '').length * 110)
  useEffect(() => {
    if (!flipped || !fontReady || written >= rows.length) return
    const t = setTimeout(() => setWritten(n => n + 1), written === 0 ? 650 : lineMs(written - 1) + 90)
    return () => clearTimeout(t)
  })
  // 다 쓰면 서명 옆에 하트를 그리고 끝
  useEffect(() => {
    if (heart || written < rows.length) return
    const t = setTimeout(() => setHeart(true), lineMs(rows.length - 1) + 120)
    return () => clearTimeout(t)
  })
  useEffect(() => {
    if (completed.current || !heart) return
    const t = setTimeout(() => { completed.current = true; onComplete() }, instant ? 0 : 800)
    return () => clearTimeout(t)
  })

  const [seenSignal, setSeenSignal] = useState(signal)
  if (signal !== seenSignal) {
    setSeenSignal(signal); setArrived(true); setStamped(true); setFlipped(true); setFontReady(true)
    setWritten(rows.length); setHeart(true); setHint(false); setDrag(null)
  }

  // 옆으로 넘기기: 손가락을 따라 돌아가고, 충분히 넘기거나 누르면 뒤집힌다
  const start = useRef<{ x: number; moved: boolean } | null>(null)
  const angle = flipped ? -180 : drag ?? 0
  const springBack = drag === null && !flipped
  const ease = instant ? 'none' : undefined

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#9BBCCB' }}>
      {/* 배경: 필름 느낌 (부드러운 초점, 빠진 색, 들뜬 검정, 고운 입자) */}
      <IntroPhoto src={bg} crop={cropOf(opts, 'bgPhoto')} className="absolute inset-0"
        style={{ filter: 'blur(1.4px) saturate(.78) contrast(.86) brightness(1.06)', transform: 'scale(1.04)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(232,236,238,.12)', backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />

      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1400 }}>
        {/* 손으로 놓은 듯 살짝 기울어 도착하고, 뒤집으면 반대로 기운다 */}
        <div style={{
          transform: arrived ? `translateY(0) rotate(${flipped ? 1.5 : -2}deg)` : 'translateY(-28px) rotate(-7deg)',
          opacity: arrived ? 1 : 0,
          transition: ease ?? 'transform .8s cubic-bezier(.2,.8,.25,1), opacity .5s ease',
        }}>
          <div className={stamped && !instant && !flipped ? 'dd-pc-thud' : flipped && !instant ? 'dd-pc-lift' : undefined}>
            <div data-intro-gesture className="relative" style={{ width: cw, height: ch, touchAction: 'pan-y' }}
              onPointerDown={(e) => { if (flipped) return; setHint(false); start.current = { x: e.clientX, moved: false }; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId) }}
              onPointerMove={(e) => {
                if (!start.current || flipped) return
                const dx = e.clientX - start.current.x
                if (Math.abs(dx) > 6) start.current.moved = true
                if (start.current.moved) setDrag(Math.max(-120, Math.min(0, dx / w * 200)))
              }}
              onPointerUp={(e) => {
                const s = start.current; start.current = null
                if (!s || flipped) return
                const dx = e.clientX - s.x
                if (!s.moved || dx < -w * 0.25) flip(); else setDrag(null)
              }}>
              <div className="absolute inset-0" style={{
                transformStyle: 'preserve-3d', transform: `rotateY(${angle}deg)`,
                transition: instant || drag !== null ? 'none' : springBack ? 'transform .5s cubic-bezier(.3,1.3,.5,1)' : 'transform 1.1s cubic-bezier(.45,0,.2,1)',
              }}>
                {/* 앞면: 사진 + 우표 + 소인 */}
                <div className="absolute inset-0 overflow-hidden" style={{ ...FACE, background: '#ddd', border: '8px solid #FFFFFF', boxSizing: 'border-box' }}>
                  <IntroPhoto src={front} crop={cropOf(opts, 'frontPhoto')} label="두 사람의 사진" className="absolute inset-0" style={str(opts.frontTone, 'mono') === 'mono' ? { filter: 'grayscale(1) contrast(1.15) brightness(.97)' } : undefined} />
                  <div className="absolute" style={{ right: 9, top: 9, transform: 'rotate(2deg)' }}>
                    <Stamp id={`st${uid}`} w={sw} h={sh} src={back || front} label={stampLabel} />
                  </div>
                  <div className="absolute pointer-events-none" style={{
                    right: 9 + sw * 0.55, top: 9 + sh * 0.45,
                    transform: stamped ? 'rotate(-12deg) scale(1)' : 'rotate(-12deg) scale(1.7)', opacity: stamped ? 0.86 : 0,
                    transition: ease ?? 'transform .28s cubic-bezier(.3,1.5,.5,1), opacity .18s ease', transformOrigin: '75% 50%',
                  }}>
                    <Postmark id={`pm${uid}`} d={pmD} top={pmTop} center={pmCenter} sub={yy} />
                  </div>
                </div>

                {/* 뒷면: 왼쪽 절반을 꽉 채운 사진 + 오른쪽 손글씨 메모 + 하트 */}
                <div className="absolute inset-0 overflow-hidden" style={{ ...FACE, backgroundColor: '#FFFFFF', backgroundImage: PAPER_TEXTURE, backgroundSize: '240px 240px', transform: 'rotateY(180deg)' }}>
                  <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ width: '50%', background: '#d8d4cc' }}>
                    <IntroPhoto src={back} crop={cropOf(opts, 'backPhoto')} className="absolute inset-0" />
                  </div>
                  <div className="absolute flex justify-center" style={{ left: '50%', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="text-center" style={{
                    transform: `rotate(${hand.rot}deg)`,
                    fontFamily: `'${hand.family}', 'Nanum Pen Script', cursive`, fontSize: fs, lineHeight: hand.lh, color: '#1a1815', textShadow: handKey === 'kid' ? '0 0 .6px #1a1815, 0 0 .6px #1a1815' : '0 0 .3px #1a1815',
                  }}>
                    {rows.map((l, i) => {
                      const last = i === rows.length - 1
                      return (
                        <span key={i} className="block whitespace-nowrap" style={last ? { marginTop: 6, fontSize: '.88em' } : undefined}>
                          <span className="inline-block" style={{
                            clipPath: i < written ? 'inset(-20% -10% -30% -10%)' : 'inset(-20% 105% -30% -10%)',
                            transition: instant ? 'none' : `clip-path ${lineMs(i)}ms cubic-bezier(.35,.1,.45,1)`,
                            opacity: last ? 0.8 : 1,
                          }}>{l}</span>
                          {last && (
                            <svg width="1.05em" height="1em" viewBox="0 0 24 22" className="inline-block" style={{ marginLeft: 4, verticalAlign: '-0.12em', overflow: 'visible' }} aria-hidden>
                              <path d="M12 20 C 4 14, 1 9, 4 5 C 7 1.5, 11 3.5, 12 7 C 13 3.5, 17 1.5, 20 5 C 23 9, 20 14, 12 20" fill="none" stroke="#C2463F" strokeWidth={1.8} strokeLinecap="round"
                                pathLength={1} strokeDasharray={1} strokeDashoffset={heart ? 0 : 1} style={{ transition: instant ? 'none' : 'stroke-dashoffset .7s ease-in-out' }} />
                            </svg>
                          )}
                        </span>
                      )
                    })}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="absolute left-0 right-0 m-0 text-center pointer-events-none"
        style={{ top: `calc(50% + ${ch / 2 + 26}px)`, fontSize: 12, color: '#fff', textShadow: '0 1px 4px rgba(20,40,60,.45)', opacity: hint && !flipped ? 0.9 : 0, transition: 'opacity .6s' }}>
        엽서를 옆으로 넘겨보세요
      </p>
      <style jsx>{`
        .dd-pc-thud { animation: ddPcThud .32s ease-out; }
        @keyframes ddPcThud { 0% { transform: scale(1); } 35% { transform: scale(.982) translateY(1px); } 100% { transform: scale(1); } }
        .dd-pc-lift { animation: ddPcLift 1.1s cubic-bezier(.45,0,.2,1); }
        @keyframes ddPcLift { 0%, 100% { transform: scale(1); } 45% { transform: scale(1.06); } }
      `}</style>
    </div>
  )
}

const FACE: React.CSSProperties = {
  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
  boxShadow: '0 1px 2px rgba(20,36,48,.16), 0 6px 12px -4px rgba(20,36,48,.18), 0 22px 40px -14px rgba(20,36,48,.38)',
}