'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ParentsInvitationView } from '@/components/parents'
import type { ParentsInvitationContent, ColorThemeId, FontStyleId } from '@/components/parents'

const sampleData: ParentsInvitationContent = {
  sender: {
    side: 'groom',
    fatherName: '박영수',
    motherName: '최미영',
    signature: '아버지 박영수 · 어머니 최미영 드림',
  },
  groom: {
    lastName: '박',
    firstName: '준혁',
    fatherName: '박영수',
    motherName: '최미영',
  },
  bride: {
    lastName: '한',
    firstName: '소희',
    fatherName: '한정민',
    motherName: '윤지수',
  },
  wedding: {
    date: '2027-03-20',
    time: '14:00',
    timeDisplay: 'Saturday, 2pm',
    venue: {
      name: '그랜드 하얏트 서울',
      hall: '3층 그랜드볼룸',
      address: '서울특별시 용산구 소월로 322',
    },
    directions: {
      bus: {
        enabled: true,
        lines: '400, 402번',
        stop: '남산도서관 하차',
      },
      subway: {
        enabled: true,
        line: '6호선',
        station: '녹사평역',
        exit: '2번 출구',
        walk: '도보 10분',
      },
      parking: {
        enabled: true,
        capacity: '호텔 지하주차장 이용',
        free: '3시간 무료',
        note: '',
      },
    },
  },
  envelope: {
    message: [
      '준혁이가 드디어',
      '좋은 사람을 만나',
      '결혼하게 되었습니다',
      '',
      '오셔서 함께',
      '축하해 주세요',
    ],
    defaultGreeting: '소중한분께',
  },
  greeting: `준혁이는 어릴 적부터
활달하고 밝은 아이였습니다.

운동을 좋아하고 친구가 많아
늘 집 안이 웃음소리로 가득했습니다.

그런 준혁이가 어느덧 서른을 넘기고
마음이 따뜻한 소희를 만나
새 가정을 이루게 되었습니다.

두 아이의 앞날을
함께 축복해 주시면
더없이 감사하겠습니다.`,
  gallery: {
    images: [
      { url: '/samples/parents/1.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
      { url: '/samples/parents/2.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
      { url: '/samples/parents/3.png', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
    ],
  },
  weddingInfo: {
    enabled: false,
    flowerGift: { enabled: false, content: '' },
    flowerChild: { enabled: false, content: '' },
    shuttle: {
      enabled: false,
      departureDate: '',
      departureTime: '',
      departureLocation: '',
      returnTime: '',
      vehicleNumber: '',
      notes: [],
    },
  },
  colorTheme: 'navy',
  fontStyle: 'ridibatang',
}

const validColorThemes: ColorThemeId[] = ['burgundy', 'navy', 'sage', 'dustyRose', 'emerald', 'slateBlue']
const validFontStyles: FontStyleId[] = ['elegant', 'soft', 'classic', 'brush', 'modern', 'friendly', 'ridibatang', 'gangwon', 'okticon']

function ParentsTestContent() {
  const searchParams = useSearchParams()

  const colorThemeParam = searchParams.get('colorTheme')
  const fontStyleParam = searchParams.get('fontStyle')

  const colorTheme: ColorThemeId = validColorThemes.includes(colorThemeParam as ColorThemeId)
    ? (colorThemeParam as ColorThemeId)
    : sampleData.colorTheme

  const fontStyle: FontStyleId = validFontStyles.includes(fontStyleParam as FontStyleId)
    ? (fontStyleParam as FontStyleId)
    : (sampleData.fontStyle || 'ridibatang')

  const dataWithOverrides: ParentsInvitationContent = {
    ...sampleData,
    colorTheme,
    fontStyle,
  }

  return (
    <>
      {/* RIDIBatang 웹폰트 로드 */}
      <style jsx global>{`
        @font-face {
          font-family: 'Ridibatang';
          src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.0/RIDIBatang.woff') format('woff');
          font-weight: normal;
          font-display: swap;
        }
      `}</style>
      <ParentsInvitationView
        data={dataWithOverrides}
        guestInfo={{ id: 'test', name: '테스트', honorific: '님께' }}
      />
    </>
  )
}

export default function ParentsTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 animate-pulse" />}>
      <ParentsTestContent />
    </Suspense>
  )
}
