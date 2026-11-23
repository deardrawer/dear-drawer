'use client'

import { useCallback, useEffect, useState } from 'react'

interface InvOption {
  id: string
  groomName: string | null
  brideName: string | null
  weddingDate: string | null
  templateId: string | null
}
interface Status {
  slug: string | null
  enabled: boolean
  title: string | null
  description: string | null
  connected: boolean
  accountEmail: string | null
  primaryInvitationId: string | null // 실제 업로드/연결이 갈 청첩장(지정 or 자동)
  selectedInvitationId: string | null // 커플이 명시 지정한 것(null이면 자동)
  invitations: InvOption[]
}


/**
 * 커플(서랍) 단위 하객 사진 공유 — 서랍당 링크 하나(/photo/[slug]).
 * 사진 받을 대표 청첩장 지정 → Drive 연결(계정 공용) → 공유 켜기 → 제목/문구.
 * 업로드는 지정한(또는 자동) 대표 청첩장의 Drive 폴더 한 곳으로 모인다.
 */
export default function CoupleGuestShareCard() {
  const [s, setS] = useState<Status | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/post-drawer/mine/guest-share', { cache: 'no-store' })
      if (!res.ok) return
      const d = (await res.json()) as Status
      setS(d); setEnabled(d.enabled); setTitle(d.title || ''); setDesc(d.description || '')
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { void load() }, [load])

  if (!s) return <p className="setnote">불러오는 중…</p>

  const shareUrl = s.slug ? `${typeof window !== 'undefined' ? window.location.origin : 'https://invite.deardrawer.com'}/photo/${s.slug}` : ''
  const connectUrl = s.primaryInvitationId ? `/api/cloud/google/connect?invitationId=${s.primaryInvitationId}&returnTo=${encodeURIComponent('/post-drawer/mine')}` : null

  const save = async (body: Record<string, unknown>) => {
    setBusy(true)
    try { await fetch('/api/post-drawer/mine/guest-share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) } finally { setBusy(false) }
  }
  const onToggle = async () => { const n = !enabled; setEnabled(n); await save({ enabled: n }) }
  const onSaveText = async () => { await save({ title, description: desc }); setSavedToast(true); setTimeout(() => setSavedToast(false), 1600) }

  return (
    <div>
      <p className="setnote" style={{ marginTop: 0, wordBreak: 'keep-all' }}>사진 받는 링크는 계정에 하나예요. 어느 청첩장에서 들어와도 같은 링크로 모여요.</p>

      {/* Google Drive 연결 (계정 공용) */}
      <div className="setrow">
        <div>
          <div className="setlb">Google Drive {s.connected && <span className="badge2 on">연결됨</span>}</div>
          <div className="setnote">{s.connected ? (s.accountEmail || '연결됨') : '연결하면 하객 사진이 두 사람의 Drive에 자동 보관돼요.'}</div>
        </div>
        {!s.connected && (connectUrl ? <a href={connectUrl} className="btn btn-s btn-solid">연결</a> : <span className="setnote">결제 청첩장 필요</span>)}
      </div>

      {/* 공유 켜기 */}
      <div className="setrow">
        <div>
          <div className="setlb">하객 사진 공유 <span className={`badge2 ${enabled ? 'on' : 'off'}`}>{enabled ? '켜짐' : '꺼짐'}</span></div>
          <div className="setnote">켜면 아래 링크로 하객이 사진을 보낼 수 있어요.</div>
        </div>
        <button type="button" className={`btn btn-s ${enabled ? 'btn-assist' : 'btn-solid'}`} disabled={busy} onClick={onToggle}>{enabled ? '끄기' : '켜기'}</button>
      </div>

      {/* 하객 화면 미리보기 — 켜기 전에도 대표 사진 · 이름이 어떻게 보이는지 확인 */}
      {shareUrl && (
        <div className="setrow">
          <div>
            <div className="setlb">하객 화면 미리보기</div>
            <div className="setnote" style={{ wordBreak: 'keep-all' }}>대표 청첩장의 사진과 이름으로 하객이 보는 화면을 단계별로 볼 수 있어요.</div>
          </div>
          <a href={`${shareUrl}?preview=1`} target="_blank" rel="noopener noreferrer" className="btn btn-s btn-assist">미리보기</a>
        </div>
      )}

      {enabled && (
        <>
          <div className="setfield">
            <div className="setlb" style={{ fontSize: 12 }}>하객 공유 링크 (서랍당 하나)</div>
            <div className="setinline">
              <input readOnly value={shareUrl} className="setinput" onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn btn-s btn-assist" onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>{copied ? '복사됨' : '복사'}</button>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="btn btn-s btn-assist">열기</a>
            </div>
          </div>
          <div className="setfield" style={{ paddingBottom: 0 }}>
            <div className="setlb" style={{ fontSize: 12 }}>공유 페이지 제목 · 안내 문구 <span className="setnote">(비워 두면 기본 문구)</span></div>
            <input value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="저희 결혼식에서 찍은 사진과 영상을 보내 주세요" className="setinput" style={{ marginTop: 8, width: '100%' }} />
            <textarea value={desc} maxLength={120} rows={2} onChange={(e) => setDesc(e.target.value)} placeholder="보내 주신 사진과 영상은 저희 둘만 볼 수 있어요." className="stamp-ta" style={{ marginTop: 8 }} />
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-s btn-solid" disabled={busy} onClick={onSaveText}>{savedToast ? '저장됨 ✓' : '문구 저장'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
