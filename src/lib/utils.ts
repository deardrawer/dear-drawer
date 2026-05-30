import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 렌더링 전 숨겨진 유니코드 공백 문자를 제거/변환합니다.
 * 복사-붙여넣기로 유입되는 보이지 않는 문자가 iOS Safari에서
 * 비정상적인 줄바꿈을 유발하는 문제를 방지합니다.
 *
 * - 제거: Zero Width Space(\u200B), ZWNJ(\u200C), ZWJ(\u200D), BOM(\uFEFF)
 * - 변환: NBSP(\u00A0) → 일반 공백
 * - 유지: 줄바꿈(\n), 탭(\t) 등 사용자 의도 공백
 */
export function sanitizeTextForRender(value?: string | null): string {
  if (!value) return ''
  return value
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
}
