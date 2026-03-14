'use client'

/**
 * BlobAvatar — 사람 얼굴 일러스트 아바타
 * 12 헤어스타일 × 2 컬러(분홍/하늘) × 6 표정 = 144 조합
 * 24개 큐레이션 프리셋
 */

// Preset indices
export const GROOM_AVATAR_START = 0
export const BRIDE_AVATAR_START = 12
export const AVATARS_PER_SIDE = 12

// Constants
const SKIN = '#FDEBD3'
const FEAT = '#2A2240'

// 2 accent colors: 분홍 & 하늘
const hairColors = [
  '#F48FB1', // pink
  '#90CAF9', // sky blue
]

// Face: cx=50 cy=56 r=24 (top:32 bottom:80 left:26 right:74)
// Hairstyles: back(behind face) + front(bangs on top of face)
const hairstyles = [
  // 0: Short crop (짧은 머리)
  {
    back: (c: string) => <path d="M26,56 C26,30 36,18 50,18 C64,18 74,30 74,56 Z" fill={c} />,
    front: (c: string) => <path d="M28,40 C30,30 40,22 50,22 C60,22 70,30 72,40 C68,36 58,32 50,32 C42,32 32,36 28,40 Z" fill={c} />,
  },
  // 1: Bob (단발)
  {
    back: (c: string) => <path d="M22,68 C20,30 34,14 50,14 C66,14 80,30 78,68 Z" fill={c} />,
    front: (c: string) => <path d="M26,44 C26,28 38,20 50,20 C62,20 74,28 74,44 C70,40 60,38 50,38 C40,38 30,40 26,44 Z" fill={c} />,
  },
  // 2: Long straight (긴 생머리)
  {
    back: (c: string) => <path d="M20,92 C18,46 26,14 50,12 C74,14 82,46 80,92 Z" fill={c} />,
    front: (c: string) => (
      <>
        <path d="M28,44 C28,28 38,18 50,18 L50,36 C40,36 32,38 28,44 Z" fill={c} />
        <path d="M72,44 C72,28 62,18 50,18 L50,36 C60,36 68,38 72,44 Z" fill={c} />
      </>
    ),
  },
  // 3: Ponytail (포니테일)
  {
    back: (c: string) => (
      <>
        <path d="M26,56 C26,30 36,18 50,18 C64,18 74,30 74,56 Z" fill={c} />
        <path d="M70,38 Q80,34 86,42 Q90,54 84,68 Q82,74 78,70 Q82,58 80,46 Q78,40 72,40 Z" fill={c} />
      </>
    ),
    front: (c: string) => <path d="M28,40 C30,28 40,20 50,20 C60,20 70,28 72,40 C68,36 58,30 50,30 C42,30 32,36 28,40 Z" fill={c} />,
  },
  // 4: Curly (곱슬)
  {
    back: (c: string) => <path d="M14,66 C10,38 20,10 50,8 C80,10 90,38 86,66 Z" fill={c} />,
    front: (c: string) => (
      <path d="M22,40 C20,30 24,20 32,16 C36,14 40,16 38,22 C36,16 42,10 50,10 C58,10 64,16 62,22 C60,16 64,14 68,16 C76,20 80,30 78,40 C76,36 70,30 62,28 C56,26 52,24 50,24 C48,24 44,26 38,28 C30,30 24,36 22,40 Z" fill={c} />
    ),
  },
  // 5: Top bun (똥머리)
  {
    back: (c: string) => (
      <>
        <circle cx={50} cy={12} r={13} fill={c} />
        <path d="M26,56 C26,30 36,20 50,20 C64,20 74,30 74,56 Z" fill={c} />
      </>
    ),
    front: (c: string) => <path d="M28,40 C30,30 40,24 50,24 C60,24 70,30 72,40 C68,36 58,32 50,32 C42,32 32,36 28,40 Z" fill={c} />,
  },
  // 6: Side swept (사이드)
  {
    back: (c: string) => <path d="M24,58 C22,28 34,14 50,14 C66,14 78,28 76,58 Z" fill={c} />,
    front: (c: string) => <path d="M24,44 C24,24 36,16 50,16 C56,16 62,18 66,22 L60,30 C56,26 52,24 50,24 C40,24 30,30 28,44 Z" fill={c} />,
  },
  // 7: Full bangs (앞머리 + 어깨)
  {
    back: (c: string) => <path d="M22,78 C20,38 30,14 50,12 C70,14 80,38 78,78 Z" fill={c} />,
    front: (c: string) => <path d="M26,46 C26,28 38,18 50,18 C62,18 74,28 74,46 C68,44 58,42 50,42 C42,42 32,44 26,46 Z" fill={c} />,
  },
  // 8: Spiky (뾰족머리)
  {
    back: (c: string) => <path d="M26,50 C26,36 38,26 50,26 C62,26 74,36 74,50 Z" fill={c} />,
    front: (c: string) => (
      <>
        <path d="M32,40 C32,32 36,10 40,8 C42,14 44,34 44,38 Z" fill={c} />
        <path d="M40,36 C40,28 46,4 50,2 C54,4 58,28 58,36 Z" fill={c} />
        <path d="M54,38 C54,30 58,12 62,10 C64,16 66,34 66,40 Z" fill={c} />
        <path d="M24,46 C24,38 30,18 34,16 C36,22 38,40 38,44 Z" fill={c} />
        <path d="M62,44 C62,36 66,16 70,14 C72,20 74,40 74,46 Z" fill={c} />
      </>
    ),
  },
  // 9: Side part (가르마)
  {
    back: (c: string) => <path d="M26,56 C26,28 36,16 50,16 C64,16 74,28 74,56 Z" fill={c} />,
    front: (c: string) => (
      <>
        <path d="M28,42 C28,28 36,22 44,22 L44,36 C38,36 32,38 28,42 Z" fill={c} />
        <path d="M56,22 C64,22 72,28 72,42 C68,38 62,36 56,36 L56,22 Z" fill={c} />
      </>
    ),
  },
  // 10: Twin tails (양갈래)
  {
    back: (c: string) => (
      <>
        <path d="M26,56 C26,30 36,18 50,18 C64,18 74,30 74,56 Z" fill={c} />
        <ellipse cx={16} cy={62} rx={9} ry={18} fill={c} />
        <ellipse cx={84} cy={62} rx={9} ry={18} fill={c} />
      </>
    ),
    front: (c: string) => (
      <>
        <path d="M28,42 C28,28 38,20 48,20 L48,36 C40,36 32,38 28,42 Z" fill={c} />
        <path d="M52,20 C62,20 72,28 72,42 C68,38 60,36 52,36 L52,20 Z" fill={c} />
        <circle cx={20} cy={46} r={4} fill={c} />
        <circle cx={80} cy={46} r={4} fill={c} />
      </>
    ),
  },
  // 11: Wavy (웨이브)
  {
    back: (c: string) => <path d="M18,74 C16,36 30,12 50,10 C70,12 84,36 82,74 Z" fill={c} />,
    front: (c: string) => (
      <path d="M26,42 C26,28 38,18 50,18 C62,18 74,28 74,42 Q70,38 66,42 Q62,46 58,42 Q54,38 50,42 Q46,46 42,42 Q38,38 34,42 Q30,46 26,42 Z" fill={c} />
    ),
  },
]

// 6 expressions
const expressions = [
  // 0: 기본 미소
  {
    eyes: () => (
      <>
        <circle cx={41} cy={54} r={2.5} fill={FEAT} />
        <circle cx={59} cy={54} r={2.5} fill={FEAT} />
      </>
    ),
    mouth: () => <path d="M44,64 Q50,69 56,64" fill="none" stroke={FEAT} strokeWidth={1.8} strokeLinecap="round" />,
  },
  // 1: 활짝 (눈웃음)
  {
    eyes: () => (
      <>
        <path d="M37,54 Q41,50 45,54" fill="none" stroke={FEAT} strokeWidth={2} strokeLinecap="round" />
        <path d="M55,54 Q59,50 63,54" fill="none" stroke={FEAT} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    mouth: () => <path d="M42,63 Q50,71 58,63" fill="none" stroke={FEAT} strokeWidth={1.8} strokeLinecap="round" />,
  },
  // 2: 윙크
  {
    eyes: () => (
      <>
        <circle cx={41} cy={54} r={2.5} fill={FEAT} />
        <path d="M55,54 Q59,50 63,54" fill="none" stroke={FEAT} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    mouth: () => <path d="M44,64 Q50,68 56,64" fill="none" stroke={FEAT} strokeWidth={1.8} strokeLinecap="round" />,
  },
  // 3: 놀람
  {
    eyes: () => (
      <>
        <circle cx={41} cy={53} r={3.5} fill="white" />
        <circle cx={41} cy={53} r={2} fill={FEAT} />
        <circle cx={59} cy={53} r={3.5} fill="white" />
        <circle cx={59} cy={53} r={2} fill={FEAT} />
      </>
    ),
    mouth: () => <ellipse cx={50} cy={66} rx={3} ry={3.5} fill={FEAT} />,
  },
  // 4: 볼터치
  {
    eyes: () => (
      <>
        <path d="M37,54 Q41,50 45,54" fill="none" stroke={FEAT} strokeWidth={2} strokeLinecap="round" />
        <path d="M55,54 Q59,50 63,54" fill="none" stroke={FEAT} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    mouth: () => <path d="M44,64 Q50,69 56,64" fill="none" stroke={FEAT} strokeWidth={1.8} strokeLinecap="round" />,
    extras: () => (
      <>
        <ellipse cx={32} cy={62} rx={6} ry={4} fill="#FF8A80" opacity={0.45} />
        <ellipse cx={68} cy={62} rx={6} ry={4} fill="#FF8A80" opacity={0.45} />
      </>
    ),
  },
  // 5: 안경
  {
    eyes: () => (
      <>
        <circle cx={41} cy={54} r={2} fill={FEAT} />
        <circle cx={59} cy={54} r={2} fill={FEAT} />
        <circle cx={41} cy={54} r={7} fill="none" stroke={FEAT} strokeWidth={1.5} />
        <circle cx={59} cy={54} r={7} fill="none" stroke={FEAT} strokeWidth={1.5} />
        <line x1={48} y1={54} x2={52} y2={54} stroke={FEAT} strokeWidth={1.5} />
      </>
    ),
    mouth: () => <path d="M44,66 Q50,70 56,66" fill="none" stroke={FEAT} strokeWidth={1.8} strokeLinecap="round" />,
  },
]

// 24 presets: 0~11 = 신랑측(하늘), 12~23 = 신부측(분홍)
export const avatarPresets = [
  // --- 신랑측 (하늘) 0~11 ---
  { hairIdx: 0, colorIdx: 1, exprIdx: 0 },   // short + 미소
  { hairIdx: 1, colorIdx: 1, exprIdx: 2 },   // bob + 윙크
  { hairIdx: 2, colorIdx: 1, exprIdx: 1 },   // long + 활짝
  { hairIdx: 3, colorIdx: 1, exprIdx: 5 },   // ponytail + 안경
  { hairIdx: 4, colorIdx: 1, exprIdx: 0 },   // curly + 미소
  { hairIdx: 5, colorIdx: 1, exprIdx: 4 },   // bun + 볼터치
  { hairIdx: 6, colorIdx: 1, exprIdx: 1 },   // side swept + 활짝
  { hairIdx: 7, colorIdx: 1, exprIdx: 3 },   // full bangs + 놀람
  { hairIdx: 8, colorIdx: 1, exprIdx: 0 },   // spiky + 미소
  { hairIdx: 9, colorIdx: 1, exprIdx: 2 },   // side part + 윙크
  { hairIdx: 10, colorIdx: 1, exprIdx: 4 },  // twin + 볼터치
  { hairIdx: 11, colorIdx: 1, exprIdx: 1 },  // wavy + 활짝
  // --- 신부측 (분홍) 12~23 ---
  { hairIdx: 0, colorIdx: 0, exprIdx: 1 },   // short + 활짝
  { hairIdx: 1, colorIdx: 0, exprIdx: 0 },   // bob + 미소
  { hairIdx: 2, colorIdx: 0, exprIdx: 4 },   // long + 볼터치
  { hairIdx: 3, colorIdx: 0, exprIdx: 1 },   // ponytail + 활짝
  { hairIdx: 4, colorIdx: 0, exprIdx: 2 },   // curly + 윙크
  { hairIdx: 5, colorIdx: 0, exprIdx: 0 },   // bun + 미소
  { hairIdx: 6, colorIdx: 0, exprIdx: 5 },   // side swept + 안경
  { hairIdx: 7, colorIdx: 0, exprIdx: 4 },   // full bangs + 볼터치
  { hairIdx: 8, colorIdx: 0, exprIdx: 3 },   // spiky + 놀람
  { hairIdx: 9, colorIdx: 0, exprIdx: 0 },   // side part + 미소
  { hairIdx: 10, colorIdx: 0, exprIdx: 1 },  // twin + 활짝
  { hairIdx: 11, colorIdx: 0, exprIdx: 2 },  // wavy + 윙크
]

interface BlobAvatarProps {
  id?: number
  size?: number
  className?: string
  showBorder?: boolean
  onClick?: () => void
  selected?: boolean
}

export default function BlobAvatar({
  id = 0,
  size = 48,
  className = '',
  showBorder = false,
  onClick,
  selected,
}: BlobAvatarProps) {
  const preset = avatarPresets[id % avatarPresets.length]
  const style = hairstyles[preset.hairIdx]
  const color = hairColors[preset.colorIdx]
  const expr = expressions[preset.exprIdx]

  const borderClass = selected
    ? 'ring-2 ring-[#90CAF9] ring-offset-2 rounded-full'
    : showBorder
      ? 'ring-2 ring-[#8B75D0] rounded-full'
      : ''

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 ${onClick ? 'cursor-pointer' : ''} ${borderClass} ${className}`}
      onClick={onClick}
    >
      {/* Ears */}
      <circle cx={27} cy={58} r={5} fill={SKIN} />
      <circle cx={73} cy={58} r={5} fill={SKIN} />

      {/* Hair back layer */}
      {style.back(color)}

      {/* Face */}
      <circle cx={50} cy={56} r={24} fill={SKIN} />

      {/* Hair front layer (bangs) */}
      {style.front(color)}

      {/* Extras (blush) */}
      {expr.extras?.()}

      {/* Eyes */}
      {expr.eyes()}

      {/* Mouth */}
      {expr.mouth()}
    </svg>
  )
}

// Helper component to render avatar by preset ID
export function BlobAvatarById({ id, size, className, showBorder }: { id: number; size?: number; className?: string; showBorder?: boolean }) {
  return (
    <BlobAvatar
      id={id}
      size={size}
      className={className}
      showBorder={showBorder}
    />
  )
}
