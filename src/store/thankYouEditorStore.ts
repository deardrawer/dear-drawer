import { create } from 'zustand'
import type { ThankYouData, PolaroidData } from '@/components/thank-you/types'
import { SAMPLE_DATA } from '@/components/thank-you/types'

export type ThankYouFontStyle = 'classic' | 'modern' | 'romantic'

export interface ThankYouEditorState {
  // Data
  data: ThankYouData
  fontStyle: ThankYouFontStyle
  bgm: {
    enabled: boolean
    url: string
    autoplay: boolean
  }

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
  setBgm: (bgm: Partial<ThankYouEditorState['bgm']>) => void
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
    { image: '', caption: '우리의 시작', rotation: -3, offsetX: 0 },
    { image: '', caption: '함께한 날들', rotation: 4, offsetX: 12 },
    { image: '', caption: '영원히 함께', rotation: -2, offsetX: -8 },
  ],
  closingLines: [
    '감사합니다.',
    '바쁘신 와중에도 저희의 결혼을 축하해주시고\n그날을 함께해주셔서 진심으로 감사드립니다.',
    '여러분과 함께한 그 순간은\n저희에게 오래도록 기억될 소중한 시간이었습니다.',
    '그 마음을 잊지 않고,\n천천히 그리고 단단하게\n저희만의 이야기를 이어가겠습니다.',
    '올림',
  ],
}

export const useThankYouEditorStore = create<ThankYouEditorState>((set, get) => ({
  data: { ...DEFAULT_DATA },
  fontStyle: 'classic',
  bgm: { enabled: false, url: '', autoplay: false },
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

  setBgm: (bgm) => set((state) => ({
    bgm: { ...state.bgm, ...bgm },
    isDirty: true,
  })),

  setWizardStep: (step) => set({ wizardStep: step }),

  setIsDirty: (isDirty) => set({ isDirty }),

  setIsSaving: (isSaving) => set({ isSaving }),

  reset: () => set({
    data: { ...DEFAULT_DATA },
    fontStyle: 'classic',
    bgm: { enabled: false, url: '', autoplay: false },
    wizardStep: 1,
    isDirty: false,
    isSaving: false,
  }),

  loadFromContent: (content) => {
    const { fontStyle, bgm, ...thankYouData } = content as Record<string, unknown>
    set({
      data: { ...DEFAULT_DATA, ...(thankYouData as Partial<ThankYouData>) },
      fontStyle: (fontStyle as ThankYouFontStyle) || 'classic',
      bgm: {
        enabled: (bgm as { enabled?: boolean })?.enabled ?? false,
        url: (bgm as { url?: string })?.url ?? '',
        autoplay: (bgm as { autoplay?: boolean })?.autoplay ?? false,
      },
      isDirty: false,
    })
  },

  toSavePayload: () => {
    const { data, fontStyle, bgm } = get()
    return JSON.stringify({ ...data, fontStyle, bgm })
  },
}))
