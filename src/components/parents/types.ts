// Parents 청첩장 공통 타입

// 이미지 크롭 데이터 타입
export interface ImageCropData {
  url: string
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
}

// 폰트 스타일 타입 (한글 중심)
export type FontStyleId = 'elegant' | 'soft' | 'classic' | 'brush' | 'modern' | 'friendly' | 'ridibatang' | 'gangwon' | 'okticon' | 'pretendard' | 'contemporary' | 'luxury' | 'gulim' | 'neathand' | 'roundhand' | 'roundgothic' | 'suit' | 'myungjo'

// 폰트 스타일 정의
export interface FontStyle {
  id: FontStyleId
  name: string
  fontName: string       // 폰트 이름
  className: string      // 적용할 CSS 클래스
  cssVariable: string    // CSS 변수명
}

// 6가지 폰트 스타일 (한글 중심)
export const FONT_STYLES: Record<FontStyleId, FontStyle> = {
  elegant: {
    id: 'elegant',
    name: '정갈한 명조',
    fontName: '나눔명조',
    className: 'font-parents-elegant',
    cssVariable: 'var(--font-nanum-myeongjo), serif',
  },
  soft: {
    id: 'soft',
    name: '부드러운 바탕',
    fontName: '고운바탕',
    className: 'font-parents-soft',
    cssVariable: 'var(--font-gowun-batang), serif',
  },
  classic: {
    id: 'classic',
    name: '고전 세리프',
    fontName: '함렛 (Hahmlet)',
    className: 'font-parents-classic',
    cssVariable: 'var(--font-hahmlet), serif',
  },
  brush: {
    id: 'brush',
    name: '전통 붓글씨',
    fontName: '송명 (Song Myung)',
    className: 'font-parents-brush',
    cssVariable: 'var(--font-song-myung), serif',
  },
  modern: {
    id: 'modern',
    name: '모던 고딕',
    fontName: 'IBM Plex Sans KR',
    className: 'font-parents-modern',
    cssVariable: 'var(--font-ibm-plex-sans-kr), sans-serif',
  },
  friendly: {
    id: 'friendly',
    name: '친근한 고딕',
    fontName: '나눔고딕',
    className: 'font-parents-friendly',
    cssVariable: 'var(--font-nanum-gothic), sans-serif',
  },
  ridibatang: {
    id: 'ridibatang',
    name: '가독성 좋은 바탕',
    fontName: 'RIDIBatang',
    className: 'font-parents-ridibatang',
    cssVariable: "'Ridibatang', serif",
  },
  gangwon: {
    id: 'gangwon',
    name: '강원교육모두체',
    fontName: 'GangwonEducationModuche',
    className: 'font-parents-gangwon',
    cssVariable: "'GangwonEducationModuche', serif",
  },
  okticon: {
    id: 'okticon',
    name: '손글씨체',
    fontName: 'Okticon',
    className: 'font-parents-okticon',
    cssVariable: "'Okticon', serif",
  },
  pretendard: {
    id: 'pretendard',
    name: '프리텐다드',
    fontName: 'Pretendard',
    className: 'font-parents-pretendard',
    cssVariable: "'Pretendard', sans-serif",
  },
  contemporary: {
    id: 'contemporary',
    name: '컨템포러리',
    fontName: '전남교육바른체',
    className: 'font-parents-contemporary',
    cssVariable: "'JeonnamEducationBarun', sans-serif",
  },
  luxury: {
    id: 'luxury',
    name: '포멀',
    fontName: '이랜드초이스체',
    className: 'font-parents-luxury',
    cssVariable: "'ELandChoice', serif",
  },
  gulim: {
    id: 'gulim',
    name: '굴림',
    fontName: '조선굴림체',
    className: 'font-parents-gulim',
    cssVariable: "'JoseonGulim', serif",
  },
  neathand: {
    id: 'neathand',
    name: '또박또박',
    fontName: '오무다예체',
    className: 'font-parents-neathand',
    cssVariable: "'OmuDaye', sans-serif",
  },
  roundhand: {
    id: 'roundhand',
    name: '둥근손글씨',
    fontName: '온글잎 콘콘체',
    className: 'font-parents-roundhand',
    cssVariable: "'OngleipKonkon', sans-serif",
  },
  roundgothic: {
    id: 'roundgothic',
    name: '둥근고딕',
    fontName: '나눔스퀘어라운드',
    className: 'font-parents-roundgothic',
    cssVariable: "'NanumSquareRound', sans-serif",
  },
  suit: {
    id: 'suit',
    name: 'SUIT',
    fontName: 'SUIT',
    className: 'font-parents-suit',
    cssVariable: "'Suit', sans-serif",
  },
  myungjo: {
    id: 'myungjo',
    name: '명조',
    fontName: '조선일보명조체',
    className: 'font-parents-myungjo',
    cssVariable: "'ChosunIlboMyungjo', serif",
  },
}

// 컬러 테마 타입
export type ColorThemeId = 'burgundy' | 'navy' | 'sage' | 'dustyRose' | 'emerald' | 'slateBlue'

// 컬러 테마 정의
export interface ColorTheme {
  id: ColorThemeId
  name: string
  primary: string      // 메인 컬러
  accent: string       // 포인트 컬러
  background: string   // 배경 컬러
  text: string         // 텍스트 컬러
  textLight: string    // 밝은 텍스트
}

// 6가지 컬러 테마
export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  burgundy: {
    id: 'burgundy',
    name: '로즈 핑크',
    primary: '#C8A0A0',
    accent: '#B89878',
    background: '#FBF9F6',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  navy: {
    id: 'navy',
    name: '소프트 블루',
    primary: '#9CAEB8',
    accent: '#8898A8',
    background: '#F8F9FB',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  sage: {
    id: 'sage',
    name: '세이지 그린',
    primary: '#A5B09A',
    accent: '#98907E',
    background: '#F9FAF7',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  dustyRose: {
    id: 'dustyRose',
    name: '라일락 핑크',
    primary: '#C0A0B8',
    accent: '#A898A8',
    background: '#FAF8FB',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  emerald: {
    id: 'emerald',
    name: '웜 그레이',
    primary: '#D0CBC5',
    accent: '#B8B0A5',
    background: '#F9F9F8',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  slateBlue: {
    id: 'slateBlue',
    name: '라떼 베이지',
    primary: '#C0B0A0',
    accent: '#B5A590',
    background: '#FAF8F5',
    text: '#1A1A1A',
    textLight: '#666666',
  },
}

// 타임라인 아이템
export interface TimelineItem {
  year: string
  description: string
  imageUrl: string  // 기존 호환성
  image?: {         // 크롭 데이터 포함
    url: string
    cropX: number
    cropY: number
    cropWidth: number
    cropHeight: number
  }
}

// 이미지 크롭 데이터
export interface ImageCropData {
  url: string
  cropX: number      // 크롭 영역 X 시작점 (0~1)
  cropY: number      // 크롭 영역 Y 시작점 (0~1)
  cropWidth: number  // 크롭 영역 너비 (0~1)
  cropHeight: number // 크롭 영역 높이 (0~1)
}

// 지하철 노선 정보
export interface SubwayLine {
  line: string
  station: string
  exit: string
}

// 고속버스 항목
export interface ExpressBusItem {
  stop: string
  note: string
}

// 기차 항목
export interface TrainItem {
  station: string
  note: string
}

// 셔틀버스 정보
export interface ShuttleInfo {
  enabled?: boolean
  departureDate?: string
  departureTime?: string
  departureLocation?: string
  returnTime?: string
  vehicleNumber?: string
  notes?: string[]
}

export interface ParentsInvitationContent {
  // 부모님 정보 (보내는 사람)
  sender: {
    side: 'groom' | 'bride'
    fatherName: string
    motherName: string
    fatherDeceased?: boolean
    motherDeceased?: boolean
    signature: string
  }

  // 신랑신부 정보
  groom: {
    lastName: string
    firstName: string
    fatherName: string
    motherName: string
    fatherDeceased?: boolean
    motherDeceased?: boolean
    parentsHidden?: boolean
  }
  bride: {
    lastName: string
    firstName: string
    fatherName: string
    motherName: string
    fatherDeceased?: boolean
    motherDeceased?: boolean
    parentsHidden?: boolean
  }

  // 고인 표시 스타일
  deceasedDisplayStyle?: 'hanja' | 'flower'

  // 결혼식 정보
  wedding: {
    date: string
    time: string
    timeDisplay: string
    venue: {
      name: string
      hall: string
      address: string
    }
    directions?: {
      bus?: { enabled?: boolean; lines?: string; stop?: string }
      subway?: { enabled?: boolean; line?: string; station?: string; exit?: string; walk?: string; lines?: SubwayLine[] }
      expressBus?: { enabled?: boolean; route?: string; stop?: string; note?: string; stops?: ExpressBusItem[] }
      train?: { enabled?: boolean; line?: string; station?: string; note?: string; stations?: TrainItem[] }
      parking?: { enabled?: boolean; capacity?: string; free?: string; note?: string }
      extraInfoEnabled?: boolean
      extraInfoText?: string
    }
  }

  // 봉투 설정
  envelope: {
    message: string[]
    defaultGreeting: string
    backgroundImage?: string      // 봉투 배경 이미지 URL
    backgroundImageSettings?: {   // 배경 이미지 크롭 설정
      scale: number
      positionX: number
      positionY: number
      cropX?: number
      cropY?: number
      cropWidth?: number
      cropHeight?: number
    }
    hintTextColor?: string        // 안내 문구 글자색
  }

  // 본문 인사말
  greeting: string

  // 타임라인
  timelineEnabled?: boolean
  timeline?: TimelineItem[]

  // 메인 이미지
  mainImage?: ImageCropData

  // 갤러리
  gallery: {
    images: ImageCropData[]
  }

  // 결혼식 안내
  weddingInfo?: {
    enabled?: boolean
    flowerGift?: { enabled?: boolean; content?: string }
    wreath?: { enabled?: boolean; content?: string }
    flowerChild?: { enabled?: boolean; content?: string }
    reception?: { enabled?: boolean; content?: string; venue?: string; datetime?: string }
    photoBooth?: { enabled?: boolean; content?: string }
    shuttle?: ShuttleInfo
    itemOrder?: string[]  // 안내 항목 순서
    customItems?: { id?: string; enabled?: boolean; title?: string; content?: string; emoji?: string }[]
  }

  // 계좌 안내
  accounts?: {
    enabled?: boolean
    list?: {
      name: string
      bank: string
      accountNumber: string
    }[]
  }

  // 유튜브 영상
  youtube?: {
    enabled: boolean
    title: string
    url: string
  }

  // 배경음악
  bgm?: {
    enabled: boolean
    url: string
    autoplay: boolean
  }

  // RSVP
  rsvpEnabled?: boolean
  rsvpMealOption?: boolean
  rsvpShuttleOption?: boolean
  rsvpNotice?: string

  // 디자인
  colorTheme: ColorThemeId
  fontStyle?: FontStyleId
  customPrimaryColor?: string
  customAccentColor?: string
  customBackgroundColor?: string
  sealColor?: string  // 실링스티커 색상 (hex)

  // 공유 메타 정보
  meta?: {
    title: string
    description: string
    kakaoThumbnail: string | ImageCropData
    ogImage: string
    kakaoThumbnailRatio?: '3:4' | '1:1' | '3:2'
  }
}

export interface GuestInfo {
  id: string
  name: string
  relation?: string
  honorific?: string
  intro_greeting?: string
  custom_message?: string
}
