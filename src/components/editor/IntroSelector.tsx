'use client'

import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { introPresets, IntroPresetId, IntroSettings, getPresetById } from '@/lib/introPresets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, ChevronLeft, Info, Sparkles, Type, Image as ImageIcon, Settings2 } from 'lucide-react'

interface IntroSelectorProps {
  onBack?: () => void
}

export default function IntroSelector({ onBack }: IntroSelectorProps) {
  const { invitation, updateIntroPreset, updateIntroField } = useEditorStore()
  const [activeTab, setActiveTab] = useState<'preset' | 'customize'>('preset')

  if (!invitation) return null

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
            <div className="p-4 space-y-3">
              {/* 안내 문구 */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-blue-700">
                  원하는 스타일을 선택하면 바로 미리보기에서 확인할 수 있어요.
                  선택 후 텍스트와 스타일을 자유롭게 수정할 수 있습니다.
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

                      {/* 미리보기 키워드 태그 */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {preset.defaults.mainTitle && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            &ldquo;{preset.defaults.mainTitle.slice(0, 15)}...&rdquo;
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
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

              {/* 배경 설정 섹션 */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">배경 설정</h3>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  커버 이미지가 배경으로 사용됩니다
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm text-gray-700">사진 크기</Label>
                      <span className="text-sm text-gray-500">{intro.backgroundScale}%</span>
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
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm text-gray-700">밝기</Label>
                      <span className="text-sm text-gray-500">{intro.backgroundBrightness}%</span>
                    </div>
                    <Slider
                      value={[intro.backgroundBrightness]}
                      onValueChange={([v]) => handleFieldChange('backgroundBrightness', v)}
                      min={30}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm text-gray-700">오버레이 농도</Label>
                      <span className="text-sm text-gray-500">{intro.overlayOpacity}%</span>
                    </div>
                    <Slider
                      value={[intro.overlayOpacity]}
                      onValueChange={([v]) => handleFieldChange('overlayOpacity', v)}
                      min={0}
                      max={80}
                      step={5}
                    />
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
