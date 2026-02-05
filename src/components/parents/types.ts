// Parents 청첩장 공통 타입

// 폰트 스타일 타입 (한글 중심)
export type FontStyleId = 'elegant' | 'soft' | 'classic' | 'brush' | 'modern' | 'friendly' | 'ridibatang' | 'gangwon' | 'okticon'

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
    name: '버건디',
    primary: '#722F37',
    accent: '#C9A962',
    background: '#FFFEF8',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  navy: {
    id: 'navy',
    name: '네이비',
    primary: '#1E3A5F',
    accent: '#D4AF37',
    background: '#F8F9FA',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  sage: {
    id: 'sage',
    name: '세이지 그린',
    primary: '#7D8471',
    accent: '#C9B896',
    background: '#FAFAF8',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  dustyRose: {
    id: 'dustyRose',
    name: '더스티 로즈',
    primary: '#C4A4A4',
    accent: '#8B7355',
    background: '#FDF9F7',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  emerald: {
    id: 'emerald',
    name: '딥 에메랄드',
    primary: '#2D5A4A',
    accent: '#C9A962',
    background: '#F8FAF9',
    text: '#1A1A1A',
    textLight: '#666666',
  },
  slateBlue: {
    id: 'slateBlue',
    name: '슬레이트 블루',
    primary: '#6B7B8C',
    accent: '#B8A88A',
    background: '#F7F8FA',
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
    signature: string
  }

  // 신랑신부 정보
  groom: {
    lastName: string
    firstName: string
    fatherName: string
    motherName: string
  }
  bride: {
    lastName: string
    firstName: string
    fatherName: string
    motherName: string
  }

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
      parking?: { enabled?: boolean; capacity?: string; free?: string; note?: string }
      extraInfoEnabled?: boolean
      extraInfoText?: string
    }
  }

  // 봉투 설정
  envelope: {
    message: string[]
    defaultGreeting: string
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

  // 디자인
  colorTheme: ColorThemeId
  fontStyle?: FontStyleId

  // 공유 메타 정보
  meta?: {
    title: string
    description: string
    kakaoThumbnail: string
    ogImage: string
  }
}

export interface GuestInfo {
  id: string
  name: string
  relation?: string
  honorific?: string
  custom_message?: string
}
