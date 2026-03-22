// src/server-actions/__tests__/persons.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/geocode', () => ({
  geocodeLieu: vi.fn().mockResolvedValue(null),
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { geocodeLieu } from '@/lib/geocode'

const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockUpdate = vi.fn(() => ({ eq: () => ({ select: () => ({ single: mockSingle }) }) }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockDeleteEq = vi.fn(() => ({ error: null }))
const mockFrom = vi.fn((_table: string) => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })),
}))

const mockSupabase = { from: mockFrom }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
})

describe('createPerson', () => {
  it('inserts a person and returns their id on success', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'uuid-123' }, error: null })

    const { createPerson } = await import('../persons')
    const form = new FormData()
    form.set('prenom', 'Marie')
    form.set('nom', 'Curie')
    form.set('date_naissance', '1867-11-07')
    form.set('lieu_naissance', 'Warsaw')

    const result = await createPerson(form)
    expect(result).toEqual({ id: 'uuid-123' })
    expect(mockFrom).toHaveBeenCalledWith('person')
  })

  it('returns error message when insert fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const { createPerson } = await import('../persons')
    const form = new FormData()
    form.set('prenom', 'Marie')
    form.set('nom', 'Curie')

    const result = await createPerson(form)
    expect(result).toEqual({ error: 'DB error' })
  })

  it('geocodes lieu_naissance and stores lat/lon', async () => {
    vi.mocked(geocodeLieu).mockResolvedValueOnce({ lat: 52.23, lon: 21.01 })
    mockSingle.mockResolvedValue({ data: { id: 'uuid-456' }, error: null })

    const { createPerson } = await import('../persons')
    const form = new FormData()
    form.set('prenom', 'Marie')
    form.set('nom', 'Curie')
    form.set('lieu_naissance', 'Warsaw')

    await createPerson(form)
    expect(geocodeLieu).toHaveBeenCalledWith('Warsaw')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ lat_naissance: 52.23, lon_naissance: 21.01 })
    )
  })

  it('calls revalidatePath on success', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'uuid-789' }, error: null })

    const { createPerson } = await import('../persons')
    const form = new FormData()
    form.set('prenom', 'Marie')
    form.set('nom', 'Curie')
    await createPerson(form)

    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })
})

describe('updatePerson', () => {
  it('returns error when update fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const { updatePerson } = await import('../persons')
    const form = new FormData()
    form.set('id', 'uuid-123')
    form.set('prenom', 'Maria')
    form.set('nom', 'Curie')

    const result = await updatePerson(form)
    expect(result).toEqual({ error: 'Not found' })
  })

  it('returns updated id on success', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'uuid-123' }, error: null })

    const { updatePerson } = await import('../persons')
    const form = new FormData()
    form.set('id', 'uuid-123')
    form.set('prenom', 'Maria')
    form.set('nom', 'Curie')

    const result = await updatePerson(form)
    expect(result).toEqual({ id: 'uuid-123' })
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })
})

describe('deletePerson', () => {
  it('returns error when delete fails', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: { message: 'Cannot delete' } } as any)

    const { deletePerson } = await import('../persons')
    const result = await deletePerson('uuid-123')
    expect(result).toEqual({ error: 'Cannot delete' })
  })

  it('returns empty object on success', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: null })

    const { deletePerson } = await import('../persons')
    const result = await deletePerson('uuid-123')
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })
})
