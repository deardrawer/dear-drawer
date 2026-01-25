'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TimelineItem {
  year: string;
  description: string;
  imageUrl: string;
  image?: {
    url: string;
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  };
}

// 이미지 크롭 스타일 계산 헬퍼 함수
function getImageCropStyle(item: TimelineItem) {
  const img = item.image
  if (img && img.url && (img.cropWidth < 1 || img.cropHeight < 1)) {
    const cw = img.cropWidth || 1
    const ch = img.cropHeight || 1
    const cx = img.cropX || 0
    const cy = img.cropY || 0
    const posX = cw >= 1 ? 0 : (cx / (1 - cw)) * 100
    const posY = ch >= 1 ? 0 : (cy / (1 - ch)) * 100

    return {
      backgroundImage: `url(${img.url})`,
      backgroundSize: `${100 / cw}% ${100 / ch}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat' as const,
    }
  }
  return null
}

interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
}

interface FamilyTimelineProps {
  items: TimelineItem[];
  title?: string;
  theme?: ThemeColors;
}

const defaultTheme: ThemeColors = {
  primary: '#722F37',
  accent: '#C9A962',
  background: '#FFFEF8',
  text: '#1A1A1A',
  textLight: '#666666',
};

function TimelineItemComponent({
  item,
  index,
  isActive,
  onVisibilityChange,
  theme = defaultTheme,
}: {
  item: TimelineItem;
  index: number;
  isActive: boolean;
  onVisibilityChange: (index: number, ratio: number) => void;
  theme?: ThemeColors;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasAppeared, setHasAppeared] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 처음 나타났을 때 애니메이션 트리거
        if (entry.isIntersecting && !hasAppeared) {
          setHasAppeared(true);
        }
        // 가시성 비율 전달
        onVisibilityChange(index, entry.intersectionRatio);
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-20% 0px -20% 0px' // 화면 중앙 영역에서 감지
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index, onVisibilityChange, hasAppeared]);

  return (
    <div
      ref={ref}
      className="relative flex pb-10 last:pb-0 transition-all duration-500"
      style={{
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      {/* 왼쪽: 세로선 + 동그라미 영역 */}
      <div className="relative w-5 flex-shrink-0 flex justify-center items-start pt-[7px]">
        {/* 동그라미 */}
        <div
          className="w-2.5 h-2.5 rounded-full z-10 transition-all duration-500"
          style={{
            backgroundColor: theme.accent,
            transform: hasAppeared ? 'scale(1)' : 'scale(0)',
            opacity: isActive ? 1 : 0.5,
          }}
        />
      </div>

      {/* 오른쪽: 내용 */}
      <div className="flex-1">
        {/* 연도 + 구분선 + 설명 (같은 줄) */}
        <p className="mb-4 flex items-center gap-2">
          {item.year && (
            <>
              <span
                className="font-serif italic text-sm transition-colors duration-500"
                style={{ color: isActive ? theme.accent : `${theme.accent}80` }}
              >
                {item.year}
              </span>
              <span
                className="h-3 w-px transition-colors duration-500"
                style={{ backgroundColor: isActive ? theme.accent : `${theme.accent}80` }}
              />
            </>
          )}
          <span
            className="text-sm font-sans transition-colors duration-500"
            style={{ color: isActive ? theme.text : '#999' }}
          >
            {item.description || '스토리를 입력하세요'}
          </span>
        </p>

        {/* 사진 */}
        <div
          className="w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: '#E8E4DC',
            boxShadow: isActive ? '0 4px 20px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
            transform: isActive ? 'scale(1)' : 'scale(0.98)',
          }}
        >
          {(() => {
            const cropStyle = getImageCropStyle(item)
            const imageUrl = item.image?.url || item.imageUrl

            if (cropStyle) {
              // 크롭 데이터가 있는 경우 background로 표시
              return (
                <div
                  className="w-full h-full"
                  style={cropStyle}
                />
              )
            } else if (imageUrl) {
              // 일반 이미지
              return (
                <img
                  src={imageUrl}
                  alt={item.description}
                  className="w-full h-full object-cover"
                />
              )
            } else {
              // 이미지 없음
              return (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs" style={{ color: theme.accent }}>
                    Photo
                  </span>
                </div>
              )
            }
          })()}
        </div>
      </div>
    </div>
  );
}

export default function FamilyTimeline({
  items,
  title = '우리 가족 이야기',
  theme = defaultTheme,
}: FamilyTimelineProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const visibilityRatios = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsTitleVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  // 가시성 변경 핸들러: 가장 많이 보이는 항목을 active로 설정
  const handleVisibilityChange = useCallback((index: number, ratio: number) => {
    visibilityRatios.current.set(index, ratio);

    // 가장 높은 가시성 비율을 가진 항목 찾기
    let maxRatio = 0;
    let maxIndex = 0;

    visibilityRatios.current.forEach((r, i) => {
      if (r > maxRatio) {
        maxRatio = r;
        maxIndex = i;
      }
    });

    if (maxRatio > 0) {
      setActiveIndex(maxIndex);
    }
  }, []);

  return (
    <section
      className="px-6 py-20"
      style={{ backgroundColor: theme.background }}
    >
      {/* 제목 */}
      <h2
        ref={titleRef}
        className={`font-serif text-lg text-center mb-14 tracking-wider transition-all duration-700 ${
          isTitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ color: theme.accent }}
      >
        {title}
      </h2>

      {/* 타임라인 */}
      <div className="relative max-w-sm mx-auto">
        {/* 세로선 (첫번째 동그라미 중심부터 마지막 동그라미 중심까지) */}
        <div
          className="absolute bottom-0"
          style={{
            top: '12px',
            left: 'calc(10px - 0.5px)',
            width: '1px',
            backgroundColor: theme.accent
          }}
        />

        {/* 항목들 */}
        {items.map((item, index) => (
          <TimelineItemComponent
            key={`${item.year}-${index}`}
            item={item}
            index={index}
            isActive={index === activeIndex}
            onVisibilityChange={handleVisibilityChange}
            theme={theme}
          />
        ))}
      </div>
    </section>
  );
}
