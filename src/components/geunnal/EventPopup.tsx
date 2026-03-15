'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, Clock, MapPin, Users, Plus } from 'lucide-react'
import { GeunnalEvent, EventGuest } from '@/types/geunnal'
import GeunnalBadge from './Badge'

interface EventWithGuests {
  event: GeunnalEvent
  guests: EventGuest[]
}

interface EventPopupProps {
  open: boolean
  onClose: () => void
  events: GeunnalEvent[]
  eventsWithGuests?: EventWithGuests[]
  onEventClick: (eventId: string) => void
  initialDate?: string
  onAddEvent?: (dateStr: string) => void
}

const SIDE_LABELS: Record<string, string> = {
  groom: '신랑측',
  bride: '신부측',
  both: '공동',
}

const MEAL_LABELS: Record<string, string> = {
  lunch: '점심',
  dinner: '저녁',
  other: '기타',
}

function formatDateFull(dateStr: string): string {
  if (!dateStr || dateStr === 'TBD') return '미정'
  const d = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m > 0 ? `${period} ${hour}시 ${m}분` : `${period} ${hour}시`
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function EventPopup({ open, onClose, events, eventsWithGuests, onEventClick, initialDate, onAddEvent }: EventPopupProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || '')
  const [eventIndex, setEventIndex] = useState(0)

  // Reset when popup opens
  useEffect(() => {
    if (open && initialDate) {
      setCurrentDate(initialDate)
      setEventIndex(0)
    }
  }, [open, initialDate])

  const dayEvents = useMemo(() => {
    return events.filter(e => e.date.split('T')[0] === currentDate)
  }, [events, currentDate])

  const handlePrevDay = useCallback(() => {
    setCurrentDate(d => shiftDate(d, -1))
    setEventIndex(0)
  }, [])

  const handleNextDay = useCallback(() => {
    setCurrentDate(d => shiftDate(d, 1))
    setEventIndex(0)
  }, [])

  if (!open || !currentDate) return null

  const hasEvents = dayEvents.length > 0
  const safeIndex = Math.min(eventIndex, Math.max(0, dayEvents.length - 1))
  const event = hasEvents ? dayEvents[safeIndex] : null
  const guests = event ? (eventsWithGuests?.find(ewg => ewg.event.id === event.id)?.guests || []) : []
  const locationText = event ? [event.area, event.restaurant].filter(Boolean).join(' · ') : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Popup */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Date header + Close */}
        <div className="flex items-center justify-center pt-4 pb-2 px-5 relative">
          <p className="text-[14px] font-medium text-[#2A2240]">{formatDateFull(currentDate)}</p>
          <button
            onClick={onClose}
            className="absolute right-4 top-3.5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F9F7FD] transition-colors"
          >
            <X size={18} strokeWidth={1.5} className="text-[#9B8CC4]" />
          </button>
        </div>

        {hasEvents ? (
          <>
            {/* Event dots for multi-event day */}
            {dayEvents.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pb-2">
                {dayEvents.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setEventIndex(i)}
                    className={`rounded-full transition-all ${
                      i === safeIndex
                        ? 'w-4 h-1.5 bg-[#8B75D0]'
                        : 'w-1.5 h-1.5 bg-[#E8E4F0]'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Event Content */}
            <div className="px-5 pb-2">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2">
                <GeunnalBadge
                  variant={event!.side === 'groom' ? 'lavender' : event!.side === 'bride' ? 'blush' : 'soft'}
                >
                  {SIDE_LABELS[event!.side] || '공동'}
                </GeunnalBadge>
                <GeunnalBadge variant="soft">
                  {MEAL_LABELS[event!.meal_type] || '기타'}
                </GeunnalBadge>
              </div>

              {/* Event Name */}
              <h3 className="text-[17px] font-semibold text-[#2A2240] mb-3">
                {event!.name}
              </h3>

              {/* Details */}
              <div className="flex flex-col gap-2.5">
                {event!.time && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EDE9FA] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={14} strokeWidth={1.5} className="text-[#8B75D0]" />
                    </div>
                    <p className="text-[14px] text-[#2A2240] mt-1.5">{formatTime(event!.time)}</p>
                  </div>
                )}

                {locationText && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FAE9F0] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={14} strokeWidth={1.5} className="text-[#D4899A]" />
                    </div>
                    <p className="text-[14px] text-[#2A2240] mt-1.5">{locationText}</p>
                  </div>
                )}

                {(guests.length > 0 || (event!.expected_guests && event!.expected_guests > 0)) && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0 mt-0.5">
                      <Users size={14} strokeWidth={1.5} className="text-[#66BB6A]" />
                    </div>
                    <div>
                      <p className="text-[14px] text-[#2A2240]">
                        참석자 {guests.length || event!.expected_guests}명
                      </p>
                      {guests.length > 0 && (
                        <p className="text-[12px] text-[#9B8CC4]">
                          {guests.map(g => g.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer: Day Navigation + Detail Button */}
            <div className="flex items-center justify-between px-5 py-4">
              <button
                onClick={handlePrevDay}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E8E4F0] hover:bg-[#F9F7FD] transition-colors"
              >
                <ChevronLeft size={18} strokeWidth={1.5} className="text-[#5A5270]" />
              </button>

              <button
                onClick={() => {
                  onEventClick(event!.id)
                  onClose()
                }}
                className="px-5 py-2 rounded-full border border-[#8B75D0] text-[#8B75D0] text-[13px] font-medium hover:bg-[#EDE9FA]/30 active:scale-[0.97] transition-all"
              >
                상세 보기
              </button>

              <button
                onClick={handleNextDay}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E8E4F0] hover:bg-[#F9F7FD] transition-colors"
              >
                <ChevronRight size={18} strokeWidth={1.5} className="text-[#5A5270]" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Empty date */}
            <div className="px-5 py-8 text-center">
              <p className="text-[14px] text-[#9B8CC4]">이 날짜에 모임이 없습니다</p>
            </div>

            {/* Footer: Day Navigation + Add Button */}
            <div className="flex items-center justify-between px-5 py-4">
              <button
                onClick={handlePrevDay}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E8E4F0] hover:bg-[#F9F7FD] transition-colors"
              >
                <ChevronLeft size={18} strokeWidth={1.5} className="text-[#5A5270]" />
              </button>

              {onAddEvent && (
                <button
                  onClick={() => {
                    onAddEvent(currentDate)
                    onClose()
                  }}
                  className="px-5 py-2 rounded-full bg-[#8B75D0] text-white text-[13px] font-medium flex items-center gap-1.5 hover:bg-[#7A64BF] active:scale-[0.97] transition-all"
                >
                  <Plus size={14} strokeWidth={2} />
                  모임 추가
                </button>
              )}

              <button
                onClick={handleNextDay}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E8E4F0] hover:bg-[#F9F7FD] transition-colors"
              >
                <ChevronRight size={18} strokeWidth={1.5} className="text-[#5A5270]" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
