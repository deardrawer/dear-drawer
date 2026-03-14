'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Clock, MapPin, Users, ChevronDown, ChevronUp, Wallet, Pencil, CalendarOff, Check, Phone } from 'lucide-react'
import { GeunnalEvent, EventGuest, EventSide, MealType } from '@/types/geunnal'
import GeunnalCard from './Card'
import GeunnalBadge from './Badge'
import MonthCalendar from './MonthCalendar'
import AddEventModal from './AddEventModal'
import CostEditModal from './CostEditModal'
import EventPopup from './EventPopup'
import { sendKakaoShare } from '@/lib/geunnalKakao'

interface EventManagementProps {
  pageId: string
  token: string
  slug: string
  groomName: string
  brideName: string
  weddingDate: string | null
  onEventClick: (eventId: string) => void
  onPasswordChange?: () => void
}

interface EventWithGuests {
  event: GeunnalEvent
  guests: EventGuest[]
}

const SIDE_LABELS: Record<EventSide, string> = {
  groom: '신랑측',
  bride: '신부측',
  both: '공동',
}

const SIDE_BADGE_VARIANT: Record<EventSide, 'lavender' | 'blush' | 'soft'> = {
  groom: 'lavender',
  bride: 'blush',
  both: 'soft',
}

const MEAL_LABELS: Record<MealType, string> = {
  lunch: '점심',
  dinner: '저녁',
  other: '기타',
}

const MEAL_BADGE_VARIANT: Record<MealType, 'lavender' | 'blush' | 'soft'> = {
  lunch: 'blush',
  dinner: 'lavender',
  other: 'soft',
}

// Utility functions
const getDday = (targetDate: string | null): number | null => {
  if (!targetDate) return null
  const target = new Date(targetDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

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

export default function EventManagement({
  pageId,
  token,
  slug,
  groomName,
  brideName,
  weddingDate,
  onEventClick,
  onPasswordChange,
}: EventManagementProps) {
  const [eventsWithGuests, setEventsWithGuests] = useState<EventWithGuests[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [costModalOpen, setCostModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<GeunnalEvent | null>(null)
  const [editEvent, setEditEvent] = useState<GeunnalEvent | null>(null)
  const [showCompleted, setShowCompleted] = useState(true)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)
  const [showCost, setShowCost] = useState(false)
  const [popupEventId, setPopupEventId] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const dday = getDday(weddingDate)
  const ddayText = dday === null ? '' : dday === 0 ? 'D-DAY' : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const eventsRes = await fetch(`/api/geunnal/events?pageId=${pageId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!eventsRes.ok) throw new Error('모임 불러오기 실패')
      const eventsData = (await eventsRes.json()) as { events: GeunnalEvent[] }
      const events = eventsData.events

      const eventsWithGuestsData = await Promise.all(
        events.map(async (event) => {
          try {
            const guestsRes = await fetch(`/api/geunnal/events/${event.id}/guests`, {
              headers: { 'Authorization': `Bearer ${token}` },
            })
            if (!guestsRes.ok) return { event, guests: [] }
            const guestsData = (await guestsRes.json()) as { guests: EventGuest[] }
            return { event, guests: guestsData.guests }
          } catch {
            return { event, guests: [] as EventGuest[] }
          }
        })
      )
      setEventsWithGuests(eventsWithGuestsData)
    } catch (error) {
      console.error('Fetch events error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [pageId, token])

  const handleRefresh = () => { fetchEvents() }

  const handleCostClick = (event: GeunnalEvent) => {
    setSelectedEvent(event)
    setCostModalOpen(true)
  }

  // Categorize events
  // Completed = total_cost is entered (not based on date)
  const { todayEvents, upcomingEvents, tbdEvents, needsSettlementEvents, completedEvents } = useMemo(() => {
    const today: EventWithGuests[] = []
    const upcoming: EventWithGuests[] = []
    const tbd: EventWithGuests[] = []
    const needsSettlement: EventWithGuests[] = []
    const completed: EventWithGuests[] = []

    for (const ewg of eventsWithGuests) {
      // Completed = cost has been entered
      if (ewg.event.total_cost && ewg.event.total_cost > 0) {
        completed.push(ewg)
        continue
      }

      const dateStr = ewg.event.date.split('T')[0]
      if (ewg.event.date === 'TBD' || ewg.event.date === '') {
        tbd.push(ewg)
      } else if (dateStr === todayStr) {
        today.push(ewg)
      } else if (dateStr > todayStr) {
        upcoming.push(ewg)
      } else {
        // Past event without cost = needs settlement
        needsSettlement.push(ewg)
      }
    }

    upcoming.sort((a, b) => a.event.date.localeCompare(b.event.date) || a.event.time.localeCompare(b.event.time))
    needsSettlement.sort((a, b) => b.event.date.localeCompare(a.event.date) || b.event.time.localeCompare(a.event.time))
    completed.sort((a, b) => b.event.date.localeCompare(a.event.date) || b.event.time.localeCompare(a.event.time))

    return { todayEvents: today, upcomingEvents: upcoming, tbdEvents: tbd, needsSettlementEvents: needsSettlement, completedEvents: completed }
  }, [eventsWithGuests, todayStr])

  // All events sorted by date for popup navigation (exclude TBD)
  const sortedEvents = useMemo(() => {
    return eventsWithGuests
      .filter(ewg => ewg.event.date !== 'TBD' && ewg.event.date !== '')
      .map(ewg => ewg.event)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [eventsWithGuests])

  // Cost summary
  const costSummary = useMemo(() => {
    const summary = { groom: 0, bride: 0, both: 0 }
    let totalGuests = 0
    const costEvents: { name: string; side: EventSide; cost: number; guests: number; perPerson: number }[] = []

    for (const ewg of eventsWithGuests) {
      if (ewg.event.total_cost) {
        summary[ewg.event.side] += ewg.event.total_cost
        const guestCount = ewg.guests.length || ewg.event.expected_guests || 0
        totalGuests += guestCount
        costEvents.push({
          name: ewg.event.name,
          side: ewg.event.side,
          cost: ewg.event.total_cost,
          guests: guestCount,
          perPerson: guestCount > 0 ? Math.round(ewg.event.total_cost / guestCount) : 0,
        })
      }
    }

    const total = summary.groom + summary.bride + summary.both
    return {
      ...summary,
      total,
      totalGuests,
      perPerson: totalGuests > 0 ? Math.round(total / totalGuests) : 0,
      costEvents,
    }
  }, [eventsWithGuests])

  function handleDateClick(dateStr: string) {
    const dateEvents = sortedEvents.filter(e => e.date.split('T')[0] === dateStr)
    if (dateEvents.length > 0) {
      setPopupEventId(dateEvents[0].id)
    }
  }

  function handleContactToggle(eventId: string, guestId: string, contacted: boolean) {
    // Update guest contacted status via API
    fetch(`/api/geunnal/events/${eventId}/guests/${guestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ contacted: contacted ? 1 : 0 }),
    }).then(() => fetchEvents())
  }

  const calendarEvents = useMemo(() =>
    eventsWithGuests
      .filter(ewg => ewg.event.date !== 'TBD' && ewg.event.date !== '')
      .map(ewg => ewg.event),
    [eventsWithGuests]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7FD] flex items-center justify-center">
        <div className="text-[#9B8CC4]">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="px-5 pb-24 flex flex-col gap-5">
      {/* Header */}
      <header className="pt-5 pb-5 -mx-5 px-5 border-b border-[#E8E4F0]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4] mb-1">dear drawer</p>
            <h1 className="text-xl font-medium text-[#2A2240]">
              {groomName} & {brideName}
            </h1>
            {weddingDate && (
              <p className="text-[13px] text-[#9B8CC4] mt-0.5">
                {formatDate(weddingDate)}
              </p>
            )}
          </div>
          {ddayText && <GeunnalBadge variant="lavender">{ddayText}</GeunnalBadge>}
        </div>
        <div className="flex gap-2 mt-3">
          {onPasswordChange && (
            <button
              onClick={onPasswordChange}
              className="px-3 py-1.5 text-[12px] font-medium text-[#9B8CC4] border border-[#E8E4F0] rounded-lg hover:bg-[#F9F7FD] transition-colors"
            >
              비밀번호 변경
            </button>
          )}
          <button
            onClick={() => {
              try {
                sendKakaoShare({
                  title: `${groomName} & ${brideName}의 그날`,
                  description: '함께 모임을 관리해요',
                  url: `https://invite.deardrawer.com/g/${slug}`,
                })
              } catch {
                // Kakao SDK not loaded fallback
              }
            }}
            className="px-3 py-1.5 text-[12px] font-medium text-[#9B8CC4] border border-[#E8E4F0] rounded-lg hover:bg-[#F9F7FD] transition-colors"
          >
            카카오톡 공유
          </button>
        </div>
      </header>

      {/* Calendar */}
      <MonthCalendar events={calendarEvents} onDateClick={handleDateClick} />

      {/* Cost Summary */}
      {costSummary.total > 0 && (
        <GeunnalCard className="p-4">
          <button
            onClick={() => setShowCost(v => !v)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Wallet size={16} strokeWidth={1.5} className="text-[#8B75D0]" />
              <span className="text-[14px] font-medium text-[#2A2240]">비용 관리</span>
            </div>
            <span className="text-[#9B8CC4]">
              {showCost ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          {showCost && (
            <div className="flex flex-col gap-3 mt-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9B8CC4]">신랑측</span>
                  <span className="text-[#5A5270] font-medium">{costSummary.groom.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9B8CC4]">신부측</span>
                  <span className="text-[#5A5270] font-medium">{costSummary.bride.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9B8CC4]">공동</span>
                  <span className="text-[#5A5270] font-medium">{costSummary.both.toLocaleString()}원</span>
                </div>
                <div className="border-t border-[#E8E4F0] my-1" />
                <div className="flex justify-between text-[14px]">
                  <span className="font-medium text-[#2A2240]">합계</span>
                  <span className="font-semibold text-[#8B75D0]">{costSummary.total.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#9B8CC4]">총 참석자</span>
                  <span className="text-[#5A5270] font-medium">{costSummary.totalGuests}명</span>
                </div>
                {costSummary.perPerson > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#9B8CC4]">전체 1인당 평균</span>
                    <span className="text-[#8B75D0] font-medium">≈ {costSummary.perPerson.toLocaleString()}원</span>
                  </div>
                )}
              </div>

              {costSummary.costEvents.length > 0 && (
                <CostBreakdown costEvents={costSummary.costEvents} />
              )}
            </div>
          )}
        </GeunnalCard>
      )}

      {/* Today's events */}
      {todayEvents.length > 0 && (
        <section>
          <SectionHeader title="오늘의 모임" count={todayEvents.length} />
          <div className="flex flex-col gap-3">
            {todayEvents.map(ewg => (
              <div key={ewg.event.id} ref={el => { sectionRefs.current[ewg.event.date] = el }}>
                <EventCard
                  ewg={ewg}
                  onClick={() => onEventClick(ewg.event.id)}
                  onCostClick={() => handleCostClick(ewg.event)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <section>
          <SectionHeader title="예정된 모임" count={upcomingEvents.length} />
          <div className="flex flex-col gap-3">
            {(upcomingEvents.length >= 5 && !showAllUpcoming
              ? upcomingEvents.slice(0, 4)
              : upcomingEvents
            ).map(ewg => (
              <div key={ewg.event.id} ref={el => { sectionRefs.current[ewg.event.date] = el }}>
                <EventCard
                  ewg={ewg}
                  onClick={() => onEventClick(ewg.event.id)}
                  onCostClick={() => handleCostClick(ewg.event)}
                />
              </div>
            ))}
            {upcomingEvents.length >= 5 && (
              <button
                onClick={() => setShowAllUpcoming(v => !v)}
                className="flex items-center justify-center gap-1 py-2 text-[13px] font-medium text-[#9B8CC4] hover:text-[#8B75D0] transition-colors"
              >
                {showAllUpcoming ? (
                  <>접기 <ChevronUp size={16} /></>
                ) : (
                  <>나머지 {upcomingEvents.length - 4}개 더보기 <ChevronDown size={16} /></>
                )}
              </button>
            )}
          </div>
        </section>
      )}

      {/* TBD events */}
      {tbdEvents.length > 0 && (
        <section>
          <SectionHeader title="미정 모임" count={tbdEvents.length} icon={<CalendarOff size={16} strokeWidth={1.5} className="text-[#9B8CC4]" />} />
          <div className="flex flex-col gap-3">
            {tbdEvents.map(ewg => (
              <div key={ewg.event.id}>
                <TBDEventCard
                  ewg={ewg}
                  onClick={() => onEventClick(ewg.event.id)}
                  onContactToggle={handleContactToggle}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Needs Settlement (past events without cost) */}
      {needsSettlementEvents.length > 0 && (
        <section>
          <SectionHeader title="정산 대기" count={needsSettlementEvents.length} icon={<Wallet size={16} strokeWidth={1.5} className="text-[#D4899A]" />} />
          <div className="flex flex-col gap-3">
            {needsSettlementEvents.map(ewg => (
              <div key={ewg.event.id}>
                <EventCard
                  ewg={ewg}
                  onClick={() => onEventClick(ewg.event.id)}
                  onCostClick={() => handleCostClick(ewg.event)}
                  needsSettlement
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed events (cost entered) */}
      {completedEvents.length > 0 && (
        <section>
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-2 mb-3 w-full"
          >
            <SectionHeader title="완료된 모임" count={completedEvents.length} />
            <span className="text-[#9B8CC4] ml-auto">
              {showCompleted ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>
          {showCompleted && (
            <div className="flex flex-col gap-3">
              {completedEvents.map(ewg => (
                <div key={ewg.event.id}>
                  <EventCard
                    ewg={ewg}
                    onClick={() => onEventClick(ewg.event.id)}
                    onCostClick={() => handleCostClick(ewg.event)}
                    isCompleted
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty State */}
      {eventsWithGuests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#9B8CC4] mb-4">아직 모임이 없습니다</p>
          <p className="text-sm text-[#C5BAE8]">+ 버튼을 눌러 첫 모임을 추가해보세요</p>
        </div>
      )}

      {/* Add Event Button */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <AddEventModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleRefresh}
        pageId={pageId}
        token={token}
      />

      <CostEditModal
        open={costModalOpen}
        onClose={() => { setCostModalOpen(false); setSelectedEvent(null) }}
        event={selectedEvent}
        guestCount={
          selectedEvent
            ? eventsWithGuests.find(ewg => ewg.event.id === selectedEvent.id)?.guests.length || 0
            : 0
        }
        token={token}
        onSave={handleRefresh}
      />

      <EventPopup
        open={popupEventId !== null}
        onClose={() => setPopupEventId(null)}
        events={sortedEvents}
        onEventClick={(id) => { setPopupEventId(null); onEventClick(id) }}
      />
    </div>
  )
}

/* ─── Section Header ─── */
function SectionHeader({ title, count, icon }: { title: string; count: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-[15px] font-medium text-[#2A2240]">{title}</h2>
      <span className="text-[12px] text-[#9B8CC4]">{count}</span>
    </div>
  )
}

/* ─── Event Card ─── */
function EventCard({ ewg, onClick, onCostClick, isCompleted, needsSettlement }: {
  ewg: EventWithGuests
  onClick: () => void
  onCostClick: () => void
  isCompleted?: boolean
  needsSettlement?: boolean
}) {
  const { event, guests } = ewg
  const guestCount = guests.length || event.expected_guests || 0
  const costText = event.total_cost ? `${event.total_cost.toLocaleString()}원` : null

  return (
    <GeunnalCard
      className={`cursor-pointer active:scale-[0.98] transition-transform ${isCompleted ? 'opacity-60' : ''} ${needsSettlement ? 'border-[#D4899A]/40' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-2">
        {/* Row 1: Side badge + Name + Meal badge */}
        <div className="flex items-center gap-2">
          <GeunnalBadge variant={SIDE_BADGE_VARIANT[event.side]} className="text-[11px] px-2 py-0.5">
            {SIDE_LABELS[event.side]}
          </GeunnalBadge>
          <span className="text-[15px] font-medium text-[#2A2240] flex-1 truncate">
            {event.name}
          </span>
          <GeunnalBadge variant={MEAL_BADGE_VARIANT[event.meal_type]} className="text-[11px] px-2 py-0.5">
            {MEAL_LABELS[event.meal_type]}
          </GeunnalBadge>
        </div>

        {/* Row 2: Date & Time */}
        <div className="flex items-center gap-1.5">
          <Clock size={14} strokeWidth={1.5} className="text-[#9B8CC4] shrink-0" />
          <span className="text-[13px] text-[#9B8CC4]">
            {formatDate(event.date)} {formatTime(event.time)}
          </span>
        </div>

        {/* Row 3: Area & Restaurant */}
        {(event.area || event.restaurant) ? (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} strokeWidth={1.5} className="text-[#9B8CC4] shrink-0" />
            <span className="text-[13px] text-[#9B8CC4] truncate">
              {event.area}{event.restaurant ? ` · ${event.restaurant}` : ''}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} strokeWidth={1.5} className="text-[#9B8CC4] shrink-0" />
            <span className="text-[13px] text-[#9B8CC4]">장소 미정</span>
          </div>
        )}

        {/* Row 4: Guests & Cost */}
        <div className="flex items-center gap-1.5">
          <Users size={14} strokeWidth={1.5} className="text-[#9B8CC4] shrink-0" />
          <span className="text-[13px] text-[#9B8CC4]">
            {guestCount}명
          </span>
          <span className="text-[#9B8CC4] mx-0.5">·</span>
          {costText ? (
            <button
              onClick={e => { e.stopPropagation(); onCostClick() }}
              className="text-[13px] text-[#8B75D0] font-medium hover:underline"
            >
              {costText}
            </button>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onCostClick() }}
              className="text-[13px] text-[#C5BAE8] hover:text-[#8B75D0] transition-colors"
            >
              비용 입력
            </button>
          )}
        </div>

        {/* Needs settlement prompt */}
        {needsSettlement && !costText && (
          <button
            onClick={e => { e.stopPropagation(); onCostClick() }}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#FAE9F0] text-[#D4899A] rounded-lg text-[12px] font-medium hover:bg-[#F5D4E0] transition-colors mt-1"
          >
            <Wallet size={13} strokeWidth={1.5} />
            비용을 입력하면 정산이 완료됩니다
          </button>
        )}

        {/* Row 5: Guest names */}
        {guests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {guests.map(g => (
              <span
                key={g.id}
                className="text-[11px] px-2 py-0.5 bg-[#F9F7FD] text-[#5A5270] rounded-xl"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </GeunnalCard>
  )
}

/* ─── TBD Event Card ─── */
function TBDEventCard({ ewg, onClick, onContactToggle }: {
  ewg: EventWithGuests
  onClick: () => void
  onContactToggle: (eventId: string, guestId: string, contacted: boolean) => void
}) {
  const { event, guests } = ewg
  const contactedCount = guests.filter(g => g.contacted === 1).length
  const totalGuests = guests.length

  return (
    <GeunnalCard className="cursor-pointer active:scale-[0.98] transition-transform" onClick={onClick}>
      <div className="flex flex-col gap-2.5">
        {/* Row 1: Side badge + Name */}
        <div className="flex items-center gap-2">
          <GeunnalBadge variant={SIDE_BADGE_VARIANT[event.side]} className="text-[11px] px-2 py-0.5">
            {SIDE_LABELS[event.side]}
          </GeunnalBadge>
          <span className="text-[15px] font-medium text-[#2A2240] flex-1 truncate">
            {event.name}
          </span>
        </div>

        {/* Row 2: TBD date + Area */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CalendarOff size={14} strokeWidth={1.5} className="text-[#9B8CC4] shrink-0" />
            <span className="text-[13px] text-[#9B8CC4]">날짜 미정</span>
          </div>
          {event.area && (
            <div className="flex items-center gap-1.5">
              <MapPin size={14} strokeWidth={1.5} className="text-[#9B8CC4] shrink-0" />
              <span className="text-[13px] text-[#9B8CC4] truncate">
                {event.area}{event.restaurant ? ` · ${event.restaurant}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Contact progress */}
        {totalGuests > 0 && (
          <div className="flex items-center gap-2">
            <Phone size={13} strokeWidth={1.5} className="text-[#9B8CC4] shrink-0" />
            <span className="text-[12px] text-[#9B8CC4]">
              연락 {contactedCount}/{totalGuests}
            </span>
            <div className="flex-1 h-1.5 bg-[#F9F7FD] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B75D0] rounded-full transition-all duration-300"
                style={{ width: totalGuests > 0 ? `${(contactedCount / totalGuests) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* Row 4: Guest contact checklist */}
        {guests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {guests.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); onContactToggle(event.id, g.id, g.contacted !== 1) }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-xl transition-colors ${
                  g.contacted === 1
                    ? 'bg-[#EDE9FA] text-[#8B75D0]'
                    : 'bg-[#F9F7FD] text-[#5A5270]'
                }`}
              >
                {g.contacted === 1 && <Check size={10} strokeWidth={2.5} />}
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </GeunnalCard>
  )
}

/* ─── Cost Breakdown with Side Tabs ─── */
type CostEvent = { name: string; side: EventSide; cost: number; guests: number; perPerson: number }

function CostBreakdown({ costEvents }: { costEvents: CostEvent[] }) {
  const [tab, setTab] = useState<EventSide | 'all'>('all')

  const TABS: { value: EventSide | 'all'; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'groom', label: '신랑측' },
    { value: 'bride', label: '신부측' },
    { value: 'both', label: '공동' },
  ]

  const filtered = tab === 'all' ? costEvents : costEvents.filter(ce => ce.side === tab)
  const subTotal = filtered.reduce((sum, ce) => sum + ce.cost, 0)
  const subGuests = filtered.reduce((sum, ce) => sum + ce.guests, 0)
  const subPerPerson = subGuests > 0 ? Math.round(subTotal / subGuests) : 0

  return (
    <div className="flex flex-col gap-2 bg-[#F9F7FD] rounded-lg p-3">
      <p className="text-[12px] font-medium text-[#9B8CC4]">모임별 상세</p>

      {/* Side tabs */}
      <div className="flex gap-1 bg-white rounded-lg p-0.5">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`
              flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all
              ${tab === value
                ? 'bg-[#EDE9FA] text-[#8B75D0] shadow-sm'
                : 'text-[#9B8CC4] hover:text-[#5A5270]'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtered events */}
      {filtered.length === 0 ? (
        <p className="text-[12px] text-[#9B8CC4] py-2 text-center">해당 항목이 없습니다</p>
      ) : (
        <>
          {filtered.map((ce, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {tab === 'all' && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-xl ${
                      ce.side === 'groom' ? 'bg-[#EDE9FA] text-[#8B75D0]'
                        : ce.side === 'bride' ? 'bg-[#FAE9F0] text-[#D4899A]'
                        : 'bg-[#E8E4F0] text-[#9B8CC4]'
                    }`}>
                      {SIDE_LABELS[ce.side]}
                    </span>
                  )}
                  <span className="text-[13px] text-[#2A2240] font-medium">{ce.name}</span>
                </div>
                <span className="text-[13px] text-[#5A5270] font-medium">{ce.cost.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between pl-0.5">
                <span className="text-[11px] text-[#9B8CC4]">
                  {ce.guests > 0 ? `${ce.guests}명 참석` : '참석자 미정'}
                </span>
                {ce.perPerson > 0 && (
                  <span className="text-[11px] text-[#8B75D0] font-medium">
                    1인당 ≈ {ce.perPerson.toLocaleString()}원
                  </span>
                )}
              </div>
            </div>
          ))}

          {filtered.length > 1 && (
            <>
              <div className="border-t border-[#E8E4F0] my-0.5" />
              <div className="flex justify-between text-[12px]">
                <span className="text-[#9B8CC4] font-medium">소계</span>
                <span className="text-[#2A2240] font-semibold">{subTotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#9B8CC4]">{subGuests}명</span>
                {subPerPerson > 0 && (
                  <span className="text-[#8B75D0] font-medium">1인당 ≈ {subPerPerson.toLocaleString()}원</span>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
