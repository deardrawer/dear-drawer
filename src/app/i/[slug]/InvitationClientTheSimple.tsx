'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import TheSimplePreview from '@/app/editor/the-simple/TheSimplePreview'
import TapToOpenCover from '@/app/editor/the-simple/TapToOpenCover'
import type {
  TheSimpleInvitationData,
  GalleryImage,
  ImageWithSettings,
  TheSimpleImageSettings,
} from '@/app/editor/the-simple/page'
import type { Invitation } from '@/types/invitation'
import { WatermarkOverlay } from '@/components/ui/WatermarkOverlay'

function MusicToggle({ audioRef, shouldAutoPlay }: { audioRef: React.RefObject<HTMLAudioElement | null>; shouldAutoPlay: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const hasAutoPlayed = useRef(false)

  useEffect(() => {
    if (shouldAutoPlay && !hasAutoPlayed.current && audioRef.current) {
      hasAutoPlayed.current = true
      const saved = localStorage.getItem('musicEnabled')
      if (saved === 'false') return
      setTimeout(() => {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {})
      }, 100)
    }
  }, [shouldAutoPlay, audioRef])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause) }
  }, [audioRef])

  const toggle = () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => { setIsPlaying(true); localStorage.setItem('musicEnabled', 'true') }).catch(console.error)
    } else {
      audioRef.current.pause(); setIsPlaying(false); localStorage.setItem('musicEnabled', 'false')
    }
  }

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110"
      style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {isPlaying ? (
        <svg className="w-4 h-4 text-stone-700" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
      ) : (
        <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
      )}
    </button>
  )
}

const DEFAULT_IMG_SETTINGS: TheSimpleImageSettings = { scale: 1, positionX: 0, positionY: 0 }

/**
 * 문자열 URL 또는 { url, settings } 객체를 ImageWithSettings로 정규화.
 * 기존 저장 데이터 하위호환 용도.
 */
function normalizePhoto(input: unknown): ImageWithSettings | undefined {
  if (!input) return undefined
  if (typeof input === 'string') {
    return { url: input, settings: { ...DEFAULT_IMG_SETTINGS } }
  }
  if (typeof input === 'object') {
    const obj = input as Partial<ImageWithSettings> & { url?: string }
    if (!obj.url) return undefined
    return {
      url: obj.url,
      settings: {
        scale: obj.settings?.scale ?? 1,
        positionX: obj.settings?.positionX ?? 0,
        positionY: obj.settings?.positionY ?? 0,
        ...(obj.settings?.cropX !== undefined && { cropX: obj.settings.cropX }),
        ...(obj.settings?.cropY !== undefined && { cropY: obj.settings.cropY }),
        ...(obj.settings?.cropWidth !== undefined && { cropWidth: obj.settings.cropWidth }),
        ...(obj.settings?.cropHeight !== undefined && { cropHeight: obj.settings.cropHeight }),
      },
    }
  }
  return undefined
}

/**
 * photos 배열 정규화 — photos 배열 우선, 없으면 단일 photo를 배열로 변환
 */
function normalizePhotos(photosRaw: unknown, photoFallback: unknown): ImageWithSettings[] {
  if (Array.isArray(photosRaw) && photosRaw.length > 0) {
    return photosRaw.map((p) => normalizePhoto(p)).filter((p): p is ImageWithSettings => !!p)
  }
  const single = normalizePhoto(photoFallback)
  return single ? [single] : []
}

/**
 * 갤러리 이미지 배열 정규화 - 각 이미지의 settings 기본값 보장.
 */
function normalizeGalleryImages(input: unknown): GalleryImage[] {
  if (!Array.isArray(input)) return []
  return input
    .map((img): GalleryImage | null => {
      if (!img || typeof img !== 'object') return null
      const obj = img as Partial<GalleryImage>
      if (!obj.id || !obj.webUrl) return null
      return {
        id: obj.id,
        webUrl: obj.webUrl,
        thumbUrl: obj.thumbUrl || obj.webUrl,
        width: obj.width,
        height: obj.height,
        settings: obj.settings
          ? {
              scale: obj.settings.scale ?? 1,
              positionX: obj.settings.positionX ?? 0,
              positionY: obj.settings.positionY ?? 0,
              ...(obj.settings.cropX !== undefined && { cropX: obj.settings.cropX }),
              ...(obj.settings.cropY !== undefined && { cropY: obj.settings.cropY }),
              ...(obj.settings.cropWidth !== undefined && { cropWidth: obj.settings.cropWidth }),
              ...(obj.settings.cropHeight !== undefined && { cropHeight: obj.settings.cropHeight }),
            }
          : { ...DEFAULT_IMG_SETTINGS },
      }
    })
    .filter((img): img is GalleryImage => img !== null)
}

interface GuestInfo {
  id: string
  name: string | null
  relation: string | null
  honorific: string | null
  introGreeting: string | null
  customMessage: string | null
}

interface InvitationClientTheSimpleProps {
  invitation: Invitation
  content: unknown
  isPaid: boolean
  isPreview?: boolean
  overrideColorTheme?: string
  overrideFontStyle?: string
  skipIntro?: boolean
  guestInfo?: GuestInfo | null
  isSample?: boolean
}

/**
 * THE SIMPLE 템플릿 전용 게스트 뷰 클라이언트 컴포넌트.
 *
 * 에디터와 동일한 TheSimplePreview 컴포넌트를 공개 페이지에서 재사용합니다.
 * 저장된 invitation.content 가 이미 `TheSimpleInvitationData` 형태이므로
 * 최소한의 정규화만 거쳐서 그대로 넘깁니다.
 */
export default function InvitationClientTheSimple({
  invitation,
  content,
  isPaid,
  isPreview,
}: InvitationClientTheSimpleProps) {
  // content 가 null 이거나 잘못 파싱된 경우를 대비한 최소 fallback
  const data: TheSimpleInvitationData = normalizeTheSimpleData(content, invitation)
  const hasCover = (data.coverVariant ?? 0) > 0
  const [coverOpen, setCoverOpen] = useState(false)
  const [curtainRevealed, setCurtainRevealed] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasBgm = data.bgm?.enabled && !!data.bgm?.url

  const handleCoverOpen = useCallback(() => {
    setCoverOpen(true)
  }, [])

  const coverData = {
    groomName: data.groom.name,
    brideName: data.bride.name,
    groomNameEn: data.groom.nameEn || '',
    brideNameEn: data.bride.nameEn || '',
    weddingDate: data.wedding.date,
    weddingTime: data.wedding.timeDisplay,
    venueName: data.wedding.venue.name,
    venueHall: data.wedding.venue.hall,
  }

  return (
    <div
      style={{
        background: '#f5f5f4',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* 워터마크 배너 */}
      {!isPaid && !isPreview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px 16px', backgroundColor: 'rgba(0, 0, 0, 0.9)',
        }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '13px', fontWeight: 500 }}>
            결제 후 워터마크가 제거됩니다
          </span>
        </div>
      )}

      {/* Cover overlay */}
      {hasCover && !coverOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            background: data.coverVariant === 5 ? 'transparent' : '#fff',
          }}
        >
          <div style={{ width: '100%', maxWidth: 430 }}>
            <TapToOpenCover
              variant={data.coverVariant!}
              data={coverData}
              onOpen={handleCoverOpen}
              onStartOpen={() => setCurtainRevealed(true)}
            />
          </div>
        </div>
      )}

      <WatermarkOverlay
        isPaid={isPaid || !!isPreview}
        style={{
          width: '100%',
          maxWidth: 430,
          background: '#fff',
          position: 'relative',
        }}
      >
        {(!hasCover || coverOpen || curtainRevealed) && <TheSimplePreview data={data} skipIntroBgFade={hasCover} />}
      </WatermarkOverlay>

      {/* BGM */}
      {hasBgm && (
        <>
          <audio ref={audioRef} loop preload="auto">
            <source src={data.bgm!.url} type="audio/mpeg" />
          </audio>
          <MusicToggle
            audioRef={audioRef}
            shouldAutoPlay={(!hasCover || coverOpen) && data.bgm?.autoplay === true}
          />
        </>
      )}
    </div>
  )
}

/**
 * 저장된 content 가 예상 스키마와 다를 경우를 방지하기 위한 보정.
 * - 필수 필드 기본값 채움
 * - invitation 테이블의 컬럼 값으로 누락된 필드 보완
 */
function normalizeTheSimpleData(
  content: unknown,
  invitation: Invitation
): TheSimpleInvitationData {
  const c = (content && typeof content === 'object' ? content : {}) as Partial<TheSimpleInvitationData>

  const DEFAULT_ORDER = [
    'intro',
    'greeting',
    'couple',
    'lovestory',
    'info',
    'direction',
    'interview',
    'gallery',
    'video',
    'guide',
    'account',
    'rsvp',
    'guestbook',
    'thanks',
  ]

  const defaultSections = {
    intro: { eyebrow: 'The Simple · Invitation', title: 'THE SIMPLE', body: '' },
    greeting: { label: 'Invitation', title: '초대합니다', body: '' },
    couple: {
      eyebrow: 'The Couple',
      groom: { role: 'Groom', bio: '' },
      bride: { role: 'Bride', bio: '' },
    },
    info: { eyebrow: 'Wedding Date', timeLabel: 'Time', placeLabel: 'Place' },
    direction: { eyebrow: 'Direction' },
    interview: { eyebrow: 'Q&A', items: [] as { question: string; answer: string }[] },
    guide: {
      eyebrow: 'Guide',
      items: [] as { label: string; title: string; body: string; link?: string }[],
    },
    account: {
      eyebrow: 'Account',
      groom: [] as { bank: string; number: string; holder: string }[],
      bride: [] as { bank: string; number: string; holder: string }[],
      groomFather: [] as { bank: string; number: string; holder: string }[],
      groomMother: [] as { bank: string; number: string; holder: string }[],
      brideFather: [] as { bank: string; number: string; holder: string }[],
      brideMother: [] as { bank: string; number: string; holder: string }[],
    },
    lovestory: { eyebrow: 'Love Story', items: [] as { body: string; photo1?: unknown; photo2?: unknown }[] },
    video: { eyebrow: 'Video', url: '' },
    rsvp: { title: 'R.S.V.P.', body: '참석 여부를 전해주시면\n정성껏 준비하겠습니다.' },
    thanks: { mark: 'Thank You', title: '', body: '' },
  }

  const sectionsRaw = {
    ...defaultSections,
    ...(c.sections || {}),
  } as TheSimpleInvitationData['sections']

  // couple.groom/bride.photo + photos 정규화 (기존 데이터에 photo/photos 없을 수 있음)
  const coupleRaw = sectionsRaw.couple as TheSimpleInvitationData['sections']['couple'] & {
    groom: { photo?: unknown; photos?: unknown }
    bride: { photo?: unknown; photos?: unknown }
  }
  const introRaw = sectionsRaw.intro as TheSimpleInvitationData['sections']['intro'] & {
    photo?: unknown
  }
  // lovestory items 정규화 (각 아이템의 photo1/photo2 정규화)
  const lovestoryRaw = sectionsRaw.lovestory as { eyebrow?: string; items?: unknown[] }
  const normalizedLsItems = Array.isArray(lovestoryRaw?.items)
    ? lovestoryRaw.items.map((raw: unknown) => {
        const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
        return {
          body: typeof item.body === 'string' ? item.body : '',
          photo1: normalizePhoto(item.photo1),
          photo2: normalizePhoto(item.photo2),
        }
      })
    : []

  const sections: TheSimpleInvitationData['sections'] = {
    ...sectionsRaw,
    intro: {
      ...sectionsRaw.intro,
      photo: normalizePhoto(introRaw.photo),
    },
    couple: {
      ...sectionsRaw.couple,
      groom: {
        ...sectionsRaw.couple.groom,
        photo: normalizePhoto(coupleRaw.groom?.photo),
        photos: normalizePhotos(coupleRaw.groom?.photos, coupleRaw.groom?.photo),
      },
      bride: {
        ...sectionsRaw.couple.bride,
        photo: normalizePhoto(coupleRaw.bride?.photo),
        photos: normalizePhotos(coupleRaw.bride?.photos, coupleRaw.bride?.photo),
      },
    },
    lovestory: {
      eyebrow: lovestoryRaw?.eyebrow || 'Love Story',
      items: normalizedLsItems,
      toggle: (sectionsRaw.lovestory as { toggle?: { enabled: boolean; label: string; style?: number } }).toggle,
    },
  }

  // galleries 정규화 (각 인스턴스별 이미지 settings 채움)
  const rawGalleries = (c.galleries || { gallery: [] }) as Record<string, unknown>
  const galleries: Record<string, GalleryImage[]> = {}
  for (const [key, value] of Object.entries(rawGalleries)) {
    galleries[key] = normalizeGalleryImages(value)
  }
  if (!galleries.gallery) galleries.gallery = []

  return {
    id: invitation.id,
    slug: invitation.slug || undefined,
    groom: {
      name: c.groom?.name || invitation.groom_name || '',
      phone: c.groom?.phone || invitation.contact_groom || '',
      nameEn: c.groom?.nameEn || undefined,
    },
    bride: {
      name: c.bride?.name || invitation.bride_name || '',
      phone: c.bride?.phone || invitation.contact_bride || '',
      nameEn: c.bride?.nameEn || undefined,
    },
    wedding: {
      date: c.wedding?.date || invitation.wedding_date || '2026-05-16',
      time: c.wedding?.time || '13:00',
      timeDisplay: c.wedding?.timeDisplay || invitation.wedding_time || '오후 1시',
      venue: {
        name: c.wedding?.venue?.name || invitation.venue_name || '',
        hall: c.wedding?.venue?.hall || '',
        address: c.wedding?.venue?.address || invitation.venue_address || '',
      },
    },
    sections,
    sectionOrder: c.sectionOrder && c.sectionOrder.length > 0 ? c.sectionOrder : DEFAULT_ORDER,
    sectionVariants: (() => {
      // 구 variant 번호 하위호환 (9-variant → 5-variant 전환)
      // 새 체계에서 유효한 범위는 1~5. 6 이상은 구 체계이므로 매핑 필요.
      // 6(풀슬라이드)→2, 7(커스텀)→5, 8(시네마)→3, 9(커스텀)→5, 10(슬라이드)→2
      const GALLERY_OLD_MAP: Record<number, number> = {
        6: 2,   // 풀슬라이드(구) → V2 슬라이드쇼
        7: 5,   // 커스텀(구) → V5 혼합
        8: 3,   // 시네마틱(구) → V3 가로전용
        9: 5,   // 커스텀(구) → V5 혼합
        10: 2,  // 슬라이드쇼(구) → V2 슬라이드쇼
      }
      const raw = c.sectionVariants && Object.keys(c.sectionVariants).length > 0
        ? { ...c.sectionVariants }
        : Object.fromEntries(DEFAULT_ORDER.map((id) => [id, 1]))
      // gallery 인스턴스 중 범위 밖(>5) variant 번호만 매핑
      for (const key of Object.keys(raw)) {
        const isGallery = key === 'gallery' || key.startsWith('gallery-')
        if (isGallery && raw[key] > 5) {
          raw[key] = GALLERY_OLD_MAP[raw[key]] ?? 5
        }
      }
      return raw
    })(),
    hiddenSections: c.hiddenSections || [],
    galleries,
    galleryRowPatterns: (c as Record<string, unknown>).galleryRowPatterns as Record<string, number[]> | undefined,
    galleryShowMoreRow: (c as Record<string, unknown>).galleryShowMoreRow as Record<string, number> | undefined,
    galleryEyebrows: (c as Record<string, unknown>).galleryEyebrows as Record<string, string> | undefined,
    coverVariant: typeof c.coverVariant === 'number' ? c.coverVariant : 0,
    dividerVariant: c.dividerVariant ?? 1,
    displayFont: c.displayFont,
    fontStyle: c.fontStyle,
    fontScale: typeof c.fontScale === 'number' ? c.fontScale : 1,
    sectionSpacing: typeof c.sectionSpacing === 'number' ? c.sectionSpacing : 1,
    bgm: c.bgm ? {
      enabled: !!c.bgm.enabled,
      url: c.bgm.url || '',
      autoplay: c.bgm.autoplay !== false,
    } : undefined,
    meta: {
      title: c.meta?.title || '',
      description: c.meta?.description || '',
      ogImage: c.meta?.ogImage || '',
      ...(c.meta?.kakaoThumbnail && { kakaoThumbnail: c.meta.kakaoThumbnail }),
    },
  }
}
