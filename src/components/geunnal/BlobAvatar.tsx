'use client'

// Preset indices
export const GROOM_AVATAR_START = 0
export const BRIDE_AVATAR_START = 12
export const AVATARS_PER_SIDE = 12

// 12 hairstyles with back and front paths
const hairstyles = [
  // 0: Short messy
  {
    back: 'M60,35 Q45,25 50,15 Q55,10 60,12 Q65,10 70,15 Q75,25 60,35 Z',
    front: 'M45,28 Q42,22 45,18 Q48,20 50,22 M70,28 Q73,22 70,18 Q67,20 65,22',
  },
  // 1: Side part
  {
    back: 'M60,35 Q40,20 48,12 Q55,8 60,10 Q65,8 72,12 Q80,20 60,35 Z',
    front: 'M42,25 Q40,18 45,15 L52,20 M68,20 Q72,18 75,22',
  },
  // 2: Pompadour
  {
    back: 'M60,35 Q45,28 50,18 Q55,12 60,8 Q65,12 70,18 Q75,28 60,35 Z',
    front: 'M50,18 Q52,12 60,10 Q68,12 70,18 M45,25 Q43,20 45,18 M75,25 Q77,20 75,18',
  },
  // 3: Wavy side
  {
    back: 'M60,35 Q42,25 47,15 Q52,10 60,12 Q68,10 73,15 Q78,25 60,35 Z',
    front: 'M44,28 Q42,24 43,20 Q45,22 47,24 M70,22 Q73,20 76,24',
  },
  // 4: Textured crop
  {
    back: 'M60,35 Q46,26 50,16 Q55,11 60,13 Q65,11 70,16 Q74,26 60,35 Z',
    front: 'M48,22 L50,18 L52,22 M65,18 L67,22 L69,18 M58,16 L60,20',
  },
  // 5: Slicked back
  {
    back: 'M60,35 Q44,24 50,14 Q55,9 60,11 Q65,9 70,14 Q76,24 60,35 Z',
    front: 'M47,26 Q45,22 47,18 M60,14 Q58,18 60,22 M73,26 Q75,22 73,18',
  },
  // 6: Curly top
  {
    back: 'M60,35 Q43,26 48,14 Q54,8 60,10 Q66,8 72,14 Q77,26 60,35 Z',
    front: 'M50,20 Q48,16 50,12 Q52,14 54,16 M66,16 Q68,14 70,12 Q72,16 70,20',
  },
  // 7: Undercut
  {
    back: 'M60,35 Q46,28 52,18 Q56,13 60,14 Q64,13 68,18 Q74,28 60,35 Z',
    front: 'M50,26 L48,22 L50,18 M70,18 L72,22 L70,26',
  },
  // 8: Spiky
  {
    back: 'M60,35 Q45,27 50,17 Q55,12 60,10 Q65,12 70,17 Q75,27 60,35 Z',
    front: 'M48,24 L46,18 M54,22 L52,14 M60,20 L58,12 M66,22 L68,14 M72,24 L74,18',
  },
  // 9: Fringe
  {
    back: 'M60,35 Q43,25 49,15 Q55,10 60,12 Q65,10 71,15 Q77,25 60,35 Z',
    front: 'M45,24 L47,20 L49,24 M52,24 L54,20 L56,24 M59,24 L61,20 L63,24 M66,24 L68,20 L70,24',
  },
  // 10: Side sweep
  {
    back: 'M60,35 Q44,26 50,16 Q55,11 60,13 Q65,11 70,16 Q76,26 60,35 Z',
    front: 'M46,26 Q44,22 46,18 Q50,20 54,22 M68,22 Q72,24 74,26',
  },
  // 11: Brushed up
  {
    back: 'M60,35 Q45,28 51,18 Q56,13 60,11 Q64,13 69,18 Q75,28 60,35 Z',
    front: 'M50,22 Q48,18 50,14 M60,18 Q58,14 60,10 M70,22 Q72,18 70,14',
  },
]

// 6 expressions
const expressions = [
  // 0: Smile
  { eyes: 'M48,45 Q50,43 52,45 M68,45 Q70,43 72,45', mouth: 'M52,58 Q60,62 68,58' },
  // 1: Laugh
  { eyes: 'M46,44 Q50,42 54,44 M66,44 Q70,42 74,44', mouth: 'M50,56 Q60,64 70,56 Q60,60 50,56 Z' },
  // 2: Wink
  { eyes: 'M48,45 Q50,43 52,45 M68,44 L74,44', mouth: 'M52,58 Q60,62 68,58' },
  // 3: Surprised
  { eyes: 'M50,45 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0 M70,45 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0', mouth: 'M60,60 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0' },
  // 4: Blushing
  { eyes: 'M48,45 Q50,43 52,45 M68,45 Q70,43 72,45', mouth: 'M52,58 Q60,60 68,58', blush: true },
  // 5: Glasses
  { eyes: 'M50,45 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M70,45 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M53,45 L67,45', mouth: 'M52,58 Q60,62 68,58', glasses: true },
]

// Avatar presets (24 total: 0-11 groom/sky, 12-23 bride/pink)
export const avatarPresets = [
  // Groom presets (0-11) - sky blue
  { hairstyle: 0, expression: 0, color: 'sky' },
  { hairstyle: 1, expression: 1, color: 'sky' },
  { hairstyle: 2, expression: 0, color: 'sky' },
  { hairstyle: 3, expression: 2, color: 'sky' },
  { hairstyle: 4, expression: 0, color: 'sky' },
  { hairstyle: 5, expression: 1, color: 'sky' },
  { hairstyle: 6, expression: 0, color: 'sky' },
  { hairstyle: 7, expression: 5, color: 'sky' },
  { hairstyle: 8, expression: 0, color: 'sky' },
  { hairstyle: 9, expression: 1, color: 'sky' },
  { hairstyle: 10, expression: 0, color: 'sky' },
  { hairstyle: 11, expression: 2, color: 'sky' },
  // Bride presets (12-23) - pink
  { hairstyle: 0, expression: 4, color: 'pink' },
  { hairstyle: 1, expression: 0, color: 'pink' },
  { hairstyle: 2, expression: 4, color: 'pink' },
  { hairstyle: 3, expression: 0, color: 'pink' },
  { hairstyle: 4, expression: 4, color: 'pink' },
  { hairstyle: 5, expression: 1, color: 'pink' },
  { hairstyle: 6, expression: 4, color: 'pink' },
  { hairstyle: 7, expression: 0, color: 'pink' },
  { hairstyle: 8, expression: 4, color: 'pink' },
  { hairstyle: 9, expression: 0, color: 'pink' },
  { hairstyle: 10, expression: 4, color: 'pink' },
  { hairstyle: 11, expression: 1, color: 'pink' },
]

interface BlobAvatarProps {
  hairstyle?: number
  expression?: number
  color?: 'pink' | 'sky'
  size?: number
  className?: string
  showBorder?: boolean
}

export default function BlobAvatar({
  hairstyle = 0,
  expression = 0,
  color = 'sky',
  size = 120,
  className = '',
  showBorder = true,
}: BlobAvatarProps) {
  const hairColor = color === 'pink' ? '#F48FB1' : '#90CAF9'
  const skinColor = '#FDEBD3'
  const featureColor = '#2A2240'

  const hair = hairstyles[hairstyle % hairstyles.length]
  const expr = expressions[expression % expressions.length]

  return (
    <div
      className={`flex items-center justify-center ${showBorder ? 'ring-2 ring-[#8B75D0]' : ''} rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Hair back */}
        <path d={hair.back} fill={hairColor} />

        {/* Head */}
        <circle cx="60" cy="50" r="25" fill={skinColor} />

        {/* Blush */}
        {expr.blush && (
          <>
            <circle cx="46" cy="52" r="4" fill="#F48FB1" opacity="0.4" />
            <circle cx="74" cy="52" r="4" fill="#F48FB1" opacity="0.4" />
          </>
        )}

        {/* Eyes */}
        <path d={expr.eyes} stroke={featureColor} strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Glasses frame */}
        {expr.glasses && (
          <path d={expr.eyes} stroke={featureColor} strokeWidth="1.5" fill="none" opacity="0.6" />
        )}

        {/* Mouth */}
        <path d={expr.mouth} stroke={featureColor} strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Hair front */}
        <path d={hair.front} stroke={hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// Helper component to render avatar by preset ID
export function BlobAvatarById({ id, size, className, showBorder }: { id: number; size?: number; className?: string; showBorder?: boolean }) {
  const preset = avatarPresets[id % avatarPresets.length]
  return (
    <BlobAvatar
      hairstyle={preset.hairstyle}
      expression={preset.expression}
      color={preset.color as 'pink' | 'sky'}
      size={size}
      className={className}
      showBorder={showBorder}
    />
  )
}
