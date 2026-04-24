'use client'

import { useState, useCallback } from 'react'
import type { EssayInvitationData } from '../../page'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { uploadImage } from '@/lib/imageUpload'
import { X, Plus, Upload } from 'lucide-react'

interface StepProps {
  data: EssayInvitationData
  updateData: (updates: Partial<EssayInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

function generateKakaoDescription(date: string, timeDisplay: string, venueName: string): string {
  if (!date) return ''
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()]
  const timePart = timeDisplay ? ` ${timeDisplay}` : ''
  const dateLine = `${year}년 ${month}월 ${day}일 ${dayOfWeek}요일${timePart}`
  const venueLine = venueName || ''
  return venueLine ? `${dateLine}\n${venueLine}` : dateLine
}

export default function EssayStep1BasicInfo({ data, updateData, updateNestedData, invitationId }: StepProps) {
  const kakaoAspectMap: Record<string, string> = { '3:4': '3/4', '1:1': '1/1', '3:2': '3/2' }
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

  const updateKakaoDescriptionIfAuto = useCallback((newDate?: string, newTimeDisplay?: string, newVenueName?: string) => {
    const date = newDate ?? data.wedding.date
    const timeDisplay = newTimeDisplay ?? data.wedding.timeDisplay
    const venueName = newVenueName ?? data.wedding.venue.name
    const currentDesc = data.meta.description || ''
    const currentAutoDesc = generateKakaoDescription(data.wedding.date, data.wedding.timeDisplay, data.wedding.venue.name)
    if (!currentDesc.trim() || currentDesc === currentAutoDesc) {
      const newDesc = generateKakaoDescription(date, timeDisplay, venueName)
      updateNestedData('meta.description', newDesc)
    }
  }, [data.wedding.date, data.wedding.timeDisplay, data.wedding.venue.name, data.meta.description, updateNestedData])

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

  const getDayOfWeek = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + '요일'
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 배너 */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-base text-orange-800 font-medium mb-1">기본 정보</p>
        <p className="text-sm text-orange-700">
          신랑신부 정보와 결혼식 정보를 입력하세요.
        </p>
      </div>

      {/* 이야기 형식 */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">이야기 형식</h3>
        <p className="text-sm text-gray-500">에세이를 어떤 형식으로 쓸지 선택해주세요.</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateData({ contentMode: 'story' })}
            className={`p-4 border rounded-lg text-left transition-all ${
              data.contentMode === 'story' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-lg mb-1">&#9997;&#65039;</div>
            <div className="text-sm font-medium text-gray-900">러브스토리</div>
            <div className="text-xs text-gray-500 mt-1">챕터별로 이야기를 풀어가는 서사형</div>
          </button>
          <button
            onClick={() => updateData({ contentMode: 'interview' })}
            className={`p-4 border rounded-lg text-left transition-all ${
              data.contentMode === 'interview' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-lg mb-1">&#128172;</div>
            <div className="text-sm font-medium text-gray-900">인터뷰</div>
            <div className="text-xs text-gray-500 mt-1">Q&amp;A로 서로를 소개하는 대화형</div>
          </button>
        </div>
      </section>

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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">성</Label>
              <Input
                value={data.groom.lastName}
                onChange={(e) => { updateNestedData('groom.lastName', e.target.value); updateNestedData('groom.name', e.target.value + data.groom.firstName) }}
                placeholder="김"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
              <Input
                value={data.groom.firstName}
                onChange={(e) => { updateNestedData('groom.firstName', e.target.value); updateNestedData('groom.name', data.groom.lastName + e.target.value) }}
                placeholder="민준"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-base font-semibold text-pink-800">신부</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">성</Label>
              <Input
                value={data.bride.lastName}
                onChange={(e) => { updateNestedData('bride.lastName', e.target.value); updateNestedData('bride.name', e.target.value + data.bride.firstName) }}
                placeholder="이"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">이름 <span className="text-red-500">*</span></Label>
              <Input
                value={data.bride.firstName}
                onChange={(e) => { updateNestedData('bride.firstName', e.target.value); updateNestedData('bride.name', data.bride.lastName + e.target.value) }}
                placeholder="서연"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 부모님 성함 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          부모님 성함
        </h3>
        <p className="text-xs text-gray-500">연락처, 계좌번호에 자동 연동됩니다.</p>

        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-800">신랑측</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">아버지</Label>
              <Input
                value={data.groom.father.name}
                onChange={(e) => updateNestedData('groom.father.name', e.target.value)}
                placeholder="김OO"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">어머니</Label>
              <Input
                value={data.groom.mother.name}
                onChange={(e) => updateNestedData('groom.mother.name', e.target.value)}
                placeholder="박OO"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data.groom.father.name && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.groom.father.isDeceased || false}
                  onChange={(e) => updateNestedData('groom.father.isDeceased', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300"
                />
                <span className="text-xs text-gray-500">아버지 故</span>
              </label>
            )}
            {data.groom.mother.name && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.groom.mother.isDeceased || false}
                  onChange={(e) => updateNestedData('groom.mother.isDeceased', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300"
                />
                <span className="text-xs text-gray-500">어머니 故</span>
              </label>
            )}
          </div>
        </div>

        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-sm font-semibold text-pink-800">신부측</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">아버지</Label>
              <Input
                value={data.bride.father.name}
                onChange={(e) => updateNestedData('bride.father.name', e.target.value)}
                placeholder="이OO"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">어머니</Label>
              <Input
                value={data.bride.mother.name}
                onChange={(e) => updateNestedData('bride.mother.name', e.target.value)}
                placeholder="최OO"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data.bride.father.name && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.bride.father.isDeceased || false}
                  onChange={(e) => updateNestedData('bride.father.isDeceased', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300"
                />
                <span className="text-xs text-gray-500">아버지 故</span>
              </label>
            )}
            {data.bride.mother.name && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.bride.mother.isDeceased || false}
                  onChange={(e) => updateNestedData('bride.mother.isDeceased', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300"
                />
                <span className="text-xs text-gray-500">어머니 故</span>
              </label>
            )}
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
                value={data.wedding.date}
                onChange={(e) => {
                  const newDate = e.target.value
                  updateNestedData('wedding.date', newDate)
                  updateKakaoDescriptionIfAuto(newDate, undefined, undefined)
                }}
              />
              {data.wedding.date && <p className="text-xs text-gray-400 mt-1">{getDayOfWeek(data.wedding.date)}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">시간</Label>
              <Input
                value={data.wedding.timeDisplay}
                onChange={(e) => {
                  const newTime = e.target.value
                  updateNestedData('wedding.timeDisplay', newTime)
                  updateKakaoDescriptionIfAuto(undefined, newTime, undefined)
                }}
                placeholder="오후 2시"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">예식장 이름 <span className="text-red-500">*</span></Label>
            <Input
              value={data.wedding.venue.name}
              onChange={(e) => {
                const newVenueName = e.target.value
                updateNestedData('wedding.venue.name', newVenueName)
                updateKakaoDescriptionIfAuto(undefined, undefined, newVenueName)
              }}
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
                  onClick={() => updateNestedData('wedding.venue.hideHall', !data.wedding.venue.hideHall)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    data.wedding.venue.hideHall ? 'bg-gray-400' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    data.wedding.venue.hideHall ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
            <Input
              value={data.wedding.venue.hall}
              onChange={(e) => updateNestedData('wedding.venue.hall', e.target.value)}
              placeholder="그랜드볼룸"
              disabled={data.wedding.venue.hideHall}
              className={data.wedding.venue.hideHall ? 'bg-gray-100 text-gray-400' : ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">주소 <span className="text-red-500">*</span></Label>
            <Input
              value={data.wedding.venue.address}
              onChange={(e) => updateNestedData('wedding.venue.address', e.target.value)}
              placeholder="서울특별시 강남구 ..."
            />
          </div>
        </div>
      </section>

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

            {/* 비율 선택 */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500">비율 선택</p>
              <div className="flex gap-2">
                {Object.entries({ '3:4': '세로형 3:4', '1:1': '정사각형 1:1', '3:2': '가로형 3:2' }).map(([ratio, label]) => (
                  <label key={ratio} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="kakaoRatio"
                      value={ratio}
                      checked={(data.meta.kakaoThumbnailRatio || '1:1') === ratio}
                      onChange={(e) => updateNestedData('meta.kakaoThumbnailRatio', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {data.meta.kakaoThumbnail ? (
              <div className="space-y-3">
                {/* Kakao 미리보기 카드 */}
                <div className="max-w-[200px] mx-auto rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
                  <div
                    className="w-full bg-stone-100"
                    style={{ aspectRatio: kakaoAspectMap[data.meta.kakaoThumbnailRatio || '1:1'] }}
                  >
                    <img
                      src={data.meta.kakaoThumbnail}
                      alt="카카오톡 썸네일"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-2 py-1 border-t border-stone-100">
                    <p className="text-[10px] font-medium text-stone-800 leading-tight truncate">❤ 결혼합니다.</p>
                    <p className="text-[9px] text-stone-500 leading-tight mt-0.5">{data.wedding.date ? (() => { const d = new Date(data.wedding.date + 'T00:00:00'); const wd = ['일','월','화','수','목','금','토']; return isNaN(d.getTime()) ? '' : `${String(d.getFullYear()).slice(2)}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${wd[d.getDay()]}요일${data.wedding.timeDisplay ? ` ${data.wedding.timeDisplay}` : ''}` })() : ''}</p>
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

                {/* 버튼 그룹 */}
                <div className="flex gap-2 justify-center">
                  <label className="cursor-pointer">
                    <div className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      {uploadingImages.has('kakaoThumb') ? (
                        <span className="flex items-center gap-1">
                          <div className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                          업로드 중...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          교체
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImages.has('kakaoThumb')}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, 'kakaoThumb', (url) => {
                            updateNestedData('meta.kakaoThumbnail', url)
                          })
                          e.target.value = ''
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      updateNestedData('meta.kakaoThumbnail', '')
                      updateNestedData('meta.kakaoThumbnailSettings', undefined)
                    }}
                    className="px-3 py-1.5 text-xs text-red-500 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="w-[150px] h-[150px] mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                  {uploadingImages.has('kakaoThumb') ? (
                    <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Plus className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">썸네일 업로드</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImages.has('kakaoThumb')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'kakaoThumb', (url) => {
                        updateNestedData('meta.kakaoThumbnail', url)
                      })
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* 공유 제목 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 제목</Label>
            <Input
              value={data.meta.title || ''}
              onChange={(e) => updateNestedData('meta.title', e.target.value)}
              placeholder={`${data.groom.name || '신랑'} ♥ ${data.bride.name || '신부'} 결혼합니다`}
            />
            <p className="text-xs text-gray-400">비워두면 자동 생성됩니다.</p>
          </div>

          {/* 공유 설명 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">공유 설명</Label>
            <Textarea
              value={data.meta.description || ''}
              onChange={(e) => updateNestedData('meta.description', e.target.value)}
              placeholder={generateKakaoDescription(data.wedding.date, data.wedding.timeDisplay, data.wedding.venue.name) || '2025년 5월 24일 토요일 오후 2시\n더채플앳청담'}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-gray-400">비워두면 날짜, 시간, 장소가 자동으로 표시됩니다.</p>
          </div>
        </div>
      </section>

      {/* OG 이미지 */}
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
            {(data.meta.ogImage || data.meta.kakaoThumbnail) ? (
              <div className="relative w-full bg-stone-100" style={{ aspectRatio: '1.91/1' }}>
                <img src={data.meta.ogImage || data.meta.kakaoThumbnail} alt="OG 이미지" className="w-full h-full object-cover" />
                {!data.meta.ogImage && data.meta.kakaoThumbnail && (
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
              <p className="text-[10px] font-medium text-stone-800 leading-tight mt-0.5 truncate">
                {data.meta.title || `${data.groom.name || '신랑'} ♥ ${data.bride.name || '신부'} 결혼합니다`}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">이미지는 1.91:1 비율로 자동 잘립니다</p>

          {data.meta.ogImage ? (
            <div className="flex gap-2 justify-center">
              <label className="cursor-pointer">
                <div className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  {uploadingImages.has('ogImage') ? (
                    <span className="flex items-center gap-1">
                      <div className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                      업로드 중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      교체
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImages.has('ogImage')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'ogImage', (url) => {
                        updateNestedData('meta.ogImage', url)
                      })
                      e.target.value = ''
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  updateNestedData('meta.ogImage', '')
                  updateNestedData('meta.ogImageSettings', undefined)
                }}
                className="px-3 py-1.5 text-xs text-red-500 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
              >
                삭제
              </button>
            </div>
          ) : data.meta.kakaoThumbnail ? (
            <label className="flex items-center justify-center w-full h-10 border border-amber-300 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
              <span className="text-[11px] text-amber-700 font-medium">
                {uploadingImages.has('ogImage') ? '업로드 중...' : '별도 OG 이미지로 교체하기'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImages.has('ogImage')}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, 'ogImage', (url) => {
                      updateNestedData('meta.ogImage', url)
                    })
                    e.target.value = ''
                  }
                }}
              />
            </label>
          ) : (
            <label className="block cursor-pointer">
              <div className="max-w-[220px] mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors" style={{ aspectRatio: '1.91/1', minHeight: '115px' }}>
                {uploadingImages.has('ogImage') ? (
                  <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400">OG 이미지 업로드</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImages.has('ogImage')}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, 'ogImage', (url) => {
                      updateNestedData('meta.ogImage', url)
                    })
                    e.target.value = ''
                  }
                }}
              />
            </label>
          )}
        </div>
      </section>
    </div>
  )
}
