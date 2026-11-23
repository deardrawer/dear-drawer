'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'
import { C_FIELD, C_POINT, C_SERIF, C_TXT_SUB, C_BODY_FONT, DEFAULT_TIMELINE_TITLE, cCaption, cStagger, cTitle } from './cStyle'

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
  title?: string  // 타임라인 제목 (비우면 기본 문구)
}

/** 항목 하나 — 기존 FamilyTimeline과 같은 등장 · 활성 강조 · 사진 확대 움직임 */
function TimelineRow({
  item,
  index,
  isItemActive,
  onVisibilityChange,
  sectionAppeared,
}: {
  item: TimelineItem
  index: number
  isItemActive: boolean
  onVisibilityChange: (index: number, ratio: number) => void
  sectionAppeared: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hasAppeared, setHasAppeared] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAppeared) setHasAppeared(true)
        onVisibilityChange(index, entry.intersectionRatio)
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], rootMargin: '-20% 0px -20% 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [index, onVisibilityChange, hasAppeared])

  const showItem = sectionAppeared && hasAppeared
  const imageUrl = item.image?.url || item.imageUrl
  const hasCropData = !!item.image && (item.image.cropWidth < 1 || item.image.cropHeight < 1)

  return (
    <div
      ref={ref}
      style={{
        opacity: showItem ? (isItemActive ? 1 : 0.3) : 0,
        transform: showItem ? 'translateY(0)' : 'translateY(28px)',
        filter: showItem ? (isItemActive ? 'blur(0px) grayscale(0%)' : 'blur(0px) grayscale(30%)') : 'blur(6px) grayscale(0%)',
        transition: 'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), filter 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: !hasAppeared && showItem ? `${0.15 * index}s` : '0s',
      }}
    >
      <div
        style={{
          width: '100%', aspectRatio: '3 / 2', borderRadius: 4, overflow: 'hidden', backgroundColor: C_FIELD,
          transform: isPressed ? 'scale(0.97)' : (isItemActive ? 'scale(1)' : 'scale(0.96)'),
          transition: 'transform 0.5s',
        }}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
      >
        {/* 지금 보고 있는 사진은 아주 천천히 다가옴 */}
        <div className="w-full h-full" style={{ transform: isItemActive ? 'scale(1.05)' : 'scale(1)', transition: 'transform 3.5s cubic-bezier(0.22, 1, 0.36, 1)' }}>
          {hasCropData && item.image ? (
            <CroppedImageDiv
              src={item.image.url}
              crop={{ cropX: item.image.cropX, cropY: item.image.cropY, cropWidth: item.image.cropWidth, cropHeight: item.image.cropHeight }}
              className="w-full h-full"
            />
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={item.description}
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%' }}
            />
          ) : null}
        </div>
      </div>
      {(item.year || item.description) && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 14 }}>
          {item.year && (
            <span style={{ fontFamily: C_SERIF, fontSize: 30, lineHeight: 1, color: C_POINT, flexShrink: 0 }}>{item.year}</span>
          )}
          {item.description && (
            <span style={{ fontFamily: C_BODY_FONT, fontSize: 14.5, lineHeight: 1.6, color: C_TXT_SUB, wordBreak: 'keep-all' }}>{item.description}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function TimelineSection({
  items = [
    { year: '1992', description: '저희가 결혼하던 날', imageUrl: '/samples/parents/timeline/story1.jpg' },
    { year: '1998', description: '서연이 5살 생일에 강원도 여행간 날', imageUrl: '/samples/parents/timeline/story2.jpeg' },
    { year: '2018', description: '대학 졸업하던 날', imageUrl: '/samples/parents/timeline/story3.jpeg' },
    { year: '2025', description: '평생의 반쪽을 만나다', imageUrl: '/samples/parents/timeline/story4.jpg' },
  ],
  title,
}: TimelineSectionProps) {
  const { ref, hasAppeared } = useSectionHighlight('timeline')

  // 제목 등장 (기존과 같이 제목이 절반 이상 보일 때)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const [isTitleVisible, setIsTitleVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsTitleVisible(true) }, { threshold: 0.5 })
    if (titleRef.current) observer.observe(titleRef.current)
    return () => observer.disconnect()
  }, [])
  const titleAppeared = hasAppeared && isTitleVisible

  // 가장 많이 보이는 항목을 활성으로
  const [activeIndex, setActiveIndex] = useState(0)
  const visibilityRatios = useRef<Map<number, number>>(new Map())
  const handleVisibilityChange = useCallback((index: number, ratio: number) => {
    visibilityRatios.current.set(index, ratio)
    let maxRatio = 0
    let maxIndex = 0
    visibilityRatios.current.forEach((r, i) => { if (r > maxRatio) { maxRatio = r; maxIndex = i } })
    if (maxRatio > 0) setActiveIndex(maxIndex)
  }, [])

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ backgroundColor: 'transparent', padding: '72px 28px 80px' }}
    >
      <p ref={titleRef} style={{ ...cCaption, ...cStagger(titleAppeared, 0) }}>우리 가족의 시간</p>
      <h2 style={{ ...cTitle(23, 12), whiteSpace: 'pre-line', ...cStagger(titleAppeared, 0.15) }}>{(title || '').trim() || DEFAULT_TIMELINE_TITLE}</h2>

      <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 34 }}>
        {items.map((item, index) => (
          <TimelineRow
            key={`${item.year}-${index}`}
            item={item}
            index={index}
            isItemActive={index === activeIndex}
            onVisibilityChange={handleVisibilityChange}
            sectionAppeared={hasAppeared}
          />
        ))}
      </div>
    </section>
  )
}
