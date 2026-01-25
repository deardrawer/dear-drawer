'use client'

import { createContext, useContext } from 'react'
import { COLOR_THEMES, type ColorTheme, type ColorThemeId } from './types'

const ThemeContext = createContext<ColorTheme>(COLOR_THEMES.burgundy)

export function ThemeProvider({
  themeId,
  children,
}: {
  themeId: ColorThemeId
  children: React.ReactNode
}) {
  const theme = COLOR_THEMES[themeId] || COLOR_THEMES.burgundy
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
