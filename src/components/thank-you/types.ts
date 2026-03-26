export interface ThankYouData {
  coupleNames: string;
  date: string;
  heroMessage: string;
  heroImage: string;
  polaroids: PolaroidData[];
  closingLines: string[];
}

export interface PolaroidData {
  image: string;
  caption: string;
  rotation: number;
  offsetX: number;
}

export const SAMPLE_DATA: ThankYouData = {
  coupleNames: "민준 & 서연",
  date: "2026. 03. 14",
  heroMessage: "함께해 주셔서 감사합니다",
  heroImage: "/samples/parents/1.png",
  polaroids: [
    {
      image: "/samples/parents/2.png",
      caption: "우리의 시작",
      rotation: -3,
      offsetX: 0,
    },
    {
      image: "/samples/parents/3.png",
      caption: "함께한 날들",
      rotation: 4,
      offsetX: 12,
    },
    {
      image: "/samples/parents/4.png",
      caption: "영원히 함께",
      rotation: -2,
      offsetX: -8,
    },
  ],
  closingLines: [
    "감사합니다.",
    "바쁘신 와중에도 저희의 결혼을 축하해주시고\n그날을 함께해주셔서 진심으로 감사드립니다.",
    "여러분과 함께한 그 순간은\n저희에게 오래도록 기억될 소중한 시간이었습니다.",
    "그 마음을 잊지 않고,\n천천히 그리고 단단하게\n저희만의 이야기를 이어가겠습니다.",
    "민준 & 서연 올림",
  ],
};
