'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import ParentsEditPanel from './ParentsEditPanel'
import ParentsPreview from './ParentsPreview'
import ShareModal from '@/components/share/ShareModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { COLOR_THEMES, type ColorThemeId } from '@/components/parents/types'

// 타임라인 아이템 타입
export interface TimelineItem {
  year: string
  description: string
  imageUrl: string  // 기존 호환성
  image?: {         // 크롭 데이터 포함
    url: string
    cropX: number
    cropY: number
    cropWidth: number
    cropHeight: number
  }
}

// 셔틀버스 정보 타입
export interface ShuttleInfo {
  enabled: boolean
  departureDate: string
  departureTime: string
  departureLocation: string
  returnTime: string
  vehicleNumber: string
  notes: string[]
}

// 이미지 크롭 데이터 타입
export interface ImageCropData {
  url: string
  cropX: number      // 크롭 영역 X 시작점 (0~1)
  cropY: number      // 크롭 영역 Y 시작점 (0~1)
  cropWidth: number  // 크롭 영역 너비 (0~1)
  cropHeight: number // 크롭 영역 높이 (0~1)
}

// Parents 에디터용 스토어 타입
export interface ParentsInvitationData {
  // 기본 정보
  id?: string

  // 부모님 정보 (보내는 사람)
  sender: {
    side: 'groom' | 'bride'
    fatherName: string
    motherName: string
    signature: string // "아버지 이○○ · 어머니 김○○ 드림"
  }

  // 신랑신부 정보
  groom: {
    lastName: string  // 성
    firstName: string // 이름
    fatherName: string
    motherName: string
  }
  bride: {
    lastName: string  // 성
    firstName: string // 이름
    fatherName: string
    motherName: string
  }

  // 결혼식 정보
  wedding: {
    date: string
    time: string
    timeDisplay: string
    venue: {
      name: string
      hall: string
      address: string
    }
    directions: {
      bus: {
        enabled: boolean
        lines: string
        stop: string
      }
      subway: {
        enabled: boolean
        line: string
        station: string
        exit: string
        walk: string
      }
      parking: {
        enabled: boolean
        capacity: string
        free: string
        note: string
      }
      shuttle: {
        enabled: boolean
        location: string
        departureTime: string
        returnTime: string
        note: string
      }
    }
  }

  // 봉투 설정
  envelope: {
    message: string[] // 봉투 안 메시지
    defaultGreeting: string // 기본 인사말 (게스트 개인화 없을 때)
  }

  // 본문 인사말
  greeting: string

  // 타임라인
  timelineEnabled: boolean
  timeline: TimelineItem[]

  // 메인 이미지 (크롭 정보 포함)
  mainImage: ImageCropData

  // 갤러리 (크롭 정보 포함)
  gallery: {
    images: ImageCropData[]
  }

  // 결혼식 안내
  weddingInfo: {
    enabled: boolean
    // 꽃 답례품
    flowerGift: {
      enabled: boolean
      content: string
    }
    // 화환 안내
    wreath: {
      enabled: boolean
      content: string
    }
    // 화동 안내
    flowerChild: {
      enabled: boolean
      content: string
    }
    // 피로연 안내
    reception: {
      enabled: boolean
      content: string
      venue: string
      datetime: string
    }
    // 포토부스 안내
    photoBooth: {
      enabled: boolean
      content: string
    }
    // 셔틀버스
    shuttle: ShuttleInfo
    // 항목 순서
    itemOrder: string[]
  }

  // 계좌 안내
  accounts: {
    enabled: boolean
    list: {
      name: string
      bank: string
      accountNumber: string
    }[]
  }

  // 배경음악
  bgm: {
    enabled: boolean
    url: string
    autoplay: boolean
  }

  // 공유 메타 정보
  meta: {
    title: string
    description: string
    kakaoThumbnail: string
    ogImage: string
    ogImageSettings?: {
      scale: number
      positionX: number
      positionY: number
      cropX?: number
      cropY?: number
      cropWidth?: number
      cropHeight?: number
    }
  }

  // 디자인
  colorTheme: ColorThemeId
  fontStyle: 'elegant' | 'soft' | 'classic' | 'brush' | 'modern' | 'friendly' | 'ridibatang' | 'gangwon' | 'okticon'
}

const defaultData: ParentsInvitationData = {
  sender: {
    side: 'groom',
    fatherName: '',
    motherName: '',
    signature: '',
  },
  groom: {
    lastName: '',
    firstName: '',
    fatherName: '',
    motherName: '',
  },
  bride: {
    lastName: '',
    firstName: '',
    fatherName: '',
    motherName: '',
  },
  wedding: {
    date: '',
    time: '12:00',
    timeDisplay: '오후 12시',
    venue: {
      name: '',
      hall: '',
      address: '',
    },
    directions: {
      bus: {
        enabled: false,
        lines: '',
        stop: '',
      },
      subway: {
        enabled: false,
        line: '',
        station: '',
        exit: '',
        walk: '',
      },
      parking: {
        enabled: false,
        capacity: '',
        free: '',
        note: '',
      },
      shuttle: {
        enabled: false,
        location: '',
        departureTime: '',
        returnTime: '',
        note: '',
      },
    },
  },
  envelope: {
    message: [
      '항상 저희 가족',
      '챙겨주셔서 감사합니다',
      '',
      '좋은 사람 만나',
      '결혼하게 되었습니다',
      '',
      '꼭 오셔서',
      '축복해 주세요',
    ],
    defaultGreeting: '소중한 분께',
  },
  greeting: '서로 다른 길을 걸어온 두 사람이\n이제 같은 길을 함께 걸어가려 합니다.\n\n저희의 새로운 시작을\n축복해 주시면 감사하겠습니다.',
  timelineEnabled: true,
  timeline: [
    { year: '', description: '저희가 결혼하던 날', imageUrl: '' },
    { year: '', description: '아이 5살 생일에', imageUrl: '' },
    { year: '', description: '대학 졸업하던 날', imageUrl: '' },
    { year: '', description: '평생의 반쪽을 만나다', imageUrl: '' },
  ],
  mainImage: {
    url: '',
    cropX: 0,
    cropY: 0,
    cropWidth: 1,
    cropHeight: 1,
  },
  gallery: {
    images: [],
  },
  weddingInfo: {
    enabled: true,
    flowerGift: {
      enabled: true,
      content: '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.',
    },
    wreath: {
      enabled: true,
      content: '축하의 마음만으로도 충분히 감사하여\n화환은 정중히 사양하고자 합니다.\n따뜻한 마음으로 축복해주시면 감사하겠습니다.',
    },
    flowerChild: {
      enabled: false,
      content: '예식 중 사랑스러운 화동 입장이 예정되어 있습니다.\n아이들의 소중한 순간도 함께 따뜻하게 지켜봐 주세요.',
    },
    reception: {
      enabled: false,
      content: '피로연 자리를 마련하였습니다.\n\n참석하시어 두 사람의 앞날을\n따뜻한 축복으로 함께해 주시면\n감사하겠습니다.',
      venue: '',
      datetime: '',
    },
    photoBooth: {
      enabled: false,
      content: '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.\n즐거운 추억을 사진으로 남겨주세요.',
    },
    shuttle: {
      enabled: false,
      departureDate: '',
      departureTime: '',
      departureLocation: '',
      returnTime: '',
      vehicleNumber: '',
      notes: ['원활한 출발을 위해 출발 10분 전까지 도착 부탁드립니다.'],
    },
    itemOrder: ['flowerGift', 'wreath', 'flowerChild', 'reception', 'photoBooth', 'shuttle'],
  },
  accounts: {
    enabled: true,
    list: [
      { name: '', bank: '', accountNumber: '' },
    ],
  },
  bgm: {
    enabled: false,
    url: '',
    autoplay: false,
  },
  meta: {
    title: '',
    description: '',
    kakaoThumbnail: '',
    ogImage: '',
  },
  colorTheme: 'burgundy',
  fontStyle: 'elegant',
}

function ParentsEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, status } = useAuth()
  const editId = searchParams.get('id')

  const [data, setData] = useState<ParentsInvitationData>(defaultData)
  const [invitationId, setInvitationId] = useState<string | null>(editId)
  const [isLoading, setIsLoading] = useState(!!editId)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [validationError, setValidationError] = useState<{ tab: string; message: string } | null>(null)
  const [forceActiveTab, setForceActiveTab] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState<'intro' | 'main'>('intro')
  const [fullscreenTab, setFullscreenTab] = useState<'intro' | 'main'>('intro')
  const [selectedGuest, setSelectedGuest] = useState<{ name: string; honorific: string; relation?: string; custom_message?: string } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 기존 청첩장 불러오기
  useEffect(() => {
    if (status === 'loading') return

    if (editId) {
      setIsLoading(true)
      fetch(`/api/invitations/${editId}`)
        .then(async res => await res.json() as { invitation?: { content?: string; template_id?: string } })
        .then((result) => {
          if (result.invitation?.content) {
            try {
              const content = JSON.parse(result.invitation.content)
              setData({ ...defaultData, ...content })
            } catch (e) {
              console.error('Failed to parse content:', e)
            }
          }
        })
        .catch(err => console.error('Failed to load:', err))
        .finally(() => setIsLoading(false))
    }
  }, [editId, status])

  // 데이터 업데이트
  const updateData = (updates: Partial<ParentsInvitationData>) => {
    setData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  // 중첩 필드 업데이트
  const updateNestedData = (path: string, value: unknown) => {
    setData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current: Record<string, unknown> = newData

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown>) }
        current = current[keys[i]] as Record<string, unknown>
      }

      current[keys[keys.length - 1]] = value
      return newData
    })
    setIsDirty(true)
  }

  // 저장
  const handleSave = async () => {
    if (!user) {
      alert('저장하려면 로그인이 필요합니다.')
      router.push('/login')
      return
    }

    // 신랑/신부 이름 필수 검증
    const groomName = `${data.groom.lastName}${data.groom.firstName}`.trim()
    const brideName = `${data.bride.lastName}${data.bride.firstName}`.trim()
    if (!groomName || !brideName) {
      setForceActiveTab('required')
      setValidationError({ tab: 'required', message: '📋 필수입력 > 신랑/신부 이름을 모두 입력해주세요.' })
      return
    }

    // 카카오톡 공유 썸네일 필수 검증
    if (!data.meta?.kakaoThumbnail?.trim()) {
      setForceActiveTab('design')
      setValidationError({ tab: 'design', message: '🎨 디자인 > 공유 미리보기 설정 > 카카오톡 공유 썸네일을 추가해주세요.' })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        template_id: 'narrative-parents',
        groom_name: `${data.groom.lastName}${data.groom.firstName}`,
        bride_name: `${data.bride.lastName}${data.bride.firstName}`,
        wedding_date: data.wedding.date,
        wedding_time: data.wedding.timeDisplay,
        venue_name: data.wedding.venue.name,
        venue_address: data.wedding.venue.address,
        venue_hall: data.wedding.venue.hall,
        content: JSON.stringify(data),
      }

      let response
      if (invitationId) {
        response = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json() as { error?: string; invitation?: { id: string } }

      if (!response.ok) {
        throw new Error(result.error || '저장에 실패했습니다.')
      }

      if (!invitationId && result.invitation?.id) {
        setInvitationId(result.invitation.id)
        // URL 업데이트
        window.history.replaceState({}, '', `/editor/parents?id=${result.invitation.id}`)
      }

      setIsDirty(false)
      alert('저장되었습니다!')
    } catch (error) {
      console.error('Save error:', error)
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // Open share modal
  const handleShare = () => {
    if (!invitationId) {
      alert('공유하려면 먼저 저장해주세요.')
      return
    }
    setIsShareModalOpen(true)
  }

  if ((editId && isLoading) || status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-12 sm:h-14 border-b border-gray-100 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/">
            <img src="/logo.png" alt="Dear Drawer" className="h-5 sm:h-6 w-auto" />
          </Link>
          <div className="hidden sm:block h-4 w-px bg-gray-200" />
          <span className="hidden sm:inline text-sm text-gray-400 font-light tracking-wide">
            혼주용 청첩장
            {isDirty && <span className="ml-2 text-gray-600">• Unsaved</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 모바일: 미리보기 버튼 (항상 표시) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setFullscreenTab('intro'); setIsPreviewOpen(true); }}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wide"
          >
            <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">미리보기</span>
          </Button>
          {/* 데스크탑: 공유 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="hidden sm:flex border-gray-200 text-gray-600 hover:bg-gray-50 rounded-none text-xs tracking-wide"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            공유
          </Button>
          <Button
            size="sm"
            disabled={isSaving}
            onClick={handleSave}
            className="bg-black text-white hover:bg-gray-800 rounded-none text-xs tracking-wide"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full sm:mr-2" />
                <span className="hidden sm:inline">저장 중</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span className="hidden sm:inline">저장</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Edit Panel - 45% */}
        <div className="w-[45%] min-w-[400px] max-w-[550px] border-r overflow-y-auto">
          <ParentsEditPanel
            data={data}
            updateData={updateData}
            updateNestedData={updateNestedData}
            invitationId={invitationId}
            selectedGuest={selectedGuest}
            onSelectGuest={setSelectedGuest}
            onActiveSectionChange={setActiveSection}
            validationError={validationError}
            onClearValidationError={() => setValidationError(null)}
            forceActiveTab={forceActiveTab}
          />
        </div>

        {/* Preview - 55% */}
        <div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-8">
          {/* 탭 버튼 - 폰 프레임 바깥 */}
          {(() => {
            const currentTheme = COLOR_THEMES[data.colorTheme || 'burgundy']
            return (
              <>
                <div className="flex mb-4 bg-white rounded-lg shadow-sm overflow-hidden">
                  <button
                    onClick={() => setPreviewTab('intro')}
                    className="px-6 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: previewTab === 'intro' ? currentTheme.primary : 'transparent',
                      color: previewTab === 'intro' ? 'white' : '#4B5563',
                    }}
                  >
                    인트로 (봉투)
                  </button>
                  <button
                    onClick={() => setPreviewTab('main')}
                    className="px-6 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: previewTab === 'main' ? currentTheme.primary : 'transparent',
                      color: previewTab === 'main' ? 'white' : '#4B5563',
                    }}
                  >
                    본문
                  </button>
                </div>

                {/* 미리보기 영역 */}
                <div
                  className="relative w-full max-w-[375px] h-[700px] rounded-[40px] overflow-hidden shadow-2xl transition-colors duration-300"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  <div className="w-full h-full overflow-hidden rounded-[32px] m-1" style={{ width: 'calc(100% - 8px)', height: 'calc(100% - 8px)' }}>
                    <ParentsPreview data={data} activeTab={previewTab} onTabChange={setPreviewTab} selectedGuest={selectedGuest} activeSection={activeSection} />
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* Full Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative flex flex-col items-center">
            <div className="w-[375px] bg-gray-900 rounded-[50px] p-3 shadow-2xl border border-gray-700">
              <div className="rounded-[40px] overflow-hidden bg-white relative" style={{ height: '812px' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-3xl z-10 pointer-events-none" />
                <ParentsPreview data={data} fullscreen activeTab={fullscreenTab} onTabChange={setFullscreenTab} selectedGuest={selectedGuest} />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {invitationId && (
        <ShareModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          invitationId={invitationId}
          groomName={`${data.groom.lastName}${data.groom.firstName}`}
          brideName={`${data.bride.lastName}${data.bride.firstName}`}
          weddingDate={data.wedding.date}
          weddingTime={data.wedding.timeDisplay}
          venueName={data.wedding.venue.name}
          venueAddress={data.wedding.venue.address}
          thumbnailUrl={
            data.meta.kakaoThumbnail ||
            data.mainImage?.url ||
            data.gallery.images?.[0]?.url ||
            ''
          }
          shareTitle={data.meta.title}
          shareDescription={data.meta.description}
          templateType="parents"
        />
      )}
    </div>
  )
}

function EditorErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">에디터 오류</h2>
        <p className="text-gray-600 mb-6">에디터를 불러오는 중 문제가 발생했습니다.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={resetError} className="px-5 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
            다시 시도
          </button>
          <Link href="/">
            <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              홈으로
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ParentsEditorPage() {
  return (
    <ErrorBoundary fallback={<EditorErrorFallback resetError={() => window.location.reload()} />}>
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-6 w-6 border border-gray-300 border-t-gray-900" />
        </div>
      }>
        <ParentsEditorContent />
      </Suspense>
    </ErrorBoundary>
  )
}
