/**
 * D-Day 팝업 공유 타입 정의
 */

export interface ImageSettings {
  scale: number
  positionX: number
  positionY: number
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

export interface ImageWithSettings {
  url: string
  settings: ImageSettings
}

export interface DdayPopupLink {
  url: string
  label: string
}

export interface DdayPopupPage {
  title: string
  body: string
  images?: ImageWithSettings[]
  links?: DdayPopupLink[]
}

export interface DdayPopupData {
  enabled: boolean
  startDays?: number
  displayStart?: string
  displayEnd?: string
  title?: string
  pages: DdayPopupPage[]
  buttonLabel?: string
  showDday?: boolean
  textAlign?: 'left' | 'center' | 'right'
  linkAlign?: 'left' | 'center' | 'right'
  ddayStyle?: 'pill' | 'outline' | 'circle' | 'minimal' | 'elegant'
  buttonStyle?: 'solid' | 'outline' | 'pill' | 'minimal' | 'soft'
}

export const DEFAULT_DDAY_POPUP: DdayPopupData = {
  enabled: false,
  pages: [],
}
