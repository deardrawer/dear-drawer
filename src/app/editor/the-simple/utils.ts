/**
 * THE SIMPLE 에디터 공용 유틸리티
 */

/**
 * 섹션 인스턴스 ID에서 타입을 추출합니다.
 *
 * - `'gallery'` → `'gallery'`
 * - `'gallery-1734567890'` → `'gallery'`
 * - `'intro'` → `'intro'`
 *
 * 섹션 인스턴스 ID 규칙: `{type}` 또는 `{type}-{timestamp}`
 */
export function getSectionType(instanceId: string): string {
  const dashIdx = instanceId.indexOf('-')
  return dashIdx === -1 ? instanceId : instanceId.slice(0, dashIdx)
}

/**
 * 새 섹션 인스턴스 ID를 생성합니다.
 */
export function createSectionInstanceId(type: string): string {
  return `${type}-${Date.now()}`
}
