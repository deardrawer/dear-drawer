'use client'

import { useState, useRef } from 'react'
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
import { Users, Mail, Heart, MapPin, Palette, FileText, Settings, Music, Play, Pause, Plus, X } from 'lucide-react'
import { MobileSortableList, MobileSortableItem } from './MobileSortableList'
import { bgmPresets } from '@/lib/bgmPresets'
import { COLOR_THEMES, type ColorThemeId } from '@/components/parents/types'
import type { ParentsInvitationData } from '@/app/editor/parents/page'

interface MobileParentsEditPanelProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

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

/**
 * 부모님 청첩장 모바일 최적화 Edit Panel
 *
 * 주요 최적화:
 * 1. 터치 타겟: 모든 인터랙티브 요소 최소 44px (iOS) / 48px (Android)
 * 2. 입력 필드: font-size 16px 이상 (iOS 자동 줌 방지)
 * 3. Switch: scale-125로 크기 확대
 * 4. 탭 네비게이션: 아이콘 우선, 간결한 텍스트
 * 5. 아코디언: 전체 너비 탭 영역, 충분한 패딩
 * 6. 드래그 앤 드롭: MobileSortableList 사용
 */
export default function MobileParentsEditPanel({ data, updateData, updateNestedData, invitationId }: MobileParentsEditPanelProps) {
  // BGM 관련 상태
  const bgmAudioRef = useRef<HTMLAudioElement>(null)
  const [previewingBgmId, setPreviewingBgmId] = useState<string | null>(null)
  const [isCustomBgm, setIsCustomBgm] = useState(false)

  // 안내 항목 순서 변경 함수
  const handleInfoItemReorder = (newOrder: string[]) => {
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
      console.warn('Invalid order array received:', newOrder)
      return
    }

    const validKeys = PARENTS_INFO_ITEMS_CONFIG.map(item => item.key)
    const isValidOrder = newOrder.every(key => validKeys.includes(key))

    if (!isValidOrder) {
      console.warn('Order contains invalid keys:', newOrder)
      return
    }

    updateNestedData('weddingInfo.itemOrder', newOrder)
  }

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
              "
            >
              <FileText className="w-5 h-5" />
              <span className="leading-none">필수</span>
            </TabsTrigger>

            {/* 선택입력 탭 */}
            <TabsTrigger
              value="optional"
              className="
                flex flex-col items-center gap-1 py-3 px-2
                min-h-[48px]
                text-xs font-medium
                data-[state=active]:bg-white data-[state=active]:shadow-sm
                rounded-lg
                touch-manipulation
              "
            >
              <Settings className="w-5 h-5" />
              <span className="leading-none">선택</span>
            </TabsTrigger>

            {/* 게스트 탭 */}
            <TabsTrigger
              value="guests"
              className="
                flex flex-col items-center gap-1 py-3 px-2
                min-h-[48px]
                text-xs font-medium
                data-[state=active]:bg-white data-[state=active]:shadow-sm
                rounded-lg
                touch-manipulation
              "
            >
              <Users className="w-5 h-5" />
              <span className="leading-none">게스트</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== 디자인 탭 ==================== */}
        <TabsContent value="design" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <Accordion type="multiple" defaultValue={['color', 'bgm']} className="w-full">

            {/* 컬러 테마 */}
            <AccordionItem value="color" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 min-h-[56px] touch-manipulation">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${COLOR_THEMES[data.colorTheme || 'burgundy'].primary}20` }}
                  >
                    <Palette className="w-5 h-5" style={{ color: COLOR_THEMES[data.colorTheme || 'burgundy'].primary }} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-base">컬러 테마</div>
                    <div className="text-xs text-gray-500">{COLOR_THEMES[data.colorTheme || 'burgundy'].name}</div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">청첩장 전체 분위기를 결정하는 컬러 테마를 선택하세요.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(COLOR_THEMES) as ColorThemeId[]).map((themeId) => {
                      const theme = COLOR_THEMES[themeId]
                      const isSelected = (data.colorTheme || 'burgundy') === themeId
                      return (
                        <button
                          key={themeId}
                          onClick={() => updateData({ colorTheme: themeId })}
                          className={`
                            p-4 rounded-xl border-2 transition-all text-left
                            min-h-[64px]
                            touch-manipulation
                            ${isSelected
                              ? 'border-gray-800 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full border-2 border-white shadow-sm shrink-0"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm -ml-3 shrink-0"
                              style={{ backgroundColor: theme.accent }}
                            />
                            <span className="text-sm font-medium ml-1">{theme.name}</span>
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
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 min-h-[56px] touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-base">배경음악</div>
                    <div className="text-xs text-gray-500">{data.bgm?.enabled ? '사용 중' : '미사용'}</div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 space-y-4">
                {/* 숨겨진 오디오 엘리먼트 */}
                <audio
                  ref={bgmAudioRef}
                  onEnded={() => setPreviewingBgmId(null)}
                  onPause={() => setPreviewingBgmId(null)}
                />

                {/* BGM 사용 ON/OFF */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl min-h-[68px]">
                  <div>
                    <p className="text-sm font-medium">배경음악 사용</p>
                    <p className="text-xs text-gray-500 mt-0.5">청첩장에 음악을 추가해요</p>
                  </div>
                  <div className="scale-125">
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
                </div>

                {data.bgm?.enabled && (
                  <>
                    {/* BGM 프리셋 리스트 */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">음악 선택</Label>
                      <div className="space-y-2">
                        {bgmPresets.map((preset) => {
                          const isSelected = !isCustomBgm && data.bgm?.url === preset.url
                          const isPreviewing = previewingBgmId === preset.id

                          return (
                            <div
                              key={preset.id}
                              className={`
                                p-4 rounded-xl border-2 transition-all cursor-pointer
                                min-h-[76px]
                                touch-manipulation
                                ${isSelected
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50'
                                }
                              `}
                              onClick={() => {
                                setIsCustomBgm(false)
                                updateNestedData('bgm.url', preset.url)
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
                                    shrink-0 transition-colors
                                    touch-manipulation
                                    ${isPreviewing
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                                    }
                                  `}
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

                    {/* 자동 재생 */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl min-h-[68px]">
                      <div>
                        <p className="text-sm font-medium">자동 재생</p>
                        <p className="text-xs text-gray-500 mt-0.5">페이지 열릴 때 자동으로 재생</p>
                      </div>
                      <div className="scale-125">
                        <Switch
                          checked={data.bgm?.autoplay ?? false}
                          onCheckedChange={(checked) => updateNestedData('bgm.autoplay', checked)}
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
          <Accordion type="multiple" defaultValue={['sender']} className="w-full">

            {/* 보내는 사람 */}
            <AccordionItem value="sender" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 min-h-[56px] touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-base">보내는 사람</div>
                    <div className="text-xs text-gray-500">부모님 정보</div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 space-y-4">
                {/* 혼주 선택 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">누구의 청첩장인가요?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateNestedData('sender.side', 'groom')}
                      className={`
                        p-4 rounded-xl border-2 text-center transition-all
                        min-h-[56px]
                        touch-manipulation
                        ${data.sender.side === 'groom'
                          ? 'border-[#722F37] bg-[#722F37]/5'
                          : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                        }
                      `}
                    >
                      <div className="font-medium text-sm">신랑측 혼주</div>
                    </button>
                    <button
                      onClick={() => updateNestedData('sender.side', 'bride')}
                      className={`
                        p-4 rounded-xl border-2 text-center transition-all
                        min-h-[56px]
                        touch-manipulation
                        ${data.sender.side === 'bride'
                          ? 'border-[#722F37] bg-[#722F37]/5'
                          : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                        }
                      `}
                    >
                      <div className="font-medium text-sm">신부측 혼주</div>
                    </button>
                  </div>
                </div>

                {/* 부모님 이름 - 16px font-size */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">아버지 성함</Label>
                    <Input
                      value={data.sender.fatherName}
                      onChange={(e) => updateNestedData('sender.fatherName', e.target.value)}
                      placeholder="홍길동"
                      className="text-base h-12 rounded-lg"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">어머니 성함</Label>
                    <Input
                      value={data.sender.motherName}
                      onChange={(e) => updateNestedData('sender.motherName', e.target.value)}
                      placeholder="김영희"
                      className="text-base h-12 rounded-lg"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>

                {/* 서명 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">편지 서명</Label>
                  <Input
                    value={data.sender.signature}
                    onChange={(e) => updateNestedData('sender.signature', e.target.value)}
                    placeholder="아버지 홍길동 · 어머니 김영희 드림"
                    className="text-base h-12 rounded-lg"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 신랑신부 정보 */}
            <AccordionItem value="couple" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 min-h-[56px] touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-base">신랑 · 신부</div>
                    <div className="text-xs text-gray-500">결혼하는 자녀 정보</div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 space-y-4">
                {/* 신랑 */}
                <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl">
                  <div className="text-sm font-semibold text-blue-800">신랑</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">성</Label>
                      <Input
                        value={data.groom.lastName}
                        onChange={(e) => updateNestedData('groom.lastName', e.target.value)}
                        placeholder="김"
                        className="text-base h-11 rounded-lg"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs text-gray-600">이름</Label>
                      <Input
                        value={data.groom.firstName}
                        onChange={(e) => updateNestedData('groom.firstName', e.target.value)}
                        placeholder="민수"
                        className="text-base h-11 rounded-lg"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 신부 */}
                <div className="space-y-3 p-4 bg-pink-50/50 rounded-xl">
                  <div className="text-sm font-semibold text-pink-800">신부</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">성</Label>
                      <Input
                        value={data.bride.lastName}
                        onChange={(e) => updateNestedData('bride.lastName', e.target.value)}
                        placeholder="이"
                        className="text-base h-11 rounded-lg"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs text-gray-600">이름</Label>
                      <Input
                        value={data.bride.firstName}
                        onChange={(e) => updateNestedData('bride.firstName', e.target.value)}
                        placeholder="서연"
                        className="text-base h-11 rounded-lg"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </TabsContent>

        {/* ==================== 선택입력 탭 ==================== */}
        <TabsContent value="optional" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <Accordion type="multiple" defaultValue={['weddingInfo']} className="w-full">

            {/* 결혼식 안내 (드래그 앤 드롭) */}
            <AccordionItem value="weddingInfo" className="border-b">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50 min-h-[56px] touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-base">결혼식 안내</div>
                    <div className="text-xs text-gray-500">답례품, 화환, 피로연 등</div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 space-y-4">
                {/* 섹션 전체 ON/OFF */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl min-h-[64px]">
                  <Label className="text-sm font-medium">결혼식 안내 섹션 표시</Label>
                  <div className="scale-125">
                    <Switch
                      checked={data.weddingInfo?.enabled ?? true}
                      onCheckedChange={(checked) => updateNestedData('weddingInfo.enabled', checked)}
                    />
                  </div>
                </div>

                {data.weddingInfo?.enabled !== false && (
                  <MobileSortableList
                    items={data.weddingInfo?.itemOrder || DEFAULT_ITEM_ORDER}
                    onReorder={handleInfoItemReorder}
                    renderDragOverlay={(activeId) => {
                      const config = PARENTS_INFO_ITEMS_CONFIG.find(c => c.key === activeId)
                      return config ? (
                        <div className="p-4 bg-white">
                          <span className="text-sm font-medium">{config.emoji} {config.label}</span>
                        </div>
                      ) : null
                    }}
                  >
                    <div className="space-y-3">
                      {/* 안내 항목들 (모바일 드래그로 순서 변경 가능) */}
                      {(data.weddingInfo?.itemOrder || DEFAULT_ITEM_ORDER).map((itemKey) => {
                        const config = PARENTS_INFO_ITEMS_CONFIG.find(c => c.key === itemKey)
                        if (!config) return null

                        const weddingInfo = data.weddingInfo || {}
                        const itemData = weddingInfo[itemKey as keyof typeof weddingInfo]
                        const isEnabled = typeof itemData === 'object' && itemData !== null && 'enabled' in itemData ? itemData.enabled : false

                        return (
                          <MobileSortableItem key={itemKey} id={itemKey}>
                            <div className="border-2 rounded-xl p-4 space-y-3 bg-white hover:border-gray-300 transition-colors">
                              {/* 헤더 - 최소 44px 터치 영역 */}
                              <div className="flex items-center justify-between gap-3 min-h-[44px]">
                                <Label className="text-sm font-medium flex-1">{config.emoji} {config.label}</Label>
                                <div className="scale-125">
                                  <Switch
                                    checked={isEnabled ?? false}
                                    onCheckedChange={(checked) => updateNestedData(`weddingInfo.${itemKey}.enabled`, checked)}
                                  />
                                </div>
                              </div>

                              {/* 각 항목별 입력 폼 */}
                              {isEnabled && (
                                <div className="space-y-3 pt-2">
                                  {itemKey !== 'shuttle' && (
                                    <Textarea
                                      value={(itemData as { content?: string })?.content || ''}
                                      onChange={(e) => updateNestedData(`weddingInfo.${itemKey}.content`, e.target.value)}
                                      placeholder="안내 내용을 입력하세요"
                                      rows={3}
                                      className="text-base rounded-lg"
                                      style={{ fontSize: '16px' }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </MobileSortableItem>
                        )
                      })}
                    </div>
                  </MobileSortableList>
                )}
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </TabsContent>

        {/* ==================== 게스트 탭 ==================== */}
        <TabsContent value="guests" className="flex-1 overflow-y-auto m-0 data-[state=inactive]:hidden">
          <div className="p-5 space-y-4">
            {invitationId ? (
              <a
                href={`/invite/${invitationId}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center justify-center gap-2
                  w-full py-4 px-5
                  min-h-[52px]
                  rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700
                  text-white font-medium text-base
                  transition-colors
                  touch-manipulation
                "
              >
                <Users className="w-5 h-5" />
                게스트 관리 페이지 열기
              </a>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">
                  게스트를 관리하려면 먼저 청첩장을 저장해주세요
                </p>
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
