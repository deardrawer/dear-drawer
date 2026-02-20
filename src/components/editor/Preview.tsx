'use client'

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useDeferredValue, useMemo } from 'react'
import dynamic from 'next/dynamic'

// 로맨틱 폰트 크기 조정 스타일
const romanticFontStyles = `
  .font-romantic .text-\\[11px\\] { font-size: 12px !important; }
  .font-romantic .text-\\[13px\\] { font-size: 14px !important; }
  .font-romantic .text-xs { font-size: 13px !important; }
  .font-romantic .text-sm { font-size: 15px !important; }
`
import { useEditorStore, InvitationContent, PreviewSectionId } from '@/store/editorStore'
import FloatingButton from './FloatingButton'

const InvitationClientRecord = dynamic(() => import('@/app/i/[slug]/InvitationClientRecord'), { ssr: false })
const InvitationClient = dynamic(() => import('@/app/i/[slug]/InvitationClient'), { ssr: false })
const InvitationClientFamily = dynamic(() => import('@/app/i/[slug]/InvitationClientFamily'), { ssr: false })
const InvitationClientFilm = dynamic(() => import('@/app/i/[slug]/InvitationClientFilm'), { ssr: false })
const InvitationClientMagazine = dynamic(() => import('@/app/i/[slug]/InvitationClientMagazine'), { ssr: false })

type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral' | 'film-dark' | 'film-light' | 'record-coral' | 'record-rose' | 'record-peach' | 'record-bw' | 'record-lilac' | 'record-mint'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string; highlight?: string; cardText?: string; cardGray?: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#C41050', secondary: '#B8956A', accent: '#B8956A', background: '#FFF8F5', sectionBg: '#FFE8E8', cardBg: '#FFFFFF', divider: '#d4b896', text: '#3d3d3d', gray: '#555555' },
  'modern-black': { primary: '#111111', secondary: '#555555', accent: '#111111', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#3d3d3d', gray: '#555555', highlight: '#888888' },
  'romantic-blush': { primary: '#A67A7A', secondary: '#8a7068', accent: '#8a7068', background: '#FDF8F6', sectionBg: '#F8EFEC', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#3d3d3d', gray: '#555555' },
  'nature-green': { primary: '#3A5A3A', secondary: '#6A7A62', accent: '#5A7A52', background: '#F5F7F4', sectionBg: '#EBF0E8', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3d3d3d', gray: '#555555', highlight: '#5A8A52' },
  'luxury-navy': { primary: '#0f2035', secondary: '#8A6A3A', accent: '#8A6A3A', background: '#F8F9FA', sectionBg: '#E8ECF0', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#3d3d3d', gray: '#555555', highlight: '#8A6A3A' },
  'sunset-coral': { primary: '#B85040', secondary: '#B88060', accent: '#B8683A', background: '#FFFAF7', sectionBg: '#FFEEE5', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#3d3d3d', gray: '#555555' },
  'film-dark': { primary: '#E8E4DF', secondary: '#2C2C2E', accent: '#D4838F', background: '#111111', sectionBg: '#111111', cardBg: '#FFFFFF', divider: '#2A2A2A', text: '#E8E4DF', gray: '#8E8E93', cardText: '#2A2A2A', cardGray: '#888888' },
  'film-light': { primary: '#1A1A1A', secondary: '#F5F5F5', accent: '#B8977E', background: '#FFFFFF', sectionBg: '#F8F6F3', cardBg: '#FFFFFF', divider: '#E5E0DA', text: '#1A1A1A', gray: '#999999' },
  'record-coral': { primary: '#E89B8F', secondary: '#F5F1ED', accent: '#D4766A', background: '#FAF7F4', sectionBg: '#F5F1ED', cardBg: '#FFFFFF', divider: '#E8DDD5', text: '#3D3D3D', gray: '#888888' },
  'record-rose': { primary: '#E07088', secondary: '#FFF0F3', accent: '#D45C78', background: '#FFF5F7', sectionBg: '#FFF0F3', cardBg: '#FFFFFF', divider: '#F5C8D5', text: '#3D3D3D', gray: '#888888' },
  'record-peach': { primary: '#E8885A', secondary: '#FFF2EA', accent: '#DD7548', background: '#FFF7F0', sectionBg: '#FFF2EA', cardBg: '#FFFFFF', divider: '#F5D5C0', text: '#3D3D3D', gray: '#888888' },
  'record-bw': { primary: '#1A1A1A', secondary: '#F5F5F5', accent: '#333333', background: '#FFFFFF', sectionBg: '#F7F7F7', cardBg: '#FFFFFF', divider: '#E0E0E0', text: '#1A1A1A', gray: '#999999' },
  'record-lilac': { primary: '#BDB0D0', secondary: '#F3F0F7', accent: '#A89BBF', background: '#FAF8FC', sectionBg: '#F3F0F7', cardBg: '#FFFFFF', divider: '#D8D2E2', text: '#3D3D3D', gray: '#888888' },
  'record-mint': { primary: '#9CAF88', secondary: '#F0F3EC', accent: '#8A9D78', background: '#F8FAF5', sectionBg: '#F0F3EC', cardBg: '#FFFFFF', divider: '#CDD8C2', text: '#3D3D3D', gray: '#888888' },
}

// Accent color → light tint utility (blend with white)
function getAccentTint(hex: string, whiteMix: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const tr = Math.round(r + (255 - r) * whiteMix)
  const tg = Math.round(g + (255 - g) * whiteMix)
  const tb = Math.round(b + (255 - b) * whiteMix)
  return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`
}

type FontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'
interface FontConfig { display: string; displayKr: string; body: string }

const fontStyles: Record<FontStyle, FontConfig> = {
  classic: { display: "'Playfair Display', serif", displayKr: "'Ridibatang', serif", body: "'Ridibatang', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Pretendard', sans-serif", body: "'Pretendard', sans-serif" },
  romantic: { display: "'Lora', serif", displayKr: "'Okticon', serif", body: "'Okticon', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'JeonnamEducationBarun', sans-serif", body: "'JeonnamEducationBarun', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'ELandChoice', serif", body: "'ELandChoice', serif" },
}

// Record Preview Wrapper - Zustand data → InvitationClientRecord props
function RecordPreviewWrapper({ invitation, skipIntro }: { invitation: InvitationContent; skipIntro: boolean }) {
  const content = useMemo(() => ({
    templateId: 'record',
    colorTheme: invitation.colorTheme || 'record-coral',
    fontStyle: invitation.fontStyle || 'modern',
    customAccentColor: invitation.customAccentColor,
    groom: invitation.groom,
    bride: invitation.bride,
    wedding: invitation.wedding,
    relationship: invitation.relationship,
    content: invitation.content,
    gallery: invitation.gallery,
    media: invitation.media,
    design: invitation.design,
    bgm: invitation.bgm,
    rsvpEnabled: invitation.rsvpEnabled,
    rsvpDeadline: invitation.rsvpDeadline,
    rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
    sectionVisibility: invitation.sectionVisibility,
    guidance: invitation.guidance,
    deceasedDisplayStyle: invitation.deceasedDisplayStyle,
    meta: invitation.meta,
    youtube: (invitation as any).youtube,
  }), [invitation])

  const invitationData = useMemo(() => ({
    id: 'preview',
    groom_name: invitation.groom.name,
    bride_name: invitation.bride.name,
    wedding_date: invitation.wedding.date,
    wedding_time: invitation.wedding.timeDisplay,
    venue_name: invitation.wedding.venue.name,
    venue_address: invitation.wedding.venue.address,
    greeting_message: invitation.content.greeting,
    content: JSON.stringify(content),
    is_paid: 1,
    is_published: 0,
  }), [invitation, content])

  return (
    <InvitationClientRecord
      invitation={invitationData as any}
      content={content as any}
      isPaid={true}
      isPreview={true}
      skipIntro={skipIntro}
    />
  )
}

// Generic Preview Wrapper - Zustand data → InvitationClient props (OUR, Family, Film, Magazine)
function InvitationPreviewWrapper({ invitation, skipIntro }: { invitation: InvitationContent; skipIntro: boolean }) {
  const content = useMemo(() => ({
    templateId: invitation.templateId,
    colorTheme: invitation.colorTheme || 'classic-rose',
    fontStyle: invitation.fontStyle || 'modern',
    customAccentColor: invitation.customAccentColor,
    groom: invitation.groom,
    bride: invitation.bride,
    wedding: invitation.wedding,
    relationship: invitation.relationship,
    content: invitation.content,
    gallery: invitation.gallery,
    media: invitation.media,
    design: invitation.design,
    bgm: invitation.bgm,
    rsvpEnabled: invitation.rsvpEnabled,
    rsvpDeadline: invitation.rsvpDeadline,
    rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
    sectionVisibility: invitation.sectionVisibility,
    guidance: invitation.guidance,
    deceasedDisplayStyle: invitation.deceasedDisplayStyle,
    meta: invitation.meta,
    accentTextColor: invitation.accentTextColor,
    bodyTextColor: invitation.bodyTextColor,
    highlightColor: invitation.highlightColor,
    profileTextStyle: (invitation as any).profileTextStyle,
    interviewTextStyle: (invitation as any).interviewTextStyle,
    intro: (invitation as any).intro,
    youtube: (invitation as any).youtube,
    magazineIntroStyle: (invitation as any).magazineIntroStyle,
  }), [invitation])

  const invitationData = useMemo(() => ({
    id: 'preview',
    groom_name: invitation.groom.name,
    bride_name: invitation.bride.name,
    wedding_date: invitation.wedding.date,
    wedding_time: invitation.wedding.timeDisplay,
    venue_name: invitation.wedding.venue.name,
    venue_address: invitation.wedding.venue.address,
    greeting_message: invitation.content.greeting,
    content: JSON.stringify(content),
    is_paid: 1,
    is_published: 0,
  }), [invitation, content])

  const ClientComponent = useMemo(() => {
    switch (invitation.templateId) {
      case 'narrative-family': return InvitationClientFamily
      case 'narrative-film': return InvitationClientFilm
      case 'narrative-magazine': return InvitationClientMagazine
      default: return InvitationClient
    }
  }, [invitation.templateId])

  return (
    <ClientComponent
      invitation={invitationData as any}
      content={content as any}
      isPaid={true}
      isPreview={true}
      skipIntro={skipIntro}
    />
  )
}

type PageType = 'intro' | 'main'

export interface PreviewHandle {
  scrollToTop: () => void
}

const Preview = forwardRef<PreviewHandle, object>(function Preview(_, ref) {
  const { invitation: rawInvitation, template, activeSection, wizardStep } = useEditorStore()
  // useDeferredValue: 타이핑 시 입력이 먼저 처리되고 Preview 리렌더링은 낮은 우선순위로 지연
  const invitation = useDeferredValue(rawInvitation)
  const [currentPage, setCurrentPage] = useState<PageType>('intro')
  const previewContentRef = useRef<HTMLDivElement>(null)

  // 탭 전환 안정화를 위한 refs
  const userTabClickRef = useRef(false) // 사용자가 직접 탭을 클릭했는지 추적
  const userTabClickTimeoutRef = useRef<NodeJS.Timeout | null>(null) // 클릭 후 잠금 해제 타이머
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null) // 스크롤 타이머 정리용
  const lastPageRef = useRef<PageType>('intro') // 최신 페이지 상태 추적 (closure 문제 해결)

  // 페이지 변경 시 ref도 업데이트
  useEffect(() => {
    lastPageRef.current = currentPage
  }, [currentPage])

  // 외부에서 호출 가능한 메서드 노출
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      setCurrentPage('intro')
      // 스크롤 타이머 정리
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        previewContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }))

  // 사용자 탭 클릭 핸들러 (스크롤 이동 없이 탭만 전환)
  const handleTabClick = useCallback((page: PageType) => {
    // 이미 같은 페이지면 무시
    if (lastPageRef.current === page) return

    // 사용자 클릭 플래그 설정 (시스템 자동 전환 방지)
    userTabClickRef.current = true

    // 이전 타이머 정리
    if (userTabClickTimeoutRef.current) {
      clearTimeout(userTabClickTimeoutRef.current)
    }

    // 페이지 전환 (스크롤 없음)
    setCurrentPage(page)

    // 500ms 후 플래그 해제 (연속 클릭 보호)
    userTabClickTimeoutRef.current = setTimeout(() => {
      userTabClickRef.current = false
    }, 500)
  }, [])

  // 위자드 스텝에 따른 미리보기 페이지 매핑 (5단계 위자드)
  const wizardStepToPage: Record<number, PageType> = {
    1: 'intro',    // 디자인 → 인트로
    2: 'intro',    // 인트로 → 인트로
    3: 'main',     // 스토리 → 메인
    4: 'main',     // 추가기능 → 메인
    5: 'intro',    // 발행 → 인트로
  }

  // 위자드 스텝이 변경되면 해당 페이지로 전환 (사용자 클릭 시 무시)
  useEffect(() => {
    if (!wizardStep) return
    // 사용자가 직접 탭을 클릭한 경우 시스템 자동 전환 무시
    if (userTabClickRef.current) return

    const targetPage = wizardStepToPage[wizardStep]
    if (targetPage && targetPage !== lastPageRef.current) {
      setCurrentPage(targetPage)
    }
  }, [wizardStep])

  // activeSection이 변경되면 해당 섹션으로 스크롤 (사용자 클릭 시 무시)
  useEffect(() => {
    if (!activeSection || !previewContentRef.current) return
    // 사용자가 직접 탭을 클릭한 경우 시스템 자동 전환 무시
    if (userTabClickRef.current) return

    // intro 관련 섹션이면 intro 페이지로, 아니면 main 페이지로 전환
    const introSections: PreviewSectionId[] = ['intro-cover', 'invitation', 'venue-info']
    const isIntroSection = introSections.includes(activeSection)

    if (isIntroSection && lastPageRef.current !== 'intro') {
      setCurrentPage('intro')
    } else if (!isIntroSection && lastPageRef.current !== 'main') {
      setCurrentPage('main')
    }

    // 이전 스크롤 타이머 정리
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // 페이지 전환 후 스크롤 (약간의 딜레이 필요)
    scrollTimeoutRef.current = setTimeout(() => {
      const element = document.getElementById(`preview-${activeSection}`)
      if (element && previewContentRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [activeSection])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (userTabClickTimeoutRef.current) {
        clearTimeout(userTabClickTimeoutRef.current)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  if (!invitation || !template) return <div className="h-full flex items-center justify-center bg-gray-100"><p className="text-gray-400">Loading...</p></div>
  const fonts = fontStyles[invitation.fontStyle || 'classic']
  const baseThemeColors = colorThemes[invitation.colorTheme || 'classic-rose']
  const isRomantic = invitation.fontStyle === 'romantic'

  // 커스텀 텍스트 색상을 테마에 오버라이드 (사용자 설정이 있으면 적용)
  const themeColors: ColorConfig = {
    ...baseThemeColors,
    text: invitation.bodyTextColor || baseThemeColors.text,
    highlight: invitation.accentTextColor || baseThemeColors.highlight || baseThemeColors.primary,
  }
  const customAccentTextColor = invitation.accentTextColor
  const customBodyTextColor = invitation.bodyTextColor || baseThemeColors.text
  return (
    <div className="h-full bg-white flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: romanticFontStyles }} />
      <div className="sticky top-0 z-10 bg-white py-4 flex justify-center shrink-0">
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => handleTabClick('intro')}
            className={`px-6 py-2.5 text-sm font-medium transition-all select-none ${currentPage === 'intro' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Intro
          </button>
          <button
            onClick={() => handleTabClick('main')}
            className={`px-6 py-2.5 text-sm font-medium transition-all select-none ${currentPage === 'main' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Main
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex justify-center px-6 pb-6">
        <div className="relative">
          <div className="w-[360px] shadow-2xl bg-white flex flex-col relative border border-gray-200" style={{ height: '710px' }}>
            <div ref={previewContentRef} className={`flex-1 overflow-y-auto min-h-0 relative theme-${invitation.colorTheme || 'classic-rose'} ${isRomantic ? 'font-romantic' : ''}`} id="preview-content" style={{ fontFamily: fonts.body, color: customBodyTextColor, letterSpacing: '-0.3px', ...(customAccentTextColor ? { '--text-accent': customAccentTextColor } as React.CSSProperties : {}), ...(invitation.highlightColor ? { '--highlight-white': invitation.highlightColor } as React.CSSProperties : {}) }}>
              {invitation.templateId === 'narrative-record'
                ? <RecordPreviewWrapper invitation={invitation} skipIntro={currentPage !== 'intro'} />
                : <InvitationPreviewWrapper invitation={invitation} skipIntro={currentPage !== 'intro'} />
              }
            </div>
            {/* Floating Button - 항상 표시, Step 4(추가기능)에서는 툴팁 표시 */}
            {/* Movie 템플릿: 햄버거 시트에 accent 컬러 틴트 적용 */}
            <FloatingButton themeColors={(() => {
              if (invitation.templateId === 'narrative-film') {
                const filmAccent = invitation.customAccentColor || themeColors.accent
                return {
                  ...themeColors,
                  sectionBg: getAccentTint(filmAccent, 0.88),
                  background: getAccentTint(filmAccent, 0.82),
                  ...(themeColors.cardText ? {
                    primary: themeColors.cardText,
                    text: themeColors.cardText,
                    gray: themeColors.cardGray || themeColors.gray,
                  } : {}),
                }
              }
              return themeColors
            })()} fonts={fonts} showTooltip={wizardStep === 4} invitation={{
                venue_name: invitation.wedding.venue.name,
                venue_address: invitation.wedding.venue.address,
                groom_name: invitation.groom.name,
                bride_name: invitation.bride.name,
                groom_father_name: invitation.groom.father.name,
                groom_mother_name: invitation.groom.mother.name,
                bride_father_name: invitation.bride.father.name,
                bride_mother_name: invitation.bride.mother.name,
                groom_phone: invitation.groom.phone,
                bride_phone: invitation.bride.phone,
                groom_father_phone: invitation.groom.father.phone,
                groom_mother_phone: invitation.groom.mother.phone,
                bride_father_phone: invitation.bride.father.phone,
                bride_mother_phone: invitation.bride.mother.phone,
                groom_bank_info: invitation.groom.bank,
                groom_father_bank_info: invitation.groom.father.bank,
                groom_mother_bank_info: invitation.groom.mother.bank,
                bride_bank_info: invitation.bride.bank,
                bride_father_bank_info: invitation.bride.father.bank,
                bride_mother_bank_info: invitation.bride.mother.bank,
                directions: invitation.wedding.directions,
                rsvpEnabled: invitation.rsvpEnabled,
                rsvpAllowGuestCount: invitation.rsvpAllowGuestCount,
              }} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default Preview
