'use client'

import { useState, useRef, type ReactNode } from 'react'
import { useEditorStore } from '@/store/editorStore'
import {
  IntroPresetId, IntroSettings, IntroStyleId, availableFonts, getDefaultIntroSettings,
  isInteractiveIntro, presetAccentColors, presetCustomColors, resolvePresetId,
} from '@/lib/introPresets'
import { introStyles, getIntroStyle, getStyleOptions, isCustomized, noWeddingDefault, type IntroOptionField, type IntroStyleGroup } from '@/lib/introStyles'
import { buildIntroData, photoOf, withStyleNames } from '@/components/invitation/intros/shared'
import { uploadImage } from '@/lib/imageUpload'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ColorField from '@/components/editor/ColorField'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, ChevronDown, ChevronLeft, Upload, RotateCcw, Images } from 'lucide-react'

interface IntroSelectorProps {
  onBack?: () => void
  /** 모바일에서 패널 위에 고정해 보여줄 미리보기 */
  preview?: ReactNode
}

type Crop = Record<string, number | undefined>

const GROUP_ORDER: IntroStyleGroup[] = ['기본', '사진이 열리는 인트로', '디자인 인트로']

/** 30MB 제한 업로드 → 웹 URL */
async function uploadPhoto(file: File): Promise<string | null> {
  if (file.size > 30 * 1024 * 1024) { alert('파일 크기는 30MB 이하여야 합니다.'); return null }
  try {
    const result = await uploadImage(file)
    if (result.success && result.webUrl) return result.webUrl as string
    alert(result.error || '이미지 업로드에 실패했습니다.')
  } catch (error) {
    console.error('Intro photo upload failed:', error)
    alert('이미지 업로드에 실패했습니다.')
  }
  return null
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

/** auto: 값을 비우면 자동으로 정해지는 색 (예: 포인트 색에 맞춘 배경) */
function Swatches({ label, value, swatches, onChange, auto }: {
  label: string; value: string; swatches: string[]; onChange: (hex: string) => void
  auto?: { label: string; on: boolean; onClick: () => void }
}) {
  return (
    <div>
      <Label className="text-xs text-gray-600 mb-2 block">{label}</Label>
      <div className="flex gap-2 flex-wrap items-center">
        {auto && (
          <button type="button" onClick={auto.onClick}
            className={`h-8 px-3 rounded-full border-2 text-[11px] transition-all ${auto.on ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-gray-600'}`}>
            {auto.label}
          </button>
        )}
        {swatches.map((c) => (
          <button key={c} type="button" aria-label={c} onClick={() => onChange(c)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${!auto?.on && value.toLowerCase() === c.toLowerCase() ? 'border-primary scale-110' : 'border-gray-200'}`}
            style={{ backgroundColor: c }} />
        ))}
        <ColorField label={label} value={value} onChange={onChange} />
      </div>
    </div>
  )
}

/**
 * 사진 칸 — 시네마틱 인트로 사진과 같은 모양.
 * 사진이 있으면 크롭 편집기로 크기·위치를 바로 조정하고, 없으면 올리기 상자를 보여준다.
 * value가 비어 있어도 대체 사진(fallbackSrc)이 있으면 그 사진으로 크롭할 수 있다.
 */
function PhotoField({ value, fallbackSrc, crop, aspect, gallery, onPhoto, onCrop }: {
  value: string
  fallbackSrc?: string
  crop?: Crop
  aspect: number
  gallery: string[]
  onPhoto: (url: string) => void
  onCrop: (crop: Crop) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const shown = value || fallbackSrc || ''
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const url = await uploadPhoto(file)
    setUploading(false)
    if (url) onPhoto(url)
  }
  const btn = 'inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors'
  return (
    <div className="space-y-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {shown ? (
        <InlineCropEditor key={shown} imageUrl={shown} settings={crop || {}}
          onUpdate={(s) => onCrop({ ...(crop || { scale: 1, positionX: 0, positionY: 0 }), ...s } as Crop)}
          aspectRatio={aspect} containerWidth={aspect > 1 ? 260 : 200} />
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full max-w-[160px] mx-auto aspect-[9/16] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          style={{ aspectRatio: String(aspect) }}>
          {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600" />
            : <><Upload className="w-5 h-5 text-gray-300" /><span className="text-[11px] text-gray-400">사진 추가</span></>}
        </button>
      )}
      <div className="flex justify-center flex-wrap gap-2">
        {shown && <button type="button" onClick={() => fileRef.current?.click()} className={btn}>{uploading ? '올리는 중…' : '사진 변경'}</button>}
        {gallery.length > 0 && <button type="button" onClick={() => setShowGallery(v => !v)} className={btn}><Images className="w-3.5 h-3.5" />갤러리에서 고르기</button>}
        {value && fallbackSrc !== undefined && (
          <button type="button" onClick={() => onPhoto('')} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs text-red-600 transition-colors">기본 사진으로</button>
        )}
      </div>
      {showGallery && (
        <div className="grid grid-cols-5 gap-1.5 p-2 bg-gray-50 rounded-lg">
          {gallery.map((src) => (
            <button key={src} type="button" onClick={() => { onPhoto(src); setShowGallery(false) }}
              className={`aspect-square rounded-md overflow-hidden border-2 ${src === value ? 'border-primary' : 'border-transparent'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 줄 수·줄당 글자 수 제한이 있는 여러 줄 입력 */
function LinesInput({ field, value, placeholder, onChange }: { field: Extract<IntroOptionField, { type: 'lines' }>; value: string; placeholder?: string; onChange: (v: string) => void }) {
  const rows = value.split('\n')
  const clamp = (raw: string) => (field.latinOnly ? raw.replace(/[ㄱ-ㆎ가-힣]/g, '') : raw)
    .split('\n').slice(0, field.maxLines).map(l => Array.from(l).slice(0, field.maxPerLine).join('')).join('\n')
  const longest = Math.max(0, ...rows.map(l => Array.from(l).length))
  return (
    <div>
      <div className="flex justify-between mb-1">
        <Label className="text-xs text-gray-600">{field.label}</Label>
        <span className="text-[11px] text-gray-400">{rows.length}/{field.maxLines}줄 · 줄당 {longest}/{field.maxPerLine}자</span>
      </div>
      <textarea value={value} rows={Math.min(field.maxLines, 6)} placeholder={placeholder ?? field.placeholder}
        onChange={(e) => onChange(clamp(e.target.value))}
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      {field.help && <p className="text-[11px] text-gray-400 mt-1">{field.help}</p>}
    </div>
  )
}

function ChoiceInput({ field, value, onChange, hideLabel }: { field: Extract<IntroOptionField, { type: 'choice' }>; value: unknown; onChange: (v: string) => void; hideLabel?: boolean }) {
  return (
    <div>
      {!hideLabel && <Label className="text-xs text-gray-600 mb-2 block">{field.label}</Label>}
      {field.choices.length > 8 ? (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-500">
          {field.choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      ) : (
      <div className="grid grid-cols-2 gap-2">
        {field.choices.map((c) => (
          <button key={c.value} type="button" onClick={() => onChange(c.value)}
            className={`px-3 py-2 text-sm rounded-lg border transition-all ${value === c.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-gray-300'}`}>
            {c.label}
          </button>
        ))}
      </div>
      )}
      {field.help && <p className="text-[11px] text-gray-400 mt-1">{field.help}</p>}
    </div>
  )
}

/**
 * 인터랙티브 스타일 설정 — 시네마틱과 같은 섹션 구성(사진 → 문구 → 글꼴·표시 → 색)으로
 * introStyles.ts의 필드 목록을 그린다.
 */
function StyleOptionsForm({ styleId, gallery }: { styleId: IntroStyleId; gallery: string[] }) {
  const { invitation, updateIntroStyleOption } = useEditorStore()
  const meta = getIntroStyle(styleId)
  if (!invitation || !meta) return null
  const data = buildIntroData(invitation)
  const stored = invitation.intro.styleOptions
  const opts = getStyleOptions(styleId, stored, data.noWedding)
  const set = (key: string, value: unknown) => updateIntroStyleOption(styleId, key, value)
  // 입력칸에는 직접 쓴 값(비운 값 포함)을, 고치지 않았으면 지금 쓰이는 문구를 보여준다
  const typed = (key: string) => {
    const v = stored?.[styleId]?.[key]
    return typeof v === 'string' ? v : String(opts[key] ?? '')
  }
  const autoNote = (key: string) => {
    if (noWeddingDefault(styleId, key) === undefined) return null
    const custom = isCustomized(styleId, stored, key)
    return (
      <div className="flex items-start justify-between gap-2 mt-1">
        <p className="text-[11px] text-gray-400">
          {custom ? '직접 쓴 문구가 쓰이고 있어요'
            : data.noWedding ? '노웨딩이라 소식을 전하는 문구로 자동으로 바뀌었어요'
            : '날짜·장소를 모두 끄면 노웨딩 문구로 자동으로 바뀌어요'}
        </p>
        {custom && (
          <button type="button" onClick={() => set(key, undefined)} className="shrink-0 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700">
            <RotateCcw className="w-3 h-3" />자동 문구로
          </button>
        )}
      </div>
    )
  }

  // 다른 옵션에 따라 보이는 필드 (예: 서명체 글꼴은 영문 손글씨형일 때만)
  const visible = meta.fields.filter(f => !f.when || f.when.is.includes(String(opts[f.when.key] ?? '')))
  const grouped = visible.filter(f => f.section)
  const fields = visible.filter(f => !f.section)
  const groupNames = Array.from(new Set(grouped.map(f => f.section as string)))
  // 한 묶음 안의 필드를 종류에 맞는 입력칸으로
  const fieldInput = (f: IntroOptionField) => {
    if (f.type === 'choice') return <ChoiceInput field={f} value={opts[f.key]} onChange={(v) => set(f.key, v)} />
    if (f.type === 'lines') return <LinesInput field={f} value={typed(f.key)} placeholder={String(opts[f.key] || '') || f.placeholder} onChange={(t) => set(f.key, t)} />
    if (f.type === 'color') return <Swatches label={f.label} value={String(opts[f.key] || f.swatches[0])} swatches={f.swatches} onChange={(hex) => set(f.key, hex)} />
    if (f.type === 'date' || f.type === 'time') return (
      <div>
        <Label className="text-xs text-gray-600 mb-1 block">{f.label}</Label>
        <Input type={f.type} value={typed(f.key) || String(opts[f.key] || '')} onChange={(e) => set(f.key, e.target.value)} />
        {f.help && <p className="text-[11px] text-gray-400 mt-1">{f.help}</p>}
      </div>
    )
    if (f.type === 'text') return (
      <div>
        <div className="flex justify-between mb-1">
          <Label className="text-xs text-gray-600">{f.label}</Label>
          <span className="text-[11px] text-gray-400">{Array.from(typed(f.key)).length}/{f.maxLength}</span>
        </div>
        <Input value={typed(f.key)} placeholder={f.placeholder} onChange={(e) => set(f.key, Array.from(e.target.value).slice(0, f.maxLength).join(''))} />
        {f.help && <p className="text-[11px] text-gray-400 mt-1">{f.help}</p>}
      </div>
    )
    return null
  }
  const photos = fields.filter((f): f is Extract<IntroOptionField, { type: 'photo' }> => f.type === 'photo')
  const texts = fields.filter(f => f.type === 'text' || f.type === 'lines' || f.type === 'date' || f.type === 'time')
  const allChoices = fields.filter((f): f is Extract<IntroOptionField, { type: 'choice' }> => f.type === 'choice')
  const choices = allChoices.filter(f => !f.under)
  const colors = fields.filter((f): f is Extract<IntroOptionField, { type: 'color' }> => f.type === 'color')

  return (
    <div className="space-y-7">
      <Section title="이름" hint="이 인트로에만 쓰는 이름이에요 · 성을 넣을지, 한글·영문 중 무엇으로 쓸지 적은 그대로 나와요 · 비워두면 청첩장 정보의 이름">
        <div className="grid grid-cols-2 gap-2">
          {([['groomName', '신랑', data.groomEn || data.groomName], ['brideName', '신부', data.brideEn || data.brideName]] as const).map(([key, label, ph]) => (
            <div key={key}>
              <Label className="text-[11px] text-gray-500 mb-1 block">{label}</Label>
              <Input value={String(stored?.[styleId]?.[key] ?? '')} placeholder={ph} maxLength={20} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
        </div>
      </Section>
      {photos.map((f) => (
        <Section key={f.key} title={f.label} hint={f.help || '사진을 끌어 위치를, 모서리를 끌어 크기를 정해요'}>
          <PhotoField
            value={typeof opts[f.key] === 'string' ? (opts[f.key] as string) : ''}
            fallbackSrc={f.defaultSrc || photoOf({}, f.key, data, f.fallback)}
            crop={opts[`${f.key}Crop`] as Crop | undefined}
            aspect={f.aspect}
            gallery={gallery}
            onPhoto={(url) => { set(f.key, url); set(`${f.key}Crop`, undefined) }}
            onCrop={(c) => set(`${f.key}Crop`, c)}
          />
          {allChoices.filter(c => c.under === f.key).map(c => (
            <ChoiceInput key={c.key} field={c} value={opts[c.key]} onChange={(v) => set(c.key, v)} />
          ))}
        </Section>
      ))}

      {texts.length > 0 && (
        <Section title="문구">
          {texts.map((f) => f.type === 'lines' ? (
            <div key={f.key}>
              <LinesInput field={f} value={typed(f.key)} placeholder={String(opts[f.key] || '') || f.placeholder} onChange={(t) => set(f.key, t)} />
              {autoNote(f.key)}
            </div>
          ) : f.type === 'text' ? (
            <div key={f.key}>
              <div className="flex justify-between mb-1">
                <Label className="text-xs text-gray-600">{f.label}</Label>
                <span className="text-[11px] text-gray-400">{Array.from(typed(f.key)).length}/{f.maxLength}</span>
              </div>
              <Input value={typed(f.key)} placeholder={String(opts[f.key] || '') || f.placeholder}
                onChange={(e) => set(f.key, Array.from(e.target.value).slice(0, f.maxLength).join(''))} />
              {f.help && <p className="text-[11px] text-gray-400 mt-1">{f.help}</p>}
              {autoNote(f.key)}
            </div>
          ) : f.type === 'date' || f.type === 'time' ? (
            <div key={f.key}>
              <Label className="text-xs text-gray-600 mb-1 block">{f.label}</Label>
              <Input type={f.type} value={typed(f.key) || String(opts[f.key] || '')} onChange={(e) => set(f.key, e.target.value)} />
              {f.help && <p className="text-[11px] text-gray-400 mt-1">{f.help}</p>}
            </div>
          ) : null)}
        </Section>
      )}

      {groupNames.map((name) => (
        <Section key={name} title={name}>
          {grouped.filter(f => f.section === name).map((f) => <div key={f.key}>{fieldInput(f)}</div>)}
        </Section>
      ))}

      {choices.map((f) => {
        // 영문 손글씨형은 영문 이름 전용
        const named = withStyleNames(data, opts)
        const hasCustom = String(opts.editorialText ?? '').replace(/[ㄱ-ㆎ가-힣\s]/g, '').length > 0
        const needEn = f.key === 'content' && opts[f.key] === 'editorial' && !hasCustom && !(named.groomEn && named.brideEn)
        const storyNeedEn = f.key === 'content' && opts[f.key] === 'names' && !(named.groomEn && named.brideEn)
        return (
          <Section key={f.key} title={f.label}>
            <ChoiceInput field={f} value={opts[f.key]} onChange={(v) => set(f.key, v)} hideLabel />
            {storyNeedEn && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
                <span className="text-gray-700">스토리형은 영문 이름으로 써져요. 지금은 &lsquo;Groom &amp; Bride&rsquo;로 보여요.</span> 위 &lsquo;이름&rsquo;에 신랑·신부를 <b>둘 다</b> 영문으로 적어주세요.
              </p>
            )}
            {needEn && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
                <span className="text-gray-700">영문 이름이 없어 &lsquo;Save the date&rsquo;로 보여요.</span> 이름을 서명체로 쓰려면 위 &lsquo;이름&rsquo;에 신랑·신부를 <b>둘 다</b> 영문으로 적어주세요. 다른 문구는 &lsquo;서명체 문구&rsquo;에 적으면 돼요.
              </p>
            )}
          </Section>
        )
      })}

      {colors.length > 0 && (
        <Section title="색">
          {colors.map((f) => (
            <Swatches key={f.key} label={f.label} value={String(opts[f.key] || f.swatches[0])} swatches={f.swatches} onChange={(hex) => set(f.key, hex)}
              auto={f.auto ? { label: f.auto, on: !opts[f.key], onClick: () => set(f.key, '') } : undefined} />
          ))}
        </Section>
      )}
    </div>
  )
}

/** 시네마틱 설정 — 실제로 화면에 쓰이는 항목만 */
function CinematicSettings({ gallery }: { gallery: string[] }) {
  const { invitation, updateIntroField, updateNestedField } = useEditorStore()
  const [showDetail, setShowDetail] = useState(false)
  if (!invitation) return null
  const { intro } = invitation
  const set = <K extends keyof IntroSettings>(k: K, v: IntroSettings[K]) => updateIntroField(k, v)
  // 시네마틱·포커스(블러) 공용 설정
  const pid = intro.presetId === 'blur' ? 'blur' : 'cinematic'
  const accent = intro.accentColor || presetAccentColors[pid] || '#F8F6F3'
  const overlay = intro.overlayColor || presetCustomColors[pid]?.overlayColor || '#000000'
  const coverDefault = invitation.templateId === 'narrative-family' ? 'WEDDING INVITATION' : 'OUR WEDDING'

  const restore = () => {
    const d = getDefaultIntroSettings(pid)
    ;(['mainTitle', 'subTitle', 'dateText', 'titleFontSize', 'titleLetterSpacing', 'titleFontFamily', 'titleColor', 'accentColor', 'overlayColor', 'overlayOpacity'] as const)
      .forEach((k) => set(k, d[k] as never))
  }

  return (
    <div className="space-y-7">
      <Section title="인트로 사진" hint="비워두면 커버 사진이 쓰여요">
        <PhotoField value={intro.introImage || ''} crop={intro.introImageSettings as Crop | undefined} aspect={9 / 16} gallery={gallery}
          onPhoto={(url) => { set('introImage', url); set('introImageSettings', undefined) }}
          onCrop={(c) => set('introImageSettings', c as unknown as IntroSettings['introImageSettings'])} />
        {intro.introImage && (
          <div className="flex justify-center">
            <button type="button" onClick={() => { set('introImage', ''); set('introImageSettings', undefined) }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs text-red-600">삭제</button>
          </div>
        )}
      </Section>

      <Section title="문구">
        {pid === 'blur' && (
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">위 작은 문구</Label>
            <Input value={intro.subTitle ?? ''} placeholder="SAVE THE DATE" onChange={(e) => set('subTitle', Array.from(e.target.value).slice(0, 30).join(''))} />
          </div>
        )}
        <div>
          <div className="flex justify-between mb-1">
            <Label className="text-xs text-gray-600">{pid === 'blur' ? '제목' : '환영 문구'}</Label>
            <span className="text-[11px] text-gray-400">{Array.from(intro.mainTitle || '').length}/40</span>
          </div>
          <Input value={intro.mainTitle} placeholder={pid === 'blur' ? '우리 결혼합니다' : 'Welcome to our wedding'}
            onChange={(e) => set('mainTitle', Array.from(e.target.value).slice(0, 40).join(''))} />
        </div>
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">날짜</Label>
          <Input value={intro.dateText} placeholder="비워두면 결혼 날짜가 자동으로 들어가요"
            onChange={(e) => set('dateText', e.target.value)} />
        </div>
      </Section>

      <Section title="글꼴">
        <div className="grid grid-cols-2 gap-2">
          {availableFonts.map((font) => (
            <button key={font.value} type="button" onClick={() => set('titleFontFamily', font.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${intro.titleFontFamily === font.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-gray-300'}`}
              style={{ fontFamily: font.value }}>
              {font.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowDetail(v => !v)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          크기·자간 조정 <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetail ? 'rotate-180' : ''}`} />
        </button>
        {showDetail && (
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between mb-2"><Label className="text-xs text-gray-600">크기</Label><span className="text-xs text-gray-500">{intro.titleFontSize}px</span></div>
              <Slider value={[intro.titleFontSize]} onValueChange={([v]) => set('titleFontSize', v)} min={14} max={32} step={1} />
            </div>
            <div>
              <div className="flex justify-between mb-2"><Label className="text-xs text-gray-600">자간</Label><span className="text-xs text-gray-500">{intro.titleLetterSpacing}px</span></div>
              <Slider value={[intro.titleLetterSpacing]} onValueChange={([v]) => set('titleLetterSpacing', v)} min={0} max={8} step={0.5} />
            </div>
          </div>
        )}
      </Section>

      <Section title="색">
        <Swatches label="글자 색" value={intro.titleColor || '#ffffff'} swatches={['#ffffff', '#f5f5f5', '#d4a574', '#c9a86c', '#8b7355', '#1a1a1a']} onChange={(hex) => set('titleColor', hex)} />
        <Swatches label="구분선·날짜 색" value={accent} swatches={['#F8F6F3', '#d4a574', '#c9a86c', '#d4a0a0', '#9ca3af', '#1a1a1a']} onChange={(hex) => set('accentColor', hex)} />
        <Swatches label="사진 위 덮는 색" value={overlay} swatches={['#000000', '#1a1a1a', '#2c3e50', '#1e3a5f', '#3d1f00', '#4a0e2e']} onChange={(hex) => set('overlayColor', hex)} />
        <div>
          <div className="flex justify-between mb-2"><Label className="text-xs text-gray-600">사진 어둡기</Label><span className="text-xs text-gray-500">{intro.overlayOpacity ?? 50}%</span></div>
          <Slider value={[intro.overlayOpacity ?? 50]} onValueChange={([v]) => set('overlayOpacity', v)} min={0} max={80} step={5} />
        </div>
      </Section>

      <Section title="커버 제목" hint={`인트로가 끝난 뒤 커버 화면 가운데 크게 보이는 문구예요 (기본 ‘${coverDefault}’ · Enter로 줄바꿈)`}>
        <textarea value={invitation.wedding?.title ?? ''} rows={2} placeholder={coverDefault}
          onChange={(e) => {
            updateNestedField('wedding.title', e.target.value)
            updateNestedField('design.coverTitle', e.target.value)
          }}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-relaxed resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </Section>

      <Section title="커버 사진" hint="인트로 다음에 나오는 첫 화면 사진이에요">
        <PhotoField value={invitation.media?.coverImage || ''} crop={invitation.media?.coverImageSettings as Crop | undefined} aspect={9 / 16} gallery={gallery}
          onPhoto={(url) => updateNestedField('media.coverImage', url)}
          onCrop={(c) => updateNestedField('media.coverImageSettings', c)} />
      </Section>

      <button type="button" onClick={restore} className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
        <RotateCcw className="w-3.5 h-3.5" />문구·글꼴·색을 기본값으로 되돌리기
      </button>
    </div>
  )
}

export default function IntroSelector({ onBack, preview }: IntroSelectorProps) {
  const { invitation, updateIntroPreset, resetIntroStyleOptions, updateNestedField } = useEditorStore()
  if (!invitation) return null
  const showDate = invitation.wedding?.showDate !== false
  const showVenue = invitation.wedding?.showVenue !== false

  const current = resolvePresetId(invitation.intro.presetId)
  const currentMeta = getIntroStyle(current)
  const gallery = (invitation.gallery?.images || []).filter(Boolean)
  const visible = introStyles.filter((s) => s.ready || s.id === current)

  const choose = (id: IntroPresetId) => { if (id !== current) updateIntroPreset(id) }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded" aria-label="뒤로">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">인트로</h2>
          <p className="text-xs text-gray-500">하객이 청첩장을 열면 가장 먼저 보는 화면이에요</p>
        </div>
      </div>

      {preview && <div className="border-b bg-gray-50 py-3">{preview}</div>}

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="p-4 space-y-7 pb-16">
          <section className="space-y-2.5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">결혼식 정보 표시</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">청첩장 전체에 함께 적용돼요 · 노웨딩이면 둘 다 꺼주세요</p>
            </div>
            <div className="rounded-xl border divide-y">
              <label className="flex items-center justify-between px-3 py-2.5 cursor-pointer">
                <span className="text-sm text-gray-800">날짜 · 시간</span>
                <Switch checked={showDate} onCheckedChange={(c) => updateNestedField('wedding.showDate', c)} />
              </label>
              <label className="flex items-center justify-between px-3 py-2.5 cursor-pointer">
                <span className="text-sm text-gray-800">장소</span>
                <Switch checked={showVenue} onCheckedChange={(c) => updateNestedField('wedding.showVenue', c)} />
              </label>
            </div>
            {!showDate && !showVenue && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
                <span className="text-gray-700">노웨딩</span> · &lsquo;초대합니다&rsquo; 같은 기본 문구는 소식을 전하는 문구로 자동으로 바뀌고, 직접 고친 문구는 그대로 쓰여요.
              </p>
            )}
          </section>

          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">넘김 안내 문구</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">인트로가 끝나면 하단에 스크롤·터치로 넘기는 방법을 안내해요</p>
              </div>
              <Switch checked={invitation.intro?.guideEnabled ?? false} onCheckedChange={(c) => updateNestedField('intro.guideEnabled', c)} />
            </div>
            {invitation.intro?.guideEnabled && (
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-gray-600">안내 문구</Label>
                  <span className="text-[11px] text-gray-400">{Array.from(invitation.intro?.guideText ?? '').length}/30</span>
                </div>
                <Input value={invitation.intro?.guideText ?? ''} placeholder="터치하거나 아래로 넘겨주세요"
                  onChange={(e) => updateNestedField('intro.guideText', Array.from(e.target.value).slice(0, 30).join(''))} />
                <p className="text-[11px] text-gray-400 mt-1">비워두면 기본 문구가 보여요 · 모든 인트로 스타일에 적용돼요</p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">스타일</h3>
            {GROUP_ORDER.map((group) => {
              const items = visible.filter((s) => s.group === group)
              if (!items.length) return null
              return (
                <div key={group}>
                  {visible.length > 1 && <p className="text-[11px] text-gray-400 mb-1.5">{group}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((s) => {
                      const on = s.id === current
                      return (
                        <button key={s.id} type="button" onClick={() => choose(s.id)}
                          className={`relative text-left p-3 rounded-xl border-2 transition-all ${on ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                          {on && <span className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
                          <span className={`block text-sm font-semibold pr-6 ${on ? 'text-primary' : 'text-gray-900'}`}>{s.name}</span>
                          <span className="block text-[11px] text-gray-500 mt-1 leading-snug">{s.action}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>

          {currentMeta && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
              화면 흐름 · <span className="text-gray-700">{currentMeta.flow}</span>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">{currentMeta?.name || '시네마틱'} 설정</h3>
              {isInteractiveIntro(current) && (
                <button type="button" onClick={() => resetIntroStyleOptions(current)} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600">
                  <RotateCcw className="w-3 h-3" />기본값
                </button>
              )}
            </div>
            {isInteractiveIntro(current)
              ? <StyleOptionsForm styleId={current} gallery={gallery} />
              : <CinematicSettings gallery={gallery} />}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
