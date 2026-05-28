'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import type { DdayPopupData, DdayPopupPage, ImageWithSettings, ImageSettings } from '@/lib/ddayPopupTypes'
import { uploadImage } from '@/lib/imageUpload'

interface DdayPopupEditorProps {
  value: DdayPopupData
  weddingDate: string
  onChange: (patch: Partial<DdayPopupData>) => void
  onPreview?: () => void
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const DEFAULT_SETTINGS: ImageSettings = { scale: 1, positionX: 0, positionY: 0 }
const MAX_PAGES = 5
const MAX_LINKS = 2
const MAX_IMAGES = 3
const MAX_LEN_TITLE = 20
const MAX_LEN_PAGE_TITLE = 30
const MAX_LEN_BODY = 200
const MAX_LEN_BUTTON = 15
const MAX_LEN_LINK_LABEL = 10

export default function DdayPopupEditor({ value, weddingDate, onChange, onPreview }: DdayPopupEditorProps) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  const updatePage = (index: number, patch: Partial<DdayPopupPage>) => {
    onChange({
      pages: value.pages.map((page, i) => (i === index ? { ...page, ...patch } : page)),
    })
  }

  const addPage = () => {
    if (value.pages.length >= MAX_PAGES) return
    onChange({ pages: [...value.pages, { title: '', body: '' }] })
  }

  const removePage = (index: number) => {
    onChange({ pages: value.pages.filter((_, i) => i !== index) })
  }

  const handleImageUpload = async (pageIdx: number, file: File) => {
    setUploadingIdx(pageIdx)
    try {
      const result = await uploadImage(file)
      if (result.success && result.webUrl) {
        const img: ImageWithSettings = {
          url: result.webUrl,
          settings: { ...DEFAULT_SETTINGS },
        }
        const page = value.pages[pageIdx]
        const nextImages = [...(page.images || []), img]
        updatePage(pageIdx, { images: nextImages })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingIdx(null)
    }
  }

  const removeImage = (pageIdx: number, imgIdx: number) => {
    const page = value.pages[pageIdx]
    const nextImages = (page.images || []).filter((_, i) => i !== imgIdx)
    updatePage(pageIdx, { images: nextImages })
  }

  return (
    <div className="space-y-3">
      {/* 활성화 토글 */}
      <label className="flex items-center justify-between">
        <span className="text-xs text-stone-600">D-Day 팝업 사용</span>
        <button
          type="button"
          onClick={() => onChange({ enabled: !value.enabled })}
          className={`relative w-9 h-5 rounded-full transition-colors ${value.enabled ? 'bg-stone-900' : 'bg-stone-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${value.enabled ? 'translate-x-4' : ''}`} />
        </button>
      </label>

      {value.enabled && (
        <>
          {/* 표시 기간 — 날짜 선택 */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-stone-400">표시 기간</span>
            {!weddingDate ? (
              <p className="text-[10px] text-red-500">결혼식 날짜를 먼저 설정해주세요</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-500 shrink-0 w-10">시작일</span>
                  <input
                    type="date"
                    value={value.displayStart || addDays(weddingDate, -7)}
                    min={addDays(weddingDate, -10)}
                    max={value.displayEnd || weddingDate}
                    onChange={(e) => onChange({ displayStart: e.target.value })}
                    className="flex-1 border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-500 shrink-0 w-10">종료일</span>
                  <input
                    type="date"
                    value={value.displayEnd || weddingDate}
                    min={value.displayStart || addDays(weddingDate, -7)}
                    max={addDays(weddingDate, 30)}
                    onChange={(e) => onChange({ displayEnd: e.target.value })}
                    className="flex-1 border border-stone-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
                  />
                </div>
                <p className="text-[10px] text-stone-400">결혼식 10일 전부터 30일 후까지 지정할 수 있습니다</p>
              </>
            )}
          </div>

          {/* 팝업 제목 */}
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-stone-400">팝업 제목</span>
              <span className="text-[10px] text-stone-400">{(value.title || '').length}/{MAX_LEN_TITLE}</span>
            </div>
            <input
              type="text"
              value={value.title || ''}
              maxLength={MAX_LEN_TITLE}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="결혼식 당일 안내"
              className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </label>

          {/* 텍스트 정렬 */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400">텍스트 정렬</span>
            <div className="mt-1 flex gap-1.5">
              {([['left', '왼쪽'], ['center', '가운데']] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange({ textAlign: id })}
                  className={`flex-1 px-2 py-1.5 rounded-md border text-[10px] transition-colors ${
                    (value.textAlign || 'left') === id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-600 hover:border-stone-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 페이지 카드 리스트 */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-stone-400">
              페이지 ({value.pages.length}/{MAX_PAGES})
            </span>

            {value.pages.map((page, index) => {
              const images = page.images || []
              return (
                <div
                  key={index}
                  className="rounded-md border border-stone-200 p-2.5 bg-white space-y-2"
                >
                  {/* 페이지 헤더 */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-stone-500">페이지 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePage(index)}
                      aria-label="페이지 삭제"
                      className="p-0.5 text-stone-400 hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* 제목 */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-stone-400">제목</span>
                      <span className="text-[10px] text-stone-400">{page.title.length}/{MAX_LEN_PAGE_TITLE}</span>
                    </div>
                    <input
                      type="text"
                      value={page.title}
                      maxLength={MAX_LEN_PAGE_TITLE}
                      onChange={(e) => updatePage(index, { title: e.target.value })}
                      placeholder="페이지 제목"
                      className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
                    />
                  </div>

                  {/* 본문 */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-stone-400">본문</span>
                      <span className="text-[10px] text-stone-400">{page.body.length}/{MAX_LEN_BODY}</span>
                    </div>
                    <textarea
                      value={page.body}
                      maxLength={MAX_LEN_BODY}
                      onChange={(e) => updatePage(index, { body: e.target.value })}
                      rows={3}
                      placeholder="안내 내용"
                      className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600 leading-relaxed resize-none"
                    />
                  </div>

                  {/* 이미지 (최대 3장) */}
                  <div className="space-y-1.5">
                    {images.length > 0 && (
                      <div className="flex gap-1.5">
                        {images.map((img, ii) => (
                          <div key={ii} className="relative flex-1 rounded-md overflow-hidden border border-stone-200">
                            <img src={img.url} alt="" className="w-full h-20 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(index, ii)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {images.length < MAX_IMAGES && (
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingIdx === index}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleImageUpload(index, f)
                            e.target.value = ''
                          }}
                        />
                        <div
                          className={`w-full border-2 border-dashed rounded-md px-3 py-2.5 text-center text-[11px] transition-colors ${
                            uploadingIdx === index
                              ? 'border-stone-300 bg-stone-50 text-stone-400 cursor-not-allowed'
                              : 'border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700'
                          }`}
                        >
                          {uploadingIdx === index ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 size={12} className="animate-spin" />
                              업로드 중
                            </span>
                          ) : (
                            <>+ 이미지 추가 ({images.length}/{MAX_IMAGES})</>
                          )}
                        </div>
                      </label>
                    )}
                  </div>

                  {/* 링크 (최대 2개) */}
                  <div className="space-y-1.5">
                    {(page.links || []).map((link, li) => (
                      <div key={li} className="flex gap-1.5 items-center">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => {
                            const next = [...(page.links || [])]
                            next[li] = { ...next[li], url: e.target.value }
                            updatePage(index, { links: next })
                          }}
                          placeholder="링크 URL"
                          className="flex-1 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
                        />
                        <input
                          type="text"
                          value={link.label}
                          maxLength={MAX_LEN_LINK_LABEL}
                          onChange={(e) => {
                            const next = [...(page.links || [])]
                            next[li] = { ...next[li], label: e.target.value }
                            updatePage(index, { links: next })
                          }}
                          placeholder="버튼 텍스트"
                          className="w-24 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-stone-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = (page.links || []).filter((_, i) => i !== li)
                            updatePage(index, { links: next })
                          }}
                          className="p-0.5 text-stone-400 hover:text-red-600 shrink-0"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {(page.links || []).length < MAX_LINKS && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(page.links || []), { url: '', label: '' }]
                          updatePage(index, { links: next })
                        }}
                        className="text-[10px] text-stone-500 hover:text-stone-700 transition-colors"
                      >
                        + 링크 추가
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {value.pages.length < MAX_PAGES && (
              <button
                type="button"
                onClick={addPage}
                className="w-full flex items-center justify-center gap-1.5 border border-dashed border-stone-300 rounded-md py-2 text-xs text-stone-500 hover:border-stone-500 hover:text-stone-800 transition-colors"
              >
                <Plus size={13} />
                페이지 추가
              </button>
            )}
          </div>

          {/* 확인 버튼 텍스트 */}
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-stone-400">확인 버튼 텍스트</span>
              <span className="text-[10px] text-stone-400">{(value.buttonLabel || '').length}/{MAX_LEN_BUTTON}</span>
            </div>
            <input
              type="text"
              value={value.buttonLabel || ''}
              maxLength={MAX_LEN_BUTTON}
              onChange={(e) => onChange({ buttonLabel: e.target.value })}
              placeholder="확인했습니다"
              className="mt-0.5 w-full border border-stone-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-600 bg-white"
            />
          </label>

          {/* D-day 표시 토글 */}
          <label className="flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-600">D-Day 카운터 표시</span>
              <p className="text-[10px] text-stone-400">팝업에 D-3 형태의 카운터를 표시합니다</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ showDday: !value.showDday })}
              className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${value.showDday ? 'bg-stone-900' : 'bg-stone-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${value.showDday ? 'translate-x-4' : ''}`} />
            </button>
          </label>

          {/* 팝업 미리보기 버튼 */}
          {onPreview && value.pages.length > 0 && (
            <button
              type="button"
              onClick={onPreview}
              className="mt-3 w-full flex items-center justify-center gap-1.5 border border-stone-300 rounded-md py-2 text-xs text-stone-600 hover:border-stone-500 hover:text-stone-800 transition-colors"
            >
              <span style={{ fontSize: 14 }}>🔔</span>
              팝업 미리보기
            </button>
          )}
        </>
      )}
    </div>
  )
}
