import { create } from 'zustand'
import type { ThankYouData, PolaroidData, BackgroundImageSettings } from '@/components/thank-you/types'
import { SAMPLE_DATA } from '@/components/thank-you/types'

export type ThankYouFontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury' | 'gulim' | 'adulthand' | 'neathand' | 'roundhand' | 'roundgothic' | 'suit' | 'myungjo'

export interface ThankYouMeta {
  title: string
  description: string
  ogImage: string
  ogImageSettings?: { scale: number; positionX: number; positionY: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }
  kakaoThumbnail: string
  kakaoThumbnailSettings?: { scale: number; positionX: number; positionY: number }
}

export interface ThankYouEditorState {
  // Data
  data: ThankYouData
  fontStyle: ThankYouFontStyle
  accentColor: string
  sealColor: string
  bgm: {
    enabled: boolean
    url: string
    autoplay: boolean
  }
  meta: ThankYouMeta

  // UI state
  wizardStep: 1 | 2 | 3 | 4 | 5
  isDirty: boolean
  isSaving: boolean

  // Actions
  setData: (data: ThankYouData) => void
  updateField: <K extends keyof ThankYouData>(field: K, value: ThankYouData[K]) => void
  updatePolaroid: (index: number, updates: Partial<PolaroidData>) => void
  updateClosingLine: (index: number, value: string) => void
  setFontStyle: (style: ThankYouFontStyle) => void
  setAccentColor: (color: string) => void
  setSealColor: (color: string) => void
  setBgm: (bgm: Partial<ThankYouEditorState['bgm']>) => void
  setBackgroundImage: (url: string) => void
  setBackgroundImageSettings: (settings: Partial<BackgroundImageSettings>) => void
  updateMeta: (key: string, value: unknown) => void
  setWizardStep: (step: 1 | 2 | 3 | 4 | 5) => void
  setIsDirty: (dirty: boolean) => void
  setIsSaving: (saving: boolean) => void
  reset: () => void
  loadFromContent: (content: Record<string, unknown>) => void
  toSavePayload: () => string
}

const DEFAULT_DATA: ThankYouData = {
  coupleNames: '',
  date: '',
  heroMessage: '함께해 주셔서 감사합니다',
  heroImage: '',
  polaroids: [
    { image: '', caption: '소중한 분들과', rotation: -3, offsetX: 0 },
    { image: '', caption: '함께한 이 순간', rotation: 4, offsetX: 12 },
    { image: '', caption: '오래 간직하겠습니다.', rotation: -2, offsetX: -8 },
  ],
  closingLines: [
    '감사합니다.',
    '바쁘신 와중에도\n저희의 결혼을 축하해주시고,\n그날을 함께해주셔서\n진심으로 감사드립니다.',
    '여러분과 함께한 그 순간은\n저희에게 오래도록 기억될\n소중한 시간이었습니다.',
    '그 마음을 잊지 않고,\n천천히 그리고 단단하게\n저희만의 이야기를 이어가겠습니다.',
    '올림',
  ],
}

export const useThankYouEditorStore = create<ThankYouEditorState>((set, get) => ({
  data: { ...DEFAULT_DATA },
  fontStyle: 'classic',
  accentColor: '#B89878',
  sealColor: '#722F37',
  bgm: { enabled: false, url: '', autoplay: false },
  meta: { title: '', description: '', ogImage: '', kakaoThumbnail: '' },
  wizardStep: 1,
  isDirty: false,
  isSaving: false,

  setData: (data) => set({ data, isDirty: true }),

  updateField: (field, value) => set((state) => ({
    data: { ...state.data, [field]: value },
    isDirty: true,
  })),

  updatePolaroid: (index, updates) => set((state) => {
    const newPolaroids = [...state.data.polaroids]
    newPolaroids[index] = { ...newPolaroids[index], ...updates }
    return { data: { ...state.data, polaroids: newPolaroids }, isDirty: true }
  }),

  updateClosingLine: (index, value) => set((state) => {
    const newLines = [...state.data.closingLines]
    newLines[index] = value
    return { data: { ...state.data, closingLines: newLines }, isDirty: true }
  }),

  setFontStyle: (fontStyle) => set({ fontStyle, isDirty: true }),

  setAccentColor: (accentColor) => set({ accentColor, isDirty: true }),

  setSealColor: (sealColor) => set({ sealColor, isDirty: true }),

  setBgm: (bgm) => set((state) => ({
    bgm: { ...state.bgm, ...bgm },
    isDirty: true,
  })),

  setBackgroundImage: (url) => set((state) => ({
    data: { ...state.data, backgroundImage: url },
    isDirty: true,
  })),

  setBackgroundImageSettings: (settings) => set((state) => ({
    data: {
      ...state.data,
      backgroundImageSettings: {
        ...state.data.backgroundImageSettings,
        ...settings,
      },
    },
    isDirty: true,
  })),

  updateMeta: (key, value) => set((state) => ({
    meta: { ...state.meta, [key]: value },
    isDirty: true,
  })),

  setWizardStep: (step) => set({ wizardStep: step }),

  setIsDirty: (isDirty) => set({ isDirty }),

  setIsSaving: (isSaving) => set({ isSaving }),

  reset: () => set({
    data: { ...DEFAULT_DATA },
    fontStyle: 'classic',
    accentColor: '#B89878',
    sealColor: '#722F37',
    bgm: { enabled: false, url: '', autoplay: false },
    meta: { title: '', description: '', ogImage: '', kakaoThumbnail: '' },
    wizardStep: 1,
    isDirty: false,
    isSaving: false,
  }),

  loadFromContent: (content) => {
    const { fontStyle, accentColor, colorTheme, sealColor, bgm, meta, ...thankYouData } = content as Record<string, unknown>
    // colorTheme 하위호환: 기존 저장된 데이터에 colorTheme이 있으면 accentColor로 변환
    let resolvedAccent = (accentColor as string) || '#B89878'
    if (!accentColor && colorTheme) {
      const legacyMap: Record<string, string> = {
        burgundy: '#B89878', navy: '#8898A8', sage: '#98907E',
        dustyRose: '#A898A8', emerald: '#B8B0A5', slateBlue: '#B5A590',
      }
      resolvedAccent = legacyMap[colorTheme as string] || '#B89878'
    }
    const parsedMeta = (meta as ThankYouMeta) || {}
    set({
      data: { ...DEFAULT_DATA, ...(thankYouData as Partial<ThankYouData>) },
      fontStyle: (fontStyle as ThankYouFontStyle) || 'classic',
      accentColor: resolvedAccent,
      sealColor: (sealColor as string) || '#722F37',
      bgm: {
        enabled: (bgm as { enabled?: boolean })?.enabled ?? false,
        url: (bgm as { url?: string })?.url ?? '',
        autoplay: (bgm as { autoplay?: boolean })?.autoplay ?? false,
      },
      meta: {
        title: parsedMeta.title || '',
        description: parsedMeta.description || '',
        ogImage: parsedMeta.ogImage || '',
        ogImageSettings: parsedMeta.ogImageSettings,
        kakaoThumbnail: parsedMeta.kakaoThumbnail || '',
        kakaoThumbnailSettings: parsedMeta.kakaoThumbnailSettings,
      },
      isDirty: false,
    })
  },

  toSavePayload: () => {
    const { data, fontStyle, accentColor, sealColor, bgm, meta } = get()
    return JSON.stringify({ ...data, fontStyle, accentColor, sealColor, bgm, meta })
  },
}))
