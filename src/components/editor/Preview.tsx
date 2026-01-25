'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditorStore, InvitationContent } from '@/store/editorStore'
import { parseHighlight } from '@/lib/textUtils'
import FloatingButton from './FloatingButton'
import ProfileImageSlider from './ProfileImageSlider'

// BGM Player Component
function BgmPlayer({ bgm }: { bgm: InvitationContent['bgm'] }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (bgm?.enabled && bgm.autoplay && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false))
    }
  }, [bgm])

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
interface ColorConfig { primary: string; secondary: string; accent: string; background: string; sectionBg: string; cardBg: string; divider: string; text: string; gray: string }

const colorThemes: Record<ColorTheme, ColorConfig> = {
  'classic-rose': { primary: '#E91E63', secondary: '#D4A574', accent: '#d4a574', background: '#FFF8F5', sectionBg: '#FFE8E8', cardBg: '#FFFFFF', divider: '#d4b896', text: '#333333', gray: '#666666' },
  'modern-black': { primary: '#1A1A1A', secondary: '#888888', accent: '#1A1A1A', background: '#FFFFFF', sectionBg: '#F5F5F5', cardBg: '#FFFFFF', divider: '#CCCCCC', text: '#1A1A1A', gray: '#666666' },
  'romantic-blush': { primary: '#D4A5A5', secondary: '#C9B8A8', accent: '#C9B8A8', background: '#FDF8F6', sectionBg: '#F8EFEC', cardBg: '#FFFFFF', divider: '#D4C4BC', text: '#5C4B4B', gray: '#8B7676' },
  'nature-green': { primary: '#6B8E6B', secondary: '#A8B5A0', accent: '#8FA888', background: '#F5F7F4', sectionBg: '#EBF0E8', cardBg: '#FFFFFF', divider: '#A8B5A0', text: '#3D4A3D', gray: '#6B7B6B' },
  'luxury-navy': { primary: '#1E3A5F', secondary: '#C9A96E', accent: '#C9A96E', background: '#F8F9FA', sectionBg: '#E8ECF0', cardBg: '#FFFFFF', divider: '#C9A96E', text: '#1E3A5F', gray: '#5A6B7C' },
  'sunset-coral': { primary: '#E8846B', secondary: '#F5C7A9', accent: '#E8A87C', background: '#FFFAF7', sectionBg: '#FFEEE5', cardBg: '#FFFFFF', divider: '#E8A87C', text: '#5C4035', gray: '#8B6B5C' },
}

type FontStyle = 'classic' | 'modern' | 'romantic' | 'contemporary' | 'luxury'
interface FontConfig { display: string; displayKr: string; body: string }

const fontStyles: Record<FontStyle, FontConfig> = {
  classic: { display: "'Playfair Display', serif", displayKr: "'Nanum Myeongjo', serif", body: "'Nanum Myeongjo', serif" },
  modern: { display: "'Montserrat', sans-serif", displayKr: "'Noto Sans KR', sans-serif", body: "'Noto Sans KR', sans-serif" },
  romantic: { display: "'Lora', serif", displayKr: "'Gowun Batang', serif", body: "'Gowun Batang', serif" },
  contemporary: { display: "'Cinzel', serif", displayKr: "'Gowun Dodum', sans-serif", body: "'Gowun Dodum', sans-serif" },
  luxury: { display: "'EB Garamond', serif", displayKr: "'Nanum Myeongjo', serif", body: "'Nanum Myeongjo', serif" },
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
// 국화 아이콘 (고인 표시 - 꽃 스타일)
const ChrysanthemumIcon = () => (
  <img
    src="/icons/chrysanthemum.svg"
    alt="고인"
    className="inline-block w-3 h-3 mr-0.5 opacity-70"
  />
);

// 한자 故 표시 (고인 표시 - 한자 스타일)
const HanjaDeceasedIcon = () => (
  <span className="inline-block mr-0.5 text-[10px] opacity-70">故</span>
);

// 부모님 이름 표시 (고인 시 선택된 스타일로 표시)
const ParentName = ({ name, deceased, displayStyle = 'flower' }: { name: string; deceased?: boolean; displayStyle?: 'hanja' | 'flower' }) => (
  <span className="inline-flex items-center">
    {deceased && (displayStyle === 'hanja' ? <HanjaDeceasedIcon /> : <ChrysanthemumIcon />)}
    {name}
  </span>
);



export default function Preview() {
  const { invitation, template, activeSection } = useEditorStore()
  const previewContentRef = useRef<HTMLDivElement>(null)

  // activeSection이 변경되면 해당 섹션으로 스크롤
  useEffect(() => {
    if (!activeSection || !previewContentRef.current) return

    const element = document.getElementById(`preview-${activeSection}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeSection])

  if (!invitation || !template) return <div className="h-full flex items-center justify-center bg-gray-100"><p className="text-gray-400">Loading...</p></div>
  const groomName = invitation.groom.name || 'Groom', brideName = invitation.bride.name || 'Bride'
  const fonts = fontStyles[invitation.fontStyle || 'classic'], themeColors = colorThemes[invitation.colorTheme || 'classic-rose']
  return (
    <div className="h-full bg-gray-100 flex flex-col">
      <div className="flex-1 overflow-y-auto flex justify-center px-6 py-6">
        <div className="relative"><div className="w-[390px] bg-black rounded-[3rem] p-3 shadow-2xl">
          <div className="rounded-[2.5rem] overflow-hidden bg-white flex flex-col relative" style={{ height: '780px' }}>
            <div className="h-8 bg-black flex items-center justify-center flex-shrink-0"><div className="w-24 h-6 bg-black rounded-b-2xl" /></div>
            <div ref={previewContentRef} className={`flex-1 overflow-y-auto min-h-0 relative theme-${invitation.colorTheme || 'classic-rose'}`} id="preview-content" style={{ fontFamily: fonts.body, color: themeColors.text, letterSpacing: '-0.3px' }}>
              <IntroPage invitation={invitation} groomName={groomName} brideName={brideName} fonts={fonts} themeColors={themeColors} />
              {invitation.templateId === 'narrative-family'
                ? <FamilyMainPage invitation={invitation} groomName={groomName} brideName={brideName} fonts={fonts} themeColors={themeColors} />
                : <MainPage invitation={invitation} groomName={groomName} brideName={brideName} fonts={fonts} themeColors={themeColors} />
              }
            </div>
            <FloatingButton themeColors={themeColors} fonts={fonts} invitation={{
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
            <div className="h-8 flex items-center justify-center bg-white flex-shrink-0"><div className="w-32 h-1 bg-gray-300 rounded-full" /></div>
          </div>
        </div></div>
      </div>
    </div>
  )
}

interface PageProps { invitation: InvitationContent; groomName: string; brideName: string; fonts: FontConfig; themeColors: ColorConfig }

function IntroPage({ invitation, groomName, brideName, fonts, themeColors }: PageProps) {
  const introAnimation = invitation.design?.introAnimation || 'fade-in'
  const coverTitle = invitation.design?.coverTitle || invitation.wedding.title || 'OUR WEDDING'
  return (
    <div>
      {/* BGM Player */}
      <BgmPlayer bgm={invitation.bgm} />

      <section id="preview-intro-cover" className={`relative flex flex-col justify-center items-center ${introAnimation !== 'none' ? `intro-animation-${introAnimation}` : ''}`} style={{ height: '716px' }}>
        <div className="absolute inset-0" style={{ backgroundImage: invitation.media.coverImage ? `url(${invitation.media.coverImage})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', backgroundSize: 'cover', backgroundPosition: 'top' }} />
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
        {invitation.content.quote.text && <div className="py-5 mb-9" style={{ borderTop: `1px solid ${themeColors.divider}`, borderBottom: `1px solid ${themeColors.divider}` }}><p className="text-[13px] font-light leading-[1.9] mb-2" style={{ fontFamily: fonts.displayKr, color: themeColors.primary }} dangerouslySetInnerHTML={{ __html: invitation.content.quote.text.replace(/\n/g, '<br/>') }} />{invitation.content.quote.author && <p className="text-[11px] font-light" style={{ color: themeColors.gray }}>{invitation.content.quote.author}</p>}</div>}
        <div className="mb-11"><p className="text-[13px] font-light leading-[2.1]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: invitation.content.greeting ? invitation.content.greeting.replace(/\n/g, '<br/>') : 'Please enter greeting' }} /></div>
        {/* 부모님 정보 */}
        <div className="mb-9 text-center" style={{ fontFamily: fonts.displayKr }}>
          <div className="mb-3">
            <p className="text-[11px] font-light leading-[2]" style={{ color: themeColors.text }}>
              {invitation.groom.father.name && <><ParentName name={invitation.groom.father.name} deceased={invitation.groom.father.deceased} displayStyle={invitation.deceasedDisplayStyle} /> · </>}
              {invitation.groom.mother.name && <><ParentName name={invitation.groom.mother.name} deceased={invitation.groom.mother.deceased} displayStyle={invitation.deceasedDisplayStyle} /></>}
              {(invitation.groom.father.name || invitation.groom.mother.name) && <span style={{ color: themeColors.gray }}> 의 아들 </span>}
              <span style={{ color: themeColors.primary, fontWeight: 500 }}>{groomName}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-light leading-[2]" style={{ color: themeColors.text }}>
              {invitation.bride.father.name && <><ParentName name={invitation.bride.father.name} deceased={invitation.bride.father.deceased} displayStyle={invitation.deceasedDisplayStyle} /> · </>}
              {invitation.bride.mother.name && <><ParentName name={invitation.bride.mother.name} deceased={invitation.bride.mother.deceased} displayStyle={invitation.deceasedDisplayStyle} /></>}
              {(invitation.bride.father.name || invitation.bride.mother.name) && <span style={{ color: themeColors.gray }}> 의 딸 </span>}
              <span style={{ color: themeColors.primary, fontWeight: 500 }}>{brideName}</span>
            </p>
          </div>
        </div>
        <div id="preview-venue-info" className="rounded-2xl px-6 py-7 mb-9" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)' }}>
          <span className="inline-block text-[9px] font-light px-3 py-1 rounded-full mb-5" style={{ background: '#f0f0f0', color: '#888' }}>Until wedding {calculateDday(invitation.wedding.date)}</span>
          <div className="pb-4 mb-4 border-b border-gray-100"><p className="text-lg font-light mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '3px' }}>{formatDateDisplay(invitation.wedding.date)}</p><p className="text-[11px] font-light" style={{ color: '#777' }}>{invitation.wedding.timeDisplay || '2:00 PM'}</p></div>
          <div className="mb-5"><p className="text-xs mb-1" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>{invitation.wedding.venue.name} {invitation.wedding.venue.hall}</p><p className="text-[10px] font-light" style={{ color: '#999' }}>{invitation.wedding.venue.address || 'Please enter address'}</p></div>
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

      <section className="relative h-[200px] flex items-end justify-center" style={{ backgroundImage: invitation.media.coverImage ? `url(${invitation.media.coverImage})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', backgroundSize: 'cover', backgroundPosition: 'top' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="relative z-10 text-center text-white pb-8"><p className="text-xs font-light" style={{ fontFamily: fonts.displayKr, letterSpacing: '1.5px' }}>{groomName} & {brideName}<br/>결혼합니다.</p></div>
      </section>
      <section className="py-20 px-7 text-center" style={{ background: themeColors.cardBg }}>
        <div className="w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} />
        <div style={{ fontFamily: fonts.displayKr, fontSize: '14px', color: themeColors.text, letterSpacing: '3px', lineHeight: 1.9 }}><span className="block">{groomName} & {brideName}</span><span className="block">결혼합니다.</span></div>
        <div className="w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} />
      </section>

      {/* Couple Profile Section - with visibility toggle */}
      {sectionVisibility.coupleProfile && invitation.bride.profile.intro && <section id="preview-couple-profile" className="px-7 py-14" style={{ background: themeColors.sectionBg }}><ProfileImageSlider images={invitation.bride.profile.images} imageSettings={invitation.bride.profile.imageSettings} className="mb-10" /><div className="text-center mb-8"><p className="text-[10px] font-light mb-4 anim-underline revealed" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '3px', display: 'inline-block' }}>{invitation.bride.profile.aboutLabel}</p><p className="text-[11px] font-light" style={{ color: '#999' }}>{invitation.bride.profile.subtitle}</p></div><div className="text-xs font-light leading-[2.2] text-left" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.bride.profile.intro) }} />{invitation.bride.profile.tag && <div className="inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md text-[10px] font-light" style={{ background: 'rgba(0,0,0,0.03)', color: '#777' }}>&#9829; {invitation.bride.profile.tag}</div>}</section>}
      {sectionVisibility.coupleProfile && invitation.groom.profile.intro && <section className="px-7 py-14" style={{ background: themeColors.sectionBg }}><ProfileImageSlider images={invitation.groom.profile.images} imageSettings={invitation.groom.profile.imageSettings} className="mb-10" /><div className="text-center mb-8"><p className="text-[10px] font-light mb-4 anim-underline revealed" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '3px', display: 'inline-block' }}>{invitation.groom.profile.aboutLabel}</p><p className="text-[11px] font-light" style={{ color: '#999' }}>{invitation.groom.profile.subtitle}</p></div><div className="text-xs font-light leading-[2.2] text-left" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(invitation.groom.profile.intro) }} />{invitation.groom.profile.tag && <div className="inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md text-[10px] font-light" style={{ background: 'rgba(0,0,0,0.03)', color: '#777' }}>&#9829; {invitation.groom.profile.tag}</div>}</section>}

      {/* Our Story Section - with visibility toggle */}
      {sectionVisibility.ourStory && invitation.relationship.stories.some(s => s.title || s.desc) && <section id="preview-our-story" className="py-16 px-7 text-center" style={{ background: themeColors.cardBg }}><div className="w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} /><p className="text-sm font-light mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '1px' }}>사랑이 시작된 작은 순간들</p><div className="w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} /></section>}
      {sectionVisibility.ourStory && invitation.relationship.stories.map((story, index) => story.title || story.desc ? <section key={index} className="px-7 py-14 text-center" style={{ background: themeColors.sectionBg }}>{story.date && <p className="text-[10px] font-light mb-3" style={{ fontFamily: fonts.display, color: themeColors.gray, letterSpacing: '2px' }}>{story.date}</p>}{story.title && <p className="text-[15px] mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>{story.title}</p>}{story.desc && <p className="text-[11px] font-light leading-[1.9] mb-7" style={{ color: '#777' }} dangerouslySetInnerHTML={{ __html: parseHighlight(story.desc) }} />}{story.images && story.images.length > 0 && <div className={`grid gap-3 ${story.images.length === 1 ? 'grid-cols-1' : story.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>{story.images.slice(0, 3).map((img, i) => { const s = story.imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }; return <div key={i} className={`rounded-lg overflow-hidden ${story.images.length === 3 && i === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}><div className="w-full h-full transition-transform duration-300" style={getImageCropStyle(img, s)} /></div> })}</div>}</section> : null)}

      {/* Our Story Closing Text */}
      {sectionVisibility.ourStory && invitation.relationship.stories.some(s => s.title || s.desc) && (
        <section className="px-7 py-10 text-center" style={{ background: themeColors.sectionBg }}>
          <p className="text-sm leading-relaxed" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
            {invitation.relationship.closingText || '그리고 이제 드디어 부르는 서로의 이름에 \'신랑\', \'신부\'라는 호칭을 담습니다.'}
          </p>
        </section>
      )}
      {/* Gallery Section */}
      <section id="preview-gallery" className="px-5 py-10" style={{ background: themeColors.cardBg }}>
        <p className="text-[10px] font-light text-center mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>GALLERY</p>
        <div className="grid grid-cols-2 gap-2">{invitation.gallery.images && invitation.gallery.images.length > 0 ? invitation.gallery.images.map((img, i) => { const s = invitation.gallery.imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }; return <div key={i} className="aspect-square rounded overflow-hidden"><div className="w-full h-full transition-transform duration-300" style={getImageCropStyle(img, s)} /></div> }) : [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square rounded bg-gray-100 flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>)}</div>
      </section>

      {/* Interview Section - with visibility toggle */}
      {sectionVisibility.interview && invitation.content.interviews.some(i => i.question || i.answer) && <section id="preview-interview" className="py-16 px-7 text-center" style={{ background: themeColors.cardBg }}><div className="w-px h-10 mx-auto mb-6" style={{ background: themeColors.divider }} /><p className="text-sm font-light mb-4" style={{ fontFamily: fonts.displayKr, color: themeColors.text, letterSpacing: '1px' }}>결혼에 관한 우리의 이야기</p><div className="w-px h-10 mx-auto mt-6" style={{ background: themeColors.divider }} /></section>}
      {sectionVisibility.interview && invitation.content.interviews.map((interview, index) => interview.question || interview.answer ? <section key={index} className="px-7 py-14" style={{ background: interview.bgClass === 'pink-bg' ? themeColors.sectionBg : themeColors.cardBg }}>{interview.images && interview.images.length > 0 ? <ProfileImageSlider images={interview.images} imageSettings={interview.imageSettings} className="mb-8" /> : <div className="w-full aspect-[4/5] rounded-xl mb-8 bg-gray-100 flex items-center justify-center"><span className="text-gray-400 text-sm">Interview Image</span></div>}{interview.question && <p className="text-sm mb-5 text-center"><span className="anim-underline revealed" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400, display: 'inline-block' }}>{interview.question}</span></p>}{interview.answer && <p className="text-[11px] font-light leading-[2.2]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(interview.answer) }} />}</section> : null)}

      {/* Guidance & Info Section - 통합 섹션 */}
      {sectionVisibility.guidance && (
        <section id="preview-guidance" className="px-6 py-14" style={{ background: themeColors.background }}>
          {invitation.guidance?.image && (
            <div className="w-full aspect-[4/5] rounded-2xl mb-8 bg-cover bg-center overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)' }}>
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-300"
                style={{
                  backgroundImage: `url(${invitation.guidance.image})`,
                  transform: `scale(${invitation.guidance.imageSettings?.scale || 1}) translate(${invitation.guidance.imageSettings?.positionX || 0}%, ${invitation.guidance.imageSettings?.positionY || 0}%)`
                }}
              />
            </div>
          )}
          <h3 className="text-[15px] text-center mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400, letterSpacing: '1px' }}>
            {invitation.guidance?.title || '행복한 시간을 위한 안내'}
          </h3>
          <div className="w-10 h-px mx-auto mb-8" style={{ background: `linear-gradient(90deg, transparent, ${themeColors.divider}, transparent)` }} />
          {/* Info Blocks - 드레스코드, 포토부스 등 */}
          {invitation.content.info.dressCode.enabled && (
            <div className="rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {invitation.content.info.dressCode.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.dressCode.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content.info.photoShare.enabled && (
            <div className="rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {invitation.content.info.photoShare.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.photoShare.content.replace(/\n/g, '<br/>') }} />
              <button className="mt-4 px-7 py-3.5 rounded-xl text-xs" style={{ background: 'linear-gradient(135deg, #f5ebe0 0%, #ede4d8 100%)', color: '#6b5a48', fontWeight: 400, letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(180,150,120,0.12)' }}>
                {invitation.content.info.photoShare.buttonText}
              </button>
            </div>
          )}
          {invitation.content.info.photoBooth?.enabled && (
            <div className="rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {invitation.content.info.photoBooth.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.photoBooth.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content.info.flowerChild?.enabled && (
            <div className="rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {invitation.content.info.flowerChild.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.flowerChild.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content.info.customItems?.map(item => item.enabled && (
            <div key={item.id} className="rounded-2xl px-5 py-6 mb-4" style={{ background: themeColors.cardBg, boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04)' }}>
              <h4 className="text-[13px] mb-3.5 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-0.5 h-3.5 rounded" style={{ background: themeColors.accent }} />
                {item.title}
              </h4>
              <p className="text-xs font-light leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br/>') }} />
            </div>
          ))}
        </section>
      )}
      {/* Thank You Section */}
      <section id="preview-thank-you" className="min-h-[300px] flex flex-col justify-center items-center text-center px-7 py-20" style={{ background: themeColors.sectionBg }}>
        <p className="text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>THANK YOU</p>
        <h2 className="text-lg mb-7" style={{ fontFamily: fonts.display, color: themeColors.text, fontWeight: 400, letterSpacing: '4px' }}>{invitation.content.thankYou.title}</h2>{invitation.content.thankYou.message ? <p className="text-[11px] font-light leading-[2.2] mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: invitation.content.thankYou.message.replace(/\n/g, '<br/>') }} /> : <p className="text-[11px] text-gray-400 italic mb-7">Please enter thank you message</p>}{invitation.content.thankYou.sign && <p className="text-[11px] font-light" style={{ fontFamily: fonts.displayKr, color: themeColors.gray }}>{invitation.content.thankYou.sign}</p>}
      </section>
      <div className="relative h-[60px] overflow-hidden" style={{ background: themeColors.sectionBg }}><div className="absolute bottom-0 left-0 w-full h-full" style={{ background: themeColors.cardBg }} /><svg className="absolute bottom-0 w-[250%]" viewBox="0 0 2880 120" preserveAspectRatio="none" style={{ left: '-5%', height: '100%' }}><path fill={`${themeColors.cardBg}66`} d="M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40 T1800,40 T2160,40 T2520,40 T2880,40 L2880,120 L0,120 Z" /><path fill={`${themeColors.cardBg}99`} d="M0,50 Q240,90 480,50 T960,50 T1440,50 T1920,50 T2400,50 T2880,50 L2880,120 L0,120 Z" /><path fill={themeColors.cardBg} d="M0,70 Q360,100 720,70 T1440,70 T2160,70 T2880,70 L2880,120 L0,120 Z" /></svg></div>

      {/* Guestbook Section - with visibility toggle */}
      {sectionVisibility.guestbook && (
        <section id="preview-guestbook" className="px-5 py-14 pb-20 text-center" style={{ background: themeColors.cardBg }}>
          <p className="text-[10px] font-light mb-4" style={{ color: themeColors.gray, letterSpacing: '4px' }}>GUESTBOOK</p>
          <h3 className="text-sm mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>축하의 한마디</h3>
          <div className="max-w-[300px] mx-auto mb-9"><p className="text-xs font-light leading-[1.7] mb-4 min-h-[40px]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>{invitation.content.guestbookQuestions[0] || '두 사람에게 해주고 싶은 말은?'}</p><div className="flex gap-2 mb-2.5"><input type="text" className="flex-1 px-3.5 py-3 border border-gray-200 rounded-lg text-[11px] font-light" style={{ background: '#fafafa', color: themeColors.text }} placeholder="20자 이내로 답해주세요" disabled /><button className="px-4 py-3 rounded-lg text-[10px] font-light text-white" style={{ background: themeColors.text }}>남기기</button></div><button className="text-[10px] font-light" style={{ color: '#aaa' }}>다른 질문 보기</button></div>
          <div className="relative min-h-[200px]"><div className="absolute w-[130px] px-3 py-3.5 bg-[#FFF9F0] rounded-lg text-left shadow-sm" style={{ transform: 'rotate(-3deg)', top: '10px', left: '20px' }}><p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">두 사람에게 해주고 싶은 말은?</p><p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>행복하세요!</p></div><div className="absolute w-[130px] px-3 py-3.5 bg-[#F0F7FF] rounded-lg text-left shadow-sm" style={{ transform: 'rotate(2deg)', top: '80px', right: '20px' }}><p className="text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]">결혼생활에서 가장 중요한 건?</p><p className="text-[11px] font-light leading-[1.6]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>서로 믿는 것</p></div></div>
        </section>
      )}

      {/* RSVP Section */}
      {invitation.rsvpEnabled && <section id="preview-rsvp" className="px-6 py-14 text-center" style={{ background: themeColors.cardBg }}><p className="text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>RSVP</p><p className="text-sm mb-4" style={{ color: '#666' }}>Please let us know if you can attend</p><button className="w-full py-3 rounded-lg text-xs" style={{ background: themeColors.primary, color: '#fff' }}>Submit RSVP</button>{invitation.rsvpDeadline && <p className="text-[10px] font-light mt-3" style={{ color: '#999' }}>Deadline: {formatDateDisplay(invitation.rsvpDeadline)}</p>}</section>}
      <div className="px-6 py-10 text-center" style={{ background: themeColors.background }}><p className="text-[10px] font-light" style={{ color: '#999' }}>Thank you for celebrating with us</p></div>
      <FloatingButton themeColors={themeColors} fonts={fonts} invitation={{
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
      {/* Full Height Divider - Title Section */}
      <section
        className="relative flex flex-col justify-center items-center text-center px-6"
        style={{
          height: '400px',
          backgroundImage: fullHeightDividers?.items?.[0]?.image ? `url(${fullHeightDividers.items[0].image})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
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

      {/* 신랑측 부모님 소개 */}
      {parentIntro?.groom?.enabled !== false && (
        <section className="px-6 py-16" style={{ background: '#ffffff' }}>
          <div className="text-center mb-8">
            <p className="text-[11px] mb-2" style={{ color: themeColors.gray }}>
              {parentIntro?.groom?.parentNames || `${invitation.groom.father?.name || '아버지'}, ${invitation.groom.mother?.name || '어머니'}의`}
            </p>
            <h3 className="text-lg" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              {parentIntro?.groom?.childOrder || '첫째'}아들 <span style={{ color: themeColors.primary }}>{groomName}</span> 결혼합니다
            </h3>
          </div>
          {/* 이미지 */}
          <div className="w-full aspect-[4/5] bg-gray-100 mb-8 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: parentIntro?.groom?.images?.[0] ? `url(${parentIntro.groom.images[0]})` : undefined }}
            />
          </div>
          {/* 메시지 */}
          <p className="text-xs leading-[2.2] whitespace-pre-line text-center" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
            {parentIntro?.groom?.message || '저희 아들이 좋은 사람을 만나\n결혼하게 되었습니다.\n\n부디 오셔서 축복해 주시면 감사하겠습니다.'}
          </p>
        </section>
      )}

      {/* 선 확장 디바이더 */}
      {parentIntro?.groom?.enabled !== false && parentIntro?.bride?.enabled !== false && (
        <div className="flex items-center justify-center py-12" style={{ background: '#ffffff' }}>
          <div className="flex items-center w-full max-w-[200px]">
            <div className="flex-1 h-px" style={{ background: `${themeColors.primary}40` }} />
            <div className="w-2 h-2 rounded-full mx-3" style={{ background: themeColors.primary, opacity: 0.6 }} />
            <div className="flex-1 h-px" style={{ background: `${themeColors.primary}40` }} />
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
              {parentIntro?.bride?.childOrder || '첫째'}딸 <span style={{ color: themeColors.primary }}>{brideName}</span> 결혼합니다
            </h3>
          </div>
          {/* 이미지 */}
          <div className="w-full aspect-[4/5] bg-gray-100 mb-8 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: parentIntro?.bride?.images?.[0] ? `url(${parentIntro.bride.images[0]})` : undefined }}
            />
          </div>
          {/* 메시지 */}
          <p className="text-xs leading-[2.2] whitespace-pre-line text-center" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
            {parentIntro?.bride?.message || '저희 딸이 좋은 사람을 만나\n결혼하게 되었습니다.\n\n부디 오셔서 축복해 주시면 감사하겠습니다.'}
          </p>
        </section>
      )}

      {/* Why We Chose Each Other - Title Divider */}
      {whyWeChose?.enabled !== false && (
        <section
          className="relative flex flex-col justify-center items-center text-center px-6"
          style={{
            height: '350px',
            backgroundImage: fullHeightDividers?.items?.[1]?.image ? `url(${fullHeightDividers.items[1].image})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
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
        <section className="py-16 px-7 text-center" style={{ background: '#ffffff' }}>
          <h3 className="text-base mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
            {whyWeChose?.title || '우리가 서로를 선택한 이유'}
          </h3>
          <p className="text-[11px]" style={{ color: themeColors.gray }}>
            {whyWeChose?.subtitle || '오래 보아도 좋은 사람, 서로 그렇게 되기까지'}
          </p>
        </section>
      )}

      {/* 신랑이 선택한 이유 */}
      {whyWeChose?.enabled !== false && whyWeChose?.groom?.enabled !== false && (
        <section className="px-7 pb-16" style={{ background: '#ffffff' }}>
          <ProfileImageSlider images={invitation.groom.profile.images} imageSettings={invitation.groom.profile.imageSettings} className="mb-10" />
          {/* Description Card */}
          <div className="relative p-6 mb-10" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.text}20` }}>
            <p className="text-xs leading-[2.2] whitespace-pre-line" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              {whyWeChose?.groom?.description || '이 사람과 함께라면\n더 따뜻한 사람이 될 수 있겠다는 마음이 들었습니다.'}
            </p>
          </div>
          {/* Quote */}
          <div className="text-right">
            <p className="text-base mb-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              &ldquo;{whyWeChose?.groom?.quote || '서로 아끼며 행복하게 살겠습니다.'}&rdquo;
            </p>
            <p className="text-[11px]" style={{ color: themeColors.gray }}>- {groomName}</p>
          </div>
        </section>
      )}

      {/* 신부가 선택한 이유 */}
      {whyWeChose?.enabled !== false && whyWeChose?.bride?.enabled !== false && (
        <section className="px-7 pb-16" style={{ background: '#ffffff' }}>
          <ProfileImageSlider images={invitation.bride.profile.images} imageSettings={invitation.bride.profile.imageSettings} className="mb-10" />
          {/* Description Card */}
          <div className="relative p-6 mb-10" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.text}20` }}>
            <p className="text-xs leading-[2.2] whitespace-pre-line" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              {whyWeChose?.bride?.description || '내가 나다워도 괜찮다고 말해주는\n이 사람이라면 오래오래 곁에 두고 싶다고.'}
            </p>
          </div>
          {/* Quote */}
          <div className="text-left">
            <p className="text-base mb-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text }}>
              &ldquo;{whyWeChose?.bride?.quote || '늘 처음처럼 행복하게 살겠습니다.'}&rdquo;
            </p>
            <p className="text-[11px]" style={{ color: themeColors.gray }}>- {brideName}</p>
          </div>
        </section>
      )}

      {/* Interview Title Divider */}
      {sectionVisibility.interview && invitation.content.interviews.some(i => i.question || i.answer) && (
        <section
          className="relative flex flex-col justify-center items-center text-center px-6"
          style={{
            height: '350px',
            backgroundImage: fullHeightDividers?.items?.[2]?.image ? `url(${fullHeightDividers.items[2].image})` : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
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

      {/* Gallery Section */}
      <section id="preview-gallery" className="px-5 py-10" style={{ background: themeColors.sectionBg }}>
        <div className="grid grid-cols-2 gap-2">{invitation.gallery.images && invitation.gallery.images.length > 0 ? invitation.gallery.images.map((img, i) => { const s = invitation.gallery.imageSettings?.[i] || { scale: 1, positionX: 0, positionY: 0 }; return <div key={i} className="aspect-square overflow-hidden"><div className="w-full h-full transition-transform duration-300" style={getImageCropStyle(img, s)} /></div> }) : [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-gray-100 flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>)}</div>
      </section>

      {/* Interview Section */}
      {sectionVisibility.interview && invitation.content.interviews.map((interview, index) => interview.question || interview.answer ? (
        <section key={index} className="px-7 py-14" style={{ background: '#ffffff' }}>
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
            <p className="text-[11px] font-light leading-[2.2]" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: parseHighlight(interview.answer) }} />
          )}
        </section>
      ) : null)}

      {/* Guidance & Info Section */}
      {sectionVisibility.guidance && (
        <section className="px-6 py-14" style={{ background: themeColors.sectionBg }}>
          <h3 className="text-[15px] text-center mb-3" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 400 }}>
            행복한 시간을 위한 안내
          </h3>
          <div className="w-10 h-px mx-auto mb-8" style={{ background: themeColors.divider }} />

          {/* Info Blocks */}
          {invitation.content.info.dressCode.enabled && (
            <div className="px-6 py-6 mb-4" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
              <h4 className="text-[13px] mb-4 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-[3px] h-[14px] rounded-sm" style={{ background: themeColors.accent }} />
                {invitation.content.info.dressCode.title}
              </h4>
              <p className="text-xs leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.dressCode.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content.info.photoShare.enabled && (
            <div className="px-6 py-6 mb-4" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
              <h4 className="text-[13px] mb-4 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-[3px] h-[14px] rounded-sm" style={{ background: themeColors.accent }} />
                {invitation.content.info.photoShare.title}
              </h4>
              <p className="text-xs leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.photoShare.content.replace(/\n/g, '<br/>') }} />
              {invitation.content.info.photoShare.buttonText && (
                <button className="mt-4 px-5 py-2.5 text-[11px] transition-all" style={{ background: themeColors.primary, color: '#fff' }}>
                  {invitation.content.info.photoShare.buttonText}
                </button>
              )}
            </div>
          )}
          {invitation.content.info.photoBooth?.enabled && (
            <div className="px-6 py-6 mb-4" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
              <h4 className="text-[13px] mb-4 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-[3px] h-[14px] rounded-sm" style={{ background: themeColors.accent }} />
                {invitation.content.info.photoBooth.title}
              </h4>
              <p className="text-xs leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.photoBooth.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content.info.flowerChild?.enabled && (
            <div className="px-6 py-6 mb-4" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
              <h4 className="text-[13px] mb-4 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-[3px] h-[14px] rounded-sm" style={{ background: themeColors.accent }} />
                {invitation.content.info.flowerChild.title}
              </h4>
              <p className="text-xs leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: invitation.content.info.flowerChild.content.replace(/\n/g, '<br/>') }} />
            </div>
          )}
          {invitation.content.info.customItems?.map(item => item.enabled && (
            <div key={item.id} className="px-6 py-6 mb-4" style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)' }}>
              <h4 className="text-[13px] mb-4 flex items-center gap-2" style={{ fontFamily: fonts.displayKr, color: themeColors.text, fontWeight: 500 }}>
                <span className="w-[3px] h-[14px] rounded-sm" style={{ background: themeColors.accent }} />
                {item.title}
              </h4>
              <p className="text-xs leading-8" style={{ color: '#666' }} dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br/>') }} />
            </div>
          ))}
        </section>
      )}

      {/* Thank You Section */}
      <section className="min-h-[300px] flex flex-col justify-center items-center text-center px-7 py-20" style={{ background: themeColors.cardBg }}>
        <p className="text-[10px] font-light mb-6" style={{ color: themeColors.gray, letterSpacing: '4px' }}>THANK YOU</p>
        <h2 className="text-lg mb-7" style={{ fontFamily: fonts.display, color: themeColors.text, fontWeight: 400, letterSpacing: '4px' }}>{invitation.content.thankYou.title}</h2>
        {invitation.content.thankYou.message ? (
          <p className="text-[11px] font-light leading-[2.2] mb-7" style={{ fontFamily: fonts.displayKr, color: themeColors.text }} dangerouslySetInnerHTML={{ __html: invitation.content.thankYou.message.replace(/\n/g, '<br/>') }} />
        ) : (
          <p className="text-[11px] text-gray-400 italic mb-7">Please enter thank you message</p>
        )}
        {invitation.content.thankYou.sign && <p className="text-[11px] font-light" style={{ fontFamily: fonts.displayKr, color: themeColors.gray }}>{invitation.content.thankYou.sign}</p>}
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
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="px-6 py-10 text-center" style={{ background: themeColors.background }}>
        <p className="text-[10px] font-light" style={{ color: '#999' }}>Thank you for celebrating with us</p>
      </div>

      <FloatingButton themeColors={themeColors} fonts={fonts} invitation={{
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
  )
}
