'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ParentsInvitationView } from '@/components/parents'
import { PARENTS_SAMPLE as sampleData } from '@/components/parents/sampleContent'
import type { ParentsInvitationContent, ColorThemeId, FontStyleId } from '@/components/parents'


// 유효한 컬러 테마 ID 목록
const validColorThemes: ColorThemeId[] = ['burgundy', 'navy', 'sage', 'dustyRose', 'emerald', 'slateBlue']
// 유효한 폰트 스타일 ID 목록
const validFontStyles: FontStyleId[] = ['elegant', 'soft', 'classic', 'brush', 'modern', 'friendly', 'ridibatang', 'gangwon', 'okticon', 'pretendard', 'contemporary', 'luxury', 'gulim', 'neathand', 'roundhand', 'roundgothic', 'suit', 'myungjo', 'dandi']

function ParentsSampleContent() {
  const searchParams = useSearchParams()

  // URL 쿼리에서 colorTheme과 fontStyle 읽기
  const colorThemeParam = searchParams.get('colorTheme')
  const fontStyleParam = searchParams.get('fontStyle')

  // 유효한 값인지 확인 후 적용, 아니면 기본값 사용
  const colorTheme: ColorThemeId = validColorThemes.includes(colorThemeParam as ColorThemeId)
    ? (colorThemeParam as ColorThemeId)
    : sampleData.colorTheme

  const fontStyle: FontStyleId = validFontStyles.includes(fontStyleParam as FontStyleId)
    ? (fontStyleParam as FontStyleId)
    : (sampleData.fontStyle || 'soft')

  // 쿼리 파라미터로 오버라이드된 데이터
  const dataWithOverrides: ParentsInvitationContent = {
    ...sampleData,
    colorTheme,
    fontStyle,
  }

  return (
    <ParentsInvitationView
      data={dataWithOverrides}
      guestInfo={{ id: 'sample', name: '김도현', honorific: '님께' }}
    />
  )
}

export default function FamilyInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 animate-pulse" />}>
      <ParentsSampleContent />
    </Suspense>
  )
}
