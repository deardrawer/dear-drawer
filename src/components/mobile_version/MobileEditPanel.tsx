'use client'

import { useState, useRef, useEffect } from 'react'
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
import { useEditorStore } from '@/store/editorStore'
import { Palette, FileText, Heart, Settings, Music, Play, Pause } from 'lucide-react'
import { bgmPresets } from '@/lib/bgmPresets'

/**
 * 모바일 최적화 Edit Panel
 *
 * 주요 최적화:
 * 1. 터치 타겟: 최소 44px (iOS) / 48px (Material Design)
 * 2. 탭 네비게이션: 아이콘 중심, 텍스트는 작게
 * 3. 입력 필드: font-size 16px 이상 (iOS 자동 줌 방지)
 * 4. Switch: 크기 확대 (scale-125)
 * 5. 아코디언: 전체 너비 탭 영역
 * 6. 여백: 터치하기 편한 충분한 패딩
 */

interface MobileEditPanelProps {
  onOpenIntroSelector?: () => void
  invitationId?: string | null
  templateId?: string
}

export default function MobileEditPanel({ onOpenIntroSelector, invitationId, templateId }: MobileEditPanelProps) {
  const {
    invitation,
    updateField,
    updateNestedField,
    toggleSectionVisibility,
    setActiveSection
  } = useEditorStore()

  // BGM 미리듣기 관련
  const bgmAudioRef = useRef<HTMLAudioElement>(null)
  const [previewingBgmId, setPreviewingBgmId] = useState<string | null>(null)
  const [isCustomBgm, setIsCustomBgm] = useState(false)

  // 각 탭의 아코디언 열림 상태 관리
  const [designAccordion, setDesignAccordion] = useState<string[]>(['design-theme'])
  const [requiredAccordion, setRequiredAccordion] = useState<string[]>(['couple-basic'])
  const [storyAccordion, setStoryAccordion] = useState<string[]>([])
  const [extrasAccordion, setExtrasAccordion] = useState<string[]>([])

  if (!invitation) return null

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 모바일 최적화 탭 네비게이션 */}
      <Tabs defaultValue="required" className="flex-1 flex flex-col min-h-0">
        <div className="border-b bg-white shrink-0 sticky top-0 z-20">
          <TabsList className="w-full h-auto p-1.5 bg-gray-50 rounded-none grid grid-cols-4 gap-1">
            {/* 디자인 탭 */}
            <TabsTrigger
              value="design"
              className="
                flex flex-col items-center gap-1 py-3 px-2
                min-h-[48px]
                text-xs font-medium
                data-[state=active]:bg-white data-[state=active]:shadow-sm
                rounded-lg
                touch-manipulation
                transition-colors
              "
            >
              <Palette className="w-5 h-5" />
              <span className="leading-none">디자인</span>
            </TabsTrigger>

            {/* 필수입력 탭 */}
            <TabsTrigger
              value="required"
              className="
                flex flex-col items-center gap-1 py-3 px-2
                min-h-[48px]
                text-xs font-medium
                data-[state=active]:bg-white data-[state=active]:shadow-sm
                rounded-lg
                touch-manipulation
                transition-colors
              "
            >
              <FileText className="w-5 h-5" />
              <span className="leading-none">필수</span>
            </TabsTrigger>

            {/* 스토리 탭 */}
            <TabsTrigger
              value="story"
              className="
                flex flex-col items-center gap-1 py-3 px-2
                min-h-[48px]
                text-xs font-medium
                data-[state=active]:bg-white data-[state=active]:shadow-sm
                rounded-lg
                touch-manipulation
                transition-colors
              "
            >
              <Heart className="w-5 h-5" />
              <span className="leading-none">스토리</span>
            </TabsTrigger>

            {/* 추가기능 탭 */}
            <TabsTrigger
              value="extras"
              className="
                flex flex-col items-center gap-1 py-3 px-2
                min-h-[48px]
                text-xs font-medium
                data-[state=active]:bg-white data-[state=active]:shadow-sm
                rounded-lg
                touch-manipulation
                transition-colors
              "
            >
              <Settings className="w-5 h-5" />
              <span className="leading-none">추가</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== 디자인 탭 ==================== */}
        <TabsContent value="design" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <Accordion type="multiple" value={designAccordion} onValueChange={setDesignAccordion} className="w-full">

            {/* 배경음악 */}
            <AccordionItem value="design-bgm" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 min-h-[56px] touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-base">배경음악</div>
                    <div className="text-xs text-gray-500">{invitation.bgm?.enabled ? '사용 중' : '미사용'}</div>
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

                {/* BGM 사용 ON/OFF - 모바일 최적화 Switch */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl min-h-[64px]">
                  <div>
                    <p className="text-sm font-medium">배경음악 사용</p>
                    <p className="text-xs text-gray-500 mt-0.5">청첩장에 음악을 추가해요</p>
                  </div>
                  {/* Switch 크기 확대 */}
                  <div className="scale-125">
                    <Switch
                      checked={invitation.bgm?.enabled ?? false}
                      onCheckedChange={(checked) => {
                        updateNestedField('bgm.enabled', checked)
                        if (!checked && bgmAudioRef.current) {
                          bgmAudioRef.current.pause()
                          setPreviewingBgmId(null)
                        }
                      }}
                    />
                  </div>
                </div>

                {invitation.bgm?.enabled && (
                  <>
                    {/* BGM 프리셋 리스트 */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">음악 선택</Label>
                      <div className="space-y-2">
                        {bgmPresets.map((preset) => {
                          const isSelected = !isCustomBgm && invitation.bgm?.url === preset.url
                          const isPreviewing = previewingBgmId === preset.id

                          return (
                            <div
                              key={preset.id}
                              className={`
                                p-4 rounded-xl border-2 transition-all cursor-pointer
                                min-h-[72px]
                                touch-manipulation
                                ${isSelected
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
                                }
                              `}
                              onClick={() => {
                                setIsCustomBgm(false)
                                updateNestedField('bgm.url', preset.url)
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center shrink-0
                                    ${isSelected ? 'bg-purple-500' : 'bg-gray-100'}
                                  `}>
                                    <Music className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                                      {preset.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{preset.description}</p>
                                    {preset.duration && (
                                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                        {preset.duration} {preset.artist && `· ${preset.artist}`}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* 미리듣기 버튼 - 최소 44px */}
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
                                  className={`
                                    w-11 h-11 rounded-full flex items-center justify-center
                                    shrink-0
                                    transition-colors
                                    touch-manipulation
                                    ${isPreviewing
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                                    }
                                  `}
                                  aria-label={isPreviewing ? '재생 중지' : '미리듣기'}
                                >
                                  {isPreviewing ? (
                                    <Pause className="w-5 h-5" />
                                  ) : (
                                    <Play className="w-5 h-5 ml-0.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* 자동 재생 옵션 */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl min-h-[64px]">
                      <div>
                        <p className="text-sm font-medium">자동 재생</p>
                        <p className="text-xs text-gray-500 mt-0.5">페이지 열릴 때 자동 재생</p>
                      </div>
                      <div className="scale-125">
                        <Switch
                          checked={invitation.bgm?.autoplay ?? false}
                          onCheckedChange={(checked) => updateNestedField('bgm.autoplay', checked)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </TabsContent>

        {/* ==================== 필수입력 탭 ==================== */}
        <TabsContent value="required" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <Accordion type="multiple" value={requiredAccordion} onValueChange={setRequiredAccordion} className="w-full">

            {/* 신랑·신부 기본 정보 */}
            <AccordionItem value="couple-basic" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 min-h-[56px] touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-base">신랑 · 신부</div>
                    <div className="text-xs text-gray-500">기본 정보</div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 space-y-5">
                {/* 신랑 */}
                <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl">
                  <div className="text-sm font-semibold text-blue-800">신랑</div>

                  {/* 이름 입력 - 16px 이상으로 iOS 줌 방지 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">이름</Label>
                    <Input
                      value={invitation.groom.name}
                      onChange={(e) => updateNestedField('groom.name', e.target.value)}
                      placeholder="홍길동"
                      className="text-base h-12 rounded-lg"
                      style={{ fontSize: '16px' }} // iOS 줌 방지
                    />
                  </div>

                  {/* 연락처 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">연락처</Label>
                    <Input
                      type="tel"
                      value={invitation.groom.phone || ''}
                      onChange={(e) => updateNestedField('groom.phone', e.target.value)}
                      placeholder="010-1234-5678"
                      className="text-base h-12 rounded-lg"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>

                {/* 신부 */}
                <div className="space-y-3 p-4 bg-pink-50/50 rounded-xl">
                  <div className="text-sm font-semibold text-pink-800">신부</div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">이름</Label>
                    <Input
                      value={invitation.bride.name}
                      onChange={(e) => updateNestedField('bride.name', e.target.value)}
                      placeholder="김영희"
                      className="text-base h-12 rounded-lg"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">연락처</Label>
                    <Input
                      type="tel"
                      value={invitation.bride.phone || ''}
                      onChange={(e) => updateNestedField('bride.phone', e.target.value)}
                      placeholder="010-1234-5678"
                      className="text-base h-12 rounded-lg"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 인사말 */}
            <AccordionItem value="greeting" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 min-h-[56px] touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-base">인사말</div>
                    <div className="text-xs text-gray-500">초대 메시지</div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 space-y-3">
                <p className="text-xs text-gray-500">하객분들께 전할 따뜻한 인사말을 작성해주세요.</p>
                <Textarea
                  value={invitation.content.greeting}
                  onChange={(e) => updateNestedField('content.greeting', e.target.value)}
                  placeholder="저희 두 사람이 사랑과 믿음으로&#10;한 가정을 이루게 되었습니다.&#10;&#10;바쁘시더라도 오셔서&#10;축복해 주시면 감사하겠습니다."
                  rows={8}
                  className="font-light leading-relaxed text-base rounded-lg"
                  style={{ fontSize: '16px' }}
                />
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </TabsContent>

        {/* ==================== 스토리 탭 ==================== */}
        <TabsContent value="story" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <div className="p-5 space-y-4">
            <div className="text-center py-8 text-gray-400">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">스토리 섹션</p>
              <p className="text-xs mt-1">프로필, 러브스토리, 인터뷰 등을 추가할 수 있어요</p>
            </div>
          </div>
        </TabsContent>

        {/* ==================== 추가기능 탭 ==================== */}
        <TabsContent value="extras" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <div className="p-5 space-y-4">
            <div className="text-center py-8 text-gray-400">
              <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">추가 기능</p>
              <p className="text-xs mt-1">안내사항, RSVP, 계좌 등을 설정할 수 있어요</p>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
