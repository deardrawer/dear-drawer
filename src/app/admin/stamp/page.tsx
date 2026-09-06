'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'

interface StampItem {
  id: string
  groomName: string | null
  brideName: string | null
  weddingDate: string | null
  photo: string | null
  hasCustomPhoto: boolean
  kakaoThumbnail: string | null
  message: string | null
  hidden: boolean
}

interface ColStamp {
  id: string
  photo: string | null
  message: string | null
  weddingDate: string | null
  hidden: boolean
  createdAt: string
}

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

function fmtDate(s: string | null): string {
  if (!s) return '날짜 미정'
  const d = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.replace(/-/g, '.') : d
}

export default function AdminStampPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [items, setItems] = useState<StampItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  // 직접 추가한 우표
  const [colStamps, setColStamps] = useState<ColStamp[]>([])
  const [newPhoto, setNewPhoto] = useState<string | null>(null)
  const [newMsg, setNewMsg] = useState('')
  const [newDate, setNewDate] = useState('')
  const [colBusy, setColBusy] = useState(false)

  const load = useCallback(async (pw: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stamp', { headers: { 'x-admin-password': pw } })
      if (res.status === 401) {
        setError('비밀번호가 올바르지 않습니다.')
        setAuthed(false)
        return
      }
      if (!res.ok) {
        setError('불러오지 못했습니다.')
        return
      }
      const d = (await res.json()) as { items: StampItem[] }
      setItems(d.items)
      setDrafts(Object.fromEntries(d.items.map((it) => [it.id, it.message || ''])))
      // 직접 추가한 우표 목록도 로드
      const cr = await fetch('/api/admin/collection-stamp', { headers: { 'x-admin-password': pw } })
      if (cr.ok) setColStamps(((await cr.json()) as { items: ColStamp[] }).items)
      setAuthed(true)
    } catch {
      setError('불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 새 우표 사진 업로드(관리자 비번) → URL 확보
  const uploadNewPhoto = async (file: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setToast('JPG · PNG · WebP 이미지만 가능')
      return
    }
    setColBusy(true)
    try {
      const blob = await fileToWebp(file)
      const fd = new FormData()
      fd.append('web', new File([blob], 'stamp.webp', { type: 'image/webp' }))
      fd.append('invitationId', 'collection')
      const up = await fetch('/api/upload', { method: 'POST', headers: { 'x-admin-password': password }, body: fd })
      const ud = (await up.json()) as { webUrl?: string; error?: string }
      if (!up.ok || !ud.webUrl) {
        setToast(ud.error || '업로드 실패')
        return
      }
      setNewPhoto(`${ud.webUrl}${ud.webUrl.includes('?') ? '&' : '?'}t=${Date.now()}`)
    } catch {
      setToast('업로드 실패')
    } finally {
      setColBusy(false)
    }
  }

  const addCollectionStamp = async () => {
    if (!newPhoto && !newMsg.trim()) {
      setToast('사진 또는 멘트를 입력하세요')
      return
    }
    setColBusy(true)
    try {
      const res = await fetch('/api/admin/collection-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ photo: newPhoto, message: newMsg, weddingDate: newDate || null }),
      })
      const d = (await res.json()) as { item?: ColStamp; error?: string }
      if (!res.ok || !d.item) {
        setToast(d.error || '추가 실패')
        return
      }
      setColStamps((prev) => [d.item!, ...prev])
      setNewPhoto(null)
      setNewMsg('')
      setNewDate('')
      setToast('우표를 추가했어요')
      setTimeout(() => setToast(''), 2000)
    } catch {
      setToast('추가 실패')
    } finally {
      setColBusy(false)
    }
  }

  const patchCollectionStamp = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    setColBusy(true)
    try {
      const res = await fetch('/api/admin/collection-stamp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id, ...body }),
      })
      const d = (await res.json()) as { item?: ColStamp; error?: string }
      if (!res.ok || !d.item) {
        setToast(d.error || '저장 실패')
        return
      }
      setColStamps((prev) => prev.map((x) => (x.id === id ? d.item! : x)))
      setToast(okMsg)
      setTimeout(() => setToast(''), 2000)
    } catch {
      setToast('저장 실패')
    } finally {
      setColBusy(false)
    }
  }

  const removeCollectionStamp = async (id: string) => {
    setColBusy(true)
    try {
      const res = await fetch(`/api/admin/collection-stamp?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': password } })
      if (!res.ok) {
        setToast('삭제 실패')
        return
      }
      setColStamps((prev) => prev.filter((x) => x.id !== id))
      setToast('삭제됨')
      setTimeout(() => setToast(''), 2000)
    } catch {
      setToast('삭제 실패')
    } finally {
      setColBusy(false)
    }
  }

  const applyItem = (it: StampItem) => {
    setItems((prev) => prev.map((x) => (x.id === it.id ? it : x)))
    setDrafts((prev) => ({ ...prev, [it.id]: it.message || '' }))
  }

  const patch = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    setBusy(id)
    try {
      const res = await fetch('/api/admin/stamp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ invitationId: id, ...body }),
      })
      const d = (await res.json()) as { item?: StampItem; error?: string }
      if (!res.ok || !d.item) {
        setToast(d.error || '저장 실패')
        return
      }
      applyItem(d.item)
      setToast(okMsg)
      setTimeout(() => setToast(''), 2000)
    } catch {
      setToast('저장 실패')
    } finally {
      setBusy(null)
    }
  }

  const uploadPhoto = async (id: string, file: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setToast('JPG · PNG · WebP 이미지만 가능')
      return
    }
    setBusy(id)
    try {
      const blob = await fileToWebp(file)
      const fd = new FormData()
      fd.append('web', new File([blob], 'stamp.webp', { type: 'image/webp' }))
      fd.append('invitationId', id)
      fd.append('imageId', 'drawer-stamp')
      const up = await fetch('/api/upload', { method: 'POST', headers: { 'x-admin-password': password }, body: fd })
      const ud = (await up.json()) as { webUrl?: string; error?: string }
      if (!up.ok || !ud.webUrl) {
        setToast(ud.error || '업로드 실패')
        return
      }
      const busted = `${ud.webUrl}${ud.webUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
      await patch(id, { stampPhoto: busted }, '사진 변경됨')
    } catch {
      setToast('업로드 실패')
    } finally {
      setBusy(null)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-lg font-bold text-gray-900">우표 관리 (관리자)</h1>
          <p className="text-sm text-gray-500 mt-1">공개되는 결혼식 우표의 사진 · 멘트 · 노출을 관리합니다.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(password)}
            placeholder="관리자 비밀번호"
            className="mt-5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-900"
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <button
            type="button"
            onClick={() => load(password)}
            disabled={loading || !password}
            className="mt-4 w-full rounded-lg bg-gray-900 text-white py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? '확인 중…' : '입장'}
          </button>
          <Link href="/admin" className="block text-center text-xs text-gray-400 mt-4 hover:text-gray-600">관리자 홈</Link>
        </div>
      </div>
    )
  }

  const filtered = items.filter((it) => {
    const q = search.trim()
    if (!q) return true
    return `${it.groomName || ''} ${it.brideName || ''}`.includes(q)
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">우표 관리</h1>
            <p className="text-sm text-gray-500">공개 컬렉션에 노출되는 결혼식 우표 {items.length}개</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => load(password)} className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50">새로고침</button>
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">관리자 홈</Link>
          </div>
        </div>

        {/* 직접 추가한 우표 */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <h2 className="text-sm font-bold text-gray-900">직접 추가한 우표 <span className="text-gray-400 font-normal">{colStamps.length}</span></h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">실제 청첩장과 무관한 우표를 공개 컬렉션에 추가합니다.</p>

          {/* 추가 폼 */}
          <div className="flex gap-3 items-start">
            <label className="shrink-0 w-16 h-20 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer border border-dashed border-gray-300">
              {newPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-gray-400 text-center leading-tight">{colBusy ? '처리중' : '사진\n선택'}</span>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadNewPhoto(f) }} />
            </label>
            <div className="flex-1 min-w-0">
              <textarea
                value={newMsg}
                maxLength={80}
                rows={2}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="결혼식 한 조각(멘트)"
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:border-gray-900"
                />
                <button type="button" disabled={colBusy} onClick={addCollectionStamp} className="text-xs rounded-lg bg-gray-900 text-white px-3 py-1.5 disabled:opacity-40 ml-auto">
                  우표 추가
                </button>
              </div>
            </div>
          </div>

          {/* 추가된 우표 목록 */}
          {colStamps.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
              {colStamps.map((c) => (
                <div key={c.id} className={`relative rounded-md overflow-hidden border ${c.hidden ? 'border-red-300 opacity-60' : 'border-gray-100'}`}>
                  <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center">
                    {c.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-gray-400 p-1 text-center">{c.message || '빈 우표'}</span>
                    )}
                  </div>
                  <div className="flex text-[10px]">
                    <button type="button" disabled={colBusy} onClick={() => patchCollectionStamp(c.id, { hidden: !c.hidden }, c.hidden ? '공개됨' : '숨김')} className="flex-1 py-1 text-gray-600 hover:bg-gray-50">
                      {c.hidden ? '공개' : '숨김'}
                    </button>
                    <button type="button" disabled={colBusy} onClick={() => removeCollectionStamp(c.id)} className="flex-1 py-1 text-red-500 hover:bg-red-50 border-l border-gray-100">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="신랑 · 신부 이름으로 검색"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:border-gray-900"
        />

        <div className="space-y-3">
          {filtered.map((it) => (
            <div key={it.id} className={`bg-white rounded-xl border ${it.hidden ? 'border-red-200' : 'border-gray-100'} p-4`}>
              <div className="flex gap-4">
                <div className="shrink-0 w-16 h-20 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  {it.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-400">사진 없음</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{[it.groomName, it.brideName].filter(Boolean).join(' · ') || '이름 미정'}</span>
                    <span className="text-xs text-gray-400">{fmtDate(it.weddingDate)}</span>
                    {it.hidden && <span className="text-[11px] font-semibold text-red-600 bg-red-50 rounded px-1.5 py-0.5">숨김</span>}
                    {it.hasCustomPhoto && <span className="text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">전용 사진</span>}
                  </div>

                  {/* 멘트 */}
                  <textarea
                    value={drafts[it.id] ?? ''}
                    maxLength={80}
                    rows={2}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [it.id]: e.target.value }))}
                    placeholder="결혼식 한 조각(멘트)"
                    className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                  />
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                      type="button"
                      disabled={busy === it.id || (drafts[it.id] ?? '') === (it.message ?? '')}
                      onClick={() => patch(it.id, { stampMessage: drafts[it.id] ?? '' }, '멘트 저장됨')}
                      className="text-xs rounded-lg bg-gray-900 text-white px-3 py-1.5 disabled:opacity-40"
                    >
                      멘트 저장
                    </button>
                    <label className="text-xs rounded-lg border border-gray-300 px-3 py-1.5 cursor-pointer hover:bg-gray-50">
                      {busy === it.id ? '처리 중…' : '사진 변경'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          e.target.value = ''
                          if (f) uploadPhoto(it.id, f)
                        }}
                      />
                    </label>
                    {it.hasCustomPhoto && (
                      <button type="button" disabled={busy === it.id} onClick={() => patch(it.id, { removeStampPhoto: true }, '카카오 썸네일로 되돌림')} className="text-xs text-gray-500 underline">
                        사진 초기화
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy === it.id}
                      onClick={() => patch(it.id, { stampHidden: !it.hidden }, it.hidden ? '다시 공개됨' : '숨김 처리됨')}
                      className={`text-xs rounded-lg px-3 py-1.5 ml-auto ${it.hidden ? 'bg-green-600 text-white' : 'border border-red-300 text-red-600'}`}
                    >
                      {it.hidden ? '다시 공개' : '우표 숨김'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-10">해당 우표가 없습니다.</p>}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm rounded-full px-4 py-2 shadow-lg">{toast}</div>
      )}
    </div>
  )
}
