import type { DdayPopupData, ImageWithSettings, ImageSettings } from './ddayPopupTypes'

const DEFAULT_IMG_SETTINGS: ImageSettings = { scale: 1, positionX: 0, positionY: 0 }

function normalizeImage(input: unknown): ImageWithSettings | undefined {
  if (!input) return undefined
  if (typeof input === 'string') {
    return { url: input, settings: { ...DEFAULT_IMG_SETTINGS } }
  }
  if (typeof input === 'object') {
    const obj = input as Partial<ImageWithSettings> & { url?: string }
    if (!obj.url) return undefined
    return {
      url: obj.url,
      settings: {
        scale: obj.settings?.scale ?? 1,
        positionX: obj.settings?.positionX ?? 0,
        positionY: obj.settings?.positionY ?? 0,
        ...(obj.settings?.cropX !== undefined && { cropX: obj.settings.cropX }),
        ...(obj.settings?.cropY !== undefined && { cropY: obj.settings.cropY }),
        ...(obj.settings?.cropWidth !== undefined && { cropWidth: obj.settings.cropWidth }),
        ...(obj.settings?.cropHeight !== undefined && { cropHeight: obj.settings.cropHeight }),
      },
    }
  }
  return undefined
}

/**
 * DB에서 가져온 raw ddayPopup 데이터를 DdayPopupData로 정규화.
 * items→pages 마이그레이션, linkUrl→links 변환, image→images 변환 등 backward compat 포함.
 */
export function normalizeDdayPopup(raw: unknown): DdayPopupData | undefined {
  if (!raw || typeof raw !== 'object') return undefined

  const c = raw as Record<string, unknown>
  if (!c.enabled) return undefined

  // backward compatibility: items → pages 마이그레이션
  const rawPages = Array.isArray(c.pages)
    ? c.pages
    : Array.isArray(c.items)
      ? c.items
      : []

  return {
    enabled: !!c.enabled,
    ...(typeof c.displayStart === 'string' && { displayStart: c.displayStart }),
    ...(typeof c.displayEnd === 'string' && { displayEnd: c.displayEnd }),
    ...(typeof c.startDays === 'number' && { startDays: Math.min(c.startDays as number, 10) }),
    title: (c.title as string) || '결혼식 당일 안내',
    pages: (rawPages as unknown[]).map((r) => {
      const p = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
      // backward compat: 단일 linkUrl/linkLabel → links 배열로 변환
      let links: { url: string; label: string }[] | undefined
      if (Array.isArray(p.links)) {
        links = (p.links as unknown[])
          .map((l) => {
            const lo = (l && typeof l === 'object' ? l : {}) as Record<string, unknown>
            return {
              url: typeof lo.url === 'string' ? lo.url : '',
              label: typeof lo.label === 'string' ? lo.label : '',
            }
          })
          .filter((l) => l.url)
      } else if (typeof p.linkUrl === 'string' && p.linkUrl) {
        links = [{ url: p.linkUrl, label: typeof p.linkLabel === 'string' ? p.linkLabel : '' }]
      }
      // backward compat: 단일 image → images 배열로 변환
      let images: ImageWithSettings[] | undefined
      if (Array.isArray(p.images)) {
        images = (p.images as unknown[]).map((img) => normalizeImage(img)).filter((x): x is ImageWithSettings => !!x)
      } else if (p.image) {
        const single = normalizeImage(p.image)
        images = single ? [single] : undefined
      }
      return {
        title: typeof p.title === 'string' ? p.title : '',
        body: typeof p.body === 'string' ? p.body : '',
        images: images && images.length > 0 ? images : undefined,
        links,
      }
    }),
    buttonLabel: (c.buttonLabel as string) || '확인했습니다',
    showDday: c.showDday !== false,
    textAlign: c.textAlign === 'center' ? 'center' : 'left',
  }
}
