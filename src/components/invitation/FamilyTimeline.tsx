'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import CroppedImageDiv from '@/components/ui/CroppedImageDiv';

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
  hasAppeared?: boolean;
  isActive?: boolean;
}

const defaultTheme: ThemeColors = {
  primary: '#722F37',
  accent: '#C9A962',
  background: '#FFFEF8',
  text: '#1A1A1A',
  textLight: '#666666',
};

const stagger = (hasAppeared: boolean, delay: number) => ({
  opacity: hasAppeared ? 1 : 0,
  transform: hasAppeared ? 'translateY(0)' : 'translateY(18px)',
  transition: 'opacity 0.8s ease, transform 0.8s ease',
  transitionDelay: hasAppeared ? `${delay}s` : '0s',
});

function TimelineItemComponent({
  item,
  index,
  isItemActive,
  onVisibilityChange,
  theme = defaultTheme,
  sectionAppeared = false,
}: {
  item: TimelineItem;
  index: number;
  isItemActive: boolean;
  onVisibilityChange: (index: number, ratio: number) => void;
  theme?: ThemeColors;
  sectionAppeared?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasAppeared, setHasAppeared] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAppeared) {
          setHasAppeared(true);
        }
        onVisibilityChange(index, entry.intersectionRatio);
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-20% 0px -20% 0px'
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index, onVisibilityChange, hasAppeared]);

  const showItem = sectionAppeared && hasAppeared;

  return (
    <div
      ref={ref}
      className="relative flex pb-12 last:pb-0"
      style={{
        opacity: showItem ? (isItemActive ? 1 : 0.3) : 0,
        transform: showItem ? 'translateY(0)' : 'translateY(24px)',
        filter: showItem ? (isItemActive ? 'none' : 'grayscale(30%)') : 'none',
        transition: 'opacity 0.5s ease, transform 0.8s ease, filter 0.5s ease',
        transitionDelay: !hasAppeared && showItem ? `${0.15 * index}s` : '0s',
      }}
    >
      {/* 왼쪽: 세로선 + 연도 마커 */}
      <div className="relative w-12 flex-shrink-0 flex flex-col items-center">
        {/* 연도 뱃지 */}
        <div
          className="relative z-10 px-1 py-0.5 rounded-md transition-all duration-500"
          style={{
            backgroundColor: isItemActive ? theme.background : theme.background,
          }}
        >
          <span
            className="text-[11px] tracking-[1px]"
            style={{
              fontFamily: "'Cormorant Garamond', 'Georgia', serif",
              fontWeight: isItemActive ? 600 : 400,
              color: isItemActive ? theme.accent : `${theme.accent}80`,
              transition: 'color 0.5s, font-weight 0.3s',
            }}
          >
            {item.year}
          </span>
        </div>
      </div>

      {/* 오른쪽: 내용 */}
      <div className="flex-1 pt-0.5">
        {/* 설명 텍스트 */}
        <p
          className="text-[13px] mb-3 leading-[1.6]"
          style={{
            color: isItemActive ? theme.text : '#999',
            fontWeight: 300,
            transition: 'color 0.5s',
          }}
        >
          {item.description || '스토리를 입력하세요'}
        </p>

        {/* 사진 카드 */}
        <div
          className="w-full aspect-[4/3] rounded-xl overflow-hidden transition-all duration-500 cursor-pointer"
          style={{
            backgroundColor: '#E8E4DC',
            boxShadow: isItemActive
              ? '0 4px 24px rgba(0, 0, 0, 0.12)'
              : '0 1px 4px rgba(0, 0, 0, 0.03)',
            transform: isPressed ? 'scale(0.97)' : (isItemActive ? 'scale(1)' : 'scale(0.96)'),
          }}
          onPointerDown={() => setIsPressed(true)}
          onPointerUp={() => setIsPressed(false)}
          onPointerLeave={() => setIsPressed(false)}
        >
          {(() => {
            const imageUrl = item.image?.url || item.imageUrl;
            const hasCropData = item.image && (item.image.cropWidth < 1 || item.image.cropHeight < 1);

            if (hasCropData && item.image) {
              return (
                <CroppedImageDiv
                  src={item.image.url}
                  crop={{
                    cropX: item.image.cropX,
                    cropY: item.image.cropY,
                    cropWidth: item.image.cropWidth,
                    cropHeight: item.image.cropHeight,
                  }}
                  className="w-full h-full"
                />
              );
            } else if (imageUrl) {
              return (
                <img
                  src={imageUrl}
                  alt={item.description}
                  className="w-full h-full object-cover"
                />
              );
            } else {
              return (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs" style={{ color: theme.accent }}>
                    Photo
                  </span>
                </div>
              );
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
  hasAppeared: sectionAppeared = true,
  isActive: sectionActive = true,
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

  const handleVisibilityChange = useCallback((index: number, ratio: number) => {
    visibilityRatios.current.set(index, ratio);

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

  const titleAppeared = sectionAppeared && isTitleVisible;

  return (
    <div
      className="px-6 py-16"
      style={{ backgroundColor: theme.background }}
    >
      {/* OUR STORY label */}
      <p
        ref={titleRef}
        className="text-[10px] tracking-[6px] text-center mb-3"
        style={{
          color: sectionActive ? `${theme.accent}80` : '#bbb',
          fontWeight: 300,
          ...stagger(titleAppeared, 0),
        }}
      >
        OUR STORY
      </p>

      {/* 제목 */}
      <h2
        className="font-serif text-[16px] text-center mb-12 tracking-[1px]"
        style={{
          color: sectionActive ? theme.text : '#999',
          fontWeight: 300,
          ...stagger(titleAppeared, 0.15),
        }}
      >
        {title}
      </h2>

      {/* 타임라인 */}
      <div className="relative max-w-sm mx-auto">
        {/* 세로선 */}
        <div
          className="absolute"
          style={{
            top: '10px',
            bottom: '0',
            left: '23px',
            width: '1px',
            background: sectionActive
              ? `linear-gradient(to bottom, ${theme.accent}40, ${theme.accent}15)`
              : '#ddd',
            transition: 'background 0.5s',
          }}
        />

        {/* 항목들 */}
        {items.map((item, index) => (
          <TimelineItemComponent
            key={`${item.year}-${index}`}
            item={item}
            index={index}
            isItemActive={index === activeIndex}
            onVisibilityChange={handleVisibilityChange}
            theme={theme}
            sectionAppeared={sectionAppeared}
          />
        ))}
      </div>
    </div>
  );
}
