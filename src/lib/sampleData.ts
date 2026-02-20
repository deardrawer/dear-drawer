// 미리보기 및 에디터에서 사용하는 기본 샘플 데이터

export const SAMPLE_GREETING = `서로의 가장 좋은 친구이자
든든한 지지자였던 두 사람이
이제 평생의 동반자가 되려 합니다.

함께 웃고, 함께 울며
같은 방향을 바라보던 시간들이
저희를 여기까지 이끌었습니다.

새로운 시작을 함께해 주세요.`

// 명언 샘플
export const SAMPLE_QUOTE = {
  text: '사랑은 서로를 바라보는 것이 아니라\n함께 같은 방향을 바라보는 것이다.',
  author: '생텍쥐페리',
}

export const SAMPLE_PROFILES = {
  groom: {
    aboutLabel: 'ABOUT MINJUN',
    subtitle: '서연이가 소개하는 민준',
    intro: '따뜻한 마음으로 가족을 사랑하는 사람입니다.\n음악과 여행을 좋아하며, 주말이면 카페에서 책 읽는 것을 즐깁니다.',
    tag: '#낙천적 #유머러스 #다정함',
  },
  bride: {
    aboutLabel: 'ABOUT SEOYEON',
    subtitle: '민준이가 소개하는 서연',
    intro: '밝은 미소로 주변을 환하게 만드는 사람입니다.\n요리와 그림 그리기를 좋아하며, 작은 것에도 행복을 느끼는 낙천적인 성격입니다.',
    tag: '#꼼꼼함 #따뜻함 #행복전도사',
  },
}

export const SAMPLE_STORIES = [
  {
    date: '2020.05',
    title: '첫 만남',
    desc: '회사 프로젝트에서 처음 만났습니다.\n서로에게 첫눈에 반했던 그 순간을 아직도 기억합니다.',
    images: [] as string[],
    imageSettings: [],
  },
  {
    date: '2021.12',
    title: '두 번째 크리스마스',
    desc: '함께한 두 번째 크리스마스.\n서로의 소중함을 다시 한번 느꼈던 날입니다.',
    images: [] as string[],
    imageSettings: [],
  },
  {
    date: '2023.08',
    title: '프로포즈',
    desc: '제주도 여행 중 성산일출봉에서 프로포즈를 했습니다.\n평생 함께하자는 약속을 받아주셔서 감사합니다.',
    images: [] as string[],
    imageSettings: [],
  },
]

export const SAMPLE_INTERVIEWS = [
  {
    question: '두 분은 어떻게 만나셨나요?',
    answer: '회사 동료로 처음 만났어요. 같은 프로젝트 팀이 되면서 자연스럽게 가까워졌습니다.',
    images: ['/sample/couple1.jpg', '/sample/story1.jpg', '/sample/story2.jpg'],
    imageSettings: [],
    bgClass: 'pink-bg' as const,
  },
  {
    question: '결혼을 결심하게 된 계기는?',
    answer: '함께 있을 때 가장 편안하고 행복하다는 것을 깨달았어요. 평생 이 사람과 함께하고 싶다는 확신이 들었습니다.',
    images: ['/sample/gallery1.png'],
    imageSettings: [],
    bgClass: 'white-bg' as const,
  },
  {
    question: '하객분들께 전하고 싶은 말은?',
    answer: '바쁘신 와중에도 저희의 새 출발을 축하해 주셔서 진심으로 감사드립니다.',
    images: [] as string[],
    imageSettings: [],
    bgClass: 'pink-bg' as const,
  },
]

export const SAMPLE_VENUE = {
  name: '그랜드 웨딩홀',
  hall: '그랜드볼룸 3층',
  address: '서울특별시 강남구 테헤란로 123',
}

export const SAMPLE_DIRECTIONS = {
  car: '네비게이션: "더채플앳청담" 검색\n주차: 건물 지하 주차장 이용 (2시간 무료)',
  publicTransport: '지하철: 2호선 강남역 3번 출구에서 도보 5분\n버스: 146, 341번 강남역 하차',
  train: '서울역 하차 → 4호선 → 사당역 환승 → 2호선 → 강남역 3번 출구',
  expressBus: '서울고속버스터미널 하차 → 3호선 → 교대역 환승 → 2호선 → 강남역 3번 출구',
}

export const SAMPLE_THANK_YOU = {
  message: '저희의 새로운 시작을 축하해 주셔서 감사합니다.\n오시는 모든 분들께 감사의 마음을 전합니다.',
  sign: '신랑 ○○ & 신부 ○○ 드림',
}

// MOVIE 템플릿 전용 샘플
export const SAMPLE_FILM_GREETING = `솔직히 말하면,
처음엔 그냥 밥 한번 먹자는 거였는데
어쩌다 보니 평생 같이 먹게 됐습니다.

이 예상 밖의 전개에
여러분을 초대합니다.`

export const SAMPLE_FILM_QUOTE = {
  text: 'I came here tonight because when you realize you want to spend the rest of your life with somebody, you want the rest of your life to start as soon as possible.',
  author: 'When Harry Met Sally',
}

export const SAMPLE_FILM_INTERVIEWS = [
  {
    question: '첫 만남',
    answer: '"첫인상이 어땠냐고? 솔직히 별 생각 없었어."\n"나도. 근데 두 번째 만났을 때 좀 설렜어. 아주 조금."',
    images: [] as string[],
    imageSettings: [],
    bgClass: 'pink-bg' as const,
  },
  {
    question: '우리의 시간',
    answer: '"이 사람 장점? 제가 하는 말에 잘 웃어줘요."\n"아니 진짜 웃긴 걸 어떡해. 근데 본인은 모름."',
    images: [] as string[],
    imageSettings: [],
    bgClass: 'white-bg' as const,
  },
  {
    question: '프로포즈',
    answer: '"프로포즈를 엄청 준비했는데 긴장해서 다 까먹었어."\n"그래서 그냥 울었잖아. 그게 더 감동이었어 사실."',
    images: [] as string[],
    imageSettings: [],
    bgClass: 'pink-bg' as const,
  },
]

export const SAMPLE_FILM_THANK_YOU = {
  title: 'SPECIAL THANKS',
  message: '바쁘신 와중에도 저희의 결혼을\n축하해 주셔서 진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.',
  sign: '민준 & 서연 올림',
}

// FAMILY 템플릿 전용 샘플
export const SAMPLE_FAMILY = {
  parentIntro: {
    groom: {
      message: '저희 아들이 좋은 사람을 만나\n결혼하게 되었습니다.\n\n부디 오셔서 축복해 주시면 감사하겠습니다.',
      childOrder: '첫째',
    },
    bride: {
      message: '저희 딸이 좋은 사람을 만나\n결혼하게 되었습니다.\n\n부디 오셔서 축복해 주시면 감사하겠습니다.',
      childOrder: '첫째',
    },
  },
  whyWeChose: {
    groom: {
      description: '이 사람과 함께라면\n더 따뜻한 사람이 될 수 있겠다는 마음이 들었습니다.',
      quote: '서로 아끼며 행복하게 살겠습니다.',
    },
    bride: {
      description: '내가 나다워도 괜찮다고 말해주는\n이 사람이라면 오래오래 곁에 두고 싶다고.',
      quote: '늘 처음처럼 행복하게 살겠습니다.',
    },
  },
}

// Helper: 값이 비어있는지 확인
export function isEmpty(value: string | undefined | null): boolean {
  return !value || value.trim() === ''
}

// Helper: 스토리가 비어있는지 확인
export function isStoryEmpty(stories: { title?: string; desc?: string }[]): boolean {
  return !stories || stories.every(s => isEmpty(s.title) && isEmpty(s.desc))
}

// Helper: 인터뷰가 비어있는지 확인
export function isInterviewEmpty(interviews: { question?: string; answer?: string }[]): boolean {
  return !interviews || interviews.every(i => isEmpty(i.question) && isEmpty(i.answer))
}
