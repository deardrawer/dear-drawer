'use client'

import { useRef, useState, useEffect } from 'react'
import ThankYouPage, { type ThankYouFontStyle } from '@/components/thank-you/ThankYouPage'
import type { ThankYouData } from '@/components/thank-you/types'
import { SAMPLE_DATA } from '@/components/thank-you/types'

interface ThankYouPreviewProps {
  data: ThankYouData
  fontStyle?: ThankYouFontStyle
  accentColor?: string
  sealColor?: string
  wizardStep?: number
}

export default function ThankYouPreview({ data, fontStyle = 'classic', accentColor = '#B89878', sealColor = '#722F37', wizardStep }: ThankYouPreviewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [previewKey, setPreviewKey] = useState(0)

  // 미리보기용: 빈 이미지는 샘플로 대체
  const previewData: ThankYouData = {
    ...data,
    heroImage: data.heroImage || SAMPLE_DATA.heroImage,
    coupleNames: data.coupleNames || SAMPLE_DATA.coupleNames,
    date: data.date || SAMPLE_DATA.date,
    polaroids: data.polaroids.map((p, i) => ({
      ...p,
      image: p.image || SAMPLE_DATA.polaroids[i]?.image || SAMPLE_DATA.heroImage,
    })),
    closingLines: data.closingLines.length > 0 ? data.closingLines : SAMPLE_DATA.closingLines,
    // photoShare 옵션 켜져있으면 샘플 URL로 팝업 미리보기 가능하게
    ...(data.photoShare?.enabled ? {
      photoShare: {
        ...data.photoShare,
        url: data.photoShare.url || 'https://photos.google.com',
      },
    } : {}),
  }

  const handleReset = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    setPreviewKey(k => k + 1)
  }

  // "기본 정보" 탭(step 2) 진입 시 인트로 화면으로 자동 리셋
  useEffect(() => {
    if (wizardStep === 2) {
      handleReset()
    }
  }, [wizardStep])

  return (
    <div className="relative h-full">
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <ThankYouPage
          key={previewKey}
          data={previewData}
          fontStyle={fontStyle}
          accentColor={accentColor}
          sealColor={sealColor}
          scrollContainerRef={scrollContainerRef}
        />
      </div>
      {/* 리셋 버튼 */}
      <button
        onClick={handleReset}
        className="absolute top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-opacity hover:opacity-100 opacity-70"
        style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 1 3 6.7" />
          <path d="M3 22v-6h6" />
        </svg>
        처음부터
      </button>
    </div>
  )
}
