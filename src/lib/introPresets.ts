// 인트로 애니메이션 프리셋 정의

export type IntroPresetId =
  | 'cinematic'
  | 'typing'
  | 'blur'
  | 'zoom'
  | 'letter'
  | 'petal'
  | 'watercolor'
  | 'lightray'
  | 'film'
  | 'filmstrip'

// 편집 가능한 필드 타입
export interface EditableTextField {
  type: 'text'
  key: string
  label: string
  placeholder: string
  maxLength?: number
}

export interface EditableSelectField {
  type: 'select'
  key: string
  label: string
  options: { value: string; label: string }[]
}

export interface EditableRangeField {
  type: 'range'
  key: string
  label: string
  min: number
  max: number
  step: number
  unit?: string
}

export interface EditableColorField {
  type: 'color'
  key: string
  label: string
  presets: string[]
}

export type EditableField = EditableTextField | EditableSelectField | EditableRangeField | EditableColorField

// 인트로 이미지 설정 타입
export interface IntroImageSettings {
  scale: number
  positionX: number
  positionY: number
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

// 인트로 배경 모드
export type IntroImageMode = 'photo' | 'solid' | 'gradient'

// 인트로 설정 값 타입
export interface IntroSettings {
  presetId: IntroPresetId
  // 텍스트
  mainTitle: string
  subTitle: string
  dateText: string
  venueText: string
  // 텍스트 스타일
  titleFontSize: number
  titleLetterSpacing: number
  titleFontFamily: string
  titleColor: string
  subTitleColor: string
  // 배경
  backgroundScale: number
  backgroundPositionX: number
  backgroundPositionY: number
  backgroundBrightness: number
  overlayOpacity: number
  // 인트로 전용 이미지
  introImage?: string
  introImageSettings?: IntroImageSettings
  // 배경 모드 (사진/단색/그라데이션)
  imageMode?: IntroImageMode
  solidColor?: string
  gradientFrom?: string
  gradientTo?: string
  gradientAngle?: number
  // 포인트 컬러
  accentColor?: string
  // 프리셋별 커스텀 컬러
  overlayColor?: string      // 오버레이 색상 (cinematic, blur, letter)
  bodyTextColor?: string     // 본문 텍스트 색상 (typing, zoom, petal, watercolor, lightray, film)
  bgColor?: string           // 배경색 (petal, film, filmstrip)
  waveColor?: string         // 웨이브 색상 (typing)
  envelopeColor?: string     // 봉투 색상 (letter)
}

// 사용 가능한 폰트 목록
export const availableFonts = [
  { value: 'Pretendard', label: '프리텐다드' },
  { value: "'Noto Serif KR', serif", label: '노토 세리프' },
  { value: "'Nanum Myeongjo', serif", label: '나눔명조' },
  { value: "'Nanum Gothic', sans-serif", label: '나눔고딕' },
  { value: "'Gowun Batang', serif", label: '고운바탕' },
  { value: "'Cormorant Garamond', serif", label: 'Cormorant' },
  { value: "'Playfair Display', serif", label: 'Playfair' },
  { value: "'NostalgicPoliceFairness', cursive", label: '손글씨(폴페어니스)' },
]

// 프리셋 정의
export interface IntroPreset {
  id: IntroPresetId
  name: string
  description: string
  thumbnail?: string
  defaults: Partial<IntroSettings>
  editableFields: EditableField[]
}

// 공통 편집 필드
const commonTextFields: EditableField[] = [
  { type: 'text', key: 'mainTitle', label: '메인 타이틀', placeholder: '예: 우리 결혼합니다', maxLength: 30 },
  { type: 'text', key: 'subTitle', label: '서브 문구', placeholder: '예: 소중한 분들을 초대합니다', maxLength: 50 },
  { type: 'text', key: 'dateText', label: '날짜', placeholder: '예: 2025. 05. 24', maxLength: 20 },
  { type: 'text', key: 'venueText', label: '장소', placeholder: '예: 더채플앳청담', maxLength: 30 },
]

const commonStyleFields: EditableField[] = [
  { type: 'range', key: 'titleFontSize', label: '제목 크기', min: 16, max: 32, step: 1, unit: 'px' },
  { type: 'range', key: 'titleLetterSpacing', label: '자간', min: 0, max: 8, step: 0.5, unit: 'px' },
  {
    type: 'color',
    key: 'titleColor',
    label: '제목 색상',
    presets: ['#ffffff', '#f5f5f5', '#d4a574', '#c9a86c', '#8b7355', '#2c3e50', '#1a1a1a']
  },
]

const commonBackgroundFields: EditableField[] = [
  { type: 'range', key: 'backgroundScale', label: '사진 크기', min: 100, max: 150, step: 5, unit: '%' },
  { type: 'range', key: 'backgroundPositionX', label: '가로 위치', min: 0, max: 100, step: 5, unit: '%' },
  { type: 'range', key: 'backgroundPositionY', label: '세로 위치', min: 0, max: 100, step: 5, unit: '%' },
  { type: 'range', key: 'backgroundBrightness', label: '밝기', min: 30, max: 100, step: 5, unit: '%' },
  { type: 'range', key: 'overlayOpacity', label: '오버레이 농도', min: 0, max: 80, step: 5, unit: '%' },
]

const accentColorField: EditableField = {
  type: 'color',
  key: 'accentColor',
  label: '포인트 색상',
  presets: ['#d4a574', '#c9a86c', '#d4a0a0', '#0891b2', '#8b7355', '#374151', '#9ca3af', '#e8a0b0', '#1a1a1a']
}

// 프리셋별 기본 커스텀 컬러 맵
export const presetCustomColors: Record<IntroPresetId, {
  overlayColor?: string
  bodyTextColor?: string
  bgColor?: string
  waveColor?: string
  envelopeColor?: string
}> = {
  cinematic: { overlayColor: '#000000' },
  typing: { bodyTextColor: '#2c2c2c', waveColor: '#FAF8F5' },
  blur: { overlayColor: '#000000' },
  zoom: { bodyTextColor: '#2c2c2c' },
  letter: { envelopeColor: '#f5f0e8', overlayColor: '#000000' },
  petal: { bgColor: '#FDF6F4', bodyTextColor: '#374151' },
  watercolor: { bodyTextColor: '#374151' },
  lightray: { bodyTextColor: '#374151' },
  film: { bgColor: '#F5F3F0', bodyTextColor: '#4a4a4a' },
  filmstrip: { bgColor: '#1a1a1a' },
}

// 프리셋별 기본 accentColor 맵
export const presetAccentColors: Record<IntroPresetId, string> = {
  cinematic: '#F8F6F3',    // 구분선 색상
  typing: '#e0d5c8',       // 구분선/물결 색상
  blur: '#F8F6F3',         // 구분선 색상
  zoom: '#d1d5db',         // 구분선 색상
  letter: '#d4a574',       // 봉투 씰/구분선 색상
  petal: '#d4a0a0',        // 꽃잎 테마 색상
  watercolor: '#0891b2',   // 수채화 포인트 색상
  lightray: '#d4a574',     // 빛 커튼 구분선 색상
  film: '#d1d5db',         // 폴라로이드 구분선 색상
  filmstrip: '#F8F6F3',    // 필름 구분선 색상
}

// 인트로 프리셋 목록
export const introPresets: IntroPreset[] = [
  {
    id: 'cinematic',
    name: '01 시네마틱',
    description: '영화 오프닝처럼 우아한 시네마틱 인트로',
    defaults: {
      mainTitle: 'Welcome to our wedding',
      subTitle: '',
      dateText: '',
      venueText: '',
      titleFontSize: 16,
      titleLetterSpacing: 3,
      titleFontFamily: "'Playfair Display', serif",
      titleColor: '#ffffff',
      subTitleColor: 'rgba(255,255,255,0.6)',
      backgroundScale: 110,
      backgroundPositionX: 50,
      backgroundPositionY: 0,
      backgroundBrightness: 50,
      overlayOpacity: 50,
      accentColor: presetAccentColors.cinematic,
      overlayColor: '#000000',
    },
    editableFields: [
      { type: 'text', key: 'mainTitle', label: '환영 문구', placeholder: 'Welcome to our wedding', maxLength: 40 },
      { type: 'text', key: 'dateText', label: '날짜 (영문)', placeholder: 'May 24, 2025', maxLength: 20 },
      ...commonStyleFields,
      accentColorField,
      ...commonBackgroundFields,
    ],
  },
  {
    id: 'typing',
    name: '02 타이핑',
    description: '한 글자씩 타이핑되는 물결 인트로',
    defaults: {
      mainTitle: '소중한 분들을 초대합니다',
      subTitle: 'WELCOME TO OUR WEDDING',
      dateText: '',
      venueText: '',
      titleFontSize: 20,
      titleLetterSpacing: 0,
      titleFontFamily: "'Nanum Myeongjo', serif",
      titleColor: '#2c2c2c',
      subTitleColor: 'rgba(0,0,0,0.35)',
      backgroundScale: 100,
      backgroundPositionX: 50,
      backgroundPositionY: 30,
      backgroundBrightness: 100,
      overlayOpacity: 0,
      accentColor: presetAccentColors.typing,
      bodyTextColor: '#2c2c2c',
      waveColor: '#FAF8F5',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
  {
    id: 'blur',
    name: '03 포커스',
    description: '흐릿함에서 선명하게, 포커스 인트로',
    defaults: {
      mainTitle: '우리 결혼합니다',
      subTitle: 'SAVE THE DATE',
      dateText: '',
      venueText: '',
      titleFontSize: 20,
      titleLetterSpacing: 0,
      titleFontFamily: "'Gowun Batang', serif",
      titleColor: '#ffffff',
      subTitleColor: 'rgba(255,255,255,0.7)',
      backgroundScale: 100,
      backgroundPositionX: 50,
      backgroundPositionY: 0,
      backgroundBrightness: 100,
      overlayOpacity: 40,
      accentColor: presetAccentColors.blur,
      overlayColor: '#000000',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
  {
    id: 'zoom',
    name: '04 프레임',
    description: '중앙 프레임 안에서 다가오는 줌 인트로',
    defaults: {
      mainTitle: '새로운 시작을 함께해주세요',
      subTitle: 'OUR WEDDING DAY',
      dateText: '',
      venueText: '',
      titleFontSize: 18,
      titleLetterSpacing: 2,
      titleFontFamily: "'Noto Serif KR', serif",
      titleColor: '#2c2c2c',
      subTitleColor: 'rgba(0,0,0,0.35)',
      backgroundScale: 110,
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundBrightness: 100,
      overlayOpacity: 10,
      accentColor: presetAccentColors.zoom,
      bodyTextColor: '#2c2c2c',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
  {
    id: 'letter',
    name: '05 레터',
    description: '봉투에서 꺼내는 초대장 인트로',
    defaults: {
      mainTitle: '우리 결혼합니다',
      subTitle: 'WEDDING INVITATION',
      dateText: '',
      venueText: '',
      titleFontSize: 24,
      titleLetterSpacing: 0,
      titleFontFamily: "'NostalgicPoliceFairness', cursive",
      titleColor: '#4a4a4a',
      subTitleColor: '#9ca3af',
      backgroundScale: 100,
      backgroundPositionX: 50,
      backgroundPositionY: 0,
      backgroundBrightness: 60,
      overlayOpacity: 50,
      accentColor: presetAccentColors.letter,
      envelopeColor: '#f5f0e8',
      overlayColor: '#000000',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
  {
    id: 'petal',
    name: '06 써클',
    description: '원형 윈도우와 꽃잎 인트로',
    defaults: {
      mainTitle: '꽃잎처럼 아름다운 날',
      subTitle: 'SPRING WEDDING',
      dateText: '봄날의 아름다운 약속',
      venueText: '',
      titleFontSize: 20,
      titleLetterSpacing: 0,
      titleFontFamily: "'Gowun Batang', serif",
      titleColor: '#374151',
      subTitleColor: '#d4a0a0',
      backgroundScale: 100,
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundBrightness: 100,
      overlayOpacity: 10,
      accentColor: presetAccentColors.petal,
      bgColor: '#FDF6F4',
      bodyTextColor: '#374151',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
  {
    id: 'watercolor',
    name: '07 아치',
    description: '아치 윈도우 프레임 인트로',
    defaults: {
      mainTitle: 'A New Chapter Begins',
      subTitle: 'WELCOME TO OUR WEDDING',
      dateText: 'You are warmly invited to share our special day.',
      venueText: '우리의 새로운 이야기가 시작됩니다.',
      titleFontSize: 16,
      titleLetterSpacing: 0,
      titleFontFamily: "'Cormorant Garamond', serif",
      titleColor: '#374151',
      subTitleColor: '#0891b2',
      backgroundScale: 100,
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundBrightness: 100,
      overlayOpacity: 10,
      accentColor: presetAccentColors.watercolor,
      bodyTextColor: '#374151',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
  {
    id: 'lightray',
    name: '08 대각선',
    description: '대각선 분할 레이아웃 인트로',
    defaults: {
      mainTitle: '영원을 약속하는 날',
      subTitle: 'BLESSED UNION',
      dateText: '소중한 분들을 초대합니다',
      venueText: '',
      titleFontSize: 20,
      titleLetterSpacing: 0,
      titleFontFamily: "'Nanum Myeongjo', serif",
      titleColor: '#374151',
      subTitleColor: 'rgba(212,165,116,0.8)',
      backgroundScale: 100,
      backgroundPositionX: 50,
      backgroundPositionY: 30,
      backgroundBrightness: 100,
      overlayOpacity: 15,
      accentColor: presetAccentColors.lightray,
      bodyTextColor: '#374151',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
  {
    id: 'film',
    name: '09 폴라로이드',
    description: '폴라로이드 프레임 인트로',
    defaults: {
      mainTitle: '우리의 순간에 초대합니다',
      subTitle: 'TIMELESS LOVE',
      dateText: 'An invitation to our moment',
      venueText: '',
      titleFontSize: 18,
      titleLetterSpacing: 0,
      titleFontFamily: "'Nanum Myeongjo', serif",
      titleColor: '#4a4a4a',
      subTitleColor: '#9ca3af',
      backgroundScale: 100,
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundBrightness: 100,
      overlayOpacity: 5,
      accentColor: presetAccentColors.film,
      bgColor: '#F5F3F0',
      bodyTextColor: '#4a4a4a',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
  {
    id: 'filmstrip',
    name: '10 필름',
    description: '35mm 필름 프레임 인트로',
    defaults: {
      mainTitle: '우리의 한 장면',
      subTitle: 'OUR MOMENT',
      dateText: '',
      venueText: '',
      titleFontSize: 18,
      titleLetterSpacing: 1,
      titleFontFamily: "Pretendard",
      titleColor: '#e8e0d4',
      subTitleColor: 'rgba(232,224,212,0.5)',
      backgroundScale: 100,
      backgroundPositionX: 50,
      backgroundPositionY: 50,
      backgroundBrightness: 100,
      overlayOpacity: 5,
      accentColor: presetAccentColors.filmstrip,
      bgColor: '#1a1a1a',
    },
    editableFields: [...commonTextFields, ...commonStyleFields, accentColorField, ...commonBackgroundFields],
  },
]

// 기본 인트로 설정 생성
export function getDefaultIntroSettings(presetId: IntroPresetId = 'cinematic'): IntroSettings {
  const preset = introPresets.find(p => p.id === presetId)
  const defaults = preset?.defaults || {}

  return {
    presetId,
    mainTitle: defaults.mainTitle || '',
    subTitle: defaults.subTitle || '',
    dateText: defaults.dateText || '',
    venueText: defaults.venueText || '',
    titleFontSize: defaults.titleFontSize ?? 20,
    titleLetterSpacing: defaults.titleLetterSpacing ?? 0,
    titleFontFamily: defaults.titleFontFamily || "'Gowun Batang', serif",
    titleColor: defaults.titleColor || '#ffffff',
    subTitleColor: defaults.subTitleColor || 'rgba(255,255,255,0.7)',
    backgroundScale: defaults.backgroundScale ?? 100,
    backgroundPositionX: defaults.backgroundPositionX ?? 50,
    backgroundPositionY: defaults.backgroundPositionY ?? 50,
    backgroundBrightness: defaults.backgroundBrightness ?? 100,
    overlayOpacity: defaults.overlayOpacity ?? 50,
    // 인트로 전용 이미지 (기본값 없음 → coverImage 폴백)
    introImage: defaults.introImage,
    introImageSettings: defaults.introImageSettings,
    // 배경 모드 (기본: photo)
    imageMode: defaults.imageMode ?? 'photo',
    solidColor: defaults.solidColor ?? '#F8F6F3',
    gradientFrom: defaults.gradientFrom ?? '#F8F6F3',
    gradientTo: defaults.gradientTo ?? '#e8e0d4',
    gradientAngle: defaults.gradientAngle ?? 135,
    // 포인트 컬러
    accentColor: defaults.accentColor ?? presetAccentColors[presetId],
    // 프리셋별 커스텀 컬러
    overlayColor: defaults.overlayColor ?? presetCustomColors[presetId]?.overlayColor,
    bodyTextColor: defaults.bodyTextColor ?? presetCustomColors[presetId]?.bodyTextColor,
    bgColor: defaults.bgColor ?? presetCustomColors[presetId]?.bgColor,
    waveColor: defaults.waveColor ?? presetCustomColors[presetId]?.waveColor,
    envelopeColor: defaults.envelopeColor ?? presetCustomColors[presetId]?.envelopeColor,
  }
}

// 프리셋 변경 시 설정 병합 (기존 값 유지 가능하면 유지)
export function mergeIntroSettings(
  currentSettings: IntroSettings,
  newPresetId: IntroPresetId
): IntroSettings {
  const newPreset = introPresets.find(p => p.id === newPresetId)
  if (!newPreset) return currentSettings

  const newDefaults = getDefaultIntroSettings(newPresetId)

  // 텍스트 필드는 사용자가 수정했으면 유지, 기본값이면 새 프리셋 기본값으로
  const oldPreset = introPresets.find(p => p.id === currentSettings.presetId)
  const oldDefaults = oldPreset?.defaults || {}

  return {
    ...newDefaults,
    presetId: newPresetId,
    // 사용자가 수정한 텍스트는 유지
    mainTitle: currentSettings.mainTitle !== oldDefaults.mainTitle
      ? currentSettings.mainTitle
      : newDefaults.mainTitle,
    subTitle: currentSettings.subTitle !== oldDefaults.subTitle
      ? currentSettings.subTitle
      : newDefaults.subTitle,
    dateText: currentSettings.dateText !== oldDefaults.dateText
      ? currentSettings.dateText
      : newDefaults.dateText,
    venueText: currentSettings.venueText !== oldDefaults.venueText
      ? currentSettings.venueText
      : newDefaults.venueText,
    // 폰트는 사용자가 변경했으면 유지 (프리셋 전환해도 초기화하지 않음)
    titleFontFamily: currentSettings.titleFontFamily !== (oldDefaults.titleFontFamily || "'Gowun Batang', serif")
      ? currentSettings.titleFontFamily
      : newDefaults.titleFontFamily,
    // 인트로 전용 이미지는 유지 (프리셋 전환해도 사진은 보존)
    introImage: currentSettings.introImage,
    introImageSettings: currentSettings.introImageSettings,
    // 배경 모드: 사용자가 설정했으면 유지
    imageMode: currentSettings.imageMode !== (oldDefaults.imageMode ?? 'photo')
      ? currentSettings.imageMode
      : newDefaults.imageMode,
    solidColor: currentSettings.solidColor,
    gradientFrom: currentSettings.gradientFrom,
    gradientTo: currentSettings.gradientTo,
    gradientAngle: currentSettings.gradientAngle,
    // accentColor는 새 프리셋 기본값 사용 (프리셋별로 다르므로)
    // 프리셋별 커스텀 컬러도 새 프리셋 기본값 사용
  }
}

// 프리셋 ID로 프리셋 찾기
export function getPresetById(id: IntroPresetId): IntroPreset | undefined {
  return introPresets.find(p => p.id === id)
}
