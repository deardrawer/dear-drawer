'use client'

import { createContext, useContext } from 'react'
import { COLOR_THEMES, type ColorTheme, type ColorThemeId } from './types'

const ThemeContext = createContext<ColorTheme>(COLOR_THEMES.burgundy)

export function ThemeProvider({
  themeId,
  customPrimary,
  customAccent,
  customBackground,
  customText,
  customCardText,
  tintedBg,
  tintedColor,
  children,
}: {
  themeId: ColorThemeId
  customPrimary?: string
  customAccent?: string
  customBackground?: string
  customText?: string
  customCardText?: string
  tintedBg?: boolean
  tintedColor?: string
  children: React.ReactNode
}) {
  const baseTheme = COLOR_THEMES[themeId] || COLOR_THEMES.burgundy
  const theme = {
    ...baseTheme,
    ...(customPrimary && { primary: customPrimary }),
    ...(customAccent && { accent: customAccent }),
    ...(customBackground && { background: customBackground }),
    ...(customText && { text: customText, textLight: customText }),
    // 틴트는 섹션별(SectionTint)로만 적용. 전역 배경은 유지(흰/기본)하고 플래그만 전달
    tintedBg: !!tintedBg,
    // 흰 카드 위 텍스트: 배경 텍스트와 독립 (미지정 시 진한 기본색)
    cardText: customCardText || baseTheme.text,
    cardTextLight: customCardText || baseTheme.textLight,
  }
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

/** 섹션 단위로 틴트 배경 on/off를 오버라이드 (전역 틴트 + 섹션별 제외용) */
export function SectionTint({
  tinted,
  tintColor,
  baseBackground,
  tintedText,
  children,
}: {
  tinted: boolean
  tintColor?: string
  baseBackground: string
  tintedText?: string
  children: React.ReactNode
}) {
  const parent = useContext(ThemeContext)
  const theme = {
    ...parent,
    background: tinted && tintColor ? tintColor : baseBackground,
    tintedBg: tinted,
    // 틴트 섹션 위 텍스트 색 (어두운 틴트 가독성용) — 카드 텍스트(cardText)는 영향 없음
    ...(tinted && tintedText && { text: tintedText, textLight: tintedText }),
  }
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
