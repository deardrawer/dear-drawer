'use client'

import ImageUploader, { MultiImageUploader } from '@/components/editor/ImageUploader'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ImageCropEditor from '@/components/parents/ImageCropEditor'
import type { CropData } from '@/components/parents/ImageCropEditor'
import type { ImageSettings } from '@/store/editorStore'
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
            <p className="text-xs text-gray-400">권장 사이즈: 600 x 600px (1:1 정사각형)</p>
            {data.meta.kakaoThumbnail ? (
              <div className="space-y-3">
                <InlineCropEditor
                  imageUrl={data.meta.kakaoThumbnail}
                  settings={data.meta.kakaoThumbnailSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                  onUpdate={(s: Partial<ImageSettings>) => {
                    const current = data.meta.kakaoThumbnailSettings || { scale: 1.0, positionX: 0, positionY: 0 }
                    updateNestedData('meta.kakaoThumbnailSettings', { ...current, ...s })
                  }}
                  aspectRatio={1}
                  containerWidth={180}
                  colorClass="amber"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateNestedData('meta.kakaoThumbnail', '')
                    updateNestedData('meta.kakaoThumbnailSettings', undefined)
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  이미지 삭제
                </button>
              </div>
            ) : (
              <div className="max-w-[150px]">
                <ImageUploader
                  value={data.meta.kakaoThumbnail}
                  onChange={(url) => updateNestedData('meta.kakaoThumbnail', url)}
                  invitationId={invitationId || undefined}
                  placeholder="썸네일 업로드"
                  aspectRatio="aspect-square"
                />
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
          <ImageCropEditor
            value={{
              url: data.meta.ogImage || '',
              cropX: data.meta.ogImageSettings?.cropX ?? 0,
              cropY: data.meta.ogImageSettings?.cropY ?? 0,
              cropWidth: data.meta.ogImageSettings?.cropWidth ?? 1,
              cropHeight: data.meta.ogImageSettings?.cropHeight ?? 1,
            }}
            onChange={(cropData: CropData) => {
              updateNestedData('meta.ogImage', cropData.url)
              updateNestedData('meta.ogImageSettings', {
                ...(data.meta.ogImageSettings || { scale: 1, positionX: 0, positionY: 0 }),
                cropX: cropData.cropX,
                cropY: cropData.cropY,
                cropWidth: cropData.cropWidth,
                cropHeight: cropData.cropHeight,
              })
            }}
            aspectRatio={1200 / 630}
            containerWidth={280}
            invitationId={invitationId || undefined}
            label="공유 미리보기 이미지"
          />

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
