'use client'
import { useState, useEffect } from 'react'
import { Plus, MapPin, Phone, ThumbsUp, Minus, ThumbsDown, Edit, Trash2 } from 'lucide-react'
import { GeunnalVenue, VenueRating, ReservationStatus } from '@/types/geunnal'
import GeunnalCard from './Card'
import GeunnalBadge from './Badge'
import BottomSheet from './BottomSheet'

interface VenuePageProps {
  pageId: string
  token: string
}

export default function VenuePage({ pageId, token }: VenuePageProps) {
  const [venues, setVenues] = useState<GeunnalVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editVenue, setEditVenue] = useState<GeunnalVenue | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [phone, setPhone] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [menuNotes, setMenuNotes] = useState('')
  const [rating, setRating] = useState<VenueRating>('good')
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>('unknown')
  const [saving, setSaving] = useState(false)

  const fetchVenues = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/geunnal/venues?pageId=${pageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('장소 불러오기 실패')
      }

      const venuesResponse = (await response.json()) as { venues: GeunnalVenue[] }
      setVenues(venuesResponse.venues)
    } catch (error) {
      console.error('Fetch venues error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVenues()
  }, [pageId, token])

  const openAddModal = () => {
    setEditVenue(null)
    setName('')
    setAddress('')
    setArea('')
    setPhone('')
    setPriceRange('')
    setMenuNotes('')
    setRating('good')
    setReservationStatus('unknown')
    setAddModalOpen(true)
  }

  const openEditModal = (venue: GeunnalVenue) => {
    setEditVenue(venue)
    setName(venue.name)
    setAddress(venue.address)
    setArea(venue.area)
    setPhone(venue.phone || '')
    setPriceRange(venue.price_range || '')
    setMenuNotes(venue.menu_notes || '')
    setRating(venue.rating)
    setReservationStatus(venue.reservation_status)
    setAddModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !address.trim() || !area.trim()) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    setSaving(true)

    try {
      const venueData = {
        page_id: pageId,
        name: name.trim(),
        address: address.trim(),
        area: area.trim(),
        phone: phone.trim() || null,
        price_range: priceRange.trim() || null,
        menu_notes: menuNotes.trim() || null,
        rating,
        reservation_status: reservationStatus,
        lat: 0, // Default coordinates
        lng: 0,
      }

      if (editVenue) {
        // Update
        const response = await fetch(`/api/geunnal/venues/${editVenue.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(venueData),
        })

        if (!response.ok) {
          throw new Error('장소 수정 실패')
        }
      } else {
        // Create
        const response = await fetch('/api/geunnal/venues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(venueData),
        })

        if (!response.ok) {
          throw new Error('장소 추가 실패')
        }
      }

      setAddModalOpen(false)
      fetchVenues()
    } catch (error) {
      console.error('Save venue error:', error)
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (venueId: string) => {
    if (!confirm('이 장소를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/geunnal/venues/${venueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('장소 삭제 실패')
      }

      fetchVenues()
    } catch (error) {
      console.error('Delete venue error:', error)
      alert('장소 삭제에 실패했습니다.')
    }
  }

  const getRatingIcon = (rating: VenueRating) => {
    switch (rating) {
      case 'good':
        return <ThumbsUp className="w-4 h-4 text-[#8B75D0]" />
      case 'hold':
        return <Minus className="w-4 h-4 text-[#9B8CC4]" />
      case 'bad':
        return <ThumbsDown className="w-4 h-4 text-[#D4899A]" />
    }
  }

  const getRatingLabel = (rating: VenueRating) => {
    switch (rating) {
      case 'good':
        return '좋음'
      case 'hold':
        return '보류'
      case 'bad':
        return '별로'
    }
  }

  const getReservationLabel = (status: ReservationStatus) => {
    switch (status) {
      case 'available':
        return '예약 가능'
      case 'unavailable':
        return '예약 불가'
      case 'unknown':
        return '미확인'
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
    <div className="min-h-screen bg-[#F9F7FD] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4F0] px-5 py-4">
        <h1 className="text-xl font-bold text-[#2A2240]">장소 관리</h1>
      </div>

      <div className="px-5 py-5 space-y-4">
        {venues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9B8CC4] mb-4">아직 저장된 장소가 없습니다</p>
            <p className="text-sm text-[#C5BAE8]">
              + 버튼을 눌러 첫 장소를 추가해보세요
            </p>
          </div>
        ) : (
          venues.map((venue) => (
            <GeunnalCard key={venue.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getRatingIcon(venue.rating)}
                  <h3 className="font-semibold text-[#2A2240]">{venue.name}</h3>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(venue)}
                    className="p-1.5 hover:bg-[#F9F7FD] rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-[#8B75D0]" />
                  </button>
                  <button
                    onClick={() => handleDelete(venue.id)}
                    className="p-1.5 hover:bg-[#FAE9F0] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-[#D4899A]" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#9B8CC4] mt-0.5" />
                  <div>
                    <p className="text-[#2A2240]">{venue.address}</p>
                    <p className="text-[#9B8CC4]">{venue.area}</p>
                  </div>
                </div>

                {venue.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#9B8CC4]" />
                    <p className="text-[#5A5270]">{venue.phone}</p>
                  </div>
                )}

                {venue.price_range && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#9B8CC4]">💰</span>
                    <p className="text-[#5A5270]">{venue.price_range}</p>
                  </div>
                )}

                {venue.menu_notes && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#9B8CC4]">📝</span>
                    <p className="text-[#5A5270]">{venue.menu_notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-[#E8E4F0]">
                  <GeunnalBadge
                    variant={
                      venue.rating === 'good'
                        ? 'lavender'
                        : venue.rating === 'bad'
                        ? 'blush'
                        : 'soft'
                    }
                  >
                    {getRatingLabel(venue.rating)}
                  </GeunnalBadge>

                  <GeunnalBadge
                    variant={
                      venue.reservation_status === 'available'
                        ? 'lavender'
                        : venue.reservation_status === 'unavailable'
                        ? 'blush'
                        : 'soft'
                    }
                  >
                    {getReservationLabel(venue.reservation_status)}
                  </GeunnalBadge>
                </div>
              </div>
            </GeunnalCard>
          ))
        )}
      </div>

      {/* Add Venue Button */}
      <button
        onClick={openAddModal}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#8B75D0] text-white rounded-full shadow-lg hover:bg-[#7A64BF] transition-colors flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Modal */}
      <BottomSheet
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={editVenue ? '장소 수정' : '새 장소 추가'}
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              장소명 <span className="text-[#D4899A]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="식당 또는 장소 이름"
              className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              주소 <span className="text-[#D4899A]">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="서울시 강남구..."
              className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              required
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              지역 <span className="text-[#D4899A]">*</span>
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="예: 강남, 홍대"
              className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              전화번호
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02-123-4567"
              className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              가격대
            </label>
            <input
              type="text"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="예: 1인당 2-3만원"
              className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
            />
          </div>

          {/* Menu Notes */}
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              메모
            </label>
            <textarea
              value={menuNotes}
              onChange={(e) => setMenuNotes(e.target.value)}
              placeholder="메뉴, 특징, 주차 정보 등"
              rows={3}
              className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20 resize-none"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              평가
            </label>
            <div className="flex gap-2">
              {[
                { value: 'good', label: '좋음', icon: ThumbsUp },
                { value: 'hold', label: '보류', icon: Minus },
                { value: 'bad', label: '별로', icon: ThumbsDown },
              ].map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRating(option.value as VenueRating)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      rating === option.value
                        ? 'bg-[#8B75D0] text-white'
                        : 'bg-[#F9F7FD] text-[#5A5270] border border-[#E8E4F0]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reservation Status */}
          <div>
            <label className="block text-sm font-medium text-[#2A2240] mb-2">
              예약 가능 여부
            </label>
            <div className="flex gap-2">
              {[
                { value: 'available', label: '가능' },
                { value: 'unavailable', label: '불가' },
                { value: 'unknown', label: '미확인' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setReservationStatus(option.value as ReservationStatus)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    reservationStatus === option.value
                      ? 'bg-[#8B75D0] text-white'
                      : 'bg-[#F9F7FD] text-[#5A5270] border border-[#E8E4F0]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="flex-1 px-4 py-3 bg-[#F9F7FD] text-[#5A5270] rounded-xl font-medium hover:bg-[#EDE9FA] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : editVenue ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}
