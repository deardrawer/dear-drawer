'use client'

import { useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import { uploadImage } from '@/lib/imageUpload'
import { X, Plus } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import ShareSettingsSection from '@/components/editor/ShareSettingsSection'
import DdayPopupEditor from '@/components/dday/DdayPopupEditor'
import { DEFAULT_DDAY_POPUP } from '@/lib/ddayPopupTypes'
import ColorField from '@/components/editor/ColorField'

function generateKakaoDescription(date: string, time: string, venueName: string): string {
  if (!date) return ''
  const dateObj = new Date(date)
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

interface Step2RecordProps {
  templateId?: string
  invitationId?: string | null
}

export default function Step2Record({ invitationId }: Step2RecordProps) {
  const { invitation, updateNestedField, updateField, setActiveSection, validationError } = useEditorStore()
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

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

  const handleImageUpload = async (file: File, uploadKey: string, onSuccess: (url: string) => void) => {
    setUploadingImages(prev => new Set(prev).add(uploadKey))
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        onSuccess(result.webUrl)
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingImages(prev => {
        const next = new Set(prev)
        next.delete(uploadKey)
        return next
      })
    }
  }

  if (!invitation) return null
  // 함께한 날 · LP 커버: 설정은 공용, 사진만 스타일별로 따로 (가로 1.72 / 정사각)
  const daysLp = invitation.recordIntroStyle === 'lp'
  const daysImgKey = daysLp ? 'recordLpImage' as const : 'recordDaysImage' as const
  const daysCropKey = daysLp ? 'recordLpImageSettings' as const : 'recordDaysImageSettings' as const

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="space-y-1">
        <p className="text-sm font-medium" style={{ color: 'var(--ed-text)' }}>인트로를 꾸며보세요</p>
        <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>신랑신부·결혼식 정보를 입력하고 앨범 커버와 인트로 스타일을 정해주세요.</p>
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
              placeholder="홍길동"
              className={validationError?.tab === 'names' && !invitation.groom.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
            />
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-lg" style={{ background: 'var(--ed-surface-2)' }}>
          <p className="text-base font-semibold" style={{ color: 'var(--ed-text)' }}>신부</p>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
            <Input
              value={invitation.bride.name}
              onChange={(e) => updateNestedField('bride.name', e.target.value)}
              placeholder="김민지"
              className={validationError?.tab === 'names' && !invitation.bride.name?.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}
            />
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
              placeholder="더그랜드홀"
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
              placeholder="그랜드홀 2층"
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
              placeholder="서울시 강남구 테헤란로 123"
            />
          </div>
        </div>
      </section>

      {/* 인트로 스타일 */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">인트로 스타일</h3>
        <div className="grid grid-cols-3 gap-2">
          {([['cd', 'CD PLAYER'], ['days', '함께한 날'], ['lp', 'LP 커버']] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => updateField('recordIntroStyle', id)}
              className={`py-3 rounded-lg border-2 text-sm font-medium transition-all ${(invitation.recordIntroStyle || 'cd') === id ? 'border-[color:var(--ed-accent)] bg-[color:var(--ed-accent)] text-[#F5F0ED]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {(invitation.recordIntroStyle === 'days' || invitation.recordIntroStyle === 'lp') && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <p className="text-xs text-gray-500">{daysLp
              ? '큰 숫자 제목 아래 작은 정사각 앨범 커버 뒤로 LP가 미끄러져 나와 돌아요. 아래 설정은 함께한 날과 같이 써요 (사진만 따로).'
              : "'N DAYS TOGETHER' 제목 아래 사진 카드와 작은 LP 수록곡 줄이 차례로 나타나요. 화면을 누르면 넘어가요."}</p>
            <div className="space-y-2">
              <Label className="text-sm font-medium">사진</Label>
              {invitation[daysImgKey] ? (
                <div className="space-y-2">
                  <InlineCropEditor key={invitation[daysImgKey]} imageUrl={invitation[daysImgKey]} settings={invitation[daysCropKey] || {}}
                    onUpdate={(s) => updateField(daysCropKey, { ...(invitation[daysCropKey] || { scale: 1, positionX: 0, positionY: 0 }), ...s })}
                    aspectRatio={daysLp ? 1 : 1.72} containerWidth={daysLp ? 200 : 240} />
                  <div className="flex justify-center gap-2">
                    <label className="px-3 py-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-100 rounded-lg cursor-pointer">
                      사진 변경
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleImageUpload(file, daysImgKey, (url) => { updateField(daysImgKey, url); updateField(daysCropKey, undefined) }) }} />
                    </label>
                    <button type="button" onClick={() => { updateField(daysImgKey, ''); updateField(daysCropKey, undefined) }} className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg">삭제</button>
                  </div>
                </div>
              ) : (
                <label style={{ width: daysLp ? 200 : 240, aspectRatio: daysLp ? '1' : '1.72' }} className="mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 bg-white cursor-pointer">
                  {uploadingImages.has(daysImgKey) ? <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <span className="text-xs text-gray-500 text-center px-2">+ 사진 추가<br /><span className="text-[10px] text-gray-400">비워두면 앨범 커버</span></span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleImageUpload(file, daysImgKey, (url) => updateField(daysImgKey, url)) }} />
                </label>
              )}
              <div className="grid grid-cols-2 gap-2">
                {([['mono', '흑백'], ['color', '컬러']] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => updateField('recordDaysTone', v)}
                    className={`py-2 rounded-md border text-sm ${(invitation.recordDaysTone || 'mono') === v ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>{l}</button>
                ))}
              </div>
            </div>
            {([['recordDaysBg', '배경색', '#FFFFFF', ['#FFFFFF', '#F6F1EA', '#EFE6E6', '#E4EAF1', '#E6EDE4', '#2B2A28', '#1E2A44']], ['recordDaysInk', '포인트 색 (제목·하트)', '#6E2B33', ['#6E2B33', '#1E2A44', '#2F4A3A', '#8A5A3C', '#C0587A', '#1c1c1c', '#F4F1EC']]] as const).map(([key, label, def, sw]) => (
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
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">처음 만난 날</Label>
              <Input type="date" value={invitation.recordDaysStart ?? ''} onChange={(e) => updateField('recordDaysStart', e.target.value)} />
              <p className="text-[11px] text-gray-400">오늘까지 함께한 날 수가 자동으로 세어져요 (하객이 보는 날 기준) · 비우면 'FOREVER TOGETHER'</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">맨 위 작은 문구</Label>
              <Input value={invitation.recordDaysLabel ?? ''} maxLength={20} placeholder="dear love" onChange={(e) => updateField('recordDaysLabel', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">제목</Label>
              <Textarea value={invitation.recordDaysTitle ?? ''} rows={2} maxLength={40} placeholder={'{N} DAYS\nTOGETHER'} className="resize-none" onChange={(e) => updateField('recordDaysTitle', e.target.value)} />
              <p className="text-[11px] text-gray-400">{'{N}'} 은 함께한 날 수로 바뀌어요 · 비우면 'N DAYS TOGETHER'</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">노래 제목</Label>
                <Input value={invitation.recordDaysSong ?? ''} maxLength={30} placeholder="비우면 배경음악 곡명" onChange={(e) => updateField('recordDaysSong', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">아티스트</Label>
                <Input value={invitation.recordDaysArtist ?? ''} maxLength={30} placeholder="비우면 배경음악 아티스트" onChange={(e) => updateField('recordDaysArtist', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">짧은 편지</Label>
              <Textarea value={invitation.recordDaysMessage ?? ''} rows={3} maxLength={140} className="resize-none"
                placeholder={"It's been {N} days since you said yes to me,\nand they have been the best days of my life. love you."} onChange={(e) => updateField('recordDaysMessage', e.target.value)} />
              <p className="text-[11px] text-gray-400">비우면 위 문장이 들어가요 · 사진 카드 아래 날짜 태그는 예식일이에요</p>
            </div>
          </div>
        )}

      </section>

      {/* 앨범 커버 이미지 · 앨범 자켓 · 커버 타이틀: CD PLAYER 인트로에서만 */}
      {(invitation.recordIntroStyle || 'cd') === 'cd' && (<>
        {/* 앨범 커버 이미지 */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            앨범 커버 이미지
          </h3>
          <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>바이닐 레코드 커버에 사용될 정사각형 이미지를 업로드하세요.</p>

          {invitation.media.coverImage ? (
            <div className="space-y-3">
              <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src={invitation.media.coverImage} alt="앨범 커버" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    updateNestedField('media.coverImage', '')
                    updateNestedField('media.coverImageSettings', undefined)
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
                <InlineCropEditor
                  imageUrl={invitation.media.coverImage}
                  settings={invitation.media.coverImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                  onUpdate={(s) => updateNestedField('media.coverImageSettings', { ...(invitation.media.coverImageSettings || {}), ...s })}
                  aspectRatio={1}
                  containerWidth={160}
                />
              </div>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                {uploadingImages.has('cover') ? (
                  <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500">1:1 정사각형</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImages.has('cover')}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, 'cover', (url) => {
                      updateNestedField('media.coverImage', url)
                    })
                    e.target.value = ''
                  }
                }}
              />
            </label>
          )}
        </section>

        {/* 앨범 자켓 이미지 (인사말 상단) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              앨범 자켓 이미지
            </h3>
            <Switch
              checked={!!invitation.media?.jacketImage}
              onCheckedChange={(checked) => {
                if (!checked) {
                  updateNestedField('media.jacketImage', '')
                  updateNestedField('media.jacketImageSettings', undefined)
                }
              }}
            />
          </div>
          <p className="text-sm" style={{ color: 'var(--ed-text-muted)' }}>인사말 상단에 표시될 정사각형 이미지입니다.</p>

          {invitation.media?.jacketImage ? (
            <div className="space-y-3">
              <div className="relative w-40 h-40 mx-auto rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src={invitation.media.jacketImage} alt="앨범 자켓" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    updateNestedField('media.jacketImage', '')
                    updateNestedField('media.jacketImageSettings', undefined)
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
                <InlineCropEditor
                  imageUrl={invitation.media.jacketImage}
                  settings={invitation.media.jacketImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                  onUpdate={(s) => updateNestedField('media.jacketImageSettings', { ...(invitation.media.jacketImageSettings || {}), ...s })}
                  aspectRatio={1}
                  containerWidth={160}
                />
              </div>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="w-40 h-40 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                {uploadingImages.has('jacket') ? (
                  <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500">1:1 정사각형</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImages.has('jacket')}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, 'jacket', (url) => {
                      updateNestedField('media.jacketImage', url)
                    })
                    e.target.value = ''
                  }
                }}
              />
            </label>
          )}
        </section>

        {/* 커버 타이틀 */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            커버 타이틀
          </h3>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">인트로 텍스트</Label>
            <Input
              value={invitation.design?.coverTitle || ''}
              onChange={(e) => updateNestedField('design.coverTitle', e.target.value)}
              placeholder="WE ARE GETTING MARRIED"
            />
          </div>
        </section>
      </>)}

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
