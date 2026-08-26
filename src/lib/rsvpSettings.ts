/**
 * 청첩장 content(JSON)에서 RSVP 설정을 템플릿별 형태 차이를 흡수해
 * 공통 형태로 정규화한다. (별도 RSVP 링크 페이지에서 RsvpForm에 그대로 전달)
 *
 * 두 가지 저장 형태:
 * - THE SIMPLE(narrative-the-simple): content.sections.rsvp.{ show*Option, ... }
 * - 그 외 템플릿: content.{ rsvp*Option, ... }  (editorStore/EssayInvitationData 등)
 *
 * 읽기 전용 — 원본 데이터를 변경하지 않는다.
 */

export interface NormalizedRsvpSettings {
  /** RSVP 섹션 자체가 활성인지 (숨김/비활성이면 false) */
  enabled: boolean
  /** 별도 RSVP 링크가 켜져 있는지 */
  sharedEnabled: boolean
  allowGuestCount: boolean
  showMealOption: boolean
  showShuttleOption: boolean
  showAfterPartyOption: boolean
  showPhoneOption: boolean
  showSideDetail: boolean
  sideDetailOptions?: {
    groomSelf?: boolean
    groomFather?: boolean
    groomMother?: boolean
    brideSelf?: boolean
    brideFather?: boolean
    brideMother?: boolean
  }
  notice?: string
  messagePlaceholder?: string
  /** RsvpForm 버튼 강조색 (테마색 있으면 사용, 없으면 기본) */
  primaryColor: string
  /** 별도 RSVP 링크 카카오 공유 제목 (커스텀, 미설정 시 자동) */
  shareTitle?: string
  /** 별도 RSVP 링크 카카오 공유 설명 (커스텀, 미설정 시 자동) */
  shareDescription?: string
  /** 별도 RSVP 링크 카카오 공유 썸네일 URL (커스텀, 미설정 시 자동) */
  shareImage?: string
}

const DEFAULT_PRIMARY = '#b0895f'

// content는 템플릿별로 스키마가 다른 동적 JSON이라 unknown 취급 후 안전 접근
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContent = any

export function normalizeRsvpSettings(
  templateId: string | undefined,
  content: AnyContent,
): NormalizedRsvpSettings {
  const c = content ?? {}

  if (templateId === 'narrative-the-simple') {
    const r = c.sections?.rsvp ?? {}
    const hidden = Array.isArray(c.hiddenSections) && c.hiddenSections.includes('rsvp')
    return {
      enabled: !hidden,
      sharedEnabled: !!r.sharedRsvpEnabled,
      allowGuestCount: true,
      showMealOption: !!r.showMealOption,
      showShuttleOption: !!r.showShuttleOption,
      showAfterPartyOption: !!r.showAfterPartyOption,
      showPhoneOption: !!r.showPhoneOption,
      showSideDetail: !!r.showSideDetail,
      sideDetailOptions: r.sideDetailOptions,
      notice: r.rsvpNotice || undefined,
      messagePlaceholder: r.messagePlaceholder || undefined,
      primaryColor: (typeof c.pointColor === 'string' && c.pointColor) || DEFAULT_PRIMARY,
      shareTitle: (typeof r.sharedRsvpShareTitle === 'string' && r.sharedRsvpShareTitle) || undefined,
      shareDescription: (typeof r.sharedRsvpShareDesc === 'string' && r.sharedRsvpShareDesc) || undefined,
      shareImage: (typeof r.sharedRsvpShareImage === 'string' && r.sharedRsvpShareImage) || undefined,
    }
  }

  // THE CLASSIC — RSVP 필드명이 classicRsvp* 이고, content 안의 중첩 content 객체에 저장됨
  //   (classic 저장 = JSON.stringify(ClassicInvitationData); classicRsvp*는 data.content.* → DB content.content.*)
  if (templateId === 'narrative-classic') {
    const cc = c.content ?? {}
    const hidden = Array.isArray(cc.classicHiddenSections) && cc.classicHiddenSections.includes('rsvp')
    return {
      enabled: !hidden,
      sharedEnabled: !!cc.sharedRsvpEnabled,
      allowGuestCount: true,
      showMealOption: !!cc.classicRsvpMeal,
      showShuttleOption: !!cc.classicRsvpShuttle,
      showAfterPartyOption: false, // classic은 애프터파티 옵션 없음
      showPhoneOption: !!cc.classicRsvpPhone,
      showSideDetail: !!cc.classicRsvpSideDetail,
      sideDetailOptions: undefined, // classic은 키 체계가 달라 세부옵션은 기본값(전체표시)으로 위임
      notice: cc.classicRsvpNotice || undefined,
      messagePlaceholder: cc.classicRsvpMessagePlaceholder || undefined,
      primaryColor: DEFAULT_PRIMARY,
      shareTitle: (typeof cc.sharedRsvpShareTitle === 'string' && cc.sharedRsvpShareTitle) || undefined,
      shareDescription: (typeof cc.sharedRsvpShareDesc === 'string' && cc.sharedRsvpShareDesc) || undefined,
      shareImage: (typeof cc.sharedRsvpShareImage === 'string' && cc.sharedRsvpShareImage) || undefined,
    }
  }

  // 표준 템플릿 (OUR/Magazine/Film/Record/Exhibit/Essay/Family) — content.rsvp* 형태
  return {
    enabled: c.rsvpEnabled !== false,
    sharedEnabled: !!c.sharedRsvpEnabled,
    allowGuestCount: c.rsvpAllowGuestCount !== false,
    showMealOption: !!c.rsvpMealOption,
    showShuttleOption: !!c.rsvpShuttleOption,
    showAfterPartyOption: !!c.rsvpAfterPartyOption,
    showPhoneOption: !!c.rsvpPhoneOption,
    showSideDetail: !!c.rsvpSideDetail,
    sideDetailOptions: c.rsvpSideDetailOptions,
    notice: c.rsvpNotice || undefined,
    messagePlaceholder: c.rsvpMessagePlaceholder || undefined,
    primaryColor:
      (typeof c.customPrimaryColor === 'string' && c.customPrimaryColor) ||
      (typeof c.pointColor === 'string' && c.pointColor) ||
      DEFAULT_PRIMARY,
    shareTitle: (typeof c.sharedRsvpShareTitle === 'string' && c.sharedRsvpShareTitle) || undefined,
    shareDescription: (typeof c.sharedRsvpShareDesc === 'string' && c.sharedRsvpShareDesc) || undefined,
    shareImage: (typeof c.sharedRsvpShareImage === 'string' && c.sharedRsvpShareImage) || undefined,
  }
}
