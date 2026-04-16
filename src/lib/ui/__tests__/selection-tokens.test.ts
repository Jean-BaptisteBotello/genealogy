import { describe, it, expect } from 'vitest'
import { SELECTION_TOKENS } from '../selection-tokens'

describe('SELECTION_TOKENS', () => {
  it('expose une couleur d\'accent violette conforme au design system', () => {
    expect(SELECTION_TOKENS.accent).toBe('#7c3aed')
  })
  it('expose un halo RGBA dérivé de l\'accent', () => {
    expect(SELECTION_TOKENS.halo).toMatch(/rgba\(124,\s*58,\s*237,\s*0\.12\)/)
  })
  it('expose une épaisseur de bordure en pixels', () => {
    expect(SELECTION_TOKENS.borderWidthPx).toBe(2)
  })
  it('expose un filter SVG drop-shadow', () => {
    expect(SELECTION_TOKENS.svgGlow).toContain('drop-shadow')
    expect(SELECTION_TOKENS.svgGlow).toContain('rgba(124, 58, 237, 0.35)')
  })
})
