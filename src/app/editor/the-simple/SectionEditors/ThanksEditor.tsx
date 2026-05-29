'use client'

import type { SectionContents } from '../page'

interface ThanksEditorProps {
  value: SectionContents['thanks']
  onChange: (next: SectionContents['thanks']) => void
}

/**
 * 감사 인사 섹션 에디터 — 마크(상단 라벨) / 타이틀 / 본문 / 서명 이름 / 이름 크기
 */
export default function ThanksEditor({ value, onChange }: ThanksEditorProps) {
  const update = (patch: Partial<SectionContents['thanks']>) => {
    onChange({ ...value, ...patch })
  }

  const nameScale = value.nameScale ?? 1

  return (
    <div className="space-y-2.5">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Mark</span>
        <input
          type="text"
          value={value.mark}
          onChange={(e) => update({ mark: e.target.value })}
          placeholder="Thank You"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Title</span>
        <input
          type="text"
          value={value.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="소중한 걸음에 감사드립니다"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">본문</span>
        <textarea
          value={value.body}
          onChange={(e) => update({ body: e.target.value })}
          rows={3}
          placeholder="귀한 시간 내어..."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white leading-relaxed resize-none"
        />
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">서명 (신랑 & 신부 이름)</span>
        <input
          type="text"
          value={value.names || ''}
          onChange={(e) => update({ names: e.target.value })}
          placeholder="비워두면 기본 정보에서 자동으로 가져옵니다"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">서명 글자 크기</span>
          <span className="text-[10px] text-stone-400 tabular-nums">{Math.round(nameScale * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.7}
          max={1.6}
          step={0.05}
          value={nameScale}
          onChange={(e) => update({ nameScale: parseFloat(e.target.value) })}
          className="mt-1 w-full accent-stone-600"
        />
      </div>
    </div>
  )
}
