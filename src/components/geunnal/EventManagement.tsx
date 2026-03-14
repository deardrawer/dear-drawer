'use client'
import { useState, useEffect } from 'react'
import { Plus, MapPin, Users, DollarSign } from 'lucide-react'
import { GeunnalEvent, EventGuest } from '@/types/geunnal'
import GeunnalCard from './Card'
import GeunnalBadge from './Badge'
import MonthCalendar from './MonthCalendar'
import AddEventModal from './AddEventModal'
import CostEditModal from './CostEditModal'
import EventPopup from './EventPopup'

interface EventManagementProps {
  pageId: string
  token: string
  groomName: string
  brideName: string
  weddingDate: string | null
  onEventClick: (eventId: string) => void
}

interface EventWithGuests {
  event: GeunnalEvent
  guests: EventGuest[]
}

type CostTab = 'groom' | 'bride' | 'both'

// Utility function to calculate D-day
const getDday = (targetDate: string | null): number | null => {
  if (!targetDate) return null
  const target = new Date(targetDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// Utility function to format date
const formatDate = (dateStr: string) => {
  if (dateStr === 'TBD') return '미정'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

// Utility function to format time
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  return timeStr.slice(0, 5) // HH:MM
}

export default function EventManagement({
  pageId,
  token,
  groomName,
  brideName,
  weddingDate,
  onEventClick,
}: EventManagementProps) {
  const [eventsWithGuests, setEventsWithGuests] = useState<EventWithGuests[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [costModalOpen, setCostModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<GeunnalEvent | null>(null)
  const [costTab, setCostTab] = useState<CostTab>('both')
  const [eventPopupOpen, setEventPopupOpen] = useState(false)
  const [selectedDateEvents, setSelectedDateEvents] = useState<GeunnalEvent[]>([])

  const dday = getDday(weddingDate)

  const fetchEvents = async () => {
    try {
      setLoading(true)

      // Fetch events
      const eventsRes = await fetch(`/api/geunnal/events?pageId=${pageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!eventsRes.ok) {
        throw new Error('이벤트 불러오기 실패')
      }

      const eventsData = (await eventsRes.json()) as { events: GeunnalEvent[] }
      const events = eventsData.events

      // Fetch guests for each event
      const eventsWithGuestsData = await Promise.all(
        events.map(async (event) => {
          try {
            const guestsRes = await fetch(`/api/geunnal/events/${event.id}/guests`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })

            if (!guestsRes.ok) {
              return { event, guests: [] }
            }

            const guestsData = (await guestsRes.json()) as { guests: EventGuest[] }
            return { event, guests: guestsData.guests }
          } catch (error) {
            console.error(`Failed to fetch guests for event ${event.id}:`, error)
            return { event, guests: [] }
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

  useEffect(() => {
    fetchEvents()
  }, [pageId, token])

  const handleRefresh = () => {
    fetchEvents()
  }

  const handleCostClick = (event: GeunnalEvent) => {
    setSelectedEvent(event)
    setCostModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    const eventsOnDate = eventsWithGuests
      .filter((ewg) => ewg.event.date.split('T')[0] === dateKey)
      .map((ewg) => ewg.event)

    if (eventsOnDate.length > 0) {
      setSelectedDateEvents(eventsOnDate)
      setEventPopupOpen(true)
    }
  }

  // Categorize events
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayEvents = eventsWithGuests.filter((ewg) => {
    if (ewg.event.date === 'TBD') return false
    const eventDate = new Date(ewg.event.date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate.getTime() === today.getTime()
  })

  const upcomingEvents = eventsWithGuests.filter((ewg) => {
    if (ewg.event.date === 'TBD') return false
    const eventDate = new Date(ewg.event.date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate.getTime() > today.getTime()
  })

  const tbdEvents = eventsWithGuests.filter((ewg) => ewg.event.date === 'TBD')

  const completedEvents = eventsWithGuests.filter((ewg) => {
    if (ewg.event.date === 'TBD') return false
    const eventDate = new Date(ewg.event.date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate.getTime() < today.getTime()
  })

  // Calculate costs by side
  const calculateCosts = (side: CostTab) => {
    const filtered =
      side === 'both'
        ? eventsWithGuests
        : eventsWithGuests.filter((ewg) => ewg.event.side === side || ewg.event.side === 'both')

    const totalCost = filtered.reduce((sum, ewg) => sum + (ewg.event.total_cost || 0), 0)
    const totalGuests = filtered.reduce((sum, ewg) => sum + ewg.guests.length, 0)

    return { totalCost, totalGuests }
  }

  const { totalCost, totalGuests } = calculateCosts(costTab)

  // Event card component
  const EventCard = ({ ewg }: { ewg: EventWithGuests }) => {
    const { event, guests } = ewg

    return (
      <GeunnalCard
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onEventClick(event.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <GeunnalBadge
              variant={
                event.side === 'groom'
                  ? 'lavender'
                  : event.side === 'bride'
                  ? 'blush'
                  : 'soft'
              }
            >
              {event.side === 'groom' ? '신랑' : event.side === 'bride' ? '신부' : '공통'}
            </GeunnalBadge>
            <GeunnalBadge variant="soft">
              {event.meal_type === 'lunch' ? '점심' : event.meal_type === 'dinner' ? '저녁' : '기타'}
            </GeunnalBadge>
          </div>
        </div>

        <h4 className="font-semibold text-[#2A2240] mb-2 text-lg">
          {event.name}
        </h4>

        <div className="space-y-2 text-sm text-[#5A5270]">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span>
              {formatDate(event.date)}
              {event.time && ` ${formatTime(event.time)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#9B8CC4]" />
            <span>
              {event.area} - {event.restaurant}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E8E4F0]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#9B8CC4]" />
              <span>{guests.length}명</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCostClick(event)
              }}
              className="flex items-center gap-2 text-[#8B75D0] hover:text-[#7A64BF] transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">
                {event.total_cost
                  ? `${event.total_cost.toLocaleString('ko-KR')}원`
                  : '비용 입력'}
              </span>
            </button>
          </div>
        </div>
      </GeunnalCard>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7FD] flex items-center justify-center">
        <div className="text-[#9B8CC4]">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F7FD] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4F0] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[#2A2240]">
              {groomName} ♥ {brideName}
            </h1>
            {weddingDate && (
              <p className="text-sm text-[#5A5270] mt-1">
                {new Date(weddingDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {dday !== null && (
            <GeunnalBadge variant="blush" className="text-base px-4 py-2">
              {dday === 0 ? 'D-Day' : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}
            </GeunnalBadge>
          )}
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* Calendar */}
        <MonthCalendar
          events={eventsWithGuests.map((ewg) => ewg.event)}
          onDateClick={handleDateClick}
        />

        {/* Cost Summary */}
        <GeunnalCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#2A2240]">비용 요약</h3>
            <div className="flex gap-2">
              {[
                { value: 'groom', label: '신랑' },
                { value: 'bride', label: '신부' },
                { value: 'both', label: '전체' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setCostTab(tab.value as CostTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    costTab === tab.value
                      ? 'bg-[#8B75D0] text-white'
                      : 'bg-[#F9F7FD] text-[#5A5270]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#F9F7FD] rounded-xl">
              <p className="text-xs text-[#9B8CC4] mb-1">총 비용</p>
              <p className="text-lg font-bold text-[#2A2240]">
                {totalCost.toLocaleString('ko-KR')}원
              </p>
            </div>
            <div className="p-3 bg-[#F9F7FD] rounded-xl">
              <p className="text-xs text-[#9B8CC4] mb-1">총 인원</p>
              <p className="text-lg font-bold text-[#2A2240]">
                {totalGuests}명
              </p>
            </div>
          </div>
        </GeunnalCard>

        {/* Today Events */}
        {todayEvents.length > 0 && (
          <div>
            <h3 className="font-semibold text-[#2A2240] mb-3 px-1">
              오늘 일정 🎯
            </h3>
            <div className="space-y-3">
              {todayEvents.map((ewg) => (
                <EventCard key={ewg.event.id} ewg={ewg} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h3 className="font-semibold text-[#2A2240] mb-3 px-1">
              예정된 일정 📅
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((ewg) => (
                <EventCard key={ewg.event.id} ewg={ewg} />
              ))}
            </div>
          </div>
        )}

        {/* TBD Events */}
        {tbdEvents.length > 0 && (
          <div>
            <h3 className="font-semibold text-[#2A2240] mb-3 px-1">
              날짜 미정 📝
            </h3>
            <div className="space-y-3">
              {tbdEvents.map((ewg) => (
                <EventCard key={ewg.event.id} ewg={ewg} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Events */}
        {completedEvents.length > 0 && (
          <div>
            <h3 className="font-semibold text-[#2A2240] mb-3 px-1">
              완료된 일정 ✅
            </h3>
            <div className="space-y-3">
              {completedEvents.map((ewg) => (
                <EventCard key={ewg.event.id} ewg={ewg} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {eventsWithGuests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#9B8CC4] mb-4">아직 이벤트가 없습니다</p>
            <p className="text-sm text-[#C5BAE8]">
              + 버튼을 눌러 첫 이벤트를 추가해보세요
            </p>
          </div>
        )}
      </div>

      {/* Add Event Button */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#8B75D0] text-white rounded-full shadow-lg hover:bg-[#7A64BF] transition-colors flex items-center justify-center z-40"
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
        onClose={() => {
          setCostModalOpen(false)
          setSelectedEvent(null)
        }}
        event={selectedEvent}
        guestCount={
          selectedEvent
            ? eventsWithGuests.find((ewg) => ewg.event.id === selectedEvent.id)?.guests.length || 0
            : 0
        }
        token={token}
        onSave={handleRefresh}
      />

      <EventPopup
        open={eventPopupOpen}
        onClose={() => setEventPopupOpen(false)}
        events={selectedDateEvents}
        onEventClick={onEventClick}
      />
    </div>
  )
}
