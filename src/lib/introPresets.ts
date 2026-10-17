// 인트로 애니메이션 프리셋 정의

// 하객이 직접 여는 인터랙티브 인트로 스타일 (옵션 스키마는 introStyles.ts)
export type IntroStyleId =
  | 'vellum'    // 트레이싱지
  | 'envelope'  // 포스터 봉투
  | 'postcard'  // 엽서
  | 'pieces'    // 두 장의 사진
  | 'stars'     // 별자리 문장
  | 'typed'     // 타자 오프닝
  | 'dots'      // 도트 자수
  | 'frost'     // 불투명 유리
  | 'labels'    // 라벨 문구
  | 'tiles'     // 글자 타일
  | 'grid'      // 그리드 포스터

// 'cinematic'·'blur'(포커스)는 4.5초 타임드 인트로(인트로 → 커버 → 초대글), 나머지는 인터랙티브(인트로 → 초대글)
export type IntroPresetId = 'cinematic' | 'blur' | IntroStyleId

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
  // 인트로 → 메인 넘김 안내 문구 (하단)
  guideEnabled?: boolean     // 안내 문구 표시 여부 (기본 미표시)
  guideText?: string         // 안내 문구 내용 (커스텀)
  // 인터랙티브 스타일별 옵션 (스타일을 바꿔도 각 스타일 설정 유지)
  styleOptions?: Partial<Record<IntroStyleId, Record<string, unknown>>>
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
export const presetCustomColors: Partial<Record<IntroPresetId, {
  overlayColor?: string
  bodyTextColor?: string
  bgColor?: string
  waveColor?: string
  envelopeColor?: string
}>> = {
  cinematic: { overlayColor: '#000000' },
  blur: { overlayColor: '#000000' },
}

// 프리셋별 기본 accentColor 맵
export const presetAccentColors: Partial<Record<IntroPresetId, string>> = {
  cinematic: '#F8F6F3',    // 구분선 색상
  blur: '#F8F6F3',
}

// 인트로 프리셋 목록
export const introPresets: IntroPreset[] = [
  {
    id: 'cinematic',
    name: '시네마틱',
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
    id: 'blur',
    name: '포커스',
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
    editableFields: [
      { type: 'text', key: 'subTitle', label: '위 작은 문구', placeholder: 'SAVE THE DATE', maxLength: 30 },
      { type: 'text', key: 'mainTitle', label: '제목', placeholder: '우리 결혼합니다', maxLength: 40 },
      { type: 'text', key: 'dateText', label: '날짜', placeholder: '2025.05.24', maxLength: 20 },
      ...commonStyleFields,
      accentColorField,
      ...commonBackgroundFields,
    ],
  },
]

// 알려진 스타일 id 목록 (삭제된 예전 프리셋 id는 시네마틱으로 취급 · 포커스(blur)는 유지)
export const INTRO_STYLE_IDS: IntroStyleId[] = ['vellum', 'envelope', 'postcard', 'pieces', 'stars', 'typed', 'dots', 'frost', 'labels', 'tiles', 'grid']
export function resolvePresetId(id: unknown): IntroPresetId {
  return typeof id === 'string' && (id === 'cinematic' || id === 'blur' || (INTRO_STYLE_IDS as string[]).includes(id)) ? (id as IntroPresetId) : 'cinematic'
}
export function isInteractiveIntro(id: unknown): id is IntroStyleId {
  return typeof id === 'string' && (INTRO_STYLE_IDS as string[]).includes(id)
}

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
    // 넘김 안내 문구 (기본: 미표시 + 기본 문구)
    guideEnabled: defaults.guideEnabled ?? false,
    guideText: defaults.guideText ?? '터치하거나 아래로 넘겨주세요',
  }
}

// 프리셋 변경 시 설정 병합 (기존 값 유지 가능하면 유지)
export function mergeIntroSettings(
  currentSettings: IntroSettings,
  newPresetId: IntroPresetId
): IntroSettings {
  // 인터랙티브 스타일로 바꾸거나 거기서 시네마틱으로 돌아올 때는 presetId만 바꾼다
  // (시네마틱 설정과 스타일별 옵션을 모두 그대로 보존)
  if (isInteractiveIntro(newPresetId) || isInteractiveIntro(currentSettings.presetId)) {
    return { ...currentSettings, presetId: newPresetId }
  }
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
    // 넘김 안내 문구는 프리셋과 무관하므로 사용자 설정 유지
    guideEnabled: currentSettings.guideEnabled,
    guideText: currentSettings.guideText,
    styleOptions: currentSettings.styleOptions,
  }
}

// 프리셋 ID로 프리셋 찾기
export function getPresetById(id: IntroPresetId): IntroPreset | undefined {
  return introPresets.find(p => p.id === id)
}
