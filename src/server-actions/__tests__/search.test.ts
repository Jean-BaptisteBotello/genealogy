import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'

const mockLimit = vi.fn()
const mockOr = vi.fn(() => ({ limit: mockLimit }))
const mockSelect = vi.fn(() => ({ or: mockOr }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockSupabase = { from: mockFrom }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
})

describe('searchPersons', () => {
  it('returns empty array for blank query', async () => {
    const { searchPersons } = await import('../search')
    const result = await searchPersons('   ')
    expect(result).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns empty array for empty string', async () => {
    const { searchPersons } = await import('../search')
    const result = await searchPersons('')
    expect(result).toEqual([])
  })

  it('queries person table with ilike on all four fields', async () => {
    mockLimit.mockResolvedValue({ data: [{ id: 'p1', prenom: 'Marie', nom: 'Curie' }] })

    const { searchPersons } = await import('../search')
    const result = await searchPersons('Marie')

    expect(mockFrom).toHaveBeenCalledWith('person')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockOr).toHaveBeenCalledWith(
      'prenom.ilike.%Marie%,nom.ilike.%Marie%,lieu_naissance.ilike.%Marie%,lieu_deces.ilike.%Marie%'
    )
    expect(mockLimit).toHaveBeenCalledWith(10)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ prenom: 'Marie' })
  })

  it('returns empty array when data is null', async () => {
    mockLimit.mockResolvedValue({ data: null })

    const { searchPersons } = await import('../search')
    const result = await searchPersons('xyz')
    expect(result).toEqual([])
  })

  it('trims whitespace from query before building the filter', async () => {
    mockLimit.mockResolvedValue({ data: [] })

    const { searchPersons } = await import('../search')
    await searchPersons('  Dupont  ')

    expect(mockOr).toHaveBeenCalledWith(
      'prenom.ilike.%Dupont%,nom.ilike.%Dupont%,lieu_naissance.ilike.%Dupont%,lieu_deces.ilike.%Dupont%'
    )
  })
})
