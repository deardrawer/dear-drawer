'use client'

import { createContext, useContext } from 'react'
import { COLOR_THEMES, type ColorTheme, type ColorThemeId } from './types'
import { C_BG, C_INK, C_SUB, sectionTone } from './cStyle'

// C안: 저장된 테마/색 데이터는 그대로 두고, 화면은 흰 바탕 · 먹색 글씨로 통일.
// 고객이 메인 컬러를 직접 고른 경우(customPrimary)에만 작은 포인트(point)로 사용한다.
const DEFAULT_THEME: ColorTheme = { ...COLOR_THEMES.burgundy, background: C_BG, text: C_INK, textLight: C_SUB, point: C_INK }

const ThemeContext = createContext<ColorTheme>(DEFAULT_THEME)

export function ThemeProvider({
  themeId,
  customPrimary,
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
  // 호환용으로 props는 모두 받지만, 배경 · 글씨색 · 틴트는 C안 기준으로 고정
  const baseTheme = COLOR_THEMES[themeId] || COLOR_THEMES.burgundy
  const theme: ColorTheme = {
    ...baseTheme,
    ...(customPrimary && { primary: customPrimary }),
    background: C_BG,
    text: C_INK,
    textLight: C_SUB,
    tintedBg: false,
    cardText: C_INK,
    cardTextLight: C_SUB,
    point: customPrimary || C_INK,  // 고른 색 그대로
  }
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

/** 섹션 배경 — 고른 섹션만 틴티드 배경을 가장자리까지 칠하고, 어두우면 글씨를 밝게 */
export function SectionTint({
  tinted,
  tintColor,
  children,
}: {
  tinted: boolean
  tintColor?: string
  baseBackground?: string
  tintedText?: string
  children: React.ReactNode
}) {
  if (!tinted || !tintColor) return <>{children}</>
  return <div style={sectionTone(tintColor)}>{children}</div>
}
