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
      {/* 예식일 도형 옵션 */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">예식일 도형 <span className="normal-case tracking-normal text-stone-400">(캘린더 · 주간)</span></div>
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { key: 'empty-circle', label: '빈 원', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            )},
            { key: 'filled-circle', label: '꽉찬 원', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor" /></svg>
            )},
            { key: 'diamond', label: '다이아몬드', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 12 12)" /></svg>
            )},
            { key: 'heart', label: '하트', icon: (
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" /></svg>
            )},
          ] as const).map((shape) => (
            <button
              key={shape.key}
              type="button"
              onClick={() => update({ dateShape: shape.key as 'empty-circle' | 'filled-circle' | 'diamond' | 'heart' })}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded border text-[9px] transition-colors ${
                (value.dateShape || 'empty-circle') === shape.key
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              {shape.icon}
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* 도형 색상 */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">도형 색상 <span className="normal-case tracking-normal text-stone-400">(캘린더 · 주간)</span></div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value.dateShapeColor || '#b5a48b'}
            onChange={(e) => update({ dateShapeColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={value.dateShapeColor || ''}
            onChange={(e) => update({ dateShapeColor: e.target.value })}
            placeholder="기본 포인트 컬러"
            className="flex-1 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600 font-mono"
          />
          {value.dateShapeColor && (
            <button
              type="button"
              onClick={() => update({ dateShapeColor: undefined })}
              className="text-[10px] text-stone-400 hover:text-stone-600 shrink-0"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 예식 날짜 포인트 컬러 */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">날짜 포인트 컬러 <span className="normal-case tracking-normal text-stone-400">(캘린더 · 주간)</span></div>
        <p className="text-[9px] text-stone-400">예식일 텍스트 색상</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value.datePointColor || '#b5a48b'}
            onChange={(e) => update({ datePointColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={value.datePointColor || ''}
            onChange={(e) => update({ datePointColor: e.target.value })}
            placeholder="기본 포인트 컬러"
            className="flex-1 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600 font-mono"
          />
          {value.datePointColor && (
            <button
              type="button"
              onClick={() => update({ datePointColor: undefined })}
              className="text-[10px] text-stone-400 hover:text-stone-600 shrink-0"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 예식장 정보 표시 */}
      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={value.showVenue ?? false}
          onChange={(e) => update({ showVenue: e.target.checked })}
          className="rounded border-stone-300"
        />
        <span className="text-[10px] uppercase tracking-wider text-stone-500">예식장 정보 표시</span>
      </label>
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
