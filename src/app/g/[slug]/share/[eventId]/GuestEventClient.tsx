'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, ImagePlus, X, ChevronLeft, MapPin, CalendarDays } from 'lucide-react'
import GeunnalCard from '@/components/geunnal/Card'
import BlobAvatar, { avatarPresets, GROOM_AVATAR_START, BRIDE_AVATAR_START, AVATARS_PER_SIDE } from '@/components/geunnal/BlobAvatar'
import type { GeunnalSubmission } from '@/types/geunnal'

interface GuestEventClientProps {
  eventId: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string | null
  groomName: string
  brideName: string
  weddingDate: string | null
  slug: string
}

type Step = 'album' | 'name' | 'upload' | 'done'

function formatDate(dateStr: string): string {
  if (!dateStr) return '날짜 미정'
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

function getDday(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export default function GuestEventClient({
  eventId, eventName, eventDate, eventTime, eventLocation,
  groomName, brideName, weddingDate, slug,
}: GuestEventClientProps) {
  const [step, setStep] = useState<Step>('album')
  const [guestName, setGuestName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<number>(0)
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<GeunnalSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

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
    } catch {
      const preview = URL.createObjectURL(file)
      setPhoto({ file, preview })
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

      // Upload photo if exists
      if (photo) {
        const pageId = slug // use slug as identifier for upload path
        const formData = new FormData()
        formData.append('file', photo.file)
        formData.append('pageId', pageId)
        formData.append('eventId', eventId)

        const uploadRes = await fetch('/api/geunnal/upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as { url: string }
          photoUrl = uploadData.url
        }
      }

      // Create submission
      const res = await fetch('/api/geunnal/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          guest_name: isAnonymous ? '익명' : guestName,
          is_anonymous: isAnonymous ? 1 : 0,
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
  }, [eventId, guestName, isAnonymous, selectedAvatar, message, photo, slug])

  const resetForm = useCallback(() => {
    setGuestName('')
    setIsAnonymous(false)
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
            eventLocation={eventLocation} groomName={groomName} brideName={brideName}
            weddingDate={weddingDate} submissions={submissions}
            onNext={() => setStep('name')}
          />
        )}
        {step === 'name' && (
          <StepName
            guestName={guestName} setGuestName={setGuestName}
            isAnonymous={isAnonymous} setIsAnonymous={setIsAnonymous}
            selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar}
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
            guestName={guestName} isAnonymous={isAnonymous} selectedAvatar={selectedAvatar}
          />
        )}
        {step === 'done' && (
          <StepDone selectedAvatar={selectedAvatar} onViewAlbum={resetForm} />
        )}
      </div>
    </div>
  )
}

/* Step 1: Album */
function StepAlbum({
  eventName, eventDate, eventTime, eventLocation,
  groomName, brideName, weddingDate, submissions, onNext,
}: {
  eventName: string; eventDate: string; eventTime: string
  eventLocation: string | null; groomName: string; brideName: string
  weddingDate: string | null; submissions: GeunnalSubmission[]
  onNext: () => void
}) {
  const dday = weddingDate ? getDday(weddingDate) : null
  const ddayText = dday === null ? '' : dday === 0 ? 'D-DAY' : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#EDE9FA]/60 to-white px-5 pt-10 pb-6 text-center">
        <h1 className="text-xl font-medium text-[#2A2240]">
          {groomName} & {brideName}
        </h1>
        <p className="text-[15px] text-[#5A5270] mt-1">결혼합니다</p>

        <div className="flex flex-col items-center gap-1.5 mt-4">
          {eventDate && (
            <div className="flex items-center gap-1.5 text-[#9B8CC4]">
              <CalendarDays size={14} strokeWidth={1.5} />
              <span className="text-[13px]">{formatDate(eventDate)} {formatTime(eventTime)}</span>
            </div>
          )}
          {eventLocation && (
            <div className="flex items-center gap-1.5 text-[#9B8CC4]">
              <MapPin size={14} strokeWidth={1.5} />
              <span className="text-[13px]">{eventLocation}</span>
            </div>
          )}
        </div>

        {ddayText && (
          <span className={`inline-block mt-4 px-4 py-1.5 rounded-full text-[12px] font-semibold ${
            dday === 0 ? 'bg-[#8B75D0]/20 text-[#8B75D0]' : (dday ?? 0) > 0 ? 'bg-white/80 text-[#8B75D0] shadow-sm' : 'bg-[#FAE9F0] text-[#D4899A]'
          }`}>
            {ddayText}
          </span>
        )}
        <div className="w-12 h-[1px] bg-[#E8E4F0] mx-auto mt-5" />
      </div>

      {/* Event info */}
      <div className="px-5 pt-4 pb-6 text-center flex flex-col items-center gap-1">
        <p className="text-[14px] font-medium text-[#2A2240]">{eventName}</p>
        {eventDate && (
          <p className="text-[12px] text-[#9B8CC4]">{formatDate(eventDate)} {formatTime(eventTime)}</p>
        )}
        {eventLocation && (
          <p className="text-[12px] text-[#9B8CC4]">{eventLocation}</p>
        )}
      </div>

      {/* Submissions */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EDE9FA] flex items-center justify-center mb-4">
              <Camera size={24} strokeWidth={1.5} className="text-[#8B75D0]" />
            </div>
            <p className="text-[15px] text-[#5A5270]">아직 올라온 사진이 없어요</p>
            <p className="text-[13px] text-[#9B8CC4] mt-1">첫 번째로 남겨보세요!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {submissions.map(s => (
                <GeunnalCard key={s.id} noPadding className="overflow-hidden">
                  {s.photo_url && (
                    <div className="aspect-square">
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
          className="w-full py-3.5 rounded-xl text-[15px] font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}
        >
          오늘의 소중한 순간을 기록해주세요
        </button>
      </div>
    </>
  )
}

/* Step 2: Name + Avatar */
function StepName({
  guestName, setGuestName, isAnonymous, setIsAnonymous,
  selectedAvatar, setSelectedAvatar, onBack, onNext,
}: {
  guestName: string; setGuestName: (v: string) => void
  isAnonymous: boolean; setIsAnonymous: (v: boolean) => void
  selectedAvatar: number; setSelectedAvatar: (v: number) => void
  onBack: () => void; onNext: () => void
}) {
  const canProceed = isAnonymous || guestName.trim().length > 0

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

        <AvatarPicker selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar} />

        {/* Anonymous toggle */}
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={e => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded accent-[#8B75D0]"
          />
          <span className="text-[13px] text-[#5A5270]">익명으로 남기기</span>
        </label>

        {/* Name input */}
        {!isAnonymous && (
          <input
            placeholder="이름을 입력하세요"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#E8E4F0] text-[15px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-1 focus:ring-[#8B75D0]/30 transition-colors"
          />
        )}
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

/* Step 3: Upload */
function StepUpload({
  photo, isCompressing, isSubmitting, message, setMessage,
  cameraRef, galleryRef, onFileChange, onRemovePhoto,
  onBack, onSubmit, guestName, isAnonymous, selectedAvatar,
}: {
  photo: { file: File; preview: string } | null
  isCompressing: boolean; isSubmitting: boolean
  message: string; setMessage: (v: string) => void
  cameraRef: React.RefObject<HTMLInputElement | null>
  galleryRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: () => void; onBack: () => void; onSubmit: () => void
  guestName: string; isAnonymous: boolean; selectedAvatar: number
}) {
  const maxChars = 150
  const canSubmit = (message.trim().length > 0 || photo !== null) && !isCompressing && !isSubmitting
  const displayName = isAnonymous ? '익명' : guestName

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
            <img src={photo.preview} alt="Preview" className="w-full aspect-[4/3] object-cover rounded-2xl" />
            <button onClick={onRemovePhoto} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <X size={16} strokeWidth={1.5} className="text-white" />
            </button>
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

/* Done Screen */
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

/* Avatar Picker */
function AvatarPicker({ selectedAvatar, setSelectedAvatar }: { selectedAvatar: number; setSelectedAvatar: (v: number) => void }) {
  const isGroomSide = selectedAvatar < BRIDE_AVATAR_START
  const [side, setSide] = useState<'groom' | 'bride'>(isGroomSide ? 'groom' : 'bride')

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

/* Step Indicator */
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
