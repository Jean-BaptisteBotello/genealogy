export const SELECTION_TOKENS = {
  accent: '#7c3aed',
  halo: 'rgba(124, 58, 237, 0.12)',
  borderWidthPx: 2,
  svgGlow: 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.35))',
} as const

export type SelectionTokens = typeof SELECTION_TOKENS
