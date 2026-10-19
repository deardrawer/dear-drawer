'use client'

// 사진이 화면을 채운 뒤 그 위에 놓이는 글자 (트레이싱지·포스터 봉투 공용)
//  · 스토리형: THE STORY OF / 손글씨 이름 / 날짜
//  · 모노그램형: 이니셜 엠블럼 / 첫 글자만 손글씨인 세리프 이름 / 날짜
//  · 에디토리얼형: 화면 밖에서 이어지는 서명체 영문 이름 (영문 이름 전용)
//  · 초대 문구: 초대 문구 2줄 / 이름
import { useEffect, useRef, useState } from 'react'
import { type IntroData, lines, str } from './shared'
import FitLine from './FitLine'
import { whenFontReady } from '@/lib/fontReady'

const SCRIPT = "'Pinyon Script', 'Snell Roundhand', cursive"
const SERIF = "'Noto Serif KR', 'Nanum Myeongjo', serif"
// 한글 이름 첫 글자의 첫소리를 로마자 한 글자로 (지훈 → J, 서연 → S, 윤 → Y)
const CHO = ['G', 'G', 'N', 'D', 'D', 'R', 'M', 'B', 'B', 'S', 'S', '', 'J', 'J', 'C', 'K', 'T', 'P', 'H']
const JUNG = ['A', 'A', 'Y', 'Y', 'E', 'E', 'Y', 'Y', 'O', 'W', 'W', 'O', 'Y', 'U', 'W', 'W', 'W', 'Y', 'E', 'U', 'I']
function romanInitial(name: string) {
  const c = (name || '').trim().charCodeAt(0)
  if (c >= 0xac00 && c <= 0xd7a3) { const n = c - 0xac00, cho = Math.floor(n / 588); return CHO[cho] || JUNG[Math.floor((n % 588) / 28)] }
  const l = (name || '').trim()[0] || ''
  return /[A-Za-z]/.test(l) ? l.toUpperCase() : ''
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const CAPS: React.CSSProperties = { fontFamily: "'Jost', 'Noto Sans KR', sans-serif", fontWeight: 400, fontSize: 10.5, letterSpacing: '.3em', paddingLeft: '.3em', whiteSpace: 'nowrap' }
/** 에디토리얼형 서명체 (구글 무료 글꼴, OFL) — scale: 같은 크기로 보이도록 맞춘 배율 */
// stroke: 그 글꼴 획 굵기 (글자 크기 대비) — 꼬리선을 글자 획과 같은 굵기로 그린다
export const ED_FONTS: Record<string, { family: string; label: string; scale: number; stroke: number }> = {
  delafield: { family: 'Mrs Saint Delafield', label: 'Mrs Saint Delafield', scale: 1.05, stroke: 0.02 },
  sacramento: { family: 'Sacramento', label: 'Sacramento', scale: 0.95, stroke: 0.03 },
  muellerhoff: { family: 'Herr Von Muellerhoff', label: 'Herr Von Muellerhoff', scale: 1.05, stroke: 0.018 },
  doulaise: { family: 'Monsieur La Doulaise', label: 'Monsieur La Doulaise', scale: 0.85, stroke: 0.02 },
}
const NAME = (nf: number, family: string): React.CSSProperties => ({ fontFamily: `'${family}', cursive`, fontSize: nf, lineHeight: 1, color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,.18)' })
// 모노그램형: 얇은 세리프 이름에 첫 글자만 손글씨 대문자
const DISPLAY = "'Cormorant Garamond', 'Playfair Display', serif"
const MONO_SIDE: React.CSSProperties = { fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 7.5, lineHeight: 1.35, letterSpacing: '.18em', color: 'rgba(255,255,255,.92)' }
const swash = (word: string) => <><span style={{ fontFamily: SCRIPT, fontSize: '1.32em', lineHeight: 0, marginRight: '-.04em' }}>{word[0]}</span>{word.slice(1)}</>

export default function RevealCaption({ w, h, opts, data, open, instant }: { w: number; h: number; opts: Record<string, unknown>; data: IntroData; open: boolean; instant: boolean }) {
  const invite = lines(opts.inviteText, '소중한 당신을 초대합니다').slice(0, 2)
  const en = !!(data.groomEn && data.brideEn)
  // 에디토리얼형: 직접 쓴 영문 2줄(예: save / the date) 또는 영문 이름 (영문 전용)
  const custom = lines(opts.editorialText, '').map(l => l.replace(/[ㄱ-ㆎ가-힣]/g, '').trim()).filter(Boolean).slice(0, 2)
  // 직접 쓴 문구 > 두 사람 영문 이름 > 'Save the date' (영문 이름이 없어도 영문 손글씨형은 늘 보인다)
  const edLines = custom.length ? [custom[0], custom[1] || ''] : en ? [data.groomEn, data.brideEn] : ['Save', 'the date']
  const edNames = !custom.length && en
  const edCaption = str(opts.edCaption, '소중한 분들을 초대합니다')
  const picked = str(opts.content, 'names')
  const mode = picked
  // 에디토리얼형: 길게 뻗는 서명체 이름
  const NF = Math.min(100, w * 0.235)
  // 서명체 꼬리선: 양쪽 / 오른쪽만 / 없음
  const tail = str(opts.edTail, 'both')
  const edFont = ED_FONTS[str(opts.edFont, 'delafield')] || ED_FONTS.delafield
  // 두 줄은 글자 크기 기준으로 촘촘히 (둘째 줄은 첫 줄 높이의 0.8배 아래), 묶음 전체는 화면 가운데쯤
  const edTop = Math.round(h * 0.4 - NF * edFont.scale * 0.4)
  // 열린 뒤 글자: THE STORY OF / 이름 / JUNE 6, 2026
  const storyLabel = str(opts.storyLabel, 'THE STORY OF')
  // 스토리형 이름 아래: 직접 쓴 문장(세리프)이 있으면 날짜 대신
  const storySub = str(opts.storySub).trim()
  // 스토리형 영문 이름 글꼴: 기본 Pinyon Script + 서명체 4종
  const storyFont = opts.storyFont && opts.storyFont !== 'pinyon' && ED_FONTS[str(opts.storyFont)]
    ? { family: `'${ED_FONTS[str(opts.storyFont)].family}', cursive`, scale: ED_FONTS[str(opts.storyFont)].scale }
    : { family: SCRIPT, scale: 1 }
  const sd = data.date ? new Date(data.date) : null
  const storyDate = sd && !isNaN(sd.getTime()) ? `${MONTHS[sd.getMonth()]} ${sd.getDate()}, ${sd.getFullYear()}`.toUpperCase() : ''
  // 모노그램: 이니셜 + ES TD / 20 26 (결혼한 해를 '설립 연도'처럼)
  const monoOwn = str(opts.monoInitials).replace(/[^A-Za-z]/g, '').toUpperCase()
  const ini = monoOwn.length >= 2 ? [monoOwn[0], monoOwn[1]]
    : en ? [data.groomEn[0].toUpperCase(), data.brideEn[0].toUpperCase()]
    : [romanInitial(data.groomGiven), romanInitial(data.brideGiven)]
  const yy = sd && !isNaN(sd.getTime()) ? String(sd.getFullYear()) : ''
  const monoSub = storyDate || storyLabel
  // 포스터형 (포스터 봉투 기본): 제목 + 크레딧 (초대 한 줄 / 요일·날짜 / 장소)
  const posterTitle = (str(opts.posterTitle).trim() || (en ? `${data.groomEn} & ${data.brideEn}` : `${data.groomName} & ${data.brideName}`)).toUpperCase()
  const posterCredits = [
    invite[0] || '',
    sd && !isNaN(sd.getTime()) ? `${['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][sd.getDay()]} · ${sd.getDate()} ${MONTHS[sd.getMonth()].toUpperCase()} ${sd.getFullYear()}` : '',
    data.venue,
  ].filter(Boolean)
  const storyNames = en ? `${data.groomEn} & ${data.brideEn}`.toUpperCase() : `${data.groomName} · ${data.brideName}`
  const n1Ref = useRef<HTMLSpanElement>(null), n2Ref = useRef<HTMLSpanElement>(null)
  const b1Ref = useRef<HTMLSpanElement>(null), b2Ref = useRef<HTMLSpanElement>(null)   // 기준선 표시용 (높이 0)
  const [swashPath, setSwashPath] = useState<{ l: string; r: string; px: number; py: number; cy: number } | null>(null)
  useEffect(() => {
    if (mode !== 'editorial') return
    let alive = true
    // 이름 글자 위치를 재서, 왼쪽 화면 끝 → 첫 글자, 마지막 글자 → 오른쪽 화면 끝으로 이어지는 선을 만든다
    const measure = () => {
      const a = n1Ref.current, b = n2Ref.current
      if (!alive || !a || !b || !b.offsetWidth) return
      // 글자의 실제 기준선과 잉크 끝을 잰다 → 꼬리가 첫 글자 시작 획·마지막 글자 끝 획에 정확히 붙는다
      const fsz = NF * edFont.scale
      const g = document.createElement('canvas').getContext('2d')!
      g.font = `${fsz}px '${edFont.family}'`
      const ink = (t: string) => { const m = g.measureText(t); return { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight } }
      const i1 = ink(edLines[0] || ''), i2 = ink(edLines[1] || '')
      const ay = a.offsetTop + (b1Ref.current?.offsetTop ?? fsz * 0.74)   // 첫 줄 기준선
      const by = b.offsetTop + (b2Ref.current?.offsetTop ?? fsz * 0.74)   // 둘째 줄 기준선
      const ax = a.offsetLeft - i1.l + fsz * 0.03                       // 첫 글자 잉크 시작
      const bx = b.offsetLeft + i2.r - fsz * 0.015                      // 마지막 글자 잉크 끝
      // '+'는 첫 줄 끝 바로 아래, 두 줄 사이에
      const px = Math.min(w - NF * 0.3, a.offsetLeft + a.offsetWidth - NF * 0.12), py = (ay + by) / 2 - NF * 0.32
      const u = fsz
      setSwashPath({
        px, py, cy: by + NF * 0.2,
        // 왼쪽: 화면 밖 아래에서 출발해 낮게 흐르다 첫 글자 기준선으로 올라타며 붙는다 (글자의 오름획 방향)
        l: `M -8 ${(ay + u * 0.3).toFixed(1)} C ${(ax * 0.45).toFixed(1)} ${(ay + u * 0.32).toFixed(1)}, ${(ax - u * 0.22).toFixed(1)} ${(ay + u * 0.06).toFixed(1)}, ${ax.toFixed(1)} ${(ay - u * 0.04).toFixed(1)}`,
        // 오른쪽: 마지막 글자 끝 획에서 기준선을 따라 이어지다 완만하게 올라 화면 밖으로
        r: `M ${bx.toFixed(1)} ${(by - u * 0.04).toFixed(1)} C ${(bx + u * 0.3).toFixed(1)} ${(by + u * 0.03).toFixed(1)}, ${(bx + (w - bx) * 0.55).toFixed(1)} ${(by - u * 0.04).toFixed(1)}, ${w + 8} ${(by - u * 0.26).toFixed(1)}`,
      })
    }
    const go = () => requestAnimationFrame(measure)
    // 글꼴이 실제로 받아진 뒤 글자 폭을 잰다 (기본 글꼴로 재면 장식 곡선 위치가 어긋난다)
    whenFontReady(edFont.family).then(go)
    return () => { alive = false }
  }, [mode, w, h, NF, edLines[0], edLines[1], edFont.family]) // eslint-disable-line react-hooks/exhaustive-deps
  const write = (delay: number): React.CSSProperties => ({
    clipPath: open ? 'inset(-30% -20% -40% -20%)' : 'inset(-30% 120% -40% -20%)',
    transition: instant ? 'none' : `clip-path 1.5s cubic-bezier(.42,.08,.38,1) ${delay}s`,
  })
  const later = (delay: number): React.CSSProperties => ({ opacity: open ? 1 : 0, transition: instant ? 'none' : `opacity .9s ease ${delay}s` })

  return (
    // 보여주기만 하는 문구 — 터치는 아래 인트로(유리 그리기·띠 뜯기 등)로 그대로 통과시킨다
    <div className="absolute inset-0 pointer-events-none">
      {/* 열린 뒤: 사진 전체를 살짝 가라앉혀 흰 글씨가 읽히게 */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: mode === 'poster' ? 'linear-gradient(rgba(10,10,10,0) 45%, rgba(10,10,10,.62))' : mode === 'editorial' ? 'rgba(10,12,9,.34)' : 'radial-gradient(ellipse 90% 60% at 50% 58%, rgba(15,12,10,.34), rgba(15,12,10,.14) 70%, rgba(15,12,10,.08))', opacity: open ? 1 : 0, transition: instant ? 'none' : 'opacity 1.4s ease .4s' }} />
      {/* 가운데 조금 아래: THE STORY OF / 손글씨 이름 / 날짜 */}
      {mode === 'editorial' && (
        <>
          <span ref={n1Ref} className="absolute whitespace-nowrap" style={{ ...NAME(NF * edFont.scale, edFont.family), left: '20%', top: edTop, ...write(1.4) }}>{edLines[0]}<span ref={b1Ref} className="inline-block" style={{ width: 0, height: 0 }} /></span>
          {swashPath && edCaption && (
            <p className="absolute left-0 right-0 m-0 text-center" style={{ top: swashPath.cy, color: '#fff', fontFamily: SERIF, fontSize: Math.min(13.5, w * 0.037), letterSpacing: '.14em', paddingLeft: '.14em', textShadow: '0 1px 8px rgba(0,0,0,.3)', ...later(3.6) }}>{edCaption}</p>
          )}
          {edNames && swashPath && (
            <span className="absolute" style={{ left: swashPath.px, top: swashPath.py, color: '#fff', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: NF * 0.38, lineHeight: 1, opacity: open ? 1 : 0, transition: instant ? 'none' : 'opacity .8s ease 2.4s' }}>+</span>
          )}
          <span ref={n2Ref} className="absolute whitespace-nowrap" style={{ ...NAME(NF * edFont.scale, edFont.family), left: '28%', top: edTop + NF * edFont.scale * 0.8, ...write(2.5) }}>{edLines[1]}<span ref={b2Ref} className="inline-block" style={{ width: 0, height: 0 }} /></span>
          {swashPath && tail !== 'none' && (
            <svg className="absolute inset-0 pointer-events-none" width={w} height={h} aria-hidden style={{ overflow: 'visible' }}>
              {([['l', swashPath.l, 0.8], ['r', swashPath.r, 3.75]] as const).filter(([side]) => tail === 'both' || tail === side).map(([, d, delay], i) => (
                <path key={i} d={d as string} fill="none" stroke="#fff" strokeWidth={Math.max(1.2, NF * edFont.scale * edFont.stroke)} strokeLinecap="round"
                  pathLength={1} strokeDasharray={1} strokeDashoffset={open ? 0 : 1}
                  style={{ transition: instant ? 'none' : `stroke-dashoffset ${delay > 2 ? 0.9 : 0.6}s ${delay > 2 ? 'cubic-bezier(.3,0,.5,1)' : 'cubic-bezier(.5,0,.7,1)'} ${delay}s`, filter: 'drop-shadow(0 1px 8px rgba(0,0,0,.18))' }} />
              ))}
            </svg>
          )}
        </>
      )}
      {mode === 'poster' && (
        <div className="absolute left-0 right-0 flex flex-col items-center text-center" style={{ bottom: 96, padding: '0 18px', color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,.3)' }}>
          <p className="m-0" style={{ fontFamily: "'Jost', 'Noto Sans KR', sans-serif", fontWeight: 300, fontSize: Math.min(26, w * 0.068), letterSpacing: '.16em', paddingLeft: '.16em', lineHeight: 1.2, ...write(0.9) }}>
            <FitLine max={w * 0.9}>{posterTitle}</FitLine>
          </p>
          <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,.7)', margin: '14px 0 12px', ...later(1.9) }} />
          {posterCredits.map((c, i) => (
            <p key={i} className="m-0" style={{ fontFamily: "'Inter', 'Noto Sans KR', sans-serif", fontWeight: 500, fontSize: i === 0 ? 11.5 : 9.5, letterSpacing: i === 0 ? '.08em' : '.2em', lineHeight: 1.9, opacity: 0.92, ...later(2.1 + i * 0.25) }}>
              <FitLine max={w * 0.9}>{c}</FitLine>
            </p>
          ))}
        </div>
      )}
      {mode !== 'editorial' && mode !== 'poster' && <div className="absolute left-0 right-0 flex flex-col items-center text-center" style={{ top: mode === 'monogram' ? '41%' : '50%', gap: 2, padding: '0 20px', color: '#fff', textShadow: '0 1px 10px rgba(0,0,0,.28)' }}>
        {mode === 'monogram' ? (
          <>
            <div className="flex items-center" style={{ gap: 12, marginBottom: 14, opacity: open ? 1 : 0, transform: open ? 'none' : 'scale(.92)', transition: instant ? 'none' : 'opacity 1s ease .9s, transform 1.2s cubic-bezier(.2,.7,.2,1) .9s' }}>
              <span style={{ ...MONO_SIDE, textAlign: 'right' }}>ES<br />TD</span>
              <svg width="44" height="56" viewBox="0 0 44 56" aria-hidden style={{ overflow: 'visible' }}>
                <ellipse cx="22" cy="28" rx="20.5" ry="26.5" fill="none" stroke="#fff" strokeWidth="1" />
                <ellipse cx="22" cy="28" rx="18.6" ry="24.6" fill="none" stroke="#fff" strokeWidth=".5" opacity=".7" />
                {/* 이니셜: 왼쪽 위 · 오른쪽 아래로 엇갈려 놓고 가는 사선으로 잇는다 (겹치면 뭉개져 보인다) */}
                <line x1="14" y1="44" x2="30" y2="12" stroke="#fff" strokeWidth=".6" opacity=".75" />
                <text x="15" y="29" textAnchor="middle" fill="#fff" fontSize={20} fontStyle="italic" fontFamily={DISPLAY}>{ini[0]}</text>
                <text x="29.5" y="44" textAnchor="middle" fill="#fff" fontSize={20} fontStyle="italic" fontFamily={DISPLAY}>{ini[1]}</text>
              </svg>
              <span style={{ ...MONO_SIDE, textAlign: 'left' }}>{yy ? <>{yy.slice(0, 2)}<br />{yy.slice(2)}</> : <>&nbsp;<br />&nbsp;</>}</span>
            </div>
            <p className="m-0 whitespace-nowrap" style={{ fontFamily: en ? DISPLAY : SERIF, fontSize: en ? Math.min(40, Math.max(30, w * 0.1)) : 24, lineHeight: 1.1, letterSpacing: en ? '-.005em' : '.06em', padding: '0 .3em', ...write(1.3) }}>
              <FitLine max={w * 0.9}>{en ? <>{swash(data.groomEn)} <span style={{ fontFamily: SCRIPT, fontSize: '.9em', margin: '0 .08em' }}>&amp;</span> {swash(data.brideEn)}</> : `${data.groomName} & ${data.brideName}`}</FitLine>
            </p>
            {monoSub && <p className="m-0" style={{ fontFamily: "'Inter', 'Noto Sans KR', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: '.24em', paddingLeft: '.24em', marginTop: 14, whiteSpace: 'nowrap', ...later(2.5) }}>{monoSub}</p>}
          </>
        ) : mode === 'invite' ? (
          <>
            {invite.map((l, i) => (
              <p key={i} className="m-0 whitespace-nowrap" style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.7, letterSpacing: '.03em', ...write(1.1 + i * 0.5) }}>{l}</p>
            ))}
            <p className="m-0" style={{ ...CAPS, marginTop: 10, ...later(1.2 + invite.length * 0.5) }}><FitLine max={w * 0.9}>{storyNames}</FitLine></p>
          </>
        ) : (
          <>
            <p className="m-0" style={{ ...CAPS, marginBottom: 2, ...later(0.9) }}>{storyLabel}</p>
            {/* 스토리형은 영문 손글씨 이름 전용 — 영문 이름이 없으면 Groom & Bride */}
            <p className="m-0 whitespace-nowrap" style={{ fontFamily: storyFont.family, fontSize: Math.min(50, Math.max(38, w * 0.125)) * storyFont.scale, lineHeight: 1.15, padding: '0 .3em', ...write(1.2) }}>
              <FitLine max={w * 0.9}>{en ? data.groomEn : 'Groom'} <span style={{ fontSize: '.86em', margin: '0 .04em' }}>&amp;</span> {en ? data.brideEn : 'Bride'}</FitLine>
            </p>
            {storySub
              ? <p className="m-0" style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif KR', serif", fontWeight: 500, fontVariantNumeric: 'lining-nums', fontSize: Math.min(26, w * 0.068), lineHeight: 1.2, marginTop: 2, ...later(2.4) }}><FitLine max={w * 0.9}>{storySub}</FitLine></p>
              : storyDate && <p className="m-0" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontVariantNumeric: 'lining-nums', fontSize: Math.min(17, w * 0.045), letterSpacing: '.12em', paddingLeft: '.12em', marginTop: 4, whiteSpace: 'nowrap', ...later(2.4) }}>{storyDate}</p>}
          </>
        )}
      </div>}
    </div>
  )
}
