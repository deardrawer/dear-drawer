// 인트로 스타일 카탈로그 — 에디터의 스타일 카드와 스타일별 설정 폼이 이 목록을 그대로 그린다.
// 시네마틱은 기존 IntroSettings 필드를 쓰고, 나머지는 intro.styleOptions[스타일id]에 저장한다.
import { SKY_CITIES } from './skyMap'
import type { IntroPresetId, IntroStyleId } from './introPresets'

/** when: 다른 옵션 값이 이 중 하나일 때만 에디터에 보인다 (예: 열린 뒤 문구가 '영문 손글씨형'일 때만) */
export type FieldCond = { when?: { key: string; is: string[] }; /** 같은 이름끼리 에디터에서 한 묶음(섹션)으로 보인다 */ section?: string }
export type IntroOptionField = FieldCond & (
  | { type: 'text'; key: string; label: string; maxLength: number; placeholder?: string; help?: string }
  /** latinOnly: 영문·숫자·기호만 입력 (한글은 걸러낸다) */
  | { type: 'lines'; key: string; label: string; maxLines: number; maxPerLine: number; placeholder?: string; help?: string; latinOnly?: boolean }
  /** auto: 비워두면 자동으로 정해지는 색 — 그 선택지의 이름 */
  | { type: 'color'; key: string; label: string; swatches: string[]; auto?: string; help?: string }
  /** under: 이 사진 필드 바로 아래에 붙여 보여준다 (예: 앞면 사진 색감) */
  | { type: 'choice'; key: string; label: string; choices: { value: string; label: string }[]; help?: string; under?: string }
  /** aspect: 화면에 보이는 가로/세로 비율 (크롭 편집기 비율), fallback: 비워뒀을 때 쓰는 사진 */
  /** defaultSrc: 비워뒀을 때 쓰는 기본 이미지 (fallback 대신) */
  | { type: 'photo'; key: string; label: string; aspect: number; fallback?: PhotoFallback; defaultSrc?: string; help?: string }
  /** 날짜(YYYY-MM-DD)·시각(HH:MM) 입력 */
  | { type: 'date' | 'time'; key: string; label: string; help?: string }
)

export type PhotoFallback = 'photo' | 'gallery0' | 'gallery1'

// 사진이 열리는 인트로: 열린 뒤 같은 문구 스타일(revealFields)을 쓴다 / 디자인 인트로: 인트로마다 고유한 완성 화면
export type IntroStyleGroup = '기본' | '사진이 열리는 인트로' | '디자인 인트로'

export interface IntroStyleMeta {
  id: IntroPresetId
  name: string
  group: IntroStyleGroup
  /** 하객이 하는 일 (스타일 카드에 한 줄) */
  action: string
  /** 화면 흐름 (설정 상단 안내) */
  flow: string
  /** 구현 완료 여부 — false면 에디터에 노출하지 않는다 */
  ready: boolean
  fields: IntroOptionField[]
  defaults: Record<string, unknown>
  /** 노웨딩(날짜·장소 모두 숨김)일 때 바뀌는 기본 문구 — 사용자가 직접 고친 값은 그대로 둔다 */
  noWedding?: Record<string, unknown>
  /** '기본 문구 언어: 한글'일 때 쓰는 기본 문구 */
  koDefaults?: Record<string, unknown>
}

// 이름 글꼴 6종 (시네마틱과 같은 한글 글꼴) — 두 장의 사진·라벨 문구
const NAME_FONT_CHOICES = [{ value: 'pretendard', label: '프리텐다드' }, { value: 'notoserif', label: '노토 세리프' }, { value: 'myeongjo', label: '나눔명조' }, { value: 'nanumgothic', label: '나눔고딕' }, { value: 'gowun', label: '고운바탕' }, { value: 'handwriting', label: '손글씨(폴페어니스)' }]
/** 엽서 앞면·배경 기본 사진 */
export const POSTCARD_DEFAULT_PHOTO = '/images/intro/postcard-default.jpg'
// 두 장의 사진 기본 사진 (두 사람의 어린 시절 느낌)
export const PIECES_GROOM_DEFAULT = '/images/intro/pieces-groom-default.jpg'
export const PIECES_BRIDE_DEFAULT = '/images/intro/pieces-bride-default.jpg'
const POINT_SWATCHES = ['#F2B53A', '#F190AC', '#A8C1D7', '#8FA98B', '#C9A27E', '#1F1F1F']
const BG_SWATCHES = ['#EDEBE7', '#FFFFFF', '#F6F1E7', '#F3E6E8', '#E6ECF1', '#2B2A28']


/** 사진이 화면을 채운 뒤 그 위 글자 (트레이싱지·포스터 봉투·타자 오프닝·불투명 유리 공용) */
function revealFields(withPoster = false): IntroOptionField[] {
  return [
      { type: 'choice', key: 'content', label: '열린 뒤 사진 위 문구', choices: [...(withPoster ? [{ value: 'poster', label: '포스터형' }] : []), { value: 'names', label: '스토리형' }, { value: 'monogram', label: '모노그램형' }, { value: 'editorial', label: '영문 손글씨형' }, { value: 'invite', label: '초대 문구' }], help: (withPoster ? '포스터형: 큰 제목 · 초대 문구 · 날짜 · 장소 / ' : '') + '스토리형: THE STORY OF · 이름 · 날짜 / 모노그램형: 이니셜 엠블럼 · 이름 · 날짜 / 영문 손글씨형: 서명체 영문 2줄 (영문 이름 또는 직접 쓴 문구)' },
      { type: 'text', key: 'monoInitials', label: '이니셜 (모노그램형)', maxLength: 3, placeholder: '비워두면 영문 이름 첫 글자', help: '알파벳만 써져요 · 예: JS', when: { key: 'content', is: ['monogram'] } },
      { type: 'text', key: 'storyLabel', label: '이름 위 작은 문구 (스토리형)', maxLength: 20, placeholder: 'THE STORY OF', when: { key: 'content', is: ['names'] } },
      { type: 'text', key: 'storySub', label: '이름 아래 문구 (스토리형)', maxLength: 30, placeholder: '비워두면 날짜 · 예: At the November Garden', help: '적으면 날짜 대신 우아한 세리프 문장으로 나와요', when: { key: 'content', is: ['names'] } },
      { type: 'choice', key: 'storyFont', label: '영문 이름 글꼴 (스토리형)', choices: [{ value: 'pinyon', label: 'Pinyon Script' }, { value: 'delafield', label: 'Mrs Saint Delafield' }, { value: 'sacramento', label: 'Sacramento' }, { value: 'muellerhoff', label: 'Herr Von Muellerhoff' }, { value: 'doulaise', label: 'Monsieur La Doulaise' }], help: '영문 이름일 때 적용돼요', when: { key: 'content', is: ['names'] } },
      { type: 'text', key: 'edCaption', label: '서명체 아래 문구 (영문 손글씨형)', maxLength: 30, placeholder: '소중한 분들을 초대합니다', help: '서명체 아래에 작게 나와요 · 한글·영문 모두 가능', when: { key: 'content', is: ['editorial'] } },
      { type: 'choice', key: 'edFont', label: '서명체 글꼴 (영문 손글씨형)', choices: [{ value: 'delafield', label: 'Mrs Saint Delafield' }, { value: 'sacramento', label: 'Sacramento' }, { value: 'muellerhoff', label: 'Herr Von Muellerhoff' }, { value: 'doulaise', label: 'Monsieur La Doulaise' }], when: { key: 'content', is: ['editorial'] } },
      { type: 'choice', key: 'edTail', label: '서명체 꼬리선 (영문 손글씨형)', choices: [{ value: 'both', label: '양쪽' }, { value: 'r', label: '오른쪽만' }, { value: 'none', label: '없음' }], help: '화면 밖에서 이어지는 선 · 글꼴에 따라 어울리는 걸 골라보세요', when: { key: 'content', is: ['editorial'] } },
      { type: 'lines', key: 'editorialText', label: '서명체 문구 (영문 손글씨형)', maxLines: 2, maxPerLine: 14, latinOnly: true, placeholder: 'Save\nthe date', help: '영문 2줄을 서명체로 써요 · 비워두면 두 사람 영문 이름이 써져요 (대소문자는 적은 그대로)', when: { key: 'content', is: ['editorial'] } },
      { type: 'lines', key: 'inviteText', label: '초대 문구', maxLines: 2, maxPerLine: 20, placeholder: '소중한 당신을 초대합니다', when: { key: 'content', is: withPoster ? ['invite', 'poster'] : ['invite'] } },
  ]
}
const REVEAL_DEFAULTS = { edFont: 'delafield', storyLabel: 'THE STORY OF', inviteText: '소중한 당신을 초대합니다' }
const REVEAL_NO_WEDDING = { inviteText: '저희의 결혼 소식을 전합니다', edCaption: '저희의 결혼 소식을 전합니다' }

export const introStyles: IntroStyleMeta[] = [
  {
    id: 'cinematic', name: '시네마틱', group: '기본',
    action: '영화 오프닝처럼 자동으로 재생돼요',
    flow: '인트로 → 커버 → 초대글',
    ready: true, fields: [], defaults: {},
  },
  {
    id: 'blur', name: '포커스', group: '기본',
    action: '흐릿한 사진이 선명해지며 문구가 떠올라요',
    flow: '인트로 → 커버 → 초대글',
    ready: true, fields: [], defaults: {},
  },
  {
    id: 'vellum', name: '트레이싱지', group: '사진이 열리는 인트로',
    action: '이름 테이프를 떼면 종이가 위아래로 열려요',
    flow: '인트로(테이프 떼기 → 사진) → 초대글',
    ready: true,
    fields: [
      { type: 'choice', key: 'tone', label: '색감', under: 'photo', choices: [{ value: 'color', label: '컬러' }, { value: 'mono', label: '흑백' }] },
      { type: 'photo', key: 'photo', label: '사진', aspect: 9 / 16, help: '화면 전체에 깔리고 트레이싱지가 그 위를 덮어요 · 비워두면 대표 사진' },
      { type: 'text', key: 'tagMain', label: '스티커 큰 줄', maxLength: 24, placeholder: '비워두면 두 사람 이름', help: '이름 테이프에 크게 써지는 문구 · 영문이면 손글씨체, 한글이면 명조' },
      { type: 'text', key: 'tagSub', label: '스티커 작은 줄', maxLength: 32, placeholder: '비워두면 날짜' },
      ...revealFields(),
    ],
    defaults: { content: 'invite', tone: 'color', edFont: 'delafield', storyLabel: 'THE STORY OF', inviteText: '소중한 당신을 초대합니다' },
    noWedding: { inviteText: '저희의 결혼 소식을 전합니다', edCaption: '저희의 결혼 소식을 전합니다' },
  },
  {
    id: 'envelope', name: '포스터 봉투', group: '사진이 열리는 인트로',
    action: '봉투의 절취선 띠를 뜯으면 사진이 나와요',
    flow: '인트로(띠 뜯기 → 사진) → 초대글',
    ready: true,
    fields: [
      { type: 'photo', key: 'photo', label: '사진', aspect: 9 / 16, help: '비워두면 대표 사진을 써요' },
      { type: 'text', key: 'posterTitle', label: '포스터 제목', maxLength: 28, placeholder: '비워두면 두 사람 이름', help: '봉투와 열린 뒤 포스터형 화면에 크게 써져요 · 예: SAVE THE DATE' },
      ...revealFields(true),
      { type: 'text', key: 'tagline', label: '태그라인', maxLength: 32, placeholder: 'We’re connected through love', help: '띠를 뜯은 자리의 사진 위에 영화 포스터처럼 나타나요' },
      { type: 'color', key: 'color', label: '봉투 색', swatches: ['#FFFFFF', '#533C2E', '#F6EDC4', '#D7CABA', '#80836E', '#C9DFEA', '#F7E0E6'], help: '봉투 아래 이름과 예식 정보는 자동으로 들어가요' },
    ],
    defaults: { color: '#FFFFFF', tagline: 'We’re connected through love', content: 'poster', posterTitle: '', edFont: 'delafield', storyLabel: 'THE STORY OF', inviteText: '소중한 당신을 초대합니다' },
    noWedding: { inviteText: '저희의 결혼 소식을 전합니다', edCaption: '저희의 결혼 소식을 전합니다' },
  },
  {
    id: 'postcard', name: '엽서', group: '디자인 인트로',
    action: '엽서를 옆으로 넘기면 손글씨 메모가 써져요',
    flow: '인트로(엽서 넘기기 → 손글씨) → 초대글',
    ready: true,
    fields: [
      { type: 'photo', key: 'frontPhoto', label: '앞면 사진', aspect: 1.47, defaultSrc: POSTCARD_DEFAULT_PHOTO, help: '비워두면 기본 사진' },
      { type: 'photo', key: 'backPhoto', label: '뒷면 사진', aspect: 0.735, fallback: 'gallery0', help: '뒷면 왼쪽 절반을 채워요 · 비워두면 갤러리 첫 사진' },
      { type: 'photo', key: 'bgPhoto', label: '배경 사진', aspect: 9 / 16, defaultSrc: POSTCARD_DEFAULT_PHOTO, help: '부드러운 필름 필터가 자동으로 씌워져요 · 비워두면 기본 사진' },
      { type: 'lines', key: 'note', label: '손글씨 메모', maxLines: 6, maxPerLine: 12, placeholder: '서로 다른 계절을\n걸어온 우리가\n같은 길을\n걷기로 했어요.' },
      { type: 'text', key: 'sign', label: '서명', maxLength: 14, placeholder: '비워두면 지훈이랑 서연', help: '메모 마지막 줄에 작게 붙어요 · 비워두면 두 사람 이름이 들어가요' },
      { type: 'choice', key: 'hand', label: '손글씨', choices: [{ value: 'adult', label: '어른 글씨' }, { value: 'kid', label: '아이 글씨' }] },
      { type: 'choice', key: 'frontTone', label: '색감', under: 'frontPhoto', choices: [{ value: 'mono', label: '흑백' }, { value: 'color', label: '컬러' }] },
    ],
    defaults: { hand: 'kid', frontTone: 'mono', sign: '', note: '소중한 분들을\n초대합니다!' },
    noWedding: { note: '소중한 분들께\n소식을 전해요!' },
  },
  {
    id: 'pieces', name: '두 장의 사진', group: '디자인 인트로',
    action: '두 사람의 사진을 서로 붙이면 한 장이 돼요',
    flow: '인트로(초대 문구) → 초대글',
    ready: true,
    fields: [
      { type: 'photo', key: 'groomPhoto', label: '신랑 사진', aspect: 3 / 4, defaultSrc: PIECES_GROOM_DEFAULT, help: '비워두면 기본 사진' },
      { type: 'photo', key: 'bridePhoto', label: '신부 사진', aspect: 3 / 4, defaultSrc: PIECES_BRIDE_DEFAULT, help: '비워두면 기본 사진' },
      { type: 'photo', key: 'couplePhoto', label: '함께 찍은 가로 사진', aspect: 1.5, help: '두 장이 붙은 뒤 이 사진으로 바뀌어요' },
      { type: 'color', key: 'background', label: '배경 색', swatches: ['#FFFFFF', '#F6F1E7', '#F3ECE6', '#EEF1F4', '#E9EEE6', '#2B2A28'] },
      { type: 'choice', key: 'paper', label: '종이 질감', choices: [{ value: 'on', label: '켜기' }, { value: 'off', label: '끄기' }], help: '배경 색 위에 은은한 종이 결을 깔아요' },
      { type: 'lines', key: 'invite', label: '초대 문구', maxLines: 3, maxPerLine: 20, help: '두 사진이 합쳐진 뒤 이름 아래 한 줄씩 나타나요' },
      { type: 'choice', key: 'font', label: '이름 글꼴', help: '이름에만 적용되고, 나머지 글자는 깔끔한 고딕으로 나와요', choices: NAME_FONT_CHOICES },
    ],
    defaults: { background: '#FFFFFF', paper: 'on', font: 'pretendard', invite: '따로 걷던 두 사람이\n이제 한 걸음으로 걸어가려 합니다.\n그 시작에 당신을 초대합니다.' },
    noWedding: { invite: '따로 걷던 두 사람이\n이제 한 걸음으로 걸어가려 합니다.\n그 시작을 기쁜 마음으로 알립니다.' },
  },
  {
    id: 'typed', name: '타자 오프닝', group: '사진이 열리는 인트로',
    action: '문장이 타자 치듯 써지고 뒤에 사진이 비쳐요',
    flow: '인트로 → 사진 → 초대글',
    ready: true,
    fields: [
      { type: 'choice', key: 'phraseLang', label: '기본 문구 언어', choices: [{ value: 'en', label: '영문' }, { value: 'ko', label: '한글' }], help: '직접 고치지 않은 기본 문구만 바뀌어요' },
      { type: 'lines', key: 'sentence', label: '문장', maxLines: 4, maxPerLine: 24, placeholder: 'We found a love\nthat feels like *home*,', help: '*단어*처럼 별표로 감싸면 기울임(한글은 밑줄)으로 강조돼요 · 영문은 클래식 세리프로 써져요' },
      { type: 'choice', key: 'font', label: '글꼴', choices: [{ value: 'myeongjo', label: '명조' }, { value: 'gothic', label: '고딕' }] },
      { type: 'choice', key: 'speed', label: '타자 속도', choices: [{ value: 'slow', label: '느리게' }, { value: 'normal', label: '보통' }, { value: 'fast', label: '빠르게' }], help: '문장이 길면 너무 오래 걸리지 않게 자동으로 조금 빨라져요' },
      { type: 'photo', key: 'photo', label: '비칠 사진', aspect: 9 / 16, help: '비워두면 대표 사진을 써요' },
      ...revealFields(),
    ],
    defaults: { ...REVEAL_DEFAULTS, content: 'names', speed: 'normal', phraseLang: 'en', sentence: 'We found a love\nthat feels like *home*,\nand we’d like\nyou there.', font: 'myeongjo' },
    koDefaults: { sentence: '서로 다른 계절을\n걸어온 두 사람이\n이제 같은 길을\n걸어가려 합니다.' },
    noWedding: REVEAL_NO_WEDDING,
  },
  {
    id: 'stars', name: '별자리 문장', group: '디자인 인트로',
    action: '결혼식 날의 하늘 위로 두 사람의 문장이 별자리로 이어져요',
    flow: '안내 팝업 → 그날의 하늘 · 별자리 → 초대글',
    ready: true,
    fields: [
      { type: 'lines', key: 'note', label: '시작 안내 팝업', maxLines: 4, maxPerLine: 22, placeholder: '저희가 부부가 되는 날,\n그 시각 하늘에 뜰 별들을 담았어요.\n그 위에 저희의 마음을 이어 그렸습니다.', help: "인트로가 시작되기 전 작은 카드에 먼저 떠요 · 비워두면 예식 전엔 '뜰 별들', 예식이 지나면 '떠 있던 별들'로 알아서 바뀌어요" },
      { type: 'text', key: 'text', label: '별자리 문장', maxLength: 60, placeholder: 'Our love was written in the stars', help: '띄어쓰기마다 별 하나 · 8단어까지 · 한글도 돼요 (예: 같은 하늘 아래 우리 평생을 약속합니다)' },
      { type: 'text', key: 'sign', label: '아래 이름 줄', maxLength: 30, placeholder: '비워두면 두 사람 이름', help: '별이 다 이어지면 날짜 위에 나와요 (예: 지훈 ♥ 서연, Our Wedding Day)' },
      { type: 'choice', key: 'sky', label: '배경 하늘', section: '그날의 하늘', choices: [{ value: 'on', label: '그날의 실제 하늘' }, { value: 'off', label: '끄기' }], help: '그날·그 시각에 그 자리 위에 뜨는 실제 별들이 둥근 별지도로 그려져요 (낮이어도 그 순간 별의 자리 그대로)' },
      { type: 'choice', key: 'skyDate', label: '어느 날의 하늘', section: '그날의 하늘', when: { key: 'sky', is: ['on'] }, choices: [{ value: 'wedding', label: '예식 그 시각' }, { value: 'ours', label: '우리의 날' }], help: '우리의 날: 사귄 날·처음 만난 날·프러포즈한 날처럼 두 사람만의 날 · 노웨딩이면 우리의 날이 기본이에요' },
      { type: 'choice', key: 'city', label: '예식장 지역', section: '그날의 하늘', when: { key: 'skyDate', is: ['wedding'] }, choices: [{ value: '', label: '자동 · 예식장 주소에서 찾기' }, ...SKY_CITIES.filter((c) => !c.detail).map((c) => ({ value: c.id, label: c.label }))], help: '자동: 예식장 주소 앞부분(서울특별시 등)으로 찾고, 못 찾으면 서울이에요' },
      { type: 'date', key: 'ourDate', label: '날짜', section: '그날의 하늘', when: { key: 'skyDate', is: ['ours'] }, help: '비워두면 별지도 없이 나와요' },
      { type: 'time', key: 'ourTime', label: '시각', section: '그날의 하늘', when: { key: 'skyDate', is: ['ours'] }, help: '기본은 밤 9시 — 그날 밤하늘이 그려져요' },
      { type: 'choice', key: 'ourCity', label: '지역', section: '그날의 하늘', when: { key: 'skyDate', is: ['ours'] }, choices: SKY_CITIES.map((c) => ({ value: c.id, label: c.label })), help: '그날 두 사람이 있던 곳 — 별 위치와 아래 좌표가 이 지역 기준이 돼요' },
      { type: 'text', key: 'ourPlace', label: '장소 이름 (영문)', section: '그날의 하늘', maxLength: 24, placeholder: '비워두면 지역 이름 (예: SEOUL)', when: { key: 'skyDate', is: ['ours'] }, help: '좌표 앞에 붙어요 · 예: HAN RIVER, SEOUL' },
      { type: 'text', key: 'ourLabel', label: '이 날의 이름 (팝업)', section: '그날의 하늘', maxLength: 16, placeholder: '처음 만난 날', when: { key: 'skyDate', is: ['ours'] }, help: "팝업에 '저희가 ○○○,' 로 들어가요 (예: 연인이 된 날)" },
      { type: 'text', key: 'ourCredit', label: '이 날의 이름 (크레딧)', section: '그날의 하늘', maxLength: 24, placeholder: 'THE NIGHT WE MET', when: { key: 'skyDate', is: ['ours'] }, help: '별자리 아래 날짜 앞에 붙어요 (예: THE DAY WE BEGAN)' },
      { type: 'color', key: 'bg', label: '배경색', swatches: ['#F4D9DE', '#DCD3EE', '#C9DFEA', '#F8DCCB', '#F6EDC4', '#D3E8DD', '#1E2A44'] },
      { type: 'color', key: 'ink', label: '포인트 색 (별·선·글자)', swatches: ['#7A3B45', '#5B3328', '#3D4A7A', '#7B5EA7', '#B8925A', '#FFFFFF'] },
    ],
    defaults: { note: '', text: 'Our love was written in the stars', sign: '', sky: 'on', skyDate: 'wedding', ourDate: '', ourTime: '21:00', ourCity: 'seoul', ourPlace: '', ourLabel: '', ourCredit: '', city: '', bg: '#F4D9DE', ink: '#7A3B45' },
    noWedding: { skyDate: 'ours' },
  },
  {
    id: 'dots', name: '도트 자수', group: '디자인 인트로',
    action: '점으로 된 이름을 손끝으로 수놓아요',
    flow: '인트로 → 초대글',
    ready: false,
    fields: [
      { type: 'photo', key: 'photo', label: '사진', aspect: 9 / 16, help: '비워두면 대표 사진을 써요' },
      { type: 'choice', key: 'namePosition', label: '이름 위치', choices: [{ value: 'top', label: '위' }, { value: 'bottom', label: '아래' }] },
    ],
    defaults: { namePosition: 'top' },
  },
  {
    id: 'frost', name: '불투명 유리', group: '사진이 열리는 인트로',
    action: '흐린 유리에 하트를 그리면 사진이 드러나요',
    flow: '인트로 → 사진 → 초대글',
    ready: true,
    fields: [
      { type: 'photo', key: 'photo', label: '사진', aspect: 9 / 16, help: '비워두면 대표 사진을 써요' },
      { type: 'lines', key: 'glass', label: '유리에 쓸 문구 (영문)', maxLines: 3, maxPerLine: 12, latinOnly: true, placeholder: 'Jihoon &\nSeoyeon', help: '비워두면 두 사람의 영문 이름이 써져요 (영문 이름이 없으면 기본 문구). 한글은 유리 위에서 읽기 어려워 영문만 쓸 수 있어요' },
      ...revealFields(),
    ],
    defaults: { ...REVEAL_DEFAULTS, content: 'names', glass: '' },
    noWedding: REVEAL_NO_WEDDING,
  },
  {
    id: 'labels', name: '라벨 문구', group: '디자인 인트로',
    action: '사진을 뒤집으면 가장자리에 문장 라벨이 붙어요',
    flow: '인트로(사진 뒤집기 → 라벨) → 초대글',
    ready: true,
    fields: [
      { type: 'photo', key: 'frontPhoto', label: '앞면 사진', aspect: 0.58, fallback: 'gallery0', help: '처음에 보이는 사진 · 비워두면 갤러리 첫 사진 (갤러리가 없으면 대표 사진을 흑백으로)' },
      { type: 'photo', key: 'photo', label: '뒷면 사진', aspect: 0.58, help: '사진을 누르면 뒤집혀 나오는 사진 · 비워두면 대표 사진' },
      { type: 'text', key: 'headLabel', label: '맨 위 작은 문구', maxLength: 20, placeholder: 'THE WEDDING OF' },
      { type: 'text', key: 'headTitle', label: '제목', maxLength: 20, placeholder: '비워두면 두 사람 이름', help: '비워두면 두 사람 이름이 들어가요' },
      { type: 'choice', key: 'font', label: '글꼴', help: '맨 위 제목(이름)과 사진 아래 초대 문구에 적용돼요 · 라벨은 영문 고딕 그대로', choices: NAME_FONT_CHOICES },
      { type: 'choice', key: 'phraseLang', label: '기본 문구 언어', choices: [{ value: 'en', label: '영문' }, { value: 'ko', label: '한글' }], help: '직접 고치지 않은 기본 문구만 바뀌어요' },
      { type: 'lines', key: 'lines', label: '라벨 문구', maxLines: 4, maxPerLine: 14, placeholder: 'NEVER\nTHOUGHT\nI\'D\nFIND YOU' },
      { type: 'text', key: 'invite', label: '사진 아래 초대 문구', maxLength: 18, placeholder: '소중한 당신을 초대합니다!' },
      { type: 'color', key: 'bgColor', label: '배경 색', swatches: BG_SWATCHES },
      { type: 'color', key: 'labelColor', label: '포인트 라벨 색 (마지막 줄)', swatches: POINT_SWATCHES },
      { type: 'choice', key: 'labelTextColor', label: '포인트 라벨 글자 색', choices: [{ value: 'dark', label: '검정' }, { value: 'white', label: '흰색' }] },
    ],
    noWedding: { invite: '저희의 결혼 소식을 전합니다' },
    defaults: { phraseLang: 'en', headLabel: 'THE WEDDING OF', headTitle: '', font: 'gowun', lines: 'NEVER\nTHOUGHT\nI\'D\nFIND YOU', invite: '소중한 당신을 초대합니다!', bgColor: '#EDEBE7', labelColor: '#F2B53A', labelTextColor: 'dark' },
    koDefaults: { lines: '처음 본 순간\n알았어요\n당신이\n내 사람인 걸' },
  },
  {
    id: 'tiles', name: '글자 타일', group: '디자인 인트로',
    action: '흩어진 글자 타일이 날아와 문장이 돼요',
    flow: '인트로 → 초대글',
    ready: true,
    fields: [
      { type: 'photo', key: 'photo', label: '배경 사진', aspect: 9 / 16, help: '처음엔 흑백, 글자가 다 맞춰지면 컬러로 바뀌어요' },
      { type: 'choice', key: 'phraseLang', label: '기본 문구 언어', choices: [{ value: 'en', label: '영문' }, { value: 'ko', label: '한글' }], help: '직접 고치지 않은 기본 문구만 바뀌어요' },
      { type: 'lines', key: 'lines', label: '문구', maxLines: 3, maxPerLine: 7, placeholder: 'WE ARE\nGETTING\nMARRIED' },
      { type: 'text', key: 'caption', label: '마지막 한글 문구', maxLength: 16, placeholder: '저희 결혼합니다', help: '글자가 다 맞춰진 뒤 아래에 나타나요. 그 아래 이름과 날짜는 자동으로 들어가요' },
      { type: 'choice', key: 'captionFont', label: '마지막 문구 글꼴', choices: NAME_FONT_CHOICES },
      { type: 'color', key: 'heartColor', label: '하트 색', swatches: ['#8FABC5', '#F190AC', '#E5484D', '#F2B53A', '#8FA98B', '#C9A27E'] },
    ],
    defaults: { phraseLang: 'en', lines: 'WE ARE\nGETTING\nMARRIED', caption: '저희 결혼합니다', captionFont: 'gowun', heartColor: '#8FABC5' },
    koDefaults: { lines: '우리\n결혼\n합니다', caption: '소중한 분들을 초대합니다' },
  },
  {
    id: 'grid', name: '그리드 포스터', group: '디자인 인트로',
    action: '격자에 문장이 채워지고 컬러 사진으로 바뀌어요',
    flow: '인트로 → 컬러 사진 → 초대글',
    ready: true,
    fields: [
      { type: 'photo', key: 'photo', label: '사진', aspect: 10 / 16, help: '처음엔 흐린 흑백, 다 채워지면 컬러가 돼요' },
      { type: 'text', key: 'title', label: '왼쪽 위 문구', maxLength: 16, placeholder: 'Our Wedding' },
      { type: 'text', key: 'names', label: '오른쪽 위 이름', maxLength: 24, placeholder: '비워두면 두 사람 이름', help: '비워두면 두 사람 이름이 들어가요' },
      { type: 'choice', key: 'phraseLang', label: '기본 문구 언어', choices: [{ value: 'en', label: '영문' }, { value: 'ko', label: '한글' }], help: '직접 고치지 않은 기본 문구만 바뀌어요' },
      { type: 'text', key: 'phrase', label: '메인 문구', maxLength: 30, placeholder: 'We are getting married' },
      { type: 'color', key: 'accentColor', label: '포인트 컬러', swatches: POINT_SWATCHES },
      { type: 'color', key: 'bgColor', label: '배경 색', auto: '포인트에 맞춤', swatches: BG_SWATCHES },
    ],
    defaults: { phraseLang: 'en', title: 'Our Wedding', names: '', phrase: 'We are getting married', accentColor: '#F190AC', bgColor: '' },
    koDefaults: { phrase: '우리 결혼합니다' },
  },
]

export function getIntroStyle(id: IntroPresetId): IntroStyleMeta | undefined {
  return introStyles.find(s => s.id === id)
}

/** 스타일 옵션 = 기본값 위에 사용자가 바꾼 값 */
/** 노웨딩일 때 이 필드의 자동 문구 (없으면 undefined) */
export function noWeddingDefault(id: IntroStyleId, key: string): unknown {
  return getIntroStyle(id)?.noWedding?.[key]
}

/**
 * 스타일 옵션 = 기본값 (노웨딩이면 노웨딩 문구) 위에 사용자가 바꾼 값.
 * 비운 값('')·지운 값(undefined)은 "직접 고치지 않음"으로 보고 기본값을 쓴다.
 */
export function getStyleOptions(id: IntroStyleId, stored?: Partial<Record<IntroStyleId, Record<string, unknown>>>, noWedding = false): Record<string, unknown> {
  const meta = getIntroStyle(id)
  const own = Object.fromEntries(Object.entries(stored?.[id] || {}).filter(([, v]) => v !== undefined && v !== ''))
  const lang = (own.phraseLang ?? meta?.defaults?.phraseLang) === 'ko'
  return { ...(meta?.defaults || {}), ...(lang ? meta?.koDefaults || {} : {}), ...(noWedding ? meta?.noWedding || {} : {}), ...own }
}

/** 사용자가 이 필드를 직접 고쳤는지 */
export function isCustomized(id: IntroStyleId, stored: Partial<Record<IntroStyleId, Record<string, unknown>>> | undefined, key: string) {
  const v = stored?.[id]?.[key]
  return v !== undefined && v !== ''
}
