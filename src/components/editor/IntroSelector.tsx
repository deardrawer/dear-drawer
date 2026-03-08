'use client'

import { useState, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { introPresets, IntroPresetId, IntroSettings, getPresetById, availableFonts, presetAccentColors, presetCustomColors } from '@/lib/introPresets'
import { uploadImage } from '@/lib/imageUpload'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import { ImageSettings } from '@/store/editorStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, ChevronDown, ChevronLeft, Info, Sparkles, Type, Settings2, Image as ImageIcon, Upload, Palette, X } from 'lucide-react'

interface IntroSelectorProps {
  onBack?: () => void
}

// BGM 프리셋은 @/lib/bgmPresets에서 import

export default function IntroSelector({ onBack }: IntroSelectorProps) {
  const { invitation, updateIntroPreset, updateIntroField, updateNestedField } = useEditorStore()
  const [activeTab, setActiveTab] = useState<'preset' | 'customize'>('preset')
  const [isPresetListOpen, setIsPresetListOpen] = useState(false)
  const [isIntroUploading, setIsIntroUploading] = useState(false)
  const [isCoverUploading, setIsCoverUploading] = useState(false)
  const introFileInputRef = useRef<HTMLInputElement>(null)
  const coverFileInputRef = useRef<HTMLInputElement>(null)

  if (!invitation) return null

  const { intro } = invitation
  const currentPreset = getPresetById(intro.presetId)

  const handlePresetSelect = (presetId: IntroPresetId) => {
    updateIntroPreset(presetId)
  }

  const handleFieldChange = <K extends keyof IntroSettings>(field: K, value: IntroSettings[K]) => {
    updateIntroField(field, value)
  }

  // 인트로 전용 이미지 업로드 핸들러
  const handleIntroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 30 * 1024 * 1024) {
      alert('파일 크기는 30MB 이하여야 합니다.')
      return
    }

    setIsIntroUploading(true)
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        handleFieldChange('introImage', result.webUrl as string)
        handleFieldChange('introImageSettings', undefined as any)
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Intro image upload failed:', error)
      alert('이미지 업로드에 실패했습니다.')
    }
    setIsIntroUploading(false)
  }

  // 인트로 전용 이미지 삭제
  const handleRemoveIntroImage = () => {
    handleFieldChange('introImage', '' as any)
    handleFieldChange('introImageSettings', undefined as any)
    if (introFileInputRef.current) {
      introFileInputRef.current.value = ''
    }
  }

  // 커버 이미지 업로드 핸들러
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 30 * 1024 * 1024) {
      alert('파일 크기는 30MB 이하여야 합니다.')
      return
    }

    setIsCoverUploading(true)
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        updateNestedField('media.coverImage', result.webUrl)
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Cover image upload failed:', error)
      alert('이미지 업로드에 실패했습니다.')
    }
    setIsCoverUploading(false)
  }

  // 커버 이미지 삭제
  const handleRemoveCoverImage = () => {
    updateNestedField('media.coverImage', '')
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = ''
    }
  }

  const accentColor = intro.accentColor || presetAccentColors[intro.presetId] || '#d4a574'

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">인트로 애니메이션</h2>
          <p className="text-xs text-gray-500">첫 화면에서 1회 재생됩니다</p>
        </div>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preset' | 'customize')} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-3" style={{ width: 'calc(100% - 32px)' }}>
          <TabsTrigger value="preset" className="text-sm">
            <Sparkles className="w-4 h-4 mr-1.5" />
            스타일 선택
          </TabsTrigger>
          <TabsTrigger value="customize" className="text-sm">
            <Settings2 className="w-4 h-4 mr-1.5" />
            커스터마이징
          </TabsTrigger>
        </TabsList>

        {/* 프리셋 선택 탭 */}
        <TabsContent value="preset" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4 space-y-6">
              {/* 인트로 사진 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">인트로 사진</h3>
                </div>
                <p className="text-xs text-gray-500">
                  인트로에 표시할 사진을 설정합니다. 비워두면 커버 사진이 사용됩니다.
                </p>

                <input
                  ref={introFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIntroImageUpload}
                  className="hidden"
                />

                {intro.introImage ? (
                  <div className="space-y-2">
                    <InlineCropEditor
                      imageUrl={intro.introImage}
                      settings={intro.introImageSettings || {}}
                      onUpdate={(s) => handleFieldChange('introImageSettings', { ...(intro.introImageSettings || { scale: 1, positionX: 0, positionY: 0 }), ...s } as any)}
                      aspectRatio={9 / 16}
                      containerWidth={200}
                    />
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => introFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
                      >
                        사진 변경
                      </button>
                      <button
                        onClick={handleRemoveIntroImage}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs text-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => introFileInputRef.current?.click()}
                    disabled={isIntroUploading}
                    className="w-full max-w-[160px] mx-auto aspect-[9/16] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {isIntroUploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-300" />
                        <span className="text-[11px] text-gray-400">인트로 사진 추가</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 구분선 */}
              <div className="border-t" />

              {/* 애니메이션 스타일 섹션 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">애니메이션 스타일</h3>
                </div>

                {/* 안내 문구 */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm mb-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-blue-700">
                    원하는 스타일을 선택하면 바로 미리보기에서 확인할 수 있어요.
                  </p>
                </div>

                {/* 프리셋 카드 목록 */}
                <div className="grid gap-3">
                  {introPresets.map((preset) => {
                    const isSelected = intro.presetId === preset.id
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset.id)}
                        className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {/* 선택 표시 */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* 프리셋 정보 */}
                        <div className="pr-8">
                          <h3 className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                            {preset.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{preset.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 구분선 */}
              <div className="border-t" />

              {/* 커버 이미지 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">커버 이미지</h3>
                </div>
                <p className="text-xs text-gray-500">
                  청첩장 본문에 표시되는 대표 사진입니다.
                </p>

                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />

                {invitation.media?.coverImage ? (
                  <div className="space-y-2">
                    <InlineCropEditor
                      imageUrl={invitation.media.coverImage}
                      settings={invitation.media.coverImageSettings || {}}
                      onUpdate={(s) => updateNestedField('media.coverImageSettings', { ...(invitation.media?.coverImageSettings || { scale: 1, positionX: 0, positionY: 0 }), ...s })}
                      aspectRatio={9 / 16}
                      containerWidth={200}
                    />
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => coverFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
                      >
                        사진 변경
                      </button>
                      <button
                        onClick={handleRemoveCoverImage}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs text-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={isCoverUploading}
                    className="w-full max-w-[160px] mx-auto aspect-[9/16] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {isCoverUploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-300" />
                        <span className="text-[11px] text-gray-400">커버 사진 추가</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </ScrollArea>
        </TabsContent>

        {/* 커스터마이징 탭 */}
        <TabsContent value="customize" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4 space-y-6">
              {/* 현재 선택된 프리셋 표시 + 펼쳐보기 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setIsPresetListOpen(!isPresetListOpen)}
                    className="flex-1 flex items-center justify-between gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        <strong>{currentPreset?.name}</strong>
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isPresetListOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-pink-300 bg-pink-50 text-pink-600 hover:bg-pink-100 hover:border-pink-400 text-xs px-3 shrink-0"
                    onClick={() => {
                      if (currentPreset) {
                        const defaults = currentPreset.defaults
                        Object.entries(defaults).forEach(([key, value]) => {
                          if (value !== undefined) {
                            handleFieldChange(key as keyof IntroSettings, value as IntroSettings[keyof IntroSettings])
                          }
                        })
                      }
                    }}
                  >
                    기본값 복원
                  </Button>
                </div>

                {/* 프리셋 목록 드롭다운 */}
                {isPresetListOpen && (
                  <div className="grid gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    {introPresets.map((preset) => {
                      const isSelected = intro.presetId === preset.id
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            handlePresetSelect(preset.id)
                            setIsPresetListOpen(false)
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-white text-gray-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          <span className={isSelected ? '' : 'ml-5.5'}>{preset.name}</span>
                          <span className="text-[11px] text-gray-400 ml-auto">{preset.description}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 텍스트 편집 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">텍스트 편집</h3>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  클릭해서 바로 수정할 수 있어요. 비워두면 표시되지 않습니다.
                </p>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-700">메인 타이틀</Label>
                    <Input
                      value={intro.mainTitle}
                      onChange={(e) => handleFieldChange('mainTitle', e.target.value)}
                      placeholder={currentPreset?.defaults.mainTitle || '메인 타이틀을 입력하세요'}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-gray-700">서브 문구</Label>
                    <Input
                      value={intro.subTitle}
                      onChange={(e) => handleFieldChange('subTitle', e.target.value)}
                      placeholder={currentPreset?.defaults.subTitle || '서브 문구를 입력하세요'}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-gray-700">날짜 (수동입력)</Label>
                    <Input
                      value={intro.dateText}
                      onChange={(e) => handleFieldChange('dateText', e.target.value)}
                      placeholder={currentPreset?.defaults.dateText || '예: 2025. 05. 24'}
                      className="mt-1"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      비워두면 결혼 정보의 날짜가 자동 표시됩니다.
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-700">장소</Label>
                    <Input
                      value={intro.venueText}
                      onChange={(e) => handleFieldChange('venueText', e.target.value)}
                      placeholder={currentPreset?.defaults.venueText || '예: 더채플앳청담'}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 텍스트 스타일 섹션 */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">텍스트 스타일</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm text-gray-700">제목 크기</Label>
                      <span className="text-sm text-gray-500">{intro.titleFontSize}px</span>
                    </div>
                    <Slider
                      value={[intro.titleFontSize]}
                      onValueChange={([v]) => handleFieldChange('titleFontSize', v)}
                      min={14}
                      max={32}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm text-gray-700">자간</Label>
                      <span className="text-sm text-gray-500">{intro.titleLetterSpacing}px</span>
                    </div>
                    <Slider
                      value={[intro.titleLetterSpacing]}
                      onValueChange={([v]) => handleFieldChange('titleLetterSpacing', v)}
                      min={0}
                      max={8}
                      step={0.5}
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">폰트</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableFonts.map((font) => (
                        <button
                          key={font.value}
                          onClick={() => handleFieldChange('titleFontFamily', font.value)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                            intro.titleFontFamily === font.value
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* 컬러 설정 (제목 + 포인트 + 프리셋별 통합) */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">컬러 설정</h3>
                </div>

                {/* 제목 색상 */}
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">제목 색상</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['#ffffff', '#f5f5f5', '#d4a574', '#c9a86c', '#8b7355', '#2c3e50', '#1a1a1a'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleFieldChange('titleColor', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          intro.titleColor === color ? 'border-primary scale-110' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={intro.titleColor || '#ffffff'}
                      onChange={(e) => handleFieldChange('titleColor', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 포인트 색상 */}
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">포인트 색상</Label>
                  <p className="text-[11px] text-gray-400 mb-2">구분선, 장식 요소</p>
                  <div className="flex gap-2 flex-wrap">
                    {['#d4a574', '#c9a86c', '#d4a0a0', '#0891b2', '#8b7355', '#374151', '#9ca3af', '#e8a0b0', '#F8F6F3', '#1a1a1a'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleFieldChange('accentColor', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          accentColor === color ? 'border-primary scale-110' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => handleFieldChange('accentColor', e.target.value)}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 오버레이 색상 - cinematic, blur, letter */}
                  {['cinematic', 'blur', 'letter'].includes(intro.presetId) && (
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">오버레이 색상</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['#000000', '#1a1a1a', '#2c3e50', '#1e3a5f', '#3d1f00', '#4a0e2e'].map((color) => (
                          <button
                            key={color}
                            onClick={() => handleFieldChange('overlayColor', color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              (intro.overlayColor || presetCustomColors[intro.presetId]?.overlayColor || '#000000') === color ? 'border-primary scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={intro.overlayColor || presetCustomColors[intro.presetId]?.overlayColor || '#000000'}
                          onChange={(e) => handleFieldChange('overlayColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* 배경색 - petal, film, filmstrip */}
                  {['petal', 'film', 'filmstrip'].includes(intro.presetId) && (
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">배경색</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['#FDF6F4', '#F5F3F0', '#F8F6F3', '#FFFFFF', '#1a1a1a', '#2c2c2c', '#F0EDE8', '#E8E0D4'].map((color) => (
                          <button
                            key={color}
                            onClick={() => handleFieldChange('bgColor', color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              (intro.bgColor || presetCustomColors[intro.presetId]?.bgColor || '#F8F6F3') === color ? 'border-primary scale-110' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={intro.bgColor || presetCustomColors[intro.presetId]?.bgColor || '#F8F6F3'}
                          onChange={(e) => handleFieldChange('bgColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* 웨이브 색상 - typing */}
                  {intro.presetId === 'typing' && (
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">웨이브 색상</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['#FAF8F5', '#F8F6F3', '#FDF6F4', '#FFFFFF', '#F0EDE8', '#E8E0D4', '#f5f0e8', '#e8ddd0'].map((color) => (
                          <button
                            key={color}
                            onClick={() => handleFieldChange('waveColor', color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              (intro.waveColor || '#FAF8F5') === color ? 'border-primary scale-110' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={intro.waveColor || '#FAF8F5'}
                          onChange={(e) => handleFieldChange('waveColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* 봉투 색상 - letter */}
                  {intro.presetId === 'letter' && (
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">봉투 색상</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['#f5f0e8', '#F8F6F3', '#e8ddd0', '#d4c5b0', '#FFFFFF', '#f0e6d8', '#e5d5c5', '#ddd0c0'].map((color) => (
                          <button
                            key={color}
                            onClick={() => handleFieldChange('envelopeColor', color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              (intro.envelopeColor || '#f5f0e8') === color ? 'border-primary scale-110' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={intro.envelopeColor || '#f5f0e8'}
                          onChange={(e) => handleFieldChange('envelopeColor', e.target.value)}
                          className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* 기본값 복원 버튼 */}
                  <button
                    onClick={() => {
                      const defaults = presetCustomColors[intro.presetId]
                      if (defaults?.overlayColor !== undefined) handleFieldChange('overlayColor', defaults.overlayColor as any)
                      if (defaults?.bodyTextColor !== undefined) handleFieldChange('bodyTextColor', defaults.bodyTextColor as any)
                      if (defaults?.bgColor !== undefined) handleFieldChange('bgColor', defaults.bgColor as any)
                      if (defaults?.waveColor !== undefined) handleFieldChange('waveColor', defaults.waveColor as any)
                      if (defaults?.envelopeColor !== undefined) handleFieldChange('envelopeColor', defaults.envelopeColor as any)
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    프리셋 컬러 기본값으로
                  </button>
                </div>
              </div>

            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
