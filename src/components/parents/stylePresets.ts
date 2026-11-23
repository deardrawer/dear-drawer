// PARENTS C안 컬러 스타일 — 색만 한 번에 바꿈
//   (폰트 · 사진 모양 · 이름 · 문구 · 사진 · 날짜 · 계좌 등은 건드리지 않음)

export interface ParentsColorValues {
  customPrimaryColor?: string   // 포인트 색
  captionColor?: string         // 부제 색
  titleColor?: string           // 제목 색
  sectionBaseColor?: string     // 기본 배경
  sectionTintColor?: string     // 틴티드 배경 (비우면 포인트 색 연하게)
  tintedSections?: string[]     // 틴티드 섹션
  letterBg?: string             // 편지 화면 배경
}

export interface ParentsColorPreset {
  id: string
  name: string
  mood: string
  /** 보여 줄 쪽 — 비우면 양쪽 모두 */
  side?: 'groom' | 'bride'
  values: ParentsColorValues
}

// 틴티드 섹션은 예식 일시 · 마음 전하실 곳 (컬러 시안과 동일)
const T = ['date', 'account']

export const PARENTS_COLOR_PRESETS: ParentsColorPreset[] = [
  { id: 'sample', name: '샘플 (기본)', mood: '은은한 미색 바탕', values: { sectionBaseColor: '#FAFAF9' } },
  { id: 'white', name: '화이트 미니멀', mood: '깔끔한 흰 바탕', values: {} },
  // 신랑측
  { id: 'g-navy', side: 'groom', name: '네이비', mood: '단정한 네이비', values: { customPrimaryColor: '#2B3A55', captionColor: '#5C6B82', titleColor: '#1F1D1A', sectionBaseColor: '#FAFAFB', sectionTintColor: '#ECEFF4', tintedSections: T, letterBg: '#ECEFF4' } },
  { id: 'g-blue', side: 'groom', name: '소프트 블루', mood: '맑은 블루 그레이', values: { customPrimaryColor: '#4F6577', captionColor: '#6B7F8E', titleColor: '#1F1D1A', sectionBaseColor: '#FFFFFF', sectionTintColor: '#EEF2F5', tintedSections: T, letterBg: '#FFFFFF' } },
  { id: 'g-sage', side: 'groom', name: '세이지', mood: '차분한 초록', values: { customPrimaryColor: '#5E6B52', captionColor: '#7A866E', titleColor: '#1F1D1A', sectionBaseColor: '#FFFFFF', sectionTintColor: '#F0F2EC', tintedSections: T, letterBg: '#F0F2EC' } },
  { id: 'g-charcoal', side: 'groom', name: '차콜', mood: '묵직한 차콜', values: { customPrimaryColor: '#3D3D3D', captionColor: '#7A7A7A', titleColor: '#1F1D1A', sectionBaseColor: '#FFFFFF', sectionTintColor: '#2A2A2A', tintedSections: T, letterBg: '#2A2A2A' } },
  { id: 'g-latte', side: 'groom', name: '라떼', mood: '따뜻한 라떼', values: { customPrimaryColor: '#7A6550', captionColor: '#9A8670', titleColor: '#1F1D1A', sectionBaseColor: '#FCFAF7', sectionTintColor: '#F3EEE7', tintedSections: T, letterBg: '#F3EEE7' } },
  { id: 'g-gray', side: 'groom', name: '웜 그레이', mood: '부드러운 회색', values: { customPrimaryColor: '#6B645B', captionColor: '#8A8378', titleColor: '#1F1D1A', sectionBaseColor: '#FAFAF9', sectionTintColor: '#F2F0EC', tintedSections: T, letterBg: '#FFFFFF' } },
  // 신부측
  { id: 'b-rose', side: 'bride', name: '로즈', mood: '은은한 장밋빛', values: { customPrimaryColor: '#9C6B6B', captionColor: '#9C6B6B', titleColor: '#1F1D1A', sectionBaseColor: '#FFFFFF', sectionTintColor: '#F7EFEE', tintedSections: T, letterBg: '#F7EFEE' } },
  { id: 'b-burgundy', side: 'bride', name: '버건디', mood: '격식 있는 버건디', values: { customPrimaryColor: '#6E3A41', captionColor: '#8E5A5F', titleColor: '#1F1D1A', sectionBaseColor: '#FCFAF8', sectionTintColor: '#F4ECEB', tintedSections: T, letterBg: '#6E3A41' } },
  { id: 'b-lilac', side: 'bride', name: '라일락', mood: '여린 라일락', values: { customPrimaryColor: '#7D6278', captionColor: '#93798E', titleColor: '#1F1D1A', sectionBaseColor: '#FFFFFF', sectionTintColor: '#F4EFF3', tintedSections: T, letterBg: '#F4EFF3' } },
  { id: 'b-latte', side: 'bride', name: '라떼', mood: '따뜻한 라떼', values: { customPrimaryColor: '#7A6550', captionColor: '#9A8670', titleColor: '#1F1D1A', sectionBaseColor: '#FCFAF7', sectionTintColor: '#F3EEE7', tintedSections: T, letterBg: '#F3EEE7' } },
  { id: 'b-sage', side: 'bride', name: '세이지', mood: '차분한 초록', values: { customPrimaryColor: '#5E6B52', captionColor: '#7A866E', titleColor: '#1F1D1A', sectionBaseColor: '#FFFFFF', sectionTintColor: '#F0F2EC', tintedSections: T, letterBg: '#F0F2EC' } },
  { id: 'b-gray', side: 'bride', name: '웜 그레이', mood: '부드러운 회색', values: { customPrimaryColor: '#6B645B', captionColor: '#8A8378', titleColor: '#1F1D1A', sectionBaseColor: '#FAFAF9', sectionTintColor: '#F2F0EC', tintedSections: T, letterBg: '#FFFFFF' } },
]

/** 보내는 쪽에 맞는 컬러 스타일 (공통 + 그쪽 전용) */
export function colorPresetsFor(side?: string): ParentsColorPreset[] {
  const s = side === 'groom' ? 'groom' : 'bride'
  return PARENTS_COLOR_PRESETS.filter((p) => !p.side || p.side === s)
}

type ColorSource = {
  customPrimaryColor?: string
  captionColor?: string
  titleColor?: string
  sectionBaseColor?: string
  sectionTintColor?: string
  tintedSections?: string[]
  envelope?: { letterBg?: string }
}

const norm = (v?: string) => (v || '').trim().toUpperCase()

/** 지금 색 설정과 똑같은 컬러 스타일 id (조금이라도 바꾸면 없음) */
export function matchColorPreset(d: ColorSource, side?: string): string | null {
  const cur = [...(d.tintedSections || [])].sort().join(',')
  for (const p of colorPresetsFor(side)) {
    const v = p.values
    if (
      norm(d.customPrimaryColor) === norm(v.customPrimaryColor) &&
      norm(d.captionColor) === norm(v.captionColor) &&
      norm(d.titleColor) === norm(v.titleColor) &&
      norm(d.sectionBaseColor) === norm(v.sectionBaseColor) &&
      norm(d.sectionTintColor) === norm(v.sectionTintColor) &&
      cur === [...(v.tintedSections || [])].sort().join(',') &&
      (d.envelope?.letterBg || 'white') === (v.letterBg || 'white')
    ) return p.id
  }
  return null
}
