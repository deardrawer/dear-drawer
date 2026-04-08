'use client'

import { useState, useEffect } from 'react'

// Google Font: Allura
const fontsLink = "https://fonts.googleapis.com/css2?family=Allura&family=Italiana&display=swap"
const alluraFont = "'Allura', cursive"
const italianaFont = "'Italiana', serif"

// ===== Shared Data & Config =====
const sampleData = {
  groomName: 'Minjun',
  brideName: 'Seoyeon',
  groomNameKr: '김민준',
  brideNameKr: '이서연',
  date: '2026-05-23',
  venueName: '더채플앳청담',
  coverImage: '/sample/cover.png',
  quote: 'I came here tonight because when you realize\nyou want to spend the rest of your life with somebody,\nyou want the rest of your life to start as soon as possible.',
}

const accent = '#D4838F'
const textColor = '#FFFFFF'
const grayColor = 'rgba(255,255,255,0.55)'
const grayDimColor = 'rgba(255,255,255,0.3)'
const displayFont = "'Playfair Display', serif"
const bodyFont = "'Inter', sans-serif"

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const formatted = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  return { formatted, dayOfWeek: dayNames[d.getDay()] }
}

// Film grain overlay
function FilmGrain() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
      opacity: 0.04,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    }} />
  )
}

// Full-screen photo background (shared)
function PhotoBg({ src, phase, startPhase = 1 }: { src: string; phase: number; startPhase?: number }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center 20%',
      opacity: phase >= startPhase ? 1 : 0,
      transform: phase >= startPhase ? 'scale(1.08)' : 'scale(1)',
      transition: phase >= startPhase
        ? 'opacity 1.8s ease, transform 14s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        : 'none',
    }} />
  )
}

// ===================================================================
// A. Art House Minimal
// 극도로 절제된 미니멀. 상단 "A FILM" 만, 큰 세리프 이름,
// 가느다란 디바이더, 날짜. 여백이 고급감.
// ===================================================================
function CoverA({ data }: { data: typeof sampleData }) {
  const [phase, setPhase] = useState(0)
  const { formatted } = formatDate(data.date)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // photo
      setTimeout(() => setPhase(2), 1500),  // "A FILM"
      setTimeout(() => setPhase(3), 2300),  // names
      setTimeout(() => setPhase(4), 3300),  // divider + date
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', backgroundColor: '#0A0A0A',
    }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={fontsLink} rel="stylesheet" />
      <PhotoBg src={data.coverImage} phase={phase} />

      {/* Gentle bottom overlay only */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.88) 100%)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.8s ease',
      }} />

      {/* Top: "A FILM" — tiny, understated */}
      <div style={{
        position: 'absolute', top: '28px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 1s ease',
      }}>
        <span style={{
          fontFamily: displayFont, fontSize: '8px', fontWeight: 400,
          letterSpacing: '6px', color: grayColor, textTransform: 'uppercase',
        }}>A Film</span>
      </div>

      {/* Center-bottom: names + date */}
      <div style={{
        position: 'absolute', bottom: '56px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center', padding: '0 30px',
      }}>
        {/* Names — elegant serif, not too big */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          <span style={{
            fontFamily: italianaFont, fontSize: '36px', fontWeight: 400,
            color: textColor, letterSpacing: '1px',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            {data.groomName}
          </span>
          <span style={{
            fontFamily: italianaFont, fontSize: '22px', fontWeight: 400,
            color: accent, margin: '0 8px',
            textShadow: `0 0 20px ${accent}30`,
          }}>&amp;</span>
          <span style={{
            fontFamily: italianaFont, fontSize: '36px', fontWeight: 400,
            color: textColor, letterSpacing: '1px',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            {data.brideName}
          </span>
        </div>

        {/* Thin divider line */}
        <div style={{
          width: phase >= 4 ? '60px' : '0px', height: '1px',
          background: `${accent}80`,
          margin: '20px auto 18px',
          transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }} />

        {/* Date + Venue */}
        <div style={{
          opacity: phase >= 4 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          <div style={{
            fontFamily: displayFont, fontSize: '12px', fontWeight: 300,
            color: grayColor, letterSpacing: '4px',
          }}>
            {formatted}
          </div>
          <div style={{
            fontFamily: bodyFont, fontSize: '10px', fontWeight: 300,
            color: grayDimColor, letterSpacing: '2px', marginTop: '6px',
          }}>
            {data.venueName}
          </div>
        </div>
      </div>

      <FilmGrain />
    </div>
  )
}

// ===================================================================
// B. Luxury Typographic
// 럭셔리 브랜드 광고 느낌. 얇은 대문자 세리프, 넓은 자간,
// 수직 레이아웃, 골드 톤 대신 절제된 악센트.
// ===================================================================
function CoverB({ data }: { data: typeof sampleData }) {
  const [phase, setPhase] = useState(0)
  const { formatted } = formatDate(data.date)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // photo
      setTimeout(() => setPhase(2), 1400),  // top line
      setTimeout(() => setPhase(3), 2200),  // names (vertical stack)
      setTimeout(() => setPhase(4), 3200),  // bottom info
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', backgroundColor: '#0A0A0A',
    }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={fontsLink} rel="stylesheet" />
      <PhotoBg src={data.coverImage} phase={phase} />

      {/* Overlay — center darkening for text readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 25%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0.9) 100%)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.8s ease',
      }} />

      {/* Top label */}
      <div style={{
        position: 'absolute', top: '28px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center',
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'all 0.8s ease',
      }}>
        <div style={{
          fontFamily: displayFont, fontSize: '7px', fontWeight: 400,
          letterSpacing: '8px', color: grayColor, textTransform: 'uppercase',
        }}>The Wedding of</div>
      </div>

      {/* Names — vertical stack, thin uppercase serif */}
      <div style={{
        position: 'absolute', bottom: '110px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center', padding: '0 24px',
      }}>
        {/* Groom */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          <span style={{
            fontFamily: alluraFont, fontSize: '62px', fontWeight: 400,
            color: textColor, letterSpacing: '2px',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            {data.groomName}
          </span>
        </div>

        {/* Decorative & */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'scale(1)' : 'scale(0.7)',
          transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s',
          margin: '-10px 0',
        }}>
          <span style={{
            fontFamily: alluraFont, fontSize: '28px', fontWeight: 400,
            color: accent, letterSpacing: '2px',
          }}>&amp;</span>
        </div>

        {/* Bride */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s',
        }}>
          <span style={{
            fontFamily: alluraFont, fontSize: '62px', fontWeight: 400,
            color: textColor, letterSpacing: '2px',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            {data.brideName}
          </span>
        </div>
      </div>

      {/* Bottom: date + venue */}
      <div style={{
        position: 'absolute', bottom: '40px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center',
        opacity: phase >= 4 ? 1 : 0,
        transform: phase >= 4 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.8s ease',
      }}>
        <div style={{
          width: '1px', height: '24px',
          background: `linear-gradient(to bottom, ${accent}60, transparent)`,
          margin: '0 auto 14px',
        }} />
        <div style={{
          fontFamily: displayFont, fontSize: '10px', fontWeight: 300,
          letterSpacing: '6px', color: grayColor,
        }}>
          {formatted}
        </div>
        <div style={{
          fontFamily: bodyFont, fontSize: '9px', fontWeight: 300,
          letterSpacing: '3px', color: grayDimColor, marginTop: '5px',
        }}>
          {data.venueName}
        </div>
      </div>

      <FilmGrain />
    </div>
  )
}

// ===================================================================
// C. Cinema Credit
// 영화 엔딩 크레딧 느낌. 인용구가 주인공, 이름은 작게.
// 사진 위에 떠있는 한 줄의 대사, 아래 작은 크레딧.
// ===================================================================
function CoverC({ data }: { data: typeof sampleData }) {
  const [phase, setPhase] = useState(0)
  const { formatted } = formatDate(data.date)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // photo
      setTimeout(() => setPhase(2), 1800),  // quote
      setTimeout(() => setPhase(3), 3000),  // credit line
      setTimeout(() => setPhase(4), 3800),  // date
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', backgroundColor: '#0A0A0A',
    }}>
      <PhotoBg src={data.coverImage} phase={phase} />

      {/* Overlay — even, cinematic */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.8) 82%, rgba(0,0,0,0.92) 100%)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.8s ease',
      }} />

      {/* Content — all bottom-aligned */}
      <div style={{
        position: 'absolute', bottom: '36px', left: 0, right: 0, zIndex: 5,
        padding: '0 28px', textAlign: 'center',
      }}>
        {/* Quote — the hero element */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          marginBottom: '28px',
        }}>
          <p style={{
            fontFamily: displayFont, fontSize: '14px', fontWeight: 400,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.85)', letterSpacing: '0.5px',
            lineHeight: '2', whiteSpace: 'pre-line',
          }}>
            {data.quote}
          </p>
        </div>

        {/* Thin accent line */}
        <div style={{
          width: phase >= 3 ? '40px' : '0px', height: '1px',
          background: accent, margin: '0 auto 20px',
          transition: 'width 0.6s ease',
        }} />

        {/* Credit: names */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transition: 'opacity 0.8s ease',
          marginBottom: '14px',
        }}>
          <span style={{
            fontFamily: displayFont, fontSize: '11px', fontWeight: 400,
            letterSpacing: '6px', color: grayColor, textTransform: 'uppercase',
          }}>
            {data.groomName}
          </span>
          <span style={{
            fontFamily: displayFont, fontSize: '10px',
            color: accent, margin: '0 8px', letterSpacing: '2px',
          }}>&amp;</span>
          <span style={{
            fontFamily: displayFont, fontSize: '11px', fontWeight: 400,
            letterSpacing: '6px', color: grayColor, textTransform: 'uppercase',
          }}>
            {data.brideName}
          </span>
        </div>

        {/* Date + Venue */}
        <div style={{
          opacity: phase >= 4 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          <span style={{
            fontFamily: displayFont, fontSize: '10px', fontWeight: 300,
            letterSpacing: '4px', color: grayDimColor,
          }}>
            {formatted}
          </span>
          <span style={{
            fontFamily: bodyFont, fontSize: '9px', fontWeight: 300,
            color: grayDimColor, marginLeft: '12px', letterSpacing: '1px',
          }}>
            {data.venueName}
          </span>
        </div>
      </div>

      <FilmGrain />
    </div>
  )
}

// ===================================================================
// INTRO A. Current TUDUM Style (production version)
// Netflix 스타일 — 플래시 → 악센트 바 → 이름 펀치인 → 날짜
// ===================================================================
function IntroA({ data, onDone }: { data: typeof sampleData; onDone?: () => void }) {
  const [phase, setPhase] = useState(0)
  const [flash, setFlash] = useState(false)
  const { formatted, dayOfWeek } = formatDate(data.date)

  useEffect(() => {
    const timers = [
      setTimeout(() => { setPhase(1); setFlash(true) }, 400),
      setTimeout(() => setFlash(false), 700),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => setPhase(5), 4000),
      setTimeout(() => setPhase(6), 5000),
      setTimeout(() => onDone?.(), 5800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', backgroundColor: '#0A0A0A',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={fontsLink} rel="stylesheet" />

      {/* Letterbox bars */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: phase >= 3 ? '0px' : '60px',
        background: '#000', zIndex: 20,
        transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: phase >= 3 ? '0px' : '60px',
        background: '#000', zIndex: 20,
        transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />

      {/* TUDUM flash */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 50%, ${accent}40 0%, ${accent}15 30%, transparent 70%)`,
        opacity: flash ? 1 : 0,
        transition: flash ? 'opacity 0.05s ease' : 'opacity 0.4s ease',
      }} />

      {/* Horizontal light streak */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        height: '1px', zIndex: 14, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent 10%, ${accent}80 40%, #fff 50%, ${accent}80 60%, transparent 90%)`,
        opacity: flash ? 0.8 : 0,
        boxShadow: flash ? `0 0 30px 8px ${accent}50` : 'none',
        transition: flash ? 'opacity 0.05s ease' : 'opacity 0.5s ease',
        transform: 'translateY(-50%)',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 45%, ${accent}12 0%, transparent 60%)`,
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 1s ease',
      }} />

      {/* Main content */}
      <div style={{
        opacity: phase >= 6 ? 0 : 1,
        transform: phase >= 6 ? 'scale(1.15)' : 'scale(1)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0 24px',
      }}>
        {/* Accent bar */}
        <div style={{
          width: phase >= 2 ? '56px' : '0px', height: '2px',
          background: accent,
          transition: phase >= 2 ? 'width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          marginBottom: '16px',
          boxShadow: phase >= 2 ? `0 0 24px 4px ${accent}50, 0 0 8px ${accent}80` : 'none',
        }} />

        {/* "A WEDDING MOVIE" */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0) scaleY(1)' : 'translateY(-4px) scaleY(0.8)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          marginBottom: '32px',
        }}>
          <span style={{ fontFamily: displayFont, fontSize: '9px', fontWeight: 500, letterSpacing: '8px', color: accent }}>
            A Wedding Movie
          </span>
        </div>

        {/* Groom */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(1.1)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <span style={{ fontFamily: bodyFont, fontSize: '36px', fontWeight: 300, color: '#FFFFFF', letterSpacing: '8px',
            textShadow: `0 0 40px ${accent}30, 0 2px 20px rgba(0,0,0,0.5)`,
          }}>{data.groomNameKr}</span>
        </div>

        {/* & */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s',
          margin: '6px 0',
        }}>
          <span style={{ fontFamily: displayFont, fontSize: '16px', color: accent, letterSpacing: '4px',
            textShadow: `0 0 20px ${accent}60`,
          }}>&amp;</span>
        </div>

        {/* Bride */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(1.1)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
        }}>
          <span style={{ fontFamily: bodyFont, fontSize: '36px', fontWeight: 300, color: '#FFFFFF', letterSpacing: '8px',
            textShadow: `0 0 40px ${accent}30, 0 2px 20px rgba(0,0,0,0.5)`,
          }}>{data.brideNameKr}</span>
        </div>

        {/* Divider */}
        <div style={{
          width: phase >= 4 ? '120px' : '0px', height: '1px',
          background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
          transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          margin: '24px 0 20px',
        }} />

        {/* Date + Venue */}
        <div style={{
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: displayFont, fontSize: '13px', fontWeight: 300, color: grayColor, letterSpacing: '5px', marginBottom: '8px' }}>
            {formatted} <span style={{ color: grayDimColor, fontSize: '11px' }}>({dayOfWeek})</span>
          </div>
          <div style={{ fontFamily: bodyFont, fontSize: '11px', fontWeight: 300, color: grayDimColor, letterSpacing: '2px' }}>
            {data.venueName}
          </div>
        </div>
      </div>

      <FilmGrain />
    </div>
  )
}

// ===================================================================
// INTRO B. Photo Cinematic Opening
// 사진 기반 — 페이드인 사진 + 하단 타이포 오버레이, 시네마틱 전환
// ===================================================================
function IntroB({ data, onDone }: { data: typeof sampleData; onDone?: () => void }) {
  const [phase, setPhase] = useState(0)
  const { formatted, dayOfWeek } = formatDate(data.date)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),   // photo fade-in + slow zoom
      setTimeout(() => setPhase(2), 1600),   // top label
      setTimeout(() => setPhase(3), 2400),   // names
      setTimeout(() => setPhase(4), 3400),   // date + venue
      setTimeout(() => setPhase(5), 5000),   // hold
      setTimeout(() => setPhase(6), 5600),   // fade out
      setTimeout(() => onDone?.(), 6400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', backgroundColor: '#0A0A0A',
    }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={fontsLink} rel="stylesheet" />

      {/* Photo background with slow Ken Burns zoom */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${data.coverImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1.12)' : 'scale(1)',
        transition: phase >= 1
          ? 'opacity 2s ease, transform 16s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          : 'none',
      }} />

      {/* Dark overlay — cinematic bottom-heavy gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.7) 72%, rgba(0,0,0,0.92) 100%)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 2s ease',
      }} />

      {/* Fade out overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 15,
        background: '#0A0A0A',
        opacity: phase >= 6 ? 1 : 0,
        transition: 'opacity 0.8s ease',
        pointerEvents: 'none',
      }} />

      {/* Top: "A FILM" */}
      <div style={{
        position: 'absolute', top: '32px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 1s ease',
      }}>
        <span style={{
          fontFamily: displayFont, fontSize: '8px', fontWeight: 400,
          letterSpacing: '6px', color: grayColor,
        }}>A Film</span>
      </div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute', bottom: '52px', left: 0, right: 0, zIndex: 5,
        textAlign: 'center', padding: '0 30px',
      }}>
        {/* Names — stacked vertical, large italic serif */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(18px)',
            transition: 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>
            <span style={{
              fontFamily: italianaFont, fontSize: '38px', fontWeight: 400,
              color: textColor, letterSpacing: '2px',
              textShadow: '0 2px 24px rgba(0,0,0,0.6)',
            }}>{data.groomName}</span>
          </div>
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'scale(1)' : 'scale(0.7)',
            transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s',
            margin: '-2px 0 -2px',
          }}>
            <span style={{
              fontFamily: italianaFont, fontSize: '20px', fontWeight: 400,
              color: accent, textShadow: `0 0 16px ${accent}40`,
            }}>&amp;</span>
          </div>
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(-18px)',
            transition: 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s',
          }}>
            <span style={{
              fontFamily: italianaFont, fontSize: '38px', fontWeight: 400,
              color: textColor, letterSpacing: '2px',
              textShadow: '0 2px 24px rgba(0,0,0,0.6)',
            }}>{data.brideName}</span>
          </div>
        </div>

        {/* Thin accent line */}
        <div style={{
          width: phase >= 4 ? '50px' : '0px', height: '1px',
          background: `${accent}80`,
          margin: '0 auto 18px',
          transition: 'width 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }} />

        {/* Date + Venue */}
        <div style={{
          opacity: phase >= 4 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          <div style={{
            fontFamily: displayFont, fontSize: '12px', fontWeight: 300,
            color: grayColor, letterSpacing: '4px',
          }}>
            {formatted} <span style={{ fontSize: '10px', color: grayDimColor }}>({dayOfWeek})</span>
          </div>
          <div style={{
            fontFamily: bodyFont, fontSize: '10px', fontWeight: 300,
            color: grayDimColor, letterSpacing: '2px', marginTop: '6px',
          }}>
            {data.venueName}
          </div>
        </div>
      </div>

      <FilmGrain />
    </div>
  )
}

// ===================================================================
// Mobile Frame Wrapper
// ===================================================================
function MobileFrame({ title, subtitle, children, onReplay }: {
  title: string
  subtitle: string
  children: React.ReactNode
  onReplay: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          fontFamily: bodyFont, fontSize: '15px', fontWeight: 600, color: '#E8E4DF',
          letterSpacing: '1px', marginBottom: '4px',
        }}>
          {title}
        </h2>
        <p style={{
          fontFamily: bodyFont, fontSize: '11px', color: '#666', letterSpacing: '0.5px',
        }}>
          {subtitle}
        </p>
      </div>
      <div style={{
        width: '375px', height: '667px',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '2px solid #333',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        {children}
      </div>
      <button
        onClick={onReplay}
        style={{
          fontFamily: bodyFont, fontSize: '10px', fontWeight: 500,
          letterSpacing: '3px', color: '#888',
          background: 'none', border: '1px solid #444',
          borderRadius: '20px', cursor: 'pointer',
          padding: '7px 20px', transition: 'all 0.2s ease',
          textTransform: 'uppercase',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = textColor
          e.currentTarget.style.borderColor = '#888'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = '#888'
          e.currentTarget.style.borderColor = '#444'
        }}
      >
        Replay
      </button>
    </div>
  )
}

// ===================================================================
// Main Test Page
// ===================================================================
export default function TestFilmCoverPage() {
  const [keyA, setKeyA] = useState(0)
  const [keyB, setKeyB] = useState(0)
  const [keyC, setKeyC] = useState(0)
  const [keyIntroA, setKeyIntroA] = useState(0)
  const [keyIntroB, setKeyIntroB] = useState(0)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#141414',
      padding: '40px 20px 80px',
    }}>
      {/* ===== Section 1: Intro Animations ===== */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <h1 style={{
          fontFamily: displayFont, fontSize: '20px', fontWeight: 400,
          color: '#E8E4DF', letterSpacing: '6px', marginBottom: '8px',
        }}>
          Film Intro Styles
        </h1>
        <p style={{
          fontFamily: bodyFont, fontSize: '12px', color: '#555', letterSpacing: '1px',
        }}>
          Opening animation before the main content — 2 approaches
        </p>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '64px', marginBottom: '100px',
      }}>
        <MobileFrame
          title="Intro A. TUDUM (Current)"
          subtitle="Netflix-style flash, punch-in names, no photo"
          onReplay={() => setKeyIntroA(k => k + 1)}
        >
          <IntroA key={keyIntroA} data={sampleData} />
        </MobileFrame>

        <MobileFrame
          title="Intro B. Photo Cinematic"
          subtitle="Cover photo with Ken Burns zoom, bottom typography"
          onReplay={() => setKeyIntroB(k => k + 1)}
        >
          <IntroB key={keyIntroB} data={sampleData} />
        </MobileFrame>
      </div>

      {/* ===== Section 2: Cover Styles (photo-based) ===== */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <h1 style={{
          fontFamily: displayFont, fontSize: '20px', fontWeight: 400,
          color: '#E8E4DF', letterSpacing: '6px', marginBottom: '8px',
        }}>
          Film Cover Styles
        </h1>
        <p style={{
          fontFamily: bodyFont, fontSize: '12px', color: '#555', letterSpacing: '1px',
        }}>
          Full-screen wedding photo cover — 3 refined approaches
        </p>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '64px',
      }}>
        <MobileFrame
          title="A. Art House Minimal"
          subtitle="Restrained elegance, let the photo breathe"
          onReplay={() => setKeyA(k => k + 1)}
        >
          <CoverA key={keyA} data={sampleData} />
        </MobileFrame>

        <MobileFrame
          title="B. Luxury Typographic"
          subtitle="Vertical stack, wide spacing, editorial feel"
          onReplay={() => setKeyB(k => k + 1)}
        >
          <CoverB key={keyB} data={sampleData} />
        </MobileFrame>

        <MobileFrame
          title="C. Cinema Credit"
          subtitle="Quote-driven, end credits aesthetic"
          onReplay={() => setKeyC(k => k + 1)}
        >
          <CoverC key={keyC} data={sampleData} />
        </MobileFrame>
      </div>
    </div>
  )
}
