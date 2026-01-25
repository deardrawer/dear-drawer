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
    url: '/samples/parents/wedding-bgm.mp3',
    duration: '3:30',
  },
  // 추후 추가될 BGM들
  // {
  //   id: 'romantic-piano',
  //   name: '로맨틱 피아노',
  //   description: '잔잔한 피아노 멜로디',
  //   url: '/audio/romantic-piano.mp3',
  //   duration: '4:15',
  // },
]

export function getBgmPresetById(id: string): BgmPreset | undefined {
  return bgmPresets.find((preset) => preset.id === id)
}

export function getBgmPresetByUrl(url: string): BgmPreset | undefined {
  return bgmPresets.find((preset) => preset.url === url)
}
