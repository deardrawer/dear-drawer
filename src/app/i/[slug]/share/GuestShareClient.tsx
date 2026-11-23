'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { validateFile, validateBatch, GUEST_SHARE_LIMITS, type FileKind } from '@/lib/guestShareLimits'
import { putFileToR2 } from '@/lib/guestUploadClient'
import type { ShareLook } from '@/lib/guestShareLook'
import { GS, GsShell, GsCoverLayout, GsNames, GsName, GsSign, GsTitle, GsSub, GsBottom, GsStatusScreen, gsBtn } from './GuestShareView'

interface Props {
  slug: string
  coupleName: string
  title: string
  description: string
  coupleSlug?: string // 지정 시 커플 단위 공유(세션 API에 coupleSlug로 요청) — 서랍당 링크 하나
  /** 커버 사진 · 이름 · 날짜 (대표 청첩장) */
  look?: ShareLook
  /** '청첩장 보기' 링크 */
  invitationHref?: string | null
  /** 신랑·신부 미리보기 — 단계별로 화면만 보여 주고 업로드는 안 함 */
  preview?: boolean
}

type ItemStatus = 'ready' | 'uploading' | 'done' | 'error'
interface Item {
  key: string
  file: File
  url: string
  kind: FileKind
  status: ItemStatus
  progress: number
  error?: string
}

type Phase = 'select' | 'uploading' | 'done' | 'partial'


export default function GuestShareClient({ slug, coupleName, title, description, coupleSlug, look: lookProp, invitationHref = null, preview = false }: Props) {
  const [guestName, setGuestName] = useState('')
  const [message, setMessage] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [phase, setPhase] = useState<Phase>('select')
  const [globalError, setGlobalError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 최신 items를 effect/핸들러에서 참조하기 위한 ref (렌더 중이 아닌 effect에서 동기화)
  const itemsRef = useRef<Item[]>([])
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  // 언마운트 시 object URL 정리
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url))
    }
  }, [])

  const patch = useCallback((key: string, p: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)))
  }, [])

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalError('')
    const picked = Array.from(e.target.files ?? [])
    e.target.value = '' // Array.from 이후 초기화 (FileList는 live 객체)
    if (!picked.length) return

    setItems((prev) => {
      const room = GUEST_SHARE_LIMITS.maxFiles - prev.length
      if (room <= 0) {
        setGlobalError(`한 번에 최대 ${GUEST_SHARE_LIMITS.maxFiles}개까지 보낼 수 있어요.`)
        return prev
      }
      const next: Item[] = []
      for (const file of picked) {
        if (next.length >= room) {
          setGlobalError(`한 번에 최대 ${GUEST_SHARE_LIMITS.maxFiles}개까지 보낼 수 있어요.`)
          break
        }
        const v = validateFile({ name: file.name, mimeType: file.type, size: file.size })
        if (!v.ok) {
          setGlobalError(`${file.name}: ${v.error}`)
          continue
        }
        next.push({
          key: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          kind: v.kind ?? 'image',
          status: 'ready',
          progress: 0,
        })
      }
      return [...prev, ...next]
    })
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.key === key)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((i) => i.key !== key)
    })
  }, [])

  const startUpload = useCallback(async () => {
    setGlobalError('')
    const name = guestName.trim()
    if (!name) {
      setGlobalError('보내는 분 이름을 적어 주세요.')
      return
    }
    // 아직 완료되지 않은(신규 + 실패) 파일만 대상
    const targets = itemsRef.current.filter((i) => i.status !== 'done')
    if (!targets.length) {
      setGlobalError('보낼 사진이나 영상을 골라 주세요.')
      return
    }
    const metas = targets.map((i) => ({ name: i.file.name, size: i.file.size, mimeType: i.file.type }))
    const batch = validateBatch(metas)
    if (!batch.ok) {
      setGlobalError(batch.error ?? '')
      return
    }

    setPhase('uploading')
    targets.forEach((t) => patch(t.key, { status: 'uploading', progress: 0, error: undefined }))

    // 1) 세션 + presigned URL 발급
    let sessionData: { sessionId: string; files: { fileId: string; uploadUrl: string; contentType: string }[] }
    try {
      const res = await fetch('/api/guest-share/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(coupleSlug ? { coupleSlug } : { slug }), guestName: name, message: message.trim().slice(0, 200), files: metas }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        setGlobalError(err.error || '업로드 준비에 실패했어요. 잠시 후 다시 시도해주세요.')
        targets.forEach((t) => patch(t.key, { status: 'error' }))
        setPhase('partial')
        return
      }
      sessionData = await res.json()
    } catch {
      setGlobalError('네트워크 오류로 업로드를 시작하지 못했어요.')
      targets.forEach((t) => patch(t.key, { status: 'error' }))
      setPhase('partial')
      return
    }

    // 2) 파일별 R2 직접 업로드 (순차 — 모바일 안정성) + 서버 검증
    let success = 0
    let failed = 0
    for (let idx = 0; idx < targets.length; idx++) {
      const item = targets[idx]
      const meta = sessionData.files[idx]
      if (!meta) {
        patch(item.key, { status: 'error', error: '업로드 정보 없음' })
        failed++
        continue
      }
      const put = await putFileToR2(meta.uploadUrl, item.file, meta.contentType, (pct) =>
        patch(item.key, { progress: pct }),
      )
      if (!put.ok) {
        patch(item.key, { status: 'error', progress: 0, error: `업로드 실패 (${put.status})` })
        failed++
        continue
      }
      // 서버가 R2 HEAD로 검증 + Drive 이전 enqueue. R2 저장 확인 = 성공 기준.
      try {
        const comp = await fetch('/api/guest-share/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: meta.fileId }),
        })
        if (!comp.ok) {
          patch(item.key, { status: 'error', error: '저장 확인 실패' })
          failed++
          continue
        }
      } catch {
        patch(item.key, { status: 'error', error: '저장 확인 실패' })
        failed++
        continue
      }
      patch(item.key, { status: 'done', progress: 100 })
      success++
    }

    setPhase(failed === 0 ? 'done' : 'partial')
    if (failed > 0) {
      setGlobalError(`${success}개는 보냈고 ${failed}개는 보내지 못했어요. 아래 버튼으로 다시 보낼 수 있어요.`)
    }
  }, [guestName, message, slug, coupleSlug, patch])

  const resetForMore = useCallback(() => {
    itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url))
    setItems([])
    setGlobalError('')
    setPhase('select')
  }, [])

  const uploading = phase === 'uploading'
  const look = lookProp ?? FALLBACK_LOOK(coupleName)

  // ── 미리보기 — 신랑·신부가 하객 화면을 단계별로 확인 (업로드는 하지 않음) ──
  const [pv, setPv] = useState<PreviewStep>('select-empty')
  if (preview) {
    const demo: ViewItem[] = (look.samples.length ? look.samples : [look.cover].filter(Boolean)).slice(0, 7).map((url, i) => ({ key: `p${i}`, url, kind: i === 2 ? 'video' : 'image', status: 'ready', progress: 0 }))
    const sentN = Math.max(1, Math.round(demo.length * 0.7))
    const asUploading = demo.map((d, i) => ({ ...d, status: (i < sentN ? 'done' : i === sentN ? 'uploading' : 'ready') as ItemStatus, progress: i === sentN ? 60 : 0 }))
    const STEPS: [PreviewStep, string][] = [['select-empty', '첫 화면'], ['select', '선택 후'], ['uploading', '보내는 중'], ['done', '완료'], ['before', '열리기 전'], ['closed', '마감']]
    const body = pv === 'before' || pv === 'closed'
      ? <GsStatusScreen look={look} kind={pv} invitationHref={invitationHref} />
      : pv === 'done'
        ? <DoneView look={look} items={demo} name="김하늘" onMore={() => setPv('select-empty')} invitationHref={invitationHref} />
        : <SelectView look={look} items={pv === 'select-empty' ? [] : pv === 'uploading' ? asUploading : demo} uploading={pv === 'uploading'} partial={false}
            name={pv === 'select-empty' ? '' : '김하늘'} message={pv === 'select-empty' ? '' : '오늘 진짜 예뻤어. 결혼 축하해!'} title={title} description={description}
            onName={() => {}} onMessage={() => {}} onPick={() => setPv('select')} onRemove={() => {}} onSend={() => setPv('uploading')} error="" />
    return (
      <>
        {/* 위 미리보기 막대에 화면 머리가 가리지 않게 (사진 커버 화면은 그대로) */}
        <div style={{ paddingTop: pv === 'select' || pv === 'uploading' || pv === 'done' ? 52 : 0 }}>{body}</div>
        <div style={{ position: 'fixed', top: 10, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', display: 'flex', gap: 2, padding: 3, borderRadius: 999, background: 'rgba(20,20,20,0.82)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', maxWidth: 'calc(100vw - 20px)', overflowX: 'auto' }}>
            {STEPS.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setPv(k)} style={{ border: 0, borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', background: pv === k ? '#FFFFFF' : 'transparent', color: pv === k ? '#111' : '#FFFFFF', fontFamily: 'inherit' }}>{l}</button>
            ))}
          </div>
        </div>
      </>
    )
  }

  // ── 완료 화면 ──
  if (phase === 'done') {
    return <DoneView look={look} items={items} name={guestName.trim()} onMore={resetForMore} invitationHref={invitationHref} />
  }

  // ── 선택 · 보내는 중 ──
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={onPick} disabled={uploading} className="hidden" />
      <SelectView look={look} items={items} uploading={uploading} partial={phase === 'partial'} name={guestName} message={message} title={title} description={description}
        onName={setGuestName} onMessage={setMessage} onPick={() => inputRef.current?.click()} onRemove={removeItem} onSend={startUpload} error={globalError} />
    </>
  )
}

/* ───────── 화면들 ───────── */
type PreviewStep = 'select-empty' | 'select' | 'uploading' | 'done' | 'before' | 'closed'
type ViewItem = Pick<Item, 'key' | 'url' | 'kind' | 'status' | 'progress'>

const FALLBACK_LOOK = (coupleName: string): ShareLook => {
  const [g, b] = coupleName.split('·').map(s => s.trim())
  return { cover: '', coverY: 22, nameEn: null, hasEn: false, groomKo: g || '신랑', brideKo: b || '신부', meta: '', since: null, daysLeft: null, samples: [] }
}
/** '사진 7장' · '영상 2개' · '사진 6장·영상 1개' */
const countText = (p: number, v: number) => [p ? `사진 ${p}장` : '', v ? `영상 ${v}개` : ''].filter(Boolean).join('·')
/** '사진 7장' · '영상 2개' · '사진 6장과 영상 1개' */
const doneText = (p: number, v: number) => (p && v ? `사진 ${p}장과 영상 ${v}개` : p ? `사진 ${p}장` : `영상 ${v}개`)
const MB = (b: number) => Math.round(b / (1024 * 1024))
const LIMIT_TEXT = `사진 1장당 ${MB(GUEST_SHARE_LIMITS.imageMaxBytes)}MB · 영상 1개당 ${MB(GUEST_SHARE_LIMITS.videoMaxBytes)}MB · 한 번에 최대 ${GUEST_SHARE_LIMITS.maxFiles}개`
const DEFAULT_TITLE = '저희 결혼식에서 찍은\n사진과 영상을 보내 주세요'
const DEFAULT_DESC = '보내 주신 사진과 영상은 저희 둘만 볼 수 있어요.'
/** 예전 기본 문구로 저장된 값은 새 기본 문구로 */
const OLD_DEFAULTS = ['사진 공유', '결혼식의 소중한 순간을 함께 나눠주세요 🤍']

function Thumb({ it, size, radius = 10 }: { it: ViewItem; size?: number; radius?: number }) {
  const box: CSSProperties = size ? { width: size, height: size } : { width: '100%', aspectRatio: '1' }
  return (
    <span style={{ ...box, position: 'relative', display: 'block', borderRadius: radius, overflow: 'hidden', background: '#EDEDED', flexShrink: 0 }}>
      {it.kind === 'video'
        ? <video src={it.url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={it.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
    </span>
  )
}

function SelectView({ look, items, uploading, partial, name, message, title, description, onName, onMessage, onPick, onRemove, onSend, error }: {
  look: ShareLook; items: ViewItem[]; uploading: boolean; partial: boolean; name: string; message: string; title: string; description: string
  onName: (v: string) => void; onMessage: (v: string) => void; onPick: () => void; onRemove: (key: string) => void; onSend: () => void; error: string
}) {
  const nP = items.filter(i => i.kind !== 'video').length
  const nV = items.filter(i => i.kind === 'video').length
  const done = items.filter(i => i.status === 'done').length
  const failed = items.filter(i => i.status === 'error').length
  const heading = title && !OLD_DEFAULTS.includes(title) ? title : DEFAULT_TITLE
  const sub = description && !OLD_DEFAULTS.includes(description) ? description : DEFAULT_DESC

  // 보내는 중 — 원형 진행
  if (uploading) {
    const R = 76, C = 2 * Math.PI * R
    return (
      <GsShell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22vh 24px 60px' }}>
          <div style={{ position: 'relative', width: 168, height: 168 }}>
            <svg width="168" height="168" viewBox="0 0 168 168" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
              <circle cx="84" cy="84" r={R} fill="none" stroke="rgba(31,29,26,0.08)" strokeWidth="6" />
              <circle cx="84" cy="84" r={R} fill="none" stroke={GS.accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - done / Math.max(1, items.length))} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: GS.serif, fontSize: 46, lineHeight: 1 }}>{done}<span style={{ fontSize: 26, color: GS.sub }}> / {items.length}</span></span>
            </div>
          </div>
          <GsTitle mt={30}>{look.groomKo} · {look.brideKo}에게 보내고 있어요</GsTitle>
          <GsSub>전송이 끝날 때까지 이 화면을 열어 두세요.</GsSub>
          <div style={{ display: 'flex', gap: 6, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }}>
            {items.map(it => (
              <span key={it.key} style={{ position: 'relative', display: 'block', opacity: it.status === 'ready' ? 0.45 : 1 }}>
                <Thumb it={it} size={40} radius={8} />
                {it.status === 'done' && <span style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(63,74,60,0.45)', color: '#FFF', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                {it.status === 'uploading' && <span style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${it.progress}%`, background: GS.accent, transition: 'width 0.3s' }} />}
                {it.status === 'error' && <span style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(200,60,60,0.45)' }} />}
              </span>
            ))}
          </div>
        </div>
      </GsShell>
    )
  }

  // 첫 화면 — 아직 아무것도 고르지 않음 (폰 한 화면에 맞춤)
  if (!items.length) {
    return (
      <GsCoverLayout look={look} bottom={<>
        <button type="button" onClick={onPick} style={gsBtn(true)}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 9" /></svg>
          사진·영상 고르기
        </button>
        <p style={{ fontSize: 11, color: GS.sub, textAlign: 'center', margin: '2px 0 0', lineHeight: 1.5, wordBreak: 'keep-all' }}>{LIMIT_TEXT}</p>
      </>}>
        <GsNames look={look} />
        {look.daysLeft !== null && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: GS.accent, background: 'rgba(63,74,60,0.09)', padding: '6px 12px', borderRadius: 999 }}>받는 중 · {look.daysLeft === 0 ? '오늘 마감돼요' : `${look.daysLeft}일 남았어요`}</span>
          </div>
        )}
        <GsTitle mt={24}>{heading}</GsTitle>
        <GsSub>{sub}</GsSub>
        <GsSign look={look} />
        {error && <p style={{ margin: '18px 0 0', borderRadius: 10, background: '#FDF1F1', padding: '9px 12px', fontSize: 12.5, color: '#C0392B', textAlign: 'center', wordBreak: 'keep-all' }}>{error}</p>}
      </GsCoverLayout>
    )
  }

  // 고른 뒤 — 목록 · 이름 · 한마디 · 보내기
  const sendLabel = partial ? `실패한 ${failed}개 다시 보내기` : `${countText(nP, nV)} 보내기`
  const field: CSSProperties = { width: '100%', boxSizing: 'border-box', background: GS.field, border: 0, outline: 'none', borderRadius: 14, padding: '13px 15px', fontSize: 16, lineHeight: 1.55, color: GS.ink, fontFamily: 'inherit' }
  return (
    <GsShell>
      <div style={{ padding: '28px 22px 150px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#EDEDED' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {look.cover && <img src={look.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ lineHeight: 1.1 }}><GsName look={look} size={22} /></div>
            {look.daysLeft !== null && <div style={{ fontSize: 12, color: GS.sub, marginTop: 4 }}>{look.daysLeft === 0 ? '오늘 마감돼요' : `${look.daysLeft}일 남았어요`}</div>}
          </div>
        </div>
        <div style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{countText(nP, nV)}</span>
            <span style={{ fontSize: 12, color: GS.sub, flexShrink: 0 }}>{items.length} / {GUEST_SHARE_LIMITS.maxFiles}</span>
          </div>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map(it => (
              <li key={it.key} style={{ position: 'relative' }}>
                <Thumb it={it} />
                {it.kind === 'video' && <span style={{ position: 'absolute', left: 5, bottom: 5, fontSize: 10, fontWeight: 600, color: '#FFF', background: 'rgba(0,0,0,0.45)', padding: '1px 5px', borderRadius: 4 }}>▶ 영상</span>}
                {it.status === 'done' && <span style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'rgba(63,74,60,0.45)', color: '#FFF', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                {it.status === 'error' && <span style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'rgba(192,57,43,0.45)', color: '#FFF', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>실패</span>}
                {it.status !== 'done' && (
                  <button type="button" onClick={() => onRemove(it.key)} aria-label="빼기" style={{ position: 'absolute', right: 4, top: 4, width: 20, height: 20, borderRadius: '50%', border: 0, padding: 0, background: 'rgba(0,0,0,0.5)', color: '#FFF', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
                )}
              </li>
            ))}
            {items.length < GUEST_SHARE_LIMITS.maxFiles && (
              <li>
                <button type="button" onClick={onPick} style={{ width: '100%', aspectRatio: '1', borderRadius: 10, border: 0, background: GS.field, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: GS.sub, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 22, lineHeight: 1, color: GS.ink }}>+</span><span style={{ fontSize: 10.5 }}>더 고르기</span>
                </button>
              </li>
            )}
          </ul>
        </div>
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: GS.sub, marginBottom: 7 }}>보내는 분 이름</span>
            <input type="text" value={name} onChange={e => onName(e.target.value)} maxLength={40} placeholder="이름을 적어 주세요" style={field} />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: GS.sub, marginBottom: 7 }}><span>두 사람에게 한마디 (선택)</span><span style={{ fontWeight: 400 }}>{message.length}/200</span></span>
            <textarea value={message} onChange={e => onMessage(e.target.value)} maxLength={200} rows={3} placeholder="축하 메시지를 남겨 주세요" style={{ ...field, resize: 'none', minHeight: 84 }} />
          </label>
        </div>
        {error && <p style={{ margin: '16px 0 0', borderRadius: 10, background: '#FDF1F1', padding: '9px 12px', fontSize: 12.5, color: '#C0392B', wordBreak: 'keep-all' }}>{error}</p>}
      </div>
      <GsBottom>
        <button type="button" onClick={onSend} disabled={!name.trim()} style={{ ...gsBtn(true), opacity: name.trim() ? 1 : 0.4, cursor: name.trim() ? 'pointer' : 'default' }}>{sendLabel}</button>
      </GsBottom>
    </GsShell>
  )
}

function DoneView({ look, items, name, onMore, invitationHref }: { look: ShareLook; items: ViewItem[]; name: string; onMore: () => void; invitationHref?: string | null }) {
  const ok = items.filter(i => i.status === 'done' || i.status === 'ready')
  const nP = ok.filter(i => i.kind !== 'video').length
  const nV = ok.filter(i => i.kind === 'video').length
  const imgs = ok.filter(i => i.kind !== 'video')
  const pick = (imgs.length ? imgs : ok).slice(0, 3)
  const spots: [number, number, number][] = pick.length >= 3 ? [[-9, -62, 10], [7, 62, 18], [-1, 0, 0]] : pick.length === 2 ? [[-5, -32, 6], [6, 34, 14]] : [[-2, 0, 0]]
  const order = pick.length >= 3 ? [pick[1], pick[2], pick[0]] : pick
  const today = new Date()
  const stamp = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
  return (
    <GsShell>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16vh 24px 190px' }}>
        <div style={{ position: 'relative', width: 260, height: 230 }}>
          {order.map((it, i) => {
            const [r, x, y] = spots[i]
            return (
              <div key={it.key} style={{ position: 'absolute', left: 130 - 74 + x, top: y, width: 148, padding: '8px 8px 26px', background: '#FFFFFF', borderRadius: 3, boxShadow: '0 10px 24px rgba(0,0,0,0.14)', transform: `rotate(${r}deg)`, boxSizing: 'border-box' }}>
                <Thumb it={it} radius={0} />
              </div>
            )
          })}
        </div>
        <div style={{ fontFamily: GS.mono, fontSize: 11.5, color: GS.sub, marginTop: 34 }}>{stamp} — {name || '하객'} 님이 보냄</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.45, textAlign: 'center', margin: '14px 0 0', letterSpacing: '-0.03em', wordBreak: 'keep-all' }}>고마워요, {name || '하객'} 님</h1>
        <GsSub mt={6}>{ok.length ? `${doneText(nP, nV)}, 잘 받았어요.` : '잘 받았어요.'}</GsSub>
        <GsSign look={look} mt={8} />
      </div>
      <GsBottom>
        <button type="button" onClick={onMore} style={gsBtn(true)}>사진·영상 더 보내기</button>
        {invitationHref && <a href={invitationHref} style={gsBtn(false)}>청첩장 다시 보기</a>}
      </GsBottom>
    </GsShell>
  )
}
