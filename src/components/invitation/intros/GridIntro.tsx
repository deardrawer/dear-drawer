'use client'

// 그리드 포스터 (플립): 흐린 흑백 사진 위 흰 격자에 문장이 채워진다 — 글자 칸은 플립 시계처럼
// 윗부분이 아래로 천천히 접히며 빈 칸에서 제 글자로 넘어간다. 다 채워지면 흐림이 걷히고,
// 칸들이 왼쪽 위부터 느린 대각선 물결로 같은 방식으로 플립되며(글자 칸 포함) 선명한 컬러 사진 조각으로 바뀐다.
// 끝에는 선 없는 컬러 사진만 남고, 위아래 글씨(날짜·이름·장소)가 천천히 나타난다.
// 분위기: 버블검 핑크 배경 + 인쇄물 같은 필름 그레인 (에디토리얼 포스터)
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { type IntroStyleProps, type PhotoCrop, coupleNames, cropOf, dateDots, hasHangul, isDark, photoOf, str, tint, weekdayEn } from './shared'
import IntroPhoto from './IntroPhoto'

const C = 10
const LINE = 'rgba(255,255,255,.75)' // 격자
const TILE_LINE = 'rgba(255,255,255,.9)' // 글자 칸 테두리
const LETTER_STEP = 520 // 글자 칸이 빈 칸 → 제 글자로 넘어가는 시간(ms) — 천천히 한 번만
const LETTER_SPINS = 0 // 제 글자 전에 거치는 글자 수 (0 = 바로 제 글자 · 차분하게)
const LETTER_FADE = 240 // 빈 칸이 떠오르는 시간(ms)
const LETTER_GAP = 150 // 같은 단어 안 다음 글자가 시작되기까지(ms)
const WORD_GAP = 520 // 다음 단어가 시작되기까지(ms)
const FLIP_STEP = 70 // 끝 플립: 대각선 한 칸마다 늦어지는 시간(ms)
const FLIP_DUR = 820 // 끝 플립: 한 칸이 넘어가는 시간(ms)
// 필름 그레인 (인쇄물 느낌) — 고정 노이즈 한 장
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`

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

// 제 글자에 멈추기 전에 거칠 글자들 (같은 종류 — 영문 대·소문자 / 한글 / 기타)
const HANGUL = '가나다라마바사아자차카타파하'
function spinChars(ch: string, seed: number): string[] {
  const pool = hasHangul(ch) ? HANGUL : /[A-Z]/.test(ch) ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : /[a-z]/.test(ch) ? 'abcdefghijklmnopqrstuvwxyz' : '0123456789'
  const out: string[] = []
  let s = (seed * 2654435761) >>> 0
  for (let k = 0; k < LETTER_SPINS; k++) { s = (s * 1103515245 + 12345) >>> 0; out.push(pool[s % pool.length]) }
  return ['', ...out, ch]
}

// 사진을 박스(W×H)에 그렸을 때의 실제 크기·위치(px) — IntroPhoto(CroppedImageDiv)와 같은 계산.
// 칸마다 사진 조각을 같은 자리로 잘라 붙이기 위해 필요
type Geom = { w: number; h: number; x: number; y: number }
function geomOf(iw: number, ih: number, W: number, H: number, crop?: PhotoCrop): Geom {
  const cw = crop?.cropWidth ?? 1, chh = crop?.cropHeight ?? 1
  if (crop && crop.cropWidth !== undefined && crop.cropHeight !== undefined && (cw < 1 || chh < 1)) {
    const cx = crop.cropX ?? 0, cy = crop.cropY ?? 0
    const k = Math.max(W / (cw * iw), H / (chh * ih))
    const w = iw * k, h = ih * k
    return { w, h, x: -(cx * w + (cw * w - W) / 2), y: -(cy * h + (chh * h - H) / 2) }
  }
  const s = crop?.scale || 1
  let w: number, h: number
  if (s > 1) { w = s * W; h = w * ih / iw } else { const k = Math.max(W / iw, H / ih); w = iw * k; h = ih * k }
  const px = 50 - (crop?.positionX || 0), py = 50 - (crop?.positionY || 0)
  return { w, h, x: (W - w) * px / 100, y: (H - h) * py / 100 }
}
function usePhotoGeom(src: string, crop: PhotoCrop | undefined, W: number, H: number): Geom | null {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    if (!src) return
    let alive = true
    const im = new Image()
    im.onload = () => { if (alive) setNat({ w: im.naturalWidth, h: im.naturalHeight }) }
    im.src = src
    return () => { alive = false }
  }, [src])
  return useMemo(() => (nat ? geomOf(nat.w, nat.h, W, H, crop) : null), [nat, W, H, crop])
}

// 흑백 사진을 박스 크기 그대로 한 번만 만들어 둔다 (CSS grayscale(1) contrast(1.1) 와 같은 계산)
// 칸 100여 개에 각각 CSS 필터를 걸면 플립 중 버벅이므로, 미리 만든 흑백 사진을 조각으로 나눠 쓴다.
// 다른 도메인 사진 등으로 만들 수 없으면 null → 그때만 CSS 필터로 대신함
function useGrayPhoto(src: string, geom: Geom | null, W: number, H: number, startAfter: number): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!src || !geom) return
    let alive = true
    let obj: string | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    const im = new Image()
    const run = () => {
      try {
        const k = Math.min(1.5, window.devicePixelRatio || 1)
        const cv = document.createElement('canvas')
        cv.width = Math.round(W * k); cv.height = Math.round(H * k)
        const ctx = cv.getContext('2d')
        if (!ctx) return
        ctx.drawImage(im, geom.x * k, geom.y * k, geom.w * k, geom.h * k)
        const rows = 48
        let y = 0
        const step = () => {
          if (!alive) return
          try {
            const hgt = Math.min(rows, cv.height - y)
            const d = ctx.getImageData(0, y, cv.width, hgt)
            const a = d.data
            for (let n = 0; n < a.length; n += 4) {
              let v = 0.2126 * a[n] + 0.7152 * a[n + 1] + 0.0722 * a[n + 2]
              v = (v - 127.5) * 1.1 + 127.5
              v = v < 0 ? 0 : v > 255 ? 255 : v
              a[n] = a[n + 1] = a[n + 2] = v
            }
            ctx.putImageData(d, 0, y)
            y += hgt
            if (y < cv.height) { timer = setTimeout(step, 16); return }
            cv.toBlob(b => { if (!alive || !b) return; obj = URL.createObjectURL(b); setUrl(obj) }, 'image/jpeg', 0.9)
          } catch { /* 다른 도메인 사진(캔버스 사용 불가) → CSS 필터로 */ }
        }
        step()
      } catch { /* 위와 같음 */ }
    }
    im.onload = () => {
      timer = setTimeout(() => {
        // 사진 해석을 화면 밖에서 먼저 끝내 두고 그린다 (그릴 때 멈춤 방지)
        const ready = typeof im.decode === 'function' ? im.decode().catch(() => {}) : Promise.resolve()
        ready.then(() => { if (alive) run() })
      }, startAfter)
    }
    im.src = src
    return () => { alive = false; if (timer) clearTimeout(timer); if (obj) URL.revokeObjectURL(obj) }
  }, [src, geom, W, H, startAfter])
  return url
}

// 반쪽(위·아래) — 칸 크기(cs)의 면을 위/아래 절반만 보이게 자른다
function Half({ part, cs, style, children }: { part: 'top' | 'bottom'; cs: number; style?: React.CSSProperties; children: React.ReactNode }) {
  const hh = cs / 2
  return (
    <div style={{ position: 'absolute', left: 0, top: part === 'top' ? 0 : hh, width: cs, height: hh, overflow: 'hidden', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', ...style }}>
      <div style={{ position: 'absolute', left: 0, top: part === 'top' ? 0 : -hh, width: cs, height: cs }}>{children}</div>
    </div>
  )
}

// 플립 한 번: 이전 면(prev)의 윗부분이 아래로 접히고(앞 절반), 다음 면(next)의 아랫부분이 내려와 덮는다(뒤 절반)
// paused 동안은 시작 전 모습(이전 면) 그대로 — 미리 그려 두었다가 한꺼번에 시작할 때
function Flap({ prev, next, cs, dur, delay = 0, paused = false, nextTopBelow = false }: { prev: React.ReactNode; next: React.ReactNode; cs: number; dur: number; delay?: number; paused?: boolean; nextTopBelow?: boolean }) {
  // 끝 플립(nextTopBelow)에선 다 넘어간 순간 아래 남은 이전 면을 지운다 (가장자리 틈으로 비치지 않게)
  const hideBelow: React.CSSProperties | undefined = nextTopBelow
    ? { animation: `ddFlapHide 1ms linear ${delay + dur}ms both`, animationPlayState: paused ? 'paused' : 'running' }
    : undefined
  const play = paused ? 'paused' : 'running'
  return (
    <>
      {!nextTopBelow && <Half part="top" cs={cs}>{next}</Half>}
      <Half part="bottom" cs={cs} style={hideBelow}>{prev}</Half>
      <Half part="top" cs={cs} style={{ transformOrigin: '50% 100%', animation: `ddFlapTop ${dur / 2}ms cubic-bezier(.5,0,.75,.4) ${delay}ms both`, animationPlayState: play }}>{prev}</Half>
      <Half part="bottom" cs={cs} style={{ transformOrigin: '50% 0%', animation: `ddFlapBot ${dur / 2}ms cubic-bezier(.2,.6,.35,1) ${delay + dur / 2}ms both`, animationPlayState: play }}>{next}</Half>
    </>
  )
}

// 글자 칸: 빈 칸 → 몇 글자 → 제 글자 로 탁탁 넘어간다
function LetterFlip({ chars, cs, face }: { chars: string[]; cs: number; face: (ch: string) => React.ReactNode }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (i >= chars.length - 1) return
    const t = setTimeout(() => setI(n => n + 1), i === 0 ? LETTER_FADE : LETTER_STEP)
    return () => clearTimeout(t)
  }, [i, chars.length])
  // 빈 칸은 살짝 떠오르듯 나타난 뒤 넘어감
  if (i === 0) return <div className="absolute inset-0" style={{ animation: `ddFlapFade ${LETTER_FADE}ms ease-out both` }}>{face(chars[0])}</div>
  return <Flap key={i} prev={face(chars[i - 1])} next={face(chars[i])} cs={cs} dur={LETTER_STEP} />
}

export default function GridIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  const phrase = str(opts.phrase, 'We are getting married')
  const accent = str(opts.accentColor, '#F190AC')
  const photo = photoOf(opts, 'photo', data)
  const crop = cropOf(opts, 'photo')

  const cell = Math.floor((w - 32) / C)
  const cs = cell + 1
  const R = Math.max(8, Math.min(16, Math.floor((h - 200) / cell)))
  const gw = cell * C, gh = cell * R
  const cells = useMemo(() => layout(phrase, R), [phrase, R])
  const letterAt = useMemo(() => {
    const m = new Map<string, string>()
    cells.forEach(c => m.set(`${c.r}-${c.c}`, c.ch))
    return m
  }, [cells])
  const geom = usePhotoGeom(photo, crop, gw + 1, gh + 1)
  // 격자가 다 덮인 뒤 첫 글자 전(약 0.9초)부터 흑백 사진을 잘게 나눠 만든다 — 시작 애니메이션과 겹치지 않게
  const grayUrl = useGrayPhoto(photo, geom, gw + 1, gh + 1, finished || reduced ? 0 : 900)

  // 단계: 글자 채움 → sharp(흐림 걷힘, 아직 흑백 · 끝 플립 칸 미리 준비) → flip(칸 플립) → over(플립 끝 · 칸 치움)
  // instant(재방문·모션 줄이기·건너뛰기): 바로 끝 모습(선 없는 컬러 사진)
  const [skipped, setSkipped] = useState(false)
  const instant = finished || reduced || skipped
  const [shown, setShown] = useState(0)
  const [ready, setReady] = useState(false)
  const [prep, setPrep] = useState(false) // 끝 플립 칸 미리 그리기 (마지막 글자가 멈춘 직후 — 움직임 없는 순간이라 준비 끊김이 안 보임)
  const [prepRows, setPrepRows] = useState(0) // 준비된 줄 수 (한 번에 모두 — 나눠 그리면 오히려 매번 전체가 다시 계산돼 더 느림)
  const [sharp, setSharp] = useState(false)
  const [flip, setFlip] = useState(false)
  const [over, setOver] = useState(false)
  const completed = useRef(false)

  useEffect(() => { if (!instant) { const t = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(t) } }, [instant])

  // 한 단어씩 저절로 채운다 (단어 안에서는 한 글자씩 — 각 칸은 탁탁 넘어가며 제 글자에 멈춤)
  useEffect(() => {
    if (instant || !ready || shown >= cells.length) return
    const first = shown === 0
    const newWord = !first && cells[shown].w !== cells[shown - 1].w
    const t = setTimeout(() => setShown(n => n + 1), first ? 1300 : newWord ? WORD_GAP : LETTER_GAP)
    return () => clearTimeout(t)
  }, [instant, ready, shown, cells])

  // 마지막 글자가 멈춘 뒤 흐림을 걷고(흑백 유지) → 잠시 뒤 칸 플립 시작 → 다 넘어가면 칸 치움
  const letterTime = LETTER_FADE + LETTER_SPINS * LETTER_STEP + LETTER_STEP
  useEffect(() => {
    if (instant || !ready || shown < cells.length || prep) return
    const t = setTimeout(() => setPrep(true), letterTime)
    return () => clearTimeout(t)
  }, [instant, ready, shown, cells.length, prep, letterTime])
  useEffect(() => {
    if (instant || !prep || prepRows >= R) return
    const t = requestAnimationFrame(() => setPrepRows(R))
    return () => cancelAnimationFrame(t)
  }, [instant, prep, prepRows, R])
  useEffect(() => {
    if (instant || !prep || prepRows < R || sharp) return
    const t = setTimeout(() => setSharp(true), 250)
    return () => clearTimeout(t)
  }, [instant, prep, prepRows, R, sharp])
  useEffect(() => {
    if (instant || !sharp || flip) return
    const t = setTimeout(() => setFlip(true), 750)
    return () => clearTimeout(t)
  }, [instant, sharp, flip])
  const flipTotal = (R - 1 + C - 1) * FLIP_STEP + FLIP_DUR
  useEffect(() => {
    if (instant || !flip || over) return
    const t = setTimeout(() => setOver(true), flipTotal + 80)
    return () => clearTimeout(t)
  }, [instant, flip, over, flipTotal])

  // 끝 알림: 바로 끝 모습이면 즉시, 아니면 플립이 끝난 뒤 사진을 잠시 보여주고
  useEffect(() => {
    if (completed.current || (!instant && !over)) return
    const t = setTimeout(() => { completed.current = true; onComplete() }, instant ? 0 : 1500)
    return () => clearTimeout(t)
  }, [instant, over]) // eslint-disable-line react-hooks/exhaustive-deps

  const [seenSignal, setSeenSignal] = useState(signal)
  if (signal !== seenSignal) { setSeenSignal(signal); setSkipped(true) }

  const paper = str(opts.bgColor, tint(accent, 0.26))
  const names = str(opts.names, coupleNames(data, ' and '))
  const caps: React.CSSProperties = { fontFamily: "'Inter', sans-serif", fontStyle: 'italic', fontWeight: 300, fontSize: 12.5, lineHeight: 1.25, letterSpacing: '.01em', color: isDark(paper) ? '#F4F1EC' : '#2A1E22' }
  const nextIdx = shown < cells.length ? shown : -1
  // 위아래 글씨는 컬러 사진이 드러난 뒤에 (처음엔 사진·글자 칸에만 집중)
  const capsShown = instant || over
  const capsReveal: React.CSSProperties = { opacity: capsShown ? 1 : 0, transition: instant ? 'none' : 'opacity 1.1s ease' }

  // 면(face) — 칸 크기 그대로의 그림. 플립 때 위·아래 절반으로 잘려 쓰인다
  const tileFace = (ch: string) => (
    <div className="absolute inset-0 flex items-center justify-center"
      style={{
        background: accent, boxShadow: `inset 0 0 0 1px ${TILE_LINE}`,
        fontFamily: hasHangul(ch) ? "'Noto Sans KR', sans-serif" : "'Inter', sans-serif", fontWeight: hasHangul(ch) ? 500 : 400,
        fontSize: cell * (hasHangul(ch) ? 0.58 : 0.74), lineHeight: 1, color: '#141414',
      }}>
      {ch}
      {/* 플립 칸 가운데 이음선 */}
      <span className="absolute left-0 right-0" style={{ top: '50%', height: 1, marginTop: -0.5, background: 'rgba(20,20,20,.14)' }} />
    </div>
  )
  const pieceStyle = (r: number, c: number): React.CSSProperties => geom
    ? { backgroundImage: `url(${photo})`, backgroundRepeat: 'no-repeat', backgroundSize: `${geom.w}px ${geom.h}px`, backgroundPosition: `${geom.x - c * cell}px ${geom.y - r * cell}px` }
    : { background: '#9a9a9a' }
  const colorFace = (r: number, c: number) => <div className="absolute inset-0" style={pieceStyle(r, c)} />

  // 끝 플립 칸들 — 마지막 글자가 멈춘 직후(prep)부터 멈춘 채로 미리 그려 두고(위 흑백 층에 가려짐), flip 때 위 층을 치우고 한꺼번에 시작
  //   사진 칸은 [위 흑백 반쪽(접힘) · 아래 흑백 반쪽(고정) · 아래 컬러 반쪽(내려옴)] 한 겹짜리 조각 3개 — 위 컬러 반쪽은 바로 아래 컬러 사진이 대신함
  const hh = cs / 2
  const half = (r: number, c: number, bottom: boolean, gray: boolean): React.CSSProperties => {
    const ox = -c * cell, oy = -(r * cell + (bottom ? hh : 0))
    if (gray && grayUrl) return { backgroundImage: `url(${grayUrl})`, backgroundRepeat: 'no-repeat', backgroundSize: `${gw + 1}px ${gh + 1}px`, backgroundPosition: `${ox}px ${oy}px` }
    const base: React.CSSProperties = geom
      ? { backgroundImage: `url(${photo})`, backgroundRepeat: 'no-repeat', backgroundSize: `${geom.w}px ${geom.h}px`, backgroundPosition: `${geom.x + ox}px ${geom.y + oy}px` }
      : { background: '#9a9a9a' }
    return gray ? { ...base, filter: 'grayscale(1) contrast(1.1)' } : base
  }
  const play = flip ? 'running' : 'paused'
  const endFlaps = !instant && prep && !over
    ? Array.from({ length: Math.min(prepRows, R) * C }, (_, i) => {
        const r = Math.floor(i / C), c = i % C
        const ch = letterAt.get(`${r}-${c}`)
        const delay = (r + c) * FLIP_STEP
        if (ch) {
          return (
            <div key={i} className="absolute" style={{ left: c * cell, top: r * cell, width: cs, height: cs }}>
              <Flap prev={tileFace(ch)} next={colorFace(r, c)} cs={cs} dur={FLIP_DUR} delay={delay} paused={!flip} nextTopBelow />
            </div>
          )
        }
        const right = c === C - 1 ? `,inset -1px 0 0 ${LINE}` : ''
        const bottomEdge = r === R - 1 ? `,inset 0 -1px 0 ${LINE}` : ''
        const pos = { position: 'absolute' as const, left: c * cell, width: cs, height: hh, backfaceVisibility: 'hidden' as const, WebkitBackfaceVisibility: 'hidden' as const }
        return (
          <Fragment key={i}>
            <div style={{ ...pos, top: r * cell + hh, ...half(r, c, true, true), boxShadow: `inset 1px 0 0 ${LINE}${right}${bottomEdge}`, animation: `ddFlapHide 1ms linear ${delay + FLIP_DUR}ms both`, animationPlayState: play }} />
            <div style={{ ...pos, top: r * cell, ...half(r, c, false, true), boxShadow: `inset 1px 1px 0 ${LINE}${right}`, transformOrigin: '50% 100%', willChange: 'transform', animation: `ddFlapTop ${FLIP_DUR / 2}ms cubic-bezier(.5,0,.75,.4) ${delay}ms both`, animationPlayState: play }} />
            <div style={{ ...pos, top: r * cell + hh, ...half(r, c, true, false), transformOrigin: '50% 0%', willChange: 'transform', animation: `ddFlapBot ${FLIP_DUR / 2}ms cubic-bezier(.2,.6,.35,1) ${delay + FLIP_DUR / 2}ms both`, animationPlayState: play }} />
          </Fragment>
        )
      })
    : null

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: paper }}>
      <div style={{ width: gw + 1 }}>
        <div className="flex justify-between items-end" style={{ ...caps, marginBottom: 8, ...capsReveal }}>
          <span><small style={{ display: 'block', fontSize: 8.5, fontStyle: 'normal', marginBottom: 3 }}>{dateDots(data.date)}</small>{str(opts.title, 'Our Wedding')}</span>
          <span className="text-right">{names}</span>
        </div>
        <div className="relative overflow-hidden" style={{ width: gw + 1, height: gh + 1, background: '#9a9a9a' }}>
          {/* 맨 아래: 선명한 컬러 사진 (끝 모습) */}
          {photo && <IntroPhoto src={photo} crop={crop} className="absolute inset-0" />}
          {endFlaps}
          {/* 글자를 채우는 동안: 흐린 흑백 사진 + 흰 격자 + 글자 칸
              흐림이 걷힐 때(sharp)는 이 층 전체를 투명하게 → 아래 미리 그려 둔 또렷한 흑백 칸(같은 격자·글자)이 드러남 (필터 애니메이션 없이 가볍게) */}
          {!instant && !flip && (
            <div className="absolute inset-0" style={{ opacity: sharp ? 0 : 1, transition: 'opacity .9s ease', willChange: 'opacity' }}>
              {photo && <IntroPhoto src={photo} crop={crop} className="absolute inset-0" style={{ filter: 'grayscale(1) blur(7px) contrast(1.1)' }} />}
              <div className="absolute inset-0"
                style={{
                  boxShadow: `inset -1px -1px 0 ${LINE}`,
                  backgroundImage: `linear-gradient(to right,${LINE} 1px,transparent 1px),linear-gradient(to bottom,${LINE} 1px,transparent 1px)`,
                  backgroundSize: `${cell}px ${cell}px`, clipPath: ready ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
                  transition: 'clip-path .95s cubic-bezier(.6,0,.2,1)',
                }} />
              {cells.slice(0, shown).map((c, i) => (
                <div key={i} className="absolute" style={{ left: c.c * cell, top: c.r * cell, width: cs, height: cs }}>
                  <LetterFlip chars={spinChars(c.ch, i + 1)} cs={cs} face={tileFace} />
                </div>
              ))}
              {nextIdx >= 0 && ready && (
                <span className="absolute dd-grid-cursor" style={{ left: cells[nextIdx].c * cell, top: cells[nextIdx].r * cell, width: cs, height: cs, boxShadow: `inset 0 0 0 1px ${TILE_LINE}, inset 0 0 0 3px ${accent}` }} />
              )}
            </div>
          )}
        </div>
        <div className="flex justify-between" style={{ ...caps, marginTop: 9, ...capsReveal }}>
          <span>{data.venue}</span>
          <span>{[weekdayEn(data.date), data.timeDisplay].filter(Boolean).join(', ')}</span>
        </div>
      </div>
      {/* 필름 그레인 — 배경·사진 전체를 인쇄물처럼 */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.16, mixBlendMode: 'multiply' }} />
      <style jsx>{`
        .dd-grid-cursor { animation: ddGridBlink 1.05s steps(1, end) infinite; }
        @keyframes ddGridBlink { 0% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
      <style jsx global>{`
        @keyframes ddFlapTop { from { transform: perspective(260px) rotateX(0deg); } to { transform: perspective(260px) rotateX(-90deg); } }
        @keyframes ddFlapFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ddFlapHide { from { opacity: 1; } to { opacity: 0; } }
        @keyframes ddFlapBot { from { transform: perspective(260px) rotateX(90deg); } to { transform: perspective(260px) rotateX(0deg); } }
      `}</style>
    </div>
  )
}
