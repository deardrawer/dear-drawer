/**
 * 텍스트 하이라이트 유틸리티
 *
 * 사용법:
 * - ==텍스트== : 노란색 하이라이트
 * - ~~텍스트~~ : 흰색 하이라이트
 */

/**
 * 하이라이트 마크업을 HTML로 변환
 * @param text - 변환할 텍스트
 * @returns HTML 문자열
 */
export function parseHighlight(text: string): string {
  if (!text) return ''

  // ==텍스트== → 노란색 하이라이트
  let result = text.replace(/==([^=]+)==/g, '<span class="highlight-yellow">$1</span>')

  // ~~텍스트~~ → 흰색 하이라이트
  result = result.replace(/~~([^~]+)~~/g, '<span class="highlight-white">$1</span>')

  // 줄바꿈 처리
  result = result.replace(/\n/g, '<br/>')

  return result
}

/**
 * HTML에서 하이라이트 마크업으로 역변환 (에디터용)
 * @param html - HTML 문자열
 * @returns 마크업 텍스트
 */
export function highlightToMarkup(html: string): string {
  if (!html) return ''

  let result = html

  // <span class="highlight-yellow">텍스트</span> → ==텍스트==
  result = result.replace(/<span class="highlight-yellow">([^<]+)<\/span>/g, '==$1==')

  // <span class="highlight-white">텍스트</span> → ~~텍스트~~
  result = result.replace(/<span class="highlight-white">([^<]+)<\/span>/g, '~~$1~~')

  // <br/> → \n
  result = result.replace(/<br\s*\/?>/g, '\n')

  return result
}
