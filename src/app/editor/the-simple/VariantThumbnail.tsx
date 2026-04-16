'use client'

/**
 * VariantThumbnail
 *
 * 섹션 × variant 조합을 작은 와이어프레임으로 시각화합니다.
 * 각 조합은 36×24 크기의 SVG에 렌더링되며,
 * 실제 레이아웃의 구조(블록 배치, 열 수, 큰 타이포 위치 등)를
 * 빠르게 파악할 수 있도록 단순화되어 있습니다.
 */

interface VariantThumbnailProps {
  sectionType: string
  variant: number
  active: boolean
}

const W = 36
const H = 24
const PAD = 2

export default function VariantThumbnail({ sectionType, variant, active }: VariantThumbnailProps) {
  const stroke = active ? '#fff' : '#a8a29e'
  const fill = active ? 'rgba(255,255,255,0.12)' : 'rgba(168,162,158,0.12)'
  const accent = active ? '#fff' : '#57534e'

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {renderShape(sectionType, variant, { stroke, fill, accent })}
    </svg>
  )
}

interface ShapeStyle {
  stroke: string
  fill: string
  accent: string
}

function renderShape(
  sectionType: string,
  variant: number,
  { stroke, fill, accent }: ShapeStyle
): React.ReactNode {
  // 공통 helpers
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    opts: { filled?: boolean; outline?: boolean; r?: number } = {}
  ) => (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={opts.r ?? 0.5}
      fill={opts.filled ? accent : opts.outline === false ? 'transparent' : fill}
      stroke={opts.outline === false ? 'none' : stroke}
      strokeWidth={0.6}
    />
  )
  const line = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={0.6} />
  )
  const dot = (cx: number, cy: number, r = 0.7) => (
    <circle cx={cx} cy={cy} r={r} fill={accent} />
  )

  switch (sectionType) {
    case 'intro':
      return introShapes(variant, rect, line, dot, { stroke, accent })
    case 'greeting':
      return greetingShapes(variant, rect, line, dot, { stroke, accent })
    case 'couple':
      return coupleShapes(variant, rect, line, dot, { stroke, accent })
    case 'info':
      return infoShapes(variant, rect, line, dot, { stroke, accent })
    case 'direction':
      return directionShapes(variant, rect, line, dot, { stroke, accent })
    case 'interview':
      return interviewShapes(variant, rect, line, dot, { stroke, accent })
    case 'gallery':
      return galleryShapes(variant, rect, line, dot, { stroke, accent })
    case 'lovestory':
      return lovestoryShapes(variant, rect, line, dot, { stroke, accent })
    case 'video':
      return videoShapes(variant, rect, line, dot, { stroke, accent })
    case 'guide':
      return guideShapes(variant, rect, line, dot, { stroke, accent })
    case 'account':
      return accountShapes(variant, rect, line, dot, { stroke, accent })
    case 'rsvp':
      return rsvpShapes(variant, rect, line, dot, { stroke, accent })
    case 'guestbook':
      return guestbookShapes(variant, rect, line, dot, { stroke, accent })
    case 'thanks':
      return thanksShapes(variant, rect, line, dot, { stroke, accent })
    default:
      return rect(PAD, PAD, W - PAD * 2, H - PAD * 2)
  }
}

// ────────────────────────────────────────────────
// 섹션별 와이어프레임 정의
// 각 함수는 (variant) → JSX 반환. 변형이 없는 번호는 V1 fallback.
// ────────────────────────────────────────────────

type R = (x: number, y: number, w: number, h: number, opts?: { filled?: boolean; outline?: boolean; r?: number }) => React.ReactNode
type L = (x1: number, y1: number, x2: number, y2: number) => React.ReactNode
type D = (cx: number, cy: number, r?: number) => React.ReactNode
interface SA { stroke: string; accent: string }

function introShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 센터 타이틀 + 서브 라인
  if (v === 1)
    return (
      <>
        {l(8, 8, 28, 8)}
        {r(10, 11, 16, 3, { filled: true, outline: false })}
        {l(8, 17, 28, 17)}
      </>
    )
  // V2: 상단 라벨 + 큰 타이포
  if (v === 2)
    return (
      <>
        {l(12, 5, 24, 5)}
        {r(6, 9, 24, 7, { filled: true, outline: false })}
        {l(14, 19, 22, 19)}
      </>
    )
  // V3: 좌측 수직 라인 + 타이틀
  if (v === 3)
    return (
      <>
        {l(6, 4, 6, 20)}
        {r(10, 8, 20, 3, { filled: true, outline: false })}
        {r(10, 13, 14, 2)}
        {r(10, 16, 10, 2)}
      </>
    )
  // V4: 아치 (arch doorway)
  if (v === 4)
    return (
      <>
        <path d="M8 22 L8 8 Q18 0 28 8 L28 22" stroke={s.stroke} fill="none" strokeWidth="0.6" />
        {r(12, 14, 12, 2, { filled: true, outline: false })}
        {l(13, 18, 23, 18)}
      </>
    )
  // V5: 에디토리얼 (big date number)
  if (v === 5)
    return (
      <>
        {l(6, 4, 30, 4)}
        <text x="18" y="15" textAnchor="middle" fontSize="14" fill={s.stroke} opacity="0.15" fontWeight="300">16</text>
        {r(10, 16, 16, 2, { filled: true, outline: false })}
        {l(12, 20, 24, 20)}
      </>
    )
  // V6: 티커 (scrolling bands + center)
  if (v === 6)
    return (
      <>
        {l(4, 6, 32, 6)}
        {l(4, 8, 32, 8)}
        {r(8, 10, 20, 4, { filled: true, outline: false })}
        {l(4, 16, 32, 16)}
        {l(4, 18, 32, 18)}
      </>
    )
  // V7: 그리드 (crosshair + corners)
  if (v === 7)
    return (
      <>
        {l(6, 8, 30, 8)}
        {l(6, 16, 30, 16)}
        {l(12, 2, 12, 22)}
        {l(24, 2, 24, 22)}
        {r(13, 10, 10, 3, { filled: true, outline: false })}
      </>
    )
  // V8: 실 (monogram seal circle)
  if (v === 8)
    return (
      <>
        <circle cx="18" cy="10" r="6" stroke={s.stroke} fill="none" strokeWidth="0.6" />
        <circle cx="18" cy="10" r="4.5" stroke={s.stroke} fill="none" strokeWidth="0.4" opacity="0.5" />
        {r(12, 18, 12, 2, { filled: true, outline: false })}
        {l(14, 22, 22, 22)}
      </>
    )
  // V9: 룰스택 (horizontal rule stack)
  return (
    <>
      {l(6, 5, 30, 5)}
      {l(12, 8, 24, 8)}
      {l(6, 11, 30, 11)}
      {r(8, 13, 20, 3, { filled: true, outline: false })}
      {l(6, 18, 30, 18)}
      {l(10, 21, 26, 21)}
    </>
  )
}

function greetingShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 3줄 본문
  if (v === 1)
    return (
      <>
        {l(6, 6, 30, 6)}
        {l(6, 10, 30, 10)}
        {l(6, 14, 26, 14)}
        {l(6, 18, 28, 18)}
      </>
    )
  // V2: 라벨 + 본문
  if (v === 2)
    return (
      <>
        {r(6, 4, 8, 2, { filled: true, outline: false })}
        {l(6, 9, 30, 9)}
        {l(6, 13, 30, 13)}
        {l(6, 17, 28, 17)}
      </>
    )
  // V3: 센터 정렬
  if (v === 3)
    return (
      <>
        {l(10, 5, 26, 5)}
        {l(8, 10, 28, 10)}
        {l(10, 14, 26, 14)}
        {l(12, 18, 24, 18)}
      </>
    )
  // V4: 인용 블록
  if (v === 4)
    return (
      <>
        {l(4, 6, 4, 18)}
        {l(8, 7, 30, 7)}
        {l(8, 11, 30, 11)}
        {l(8, 15, 28, 15)}
        {l(8, 19, 24, 19)}
      </>
    )
  // V5: 카드
  return (
    <>
      {r(4, 4, 28, 16)}
      {l(8, 8, 28, 8)}
      {l(8, 12, 28, 12)}
      {l(8, 16, 24, 16)}
    </>
  )
}

function coupleShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 좌우 아치 + 텍스트 (실제 렌더: arch shape)
  if (v === 1)
    return (
      <>
        {/* 아치 형태: 윗부분 둥글고 아래는 직선 */}
        <path d="M6,14 L6,9 Q6,5 10,5 Q14,5 14,9 L14,14 Z" fill="transparent" stroke={s.stroke} strokeWidth={0.6} />
        <path d="M22,14 L22,9 Q22,5 26,5 Q30,5 30,9 L30,14 Z" fill="transparent" stroke={s.stroke} strokeWidth={0.6} />
        {l(4, 17, 16, 17)}
        {l(20, 17, 32, 17)}
      </>
    )
  // V2: 세로 스택 원형 포토 (실제 렌더: circle 88px + 그리드)
  if (v === 2)
    return (
      <>
        <circle cx={8} cy={8} r={4} fill="transparent" stroke={s.stroke} strokeWidth={0.6} />
        {l(14, 6, 32, 6)}
        {l(14, 10, 28, 10)}
        <circle cx={8} cy={18} r={4} fill="transparent" stroke={s.stroke} strokeWidth={0.6} />
        {l(14, 16, 32, 16)}
        {l(14, 20, 28, 20)}
      </>
    )
  // V3: 오버랩 포트레이트 (사진 겹침)
  if (v === 3)
    return (
      <>
        {r(6, 6, 10, 4, { filled: true, outline: false })}
        {r(20, 14, 10, 4, { filled: true, outline: false })}
        {l(4, 12, 32, 12)}
      </>
    )
  // V4: 카드 그리드 (3:4 세로 사진)
  if (v === 4)
    return (
      <>
        {r(4, 4, 13, 16)}
        {r(19, 4, 13, 16)}
      </>
    )
  // V5: 좌우 분할 센터라인 (실제 렌더: square 사진)
  return (
    <>
      {l(18, 3, 18, 21)}
      {r(6, 6, 8, 8)}
      {r(22, 6, 8, 8)}
      {l(4, 17, 16, 17)}
      {l(20, 17, 32, 17)}
    </>
  )
}

function infoShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 상자 + 날짜/장소
  if (v === 1)
    return (
      <>
        {r(6, 5, 24, 6)}
        {l(6, 14, 30, 14)}
        {l(6, 18, 30, 18)}
      </>
    )
  // V2: 큰 날짜 타이포
  if (v === 2)
    return (
      <>
        {r(5, 7, 26, 9, { filled: true, outline: false })}
        {l(10, 19, 26, 19)}
      </>
    )
  // V3: D-Day 카운터
  if (v === 3)
    return (
      <>
        {r(4, 8, 6, 8)}
        {r(12, 8, 6, 8)}
        {r(20, 8, 6, 8)}
        {r(28, 8, 4, 8)}
      </>
    )
  // V4: 세로 타임라인
  if (v === 4)
    return (
      <>
        {l(8, 5, 8, 20)}
        {d(8, 8)}
        {d(8, 13)}
        {d(8, 18)}
        {l(11, 8, 28, 8)}
        {l(11, 13, 26, 13)}
        {l(11, 18, 24, 18)}
      </>
    )
  // V5: 2×2 카드
  return (
    <>
      {r(4, 4, 13, 7)}
      {r(19, 4, 13, 7)}
      {r(4, 13, 13, 7)}
      {r(19, 13, 13, 7)}
    </>
  )
}

function directionShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 지도 + 라벨
  if (v === 1)
    return (
      <>
        {r(4, 4, 28, 10)}
        {d(18, 9, 1)}
        {l(6, 17, 30, 17)}
      </>
    )
  // V2: 큰 맵 + 베이지 박스
  if (v === 2)
    return (
      <>
        {r(4, 3, 28, 12)}
        {r(6, 17, 24, 4, { filled: true, outline: false })}
      </>
    )
  // V3: 정보 상단 + 맵 하단
  if (v === 3)
    return (
      <>
        {l(6, 5, 30, 5)}
        {l(6, 8, 26, 8)}
        {r(4, 11, 28, 10)}
      </>
    )
  // V4: 2단 그리드
  if (v === 4)
    return (
      <>
        {r(4, 4, 13, 16)}
        {r(19, 4, 13, 6)}
        {r(19, 12, 13, 8)}
      </>
    )
  // V5: 풀 맵 + 라벨 그리드
  return (
    <>
      {r(4, 3, 28, 9)}
      {r(4, 14, 13, 3)}
      {r(19, 14, 13, 3)}
      {r(4, 18, 13, 3)}
      {r(19, 18, 13, 3)}
    </>
  )
}

function interviewShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: Q + A
  if (v === 1)
    return (
      <>
        {l(6, 6, 30, 6)}
        {l(6, 10, 26, 10)}
        {l(6, 15, 30, 15)}
        {l(6, 19, 24, 19)}
      </>
    )
  // V2: 번호 매김
  if (v === 2)
    return (
      <>
        {d(6, 6)}
        {l(10, 6, 30, 6)}
        {d(6, 12)}
        {l(10, 12, 30, 12)}
        {d(6, 18)}
        {l(10, 18, 26, 18)}
      </>
    )
  // V3: 말풍선 좌우 교차
  if (v === 3)
    return (
      <>
        {r(4, 4, 18, 5, { r: 2 })}
        {r(14, 11, 18, 5, { r: 2 })}
        {r(4, 18, 18, 5, { r: 2 })}
      </>
    )
  // V4: 인용 이탤릭
  if (v === 4)
    return (
      <>
        {l(6, 5, 30, 5)}
        {l(6, 9, 26, 9)}
        {l(4, 14, 4, 20)}
        {l(8, 15, 30, 15)}
        {l(8, 19, 28, 19)}
      </>
    )
  // V5: 카드 Q./A.
  return (
    <>
      {r(4, 4, 28, 7)}
      {r(4, 13, 28, 7)}
    </>
  )
}

function galleryShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 피처 + 썸네일 (메인 4:5, 하단 4 썸네일 1:1)
  if (v === 1)
    return (
      <>
        {r(4, 3, 28, 12)}
        {r(4, 17, 6, 5)}
        {r(11.5, 17, 6, 5)}
        {r(19, 17, 6, 5)}
        {r(26.5, 17, 6, 5)}
      </>
    )
  // V2: 풀 슬라이드쇼 (scroll-snap + 도트)
  if (v === 2)
    return (
      <>
        {r(3, 3, 30, 14)}
        {d(14, 20, 0.9)}
        {d(18, 20, 0.9)}
        {d(22, 20, 0.9)}
      </>
    )
  // V3: 가로 전용 16:9 (와이드 직사각형 스택)
  if (v === 3)
    return (
      <>
        {r(3, 3, 30, 5)}
        {r(3, 10, 14.5, 5)}
        {r(18.5, 10, 14.5, 5)}
        {r(3, 17, 30, 5)}
      </>
    )
  // V4: 세로 전용 3:4 (포트레이트 그리드)
  if (v === 4)
    return (
      <>
        {r(4, 3, 12, 18)}
        {r(18, 3, 12, 8)}
        {r(18, 13, 12, 8)}
      </>
    )
  // V5: 가로세로 혼합 (1행 와이드 + 3행 정사각 + 2행 세로)
  return (
    <>
      {r(3, 3, 30, 5)}
      {r(3, 10, 9, 5)}
      {r(13.5, 10, 9, 5)}
      {r(24, 10, 9, 5)}
      {r(3, 17, 15, 5)}
      {r(20, 17, 13, 5)}
    </>
  )
}

function guideShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 항목 리스트
  if (v === 1)
    return (
      <>
        {d(6, 7)}
        {l(10, 7, 30, 7)}
        {d(6, 13)}
        {l(10, 13, 28, 13)}
        {d(6, 19)}
        {l(10, 19, 26, 19)}
      </>
    )
  // V2: 세로 리스트 원형 번호
  if (v === 2)
    return (
      <>
        <circle cx={7} cy={7} r={2} fill="transparent" stroke={s.stroke} strokeWidth={0.6} />
        {l(12, 7, 30, 7)}
        <circle cx={7} cy={13} r={2} fill="transparent" stroke={s.stroke} strokeWidth={0.6} />
        {l(12, 13, 28, 13)}
        <circle cx={7} cy={19} r={2} fill="transparent" stroke={s.stroke} strokeWidth={0.6} />
        {l(12, 19, 26, 19)}
      </>
    )
  // V3: 좌측 라벨 90px
  if (v === 3)
    return (
      <>
        {r(4, 5, 10, 2, { filled: true, outline: false })}
        {l(16, 6, 30, 6)}
        {r(4, 11, 10, 2, { filled: true, outline: false })}
        {l(16, 12, 30, 12)}
        {r(4, 17, 10, 2, { filled: true, outline: false })}
        {l(16, 18, 28, 18)}
      </>
    )
  // V4: 베이지 카드 2열
  if (v === 4)
    return (
      <>
        {r(4, 4, 13, 7, { filled: true, outline: false })}
        {r(19, 4, 13, 7, { filled: true, outline: false })}
        {r(4, 13, 13, 7, { filled: true, outline: false })}
        {r(19, 13, 13, 7, { filled: true, outline: false })}
      </>
    )
  // V5: 대시 구분
  return (
    <>
      {l(6, 7, 30, 7)}
      {l(6, 10, 30, 10)}
      {l(6, 13, 30, 13)}
      {l(6, 16, 30, 16)}
      {l(6, 19, 30, 19)}
    </>
  )
}

function accountShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 2 그룹
  if (v === 1)
    return (
      <>
        {r(4, 4, 13, 7)}
        {r(19, 4, 13, 7)}
        {l(6, 15, 30, 15)}
        {l(6, 19, 28, 19)}
      </>
    )
  // V2: 베이지 카드
  if (v === 2)
    return (
      <>
        {r(4, 5, 13, 14, { filled: true, outline: false })}
        {r(19, 5, 13, 14, { filled: true, outline: false })}
      </>
    )
  // V3: 전체 펼침
  if (v === 3)
    return (
      <>
        {l(6, 6, 30, 6)}
        {l(6, 10, 30, 10)}
        {l(6, 14, 30, 14)}
        {l(6, 18, 30, 18)}
      </>
    )
  // V4: 미니멀 리스트
  if (v === 4)
    return (
      <>
        {l(6, 7, 30, 7)}
        {l(6, 12, 30, 12)}
        {l(6, 17, 30, 17)}
        <polyline
          points="28,6 30,7 28,8"
          fill="none"
          stroke={s.stroke}
          strokeWidth={0.6}
        />
        <polyline
          points="28,11 30,12 28,13"
          fill="none"
          stroke={s.stroke}
          strokeWidth={0.6}
        />
      </>
    )
  // V5: 세로 스택 이탤릭
  return (
    <>
      {r(8, 4, 20, 2, { filled: true, outline: false })}
      {l(6, 9, 30, 9)}
      {l(6, 12, 26, 12)}
      {r(8, 16, 20, 2, { filled: true, outline: false })}
      {l(6, 20, 28, 20)}
    </>
  )
}

function rsvpShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 버튼 1개
  if (v === 1)
    return (
      <>
        {l(6, 7, 30, 7)}
        {l(6, 11, 28, 11)}
        {r(10, 15, 16, 5, { filled: true, outline: false, r: 1 })}
      </>
    )
  // V2: 베이지 필기체
  if (v === 2)
    return (
      <>
        {r(4, 4, 28, 16, { filled: true, outline: false })}
        {l(10, 12, 26, 12)}
      </>
    )
  // V3: 미니멀 상하 라인
  if (v === 3)
    return (
      <>
        {l(4, 6, 32, 6)}
        {l(6, 12, 30, 12)}
        {l(8, 15, 28, 15)}
        {l(4, 20, 32, 20)}
      </>
    )
  // V4: 듀얼 버튼
  if (v === 4)
    return (
      <>
        {l(6, 7, 30, 7)}
        {r(4, 13, 13, 7, { r: 1 })}
        {r(19, 13, 13, 7, { r: 1 })}
      </>
    )
  // V5: Save the Date + 프레임
  return (
    <>
      {r(3, 3, 30, 18)}
      {r(8, 7, 20, 3, { filled: true, outline: false })}
      {r(10, 14, 16, 4, { r: 1 })}
    </>
  )
}

function guestbookShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 리스트
  if (v === 1)
    return (
      <>
        {l(6, 6, 30, 6)}
        {l(6, 9, 28, 9)}
        {l(6, 14, 30, 14)}
        {l(6, 17, 26, 17)}
        {r(10, 20, 16, 2)}
      </>
    )
  // V2: 카드 그리드
  if (v === 2)
    return (
      <>
        {r(4, 4, 13, 7)}
        {r(19, 4, 13, 7)}
        {r(4, 13, 13, 7)}
        {r(19, 13, 13, 7)}
      </>
    )
  // V3: 타임라인
  if (v === 3)
    return (
      <>
        {l(8, 4, 8, 20)}
        {d(8, 7)}
        {l(11, 7, 30, 7)}
        {d(8, 13)}
        {l(11, 13, 28, 13)}
        {d(8, 19)}
        {l(11, 19, 26, 19)}
      </>
    )
  // V4: 편지지
  if (v === 4)
    return (
      <>
        {r(4, 3, 28, 18)}
        {l(4, 8, 32, 8)}
        {l(4, 12, 32, 12)}
        {l(4, 16, 32, 16)}
      </>
    )
  // V5: 컴팩트 리스트
  return (
    <>
      {l(6, 6, 30, 6)}
      {l(4, 9, 32, 9)}
      {l(6, 12, 30, 12)}
      {l(4, 15, 32, 15)}
      {l(6, 18, 30, 18)}
    </>
  )
}

function thanksShapes(v: number, r: R, l: L, d: D, s: SA): React.ReactNode {
  // V1: 기본 감사 메시지
  if (v === 1)
    return (
      <>
        {r(10, 4, 16, 3, { filled: true, outline: false })}
        {l(6, 11, 30, 11)}
        {l(6, 15, 28, 15)}
        {l(8, 19, 28, 19)}
      </>
    )
  // V2: 미니멀 라인
  if (v === 2)
    return (
      <>
        {l(8, 6, 28, 6)}
        {r(12, 10, 12, 3, { filled: true, outline: false })}
        {l(8, 17, 28, 17)}
      </>
    )
  // V3: 스크립트 마크 대형
  if (v === 3)
    return (
      <>
        {r(6, 5, 24, 10, { filled: true, outline: false })}
        {l(10, 19, 26, 19)}
      </>
    )
  // V4: 카드 프레임 베이지
  if (v === 4)
    return (
      <>
        {r(4, 4, 28, 16, { filled: true, outline: false })}
        {l(8, 11, 28, 11)}
        {l(8, 15, 26, 15)}
      </>
    )
  // V5: 센터 스탬프 더블 보더
  return (
    <>
      {r(3, 3, 30, 18)}
      {r(6, 6, 24, 12)}
      {d(18, 12, 1.5)}
    </>
  )
}

function lovestoryShapes(variant: number, r: R, l: L, d: D, { stroke }: { stroke: string; accent: string }) {
  // V2: 좌사진 우텍스트
  if (variant === 2)
    return (
      <>
        {r(PAD, PAD, 14, 20)}
        {l(19, 6, 33, 6)}
        {l(19, 10, 30, 10)}
        {l(19, 14, 33, 14)}
        {l(19, 18, 28, 18)}
      </>
    )
  // V3: 풀폭 배경 + 텍스트
  if (variant === 3)
    return (
      <>
        {r(PAD, PAD, W - PAD * 2, H - PAD * 2)}
        {l(8, 10, 28, 10)}
        {l(10, 14, 26, 14)}
      </>
    )
  // V4: 카드
  if (variant === 4)
    return (
      <>
        {r(4, PAD, 28, 8)}
        {l(8, 13, 28, 13)}
        {l(8, 16, 24, 16)}
        {l(8, 19, 26, 19)}
      </>
    )
  // V5: 타임라인
  if (variant === 5)
    return (
      <>
        <line x1={8} y1={PAD} x2={8} y2={H - PAD} stroke={stroke} strokeWidth={0.6} />
        {d(8, 6)}
        {l(12, 6, 32, 6)}
        {l(12, 10, 28, 10)}
        {d(8, 16)}
        {l(12, 16, 30, 16)}
        {l(12, 20, 26, 20)}
      </>
    )
  // V1: 기본 (사진 위 + 텍스트 아래)
  return (
    <>
      {r(PAD, PAD, W - PAD * 2, 10)}
      {l(8, 16, 28, 16)}
      {l(10, 20, 26, 20)}
    </>
  )
}

function videoShapes(variant: number, r: R, l: L, d: D, { stroke, accent }: { stroke: string; accent: string }) {
  // V2: 풀폭
  if (variant === 2)
    return (
      <>
        {r(PAD, PAD, W - PAD * 2, H - PAD * 2)}
        <polygon points="15,8 15,16 22,12" fill={accent} />
      </>
    )
  // V3: 시네마 (어두운 배경 + letterbox)
  if (variant === 3)
    return (
      <>
        {r(PAD, PAD, W - PAD * 2, H - PAD * 2, { filled: true })}
        {r(5, 5, W - 10, H - 10)}
        <polygon points="16,9 16,15 21,12" fill={stroke} />
      </>
    )
  // V1: 기본 (라운드)
  return (
    <>
      {l(8, 4, 28, 4)}
      {r(4, 7, 28, 14, { r: 2 })}
      <polygon points="16,11 16,17 21,14" fill={accent} />
    </>
  )
}
