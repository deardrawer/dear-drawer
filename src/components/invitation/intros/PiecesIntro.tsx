'use client'

// 두 장의 사진: 따로 놓인 두 사람의 사진을 끌어 붙이면 한 장의 커플 사진으로 합쳐지고,
// 이름과 초대 문구가 나타난다.
import { useEffect, useRef, useState } from 'react'
import { type IntroStyleProps, cropOf, paperLayer, isDark, nameFont, lines, photoOf, str, stageScale, type PhotoCrop } from './shared'
import { PIECES_GROOM_DEFAULT, PIECES_BRIDE_DEFAULT } from '@/lib/introStyles'
import IntroPhoto from './IntroPhoto'

// 예전 선택값(white/paper/cream)도 그대로 보이도록
const LEGACY_BG: Record<string, string> = { white: '#FFFFFF', paper: '#F5F2EB', cream: '#F6F1E7' }
const GOTHIC = "Pretendard, 'Noto Sans KR', sans-serif"

export default function PiecesIntro({ w, h, opts, data, finished, reduced, signal, onComplete }: IntroStyleProps) {
  // 비워두면 기본 사진 (두 사람의 어린 시절 느낌)
  const groomPhoto = str(opts.groomPhoto, PIECES_GROOM_DEFAULT)
  const bridePhoto = str(opts.bridePhoto, PIECES_BRIDE_DEFAULT)
  const couplePhoto = photoOf(opts, 'couplePhoto', data)
  // 기본 구도 (크롭을 따로 정하지 않았을 때)
  //  · 신랑·신부 카드가 같은 커플 사진이면 2배로 당겨 왼쪽(신랑)·오른쪽(신부) 얼굴을 잡는다
  //  · 따로 고른 사진이거나 합쳐진 가로 사진은 얼굴이 잘리지 않게 위쪽을 기준으로 맞춘다
  const sameShot = groomPhoto === bridePhoto
  const faceFrame = (side: 'a' | 'b', crop: PhotoCrop | undefined): React.CSSProperties | undefined => crop ? undefined
    : sameShot ? { backgroundSize: '200% auto', backgroundPosition: side === 'a' ? '16% 15%' : '84% 15%' }
    : { backgroundPosition: 'center 22%' }
  const invite = lines(opts.invite, '따로 걷던 두 사람이\n이제 한 걸음으로 걸어가려 합니다.\n그 시작에 당신을 초대합니다.').slice(0, 3)
  // 예전 선택값(gothic·round·scd)은 프리텐다드로 보인다
  const font = nameFont(opts.font)
  const instant = finished || reduced
  // 초대 문구 아래 날짜 · 장소
  const dateLine = [/^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date.replace(/-/g, '. ') : '', data.venue].filter(Boolean).join('  ·  ')
  const bgRaw = str(opts.background, '#FFFFFF')
  const bg = LEGACY_BG[bgRaw] || bgRaw
  const dark = isDark(bg)
  const ink = dark ? { name: '#F4F1EC', body: 'rgba(244,241,236,.78)', soft: 'rgba(244,241,236,.6)' } : { name: '#1f1f1f', body: '#5a554c', soft: '#8a8377' }

  // 레이아웃 (px)
  const pw = Math.round(w * 0.37), ph = Math.round((pw - 10) * 4 / 3) + 11
  const home = { a: { x: Math.round(w * 0.1), y: Math.round(h * 0.19) }, b: { x: Math.round(w * 0.53), y: Math.round(h * 0.43) } }
  const join = { a: { x: Math.round(w / 2 - pw - 3), y: Math.round(h * 0.22) }, b: { x: Math.round(w / 2 + 3), y: Math.round(h * 0.22) } }

  const [joined, setJoined] = useState(instant)
  const [merged, setMerged] = useState(instant)
  const [lift, setLift] = useState<'a' | 'b' | null>(null)
  const [off, setOff] = useState({ a: { x: 0, y: 0 }, b: { x: 0, y: 0 } })
  const [tilt, setTilt] = useState(0)
  const touched = useRef(false)
  const completed = useRef(false)
  const aRef = useRef<HTMLDivElement>(null)
  const bRef = useRef<HTMLDivElement>(null)

  const doJoin = () => {
    if (joined) return
    setLift(null); setTilt(0); setOff({ a: { x: 0, y: 0 }, b: { x: 0, y: 0 } }); setJoined(true)
    try { if ('vibrate' in navigator) navigator.vibrate(12) } catch { /* unsupported */ }
  }

  useEffect(() => {
    if (!joined || merged) return
    const t = setTimeout(() => setMerged(true), 1050)
    return () => clearTimeout(t)
  }, [joined, merged])
  useEffect(() => {
    if (!merged || completed.current) return
    const t = setTimeout(() => { completed.current = true; onComplete() }, instant ? 0 : 2600)
    return () => clearTimeout(t)
  }, [merged]) // eslint-disable-line react-hooks/exhaustive-deps
  const [seenSignal, setSeenSignal] = useState(signal)
  if (signal !== seenSignal) { setSeenSignal(signal); if (!joined) { setLift(null); setTilt(0); setOff({ a: { x: 0, y: 0 }, b: { x: 0, y: 0 } }); setJoined(true) } }

  // 손대지 않으면 한 장이 다른 사진 쪽으로 살짝 다가갔다 돌아온다
  useEffect(() => {
    if (instant) return
    const nudge = () => {
      if (touched.current || !aRef.current) return
      const dx = (home.b.x - home.a.x) * 0.12, dy = (home.b.y - home.a.y) * 0.12
      aRef.current.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${dx}px,${dy}px)`, offset: 0.45 }, { transform: 'translate(0,0)' }], { duration: 1300, easing: 'cubic-bezier(.45,0,.25,1)' })
    }
    const t1 = setTimeout(nudge, 2000), t2 = setTimeout(nudge, 6500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [instant]) // eslint-disable-line react-hooks/exhaustive-deps

  const drag = useRef<{ k: 'a' | 'b'; sx: number; sy: number; lx: number; moved: boolean; sc: number } | null>(null)
  const down = (k: 'a' | 'b') => (e: React.PointerEvent) => {
    if (joined) return
    touched.current = true
    ;[aRef.current, bRef.current].forEach(el => el?.getAnimations?.().forEach(a => a.cancel()))
    drag.current = { k, sx: e.clientX, sy: e.clientY, lx: e.clientX, moved: false, sc: stageScale(e.currentTarget as Element) }
    setLift(k)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || joined) return
    const dx = (e.clientX - d.sx) / d.sc, dy = (e.clientY - d.sy) / d.sc
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true
    setTilt(t => Math.max(-6, Math.min(6, t * 0.7 + (e.clientX - d.lx) / d.sc * 0.27)))
    d.lx = e.clientX
    const next = { ...off, [d.k]: { x: dx, y: dy } }
    setOff(next)
    const A = { x: home.a.x + next.a.x, y: home.a.y + next.a.y }, B = { x: home.b.x + next.b.x, y: home.b.y + next.b.y }
    if (d.moved && Math.hypot(A.x - B.x, A.y - B.y) < pw * 1.15) { drag.current = null; doJoin() }
  }
  const up = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setLift(null); setTilt(0)
    if (!d.moved) doJoin()
  }

  const print = (k: 'a' | 'b', src: string, crop: PhotoCrop | undefined, name: string, ref: React.RefObject<HTMLDivElement | null>) => {
    const p = joined ? join[k] : { x: home[k].x + off[k].x, y: home[k].y + off[k].y }
    const lifting = lift === k
    return (
      <div ref={ref} data-intro-gesture className="absolute" role="button" aria-label={`${name} 사진, 끌어서 붙이기`}
        onPointerDown={down(k)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{
          left: p.x, top: p.y, width: pw, zIndex: lifting ? 3 : 1, touchAction: 'none', cursor: joined ? 'default' : lifting ? 'grabbing' : 'grab',
          transition: lifting || instant ? 'none' : 'left .9s cubic-bezier(.3,.7,.2,1), top .9s cubic-bezier(.3,.7,.2,1)',
        }}>
        <span className="block" style={{
          background: '#fff', padding: '5px 5px 6px',
          boxShadow: lifting ? '0 0 0 1px rgba(0,0,0,.04),0 14px 22px -8px rgba(0,0,0,.24),0 30px 46px -20px rgba(0,0,0,.34)' : '0 0 0 1px rgba(0,0,0,.04),0 6px 12px -6px rgba(0,0,0,.14),0 18px 30px -18px rgba(0,0,0,.22)',
          transform: lifting ? `scale(1.04) rotate(${tilt}deg)` : 'none', opacity: merged ? 0 : 1, transition: lifting ? 'box-shadow .3s' : 'opacity 1.3s ease, box-shadow .3s',
        }}>
          <IntroPhoto src={src} crop={crop} className="block w-full pointer-events-none" style={{ aspectRatio: '3 / 4', ...faceFrame(k, crop) }} />
        </span>
        <p className="m-0 text-center" style={{ marginTop: 14, fontFamily: font, fontWeight: 500, fontSize: 14, color: ink.name, opacity: joined ? 0 : 1, transition: 'opacity .5s' }}>{name}</p>
      </div>
    )
  }

  const t = (d: number) => (instant ? 'none' : `opacity .9s ease ${d}s, transform 1.1s cubic-bezier(.2,.7,.2,1) ${d}s`)

  return (
    <div className="absolute inset-0" style={{ backgroundColor: bg }}>
      {str(opts.paper, 'on') === 'on' && <div style={paperLayer(dark)} />}
      <p className="absolute left-0 right-0 m-0 text-center" style={{ top: Math.max(58, h * 0.085), fontFamily: GOTHIC, fontSize: 12, color: ink.soft, opacity: joined ? 0 : 1, transition: 'opacity .6s' }}>우리, 결혼합니다</p>
      {print('a', groomPhoto, cropOf(opts, 'groomPhoto'), data.groomGiven, aRef)}
      {print('b', bridePhoto, cropOf(opts, 'bridePhoto'), data.brideGiven, bRef)}
      {/* 두 장이 합쳐진 한 장 */}
      <span className="absolute block pointer-events-none" style={{
        left: join.a.x, top: join.a.y, width: pw * 2 + 6, background: '#fff', padding: '5px 5px 6px', zIndex: 4, boxSizing: 'border-box',
        boxShadow: '0 0 0 1px rgba(0,0,0,.04),0 6px 12px -6px rgba(0,0,0,.14),0 18px 30px -18px rgba(0,0,0,.22)',
        opacity: merged ? 1 : 0, transition: instant ? 'none' : 'opacity 1.3s ease',
      }}>
        <IntroPhoto src={couplePhoto} crop={cropOf(opts, 'couplePhoto')} label="두 사람의 사진" className="block w-full" style={{ height: ph - 11, ...(cropOf(opts, 'couplePhoto') ? {} : { backgroundPosition: 'center 24%' }) }} />
      </span>
      <div className="absolute left-0 right-0 text-center" style={{ top: join.a.y + ph + 34 }}>
        <p className="m-0" style={{ fontFamily: font, fontWeight: 500, fontSize: 21, lineHeight: 1, color: ink.name, opacity: merged ? 1 : 0, transform: merged ? 'none' : 'translateY(6px)', transition: t(0.7) }}>
          {data.groomGiven}<span style={{ display: 'inline-block', margin: '0 .4em', color: '#F2B53A' }}>·</span>{data.brideGiven}
        </p>
        <p className="m-0" style={{ marginTop: 18, fontFamily: GOTHIC, fontSize: 12.5, lineHeight: 1.6, color: ink.body }}>
          {invite.map((l, i) => (
            <span key={i} className="block" style={{ opacity: merged ? 1 : 0, transform: merged ? 'none' : 'translateY(5px)', transition: t(1.5 + i * 0.4) }}>{l}</span>
          ))}
        </p>
        {dateLine && (
          <p className="m-0" style={{ marginTop: 12, fontFamily: GOTHIC, fontSize: 11, letterSpacing: '.12em', color: ink.soft, opacity: merged ? 1 : 0, transition: t(1.7 + invite.length * 0.4) }}>{dateLine}</p>
        )}
      </div>
      <p className="absolute left-0 right-0 m-0 text-center pointer-events-none" style={{ bottom: '9%', fontFamily: GOTHIC, fontSize: 11.5, color: ink.soft, opacity: joined ? 0 : 1, transition: 'opacity .5s' }}>
        사진을 서로에게 가까이 놓아주세요
      </p>
    </div>
  )
}
