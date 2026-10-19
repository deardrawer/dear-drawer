'use client'

// 별자리 문장: 먼저 작은 안내 팝업이 '이 하늘이 무엇인지' 감성적으로 알려준 뒤,
// 예식 그 시각·그 자리 위의 실제 하늘(밝은 별)이 둥근 별지도로 펼쳐지고,
// 단어마다 별이 하나씩 이어져 두 사람의 문장이 된다. 다 이어지면 이름 · 그날의 하늘 · 좌표.
import { useEffect, useMemo, useRef, useState } from 'react'
import { type IntroStyleProps, isDark, lines, str, stageScale } from './shared'
import { skyCity, skyStars, coordText } from '@/lib/skyMap'

// 단어 8개까지의 별 자리 (화면 비율) — 왼쪽 위에서 흘러내리는 손잡이(1~4) + 오른쪽 아래 국자(4~8)
const SL: [number, number][] = [
  [0.13, 0.22], [0.3, 0.27], [0.44, 0.345], [0.53, 0.45],
  [0.79, 0.415], [0.84, 0.585], [0.6, 0.635], [0.42, 0.56],
]
// 팝업·버튼의 별 문양: 긴 4방향 + 짧은 대각 4방향 (나침반 별)
const COMPASS = 'M12 0.4L12.96 9.69L16.53 7.47L14.31 11.04L23.6 12L14.31 12.96L16.53 16.53L12.96 14.31L12 23.6L11.04 14.31L7.47 16.53L9.69 12.96L0.4 12L9.69 11.04L7.47 7.47L11.04 9.69Z'
// 하늘을 끈 경우의 장식 별
const LONE = [[0.64, 0.12], [0.9, 0.25], [0.1, 0.5], [0.88, 0.86], [0.24, 0.66]]

// 글자 폭 재기 (화면 밖으로 나가지 않게)
let MCTX: CanvasRenderingContext2D | null = null
function textWidth(t: string, font: string) {
  if (typeof document === 'undefined') return null
  MCTX = MCTX || document.createElement('canvas').getContext('2d')
  if (!MCTX) return null
  MCTX.font = font
  return MCTX.measureText(t).width
}

export default function StarsIntro({ w: W, h: H, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  // 안내 팝업 축소 비율 — 아주 좁은 칸(320px 미만)에서만. 실제 휴대폰(320px 이상)은 원래 크기 그대로
  // (에디터 미리보기는 이제 390px 화면으로 그린 뒤 통째로 줄이므로 여기선 1)
  const popK = W > 0 ? Math.min(1, W / 320) : 1
  const bg = str(opts.bg, '#F4D9DE')
  const ink = str(opts.ink, '#7A3B45')
  const soft = isDark(bg) ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.72)'
  const text = str(opts.text, 'Our love was written in the stars').trim()
  const words = text.split(/\s+/).filter(Boolean).slice(0, 8)
  const ko = /[가-힣]/.test(text)
  const fs = Math.round(W * (ko ? 0.052 : 0.066))
  const R = 5.5

  // 배경 하늘: 예식 그 시각(예식장 주소의 도시) 또는 우리의 날(사귄 날 등, 기본 밤 9시). 날짜가 없으면 그리지 않는다
  const ours = str(opts.skyDate, 'wedding') === 'ours' || !data.date
  const skyDay = ours ? str(opts.ourDate) : data.date
  const skyTime = ours ? str(opts.ourTime, '21:00') : (data.time || '12:00')
  const skyOn = str(opts.sky, 'on') !== 'off' && /^\d{4}-\d{2}-\d{2}/.test(skyDay)
  const city = ours ? skyCity(str(opts.ourCity, 'seoul')) : skyCity(str(opts.city), data.address)
  const place = (ours && str(opts.ourPlace).trim()) || city.en
  const sky = useMemo(() => (skyOn ? skyStars(skyDay, skyTime, city) : []), [skyOn, skyDay, skyTime, city])
  const skyR = Math.min(W * 0.42, H * 0.3), skyX = W / 2, skyY = H * 0.41
  const skyWhen = (() => {
    if (!skyOn) return ''
    const [y, m, d] = skyDay.slice(0, 10).split('-')
    const t = /^(\d{1,2}):(\d{2})/.exec(skyTime)
    const hm = t ? `${(+t[1] % 12) || 12}:${t[2]} ${+t[1] < 12 ? 'AM' : 'PM'}` : ''
    return [ours ? str(opts.ourCredit, 'THE NIGHT WE MET') : 'THE SKY ABOVE US', `${y}.${m}.${d}`, hm].filter(Boolean).join(' · ')
  })()

  // 단어 자리: 이어진 선(앞·뒤 별 방향)의 반대쪽에 두어 글자와 선이 겹치지 않게
  const stars = words.map((_, i) => ({ x: SL[i][0] * W, y: SL[i][1] * H }))
  const font = `${ko ? 500 : 400} ${fs}px ${ko ? "'Noto Sans KR', sans-serif" : "'Cormorant Garamond', serif"}`
  const measure = (t: string) => textWidth(t, font) ?? fs * t.length * 0.6
  const P = words.map((w, i) => {
    const me = stars[i], nb = [stars[i - 1], stars[i + 1]].filter(Boolean)
    let vx = 0, vy = 0
    nb.forEach(o => { const d = Math.hypot(o.x - me.x, o.y - me.y) || 1; vx += (o.x - me.x) / d; vy += (o.y - me.y) / d })
    let ux = -vx, uy = -vy
    const m = Math.hypot(ux, uy)
    if (m < 0.2) { ux = 0; uy = 1 } else { ux /= m; uy /= m }
    const gap = 14
    const a: 'start' | 'middle' | 'end' = ux > 0.38 ? 'start' : ux < -0.38 ? 'end' : 'middle'
    const tw = measure(w)
    let lx = me.x + ux * gap
    const left = a === 'start' ? lx : a === 'end' ? lx - tw : lx - tw / 2
    if (left < 8) lx += 8 - left
    if (left + tw > W - 8) lx -= left + tw - (W - 8)
    return { x: me.x, y: me.y, lx, ly: me.y + uy * (gap + fs * 0.45) + fs * 0.34, a, w }
  })
  const n = P.length

  // 흐름: 안내 팝업 → (누르면) 하늘이 펼쳐지고 별이 하나씩 이어진다
  const [open, setOpen] = useState(!(finished || reduced))     // 팝업이 떠 있는지
  const [idx, setIdx] = useState(finished || reduced ? n - 1 : 0)
  const done = n > 0 && idx >= n - 1
  const [seenSignal, setSeenSignal] = useState(signal)
  if (signal !== seenSignal) { setSeenSignal(signal); setOpen(false); setIdx(n - 1) }   // 건너뛰기·스크롤
  useEffect(() => {
    if (open || idx >= n - 1) return
    const t = setTimeout(() => setIdx(i => Math.min(n - 1, i + 1)), idx === 0 ? 1500 : 620)
    return () => clearTimeout(t)
  }, [open, idx, n])
  const completed = useRef(false)
  useEffect(() => {
    if (done && !open && !completed.current) { completed.current = true; onComplete() }
  }, [done, open, onComplete])

  // 손가락으로 다음 별까지 끌거나, 탭해서 하나씩 빨리 넘길 수도 있다
  const [band, setBand] = useState<[number, number] | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const down = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const pos = (e: React.PointerEvent): [number, number] => { const r = ref.current!.getBoundingClientRect(), k = stageScale(ref.current); return [(e.clientX - r.left) / k, (e.clientY - r.top) / k] }
  const advance = () => setIdx(i => Math.min(n - 1, i + 1))

  const nameLine = str(opts.sign) || (data.groomEn && data.brideEn ? `${data.groomEn.toUpperCase()} & ${data.brideEn.toUpperCase()}` : `${data.groomName} & ${data.brideName}`)
  const credit = [
    { t: nameLine, f: '500 11px', ls: '.06em', o: 1 },
    ...(skyOn
      ? [{ t: skyWhen, f: '400 10.5px', ls: '.04em', o: 1 }, { t: `${place} · ${coordText(city)}`, f: '400 9.5px', ls: '.08em', o: 0.7 }]
      : [{ t: [data.date ? data.date.slice(0, 10).replace(/-/g, '.') : '', data.venue].filter(Boolean).join(' · '), f: '400 11px', ls: '.04em', o: 1 }]),
  ].filter(l => l.t)
  // 기본 안내: 예식 전엔 '뜰 별들', 예식이 지나면 '떠 있던 별들' (직접 쓴 문구는 그대로)
  const [today] = useState(() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}` })
  const past = skyOn && !ours && data.date.slice(0, 10) < today
  const ourLabel = str(opts.ourLabel, '처음 만난 날')
  const night = (() => { const hh = +(skyTime.split(':')[0] || 21); return hh >= 18 || hh < 5 })()
  const note = lines(opts.note, !skyOn
    ? '저희의 마음을\n별자리로 이어 그렸습니다.'
    : ours
      ? `저희가 ${ourLabel},\n그날 ${night ? '밤하늘' : '하늘'}에 떠 있던 별들이에요.\n그 위에 저희의 마음을 이어 그렸습니다.`
    : past
      ? '저희가 부부가 된 날,\n그 시각 하늘에 떠 있던 별들이에요.\n그 위에 저희의 마음을 이어 그렸습니다.'
      : '저희가 부부가 되는 날,\n그 시각 하늘에 뜰 별들을 담았어요.\n그 위에 저희의 마음을 이어 그렸습니다.')

  return (
    <div ref={ref} className="absolute inset-0 select-none" data-intro-gesture style={{ background: bg, touchAction: 'none', cursor: 'pointer' }}
      onPointerDown={(e) => { if (open || done) return; const [x, y] = pos(e); down.current = { x, y, moved: false } }}
      onPointerMove={(e) => {
        const d = down.current; if (!d || open || done) return
        const [x, y] = pos(e); if (Math.hypot(x - d.x, y - d.y) > 6) d.moved = true; if (!d.moved) return
        setBand([x, y])
        const b = P[idx + 1]; if (b && Math.hypot(x - b.x, y - b.y) < 30) advance()
      }}
      onPointerUp={() => {
        const d = down.current; down.current = null; setBand(null)
        if (open) { setOpen(false); return }
        if (d && !d.moved && !done) advance()
      }}>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes stPulse{0%{opacity:.8;transform:scale(.6)}100%{opacity:0;transform:scale(1.5)}}@keyframes stDraw{from{stroke-dashoffset:var(--len)}to{stroke-dashoffset:0}}@keyframes stSky{from{opacity:0;transform:rotate(-10deg) scale(.95)}to{opacity:1;transform:none}}@keyframes stTw{0%,100%{opacity:1}50%{opacity:.35}}@keyframes stPop{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}@keyframes stLine{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes stBreath{0%,100%{opacity:.55}50%{opacity:1}}@keyframes stSpark{0%,100%{transform:scale(.9);opacity:.85}50%{transform:scale(1.06);opacity:1}}' }} />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} aria-label={words.join(' ')}>
        {/* 예식 그 시각의 하늘 (가운데 = 머리 위, 위 = 북, 왼쪽 = 동) — 팝업이 닫히면 천천히 돌며 자리를 잡는다 */}
        {skyOn && !open && (
          <g style={{ transformOrigin: `${skyX}px ${skyY}px`, animation: finished || reduced ? undefined : 'stSky 2.6s cubic-bezier(.2,.7,.2,1) both' }}>
            <circle cx={skyX} cy={skyY} r={skyR} fill="none" stroke={ink} strokeOpacity={0.22} strokeWidth={1} />
            <circle cx={skyX} cy={skyY} r={skyR + 4} fill="none" stroke={ink} strokeOpacity={0.12} strokeWidth={0.6} />
            {sky.map((s, i) => (
              <circle key={i} cx={skyX + s.x * skyR} cy={skyY + s.y * skyR} r={Math.max(0.55, 2.5 - s.mag * 0.42)} fill={ink}
                fillOpacity={Math.min(0.75, Math.max(0.28, 0.72 - s.mag * 0.09))}
                style={s.mag < 1.2 ? { animation: `stTw ${2.6 + (i % 5) * 0.4}s ease-in-out ${(i % 7) * 0.3}s infinite` } : undefined} />
            ))}
            {([['N', 0, -1], ['S', 0, 1], ['E', -1, 0], ['W', 1, 0]] as const).map(([c, dx, dy]) => (
              <text key={c} x={skyX + dx * (skyR + 12)} y={skyY + dy * (skyR + 12) + 3} textAnchor="middle" fill={ink} fillOpacity={0.45} style={{ font: "500 8px 'Noto Sans KR', sans-serif", letterSpacing: '.1em' }}>{c}</text>
            ))}
          </g>
        )}
        {!open && (
          <>
            <g stroke={ink} strokeWidth={2} strokeLinecap="round">
              {P.slice(0, idx + 1).map((p, i) => {
                if (i === 0) return null
                const a = P[i - 1], len = Math.hypot(p.x - a.x, p.y - a.y)
                return <line key={i} x1={a.x} y1={a.y} x2={p.x} y2={p.y} strokeDasharray={len} style={{ ['--len' as string]: len, animation: finished || reduced ? undefined : 'stDraw .38s cubic-bezier(.5,0,.3,1) both' } as React.CSSProperties} />
              })}
            </g>
            {band && P[idx] && !done && <line x1={P[idx].x} y1={P[idx].y} x2={band[0]} y2={band[1]} stroke={ink} strokeWidth={1.5} strokeDasharray="3 4" opacity={0.7} />}
            {!skyOn && LONE.map(([x, y], i) => <circle key={'l' + i} cx={x * W} cy={y * H} r={R} fill={ink} />)}
            {P.map((p, i) => (
              <g key={i}>
                {i === idx + 1 && !done && <circle cx={p.x} cy={p.y} r={R + 7} fill="none" stroke={ink} strokeWidth={1.2} style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'stPulse 1.6s ease-out infinite' }} />}
                <circle cx={p.x} cy={p.y} r={R} fill={ink} />
                <text x={p.lx} y={p.ly} textAnchor={p.a} fill={ink} style={{ font, letterSpacing: '-.02em', opacity: i <= idx ? 1 : 0, transition: 'opacity .5s ease .25s' }}>{p.w}</text>
              </g>
            ))}
            {credit.map((ln, i) => (
              <text key={i} x={W * 0.2} y={H * 0.765 + i * 16.5} fill={ink} style={{ font: `${ln.f} 'Noto Sans KR', sans-serif`, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: ln.ls, opacity: done ? ln.o : 0, transition: `opacity 1s ease ${0.4 + i * 0.25}s` }}>{ln.t}</text>
            ))}
          </>
        )}
      </svg>

      {/* 시작 전 안내 팝업 — 이 하늘이 무엇인지 먼저 알려준다
          · 휴대폰 화면(375px) 기준으로 그리고, 에디터 미리보기처럼 작은 칸에선 통째로 줄인다 */}
      {open && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: W / popK, height: H / popK, transform: `scale(${popK})`, transformOrigin: '0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 9%' }}>
          <div style={{ width: '100%', padding: '28px 22px 26px', borderRadius: 20, background: soft, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 16px 40px rgba(0,0,0,.08)', border: `1px solid ${ink}1f`, color: ink, textAlign: 'center', animation: 'stPop .9s cubic-bezier(.2,.7,.2,1) .2s both' }}>
            <svg viewBox="0 0 24 24" width="30" height="30" fill={ink} aria-hidden style={{ display: 'block', margin: '0 auto', animation: 'stSpark 4s ease-in-out infinite' }}>
              <path d={COMPASS} />
            </svg>
            <div style={{ marginTop: 16, fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif", fontSize: 13, lineHeight: 1.85, letterSpacing: '-.01em', wordBreak: 'keep-all' }}>
              {note.map((l, i) => <div key={i} style={{ animation: `stLine .8s ease ${0.6 + i * 0.35}s both` }}>{l}</div>)}
            </div>
            {skyOn && (
              <div style={{ marginTop: 14, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 10.5, lineHeight: 1.75, letterSpacing: '.06em', opacity: 0.7, fontVariantNumeric: 'lining-nums tabular-nums', animation: `stLine .8s ease ${0.6 + note.length * 0.35}s both` }}>
                <div>{skyWhen.split(' · ').slice(1).join(' · ')}</div>
                <div>{place} · {coordText(city)}</div>
              </div>
            )}
            <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: 999, background: ink, color: bg, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, animation: `stLine .8s ease ${0.9 + note.length * 0.35}s both` }}>
              별자리 보기
            </div>
          </div>
          <p style={{ position: 'absolute', left: 0, right: 0, bottom: 22, margin: 0, textAlign: 'center', color: ink, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, animation: `stBreath 2.2s ease-in-out ${1.6 + note.length * 0.35}s infinite both` }}>화면을 누르면 별이 이어져요</p>
        </div>
      )}
    </div>
  )
}
