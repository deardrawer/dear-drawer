export type NarrativeType = 'our' | 'family' | 'parents' | 'magazine' | 'film' | 'record' | 'exhibit' | 'essay' | 'thankyou' | 'the-simple'

export type TemplateSection = {
  id: string
  title: string
  aiGenerated: boolean
  optional?: boolean
}

export type Template = {
  id: string
  name: string
  description: string
  thumbnail: string
  defaultCoverImage: string  // 기본 커버 이미지
  narrativeType: NarrativeType
  emoji: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  fonts: {
    heading: string
    body: string
  }
  features: string[]
  sections: TemplateSection[]
}

export const templates: Template[] = [
  {
    id: 'narrative-our',
    name: 'OUR',
    description: '두 사람의 사랑을 한 편의 이야기로',
    thumbnail: '/templates/narrative-our.jpg',
    defaultCoverImage: '/sample/cover3.png',  // OUR 템플릿 기본 커버 이미지
    narrativeType: 'our',
    emoji: '💕',
    colors: {
      primary: '#8B7355',
      secondary: '#F5F0EB',
      accent: '#C9A86C',
      background: '#FAF8F5',
      text: '#3D3D3D',
    },
    fonts: {
      heading: 'Okticon',
      body: 'Pretendard',
    },
    features: ['커플 서사 중심', '감성적 톤', '에디토리얼 레이아웃', '스토리 초안 작성'],
    sections: [
      { id: 'opening', title: '오프닝', aiGenerated: false },
      { id: 'first-chapter', title: '만남', aiGenerated: true },
      { id: 'our-time', title: '우리의 시간', aiGenerated: true },
      { id: 'decision', title: '결심', aiGenerated: true },
      { id: 'invitation', title: '초대', aiGenerated: false },
      { id: 'details', title: '예식 정보', aiGenerated: false },
      { id: 'closing', title: '클로징', aiGenerated: false },
    ],
  },
  {
    id: 'narrative-family',
    name: 'FAMILY',
    description: '두 가족이 함께 써 내려가는 결혼 이야기',
    thumbnail: '/templates/narrative-family.jpg',
    defaultCoverImage: '/samples/parents/1.png',  // FAMILY 템플릿 기본 커버 이미지
    narrativeType: 'family',
    emoji: '👨‍👩‍👧‍👦',
    colors: {
      primary: '#2C3E50',
      secondary: '#ECF0F1',
      accent: '#B8860B',
      background: '#FFFFFF',
      text: '#2C3E50',
    },
    fonts: {
      heading: 'Noto Serif KR',
      body: 'Noto Sans KR',
    },
    features: ['가족 서사 중심', '정중한 톤', '클래식 레이아웃', '스토리 초안 작성'],
    sections: [
      { id: 'opening', title: '오프닝', aiGenerated: false },
      { id: 'groom-story', title: '신랑 이야기', aiGenerated: true },
      { id: 'bride-story', title: '신부 이야기', aiGenerated: true },
      { id: 'our-meeting', title: '두 사람의 만남', aiGenerated: true },
      { id: 'parents-message', title: '부모님 마음', aiGenerated: true, optional: true },
      { id: 'invitation', title: '초대 인사', aiGenerated: false },
      { id: 'details', title: '예식 정보', aiGenerated: false },
      { id: 'family-intro', title: '가족 소개', aiGenerated: false, optional: true },
      { id: 'closing', title: '클로징', aiGenerated: false },
    ],
  },
  {
    id: 'narrative-parents',
    name: 'PARENTS',
    description: '부모의 시선으로 전하는 초대',
    thumbnail: '/templates/narrative-parents.jpg',
    defaultCoverImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',  // 클래식 웨딩 이미지
    narrativeType: 'parents',
    emoji: '🎎',
    colors: {
      primary: '#722F37',
      secondary: '#F5F0EB',
      accent: '#C9A962',
      background: '#FFFEF8',
      text: '#1A1A1A',
    },
    fonts: {
      heading: 'Noto Serif KR',
      body: 'Pretendard',
    },
    features: ['혼주 시점', '봉투 오프닝', '버건디 테마', '타임라인'],
    sections: [
      { id: 'envelope', title: '봉투', aiGenerated: false },
      { id: 'greeting', title: '인사말', aiGenerated: true },
      { id: 'timeline', title: '타임라인', aiGenerated: false },
      { id: 'gallery', title: '갤러리', aiGenerated: false },
      { id: 'date', title: '날짜', aiGenerated: false },
      { id: 'venue', title: '예식장', aiGenerated: false },
      { id: 'wedding-info', title: '결혼식 안내', aiGenerated: false, optional: true },
      { id: 'account', title: '마음 전하실 곳', aiGenerated: false },
      { id: 'share', title: '공유하기', aiGenerated: false },
      { id: 'rsvp', title: '참석 의사', aiGenerated: false },
    ],
  },
  {
    id: 'narrative-magazine',
    name: 'MAGAZINE',
    description: '매거진 인터뷰로 전하는 우리의 이야기',
    thumbnail: '/templates/narrative-magazine.jpg',
    defaultCoverImage: '/images/our-cover.png',
    narrativeType: 'magazine',
    emoji: '📰',
    colors: {
      primary: '#1A1A1A',
      secondary: '#F2F2F2',
      accent: '#C8102E',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Pretendard',
    },
    features: ['매거진 레이아웃', '인터뷰 형식', '트렌디한 타이포', '에디토리얼 감성'],
    sections: [
      { id: 'cover', title: '매거진 커버', aiGenerated: false },
      { id: 'editors-note', title: '에디터스 노트', aiGenerated: false },
      { id: 'feature-interview', title: '피처 인터뷰', aiGenerated: true },
      { id: 'photo-spread', title: '포토 스프레드', aiGenerated: false },
      { id: 'the-details', title: '웨딩 디테일', aiGenerated: false },
      { id: 'closing', title: '클로징', aiGenerated: false },
    ],
  },
  {
    id: 'narrative-film',
    name: 'MOVIE',
    description: '한 편의 영화처럼 펼쳐지는 시네마틱 청첩장',
    thumbnail: '/templates/narrative-film.jpg',
    defaultCoverImage: '',
    narrativeType: 'film',
    emoji: '🎬',
    colors: {
      primary: '#E8E4DF',
      secondary: '#2C2C2E',
      accent: '#B8977E',
      background: '#1C1C1E',
      text: '#E8E4DF',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Pretendard',
    },
    features: ['시네마틱 연출', '챕터별 스토리텔링', '다크 테마', '크레딧 엔딩'],
    sections: [
      { id: 'poster', title: '포스터 커버', aiGenerated: false },
      { id: 'chapter-1', title: '첫 만남', aiGenerated: true },
      { id: 'chapter-2', title: '우리의 이야기', aiGenerated: true },
      { id: 'chapter-3', title: '약속', aiGenerated: false },
      { id: 'premiere', title: '예식 정보', aiGenerated: false },
      { id: 'credits', title: '크레딧', aiGenerated: false },
    ],
  },
  {
    id: 'narrative-record',
    name: 'RECORD',
    description: '비닐 레코드처럼 펼쳐지는 음악 앨범 청첩장',
    thumbnail: '/templates/narrative-record.jpg',
    defaultCoverImage: '/images/our-cover.png',
    narrativeType: 'record',
    emoji: '🎵',
    colors: {
      primary: '#E89B8F',
      secondary: '#F5F1ED',
      accent: '#D4766A',
      background: '#FAF7F4',
      text: '#3D3D3D',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Pretendard',
    },
    features: ['비닐 레코드 애니메이션', '트랙 카드 시스템', '코랄 핑크 테마', '앨범 재킷 갤러리'],
    sections: [
      { id: 'vinyl-cover', title: '레코드 커버', aiGenerated: false },
      { id: 'track-01', title: 'The Beginning', aiGenerated: false },
      { id: 'track-02', title: 'The Couple', aiGenerated: false },
      { id: 'track-03', title: 'Our Journey', aiGenerated: true },
      { id: 'track-04', title: 'Gallery', aiGenerated: false },
      { id: 'track-05', title: 'The Wedding Day', aiGenerated: false },
      { id: 'bonus-track', title: 'Liner Notes', aiGenerated: false },
    ],
  },
  {
    id: 'narrative-exhibit',
    name: 'FEED',
    description: '미니스토리형 포토 청첩장 · 리허설 촬영을 여러 번 한 커플에게 추천',
    thumbnail: '/templates/narrative-exhibit.jpg',
    defaultCoverImage: '/images/our-cover.png',
    narrativeType: 'exhibit',
    emoji: '🖼️',
    colors: {
      primary: '#1D1D1F',
      secondary: '#F5F5F7',
      accent: '#86868B',
      background: '#FFFFFF',
      text: '#1D1D1F',
    },
    fonts: {
      heading: 'Pretendard',
      body: 'Pretendard',
    },
    features: ['인스타그램 UI', '3열 포토 그리드', '촬영 컨셉별 하이라이트', '러브스토리 게시글'],
    sections: [
      { id: 'cover', title: '커버', aiGenerated: false },
      { id: 'room-01', title: 'Room 01', aiGenerated: false },
      { id: 'room-02', title: 'Room 02', aiGenerated: false },
      { id: 'room-03', title: 'Room 03', aiGenerated: false },
      { id: 'room-04', title: 'Room 04', aiGenerated: false },
      { id: 'greeting', title: '인사말', aiGenerated: false },
      { id: 'details', title: '예식 정보', aiGenerated: false },
    ],
  },
  {
    id: 'narrative-essay',
    name: 'ESSAY',
    description: '사진 없이도 빛나는, 에세이 같은 청첩장',
    thumbnail: '/templates/narrative-essay.jpg',
    defaultCoverImage: '',
    narrativeType: 'essay',
    emoji: '✍️',
    colors: {
      primary: '#5C4A3A',
      secondary: '#F5F0E8',
      accent: '#8B7355',
      background: '#FAF8F3',
      text: '#3D3028',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Pretendard',
    },
    features: ['사진 없이 완성', '타이포그래피 중심', '스크롤 애니메이션', '러브스토리/인터뷰 선택'],
    sections: [
      { id: 'cover', title: '커버', aiGenerated: false },
      { id: 'greeting', title: '초대 글귀', aiGenerated: false },
      { id: 'story', title: '이야기', aiGenerated: false },
      { id: 'quote', title: '인용문', aiGenerated: false },
      { id: 'details', title: '예식 정보', aiGenerated: false },
      { id: 'closing', title: '감사 인사', aiGenerated: false },
    ],
  },
  {
    id: 'narrative-the-simple',
    name: 'THE SIMPLE',
    description: '가장 일반적이면서도 특별한, 세련된 더심플 컨셉',
    thumbnail: '/templates/narrative-the-simple.jpg',
    defaultCoverImage: '',
    narrativeType: 'the-simple',
    emoji: '✦',
    colors: {
      primary: '#1a1a1a',
      secondary: '#fbfaf7',
      accent: '#a38d6d',
      background: '#fbfaf7',
      text: '#1a1a1a',
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Pretendard',
    },
    features: ['에디토리얼 타이포', 'UI 대안 5~12개', '섹션 순서 커스텀', '구분선 12종'],
    sections: [
      { id: 'intro', title: '인트로', aiGenerated: false },
      { id: 'greeting', title: '인사말', aiGenerated: false },
      { id: 'couple', title: '커플 소개', aiGenerated: false },
      { id: 'info', title: '예식 정보', aiGenerated: false },
      { id: 'direction', title: '오시는 길', aiGenerated: false },
      { id: 'interview', title: '인터뷰', aiGenerated: false },
      { id: 'gallery', title: '갤러리', aiGenerated: false },
      { id: 'guide', title: '결혼식 안내', aiGenerated: false, optional: true },
      { id: 'account', title: '마음 전하실 곳', aiGenerated: false, optional: true },
      { id: 'rsvp', title: '참석 의사', aiGenerated: false, optional: true },
      { id: 'guestbook', title: '방명록', aiGenerated: false, optional: true },
      { id: 'thanks', title: '감사 인사', aiGenerated: false, optional: true },
    ],
  },
  {
    id: 'narrative-thankyou',
    name: 'THANKS',
    description: '결혼식 후 감사의 마음을 전하는 모바일 감사장',
    thumbnail: '/templates/narrative-thankyou.jpg',
    defaultCoverImage: '/samples/parents/1.png',
    narrativeType: 'thankyou',
    emoji: '💌',
    colors: {
      primary: '#2C2C2C',
      secondary: '#F5F3EF',
      accent: '#7A7570',
      background: '#F5F3EF',
      text: '#2C2C2C',
    },
    fonts: {
      heading: 'Noto Sans KR',
      body: 'Noto Sans KR',
    },
    features: ['스크롤 애니메이션', '폴라로이드 사진', '커튼 연출', '감사 메시지'],
    sections: [
      { id: 'intro', title: '인트로', aiGenerated: false },
      { id: 'photos', title: '사진', aiGenerated: false },
      { id: 'closing', title: '감사인사', aiGenerated: false },
    ],
  },
]

export function getTemplateById(id: string): Template | undefined {
  return templates.find((template) => template.id === id)
}

export function getTemplateByNarrativeType(narrativeType: NarrativeType): Template | undefined {
  return templates.find((template) => template.narrativeType === narrativeType)
}

export function getOurTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'our')!
}

export function getFamilyTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'family')!
}

export function getParentsTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'parents')!
}

export function getMagazineTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'magazine')!
}

export function getFilmTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'film')!
}

export function getRecordTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'record')!
}

export function getExhibitTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'exhibit')!
}

export function getEssayTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'essay')!
}

export function getThankYouTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'thankyou')!
}

export function getTheSimpleTemplate(): Template {
  return templates.find((template) => template.narrativeType === 'the-simple')!
}
