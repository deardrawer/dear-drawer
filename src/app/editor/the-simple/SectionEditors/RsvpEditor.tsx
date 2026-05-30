'use client'

import type { SectionContents } from '../page'

interface RsvpEditorProps {
  value: SectionContents['rsvp']
  variant?: number
  onChange: (next: SectionContents['rsvp']) => void
}

export default function RsvpEditor({ value, variant = 1, onChange }: RsvpEditorProps) {
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

      {variant === 4 ? (
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">듀얼 버튼 문구</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={value.attendLabel ?? ''}
              onChange={(e) => onChange({ ...value, attendLabel: e.target.value || undefined })}
              placeholder="Attending"
              className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
            <input
              type="text"
              value={value.regretLabel ?? ''}
              onChange={(e) => onChange({ ...value, regretLabel: e.target.value || undefined })}
              placeholder="Regrets"
              className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </div>
        </div>
      ) : (
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">버튼 문구</span>
          <input
            type="text"
            value={value.buttonLabel ?? ''}
            onChange={(e) => onChange({ ...value, buttonLabel: e.target.value || undefined })}
            placeholder="참석 회신하기"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
      )}

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
            <span className="text-xs text-stone-600">연락처 뒷자리 4자리 입력</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showPhoneOption ?? false}
              onClick={() => onChange({ ...value, showPhoneOption: !(value.showPhoneOption ?? false) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showPhoneOption ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showPhoneOption ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between">
            <span className="text-xs text-stone-600">부모님 하객 구분</span>
            <button
              type="button"
              role="switch"
              aria-checked={value.showSideDetail ?? false}
              onClick={() => onChange({ ...value, showSideDetail: !(value.showSideDetail ?? false), ...( !(value.showSideDetail ?? false) && !value.sideDetailOptions ? { sideDetailOptions: { groomFather: true, groomMother: true, brideFather: true, brideMother: true } } : {}) })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                value.showSideDetail ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  value.showSideDetail ? 'translate-x-[18px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </label>
          {value.showSideDetail && (
            <div className="ml-4 space-y-1.5 pt-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.sideDetailOptions?.groomFather ?? true}
                  onChange={(e) => onChange({ ...value, sideDetailOptions: { ...value.sideDetailOptions, groomFather: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-xs text-stone-600">신랑 아버지 지인</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.sideDetailOptions?.groomMother ?? true}
                  onChange={(e) => onChange({ ...value, sideDetailOptions: { ...value.sideDetailOptions, groomMother: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-xs text-stone-600">신랑 어머니 지인</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.sideDetailOptions?.brideFather ?? true}
                  onChange={(e) => onChange({ ...value, sideDetailOptions: { ...value.sideDetailOptions, brideFather: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-xs text-stone-600">신부 아버지 지인</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.sideDetailOptions?.brideMother ?? true}
                  onChange={(e) => onChange({ ...value, sideDetailOptions: { ...value.sideDetailOptions, brideMother: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-xs text-stone-600">신부 어머니 지인</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 메시지 입력란 안내 */}
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">메시지 입력란 안내</span>
        <input
          type="text"
          value={value.messagePlaceholder ?? ''}
          onChange={(e) => onChange({ ...value, messagePlaceholder: e.target.value || undefined })}
          placeholder="축하 메시지 (선택)"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

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
