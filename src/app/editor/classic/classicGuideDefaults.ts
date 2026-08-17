import type { ClassicPhoto } from './ClassicPhotoField'

export interface ClassicGuideItem {
  title: string
  body: string
  enabled: boolean
  photo?: ClassicPhoto
}

/** PARENTS 방식 결혼식 안내 기본 항목 + 기본 멘트 (기본 비활성, 토글로 켜서 사용) */
export const CLASSIC_GUIDE_DEFAULTS: ClassicGuideItem[] = [
  {
    title: '꽃 답례품 안내',
    body: '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.',
    enabled: false,
  },
  {
    title: '화환 안내',
    body: '축하의 마음만으로도 충분히 감사하여\n화환은 정중히 사양하고자 합니다.\n따뜻한 마음으로 축복해주시면 감사하겠습니다.',
    enabled: false,
  },
  {
    title: '화동 안내',
    body: '예식을 빛내줄 화동을 모집합니다.\n참여를 원하시면 미리 연락 부탁드립니다.',
    enabled: false,
  },
  {
    title: '피로연 안내',
    body: '예식 후 피로연이 마련되어 있습니다.\n함께 자리해 주시면 감사하겠습니다.',
    enabled: false,
  },
  {
    title: '포토부스 안내',
    body: '포토부스가 준비되어 있습니다.\n예쁜 순간을 자유롭게 남겨가세요.',
    enabled: false,
  },
  {
    title: '셔틀버스 운행',
    body: '예식장까지 셔틀버스를 운행합니다.\n출발 시간과 위치는 아래를 참고해 주세요.',
    enabled: false,
  },
]
