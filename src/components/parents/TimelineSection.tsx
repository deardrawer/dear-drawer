'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'
import FamilyTimeline from '@/components/invitation/FamilyTimeline'

interface TimelineItem {
  year: string
  description: string
  imageUrl: string
  image?: {
    url: string
    cropX: number
    cropY: number
    cropWidth: number
    cropHeight: number
  }
}

interface TimelineSectionProps {
  items?: TimelineItem[]
}

export default function TimelineSection({
  items = [
    { year: '1992', description: '저희가 결혼하던 날', imageUrl: '/samples/parents/timeline/story1.jpg' },
    { year: '1998', description: '서연이 5살 생일에 강원도 여행간 날', imageUrl: '/samples/parents/timeline/story2.jpeg' },
    { year: '2018', description: '대학 졸업하던 날', imageUrl: '/samples/parents/timeline/story3.jpeg' },
    { year: '2025', description: '평생의 반쪽을 만나다', imageUrl: '/samples/parents/timeline/story4.jpg' },
  ],
}: TimelineSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('timeline')
  const theme = useTheme()

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="transition-all duration-500"
      style={{
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <FamilyTimeline items={items} theme={theme} />
    </section>
  )
}
