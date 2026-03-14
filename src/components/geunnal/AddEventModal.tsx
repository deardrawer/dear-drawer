'use client'
import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Users, Trash2 } from 'lucide-react'
import BottomSheet from './BottomSheet'
import GeunnalBadge from './Badge'
import { GeunnalEvent, EventGuest, EventSide, MealType } from '@/types/geunnal'

interface AddEventModalProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  pageId: string
  token: string
  editEvent?: GeunnalEvent | null
  guests?: EventGuest[]
}

export default function AddEventModal({
  open,
  onClose,
  onSave,
  pageId,
  token,
  editEvent,
  guests = [],
}: AddEventModalProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [side, setSide] = useState<EventSide>('both')
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [dateTbd, setDateTbd] = useState(false)
  const [area, setArea] = useState('')
  const [restaurant, setRestaurant] = useState('')
  const [guestTags, setGuestTags] = useState<string[]>([])
  const [newGuestTag, setNewGuestTag] = useState('')

  // Initialize form when editEvent changes
  useEffect(() => {
    if (editEvent) {
      setName(editEvent.name)
      setSide(editEvent.side)
      setMealType(editEvent.meal_type)

      // Parse date
      if (editEvent.date === 'TBD') {
        setDateTbd(true)
        setDate('')
        setTime('')
      } else {
        setDateTbd(false)
        const dateObj = new Date(editEvent.date)
        setDate(dateObj.toISOString().split('T')[0])
        setTime(editEvent.time || '')
      }

      setArea(editEvent.area)
      setRestaurant(editEvent.restaurant)

      // Load guest names
      if (guests && guests.length > 0) {
        setGuestTags(guests.map(g => g.name))
      }
    } else {
      // Reset form for new event
      setName('')
      setSide('both')
      setMealType('lunch')
      setDate('')
      setTime('')
      setDateTbd(false)
      setArea('')
      setRestaurant('')
      setGuestTags([])
    }
  }, [editEvent, guests])

  const handleAddGuestTag = () => {
    const trimmed = newGuestTag.trim()
    if (trimmed && !guestTags.includes(trimmed)) {
      setGuestTags([...guestTags, trimmed])
      setNewGuestTag('')
    }
  }

  const handleRemoveGuestTag = (tag: string) => {
    setGuestTags(guestTags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !area.trim() || !restaurant.trim()) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    if (!dateTbd && !date) {
      alert('날짜를 선택하거나 미정을 체크해주세요.')
      return
    }

    setLoading(true)

    try {
      const eventData = {
        page_id: pageId,
        name: name.trim(),
        side,
        meal_type: mealType,
        date: dateTbd ? 'TBD' : new Date(date).toISOString(),
        time: dateTbd ? '' : time,
        area: area.trim(),
        restaurant: restaurant.trim(),
        expected_guests: guestTags.length,
      }

      let eventId = editEvent?.id

      if (editEvent) {
        // Update existing event
        const response = await fetch(`/api/geunnal/events/${editEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          throw new Error('이벤트 수정에 실패했습니다.')
        }
      } else {
        // Create new event
        const response = await fetch('/api/geunnal/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          throw new Error('이벤트 생성에 실패했습니다.')
        }

        const result = await response.json()
        eventId = result.id
      }

      // Add new guests
      if (eventId) {
        // Get existing guest names
        const existingGuestNames = guests.map(g => g.name)
        const newGuestNames = guestTags.filter(tag => !existingGuestNames.includes(tag))

        // Add new guests
        for (const guestName of newGuestNames) {
          await fetch(`/api/geunnal/events/${eventId}/guests`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name: guestName }),
          })
        }

        // Remove guests that were deleted
        const removedGuestNames = existingGuestNames.filter(name => !guestTags.includes(name))
        for (const guestName of removedGuestNames) {
          const guestToRemove = guests.find(g => g.name === guestName)
          if (guestToRemove) {
            await fetch(`/api/geunnal/events/${eventId}/guests/${guestToRemove.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
          }
        }
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Event save error:', error)
      alert(error instanceof Error ? error.message : '이벤트 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editEvent) return

    if (!confirm('이벤트를 삭제하시겠습니까? 모든 게스트와 제출물도 함께 삭제됩니다.')) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/geunnal/events/${editEvent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('이벤트 삭제에 실패했습니다.')
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Event delete error:', error)
      alert(error instanceof Error ? error.message : '이벤트 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editEvent ? '이벤트 수정' : '새 이벤트 추가'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-[#2A2240] mb-2">
            이벤트명 <span className="text-[#D4899A]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 신부 친구들 저녁"
            className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
            required
          />
        </div>

        {/* Side Selection */}
        <div>
          <label className="block text-sm font-medium text-[#2A2240] mb-2">
            구분 <span className="text-[#D4899A]">*</span>
          </label>
          <div className="flex gap-2">
            {[
              { value: 'groom', label: '신랑' },
              { value: 'bride', label: '신부' },
              { value: 'both', label: '공통' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSide(option.value as EventSide)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  side === option.value
                    ? 'bg-[#8B75D0] text-white'
                    : 'bg-[#F9F7FD] text-[#5A5270] border border-[#E8E4F0]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Type Selection */}
        <div>
          <label className="block text-sm font-medium text-[#2A2240] mb-2">
            식사 종류 <span className="text-[#D4899A]">*</span>
          </label>
          <div className="flex gap-2">
            {[
              { value: 'lunch', label: '점심' },
              { value: 'dinner', label: '저녁' },
              { value: 'other', label: '기타' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMealType(option.value as MealType)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  mealType === option.value
                    ? 'bg-[#8B75D0] text-white'
                    : 'bg-[#F9F7FD] text-[#5A5270] border border-[#E8E4F0]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#2A2240]">
              날짜 및 시간 <span className="text-[#D4899A]">*</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dateTbd}
                onChange={(e) => setDateTbd(e.target.checked)}
                className="w-4 h-4 rounded border-[#E8E4F0] text-[#8B75D0] focus:ring-[#8B75D0]"
              />
              <span className="text-sm text-[#5A5270]">미정</span>
            </label>
          </div>

          {!dateTbd && (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B8CC4]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
                  required={!dateTbd}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B8CC4]" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Area */}
        <div>
          <label className="block text-sm font-medium text-[#2A2240] mb-2">
            지역 <span className="text-[#D4899A]">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B8CC4]" />
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="예: 강남구, 홍대"
              className="w-full pl-10 pr-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              required
            />
          </div>
        </div>

        {/* Restaurant */}
        <div>
          <label className="block text-sm font-medium text-[#2A2240] mb-2">
            식당명 <span className="text-[#D4899A]">*</span>
          </label>
          <input
            type="text"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            placeholder="식당 이름을 입력하세요"
            className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
            required
          />
        </div>

        {/* Guest Tags */}
        <div>
          <label className="block text-sm font-medium text-[#2A2240] mb-2">
            초대 게스트
          </label>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B8CC4]" />
              <input
                type="text"
                value={newGuestTag}
                onChange={(e) => setNewGuestTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddGuestTag()
                  }
                }}
                placeholder="게스트 이름"
                className="w-full pl-10 pr-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              />
            </div>
            <button
              type="button"
              onClick={handleAddGuestTag}
              className="px-4 py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors"
            >
              추가
            </button>
          </div>

          {guestTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {guestTags.map((tag) => (
                <GeunnalBadge key={tag} variant="lavender" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveGuestTag(tag)}
                    className="ml-1 hover:text-[#2A2240]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </GeunnalBadge>
              ))}
            </div>
          )}
          <p className="text-xs text-[#9B8CC4] mt-2">
            총 {guestTags.length}명
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          {editEvent && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-3 bg-[#FAE9F0] text-[#D4899A] rounded-xl font-medium hover:bg-[#F5D4E0] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#F9F7FD] text-[#5A5270] rounded-xl font-medium hover:bg-[#EDE9FA] transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors disabled:opacity-50"
          >
            {loading ? '저장 중...' : editEvent ? '수정' : '생성'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
