'use client'

import type { SectionContents } from '../page'

interface GreetingEditorProps {
  value: SectionContents['greeting']
  onChange: (next: SectionContents['greeting']) => void
}

/**
 * 인사말 섹션 에디터 — 라벨 / 타이틀 / 본문 편집
 */
export default function GreetingEditor({ value, onChange }: GreetingEditorProps) {
  const update = (patch: Partial<SectionContents['greeting']>) => {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">Label</span>
          <input
            type="text"
            value={value.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="Invitation"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">제목</span>
          <input
            type="text"
            value={value.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="초대합니다"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">본문</span>
        <textarea
          value={value.body}
          onChange={(e) => update({ body: e.target.value })}
          rows={5}
          placeholder="서로 다른 시간을 걸어온 두 사람이..."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white leading-relaxed resize-none"
        />
      </label>
    </div>
  )
}
