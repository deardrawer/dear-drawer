import React from 'react'

export interface IconProps {
  size?: number
  color?: string
  className?: string
}

const defaults = { size: 24, strokeWidth: 1.5 }

/* ─── Phosphor(fill 기반) 아이콘 베이스 ───
   viewBox 0 0 256 256, 단색 fill. color로 채움색 지정. */
function PhIcon({ size = defaults.size, color = 'currentColor', className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill={color} className={className} xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  )
}

/* ── 결혼식 안내 ── */
export function FlowerIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M210.35,129.36c-.81-.47-1.7-.92-2.62-1.36.92-.44,1.81-.89,2.62-1.36a40,40,0,1,0-40-69.28c-.81.47-1.65,1-2.48,1.59.08-1,.13-2,.13-3a40,40,0,0,0-80,0c0,.94,0,1.94.13,3-.83-.57-1.67-1.12-2.48-1.59a40,40,0,1,0-40,69.28c.81.47,1.7.92,2.62,1.36-.92.44-1.81.89-2.62,1.36a40,40,0,1,0,40,69.28c.81-.47,1.65-1,2.48-1.59-.08,1-.13,2-.13,2.95a40,40,0,0,0,80,0c0-.94-.05-1.94-.13-2.95.83.57,1.67,1.12,2.48,1.59A39.79,39.79,0,0,0,190.29,204a40.43,40.43,0,0,0,10.42-1.38,40,40,0,0,0,9.64-73.28ZM104,128a24,24,0,1,1,24,24A24,24,0,0,1,104,128Zm74.35-56.79a24,24,0,1,1,24,41.57c-6.27,3.63-18.61,6.13-35.16,7.19A40,40,0,0,0,154.53,98.1C163.73,84.28,172.08,74.84,178.35,71.21ZM128,32a24,24,0,0,1,24,24c0,7.24-4,19.19-11.36,34.06a39.81,39.81,0,0,0-25.28,0C108,75.19,104,63.24,104,56A24,24,0,0,1,128,32ZM44.86,80a24,24,0,0,1,32.79-8.79c6.27,3.63,14.62,13.07,23.82,26.89A40,40,0,0,0,88.81,120c-16.55-1.06-28.89-3.56-35.16-7.18A24,24,0,0,1,44.86,80ZM77.65,184.79a24,24,0,1,1-24-41.57c6.27-3.63,18.61-6.13,35.16-7.19a40,40,0,0,0,12.66,21.87C92.27,171.72,83.92,181.16,77.65,184.79ZM128,224a24,24,0,0,1-24-24c0-7.24,4-19.19,11.36-34.06a39.81,39.81,0,0,0,25.28,0C148,180.81,152,192.76,152,200A24,24,0,0,1,128,224Zm83.14-48a24,24,0,0,1-32.79,8.79c-6.27-3.63-14.62-13.07-23.82-26.89A40,40,0,0,0,167.19,136c16.55,1.06,28.89,3.56,35.16,7.18A24,24,0,0,1,211.14,176Z" /></PhIcon>
}

export function CloverIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M211.66,165.54C225.16,159.7,232,144.37,232,120s-6.84-39.7-20.34-45.55c-11.65-5-27.24-2.23-46.46,8.35,10.58-19.22,13.39-34.81,8.35-46.46C167.7,22.84,152.37,16,128,16S88.3,22.84,82.45,36.34c-5,11.65-2.23,27.24,8.35,46.45C71.58,72.22,56,69.4,44.34,74.45,30.84,80.3,24,95.63,24,120s6.84,39.7,20.34,45.54A31,31,0,0,0,56.8,168c9.6,0,21-3.62,34-10.79C80.22,176.41,77.41,192,82.45,203.65,88.3,217.15,103.63,224,128,224s39.7-6.85,45.55-20.35a32.24,32.24,0,0,0,2.34-15c10.45,16.23,19.64,34.48,24.35,53.33A8,8,0,0,0,208,248a8.13,8.13,0,0,0,1.95-.24,8,8,0,0,0,5.82-9.7c-6.94-27.76-22.27-53.8-37.86-74.79Q189.68,168,199.2,168A31,31,0,0,0,211.66,165.54Zm-6.37-76.4C214.14,93,216,108,216,120s-1.86,27-10.7,30.86c-8.36,3.63-23.52-1.31-42.68-13.91a243.4,243.4,0,0,1-22.54-17C158.49,104.37,190.4,82.68,205.29,89.14ZM97.14,42.7C101,33.86,116,32,128,32s27,1.86,30.86,10.7c3.63,8.36-1.31,23.52-13.91,42.68a243.4,243.4,0,0,1-17,22.54C112.37,89.51,90.69,57.59,97.14,42.7ZM50.71,150.86C41.86,147,40,132,40,120s1.86-27,10.7-30.86A15.64,15.64,0,0,1,57,88c8.75,0,21.34,5.17,36.4,15.07a243.4,243.4,0,0,1,22.54,17C97.51,135.62,65.59,157.32,50.71,150.86Zm108.15,46.43C155,206.14,140,208,128,208s-27-1.86-30.86-10.7c-3.63-8.36,1.31-23.52,13.91-42.68a243.4,243.4,0,0,1,17-22.54C143.63,150.49,165.31,182.41,158.86,197.29Z" /></PhIcon>
}

export function BabyIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M92,140a12,12,0,1,1,12-12A12,12,0,0,1,92,140Zm72-24a12,12,0,1,0,12,12A12,12,0,0,0,164,116Zm-12.27,45.23a45,45,0,0,1-47.46,0,8,8,0,0,0-8.54,13.54,61,61,0,0,0,64.54,0,8,8,0,0,0-8.54-13.54ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88.11,88.11,0,0,0-84.09-87.91C120.32,56.38,120,71.88,120,72a8,8,0,0,0,16,0,8,8,0,0,1,16,0,24,24,0,0,1-48,0c0-.73.13-14.3,8.46-30.63A88,88,0,1,0,216,128Z" /></PhIcon>
}

export function ChampagneIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M184,20a12,12,0,1,1,12,12A12,12,0,0,1,184,20ZM164.12,73.23c7.26,44.25,4.35,75.76-8.66,93.66A39.94,39.94,0,0,1,128,183.42V232h16a8,8,0,0,1,0,16H96a8,8,0,0,1,0-16h16V183.42a40,40,0,0,1-27.46-16.53c-13-17.9-15.91-49.41-8.65-93.66A451,451,0,0,1,90.1,13.53,8,8,0,0,1,97.71,8H142.3a8,8,0,0,1,7.61,5.53A451,451,0,0,1,164.12,73.23ZM93.8,64h52.4c-3-15.58-6.72-29.81-9.78-40H103.59C100.53,34.19,96.83,48.42,93.8,64ZM149,80H91c-4.49,30-5.14,61.54,6.45,77.49C102.63,164.56,110,168,120,168s17.38-3.44,22.52-10.51C154.1,141.54,153.46,110,149,80Zm71-40a12,12,0,1,0,12,12A12,12,0,0,0,220,40ZM196,88a12,12,0,1,0,12,12A12,12,0,0,0,196,88Z" /></PhIcon>
}

export function CameraIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z" /></PhIcon>
}

/* ── 교통편 ── */
export function VanIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M254.07,106.79,208.53,53.73A16,16,0,0,0,196.26,48H32A16,16,0,0,0,16,64V176a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V112A8,8,0,0,0,254.07,106.79ZM230.59,104H176V64h20.26ZM104,104V64h56v40ZM88,64v40H32V64ZM80,200a16,16,0,1,1,16-16A16,16,0,0,1,80,200Zm112,0a16,16,0,1,1,16-16A16,16,0,0,1,192,200Zm31-24a32,32,0,0,0-62,0H111a32,32,0,0,0-62,0H32V120H240v56Z" /></PhIcon>
}

export function BusIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M184,32H72A32,32,0,0,0,40,64V208a16,16,0,0,0,16,16H80a16,16,0,0,0,16-16V192h64v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V64A32,32,0,0,0,184,32ZM56,176V120H200v56Zm0-96H200v24H56ZM72,48H184a16,16,0,0,1,16,16H56A16,16,0,0,1,72,48Zm8,160H56V192H80Zm96,0V192h24v16Zm-72-60a12,12,0,1,1-12-12A12,12,0,0,1,104,148Zm72,0a12,12,0,1,1-12-12A12,12,0,0,1,176,148Zm72-68v24a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0ZM24,80v24a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0Z" /></PhIcon>
}

export function SubwayIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M224,96V208a8,8,0,0,1-16,0V96a56.06,56.06,0,0,0-56-56H104A56.06,56.06,0,0,0,48,96V208a8,8,0,0,1-16,0V96a72.08,72.08,0,0,1,72-72h48A72.08,72.08,0,0,1,224,96Zm-40,0v72a24,24,0,0,1-19.29,23.53l2.45,4.89a8,8,0,0,1-14.32,7.16L147.06,192H108.94l-5.78,11.58a8,8,0,0,1-14.32-7.16l2.45-4.89A24,24,0,0,1,72,168V96A24,24,0,0,1,96,72h64A24,24,0,0,1,184,96ZM88,96v48h80V96a8,8,0,0,0-8-8H96A8,8,0,0,0,88,96Zm32,64v16h16V160ZM96,176h8V160H88v8A8,8,0,0,0,96,176Zm72-8v-8H152v16h8A8,8,0,0,0,168,168Z" /></PhIcon>
}

export function TrainIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M184,24H72A32,32,0,0,0,40,56V184a32,32,0,0,0,32,32h8L65.6,235.2a8,8,0,1,0,12.8,9.6L100,216h56l21.6,28.8a8,8,0,1,0,12.8-9.6L176,216h8a32,32,0,0,0,32-32V56A32,32,0,0,0,184,24ZM56,120V80h64v40Zm80-40h64v40H136ZM72,40H184a16,16,0,0,1,16,16v8H56V56A16,16,0,0,1,72,40ZM184,200H72a16,16,0,0,1-16-16V136H200v48A16,16,0,0,1,184,200ZM96,172a12,12,0,1,1-12-12A12,12,0,0,1,96,172Zm88,0a12,12,0,1,1-12-12A12,12,0,0,1,184,172Z" /></PhIcon>
}

export function ParkingIcon(p: IconProps) {
  return <PhIcon {...p}><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm8-136H104a8,8,0,0,0-8,8v80a8,8,0,0,0,16,0V152h24a36,36,0,0,0,0-72Zm0,56H112V96h24a20,20,0,0,1,0,40Z" /></PhIcon>
}

/* 고속버스도 van으로 */
export const ExpressBusIcon = VanIcon

/* 하위호환 별칭 — 기존 svg:bouquet / import 이름 유지 */
export const BouquetIcon = FlowerIcon
export const WreathIcon = CloverIcon
export const FlowerChildIcon = BabyIcon
export const CutleryIcon = ChampagneIcon

/* ─── 그 외 라인(stroke) 아이콘: 유지 ─── */
export function PinIcon({ size = defaults.size, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={defaults.strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
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
  'flower', 'clover', 'baby', 'champagne', 'camera',
  'van', 'bus', 'subway', 'train', 'parking', 'pin',
  'heart', 'gift', 'music', 'clock', 'info', 'star', 'bell',
] as const

export type SvgIconKey = typeof SVG_ICON_KEYS[number]

export const SVG_ICON_LABELS: Record<SvgIconKey, string> = {
  'flower': '꽃',
  'clover': '클로버',
  'baby': '아기',
  'champagne': '샴페인',
  'camera': '카메라',
  'van': '밴/셔틀',
  'bus': '버스',
  'subway': '지하철',
  'train': '기차',
  'parking': '주차',
  'pin': '위치',
  'heart': '하트',
  'gift': '선물',
  'music': '음악',
  'clock': '시계',
  'info': '안내',
  'star': '별',
  'bell': '알림',
}

// 별칭 포함(하위호환) — 문자열 → 컴포넌트
const ICON_MAP: Record<string, (props: IconProps) => React.JSX.Element> = {
  'flower': FlowerIcon,
  'clover': CloverIcon,
  'baby': BabyIcon,
  'champagne': ChampagneIcon,
  'camera': CameraIcon,
  'van': VanIcon,
  'bus': BusIcon,
  'subway': SubwayIcon,
  'train': TrainIcon,
  'parking': ParkingIcon,
  'pin': PinIcon,
  'heart': HeartIcon,
  'gift': GiftIcon,
  'music': MusicIcon,
  'clock': ClockIcon,
  'info': InfoIcon,
  'star': StarIcon,
  'bell': BellIcon,
  // 하위호환 별칭 (기존 저장값)
  'bouquet': FlowerIcon,
  'wreath': CloverIcon,
  'flower-child': BabyIcon,
  'cutlery': ChampagneIcon,
  'express-bus': VanIcon,
}

/** "svg:flower" 형태의 문자열 → SVG React 엘리먼트, 실패 시 null */
export function renderSvgIcon(value: string, props: IconProps = {}): React.ReactNode | null {
  if (!value.startsWith('svg:')) return null
  const key = value.slice(4)
  const Component = ICON_MAP[key]
  if (!Component) return null
  return <Component {...props} />
}
