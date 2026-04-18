'use client'

import type { SectionContents } from '../page'

interface InfoEditorProps {
  value: SectionContents['info']
  onChange: (next: SectionContents['info']) => void
}

/**
 * 예식 정보 섹션 에디터 — eyebrow 및 라벨 텍스트
 * 실제 날짜/시간/장소는 상단 "기본 정보"에서 편집합니다.
 */
export default function InfoEditor({ value, onChange }: InfoEditorProps) {
  const update = (patch: Partial<SectionContents['info']>) => {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] text-stone-400 leading-relaxed">
        날짜 · 시간 · 예식장은 상단 "기본 정보"에서 편집하세요.
      </p>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => update({ eyebrow: e.target.value })}
          placeholder="Wedding Date"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">시간 라벨</span>
          <input
            type="text"
            value={value.timeLabel}
            onChange={(e) => update({ timeLabel: e.target.value })}
            placeholder="Time"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">장소 라벨</span>
          <input
            type="text"
            value={value.placeLabel}
            onChange={(e) => update({ placeLabel: e.target.value })}
            placeholder="Place"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
      </div>
      {/* D-Day 카운트다운 옵션 */}
      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={value.showCountdown ?? false}
          onChange={(e) => update({ showCountdown: e.target.checked })}
          className="rounded border-stone-300"
        />
        <span className="text-[10px] uppercase tracking-wider text-stone-500">D-Day 카운트다운</span>
      </label>
      {value.showCountdown && (
        <div className="space-y-2 pl-0.5">
          <label className="block">
            <span className="text-[10px] text-stone-400">결혼식 전 문구 <span className="text-stone-300">({'{d}'} = 남은 일수)</span></span>
            <input
              type="text"
              value={value.countdownBeforeMsg ?? ''}
              onChange={(e) => update({ countdownBeforeMsg: e.target.value })}
              placeholder="결혼식이 {d}일 남았습니다."
              className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-stone-400">결혼식 당일 문구</span>
            <input
              type="text"
              value={value.countdownTodayMsg ?? ''}
              onChange={(e) => update({ countdownTodayMsg: e.target.value })}
              placeholder="오늘 결혼합니다."
              className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-stone-400">결혼식 후 문구</span>
            <input
              type="text"
              value={value.countdownAfterMsg ?? ''}
              onChange={(e) => update({ countdownAfterMsg: e.target.value })}
              placeholder="행복하고 따뜻하게 살겠습니다."
              className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </label>
        </div>
      )}
    </div>
  )
}
