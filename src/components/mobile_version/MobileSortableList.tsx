'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface MobileSortableItemProps {
  id: string
  children: React.ReactNode
  isDragOverlay?: boolean
}

/**
 * 모바일 최적화 Sortable Item
 * - 터치 타겟: 최소 48px (Material Design 기준)
 * - 드래그 핸들: 충분한 여백과 시각적 피드백
 * - 접근성: ARIA 레이블, 키보드 접근성
 */
export function MobileSortableItem({ id, children, isDragOverlay }: MobileSortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.4 : 1,
  }

  // 드래그 오버레이용 스타일
  const overlayStyle: React.CSSProperties = isDragOverlay ? {
    opacity: 0.95,
    transform: 'scale(1.02)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    borderRadius: '12px',
    background: 'white',
  } : {}

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...overlayStyle }}
      {...attributes}
      className={`relative group ${isDragging ? 'bg-gray-50 rounded-xl' : ''}`}
    >
      {/* 모바일 최적화 드래그 핸들 - 최소 48px 너비 */}
      <div
        {...listeners}
        className={`
          absolute left-0 top-0 bottom-0
          w-12 min-h-[48px]
          flex items-center justify-center
          cursor-grab active:cursor-grabbing
          hover:bg-gray-100/80 active:bg-gray-200/80
          rounded-l-xl
          transition-colors duration-200
          touch-manipulation
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
          ${isDragging || isSorting ? 'bg-gray-100' : ''}
        `}
        role="button"
        aria-label="드래그하여 순서 변경. 스페이스바로 선택, 화살표로 이동, 스페이스바로 놓기"
        tabIndex={0}
        style={{
          // 터치 영역 확장 (실제 보이는 영역보다 넓게)
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* 드래그 아이콘 - 크기 확대 */}
        <GripVertical
          className={`
            w-5 h-5
            transition-colors duration-200
            ${isDragging ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-600'}
          `}
          aria-hidden="true"
        />
      </div>

      {/* 컨텐츠 영역 - 핸들 너비만큼 패딩 */}
      <div className="pl-12">
        {children}
      </div>
    </div>
  )
}

// 드래그 오버레이용 아이템 (드래그 중 보여지는 복사본)
function DragOverlayItem({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative bg-white rounded-xl shadow-2xl border border-gray-300"
      style={{
        transform: 'scale(1.02)',
        opacity: 0.95,
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gray-100 rounded-l-xl">
        <GripVertical className="w-5 h-5 text-gray-600" aria-hidden="true" />
      </div>
      <div className="pl-12">
        {children}
      </div>
    </div>
  )
}

interface MobileSortableListProps {
  items: string[]
  onReorder: (newOrder: string[]) => void
  children: React.ReactNode
  renderDragOverlay?: (activeId: string) => React.ReactNode
}

/**
 * 모바일 최적화 Sortable List
 * - 터치 드래그 활성화 거리: 15px (스크롤과 구분)
 * - 부드러운 드래그 애니메이션
 * - 키보드 접근성 지원
 */
export function MobileSortableList({ items, onReorder, children, renderDragOverlay }: MobileSortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 모바일에서 스크롤과 드래그를 명확히 구분하기 위해 거리 증가
        // 15px 이상 드래그해야 활성화 (스크롤은 세로, 드래그는 감지)
        distance: 15,
        // 터치 지연 추가 (선택사항)
        // delay: 100,
        // tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)

    // 모바일에서 드래그 시작 시 햅틱 피드백 (지원되는 경우)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      onReorder(arrayMove(items, oldIndex, newIndex))

      // 드래그 완료 시 햅틱 피드백
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 20, 30])
      }
    }
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>

      {/* 드래그 오버레이 - 드래그 중인 아이템의 시각적 복사본 */}
      <DragOverlay dropAnimation={{
        duration: 250,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeId && renderDragOverlay ? (
          <DragOverlayItem>
            {renderDragOverlay(activeId)}
          </DragOverlayItem>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
