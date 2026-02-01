'use client'

import { useState, useRef } from 'react'
import { useEditorStore, ImageSettings } from '@/store/editorStore'
import { introPresets, IntroPresetId, IntroSettings, getPresetById, availableFonts } from '@/lib/introPresets'
import { uploadImage } from '@/lib/imageUpload'
import { bgmPresets } from '@/lib/bgmPresets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, ChevronLeft, Info, Sparkles, Type, Settings2, Music, Image as ImageIcon, Upload, X } from 'lucide-react'
import InlineCropEditor from './InlineCropEditor'

interface IntroSelectorProps {
  onBack?: () => void
}

// BGM 프리셋은 @/lib/bgmPresets에서 import

export default function IntroSelector({ onBack }: IntroSelectorProps) {
  const { invitation, updateIntroPreset, updateIntroField, updateField, updateNestedField } = useEditorStore()
  const [activeTab, setActiveTab] = useState<'preset' | 'customize'>('preset')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!invitation) return null

  const { intro, bgm, media } = invitation
  const coverImage = media.coverImage
  const currentPreset = getPresetById(intro.presetId)

  const handlePresetSelect = (presetId: IntroPresetId) => {
    updateIntroPreset(presetId)
  }

  const handleFieldChange = <K extends keyof IntroSettings>(field: K, value: IntroSettings[K]) => {
    updateIntroField(field, value)
  }

  // 커버 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 30 * 1024 * 1024) {
      alert('파일 크기는 30MB 이하여야 합니다.')
      return
    }

    setIsUploading(true)
    try {
      updateNestedField('media.coverImage', '')
      updateNestedField('media.coverImageSettings', undefined)
      updateIntroField('backgroundBrightness', 100)

      const result = await uploadImage(file)

      if (result.success && result.webUrl) {
        setTimeout(() => {
          updateNestedField('media.coverImage', result.webUrl as string)
          setIsUploading(false)
        }, 50)
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
        setIsUploading(false)
      }
    } catch (error) {
      console.error('Image upload failed:', error)
      alert('이미지 업로드에 실패했습니다.')
      setIsUploading(false)
    }
  }

  // 커버 이미지 삭제 핸들러
  const handleRemoveImage = () => {
    updateNestedField('media.coverImage', '')
    updateNestedField('media.coverImageSettings', undefined)
    updateIntroField('backgroundBrightness', 100)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
              {/* 커버 이미지 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">커버 이미지</h3>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {coverImage ? (
                  <div className="space-y-3">
                    {/* 크롭 에디터 */}
                    <InlineCropEditor
                      imageUrl={coverImage}
                      settings={media.coverImageSettings || {}}
                      onUpdate={(settings) => updateNestedField('media.coverImageSettings', { ...media.coverImageSettings, ...settings })}
                      aspectRatio={9/16}
                      containerWidth={180}
                      colorClass="rose"
                    />

                    {/* 버튼들 */}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors"
                      >
                        사진 변경
                      </button>
                      <button
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs text-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>

                    {/* 밝기 조절 */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between mb-1.5">
                        <Label className="text-xs text-gray-600">밝기</Label>
                        <span className="text-xs text-gray-500">{intro.backgroundBrightness}%</span>
                      </div>
                      <Slider
                        value={[intro.backgroundBrightness]}
                        onValueChange={([v]) => handleFieldChange('backgroundBrightness', v)}
                        min={30}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full max-w-[180px] mx-auto aspect-[9/16] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500">커버 사진 추가</span>
                        <span className="text-[10px] text-gray-400">권장: 9:16 비율</span>
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

              {/* 텍스트 편집 섹션 (스타일 선택 탭) */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">텍스트 편집</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  선택한 스타일의 텍스트를 수정할 수 있어요.
                </p>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600">메인 타이틀</Label>
                    <Input
                      value={intro.mainTitle}
                      onChange={(e) => handleFieldChange('mainTitle', e.target.value)}
                      placeholder={currentPreset?.defaults.mainTitle || '메인 타이틀'}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">서브 문구</Label>
                    <Input
                      value={intro.subTitle}
                      onChange={(e) => handleFieldChange('subTitle', e.target.value)}
                      placeholder={currentPreset?.defaults.subTitle || '서브 문구'}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">폰트</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {availableFonts.map((font) => (
                        <button
                          key={font.value}
                          onClick={() => handleFieldChange('titleFontFamily', font.value)}
                          className={`px-2 py-1.5 text-xs rounded-md border transition-all ${
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
            </div>
          </ScrollArea>
        </TabsContent>

        {/* 커스터마이징 탭 */}
        <TabsContent value="customize" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4 space-y-6">
              {/* 현재 선택된 프리셋 표시 */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  <strong>{currentPreset?.name}</strong> 스타일 편집 중
                </span>
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
                    <Label className="text-sm text-gray-700">날짜</Label>
                    <Input
                      value={intro.dateText}
                      onChange={(e) => handleFieldChange('dateText', e.target.value)}
                      placeholder={currentPreset?.defaults.dateText || '예: 2025. 05. 24'}
                      className="mt-1"
                    />
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
                    </div>
                  </div>
                </div>
              </div>

              {/* 배경음악 섹션 */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">배경음악</h3>
                  </div>
                  <Switch
                    checked={bgm.enabled}
                    onCheckedChange={(checked) => updateField('bgm', { ...bgm, enabled: checked })}
                  />
                </div>

                {bgm.enabled && (
                  <div className="space-y-2">
                    {bgmPresets.map((preset) => {
                      const isSelected = bgm.url === preset.url
                      return (
                        <button
                          key={preset.id}
                          onClick={() => updateField('bgm', { ...bgm, url: preset.url, enabled: true })}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isSelected ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Music className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 block">{preset.name}</span>
                            <span className="text-xs text-gray-400">{preset.description}</span>
                          </div>
                        </button>
                      )
                    })}

                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={bgm.autoplay}
                        onCheckedChange={(checked) => updateField('bgm', { ...bgm, autoplay: checked })}
                      />
                      <span className="text-sm text-gray-600">자동 재생</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      * 자동 재생은 브라우저 정책에 따라 지원되지 않을 수 있습니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 기본값 복원 버튼 */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
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
                  기본값으로 복원
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
