'use client'
import { X } from 'lucide-react'
import { GeunnalEvent } from '@/types/geunnal'
import GeunnalBadge from './Badge'

interface EventPopupProps {
  open: boolean
  onClose: () => void
  events: GeunnalEvent[]
  onEventClick: (eventId: string) => void
}

// Utility function to format date
const formatDate = (dateStr: string) => {
  if (dateStr === 'TBD') return '미정'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// Utility function to format time
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  return timeStr.slice(0, 5) // HH:MM
}

export default function EventPopup({ open, onClose, events, onEventClick }: EventPopupProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg p-5 max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#2A2240]">
            이벤트 목록
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F9F7FD] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#5A5270]" />
          </button>
        </div>

        {/* Event List */}
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-center text-[#9B8CC4] py-8">
              이 날짜에 예정된 이벤트가 없습니다.
            </p>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() => {
                  onEventClick(event.id)
                  onClose()
                }}
                className="w-full p-4 bg-[#F9F7FD] hover:bg-[#EDE9FA] rounded-xl border border-[#E8E4F0] transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-2">
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

                <h4 className="font-semibold text-[#2A2240] mb-1">
                  {event.name}
                </h4>

                <div className="text-sm text-[#5A5270] space-y-1">
                  <div>
                    📅 {formatDate(event.date)}
                    {event.time && ` ${formatTime(event.time)}`}
                  </div>
                  <div>
                    📍 {event.area} - {event.restaurant}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
