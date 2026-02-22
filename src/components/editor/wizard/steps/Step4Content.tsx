'use client'

import { useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { MultiImageUploader } from '@/components/editor/ImageUploader'
import HighlightTextarea from '@/components/editor/HighlightTextarea'
import { DebouncedInput, DebouncedTextarea } from '@/components/editor/DebouncedInput'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import { uploadImage } from '@/lib/imageUpload'
import {
  SAMPLE_PROFILES,
  SAMPLE_STORIES,
  SAMPLE_INTERVIEWS,
  SAMPLE_THANK_YOU,
} from '@/lib/sampleData'
import { parseHighlight } from '@/lib/textUtils'
import { AlignLeft, AlignCenter, AlignRight, X, Plus, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'

// 로컬 상태 슬라이더 (깜빡임 방지)
function LocalSlider({
  value,
  min,
  max,
  onChange,
  className,
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  className?: string
}) {
  const [localValue, setLocalValue] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const displayValue = localValue ?? value

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    setLocalValue(newValue)
  }

  const handlePointerDown = () => {
    setIsDragging(true)
    setLocalValue(value)
  }

  const handlePointerUp = () => {
    if (isDragging && localValue !== null) {
      onChange(localValue)
    }
    setIsDragging(false)
    setLocalValue(null)
  }

  return (
    <input
      type="range"
      min={min}
      max={max}
      value={displayValue}
      onChange={handleChange}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={className}
    />
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

interface Step4ContentProps {
  onOpenAIStoryGenerator?: () => void
  templateId?: string
}

export default function Step4Content({ onOpenAIStoryGenerator, templateId }: Step4ContentProps) {
  const { invitation, updateNestedField, addStory, removeStory, addInterview, removeInterview, toggleSectionVisibility, setActiveSection } = useEditorStore()
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

  if (!invitation) return null

  const isFamily = templateId === 'narrative-family' || invitation.templateId === 'narrative-family'
  const isMagazine = templateId === 'narrative-magazine' || invitation.templateId === 'narrative-magazine'

  // 이미지 업로드 핸들러
  const handleImageUpload = async (
    file: File,
    uploadKey: string,
    onSuccess: (url: string) => void
  ) => {
    setUploadingImages(prev => new Set(prev).add(uploadKey))

    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        onSuccess(result.webUrl)
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingImages(prev => {
        const next = new Set(prev)
        next.delete(uploadKey)
        return next
      })
    }
  }

  // 부모님 소개 데이터
  const parentIntro = invitation.parentIntro || {
    groom: { enabled: true, parentNames: '', childOrder: '첫째', images: [], message: '' },
    bride: { enabled: true, parentNames: '', childOrder: '첫째', images: [], message: '' },
  }

  // 서로를 선택한 이유 데이터
  const whyWeChose = invitation.whyWeChose || {
    enabled: true,
    title: '우리가 서로를 선택한 이유',
    subtitle: '오래 보아도 좋은 사람, 서로 그렇게 되기까지',
    groom: { enabled: true, images: [], imageSettings: [], description: '', quote: '' },
    bride: { enabled: true, images: [], imageSettings: [], description: '', quote: '' },
  }

  const childOrderOptions = ['첫째', '둘째', '셋째', '넷째', '막내', '외동', '표기안함']

  // 샘플 적용 핸들러들
  const applySampleGroomProfile = () => {
    updateNestedField('groom.profile.intro', SAMPLE_PROFILES.groom.intro)
    updateNestedField('groom.profile.aboutLabel', SAMPLE_PROFILES.groom.aboutLabel)
    updateNestedField('groom.profile.subtitle', SAMPLE_PROFILES.groom.subtitle)
    updateNestedField('groom.profile.tag', SAMPLE_PROFILES.groom.tag)
  }

  const applySampleBrideProfile = () => {
    updateNestedField('bride.profile.intro', SAMPLE_PROFILES.bride.intro)
    updateNestedField('bride.profile.aboutLabel', SAMPLE_PROFILES.bride.aboutLabel)
    updateNestedField('bride.profile.subtitle', SAMPLE_PROFILES.bride.subtitle)
    updateNestedField('bride.profile.tag', SAMPLE_PROFILES.bride.tag)
  }

  const applySampleStories = () => {
    SAMPLE_STORIES.forEach((story, index) => {
      updateNestedField(`relationship.stories.${index}`, { ...story })
    })
  }

  const applySampleInterviews = () => {
    SAMPLE_INTERVIEWS.forEach((interview, index) => {
      updateNestedField(`content.interviews.${index}`, { ...interview })
    })
  }

  // 포토 디바이더 에디터 컴포넌트 (섹션별 종속)
  const PhotoDividerEditor = ({
    dividerIndex,
    label,
    defaultEnglishTitle,
    defaultKoreanText,
  }: {
    dividerIndex: number
    label: string
    defaultEnglishTitle: string
    defaultKoreanText: string
  }) => {
    const item = invitation.fullHeightDividers?.items?.[dividerIndex] || {
      id: `divider-${dividerIndex}`,
      image: '',
      imageSettings: { scale: 1, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 },
      englishTitle: defaultEnglishTitle,
      koreanText: defaultKoreanText,
    }

    return (
      <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl space-y-4 mb-4">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M6 4l3 6" /><path d="M12 4l3 6" /></svg> {label}
        </p>
        <p className="text-xs text-gray-300">흑백 웨딩사진 배경으로 섹션을 구분해요</p>

        {/* 이미지 업로드 및 크롭 */}
        <div className="space-y-3">
          {item.image ? (
            <div className="space-y-3">
              {/* InlineCropEditor로 크롭 */}
              <InlineCropEditor
                imageUrl={item.image}
                settings={item.imageSettings || { scale: 1, positionX: 0, positionY: 0, grayscale: 100, opacity: 100 }}
                onUpdate={(settings) => {
                  const current = item.imageSettings || { grayscale: 100, opacity: 100 }
                  updateNestedField(`fullHeightDividers.items.${dividerIndex}.imageSettings`, { ...current, ...settings })
                }}
                aspectRatio={3/4}
                containerWidth={160}
                colorClass="gray"
              />

              {/* 흑백/밝기 슬라이더 */}
              <div className="space-y-2 p-3 bg-white/10 rounded-lg">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-300">
                    <span>흑백</span>
                    <span>{item.imageSettings?.grayscale ?? 100}%</span>
                  </div>
                  <LocalSlider
                    min={0}
                    max={100}
                    value={item.imageSettings?.grayscale ?? 100}
                    onChange={(v) => updateNestedField(`fullHeightDividers.items.${dividerIndex}.imageSettings.grayscale`, v)}
                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-300">
                    <span>밝기</span>
                    <span>{item.imageSettings?.opacity ?? 100}%</span>
                  </div>
                  <LocalSlider
                    min={20}
                    max={100}
                    value={item.imageSettings?.opacity ?? 100}
                    onChange={(v) => updateNestedField(`fullHeightDividers.items.${dividerIndex}.imageSettings.opacity`, v)}
                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              {/* 이미지 삭제 버튼 */}
              <button
                onClick={() => updateNestedField(`fullHeightDividers.items.${dividerIndex}.image`, '')}
                className="text-xs text-red-400 hover:text-red-300"
              >
                이미지 삭제
              </button>
            </div>
          ) : (
            <label className={`block max-w-[160px] aspect-[3/4] border-2 border-dashed border-gray-500 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white/5 ${uploadingImages.has(`divider-${dividerIndex}`) ? 'opacity-50' : ''}`}>
              {uploadingImages.has(`divider-${dividerIndex}`) ? (
                <>
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                  <span className="text-xs text-gray-400 mt-2">업로드중...</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-gray-400 mt-2">배경 이미지 추가</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingImages.has(`divider-${dividerIndex}`)}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, `divider-${dividerIndex}`, (url) => {
                      updateNestedField(`fullHeightDividers.items.${dividerIndex}.image`, url)
                    })
                    e.target.value = ''
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* 텍스트 입력 */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-300">영문 타이틀</Label>
            <DebouncedInput
              value={item.englishTitle || ''}
              onChange={(value) => updateNestedField(`fullHeightDividers.items.${dividerIndex}.englishTitle`, value)}
              placeholder={defaultEnglishTitle}
              className="text-sm italic bg-white/10 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-300">한글 텍스트</Label>
            <DebouncedTextarea
              value={item.koreanText || ''}
              onChange={(value) => updateNestedField(`fullHeightDividers.items.${dividerIndex}.koreanText`, value)}
              placeholder={defaultKoreanText}
              rows={2}
              className="text-sm resize-none bg-white/10 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>
    )
  }

  // 프로필 이미지 크롭 설정 업데이트
  const updateProfileImageSettings = (side: 'groom' | 'bride', imgIndex: number, settings: { scale?: number; positionX?: number; positionY?: number }) => {
    const currentSettings = invitation[side].profile.imageSettings || []
    const updatedSettings = [...currentSettings]
    updatedSettings[imgIndex] = { ...currentSettings[imgIndex], ...settings }
    updateNestedField(`${side}.profile.imageSettings`, updatedSettings)
  }

  // 스토리 이미지 크롭 설정 업데이트
  const updateStoryImageSettings = (storyIndex: number, imgIndex: number, settings: { scale?: number; positionX?: number; positionY?: number }) => {
    const story = invitation.relationship.stories[storyIndex]
    const currentSettings = story.imageSettings || []
    const updatedSettings = [...currentSettings]
    updatedSettings[imgIndex] = { ...currentSettings[imgIndex], ...settings }
    updateNestedField(`relationship.stories.${storyIndex}.imageSettings`, updatedSettings)
  }

  // 인터뷰 이미지 크롭 설정 업데이트
  const updateInterviewImageSettings = (interviewIndex: number, imgIndex: number, settings: { scale?: number; positionX?: number; positionY?: number }) => {
    const interview = invitation.content.interviews[interviewIndex]
    const currentSettings = interview.imageSettings || []
    const updatedSettings = [...currentSettings]
    updatedSettings[imgIndex] = { ...currentSettings[imgIndex], ...settings }
    updateNestedField(`content.interviews.${interviewIndex}.imageSettings`, updatedSettings)
  }

  // 부모님 소개 이미지 크롭 설정 업데이트
  const updateParentIntroImageSettings = (side: 'groom' | 'bride', imgIndex: number, settings: Partial<{ cropX: number; cropY: number; cropWidth: number; cropHeight: number }>) => {
    const parentData = (invitation as any).parentIntro?.[side]
    const currentSettings = parentData?.imageSettings || []
    const updatedSettings = [...currentSettings]
    updatedSettings[imgIndex] = { ...currentSettings[imgIndex], ...settings }
    updateNestedField(`parentIntro.${side}.imageSettings`, updatedSettings)
  }

  // 서로를 선택한 이유 이미지 크롭 설정 업데이트
  const updateWhyWeChoseImageSettings = (side: 'groom' | 'bride', imgIndex: number, settings: Partial<{ cropX: number; cropY: number; cropWidth: number; cropHeight: number }>) => {
    const whyData = (invitation as any).whyWeChose?.[side]
    const currentSettings = whyData?.imageSettings || []
    const updatedSettings = [...currentSettings]
    updatedSettings[imgIndex] = { ...currentSettings[imgIndex], ...settings }
    updateNestedField(`whyWeChose.${side}.imageSettings`, updatedSettings)
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">{isMagazine ? '매거진 콘텐츠 작성' : '본문 콘텐츠 작성'}</p>
        <p className="text-sm text-purple-700">
          {isMagazine
            ? "Editor's Note와 인터뷰 등 매거진 본문을 작성해주세요."
            : '청첩장 본문에 들어갈 내용을 작성해주세요. 질문에 답하면 초안을 작성해드려요.'}
        </p>
      </div>

      {/* 매거진: Editor's Note (인사말 + 명언) */}
      {isMagazine && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg> Editor&apos;s Note
          </h3>
          <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 매거진 본문 상단에 표시되는 인사말과 명언을 작성해주세요.</p>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">인사말</Label>
            <Textarea
              value={invitation.content.greeting || ''}
              onChange={(e) => updateNestedField('content.greeting', e.target.value)}
              onFocus={() => setActiveSection('greeting')}
              placeholder="서로의 가장 좋은 친구이자&#10;든든한 지지자였던 두 사람이&#10;이제 평생의 동반자가 되려 합니다."
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">명언/슬로건</Label>
            <Textarea
              value={invitation.content.quote?.text || ''}
              onChange={(e) => updateNestedField('content.quote.text', e.target.value)}
              placeholder="사랑은 서로를 바라보는 것이 아니라&#10;함께 같은 방향을 바라보는 것이다."
              rows={2}
              className="resize-none"
            />
          </div>
        </section>
      )}

      {/* 초안 작성 버튼 (매거진 제외) */}
      {!isMagazine && (
      <section className="space-y-4">
        <button
          onClick={onOpenAIStoryGenerator}
          className="w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" fill="rgba(255,255,255,0.2)" /><path d="M20 3v4" /><path d="M22 5h-4" /></svg>
            <div className="text-left">
              <p className="font-semibold text-lg">초안 작성해드려요</p>
              <p className="text-sm text-white/80">질문에 답하면 맞춤 콘텐츠를 작성해드려요</p>
            </div>
          </div>
        </button>
      </section>
      )}

      {/* 커플 소개 - OUR 템플릿에서만 표시 (연인의 시선으로 소개) */}
      {!isFamily && !isMagazine && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg> 연인의 시선으로 소개
            </h3>
            <Switch
              checked={invitation.sectionVisibility.coupleProfile}
              onCheckedChange={() => toggleSectionVisibility('coupleProfile')}
            />
          </div>
          {/* TIP 섹션 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-2"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 내가 사랑하는 사람을 소개해 주세요. 함께 지내며 느낀 그 사람의 모습이면 충분합니다.</p>
            <details className="text-xs text-blue-700">
              <summary className="cursor-pointer font-medium hover:text-blue-900">가이드 보기</summary>
              <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-300">
                <p className="font-medium"><svg className="w-3 h-3 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg> 이렇게 작성해 보세요</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>'나'가 아닌 그 사람의 이름으로 시작해요</li>
                  <li>성격 나열보다 장면 하나를 떠올려 보세요</li>
                  <li>짧아도, 문단이 길어도 괜찮아요</li>
                </ul>
                <div className="p-2 bg-white/50 rounded text-gray-600 italic">
                  예시) "다해는 세상을 조금 다르게 바라보는 사람입니다.<br/>익숙한 것에도 늘 질문을 던지고,<br/>그 덕분에 제 하루는 자주 새로워집니다."
                </div>
                <p className="text-blue-600"><svg className="w-3 h-3 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> 이 글은 소개문이 아니라, 사랑하는 사람이 바라본 한 사람의 기록입니다.</p>
              </div>
            </details>
          </div>

          {invitation.sectionVisibility.coupleProfile && (
            <div className="space-y-4 flex flex-col">
              {/* 프로필 순서 탭 */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg order-0">
                <button
                  type="button"
                  onClick={() => updateNestedField('profileOrder', 'groom-first')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                    invitation.profileOrder === 'groom-first'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  신랑 먼저
                </button>
                <button
                  type="button"
                  onClick={() => updateNestedField('profileOrder', 'bride-first')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                    invitation.profileOrder === 'bride-first'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  신부 먼저
                </button>
              </div>

              {/* 신랑 소개 */}
              <div className={`p-4 bg-blue-50 rounded-lg space-y-4 ${invitation.profileOrder === 'bride-first' ? 'order-2' : 'order-1'}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-blue-800">신부가 소개하는 신랑</p>
                  {!invitation.groom.profile.intro && (
                    <button onClick={applySampleGroomProfile} className="text-xs text-blue-600 hover:underline">
                      샘플 적용
                    </button>
                  )}
              </div>

              {/* 프로필 사진 */}
              <div className="space-y-1.5">
                <Label className="text-xs">프로필 사진 (최대 3장)</Label>
                <MultiImageUploader
                  images={invitation.groom.profile.images || []}
                  onChange={(images) => updateNestedField('groom.profile.images', images)}
                  maxImages={3}
                  placeholder="사진 추가"
                  aspectRatio="aspect-square"
                />
                {/* 이미지 크롭 조정 */}
                {(invitation.groom.profile.images?.length || 0) > 0 && (
                  <div className="mt-2 p-3 bg-white/70 rounded-lg space-y-3">
                    <p className="text-[10px] font-medium text-blue-700">이미지 크롭 조정</p>
                    {invitation.groom.profile.images?.map((imageUrl, imgIndex) => {
                      const settings = invitation.groom.profile.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                      return (
                        <div key={imgIndex} className="space-y-2 pb-3 border-b border-blue-100 last:border-0 last:pb-0">
                          <p className="text-[9px] text-blue-600">사진 {imgIndex + 1}</p>
                          <InlineCropEditor
                            imageUrl={imageUrl}
                            settings={settings}
                            onUpdate={(s) => updateProfileImageSettings('groom', imgIndex, s)}
                            aspectRatio={4/5}
                            containerWidth={140}
                            colorClass="blue"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 소개 레이블 */}
              <div className="space-y-1.5">
                <Label className="text-xs">소개 레이블 (영문)</Label>
                <Input
                  value={invitation.groom.profile.aboutLabel || ''}
                  onChange={(e) => updateNestedField('groom.profile.aboutLabel', e.target.value)}
                  onFocus={() => setActiveSection('couple-profile')}
                  placeholder="ABOUT MINJUN"
                  className="bg-white"
                />
                <p className="text-[10px] text-gray-400">예: ABOUT MINJUN, ABOUT 민준</p>
              </div>

              {/* 서브타이틀 */}
              <div className="space-y-1.5">
                <Label className="text-xs">서브타이틀</Label>
                <Input
                  value={invitation.groom.profile.subtitle || ''}
                  onChange={(e) => updateNestedField('groom.profile.subtitle', e.target.value)}
                  onFocus={() => setActiveSection('couple-profile')}
                  placeholder="서연이가 소개하는 민준"
                  className="bg-white"
                />
                <p className="text-[10px] text-gray-400">예: 서연이가 소개하는 민준</p>
              </div>

              {/* 소개글 */}
              <div className="space-y-1.5">
                <Label className="text-xs">소개글</Label>
                <TextStyleControls
                  lineHeight={invitation.profileTextStyle?.lineHeight}
                  textAlign={invitation.groom.profile.textStyle?.textAlign}
                  onLineHeightChange={(v) => updateNestedField('profileTextStyle', { ...invitation.profileTextStyle, lineHeight: v })}
                  onTextAlignChange={(v) => updateNestedField('groom.profile.textStyle', { ...invitation.groom.profile.textStyle, textAlign: v })}
                />
                <HighlightTextarea
                  value={invitation.groom.profile.intro}
                  onChange={(value) => updateNestedField('groom.profile.intro', value)}
                  onFocus={() => setActiveSection('couple-profile')}
                  placeholder={SAMPLE_PROFILES.groom.intro}
                  rows={4}
                  className="bg-white"
                />
              </div>

              {/* 태그 */}
              <div className="space-y-1.5">
                <Label className="text-xs">성격 태그</Label>
                <Input
                  value={invitation.groom.profile.tag || ''}
                  onChange={(e) => updateNestedField('groom.profile.tag', e.target.value)}
                  onFocus={() => setActiveSection('couple-profile')}
                  placeholder="세상에서 가장 따뜻한 사람"
                  className="bg-white"
                />
              </div>
            </div>

            {/* 신부 소개 */}
            <div className={`p-4 bg-pink-50 rounded-lg space-y-4 ${invitation.profileOrder === 'bride-first' ? 'order-1' : 'order-2'}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-pink-800">신랑이 소개하는 신부</p>
                {!invitation.bride.profile.intro && (
                  <button onClick={applySampleBrideProfile} className="text-xs text-pink-600 hover:underline">
                    샘플 적용
                  </button>
                )}
              </div>

              {/* 프로필 사진 */}
              <div className="space-y-1.5">
                <Label className="text-xs">프로필 사진 (최대 3장)</Label>
                <MultiImageUploader
                  images={invitation.bride.profile.images || []}
                  onChange={(images) => updateNestedField('bride.profile.images', images)}
                  maxImages={3}
                  placeholder="사진 추가"
                  aspectRatio="aspect-square"
                />
                {/* 이미지 크롭 조정 */}
                {(invitation.bride.profile.images?.length || 0) > 0 && (
                  <div className="mt-2 p-3 bg-white/70 rounded-lg space-y-3">
                    <p className="text-[10px] font-medium text-pink-700">이미지 크롭 조정</p>
                    {invitation.bride.profile.images?.map((imageUrl, imgIndex) => {
                      const settings = invitation.bride.profile.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                      return (
                        <div key={imgIndex} className="space-y-2 pb-3 border-b border-pink-100 last:border-0 last:pb-0">
                          <p className="text-[9px] text-pink-600">사진 {imgIndex + 1}</p>
                          <InlineCropEditor
                            imageUrl={imageUrl}
                            settings={settings}
                            onUpdate={(s) => updateProfileImageSettings('bride', imgIndex, s)}
                            aspectRatio={4/5}
                            containerWidth={140}
                            colorClass="pink"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 소개 레이블 */}
              <div className="space-y-1.5">
                <Label className="text-xs">소개 레이블 (영문)</Label>
                <Input
                  value={invitation.bride.profile.aboutLabel || ''}
                  onChange={(e) => updateNestedField('bride.profile.aboutLabel', e.target.value)}
                  onFocus={() => setActiveSection('couple-profile')}
                  placeholder="ABOUT SEOYEON"
                  className="bg-white"
                />
                <p className="text-[10px] text-gray-400">예: ABOUT SEOYEON, ABOUT 서연</p>
              </div>

              {/* 서브타이틀 */}
              <div className="space-y-1.5">
                <Label className="text-xs">서브타이틀</Label>
                <Input
                  value={invitation.bride.profile.subtitle || ''}
                  onChange={(e) => updateNestedField('bride.profile.subtitle', e.target.value)}
                  onFocus={() => setActiveSection('couple-profile')}
                  placeholder="민준이가 소개하는 서연"
                  className="bg-white"
                />
                <p className="text-[10px] text-gray-400">예: 민준이가 소개하는 서연</p>
              </div>

              {/* 소개글 */}
              <div className="space-y-1.5">
                <Label className="text-xs">소개글</Label>
                <TextStyleControls
                  lineHeight={invitation.profileTextStyle?.lineHeight}
                  textAlign={invitation.bride.profile.textStyle?.textAlign}
                  onLineHeightChange={(v) => updateNestedField('profileTextStyle', { ...invitation.profileTextStyle, lineHeight: v })}
                  onTextAlignChange={(v) => updateNestedField('bride.profile.textStyle', { ...invitation.bride.profile.textStyle, textAlign: v })}
                />
                <HighlightTextarea
                  value={invitation.bride.profile.intro}
                  onChange={(value) => updateNestedField('bride.profile.intro', value)}
                  onFocus={() => setActiveSection('couple-profile')}
                  placeholder={SAMPLE_PROFILES.bride.intro}
                  rows={4}
                  className="bg-white"
                />
              </div>

              {/* 태그 */}
              <div className="space-y-1.5">
                <Label className="text-xs">성격 태그</Label>
                <Input
                  value={invitation.bride.profile.tag || ''}
                  onChange={(e) => updateNestedField('bride.profile.tag', e.target.value)}
                  onFocus={() => setActiveSection('couple-profile')}
                  placeholder="매일 웃게 해주는 사람"
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        )}
        </section>
      )}

      {/* OUR 템플릿: 러브스토리 / FAMILY 템플릿: 부모님 인사말 (MAGAZINE은 숨김) */}
      {isMagazine ? null : !isFamily ? (
        /* OUR 템플릿: 러브스토리 */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> 러브스토리
            </h3>
            <Switch
              checked={invitation.sectionVisibility.ourStory}
              onCheckedChange={() => toggleSectionVisibility('ourStory')}
            />
          </div>

          {/* TIP 섹션 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-2"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 첫 만남부터 결혼을 결심하기까지, 그때의 이야기와 사진을 함께 담아주세요.</p>
            <details className="text-xs text-blue-700">
              <summary className="cursor-pointer font-medium hover:text-blue-900">가이드 보기</summary>
              <div className="mt-3 space-y-4 pl-2 border-l-2 border-blue-300">
                <p>이 페이지는 첫 만남부터 결혼을 결심하기까지의 시간을 사진과 함께 기록하는 공간입니다.</p>

                <div className="space-y-2">
                  <p className="font-medium">① 첫 만남</p>
                  <p>처음 마주했던 날을 떠올려 보세요. 그날의 분위기와 마음을 한두 문장으로 남기고, 첫 시절의 사진을 함께 담아 주세요.</p>
                  <div className="p-2 bg-white/50 rounded text-gray-600 italic">예시) "스무 살, 같은 캠퍼스에서 친구로 처음 만났습니다."</div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">② 연애의 시간</p>
                  <p>연애하며 함께 쌓아온 시간을 요약해 보세요. 장거리, 취미, 반복된 일상처럼 우리다웠던 시간을 보여주는 사진이 잘 어울립니다.</p>
                  <div className="p-2 bg-white/50 rounded text-gray-600 italic">예시) "장거리와 바쁜 일상 속에서도 함께 웃고, 같은 취미를 나누며 시간을 쌓아왔습니다."</div>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">③ 결혼을 결심한 순간</p>
                  <p>결혼을 준비하게 된 계기나 프러포즈의 순간을 담아보세요.</p>
                  <div className="p-2 bg-white/50 rounded text-gray-600 italic">예시) "10주년을 기념한 여행에서, 서로의 평생이 되기로 약속했습니다."</div>
                </div>

                <p className="text-blue-600"><svg className="w-3 h-3 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> 사진은 기록을 더 선명하게 만들고, 글은 그 순간에 의미를 더합니다. 잘 나온 사진보다 그때의 감정이 느껴지는 사진이 좋아요.</p>
              </div>
            </details>
          </div>

          {invitation.sectionVisibility.ourStory && (
            <div className="space-y-4">
              {invitation.relationship.stories.every(s => !s.title && !s.desc) && (
                <div className="flex justify-end">
                  <button onClick={applySampleStories} className="text-xs text-blue-600 hover:underline">
                    샘플 적용
                  </button>
                </div>
              )}

              {invitation.relationship.stories.map((story, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">스토리 {index + 1}</span>
                    {invitation.relationship.stories.length > 1 && (
                      <button
                        onClick={() => removeStory(index)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">날짜</Label>
                      <Input
                        value={story.date}
                        onChange={(e) => updateNestedField(`relationship.stories.${index}.date`, e.target.value)}
                        onFocus={() => setActiveSection('our-story')}
                        placeholder={SAMPLE_STORIES[index]?.date || '2020.05'}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">제목</Label>
                      <Input
                        value={story.title}
                        onChange={(e) => updateNestedField(`relationship.stories.${index}.title`, e.target.value)}
                        onFocus={() => setActiveSection('our-story')}
                        placeholder={SAMPLE_STORIES[index]?.title || '제목을 입력하세요'}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">내용</Label>
                    <HighlightTextarea
                      value={story.desc}
                      onChange={(value) => updateNestedField(`relationship.stories.${index}.desc`, value)}
                      onFocus={() => setActiveSection('our-story')}
                      placeholder={SAMPLE_STORIES[index]?.desc || '스토리 내용을 입력해주세요'}
                      rows={3}
                    />
                  </div>
                  {/* 스토리 이미지 */}
                  <div className="space-y-1">
                    <Label className="text-xs">사진 (최대 2장)</Label>
                    <MultiImageUploader
                      images={story.images || []}
                      onChange={(images) => updateNestedField(`relationship.stories.${index}.images`, images)}
                      maxImages={2}
                      placeholder="사진 추가"
                      aspectRatio="aspect-square"
                    />
                    {/* 이미지 크롭 조정 */}
                    {(story.images?.length || 0) > 0 && (
                      <div className="mt-2 p-3 bg-white/70 rounded-lg space-y-3">
                        <p className="text-[10px] font-medium text-rose-700">이미지 크롭 조정</p>
                        {story.images?.map((imageUrl, imgIndex) => {
                          const settings = story.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                          return (
                            <div key={imgIndex} className="space-y-2 pb-3 border-b border-rose-100 last:border-0 last:pb-0">
                              <p className="text-[9px] text-rose-600">사진 {imgIndex + 1}</p>
                              <InlineCropEditor
                                imageUrl={imageUrl}
                                settings={settings}
                                onUpdate={(s) => updateStoryImageSettings(index, imgIndex, s)}
                                aspectRatio={1}
                                containerWidth={140}
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

              <button
                onClick={addStory}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + 스토리 추가
              </button>
            </div>
          )}
        </section>
      ) : (
        /* FAMILY 템플릿: 부모님 인사말 (신랑측/신부측 분리) */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> 부모님 소개
            </h3>
            <Switch
              checked={invitation.sectionVisibility.parentsGreeting ?? true}
              onCheckedChange={() => toggleSectionVisibility('parentsGreeting')}
            />
          </div>

          {(invitation.sectionVisibility.parentsGreeting ?? true) && (
            <div className="space-y-4">
              {/* TIP 섹션 */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 부모님의 시선으로 자녀를 소개하고, 함께 축하 인사를 전해보세요.</p>
                <details className="text-xs text-blue-700">
                  <summary className="cursor-pointer font-medium hover:text-blue-900">가이드 보기</summary>
                  <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-300">
                    <div>
                      <p className="font-medium text-blue-800 mb-1">작성 팁:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                        <li>부모님의 목소리로, "이런 아이였어요" "이렇게 자랐어요"를 떠올려 보세요.</li>
                        <li>자녀를 사랑으로 키우신 이야기와 함께, 새로운 시작에 대한 축복의 마음을 담아주세요.</li>
                        <li>자녀에 대한 따뜻한 소개, 그리고 앞으로의 결혼 생활을 응원하는 메시지면 좋아요.</li>
                      </ul>
                    </div>
                  </div>
                </details>
              </div>

              {/* 포토 디바이더 - 부모님 소개 상단 */}
              <PhotoDividerEditor
                dividerIndex={0}
                label="부모님 소개 상단 디바이더"
                defaultEnglishTitle="From Our Family to Yours"
                defaultKoreanText="우리의 봄이, 누군가의 평생이 됩니다"
              />

              {/* 신랑측 부모님 소개 */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-blue-800">신랑측 부모님 소개</p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">표시</Label>
                    <Switch
                      checked={parentIntro.groom?.enabled !== false}
                      onCheckedChange={(checked) => updateNestedField('parentIntro.groom.enabled', checked)}
                    />
                  </div>
                </div>

                {parentIntro.groom?.enabled !== false && (
                  <>
                    {/* 부모님 표기 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">부모님 표기</Label>
                      <DebouncedInput
                        value={parentIntro.groom?.parentNames || ''}
                        onChange={(value) => updateNestedField('parentIntro.groom.parentNames', value)}
                        onFocus={() => setActiveSection('couple-profile')}
                        placeholder="예: 홍길동, 김영희의"
                        className="bg-white"
                      />
                      <p className="text-[10px] text-gray-400">아버지, 어머니 이름 뒤에 &apos;의&apos;를 붙여주세요</p>
                    </div>

                    {/* 자녀 순서 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">자녀 순서</Label>
                      <select
                        value={parentIntro.groom?.childOrder || '첫째'}
                        onChange={(e) => updateNestedField('parentIntro.groom.childOrder', e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {childOrderOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* 가족 사진 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">가족 사진 (최대 2장)</Label>
                      <MultiImageUploader
                        images={parentIntro.groom?.images || []}
                        onChange={(images) => updateNestedField('parentIntro.groom.images', images)}
                        maxImages={2}
                        placeholder="사진 추가"
                        aspectRatio="aspect-[4/3]"
                      />
                      <p className="text-[10px] text-gray-400">2장 등록 시 자동 슬라이드됩니다</p>
                      {/* 이미지 크롭 조정 */}
                      {(parentIntro.groom?.images?.length || 0) > 0 && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg space-y-3">
                          <p className="text-[10px] font-medium text-blue-700">이미지 크롭 조정</p>
                          {parentIntro.groom?.images?.map((imageUrl: string, imgIndex: number) => {
                            const settings = parentIntro.groom?.imageSettings?.[imgIndex] || {}
                            return (
                              <div key={imgIndex} className="space-y-2 pb-3 border-b border-blue-100 last:border-0 last:pb-0">
                                <p className="text-[9px] text-blue-600">사진 {imgIndex + 1}</p>
                                <InlineCropEditor
                                  imageUrl={imageUrl}
                                  settings={settings}
                                  onUpdate={(s) => updateParentIntroImageSettings('groom', imgIndex, s)}
                                  aspectRatio={4/3}
                                  containerWidth={140}
                                  colorClass="blue"
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* 부모님 메시지 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">부모님 메시지</Label>
                      <TextStyleControls
                        lineHeight={parentIntro.groom?.lineHeight ?? invitation.parentIntroTextStyle?.lineHeight}
                        textAlign={parentIntro.groom?.textAlign ?? invitation.parentIntroTextStyle?.textAlign}
                        onLineHeightChange={(v) => updateNestedField('parentIntro.groom.lineHeight', v)}
                        onTextAlignChange={(v) => updateNestedField('parentIntro.groom.textAlign', v)}
                      />
                      <HighlightTextarea
                        value={parentIntro.groom?.message || ''}
                        onChange={(value) => updateNestedField('parentIntro.groom.message', value)}
                        onFocus={() => setActiveSection('couple-profile')}
                        placeholder="자녀를 소개하는 부모님의 진심어린 메시지를 작성해주세요..."
                        rows={6}
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 신부측 부모님 소개 */}
              <div className="p-4 bg-pink-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-pink-800">신부측 부모님 소개</p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">표시</Label>
                    <Switch
                      checked={parentIntro.bride?.enabled !== false}
                      onCheckedChange={(checked) => updateNestedField('parentIntro.bride.enabled', checked)}
                    />
                  </div>
                </div>

                {parentIntro.bride?.enabled !== false && (
                  <>
                    {/* 부모님 표기 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">부모님 표기</Label>
                      <DebouncedInput
                        value={parentIntro.bride?.parentNames || ''}
                        onChange={(value) => updateNestedField('parentIntro.bride.parentNames', value)}
                        onFocus={() => setActiveSection('couple-profile')}
                        placeholder="예: 이철수, 박순이의"
                        className="bg-white"
                      />
                      <p className="text-[10px] text-gray-400">아버지, 어머니 이름 뒤에 &apos;의&apos;를 붙여주세요</p>
                    </div>

                    {/* 자녀 순서 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">자녀 순서</Label>
                      <select
                        value={parentIntro.bride?.childOrder || '첫째'}
                        onChange={(e) => updateNestedField('parentIntro.bride.childOrder', e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
                      >
                        {childOrderOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    {/* 가족 사진 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">가족 사진 (최대 2장)</Label>
                      <MultiImageUploader
                        images={parentIntro.bride?.images || []}
                        onChange={(images) => updateNestedField('parentIntro.bride.images', images)}
                        maxImages={2}
                        placeholder="사진 추가"
                        aspectRatio="aspect-[4/3]"
                      />
                      <p className="text-[10px] text-gray-400">2장 등록 시 자동 슬라이드됩니다</p>
                      {/* 이미지 크롭 조정 */}
                      {(parentIntro.bride?.images?.length || 0) > 0 && (
                        <div className="mt-2 p-3 bg-pink-50 rounded-lg space-y-3">
                          <p className="text-[10px] font-medium text-pink-700">이미지 크롭 조정</p>
                          {parentIntro.bride?.images?.map((imageUrl: string, imgIndex: number) => {
                            const settings = parentIntro.bride?.imageSettings?.[imgIndex] || {}
                            return (
                              <div key={imgIndex} className="space-y-2 pb-3 border-b border-pink-100 last:border-0 last:pb-0">
                                <p className="text-[9px] text-pink-600">사진 {imgIndex + 1}</p>
                                <InlineCropEditor
                                  imageUrl={imageUrl}
                                  settings={settings}
                                  onUpdate={(s) => updateParentIntroImageSettings('bride', imgIndex, s)}
                                  aspectRatio={4/3}
                                  containerWidth={140}
                                  colorClass="pink"
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* 부모님 메시지 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">부모님 메시지</Label>
                      <TextStyleControls
                        lineHeight={parentIntro.bride?.lineHeight ?? invitation.parentIntroTextStyle?.lineHeight}
                        textAlign={parentIntro.bride?.textAlign ?? invitation.parentIntroTextStyle?.textAlign}
                        onLineHeightChange={(v) => updateNestedField('parentIntro.bride.lineHeight', v)}
                        onTextAlignChange={(v) => updateNestedField('parentIntro.bride.textAlign', v)}
                      />
                      <HighlightTextarea
                        value={parentIntro.bride?.message || ''}
                        onChange={(value) => updateNestedField('parentIntro.bride.message', value)}
                        onFocus={() => setActiveSection('couple-profile')}
                        placeholder="자녀를 소개하는 부모님의 진심어린 메시지를 작성해주세요..."
                        rows={6}
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 서로를 선택한 이유 - FAMILY 템플릿에서만 표시 */}
      {isFamily && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> 서로를 선택한 이유
            </h3>
            <Switch
              checked={whyWeChose.enabled !== false}
              onCheckedChange={(checked) => updateNestedField('whyWeChose.enabled', checked)}
            />
          </div>

          {whyWeChose.enabled !== false && (
            <div className="space-y-4">
              {/* TIP 섹션 */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 상대에게 느낀 특별함을, 두 분의 말로 직접 전해 보세요.</p>
                <details className="text-xs text-blue-700">
                  <summary className="cursor-pointer font-medium hover:text-blue-900">가이드 보기</summary>
                  <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-300">
                    <div>
                      <p className="font-medium text-blue-800 mb-1">작성 팁:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                        <li>단순한 장점이 아닌, 일상에서 느낀 순간을 떠올려 보세요.</li>
                        <li>예시: "힘든 날 먼저 다가와 주던 손이 고마웠어요."</li>
                        <li>진심이 담긴 한 문장이 화려한 수식어보다 더 마음에 남습니다.</li>
                      </ul>
                    </div>
                  </div>
                </details>
              </div>

              {/* 포토 디바이더 - 서로를 선택한 이유 상단 */}
              <PhotoDividerEditor
                dividerIndex={1}
                label="서로를 선택한 이유 상단 디바이더"
                defaultEnglishTitle="Why We Chose Each Other"
                defaultKoreanText="서로의 부족한 점을 채워줄 수 있는\n사람을 만났습니다."
              />

              {/* 섹션 제목 설정 */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <p className="font-medium text-sm text-gray-700">섹션 제목</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">제목</Label>
                  <DebouncedInput
                    value={whyWeChose.title || ''}
                    onChange={(value) => updateNestedField('whyWeChose.title', value)}
                    onFocus={() => setActiveSection('our-story')}
                    placeholder="우리가 서로를 선택한 이유"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">부제목</Label>
                  <DebouncedInput
                    value={whyWeChose.subtitle || ''}
                    onChange={(value) => updateNestedField('whyWeChose.subtitle', value)}
                    onFocus={() => setActiveSection('our-story')}
                    placeholder="오래 보아도 좋은 사람, 서로 그렇게 되기까지"
                    className="bg-white"
                  />
                </div>
              </div>

              {/* 신랑이 신부를 선택한 이유 */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-blue-800">신랑이 신부를 선택한 이유</p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">표시</Label>
                    <Switch
                      checked={whyWeChose.groom?.enabled !== false}
                      onCheckedChange={(checked) => updateNestedField('whyWeChose.groom.enabled', checked)}
                    />
                  </div>
                </div>

                {whyWeChose.groom?.enabled !== false && (
                  <>
                    {/* 사진 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">사진 (최대 2장)</Label>
                      <MultiImageUploader
                        images={whyWeChose.groom?.images || []}
                        onChange={(images) => updateNestedField('whyWeChose.groom.images', images)}
                        maxImages={2}
                        placeholder="사진 추가"
                        aspectRatio="aspect-[4/5]"
                      />
                      {/* 이미지 크롭 조정 */}
                      {(whyWeChose.groom?.images?.length || 0) > 0 && (
                        <div className="mt-2 p-3 bg-blue-100/50 rounded-lg space-y-3">
                          <p className="text-[10px] font-medium text-blue-700">이미지 크롭 조정</p>
                          {whyWeChose.groom?.images?.map((imageUrl: string, imgIndex: number) => {
                            const settings = whyWeChose.groom?.imageSettings?.[imgIndex] || {}
                            return (
                              <div key={imgIndex} className="space-y-2 pb-3 border-b border-blue-200 last:border-0 last:pb-0">
                                <p className="text-[9px] text-blue-600">사진 {imgIndex + 1}</p>
                                <InlineCropEditor
                                  imageUrl={imageUrl}
                                  settings={settings}
                                  onUpdate={(s) => updateWhyWeChoseImageSettings('groom', imgIndex, s)}
                                  aspectRatio={4/5}
                                  containerWidth={140}
                                  colorClass="blue"
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* 본문 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">본문 <span className="text-pink-500 text-[10px] ml-1">✦ 초안 작성 가능</span></Label>
                      <TextStyleControls
                        lineHeight={invitation.whyWeChoseTextStyle?.lineHeight}
                        textAlign={whyWeChose.groom?.textAlign ?? invitation.whyWeChoseTextStyle?.textAlign}
                        onLineHeightChange={(v) => updateNestedField('whyWeChoseTextStyle', { ...invitation.whyWeChoseTextStyle, lineHeight: v })}
                        onTextAlignChange={(v) => updateNestedField('whyWeChose.groom.textAlign', v)}
                      />
                      <HighlightTextarea
                        value={whyWeChose.groom?.description || ''}
                        onChange={(value) => updateNestedField('whyWeChose.groom.description', value)}
                        onFocus={() => setActiveSection('our-story')}
                        placeholder="상대방을 선택한 이유를 작성해주세요..."
                        rows={5}
                        className="bg-white text-sm leading-relaxed"
                      />
                    </div>

                    {/* 약속의 말 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">약속의 말</Label>
                      <DebouncedInput
                        value={whyWeChose.groom?.quote || ''}
                        onChange={(value) => updateNestedField('whyWeChose.groom.quote', value)}
                        onFocus={() => setActiveSection('our-story')}
                        placeholder="예: 서로 아끼며 행복하게 살겠습니다."
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 신부가 신랑을 선택한 이유 */}
              <div className="p-4 bg-pink-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-pink-800">신부가 신랑을 선택한 이유</p>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500">표시</Label>
                    <Switch
                      checked={whyWeChose.bride?.enabled !== false}
                      onCheckedChange={(checked) => updateNestedField('whyWeChose.bride.enabled', checked)}
                    />
                  </div>
                </div>

                {whyWeChose.bride?.enabled !== false && (
                  <>
                    {/* 사진 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">사진 (최대 2장)</Label>
                      <MultiImageUploader
                        images={whyWeChose.bride?.images || []}
                        onChange={(images) => updateNestedField('whyWeChose.bride.images', images)}
                        maxImages={2}
                        placeholder="사진 추가"
                        aspectRatio="aspect-[4/5]"
                      />
                      {/* 이미지 크롭 조정 */}
                      {(whyWeChose.bride?.images?.length || 0) > 0 && (
                        <div className="mt-2 p-3 bg-pink-100/50 rounded-lg space-y-3">
                          <p className="text-[10px] font-medium text-pink-700">이미지 크롭 조정</p>
                          {whyWeChose.bride?.images?.map((imageUrl: string, imgIndex: number) => {
                            const settings = whyWeChose.bride?.imageSettings?.[imgIndex] || {}
                            return (
                              <div key={imgIndex} className="space-y-2 pb-3 border-b border-pink-200 last:border-0 last:pb-0">
                                <p className="text-[9px] text-pink-600">사진 {imgIndex + 1}</p>
                                <InlineCropEditor
                                  imageUrl={imageUrl}
                                  settings={settings}
                                  onUpdate={(s) => updateWhyWeChoseImageSettings('bride', imgIndex, s)}
                                  aspectRatio={4/5}
                                  containerWidth={140}
                                  colorClass="pink"
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* 본문 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">본문 <span className="text-pink-500 text-[10px] ml-1">✦ 초안 작성 가능</span></Label>
                      <TextStyleControls
                        lineHeight={invitation.whyWeChoseTextStyle?.lineHeight}
                        textAlign={whyWeChose.bride?.textAlign ?? invitation.whyWeChoseTextStyle?.textAlign}
                        onLineHeightChange={(v) => updateNestedField('whyWeChoseTextStyle', { ...invitation.whyWeChoseTextStyle, lineHeight: v })}
                        onTextAlignChange={(v) => updateNestedField('whyWeChose.bride.textAlign', v)}
                      />
                      <HighlightTextarea
                        value={whyWeChose.bride?.description || ''}
                        onChange={(value) => updateNestedField('whyWeChose.bride.description', value)}
                        onFocus={() => setActiveSection('our-story')}
                        placeholder="상대방을 선택한 이유를 작성해주세요..."
                        rows={5}
                        className="bg-white text-sm leading-relaxed"
                      />
                    </div>

                    {/* 약속의 말 */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">약속의 말</Label>
                      <DebouncedInput
                        value={whyWeChose.bride?.quote || ''}
                        onChange={(value) => updateNestedField('whyWeChose.bride.quote', value)}
                        onFocus={() => setActiveSection('our-story')}
                        placeholder="예: 늘 처음처럼 행복하게 살겠습니다."
                        className="bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 처음 만난 날 - OUR 템플릿 전용, D-DAY 계산용 */}
      {!isFamily && !isMagazine && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> 처음 만난 날
          </h3>
          <div className="p-4 bg-rose-50 rounded-lg space-y-3">
            <p className="text-sm text-rose-700">두 분이 처음 만난 날짜를 입력해주세요. 청첩장에 함께한 시간이 표시됩니다.</p>
            <Input
              type="date"
              value={invitation.relationship.startDate || ''}
              onChange={(e) => updateNestedField('relationship.startDate', e.target.value)}
              className="bg-white"
            />
          </div>
        </section>
      )}

      {/* 갤러리 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg> 갤러리 <span className="text-xs font-normal text-gray-500">(최대 10장)</span>
        </h3>
        {/* 가이드 섹션 */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 mb-2"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 두 사람의 사진을 업로드해 주세요. 스토리에서 쓰지 않은 사진들이 잘 어울립니다.</p>
          <details className="text-xs text-blue-700">
            <summary className="cursor-pointer font-medium hover:text-blue-900"><svg className="w-3 h-3 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg> 가이드 보기</summary>
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-300">
              <p>
                디어드로어 청첩장은<br/>
                이야기와 사진이 함께 흐르는 스토리형 청첩장입니다.
              </p>
              <p>
                그래서 갤러리 파트는<br/>
                앞선 스토리 섹션에서 사용하지 않은 사진이나,<br/>
                가장 잘 나온 사진들로 구성해 주시면 좋아요.
              </p>
              <p>
                잡지처럼 한 장면 한 장면이 이어지도록,<br/>
                사진의 컨셉이 겹치지 않게 선택하는걸 추천드려요.
              </p>
              <div className="p-2 bg-white/50 rounded">
                <p className="font-medium mb-1"><svg className="w-3 h-3 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg> 이렇게 구성해 보세요</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>스토리에서 이미 사용한 사진은 피해주세요</li>
                  <li>비슷한 구도·표정의 사진은 줄이고, 다른 느낌의 사진을 골라보세요</li>
                </ul>
              </div>
              <div className="p-2 bg-white/50 rounded">
                <p className="font-medium mb-1"><svg className="w-3 h-3 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg> 추천 사진 예시</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>가장 마음에 드는 웨딩 촬영 컷</li>
                  <li>두 사람의 분위기가 잘 드러나는 장면</li>
                </ul>
              </div>
              <p className="text-blue-600"><svg className="w-3 h-3 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> 갤러리는 이야기를 반복하는 공간이 아니라, 이야기를 더 풍성하게 만드는 여백입니다.</p>
            </div>
          </details>
        </div>

        <MultiImageUploader
          images={invitation.gallery.images}
          onChange={(images) => updateNestedField('gallery.images', images)}
          onReorder={(newImages) => {
            const oldImages = invitation.gallery.images
            const currentSettings = invitation.gallery.imageSettings || []
            const newSettings = newImages.map((img) => {
              const oldIdx = oldImages.indexOf(img)
              return currentSettings[oldIdx] || { scale: 1.0, positionX: 0, positionY: 0 }
            })
            updateNestedField('gallery.images', newImages)
            updateNestedField('gallery.imageSettings', newSettings)
          }}
          sortable={true}
          maxImages={10}
          placeholder="사진 추가"
          aspectRatio="aspect-square"
        />

        {/* 갤러리 이미지 크롭 조정 */}
        {invitation.gallery.images.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-4">
            <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
            {invitation.gallery.images.map((imageUrl, imgIndex) => {
              const settings = invitation.gallery.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
              return (
                <div key={imgIndex} className="space-y-2 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                  <p className="text-[9px] text-gray-500">사진 {imgIndex + 1}</p>
                  <InlineCropEditor
                    imageUrl={imageUrl}
                    settings={settings}
                    onUpdate={(newSettings) => {
                      const currentSettings = [...(invitation.gallery.imageSettings || [])]
                      while (currentSettings.length <= imgIndex) {
                        currentSettings.push({ scale: 1.0, positionX: 0, positionY: 0 })
                      }
                      currentSettings[imgIndex] = { ...currentSettings[imgIndex], ...newSettings }
                      updateNestedField('gallery.imageSettings', currentSettings)
                    }}
                    aspectRatio={1}
                    containerWidth={140}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 유튜브 영상 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M6 4l3 6" /><path d="M12 4l3 6" /></svg> 영상
          </h3>
          <Switch
            checked={invitation.youtube?.enabled || false}
            onCheckedChange={(checked) => updateNestedField('youtube.enabled', checked)}
          />
        </div>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 유튜브 영상을 추가하세요. 갤러리 아래에 표시됩니다.</p>

        {invitation.youtube?.enabled && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">영상 제목</Label>
              <Input
                value={invitation.youtube?.title || ''}
                onChange={(e) => updateNestedField('youtube.title', e.target.value)}
                placeholder="우리의 웨딩 영상"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">유튜브 URL</Label>
              <Input
                value={invitation.youtube?.url || ''}
                onChange={(e) => updateNestedField('youtube.url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
              />
            </div>
            {invitation.youtube?.url && (() => {
              const url = invitation.youtube.url
              const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
              const videoId = match?.[1]
              if (!videoId) return (
                <p className="text-xs text-red-500">올바른 유튜브 URL을 입력해주세요.</p>
              )
              return (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )
            })()}
          </div>
        )}
      </section>

      {/* 인터뷰 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg> 인터뷰 <span className="text-[10px] font-normal text-green-600 bg-green-50 px-1.5 py-0.5 rounded">초안작성가능</span>
          </h3>
          <Switch
            checked={invitation.sectionVisibility.interview}
            onCheckedChange={() => toggleSectionVisibility('interview')}
          />
        </div>

        {invitation.sectionVisibility.interview && (
          <div className="space-y-4">

            {/* TIP 섹션 */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-2"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 결혼을 앞둔 두 분의 생각과 이야기를, 질문에 답하듯 솔직하게 들려주세요.</p>
              <details className="text-xs text-blue-700">
                <summary className="cursor-pointer font-medium hover:text-blue-900">가이드 보기</summary>
                <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-300">
                  <div>
                    <p className="font-medium text-blue-800 mb-1">질문 예시:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                      <li>왜 결혼을 결심하셨나요?</li>
                      <li>상대방에게 처음 끌린 점은요?</li>
                      <li>둘이서 가장 행복했던 순간은?</li>
                      <li>미래에 꼭 함께 하고 싶은 일이 있나요?</li>
                      <li>10년 뒤 우리의 모습은요?</li>
                      <li>상대방에게 한마디?</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800 mb-1">작성 팁:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                      <li>답변은 너무 길지 않게, 따뜻한 한두 문장이 더 기억에 남아요.</li>
                      <li>두 사람의 말투/느낌을 살려보세요.</li>
                      <li>꼭 멋진 말이 아니어도, 솔직한 이야기가 더 진정성 있습니다.</li>
                    </ul>
                  </div>
                </div>
              </details>
            </div>

            {/* 포토 디바이더 - 인터뷰 상단 (FAMILY 템플릿에서만) */}
            {isFamily && (
              <PhotoDividerEditor
                dividerIndex={2}
                label="인터뷰 상단 디바이더"
                defaultEnglishTitle="Our way to marriage"
                defaultKoreanText="같은 시간, 같은 마음으로\n하나의 계절을 준비하고 있습니다."
              />
            )}

            {/* 인터뷰 소개 문구 */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <Label className="text-xs font-medium">소개 문구</Label>
              <DebouncedInput
                value={invitation.content.interviewIntro || ''}
                onChange={(value) => updateNestedField('content.interviewIntro', value)}
                onFocus={() => setActiveSection('interview')}
                placeholder="결혼에 관한 우리의 이야기"
              />
              <p className="text-[10px] text-gray-400">인터뷰 섹션 상단에 표시되는 문구입니다</p>
            </div>

            {invitation.content.interviews.map((interview, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Q{index + 1}</span>
                  {invitation.content.interviews.length > 1 && (
                    <button
                      onClick={() => removeInterview(index)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">질문</Label>
                  <DebouncedInput
                    value={interview.question}
                    onChange={(value) => updateNestedField(`content.interviews.${index}.question`, value)}
                    onFocus={() => setActiveSection('interview')}
                    placeholder={SAMPLE_INTERVIEWS[index]?.question || '질문을 입력해주세요'}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">답변</Label>
                  <TextStyleControls
                    lineHeight={invitation.interviewTextStyle?.lineHeight}
                    textAlign={interview.textStyle?.textAlign}
                    onLineHeightChange={(v) => updateNestedField('interviewTextStyle', { ...invitation.interviewTextStyle, lineHeight: v })}
                    onTextAlignChange={(v) => updateNestedField(`content.interviews.${index}.textStyle`, { ...interview.textStyle, textAlign: v })}
                  />
                  <HighlightTextarea
                    value={interview.answer}
                    onChange={(value) => updateNestedField(`content.interviews.${index}.answer`, value)}
                    onFocus={() => setActiveSection('interview')}
                    placeholder={SAMPLE_INTERVIEWS[index]?.answer || '답변을 입력해주세요'}
                    rows={3}
                  />
                </div>
                {/* 인터뷰 이미지 */}
                <div className="space-y-1">
                  <Label className="text-xs">사진 ({isMagazine ? '메인 1장 + 서브 2장, 최대 3장' : '슬라이드 형식, 최대 2장'})</Label>
                  <MultiImageUploader
                    images={interview.images || []}
                    onChange={(images) => updateNestedField(`content.interviews.${index}.images`, images)}
                    maxImages={isMagazine ? 3 : 2}
                    placeholder="사진 추가"
                    aspectRatio="aspect-[4/5]"
                  />
                  {/* 이미지 크롭 조정 */}
                  {(interview.images?.length || 0) > 0 && (
                    <div className="mt-2 p-3 bg-white/70 rounded-lg space-y-3">
                      <p className="text-[10px] font-medium text-amber-700">이미지 크롭 조정</p>
                      {interview.images?.map((imageUrl, imgIndex) => {
                        const settings = interview.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
                        return (
                          <div key={imgIndex} className="space-y-2 pb-3 border-b border-amber-100 last:border-0 last:pb-0">
                            <p className="text-[9px] text-amber-600">사진 {imgIndex + 1}</p>
                            <InlineCropEditor
                              imageUrl={imageUrl}
                              settings={settings}
                              onUpdate={(s) => updateInterviewImageSettings(index, imgIndex, s)}
                              aspectRatio={4/5}
                              containerWidth={140}
                              colorClass="amber"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addInterview}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + 인터뷰 추가
            </button>
          </div>
        )}
      </section>

      {/* 안내사항 - 모든 템플릿에서 스토리 탭에 표시 (항상 펼쳐짐) */}
      <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 안내사항
          </h3>

          <div className="space-y-4">
            <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 하객분들께 전달할 안내사항을 작성해주세요. 필요한 항목만 켜서 사용하세요.</p>

              {/* 웨딩사진 */}
              <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg space-y-3">
                <Label className="text-sm font-medium text-rose-800">웨딩사진</Label>
                <p className="text-xs text-rose-600">안내사항 상단에 표시될 웨딩사진을 추가해주세요.</p>

                {invitation.guidance?.image ? (
                  <div className="space-y-3">
                    {/* 이미지 미리보기 */}
                    <div className="relative aspect-[4/5] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={invitation.guidance.image}
                        alt="웨딩사진"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => updateNestedField('guidance.image', '')}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* 이미지 크롭 조정 */}
                    <div className="p-3 bg-white/70 rounded-lg space-y-2">
                      <p className="text-[10px] font-medium text-rose-700">이미지 크롭 조정</p>
                      <InlineCropEditor
                        imageUrl={invitation.guidance.image}
                        settings={invitation.guidance.imageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                        onUpdate={(s) => updateNestedField('guidance.imageSettings', s)}
                        aspectRatio={4/5}
                        containerWidth={140}
                        colorClass="rose"
                      />
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="aspect-[4/5] w-full max-w-[200px] mx-auto border-2 border-dashed border-rose-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-rose-400 hover:bg-rose-50/50 transition-colors">
                      {uploadingImages.has('guidance-image') ? (
                        <div className="animate-spin w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Plus className="w-8 h-8 text-rose-400" />
                          <span className="text-xs text-rose-500">사진 추가</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImages.has('guidance-image')}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, 'guidance-image', (url) => {
                            updateNestedField('guidance.image', url)
                          })
                          e.target.value = ''
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-3">
                {/* 순서 변경 가능한 안내 항목들 */}
                {(() => {
                  const itemOrder = invitation.content.info.itemOrder || ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']

                  const moveItem = (itemId: string, direction: 'up' | 'down') => {
                    const currentIndex = itemOrder.indexOf(itemId)
                    if (currentIndex === -1) return
                    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
                    if (newIndex < 0 || newIndex >= itemOrder.length) return
                    const newOrder = [...itemOrder]
                    ;[newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]]
                    updateNestedField('content.info.itemOrder', newOrder)
                  }

                  const itemConfigs: Record<string, { label: string; placeholder: string; hasExtra?: boolean }> = {
                    dressCode: { label: '드레스코드', placeholder: '단정한 복장으로 와주세요.' },
                    photoBooth: { label: '포토부스 안내', placeholder: '로비에서 포토부스를 즐겨보세요!' },
                    photoShare: { label: '사진 공유', placeholder: '결혼식에서 찍은 사진들을 공유해주세요!', hasExtra: true },
                    flowerGift: { label: '꽃 답례품', placeholder: '꽃 답례품 안내를 입력해주세요.' },
                    flowerChild: { label: '화동 안내', placeholder: '화동 안내를 입력해주세요.' },
                    wreath: { label: '화환 안내', placeholder: '화환 대신 축의금으로 마음을 전해주시면 감사하겠습니다.' },
                    shuttle: { label: '셔틀버스 안내', placeholder: '셔틀버스 운행 안내를 입력해주세요.' },
                    reception: { label: '피로연 안내', placeholder: '피로연 안내를 입력해주세요.' },
                  }

                  return itemOrder.map((itemId, index) => {
                    const config = itemConfigs[itemId]
                    if (!config) return null
                    const itemData = invitation.content.info[itemId as keyof typeof invitation.content.info]
                    if (!itemData || typeof itemData !== 'object' || !('enabled' in itemData)) return null

                    return (
                      <div key={itemId} className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <div className="flex flex-col">
                              <button
                                onClick={() => moveItem(itemId, 'up')}
                                disabled={index === 0}
                                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="위로 이동"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveItem(itemId, 'down')}
                                disabled={index === itemOrder.length - 1}
                                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="아래로 이동"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <Label className="text-sm font-medium">{config.label}</Label>
                          </div>
                          <Switch
                            checked={itemData.enabled}
                            onCheckedChange={(checked) => updateNestedField(`content.info.${itemId}.enabled`, checked)}
                          />
                        </div>
                        {itemData.enabled && (
                          <div className="space-y-2">
                            <Textarea
                              value={itemData.content}
                              onChange={(e) => updateNestedField(`content.info.${itemId}.content`, e.target.value)}
                              rows={3}
                              className="resize-none"
                              placeholder={config.placeholder}
                            />
                            {itemId === 'photoShare' && (
                              <>
                                <Input
                                  value={(itemData as typeof invitation.content.info.photoShare).buttonText || ''}
                                  onChange={(e) => updateNestedField('content.info.photoShare.buttonText', e.target.value)}
                                  placeholder="버튼 텍스트 (예: 사진 공유하기)"
                                />
                                <Input
                                  value={(itemData as typeof invitation.content.info.photoShare).url || ''}
                                  onChange={(e) => updateNestedField('content.info.photoShare.url', e.target.value)}
                                  placeholder="공유 링크 URL (예: https://photos.google.com/...)"
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}

                {/* 커스텀 안내 항목들 */}
                {invitation.content.info.customItems?.map((item, index) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...(invitation.content.info.customItems || [])]
                          newItems[index] = { ...newItems[index], title: e.target.value }
                          updateNestedField('content.info.customItems', newItems)
                        }}
                        placeholder="항목 제목을 입력하세요"
                        className="text-sm font-medium flex-1 h-8 px-2.5 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={(checked) => {
                            const newItems = [...(invitation.content.info.customItems || [])]
                            newItems[index] = { ...newItems[index], enabled: checked }
                            updateNestedField('content.info.customItems', newItems)
                          }}
                        />
                        <button
                          onClick={() => {
                            const newItems = (invitation.content.info.customItems || []).filter((_, i) => i !== index)
                            updateNestedField('content.info.customItems', newItems)
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {item.enabled && (
                      <Textarea
                        value={item.content}
                        onChange={(e) => {
                          const newItems = [...(invitation.content.info.customItems || [])]
                          newItems[index] = { ...newItems[index], content: e.target.value }
                          updateNestedField('content.info.customItems', newItems)
                        }}
                        rows={3}
                        className="resize-none"
                        placeholder="안내 내용을 입력해주세요."
                      />
                    )}
                  </div>
                ))}

                {/* 커스텀 항목 추가 버튼 */}
                <button
                  onClick={() => {
                    const newItem = {
                      id: `custom-${Date.now()}`,
                      title: '새 안내사항',
                      content: '',
                      enabled: true
                    }
                    const newItems = [...(invitation.content.info.customItems || []), newItem]
                    updateNestedField('content.info.customItems', newItems)
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  + 안내사항 추가
                </button>
              </div>
            </div>
        </section>

      {/* 감사 인사 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /><path d="M12 5.67l3.5 3.5" /></svg> 감사 인사 <span className="text-[10px] font-normal text-green-600 bg-green-50 px-1.5 py-0.5 rounded">초안작성가능</span>
        </h3>

        {/* TIP 섹션 */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 mb-2"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 두 분의 진심이 담긴 감사 인사로, 청첩장을 마무리해 주세요.</p>
          <details className="text-xs text-blue-700">
            <summary className="cursor-pointer font-medium hover:text-blue-900">가이드 보기</summary>
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-blue-300">
              <p className="text-blue-700">바쁘신 중에도 축하해 주시는 분들께 감사 인사를 전할 수 있어요.</p>
              <div>
                <p className="font-medium text-blue-800 mb-1">작성 팁:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>형식적인 인사보다는, 진심으로 고마움이 느껴지는 말이 좋아요.</li>
                  <li>지금까지 응원해 주신 분들, 앞으로 함께할 분들에게 전하는 마음을 담아보세요.</li>
                </ul>
              </div>
            </div>
          </details>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">감사 메시지</Label>
            <HighlightTextarea
              value={invitation.content.thankYou.message}
              onChange={(value) => updateNestedField('content.thankYou.message', value)}
              placeholder={SAMPLE_THANK_YOU.message}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">서명</Label>
            <DebouncedInput
              value={invitation.content.thankYou.sign}
              onChange={(value) => updateNestedField('content.thankYou.sign', value)}
              placeholder={SAMPLE_THANK_YOU.sign}
            />
          </div>
        </div>
      </section>

      {/* 방명록 - 모든 템플릿에서 스토리 탭 최하단에 표시 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg> 방명록
          </h3>
          <Switch
            checked={invitation.sectionVisibility.guestbook}
            onCheckedChange={() => toggleSectionVisibility('guestbook')}
          />
        </div>
        <p className="text-sm text-blue-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 하객분들이 축하 메시지를 남길 수 있는 방명록이 표시됩니다.</p>

        <details>
          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 select-none">
            질문 예시 ) 펼쳐보기 <svg className="w-3 h-3 text-gray-900 inline -mt-0.5 ml-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          </summary>
          <div className="mt-2 space-y-2 text-xs text-blue-600">
            <div>
              <p className="font-semibold">① 기본 축하형</p>
              <ul className="ml-3 space-y-0.5 list-disc list-inside">
                <li>두 사람에게 해주고 싶은 말은?</li>
                <li>결혼을 축하하며 한마디 남긴다면?</li>
                <li>오늘의 축하 메시지를 한 문장으로 표현한다면?</li>
                <li>이 날을 기억하며 남기고 싶은 말은?</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">② 관계·조언형</p>
              <ul className="ml-3 space-y-0.5 list-disc list-inside">
                <li>결혼생활에서 가장 중요하다고 생각하는 건?</li>
                <li>신혼부부에게 꼭 해주고 싶은 조언 하나!</li>
                <li>부부로 오래 잘 지내는 비결이 있다면?</li>
                <li>힘들 때 꼭 기억했으면 하는 말은?</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">③ 감성·기억형</p>
              <ul className="ml-3 space-y-0.5 list-disc list-inside">
                <li>두 사람을 떠올리면 생각나는 단어 하나는?</li>
                <li>두 사람의 관계가 닮았다고 느껴지는 장면은?</li>
                <li>앞으로의 두 사람에게 바라는 모습이 있다면?</li>
                <li>나중에 이 방명록을 다시 볼 두 사람에게 하고 싶은 말은?</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">④ 첫인상·이미지형</p>
              <ul className="ml-3 space-y-0.5 list-disc list-inside">
                <li>두 사람의 첫인상은 어땠나요?</li>
                <li>함께 있을 때 가장 잘 어울린다고 느낀 순간은?</li>
                <li>주변에서 본 두 사람의 가장 좋은 모습은?</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">⑤ 가벼운 위트형</p>
              <ul className="ml-3 space-y-0.5 list-disc list-inside">
                <li>신랑·신부에게 각각 한마디씩 남긴다면?</li>
                <li>신혼집에 꼭 있어야 할 물건 하나 추천한다면?</li>
                <li>이 부부에게 붙여주고 싶은 별명은?</li>
                <li>10년 후 두 사람의 모습, 한 줄로 상상해본다면?</li>
                <li>오늘 축하 점수! (100점 만점 중 몇 점?)</li>
              </ul>
            </div>
          </div>
        </details>

        {invitation.sectionVisibility.guestbook && (
          <div className="space-y-4">
            {/* 방명록 질문 설정 */}
            <div className="p-4 bg-amber-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-amber-800"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> 질문 설정 (최대 10개)</p>
                <span className="text-xs text-amber-600">{invitation.content.guestbookQuestions?.length || 0}/10</span>
              </div>
              <p className="text-xs text-amber-700">하객분들에게 보여질 질문을 설정하세요. 질문이 랜덤으로 표시됩니다.</p>

              <div className="space-y-2">
                {(invitation.content.guestbookQuestions || []).map((question, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 w-5">{index + 1}.</span>
                    <Input
                      value={question}
                      onChange={(e) => {
                        const newQuestions = [...(invitation.content.guestbookQuestions || [])]
                        newQuestions[index] = e.target.value
                        updateNestedField('content.guestbookQuestions', newQuestions)
                      }}
                      placeholder="질문을 입력하세요"
                      className="flex-1 bg-white text-sm"
                    />
                    <button
                      onClick={() => {
                        const newQuestions = (invitation.content.guestbookQuestions || []).filter((_, i) => i !== index)
                        updateNestedField('content.guestbookQuestions', newQuestions)
                      }}
                      className="p-1.5 text-amber-600 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 질문 추가 버튼 */}
              {(invitation.content.guestbookQuestions?.length || 0) < 10 && (
                <button
                  onClick={() => {
                    const newQuestions = [...(invitation.content.guestbookQuestions || []), '']
                    updateNestedField('content.guestbookQuestions', newQuestions)
                  }}
                  className="w-full py-2 border-2 border-dashed border-amber-300 rounded-lg text-sm text-amber-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-100/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  질문 추가
                </button>
              )}

            </div>
          </div>
        )}
      </section>
    </div>
  )
}
