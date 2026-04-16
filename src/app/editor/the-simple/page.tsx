'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import ShareModal from '@/components/share/ShareModal'
import TheSimplePreview from './TheSimplePreview'
import SectionListPanel from './SectionListPanel'
import IntroEditor from './SectionEditors/IntroEditor'
import GreetingEditor from './SectionEditors/GreetingEditor'
import CoupleEditor from './SectionEditors/CoupleEditor'
import ThanksEditor from './SectionEditors/ThanksEditor'
import InterviewEditor from './SectionEditors/InterviewEditor'
import GuideEditor from './SectionEditors/GuideEditor'
import AccountEditor from './SectionEditors/AccountEditor'
import LoveStoryEditor from './SectionEditors/LoveStoryEditor'
import RsvpEditor from './SectionEditors/RsvpEditor'
import VideoEditor from './SectionEditors/VideoEditor'
import InfoEditor from './SectionEditors/InfoEditor'
import DirectionEditor from './SectionEditors/DirectionEditor'
import MetaEditor from './SectionEditors/MetaEditor'
import TapToOpenCover, { COVER_VARIANTS } from './TapToOpenCover'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ImageZoomEditor from '@/components/editor/ImageZoomEditor'
import { uploadImages, deleteImage } from '@/lib/imageUpload'
import { bgmPresets, getBgmPresetByUrl } from '@/lib/bgmPresets'
import { loadKakaoMapSDK } from '@/lib/geunnalKakaoMap'
import { createSectionInstanceId, getSectionType } from './utils'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DISPLAY_FONTS,
  KOREAN_FONTS,
  DEFAULT_DISPLAY_FONT_ID,
  DEFAULT_KOREAN_FONT_ID,
} from './fontOptions'

/** 갤러리 V3~V5 기본 행 패턴 */
export const GALLERY_DEFAULT_PATTERNS: Record<number, number[]> = {
  3: [1, 2, 1],
  4: [1, 2, 1],
  5: [1, 3, 2, 1],
}

/**
 * 이미지 크롭/위치 설정 (OUR 템플릿과 동일 패턴)
 * InlineCropEditor가 내부적으로 cropX/Y/W/H를 사용하므로 함께 보관한다.
 */
export interface TheSimpleImageSettings {
  scale: number
  positionX: number
  positionY: number
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

/**
 * 신랑/신부 사진용 단일 이미지 + settings
 */
export interface ImageWithSettings {
  url: string
  settings: TheSimpleImageSettings
}

/**
 * 갤러리 이미지 아이템
 * - settings는 선택적(기존 데이터 호환). 미지정 시 기본값 사용.
 */
export interface GalleryImage {
  id: string
  webUrl: string
  thumbUrl: string
  width?: number
  height?: number
  settings?: TheSimpleImageSettings
}

/**
 * 섹션별 콘텐츠 스키마
 *
 * 각 섹션 타입은 자체 필드 구조를 가집니다. Variant(V1~V10)는
 * 이 데이터를 각기 다른 레이아웃으로 "표시"만 할 뿐, 스키마는 공유합니다.
 *
 * 새 섹션 에디터가 추가될 때마다 이 타입을 확장합니다.
 */
export interface SectionContents {
  intro: {
    eyebrow: string
    title: string
    body: string
    // 배경 이미지 (전체 variant 적용, 크롭 설정 포함)
    photo?: ImageWithSettings
    // 이름 표시 방식: korean(기본), english, custom
    showNames?: 'korean' | 'english' | 'custom'
    // 커스텀 이름 문구 (showNames === 'custom' 일 때 사용)
    customNames?: string
    // 텍스트 위치 (배경 이미지 위 텍스트 가독성 조절)
    textPosition?: 'top' | 'center' | 'bottom'
  }
  greeting: { label: string; title: string; body: string }
  couple: {
    eyebrow: string
    groom: { role: string; bio: string; photo?: ImageWithSettings; photos?: ImageWithSettings[]; tags?: string[] }
    bride: { role: string; bio: string; photo?: ImageWithSettings; photos?: ImageWithSettings[]; tags?: string[] }
  }
  info: {
    eyebrow: string
    timeLabel: string
    placeLabel: string
  }
  direction: {
    eyebrow: string
    transport?: {
      car?: string
      bus?: string
      subway?: string
      train?: string
      expressBus?: string
      custom?: string
      customLabel?: string
    }
  }
  interview: {
    eyebrow: string
    items: Array<{ question: string; answer: string }>
    toggle?: { enabled: boolean; label: string; style?: number }
  }
  guide: {
    eyebrow: string
    items: Array<{ label: string; title: string; body: string; link?: string }>
  }
  account: {
    eyebrow: string
    groom: Array<{ bank: string; number: string; holder: string }>
    bride: Array<{ bank: string; number: string; holder: string }>
    groomFather: Array<{ bank: string; number: string; holder: string }>
    groomMother: Array<{ bank: string; number: string; holder: string }>
    brideFather: Array<{ bank: string; number: string; holder: string }>
    brideMother: Array<{ bank: string; number: string; holder: string }>
    groomFatherName?: string
    groomMotherName?: string
    brideFatherName?: string
    brideMotherName?: string
  }
  lovestory: {
    eyebrow: string
    items: LoveStoryItem[]
    toggle?: { enabled: boolean; label: string; style?: number }
  }
  video: {
    eyebrow: string
    url: string
  }
  rsvp: {
    title: string
    body: string
  }
  thanks: {
    mark: string
    title: string
    body: string
  }
}

/**
 * 러브스토리 개별 아이템
 */
export interface LoveStoryItem {
  body: string
  photo1?: ImageWithSettings
  photo2?: ImageWithSettings
}

/**
 * THE SIMPLE 에디터 데이터 타입
 */
export interface TheSimpleInvitationData {
  id?: string
  slug?: string

  // 기본 커플 정보
  groom: {
    name: string
    phone: string
    nameEn?: string
  }
  bride: {
    name: string
    phone: string
    nameEn?: string
  }

  // 예식 정보
  wedding: {
    date: string
    time: string
    timeDisplay: string
    venue: {
      name: string
      hall: string
      address: string
    }
  }

  // 섹션별 콘텐츠 (인트로 · 인사말 · ...)
  sections: SectionContents

  // 섹션 순서 (드래그 앤 드롭 대상)
  sectionOrder: string[]

  // 각 섹션의 UI 대안 선택값 (variant 번호)
  sectionVariants: Record<string, number>

  // 숨김 처리된 섹션 id 목록 (optional 섹션만 대상)
  hiddenSections: string[]

  // 섹션 인스턴스별 갤러리 이미지 (예: { gallery: [...], 'gallery-1734567890': [...] })
  galleries: Record<string, GalleryImage[]>

  // 구분선 스타일 (1~5)
  // 1=line, 2=dots, 3=dashed, 4=double, 5=ornament
  dividerVariant: number

  // 폰트 설정 (매거진 에디터와 동일 목록)
  displayFont?: string // 영문 디스플레이 폰트 id (fontOptions.DISPLAY_FONTS)
  fontStyle?: string // 한글 본문 폰트 id (fontOptions.KOREAN_FONTS)

  // 글자 크기 스케일 (0.85 ~ 1.2, 기본 1)
  fontScale?: number
  // 섹션 상하 여백 스케일 (0.6 ~ 1.5, 기본 1)
  sectionSpacing?: number

  // 갤러리 행 패턴 (V3~V5 커스텀 레이아웃용)
  // key = gallery instanceId, value = 행별 이미지 수 배열
  galleryRowPatterns?: Record<string, number[]>

  // 갤러리 "사진 더보기" 접기 행 (V3~V5 커스텀 레이아웃용)
  // key = gallery instanceId, value = 몇 번째 행까지 보여줄지 (0=전체 표시, 1~N=해당 행 이후 접기)
  galleryShowMoreRow?: Record<string, number>

  // 갤러리 섹션 제목 (인스턴스별)
  // key = gallery instanceId, value = 표시 텍스트 (빈 문자열 → 제목 숨김)
  galleryEyebrows?: Record<string, string>

  // 커버 (Tap to Open) variant (0=없음, 1~10)
  coverVariant?: number

  // 배경음악
  bgm?: {
    enabled: boolean
    url: string
    autoplay: boolean
  }

  // 메타
  meta: {
    title: string
    description: string
    ogImage: string | ImageWithSettings
    kakaoThumbnail?: ImageWithSettings
  }
}

const DEFAULT_SECTION_ORDER = [
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

const defaultData: TheSimpleInvitationData = {
  groom: { name: '', phone: '', nameEn: 'Minjun' },
  bride: { name: '', phone: '', nameEn: 'Seoyeon' },
  wedding: {
    date: '2026-05-16',
    time: '13:00',
    timeDisplay: '오후 1시',
    venue: { name: '', hall: '', address: '' },
  },
  sections: {
    intro: {
      eyebrow: 'The Simple · Invitation',
      title: 'THE SIMPLE',
      body: '가장 평범한 단어로\n가장 특별한 하루를 전합니다.',
      showNames: 'english',
    },
    greeting: {
      label: 'Invitation',
      title: '초대합니다',
      body: '서로 다른 시간을 걸어온 두 사람이\n같은 길 위에서 만났습니다.\n귀한 걸음으로 축복해 주세요.',
    },
    couple: {
      eyebrow: 'The Couple',
      groom: {
        role: 'Groom',
        bio: '따뜻한 미소가 매력적인 사람',
      },
      bride: {
        role: 'Bride',
        bio: '밝은 에너지로 주변을 환하게 하는 사람',
      },
    },
    info: {
      eyebrow: 'Wedding Date',
      timeLabel: 'Time',
      placeLabel: 'Place',
    },
    direction: {
      eyebrow: 'Direction',
      transport: {
        car: '내비게이션 "그랜드 하얏트 서울" 검색\n주차장 2시간 무료 (웨딩홀 도장 지참)',
        bus: '강남역 2번 출구 앞 472번, 741번\n그랜드 하얏트 정류장 하차 도보 3분',
        subway: '2호선 강남역 2번 출구 도보 10분\n분당선 한티역 3번 출구 도보 5분',
      },
    },
    interview: {
      eyebrow: 'Q&A',
      items: [
        { question: '서로의 첫인상은 어땠나요?', answer: '처음 본 순간, 이 사람이구나 싶었습니다.' },
        {
          question: '결혼을 결심한 이유는?',
          answer:
            '평범한 하루가 특별해지는 사람이라는 걸 알게 되었을 때, 망설일 이유가 없었습니다.',
        },
        { question: '앞으로의 다짐 한마디.', answer: '같은 방향을 바라보며 천천히, 오래 걸어가겠습니다.' },
      ],
    },
    guide: {
      eyebrow: 'Guide',
      items: [
        { label: 'Dress Code', title: '드레스코드', body: '블랙 & 화이트를 제외한\n여러분의 스타일로 함께해주세요.' },
        { label: 'Photo Booth', title: '포토부스 안내', body: '1F 로비 · 3F 테라스\n오픈 13:00' },
        { label: 'Flower', title: '꽃 답례품 안내', body: '감사의 마음을 담은\n작은 꽃다발을 준비했습니다.' },
        { label: 'Photo', title: '사진공유', body: '여러분의 시선으로 담긴\n우리의 순간을 나눠주세요.' },
      ],
    },
    lovestory: {
      eyebrow: 'Love Story',
      items: [
        {
          body: '어느 봄날, 같은 카페에서 눈이 마주쳤습니다.',
        },
        {
          body: '함께하는 시간이 늘어갈수록 서로에게 빠져들었습니다.',
        },
      ],
    },
    video: {
      eyebrow: 'Video',
      url: '',
    },
    rsvp: {
      title: 'R.S.V.P.',
      body: '참석 여부를 전해주시면\n정성껏 준비하겠습니다.',
    },
    account: {
      eyebrow: 'Account',
      groom: [],
      bride: [],
      groomFather: [],
      groomMother: [],
      brideFather: [],
      brideMother: [],
    },
    thanks: {
      mark: 'Thank You',
      title: '소중한 걸음에 감사드립니다',
      body: '귀한 시간 내어 축복해 주신 마음,\n오래도록 간직하겠습니다.',
    },
  },
  sectionOrder: DEFAULT_SECTION_ORDER,
  sectionVariants: Object.fromEntries(DEFAULT_SECTION_ORDER.map((id) => [id, 1])),
  hiddenSections: [],
  galleries: {
    gallery: [],
  },
  galleryRowPatterns: {},
  galleryShowMoreRow: {},
  galleryEyebrows: {
    gallery: 'Gallery',
  },
  coverVariant: 0,
  dividerVariant: 1,
  displayFont: DEFAULT_DISPLAY_FONT_ID,
  fontStyle: DEFAULT_KOREAN_FONT_ID,
  fontScale: 1,
  sectionSpacing: 1,
  bgm: {
    enabled: false,
    url: '',
    autoplay: true,
  },
  meta: {
    title: '',
    description: '',
    ogImage: '',
  },
}

/**
 * 디바이더 variant 미리보기 (에디터 버튼용 · 44x10px)
 */
function DividerPreview({ variant }: { variant: number }) {
  const common = { width: 40, height: 10 } as const
  switch (variant) {
    case 0:
      return (
        <span style={{ fontSize: 9, color: '#999', fontFamily: 'sans-serif' }}>없음</span>
      )
    case 2:
      return (
        <svg viewBox="0 0 40 10" style={common}>
          <circle cx="14" cy="5" r="1.5" fill="#1a1a1a" />
          <circle cx="20" cy="5" r="1.5" fill="#1a1a1a" />
          <circle cx="26" cy="5" r="1.5" fill="#1a1a1a" />
        </svg>
      )
    case 3:
      return (
        <svg viewBox="0 0 40 10" style={common}>
          <line
            x1="4"
            y1="5"
            x2="36"
            y2="5"
            stroke="#1a1a1a"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        </svg>
      )
    case 4:
      return (
        <svg viewBox="0 0 40 10" style={common}>
          <line x1="4" y1="3" x2="36" y2="3" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="4" y1="7" x2="36" y2="7" stroke="#1a1a1a" strokeWidth="1" />
        </svg>
      )
    case 5:
      return (
        <svg viewBox="0 0 40 10" style={common}>
          <line x1="2" y1="5" x2="16" y2="5" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="24" y1="5" x2="38" y2="5" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="17.5" y="2.5" width="5" height="5" transform="rotate(45 20 5)" fill="#1a1a1a" />
        </svg>
      )
    case 1:
    default:
      return (
        <svg viewBox="0 0 40 10" style={common}>
          <line x1="2" y1="5" x2="38" y2="5" stroke="#1a1a1a" strokeWidth="1" />
        </svg>
      )
  }
}

/** 에디터 패널용 카카오맵 미니 프리뷰 — 주소 변경 시 자동 업데이트 */
function EditorMapPreview({ address, venueName }: { address: string; venueName?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current = null
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
    setFailed(false)
    if (!address || !containerRef.current) return
    let cancelled = false

    const timer = setTimeout(() => {
      loadKakaoMapSDK()
        .then(() => {
          if (cancelled || !containerRef.current) return
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const kakao = (window as any).kakao
          if (!kakao?.maps) { setFailed(true); return }

          const geocoder = new kakao.maps.services.Geocoder()
          geocoder.addressSearch(address, (result: { x: string; y: string }[], status: string) => {
            if (cancelled || !containerRef.current) return
            if (status !== kakao.maps.services.Status.OK || !result[0]) {
              const places = new kakao.maps.services.Places()
              const keyword = venueName ? `${venueName} ${address}` : address
              places.keywordSearch(keyword, (pResult: { x: string; y: string }[], pStatus: string) => {
                if (cancelled || !containerRef.current) return
                if (pStatus !== kakao.maps.services.Status.OK || !pResult[0]) {
                  setFailed(true)
                  return
                }
                build(kakao, containerRef.current!, pResult[0].y, pResult[0].x)
              })
              return
            }
            build(kakao, containerRef.current!, result[0].y, result[0].x)
          })
        })
        .catch(() => { if (!cancelled) setFailed(true) })
    }, 600)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function build(kakao: any, el: HTMLDivElement, lat: string, lng: string) {
      const pos = new kakao.maps.LatLng(parseFloat(lat), parseFloat(lng))
      const map = new kakao.maps.Map(el, { center: pos, level: 3 })
      new kakao.maps.Marker({ position: pos, map })
      mapRef.current = map
    }

    return () => { cancelled = true; clearTimeout(timer) }
  }, [address, venueName])

  if (!address) return null
  if (failed) {
    return (
      <div className="mt-2 rounded-md overflow-hidden" style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #e8e8e8 0%, #d4d4d4 100%)' }}>
        <div className="flex items-center justify-center h-full text-[11px] text-stone-400">
          지도를 불러올 수 없습니다
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="mt-2 rounded-md overflow-hidden"
      style={{ aspectRatio: '16/9', width: '100%', background: '#eee' }}
    />
  )
}

/** 갤러리 이미지 드래그 앤 드롭 정렬용 */
function SortableGalleryItem({
  img,
  isExpanded,
  onRemove,
  onToggleExpand,
}: {
  img: GalleryImage
  isExpanded: boolean
  onRemove: () => void
  onToggleExpand: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div
        className="relative aspect-square bg-stone-100 border border-stone-200 rounded-md overflow-hidden group"
        {...attributes}
        {...listeners}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.thumbUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          aria-label="이미지 삭제"
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          ×
        </button>
      </div>
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full text-[10px] text-stone-500 border border-stone-200 rounded px-1.5 py-0.5 hover:bg-stone-50"
      >
        {isExpanded ? '닫기' : '조정'}
      </button>
    </div>
  )
}

function TheSimpleEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, status } = useAuth()
  const editId = searchParams.get('id')
  const urlSlug = searchParams.get('slug')
  const isAdminMode = searchParams.get('admin') === 'true'

  const [data, setData] = useState<TheSimpleInvitationData>(defaultData)
  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [savedSlug, setSavedSlug] = useState<string | null>(urlSlug || null)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')
  const [uploadingCount, setUploadingCount] = useState(0)
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null)
  // 커버 리플레이 키 (변경 시 TapToOpenCover 재마운트)
  const [coverKey, setCoverKey] = useState(0)
  const [coverDismissed, setCoverDismissed] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [playingBgm, setPlayingBgm] = useState<string | null>(null)
  const bgmAudioRef = useRef<HTMLAudioElement>(null)
  const [curtainRevealed, setCurtainRevealed] = useState(false)

  // 커버 variant 변경 또는 미리보기 탭 전환 시 자동 리셋
  useEffect(() => {
    setCoverDismissed(false)
    setCurtainRevealed(false)
    setCoverKey((k) => k + 1)
  }, [data.coverVariant, mobileView])

  // 커버가 없거나 dismiss 완료 또는 V11 커튼이 열린 경우에만 본문 렌더링
  const showPreview = (data.coverVariant ?? 0) === 0 || coverDismissed || curtainRevealed

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 나가기 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '저장하지 않은 변경사항이 있습니다.'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Admin 모드 헤더
  const getAdminHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (isAdminMode) {
      const adminPw = typeof window !== 'undefined' ? localStorage.getItem('admin_password') : null
      if (adminPw) headers['x-admin-password'] = adminPw
    }
    return headers
  }

  // 기존 청첩장 불러오기
  useEffect(() => {
    if (status === 'loading') return
    if (!editId) return
    setIsLoading(true)
    fetch(`/api/invitations/${editId}`, { headers: getAdminHeaders() })
      .then(async (res) => (await res.json()) as { invitation?: { content?: string; slug?: string } })
      .then((result) => {
        if (result.invitation) {
          if (result.invitation.slug) setSavedSlug(result.invitation.slug)
          if (result.invitation.content) {
            try {
              const parsed = JSON.parse(result.invitation.content)
              // 구(舊) `gallery: GalleryImage[]` → `galleries: { gallery: [...] }` 마이그레이션
              if (Array.isArray(parsed.gallery) && !parsed.galleries) {
                parsed.galleries = { gallery: parsed.gallery }
                delete parsed.gallery
              }
              if (!parsed.galleries) parsed.galleries = { gallery: [] }
              if (!parsed.galleryRowPatterns) parsed.galleryRowPatterns = {}
              if (!parsed.galleryShowMoreRow) parsed.galleryShowMoreRow = {}

              // 구(舊) 최상위 `intro` / `greeting` → `sections.*` 마이그레이션
              const migratedSections: SectionContents = {
                ...defaultData.sections,
                ...(parsed.sections || {}),
              }
              if (parsed.intro && typeof parsed.intro === 'object' && !parsed.sections?.intro) {
                migratedSections.intro = {
                  eyebrow: defaultData.sections.intro.eyebrow,
                  title: parsed.intro.title || defaultData.sections.intro.title,
                  body: parsed.intro.body || defaultData.sections.intro.body,
                }
              }
              if (typeof parsed.greeting === 'string' && !parsed.sections?.greeting) {
                migratedSections.greeting = {
                  ...defaultData.sections.greeting,
                  body: parsed.greeting,
                }
              }
              parsed.sections = migratedSections
              delete parsed.intro
              delete parsed.greeting

              setData({ ...defaultData, ...parsed })
            } catch (e) {
              console.error('Failed to parse content:', e)
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load:', err))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, status])

  const updateData = (updates: Partial<TheSimpleInvitationData>) => {
    setData((prev) => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  const updateNested = <K extends keyof TheSimpleInvitationData>(
    key: K,
    updates: Partial<TheSimpleInvitationData[K]>
  ) => {
    setData((prev) => ({ ...prev, [key]: { ...(prev[key] as object), ...updates } }))
    setIsDirty(true)
  }

  // 갤러리 이미지 업로드 (특정 섹션 인스턴스 대상)
  const handleGalleryUpload = async (instanceId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    setUploadingCount((c) => c + fileArray.length)
    try {
      await uploadImages(fileArray, {
        invitationId: invitationId || undefined,
        onFileComplete: (_, result) => {
          if (result.imageId && result.webUrl && result.thumbUrl) {
            setData((prev) => {
              const current = prev.galleries[instanceId] ?? []
              return {
                ...prev,
                galleries: {
                  ...prev.galleries,
                  [instanceId]: [
                    ...current,
                    {
                      id: result.imageId!,
                      webUrl: result.webUrl!,
                      thumbUrl: result.thumbUrl!,
                      width: result.width,
                      height: result.height,
                    },
                  ],
                },
              }
            })
            setIsDirty(true)
          }
        },
        onFileError: (_, error) => {
          console.error('Upload error:', error)
        },
      })
    } finally {
      setUploadingCount((c) => Math.max(0, c - fileArray.length))
    }
  }

  // 갤러리 이미지 crop/position settings 업데이트
  const handleGallerySettingsUpdate = (
    instanceId: string,
    imageId: string,
    patch: Partial<TheSimpleImageSettings>
  ) => {
    setData((prev) => {
      const current = prev.galleries[instanceId] ?? []
      return {
        ...prev,
        galleries: {
          ...prev.galleries,
          [instanceId]: current.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  settings: {
                    ...(img.settings ?? { scale: 1, positionX: 0, positionY: 0 }),
                    ...patch,
                  },
                }
              : img
          ),
        },
      }
    })
    setIsDirty(true)
  }

  // 갤러리 이미지 삭제
  const handleGalleryRemove = async (instanceId: string, imageId: string) => {
    setData((prev) => ({
      ...prev,
      galleries: {
        ...prev.galleries,
        [instanceId]: (prev.galleries[instanceId] ?? []).filter((img) => img.id !== imageId),
      },
    }))
    setIsDirty(true)
    if (invitationId) {
      await deleteImage(imageId, invitationId).catch((err) => console.error('Delete error:', err))
    }
  }

  // 갤러리 사진 순서 변경 (드래그 & 드롭)
  const gallerySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )
  const handleGalleryDragEnd = (instanceId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setData((prev) => {
      const imgs = prev.galleries[instanceId] ?? []
      const oldIndex = imgs.findIndex((img) => img.id === String(active.id))
      const newIndex = imgs.findIndex((img) => img.id === String(over.id))
      if (oldIndex === -1 || newIndex === -1) return prev
      return {
        ...prev,
        galleries: {
          ...prev.galleries,
          [instanceId]: arrayMove(imgs, oldIndex, newIndex),
        },
      }
    })
    setIsDirty(true)
  }

  // 새 갤러리 섹션 인스턴스 추가
  const handleAddGallery = () => {
    const newId = createSectionInstanceId('gallery')
    setData((prev) => {
      const order = [...prev.sectionOrder]
      // 'thanks' 바로 앞에 삽입 (없으면 맨 끝)
      const thanksIdx = order.indexOf('thanks')
      if (thanksIdx >= 0) order.splice(thanksIdx, 0, newId)
      else order.push(newId)
      return {
        ...prev,
        sectionOrder: order,
        sectionVariants: { ...prev.sectionVariants, [newId]: 1 },
        galleries: { ...prev.galleries, [newId]: [] },
      }
    })
    setIsDirty(true)
  }

  // 섹션 인스턴스 제거 (복제 가능 타입 전용)
  const handleRemoveSectionInstance = (instanceId: string) => {
    const type = getSectionType(instanceId)
    if (type === 'gallery') {
      const hasImages = (data.galleries[instanceId]?.length ?? 0) > 0
      if (hasImages && !confirm('이 갤러리에 업로드된 이미지가 사라집니다. 계속할까요?')) return
    }
    setData((prev) => {
      const nextVariants = { ...prev.sectionVariants }
      delete nextVariants[instanceId]
      const nextGalleries = { ...prev.galleries }
      delete nextGalleries[instanceId]
      return {
        ...prev,
        sectionOrder: prev.sectionOrder.filter((id) => id !== instanceId),
        sectionVariants: nextVariants,
        galleries: nextGalleries,
        hiddenSections: prev.hiddenSections.filter((id) => id !== instanceId),
      }
    })
    setIsDirty(true)
  }

  // 저장
  const handleSave = async (silent = false) => {
    if (!user && !isAdminMode) {
      try {
        sessionStorage.setItem('editor_draft_the_simple', JSON.stringify(data))
      } catch {
        /* noop */
      }
      const currentUrl = window.location.pathname + window.location.search
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
      return
    }

    const groomName = data.groom.name.trim()
    const brideName = data.bride.name.trim()
    if (!groomName || !brideName) {
      if (!silent) alert('신랑/신부 이름을 모두 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        template_id: 'narrative-the-simple',
        groom_name: data.groom.name,
        bride_name: data.bride.name,
        wedding_date: data.wedding.date,
        wedding_time: data.wedding.timeDisplay,
        venue_name: data.wedding.venue.name,
        venue_address: data.wedding.venue.address,
        venue_hall: data.wedding.venue.hall,
        content: JSON.stringify(data),
      }
      if (!invitationId && urlSlug) payload.slug = urlSlug

      const response = invitationId
        ? await fetch(`/api/invitations/${invitationId}`, {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify(payload),
          })
        : await fetch('/api/invitations', {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify(payload),
          })

      const result = (await response.json()) as { error?: string; invitation?: { id: string } }
      if (!response.ok) throw new Error(result.error || '저장에 실패했습니다.')
      if (!invitationId && result.invitation?.id) {
        setInvitationId(result.invitation.id)
        const adminParam = isAdminMode ? '&admin=true' : ''
        window.history.replaceState({}, '', `/editor/the-simple?id=${result.invitation.id}${adminParam}`)
      }
      setIsDirty(false)
      if (!silent) alert('저장되었습니다!')
    } catch (error) {
      console.error('Save error:', error)
      if (!silent) alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || (editId && isLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="h-12 sm:h-14 bg-white border-b border-stone-200 flex items-center justify-between px-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/">
            <img src="/logo.png" alt="Dear Drawer" className="h-5 sm:h-6 w-auto" />
          </Link>
          <div className="hidden sm:block h-4 w-px bg-stone-200" />
          <span className="hidden sm:inline text-sm text-stone-500 font-light tracking-[0.18em] uppercase">
            THE SIMPLE
            {isDirty && <span className="ml-2 text-stone-700">· 미저장</span>}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 미리보기 */}
          <Button
            size="sm"
            variant="outline"
            disabled={!invitationId}
            onClick={() => {
              const path = savedSlug || invitationId
              if (path) window.open(`/i/${path}`, '_blank')
            }}
            className="border-stone-300 text-stone-600 hover:bg-stone-50 rounded-md text-xs tracking-wide disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">미리보기</span>
          </Button>
          {/* 공유 */}
          <Button
            size="sm"
            variant="outline"
            disabled={!invitationId}
            onClick={() => setShareOpen(true)}
            className="border-stone-300 text-stone-600 hover:bg-stone-50 rounded-md text-xs tracking-wide disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            <span className="hidden sm:inline">공유</span>
          </Button>
          {/* 저장 */}
          <Button
            size="sm"
            disabled={isSaving}
            onClick={() => handleSave()}
            className="bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs tracking-wide"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full sm:mr-2" />
                <span className="hidden sm:inline">저장 중</span>
              </>
            ) : (
              <span className="px-1">저장</span>
            )}
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full max-w-[1400px] mx-auto flex">
          {/* Preview (desktop) */}
          {!isMobile && (
            <div className="w-[460px] min-w-[460px] sticky top-0 flex justify-center items-center p-4">
              <div
                className="w-[390px] shadow-2xl bg-white overflow-hidden border border-stone-200 rounded-[22px]"
                style={{ height: 'calc(100vh - 88px)' }}
              >
                <div className="w-full h-full overflow-y-auto relative" style={{ WebkitOverflowScrolling: 'touch', ['--ts-intro-vh' as string]: 'calc(100vh - 88px)' } as React.CSSProperties}>
                  {(data.coverVariant ?? 0) > 0 && !coverDismissed && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
                      <TapToOpenCover
                        key={coverKey}
                        variant={data.coverVariant!}
                        data={{
                          groomName: data.groom.name,
                          brideName: data.bride.name,
                          groomNameEn: data.groom.nameEn || '',
                          brideNameEn: data.bride.nameEn || '',
                          weddingDate: data.wedding.date,
                          weddingTime: data.wedding.timeDisplay,
                          venueName: data.wedding.venue.name,
                          venueHall: data.wedding.venue.hall,
                        }}
                        onOpen={() => setCoverDismissed(true)}
                        onStartOpen={() => setCurtainRevealed(true)}
                      />
                    </div>
                  )}
                  {(data.coverVariant ?? 0) > 0 && coverDismissed && (
                    <button
                      type="button"
                      onClick={() => { setCoverDismissed(false); setCoverKey((k) => k + 1) }}
                      className="absolute top-3 right-3 z-50 px-3 py-1.5 rounded-full bg-black/60 text-white text-[10px] tracking-wider hover:bg-black/80 transition-colors backdrop-blur-sm"
                    >
                      커버 다시 보기
                    </button>
                  )}
                  {showPreview && <TheSimplePreview data={data} />}
                </div>
              </div>
            </div>
          )}

          {/* Preview (mobile · preview tab) */}
          {isMobile && mobileView === 'preview' && (
            <div className="w-full flex justify-center items-center py-6" style={{ minHeight: 'calc(100vh - 104px)' }}>
              <div
                className="w-[320px] shadow-2xl bg-white overflow-hidden border border-stone-200 rounded-[22px]"
                style={{ height: '630px' }}
              >
                <div className="w-full h-full overflow-y-auto relative" style={{ WebkitOverflowScrolling: 'touch', ['--ts-intro-vh' as string]: '630px' } as React.CSSProperties}>
                  {(data.coverVariant ?? 0) > 0 && !coverDismissed && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
                      <TapToOpenCover
                        key={coverKey}
                        variant={data.coverVariant!}
                        data={{
                          groomName: data.groom.name,
                          brideName: data.bride.name,
                          groomNameEn: data.groom.nameEn || '',
                          brideNameEn: data.bride.nameEn || '',
                          weddingDate: data.wedding.date,
                          weddingTime: data.wedding.timeDisplay,
                          venueName: data.wedding.venue.name,
                          venueHall: data.wedding.venue.hall,
                        }}
                        onOpen={() => setCoverDismissed(true)}
                        onStartOpen={() => setCurtainRevealed(true)}
                      />
                    </div>
                  )}
                  {(data.coverVariant ?? 0) > 0 && coverDismissed && (
                    <button
                      type="button"
                      onClick={() => { setCoverDismissed(false); setCoverKey((k) => k + 1) }}
                      className="absolute top-3 right-3 z-50 px-3 py-1.5 rounded-full bg-black/60 text-white text-[10px] tracking-wider hover:bg-black/80 transition-colors backdrop-blur-sm"
                    >
                      커버 다시 보기
                    </button>
                  )}
                  {showPreview && <TheSimplePreview data={data} />}
                </div>
              </div>
            </div>
          )}

          {/* Editor panel */}
          {(!isMobile || mobileView === 'editor') && (
            <div
              className={`${isMobile ? 'w-full' : 'flex-1 flex flex-col overflow-hidden'} p-4`}
              style={isMobile ? { paddingBottom: '72px' } : { height: 'calc(100vh - 56px)' }}
            >
              <div className="bg-white border border-stone-200 rounded-lg p-6 overflow-y-auto flex-1">
                <div className="max-w-xl mx-auto space-y-8">
                  {/* 개발중 배너 */}
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-md text-xs text-stone-600 leading-relaxed">
                    <strong className="block mb-1 tracking-wide text-stone-800">THE SIMPLE 에디터</strong>
                    입력한 내용은 실시간으로 오른쪽 프리뷰에 반영됩니다. 섹션 순서 변경, UI 대안 선택,
                    갤러리 업로드 등은 다음 단계에서 추가됩니다.
                  </div>

                  {/* 폰트 · 영문/한글 폰트 선택 (매거진 에디터와 동일 목록) */}
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-800 border-b border-stone-300 pb-2">
                      폰트
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                      <label className="block">
                        <span className="text-xs text-stone-500">영문 디스플레이 폰트</span>
                        <select
                          value={data.displayFont || DEFAULT_DISPLAY_FONT_ID}
                          onChange={(e) => updateData({ displayFont: e.target.value })}
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-600"
                          style={{
                            fontFamily:
                              DISPLAY_FONTS.find(
                                (f) => f.id === (data.displayFont || DEFAULT_DISPLAY_FONT_ID)
                              )?.fontFamily || 'inherit',
                          }}
                        >
                          {DISPLAY_FONTS.map((font) => (
                            <option
                              key={font.id}
                              value={font.id}
                              style={{ fontFamily: font.fontFamily }}
                            >
                              {font.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs text-stone-500">한글 본문 폰트</span>
                        <select
                          value={data.fontStyle || DEFAULT_KOREAN_FONT_ID}
                          onChange={(e) => updateData({ fontStyle: e.target.value })}
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-stone-600"
                        >
                          {KOREAN_FONTS.map((font) => (
                            <option
                              key={font.id}
                              value={font.id}
                            >
                              {font.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </section>

                  {/* 디자인 · 디바이더, 섹션 간격, 글자 크기 */}
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-800 border-b border-stone-300 pb-2">
                      디자인
                    </h2>

                    {/* 디바이더 variant */}
                    <div className="space-y-2">
                      <span className="text-xs text-stone-500">섹션 구분선</span>
                      <div className="grid grid-cols-6 gap-2">
                        {[0, 1, 2, 3, 4, 5].map((v) => {
                          const active = (data.dividerVariant ?? 1) === v
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => updateData({ dividerVariant: v })}
                              className={`h-12 rounded-md border flex items-center justify-center transition-colors ${
                                active
                                  ? 'border-stone-900 bg-stone-50'
                                  : 'border-stone-200 bg-white hover:border-stone-400'
                              }`}
                              aria-label={`divider variant ${v}`}
                            >
                              <DividerPreview variant={v} />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* 섹션 간격 */}
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-500">섹션 간격</span>
                        <span className="text-[10px] text-stone-400">
                          {Math.round((data.sectionSpacing ?? 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={150}
                        step={5}
                        value={Math.round((data.sectionSpacing ?? 1) * 100)}
                        onChange={(e) =>
                          updateData({ sectionSpacing: parseInt(e.target.value, 10) / 100 })
                        }
                        className="mt-2 w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                      />
                    </label>

                    {/* 글자 크기 */}
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-500">글자 크기</span>
                        <span className="text-[10px] text-stone-400">
                          {Math.round((data.fontScale ?? 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={85}
                        max={120}
                        step={5}
                        value={Math.round((data.fontScale ?? 1) * 100)}
                        onChange={(e) =>
                          updateData({ fontScale: parseInt(e.target.value, 10) / 100 })
                        }
                        className="mt-2 w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                      />
                    </label>
                  </section>

                  {/* 기본 정보 */}
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-800 border-b border-stone-300 pb-2">
                      기본 정보
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-stone-500">신랑 이름</span>
                        <input
                          type="text"
                          value={data.groom.name}
                          onChange={(e) => updateNested('groom', { ...data.groom, name: e.target.value })}
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                          placeholder="예: 김민준"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-stone-500">신부 이름</span>
                        <input
                          type="text"
                          value={data.bride.name}
                          onChange={(e) => updateNested('bride', { ...data.bride, name: e.target.value })}
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                          placeholder="예: 이서연"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-stone-500">신랑 영문이름</span>
                        <input
                          type="text"
                          value={data.groom.nameEn ?? ''}
                          onChange={(e) => updateNested('groom', { ...data.groom, nameEn: e.target.value })}
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                          placeholder="예: Minjun"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-stone-500">신부 영문이름</span>
                        <input
                          type="text"
                          value={data.bride.nameEn ?? ''}
                          onChange={(e) => updateNested('bride', { ...data.bride, nameEn: e.target.value })}
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                          placeholder="예: Seoyeon"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-stone-500">신랑 연락처</span>
                        <input
                          type="tel"
                          value={data.groom.phone ?? ''}
                          onChange={(e) => updateNested('groom', { ...data.groom, phone: e.target.value })}
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                          placeholder="010-0000-0000"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-stone-500">신부 연락처</span>
                        <input
                          type="tel"
                          value={data.bride.phone ?? ''}
                          onChange={(e) => updateNested('bride', { ...data.bride, phone: e.target.value })}
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                          placeholder="010-0000-0000"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-stone-500">예식일</span>
                        <input
                          type="date"
                          value={data.wedding.date}
                          onChange={(e) =>
                            updateNested('wedding', { ...data.wedding, date: e.target.value })
                          }
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-stone-500">예식 시간 (24h)</span>
                        <input
                          type="time"
                          value={data.wedding.time}
                          onChange={(e) =>
                            updateNested('wedding', { ...data.wedding, time: e.target.value })
                          }
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs text-stone-500">시간 표시 (프리뷰용)</span>
                      <input
                        type="text"
                        value={data.wedding.timeDisplay}
                        onChange={(e) =>
                          updateNested('wedding', { ...data.wedding, timeDisplay: e.target.value })
                        }
                        className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                        placeholder="오후 1시"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-stone-500">예식장 이름</span>
                        <input
                          type="text"
                          value={data.wedding.venue.name}
                          onChange={(e) =>
                            updateNested('wedding', {
                              ...data.wedding,
                              venue: { ...data.wedding.venue, name: e.target.value },
                            })
                          }
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                          placeholder="예: 그랜드 하얏트 서울"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-stone-500">홀 / 층</span>
                        <input
                          type="text"
                          value={data.wedding.venue.hall ?? ''}
                          onChange={(e) =>
                            updateNested('wedding', {
                              ...data.wedding,
                              venue: { ...data.wedding.venue, hall: e.target.value },
                            })
                          }
                          className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                          placeholder="예: 그랜드볼룸 3F"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs text-stone-500">예식장 주소</span>
                      <input
                        type="text"
                        value={data.wedding.venue.address}
                        onChange={(e) =>
                          updateNested('wedding', {
                            ...data.wedding,
                            venue: { ...data.wedding.venue, address: e.target.value },
                          })
                        }
                        className="mt-1 w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
                        placeholder="서울특별시 용산구..."
                      />
                    </label>
                    <EditorMapPreview
                      address={data.wedding.venue.address}
                      venueName={data.wedding.venue.name}
                    />
                  </section>

                  {/* 커버 (Tap to Open) */}
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-800 border-b border-stone-300 pb-2">
                      커버 · Tap to Open
                    </h2>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      게스트가 청첩장을 열기 전에 표시되는 커버 화면입니다.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {COVER_VARIANTS.map((cv) => {
                        const isActive = (data.coverVariant ?? 0) === cv.value
                        return (
                          <button
                            key={cv.value}
                            type="button"
                            onClick={() => updateData({ coverVariant: cv.value })}
                            className={`px-2.5 py-1.5 rounded border text-[11px] transition-colors ${
                              isActive
                                ? 'bg-stone-900 border-stone-900 text-white'
                                : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
                            }`}
                          >
                            {cv.value === 0 ? cv.label : `V${cv.value}`}
                            <span className="ml-1 text-[9px] opacity-70">{cv.value === 0 ? '' : cv.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  {/* 섹션 순서 · UI 대안 */}
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-800 border-b border-stone-300 pb-2">
                      섹션 순서 · UI 대안
                    </h2>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      각 섹션을 눌러 펼치면 UI 대안과 상세 설정(갤러리 이미지 등)이 나타납니다.
                      손잡이를 잡아 드래그하면 순서를 변경할 수 있습니다.
                    </p>
                    <SectionListPanel
                      sectionOrder={data.sectionOrder}
                      sectionVariants={data.sectionVariants}
                      hiddenSections={data.hiddenSections}
                      duplicableTypes={['gallery']}
                      renderSectionContent={(id) => {
                        const type = getSectionType(id)

                        // 인트로 에디터
                        if (type === 'intro') {
                          return (
                            <IntroEditor
                              value={data.sections.intro}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, intro: next },
                                })
                              }
                            />
                          )
                        }

                        // 인사말 에디터
                        if (type === 'greeting') {
                          return (
                            <GreetingEditor
                              value={data.sections.greeting}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, greeting: next },
                                })
                              }
                            />
                          )
                        }

                        // 예식 정보 에디터
                        if (type === 'info') {
                          return (
                            <InfoEditor
                              value={data.sections.info}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, info: next },
                                })
                              }
                            />
                          )
                        }

                        // 오시는 길 에디터
                        if (type === 'direction') {
                          return (
                            <DirectionEditor
                              value={data.sections.direction}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, direction: next },
                                })
                              }
                            />
                          )
                        }

                        // 커플 에디터
                        if (type === 'couple') {
                          return (
                            <CoupleEditor
                              value={data.sections.couple}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, couple: next },
                                })
                              }
                            />
                          )
                        }

                        // 러브스토리 에디터
                        if (type === 'lovestory') {
                          return (
                            <LoveStoryEditor
                              value={data.sections.lovestory}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, lovestory: next },
                                })
                              }
                            />
                          )
                        }

                        // 인터뷰 에디터
                        if (type === 'interview') {
                          return (
                            <InterviewEditor
                              value={data.sections.interview}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, interview: next },
                                })
                              }
                            />
                          )
                        }

                        // 결혼식 안내 에디터
                        if (type === 'guide') {
                          return (
                            <GuideEditor
                              value={data.sections.guide}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, guide: next },
                                })
                              }
                            />
                          )
                        }

                        // 마음 전하실 곳 에디터
                        if (type === 'account') {
                          return (
                            <AccountEditor
                              value={data.sections.account}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, account: next },
                                })
                              }
                            />
                          )
                        }

                        // 영상 에디터
                        if (type === 'video') {
                          return (
                            <VideoEditor
                              value={data.sections.video}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, video: next },
                                })
                              }
                            />
                          )
                        }

                        // RSVP 에디터
                        if (type === 'rsvp') {
                          return (
                            <RsvpEditor
                              value={data.sections.rsvp}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, rsvp: next },
                                })
                              }
                            />
                          )
                        }

                        // 감사 인사 에디터
                        if (type === 'thanks') {
                          return (
                            <ThanksEditor
                              value={data.sections.thanks}
                              onChange={(next) =>
                                updateData({
                                  sections: { ...data.sections, thanks: next },
                                })
                              }
                            />
                          )
                        }

                        if (type !== 'gallery') return null
                        const images = data.galleries[id] ?? []
                        const galleryEyebrow = data.galleryEyebrows?.[id] ?? 'Gallery'
                        return (
                          <div className="space-y-2">
                            {/* 갤러리 섹션 제목 */}
                            <label className="block">
                              <span className="text-[10px] uppercase tracking-wider text-stone-400">섹션 제목</span>
                              <input
                                type="text"
                                value={galleryEyebrow}
                                onChange={(e) =>
                                  updateData({
                                    galleryEyebrows: {
                                      ...(data.galleryEyebrows || {}),
                                      [id]: e.target.value,
                                    },
                                  })
                                }
                                placeholder="비워두면 제목 숨김"
                                className="mt-1 w-full border border-stone-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-stone-600"
                              />
                            </label>
                            <div className="text-[10px] uppercase tracking-wider text-stone-400">
                              사진 ({images.length}장)
                            </div>
                            {images.length > 0 && (
                              <DndContext
                                sensors={gallerySensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => handleGalleryDragEnd(id, event)}
                              >
                                <SortableContext
                                  items={images.map((img) => img.id)}
                                  strategy={rectSortingStrategy}
                                >
                                  <div className="grid grid-cols-3 gap-2">
                                    {images.map((img) => (
                                      <SortableGalleryItem
                                        key={img.id}
                                        img={img}
                                        isExpanded={expandedImageId === img.id}
                                        onRemove={() => handleGalleryRemove(id, img.id)}
                                        onToggleExpand={() =>
                                          setExpandedImageId(expandedImageId === img.id ? null : img.id)
                                        }
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            )}
                            {expandedImageId &&
                              images.find((img) => img.id === expandedImageId) && (
                                <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-md space-y-2">
                                  <div className="text-[10px] text-stone-500 text-center">
                                    이미지 줌 · 위치 조정
                                  </div>
                                  {(() => {
                                    const img = images.find((x) => x.id === expandedImageId)!
                                    const settings: TheSimpleImageSettings =
                                      img.settings ?? { scale: 1, positionX: 0, positionY: 0 }
                                    return (
                                      <ImageZoomEditor
                                        imageUrl={img.webUrl}
                                        scale={settings.scale ?? 1}
                                        positionX={settings.positionX ?? 0}
                                        positionY={settings.positionY ?? 0}
                                        onUpdate={(patch) =>
                                          handleGallerySettingsUpdate(id, img.id, patch)
                                        }
                                        containerWidth={220}
                                      />
                                    )
                                  })()}
                                </div>
                              )}
                            {/* 행 패턴 편집 UI (V3~V5 커스텀 레이아웃) */}
                            {(() => {
                              const gv = data.sectionVariants[id] ?? 1
                              if (gv < 3 || gv > 5) return null
                              const defaultPattern = GALLERY_DEFAULT_PATTERNS[gv] ?? [1]
                              const currentPattern = data.galleryRowPatterns?.[id] ?? defaultPattern
                              const updatePattern = (next: number[]) => {
                                updateData({
                                  galleryRowPatterns: {
                                    ...(data.galleryRowPatterns || {}),
                                    [id]: next,
                                  },
                                })
                              }
                              return (
                                <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-md space-y-2">
                                  <div className="text-[10px] text-stone-600 font-medium uppercase tracking-wider">
                                    레이아웃 설정
                                  </div>
                                  <div className="space-y-1.5">
                                    {currentPattern.map((count, rowIdx) => (
                                      <div key={rowIdx} className="flex items-center gap-2">
                                        <span className="text-[10px] text-stone-400 w-10 shrink-0">행 {rowIdx + 1}:</span>
                                        <button
                                          type="button"
                                          disabled={count <= 1}
                                          onClick={() => {
                                            const next = [...currentPattern]
                                            next[rowIdx] = Math.max(1, count - 1)
                                            updatePattern(next)
                                          }}
                                          className="w-6 h-6 rounded border border-stone-300 text-xs text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                          -
                                        </button>
                                        <span className="text-xs text-stone-700 w-6 text-center">{count}장</span>
                                        <button
                                          type="button"
                                          disabled={count >= 4}
                                          onClick={() => {
                                            const next = [...currentPattern]
                                            next[rowIdx] = Math.min(4, count + 1)
                                            updatePattern(next)
                                          }}
                                          className="w-6 h-6 rounded border border-stone-300 text-xs text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                          +
                                        </button>
                                        {currentPattern.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const next = currentPattern.filter((_, i) => i !== rowIdx)
                                              updatePattern(next)
                                            }}
                                            className="w-6 h-6 rounded text-xs text-stone-400 hover:text-red-500"
                                            aria-label="행 삭제"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => updatePattern([...currentPattern, 1])}
                                      className="flex-1 text-[10px] text-stone-500 border border-dashed border-stone-300 rounded py-1.5 hover:border-stone-500 hover:text-stone-700"
                                    >
                                      + 행 추가
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updatePattern([...defaultPattern])}
                                      className="text-[10px] text-stone-400 border border-stone-200 rounded px-3 py-1.5 hover:text-stone-600 hover:border-stone-400"
                                    >
                                      초기화
                                    </button>
                                  </div>
                                  {/* 사진 더보기 행 선택 */}
                                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200 mt-2">
                                    <span className="text-[10px] text-stone-500 shrink-0">사진 더보기</span>
                                    <select
                                      value={data.galleryShowMoreRow?.[id] ?? 0}
                                      onChange={(e) => {
                                        updateData({
                                          galleryShowMoreRow: {
                                            ...(data.galleryShowMoreRow || {}),
                                            [id]: Number(e.target.value),
                                          },
                                        })
                                      }}
                                      className="flex-1 border border-stone-200 rounded px-2 py-1 text-[10px] text-stone-600 bg-white focus:outline-none focus:border-stone-500"
                                    >
                                      <option value={0}>전체 표시 (접기 없음)</option>
                                      {currentPattern.map((_, rowIdx) => (
                                        <option key={rowIdx} value={rowIdx + 1}>
                                          {rowIdx + 1}행까지 표시
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )
                            })()}
                            <label className="block">
                              <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                  handleGalleryUpload(id, e.target.files)
                                  e.target.value = ''
                                }}
                                className="hidden"
                                disabled={uploadingCount > 0}
                              />
                              <div
                                className={`w-full border-2 border-dashed rounded-md px-4 py-3 text-center text-xs transition-colors cursor-pointer ${
                                  uploadingCount > 0
                                    ? 'border-stone-300 bg-stone-50 text-stone-400 cursor-not-allowed'
                                    : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700'
                                }`}
                              >
                                {uploadingCount > 0 ? (
                                  <span className="inline-flex items-center gap-2">
                                    <span className="animate-spin h-3 w-3 border-2 border-stone-400 border-t-transparent rounded-full" />
                                    업로드 중 · {uploadingCount}장
                                  </span>
                                ) : (
                                  <>+ 사진 추가 (여러 장 선택 가능)</>
                                )}
                              </div>
                            </label>
                            <p className="text-[10px] text-stone-400 leading-relaxed">
                              JPG · PNG · WebP (최대 30MB)
                            </p>
                          </div>
                        )
                      }}
                      onReorder={(next) => updateData({ sectionOrder: next })}
                      onVariantChange={(id, v) =>
                        updateData({ sectionVariants: { ...data.sectionVariants, [id]: v } })
                      }
                      onToggleVisibility={(id) =>
                        updateData({
                          hiddenSections: data.hiddenSections.includes(id)
                            ? data.hiddenSections.filter((s) => s !== id)
                            : [...data.hiddenSections, id],
                        })
                      }
                      onRemoveInstance={handleRemoveSectionInstance}
                      onAddInstance={(type) => {
                        if (type === 'gallery') handleAddGallery()
                      }}
                    />
                  </section>

                  {/* 배경음악 */}
                  <section className="border-t border-stone-100 pt-4 mt-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-stone-400 mb-3">
                      Background Music
                    </h3>
                    <div className="space-y-3">
                      {/* 활성화 토글 */}
                      <label className="flex items-center justify-between">
                        <span className="text-xs text-stone-600">배경음악 사용</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !data.bgm?.enabled
                            setData((prev) => ({ ...prev, bgm: { ...prev.bgm!, enabled: next } }))
                            setIsDirty(true)
                            if (!next && bgmAudioRef.current) {
                              bgmAudioRef.current.pause()
                              setPlayingBgm(null)
                            }
                          }}
                          className={`relative w-9 h-5 rounded-full transition-colors ${data.bgm?.enabled ? 'bg-stone-900' : 'bg-stone-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${data.bgm?.enabled ? 'translate-x-4' : ''}`} />
                        </button>
                      </label>

                      {data.bgm?.enabled && (
                        <>
                          {/* 프리셋 목록 */}
                          <div className="space-y-1.5">
                            {bgmPresets.map((preset) => {
                              const isSelected = data.bgm?.url === preset.url
                              const isPlaying = playingBgm === preset.url
                              return (
                                <div
                                  key={preset.id}
                                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'border-stone-900 bg-stone-50'
                                      : 'border-stone-200 hover:border-stone-300'
                                  }`}
                                  onClick={() => {
                                    setData((prev) => ({
                                      ...prev,
                                      bgm: { ...prev.bgm!, url: preset.url, enabled: true },
                                    }))
                                    setIsDirty(true)
                                  }}
                                >
                                  {/* 재생/정지 버튼 */}
                                  <button
                                    type="button"
                                    className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-100 hover:bg-stone-200 shrink-0 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!bgmAudioRef.current) return
                                      if (isPlaying) {
                                        bgmAudioRef.current.pause()
                                        setPlayingBgm(null)
                                      } else {
                                        bgmAudioRef.current.src = preset.url
                                        bgmAudioRef.current.play().then(() => setPlayingBgm(preset.url)).catch(() => {})
                                      }
                                    }}
                                  >
                                    {isPlaying ? (
                                      <svg className="w-3.5 h-3.5 text-stone-700" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="6" y="4" width="4" height="16" rx="1" />
                                        <rect x="14" y="4" width="4" height="16" rx="1" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3.5 h-3.5 text-stone-700 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    )}
                                  </button>
                                  {/* 곡 정보 */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-stone-800 font-medium truncate">{preset.name}</div>
                                    <div className="text-[10px] text-stone-400 truncate">{preset.description}</div>
                                  </div>
                                  {/* 선택 표시 */}
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-stone-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* 자동재생 토글 */}
                          <label className="flex items-center justify-between pt-1">
                            <div>
                              <span className="text-xs text-stone-600">자동 재생</span>
                              <p className="text-[10px] text-stone-400">청첩장 열면 자동으로 음악이 재생됩니다</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setData((prev) => ({
                                  ...prev,
                                  bgm: { ...prev.bgm!, autoplay: !prev.bgm?.autoplay },
                                }))
                                setIsDirty(true)
                              }}
                              className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${data.bgm?.autoplay ? 'bg-stone-900' : 'bg-stone-300'}`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${data.bgm?.autoplay ? 'translate-x-4' : ''}`} />
                            </button>
                          </label>

                          {/* 선택된 곡 표시 */}
                          {data.bgm?.url && (() => {
                            const selected = getBgmPresetByUrl(data.bgm!.url)
                            return selected ? (
                              <div className="text-[10px] text-stone-400 text-center">
                                선택됨: {selected.name}
                              </div>
                            ) : null
                          })()}
                        </>
                      )}
                    </div>
                    {/* 미리듣기용 hidden audio */}
                    <audio
                      ref={bgmAudioRef}
                      onEnded={() => setPlayingBgm(null)}
                      className="hidden"
                    />
                  </section>

                  {/* 공유 설정 (OG/카카오/메타/슬러그) */}
                  <section className="border-t border-stone-100 pt-4 mt-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-stone-400 mb-3">
                      공유 설정
                    </h3>
                    <MetaEditor
                      value={data.meta}
                      onChange={(patch) => updateNested('meta', patch)}
                      slug={savedSlug}
                      invitationId={invitationId}
                      onSlugChange={setSavedSlug}
                      groomName={data.groom.name}
                      brideName={data.bride.name}
                      weddingDate={data.wedding.date}
                      weddingTime={data.wedding.timeDisplay}
                      venueName={data.wedding.venue.name}
                    />
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 하단 탭 */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 flex safe-area-bottom">
          <button
            onClick={() => setMobileView('editor')}
            className={`flex-1 py-3.5 text-xs font-medium tracking-wide transition-colors ${
              mobileView === 'editor' ? 'text-stone-900' : 'text-stone-400'
            }`}
          >
            편집
          </button>
          <div className="w-px bg-stone-200 my-2" />
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-3.5 text-xs font-medium tracking-wide transition-colors ${
              mobileView === 'preview' ? 'text-stone-900' : 'text-stone-400'
            }`}
          >
            미리보기
          </button>
        </div>
      )}

      {/* ShareModal */}
      {invitationId && (
        <ShareModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          invitationId={invitationId}
          groomName={data.groom.name}
          brideName={data.bride.name}
          weddingDate={data.wedding.date}
          weddingTime={data.wedding.timeDisplay}
          venueName={data.wedding.venue.name}
          venueAddress={data.wedding.venue.address}
          currentSlug={savedSlug || undefined}
          onSlugChange={setSavedSlug}
          thumbnailUrl={typeof data.meta.ogImage === 'string' ? data.meta.ogImage : data.meta.ogImage?.url}
          shareTitle={data.meta.title}
          shareDescription={data.meta.description}
        />
      )}
    </div>
  )
}

export default function TheSimpleEditorPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <div className="max-w-md w-full p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">에디터 오류</h2>
            <p className="text-gray-600 mb-6">에디터를 불러오는 중 문제가 발생했습니다.</p>
            <Link href="/">
              <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                홈으로
              </button>
            </Link>
          </div>
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
          </div>
        }
      >
        <TheSimpleEditorContent />
      </Suspense>
    </ErrorBoundary>
  )
}
