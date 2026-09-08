'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface InvSummary {
  id: string
  name: string
  typeLabel: string // 청첩장 유형(템플릿) 라벨
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

// 통합 RSVP 페이지는 무조건 프리텐다드 (fonts.css의 Pretendard Variable → globals.css의 Pretendard 순)
const PRETENDARD = "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif"

const ATTEND = {
  attending: { label: '참석', dot: 'bg-slate-600', soft: 'bg-slate-100 text-slate-700' },
  pending: { label: '미정', dot: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700' },
  not_attending: { label: '불참', dot: 'bg-gray-300 ring-1 ring-inset ring-gray-300', soft: 'bg-gray-100 text-gray-500' },
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
  const [mealFilter, setMealFilter] = useState('all')
  const [shuttleFilter, setShuttleFilter] = useState('all')
  const [afterFilter, setAfterFilter] = useState('all')
  const [optOpen, setOptOpen] = useState(false) // RSVP 옵션 필터 펼침
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
    async (opts: { page: number; invitation: string; status: string; side: string; meal: string; shuttle: string; afterParty: string; q: string; append: boolean }) => {
      setListLoading(true)
      try {
        const params: Record<string, string> = { invitation: opts.invitation, status: opts.status, side: opts.side, q: opts.q, page: String(opts.page), pageSize: '30' }
        if (opts.meal !== 'all') params.meal = opts.meal
        if (opts.shuttle !== 'all') params.shuttle = opts.shuttle
        if (opts.afterParty !== 'all') params.afterParty = opts.afterParty
        const res = await fetch(`/api/rsvp/responses?${q(params)}`)
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
      await loadResponses({ page: 1, invitation: 'all', status: 'all', side: 'all', meal: 'all', shuttle: 'all', afterParty: 'all', q: '', append: false })
      setState('ok')
    }
  }, [loadOverview, loadResponses])

  useEffect(() => {
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareSlug])

  // 필터 변경 시 목록 재조회(현재 상태와 병합)
  const reload = (next: Partial<{ inv: string; status: string; side: string; meal: string; shuttle: string; afterParty: string; q: string }>) => {
    const inv = next.inv ?? invFilter
    const status = next.status ?? statusFilter
    const side = next.side ?? sideFilter
    const meal = next.meal ?? mealFilter
    const shuttle = next.shuttle ?? shuttleFilter
    const afterParty = next.afterParty ?? afterFilter
    const qStr = next.q ?? search
    setInvFilter(inv)
    setStatusFilter(status)
    setSideFilter(side)
    setMealFilter(meal)
    setShuttleFilter(shuttle)
    setAfterFilter(afterParty)
    loadResponses({ page: 1, invitation: inv, status, side, meal, shuttle, afterParty, q: qStr, append: false })
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
    return <div style={{ fontFamily: PRETENDARD }} className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">불러오는 중…</div>
  }
  if (state === 'auth') {
    return (
      <div style={{ fontFamily: PRETENDARD }} className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-400">RSVP</div>
          <h1 className="text-lg font-bold text-gray-900 mt-2">로그인이 필요합니다</h1>
          <p className="text-sm text-gray-500 mt-1">내 청첩장들의 RSVP를 한곳에서 관리하세요.</p>
          <Link href="/login" className="mt-5 inline-block w-full rounded-xl bg-slate-700 text-white py-2.5 text-sm font-semibold hover:bg-slate-800">로그인</Link>
        </div>
      </div>
    )
  }
  if (state === 'password') {
    return (
      <div style={{ fontFamily: PRETENDARD }} className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-400">RSVP</div>
          <h1 className="text-lg font-bold text-gray-900 mt-2">참석 현황</h1>
          <p className="text-sm text-gray-500 mt-1">비밀번호를 입력하면 참석 현황을 볼 수 있어요.</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitPassword()}
            placeholder="비밀번호"
            className="mt-5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-500"
          />
          {pwErr && <p className="text-sm text-red-500 mt-2">{pwErr}</p>}
          <button type="button" onClick={submitPassword} disabled={pwBusy || !pw} className="mt-4 w-full rounded-xl bg-slate-700 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
            {pwBusy ? '확인 중…' : '입장'}
          </button>
        </div>
      </div>
    )
  }
  if (state === 'error' || !overview) {
    return <div style={{ fontFamily: PRETENDARD }} className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">불러오지 못했습니다.</div>
  }

  const t = overview.totals
  const hasMore = items.length < total
  const hasSide = t.groomSide + t.brideSide > 0
  const hasSub = hasSide || t.mealYes + t.mealNo > 0 || t.shuttleYes + t.shuttleNo > 0 || t.afterYes + t.afterNo > 0

  return (
    <div style={{ fontFamily: PRETENDARD }} className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* 헤더 */}
        <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-400">RSVP</div>
        <div className="flex items-end justify-between mt-1.5">
          <h1 className="text-2xl font-medium text-gray-900" style={{ fontFamily: 'Isamanru, sans-serif' }}>참석 현황</h1>
          {!isShared && <ShareButton />}
        </div>
        <p className="text-xs text-gray-500 mt-2">청첩장 {t.invitations}개 · 응답 {t.total}건</p>

        {/* 요약 (간결) */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500 font-medium">예상 참석 인원</span>
            {!isShared && total > 0 && (
              <a href="/api/rsvp/export?scope=all" className="text-[13px] font-semibold text-gray-500 underline underline-offset-2 decoration-gray-300">CSV 내보내기</a>
            )}
          </div>
          <div className="text-[44px] leading-none font-bold text-gray-900 tabular-nums mt-1.5 tracking-tight">
            {t.guests}
            <span className="text-base font-medium text-gray-500 ml-1">명</span>
          </div>
          <div className="text-xs text-gray-400 mt-2">전체 응답 {t.total}건</div>

          {/* 참석 / 미정 / 불참 */}
          <div className="flex mt-4 pt-4 border-t border-gray-100">
            {([
              ['참석', t.attending, 'text-gray-900'],
              ['미정', t.pending, 'text-gray-900'],
              ['불참', t.notAttending, 'text-gray-400'],
            ] as const).map(([label, n, cls], i) => (
              <div key={label} className={`flex-1 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                <div className={`text-2xl font-bold tabular-nums ${cls}`}>{n}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 세부 통계 (보조) — 신랑측·신부측은 색 구분 */}
        {hasSub && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 px-1 text-[13px] text-gray-500">
            {hasSide && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />신랑측 <b className="font-bold text-gray-900 tabular-nums">{t.groomSide}</b></span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />신부측 <b className="font-bold text-gray-900 tabular-nums">{t.brideSide}</b></span>
              </>
            )}
            {t.mealYes + t.mealNo > 0 && <span>식사 <b className="font-bold text-gray-900 tabular-nums">{t.mealYes}</b></span>}
            {t.shuttleYes + t.shuttleNo > 0 && <span>셔틀 <b className="font-bold text-gray-900 tabular-nums">{t.shuttleYes}</b></span>}
            {t.afterYes + t.afterNo > 0 && <span>애프터 <b className="font-bold text-gray-900 tabular-nums">{t.afterYes}</b></span>}
          </div>
        )}

        {/* 청첩장 필터 (언더라인 탭) */}
        {overview.invitations.length > 1 && (
          <div className="flex mt-6 border-b border-gray-100 overflow-x-auto -mx-4 px-4">
            <Tab on={invFilter === 'all'} onClick={() => reload({ inv: 'all' })}>전체</Tab>
            {overview.invitations.map((inv) => (
              <Tab key={inv.id} on={invFilter === inv.id} onClick={() => reload({ inv: inv.id })}>
                {inv.typeLabel}
              </Tab>
            ))}
          </div>
        )}

        {/* 참석여부 (세그먼트) */}
        <div className="mt-4">
          <Segment
            options={[['all', '전체'], ['attending', '참석'], ['pending', '미정'], ['not_attending', '불참']]}
            value={statusFilter}
            onChange={(v) => reload({ status: v })}
          />
        </div>
        {/* 신랑/신부측 (측 데이터 있을 때만) */}
        {t.groomSide + t.brideSide > 0 && (
          <div className="mt-2">
            <Segment
              options={[['all', '전체'], ['groom', '신랑측'], ['bride', '신부측']]}
              value={sideFilter}
              onChange={(v) => reload({ side: v })}
            />
          </div>
        )}

        {/* RSVP 옵션 필터 (식사·셔틀·애프터) — 접이식, 데이터 있을 때만 */}
        {(t.mealYes + t.mealNo > 0 || t.shuttleYes + t.shuttleNo > 0 || t.afterYes + t.afterNo > 0) && (() => {
          const optActive = [mealFilter, shuttleFilter, afterFilter].filter((v) => v !== 'all').length
          return (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setOptOpen((o) => !o)}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 py-1 hover:text-gray-700"
              >
                옵션 필터
                {optActive > 0 && <span className="text-[11px] font-bold text-slate-700 bg-slate-100 rounded-full px-1.5 tabular-nums">{optActive}</span>}
                <svg className={`transition-transform ${optOpen ? 'rotate-180' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {optOpen && (
                <div className="mt-2 flex flex-col gap-2.5 rounded-xl bg-gray-50 p-3">
                  {t.mealYes + t.mealNo > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-gray-600">식사</span>
                      <Segment options={[['all', '전체'], ['yes', '신청'], ['no', '미신청']]} value={mealFilter} onChange={(v) => reload({ meal: v })} />
                    </div>
                  )}
                  {t.shuttleYes + t.shuttleNo > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-gray-600">셔틀버스</span>
                      <Segment options={[['all', '전체'], ['yes', '신청'], ['no', '미신청']]} value={shuttleFilter} onChange={(v) => reload({ shuttle: v })} />
                    </div>
                  )}
                  {t.afterYes + t.afterNo > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-gray-600">애프터파티</span>
                      <Segment options={[['all', '전체'], ['yes', '신청'], ['no', '미신청']]} value={afterFilter} onChange={(v) => reload({ afterParty: v })} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* 검색 */}
        <div className="relative mt-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && reload({ q: search })}
            onBlur={() => reload({ q: search })}
            placeholder="이름 · 메시지 검색"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-slate-500"
          />
        </div>

        {/* 응답 원장(ledger) */}
        <div className="mt-3">
          {items.length === 0 && !listLoading && <p className="text-center text-sm text-gray-400 py-10">응답이 없습니다.</p>}
          {items.map((r) => {
            const sd = sideLabel(r.side, r.sideDetail)
            const hasTags = sd || r.meal === 'yes' || r.shuttle === 'yes' || r.afterParty === 'yes'
            return (
              <div key={r.id} className="grid grid-cols-[8px_1fr_auto] gap-x-3 py-4 border-b border-gray-100">
                <span className={`w-2 h-2 rounded-full mt-1.5 ${r.side === 'bride' ? 'bg-rose-400' : r.side === 'groom' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-gray-900">{r.guestName}</span>
                    {r.attendance === 'attending' ? (
                      r.guestCount > 0 && <span className="text-xs font-semibold text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 tabular-nums">{r.guestCount}명</span>
                    ) : (
                      <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${ATTEND[r.attendance].soft}`}>{ATTEND[r.attendance].label}</span>
                    )}
                  </div>
                  {r.guestPhone && <div className="text-xs text-gray-400 mt-1 tabular-nums">{r.guestPhone}</div>}
                  {r.message && <div className="text-[13px] text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">{r.message}</div>}
                  {hasTags && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {sd && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded px-1.5 py-0.5 border ${r.side === 'bride' ? 'text-rose-600 border-rose-200' : 'text-blue-700 border-blue-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.side === 'bride' ? 'bg-rose-400' : 'bg-blue-500'}`} />
                          {sd}
                        </span>
                      )}
                      {r.meal === 'yes' && <span className="text-[11px] font-semibold text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">식사</span>}
                      {r.shuttle === 'yes' && <span className="text-[11px] font-semibold text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">셔틀</span>}
                      {r.afterParty === 'yes' && <span className="text-[11px] font-semibold text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">애프터</span>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-400 tabular-nums whitespace-nowrap">{fmtDateTime(r.createdAt)}</div>
                  <div className="text-[11px] text-gray-400 mt-2 truncate max-w-[110px] ml-auto">
                    from <b className="font-semibold text-gray-500">{r.invitationName}</b>
                  </div>
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
            onClick={() => loadResponses({ page: page + 1, invitation: invFilter, status: statusFilter, side: sideFilter, meal: mealFilter, shuttle: shuttleFilter, afterParty: afterFilter, q: search, append: true })}
            className="w-full mt-5 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 hover:border-gray-400"
          >
            더 보기 ({items.length}/{total})
          </button>
        )}
      </div>
    </div>
  )
}

/** 언더라인 탭 — 청첩장 유형 필터 */
function Tab({ children, on, onClick }: { children: React.ReactNode; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 text-[13.5px] font-semibold whitespace-nowrap px-1 py-2.5 mr-5 border-b-2 -mb-px transition-colors ${on ? 'text-gray-900 border-slate-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
    >
      {children}
    </button>
  )
}

/** 세그먼트 컨트롤 — 참석여부 / 신랑·신부측 필터 */
function Segment({ options, value, onChange }: { options: readonly (readonly [string, string])[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors ${value === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {label}
        </button>
      ))}
    </div>
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
      <button type="button" onClick={openModal} className="inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-gray-700 hover:border-gray-400">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
        공유
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">RSVP 공유</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 text-xl leading-none">✕</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">이 링크로 다른 사람도 참석 현황을 볼 수 있어요.</p>

            {!slug ? (
              <button type="button" onClick={() => patch({ enable: true }, '링크를 만들었어요')} disabled={busy} className="mt-4 w-full rounded-lg bg-slate-700 text-white py-2.5 text-sm font-semibold disabled:opacity-50">
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
                    <button type="button" onClick={() => patch({ password: pw }, hasPassword ? '변경했어요' : '설정했어요')} disabled={busy || pw.length < 4} className="text-sm rounded-lg bg-slate-700 text-white px-3 py-2 shrink-0 disabled:opacity-40">
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
