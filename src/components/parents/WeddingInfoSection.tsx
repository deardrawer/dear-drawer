'use client'

import { useSectionHighlight } from './SectionHighlightContext'
import { C_FIELD, C_TXT, C_HAIR, C_TXT_SUB, cBody, cCaption, cDim, cStagger, cTitle } from './cStyle'
import CroppedImageDiv from '@/components/ui/CroppedImageDiv'

type InfoImage = { url: string; cropX?: number; cropY?: number; cropWidth?: number; cropHeight?: number }

interface CustomInfoItem {
  image?: InfoImage
  id?: string
  enabled?: boolean
  title?: string
  content?: string
  emoji?: string
}

interface WeddingInfoSectionProps {
  enabled?: boolean
  flowerGift?: { enabled?: boolean; content?: string; image?: InfoImage }
  wreath?: { enabled?: boolean; content?: string; image?: InfoImage }
  flowerChild?: { enabled?: boolean; content?: string; image?: InfoImage }
  reception?: { enabled?: boolean; content?: string; venue?: string; datetime?: string; image?: InfoImage }
  photoBooth?: { enabled?: boolean; content?: string; image?: InfoImage }
  shuttle?: {
    enabled?: boolean
    departureDate?: string
    departureTime?: string
    departureLocation?: string
    returnTime?: string
    vehicleNumber?: string
    notes?: string[]
    image?: InfoImage
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

const SHUTTLE_INTRO = '예식 당일 셔틀버스가 운행됩니다.\n탑승 장소와 시간은 아래 내용을 참고해 주세요.'

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

  const findCustom = (key: string): CustomInfoItem | undefined => {
    const customId = key.replace('custom-', '')
    // ID 기반 조회 (우선) → 레거시 인덱스 기반 fallback
    let custom = customItems?.find(c => c.id === customId)
    if (!custom) {
      const idx = parseInt(customId, 10)
      if (!isNaN(idx)) custom = customItems?.[idx]
    }
    return custom
  }

  type InfoRow = { label: string; value: string }
  type Item = { id: string; title: string; content: string; image?: InfoImage; rows?: InfoRow[]; notes?: string[] }

  // itemOrder 기반으로 순서 결정 — 탭 대신 모든 항목을 차례로 펼쳐 보여준다
  const defaultOrder = ['flowerGift', 'wreath', 'flowerChild', 'reception', 'photoBooth', 'shuttle']
  const order = itemOrder || defaultOrder
  const items: Item[] = []
  for (const key of order) {
    if (key.startsWith('custom-')) {
      const custom = findCustom(key)
      if (custom?.enabled && custom.title) items.push({ id: key, title: custom.title, content: custom.content || '', image: custom.image })
    } else if (key === 'flowerGift' && flowerGift?.enabled) {
      items.push({ id: key, title: '꽃 답례품', content: flowerGift.content || defaultFlowerGift, image: flowerGift.image })
    } else if (key === 'wreath' && wreath?.enabled) {
      items.push({ id: key, title: '화환 안내', content: wreath.content || defaultWreath, image: wreath.image })
    } else if (key === 'flowerChild' && flowerChild?.enabled) {
      items.push({ id: key, title: '화동 안내', content: flowerChild.content || defaultFlowerChild, image: flowerChild.image })
    } else if (key === 'reception' && reception?.enabled) {
      items.push({
        id: key,
        title: '피로연 안내',
        content: reception.content || defaultReception,
        image: reception.image,
        rows: [
          ...(reception.venue ? [{ label: '장소', value: reception.venue }] : []),
          ...(reception.datetime ? [{ label: '일시', value: reception.datetime }] : []),
        ],
      })
    } else if (key === 'photoBooth' && photoBooth?.enabled) {
      items.push({ id: key, title: '포토부스', content: photoBooth.content || defaultPhotoBooth, image: photoBooth.image })
    } else if (key === 'shuttle' && shuttle?.enabled) {
      items.push({
        id: key,
        title: '셔틀버스 안내',
        content: SHUTTLE_INTRO,
        image: shuttle.image,
        rows: [
          ...(shuttle.departureDate ? [{ label: '출발 일시', value: shuttle.departureDate + (shuttle.departureTime ? `\n${shuttle.departureTime}` : '') }] : []),
          ...(shuttle.departureLocation ? [{ label: '탑승 장소', value: shuttle.departureLocation }] : []),
          ...(shuttle.returnTime ? [{ label: '돌아오는 편', value: shuttle.returnTime }] : []),
          ...(shuttle.vehicleNumber ? [{ label: '차량 번호', value: shuttle.vehicleNumber }] : []),
        ],
        notes: (shuttle.notes || []).filter(n => (n || '').trim()),
      })
    }
  }

  // 섹션이 비활성화되었거나 활성화된 항목이 없으면 렌더링 안함
  if (!enabled || items.length === 0) {
    return null
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ backgroundColor: 'transparent', padding: '72px 28px 80px', ...cDim(isActive) }}
    >
      <p style={{ ...cCaption, ...cStagger(hasAppeared, 0) }}>결혼식 안내</p>
      <div style={{ marginTop: 22 }}>
        {items.map((item, idx) => (
          <div key={item.id} style={{ padding: '22px 0 24px', borderTop: `1px solid ${C_HAIR}`, ...cStagger(hasAppeared, 0.3 + idx * 0.12) }}>
            <h3 style={cTitle(18, 0)}>{item.title}</h3>
            {item.image?.url && (
              <div style={{ width: '100%', aspectRatio: '16 / 10', borderRadius: 4, overflow: 'hidden', marginTop: 14, backgroundColor: C_FIELD }}>
                <CroppedImageDiv
                  src={item.image.url}
                  crop={{ cropX: item.image.cropX ?? 0, cropY: item.image.cropY ?? 0, cropWidth: item.image.cropWidth ?? 1, cropHeight: item.image.cropHeight ?? 1 }}
                  className="w-full h-full"
                />
              </div>
            )}
            {item.content && (
              <p style={{ ...cBody(10), fontSize: 15, lineHeight: 1.85, whiteSpace: 'pre-line' }}>{item.content}</p>
            )}
            {item.rows && item.rows.length > 0 && (
              <div style={{ marginTop: 14 }}>
                {item.rows.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '6px 0' }}>
                    <span style={{ width: 76, flexShrink: 0, fontSize: 14, color: C_TXT_SUB, lineHeight: 1.6 }}>{r.label}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: C_TXT, lineHeight: 1.6, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}
            {item.notes && item.notes.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
                {item.notes.map((note, i) => (
                  <li key={i} style={{ fontSize: 13.5, lineHeight: 1.75, color: C_TXT_SUB, wordBreak: 'keep-all' }}>· {note}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${C_HAIR}` }} />
      </div>
    </section>
  )
}
