// src/server-actions/__tests__/relationships.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/cycle-detection', () => ({
  hasAncestorCycle: vi.fn().mockReturnValue(false),
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasAncestorCycle } from '@/lib/cycle-detection'

const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockDeleteEq = vi.fn(() => ({ error: null }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockSelectForCycle = vi.fn()

const mockFrom = vi.fn((table: string) => {
  if (table === 'relationship') {
    return {
      insert: mockInsert,
      delete: mockDelete,
      select: mockSelectForCycle,
    }
  }
  return {}
})

const mockSupabase = { from: mockFrom }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  mockSelectForCycle.mockReturnValue({ data: [], error: null })
})

describe('createRelationship', () => {
  it('inserts a UNION relationship without cycle check', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'rel-001' }, error: null })

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'p1')
    form.set('person_b_id', 'p2')
    form.set('type', 'UNION')

    const result = await createRelationship(form)
    expect(result).toEqual({ id: 'rel-001' })
    expect(hasAncestorCycle).not.toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('inserts a PARENT_CHILD relationship when no cycle', async () => {
    vi.mocked(hasAncestorCycle).mockReturnValue(false)
    mockSingle.mockResolvedValue({ data: { id: 'rel-002' }, error: null })

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'parent')
    form.set('person_b_id', 'child')
    form.set('type', 'PARENT_CHILD')

    const result = await createRelationship(form)
    expect(result).toEqual({ id: 'rel-002' })
    expect(hasAncestorCycle).toHaveBeenCalledWith('child', 'parent', [])
  })

  it('returns error when PARENT_CHILD would create a cycle', async () => {
    vi.mocked(hasAncestorCycle).mockReturnValue(true)

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'child')
    form.set('person_b_id', 'parent')
    form.set('type', 'PARENT_CHILD')

    const result = await createRelationship(form)
    expect(result).toEqual({ error: "Cette relation créerait un cycle dans l'arbre généalogique." })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns error when ADOPTION would create a cycle', async () => {
    vi.mocked(hasAncestorCycle).mockReturnValue(true)

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'child')
    form.set('person_b_id', 'parent')
    form.set('type', 'ADOPTION')

    const result = await createRelationship(form)
    expect(result).toEqual({ error: "Cette relation créerait un cycle dans l'arbre généalogique." })
  })

  it('returns error when insert fails', async () => {
    vi.mocked(hasAncestorCycle).mockReturnValue(false)
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'p1')
    form.set('person_b_id', 'p2')
    form.set('type', 'SIBLING')

    const result = await createRelationship(form)
    expect(result).toEqual({ error: 'Insert failed' })
  })

  it('parses metadata JSON when provided', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'rel-003' }, error: null })

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'p1')
    form.set('person_b_id', 'p2')
    form.set('type', 'UNION')
    form.set('metadata', JSON.stringify({ date_debut: '2000-06-01' }))

    await createRelationship(form)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { date_debut: '2000-06-01' } })
    )
  })
})

describe('deleteRelationship', () => {
  it('deletes a relationship by id', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: null })

    const { deleteRelationship } = await import('../relationships')
    const result = await deleteRelationship('rel-001')
    expect(result).toEqual({})
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'rel-001')
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when delete fails', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: { message: 'Not found' } } as any)

    const { deleteRelationship } = await import('../relationships')
    const result = await deleteRelationship('rel-999')
    expect(result).toEqual({ error: 'Not found' })
  })
})
