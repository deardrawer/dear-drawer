'use client'

import type { SectionContents } from '../page'

interface RsvpEditorProps {
  value: SectionContents['rsvp']
  onChange: (next: SectionContents['rsvp']) => void
}

export default function RsvpEditor({ value, onChange }: RsvpEditorProps) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">타이틀</span>
        <input
          type="text"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="R.S.V.P."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">본문</span>
        <textarea
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          rows={3}
          placeholder="참석 여부를 전해주시면&#10;정성껏 준비하겠습니다."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white leading-relaxed resize-none"
        />
      </label>
    </div>
  )
}
