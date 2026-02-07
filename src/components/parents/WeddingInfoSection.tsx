'use client'

import { useState } from 'react'
import { useSectionHighlight } from './SectionHighlightContext'
import { useTheme } from './ThemeContext'

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

  // 기본 탭 정의
  const builtInTabs: Record<string, { label: string; emoji: string; enabled: boolean }> = {
    flowerGift: { label: '꽃 답례품', emoji: '💐', enabled: !!flowerGift?.enabled },
    wreath: { label: '화환 안내', emoji: '🌸', enabled: !!wreath?.enabled },
    flowerChild: { label: '화동 안내', emoji: '🌼', enabled: !!flowerChild?.enabled },
    reception: { label: '피로연', emoji: '🍽', enabled: !!reception?.enabled },
    photoBooth: { label: '포토부스', emoji: '📸', enabled: !!photoBooth?.enabled },
    shuttle: { label: '셔틀버스', emoji: '🚌', enabled: !!shuttle?.enabled },
  }

  // itemOrder 기반으로 탭 순서 결정
  const defaultOrder = ['flowerGift', 'wreath', 'flowerChild', 'reception', 'photoBooth', 'shuttle']
  const order = itemOrder || defaultOrder

  // 커스텀 항목도 포함하여 순서대로 활성화된 탭 계산
  const enabledTabs: { id: string; label: string; emoji: string }[] = []
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
        enabledTabs.push({ id: key, label: custom.title, emoji: custom.emoji || '📌' })
      }
    } else if (builtInTabs[key]?.enabled) {
      enabledTabs.push({ id: key, label: builtInTabs[key].label, emoji: builtInTabs[key].emoji })
    }
  }

  const [activeTab, setActiveTab] = useState(enabledTabs[0]?.id || 'flowerGift')

  // 현재 선택된 탭이 활성 탭 목록에 없으면 첫 번째 탭으로 보정
  const effectiveTab = enabledTabs.find(t => t.id === activeTab) ? activeTab : enabledTabs[0]?.id

  // 섹션이 비활성화되었거나 활성화된 항목이 없으면 렌더링 안함
  if (!enabled || enabledTabs.length === 0) {
    return null
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="px-8 py-16 transition-all duration-500 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.background,
        opacity: hasAppeared ? (isActive ? 1 : 0.3) : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(20px)',
        filter: isActive ? 'none' : 'grayscale(30%)',
      }}
    >
      <h2
        className="font-serif text-lg font-semibold text-center mb-8 tracking-wider transition-colors duration-500"
        style={{ color: isActive ? theme.text : '#999' }}
      >
        결혼식 안내
      </h2>

      {/* 탭 버튼들 */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {enabledTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-2 text-xs tracking-wide rounded-full transition-all"
            style={{
              backgroundColor: effectiveTab === tab.id ? theme.accent : '#F5F0EB',
              color: effectiveTab === tab.id ? '#fff' : '#666',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="w-full max-w-[320px] text-center p-6 rounded-lg border transition-all duration-500"
        style={{
          borderColor: '#E8E4DC',
          boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
        }}
      >
        {/* 💐 꽃 답례품 */}
        {effectiveTab === 'flowerGift' && flowerGift?.enabled && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">💐</div>
            <h3 className="font-serif text-base mb-4 tracking-wide" style={{ color: theme.text }}>
              꽃 답례품 안내
            </h3>
            <p className="text-xs leading-[2] whitespace-pre-line" style={{ color: '#666' }}>
              {flowerGift.content || defaultFlowerGift}
            </p>
          </div>
        )}

        {/* 🌸 화환 안내 */}
        {effectiveTab === 'wreath' && wreath?.enabled && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">🌸</div>
            <h3 className="font-serif text-base mb-4 tracking-wide" style={{ color: theme.text }}>
              화환 안내
            </h3>
            <p className="text-xs leading-[2] whitespace-pre-line" style={{ color: '#666' }}>
              {wreath.content || defaultWreath}
            </p>
          </div>
        )}

        {/* 🌼 화동 안내 */}
        {effectiveTab === 'flowerChild' && flowerChild?.enabled && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">🌼</div>
            <h3 className="font-serif text-base mb-4 tracking-wide" style={{ color: theme.text }}>
              화동 안내
            </h3>
            <p className="text-xs leading-[2] whitespace-pre-line" style={{ color: '#666' }}>
              {flowerChild.content || defaultFlowerChild}
            </p>
          </div>
        )}

        {/* 🍽 피로연 안내 */}
        {effectiveTab === 'reception' && reception?.enabled && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">🍽</div>
            <h3 className="font-serif text-base mb-4 tracking-wide" style={{ color: theme.text }}>
              피로연 안내
            </h3>
            <p className="text-xs leading-[2] whitespace-pre-line mb-6" style={{ color: '#666' }}>
              {reception.content || defaultReception}
            </p>

            {(reception.venue || reception.datetime) && (
              <div className="text-left p-4 rounded-lg space-y-3" style={{ backgroundColor: '#F5F0EB' }}>
                {reception.venue && (
                  <div>
                    <p className="text-[10px] mb-1" style={{ color: theme.accent }}>[장소]</p>
                    <p className="text-xs" style={{ color: '#666' }}>{reception.venue}</p>
                  </div>
                )}
                {reception.datetime && (
                  <div>
                    <p className="text-[10px] mb-1" style={{ color: theme.accent }}>[일시]</p>
                    <p className="text-xs" style={{ color: '#666' }}>{reception.datetime}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 📸 포토부스 안내 */}
        {effectiveTab === 'photoBooth' && photoBooth?.enabled && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">📸</div>
            <h3 className="font-serif text-base mb-4 tracking-wide" style={{ color: theme.text }}>
              포토부스 안내
            </h3>
            <p className="text-xs leading-[2] whitespace-pre-line" style={{ color: '#666' }}>
              {photoBooth.content || defaultPhotoBooth}
            </p>
          </div>
        )}

        {/* 🚌 셔틀버스 안내 */}
        {effectiveTab === 'shuttle' && shuttle?.enabled && (
          <div className="animate-fade-in">
            <div className="text-3xl mb-6">🚌</div>
            <h3 className="font-serif text-base mb-4 tracking-wide" style={{ color: theme.text }}>
              셔틀버스 안내
            </h3>
            <p className="text-xs leading-[2] mb-6" style={{ color: '#666' }}>
              {`예식 당일 셔틀버스가 운행될 예정입니다.
탑승 장소와 시간은 아래 내용을 참고해 주세요.
편안한 이동이 되시길 바랍니다.`}
            </p>

            <div className="text-left p-4 rounded-lg space-y-4" style={{ backgroundColor: '#F5F0EB' }}>
              {shuttle.departureDate && (
                <div>
                  <p className="text-[10px] mb-1" style={{ color: theme.accent }}>[출발 일시]</p>
                  <p className="text-xs" style={{ color: '#666' }}>
                    {shuttle.departureDate}
                    {shuttle.departureTime && <><br />{shuttle.departureTime}</>}
                  </p>
                </div>
              )}
              {shuttle.departureLocation && (
                <div>
                  <p className="text-[10px] mb-1" style={{ color: theme.accent }}>[탑승 장소]</p>
                  <p className="text-xs" style={{ color: '#666' }}>{shuttle.departureLocation}</p>
                </div>
              )}
              {shuttle.returnTime && (
                <div>
                  <p className="text-[10px] mb-1" style={{ color: theme.accent }}>[복귀 일시]</p>
                  <p className="text-xs" style={{ color: '#666' }}>{shuttle.returnTime}</p>
                </div>
              )}
              {shuttle.vehicleNumber && (
                <div>
                  <p className="text-[10px] mb-1" style={{ color: theme.accent }}>[차량 번호]</p>
                  <p className="text-xs" style={{ color: '#666' }}>{shuttle.vehicleNumber}</p>
                </div>
              )}
            </div>

            {shuttle.notes && shuttle.notes.length > 0 && (
              <div
                className="mt-4 p-3 rounded-lg text-left"
                style={{ backgroundColor: '#FDF8F0', border: '1px solid #E8E4DC' }}
              >
                <p className="text-[10px] mb-2 font-medium" style={{ color: theme.accent }}>
                  안내 사항
                </p>
                <ul className="text-[10px] leading-[1.8] space-y-1" style={{ color: '#888' }}>
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
          return (
            <div className="animate-fade-in">
              <div className="text-3xl mb-6">{custom.emoji || '📌'}</div>
              <h3 className="font-serif text-base mb-4 tracking-wide" style={{ color: theme.text }}>
                {custom.title}
              </h3>
              {custom.content && (
                <p className="text-xs leading-[2] whitespace-pre-line" style={{ color: '#666' }}>
                  {custom.content}
                </p>
              )}
            </div>
          )
        })()}
      </div>
    </section>
  )
}
