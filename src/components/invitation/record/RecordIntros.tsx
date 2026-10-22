'use client'

// 레코드 템플릿 인트로 (CD PLAYER 는 InvitationClientRecord 의 VinylRecordCover)
//  · 함께한 날: 'N DAYS TOGETHER' 제목 + 흑백 사진 카드(날짜 태그) + 작은 LP 수록곡 줄 + 짧은 편지 + 크레딧 한 줄.
//  · LP 커버: 큰 숫자 제목 + 작은 정사각 앨범 커버 뒤로 LP 가 미끄러져 나와 돈다 + 날짜 스티커 + 크레딧 (함께한 날 설정 공용, 사진만 따로).
import { useEffect, useState } from 'react'
import { getBgmPresetByUrl } from '@/lib/bgmPresets'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import { parseDateOnly } from '@/lib/dateOnly'

function useFontLink(id: string, href: string) {
  useEffect(() => {
    if (document.querySelector(`link[data-rec-font="${id}"]`)) return
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-rec-font', id)
    document.head.appendChild(l)
  }, [id, href])
}
type Crop = { cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number; scale?: number; positionX?: number; positionY?: number }
/** 인트로가 쓰는 청첩장 필드만 */
export interface RecordIntroData {
  groom?: { name?: string; nameEn?: string }
  bride?: { name?: string; nameEn?: string }
  wedding?: { date?: string; time?: string; showDate?: boolean; showVenue?: boolean; venue?: { name?: string; address?: string } }
  bgm?: { enabled?: boolean; url?: string }
  media?: { coverImage?: string; coverImageSettings?: Crop }
  recordDaysLabel?: string; recordDaysStart?: string; recordDaysTitle?: string
  recordDaysImage?: string; recordDaysImageSettings?: Crop; recordDaysTone?: string
  recordDaysSong?: string; recordDaysArtist?: string; recordDaysMessage?: string
  recordDaysBg?: string; recordDaysInk?: string
  recordLpImage?: string; recordLpImageSettings?: Crop
}
const coverHeight = (isPreview?: boolean) => (isPreview ? 660 : '100dvh')

function names(inv: RecordIntroData) {
  const en = !!(inv.groom?.nameEn && inv.bride?.nameEn)
  return {
    en,
    g: en ? inv.groom!.nameEn! : (inv.groom?.name || '신랑'),
    b: en ? inv.bride!.nameEn! : (inv.bride?.name || '신부'),
  }
}
/** 배경음악으로 고른 기본 곡의 이름·아티스트 (직접 올린 음악이면 없음) */
function bgmSong(inv: RecordIntroData) {
  return inv.bgm?.enabled && inv.bgm.url ? getBgmPresetByUrl(inv.bgm.url) : undefined
}
/* ================= 함께한 날 ================= */
const DAY_MS = 86400000
/** 'YYYY-MM-DD' → 그날 0시 (현지) */
const dayStart = (v?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : null
}
const DAYS_WINE = '#6E2B33'
/** 배경이 어두운지 (글자색을 밝게 바꿀지) */
const isDarkHex = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()); if (!m) return false
  const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
}

/** 함께한 날 화면 구성 (비교용 변형) */
export interface DaysVariant { player?: 'card' | 'lp'; photo?: 'wide' | 'square'; title?: 'stack' | 'bignum'; footer?: 'pills' | 'credit' }

export function RecordDaysCover({ invitation, onEnter, isPreview, variant }: { invitation: RecordIntroData; onEnter: () => void; isPreview?: boolean; variant?: DaysVariant }) {
  useFontLink('days', 'https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@600&family=Old+Standard+TT:ital@0;1&family=Noto+Sans+KR:wght@400;500&display=swap')
  // 날짜 계산은 브라우저에서만 (서버 렌더와 '오늘'이 달라 생기는 불일치 방지)
  const [today, setToday] = useState<number | null>(null)
  useEffect(() => {
    const id = setTimeout(() => { const t = new Date(); setToday(new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) }, 0)
    return () => clearTimeout(id)
  }, [])

  const start = dayStart(invitation.recordDaysStart)
  const wed = invitation.wedding?.showDate === false ? null : dayStart(invitation.wedding?.date)
  const together = today != null && start != null && start <= today ? Math.floor((today - start) / DAY_MS) + 1 : null
  const dday = today != null && wed != null ? Math.round((wed - today) / DAY_MS) : null
  const fill = (t: string, n: number | null) => t.replace(/\{N\}/g, n != null ? String(n) : '')
  // 함께한 날 수는 0 부터 올라가며 센다
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (together == null) return
    let raf = 0, t0 = 0
    const DELAY = 750, DUR = 1500
    const tick = (now: number) => {
      if (!t0) t0 = now
      const u = Math.min(1, Math.max(0, (now - t0 - DELAY) / DUR))
      setCount(Math.round(together * (1 - Math.pow(1 - u, 3))))
      if (u < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [together])
  const shownN = together != null ? count : null
  const title = invitation.recordDaysTitle?.trim() ? fill(invitation.recordDaysTitle, shownN) : together != null ? `${shownN} DAYS\nTOGETHER` : 'FOREVER\nTOGETHER'
  const message = invitation.recordDaysMessage?.trim() ? fill(invitation.recordDaysMessage, together) : together != null
    ? `It's been ${together} days since you said yes to me,\nand they have been the best days of my life. love you.`
    : 'Every day with you has been the best day of my life.\nNow we are starting forever. love you.'
  const label = invitation.recordDaysLabel ?? 'dear love'
  const wd = invitation.wedding?.date ? parseDateOnly(invitation.wedding.date) : null
  const year = wd && !isNaN(wd.getTime()) ? wd.getFullYear() : today != null ? new Date(today).getFullYear() : ''
  const tag = wed != null && wd ? `${String(wd.getDate()).padStart(2, '0')}.${String(wd.getMonth() + 1).padStart(2, '0')}.${String(wd.getFullYear()).slice(2)}` : ''
  const nm = names(invitation)
  const preset = bgmSong(invitation)
  const song = invitation.recordDaysSong?.trim() || preset?.name || 'Forever Starts Today'
  const artist = invitation.recordDaysArtist?.trim() || preset?.artist || `${nm.g} & ${nm.b}`
  // 사진: 함께한 날(가로) · LP 커버(정사각) 는 따로 고른다
  const sq = variant?.photo === 'square'
  const own = sq ? invitation.recordLpImage : invitation.recordDaysImage
  const photo = own || invitation.media?.coverImage || ''
  const crop: Crop = own ? ((sq ? invitation.recordLpImageSettings : invitation.recordDaysImageSettings) || {}) : (invitation.media?.coverImageSettings || {})
  const album = invitation.media?.coverImage || photo
  const albumCrop: Crop = invitation.media?.coverImage ? (invitation.media?.coverImageSettings || {}) : crop
  const mono = invitation.recordDaysTone !== 'color'
  const left = dday == null || dday < 0 ? 'with love' : dday === 0 ? 'D-DAY' : `D-${dday}`
  // 편지는 플레이어가 나온 뒤 한 글자씩 타자로 찍힌다
  const TYPE_AT = 4.1, TYPE_MS = 26
  const [typed, setTyped] = useState(0)
  useEffect(() => {
    if (today == null) return
    let i = 0
    let iv: ReturnType<typeof setInterval> | undefined
    const t = setTimeout(() => { iv = setInterval(() => { i++; setTyped(i); if (i >= message.length && iv) clearInterval(iv) }, TYPE_MS) }, TYPE_AT * 1000)
    return () => { clearTimeout(t); if (iv) clearInterval(iv) }
  }, [today, message])
  const typedEnd = TYPE_AT + (message.length * TYPE_MS) / 1000

  const up = (d: number) => ({ animation: `rdUp 1s cubic-bezier(.2,.7,.2,1) ${d}s both` })
  const gap = (n: number) => <div style={{ flex: `${n} 1 0`, minHeight: 8 }} />
  const serif = "'Old Standard TT', 'Times New Roman', serif"
  const sans = "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif"
  const icon = { width: 12, height: 12, fill: '#1c1c1c' }
  // 배경·포인트(제목·하트) 색은 자유롭게. 배경이 어두우면 글자·버튼을 밝게
  const bg = invitation.recordDaysBg || '#FFFFFF'
  const point = invitation.recordDaysInk || DAYS_WINE
  const dark = isDarkHex(bg)
  const ink = dark ? '#F4F1EC' : '#1c1c1c'
  // 기본(함께한 날) = 가로 사진 + 작은 LP 수록곡 줄 + 크레딧. card·pills 는 예전 구성 (비교용으로만 남김)
  const V = { player: variant?.player || 'lp', photo: variant?.photo || 'wide', title: variant?.title || 'stack', footer: variant?.footer || 'credit' }
  const bigN = V.title === 'bignum' && together != null && !invitation.recordDaysTitle?.trim()
  const rule = dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.14)'
  const venue = invitation.wedding?.showVenue === false ? '' : (invitation.wedding?.venue?.name || '')
  const zilla = "'Zilla Slab', 'Rockwell', serif"
  const nums = { fontVariantNumeric: 'lining-nums tabular-nums', fontFeatureSettings: '"lnum" 1, "tnum" 1' } as const
  // 돌아가는 LP (가운데 라벨은 앨범 커버)
  const disc = (spinAt: number) => (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: 'repeating-radial-gradient(circle at 50% 50%, #151515 0 1.4px, #232323 1.4px 2.8px)', boxShadow: '0 6px 16px rgba(0,0,0,.22)', animation: `rdSpin 3.2s linear ${spinAt}s infinite` }}>
      <div style={{ position: 'absolute', inset: '31%', borderRadius: '50%', overflow: 'hidden', background: point }}>
        {album && <CroppedImageDiv src={album} crop={albumCrop} className="absolute inset-0" style={albumCrop.cropWidth ? undefined : { backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5, borderRadius: '50%', background: '#e9e4dc' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 20deg, transparent 0 18%, rgba(255,255,255,.12) 24%, transparent 30% 68%, rgba(255,255,255,.09) 74%, transparent 80%)' }} />
    </div>
  )
  const eq = (color: string, at: number) => (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 1.5, height: 10 }}>
      {[0, 0.22, 0.44].map((d) => <span key={d} style={{ width: 2, height: 10, background: color, transformOrigin: 'bottom', animation: `rdEq .9s ease-in-out ${at + d}s infinite both` }} />)}
    </span>
  )

  return (
    <div className="relative w-full select-none" onClick={onEnter}
      style={{ height: coverHeight(isPreview), overflow: 'hidden', background: bg, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: ink }}>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes rdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes rdRise{from{transform:translateY(105%)}to{transform:none}}@keyframes rdDotL{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}@keyframes rdDotR{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}@keyframes rdDev{0%{filter:blur(10px) brightness(1.7) saturate(0)}100%{filter:none}}@keyframes rdDrop{0%{opacity:0;transform:translate(-50%,-22px) rotate(-9deg) scale(1.08)}55%{opacity:1;transform:translate(-50%,3px) rotate(2deg) scale(1)}100%{opacity:1;transform:translate(-50%,0) rotate(0)}}@keyframes rdEq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}@keyframes rdBreath{0%,100%{opacity:.75}50%{opacity:1}}@keyframes rdSpin{to{transform:rotate(360deg)}}@keyframes rdSlide{from{transform:translateX(0)}to{transform:translateX(46%)}}@keyframes rdSticker{0%{opacity:0;transform:scale(1.7) rotate(-34deg)}70%{opacity:1;transform:scale(.94) rotate(-8deg)}100%{opacity:1;transform:scale(1) rotate(-10deg)}}' }} />
      {today != null && <>
        {gap(2.6)}
        {/* dear love · 연도 */}
        <div style={{ textAlign: 'center', fontFamily: serif, ...up(0.2) }}>
          {label && <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 12.5 }}>
            <span style={{ width: 3, height: 3, borderRadius: 9, background: ink, animation: 'rdDotL 1.2s cubic-bezier(.2,.7,.2,1) .35s both' }} />{label}<span style={{ width: 3, height: 3, borderRadius: 9, background: ink, animation: 'rdDotR 1.2s cubic-bezier(.2,.7,.2,1) .35s both' }} />
          </div>}
          {year !== '' && <div style={{ fontSize: 8.5, marginTop: 2, letterSpacing: '.04em' }}>{year}</div>}
        </div>
        {gap(2.4)}
        {/* N DAYS TOGETHER — 큰 숫자형 / 두 줄형 */}
        {bigN ? (
          <div style={{ textAlign: 'center', color: point }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: zilla, fontWeight: 600, fontSize: 72, lineHeight: 0.95, letterSpacing: '-.03em', ...nums, animation: 'rdRise 1.1s cubic-bezier(.2,.7,.2,1) .6s both' }}>{count}</div>
            </div>
            <div style={{ fontFamily: serif, fontSize: 11, letterSpacing: '.34em', marginTop: 8, paddingLeft: '.34em', ...up(1.0) }}>DAYS TOGETHER</div>
          </div>
        ) : (
          <h1 style={{ margin: 0, textAlign: 'center', fontFamily: "'Zilla Slab', 'Rockwell', serif", fontWeight: 600, fontSize: 25, lineHeight: 1.02, letterSpacing: '-.01em', color: point, fontVariantNumeric: 'lining-nums tabular-nums', fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>
            {title.split('\n').map((ln, i) => (
              <span key={i} style={{ display: 'block', overflow: 'hidden', paddingBottom: 2 }}>
                <span style={{ display: 'block', animation: `rdRise 1.1s cubic-bezier(.2,.7,.2,1) ${0.6 + i * 0.16}s both` }}>{ln}</span>
              </span>
            ))}
          </h1>
        )}
        {gap(1.7)}
        {V.photo === 'square' ? (
          /* 정사각 앨범 커버 + 동그란 날짜 스티커 (LP 형이면 커버 뒤에서 판이 미끄러져 나와 돈다) */
          <>
            <div style={{ position: 'relative', width: '40%', maxWidth: 178, marginLeft: V.player === 'lp' ? '-15%' : 0, ...up(1.7) }}>
              {V.player === 'lp' && (
                <div style={{ position: 'absolute', top: '4%', right: 0, width: '92%', aspectRatio: '1', animation: 'rdSlide 1.4s cubic-bezier(.2,.7,.2,1) 2.5s both' }}>{disc(3.6)}</div>
              )}
              {/* 현상 효과(흐림)는 사진에만 — 커버 칸까지 흐리면 가장자리가 비쳐 뒤의 LP 판이 미리 보인다 */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 3, overflow: 'hidden', background: '#ddd', boxShadow: '0 10px 26px rgba(0,0,0,.18)' }}>
                <div className="absolute inset-0" style={{ animation: 'rdDev 2s ease-out 1.75s both' }}>
                  {photo && <CroppedImageDiv src={photo} crop={crop} className="absolute inset-0"
                    style={{ ...(crop.cropWidth ? {} : { backgroundSize: 'cover', backgroundPosition: 'center' }), filter: mono ? 'grayscale(1) contrast(1.06)' : undefined }} />}
                </div>
              </div>
              {tag && (
                <div style={{ position: 'absolute', ...(V.player === 'lp' ? { left: -14, bottom: -12 } : { right: -14, top: -14 }), width: 52, height: 52, borderRadius: '50%', background: point, color: isDarkHex(point) ? '#FFF8F0' : '#1c1c1c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,.18)', fontFamily: serif, ...nums, animation: 'rdSticker .8s cubic-bezier(.2,.7,.2,1) 2.9s both' }}>
                  <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden><path d="M12 21s-7.5-4.6-10-9.3C.3 8.2 2.3 4 6.2 4c2.3 0 3.8 1.3 4.6 2.6h2.4C14 5.3 15.5 4 17.8 4c3.9 0 5.9 4.2 4.2 7.7C19.5 16.4 12 21 12 21z" /></svg>
                  <span style={{ fontSize: 11.5, lineHeight: 1.1, marginTop: 1 }}>{tag.slice(0, 5)}</span>
                  <span style={{ fontSize: 8.5, letterSpacing: '.08em', opacity: 0.85 }}>20{tag.slice(6)}</span>
                </div>
              )}
            </div>
            <div style={{ height: 18 }} />
          </>
        ) : (
          <>
          {/* 사진 카드 + 날짜 태그 */}
          <div style={{ position: 'relative', width: '66%', maxWidth: 300, ...up(1.7) }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1.72', borderRadius: 16, overflow: 'hidden', background: '#ddd', animation: 'rdDev 2s ease-out 1.75s both' }}>
              {photo && <CroppedImageDiv src={photo} crop={crop} className="absolute inset-0"
                style={{ ...(crop.cropWidth ? {} : { backgroundSize: 'cover', backgroundPosition: 'center' }), filter: mono ? 'grayscale(1) contrast(1.06)' : undefined }} />}
            </div>
            {tag && (
              <div style={{ position: 'absolute', left: '50%', bottom: -15, display: 'flex', alignItems: 'center', gap: 7, padding: '6px 22px', background: '#fff', borderRadius: 6, border: '1px solid #ECE7E7', boxShadow: '0 2px 8px rgba(0,0,0,.08)', color: '#1c1c1c', fontFamily: serif, fontSize: 12.5, whiteSpace: 'nowrap', animation: 'rdDrop .9s cubic-bezier(.2,.7,.2,1) 2.9s both' }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill={point} aria-hidden><path d="M12 21s-7.5-4.6-10-9.3C.3 8.2 2.3 4 6.2 4c2.3 0 3.8 1.3 4.6 2.6h2.4C14 5.3 15.5 4 17.8 4c3.9 0 5.9 4.2 4.2 7.7C19.5 16.4 12 21 12 21z" /></svg>
                {tag}
              </div>
            )}
          </div>
          <div style={{ height: tag ? 26 : 12 }} />
          </>
        )}
        {gap(0.25)}
        {V.player === 'lp' ? (
          /* 앨범 수록곡 한 줄 (가로 사진형이면 왼쪽에 작은 LP) */
          <div style={{ width: '72%', maxWidth: 316, display: 'flex', alignItems: 'center', gap: 11, padding: '9px 2px', borderTop: `1px solid ${rule}`, borderBottom: `1px solid ${rule}`, fontFamily: serif, ...up(3.3) }}>
            {V.photo !== 'square' && <div style={{ width: 44, height: 44, flexShrink: 0 }}>{disc(3.6)}</div>}
            <span style={{ fontSize: 9, letterSpacing: '.16em', opacity: 0.55 }}>A1</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song}</div>
              <div style={{ fontSize: 9.5, opacity: 0.6, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</div>
            </div>
            {eq(point, 3.9)}
          </div>
        ) : (
          <>
          {/* 음악 플레이어 카드 */}
          <div style={{ width: '68%', maxWidth: 308, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 14, background: 'linear-gradient(100deg, #EDF2EE, #F5EEF0 62%, #F2EDF0)', color: '#1c1c1c', fontFamily: sans, ...up(3.3) }}>
            <div style={{ position: 'relative', width: 42, height: 42, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#cfcfcf' }}>
              {album && <CroppedImageDiv src={album} crop={albumCrop} className="absolute inset-0" style={albumCrop.cropWidth ? undefined : { backgroundSize: 'cover', backgroundPosition: 'center' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 7.5, color: '#777' }}>
                <span style={{ width: 8, height: 8, borderRadius: 9, background: '#7d7d7d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="6" height="6" fill="#fff" aria-hidden><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></svg>
                </span>
                our song ★
                <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 1, height: 7, marginLeft: 3 }}>
                  {[0, 0.25, 0.5].map((d) => <span key={d} style={{ width: 1.5, height: 7, background: '#7d7d7d', transformOrigin: 'bottom', animation: `rdEq .9s ease-in-out ${3.8 + d}s infinite both` }} />)}
                </span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song}</div>
              <div style={{ fontSize: 9, color: '#555', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#1c1c1c" strokeWidth="2.4" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg viewBox="0 0 24 24" style={icon} aria-hidden><path d="M6 5h2.4v14H6zM20 5v14L9.5 12z" /></svg>
                <svg viewBox="0 0 24 24" style={{ ...icon, animation: 'rdBreath 2.4s ease-in-out infinite' }} aria-hidden><path d="M6.5 5h3.6v14H6.5zM13.9 5h3.6v14h-3.6z" /></svg>
                <svg viewBox="0 0 24 24" style={icon} aria-hidden><path d="M15.6 5H18v14h-2.4zM4 5l10.5 7L4 19z" /></svg>
              </div>
            </div>
          </div>
          </>
        )}
        {gap(1.7)}
        {/* 짧은 편지 */}
        <p style={{ margin: 0, width: '78%', textAlign: 'center', whiteSpace: 'pre-line', fontFamily: serif, fontSize: 10, lineHeight: 1.4, color: ink, opacity: 0.9 }}>{message.slice(0, typed)}<span style={{ opacity: 0 }}>{message.slice(typed)}</span></p>
        {gap(1.3)}
        {V.footer === 'credit' ? (
          /* 레코드 크레딧 한 줄 + 재생 안내 */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: serif, fontSize: 10, letterSpacing: '.06em', opacity: 0.8, ...nums, ...up(typedEnd + 0.2) }}>
              <span style={{ width: 16, height: 1, background: ink, opacity: 0.5 }} />
              {[left === 'with love' ? '' : left, tag, venue].filter(Boolean).join('  ·  ')}
              <span style={{ width: 16, height: 1, background: ink, opacity: 0.5 }} />
            </div>
            <div style={{ fontFamily: sans, fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 6, color: dark ? '#fff' : '#555', animation: `rdUp 1s cubic-bezier(.2,.7,.2,1) ${typedEnd + 0.5}s both, rdBreath 2.2s ease-in-out ${typedEnd + 1.5}s infinite` }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden><path d="M7 4.5v15l13-7.5z" /></svg>
              화면을 눌러 청첩장 열기
            </div>
          </div>
        ) : (
          <>
          {/* 아래 두 버튼: D-day · 청첩장 열기 */}
          <div style={{ display: 'flex', gap: '12%', width: '68%', justifyContent: 'center', fontFamily: sans, fontSize: 10, color: dark ? 'rgba(255,255,255,.7)' : '#8a8a8a', ...up(typedEnd + 0.2) }}>
            <span style={{ flex: '0 1 38%', textAlign: 'center', padding: '6px 0', borderRadius: 999, background: dark ? 'rgba(255,255,255,.14)' : '#F2F2F2', letterSpacing: '.03em' }}>{left}</span>
            <span style={{ flex: '0 1 38%', textAlign: 'center', padding: '6px 0', borderRadius: 999, background: dark ? 'rgba(255,255,255,.14)' : '#F2F2F2', color: dark ? '#fff' : '#555', animation: `rdBreath 2.2s ease-in-out ${typedEnd + 1.2}s infinite` }}>청첩장 열기</span>
          </div>
          </>
        )}
        {gap(2.2)}
      </>}
    </div>
  )
}

/** LP 커버: 함께한 날과 같은 설정, 작은 정사각 앨범 커버 + LP + 큰 숫자 + 크레딧 */
export function RecordLpCover(props: { invitation: RecordIntroData; onEnter: () => void; isPreview?: boolean }) {
  return <RecordDaysCover {...props} variant={{ player: 'lp', photo: 'square', title: 'bignum', footer: 'credit' }} />
}
