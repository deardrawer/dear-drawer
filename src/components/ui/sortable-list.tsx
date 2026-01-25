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

interface SortableItemProps {
  id: string
  children: React.ReactNode
  isDragOverlay?: boolean
}

export function SortableItem({ id, children, isDragOverlay }: SortableItemProps) {
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
    borderRadius: '8px',
    background: 'white',
  } : {}

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...overlayStyle }}
      {...attributes}
      className={`relative group ${isDragging ? 'bg-gray-50 rounded-lg' : ''}`}
    >
      {/* 드래그 핸들 - 모바일 터치 타겟 확대 (w-10 = 40px, 모바일에서 w-12 = 48px) */}
      <div
        {...listeners}
        className={`
          absolute left-0 top-0 bottom-0 w-10 sm:w-12
          flex items-center justify-center
          cursor-grab active:cursor-grabbing
          hover:bg-gray-100/70 rounded-l-lg
          transition-colors duration-150
          touch-manipulation
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset
          ${isDragging || isSorting ? 'bg-gray-100' : ''}
        `}
        role="button"
        aria-label="드래그하여 순서 변경. 스페이스바로 선택, 화살표로 이동, 스페이스바로 놓기"
        tabIndex={0}
      >
        <GripVertical
          className={`
            w-4 h-4
            transition-colors duration-150
            ${isDragging ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-600'}
          `}
          aria-hidden="true"
        />
      </div>
      {/* 컨텐츠 영역 - 핸들 너비만큼 패딩 */}
      <div className="pl-10 sm:pl-12">
        {children}
      </div>
    </div>
  )
}

// 드래그 오버레이용 아이템 (드래그 중 보여지는 복사본)
function DragOverlayItem({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative bg-white rounded-lg shadow-xl border border-gray-200"
      style={{
        transform: 'scale(1.02)',
        opacity: 0.95,
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-12 flex items-center justify-center bg-gray-100 rounded-l-lg">
        <GripVertical className="w-4 h-4 text-gray-600" aria-hidden="true" />
      </div>
      <div className="pl-10 sm:pl-12">
        {children}
      </div>
    </div>
  )
}

interface SortableListProps {
  items: string[]
  onReorder: (newOrder: string[]) => void
  children: React.ReactNode
  renderDragOverlay?: (activeId: string) => React.ReactNode
}

export function SortableList({ items, onReorder, children, renderDragOverlay }: SortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // 모바일에서 스크롤과 구분하기 위해 거리 증가
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      onReorder(arrayMove(items, oldIndex, newIndex))
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
        duration: 200,
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
