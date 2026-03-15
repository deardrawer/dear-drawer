'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Calendar, Clock, MapPin, Users, Trash2, Search, MapPinned, Pencil } from 'lucide-react'
import GeunnalBadge from './Badge'
import { GeunnalEvent, EventGuest, EventSide, MealType, GeunnalVenue } from '@/types/geunnal'
import { loadKakaoMapSDK, KakaoPlaceResult, KakaoPlaces } from '@/lib/geunnalKakaoMap'

interface AddEventModalProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  pageId: string
  token: string
  editEvent?: GeunnalEvent | null
  guests?: EventGuest[]
  initialDate?: string
}

type RestaurantMode = 'none' | 'kakao' | 'venue' | 'manual' | 'selected'

export default function AddEventModal({
  open,
  onClose,
  onSave,
  pageId,
  token,
  editEvent,
  guests = [],
  initialDate,
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
  const [areaTbd, setAreaTbd] = useState(false)
  const [restaurant, setRestaurant] = useState('')
  const [guestTags, setGuestTags] = useState<string[]>([])
  const [newGuestTag, setNewGuestTag] = useState('')

  // Restaurant selection
  const [restaurantMode, setRestaurantMode] = useState<RestaurantMode>('none')
  const [selectedInfo, setSelectedInfo] = useState<{ name: string; address: string } | null>(null)

  // Kakao search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KakaoPlaceResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const placesRef = useRef<KakaoPlaces | null>(null)

  // Venues data
  const [venues, setVenues] = useState<GeunnalVenue[]>([])
  const [venueFilter, setVenueFilter] = useState('')

  // Area auto-complete
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false)

  // Initialize Kakao Places service
  useEffect(() => {
    if (!open) return
    loadKakaoMapSDK()
      .then(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any
        if (win.kakao?.maps?.services?.Places) {
          placesRef.current = new win.kakao.maps.services.Places()
        }
      })
      .catch(() => {})
  }, [open])

  // Fetch venues for the "모임장소" tab and area suggestions
  useEffect(() => {
    if (!open) return
    fetch(`/api/geunnal/venues?pageId=${pageId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() as Promise<{ venues: GeunnalVenue[] }> : Promise.reject())
      .then(data => setVenues(data.venues || []))
      .catch(() => setVenues([]))
  }, [open, pageId, token])

  // Initialize form when modal opens or editEvent changes
  useEffect(() => {
    if (!open) return
    if (editEvent) {
      setName(editEvent.name)
      setSide(editEvent.side)
      setMealType(editEvent.meal_type)

      // Parse date
      if (editEvent.date === 'TBD' || editEvent.date === '') {
        setDateTbd(true)
        setDate('')
        setTime('')
      } else {
        setDateTbd(false)
        const dateObj = new Date(editEvent.date)
        setDate(dateObj.toISOString().split('T')[0])
        setTime(editEvent.time || '')
      }

      // Parse area
      if (!editEvent.area || editEvent.area === 'TBD') {
        setAreaTbd(true)
        setArea('')
      } else {
        setAreaTbd(false)
        setArea(editEvent.area)
      }

      setRestaurant(editEvent.restaurant || '')

      // Restaurant mode
      if (editEvent.restaurant) {
        setSelectedInfo({ name: editEvent.restaurant, address: editEvent.location || editEvent.area || '' })
        setRestaurantMode('selected')
      } else {
        setSelectedInfo(null)
        setRestaurantMode('none')
      }

      // Load guest names
      if (guests && guests.length > 0) {
        setGuestTags(guests.map(g => g.name))
      } else {
        setGuestTags([])
      }
    } else {
      // Reset form for new event
      setName('')
      setSide('both')
      setMealType('lunch')
      setDate(initialDate || '')
      setTime('')
      setDateTbd(false)
      setArea('')
      setAreaTbd(false)
      setRestaurant('')
      setGuestTags([])
      setRestaurantMode('none')
      setSelectedInfo(null)
    }
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
    setVenueFilter('')
    setShowAreaSuggestions(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editEvent])

  // Unique venue areas for auto-complete and filter
  const venueAreas = useMemo(() => {
    const areas = new Set(venues.map(v => v.area).filter(Boolean))
    return Array.from(areas)
  }, [venues])

  // Filtered area suggestions
  const areaSuggestions = useMemo(() => {
    if (!area.trim()) return venueAreas
    return venueAreas.filter(a => a.includes(area.trim()))
  }, [area, venueAreas])

  // Filtered venues for venue tab
  const filteredVenues = useMemo(() => {
    if (!venueFilter) return venues
    return venues.filter(v => v.area === venueFilter)
  }, [venues, venueFilter])

  // ── Kakao search ──
  const handleSearch = () => {
    const q = searchQuery.trim()
    if (!q || !placesRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    placesRef.current.keywordSearch(q, (results: KakaoPlaceResult[], status: string) => {
      if (status === win.kakao.maps.services.Status.OK) {
        setSearchResults(results.slice(0, 5))
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(true)
      }
    })
  }

  const selectKakaoPlace = (place: KakaoPlaceResult) => {
    const placeName = place.place_name
    const placeAddr = place.road_address_name || place.address_name
    setRestaurant(placeName)
    setSelectedInfo({ name: placeName, address: placeAddr })
    // Auto-fill area if empty
    if (!area.trim()) {
      const autoArea = placeAddr.split(' ').slice(1, 3).join(' ')
      setArea(autoArea)
      setAreaTbd(false)
    }
    setRestaurantMode('selected')
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  // ── Venue selection ──
  const selectVenue = (venue: GeunnalVenue) => {
    setRestaurant(venue.name)
    setArea(venue.area)
    setAreaTbd(false)
    setSelectedInfo({ name: venue.name, address: venue.address })
    setRestaurantMode('selected')
  }

  // ── Guests ──
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

    if (!name.trim()) {
      alert('모임명을 입력해주세요.')
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
        area: areaTbd ? '' : area.trim(),
        restaurant: areaTbd ? '' : restaurant.trim(),
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
          throw new Error('모임 수정에 실패했습니다.')
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
          throw new Error('모임 생성에 실패했습니다.')
        }

        const result = (await response.json()) as { event: { id: string } }
        eventId = result.event.id
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
        const removedGuestNames = existingGuestNames.filter(n => !guestTags.includes(n))
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
      alert(error instanceof Error ? error.message : '모임 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editEvent) return

    if (!confirm('모임을 삭제하시겠습니까? 모든 게스트와 제출물도 함께 삭제됩니다.')) {
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
        throw new Error('모임 삭제에 실패했습니다.')
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Event delete error:', error)
      alert(error instanceof Error ? error.message : '모임 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4F0] shrink-0">
        <h2 className="text-[17px] font-semibold text-[#2A2240]">{editEvent ? '모임 수정' : '새 모임 추가'}</h2>
        <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F9F7FD] transition-colors">
          <X size={20} strokeWidth={1.5} className="text-[#5A5270]" />
        </button>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-[#2A2240] mb-2">
            모임명 <span className="text-[#D4899A]">*</span>
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
              { value: 'both', label: '공동' },
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
              날짜 및 시간
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

          {!dateTbd ? (
            <div className="grid grid-cols-[3fr_2fr] gap-2">
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8CC4]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[14px] text-[#2A2240] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8CC4]" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-8 pr-2 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[14px] text-[#2A2240] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
                />
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[#9B8CC4] bg-[#F9F7FD] rounded-xl px-3 py-2.5 border border-[#E8E4F0]">
              날짜가 정해지지 않은 모임입니다
            </p>
          )}
        </div>

        {/* Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#2A2240]">
              지역
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={areaTbd}
                onChange={(e) => {
                  setAreaTbd(e.target.checked)
                  if (e.target.checked) {
                    setArea('')
                    setRestaurant('')
                    setRestaurantMode('none')
                    setSelectedInfo(null)
                  }
                }}
                className="w-4 h-4 rounded border-[#E8E4F0] text-[#8B75D0] focus:ring-[#8B75D0]"
              />
              <span className="text-sm text-[#5A5270]">미정</span>
            </label>
          </div>

          {!areaTbd ? (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B8CC4] z-10" />
              <input
                type="text"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value)
                  setShowAreaSuggestions(true)
                }}
                onFocus={() => setShowAreaSuggestions(true)}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowAreaSuggestions(false), 200)
                }}
                placeholder="예: 강남구, 홍대"
                className="w-full pl-10 pr-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              />
              {/* Area suggestions from venues */}
              {showAreaSuggestions && areaSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E4F0] rounded-xl shadow-lg z-20 max-h-[150px] overflow-y-auto">
                  {areaSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setArea(suggestion)
                        setShowAreaSuggestions(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-[14px] text-[#2A2240] hover:bg-[#F9F7FD] transition-colors border-b border-[#E8E4F0] last:border-b-0"
                    >
                      <MapPin className="inline w-3.5 h-3.5 text-[#9B8CC4] mr-1.5" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-[#9B8CC4] bg-[#F9F7FD] rounded-xl px-3 py-2.5 border border-[#E8E4F0]">
              지역이 정해지지 않은 모임입니다
            </p>
          )}
        </div>

        {/* Restaurant Selection */}
        {!areaTbd && (
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              식당 선택
            </label>

            {/* Selected state */}
            {restaurantMode === 'selected' && selectedInfo && (
              <div className="flex items-center gap-2 p-3 bg-[#EDE9FA]/50 rounded-xl border border-[#8B75D0]/30">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#2A2240] truncate">{selectedInfo.name}</p>
                  <p className="text-[12px] text-[#9B8CC4] truncate">{selectedInfo.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRestaurantMode('none')
                    setRestaurant('')
                    setSelectedInfo(null)
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#8B75D0] border border-[#8B75D0]/40 hover:bg-[#EDE9FA] transition-colors"
                >
                  변경
                </button>
              </div>
            )}

            {/* Mode selector (when not selected) */}
            {restaurantMode !== 'selected' && (
              <>
                {/* Tab buttons */}
                <div className="flex gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setRestaurantMode(m => m === 'kakao' ? 'none' : 'kakao')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border ${
                      restaurantMode === 'kakao'
                        ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]'
                        : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                    }`}
                  >
                    <Search size={12} strokeWidth={1.5} />
                    식당검색
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestaurantMode(m => m === 'venue' ? 'none' : 'venue')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border ${
                      restaurantMode === 'venue'
                        ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]'
                        : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                    }`}
                  >
                    <MapPinned size={12} strokeWidth={1.5} />
                    모임장소
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestaurantMode(m => m === 'manual' ? 'none' : 'manual')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border ${
                      restaurantMode === 'manual'
                        ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]'
                        : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                    }`}
                  >
                    <Pencil size={12} strokeWidth={1.5} />
                    직접 입력
                  </button>
                </div>

                {/* Kakao search panel */}
                {restaurantMode === 'kakao' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSearch()
                          }
                        }}
                        placeholder="식당이름 또는 주소 검색"
                        className="w-full px-4 pr-10 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
                      />
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9B8CC4] hover:text-[#8B75D0] transition-colors"
                      >
                        <Search size={18} strokeWidth={1.5} />
                      </button>
                    </div>

                    {showResults && (
                      <div className="border border-[#E8E4F0] rounded-xl bg-white overflow-hidden max-h-[200px] overflow-y-auto">
                        {searchResults.length === 0 ? (
                          <div className="px-4 py-3 text-[13px] text-[#9B8CC4]">검색 결과가 없습니다</div>
                        ) : (
                          searchResults.map(place => (
                            <button
                              key={place.id}
                              type="button"
                              onClick={() => selectKakaoPlace(place)}
                              className="w-full text-left px-4 py-2.5 hover:bg-[#F9F7FD] transition-colors border-b border-[#E8E4F0] last:border-b-0"
                            >
                              <div className="text-[14px] font-medium text-[#2A2240]">{place.place_name}</div>
                              <div className="text-[12px] text-[#9B8CC4] mt-0.5">{place.road_address_name || place.address_name}</div>
                              {place.phone && (
                                <div className="text-[11px] text-[#C5BAE8] mt-0.5">{place.phone}</div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Venue selection panel */}
                {restaurantMode === 'venue' && (
                  <div className="flex flex-col gap-1.5">
                    {/* Location filter pills */}
                    {venueAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setVenueFilter('')}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                            venueFilter === ''
                              ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]'
                              : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                          }`}
                        >
                          전체
                        </button>
                        {venueAreas.map(areaTab => (
                          <button
                            key={areaTab}
                            type="button"
                            onClick={() => setVenueFilter(areaTab)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                              venueFilter === areaTab
                                ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]'
                                : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                            }`}
                          >
                            {areaTab}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Venue list */}
                    <div className="border border-[#E8E4F0] rounded-xl bg-white overflow-hidden max-h-[200px] overflow-y-auto">
                      {filteredVenues.length === 0 ? (
                        <div className="px-4 py-3 text-[13px] text-[#9B8CC4]">등록된 장소가 없습니다</div>
                      ) : (
                        filteredVenues.map(venue => (
                          <button
                            key={venue.id}
                            type="button"
                            onClick={() => selectVenue(venue)}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#F9F7FD] transition-colors border-b border-[#E8E4F0] last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#EDE9FA] text-[#8B75D0] shrink-0">
                                {venue.area}
                              </span>
                              <span className="text-[14px] font-medium text-[#2A2240] truncate">{venue.name}</span>
                            </div>
                            <div className="text-[12px] text-[#9B8CC4] mt-0.5 truncate">{venue.address}</div>
                            {venue.price_range && (
                              <div className="text-[11px] text-[#C5BAE8] mt-0.5">{venue.price_range}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Manual input */}
                {restaurantMode === 'manual' && (
                  <input
                    type="text"
                    value={restaurant}
                    onChange={(e) => setRestaurant(e.target.value)}
                    placeholder="예: 모던한정식"
                    className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
                  />
                )}
              </>
            )}
          </div>
        )}

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
      </div>
    </div>
  )
}
