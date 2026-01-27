'use client'

import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useEditorStore, ImageSettings, SectionVisibility, PreviewSectionId } from '@/store/editorStore'
import StoryGeneratorModal, { FamilyGeneratedResult } from '@/components/ai/StoryGeneratorModal'
import HighlightTextarea from '@/components/editor/HighlightTextarea'
import { GeneratedStory } from '@/app/api/ai/generate-story/route'
import { fieldHelpers, sectionLabels, sectionColors, introAnimationOptions, PreviewSection } from '@/lib/fieldHelpers'
import { getPresetById } from '@/lib/introPresets'
import { uploadImage } from '@/lib/imageUpload'
import { ChevronRight, Sparkles, Palette, FileText, Heart, Settings, ChevronsUpDown, Play, Pause, Music, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import InlineCropEditor from './InlineCropEditor'
import ImageCropEditor, { CropData } from '@/components/parents/ImageCropEditor'
import { SortableList, SortableItem } from '@/components/ui/sortable-list'
import { bgmPresets, getBgmPresetByUrl } from '@/lib/bgmPresets'

// FAMILY 템플릿 전용 에디터 (동적 로드)
const DividerSectionEditor = lazy(() => import('./DividerSectionEditor'))
const ParentIntroEditor = lazy(() => import('./ParentIntroEditor'))
const WhyWeChoseEditor = lazy(() => import('./WhyWeChoseEditor'))
// const GuestManager = lazy(() => import('./GuestManager'))

// 섹션 매핑 배지 컴포넌트
function SectionBadge({ section }: { section?: PreviewSection }) {
  if (!section) return null
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sectionColors[section]}`}>
      → {sectionLabels[section]}
    </span>
  )
}

// 필드 헬퍼가 포함된 라벨 컴포넌트
// AI 스토리 생성 가능 표시
function AiIndicator() {
  return (
    <span className="ml-2 text-[10px] text-pink-500 font-medium">
      ✦ AI스토리 생성가능
    </span>
  )
}

function FieldLabel({ fieldKey, children, aiEnabled }: { fieldKey?: string; children?: React.ReactNode; aiEnabled?: boolean }) {
  const helper = fieldKey ? fieldHelpers[fieldKey] : null
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center">
          <Label className="text-xs font-medium">{children || helper?.label}</Label>
          {aiEnabled && <AiIndicator />}
        </div>
        {helper?.previewSection && <SectionBadge section={helper.previewSection} />}
      </div>
      {helper?.explanation && (
        <p className="text-[11px] text-gray-500 leading-relaxed">{helper.explanation}</p>
      )}
    </div>
  )
}

// 섹션 그룹 헤더 with 접기/펼치기 버튼
function SectionGroupHeader({
  title,
  description,
  isAllOpen,
  onToggleAll
}: {
  title: string;
  description: string;
  isAllOpen?: boolean;
  onToggleAll?: () => void;
}) {
  return (
    <div className="px-4 py-3 bg-gray-50 border-b sticky top-0 z-10 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {onToggleAll && (
        <button
          onClick={onToggleAll}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
          {isAllOpen ? '모두 접기' : '모두 펼치기'}
        </button>
      )}
    </div>
  )
}

// 텍스트 스타일 컨트롤 (행간 + 정렬)
function TextStyleControls({
  lineHeight = 2.0,
  textAlign = 'left',
  onLineHeightChange,
  onTextAlignChange,
}: {
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  onLineHeightChange: (v: number) => void
  onTextAlignChange: (v: 'left' | 'center' | 'right') => void
}) {
  const lineHeightOptions = [1.4, 1.6, 1.8, 2.0, 2.2]
  const alignOptions = [
    { value: 'left' as const, icon: AlignLeft },
    { value: 'center' as const, icon: AlignCenter },
    { value: 'right' as const, icon: AlignRight },
  ]
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-400 mr-0.5">행간</span>
        {lineHeightOptions.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onLineHeightChange(v)}
            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              lineHeight === v ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="w-px h-4 bg-gray-200" />
      <div className="flex items-center gap-0.5">
        <span className="text-[10px] text-gray-400 mr-0.5">정렬</span>
        {alignOptions.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onTextAlignChange(value)}
            className={`p-1 rounded transition-colors ${
              textAlign === value ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  )
}

interface EditPanelProps {
  onOpenIntroSelector?: () => void
  onOpenAIStoryGenerator?: () => void
  invitationId?: string | null
  templateId?: string // 새 템플릿의 경우 template 파라미터
}

// 안내 항목 설정
const INFO_ITEMS_CONFIG: { key: string; label: string }[] = [
  { key: 'dressCode', label: '드레스 코드' },
  { key: 'photoBooth', label: '포토부스' },
  { key: 'photoShare', label: '사진 공유' },
  { key: 'flowerGift', label: '꽃 답례품' },
  { key: 'flowerChild', label: '화동 안내' },
  { key: 'wreath', label: '화환 안내' },
  { key: 'shuttle', label: '셔틀버스 안내' },
  { key: 'reception', label: '피로연 안내' },
]

// 아코디언 아이템 → 미리보기 섹션 매핑
const accordionToPreviewSection: Record<string, PreviewSectionId> = {
  // 디자인 탭
  'design-theme': 'intro-cover',
  'design-font': 'intro-cover',
  'design-intro': 'intro-cover',
  'design-animation': 'intro-cover',
  'design-bgm': 'intro-cover',
  'design-cover': 'intro-cover',
  'design-kakao': 'intro-cover',
  // 필수 입력 탭
  'couple-basic': 'invitation',
  'family-info': 'invitation',
  'greeting': 'invitation',
  'wedding-info': 'venue-info',
  'directions': 'venue-info',
  'gallery': 'gallery',
  // 스토리 탭
  'profile': 'couple-profile',
  'our-story': 'our-story',
  'interview': 'interview',
  // 추가 기능 탭
  'guidance': 'guidance',
  'rsvp': 'rsvp',
  'account': 'thank-you',
  'contacts': 'thank-you',
}

export default function EditPanel({ onOpenIntroSelector, onOpenAIStoryGenerator, invitationId, templateId }: EditPanelProps) {
  const {
    invitation,
    updateField,
    updateNestedField,
    applyAIStory,
    applyFamilyAIStory,
    addStory,
    removeStory,
    addInterview,
    removeInterview,
    toggleSectionVisibility,
    setActiveSection,
    editorActiveTab,
    setEditorActiveTab,
    validationError,
    setValidationError
  } = useEditorStore()
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

  // BGM 미리듣기 관련
  const bgmAudioRef = useRef<HTMLAudioElement>(null)
  const [previewingBgmId, setPreviewingBgmId] = useState<string | null>(null)
  const [isCustomBgm, setIsCustomBgm] = useState(false)

  // BGM URL이 프리셋에 없으면 직접 입력 모드로 전환
  useEffect(() => {
    if (invitation?.bgm?.url) {
      const isPresetUrl = bgmPresets.some(p => p.url === invitation.bgm.url)
      setIsCustomBgm(!isPresetUrl && invitation.bgm.url.length > 0)
    }
  }, [invitation?.bgm?.url])

  // 이미지 업로드 핸들러 (공통)
  const handleImageUpload = async (
    file: File,
    uploadKey: string,
    onSuccess: (url: string) => void
  ) => {
    setUploadingImages(prev => new Set(prev).add(uploadKey))

    const result = await uploadImage(file)

    setUploadingImages(prev => {
      const next = new Set(prev)
      next.delete(uploadKey)
      return next
    })

    if (result.success && result.webUrl) {
      onSuccess(result.webUrl)
    } else {
      alert(result.error || '이미지 업로드에 실패했습니다.')
    }
  }

  // 각 탭의 아코디언 열림 상태 관리
  const [designAccordion, setDesignAccordion] = useState<string[]>(['design-theme'])
  const [requiredAccordion, setRequiredAccordion] = useState<string[]>(['couple-basic'])
  const [storyAccordion, setStoryAccordion] = useState<string[]>([])
  const [extrasAccordion, setExtrasAccordion] = useState<string[]>([])

  // 아코디언 아이템 목록
  const designItems = ['design-theme', 'design-font', 'design-intro', 'design-cover', 'design-kakao']
  const requiredItems = ['couple-basic', 'family-info', 'greeting', 'wedding-info', 'directions', 'gallery']
  const storyItems = ['parent-intro', 'why-we-chose', 'profile', 'our-story', 'interview']
  const extrasItems = ['guidance', 'rsvp', 'account', 'contacts']

  // 토글 함수들
  const toggleDesignAll = () => {
    setDesignAccordion(designAccordion.length === designItems.length ? [] : [...designItems])
  }
  const toggleRequiredAll = () => {
    setRequiredAccordion(requiredAccordion.length === requiredItems.length ? [] : [...requiredItems])
  }
  const toggleStoryAll = () => {
    setStoryAccordion(storyAccordion.length === storyItems.length ? [] : [...storyItems])
  }
  const toggleExtrasAll = () => {
    setExtrasAccordion(extrasAccordion.length === extrasItems.length ? [] : [...extrasItems])
  }

  // 안내 항목 순서 변경 함수 (드래그 앤 드롭)
  const handleInfoItemReorder = (newOrder: string[]) => {
    updateNestedField('content.info.itemOrder', newOrder)
  }

  // 아코디언 변경 핸들러 (activeSection도 함께 업데이트)
  const handleDesignAccordionChange = (value: string[]) => {
    setDesignAccordion(value)
    // 새로 열린 아코디언 아이템 찾기
    const newlyOpened = value.find(v => !designAccordion.includes(v))
    if (newlyOpened && accordionToPreviewSection[newlyOpened]) {
      setActiveSection(accordionToPreviewSection[newlyOpened])
    }
  }

  const handleRequiredAccordionChange = (value: string[]) => {
    setRequiredAccordion(value)
    const newlyOpened = value.find(v => !requiredAccordion.includes(v))
    if (newlyOpened && accordionToPreviewSection[newlyOpened]) {
      setActiveSection(accordionToPreviewSection[newlyOpened])
    }
  }

  const handleStoryAccordionChange = (value: string[]) => {
    setStoryAccordion(value)
    const newlyOpened = value.find(v => !storyAccordion.includes(v))
    if (newlyOpened && accordionToPreviewSection[newlyOpened]) {
      setActiveSection(accordionToPreviewSection[newlyOpened])
    }
  }

  const handleExtrasAccordionChange = (value: string[]) => {
    setExtrasAccordion(value)
    const newlyOpened = value.find(v => !extrasAccordion.includes(v))
    if (newlyOpened && accordionToPreviewSection[newlyOpened]) {
      setActiveSection(accordionToPreviewSection[newlyOpened])
    }
  }

  if (!invitation) return null

  const handleAIComplete = (story: GeneratedStory) => {
    applyAIStory(story)
  }

  // FAMILY 템플릿용 AI 스토리 결과 적용 핸들러
  const handleFamilyAIComplete = (result: FamilyGeneratedResult) => {
    applyFamilyAIStory(
      {
        groomDescription: result.groomDescription,
        brideDescription: result.brideDescription,
        groomQuote: result.groomQuote,
        brideQuote: result.brideQuote,
      },
      result.interview
    )
  }

  // 헬퍼 함수들
  const updateStoryField = (index: number, field: string, value: string) => {
    const stories = [...invitation.relationship.stories]
    stories[index] = { ...stories[index], [field]: value }
    updateNestedField('relationship.stories', stories)
  }

  const addStoryImage = (storyIndex: number, imageUrl: string) => {
    const stories = [...invitation.relationship.stories]
    const currentImages = stories[storyIndex].images || []
    const currentSettings = stories[storyIndex].imageSettings || []
    if (currentImages.length < 3) {
      stories[storyIndex] = {
        ...stories[storyIndex],
        images: [...currentImages, imageUrl],
        imageSettings: [...currentSettings, { scale: 1.0, positionX: 0, positionY: 0 }]
      }
      updateNestedField('relationship.stories', stories)
    }
  }

  const removeStoryImage = (storyIndex: number, imageIndex: number) => {
    const stories = [...invitation.relationship.stories]
    const currentImages = [...(stories[storyIndex].images || [])]
    const currentSettings = [...(stories[storyIndex].imageSettings || [])]
    currentImages.splice(imageIndex, 1)
    currentSettings.splice(imageIndex, 1)
    stories[storyIndex] = {
      ...stories[storyIndex],
      images: currentImages,
      imageSettings: currentSettings
    }
    updateNestedField('relationship.stories', stories)
  }

  const updateStoryImageSettings = (storyIndex: number, imageIndex: number, settings: Partial<ImageSettings>) => {
    const stories = [...invitation.relationship.stories]
    const currentSettings = [...(stories[storyIndex].imageSettings || [])]
    while (currentSettings.length <= imageIndex) {
      currentSettings.push({ scale: 1.0, positionX: 0, positionY: 0 })
    }
    currentSettings[imageIndex] = { ...currentSettings[imageIndex], ...settings }
    stories[storyIndex] = { ...stories[storyIndex], imageSettings: currentSettings }
    updateNestedField('relationship.stories', stories)
  }

  const updateInterviewField = (index: number, field: string, value: string) => {
    const interviews = [...invitation.content.interviews]
    interviews[index] = { ...interviews[index], [field]: value }
    updateNestedField('content.interviews', interviews)
  }

  const addInterviewImage = (interviewIndex: number, imageUrl: string) => {
    const interviews = [...invitation.content.interviews]
    const currentImages = interviews[interviewIndex].images || []
    const currentSettings = interviews[interviewIndex].imageSettings || []
    if (currentImages.length < 2) {
      interviews[interviewIndex] = {
        ...interviews[interviewIndex],
        images: [...currentImages, imageUrl],
        imageSettings: [...currentSettings, { scale: 1.0, positionX: 0, positionY: 0 }]
      }
      updateNestedField('content.interviews', interviews)
    }
  }

  const removeInterviewImage = (interviewIndex: number, imageIndex: number) => {
    const interviews = [...invitation.content.interviews]
    const currentImages = [...(interviews[interviewIndex].images || [])]
    const currentSettings = [...(interviews[interviewIndex].imageSettings || [])]
    currentImages.splice(imageIndex, 1)
    currentSettings.splice(imageIndex, 1)
    interviews[interviewIndex] = {
      ...interviews[interviewIndex],
      images: currentImages,
      imageSettings: currentSettings
    }
    updateNestedField('content.interviews', interviews)
  }

  const updateInterviewImageSettings = (interviewIndex: number, imageIndex: number, settings: Partial<ImageSettings>) => {
    const interviews = [...invitation.content.interviews]
    const currentSettings = [...(interviews[interviewIndex].imageSettings || [])]
    while (currentSettings.length <= imageIndex) {
      currentSettings.push({ scale: 1.0, positionX: 0, positionY: 0 })
    }
    currentSettings[imageIndex] = { ...currentSettings[imageIndex], ...settings }
    interviews[interviewIndex] = { ...interviews[interviewIndex], imageSettings: currentSettings }
    updateNestedField('content.interviews', interviews)
  }

  const addProfileImage = (person: 'groom' | 'bride', imageUrl: string) => {
    const currentImages = invitation[person].profile.images || []
    const currentSettings = invitation[person].profile.imageSettings || []
    if (currentImages.length < 3) {
      updateNestedField(`${person}.profile.images`, [...currentImages, imageUrl])
      updateNestedField(`${person}.profile.imageSettings`, [...currentSettings, { scale: 1.0, positionX: 0, positionY: 0 }])
    }
  }

  const removeProfileImage = (person: 'groom' | 'bride', imageIndex: number) => {
    const currentImages = [...(invitation[person].profile.images || [])]
    const currentSettings = [...(invitation[person].profile.imageSettings || [])]
    currentImages.splice(imageIndex, 1)
    currentSettings.splice(imageIndex, 1)
    updateNestedField(`${person}.profile.images`, currentImages)
    updateNestedField(`${person}.profile.imageSettings`, currentSettings)
  }

  const updateProfileImageSettings = (person: 'groom' | 'bride', imageIndex: number, settings: Partial<ImageSettings>) => {
    const currentSettings = [...(invitation[person].profile.imageSettings || [])]
    while (currentSettings.length <= imageIndex) {
      currentSettings.push({ scale: 1.0, positionX: 0, positionY: 0 })
    }
    currentSettings[imageIndex] = { ...currentSettings[imageIndex], ...settings }
    updateNestedField(`${person}.profile.imageSettings`, currentSettings)
  }

  const addGalleryImage = (imageUrl: string) => {
    const currentImages = invitation.gallery.images || []
    const currentSettings = invitation.gallery.imageSettings || []
    if (currentImages.length < 6) {
      updateNestedField('gallery.images', [...currentImages, imageUrl])
      updateNestedField('gallery.imageSettings', [...currentSettings, { scale: 1.0, positionX: 0, positionY: 0 }])
    }
  }

  const removeGalleryImage = (imageIndex: number) => {
    const currentImages = [...(invitation.gallery.images || [])]
    const currentSettings = [...(invitation.gallery.imageSettings || [])]
    currentImages.splice(imageIndex, 1)
    currentSettings.splice(imageIndex, 1)
    updateNestedField('gallery.images', currentImages)
    updateNestedField('gallery.imageSettings', currentSettings)
  }

  const updateGalleryImageSettings = (imageIndex: number, settings: Partial<ImageSettings>) => {
    const currentSettings = [...(invitation.gallery.imageSettings || [])]
    while (currentSettings.length <= imageIndex) {
      currentSettings.push({ scale: 1.0, positionX: 0, positionY: 0 })
    }
    currentSettings[imageIndex] = { ...currentSettings[imageIndex], ...settings }
    updateNestedField('gallery.imageSettings', currentSettings)
  }

  const addGuidanceImage = (imageUrl: string) => {
    updateNestedField('guidance.image', imageUrl)
    updateNestedField('guidance.imageSettings', { scale: 1.0, positionX: 0, positionY: 0 })
  }

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, '').slice(0, 11)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }

  const handlePhoneChange = (field: string, value: string) => {
    updateNestedField(field, formatPhoneNumber(value))
  }

  // 이미지 업로드 컴포넌트
  const ImageUploadGrid = ({
    images,
    maxImages,
    onAdd,
    onRemove,
    colorClass,
    uploadKeyPrefix
  }: {
    images: string[];
    maxImages: number;
    onAdd: (url: string) => void;
    onRemove: (index: number) => void;
    colorClass: string;
    uploadKeyPrefix: string;
  }) => (
    <div className={`grid grid-cols-${maxImages} gap-2`}>
      {Array.from({ length: maxImages }).map((_, imgIndex) => {
        const imageUrl = images?.[imgIndex]
        const uploadKey = `${uploadKeyPrefix}-${imgIndex}`
        return (
          <div key={imgIndex} className="relative">
            {imageUrl ? (
              <div className="relative group">
                <div
                  className={`aspect-square rounded-lg bg-cover bg-center border border-${colorClass}-200`}
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
                <button
                  onClick={() => onRemove(imgIndex)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className={`aspect-square border-2 border-dashed border-${colorClass}-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-${colorClass}-400 transition-colors bg-white/50 ${uploadingImages.has(uploadKey) ? 'opacity-50' : ''}`}>
                {uploadingImages.has(uploadKey) ? (
                  <>
                    <div className={`w-5 h-5 border-2 border-${colorClass}-300 border-t-${colorClass}-600 rounded-full animate-spin`} />
                    <span className={`text-[10px] text-${colorClass}-400 mt-1`}>업로드중...</span>
                  </>
                ) : (
                  <>
                    <svg className={`w-5 h-5 text-${colorClass}-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className={`text-[10px] text-${colorClass}-400 mt-1`}>추가</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingImages.has(uploadKey)}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, uploadKey, onAdd)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            )}
          </div>
        )
      })}
    </div>
  )

  // 이미지 설정 슬라이더
  const ImageSettingsSlider = ({
    settings,
    onUpdate,
    colorClass
  }: {
    settings: ImageSettings;
    onUpdate: (settings: Partial<ImageSettings>) => void;
    colorClass: string;
  }) => (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[9px] text-gray-500">확대/축소</Label>
          <span className="text-[9px] text-gray-400">{(settings.scale * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="200"
          value={settings.scale * 100}
          onChange={(e) => onUpdate({ scale: Number(e.target.value) / 100 })}
          className={`w-full h-1.5 bg-${colorClass}-100 rounded-lg appearance-none cursor-pointer accent-${colorClass}-500`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[9px] text-gray-500">좌우</Label>
            <span className="text-[9px] text-gray-400">{settings.positionX}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={settings.positionX}
            onChange={(e) => onUpdate({ positionX: Number(e.target.value) })}
            className={`w-full h-1.5 bg-${colorClass}-100 rounded-lg appearance-none cursor-pointer accent-${colorClass}-500`}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[9px] text-gray-500">상하</Label>
            <span className="text-[9px] text-gray-400">{settings.positionY}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={settings.positionY}
            onChange={(e) => onUpdate({ positionY: Number(e.target.value) })}
            className={`w-full h-1.5 bg-${colorClass}-100 rounded-lg appearance-none cursor-pointer accent-${colorClass}-500`}
          />
        </div>
      </div>
    </div>
  )

  // 폰트 스타일 옵션
  const fontStyleOptions = [
    { id: 'classic', name: 'Classic Elegance', desc: 'Playfair Display + 나눔명조' },
    { id: 'modern', name: 'Modern Minimal', desc: 'Montserrat + Noto Sans KR' },
    { id: 'romantic', name: 'Romantic', desc: 'Lora + 고운바탕' },
    { id: 'contemporary', name: 'Contemporary', desc: 'Cinzel + 고운돋움' },
    { id: 'luxury', name: 'Premium Luxury', desc: 'EB Garamond + 나눔명조' },
  ]

  // 색상 테마 옵션
  const colorThemeOptions = [
    { id: 'classic-rose', name: 'Classic Rose', colors: ['#E91E63', '#D4A574'] },
    { id: 'modern-black', name: 'Modern Black', colors: ['#1A1A1A', '#888888'] },
    { id: 'romantic-blush', name: 'Romantic Blush', colors: ['#D4A5A5', '#C9B8A8'] },
    { id: 'nature-green', name: 'Nature Green', colors: ['#6B8E6B', '#A8B5A0'] },
    { id: 'luxury-navy', name: 'Luxury Navy', colors: ['#1E3A5F', '#C9A96E'] },
    { id: 'sunset-coral', name: 'Sunset Coral', colors: ['#E8846B', '#F5C7A9'] },
  ]

  return (
    <div className="h-full flex flex-col bg-white border-r overflow-hidden">
      {/* 상단 탭 네비게이션 */}
      <Tabs value={editorActiveTab} onValueChange={(v) => { setEditorActiveTab(v); setValidationError(null) }} className="flex-1 flex flex-col min-h-0">
        {/* AI 스토리 작성하기 버튼 */}
        <div className="px-3 py-2 border-b bg-white shrink-0">
          <button
            onClick={() => onOpenAIStoryGenerator?.()}
            className="w-full py-2.5 px-4 rounded-lg bg-rose-500 text-white shadow hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">AI로 스토리 작성하기</span>
          </button>
        </div>

        <div className="border-b bg-white shrink-0">
          <TabsList className="w-full h-auto p-2 bg-gray-50 rounded-none grid grid-cols-4 gap-2">
            <TabsTrigger
              value="design"
              className="flex flex-col items-center gap-1 py-2.5 px-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
            >
              <Palette className="w-4 h-4" />
              <span>디자인</span>
            </TabsTrigger>
            <TabsTrigger
              value="required"
              className="flex flex-col items-center gap-1 py-2.5 px-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
            >
              <FileText className="w-4 h-4" />
              <span>필수입력</span>
            </TabsTrigger>
            <TabsTrigger
              value="story"
              className="flex flex-col items-center gap-1 py-2.5 px-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
            >
              <Heart className="w-4 h-4" />
              <span>스토리</span>
            </TabsTrigger>
            <TabsTrigger
              value="extras"
              className="flex flex-col items-center gap-1 py-2.5 px-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
            >
              <Settings className="w-4 h-4" />
              <span>추가기능</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="px-3 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2 shrink-0">
            <span className="text-red-500 text-lg">⚠</span>
            <p className="text-xs text-red-600 font-medium flex-1">{validationError.message}</p>
            <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
          </div>
        )}

        {/* ========== A. 디자인 설정 탭 ========== */}
        <TabsContent value="design" className="flex-1 overflow-y-auto mt-0 min-h-0">
          <SectionGroupHeader
            title="디자인 설정"
            description="청첩장의 전체적인 분위기를 설정해요"
            isAllOpen={designAccordion.length === designItems.length}
            onToggleAll={toggleDesignAll}
          />
          <Accordion type="multiple" value={designAccordion} onValueChange={handleDesignAccordionChange} className="px-4">

        {/* 색상 테마 */}
        <AccordionItem value="design-theme">
          <AccordionTrigger className="text-base font-medium">🎨 색상 테마</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {colorThemeOptions.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateField('colorTheme', theme.id as typeof invitation.colorTheme)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    invitation.colorTheme === theme.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    {theme.colors.map((color, i) => (
                      <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-left">{theme.name}</p>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 폰트 스타일 */}
        <AccordionItem value="design-font">
          <AccordionTrigger className="text-base font-medium">✒️ 폰트 스타일</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              {fontStyleOptions.map((font) => (
                <button
                  key={font.id}
                  onClick={() => updateField('fontStyle', font.id as typeof invitation.fontStyle)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    invitation.fontStyle === font.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium">{font.name}</p>
                  <p className="text-xs text-gray-500">{font.desc}</p>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 인트로(애니메이션,커버이미지) */}
        <AccordionItem value="design-animation">
          <AccordionTrigger className="text-base font-medium">✨ 인트로(애니메이션,커버이미지)</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-gray-500">
              첫 화면에서 1회 재생되는 인트로 애니메이션을 선택하고 커스터마이징할 수 있어요.
              <span className="block mt-1 text-primary/80">💡 인트로에 커버 이미지가 사용되므로 먼저 커버 이미지를 설정해주세요.</span>
            </p>

            {/* 현재 선택된 프리셋 표시 */}
            {invitation.intro && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {getPresetById(invitation.intro.presetId)?.name || '영화처럼'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {getPresetById(invitation.intro.presetId)?.description || ''}
                </p>
                {invitation.intro.mainTitle && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    &ldquo;{invitation.intro.mainTitle}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* 인트로 설정 페이지로 이동 버튼 */}
            <button
              onClick={onOpenIntroSelector}
              className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">인트로 스타일 설정</p>
                  <p className="text-xs text-gray-500">13가지 스타일 중 선택 & 커스터마이징</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </AccordionContent>
        </AccordionItem>

        {/* 배경음악 */}
        <AccordionItem value="design-bgm">
          <AccordionTrigger className="text-base font-medium">🎵 배경음악</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
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
                checked={invitation.bgm.enabled}
                onCheckedChange={(checked) => {
                  updateNestedField('bgm.enabled', checked)
                  // 비활성화 시 미리듣기 중지
                  if (!checked && bgmAudioRef.current) {
                    bgmAudioRef.current.pause()
                    setPreviewingBgmId(null)
                  }
                }}
              />
            </div>

            {invitation.bgm.enabled && (
              <>
                {/* BGM 프리셋 리스트 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">음악 선택</Label>
                  <div className="space-y-2">
                    {bgmPresets.map((preset) => {
                      const isSelected = !isCustomBgm && invitation.bgm.url === preset.url
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
                            updateNestedField('bgm.url', preset.url)
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
                                  // 다른 미리듣기 중지
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
                        // 프리셋 URL이 아닌 경우 유지, 프리셋 URL인 경우 초기화
                        const isPresetUrl = bgmPresets.some(p => p.url === invitation.bgm.url)
                        if (isPresetUrl) {
                          updateNestedField('bgm.url', '')
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
                      value={invitation.bgm.url}
                      onChange={(e) => updateNestedField('bgm.url', e.target.value)}
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
                    checked={invitation.bgm.autoplay}
                    onCheckedChange={(checked) => updateNestedField('bgm.autoplay', checked)}
                  />
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 풀하이트 디바이더 섹션 - FAMILY 템플릿에서만 동적 로드 */}
        {(templateId === 'narrative-family' || invitation?.templateId === 'narrative-family') && (
          <Suspense fallback={<div className="p-4 text-sm text-gray-400">로딩중...</div>}>
            <DividerSectionEditor
              uploadingImages={uploadingImages}
              setUploadingImages={setUploadingImages}
              handleImageUpload={handleImageUpload}
            />
          </Suspense>
        )}

        {/* 표지 제목 */}
        <AccordionItem value="design-cover">
          <AccordionTrigger className="text-base font-medium">📝 표지 제목</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-1.5">
              <FieldLabel fieldKey="design.coverTitle" />
              <Input
                value={invitation.design.coverTitle}
                onChange={(e) => updateNestedField('design.coverTitle', e.target.value)}
                placeholder={fieldHelpers['design.coverTitle']?.example}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 카카오 공유 설정 */}
        <AccordionItem value="design-kakao">
          <AccordionTrigger className="text-base font-medium">💬 공유 미리보기 설정</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <p className="text-xs text-gray-500">
              카카오톡, 문자 등으로 청첩장을 공유할 때 표시되는 정보입니다.
            </p>

            {/* 커스텀 제목 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">공유 제목</Label>
              <Input
                value={invitation.meta.title}
                onChange={(e) => updateNestedField('meta.title', e.target.value)}
                placeholder={`${invitation.groom.name || '신랑'} ♥ ${invitation.bride.name || '신부'} 결혼합니다`}
                className="text-sm"
              />
              <p className="text-[11px] text-gray-400">비워두면 자동 생성됩니다.</p>
            </div>

            {/* 커스텀 설명 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">공유 설명</Label>
              <Input
                value={invitation.meta.description}
                onChange={(e) => updateNestedField('meta.description', e.target.value)}
                placeholder="2025년 3월 15일 토요일 오후 2시"
                className="text-sm"
              />
              <p className="text-[11px] text-gray-400">비워두면 결혼식 날짜가 표시됩니다.</p>
            </div>

            {/* 카카오톡 공유 썸네일 이미지 */}
            <div className="space-y-2 pt-3 border-t">
              <Label className="text-xs font-medium">카카오톡 공유 썸네일</Label>
              <p className="text-xs text-gray-500">권장 사이즈: 600 x 800px (3:4 세로 비율)</p>
            </div>

            {/* 썸네일 미리보기 및 업로드 */}
            <div className="space-y-3">
              {invitation.meta.kakaoThumbnail ? (
                <div className="relative max-w-[200px]">
                  <div
                    className="w-full aspect-[3/4] rounded-lg bg-cover bg-center border border-gray-200"
                    style={{ backgroundImage: `url(${invitation.meta.kakaoThumbnail})` }}
                  />
                  <button
                    type="button"
                    onClick={() => updateNestedField('meta.kakaoThumbnail', '')}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center max-w-[200px] aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 relative">
                  <div className="flex flex-col items-center justify-center p-4">
                    <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
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
                        handleImageUpload(file, 'kakao-thumbnail', (url) => updateNestedField('meta.kakaoThumbnail', url))
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
              * 카카오톡 공유 시 표시되는 이미지입니다. 미설정 시 표지 이미지가 사용됩니다.
            </p>

            {/* 링크 공유 썸네일 이미지 (OG Image) */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-xs font-medium">링크 공유 썸네일</Label>
              <p className="text-xs text-gray-500">권장 사이즈: 1200 x 630px (가로 비율)</p>
              <p className="text-xs text-gray-400">문자, SNS 등 일반 링크 공유 시 표시됩니다.</p>
            </div>

            {/* OG 이미지 미리보기 및 업로드 */}
            <div className="space-y-3">
              {invitation.meta.ogImage ? (
                <div className="max-w-[300px] space-y-2">
                  <InlineCropEditor
                    imageUrl={invitation.meta.ogImage}
                    settings={invitation.meta.ogImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                    onUpdate={(s) => {
                      const current = invitation.meta.ogImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }
                      updateNestedField('meta.ogImageSettings', { ...current, ...s })
                    }}
                    aspectRatio={1200 / 630}
                    containerWidth={300}
                    colorClass="gray"
                  />
                  <div className="flex gap-2">
                    <label className="flex-1 text-center text-xs py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                      이미지 교체
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file, 'og-image', (url) => {
                              updateNestedField('meta.ogImage', url)
                              updateNestedField('meta.ogImageSettings', { scale: 1.0, positionX: 0, positionY: 0 })
                            })
                            e.target.value = ''
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateNestedField('meta.ogImage', '')
                        updateNestedField('meta.ogImageSettings', undefined)
                      }}
                      className="text-xs py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center max-w-[300px] aspect-[1200/630] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 relative">
                  <div className="flex flex-col items-center justify-center p-4">
                    <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-gray-500 text-center">클릭하여 업로드</p>
                    <p className="text-xs text-gray-400 mt-1">1200 x 630px</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file, 'og-image', (url) => updateNestedField('meta.ogImage', url))
                        e.target.value = ''
                      }
                    }}
                  />
                  {uploadingImages.has('og-image') && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  )}
                </label>
              )}
            </div>

            <p className="text-xs text-gray-400">
              * 문자/SNS 링크 공유 시 표시되는 이미지입니다. 미설정 시 카카오 썸네일 또는 표지 이미지가 사용됩니다.
            </p>
          </AccordionContent>
        </AccordionItem>

          </Accordion>
        </TabsContent>

        {/* ========== B. 필수 입력 탭 ========== */}
        <TabsContent value="required" className="flex-1 overflow-y-auto mt-0 min-h-0">
          <SectionGroupHeader
            title="필수 입력"
            description="청첩장에 꼭 필요한 정보들이에요"
            isAllOpen={requiredAccordion.length === requiredItems.length}
            onToggleAll={toggleRequiredAll}
          />
          <Accordion type="multiple" value={requiredAccordion} onValueChange={handleRequiredAccordionChange} className="px-4">

        {/* 신랑신부 기본정보 */}
        <AccordionItem value="couple-basic">
          <AccordionTrigger className="text-base font-medium">👫 신랑신부 기본정보</AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {/* 신랑 */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">신랑</p>
              {/* family 템플릿: 성/이름 분리 */}
              {(templateId === 'narrative-family' || invitation?.templateId === 'narrative-family') ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">성</Label>
                    <Input
                      value={invitation.groom.lastName || ''}
                      onChange={(e) => {
                        const lastName = e.target.value
                        const firstName = invitation.groom.firstName || ''
                        // 단일 업데이트로 리렌더링 최소화
                        updateField('groom', {
                          ...invitation.groom,
                          lastName,
                          name: lastName + firstName
                        })
                      }}
                      placeholder="김"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">이름</Label>
                    <Input
                      value={invitation.groom.firstName || ''}
                      onChange={(e) => {
                        const firstName = e.target.value
                        const lastName = invitation.groom.lastName || ''
                        // 단일 업데이트로 리렌더링 최소화
                        updateField('groom', {
                          ...invitation.groom,
                          firstName,
                          name: lastName + firstName
                        })
                      }}
                      placeholder="철수"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="groom.name" />
                  <Input
                    value={invitation.groom.name}
                    onChange={(e) => updateNestedField('groom.name', e.target.value)}
                    placeholder={fieldHelpers['groom.name']?.example}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <FieldLabel fieldKey="groom.phone" />
                <Input
                  value={invitation.groom.phone}
                  onChange={(e) => handlePhoneChange('groom.phone', e.target.value)}
                  placeholder={fieldHelpers['groom.phone']?.example}
                />
              </div>
            </div>

            {/* 신부 */}
            <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-semibold text-pink-800">신부</p>
              {/* family 템플릿: 성/이름 분리 */}
              {(templateId === 'narrative-family' || invitation?.templateId === 'narrative-family') ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">성</Label>
                    <Input
                      value={invitation.bride.lastName || ''}
                      onChange={(e) => {
                        const lastName = e.target.value
                        const firstName = invitation.bride.firstName || ''
                        // 단일 업데이트로 리렌더링 최소화
                        updateField('bride', {
                          ...invitation.bride,
                          lastName,
                          name: lastName + firstName
                        })
                      }}
                      placeholder="이"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">이름</Label>
                    <Input
                      value={invitation.bride.firstName || ''}
                      onChange={(e) => {
                        const firstName = e.target.value
                        const lastName = invitation.bride.lastName || ''
                        // 단일 업데이트로 리렌더링 최소화
                        updateField('bride', {
                          ...invitation.bride,
                          firstName,
                          name: lastName + firstName
                        })
                      }}
                      placeholder="영희"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="bride.name" />
                  <Input
                    value={invitation.bride.name}
                    onChange={(e) => updateNestedField('bride.name', e.target.value)}
                    placeholder={fieldHelpers['bride.name']?.example}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <FieldLabel fieldKey="bride.phone" />
                <Input
                  value={invitation.bride.phone}
                  onChange={(e) => handlePhoneChange('bride.phone', e.target.value)}
                  placeholder={fieldHelpers['bride.phone']?.example}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 가족 정보 */}
        <AccordionItem value="family">
          <AccordionTrigger className="text-base font-medium">👨‍👩‍👧‍👦 가족 정보</AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {/* 안내 문구 */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                연락처는 선택 입력이에요. 입력하면 하단 버튼의 "안내정보 → 연락처"와 "축하 전하기"에 표시돼요.
              </p>
            </div>

            {/* 고인 표시 스타일 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">고인 표시 스타일</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField('deceasedDisplayStyle', 'hanja')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    invitation.deceasedDisplayStyle === 'hanja'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">故</span>
                  <span className="text-xs text-gray-600">한자</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('deceasedDisplayStyle', 'flower')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    invitation.deceasedDisplayStyle === 'flower'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src="/icons/chrysanthemum.svg" alt="국화" className="w-5 h-5" />
                  <span className="text-xs text-gray-600">국화꽃</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">고인으로 표시된 부모님 앞에 표시됩니다</p>
            </div>

            {/* 신랑측 */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">신랑측</p>
              {/* 아버지 */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="groom.father.name" />
                  <Input
                    value={invitation.groom.father.name}
                    onChange={(e) => updateNestedField('groom.father.name', e.target.value)}
                    placeholder={fieldHelpers['groom.father.name']?.example}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">아버지 연락처 (선택)</Label>
                  <Input
                    value={invitation.groom.father.phone}
                    onChange={(e) => handlePhoneChange('groom.father.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={invitation.groom.father.deceased || false}
                  onCheckedChange={(checked) => updateNestedField('groom.father.deceased', checked)}
                />
                <span className="text-xs text-gray-500">아버지 고인</span>
              </div>
              {/* 어머니 */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="groom.mother.name" />
                  <Input
                    value={invitation.groom.mother.name}
                    onChange={(e) => updateNestedField('groom.mother.name', e.target.value)}
                    placeholder={fieldHelpers['groom.mother.name']?.example}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">어머니 연락처 (선택)</Label>
                  <Input
                    value={invitation.groom.mother.phone}
                    onChange={(e) => handlePhoneChange('groom.mother.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={invitation.groom.mother.deceased || false}
                  onCheckedChange={(checked) => updateNestedField('groom.mother.deceased', checked)}
                />
                <span className="text-xs text-gray-500">어머니 고인</span>
              </div>
            </div>

            {/* 신부측 */}
            <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-semibold text-pink-800">신부측</p>
              {/* 아버지 */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="bride.father.name" />
                  <Input
                    value={invitation.bride.father.name}
                    onChange={(e) => updateNestedField('bride.father.name', e.target.value)}
                    placeholder={fieldHelpers['bride.father.name']?.example}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">아버지 연락처 (선택)</Label>
                  <Input
                    value={invitation.bride.father.phone}
                    onChange={(e) => handlePhoneChange('bride.father.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={invitation.bride.father.deceased || false}
                  onCheckedChange={(checked) => updateNestedField('bride.father.deceased', checked)}
                />
                <span className="text-xs text-gray-500">아버지 고인</span>
              </div>
              {/* 어머니 */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="bride.mother.name" />
                  <Input
                    value={invitation.bride.mother.name}
                    onChange={(e) => updateNestedField('bride.mother.name', e.target.value)}
                    placeholder={fieldHelpers['bride.mother.name']?.example}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">어머니 연락처 (선택)</Label>
                  <Input
                    value={invitation.bride.mother.phone}
                    onChange={(e) => handlePhoneChange('bride.mother.phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={invitation.bride.mother.deceased || false}
                  onCheckedChange={(checked) => updateNestedField('bride.mother.deceased', checked)}
                />
                <span className="text-xs text-gray-500">어머니 고인</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 인사말 */}
        <AccordionItem value="greeting">
          <AccordionTrigger className="text-base font-medium">✉️ 인사말</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-1.5">
              <FieldLabel fieldKey="content.greeting" aiEnabled />
              <HighlightTextarea
                value={invitation.content.greeting}
                onChange={(value) => updateNestedField('content.greeting', value)}
                placeholder={fieldHelpers['content.greeting']?.example}
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">명언 (선택)</p>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="content.quote.text">명언/문구</FieldLabel>
                <Textarea
                  value={invitation.content.quote.text}
                  onChange={(e) => updateNestedField('content.quote.text', e.target.value)}
                  placeholder={fieldHelpers['content.quote.text']?.example}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="content.quote.author">출처</FieldLabel>
                <Input
                  value={invitation.content.quote.author}
                  onChange={(e) => updateNestedField('content.quote.author', e.target.value)}
                  placeholder={fieldHelpers['content.quote.author']?.example}
                />
              </div>
            </div>

            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">감사 인사</p>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="content.thankYou.message" aiEnabled>감사 메시지</FieldLabel>
                <Textarea
                  value={invitation.content.thankYou.message}
                  onChange={(e) => updateNestedField('content.thankYou.message', e.target.value)}
                  placeholder={fieldHelpers['content.thankYou.message']?.example}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="content.thankYou.sign">서명</FieldLabel>
                <Input
                  value={invitation.content.thankYou.sign}
                  onChange={(e) => updateNestedField('content.thankYou.sign', e.target.value)}
                  placeholder={fieldHelpers['content.thankYou.sign']?.example}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 결혼식 정보 */}
        <AccordionItem value="wedding">
          <AccordionTrigger className="text-base font-medium">💒 결혼식 정보</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel fieldKey="wedding.date" />
                <Input
                  type="date"
                  value={invitation.wedding.date}
                  onChange={(e) => updateNestedField('wedding.date', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="wedding.time" />
                <Input
                  type="time"
                  value={invitation.wedding.time}
                  onChange={(e) => updateNestedField('wedding.time', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <FieldLabel fieldKey="wedding.timeDisplay" />
                <Input
                  value={invitation.wedding.timeDisplay}
                  onChange={(e) => updateNestedField('wedding.timeDisplay', e.target.value)}
                  placeholder={fieldHelpers['wedding.timeDisplay']?.example}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">요일</Label>
                <Input
                  value={invitation.wedding.dayOfWeek}
                  onChange={(e) => updateNestedField('wedding.dayOfWeek', e.target.value)}
                  placeholder="토요일"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel fieldKey="wedding.venue.name" />
              <Input
                value={invitation.wedding.venue.name}
                onChange={(e) => updateNestedField('wedding.venue.name', e.target.value)}
                placeholder={fieldHelpers['wedding.venue.name']?.example}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel fieldKey="wedding.venue.hall" />
              <Input
                value={invitation.wedding.venue.hall}
                onChange={(e) => updateNestedField('wedding.venue.hall', e.target.value)}
                placeholder={fieldHelpers['wedding.venue.hall']?.example}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel fieldKey="wedding.venue.address" />
              <Input
                value={invitation.wedding.venue.address}
                onChange={(e) => updateNestedField('wedding.venue.address', e.target.value)}
                placeholder={fieldHelpers['wedding.venue.address']?.example}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 오시는 길 */}
        <AccordionItem value="directions">
          <AccordionTrigger className="text-base font-medium">🚗 오시는 길</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            {/* 자가용 (경로 + 주차 통합) */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">🚙 자가용</p>
              <Textarea
                value={invitation.wedding.directions.car || ''}
                onChange={(e) => updateNestedField('wedding.directions.car', e.target.value)}
                placeholder="네비게이션: 더채플앳청담 또는 서울시 강남구 삼성로 614&#10;주차: 건물 내 지하주차장 이용 (2시간 무료)"
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-[10px] text-gray-400">경로 안내와 주차 정보를 함께 입력해주세요</p>
            </div>

            {/* 버스/지하철 (통합) */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">🚇 버스/지하철</p>
              <Textarea
                value={invitation.wedding.directions.publicTransport || ''}
                onChange={(e) => updateNestedField('wedding.directions.publicTransport', e.target.value)}
                placeholder="[지하철]&#10;2호선 삼성역 5번 출구 도보 5분&#10;9호선 봉은사역 1번 출구 도보 8분&#10;&#10;[버스]&#10;간선: 146, 341, 360&#10;지선: 3412, 4412"
                rows={6}
                className="resize-none text-sm"
              />
              <p className="text-[10px] text-gray-400">지하철, 버스 정보를 함께 입력해주세요</p>
            </div>

            {/* 기차역 (선택) */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">🚄 기차역 <span className="text-[10px] font-normal text-gray-400">(선택)</span></p>
              <Textarea
                value={invitation.wedding.directions.train || ''}
                onChange={(e) => updateNestedField('wedding.directions.train', e.target.value)}
                placeholder="KTX/SRT 수서역 하차 → 3호선 환승 → 압구정역 하차"
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* 고속버스 (선택) */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-700">🚌 고속버스 <span className="text-[10px] font-normal text-gray-400">(선택)</span></p>
              <Textarea
                value={invitation.wedding.directions.expressBus || ''}
                onChange={(e) => updateNestedField('wedding.directions.expressBus', e.target.value)}
                placeholder="센트럴시티터미널(고속) 하차 → 3호선 환승 → 압구정역 하차"
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 갤러리 */}
        <AccordionItem value="gallery">
          <AccordionTrigger className="text-base font-medium">🖼️ 갤러리</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <FieldLabel fieldKey="gallery.images">갤러리 이미지 (최대 6장)</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5].map((imgIndex) => {
                  const imageUrl = invitation.gallery.images?.[imgIndex]
                  const imgSettings = invitation.gallery.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                  return (
                    <div key={imgIndex} className="relative">
                      {imageUrl ? (
                        <div className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border border-purple-200">
                            <div
                              className="w-full h-full bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${imageUrl})`,
                                transform: `scale(${imgSettings.scale}) translate(${imgSettings.positionX}%, ${imgSettings.positionY}%)`,
                              }}
                            />
                          </div>
                          <button
                            onClick={() => removeGalleryImage(imgIndex)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className={`aspect-square border-2 border-dashed border-purple-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors bg-white/50 ${uploadingImages.has(`gallery-${imgIndex}`) ? 'opacity-50' : ''}`}>
                          {uploadingImages.has(`gallery-${imgIndex}`) ? (
                            <>
                              <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                              <span className="text-[10px] text-purple-400 mt-1">업로드중...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-[10px] text-purple-400 mt-1">추가</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingImages.has(`gallery-${imgIndex}`)}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, `gallery-${imgIndex}`, addGalleryImage)
                                e.target.value = ''
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>

              {invitation.gallery.images?.length > 0 && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg space-y-4">
                  <p className="text-[10px] font-medium text-purple-700">이미지 크롭 조정</p>
                  {invitation.gallery.images.map((imageUrl, imgIndex) => {
                    const settings = invitation.gallery.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                    return (
                      <div key={imgIndex} className="space-y-2 pb-3 border-b border-purple-100 last:border-0 last:pb-0">
                        <p className="text-[9px] text-purple-600">사진 {imgIndex + 1}</p>
                        <InlineCropEditor
                          imageUrl={imageUrl}
                          settings={settings}
                          onUpdate={(s) => updateGalleryImageSettings(imgIndex, s)}
                          aspectRatio={1}
                          containerWidth={180}
                          colorClass="purple"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* ========== C. 스토리 탭 ========== */}
        <TabsContent value="story" className="flex-1 overflow-y-auto mt-0 min-h-0">
          <SectionGroupHeader
            title="스토리 (선택)"
            description="두 사람의 이야기를 담아보세요. 켜고 끌 수 있어요."
            isAllOpen={storyAccordion.length === storyItems.length}
            onToggleAll={toggleStoryAll}
          />
          <Accordion type="multiple" value={storyAccordion} onValueChange={handleStoryAccordionChange} className="px-4">

        {/* 부모님 소개 - FAMILY 템플릿에서만 표시 */}
        {(templateId === 'narrative-family' || invitation?.templateId === 'narrative-family') && (
          <Suspense fallback={<div className="p-4 text-sm text-gray-400">로딩중...</div>}>
            <ParentIntroEditor
              uploadingImages={uploadingImages}
              handleImageUpload={handleImageUpload}
            />
          </Suspense>
        )}

        {/* 서로를 선택한 이유 - FAMILY 템플릿에서만 표시 */}
        {(templateId === 'narrative-family' || invitation?.templateId === 'narrative-family') && (
          <Suspense fallback={<div className="p-4 text-sm text-gray-400">로딩중...</div>}>
            <WhyWeChoseEditor />
          </Suspense>
        )}

        {/* 커플 소개 - OUR 템플릿에서만 표시 (FAMILY 템플릿에서는 숨김) */}
        {templateId !== 'narrative-family' && invitation?.templateId !== 'narrative-family' && (
        <AccordionItem value="profile">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center justify-between w-full mr-2">
              <span>💑 커플 소개</span>
              <Switch
                checked={invitation.sectionVisibility.coupleProfile}
                onCheckedChange={() => toggleSectionVisibility('coupleProfile')}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className={`space-y-6 pb-4 ${!invitation.sectionVisibility.coupleProfile ? 'opacity-50' : ''}`}>
            {!invitation.sectionVisibility.coupleProfile && (
              <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">이 섹션은 현재 비공개 상태예요. 토글을 켜면 청첩장에 표시됩니다.</p>
            )}

            {/* 신랑 소개 */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800">신랑 소개 (신부가 작성)</p>

              <div className="space-y-2">
                <Label className="text-xs">프로필 사진 (1~3장)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((imgIndex) => {
                    const imageUrl = invitation.groom.profile.images?.[imgIndex]
                    const imgSettings = invitation.groom.profile.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                    return (
                      <div key={imgIndex} className="relative">
                        {imageUrl ? (
                          <div className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-blue-200">
                              <div
                                className="w-full h-full bg-cover bg-center"
                                style={{
                                  backgroundImage: `url(${imageUrl})`,
                                  transform: `scale(${imgSettings.scale}) translate(${imgSettings.positionX}%, ${imgSettings.positionY}%)`,
                                }}
                              />
                            </div>
                            <button
                              onClick={() => removeProfileImage('groom', imgIndex)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className={`aspect-square border-2 border-dashed border-blue-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors bg-white/50 ${uploadingImages.has(`groom-profile-${imgIndex}`) ? 'opacity-50' : ''}`}>
                            {uploadingImages.has(`groom-profile-${imgIndex}`) ? (
                              <>
                                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                                <span className="text-[10px] text-blue-400 mt-1">업로드중...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-[10px] text-blue-400 mt-1">추가</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              disabled={uploadingImages.has(`groom-profile-${imgIndex}`)}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleImageUpload(file, `groom-profile-${imgIndex}`, (url) => addProfileImage('groom', url))
                                  e.target.value = ''
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>

                {invitation.groom.profile.images?.length > 0 && (
                  <div className="mt-3 p-3 bg-white/70 rounded-lg space-y-4">
                    <p className="text-[10px] font-medium text-blue-700">이미지 크롭 조정</p>
                    {invitation.groom.profile.images.map((imageUrl, imgIndex) => {
                      const settings = invitation.groom.profile.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                      return (
                        <div key={imgIndex} className="space-y-2 pb-3 border-b border-blue-100 last:border-0 last:pb-0">
                          <p className="text-[9px] text-blue-600">사진 {imgIndex + 1}</p>
                          <InlineCropEditor
                            imageUrl={imageUrl}
                            settings={settings}
                            onUpdate={(s) => updateProfileImageSettings('groom', imgIndex, s)}
                            aspectRatio={4/5}
                            containerWidth={180}
                            colorClass="blue"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel fieldKey="groom.profile.aboutLabel">소개 라벨</FieldLabel>
                <Input
                  value={invitation.groom.profile.aboutLabel}
                  onChange={(e) => updateNestedField('groom.profile.aboutLabel', e.target.value)}
                  placeholder={fieldHelpers['groom.profile.aboutLabel']?.example}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="groom.profile.subtitle">서브타이틀</FieldLabel>
                <Input
                  value={invitation.groom.profile.subtitle}
                  onChange={(e) => updateNestedField('groom.profile.subtitle', e.target.value)}
                  placeholder={fieldHelpers['groom.profile.subtitle']?.example}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="groom.profile.intro" aiEnabled>소개글</FieldLabel>
                <TextStyleControls
                  lineHeight={invitation.profileTextStyle?.lineHeight}
                  textAlign={invitation.profileTextStyle?.textAlign}
                  onLineHeightChange={(v) => updateNestedField('profileTextStyle', { ...invitation.profileTextStyle, lineHeight: v })}
                  onTextAlignChange={(v) => updateNestedField('profileTextStyle', { ...invitation.profileTextStyle, textAlign: v })}
                />
                <HighlightTextarea
                  value={invitation.groom.profile.intro}
                  onChange={(value) => updateNestedField('groom.profile.intro', value)}
                  placeholder={fieldHelpers['groom.profile.intro']?.example}
                  rows={6}
                  className="resize-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="groom.profile.tag">태그</FieldLabel>
                <Input
                  value={invitation.groom.profile.tag}
                  onChange={(e) => updateNestedField('groom.profile.tag', e.target.value)}
                  placeholder={fieldHelpers['groom.profile.tag']?.example}
                />
              </div>
            </div>

            {/* 신부 소개 */}
            <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-semibold text-pink-800">신부 소개 (신랑이 작성)</p>

              <div className="space-y-2">
                <Label className="text-xs">프로필 사진 (1~3장)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((imgIndex) => {
                    const imageUrl = invitation.bride.profile.images?.[imgIndex]
                    const imgSettings = invitation.bride.profile.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                    return (
                      <div key={imgIndex} className="relative">
                        {imageUrl ? (
                          <div className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-pink-200">
                              <div
                                className="w-full h-full bg-cover bg-center"
                                style={{
                                  backgroundImage: `url(${imageUrl})`,
                                  transform: `scale(${imgSettings.scale}) translate(${imgSettings.positionX}%, ${imgSettings.positionY}%)`,
                                }}
                              />
                            </div>
                            <button
                              onClick={() => removeProfileImage('bride', imgIndex)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className={`aspect-square border-2 border-dashed border-pink-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 transition-colors bg-white/50 ${uploadingImages.has(`bride-profile-${imgIndex}`) ? 'opacity-50' : ''}`}>
                            {uploadingImages.has(`bride-profile-${imgIndex}`) ? (
                              <>
                                <div className="w-5 h-5 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
                                <span className="text-[10px] text-pink-400 mt-1">업로드중...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-[10px] text-pink-400 mt-1">추가</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              disabled={uploadingImages.has(`bride-profile-${imgIndex}`)}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleImageUpload(file, `bride-profile-${imgIndex}`, (url) => addProfileImage('bride', url))
                                  e.target.value = ''
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>

                {invitation.bride.profile.images?.length > 0 && (
                  <div className="mt-3 p-3 bg-white/70 rounded-lg space-y-4">
                    <p className="text-[10px] font-medium text-pink-700">이미지 크롭 조정</p>
                    {invitation.bride.profile.images.map((imageUrl, imgIndex) => {
                      const settings = invitation.bride.profile.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                      return (
                        <div key={imgIndex} className="space-y-2 pb-3 border-b border-pink-100 last:border-0 last:pb-0">
                          <p className="text-[9px] text-pink-600">사진 {imgIndex + 1}</p>
                          <InlineCropEditor
                            imageUrl={imageUrl}
                            settings={settings}
                            onUpdate={(s) => updateProfileImageSettings('bride', imgIndex, s)}
                            aspectRatio={4/5}
                            containerWidth={180}
                            colorClass="pink"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel fieldKey="bride.profile.aboutLabel">소개 라벨</FieldLabel>
                <Input
                  value={invitation.bride.profile.aboutLabel}
                  onChange={(e) => updateNestedField('bride.profile.aboutLabel', e.target.value)}
                  placeholder={fieldHelpers['bride.profile.aboutLabel']?.example}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="bride.profile.subtitle">서브타이틀</FieldLabel>
                <Input
                  value={invitation.bride.profile.subtitle}
                  onChange={(e) => updateNestedField('bride.profile.subtitle', e.target.value)}
                  placeholder={fieldHelpers['bride.profile.subtitle']?.example}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="bride.profile.intro" aiEnabled>소개글</FieldLabel>
                <TextStyleControls
                  lineHeight={invitation.profileTextStyle?.lineHeight}
                  textAlign={invitation.profileTextStyle?.textAlign}
                  onLineHeightChange={(v) => updateNestedField('profileTextStyle', { ...invitation.profileTextStyle, lineHeight: v })}
                  onTextAlignChange={(v) => updateNestedField('profileTextStyle', { ...invitation.profileTextStyle, textAlign: v })}
                />
                <HighlightTextarea
                  value={invitation.bride.profile.intro}
                  onChange={(value) => updateNestedField('bride.profile.intro', value)}
                  placeholder={fieldHelpers['bride.profile.intro']?.example}
                  rows={6}
                  className="resize-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel fieldKey="bride.profile.tag">태그</FieldLabel>
                <Input
                  value={invitation.bride.profile.tag}
                  onChange={(e) => updateNestedField('bride.profile.tag', e.target.value)}
                  placeholder={fieldHelpers['bride.profile.tag']?.example}
                />
              </div>
            </div>

          </AccordionContent>
        </AccordionItem>
        )}

        {/* 우리의 이야기 - OUR 템플릿에서만 표시 (FAMILY 템플릿에서는 숨김) */}
        {templateId !== 'narrative-family' && invitation?.templateId !== 'narrative-family' && (
        <AccordionItem value="stories">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center justify-between w-full mr-2">
              <span>💕 우리의 이야기</span>
              <Switch
                checked={invitation.sectionVisibility.ourStory}
                onCheckedChange={() => toggleSectionVisibility('ourStory')}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className={`space-y-4 pb-4 ${!invitation.sectionVisibility.ourStory ? 'opacity-50' : ''}`}>
            {!invitation.sectionVisibility.ourStory && (
              <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">이 섹션은 현재 비공개 상태예요.</p>
            )}

            <div className="space-y-1.5">
              <FieldLabel fieldKey="relationship.startDate" />
              <Input
                type="date"
                value={invitation.relationship.startDate}
                onChange={(e) => updateNestedField('relationship.startDate', e.target.value)}
              />
            </div>

            {invitation.relationship.stories.map((story, index) => (
              <div key={index} className="space-y-3 p-4 bg-rose-50 rounded-lg relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-rose-800">스토리 {index + 1}</p>
                  {invitation.relationship.stories.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStory(index)}
                      className="text-rose-500 hover:text-rose-700 h-6 px-2"
                    >
                      삭제
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="relationship.stories[].date">날짜/기간</FieldLabel>
                  <Input
                    value={story.date}
                    onChange={(e) => updateStoryField(index, 'date', e.target.value)}
                    placeholder={fieldHelpers['relationship.stories[].date']?.example}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="relationship.stories[].title">제목</FieldLabel>
                  <Input
                    value={story.title}
                    onChange={(e) => updateStoryField(index, 'title', e.target.value)}
                    placeholder={fieldHelpers['relationship.stories[].title']?.example}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="relationship.stories[].desc" aiEnabled>내용</FieldLabel>
                  <HighlightTextarea
                    value={story.desc}
                    onChange={(value) => updateStoryField(index, 'desc', value)}
                    placeholder={fieldHelpers['relationship.stories[].desc']?.example}
                    rows={4}
                    className="resize-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">사진 (1~3장)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((imgIndex) => {
                      const imageUrl = story.images?.[imgIndex]
                      const imgSettings = story.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                      return (
                        <div key={imgIndex} className="relative">
                          {imageUrl ? (
                            <div className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border border-rose-200">
                                <div
                                  className="w-full h-full bg-cover bg-center"
                                  style={{
                                    backgroundImage: `url(${imageUrl})`,
                                    transform: `scale(${imgSettings.scale}) translate(${imgSettings.positionX}%, ${imgSettings.positionY}%)`,
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => removeStoryImage(index, imgIndex)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <label className={`aspect-square border-2 border-dashed border-rose-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 transition-colors bg-white/50 ${uploadingImages.has(`story-${index}-${imgIndex}`) ? 'opacity-50' : ''}`}>
                              {uploadingImages.has(`story-${index}-${imgIndex}`) ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                                  <span className="text-[10px] text-rose-400 mt-1">업로드중...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span className="text-[10px] text-rose-400 mt-1">추가</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={uploadingImages.has(`story-${index}-${imgIndex}`)}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleImageUpload(file, `story-${index}-${imgIndex}`, (url) => addStoryImage(index, url))
                                    e.target.value = ''
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {story.images?.length > 0 && (
                    <div className="mt-3 p-3 bg-white/70 rounded-lg space-y-4">
                      <p className="text-[10px] font-medium text-rose-700">이미지 크롭 조정</p>
                      {story.images.map((imageUrl, imgIndex) => {
                        const settings = story.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                        return (
                          <div key={imgIndex} className="space-y-2 pb-3 border-b border-rose-100 last:border-0 last:pb-0">
                            <p className="text-[9px] text-rose-600">사진 {imgIndex + 1}</p>
                            <InlineCropEditor
                              imageUrl={imageUrl}
                              settings={settings}
                              onUpdate={(s) => updateStoryImageSettings(index, imgIndex, s)}
                              aspectRatio={1}
                              containerWidth={180}
                              colorClass="rose"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addStory}
              className="w-full border-dashed"
            >
              + 스토리 추가
            </Button>

            {/* 마무리 문구 */}
            <div className="space-y-1.5 p-3 bg-rose-50 rounded-lg">
              <FieldLabel fieldKey="relationship.closingText" />
              <Textarea
                value={invitation.relationship.closingText}
                onChange={(e) => updateNestedField('relationship.closingText', e.target.value)}
                placeholder={fieldHelpers['relationship.closingText']?.example}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        )}

        {/* 인터뷰 */}
        <AccordionItem value="interviews">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center justify-between w-full mr-2">
              <span>🎤 인터뷰</span>
              <Switch
                checked={invitation.sectionVisibility.interview}
                onCheckedChange={() => toggleSectionVisibility('interview')}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className={`space-y-4 pb-4 ${!invitation.sectionVisibility.interview ? 'opacity-50' : ''}`}>
            {!invitation.sectionVisibility.interview && (
              <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">이 섹션은 현재 비공개 상태예요.</p>
            )}

            {invitation.content.interviews.map((interview, index) => (
              <div key={index} className="space-y-3 p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-800">인터뷰 {index + 1}</p>
                  {invitation.content.interviews.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInterview(index)}
                      className="text-amber-600 hover:text-amber-800 h-6 px-2"
                    >
                      삭제
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">사진 (1~2장)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1].map((imgIndex) => {
                      const imageUrl = interview.images?.[imgIndex]
                      const imgSettings = interview.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                      return (
                        <div key={imgIndex} className="relative">
                          {imageUrl ? (
                            <div className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border border-amber-200">
                                <div
                                  className="w-full h-full bg-cover bg-center"
                                  style={{
                                    backgroundImage: `url(${imageUrl})`,
                                    transform: `scale(${imgSettings.scale}) translate(${imgSettings.positionX}%, ${imgSettings.positionY}%)`,
                                  }}
                                />
                              </div>
                              <button
                                onClick={() => removeInterviewImage(index, imgIndex)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <label className={`aspect-square border-2 border-dashed border-amber-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors bg-white/50 ${uploadingImages.has(`interview-${index}-${imgIndex}`) ? 'opacity-50' : ''}`}>
                              {uploadingImages.has(`interview-${index}-${imgIndex}`) ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                                  <span className="text-[10px] text-amber-400 mt-1">업로드중...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span className="text-[10px] text-amber-400 mt-1">추가</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={uploadingImages.has(`interview-${index}-${imgIndex}`)}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleImageUpload(file, `interview-${index}-${imgIndex}`, (url) => addInterviewImage(index, url))
                                    e.target.value = ''
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {interview.images?.length > 0 && (
                    <div className="mt-3 p-3 bg-white/70 rounded-lg space-y-4">
                      <p className="text-[10px] font-medium text-amber-700">이미지 크롭 조정</p>
                      {interview.images.map((imageUrl, imgIndex) => {
                        const settings = interview.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                        return (
                          <div key={imgIndex} className="space-y-2 pb-3 border-b border-amber-100 last:border-0 last:pb-0">
                            <p className="text-[9px] text-amber-600">사진 {imgIndex + 1}</p>
                            <InlineCropEditor
                              imageUrl={imageUrl}
                              settings={settings}
                              onUpdate={(s) => updateInterviewImageSettings(index, imgIndex, s)}
                              aspectRatio={4/5}
                              containerWidth={180}
                              colorClass="amber"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <FieldLabel fieldKey="content.interviews[].question">질문</FieldLabel>
                  <Input
                    value={interview.question}
                    onChange={(e) => updateInterviewField(index, 'question', e.target.value)}
                    placeholder={fieldHelpers['content.interviews[].question']?.example}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="content.interviews[].answer" aiEnabled>답변</FieldLabel>
                  <TextStyleControls
                    lineHeight={invitation.interviewTextStyle?.lineHeight}
                    textAlign={invitation.interviewTextStyle?.textAlign}
                    onLineHeightChange={(v) => updateNestedField('interviewTextStyle', { ...invitation.interviewTextStyle, lineHeight: v })}
                    onTextAlignChange={(v) => updateNestedField('interviewTextStyle', { ...invitation.interviewTextStyle, textAlign: v })}
                  />
                  <HighlightTextarea
                    value={interview.answer}
                    onChange={(value) => updateInterviewField(index, 'answer', value)}
                    placeholder={fieldHelpers['content.interviews[].answer']?.example}
                    rows={5}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addInterview}
              className="w-full border-dashed"
            >
              + 인터뷰 추가
            </Button>

          </AccordionContent>
        </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* ========== D. 추가 기능 탭 ========== */}
        <TabsContent value="extras" className="flex-1 overflow-y-auto mt-0 min-h-0">
          <SectionGroupHeader
            title="추가 기능 (선택)"
            description="필요한 기능만 켜서 사용하세요"
            isAllOpen={extrasAccordion.length === extrasItems.length}
            onToggleAll={toggleExtrasAll}
          />
          <Accordion type="multiple" value={extrasAccordion} onValueChange={handleExtrasAccordionChange} className="px-4 pb-10">

        {/* 안내 & 기타 설정 (통합) */}
        <AccordionItem value="guidance">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center justify-between w-full mr-2">
              <span>📋 안내 & 기타 설정</span>
              <Switch
                checked={invitation.sectionVisibility.guidance}
                onCheckedChange={() => toggleSectionVisibility('guidance')}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className={`space-y-4 pb-4 ${!invitation.sectionVisibility.guidance ? 'opacity-50' : ''}`}>
            {!invitation.sectionVisibility.guidance && (
              <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">이 섹션은 현재 비공개 상태예요.</p>
            )}

            {/* 행복한 시간을 위한 안내 */}
            <div className="space-y-3 p-4 bg-cyan-50 rounded-lg">
              <p className="text-sm font-semibold text-cyan-800">행복한 시간을 위한 안내</p>

              <div className="space-y-1.5">
                <FieldLabel fieldKey="guidance.title">제목</FieldLabel>
                <Input
                  value={invitation.guidance.title}
                  onChange={(e) => updateNestedField('guidance.title', e.target.value)}
                  placeholder={fieldHelpers['guidance.title']?.example}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">웨딩 사진 (필수)</Label>
                <ImageCropEditor
                  value={{
                    url: invitation.guidance.image || '',
                    cropX: invitation.guidance.imageSettings?.cropX || 0,
                    cropY: invitation.guidance.imageSettings?.cropY || 0,
                    cropWidth: invitation.guidance.imageSettings?.cropWidth || 1,
                    cropHeight: invitation.guidance.imageSettings?.cropHeight || 1,
                  }}
                  onChange={(data: CropData) => {
                    updateNestedField('guidance.image', data.url)
                    updateNestedField('guidance.imageSettings', {
                      ...invitation.guidance.imageSettings,
                      cropX: data.cropX,
                      cropY: data.cropY,
                      cropWidth: data.cropWidth,
                      cropHeight: data.cropHeight,
                    })
                  }}
                  aspectRatio={4/5}
                  containerWidth={240}
                  invitationId={invitationId || undefined}
                  label=""
                />
              </div>
            </div>

            {/* 안내 항목들 (드래그로 순서 변경 가능) */}
            <SortableList
              items={invitation.content.info.itemOrder || INFO_ITEMS_CONFIG.map(item => item.key)}
              onReorder={handleInfoItemReorder}
              renderDragOverlay={(activeId) => {
                const config = INFO_ITEMS_CONFIG.find(c => c.key === activeId)
                return config ? (
                  <div className="p-3 bg-gray-50">
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                ) : null
              }}
            >
              <div className="space-y-3">
                {(invitation.content.info.itemOrder || INFO_ITEMS_CONFIG.map(item => item.key)).map((itemKey) => {
                  const config = INFO_ITEMS_CONFIG.find(c => c.key === itemKey)
                  if (!config) return null

                  // 각 항목의 데이터 가져오기 (타입 안전하게)
                  const infoData = invitation.content.info[itemKey as keyof typeof invitation.content.info]
                  if (!infoData || typeof infoData !== 'object' || !('enabled' in infoData)) return null

                  return (
                    <SortableItem key={itemKey} id={itemKey}>
                      <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{config.label}</span>
                          <Switch
                            checked={infoData.enabled}
                            onCheckedChange={(checked) => updateNestedField(`content.info.${itemKey}.enabled`, checked)}
                          />
                        </div>

                        {/* 각 항목별 상세 입력 폼 */}
                        {infoData.enabled && (
                          <div className="space-y-2 pt-2">
                            {/* 기본 안내 내용 (모든 항목 공통) */}
                            <div className="space-y-1.5">
                              <FieldLabel fieldKey={`content.info.${itemKey}.content`}>안내 내용</FieldLabel>
                              <Textarea
                                value={'content' in infoData ? (infoData.content as string) || '' : ''}
                                onChange={(e) => updateNestedField(`content.info.${itemKey}.content`, e.target.value)}
                                placeholder={fieldHelpers[`content.info.${itemKey}.content`]?.example}
                                rows={itemKey === 'dressCode' || itemKey === 'photoBooth' ? 2 : 3}
                                className="resize-none text-sm"
                              />
                            </div>

                            {/* 사진 공유: URL과 버튼 텍스트 추가 */}
                            {itemKey === 'photoShare' && (
                              <>
                                <Input
                                  value={invitation.content.info.photoShare.url}
                                  onChange={(e) => updateNestedField('content.info.photoShare.url', e.target.value)}
                                  placeholder="공유 링크 URL"
                                />
                                <Input
                                  value={invitation.content.info.photoShare.buttonText}
                                  onChange={(e) => updateNestedField('content.info.photoShare.buttonText', e.target.value)}
                                  placeholder="버튼 텍스트 (예: 사진 공유하기)"
                                />
                              </>
                            )}

                            {/* 피로연: 장소와 일시 추가 */}
                            {itemKey === 'reception' && (
                              <>
                                <Input
                                  value={invitation.content.info.reception?.venue || ''}
                                  onChange={(e) => updateNestedField('content.info.reception.venue', e.target.value)}
                                  placeholder="장소 (예: 예식장 2층 연회홀)"
                                />
                                <Input
                                  value={invitation.content.info.reception?.datetime || ''}
                                  onChange={(e) => updateNestedField('content.info.reception.datetime', e.target.value)}
                                  placeholder="일시 (예: 예식 직후)"
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </SortableItem>
                  )
                })}
              </div>
            </SortableList>

            {/* 기타 안내 추가 */}
            <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-purple-800">기타 안내 추가</p>
                <button
                  onClick={() => {
                    const newItem = {
                      id: `custom-${Date.now()}`,
                      title: '',
                      content: '',
                      enabled: true
                    }
                    updateNestedField('content.info.customItems', [
                      ...(invitation.content.info.customItems || []),
                      newItem
                    ])
                  }}
                  className="text-xs px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  + 항목 추가
                </button>
              </div>

              {invitation.content.info.customItems?.map((item, index) => (
                <div key={item.id} className="space-y-2 p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-medium">안내 {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(checked) => {
                          const updated = [...(invitation.content.info.customItems || [])]
                          updated[index] = { ...updated[index], enabled: checked }
                          updateNestedField('content.info.customItems', updated)
                        }}
                      />
                      <button
                        onClick={() => {
                          const updated = invitation.content.info.customItems?.filter((_, i) => i !== index) || []
                          updateNestedField('content.info.customItems', updated)
                        }}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...(invitation.content.info.customItems || [])]
                      updated[index] = { ...updated[index], title: e.target.value }
                      updateNestedField('content.info.customItems', updated)
                    }}
                    placeholder="제목 (예: 주차 안내, 식사 안내)"
                    className="text-sm"
                  />
                  <Textarea
                    value={item.content}
                    onChange={(e) => {
                      const updated = [...(invitation.content.info.customItems || [])]
                      updated[index] = { ...updated[index], content: e.target.value }
                      updateNestedField('content.info.customItems', updated)
                    }}
                    placeholder="안내 내용을 입력하세요"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              ))}

              {(!invitation.content.info.customItems || invitation.content.info.customItems.length === 0) && (
                <p className="text-xs text-purple-400 text-center py-2">
                  추가된 안내 항목이 없습니다
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* RSVP */}
        <AccordionItem value="rsvp">
          <AccordionTrigger className="text-base font-medium">📬 RSVP (참석 여부)</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">참석 여부 받기</p>
                <p className="text-xs text-gray-500">하객이 참석 여부를 알려줄 수 있어요</p>
              </div>
              <Switch
                checked={invitation.rsvpEnabled}
                onCheckedChange={(checked) => updateField('rsvpEnabled', checked)}
              />
            </div>
            {invitation.rsvpEnabled && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <FieldLabel fieldKey="rsvpDeadline">회신 마감일</FieldLabel>
                  <Input
                    type="date"
                    value={invitation.rsvpDeadline}
                    onChange={(e) => updateField('rsvpDeadline', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">동반 인원 입력 받기</p>
                    <p className="text-xs text-gray-500">하객이 동반 인원 수를 알려줄 수 있어요</p>
                  </div>
                  <Switch
                    checked={invitation.rsvpAllowGuestCount}
                    onCheckedChange={(checked) => updateField('rsvpAllowGuestCount', checked)}
                  />
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 축의금 계좌 */}
        <AccordionItem value="account">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center justify-between w-full mr-2">
              <span>💳 축의금 계좌</span>
              <Switch
                checked={invitation.sectionVisibility.bankAccounts}
                onCheckedChange={() => toggleSectionVisibility('bankAccounts')}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </AccordionTrigger>
          <AccordionContent className={`space-y-4 pb-4 ${!invitation.sectionVisibility.bankAccounts ? 'opacity-50' : ''}`}>
            {!invitation.sectionVisibility.bankAccounts && (
              <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">이 섹션은 현재 비공개 상태예요.</p>
            )}

            <p className="text-xs text-gray-500 mb-2">표시할 계좌를 선택하고 정보를 입력하세요</p>

            {/* 신랑측 */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800 mb-3">신랑측</p>

              <div className="space-y-2 p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-700">신랑</span>
                  <Switch
                    checked={invitation.groom.bank.enabled || false}
                    onCheckedChange={(checked) => updateNestedField('groom.bank.enabled', checked)}
                  />
                </div>
                {invitation.groom.bank.enabled && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="은행명" value={invitation.groom.bank.bank} onChange={(e) => updateNestedField('groom.bank.bank', e.target.value)} className="text-sm h-8" />
                      <Input placeholder="예금주" value={invitation.groom.bank.holder} onChange={(e) => updateNestedField('groom.bank.holder', e.target.value)} className="text-sm h-8" />
                    </div>
                    <Input placeholder="계좌번호" value={invitation.groom.bank.account} onChange={(e) => updateNestedField('groom.bank.account', e.target.value)} className="text-sm h-8" />
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-700">아버지</span>
                  <Switch
                    checked={invitation.groom.father.bank?.enabled || false}
                    onCheckedChange={(checked) => updateNestedField('groom.father.bank.enabled', checked)}
                  />
                </div>
                {invitation.groom.father.bank?.enabled && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="은행명" value={invitation.groom.father.bank?.bank || ''} onChange={(e) => updateNestedField('groom.father.bank.bank', e.target.value)} className="text-sm h-8" />
                      <Input placeholder="예금주" value={invitation.groom.father.bank?.holder || ''} onChange={(e) => updateNestedField('groom.father.bank.holder', e.target.value)} className="text-sm h-8" />
                    </div>
                    <Input placeholder="계좌번호" value={invitation.groom.father.bank?.account || ''} onChange={(e) => updateNestedField('groom.father.bank.account', e.target.value)} className="text-sm h-8" />
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-700">어머니</span>
                  <Switch
                    checked={invitation.groom.mother.bank?.enabled || false}
                    onCheckedChange={(checked) => updateNestedField('groom.mother.bank.enabled', checked)}
                  />
                </div>
                {invitation.groom.mother.bank?.enabled && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="은행명" value={invitation.groom.mother.bank?.bank || ''} onChange={(e) => updateNestedField('groom.mother.bank.bank', e.target.value)} className="text-sm h-8" />
                      <Input placeholder="예금주" value={invitation.groom.mother.bank?.holder || ''} onChange={(e) => updateNestedField('groom.mother.bank.holder', e.target.value)} className="text-sm h-8" />
                    </div>
                    <Input placeholder="계좌번호" value={invitation.groom.mother.bank?.account || ''} onChange={(e) => updateNestedField('groom.mother.bank.account', e.target.value)} className="text-sm h-8" />
                  </div>
                )}
              </div>
            </div>

            {/* 신부측 */}
            <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
              <p className="text-sm font-semibold text-pink-800 mb-3">신부측</p>

              <div className="space-y-2 p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-pink-700">신부</span>
                  <Switch
                    checked={invitation.bride.bank.enabled || false}
                    onCheckedChange={(checked) => updateNestedField('bride.bank.enabled', checked)}
                  />
                </div>
                {invitation.bride.bank.enabled && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="은행명" value={invitation.bride.bank.bank} onChange={(e) => updateNestedField('bride.bank.bank', e.target.value)} className="text-sm h-8" />
                      <Input placeholder="예금주" value={invitation.bride.bank.holder} onChange={(e) => updateNestedField('bride.bank.holder', e.target.value)} className="text-sm h-8" />
                    </div>
                    <Input placeholder="계좌번호" value={invitation.bride.bank.account} onChange={(e) => updateNestedField('bride.bank.account', e.target.value)} className="text-sm h-8" />
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-pink-700">아버지</span>
                  <Switch
                    checked={invitation.bride.father.bank?.enabled || false}
                    onCheckedChange={(checked) => updateNestedField('bride.father.bank.enabled', checked)}
                  />
                </div>
                {invitation.bride.father.bank?.enabled && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="은행명" value={invitation.bride.father.bank?.bank || ''} onChange={(e) => updateNestedField('bride.father.bank.bank', e.target.value)} className="text-sm h-8" />
                      <Input placeholder="예금주" value={invitation.bride.father.bank?.holder || ''} onChange={(e) => updateNestedField('bride.father.bank.holder', e.target.value)} className="text-sm h-8" />
                    </div>
                    <Input placeholder="계좌번호" value={invitation.bride.father.bank?.account || ''} onChange={(e) => updateNestedField('bride.father.bank.account', e.target.value)} className="text-sm h-8" />
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3 bg-white/70 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-pink-700">어머니</span>
                  <Switch
                    checked={invitation.bride.mother.bank?.enabled || false}
                    onCheckedChange={(checked) => updateNestedField('bride.mother.bank.enabled', checked)}
                  />
                </div>
                {invitation.bride.mother.bank?.enabled && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="은행명" value={invitation.bride.mother.bank?.bank || ''} onChange={(e) => updateNestedField('bride.mother.bank.bank', e.target.value)} className="text-sm h-8" />
                      <Input placeholder="예금주" value={invitation.bride.mother.bank?.holder || ''} onChange={(e) => updateNestedField('bride.mother.bank.holder', e.target.value)} className="text-sm h-8" />
                    </div>
                    <Input placeholder="계좌번호" value={invitation.bride.mother.bank?.account || ''} onChange={(e) => updateNestedField('bride.mother.bank.account', e.target.value)} className="text-sm h-8" />
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
          </Accordion>
        </TabsContent>

      </Tabs>

      {/* AI Story Generator Modal */}
      <StoryGeneratorModal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        templateType={templateId === 'narrative-family' || invitation?.templateId === 'narrative-family' ? 'family' : 'default'}
        onComplete={handleAIComplete}
        onFamilyComplete={handleFamilyAIComplete}
      />
    </div>
  )
}
