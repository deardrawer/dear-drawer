'use client'

import { useCallback, useState, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { uploadImage } from '@/lib/imageUpload'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ColorField from '@/components/editor/ColorField'
import { FRAME_EN_FONTS, FRAME_KO_FONTS, FRAME_FONTS_HREF } from '@/lib/filmFrameFonts'
import ShareSettingsSection from '@/components/editor/ShareSettingsSection'
import DdayPopupEditor from '@/components/dday/DdayPopupEditor'
import { DEFAULT_DDAY_POPUP } from '@/lib/ddayPopupTypes'
import { parseDateOnly } from '@/lib/dateOnly'

function generateKakaoDescription(date: string, time: string, venueName: string): string {
  if (!date) return ''
  const dateObj = parseDateOnly(date)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()]
  let timeStr = ''
  if (time) {
    const [hour, minute] = time.split(':').map(Number)
    const period = hour < 12 ? '오전' : '오후'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    timeStr = minute === 0 ? ` ${period} ${displayHour}시` : ` ${period} ${displayHour}시 ${minute}분`
  }
  const dateLine = `${year}년 ${month}월 ${day}일 ${dayOfWeek}요일${timeStr}`
  const venueLine = venueName || ''
  return venueLine ? `${dateLine}\n${venueLine}` : dateLine
}

interface Step2FilmProps {
  templateId?: string
  invitationId?: string | null
}

export default function Step2Film({ invitationId }: Step2FilmProps) {
  const { invitation, updateField, updateNestedField, setActiveSection, validationError } = useEditorStore()
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const frame2InputRef = useRef<HTMLInputElement>(null)
  const [isUploadingFrame2, setIsUploadingFrame2] = useState(false)
  const boothInputRef = useRef<HTMLInputElement>(null)
  const boothSlot = useRef(0)
  const [boothUploading, setBoothUploading] = useState<number | null>(null)
  // 도트 자수 · OTT · 티켓 사진 업로드
  const [introUploading, setIntroUploading] = useState(false)
  const uploadIntroImage = async (file: File, onSuccess: (url: string) => void) => {
    setIntroUploading(true)
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) onSuccess(result.webUrl)
      else alert(result.error || '이미지 업로드에 실패했습니다.')
    } catch (error) {
      console.error('Upload error:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIntroUploading(false)
    }
  }

  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (coverInputRef.current) coverInputRef.current.value = ''
    setIsUploadingCover(true)
    setUploadProgress(0)
    const result = await uploadImage(file, { invitationId: invitationId || undefined, onProgress: setUploadProgress })
    setIsUploadingCover(false)
    if (result.success && result.webUrl) {
      updateNestedField('media.coverImage', result.webUrl)
    }
  }, [invitationId, updateNestedField])

  const handleFrame2Upload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (frame2InputRef.current) frame2InputRef.current.value = ''
    setIsUploadingFrame2(true)
    const result = await uploadImage(file, { invitationId: invitationId || undefined })
    setIsUploadingFrame2(false)
    if (result.success && result.webUrl) {
      updateField('filmFrameImage2' as any, result.webUrl)
    }
  }, [invitationId, updateField])

  const boothImages: string[] = invitation?.filmBoothImages || []
  const boothSettings: Record<string, number | undefined>[] = invitation?.filmBoothImageSettings || []
  const setBoothImage = (i: number, url: string) => {
    const next = [0, 1, 2].map(k => (k === i ? url : boothImages[k] || ''))
    const nextS = [0, 1, 2].map(k => (k === i ? {} : boothSettings[k] || {}))
    updateField('filmBoothImages', next)
    updateField('filmBoothImageSettings', nextS)
  }
  const setBoothSetting = (i: number, s: Record<string, number | undefined>) => {
    updateField('filmBoothImageSettings', [0, 1, 2].map(k => (k === i ? s : boothSettings[k] || {})))
  }
  const pickBooth = (i: number) => { boothSlot.current = i; boothInputRef.current?.click() }
  const handleBoothUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (boothInputRef.current) boothInputRef.current.value = ''
    if (!file) return
    const i = boothSlot.current
    setBoothUploading(i)
    const result = await uploadImage(file, { invitationId: invitationId || undefined })
    setBoothUploading(null)
    if (result.success && result.webUrl) setBoothImage(i, result.webUrl)
  }

  const updateKakaoDescriptionIfAuto = useCallback((newDate?: string, newTime?: string, newVenueName?: string) => {
    if (!invitation) return
    const date = newDate ?? invitation.wedding.date
    const time = newTime ?? invitation.wedding.time
    const venueName = newVenueName ?? invitation.wedding.venue.name
    const currentDesc = invitation.meta.description || ''
    const currentAutoDesc = generateKakaoDescription(invitation.wedding.date, invitation.wedding.time, invitation.wedding.venue.name)
    if (!currentDesc.trim() || currentDesc === currentAutoDesc) {
      const newDesc = generateKakaoDescription(date, time, venueName)
      updateNestedField('meta.description', newDesc)
    }
  }, [invitation, updateNestedField])

  if (!invitation) return null

  const { media } = invitation
  // 값이 없거나 예전 '타이틀'·'시네마틱' 값이면 프레임
  const rawStyle = invitation.filmIntroStyle as string | undefined
  const introStyle = (['frame', 'booth', 'dots', 'ott', 'ticket'] as const).find((v) => v === rawStyle) || 'frame'
  // 커버 사진: 프레임 안에 들어가는 사진
  const needsCoverImage = introStyle === 'frame'
  const frameId = (invitation as any).filmFrameId || '10'
  const frameColorMode = (invitation as any).filmFrameColorMode || 'original'
  const FILM_FRAMES: { id: string; name: string }[] = [
    { id: '10', name: '하트' }, { id: '4', name: '레이스' }, { id: '9', name: '오벌 액자' },
    { id: '5', name: '필리그리' }, { id: '12', name: '우표' }, { id: '8', name: '필름(2컷)' },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="space-y-1">
        <p className="text-sm font-medium" style={{ color: 'var(--ed-text)' }}>인트로를 꾸며보세요</p>
        <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>기본 정보를 입력하고 영화의 첫 장면이 될 인트로를 골라주세요.</p>
      </div>

      {/* 신랑신부 이름 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          신랑신부 이름
        </h3>

        <div className="space-y-3 p-4 rounded-lg" style={{ background: 'var(--ed-surface-2)' }}>
          <p className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>신랑</p>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
            <Input
              autoFocus
              value={invitation.groom.name}
              onChange={(e) => updateNestedField('groom.name', e.target.value)}
              placeholder="한지훈"
              className={validationError?.tab === 'names' && !invitation.groom.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">영문 이름</Label>
            <Input
              value={invitation.groom.nameEn || ''}
              onChange={(e) => updateNestedField('groom.nameEn', e.target.value)}
              placeholder="JIHOON"
            />
            <p className="text-xs text-gray-400">인트로 화면에 표시됩니다. 비워두면 한글 이름이 사용됩니다.</p>
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-lg" style={{ background: 'var(--ed-surface-2)' }}>
          <p className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>신부</p>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.bride.name}
              onChange={(e) => updateNestedField('bride.name', e.target.value)}
              placeholder="윤서연"
              className={validationError?.tab === 'names' && !invitation.bride.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">영문 이름</Label>
            <Input
              value={invitation.bride.nameEn || ''}
              onChange={(e) => updateNestedField('bride.nameEn', e.target.value)}
              placeholder="SEOYEON"
            />
            <p className="text-xs text-gray-400">인트로 화면에 표시됩니다. 비워두면 한글 이름이 사용됩니다.</p>
          </div>
        </div>
      </section>

      {/* 결혼식 정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          결혼식 정보
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* 날짜·시간 표시 토글 (노웨딩) */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">날짜 · 시간 표시</Label>
              <p className="text-xs text-gray-500">끄면 하객 화면에 날짜·시간을 표시하지 않아요 (노웨딩)</p>
            </div>
            <Switch checked={invitation.wedding.showDate !== false} onCheckedChange={(c) => updateNestedField('wedding.showDate', c)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">날짜 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={invitation.wedding.date}
                onChange={(e) => {
                  const newDate = e.target.value
                  updateNestedField('wedding.date', newDate)
                  updateKakaoDescriptionIfAuto(newDate, undefined, undefined)
                }}
                onFocus={() => setActiveSection('venue-info')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">시간</Label>
              <Input
                type="time"
                value={invitation.wedding.time}
                onChange={(e) => {
                  const newTime = e.target.value
                  updateNestedField('wedding.time', newTime)
                  if (newTime) {
                    const [h, m] = newTime.split(':').map(Number)
                    const p = h < 12 ? '오전' : '오후'
                    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
                    updateNestedField('wedding.timeDisplay', m === 0 ? `${p} ${dh}시` : `${p} ${dh}시 ${m}분`)
                  } else {
                    updateNestedField('wedding.timeDisplay', '')
                  }
                  updateKakaoDescriptionIfAuto(undefined, newTime, undefined)
                }}
                onFocus={() => setActiveSection('venue-info')}
              />
            </div>
          </div>

          {/* 장소·오시는길 표시 토글 (노웨딩) */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <Label className="text-sm font-medium">장소 · 오시는 길 표시</Label>
              <p className="text-xs text-gray-500">끄면 예식장·오시는 길을 표시하지 않아요</p>
            </div>
            <Switch checked={invitation.wedding.showVenue !== false} onCheckedChange={(c) => updateNestedField('wedding.showVenue', c)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식장 이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.wedding.venue.name}
              onChange={(e) => {
                const newVenueName = e.target.value
                updateNestedField('wedding.venue.name', newVenueName)
                updateKakaoDescriptionIfAuto(undefined, undefined, newVenueName)
              }}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="더채플앳청담"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">예식 홀</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">표시안함</span>
                <button
                  type="button"
                  onClick={() => updateNestedField('wedding.venue.hideHall', !invitation.wedding.venue.hideHall)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    invitation.wedding.venue.hideHall ? 'bg-gray-400' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    invitation.wedding.venue.hideHall ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
            <Input
              value={invitation.wedding.venue.hall}
              onChange={(e) => updateNestedField('wedding.venue.hall', e.target.value)}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="그랜드볼룸 3층"
              disabled={invitation.wedding.venue.hideHall}
              className={invitation.wedding.venue.hideHall ? 'bg-gray-100 text-gray-400' : ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">주소 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.wedding.venue.address}
              onChange={(e) => updateNestedField('wedding.venue.address', e.target.value)}
              onFocus={() => setActiveSection('venue-info')}
              placeholder="서울특별시 강남구 삼성로 614"
            />
          </div>
        </div>
      </section>

      {/* 인트로 스타일 선택 */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          인트로 스타일
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          {([['frame', '프레임'], ['booth', '포토부스'], ['dots', '도트 자수'], ['ott', 'OTT'], ['ticket', '티켓']] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => updateField('filmIntroStyle', id)}
              className={`py-3 rounded-lg border-2 text-sm font-medium transition-all ${introStyle === id ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-accent)] text-[#F5F0ED]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>
        {(introStyle === 'ott' || introStyle === 'ticket') && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <p className="text-xs text-gray-500">{introStyle === 'ticket'
              ? "'예매가 완료되었어요' 뒤에 모바일 티켓이 올라오고, 바코드가 스캔되면 화면을 눌러 입장해요. 일시·상영관은 결혼식 정보에서 가져와요."
              : '영화 작품 상세 화면처럼 큰 사진 위에 제목·정보·줄거리가 차례로 나와요. 화면을 누르면 청첩장이 열려요.'}</p>
            <div className="space-y-2">
              <Label className="text-sm font-medium">사진</Label>
              {invitation.filmDaysImage ? (
                <div className="space-y-2">
                  <InlineCropEditor key={invitation.filmDaysImage} imageUrl={invitation.filmDaysImage} settings={invitation.filmDaysImageSettings || {}}
                    onUpdate={(s) => updateField('filmDaysImageSettings', { ...(invitation.filmDaysImageSettings || { scale: 1, positionX: 0, positionY: 0 }), ...s })}
                    aspectRatio={introStyle === 'ticket' ? 1.55 : 375 / 422} containerWidth={introStyle === 'ticket' ? 240 : 200} />
                  <div className="flex justify-center gap-2">
                    <label className="px-3 py-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-100 rounded-lg cursor-pointer">
                      사진 변경
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) uploadIntroImage(file, (url) => { updateField('filmDaysImage', url); updateField('filmDaysImageSettings', undefined) }) }} />
                    </label>
                    <button type="button" onClick={() => { updateField('filmDaysImage', ''); updateField('filmDaysImageSettings', undefined) }} className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">삭제</button>
                  </div>
                </div>
              ) : (
                <label className="mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 bg-white cursor-pointer" style={{ width: introStyle === 'ticket' ? 240 : 200, aspectRatio: introStyle === 'ticket' ? '1.55' : '375 / 422' }}>
                  {introUploading ? <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <span className="text-xs text-gray-500 text-center px-2">+ 사진 추가<br /><span className="text-[10px] text-gray-400">비워두면 커버 사진</span></span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) uploadIntroImage(file, (url) => updateField('filmDaysImage', url)) }} />
                </label>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">처음 만난 날</Label>
              <Input type="date" value={invitation.filmDaysStart ?? ''} onChange={(e) => updateField('filmDaysStart', e.target.value)} />
              <p className="text-[11px] text-gray-400">오늘까지 함께한 날 수가 자동으로 세어져요 (하객이 보는 날 기준) · 비우면 'OUR WEDDING DAY'</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">제목</Label>
              <textarea value={invitation.filmDaysTitle ?? ''} rows={2} maxLength={40} placeholder={'{N} DAYS\nTOGETHER'} onChange={(e) => updateField('filmDaysTitle', e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-600 bg-white" />
              <p className="text-[11px] text-gray-400">{'{N}'} 은 함께한 날 수로 바뀌어요 · 비우면 'N DAYS TOGETHER'</p>
            </div>
            {introStyle === 'ott' ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">장르</Label>
                  <Input value={invitation.filmOttGenre ?? ''} maxLength={16} placeholder="Romance" onChange={(e) => updateField('filmOttGenre', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">줄거리</Label>
                  <textarea value={invitation.filmDaysMessage ?? ''} rows={3} maxLength={120} placeholder={'{N}일 전, 서로를 처음 만난 두 사람.\n같은 장면을 함께 보며 웃고 울던 날들이 모여\n이제 가장 긴 이야기를 시작하려 합니다.'} onChange={(e) => updateField('filmDaysMessage', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-600 bg-white" />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">좌석</Label>
                <Input value={invitation.filmTicketSeat ?? ''} maxLength={16} placeholder="YOU & ME" onChange={(e) => updateField('filmTicketSeat', e.target.value)} />
              </div>
            )}
            {([['filmDaysBg', '배경색', introStyle === 'ticket' ? '#ECE9E4' : '#0F0F12', introStyle === 'ticket' ? ['#ECE9E4', '#FFFFFF', '#E6ECF2', '#F1E6E6', '#1E2A44', '#141414'] : ['#0F0F12', '#1B1F2A', '#2A1F1D', '#F4F1EC', '#FFFFFF']],
               ['filmDaysInk', introStyle === 'ticket' ? '포인트 색 (체크·제목·스캔선)' : '포인트 색 (제목·버튼·이어보기 막대)', introStyle === 'ticket' ? '#2B2A28' : '#F3EDE4', introStyle === 'ticket' ? ['#2B2A28', '#6E2B33', '#1E2A44', '#2F6B4F', '#C0587A', '#D8A24A'] : ['#F3EDE4', '#FFFFFF', '#D8B48A', '#E5A0A8', '#9CC3E6', '#141414']]] as const).map(([key, label, def, sw]) => (
              <div key={key}>
                <Label className="text-sm font-medium mb-2 block">{label}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {sw.map((c) => (
                    <button key={c} type="button" aria-label={c} onClick={() => updateField(key, c)}
                      className={`w-8 h-8 rounded-full border-2 ${(invitation[key] || def).toLowerCase() === c.toLowerCase() ? 'border-gray-900 scale-110' : 'border-gray-200'}`} style={{ backgroundColor: c }} />
                  ))}
                  <ColorField label={label} value={invitation[key] || def} onChange={(hex) => updateField(key, hex)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {introStyle === 'dots' && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <p className="text-xs text-gray-500">사진 위에 두 사람의 영문 이름이 필기체 점으로 자동으로 수놓아져요. 다 놓이면 화면 아래 문구가 나오고, 누르면 넘어가요.</p>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">영문 이름</Label>
              <div className="grid grid-cols-2 gap-2">
                {([['filmDotsGroomEn', '신랑', invitation.groom?.nameEn || 'Groom'], ['filmDotsBrideEn', '신부', invitation.bride?.nameEn || 'Bride']] as const).map(([key, label, ph]) => (
                  <div key={key}>
                    <span className="text-[11px] text-gray-500">{label}</span>
                    <Input value={invitation[key] ?? ''} placeholder={ph} maxLength={14} onChange={(e) => updateField(key, e.target.value.replace(/[ㄱ-ㆎ가-힣]/g, ''))} />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">영문만 써져요 · 비워두면 Groom &amp; Bride</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">사진</Label>
              {invitation.filmDotsImage ? (
                <div className="space-y-2">
                  <InlineCropEditor key={invitation.filmDotsImage} imageUrl={invitation.filmDotsImage} settings={invitation.filmDotsImageSettings || {}}
                    onUpdate={(s) => updateField('filmDotsImageSettings', { ...(invitation.filmDotsImageSettings || { scale: 1, positionX: 0, positionY: 0 }), ...s })}
                    aspectRatio={9 / 16} containerWidth={170} />
                  <div className="flex justify-center gap-2">
                    <label className="px-3 py-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-100 rounded-lg cursor-pointer">
                      사진 변경
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) uploadIntroImage(file, (url) => { updateField('filmDotsImage', url); updateField('filmDotsImageSettings', undefined) }) }} />
                    </label>
                    <button type="button" onClick={() => { updateField('filmDotsImage', ''); updateField('filmDotsImageSettings', undefined) }} className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">삭제</button>
                  </div>
                </div>
              ) : (
                <label className="w-[170px] mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 bg-white cursor-pointer" style={{ aspectRatio: '9 / 16' }}>
                  {introUploading ? <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <span className="text-xs text-gray-500 text-center px-2">+ 사진 추가<br /><span className="text-[10px] text-gray-400">비워두면 커버 사진</span></span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) uploadIntroImage(file, (url) => updateField('filmDotsImage', url)) }} />
                </label>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">이름 위치</Label>
              <div className="grid grid-cols-2 gap-2">
                {([['top', '위'], ['bottom', '아래']] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => updateField('filmDotsNamePos', v)}
                    className={`py-2 rounded-md border text-sm ${(invitation.filmDotsNamePos || 'top') === v ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">자수 장식</Label>
              <div className="grid grid-cols-5 gap-2">
                {([['flourish', '덩굴'], ['sparkle', '반짝이'], ['heart', '하트'], ['twinkle', '큰 별'], ['none', '없음']] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => updateField('filmDotsDeco', v)}
                    className={`py-2 rounded-md border text-sm ${(invitation.filmDotsDeco || 'flourish') === v ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">넘기기 안내 문구</Label>
              <Input value={invitation.filmDotsCaption ?? ''} maxLength={30} placeholder="화면을 눌러 청첩장을 열어주세요" onChange={(e) => updateField('filmDotsCaption', e.target.value)} />
              <p className="text-[11px] text-gray-400">이름이 다 수놓아지면 날짜 대신 이 문구가 나와요</p>
            </div>
          </div>
        )}
      </section>

      {/* 프레임 선택 + 색상 (프레임 스타일에서만) */}
      {introStyle === 'frame' && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            프레임 선택
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {FILM_FRAMES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => updateField('filmFrameId' as any, f.id)}
                className={`rounded-lg border-2 overflow-hidden transition-all p-1 ${frameId === f.id ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="aspect-[9/16] bg-[#EFE9E2] flex items-center justify-center overflow-hidden">
                  <img src={`/frames/frame-${f.id}.webp`} alt={f.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-[10px] text-gray-700 font-medium pt-1 text-center">{f.name}</p>
              </button>
            ))}
          </div>

          {/* 인트로 문구 */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-800">인트로 문구</h4>
            <label className="block">
              <span className="text-xs text-gray-500">상단 라벨</span>
              <input type="text" value={(invitation as any).filmFrameLabel ?? 'SAVE THE DATE'} onChange={(e) => updateField('filmFrameLabel' as any, e.target.value)} placeholder="SAVE THE DATE (비우면 숨김)" className="mt-0.5 w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-600 bg-white" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">메인 문구</span>
              <input type="text" value={(invitation as any).filmFrameTitle ?? ''} onChange={(e) => updateField('filmFrameTitle' as any, e.target.value)} placeholder={`${invitation.groom?.name || '신랑'} & ${invitation.bride?.name || '신부'}`} className="mt-0.5 w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-600 bg-white" />
              <span className="text-[10px] text-gray-400">비우면 신랑 &amp; 신부 이름이 자동 표시됩니다</span>
            </label>
          </div>

          {/* 글꼴 */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <link rel="stylesheet" href={FRAME_FONTS_HREF} />
            <h4 className="text-sm font-medium text-gray-800">글꼴</h4>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">영문 (영문 이름 · 날짜)</p>
              <div className="grid grid-cols-3 gap-1.5">
                {FRAME_EN_FONTS.map((f) => (
                  <button key={f.id} type="button" onClick={() => updateField('filmFrameFontEn', f.id)}
                    className={`py-2 rounded-md border bg-white transition-colors ${(invitation.filmFrameFontEn || 'theme') === f.id ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
                    <span className="block text-[15px] leading-tight text-gray-800" style={{ fontFamily: f.family || undefined }}>{f.id === 'theme' ? '기본' : 'Jihoon'}</span>
                    <span className="block text-[9px] text-gray-400 mt-0.5">{f.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">손글씨 글꼴을 고르면 상단 라벨은 읽기 쉬운 세리프 대문자로 나와요</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">한글 (한글 이름 · 장소)</p>
              <div className="grid grid-cols-4 gap-1.5">
                {FRAME_KO_FONTS.map((f) => (
                  <button key={f.id} type="button" onClick={() => updateField('filmFrameFontKo', f.id)}
                    className={`py-2 rounded-md border bg-white transition-colors ${(invitation.filmFrameFontKo || 'theme') === f.id ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
                    <span className="block text-[15px] leading-tight text-gray-800" style={{ fontFamily: f.family || undefined }}>{f.id === 'theme' ? '기본' : '지훈'}</span>
                    <span className="block text-[9px] text-gray-400 mt-0.5">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 프레임 색상 */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-800">프레임 색상</h4>
            <div className="flex gap-2">
              <button type="button" onClick={() => updateField('filmFrameColorMode' as any, 'original')} className={`flex-1 py-2 rounded-md border text-xs transition-colors ${frameColorMode === 'original' ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>원본</button>
              <button type="button" onClick={() => updateField('filmFrameColorMode' as any, 'custom')} className={`flex-1 py-2 rounded-md border text-xs transition-colors ${frameColorMode === 'custom' ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>커스텀 색</button>
            </div>
            {frameColorMode === 'custom' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">프레임 컬러</span>
                <div className="flex items-center gap-2">
                  <ColorField label="프레임 색상" value={(invitation as any).filmFrameColor || '#ffffff'} onChange={(hex) => updateField('filmFrameColor' as any, hex)} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">글자 색상</span>
              <div className="flex items-center gap-2">
                <ColorField label="글자 색상" value={(invitation as any).filmFrameTextColor || '#726565'} onChange={(hex) => updateField('filmFrameTextColor' as any, hex)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-700">배경색</span>
                <p className="text-xs text-gray-500">프레임 주변/여백 배경 컬러</p>
              </div>
              <div className="flex items-center gap-2">
                <ColorField label="배경색" value={(invitation as any).filmFrameBgColor || '#e3e0d9'} onChange={(hex) => updateField('filmFrameBgColor' as any, hex)} />
              </div>
            </div>
          </div>

          {/* 필름(2컷): 두 번째 사진 */}
          {frameId === '8' && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-gray-800">두 번째 사진 (하단 컷)</h4>
              <p className="text-xs text-gray-500">상단 컷은 위의 커버 이미지, 하단 컷은 이 사진을 사용합니다.</p>
              <input ref={frame2InputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFrame2Upload} className="hidden" />
              {(invitation as any).filmFrameImage2 ? (
                <div className="space-y-3">
                  <div className="relative w-full max-w-[160px] aspect-square mx-auto rounded-lg overflow-hidden shadow-md">
                    <img src={(invitation as any).filmFrameImage2} alt="사진2" className="w-full h-full object-cover" />
                    {isUploadingFrame2 && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>}
                  </div>
                  <div className="flex justify-center gap-2">
                    <button type="button" onClick={() => frame2InputRef.current?.click()} disabled={isUploadingFrame2} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">사진 변경</button>
                    <button type="button" onClick={() => updateField('filmFrameImage2' as any, '')} className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">삭제</button>
                  </div>
                  <div className="p-3 bg-white rounded-lg space-y-2">
                    <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
                    <InlineCropEditor
                      imageUrl={(invitation as any).filmFrameImage2}
                      settings={(invitation as any).filmFrameImage2Settings || { scale: 1.0, positionX: 0, positionY: 0 }}
                      onUpdate={(s) => updateField('filmFrameImage2Settings' as any, { ...((invitation as any).filmFrameImage2Settings || {}), ...s })}
                      aspectRatio={1}
                      containerWidth={160}
                      freeResize
                    />
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => frame2InputRef.current?.click()} disabled={isUploadingFrame2} className="w-full aspect-square max-w-[160px] mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors">
                  {isUploadingFrame2 ? <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <span className="text-xs text-gray-500">+ 사진 추가</span>}
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* 포토부스: 사진 3장 + 배경색 + 문구 */}
      {introStyle === 'booth' && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">포토부스 사진 3장</h3>
          <p className="text-xs text-gray-500">하객이 화면을 누르면 3·2·1 카운트다운과 플래시로 위에서부터 한 컷씩 찍혀요 · 비워둔 칸은 커버 사진을 써요</p>
          <input ref={boothInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBoothUpload} className="hidden" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => {
              const src = boothImages[i]
              return (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">{i + 1}번째 컷</p>
                  {src ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <InlineCropEditor key={src} imageUrl={src} settings={boothSettings[i] || {}}
                          onUpdate={(s) => setBoothSetting(i, { ...(boothSettings[i] || { scale: 1, positionX: 0, positionY: 0 }), ...s })}
                          aspectRatio={1 / 1.16} containerWidth={150} />
                        {boothUploading === i && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>}
                      </div>
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => pickBooth(i)} className="px-3 py-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-100 rounded-lg">사진 변경</button>
                        <button type="button" onClick={() => setBoothImage(i, '')} className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">삭제</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => pickBooth(i)} disabled={boothUploading === i}
                      className="w-[150px] mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 bg-white" style={{ aspectRatio: '1 / 1.16' }}>
                      {boothUploading === i ? <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <span className="text-xs text-gray-500">+ 사진 추가</span>}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-800">배경색</h4>
            <div className="flex flex-wrap items-center gap-2">
              {['#BFD0DD', '#E8E2D8', '#F3EFE9', '#FFFFFF', '#D9C9B6', '#C9D6C3', '#2B2A28', '#1F2A36'].map((c) => (
                <button key={c} type="button" aria-label={c} onClick={() => updateField('filmBoothBgColor', c)}
                  className={`w-8 h-8 rounded-full border-2 ${(invitation.filmBoothBgColor || '#BFD0DD').toLowerCase() === c.toLowerCase() ? 'border-gray-900 scale-110' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <ColorField label="배경색" value={invitation.filmBoothBgColor || '#BFD0DD'} onChange={(hex) => updateField('filmBoothBgColor', hex)} />
            </div>
            <p className="text-[11px] text-gray-400">어두운 색을 고르면 글자가 자동으로 밝아져요</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h4 className="text-sm font-medium text-gray-800">영문 이름</h4>
            <div className="grid grid-cols-2 gap-2">
              {([['filmBoothGroomEn', '신랑', invitation.groom?.nameEn || 'Jihoon Han'], ['filmBoothBrideEn', '신부', invitation.bride?.nameEn || 'Seoyeon Yoon']] as const).map(([key, label, ph]) => (
                <label key={key} className="block">
                  <span className="text-xs text-gray-500">{label}</span>
                  <input type="text" value={invitation[key] ?? ''} placeholder={ph} maxLength={24}
                    onChange={(e) => updateField(key, e.target.value.replace(/[ㄱ-ㆎ가-힣]/g, ''))}
                    className="mt-0.5 w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-600 bg-white" />
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">맨 위 줄과 이니셜에 써져요 · &lsquo;이름 성&rsquo; 순서로 띄어 쓰면 성까지 나눠 들어가요 · 비워두면 한글 이름</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-800">사진 색감</h4>
            <div className="flex gap-2">
              {([['mono', '흑백'], ['color', '컬러']] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => updateField('filmBoothTone', v)}
                  className={`flex-1 py-2 rounded-md border text-xs ${(invitation.filmBoothTone || 'mono') === v ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>{l}</button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h4 className="text-sm font-medium text-gray-800">초대 문구</h4>
            <textarea rows={3} value={invitation.filmBoothLead ?? ''} onChange={(e) => updateField('filmBoothLead', e.target.value.split('\n').slice(0, 4).join('\n'))}
              placeholder={'Please join us\nin celebration of our\nupcoming wedding.'}
              className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-600 bg-white resize-none font-mono" />
            <p className="text-[11px] text-gray-400">왼쪽 위에 타자기 글씨로 들어가요 (4줄까지) · 비워두면 기본 문구 · 맨 위 이름·성, 아래 날짜·시간·장소·이니셜은 청첩장 정보에서 자동으로 들어가요 (영문 이름이 있으면 영문, &lsquo;Jihoon Han&rsquo;처럼 쓰면 성까지)</p>
          </div>
        </section>
      )}

      {/* 커버 이미지 (프레임 스타일에서만 표시) */}
      {needsCoverImage && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            커버 이미지
          </h3>
          <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>
            프레임 안에 들어갈 사진을 선택하세요
          </p>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverUpload}
            className="hidden"
          />
          {media.coverImage ? (
            <div className="space-y-3">
              <div className="relative w-full max-w-[200px] aspect-[9/16] mx-auto rounded-lg overflow-hidden shadow-md">
                <img src={media.coverImage} alt="커버" className="w-full h-full object-cover" />
                {isUploadingCover && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
                    <span className="text-xs text-gray-600">{uploadProgress}%</span>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  사진 변경
                </button>
                <button
                  type="button"
                  onClick={() => updateNestedField('media.coverImage', '')}
                  className="px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  삭제
                </button>
              </div>
              {/* 커버 이미지 크롭 조정 */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
                <InlineCropEditor
                  imageUrl={media.coverImage}
                  settings={media.coverImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                  onUpdate={(s) => updateNestedField('media.coverImageSettings', { ...(media.coverImageSettings || {}), ...s })}
                  aspectRatio={9/16}
                  containerWidth={160}
                  disableResize={introStyle !== 'frame'}
                  freeResize={introStyle === 'frame'}
                />
              </div>
            </div>
          ) : (
            <div
              onClick={() => !isUploadingCover && coverInputRef.current?.click()}
              className="w-full max-w-[200px] mx-auto aspect-[9/16] rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center text-gray-400 transition-colors"
            >
              {isUploadingCover ? (
                <>
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
                  <span className="text-xs">{uploadProgress}%</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">커버 사진 추가</span>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* 카카오톡 공유 설정 + OG 이미지 */}
      <ShareSettingsSection invitationId={invitationId} />

      {/* D-Day 팝업 설정 */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">D-Day 팝업</h3>
          <p className="text-xs text-gray-500 mt-0.5">결혼식 당일 안내 팝업을 설정합니다</p>
        </div>
        <DdayPopupEditor
          value={invitation.ddayPopup || DEFAULT_DDAY_POPUP}
          weddingDate={invitation.wedding.date}
          onChange={(patch) => {
            const current = invitation.ddayPopup || DEFAULT_DDAY_POPUP
            updateNestedField('ddayPopup', { ...current, ...patch })
          }}
          onPreview={() => useEditorStore.getState().setDdayPreviewOpen(true)}
        />
      </section>
    </div>
  )
}
