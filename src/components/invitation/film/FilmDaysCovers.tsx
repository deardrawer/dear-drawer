'use client'

// 무비 템플릿 인트로 · '함께한 날' 두 가지 (요즘 영화를 보는 화면 톤, 필름 질감 없음)
//  · OTT: 작품 상세 화면처럼 — 큰 사진 위 제목, 정보 줄, 청첩장 보기 버튼, 줄거리, 출연, 이어보기 막대
//  · 티켓: 예매 완료 모바일 티켓 — 사진·제목·일시·상영관(예식장)·좌석, 절취선, 바코드가 스캔되면 입장
// 두 스타일은 처음 만난 날·사진·제목·색을 함께 쓴다 (filmDays*)
import { useEffect, useMemo, useRef, useState } from 'react'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'

type Crop = { cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number; scale?: number; positionX?: number; positionY?: number }
/** 인트로가 쓰는 청첩장 필드만 */
export interface FilmDaysData {
  groom?: { name?: string; nameEn?: string }
  bride?: { name?: string; nameEn?: string }
  wedding?: { date?: string; time?: string; timeDisplay?: string; showDate?: boolean; showVenue?: boolean; venue?: { name?: string; hall?: string } }
  media?: { coverImage?: string; coverImageSettings?: Crop }
  filmDaysStart?: string; filmDaysImage?: string; filmDaysImageSettings?: Crop
  filmDaysTitle?: string; filmDaysMessage?: string; filmDaysBg?: string; filmDaysInk?: string
  filmOttGenre?: string; filmTicketSeat?: string
}

const coverHeight = (isPreview?: boolean) => (isPreview ? 660 : '100dvh')
const DAY_MS = 86400000
const SANS = "'Inter Tight', 'Pretendard', 'Noto Sans KR', -apple-system, sans-serif"
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;700&display=swap'

function useFontLink() {
  useEffect(() => {
    if (document.querySelector('link[data-film-font="days"]')) return
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONT_HREF; l.setAttribute('data-film-font', 'days')
    document.head.appendChild(l)
  }, [])
}
/** 'YYYY-MM-DD' → 그날 0시 (현지) */
const dayStart = (v?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : null
}
/** 밝기 0~1 (색 코드가 아니면 null) */
const lum = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()); if (!m) return null
  const n = parseInt(m[1], 16)
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}
/** 포인트색을 그대로 쓰되, 배경과 거의 같은 색(밝기 차 0.15 미만)일 때만 기본 글자색 */
const readable = (color: string, bg: string, fallback: string) => {
  const a = lum(color), b = lum(bg)
  return a != null && b != null && Math.abs(a - b) >= 0.15 ? color : fallback
}
const isDarkHex = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()); if (!m) return false
  const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
}

/** 오늘(브라우저 기준) · 함께한 날 · D-day · 0부터 세어 올라가는 숫자 */
function useDays(inv: FilmDaysData, countDelay: number) {
  const [today, setToday] = useState<number | null>(null)
  useEffect(() => {
    const id = setTimeout(() => { const t = new Date(); setToday(new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) }, 0)
    return () => clearTimeout(id)
  }, [])
  const start = dayStart(inv.filmDaysStart)
  const wed = inv.wedding?.showDate === false ? null : dayStart(inv.wedding?.date)
  const together = today != null && start != null && start <= today ? Math.floor((today - start) / DAY_MS) + 1 : null
  const dday = today != null && wed != null ? Math.round((wed - today) / DAY_MS) : null
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (together == null) return
    let raf = 0, t0 = 0
    const tick = (now: number) => {
      if (!t0) t0 = now
      const u = Math.min(1, Math.max(0, (now - t0 - countDelay * 1000) / 1500))
      setCount(Math.round(together * (1 - Math.pow(1 - u, 3))))
      if (u < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [together, countDelay])
  return { today, together, dday, count, wed }
}

function common(inv: FilmDaysData, together: number | null, count: number) {
  const en = !!(inv.groom?.nameEn && inv.bride?.nameEn)
  const g = en ? inv.groom!.nameEn! : (inv.groom?.name || '신랑')
  const b = en ? inv.bride!.nameEn! : (inv.bride?.name || '신부')
  const shown = together != null ? count : null
  const fill = (t: string, n: number | null) => t.replace(/\{N\}/g, n != null ? String(n) : '')
  const title = inv.filmDaysTitle?.trim() ? fill(inv.filmDaysTitle, shown) : together != null ? `${shown} DAYS\nTOGETHER` : 'OUR\nWEDDING DAY'
  const message = inv.filmDaysMessage?.trim() ? fill(inv.filmDaysMessage, together) : together != null
    ? `${together}일 전, 서로를 처음 만난 두 사람.\n같은 장면을 함께 보며 웃고 울던 날들이 모여\n이제 가장 긴 이야기를 시작하려 합니다.`
    : '서로를 만나 같은 장면을 함께 보며 웃고 울던 두 사람이\n이제 가장 긴 이야기를 시작하려 합니다.'
  const photo = inv.filmDaysImage || inv.media?.coverImage || ''
  const crop: Crop = inv.filmDaysImage ? (inv.filmDaysImageSettings || {}) : (inv.media?.coverImageSettings || {})
  const wd = inv.wedding?.date ? new Date(inv.wedding.date) : null
  const okDate = !!wd && !isNaN(wd.getTime()) && inv.wedding?.showDate !== false
  return { g, b, title, message, photo, crop, wd: okDate ? wd : null }
}

const KEYFRAMES = '@keyframes fdUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes fdRise{from{transform:translateY(105%)}to{transform:none}}@keyframes fdZoom{from{opacity:0;transform:scale(1.14)}to{opacity:1;transform:scale(1)}}@keyframes fdBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes fdTicket{from{opacity:0;transform:translateY(70px) rotate(3deg)}to{opacity:1;transform:none}}@keyframes fdBars{from{transform:scaleY(0)}to{transform:scaleY(1)}}@keyframes fdScan{0%{opacity:0;left:-4%}10%{opacity:1}90%{opacity:1}100%{opacity:0;left:100%}}@keyframes fdCheck{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}@keyframes fdPop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}@keyframes fdFade{0%{opacity:0}12%{opacity:1}82%{opacity:1}100%{opacity:0}}@keyframes fdBreath{0%,100%{opacity:.6}50%{opacity:1}}'
const up = (d: number, dur = 0.9) => ({ animation: `fdUp ${dur}s cubic-bezier(.2,.7,.2,1) ${d}s both` })
const Lines = ({ text, delay }: { text: string; delay: number }) => (
  <>
    {text.split('\n').map((ln, i) => (
      <span key={i} style={{ display: 'block', overflow: 'hidden', paddingBottom: 2 }}>
        <span style={{ display: 'block', animation: `fdRise 1s cubic-bezier(.2,.7,.2,1) ${delay + i * 0.14}s both` }}>{ln}</span>
      </span>
    ))}
  </>
)

/* ================= A. OTT 작품 상세 ================= */
export function FilmOttCover({ invitation, onEnter, isPreview }: { invitation: FilmDaysData; onEnter: () => void; isPreview?: boolean }) {
  useFontLink()
  const { today, together, dday, count } = useDays(invitation, 0.9)
  const { g, b, title, message, photo, crop, wd } = common(invitation, together, count)
  const [liked, setLiked] = useState(false)
  const bg = invitation.filmDaysBg || '#0F0F12'
  const pointRaw = invitation.filmDaysInk || '#F3EDE4'   // 제목·청첩장 보기 버튼·이어보기 막대
  const dark = isDarkHex(bg)
  const ink = dark ? '#FFFFFF' : '#141414'
  const sub = dark ? 'rgba(255,255,255,.62)' : 'rgba(0,0,0,.55)'
  const soft = dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.07)'
  // 제목은 포인트색 (배경과 너무 비슷해 안 읽히면 기본 글자색)
  const point = readable(pointRaw, bg, ink)
  const titleColor = point
  const genre = invitation.filmOttGenre?.trim() || 'Romance'
  const meta = [wd ? String(wd.getFullYear()) : '', genre].filter(Boolean)
  const dateTxt = wd ? `${String(wd.getDate()).padStart(2, '0')}.${String(wd.getMonth() + 1).padStart(2, '0')}.${String(wd.getFullYear()).slice(2)}` : ''
  const ddayTxt = dday == null || dday < 0 ? '' : dday === 0 ? 'D-DAY' : `D-${dday}`
  // 이어보기 막대: 처음 만난 날부터 결혼식까지 중 오늘까지 온 만큼
  const progress = together != null && dday != null && dday >= 0 ? together / (together + dday) : together != null ? 1 : null

  return (
    <div className="relative w-full select-none" onClick={onEnter}
      style={{ height: coverHeight(isPreview), overflow: 'hidden', background: bg, color: ink, fontFamily: SANS, cursor: 'pointer' }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      {/* 큰 사진: 천천히 당겨지며 들어오고 아래는 배경색으로 녹아든다 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '64%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, animation: 'fdZoom 2.4s cubic-bezier(.2,.7,.2,1) .1s both' }}>
          {photo && <CroppedImageDiv src={photo} crop={crop} className="absolute inset-0" style={crop.cropWidth ? undefined : { backgroundSize: 'cover', backgroundPosition: 'center' }} />}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${bg}55 0%, transparent 18%, transparent 45%, ${bg} 99%)` }} />
      </div>
      <div style={{ position: 'absolute', top: 20, left: 22, fontSize: 10, fontWeight: 600, letterSpacing: '.28em', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.35)', ...up(0.5) }}>A LOVE STORY</div>

      {today != null && (
        <div style={{ position: 'absolute', left: 22, right: 22, bottom: 26 }}>
          <h1 style={{ margin: 0, color: titleColor, fontSize: 34, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-.025em', textTransform: 'uppercase', fontVariantNumeric: 'tabular-nums' }}>
            <Lines text={title} delay={0.7} />
          </h1>
          {/* 정보 줄 */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12, fontSize: 11.5, color: sub, ...up(1.35) }}>
            {meta.map((m, i) => <span key={i}>{m}</span>)}
            {ddayTxt && <span style={{ padding: '1px 5px', border: `1px solid ${sub}`, borderRadius: 3, fontSize: 10, fontWeight: 600, color: ink }}>{ddayTxt}</span>}
            {dateTxt && <span>♥ {dateTxt}</span>}
          </div>
          {/* 버튼 */}
          <div style={{ marginTop: 14, display: 'grid', gap: 7, ...up(1.65) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 38, borderRadius: 6, background: point, color: isDarkHex(point) ? '#fff' : '#141414', fontSize: 13.5, fontWeight: 700 }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
              청첩장 보기
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setLiked((v) => !v) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 38, borderRadius: 6, background: soft, color: ink, fontSize: 13, fontWeight: 600, border: 0, fontFamily: SANS, cursor: 'pointer' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill={liked ? '#E5484D' : 'none'} stroke={liked ? '#E5484D' : 'currentColor'} strokeWidth="2" aria-hidden style={{ transition: 'all .25s' }}>
                <path d="M12 20s-7-4.4-9.3-8.8C1.2 8 3 4.5 6.4 4.5c2.1 0 3.4 1.2 4.1 2.3h3c.7-1.1 2-2.3 4.1-2.3 3.4 0 5.2 3.5 3.7 6.7C19 15.6 12 20 12 20z" />
              </svg>
              {liked ? '찜했어요' : '찜하기'}
            </button>
          </div>
          {/* 줄거리 · 출연 */}
          <p style={{ margin: '14px 0 0', fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-line', color: dark ? 'rgba(255,255,255,.86)' : 'rgba(0,0,0,.78)', ...up(1.95) }}>{message}</p>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: sub, ...up(2.15) }}>출연: {g}, {b}</p>
          {/* 이어보기 */}
          {progress != null && (
            <div style={{ marginTop: 14, ...up(2.35) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: sub, marginBottom: 5 }}>
                <span>{together}일째 함께 보는 중</span>
                {ddayTxt && <span>결혼식까지 {ddayTxt}</span>}
              </div>
              <div style={{ height: 3, borderRadius: 3, background: soft, overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(3, progress * 100)}%`, height: '100%', background: point, transformOrigin: 'left', animation: 'fdBar 1.6s cubic-bezier(.2,.7,.2,1) 2.6s both' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ================= B. 예매 완료 모바일 티켓 ================= */
export function FilmTicketCover({ invitation, onEnter, isPreview }: { invitation: FilmDaysData; onEnter: () => void; isPreview?: boolean }) {
  useFontLink()
  const { today, together, count } = useDays(invitation, 1.3)
  const { g, b, title, photo, crop, wd } = common(invitation, together, count)
  const bg = invitation.filmDaysBg || '#ECE9E4'
  const point = invitation.filmDaysInk || '#2B2A28'      // 체크 표시·제목·스캔 선
  const dark = isDarkHex(bg)
  const ink = dark ? '#F4F1EC' : '#1c1c1c'
  // 배경이 흰색에 가까우면 흰 티켓이 묻히지 않게 테두리를 그린다
  const edge = (lum(bg) ?? 0) > 0.9 ? '#E4DFD8' : 'transparent'
  const w = invitation.wedding
  const DOW = ['일', '월', '화', '수', '목', '금', '토']
  const dateTxt = wd ? `${wd.getFullYear()}.${String(wd.getMonth() + 1).padStart(2, '0')}.${String(wd.getDate()).padStart(2, '0')} (${DOW[wd.getDay()]})` : '추후 안내'
  const timeTxt = wd ? (w?.timeDisplay || w?.time || '') : ''
  const venue = w?.showVenue === false ? '' : [w?.venue?.name, w?.venue?.hall].filter(Boolean).join(' ')
  const seat = invitation.filmTicketSeat?.trim() || 'YOU & ME'
  const code = `DD-${wd ? `${wd.getFullYear()}${String(wd.getMonth() + 1).padStart(2, '0')}${String(wd.getDate()).padStart(2, '0')}` : '00000000'}-${(w?.time || '0000').replace(':', '')}`
  // 바코드: 이름으로 정해지는 굵기 (매번 같은 모양)
  const bars = useMemo(() => {
    let h = 0; for (const c of `${g}${b}${code}`) h = (h * 31 + c.charCodeAt(0)) >>> 0
    const out: number[] = []
    for (let i = 0; i < 46; i++) { h = (h * 1103515245 + 12345) >>> 0; out.push(1 + ((h >> 16) % 3)) }
    return out
  }, [g, b, code])
  const label = { fontSize: 8.5, fontWeight: 600, letterSpacing: '.12em', color: '#9a958e' } as const
  const value = { fontSize: 12, fontWeight: 600, color: '#1c1c1c', marginTop: 2, lineHeight: 1.3 } as const
  // 입장: 누르면 '예매가 완료되었어요' 팝업이 잠깐 떴다 사라진 뒤 본문으로
  const [leaving, setLeaving] = useState(false)
  // 부모가 다시 그려져 onEnter 가 새로 와도 타이머가 다시 시작되지 않게 ref 로 들고 있는다
  const enterRef = useRef(onEnter)
  useEffect(() => { enterRef.current = onEnter }, [onEnter])
  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => enterRef.current(), 1700)
    return () => clearTimeout(t)
  }, [leaving])

  return (
    <div className="relative w-full select-none" onClick={() => setLeaving(true)}
      style={{ height: coverHeight(isPreview), overflow: 'hidden', background: bg, color: ink, fontFamily: SANS, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      {today != null && <>
        <div style={{ flex: '1.1 1 0', minHeight: 14 }} />
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.3em', opacity: 0.55, ...up(0.3) }}>MOBILE TICKET</div>
        <div style={{ flex: '0.45 1 0', minHeight: 12 }} />
        {/* 티켓 */}
        <div style={{ width: '80%', maxWidth: 320, background: '#fff', borderRadius: 18, border: `1px solid ${edge}`, boxShadow: '0 14px 34px rgba(0,0,0,.14)', animation: 'fdTicket 1.1s cubic-bezier(.2,.7,.2,1) .9s both', position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1.55', borderRadius: '18px 18px 0 0', overflow: 'hidden', background: '#ddd' }}>
            {photo && <CroppedImageDiv src={photo} crop={crop} className="absolute inset-0" style={crop.cropWidth ? undefined : { backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          </div>
          <div style={{ padding: '14px 18px 12px' }}>
            <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-.02em', color: readable(point, '#FFFFFF', '#1c1c1c'), textTransform: 'uppercase', fontVariantNumeric: 'tabular-nums' }}>
              <Lines text={title} delay={1.3} />
            </div>
            <div style={{ fontSize: 11, color: '#6f6a64', marginTop: 5, ...up(1.5) }}>{g} &amp; {b}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px', marginTop: 12, ...up(1.7) }}>
              <div><div style={label}>DATE</div><div style={value}>{dateTxt}</div></div>
              <div><div style={label}>TIME</div><div style={value}>{timeTxt || '-'}</div></div>
              <div><div style={label}>THEATER</div><div style={value}>{venue || '추후 안내'}</div></div>
              <div><div style={label}>SEAT</div><div style={value}>{seat}</div></div>
            </div>
          </div>
          {/* 절취선 */}
          <div style={{ position: 'relative', height: 16 }}>
            <div style={{ position: 'absolute', left: 14, right: 14, top: 8, borderTop: '1.5px dashed #DAD5CE' }} />
            {/* 양옆 반원 홈: 카드 안쪽 반만 보이게 */}
            {(['left', 'right'] as const).map((side) => (
              <div key={side} style={{ position: 'absolute', [side]: -1, top: -1, width: 10, height: 20, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', [side]: -10, top: 0, width: 20, height: 20, borderRadius: 99, background: bg, border: `1px solid ${edge}`, boxSizing: 'border-box', boxShadow: 'inset 0 1px 3px rgba(0,0,0,.08)' }} />
              </div>
            ))}
          </div>
          {/* 바코드 + 스캔 */}
          <div style={{ padding: '6px 18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 1.5, height: 34, overflow: 'hidden' }}>
              {bars.map((wv, i) => (
                <span key={i} style={{ width: wv, background: i % 2 ? 'transparent' : '#1c1c1c', transformOrigin: 'bottom', animation: `fdBars .35s ease-out ${2.0 + i * 0.012}s both` }} />
              ))}
              <span style={{ position: 'absolute', top: -2, bottom: -2, width: 3, background: point, boxShadow: `0 0 10px ${point}`, animation: 'fdScan 1.1s ease-in-out 2.8s both' }} />
            </div>
            <div style={{ fontSize: 8.5, letterSpacing: '.18em', color: '#9a958e', marginTop: 5, ...up(2.2) }}>{code}</div>
          </div>
        </div>
        <div style={{ flex: '0.7 1 0', minHeight: 12 }} />
        <div style={{ fontSize: 11.5, opacity: 0.75, animation: 'fdUp .9s cubic-bezier(.2,.7,.2,1) 3.6s both, fdBreath 2.2s ease-in-out 4.6s infinite' }}>화면을 눌러 입장하기</div>
        <div style={{ flex: '0.9 1 0', minHeight: 14 }} />
      </>}
      {/* 예매 완료 팝업 */}
      {leaving && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.38)', animation: 'fdFade 1.7s ease both', zIndex: 5 }}>
          <div style={{ width: '68%', maxWidth: 260, padding: '22px 18px 20px', borderRadius: 18, background: '#fff', color: '#1c1c1c', textAlign: 'center', boxShadow: '0 18px 40px rgba(0,0,0,.22)', animation: 'fdPop .5s cubic-bezier(.2,.7,.2,1) both' }}>
            <div style={{ width: 40, height: 40, margin: '0 auto', borderRadius: 99, background: readable(point, '#FFFFFF', '#1c1c1c'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={isDarkHex(readable(point, '#FFFFFF', '#1c1c1c')) ? '#fff' : '#1c1c1c'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.2 4.2L19 7" strokeDasharray="24" style={{ animation: 'fdCheck .45s ease-out .25s both' }} />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>예매가 완료되었어요</div>
            <div style={{ fontSize: 11, color: '#8a857e', marginTop: 4, letterSpacing: '.02em' }}>Your wedding ticket is ready</div>
          </div>
        </div>
      )}
    </div>
  )
}
