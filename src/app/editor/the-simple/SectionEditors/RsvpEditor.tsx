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

      {/* RSVP 옵션 토글 */}
      <div className="pt-2 border-t border-stone-100">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">RSVP 옵션</span>
        <div className="mt-2 space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">식사 여부 입력 허용</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showMealOption ?? false}
              onClick={() => onChange({ ...value, showMealOption: !(value.showMealOption ?? false) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showMealOption ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showMealOption ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">대절버스 이용 여부 입력 허용</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showShuttleOption ?? false}
              onClick={() => onChange({ ...value, showShuttleOption: !(value.showShuttleOption ?? false) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showShuttleOption ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showShuttleOption ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">신랑측/신부측 선택 허용</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showSideOption ?? false}
              onClick={() => onChange({ ...value, showSideOption: !(value.showSideOption ?? false) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showSideOption ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showSideOption ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* 안내 문구 */}
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">안내 문구</span>
        <textarea
          value={value.rsvpNotice ?? ''}
          onChange={(e) => onChange({ ...value, rsvpNotice: e.target.value })}
          rows={2}
          placeholder="예) 소규모로 진행되는 예식입니다.&#10;참석 여부를 미리 알려주시면 감사하겠습니다."
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white leading-relaxed resize-none"
        />
      </label>
    </div>
  )
}
