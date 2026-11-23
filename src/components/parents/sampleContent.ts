// PARENTS(혼주용) 샘플 내용 — /sample/parents 와 에디터 미리보기 채우기가 함께 쓰는 단일 원본
import type { ParentsInvitationContent } from './types'

/** 샘플 청첩장 (이름은 한지훈 · 윤서연) */
export const PARENTS_SAMPLE: ParentsInvitationContent = {
  sectionBaseColor: '#FAFAF9',
  sender: {
    side: 'bride',
    fatherName: '윤재석',
    motherName: '박은희',
    signature: '아버지 윤재석 · 어머니 박은희 올림',
  },
  groom: {
    lastName: '한',
    firstName: '지훈',
    fatherName: '한상우',
    motherName: '김미정',
  },
  bride: {
    lastName: '윤',
    firstName: '서연',
    fatherName: '윤재석',
    motherName: '박은희',
  },
  wedding: {
    date: '2027-01-09',
    time: '16:00',
    timeDisplay: 'Saturday, 4pm',
    venue: {
      name: '더채플앳청담',
      hall: '5층 루체홀',
      address: '서울특별시 강남구 청담동 123-45',
    },
    directions: {
      bus: {
        enabled: true,
        lines: '143, 240, 463번',
        stop: '청담사거리 하차 후 도보 5분',
      },
      subway: {
        enabled: true,
        line: '7호선',
        station: '청담역',
        exit: '9번 출구',
        walk: '도보 8분',
      },
      parking: {
        enabled: true,
        capacity: '건물 내 지하주차장 이용 가능',
        free: '3시간 무료 (이후 30분당 1,000원)',
        note: '주차 공간이 협소하오니 가급적 대중교통을 이용해주세요',
      },
    },
  },
  envelope: {
    message: [
      '항상 저희 가족',
      '챙겨주셔서 감사합니다',
      '',
      '서연이가 좋은 사람 만나',
      '결혼하게 되었습니다',
      '',
      '꼭 오셔서',
      '축복해 주세요',
    ],
    defaultGreeting: '김도현님께',
    backgroundImage: '/samples/parents/1.png',
  },
  greeting: `서연이는 저희 부부에게
늘 선물 같은 아이였습니다.

어릴 적에는 소문날 만큼 많이 울던 아이였지만,
자라면서는 무엇이든 스스로 해내고
가족을 먼저 챙길 줄 아는,
마음이 참 단단한 딸로 컸습니다.

그런 서연이가 어느덧 서른둘이 되어
좋은 사람을 만나 새로운 가정을 꾸린다 하니
기쁨과 함께 여러 마음이 교차합니다.

이제는 저희 품을 떠나
남편과 함께 새로운 삶을 시작하는
서연이의 앞날에
따뜻한 축복과 응원을 보내주시길
부탁드립니다.`,
  gallery: {
    images: [
      { url: '/samples/parents/1.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
      { url: '/samples/parents/2.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
      { url: '/samples/parents/3.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
      { url: '/samples/parents/4.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
      { url: '/samples/parents/5.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
      { url: '/samples/parents/6.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
    ],
  },
  weddingInfo: {
    enabled: true,
    flowerGift: {
      enabled: true,
      content: '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.',
    },
    flowerChild: {
      enabled: true,
      content: '예식 중 사랑스러운 화동 입장이 예정되어 있습니다.\n아이들의 소중한 순간도 함께 따뜻하게 지켜봐 주세요.',
    },
    shuttle: {
      enabled: true,
      departureDate: '2027년 1월 9일 (토)',
      departureTime: '13:00 / 13:30 / 14:00',
      departureLocation: '강남역 10번 출구 앞',
      returnTime: '예식 종료 후 30분 간격 운행',
      vehicleNumber: '서울 70사 1234',
      notes: [
        '출발 시간 10분 전까지 탑승해 주세요',
        '좌석이 한정되어 있어 선착순 탑승입니다',
      ],
    },
  },
  colorTheme: 'burgundy',
  fontStyle: 'ridibatang',
}

/** 샘플 타임라인 (TimelineSection 기본값과 동일) */
export const PARENTS_SAMPLE_TIMELINE = [
  { year: '1992', description: '저희가 결혼하던 날', imageUrl: '/samples/parents/timeline/story1.jpg' },
  { year: '1998', description: '서연이 5살 생일에 강원도 여행간 날', imageUrl: '/samples/parents/timeline/story2.jpeg' },
  { year: '2018', description: '대학 졸업하던 날', imageUrl: '/samples/parents/timeline/story3.jpeg' },
  { year: '2025', description: '평생의 반쪽을 만나다', imageUrl: '/samples/parents/timeline/story4.jpg' },
]

/** 샘플 양가 (보내는 쪽에 따라 미리보기 계좌 · 서명에 사용) */
const SAMPLE_SIDE = {
  groom: { child: '한지훈', father: '한상우', mother: '김미정' },
  bride: { child: '윤서연', father: '윤재석', mother: '박은희' },
} as const

type Img = { url: string; cropX: number; cropY: number; cropWidth: number; cropHeight: number }
interface PreviewFillable {
  sender: { side: 'groom' | 'bride'; fatherName: string; motherName: string }
  groom: { lastName: string; firstName: string; fatherName: string; motherName: string }
  bride: { lastName: string; firstName: string; fatherName: string; motherName: string }
  wedding: { date: string; venue: { name: string; hall: string; address: string } }
  envelope: { backgroundImage?: string; textOnly?: boolean }
  timeline?: { year: string; description: string; imageUrl: string; image?: Img }[]
  gallery: { images: Img[] }
  accounts?: { enabled?: boolean; list?: { name: string; bank: string; accountNumber: string }[] }
}

const blank = (v?: string) => !(v || '').trim()

/**
 * 에디터 미리보기 전용: 비어 있는 칸만 샘플 내용으로 채운 복사본을 돌려준다.
 * 저장 데이터 · 입력칸에는 쓰지 않으며, 고객이 입력한 값이 있으면 그 값이 우선한다.
 */
export function fillParentsPreview<T extends PreviewFillable>(data: T): T {
  const d = structuredClone(data)
  const S = PARENTS_SAMPLE
  const side = d.sender.side === 'bride' ? 'bride' : 'groom'

  // 신랑 · 신부 이름과 양가 부모님
  for (const k of ['groom', 'bride'] as const) {
    const p = d[k]
    if (blank(p.lastName) && blank(p.firstName)) { p.lastName = S[k].lastName; p.firstName = S[k].firstName }
    else if (blank(p.firstName)) p.firstName = S[k].firstName
    if (blank(p.fatherName) && blank(p.motherName)) { p.fatherName = S[k].fatherName; p.motherName = S[k].motherName }
  }
  // 보내는 분 (보내는 쪽 부모님)
  if (blank(d.sender.fatherName) && blank(d.sender.motherName)) {
    d.sender.fatherName = SAMPLE_SIDE[side].father
    d.sender.motherName = SAMPLE_SIDE[side].mother
  }
  // 예식 일시 · 장소
  if (blank(d.wedding.date)) d.wedding.date = S.wedding.date
  if (blank(d.wedding.venue.name)) d.wedding.venue.name = S.wedding.venue.name
  if (blank(d.wedding.venue.hall) && d.wedding.venue.name === S.wedding.venue.name) d.wedding.venue.hall = S.wedding.venue.hall
  if (blank(d.wedding.venue.address)) d.wedding.venue.address = S.wedding.venue.address
  // 첫 화면 사진 (글자만을 고르지 않았을 때)
  if (!d.envelope.textOnly && blank(d.envelope.backgroundImage)) d.envelope.backgroundImage = S.envelope.backgroundImage
  // 타임라인: 비어 있는 연도 · 사진만 채움
  if (d.timeline) {
    d.timeline = d.timeline.map((t, i) => {
      const st = PARENTS_SAMPLE_TIMELINE[i % PARENTS_SAMPLE_TIMELINE.length]
      const hasImg = !blank(t.image?.url) || !blank(t.imageUrl)
      return {
        ...t,
        year: blank(t.year) ? st.year : t.year,
        description: blank(t.description) ? st.description : t.description,
        ...(hasImg ? {} : { imageUrl: st.imageUrl, image: undefined }),
      }
    })
  }
  // 갤러리
  if (!d.gallery.images.some(img => !blank(img?.url))) d.gallery.images = S.gallery.images.map(img => ({ ...img }))
  // 계좌: 모두 비어 있으면 샘플 (보내는 쪽 기준: 자녀 · 아버지 · 어머니)
  if (d.accounts && d.accounts.enabled !== false) {
    const list = d.accounts.list || []
    if (!list.some(a => !blank(a.name) || !blank(a.bank) || !blank(a.accountNumber))) {
      const ss = SAMPLE_SIDE[side]
      d.accounts.list = [
        { name: ss.child, bank: '토스뱅크', accountNumber: '1000-1234-5678' },
        { name: ss.father, bank: '국민은행', accountNumber: '123-45-6789012' },
        { name: ss.mother, bank: '신한은행', accountNumber: '110-456-789012' },
      ]
    }
  }
  return d
}
