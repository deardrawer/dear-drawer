'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Heart, Clock, ImagePlus, MapPin, Bus, CreditCard, Plus, X, MessageSquare, GripVertical, Film } from 'lucide-react'
import { SortableList, SortableItem } from '@/components/ui/sortable-list'
import ImageCropEditor from '@/components/parents/ImageCropEditor'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ParentsInvitationData, TimelineItem } from '../../page'
import {
  SVG_ICON_KEYS, SVG_ICON_LABELS, renderSvgIcon, type SvgIconKey,
  BusIcon, SubwayIcon, ExpressBusIcon, TrainIcon, ParkingIcon,
} from '@/components/parents/icons'

interface ParentsStep3ContentProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
  setActiveSection?: (section: string | null) => void
}

// 드래그 가능한 갤러리 카드
function SortableGalleryCard({
  id,
  img,
  index,
  onDelete,
  onChange,
  invitationId,
  galleryIndex,
}: {
  id: string
  img: { url: string; cropX: number; cropY: number; cropWidth: number; cropHeight: number }
  index: number
  onDelete: () => void
  onChange: (cropData: { url: string; cropX: number; cropY: number; cropWidth: number; cropHeight: number }) => void
  invitationId?: string
  galleryIndex: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-gray-100 touch-manipulation"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-xs font-medium text-gray-600">사진 {index + 1}</span>
        </div>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-100 text-red-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <ImageCropEditor
        value={img}
        onChange={onChange}
        aspectRatio={galleryIndex === 0 ? 16/10 : 1}
        containerWidth={240}
        invitationId={invitationId}
        label=""
      />
      {galleryIndex === 0 && (
        <p className="text-[10px] text-gray-400">첫 번째 사진은 가로형(16:10)으로 표시됩니다.</p>
      )}
    </div>
  )
}

// SVG 아이콘 선택 팝오버
function IconPickerButton({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isSvg = value.startsWith('svg:')
  const displayIcon = isSvg ? renderSvgIcon(value, { size: 20, color: '#8B7E74' }) : null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-14 h-9 flex items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent/10 transition-colors"
        title="아이콘 선택"
      >
        {displayIcon || (value || '📌')}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-lg p-2 w-[240px]">
          <p className="text-[10px] text-gray-400 mb-1.5 px-1">SVG 아이콘</p>
          <div className="grid grid-cols-6 gap-1 mb-2">
            {SVG_ICON_KEYS.map((key) => {
              const isSelected = value === `svg:${key}`
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { onChange(`svg:${key}`); setOpen(false) }}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                    isSelected ? 'bg-orange-50 ring-1 ring-orange-300' : 'hover:bg-gray-100'
                  }`}
                  title={SVG_ICON_LABELS[key as SvgIconKey]}
                >
                  {renderSvgIcon(`svg:${key}`, { size: 18, color: isSelected ? '#C4956A' : '#888' })}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-gray-400 mb-1.5 px-1">직접 입력</p>
          <div className="flex gap-1">
            <Input
              value={isSvg ? '' : value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="이모지 입력"
              className="text-sm text-center h-8"
              maxLength={2}
            />
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="px-2 h-8 text-xs text-gray-400 hover:text-gray-600 border rounded"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 결혼식 안내 항목 설정
const PARENTS_INFO_ITEMS_CONFIG: { key: string; label: string; iconKey: SvgIconKey }[] = [
  { key: 'flowerGift', label: '꽃 답례품 안내', iconKey: 'bouquet' },
  { key: 'wreath', label: '화환 안내', iconKey: 'wreath' },
  { key: 'flowerChild', label: '화동 안내', iconKey: 'flower-child' },
  { key: 'reception', label: '피로연 안내', iconKey: 'cutlery' },
  { key: 'photoBooth', label: '포토부스 안내', iconKey: 'camera' },
  { key: 'shuttle', label: '셔틀버스 운행', iconKey: 'bus' },
]

const DEFAULT_ITEM_ORDER = PARENTS_INFO_ITEMS_CONFIG.map(item => item.key)

export default function ParentsStep3Content({
  data,
  updateData,
  updateNestedData,
  invitationId,
  setActiveSection,
}: ParentsStep3ContentProps) {
  const gallerySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // 안내 항목 순서 변경 함수 (드래그 앤 드롭)
  const handleInfoItemReorder = (newOrder: string[]) => {
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
      return
    }

    const validKeys = PARENTS_INFO_ITEMS_CONFIG.map(item => item.key)
    const isValidOrder = newOrder.every(key => validKeys.includes(key) || key.startsWith('custom-'))

    if (!isValidOrder) {
      return
    }

    updateNestedData('weddingInfo.itemOrder', newOrder)
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">본문 내용 작성</p>
        <p className="text-sm text-purple-700">
          💙 청첩장 본문에 표시될 내용을 작성해주세요.
        </p>
      </div>

      {/* 본문 인사말 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center">
            <Heart className="w-3 h-3 text-cyan-500" />
          </div>
          본문 인사말
        </h3>
        <p className="text-sm text-blue-600">💙 청첩장 본문에 표시될 인사말을 작성해주세요.</p>

        <Textarea
          value={data.greeting}
          onChange={(e) => updateData({ greeting: e.target.value })}
          onFocus={() => setActiveSection?.('greeting')}
          placeholder="서로 다른 길을 걸어온 두 사람이&#10;이제 같은 길을 함께 걸어가려 합니다.&#10;&#10;저희의 새로운 시작을&#10;축복해 주시면 감사하겠습니다."
          rows={6}
          className="font-light leading-relaxed"
        />
      </section>

      {/* 타임라인 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <Clock className="w-3 h-3 text-indigo-500" />
          </div>
          타임라인
        </h3>
        <p className="text-sm text-blue-600">💙 부모님 시점에서 아이의 성장 이야기를 담아보세요.</p>

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
                      onFocus={() => setActiveSection?.('timeline')}
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
                      onFocus={() => setActiveSection?.('timeline')}
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
                        imageUrl: cropData.url
                      }
                      updateData({ timeline: newTimeline })
                    }}
                    aspectRatio={4/3}
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
      </section>

      {/* 메인 사진 (커플정보) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
            <ImagePlus className="w-3 h-3 text-teal-500" />
          </div>
          메인 사진
        </h3>
        <p className="text-sm text-blue-600">💙 커플정보 영역의 대표 사진입니다. 미설정 시 갤러리 첫 번째 사진이 사용됩니다.</p>

        <ImageCropEditor
          value={data.mainImage || { url: '', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }}
          onChange={(cropData) => updateNestedData('mainImage', cropData)}
          aspectRatio={3/4}
          containerWidth={240}
          invitationId={invitationId || undefined}
          label=""
        />

        {/* 양가 부모님 정보 - 메인 사진 아래에 함께 표시되는 영역 */}
        <div className="space-y-3 pt-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">양가 부모님</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
              ※ 이름을 입력하지 않으신 분은 본문 커플소개에 표시되지 않습니다.<br />
              한 분만 입력하면 그 분만 표시되고, 두 분 모두 비우거나 &ldquo;부모님 입력 안함&rdquo;을 켜면 해당 측 전체가 숨겨집니다.
            </p>
          </div>

          {/* 신랑 측 부모님 */}
          <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-800">신랑 측 부모님</div>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Switch
                  checked={data.groom.parentsHidden ?? false}
                  onCheckedChange={(checked) => updateNestedData('groom.parentsHidden', checked)}
                  className="scale-75 origin-right"
                />
                <span className="text-[10px] text-gray-500">부모님 입력 안함</span>
              </label>
            </div>
            {!data.groom.parentsHidden && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500">아버지 성함</Label>
                  <Input
                    value={data.groom.fatherName}
                    onChange={(e) => updateNestedData('groom.fatherName', e.target.value)}
                    placeholder="홍길동"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <Switch
                      checked={data.groom.fatherDeceased ?? false}
                      onCheckedChange={(checked) => updateNestedData('groom.fatherDeceased', checked)}
                      className="scale-75 origin-left"
                    />
                    <span className="text-[10px] text-gray-400">고인</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500">어머니 성함</Label>
                  <Input
                    value={data.groom.motherName}
                    onChange={(e) => updateNestedData('groom.motherName', e.target.value)}
                    placeholder="김영희"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <Switch
                      checked={data.groom.motherDeceased ?? false}
                      onCheckedChange={(checked) => updateNestedData('groom.motherDeceased', checked)}
                      className="scale-75 origin-left"
                    />
                    <span className="text-[10px] text-gray-400">고인</span>
                  </div>
                </div>
              </div>
            )}
            {data.groom.parentsHidden && (
              <p className="text-[10px] text-gray-500">※ 신랑측 부모님은 본문에 표시되지 않습니다.</p>
            )}
          </div>

          {/* 신부 측 부모님 */}
          <div className="space-y-3 p-3 bg-pink-50/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-pink-800">신부 측 부모님</div>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Switch
                  checked={data.bride.parentsHidden ?? false}
                  onCheckedChange={(checked) => updateNestedData('bride.parentsHidden', checked)}
                  className="scale-75 origin-right"
                />
                <span className="text-[10px] text-gray-500">부모님 입력 안함</span>
              </label>
            </div>
            {!data.bride.parentsHidden && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500">아버지 성함</Label>
                  <Input
                    value={data.bride.fatherName}
                    onChange={(e) => updateNestedData('bride.fatherName', e.target.value)}
                    placeholder="홍길동"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <Switch
                      checked={data.bride.fatherDeceased ?? false}
                      onCheckedChange={(checked) => updateNestedData('bride.fatherDeceased', checked)}
                      className="scale-75 origin-left"
                    />
                    <span className="text-[10px] text-gray-400">고인</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500">어머니 성함</Label>
                  <Input
                    value={data.bride.motherName}
                    onChange={(e) => updateNestedData('bride.motherName', e.target.value)}
                    placeholder="김영희"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <Switch
                      checked={data.bride.motherDeceased ?? false}
                      onCheckedChange={(checked) => updateNestedData('bride.motherDeceased', checked)}
                      className="scale-75 origin-left"
                    />
                    <span className="text-[10px] text-gray-400">고인</span>
                  </div>
                </div>
              </div>
            )}
            {data.bride.parentsHidden && (
              <p className="text-[10px] text-gray-500">※ 신부측 부모님은 본문에 표시되지 않습니다.</p>
            )}
          </div>

          {/* 고인 표시 스타일 (고인이 한 명이라도 있을 때만 노출) */}
          {(data.groom.fatherDeceased || data.groom.motherDeceased || data.bride.fatherDeceased || data.bride.motherDeceased || data.sender.fatherDeceased || data.sender.motherDeceased) && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <Label className="text-xs font-medium text-gray-700">고인 표시 스타일</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateData({ deceasedDisplayStyle: 'flower' })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    (data.deceasedDisplayStyle || 'flower') === 'flower'
                      ? 'border-gray-800 bg-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <img src="/icons/chrysanthemum.svg" alt="" className="w-4 h-4 opacity-70" />
                    <span className="text-sm font-medium">국화꽃</span>
                  </div>
                </button>
                <button
                  onClick={() => updateData({ deceasedDisplayStyle: 'hanja' })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    data.deceasedDisplayStyle === 'hanja'
                      ? 'border-gray-800 bg-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm opacity-70">故</span>
                    <span className="text-sm font-medium">한자</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 갤러리 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <ImagePlus className="w-3 h-3 text-emerald-500" />
          </div>
          갤러리
          <span className="text-xs text-gray-400 font-normal">({data.gallery?.images?.length || 0}장)</span>
        </h3>
        <p className="text-sm text-blue-600">💙 신랑신부 사진을 추가하세요. (최대 30장)</p>
        <p className="text-xs text-gray-500">사진이 2장 이상이면 드래그하여 순서를 변경할 수 있습니다.</p>

        {(() => {
          const images = data.gallery?.images || []
          const sortableIds = images.map((_, i) => `gallery-img-${i}`)

          const handleGalleryDragEnd = (event: DragEndEvent) => {
            const { active, over } = event
            if (!over || active.id === over.id) return
            const oldIndex = sortableIds.indexOf(active.id as string)
            const newIndex = sortableIds.indexOf(over.id as string)
            if (oldIndex === -1 || newIndex === -1) return
            updateNestedData('gallery.images', arrayMove(images, oldIndex, newIndex))
          }

          // 갤러리 인덱스 계산: mainImage가 설정되면 gallery[0]이 갤러리 첫 번째, 아니면 gallery[0]은 히어로이므로 gallery[1]이 갤러리 첫 번째
          const hasMainImage = data.mainImage?.url && data.mainImage.url.trim() !== ''
          const getGalleryIndex = (idx: number) => hasMainImage ? idx : idx - 1

          if (images.length < 2) {
            return images.map((img, index) => {
              const gIdx = getGalleryIndex(index)
              return (
              <div key={index} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">사진 {index + 1}</span>
                  <button
                    onClick={() => {
                      const newImages = images.filter((_, i) => i !== index)
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
                    const newImages = [...images]
                    newImages[index] = cropData
                    updateNestedData('gallery.images', newImages)
                  }}
                  aspectRatio={gIdx === 0 ? 16/10 : gIdx < 0 ? 3/4 : 1}
                  containerWidth={240}
                  invitationId={invitationId || undefined}
                  label=""
                />
                {gIdx === 0 && (
                  <p className="text-[10px] text-gray-400">갤러리 첫 번째 사진은 가로형(16:10)으로 표시됩니다.</p>
                )}
                {gIdx < 0 && !hasMainImage && (
                  <p className="text-[10px] text-gray-400">메인 사진 미설정 시 이 사진이 히어로로 사용됩니다.</p>
                )}
              </div>
            )})
          }

          return (
            <DndContext sensors={gallerySensors} collisionDetection={closestCenter} onDragEnd={handleGalleryDragEnd}>
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {images.map((img, index) => (
                  <SortableGalleryCard
                    key={sortableIds[index]}
                    id={sortableIds[index]}
                    img={img}
                    index={index}
                    galleryIndex={getGalleryIndex(index)}
                    onDelete={() => {
                      const newImages = images.filter((_, i) => i !== index)
                      updateNestedData('gallery.images', newImages)
                    }}
                    onChange={(cropData) => {
                      const newImages = [...images]
                      newImages[index] = cropData
                      updateNestedData('gallery.images', newImages)
                    }}
                    invitationId={invitationId || undefined}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )
        })()}

        {(data.gallery?.images?.length || 0) < 30 && (
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
      </section>

      {/* 유튜브 영상 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <Film className="w-3 h-3 text-red-500" />
            </div>
            영상
          </h3>
          <Switch
            checked={data.youtube?.enabled ?? false}
            onCheckedChange={(checked) => updateNestedData('youtube.enabled', checked)}
          />
        </div>
        <p className="text-sm text-blue-600">💙 유튜브 영상을 추가하세요. 갤러리 아래에 표시됩니다.</p>

        {data.youtube?.enabled && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-xs">영상 제목</Label>
              <Input
                value={data.youtube?.title || ''}
                onChange={(e) => updateNestedData('youtube.title', e.target.value)}
                placeholder="우리의 웨딩 영상"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">유튜브 URL</Label>
              <Input
                value={data.youtube?.url || ''}
                onChange={(e) => updateNestedData('youtube.url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                className="text-sm"
              />
            </div>
            {/* 미리보기 */}
            {data.youtube?.url && (() => {
              const url = data.youtube.url
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

      {/* 결혼식 정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
            <MapPin className="w-3 h-3 text-purple-500" />
          </div>
          결혼식 정보
        </h3>
        <p className="text-sm text-blue-600">💙 결혼식 날짜, 시간, 장소를 입력해주세요.</p>

        {/* 날짜/시간 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">결혼식 날짜</Label>
            <Input
              type="date"
              value={data.wedding.date}
              onChange={(e) => updateNestedData('wedding.date', e.target.value)}
              onFocus={() => setActiveSection?.('wedding')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">시간 표시</Label>
            <Input
              value={data.wedding.timeDisplay}
              onChange={(e) => updateNestedData('wedding.timeDisplay', e.target.value)}
              onFocus={() => setActiveSection?.('wedding')}
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
            onFocus={() => setActiveSection?.('venue')}
            placeholder="더채플앳청담"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">홀 이름</Label>
          <Input
            value={data.wedding.venue.hall}
            onChange={(e) => updateNestedData('wedding.venue.hall', e.target.value)}
            onFocus={() => setActiveSection?.('venue')}
            placeholder="그랜드볼룸"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">주소</Label>
          <Input
            value={data.wedding.venue.address}
            onChange={(e) => updateNestedData('wedding.venue.address', e.target.value)}
            onFocus={() => setActiveSection?.('venue')}
            placeholder="서울시 강남구..."
          />
        </div>

        {/* 오시는 길 안내 */}
        <div className="pt-3 border-t space-y-3">
          <p className="text-xs font-medium text-gray-700">오시는 길 안내</p>

          {/* 버스 */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <BusIcon size={14} color="#8B7E74" /> 버스
              </Label>
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
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <SubwayIcon size={14} color="#8B7E74" /> 지하철
              </Label>
              <Switch
                checked={data.wedding.directions?.subway?.enabled ?? false}
                onCheckedChange={(checked) => updateNestedData('wedding.directions.subway.enabled', checked)}
              />
            </div>
            {data.wedding.directions?.subway?.enabled && (
              <div className="space-y-3">
                {/* 다중 노선 지원 */}
                {(data.wedding.directions?.subway?.lines && data.wedding.directions.subway.lines.length > 0) ? (
                  // 다중 노선 모드
                  <>
                    {data.wedding.directions.subway.lines.map((subwayLine, idx) => (
                      <div key={idx} className="relative">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={subwayLine.line || ''}
                            onChange={(e) => {
                              const newLines = [...(data.wedding.directions?.subway?.lines || [])]
                              newLines[idx] = { ...newLines[idx], line: e.target.value }
                              updateNestedData('wedding.directions.subway.lines', newLines)
                            }}
                            placeholder="7호선"
                            className="text-sm"
                          />
                          <Input
                            value={subwayLine.station || ''}
                            onChange={(e) => {
                              const newLines = [...(data.wedding.directions?.subway?.lines || [])]
                              newLines[idx] = { ...newLines[idx], station: e.target.value }
                              updateNestedData('wedding.directions.subway.lines', newLines)
                            }}
                            placeholder="청담역"
                            className="text-sm"
                          />
                          <div className="flex gap-1">
                            <Input
                              value={subwayLine.exit || ''}
                              onChange={(e) => {
                                const newLines = [...(data.wedding.directions?.subway?.lines || [])]
                                newLines[idx] = { ...newLines[idx], exit: e.target.value }
                                updateNestedData('wedding.directions.subway.lines', newLines)
                              }}
                              placeholder="9번 출구"
                              className="text-sm flex-1"
                            />
                            {(data.wedding.directions?.subway?.lines?.length || 0) > 1 && (
                              <button
                                onClick={() => {
                                  const newLines = data.wedding.directions?.subway?.lines?.filter((_, i) => i !== idx) || []
                                  updateNestedData('wedding.directions.subway.lines', newLines)
                                }}
                                className="p-1.5 rounded hover:bg-red-100 text-red-400 shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newLines = [...(data.wedding.directions?.subway?.lines || []), { line: '', station: '', exit: '' }]
                        updateNestedData('wedding.directions.subway.lines', newLines)
                      }}
                      className="w-full text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      지하철 노선 추가
                    </Button>
                  </>
                ) : (
                  // 단일 노선 모드 (기존 데이터 호환성 + 다중 노선 전환)
                  <>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // 기존 단일 노선 데이터를 다중 노선 배열로 변환
                        const currentLine = {
                          line: data.wedding.directions?.subway?.line || '',
                          station: data.wedding.directions?.subway?.station || '',
                          exit: data.wedding.directions?.subway?.exit || ''
                        }
                        const hasData = currentLine.line || currentLine.station || currentLine.exit
                        const newLines = hasData
                          ? [currentLine, { line: '', station: '', exit: '' }]
                          : [{ line: '', station: '', exit: '' }]
                        updateNestedData('wedding.directions.subway.lines', newLines)
                      }}
                      className="w-full text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      지하철 노선 추가
                    </Button>
                  </>
                )}
                {/* 도보 안내 (공통) */}
                <Input
                  value={data.wedding.directions?.subway?.walk || ''}
                  onChange={(e) => updateNestedData('wedding.directions.subway.walk', e.target.value)}
                  placeholder="도보 약 7분 / 택시 약 3분"
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* 고속버스 */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <ExpressBusIcon size={14} color="#8B7E74" /> 고속버스
              </Label>
              <Switch
                checked={data.wedding.directions?.expressBus?.enabled ?? false}
                onCheckedChange={(checked) => updateNestedData('wedding.directions.expressBus.enabled', checked)}
              />
            </div>
            {data.wedding.directions?.expressBus?.enabled && (
              <div className="space-y-2">
                {(data.wedding.directions?.expressBus?.stops && data.wedding.directions.expressBus.stops.length > 0) ? (
                  <>
                    {data.wedding.directions.expressBus.stops.map((item, idx) => (
                      <div key={idx} className="space-y-1.5 p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 w-4 shrink-0">{idx + 1}</span>
                          <Input
                            value={item.stop || ''}
                            onChange={(e) => {
                              const newStops = [...(data.wedding.directions?.expressBus?.stops || [])]
                              newStops[idx] = { ...newStops[idx], stop: e.target.value }
                              updateNestedData('wedding.directions.expressBus.stops', newStops)
                            }}
                            placeholder="원주시외버스터미널 하차"
                            className="text-sm flex-1"
                          />
                        </div>
                        <div className="flex gap-1 pl-5">
                          <Input
                            value={item.note || ''}
                            onChange={(e) => {
                              const newStops = [...(data.wedding.directions?.expressBus?.stops || [])]
                              newStops[idx] = { ...newStops[idx], note: e.target.value }
                              updateNestedData('wedding.directions.expressBus.stops', newStops)
                            }}
                            placeholder="터미널에서 택시 약 10분"
                            className="text-sm flex-1"
                          />
                          {(data.wedding.directions?.expressBus?.stops?.length || 0) > 1 && (
                            <button
                              onClick={() => {
                                const newStops = data.wedding.directions?.expressBus?.stops?.filter((_, i) => i !== idx) || []
                                updateNestedData('wedding.directions.expressBus.stops', newStops)
                              }}
                              className="p-1.5 rounded hover:bg-red-100 text-red-400 shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newStops = [...(data.wedding.directions?.expressBus?.stops || []), { stop: '', note: '' }]
                        updateNestedData('wedding.directions.expressBus.stops', newStops)
                      }}
                      className="w-full text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      고속버스 노선 추가
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      value={data.wedding.directions?.expressBus?.stop || ''}
                      onChange={(e) => updateNestedData('wedding.directions.expressBus.stop', e.target.value)}
                      placeholder="원주시외버스터미널 하차"
                      className="text-sm"
                    />
                    <Input
                      value={data.wedding.directions?.expressBus?.note || ''}
                      onChange={(e) => updateNestedData('wedding.directions.expressBus.note', e.target.value)}
                      placeholder="터미널에서 택시 약 10분"
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentStop = data.wedding.directions?.expressBus?.stop || ''
                        const currentNote = data.wedding.directions?.expressBus?.note || ''
                        const hasData = currentStop || currentNote
                        const newStops = hasData
                          ? [{ stop: currentStop, note: currentNote }, { stop: '', note: '' }]
                          : [{ stop: '', note: '' }]
                        updateNestedData('wedding.directions.expressBus.stops', newStops)
                      }}
                      className="w-full text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      고속버스 노선 추가
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 기차 */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <TrainIcon size={14} color="#8B7E74" /> 기차 (KTX/SRT)
              </Label>
              <Switch
                checked={data.wedding.directions?.train?.enabled ?? false}
                onCheckedChange={(checked) => updateNestedData('wedding.directions.train.enabled', checked)}
              />
            </div>
            {data.wedding.directions?.train?.enabled && (
              <div className="space-y-2">
                {(data.wedding.directions?.train?.stations && data.wedding.directions.train.stations.length > 0) ? (
                  <>
                    {data.wedding.directions.train.stations.map((item, idx) => (
                      <div key={idx} className="space-y-1.5 p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400 w-4 shrink-0">{idx + 1}</span>
                          <Input
                            value={item.station || ''}
                            onChange={(e) => {
                              const newStations = [...(data.wedding.directions?.train?.stations || [])]
                              newStations[idx] = { ...newStations[idx], station: e.target.value }
                              updateNestedData('wedding.directions.train.stations', newStations)
                            }}
                            placeholder="동대구역 하차"
                            className="text-sm flex-1"
                          />
                        </div>
                        <div className="flex gap-1 pl-5">
                          <Input
                            value={item.note || ''}
                            onChange={(e) => {
                              const newStations = [...(data.wedding.directions?.train?.stations || [])]
                              newStations[idx] = { ...newStations[idx], note: e.target.value }
                              updateNestedData('wedding.directions.train.stations', newStations)
                            }}
                            placeholder="역에서 택시 약 15분"
                            className="text-sm flex-1"
                          />
                          {(data.wedding.directions?.train?.stations?.length || 0) > 1 && (
                            <button
                              onClick={() => {
                                const newStations = data.wedding.directions?.train?.stations?.filter((_, i) => i !== idx) || []
                                updateNestedData('wedding.directions.train.stations', newStations)
                              }}
                              className="p-1.5 rounded hover:bg-red-100 text-red-400 shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newStations = [...(data.wedding.directions?.train?.stations || []), { station: '', note: '' }]
                        updateNestedData('wedding.directions.train.stations', newStations)
                      }}
                      className="w-full text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      기차역 추가
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      value={data.wedding.directions?.train?.station || ''}
                      onChange={(e) => updateNestedData('wedding.directions.train.station', e.target.value)}
                      placeholder="동대구역 하차"
                      className="text-sm"
                    />
                    <Input
                      value={data.wedding.directions?.train?.note || ''}
                      onChange={(e) => updateNestedData('wedding.directions.train.note', e.target.value)}
                      placeholder="역에서 택시 약 15분"
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentStation = data.wedding.directions?.train?.station || ''
                        const currentNote = data.wedding.directions?.train?.note || ''
                        const hasData = currentStation || currentNote
                        const newStations = hasData
                          ? [{ station: currentStation, note: currentNote }, { station: '', note: '' }]
                          : [{ station: '', note: '' }]
                        updateNestedData('wedding.directions.train.stations', newStations)
                      }}
                      className="w-full text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      기차역 추가
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 주차 */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <ParkingIcon size={14} color="#8B7E74" /> 주차 안내
              </Label>
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

          {/* 추가 안내사항 */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">📝 추가 안내사항</Label>
              <Switch
                checked={data.wedding.directions?.extraInfoEnabled ?? false}
                onCheckedChange={(checked) => updateNestedData('wedding.directions.extraInfoEnabled', checked)}
              />
            </div>
            {data.wedding.directions?.extraInfoEnabled && (
              <Textarea
                value={data.wedding.directions?.extraInfoText || ''}
                onChange={(e) => updateNestedData('wedding.directions.extraInfoText', e.target.value)}
                placeholder="예: 주차권은 안내데스크에서 수령 / 혼잡 시간대는 대중교통 추천 / 예식장 입구는 ○○문입니다"
                rows={3}
                className="text-sm resize-none"
              />
            )}
          </div>
        </div>
      </section>

      {/* 결혼식 안내 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
            <Bus className="w-3 h-3 text-rose-500" />
          </div>
          결혼식 안내
        </h3>
        <p className="text-sm text-blue-600">💙 답례품, 화환, 피로연, 셔틀버스 등 안내 정보를 입력해주세요.</p>

        {/* 섹션 전체 ON/OFF */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Label className="text-sm font-medium">결혼식 안내 섹션 표시</Label>
          <Switch
            checked={data.weddingInfo?.enabled ?? true}
            onCheckedChange={(checked) => updateNestedData('weddingInfo.enabled', checked)}
          />
        </div>

        {data.weddingInfo?.enabled !== false && (
          <>
          <SortableList
            items={data.weddingInfo?.itemOrder || DEFAULT_ITEM_ORDER}
            onReorder={handleInfoItemReorder}
            renderDragOverlay={(activeId) => {
              const config = PARENTS_INFO_ITEMS_CONFIG.find(c => c.key === activeId)
              if (config) {
                return (
                  <div className="p-3 bg-white">
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      {renderSvgIcon(`svg:${config.iconKey}`, { size: 14, color: '#8B7E74' })}
                      {config.label}
                    </span>
                  </div>
                )
              }
              if (activeId.startsWith('custom-')) {
                const customId = activeId.replace('custom-', '')
                const custom = data.weddingInfo?.customItems?.find(c => c.id === customId)
                return (
                  <div className="p-3 bg-white">
                    <span className="text-xs font-medium flex items-center gap-1">
                      {renderSvgIcon(custom?.emoji || '', { size: 14, color: '#8B7E74' }) || (custom?.emoji || '📌')}
                      {' '}{custom?.title || '사용자 안내'}
                    </span>
                  </div>
                )
              }
              return null
            }}
          >
            <div className="space-y-3">
              {(data.weddingInfo?.itemOrder || DEFAULT_ITEM_ORDER).map((itemKey) => {
                // 커스텀 항목 처리
                if (itemKey.startsWith('custom-')) {
                  const customId = itemKey.replace('custom-', '')
                  const customItems = data.weddingInfo?.customItems || []
                  const customIdx = customItems.findIndex(c => c.id === customId)
                  const custom = customIdx >= 0 ? customItems[customIdx] : null
                  if (!custom) return null

                  return (
                    <SortableItem key={itemKey} id={itemKey}>
                      <div className="border rounded-lg p-3 space-y-2 bg-white hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs font-medium flex items-center gap-1">
                            {renderSvgIcon(custom.emoji || '', { size: 14, color: '#8B7E74' }) || (custom.emoji || '📌')}
                            {' '}{custom.title || '사용자 안내'}
                          </Label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newItems = customItems.filter(c => c.id !== customId)
                                updateNestedData('weddingInfo.customItems', newItems)
                                const newOrder = (data.weddingInfo?.itemOrder || DEFAULT_ITEM_ORDER).filter(k => k !== itemKey)
                                updateNestedData('weddingInfo.itemOrder', newOrder)
                              }}
                              className="p-1 rounded hover:bg-red-100 text-red-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <Switch
                              checked={custom.enabled ?? false}
                              onCheckedChange={(checked) => updateNestedData(`weddingInfo.customItems.${customIdx}.enabled`, checked)}
                            />
                          </div>
                        </div>

                        {custom.enabled && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <Input
                                value={custom.title || ''}
                                onChange={(e) => updateNestedData(`weddingInfo.customItems.${customIdx}.title`, e.target.value)}
                                placeholder="안내 제목"
                                className="text-sm"
                              />
                              <IconPickerButton
                                value={custom.emoji || ''}
                                onChange={(v) => updateNestedData(`weddingInfo.customItems.${customIdx}.emoji`, v)}
                              />
                            </div>
                            <Textarea
                              value={custom.content || ''}
                              onChange={(e) => updateNestedData(`weddingInfo.customItems.${customIdx}.content`, e.target.value)}
                              placeholder="안내 내용을 입력하세요"
                              rows={3}
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </SortableItem>
                  )
                }

                // 기본 항목 처리
                const config = PARENTS_INFO_ITEMS_CONFIG.find(c => c.key === itemKey)
                if (!config) return null

                const weddingInfo = data.weddingInfo || {}
                const itemData = weddingInfo[itemKey as keyof typeof weddingInfo]
                const isEnabled = typeof itemData === 'object' && itemData !== null && 'enabled' in itemData ? itemData.enabled : false

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
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          {renderSvgIcon(`svg:${config.iconKey}`, { size: 14, color: '#8B7E74' })}
                          {config.label}
                        </Label>
                        <Switch
                          checked={isEnabled ?? false}
                          onCheckedChange={(checked) => updateNestedData(`weddingInfo.${itemKey}.enabled`, checked)}
                        />
                      </div>

                      {isEnabled && (
                        <div className="space-y-2">
                          {itemKey !== 'shuttle' && (
                            <Textarea
                              value={(itemData as { content?: string })?.content || ''}
                              onChange={(e) => updateNestedData(`weddingInfo.${itemKey}.content`, e.target.value)}
                              placeholder={placeholders[itemKey] || '안내 내용을 입력하세요'}
                              rows={3}
                              className="text-sm"
                            />
                          )}

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

          {/* 사용자 정의 안내 항목 추가 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const customItems = [...(data.weddingInfo?.customItems || [])]
              const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
              customItems.push({ id: newId, enabled: true, title: '', content: '', emoji: 'svg:pin' })
              updateNestedData('weddingInfo.customItems', customItems)
              const currentOrder = data.weddingInfo?.itemOrder || DEFAULT_ITEM_ORDER
              updateNestedData('weddingInfo.itemOrder', [...currentOrder, `custom-${newId}`])
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            안내 항목 추가
          </Button>
          </>
        )}
      </section>

      {/* RSVP (참석의사전달) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-violet-500" />
            </div>
            RSVP (참석의사전달)
          </h3>
          <Switch
            checked={data.rsvpEnabled !== false}
            onCheckedChange={(checked) => updateData({ rsvpEnabled: checked })}
          />
        </div>
        <p className="text-sm text-blue-600">💙 하객분들이 참석 여부를 전달할 수 있는 RSVP 기능이 표시됩니다.</p>

        {data.rsvpEnabled !== false && (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              게스트에게 참석 여부를 편리하게 받을 수 있어요.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              청첩장 발행 후 게스트 관리 페이지에서 응답을 확인할 수 있습니다.
            </p>
          </div>
        )}
      </section>

      {/* 계좌 안내 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <CreditCard className="w-3 h-3 text-green-600" />
          </div>
          계좌 안내
        </h3>
        <p className="text-sm text-blue-600">
          {data.sender.side === 'bride'
            ? '💙 신부측 계좌 정보를 입력하세요.'
            : '💙 신랑측 계좌 정보를 입력하세요.'}
        </p>

        {/* ON/OFF 토글 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">계좌 안내 표시</p>
            <p className="text-xs text-gray-500">마음 전하실 곳 정보</p>
          </div>
          <Switch
            checked={data.accounts?.enabled !== false}
            onCheckedChange={(checked) => updateNestedData('accounts.enabled', checked)}
          />
        </div>

        {data.accounts?.enabled !== false && (
          <div className={`p-4 rounded-lg space-y-4 ${data.sender.side === 'bride' ? 'bg-pink-50/50' : 'bg-blue-50/50'}`}>
            <p className={`text-sm font-semibold ${data.sender.side === 'bride' ? 'text-pink-800' : 'text-blue-800'}`}>
              {data.sender.side === 'bride' ? '신부측' : '신랑측'}
            </p>

            {/* 슬롯 0: 본인 (신랑 or 신부) */}
            {(() => {
              const list = data.accounts?.list || []
              const slot0 = list[0] || { name: '', bank: '', accountNumber: '' }
              const slot1 = list[1] || { name: '', bank: '', accountNumber: '' }
              const slot2 = list[2] || { name: '', bank: '', accountNumber: '' }

              const updateSlot = (slotIndex: number, field: string, value: string) => {
                const newList = [...list]
                while (newList.length <= slotIndex) {
                  newList.push({ name: '', bank: '', accountNumber: '' })
                }
                newList[slotIndex] = { ...newList[slotIndex], [field]: value }
                updateNestedData('accounts.list', newList)
              }

              const sideLabel = data.sender.side === 'bride' ? '신부' : '신랑'

              return (
                <div className="space-y-4">
                  {/* 본인 계좌 */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-700">{sideLabel} 계좌</span>
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={slot0.bank} onChange={(e) => updateSlot(0, 'bank', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="은행" className="text-sm" />
                      <Input value={slot0.accountNumber} onChange={(e) => updateSlot(0, 'accountNumber', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="계좌번호" className="text-sm" />
                      <Input value={slot0.name} onChange={(e) => updateSlot(0, 'name', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="예금주" className="text-sm" />
                    </div>
                  </div>

                  {/* 아버지 계좌 */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-700">아버지 계좌</span>
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={slot1.bank} onChange={(e) => updateSlot(1, 'bank', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="은행" className="text-sm" />
                      <Input value={slot1.accountNumber} onChange={(e) => updateSlot(1, 'accountNumber', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="계좌번호" className="text-sm" />
                      <Input value={slot1.name} onChange={(e) => updateSlot(1, 'name', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="예금주" className="text-sm" />
                    </div>
                  </div>

                  {/* 어머니 계좌 */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-700">어머니 계좌</span>
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={slot2.bank} onChange={(e) => updateSlot(2, 'bank', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="은행" className="text-sm" />
                      <Input value={slot2.accountNumber} onChange={(e) => updateSlot(2, 'accountNumber', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="계좌번호" className="text-sm" />
                      <Input value={slot2.name} onChange={(e) => updateSlot(2, 'name', e.target.value)} onFocus={() => setActiveSection?.('accounts')} placeholder="예금주" className="text-sm" />
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </section>
    </div>
  )
}
