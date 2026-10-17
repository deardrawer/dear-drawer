'use client'

// 트레이싱지: 흐린 사진 위로 트레이싱지 두 장이 위아래로 덮여 있고, 이름 테이프가 이음매를 붙잡고 있다.
// 테이프 오른쪽 끝을 왼쪽으로 당겨 떼면 종이가 휘며 위아래로 열리고, 꽉 찬 사진 아래쪽에 이름이 써진다.
// 종이가 휘는 효과는 얇은 띠 여러 장을 중첩해 각각 rotateX 하는 방식 (샘플과 동일).
import { useEffect, useRef, useState } from 'react'
import { type IntroStyleProps, cropOf, photoOf, str } from './shared'
import IntroPhoto from './IntroPhoto'
import RevealCaption from './RevealCaption'
import FitLine from './FitLine'

const IVORY = '#F4F1EA', INK = '#3D2F2A', INKSUB = '#7B6A60'
const SCRIPT = "'Pinyon Script', 'Snell Roundhand', cursive"
const SERIF = "'Noto Serif KR', 'Nanum Myeongjo', serif"
const FIBER = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.011 0.32' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.12'/></filter><rect width='100%25' height='100%25' filter='url(%23f)'/></svg>\")"
const TAG_NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.06'/></svg>\")"
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}
/** 찢은 종이 테두리 (이름 테이프) */
function torn(seed: number) {
  const r = rng(seed), p: [number, number][] = []
  for (let i = 0; i <= 12; i++) p.push([i * 100 / 12, r() * 2.2])
  for (let i = 1; i < 16; i++) p.push([96.6 + r() * 3.4, i * 100 / 16])
  for (let i = 12; i >= 0; i--) p.push([i * 100 / 12, 100 - r() * 2.2])
  for (let i = 15; i > 0; i--) p.push([r() * 3.4, i * 100 / 16])
  return 'polygon(' + p.map(q => `${q[0].toFixed(1)}% ${q[1].toFixed(1)}%`).join(',') + ')'
}
const CLIP = torn(19)
const dayMonthYear = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

type Leaf = { sl: HTMLElement[]; face: HTMLElement[]; lit: HTMLElement[]; cv: HTMLCanvasElement[]; ys: number[]; sign: 1 | -1; h: number }
type Api = { down: (e: React.PointerEvent) => void; move: (e: React.PointerEvent) => void; up: () => void; cancel: () => void; open: (fast: boolean) => void }

export default function VellumIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const instant = finished || reduced
  const photo = photoOf(opts, 'photo', data)
  const crop = cropOf(opts, 'photo')
  const cropKey = JSON.stringify(crop || {})
  const mono = str(opts.tone, 'color') === 'mono'

  const en = !!(data.groomEn && data.brideEn)
  // 테이프 스티커: 직접 쓴 큰 줄·작은 줄이 있으면 그대로, 없으면 이름·날짜 자동
  const tagMainText = str(opts.tagMain).trim(), tagSubText = str(opts.tagSub).trim()
  const tagScript = tagMainText ? !/[ㄱ-ㆎ가-힣]/.test(tagMainText) : en
  const tagMain = tagMainText || (en ? <>{data.groomEn} <span style={{ fontSize: '.82em', margin: '0 .06em' }}>&amp;</span> {data.brideEn}</> : `${data.groomName} & ${data.brideName}`)
  const tagCaps = tagSubText || [data.date ? dayMonthYear(data.date) : '', en ? '' : data.venue].filter(Boolean).join(' · ')
  const tagKr = !tagMainText && !tagSubText && en && data.groomName !== data.groomEn ? `${data.groomName} · ${data.brideName}` : ''

  const PH = h                                    // 사진은 화면 전체 (트레이싱지도 사진 전체를 덮는다)
  const S = Math.round(h * 0.44 + 20), OV = 16    // 이음매 위치, 위 장이 아래 장을 덮는 폭
  const seam = S + OV / 2
  const tagW = Math.min(w * 0.72, 292)

  const [open, setOpen] = useState(instant)
  const [hint, setHint] = useState(false)
  const trRef = useRef<HTMLDivElement>(null)
  const pTRef = useRef<HTMLDivElement>(null), pBRef = useRef<HTMLDivElement>(null)
  const cTRef = useRef<HTMLDivElement>(null), cBRef = useRef<HTMLDivElement>(null), ovsRef = useRef<HTMLDivElement>(null)
  const tapeRef = useRef<HTMLButtonElement>(null), stuckRef = useRef<HTMLSpanElement>(null)
  const peelRef = useRef<HTMLSpanElement>(null), backRef = useRef<HTMLSpanElement>(null)
  const api = useRef<Api | null>(null)
  const doneRef = useRef(instant)

  useEffect(() => {
    const tr = trRef.current, pT = pTRef.current, pB = pBRef.current, cT = cTRef.current, cB = cBRef.current, ovs = ovsRef.current
    const tape = tapeRef.current, stuck = stuckRef.current, peel = peelRef.current, back = backRef.current
    if (!tr || !pT || !pB || !cT || !cB || !ovs || !tape || !stuck || !peel || !back || w < 10) return
    const TW = w, TH = h
    let alive = true
    const timers: number[] = []
    let raf = 0, raf2 = 0
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(() => { if (alive) fn() }, ms)) }
    const finish = () => { if (!doneRef.current) { doneRef.current = true; onComplete() } }
    const hideSheets = () => { for (const el of [pT, pB, cT, cB, ovs]) el.style.visibility = 'hidden' }

    if (instant) {
      tape.style.visibility = 'hidden'; hideSheets()
      finish()
      return () => { alive = false }
    }

    // ── 종이 띠 만들기 (위 장: 위에서 아래로, 아래 장: 아래에서 위로 중첩)
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const build = (el: HTMLElement, top: boolean, len: number): Leaf => {
      el.innerHTML = ''
      const n = Math.max(8, Math.round(len / 22)), sh = len / n
      const L: Leaf = { sl: [], face: [], lit: [], cv: [], ys: [], sign: top ? 1 : -1, h: sh }
      let parent: HTMLElement = el
      const strip = (y: number, height: number, first: boolean, edge: boolean, lap: boolean) => {
        const sl = document.createElement('div')
        Object.assign(sl.style, {
          position: 'absolute', left: '0', right: '0', height: `${height}px`, transformStyle: 'preserve-3d', willChange: 'transform',
          top: first ? (top ? '0' : `${TH - height}px`) : (top ? '100%' : '-100%'), transformOrigin: top ? '50% 0' : '50% 100%',
        })
        const face = document.createElement('div')
        Object.assign(face.style, { position: 'absolute', left: '0', right: '0', top: '-.5px', height: 'calc(100% + 1px)', overflow: 'hidden', background: '#F1EEE8' })
        if (edge) face.style.boxShadow = top ? 'inset 0 -1px 0 rgba(95,80,65,.18), inset 0 -2px 0 rgba(255,255,255,.55)' : 'inset 0 1px 0 rgba(255,255,255,.85), inset 0 2px 0 rgba(95,80,65,.12)'
        const cv = document.createElement('canvas')
        cv.width = Math.round(TW * dpr); cv.height = Math.max(1, Math.round((height + 1) * dpr))
        Object.assign(cv.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', display: 'block', filter: mono ? 'grayscale(1)' : '' })
        const fiber = document.createElement('div')
        Object.assign(fiber.style, { position: 'absolute', inset: '0', backgroundImage: FIBER, backgroundSize: '300px 300px', backgroundPosition: `0 ${-y}px`, opacity: '.75' })
        const lit = document.createElement('i')
        Object.assign(lit.style, { position: 'absolute', inset: '0' })
        face.appendChild(cv); face.appendChild(fiber)
        if (lap) { const lp = document.createElement('div'); Object.assign(lp.style, { position: 'absolute', inset: '0', background: 'rgba(255,255,252,.2)' }); face.appendChild(lp) }
        face.appendChild(lit)
        sl.appendChild(face)
        parent.appendChild(sl)
        parent = sl
        L.sl.push(sl); L.face.push(face); L.lit.push(lit); L.cv.push(cv); L.ys.push(y)
      }
      for (let i = 0; i < n; i++) strip(top ? i * sh : TH - (i + 1) * sh, sh, i === 0, i === n - 1 && !top, false)
      if (top) strip(len, OV, false, true, true)
      return L
    }
    const LT = build(pT, true, S), LB = build(pB, false, TH - S)

    // ── 흐린 사진을 그린 종이 한 장 → 띠마다 제 몫을 나눠 그린다 (픽셀을 읽지 않아 다른 서버 사진도 된다)
    const paint = (img?: HTMLImageElement) => {
      const sheet = document.createElement('canvas')
      sheet.width = Math.round(TW * dpr); sheet.height = Math.round(TH * dpr)
      const g = sheet.getContext('2d')!
      g.scale(dpr, dpr)
      g.fillStyle = IVORY; g.fillRect(0, 0, TW, TH)
      g.fillStyle = '#cfcabd'; g.fillRect(0, 0, TW, PH)
      if (img && img.naturalWidth) {
        const c = JSON.parse(cropKey) as { cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }
        const sw = img.naturalWidth * (c.cropWidth ?? 1), shh = img.naturalHeight * (c.cropHeight ?? 1)
        const sx = img.naturalWidth * (c.cropX ?? 0), sy = img.naturalHeight * (c.cropY ?? 0)
        const small = document.createElement('canvas'); small.width = Math.max(8, Math.round(TW / 18)); small.height = Math.max(8, Math.round(PH / 18))
        const gs = small.getContext('2d')!; gs.imageSmoothingQuality = 'high'
        const k = Math.max(small.width / sw, small.height / shh) * 1.05
        gs.drawImage(img, sx, sy, sw, shh, (small.width - sw * k) / 2, (small.height - shh * k) / 2, sw * k, shh * k)
        const mid = document.createElement('canvas'); mid.width = Math.round(TW / 5); mid.height = Math.round(PH / 5)
        const gm = mid.getContext('2d')!; gm.imageSmoothingQuality = 'high'; gm.drawImage(small, 0, 0, mid.width, mid.height)
        g.imageSmoothingQuality = 'high'; g.drawImage(mid, 0, 0, TW, PH)
      }
      g.fillStyle = 'rgba(247,245,240,.5)'; g.fillRect(0, 0, TW, TH)
      for (const L of [LT, LB]) L.cv.forEach((cv, i) => {
        const cg = cv.getContext('2d')!
        const y = L.ys[i] - 0.5, hh = cv.height / dpr
        cg.drawImage(sheet, 0, Math.max(0, y * dpr), sheet.width, hh * dpr, 0, 0, cv.width, cv.height)
      })
    }
    paint()
    if (photo) { const im = new Image(); im.onload = () => { if (alive) paint(im) }; im.src = photo }

    // ── 종이 자세: 위 장은 빛 쪽으로 휘며 밝아지고, 아래 장은 반대로 어두워진다. 화면에 남은 길이를 돌려준다
    const pose = (L: Leaf, a: number, bt: number, op?: string) => {
      const n = L.sl.length
      let phi = a, ext = 0
      for (let i = 0; i < n; i++) {
        const b = i === 0 ? a : bt / n * (0.6 + 0.8 * i / (n - 1))
        if (i > 0) phi += b
        L.sl[i].style.transform = `rotateX(${(L.sign * b).toFixed(2)}deg)`
        const sn = Math.max(0, Math.sin(Math.min(180, phi) * Math.PI / 180))
        ext += L.h * Math.cos(phi * Math.PI / 180)
        L.lit[i].style.background = L.sign > 0 ? `rgba(255,253,248,${(0.03 + 0.36 * sn).toFixed(3)})` : `rgba(62,48,36,${(0.02 + 0.2 * sn).toFixed(3)})`
        if (op !== undefined) L.face[i].style.opacity = op
      }
      return Math.max(0, ext)
    }
    const cast = (eT: number, eB: number, o: number) => {
      cT.style.transform = `translateY(${eT.toFixed(1)}px)`
      cB.style.transform = `translateY(${(TH - eB - cB.offsetHeight).toFixed(1)}px)`
      cT.style.opacity = o.toFixed(3); cB.style.opacity = (o * 0.5).toFixed(3)
    }
    let curA = 0, curB = 0
    const gap = (p: number) => {
      curA = Math.min(1, p * 1.6) * 4; curB = p * 16
      ovs.style.opacity = (1 - Math.min(1, p * 1.5)).toFixed(3)
      cast(pose(LT, curA, curB), pose(LB, curA, curB), Math.min(1, p * 2) * 0.35)
    }

    // ── 테이프 떼기: 오른쪽 끝에서 k만큼 뒤집혀 접힌다
    const K0 = 12
    let k = K0, opened = false, touched = false, drag = false, moved = false, x0 = 0, ks = 0, last = 0, lastT = 0, v = 0
    const setK = (nk: number) => {
      const Lw = tape.offsetWidth
      k = Math.max(0, Math.min(Lw, nk))
      const cs = `inset(-16px ${k.toFixed(1)}px -16px -16px)`
      stuck.style.clipPath = cs; stuck.style.setProperty('-webkit-clip-path', cs)
      back.style.width = `${Lw}px`
      peel.style.left = `${(Lw - 2 * k).toFixed(1)}px`; peel.style.width = `${k.toFixed(1)}px`; peel.style.visibility = k < 1 ? 'hidden' : 'visible'
      const p = Math.max(0, (k - K0) / (Lw - K0))
      peel.style.transform = `translateY(${(-1 - p * 3).toFixed(2)}px) rotate(${(p * 2.4).toFixed(2)}deg)`
      if (!opened) gap(p)
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
      // 한 동작으로: 테이프가 끝까지 떼어지며 날아가는 사이 종이가 벌어진다
      tween(k, tape.offsetWidth, fast ? 520 : 780, fast ? outC : inOut)
      later(() => {
        ovs.style.transition = 'opacity .5s ease'; ovs.style.opacity = '0'
        tape.style.transition = 'transform .9s cubic-bezier(.33,0,.2,1), opacity .6s ease .2s'
        tape.style.transform = 'translateY(-50%) translate(-26px,-46px) rotate(-10deg)'; tape.style.opacity = '0'
        later(() => { tape.style.display = 'none' }, 1100)
      }, fast ? 240 : 460)
      later(() => {
        const t0 = performance.now(), D = fast ? 1900 : 2100, a0 = curA, b0 = curB
        let named = false
        const cl = (u: number) => Math.max(0, Math.min(1, u))
        const sweep = (u: number) => -(Math.cos(Math.PI * cl(u)) - 1) / 2
        const lead = (u: number) => Math.sin(cl(u * 1.25) * Math.PI / 2)
        const fade = (u: number) => { const q = cl((u - 0.55) / 0.45); return (1 - q * q * (3 - 2 * q)).toFixed(3) }
        const frame = (L: Leaf, u: number) => pose(L, a0 + (72 - a0) * sweep(u), b0 + (110 - b0) * lead(u), fade(u))
        const f = (now: number) => {
          if (!alive) return
          const u = (now - t0) / D, ub = u - 0.04
          cast(frame(LT, u), frame(LB, ub), (0.35 + 0.65 * cl(u * 3)) * Number(fade(u)))
          if (!named && u > 0.4) { named = true; setOpen(true) }
          if (ub < 1) raf2 = requestAnimationFrame(f)
          else { hideSheets(); later(finish, 900) }
        }
        raf2 = requestAnimationFrame(f)
      }, fast ? 300 : 540)
    }

    api.current = {
      open: doOpen,
      down: (e) => {
        if (opened) return
        touched = true; setHint(false); cancelAnimationFrame(raf)
        drag = true; moved = false; x0 = last = e.clientX; lastT = e.timeStamp; ks = k; v = 0
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
        if (k > tape.offsetWidth * 0.42 || v > 0.5) { doOpen(true); return }
        tween(k, K0, 320, outC)
      },
      cancel: () => { if (!drag) return; drag = false; tween(k, K0, 280, outC) },
    }

    setK(K0)
    // 손대지 않으면 테이프 끝을 살짝 들었다 놓아 떼는 곳을 알려준다
    later(() => { if (!touched && !opened) tween(K0, 44, 520, inOut, () => later(() => { if (!touched && !opened) tween(44, K0, 480, outC) }, 140)) }, 1700)
    later(() => { if (!touched && !opened) setHint(true) }, 2600)

    return () => { alive = false; timers.forEach(clearTimeout); cancelAnimationFrame(raf); cancelAnimationFrame(raf2); api.current = null }
  }, [w, h, photo, cropKey, instant, mono]) // eslint-disable-line react-hooks/exhaustive-deps

  // 건너뛰기·스크롤: 빠르게 연다
  useEffect(() => { if (signal > 0) api.current?.open(true) }, [signal])

  const tagPaper: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '13px 18px 14px',
    backgroundColor: '#F7F4EC', backgroundImage: TAG_NOISE, clipPath: CLIP, WebkitClipPath: CLIP,
  }
  const tagInner = (
    <>
      <span style={tagScript
        ? { fontFamily: SCRIPT, fontSize: Math.min(31, Math.max(25, w * 0.079)), lineHeight: 1.2, color: INK, whiteSpace: 'nowrap', padding: '0 .2em' }
        : { fontFamily: SERIF, fontSize: 17, lineHeight: 1.4, color: INK, whiteSpace: 'nowrap', letterSpacing: '.02em' }}><FitLine max={tagW - 40}>{tagMain}</FitLine></span>
      {tagCaps && <span style={{ fontFamily: SERIF, fontSize: 8, fontWeight: 500, letterSpacing: '.22em', textTransform: 'uppercase', color: INKSUB, paddingLeft: '.22em', whiteSpace: 'nowrap' }}>{tagCaps}</span>}
      {tagKr && <span style={{ fontFamily: SERIF, fontSize: 10.5, color: INKSUB, letterSpacing: '.04em', marginTop: 1 }}>{tagKr}</span>}
    </>
  )

  return (
    <div ref={trRef} className="absolute inset-0 overflow-hidden select-none" style={{ overflow: 'clip', background: IVORY, perspective: 1900, perspectiveOrigin: `50% ${seam}px` }}>
      {/* 사진: 화면 전체 */}
      <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfcabd' }}>
        <IntroPhoto src={photo} crop={crop} label="두 사람의 사진" className="absolute inset-0" style={mono ? { filter: 'grayscale(1) contrast(1.05)' } : undefined} />
      </div>
      <RevealCaption w={w} h={h} opts={opts} data={data} open={open} instant={instant} />

      {/* 트레이싱지 두 장 + 그림자 (띠는 효과에서 직접 만든다) */}
      <div ref={cTRef} className="absolute left-0 right-0 top-0 pointer-events-none" style={{ height: 54, zIndex: 1, opacity: 0, background: 'linear-gradient(rgba(48,36,26,.26), rgba(48,36,26,.08) 40%, rgba(48,36,26,0))' }} />
      <div ref={cBRef} className="absolute left-0 right-0 top-0 pointer-events-none" style={{ height: 22, zIndex: 1, opacity: 0, background: 'linear-gradient(rgba(48,36,26,0), rgba(48,36,26,.16))' }} />
      <div ref={pBRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, transformStyle: 'preserve-3d' }} />
      <div ref={ovsRef} className="absolute left-0 right-0 pointer-events-none" style={{ top: S + OV, height: 9, zIndex: 3, background: 'linear-gradient(rgba(60,46,34,.16), rgba(60,46,34,.05) 45%, rgba(60,46,34,0))' }} />
      <div ref={pTRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 4, transformStyle: 'preserve-3d' }} />

      {/* 이름 테이프 — 오른쪽 끝을 왼쪽으로 당겨 뗀다 */}
      <button ref={tapeRef} type="button" data-intro-gesture aria-label="이름 테이프를 떼어 트레이싱지 열기"
        className="absolute p-0 border-0 bg-transparent"
        style={{
          left: '50%', top: seam, width: tagW, marginLeft: -tagW / 2, zIndex: 5, touchAction: 'pan-y', cursor: 'grab',
          transform: 'translateY(-50%) rotate(-3.2deg)', filter: 'drop-shadow(0 1px 1.3px rgba(70,50,40,.22)) drop-shadow(0 3px 6px rgba(70,50,40,.08))',
          visibility: instant ? 'hidden' : 'visible',
        }}
        onPointerDown={(e) => api.current?.down(e)}
        onPointerMove={(e) => api.current?.move(e)}
        onPointerUp={() => api.current?.up()}
        onPointerCancel={() => api.current?.cancel()}>
        <span ref={stuckRef} className="block"><span style={tagPaper}>{tagInner}</span></span>
        <span ref={peelRef} className="absolute top-0 bottom-0 block" aria-hidden
          style={{ transformOrigin: 'right center', visibility: 'hidden', filter: 'drop-shadow(0 1.5px 1px rgba(60,45,35,.18)) drop-shadow(0 5px 7px rgba(60,45,35,.10))' }}>
          <span className="absolute inset-0 block overflow-hidden">
            <span ref={backRef} className="absolute top-0 left-0 h-full" style={{ ...tagPaper, boxSizing: 'border-box', transform: 'scaleX(-1)', backgroundColor: '#EAE6DD' }}>
              <span style={{ opacity: 0.22, display: 'contents' }}>{tagInner}</span>
            </span>
            <span className="absolute block" style={{ right: 0, top: '3%', bottom: '3%', width: 20, background: 'linear-gradient(to left, rgba(255,255,255,.9), rgba(255,255,255,.35) 5px, rgba(120,105,90,.10) 12px, rgba(120,105,90,0))' }} />
          </span>
        </span>
      </button>

      <p className="absolute left-0 right-0 m-0 text-center pointer-events-none"
        style={{ top: seam + 52, zIndex: 6, fontSize: 11.5, color: '#6f665c', opacity: hint && !open ? 0.9 : 0, transition: 'opacity .6s' }}>
        테이프 끝을 왼쪽으로 당겨 떼어보세요
      </p>
    </div>
  )
}

