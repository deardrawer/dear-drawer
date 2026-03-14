'use client'
import { useState, useRef } from 'react'
import { ArrowLeft, ArrowRight, Upload, Download, Palette } from 'lucide-react'
import GeunnalCard from './Card'
import GeunnalBadge from './Badge'

interface PhotoBoothProps {
  pageId: string
  token: string
  groomName: string
  brideName: string
}

type Layout = '2-photo' | '3-photo' | '4-photo'
type FrameColor = 'white' | 'black' | 'cream' | 'lavender' | 'blush' | 'sage'

const layoutConfigs = {
  '2-photo': {
    name: '2컷',
    slots: 2,
    aspectRatio: '3:4',
  },
  '3-photo': {
    name: '3컷',
    slots: 3,
    aspectRatio: '3:4',
  },
  '4-photo': {
    name: '4컷',
    slots: 4,
    aspectRatio: '3:4',
  },
}

const frameColors: Record<FrameColor, { bg: string; border: string; text: string }> = {
  white: { bg: '#FFFFFF', border: '#E8E4F0', text: '#2A2240' },
  black: { bg: '#2A2240', border: '#2A2240', text: '#FFFFFF' },
  cream: { bg: '#FFF8E7', border: '#F0E7D5', text: '#2A2240' },
  lavender: { bg: '#EDE9FA', border: '#8B75D0', text: '#2A2240' },
  blush: { bg: '#FAE9F0', border: '#D4899A', text: '#2A2240' },
  sage: { bg: '#E8F5E9', border: '#81C784', text: '#2A2240' },
}

export default function PhotoBooth({
  pageId,
  token,
  groomName,
  brideName,
}: PhotoBoothProps) {
  const [step, setStep] = useState(1) // 1: layout, 2: photos, 3: customize, 4: export
  const [layout, setLayout] = useState<Layout>('4-photo')
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null])
  const [frameColor, setFrameColor] = useState<FrameColor>('white')
  const [title, setTitle] = useState(`${groomName} ♥ ${brideName}`)
  const [date, setDate] = useState(new Date().toLocaleDateString('ko-KR'))
  const [comment, setComment] = useState('우리의 특별한 순간')
  const [exporting, setExporting] = useState(false)

  const frameRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentSlot, setCurrentSlot] = useState<number | null>(null)

  const handleLayoutSelect = (selectedLayout: Layout) => {
    setLayout(selectedLayout)
    const slots = layoutConfigs[selectedLayout].slots
    setPhotos(Array(slots).fill(null))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || currentSlot === null) return

    const file = files[0]
    const reader = new FileReader()

    reader.onload = (event) => {
      const result = event.target?.result as string
      const newPhotos = [...photos]
      newPhotos[currentSlot] = result
      setPhotos(newPhotos)
      setCurrentSlot(null)
    }

    reader.readAsDataURL(file)
  }

  const handleSlotClick = (index: number) => {
    setCurrentSlot(index)
    fileInputRef.current?.click()
  }

  const handleExport = async () => {
    if (!frameRef.current) return

    setExporting(true)

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(frameRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `photobooth-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setExporting(false)
      }, 'image/png')
    } catch (error) {
      console.error('Export error:', error)
      alert('이미지 내보내기에 실패했습니다.')
      setExporting(false)
    }
  }

  const canProceed = () => {
    if (step === 2) {
      return photos.every((photo) => photo !== null)
    }
    return true
  }

  return (
    <div className="min-h-screen bg-[#F9F7FD] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E4F0] px-5 py-4">
        <h1 className="text-xl font-bold text-[#2A2240]">포토부스</h1>
        <p className="text-sm text-[#5A5270] mt-1">
          추억의 사진을 멋진 프레임으로 만들어보세요
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#E8E4F0] px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          {[
            { num: 1, label: '레이아웃' },
            { num: 2, label: '사진' },
            { num: 3, label: '꾸미기' },
            { num: 4, label: '저장' },
          ].map((item, idx) => (
            <div key={item.num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= item.num
                    ? 'bg-[#8B75D0] text-white'
                    : 'bg-[#F9F7FD] text-[#C5BAE8]'
                }`}
              >
                {item.num}
              </div>
              {idx < 3 && (
                <div
                  className={`w-12 h-0.5 mx-1 transition-colors ${
                    step > item.num ? 'bg-[#8B75D0]' : 'bg-[#E8E4F0]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[#9B8CC4] px-1">
          <span>레이아웃</span>
          <span>사진</span>
          <span>꾸미기</span>
          <span>저장</span>
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Step 1: Layout Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#2A2240] mb-4">
              레이아웃을 선택하세요
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(layoutConfigs) as Layout[]).map((key) => {
                const config = layoutConfigs[key]
                return (
                  <button
                    key={key}
                    onClick={() => handleLayoutSelect(key)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      layout === key
                        ? 'border-[#8B75D0] bg-[#EDE9FA]'
                        : 'border-[#E8E4F0] bg-white'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-[#F9F7FD] rounded-lg mb-2 flex flex-col gap-1 p-2">
                      {Array(config.slots)
                        .fill(0)
                        .map((_, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-white rounded border border-[#E8E4F0]"
                          />
                        ))}
                    </div>
                    <p className="text-sm font-medium text-[#2A2240]">
                      {config.name}
                    </p>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors flex items-center justify-center gap-2"
            >
              다음
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Photo Upload */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#2A2240]">
                사진을 업로드하세요
              </h2>
              <GeunnalBadge variant="lavender">
                {photos.filter((p) => p !== null).length} / {photos.length}
              </GeunnalBadge>
            </div>

            <div className="space-y-3">
              {photos.map((photo, idx) => (
                <GeunnalCard
                  key={idx}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSlotClick(idx)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg bg-[#F9F7FD] border border-[#E8E4F0] flex items-center justify-center overflow-hidden">
                      {photo ? (
                        <img
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Upload className="w-6 h-6 text-[#C5BAE8]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#2A2240]">
                        사진 {idx + 1}
                      </p>
                      <p className="text-sm text-[#9B8CC4]">
                        {photo ? '변경하기' : '업로드하기'}
                      </p>
                    </div>
                  </div>
                </GeunnalCard>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-[#F9F7FD] text-[#5A5270] rounded-xl font-medium hover:bg-[#EDE9FA] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                이전
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceed()}
                className="flex-1 py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                다음
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Customize */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#2A2240] mb-4">
              프레임을 꾸며보세요
            </h2>

            {/* Frame Color */}
            <div>
              <label className="block text-sm font-medium text-[#2A2240] mb-2">
                프레임 색상
              </label>
              <div className="grid grid-cols-6 gap-2">
                {(Object.keys(frameColors) as FrameColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => setFrameColor(color)}
                    className={`aspect-square rounded-lg border-2 transition-all ${
                      frameColor === color
                        ? 'border-[#8B75D0] scale-110'
                        : 'border-[#E8E4F0]'
                    }`}
                    style={{ backgroundColor: frameColors[color].bg }}
                  />
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#2A2240] mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-[#2A2240] mb-2">
                날짜
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-[#2A2240] mb-2">
                코멘트
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-[#F9F7FD] border border-[#E8E4F0] rounded-xl text-[#2A2240] placeholder:text-[#C5BAE8] focus:outline-none focus:border-[#8B75D0] focus:ring-2 focus:ring-[#8B75D0]/20"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-[#F9F7FD] text-[#5A5270] rounded-xl font-medium hover:bg-[#EDE9FA] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                이전
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors flex items-center justify-center gap-2"
              >
                미리보기
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Export */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#2A2240] mb-4">
              멋진 포토부스가 완성되었어요!
            </h2>

            {/* Frame Preview */}
            <div className="flex justify-center">
              <div
                ref={frameRef}
                className="p-6 rounded-2xl shadow-lg"
                style={{
                  backgroundColor: frameColors[frameColor].bg,
                  borderColor: frameColors[frameColor].border,
                  borderWidth: '2px',
                  maxWidth: '320px',
                }}
              >
                {/* Title */}
                <div
                  className="text-center mb-4"
                  style={{ color: frameColors[frameColor].text }}
                >
                  <h3 className="text-xl font-bold mb-1">{title}</h3>
                  <p className="text-sm opacity-80">{date}</p>
                </div>

                {/* Photos */}
                <div className="space-y-2 mb-4">
                  {photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-white"
                    >
                      {photo && (
                        <img
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Comment */}
                <div
                  className="text-center text-sm"
                  style={{ color: frameColors[frameColor].text }}
                >
                  {comment}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-[#F9F7FD] text-[#5A5270] rounded-xl font-medium hover:bg-[#EDE9FA] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                이전
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 py-3 bg-[#8B75D0] text-white rounded-xl font-medium hover:bg-[#7A64BF] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {exporting ? '저장 중...' : '이미지 저장'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
