// src/server-actions/__tests__/suggestions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/role-guard', () => ({ getCurrentRole: vi.fn() }))
vi.mock('@/lib/geocode', () => ({ geocodeLieu: vi.fn().mockResolvedValue(null) }))
vi.mock('@/lib/validation/suggestions', () => ({
  parsePayload: vi.fn().mockReturnValue({ ok: true, data: { prenom: 'Marie' } }),
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentRole } from '@/lib/auth/role-guard'
import { parsePayload } from '@/lib/validation/suggestions'

// ── Suggestion table mocks ───────────────────────────────────────────────
const mockSuggestionSingle = vi.fn()
const mockSuggestionOrder = vi.fn()
const mockSuggestionInsert = vi.fn()
const mockSuggestionUpdateFinalEq = vi.fn()
const mockSuggestionUpdateEq1 = vi.fn(() => ({ eq: mockSuggestionUpdateFinalEq }))
const mockSuggestionUpdate = vi.fn(() => ({ eq: mockSuggestionUpdateEq1 }))
const mockSuggestionDeleteFinalEq = vi.fn()
const mockSuggestionDeleteEq2 = vi.fn(() => ({ eq: mockSuggestionDeleteFinalEq }))
const mockSuggestionDeleteEq1 = vi.fn(() => ({ eq: mockSuggestionDeleteEq2 }))
const mockSuggestionDelete = vi.fn(() => ({ eq: mockSuggestionDeleteEq1 }))

// select chain: .select() → .eq(1) → .eq(2) → .eq(3) → .single()
//                                   .eq(1) → .order()
const mockSuggestionSelectEq3 = vi.fn(() => ({ single: mockSuggestionSingle }))
const mockSuggestionSelectEq2 = vi.fn(() => ({
  eq: mockSuggestionSelectEq3,
  single: mockSuggestionSingle,
}))
const mockSuggestionSelectEq1 = vi.fn(() => ({
  eq: mockSuggestionSelectEq2,
  order: mockSuggestionOrder,
  single: mockSuggestionSingle,
}))
const mockSuggestionSelect = vi.fn(() => ({ eq: mockSuggestionSelectEq1 }))

// ── Person table mocks ───────────────────────────────────────────────────
const mockPersonUpdateFinalEq = vi.fn()
const mockPersonUpdate = vi.fn(() => ({ eq: mockPersonUpdateFinalEq }))
const mockPersonInsert = vi.fn()
const mockPersonDeleteFinalEq = vi.fn()
const mockPersonDelete = vi.fn(() => ({ eq: mockPersonDeleteFinalEq }))

// ── Relationship table mocks ─────────────────────────────────────────────
const mockRelInsert = vi.fn()
const mockRelDeleteFinalEq = vi.fn()
const mockRelDelete = vi.fn(() => ({ eq: mockRelDeleteFinalEq }))

// ── Supabase client ──────────────────────────────────────────────────────
const mockFrom = vi.fn((table: string) => {
  if (table === 'suggestion') return {
    select: mockSuggestionSelect,
    insert: mockSuggestionInsert,
    update: mockSuggestionUpdate,
    delete: mockSuggestionDelete,
  }
  if (table === 'person') return {
    insert: mockPersonInsert,
    update: mockPersonUpdate,
    delete: mockPersonDelete,
  }
  if (table === 'relationship') return {
    insert: mockRelInsert,
    delete: mockRelDelete,
  }
  return {}
})

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } })
const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  vi.mocked(getCurrentRole).mockResolvedValue('ADMIN')
  mockSuggestionSingle.mockResolvedValue({ data: null, error: null })
  mockSuggestionOrder.mockResolvedValue({ data: [], error: null })
  mockSuggestionInsert.mockResolvedValue({ error: null })
  mockSuggestionUpdateEq1.mockReturnValue({ eq: mockSuggestionUpdateFinalEq })
  mockSuggestionUpdateFinalEq.mockResolvedValue({ error: null })
  mockSuggestionDeleteFinalEq.mockResolvedValue({ error: null })
  mockPersonUpdateFinalEq.mockResolvedValue({ error: null })
  mockPersonInsert.mockResolvedValue({ error: null })
  mockPersonDeleteFinalEq.mockResolvedValue({ error: null })
  mockRelInsert.mockResolvedValue({ error: null })
  mockRelDeleteFinalEq.mockResolvedValue({ error: null })
})

// ── createSuggestion ─────────────────────────────────────────────────────
describe('createSuggestion', () => {
  it('creates a suggestion and revalidates', async () => {
    const { createSuggestion } = await import('../suggestions')
    const result = await createSuggestion('EDIT_PERSON', { prenom: 'Marie' }, 'person-1')
    expect(result).toEqual({})
    expect(mockSuggestionInsert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'EDIT_PERSON', target_id: 'person-1', suggested_by: 'admin-1' })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { createSuggestion } = await import('../suggestions')
    const result = await createSuggestion('EDIT_PERSON', { prenom: 'Marie' }, 'p1')
    expect(result).toEqual({ error: 'Non authentifié.' })
  })

  it('returns error on DB insert failure', async () => {
    mockSuggestionInsert.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const { createSuggestion } = await import('../suggestions')
    const result = await createSuggestion('EDIT_PERSON', { prenom: 'Marie' }, 'p1')
    expect(result).toEqual({ error: 'DB error' })
  })

  it('rejects duplicate ADD_PERSON suggestion', async () => {
    mockSuggestionSingle.mockResolvedValueOnce({ data: { id: 'existing' }, error: null })
    const { createSuggestion } = await import('../suggestions')
    const result = await createSuggestion('ADD_PERSON', { prenom: 'Jean', nom: 'Dupont' })
    expect(result.error).toBeTruthy()
    expect(mockSuggestionInsert).not.toHaveBeenCalled()
  })
})

// ── getSuggestionsPending ────────────────────────────────────────────────
describe('getSuggestionsPending', () => {
  it('returns pending suggestions', async () => {
    mockSuggestionOrder.mockResolvedValueOnce({
      data: [{ id: 's1', type: 'EDIT_PERSON', status: 'PENDING', users: { email: 'a@b.com', display_name: 'Alice' } }],
      error: null,
    })
    const { getSuggestionsPending } = await import('../suggestions')
    const result = await getSuggestionsPending()
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('PENDING')
  })

  it('returns empty array on error', async () => {
    mockSuggestionOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const { getSuggestionsPending } = await import('../suggestions')
    const result = await getSuggestionsPending()
    expect(result).toEqual([])
  })
})

// ── getMySuggestions ─────────────────────────────────────────────────────
describe('getMySuggestions', () => {
  it('returns suggestions for current user', async () => {
    mockSuggestionOrder.mockResolvedValueOnce({
      data: [{ id: 's1', type: 'EDIT_PERSON', status: 'PENDING', suggested_by: 'admin-1', users: null }],
      error: null,
    })
    const { getMySuggestions } = await import('../suggestions')
    const result = await getMySuggestions()
    expect(result).toHaveLength(1)
  })

  it('returns empty array when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { getMySuggestions } = await import('../suggestions')
    const result = await getMySuggestions()
    expect(result).toEqual([])
  })
})

// ── rejectSuggestion ─────────────────────────────────────────────────────
describe('rejectSuggestion', () => {
  it('rejects a suggestion with reason', async () => {
    const { rejectSuggestion } = await import('../suggestions')
    const result = await rejectSuggestion('s1', 'Données incorrectes')
    expect(result).toEqual({})
    expect(mockSuggestionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'REJECTED',
        rejection_reason: 'Données incorrectes',
        reviewed_by: 'admin-1',
      })
    )
    // reviewed_at should be a recent ISO string
    const updateCall = (mockSuggestionUpdate.mock.calls as any[][])[0]?.[0]
    expect(typeof updateCall?.reviewed_at).toBe('string')
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error for non-ADMIN/EDITOR', async () => {
    vi.mocked(getCurrentRole).mockResolvedValueOnce('VIEWER')
    const { rejectSuggestion } = await import('../suggestions')
    const result = await rejectSuggestion('s1', 'raison')
    expect(result).toEqual({ error: 'Permission refusée.' })
  })
})

// ── cancelSuggestion ─────────────────────────────────────────────────────
describe('cancelSuggestion', () => {
  it('deletes own pending suggestion', async () => {
    const { cancelSuggestion } = await import('../suggestions')
    const result = await cancelSuggestion('s1')
    expect(result).toEqual({})
    expect(mockSuggestionDelete).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { cancelSuggestion } = await import('../suggestions')
    const result = await cancelSuggestion('s1')
    expect(result).toEqual({ error: 'Non authentifié.' })
  })
})

// ── approveSuggestion ────────────────────────────────────────────────────
describe('approveSuggestion', () => {
  it('approves EDIT_PERSON: updates person and marks APPROVED', async () => {
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's1', type: 'EDIT_PERSON', target_id: 'p1', payload: { prenom: 'Marie' }, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s1')
    expect(result).toEqual({})
    expect(mockPersonUpdate).toHaveBeenCalled()
    expect(mockSuggestionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'APPROVED' })
    )
  })

  it('approves ADD_PERSON: inserts person and marks APPROVED', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: true, data: { prenom: 'Jean', nom: 'Dupont' } })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's2', type: 'ADD_PERSON', target_id: null, payload: { prenom: 'Jean', nom: 'Dupont' }, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s2')
    expect(result).toEqual({})
    expect(mockPersonInsert).toHaveBeenCalled()
  })

  it('approves DELETE_PERSON: deletes person', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: true, data: {} })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's3', type: 'DELETE_PERSON', target_id: 'p1', payload: {}, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s3')
    expect(result).toEqual({})
    expect(mockPersonDelete).toHaveBeenCalled()
  })

  it('approves ADD_RELATIONSHIP', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: true, data: { person_a_id: 'p1', person_b_id: 'p2', type: 'UNION' } })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's4', type: 'ADD_RELATIONSHIP', target_id: null, payload: {}, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s4')
    expect(result).toEqual({})
    expect(mockRelInsert).toHaveBeenCalled()
  })

  it('approves DELETE_RELATIONSHIP', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: true, data: {} })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's5', type: 'DELETE_RELATIONSHIP', target_id: 'r1', payload: {}, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s5')
    expect(result).toEqual({})
    expect(mockRelDelete).toHaveBeenCalled()
  })

  it('returns error when suggestion not found', async () => {
    mockSuggestionSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('missing')
    expect(result.error).toBeTruthy()
    expect(mockPersonUpdate).not.toHaveBeenCalled()
  })

  it('returns error when payload invalid', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: false, error: 'Payload invalide.' })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's1', type: 'EDIT_PERSON', target_id: 'p1', payload: {}, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s1')
    expect(result).toEqual({ error: 'Payload invalide.' })
  })

  it('returns error for non-ADMIN/EDITOR', async () => {
    vi.mocked(getCurrentRole).mockResolvedValueOnce('VIEWER')
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s1')
    expect(result).toEqual({ error: 'Permission refusée.' })
  })

  it('returns error when suggestion is already APPROVED (not PENDING)', async () => {
    // The .eq('status', 'PENDING') filter means already-approved returns not found
    mockSuggestionSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('already-approved')
    expect(result.error).toBeTruthy()
    expect(mockPersonUpdate).not.toHaveBeenCalled()
  })

  it('returns error when business action fails, leaves suggestion PENDING', async () => {
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's1', type: 'EDIT_PERSON', target_id: 'p1', payload: { prenom: 'Marie' }, status: 'PENDING' },
      error: null,
    })
    mockPersonUpdateFinalEq.mockResolvedValueOnce({ error: { message: 'Person not found' } })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s1')
    expect(result).toEqual({ error: 'Person not found' })
    // Suggestion NOT marked APPROVED
    expect(mockSuggestionUpdate).not.toHaveBeenCalled()
  })
})
