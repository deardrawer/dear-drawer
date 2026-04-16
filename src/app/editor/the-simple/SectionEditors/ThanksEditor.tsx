'use client'

import type { SectionContents } from '../page'

interface ThanksEditorProps {
  value: SectionContents['thanks']
  onChange: (next: SectionContents['thanks']) => void
}

/**
 * 감사 인사 섹션 에디터 — 마크(상단 라벨) / 타이틀 / 본문
 * 서명(신랑 & 신부 이름)은 상단 "기본 정보"에서 자동으로 가져옵니다.
 */
export default function ThanksEditor({ value, onChange }: ThanksEditorProps) {
  const update = (patch: Partial<SectionContents['thanks']>) => {
    onChange({ ...value, ...patch })
  }

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
    </div>
  )
}
