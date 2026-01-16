import { create } from 'zustand'
import { Template } from '@/lib/templates'
import { GeneratedStory } from '@/app/api/ai/generate-story/route'
import { IntroSettings, IntroPresetId, getDefaultIntroSettings, mergeIntroSettings } from '@/lib/introPresets'

// 계좌 정보
export interface BankInfo {
  bank: string
  account: string
  holder: string
  enabled: boolean
}

// 부모 정보
export interface ParentInfo {
  name: string
  phone: string
  deceased: boolean
  bank: BankInfo
}

// 이미지 설정
export interface ImageSettings {
  scale: number      // 0.5 ~ 2.0 (기본 1.0)
  positionX: number  // -50 ~ 50 (기본 0)
  positionY: number  // -50 ~ 50 (기본 0)
}

// 프로필 정보
export interface ProfileInfo {
  images: string[]
  imageSettings: ImageSettings[]  // 각 이미지별 설정
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
  imageSettings: ImageSettings[]  // 각 이미지별 설정
}

// 인터뷰 아이템
export interface InterviewItem {
  question: string
  answer: string
  images: string[]
  imageSettings: ImageSettings[]  // 각 이미지별 설정
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

// ===== 새로운 타입들 =====

// 섹션 공개 설정
export interface SectionVisibility {
  coupleProfile: boolean    // 커플 소개
  ourStory: boolean         // 우리의 이야기
  interview: boolean        // 인터뷰
  guidance: boolean         // 행복한 시간을 위한 안내
  bankAccounts: boolean     // 축의금
  guestbook: boolean        // 방명록
}

// 인트로 애니메이션 타입
export type IntroAnimationType =
  | 'none'           // 없음
  | 'fade-in'        // 페이드 인
  | 'slide-up'       // 슬라이드 업
  | 'zoom-reveal'    // 줌 인
  | 'curtain-open'   // 커튼 오픈
  | 'letter-unfold'  // 편지 펼치기

// 섹션 구분선 영문 텍스트
export interface SectionDividerTexts {
  invitation: string      // 기본: "INVITATION"
  ourStory: string        // 기본: "OUR STORY"
  aboutUs: string         // 기본: "ABOUT US"
  interview: string       // 기본: "INTERVIEW"
  gallery: string         // 기본: "GALLERY"
  information: string     // 기본: "INFORMATION"
  location: string        // 기본: "LOCATION"
  rsvp: string            // 기본: "RSVP"
  thankYou: string        // 기본: "THANK YOU"
  guestbook: string       // 기본: "GUESTBOOK"
}

// 디자인 설정
export interface DesignSettings {
  introAnimation: IntroAnimationType
  coverTitle: string              // 표지 제목 (기본: "OUR WEDDING")
  sectionDividers: SectionDividerTexts
}

// 배경음악 설정
export interface BgmSettings {
  enabled: boolean
  url: string
  autoplay: boolean
}

// 행복한 시간을 위한 안내 섹션
export interface GuidanceSection {
  enabled: boolean
  title: string           // 기본: "행복한 시간을 위한 안내"
  content: string
  image: string
  imageSettings: ImageSettings
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
    closingText: string  // 마무리 문구
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
    imageSettings: ImageSettings[]
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
    kakaoThumbnail: string
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
  rsvpAllowGuestCount: boolean

  // ===== 섹션 공개 설정 =====
  sectionVisibility: SectionVisibility

  // ===== 디자인 설정 =====
  design: DesignSettings

  // ===== 배경음악 =====
  bgm: BgmSettings

  // ===== 행복한 시간을 위한 안내 =====
  guidance: GuidanceSection

  // ===== 인트로 애니메이션 설정 =====
  intro: IntroSettings

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
  toggleSectionVisibility: (section: keyof SectionVisibility) => void
  // 인트로 관련 액션
  updateIntroPreset: (presetId: IntroPresetId) => void
  updateIntroField: <K extends keyof IntroSettings>(field: K, value: IntroSettings[K]) => void
}

const createDefaultImageSettings = (): ImageSettings => ({
  scale: 1.0,
  positionX: 0,
  positionY: 0,
})

const createDefaultBankInfo = (): BankInfo => ({
  bank: '',
  account: '',
  holder: '',
  enabled: false,
})

const createDefaultPerson = (isGroom: boolean): PersonInfo => ({
  name: '',
  nameEn: '',
  phone: '',
  father: { name: '', phone: '', deceased: false, bank: createDefaultBankInfo() },
  mother: { name: '', phone: '', deceased: false, bank: createDefaultBankInfo() },
  bank: createDefaultBankInfo(),
  profile: {
    images: [],
    imageSettings: [],
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
      { date: '', title: '', desc: '', images: [], imageSettings: [] },
      { date: '', title: '', desc: '', images: [], imageSettings: [] },
      { date: '', title: '', desc: '', images: [], imageSettings: [] },
    ],
    closingText: '그리고 이제 드디어 부르는 서로의 이름에 \'신랑\', \'신부\'라는 호칭을 담습니다.',
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
      { question: '', answer: '', images: [], imageSettings: [], bgClass: 'pink-bg' },
      { question: '', answer: '', images: [], imageSettings: [], bgClass: 'white-bg' },
      { question: '', answer: '', images: [], imageSettings: [], bgClass: 'pink-bg' },
    ],
    guestbookQuestions: [
      '두 사람에게 해주고 싶은 말은?',
      '결혼생활에서 가장 중요한 건?',
      '두 사람의 첫인상은 어땠나요?',
    ],
  },

  // 갤러리
  gallery: { images: [], imageSettings: [] },

  // 미디어
  media: { coverImage: '', infoImage: '', bgm: '' },

  // 메타
  meta: { title: '', description: '', ogImage: '', kakaoThumbnail: '' },

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
  rsvpAllowGuestCount: true,

  // 섹션 공개 설정
  sectionVisibility: {
    coupleProfile: true,
    ourStory: true,
    interview: true,
    guidance: false,
    bankAccounts: true,
    guestbook: true,
  },

  // 디자인 설정
  design: {
    introAnimation: 'fade-in',
    coverTitle: 'OUR WEDDING',
    sectionDividers: {
      invitation: 'INVITATION',
      ourStory: 'OUR STORY',
      aboutUs: 'ABOUT US',
      interview: 'INTERVIEW',
      gallery: 'GALLERY',
      information: 'INFORMATION',
      location: 'LOCATION',
      rsvp: 'RSVP',
      thankYou: 'THANK YOU',
      guestbook: 'GUESTBOOK',
    },
  },

  // 배경음악
  bgm: {
    enabled: false,
    url: '',
    autoplay: false,
  },

  // 행복한 시간을 위한 안내
  guidance: {
    enabled: false,
    title: '행복한 시간을 위한 안내',
    content: '',
    image: '',
    imageSettings: { scale: 1.0, positionX: 0, positionY: 0 },
  },

  // 인트로 애니메이션 설정
  intro: getDefaultIntroSettings('cinematic'),

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
              { date: '', title: '', desc: '', images: [], imageSettings: [] },
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
              { question: '', answer: '', images: [], imageSettings: [], bgClass: 'white-bg' },
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

  toggleSectionVisibility: (section) =>
    set((state) => {
      if (!state.invitation) return state
      return {
        invitation: {
          ...state.invitation,
          sectionVisibility: {
            ...state.invitation.sectionVisibility,
            [section]: !state.invitation.sectionVisibility[section],
          },
        },
        isDirty: true,
      }
    }),

  updateIntroPreset: (presetId) =>
    set((state) => {
      if (!state.invitation) return state
      const newIntro = mergeIntroSettings(state.invitation.intro, presetId)
      return {
        invitation: {
          ...state.invitation,
          intro: newIntro,
        },
        isDirty: true,
      }
    }),

  updateIntroField: (field, value) =>
    set((state) => {
      if (!state.invitation) return state
      return {
        invitation: {
          ...state.invitation,
          intro: {
            ...state.invitation.intro,
            [field]: value,
          },
        },
        isDirty: true,
      }
    }),
}))
