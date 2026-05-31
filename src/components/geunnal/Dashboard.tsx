'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Image, MessageCircle, Users, CalendarDays, MapPin, ChevronRight, X, Download, UserCheck, UserX, Clock } from 'lucide-react'
import { GeunnalEvent, GeunnalSubmission } from '@/types/geunnal'
import GeunnalBadge from './Badge'
import GeunnalCard from './Card'
import BlobAvatar from './BlobAvatar'
import { geunnalFetch, SessionExpiredError } from '@/lib/geunnalFetch'

interface RSVPResponseData {
  id: string
  invitation_id: string
  guest_name: string
  guest_phone: string | null
  attendance: 'attending' | 'not_attending' | 'pending'
  guest_count: number
  message: string | null
  side: 'groom' | 'bride' | null
  side_detail: 'self' | 'father' | 'mother' | null
  meal_attendance: 'yes' | 'no' | null
  shuttle_bus: 'yes' | 'no' | null
  created_at: string
}

interface RSVPSummaryData {
  total: number
  attending: number
  notAttending: number
  pending: number
  totalGuests: number
  groomSide: number
  brideSide: number
  groomSideGuests: number
  brideSideGuests: number
  mealYes: number
  mealNo: number
  shuttleYes: number
  shuttleNo: number
}

interface DashboardProps {
  pageId: string
  token: string
  invitationId?: string | null
  onEventClick?: (eventId: string) => void
  onSessionExpired?: () => void
}

type Tab = 'events' | 'photos' | 'messages' | 'guests'
type SideFilter = 'all' | 'groom' | 'bride' | 'both'

const SIDE_TABS: { value: SideFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'groom', label: '신랑측' },
  { value: 'bride', label: '신부측' },
  { value: 'both', label: '공동' },
]

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr === 'TBD') return '미정'
  const date = new Date(dateStr)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayNames[date.getDay()]})`
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return formatDate(dateStr)
}

export default function Dashboard({ pageId, token, invitationId, onEventClick, onSessionExpired }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('events')
  const [sideFilter, setSideFilter] = useState<SideFilter>('all')
  const [events, setEvents] = useState<GeunnalEvent[]>([])
  const [submissions, setSubmissions] = useState<GeunnalSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const opts = { token, pageId }
        // Fetch events
        const eventsRes = await geunnalFetch(`/api/geunnal/events?pageId=${pageId}`, opts, onSessionExpired)
        if (eventsRes.ok) {
          const data = (await eventsRes.json()) as { events: GeunnalEvent[] }
          setEvents(data.events)

          // Fetch submissions for each event
          const allSubmissions: GeunnalSubmission[] = []
          for (const event of data.events) {
            try {
              const subRes = await geunnalFetch(`/api/geunnal/submissions?eventId=${event.id}`, opts, onSessionExpired)
              if (subRes.ok) {
                const subData = (await subRes.json()) as { submissions: GeunnalSubmission[] }
                allSubmissions.push(...subData.submissions)
              }
            } catch (err) {
              if (err instanceof SessionExpiredError) throw err
              /* skip */
            }
          }
          setSubmissions(allSubmissions)
        }
      } catch (error) {
        if (error instanceof SessionExpiredError) return
        console.error('Dashboard fetch error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [pageId, token, onSessionExpired])

  // Only show completed events (cost entered)
  const completedEvents = useMemo(() =>
    events.filter(e => e.total_cost && e.total_cost > 0),
    [events]
  )
  const completedEventIds = useMemo(() =>
    new Set(completedEvents.map(e => e.id)),
    [completedEvents]
  )
  const completedSubmissions = useMemo(() =>
    submissions.filter(s => completedEventIds.has(s.event_id)),
    [submissions, completedEventIds]
  )

  const filteredEvents = useMemo(() =>
    sideFilter === 'all' ? completedEvents : completedEvents.filter(e => e.side === sideFilter),
    [completedEvents, sideFilter]
  )
  const filteredEventIds = useMemo(() =>
    new Set(filteredEvents.map(e => e.id)),
    [filteredEvents]
  )
  const filteredSubmissions = useMemo(() =>
    completedSubmissions.filter(s => filteredEventIds.has(s.event_id)),
    [completedSubmissions, filteredEventIds]
  )

  const totalGuests = filteredEvents.reduce((sum, e) => sum + (e.expected_guests || 0), 0)
  const totalPhotos = filteredSubmissions.filter(s => s.photo_url).length
  const totalMessages = filteredSubmissions.filter(s => s.message).length

  // Side counts for tab badges
  const sideCounts = useMemo(() => ({
    all: completedEvents.length,
    groom: completedEvents.filter(e => e.side === 'groom').length,
    bride: completedEvents.filter(e => e.side === 'bride').length,
    both: completedEvents.filter(e => e.side === 'both').length,
  }), [completedEvents])

  const stats = [
    { label: '모임', value: filteredEvents.length, bg: 'bg-[#EDE9FA]' },
    { label: '참석자', value: totalGuests, bg: 'bg-[#FAE9F0]' },
    { label: '사진', value: totalPhotos, bg: 'bg-[#EDE9FA]' },
    { label: '메시지', value: totalMessages, bg: 'bg-[#FAE9F0]' },
  ]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'events', label: '모임별 보기' },
    { key: 'photos', label: '모든 사진' },
    { key: 'messages', label: '모든 메시지' },
    ...(invitationId ? [{ key: 'guests' as Tab, label: '참석현황' }] : []),
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7FD] flex items-center justify-center">
        <div className="text-[#9B8CC4]">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="px-5 pb-20 flex flex-col gap-5">
      {/* Header */}
      <header className="flex items-start justify-between pt-5 pb-5 -mx-5 px-5 border-b border-[#E8E4F0]">
        <div>
          <h1 className="text-xl font-medium text-[#2A2240]" style={{ fontFamily: 'Isamanru, sans-serif' }}>
            데이드로어
          </h1>
          <p className="text-[13px] text-[#5A5270] mt-0.5">청첩장 모임 관리</p>
        </div>
      </header>

      {/* Side Tabs - only show for non-guests tabs */}
      {activeTab !== 'guests' && (
        <div className="flex gap-1 bg-[#F9F7FD] rounded-xl p-1">
          {SIDE_TABS.map(({ value, label }) => {
            const count = sideCounts[value]
            return (
              <button
                key={value}
                onClick={() => setSideFilter(value)}
                className={`flex-1 py-2 text-[12px] font-medium rounded-lg transition-all ${
                  sideFilter === value
                    ? 'bg-white text-[#8B75D0] shadow-sm'
                    : 'text-[#9B8CC4] hover:text-[#5A5270]'
                }`}
              >
                {label}{count > 0 ? ` ${count}` : ''}
              </button>
            )
          })}
        </div>
      )}

      {/* Stats Grid - only show for non-guests tabs */}
      {activeTab !== 'guests' && (
        <div className="grid grid-cols-4 gap-2">
          {stats.map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-3 text-center`}>
              <p className="text-xl font-medium text-[#2A2240]">{stat.value}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#E8E4F0]">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-[13px] font-medium relative transition-colors ${
              activeTab === tab.key ? 'text-[#8B75D0]' : 'text-[#9B8CC4]'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full bg-[#8B75D0]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && <EventsTab events={filteredEvents} submissions={filteredSubmissions} onEventClick={onEventClick} />}
      {activeTab === 'photos' && <PhotosTab events={filteredEvents} submissions={filteredSubmissions} />}
      {activeTab === 'messages' && <MessagesTab events={filteredEvents} submissions={filteredSubmissions} />}
      {activeTab === 'guests' && invitationId && (
        <GuestsTab pageId={pageId} token={token} onSessionExpired={onSessionExpired} />
      )}
    </div>
  )
}

/* ─── Guests Tab ─── */
function GuestsTab({ pageId, token, onSessionExpired }: {
  pageId: string
  token: string
  onSessionExpired?: () => void
}) {
  const [rsvpData, setRsvpData] = useState<RSVPResponseData[]>([])
  const [rsvpSummary, setRsvpSummary] = useState<RSVPSummaryData | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterSides, setFilterSides] = useState<Set<string>>(new Set())
  const [filterMeal, setFilterMeal] = useState<string | null>(null)
  const [filterShuttle, setFilterShuttle] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newResponseToast, setNewResponseToast] = useState<string | null>(null)
  const prevCountRef = useRef<number | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRsvpData = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setRsvpLoading(true)
      const opts = { token, pageId }
      const res = await geunnalFetch(`/api/geunnal/rsvp?pageId=${pageId}`, opts, onSessionExpired)
      if (res.ok) {
        const json = (await res.json()) as { data: RSVPResponseData[]; summary: RSVPSummaryData | null }
        const newCount = json.data.length
        if (isPolling && prevCountRef.current !== null && newCount > prevCountRef.current) {
          const diff = newCount - prevCountRef.current
          setNewResponseToast(`새로운 응답 ${diff}건이 접수되었습니다`)
          setTimeout(() => setNewResponseToast(null), 3000)
        }
        prevCountRef.current = newCount
        setRsvpData(json.data)
        setRsvpSummary(json.summary)
      }
    } catch (error) {
      if (error instanceof SessionExpiredError) return
      console.error('RSVP fetch error:', error)
    } finally {
      if (!isPolling) setRsvpLoading(false)
    }
  }, [pageId, token, onSessionExpired])

  useEffect(() => { fetchRsvpData() }, [fetchRsvpData])

  // 30s polling with visibility check
  useEffect(() => {
    const startPolling = () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        if (!document.hidden) fetchRsvpData(true)
      }, 30000)
    }
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchRsvpData(true)
        startPolling()
      } else if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    startPolling()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchRsvpData])

  // Side filter helpers (with side_detail support)
  const getSideFilterKey = (side: string | null, sideDetail: string | null): string => {
    if (!side) return 'none'
    if (sideDetail) return `${side}_${sideDetail}`
    return side
  }
  const getSideFilterLabel = (key: string): string => {
    switch (key) {
      case 'groom': return '신랑측'
      case 'bride': return '신부측'
      case 'groom_self': return '신랑'
      case 'groom_father': return '신랑 아버지'
      case 'groom_mother': return '신랑 어머니'
      case 'bride_self': return '신부'
      case 'bride_father': return '신부 아버지'
      case 'bride_mother': return '신부 어머니'
      case 'none': return '미지정'
      default: return key
    }
  }
  const toggleSideFilter = (value: string) => {
    setFilterSides(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  // Side filter counts
  const sideFilterCounts: Record<string, number> = {}
  rsvpData.forEach(r => {
    const key = getSideFilterKey(r.side, r.side_detail)
    sideFilterCounts[key] = (sideFilterCounts[key] || 0) + 1
  })
  const sideFilterOrder = ['groom', 'groom_self', 'groom_father', 'groom_mother', 'bride', 'bride_self', 'bride_father', 'bride_mother', 'none']

  const hasActiveFilters = filterStatus !== null || filterSides.size > 0 || filterMeal !== null || filterShuttle !== null || searchQuery !== ''
  const resetFilters = () => {
    setFilterStatus(null)
    setFilterSides(new Set())
    setFilterMeal(null)
    setFilterShuttle(null)
    setSearchQuery('')
  }

  const filteredData = useMemo(() => {
    return rsvpData.filter(r => {
      if (filterStatus !== null && r.attendance !== filterStatus) return false
      if (filterSides.size > 0) {
        const sideKey = getSideFilterKey(r.side, r.side_detail)
        if (!filterSides.has(sideKey)) return false
      }
      if (filterMeal !== null && r.meal_attendance !== filterMeal) return false
      if (filterShuttle !== null && r.shuttle_bus !== filterShuttle) return false
      if (searchQuery && !r.guest_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [rsvpData, filterStatus, filterSides, filterMeal, filterShuttle, searchQuery])

  const getSideWithDetail = (side: string | null, sideDetail: string | null) => {
    const sideLabel = side === 'groom' ? '신랑측' : side === 'bride' ? '신부측' : ''
    const detailLabel = sideDetail === 'father' ? '아버지' : sideDetail === 'mother' ? '어머니' : ''
    if (sideLabel && detailLabel) return `${sideLabel} (${detailLabel})`
    return sideLabel
  }

  if (rsvpLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#9B8CC4]">참석현황 로딩 중...</div>
      </div>
    )
  }

  const s = rsvpSummary

  return (
    <div className="flex flex-col gap-4">
      {/* Stats Cards */}
      {s && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#EDE9FA] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.total}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">총 응답</p>
            </div>
            <div className="bg-[#FAE9F0] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.attending}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">참석</p>
            </div>
            <div className="bg-[#EDE9FA] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.notAttending}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">불참</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#FAE9F0] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.totalGuests}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">참석 인원</p>
            </div>
            <div className="bg-[#EDE9FA] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.mealYes}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">식사</p>
            </div>
            <div className="bg-[#FAE9F0] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.shuttleYes}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">버스</p>
            </div>
            <div className="bg-[#EDE9FA] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.pending}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">미정</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#EDE9FA] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.groomSideGuests}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">신랑측 참석</p>
              <p className="text-[10px] text-[#C5BAE8] mt-0.5">응답 {s.groomSide}건</p>
            </div>
            <div className="bg-[#FAE9F0] rounded-2xl p-3 text-center">
              <p className="text-xl font-medium text-[#2A2240]">{s.brideSideGuests}</p>
              <p className="text-[11px] text-[#9B8CC4] mt-0.5">신부측 참석</p>
              <p className="text-[10px] text-[#E8B4C0] mt-0.5">응답 {s.brideSide}건</p>
            </div>
          </div>
        </>
      )}

      {/* Search + Reset */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8CC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="이름 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#E8E4F0] text-[13px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0]"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-[11px] text-[#9B8CC4] underline underline-offset-2">
              초기화
            </button>
          )}
          <span className="text-[11px] text-[#C5BAE8] tabular-nums">{filteredData.length}건</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-col gap-1.5">
        {/* Attendance */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-8 text-[10px] font-medium text-[#9B8CC4] shrink-0">참석</span>
          <RsvpFilterChip label="참석" count={s?.attending ?? 0} isActive={filterStatus === 'attending'} activeStyle="bg-[#EDE9FA] text-[#8B75D0] border-[#C5BAE8]" onClick={() => setFilterStatus(prev => prev === 'attending' ? null : 'attending')} />
          <RsvpFilterChip label="불참" count={s?.notAttending ?? 0} isActive={filterStatus === 'not_attending'} activeStyle="bg-[#FAE9F0] text-[#D4899A] border-[#E8B4C0]" onClick={() => setFilterStatus(prev => prev === 'not_attending' ? null : 'not_attending')} />
          <RsvpFilterChip label="미정" count={s?.pending ?? 0} isActive={filterStatus === 'pending'} activeStyle="bg-[#EDE9FA] text-[#B87AAB] border-[#D4B0CC]" onClick={() => setFilterStatus(prev => prev === 'pending' ? null : 'pending')} />
        </div>
        {/* Side (with side_detail) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-8 text-[10px] font-medium text-[#9B8CC4] shrink-0">소속</span>
          {sideFilterOrder
            .filter(key => (sideFilterCounts[key] || 0) > 0)
            .map(key => (
              <RsvpFilterChip
                key={key}
                label={getSideFilterLabel(key)}
                count={sideFilterCounts[key]}
                isActive={filterSides.has(key)}
                activeStyle={key.startsWith('groom') ? 'bg-[#EDE9FA] text-[#8B75D0] border-[#C5BAE8]' : key.startsWith('bride') ? 'bg-[#FAE9F0] text-[#D4899A] border-[#E8B4C0]' : 'bg-[#F9F7FD] text-[#9B8CC4] border-[#E8E4F0]'}
                onClick={() => toggleSideFilter(key)}
              />
            ))
          }
        </div>
        {/* Meal */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-8 text-[10px] font-medium text-[#9B8CC4] shrink-0">식사</span>
          <RsvpFilterChip label="식사" count={s?.mealYes ?? 0} isActive={filterMeal === 'yes'} activeStyle="bg-[#EDE9FA] text-[#8B75D0] border-[#C5BAE8]" onClick={() => setFilterMeal(prev => prev === 'yes' ? null : 'yes')} />
          <RsvpFilterChip label="안함" count={s?.mealNo ?? 0} isActive={filterMeal === 'no'} activeStyle="bg-[#F9F7FD] text-[#9B8CC4] border-[#E8E4F0]" onClick={() => setFilterMeal(prev => prev === 'no' ? null : 'no')} />
        </div>
        {/* Shuttle Bus */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-8 text-[10px] font-medium text-[#9B8CC4] shrink-0">버스</span>
          <RsvpFilterChip label="이용" count={s?.shuttleYes ?? 0} isActive={filterShuttle === 'yes'} activeStyle="bg-[#FAE9F0] text-[#D4899A] border-[#E8B4C0]" onClick={() => setFilterShuttle(prev => prev === 'yes' ? null : 'yes')} />
          <RsvpFilterChip label="미이용" count={s?.shuttleNo ?? 0} isActive={filterShuttle === 'no'} activeStyle="bg-[#F9F7FD] text-[#9B8CC4] border-[#E8E4F0]" onClick={() => setFilterShuttle(prev => prev === 'no' ? null : 'no')} />
        </div>
      </div>

      {/* Response List */}
      <div className="flex flex-col gap-2">
        {filteredData.map(rsvp => (
          <GeunnalCard key={rsvp.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[14px] font-medium text-[#2A2240] truncate">{rsvp.guest_name}</p>
                {rsvp.side && (
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    rsvp.side === 'groom' ? 'bg-[#EDE9FA] text-[#8B75D0]' : 'bg-[#FAE9F0] text-[#D4899A]'
                  }`}>
                    {rsvp.side_detail
                      ? getSideWithDetail(rsvp.side, rsvp.side_detail).replace('신랑측 ', '').replace('신부측 ', '')
                      : rsvp.side === 'groom' ? '신랑' : '신부'
                    }
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <AttendanceBadge attendance={rsvp.attendance} />
                {rsvp.attendance === 'attending' && rsvp.guest_count > 1 && (
                  <span className="text-[12px] text-[#9B8CC4] flex items-center gap-0.5">
                    <Users size={12} strokeWidth={1.5} />
                    {rsvp.guest_count}
                  </span>
                )}
              </div>
            </div>
            {/* Meal / Bus badges */}
            {rsvp.attendance === 'attending' && (rsvp.meal_attendance || rsvp.shuttle_bus) && (
              <div className="flex items-center gap-1.5">
                {rsvp.meal_attendance && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    rsvp.meal_attendance === 'yes' ? 'bg-[#EDE9FA] text-[#8B75D0]' : 'bg-[#F9F7FD] text-[#C5BAE8]'
                  }`}>
                    {rsvp.meal_attendance === 'yes' ? '식사' : '식사안함'}
                  </span>
                )}
                {rsvp.shuttle_bus && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    rsvp.shuttle_bus === 'yes' ? 'bg-[#FAE9F0] text-[#D4899A]' : 'bg-[#F9F7FD] text-[#C5BAE8]'
                  }`}>
                    {rsvp.shuttle_bus === 'yes' ? '버스이용' : '버스미이용'}
                  </span>
                )}
              </div>
            )}
            {rsvp.message && (
              <p className="text-[13px] text-[#5A5270] leading-[1.5]">{rsvp.message}</p>
            )}
            <span className="text-[11px] text-[#C5BAE8]">{formatRelativeTime(rsvp.created_at)}</span>
          </GeunnalCard>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[14px] text-[#9B8CC4]">
            {rsvpData.length === 0 ? '아직 응답이 없습니다' : '해당 조건에 맞는 응답이 없습니다'}
          </p>
        </div>
      )}

      {/* New Response Toast */}
      {newResponseToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#8B75D0] text-white text-[13px] font-medium shadow-lg animate-fade-in whitespace-nowrap">
          {newResponseToast}
        </div>
      )}
    </div>
  )
}

/* ─── RSVP Filter Chip ─── */
function RsvpFilterChip({ label, count, isActive, activeStyle, onClick }: {
  label: string; count: number; isActive: boolean; activeStyle: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors active:scale-95 ${
        isActive ? activeStyle : 'bg-white text-[#9B8CC4] border-[#E8E4F0]'
      }`}
    >
      {label}
      <span className={`inline-flex items-center justify-center min-w-[1rem] h-4 px-1 rounded-full text-[9px] font-semibold ${
        isActive ? 'bg-white/30 text-inherit' : 'bg-[#F9F7FD] text-[#C5BAE8]'
      }`}>
        {count}
      </span>
    </button>
  )
}

/* ─── Attendance Badge ─── */
function AttendanceBadge({ attendance }: { attendance: 'attending' | 'not_attending' | 'pending' }) {
  if (attendance === 'attending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EDE9FA] text-[#8B75D0] text-[11px] font-medium">
        <UserCheck size={11} strokeWidth={2} /> 참석
      </span>
    )
  }
  if (attendance === 'not_attending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAE9F0] text-[#D4899A] text-[11px] font-medium">
        <UserX size={11} strokeWidth={2} /> 불참
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F9F7FD] text-[#B87AAB] text-[11px] font-medium">
      <Clock size={11} strokeWidth={2} /> 미정
    </span>
  )
}

/* ─── Events Tab ─── */
function EventsTab({ events, submissions, onEventClick }: { events: GeunnalEvent[]; submissions: GeunnalSubmission[]; onEventClick?: (eventId: string) => void }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[14px] text-[#9B8CC4]">완료된 모임이 없습니다</p>
        <p className="text-[12px] text-[#C5BAE8] mt-1">모임 비용을 입력하면 기록에 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map(event => {
        const eventSubs = submissions.filter(s => s.event_id === event.id)
        const photos = eventSubs.filter(s => s.photo_url)
        const photoCount = photos.length
        const messageCount = eventSubs.filter(s => s.message).length

        return (
          <GeunnalCard
            key={event.id}
            className={`flex flex-col gap-3 ${onEventClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
            onClick={() => onEventClick?.(event.id)}
          >
            {/* Event Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-[15px] font-medium text-[#2A2240]">{event.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <CalendarDays size={14} strokeWidth={1.5} className="text-[#9B8CC4]" />
                  <span className="text-[13px] text-[#9B8CC4]">
                    {formatDate(event.date)} {formatTime(event.time)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin size={14} strokeWidth={1.5} className="text-[#9B8CC4]" />
                  <span className="text-[13px] text-[#9B8CC4]">{event.area || ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#9B8CC4]">
                <Users size={16} strokeWidth={1.5} />
                <span className="text-[13px]">{event.expected_guests || 0}</span>
              </div>
            </div>

            {/* Photo Strip */}
            {photos.length > 0 && (
              <div className="flex gap-1.5">
                {photos.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="relative w-1/4 aspect-square rounded-lg overflow-hidden">
                    <img src={p.photo_url!} alt="" className="w-full h-full object-cover" />
                    {i === 3 && photoCount > 4 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[13px] font-medium">+{photoCount - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <GeunnalBadge variant="lavender">
                  <span className="flex items-center gap-1">
                    <Image size={12} strokeWidth={1.5} /> {photoCount}
                  </span>
                </GeunnalBadge>
                <GeunnalBadge variant="blush">
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} strokeWidth={1.5} /> {messageCount}
                  </span>
                </GeunnalBadge>
              </div>
              {onEventClick && <ChevronRight size={18} strokeWidth={1.5} className="text-[#9B8CC4]" />}
            </div>
          </GeunnalCard>
        )
      })}
    </div>
  )
}

/* ─── Photos Tab ─── */
function PhotosTab({ events, submissions }: { events: GeunnalEvent[]; submissions: GeunnalSubmission[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [viewingPhoto, setViewingPhoto] = useState<GeunnalSubmission | null>(null)

  const allPhotos = submissions.filter(s => s.photo_url)
  const filtered = filter === 'all'
    ? allPhotos
    : allPhotos.filter(s => s.event_id === filter)

  const filters = [
    { key: 'all', label: '전체' },
    ...events.map(e => ({ key: e.id, label: e.name })),
  ]

  const getEventById = (id: string) => events.find(e => e.id === id)

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-[22px] text-[12px] font-medium transition-colors ${
              filter === f.key
                ? 'text-white'
                : 'bg-[#EDE9FA] text-[#9B8CC4]'
            }`}
            style={filter === f.key ? { background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-4 gap-1">
        {filtered.map(s => {
          const event = getEventById(s.event_id)
          return (
            <div
              key={s.id}
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => setViewingPhoto(s)}
            >
              <img src={s.photo_url!} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 pt-4">
                <p className="text-white text-[9px] font-medium truncate">
                  {s.is_anonymous ? '익명' : s.guest_name}
                </p>
                <p className="text-white/70 text-[8px] truncate">{event?.name}</p>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-[14px] text-[#9B8CC4] py-12">사진이 없습니다</p>
      )}

      {/* Image Fullscreen Viewer */}
      {viewingPhoto && (
        <DashboardImageViewer
          submission={viewingPhoto}
          eventName={getEventById(viewingPhoto.event_id)?.name}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </div>
  )
}

/* ─── Dashboard Image Viewer ─── */
function DashboardImageViewer({ submission, eventName, onClose }: {
  submission: GeunnalSubmission; eventName?: string; onClose: () => void
}) {
  const handleDownload = () => {
    if (!submission.photo_url) return
    const a = document.createElement('a')
    a.href = submission.photo_url
    a.download = `photo-${submission.guest_name || 'guest'}.jpg`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
          <X size={22} strokeWidth={1.5} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-white text-[14px] font-medium">
            {submission.is_anonymous ? '익명' : submission.guest_name}
          </p>
          {eventName && <p className="text-white/60 text-[11px]">{eventName}</p>}
        </div>
        <button onClick={handleDownload} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
          <Download size={20} strokeWidth={1.5} className="text-white" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {submission.photo_url && (
          <img src={submission.photo_url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        )}
      </div>

      {/* Message */}
      {submission.message && (
        <div className="px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          <p className="text-white/90 text-[14px] text-center leading-[1.6]">{submission.message}</p>
        </div>
      )}
    </div>
  )
}

/* ─── Messages Tab ─── */
function MessagesTab({ events, submissions }: { events: GeunnalEvent[]; submissions: GeunnalSubmission[] }) {
  const [filter, setFilter] = useState<string>('all')

  const allMessages = submissions.filter(s => s.message)
  const filtered = filter === 'all'
    ? allMessages
    : filter === 'with-photo'
      ? allMessages.filter(s => s.photo_url)
      : allMessages.filter(s => s.event_id === filter)

  const filters = [
    { key: 'all', label: '전체' },
    ...events.map(e => ({ key: e.id, label: e.name })),
    { key: 'with-photo', label: '사진 포함' },
  ]

  const getEventById = (id: string) => events.find(e => e.id === id)

  // Group by event
  const grouped = filtered.reduce<Record<string, GeunnalSubmission[]>>((acc, s) => {
    if (!acc[s.event_id]) acc[s.event_id] = []
    acc[s.event_id].push(s)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-[22px] text-[12px] font-medium transition-colors ${
              filter === f.key
                ? 'text-white'
                : 'bg-[#EDE9FA] text-[#9B8CC4]'
            }`}
            style={filter === f.key ? { background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Message Timeline */}
      {Object.entries(grouped).map(([eventId, messages]) => {
        const event = getEventById(eventId)
        return (
          <div key={eventId} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }} />
              <p className="text-[13px] font-medium text-[#2A2240]">{event?.name}</p>
              <span className="text-[11px] text-[#9B8CC4]">{event ? formatDate(event.date) : ''}</span>
            </div>
            <div className="flex flex-col gap-2 ml-1 pl-3 border-l border-[#E8E4F0]">
              {messages.map(msg => (
                <GeunnalCard key={msg.id} className="flex gap-3">
                  <BlobAvatar id={msg.avatar_id ?? 0} size={36} showBorder={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[13px] font-medium text-[#2A2240] truncate">
                        {msg.is_anonymous ? '익명' : msg.guest_name}
                      </p>
                      <span className="text-[11px] text-[#9B8CC4] shrink-0">
                        {formatRelativeTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-[15px] text-[#5A5270] mt-1">{msg.message}</p>
                    {msg.photo_url && (
                      <img src={msg.photo_url} alt="" className="mt-2 w-20 h-20 rounded-lg object-cover" />
                    )}
                  </div>
                </GeunnalCard>
              ))}
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <p className="text-center text-[14px] text-[#9B8CC4] py-12">메시지가 없습니다</p>
      )}
    </div>
  )
}
