'use client'

import { useCallback, useState, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadImage } from '@/lib/imageUpload'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ColorField from '@/components/editor/ColorField'
import ShareSettingsSection from '@/components/editor/ShareSettingsSection'
import DdayPopupEditor from '@/components/dday/DdayPopupEditor'
import { DEFAULT_DDAY_POPUP } from '@/lib/ddayPopupTypes'

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
  const introStyle = invitation.filmIntroStyle || 'tudum'
  const needsCoverImage = introStyle === 'cinematic' || introStyle === 'frame'
  const frameId = (invitation as any).filmFrameId || '10'
  const frameColorMode = (invitation as any).filmFrameColorMode || 'original'
  const FILM_FRAMES: { id: string; name: string }[] = [
    { id: '10', name: '하트' }, { id: '4', name: '레이스' }, { id: '9', name: '오벌 액자' },
    { id: '5', name: '필리그리' }, { id: '12', name: '우표' }, { id: '8', name: '필름(2컷)' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* 인트로 스타일 선택 */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M6 4l3 6" /><path d="M12 4l3 6" /></svg>
          인트로 스타일
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {/* TUDUM 스타일 (기본) */}
          <button
            onClick={() => updateField('filmIntroStyle', 'tudum')}
            className={`relative rounded-lg border-2 overflow-hidden transition-all ${
              introStyle === 'tudum' ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {introStyle === 'tudum' && (
              <div className="absolute top-1 right-1 z-10 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="aspect-[4/3] bg-[#0A0A0A] flex flex-col items-center justify-center p-1.5 relative">
              <div className="w-5 h-0.5 bg-rose-400 mb-1 rounded-full" style={{ boxShadow: '0 0 4px rgba(212,131,143,0.4)' }} />
              <div className="text-[5px] tracking-[2px] text-rose-400 mb-1 uppercase">A Wedding Movie</div>
              <div className="text-white text-[11px] tracking-[2px] font-light leading-tight">JH</div>
              <div className="text-rose-400 text-[6px]">&amp;</div>
              <div className="text-white text-[11px] tracking-[2px] font-light leading-tight">SY</div>
              <div className="w-6 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent mt-1 mb-0.5" />
              <div className="text-[5px] tracking-[1px] text-white/40">2026.05.23</div>
            </div>
            <p className="text-[10px] text-gray-700 font-medium py-1 text-center">타이틀</p>
          </button>

          {/* Cinematic 스타일 (사진) */}
          <button
            onClick={() => updateField('filmIntroStyle', 'cinematic')}
            className={`relative rounded-lg border-2 overflow-hidden transition-all ${
              introStyle === 'cinematic' ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {introStyle === 'cinematic' && (
              <div className="absolute top-1 right-1 z-10 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="aspect-[4/3] bg-[#0A0A0A] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-600 to-gray-800" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
              <div className="absolute top-1.5 left-0 right-0 text-center">
                <span className="text-[5px] tracking-[2px] text-white/50 uppercase">A Film</span>
              </div>
              <div className="absolute bottom-1.5 left-0 right-0 text-center px-2">
                <div className="text-white text-[11px] tracking-[1px] font-light" style={{ fontStyle: 'italic' }}>Jihun</div>
                <div className="text-rose-400 text-[6px] -my-0.5">&amp;</div>
                <div className="text-white text-[11px] tracking-[1px] font-light" style={{ fontStyle: 'italic' }}>Seoyeon</div>
                <div className="w-5 h-px bg-rose-400/60 mx-auto mt-0.5 mb-0.5" />
                <div className="text-[5px] tracking-[1px] text-white/35">2026.05.23</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-700 font-medium py-1 text-center">시네마틱</p>
          </button>

          {/* 프레임 스타일 (사진 프레임) */}
          <button
            onClick={() => updateField('filmIntroStyle', 'frame')}
            className={`relative rounded-lg border-2 overflow-hidden transition-all ${
              introStyle === 'frame' ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {introStyle === 'frame' && (
              <div className="absolute top-1 right-1 z-10 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="aspect-[4/3] bg-[#EFE9E2] flex flex-col items-center justify-center p-1.5 relative">
              <div className="text-[5px] tracking-[2px] text-[#7A2E39] mb-0.5 uppercase font-semibold">Save the Date</div>
              <div className="w-9 h-9 flex items-center justify-center" style={{ color: '#7A2E39' }}>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.3C.6 8.4 2 5 5.2 5c1.9 0 3.4 1.1 4.3 2.6C10.4 6.1 11.9 5 13.8 5 17 5 18.4 8.4 17 11.7 14.5 16.4 12 21 12 21z"/></svg>
              </div>
              <div className="text-[5px] tracking-[1px] text-[#7A2E39]/70 mt-0.5">2026.05.23</div>
            </div>
            <p className="text-[10px] text-gray-700 font-medium py-1 text-center">프레임</p>
          </button>
        </div>
      </section>

      {/* 프레임 선택 + 색상 (프레임 스타일에서만) */}
      {introStyle === 'frame' && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>
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
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
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

          {/* 프레임 색상 */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-3">
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
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
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

      {/* 커버 이미지 (시네마틱 스타일에서만 표시) */}
      {needsCoverImage && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            커버 이미지
          </h3>
          <p className="text-sm text-blue-600">
            <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            시네마틱 인트로에 사용할 사진을 선택하세요
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

      {/* 신랑신부 이름 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          신랑신부 이름
        </h3>

        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-base font-semibold text-blue-800">신랑</p>
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
              placeholder="MINJU"
            />
            <p className="text-xs text-gray-400">인트로 화면에 표시됩니다. 비워두면 한글 이름이 사용됩니다.</p>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-base font-semibold text-pink-800">신부</p>
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
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M9 22V12h6v10" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
          </svg>
          결혼식 정보
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
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
