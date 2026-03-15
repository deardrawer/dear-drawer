'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, ImagePlus, X, ChevronLeft, MapPin, CalendarDays, Users, Download, ExternalLink } from 'lucide-react'
import GeunnalCard from '@/components/geunnal/Card'
import BlobAvatar, { avatarPresets, GROOM_AVATAR_START, BRIDE_AVATAR_START, AVATARS_PER_SIDE } from '@/components/geunnal/BlobAvatar'
import type { GeunnalSubmission, EventSide } from '@/types/geunnal'
import { loadKakaoMapSDK } from '@/lib/geunnalKakaoMap'

interface GuestEventClientProps {
  eventId: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string | null
  eventSide: EventSide
  eventArea: string
  eventRestaurant: string
  guests: string[]
  groomName: string
  brideName: string
  weddingDate: string | null
  slug: string
  venueName?: string
  venueAddress?: string
  venueLat?: number
  venueLng?: number
}

type Step = 'album' | 'name' | 'upload' | 'done'

function formatDate(dateStr: string): string {
  if (!dateStr) return '날짜 미정'
  const d = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

function formatDateFull(dateStr: string): string {
  if (!dateStr) return '날짜 미정'
  const d = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m > 0 ? `${period} ${hour}시 ${m}분` : `${period} ${hour}시`
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

function isEventPast(dateStr: string, timeStr: string): boolean {
  if (!dateStr) return false
  const now = new Date()
  const eventDateTime = new Date(dateStr)
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    eventDateTime.setHours(h, m, 0, 0)
  } else {
    eventDateTime.setHours(0, 0, 0, 0)
  }
  return now.getTime() >= eventDateTime.getTime()
}

export default function GuestEventClient({
  eventId, eventName, eventDate, eventTime, eventLocation,
  eventSide, eventArea, eventRestaurant, guests: guestNames,
  groomName, brideName, weddingDate, slug,
  venueName, venueAddress, venueLat, venueLng,
}: GuestEventClientProps) {
  const [step, setStep] = useState<Step>('album')
  const [guestName, setGuestName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<number>(eventSide === 'bride' ? BRIDE_AVATAR_START : GROOM_AVATAR_START)
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState<{ file: File; preview: string; cropped?: string } | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<GeunnalSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingSubmission, setViewingSubmission] = useState<GeunnalSubmission | null>(null)

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const locationText = [eventArea, eventRestaurant].filter(Boolean).join(' ')
  const past = isEventPast(eventDate, eventTime)

  // Fetch submissions (public endpoint)
  useEffect(() => {
    fetch(`/api/geunnal/submissions?eventId=${eventId}`)
      .then(res => res.json() as Promise<{ submissions?: GeunnalSubmission[] }>)
      .then(data => setSubmissions(data.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId])

  const handlePhotoSelect = useCallback(async (file: File) => {
    setIsCompressing(true)
    try {
      const { default: imageCompression } = await import('browser-image-compression')
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })
      const preview = URL.createObjectURL(compressed)
      setPhoto({ file: compressed, preview })
      setShowCropModal(true)
    } catch {
      const preview = URL.createObjectURL(file)
      setPhoto({ file, preview })
      setShowCropModal(true)
    } finally {
      setIsCompressing(false)
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePhotoSelect(file)
    e.target.value = ''
  }, [handlePhotoSelect])

  const removePhoto = useCallback(() => {
    if (photo) {
      URL.revokeObjectURL(photo.preview)
      setPhoto(null)
    }
  }, [photo])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      let photoUrl: string | undefined

      if (photo) {
        const formData = new FormData()
        formData.append('file', photo.file)
        formData.append('pageId', slug)
        formData.append('eventId', eventId)

        const uploadRes = await fetch('/api/geunnal/upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as { url: string }
          photoUrl = uploadData.url
        }
      }

      const res = await fetch('/api/geunnal/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          guest_name: guestName,
          is_anonymous: 0,
          avatar_id: selectedAvatar,
          message: message.trim() || undefined,
          photo_url: photoUrl,
        }),
      })

      if (res.ok) {
        const data = (await res.json()) as { submission: GeunnalSubmission }
        setSubmissions(prev => [data.submission, ...prev])
        setStep('done')
      }
    } catch {
      // Silent fail
    } finally {
      setIsSubmitting(false)
    }
  }, [eventId, guestName, selectedAvatar, message, photo, slug])

  const resetForm = useCallback(() => {
    setGuestName('')
    setSelectedAvatar(Math.floor(Math.random() * avatarPresets.length))
    setMessage('')
    removePhoto()
    setStep('album')
  }, [removePhoto])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[#F9F7FD]">
        <div className="w-8 h-8 border-2 border-[#8B75D0] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F9F7FD]">
      <div className="max-w-[430px] mx-auto bg-white min-h-dvh relative flex flex-col">
        {step === 'album' && (
          <StepAlbum
            eventName={eventName} eventDate={eventDate} eventTime={eventTime}
            eventLocation={eventLocation} eventArea={eventArea} eventRestaurant={eventRestaurant}
            guestNames={guestNames} groomName={groomName} brideName={brideName}
            weddingDate={weddingDate} submissions={submissions}
            venueName={venueName} venueAddress={venueAddress}
            venueLat={venueLat} venueLng={venueLng}
            isPast={past}
            onNext={() => setStep('name')}
            onViewSubmission={setViewingSubmission}
          />
        )}
        {step === 'name' && (
          <StepName
            guestName={guestName} setGuestName={setGuestName}
            selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar}
            eventSide={eventSide}
            onBack={() => setStep('album')} onNext={() => setStep('upload')}
          />
        )}
        {step === 'upload' && (
          <StepUpload
            photo={photo} isCompressing={isCompressing} isSubmitting={isSubmitting}
            message={message} setMessage={setMessage}
            cameraRef={cameraRef} galleryRef={galleryRef}
            onFileChange={handleFileChange} onRemovePhoto={removePhoto}
            onBack={() => setStep('name')} onSubmit={handleSubmit}
            guestName={guestName} selectedAvatar={selectedAvatar}
            showCropModal={showCropModal} setShowCropModal={setShowCropModal}
            setPhoto={setPhoto}
          />
        )}
        {step === 'done' && (
          <StepDone selectedAvatar={selectedAvatar} onViewAlbum={resetForm} />
        )}
      </div>

      {/* Image Fullscreen Viewer */}
      {viewingSubmission && (
        <ImageViewer
          submission={viewingSubmission}
          onClose={() => setViewingSubmission(null)}
        />
      )}
    </div>
  )
}

/* ── Image Fullscreen Viewer ── */
function ImageViewer({ submission, onClose }: { submission: GeunnalSubmission; onClose: () => void }) {
  const handleDownload = () => {
    if (!submission.photo_url) return
    const a = document.createElement('a')
    a.href = submission.photo_url
    a.download = `photo-${submission.guest_name || 'guest'}.jpg`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
          <X size={22} strokeWidth={1.5} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-white text-[14px] font-medium">
            {submission.is_anonymous ? '익명' : submission.guest_name}
          </p>
        </div>
        {submission.photo_url ? (
          <button onClick={handleDownload} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
            <Download size={20} strokeWidth={1.5} className="text-white" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {submission.photo_url && (
          <img
            src={submission.photo_url}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
      </div>

      {/* Message */}
      {submission.message && (
        <div className="px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          <p className="text-white/90 text-[14px] text-center leading-[1.6]">{submission.message}</p>
        </div>
      )}
    </div>
  )
}

/* ── Step 1: Album (Invitation Card Style) ── */
function StepAlbum({
  eventName, eventDate, eventTime, eventLocation,
  eventArea, eventRestaurant, guestNames,
  groomName, brideName, weddingDate, submissions,
  venueName, venueAddress, venueLat, venueLng,
  isPast, onNext, onViewSubmission,
}: {
  eventName: string; eventDate: string; eventTime: string
  eventLocation: string | null; eventArea: string; eventRestaurant: string
  guestNames: string[]; groomName: string; brideName: string
  weddingDate: string | null; submissions: GeunnalSubmission[]
  venueName?: string; venueAddress?: string
  venueLat?: number; venueLng?: number
  isPast: boolean
  onNext: () => void
  onViewSubmission: (s: GeunnalSubmission) => void
}) {
  const locationDisplay = [eventArea, eventRestaurant].filter(Boolean).join(' ') || eventLocation || ''

  const openKakaoMap = () => {
    if (venueAddress) {
      window.open(`https://map.kakao.com/link/search/${encodeURIComponent(venueAddress)}`, '_blank')
    } else if (venueLat && venueLng && venueName) {
      window.open(`https://map.kakao.com/link/map/${encodeURIComponent(venueName)},${venueLat},${venueLng}`, '_blank')
    } else if (locationDisplay) {
      window.open(`https://map.kakao.com/link/search/${encodeURIComponent(locationDisplay)}`, '_blank')
    }
  }

  return (
    <>
      {/* Invitation Card */}
      <div className="bg-gradient-to-b from-[#EDE9FA]/60 to-white px-5 pt-10 pb-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-medium text-[#2A2240]">
            {groomName} & {brideName}
          </h1>
          <p className="text-[15px] text-[#5A5270] mt-1">결혼합니다</p>
          <p className="text-[13px] text-[#9B8CC4] mt-2 leading-[1.6]">
            소중한 분들과 인사를 나누고자<br />작은 식사 자리를 마련했습니다.
          </p>
        </div>

        {/* Event Invitation Card */}
        <div className="bg-white rounded-2xl border border-[#E8E4F0] shadow-sm overflow-hidden">
          {/* Event Name Header */}
          <div className="bg-gradient-to-r from-[#8B75D0]/10 to-[#D4899A]/10 px-5 py-4 text-center">
            <p className="text-[16px] font-semibold text-[#2A2240]">{eventName}</p>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3">
            {/* Date & Time */}
            {eventDate && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FA] flex items-center justify-center shrink-0">
                  <CalendarDays size={14} strokeWidth={1.5} className="text-[#8B75D0]" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#2A2240]">{formatDateFull(eventDate)}</p>
                  {eventTime && <p className="text-[12px] text-[#9B8CC4]">{formatTime(eventTime)}</p>}
                </div>
              </div>
            )}

            {/* Location */}
            {locationDisplay && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FAE9F0] flex items-center justify-center shrink-0">
                  <MapPin size={14} strokeWidth={1.5} className="text-[#D4899A]" />
                </div>
                <div className="flex-1 min-w-0">
                  {venueName ? (
                    <>
                      <p className="text-[14px] font-medium text-[#2A2240]">{venueName}</p>
                      {venueAddress && <p className="text-[12px] text-[#9B8CC4] truncate">{venueAddress}</p>}
                    </>
                  ) : (
                    <p className="text-[14px] font-medium text-[#2A2240]">{locationDisplay}</p>
                  )}
                </div>
              </div>
            )}

            {/* Guests */}
            {guestNames.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
                  <Users size={14} strokeWidth={1.5} className="text-[#66BB6A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#9B8CC4] mb-1.5">참석자</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guestNames.map((name, i) => (
                      <span
                        key={i}
                        className="inline-block px-2.5 py-1 rounded-full bg-[#F9F7FD] text-[12px] text-[#5A5270]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Kakao Map */}
          {(venueLat && venueLng) || venueAddress ? (
            <div className="px-5 pb-4">
              <KakaoMapEmbed lat={venueLat} lng={venueLng} name={venueName || locationDisplay} address={venueAddress} />
              <button
                onClick={openKakaoMap}
                className="w-full mt-2 h-9 rounded-full border border-[#E8E4F0] text-[12px] text-[#5A5270] font-medium flex items-center justify-center gap-1.5 hover:bg-[#EDE9FA]/20 transition-colors"
              >
                <ExternalLink size={12} /> 카카오맵에서 보기
              </button>
            </div>
          ) : locationDisplay ? (
            <div className="px-5 pb-4">
              <button
                onClick={openKakaoMap}
                className="w-full h-9 rounded-full border border-[#E8E4F0] text-[12px] text-[#5A5270] font-medium flex items-center justify-center gap-1.5 hover:bg-[#EDE9FA]/20 transition-colors"
              >
                <ExternalLink size={12} /> 카카오맵에서 검색
              </button>
            </div>
          ) : null}

        </div>

        <div className="w-12 h-[1px] bg-[#E8E4F0] mx-auto mt-6" />
      </div>

      {/* Submissions */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EDE9FA] flex items-center justify-center mb-4">
              <Camera size={24} strokeWidth={1.5} className="text-[#8B75D0]" />
            </div>
            <p className="text-[15px] text-[#5A5270]">
              {isPast ? '아직 올라온 사진이 없어요' : '모임 후 사진과 메시지를 남길 수 있어요'}
            </p>
            <p className="text-[13px] text-[#9B8CC4] mt-1">
              {isPast ? '첫 번째로 남겨보세요!' : '소중한 시간이 되길 바랍니다'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {submissions.map(s => (
                <GeunnalCard key={s.id} noPadding className="overflow-hidden">
                  {s.photo_url && (
                    <div
                      className="aspect-[4/3] cursor-pointer overflow-hidden"
                      onClick={() => onViewSubmission(s)}
                    >
                      <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <BlobAvatar id={s.avatar_id ?? 0} size={28} />
                      <span className="text-[12px] font-medium text-[#2A2240] truncate">
                        {s.is_anonymous ? '익명' : s.guest_name}
                      </span>
                    </div>
                    {s.message && (
                      <p className="text-[12px] text-[#5A5270] leading-[1.5] line-clamp-2">{s.message}</p>
                    )}
                    <p className="text-[10px] text-[#9B8CC4] mt-1.5">{formatRelativeTime(s.created_at)}</p>
                  </div>
                </GeunnalCard>
              ))}
            </div>

            <div className="text-center py-10 mt-4">
              <div className="w-10 h-[1px] bg-[#E8E4F0] mx-auto mb-6" />
              <p className="text-[13px] text-[#5A5270] leading-[1.8]">
                함께해 주신 소중한 마음 덕분에<br />
                오늘이 더욱 빛났습니다.<br />
                이 감동, 오래도록 간직하겠습니다.
              </p>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-[#E8E4F0] p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button
          onClick={onNext}
          disabled={!isPast}
          className="w-full py-3.5 rounded-xl text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}
        >
          {isPast ? '오늘의 소중한 순간을 기록해주세요' : '소중한 분들을 초대합니다'}
        </button>
      </div>
    </>
  )
}

/* ── Kakao Map Embed ── */
function KakaoMapEmbed({ lat, lng, name, address }: { lat?: number; lng?: number; name: string; address?: string }) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return
    let mounted = true

    loadKakaoMapSDK().then(() => {
      if (!mounted || !mapRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kakao = (window as any).kakao

      const initMap = (position: { getLat: () => number; getLng: () => number }) => {
        if (!mounted || !mapRef.current) return
        const map = new kakao.maps.Map(mapRef.current, {
          center: position,
          level: 4,
          draggable: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
        })
        new kakao.maps.Marker({ map, position })
      }

      if (lat && lng) {
        initMap(new kakao.maps.LatLng(lat, lng))
      } else if (address && kakao.maps.services) {
        const geocoder = new kakao.maps.services.Geocoder()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geocoder.addressSearch(address, (result: any[], status: string) => {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            initMap(new kakao.maps.LatLng(result[0].y, result[0].x))
          } else {
            // Fallback: keyword search
            const places = new kakao.maps.services.Places()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            places.keywordSearch(address, (res: any[], s: string) => {
              if (s === kakao.maps.services.Status.OK && res.length > 0) {
                initMap(new kakao.maps.LatLng(res[0].y, res[0].x))
              }
            })
          }
        })
      }
    }).catch(() => {})

    return () => { mounted = false }
  }, [lat, lng, address])

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl overflow-hidden border border-[#E8E4F0]"
      style={{ height: 160 }}
    />
  )
}

/* ── Step 2: Name + Avatar ── */
function StepName({
  guestName, setGuestName,
  selectedAvatar, setSelectedAvatar, eventSide, onBack, onNext,
}: {
  guestName: string; setGuestName: (v: string) => void
  selectedAvatar: number; setSelectedAvatar: (v: number) => void
  eventSide: EventSide
  onBack: () => void; onNext: () => void
}) {
  const canProceed = guestName.trim().length > 0

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex items-center gap-2 px-3 pt-4 pb-2">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#EDE9FA]/40 transition-colors">
          <ChevronLeft size={20} strokeWidth={1.5} className="text-[#2A2240]" />
        </button>
        <StepIndicator current={1} total={2} />
      </div>

      <div className="flex-1 px-5 pt-6 overflow-y-auto">
        <h2 className="text-xl font-medium text-[#2A2240] mb-1">나를 소개해주세요</h2>
        <p className="text-[13px] text-[#9B8CC4] mb-6">캐릭터와 이름이 메시지에 함께 표시돼요</p>

        <AvatarPicker selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar} eventSide={eventSide} />

        <input
          placeholder="이름을 입력하세요"
          value={guestName}
          onChange={e => setGuestName(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#E8E4F0] text-[15px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-1 focus:ring-[#8B75D0]/30 transition-colors"
        />
      </div>

      <div className="px-5 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="w-full py-3.5 rounded-xl text-[15px] font-medium text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}
        >
          다음
        </button>
      </div>
    </div>
  )
}

/* ── Step 3: Upload ── */
function StepUpload({
  photo, isCompressing, isSubmitting, message, setMessage,
  cameraRef, galleryRef, onFileChange, onRemovePhoto,
  onBack, onSubmit, guestName, selectedAvatar,
  showCropModal, setShowCropModal, setPhoto,
}: {
  photo: { file: File; preview: string; cropped?: string } | null
  isCompressing: boolean; isSubmitting: boolean
  message: string; setMessage: (v: string) => void
  cameraRef: React.RefObject<HTMLInputElement | null>
  galleryRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: () => void; onBack: () => void; onSubmit: () => void
  guestName: string; selectedAvatar: number
  showCropModal: boolean; setShowCropModal: (v: boolean) => void
  setPhoto: React.Dispatch<React.SetStateAction<{ file: File; preview: string; cropped?: string } | null>>
}) {
  const maxChars = 150
  const canSubmit = (message.trim().length > 0 || photo !== null) && !isCompressing && !isSubmitting
  const displayName = guestName

  return (
    <div className="flex flex-col min-h-dvh">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />

      <div className="flex items-center gap-2 px-3 pt-4 pb-2">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#EDE9FA]/40 transition-colors">
          <ChevronLeft size={20} strokeWidth={1.5} className="text-[#2A2240]" />
        </button>
        <StepIndicator current={2} total={2} />
      </div>

      <div className="flex-1 px-5 pt-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <BlobAvatar id={selectedAvatar} size={44} />
          <div>
            <h2 className="text-xl font-medium text-[#2A2240]">{displayName}</h2>
            <p className="text-[13px] text-[#9B8CC4]">사진과 메시지를 남겨주세요</p>
          </div>
        </div>

        {photo ? (
          <div className="relative mb-6">
            <img
              src={photo.cropped || photo.preview}
              alt="Preview"
              className="w-full rounded-2xl cursor-pointer"
              onClick={() => setShowCropModal(true)}
            />
            <button onClick={onRemovePhoto} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <X size={16} strokeWidth={1.5} className="text-white" />
            </button>
            <p className="text-[11px] text-[#9B8CC4] text-center mt-2">사진을 탭하면 위치/크기를 조정할 수 있어요</p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex gap-3">
              <button onClick={() => cameraRef.current?.click()} disabled={isCompressing}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border border-dashed border-[#E8E4F0] hover:border-[#8B75D0] hover:bg-[#EDE9FA]/20 transition-colors min-h-[44px]">
                <div className="w-12 h-12 rounded-full bg-[#EDE9FA] flex items-center justify-center">
                  <Camera size={20} strokeWidth={1.5} className="text-[#8B75D0]" />
                </div>
                <span className="text-[13px] font-medium text-[#5A5270]">카메라 촬영</span>
              </button>
              <button onClick={() => galleryRef.current?.click()} disabled={isCompressing}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border border-dashed border-[#E8E4F0] hover:border-[#8B75D0] hover:bg-[#EDE9FA]/20 transition-colors min-h-[44px]">
                <div className="w-12 h-12 rounded-full bg-[#FAE9F0] flex items-center justify-center">
                  <ImagePlus size={20} strokeWidth={1.5} className="text-[#D4899A]" />
                </div>
                <span className="text-[13px] font-medium text-[#5A5270]">갤러리 선택</span>
              </button>
            </div>
            {isCompressing && <p className="text-[12px] text-[#8B75D0] text-center mt-3 animate-pulse">사진을 처리하고 있어요...</p>}
            <p className="text-[11px] text-[#9B8CC4] text-center mt-3">사진 없이 메시지만 남길 수도 있어요</p>
          </div>
        )}

        {/* Crop Modal */}
        {showCropModal && photo && (
          <CropModal
            imageSrc={photo.preview}
            onConfirm={(croppedDataUrl) => {
              setPhoto(prev => prev ? { ...prev, cropped: croppedDataUrl } : prev)
              setShowCropModal(false)
            }}
            onCancel={() => setShowCropModal(false)}
          />
        )}

        <div className="relative">
          <textarea
            placeholder="축하 메시지를 남겨주세요"
            value={message}
            onChange={e => { if (e.target.value.length <= maxChars) setMessage(e.target.value) }}
            className="w-full min-h-[120px] px-3.5 py-3 rounded-xl bg-white border border-[#E8E4F0] text-[15px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-1 focus:ring-[#8B75D0]/30 transition-colors resize-none"
          />
          <span className={`absolute bottom-3 right-3 text-[11px] ${message.length >= maxChars ? 'text-[#D4899A]' : 'text-[#9B8CC4]'}`}>
            {message.length}/{maxChars}
          </span>
        </div>
      </div>

      <div className="px-5 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button
          disabled={!canSubmit}
          onClick={onSubmit}
          className="w-full py-3.5 rounded-xl text-[15px] font-medium text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}
        >
          {isSubmitting ? '전송 중...' : '남기기'}
        </button>
      </div>
    </div>
  )
}

/* ── Done Screen ── */
function StepDone({ selectedAvatar, onViewAlbum }: { selectedAvatar: number; onViewAlbum: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-5 text-center">
      <div className="mb-6">
        <BlobAvatar id={selectedAvatar} size={80} />
      </div>
      <h2 className="text-xl font-medium text-[#2A2240] mb-2">메시지가 전달됐어요</h2>
      <p className="text-[15px] text-[#9B8CC4] mb-8">소중한 축하를 남겨주셔서 감사합니다</p>
      <button
        onClick={onViewAlbum}
        className="px-6 py-3 rounded-xl text-[14px] font-medium border border-[#8B75D0] text-[#8B75D0] hover:bg-[#EDE9FA]/50 transition-colors"
      >
        앨범 보러가기
      </button>
    </div>
  )
}

/* ── Avatar Picker ── */
function AvatarPicker({ selectedAvatar, setSelectedAvatar, eventSide }: {
  selectedAvatar: number; setSelectedAvatar: (v: number) => void; eventSide: EventSide
}) {
  const showBothSides = eventSide === 'both'
  const isGroomSide = selectedAvatar < BRIDE_AVATAR_START
  const defaultSide = eventSide === 'bride' ? 'bride' : 'groom'
  const [side, setSide] = useState<'groom' | 'bride'>(showBothSides ? (isGroomSide ? 'groom' : 'bride') : defaultSide)

  const start = side === 'groom' ? GROOM_AVATAR_START : BRIDE_AVATAR_START
  const indices = Array.from({ length: AVATARS_PER_SIDE }, (_, i) => start + i)

  const handleSideChange = (newSide: 'groom' | 'bride') => {
    setSide(newSide)
    const offset = selectedAvatar < BRIDE_AVATAR_START ? selectedAvatar : selectedAvatar - BRIDE_AVATAR_START
    const newStart = newSide === 'groom' ? GROOM_AVATAR_START : BRIDE_AVATAR_START
    setSelectedAvatar(newStart + (offset % AVATARS_PER_SIDE))
  }

  return (
    <div className="mb-6">
      <p className="text-[13px] font-medium text-[#2A2240] mb-3">캐릭터 선택</p>

      {showBothSides && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleSideChange('groom')}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
              side === 'groom'
                ? 'bg-[#90CAF9]/20 text-[#5B9BD5] ring-1 ring-[#90CAF9]'
                : 'bg-[#F9F7FD] text-[#9B8CC4] hover:bg-[#90CAF9]/10'
            }`}
          >
            신랑측 하객
          </button>
          <button
            onClick={() => handleSideChange('bride')}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
              side === 'bride'
                ? 'bg-[#F48FB1]/20 text-[#E06088] ring-1 ring-[#F48FB1]'
                : 'bg-[#F9F7FD] text-[#9B8CC4] hover:bg-[#F48FB1]/10'
            }`}
          >
            신부측 하객
          </button>
        </div>
      )}

      <div className="grid grid-cols-6 gap-2">
        {indices.map(i => (
          <button
            key={i}
            onClick={() => setSelectedAvatar(i)}
            className={`p-1 rounded-xl transition-all ${
              selectedAvatar === i
                ? `scale-110 ${side === 'groom' ? 'bg-[#90CAF9]/20 ring-2 ring-[#90CAF9]' : 'bg-[#F48FB1]/20 ring-2 ring-[#F48FB1]'}`
                : 'hover:bg-[#F9F7FD]'
            }`}
          >
            <BlobAvatar id={i} size={44} />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Step Indicator ── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
          i + 1 <= current ? 'w-6' : 'w-2 bg-[#E8E4F0]'
        }`} style={i + 1 <= current ? { background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' } : {}} />
      ))}
    </div>
  )
}

/* ── Crop Modal ── */
function CropModal({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const dragState = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)
  const pinchState = useRef<{ dist: number; scale: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchState.current = { dist: Math.hypot(dx, dy), scale }
      dragState.current = null
    } else if (e.touches.length === 1) {
      dragState.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, ox: offsetX, oy: offsetY }
    }
  }, [scale, offsetX, offsetY])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && pinchState.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const newScale = Math.max(0.5, Math.min(4, pinchState.current.scale * (dist / pinchState.current.dist)))
      setScale(newScale)
    } else if (e.touches.length === 1 && dragState.current) {
      setOffsetX(dragState.current.ox + (e.touches[0].clientX - dragState.current.startX))
      setOffsetY(dragState.current.oy + (e.touches[0].clientY - dragState.current.startY))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    dragState.current = null
    pinchState.current = null
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragState.current = { startX: e.clientX, startY: e.clientY, ox: offsetX, oy: offsetY }
  }, [offsetX, offsetY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current) return
    setOffsetX(dragState.current.ox + (e.clientX - dragState.current.startX))
    setOffsetY(dragState.current.oy + (e.clientY - dragState.current.startY))
  }, [])

  const handleMouseUp = useCallback(() => {
    dragState.current = null
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale(prev => Math.max(0.5, Math.min(4, prev - e.deltaY * 0.002)))
  }, [])

  const handleConfirm = useCallback(() => {
    if (!containerRef.current || !imgRef.current) return
    const container = containerRef.current.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    const outputW = 1200
    const outputH = 900 // 4:3
    canvas.width = outputW
    canvas.height = outputH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imgRef.current
    const imgDisplayW = container.width * scale
    const imgDisplayH = (img.naturalHeight / img.naturalWidth) * imgDisplayW
    const imgLeft = (container.width - imgDisplayW) / 2 + offsetX
    const imgTop = (container.height - imgDisplayH) / 2 + offsetY

    const sx = (-imgLeft / imgDisplayW) * img.naturalWidth
    const sy = (-imgTop / imgDisplayH) * img.naturalHeight
    const sw = (container.width / imgDisplayW) * img.naturalWidth
    const sh = (container.height / imgDisplayH) * img.naturalHeight

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputW, outputH)
    onConfirm(canvas.toDataURL('image/jpeg', 0.9))
  }, [scale, offsetX, offsetY, onConfirm])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} className="text-white text-[14px]">취소</button>
        <p className="text-white text-[14px] font-medium">사진 조정</p>
        <button onClick={handleConfirm} className="text-[#B87AAB] text-[14px] font-medium">완료</button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-2xl touch-none select-none"
          style={{ aspectRatio: '4/3', cursor: 'grab' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop"
            className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
              width: '100%',
            }}
            draggable={false}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 px-8 py-4">
        <span className="text-white/60 text-[12px]">-</span>
        <input
          type="range"
          min="0.5"
          max="4"
          step="0.1"
          value={scale}
          onChange={e => setScale(parseFloat(e.target.value))}
          className="flex-1 h-1 accent-[#B87AAB]"
        />
        <span className="text-white/60 text-[12px]">+</span>
      </div>
    </div>
  )
}
