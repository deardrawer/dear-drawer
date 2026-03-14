'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, X, Settings2, MapPin, Phone, ThumbsUp, Minus, ThumbsDown, Search, Navigation, Pencil, Trash2 } from 'lucide-react'
import { GeunnalVenue, VenueRating, ReservationStatus } from '@/types/geunnal'
import GeunnalBadge from './Badge'
import GeunnalCard from './Card'
import BottomSheet from './BottomSheet'
import useKakaoMap from '@/hooks/useKakaoMap'

interface VenuePageProps {
  pageId: string
  token: string
}

const RATING_CONFIG: Record<VenueRating, { icon: typeof ThumbsUp; label: string; colorClass: string }> = {
  good: { icon: ThumbsUp, label: '좋아요', colorClass: 'text-[#8B75D0]' },
  hold: { icon: Minus, label: '보류', colorClass: 'text-[#9B8CC4]' },
  bad: { icon: ThumbsDown, label: '별로', colorClass: 'text-[#D4899A]' },
}

const RESERVATION_CONFIG: Record<ReservationStatus, { label: string; variant: 'lavender' | 'blush' | 'soft' }> = {
  available: { label: '예약가능', variant: 'lavender' },
  unavailable: { label: '예약불가', variant: 'blush' },
  unknown: { label: '확인필요', variant: 'soft' },
}

const RATING_OPTIONS: { value: VenueRating; label: string }[] = [
  { value: 'good', label: '좋아요' },
  { value: 'hold', label: '보류' },
  { value: 'bad', label: '별로' },
]

const RESERVATION_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: 'available', label: '예약가능' },
  { value: 'unavailable', label: '예약불가' },
  { value: 'unknown', label: '모름' },
]

export default function VenuePage({ pageId, token }: VenuePageProps) {
  const [venues, setVenues] = useState<GeunnalVenue[]>([])
  const [locationTabs, setLocationTabs] = useState<string[]>([])
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [editingTabs, setEditingTabs] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [editVenue, setEditVenue] = useState<GeunnalVenue | null>(null)
  const [detailVenue, setDetailVenue] = useState<GeunnalVenue | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [highlightedVenueId, setHighlightedVenueId] = useState<string | null>(null)

  const { containerRef: mapRef, error: mapError, focusVenue } = useKakaoMap({
    venues,
    onMarkerClick: (venueId) => {
      setHighlightedVenueId(venueId)
      const venue = venues.find(v => v.id === venueId)
      if (venue) {
        setDetailVenue(venue)
        setDetailOpen(true)
      }
    },
  })

  const fetchVenues = async () => {
    try {
      const res = await fetch(`/api/geunnal/venues?pageId=${pageId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = (await res.json()) as { venues: GeunnalVenue[] }
        setVenues(data.venues)
        // Extract unique areas for tabs
        const areas = [...new Set(data.venues.map(v => v.area).filter(Boolean))]
        setLocationTabs(areas)
      }
    } catch (error) {
      console.error('Fetch venues error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVenues() }, [pageId, token])

  const filtered = venues.filter(v => {
    if (areaFilter !== 'all' && v.area !== areaFilter) return false
    return true
  })

  function handleCardClick(venue: GeunnalVenue) {
    setDetailVenue(venue)
    setDetailOpen(true)
  }

  function handleAddTab() {
    const trimmed = newTabName.trim()
    if (trimmed && !locationTabs.includes(trimmed)) {
      setLocationTabs([...locationTabs, trimmed])
      setNewTabName('')
    }
  }

  function handleRemoveTab(name: string) {
    setLocationTabs(locationTabs.filter(t => t !== name))
    if (areaFilter === name) setAreaFilter('all')
  }

  function handleTabKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTab()
    }
  }

  async function handleDeleteVenue(venueId: string) {
    try {
      await fetch(`/api/geunnal/venues/${venueId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      fetchVenues()
    } catch (error) {
      console.error('Delete venue error:', error)
    }
  }

  async function handleRatingChange(venueId: string, rating: VenueRating) {
    try {
      await fetch(`/api/geunnal/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating }),
      })
      fetchVenues()
    } catch (error) {
      console.error('Update venue error:', error)
    }
  }

  async function handleReservationChange(venueId: string, reservation_status: ReservationStatus) {
    try {
      await fetch(`/api/geunnal/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reservation_status }),
      })
      fetchVenues()
    } catch (error) {
      console.error('Update venue error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7FD] flex items-center justify-center">
        <div className="text-[#9B8CC4]">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[430px] mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E4F0] px-5 py-5 flex items-center justify-between">
        <h1 className="text-xl font-medium text-[#2A2240]" style={{ fontFamily: 'Isamanru, sans-serif' }}>모임 장소</h1>
        <button
          onClick={() => setEditingTabs(!editingTabs)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
            editingTabs
              ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]'
              : 'border-[#E8E4F0] text-[#9B8CC4] hover:text-[#8B75D0] hover:border-[#8B75D0]'
          }`}
        >
          <Plus size={14} strokeWidth={2} />
          위치추가
        </button>
      </header>

      {/* Location tabs editor */}
      {editingTabs && (
        <div className="px-5 pt-3 pb-1 bg-[#F9F7FD] border-b border-[#E8E4F0]">
          <div className="flex items-center gap-2 mb-2">
            <input
              value={newTabName}
              onChange={e => setNewTabName(e.target.value)}
              onKeyDown={handleTabKeyDown}
              placeholder="위치 추가 (예: 강남역)"
              className="flex-1 h-9 px-3 rounded-[10px] bg-white border border-[#E8E4F0] text-[13px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-1 focus:ring-[#8B75D0]/30 transition-colors"
            />
            <button
              onClick={handleAddTab}
              className="h-9 px-3 rounded-[10px] border border-[#8B75D0] text-[#8B75D0] text-[13px] font-medium hover:bg-[#EDE9FA] transition-colors"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pb-3">
            {locationTabs.map(tab => (
              <span
                key={tab}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EDE9FA] text-[#8B75D0] text-[12px] font-medium rounded-xl"
              >
                {tab}
                <button
                  onClick={() => handleRemoveTab(tab)}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#8B75D0]/20"
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Location filter tabs */}
      <div className="px-5 py-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setAreaFilter('all')}
            className={`px-3 py-1.5 rounded-[22px] text-[13px] font-medium transition-colors ${
              areaFilter === 'all'
                ? 'text-white'
                : 'bg-[#F9F7FD] text-[#9B8CC4]'
            }`}
            style={areaFilter === 'all' ? { background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' } : undefined}
          >
            전체
          </button>
          {locationTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setAreaFilter(tab)}
              className={`px-3 py-1.5 rounded-[22px] text-[13px] font-medium transition-colors ${
                areaFilter === tab
                  ? 'text-white'
                  : 'bg-[#F9F7FD] text-[#9B8CC4]'
              }`}
              style={areaFilter === tab ? { background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' } : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Kakao Map */}
      <div className="px-5">
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-[200px] rounded-2xl border border-[#E8E4F0] bg-[#F9F7FD] overflow-hidden"
          />
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#F9F7FD]/90">
              <div className="text-center px-4">
                <MapPin size={24} className="mx-auto text-[#C5BAE8] mb-2" />
                <p className="text-[13px] text-[#9B8CC4]">지도를 불러올 수 없습니다</p>
                <p className="text-[11px] text-[#C5BAE8] mt-1">{mapError}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Venue list */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#9B8CC4]">{filtered.length}개 장소</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-[14px] text-[#9B8CC4]">등록된 장소가 없습니다</p>
          </div>
        ) : (
          filtered.map(venue => (
            <VenueCard
              key={venue.id}
              venue={venue}
              isHighlighted={highlightedVenueId === venue.id}
              onClick={() => handleCardClick(venue)}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditVenue(null); setAddOpen(true) }}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}
      >
        <Plus size={24} strokeWidth={2} />
      </button>

      {/* Add Venue Sheet */}
      <AddVenueSheet
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditVenue(null) }}
        onSave={() => { fetchVenues(); setAddOpen(false); setEditVenue(null) }}
        pageId={pageId}
        token={token}
        locationTabs={locationTabs}
        editVenue={editVenue}
      />

      {/* Venue Detail Sheet */}
      <VenueDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        venue={detailVenue}
        onEdit={(v) => { setEditVenue(v); setAddOpen(true); setDetailOpen(false) }}
        onDelete={(id) => { handleDeleteVenue(id); setDetailOpen(false) }}
        onRatingChange={handleRatingChange}
        onReservationChange={handleReservationChange}
        onFocusMap={(venueId) => { focusVenue(venueId); setHighlightedVenueId(venueId) }}
      />
    </div>
  )
}

/* ─── Venue Card ─── */
function VenueCard({ venue, isHighlighted, onClick }: { venue: GeunnalVenue; isHighlighted?: boolean; onClick: () => void }) {
  const ratingCfg = RATING_CONFIG[venue.rating]
  const RatingIcon = ratingCfg.icon
  const reservCfg = RESERVATION_CONFIG[venue.reservation_status]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border bg-white transition-all duration-150 ${
        isHighlighted ? 'border-[#8B75D0] ring-1 ring-[#8B75D0]/30' : 'border-[#E8E4F0]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-xl bg-[#EDE9FA] text-[#8B75D0]">
            {venue.area}
          </span>
          <h3 className="text-[15px] font-medium text-[#2A2240] truncate">{venue.name}</h3>
        </div>
        <div className={`flex items-center gap-1 shrink-0 ${ratingCfg.colorClass}`}>
          <RatingIcon size={14} strokeWidth={1.8} />
          <span className="text-[12px] font-medium">{ratingCfg.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-[#9B8CC4]">
        <MapPin size={13} strokeWidth={1.5} />
        <span className="text-[13px] truncate">{venue.address}</span>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <GeunnalBadge variant={reservCfg.variant}>{reservCfg.label}</GeunnalBadge>
        {venue.price_range && (
          <span className="text-[12px] text-[#9B8CC4]">{venue.price_range}</span>
        )}
        {venue.phone && (
          <span className="flex items-center gap-0.5 text-[12px] text-[#9B8CC4] ml-auto">
            <Phone size={11} strokeWidth={1.5} />
            {venue.phone}
          </span>
        )}
      </div>

      {venue.menu_notes && (
        <p className="mt-2 text-[13px] text-[#5A5270] line-clamp-2 leading-relaxed">
          {venue.menu_notes}
        </p>
      )}
    </button>
  )
}

/* ─── Add Venue Sheet ─── */
function AddVenueSheet({ open, onClose, onSave, pageId, token, locationTabs, editVenue }: {
  open: boolean
  onClose: () => void
  onSave: () => void
  pageId: string
  token: string
  locationTabs: string[]
  editVenue: GeunnalVenue | null
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [lat, setLat] = useState(0)
  const [lng, setLng] = useState(0)
  const [rating, setRating] = useState<VenueRating>('hold')
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>('unknown')
  const [priceRange, setPriceRange] = useState('')
  const [menuNotes, setMenuNotes] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; place_name: string; address_name: string; road_address_name: string; phone: string; x: string; y: string }>>([])
  const [showResults, setShowResults] = useState(false)
  const placesRef = useRef<{ keywordSearch: (keyword: string, callback: (results: Array<{ id: string; place_name: string; address_name: string; road_address_name: string; phone: string; x: string; y: string }>, status: string) => void) => void } | null>(null)

  const isEdit = !!editVenue

  // Initialize Kakao Places service
  useEffect(() => {
    if (!open) return
    import('@/lib/geunnalKakaoMap').then(({ loadKakaoMapSDK }) => {
      loadKakaoMapSDK().then(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any
        placesRef.current = new win.kakao.maps.services.Places()
      }).catch((err: Error) => {
        console.warn('Failed to initialize Kakao Places service:', err.message)
      })
    })
  }, [open])

  useEffect(() => {
    if (editVenue && open) {
      setName(editVenue.name)
      setAddress(editVenue.address)
      setArea(editVenue.area)
      setLat(editVenue.lat)
      setLng(editVenue.lng)
      setRating(editVenue.rating)
      setReservationStatus(editVenue.reservation_status)
      setPriceRange(editVenue.price_range || '')
      setMenuNotes(editVenue.menu_notes || '')
      setPhone(editVenue.phone || '')
    } else if (open && !editVenue) {
      resetForm()
    }
  }, [editVenue, open])

  function resetForm() {
    setName(''); setAddress(''); setArea(''); setLat(0); setLng(0)
    setRating('hold'); setReservationStatus('unknown')
    setPriceRange(''); setMenuNotes(''); setPhone('')
    setErrors({}); setSaving(false)
    setSearchQuery(''); setSearchResults([]); setShowResults(false)
  }

  function handleSearch() {
    const q = searchQuery.trim()
    if (!q || !placesRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    placesRef.current.keywordSearch(q, (results, status) => {
      if (status === win.kakao.maps.services.Status.OK) {
        setSearchResults(results.slice(0, 5))
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(true)
      }
    })
  }

  function selectPlace(place: typeof searchResults[0]) {
    setName(place.place_name)
    setAddress(place.road_address_name || place.address_name)
    setLat(parseFloat(place.y))
    setLng(parseFloat(place.x))
    if (place.phone) setPhone(place.phone)
    setShowResults(false)
    setSearchQuery('')
    setErrors(p => ({ ...p, name: '', address: '' }))
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit() {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = '식당 이름을 입력해주세요'
    if (!address.trim()) newErrors.address = '주소를 입력해주세요'
    if (!area.trim()) newErrors.area = '위치를 선택해주세요'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setSaving(true)
    try {
      const body = {
        page_id: pageId,
        name: name.trim(),
        address: address.trim(),
        area: area.trim(),
        lat: lat || 37.5050,
        lng: lng || 127.0200,
        rating,
        reservation_status: reservationStatus,
        price_range: priceRange.trim() || null,
        menu_notes: menuNotes.trim() || null,
        phone: phone.trim() || null,
      }

      if (isEdit) {
        await fetch(`/api/geunnal/venues/${editVenue.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/geunnal/venues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body),
        })
      }
      onSave()
    } catch (error) {
      console.error('Save venue error:', error)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full h-11 px-3.5 rounded-[10px] bg-white border border-[#E8E4F0] text-[15px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-1 focus:ring-[#8B75D0]/30 transition-colors"

  return (
    <BottomSheet open={open} onClose={handleClose} title={isEdit ? '장소 수정' : '장소 추가'}>
      <div className="flex flex-col gap-4 mt-2">
        {/* Kakao Place Search */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">장소 검색</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
                placeholder="식당이름 또는 주소 검색"
                className={inputClass}
              />
              <button type="button" onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#9B8CC4] hover:text-[#8B75D0] transition-colors"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {showResults && (
            <div className="border border-[#E8E4F0] rounded-[10px] bg-white overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="px-3.5 py-3 text-[13px] text-[#9B8CC4]">검색 결과가 없습니다</div>
              ) : (
                searchResults.map(place => (
                  <button key={place.id} type="button" onClick={() => selectPlace(place)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#EDE9FA]/40 transition-colors border-b border-[#E8E4F0] last:border-b-0"
                  >
                    <div className="text-[14px] font-medium text-[#2A2240]">{place.place_name}</div>
                    <div className="text-[12px] text-[#9B8CC4] mt-0.5">{place.road_address_name || place.address_name}</div>
                    {place.phone && <div className="text-[11px] text-[#C5BAE8] mt-0.5">{place.phone}</div>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">식당 이름</label>
          <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }} placeholder="예: 모던한정식" className={inputClass} />
          {errors.name && <span className="text-[12px] text-[#D4899A]">{errors.name}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">주소</label>
          <input value={address} onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })) }} placeholder="예: 서울 강남구 강남대로 328" className={inputClass} />
          {errors.address && <span className="text-[12px] text-[#D4899A]">{errors.address}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">위치</label>
          <div className="flex flex-wrap gap-1.5">
            {locationTabs.map(tab => (
              <button key={tab} type="button" onClick={() => { setArea(tab); setErrors(p => ({ ...p, area: '' })) }}
                className={`px-3 py-1.5 rounded-[22px] text-[13px] font-medium transition-colors border ${
                  area === tab ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]' : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                }`}
              >{tab}</button>
            ))}
          </div>
          <input value={!locationTabs.includes(area) ? area : ''} onChange={e => { setArea(e.target.value); setErrors(p => ({ ...p, area: '' })) }} placeholder="또는 직접 입력" className={inputClass} />
          {errors.area && <span className="text-[12px] text-[#D4899A]">{errors.area}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">평가</label>
          <div className="flex gap-2">
            {RATING_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setRating(opt.value)}
                className={`flex-1 h-10 rounded-[10px] text-[13px] font-medium transition-colors border ${
                  rating === opt.value ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]' : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                }`}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">예약 상태</label>
          <div className="grid grid-cols-3 gap-2">
            {RESERVATION_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setReservationStatus(opt.value)}
                className={`h-10 rounded-[10px] text-[12px] font-medium transition-colors border ${
                  reservationStatus === opt.value ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]' : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                }`}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">가격대 (선택)</label>
          <input value={priceRange} onChange={e => setPriceRange(e.target.value)} placeholder="예: 1인 5만원대" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">전화번호 (선택)</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="예: 02-555-1234" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">메뉴 특징 / 메모 (선택)</label>
          <textarea value={menuNotes} onChange={e => setMenuNotes(e.target.value)} placeholder="메뉴 특징이나 참고사항을 적어주세요"
            className="w-full min-h-[80px] px-3.5 py-3 rounded-[10px] bg-white border border-[#E8E4F0] text-[15px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-1 focus:ring-[#8B75D0]/30 transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <button onClick={handleClose} className="flex-1 h-11 rounded-[10px] border border-[#E8E4F0] text-[14px] font-medium text-[#5A5270] hover:bg-[#F9F7FD] transition-colors">
            취소
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 h-11 rounded-[10px] text-white text-[14px] font-medium disabled:opacity-50 transition-colors"
            style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}
          >
            {saving ? '저장 중...' : isEdit ? '수정' : '저장'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

/* ─── Venue Detail Sheet ─── */
function VenueDetailSheet({ open, onClose, venue, onEdit, onDelete, onRatingChange, onReservationChange, onFocusMap }: {
  open: boolean
  onClose: () => void
  venue: GeunnalVenue | null
  onEdit: (venue: GeunnalVenue) => void
  onDelete: (venueId: string) => void
  onRatingChange: (venueId: string, rating: VenueRating) => void
  onReservationChange: (venueId: string, status: ReservationStatus) => void
  onFocusMap?: (venueId: string) => void
}) {
  if (!venue) return null

  const DETAIL_RATING_OPTIONS: { value: VenueRating; icon: typeof ThumbsUp; label: string; activeClass: string }[] = [
    { value: 'good', icon: ThumbsUp, label: '좋아요', activeClass: 'text-[#8B75D0] border-[#8B75D0] bg-[#EDE9FA]' },
    { value: 'hold', icon: Minus, label: '보류', activeClass: 'text-[#9B8CC4] border-[#E8E4F0] bg-[#F9F7FD]' },
    { value: 'bad', icon: ThumbsDown, label: '별로', activeClass: 'text-[#D4899A] border-[#D4899A] bg-[#FAE9F0]' },
  ]

  return (
    <BottomSheet open={open} onClose={onClose} title={venue.name}>
      <div className="flex flex-col gap-4 mt-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GeunnalBadge variant="lavender">{venue.area}</GeunnalBadge>
            {venue.price_range && (
              <span className="text-[13px] text-[#5A5270]">{venue.price_range}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[#9B8CC4]">
            <MapPin size={14} strokeWidth={1.5} />
            <span className="text-[14px]">{venue.address}</span>
          </div>
          {venue.phone && (
            <div className="flex items-center gap-1.5 text-[#9B8CC4] mt-1">
              <Phone size={14} strokeWidth={1.5} />
              <a href={`tel:${venue.phone}`} className="text-[14px] text-[#8B75D0] underline">{venue.phone}</a>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">평가</label>
          <div className="flex gap-2">
            {DETAIL_RATING_OPTIONS.map(opt => {
              const Icon = opt.icon
              const isActive = venue.rating === opt.value
              return (
                <button key={opt.value} type="button" onClick={() => onRatingChange(venue.id, opt.value)}
                  className={`flex-1 h-10 rounded-[10px] text-[13px] font-medium transition-colors border flex items-center justify-center gap-1.5 ${
                    isActive ? opt.activeClass : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.8} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">예약 상태</label>
          <div className="grid grid-cols-3 gap-2">
            {RESERVATION_OPTIONS.map(opt => {
              const isActive = venue.reservation_status === opt.value
              return (
                <button key={opt.value} type="button" onClick={() => onReservationChange(venue.id, opt.value)}
                  className={`h-10 rounded-[10px] text-[12px] font-medium transition-colors border ${
                    isActive ? 'border-[#8B75D0] bg-[#EDE9FA] text-[#8B75D0]' : 'border-[#E8E4F0] bg-white text-[#9B8CC4]'
                  }`}
                >{opt.label}</button>
              )
            })}
          </div>
        </div>

        {venue.menu_notes && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">메뉴 / 메모</label>
            <p className="text-[14px] text-[#5A5270] leading-relaxed bg-[#F9F7FD] rounded-[10px] p-3">
              {venue.menu_notes}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {onFocusMap && (
            <button onClick={() => { onClose(); setTimeout(() => onFocusMap(venue.id), 150) }}
              className="w-full h-11 rounded-[10px] border border-[#E8E4F0] text-[14px] font-medium text-[#5A5270] hover:bg-[#F9F7FD] transition-colors flex items-center justify-center gap-1.5"
            >
              <Navigation size={16} strokeWidth={1.5} />
              지도에서 보기
            </button>
          )}
          <div className="flex gap-3">
            <button onClick={() => { onClose(); setTimeout(() => onEdit(venue), 150) }}
              className="flex-1 h-11 rounded-[10px] border border-[#E8E4F0] text-[14px] font-medium text-[#5A5270] hover:bg-[#F9F7FD] transition-colors flex items-center justify-center gap-1.5"
            >
              <Pencil size={15} strokeWidth={1.5} />
              수정
            </button>
            <button onClick={() => { onClose(); setTimeout(() => onDelete(venue.id), 150) }}
              className="flex-1 h-11 rounded-[10px] border border-[#D4899A] text-[14px] font-medium text-[#D4899A] hover:bg-[#FAE9F0]/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 size={15} strokeWidth={1.5} />
              삭제
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
