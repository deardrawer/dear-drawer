import { create } from 'zustand'
import { Template } from '@/lib/templates'
import { GeneratedStory, FamilyWhyWeChoseStory } from '@/app/api/ai/generate-story/route'
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
  // 크롭 데이터 (프레임 방식)
  cropX?: number      // 크롭 영역 X 시작점 (0~1)
  cropY?: number      // 크롭 영역 Y 시작점 (0~1)
  cropWidth?: number  // 크롭 영역 너비 (0~1)
  cropHeight?: number // 크롭 영역 높이 (0~1)
}

// 프로필 정보
export interface TextStyle {
  lineHeight: number    // 1.4 ~ 2.2 (기본 2.0)
  textAlign: 'left' | 'center' | 'right'  // 기본 'left'
}

export interface ProfileInfo {
  images: string[]
  imageSettings: ImageSettings[]  // 각 이미지별 설정
  aboutLabel: string
  subtitle: string
  intro: string
  tag: string
  textStyle?: TextStyle
}

// 커플 개인 정보
export interface PersonInfo {
  name: string
  lastName: string    // 성 (family 템플릿용)
  firstName: string   // 이름 (family 템플릿용)
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
}

// 오시는 길 정보
export interface DirectionsInfo {
  car: string              // 자가용 (경로 + 주차 통합)
  publicTransport: string  // 버스/지하철 (지선 간선 통합)
  train?: string           // 기차역 (선택)
  expressBus?: string      // 고속버스 (선택)
  shuttle?: string         // 셔틀버스 (선택)
  extraInfoEnabled?: boolean  // 추가 안내사항 사용 여부
  extraInfoText?: string      // 추가 안내사항 텍스트
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
  textStyle?: TextStyle
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
  flowerGift: {
    title: string
    content: string
    enabled: boolean
  }
  wreath: {
    title: string
    content: string
    enabled: boolean
  }
  shuttle: {
    title: string
    content: string
    enabled: boolean
  }
  reception: {
    title: string
    content: string
    venue?: string
    datetime?: string
    enabled: boolean
  }
  customItems: CustomInfoItem[]
  itemOrder: string[]  // 안내 항목 순서
}

// ===== 새로운 타입들 =====

// 섹션 공개 설정
export interface SectionVisibility {
  coupleProfile: boolean    // 커플 소개 (OUR 템플릿)
  ourStory: boolean         // 우리의 이야기 (OUR 템플릿)
  parentsGreeting: boolean  // 부모님 인사말 (FAMILY 템플릿)
  interview: boolean        // 인터뷰
  guidance: boolean         // 행복한 시간을 위한 안내
  contacts: boolean         // 연락처
  bankAccounts: boolean     // 축의금
  guestbook: boolean        // 방명록
}

// 미리보기 섹션 타입 (EditPanel과 Preview 연동용)
export type PreviewSectionId =
  | 'intro-cover'       // 인트로 커버
  | 'invitation'        // 초대 글귀
  | 'venue-info'        // 예식 정보
  | 'couple-profile'    // 커플 프로필
  | 'our-story'         // 우리의 이야기
  | 'gallery'           // 갤러리
  | 'interview'         // 인터뷰
  | 'guidance'          // 행복한 시간을 위한 안내
  | 'thank-you'         // 감사 인사
  | 'guestbook'         // 방명록
  | 'rsvp'              // RSVP
  | null

// 고인 표시 스타일
export type DeceasedDisplayStyle = 'hanja' | 'flower'

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
  coverTitle: string              // 인트로 제목 (기본: "OUR WEDDING")
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

// 풀하이트 디바이더 섹션 (FAMILY 템플릿용)
export interface FullHeightDividerItem {
  id: string
  englishTitle: string     // 영문 타이틀 (상단 작은 텍스트)
  koreanText: string       // 한글 텍스트 (큰 손글씨)
  image: string            // 배경 이미지
  imageSettings: ImageSettings & {
    grayscale: number      // 흑백 정도 (0~100, 기본 100)
    opacity: number        // 불투명도 (0~100, 기본 100)
  }
}

export interface FullHeightDividers {
  enabled: boolean
  items: FullHeightDividerItem[]
}

// 부모님 소개 섹션 (FAMILY 템플릿용)
export interface ParentIntroItem {
  enabled: boolean
  parentNames: string      // "전아빠, 김엄마의"
  childOrder: string       // "첫째", "둘째", "막내" 등
  images: string[]         // 가족 사진 (최대 2장, 4:3 비율)
  imageSettings?: ImageSettings[]  // 각 이미지별 크롭 설정
  message: string          // 부모님 메시지
}

export interface ParentIntro {
  groom: ParentIntroItem
  bride: ParentIntroItem
}

// 서로를 선택한 이유 섹션 (FAMILY 템플릿용)
export interface WhyWeChoseItem {
  enabled: boolean
  images: string[]         // 1~3장
  imageSettings?: { scale: number; positionX: number; positionY: number }[]
  description: string      // 본문 (** 로 강조)
  quote: string            // 하단 인용문
}

export interface WhyWeChose {
  enabled: boolean
  title: string            // "우리가 서로를 선택한 이유"
  subtitle: string         // "오래 보아도 좋은 사람, 서로 그렇게 되기까지"
  groom: WhyWeChoseItem
  bride: WhyWeChoseItem
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
    interviewIntro: string      // 인터뷰 섹션 소개 문구
    guestbookQuestions: string[]
    parentsGreeting: string   // 부모님 인사말 (FAMILY 템플릿)
    parentsSign: string       // 부모님 서명 (FAMILY 템플릿)
  }

  // ===== 갤러리 =====
  gallery: {
    images: string[]
    imageSettings: ImageSettings[]
  }

  // ===== 미디어 =====
  media: {
    coverImage: string
    coverImageSettings?: ImageSettings
    infoImage: string
    bgm: string
  }

  // ===== 메타 =====
  meta: {
    title: string
    description: string
    ogImage: string
    ogImageSettings?: ImageSettings
    kakaoThumbnail: string
    kakaoThumbnailSettings?: ImageSettings
    kakaoTitle: string        // 카카오톡 공유 제목
    kakaoDescription: string  // 카카오톡 공유 설명
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
  accentTextColor?: string  // 강조 텍스트 색상 (사용자 커스텀, 없으면 테마 기본값 사용)
  bodyTextColor?: string    // 본문 텍스트 색상 (사용자 커스텀, 없으면 테마 기본값 사용)

  // ===== RSVP =====
  rsvpEnabled: boolean
  rsvpDeadline: string
  rsvpAllowGuestCount: boolean

  // ===== 고인 표시 스타일 =====
  deceasedDisplayStyle: DeceasedDisplayStyle

  // ===== 섹션별 텍스트 스타일 =====
  profileTextStyle?: TextStyle
  interviewTextStyle?: TextStyle
  parentIntroTextStyle?: TextStyle
  whyWeChoseTextStyle?: TextStyle

  // ===== 섹션 공개 설정 =====
  sectionVisibility: SectionVisibility

  // ===== 프로필 순서 (신랑먼저/신부먼저) =====
  profileOrder: 'groom-first' | 'bride-first'

  // ===== 디자인 설정 =====
  design: DesignSettings

  // ===== 배경음악 =====
  bgm: BgmSettings

  // ===== 행복한 시간을 위한 안내 =====
  guidance: GuidanceSection

  // ===== 인트로 애니메이션 설정 =====
  intro: IntroSettings

  // ===== 풀하이트 디바이더 섹션 (FAMILY 템플릿용) =====
  fullHeightDividers?: FullHeightDividers

  // ===== 부모님 소개 섹션 (FAMILY 템플릿용) =====
  parentIntro?: ParentIntro

  // ===== 서로를 선택한 이유 섹션 (FAMILY 템플릿용) =====
  whyWeChose?: WhyWeChose

  // ===== 레거시 필드 (AI 스토리용) =====
  ourStory: string
  decision: string
  invitation: string
}

// 위자드 Step 타입 (템플릿 선택은 /templates 페이지에서 처리)
export type WizardStep = 1 | 2 | 3 | 4 | 5

// 위자드 미리보기 모드
export type WizardPreviewMode = 'cover' | 'content' | 'menu' | 'full'

interface EditorStore {
  invitation: InvitationContent | null
  template: Template | null
  isDirty: boolean
  isSaving: boolean
  activeSection: PreviewSectionId  // 현재 편집 중인 섹션
  editorActiveTab: string  // 에디터 탭 제어
  validationError: { tab: string; message: string } | null

  // 위자드 모드 관련
  wizardMode: boolean  // true면 위자드, false면 자유 편집
  wizardStep: WizardStep
  wizardPreviewMode: WizardPreviewMode
  wizardVisitedSteps: WizardStep[]  // 방문한 스텝 기록
  wizardSavedSteps: WizardStep[]  // 저장된 스텝 기록 (저장 시 체크마크 표시용)

  // Actions
  initInvitation: (template: Template) => void
  setActiveSection: (section: PreviewSectionId) => void
  updateField: <K extends keyof InvitationContent>(
    field: K,
    value: InvitationContent[K]
  ) => void
  updateNestedField: (path: string, value: unknown) => void
  updateMultipleFields: (fields: Partial<InvitationContent>) => void
  applyAIStory: (story: GeneratedStory) => void
  applyFamilyAIStory: (story: FamilyWhyWeChoseStory & { groomQuote: string; brideQuote: string }, applyInterview?: GeneratedStory) => void
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
  setEditorActiveTab: (tab: string) => void
  setValidationError: (error: { tab: string; message: string } | null) => void
  // 위자드 모드 액션
  setWizardMode: (mode: boolean) => void
  setWizardStep: (step: WizardStep) => void
  markStepsSaved: () => void  // 현재까지 방문한 스텝을 저장됨으로 표시
  setWizardPreviewMode: (mode: WizardPreviewMode) => void
  nextWizardStep: () => void
  prevWizardStep: () => void
  validateWizardStep: (step: WizardStep) => { valid: boolean; errors: string[] }
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
  lastName: '',
  firstName: '',
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
    },
    directions: {
      car: '',
      publicTransport: '',
      train: '',
      expressBus: '',
      shuttle: '',
      extraInfoEnabled: false,
      extraInfoText: '',
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
      dressCode: { title: '드레스코드 안내', content: '결혼식에 맞는 옷차림을 고민하지 않으셔도 괜찮아요.\n여러분이 가장 좋아하는 옷,\n가장 여러분다운 모습으로 오셔서\n함께 웃고 즐겨주신다면 그걸로 충분합니다.', enabled: false },
      photoShare: {
        title: '사진 공유',
        content: '결혼식에서 찍은 사진들을 공유해주세요!\n여러분의 시선으로 담긴 우리의 결혼식,\n소중한 추억으로 간직하겠습니다.',
        buttonText: '사진 공유하기',
        url: '',
        enabled: false,
      },
      photoBooth: { title: '포토부스', content: '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.\n즐거운 추억을 사진으로 남겨주세요.', enabled: false },
      flowerChild: { title: '화동 안내', content: '본 예식에는\n소중한 반려견 푸코가 화동으로 함께합니다.\n혹시 강아지를 무서워 하는 분이 계신다면\n너른 마음으로 양해부탁 드리겠습니다.', enabled: false },
      flowerGift: { title: '꽃 답례품 안내', content: '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.', enabled: false },
      wreath: { title: '화환 안내', content: '마음만 감사히 받겠습니다.\n화환은 정중히 사양하오니\n너른 양해 부탁드립니다.', enabled: false },
      shuttle: { title: '셔틀버스 안내', content: '예식 당일 셔틀버스가 운행될 예정입니다.\n탑승 장소와 시간은 아래 내용을 참고해 주세요.\n편안한 이동이 되시길 바랍니다.\n\n[출발 일시]\n0000년 0월 0일 (0요일)\n오전 00시 00분 출발\n\n[탑승 장소]\n00시 00구 00역 0번 출구 앞\n\n[복귀 일시]\n예식 종료 후\n오후 00시 00분 출발 예정\n\n[차량 번호]\n전세버스 ○○○○호\n\n안내 사항\n원활한 출발을 위해 출발 10분 전까지 도착 부탁드립니다.\n정시 출발로, 지각 시 탑승이 어려울 수 있습니다.\n복귀 시간은 현장 상황에 따라 변동될 수 있습니다.', enabled: false },
      reception: { title: '피로연 안내', content: '먼 걸음이 어려우신 분들을 모시고자\n피로연 자리를 마련하였습니다.\n\n참석하시어 두 사람의 앞날을\n따뜻한 축복으로 함께해 주시면\n감사하겠습니다.\n\n[장소]\n장소 입력\n\n[일시]\n0년 0월 0일(0요일) 오후 0시 0분', venue: '', datetime: '', enabled: false },
      customItems: [],
      itemOrder: ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception'],
    },
    interviews: [
      { question: '', answer: '', images: [], imageSettings: [], bgClass: 'pink-bg' },
      { question: '', answer: '', images: [], imageSettings: [], bgClass: 'white-bg' },
      { question: '', answer: '', images: [], imageSettings: [], bgClass: 'pink-bg' },
    ],
    interviewIntro: '',
    guestbookQuestions: [
      '두 사람에게 해주고 싶은 말은?',
      '결혼생활에서 가장 중요한 건?',
      '두 사람의 첫인상은 어땠나요?',
    ],
    parentsGreeting: '',
    parentsSign: '',
  },

  // 갤러리
  gallery: { images: [], imageSettings: [] },

  // 미디어 (템플릿별 기본 커버 이미지 사용)
  media: { coverImage: template.defaultCoverImage || '', infoImage: '', bgm: '' },

  // 메타
  meta: { title: '', description: '', ogImage: '', ogImageSettings: { scale: 1, positionX: 0, positionY: 0, cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }, kakaoThumbnail: '', kakaoThumbnailSettings: { scale: 1, positionX: 0, positionY: 0, cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }, kakaoTitle: '', kakaoDescription: '' },

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

  // 고인 표시 스타일
  deceasedDisplayStyle: 'flower',

  // 섹션 공개 설정
  sectionVisibility: {
    coupleProfile: true,
    ourStory: true,
    parentsGreeting: true,
    interview: true,
    guidance: true,
    contacts: true,
    bankAccounts: true,
    guestbook: true,
  },

  // 프로필 순서
  profileOrder: 'groom-first',

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
    enabled: true,
    title: '행복한 시간을 위한 안내',
    content: '',
    image: '',
    imageSettings: { scale: 1.0, positionX: 0, positionY: 0 },
  },

  // 인트로 애니메이션 설정
  intro: getDefaultIntroSettings('cinematic'),

  // 풀하이트 디바이더 섹션
  fullHeightDividers: {
    enabled: false,
    items: [
      {
        id: 'divider-1',
        englishTitle: 'From Our Family to Yours',
        koreanText: '우리의 봄이, 누군가의 평생이 됩니다',
        image: '',
        imageSettings: { scale: 1.0, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 },
      },
      {
        id: 'divider-2',
        englishTitle: 'Why We Chose Each Other for Life',
        koreanText: '서로의 부족한 점을 채워줄 수 있는\n사람을 만났습니다.',
        image: '',
        imageSettings: { scale: 1.0, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 },
      },
      {
        id: 'divider-3',
        englishTitle: 'Our way to marriage',
        koreanText: '같은 시간, 같은 마음으로\n하나의 계절을 준비하고 있습니다.',
        image: '',
        imageSettings: { scale: 1.0, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 },
      },
    ],
  },

  // 부모님 소개 섹션
  parentIntro: {
    groom: {
      enabled: true,
      parentNames: '',
      childOrder: '첫째',
      images: [],
      message: '',
    },
    bride: {
      enabled: true,
      parentNames: '',
      childOrder: '첫째',
      images: [],
      message: '',
    },
  },

  // 서로를 선택한 이유 섹션
  whyWeChose: {
    enabled: true,
    title: '우리가 서로를 선택한 이유',
    subtitle: '오래 보아도 좋은 사람, 서로 그렇게 되기까지',
    groom: {
      enabled: true,
      images: [],
      imageSettings: [],
      description: '',
      quote: '서로 아끼며 행복하게 살겠습니다.',
    },
    bride: {
      enabled: true,
      images: [],
      imageSettings: [],
      description: '',
      quote: '늘 처음처럼 행복하게 살겠습니다.',
    },
  },

  // 레거시
  ourStory: '',
  decision: '',
  invitation: '',
})

// 중첩 객체 업데이트 헬퍼 (배열 인덱스 지원)
const setNestedValue = (obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> => {
  const keys = path.split('.')
  const result = { ...obj }
  let current: Record<string, unknown> = result

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const isNextKeyArrayIndex = /^\d+$/.test(nextKey)

    if (Array.isArray(current[key])) {
      // 배열인 경우 배열로 복사
      current[key] = [...(current[key] as unknown[])]
    } else if (current[key] && typeof current[key] === 'object') {
      // 객체인 경우 객체로 복사
      current[key] = { ...(current[key] as Record<string, unknown>) }
    } else if (isNextKeyArrayIndex) {
      // 다음 키가 숫자이고 현재 값이 없으면 배열 생성
      current[key] = []
    } else {
      // 그 외의 경우 객체 생성
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
  return result
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  invitation: null,
  template: null,
  isDirty: false,
  isSaving: false,
  activeSection: null,
  editorActiveTab: 'design',
  validationError: null,

  // 위자드 모드 상태
  wizardMode: true,  // 기본값: 위자드 모드
  wizardStep: 1 as WizardStep,
  wizardVisitedSteps: [1] as WizardStep[],  // 첫 스텝은 방문한 것으로 시작
  wizardSavedSteps: [] as WizardStep[],  // 저장된 스텝 (저장 시 체크마크 표시)
  wizardPreviewMode: 'cover' as WizardPreviewMode,

  initInvitation: (template) =>
    set({
      invitation: createDefaultInvitation(template),
      template,
      isDirty: false,
      activeSection: null,
      // 위자드 상태 리셋
      wizardStep: 1 as WizardStep,
      wizardVisitedSteps: [1] as WizardStep[],
      wizardSavedSteps: [] as WizardStep[],
      wizardPreviewMode: 'cover' as WizardPreviewMode,
      validationError: null,
    }),

  setActiveSection: (section) => set({ activeSection: section }),

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

      // 프로필 소개 업데이트
      const updatedGroom = {
        ...state.invitation.groom,
        profile: {
          ...state.invitation.groom.profile,
          intro: story.profileIntro,
        },
      }

      // 러브스토리 업데이트 (첫번째 스토리)
      const updatedStories = [...state.invitation.relationship.stories]
      if (updatedStories.length > 0) {
        updatedStories[0] = {
          ...updatedStories[0],
          desc: story.ourStory,
        }
      }

      // 인터뷰 업데이트 (결혼 결심)
      const updatedInterviews = [...state.invitation.content.interviews]
      if (updatedInterviews.length > 0) {
        updatedInterviews[0] = {
          ...updatedInterviews[0],
          question: '결혼을 결심하게 된 계기는?',
          answer: story.decision,
        }
      }

      return {
        invitation: {
          ...state.invitation,
          groom: updatedGroom,
          relationship: {
            ...state.invitation.relationship,
            stories: updatedStories,
          },
          content: {
            ...state.invitation.content,
            interviews: updatedInterviews,
            thankYou: {
              ...state.invitation.content.thankYou,
              message: story.thankYou,
            },
          },
        },
        isDirty: true,
      }
    }),

  applyFamilyAIStory: (story, applyInterview) =>
    set((state) => {
      if (!state.invitation) return state

      // whyWeChose 업데이트 - 기본값 제공
      const updatedWhyWeChose: WhyWeChose = {
        enabled: true,
        title: state.invitation.whyWeChose?.title || '우리가 서로를 선택한 이유',
        subtitle: state.invitation.whyWeChose?.subtitle || '오래 보아도 좋은 사람, 서로 그렇게 되기까지',
        groom: {
          enabled: true,
          images: state.invitation.whyWeChose?.groom?.images || [],
          imageSettings: state.invitation.whyWeChose?.groom?.imageSettings,
          description: story.groomDescription,
          quote: story.groomQuote,
        },
        bride: {
          enabled: true,
          images: state.invitation.whyWeChose?.bride?.images || [],
          imageSettings: state.invitation.whyWeChose?.bride?.imageSettings,
          description: story.brideDescription,
          quote: story.brideQuote,
        },
      }

      // 인터뷰도 함께 적용할 경우 (소개, 스토리, 인터뷰, 감사인사 순서)
      let updatedInterviews = state.invitation.content.interviews
      let updatedThankYou = state.invitation.content.thankYou
      let updatedGroom = state.invitation.groom
      let updatedStories = state.invitation.relationship.stories

      if (applyInterview) {
        // 프로필 소개 업데이트
        updatedGroom = {
          ...state.invitation.groom,
          profile: {
            ...state.invitation.groom.profile,
            intro: applyInterview.profileIntro,
          },
        }

        // 러브스토리 업데이트
        updatedStories = [...state.invitation.relationship.stories]
        if (updatedStories.length > 0) {
          updatedStories[0] = {
            ...updatedStories[0],
            desc: applyInterview.ourStory,
          }
        }

        // 인터뷰 업데이트
        updatedInterviews = [
          {
            ...state.invitation.content.interviews[0],
            question: '결혼을 결심하게 된 계기는?',
            answer: applyInterview.decision,
          },
        ]

        // 감사인사 업데이트
        updatedThankYou = {
          ...state.invitation.content.thankYou,
          message: applyInterview.thankYou,
        }
      }

      return {
        invitation: {
          ...state.invitation,
          groom: updatedGroom,
          whyWeChose: updatedWhyWeChose,
          relationship: {
            ...state.invitation.relationship,
            stories: updatedStories,
          },
          content: {
            ...state.invitation.content,
            interviews: updatedInterviews,
            thankYou: updatedThankYou,
          },
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

  setEditorActiveTab: (tab) => set({ editorActiveTab: tab }),
  setValidationError: (error) => set({ validationError: error }),

  // 위자드 모드 액션
  setWizardMode: (mode) => set({ wizardMode: mode }),
  setWizardStep: (step) => {
    const { wizardVisitedSteps } = get()
    // Step에 따른 미리보기 모드 자동 설정
    const previewModeMap: Record<WizardStep, WizardPreviewMode> = {
      1: 'cover',
      2: 'cover',
      3: 'content',
      4: 'menu',
      5: 'full',
    }
    // 방문 기록 추가
    const newVisited = wizardVisitedSteps.includes(step)
      ? wizardVisitedSteps
      : [...wizardVisitedSteps, step]
    set({ wizardStep: step, wizardPreviewMode: previewModeMap[step], wizardVisitedSteps: newVisited })
  },
  setWizardPreviewMode: (mode) => set({ wizardPreviewMode: mode }),

  // 저장 시 현재까지 방문한 스텝을 저장됨으로 표시
  markStepsSaved: () => {
    const { wizardVisitedSteps } = get()
    set({ wizardSavedSteps: [...wizardVisitedSteps] })
  },

  // 자유롭게 이동 가능 (검증 없이, 발행 시에만 검증)
  nextWizardStep: () => {
    const { wizardStep, wizardVisitedSteps } = get()
    if (wizardStep < 5) {
      const nextStep = (wizardStep + 1) as WizardStep
      const previewModeMap: Record<WizardStep, WizardPreviewMode> = {
        1: 'cover',
        2: 'cover',
        3: 'content',
        4: 'menu',
        5: 'full',
      }
      const newVisited = wizardVisitedSteps.includes(nextStep)
        ? wizardVisitedSteps
        : [...wizardVisitedSteps, nextStep]
      set({ wizardStep: nextStep, wizardPreviewMode: previewModeMap[nextStep], wizardVisitedSteps: newVisited, validationError: null })
    }
  },

  prevWizardStep: () => {
    const { wizardStep } = get()
    if (wizardStep > 1) {
      const prevStep = (wizardStep - 1) as WizardStep
      const previewModeMap: Record<WizardStep, WizardPreviewMode> = {
        1: 'cover',
        2: 'cover',
        3: 'content',
        4: 'menu',
        5: 'full',
      }
      set({ wizardStep: prevStep, wizardPreviewMode: previewModeMap[prevStep], validationError: null })
    }
  },

  validateWizardStep: (step) => {
    const { invitation } = get()
    const errors: string[] = []

    if (!invitation) {
      return { valid: false, errors: ['청첩장 데이터가 없습니다.'] }
    }

    switch (step) {
      case 1:
        // 기본 정보 필수 검증 (기존 Step 2)
        if (!invitation.groom.name?.trim()) errors.push('신랑 이름을 입력해주세요.')
        if (!invitation.bride.name?.trim()) errors.push('신부 이름을 입력해주세요.')
        if (!invitation.wedding.date) errors.push('결혼 날짜를 선택해주세요.')
        if (!invitation.wedding.venue.name?.trim()) errors.push('예식장 이름을 입력해주세요.')
        if (!invitation.wedding.venue.address?.trim()) errors.push('예식장 주소를 입력해주세요.')
        break
      case 2:
        // 인트로 - 카카오 썸네일 필수 (기존 Step 3)
        if (!invitation.meta.kakaoThumbnail?.trim()) errors.push('카카오톡 공유 썸네일을 업로드해주세요.')
        break
      case 3:
      case 4:
        // 선택 항목이므로 통과 (기존 Step 4, 5)
        break
      case 5:
        // 발행 - 나중에 slug 검증 추가 (기존 Step 6)
        break
    }

    return { valid: errors.length === 0, errors }
  },
}))
