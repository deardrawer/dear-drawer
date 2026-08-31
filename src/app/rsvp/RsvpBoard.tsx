'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface InvSummary {
  id: string
  name: string
  weddingDate: string | null
  attending: number
  notAttending: number
  pending: number
  guests: number
  total: number
}
interface Breakdown {
  mealYes: number; mealNo: number
  shuttleYes: number; shuttleNo: number
  afterYes: number; afterNo: number
  groomSide: number; brideSide: number
}
interface Overview {
  invitations: InvSummary[]
  totals: { attending: number; notAttending: number; pending: number; guests: number; total: number; invitations: number } & Breakdown
}
interface RespItem {
  id: string
  invitationId: string
  invitationName: string
  guestName: string
  guestPhone: string | null
  attendance: 'attending' | 'not_attending' | 'pending'
  guestCount: number
  message: string | null
  createdAt: string
  side: 'groom' | 'bride' | null
  sideDetail: 'self' | 'father' | 'mother' | null
  meal: 'yes' | 'no' | null
  shuttle: 'yes' | 'no' | null
  afterParty: 'yes' | 'no' | null
}

const ATTEND = {
  attending: { label: '참석', cls: 'bg-emerald-50 text-emerald-700' },
  pending: { label: '미정', cls: 'bg-amber-50 text-amber-700' },
  not_attending: { label: '불참', cls: 'bg-gray-100 text-gray-500' },
} as const

function sideLabel(side: string | null, detail: string | null): string | null {
  if (!side) return null
  const base = side === 'groom' ? '신랑측' : '신부측'
  const det = detail === 'father' ? ' 아버지' : detail === 'mother' ? ' 어머니' : ''
  return base + det
}
function fmtDateTime(s: string): string {
  const d = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.replace(/-/g, '.') : s
}

export default function RsvpBoard({ shareSlug }: { shareSlug?: string }) {
  const isShared = !!shareSlug
  const q = (p: Record<string, string>) => new URLSearchParams(shareSlug ? { ...p, share: shareSlug } : p).toString()

  const [state, setState] = useState<'loading' | 'ok' | 'auth' | 'password' | 'error'>('loading')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [items, setItems] = useState<RespItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [invFilter, setInvFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sideFilter, setSideFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [listLoading, setListLoading] = useState(false)

  // 공유(오너) / 비번(공유 대상)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const loadOverview = useCallback(async () => {
    const res = await fetch(`/api/rsvp/overview?${q({})}`)
    if (res.status === 401) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      setState(isShared || j.error === 'password_required' ? 'password' : 'auth')
      return false
    }
    if (!res.ok) {
      setState('error')
      return false
    }
    setOverview((await res.json()) as Overview)
    return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareSlug])

  const loadResponses = useCallback(
    async (opts: { page: number; invitation: string; status: string; side: string; q: string; append: boolean }) => {
      setListLoading(true)
      try {
        const res = await fetch(
          `/api/rsvp/responses?${q({ invitation: opts.invitation, status: opts.status, side: opts.side, q: opts.q, page: String(opts.page), pageSize: '30' })}`,
        )
        if (!res.ok) return
        const d = (await res.json()) as { items: RespItem[]; total: number; page: number }
        setItems((prev) => (opts.append ? [...prev, ...d.items] : d.items))
        setTotal(d.total)
        setPage(d.page)
      } finally {
        setListLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shareSlug],
  )

  const boot = useCallback(async () => {
    setState('loading')
    const ok = await loadOverview()
    if (ok) {
      await loadResponses({ page: 1, invitation: 'all', status: 'all', side: 'all', q: '', append: false })
      setState('ok')
    }
  }, [loadOverview, loadResponses])

  useEffect(() => {
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareSlug])

  // 필터 변경 시 목록 재조회(현재 상태와 병합)
  const reload = (next: Partial<{ inv: string; status: string; side: string; q: string }>) => {
    const inv = next.inv ?? invFilter
    const status = next.status ?? statusFilter
    const side = next.side ?? sideFilter
    const qStr = next.q ?? search
    setInvFilter(inv)
    setStatusFilter(status)
    setSideFilter(side)
    loadResponses({ page: 1, invitation: inv, status, side, q: qStr, append: false })
  }

  const submitPassword = async () => {
    if (!shareSlug || pw.length < 1) return
    setPwBusy(true)
    setPwErr('')
    try {
      const res = await fetch(`/api/rsvp/s/${shareSlug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !d.ok) {
        setPwErr(d.error || '비밀번호가 올바르지 않습니다.')
        return
      }
      setPw('')
      boot()
    } catch {
      setPwErr('확인에 실패했습니다.')
    } finally {
      setPwBusy(false)
    }
  }

  // ── 화면 ──
  if (state === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">불러오는 중…</div>
  }
  if (state === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-lg font-bold text-gray-900">로그인이 필요합니다</h1>
          <p className="text-sm text-gray-500 mt-1">내 청첩장들의 RSVP를 한곳에서 관리하세요.</p>
          <Link href="/login" className="mt-5 inline-block w-full rounded-lg bg-gray-900 text-white py-2.5 text-sm font-semibold">로그인</Link>
        </div>
      </div>
    )
  }
  if (state === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-lg font-bold text-gray-900">RSVP 현황</h1>
          <p className="text-sm text-gray-500 mt-1">비밀번호를 입력하면 참석 현황을 볼 수 있어요.</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitPassword()}
            placeholder="비밀번호"
            className="mt-5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-900"
          />
          {pwErr && <p className="text-sm text-red-500 mt-2">{pwErr}</p>}
          <button type="button" onClick={submitPassword} disabled={pwBusy || !pw} className="mt-4 w-full rounded-lg bg-gray-900 text-white py-2.5 text-sm font-semibold disabled:opacity-50">
            {pwBusy ? '확인 중…' : '입장'}
          </button>
        </div>
      </div>
    )
  }
  if (state === 'error' || !overview) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">불러오지 못했습니다.</div>
  }

  const t = overview.totals
  const hasMore = items.length < total

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">RSVP 현황</h1>
          {!isShared && <ShareButton />}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">청첩장 {t.invitations}개 · 응답 {t.total}건</p>

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {([
            ['참석', t.attending, 'text-emerald-600'],
            ['미정', t.pending, 'text-amber-600'],
            ['불참', t.notAttending, 'text-gray-400'],
          ] as const).map(([label, n, cls]) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 py-3 text-center">
              <div className={`text-2xl font-bold tabular-nums ${cls}`}>{n}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 bg-white rounded-xl border border-gray-100 py-2.5 text-center text-sm text-gray-600">
          예상 참석 인원 <b className="text-gray-900">{t.guests}명</b>
        </div>

        {/* 세부 통계 (있는 항목만) */}
        {(() => {
          const bd: string[] = []
          if (t.groomSide + t.brideSide > 0) bd.push(`신랑측 ${t.groomSide} · 신부측 ${t.brideSide}`)
          if (t.mealYes + t.mealNo > 0) bd.push(`식사 ${t.mealYes} · 안 함 ${t.mealNo}`)
          if (t.shuttleYes + t.shuttleNo > 0) bd.push(`셔틀 ${t.shuttleYes} · 미이용 ${t.shuttleNo}`)
          if (t.afterYes + t.afterNo > 0) bd.push(`애프터 ${t.afterYes} · 불참 ${t.afterNo}`)
          return bd.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {bd.map((x) => (
                <span key={x} className="text-[11px] text-gray-600 bg-gray-100 rounded-md px-2 py-1">{x}</span>
              ))}
            </div>
          ) : null
        })()}

        {/* 청첩장 필터 */}
        {overview.invitations.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-4 px-4">
            <Chip on={invFilter === 'all'} onClick={() => reload({ inv: 'all' })}>전체</Chip>
            {overview.invitations.map((inv) => (
              <Chip key={inv.id} on={invFilter === inv.id} onClick={() => reload({ inv: inv.id })}>
                {inv.name}
              </Chip>
            ))}
          </div>
        )}

        {/* 참석여부 필터 + 검색 */}
        <div className="flex gap-2 mt-3">
          {(['all', 'attending', 'pending', 'not_attending'] as const).map((s) => (
            <Chip key={s} small on={statusFilter === s} onClick={() => reload({ status: s })}>
              {s === 'all' ? '전체' : ATTEND[s].label}
            </Chip>
          ))}
        </div>
        {/* 신랑/신부측 필터 (측 데이터 있을 때만) */}
        {t.groomSide + t.brideSide > 0 && (
          <div className="flex gap-2 mt-2">
            {(['all', 'groom', 'bride'] as const).map((s) => (
              <Chip key={s} small on={sideFilter === s} onClick={() => reload({ side: s })}>
                {s === 'all' ? '전체' : s === 'groom' ? '신랑측' : '신부측'}
              </Chip>
            ))}
          </div>
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && reload({ q: search })}
          onBlur={() => reload({ q: search })}
          placeholder="이름 · 메시지 검색"
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm mt-3 focus:outline-none focus:border-gray-900"
        />

        {/* 응답 목록(카드) */}
        <div className="mt-4 space-y-2.5">
          {items.length === 0 && !listLoading && <p className="text-center text-sm text-gray-400 py-10">응답이 없습니다.</p>}
          {items.map((r) => {
            const sd = sideLabel(r.side, r.sideDetail)
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">{r.guestName}</span>
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 shrink-0 ${ATTEND[r.attendance].cls}`}>{ATTEND[r.attendance].label}</span>
                    {r.attendance === 'attending' && r.guestCount > 0 && <span className="text-xs text-gray-500 shrink-0">{r.guestCount}명</span>}
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">{fmtDateTime(r.createdAt)}</span>
                </div>
                {r.guestPhone && <div className="text-xs text-gray-500 mt-1 tabular-nums">{r.guestPhone}</div>}
                {r.message && <div className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap">{r.message}</div>}
                {/* 옵션 배지 + 어느 청첩장에서 왔는지(항상 표시) */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {sd && <span className="text-[11px] text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">{sd}</span>}
                  {r.meal === 'yes' && <span className="text-[11px] text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">식사</span>}
                  {r.shuttle === 'yes' && <span className="text-[11px] text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">셔틀</span>}
                  {r.afterParty === 'yes' && <span className="text-[11px] text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">애프터</span>}
                  <span className="text-[11px] text-gray-400 ml-auto truncate max-w-[55%]">{r.invitationName}</span>
                </div>
              </div>
            )
          })}
          {listLoading && <p className="text-center text-sm text-gray-400 py-4">불러오는 중…</p>}
        </div>

        {/* 더 보기 */}
        {hasMore && !listLoading && (
          <button
            type="button"
            onClick={() => loadResponses({ page: page + 1, invitation: invFilter, status: statusFilter, side: sideFilter, q: search, append: true })}
            className="w-full mt-4 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700"
          >
            더 보기 ({items.length}/{total})
          </button>
        )}

        {/* CSV(오너만) */}
        {!isShared && total > 0 && (
          <a href="/api/rsvp/export?scope=all" className="block text-center mt-6 text-sm text-gray-500 underline">
            전체 CSV 내보내기
          </a>
        )}
      </div>
    </div>
  )
}

function Chip({ children, on, onClick, small }: { children: React.ReactNode; on: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full font-semibold whitespace-nowrap ${small ? 'text-xs px-3 py-1.5' : 'text-[13px] px-3.5 py-1.5'} ${on ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
    >
      {children}
    </button>
  )
}

/** 오너 전용 — 공유 링크/비밀번호 설정 모달 */
function ShareButton() {
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)
  const [hasPassword, setHasPassword] = useState(false)
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const load = async () => {
    const res = await fetch('/api/rsvp/share')
    if (res.ok) {
      const d = (await res.json()) as { shareSlug: string | null; hasPassword: boolean }
      setSlug(d.shareSlug)
      setHasPassword(d.hasPassword)
    }
  }
  const openModal = async () => {
    setOpen(true)
    await load()
  }
  const patch = async (body: Record<string, unknown>, okMsg: string) => {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/rsvp/share', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = (await res.json()) as { shareSlug: string | null; hasPassword: boolean; error?: string }
      if (!res.ok) {
        setMsg(d.error || '저장 실패')
        return
      }
      setSlug(d.shareSlug)
      setHasPassword(d.hasPassword)
      setPw('')
      setMsg(okMsg)
      setTimeout(() => setMsg(''), 2000)
    } finally {
      setBusy(false)
    }
  }

  const shareUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/rsvp/s/${slug}` : ''

  return (
    <>
      <button type="button" onClick={openModal} className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700">공유</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">RSVP 공유</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 text-xl leading-none">✕</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">이 링크로 다른 사람도 참석 현황을 볼 수 있어요.</p>

            {!slug ? (
              <button type="button" onClick={() => patch({ enable: true }, '링크를 만들었어요')} disabled={busy} className="mt-4 w-full rounded-lg bg-gray-900 text-white py-2.5 text-sm font-semibold disabled:opacity-50">
                공유 링크 만들기
              </button>
            ) : (
              <>
                <div className="mt-4">
                  <label className="text-xs font-medium text-gray-600">공유 링크</label>
                  <div className="flex gap-2 mt-1">
                    <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600" />
                    <button type="button" onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="text-xs rounded-lg border border-gray-300 px-3 py-2 shrink-0">
                      {copied ? '복사됨' : '복사'}
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-gray-600">비밀번호 {hasPassword ? '(설정됨)' : '(없음 · 링크만 알면 열람)'}</label>
                  <div className="flex gap-2 mt-1">
                    <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={hasPassword ? '새 비밀번호(변경 시)' : '비밀번호(4자 이상)'} className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    <button type="button" onClick={() => patch({ password: pw }, hasPassword ? '변경했어요' : '설정했어요')} disabled={busy || pw.length < 4} className="text-sm rounded-lg bg-gray-900 text-white px-3 py-2 shrink-0 disabled:opacity-40">
                      {hasPassword ? '변경' : '설정'}
                    </button>
                  </div>
                  {hasPassword && (
                    <button type="button" onClick={() => patch({ removePassword: true }, '비밀번호를 해제했어요')} disabled={busy} className="text-xs text-gray-500 underline mt-2">
                      비밀번호 해제
                    </button>
                  )}
                </div>
              </>
            )}
            {msg && <p className="text-xs text-emerald-600 mt-3">{msg}</p>}
          </div>
        </div>
      )}
    </>
  )
}
