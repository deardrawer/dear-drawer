'use client'

import { useState, useCallback, useEffect } from 'react'
import { C_BG, C_BODY, C_INK, C_KSERIF, C_SANS, C_SERIF, C_SUB, cCaption, cPill, cPointTint, cTitle, onPointColor, C_WHITE_ISLAND } from './cStyle'

const C_FAINT = '#B4B4B4'

// hex 색상을 CSS filter로 변환하는 함수
export function hexToSealFilter(hex: string): string {
  // hex → RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  // RGB → HSL
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break
      case g: h = ((b - r) / d + 2) * 60; break
      case b: h = ((r - g) / d + 4) * 60; break
    }
  }

  if (s < 0.05) {
    // 거의 무채색 (검정~흰색)
    const grayBright = Math.max(0.3, Math.min(2.5, l * 2.5))
    return `grayscale(1) brightness(${grayBright.toFixed(2)})`
  }

  const hueRotate = h - 30

  // 밝은 색상 (l > 0.6): sepia 줄이고 brightness 높여서 파스텔 효과
  if (l > 0.6) {
    const sepiaAmount = Math.max(0.15, 1 - (l - 0.6) * 2)
    const saturate = Math.max(1, Math.min(4, s * 6))
    const brightness = Math.max(1.0, Math.min(2.0, 0.6 + l * 1.4))
    return `sepia(${sepiaAmount.toFixed(2)}) saturate(${saturate.toFixed(1)}) hue-rotate(${Math.round(hueRotate)}deg) brightness(${brightness.toFixed(2)})`
  }

  // 어두운/중간 색상
  const saturate = Math.max(0.8, Math.min(5, s * 5))
  const brightness = Math.max(0.5, Math.min(1.1, 0.4 + l * 0.7))
  return `sepia(1) saturate(${saturate.toFixed(1)}) hue-rotate(${Math.round(hueRotate)}deg) brightness(${brightness.toFixed(2)})`
}

interface EnvelopeScreenProps {
  recipientName: string
  recipientTitle?: string
  recipientRelation?: string  // 관계 (예: 이모, 삼촌)
  greetingTo?: string
  message?: string[]
  signature?: React.ReactNode
  onOpen: () => void
  isPreview?: boolean
  themeColor?: string  // (호환용) 메인 테마 컬러 — C안에서는 사용하지 않음
  accentColor?: string // (호환용) 포인트 컬러 — C안에서는 사용하지 않음
  sealColor?: string   // (호환용) 실링스티커 색상 — C안에서는 사용하지 않음
  fontClassName?: string // (호환용) 폰트 클래스 — 하위 전체 서체를 덮어쓰므로 적용하지 않음
  fontFamily?: string // 편지 본문 서체 CSS 값
  backgroundImage?: string  // 봉투 배경 이미지 (첫 화면 사진)
  backgroundImageSettings?: {
    scale: number
    positionX: number
    positionY: number
    cropX?: number
    cropY?: number
    cropWidth?: number
    cropHeight?: number
  }
  hintTextColor?: string    // 사진 위 받는 분 이름 글자색
  // ── C안 첫 화면용 (선택) ──
  coverImage?: string                 // 봉투 배경 사진이 없을 때 쓸 사진 (대표 사진 등)
  coverNames?: { groom: string; bride: string; heart?: boolean }  // 영문 이름
  childLine?: string                  // 예: 저희 딸 서연이가 결혼합니다
  dateVenueLine?: string              // 예: 2027. 01. 09 (토) · 더채플앳청담
  textOnly?: boolean                  // 사진 없이 글자만 (사진이 있어도 글자만 보여줌)
  textDateLine?: string               // 글자만 첫 화면: 예) 2027년 1월 9일 토요일 오후 4시
  textVenueLine?: string              // 글자만 첫 화면: 예) 더채플앳청담 5층 루체홀
  fromNames?: { name: string; deceased?: boolean }[]  // 글자만 첫 화면: From. 보내는 분
  deceasedStyle?: 'hanja' | 'flower'
  letterBg?: string                   // 편지 화면 배경: white | gray | ink | point | #RRGGBB (기본 흰색)
  captionColor?: string               // 부제 색 — 에디터 미리보기처럼 본문 밖에서 그릴 때 지정
  titleColor?: string                 // 제목 색 — 위와 같은 경우 지정
  headingFontFamily?: string          // 메인(제목) 서체 — 에디터 미리보기처럼 본문 밖에서 그릴 때 지정
  pointColor?: string                 // 포인트 색 — 위와 같은 경우 지정
}

export default function EnvelopeScreen({
  recipientName,
  recipientTitle = '님께',
  recipientRelation,
  greetingTo,
  message = ['항상 저희 가족', '챙겨주셔서 감사합니다', '', '서연이가 좋은 사람 만나', '결혼하게 되었습니다', '', '꼭 오셔서', '축복해 주세요'],
  signature = '아버지 이○○ · 어머니 김○○ 올림',
  onOpen,
  isPreview = false,
  fontFamily = '',
  backgroundImage,
  backgroundImageSettings,
  hintTextColor,
  coverImage,
  coverNames,
  childLine,
  dateVenueLine,
  headingFontFamily,
  pointColor,
  textOnly = false,
  textDateLine,
  textVenueLine,
  fromNames,
  deceasedStyle = 'flower',
  letterBg = 'white',
  captionColor,
  titleColor,
}: EnvelopeScreenProps) {
  // stage 0: 첫 화면(사진 + 이름) → stage 1: 편지 → 본문
  const [stage, setStage] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  // 마운트 후 컴포넌트 표시 (CSS 로딩 전 깜빡임 방지)
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // 에디터에서 게스트가 변경되면 첫 화면으로 리셋
  useEffect(() => {
    if (isPreview) {
      setStage(0)
      setIsLeaving(false)
    }
  }, [recipientName, recipientRelation, isPreview])

  // 관계가 있으면 "이름 관계 호칭" 형식, 없으면 "이름 호칭" 형식
  // '께' · '에게'는 붙여 쓰고(소중한 분께), '님께' 등은 띄어 씀(김도현 님께)
  const titleSuffix = recipientTitle ? (/^(께|에게)$/.test(recipientTitle) ? recipientTitle : ` ${recipientTitle}`) : ''
  const nameLine = recipientRelation
    ? `${recipientName} ${recipientRelation}${titleSuffix}`
    : `${recipientName}${titleSuffix}`
  const displayGreetingTo = greetingTo || nameLine

  const hasLetter = (message || []).some(line => (line || '').trim() !== '')

  const goMain = useCallback(() => {
    if (isLeaving) return
    setIsLeaving(true)
    setTimeout(() => onOpen(), 380)
  }, [isLeaving, onOpen])

  const handleCoverTap = useCallback(() => {
    if (stage !== 0) return
    if (hasLetter) setStage(1)
    else goMain()
  }, [stage, hasLetter, goMain])

  // 첫 화면 사진: 봉투 배경 사진(크롭 설정 포함) → 없으면 대표 사진
  const photo = (() => {
    if (textOnly) return null
    if (backgroundImage) {
      const s = backgroundImageSettings
      const cw = s?.cropWidth ?? 1
      const ch = s?.cropHeight ?? 1
      const cx = s?.cropX ?? 0
      const cy = s?.cropY ?? 0
      const hasCrop = cw < 0.99 || ch < 0.99
      const posX = hasCrop ? (cx + cw / 2) * 100 : 50
      const posY = hasCrop ? (cy + ch / 2) * 100 : 50
      const scale = hasCrop ? Math.max(1 / cw, 1 / ch) : 1
      return { src: backgroundImage, pos: `${posX}% ${posY}%`, scale }
    }
    if (coverImage) return { src: coverImage, pos: '50% 22%', scale: 1 }
    return null
  })()

  // 편지 화면 배경: 흰색 / 연회색 / 먹색(글씨 밝게, 버튼 흰색) / 포인트 색 연하게
  // 직접 고른 색: 어두우면 밝은 글씨 + 흰 버튼, 밝으면 먹색 글씨
  const customHex = /^#[0-9a-fA-F]{6}$/.test(letterBg) ? letterBg : null
  const customDark = customHex ? (() => {
    const n = parseInt(customHex.slice(1), 16)
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.55
  })() : false
  const darkLetter = {
    body: 'rgba(255,255,255,0.82)', sign: '#FFFFFF',
    vars: { ['--parents-caption' as string]: 'rgba(255,255,255,0.6)', ['--parents-title' as string]: '#FFFFFF' },
    button: { background: '#FFFFFF', color: C_INK },
  }
  const letterTheme: { bg: string; body: string; sign: string; vars: React.CSSProperties; button: React.CSSProperties } =
    customHex
      ? (customDark ? { bg: customHex, ...darkLetter } : { bg: customHex, body: C_BODY, sign: C_INK, vars: {}, button: {} })
      : letterBg === 'ink'
      ? {
          bg: C_INK, body: 'rgba(255,255,255,0.82)', sign: '#FFFFFF',
          vars: { ['--parents-caption' as string]: 'rgba(255,255,255,0.55)', ['--parents-title' as string]: '#FFFFFF' },
          button: { background: '#FFFFFF', color: C_INK },
        }
      : letterBg === 'gray'
        ? { bg: '#F4F4F5', body: C_BODY, sign: C_INK, vars: {}, button: {} }
        : letterBg === 'point'
          ? { bg: cPointTint(8), body: C_BODY, sign: C_INK, vars: {}, button: {} }
          : { bg: C_BG, body: C_BODY, sign: C_INK, vars: {}, button: {} }

  const showNames = !!(coverNames && coverNames.groom && coverNames.bride)
  const namesLen = showNames ? `${coverNames!.groom} & ${coverNames!.bride}`.length : 0
  const namesSize = Math.max(30, Math.min(44, Math.floor(330 / Math.max(1, namesLen * 0.45))))

  return (
    <div
      className={`${isPreview ? 'absolute' : 'fixed'} inset-0 z-50`}
      style={{
        ...C_WHITE_ISLAND,
        backgroundColor: C_BG,
        color: C_INK,
        fontFamily: C_SANS,
        opacity: isMounted && !isLeaving ? 1 : 0,
        transition: isLeaving ? 'opacity 0.38s ease' : 'opacity 0.2s ease-in',
        WebkitFontSmoothing: 'antialiased',
        wordBreak: 'keep-all',
        ...(headingFontFamily ? { ['--parents-heading-font' as string]: headingFontFamily } : {}),
        ...(pointColor ? { ['--parents-point' as string]: pointColor, ['--parents-on-point' as string]: onPointColor(pointColor) } : {}),
        ...(captionColor ? { ['--parents-caption' as string]: captionColor } : {}),
        ...(titleColor ? { ['--parents-title' as string]: titleColor } : {}),
      }}
    >
      <div style={{ position: 'relative', height: '100%', maxWidth: 430, margin: '0 auto', overflow: 'hidden' }}>
        {photo ? (
          <>
        {/* ── 첫 화면: 사진 + 이름 ── */}
        <div
          onClick={handleCoverTap}
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
        >
          <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {photo && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt=""
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: photo.pos,
                    transform: photo.scale !== 1 ? `scale(${photo.scale})` : undefined,
                    transformOrigin: photo.pos,
                  }}
                />
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 20%, rgba(255,255,255,0) 55%, #FFFFFF 100%)',
                  }}
                />
              </>
            )}
            <p
              style={{
                position: 'absolute', top: 58, left: 0, right: 0, margin: 0, padding: '0 24px',
                textAlign: 'center', fontSize: 13, letterSpacing: '0.04em',
                color: hintTextColor || (photo ? '#FFFFFF' : C_SUB),
                textShadow: photo ? '0 1px 8px rgba(0,0,0,0.3)' : undefined,
              }}
            >
              {nameLine}
            </p>
          </div>

          <div
            style={{
              marginTop: photo ? -110 : 0, position: 'relative', textAlign: 'center', padding: '0 28px 46px',
              // 기존 봉투와 같은 도착 → 퇴장 모션
              transform: !isMounted ? 'translateY(16px) scale(0.98)' : isLeaving ? 'scale(1.05)' : 'translateY(0) scale(1)',
              transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {showNames && (
              <div style={{ fontFamily: C_SERIF, fontSize: namesSize, lineHeight: 1.05, letterSpacing: '-0.01em', color: C_INK }}>
                {coverNames!.groom}{' '}
                <span style={{ color: C_SUB, fontSize: Math.round(namesSize * 0.68) }}>{coverNames!.heart ? '♥' : '&'}</span>
                {' '}{coverNames!.bride}
              </div>
            )}
            {childLine ? (
              <h1 style={{ ...cTitle(21, showNames ? 18 : 0), whiteSpace: 'pre-line' }}>{childLine}</h1>
            ) : (
              !showNames && <h1 style={cTitle(21, 0)}>편지가 도착했어요</h1>
            )}
            {dateVenueLine && (
              <p style={{ fontSize: 13, color: C_SUB, margin: '12px 0 0' }}>{dateVenueLine}</p>
            )}
            <style>{`@keyframes parentsHintPulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 1; } }`}</style>
            <div style={{ display: 'flex', marginTop: 28, animation: 'parentsHintPulse 2s ease-in-out infinite' }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCoverTap() }}
                style={cPill(true)}
              >
                {hasLetter ? '편지 열어 보기' : '청첩장 보기'}
              </button>
            </div>
          </div>
        </div>
          </>
        ) : (
          // 첫 화면 (글자만) — 시안 C 봉투: 흰 바탕 · 왼쪽 정렬 · 먹선 한 줄 · 장식 없음
        <div
          onClick={handleCoverTap}
          style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
            padding: '0 36px', cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '100%',
              transform: !isMounted ? 'translateY(16px) scale(0.98)' : isLeaving ? 'scale(1.05)' : 'translateY(0) scale(1)',
              transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div style={{ fontSize: 13, color: C_FAINT }}>To.</div>
            <div style={{ fontFamily: C_KSERIF, fontSize: 44, lineHeight: 1.2, marginTop: 10, letterSpacing: '-0.02em', color: C_INK, wordBreak: 'keep-all' }}>
              {nameLine}
            </div>
            <div aria-hidden style={{ width: '100%', height: 1, background: C_INK, margin: '40px 0 18px' }} />
            {(textDateLine || textVenueLine) && (
              <div style={{ fontSize: 14, color: C_SUB, lineHeight: 1.8 }}>
                {textDateLine && <div>{textDateLine}</div>}
                {textVenueLine && <div>{textVenueLine}</div>}
              </div>
            )}
            {fromNames && fromNames.length > 0 && (
              <div style={{ fontSize: 14, color: C_SUB, marginTop: 28 }}>
                From.{' '}
                {fromNames.map((n, i) => (
                  <span key={i}>
                    {i > 0 && ' · '}
                    {n.deceased && (deceasedStyle === 'hanja'
                      ? <span style={{ opacity: 0.7, marginRight: 2 }}>故</span>
                      // eslint-disable-next-line @next/next/no-img-element
                      : <img src="/icons/chrysanthemum.svg" alt="고인" style={{ display: 'inline', width: 12, height: 12, marginRight: 2, opacity: 0.7, verticalAlign: 'middle', marginTop: -2 }} />)}
                    {n.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <style>{`@keyframes parentsHintPulse { 0%, 100% { opacity: 0.5; transform: translateY(0); } 50% { opacity: 0.85; transform: translateY(-3px); } }`}</style>
          <div
            style={{
              position: 'absolute', bottom: 64, left: 0, right: 0, textAlign: 'center', fontSize: 13.5, letterSpacing: '0.04em', color: C_INK,
              animation: 'parentsHintPulse 2s ease-in-out infinite',
            }}
          >
            눌러서 열어 보세요
          </div>
        </div>
        )}

        {/* ── 편지: 아래에서 올라오는 흰 종이 ── */}
        {hasLetter && (
          <div
            aria-hidden={stage !== 1}
            style={{
              position: 'absolute', inset: 0, backgroundColor: letterTheme.bg,
              ...letterTheme.vars,
              transform: stage === 1 ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div style={{ margin: 'auto 0', padding: '64px 32px 40px', textAlign: 'center' }}>
              <p style={{ ...cCaption, fontSize: 13 }}>보내는 마음</p>
              <p style={cTitle(21, 14)}>{displayGreetingTo}</p>
              <div
                style={{
                  marginTop: 28,
                  fontFamily: fontFamily || C_SANS,
                  fontSize: 15.5,
                  lineHeight: 1.9,
                  color: letterTheme.body,
                }}
              >
                {message.map((line, i) => (
                  (line || '').trim() === ''
                    ? <div key={i} aria-hidden style={{ height: 14 }} />
                    : <p key={i} style={{ margin: 0 }}>{line}</p>
                ))}
              </div>
              {signature && (
                <p style={{ marginTop: 30, marginBottom: 0, fontFamily: C_KSERIF, fontSize: 15, color: letterTheme.sign }}>
                  {signature}
                </p>
              )}
              <div style={{ display: 'flex', marginTop: 40 }}>
                <button type="button" onClick={goMain} style={{ ...cPill(true), ...letterTheme.button }} tabIndex={stage === 1 ? 0 : -1}>
                  청첩장 보기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
