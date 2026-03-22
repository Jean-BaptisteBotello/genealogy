import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockUpdateEq = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockDeleteEq = vi.fn()
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockInsertJunction = vi.fn()
const mockDeleteJunctionEq = vi.fn()
const mockDeleteJunction = vi.fn(() => ({ eq: mockDeleteJunctionEq }))

const mockFrom = vi.fn((table: string) => {
  if (table === 'person_branch') {
    return { insert: mockInsertJunction, delete: mockDeleteJunction }
  }
  return { insert: mockInsert, update: mockUpdate, delete: mockDelete }
})

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
})

describe('createBranch', () => {
  it('inserts a branch and returns its id', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'branch-1' }, error: null })

    const { createBranch } = await import('../branches')
    const form = new FormData()
    form.set('nom', 'Côté Maternel')
    form.set('couleur', '#3b82f6')

    const result = await createBranch(form)
    expect(result).toEqual({ id: 'branch-1' })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ nom: 'Côté Maternel', couleur: '#3b82f6', created_by: 'user-1' })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const { createBranch } = await import('../branches')
    const form = new FormData()
    form.set('nom', 'Test')
    form.set('couleur', '#ff0000')

    const result = await createBranch(form)
    expect(result).toEqual({ error: 'Non authentifié.' })
  })

  it('returns error when insert fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const { createBranch } = await import('../branches')
    const form = new FormData()
    form.set('nom', 'Test')
    form.set('couleur', '#ff0000')

    const result = await createBranch(form)
    expect(result).toEqual({ error: 'DB error' })
  })
})

describe('updateBranch', () => {
  it('updates a branch and returns its id', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'branch-1' }, error: null })

    const { updateBranch } = await import('../branches')
    const form = new FormData()
    form.set('id', 'branch-1')
    form.set('nom', 'Nouveau Nom')
    form.set('couleur', '#ef4444')

    const result = await updateBranch(form)
    expect(result).toEqual({ id: 'branch-1' })
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when update fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const { updateBranch } = await import('../branches')
    const form = new FormData()
    form.set('id', 'branch-999')
    form.set('nom', 'X')
    form.set('couleur', '#000')

    const result = await updateBranch(form)
    expect(result).toEqual({ error: 'Not found' })
  })
})

describe('deleteBranch', () => {
  it('deletes a branch by id', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: null })

    const { deleteBranch } = await import('../branches')
    const result = await deleteBranch('branch-1')
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when delete fails', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: { message: 'Constraint violation' } })

    const { deleteBranch } = await import('../branches')
    const result = await deleteBranch('branch-1')
    expect(result).toEqual({ error: 'Constraint violation' })
  })
})

describe('assignPersonToBranch', () => {
  it('inserts a person_branch row', async () => {
    mockInsertJunction.mockReturnValue({ error: null })

    const { assignPersonToBranch } = await import('../branches')
    const result = await assignPersonToBranch('person-1', 'branch-1')
    expect(result).toEqual({})
    expect(mockInsertJunction).toHaveBeenCalledWith({
      person_id: 'person-1',
      branch_id: 'branch-1',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when insert fails', async () => {
    mockInsertJunction.mockReturnValue({ error: { message: 'Already assigned' } })

    const { assignPersonToBranch } = await import('../branches')
    const result = await assignPersonToBranch('person-1', 'branch-1')
    expect(result).toEqual({ error: 'Already assigned' })
  })
})

describe('removePersonFromBranch', () => {
  it('deletes the person_branch row', async () => {
    const mockSecondEq = vi.fn(() => ({ error: null }))
    mockDeleteJunctionEq.mockReturnValue({ eq: mockSecondEq })

    const { removePersonFromBranch } = await import('../branches')
    const result = await removePersonFromBranch('person-1', 'branch-1')
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })
})
