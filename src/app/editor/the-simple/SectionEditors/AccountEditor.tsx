'use client'

import { Plus, X } from 'lucide-react'
import type { SectionContents } from '../page'

type Account = { bank: string; number: string; holder: string }

interface AccountEditorProps {
  value: SectionContents['account']
  onChange: (next: SectionContents['account']) => void
}

/**
 * 마음 전하실 곳 섹션 에디터 — 신랑/신부 + 아버지/어머니 별도 계좌
 */
export default function AccountEditor({ value, onChange }: AccountEditorProps) {
  const isBrideFirst = value.order === 'bride-first'
  type SideKey = 'groom' | 'bride' | 'groomFather' | 'groomMother' | 'brideFather' | 'brideMother'

  const updateSide = (
    side: SideKey,
    index: number,
    patch: Partial<Account>
  ) => {
    onChange({
      ...value,
      [side]: (value[side] || []).map((acc: Account, i: number) => (i === index ? { ...acc, ...patch } : acc)),
    })
  }

  const addAccount = (side: SideKey) => {
    onChange({
      ...value,
      [side]: [...(value[side] || []), { bank: '', number: '', holder: '' }],
    })
  }

  const removeAccount = (side: SideKey, index: number) => {
    onChange({
      ...value,
      [side]: (value[side] || []).filter((_: Account, i: number) => i !== index),
    })
  }

  const renderSide = (side: SideKey, label: string) => (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-stone-500">{label}</div>
      {(value[side] || []).map((acc: Account, index: number) => (
        <div
          key={index}
          className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2 relative"
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-stone-400">#{index + 1}</div>
            <button
              type="button"
              onClick={() => removeAccount(side, index)}
              aria-label="계좌 삭제"
              className="p-0.5 text-stone-400 hover:text-red-600"
            >
              <X size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={acc.bank}
              onChange={(e) => updateSide(side, index, { bank: e.target.value })}
              placeholder="은행명"
              className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
            />
            <input
              type="text"
              value={acc.holder}
              onChange={(e) => updateSide(side, index, { holder: e.target.value })}
              placeholder="예금주"
              className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
            />
          </div>
          <input
            type="text"
            value={acc.number}
            onChange={(e) => updateSide(side, index, { number: e.target.value })}
            placeholder="계좌번호"
            className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600 font-mono"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => addAccount(side)}
        className="w-full flex items-center justify-center gap-1.5 border border-dashed border-stone-300 rounded-md py-1.5 text-[11px] text-stone-500 hover:border-stone-500 hover:text-stone-800 transition-colors"
      >
        <Plus size={12} />
        {label} 계좌 추가
      </button>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* 토글 옵션 */}
      <div className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.toggle?.enabled ?? false}
            onChange={(e) =>
              onChange({
                ...value,
                toggle: {
                  enabled: e.target.checked,
                  label: value.toggle?.label || '마음 전하실 곳',
                },
              })
            }
            className="rounded border-stone-300"
          />
          <span className="text-[10px] uppercase tracking-wider text-stone-500">토글 (접기/펼치기)</span>
        </label>
        {value.toggle?.enabled && (
          <>
            <input
              type="text"
              value={value.toggle.label}
              onChange={(e) =>
                onChange({
                  ...value,
                  toggle: { ...value.toggle!, label: e.target.value },
                })
              }
              placeholder="버튼 텍스트"
              className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">버튼 스타일</span>
              <div className="flex gap-2 mt-1">
                {([
                  { s: 1, label: '아웃라인', style: { color: '#78716c', border: '1px solid #d6d3d1', borderRadius: 20, padding: '4px 12px', background: 'transparent', fontSize: 9 } },
                  { s: 2, label: '채움', style: { background: '#78716c', color: '#fff', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 9 } },
                  { s: 3, label: '밑줄 ▼', style: { background: 'transparent', color: '#78716c', border: 'none', padding: '4px 4px', textDecoration: 'underline', textUnderlineOffset: '3px', fontSize: 9 } },
                  { s: 4, label: '둥근 채움', style: { background: '#44403c', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 9 } },
                ] as const).map(({ s, label: btnLabel, style }) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        toggle: { ...value.toggle!, style: s },
                      })
                    }
                    className={`transition-all ${(value.toggle?.style ?? 1) === s ? 'ring-2 ring-stone-500 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                    style={style as React.CSSProperties}
                  >
                    {btnLabel}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">Eyebrow</span>
        <input
          type="text"
          value={value.eyebrow}
          onChange={(e) => onChange({ ...value, eyebrow: e.target.value })}
          placeholder="Account"
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">안내 문구</span>
        <textarea
          value={value.guide || ''}
          onChange={(e) => onChange({ ...value, guide: e.target.value })}
          placeholder="참석이 어려우신 분들을 위해 기재했습니다."
          rows={2}
          className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white resize-none"
        />
      </label>

      {/* 탭 버튼 라벨 */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">신랑측 버튼</span>
          <input
            type="text"
            value={value.groomLabel || ''}
            onChange={(e) => onChange({ ...value, groomLabel: e.target.value })}
            placeholder="Groom"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">신부측 버튼</span>
          <input
            type="text"
            value={value.brideLabel || ''}
            onChange={(e) => onChange({ ...value, brideLabel: e.target.value })}
            placeholder="Bride"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
      </div>
      {/* 신랑/신부 호칭 */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">신랑 호칭</span>
          <input
            type="text"
            value={value.groomTitle || ''}
            onChange={(e) => onChange({ ...value, groomTitle: e.target.value })}
            placeholder="Groom"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-stone-400">신부 호칭</span>
          <input
            type="text"
            value={value.brideTitle || ''}
            onChange={(e) => onChange({ ...value, brideTitle: e.target.value })}
            placeholder="Bride"
            className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
          />
        </label>
      </div>

      {/* 순서 변경 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-stone-400">순서</span>
        <button
          type="button"
          onClick={() => onChange({ ...value, order: isBrideFirst ? 'groom-first' : 'bride-first' })}
          className="flex items-center gap-1.5 text-[11px] text-stone-600 border border-stone-200 rounded-md px-2.5 py-1 hover:bg-stone-50 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          {isBrideFirst ? '신부 → 신랑' : '신랑 → 신부'}
        </button>
      </div>

      {(isBrideFirst ? [
        { sectionLabel: '신부측', sideKey: 'bride' as SideKey, sideLabel: '신부',
          fatherKey: 'brideFather' as SideKey, motherKey: 'brideMother' as SideKey,
          fatherNameKey: 'brideFatherName' as const, motherNameKey: 'brideMotherName' as const,
          fatherPlaceholder: '성함 (예: 박철수)', motherPlaceholder: '성함 (예: 이영희)' },
        { sectionLabel: '신랑측', sideKey: 'groom' as SideKey, sideLabel: '신랑',
          fatherKey: 'groomFather' as SideKey, motherKey: 'groomMother' as SideKey,
          fatherNameKey: 'groomFatherName' as const, motherNameKey: 'groomMotherName' as const,
          fatherPlaceholder: '성함 (예: 홍길동)', motherPlaceholder: '성함 (예: 김순이)' },
      ] : [
        { sectionLabel: '신랑측', sideKey: 'groom' as SideKey, sideLabel: '신랑',
          fatherKey: 'groomFather' as SideKey, motherKey: 'groomMother' as SideKey,
          fatherNameKey: 'groomFatherName' as const, motherNameKey: 'groomMotherName' as const,
          fatherPlaceholder: '성함 (예: 홍길동)', motherPlaceholder: '성함 (예: 김순이)' },
        { sectionLabel: '신부측', sideKey: 'bride' as SideKey, sideLabel: '신부',
          fatherKey: 'brideFather' as SideKey, motherKey: 'brideMother' as SideKey,
          fatherNameKey: 'brideFatherName' as const, motherNameKey: 'brideMotherName' as const,
          fatherPlaceholder: '성함 (예: 박철수)', motherPlaceholder: '성함 (예: 이영희)' },
      ]).map((section, idx) => (
        <div key={section.sideKey}>
          <div className={`text-xs font-semibold text-stone-700 pt-2${idx > 0 ? ' border-t border-stone-200 mt-2' : ''}`}>{section.sectionLabel}</div>
          {renderSide(section.sideKey, section.sideLabel)}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-stone-500">{section.sideLabel} 아버지</div>
            <input
              type="text"
              value={value[section.fatherNameKey] || ''}
              onChange={(e) => onChange({ ...value, [section.fatherNameKey]: e.target.value })}
              placeholder={section.fatherPlaceholder}
              className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </div>
          {renderSide(section.fatherKey, `${section.sideLabel} 아버지`)}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-stone-500">{section.sideLabel} 어머니</div>
            <input
              type="text"
              value={value[section.motherNameKey] || ''}
              onChange={(e) => onChange({ ...value, [section.motherNameKey]: e.target.value })}
              placeholder={section.motherPlaceholder}
              className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </div>
          {renderSide(section.motherKey, `${section.sideLabel} 어머니`)}
        </div>
      ))}
    </div>
  )
}
