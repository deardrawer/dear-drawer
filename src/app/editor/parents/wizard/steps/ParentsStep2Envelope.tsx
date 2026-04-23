'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Mail, Heart, Share2, Upload, X } from 'lucide-react'
import { uploadImage } from '@/lib/imageUpload'
import type { ParentsInvitationData } from '../../page'

interface ParentsStep2EnvelopeProps {
  data: ParentsInvitationData
  updateData: (updates: Partial<ParentsInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

export default function ParentsStep2Envelope({
  data,
  updateData,
  updateNestedData,
  invitationId,
}: ParentsStep2EnvelopeProps) {
  const kakaoAspectMap: Record<string, string> = { '3:4': '3/4', '1:1': '1/1', '3:2': '3/2' }
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File, key: string, onSuccess: (url: string) => void) => {
    setUploadingImages(prev => new Set(prev).add(key))

    try {
      const result = await uploadImage(file, { invitationId: invitationId || undefined })

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
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">봉투 인트로 작성</p>
        <p className="text-sm text-purple-700">
          💙 청첩장 봉투에 표시될 정보를 입력해주세요.
        </p>
      </div>

      {/* 보내는 사람 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Mail className="w-3 h-3 text-amber-600" />
          </div>
          보내는 사람
        </h3>
        <p className="text-sm text-blue-600">
          {data.sender.side === 'groom'
            ? '💙 신랑측 부모님으로 청첩장을 보냅니다'
            : data.sender.side === 'bride'
            ? '💙 신부측 부모님으로 청첩장을 보냅니다'
            : '💙 누구의 청첩장인지 선택하고 부모님 정보를 입력해주세요.'}
        </p>

        {/* 혼주 선택 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">누구의 청첩장인가요?</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateNestedData('sender.side', 'groom')}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                data.sender.side === 'groom'
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">신랑측 혼주</div>
            </button>
            <button
              onClick={() => updateNestedData('sender.side', 'bride')}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                data.sender.side === 'bride'
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">신부측 혼주</div>
            </button>
          </div>
        </div>

        {/* 부모님 이름 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{data.sender.side === 'bride' ? '신부측 아버지 성함' : '신랑측 아버지 성함'}</Label>
            <Input
              value={data.sender.fatherName}
              onChange={(e) => updateNestedData('sender.fatherName', e.target.value)}
              placeholder="홍길동"
            />
            <div className="flex items-center gap-1.5">
              <Switch
                checked={data.sender.fatherDeceased ?? false}
                onCheckedChange={(checked) => updateNestedData('sender.fatherDeceased', checked)}
                className="scale-75 origin-left"
              />
              <span className="text-[10px] text-gray-400">고인</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{data.sender.side === 'bride' ? '신부측 어머니 성함' : '신랑측 어머니 성함'}</Label>
            <Input
              value={data.sender.motherName}
              onChange={(e) => updateNestedData('sender.motherName', e.target.value)}
              placeholder="김영희"
            />
            <div className="flex items-center gap-1.5">
              <Switch
                checked={data.sender.motherDeceased ?? false}
                onCheckedChange={(checked) => updateNestedData('sender.motherDeceased', checked)}
                className="scale-75 origin-left"
              />
              <span className="text-[10px] text-gray-400">고인</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          ※ 이름을 입력하지 않으신 분은 봉투·인사말에 표시되지 않습니다.<br />
          두 분 모두 비워두시면 서명 영역이 숨겨집니다.
        </p>

        {/* 고인 표시 스타일 (sender 고인이 한 명이라도 있을 때만 노출) */}
        {(data.sender.fatherDeceased || data.sender.motherDeceased) && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <Label className="text-xs font-medium text-gray-700">고인 표시 스타일</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateData({ deceasedDisplayStyle: 'flower' })}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  (data.deceasedDisplayStyle || 'flower') === 'flower'
                    ? 'border-gray-800 bg-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <img src="/icons/chrysanthemum.svg" alt="" className="w-4 h-4 opacity-70" />
                  <span className="text-sm font-medium">국화꽃</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateData({ deceasedDisplayStyle: 'hanja' })}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  data.deceasedDisplayStyle === 'hanja'
                    ? 'border-gray-800 bg-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm opacity-70">故</span>
                  <span className="text-sm font-medium">한자</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 신랑·신부 이름 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
            <Heart className="w-3 h-3 text-pink-500" />
          </div>
          신랑 · 신부
        </h3>
        <p className="text-sm text-blue-600">💙 결혼하는 자녀의 이름을 입력해주세요.</p>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          ※ 양가 부모님 정보와 고인 표시는 <b>03 본문 &gt; 메인 사진</b>에서 입력합니다.
        </p>

        {/* 신랑 */}
        <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg">
          <div className="text-sm font-medium text-blue-800">신랑</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-500">성</Label>
              <Input
                value={data.groom.lastName}
                onChange={(e) => updateNestedData('groom.lastName', e.target.value)}
                placeholder="김"
                className="text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] text-gray-500">이름</Label>
              <Input
                value={data.groom.firstName}
                onChange={(e) => updateNestedData('groom.firstName', e.target.value)}
                placeholder="민수"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* 신부 */}
        <div className="space-y-3 p-3 bg-pink-50/50 rounded-lg">
          <div className="text-sm font-medium text-pink-800">신부</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-500">성</Label>
              <Input
                value={data.bride.lastName}
                onChange={(e) => updateNestedData('bride.lastName', e.target.value)}
                placeholder="이"
                className="text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] text-gray-500">이름</Label>
              <Input
                value={data.bride.firstName}
                onChange={(e) => updateNestedData('bride.firstName', e.target.value)}
                placeholder="서연"
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 봉투 메시지 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
            <Mail className="w-3 h-3 text-orange-500" />
          </div>
          봉투 메시지
        </h3>
        <p className="text-sm text-blue-600">💙 청첩장 봉투에 표시될 메시지를 작성해주세요.</p>

        <div className="space-y-1.5">
          <Label className="text-xs">편지 메시지 (줄바꿈으로 구분)</Label>
          <Textarea
            value={data.envelope.message.join('\n')}
            onChange={(e) => updateNestedData('envelope.message', e.target.value.split('\n'))}
            placeholder="항상 저희 가족&#10;챙겨주셔서 감사합니다&#10;&#10;좋은 사람 만나&#10;결혼하게 되었습니다"
            rows={8}
            className="font-light leading-relaxed"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">기본 인사 (게스트 정보 없을 때)</Label>
          <Input
            value={data.envelope.defaultGreeting}
            onChange={(e) => updateNestedData('envelope.defaultGreeting', e.target.value)}
            placeholder="소중한 분께"
          />
        </div>
      </section>

      {/* 공유 설정 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Share2 className="w-3 h-3 text-blue-600" />
          </div>
          공유 설정
        </h3>
        <p className="text-sm text-blue-600">💙 카카오톡, 문자 등으로 청첩장을 공유할 때 표시되는 정보입니다.</p>

        {/* 공유 제목 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">공유 제목</Label>
          <Input
            value={data.meta?.title || ''}
            onChange={(e) => updateNestedData('meta.title', e.target.value)}
            placeholder={`${data.groom.firstName || '신랑'} ♥ ${data.bride.firstName || '신부'} 결혼합니다`}
            className="text-sm"
          />
          <p className="text-[11px] text-gray-400">비워두면 자동 생성됩니다.</p>
        </div>

        {/* 공유 설명 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">공유 설명</Label>
          <Input
            value={data.meta?.description || ''}
            onChange={(e) => updateNestedData('meta.description', e.target.value)}
            placeholder={data.wedding.date ? new Date(data.wedding.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '2025년 3월 15일 토요일 오후 2시'}
            className="text-sm"
          />
          <p className="text-[11px] text-gray-400">비워두면 결혼식 날짜가 표시됩니다.</p>
        </div>

        {/* 카카오톡 공유 썸네일 */}
        <div className="space-y-2 pt-3 border-t">
          <Label className="text-xs font-medium">카카오톡 공유 썸네일</Label>
          <p className="text-xs text-blue-600">💙 카카오톡에서 공유할 때 표시되는 이미지입니다.</p>
        </div>

        {/* Kakao 비율 선택 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">썸네일 비율</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['3:4', '1:1', '3:2'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => updateNestedData('meta.kakaoThumbnailRatio', ratio)}
                className={`p-2 rounded-lg border-2 text-center transition-all ${
                  (data.meta?.kakaoThumbnailRatio || '1:1') === ratio
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-medium">
                  {ratio === '3:4' ? '세로형' : ratio === '1:1' ? '정사각형' : '가로형'}
                </div>
                <div className="text-[10px] text-gray-500">{ratio}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Kakao 썸네일 미리보기 */}
        <div className="space-y-3">
          {(() => {
            const thumbnailUrl = typeof data.meta?.kakaoThumbnail === 'string'
              ? data.meta.kakaoThumbnail
              : data.meta?.kakaoThumbnail?.url || ''
            const selectedRatio = data.meta?.kakaoThumbnailRatio || '1:1'
            const aspectRatio = kakaoAspectMap[selectedRatio]

            return thumbnailUrl ? (
              <div className="max-w-[200px] mx-auto space-y-2">
                <div className="rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
                  <div
                    className="w-full bg-stone-100"
                    style={{ aspectRatio }}
                  >
                    <img
                      src={thumbnailUrl}
                      alt="카카오 썸네일"
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
                <div className="flex gap-2">
                  <label className="flex-1 text-center text-xs py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                    교체
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
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
                    onClick={() => updateNestedData('meta.kakaoThumbnail', '')}
                    className="text-xs py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center max-w-[200px] mx-auto border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 relative"
                style={{ aspectRatio }}
              >
                <div className="flex flex-col items-center justify-center p-4">
                  <Upload className="w-6 h-6 mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500 text-center">클릭하여 업로드</p>
                  <p className="text-[10px] text-gray-400 mt-1">{selectedRatio}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
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
                {uploadingImages.has('kakao-thumbnail') && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                  </div>
                )}
              </label>
            )
          })()}
        </div>

        <p className="text-xs text-gray-400">
          * 카카오톡 공유 시 표시되는 이미지입니다. 미설정 시 갤러리 첫 번째 이미지가 사용됩니다.
        </p>

        {/* 링크 공유 썸네일 이미지 (OG Image) */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-xs font-medium">링크 공유 썸네일 (OG 이미지)</Label>
          <p className="text-xs text-blue-600">
            💙 카카오톡 이외의 플랫폼(문자, 인스타그램, 페이스북 등)에서 공유할 때 표시되는 이미지입니다.
          </p>
          <p className="text-xs text-gray-500">
            이미지는 1.91:1 비율로 자동 잘립니다
          </p>
        </div>

        {/* OG 이미지 미리보기 및 업로드 */}
        <div className="space-y-3">
          {data.meta?.ogImage ? (
            <div className="max-w-[220px] mx-auto space-y-2">
              <div className="rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="w-full bg-stone-100" style={{ aspectRatio: '1.91/1' }}>
                  <img
                    src={data.meta.ogImage}
                    alt="OG 썸네일"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="px-2 py-1.5 border-t border-stone-100">
                  <p className="text-[9px] text-stone-400 leading-tight">invite.deardrawer.com</p>
                  <p className="text-[10px] font-medium text-stone-800 leading-tight mt-0.5 truncate">
                    {data.meta?.title || `${data.groom.firstName || '신랑'} ♥ ${data.bride.firstName || '신부'} 결혼합니다`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="flex-1 text-center text-xs py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                  교체
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file, 'og-image', (url) => {
                          updateNestedData('meta.ogImage', url)
                        })
                        e.target.value = ''
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => updateNestedData('meta.ogImage', '')}
                  className="text-xs py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center max-w-[220px] mx-auto border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 relative"
              style={{ aspectRatio: '1.91/1' }}
            >
              <div className="flex flex-col items-center justify-center p-4">
                <Upload className="w-6 h-6 mb-1 text-gray-400" />
                <p className="text-xs text-gray-500 text-center">클릭하여 업로드</p>
                <p className="text-[10px] text-gray-400 mt-1">1200 x 630px</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file, 'og-image', (url) => updateNestedData('meta.ogImage', url))
                    e.target.value = ''
                  }
                }}
              />
              {uploadingImages.has('og-image') && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                </div>
              )}
            </label>
          )}
        </div>

        <p className="text-xs text-gray-400">
          * 문자/SNS 링크 공유 시 표시되는 이미지입니다. 미설정 시 카카오 썸네일 또는 갤러리 첫 번째 이미지가 사용됩니다.
        </p>
      </section>
    </div>
  )
}
