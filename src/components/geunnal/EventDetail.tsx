'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Wallet,
  Image as ImageIcon,
  MessageCircle,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  UserCheck,
  UserX,
  Eye,
  Download,
  Link,
  Send,
  ExternalLink,
  Navigation,
  Phone,
} from 'lucide-react'
import { GeunnalEvent, EventGuest, GeunnalSubmission, GeunnalVenue } from '@/types/geunnal'
import GeunnalCard from './Card'
import GeunnalBadge from './Badge'
import { BlobAvatarById } from './BlobAvatar'
import AddEventModal from './AddEventModal'

interface EventDetailProps {
  eventId: string
  pageId: string
  token: string
  onBack: () => void
  slug: string
  ogImage?: string
}

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr === 'TBD') return '날짜 미정'
  const date = new Date(dateStr)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

const formatRelativeTime = (dateStr: string) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay}일 전`
  return `${Math.floor(diffDay / 30)}달 전`
}

export default function EventDetail({
  eventId,
  pageId,
  token,
  onBack,
  slug,
  ogImage,
}: EventDetailProps) {
  const [event, setEvent] = useState<GeunnalEvent | null>(null)
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [submissions, setSubmissions] = useState<GeunnalSubmission[]>([])
  const [venue, setVenue] = useState<GeunnalVenue | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [newGuestName, setNewGuestName] = useState('')
  const [editingCost, setEditingCost] = useState(false)
  const [costInput, setCostInput] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [viewingPhoto, setViewingPhoto] = useState<GeunnalSubmission | null>(null)
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${slug}/share/${eventId}`

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2000)
  }, [])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      const headers = { 'Authorization': `Bearer ${token}` }

      const [eventRes, guestsRes, submissionsRes] = await Promise.all([
        fetch(`/api/geunnal/events/${eventId}`, { headers }),
        fetch(`/api/geunnal/events/${eventId}/guests`, { headers }),
        fetch(`/api/geunnal/submissions?eventId=${eventId}`, { headers }),
      ])

      if (!eventRes.ok) throw new Error('모임 불러오기 실패')

      const eventData = (await eventRes.json()) as { event: GeunnalEvent }
      setEvent(eventData.event)

      if (guestsRes.ok) {
        const guestsData = (await guestsRes.json()) as { guests: EventGuest[] }
        setGuests(guestsData.guests)
      }

      if (submissionsRes.ok) {
        const subData = (await submissionsRes.json()) as { submissions: GeunnalSubmission[] }
        setSubmissions(subData.submissions)
      }

      // Fetch venue linked to this event
      try {
        const venuesRes = await fetch(`/api/geunnal/venues?pageId=${pageId}`, { headers })
        if (venuesRes.ok) {
          const venuesData = (await venuesRes.json()) as { venues: GeunnalVenue[] }
          const linked = venuesData.venues.find(v => v.event_id === eventId)
          setVenue(linked || null)
        }
      } catch { /* ignore */ }
    } catch (error) {
      console.error('Fetch event data error:', error)
      alert('모임을 불러올 수 없습니다.')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEventData() }, [eventId, token])

  // --- Guest management ---
  const handleAddGuest = async () => {
    const trimmed = newGuestName.trim()
    if (!trimmed) return
    try {
      await fetch(`/api/geunnal/events/${eventId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: trimmed }),
      })
      setNewGuestName('')
      fetchEventData()
      showToast(`${trimmed}님이 추가되었습니다`)
    } catch { showToast('게스트 추가에 실패했습니다') }
  }

  const handleRemoveGuest = async (guestId: string) => {
    try {
      await fetch(`/api/geunnal/events/${eventId}/guests/${guestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      fetchEventData()
    } catch { showToast('게스트 삭제에 실패했습니다') }
  }

  const handleToggleContacted = async (guest: EventGuest) => {
    try {
      await fetch(`/api/geunnal/events/${eventId}/guests/${guest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contacted: guest.contacted ? 0 : 1 }),
      })
      fetchEventData()
    } catch { showToast('상태 변경에 실패했습니다') }
  }

  // --- Cost editing ---
  const startCostEdit = () => {
    setCostInput(event?.total_cost ? String(event.total_cost) : '')
    setEditingCost(true)
  }

  const saveCost = async () => {
    const val = parseInt(costInput.replace(/[^0-9]/g, ''), 10)
    try {
      await fetch(`/api/geunnal/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ total_cost: isNaN(val) || val === 0 ? null : val }),
      })
      setEditingCost(false)
      fetchEventData()
      showToast('비용이 수정되었습니다')
    } catch { showToast('비용 수정에 실패했습니다') }
  }

  const resetCost = async () => {
    if (!confirm('비용을 초기화하시겠습니까?\n완료된 모임에서 미정 모임으로 이동합니다.')) return
    try {
      await fetch(`/api/geunnal/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ total_cost: null }),
      })
      fetchEventData()
      showToast('비용이 초기화되었습니다')
    } catch { showToast('비용 초기화에 실패했습니다') }
  }

  // --- Delete ---
  const handleDelete = async () => {
    if (!confirm(`'${event?.name}' 모임을 삭제하시겠습니까?`)) return
    try {
      await fetch(`/api/geunnal/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      showToast('모임이 삭제되었습니다')
      onBack()
    } catch { showToast('삭제에 실패했습니다') }
  }

  // --- Share ---
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('링크가 복사되었습니다')
    } catch { showToast('링크 복사에 실패했습니다') }
  }

  const handleKakaoShare = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any
      if (!win.Kakao?.Share) {
        showToast('카카오톡 공유를 사용할 수 없습니다')
        return
      }
      const locationText = event?.restaurant || event?.area || '장소 미정'
      win.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${event!.name}에 초대합니다`,
          description: `${formatDate(event!.date)} ${formatTime(event!.time)} | ${locationText}`,
          imageUrl: ogImage || 'https://invite.deardrawer.com/og-image.png',
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [
          { title: '참여하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } },
        ],
      })
    } catch { showToast('카카오톡 공유에 실패했습니다') }
  }

  const openKakaoMap = () => {
    if (venue) {
      window.open(`https://map.kakao.com/link/map/${encodeURIComponent(venue.name)},${venue.lat},${venue.lng}`, '_blank')
    } else {
      const locationText = [event?.area, event?.restaurant].filter(Boolean).join(' ')
      if (locationText) {
        window.open(`https://map.kakao.com/link/search/${encodeURIComponent(locationText)}`, '_blank')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7FD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#8B75D0] border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-[#9B8CC4]">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!event) return null

  const contactedCount = guests.filter(g => g.contacted).length
  const locationText = [event.area, event.restaurant].filter(Boolean).join(' ')
  const photos = submissions.filter(s => s.photo_url)
  const messages = submissions.filter(s => s.message)

  return (
    <div className="min-h-screen bg-[#F9F7FD] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E4F0] px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F9F7FD] transition-colors shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={1.5} className="text-[#5A5270]" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <GeunnalBadge
                variant={event.side === 'groom' ? 'lavender' : event.side === 'bride' ? 'blush' : 'soft'}
              >
                {event.side === 'groom' ? '신랑측' : event.side === 'bride' ? '신부측' : '공동'}
              </GeunnalBadge>
              {event.meal_type && (
                <GeunnalBadge variant="soft">
                  {event.meal_type === 'lunch' ? '점심' : event.meal_type === 'dinner' ? '저녁' : '기타'}
                </GeunnalBadge>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#2A2240] mt-1 truncate">{event.name}</h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F9F7FD] transition-colors"
            >
              <Pencil size={18} strokeWidth={1.5} className="text-[#9B8CC4]" />
            </button>
            <button
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} strokeWidth={1.5} className="text-red-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 py-5 flex flex-col gap-5">
        {/* Event Info Card */}
        <GeunnalCard>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} strokeWidth={1.5} className="text-[#8B75D0] shrink-0" />
              <span className="text-[14px] text-[#5A5270]">
                {event.date ? `${formatDate(event.date)} ${formatTime(event.time)}` : '날짜 미정'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} strokeWidth={1.5} className="text-[#8B75D0] shrink-0" />
              <span className="text-[14px] text-[#5A5270] flex-1">{locationText || '장소 미정'}</span>
              {locationText && (
                <button onClick={openKakaoMap} className="text-[#8B75D0]">
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} strokeWidth={1.5} className="text-[#8B75D0] shrink-0" />
              <span className="text-[14px] text-[#5A5270]">
                {event.meal_type === 'lunch' ? '점심' : event.meal_type === 'dinner' ? '저녁' : '기타'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} strokeWidth={1.5} className="text-[#8B75D0] shrink-0" />
              <span className="text-[14px] text-[#5A5270]">
                참석 예정 {event.expected_guests || guests.length}명 · 연락완료 {contactedCount}/{guests.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet size={16} strokeWidth={1.5} className="text-[#8B75D0] shrink-0" />
              {editingCost ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={costInput}
                    onChange={e => setCostInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={e => { if (e.key === 'Enter') saveCost() }}
                    placeholder="비용 입력"
                    className="flex-1 h-8 px-2.5 rounded-lg border border-[#E8E4F0] text-[14px] text-[#2A2240] focus:outline-none focus:border-[#8B75D0]"
                    autoFocus
                  />
                  <span className="text-[13px] text-[#9B8CC4] shrink-0">원</span>
                  <button onClick={saveCost} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#EDE9FA]">
                    <Check size={14} className="text-[#8B75D0]" />
                  </button>
                  <button onClick={() => setEditingCost(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F9F7FD]">
                    <X size={14} className="text-[#9B8CC4]" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={startCostEdit}
                    className="text-[14px] text-[#5A5270] hover:text-[#8B75D0] transition-colors flex items-center gap-1"
                  >
                    {event.total_cost ? `${event.total_cost.toLocaleString()}원` : '비용 입력'}
                    <Pencil size={12} className="text-[#9B8CC4]" />
                  </button>
                  {event.total_cost && event.total_cost > 0 && (
                    <button
                      onClick={resetCost}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors ml-1"
                      title="비용 초기화"
                    >
                      <X size={13} strokeWidth={1.5} className="text-red-400" />
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2 mt-1">
              <GeunnalBadge variant="lavender">
                <span className="flex items-center gap-1">
                  <ImageIcon size={12} strokeWidth={1.5} /> 사진 {photos.length}
                </span>
              </GeunnalBadge>
              <GeunnalBadge variant="blush">
                <span className="flex items-center gap-1">
                  <MessageCircle size={12} strokeWidth={1.5} /> 메시지 {messages.length}
                </span>
              </GeunnalBadge>
            </div>
          </div>
        </GeunnalCard>

        {/* Location Map Card */}
        {(venue || locationText) && (
          <GeunnalCard noPadding>
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <Navigation size={16} strokeWidth={1.5} className="text-[#8B75D0]" />
              <p className="text-[15px] font-medium text-[#2A2240]">장소</p>
            </div>
            {venue ? (
              <>
                <div className="px-4 py-3">
                  <p className="text-[14px] font-medium text-[#2A2240]">{venue.name}</p>
                  <p className="text-[12px] text-[#9B8CC4] mt-0.5">{venue.address}</p>
                  {venue.phone && (
                    <a
                      href={`tel:${venue.phone}`}
                      className="flex items-center gap-1 text-[13px] text-[#8B75D0] mt-1.5"
                    >
                      <Phone size={12} /> {venue.phone}
                    </a>
                  )}
                  {venue.menu_notes && (
                    <p className="text-[12px] text-[#9B8CC4] mt-1.5 bg-[#F9F7FD] rounded-lg px-3 py-2">
                      {venue.menu_notes}
                    </p>
                  )}
                  <button
                    onClick={openKakaoMap}
                    className="w-full mt-3 h-9 rounded-full border border-[#E8E4F0] text-[13px] text-[#5A5270] font-medium flex items-center justify-center gap-1.5 hover:bg-[#EDE9FA]/20 transition-colors"
                  >
                    <ExternalLink size={14} /> 카카오맵에서 보기
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 pb-4">
                <p className="text-[14px] text-[#5A5270]">{locationText}</p>
                <button
                  onClick={openKakaoMap}
                  className="w-full mt-2 h-9 rounded-full border border-[#E8E4F0] text-[13px] text-[#5A5270] font-medium flex items-center justify-center gap-1.5 hover:bg-[#EDE9FA]/20 transition-colors"
                >
                  <ExternalLink size={14} /> 카카오맵에서 검색
                </button>
              </div>
            )}
          </GeunnalCard>
        )}

        {/* Guest List */}
        <GeunnalCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[15px] font-medium text-[#2A2240]">
              참석자 ({guests.length}명)
            </p>
            {guests.length > 0 && (
              <GeunnalBadge variant="soft">
                연락 {contactedCount}/{guests.length}
              </GeunnalBadge>
            )}
          </div>

          {/* Add guest input */}
          <div className="flex gap-2 mb-3">
            <input
              value={newGuestName}
              onChange={e => setNewGuestName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGuest() } }}
              placeholder="참석자 이름 입력"
              className="flex-1 h-10 px-3 rounded-xl border border-[#E8E4F0] text-[13px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] transition-colors"
            />
            <button
              onClick={handleAddGuest}
              className="h-10 px-3 rounded-xl border border-[#E8E4F0] text-[13px] font-medium text-[#5A5270] hover:bg-[#EDE9FA]/40 transition-colors flex items-center gap-1"
            >
              <Plus size={14} strokeWidth={1.5} />
              추가
            </button>
          </div>

          {guests.length > 0 && (
            <div className="flex flex-col gap-1">
              {guests.map(guest => (
                <div
                  key={guest.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    guest.contacted ? 'bg-[#EDE9FA]/20' : 'hover:bg-[#F9F7FD]'
                  }`}
                >
                  <button
                    onClick={() => handleToggleContacted(guest)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <BlobAvatarById id={guest.name.charCodeAt(0) % 24} size={32} showBorder={false} />
                    <span className={`flex-1 text-[14px] truncate ${guest.contacted ? 'text-[#2A2240] font-medium' : 'text-[#5A5270]'}`}>
                      {guest.name}
                    </span>
                    {guest.contacted ? (
                      <UserCheck size={16} className="text-[#8B75D0] shrink-0" />
                    ) : (
                      <UserX size={16} className="text-[#9B8CC4] shrink-0" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemoveGuest(guest.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors shrink-0"
                  >
                    <X size={14} strokeWidth={1.5} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GeunnalCard>

        {/* Guest Page Preview */}
        <button
          onClick={() => window.open(shareUrl, '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#8B75D0]/30 bg-[#EDE9FA]/20 text-[#8B75D0] text-[14px] font-medium hover:bg-[#EDE9FA]/40 active:scale-[0.98] transition-all"
        >
          <Eye size={18} strokeWidth={1.5} />
          하객 공유 페이지 미리보기
        </button>

        {/* Share */}
        <GeunnalCard>
          <div className="flex items-center gap-2 mb-3">
            <Send size={16} strokeWidth={1.5} className="text-[#8B75D0]" />
            <p className="text-[15px] font-medium text-[#2A2240]">공유하기</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleCopyLink}
              className="w-full h-10 rounded-xl border border-[#E8E4F0] text-[13px] font-medium text-[#5A5270] flex items-center justify-center gap-1.5 hover:bg-[#F9F7FD] transition-colors"
            >
              <Link size={16} strokeWidth={1.5} />
              링크 복사
            </button>
            <button
              onClick={handleKakaoShare}
              className="w-full h-11 rounded-full font-medium text-[15px] inline-flex items-center justify-center gap-2 bg-[#FEE500] text-[#191919] active:bg-[#FDD835] transition-colors"
            >
              <Send size={16} strokeWidth={1.5} />
              카카오톡 공유
            </button>
          </div>
        </GeunnalCard>

        {/* Photos Section */}
        {photos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[15px] font-medium text-[#2A2240]">사진 ({photos.length})</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map(s => (
                <div
                  key={s.id}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
                  onClick={() => setViewingPhoto(s)}
                >
                  <img src={s.photo_url!} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6">
                    <p className="text-white text-[10px] font-medium truncate">
                      {s.is_anonymous ? '익명' : s.guest_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Messages Section */}
        {messages.length > 0 && (
          <section>
            <p className="text-[15px] font-medium text-[#2A2240] mb-3">메시지 ({messages.length})</p>
            <div className="flex flex-col gap-2">
              {messages.map(msg => (
                <GeunnalCard key={msg.id}>
                  <div className="flex gap-3">
                    <BlobAvatarById id={msg.avatar_id ?? 0} size={36} showBorder={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[13px] font-medium text-[#2A2240] truncate">
                          {msg.is_anonymous ? '익명' : msg.guest_name}
                        </p>
                        <span className="text-[11px] text-[#9B8CC4] shrink-0">
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#5A5270] mt-1">{msg.message}</p>
                      {msg.photo_url && (
                        <img
                          src={msg.photo_url} alt=""
                          className="mt-2 w-20 h-20 rounded-lg object-cover cursor-pointer active:scale-[0.97] transition-transform"
                          onClick={() => setViewingPhoto(msg)}
                        />
                      )}
                    </div>
                  </div>
                </GeunnalCard>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Photo Viewer */}
      {viewingPhoto?.photo_url && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setViewingPhoto(null)}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingPhoto(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
              <X size={22} strokeWidth={1.5} className="text-white" />
            </button>
            <p className="text-white text-[14px] font-medium">
              {viewingPhoto.is_anonymous ? '익명' : viewingPhoto.guest_name}
            </p>
            <button
              onClick={() => {
                const a = document.createElement('a')
                a.href = viewingPhoto.photo_url!
                a.download = `photo-${viewingPhoto.guest_name || 'guest'}.jpg`
                a.target = '_blank'
                a.rel = 'noopener noreferrer'
                a.click()
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              <Download size={20} strokeWidth={1.5} className="text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={viewingPhoto.photo_url!} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
          {viewingPhoto.message && (
            <div className="px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
              <p className="text-white/90 text-[14px] text-center leading-[1.6]">{viewingPhoto.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <AddEventModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={() => { fetchEventData(); setEditModalOpen(false) }}
        pageId={pageId}
        token={token}
        editEvent={event}
        guests={guests}
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#2A2240] text-white text-[13px] rounded-full shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
