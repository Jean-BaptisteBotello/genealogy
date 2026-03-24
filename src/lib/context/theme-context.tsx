// src/lib/context/theme-context.tsx
'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type ThemeId = 'cosmos' | 'beige'

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

const THEMES: Record<ThemeId, ThemeColors> = {
  cosmos: {
    bodyBg: 'linear-gradient(170deg, #a8b5c4 0%, #b5a8c0 45%, #b88090 80%, #a06878 100%)',
    topbarBg: 'rgba(160,120,135,0.3)',
    topbarBorder: 'rgba(160,110,130,0.25)',
    topbarText: 'rgba(255,255,255,0.8)',
    sidebarBg: 'rgba(140,100,120,0.18)',
    sidebarBorder: 'rgba(160,110,130,0.2)',
    detailBg: 'rgba(140,100,120,0.18)',
    detailBorder: 'rgba(160,110,130,0.2)',
    sectionLabel: 'rgba(255,255,255,0.4)',
    textPrimary: 'rgba(255,255,255,0.9)',
    textSecondary: 'rgba(255,255,255,0.6)',
    textMuted: 'rgba(255,255,255,0.35)',
    textLink: '#c8deff',
    accentBg: 'rgba(255,255,255,0.12)',
    accentText: 'rgba(255,255,255,0.8)',
    accentHover: 'rgba(255,255,255,0.2)',
    avatarBg: 'rgba(255,255,255,0.18)',
    avatarText: 'rgba(255,255,255,0.75)',
    inputBg: 'rgba(255,255,255,0.08)',
    divider: 'rgba(160,110,130,0.25)',
    dividerLight: 'rgba(160,110,130,0.12)',
    badgeBg: 'rgba(255,255,255,0.15)',
    badgeText: 'rgba(255,255,255,0.7)',
  },
  beige: {
    bodyBg: '#e8ddd0',
    topbarBg: '#d4c4b0',
    topbarBorder: 'rgba(160,140,110,0.3)',
    topbarText: '#5a4a38',
    sidebarBg: '#ddd0c0',
    sidebarBorder: 'rgba(160,140,110,0.25)',
    detailBg: '#ddd0c0',
    detailBorder: 'rgba(160,140,110,0.25)',
    sectionLabel: 'rgba(90,74,56,0.5)',
    textPrimary: '#3d3228',
    textSecondary: '#7a6a50',
    textMuted: 'rgba(90,74,56,0.4)',
    textLink: '#8b6040',
    accentBg: 'rgba(90,74,56,0.08)',
    accentText: '#5a4a38',
    accentHover: 'rgba(90,74,56,0.15)',
    avatarBg: 'rgba(90,74,56,0.12)',
    avatarText: '#7a6a50',
    inputBg: 'rgba(90,74,56,0.06)',
    divider: 'rgba(160,140,110,0.3)',
    dividerLight: 'rgba(160,140,110,0.15)',
    badgeBg: 'rgba(90,74,56,0.1)',
    badgeText: '#7a6a50',
  },
}

interface ThemeContextValue {
  themeId: ThemeId
  colors: ThemeColors
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'cosmos',
  colors: THEMES.cosmos,
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('cosmos')

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('genealogy_theme')
    if (saved === 'cosmos' || saved === 'beige') {
      setThemeId(saved)
    }
  }, [])

  // Apply CSS custom properties to <html>
  useEffect(() => {
    const colors = THEMES[themeId]
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
  }, [themeId])

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id)
    localStorage.setItem('genealogy_theme', id)
  }, [])

  return (
    <ThemeContext.Provider value={{ themeId, colors: THEMES[themeId], setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
