import React from 'react'

export interface IconProps {
  size?: number
  color?: string
  className?: string
}

const defaults = { size: 24, strokeWidth: 1.5 }

export function BouquetIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="2" />
      <circle cx="12" cy="4" r="2.2" />
      <circle cx="15.5" cy="6" r="2.2" />
      <circle cx="15.5" cy="10" r="2.2" />
      <circle cx="8.5" cy="6" r="2.2" />
      <circle cx="8.5" cy="10" r="2.2" />
      <path d="M12 12v9" />
    </svg>
  )
}

export function WreathIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4c-1 2-1 4 0 5s1 3 0 5" />
      <path d="M8.5 5.5c0 2 1 3.5 2 4s1.5 2.5 0.5 4.5" />
      <path d="M15.5 5.5c0 2-1 3.5-2 4s-1.5 2.5-0.5 4.5" />
    </svg>
  )
}

export function FlowerChildIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="14" r="6" />
      <path d="M14.5 8L12 11 9.5 8" />
      <circle cx="12" cy="6" r="2.5" />
    </svg>
  )
}

export function CutleryIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 3v7a3 3 0 0 0 3 3v0a3 3 0 0 0 3-3V3" />
      <path d="M10 3v7" />
      <path d="M10 13v8" />
      <path d="M17 3c0 0 0 4-0.5 6s-1.5 3-1.5 4v8" />
    </svg>
  )
}

export function CameraIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export function BusIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="3" width="16" height="16" rx="2" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
      <path d="M4 19v2" />
      <path d="M20 19v2" />
    </svg>
  )
}

export function PinIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

export function SubwayIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 10h14" />
      <circle cx="8.5" cy="13.5" r="1" />
      <circle cx="15.5" cy="13.5" r="1" />
      <path d="M8 17l-2 4" />
      <path d="M16 17l2 4" />
      <path d="M9 21h6" />
    </svg>
  )
}

export function ExpressBusIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 17h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
      <path d="M3 10h18" />
      <circle cx="7" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
      <path d="M8.5 19.5h7" />
    </svg>
  )
}

export function TrainIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="2" width="14" height="16" rx="3" />
      <path d="M5 10h14" />
      <circle cx="8.5" cy="14" r="1" />
      <circle cx="15.5" cy="14" r="1" />
      <path d="M12 2v8" />
      <path d="M7.5 18l-2.5 4" />
      <path d="M16.5 18l2.5 4" />
    </svg>
  )
}

export function ParkingIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  )
}

export function HeartIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function GiftIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M3 12h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z" />
      <path d="M7.5 8C7.5 8 7 3 12 3s4.5 5 4.5 5" />
    </svg>
  )
}

export function MusicIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

export function ClockIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

export function InfoIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

export function StarIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function BellIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ─── Icon Registry ─── 키 문자열 → 컴포넌트 매핑
export const SVG_ICON_KEYS = [
  'bouquet', 'wreath', 'flower-child', 'cutlery', 'camera',
  'bus', 'pin', 'subway', 'express-bus', 'train', 'parking',
  'heart', 'gift', 'music', 'clock', 'info', 'star', 'bell',
] as const

export type SvgIconKey = typeof SVG_ICON_KEYS[number]

export const SVG_ICON_LABELS: Record<SvgIconKey, string> = {
  'bouquet': '꽃다발',
  'wreath': '화환',
  'flower-child': '꽃/화동',
  'cutlery': '식사',
  'camera': '카메라',
  'bus': '버스',
  'pin': '위치',
  'subway': '지하철',
  'express-bus': '고속버스',
  'train': '기차',
  'parking': '주차',
  'heart': '하트',
  'gift': '선물',
  'music': '음악',
  'clock': '시계',
  'info': '안내',
  'star': '별',
  'bell': '알림',
}

const ICON_MAP: Record<SvgIconKey, (props: IconProps) => React.JSX.Element> = {
  'bouquet': BouquetIcon,
  'wreath': WreathIcon,
  'flower-child': FlowerChildIcon,
  'cutlery': CutleryIcon,
  'camera': CameraIcon,
  'bus': BusIcon,
  'pin': PinIcon,
  'subway': SubwayIcon,
  'express-bus': ExpressBusIcon,
  'train': TrainIcon,
  'parking': ParkingIcon,
  'heart': HeartIcon,
  'gift': GiftIcon,
  'music': MusicIcon,
  'clock': ClockIcon,
  'info': InfoIcon,
  'star': StarIcon,
  'bell': BellIcon,
}

/** "svg:bouquet" 형태의 문자열 → SVG React 엘리먼트, 실패 시 null */
export function renderSvgIcon(value: string, props: IconProps = {}): React.ReactNode | null {
  if (!value.startsWith('svg:')) return null
  const key = value.slice(4) as SvgIconKey
  const Component = ICON_MAP[key]
  if (!Component) return null
  return <Component {...props} />
}
