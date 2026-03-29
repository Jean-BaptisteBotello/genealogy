import { describe, it, expect } from 'vitest'
import { findSPFByLieu, SPF_DIRECTORY } from '../spf-directory'

describe('SPF directory', () => {
  it('has entries for metropolitan départements', () => {
    expect(SPF_DIRECTORY.length).toBeGreaterThan(90)
  })

  it('finds SPF by lieu with département in parentheses', () => {
    const spf = findSPFByLieu('Toulon (83)')
    expect(spf).not.toBeNull()
    expect(spf!.departement).toBe('83')
  })

  it('finds SPF by lieu ending with département number', () => {
    const spf = findSPFByLieu('Paris 75')
    expect(spf).not.toBeNull()
    expect(spf!.departement).toBe('75')
  })

  it('returns null for unknown lieu', () => {
    expect(findSPFByLieu('Unknown Place')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(findSPFByLieu('')).toBeNull()
  })

  it('handles Corsica départements (2A, 2B)', () => {
    const spf = findSPFByLieu('Ajaccio (2A)')
    expect(spf).not.toBeNull()
    expect(spf!.departement).toBe('2A')
  })

  it('handles DOM départements (971-976)', () => {
    const spf = findSPFByLieu('Fort-de-France (972)')
    expect(spf).not.toBeNull()
    expect(spf!.departement).toBe('972')
  })

  it('finds SPF with comma-separated lieu', () => {
    const spf = findSPFByLieu('Hyères, 83')
    expect(spf).not.toBeNull()
    expect(spf!.departement).toBe('83')
  })
})
