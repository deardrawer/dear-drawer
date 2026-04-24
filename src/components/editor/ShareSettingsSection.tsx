'use client'

import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ImageUploader from '@/components/editor/ImageUploader'
import { uploadImage } from '@/lib/imageUpload'

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

const kakaoAspectMap: Record<string, string> = { '3:4': '3/4', '1:1': '1/1', '3:2': '3/2' }

interface ShareSettingsSectionProps {
  invitationId?: string | null
}

export default function ShareSettingsSection({ invitationId }: ShareSettingsSectionProps) {
  const { invitation, updateNestedField } = useEditorStore()
  const [ogUploading, setOgUploading] = useState(false)
  const [kakaoUploading, setKakaoUploading] = useState(false)

  if (!invitation) return null

  const kakaoRatio = invitation.meta.kakaoThumbnailRatio || '1:1'
  const kakaoAspectStyle = kakaoAspectMap[kakaoRatio]

  // 날짜 포맷 (미리보기용)
  const previewDateLine = (() => {
    if (!invitation.wedding.date) return ''
    const d = new Date(invitation.wedding.date + 'T00:00:00')
    if (isNaN(d.getTime())) return ''
    const wd = ['일', '월', '화', '수', '목', '금', '토']
    const yr = String(d.getFullYear()).slice(2)
    const timePart = invitation.wedding.time
      ? (() => {
          const [h, m] = invitation.wedding.time.split(':').map(Number)
          const p = h < 12 ? '오전' : '오후'
          const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
          return m === 0 ? ` ${p} ${dh}시` : ` ${p} ${dh}시 ${m}분`
        })()
      : ''
    return `${yr}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${wd[d.getDay()]}요일${timePart}`
  })()

  const displayTitle = invitation.meta.title || `${invitation.groom.name || '신랑'} ♥ ${invitation.bride.name || '신부'} 결혼합니다`

  // 이미지 업로드 핸들러
  const handleUpload = async (file: File, target: 'kakao' | 'og') => {
    const setUploading = target === 'kakao' ? setKakaoUploading : setOgUploading
    setUploading(true)
    try {
      const result = await uploadImage(file, { invitationId: invitationId || undefined })
      if (result.success && result.webUrl) {
        if (target === 'kakao') {
          updateNestedField('meta.kakaoThumbnail', result.webUrl)
        } else {
          updateNestedField('meta.ogImage', result.webUrl)
        }
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* 카카오톡 공유 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg> 카카오톡 공유 설정
        </h3>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>카카오톡으로 공유할 때 표시되는 정보를 설정해주세요.
        </p>

        {/* 경고 문구 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 mb-2">
            <svg className="w-3 h-3 text-amber-600 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> <strong>중요:</strong> 카카오톡 공유 정보는 한번 공유된 후 변경하면 캐시로 인해
            반영되기까지 시간이 오래 걸릴 수 있습니다.
          </p>
          <details className="text-xs text-amber-700">
            <summary className="cursor-pointer font-medium hover:text-amber-900">이미지 변경하기 (펼쳐보기)</summary>
            <div className="mt-2 space-y-1 pl-2 border-l-2 border-amber-300">
              <p>이미지 변경을 위해 썸네일 캐시 초기화가 필요합니다.</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>
                  <a
                    href="https://developers.kakao.com/tool/clear/og"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 underline hover:text-amber-900"
                  >
                    카카오톡 디벨로퍼
                  </a>에 접속
                </li>
                <li>URL 부분에 카카오톡 공유링크를 입력</li>
                <li>캐시초기화 버튼 클릭</li>
                <li>다시 카카오톡 링크 공유</li>
              </ol>
            </div>
          </details>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          {/* 썸네일 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">공유 썸네일</Label>

            {/* 카카오 미리보기 카드 */}
            <div className="max-w-[200px] mx-auto rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
              {invitation.meta.kakaoThumbnail ? (
                <div className="w-full bg-stone-100" style={{ aspectRatio: kakaoAspectStyle }}>
                  <img src={invitation.meta.kakaoThumbnail} alt="카카오 preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full bg-stone-100 flex items-center justify-center min-h-[80px]" style={{ aspectRatio: kakaoAspectStyle }}>
                  <span className="text-[10px] text-stone-400">이미지 미설정</span>
                </div>
              )}
              <div className="px-2 py-1 border-t border-stone-100">
                <p className="text-[10px] font-medium text-stone-800 leading-tight truncate">❤ 결혼합니다.</p>
                <p className="text-[9px] text-stone-500 leading-tight mt-0.5">{previewDateLine}</p>
              </div>
              <div className="flex border-t border-stone-100">
                <div className="flex-1 text-center py-1 text-[9px] text-stone-500 border-r border-stone-100">청첩장 보기</div>
                <div className="flex-1 text-center py-1 text-[9px] text-stone-500">위치보기</div>
              </div>
              <div className="flex items-center justify-between px-2 py-1 border-t border-stone-100 bg-stone-50">
                <span className="text-[9px] text-stone-400">dear drawer</span>
                <span className="text-[9px] text-stone-300">&gt;</span>
              </div>
            </div>

            <p className="text-[10px] text-stone-400 text-center">기기나 앱 버전에 따라 모양이 다를 수 있습니다.</p>

            {/* 업로드/교체/삭제 버튼 */}
            {invitation.meta.kakaoThumbnail ? (
              <div className="flex gap-2 justify-center">
                <label className="text-xs text-stone-500 border border-stone-200 rounded px-2 py-1 cursor-pointer hover:bg-stone-50">
                  교체
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f, 'kakao')
                      e.target.value = ''
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    updateNestedField('meta.kakaoThumbnail', '')
                    updateNestedField('meta.kakaoThumbnailSettings', undefined)
                  }}
                  className="text-xs text-red-400 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-10 border-2 border-dashed border-stone-200 rounded-lg cursor-pointer hover:border-stone-300 transition-colors">
                <span className="text-[11px] text-stone-400">
                  {kakaoUploading ? '업로드 중...' : '이미지 업로드 (클릭)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={kakaoUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f, 'kakao')
                    e.target.value = ''
                  }}
                />
              </label>
            )}

            {/* 비율 선택 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">썸네일 비율</label>
              <div className="flex gap-1">
                {([
                  { value: '3:4' as const, label: '세로형' },
                  { value: '1:1' as const, label: '정사각형' },
                  { value: '3:2' as const, label: '가로형' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateNestedField('meta.kakaoThumbnailRatio', opt.value)}
                    className={`flex-1 text-center py-1.5 rounded-md border text-xs transition-colors ${
                      kakaoRatio === opt.value
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 공유 제목 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 제목</Label>
            <Input
              value={invitation.meta.title || ''}
              onChange={(e) => updateNestedField('meta.title', e.target.value)}
              placeholder={`${invitation.groom.name || '신랑'} ♥ ${invitation.bride.name || '신부'} 결혼합니다`}
            />
            <p className="text-xs text-gray-400">비워두면 자동 생성됩니다.</p>
          </div>

          {/* 공유 설명 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 설명</Label>
            <Textarea
              value={invitation.meta.description || ''}
              onChange={(e) => updateNestedField('meta.description', e.target.value)}
              placeholder={generateKakaoDescription(invitation.wedding.date, invitation.wedding.time, invitation.wedding.venue.name) || '2025년 5월 24일 토요일 오후 2시\n더채플앳청담'}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-gray-400">비워두면 날짜, 시간, 장소가 자동으로 표시됩니다.</p>
          </div>
        </div>
      </section>

      {/* OG 이미지 설정 (문자, SNS 공유용) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg> 공유 미리보기 이미지 (OG 이미지)
        </h3>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> <strong>권장 크기:</strong> 1200 x 630 픽셀 (가로형)<br />
            카카오톡 이외의 플랫폼(문자, 인스타그램, 페이스북 등)에서 공유할 때 표시되는 이미지입니다.
          </p>
        </div>

        <div className="space-y-3">
          {/* OG 미리보기 카드 */}
          <div className="max-w-[220px] mx-auto rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
            {(invitation.meta.ogImage || invitation.meta.kakaoThumbnail) ? (
              <div className="relative w-full bg-stone-100" style={{ aspectRatio: '1.91/1' }}>
                <img src={invitation.meta.ogImage || invitation.meta.kakaoThumbnail} alt="OG preview" className="w-full h-full object-cover" />
                {!invitation.meta.ogImage && invitation.meta.kakaoThumbnail && (
                  <div className="absolute bottom-0 left-0 right-0 bg-amber-500/80 px-1 py-0.5">
                    <p className="text-[8px] text-white text-center font-medium">카카오 썸네일 사용 중</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full bg-stone-100 flex items-center justify-center" style={{ aspectRatio: '1.91/1' }}>
                <span className="text-[10px] text-stone-400">이미지 미설정</span>
              </div>
            )}
            <div className="px-2 py-1.5 border-t border-stone-100">
              <p className="text-[9px] text-stone-400 leading-tight">invite.deardrawer.com</p>
              <p className="text-[10px] font-medium text-stone-800 leading-tight mt-0.5 truncate">{displayTitle}</p>
            </div>
          </div>

          <p className="text-[10px] text-stone-400 text-center">이미지는 1.91:1 비율로 자동 잘립니다.</p>

          {/* 업로드/교체/삭제 버튼 */}
          {invitation.meta.ogImage ? (
            <div className="flex gap-2 justify-center">
              <label className="text-xs text-stone-500 border border-stone-200 rounded px-2 py-1 cursor-pointer hover:bg-stone-50">
                교체
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f, 'og')
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  updateNestedField('meta.ogImage', '')
                  updateNestedField('meta.ogImageSettings', undefined)
                }}
                className="text-xs text-red-400 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          ) : invitation.meta.kakaoThumbnail ? (
            <label className="flex items-center justify-center w-full h-10 border border-amber-300 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
              <span className="text-[11px] text-amber-700 font-medium">
                {ogUploading ? '업로드 중...' : '별도 OG 이미지로 교체하기'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={ogUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f, 'og')
                  e.target.value = ''
                }}
              />
            </label>
          ) : (
            <label className="flex items-center justify-center w-full h-10 border-2 border-dashed border-stone-200 rounded-lg cursor-pointer hover:border-stone-300 transition-colors">
              <span className="text-[11px] text-stone-400">
                {ogUploading ? '업로드 중...' : '이미지 업로드 (클릭)'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={ogUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f, 'og')
                  e.target.value = ''
                }}
              />
            </label>
          )}
        </div>
      </section>
    </>
  )
}
