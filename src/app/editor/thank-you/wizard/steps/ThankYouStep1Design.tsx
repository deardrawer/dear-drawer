'use client'

import { useState, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Play, Pause, Upload, X, Loader2, ImageIcon, Trash2 } from 'lucide-react'
import { bgmPresets } from '@/lib/bgmPresets'
import { useThankYouEditorStore, type ThankYouFontStyle } from '@/store/thankYouEditorStore'
import { THANKYOU_ACCENT_PRESETS } from '@/components/thank-you/types'
import { hexToSealFilter } from '@/components/parents/EnvelopeScreen'
import { uploadImage } from '@/lib/imageUpload'
import InlineCropEditor from '@/components/editor/InlineCropEditor'

const FONT_STYLE_OPTIONS: { id: ThankYouFontStyle; name: string; fontFamily: string; sample: string }[] = [
  { id: 'classic', name: '리디바탕', fontFamily: "'Ridibatang', serif", sample: '감사합니다' },
  { id: 'modern', name: '프리텐다드', fontFamily: "'Pretendard', sans-serif", sample: '감사합니다' },
  { id: 'romantic', name: '오케이티콘체', fontFamily: "'Okticon', serif", sample: '감사합니다' },
  { id: 'contemporary', name: '전남교육바른체', fontFamily: "'JeonnamEducationBarun', sans-serif", sample: '감사합니다' },
  { id: 'luxury', name: '이랜드초이스체', fontFamily: "'ELandChoice', serif", sample: '감사합니다' },
  { id: 'gulim', name: '조선굴림체', fontFamily: "'JoseonGulim', serif", sample: '감사합니다' },
  { id: 'adulthand', name: '강원교육모두체', fontFamily: "'GangwonEducationModuche', sans-serif", sample: '감사합니다' },
  { id: 'neathand', name: '오무다예체', fontFamily: "'OmuDaye', sans-serif", sample: '감사합니다' },
  { id: 'roundhand', name: '온글잎 콘콘체', fontFamily: "'OngleipKonkon', sans-serif", sample: '감사합니다' },
  { id: 'roundgothic', name: '나눔스퀘어라운드', fontFamily: "'NanumSquareRound', sans-serif", sample: '감사합니다' },
  { id: 'suit', name: 'SUIT', fontFamily: "'Suit', sans-serif", sample: '감사합니다' },
  { id: 'myungjo', name: '조선일보명조체', fontFamily: "'ChosunIlboMyungjo', serif", sample: '감사합니다' },
]

const SEAL_PRESETS = [
  { color: '#722F37', label: '버건디' },
  { color: '#1E3A5F', label: '네이비' },
  { color: '#C9A962', label: '골드' },
  { color: '#1A1A1A', label: '블랙' },
  { color: '#F5ECD7', label: '아이보리' },
  { color: '#F2C4C4', label: '로즈핑크' },
  { color: '#C8B8DB', label: '라벤더' },
  { color: '#E8E8E8', label: '화이트' },
]

interface ThankYouStep1DesignProps {
  invitationId: string | null
}

export default function ThankYouStep1Design({ invitationId }: ThankYouStep1DesignProps) {
  const {
    fontStyle, setFontStyle,
    accentColor, setAccentColor,
    sealColor, setSealColor,
    bgm, setBgm,
    data, setBackgroundImage, setBackgroundImageSettings,
  } = useThankYouEditorStore()
  const [previewingBgmId, setPreviewingBgmId] = useState<string | null>(null)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [isUploadingBg, setIsUploadingBg] = useState(false)
  const bgmAudioRef = useRef<HTMLAudioElement>(null)

  const isCustomBgm = bgm.url && !bgmPresets.some(p => p.url === bgm.url)

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
        setBgm({ url: result.url })
      } else {
        alert(result.error || '업로드에 실패했습니다.')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingAudio(false)
    }
  }

  const handleBgImageUpload = async (file: File) => {
    setIsUploadingBg(true)
    try {
      const result = await uploadImage(file, { invitationId: invitationId || undefined })
      if (result.success && result.webUrl) {
        setBackgroundImage(result.webUrl)
        setBackgroundImageSettings({ cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 })
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingBg(false)
    }
  }

  const handleBgmPreview = (preset: typeof bgmPresets[number]) => {
    if (!bgmAudioRef.current) return
    if (previewingBgmId === preset.id) {
      bgmAudioRef.current.pause()
      setPreviewingBgmId(null)
    } else {
      bgmAudioRef.current.src = preset.url
      bgmAudioRef.current.play()
      setPreviewingBgmId(preset.id)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* 안내 */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-base text-purple-800 font-medium mb-1">디자인 선택</p>
        <p className="text-sm text-purple-600">메인컬러, 폰트, 배경사진, 실링, 배경음악을 설정해주세요.</p>
      </div>

      {/* 메인 컬러 */}
      <div>
        <h3 className="text-base font-semibold text-[#2C2824] mb-4 flex items-center gap-2">
          <span className="text-lg">🎨</span> 메인 컬러
        </h3>
        <p className="text-xs text-gray-500 mb-3">장식 라인과 포인트 텍스트에 사용됩니다.</p>

        {/* 프리셋 색상 */}
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {THANKYOU_ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => setAccentColor(preset.color)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                accentColor === preset.color ? 'bg-gray-100 ring-2 ring-[#A37E69]' : 'hover:bg-gray-50'
              }`}
            >
              <div
                className="w-7 h-7 rounded-full border border-gray-200"
                style={{ backgroundColor: preset.color }}
              />
              <span className="text-[10px] text-gray-500">{preset.label}</span>
            </button>
          ))}
        </div>

        {/* 커스텀 색상 */}
        <div className="flex items-center justify-center gap-2">
          <label className="text-xs text-gray-500">직접 선택:</label>
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200"
          />
          <span className="text-xs text-gray-400 font-mono">{accentColor}</span>
        </div>
      </div>

      {/* 배경 사진 */}
      <div>
        <h3 className="text-base font-semibold text-[#2C2824] mb-4 flex items-center gap-2">
          <span className="text-lg">🖼️</span> 배경 사진
        </h3>
        <p className="text-xs text-gray-500 mb-3">폴라로이드 사진 뒤에 표시되는 배경 이미지입니다. (선택사항)</p>

        {data.backgroundImage ? (
          <div className="space-y-3">
            {/* 크롭 에디터 */}
            <div className="flex justify-center">
              <InlineCropEditor
                imageUrl={data.backgroundImage}
                settings={{
                  scale: 1.0,
                  positionX: 0,
                  positionY: 0,
                  cropX: data.backgroundImageSettings?.cropX,
                  cropY: data.backgroundImageSettings?.cropY,
                  cropWidth: data.backgroundImageSettings?.cropWidth,
                  cropHeight: data.backgroundImageSettings?.cropHeight,
                }}
                onUpdate={(s) => {
                  setBackgroundImageSettings({
                    cropX: s.cropX,
                    cropY: s.cropY,
                    cropWidth: s.cropWidth,
                    cropHeight: s.cropHeight,
                  })
                }}
                aspectRatio={9 / 16}
                containerWidth={200}
                colorClass="gray"
              />
            </div>

            {/* 이미지 교체/삭제 */}
            <div className="flex justify-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <ImageIcon className="w-3.5 h-3.5" />
                교체
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleBgImageUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                onClick={() => {
                  setBackgroundImage('')
                  setBackgroundImageSettings({})
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
            {isUploadingBg ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
            <span className="text-sm text-gray-500">{isUploadingBg ? '업로드 중...' : '배경 사진 선택'}</span>
            <span className="text-xs text-gray-400">설정하지 않으면 단색 배경이 적용됩니다</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleBgImageUpload(file)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>

      {/* 폰트 스타일 */}
      <div>
        <h3 className="text-base font-semibold text-[#2C2824] mb-4 flex items-center gap-2">
          <span className="text-lg">Aa</span> 폰트 스타일
        </h3>
        <div className="space-y-1.5">
          {FONT_STYLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setFontStyle(option.id)}
              className={`w-full py-2.5 px-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                fontStyle === option.id
                  ? 'border-[#A37E69] bg-[#A37E69]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xs text-gray-500">{option.name}</span>
              <span className="text-base text-[#2C2824]" style={{ fontFamily: option.fontFamily }}>
                {option.sample}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 실링 색상 */}
      <div>
        <h3 className="text-base font-semibold text-[#2C2824] mb-4 flex items-center gap-2">
          <span className="text-lg">🔴</span> 실링 스티커
        </h3>
        <p className="text-xs text-gray-500 mb-3">유산지 위에 올라가는 밀랍 실링의 색상을 선택하세요.</p>

        {/* 실링 미리보기 */}
        <div className="flex justify-center py-3 mb-3">
          <div className="w-16 h-16 relative" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/shilling-gray.png"
              alt="실링 미리보기"
              className="w-full h-full object-contain"
              style={{ filter: hexToSealFilter(sealColor) }}
            />
          </div>
        </div>

        {/* 프리셋 색상 */}
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {SEAL_PRESETS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => setSealColor(preset.color)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                sealColor === preset.color ? 'bg-gray-100 ring-2 ring-[#A37E69]' : 'hover:bg-gray-50'
              }`}
            >
              <div
                className="w-7 h-7 rounded-full border border-gray-200"
                style={{ backgroundColor: preset.color }}
              />
              <span className="text-[10px] text-gray-500">{preset.label}</span>
            </button>
          ))}
        </div>

        {/* 커스텀 색상 */}
        <div className="flex items-center justify-center gap-2">
          <label className="text-xs text-gray-500">직접 선택:</label>
          <input
            type="color"
            value={sealColor}
            onChange={(e) => setSealColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200"
          />
          <span className="text-xs text-gray-400 font-mono">{sealColor}</span>
        </div>
      </div>

      {/* 배경음악 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#2C2824] flex items-center gap-2">
            <span className="text-lg">🎵</span> 배경음악
          </h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="bgm-toggle" className="text-sm text-gray-500">사용</Label>
            <Switch
              id="bgm-toggle"
              checked={bgm.enabled}
              onCheckedChange={(checked) => setBgm({ enabled: checked })}
            />
          </div>
        </div>

        {bgm.enabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Switch
                id="bgm-autoplay"
                checked={bgm.autoplay}
                onCheckedChange={(checked) => setBgm({ autoplay: checked })}
              />
              <Label htmlFor="bgm-autoplay" className="text-sm text-gray-600">자동 재생</Label>
            </div>

            {/* 프리셋 목록 */}
            <div className="space-y-2">
              {bgmPresets.map((preset) => (
                <div
                  key={preset.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    bgm.url === preset.url
                      ? 'border-[#A37E69] bg-[#A37E69]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setBgm({ url: preset.url })}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBgmPreview(preset) }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 hover:bg-gray-200 transition-colors"
                  >
                    {previewingBgmId === preset.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2824] truncate">{preset.name}</p>
                    <p className="text-xs text-gray-500 truncate">{preset.description}</p>
                  </div>
                  {bgm.url === preset.url && (
                    <div className="w-5 h-5 rounded-full bg-[#A37E69] flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 커스텀 업로드 */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">또는 직접 업로드 (MP3, 최대 10MB)</p>
              {isCustomBgm && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-2">
                  <span className="text-sm text-blue-700 flex-1 truncate">커스텀 BGM 사용 중</span>
                  <button onClick={() => setBgm({ url: '' })} className="text-blue-400 hover:text-blue-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                {isUploadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <Upload className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-500">{isUploadingAudio ? '업로드 중...' : 'MP3 파일 선택'}</span>
                <input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleAudioUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <audio ref={bgmAudioRef} onEnded={() => setPreviewingBgmId(null)} />
    </div>
  )
}
