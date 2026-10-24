'use client'

// THE CLASSIC 간지(글 간지 · 사진 간지) 공용 글꼴 선택 · 글자 조정 부품

import { DISPLAY_FONTS, KOREAN_FONTS } from '@/app/editor/the-simple/fontOptions'
import { GRIUN_FONTS, griunMissingChars } from '@/lib/griunFonts'
import { MS_HAND_FONT_IDS } from '@/app/i/[slug]/InvitationClientClassic'

export type FontOpt = { id: string; name: string; family?: string }

// 글꼴 스택 끝의 일반 글꼴(serif 등) 제거 — 뒤에 한글 글꼴을 이어 붙일 때 일반 글꼴이 한글까지 가로채지 않게
export const stripGeneric = (stack?: string) => (stack || '').replace(/,\s*(serif|sans-serif|cursive|monospace|system-ui)\s*$/, '')
export type FontGroup = { label?: string; items: FontOpt[] }

// 글꼴 미리보기 견본: 이 간지에 실제로 들어간 글 중 첫 줄 (없으면 기본 문장)
export const sampleFrom = (vals: string[], re: RegExp, fallback: string, max: number): string => {
  const line = vals.flatMap((v) => v.split('\n')).map((l) => l.trim()).find((l) => re.test(l))
  if (!line) return fallback
  const chars = Array.from(line)
  return chars.length > max ? chars.slice(0, max).join('') + '…' : line
}

/** 한글 글꼴 목록: 맨 앞 기본 항목들 + 그리운 손글씨 · 손글씨 · 바탕·고딕 */
export function koFontGroups(defaults: FontOpt[], bodyFamily?: string): FontGroup[] {
  return [
    { items: defaults },
    { label: '그리운 손글씨', items: GRIUN_FONTS.map((f) => ({ id: f.id, name: f.name, family: `${f.family}, ${bodyFamily || 'serif'}` })) },
    { label: '손글씨', items: KOREAN_FONTS.filter((f) => MS_HAND_FONT_IDS.includes(f.id)).map((f) => ({ id: f.id, name: f.name, family: f.fontFamily })) },
    { label: '바탕 · 고딕', items: KOREAN_FONTS.filter((f) => !MS_HAND_FONT_IDS.includes(f.id)).map((f) => ({ id: f.id, name: f.name, family: f.fontFamily })) },
  ]
}

/** 영문 글꼴 목록: 맨 앞 '청첩장 영문 글꼴'(id '') + 영문 글꼴 */
export function enFontGroups(displayFamily?: string): FontGroup[] {
  return [
    { items: [{ id: '', name: '청첩장 영문 글꼴', family: displayFamily }] },
    { items: DISPLAY_FONTS.map((f) => ({ id: f.id, name: f.name, family: f.fontFamily })) },
  ]
}

export const bodyFamilyOf = (bodyFont?: string) => KOREAN_FONTS.find((f) => f.id === (bodyFont || 'classic'))?.fontFamily
export const displayFamilyOf = (displayFont?: string) => DISPLAY_FONTS.find((f) => f.id === (displayFont || 'italiana'))?.fontFamily

// 글꼴 고르기: 버튼을 누르면 아래에 글꼴마다 견본 문장을 그 글꼴로 보여 준다 (select 는 글꼴 미리보기가 안 됨)
export function FontGrid({ groups, value, sample, onPick }: { groups: FontGroup[]; value: string; sample: string; onPick: (id: string) => void }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-2 space-y-2 max-h-[340px] overflow-y-auto">
      {groups.map((g, gi) => (
        <div key={gi} className="space-y-1">
          {g.label ? <p className="px-0.5 text-[10px] text-gray-400">{g.label}</p> : null}
          <div className="grid grid-cols-2 gap-1.5">
            {g.items.map((f) => {
              const active = f.id === value
              return (
                <button
                  key={f.id || 'default'}
                  type="button"
                  onClick={() => onPick(f.id)}
                  className={`min-w-0 rounded-md border px-2 py-1.5 text-left transition-colors ${active ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-accent)]/5' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <span className={`block text-[10px] ${active ? 'text-[color:var(--ed-accent)] font-medium' : 'text-gray-400'}`}>{f.name}</span>
                  <span className="block truncate text-[15px] leading-snug text-gray-800" style={{ fontFamily: f.family }}>{sample}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// 글꼴 선택 버튼 (현재 글꼴 이름을 그 글꼴로)
export function FontTrigger({ label, name, family, open, onClick }: { label: string; name: string; family?: string; open: boolean; onClick: () => void }) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] text-gray-500">{label}</span>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-white px-2 text-sm text-gray-700 transition-colors ${open ? 'border-gray-500' : 'border-gray-200 hover:border-gray-400'}`}
      >
        <span className="min-w-0 truncate" style={{ fontFamily: family }}>{name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} aria-hidden><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </div>
  )
}

// 글자 조정 슬라이더 한 줄 (라벨 · 값 · 슬라이더)
export function TuneSlider({ label, min, max, value, show, onChange }: { label: string; min: number; max: number; value: number; show: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>{label}</span><span>{show(value)}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(ev) => onChange(Number(ev.target.value))} className="w-full accent-[color:var(--ed-accent)]" />
    </div>
  )
}

// 2,780자 그리운 글꼴이면: 지금 글에서 글꼴에 없는 글자 안내 (없으면 일반 안내)
export function GriunGlyphNote({ koId, text, fallbackLabel }: { koId: string; text: string; fallbackLabel: string }) {
  const g = GRIUN_FONTS.find((f) => f.id === koId)
  if (!g || g.full) return null
  const missing = griunMissingChars(koId, text)
  return missing.length ? (
    <p className="text-[11px] leading-snug text-amber-700">
      {g.name}에 없는 글자가 있어요: <b className="font-medium">{missing.slice(0, 12).join(' ')}</b>{missing.length > 12 ? ` 외 ${missing.length - 12}자` : ''}. 이 글자만 {fallbackLabel}로 보여요.
    </p>
  ) : (
    <p className="text-[10px] text-gray-400 leading-tight">자주 쓰는 한글 2,780자가 들어 있는 글꼴이에요. 드문 글자는 {fallbackLabel}로 보여요.</p>
  )
}
