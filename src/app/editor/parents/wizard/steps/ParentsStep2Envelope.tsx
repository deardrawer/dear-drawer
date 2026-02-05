'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Mail, Heart, Share2, Upload, X, Sparkles } from 'lucide-react'
import { uploadImage } from '@/lib/imageUpload'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import ImageCropEditor from '@/components/parents/ImageCropEditor'
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
        <p className="text-sm text-blue-600">💙 누구의 청첩장인지 선택하고 부모님 정보를 입력해주세요.</p>

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
            <Label className="text-xs">아버지 성함</Label>
            <Input
              value={data.sender.fatherName}
              onChange={(e) => updateNestedData('sender.fatherName', e.target.value)}
              placeholder="홍길동"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">어머니 성함</Label>
            <Input
              value={data.sender.motherName}
              onChange={(e) => updateNestedData('sender.motherName', e.target.value)}
              placeholder="김영희"
            />
          </div>
        </div>

        {/* 서명 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">편지 서명</Label>
            <button
              type="button"
              className="text-[11px] text-blue-500 hover:text-blue-600 flex items-center gap-1"
              onClick={() => {
                const fatherName = data.sender.fatherName || '홍길동'
                const motherName = data.sender.motherName || '김영희'
                updateNestedData('sender.signature', `아버지 ${fatherName} · 어머니 ${motherName} 드림`)
              }}
            >
              <Sparkles className="w-3 h-3" />
              샘플입력
            </button>
          </div>
          <Input
            value={data.sender.signature}
            onChange={(e) => updateNestedData('sender.signature', e.target.value)}
            placeholder="아버지 홍길동 · 어머니 김영희 드림"
          />
        </div>
      </section>

      {/* 신랑·신부 정보 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
            <Heart className="w-3 h-3 text-pink-500" />
          </div>
          신랑 · 신부
        </h3>
        <p className="text-sm text-blue-600">💙 결혼하는 자녀와 양가 부모님 정보를 입력해주세요.</p>

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
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={data.groom.fatherName}
              onChange={(e) => updateNestedData('groom.fatherName', e.target.value)}
              placeholder="신랑 아버지"
              className="text-sm"
            />
            <Input
              value={data.groom.motherName}
              onChange={(e) => updateNestedData('groom.motherName', e.target.value)}
              placeholder="신랑 어머니"
              className="text-sm"
            />
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
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={data.bride.fatherName}
              onChange={(e) => updateNestedData('bride.fatherName', e.target.value)}
              placeholder="신부 아버지"
              className="text-sm"
            />
            <Input
              value={data.bride.motherName}
              onChange={(e) => updateNestedData('bride.motherName', e.target.value)}
              placeholder="신부 어머니"
              className="text-sm"
            />
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
          <p className="text-xs text-blue-600">💙 권장 사이즈: 800 x 800px (1:1 정사각형)</p>
        </div>

        <div className="space-y-3">
          <ImageCropEditor
            value={
              typeof data.meta?.kakaoThumbnail === 'string'
                ? { url: data.meta.kakaoThumbnail, cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }
                : data.meta?.kakaoThumbnail || { url: '', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 }
            }
            onChange={(cropData) => updateNestedData('meta.kakaoThumbnail', cropData.url)}
            aspectRatio={1}
            containerWidth={280}
            invitationId={invitationId || undefined}
            label=""
          />
        </div>

        <p className="text-xs text-gray-400">
          * 카카오톡 공유 시 표시되는 이미지입니다. 미설정 시 갤러리 첫 번째 이미지가 사용됩니다.
        </p>

        {/* 링크 공유 썸네일 이미지 (OG Image) */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-xs font-medium">링크 공유 썸네일 (OG 이미지)</Label>
          <p className="text-xs text-blue-600">
            💙 권장 크기: 1200 x 630 픽셀 (가로형)<br />
            카카오톡 이외의 플랫폼(문자, 인스타그램, 페이스북 등)에서 공유할 때 표시되는 이미지입니다.<br />
            카카오톡 썸네일과 다른 이미지를 사용하면 플랫폼별로 다른 미리보기를 보여줄 수 있어요.
          </p>
        </div>

        {/* OG 이미지 미리보기 및 업로드 */}
        <div className="space-y-3">
          {data.meta?.ogImage ? (
            <div className="max-w-[300px] space-y-2">
              <InlineCropEditor
                imageUrl={data.meta.ogImage}
                settings={data.meta.ogImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                onUpdate={(s) => {
                  const current = data.meta?.ogImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }
                  updateNestedData('meta.ogImageSettings', { ...current, ...s })
                }}
                aspectRatio={1200 / 630}
                containerWidth={300}
                colorClass="gray"
              />
              <div className="flex gap-2">
                <label className="flex-1 text-center text-xs py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                  이미지 교체
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file, 'og-image', (url) => {
                          updateNestedData('meta.ogImage', url)
                          updateNestedData('meta.ogImageSettings', { scale: 1.0, positionX: 0, positionY: 0 })
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
                  className="text-xs py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center max-w-[300px] aspect-[1200/630] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 relative">
              <div className="flex flex-col items-center justify-center p-4">
                <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-gray-500 text-center">클릭하여 업로드</p>
                <p className="text-xs text-gray-400 mt-1">1200 x 630px</p>
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
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
