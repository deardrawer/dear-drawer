export type NarrativeType = 'our' | 'family'

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
    description: '커플의 서사가 중심이 되는 청첩장입니다. 두 사람이 어떻게 만나고, 어떤 시간을 지나 결혼을 결심하게 되었는지를 담습니다.',
    thumbnail: '/templates/narrative-our.jpg',
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
      heading: 'Gowun Batang',
      body: 'Pretendard',
    },
    features: ['커플 서사 중심', '감성적 톤', '에디토리얼 레이아웃', 'AI 스토리 생성'],
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
    description: '가족의 서사가 함께하는 청첩장입니다. 신랑신부 각각의 성장 배경과 부모님의 마음, 가족이 되어가는 의미를 담습니다.',
    thumbnail: '/templates/narrative-family.jpg',
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
    features: ['가족 서사 중심', '정중한 톤', '클래식 레이아웃', 'AI 스토리 생성'],
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
