'use client'

import { Plus, X, GripVertical } from 'lucide-react'
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
import type { SectionContents } from '../page'

type GuideItem = SectionContents['guide']['items'][number]

interface GuideEditorProps {
  value: SectionContents['guide']
  onChange: (next: SectionContents['guide']) => void
}

/** 각 아이템에 안정적인 id가 필요 → index 기반 id 생성 */
function itemIds(items: GuideItem[]) {
  return items.map((_, i) => `guide-item-${i}`)
}

/**
 * 결혼식 안내 섹션 에디터
 * - 항목 추가/삭제
 * - 드래그 앤 드롭 순서 변경
 * - 링크 필드 (옵션)
 */
export default function GuideEditor({ value, onChange }: GuideEditorProps) {
  const ids = itemIds(value.items)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const updateItem = (index: number, patch: Partial<GuideItem>) => {
    onChange({
      ...value,
      items: value.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  const addItem = () => {
    onChange({ ...value, items: [...value.items, { label: '', title: '', body: '' }] })
  }

  const removeItem = (index: number) => {
    onChange({ ...value, items: value.items.filter((_, i) => i !== index) })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    onChange({ ...value, items: arrayMove(value.items, oldIndex, newIndex) })
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          placeholder="Guide"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {value.items.map((item, index) => (
              <SortableGuideItem
                key={ids[index]}
                id={ids[index]}
                index={index}
                item={item}
                onUpdate={(patch) => updateItem(index, patch)}
                onRemove={() => removeItem(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addItem}
        className="w-full flex items-center justify-center gap-1.5 border border-dashed border-stone-300 rounded-md py-2 text-xs text-stone-500 hover:border-stone-500 hover:text-stone-800 transition-colors"
      >
        <Plus size={13} />
        항목 추가
      </button>
    </div>
  )
}

interface SortableGuideItemProps {
  id: string
  index: number
  item: GuideItem
  onUpdate: (patch: Partial<GuideItem>) => void
  onRemove: () => void
}

function SortableGuideItem({ id, index, item, onUpdate, onRemove }: SortableGuideItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border p-2.5 bg-white space-y-2 ${
        isDragging ? 'border-stone-400 shadow-lg' : 'border-stone-200'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {/* Drag handle */}
        <button
          type="button"
          aria-label="순서 변경"
          className="p-0.5 text-stone-400 hover:text-stone-700 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </button>
        <span className="text-[10px] uppercase tracking-wider text-stone-500 flex-1">
          항목 {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="항목 삭제"
          className="p-0.5 text-stone-400 hover:text-red-600"
        >
          <X size={12} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={item.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Dress Code"
          className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
        />
        <input
          type="text"
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="드레스코드"
          className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
        />
      </div>
      <textarea
        value={item.body}
        onChange={(e) => onUpdate({ body: e.target.value })}
        rows={2}
        placeholder="안내 본문"
        className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600 leading-relaxed resize-none"
      />
      <div>
        <span className="text-[10px] text-stone-400">링크 (옵션)</span>
        <input
          type="url"
          value={item.link ?? ''}
          onChange={(e) => onUpdate({ link: e.target.value || undefined })}
          placeholder="https://..."
          className="mt-0.5 w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
        />
      </div>
    </div>
  )
}
