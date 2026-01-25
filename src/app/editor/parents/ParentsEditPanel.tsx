'use client'

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Copy, Check, Eye, Mail, Heart, MapPin, Clock, ImagePlus, Bus, Plus, X, Upload, Palette, FileText, Settings, Music, Share2, CreditCard, Play, Pause, Type } from 'lucide-react'
import { SortableList, SortableItem } from '@/components/ui/sortable-list'
import { bgmPresets } from '@/lib/bgmPresets'
import type { ParentsInvitationData, TimelineItem, ImageCropData } from './page'
import { COLOR_THEMES, type ColorThemeId } from '@/components/parents/types'
import ImageCropEditor from '@/components/parents/ImageCropEditor'

interface Guest {
  id: string
  invitation_id: string
  name: string
  relation: string | null
  honorific: string
  intro_greeting: string | null
  custom_message: string | null
  opened_at: string | null
  opened_count: number
  last_opened_at: string | null
  created_at: string
}

interface GuestStats {
  total: number
  opened: number
  unopened: number
  withRsvp: number
}

interface ParentsEditPanelProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  selectedGuest?: { name: string; honorific: string; relation?: string; intro_greeting?: string; custom_message?: string } | null
  onSelectGuest?: (guest: { name: string; honorific: string; relation?: string; intro_greeting?: string; custom_message?: string } | null) => void
  onActiveSectionChange?: (section: string | null) => void
}

// 아코디언 항목 → 미리보기 섹션 ID 매핑
const accordionToPreviewSection: Record<string, string> = {
  sender: 'greeting',      // 보내는 사람 → 인사말
  couple: 'couple',        // 신랑·신부 → 커플 사진
  wedding: 'wedding',      // 결혼식 정보 → 날짜/장소
  envelope: 'envelope',    // 봉투 메시지 → 인트로 (특수 처리)
  greeting: 'greeting',    // 본문 인사말 → 인사말
  gallery: 'couple',       // 갤러리 → 커플 사진
  timeline: 'timeline',    // 타임라인 → 타임라인
  weddingInfo: 'weddingInfo', // 결혼식 안내 → 결혼식 안내
  accounts: 'accounts',    // 계좌 안내 → 계좌 안내
}

// 폰트 스타일 옵션 (한글 중심)
const FONT_STYLE_OPTIONS = [
  {
    id: 'elegant',
    name: '정갈한 명조',
    desc: '나눔명조',
    preview: '격식 있고 전통적'
  },
  {
    id: 'soft',
    name: '부드러운 바탕',
    desc: '고운바탕',
    preview: '따뜻하고 부드러운'
  },
  {
    id: 'classic',
    name: '고전 세리프',
    desc: '함렛 (Hahmlet)',
    preview: '고급스럽고 정제된'
  },
  {
    id: 'brush',
    name: '전통 붓글씨',
    desc: '송명 (Song Myung)',
    preview: '전통적인 붓글씨 느낌'
  },
  {
    id: 'modern',
    name: '모던 고딕',
    desc: 'IBM Plex Sans KR',
    preview: '깔끔하고 현대적'
  },
  {
    id: 'friendly',
    name: '친근한 고딕',
    desc: '나눔고딕',
    preview: '부드럽고 읽기 쉬운'
  },
] as const

// 결혼식 안내 항목 설정
const PARENTS_INFO_ITEMS_CONFIG: { key: string; label: string; emoji: string }[] = [
  { key: 'flowerGift', label: '꽃 답례품 안내', emoji: '💐' },
  { key: 'wreath', label: '화환 안내', emoji: '🌸' },
  { key: 'flowerChild', label: '화동 안내', emoji: '🌼' },
  { key: 'reception', label: '피로연 안내', emoji: '🍽' },
  { key: 'photoBooth', label: '포토부스 안내', emoji: '📸' },
  { key: 'shuttle', label: '셔틀버스 운행', emoji: '🚌' },
]

const DEFAULT_ITEM_ORDER = PARENTS_INFO_ITEMS_CONFIG.map(item => item.key)

export default function ParentsEditPanel({ data, updateData, updateNestedData, invitationId, selectedGuest, onSelectGuest, onActiveSectionChange }: ParentsEditPanelProps) {
  // 게스트 관리 상태
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestStats, setGuestStats] = useState<GuestStats>({ total: 0, opened: 0, unopened: 0, withRsvp: 0 })
  const [isLoadingGuests, setIsLoadingGuests] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 아코디언 상태
  const [openSections, setOpenSections] = useState<string[]>(['guests'])

  // 아코디언 변경 핸들러 (activeSection도 함께 업데이트)
  const handleAccordionChange = (newValue: string[]) => {
    const previousValue = openSections
    setOpenSections(newValue)

    // 새로 열린 아코디언 항목 찾기
    const newlyOpened = newValue.find(v => !previousValue.includes(v))
    if (newlyOpened && accordionToPreviewSection[newlyOpened] && onActiveSectionChange) {
      onActiveSectionChange(accordionToPreviewSection[newlyOpened])
    }
  }

  // BGM 관련 상태
  const bgmAudioRef = useRef<HTMLAudioElement>(null)
  const [previewingBgmId, setPreviewingBgmId] = useState<string | null>(null)
  const [isCustomBgm, setIsCustomBgm] = useState(false)

  // 이미지 업로드 상태
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

  // 안내 항목 순서 변경 함수 (드래그 앤 드롭)
  const handleInfoItemReorder = (newOrder: string[]) => {
    // 유효성 검증: newOrder가 배열이고 비어있지 않은지 확인
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
      console.warn('Invalid order array received:', newOrder)
      return
    }

    // 유효성 검증: 모든 항목이 설정된 항목 중 하나인지 확인
    const validKeys = PARENTS_INFO_ITEMS_CONFIG.map(item => item.key)
    const isValidOrder = newOrder.every(key => validKeys.includes(key))

    if (!isValidOrder) {
      console.warn('Order contains invalid keys:', newOrder)
      return
    }

    updateNestedData('weddingInfo.itemOrder', newOrder)
  }

  // 게스트 목록 불러오기
  const fetchGuests = useCallback(async () => {
    if (!invitationId) return

    setIsLoadingGuests(true)
    try {
      const res = await fetch(`/api/guests?invitationId=${invitationId}`)
      const result = await res.json() as { guests?: Guest[]; stats?: GuestStats }
      if (res.ok) {
        setGuests(result.guests || [])
        setGuestStats(result.stats || { total: 0, opened: 0, unopened: 0, withRsvp: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error)
    } finally {
      setIsLoadingGuests(false)
    }
  }, [invitationId])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  // 링크 복사
  const handleCopyLink = async (guest: Guest) => {
    const baseUrl = window.location.origin
    // slug가 있으면 slug 사용, 없으면 id 사용
    const link = `${baseUrl}/i/${invitationId}?guest=${guest.id}`

    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(guest.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // 날짜 포맷
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File, key: string, onSuccess: (url: string) => void) => {
    setUploadingImages(prev => new Set(prev).add(key))

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (invitationId) {
        formData.append('invitationId', invitationId)
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const { url }: { url: string } = await res.json()
        onSuccess(url)
      } else {
        console.error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 상단 탭 네비게이션 */}
      <Tabs defaultValue="design" className="flex-1 flex flex-col min-h-0">
        <div className="border-b bg-white shrink-0">
          <TabsList className="w-full h-auto p-1 bg-gray-50 rounded-none grid grid-cols-4 gap-1">
            <TabsTrigger
              value="design"
              className="flex flex-col items-center gap-0.5 py-2 px-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded"
            >
              <Palette className="w-4 h-4" />
              <span>디자인</span>
            </TabsTrigger>
            <TabsTrigger
              value="required"
              className="flex flex-col items-center gap-0.5 py-2 px-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded"
            >
              <FileText className="w-4 h-4" />
              <span>필수입력</span>
            </TabsTrigger>
            <TabsTrigger
              value="optional"
              className="flex flex-col items-center gap-0.5 py-2 px-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded"
            >
              <Settings className="w-4 h-4" />
              <span>선택입력</span>
            </TabsTrigger>
            <TabsTrigger
              value="guests"
              className="flex flex-col items-center gap-0.5 py-2 px-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded"
            >
              <Users className="w-4 h-4" />
              <span>게스트</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== 디자인 탭 ==================== */}
        <TabsContent value="design" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <Accordion type="multiple" defaultValue={['color', 'bgm', 'share']} className="w-full">
            {/* 컬러 테마 */}
            <AccordionItem value="color" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${COLOR_THEMES[data.colorTheme || 'burgundy'].primary}20` }}
                  >
                    <Palette className="w-4 h-4" style={{ color: COLOR_THEMES[data.colorTheme || 'burgundy'].primary }} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">컬러 테마</div>
                    <div className="text-xs text-gray-500">{COLOR_THEMES[data.colorTheme || 'burgundy'].name}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">청첩장 전체 분위기를 결정하는 컬러 테마를 선택하세요.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(COLOR_THEMES) as ColorThemeId[]).map((themeId) => {
                      const theme = COLOR_THEMES[themeId]
                      const isSelected = (data.colorTheme || 'burgundy') === themeId
                      return (
                        <button
                          key={themeId}
                          onClick={() => updateData({ colorTheme: themeId })}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-gray-800 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <div
                              className="w-4 h-4 rounded-full border border-white shadow-sm -ml-3"
                              style={{ backgroundColor: theme.accent }}
                            />
                            <span className="text-xs font-medium ml-1">{theme.name}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 폰트 스타일 */}
            <AccordionItem value="font" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Type className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">폰트 스타일</div>
                    <div className="text-xs text-gray-500">
                      {FONT_STYLE_OPTIONS.find(f => f.id === (data.fontStyle || 'elegant'))?.name || '정갈한 명조'}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">청첩장의 분위기를 결정하는 폰트 스타일을 선택하세요.</p>
                  <div className="space-y-2">
                    {FONT_STYLE_OPTIONS.map((font) => {
                      const isSelected = (data.fontStyle || 'elegant') === font.id
                      return (
                        <button
                          key={font.id}
                          onClick={() => updateData({ fontStyle: font.id as typeof data.fontStyle })}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'border-gray-800 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{font.name}</div>
                              <div className="text-xs text-gray-500">{font.desc}</div>
                            </div>
                            <div className="text-[10px] text-gray-400">{font.preview}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 배경음악 */}
            <AccordionItem value="bgm" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Music className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">배경음악</div>
                    <div className="text-xs text-gray-500">{data.bgm?.enabled ? '사용 중' : '미사용'}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 space-y-4">
                {/* 숨겨진 오디오 엘리먼트 (미리듣기용) */}
                <audio
                  ref={bgmAudioRef}
                  onEnded={() => setPreviewingBgmId(null)}
                  onPause={() => setPreviewingBgmId(null)}
                />

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">배경음악 사용</p>
                    <p className="text-xs text-gray-500">청첩장에 음악을 추가해요</p>
                  </div>
                  <Switch
                    checked={data.bgm?.enabled ?? false}
                    onCheckedChange={(checked) => {
                      updateNestedData('bgm.enabled', checked)
                      if (!checked && bgmAudioRef.current) {
                        bgmAudioRef.current.pause()
                        setPreviewingBgmId(null)
                      }
                    }}
                  />
                </div>

                {data.bgm?.enabled && (
                  <>
                    {/* BGM 프리셋 리스트 */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">음악 선택</Label>
                      <div className="space-y-2">
                        {bgmPresets.map((preset) => {
                          const isSelected = !isCustomBgm && data.bgm?.url === preset.url
                          const isPreviewing = previewingBgmId === preset.id

                          return (
                            <div
                              key={preset.id}
                              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                              onClick={() => {
                                setIsCustomBgm(false)
                                updateNestedData('bgm.url', preset.url)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isSelected ? 'bg-purple-500' : 'bg-gray-100'
                                  }`}>
                                    <Music className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                                      {preset.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{preset.description}</p>
                                    {preset.duration && (
                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        {preset.duration} {preset.artist && `· ${preset.artist}`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isPreviewing) {
                                      bgmAudioRef.current?.pause()
                                      setPreviewingBgmId(null)
                                    } else {
                                      if (bgmAudioRef.current) {
                                        bgmAudioRef.current.src = preset.url
                                        bgmAudioRef.current.play()
                                        setPreviewingBgmId(preset.id)
                                      }
                                    }
                                  }}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                    isPreviewing
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {isPreviewing ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4 ml-0.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })}

                        {/* 직접 입력 옵션 */}
                        <div
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            isCustomBgm
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setIsCustomBgm(true)
                            const isPresetUrl = bgmPresets.some(p => p.url === data.bgm?.url)
                            if (isPresetUrl) {
                              updateNestedData('bgm.url', '')
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCustomBgm ? 'bg-purple-500' : 'bg-gray-100'
                            }`}>
                              <FileText className={`w-5 h-5 ${isCustomBgm ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${isCustomBgm ? 'text-purple-700' : 'text-gray-900'}`}>
                                직접 입력
                              </p>
                              <p className="text-xs text-gray-500">나만의 음악 URL을 입력해요</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 직접 입력 URL 필드 */}
                    {isCustomBgm && (
                      <div className="space-y-1.5 pl-4 border-l-2 border-purple-200">
                        <Label className="text-xs">음악 URL</Label>
                        <Input
                          value={data.bgm?.url || ''}
                          onChange={(e) => updateNestedData('bgm.url', e.target.value)}
                          placeholder="https://example.com/my-music.mp3"
                        />
                        <p className="text-[10px] text-gray-400">MP3, WAV 등 오디오 파일 URL을 입력하세요</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">자동 재생</p>
                        <p className="text-xs text-gray-500">페이지 열릴 때 자동으로 재생 (브라우저 제한 있음)</p>
                      </div>
                      <Switch
                        checked={data.bgm?.autoplay ?? false}
                        onCheckedChange={(checked) => updateNestedData('bgm.autoplay', checked)}
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* 공유 미리보기 설정 */}
            <AccordionItem value="share" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">공유 미리보기</div>
                    <div className="text-xs text-gray-500">카카오톡, SNS 공유 설정</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 space-y-4">
                <p className="text-xs text-gray-500">
                  카카오톡, 문자 등으로 청첩장을 공유할 때 표시되는 정보입니다.
                </p>

                {/* 공유 제목 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">공유 제목</Label>
                  <Input
                    value={data.meta?.title || ''}
                    onChange={(e) => updateNestedData('meta.title', e.target.value)}
                    placeholder={`${data.groom.firstName || '신랑'} ♥ ${data.bride.firstName || '신부'} 결혼합니다`}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-gray-400">비워두면 자동 생성됩니다.</p>
                </div>

                {/* 공유 설명 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">공유 설명</Label>
                  <Input
                    value={data.meta?.description || ''}
                    onChange={(e) => updateNestedData('meta.description', e.target.value)}
                    placeholder={data.wedding.date ? new Date(data.wedding.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '2025년 3월 15일 토요일 오후 2시'}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-gray-400">비워두면 결혼식 날짜가 표시됩니다.</p>
                </div>

                {/* 카카오톡 공유 썸네일 이미지 */}
                <div className="space-y-2 pt-3 border-t">
                  <Label className="text-xs font-medium">카카오톡 공유 썸네일</Label>
                  <p className="text-xs text-gray-500">권장 사이즈: 600 x 800px (3:4 세로 비율)</p>
                </div>

                <div className="space-y-3">
                  {data.meta?.kakaoThumbnail ? (
                    <div className="relative max-w-[200px]">
                      <div
                        className="w-full aspect-[3/4] rounded-lg bg-cover bg-center border border-gray-200"
                        style={{ backgroundImage: `url(${data.meta.kakaoThumbnail})` }}
                      />
                      <button
                        type="button"
                        onClick={() => updateNestedData('meta.kakaoThumbnail', '')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center max-w-[200px] aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 relative">
                      <div className="flex flex-col items-center justify-center p-4">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-xs text-gray-500 text-center">클릭하여 업로드</p>
                        <p className="text-xs text-gray-400 mt-1">600 x 800px</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file, 'kakao-thumbnail', (url) => updateNestedData('meta.kakaoThumbnail', url))
                            e.target.value = ''
                          }
                        }}
                      />
                      {uploadingImages.has('kakao-thumbnail') && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                        </div>
                      )}
                    </label>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  * 카카오톡 공유 시 표시되는 이미지입니다. 미설정 시 갤러리 첫 번째 이미지가 사용됩니다.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* ==================== 필수입력 탭 ==================== */}
        <TabsContent value="required" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <Accordion type="multiple" value={openSections} onValueChange={handleAccordionChange} className="w-full">

            {/* ========== 1. 보내는 사람 (혼주) 정보 ========== */}
          <AccordionItem value="sender" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">보내는 사람</div>
                  <div className="text-xs text-gray-500">부모님 정보</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              {/* 혼주 선택 */}
              <div className="space-y-2">
                <Label className="text-xs">누구의 청첩장인가요?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateNestedData('sender.side', 'groom')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      data.sender.side === 'groom'
                        ? 'border-[#722F37] bg-[#722F37]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">신랑측 혼주</div>
                  </button>
                  <button
                    onClick={() => updateNestedData('sender.side', 'bride')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      data.sender.side === 'bride'
                        ? 'border-[#722F37] bg-[#722F37]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">신부측 혼주</div>
                  </button>
                </div>
              </div>

              {/* 부모님 이름 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">아버지 성함</Label>
                  <Input
                    value={data.sender.fatherName}
                    onChange={(e) => updateNestedData('sender.fatherName', e.target.value)}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">어머니 성함</Label>
                  <Input
                    value={data.sender.motherName}
                    onChange={(e) => updateNestedData('sender.motherName', e.target.value)}
                    placeholder="김영희"
                  />
                </div>
              </div>

              {/* 서명 */}
              <div className="space-y-1.5">
                <Label className="text-xs">편지 서명</Label>
                <Input
                  value={data.sender.signature}
                  onChange={(e) => updateNestedData('sender.signature', e.target.value)}
                  placeholder="아버지 홍길동 · 어머니 김영희 드림"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ========== 3. 신랑신부 정보 ========== */}
          <AccordionItem value="couple" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">신랑 · 신부</div>
                  <div className="text-xs text-gray-500">결혼하는 자녀 정보</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              {/* 신랑 */}
              <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">신랑</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-500">성</Label>
                    <Input
                      value={data.groom.lastName}
                      onChange={(e) => updateNestedData('groom.lastName', e.target.value)}
                      placeholder="김"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-gray-500">이름</Label>
                    <Input
                      value={data.groom.firstName}
                      onChange={(e) => updateNestedData('groom.firstName', e.target.value)}
                      placeholder="민수"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={data.groom.fatherName}
                    onChange={(e) => updateNestedData('groom.fatherName', e.target.value)}
                    placeholder="신랑 아버지"
                    className="text-sm"
                  />
                  <Input
                    value={data.groom.motherName}
                    onChange={(e) => updateNestedData('groom.motherName', e.target.value)}
                    placeholder="신랑 어머니"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* 신부 */}
              <div className="space-y-3 p-3 bg-pink-50/50 rounded-lg">
                <div className="text-sm font-medium text-pink-800">신부</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-500">성</Label>
                    <Input
                      value={data.bride.lastName}
                      onChange={(e) => updateNestedData('bride.lastName', e.target.value)}
                      placeholder="이"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-gray-500">이름</Label>
                    <Input
                      value={data.bride.firstName}
                      onChange={(e) => updateNestedData('bride.firstName', e.target.value)}
                      placeholder="서연"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={data.bride.fatherName}
                    onChange={(e) => updateNestedData('bride.fatherName', e.target.value)}
                    placeholder="신부 아버지"
                    className="text-sm"
                  />
                  <Input
                    value={data.bride.motherName}
                    onChange={(e) => updateNestedData('bride.motherName', e.target.value)}
                    placeholder="신부 어머니"
                    className="text-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ========== 4. 결혼식 정보 ========== */}
          <AccordionItem value="wedding" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">결혼식 정보</div>
                  <div className="text-xs text-gray-500">날짜, 시간, 장소</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              {/* 날짜/시간 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">결혼식 날짜</Label>
                  <Input
                    type="date"
                    value={data.wedding.date}
                    onChange={(e) => updateNestedData('wedding.date', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">시간 표시</Label>
                  <Input
                    value={data.wedding.timeDisplay}
                    onChange={(e) => updateNestedData('wedding.timeDisplay', e.target.value)}
                    placeholder="오후 12시"
                  />
                </div>
              </div>

              {/* 장소 */}
              <div className="space-y-1.5">
                <Label className="text-xs">예식장 이름</Label>
                <Input
                  value={data.wedding.venue.name}
                  onChange={(e) => updateNestedData('wedding.venue.name', e.target.value)}
                  placeholder="더채플앳청담"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">홀 이름</Label>
                <Input
                  value={data.wedding.venue.hall}
                  onChange={(e) => updateNestedData('wedding.venue.hall', e.target.value)}
                  placeholder="그랜드볼룸"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">주소</Label>
                <Input
                  value={data.wedding.venue.address}
                  onChange={(e) => updateNestedData('wedding.venue.address', e.target.value)}
                  placeholder="서울시 강남구..."
                />
              </div>

              {/* 지도 링크 */}
              <div className="pt-3 border-t space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">지도 링크</p>
                  <p className="text-[10px] text-gray-500">각 지도 앱에서 장소 검색 후 공유 링크를 복사해 붙여넣으세요.</p>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">네이버지도 링크</Label>
                    <Input
                      value={data.wedding.venue.naverMapUrl || ''}
                      onChange={(e) => updateNestedData('wedding.venue.naverMapUrl', e.target.value)}
                      placeholder="https://naver.me/..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">카카오맵 링크</Label>
                    <Input
                      value={data.wedding.venue.kakaoMapUrl || ''}
                      onChange={(e) => updateNestedData('wedding.venue.kakaoMapUrl', e.target.value)}
                      placeholder="https://place.map.kakao.com/..."
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">T맵 링크</Label>
                    <Input
                      value={data.wedding.venue.tmapUrl || ''}
                      onChange={(e) => updateNestedData('wedding.venue.tmapUrl', e.target.value)}
                      placeholder="https://tmap.life/..."
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 오시는 길 안내 */}
              <div className="pt-3 border-t space-y-3">
                <p className="text-xs font-medium text-gray-700">오시는 길 안내</p>

                {/* 버스 */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">🚌 버스</Label>
                    <Switch
                      checked={data.wedding.directions?.bus?.enabled ?? false}
                      onCheckedChange={(checked) => updateNestedData('wedding.directions.bus.enabled', checked)}
                    />
                  </div>
                  {data.wedding.directions?.bus?.enabled && (
                    <div className="space-y-2">
                      <Input
                        value={data.wedding.directions?.bus?.lines || ''}
                        onChange={(e) => updateNestedData('wedding.directions.bus.lines', e.target.value)}
                        placeholder="143, 240, 463 / 3412, 4412"
                        className="text-sm"
                      />
                      <Input
                        value={data.wedding.directions?.bus?.stop || ''}
                        onChange={(e) => updateNestedData('wedding.directions.bus.stop', e.target.value)}
                        placeholder="청담사거리 정류장 하차 후 도보 5분"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* 지하철 */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">🚇 지하철</Label>
                    <Switch
                      checked={data.wedding.directions?.subway?.enabled ?? false}
                      onCheckedChange={(checked) => updateNestedData('wedding.directions.subway.enabled', checked)}
                    />
                  </div>
                  {data.wedding.directions?.subway?.enabled && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={data.wedding.directions?.subway?.line || ''}
                          onChange={(e) => updateNestedData('wedding.directions.subway.line', e.target.value)}
                          placeholder="7호선"
                          className="text-sm"
                        />
                        <Input
                          value={data.wedding.directions?.subway?.station || ''}
                          onChange={(e) => updateNestedData('wedding.directions.subway.station', e.target.value)}
                          placeholder="청담역"
                          className="text-sm"
                        />
                        <Input
                          value={data.wedding.directions?.subway?.exit || ''}
                          onChange={(e) => updateNestedData('wedding.directions.subway.exit', e.target.value)}
                          placeholder="9번 출구"
                          className="text-sm"
                        />
                      </div>
                      <Input
                        value={data.wedding.directions?.subway?.walk || ''}
                        onChange={(e) => updateNestedData('wedding.directions.subway.walk', e.target.value)}
                        placeholder="도보 약 7분 / 택시 약 3분"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* 주차 */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">🅿️ 주차 안내</Label>
                    <Switch
                      checked={data.wedding.directions?.parking?.enabled ?? false}
                      onCheckedChange={(checked) => updateNestedData('wedding.directions.parking.enabled', checked)}
                    />
                  </div>
                  {data.wedding.directions?.parking?.enabled && (
                    <div className="space-y-2">
                      <Input
                        value={data.wedding.directions?.parking?.capacity || ''}
                        onChange={(e) => updateNestedData('wedding.directions.parking.capacity', e.target.value)}
                        placeholder="지하 2~4층 주차 가능 (200대)"
                        className="text-sm"
                      />
                      <Input
                        value={data.wedding.directions?.parking?.free || ''}
                        onChange={(e) => updateNestedData('wedding.directions.parking.free', e.target.value)}
                        placeholder="주차권 2시간 무료 (안내데스크 수령)"
                        className="text-sm"
                      />
                      <Input
                        value={data.wedding.directions?.parking?.note || ''}
                        onChange={(e) => updateNestedData('wedding.directions.parking.note', e.target.value)}
                        placeholder="주말 혼잡하오니 대중교통 이용을 권장드립니다."
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ========== 5. 봉투 메시지 ========== */}
          <AccordionItem value="envelope" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">봉투 메시지</div>
                  <div className="text-xs text-gray-500">편지지에 표시될 메시지</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">편지 메시지 (줄바꿈으로 구분)</Label>
                <Textarea
                  value={data.envelope.message.join('\n')}
                  onChange={(e) => updateNestedData('envelope.message', e.target.value.split('\n'))}
                  placeholder="항상 저희 가족&#10;챙겨주셔서 감사합니다&#10;&#10;좋은 사람 만나&#10;결혼하게 되었습니다"
                  rows={8}
                  className="font-light leading-relaxed"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">기본 인사 (게스트 정보 없을 때)</Label>
                <Input
                  value={data.envelope.defaultGreeting}
                  onChange={(e) => updateNestedData('envelope.defaultGreeting', e.target.value)}
                  placeholder="소중한 분께"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ========== 6. 본문 인사말 ========== */}
          <AccordionItem value="greeting" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-cyan-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">본문 인사말</div>
                  <div className="text-xs text-gray-500">청첩장 본문에 표시</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <Textarea
                value={data.greeting}
                onChange={(e) => updateData({ greeting: e.target.value })}
                placeholder="서로 다른 길을 걸어온 두 사람이..."
                rows={6}
                className="font-light leading-relaxed"
              />
            </AccordionContent>
          </AccordionItem>

          {/* ========== 7. 갤러리 ========== */}
          <AccordionItem value="gallery" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ImagePlus className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">갤러리</div>
                  <div className="text-xs text-gray-500">사진 {data.gallery?.images?.length || 0}장</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              <p className="text-xs text-gray-500">신랑신부 사진을 추가하세요. (최대 10장)</p>

              {data.gallery?.images?.map((img, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">사진 {index + 1}</span>
                    <button
                      onClick={() => {
                        const newImages = data.gallery?.images?.filter((_, i) => i !== index) || []
                        updateNestedData('gallery.images', newImages)
                      }}
                      className="p-1 rounded hover:bg-red-100 text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <ImageCropEditor
                    value={img}
                    onChange={(cropData) => {
                      const newImages = [...(data.gallery?.images || [])]
                      newImages[index] = cropData
                      updateNestedData('gallery.images', newImages)
                    }}
                    aspectRatio={3/4}
                    containerWidth={240}
                    invitationId={invitationId || undefined}
                    label=""
                  />
                </div>
              ))}

              {(data.gallery?.images?.length || 0) < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newImages = [...(data.gallery?.images || []), { url: '', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }]
                    updateNestedData('gallery.images', newImages)
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  이미지 추가
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>

          </Accordion>
        </TabsContent>

        {/* ==================== 선택입력 탭 ==================== */}
        <TabsContent value="optional" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <Accordion type="multiple" defaultValue={['timeline']} className="w-full">

          {/* ========== 1. 타임라인 ========== */}
          <AccordionItem value="timeline" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">타임라인</div>
                  <div className="text-xs text-gray-500">
                    {data.timelineEnabled !== false ? `가족 스토리 ${data.timeline?.length || 0}개` : 'OFF'}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              {/* ON/OFF 토글 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">타임라인 표시</p>
                  <p className="text-xs text-gray-500">부모님 시점의 성장 스토리</p>
                </div>
                <Switch
                  checked={data.timelineEnabled !== false}
                  onCheckedChange={(checked) => updateData({ timelineEnabled: checked })}
                />
              </div>

              {data.timelineEnabled !== false && (
                <>
                  <p className="text-xs text-gray-500">부모님 시점에서 아이의 성장 이야기를 담아보세요.</p>

                  {data.timeline?.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">스토리 {index + 1}</span>
                        <button
                          onClick={() => {
                            const newTimeline = data.timeline?.filter((_, i) => i !== index) || []
                            updateData({ timeline: newTimeline })
                          }}
                          className="p-1 rounded hover:bg-red-100 text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">연도</Label>
                          <Input
                            value={item.year}
                            onChange={(e) => {
                              const newTimeline = [...(data.timeline || [])]
                              newTimeline[index] = { ...newTimeline[index], year: e.target.value }
                              updateData({ timeline: newTimeline })
                            }}
                            placeholder="1992"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px]">설명</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              const newTimeline = [...(data.timeline || [])]
                              newTimeline[index] = { ...newTimeline[index], description: e.target.value }
                              updateData({ timeline: newTimeline })
                            }}
                            placeholder="저희가 결혼하던 날"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px]">이미지</Label>
                        <ImageCropEditor
                          value={item.image || { url: item.imageUrl || '', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }}
                          onChange={(cropData) => {
                            const newTimeline = [...(data.timeline || [])]
                            newTimeline[index] = {
                              ...newTimeline[index],
                              image: cropData,
                              imageUrl: cropData.url // 호환성 유지
                            }
                            updateData({ timeline: newTimeline })
                          }}
                          aspectRatio={1}
                          containerWidth={220}
                          invitationId={invitationId || undefined}
                          label=""
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTimeline = [...(data.timeline || []), {
                        year: '',
                        description: '',
                        imageUrl: '',
                        image: { url: '', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }
                      }]
                      updateData({ timeline: newTimeline })
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    스토리 추가
                  </Button>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ========== 2. 결혼식 안내 ========== */}
          <AccordionItem value="weddingInfo" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <Bus className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium">결혼식 안내</div>
                  <div className="text-xs text-gray-500">답례품, 화환, 피로연, 셔틀버스 등</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              {/* 섹션 전체 ON/OFF */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">결혼식 안내 섹션 표시</Label>
                <Switch
                  checked={data.weddingInfo?.enabled ?? true}
                  onCheckedChange={(checked) => updateNestedData('weddingInfo.enabled', checked)}
                />
              </div>

              {data.weddingInfo?.enabled !== false && (
                <SortableList
                  items={data.weddingInfo?.itemOrder || DEFAULT_ITEM_ORDER}
                  onReorder={handleInfoItemReorder}
                  renderDragOverlay={(activeId) => {
                    const config = PARENTS_INFO_ITEMS_CONFIG.find(c => c.key === activeId)
                    return config ? (
                      <div className="p-3 bg-white">
                        <span className="text-xs font-medium">{config.emoji} {config.label}</span>
                      </div>
                    ) : null
                  }}
                >
                  <div className="space-y-3">
                    {/* 안내 항목들 (드래그로 순서 변경 가능) */}
                    {(data.weddingInfo?.itemOrder || DEFAULT_ITEM_ORDER).map((itemKey) => {
                      const config = PARENTS_INFO_ITEMS_CONFIG.find(c => c.key === itemKey)
                      if (!config) return null

                      const weddingInfo = data.weddingInfo || {}
                      const itemData = weddingInfo[itemKey as keyof typeof weddingInfo]
                      const isEnabled = typeof itemData === 'object' && itemData !== null && 'enabled' in itemData ? itemData.enabled : false

                      // 플레이스홀더 텍스트
                      const placeholders: Record<string, string> = {
                        flowerGift: '예식 후 하객분들께 감사의 마음을 전하기 위해...',
                        wreath: '축하의 마음만으로도 충분히 감사하여...',
                        flowerChild: '예식 중 사랑스러운 화동 입장이 예정되어 있습니다...',
                        reception: '피로연 자리를 마련하였습니다...',
                        photoBooth: '소중한 하루를 오래 기억할 수 있도록...',
                      }

                      return (
                        <SortableItem key={itemKey} id={itemKey}>
                          <div className="border rounded-lg p-3 space-y-2 bg-white hover:border-gray-300 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <Label className="text-xs font-medium">{config.emoji} {config.label}</Label>
                              <Switch
                                checked={isEnabled ?? false}
                                onCheckedChange={(checked) => updateNestedData(`weddingInfo.${itemKey}.enabled`, checked)}
                              />
                            </div>

                            {/* 각 항목별 상세 입력 폼 */}
                            {isEnabled && (
                              <div className="space-y-2">
                                {/* 기본 안내 내용 (셔틀버스 제외) */}
                                {itemKey !== 'shuttle' && (
                                  <Textarea
                                    value={(itemData as { content?: string })?.content || ''}
                                    onChange={(e) => updateNestedData(`weddingInfo.${itemKey}.content`, e.target.value)}
                                    placeholder={placeholders[itemKey] || '안내 내용을 입력하세요'}
                                    rows={3}
                                    className="text-sm"
                                  />
                                )}

                                {/* 피로연: 장소와 일시 추가 */}
                                {itemKey === 'reception' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">장소</Label>
                                      <Input
                                        value={data.weddingInfo?.reception?.venue || ''}
                                        onChange={(e) => updateNestedData('weddingInfo.reception.venue', e.target.value)}
                                        placeholder="피로연 장소"
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">일시</Label>
                                      <Input
                                        value={data.weddingInfo?.reception?.datetime || ''}
                                        onChange={(e) => updateNestedData('weddingInfo.reception.datetime', e.target.value)}
                                        placeholder="0년 0월 0일 오후 0시"
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* 셔틀버스: 전용 입력 폼 */}
                                {itemKey === 'shuttle' && (
                                  <div className="space-y-3 pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-[10px]">출발 일시</Label>
                                        <Input
                                          value={data.weddingInfo?.shuttle?.departureDate || ''}
                                          onChange={(e) => updateNestedData('weddingInfo.shuttle.departureDate', e.target.value)}
                                          placeholder="2027년 1월 9일"
                                          className="text-sm"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px]">출발 시간</Label>
                                        <Input
                                          value={data.weddingInfo?.shuttle?.departureTime || ''}
                                          onChange={(e) => updateNestedData('weddingInfo.shuttle.departureTime', e.target.value)}
                                          placeholder="오전 10시"
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">탑승 장소</Label>
                                      <Input
                                        value={data.weddingInfo?.shuttle?.departureLocation || ''}
                                        onChange={(e) => updateNestedData('weddingInfo.shuttle.departureLocation', e.target.value)}
                                        placeholder="서울시 강남구 청담역 9번 출구"
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-[10px]">복귀 시간</Label>
                                        <Input
                                          value={data.weddingInfo?.shuttle?.returnTime || ''}
                                          onChange={(e) => updateNestedData('weddingInfo.shuttle.returnTime', e.target.value)}
                                          placeholder="오후 5시"
                                          className="text-sm"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px]">차량 번호</Label>
                                        <Input
                                          value={data.weddingInfo?.shuttle?.vehicleNumber || ''}
                                          onChange={(e) => updateNestedData('weddingInfo.shuttle.vehicleNumber', e.target.value)}
                                          placeholder="전세버스 1234호"
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </SortableItem>
                      )
                    })}
                  </div>
                </SortableList>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ========== 3. 계좌 안내 ========== */}
          <AccordionItem value="accounts" className="border-b">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">계좌 안내</div>
                  <div className="text-xs text-gray-500">
                    {data.accounts?.enabled !== false ? `계좌 ${data.accounts?.list?.length || 0}개` : 'OFF'}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              {/* ON/OFF 토글 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">계좌 안내 표시</p>
                  <p className="text-xs text-gray-500">축의금 계좌 정보</p>
                </div>
                <Switch
                  checked={data.accounts?.enabled !== false}
                  onCheckedChange={(checked) => updateNestedData('accounts.enabled', checked)}
                />
              </div>

              {data.accounts?.enabled !== false && (
                <>
                  <p className="text-xs text-gray-500">축의금 전달을 위한 계좌 정보를 입력하세요.</p>

                  {data.accounts?.list?.map((account, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">계좌 {index + 1}</span>
                        <button
                          onClick={() => {
                            const newList = data.accounts?.list?.filter((_, i) => i !== index) || []
                            updateNestedData('accounts.list', newList)
                          }}
                          className="p-1 rounded hover:bg-red-100 text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">예금주</Label>
                          <Input
                            value={account.name}
                            onChange={(e) => {
                              const newList = [...(data.accounts?.list || [])]
                              newList[index] = { ...newList[index], name: e.target.value }
                              updateNestedData('accounts.list', newList)
                            }}
                            placeholder="예금주명"
                            className="text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">은행</Label>
                            <Input
                              value={account.bank}
                              onChange={(e) => {
                                const newList = [...(data.accounts?.list || [])]
                                newList[index] = { ...newList[index], bank: e.target.value }
                                updateNestedData('accounts.list', newList)
                              }}
                              placeholder="은행명"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">계좌번호</Label>
                            <Input
                              value={account.accountNumber}
                              onChange={(e) => {
                                const newList = [...(data.accounts?.list || [])]
                                newList[index] = { ...newList[index], accountNumber: e.target.value }
                                updateNestedData('accounts.list', newList)
                              }}
                              placeholder="123-456-789012"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newList = [...(data.accounts?.list || []), {
                        name: '',
                        bank: '',
                        accountNumber: ''
                      }]
                      updateNestedData('accounts.list', newList)
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    계좌 추가
                  </Button>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          </Accordion>
        </TabsContent>

        {/* ==================== 게스트 탭 ==================== */}
        <TabsContent value="guests" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <div className="p-5 space-y-4">
            {/* 게스트 관리 페이지 버튼 */}
            {invitationId ? (
              <a
                href={`/invite/${invitationId}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors"
              >
                <Users className="w-4 h-4" />
                게스트 관리 페이지 열기
              </a>
            ) : (
              <div className="text-center py-4 px-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                  게스트를 관리하려면 먼저 청첩장을 저장해주세요
                </p>
              </div>
            )}

            {/* 미리보기용 게스트 선택 */}
            {guests.length > 0 && (
              <>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-3">
                    💡 게스트를 선택하면 봉투 미리보기에서 확인할 수 있어요
                    {selectedGuest && (
                      <span className="ml-2 text-blue-500 font-medium">
                        (선택: {selectedGuest.name})
                      </span>
                    )}
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {guests.map((guest) => {
                      const isSelected = selectedGuest?.name === guest.name && selectedGuest?.honorific === guest.honorific
                      return (
                        <div
                          key={guest.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            isSelected ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (onSelectGuest) {
                              if (isSelected) {
                                onSelectGuest(null)
                              } else {
                                onSelectGuest({
                                  name: guest.name,
                                  honorific: guest.honorific,
                                  relation: guest.relation || undefined,
                                  intro_greeting: guest.intro_greeting || undefined,
                                  custom_message: guest.custom_message || undefined
                                })
                              }
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{guest.name}</span>
                              {guest.relation && (
                                <span className="text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                                  {guest.relation}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                              {guest.opened_count > 0 ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>{guest.opened_count}회</span>
                                </>
                              ) : (
                                <span>미열람</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyLink(guest); }}
                            className="p-2 rounded hover:bg-gray-200"
                            title="링크 복사"
                          >
                            {copiedId === guest.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 빈 상태 */}
            {!isLoadingGuests && guests.length === 0 && invitationId && (
              <div className="text-center py-6 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">등록된 게스트가 없습니다</p>
                <p className="text-xs mt-1">관리 페이지에서 게스트를 추가해주세요</p>
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
