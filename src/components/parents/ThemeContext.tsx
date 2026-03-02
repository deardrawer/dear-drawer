'use client'

import { createContext, useContext } from 'react'
import { COLOR_THEMES, type ColorTheme, type ColorThemeId } from './types'

const ThemeContext = createContext<ColorTheme>(COLOR_THEMES.burgundy)

export function ThemeProvider({
  themeId,
  customPrimary,
  customAccent,
  children,
}: {
  themeId: ColorThemeId
  customPrimary?: string
  customAccent?: string
  children: React.ReactNode
}) {
  const baseTheme = COLOR_THEMES[themeId] || COLOR_THEMES.burgundy
  const theme = {
    ...baseTheme,
    ...(customPrimary && { primary: customPrimary }),
    ...(customAccent && { accent: customAccent }),
  }
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
