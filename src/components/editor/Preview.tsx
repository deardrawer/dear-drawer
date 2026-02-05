'use client'

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

// 로맨틱 폰트 크기 조정 스타일
const romanticFontStyles = `
  .font-romantic .text-\\[11px\\] { font-size: 12px !important; }
  .font-romantic .text-\\[13px\\] { font-size: 14px !important; }
  .font-romantic .text-xs { font-size: 13px !important; }
  .font-romantic .text-sm { font-size: 15px !important; }
`
import { useEditorStore, InvitationContent, PreviewSectionId } from '@/store/editorStore'
import { parseHighlight } from '@/lib/textUtils'
import {
  SAMPLE_GREETING,
  SAMPLE_QUOTE,
  SAMPLE_PROFILES,
  SAMPLE_STORIES,
  SAMPLE_INTERVIEWS,
  SAMPLE_VENUE,
  SAMPLE_DIRECTIONS,
  SAMPLE_THANK_YOU,
  SAMPLE_FAMILY,
  isEmpty,
  isStoryEmpty,
  isInterviewEmpty,
} from '@/lib/sampleData'
import FloatingButton from './FloatingButton'
import ProfileImageSlider from './ProfileImageSlider'

// BGM Player Component (에디터 미리보기용 - 자동재생 비활성화)
function BgmPlayer({ bgm }: { bgm: InvitationContent['bgm'] }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // 에디터에서는 자동재생 비활성화 (수동 재생만 가능)

  if (!bgm?.enabled || !bgm.url) return null

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={bgm.url} loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      <button
        onClick={togglePlay}
        className="fixed bottom-24 right-4 z-50 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </>
  )
}

type ColorTheme = 'classic-rose' | 'modern-black' | 'romantic-blush' | 'nature-green' | 'luxury-navy' | 'sunset-coral'
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string; highlight?: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#C41050', secondary: '#B8956A', accent: '#B8956A', background: '#FFF8F5', sectionBg: '#FFE8E8', cardBg: '#FFFFFF', divider: '#d4b896', text: '#3d3d3d', gray: '#555555' },
  'modern-black': { primary: '#111111', secondary: '#555555', accent: '#111111', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#3d3d3d', gray: '#555555', highlight: '#888888' },
  'romantic-blush': { primary: '#A67A7A', secondary: '#8a7068', accent: '#8a7068', background: '#FDF8F6', sectionBg: '#F8EFEC', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#3d3d3d', gray: '#555555' },
  'nature-green': { primary: '#3A5A3A', secondary: '#6A7A62', accent: '#5A7A52', background: '#F5F7F4', sectionBg: '#EBF0E8', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3d3d3d', gray: '#555555', highlight: '#5A8A52' },
  'luxury-navy': { primary: '#0f2035', secondary: '#8A6A3A', accent: '#8A6A3A', background: '#F8F9FA', sectionBg: '#E8ECF0', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#3d3d3d', gray: '#555555', highlight: '#8A6A3A' },
  'sunset-coral': { primary: '#B85040', secondary: '#B88060', accent: '#B8683A', background: '#FFFAF7', sectionBg: '#FFEEE5', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#3d3d3d', gray: '#555555' },
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

// 이미지 크롭 스타일 계산 헬퍼 함수
function getImageCropStyle(img: string, s: { scale?: number; positionX?: number; positionY?: number; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }) {
  const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)

  if (hasCropData) {
    const cw = s.cropWidth || 1
    const ch = s.cropHeight || 1
    const cx = s.cropX || 0
    const cy = s.cropY || 0
    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100

    return {
      backgroundImage: `url(${img})`,
      backgroundSize: `${100 / cw}% ${100 / ch}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat' as const,
    }
  }

  // 기존 scale/position 방식 (호환성 유지)
  return {
    backgroundImage: `url(${img})`,
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
  }
}

function formatDateDisplay(d: string): string {
  if (!d) return '2024.11.04'
  const date = new Date(d), y = date.getFullYear(), m = date.getMonth() + 1, day = date.getDate()
  const w = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]
  return y + '.' + m + '.' + day + ' ' + w
}

function calculateDday(d: string): string {
  if (!d) return 'D-000'
  const wedding = new Date(d), today = new Date()
  today.setHours(0,0,0,0); wedding.setHours(0,0,0,0)
  const diff = Math.ceil((wedding.getTime() - today.getTime()) / (1000*60*60*24))
  return diff > 0 ? 'D-' + diff : diff === 0 ? 'D-Day' : 'D+' + Math.abs(diff)
}

// 함께한 시간 계산 (처음 만난 날부터 오늘까지)
function calculateRelationshipDuration(startDate: string): { days: number; weeks: number; years: number; months: number } | null {
  if (!startDate) return null
  const start = new Date(startDate), today = new Date()
  start.setHours(0,0,0,0); today.setHours(0,0,0,0)

  const diffTime = today.getTime() - start.getTime()
  if (diffTime < 0) return null // 미래 날짜는 표시 안함

  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)

  // 년/월 계산
  let years = today.getFullYear() - start.getFullYear()
  let months = today.getMonth() - start.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (today.getDate() < start.getDate()) {
    months--
    if (months < 0) {
      years--
      months += 12
    }
  }

  return { days, weeks, years, months }
}
// 국화 아이콘 (고인 표시 - 꽃 스타일)
const ChrysanthemumIcon = () => (
  <img
    src="/icons/chrysanthemum.svg"
    alt="고인"
    className="inline w-3 h-3 mr-0.5 opacity-70 align-middle"
    style={{ verticalAlign: 'middle', marginTop: '-2px' }}
  />
);

// 한자 故 표시 (고인 표시 - 한자 스타일)
const HanjaDeceasedIcon = () => (
  <span className="inline-block mr-0.5 text-[10px] opacity-70">故</span>
);

// 부모님 이름 표시 (고인 시 선택된 스타일로 표시)
const ParentName = ({ name, deceased, displayStyle = 'flower' }: { name: string; deceased?: boolean; displayStyle?: 'hanja' | 'flower' }) => (
  <span>
    {deceased && (displayStyle === 'hanja' ? <HanjaDeceasedIcon /> : <ChrysanthemumIcon />)}
    {name}
  </span>
);



type PageType = 'intro' | 'main'

export interface PreviewHandle {
  scrollToTop: () => void
}

const Preview = forwardRef<PreviewHandle, object>(function Preview(_, ref) {
  const { invitation, template, activeSection, wizardStep } = useEditorStore()
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
  const groomName = invitation.groom.name || 'Groom', brideName = invitation.bride.name || 'Bride'
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
            <div ref={previewContentRef} className={`flex-1 overflow-y-auto min-h-0 relative theme-${invitation.colorTheme || 'classic-rose'} ${isRomantic ? 'font-romantic' : ''}`} id="preview-content" style={{ fontFamily: fonts.body, color: customBodyTextColor, letterSpacing: '-0.3px', ...(customAccentTextColor ? { '--text-accent': customAccentTextColor } as React.CSSProperties : {}) }}>
              {currentPage === 'intro'
                ? <IntroPage invitation={invitation} groomName={groomName} brideName={brideName} fonts={fonts} themeColors={themeColors} />
                : invitation.templateId === 'narrative-family'
                  ? <FamilyMainPage invitation={invitation} groomName={groomName} brideName={brideName} fonts={fonts} themeColors={themeColors} />
                  : <MainPage invitation={invitation} groomName={groomName} brideName={brideName} fonts={fonts} themeColors={themeColors} />
              }
            </div>
            {/* Floating Button - 항상 표시, Step 4(추가기능)에서는 툴팁 표시 */}
            <FloatingButton themeColors={themeColors} fonts={fonts} showTooltip={wizardStep === 4} invitation={{
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

interface PageProps { invitation: InvitationContent; groomName: string; brideName: string; fonts: FontConfig; themeColors: ColorConfig }

function IntroPage({ invitation, groomName, brideName, fonts, themeColors }: PageProps) {
  const introAnimation = invitation.design?.introAnimation || 'fade-in'
  const coverTitle = invitation.design?.coverTitle || invitation.wedding.title || 'OUR WEDDING'
  return (
    <div>
      {/* BGM Player */}
      <BgmPlayer bgm={invitation.bgm} />

      <section id="preview-intro-cover" className={`relative flex flex-col justify-center items-center overflow-hidden ${introAnimation !== 'none' ? `intro-animation-${introAnimation}` : ''}`} style={{ height: '716px' }}>
        <div className="absolute inset-0" style={invitation.media.coverImage ? getImageCropStyle(invitation.media.coverImage, invitation.media.coverImageSettings || {}) : { background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center text-white px-5">
          <p className="text-[13px] font-light mb-4" style={{ fontFamily: fonts.displayKr, letterSpacing: '2px' }}>{groomName} & {brideName}</p>
          <h1 className="text-2xl mb-5" style={{ fontFamily: fonts.display, letterSpacing: '6px', fontWeight: 400 }}>{coverTitle}</h1>
          <p className="text-[10px] font-light mb-2" style={{ letterSpacing: '4px' }}>{invitation.wedding.venue.name || 'VENUE NAME'}</p>
          <p className="text-[11px] font-light" style={{ fontFamily: fonts.displayKr, letterSpacing: '1px' }}>{formatDateDisplay(invitation.wedding.date)} {invitation.wedding.timeDisplay || '2:00 PM'}</p>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-[10px] text-white/70 mb-2">Scroll</span>
          <div className="w-px h-6 bg-gradient-to-b from-white/60 to-transparent" />
          <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce mt-1" />
        </div>
      </section>
      <section id="preview-invitation" className="px-7 py-10 text-center" style={{ background: themeColors.background }}>
        <p className="text-[10px] font-light mb-9" style={{ color: themeColors.gray, letterSpacing: '4px' }}>INVITATION</p>
        <div className={`py-5 mb-9 ${isEmpty(invitation.content.quote?.text) ? 'opacity-50' : ''}`} style={{ borderTop: `1px solid ${themeColors.divider}`, borderBottom: `1px solid ${themeColors.divider}` }}><p className="text-[13px] font-light leading-[1.9] mb-2" style={{ fontFamily: fonts.displayKr, color: themeColors.highlight || themeColors.primary }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.content.quote?.text || SAMPLE_QUOTE.text) }} /><p className="text-[11px] font-light" style={{ color: themeColors.gray }}>{invitation.content.quote?.author || SAMPLE_QUOTE.author}</p></div>
        <div className={`mb-11 ${isEmpty(invitation.content.greeting) ? 'opacity-50' : ''}`}><p className="text-[13px] font-light leading-[2.1]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.content.greeting || SAMPLE_GREETING) }} /></div>
        {/* 부모님 정보 */}
        <div className="mb-9 text-center" style={{ fontFamily: fonts.displayKr }}>
          {(invitation.groom.father.name || invitation.groom.mother.name) && (
          <div className="mb-3">
            <p className="text-[11px] font-light leading-[2]" style={{ color: themeColors.text }}>
              {invitation.groom.father.name && <><ParentName name={invitation.groom.father.name} deceased={invitation.groom.father.deceased} displayStyle={invitation.deceasedDisplayStyle} />{invitation.groom.mother.name && ' · '}</>}
              {invitation.groom.mother.name && <><ParentName name={invitation.groom.mother.name} deceased={invitation.groom.mother.deceased} displayStyle={invitation.deceasedDisplayStyle} /></>}
              <span style={{ color: themeColors.gray }}> 의 아들 </span>
              <span style={{ color: themeColors.highlight || themeColors.primary, fontWeight: 500 }}>{groomName}</span>
            </p>
          </div>
          )}
          {(invitation.bride.father.name || invitation.bride.mother.name) && (
          <div>
            <p className="text-[11px] font-light leading-[2]" style={{ color: themeColors.text }}>
              {invitation.bride.father.name && <><ParentName name={invitation.bride.father.name} deceased={invitation.bride.father.deceased} displayStyle={invitation.deceasedDisplayStyle} />{invitation.bride.mother.name && ' · '}</>}
              {invitation.bride.mother.name && <><ParentName name={invitation.bride.mother.name} deceased={invitation.bride.mother.deceased} displayStyle={invitation.deceasedDisplayStyle} /></>}
              <span style={{ color: themeColors.gray }}> 의 딸 </span>
              <span style={{ color: themeColors.highlight || themeColors.primary, fontWeight: 500 }}>{brideName}</span>
            </p>
          </div>
          )}
        </div>
        <div id="preview-venue-info" className="rounded-2xl px-6 py-7 mb-9" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)' }}>
          <span className="inline-block text-[9px] font-light px-3 py-1 rounded-full mb-5" style={{ background: '#f0f0f0', color: '#888' }}>Until wedding {calculateDday(invitation.wedding.date)}</span>
          <div className="pb-4 mb-4 border-b border-gray-100"><p className="text-lg font-light mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '3px' }}>{formatDateDisplay(invitation.wedding.date)}</p><p className="text-[11px] font-light" style={{ color: '#777' }}>{invitation.wedding.timeDisplay || '2:00 PM'}</p></div>
          <div className={`mb-5 ${isEmpty(invitation.wedding.venue.address) ? 'opacity-50' : ''}`}><p className="text-xs mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>{invitation.wedding.venue.name || SAMPLE_VENUE.name}{!invitation.wedding.venue.hideHall && ` ${invitation.wedding.venue.hall || SAMPLE_VENUE.hall}`}</p><p className="text-[10px] font-light" style={{ color: '#999' }}>{invitation.wedding.venue.address || SAMPLE_VENUE.address}</p></div>
          <button className="px-7 py-2.5 border border-gray-300 rounded-md text-[10px] font-light" style={{ color: '#666' }}>Get Directions</button>
        </div>
        <div className="flex flex-col items-center"><span className="text-[13px] font-light" style={{ color: themeColors.gray, fontFamily: fonts.displayKr }}>다음 이야기</span><div className="flex flex-col items-center mt-4"><div className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${themeColors.gray}, transparent)` }} /><div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColors.gray, opacity: 0.6 }} /></div></div>
      </section>
    </div>
  )
}

function MainPage({ invitation, groomName, brideName, fonts, themeColors }: PageProps) {
  const sectionVisibility = invitation.sectionVisibility || {
    coupleProfile: true, ourStory: true, interview: true, guidance: true, bankAccounts: true, guestbook: true
  }

  return (
    <div className="relative">
      {/* BGM Player */}
      <BgmPlayer bgm={invitation.bgm} />

      <section className="py-20 px-7 text-center" style={{ background: themeColors.cardBg }}>
        <div className="w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} />
        <div style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: themeColors.text, letterSpacing: '3px', lineHeight: 1.9 }}><span className="block">{groomName} & {brideName}</span><span className="block">결혼합니다.</span></div>
        <div className="w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} />
      </section>

      {/* Couple Profile Section - with visibility toggle and sample fallback */}
      {sectionVisibility.coupleProfile && (
        <>
          {/* First Profile - depends on profileOrder */}
          <section id="preview-couple-profile" className="px-7 py-14" style={{ background: themeColors.sectionBg }}>
            <ProfileImageSlider
              images={invitation.profileOrder === 'bride-first' ? invitation.bride.profile.images : invitation.groom.profile.images}
              imageSettings={invitation.profileOrder === 'bride-first' ? invitation.bride.profile.imageSettings : invitation.groom.profile.imageSettings}
              className="mb-10"
            />
            <div className="text-center mb-8">
              <p className="text-[10px] font-light mb-4 anim-underline revealed" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '3px', display: 'inline-block' }}>
                {invitation.profileOrder === 'bride-first' ? invitation.bride.profile.aboutLabel : invitation.groom.profile.aboutLabel}
              </p>
              <p className="text-[11px] font-light" style={{ color: '#999' }}>
                {invitation.profileOrder === 'bride-first' ? invitation.bride.profile.subtitle : invitation.groom.profile.subtitle}
              </p>
            </div>
            <div
              className={`text-xs font-light ${isEmpty(invitation.profileOrder === 'bride-first' ? invitation.bride.profile.intro : invitation.groom.profile.intro) ? 'opacity-50' : ''}`}
              style={{ fontFamily: fonts.displayKr, color: themeColors.text, lineHeight: invitation.profileTextStyle?.lineHeight || 2.2, textAlign: invitation.profileTextStyle?.textAlign || 'left' }}
              dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.profileOrder === 'bride-first' ? (invitation.bride.profile.intro || SAMPLE_PROFILES.bride.intro) : (invitation.groom.profile.intro || SAMPLE_PROFILES.groom.intro)) }}
            />
            {((invitation.profileOrder === 'bride-first' ? invitation.bride.profile.tag : invitation.groom.profile.tag) || isEmpty(invitation.profileOrder === 'bride-first' ? invitation.bride.profile.intro : invitation.groom.profile.intro)) &&
              <div className={`inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md text-[10px] font-light ${isEmpty(invitation.profileOrder === 'bride-first' ? invitation.bride.profile.intro : invitation.groom.profile.intro) ? 'opacity-50' : ''}`} style={{ background: 'rgba(0,0,0,0.03)', color: '#777' }}>
                &#9829; {invitation.profileOrder === 'bride-first' ? (invitation.bride.profile.tag || SAMPLE_PROFILES.bride.tag) : (invitation.groom.profile.tag || SAMPLE_PROFILES.groom.tag)}
              </div>
            }
          </section>
          {/* Second Profile - depends on profileOrder */}
          <section className="px-7 py-14" style={{ background: themeColors.sectionBg }}>
            <ProfileImageSlider
              images={invitation.profileOrder === 'bride-first' ? invitation.groom.profile.images : invitation.bride.profile.images}
              imageSettings={invitation.profileOrder === 'bride-first' ? invitation.groom.profile.imageSettings : invitation.bride.profile.imageSettings}
              className="mb-10"
            />
            <div className="text-center mb-8">
              <p className="text-[10px] font-light mb-4 anim-underline revealed" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '3px', display: 'inline-block' }}>
                {invitation.profileOrder === 'bride-first' ? invitation.groom.profile.aboutLabel : invitation.bride.profile.aboutLabel}
              </p>
              <p className="text-[11px] font-light" style={{ color: '#999' }}>
                {invitation.profileOrder === 'bride-first' ? invitation.groom.profile.subtitle : invitation.bride.profile.subtitle}
              </p>
            </div>
            <div
              className={`text-xs font-light ${isEmpty(invitation.profileOrder === 'bride-first' ? invitation.groom.profile.intro : invitation.bride.profile.intro) ? 'opacity-50' : ''}`}
              style={{ fontFamily: fonts.displayKr, color: themeColors.text, lineHeight: invitation.profileTextStyle?.lineHeight || 2.2, textAlign: invitation.profileTextStyle?.textAlign || 'left' }}
              dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.profileOrder === 'bride-first' ? (invitation.groom.profile.intro || SAMPLE_PROFILES.groom.intro) : (invitation.bride.profile.intro || SAMPLE_PROFILES.bride.intro)) }}
            />
            {((invitation.profileOrder === 'bride-first' ? invitation.groom.profile.tag : invitation.bride.profile.tag) || isEmpty(invitation.profileOrder === 'bride-first' ? invitation.groom.profile.intro : invitation.bride.profile.intro)) &&
              <div className={`inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md text-[10px] font-light ${isEmpty(invitation.profileOrder === 'bride-first' ? invitation.groom.profile.intro : invitation.bride.profile.intro) ? 'opacity-50' : ''}`} style={{ background: 'rgba(0,0,0,0.03)', color: '#777' }}>
                &#9829; {invitation.profileOrder === 'bride-first' ? (invitation.groom.profile.tag || SAMPLE_PROFILES.groom.tag) : (invitation.bride.profile.tag || SAMPLE_PROFILES.bride.tag)}
              </div>
            }
          </section>
        </>
      )}

      {/* Our Story Section - with visibility toggle and sample fallback */}
      {sectionVisibility.ourStory && (
        <section id="preview-our-story" className="py-16 px-7 text-center" style={{ background: themeColors.cardBg }}>
          <div className="w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} />
          <p className="text-sm font-light mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '1px' }}>사랑이 시작된 작은 순간들</p>
          <div className="w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} />
        </section>
      )}
      {sectionVisibility.ourStory && (() => {
        const hasRealStories = invitation.relationship.stories.some(s => s.title || s.desc)
        const storiesToShow = hasRealStories ? invitation.relationship.stories : SAMPLE_STORIES
        return storiesToShow.map((story, index) => (story.title || story.desc) ? (
          <section key={index} className={`px-7 py-14 text-center ${!hasRealStories ? 'opacity-50' : ''}`} style={{ background: themeColors.sectionBg }}>
            {story.date && <p className="text-[10px] font-light mb-3" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '2px' }}>{story.date}</p>}
            {story.title && <p className="text-[15px] mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>{story.title}</p>}
            {story.desc && <p className="text-[11px] font-light leading-[1.9] mb-7" style={{ color: '#777' }} dangerouslySetInnerHTML={{ __html: parseHighlight(story.desc) }} />}
            {story.images && story.images.length > 0 && (
              <div className={`grid gap-3 ${story.images.length === 1 ? 'grid-cols-1' : story.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {story.images.slice(0, 3).map((img, i) => { const s = story.imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }; return <div key={i} className={`rounded-lg overflow-hidden ${story.images.length === 3 && i === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}><div className="w-full h-full transition-transform duration-300" style={getImageCropStyle(img, s)} /></div> })}
              </div>
            )}
          </section>
        ) : null)
      })()}

      {/* 함께한 시간 + 클로징 문구 통합 섹션 */}
      {sectionVisibility.ourStory && (
        <section className="text-center px-7 py-12" style={{ background: themeColors.sectionBg }}>
          {/* 함께한 시간 - startDate가 있을 때만 표시 */}
          {invitation.relationship.startDate && (() => {
            const duration = calculateRelationshipDuration(invitation.relationship.startDate)
            if (!duration) return null
            return (
              <div className="flex justify-center items-center gap-6 mb-8">
                <div className="text-center">
                  <span className="text-lg font-light" style={{ color: themeColors.primary }}>{duration.days.toLocaleString()}</span>
                  <span className="text-[10px] ml-0.5" style={{ color: themeColors.gray }}>일</span>
                </div>
                <div className="text-center">
                  <span className="text-lg font-light" style={{ color: themeColors.primary }}>{duration.weeks.toLocaleString()}</span>
                  <span className="text-[10px] ml-0.5" style={{ color: themeColors.gray }}>주</span>
                </div>
                <div className="text-center">
                  <span className="text-lg font-light" style={{ color: themeColors.primary }}>
                    {duration.years > 0 && `${duration.years}년 `}{duration.months}개월
                  </span>
                </div>
              </div>
            )
          })()}

          {/* 세로 구분선 */}
          <div className="w-px h-8 mx-auto mb-8" style={{ background: themeColors.divider }} />

          {/* 클로징 문구 */}
          <p className={`text-sm leading-relaxed whitespace-pre-line ${!invitation.relationship.stories.some(s => s.title || s.desc) ? 'opacity-50' : ''}`} style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
            {invitation.relationship.closingText || '그리고 이제 드디어 부르는 서로의 이름에\n\'신랑\', \'신부\'라는 호칭을 담습니다.'}
          </p>
        </section>
      )}
      {/* Gallery Section */}
      <section id="preview-gallery" className="px-5 py-10" style={{ background: themeColors.cardBg }}>
        <p className="text-[10px] font-light text-center mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>GALLERY</p>
        <div className="grid grid-cols-2 gap-2">{invitation.gallery.images && invitation.gallery.images.length > 0 ? invitation.gallery.images.map((img, i) => { const s = invitation.gallery.imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }; return <div key={i} className="aspect-square rounded overflow-hidden"><div className="w-full h-full transition-transform duration-300" style={getImageCropStyle(img, s)} /></div> }) : [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square rounded bg-gray-100 flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>)}</div>
      </section>

      {/* Interview Section - with visibility toggle and sample fallback */}
      {sectionVisibility.interview && (
        <section id="preview-interview" className="py-16 px-7 text-center" style={{ background: themeColors.cardBg }}>
          <div className="w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} />
          <p className="text-sm font-light mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '1px' }}>{invitation.content.interviewIntro || '결혼에 관한 우리의 이야기'}</p>
          <div className="w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} />
        </section>
      )}
      {sectionVisibility.interview && (() => {
        const hasRealInterviews = invitation.content.interviews.some(i => i.question || i.answer)
        const interviewsToShow = hasRealInterviews ? invitation.content.interviews : SAMPLE_INTERVIEWS
        return interviewsToShow.map((interview, index) => (interview.question || interview.answer) ? (
          <section key={index} className={`px-7 py-14 ${!hasRealInterviews ? 'opacity-50' : ''}`} style={{ background: interview.bgClass === 'pink-bg' ? themeColors.sectionBg : themeColors.cardBg }}>
            {interview.images && interview.images.length > 0 ? <ProfileImageSlider images={interview.images} imageSettings={interview.imageSettings} className="mb-8" /> : <div className="w-full aspect-[4/5] rounded-xl mb-8 bg-gray-100 flex items-center justify-center"><span className="text-gray-400 text-sm">Interview Image</span></div>}
            {interview.question && <p className="text-sm mb-5 text-center"><span className="anim-underline revealed" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400, display: 'inline-block' }}>{interview.question}</span></p>}
            {interview.answer && <p className="text-[11px] font-light" style={{ fontFamily: fonts.displayKr, color: themeColors.text, lineHeight: invitation.interviewTextStyle?.lineHeight ?? 2.0, textAlign: invitation.interviewTextStyle?.textAlign ?? 'left' }} dangerouslySetInnerHTML={{ __html: parseHighlight(interview.answer) }} />}
          </section>
        ) : null)
      })()}

      {/* Guidance & Info Section - 통합 섹션 */}
      {sectionVisibility.guidance && (
        <section id="preview-guidance" className="px-6 py-14" style={{ background: themeColors.background }}>
          {invitation.guidance?.image ? (
            <div className="w-full aspect-[4/5] rounded-2xl mb-8 overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)' }}>
              <div
                className="w-full h-full transition-transform duration-300"
                style={(() => {
                  const s = invitation.guidance.imageSettings || {}
                  const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)
                  if (hasCropData) {
                    const cw = s.cropWidth || 1
                    const ch = s.cropHeight || 1
                    const cx = s.cropX || 0
                    const cy = s.cropY || 0
                    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
                    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
                    return {
                      backgroundImage: `url(${invitation.guidance.image})`,
                      backgroundSize: `${100 / cw}% ${100 / ch}%`,
                      backgroundPosition: `${posX}% ${posY}%`,
                      backgroundRepeat: 'no-repeat' as const,
                    }
                  }
                  // 기존 scale/position 방식 (호환성 유지)
                  return {
                    backgroundImage: `url(${invitation.guidance.image})`,
                    backgroundSize: 'cover' as const,
                    backgroundPosition: 'center' as const,
                    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
                  }
                })()}
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/5] rounded-2xl mb-8 bg-gray-100 flex items-center justify-center opacity-50" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)' }}>
              <span className="text-gray-400 text-sm">안내 이미지</span>
            </div>
          )}
          <h3 className="text-[15px] text-center mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400, letterSpacing: '1px' }}>
            {invitation.guidance?.title || '행복한 시간을 위한 안내'}
          </h3>
          <div className="w-10 h-px mx-auto mb-8" style={{ background: `linear-gradient(90deg, transparent, ${themeColors.divider}, transparent)` }} />
          {/* Info Blocks - 드레스코드, 포토부스 등 (itemOrder 순서대로) */}
          {(invitation.content.info.itemOrder || ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']).map((itemId) => {
            const info = invitation.content.info
            const item = info[itemId as keyof typeof info] as { enabled?: boolean; title?: string; content?: string; buttonText?: string } | undefined
            if (!item?.enabled) return null
            return (
              <div key={itemId} className="rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
                <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 600 }}>
                  <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                  {item.title}
                </h4>
                <p className="text-xs font-light leading-6" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: parseHighlight(item.content || '') }} />
                {itemId === 'photoShare' && item.buttonText && (
                  <button className="mt-4 px-7 py-3.5 rounded-xl text-xs" style={{ background: 'linear-gradient(135deg, #f5ebe0 0%, #ede4d8 100%)', color: '#6b5a48', fontWeight: 400, letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(180,150,120,0.12)' }}>
                    {item.buttonText}
                  </button>
                )}
              </div>
            )
          })}
          {invitation.content.info.customItems?.map(item => item.enabled && (
            <div key={item.id} className="rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 600 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {item.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: parseHighlight(item.content) }} />
            </div>
          ))}
        </section>
      )}
      {/* Thank You Section */}
      <section id="preview-thank-you" className="min-h-[300px] flex flex-col justify-center items-center text-center px-7 py-20" style={{ background: themeColors.sectionBg }}>
        <p className="text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>THANK YOU</p>
        <h2 className="text-lg mb-7" style={{ fontFamily: fonts.display, color: themeColors.text, fontWeight: 400, letterSpacing: '4px' }}>{invitation.content.thankYou.title}</h2><p className={`text-[11px] font-light leading-[2.2] mb-7 ${isEmpty(invitation.content.thankYou.message) ? 'opacity-50' : ''}`} style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.content.thankYou.message || SAMPLE_THANK_YOU.message) }} /><p className={`text-[11px] font-light ${isEmpty(invitation.content.thankYou.sign) ? 'opacity-50' : ''}`} style={{ fontFamily: fonts.displayKr, color: themeColors.gray }}>{invitation.content.thankYou.sign || SAMPLE_THANK_YOU.sign}</p>
      </section>
      <div className="relative h-[60px] overflow-hidden" style={{ background: themeColors.sectionBg }}><div className="absolute bottom-0 left-0 w-full h-full" style={{ background: themeColors.cardBg }} /><svg className="absolute bottom-0 w-[250%]" viewBox="0 0 2880 120" preserveAspectRatio="none" style={{ left: '-5%', height: '100%' }}><path fill={`${themeColors.cardBg}66`} d="M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40 T1800,40 T2160,40 T2520,40 T2880,40 L2880,120 L0,120 Z" /><path fill={`${themeColors.cardBg}99`} d="M0,50 Q240,90 480,50 T960,50 T1440,50 T1920,50 T2400,50 T2880,50 L2880,120 L0,120 Z" /><path fill={themeColors.cardBg} d="M0,70 Q360,100 720,70 T1440,70 T2160,70 T2880,70 L2880,120 L0,120 Z" /></svg></div>

      {/* Guestbook Section - with visibility toggle */}
      {sectionVisibility.guestbook && (
        <section id="preview-guestbook" className="px-5 py-14 pb-20 text-center" style={{ background: themeColors.cardBg }}>
          <p className="text-[10px] font-light mb-4" style={{ color: themeColors.gray, letterSpacing: '4px' }}>GUESTBOOK</p>
          <h3 className="text-sm mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>축하의 한마디</h3>
          <div className="max-w-[300px] mx-auto mb-9"><p className="text-xs font-medium leading-[1.7] mb-4 min-h-[40px]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>{invitation.content.guestbookQuestions[0] || '두 사람에게 해주고 싶은 말은?'}</p><div className="flex gap-2 mb-2.5"><input type="text" className="flex-1 px-3.5 py-3 border border-gray-200 rounded-lg text-[11px] font-light" style={{ background: '#fafafa', color: themeColors.text }} placeholder="20자 이내로 답해주세요" disabled /><button className="px-4 py-3 rounded-lg text-[10px] font-light text-white" style={{ background: themeColors.text }}>남기기</button></div><button className="text-[10px] font-light" style={{ color: '#aaa' }}>다른 질문 보기</button></div>
          <div className="relative min-h-[200px]"><div className="absolute w-[130px] px-3 py-3.5 bg-[#FFF9F0] rounded-lg text-left shadow-sm" style={{ transform: 'rotate(-3deg)', top: '10px', left: '20px' }}><p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">두 사람에게 해주고 싶은 말은?</p><p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>행복하세요!</p></div><div className="absolute w-[130px] px-3 py-3.5 bg-[#F0F7FF] rounded-lg text-left shadow-sm" style={{ transform: 'rotate(2deg)', top: '80px', right: '20px' }}><p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">결혼생활에서 가장 중요한 건?</p><p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>서로 믿는 것</p></div></div>
        </section>
      )}

      {/* RSVP Section */}
      {invitation.rsvpEnabled && <section id="preview-rsvp" className="px-6 py-14 text-center" style={{ background: themeColors.cardBg }}><p className="text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>RSVP</p><p className="text-sm mb-4" style={{ color: '#666' }}>참석 여부를 알려주세요</p><button className="w-full py-3 rounded-lg text-xs" style={{ background: themeColors.primary, color: '#fff' }}>참석 의사 전달하기</button>{invitation.rsvpDeadline && <p className="text-[10px] font-light mt-3" style={{ color: '#999' }}>마감일: {formatDateDisplay(invitation.rsvpDeadline)}</p>}</section>}
      <div className="px-6 py-10 text-center" style={{ background: themeColors.background }}><p className="text-[10px] font-light" style={{ color: '#999' }}>소중한 시간 내어주셔서 감사합니다</p></div>
    </div>
  )
}

// Family Template Main Page - 부모님이 보내는 청첩장 스타일
function FamilyMainPage({ invitation, groomName, brideName, fonts, themeColors }: PageProps) {
  const sectionVisibility = invitation.sectionVisibility || {
    coupleProfile: true, ourStory: true, interview: true, guidance: true, bankAccounts: true, guestbook: true
  }

  // parentIntro와 whyWeChose 데이터 가져오기
  const parentIntro = (invitation as any).parentIntro || {}
  const whyWeChose = (invitation as any).whyWeChose || {}
  const fullHeightDividers = (invitation as any).fullHeightDividers || {}

  return (
    <div className="relative">
      {/* 신랑측 부모님 소개 */}
      {parentIntro?.groom?.enabled !== false && (
        <section id="preview-couple-profile" className="px-6 py-16" style={{ background: '#ffffff' }}>
          <div className="text-center mb-8">
            <p className="text-[11px] mb-2" style={{ color: themeColors.gray }}>
              {parentIntro?.groom?.parentNames || `${invitation.groom.father?.name || '아버지'}, ${invitation.groom.mother?.name || '어머니'}의`}
            </p>
            <h3 className="text-lg" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              {parentIntro?.groom?.childOrder === '표기안함' ? '' : (parentIntro?.groom?.childOrder || '첫째')}아들 <span style={{ color: themeColors.highlight || themeColors.primary }}>{groomName}</span> 결혼합니다
            </h3>
          </div>
          {/* 이미지 */}
          <div className="w-full aspect-[4/3] bg-gray-100 mb-8 overflow-hidden">
            <div
              className="w-full h-full"
              style={parentIntro?.groom?.images?.[0] ? getImageCropStyle(parentIntro.groom.images[0], parentIntro.groom.imageSettings?.[0] || {}) : {}}
            />
          </div>
          {/* 메시지 */}
          <p className={`text-xs ${isEmpty(parentIntro?.groom?.message) ? 'opacity-50' : ''}`} style={{ fontFamily: fonts.displayKr, color: themeColors.text, lineHeight: invitation.parentIntroTextStyle?.lineHeight || 2.0, textAlign: invitation.parentIntroTextStyle?.textAlign || 'left' }} dangerouslySetInnerHTML={{ __html: parseHighlight(parentIntro?.groom?.message || SAMPLE_FAMILY.parentIntro.groom.message) }} />
        </section>
      )}

      {/* 선 확장 디바이더 */}
      {parentIntro?.groom?.enabled !== false && parentIntro?.bride?.enabled !== false && (
        <div className="flex items-center justify-center py-12" style={{ background: '#ffffff' }}>
          <div className="flex items-center w-full max-w-[200px]">
            <div className="flex-1 h-px" style={{ background: `${themeColors.highlight || themeColors.primary}40` }} />
            <div className="w-2 h-2 rounded-full mx-3" style={{ background: themeColors.highlight || themeColors.primary, opacity: 0.6 }} />
            <div className="flex-1 h-px" style={{ background: `${themeColors.highlight || themeColors.primary}40` }} />
          </div>
        </div>
      )}

      {/* 신부측 부모님 소개 */}
      {parentIntro?.bride?.enabled !== false && (
        <section className="px-6 py-16" style={{ background: '#ffffff' }}>
          <div className="text-center mb-8">
            <p className="text-[11px] mb-2" style={{ color: themeColors.gray }}>
              {parentIntro?.bride?.parentNames || `${invitation.bride.father?.name || '아버지'}, ${invitation.bride.mother?.name || '어머니'}의`}
            </p>
            <h3 className="text-lg" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              {parentIntro?.bride?.childOrder === '표기안함' ? '' : (parentIntro?.bride?.childOrder || '첫째')}딸 <span style={{ color: themeColors.highlight || themeColors.primary }}>{brideName}</span> 결혼합니다
            </h3>
          </div>
          {/* 이미지 */}
          <div className="w-full aspect-[4/3] bg-gray-100 mb-8 overflow-hidden">
            <div
              className="w-full h-full"
              style={parentIntro?.bride?.images?.[0] ? getImageCropStyle(parentIntro.bride.images[0], parentIntro.bride.imageSettings?.[0] || {}) : {}}
            />
          </div>
          {/* 메시지 */}
          <p className={`text-xs ${isEmpty(parentIntro?.bride?.message) ? 'opacity-50' : ''}`} style={{ fontFamily: fonts.displayKr, color: themeColors.text, lineHeight: invitation.parentIntroTextStyle?.lineHeight || 2.0, textAlign: invitation.parentIntroTextStyle?.textAlign || 'right' }} dangerouslySetInnerHTML={{ __html: parseHighlight(parentIntro?.bride?.message || SAMPLE_FAMILY.parentIntro.bride.message) }} />
        </section>
      )}

      {/* Full Height Divider - Title Section (부모님소개 하단) */}
      <section
        className="relative flex flex-col justify-center items-center text-center px-6 overflow-hidden"
        style={{ height: '400px' }}
      >
        <div
          className="absolute inset-0"
          style={{
            ...(fullHeightDividers?.items?.[0]?.image
              ? getImageCropStyle(fullHeightDividers.items[0].image, fullHeightDividers.items[0].imageSettings || {})
              : { background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' }),
            filter: `grayscale(${fullHeightDividers?.items?.[0]?.imageSettings?.grayscale ?? 100}%)`,
            opacity: (fullHeightDividers?.items?.[0]?.imageSettings?.opacity ?? 100) / 100,
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-white">
          <p className="text-[10px] tracking-[4px] mb-3 opacity-80" style={{ fontFamily: fonts.display }}>
            {fullHeightDividers?.items?.[0]?.englishTitle || 'From Our Family to Yours'}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: fonts.displayKr }}>
            {fullHeightDividers?.items?.[0]?.koreanText || '우리의 봄이, 누군가의 평생이 됩니다'}
          </p>
        </div>
      </section>

      {/* Why We Chose Each Other - Title Divider */}
      {whyWeChose?.enabled !== false && (
        <section
          className="relative flex flex-col justify-center items-center text-center px-6 overflow-hidden"
          style={{ height: '350px' }}
        >
          <div
            className="absolute inset-0"
            style={{
              ...(fullHeightDividers?.items?.[1]?.image
                ? getImageCropStyle(fullHeightDividers.items[1].image, fullHeightDividers.items[1].imageSettings || {})
                : { background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' }),
              filter: `grayscale(${fullHeightDividers?.items?.[1]?.imageSettings?.grayscale ?? 100}%)`,
              opacity: (fullHeightDividers?.items?.[1]?.imageSettings?.opacity ?? 100) / 100,
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-white">
            <p className="text-[10px] tracking-[4px] mb-3 opacity-80" style={{ fontFamily: fonts.display }}>
              {fullHeightDividers?.items?.[1]?.englishTitle || 'Why We Chose Each Other'}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: fonts.displayKr }}>
              {fullHeightDividers?.items?.[1]?.koreanText || '서로의 부족한 점을 채워줄 수 있는\n사람을 만났습니다.'}
            </p>
          </div>
        </section>
      )}

      {/* Why We Chose - Section Title */}
      {whyWeChose?.enabled !== false && (
        <section id="preview-our-story" className="py-16 px-7 text-center" style={{ background: '#ffffff' }}>
          <h3 className="text-base mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
            {whyWeChose?.title || '우리가 서로를 선택한 이유'}
          </h3>
          <p className="text-[11px]" style={{ color: themeColors.gray }}>
            {whyWeChose?.subtitle || '오래 보아도 좋은 사람, 서로 그렇게 되기까지'}
          </p>
        </section>
      )}

      {/* 신랑이 선택한 이유 - whyWeChose 전용 이미지 우선 사용 */}
      {whyWeChose?.enabled !== false && whyWeChose?.groom?.enabled !== false && (
        <section className="px-7 pb-16" style={{ background: '#ffffff' }}>
          <ProfileImageSlider
            images={whyWeChose?.groom?.images?.length > 0 ? whyWeChose.groom.images : invitation.groom.profile.images}
            imageSettings={whyWeChose?.groom?.images?.length > 0 ? whyWeChose.groom.imageSettings : invitation.groom.profile.imageSettings}
            className="mb-10"
          />
          {/* Description Card */}
          <div className={`relative p-6 mb-10 ${isEmpty(whyWeChose?.groom?.description) ? 'opacity-50' : ''}`} style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.text}20` }}>
            <p className="text-xs" style={{ fontFamily: fonts.displayKr, color: themeColors.text, lineHeight: invitation.whyWeChoseTextStyle?.lineHeight || 2.2, textAlign: invitation.whyWeChoseTextStyle?.textAlign || 'left' }} dangerouslySetInnerHTML={{ __html: parseHighlight(whyWeChose?.groom?.description || SAMPLE_FAMILY.whyWeChose.groom.description) }} />
          </div>
          {/* Quote */}
          <div className={`text-right ${isEmpty(whyWeChose?.groom?.quote) ? 'opacity-50' : ''}`}>
            <p className="text-base mb-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              &ldquo;{whyWeChose?.groom?.quote || SAMPLE_FAMILY.whyWeChose.groom.quote}&rdquo;
            </p>
            <p className="text-[11px]" style={{ color: themeColors.gray }}>신랑 {groomName}</p>
          </div>
        </section>
      )}

      {/* 신부가 선택한 이유 - whyWeChose 전용 이미지 우선 사용 */}
      {whyWeChose?.enabled !== false && whyWeChose?.bride?.enabled !== false && (
        <section className="px-7 pb-16" style={{ background: '#ffffff' }}>
          <ProfileImageSlider
            images={whyWeChose?.bride?.images?.length > 0 ? whyWeChose.bride.images : invitation.bride.profile.images}
            imageSettings={whyWeChose?.bride?.images?.length > 0 ? whyWeChose.bride.imageSettings : invitation.bride.profile.imageSettings}
            className="mb-10"
          />
          {/* Description Card */}
          <div className={`relative p-6 mb-10 ${isEmpty(whyWeChose?.bride?.description) ? 'opacity-50' : ''}`} style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.text}20` }}>
            <p className="text-xs" style={{ fontFamily: fonts.displayKr, color: themeColors.text, lineHeight: invitation.whyWeChoseTextStyle?.lineHeight || 2.2, textAlign: invitation.whyWeChoseTextStyle?.textAlign || 'left' }} dangerouslySetInnerHTML={{ __html: parseHighlight(whyWeChose?.bride?.description || SAMPLE_FAMILY.whyWeChose.bride.description) }} />
          </div>
          {/* Quote */}
          <div className={`text-left ${isEmpty(whyWeChose?.bride?.quote) ? 'opacity-50' : ''}`}>
            <p className="text-base mb-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              &ldquo;{whyWeChose?.bride?.quote || SAMPLE_FAMILY.whyWeChose.bride.quote}&rdquo;
            </p>
            <p className="text-[11px]" style={{ color: themeColors.gray }}>신부 {brideName}</p>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      <section id="preview-gallery" className="px-5 py-10" style={{ background: themeColors.sectionBg }}>
        <div className="grid grid-cols-2 gap-2">{invitation.gallery.images && invitation.gallery.images.length > 0 ? invitation.gallery.images.map((img, i) => { const s = invitation.gallery.imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }; return <div key={i} className="aspect-square overflow-hidden"><div className="w-full h-full transition-transform duration-300" style={getImageCropStyle(img, s)} /></div> }) : [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-gray-100 flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>)}</div>
      </section>

      {/* Interview Title Divider - 갤러리 섹션 하단 */}
      {sectionVisibility.interview && invitation.content.interviews.some(i => i.question || i.answer) && (
        <section
          className="relative flex flex-col justify-center items-center text-center px-6 overflow-hidden"
          style={{ height: '350px' }}
        >
          <div
            className="absolute inset-0"
            style={{
              ...(fullHeightDividers?.items?.[2]?.image
                ? getImageCropStyle(fullHeightDividers.items[2].image, fullHeightDividers.items[2].imageSettings || {})
                : { background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' }),
              filter: `grayscale(${fullHeightDividers?.items?.[2]?.imageSettings?.grayscale ?? 100}%)`,
              opacity: (fullHeightDividers?.items?.[2]?.imageSettings?.opacity ?? 100) / 100,
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-white">
            <p className="text-[10px] tracking-[4px] mb-3 opacity-80" style={{ fontFamily: fonts.display }}>
              {fullHeightDividers?.items?.[2]?.englishTitle || 'Our way to marriage'}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: fonts.displayKr }}>
              {fullHeightDividers?.items?.[2]?.koreanText || '같은 시간, 같은 마음으로\n하나의 계절을 준비하고 있습니다.'}
            </p>
          </div>
        </section>
      )}

      {/* Interview Section */}
      {sectionVisibility.interview && (() => {
        const hasRealInterviews = invitation.content.interviews.some(i => i.question || i.answer)
        const interviewsToShow = hasRealInterviews ? invitation.content.interviews : SAMPLE_INTERVIEWS
        return interviewsToShow.map((interview, index) => (interview.question || interview.answer) ? (
          <section key={index} id={index === 0 ? 'preview-interview' : undefined} className={`px-7 py-14 ${!hasRealInterviews ? 'opacity-50' : ''}`} style={{ background: '#ffffff' }}>
            {interview.images && interview.images.length > 0 ? (
              <ProfileImageSlider images={interview.images} imageSettings={interview.imageSettings} className="mb-8" />
            ) : (
              <div className="w-full aspect-[4/5] rounded-xl mb-8 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Interview Image</span>
              </div>
            )}
            {interview.question && (
              <p className="text-sm mb-5 text-center">
                <span className="anim-underline revealed" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400, display: 'inline-block' }}>
                  {interview.question}
                </span>
              </p>
            )}
            {interview.answer && (
              <p className="text-[11px] font-light" style={{ fontFamily: fonts.displayKr, color: themeColors.text, lineHeight: invitation.interviewTextStyle?.lineHeight ?? 2.0, textAlign: invitation.interviewTextStyle?.textAlign ?? 'left' }} dangerouslySetInnerHTML={{ __html: parseHighlight(interview.answer) }} />
            )}
          </section>
        ) : null)
      })()}

      {/* Guidance & Info Section */}
      {sectionVisibility.guidance && (
        <section className="px-6 py-14" style={{ background: themeColors.sectionBg }}>
          {invitation.guidance?.image ? (
            <div className="w-full aspect-[4/5] rounded-2xl mb-8 overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)' }}>
              <div
                className="w-full h-full transition-transform duration-300"
                style={(() => {
                  const s = invitation.guidance.imageSettings || {}
                  const hasCropData = s.cropWidth !== undefined && s.cropHeight !== undefined && (s.cropWidth < 1 || s.cropHeight < 1)
                  if (hasCropData) {
                    const cw = s.cropWidth || 1
                    const ch = s.cropHeight || 1
                    const cx = s.cropX || 0
                    const cy = s.cropY || 0
                    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
                    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100
                    return {
                      backgroundImage: `url(${invitation.guidance.image})`,
                      backgroundSize: `${100 / cw}% ${100 / ch}%`,
                      backgroundPosition: `${posX}% ${posY}%`,
                      backgroundRepeat: 'no-repeat' as const,
                    }
                  }
                  return {
                    backgroundImage: `url(${invitation.guidance.image})`,
                    backgroundSize: 'cover' as const,
                    backgroundPosition: 'center' as const,
                    transform: `scale(${s.scale || 1}) translate(${s.positionX || 0}%, ${s.positionY || 0}%)`,
                  }
                })()}
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/5] rounded-2xl mb-8 bg-gray-100 flex items-center justify-center opacity-50" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)' }}>
              <span className="text-gray-400 text-sm">안내 이미지</span>
            </div>
          )}
          <h3 className="text-[15px] text-center mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>
            {invitation.guidance?.title || '행복한 시간을 위한 안내'}
          </h3>
          <div className="w-10 h-px mx-auto mb-8" style={{ background: themeColors.divider }} />

          {/* Info Blocks - itemOrder 순서대로 */}
          {(invitation.content.info.itemOrder || ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']).map((itemId) => {
            const info = invitation.content.info
            const item = info[itemId as keyof typeof info] as { enabled?: boolean; title?: string; content?: string; buttonText?: string } | undefined
            if (!item?.enabled) return null
            return (
              <div key={itemId} className="px-6 py-6 mb-4" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
                <h4 className="text-[13px] mb-4 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 600 }}>
                  <span className="w-[3px] h-[14px] rounded-sm" style={{ background: themeColors.accent }} />
                  {item.title}
                </h4>
                <p className="text-xs leading-6" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: parseHighlight(item.content || '') }} />
                {itemId === 'photoShare' && item.buttonText && (
                  <button className="mt-4 px-5 py-2.5 text-[11px] transition-all" style={{ background: themeColors.primary, color: '#fff' }}>
                    {item.buttonText}
                  </button>
                )}
              </div>
            )
          })}
          {invitation.content.info.customItems?.map(item => item.enabled && (
            <div key={item.id} className="px-6 py-6 mb-4" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
              <h4 className="text-[13px] mb-4 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 600 }}>
                <span className="w-[3px] h-[14px] rounded-sm" style={{ background: themeColors.accent }} />
                {item.title}
              </h4>
              <p className="text-xs leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: parseHighlight(item.content) }} />
            </div>
          ))}
        </section>
      )}

      {/* Thank You Section */}
      <section className="min-h-[300px] flex flex-col justify-center items-center text-center px-7 py-20" style={{ background: themeColors.cardBg }}>
        <p className="text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>THANK YOU</p>
        <h2 className="text-lg mb-7" style={{ fontFamily: fonts.display, color: themeColors.text, fontWeight: 400, letterSpacing: '4px' }}>{invitation.content.thankYou.title}</h2>
        <p className={`text-[11px] font-light leading-[2.2] mb-7 ${isEmpty(invitation.content.thankYou.message) ? 'opacity-50' : ''}`} style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.content.thankYou.message || SAMPLE_THANK_YOU.message) }} />
        <p className={`text-[11px] font-light ${isEmpty(invitation.content.thankYou.sign) ? 'opacity-50' : ''}`} style={{ fontFamily: fonts.displayKr, color: themeColors.gray }}>{invitation.content.thankYou.sign || SAMPLE_THANK_YOU.sign}</p>
      </section>

      {/* Guestbook Section */}
      {sectionVisibility.guestbook && (
        <section className="px-5 py-14 pb-20 text-center" style={{ background: themeColors.cardBg }}>
          <p className="text-[10px] font-light mb-4" style={{ color: themeColors.gray, letterSpacing: '4px' }}>GUESTBOOK</p>
          <h3 className="text-sm mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>축하의 한마디</h3>
          <div className="max-w-[300px] mx-auto mb-9">
            <p className="text-xs font-light leading-[1.7] mb-4 min-h-[40px]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              {invitation.content.guestbookQuestions[0] || '두 사람에게 해주고 싶은 말은?'}
            </p>
            <div className="flex gap-2 mb-2.5">
              <input type="text" className="flex-1 px-3.5 py-3 border border-gray-200 rounded-lg text-[11px] font-light" style={{ background: '#fafafa', color: themeColors.text }} placeholder="20자 이내로 답해주세요" disabled />
              <button className="px-4 py-3 rounded-lg text-[10px] font-light text-white" style={{ background: themeColors.text }}>남기기</button>
            </div>
            <button className="text-[10px] font-light" style={{ color: '#aaa' }}>다른 질문 보기</button>
          </div>
          <div className="relative min-h-[200px]">
            <div className="absolute w-[130px] px-3 py-3.5 bg-[#FFF9F0] rounded-lg text-left shadow-sm" style={{ transform: 'rotate(-3deg)', top: '10px', left: '20px' }}>
              <p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">두 사람에게 해주고 싶은 말은?</p>
              <p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>행복하세요!</p>
            </div>
            <div className="absolute w-[130px] px-3 py-3.5 bg-[#F0F7FF] rounded-lg text-left shadow-sm" style={{ transform: 'rotate(2deg)', top: '80px', right: '20px' }}>
              <p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">결혼생활에서 가장 중요한 건?</p>
              <p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>서로 믿는 것</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="px-6 py-10 text-center" style={{ background: themeColors.background }}>
        <p className="text-[10px] font-light" style={{ color: '#999' }}>소중한 시간 내어주셔서 감사합니다</p>
      </div>
    </div>
  )
}

export default Preview
