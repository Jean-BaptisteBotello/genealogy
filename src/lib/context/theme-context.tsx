// src/lib/context/theme-context.tsx
'use client'
import { createContext, useContext, useEffect } from 'react'

export type ThemeId = 'warm-light'

interface ThemeColors {
  bodyBg: string
  topbarBg: string
  topbarBorder: string
  topbarText: string
  sidebarBg: string
  sidebarBorder: string
  detailBg: string
  detailBorder: string
  sectionLabel: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  textLink: string
  accentBg: string
  accentText: string
  accentHover: string
  avatarBg: string
  avatarText: string
  inputBg: string
  divider: string
  dividerLight: string
  badgeBg: string
  badgeText: string
}

const THEME: ThemeColors = {
  bodyBg: '#f8f8f6',
  topbarBg: '#ffffff',
  topbarBorder: '#e5e2dd',
  topbarText: '#3a3a3a',
  sidebarBg: '#f2f0ed',
  sidebarBorder: '#e5e2dd',
  detailBg: '#ffffff',
  detailBorder: '#e5e2dd',
  sectionLabel: '#b0aaa4',
  textPrimary: '#1a1a1a',
  textSecondary: '#6b6560',
  textMuted: '#8a8580',
  textLink: '#7c3aed',
  accentBg: 'rgba(124,58,237,0.08)',
  accentText: '#7c3aed',
  accentHover: 'rgba(124,58,237,0.12)',
  avatarBg: 'rgba(124,58,237,0.1)',
  avatarText: '#7c3aed',
  inputBg: '#f8f8f6',
  divider: '#e5e2dd',
  dividerLight: '#f0eded',
  badgeBg: 'rgba(124,58,237,0.08)',
  badgeText: '#7c3aed',
}

interface ThemeContextValue {
  themeId: ThemeId
  colors: ThemeColors
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'warm-light',
  colors: THEME,
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Apply CSS custom properties to <html>
  useEffect(() => {
    const colors = THEME
    const root = document.documentElement
    root.style.setProperty('--body-bg', colors.bodyBg)
    root.style.setProperty('--topbar-bg', colors.topbarBg)
    root.style.setProperty('--topbar-border', colors.topbarBorder)
    root.style.setProperty('--topbar-text', colors.topbarText)
    root.style.setProperty('--sidebar-bg', colors.sidebarBg)
    root.style.setProperty('--sidebar-border', colors.sidebarBorder)
    root.style.setProperty('--detail-bg', colors.detailBg)
    root.style.setProperty('--detail-border', colors.detailBorder)
    root.style.setProperty('--section-label', colors.sectionLabel)
    root.style.setProperty('--text-primary', colors.textPrimary)
    root.style.setProperty('--text-secondary', colors.textSecondary)
    root.style.setProperty('--text-muted', colors.textMuted)
    root.style.setProperty('--text-link', colors.textLink)
    root.style.setProperty('--accent-bg', colors.accentBg)
    root.style.setProperty('--accent-text', colors.accentText)
    root.style.setProperty('--accent-hover', colors.accentHover)
    root.style.setProperty('--avatar-bg', colors.avatarBg)
    root.style.setProperty('--avatar-text', colors.avatarText)
    root.style.setProperty('--input-bg', colors.inputBg)
    root.style.setProperty('--divider', colors.divider)
    root.style.setProperty('--divider-light', colors.dividerLight)
    root.style.setProperty('--badge-bg', colors.badgeBg)
    root.style.setProperty('--badge-text', colors.badgeText)
  }, [])

  return (
    <ThemeContext.Provider value={{ themeId: 'warm-light', colors: THEME, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}
