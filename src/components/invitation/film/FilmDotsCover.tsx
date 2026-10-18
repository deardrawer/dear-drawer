'use client'

// 무비 템플릿 인트로 · 도트 자수: 살짝 흐린 사진 위에 두 사람 영문 이름(필기체)이 X자 십자수로 자동으로 수놓아지고,
// 다 놓이면 화면 아래 문구가 나오며 누르면 넘어간다.
import { useEffect, useMemo, useRef, useState } from 'react'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import { whenFontReady } from '@/lib/fontReady'

function useFontLink(id: string, href: string) {
  useEffect(() => {
    if (document.querySelector(`link[data-film-font="${id}"]`)) return
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-film-font', id)
    document.head.appendChild(l)
  }, [id, href])
}
type Crop = { cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number; scale?: number; positionX?: number; positionY?: number }
/** 인트로가 쓰는 청첩장 필드만 */
export interface FilmDotsData {
  groom?: { name?: string; nameEn?: string }
  bride?: { name?: string; nameEn?: string }
  media?: { coverImage?: string; coverImageSettings?: Crop }
  filmDotsImage?: string; filmDotsImageSettings?: Crop; filmDotsNamePos?: string; filmDotsCaption?: string
  filmDotsGroomEn?: string; filmDotsBrideEn?: string; filmDotsDeco?: string
}
const coverHeight = (isPreview?: boolean) => (isPreview ? 660 : '100dvh')

/* ================= 도트 자수 ================= */
// 점으로 된 장식 모양 (그림 문자열 → 칸 좌표). 모양마다 큰 것·작은 것을 번갈아 쓴다
const pix = (rows: string[]): [number, number][] => {
  const out: [number, number][] = [], cx = Math.floor(rows[0].length / 2), cy = Math.floor(rows.length / 2)
  rows.forEach((r, y) => Array.from(r).forEach((c, x) => { if (c === 'X') out.push([x - cx, y - cy]) }))
  return out
}
const DECO: Record<string, [number, number][][]> = {
  sparkle: [pix(['..X..', '..X..', 'XXXXX', '..X..', '..X..']), pix(['.X.', 'XXX', '.X.']), pix(['X.X', '.X.', 'X.X'])],
  heart: [pix(['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']), pix(['XX.XX', 'XXXXX', '.XXX.', '..X..'])],
  twinkle: [pix(['...X...', '...X...', '..XXX..', 'XXXXXXX', '..XXX..', '...X...', '...X...']), pix(['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..']), pix(['.X.', 'XXX', '.X.'])],
  none: [],
}
export function FilmDotsCover({ invitation, onEnter, isPreview }: { invitation: FilmDotsData; onEnter: () => void; isPreview?: boolean }) {
  useFontLink('pinyon', 'https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Noto+Sans+KR:wght@400&display=swap')
  const ref = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current; if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  const { w: W, h: H } = size
  const photo = invitation.filmDotsImage || invitation.media?.coverImage || ''
  const crop: Crop = invitation.filmDotsImage ? (invitation.filmDotsImageSettings || {}) : (invitation.media?.coverImageSettings || {})
  const pos = (invitation.filmDotsNamePos) === 'bottom' ? 'bottom' : 'top'
  const deco = invitation.filmDotsDeco || 'flourish'
  const caption = (invitation.filmDotsCaption) || '화면을 눌러 청첩장을 열어주세요'
  // 도트 자수는 영문 필기체 전용: 직접 쓴 영문 > 청첩장 영문 이름 > Groom & Bride
  const latin = (v?: string) => (v || '').replace(/[^A-Za-z .'-]/g, '').trim()
  const line1 = latin(invitation.filmDotsGroomEn) || latin(invitation.groom?.nameEn) || 'Groom'
  const line2 = latin(invitation.filmDotsBrideEn) || latin(invitation.bride?.nameEn) || 'Bride'
  const [fontOk, setFontOk] = useState(false)
  useEffect(() => {
    // 필기체가 실제로 받아진 뒤에 수놓기 시작 (예전엔 글꼴 CSS가 붙기 전 check() 가 '준비됨'을 돌려줘 처음 열 때 기본 글꼴로 수놓아졌다)
    let alive = true
    whenFontReady('Pinyon Script', 'JihoonSeoyeon&', 6000).then(() => { if (alive) setFontOk(true) })
    return () => { alive = false }
  }, [])

  // 필기체 이름을 그려 칸마다 잉크 양을 재서 점으로 바꾼다
  const cs = 4
  const layout = useMemo(() => {
    if (!W || !H || !fontOk) return null
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const g = c.getContext('2d', { willReadFrequently: true })!
    const font = '"Pinyon Script"'
    g.font = `100px ${font}`
    const w0 = g.measureText(line1).width / 100, w2 = g.measureText(line2).width / 100
    const span = deco === 'flourish' ? 0.8 : 0.9
    const fs = Math.min(W * span / Math.max(w0, w2, 0.1), W * 0.44)
    // 아래: 이름 묶음 끝이 화면 아래 안내 문구 바로 위(약 80px)에 오도록
    // 덩굴이 있으면 아래 모서리 장식 위로 비켜 선다
    const y1 = pos === 'top' ? H * 0.2 + fs * 0.5 : H - (deco === 'flourish' ? 120 : 80) - fs * 1.24 - fs * 0.32
    const lines = [{ t: line1, f: fs, x: W * (1 - span) / 2, y: y1 }, { t: '&', f: fs * 0.62, x: W * 0.5 - fs * 0.12, y: y1 + fs * 0.62 }, { t: line2, f: fs, x: W * (1 + span) / 2 - w2 * fs, y: y1 + fs * 1.24 }]
    const dots: { x: number; y: number; l: number }[] = []
    const sample = (k: number) => {
      const d = g.getImageData(0, 0, W, H).data
      const cols = Math.floor(W / cs), rows = Math.floor(H / cs)
      for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
        let sum = 0
        for (let y = 0; y < cs; y++) for (let x = 0; x < cs; x++) sum += d[((cy * cs + y) * W + cx * cs + x) * 4 + 3]
        if (sum / (cs * cs * 255) > 0.27) dots.push({ x: cx * cs, y: cy * cs, l: k })
      }
    }
    lines.forEach((Ln, k) => {
      g.clearRect(0, 0, W, H); g.font = `${Ln.f}px ${font}`; g.fillStyle = g.strokeStyle = '#000'; g.lineJoin = 'round'
      // 덩굴 자수는 실 한 줄처럼 가늘게 (테두리 덧칠 없이), 다른 장식은 예전 굵기
      g.lineWidth = deco === 'flourish' ? 0 : Ln.f * 0.03
      g.fillText(Ln.t, Ln.x, Ln.y); if (g.lineWidth) g.strokeText(Ln.t, Ln.x, Ln.y)
      sample(k)
    })
    // 네 모서리 덩굴 (자수 액자 테두리처럼) — 이름 다음에 수놓인다
    if (deco === 'flourish') {
      g.clearRect(0, 0, W, H); g.strokeStyle = g.fillStyle = '#000'; g.lineWidth = cs * 1.05; g.lineCap = 'round'
      const m = cs * 3.5, L = Math.min(W, H) * 0.22, r = L * 0.1
      const ox = m + r, oy = m + r
      // 모서리 고리에서 한쪽으로 뻗어 나가 끝이 말리는 줄기 (가로). 세로는 축을 바꿔 같은 모양
      const arm = () => {
        g.beginPath(); g.moveTo(ox + r, oy)
        const ex = ox + L * 0.78, ey = oy + r * 0.3
        g.bezierCurveTo(ox + L * 0.32, oy - r * 0.9, ox + L * 0.5, oy + r * 1.7, ex, ey)
        g.bezierCurveTo(ex + r * 1.7, ey - r * 0.5, ex + r * 1.3, ey - r * 2.3, ex + r * 0.1, ey - r * 1.7)
        g.bezierCurveTo(ex - r * 0.6, ey - r * 1.2, ex + r * 0.1, ey - r * 0.4, ex + r * 0.6, ey - r * 0.9)
        g.stroke()
        g.beginPath(); g.arc(ox + L * 0.42, oy + r * 0.25, cs * 0.9, 0, Math.PI * 2); g.fill()
      }
      for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        g.save(); g.translate(fx ? W : 0, fy ? H : 0); g.scale(fx ? -1 : 1, fy ? -1 : 1)
        g.beginPath(); g.arc(ox, oy, r, 0, Math.PI * 2); g.stroke()
        arm(); g.save(); g.transform(0, 1, 1, 0, 0, 0); arm(); g.restore()
        g.restore()
      }
      sample(3)
    }
    dots.sort((a, b) => a.l - b.l || a.x - b.x || a.y - b.y)
    // 점으로 된 작은 별(✦)을 이름 둘레 빈자리에 흩뿌린다 — 이름을 다 수놓은 뒤 마지막에 놓인다
    const top = y1 - fs * 0.9, bottom = y1 + fs * 1.24 + fs * 0.42
    const SPOTS = [[0.12, 0.1], [0.82, 0.07], [0.9, 0.3], [0.08, 0.36], [0.86, 0.62], [0.14, 0.7], [0.55, 0.05], [0.7, 0.86], [0.24, 0.9]]
    const ARMS = DECO[deco] || []
    SPOTS.forEach(([sx, sy], k) => {
      const cxp = Math.round(sx * W / cs) * cs, cyp = Math.round(sy * H / cs) * cs
      if (cyp > top - cs * 4 && cyp < bottom + cs * 4) return   // 이름과 겹치는 자리는 건너뛴다
      if (cyp > H - 70) return                                  // 아래 안내 문구 자리
      if (ARMS.length) ARMS[k % ARMS.length].forEach(([dx, dy]) => dots.push({ x: cxp + dx * cs, y: cyp + dy * cs, l: 3 }))
    })
    return { dots, top, bottom }
  }, [W, H, fontOk, line1, line2, pos, deco])

  // 자동으로 수놓기
  const [done, setDone] = useState(false)
  useEffect(() => {
    const cv = cvRef.current
    if (!cv || !layout) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    const g = cv.getContext('2d')!; g.scale(dpr, dpr)
    const { dots } = layout, N = dots.length, AUTO = 2600
    const born = new Float64Array(N).fill(-1)
    let raf = 0, start = 0
    const paint = (now: number) => {
      // 실 한 땀 = X 자 (막 놓인 땀은 살짝 크고 옅게 시작)
      g.clearRect(0, 0, W, H); g.lineCap = 'round'
      const stitch = (x: number, y: number, s: number) => { const p = (cs - s) / 2; g.moveTo(x + p, y + p); g.lineTo(x + p + s, y + p + s); g.moveTo(x + p + s, y + p); g.lineTo(x + p, y + p + s) }
      for (const [col, off, lw] of [['rgba(0,0,0,.32)', 0.6, 1.9], ['#FBF8F1', 0, 1.35]] as const) {
        g.strokeStyle = col; g.lineWidth = lw
        g.beginPath()
        for (let i = 0; i < N; i++) if (born[i] >= 0 && now - born[i] >= 140) stitch(dots[i].x + off, dots[i].y + off, cs - 0.6)
        g.stroke()
      }
      g.strokeStyle = '#FBF8F1'; g.lineWidth = 1.35
      for (let i = 0; i < N; i++) {
        if (born[i] < 0 || now - born[i] >= 140) continue
        const a = (now - born[i]) / 140
        g.globalAlpha = 0.5 + 0.5 * a
        g.beginPath(); stitch(dots[i].x, dots[i].y, cs - 0.6 + (1 - a) * 1.4); g.stroke()
      }
      g.globalAlpha = 1
    }
    const tick = (now: number) => {
      if (!start) start = now
      const u = Math.min(1, (now - start) / AUTO), k = Math.floor(N * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2))
      for (let i = 0; i < k; i++) if (born[i] < 0) born[i] = now
      paint(now)
      if (u < 1 || now - start < AUTO + 200) raf = requestAnimationFrame(tick)
      else { for (let i = 0; i < N; i++) if (born[i] < 0) born[i] = 0; paint(1e9); setDone(true) }
    }
    const t = setTimeout(() => { raf = requestAnimationFrame(tick) }, 700)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [layout, W, H])

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: coverHeight(isPreview), overflow: 'hidden', background: '#2a2520', cursor: 'pointer' }} onClick={() => { if (done) onEnter() }}>
      {/* 사진은 흐리지 않고 또렷하게 — 살짝만 어둡게 해 흰 실 땀이 묻히지 않게 한다 */}
      {photo && (
        <div style={{ position: 'absolute', inset: 0, filter: 'saturate(1.05) brightness(.92)' }}>
          <CroppedImageDiv src={photo} crop={crop} className="absolute inset-0" style={crop.cropWidth ? undefined : { backgroundSize: 'cover', backgroundPosition: 'center' }} />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(10,12,8,.2), rgba(10,12,8,.1) 50%, rgba(10,12,8,.3))' }} />
      <canvas ref={cvRef} role="img" aria-label={`${line1} & ${line2}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      {layout && (
        <p style={{ position: 'absolute', left: 0, right: 0, bottom: 40, margin: 0, textAlign: 'center', color: '#fff', fontSize: 12, letterSpacing: '.04em', fontFamily: "'Noto Sans KR', sans-serif", textShadow: '0 1px 3px rgba(0,0,0,.35)', opacity: done ? 0.92 : 0, transition: 'opacity .8s ease' }}>
          {caption}
        </p>
      )}
    </div>
  )
}

