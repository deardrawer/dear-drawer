import { GRIUN_FONTS } from '@/lib/griunFonts'
import { KOREAN_FONTS } from '@/app/editor/the-simple/fontOptions'
import type { DdayPopupData } from '@/lib/ddayPopupTypes'
/**
 * THE PHONE — 폰 화면 청첩장
 * 잠금화면 → 홈 화면(위젯 격자) → 앱 화면(우리 이야기·사진첩·예식 안내·마음 전하기·참석 회신)
 * 에디터 캔버스와 하객 화면이 같은 렌더러(PhoneScreens)를 쓴다 — 편집한 그대로 보인다.
 */

/** 홈 화면 — 'white' 커스텀(바탕·위젯·포인트·하단 바 색, 바탕 사진을 직접) / 'glass' 사진 위 유리 카드 */
export type PhoneThemeId = 'white' | 'glass'
/** 앱 화면(예식 안내·이야기·마음 전하기…) 형식 — 'invite' 사진+유리 카드 / 'editorial' 홈 위 시트 / 'apps' 폰 기본 앱(메모·메시지·캘린더·지갑·연락처·사진) */
export type PhoneAppStyle = 'invite' | 'editorial' | 'apps'
/** 잠금화면 디자인 — 'photo' 는 사진이 있으면 사진, 없으면 고른 색 바탕. 날짜·시간·이름·장소·열기 버튼은 모두 들어간다 */
export type PhoneLockStyle = 'photo' | 'poster'
export type PhoneTitleFont = 'instrument' | 'cormorant' | 'playfair' | 'bodoni' | 'script' | 'gothic'
export type PhoneNumberFont = 'sans' | 'serif' | 'didone' | 'condensed' | 'mono' | 'instrument'
export type WidgetType = 'dday' | 'clock' | 'calendar' | 'photo' | 'quote' | 'music' | 'todo' | 'guestbook' | 'story' | 'venue' | 'intro' | 'folder' | 'search' | 'letters' | 'app'
/** S 1×1 · M 2×2 · L 4×2 · W 4×1 — 사진은 그 밖의 크기도 (T 1×2 · H 2×1 · P 2×3 · R 3×2 · Q 3×3 · X 4×3) */
export type WidgetSize = 'S' | 'M' | 'L' | 'W' | 'T' | 'H' | 'P' | 'R' | 'Q' | 'X' | 'U'
export type PhoneAppId = 'story' | 'album' | 'memo' | 'gift' | 'rsvp' | 'call' | 'guestbook' | 'intro' | 'video' | 'camera' | 'letter'
/** 커플 소개 — 한 사람 */
export interface IntroPerson {
  photo?: string
  photoCrop?: PhoneImageSettings
  /** 명함 프로필 화면 배경 사진 (비우면 프로필 사진을 흐리게) */
  bg?: string
  bgCrop?: PhoneImageSettings
  bio?: string
  /** 질문 · 답 (MBTI · 생일 · 좋아하는 것 …) */
  items?: { q: string; a: string }[]
}
export type PhoneScreenId = 'lock' | 'home' | PhoneAppId

export interface PhoneImageSettings {
  scale?: number
  positionX?: number
  positionY?: number
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

export interface PhoneWidget {
  id: string
  type: WidgetType
  /** 격자 왼쪽 위 칸 (0부터) */
  col: number
  row: number
  size: WidgetSize
  /** 같은 위젯의 모양 변주 (0, 1, 2 …) */
  variant: number
  /** 홈 몇 번째 장 (0부터, 비우면 첫 장) */
  page?: number
  props: {
    text?: string
    label?: string
    src?: string
    crop?: PhoneImageSettings
    title?: string
    artist?: string
    app?: PhoneAppId
    /** 폴더 — 묶은 앱 (순서대로) */
    apps?: PhoneAppId[]
    /** 폴더 안 앱 — 이름 · 아이콘 사진 바꾸기 */
    appLabels?: Partial<Record<PhoneAppId, string>>
    appIcons?: Partial<Record<PhoneAppId, string>>
    /** 영상 위젯 — 몇 번째 영상 */
    videoIndex?: number
    /** 검색창 — 추천 검색어 (누르면 그 화면) */
    searches?: PhoneSearchItem[]
    /** 검색창 — 추천 검색어를 번갈아 보여 주지 않음 */
    noRotate?: boolean
    /** 사진 위젯 — 누르면 사진첩 열기 */
    openAlbum?: boolean
    /** 할 일 목록 줄 (비우면 예식 정보로 채움) */
    items?: string[]
    /** 글자 정렬 · 세로 위치 (글귀) */
    align?: 'left' | 'center' | 'right'
    valign?: 'top' | 'middle' | 'bottom'
    /** 앱 아이콘 이름 숨기기 */
    hideLabel?: boolean
    /** 앱 아이콘 — 바탕 칸 없이 이미지만 (투명 PNG) */
    noBg?: boolean
    /** 우리 노래 — 실제로 재생할 음악 주소 */
    audio?: string
    /** 사진 기울기 (도) — 폴라로이드 · 스티커 */
    rotate?: number
    /** 바탕 투명 — 칸 없이 글자 · 그림만 홈 바탕 위에 */
    clear?: boolean
    /** 이 위젯만 흑백 / 컬러 (비우면 '흑백 사진' 전체 설정을 따름) */
    mono?: boolean
    /** 위젯마다 칸 꾸미기 — 바탕색 · 진하기(0~100) · 바탕 사진 */
    bg?: string
    bgAlpha?: number
    /** 앱 아이콘 그림 색 */
    glyph?: string
    /** 방명록 위젯 — 제목('GUESTBOOK') 색 · 글 색 */
    labelColor?: string
    /** 글귀 — 전체 글자 크기 · 영문 줄 크기 (1 = 기본) */
    textScale?: number
    latinScale?: number
    textColor?: string
    bgImg?: string
    bgImgCrop?: PhoneImageSettings
    /** 방명록 메모 — 메모지 색 ('cycle' 이면 글마다 바뀜) */
    memoColor?: string
    /** 디데이 플립 — 초 숨기기 */
    hideSec?: boolean
    /** 사진 위젯 — 사진첩 사진을 천천히 넘기기 */
    slideshow?: boolean
  }
}

export interface PhoneStoryMessage {
  /** 'a' = 신랑의 말, 'b' = 신부의 말, 'p' = 줄글 문단, 'date' = 장 제목(날짜) */
  side: 'a' | 'b' | 'p' | 'date'
  text: string
  /** 장 제목 줄의 사진 (최대 2장) — 사진첩과 따로, 올린 사진만 쓴다 */
  src?: string
  src2?: string
  /** 사진 자르기 */
  srcCrop?: PhoneImageSettings
  src2Crop?: PhoneImageSettings
  /** 장의 날짜 (YYYY-MM-DD, 선택) — 저널 카드 아래에 표시 */
  date?: string
}

export interface PhoneAccount {
  bank: string
  number: string
  holder: string
  /** 호칭 — 신랑 · 아버지 · 어머니 · 직접 적기 */
  relation?: string
}

/** 연락처 동그라미 — 성 · 이모지 · 사진 */
export interface PhoneAvatarFields {
  avatarKind?: 'initial' | 'emoji' | 'photo'
  avatarEmoji?: string
  avatarPhoto?: string
  avatarCrop?: PhoneImageSettings
}
/** 신랑 · 신부 가족 (부모님 등) */
export interface PhoneFamily extends PhoneAvatarFields {
  relation: string
  name: string
  phone?: string
  deceased?: boolean
}

export interface PhonePerson extends PhoneAvatarFields {
  /** 성 + 이름 (화면에 쓰는 전체 이름) */
  name: string
  /** 성 · 이름 따로 (에디터 입력칸) — 없으면 name 첫 글자를 성으로 본다 */
  lastName?: string
  firstName?: string
  nameEn?: string
  phone?: string
  fatherName?: string
  motherName?: string
  accounts: PhoneAccount[]
  family?: PhoneFamily[]
}

export interface PhoneData {
  /** D-Day 팝업 — 다른 템플릿과 같은 모양 (lib/ddayPopupTypes) */
  ddayPopup?: DdayPopupData
  groom: PhonePerson
  bride: PhonePerson
  wedding: {
    date: string // YYYY-MM-DD
    time: string // HH:MM (24h)
    timeDisplay: string // 예: 오후 2시
    venue: { name: string; hall: string; address: string }
    showDate?: boolean
    showVenue?: boolean
  }
  phone: {
    theme: PhoneThemeId
    accent: string
    wallpaper: string
    wallpaperCrop?: PhoneImageSettings
    lockNotice: string
    /** 결혼식 당일에만 바뀌는 알림 문구 (비우면 평소 문구) */
    lockNoticeDay?: string
    usePasscode: boolean
    widgets: PhoneWidget[]
    story: PhoneStoryMessage[]
    memo: string[]
    appStyle: PhoneAppStyle
    /** number = 홈 화면 · 앱, lockNumber = 잠금화면 (비우면 number) */
    /** body = 한글 본문 글꼴 id (KR_FONTS) */
    fonts: { title: PhoneTitleFont; number: PhoneNumberFont; lockNumber?: PhoneNumberFont; body?: string }
    /** 글자 포인트 색 (위젯 이름 · 작은 제목) — 비우면 자동 */
    accentText?: string
    /** 오시는 길 — 지하철 · 버스 · 자가용 · 주차 · 기타 */
    directions?: { kind: 'subway' | 'bus' | 'car' | 'parking' | 'etc'; text: string }[]
    /** 유리 카드 색 — 검정(기본) · 흰색 */
    glassTone?: 'dark' | 'light'
    /** 고인 표시 — 故(기본) · 국화 */
    deceasedStyle?: 'hanja' | 'flower'
    /** 캘린더 일정 (참석 회신 · 캘린더) — 비우면 예식 시간부터 2시간 */
    schedule?: { time: string; end?: string; title: string }[]
    /** 화면별 사진 (흐린 사진 디자인) — 비우면 대표 사진 */
    screenPhotos?: Partial<Record<PhoneAppId, { src: string; crop?: PhoneImageSettings }>>
    /** 사진첩 폴더 (최대 3개 · 전체 33장) — 비우면 갤러리 사진 한 폴더 */
    albumFolders?: { name: string; images: string[] }[]
    /** 방명록 — 디자인 · 제목 */
    guestbookStyle?: 'chat' | 'board' | 'post' | 'notify'
    /** 커플 소개 — 두 사람 · 처음 만난 날 */
    intro?: { groom?: IntroPerson; bride?: IntroPerson; metDate?: string }
    introStyle?: 'profile' | 'portrait' | 'match' | 'settings' | 'card' | 'quiz'
    guestbookTitle?: string
    /** 앱 아이콘 모양 — 버튼 색(기본) · 컬러 앱 · 흰색 */
    iconStyle?: 'accent' | 'color' | 'white' | 'glass'
    /** 화면 위 작은 제목 · 큰 제목 (GALLERY · 보관함 등) — 비우면 디자인 기본 */
    screenText?: Partial<Record<PhoneAppId, { eyebrow?: string; title?: string }>>
    /** 홈 바탕 사진 밝기 (-60 어둡게 ~ 60 밝게) — 비우면 디자인 기본 */
    homeDim?: number
    /** 밀어서 열 때 전체 화면 (지원하는 기기만 · 기본 켬) */
    fullscreen?: boolean
    /** 홈 바탕 사진 흐림 (0 ~ 40px, 가우시안) */
    homeBlur?: number
    /** 홈 바탕 사진 위 색 덮기 — 색 · 진하기(0~90) */
    homeTint?: string
    homeTintAlpha?: number
    /** 글래스 홈 글자 색 — 비우면 흰색 (사진을 많이 밝게 하면 검정) */
    glassInk?: string
    /** 하단 바에 넣을 화면 (최대 4개, 고른 순서대로) — 비우면 예식 안내 · 참석 회신 · 마음 전하기 · 연락하기 */
    dock?: PhoneAppId[]
    /** D-Day 팝업 모양 — 알림 배너(기본) · 안내 카드 */
    ddayLook?: 'banner' | 'card'
    /** D-Day 팝업 사진 모양 — 가로(기본) · 정사각 · 세로 · 사진 꽉 채움 */
    ddayPhoto?: 'wide' | 'square' | 'tall' | 'full'
    /** 포스터 잠금화면 — 사진 높이(px) · 경계 부드러움(%, 0이면 또렷한 선) */
    posterH?: number
    posterFade?: number
    /** 홈 위 상태바 (시각 · 신호 · 하트 배터리) — 기본 켜짐 */
    statusBar?: boolean
    /** 잠금화면 검색창 — 누르면 검색어를 골라 그 화면으로 (비우면 홈 검색창과 같은 추천) */
    lockSearch?: boolean
    lockSearches?: PhoneSearchItem[]
    /** 잠금화면 검색창 모양 (0 밝게 · 1 어둡게 · 2 테두리 · 3 유리, 비우면 바탕에 맞춰) · 안내 글 · 위로 올린 만큼(px) */
    lockSearchStyle?: number
    lockSearchHint?: string
    lockSearchY?: number
    /** 홈 화면 장 수 (1 ~ 3, 옆으로 넘김) */
    homePages?: number
    /** 영상 화면 — 유튜브 링크 (제목은 비우면 '우리 영상 N') */
    videos?: { url: string; title?: string }[]
    /** 편지 — 초대의 글 · 신랑 · 신부의 편지 · 감사 인사 (최대 4통). 비워 둔 적 없으면 인사말이 초대의 글로 */
    letters?: PhoneLetter[]
    /** 편지 화면 — 메일(기본) · 메시지 · 손편지 */
    letterStyle?: 'mail' | 'message' | 'hand'
    /** 초대의 글 — 보낸 사람 프로필 사진 (비우면 대표 사진) */
    letterAvatar?: { src: string; crop?: PhoneImageSettings }
    /** 손편지 글씨 */
    letterHand?: LetterHandId
    /** 쓰지 않는 화면 (우리 이야기 · 마음 전하기 · 연락하기 · 사진첩) — 참석 회신은 rsvpEnabled 로 */
    hiddenApps?: PhoneAppId[]
    /** 예식 안내 지도 — 카카오맵(기본) · 구글 지도 · 그림 지도 */
    mapProvider?: 'kakao' | 'google' | 'art'
    /** 예식 안내 디자인 — 비우면 앱 화면 형식의 기본 */
    memoStyle?: 'invite' | 'map' | 'pass' | 'mappass' | 'tiles'
    /** 우리 이야기 디자인 — 비우면 앱 화면 형식의 기본 카드 */
    storyStyle?: 'cards' | 'journal' | 'playlist' | 'feed' | 'stories' | 'timeline' | 'essay'
    /** 우리 이야기 제목 (비우면 Our Story) */
    storyTitle?: string
    /** 마음 전하기 · 연락하기 · 사진첩 · 참석 회신 디자인 */
    giftStyle?: 'invite' | 'mail'
    /** 마음 전하기 제목 · 글 (비우면 기본 문구) */
    giftTitle?: string
    giftMessage?: string
    callStyle?: 'invite' | 'contacts' | 'keypad' | 'chats'
    albumStyle?: 'invite' | 'photos' | 'viewer' | 'memories'
    rsvpStyle?: 'calendar' | 'poll' | 'invite'
    /** 홈 위젯 사진을 흑백으로 */
    photoMono?: boolean
    /** 예식 안내 첫 화면의 인사 한 줄 */
    greeting?: string
    lockStyle: PhoneLockStyle
    /** 잠금화면 시계 묶음(날짜·시계·정보) 위치 — y: 위아래 이동(px), align: 정렬, size: 크기 배율 */
    lockClock?: { y?: number; align?: 'left' | 'center' | 'right'; size?: number }
    /** 알림 디자인 — 알림 카드 / 메시지 말풍선 / 편지 */
    lockNoticeStyle?: 'card' | 'message' | 'letter' | 'live' | 'calendar' | 'memory'
    /** 홈 화면 (커스텀) — 바탕색 · 위젯 색 · 하단 바 색 · 모눈 무늬 · 바탕 사진 */
    homeBgColor?: string
    cardColor?: string
    barColor?: string
    homePattern?: boolean
    homeImage?: string
    homeImageCrop?: PhoneImageSettings
    /** 잠금화면 시계 색 · 시계 위아래 문구 색 (비우면 디자인 기본) */
    lockClockColor?: string
    lockTextColor?: string
    /** 알림에 쓰는 사진 (비우면 대표 사진) + 크롭 */
    lockNoticePhoto?: string
    lockNoticePhotoCrop?: PhoneImageSettings
    /** 알림 보이기 — 비우면 사진 · 컬러는 보이고 포스터는 숨김 */
    lockNoticeShow?: boolean
    /** 알림 카드 위아래 이동(px) */
    lockNoticeY?: number
    /** 알림 카드에 예식장 정보 + '바로 보기' 버튼 */
    lockVenue?: boolean
    /** 사진이 없을 때 잠금화면 바탕색 (비우면 테마 바탕) */
    lockBg?: string
    /** 잠금화면 날짜 옆 한마디 (예: our wedding day) */
    lockCaption?: string
  }
  gallery: { images: string[] }
  // 참석 회신 — 표준 템플릿과 같은 content.rsvp* 이름 (lib/rsvpSettings 공용 처리)
  rsvpEnabled?: boolean
  rsvpAllowGuestCount?: boolean
  rsvpMealOption?: boolean
  rsvpShuttleOption?: boolean
  rsvpAfterPartyOption?: boolean
  rsvpPhoneOption?: boolean
  rsvpSideDetail?: boolean
  rsvpSideDetailOptions?: { groomSelf?: boolean; groomFather?: boolean; groomMother?: boolean; brideSelf?: boolean; brideFather?: boolean; brideMother?: boolean }
  rsvpMessagePlaceholder?: string
  rsvpNotice?: string
  sharedRsvpEnabled?: boolean
  sharedRsvpShareTitle?: string
  sharedRsvpShareDesc?: string
  sharedRsvpShareImage?: string
  sharedRsvpPhoto?: string
  // 배경음악 — 다른 청첩장과 같은 content.bgm
  bgm?: { enabled: boolean; url: string; autoplay: boolean; showNotification?: boolean; notificationText?: string }
  // 공유 — 다른 청첩장과 같은 이름 (카카오톡 썸네일 · 비율, 문자 · SNS 용 OG 이미지)
  meta: { title: string; description: string; ogImage: string; kakaoThumbnail?: string; kakaoThumbnailRatio?: '3:4' | '1:1' | '3:2' }
}

/* ───────── 격자 ───────── */
export const PHONE_W = 390
export const PHONE_H = 844
/** 포스터 잠금화면 — 아래쪽 사진 칸 높이 (대표 사진 자르기 비율에도 씀) */
export const POSTER_PHOTO_H = 430
export const GRID = { cols: 4, rows: 7, left: 24, top: 64, cellW: 70.5, cellH: 74, gapX: 20, gapY: 18 }
export const SIZE_SPAN: Record<WidgetSize, { w: number; h: number }> = { S: { w: 1, h: 1 }, M: { w: 2, h: 2 }, L: { w: 4, h: 2 }, W: { w: 4, h: 1 }, T: { w: 1, h: 2 }, H: { w: 2, h: 1 }, P: { w: 2, h: 3 }, R: { w: 3, h: 2 }, Q: { w: 3, h: 3 }, X: { w: 4, h: 3 }, U: { w: 3, h: 1 } }
/** 크기 = 가로 칸 × 세로 칸 */
export const SIZE_LABEL: Record<WidgetSize, string> = { S: '1×1', M: '2×2', L: '4×2', W: '4×1', T: '1×2', H: '2×1', P: '2×3', R: '3×2', Q: '3×3', X: '4×3', U: '3×1' }

/** 홈 화면 아래 고정 영역(한글 바로가기 + 독) 높이 */
export const HOME_BOTTOM = 136
/** 화면 높이에 맞는 칸 높이 — 짧은 폰에서는 칸이 낮아져 아래 바로가기와 겹치지 않는다 (최대 76) */
export const cellHFor = (screenH: number) => Math.max(56, Math.min(GRID.cellH, (screenH - GRID.top - HOME_BOTTOM - (GRID.rows - 1) * GRID.gapY) / GRID.rows))
export const cellX = (col: number) => GRID.left + col * (GRID.cellW + GRID.gapX)
export const cellY = (row: number, cellH: number = GRID.cellH) => GRID.top + row * (cellH + GRID.gapY)
export const spanW = (size: WidgetSize) => SIZE_SPAN[size].w * GRID.cellW + (SIZE_SPAN[size].w - 1) * GRID.gapX
export const spanH = (size: WidgetSize, cellH: number = GRID.cellH) => SIZE_SPAN[size].h * cellH + (SIZE_SPAN[size].h - 1) * GRID.gapY

/* ───────── 위젯 목록 ───────── */
export interface WidgetMeta {
  type: WidgetType
  label: string
  desc: string
  sizes: WidgetSize[]
  variants: string[]
  defaultSize: WidgetSize
}
export const WIDGET_CATALOG: WidgetMeta[] = [
  { type: 'dday', label: '디데이', desc: '예식까지 남은 날', sizes: ['S', 'H', 'M', 'W'], variants: ['카드', '숫자만', '링', '타일', '플립', '사진'], defaultSize: 'M' },
  { type: 'clock', label: '예식 시계', desc: '시각·날짜·장소', sizes: ['S', 'H', 'M', 'W', 'L'], variants: ['왼쪽 정렬', '가운데', '타자기', '날씨형', '플립', '알람'], defaultSize: 'W' },
  { type: 'calendar', label: '달력', desc: '예식일에 동그라미', sizes: ['S', 'M', 'L', 'W'], variants: ['달력', '큰 날짜', '일정', '날짜 + 달력'], defaultSize: 'M' },
  { type: 'photo', label: '사진', desc: '사진 한 장', sizes: ['S', 'T', 'H', 'M', 'P', 'R', 'Q', 'L', 'W', 'X'], variants: ['꽉 차게', '폴라로이드', '원형', '스티커', '투명 (배경 없이)'], defaultSize: 'M' },
  { type: 'quote', label: '글귀', desc: '한 줄 문구', sizes: ['S', 'H', 'U', 'M', 'L', 'W'], variants: ['세리프', '필기체', '카드', '굵은 문장', '사전', '말풍선', '인용구'], defaultSize: 'M' },
  { type: 'music', label: '배경음악', desc: '눌러서 켜고 끄기', sizes: ['S', 'H', 'M', 'L', 'W'], variants: ['카드', '한 줄', '아이팟', '디스크', '재생기', 'CD 플레이어'], defaultSize: 'W' },
  { type: 'guestbook', label: '방명록', desc: '최근 축하 메시지', sizes: ['M', 'W', 'L'], variants: ['말풍선', '메모'], defaultSize: 'W' },
  { type: 'story', label: '우리 이야기', desc: '이야기를 넘겨 보여 줌', sizes: ['M', 'W', 'L', 'P'], variants: ['사진 카드', '책갈피', '목차'], defaultSize: 'M' },
  { type: 'venue', label: '오시는 길', desc: '예식장 · 교통 안내', sizes: ['S', 'H', 'M', 'W', 'L'], variants: ['지도 앱', '교통 앱', '장소 카드'], defaultSize: 'M' },
  { type: 'intro', label: '커플 소개', desc: '두 사람 프로필', sizes: ['S', 'H', 'M', 'W'], variants: ['프로필', '사랑한 날', '하트 프레임', '연애 카운터'], defaultSize: 'M' },
  { type: 'folder', label: '폴더', desc: '앱 여러 개를 한 칸에', sizes: ['S', 'M'], variants: ['폴더'], defaultSize: 'S' },
  { type: 'letters', label: '초대의 글', desc: '동그라미 · 미리보기 · 새 편지 알림', sizes: ['H', 'U', 'W', 'L'], variants: ['동그라미', '미리보기', '새 편지 알림'], defaultSize: 'U' },
  { type: 'search', label: '검색창', desc: '검색어를 누르면 그 화면으로', sizes: ['H', 'W'], variants: ['밝게', '어둡게', '테두리', '유리'], defaultSize: 'W' },
  { type: 'todo', label: '할 일 목록', desc: '체크리스트', sizes: ['M', 'L'], variants: ['목록', '번호'], defaultSize: 'L' },
  { type: 'app', label: '앱 아이콘', desc: '눌러서 여는 화면', sizes: ['S', 'M', 'W'], variants: ['기본'], defaultSize: 'S' },
]
export const widgetMeta = (t: WidgetType) => WIDGET_CATALOG.find(w => w.type === t)!
/** 크기에 안 맞는 모양 — 넓은 사진(4×2 · 4×1)에서는 원형 · 스티커를 숨김 */
export const variantHidden = (t: WidgetType, variant: number, size: WidgetSize) =>
  (t === 'photo' && (variant === 2 || variant === 3) && SIZE_SPAN[size].w !== SIZE_SPAN[size].h)
  // 날짜 + 달력은 4×2 에서만 달라 보임 — 다른 크기에선 숨김
  || (t === 'calendar' && variant === 3 && size !== 'L')
  // 디데이 4×1 — 숫자만 · 타일은 카드와 거의 같아 숨김
  || (t === 'dday' && size === 'W' && (variant === 1 || variant === 2 || variant === 3))
  // 글귀 — 칸이 좁아 깨지거나 서로 같아 보이는 조합 숨김
  || (t === 'quote' && size === 'S' && [1, 2, 3, 4, 6].includes(variant))
  || (t === 'quote' && (size === 'W' || size === 'H' || size === 'U') && [3, 4, 6].includes(variant))
  || (t === 'quote' && (size === 'L' || size === 'W' || size === 'U') && variant === 5)
  // 배경음악 — 2×1 은 카드 · 디스크만, 2×2 에서 '한 줄' 은 숨김
  || (t === 'music' && (size === 'H' || size === 'S') && variant !== 0 && variant !== 3 && variant !== 5)
  || (t === 'music' && (size === 'M' || size === 'L') && variant === 1)
  // 우리 이야기 — 4×1 은 책갈피만, 2×2 · 2×3 책갈피는 좁아 숨김
  || (t === 'story' && size === 'W' && variant !== 1)
  || (t === 'story' && (size === 'M' || size === 'P') && variant === 1)
  // 편지 — 동그라미는 한 줄(2×1 · 3×1 · 4×1), 미리보기는 4×2, 새 편지 알림은 4×1
  || (t === 'letters' && variant === 0 && size === 'L')
  || (t === 'letters' && variant === 1 && size !== 'L')
  || (t === 'letters' && variant === 2 && size !== 'W')
  // 오시는 길 1×1 은 지도만
  || (t === 'venue' && size === 'S' && variant !== 0)
  // 커플 소개 1×1 은 폴더 한 가지
  || (t === 'intro' && size === 'S' && variant !== 0)
/** 그 크기에서 쓸 수 있는 첫 모양 */
export const firstVariant = (t: WidgetType, size: WidgetSize) => { const n = WIDGET_CATALOG.find(m => m.type === t)?.variants.length || 1; for (let v = 0; v < n; v++) if (!variantHidden(t, v, size)) return v; return 0 }

export const APP_META: Record<PhoneAppId, { label: string; icon: string }> = {
  story: { label: '우리 이야기', icon: 'message' },
  album: { label: '사진첩', icon: 'photo' },
  memo: { label: '예식 안내', icon: 'memo' },
  gift: { label: '마음 전하기', icon: 'gift' },
  rsvp: { label: '참석 회신', icon: 'rsvp' },
  call: { label: '연락하기', icon: 'call' },
  guestbook: { label: '방명록', icon: 'pen' },
  intro: { label: '커플 소개', icon: 'heart' },
  video: { label: '영상', icon: 'play' },
  camera: { label: '사진 공유', icon: 'camera' },
  letter: { label: '초대의 글', icon: 'send' },
}

/* ───────── 테마 ───────── */
export interface PhoneTheme {
  id: PhoneThemeId
  label: string
  desc: string
  /** 홈 화면 바탕 — 'photo' 면 배경화면 사진 + 어둡게 */
  homeBg: 'solid' | 'photo'
  bg: string
  ink: string
  sub: string
  card: string
  cardBorder: string
  cardInk: string
  cardSub: string
  icon: string
  iconBorder: string
  iconInk: string
  labelInk: string
  bar: string
  display: string
  body: string
  /** 테마를 고를 때 함께 맞춰 주는 잠금화면 디자인 */
  lock: PhoneLockStyle
  /** 바탕 무늬 */
  pattern?: 'grid'
  /** 독(아래 막대) 버튼 — 비우면 포인트 색 */
  dockBtn?: string
  dockInk?: string
  /** 테마를 고를 때 함께 맞춰 주는 글꼴 (고른 뒤 바꿀 수 있음) */
  fonts: { title: PhoneTitleFont; number: PhoneNumberFont }
}
const BODY = "'Pretendard Variable', var(--font-noto-sans-kr), 'Pretendard', sans-serif"
export const PHONE_THEMES: Record<PhoneThemeId, PhoneTheme> = {
  white: {
    id: 'white', label: '커스텀', desc: '색과 바탕을 직접', homeBg: 'solid', lock: 'photo',
    bg: '#FFFFFF', ink: '#1F1F1F', sub: '#7A7A7A', card: '#F4F4F3', cardBorder: 'rgba(0,0,0,0)', cardInk: '#1F1F1F', cardSub: '#7A7A7A',
    icon: '#F2F2F1', iconBorder: 'rgba(0,0,0,0)', iconInk: '#2A2A2A', labelInk: '#3A3A3A', bar: '#F2F2F1',
    display: "var(--font-playfair), 'Playfair Display', serif", body: BODY, fonts: { title: 'instrument', number: 'sans' },
  },
  glass: {
    id: 'glass', label: '글래스', desc: '사진 위 유리 카드', homeBg: 'photo', lock: 'photo',
    bg: '#5E5850', ink: '#FFFFFF', sub: 'rgba(255,255,255,0.82)', card: 'rgba(255,255,255,0.22)', cardBorder: 'rgba(255,255,255,0.42)', cardInk: '#FFFFFF', cardSub: 'rgba(255,255,255,0.8)',
    icon: 'rgba(255,255,255,0.26)', iconBorder: 'rgba(255,255,255,0.45)', iconInk: '#FFFFFF', labelInk: '#FFFFFF', bar: 'rgba(255,255,255,0.24)',
    display: "var(--font-cormorant), 'Cormorant Garamond', serif", body: BODY, fonts: { title: 'instrument', number: 'sans' },
  },
}

/* ───────── 글꼴 (사용자가 고름) ───────── */
const KR_SERIF = "var(--font-noto-serif-kr), 'Noto Serif KR', serif"
const KR_SANS = "'Pretendard Variable', var(--font-noto-sans-kr), sans-serif"
/** 제목 글꼴 — latin 이면 영문 이름(둘 다 있을 때)을 쓴다 */
export const TITLE_FONTS: Record<PhoneTitleFont, { label: string; family: string; weight: number; latin: boolean; letterSpacing: string; scale: number }> = {
  instrument: { label: '인스트루먼트', family: `var(--font-instrument-serif), 'Instrument Serif', ${KR_SERIF}`, weight: 400, latin: true, letterSpacing: '-0.01em', scale: 1 },
  cormorant: { label: '코모런트', family: `var(--font-cormorant), 'Cormorant Garamond', ${KR_SERIF}`, weight: 500, latin: true, letterSpacing: '0', scale: 1 },
  playfair: { label: '플레이페어', family: `var(--font-playfair), 'Playfair Display', ${KR_SERIF}`, weight: 400, latin: true, letterSpacing: '-0.02em', scale: 0.86 },
  bodoni: { label: '보도니', family: `var(--font-bodoni), 'Bodoni Moda', ${KR_SERIF}`, weight: 600, latin: true, letterSpacing: '-0.02em', scale: 0.86 },
  script: { label: '손글씨', family: `var(--font-great-vibes), 'Great Vibes', ${KR_SERIF}`, weight: 400, latin: true, letterSpacing: '0', scale: 1.08 },
  gothic: { label: '굵은 고딕', family: KR_SANS, weight: 800, latin: false, letterSpacing: '-0.045em', scale: 0.84 },
}
/** 한글 본문 글꼴 (THE SIMPLE 과 같은 목록) */
export const KR_FONTS = KOREAN_FONTS
/** 폰 화면에서 쓸 글꼴 이름 — 굵게가 나오는 이름으로 바꿔 끼움 (fonts.css 의 'PF …') */
const PHONE_KR_ALIAS: Record<string, string> = {
  Pretendard: 'Pretendard Variable', Ridibatang: 'PF Ridibatang', ELandChoice: 'PF ELandChoice', JoseonGulim: 'PF JoseonGulim', OmuDaye: 'PF OmuDaye',
  OngleipKonkon: 'PF OngleipKonkon', NanumSquareRound: 'PF NanumSquareRound', Suit: 'PF Suit', ChosunIlboMyungjo: 'PF ChosunIlboMyungjo',
}
export function krPhoneFamily(id?: string): string | null {
  const f = KOREAN_FONTS.find(x => x.id === id)
  if (!f) return null
  const name = f.fontFamily.match(/'([^']+)'/)?.[1] || ''
  const alias = PHONE_KR_ALIAS[name]
  return alias ? `'${alias}', '${name}'` : f.fontFamily.replace(/, *(sans-)?serif$/, '')
}
/** 숫자 글꼴 — 모두 높이가 고른 숫자(lining). clockW = '14:00' 폭 ÷ 숫자 높이 (시계가 화면을 넘지 않게). 굵을수록 자간을 좁힌다 (레퍼런스 측정: 굵은·길쭉 숫자 틈 = 숫자 높이의 4~8%) */
export const NUMBER_FONTS: Record<PhoneNumberFont, { label: string; family: string; weight: number; letterSpacing: string; capRatio: number; clockW: number }> = {
  sans: { label: '산세리프', family: KR_SANS, weight: 600, letterSpacing: '-0.03em', capRatio: 0.72, clockW: 3.7 },
  serif: { label: '세리프', family: "var(--font-cormorant), 'Cormorant Garamond', serif", weight: 500, letterSpacing: '-0.01em', capRatio: 0.63, clockW: 3.5 },
  didone: { label: '굵은 세리프', family: "var(--font-bodoni), 'Bodoni Moda', serif", weight: 700, letterSpacing: '-0.02em', capRatio: 0.66, clockW: 3.9 },
  condensed: { label: '길쭉한', family: "var(--font-oswald), 'Oswald', sans-serif", weight: 400, letterSpacing: '-0.02em', capRatio: 0.81, clockW: 2.25 },
  mono: { label: '타자기', family: "var(--font-courier-prime), 'Courier Prime', monospace", weight: 700, letterSpacing: '-0.04em', capRatio: 0.6, clockW: 5.1 },
  instrument: { label: '좁은 세리프', family: "var(--font-instrument-serif), 'Instrument Serif', serif", weight: 400, letterSpacing: '-0.01em', capRatio: 0.7, clockW: 3.0 },
}
export const titleFontOf = (data: PhoneData) => TITLE_FONTS[data.phone.fonts?.title] || TITLE_FONTS.instrument
export const numberFontOf = (data: PhoneData) => NUMBER_FONTS[data.phone.fonts?.number] || NUMBER_FONTS.sans
/** 제목에 쓸 이름 — 영문 글꼴이고 영문 이름이 둘 다 있으면 영문 */
export function titleNames(data: PhoneData): { a: string; b: string; latin: boolean } {
  const f = titleFontOf(data)
  if (f.latin && data.groom.nameEn && data.bride.nameEn) return { a: data.groom.nameEn, b: data.bride.nameEn, latin: true }
  return { a: data.groom.name || '신랑', b: data.bride.name || '신부', latin: false }
}
/** 표지 사진 — 배경화면, 없으면 사진첩 첫 장 */
export const coverOf = (data: PhoneData) => data.phone.wallpaper || data.gallery.images[0] || ''
/** 잠금화면용 — 숫자 글꼴을 잠금화면 것으로 바꿔 끼운 데이터 */
export const withLockNumber = (data: PhoneData): PhoneData => (data.phone.fonts.lockNumber ? { ...data, phone: { ...data.phone, fonts: { ...data.phone.fonts, number: data.phone.fonts.lockNumber } } } : data)
/** 화면 제목 — 사용자가 바꾼 글, 없으면 기본 */
export const screenText = (data: PhoneData, app: PhoneAppId, key: 'eyebrow' | 'title', fallback: string) => data.phone.screenText?.[app]?.[key]?.trim() || fallback
export const DOCK_DEFAULT: PhoneAppId[] = ['memo', 'rsvp', 'gift', 'call']
export const DOCK_MAX = 4
/** 홈 화면 장 — 최대 3장. 위젯이 있는 장은 장 수가 적어도 보여 줌 */
export const HOME_PAGES_MAX = 3
export const homePagesOf = (data: PhoneData) => Math.min(HOME_PAGES_MAX, Math.max(1, data.phone.homePages ?? 1, ...data.phone.widgets.map(w => (w.page || 0) + 1)))
/** 유튜브 주소에서 영상 id — watch?v= · youtu.be/ · shorts/ · embed/ · live/ */
export function youtubeId(url?: string): string | null {
  if (!url) return null
  const m = url.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{11})/)
  return m ? m[1] : /^[A-Za-z0-9_-]{11}$/.test(url.trim()) ? url.trim() : null
}
/** 검색창 위젯 — 검색어 하나 = 이름 + 열릴 화면 */
export interface PhoneSearchItem { label: string; app: PhoneAppId; /** 강조 — 맨 위 · 포인트 색 · 먼저 보임 */ pin?: boolean }
/** 처음 넣을 때 추천 검색어 — 예식장 · 커플 이름 · 회신 · 계좌 · 사진 */
export function defaultSearchItems(data: PhoneData): PhoneSearchItem[] {
  const g = data.groom.firstName || (data.groom.name || '').slice(1) || '신랑'
  const b = data.bride.firstName || (data.bride.name || '').slice(1) || '신부'
  return [
    { label: data.wedding.venue.name || '예식장 위치', app: 'memo' },
    { label: `${g} ${b}`, app: isAppOff(data, 'intro') || isEmptyApp(data, 'intro') ? 'story' : 'intro' },
    { label: '참석 회신', app: 'rsvp' },
    { label: '축의금 계좌', app: 'gift' },
    { label: '웨딩 사진', app: 'album' },
  ]
}
/** 폴더 위젯 — 처음 넣을 때 묶이는 앱 */
export const FOLDER_DEFAULT_APPS: PhoneAppId[] = ['story', 'album', 'guestbook']
/** 하단 바 — 꺼 둔 화면은 빼고 센다 */
export const dockOf = (data: PhoneData): PhoneAppId[] => (data.phone.dock ?? DOCK_DEFAULT).filter(a => !isAppOff(data, a)).slice(0, DOCK_MAX)
/** 홈 화면에서 열 수 있는 화면 — 하단 바 · 앱 아이콘 · 방명록 위젯 */
export function reachableApps(data: PhoneData): Set<PhoneAppId> {
  const r = new Set<PhoneAppId>(dockOf(data))
  for (const w of data.phone.widgets) {
    if (w.type === 'app') r.add(w.props.app || 'memo')
    if (w.type === 'guestbook') r.add('guestbook')
    if (w.type === 'story') r.add('story')
    if (w.type === 'venue') r.add('memo')
    if (w.type === 'intro') r.add('intro')
    if (w.type === 'letters') r.add('letter')
    if (w.type === 'photo' && w.props.openAlbum) r.add('album')
    if (w.type === 'search') for (const x of (w.props.searches?.length ? w.props.searches : [])) r.add(x.app)
    if (w.type === 'folder') for (const a of (w.props.apps?.length ? w.props.apps : FOLDER_DEFAULT_APPS)) r.add(a)
  }
  return r
}
/* ───────── 편지 ───────── */
export type PhoneLetterKind = 'invite' | 'groom' | 'bride'
export interface PhoneLetter {
  id: string
  kind: PhoneLetterKind
  title?: string
  body: string
  /** 대화 — 신랑 · 신부가 번갈아 하는 말 (메시지 디자인에선 말풍선이 번갈아) */
  lines?: { who: 'groom' | 'bride'; text: string }[]
  /** 맺음 (비우면 '지훈 · 서연 드림') */
  sign?: string
  photos?: string[]
  /** 손편지 — 이 편지의 종이 색 · 글씨 (비우면 흰 종이 · 기본 글씨) */
  paper?: string
  hand?: string
  /** 사진마다 자른 영역 (사진 주소로) */
  crops?: Record<string, PhoneImageSettings>
}
/** 손편지 글씨 — THE CLASSIC 글 간지와 같은 손글씨 (그리운 손글씨 8 · 손글씨 4) */
export type LetterHandId = string
const MS_HANDS = ['neathand', 'roundhand', 'adulthand', 'romantic']
export const LETTER_HANDS: { id: LetterHandId; label: string; family: string }[] = [
  ...GRIUN_FONTS.map(f => ({ id: f.id, label: f.name.replace(/^그리운\s*/, ''), family: f.family })),
  ...MS_HANDS.map(id => KOREAN_FONTS.find(f => f.id === id)).filter((f): f is NonNullable<typeof f> => !!f).map(f => ({ id: f.id, label: f.name, family: f.fontFamily })),
]
/** 손편지 종이 색 — 메모지처럼 */
export const LETTER_PAPERS: { color: string; label: string }[] = [
  { color: '#FFFFFF', label: '흰색' },
  { color: '#FFF4C2', label: '노랑' },
  { color: '#E6F0FA', label: '하늘' },
  { color: '#E5F2E8', label: '민트' },
  { color: '#EEE9F6', label: '라벤더' },
  { color: '#F1F0EC', label: '회색' },
]
export const letterHandOf = (id?: string) => LETTER_HANDS.find(h => h.id === id) || LETTER_HANDS.find(h => h.id === 'griun-everydayjeong') || LETTER_HANDS[0]
export const LETTERS_MAX = 4
export const LETTER_PHOTOS_MAX = 5
export const LETTER_KINDS: Record<PhoneLetterKind, { label: string; title: string }> = {
  invite: { label: '두 사람의 글', title: '저희 결혼합니다' },
  groom: { label: '신랑의 편지', title: '신랑의 편지' },
  bride: { label: '신부의 편지', title: '신부의 편지' },
}
/** 보여 줄 편지 — 비워 둔 적이 없으면(예전 청첩장) 인사말을 초대의 글로 */
export function lettersOf(data: PhoneData): PhoneLetter[] {
  const own = data.phone.letters
  if (own) return own.filter(l => l.kind in LETTER_KINDS).filter(l => l.body.trim() || l.photos?.length || l.title?.trim() || l.lines?.some(x => x.text.trim())).slice(0, LETTERS_MAX)
  const g = data.phone.greeting?.trim()
  return g ? [{ id: 'greeting', kind: 'invite', body: g }] : []
}
/** 잠긴 편지 — 지금은 없음 (예식 후 공개하던 감사 인사는 빼고, 당일 문구는 잠금화면 알림으로). 화면 쪽 잠금 표시는 그대로 둠 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function letterLockedUntil(data: PhoneData, l: PhoneLetter): Date | null {
  return null
}
/** 오늘이 결혼식 날인지 (기기 날짜 기준) */
export function isWeddingDay(data: PhoneData, now = new Date()): boolean {
  const d = data.wedding.date
  if (!d) return false
  const p = (n: number) => String(n).padStart(2, '0')
  return d === `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

export const ALBUM_MAX = 33
export const ALBUM_FOLDERS_MAX = 3
/** 사진첩 폴더 — 폴더를 안 만들었으면 갤러리 전체가 한 폴더 */
export const foldersOf = (data: PhoneData): { name: string; images: string[] }[] => {
  const f = (data.phone.albumFolders || []).filter(x => x.images.length || x.name)
  return f.length ? f : [{ name: '', images: data.gallery.images }]
}
/** 화면 사진 — 따로 고른 사진, 없으면 대표 사진 */
export const screenCoverOf = (data: PhoneData, app: PhoneAppId): { src: string; crop?: PhoneImageSettings } => {
  const own = data.phone.screenPhotos?.[app]
  if (own?.src) return own
  return { src: coverOf(data), crop: data.phone.wallpaper ? data.phone.wallpaperCrop : undefined }
}

export const GIFT_TITLE = '마음 전하실 곳'
export const GIFT_MESSAGE = '함께하지 못하는 아쉬움을 전해 주시고 싶은 분들을 위해 조심스레 적어 둡니다.\n\n보내 주신 마음, 오래 간직하겠습니다.'
/** 사용자가 끈 화면 */
export function isAppOff(data: PhoneData, app: PhoneAppId): boolean {
  if (app === 'rsvp') return data.rsvpEnabled === false
  if (app === 'memo') return false
  return !!data.phone.hiddenApps?.includes(app)
}
/** 내용이 비어 하객에게 보여 줄 게 없는 앱 (홈 아이콘 · 독에서 숨김) — 끈 화면 포함 */
export function isEmptyApp(data: PhoneData, app: PhoneAppId): boolean {
  if (isAppOff(data, app)) return true
  if (app === 'story') return !data.phone.story.some(m => m.text.trim() || m.src)
  if (app === 'album') return data.gallery.images.length === 0
  if (app === 'gift') return data.groom.accounts.length + data.bride.accounts.length === 0
  if (app === 'video') return !(data.phone.videos || []).some(v => youtubeId(v.url))
  if (app === 'letter') return lettersOf(data).length === 0
  if (app === 'intro') { const i = data.phone.intro; return ![i?.groom, i?.bride].some(p => p && (p.bio?.trim() || p.photo || (p.items || []).some(x => x.a.trim()))) }
  if (app === 'call') return ![data.groom, data.bride].some(p => p.phone || (p.family || []).some(f => f.phone && !f.deceased))
  if (app === 'rsvp') return data.rsvpEnabled === false
  return false
}
/** 화면마다 고른 디자인 (비우면 기본값) — 앱 화면 형식을 전체에 한꺼번에 적용하지 않는다 */
export const SCREEN_DEFAULTS = { memo: 'mappass', story: 'journal', gift: 'mail', call: 'contacts', album: 'photos', rsvp: 'calendar', guestbook: 'chat', intro: 'profile', video: 'tube', camera: 'camera', letter: 'mail' } as const
export function screenStyle(data: PhoneData, app: PhoneAppId): string {
  const p = data.phone
  const v = { memo: p.memoStyle, story: p.storyStyle, gift: p.giftStyle, call: p.callStyle, album: p.albumStyle, rsvp: p.rsvpStyle, guestbook: p.guestbookStyle, intro: p.introStyle, video: undefined, camera: undefined, letter: p.letterStyle }[app]
  return v || SCREEN_DEFAULTS[app]
}
/** 테마 + 사용자가 고른 홈 바탕색 (어두운 색이면 글자를 흰색으로) */
/** 테마 + 고른 한글 본문 글꼴 */
export function themeOf(data: PhoneData): PhoneTheme {
  const t = themeColors(data)
  const kr = krPhoneFamily(data.phone.fonts?.body)
  return kr ? { ...t, body: `${kr}, ${t.body}` } : t
}
function themeColors(data: PhoneData): PhoneTheme {
  const base = PHONE_THEMES[data.phone.theme] || PHONE_THEMES.white
  if (base.homeBg === 'photo') {
    // 글래스 — 고른 글자 색, 없으면 사진 밝기에 맞춰
    const ink = data.phone.glassInk || ((data.phone.homeDim ?? -34) > 15 ? '#1F1F1F' : '')
    if (!ink || ink.toUpperCase() === '#FFFFFF') return base
    const dk = isDark(ink)
    return {
      ...base, ink, labelInk: ink, cardInk: ink, iconInk: ink,
      sub: dk ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.82)', cardSub: dk ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.8)',
      card: dk ? 'rgba(255,255,255,0.42)' : base.card, icon: dk ? 'rgba(255,255,255,0.5)' : base.icon,
    }
  }
  // 커스텀 — 고른 색으로 만들고, 글자색은 바탕·위젯 밝기에 맞춰 자동
  const p = data.phone
  const bg = p.homeBgColor || base.bg
  const card = p.cardColor || base.card
  const bar = p.barColor || base.bar
  // 바탕 사진을 많이 밝게 하면 글자를 검게
  // 진하게 덮은 색이 있으면 그 색의 밝기를 따름
  const tintStrong = !!p.homeTint && (p.homeTintAlpha ?? 35) >= 40
  const onDarkBg = p.homeImage ? (tintStrong ? isDark(p.homeTint!) : (p.homeDim ?? -12) <= 15) : isDark(bg)
  const darkCard = isDark(card)
  return {
    ...base, bg, card, bar, pattern: p.homePattern ? 'grid' : undefined,
    ink: onDarkBg ? '#FFFFFF' : base.ink, sub: onDarkBg ? 'rgba(255,255,255,0.78)' : base.sub, labelInk: onDarkBg ? '#FFFFFF' : base.labelInk,
    cardInk: darkCard ? '#FFFFFF' : '#1F1F1F', cardSub: darkCard ? 'rgba(255,255,255,0.72)' : '#7A7A7A',
    icon: card, iconBorder: 'rgba(0,0,0,0)', iconInk: darkCard ? '#FFFFFF' : '#2A2A2A',
  }
}
/** 커스텀 홈 빠른 시작 — 누르면 색 묶음이 한 번에 들어간다 */
export const HOME_PRESETS: { id: string; label: string; bg: string; card: string; bar: string; pattern?: boolean }[] = [
  { id: 'mono', label: '밝은 회색', bg: '#F1F1EF', card: '#FFFFFF', bar: '#E4E4E2' },
  { id: 'grid', label: '모눈종이', bg: '#F4F4F2', card: '#FFFFFF', bar: '#5E5E5E', pattern: true },
  { id: 'dark', label: '검정', bg: '#1E1E1E', card: '#2E2E2E', bar: '#2E2E2E' },
]
export const CARD_COLOR_OPTIONS = ['#FFFFFF', '#F4F4F3', '#EDEDEB', '#E8EDE7', '#F4ECEA', '#2E2E2E']
export const BAR_COLOR_OPTIONS = ['#FFFFFF', '#F2F2F1', '#E4E4E2', '#5E5E5E', '#2E2E2E']
/** 홈 바탕색 추천 */
export const HOME_BG_OPTIONS = ['#FFFFFF', '#F4F4F2', '#EFEFED', '#E7E7E7', '#E6EBE5', '#F3E8E6', '#E5E8F0', '#2B2B2B']
/** 사진 없는 잠금화면 바탕색 — 기본은 흰색 */
export const LOCK_BG_OPTIONS = ['#FFFFFF', '#EFEFED', '#E3E9E2', '#F2E4E1', '#E4E6EE', '#3A3632', '#2E3440']
/** 어두운 색인지 (글자를 흰색으로) */
export function isDark(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return false
  const n = parseInt(m[1], 16)
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.55
}
export const ACCENT_OPTIONS = ['#8C6A5A', '#5E7D6B', '#4F6A8F', '#A35F6E', '#2B2A28']

/* ───────── 계산 도우미 ───────── */
const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const DAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAY_EN_T = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_EN_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function parseWeddingDate(date: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '')
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}
export function weddingParts(data: PhoneData) {
  const d = parseWeddingDate(data.wedding.date)
  const [hh, mm] = (data.wedding.time || '').split(':').map(Number)
  const hasTime = Number.isFinite(hh)
  return {
    d,
    year: d?.getFullYear(),
    month: d ? d.getMonth() + 1 : undefined,
    day: d?.getDate(),
    dayKo: d ? DAY_KO[d.getDay()] : '',
    dayEn: d ? DAY_EN[d.getDay()] : '',
    monthEn: d ? MONTH_EN[d.getMonth()] : '',
    monthShort: d ? MONTH_EN[d.getMonth()].slice(0, 3) : '',
    dayShort: d ? DAY_EN_T[d.getDay()] : '',
    dayFull: d ? DAY_EN_FULL[d.getDay()] : '',
    /** 오후 2:00 */
    timeShort: hasTime ? `${hh < 12 ? '오전' : '오후'} ${hh % 12 || 12}:${String(mm || 0).padStart(2, '0')}` : '',
    clock: hasTime ? `${String(hh).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}` : '',
    timeKo: data.wedding.timeDisplay || '',
  }
}
export function ddayCount(date: string, today = new Date()): number | null {
  const d = parseWeddingDate(date)
  if (!d) return null
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((d.getTime() - t.getTime()) / 86400000)
}
export const ddayText = (n: number | null) => (n == null ? 'D-DAY' : n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : `D+${-n}`)

/* ───────── 격자 배치 ───────── */
export function occupied(widgets: PhoneWidget[], exceptId?: string): boolean[][] {
  const g = Array.from({ length: GRID.rows }, () => Array(GRID.cols).fill(false))
  for (const w of widgets) {
    if (w.id === exceptId) continue
    const s = SIZE_SPAN[w.size]
    for (let r = w.row; r < w.row + s.h; r++) for (let c = w.col; c < w.col + s.w; c++) if (g[r] && c < GRID.cols) g[r][c] = true
  }
  return g
}
export function fits(widgets: PhoneWidget[], size: WidgetSize, col: number, row: number, exceptId?: string): boolean {
  const s = SIZE_SPAN[size]
  if (col < 0 || row < 0 || col + s.w > GRID.cols || row + s.h > GRID.rows) return false
  const g = occupied(widgets, exceptId)
  for (let r = row; r < row + s.h; r++) for (let c = col; c < col + s.w; c++) if (g[r][c]) return false
  return true
}
/** 원하는 칸에서 가장 가까운 빈 자리 (없으면 null) */
export function nearestFit(widgets: PhoneWidget[], size: WidgetSize, col: number, row: number, exceptId?: string): { col: number; row: number } | null {
  let best: { col: number; row: number; d: number } | null = null
  for (let r = 0; r < GRID.rows; r++) for (let c = 0; c < GRID.cols; c++) {
    if (!fits(widgets, size, c, r, exceptId)) continue
    const d = Math.abs(r - row) * 1.2 + Math.abs(c - col)
    if (!best || d < best.d) best = { col: c, row: r, d }
  }
  return best ? { col: best.col, row: best.row } : null
}

/** 겹치는 자리에 놓기 — 놓은 위젯이 그 자리를 차지하고, 겹친 위젯은 비켜남
 * (같은 크기면 서로 자리 바꿈 → 아니면 가장 가까운 빈 칸). 놓을 수 없으면 null */
export function placeWithReflow(widgets: PhoneWidget[], moved: PhoneWidget, col: number, row: number): PhoneWidget[] | null {
  const s = SIZE_SPAN[moved.size]
  if (col < 0 || row < 0 || col + s.w > GRID.cols || row + s.h > GRID.rows) return null
  const overlaps = (a: PhoneWidget, c: number, r: number, size: WidgetSize) => {
    const sa = SIZE_SPAN[a.size], sb = SIZE_SPAN[size]
    return a.col < c + sb.w && a.col + sa.w > c && a.row < r + sb.h && a.row + sa.h > r
  }
  const placed: PhoneWidget = { ...moved, col, row }
  const others = widgets.filter(x => x.id !== moved.id)
  const hit = others.filter(x => overlaps(x, col, row, moved.size))
  let next: PhoneWidget[] = [...others.filter(x => !hit.includes(x)), placed]
  // 큰 것부터 자리 찾기
  for (const h of [...hit].sort((a, b) => SIZE_SPAN[b.size].w * SIZE_SPAN[b.size].h - SIZE_SPAN[a.size].w * SIZE_SPAN[a.size].h)) {
    // 같은 크기 하나만 겹쳤고 원래 자리가 비면 맞바꿈
    if (hit.length === 1 && h.size === moved.size && moved.col >= 0 && fits(next, h.size, moved.col, moved.row)) { next = [...next, { ...h, col: moved.col, row: moved.row }]; continue }
    const spot = nearestFit(next, h.size, h.col, h.row)
    if (!spot) return null
    next = [...next, { ...h, col: spot.col, row: spot.row }]
  }
  // 원래 순서 유지
  const byId = new Map(next.map(x => [x.id, x]))
  const kept = widgets.map(x => byId.get(x.id)!)
  return widgets.some(x => x.id === moved.id) ? kept : [...kept, placed]
}

export const newWidgetId = () => `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/* ───────── 기본값 ───────── */
export const DEFAULT_WIDGETS: PhoneWidget[] = [
  { id: 'w-dday', type: 'dday', col: 0, row: 0, size: 'M', variant: 0, props: { label: '우리 결혼식까지' } },
  { id: 'w-photo', type: 'photo', col: 2, row: 0, size: 'M', variant: 0, props: {} },
  { id: 'w-story', type: 'app', col: 0, row: 2, size: 'S', variant: 0, props: { app: 'story' } },
  { id: 'w-album', type: 'app', col: 1, row: 2, size: 'S', variant: 0, props: { app: 'album' } },
  { id: 'w-clock', type: 'clock', col: 0, row: 3, size: 'W', variant: 0, props: {} },
  { id: 'w-quote', type: 'quote', col: 0, row: 4, size: 'W', variant: 1, props: { text: 'forever starts here' } },
]

export function createDefaultPhoneData(): PhoneData {
  return {
    groom: { name: '', phone: '', accounts: [] },
    bride: { name: '', phone: '', accounts: [] },
    wedding: { date: '', time: '14:00', timeDisplay: '오후 2시', venue: { name: '', hall: '', address: '' }, showDate: true, showVenue: true },
    phone: {
      theme: 'white',
      accent: ACCENT_OPTIONS[0],
      wallpaper: '',
      lockNotice: '저희 결혼식에 초대합니다.',
      usePasscode: false,
      widgets: DEFAULT_WIDGETS,
      story: [
        { side: 'date', text: '처음 만난 날' },
        { side: 'a', text: '안녕하세요, 처음 뵙겠습니다.' },
        { side: 'b', text: '반가워요. 이야기 많이 들었어요.' },
        { side: 'date', text: '그리고 오늘' },
        { side: 'b', text: '이제 평생 같이 걸어가려고 해요.' },
      ],
      memo: ['식사는 예식 후 연회장에서 준비했습니다.', '주차는 2시간 무료입니다.'],
      appStyle: 'invite',
      greeting: '저희 결혼합니다.\n오셔서 축하해 주세요.',
      lockStyle: 'photo',
      fonts: { title: 'instrument', number: 'sans' },
    },
    gallery: { images: [] },
    rsvpEnabled: true,
    rsvpAllowGuestCount: true,
    meta: { title: '', description: '', ogImage: '' },
  }
}

/** 저장된 content(JSON)를 안전하게 PhoneData 로 — 빠진 값은 기본값으로 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePhoneData(raw: any): PhoneData {
  const base = createDefaultPhoneData()
  const c = raw && typeof raw === 'object' ? raw : {}
  const person = (p: Partial<PhonePerson> | undefined, b: PhonePerson): PhonePerson => ({ ...b, ...(p || {}), accounts: Array.isArray(p?.accounts) ? p!.accounts : b.accounts })
  // 예전 테마(소프트 모노 · 포스터 · 다이어리)는 커스텀 색 묶음으로 옮긴다
  const legacy: Record<string, Partial<PhoneData['phone']>> = {
    mono: { homeBgColor: '#F1F1EF', cardColor: '#FFFFFF', barColor: '#E4E4E2' },
    poster: { homeBgColor: '#E7E7E7', cardColor: '#FFFFFF', barColor: '#F7F7F7' },
    grid: { homeBgColor: '#F4F4F2', cardColor: '#FFFFFF', barColor: '#5E5E5E', homePattern: true },
  }
  const legacyColors = legacy[c.phone?.theme] || {}
  const theme: PhoneThemeId = c.phone?.theme in PHONE_THEMES ? c.phone.theme : base.phone.theme
  const fonts = {
    title: c.phone?.fonts?.title in TITLE_FONTS ? c.phone.fonts.title : base.phone.fonts.title,
    number: c.phone?.fonts?.number in NUMBER_FONTS ? c.phone.fonts.number : base.phone.fonts.number,
    lockNumber: c.phone?.fonts?.lockNumber in NUMBER_FONTS ? c.phone.fonts.lockNumber : undefined,
    body: KOREAN_FONTS.some(f => f.id === c.phone?.fonts?.body) ? c.phone.fonts.body : undefined,
  }
  const appStyle: PhoneAppStyle = ['editorial', 'apps'].includes(c.phone?.appStyle) ? c.phone.appStyle : 'invite'
  const lockStyle: PhoneLockStyle = c.phone?.lockStyle === 'poster' ? 'poster' : 'photo'
  return {
    ...base,
    ...c,
    groom: person(c.groom, base.groom),
    bride: person(c.bride, base.bride),
    wedding: { ...base.wedding, ...(c.wedding || {}), venue: { ...base.wedding.venue, ...(c.wedding?.venue || {}) } },
    phone: {
      ...base.phone,
      ...legacyColors,
      ...(c.phone || {}),
      theme,
      fonts,
      appStyle,
      lockStyle,
      widgets: Array.isArray(c.phone?.widgets) ? c.phone.widgets : base.phone.widgets,
      story: Array.isArray(c.phone?.story) ? c.phone.story : base.phone.story,
      memo: Array.isArray(c.phone?.memo) ? c.phone.memo : base.phone.memo,
    },
    gallery: { images: Array.isArray(c.gallery?.images) ? c.gallery.images : [] },
    meta: { ...base.meta, ...(c.meta || {}) },
  }
}
