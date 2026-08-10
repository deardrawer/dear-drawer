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

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">본문 글자 크기</span>
          <span className="text-[10px] tabular-nums text-stone-500">{Math.round((value.bodyScale ?? 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.7}
          max={1.3}
          step={0.05}
          value={value.bodyScale ?? 1}
          onChange={(e) => update({ bodyScale: parseFloat(e.target.value) })}
          className="mt-1 w-full accent-stone-600 h-1"
        />
        <p className="mt-1 text-[10px] text-stone-400 leading-relaxed">
          기기마다 줄바꿈이 다를 수 있습니다. 본문이 길 경우 크기를 줄여 보세요.
        </p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          checked={value.showParents ?? false}
          onChange={(e) => update({ showParents: e.target.checked })}
          className="h-3.5 w-3.5 accent-stone-700"
        />
        <span className="text-[11px] text-stone-600">
          하단에 부모님 이름 표시 <span className="text-stone-400">(예: 김영호 · 박순영의 아들 · 한지훈)</span>
        </span>
      </label>
      {value.showParents && (
        <p className="text-[10px] text-stone-400 leading-relaxed pl-5">
          부모님 성함은 <span className="text-stone-500 font-medium">‘커플소개2 + 연락하기’</span> 섹션에서 입력한 내용이 표시됩니다.
        </p>
      )}
    </div>
  )
}
