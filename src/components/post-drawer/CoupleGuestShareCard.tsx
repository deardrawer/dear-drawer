'use client'

import { useEffect, useState } from 'react'

interface Status {
  slug: string | null
  enabled: boolean
  title: string | null
  description: string | null
  connected: boolean
  accountEmail: string | null
  primaryInvitationId: string | null
}

/**
 * 커플(서랍) 단위 하객 사진 공유 — 서랍당 링크 하나(/photo/[slug]).
 * Drive 연결(계정 공용) + 공유 켜기 + 제목/문구 + 공유 링크. 업로드는 대표 청첩장 폴더로.
 */
export default function CoupleGuestShareCard() {
  const [s, setS] = useState<Status | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/post-drawer/mine/guest-share', { cache: 'no-store' })
        if (!res.ok || !alive) return
        const d = (await res.json()) as Status
        if (!alive) return
        setS(d); setEnabled(d.enabled); setTitle(d.title || ''); setDesc(d.description || '')
      } catch { /* ignore */ }
    })()
    return () => { alive = false }
  }, [])

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
            <div className="setlb" style={{ fontSize: 12 }}>공유 페이지 제목 · 안내 문구</div>
            <input value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="사진 공유" className="setinput" style={{ marginTop: 8, width: '100%' }} />
            <textarea value={desc} maxLength={120} rows={2} onChange={(e) => setDesc(e.target.value)} placeholder="결혼식의 소중한 순간을 함께 나눠주세요 🤍" className="stamp-ta" style={{ marginTop: 8 }} />
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-s btn-solid" disabled={busy} onClick={onSaveText}>{savedToast ? '저장됨 ✓' : '문구 저장'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
