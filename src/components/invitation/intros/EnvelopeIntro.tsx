'use client'

// 포스터 봉투: 처음엔 짙은 색 봉투(영화 포스터처럼 아래에 이름과 크레딧)뿐이고, 위쪽에 절취선 띠가 붙어 있다.
// 띠의 오른쪽 끝을 왼쪽으로 당기면 절취선 구멍이 하나씩 '도도도독' 뜯기며 그 자리로 사진이 보이고,
// 끝까지 뜯으면 태그라인이 나타난 뒤 봉투가 사라지며 화면 가득 사진과 이름이 드러난다.
import { useEffect, useMemo, useRef, useState } from 'react'
import { type IntroStyleProps, cropOf, paperLayer, isDark, photoOf, str, tint, weekdayEn } from './shared'
import IntroPhoto from './IntroPhoto'
import RevealCaption from './RevealCaption'
import FitLine from './FitLine'

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='51'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .14 0'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>\")"
const FIBER = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.06 .9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .22 -.04'/></filter><rect width='100%25' height='100%25' filter='url(%23f)'/></svg>\")"
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
const SP = 6, HR = 1.3, BASE = 1.5   // 절취선 구멍 간격·반지름

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}
/** 절취선을 따라 뜯긴 가장자리: SP마다 반원 구멍, 사이사이 들쭉날쭉한 섬유 */
function edge(seed: number, W: number) {
  const r = rng(seed), o: [number, number][] = []
  let j = 0
  for (let X = 0; X <= W; X += 0.5) {
    const dx = (((X - SP / 2) % SP) + SP) % SP - SP / 2
    if (Math.round(X * 2) % 3 === 0) j = (r() - 0.5) * 0.5
    o.push([X, Math.abs(dx) < HR ? Math.sqrt(HR * HR - dx * dx) : j])
  }
  return o
}
function ragged(W: number, grow: number) {
  const ET = edge(61, W), EB = edge(67, W), p: string[] = []
  for (const [x, y] of ET) p.push(`${x.toFixed(1)}px ${(BASE - y - grow).toFixed(2)}px`)
  for (let i = EB.length - 1; i >= 0; i--) p.push(`${EB[i][0].toFixed(1)}px calc(100% - ${(BASE - EB[i][1] - grow).toFixed(2)}px)`)
  return `polygon(${p.join(',')})`
}

type Api = { down: (e: React.PointerEvent) => void; move: (e: React.PointerEvent) => void; up: () => void; cancel: () => void; open: (fast: boolean) => void }

export default function EnvelopeIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const instant = finished || reduced
  const color = str(opts.color, '#FFFFFF')
  const dark = isDark(color)
  const ink = dark ? { title: 'rgba(226,232,236,.92)', credit: 'rgba(214,222,228,.62)', hint: 'rgba(226,232,236,.75)', pull: 'rgba(226,232,236,.55)' }
    : { title: 'rgba(32,30,28,.9)', credit: 'rgba(40,36,32,.6)', hint: 'rgba(40,36,32,.7)', pull: 'rgba(40,36,32,.45)' }
  const backColor = dark ? tint(color, 0.18) : tint(color, -0.12)
  const photo = photoOf(opts, 'photo', data)
  const crop = cropOf(opts, 'photo')
  const tagline = str(opts.tagline, 'We’re connected through love')

  // 포스터 글자: 이름(제목) + 영화 크레딧 같은 예식 정보
  const en = !!(data.groomEn && data.brideEn)
  // 포스터 제목: 직접 쓴 문구가 있으면 그대로, 없으면 두 사람 이름
  const title = (str(opts.posterTitle).trim() || (en ? `${data.groomEn} & ${data.brideEn}` : `${data.groomName} & ${data.brideName}`)).toUpperCase()
  const d = data.date ? new Date(data.date) : null
  const dateOk = !!d && !isNaN(d.getTime())
  const credits = [
    `${(en ? data.groomEn : data.groomName).toUpperCase()} AND ${(en ? data.brideEn : data.brideName).toUpperCase()} REQUEST THE PLEASURE OF YOUR COMPANY`,
    dateOk ? `AT THEIR WEDDING ON ${weekdayEn(data.date).toUpperCase()} ${d!.getDate()} ${MONTHS[d!.getMonth()]} ${d!.getFullYear()}` : 'AS THEY BEGIN THEIR LIFE TOGETHER',
    data.venue ? data.venue.toUpperCase() : '',
    'WITH LOVE FROM BOTH FAMILIES',
  ].filter(Boolean)

  const SEAM = Math.round(h * 0.33), BH = Math.round(h * 0.11), ST = SEAM - BH / 2 - 3
  const clipW = useMemo(() => ragged(w, 0), [w])
  const clipR = useMemo(() => ragged(w, 0.8), [w])

  const [opened, setOpened] = useState(instant)
  const [reveal, setReveal] = useState(instant)
  const [hint, setHint] = useState(false)
  const tapeRef = useRef<HTMLButtonElement>(null), stuckRef = useRef<HTMLSpanElement>(null)
  const peelRef = useRef<HTMLSpanElement>(null), backRef = useRef<HTMLSpanElement>(null)
  const api = useRef<Api | null>(null)
  const doneRef = useRef(instant)

  useEffect(() => {
    const tape = tapeRef.current, stuck = stuckRef.current, peel = peelRef.current, back = backRef.current
    if (!tape || !stuck || !peel || !back || w < 10) return
    let alive = true, raf = 0
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(() => { if (alive) fn() }, ms)) }
    const finish = () => { if (!doneRef.current) { doneRef.current = true; onComplete() } }
    if (instant) { finish(); return () => { alive = false } }

    const K0 = 14
    let kk = K0, opened = false, touched = false, drag = false, moved = false, x0 = 0, ks = 0, last = 0, lastT = 0, v = 0, lastSnap = -1
    const canBuzz = typeof navigator !== 'undefined' && 'vibrate' in navigator
    const setK = (n: number) => {
      const Lw = tape.offsetWidth
      kk = Math.max(0, Math.min(Lw, n))
      // 구멍 하나씩 끊긴다: SP 단위로 끊어서 진행 (지원되는 폰은 구멍마다 짧은 진동)
      const snapped = kk >= Lw ? Lw : K0 + Math.floor(Math.max(0, kk - K0) / SP) * SP
      if (snapped !== lastSnap) {
        const fresh = lastSnap >= 0 && snapped > lastSnap
        lastSnap = snapped
        if (fresh) { peel.style.marginTop = `${((Math.random() - 0.5) * 1.2).toFixed(2)}px`; if (canBuzz && drag) try { navigator.vibrate(4) } catch { /* 무시 */ } }
      }
      kk = snapped
      const cs = `inset(-12px ${kk.toFixed(1)}px -12px 0)`
      stuck.style.clipPath = cs; stuck.style.setProperty('-webkit-clip-path', cs)
      back.style.width = `${Lw}px`
      peel.style.left = `${(Lw - 2 * kk).toFixed(1)}px`; peel.style.width = `${kk.toFixed(1)}px`; peel.style.visibility = kk < 1 ? 'hidden' : 'visible'
      const p = Math.max(0, (kk - K0) / (Lw - K0))
      peel.style.transform = `translateY(${(-1 - p * 4).toFixed(2)}px) rotate(${(p * 1.2).toFixed(2)}deg)`
    }
    const tween = (from: number, to: number, ms: number, ease: (u: number) => number, done?: () => void) => {
      cancelAnimationFrame(raf)
      const t0 = performance.now()
      const f = (now: number) => {
        if (!alive) return
        const u = Math.max(0, Math.min(1, (now - t0) / ms))
        setK(from + (to - from) * ease(u))
        if (u < 1) raf = requestAnimationFrame(f); else done?.()
      }
      raf = requestAnimationFrame(f)
    }
    const inOut = (u: number) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2
    const outC = (u: number) => 1 - Math.pow(1 - u, 3)

    const doOpen = (fast: boolean) => {
      if (opened) return
      opened = true; touched = true
      setHint(false)
      tween(kk, tape.offsetWidth, fast ? 560 : 860, fast ? outC : inOut, () => {
        tape.style.transition = 'transform .9s cubic-bezier(.33,0,.2,1), opacity .6s ease .15s'
        tape.style.transform = 'translate(-18px,-34px) rotate(-3deg)'; tape.style.opacity = '0'
        // 날아간 띠는 화면 밖에 그림자째 걸쳐 있으면 화면을 끌어당기므로 아예 치운다
        later(() => { tape.style.display = 'none' }, 950)
        later(() => setOpened(true), 250)
        // 뜯긴 포스터를 잠깐 보여준 뒤 봉투가 사라지고 사진이 화면을 채운다
        later(() => setReveal(true), 1500)
        later(finish, 2900)
      })
    }

    api.current = {
      open: doOpen,
      down: (e) => {
        if (opened) return
        touched = true; setHint(false); cancelAnimationFrame(raf)
        drag = true; moved = false; x0 = last = e.clientX; lastT = e.timeStamp; ks = kk; v = 0
        tape.setPointerCapture?.(e.pointerId)
      },
      move: (e) => {
        if (!drag) return
        const dist = x0 - e.clientX
        if (Math.abs(dist) > 6) moved = true
        const dt = Math.max(1, e.timeStamp - lastT); v = (last - e.clientX) / dt; last = e.clientX; lastT = e.timeStamp
        setK(Math.max(K0, ks + dist / 2))
      },
      up: () => {
        if (!drag) return
        drag = false
        if (!moved) { doOpen(false); return }
        if (kk > tape.offsetWidth * 0.3 || v > 0.5) { doOpen(true); return }
        tween(kk, K0, 320, outC)
      },
      cancel: () => { if (!drag) return; drag = false; tween(kk, K0, 280, outC) },
    }

    setK(K0)
    later(() => { if (!touched && !opened) tween(K0, 46, 520, inOut, () => later(() => { if (!touched && !opened) tween(46, K0, 480, outC) }, 140)) }, 1700)
    later(() => { if (!touched && !opened) setHint(true) }, 2600)
    return () => { alive = false; timers.forEach(clearTimeout); cancelAnimationFrame(raf); api.current = null }
  }, [w, h, instant]) // eslint-disable-line react-hooks/exhaustive-deps

  // 건너뛰기·스크롤: 빠르게 뜯는다
  useEffect(() => { if (signal > 0) api.current?.open(true) }, [signal])

  const t = (css: string) => (instant ? 'none' : css)
  const perf = (top: boolean, back = false): React.CSSProperties => ({
    position: 'absolute', left: 0, right: 0, height: 4, [top ? 'top' : 'bottom']: 2.5,
    background: back
      ? 'radial-gradient(circle at 3px 2px, rgba(20,32,40,.6) 0 1.15px, transparent 1.6px) 0 0/6px 4px repeat-x'
      : 'radial-gradient(circle at 3px 2px, rgba(4,9,13,.92) 0 1.15px, rgba(4,9,13,.35) 1.5px, transparent 1.9px) 0 0/6px 4px repeat-x',
  })
  const face: React.CSSProperties = { position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%', display: 'block', backgroundColor: color, backgroundImage: GRAIN, backgroundSize: '180px 180px', backgroundPosition: `0 ${-ST}px` }

  return (
    <div className="absolute inset-0 overflow-hidden select-none" style={{ backgroundColor: color, overflow: 'clip' }}>
      {/* 다 뜯은 뒤 화면을 채우는 사진 + 글자 (트레이싱지와 같은 '열린 뒤 사진 위 문구') */}
      <div className="absolute inset-0" style={{ opacity: reveal ? 1 : 0, transition: t('opacity 1.4s ease') }}>
        <IntroPhoto src={photo} crop={crop} label="두 사람의 사진" className="absolute inset-0" />
      </div>
      <RevealCaption w={w} h={h} opts={opts} data={data} open={reveal} instant={instant} />

      {/* 포스터 봉투: 종이 + 이름 + 크레딧 */}
      <div className="absolute inset-0" style={{ backgroundColor: color, backgroundImage: GRAIN, backgroundSize: '180px 180px', opacity: reveal ? 0 : 1, transition: t('opacity 1.2s ease') }}>
        <div style={paperLayer(dark)} />
        <p className="absolute left-0 right-0 m-0 text-center whitespace-nowrap" style={{ top: h * 0.835, transform: 'translateY(-100%)', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: Math.round(w * 0.062), letterSpacing: w * 0.012, color: ink.title }}><FitLine max={w * 0.9}>{title}</FitLine></p>
        <div className="absolute left-0 right-0 text-center" style={{ top: h * 0.87 - 7 }}>
          {credits.map((c, i) => (
            <p key={i} className="m-0 whitespace-nowrap" style={{ fontFamily: "'Inter', 'Noto Sans KR', sans-serif", fontWeight: 500, fontSize: 7, lineHeight: '10px', color: ink.credit, transform: 'scaleX(.86)' }}>{c}</p>
          ))}
        </div>
      </div>

      {/* 뜯긴 자리: 들쭉날쭉한 가장자리 + 그 아래로 보이는 사진 띠 + 태그라인 (사진이 화면을 채우기 시작하면 바로 걷힌다) */}
      <div className="absolute left-0 w-full" style={{ top: SEAM - BH / 2, height: BH, background: 'rgba(206,218,226,.45)', clipPath: clipR, WebkitClipPath: clipR, opacity: reveal ? 0 : 1, transition: t('opacity .35s ease') }} />
      <div className="absolute left-0 w-full overflow-hidden" style={{ top: SEAM - BH / 2, height: BH, background: '#1d2b35', clipPath: clipW, WebkitClipPath: clipW, opacity: reveal ? 0 : 1, transition: t('opacity .35s ease') }}>
        <div className="absolute left-0" style={{ top: -(SEAM - BH / 2), width: w, height: h }}>
          <IntroPhoto src={photo} crop={crop} className="absolute inset-0" />
        </div>
        <em className="absolute whitespace-nowrap" style={{
          right: '6%', bottom: 9, fontFamily: "'Playfair Display', serif", fontStyle: 'normal', fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.92)', textShadow: '0 1px 6px rgba(0,0,0,.55)', opacity: opened && !reveal ? 1 : 0, transition: t('opacity 1s ease .2s'),
        }}>{tagline}</em>
      </div>

      {/* 절취선 띠 — 오른쪽 끝을 왼쪽으로 당겨 뜯는다 */}
      <button ref={tapeRef} type="button" data-intro-gesture aria-label="띠를 뜯어 사진 보기"
        className="absolute left-0 w-full p-0 border-0 bg-transparent"
        style={{ top: ST, height: BH + 6, zIndex: 5, touchAction: 'pan-y', cursor: 'grab', display: instant ? 'none' : 'block' }}
        onPointerDown={(e) => api.current?.down(e)}
        onPointerMove={(e) => api.current?.move(e)}
        onPointerUp={() => api.current?.up()}
        onPointerCancel={() => api.current?.cancel()}>
        <span ref={stuckRef} className="absolute inset-0 block">
          <span style={face}>
            <span style={paperLayer(dark)} />
            <span style={perf(true)} /><span style={perf(false)} />
            <svg className="absolute" width="34" height="10" viewBox="0 0 34 10" aria-hidden style={{ right: 18, top: '50%', marginTop: -5, color: ink.pull }}>
              <path d="M33 5H3M7 1L3 5l4 4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
        <span ref={peelRef} className="absolute top-0 bottom-0 block" aria-hidden
          style={{ transformOrigin: 'right center', visibility: 'hidden', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.3)) drop-shadow(0 8px 10px rgba(0,0,0,.28))' }}>
          <span className="absolute inset-0 block overflow-hidden">
            <span ref={backRef} style={{ ...face, right: 'auto', transform: 'scaleX(-1)', backgroundColor: backColor, backgroundImage: FIBER, backgroundSize: '160px 160px', backgroundPosition: '0 0', boxShadow: 'inset 0 0 14px rgba(10,20,28,.25)' }}>
              <span style={perf(true, true)} /><span style={perf(false, true)} />
            </span>
            <span className="absolute block" style={{ right: 0, top: 0, bottom: 0, width: 26, background: 'linear-gradient(to left, rgba(255,255,255,.28), rgba(255,255,255,.06) 6px, rgba(8,16,22,.22) 14px, rgba(8,16,22,0))' }} />
          </span>
        </span>
      </button>

      <p className="absolute left-0 right-0 m-0 text-center pointer-events-none"
        style={{ top: SEAM + BH / 2 + 18, zIndex: 6, fontSize: 11.5, color: ink.hint, opacity: hint && !opened ? 1 : 0, transition: 'opacity .6s' }}>
        띠의 오른쪽 끝을 왼쪽으로 당겨 뜯어보세요
      </p>
    </div>
  )
}
