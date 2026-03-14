'use client'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Edit,
  MapPin,
  Calendar,
  Clock,
  Users,
  Share2,
  MessageSquare,
  Image as ImageIcon,
  Check,
  X,
  Copy,
  QrCode,
} from 'lucide-react'
import { GeunnalEvent, EventGuest, GeunnalSubmission } from '@/types/geunnal'
import GeunnalCard from './Card'
import GeunnalBadge from './Badge'
import { BlobAvatarById } from './BlobAvatar'
import AddEventModal from './AddEventModal'
import BottomSheet from './BottomSheet'

interface EventDetailProps {
  eventId: string
  pageId: string
  token: string
  onBack: () => void
  slug: string
}

// Utility function to format date
const formatDate = (dateStr: string) => {
  if (dateStr === 'TBD') return '미정'
  const date = new Date(dateStr)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

// Utility function to format time
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

export default function EventDetail({
  eventId,
  pageId,
  token,
  onBack,
  slug,
}: EventDetailProps) {
  const [event, setEvent] = useState<GeunnalEvent | null>(null)
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [submissions, setSubmissions] = useState<GeunnalSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [newGuestName, setNewGuestName] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${slug}/share/${eventId}`

  const fetchEventData = async () => {
    try {
      setLoading(true)

      // Fetch event
      const eventRes = await fetch(`/api/geunnal/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!eventRes.ok) {
        throw new Error('이벤트 불러오기 실패')
      }

      const eventData: GeunnalEvent = await eventRes.json()
      setEvent(eventData)

      // Fetch guests
      const guestsRes = await fetch(`/api/geunnal/events/${eventId}/guests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (guestsRes.ok) {
        const guestsData: EventGuest[] = await guestsRes.json()
        setGuests(guestsData)
      }

      // Fetch submissions
      const submissionsRes = await fetch(`/api/geunnal/submissions?eventId=${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (submissionsRes.ok) {
        const submissionsData: GeunnalSubmission[] = await submissionsRes.json()
        setSubmissions(submissionsData)
      }
    } catch (error) {
      console.error('Fetch event data error:', error)
      alert('이벤트를 불러올 수 없습니다.')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEventData()
  }, [eventId, token])

  useEffect(() => {
    // Generate QR code URL
    if (shareUrl) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`
      setQrCodeUrl(qrUrl)
    }
  }, [shareUrl])

  const handleAddGuest = async () => {
    const trimmed = newGuestName.trim()
    if (!trimmed) return

    try {
      const response = await fetch(`/api/geunnal/events/${eventId}/guests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      })

      if (!response.ok) {
        throw new Error('게스트 추가 실패')
      }

      setNewGuestName('')
      fetchEventData()
    } catch (error) {
      console.error('Add guest error:', error)
      alert('게스트 추가에 실패했습니다.')
    }
  }

  const handleRemoveGuest = async (guestId: string) => {
    if (!confirm('이 게스트를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/geunnal/events/${eventId}/guests/${guestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('게스트 삭제 실패')
      }

      fetchEventData()
    } catch (error) {
      console.error('Remove guest error:', error)
      alert('게스트 삭제에 실패했습니다.')
    }
  }

  const handleToggleContacted = async (guest: EventGuest) => {
    try {
      const response = await fetch(`/api/geunnal/events/${eventId}/guests/${guest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contacted: guest.contacted ? 0 : 1 }),
      })

      if (!response.ok) {
        throw new Error('상태 변경 실패')
      }

      fetchEventData()
    } catch (error) {
      console.error('Toggle contacted error:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    alert('링크가 복사되었습니다!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7FD] flex items-center justify-center">
        <div className="text-[#9B8CC4]">로딩 중...</div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const photoSubmissions = submissions.filter((s) => s.photo_url)
  const messageSubmissions = submissions.filter((s) => s.message)

  return (
    <div className="min-h-screen bg-[#F9F7FD] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4F0] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-[#F9F7FD] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#5A5270]" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setShareModalOpen(true)}
              className="p-2 hover:bg-[#F9F7FD] rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5 text-[#8B75D0]" />
            </button>
            <button
              onClick={() => setEditModalOpen(true)}
              className="p-2 hover:bg-[#F9F7FD] rounded-lg transition-colors"
            >
              <Edit className="w-5 h-5 text-[#8B75D0]" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
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

        <h1 className="text-2xl font-bold text-[#2A2240]">
          {event.name}
        </h1>
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* Event Info */}
        <GeunnalCard>
          <h3 className="font-semibold text-[#2A2240] mb-4">이벤트 정보</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#9B8CC4] mt-0.5" />
              <div>
                <p className="text-sm text-[#5A5270]">날짜</p>
                <p className="font-medium text-[#2A2240]">
                  {formatDate(event.date)}
                </p>
              </div>
            </div>

            {event.time && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#9B8CC4] mt-0.5" />
                <div>
                  <p className="text-sm text-[#5A5270]">시간</p>
                  <p className="font-medium text-[#2A2240]">
                    {formatTime(event.time)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#9B8CC4] mt-0.5" />
              <div>
                <p className="text-sm text-[#5A5270]">장소</p>
                <p className="font-medium text-[#2A2240]">
                  {event.restaurant}
                </p>
                <p className="text-sm text-[#9B8CC4]">{event.area}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#9B8CC4] mt-0.5" />
              <div>
                <p className="text-sm text-[#5A5270]">예상 인원</p>
                <p className="font-medium text-[#2A2240]">{guests.length}명</p>
              </div>
            </div>
          </div>
        </GeunnalCard>

        {/* Guest Management */}
        <GeunnalCard>
          <h3 className="font-semibold text-[#2A2240] mb-4">
            게스트 관리 ({guests.length}명)
          </h3>

          {/* Add Guest */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddGuest()
                }
              }}
              placeholder="게스트 이름 입력"
              className="flex-1 px-4 py-2.5 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20 text-sm"
            />
            <button
              onClick={handleAddGuest}
              className="px-4 py-2.5 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors text-sm"
            >
              추가
            </button>
          </div>

          {/* Guest List */}
          <div className="space-y-2">
            {guests.length === 0 ? (
              <p className="text-center text-[#9B8CC4] py-4 text-sm">
                아직 게스트가 없습니다
              </p>
            ) : (
              guests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-3 bg-[#F9F7FD] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleContacted(guest)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        guest.contacted
                          ? 'bg-[#8B75D0] border-[#8B75D0]'
                          : 'border-[#E8E4F0]'
                      }`}
                    >
                      {guest.contacted && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <span
                      className={`font-medium ${
                        guest.contacted ? 'text-[#9B8CC4] line-through' : 'text-[#2A2240]'
                      }`}
                    >
                      {guest.name}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveGuest(guest.id)}
                    className="p-1 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-[#D4899A]" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 p-3 bg-[#EDE9FA] rounded-xl">
            <p className="text-xs text-[#5A5270]">
              ✅ 연락 완료: {guests.filter((g) => g.contacted).length}명 / 전체: {guests.length}명
            </p>
          </div>
        </GeunnalCard>

        {/* Submissions */}
        <GeunnalCard>
          <h3 className="font-semibold text-[#2A2240] mb-4">
            받은 응답 ({submissions.length})
          </h3>

          {submissions.length === 0 ? (
            <p className="text-center text-[#9B8CC4] py-8 text-sm">
              아직 받은 응답이 없습니다
            </p>
          ) : (
            <div className="space-y-4">
              {/* Photos */}
              {photoSubmissions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-[#9B8CC4]" />
                    <h4 className="font-medium text-[#2A2240] text-sm">
                      사진 ({photoSubmissions.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {photoSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="aspect-square rounded-lg overflow-hidden bg-[#F9F7FD]"
                      >
                        <img
                          src={submission.photo_url!}
                          alt="Submission"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messageSubmissions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-[#9B8CC4]" />
                    <h4 className="font-medium text-[#2A2240] text-sm">
                      메시지 ({messageSubmissions.length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {messageSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="p-3 bg-[#F9F7FD] rounded-xl"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <BlobAvatarById id={submission.avatar_id} size={32} showBorder={false} />
                          <span className="font-medium text-[#2A2240] text-sm">
                            {submission.is_anonymous ? '익명' : submission.guest_name}
                          </span>
                        </div>
                        <p className="text-sm text-[#5A5270]">{submission.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </GeunnalCard>
      </div>

      {/* Edit Modal */}
      <AddEventModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={() => {
          fetchEventData()
          setEditModalOpen(false)
        }}
        pageId={pageId}
        token={token}
        editEvent={event}
        guests={guests}
      />

      {/* Share Modal */}
      <BottomSheet
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="이벤트 공유"
      >
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-[#5A5270] mb-4">
              게스트들이 사진과 메시지를 남길 수 있는 링크입니다
            </p>

            {qrCodeUrl && (
              <div className="flex justify-center mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}

            <div className="p-3 bg-[#F9F7FD] rounded-xl border border-[#E8E4F0] mb-3">
              <p className="text-sm text-[#2A2240] break-all">{shareUrl}</p>
            </div>

            <button
              onClick={handleCopyUrl}
              className="w-full py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              링크 복사
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
