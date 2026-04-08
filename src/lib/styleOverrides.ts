// styleOverrides.ts - Admin customization system for individual invitations
// This allows per-invitation spacing, visibility, and font size adjustments
// without code changes affecting paid/published invitations.

export interface StyleOverrides {
  sectionSpacing?: Record<string, {
    paddingTop?: number
    paddingBottom?: number
  }>
  hiddenAreas?: string[]  // e.g. ['interview.2', 'gallery.caption', 'meetTheCouple.tags']
  fontSizes?: Record<string, number>  // e.g. {'greeting.title': 28, 'couple.names': 14}
}

/**
 * Get section padding with override support.
 * If styleOverrides is undefined or has no entry for the section, returns defaults.
 */
export function getSectionPadding(
  so: StyleOverrides | undefined,
  sectionId: string,
  defaultTop: number,
  defaultBottom: number
): { paddingTop: number; paddingBottom: number } {
  if (!so?.sectionSpacing?.[sectionId]) {
    return { paddingTop: defaultTop, paddingBottom: defaultBottom }
  }
  const override = so.sectionSpacing[sectionId]
  return {
    paddingTop: override.paddingTop ?? defaultTop,
    paddingBottom: override.paddingBottom ?? defaultBottom,
  }
}

/**
 * Check if an area should be hidden.
 * Returns false if styleOverrides is undefined.
 */
export function isHidden(so: StyleOverrides | undefined, areaId: string): boolean {
  if (!so?.hiddenAreas) return false
  return so.hiddenAreas.includes(areaId)
}

/**
 * Get font size with override support.
 * Returns CSS string like '14px'.
 */
export function getFontSize(
  so: StyleOverrides | undefined,
  key: string,
  defaultPx: number
): string {
  if (!so?.fontSizes?.[key]) return `${defaultPx}px`
  return `${so.fontSizes[key]}px`
}

/**
 * Get section padding as inline style object for convenience.
 */
export function getSectionPaddingStyle(
  so: StyleOverrides | undefined,
  sectionId: string,
  defaultTop: number,
  defaultBottom: number
): React.CSSProperties {
  const { paddingTop, paddingBottom } = getSectionPadding(so, sectionId, defaultTop, defaultBottom)
  // 음수값은 padding 대신 margin으로 처리 (섹션 간격 좁히기)
  const style: React.CSSProperties = {}
  if (paddingTop >= 0) style.paddingTop = paddingTop; else style.marginTop = paddingTop
  if (paddingBottom >= 0) style.paddingBottom = paddingBottom; else style.marginBottom = paddingBottom
  return style
}

// Template-specific section definitions for the admin UI
export interface SectionDef {
  id: string
  label: string
  defaultTop: number
  defaultBottom: number
}

export interface HideableDef {
  id: string
  label: string
}

export interface FontSizeDef {
  key: string
  label: string
  defaultPx: number
  min: number
  max: number
}

export function getTemplateSections(templateId: string): SectionDef[] {
  // IDs must match the MAPPED padding IDs used by getSectionPaddingStyle(so, soMap[sectionId] || sectionId, ...)
  // in each template renderer. Each ID here corresponds to what the rendering code looks up in so.sectionSpacing.

  if (templateId === 'narrative-magazine') {
    // Magazine soMap: meetTheCouple→couple, featureInterview→interview, photoSpread→gallery,
    // theDetails/guidance/contacts→info, thankYou→thankYou, guestbook→guestbook, rsvp→rsvp
    return [
      { id: 'couple', label: '커플 소개 (Meet the Couple)', defaultTop: 0, defaultBottom: 0 },
      { id: 'interview', label: '인터뷰 (Feature Interview)', defaultTop: 0, defaultBottom: 0 },
      { id: 'gallery', label: '갤러리 (Photo Spread)', defaultTop: 0, defaultBottom: 0 },
      { id: 'youtube', label: '유튜브', defaultTop: 0, defaultBottom: 0 },
      { id: 'info', label: '안내/오시는길/축의금 (공유)', defaultTop: 0, defaultBottom: 0 },
      { id: 'thankYou', label: '감사 인사', defaultTop: 0, defaultBottom: 0 },
      { id: 'guestbook', label: '방명록', defaultTop: 0, defaultBottom: 0 },
      { id: 'rsvp', label: 'RSVP', defaultTop: 0, defaultBottom: 0 },
    ]
  }

  if (templateId === 'narrative-film') {
    // Film soMap: chapterTwo→couple, filmScenes→interview, chapterThree→gallery,
    // premiere→location, credits→thankYou; video/guidance/guestbook/rsvp→themselves
    return [
      { id: 'couple', label: '챕터2 - 커플 소개', defaultTop: 0, defaultBottom: 0 },
      { id: 'interview', label: '필름 씬 - 인터뷰', defaultTop: 0, defaultBottom: 0 },
      { id: 'gallery', label: '챕터3 - 갤러리', defaultTop: 0, defaultBottom: 0 },
      { id: 'video', label: '동영상', defaultTop: 0, defaultBottom: 0 },
      { id: 'location', label: '프리미어 - 웨딩 정보', defaultTop: 0, defaultBottom: 0 },
      { id: 'guidance', label: '오시는 길', defaultTop: 0, defaultBottom: 0 },
      { id: 'thankYou', label: '크레딧 - 감사 인사', defaultTop: 0, defaultBottom: 0 },
      { id: 'guestbook', label: '방명록', defaultTop: 0, defaultBottom: 0 },
      { id: 'rsvp', label: 'RSVP', defaultTop: 0, defaultBottom: 0 },
    ]
  }

  if (templateId === 'narrative-record') {
    // Record soMap: trackCouple→couple, trackOurJourney→story, trackGallery→gallery,
    // trackWeddingDay→location, bonusTrack→thankYou, fanMail→guestbook;
    // video/guidance/gift/rsvp→themselves
    return [
      { id: 'couple', label: '트랙: 커플 소개', defaultTop: 0, defaultBottom: 0 },
      { id: 'story', label: '트랙: 우리의 이야기', defaultTop: 0, defaultBottom: 0 },
      { id: 'gallery', label: '트랙: 갤러리', defaultTop: 0, defaultBottom: 0 },
      { id: 'video', label: '동영상', defaultTop: 0, defaultBottom: 0 },
      { id: 'location', label: '트랙: 웨딩데이', defaultTop: 0, defaultBottom: 0 },
      { id: 'guidance', label: '오시는 길', defaultTop: 0, defaultBottom: 0 },
      { id: 'thankYou', label: '보너스 트랙 (감사 인사)', defaultTop: 0, defaultBottom: 0 },
      { id: 'gift', label: '축의금', defaultTop: 0, defaultBottom: 0 },
      { id: 'guestbook', label: '방명록', defaultTop: 0, defaultBottom: 0 },
      { id: 'rsvp', label: 'RSVP', defaultTop: 0, defaultBottom: 0 },
    ]
  }

  // OUR/Family - styleOverrides not applied in rendering yet
  return []
}

export function getHideableAreas(templateId: string): HideableDef[] {
  // IDs must match the raw sectionId used in isHidden(so, sectionId) in each template renderer

  if (templateId === 'narrative-magazine') {
    return [
      { id: 'meetTheCouple', label: '커플 소개' },
      { id: 'featureInterview', label: '인터뷰' },
      { id: 'photoSpread', label: '갤러리' },
      { id: 'youtube', label: '유튜브' },
      { id: 'theDetails', label: '웨딩 정보' },
      { id: 'guidance', label: '오시는 길' },
      { id: 'thankYou', label: '감사 인사' },
      { id: 'contacts', label: '연락처/축의금' },
      { id: 'guestbook', label: '방명록' },
      { id: 'rsvp', label: 'RSVP' },
    ]
  }

  if (templateId === 'narrative-film') {
    return [
      { id: 'chapterTwo', label: '챕터2 (커플 소개)' },
      { id: 'filmScenes', label: '필름 씬 (인터뷰)' },
      { id: 'chapterThree', label: '챕터3 (갤러리)' },
      { id: 'video', label: '동영상' },
      { id: 'premiere', label: '프리미어 (웨딩 정보)' },
      { id: 'guidance', label: '오시는 길' },
      { id: 'credits', label: '크레딧 (감사 인사)' },
      { id: 'guestbook', label: '방명록' },
      { id: 'rsvp', label: 'RSVP' },
    ]
  }

  if (templateId === 'narrative-record') {
    return [
      { id: 'trackCouple', label: '트랙: 커플 소개' },
      { id: 'trackOurJourney', label: '트랙: 우리의 이야기' },
      { id: 'trackGallery', label: '트랙: 갤러리' },
      { id: 'video', label: '동영상' },
      { id: 'trackWeddingDay', label: '트랙: 웨딩데이' },
      { id: 'guidance', label: '오시는 길' },
      { id: 'bonusTrack', label: '보너스 트랙 (감사 인사)' },
      { id: 'gift', label: '축의금' },
      { id: 'fanMail', label: '방명록' },
      { id: 'rsvp', label: 'RSVP' },
    ]
  }

  // OUR/Family - no section-level hiding implemented yet
  return []
}

export function getFontSizeDefs(templateId: string): FontSizeDef[] {
  const common: FontSizeDef[] = [
    { key: 'greeting.title', label: '인사말 제목', defaultPx: 13, min: 8, max: 24 },
    { key: 'greeting.body', label: '인사말 본문', defaultPx: 11, min: 8, max: 20 },
    { key: 'couple.name', label: '커플 이름', defaultPx: 14, min: 10, max: 28 },
    { key: 'section.header', label: '섹션 제목', defaultPx: 12, min: 8, max: 24 },
    { key: 'body.text', label: '일반 본문', defaultPx: 11, min: 8, max: 20 },
    { key: 'interview.question', label: '인터뷰 질문', defaultPx: 13, min: 8, max: 24 },
    { key: 'interview.answer', label: '인터뷰 답변', defaultPx: 11, min: 8, max: 20 },
  ]

  if (templateId === 'narrative-film') {
    return [
      ...common,
      { key: 'film.dialogue', label: '대사', defaultPx: 13, min: 8, max: 24 },
      { key: 'film.character', label: '캐릭터명', defaultPx: 10, min: 8, max: 20 },
    ]
  }

  return common
}
