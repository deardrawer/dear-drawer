'use client'

import { useState, type ReactNode } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import ColorField from '@/components/editor/ColorField'
import ClassicPhotoField from './ClassicPhotoField'
import { DISPLAY_FONTS, KOREAN_FONTS } from '@/app/editor/the-simple/fontOptions'
import { GRIUN_FONTS, griunMissingChars } from '@/lib/griunFonts'
import { INTER_MAX } from '@/lib/classicInterKeys'
import {
  CLASSIC_TEXT_INTER_DEFAULTS,
  MS_HAND_FONT_IDS,
  CLASSIC_TEXT_INTER_EXAMPLES,
  type ClassicTextInter,
  type ClassicTextInterBgMode,
  type ClassicTextInterType,
} from '@/app/i/[slug]/InvitationClientClassic'

/**
 * THE CLASSIC 글 간지 (선택 섹션) — 사진 없이 글로 쉬어 가는 페이지 6종.
 * content.classicTextInterstitials 에 저장. 비어 있으면 청첩장에 아무것도 표시되지 않는다.
 */

interface Props {
  onRemove?: (index: number) => void // 간지를 지웠을 때 (섹션 순서 자리 당기기용)
  bodyFont?: string // 청첩장 한글 본문 글꼴 id (classicBodyFont) — '청첩장 본문 글꼴' 견본용
  displayFont?: string // 청첩장 영문 글꼴 id (classicDisplayFont)
  value?: ClassicTextInter[]
  onChange: (list: ClassicTextInter[]) => void
  invitationId?: string
  lang?: 'ko' | 'en' // 청첩장 화면 언어 — 예시 문장을 이 언어로 채운다
}

const TYPES: { id: ClassicTextInterType; label: string }[] = [
  { id: 'verse', label: '시집 한 페이지' },
  { id: 'quote', label: '큰 따옴표 인용' },
  { id: 'promises', label: '약속 목록' },
  { id: 'manuscript', label: '원고지' },
  { id: 'underline', label: '책 속 밑줄' },
  { id: 'card', label: '종이 카드' },
]

// 포인트 컬러가 칠하는 곳 (포인트가 없는 타입은 표시 안 함)
const POINT_HINT: Partial<Record<ClassicTextInterType, string>> = {
  verse: '선 양 끝 따옴표',
  quote: '큰 따옴표 · 출처 앞 선',
  manuscript: '원고지 줄',
  underline: '밑줄 · 여백 메모',
}

// 선 색이 칠하는 곳 (가로선이 없는 타입은 표시 안 함 · 원고지 줄은 포인트 컬러)
const LINE_HINT: Partial<Record<ClassicTextInterType, string>> = {
  verse: '위아래 가로선',
  quote: '출처 앞 짧은 선',
  promises: '항목 아래 선',
  underline: '여백 메모 앞 짧은 선',
}

const BG_MODES: { id: ClassicTextInterBgMode; label: string }[] = [
  { id: 'base', label: '기본 배경' },
  { id: 'tint', label: '틴티드 배경' },
  { id: 'custom', label: '직접 선택' },
]

// 타입을 고르면 비어 있는 글 칸만 예시 문장으로 채운다 (이미 쓴 글은 그대로)
const withExamples = (it: ClassicTextInter, type: ClassicTextInterType, lang: 'ko' | 'en'): ClassicTextInter => {
  const next: Record<string, unknown> = { ...it, type }
  Object.entries(CLASSIC_TEXT_INTER_EXAMPLES[type][lang]).forEach(([k, v]) => {
    const cur = next[k]
    if (v && !(typeof cur === 'string' && cur.trim())) next[k] = v
  })
  return next as ClassicTextInter
}

// 글 간지에서 실제로 쓰는 한글 글꼴 id: 원고지는 고르지 않으면 손글씨(오무다예), 나머지는 청첩장 본문 글꼴('body')
const koFontOf = (it: ClassicTextInter): string =>
  it.koFont || (it.type === 'manuscript' ? (!it.msFont || it.msFont === 'hand' ? 'neathand' : it.msFont) : 'body')

// 글꼴 미리보기 견본: 이 글 간지에 실제로 들어간 글 중 첫 줄 (없으면 기본 문장)
const sampleFrom = (vals: string[], re: RegExp, fallback: string, max: number): string => {
  const line = vals.flatMap((v) => v.split('\n')).map((l) => l.trim()).find((l) => re.test(l))
  if (!line) return fallback
  const chars = Array.from(line)
  return chars.length > max ? chars.slice(0, max).join('') + '…' : line
}

type FontOpt = { id: string; name: string; family?: string }

// 글꼴 고르기: 버튼을 누르면 아래에 글꼴마다 견본 문장을 그 글꼴로 보여 준다 (select 는 글꼴 미리보기가 안 됨)
function FontGrid({ groups, value, sample, onPick }: { groups: { label?: string; items: FontOpt[] }[]; value: string; sample: string; onPick: (id: string) => void }) {
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

// 글자 조정 슬라이더 한 줄 (라벨 · 값 · 슬라이더)
function TuneSlider({ label, min, max, value, show, onChange }: { label: string; min: number; max: number; value: number; show: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>{label}</span><span>{show(value)}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(ev) => onChange(Number(ev.target.value))} className="w-full accent-[color:var(--ed-accent)]" />
    </div>
  )
}

// 글꼴 선택 버튼 (현재 글꼴 이름을 그 글꼴로)
function FontTrigger({ label, name, family, open, onClick }: { label: string; name: string; family?: string; open: boolean; onClick: () => void }) {
  return (
    <Field label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-white px-2 text-sm text-gray-700 transition-colors ${open ? 'border-gray-500' : 'border-gray-200 hover:border-gray-400'}`}
      >
        <span className="min-w-0 truncate" style={{ fontFamily: family }}>{name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} aria-hidden><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </Field>
  )
}

// 입력 칸 묶음 (라벨 + 입력 + 작은 안내)
function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] text-gray-500">{label}</span>
      {children}
      {hint ? <p className="text-[10px] text-gray-400 leading-tight">{hint}</p> : null}
    </div>
  )
}

// 작은 세그먼트 버튼 묶음
function Segment<T extends string | number>({ options, value, onPick }: { options: { id: T; label: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
      {options.map((opt) => (
        <button
          key={String(opt.id)}
          type="button"
          onClick={() => onPick(opt.id)}
          className={`px-2.5 py-1 text-xs transition-colors ${value === opt.id ? 'bg-[color:var(--ed-accent)] text-white' : 'bg-white text-gray-500 hover:text-gray-800'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function ClassicTextInterstitialEditor({ value, onChange, onRemove, invitationId, lang = 'ko', bodyFont, displayFont }: Props) {
  const list = value || []
  // 펼친 글꼴 목록 (항목 번호 + 한글/영문)
  const [fontOpen, setFontOpen] = useState<{ i: number; k: 'ko' | 'en' } | null>(null)
  const toggleFont = (i: number, k: 'ko' | 'en') => setFontOpen((o) => (o && o.i === i && o.k === k ? null : { i, k }))
  const bodyFamily = KOREAN_FONTS.find((f) => f.id === (bodyFont || 'classic'))?.fontFamily
  const displayFamily = DISPLAY_FONTS.find((f) => f.id === (displayFont || 'italiana'))?.fontFamily
  const koGroups: { label?: string; items: FontOpt[] }[] = [
    { items: [{ id: 'body', name: '청첩장 본문 글꼴', family: bodyFamily }] },
    { label: '그리운 손글씨', items: GRIUN_FONTS.map((f) => ({ id: f.id, name: f.name, family: `${f.family}, ${bodyFamily || 'serif'}` })) },
    { label: '손글씨', items: KOREAN_FONTS.filter((f) => MS_HAND_FONT_IDS.includes(f.id)).map((f) => ({ id: f.id, name: f.name, family: f.fontFamily })) },
    { label: '바탕 · 고딕', items: KOREAN_FONTS.filter((f) => !MS_HAND_FONT_IDS.includes(f.id)).map((f) => ({ id: f.id, name: f.name, family: f.fontFamily })) },
  ]
  const enGroups: { label?: string; items: FontOpt[] }[] = [
    { items: [{ id: '', name: '청첩장 영문 글꼴', family: displayFamily }] },
    { items: DISPLAY_FONTS.map((f) => ({ id: f.id, name: f.name, family: f.fontFamily })) },
  ]

  const update = (i: number, patch: Partial<ClassicTextInter>) =>
    onChange(list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const pickType = (i: number, type: ClassicTextInterType) =>
    onChange(list.map((it, idx) => (idx === i ? withExamples(it, type, lang) : it)))
  const add = () => onChange([...list, withExamples({ type: 'verse' }, 'verse', lang)])
  // 지우면 뒤 간지들의 섹션 순서 자리도 한 칸씩 당겨야 해서 부모에게 알린다 (onRemove)
  const remove = (i: number) => {
    onChange(list.filter((_, idx) => idx !== i))
    onRemove?.(i)
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-gray-500 leading-snug">직접 쓴 글이나 저작권이 끝난 글을 권장해요. 다른 사람의 시·가사를 쓸 땐 출처를 꼭 적어주세요.</p>
      {list.length === 0 && (
        <p className="text-xs text-gray-400">글 간지가 없습니다. 추가하지 않으면 청첩장에 표시되지 않아요.</p>
      )}

      {list.map((it, i) => {
        const d = CLASSIC_TEXT_INTER_DEFAULTS[it.type] || CLASSIC_TEXT_INTER_DEFAULTS.verse
        const ex = (CLASSIC_TEXT_INTER_EXAMPLES[it.type] || CLASSIC_TEXT_INTER_EXAMPLES.verse)[lang]
        const bgMode: ClassicTextInterBgMode = it.bgMode || d.bgMode
        const koId = koFontOf(it)
        // 2,780자 글꼴이면 지금 화면에 나오는 글(직접 쓴 글, 비어 있으면 예시 문장) 중 글꼴에 없는 한글
        const shownVals = Object.entries(ex).map(([k, v]) => {
          const cur = it[k as keyof ClassicTextInter]
          return typeof cur === 'string' ? cur : v || ''
        })
        const koMissing = griunMissingChars(koId, shownVals.join(' '))
        const koSample = sampleFrom(shownVals, /[가-힣]/, '우리 결혼합니다', 18)
        const enSample = sampleFrom(shownVals, /[A-Za-z]{3}/, 'Wedding Day', 24)
        const koCur = koGroups.flatMap((g) => g.items).find((f) => f.id === koId)
        const enCur = enGroups.flatMap((g) => g.items).find((f) => f.id === (it.enFont || ''))
        const openK = fontOpen && fontOpen.i === i ? fontOpen.k : null
        const txt = (k: keyof ClassicTextInter & string, label: string, opts: { area?: boolean; rows?: number; hint?: ReactNode } = {}) => {
          const v = it[k]
          const sv = typeof v === 'string' ? v : ''
          return (
            <Field label={label} hint={opts.hint}>
              {opts.area ? (
                <Textarea value={sv} onChange={(e) => update(i, { [k]: e.target.value } as Partial<ClassicTextInter>)} placeholder={ex[k] || ''} rows={opts.rows ?? 3} />
              ) : (
                <Input value={sv} onChange={(e) => update(i, { [k]: e.target.value } as Partial<ClassicTextInter>)} placeholder={ex[k] || ''} />
              )}
            </Field>
          )
        }
        // 원고지: 한 줄 칸 수와 지금 가장 긴 줄
        const msCols = it.msCols === 12 ? 12 : 10
        const msLongest = Math.max(0, ...(it.msText || '').split('\n').map((l) => Array.from(l.replace(/\s+$/, '')).length))

        return (
          <div key={i} className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">글 간지 {i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-[11px] text-red-400 hover:text-red-500">삭제</button>
            </div>

            {/* 종류 */}
            <div>
              <div className="grid grid-cols-3 gap-1.5">
                {TYPES.map((t) => {
                  const active = it.type === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => pickType(i, t.id)}
                      className={`px-2 py-1.5 rounded-md border text-xs transition-colors ${active ? 'bg-[color:var(--ed-accent)] border-transparent text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'}`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 타입별 글 */}
            <div className="space-y-3">
              {it.type === 'verse' && (
                <>
                  {txt('verseText', '본문', { area: true, rows: 4 })}
                  {txt('versePull', '강조 한 줄 (선택)', { hint: '따옴표는 자동으로 붙어요.' })}
                  {txt('verseSign', '서명')}
                </>
              )}

              {it.type === 'quote' && (
                <>
                  {txt('quoteText', '원문', { area: true, hint: '영문 문장이면 단어마다 차례로 떠올라요.' })}
                  <label className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Switch checked={it.quoteMark !== false} onCheckedChange={(v) => update(i, { quoteMark: v })} />
                    큰 따옴표 표시
                  </label>
                  {txt('quoteTrans', '번역 (선택)', { area: true, rows: 2 })}
                  {txt('quoteSource', '출처')}
                  <Field label="배경 사진 (선택)" hint="사진을 넣으면 배경색으로 어둡게 덮어 글이 잘 보이게 해요.">
                    <ClassicPhotoField
                      value={it.quoteBg}
                      onChange={(p) => update(i, { quoteBg: p || undefined })}
                      invitationId={invitationId}
                      aspectRatio={4 / 5}
                      containerWidth={200}
                    />
                  </Field>
                  {it.quoteBg?.url ? (
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>사진 어둡기</span><span>{Math.round((it.quoteDim ?? 0.6) * 100)}%</span></div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((it.quoteDim ?? 0.6) * 100)}
                        onChange={(e) => update(i, { quoteDim: Number(e.target.value) / 100 })}
                        className="w-full accent-[color:var(--ed-accent)]"
                      />
                    </div>
                  ) : null}
                </>
              )}

              {it.type === 'promises' && (
                <>
                  {txt('promTitle', '영문 제목')}
                  {txt('promSub', '한글 부제')}
                  {txt('promItems', '항목', { area: true, rows: 5, hint: '한 줄에 하나씩' })}
                  {txt('promSide', '세로 글씨 (선택)', { hint: '오른쪽에 세로로 작게 들어가요.' })}
                  {txt('promNote', '아래 작은 문구')}
                  {txt('promSign', '서명')}
                </>
              )}

              {it.type === 'manuscript' && (
                <>
                  {txt('msText', '본문', {
                    area: true,
                    rows: 5,
                    hint: <>한 줄 {msCols}칸까지, 넘치면 다음 줄로{msLongest > msCols ? <> · 지금 가장 긴 줄 {msLongest}칸이라 다음 줄로 이어져요</> : null}</>,
                  })}
                  {txt('msTitle', '제목')}
                  {txt('msName', '이름')}
                  <div className="flex flex-wrap items-end gap-4">
                    <Field label="한 줄 칸 수">
                      <div><Segment options={[{ id: 10, label: '10칸' }, { id: 12, label: '12칸' }]} value={msCols} onPick={(v) => update(i, { msCols: v })} /></div>
                    </Field>
                  </div>
                </>
              )}

              {it.type === 'underline' && (
                <>
                  {txt('ulChapter', '장 제목')}
                  {txt('ulBefore', '앞 문장', { area: true })}
                  {txt('ulMark', '밑줄 칠 문장', { area: true, rows: 2 })}
                  {txt('ulAfter', '뒤 문장', { area: true, rows: 2 })}
                  {txt('ulNote', '여백 메모')}
                  {txt('ulPage', '쪽 번호 (선택)')}
                </>
              )}

              {it.type === 'card' && (
                <>
                  {txt('cardText', '문장', { area: true, rows: 2 })}
                  {txt('cardName', '이름')}
                  <Field label="정렬">
                    <div>
                      <Segment
                        options={[{ id: 'left', label: '왼쪽' }, { id: 'center', label: '가운데' }, { id: 'right', label: '오른쪽' }]}
                        value={it.cardAlign || 'left'}
                        onPick={(v) => update(i, { cardAlign: v === 'left' ? undefined : (v as 'center' | 'right') })}
                      />
                    </div>
                  </Field>
                </>
              )}
            </div>

            {/* 글꼴 · 배경 · 포인트 컬러 */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <FontTrigger label="한글 글꼴" name={koCur?.name || '청첩장 본문 글꼴'} family={koCur?.family} open={openK === 'ko'} onClick={() => toggleFont(i, 'ko')} />
                <FontTrigger label="영문 글꼴" name={enCur?.name || '청첩장 영문 글꼴'} family={enCur?.family} open={openK === 'en'} onClick={() => toggleFont(i, 'en')} />
              </div>
              {openK === 'ko' && (
                <FontGrid
                  groups={koGroups}
                  value={koId}
                  sample={koSample}
                  onPick={(id) => update(i, { koFont: id === 'body' && it.type !== 'manuscript' ? undefined : id, msFont: undefined })}
                />
              )}
              {openK === 'en' && (
                <FontGrid groups={enGroups} value={it.enFont || ''} sample={enSample} onPick={(id) => update(i, { enFont: id || undefined })} />
              )}
              {it.type !== 'manuscript' && (
                <div className="space-y-2 rounded-md border border-gray-100 bg-gray-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">글자 조정</span>
                    {it.txScale !== undefined || it.txLh !== undefined || it.txLs !== undefined ? (
                      <button type="button" onClick={() => update(i, { txScale: undefined, txLh: undefined, txLs: undefined })} className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-700">기본값</button>
                    ) : null}
                  </div>
                  <TuneSlider label="글자 크기" min={85} max={130} value={Math.round((it.txScale ?? 1) * 100)} show={(v) => `${v}%`} onChange={(v) => update(i, { txScale: v === 100 ? undefined : v / 100 })} />
                  <TuneSlider label="행간" min={80} max={130} value={Math.round((it.txLh ?? 1) * 100)} show={(v) => `${v}%`} onChange={(v) => update(i, { txLh: v === 100 ? undefined : v / 100 })} />
                  <TuneSlider label="자간" min={-5} max={10} value={Math.round((it.txLs ?? 0) * 100)} show={(v) => (v > 0 ? `+${v}` : `${v}`)} onChange={(v) => update(i, { txLs: v === 0 ? undefined : v / 100 })} />
                </div>
              )}
              {koMissing.length ? (
                <p className="text-[11px] leading-snug text-amber-700">
                  {GRIUN_FONTS.find((f) => f.id === koId)?.name}에 없는 글자가 있어요: <b className="font-medium">{koMissing.slice(0, 12).join(' ')}</b>{koMissing.length > 12 ? ` 외 ${koMissing.length - 12}자` : ''}. 이 글자만 청첩장 본문 글꼴로 보여요.
                </p>
              ) : GRIUN_FONTS.some((f) => f.id === koId && !f.full) ? (
                <p className="text-[10px] text-gray-400 leading-tight">자주 쓰는 한글 2,780자가 들어 있는 글꼴이에요. 드문 글자는 청첩장 본문 글꼴로 보여요.</p>
              ) : null}
              <Field label="배경" hint="기본·틴티드 배경은 디자인 탭의 색 설정을 따라요.">
                <div className="flex flex-wrap items-center gap-2">
                  <Segment options={BG_MODES} value={bgMode} onPick={(v) => update(i, { bgMode: v })} />
                  {bgMode === 'custom' && (
                    <ColorField label="배경색" value={it.bgColor || d.bgColor} onChange={(hex) => update(i, { bgColor: hex })} />
                  )}
                </div>
              </Field>
              {d.point && (
                <Field label="포인트 컬러" hint={POINT_HINT[it.type]}>
                  <div className="flex items-center gap-2">
                    <ColorField label="포인트 컬러" value={it.pointColor || d.point} onChange={(hex) => update(i, { pointColor: hex })} />
                    {it.pointColor ? (
                      <button type="button" onClick={() => update(i, { pointColor: undefined })} className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-700">기본값</button>
                    ) : null}
                  </div>
                </Field>
              )}
              <Field label="글자색 (선택)" hint="비워두면 배경 밝기에 맞춰 자동으로 정해져요.">
                <div className="flex items-center gap-2">
                  <ColorField label="글자색" value={it.textColor || '#351714'} onChange={(hex) => update(i, { textColor: hex })} />
                  {it.textColor ? (
                    <button type="button" onClick={() => update(i, { textColor: undefined })} className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-700">자동으로</button>
                  ) : <span className="text-[11px] text-gray-400">자동</span>}
                </div>
              </Field>
              {LINE_HINT[it.type] && (
                <Field label="선 색 (선택)" hint={LINE_HINT[it.type]}>
                  <div className="flex items-center gap-2">
                    <ColorField label="선 색" value={it.lineColor || '#BDB6AE'} onChange={(hex) => update(i, { lineColor: hex })} />
                    {it.lineColor ? (
                      <button type="button" onClick={() => update(i, { lineColor: undefined })} className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-700">기본값</button>
                    ) : <span className="text-[11px] text-gray-400">기본</span>}
                  </div>
                </Field>
              )}
              {it.type === 'card' && (
                <>
                  <Field label="카드 색">
                    <div className="flex items-center gap-2">
                      <ColorField label="카드 색" value={it.cardColor || d.card || '#F7F6F3'} onChange={(hex) => update(i, { cardColor: hex })} />
                      {it.cardColor ? (
                        <button type="button" onClick={() => update(i, { cardColor: undefined })} className="text-[11px] text-gray-400 underline underline-offset-2 hover:text-gray-700">기본값</button>
                      ) : null}
                    </div>
                  </Field>
                  <label className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Switch checked={it.cardTexture !== false} onCheckedChange={(v) => update(i, { cardTexture: v })} />
                    종이 질감
                  </label>
                  <Field label="배경 사진 (선택)" hint="카드 뒤에 사진을 깔아요. 배경색으로 살짝 덮어 카드가 잘 보이게 해요. 카드 글자색은 카드 색에 맞춰 자동으로 정해져요.">
                    <ClassicPhotoField
                      value={it.cardBg}
                      onChange={(p) => update(i, { cardBg: p || undefined })}
                      invitationId={invitationId}
                      aspectRatio={9 / 16}
                      containerWidth={160}
                    />
                  </Field>
                  {it.cardBg?.url ? (
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>사진 어둡기</span><span>{Math.round((it.cardDim ?? 0.35) * 100)}%</span></div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((it.cardDim ?? 0.35) * 100)}
                        onChange={(e) => update(i, { cardDim: Number(e.target.value) / 100 })}
                        className="w-full accent-[color:var(--ed-accent)]"
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )
      })}

      {/* 글 간지는 최대 3개 (각자 '추가정보' 단계 섹션 순서에서 자리를 정함) */}
      {list.length < INTER_MAX && (
        <button
          type="button"
          onClick={add}
          className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + 글 간지 추가 ({list.length}/{INTER_MAX})
        </button>
      )}
    </div>
  )
}
