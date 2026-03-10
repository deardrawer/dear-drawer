'use client'

import { useState, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Play, Pause, Upload, X, Loader2, Plus } from 'lucide-react'
import { bgmPresets } from '@/lib/bgmPresets'
import InlineCropEditor from '@/components/editor/InlineCropEditor'
import { uploadImage } from '@/lib/imageUpload'
import type { EssayInvitationData } from '../../page'

// Essay 전용 컬러 테마
const ESSAY_THEMES = [
  { id: 'essay-ivory' as const, name: '아이보리', bg: '#FAF8F3', accent: '#8B7355', text: '#3D3028', default: true },
  { id: 'essay-blush' as const, name: '블러시 핑크', bg: '#FDF6F4', accent: '#C4818E', text: '#4A3238' },
  { id: 'essay-sage' as const, name: '세이지 그린', bg: '#F5F7F3', accent: '#6B8A5E', text: '#2E3A2A' },
  { id: 'essay-mono' as const, name: '모노톤', bg: '#FFFFFF', accent: '#555555', text: '#1A1A1A' },
  { id: 'essay-sky' as const, name: '스카이', bg: '#F4F8FC', accent: '#5B8CB5', text: '#2A3440' },
  { id: 'essay-coral' as const, name: '코랄', bg: '#FEF6F2', accent: '#D4836B', text: '#3E2E28' },
]

// 폰트 스타일 옵션
const FONT_STYLES = [
  { id: 'classic' as const, name: '클래식', sample: '우리 결혼합니다', fontFamily: "'Ridibatang', serif", desc: '정갈한 바탕체' },
  { id: 'modern' as const, name: '모던', sample: '우리 결혼합니다', fontFamily: "'Pretendard', sans-serif", desc: '세련된 산세리프체', recommended: true },
  { id: 'romantic' as const, name: '손글씨', sample: '우리 결혼합니다', fontFamily: "'Okticon', serif", desc: 'okticon' },
  { id: 'contemporary' as const, name: '컨템포러리', sample: '우리 결혼합니다', fontFamily: "'JeonnamEducationBarun', sans-serif", desc: '깔끔한 바른체' },
  { id: 'luxury' as const, name: '포멀', sample: '우리 결혼합니다', fontFamily: "'ELandChoice', serif", desc: '고급스러운 명조체' },
]

interface Props {
  data: EssayInvitationData
  updateData: (updates: Partial<EssayInvitationData>) => void
  updateNestedData: (path: string, value: unknown) => void
  invitationId: string | null
}

export default function EssayStepDesign({ data, updateData, updateNestedData, invitationId }: Props) {
  const [playingBgm, setPlayingBgm] = useState<string | null>(null)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement>(null)

  const bgm = data.bgm
  const fontStyle = data.fontStyle || 'modern'
  const colorTheme = data.colorTheme || 'essay-ivory'

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

  // BGM 재생/정지 토글
  const toggleBgmPreview = (url: string) => {
    if (playingBgm === url) {
      audioRef.current?.pause()
      setPlayingBgm(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
        setPlayingBgm(url)
      }
    }
  }

  // BGM 선택
  const selectBgm = (url: string) => {
    updateNestedData('bgm.url', url)
    updateNestedData('bgm.enabled', true)
  }

  // 커스텀 BGM인지 확인
  const isCustomBgm = bgm?.url && !bgmPresets.some(p => p.url === bgm?.url)

  // MP3 업로드 핸들러
  const handleAudioUpload = async (file: File) => {
    if (file.type !== 'audio/mpeg' && !file.name.endsWith('.mp3')) {
      alert('MP3 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }
    setIsUploadingAudio(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('invitationId', invitationId || 'temp')
      const res = await fetch('/api/upload-audio', { method: 'POST', body: formData })
      const result = await res.json() as { success?: boolean; url?: string; error?: string }
      if (result.success && result.url) {
        updateNestedData('bgm.url', result.url)
        updateNestedData('bgm.enabled', true)
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingAudio(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">디자인 설정</p>
        <p className="text-sm text-purple-700">
          표지 디자인, 폰트, 색상, 배경음악을 설정해주세요.
        </p>
      </div>

      {/* 커버 이미지 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          커버 이미지
        </h3>
        <p className="text-sm text-blue-600">에세이 표지에 사용될 이미지를 업로드하세요.</p>

        {data.media.coverImage ? (
          <div className="space-y-3">
            <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img src={data.media.coverImage} alt="커버 이미지" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  updateNestedData('media.coverImage', '')
                  updateNestedData('media.coverImageSettings', undefined)
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-[10px] font-medium text-gray-600">이미지 크롭 조정</p>
              <InlineCropEditor
                imageUrl={data.media.coverImage}
                settings={data.media.coverImageSettings || { scale: 1.0, positionX: 0, positionY: 0 }}
                onUpdate={(s) => updateNestedData('media.coverImageSettings', { ...(data.media.coverImageSettings || {}), ...s })}
                aspectRatio={1}
                containerWidth={160}
              />
            </div>
          </div>
        ) : (
          <label className="block cursor-pointer">
            <div className="w-48 h-48 mx-auto border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
              {uploadingImages.has('cover') ? (
                <div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Plus className="w-8 h-8 text-orange-400" />
                  <span className="text-xs text-orange-500">1:1 정사각형</span>
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
                    updateNestedData('media.coverImage', url)
                  })
                  e.target.value = ''
                }
              }}
            />
          </label>
        )}
      </section>

      {/* 표지 디자인 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          표지 디자인
        </h3>
        <p className="text-sm text-gray-500">표지에 적용할 디자인을 선택하세요.</p>

        <div className="grid grid-cols-2 gap-3">
          {/* 전면 이미지 */}
          <button
            onClick={() => updateNestedData('design.coverDesign', 'full')}
            className={`relative border rounded-xl overflow-hidden transition-all ${
              data.design.coverDesign === 'full' ? 'border-black ring-2 ring-black/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="aspect-[3/4] bg-gradient-to-b from-gray-300 to-gray-400 flex items-end justify-center p-2 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
              <div className="relative text-center">
                <div className="text-[6px] text-white/80 tracking-widest mb-0.5">WEDDING</div>
                <div className="text-[5px] text-white/70">Min &amp; Seo</div>
              </div>
            </div>
            <div className="p-2 bg-white text-center">
              <p className="text-[11px] font-semibold text-gray-900">전면</p>
              <p className="text-[9px] text-gray-500 leading-tight mt-0.5">이미지가 화면 전체를 채움</p>
            </div>
            {data.design.coverDesign === 'full' && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </button>

          {/* 스크랩북 */}
          <button
            onClick={() => updateNestedData('design.coverDesign', 'center')}
            className={`relative border rounded-xl overflow-hidden transition-all ${
              data.design.coverDesign === 'center' ? 'border-black ring-2 ring-black/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="aspect-[3/4] flex flex-col items-center justify-center gap-1.5 p-3" style={{ background: '#EDEBE6' }}>
              <div className="text-[6px] italic" style={{ fontFamily: "'Georgia', serif", color: '#3D3028' }}>save the date</div>
              <div className="relative">
                <div style={{ position: 'absolute', top: '-3px', right: '2px', width: '14px', height: '5px', background: 'rgba(210,200,180,0.7)', transform: 'rotate(8deg)', zIndex: 2 }} />
                <div className="w-10 h-12 bg-gradient-to-br from-gray-300 to-gray-400 border border-gray-200" />
              </div>
              <div className="text-[5px]" style={{ color: '#3D3028', letterSpacing: '2px' }}>Min &amp; Seo</div>
            </div>
            <div className="p-2 bg-white text-center">
              <p className="text-[11px] font-semibold text-gray-900">스크랩북</p>
              <p className="text-[9px] text-gray-500 leading-tight mt-0.5">테이프 장식 + 사진</p>
            </div>
            {data.design.coverDesign === 'center' && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </button>

          {/* 타이포 중심 */}
          <button
            onClick={() => updateNestedData('design.coverDesign', 'typo')}
            className={`relative border rounded-xl overflow-hidden transition-all ${
              data.design.coverDesign === 'typo' ? 'border-black ring-2 ring-black/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center p-3 relative">
              <div className="bg-white px-3 py-4 text-center w-[80%]">
                <div className="text-[8px] font-bold text-gray-800 tracking-wider leading-tight">OUR<br />ESSAY</div>
                <div className="w-4 h-px bg-gray-300 mx-auto my-1.5" />
                <div className="text-[5px] text-gray-500 tracking-wide">Min &amp; Seo</div>
              </div>
            </div>
            <div className="p-2 bg-white text-center">
              <p className="text-[11px] font-semibold text-gray-900">타이포</p>
              <p className="text-[9px] text-gray-500 leading-tight mt-0.5">이미지 배경 + 화이트 카드</p>
            </div>
            {data.design.coverDesign === 'typo' && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </button>

          {/* 엠보싱 */}
          <button
            onClick={() => updateNestedData('design.coverDesign', 'emboss')}
            className={`relative border rounded-xl overflow-hidden transition-all ${
              data.design.coverDesign === 'emboss' ? 'border-black ring-2 ring-black/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="aspect-[3/4] flex flex-col items-center justify-center gap-1.5 p-3" style={{ background: '#7A8B8B' }}>
              <div className="text-[5px] tracking-widest" style={{ color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 2px rgba(255,255,255,0.4), 0 -1px 1px rgba(0,0,0,0.2)' }}>WEDDING</div>
              <div className="text-[10px] font-light" style={{ color: 'rgba(255,255,255,0.55)', textShadow: '0 2px 3px rgba(255,255,255,0.45), 0 -1px 2px rgba(0,0,0,0.22)' }}>Min & Seo</div>
              <div className="w-4 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="text-[5px]" style={{ color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 2px rgba(255,255,255,0.35), 0 -1px 1px rgba(0,0,0,0.15)' }}>2026.05.23</div>
            </div>
            <div className="p-2 bg-white text-center">
              <p className="text-[11px] font-semibold text-gray-900">엠보싱</p>
              <p className="text-[9px] text-gray-500 leading-tight mt-0.5">단색 배경에 양각 효과</p>
              <p className="text-[8px] text-amber-600 leading-tight mt-0.5">* 사진 없는 표지</p>
            </div>
            {data.design.coverDesign === 'emboss' && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </button>
        </div>

        {/* 엠보싱 색상 선택 */}
        {data.design.coverDesign === 'emboss' && (
          <div className="space-y-2 mt-3">
            <p className="text-sm font-medium text-gray-700">엠보싱 배경 색상</p>
            <div className="flex gap-2">
              {[
                { id: 'dusty-blue', color: '#8E9EAB', label: 'Dusty Blue' },
                { id: 'beige', color: '#C2B9A7', label: 'Beige' },
                { id: 'teal', color: '#7A8B8B', label: 'Teal' },
                { id: 'gray', color: '#9BA3A6', label: 'Gray' },
                { id: 'dark', color: '#4A4A48', label: 'Dark' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateNestedData('design.embossColor', opt.id)}
                  className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                    (data.design.embossColor || 'teal') === opt.id ? 'border-black ring-2 ring-black/20 scale-110' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ background: opt.color }}
                  title={opt.label}
                >
                  {(data.design.embossColor || 'teal') === opt.id && (
                    <svg className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 커버 타이틀 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg> 커버 타이틀
        </h3>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">표지 텍스트</Label>
          <Input
            value={data.design.coverTitle || ''}
            onChange={(e) => updateNestedData('design.coverTitle', e.target.value)}
            placeholder="OUR WEDDING ESSAY"
          />
        </div>
      </section>

      {/* 폰트 스타일 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          폰트 스타일
        </h3>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          텍스트의 글꼴을 선택해주세요.
        </p>

        <div className="grid grid-cols-1 gap-3">
          {FONT_STYLES.map((font) => {
            const isSelected = fontStyle === font.id
            return (
              <button
                key={font.id}
                onClick={() => updateData({ fontStyle: font.id })}
                className={`flex items-center justify-between p-4 transition-all neu-card ${isSelected ? 'neu-card-selected' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {isSelected && (
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      {font.name}
                      {font.recommended && <span className="text-[10px] text-white bg-black px-1.5 py-0.5 rounded-full font-normal">추천</span>}
                    </span>
                    <span className="text-xs text-gray-400">{font.desc}</span>
                  </div>
                </div>
                <span className="text-lg text-gray-800" style={{ fontFamily: font.fontFamily }}>
                  {font.sample}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 글자 크기 조절 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
          글자 크기
        </h3>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          이야기 본문의 글자 크기를 조절합니다.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-6 text-right" style={{ fontSize: '11px' }}>가</span>
          <div className="flex-1 flex items-center gap-1">
            {[-2, -1, 0, 1, 2].map((level) => {
              const isSelected = (data.fontSizeLevel || 0) === level
              return (
                <button
                  key={level}
                  onClick={() => updateData({ fontSizeLevel: level })}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {level === 0 ? '기본' : level > 0 ? `+${level}` : `${level}`}
                </button>
              )
            })}
          </div>
          <span className="text-base text-gray-400 w-6" style={{ fontSize: '17px' }}>가</span>
        </div>
      </section>

      {/* 컬러 테마 */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
          컬러 테마
        </h3>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          에세이 청첩장의 분위기를 선택해주세요.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {ESSAY_THEMES.map((theme) => {
            const isSelected = colorTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => updateData({ colorTheme: theme.id })}
                className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                  isSelected ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1 z-10 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
                <div className="aspect-square flex flex-col items-center justify-center p-2 gap-1" style={{ backgroundColor: theme.bg }}>
                  <div className="w-6 h-0.5" style={{ backgroundColor: theme.accent }} />
                  <div className="text-[7px] tracking-[2px] uppercase" style={{ color: theme.accent }}>ESSAY</div>
                  <div className="w-2/3 h-[1.5px] rounded-full mt-0.5" style={{ backgroundColor: `${theme.accent}30` }} />
                </div>
                <p className="text-[10px] text-gray-700 font-medium py-1.5 text-center leading-tight">
                  {theme.name}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* 배경음악 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            배경음악
          </h3>
          <Switch
            checked={bgm?.enabled || false}
            onCheckedChange={(checked) => updateNestedData('bgm.enabled', checked)}
          />
        </div>
        <p className="text-sm text-blue-600">
          <svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 스토리에 어울리는 배경음악을 선택해주세요.<br />
          <span className="text-amber-600"><svg className="w-3.5 h-3.5 text-gray-900 inline -mt-0.5 mr-0.5" viewBox="0 0 24 24" fill="rgba(0,0,0,0.1)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg> 브라우저 정책에 따라 자동재생 기능이 동작하지 않을 수 있습니다.</span>
        </p>

        {(bgm?.enabled || bgm?.url) && (
          <div className="space-y-4">
            {/* 프리셋 BGM */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">추천 배경음악</Label>
              <div className="grid grid-cols-2 gap-2">
                {bgmPresets.map((preset) => {
                  const isSelected = bgm?.url === preset.url
                  const isPlaying = playingBgm === preset.url
                  return (
                    <div
                      key={preset.id}
                      className={`relative flex items-center gap-2 p-3 transition-all cursor-pointer neu-card ${isSelected ? 'neu-card-selected' : ''}`}
                      onClick={() => selectBgm(preset.url)}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleBgmPreview(preset.url) }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isPlaying ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-700 block">{preset.name}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{preset.description}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 직접추가 옵션 */}
              <div
                className={`relative flex items-center gap-2 p-3 transition-all cursor-pointer col-span-2 neu-card ${isCustomBgm ? 'neu-card-selected' : ''}`}
                onClick={() => {
                  const input = document.getElementById('essay-bgm-file-input') as HTMLInputElement
                  input?.click()
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCustomBgm ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {isUploadingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-700 block">직접 추가</span>
                  <span className="text-[10px] text-gray-400 block truncate">
                    {isCustomBgm ? '업로드된 음악 사용 중' : 'MP3 파일 업로드'}
                  </span>
                </div>
                {isCustomBgm && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); updateNestedData('bgm.url', '') }}
                    className="p-1 rounded hover:bg-red-100 text-red-400 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isCustomBgm && !isUploadingAudio && (
                  <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <input
                id="essay-bgm-file-input"
                type="file"
                accept=".mp3,audio/mpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleAudioUpload(file)
                  e.target.value = ''
                }}
              />
            </div>

            {/* 저작권 안내 */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">
                <strong>저작권 안내</strong><br />
                저작권이 있는 음악을 업로드할 경우 발생하는 모든 법적 책임은 사용자에게 있습니다.
                저작권에 위배되지 않는 MP3 파일만 업로드해주세요.
              </p>
            </div>

            {/* 자동재생 설정 */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Switch
                checked={bgm?.autoplay ?? true}
                onCheckedChange={(checked) => updateNestedData('bgm.autoplay', checked)}
              />
              <span className="text-sm text-gray-700">자동 재생</span>
              <span className="text-xs text-gray-400 ml-auto">모바일에서 자동재생</span>
            </div>
          </div>
        )}
      </section>

      {/* 오디오 플레이어 (숨김) */}
      <audio ref={audioRef} onEnded={() => setPlayingBgm(null)} className="hidden" />
    </div>
  )
}
