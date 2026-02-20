'use client'

import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { MultiImageUploader } from '@/components/editor/ImageUploader'
import { DebouncedInput } from '@/components/editor/DebouncedInput'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import { uploadImage } from '@/lib/imageUpload'
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react'

const SAMPLE_RECORD_GREETING = '두 사람의 하모니가\n하나의 멜로디가 되어\n평생을 함께 연주합니다.\n\n이 특별한 무대에\n여러분을 초대합니다.'

interface Step3RecordProps {
  templateId?: string
  invitationId?: string | null
}

export default function Step3Record({}: Step3RecordProps) {
  const { invitation, updateField, updateNestedField, addInterview, removeInterview, toggleSectionVisibility, setActiveSection } = useEditorStore()
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())
  const [showParents, setShowParents] = useState(true)

  if (!invitation) return null

  const handleImageUpload = async (
    file: File,
    uploadKey: string,
    onSuccess: (url: string) => void
  ) => {
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

  const updateInterviewImageSettings = (interviewIndex: number, imgIndex: number, settings: { scale?: number; positionX?: number; positionY?: number }) => {
    const interview = invitation.content.interviews[interviewIndex]
    const currentSettings = interview.imageSettings || []
    const updatedSettings = [...currentSettings]
    updatedSettings[imgIndex] = { ...currentSettings[imgIndex], ...settings }
    updateNestedField(`content.interviews.${interviewIndex}.imageSettings`, updatedSettings)
  }

  const applySampleInterviews = () => {
    const samples = [
      { question: '첫 만남', answer: '친구 소개로 만난 우리,\n첫눈에 반했다고 하면 거짓말이지만\n두 번째 만남부터는 확실했어요.' },
      { question: '사랑에 빠진 순간', answer: '같은 노래를 좋아한다는 걸 알았을 때,\n이 사람이다 싶었어요.' },
      { question: '프로포즈', answer: '특별한 건 없었어요.\n평범한 일상 속에서\n"평생 같이 있자"라는 한마디.' },
    ]
    samples.forEach((item, index) => {
      if (index < invitation.content.interviews.length) {
        updateNestedField(`content.interviews.${index}.question`, item.question)
        updateNestedField(`content.interviews.${index}.answer`, item.answer)
      }
    })
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-base text-orange-800 font-medium mb-1">Record 콘텐츠 작성</p>
        <p className="text-sm text-orange-700">
          인사말, 프로필, 러브스토리 등 레코드 앨범 스타일의 콘텐츠를 작성해주세요.
        </p>
      </div>

      {/* TRACK 01: 인사말 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🎵 인사말 (TRACK 01)
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">인사말</Label>
            {!invitation.content.greeting?.trim() && (
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => updateNestedField('content.greeting', SAMPLE_RECORD_GREETING)}
              >
                샘플 사용
              </button>
            )}
          </div>
          <Textarea
            value={invitation.content.greeting || ''}
            onChange={(e) => updateNestedField('content.greeting', e.target.value)}
            onFocus={() => setActiveSection('invitation')}
            placeholder={SAMPLE_RECORD_GREETING}
            rows={5}
            className="resize-none"
          />
        </div>
      </section>

      {/* 명언/가사 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          💬 명언 / 가사
        </h3>
        <p className="text-sm text-blue-600">좋아하는 명언이나 노래 가사를 추가해보세요</p>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">인용구</Label>
          <Textarea
            value={invitation.content.quote?.text || ''}
            onChange={(e) => updateNestedField('content.quote.text', e.target.value)}
            placeholder={"Every love story is beautiful,\nbut ours is my favorite."}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center gap-2">
            <Input
              value={invitation.content.quote?.author || ''}
              onChange={(e) => updateNestedField('content.quote.author', e.target.value)}
              placeholder="출처 (예: 작가명)"
              disabled={invitation.content.quote?.hideAuthor}
              className={`flex-1 ${invitation.content.quote?.hideAuthor ? 'opacity-50' : ''}`}
            />
            <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={invitation.content.quote?.hideAuthor || false}
                onChange={() => updateNestedField('content.quote.hideAuthor', !invitation.content.quote?.hideAuthor)}
                className="rounded"
              />
              숨기기
            </label>
          </div>
        </div>
      </section>

      {/* TRACK 02: 프로필 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          👫 프로필 (TRACK 02)
        </h3>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">프로필 사진과 한줄 소개를 입력하면 CAST 섹션에 표시됩니다.</p>
        </div>

        {/* 신랑 프로필 */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <Label className="text-sm font-medium">신랑</Label>
          <div className="flex items-start gap-4">
            {invitation.groom.profile.images[0] ? (
              <div className="relative flex-shrink-0">
                <div className="w-[76px] h-[76px] rounded-full overflow-hidden border border-gray-200">
                  <img src={invitation.groom.profile.images[0]} alt="신랑" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => {
                    updateNestedField('groom.profile.images', [])
                    updateNestedField('groom.profile.imageSettings', [])
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex-shrink-0 cursor-pointer">
                <div className="w-[76px] h-[76px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                  {uploadingImages.has('groom-profile') ? (
                    <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImages.has('groom-profile')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'groom-profile', (url) => {
                        updateNestedField('groom.profile.images', [url])
                      })
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            )}
            <div className="flex-1 space-y-2">
              <Input
                value={invitation.groom.profile.tag || ''}
                onChange={(e) => updateNestedField('groom.profile.tag', e.target.value)}
                placeholder="음악을 사랑하는 사람"
                className="text-sm"
              />
            </div>
          </div>
          {invitation.groom.profile.images[0] && (
            <div className="p-3 bg-white/70 rounded-lg space-y-2">
              <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
              <InlineCropEditor
                imageUrl={invitation.groom.profile.images[0]}
                settings={invitation.groom.profile.imageSettings?.[0] || { scale: 1.0, positionX: 0, positionY: 0 }}
                onUpdate={(s) => updateNestedField('groom.profile.imageSettings', [{ ...(invitation.groom.profile.imageSettings?.[0] || {}), ...s }])}
                aspectRatio={1}
                containerWidth={120}
              />
            </div>
          )}
        </div>

        {/* 신부 프로필 */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <Label className="text-sm font-medium">신부</Label>
          <div className="flex items-start gap-4">
            {invitation.bride.profile.images[0] ? (
              <div className="relative flex-shrink-0">
                <div className="w-[76px] h-[76px] rounded-full overflow-hidden border border-gray-200">
                  <img src={invitation.bride.profile.images[0]} alt="신부" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => {
                    updateNestedField('bride.profile.images', [])
                    updateNestedField('bride.profile.imageSettings', [])
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex-shrink-0 cursor-pointer">
                <div className="w-[76px] h-[76px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                  {uploadingImages.has('bride-profile') ? (
                    <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImages.has('bride-profile')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'bride-profile', (url) => {
                        updateNestedField('bride.profile.images', [url])
                      })
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            )}
            <div className="flex-1 space-y-2">
              <Input
                value={invitation.bride.profile.tag || ''}
                onChange={(e) => updateNestedField('bride.profile.tag', e.target.value)}
                placeholder="모든 날이 노래가 되는 사람"
                className="text-sm"
              />
            </div>
          </div>
          {invitation.bride.profile.images[0] && (
            <div className="p-3 bg-white/70 rounded-lg space-y-2">
              <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
              <InlineCropEditor
                imageUrl={invitation.bride.profile.images[0]}
                settings={invitation.bride.profile.imageSettings?.[0] || { scale: 1.0, positionX: 0, positionY: 0 }}
                onUpdate={(s) => updateNestedField('bride.profile.imageSettings', [{ ...(invitation.bride.profile.imageSettings?.[0] || {}), ...s }])}
                aspectRatio={1}
                containerWidth={120}
              />
            </div>
          )}
        </div>
      </section>

      {/* TRACK 03: 러브스토리 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            💕 러브스토리 (TRACK 03)
          </h3>
          <Switch
            checked={invitation.sectionVisibility.interview}
            onCheckedChange={() => toggleSectionVisibility('interview')}
          />
        </div>

        {invitation.sectionVisibility.interview && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">두 사람의 이야기를 앨범 트랙처럼 담아보세요.</p>
            </div>

            {invitation.content.interviews.every(i => !i.question && !i.answer) && (
              <div className="flex justify-end">
                <button onClick={applySampleInterviews} className="text-xs text-blue-600 hover:underline">
                  샘플 적용
                </button>
              </div>
            )}

            {invitation.content.interviews.map((interview, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Track {index + 1}</span>
                  {invitation.content.interviews.length > 1 && (
                    <button
                      onClick={() => removeInterview(index)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">제목</Label>
                  <DebouncedInput
                    value={interview.question}
                    onChange={(value) => updateNestedField(`content.interviews.${index}.question`, value)}
                    onFocus={() => setActiveSection('interview')}
                    placeholder={['첫 만남', '사랑에 빠진 순간', '프로포즈'][index] || '제목을 입력해주세요'}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">내용</Label>
                  <Textarea
                    value={interview.answer}
                    onChange={(e) => updateNestedField(`content.interviews.${index}.answer`, e.target.value)}
                    onFocus={() => setActiveSection('interview')}
                    placeholder="이야기를 들려주세요..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">사진 (선택, 16:10 비율)</Label>
                  {interview.images?.[0] ? (
                    <div className="space-y-2">
                      <div className="relative aspect-[16/10] w-full max-w-[240px] rounded-lg overflow-hidden bg-gray-100">
                        <img src={interview.images[0]} alt={`Track ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            updateNestedField(`content.interviews.${index}.images`, [])
                            updateNestedField(`content.interviews.${index}.imageSettings`, [])
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="p-3 bg-white/70 rounded-lg space-y-2">
                        <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
                        <InlineCropEditor
                          imageUrl={interview.images[0]}
                          settings={interview.imageSettings?.[0] || { scale: 1.0, positionX: 0, positionY: 0 }}
                          onUpdate={(s) => updateInterviewImageSettings(index, 0, s)}
                          aspectRatio={16/10}
                          containerWidth={200}
                        />
                      </div>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="aspect-[16/10] w-full max-w-[240px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                        {uploadingImages.has(`interview-${index}`) ? (
                          <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                        ) : (
                          <Plus className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImages.has(`interview-${index}`)}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file, `interview-${index}`, (url) => {
                              updateNestedField(`content.interviews.${index}.images`, [url])
                            })
                            e.target.value = ''
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}

            {invitation.content.interviews.length < 6 && (
              <button
                onClick={addInterview}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + Track 추가
              </button>
            )}
          </div>
        )}
      </section>

      {/* TRACK 04: 갤러리 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          🖼️ 갤러리 (TRACK 04) <span className="text-xs font-normal text-gray-500">(최대 20장)</span>
        </h3>

        <MultiImageUploader
          images={invitation.gallery.images}
          onChange={(images) => updateNestedField('gallery.images', images)}
          onReorder={(newImages) => {
            const oldImages = invitation.gallery.images
            const currentSettings = invitation.gallery.imageSettings || []
            const newSettings = newImages.map((img) => {
              const oldIdx = oldImages.indexOf(img)
              return currentSettings[oldIdx] || { scale: 1.0, positionX: 0, positionY: 0 }
            })
            updateNestedField('gallery.images', newImages)
            updateNestedField('gallery.imageSettings', newSettings)
          }}
          sortable={true}
          maxImages={20}
          placeholder="사진 추가"
          aspectRatio="aspect-square"
        />

        {invitation.gallery.images.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-4">
            <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
            {invitation.gallery.images.map((imageUrl, imgIndex) => {
              const settings = invitation.gallery.imageSettings?.[imgIndex] || { scale: 1.0, positionX: 0, positionY: 0 }
              return (
                <div key={imgIndex} className="space-y-2 pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                  <p className="text-[9px] text-gray-500">사진 {imgIndex + 1}</p>
                  <InlineCropEditor
                    imageUrl={imageUrl}
                    settings={settings}
                    onUpdate={(newSettings) => {
                      const currentSettings = [...(invitation.gallery.imageSettings || [])]
                      while (currentSettings.length <= imgIndex) {
                        currentSettings.push({ scale: 1.0, positionX: 0, positionY: 0 })
                      }
                      currentSettings[imgIndex] = { ...currentSettings[imgIndex], ...newSettings }
                      updateNestedField('gallery.imageSettings', currentSettings)
                    }}
                    aspectRatio={imgIndex === 0 ? 16/10 : 1}
                    containerWidth={140}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 영상 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            🎬 영상
          </h3>
          <Switch
            checked={invitation.youtube?.enabled || false}
            onCheckedChange={(checked) => updateNestedField('youtube.enabled', checked)}
          />
        </div>
        <p className="text-sm text-blue-600">유튜브 영상을 추가하세요. 갤러리 아래에 표시됩니다.</p>

        {invitation.youtube?.enabled && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">영상 제목</Label>
              <Input
                value={invitation.youtube?.title || ''}
                onChange={(e) => updateNestedField('youtube.title', e.target.value)}
                placeholder="우리의 웨딩 영상"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">유튜브 URL</Label>
              <Input
                value={invitation.youtube?.url || ''}
                onChange={(e) => updateNestedField('youtube.url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
              />
            </div>
            {invitation.youtube?.url && (() => {
              const url = invitation.youtube.url
              const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
              const videoId = match?.[1]
              if (!videoId) return (
                <p className="text-xs text-red-500">올바른 유튜브 URL을 입력해주세요.</p>
              )
              return (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )
            })()}
          </div>
        )}
      </section>

      {/* 부모님 성함 */}
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setShowParents(!showParents)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900">👨‍👩‍👧 부모님 성함</h3>
            <p className="text-xs text-gray-500 mt-0.5">선택사항</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showParents ? 'rotate-180' : ''}`} />
        </button>

        {(showParents || invitation.groom.father.name || invitation.groom.mother.name || invitation.bride.father.name || invitation.bride.mother.name) && (
          <div className="space-y-4">
            {/* 청첩장 본문 표시 토글 */}
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-xs text-amber-800">청첩장에 표시</span>
              <Switch
                checked={invitation.sectionVisibility?.parentNames !== false}
                onCheckedChange={() => toggleSectionVisibility('parentNames')}
              />
            </div>
            {/* 신랑측 */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-blue-800">신랑측</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">관계</Label>
                <Input
                  value={(invitation as any).groom.familyRole || ''}
                  onChange={(e) => updateNestedField('groom.familyRole', e.target.value)}
                  placeholder="아들 (기본값)"
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-2 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">아버지 성함</Label>
                  <Input
                    value={invitation.groom.father.name}
                    onChange={(e) => updateNestedField('groom.father.name', e.target.value)}
                    placeholder="홍OO"
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-1.5 pb-1">
                  <Switch
                    checked={invitation.groom.father.deceased || false}
                    onCheckedChange={(checked) => updateNestedField('groom.father.deceased', checked)}
                  />
                  <span className="text-xs text-gray-500">고인</span>
                </div>
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-2 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">어머니 성함</Label>
                  <Input
                    value={invitation.groom.mother.name}
                    onChange={(e) => updateNestedField('groom.mother.name', e.target.value)}
                    placeholder="OOO"
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-1.5 pb-1">
                  <Switch
                    checked={invitation.groom.mother.deceased || false}
                    onCheckedChange={(checked) => updateNestedField('groom.mother.deceased', checked)}
                  />
                  <span className="text-xs text-gray-500">고인</span>
                </div>
              </div>
            </div>

            {/* 신부측 */}
            <div className="p-4 bg-pink-50 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-pink-800">신부측</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">관계</Label>
                <Input
                  value={(invitation as any).bride.familyRole || ''}
                  onChange={(e) => updateNestedField('bride.familyRole', e.target.value)}
                  placeholder="딸 (기본값)"
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-2 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">아버지 성함</Label>
                  <Input
                    value={invitation.bride.father.name}
                    onChange={(e) => updateNestedField('bride.father.name', e.target.value)}
                    placeholder="김OO"
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-1.5 pb-1">
                  <Switch
                    checked={invitation.bride.father.deceased || false}
                    onCheckedChange={(checked) => updateNestedField('bride.father.deceased', checked)}
                  />
                  <span className="text-xs text-gray-500">고인</span>
                </div>
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-2 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">어머니 성함</Label>
                  <Input
                    value={invitation.bride.mother.name}
                    onChange={(e) => updateNestedField('bride.mother.name', e.target.value)}
                    placeholder="OOO"
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-1.5 pb-1">
                  <Switch
                    checked={invitation.bride.mother.deceased || false}
                    onCheckedChange={(checked) => updateNestedField('bride.mother.deceased', checked)}
                  />
                  <span className="text-xs text-gray-500">고인</span>
                </div>
              </div>
            </div>

            {/* 고인 표시 스타일 */}
            {(invitation.groom.father.deceased || invitation.groom.mother.deceased || invitation.bride.father.deceased || invitation.bride.mother.deceased) && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <Label className="text-sm font-medium">고인 표시 스타일</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('deceasedDisplayStyle', 'hanja')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      invitation.deceasedDisplayStyle === 'hanja'
                        ? 'border-gray-900 bg-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base">故</span>
                    <span className="text-sm text-gray-600">한자</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('deceasedDisplayStyle', 'flower')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      invitation.deceasedDisplayStyle === 'flower'
                        ? 'border-gray-900 bg-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src="/icons/chrysanthemum.svg" alt="국화" className="w-5 h-5" />
                    <span className="text-sm text-gray-600">국화</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 안내사항 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          ℹ️ 안내사항
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-blue-600">하객분들께 전달할 안내사항을 작성해주세요.</p>

          {/* 웨딩사진 */}
          <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg space-y-3">
            <Label className="text-sm font-medium text-rose-800">웨딩사진</Label>
            <p className="text-xs text-rose-600">안내사항 상단에 표시될 웨딩사진을 추가해주세요.</p>

            {invitation.guidance?.image ? (
              <div className="space-y-3">
                <div className="relative aspect-[16/9] w-full max-w-[300px] mx-auto rounded-lg overflow-hidden bg-gray-100">
                  <img src={invitation.guidance.image} alt="웨딩사진" className="w-full h-full object-cover" />
                  <button
                    onClick={() => updateNestedField('guidance.image', '')}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-3 bg-white/70 rounded-lg space-y-2">
                  <p className="text-[10px] font-medium text-rose-700">이미지 크롭 조정</p>
                  <InlineCropEditor
                    imageUrl={invitation.guidance.image}
                    settings={invitation.guidance.imageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                    onUpdate={(s) => updateNestedField('guidance.imageSettings', s)}
                    aspectRatio={16/9}
                    containerWidth={200}
                    colorClass="rose"
                  />
                </div>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="aspect-[16/9] w-full max-w-[300px] mx-auto border-2 border-dashed border-rose-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-rose-400 hover:bg-rose-50/50 transition-colors">
                  {uploadingImages.has('guidance-image') ? (
                    <div className="animate-spin w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Plus className="w-8 h-8 text-rose-400" />
                      <span className="text-xs text-rose-500">사진 추가</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImages.has('guidance-image')}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'guidance-image', (url) => {
                        updateNestedField('guidance.image', url)
                      })
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="space-y-3">
            {(() => {
              const itemOrder = invitation.content.info.itemOrder || ['dressCode', 'photoBooth', 'photoShare', 'flowerGift', 'flowerChild', 'wreath', 'shuttle', 'reception']

              const moveItem = (itemId: string, direction: 'up' | 'down') => {
                const currentIndex = itemOrder.indexOf(itemId)
                if (currentIndex === -1) return
                const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
                if (newIndex < 0 || newIndex >= itemOrder.length) return
                const newOrder = [...itemOrder]
                ;[newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]]
                updateNestedField('content.info.itemOrder', newOrder)
              }

              const itemConfigs: Record<string, { label: string; placeholder: string }> = {
                dressCode: { label: '드레스코드', placeholder: '단정한 복장으로 와주세요.' },
                photoBooth: { label: '포토부스 안내', placeholder: '로비에서 포토부스를 즐겨보세요!' },
                photoShare: { label: '사진 공유', placeholder: '결혼식에서 찍은 사진들을 공유해주세요!' },
                flowerGift: { label: '꽃 답례품', placeholder: '꽃 답례품 안내를 입력해주세요.' },
                flowerChild: { label: '화동 안내', placeholder: '화동 안내를 입력해주세요.' },
                wreath: { label: '화환 안내', placeholder: '화환 대신 축의금으로 마음을 전해주시면 감사하겠습니다.' },
                shuttle: { label: '셔틀버스 안내', placeholder: '셔틀버스 운행 안내를 입력해주세요.' },
                reception: { label: '피로연 안내', placeholder: '피로연 안내를 입력해주세요.' },
              }

              return itemOrder.map((itemId, index) => {
                const config = itemConfigs[itemId]
                if (!config) return null
                const itemData = invitation.content.info[itemId as keyof typeof invitation.content.info]
                if (!itemData || typeof itemData !== 'object' || !('enabled' in itemData)) return null

                return (
                  <div key={itemId} className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveItem(itemId, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveItem(itemId, 'down')}
                            disabled={index === itemOrder.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Label className="text-sm font-medium">{config.label}</Label>
                      </div>
                      <Switch
                        checked={itemData.enabled}
                        onCheckedChange={(checked) => updateNestedField(`content.info.${itemId}.enabled`, checked)}
                      />
                    </div>
                    {itemData.enabled && (
                      <div className="space-y-2">
                        <Textarea
                          value={itemData.content}
                          onChange={(e) => updateNestedField(`content.info.${itemId}.content`, e.target.value)}
                          rows={3}
                          className="resize-none"
                          placeholder={config.placeholder}
                        />
                        {itemId === 'photoShare' && (
                          <>
                            <Input
                              value={(itemData as typeof invitation.content.info.photoShare).buttonText || ''}
                              onChange={(e) => updateNestedField('content.info.photoShare.buttonText', e.target.value)}
                              placeholder="버튼 텍스트 (예: 사진 공유하기)"
                            />
                            <Input
                              value={(itemData as typeof invitation.content.info.photoShare).url || ''}
                              onChange={(e) => updateNestedField('content.info.photoShare.url', e.target.value)}
                              placeholder="공유 링크 URL"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            })()}

            {/* 커스텀 안내 항목들 */}
            {invitation.content.info.customItems?.map((item, index) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const newItems = [...(invitation.content.info.customItems || [])]
                      newItems[index] = { ...newItems[index], title: e.target.value }
                      updateNestedField('content.info.customItems', newItems)
                    }}
                    placeholder="항목 제목을 입력하세요"
                    className="text-sm font-medium flex-1 h-8 px-2.5 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) => {
                        const newItems = [...(invitation.content.info.customItems || [])]
                        newItems[index] = { ...newItems[index], enabled: checked }
                        updateNestedField('content.info.customItems', newItems)
                      }}
                    />
                    <button
                      onClick={() => {
                        const newItems = (invitation.content.info.customItems || []).filter((_, i) => i !== index)
                        updateNestedField('content.info.customItems', newItems)
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {item.enabled && (
                  <Textarea
                    value={item.content}
                    onChange={(e) => {
                      const newItems = [...(invitation.content.info.customItems || [])]
                      newItems[index] = { ...newItems[index], content: e.target.value }
                      updateNestedField('content.info.customItems', newItems)
                    }}
                    rows={3}
                    className="resize-none"
                    placeholder="안내 내용을 입력해주세요."
                  />
                )}
              </div>
            ))}

            <button
              onClick={() => {
                const newItem = {
                  id: `custom-${Date.now()}`,
                  title: '새 안내사항',
                  content: '',
                  enabled: true
                }
                const newItems = [...(invitation.content.info.customItems || []), newItem]
                updateNestedField('content.info.customItems', newItems)
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + 안내사항 추가
            </button>
          </div>
        </div>
      </section>

      {/* LINER NOTES (감사인사) */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          📝 감사인사 (LINER NOTES)
        </h3>

        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">제목</Label>
            <DebouncedInput
              value={invitation.content.thankYou.title || 'LINER NOTES'}
              onChange={(value) => updateNestedField('content.thankYou.title', value)}
              placeholder="LINER NOTES"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">감사 메시지</Label>
            <Textarea
              value={invitation.content.thankYou.message}
              onChange={(e) => updateNestedField('content.thankYou.message', e.target.value)}
              placeholder={'저희의 첫 앨범 발매에\n함께해 주셔서 감사합니다.\n\n여러분의 축하와 응원이\n가장 아름다운 반주가 되어줄 거예요.'}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">서명</Label>
            <DebouncedInput
              value={invitation.content.thankYou.sign}
              onChange={(value) => updateNestedField('content.thankYou.sign', value)}
              placeholder="길동 & 민지 올림"
            />
          </div>
        </div>
      </section>

      {/* FAN MAIL (방명록) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            📖 방명록 (FAN MAIL)
          </h3>
          <Switch
            checked={invitation.sectionVisibility.guestbook}
            onCheckedChange={() => toggleSectionVisibility('guestbook')}
          />
        </div>
        <p className="text-sm text-blue-600">하객분들이 축하 메시지를 남길 수 있는 방명록이 표시됩니다.</p>

        {invitation.sectionVisibility.guestbook && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-amber-800">질문 설정 (최대 10개)</p>
                <span className="text-xs text-amber-600">{invitation.content.guestbookQuestions?.length || 0}/10</span>
              </div>
              <p className="text-xs text-amber-700">하객분들에게 보여질 질문을 설정하세요.</p>

              <div className="space-y-2">
                {(invitation.content.guestbookQuestions || []).map((question, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 w-5">{index + 1}.</span>
                    <Input
                      value={question}
                      onChange={(e) => {
                        const newQuestions = [...(invitation.content.guestbookQuestions || [])]
                        newQuestions[index] = e.target.value
                        updateNestedField('content.guestbookQuestions', newQuestions)
                      }}
                      placeholder="질문을 입력하세요"
                      className="flex-1 bg-white text-sm"
                    />
                    <button
                      onClick={() => {
                        const newQuestions = (invitation.content.guestbookQuestions || []).filter((_, i) => i !== index)
                        updateNestedField('content.guestbookQuestions', newQuestions)
                      }}
                      className="p-1.5 text-amber-600 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {(invitation.content.guestbookQuestions?.length || 0) < 10 && (
                <button
                  onClick={() => {
                    const newQuestions = [...(invitation.content.guestbookQuestions || []), '']
                    updateNestedField('content.guestbookQuestions', newQuestions)
                  }}
                  className="w-full py-2 border-2 border-dashed border-amber-300 rounded-lg text-sm text-amber-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-100/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  질문 추가
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
