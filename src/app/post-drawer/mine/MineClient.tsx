'use client'

import '../postdrawer.css'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import CoupleGuestShareCard from '@/components/post-drawer/CoupleGuestShareCard'

/** 선택 이미지를 webp Blob으로 변환(최대 변 1200px). */
async function fileToWebp(file: File, maxDim = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 미지원')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('변환 실패'))), 'image/webp', 0.9))
}

interface Capsule {
  key: string
  label: string
  dateIso: string | null
  dday: number
  unlocked: boolean
  recorded: boolean
  photo: string | null
  message: string | null
}
interface InvOverview {
  invitationId: string
  archiveSlug: string
  label: string
  typeLabel: string
  weddingDate: string | null
  templateId: string
  locked: boolean
  hidden: boolean
  share: { shareSlug: string | null; enabled: boolean; hasPassword: boolean; canManage: boolean }
  counts: { messages: number; photos: number } | null
  driveFolderUrl: string | null
  publicHidden: boolean
  canTogglePublic: boolean
  fab: boolean
}
interface AggMessage {
  id: string
  guestName: string
  message: string
  source: string | null
  createdAt: string
  photoUrl?: string | null
  invitationId: string
  invLabel: string
}
interface Overview {
  header: { name: string; weddingDate: string | null; daysMarried: number | null }
  capsules: Capsule[]
  invitations: InvOverview[]
  messages: AggMessage[]
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return ''
  const d = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.replace(/-/g, '.') : d
}
function ddayLabel(days: number | null): string {
  if (days == null) return ''
  if (days < 0) return `예식까지 D-${Math.abs(days)}`
  if (days === 0) return '결혼 오늘'
  return `결혼 ${days}일째`
}

export default function MineClient() {
  const [state, setState] = useState<'loading' | 'auth' | 'empty' | 'ok' | 'error'>('loading')
  const [data, setData] = useState<Overview | null>(null)
  const [view, setView] = useState<'home' | 'invitations' | 'share'>('home') // 서랍 홈 / 내 청첩장 / 하객 사진 공유
  const [msgTab, setMsgTab] = useState<string>('all')
  const [copied, setCopied] = useState<string | null>(null)
  const [pwDraft, setPwDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [labelDraft, setLabelDraft] = useState('')
  const [toast, setToast] = useState('')
  // 우표(커플 단위) 기록 모달
  const [caps, setCaps] = useState<Capsule[]>([])
  const [capKey, setCapKey] = useState<string | null>(null)
  const [capMsg, setCapMsg] = useState('')
  const [capUploading, setCapUploading] = useState(false)
  const [capSaving, setCapSaving] = useState(false)
  const [capErr, setCapErr] = useState('')
  const [capAdding, setCapAdding] = useState(false)
  const capFileRef = useRef<HTMLInputElement>(null)

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200) }

  const load = async () => {
    try {
      const res = await fetch('/api/post-drawer/overview', { cache: 'no-store' })
      if (res.status === 401) return setState('auth')
      if (!res.ok) return setState('error')
      const d = (await res.json()) as Overview
      if (!d.invitations || d.invitations.length === 0) return setState('empty')
      setData(d)
      setCaps(d.capsules || [])
      setState('ok')
    } catch {
      setState('error')
    }
  }
  useEffect(() => { load() }, [])

  const patchInv = (invitationId: string, patch: Partial<InvOverview>) =>
    setData((d) => (d ? { ...d, invitations: d.invitations.map((x) => (x.invitationId === invitationId ? { ...x, ...patch, share: { ...x.share, ...(patch.share || {}) } } : x)) } : d))

  const shareUrl = (slug: string) => `${typeof window !== 'undefined' ? window.location.origin : 'https://invite.deardrawer.com'}/s/${slug}`
  const copyLink = async (slug: string) => {
    try { await navigator.clipboard.writeText(shareUrl(slug)); setCopied(slug); setTimeout(() => setCopied(null), 1800) } catch { flash('복사에 실패했어요') }
  }
  const savePassword = async (inv: InvOverview) => {
    const pw = (pwDraft[inv.invitationId] || '').trim()
    if (pw.length < 4) { flash('비밀번호는 4자 이상이어야 해요'); return }
    setBusy(inv.invitationId)
    try {
      const res = await fetch(`/api/post-drawer/${inv.archiveSlug}/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sharePassword: pw }) })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) { flash(j.error || '저장 실패'); return }
      patchInv(inv.invitationId, { share: { ...inv.share, hasPassword: true } })
      setPwDraft((m) => ({ ...m, [inv.invitationId]: '' }))
      flash('비밀번호를 설정했어요')
    } catch { flash('저장 실패') } finally { setBusy(null) }
  }
  const removePassword = async (inv: InvOverview) => {
    setBusy(inv.invitationId)
    try {
      const res = await fetch(`/api/post-drawer/${inv.archiveSlug}/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ removePassword: true }) })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) { flash(j.error || '해제 실패'); return }
      patchInv(inv.invitationId, { share: { ...inv.share, hasPassword: false } })
      flash('비밀번호를 해제했어요')
    } catch { flash('해제 실패') } finally { setBusy(null) }
  }
  const saveLabel = async (inv: InvOverview) => {
    setBusy(inv.invitationId)
    try {
      const res = await fetch('/api/post-drawer/label', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId: inv.invitationId, label: labelDraft }) })
      const j = (await res.json().catch(() => ({}))) as { label?: string; error?: string }
      if (!res.ok) { flash(j.error || '저장 실패'); return }
      patchInv(inv.invitationId, { label: (j.label && j.label.trim()) || inv.typeLabel })
      setEditingId(null)
    } catch { flash('저장 실패') } finally { setBusy(null) }
  }

  const toggleFab = async (inv: InvOverview) => {
    setBusy(inv.invitationId)
    try {
      const next = !inv.fab
      const res = await fetch('/api/guest-share/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId: inv.invitationId, fab: next }) })
      if (!res.ok) { const j = (await res.json().catch(() => ({}))) as { error?: string }; flash(j.error || '변경 실패'); return }
      patchInv(inv.invitationId, { fab: next })
      flash(next ? '사진 공유 팝업을 표시해요' : '사진 공유 팝업을 숨겼어요')
    } catch { flash('변경 실패') } finally { setBusy(null) }
  }

  const togglePublic = async (inv: InvOverview) => {
    setBusy(inv.invitationId)
    try {
      const next = !inv.publicHidden
      const res = await fetch(`/api/post-drawer/${inv.archiveSlug}/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicHidden: next }) })
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) { flash(j.error || '변경 실패'); return }
      patchInv(inv.invitationId, { publicHidden: next })
      flash(next ? '비공개로 전환했어요' : '다시 공개했어요')
    } catch { flash('변경 실패') } finally { setBusy(null) }
  }

  // ── 우표(커플 단위) 기록 ──
  const currentCap = capKey ? caps.find((c) => c.key === capKey) || null : null
  const capPatch = async (body: Record<string, unknown>): Promise<boolean> => {
    const res = await fetch('/api/post-drawer/mine/capsule', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const j = (await res.json().catch(() => ({}))) as { capsules?: Capsule[]; error?: string }
    if (!res.ok) { setCapErr(j.error || '저장에 실패했어요.'); return false }
    if (j.capsules) setCaps(j.capsules)
    return true
  }
  const openCapsule = (c: Capsule) => {
    if (!c.unlocked) return
    setCapKey(c.key); setCapMsg(c.message || ''); setCapErr('')
  }
  const closeCapsule = () => { if (!capSaving && !capUploading) setCapKey(null) }
  const saveCapMsg = async () => {
    if (!capKey) return
    setCapSaving(true); setCapErr('')
    const ok = await capPatch({ milestone: capKey, message: capMsg })
    setCapSaving(false)
    if (ok) setCapKey(null)
  }
  const onCapPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !capKey) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setCapErr('JPG · PNG · WebP 이미지만 가능해요.'); return }
    const uploadInvId = data?.invitations[0]?.invitationId
    if (!uploadInvId) { setCapErr('업로드할 수 없어요.'); return }
    setCapUploading(true); setCapErr('')
    try {
      const blob = await fileToWebp(file)
      const fd = new FormData()
      fd.append('web', new File([blob], 'capsule.webp', { type: 'image/webp' }))
      fd.append('invitationId', uploadInvId)
      fd.append('imageId', capKey === 'wedding' ? 'drawer-stamp' : `capsule-${capKey}`)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      const ud = (await up.json().catch(() => ({}))) as { webUrl?: string; error?: string }
      if (!up.ok || !ud.webUrl) { setCapErr(ud.error || '업로드에 실패했어요.'); return }
      const busted = `${ud.webUrl}${ud.webUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
      await capPatch({ milestone: capKey, photo: busted })
    } catch { setCapErr('업로드에 실패했어요.') } finally { setCapUploading(false) }
  }
  const removeCapPhoto = async () => { if (capKey) await capPatch({ milestone: capKey, removePhoto: true }) }
  const addCapYear = async () => { if (capAdding) return; setCapAdding(true); await capPatch({ addYear: true }); setCapAdding(false) }

  const Nav = (
    <nav className="nav">
      <Link href="/post-drawer" className="back" aria-label="POST DRAWER로">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        POST DRAWER
      </Link>
      <span aria-hidden style={{ width: 20 }} />
    </nav>
  )

  if (state !== 'ok' || !data) {
    return (
      <div className="pd">
        {Nav}
        <div className="dstate">
          {state === 'loading' ? (
            <p>불러오는 중…</p>
          ) : state === 'auth' ? (
            <><h1>로그인이 필요합니다</h1><p>로그인하면 두 사람의 서랍을 열 수 있습니다.</p><Link href="/login" className="btn btn-m btn-solid">로그인</Link></>
          ) : state === 'empty' ? (
            <><h1>아직 서랍이 없습니다</h1><p>청첩장을 결제하면 방명록·하객 사진·받은 마음을 담는 서랍이 열립니다.</p><Link href="/templates" className="btn btn-m btn-solid">청첩장 만들기</Link></>
          ) : (
            <><h1>불러오지 못했습니다</h1><p>잠시 후 다시 시도해주세요.</p><Link href="/post-drawer" className="btn btn-m btn-assist">POST DRAWER</Link></>
          )}
        </div>
      </div>
    )
  }

  const { header, invitations, messages } = data
  const yearCaps = caps.filter((c) => /^y\d+$/.test(c.key))
  const canAddYear = yearCaps.length < 30 && (yearCaps.length === 0 || yearCaps[yearCaps.length - 1].recorded)
  const activeInvs = invitations.filter((i) => !i.locked && !i.hidden)
  const visibleMsgs = msgTab === 'all' ? messages : messages.filter((m) => m.invitationId === msgTab)

  return (
    <div className="pd">
      <nav className="nav">
        {view === 'home' ? (
          <Link href="/post-drawer" className="back" aria-label="POST DRAWER로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            POST DRAWER
          </Link>
        ) : (
          <button type="button" className="back" onClick={() => setView('home')} style={{ border: 0, background: 'transparent', cursor: 'pointer', font: 'inherit' }} aria-label="서랍으로">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            서랍
          </button>
        )}
        <span aria-hidden style={{ width: 20 }} />
      </nav>
      <div className="drawer">
        {view === 'home' && (<>
        <header className="dhead">
          <h1>{header.name ? `${header.name}의 서랍` : '우리의 서랍'}</h1>
          {(header.weddingDate || header.daysMarried != null) && (
            <div className="dmeta">
              {header.weddingDate && <span className="dm-date">{fmtDate(header.weddingDate)} 결혼</span>}
              {header.daysMarried != null && <span className="dm-dday"><b>{ddayLabel(header.daysMarried)}</b></span>}
            </div>
          )}
          <p className="sub">두 사람에게 도착한 마음을 다시 꺼내봅니다.</p>
          <div className="acts">
            <button type="button" className="btn btn-m btn-solid" onClick={() => setView('invitations')}>내 청첩장</button>
            <button type="button" className="btn btn-m btn-assist" onClick={() => setView('share')}>사진 공유</button>
          </div>
        </header>

        {/* 1. 우리의 우표 (커플 단위) */}
        <section className="sect">
          <h2>우리의 우표</h2>
          <p className="setdesc">결혼식부터 100일 · 1년 · 2년, 해마다 그날의 마음을 우표로 남겨요. 두 사람의 서랍에 쌓입니다.</p>
          <div className="tmstrip">
            {caps.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`tmcard${c.recorded ? ' done' : ''}${c.unlocked ? ' editable' : ' locked'}`}
                onClick={() => openCapsule(c)}
                disabled={!c.unlocked}
                aria-label={`${c.label} 우표`}
              >
                <div className="tmstamp">
                  {c.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photo} alt="" />
                  ) : c.unlocked ? (
                    <span className="tmadd">＋</span>
                  ) : (
                    <span className="tmlock" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                    </span>
                  )}
                </div>
                <div className="tmlabel">{c.label}</div>
                <div className="tmstat">{c.recorded ? '기록됨' : c.unlocked ? '기록 가능' : `D-${c.dday}`}</div>
              </button>
            ))}
            {canAddYear && (
              <button type="button" className="tmcard tmadd-card editable" onClick={addCapYear} disabled={capAdding} aria-label="우표 추가">
                <div className="tmstamp"><span className="tmadd">＋</span></div>
                <div className="tmlabel">추가</div>
                <div className="tmstat">{capAdding ? '추가 중…' : '해마다'}</div>
              </button>
            )}
          </div>
        </section>

        {/* 2. 받은 마음 (통합 + 청첩장별) */}
        <section className="sect">
          <h2>받은 마음 <span className="cnt2">{messages.length}</span></h2>
          {activeInvs.length > 1 && (
            <div className="mtoggle" role="tablist" style={{ flexWrap: 'wrap' }}>
              <button type="button" role="tab" aria-selected={msgTab === 'all'} className={msgTab === 'all' ? 'on' : ''} onClick={() => setMsgTab('all')}>전체보기</button>
              {activeInvs.map((inv) => (
                <button key={inv.invitationId} type="button" role="tab" aria-selected={msgTab === inv.invitationId} className={msgTab === inv.invitationId ? 'on' : ''} onClick={() => setMsgTab(inv.invitationId)}>{inv.label}</button>
              ))}
            </div>
          )}
          {visibleMsgs.length === 0 ? (
            <div className="empty-box">아직 받은 마음이 없습니다.<br />방명록 · RSVP · 모임에서 받은 메시지가 이곳에 모입니다.</div>
          ) : (
            <div className="gb">
              {visibleMsgs.map((m) => (
                <div className="cell" key={m.id}>
                  <div className="cellbody">
                    <div className="nm">
                      <span className="from">From.</span> {m.guestName || '익명'}
                      {m.source === 'rsvp' && <span className="ptag">RSVP</span>}
                      {m.source === 'geunnal' && <span className="ptag">모임</span>}
                      {msgTab === 'all' && <span className="ptag">{m.invLabel}</span>}
                    </div>
                    {m.message && <div className="msg">{m.message}</div>}
                    {m.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photoUrl} alt="" className="cellphoto" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="cellstamp" aria-hidden>
                    <span className="pcstamp">♥</span>
                    <span className="pcmark">{fmtDate(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        </>)}

        {view === 'invitations' && (<>
        <header className="dhead">
          <h1>내 청첩장 <span className="cnt2">{invitations.length}</span></h1>
          <p className="sub">청첩장별 시크릿 링크 · 비밀번호 · 공개 여부를 관리합니다.</p>
        </header>
        <section className="sect">
          <div className="mbundles">
            {invitations.map((inv) => (
              <div className="mbundle noheart" key={inv.invitationId}>
                <div className="meta">
                  {editingId === inv.invitationId ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input autoFocus value={labelDraft} maxLength={40} onChange={(e) => setLabelDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(inv); if (e.key === 'Escape') setEditingId(null) }} placeholder={inv.typeLabel} className="setinput" style={{ flex: 1, minWidth: 0 }} />
                      <button type="button" className="btn btn-s btn-solid" disabled={busy === inv.invitationId} onClick={() => saveLabel(inv)}>저장</button>
                      <button type="button" className="btn btn-s btn-assist" onClick={() => setEditingId(null)}>취소</button>
                    </div>
                  ) : (
                    <div className="nm" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>{inv.label}</span>
                      <span className="ptag">{inv.typeLabel}</span>
                      {inv.locked && <span className="badge2 off">만료 잠김</span>}
                      {inv.hidden && <span className="badge2 off">관리자 잠금</span>}
                      <button type="button" onClick={() => { setEditingId(inv.invitationId); setLabelDraft(inv.label === inv.typeLabel ? '' : inv.label) }} style={{ border: 0, background: 'transparent', color: 'var(--label-alternative)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0, marginLeft: 'auto' }}>이름 변경</button>
                    </div>
                  )}
                  <div className="cnt">
                    {inv.weddingDate ? `${fmtDate(inv.weddingDate)} · ` : ''}
                    {inv.counts ? `받은 마음 ${inv.counts.messages} · 사진 ${inv.counts.photos}장` : (inv.locked ? '보관 기간 종료' : inv.hidden ? '열람 불가' : '')}
                  </div>
                </div>

                {inv.locked ? (
                  <p className="setnote">예식 후 30일이 지나 잠겼어요. 장기보관 신청 시 다시 열립니다.</p>
                ) : inv.hidden ? null : (
                  <>
                    {inv.share.shareSlug && (
                      <div style={{ marginTop: 12 }}>
                        <div className="setlb" style={{ fontSize: 12 }}>시크릿 청첩장 링크</div>
                        <div className="setinline">
                          <input readOnly value={shareUrl(inv.share.shareSlug)} className="setinput" onFocus={(e) => e.currentTarget.select()} />
                          <button type="button" className="btn btn-s btn-assist" onClick={() => copyLink(inv.share.shareSlug!)}>{copied === inv.share.shareSlug ? '복사됨' : '복사'}</button>
                          <a href={shareUrl(inv.share.shareSlug)} target="_blank" rel="noopener noreferrer" className="btn btn-s btn-assist">열기</a>
                        </div>
                      </div>
                    )}
                    {inv.share.canManage ? (
                      <div className="setfield" style={{ paddingBottom: 0 }}>
                        <div className="setlb" style={{ fontSize: 12 }}>비밀번호 <span className={`badge2 ${inv.share.hasPassword ? 'on' : 'off'}`}>{inv.share.hasPassword ? '설정됨' : '없음'}</span></div>
                        <div className="setinline">
                          <input type="password" value={pwDraft[inv.invitationId] || ''} onChange={(e) => setPwDraft((m) => ({ ...m, [inv.invitationId]: e.target.value }))} placeholder={inv.share.hasPassword ? '새 비밀번호(4자 이상)' : '비밀번호(4자 이상)'} className="setinput" />
                          <button type="button" className="btn btn-s btn-solid" disabled={busy === inv.invitationId} onClick={() => savePassword(inv)}>설정</button>
                          {inv.share.hasPassword && <button type="button" className="btn btn-s btn-assist" disabled={busy === inv.invitationId} onClick={() => removePassword(inv)}>해제</button>}
                        </div>
                      </div>
                    ) : (
                      <p className="setnote">비밀번호는 예식 다음날부터 설정할 수 있어요.</p>
                    )}
                    {inv.canTogglePublic && (
                      <div className="setrow" style={{ marginTop: 16, paddingTop: 14, paddingBottom: 0, borderTop: '1px solid var(--line-normal-alternative)', alignItems: 'center', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="setlb" style={{ fontSize: 12 }}>기존 청첩장 공개 <span className={`badge2 ${inv.publicHidden ? 'off' : 'on'}`}>{inv.publicHidden ? '비공개' : '공개 중'}</span></div>
                          <div className="setnote">하객에게 공유한 청첩장(/i) 링크 열기/닫기</div>
                        </div>
                        <button type="button" className={`btn btn-s ${inv.publicHidden ? 'btn-solid' : 'btn-assist'}`} style={{ flexShrink: 0 }} disabled={busy === inv.invitationId} onClick={() => togglePublic(inv)}>{inv.publicHidden ? '다시 공개' : '비공개로'}</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
        </>)}

        {view === 'share' && (<>
        <header className="dhead">
          <h1>하객 사진 공유</h1>
          <p className="sub">서랍당 링크 하나로 하객에게 사진을 받아요. 받은 사진은 연결한 Google Drive 폴더에 모입니다.</p>
        </header>
        <section className="sect">
          <CoupleGuestShareCard />
        </section>
        <section className="sect">
          <h2>청첩장에 팝업 표시</h2>
          <p className="setdesc">각 청첩장 화면에 &lsquo;사진 공유&rsquo; 버튼(팝업)을 띄울지 선택해요. 팝업은 위 공유 링크로 연결됩니다.</p>
          <div className="mbundles">
            {activeInvs.map((inv) => (
              <div className="mbundle noheart" key={inv.invitationId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div className="meta" style={{ minWidth: 0 }}>
                  <div className="nm"><span>{inv.label}</span><span className="ptag">{inv.typeLabel}</span></div>
                </div>
                <button type="button" className={`btn btn-s ${inv.fab ? 'btn-assist' : 'btn-solid'}`} disabled={busy === inv.invitationId} onClick={() => toggleFab(inv)}>{inv.fab ? '표시 중' : '숨김'}</button>
              </div>
            ))}
            {activeInvs.length === 0 && <p className="setnote">표시할 청첩장이 없습니다.</p>}
          </div>
        </section>
        </>)}

        <div className="dfoot">
          <p className="note">이 서랍은 두 사람만 볼 수 있습니다.</p>
        </div>
      </div>

      {capKey && currentCap && (
        <div onClick={closeCapsule} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 70 }}>
          <div className="capmodal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lb-close" onClick={closeCapsule} aria-label="닫기">✕</button>
            <h3 className="capttl">{currentCap.key === 'wedding' ? '결혼식' : currentCap.label} 우표</h3>
            {currentCap.dateIso && <p className="capdate">{fmtDate(currentCap.dateIso)}</p>}
            <div className={`capphoto${currentCap.photo ? '' : ' noimg'}`}>
              {currentCap.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentCap.photo} alt="" />
              ) : (
                <span>사진 없이<br />남긴 기록</span>
              )}
            </div>
            <div className="caprow">
              <button type="button" className="btn btn-m btn-assist" disabled={capUploading || capSaving} onClick={() => capFileRef.current?.click()}>
                {capUploading ? '업로드 중…' : currentCap.photo ? '사진 변경' : '사진 추가'}
              </button>
              {currentCap.photo && <button type="button" className="btn btn-m btn-assist" disabled={capUploading || capSaving} onClick={removeCapPhoto}>사진 삭제</button>}
              <input ref={capFileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onCapPhoto} />
            </div>
            <textarea className="stamp-ta" value={capMsg} maxLength={80} rows={3} placeholder="그날의 마음을 한마디로 남겨보세요." onChange={(e) => setCapMsg(e.target.value)} style={{ marginTop: 12 }} />
            {capErr && <p className="caperr">{capErr}</p>}
            <button type="button" className="btn btn-m btn-solid btn-block" style={{ marginTop: 12 }} disabled={capSaving || capMsg === (currentCap.message ?? '')} onClick={saveCapMsg}>
              {capSaving ? '저장 중…' : '한마디 저장'}
            </button>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--label-normal)', color: '#fff', fontSize: 13, borderRadius: 999, padding: '10px 18px', zIndex: 60 }}>{toast}</div>}
    </div>
  )
}
