'use client'

import { useState } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'
import {
  BouquetIcon, WreathIcon, FlowerChildIcon, CutleryIcon,
  CameraIcon, BusIcon, PinIcon, renderSvgIcon,
} from './icons'

interface CustomInfoItem {
  id?: string
  enabled?: boolean
  title?: string
  content?: string
  emoji?: string
}

interface WeddingInfoSectionProps {
  enabled?: boolean
  flowerGift?: { enabled?: boolean; content?: string }
  wreath?: { enabled?: boolean; content?: string }
  flowerChild?: { enabled?: boolean; content?: string }
  reception?: { enabled?: boolean; content?: string; venue?: string; datetime?: string }
  photoBooth?: { enabled?: boolean; content?: string }
  shuttle?: {
    enabled?: boolean
    departureDate?: string
    departureTime?: string
    departureLocation?: string
    returnTime?: string
    vehicleNumber?: string
    notes?: string[]
  }
  customItems?: CustomInfoItem[]
  itemOrder?: string[]
}

// 기본값들
const defaultFlowerGift = '예식 후 하객분들께 감사의 마음을 전하기 위해\n계절의 꽃으로 만든 작은 꽃다발을 준비했습니다.\n소중한 발걸음에 대한 감사의 선물로 받아주세요.'
const defaultWreath = '축하의 마음만으로도 충분히 감사하여\n화환은 정중히 사양하고자 합니다.\n따뜻한 마음으로 축복해주시면 감사하겠습니다.'
const defaultFlowerChild = '예식 중 사랑스러운 화동 입장이 예정되어 있습니다.\n아이들의 소중한 순간도 함께 따뜻하게 지켜봐 주세요.'
const defaultReception = '피로연 자리를 마련하였습니다.\n\n참석하시어 두 사람의 앞날을\n따뜻한 축복으로 함께해 주시면\n감사하겠습니다.'
const defaultPhotoBooth = '소중한 하루를 오래 기억할 수 있도록\n포토부스가 준비되어 있습니다.\n즐거운 추억을 사진으로 남겨주세요.'

const stagger = (hasAppeared: boolean, delay: number) => ({
  opacity: hasAppeared ? 1 : 0,
  transform: hasAppeared ? 'translateY(0)' : 'translateY(18px)',
  transition: 'opacity 0.8s ease, transform 0.8s ease',
  transitionDelay: hasAppeared ? `${delay}s` : '0s',
})

export default function WeddingInfoSection({
  enabled = true,
  flowerGift,
  wreath,
  flowerChild,
  reception,
  photoBooth,
  shuttle,
  customItems,
  itemOrder,
}: WeddingInfoSectionProps) {
  const { ref, isActive, hasAppeared } = useSectionHighlight('wedding-info')
  const theme = useTheme()

  // 기본 탭 정의 (icon: SVG 컴포넌트)
  const builtInTabs: Record<string, { label: string; icon: React.ReactNode; enabled: boolean }> = {
    flowerGift: { label: '꽃 답례품', icon: <BouquetIcon size={28} color={theme.accent} />, enabled: !!flowerGift?.enabled },
    wreath: { label: '화환 안내', icon: <WreathIcon size={28} color={theme.accent} />, enabled: !!wreath?.enabled },
    flowerChild: { label: '화동 안내', icon: <FlowerChildIcon size={28} color={theme.accent} />, enabled: !!flowerChild?.enabled },
    reception: { label: '피로연', icon: <CutleryIcon size={28} color={theme.accent} />, enabled: !!reception?.enabled },
    photoBooth: { label: '포토부스', icon: <CameraIcon size={28} color={theme.accent} />, enabled: !!photoBooth?.enabled },
    shuttle: { label: '셔틀버스', icon: <BusIcon size={28} color={theme.accent} />, enabled: !!shuttle?.enabled },
  }

  // itemOrder 기반으로 탭 순서 결정
  const defaultOrder = ['flowerGift', 'wreath', 'flowerChild', 'reception', 'photoBooth', 'shuttle']
  const order = itemOrder || defaultOrder

  // 커스텀 항목도 포함하여 순서대로 활성화된 탭 계산
  const enabledTabs: { id: string; label: string; icon: React.ReactNode }[] = []
  for (const key of order) {
    if (key.startsWith('custom-')) {
      const customId = key.replace('custom-', '')
      // ID 기반 조회 (우선) → 레거시 인덱스 기반 fallback
      let custom = customItems?.find(c => c.id === customId)
      if (!custom) {
        const idx = parseInt(customId, 10)
        if (!isNaN(idx)) custom = customItems?.[idx]
      }
      if (custom?.enabled && custom.title) {
        // svg: 접두사 → SVG 아이콘, 일반 이모지 → 그대로, 없으면 PinIcon 폴백
        const svgNode = custom.emoji ? renderSvgIcon(custom.emoji, { size: 28, color: theme.accent }) : null
        const icon = svgNode
          || (custom.emoji ? <span>{custom.emoji}</span> : <PinIcon size={28} color={theme.accent} />)
        enabledTabs.push({ id: key, label: custom.title, icon })
      }
    } else if (builtInTabs[key]?.enabled) {
      enabledTabs.push({ id: key, label: builtInTabs[key].label, icon: builtInTabs[key].icon })
    }
  }

  const [activeTab, setActiveTab] = useState(enabledTabs[0]?.id || 'flowerGift')

  // 현재 선택된 탭이 활성 탭 목록에 없으면 첫 번째 탭으로 보정
  const effectiveTab = enabledTabs.find(t => t.id === activeTab) ? activeTab : enabledTabs[0]?.id

  // 섹션이 비활성화되었거나 활성화된 항목이 없으면 렌더링 안함
  if (!enabled || enabledTabs.length === 0) {
    return null
  }

  // 공통 탭 내용 렌더링 헬퍼
  const renderTabContent = (icon: React.ReactNode, title: string, content: string, extra?: React.ReactNode) => (
    <div
      key={effectiveTab}
      style={{
        opacity: 1,
        animation: 'fadeSlideUp 0.4s ease',
      }}
    >
      <div
        className="flex items-center justify-center mb-5"
        style={{ opacity: 0.8 }}
      >
        {icon}
      </div>
      <h3
        className="font-serif text-[15px] mb-4 tracking-[1px]"
        style={{ color: isActive ? theme.text : '#999', fontWeight: 400 }}
      >
        {title}
      </h3>
      <p
        className="text-xs leading-[2] whitespace-pre-line"
        style={{ color: isActive ? theme.textLight : '#aaa' }}
      >
        {content}
      </p>
      {extra}
    </div>
  )

  // 정보 박스 (reception, shuttle 공통)
  const renderInfoBox = (items: { label: string; value: string }[]) => (
    <div
      className="text-left p-4 rounded-xl space-y-3 mt-5"
      style={{
        backgroundColor: isActive ? `${theme.accent}08` : '#f9f9f9',
        border: `1px solid ${isActive ? `${theme.accent}15` : '#f0f0f0'}`,
      }}
    >
      {items.map((item, i) => (
        <div key={i}>
          <p
            className="text-[10px] mb-1 tracking-[1px]"
            style={{ color: isActive ? theme.primary : '#bbb' }}
          >
            {item.label}
          </p>
          <p className="text-xs" style={{ color: isActive ? theme.textLight : '#aaa' }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-16 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        filter: isActive ? 'none' : 'grayscale(30%)',
        opacity: isActive ? 1 : 0.3,
        transition: 'filter 0.5s, opacity 0.5s',
      }}
    >
      {/* INFORMATION label */}
      <p
        className="text-[10px] tracking-[6px] mb-3"
        style={{
          color: isActive ? `${theme.accent}80` : '#bbb',
          fontWeight: 300,
          ...stagger(hasAppeared, 0),
        }}
      >
        INFORMATION
      </p>

      <h2
        className="font-serif text-[16px] text-center mb-8 tracking-[1px]"
        style={{
          color: isActive ? theme.text : '#999',
          fontWeight: 300,
          ...stagger(hasAppeared, 0.15),
        }}
      >
        결혼식 안내
      </h2>

      {/* 탭 버튼들 - chip style */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 mb-8"
        style={stagger(hasAppeared, 0.3)}
      >
        {enabledTabs.map((tab) => {
          const isTabActive = effectiveTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 text-[11px] tracking-[0.5px] rounded-3xl transition-all duration-300"
              style={{
                backgroundColor: isTabActive ? '#FFFFFF' : 'transparent',
                border: `1px solid ${isTabActive ? (isActive ? theme.accent : '#ccc') : (isActive ? '#E8E2DA' : '#ddd')}`,
                color: isTabActive ? (isActive ? theme.accent : '#999') : (isActive ? theme.textLight : '#aaa'),
                boxShadow: isTabActive ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
                fontWeight: isTabActive ? 500 : 300,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 콘텐츠 카드 */}
      <div
        className="w-full max-w-[320px] text-center p-7 rounded-2xl transition-shadow duration-500"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: isActive ? '0 2px 20px rgba(0,0,0,0.04)' : '0 1px 8px rgba(0,0,0,0.02)',
          ...stagger(hasAppeared, 0.45),
        }}
      >
        {/* 꽃 답례품 */}
        {effectiveTab === 'flowerGift' && flowerGift?.enabled &&
          renderTabContent(<BouquetIcon size={28} color={theme.accent} />, '꽃 답례품 안내', flowerGift.content || defaultFlowerGift)
        }

        {/* 화환 안내 */}
        {effectiveTab === 'wreath' && wreath?.enabled &&
          renderTabContent(<WreathIcon size={28} color={theme.accent} />, '화환 안내', wreath.content || defaultWreath)
        }

        {/* 화동 안내 */}
        {effectiveTab === 'flowerChild' && flowerChild?.enabled &&
          renderTabContent(<FlowerChildIcon size={28} color={theme.accent} />, '화동 안내', flowerChild.content || defaultFlowerChild)
        }

        {/* 피로연 안내 */}
        {effectiveTab === 'reception' && reception?.enabled &&
          renderTabContent(
            <CutleryIcon size={28} color={theme.accent} />,
            '피로연 안내',
            reception.content || defaultReception,
            (reception.venue || reception.datetime) ? renderInfoBox([
              ...(reception.venue ? [{ label: '장소', value: reception.venue }] : []),
              ...(reception.datetime ? [{ label: '일시', value: reception.datetime }] : []),
            ]) : undefined
          )
        }

        {/* 포토부스 안내 */}
        {effectiveTab === 'photoBooth' && photoBooth?.enabled &&
          renderTabContent(<CameraIcon size={28} color={theme.accent} />, '포토부스 안내', photoBooth.content || defaultPhotoBooth)
        }

        {/* 셔틀버스 안내 */}
        {effectiveTab === 'shuttle' && shuttle?.enabled && (
          <div
            key="shuttle"
            style={{
              opacity: 1,
              animation: 'fadeInUp 0.4s ease',
            }}
          >
            <div className="flex items-center justify-center mb-5" style={{ opacity: 0.8 }}>
              <BusIcon size={28} color={theme.accent} />
            </div>
            <h3
              className="font-serif text-[15px] mb-4 tracking-[1px]"
              style={{ color: isActive ? theme.text : '#999', fontWeight: 400 }}
            >
              셔틀버스 안내
            </h3>
            <p
              className="text-xs leading-[2] mb-5"
              style={{ color: isActive ? theme.textLight : '#aaa' }}
            >
              {`예식 당일 셔틀버스가 운행될 예정입니다.
탑승 장소와 시간은 아래 내용을 참고해 주세요.
편안한 이동이 되시길 바랍니다.`}
            </p>

            {renderInfoBox([
              ...(shuttle.departureDate ? [{
                label: '출발 일시',
                value: shuttle.departureDate + (shuttle.departureTime ? `\n${shuttle.departureTime}` : ''),
              }] : []),
              ...(shuttle.departureLocation ? [{ label: '탑승 장소', value: shuttle.departureLocation }] : []),
              ...(shuttle.returnTime ? [{ label: '복귀 일시', value: shuttle.returnTime }] : []),
              ...(shuttle.vehicleNumber ? [{ label: '차량 번호', value: shuttle.vehicleNumber }] : []),
            ])}

            {shuttle.notes && shuttle.notes.length > 0 && (
              <div
                className="mt-4 p-3.5 rounded-xl text-left"
                style={{
                  backgroundColor: isActive ? `${theme.primary}08` : '#fafafa',
                  border: `1px solid ${isActive ? `${theme.primary}15` : '#f0f0f0'}`,
                }}
              >
                <p
                  className="text-[10px] mb-2 tracking-[1px]"
                  style={{ color: isActive ? theme.primary : '#bbb', fontWeight: 500 }}
                >
                  안내 사항
                </p>
                <ul className="text-[10px] leading-[1.8] space-y-1" style={{ color: isActive ? '#888' : '#bbb' }}>
                  {shuttle.notes.map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 커스텀 안내 항목 */}
        {effectiveTab?.startsWith('custom-') && (() => {
          const customId = (effectiveTab || '').replace('custom-', '')
          // ID 기반 조회 (우선) → 레거시 인덱스 기반 fallback
          let custom = customItems?.find(c => c.id === customId)
          if (!custom) {
            const idx = parseInt(customId, 10)
            if (!isNaN(idx)) custom = customItems?.[idx]
          }
          if (!custom?.enabled || !custom.title) return null
          const svgNode = custom.emoji ? renderSvgIcon(custom.emoji, { size: 28, color: theme.accent }) : null
          const customIcon = svgNode
            || (custom.emoji ? <span className="text-2xl">{custom.emoji}</span> : <PinIcon size={28} color={theme.accent} />)
          return renderTabContent(
            customIcon,
            custom.title,
            custom.content || ''
          )
        })()}
      </div>
    </section>
  )
}
