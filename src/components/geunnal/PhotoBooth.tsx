'use client'
import { useRef, useState, useCallback, useEffect, forwardRef, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Download, Share2, BookmarkPlus, Plus, Check, X, RotateCcw, ImagePlus, CalendarDays, ArrowLeftRight } from 'lucide-react'
import { GeunnalEvent, EventSide } from '@/types/geunnal'
import BottomSheet from './BottomSheet'
import html2canvas from 'html2canvas'
import { sendKakaoShare } from '@/lib/geunnalKakao'

interface PhotoBoothProps {
  pageId: string
  token: string
  slug: string
  groomName: string
  brideName: string
}

interface PhotoTransform {
  offsetX: number
  offsetY: number
  scale: number
}

const DEFAULT_TRANSFORM: PhotoTransform = { offsetX: 0, offsetY: 0, scale: 1 }

const STEPS = [
  { label: '프레임', description: '프레임 & 사진' },
  { label: '텍스트', description: '텍스트 꾸미기' },
]

export default function PhotoBooth({ pageId, token, slug, groomName, brideName }: PhotoBoothProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [layout, setLayout] = useState<2 | 3 | 4>(4)
  const [frameColor, setFrameColor] = useState('black')
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null])
  const [transforms, setTransforms] = useState<PhotoTransform[]>(
    Array.from({ length: 4 }, () => ({ ...DEFAULT_TRANSFORM }))
  )
  const [activeSlot, setActiveSlot] = useState<number>(0)
  const [adjustSlot, setAdjustSlot] = useState<number | null>(null)
  const [swapFrom, setSwapFrom] = useState<number | null>(null)

  const [title, setTitle] = useState(`${groomName} & ${brideName} 결혼합니다`)
  const [dateText, setDateText] = useState('')
  const [comment, setComment] = useState('')
  const [attendees, setAttendees] = useState('')

  const [events, setEvents] = useState<GeunnalEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showEventSheet, setShowEventSheet] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Fetch events
  useEffect(() => {
    fetch(`/api/geunnal/events?pageId=${pageId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json() as Promise<{ events: GeunnalEvent[] }>)
      .then(data => setEvents(data.events))
      .catch(() => {})
  }, [pageId, token])

  const handleLayoutChange = useCallback((newLayout: 2 | 3 | 4) => {
    setLayout(newLayout)
    setPhotos(prev => Array.from({ length: newLayout }, (_, i) => prev[i] ?? null))
    setTransforms(prev => Array.from({ length: newLayout }, (_, i) => prev[i] ?? { ...DEFAULT_TRANSFORM }))
  }, [])

  const handlePhotoSlotClick = useCallback((index: number) => {
    if (photos[index]) {
      setAdjustSlot(index)
    } else {
      setActiveSlot(index)
      fileInputRef.current?.click()
    }
  }, [photos])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    e.target.value = ''

    if (files.length === 1) {
      const url = URL.createObjectURL(files[0])
      setPhotos(prev => {
        const next = [...prev]
        if (next[activeSlot]) URL.revokeObjectURL(next[activeSlot]!)
        next[activeSlot] = url
        return next
      })
      setTransforms(prev => {
        const next = [...prev]
        next[activeSlot] = { ...DEFAULT_TRANSFORM }
        return next
      })
      setAdjustSlot(activeSlot)
    } else {
      // Multiple files: create blob URLs
      const urls = files.map(f => URL.createObjectURL(f))
      setPhotos(prev => {
        const next = [...prev]
        const emptySlots: number[] = []
        for (let i = activeSlot; i < next.length; i++) {
          if (!next[i]) emptySlots.push(i)
        }
        for (let i = 0; i < activeSlot; i++) {
          if (!next[i]) emptySlots.push(i)
        }
        if (emptySlots.length === 0) {
          for (let i = activeSlot; i < next.length; i++) emptySlots.push(i)
        }
        const slotsToFill = emptySlots.slice(0, urls.length)
        slotsToFill.forEach((slotIdx, fileIdx) => {
          if (next[slotIdx]) URL.revokeObjectURL(next[slotIdx]!)
          next[slotIdx] = urls[fileIdx]
        })
        return next
      })
      setTransforms(prev => {
        const next = [...prev]
        const emptySlots: number[] = []
        for (let i = activeSlot; i < next.length; i++) {
          if (!photos[i]) emptySlots.push(i)
        }
        for (let i = 0; i < activeSlot; i++) {
          if (!photos[i]) emptySlots.push(i)
        }
        if (emptySlots.length === 0) {
          for (let i = activeSlot; i < next.length; i++) emptySlots.push(i)
        }
        emptySlots.slice(0, urls.length).forEach(slotIdx => {
          next[slotIdx] = { ...DEFAULT_TRANSFORM }
        })
        return next
      })
    }
  }, [activeSlot, photos])

  const handleAdjustConfirm = useCallback((transform: PhotoTransform) => {
    if (adjustSlot === null) return
    setTransforms(prev => { const next = [...prev]; next[adjustSlot] = transform; return next })
    setAdjustSlot(null)
  }, [adjustSlot])

  // Tap-to-swap handler for reordering photos
  const handleSwapTap = useCallback((index: number) => {
    if (swapFrom === null) {
      setSwapFrom(index)
    } else if (swapFrom === index) {
      setSwapFrom(null)
    } else {
      // Swap photos and transforms
      const from = swapFrom
      setPhotos(prev => {
        const next = [...prev]
        const temp = next[from]
        next[from] = next[index]
        next[index] = temp
        return next
      })
      setTransforms(prev => {
        const next = [...prev]
        const temp = next[from]
        next[from] = next[index]
        next[index] = temp
        return next
      })
      setSwapFrom(null)
    }
  }, [swapFrom])

  const handleReplacePhoto = useCallback(() => {
    if (adjustSlot === null) return
    setActiveSlot(adjustSlot)
    setAdjustSlot(null)
    setTimeout(() => fileInputRef.current?.click(), 100)
  }, [adjustSlot])

  const handleEventSelect = useCallback((event: GeunnalEvent) => {
    setSelectedEventId(event.id)
    if (event.date && event.date !== 'TBD') setDateText(event.date.replace(/-/g, '.'))
  }, [])

  // Shared html2canvas options - fix aspect-ratio/object-cover + strip unsupported colors
  const canvasOptions = {
    scale: 4,
    useCORS: true,
    backgroundColor: null as string | null,
    imageTimeout: 0,
    onclone: (doc: Document, clonedFrame: HTMLElement) => {
      // A. Fix aspect-ratio & object-cover: html2canvas doesn't render these correctly
      if (frameRef.current) {
        const origSlots = frameRef.current.querySelectorAll<HTMLElement>('[style*="aspect-ratio"]')
        const cloneSlots = clonedFrame.querySelectorAll<HTMLElement>('[style*="aspect-ratio"]')
        origSlots.forEach((origSlot, idx) => {
          const cloneSlot = cloneSlots[idx]
          if (!cloneSlot) return
          // Replace aspect-ratio with explicit pixel dimensions
          const sr = origSlot.getBoundingClientRect()
          cloneSlot.style.aspectRatio = 'unset'
          cloneSlot.style.width = sr.width + 'px'
          cloneSlot.style.height = sr.height + 'px'
          // Pre-render img with object-cover baked in
          const oImg = origSlot.querySelector('img') as HTMLImageElement | null
          const cImg = cloneSlot.querySelector('img') as HTMLImageElement | null
          if (oImg && cImg && oImg.complete && oImg.naturalWidth > 0) {
            const ir = oImg.getBoundingClientRect()
            const nw = oImg.naturalWidth, nh = oImg.naturalHeight
            const ew = ir.width, eh = ir.height
            const nr = nw / nh, er = ew / eh
            // Calculate object-cover source crop
            let sx: number, sy: number, sw: number, sh: number
            if (nr > er) { sh = nh; sw = nh * er; sx = (nw - sw) / 2; sy = 0 }
            else { sw = nw; sh = nw / er; sx = 0; sy = (nh - sh) / 2 }
            try {
              const tc = document.createElement('canvas')
              tc.width = Math.round(sw); tc.height = Math.round(sh)
              const tctx = tc.getContext('2d')!
              tctx.drawImage(oImg, sx, sy, sw, sh, 0, 0, tc.width, tc.height)
              cImg.src = tc.toDataURL('image/jpeg', 0.95)
              cImg.style.objectFit = 'fill'
              cImg.className = cImg.className.replace(/\bobject-cover\b/g, '')
            } catch { /* CORS or canvas error - keep original */ }
          }
        })
      }
      // B. Strip unsupported lab()/oklch() color functions
      // 1. Replace in <style> tag textContent
      doc.querySelectorAll('style').forEach(styleEl => {
        const text = styleEl.textContent
        if (text && /lab\(|oklch\(/.test(text)) {
          styleEl.textContent = text
            .replace(/oklch\([^)]*\)/g, 'transparent')
            .replace(/lab\([^)]*\)/g, 'transparent')
        }
      })
      // 2. Patch CSSOM rules (Turbopack dev mode injects styles via JS)
      try {
        for (const sheet of Array.from(doc.styleSheets)) {
          try {
            for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
              const rule = sheet.cssRules[i]
              if (/lab\(|oklch\(/.test(rule.cssText)) {
                const fixed = rule.cssText
                  .replace(/oklch\([^)]*\)/g, 'transparent')
                  .replace(/lab\([^)]*\)/g, 'transparent')
                sheet.deleteRule(i)
                sheet.insertRule(fixed, i)
              }
            }
          } catch { /* cross-origin sheet */ }
        }
      } catch {}
      // 3. Override computed styles on all elements as final safety net
      const win = doc.defaultView
      if (win) {
        doc.querySelectorAll('*').forEach(node => {
          try {
            const el = node as HTMLElement
            const cs = win.getComputedStyle(el)
            if (/lab\(|oklch\(/.test(cs.backgroundColor)) {
              el.style.backgroundColor = 'transparent'
            }
            if (/lab\(|oklch\(/.test(cs.color)) {
              el.style.color = '#000'
            }
            if (/lab\(|oklch\(/.test(cs.borderColor)) {
              el.style.borderColor = 'transparent'
            }
          } catch {}
        })
      }
    },
  }

  const handleDownload = useCallback(async () => {
    if (!frameRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(frameRef.current, canvasOptions)
      const link = document.createElement('a')
      link.download = 'geunnal-photobooth.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      showToastMsg('이미지가 저장되었습니다')
    } catch (err) {
      console.error('Download error:', err)
      showToastMsg('저장에 실패했습니다')
    }
    finally { setSaving(false) }
  }, [])

  const handleShare = useCallback(async () => {
    if (!frameRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(frameRef.current, canvasOptions)
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
      if (!blob) throw new Error('이미지 생성 실패')
      const file = new File([blob], 'photobooth.png', { type: 'image/png' })

      // Upload to server to get public URL for Kakao
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pageId', pageId)
      const uploadRes = await fetch('/api/geunnal/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('이미지 업로드 실패')
      const { url: relativeUrl } = (await uploadRes.json()) as { url: string }

      // Build absolute URL for Kakao image
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://invite.deardrawer.com'
      const imageUrl = relativeUrl.startsWith('http') ? relativeUrl : `${origin}${relativeUrl}`

      sendKakaoShare({
        title: title || `${groomName} & ${brideName}`,
        description: comment || '포토부스에서 만든 사진이에요',
        url: `https://invite.deardrawer.com/g/${slug}`,
        imageUrl,
      })
      showToastMsg('카카오톡으로 공유합니다')
    } catch (err) {
      console.error('Kakao share error:', err)
      showToastMsg('공유에 실패했습니다')
    } finally { setSaving(false) }
  }, [title, comment, groomName, brideName, slug, pageId, token])

  const handleSaveToEvent = useCallback(async (eventId: string) => {
    if (!frameRef.current) return
    setSaving(true)
    try {
      const canvas = await html2canvas(frameRef.current, canvasOptions)
      // Convert canvas to Blob for FormData upload
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
      if (!blob) throw new Error('이미지 생성 실패')
      const file = new File([blob], 'photobooth.png', { type: 'image/png' })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pageId', pageId)
      formData.append('eventId', eventId)
      const uploadRes = await fetch('/api/geunnal/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      let photoUrl = ''
      if (uploadRes.ok) {
        const uploadData = (await uploadRes.json()) as { url?: string }
        if (uploadData.url) photoUrl = uploadData.url
      }
      if (!photoUrl) throw new Error('업로드 실패')
      const subRes = await fetch('/api/geunnal/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          guest_name: `${groomName} & ${brideName}`,
          is_anonymous: false,
          avatar_id: 0,
          message: comment || title,
          photo_url: photoUrl,
        }),
      })
      if (!subRes.ok) throw new Error('제출 실패')
      setShowEventSheet(false)
      showToastMsg('모임에 저장되었습니다')
    } catch { showToastMsg('저장에 실패했습니다') }
    finally { setSaving(false) }
  }, [comment, title, groomName, brideName, pageId, token])

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'TBD') return '날짜 미정'
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  return (
    <div className="min-h-[calc(100dvh-56px)] flex flex-col bg-white">
      {/* Header */}
      <div className="px-5 py-5 border-b border-[#E8E4F0]">
        <h1 className="text-xl font-medium text-[#2A2240]">포토부스</h1>
        <p className="text-[13px] text-[#5A5270] mt-0.5">필름 스트립 포토프레임 만들기</p>
      </div>

      {/* Step indicator */}
      <div className="px-5 mt-4 mb-4">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const stepNum = (i + 1) as 1 | 2
            const isActive = step === stepNum
            const isDone = step > stepNum
            return (
              <div key={i} className="flex items-center flex-1">
                <button onClick={() => setStep(stepNum)}
                  className={`flex items-center gap-1.5 w-full rounded-lg px-2 py-1.5 transition-all ${isActive ? 'bg-[#EDE9FA]/50' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                    isActive ? 'text-white' : isDone ? 'bg-[#8B75D0]/20 text-[#8B75D0]' : 'bg-[#E8E4F0] text-[#9B8CC4]'
                  }`} style={isActive ? { background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' } : undefined}>
                    {stepNum}
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-[11px] font-medium truncate ${isActive ? 'text-[#8B75D0]' : 'text-[#5A5270]'}`}>{s.label}</p>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px shrink-0 ${isDone ? 'bg-[#8B75D0]/40' : 'bg-[#E8E4F0]'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Preview frame */}
      <div className="flex justify-center py-3 px-4 bg-[#F9F7FD]/50">
        <PhotoFrame
          ref={frameRef}
          photos={photos}
          transforms={transforms}
          layout={layout}
          frameColor={frameColor}
          title={title}
          dateText={dateText}
          comment={comment}
          attendees={attendees}
          onPhotoSlotClick={step === 1 ? handlePhotoSlotClick : undefined}
          selectedSlot={step === 1 ? swapFrom : null}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        {step === 1 && (
          <>
            <FrameSettings layout={layout} onLayoutChange={handleLayoutChange} frameColor={frameColor} onColorChange={setFrameColor} />
            {/* Swap UI: show when 2+ photos exist */}
            {photos.filter(Boolean).length >= 2 && (
              <div className="mt-5">
                <h3 className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4] mb-2 flex items-center gap-1.5">
                  <ArrowLeftRight size={13} /> 사진 순서 변경
                </h3>
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: layout }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => photos[i] ? handleSwapTap(i) : undefined}
                      disabled={!photos[i]}
                      className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all duration-150 ${
                        swapFrom === i
                          ? 'border-[#8B75D0] ring-2 ring-[#8B75D0]/30 scale-105'
                          : photos[i]
                            ? 'border-[#E8E4F0] hover:border-[#8B75D0]/50 active:scale-95'
                            : 'border-[#E8E4F0] opacity-30 cursor-default'
                      }`}
                    >
                      {photos[i] ? (
                        <img src={photos[i]!} alt={`슬롯 ${i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#F9F7FD] flex items-center justify-center">
                          <span className="text-[10px] text-[#C5BAE8]">{i + 1}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#9B8CC4] text-center mt-2">
                  {swapFrom !== null ? '바꿀 두 번째 사진을 탭하세요' : '바꿀 사진 두 장을 차례로 탭하세요'}
                </p>
              </div>
            )}
            <p className="text-[13px] text-[#9B8CC4] mt-4">빈 슬롯을 탭하여 사진 추가 · 여러 장 선택 가능</p>
          </>
        )}
        {step === 2 && (
          <TextEditor
            title={title} onTitleChange={setTitle}
            dateText={dateText} onDateTextChange={setDateText}
            comment={comment} onCommentChange={setComment}
            attendees={attendees} onAttendeesChange={setAttendees}
            events={events} selectedEventId={selectedEventId} onEventSelect={handleEventSelect}
          />
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-5 pb-5 pt-2 space-y-2 bg-white border-t border-[#E8E4F0]/50">
        <div className="flex gap-2">
          {step > 1 && (
            <button onClick={() => setStep(1)} className="flex-1 h-10 rounded-[10px] border border-[#E8E4F0] text-[13px] font-medium text-[#5A5270] flex items-center justify-center gap-1">
              <ArrowLeft size={16} /> 이전
            </button>
          )}
          {step < 2 && (
            <button onClick={() => setStep(2)} className="flex-1 h-10 rounded-[10px] text-white text-[13px] font-medium flex items-center justify-center gap-1"
              style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}>
              다음 <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={handleDownload} disabled={saving}
            className="flex-1 h-10 rounded-[10px] text-white text-[13px] font-medium disabled:opacity-50 flex items-center justify-center gap-1"
            style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}>
            <Download size={16} /> 저장
          </button>
          <button onClick={handleShare} disabled={saving}
            className="flex-1 h-10 rounded-[10px] border border-[#E8E4F0] text-[13px] font-medium text-[#5A5270] disabled:opacity-50 flex items-center justify-center gap-1">
            <Share2 size={16} /> 공유
          </button>
          <button onClick={() => selectedEventId ? handleSaveToEvent(selectedEventId) : setShowEventSheet(true)} disabled={saving}
            className="flex-1 h-10 rounded-[10px] border border-[#E8E4F0] text-[13px] font-medium text-[#5A5270] disabled:opacity-50 flex items-center justify-center gap-1">
            <BookmarkPlus size={16} /> {selectedEventId ? '모임저장' : '모임선택'}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

      {/* Photo adjust modal */}
      {adjustSlot !== null && photos[adjustSlot] && (
        <PhotoAdjustModal
          open={true}
          photoUrl={photos[adjustSlot]!}
          initialTransform={transforms[adjustSlot]}
          aspectRatio={layout === 4 ? '3/4' : '4/3'}
          onConfirm={handleAdjustConfirm}
          onCancel={() => setAdjustSlot(null)}
          onReplace={handleReplacePhoto}
        />
      )}

      {/* Event selection BottomSheet */}
      <BottomSheet open={showEventSheet} onClose={() => setShowEventSheet(false)} title="모임에 저장">
        <div className="space-y-2 pt-2">
          {events.map(evt => (
            <button key={evt.id} onClick={() => handleSaveToEvent(evt.id)} disabled={saving}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#E8E4F0] hover:bg-[#EDE9FA]/20 active:bg-[#EDE9FA]/40 transition-colors text-left disabled:opacity-50">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-medium shrink-0"
                style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}>
                {evt.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] text-[#2A2240] font-medium truncate">{evt.name}</p>
                <p className="text-[12px] text-[#9B8CC4]">
                  {evt.date !== 'TBD' ? formatDate(evt.date) : '날짜 미정'} {evt.area ? `| ${evt.area}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 max-w-[380px] px-4 py-2.5 rounded-[22px] bg-[#2A2240] text-white text-[13px] shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </div>
  )
}

/* ─── PhotoFrame ─── */
const FRAME_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  black: { bg: '#1a1a1a', text: '#ffffff', border: '#333333', accent: '#d4a574' },
  white: { bg: '#f5f5f5', text: '#2a2240', border: '#e0e0e0', accent: '#8B75D0' },
  lavender: { bg: '#8B75D0', text: '#ffffff', border: '#7a65c0', accent: '#f0e6ff' },
  blush: { bg: '#D4899A', text: '#ffffff', border: '#c47a8a', accent: '#fff0f3' },
  navy: { bg: '#1e293b', text: '#e2e8f0', border: '#334155', accent: '#94a3b8' },
}

const FILM_NUMBERS = ['36', '35', '34', '33']

const PhotoFrame = forwardRef<HTMLDivElement, {
  photos: (string | null)[]
  transforms?: PhotoTransform[]
  layout: 2 | 3 | 4
  frameColor: string
  title: string
  dateText: string
  comment: string
  attendees: string
  onPhotoSlotClick?: (index: number) => void
  selectedSlot?: number | null
}>(({ photos, transforms, layout, frameColor, title, dateText, comment, attendees, onPhotoSlotClick, selectedSlot }, ref) => {
  const colors = FRAME_COLORS[frameColor] || FRAME_COLORS.black
  const slots = Array.from({ length: layout }, (_, i) => photos[i] ?? null)

  if (layout === 4) {
    return (
      <div ref={ref} style={{ backgroundColor: colors.bg, color: colors.text, width: '300px', padding: '12px 10px 10px', borderRadius: '4px', fontFamily: '"DM Sans", sans-serif' }}>
        <div className="grid grid-cols-2 gap-x-[8px] gap-y-[6px]">
          {slots.map((photo, index) => (
            <div key={index}>
              <div onClick={() => onPhotoSlotClick?.(index)}
                className={`overflow-hidden relative ${onPhotoSlotClick ? 'cursor-pointer active:opacity-80' : ''} transition-all duration-150`}
                style={{
                  aspectRatio: '3/4', borderRadius: '3px',
                  backgroundColor: photo ? undefined : 'rgba(255,255,255,0.95)',
                  outline: selectedSlot === index ? '2px solid #8B75D0' : 'none',
                  outlineOffset: '-2px',
                }}>
                {photo ? (
                  <img src={photo} alt={`Photo ${index + 1}`} className="absolute object-cover"                    style={transforms?.[index] ? { width: `${transforms[index].scale * 100}%`, height: `${transforms[index].scale * 100}%`, left: `${50 + transforms[index].offsetX - (transforms[index].scale * 50)}%`, top: `${50 + transforms[index].offsetY - (transforms[index].scale * 50)}%` } : { width: '100%', height: '100%' }} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-white">
                    <Plus size={16} style={{ opacity: 0.2, color: '#333' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-1 pt-1 pb-1">
          {dateText && <p style={{ fontSize: '8px', opacity: 0.5, letterSpacing: '1px', marginBottom: '3px' }}>{dateText}</p>}
          {title && <p style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.4, marginBottom: '2px' }}>{title}</p>}
          {comment && <p style={{ fontSize: '8px', opacity: 0.65, fontStyle: 'italic', marginBottom: '3px' }}>"{comment}"</p>}
          {attendees && <p style={{ fontSize: '7px', opacity: 0.45 }}>{attendees}</p>}
        </div>
      </div>
    )
  }

  // 2/3-photo: vertical film strip layout
  return (
    <div ref={ref} className="relative inline-block" style={{ backgroundColor: colors.bg, color: colors.text, width: '280px', padding: '12px 28px 20px 16px', borderRadius: '4px', fontFamily: '"DM Sans", sans-serif' }}>
      <div className="flex flex-col gap-2 ml-2" style={{ marginRight: '8px' }}>
        {slots.map((photo, index) => (
          <div key={index} className="relative">
            <div className="flex items-center gap-1 mb-0.5" style={{ opacity: 0.45, fontSize: '7px' }}>
              <span style={{ fontSize: '6px' }}>&#9660;</span>
              <span>{FILM_NUMBERS[index] || '30'}</span>
            </div>
            <div onClick={() => onPhotoSlotClick?.(index)}
              className={`relative overflow-hidden bg-white/10 ${onPhotoSlotClick ? 'cursor-pointer active:opacity-80' : ''} transition-all duration-150`}
              style={{
                aspectRatio: '4/3', borderRadius: '2px', width: '100%',
                outline: selectedSlot === index ? '2px solid #8B75D0' : 'none',
                outlineOffset: '-2px',
              }}>
              {photo ? (
                <img src={photo} alt={`Photo ${index + 1}`} className="absolute object-cover"                  style={transforms?.[index] ? { width: `${transforms[index].scale * 100}%`, height: `${transforms[index].scale * 100}%`, left: `${50 + transforms[index].offsetX - (transforms[index].scale * 50)}%`, top: `${50 + transforms[index].offsetY - (transforms[index].scale * 50)}%` } : { width: '100%', height: '100%' }} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <Plus size={20} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: '9px', opacity: 0.4 }}>PHOTO {index + 1}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 ml-2" style={{ marginRight: '8px' }}>
        <div className="h-px mb-2" style={{ backgroundColor: colors.text, opacity: 0.15 }} />
        {dateText && <p style={{ fontSize: '9px', opacity: 0.6, letterSpacing: '1px', marginBottom: '4px' }}>{dateText}</p>}
        {title && <p style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.4, marginBottom: '2px' }}>{title}</p>}
        {comment && <p style={{ fontSize: '9px', opacity: 0.7, fontStyle: 'italic', marginBottom: '4px' }}>"{comment}"</p>}
        {attendees && <p style={{ fontSize: '8px', opacity: 0.5, marginTop: '4px' }}>{attendees}</p>}
      </div>
    </div>
  )
})
PhotoFrame.displayName = 'PhotoFrame'

/* ─── FrameSettings ─── */
function FrameSettings({ layout, onLayoutChange, frameColor, onColorChange }: {
  layout: 2 | 3 | 4; onLayoutChange: (l: 2 | 3 | 4) => void; frameColor: string; onColorChange: (c: string) => void
}) {
  const LAYOUTS: { value: 2 | 3 | 4; label: string }[] = [{ value: 2, label: '2장' }, { value: 3, label: '3장' }, { value: 4, label: '4장' }]
  const COLORS = [
    { id: 'black', bg: '#1a1a1a', label: '블랙' }, { id: 'white', bg: '#f5f5f5', label: '화이트' },
    { id: 'lavender', bg: '#8B75D0', label: '라벤더' }, { id: 'blush', bg: '#D4899A', label: '블러시' },
    { id: 'navy', bg: '#1e293b', label: '네이비' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4] mb-3">레이아웃</h3>
        <div className="flex gap-2">
          {LAYOUTS.map(({ value, label }) => (
            <button key={value} onClick={() => onLayoutChange(value)}
              className={`flex-1 h-20 rounded-2xl border transition-all duration-150 flex flex-col items-center justify-center gap-1.5 ${
                layout === value ? 'border-[#8B75D0] bg-[#EDE9FA]/30 text-[#8B75D0]' : 'border-[#E8E4F0] bg-white text-[#5A5270] hover:bg-[#EDE9FA]/10'
              }`}>
              <div className="flex flex-col gap-[2px]">
                {Array.from({ length: value }, (_, i) => (
                  <div key={i} className={`rounded-[1px] ${layout === value ? 'bg-[#8B75D0]/40' : 'bg-[#E8E4F0]'}`} style={{ width: '24px', height: value <= 3 ? '6px' : '5px' }} />
                ))}
              </div>
              <span className="text-[12px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4] mb-3">프레임 색상</h3>
        <div className="flex gap-3 justify-center">
          {COLORS.map(({ id, bg, label }) => (
            <button key={id} onClick={() => onColorChange(id)} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                frameColor === id ? 'border-[#8B75D0] scale-110' : 'border-[#E8E4F0]'
              }`} style={{ backgroundColor: bg }}>
                {frameColor === id && <Check size={16} className={id === 'white' ? 'text-[#8B75D0]' : 'text-white'} strokeWidth={2.5} />}
              </div>
              <span className={`text-[10px] ${frameColor === id ? 'text-[#8B75D0] font-medium' : 'text-[#9B8CC4]'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── TextEditor ─── */
function TextEditor({ title, onTitleChange, dateText, onDateTextChange, comment, onCommentChange, attendees, onAttendeesChange, events, selectedEventId, onEventSelect }: {
  title: string; onTitleChange: (v: string) => void; dateText: string; onDateTextChange: (v: string) => void
  comment: string; onCommentChange: (v: string) => void; attendees: string; onAttendeesChange: (v: string) => void
  events: GeunnalEvent[]; selectedEventId: string | null; onEventSelect: (e: GeunnalEvent) => void
}) {
  const [sideFilter, setSideFilter] = useState<EventSide | 'all'>('all')
  const SIDE_TABS: { value: EventSide | 'all'; label: string }[] = [
    { value: 'all', label: '전체' }, { value: 'both', label: '공동' }, { value: 'groom', label: '신랑측' }, { value: 'bride', label: '신부측' },
  ]

  const filteredEvents = useMemo(() => {
    const now = Date.now()
    const filtered = sideFilter === 'all' ? [...events] : events.filter(e => e.side === sideFilter)
    return filtered.sort((a, b) => {
      if (a.date === 'TBD' && b.date === 'TBD') return 0
      if (a.date === 'TBD') return 1
      if (b.date === 'TBD') return -1
      return Math.abs(new Date(a.date).getTime() - now) - Math.abs(new Date(b.date).getTime() - now)
    })
  }, [events, sideFilter])

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return events.filter(e => e.date !== 'TBD' && e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  }, [events])

  const inputClass = "w-full h-11 px-3.5 rounded-[10px] bg-white border border-[#E8E4F0] text-[15px] text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-1 focus:ring-[#8B75D0]/30 transition-colors"

  return (
    <div className="space-y-4">
      {events.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">모임 연결</label>
          <div className="flex gap-1 bg-[#F9F7FD] rounded-lg p-0.5">
            {SIDE_TABS.map(({ value, label }) => (
              <button key={value} onClick={() => setSideFilter(value)}
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                  sideFilter === value ? 'bg-white text-[#8B75D0] shadow-sm' : 'text-[#9B8CC4] hover:text-[#5A5270]'
                }`}>{label}</button>
            ))}
          </div>
          <select value={selectedEventId || ''} onChange={(e) => { const evt = events.find(ev => ev.id === e.target.value); if (evt) onEventSelect(evt) }}
            className={inputClass}>
            <option value="" disabled>모임을 선택하세요 (선택)</option>
            {filteredEvents.map(evt => {
              const sideLabel = evt.side === 'groom' ? '신랑' : evt.side === 'bride' ? '신부' : '공동'
              return <option key={evt.id} value={evt.id}>[{sideLabel}] {evt.name} {evt.date !== 'TBD' ? `(${evt.date})` : ''}</option>
            })}
          </select>
          {upcomingEvents.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#9B8CC4] flex items-center gap-1"><CalendarDays size={12} /> 다가오는 모임</span>
              {upcomingEvents.map(evt => {
                const isSelected = selectedEventId === evt.id
                const sideLabel = evt.side === 'groom' ? '신랑측' : evt.side === 'bride' ? '신부측' : '공동'
                return (
                  <button key={evt.id} onClick={() => onEventSelect(evt)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      isSelected ? 'border-[#8B75D0] bg-[#EDE9FA]/30 shadow-sm' : 'border-[#E8E4F0] bg-white hover:bg-[#EDE9FA]/10'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${isSelected ? 'text-white' : 'bg-[#EDE9FA]/40 text-[#8B75D0]'}`}
                      style={isSelected ? { background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' } : undefined}>
                      {evt.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${isSelected ? 'text-[#8B75D0]' : 'text-[#2A2240]'}`}>{evt.name}</p>
                      <p className="text-[11px] text-[#9B8CC4]">{sideLabel} · {evt.date} {evt.time || ''}</p>
                    </div>
                    {isSelected && <span className="text-[10px] text-[#8B75D0] font-medium shrink-0">선택됨</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">제목</label>
        <input value={title} onChange={e => onTitleChange(e.target.value)} placeholder="김민준 & 이서연 결혼합니다" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">날짜</label>
        <input value={dateText} onChange={e => onDateTextChange(e.target.value)} placeholder="2026.05.23" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">한줄평</label>
        <input value={comment} onChange={e => onCommentChange(e.target.value)} placeholder="우리의 특별한 날을 함께해주세요" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#9B8CC4]">참석자</label>
        <input value={attendees} onChange={e => onAttendeesChange(e.target.value)} placeholder="참석자 이름 (예: 가족, 친구들)" className={inputClass} />
      </div>
    </div>
  )
}

/* ─── PhotoAdjustModal ─── */
function PhotoAdjustModal({ open, photoUrl, initialTransform, aspectRatio = '4/3', onConfirm, onCancel, onReplace }: {
  open: boolean; photoUrl: string; initialTransform: PhotoTransform; aspectRatio?: '4/3' | '3/4'
  onConfirm: (t: PhotoTransform) => void; onCancel: () => void; onReplace?: () => void
}) {
  const [transform, setTransform] = useState<PhotoTransform>(initialTransform)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const lastPinchDist = useRef<number | null>(null)

  useEffect(() => { if (open) setTransform(initialTransform) }, [open, initialTransform])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - lastPos.current.x) / rect.width) * 100
    const dy = ((e.clientY - lastPos.current.y) / rect.height) * 100
    lastPos.current = { x: e.clientX, y: e.clientY }
    setTransform(prev => {
      const maxOffset = (prev.scale - 1) * 50
      return { ...prev, offsetX: Math.max(-maxOffset, Math.min(maxOffset, prev.offsetX + dx)), offsetY: Math.max(-maxOffset, Math.min(maxOffset, prev.offsetY + dy)) }
    })
  }, [])

  const handlePointerUp = useCallback(() => { isDragging.current = false }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delta = (dist - lastPinchDist.current) * 0.01
      lastPinchDist.current = dist
      setTransform(prev => {
        const newScale = Math.max(1, Math.min(3, prev.scale + delta))
        const maxOffset = (newScale - 1) * 50
        return { scale: newScale, offsetX: Math.max(-maxOffset, Math.min(maxOffset, prev.offsetX)), offsetY: Math.max(-maxOffset, Math.min(maxOffset, prev.offsetY)) }
      })
    }
  }, [])

  const handleTouchEnd = useCallback(() => { lastPinchDist.current = null }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !open) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = -e.deltaY * 0.003
      setTransform(prev => {
        const newScale = Math.max(1, Math.min(3, prev.scale + delta))
        const maxOffset = (newScale - 1) * 50
        return { scale: newScale, offsetX: Math.max(-maxOffset, Math.min(maxOffset, prev.offsetX)), offsetY: Math.max(-maxOffset, Math.min(maxOffset, prev.offsetY)) }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70">
      <div className="w-full max-w-[400px] mx-4 bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E4F0]">
          <button onClick={onCancel} className="p-1 text-[#9B8CC4]"><X size={20} /></button>
          <span className="text-[14px] font-medium text-[#2A2240]">사진 조정</span>
          <button onClick={() => onConfirm(transform)} className="p-1 text-[#8B75D0]"><Check size={20} /></button>
        </div>
        <div className="bg-black/5 p-4">
          <div ref={containerRef}
            className="relative mx-auto overflow-hidden bg-black rounded-lg cursor-grab active:cursor-grabbing touch-none"
            style={aspectRatio === '3/4' ? { width: '210px', height: '280px' } : { width: '280px', height: '210px' }}
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <img src={photoUrl} alt="Adjust" draggable={false} className="absolute select-none pointer-events-none"
              style={{ width: `${transform.scale * 100}%`, height: `${transform.scale * 100}%`, objectFit: 'cover', left: `${50 + transform.offsetX - (transform.scale * 50)}%`, top: `${50 + transform.offsetY - (transform.scale * 50)}%` }} />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
            </div>
            {transform.scale > 1.05 && (
              <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full pointer-events-none">{Math.round(transform.scale * 100)}%</div>
            )}
          </div>
          <p className="text-center text-[11px] text-[#9B8CC4] mt-2">드래그하여 위치 조정 · 두 손가락으로 확대/축소</p>
        </div>
        <div className="px-5 py-4 flex gap-2">
          <button onClick={() => setTransform(DEFAULT_TRANSFORM)}
            className="h-10 px-4 rounded-[22px] border border-[#E8E4F0] text-[13px] text-[#5A5270] font-medium flex items-center gap-1.5 hover:bg-[#EDE9FA]/20 transition-colors">
            <RotateCcw size={14} /> 초기화
          </button>
          {onReplace && (
            <button onClick={onReplace}
              className="h-10 px-4 rounded-[22px] border border-[#E8E4F0] text-[13px] text-[#5A5270] font-medium flex items-center gap-1.5 hover:bg-[#EDE9FA]/20 transition-colors">
              <ImagePlus size={14} /> 변경
            </button>
          )}
          <button onClick={() => onConfirm(transform)} className="flex-1 h-10 rounded-[22px] text-white text-[13px] font-medium"
            style={{ background: 'linear-gradient(135deg, #8B75D0, #B87AAB, #D4899A)' }}>
            적용
          </button>
        </div>
      </div>
    </div>
  )
}
