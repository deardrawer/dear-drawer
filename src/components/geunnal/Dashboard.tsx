'use client'
import { useState, useEffect, useMemo } from 'react'
import { Image, MessageCircle, Users, CalendarDays, MapPin, ChevronRight, X, Download } from 'lucide-react'
import { GeunnalEvent, GeunnalSubmission } from '@/types/geunnal'
import GeunnalBadge from './Badge'
import GeunnalCard from './Card'
import BlobAvatar from './BlobAvatar'

interface DashboardProps {
  pageId: string
  token: string
  onEventClick?: (eventId: string) => void
}

type Tab = 'events' | 'photos' | 'messages'
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

export default function Dashboard({ pageId, token, onEventClick }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('events')
  const [sideFilter, setSideFilter] = useState<SideFilter>('all')
  const [events, setEvents] = useState<GeunnalEvent[]>([])
  const [submissions, setSubmissions] = useState<GeunnalSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Fetch events
        const eventsRes = await fetch(`/api/geunnal/events?pageId=${pageId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (eventsRes.ok) {
          const data = (await eventsRes.json()) as { events: GeunnalEvent[] }
          setEvents(data.events)

          // Fetch submissions for each event
          const allSubmissions: GeunnalSubmission[] = []
          for (const event of data.events) {
            try {
              const subRes = await fetch(`/api/geunnal/submissions?eventId=${event.id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
              })
              if (subRes.ok) {
                const subData = (await subRes.json()) as { submissions: GeunnalSubmission[] }
                allSubmissions.push(...subData.submissions)
              }
            } catch { /* skip */ }
          }
          setSubmissions(allSubmissions)
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [pageId, token])

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
            디어데이
          </h1>
          <p className="text-[13px] text-[#5A5270] mt-0.5">소중한 그날의 기록</p>
        </div>
      </header>

      {/* Side Tabs */}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-3 text-center`}>
            <p className="text-xl font-medium text-[#2A2240]">{stat.value}</p>
            <p className="text-[11px] text-[#9B8CC4] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

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
    </div>
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
