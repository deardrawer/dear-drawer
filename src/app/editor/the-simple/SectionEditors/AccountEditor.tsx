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

      <div className="text-xs font-semibold text-stone-700 pt-2">신랑측</div>
      {renderSide('groom', '신랑')}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">신랑 아버지</div>
        <input
          type="text"
          value={value.groomFatherName || ''}
          onChange={(e) => onChange({ ...value, groomFatherName: e.target.value })}
          placeholder="성함 (예: 홍길동)"
          className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </div>
      {renderSide('groomFather', '신랑 아버지')}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">신랑 어머니</div>
        <input
          type="text"
          value={value.groomMotherName || ''}
          onChange={(e) => onChange({ ...value, groomMotherName: e.target.value })}
          placeholder="성함 (예: 김순이)"
          className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </div>
      {renderSide('groomMother', '신랑 어머니')}

      <div className="text-xs font-semibold text-stone-700 pt-2 border-t border-stone-200 mt-2">신부측</div>
      {renderSide('bride', '신부')}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">신부 아버지</div>
        <input
          type="text"
          value={value.brideFatherName || ''}
          onChange={(e) => onChange({ ...value, brideFatherName: e.target.value })}
          placeholder="성함 (예: 박철수)"
          className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </div>
      {renderSide('brideFather', '신부 아버지')}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500">신부 어머니</div>
        <input
          type="text"
          value={value.brideMotherName || ''}
          onChange={(e) => onChange({ ...value, brideMotherName: e.target.value })}
          placeholder="성함 (예: 이영희)"
          className="w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
        />
      </div>
      {renderSide('brideMother', '신부 어머니')}
    </div>
  )
}
