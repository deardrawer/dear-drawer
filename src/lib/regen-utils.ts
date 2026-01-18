/**
 * 재생성 카운터 관리 유틸리티
 * - 로컬스토리지 기반 카운터
 * - 섹션당 최대 재생성 횟수 제한
 * - 톤 분석 및 일관성 유지
 */

import type { GeneratedContent } from '@/types/ai-generator'

// ============================================================
// Constants
// ============================================================

const REGEN_COUNT_KEY = 'wedding-ai-regen-counts'
const REGEN_SESSION_KEY = 'wedding-ai-regen-session'
export const MAX_REGEN_PER_SECTION = 5

// ============================================================
// Types
// ============================================================

export interface RegenCounts {
  [sectionKey: string]: number
}

export interface RegenStatus {
  canRegenerate: boolean
  count: number
  maxCount: number
  remaining: number
}

export type SectionKey =
  | 'greeting'
  | 'thanks'
  | 'groomProfile'
  | 'brideProfile'
  | 'story'
  | 'story.first'
  | 'story.together'
  | 'story.preparation'
  | 'interview'

// ============================================================
// LocalStorage Utilities (Client-side only)
// ============================================================

/**
 * 브라우저 환경인지 확인
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/**
 * 현재 세션 ID 가져오기/생성
 */
function getSessionId(): string {
  if (!isBrowser()) return ''

  let sessionId = sessionStorage.getItem(REGEN_SESSION_KEY)
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(REGEN_SESSION_KEY, sessionId)
  }
  return sessionId
}

/**
 * 재생성 카운트 전체 가져오기
 */
export function getRegenCounts(): RegenCounts {
  if (!isBrowser()) return {}

  const sessionId = getSessionId()
  const key = `${REGEN_COUNT_KEY}-${sessionId}`
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : {}
}

/**
 * 재생성 카운트 저장
 */
function saveRegenCounts(counts: RegenCounts): void {
  if (!isBrowser()) return

  const sessionId = getSessionId()
  const key = `${REGEN_COUNT_KEY}-${sessionId}`
  localStorage.setItem(key, JSON.stringify(counts))
}

/**
 * 특정 섹션의 재생성 카운트 가져오기
 */
export function getRegenCount(sectionKey: string): number {
  const counts = getRegenCounts()
  return counts[sectionKey] || 0
}

/**
 * 재생성 카운트 증가
 */
export function incrementRegenCount(sectionKey: string): number {
  const counts = getRegenCounts()
  counts[sectionKey] = (counts[sectionKey] || 0) + 1
  saveRegenCounts(counts)
  return counts[sectionKey]
}

/**
 * 재생성 가능 여부 확인
 */
export function canRegenerate(sectionKey: string): boolean {
  return getRegenCount(sectionKey) < MAX_REGEN_PER_SECTION
}

/**
 * 모든 재생성 카운트 리셋
 */
export function resetRegenCounts(): void {
  if (!isBrowser()) return

  const sessionId = getSessionId()
  const key = `${REGEN_COUNT_KEY}-${sessionId}`
  localStorage.removeItem(key)

  // 새 세션 시작
  sessionStorage.removeItem(REGEN_SESSION_KEY)
}

/**
 * 섹션별 재생성 상태 정보 가져오기
 */
export function getRegenStatus(sectionKey: string): RegenStatus {
  const count = getRegenCount(sectionKey)
  const maxCount = MAX_REGEN_PER_SECTION

  return {
    canRegenerate: count < maxCount,
    count,
    maxCount,
    remaining: Math.max(0, maxCount - count)
  }
}

/**
 * 모든 섹션의 재생성 상태 가져오기
 */
export function getAllRegenStatuses(): Record<SectionKey, RegenStatus> {
  const sections: SectionKey[] = [
    'greeting',
    'thanks',
    'groomProfile',
    'brideProfile',
    'story',
    'story.first',
    'story.together',
    'story.preparation',
    'interview'
  ]

  const statuses = {} as Record<SectionKey, RegenStatus>
  for (const section of sections) {
    statuses[section] = getRegenStatus(section)
  }
  return statuses
}

// ============================================================
// Tone Analysis
// ============================================================

export interface ToneAnalysis {
  type: 'sincere' | 'warm' | 'concise' | 'cheerful'
  description: string
  characteristics: {
    hasJondaemal: boolean // -습니다/-입니다
    hasHaeyo: boolean // -해요/-이에요
    emojiCount: number
    exclamationCount: number
    avgSentenceLength: number
  }
}

/**
 * 현재 콘텐츠의 톤 분석
 */
export function analyzeTone(content: GeneratedContent): ToneAnalysis {
  const greeting = content.greeting || ''
  const thanks = content.thanks || ''
  const combinedText = greeting + ' ' + thanks + ' ' + (content.groomProfile || '')

  // 어미 분석
  const hasJondaemal = /습니다|입니다|했습니다|됩니다/.test(combinedText)
  const hasHaeyo = /해요|이에요|예요|있어요|됐어요/.test(combinedText)

  // 이모지 분석
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const emojiCount = (combinedText.match(emojiRegex) || []).length

  // 느낌표 분석
  const exclamationCount = (combinedText.match(/!/g) || []).length

  // 평균 문장 길이
  const sentences = combinedText.split(/[.!?]+/).filter(s => s.trim())
  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((acc, s) => acc + s.trim().length, 0) / sentences.length
    : 0

  const characteristics = {
    hasJondaemal,
    hasHaeyo,
    emojiCount,
    exclamationCount,
    avgSentenceLength
  }

  // 톤 타입 결정
  let type: ToneAnalysis['type']
  let description: string

  if (exclamationCount >= 3 || emojiCount >= 2) {
    type = 'cheerful'
    description = '밝고 유머러스한 톤 (느낌표와 이모지 활용)'
  } else if (hasJondaemal && !hasHaeyo) {
    type = 'sincere'
    description = '정중하고 진솔한 톤 (-습니다, -입니다 사용)'
  } else if (hasHaeyo) {
    type = 'warm'
    description = '따뜻하고 친근한 톤 (-해요, -이에요 사용)'
  } else if (avgSentenceLength < 30) {
    type = 'concise'
    description = '간결하고 단정한 톤 (짧은 문장)'
  } else {
    type = 'sincere'
    description = '진솔하고 깊이있는 톤'
  }

  return { type, description, characteristics }
}

/**
 * 톤 일치 가이드 텍스트 생성
 */
export function getToneMatchingGuide(analysis: ToneAnalysis): string {
  const { characteristics } = analysis

  const guidelines: string[] = []

  // 어미 가이드
  if (characteristics.hasJondaemal && !characteristics.hasHaeyo) {
    guidelines.push('- 어미는 "-습니다", "-입니다" 형식을 사용하세요')
  } else if (characteristics.hasHaeyo) {
    guidelines.push('- 어미는 "-해요", "-이에요" 형식을 사용하세요')
  }

  // 이모지 가이드
  if (characteristics.emojiCount > 0) {
    guidelines.push(`- 이모지를 ${characteristics.emojiCount > 2 ? '적극적으로' : '적절히'} 사용하세요`)
  } else {
    guidelines.push('- 이모지는 사용하지 않거나 최소화하세요')
  }

  // 느낌표 가이드
  if (characteristics.exclamationCount > 2) {
    guidelines.push('- 느낌표(!)를 활용해 밝은 느낌을 살리세요')
  } else if (characteristics.exclamationCount === 0) {
    guidelines.push('- 느낌표 사용을 자제하고 차분한 어조를 유지하세요')
  }

  // 문장 길이 가이드
  if (characteristics.avgSentenceLength < 30) {
    guidelines.push('- 짧고 간결한 문장을 사용하세요')
  } else if (characteristics.avgSentenceLength > 50) {
    guidelines.push('- 풍부한 표현과 긴 문장을 사용하세요')
  }

  return guidelines.join('\n')
}

// ============================================================
// Section Names
// ============================================================

export function getSectionName(section: string): string {
  const names: Record<string, string> = {
    greeting: '인사말',
    thanks: '감사말',
    groomProfile: '신랑 소개',
    brideProfile: '신부 소개',
    story: '러브스토리',
    'story.first': '연애의 시작',
    'story.together': '함께 성장한 시간',
    'story.preparation': '결혼 준비',
    interview: '웨딩 인터뷰'
  }
  return names[section] || section
}

// ============================================================
// Error Messages
// ============================================================

export function getRegenLimitError(section: string): string {
  const sectionName = getSectionName(section)
  return `${sectionName}은(는) 최대 재생성 횟수(${MAX_REGEN_PER_SECTION}회)에 도달했습니다. ` +
    `원하시는 결과가 나오지 않았다면 직접 수정해주세요.`
}
