'use client'

// 불투명 유리: 흐린 유리 위에 두 사람의 영문 이름이 손가락으로 쓴 듯 맑게 드러나고,
// 하객이 하트를 그리듯 문지르면 유리가 걷히며 사진이 드러난다.
import { useEffect, useRef, useState } from 'react'
import { type IntroStyleProps, cropOf, lines, photoOf } from './shared'
import IntroPhoto from './IntroPhoto'
import RevealCaption from './RevealCaption'

const COLS = 12, ROWS = 20, CLEAR_RATIO = 0.3
// 샘플과 같은 손글씨 글꼴
const GLASS_FONT = "'Pinyon Script', cursive"

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}

export default function FrostIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const photo = photoOf(opts, 'photo', data)
  const crop = cropOf(opts, 'photo')
  const cropKey = JSON.stringify(crop || {})
  // 유리에는 영문만 쓴다 (한글은 획이 뭉개져 읽기 어렵다): 직접 입력 > 영문 이름 > 기본 문구
  const custom = lines(opts.glass, '').map(l => l.replace(/[ㄱ-ㆎ가-힣]/g, '').replace(/\s{2,}/g, ' ').trim()).filter(Boolean).slice(0, 3)
  const glass = custom.length ? custom
    : data.groomEn && data.brideEn ? [`${data.groomEn} &`, data.brideEn]
    : data.noWedding ? ['With', 'Love'] : ['Our', 'Wedding Day']
  const text = glass.join(' ')
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [cleared, setCleared] = useState(finished || reduced)
  const [hint, setHint] = useState(false)
  const seen = useRef<boolean[]>(new Array(COLS * ROWS).fill(false))
  const done = useRef(cleared)
  const brush = useRef<HTMLCanvasElement | null>(null)

  const finish = () => {
    if (done.current) return
    done.current = true
    setCleared(true)
    onComplete()
  }
  useEffect(() => { if (finished || reduced) onComplete() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 유리 그리기: 흐린 사진 + 뿌연 막 + 얼룩, 그 위에 이름이 맑게 써진다
  useEffect(() => {
    const cv = cvRef.current
    if (!cv || done.current) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    const g = cv.getContext('2d')
    if (!g) return
    g.scale(dpr, dpr)
    let cancelled = false
    const timers: number[] = []

    const b = document.createElement('canvas'); b.width = b.height = 88
    const bg = b.getContext('2d')!
    const rg = bg.createRadialGradient(44, 44, 0, 44, 44, 44)
    rg.addColorStop(0, 'rgba(0,0,0,.95)'); rg.addColorStop(.55, 'rgba(0,0,0,.7)'); rg.addColorStop(1, 'rgba(0,0,0,0)')
    bg.fillStyle = rg; bg.fillRect(0, 0, 88, 88)
    brush.current = b

    const paintFog = (img?: HTMLImageElement) => {
      g.clearRect(0, 0, w, h)
      if (img && img.naturalWidth) {
        // 작은 캔버스로 줄였다가 키워 흐림을 만든다 (교차 출처 사진도 가능)
        const sw = Math.max(8, Math.round(w / 16)), sh = Math.max(8, Math.round(h / 16))
        const s = document.createElement('canvas'); s.width = sw; s.height = sh
        const sg = s.getContext('2d')!
        const c = JSON.parse(cropKey) as { cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }
        const srcW = img.naturalWidth * (c.cropWidth ?? 1), srcH = img.naturalHeight * (c.cropHeight ?? 1)
        const srcX = img.naturalWidth * (c.cropX ?? 0), srcY = img.naturalHeight * (c.cropY ?? 0)
        const k = Math.max(sw / srcW, sh / srcH)
        sg.drawImage(img, srcX, srcY, srcW, srcH, (sw - srcW * k) / 2, (sh - srcH * k) / 2, srcW * k, srcH * k)
        g.imageSmoothingQuality = 'high'
        g.drawImage(s, 0, 0, w, h)
      } else {
        g.fillStyle = '#c9cdd0'; g.fillRect(0, 0, w, h)
      }
      g.fillStyle = 'rgba(228,231,233,.5)'; g.fillRect(0, 0, w, h)
      const mg = g.createLinearGradient(0, 0, 0, h)
      mg.addColorStop(0, 'rgba(238,240,242,.1)'); mg.addColorStop(1, 'rgba(238,240,242,.36)')
      g.fillStyle = mg; g.fillRect(0, 0, w, h)
      const r = rng(31), cl = document.createElement('canvas'); cl.width = 14; cl.height = 24
      const cg = cl.getContext('2d')!, cd = cg.createImageData(14, 24)
      for (let i = 0; i < cd.data.length; i += 4) { cd.data[i] = cd.data[i + 1] = cd.data[i + 2] = 244; cd.data[i + 3] = Math.round(r() * 120) }
      cg.putImageData(cd, 0, 0)
      g.imageSmoothingQuality = 'high'; g.drawImage(cl, 0, 0, w, h)
    }

    const writeNames = () => {
      // 샘플 크기(폭의 18%, 3줄이면 16%) — 줄이 길면 화면 안에 들어오도록 줄인다
      let fs = Math.round(w * (glass.length > 2 ? 0.16 : 0.18))
      g.font = `${fs}px ${GLASS_FONT}`
      const widest = Math.max(...glass.map(t => g.measureText(t).width))
      if (widest > w * 0.84) fs = Math.floor(fs * (w * 0.84) / widest)
      fs = Math.max(26, fs)   // 작은 화면에서도 읽히는 하한
      // 줄마다 들여쓰기를 달리해 손으로 쓴 느낌을 낸다
      const single = glass.filter(Boolean).length === 1
      const rows = glass.map((t, i) => [t, w * [0.08, 0.26, 0.15][i]] as const)
      const t0 = performance.now(), D = 2400
      let prevX = 0
      const draw = (now: number) => {
        if (cancelled || done.current) return
        const u = Math.max(0, Math.min(1, (now - t0) / D))
        // 새로 드러날 띠만 지운다 (같은 자리를 반복해 지우면 획이 점점 뭉개진다)
        const x1 = Math.ceil(w * u)
        g.save()
        g.beginPath(); g.rect(prevX, 0, x1 - prevX, h); g.clip()
        prevX = x1
        g.globalCompositeOperation = 'destination-out'
        g.font = `${fs}px ${GLASS_FONT}`; g.lineWidth = Math.max(1.6, fs * 0.063); g.lineJoin = 'round'
        g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = Math.max(1.2, fs * 0.045)
        rows.forEach(([t, x], i) => { const tw = g.measureText(t).width; const x2 = single ? (w - tw) / 2 : Math.max(w * 0.04, Math.min(x, w - tw - w * 0.04)); const y = h * 0.3 + i * fs * 1.05; g.fillText(t, x2, y); g.strokeText(t, x2, y) })
        g.restore()
        if (u < 1) requestAnimationFrame(draw)
      }
      requestAnimationFrame(draw)
    }

    const start = (img?: HTMLImageElement) => {
      if (cancelled) return
      paintFog(img)
      const go = () => { if (!cancelled) timers.push(window.setTimeout(writeNames, 500)) }
      if (document.fonts?.load) document.fonts.load(`40px ${GLASS_FONT}`).then(go, go)
      else go()
      timers.push(window.setTimeout(() => setHint(true), 3400))
    }
    if (photo) {
      const img = new Image()
      img.onload = () => start(img)
      img.onerror = () => start()
      img.src = photo
    } else start()

    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [w, h, photo, text, cropKey])

  const rub = (a: [number, number], c: [number, number]) => {
    const cv = cvRef.current, b = brush.current
    const g = cv?.getContext('2d')
    if (!g || !b || done.current) return
    g.globalCompositeOperation = 'destination-out'
    const n = Math.max(1, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 6))
    for (let k = 0; k <= n; k++) {
      const x = a[0] + (c[0] - a[0]) * k / n, y = a[1] + (c[1] - a[1]) * k / n
      g.drawImage(b, x - 44, y - 44)
      // 지나간 칸 기록 (픽셀을 읽지 않아 교차 출처 사진에서도 동작)
      const cx = Math.floor(x / w * COLS), cy = Math.floor(y / h * ROWS)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = cx + dx, Y = cy + dy
        if (X >= 0 && Y >= 0 && X < COLS && Y < ROWS) seen.current[Y * COLS + X] = true
      }
    }
    g.globalCompositeOperation = 'source-over'
  }
  const ratio = () => seen.current.filter(Boolean).length / seen.current.length

  const autoWipe = () => {
    const pts: [number, number][] = []
    for (let k = 0; k <= 5; k++) pts.push([k % 2 ? w * 0.9 : w * 0.1, h * (0.15 + k * 0.15)])
    const t0 = performance.now(), D = 1300
    let prev: [number, number] | null = null
    const step = (now: number) => {
      const u = Math.max(0, Math.min(1, (now - t0) / D)), s = u * (pts.length - 1), a = Math.floor(Math.min(s, pts.length - 2)), f = s - a
      const p: [number, number] = [pts[a][0] + (pts[a + 1][0] - pts[a][0]) * f, pts[a][1] + (pts[a + 1][1] - pts[a][1]) * f]
      if (prev) for (let o = -1; o <= 1; o++) rub([prev[0], prev[1] + o * 22], [p[0], p[1] + o * 22])
      prev = p
      if (u < 1) requestAnimationFrame(step); else finish()
    }
    requestAnimationFrame(step)
  }

  useEffect(() => { if (signal > 0 && !done.current) autoWipe() }, [signal]) // eslint-disable-line react-hooks/exhaustive-deps

  const last = useRef<[number, number] | null>(null)
  const moved = useRef(false)
  const pos = (e: React.PointerEvent): [number, number] => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  return (
    <div className="absolute inset-0 bg-[#c9cdd0]">
      {photo && <IntroPhoto src={photo} crop={crop} className="absolute inset-0" />}
      <canvas ref={cvRef} data-intro-gesture className="absolute inset-0 w-full h-full"
        style={{ opacity: cleared ? 0 : 1, transition: finished || reduced ? 'none' : 'opacity 1.5s ease', touchAction: 'none' }}
        onPointerDown={(e) => { if (done.current) return; setHint(false); last.current = pos(e); moved.current = false; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId) }}
        onPointerMove={(e) => {
          if (!last.current || done.current) return
          const p = pos(e)
          if (Math.hypot(p[0] - last.current[0], p[1] - last.current[1]) > 4) moved.current = true
          rub(last.current, p); last.current = p
        }}
        onPointerUp={() => {
          if (!last.current) return
          last.current = null
          if (done.current) return
          if (!moved.current) autoWipe()
          else if (ratio() > CLEAR_RATIO) finish()
        }}
      />
      <p className="absolute left-0 right-0 m-0 text-center pointer-events-none"
        style={{ bottom: 40, fontSize: 12, color: '#2f2b27', opacity: hint && !cleared ? 0.85 : 0, transition: 'opacity .6s' }}>
        손가락으로 하트를 그려주세요
      </p>
      {/* 유리가 걷힌 뒤: 공용 '열린 뒤 사진 위 문구' */}
      <RevealCaption w={w} h={h} opts={opts} data={data} open={cleared} instant={finished || reduced} />
    </div>
  )
}
