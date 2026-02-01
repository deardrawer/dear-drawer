// BGM 프리셋 목록
export interface BgmPreset {
  id: string
  name: string
  description: string
  url: string
  duration?: string // 예: "3:45"
  artist?: string
}

export const bgmPresets: BgmPreset[] = [
  {
    id: 'wedding-classic',
    name: '웨딩 클래식',
    description: '따뜻하고 로맨틱한 피아노 선율',
    url: '/audio/wedding-bgm.mp3',
    artist: 'Wedding BGM',
  },
  {
    id: 'arms-of-heaven',
    name: '천상의 품',
    description: '감동적인 피아노 멜로디',
    url: '/audio/Arms of Heaven - Aakash Gandhi.mp3',
    artist: 'Aakash Gandhi',
  },
  {
    id: 'back-to-portland',
    name: '여행의 시작',
    description: '설레는 새 출발의 느낌',
    url: '/audio/Back To Portland - TrackTribe.mp3',
    artist: 'TrackTribe',
  },
  {
    id: 'beneath-moonlight',
    name: '달빛 아래서',
    description: '로맨틱한 밤의 분위기',
    url: '/audio/Beneath the Moonlight - Aaron Kenny.mp3',
    artist: 'Aaron Kenny',
  },
  {
    id: 'forever-yours',
    name: '영원히 당신의',
    description: '진심을 담은 사랑 고백',
    url: '/audio/Forever Yours - Wayne Jones.mp3',
    artist: 'Wayne Jones',
  },
  {
    id: 'marigold',
    name: '금잔화',
    description: '따스하고 포근한 멜로디',
    url: '/audio/Marigold - Quincas Moreira.mp3',
    artist: 'Quincas Moreira',
  },
  {
    id: 'natural-endless-love',
    name: '끝없는 사랑',
    description: '자연스럽고 편안한 선율',
    url: '/audio/Natural - Endless Love.mp3',
    artist: 'Endless Love',
  },
  {
    id: 'sunday-drive',
    name: '일요일 드라이브',
    description: '여유롭고 행복한 순간',
    url: '/audio/Sunday Drive - Silent Partner.mp3',
    artist: 'Silent Partner',
  },
]

export function getBgmPresetById(id: string): BgmPreset | undefined {
  return bgmPresets.find((preset) => preset.id === id)
}

export function getBgmPresetByUrl(url: string): BgmPreset | undefined {
  return bgmPresets.find((preset) => preset.url === url)
}
