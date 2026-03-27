export interface CropData {
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

// 메인컬러 프리셋
export interface ThankYouAccentPreset {
  color: string
  label: string
}

export const THANKYOU_ACCENT_PRESETS: ThankYouAccentPreset[] = [
  { color: '#B89878', label: '로즈 골드' },
  { color: '#8898A8', label: '블루 그레이' },
  { color: '#98907E', label: '세이지' },
  { color: '#A898A8', label: '라벤더' },
  { color: '#3D3530', label: '차콜' },
  { color: '#C9A962', label: '골드' },
  { color: '#B5A590', label: '베이지' },
  { color: '#9E7B6B', label: '테라코타' },
]

export interface BackgroundImageSettings {
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

export interface PhotoShareConfig {
  enabled: boolean
  message: string
  url: string
  buttonText: string
}

export interface ThankYouData {
  coupleNames: string;
  date: string;
  heroMessage: string;
  heroImage: string;
  heroCrop?: CropData;
  backgroundImage?: string;
  backgroundImageSettings?: BackgroundImageSettings;
  polaroids: PolaroidData[];
  closingLines: string[];
  photoShare?: PhotoShareConfig;
}

export interface PolaroidData {
  image: string;
  caption: string;
  rotation: number;
  offsetX: number;
  crop?: CropData;
}

export const SAMPLE_DATA: ThankYouData = {
  coupleNames: "민준 & 서연",
  date: "2026. 03. 14",
  heroMessage: "함께해 주셔서 감사합니다",
  heroImage: "/sample/thankyou-main.jpg",
  polaroids: [
    {
      image: "/sample/thankyou-sub.jpg",
      caption: "우리의 시작",
      rotation: -3,
      offsetX: 0,
    },
    {
      image: "/sample/thankyou-sub2.jpg",
      caption: "함께한 날들",
      rotation: 4,
      offsetX: 12,
    },
    {
      image: "/sample/thankyou-sub.jpg",
      caption: "영원히 함께",
      rotation: -2,
      offsetX: -8,
    },
  ],
  closingLines: [
    "감사합니다.",
    "바쁘신 와중에도\n저희의 결혼을 축하해주시고,\n그날을 함께해주셔서\n진심으로 감사드립니다.",
    "여러분과 함께한 그 순간은\n저희에게 오래도록 기억될\n소중한 시간이었습니다.",
    "그 마음을 잊지 않고,\n천천히 그리고 단단하게\n저희만의 이야기를 이어가겠습니다.",
    "민준 & 서연 올림",
  ],
  photoShare: {
    enabled: true,
    message: '결혼식에서 찍은 사진들을 공유해주세요.\n여러분의 시선으로 담긴 우리의 결혼식,\n소중한 추억으로 간직하겠습니다.',
    url: 'https://photos.google.com',
    buttonText: '사진 공유하기',
  },
};
