'use client'

import { ParentsInvitationView } from '@/components/parents'
import type { ParentsInvitationContent } from '@/components/parents'

// 샘플 데이터
const sampleData: ParentsInvitationContent = {
  sender: {
    side: 'bride',
    fatherName: '이○○',
    motherName: '김○○',
    signature: '아버지 이○○ · 어머니 김○○ 드림',
  },
  groom: {
    lastName: '김',
    firstName: '도윤',
    fatherName: '김○○',
    motherName: '박○○',
  },
  bride: {
    lastName: '이',
    firstName: '서연',
    fatherName: '이○○',
    motherName: '김○○',
  },
  wedding: {
    date: '2027-01-09',
    time: '16:00',
    timeDisplay: 'Saturday, 4pm',
    venue: {
      name: '더채플앳청담',
      hall: '5층 루체홀',
      address: '서울특별시 강남구 청담동 123-45',
      mapUrl: '',
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
    defaultGreeting: '김영희님께',
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
}

export default function FamilyInvitationPage() {
  return (
    <ParentsInvitationView
      data={sampleData}
      guestInfo={{ id: 'sample', name: '김영희', honorific: '님께' }}
    />
  )
}
