'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import ImageUploader, { MultiImageUploader } from '@/components/editor/ImageUploader'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import type { ImageSettings } from '@/store/editorStore'
import { uploadImage } from '@/lib/imageUpload'
import type { FeedInvitationData } from '../../page'

interface StepProps {
  data: FeedInvitationData
  updateData: (updates: Partial<FeedInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

function formatTimeDisplay(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${period} ${hour12}시` : `${period} ${hour12}시 ${m}분`
}

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black'
const labelClass = 'block text-xs font-medium text-gray-600 mb-1.5'

export default function FeedStep2CoverProfile({
  data,
  updateNestedData,
  invitationId,
}: StepProps) {
  const kakaoAspectMap: Record<string, string> = { '3:4': '3/4', '1:1': '1/1', '3:2': '3/2' }
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

  const handleImageUpload = async (file: File, key: string, onSuccess: (url: string) => void) => {
    setUploadingImages(prev => new Set(prev).add(key))
    try {
      const result = await uploadImage(file, { invitationId: invitationId || undefined })
      if (result.success && result.webUrl) {
        onSuccess(result.webUrl)
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch {
      alert('이미지 업로드에 실패했습니다.')
    }
    setUploadingImages(prev => { const s = new Set(prev); s.delete(key); return s })
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-base text-orange-800 font-medium mb-1">기본 정보</p>
        <p className="text-sm text-orange-700">
          커버 이미지와 신랑신부 정보, 결혼식 정보를 입력하세요.
        </p>
      </div>

      {/* 커버 이미지 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          📷 커버 이미지
        </h3>
        <p className="text-sm text-blue-600">인스타그램 스토리에 표시되는 이미지입니다. 최대 4장까지 추가 가능합니다.</p>

        <MultiImageUploader
          images={data.media.coverImages || (data.media.coverImage ? [data.media.coverImage] : [])}
          onChange={(newImages) => {
            updateNestedData('media.coverImages', newImages)
            updateNestedData('media.coverImage', newImages[0] || '')
          }}
          invitationId={invitationId || undefined}
          maxImages={4}
          placeholder="커버 이미지 추가"
          aspectRatio="aspect-[9/16]"
          sortable
        />
      </section>

      {/* 프로필 아바타 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🧑‍🤝‍🧑 프로필 아바타
        </h3>
        <p className="text-sm text-blue-600">인스타그램 프로필 영역에 표시되는 원형 사진입니다.</p>

        <div className="flex items-start gap-4">
          {data.media.profileAvatar ? (
            <div className="relative flex-shrink-0">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-gray-200">
                <img src={data.media.profileAvatar} alt="프로필 아바타" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => {
                  updateNestedData('media.profileAvatar', '')
                  updateNestedData('media.profileAvatarSettings', undefined)
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex-shrink-0 cursor-pointer">
              <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                {uploadingImages.has('profile-avatar') ? (
                  <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImages.has('profile-avatar')}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, 'profile-avatar', (url) => {
                      updateNestedData('media.profileAvatar', url)
                    })
                    e.target.value = ''
                  }
                }}
              />
            </label>
          )}
          <div className="flex-1 text-xs text-gray-500 pt-2">
            <p>정사각형(1:1) 이미지를 권장합니다.</p>
            <p className="mt-1">비워두면 커버 이미지가 사용됩니다.</p>
          </div>
        </div>

        {data.media.profileAvatar && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <p className="text-[10px] font-medium text-gray-600">아바타 크롭 조정</p>
            <InlineCropEditor
              imageUrl={data.media.profileAvatar}
              settings={data.media.profileAvatarSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
              onUpdate={(s: Partial<ImageSettings>) => {
                const current = data.media.profileAvatarSettings || { scale: 1.0, positionX: 0, positionY: 0 }
                updateNestedData('media.profileAvatarSettings', { ...current, ...s })
              }}
              aspectRatio={1}
              containerWidth={140}
            />
          </div>
        )}
      </section>

      {/* 신랑신부 이름 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          👫 신랑신부 이름
        </h3>

        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
          <p className="text-base font-semibold text-blue-800">신랑</p>
          <div className="space-y-1.5">
            <label className={labelClass}>이름 <span className="text-red-500">*</span></label>
            <input
              className={inputClass}
              value={data.groom.name}
              onChange={(e) => updateNestedData('groom.name', e.target.value)}
              placeholder="홍길동"
            />
          </div>
        </div>

        <div className="space-y-3 p-4 bg-pink-50 rounded-lg">
          <p className="text-base font-semibold text-pink-800">신부</p>
          <div className="space-y-1.5">
            <label className={labelClass}>이름 <span className="text-red-500">*</span></label>
            <input
              className={inputClass}
              value={data.bride.name}
              onChange={(e) => updateNestedData('bride.name', e.target.value)}
              placeholder="김민지"
            />
          </div>
        </div>
      </section>

      {/* 결혼식 정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          💒 결혼식 정보
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>날짜 <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={inputClass}
                value={data.wedding.date}
                onChange={(e) => updateNestedData('wedding.date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>시간</label>
              <input
                type="time"
                className={inputClass}
                value={data.wedding.time}
                onChange={(e) => {
                  updateNestedData('wedding.time', e.target.value)
                  updateNestedData('wedding.timeDisplay', formatTimeDisplay(e.target.value))
                }}
              />
              {data.wedding.time && (
                <p className="text-xs text-gray-400 mt-1">
                  표시: {data.wedding.timeDisplay || formatTimeDisplay(data.wedding.time)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>예식장 이름 <span className="text-red-500">*</span></label>
            <input
              className={inputClass}
              value={data.wedding.venue.name}
              onChange={(e) => updateNestedData('wedding.venue.name', e.target.value)}
              placeholder="더그랜드홀"
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>예식 홀</label>
            <input
              className={inputClass}
              value={data.wedding.venue.hall}
              onChange={(e) => updateNestedData('wedding.venue.hall', e.target.value)}
              placeholder="그랜드홀 2층"
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>주소 <span className="text-red-500">*</span></label>
            <input
              className={inputClass}
              value={data.wedding.venue.address}
              onChange={(e) => updateNestedData('wedding.venue.address', e.target.value)}
              placeholder="서울시 강남구 테헤란로 123"
            />
          </div>
        </div>
      </section>

      {/* 카카오톡 공유 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          📲 카카오톡 공유 설정
        </h3>
        <p className="text-sm text-blue-600">
          💙 카카오톡으로 공유할 때 표시되는 정보를 설정해주세요.
        </p>

        {/* 경고 문구 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 mb-2">
            ⚠️ <strong>중요:</strong> 카카오톡 공유 정보는 한번 공유된 후 변경하면 캐시로 인해
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

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* 썸네일 */}
          <div className="space-y-2">
            <label className={labelClass}>공유 썸네일</label>

            {/* 비율 선택 */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-600">썸네일 비율</p>
              <div className="flex gap-2">
                {[
                  { value: '3:4', label: '세로형' },
                  { value: '1:1', label: '정사각형' },
                  { value: '3:2', label: '가로형' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="kakaoRatio"
                      value={option.value}
                      checked={(data.meta.kakaoThumbnailRatio || '1:1') === option.value}
                      onChange={(e) => updateNestedData('meta.kakaoThumbnailRatio', e.target.value)}
                      className="w-4 h-4 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 썸네일 미리보기 */}
            {data.meta.kakaoThumbnail ? (
              <div className="space-y-2">
                <div className="max-w-[200px] mx-auto">
                  <div
                    className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                    style={{ aspectRatio: kakaoAspectMap[data.meta.kakaoThumbnailRatio || '1:1'] }}
                  >
                    <img
                      src={data.meta.kakaoThumbnail}
                      alt="카카오톡 썸네일"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    {data.meta.kakaoThumbnailRatio === '3:4' ? '세로형 (3:4)' :
                     data.meta.kakaoThumbnailRatio === '3:2' ? '가로형 (3:2)' : '정사각형 (1:1)'}
                  </p>
                </div>

                <div className="flex gap-2 justify-center">
                  <label className="cursor-pointer">
                    <span className="inline-block px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      {uploadingImages.has('kakao-thumbnail') ? '업로드 중...' : '변경'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImages.has('kakao-thumbnail')}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, 'kakao-thumbnail', (url) => {
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
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-[200px] mx-auto">
                <label className="cursor-pointer block">
                  <div
                    className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
                    style={{ aspectRatio: kakaoAspectMap[data.meta.kakaoThumbnailRatio || '1:1'] }}
                  >
                    {uploadingImages.has('kakao-thumbnail') ? (
                      <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
                    ) : (
                      <div className="text-center p-4">
                        <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">썸네일 업로드</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImages.has('kakao-thumbnail')}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file, 'kakao-thumbnail', (url) => {
                          updateNestedData('meta.kakaoThumbnail', url)
                        })
                        e.target.value = ''
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* 공유 제목 */}
          <div className="space-y-1.5">
            <label className={labelClass}>공유 제목</label>
            <input
              className={inputClass}
              value={data.meta.title}
              onChange={(e) => updateNestedData('meta.title', e.target.value)}
              placeholder={`${data.groom.name || '신랑'} ♥ ${data.bride.name || '신부'} 결혼합니다`}
            />
            <p className="text-xs text-gray-400">비워두면 자동 생성됩니다.</p>
          </div>

          {/* 공유 설명 */}
          <div className="space-y-1.5">
            <label className={labelClass}>공유 설명</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={data.meta.description}
              onChange={(e) => updateNestedData('meta.description', e.target.value)}
              placeholder="소중한 분들을 초대합니다"
            />
            <p className="text-xs text-gray-400">비워두면 날짜, 시간, 장소가 자동으로 표시됩니다.</p>
          </div>
        </div>
      </section>

      {/* OG 이미지 설정 (문자, SNS 공유용) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🖼️ 공유 미리보기 이미지 (OG 이미지)
        </h3>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💙 <strong>권장 크기:</strong> 1200 x 630 픽셀 (가로형)<br />
            카카오톡 이외의 플랫폼(문자, 인스타그램, 페이스북 등)에서 공유할 때 표시되는 이미지입니다.
          </p>
        </div>

        <div className="space-y-3">
          {data.meta.ogImage ? (
            <div className="space-y-2">
              <div className="max-w-[220px] mx-auto">
                <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm" style={{ aspectRatio: '1.91/1' }}>
                  <img
                    src={data.meta.ogImage}
                    alt="OG 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-400 text-center mt-1">1.91:1 (1200x630 권장)</p>
              </div>

              <div className="flex gap-2 justify-center">
                <label className="cursor-pointer">
                  <span className="inline-block px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    {uploadingImages.has('og-image') ? '업로드 중...' : '변경'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImages.has('og-image')}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file, 'og-image', (url) => {
                          updateNestedData('meta.ogImage', url)
                          updateNestedData('meta.ogImageSettings', undefined)
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
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-[220px] mx-auto">
              <label className="cursor-pointer block">
                <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors" style={{ aspectRatio: '1.91/1' }}>
                  {uploadingImages.has('og-image') ? (
                    <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <div className="text-center p-4">
                      <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">OG 이미지 업로드</p>
                      <p className="text-[10px] text-gray-400 mt-1">1.91:1 비율로 자동 크롭</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImages.has('og-image')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'og-image', (url) => {
                        updateNestedData('meta.ogImage', url)
                        updateNestedData('meta.ogImageSettings', undefined)
                      })
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>
          )}

          {!data.meta.ogImage && data.meta.kakaoThumbnail && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-700">
                ⚠️ OG 이미지를 설정하지 않으면 카카오톡 썸네일이 기본으로 사용됩니다.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
