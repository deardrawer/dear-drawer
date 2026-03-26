'use client'

import ThankYouPage from '@/components/thank-you/ThankYouPage'
import type { ThankYouData } from '@/components/thank-you/types'
import { SAMPLE_DATA } from '@/components/thank-you/types'

interface ThankYouPreviewProps {
  data: ThankYouData
}

export default function ThankYouPreview({ data }: ThankYouPreviewProps) {
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
  }

  return (
    <div className="h-full overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <ThankYouPage data={previewData} />
    </div>
  )
}
