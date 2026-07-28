import React from 'react'

export interface IconProps {
  size?: number
  color?: string
  className?: string
  strokeWidth?: number
}

const base = { size: 20, strokeWidth: 1.75 }

function Svg({ size = base.size, color = 'currentColor', strokeWidth = base.strokeWidth, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// 게스트/사람들
export function UsersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="8" r="3.2" />
      <path d="M22 20v-1a4 4 0 0 0-3-3.87" />
      <path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.9" />
    </Svg>
  )
}

// RSVP / 응답 목록
export function ClipboardIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="8" y="4" width="8" height="3.2" rx="1" />
      <path d="M8 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H16" />
      <path d="M8.5 12h7M8.5 15.5h5" />
    </Svg>
  )
}

// 도움말 / 가이드
export function HelpIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.4 2-2.4 3.6" />
      <circle cx="12" cy="17" r="0.6" fill={p.color || 'currentColor'} stroke="none" />
    </Svg>
  )
}

// 공유 (내보내기)
export function ShareIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v11" />
      <path d="M8.5 6.5 12 3l3.5 3.5" />
      <path d="M6 12H5a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 5 20h14a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 19 12h-1" />
    </Svg>
  )
}

// 비밀번호 (자물쇠)
export function LockIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  )
}

// 로그아웃
export function LogoutIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M10 12h10" />
      <path d="M13 8.5 16.5 12 13 15.5" />
    </Svg>
  )
}

// 아래 화살표 (아코디언)
export function ChevronDownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 9.5 12 15l6-5.5" />
    </Svg>
  )
}

// 봉투 (메일)
export function MailIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </Svg>
  )
}

// 편지지 / 문서
export function LetterIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 15.5h6M9 8.5h2" />
    </Svg>
  )
}

// 휴대폰 (미리보기)
export function PhoneIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="7" y="3" width="10" height="18" rx="2.2" />
      <path d="M11 18h2" />
    </Svg>
  )
}

// 인사말 작성 (연필)
export function EditIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M13.5 6.5 17.5 10.5" />
      <path d="M4 20l1-4L15.5 5.5a2 2 0 0 1 2.8 0l0.2.2a2 2 0 0 1 0 2.8L8 19l-4 1z" />
    </Svg>
  )
}

// 팁 (전구)
export function BulbIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 17.5h6" />
      <path d="M10 20.5h4" />
      <path d="M12 3.5a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3.5z" />
    </Svg>
  )
}
