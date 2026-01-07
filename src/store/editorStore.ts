import { create } from 'zustand'
import { Template } from '@/lib/templates'
import { GeneratedStory } from '@/app/api/ai/generate-story/route'

// 부모 정보
export interface ParentInfo {
  name: string
  phone: string
  deceased: boolean
}

// 계좌 정보
export interface BankInfo {
  bank: string
  account: string
  holder: string
}

// 프로필 정보
export interface ProfileInfo {
  images: string[]
  aboutLabel: string
  subtitle: string
  intro: string
  tag: string
}

// 커플 개인 정보
export interface PersonInfo {
  name: string
  nameEn: string
  phone: string
  father: ParentInfo
  mother: ParentInfo
  bank: BankInfo
  profile: ProfileInfo
}

// 예식장 정보
export interface VenueInfo {
  name: string
  hall: string
  address: string
  mapUrl: string
  naverMapUrl: string
  kakaoMapUrl: string
}

// 오시는 길 정보
export interface DirectionsInfo {
  car: {
    desc: string
    route: string
  }
  subway: string[]
  bus: {
    main: string[]
    branch: string[]
  }
  parking: {
    location: string
    fee: string
  }
}

// 스토리 아이템
export interface StoryItem {
  date: string
  title: string
  desc: string
  images: string[]
}

// 인터뷰 아이템
export interface InterviewItem {
  question: string
  answer: string
  images: string[]
  bgClass: string
}

// 명언
export interface QuoteInfo {
  text: string
  author: string
}

// 감사 인사
export interface ThankYouInfo {
  title: string
  message: string
  sign: string
}

// 커스텀 안내 항목
export interface CustomInfoItem {
  id: string
  title: string
  content: string
  enabled: boolean
}

// 기타 정보
export interface InfoSettings {
  dressCode: {
    title: string
    content: string
    enabled: boolean
  }
  photoShare: {
    title: string
    content: string
    buttonText: string
    url: string
    enabled: boolean
  }
  photoBooth: {
    title: string
    content: string
    enabled: boolean
  }
  flowerChild: {
    title: string
    content: string
    enabled: boolean
  }
  customItems: CustomInfoItem[]
}

export interface InvitationContent {
  // ===== 커플 정보 =====
  groom: PersonInfo
  bride: PersonInfo

  // ===== 결혼식 정보 =====
  wedding: {
    date: string
    time: string
    timeDisplay: string
    dayOfWeek: string
    title: string
    venue: VenueInfo
    directions: DirectionsInfo
  }

  // ===== 우리의 이야기 =====
  relationship: {
    startDate: string
    stories: StoryItem[]
  }

  // ===== 콘텐츠 =====
  content: {
    greeting: string
    quote: QuoteInfo
    thankYou: ThankYouInfo
    info: InfoSettings
    interviews: InterviewItem[]
    guestbookQuestions: string[]
  }

  // ===== 갤러리 =====
  gallery: {
    images: string[]
  }

  // ===== 미디어 =====
  media: {
    coverImage: string
    infoImage: string
    bgm: string
  }

  // ===== 메타 =====
  meta: {
    title: string
    description: string
    ogImage: string
  }

  // ===== 테마 =====
  templateId: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontStyle: 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'
  colorTheme: 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral'

  // ===== RSVP =====
  rsvpEnabled: boolean
  rsvpDeadline: string

  // ===== 레거시 필드 (AI 스토리용) =====
  ourStory: string
  decision: string
  invitation: string
}

interface EditorStore {
  invitation: InvitationContent | null
  template: Template | null
  isDirty: boolean
  isSaving: boolean

  // Actions
  initInvitation: (template: Template) => void
  updateField: <K extends keyof InvitationContent>(
    field: K,
    value: InvitationContent[K]
  ) => void
  updateNestedField: (path: string, value: unknown) => void
  updateMultipleFields: (fields: Partial<InvitationContent>) => void
  applyAIStory: (story: GeneratedStory) => void
  setTemplate: (template: Template) => void
  setSaving: (saving: boolean) => void
  resetDirty: () => void
  addStory: () => void
  removeStory: (index: number) => void
  addInterview: () => void
  removeInterview: (index: number) => void
}

const createDefaultPerson = (isGroom: boolean): PersonInfo => ({
  name: '',
  nameEn: '',
  phone: '',
  father: { name: '', phone: '', deceased: false },
  mother: { name: '', phone: '', deceased: false },
  bank: { bank: '', account: '', holder: '' },
  profile: {
    images: [],
    aboutLabel: isGroom ? 'ABOUT GROOM' : 'ABOUT BRIDE',
    subtitle: isGroom ? '신부가 소개하는 신랑' : '신랑이 소개하는 신부',
    intro: '',
    tag: '',
  },
})

const createDefaultInvitation = (template: Template): InvitationContent => ({
  // 커플 정보
  groom: createDefaultPerson(true),
  bride: createDefaultPerson(false),

  // 결혼식 정보
  wedding: {
    date: '',
    time: '',
    timeDisplay: '',
    dayOfWeek: '',
    title: 'OUR WEDDING',
    venue: {
      name: '',
      hall: '',
      address: '',
      mapUrl: '',
      naverMapUrl: '',
      kakaoMapUrl: '',
    },
    directions: {
      car: { desc: '', route: '' },
      subway: [''],
      bus: { main: [], branch: [] },
      parking: { location: '', fee: '' },
    },
  },

  // 우리의 이야기
  relationship: {
    startDate: '',
    stories: [
      { date: '', title: '', desc: '', images: [] },
      { date: '', title: '', desc: '', images: [] },
      { date: '', title: '', desc: '', images: [] },
    ],
  },

  // 콘텐츠
  content: {
    greeting: '',
    quote: { text: '', author: '' },
    thankYou: { title: 'THANK YOU', message: '', sign: '' },
    info: {
      dressCode: { title: 'Dress Code', content: '', enabled: false },
      photoShare: {
        title: 'Photo Sharing',
        content: '',
        buttonText: '사진 공유하기',
        url: '',
        enabled: false,
      },
      photoBooth: { title: 'Photo Booth', content: '', enabled: false },
      flowerChild: { title: '화동 안내', content: '', enabled: false },
      customItems: [],
    },
    interviews: [
      { question: '', answer: '', images: [], bgClass: 'pink-bg' },
      { question: '', answer: '', images: [], bgClass: 'white-bg' },
      { question: '', answer: '', images: [], bgClass: 'pink-bg' },
    ],
    guestbookQuestions: [
      '두 사람에게 해주고 싶은 말은?',
      '결혼생활에서 가장 중요한 건?',
      '두 사람의 첫인상은 어땠나요?',
    ],
  },

  // 갤러리
  gallery: { images: [] },

  // 미디어
  media: { coverImage: '', infoImage: '', bgm: '' },

  // 메타
  meta: { title: '', description: '', ogImage: '' },

  // 테마
  templateId: template.id,
  primaryColor: template.colors.primary,
  secondaryColor: template.colors.secondary,
  accentColor: template.colors.accent,
  backgroundColor: template.colors.background,
  textColor: template.colors.text,
  fontStyle: 'classic',
  colorTheme: 'classic-rose',

  // RSVP
  rsvpEnabled: true,
  rsvpDeadline: '',

  // 레거시
  ourStory: '',
  decision: '',
  invitation: '',
})

// 중첩 객체 업데이트 헬퍼
const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
  const keys = path.split('.')
  const result = { ...obj }
  let current: Record<string, unknown> = result

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    current[key] = { ...(current[key] as Record<string, unknown>) }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
  return result
}

export const useEditorStore = create<EditorStore>((set) => ({
  invitation: null,
  template: null,
  isDirty: false,
  isSaving: false,

  initInvitation: (template) =>
    set({
      invitation: createDefaultInvitation(template),
      template,
      isDirty: false,
    }),

  updateField: (field, value) =>
    set((state) => ({
      invitation: state.invitation
        ? { ...state.invitation, [field]: value }
        : null,
      isDirty: true,
    })),

  updateNestedField: (path, value) =>
    set((state) => {
      if (!state.invitation) return state
      return {
        invitation: setNestedValue(
          state.invitation as unknown as Record<string, unknown>,
          path,
          value
        ) as unknown as InvitationContent,
        isDirty: true,
      }
    }),

  updateMultipleFields: (fields) =>
    set((state) => ({
      invitation: state.invitation
        ? { ...state.invitation, ...fields }
        : null,
      isDirty: true,
    })),

  applyAIStory: (story) =>
    set((state) => {
      if (!state.invitation) return state

      const combinedGreeting = `${story.ourStory}\n\n${story.decision}\n\n${story.invitation}`

      return {
        invitation: {
          ...state.invitation,
          content: {
            ...state.invitation.content,
            greeting: combinedGreeting,
          },
          ourStory: story.ourStory,
          decision: story.decision,
          invitation: story.invitation,
        },
        isDirty: true,
      }
    }),

  setTemplate: (template) =>
    set((state) => ({
      template,
      invitation: state.invitation
        ? {
            ...state.invitation,
            templateId: template.id,
            primaryColor: template.colors.primary,
            secondaryColor: template.colors.secondary,
            accentColor: template.colors.accent,
            backgroundColor: template.colors.background,
            textColor: template.colors.text,
          }
        : null,
      isDirty: true,
    })),

  setSaving: (saving) => set({ isSaving: saving }),

  resetDirty: () => set({ isDirty: false }),

  addStory: () =>
    set((state) => {
      if (!state.invitation) return state
      return {
        invitation: {
          ...state.invitation,
          relationship: {
            ...state.invitation.relationship,
            stories: [
              ...state.invitation.relationship.stories,
              { date: '', title: '', desc: '', images: [] },
            ],
          },
        },
        isDirty: true,
      }
    }),

  removeStory: (index) =>
    set((state) => {
      if (!state.invitation) return state
      return {
        invitation: {
          ...state.invitation,
          relationship: {
            ...state.invitation.relationship,
            stories: state.invitation.relationship.stories.filter((_, i) => i !== index),
          },
        },
        isDirty: true,
      }
    }),

  addInterview: () =>
    set((state) => {
      if (!state.invitation) return state
      return {
        invitation: {
          ...state.invitation,
          content: {
            ...state.invitation.content,
            interviews: [
              ...state.invitation.content.interviews,
              { question: '', answer: '', images: [], bgClass: 'white-bg' },
            ],
          },
        },
        isDirty: true,
      }
    }),

  removeInterview: (index) =>
    set((state) => {
      if (!state.invitation) return state
      return {
        invitation: {
          ...state.invitation,
          content: {
            ...state.invitation.content,
            interviews: state.invitation.content.interviews.filter((_, i) => i !== index),
          },
        },
        isDirty: true,
      }
    }),
}))
