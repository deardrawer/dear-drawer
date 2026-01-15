'use client'

import { useState, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { introPresets, IntroPresetId, IntroSettings, getPresetById, availableFonts } from '@/lib/introPresets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, ChevronLeft, Info, Sparkles, Type, Image as ImageIcon, Settings2, Upload, X } from 'lucide-react'
import { uploadImage } from '@/lib/imageUpload'

interface IntroSelectorProps {
  onBack?: () => void
}

export default function IntroSelector({ onBack }: IntroSelectorProps) {
  const { invitation, updateIntroPreset, updateIntroField, updateNestedField } = useEditorStore()
  const [activeTab, setActiveTab] = useState<'preset' | 'customize'>('preset')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!invitation) return null

  const coverImage = invitation.media.coverImage

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (30MB - uploadImage에서 자체 검증도 함)
    if (file.size > 30 * 1024 * 1024) {
      alert('파일 크기는 30MB 이하여야 합니다.')
      return
    }

    setIsUploading(true)
    try {
      // 먼저 기존 이미지를 제거하고 transform 값을 초기화
      updateNestedField('media.coverImage', '')
      updateIntroField('backgroundScale', 100)
      updateIntroField('backgroundPositionX', 50)
      updateIntroField('backgroundPositionY', 50)
      updateIntroField('backgroundBrightness', 100)

      // R2에 업로드
      const result = await uploadImage(file)

      if (result.success && result.webUrl) {
        // 새 이미지 설정 (초기화 후)
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

  // 이미지 삭제 핸들러
  const handleRemoveImage = () => {
    updateNestedField('media.coverImage', '')
    // transform 값도 초기화
    updateIntroField('backgroundScale', 100)
    updateIntroField('backgroundPositionX', 50)
    updateIntroField('backgroundPositionY', 50)
    updateIntroField('backgroundBrightness', 100)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const { intro } = invitation
  const currentPreset = getPresetById(intro.presetId)

  const handlePresetSelect = (presetId: IntroPresetId) => {
    updateIntroPreset(presetId)
  }

  const handleFieldChange = <K extends keyof IntroSettings>(field: K, value: IntroSettings[K]) => {
    updateIntroField(field, value)
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
            <div className="p-4 space-y-4">
              {/* 커버 사진 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">커버 사진</h3>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {coverImage ? (
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {/* 원본 이미지 기준으로 zoom/pan 적용 */}
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url(${coverImage})`,
                          backgroundSize: intro.backgroundScale <= 100 ? 'cover' : `${intro.backgroundScale}%`,
                          backgroundPosition: `${intro.backgroundPositionX}% ${intro.backgroundPositionY}%`,
                          backgroundRepeat: 'no-repeat',
                          filter: `brightness(${intro.backgroundBrightness / 100})`,
                        }}
                      />
                    </div>
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white text-xs transition-colors"
                    >
                      변경
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500">클릭하여 커버 사진 추가</span>
                        <span className="text-xs text-gray-400">권장: 3:4 비율</span>
                      </>
                    )}
                  </button>
                )}

                {/* 이미지 조절 옵션 (이미지가 있을 때만 표시) */}
                {coverImage && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <Label className="text-xs text-gray-600">사진 크기</Label>
                        <span className="text-xs text-gray-500">{intro.backgroundScale}%</span>
                      </div>
                      <Slider
                        value={[intro.backgroundScale]}
                        onValueChange={([v]) => handleFieldChange('backgroundScale', v)}
                        min={100}
                        max={150}
                        step={5}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5">
                        <Label className="text-xs text-gray-600">가로 위치</Label>
                        <span className="text-xs text-gray-500">{intro.backgroundPositionX}%</span>
                      </div>
                      <Slider
                        value={[intro.backgroundPositionX]}
                        onValueChange={([v]) => handleFieldChange('backgroundPositionX', v)}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5">
                        <Label className="text-xs text-gray-600">세로 위치</Label>
                        <span className="text-xs text-gray-500">{intro.backgroundPositionY}%</span>
                      </div>
                      <Slider
                        value={[intro.backgroundPositionY]}
                        onValueChange={([v]) => handleFieldChange('backgroundPositionY', v)}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div>
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
                )}
              </div>

              {/* 구분선 */}
              <div className="border-t pt-4">
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
