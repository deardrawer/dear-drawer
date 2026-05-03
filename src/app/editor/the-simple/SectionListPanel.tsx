'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, X, ChevronDown, Plus, Minus } from 'lucide-react'
import { getSectionType } from './utils'
import VariantThumbnail from './VariantThumbnail'

// 섹션 메타데이터 — 한국어 라벨과 variant 개수 정의
interface SectionMetaItem {
  label: string
  variantCount: number
  optional: boolean
  /** variant 를 행 단위로 분리 (예: 갤러리 슬라이드 / 커스텀 레이아웃) */
  variantGroups?: Array<{ label: string; variants: number[] }>
  /** variant 번호별 짧은 한국어 설명 */
  variantLabels?: Record<number, string>
}

export const SECTION_META: Record<string, SectionMetaItem> = {
  intro: {
    label: '인트로',
    variantCount: 10,
    optional: false,
    variantLabels: { 1: '풀커버', 2: '심플', 3: '프레임', 4: '아치', 5: '에디토리얼', 6: '티켓', 7: '그리드', 8: '실', 9: '룰스택', 10: '크림' },
  },
  greeting: {
    label: '인사말',
    variantCount: 5,
    optional: false,
    variantLabels: { 1: '기본', 2: '필채움', 3: '인용블록', 4: '프레임', 5: '세로선' },
  },
  couple: {
    label: '커플 소개',
    variantCount: 5,
    optional: true,
    variantLabels: { 1: '클래식', 2: '포트레이트', 3: '오버랩', 4: '카드', 5: '좌우분할' },
  },
  family: {
    label: '커플소개2 + 연락하기',
    variantCount: 3,
    optional: true,
    variantLabels: { 1: '클래식', 2: '카드', 3: '가로사진' },
  },
  info: {
    label: '예식일정',
    variantCount: 5,
    optional: false,
    variantLabels: { 1: '캘린더', 2: '빅데이트', 3: '주간', 4: '티켓', 5: '카운트다운' },
  },
  direction: {
    label: '오시는 길',
    variantCount: 5,
    optional: false,
    variantLabels: { 1: '맵카드', 2: '풀맵', 3: '상단정보', 4: '맵+카드', 5: '좌라벨' },
  },
  lovestory: {
    label: '러브스토리',
    variantCount: 5,
    optional: true,
    variantLabels: { 1: '기본', 2: '좌우', 3: '배경', 4: '카드', 5: '타임라인' },
  },
  interview: {
    label: '인터뷰',
    variantCount: 5,
    optional: true,
    variantLabels: { 1: '기본', 2: '번호', 3: '말풍선', 4: '인용', 5: '카드' },
  },
  gallery: {
    label: '갤러리',
    variantCount: 5,
    optional: false,
    variantGroups: [
      { label: '슬라이드', variants: [1, 2] },
      { label: '커스텀 레이아웃', variants: [3, 4, 5] },
    ],
    variantLabels: { 1: '피처', 2: '슬라이드', 3: '가로', 4: '세로', 5: '혼합' },
  },
  video: {
    label: '영상',
    variantCount: 3,
    optional: true,
    variantLabels: { 1: '기본', 2: '풀폭', 3: '시네마' },
  },
  guide: {
    label: '결혼식 안내',
    variantCount: 5,
    optional: true,
    variantLabels: { 1: '기본', 2: '리스트', 3: '아코디언', 4: '카드2열', 5: '노트' },
  },
  account: {
    label: '마음 전하실 곳',
    variantCount: 5,
    optional: true,
    variantLabels: { 1: '기본', 2: '베이지', 3: '펼침', 4: '보더', 5: '세로' },
  },
  rsvp: {
    label: '참석 의사',
    variantCount: 5,
    optional: true,
    variantLabels: { 1: '기본', 2: '블록', 3: '미니멀', 4: '듀얼', 5: '카드' },
  },
  guestbook: {
    label: '방명록',
    variantCount: 5,
    optional: true,
    variantLabels: { 1: '기본', 2: '카드', 3: '타임라인', 4: '편지지', 5: '리스트' },
  },
  thanks: {
    label: '감사 인사',
    variantCount: 5,
    optional: false,
    variantLabels: { 1: '기본', 2: '미니멀', 3: '스크립트', 4: '카드', 5: '스탬프' },
  },
}

interface SectionListPanelProps {
  sectionOrder: string[]
  sectionVariants: Record<string, number>
  hiddenSections?: string[]
  /** 디바이더 숨김 처리된 섹션 id 목록 (해당 섹션 위의 디바이더를 숨김) */
  hiddenDividers?: string[]
  /** 복제 가능한 섹션 타입 (예: ['gallery']). 복제된 인스턴스에 삭제 버튼이 노출됩니다. */
  duplicableTypes?: string[]
  /** 펼쳤을 때 variant 칩 아래에 렌더링할 섹션별 콘텐츠 (예: 갤러리 이미지 관리 UI) */
  renderSectionContent?: (sectionId: string) => React.ReactNode
  onReorder: (next: string[]) => void
  onVariantChange: (sectionId: string, variant: number) => void
  onToggleVisibility?: (sectionId: string) => void
  /** 디바이더 토글 핸들러 */
  onToggleDivider?: (sectionId: string) => void
  onRemoveInstance?: (sectionId: string) => void
  /** 복제 가능한 타입을 추가하는 핸들러 */
  onAddInstance?: (type: string) => void
  /** 섹션 배경 토글 관련 props */
  sectionBgMode?: 'plain' | 'tinted'
  tintedColor?: string
  sectionBgMap?: Record<string, 'default' | 'tinted'>
  onToggleSectionBg?: (sectionId: string) => void
}

export default function SectionListPanel({
  sectionOrder,
  sectionVariants,
  hiddenSections = [],
  hiddenDividers = [],
  duplicableTypes = [],
  renderSectionContent,
  onReorder,
  onVariantChange,
  onToggleVisibility,
  onToggleDivider,
  onRemoveInstance,
  onAddInstance,
  sectionBgMode,
  tintedColor,
  sectionBgMap,
  onToggleSectionBg,
}: SectionListPanelProps) {
  // 아코디언 펼침 상태 (섹션 인스턴스 ID 집합)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sectionOrder.indexOf(String(active.id))
    const newIndex = sectionOrder.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(sectionOrder, oldIndex, newIndex))
  }

  // 타입별 전체 개수 계산 (중복 인스턴스 번호 매김용)
  const typeCounts: Record<string, number> = {}
  sectionOrder.forEach((id) => {
    const type = getSectionType(id)
    typeCounts[type] = (typeCounts[type] ?? 0) + 1
  })

  // 타입별 진행 카운터
  const typeProgress: Record<string, number> = {}

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {sectionOrder.map((id, index) => {
            const type = getSectionType(id)
            const meta = SECTION_META[type]
            if (!meta) return null
            // 중복 인스턴스면 순번 표기 ("갤러리 1", "갤러리 2" 등)
            typeProgress[type] = (typeProgress[type] ?? 0) + 1
            const label =
              typeCounts[type] > 1 ? `${meta.label} ${typeProgress[type]}` : meta.label
            // 복제 가능한 타입 && 콜백 존재 시 삭제 버튼 활성화
            const canRemove = duplicableTypes.includes(type) && !!onRemoveInstance
            // 섹션 배경 상태 결정
            const bgOverride = sectionBgMap?.[id]
            const isTinted = bgOverride === 'tinted' || (bgOverride === undefined && sectionBgMode === 'tinted' && index % 2 === 1)
            // 디바이더 토글: intro가 아니고, 첫 번째 body 섹션도 아닌 경우에만 표시
            const isIntro = type === 'intro'
            const firstBodyIndex = sectionOrder.findIndex((s) => getSectionType(s) !== 'intro')
            const isFirstBody = index === firstBodyIndex
            const showDividerToggle = !isIntro && !isFirstBody && !!onToggleDivider
            return (
              <SortableSection
                key={id}
                id={id}
                sectionType={type}
                index={index}
                label={label}
                variantCount={meta.variantCount}
                optional={meta.optional}
                currentVariant={sectionVariants[id] ?? 1}
                hidden={hiddenSections.includes(id)}
                expanded={expandedIds.has(id)}
                variantGroups={meta.variantGroups}
                variantLabels={meta.variantLabels}
                onToggleExpand={() => toggleExpanded(id)}
                onVariantChange={(v) => onVariantChange(id, v)}
                onToggleVisibility={
                  meta.optional && onToggleVisibility ? () => onToggleVisibility(id) : undefined
                }
                onRemove={canRemove ? () => onRemoveInstance!(id) : undefined}
                content={renderSectionContent?.(id)}
                isTinted={sectionBgMode === 'tinted' ? isTinted : undefined}
                tintedColor={tintedColor}
                onToggleSectionBg={sectionBgMode === 'tinted' && onToggleSectionBg ? () => onToggleSectionBg(id) : undefined}
                dividerHidden={hiddenDividers.includes(id)}
                onToggleDivider={showDividerToggle ? () => onToggleDivider(id) : undefined}
              />
            )
          })}
        </ul>
      </SortableContext>

      {/* 섹션 추가 버튼 (복제 가능한 타입별로 표시) */}
      {onAddInstance && duplicableTypes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {duplicableTypes.map((type) => {
            const meta = SECTION_META[type]
            if (!meta) return null
            return (
              <button
                key={type}
                type="button"
                onClick={() => onAddInstance(type)}
                className="flex-1 min-w-[120px] flex flex-col items-center justify-center gap-1 bg-stone-50 border border-dashed border-stone-300 rounded-md py-3 text-xs text-stone-500 hover:bg-stone-100 hover:border-stone-500 hover:text-stone-800 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Plus size={13} />
                  {meta.label} 추가
                </span>
                <span className="text-[9px] text-stone-400">사진을 더 보여주고 싶을 때</span>
              </button>
            )
          })}
        </div>
      )}
    </DndContext>
  )
}

interface SortableSectionProps {
  id: string
  sectionType: string
  index: number
  label: string
  variantCount: number
  optional: boolean
  currentVariant: number
  hidden: boolean
  expanded: boolean
  variantGroups?: Array<{ label: string; variants: number[] }>
  variantLabels?: Record<number, string>
  onToggleExpand: () => void
  onVariantChange: (variant: number) => void
  onToggleVisibility?: () => void
  onRemove?: () => void
  content?: React.ReactNode
  /** tinted 모드일 때 이 섹션이 틴트 배경인지 */
  isTinted?: boolean
  tintedColor?: string
  onToggleSectionBg?: () => void
  /** 이 섹션 위의 디바이더가 숨겨져 있는지 */
  dividerHidden?: boolean
  /** 디바이더 토글 핸들러 */
  onToggleDivider?: () => void
}

function SortableSection({
  id,
  sectionType,
  index,
  label,
  variantCount,
  currentVariant,
  hidden,
  expanded,
  variantGroups,
  variantLabels,
  onToggleExpand,
  onVariantChange,
  onToggleVisibility,
  onRemove,
  content,
  isTinted,
  tintedColor,
  onToggleSectionBg,
  dividerHidden,
  onToggleDivider,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const hasContent = !!content

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`border rounded-md bg-white overflow-hidden ${
        isDragging
          ? 'border-stone-400 shadow-lg'
          : hasContent && expanded
            ? 'border-stone-400'
            : 'border-stone-200'
      } ${hidden ? 'opacity-60' : ''}`}
    >
      {/* 헤더 — 항상 표시 */}
      <div className="flex items-center gap-2 px-2 py-2">
        {/* Drag handle */}
        <button
          type="button"
          aria-label="섹션 순서 변경"
          className="p-1 text-stone-400 hover:text-stone-700 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>

        {/* Index */}
        <span className="text-[10px] tabular-nums text-stone-400 w-5">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Label */}
        <span className="flex-1 text-sm text-stone-800 truncate">{label}</span>

        {/* Divider toggle — 이 섹션 위의 디바이더 on/off */}
        {onToggleDivider && (
          <button
            type="button"
            onClick={onToggleDivider}
            aria-label={dividerHidden ? '디바이더 표시' : '디바이더 숨김'}
            title={dividerHidden ? '디바이더 OFF' : '디바이더 ON'}
            className={`relative p-1 transition-colors ${
              dividerHidden
                ? 'text-stone-300 hover:text-stone-500'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Minus size={13} />
            {dividerHidden && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="block w-[15px] h-[1.5px] bg-current rotate-45" />
              </span>
            )}
          </button>
        )}

        {/* Section background toggle (tinted mode) */}
        {onToggleSectionBg && (
          <button
            type="button"
            onClick={onToggleSectionBg}
            aria-label={isTinted ? '배경 끄기' : '배경 켜기'}
            title={isTinted ? '틴트 배경 ON' : '기본 배경'}
            className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110 flex-shrink-0"
            style={{
              background: isTinted ? (tintedColor || '#FAF8F5') : '#ffffff',
              borderColor: isTinted ? '#999' : '#d4d4d4',
            }}
          />
        )}

        {/* Visibility toggle (optional only) */}
        {onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label={hidden ? '섹션 표시' : '섹션 숨김'}
            className="p-1 text-stone-400 hover:text-stone-700"
          >
            {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}

        {/* Remove instance (duplicable sections only) */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="섹션 삭제"
            className="p-1 text-stone-400 hover:text-red-600"
          >
            <X size={13} />
          </button>
        )}

        {/* 펼치기/접기 표시 — 커스텀 콘텐츠가 있을 때만 */}
        {hasContent && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={expanded ? '접기' : '펼치기'}
            className="p-1 text-stone-400 hover:text-stone-700"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Variant 썸네일 — 항상 표시 */}
      <div className="px-3 pb-2 pt-0.5">
        {variantGroups ? (
          /* 그룹별 행 분리 (예: 갤러리 슬라이드 / 커스텀 레이아웃) */
          <div className="space-y-2">
            {variantGroups.map((group) => (
              <div key={group.label}>
                <div className="text-[9px] uppercase tracking-wider text-stone-400 mb-1">{group.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.variants.map((v) => {
                    const isActive = v === currentVariant
                    const vLabel = variantLabels?.[v]
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onVariantChange(v)}
                        aria-label={vLabel ?? `V${v}`}
                        title={vLabel ?? `V${v}`}
                        className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded border transition-colors ${
                          isActive
                            ? 'bg-stone-900 border-stone-900'
                            : 'bg-white border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <VariantThumbnail sectionType={sectionType} variant={v} active={isActive} />
                        <span className={`text-[9px] leading-none ${isActive ? 'text-white' : 'text-stone-400'}`}>
                          {vLabel ?? `V${v}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 기본: 한 줄로 나열 */
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: variantCount }, (_, i) => i + 1).map((v) => {
              const isActive = v === currentVariant
              const vLabel = variantLabels?.[v]
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onVariantChange(v)}
                  aria-label={vLabel ?? `V${v}`}
                  title={vLabel ?? `V${v}`}
                  className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded border transition-colors ${
                    isActive
                      ? 'bg-stone-900 border-stone-900'
                      : 'bg-white border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <VariantThumbnail sectionType={sectionType} variant={v} active={isActive} />
                  <span className={`text-[9px] leading-none ${isActive ? 'text-white' : 'text-stone-400'}`}>
                    {vLabel ?? `V${v}`}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 펼침 영역 — 섹션별 커스텀 콘텐츠 (예: 갤러리 이미지 관리) */}
      {hasContent && expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-stone-100 bg-stone-50/40">
          {content}
        </div>
      )}
    </li>
  )
}
