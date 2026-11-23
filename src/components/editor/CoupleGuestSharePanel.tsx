'use client'

/**
 * 에디터용 하객 사진 공유 설정 — 계정(커플)에 하나뿐인 설정을 그대로 불러와 고친다.
 * 청첩장을 여러 개 만들어도 어느 에디터에서 열든 같은 설정 · 같은 링크(/photo/[slug]).
 * (내 서랍의 CoupleGuestShareCard 와 같은 API · 같은 값)
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import GuestShareClient from '@/app/i/[slug]/share/GuestShareClient'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import type { ShareLook } from '@/lib/guestShareLook'

interface InvOption { id: string; groomName: string | null; brideName: string | null; weddingDate: string | null; templateId: string | null }
export interface CoupleShareStatus {
  slug: string | null
  enabled: boolean
  title: string | null
  description: string | null
  cover: string | null
  nameStyle: 'en' | 'ko' | null
  look?: ShareLook
  connected: boolean
  accountEmail: string | null
  primaryInvitationId: string | null
  selectedInvitationId: string | null
  invitations: InvOption[]
}


type Crop = { cropX: number; cropY: number; cropWidth: number; cropHeight: number }
type CropArgs = { src: string; crop?: Crop; onChange: (c: Crop) => void; onClose: () => void; preview: ReactNode }

/** 자르기 창 — 에디터가 따로 넘기지 않으면 이 창 (왼쪽 자르기 · 오른쪽 하객 화면 미리보기) */
function DefaultCropModal({ src, crop, onChange, onClose, preview }: CropArgs) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const PV = 0.44
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(28,26,24,0.55)' }} onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-[640px] p-5 sm:p-6" style={{ background: '#FBF9F6' }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="첫 화면 사진">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>첫 화면 사진</h3>
          <button type="button" onClick={onClose} aria-label="닫기" className="w-8 h-8 rounded-full hover:bg-black/5 text-lg leading-none" style={{ color: 'var(--ed-text-muted)' }}>×</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-center">
          <div className="shrink-0">
            <InlineCropEditor imageUrl={src} settings={crop || { scale: 1, positionX: 0, positionY: 0 }} onUpdate={c => onChange({ ...(crop || { cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }), ...c } as Crop)} aspectRatio={390 / 560} containerWidth={280} />
          </div>
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div style={{ width: 390 * PV, height: 844 * PV, borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 0 5px #1C1A18' }}>
              <div style={{ width: 390, height: 844, transform: `scale(${PV})`, transformOrigin: '0 0', position: 'relative', pointerEvents: 'none' }}>{preview}</div>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--ed-text-muted)' }}>미리보기</span>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg text-sm text-white" style={{ background: 'var(--ed-accent, #3A3A3A)' }}>완료</button>
        </div>
      </div>
    </div>
  )
}

export default function CoupleGuestSharePanel({ onChange, upload, renderCrop }: {
  onChange?: (s: CoupleShareStatus | null) => void
  /** 사진 올리기 (에디터의 업로드) — 주소를 돌려줌 */
  upload?: (f: File) => Promise<string | null>
  /** 사진 자르기 창 (에디터의 자르기 창을 그대로) */
  renderCrop?: (a: CropArgs) => ReactNode
}) {
  const doCrop = renderCrop ?? ((a: CropArgs) => <DefaultCropModal {...a} />)
  const [cropDraft, setCropDraft] = useState<Crop | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  // 첫 화면 사진 위치 — 끄는 동안은 바로 보이고, 손을 떼면 저장
  const [upBusy, setUpBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [s, setS] = useState<CoupleShareStatus | null>(null)
  const [failed, setFailed] = useState<false | 'auth' | 'error'>(false)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/post-drawer/mine/guest-share', { cache: 'no-store' })
      if (!res.ok) { setFailed(res.status === 401 ? 'auth' : 'error'); onChange?.(null); return }
      const d = (await res.json()) as CoupleShareStatus
      setS(d); setTitle(d.title || ''); setDesc(d.description || ''); onChange?.(d)
    } catch { setFailed('error'); onChange?.(null) }
  }, [onChange])
  useEffect(() => { void load() }, [load])

  const save = async (body: Record<string, unknown>) => {
    setBusy(true)
    try { await fetch('/api/post-drawer/mine/guest-share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); await load() } finally { setBusy(false) }
  }

  if (failed) return <p className="text-[12.5px]" style={{ color: 'var(--ed-text-muted)' }}>{failed === 'auth' ? '로그인하면 사진 공유를 켤 수 있습니다.' : '사진 공유 설정을 불러오지 못했습니다.'}</p>
  if (!s) return <p className="text-[12.5px]" style={{ color: 'var(--ed-text-muted)' }}>불러오는 중…</p>

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = s.slug ? `${origin}/photo/${s.slug}` : ''
  const here = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/'
  const connectUrl = s.primaryInvitationId ? `/api/cloud/google/connect?invitationId=${s.primaryInvitationId}&returnTo=${encodeURIComponent(here)}` : null
  const row = 'flex items-center justify-between gap-3 py-2.5'
  const btn = 'h-8 px-3 rounded-md text-[12.5px] font-medium shrink-0 border'
  const solid = { background: 'var(--ed-accent)', color: '#FFFFFF', borderColor: 'transparent' }
  const line = { borderColor: 'var(--ed-border)', background: '#FFFFFF' }

  return (
    <div className="rounded-lg border bg-white px-3 divide-y" style={{ borderColor: 'var(--ed-border)' }}>
      <p className="py-2.5 text-[12px] leading-relaxed" style={{ color: 'var(--ed-text-muted)' }}>
        사진 받는 링크는 계정당 하나이며, 어느 청첩장에서 들어와도 같은 링크로 모입니다.
      </p>

      {/* 켜기 */}
      <div className={row}>
        <span className="text-[13px] font-semibold">사진 공유 <span className="text-[11.5px] font-medium ml-1" style={{ color: s.enabled ? 'var(--ed-accent)' : 'var(--ed-text-muted)' }}>{s.enabled ? '켜짐' : '꺼짐'}</span></span>
        <button type="button" disabled={busy} className={btn} style={s.enabled ? line : solid} onClick={() => save({ enabled: !s.enabled })}>{s.enabled ? '끄기' : '켜기'}</button>
      </div>

      {/* Google Drive */}
      <div className={row}>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold">Google Drive</span>
          <span className="block text-[11.5px] truncate" style={{ color: 'var(--ed-text-muted)' }}>{s.connected ? (s.accountEmail || '연결됨') : '연결하면 받은 사진이 자동 보관됩니다'}</span>
        </span>
        {!s.connected && (connectUrl ? <a href={connectUrl} className={btn + ' flex items-center'} style={solid}>연결</a> : <span className="text-[11.5px] shrink-0" style={{ color: 'var(--ed-text-muted)' }}>결제 후</span>)}
      </div>

      {/* 링크 · 미리보기 */}
      {url && (
        <div className="py-2.5 space-y-1.5">
          <span className="text-[13px] font-semibold">하객 링크</span>
          <div className="flex gap-1.5">
            <input readOnly value={url} onFocus={e => e.currentTarget.select()} className="flex-1 min-w-0 h-8 px-2 rounded-md border text-[12px] bg-gray-50" style={{ borderColor: 'var(--ed-border)' }} />
            <button type="button" className={btn} style={line} onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1400) }}>{copied ? '복사됨' : '복사'}</button>
          </div>
        </div>
      )}

      {/* 첫 화면 사진 */}
      <div className={row}>
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="w-11 h-14 rounded-md overflow-hidden shrink-0 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {s.look?.cover && <img src={s.look.cover} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.look.coverCrop ? `${(s.look.coverCrop.cropX + s.look.coverCrop.cropWidth / 2) * 100}% ${(s.look.coverCrop.cropY + s.look.coverCrop.cropHeight / 2) * 100}%` : `50% ${s.look.coverY}%` }} />}
          </span>
          <span className="min-w-0 text-[13px] font-semibold">첫 화면 사진</span>
        </span>
        <span className="flex gap-1.5 shrink-0">
          {upload && <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => {
              const f = e.target.files?.[0]; e.target.value = ''
              if (!f) return
              setUpBusy(true)
              try { const u = await upload(f); if (u) await save({ cover: u }) } finally { setUpBusy(false) }
            }} />
            <button type="button" disabled={upBusy || busy} className={btn} style={line} onClick={() => fileRef.current?.click()}>{upBusy ? '올리는 중…' : s.cover ? '변경' : '사진 고르기'}</button>
          </>}
          {s.look?.cover && <button type="button" disabled={busy} className={btn} style={line} onClick={() => { setCropDraft(s.look?.coverCrop || null); setCropOpen(true) }}>자르기</button>}
          {s.cover && <button type="button" disabled={busy} className={btn} style={line} onClick={() => save({ cover: null })}>기본</button>}
        </span>
      </div>


      {/* 이름 표기 */}
      <div className={row}>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold">이름 표기</span>
          {!s.look?.hasEn && <span className="block text-[11.5px]" style={{ color: 'var(--ed-text-muted)' }}>영문 이름을 입력해야 선택할 수 있습니다</span>}
        </span>
        <span className="flex gap-1 shrink-0 p-0.5 rounded-md" style={{ background: 'var(--ed-border)' }}>
          {([['en', '영문'], ['ko', '한글']] as const).map(([v, l]) => {
            const on = (s.nameStyle || (s.look?.hasEn ? 'en' : 'ko')) === v
            return <button key={v} type="button" disabled={busy || (v === 'en' && !s.look?.hasEn)} onClick={() => save({ nameStyle: v })}
              className="h-7 px-3 rounded text-[12px] font-medium disabled:opacity-40" style={on ? { background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' } : { color: 'var(--ed-text-muted)' }}>{l}</button>
          })}
        </span>
      </div>

      {/* 미리보기 */}
      <div className="py-2.5">
        <button type="button" className={btn + ' w-full h-9'} style={solid} onClick={() => setPreview(true)}>하객 화면 미리보기</button>
      </div>

      {/* 문구 */}
      <div className="py-2.5 space-y-1.5">
        <span className="text-[13px] font-semibold">제목 · 안내 문구</span>
        <input value={title} maxLength={40} onChange={e => setTitle(e.target.value)} placeholder="저희 결혼식에서 찍은 사진과 영상을 보내 주세요" className="w-full h-9 px-2 rounded-md border text-[12.5px]" style={{ borderColor: 'var(--ed-border)' }} />
        <textarea value={desc} maxLength={120} rows={2} onChange={e => setDesc(e.target.value)} placeholder="보내 주신 사진과 영상은 저희 둘만 볼 수 있어요." className="w-full px-2 py-1.5 rounded-md border text-[12.5px] resize-none" style={{ borderColor: 'var(--ed-border)' }} />
        <button type="button" disabled={busy} className={btn} style={solid} onClick={async () => { await save({ title, description: desc }); setSaved(true); setTimeout(() => setSaved(false), 1400) }}>{saved ? '저장됨 ✓' : '문구 저장'}</button>
      </div>

      {cropOpen && s.look?.cover && doCrop({
        src: s.look.cover,
        crop: cropDraft || undefined,
        onChange: c => setCropDraft(c),
        onClose: () => { setCropOpen(false); if (cropDraft) void save({ coverCrop: cropDraft }) },
        preview: (
          <div style={{ width: 390, height: 844, position: 'relative', overflow: 'hidden', background: '#FFFFFF', transform: 'translateZ(0)', ['--gs-vh' as string]: '844px' } as React.CSSProperties}>
            <GuestShareClient slug="" coupleSlug={s.slug || ''} coupleName={`${s.look.groomKo} · ${s.look.brideKo}`} title={title} description={desc} look={{ ...s.look, coverCrop: cropDraft }} preview />
          </div>
        ),
      })}
      {preview && s.look && (
        // 하객 화면 미리보기 — 폰 크기 틀 안에 (transform 으로 안쪽 고정 요소가 틀 기준이 됨)
        <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: 'rgba(20,18,15,0.55)' }} onClick={() => setPreview(false)}>
          <div onClick={e => e.stopPropagation()} className="relative" style={{ transform: `scale(${typeof window !== 'undefined' ? Math.min(1, (window.innerHeight - 40) / 844) : 1})` }}>
            <div style={{ width: 390, height: 844, borderRadius: 44, overflow: 'hidden', boxShadow: '0 0 0 10px #1C1A18, 0 30px 60px rgba(0,0,0,0.4)', background: '#FFFFFF', transform: 'translateZ(0)', ['--gs-vh' as string]: '844px' } as React.CSSProperties}>
              <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
                <GuestShareClient slug="" coupleSlug={s.slug || ''} coupleName={`${s.look.groomKo} · ${s.look.brideKo}`} title={title} description={desc} look={{ ...s.look, coverY: s.look.coverY }} preview />
              </div>
            </div>
            <button type="button" onClick={() => setPreview(false)} aria-label="닫기" className="absolute -top-3 -right-14 w-10 h-10 rounded-full bg-white text-lg shadow">×</button>
          </div>
        </div>
      )}
    </div>
  )
}
