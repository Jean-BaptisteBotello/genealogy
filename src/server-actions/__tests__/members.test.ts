import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Supabase regular client mocks ──────────────────────────────────────
const mockMembersSingle = vi.fn()
const mockMembersSelectEq = vi.fn(() => ({ single: mockMembersSingle }))
const mockMembersSelect = vi.fn(() => ({ eq: mockMembersSelectEq }))

const mockUpdateRoleEq = vi.fn(() => ({ error: null }))
const mockUpdateRole = vi.fn(() => ({ eq: mockUpdateRoleEq }))

const mockDeleteMemberEq = vi.fn(() => ({ error: null }))
const mockDeleteMember = vi.fn(() => ({ eq: mockDeleteMemberEq }))

const mockInsertMember = vi.fn(() => ({ error: null }))
const mockUpsertUser = vi.fn(() => ({ error: null }))

const mockFrom = vi.fn((table: string) => {
  if (table === 'tree_member') {
    return {
      select: mockMembersSelect,
      update: mockUpdateRole,
      delete: mockDeleteMember,
      insert: mockInsertMember,
    }
  }
  if (table === 'users') {
    return { upsert: mockUpsertUser }
  }
  return {}
})

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } })
const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }

// ── Supabase admin client mocks ────────────────────────────────────────
const mockInvite = vi.fn()
const mockAdminClient = {
  auth: { admin: { inviteUserByEmail: mockInvite } },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as any)
})

describe('getMembers', () => {
  it('returns list of members with user info', async () => {
    mockMembersSelect.mockReturnValueOnce({
      data: [
        { user_id: 'u1', role: 'EDITOR', invited_at: '2026-01-01', invited_by: 'admin-1', users: { email: 'a@b.com', display_name: 'Alice' } },
      ],
      error: null,
    })

    const { getMembers } = await import('../members')
    const result = await getMembers()
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('EDITOR')
  })

  it('returns empty array on error', async () => {
    mockMembersSelect.mockReturnValueOnce({ data: null, error: { message: 'DB error' } })
    const { getMembers } = await import('../members')
    const result = await getMembers()
    expect(result).toEqual([])
  })
})

describe('inviteMember', () => {
  it('invites user and creates tree_member row', async () => {
    mockInvite.mockResolvedValue({
      data: { user: { id: 'new-user-1' } },
      error: null,
    })

    const { inviteMember } = await import('../members')
    const result = await inviteMember('alice@example.com', 'EDITOR')
    expect(result).toEqual({})
    expect(mockInvite).toHaveBeenCalledWith('alice@example.com', expect.objectContaining({ data: { role: 'EDITOR' } }))
    expect(mockInsertMember).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'new-user-1', role: 'EDITOR', invited_by: 'admin-1' })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { inviteMember } = await import('../members')
    const result = await inviteMember('alice@example.com', 'EDITOR')
    expect(result).toEqual({ error: 'Non authentifié.' })
    expect(mockInvite).not.toHaveBeenCalled()
  })

  it('returns error when invite API fails', async () => {
    mockInvite.mockResolvedValue({ data: { user: null }, error: { message: 'Email already registered' } })
    const { inviteMember } = await import('../members')
    const result = await inviteMember('existing@example.com', 'EDITOR')
    expect(result).toEqual({ error: 'Email already registered' })
  })
})

describe('updateMemberRole', () => {
  it('updates the role and revalidates', async () => {
    const { updateMemberRole } = await import('../members')
    const result = await updateMemberRole('u1', 'VIEWER')
    expect(result).toEqual({})
    expect(mockUpdateRole).toHaveBeenCalledWith({ role: 'VIEWER' })
    expect(mockUpdateRoleEq).toHaveBeenCalledWith('user_id', 'u1')
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error on DB failure', async () => {
    mockUpdateRoleEq.mockReturnValueOnce({ error: { message: 'Not found' } })
    const { updateMemberRole } = await import('../members')
    const result = await updateMemberRole('u999', 'VIEWER')
    expect(result).toEqual({ error: 'Not found' })
  })
})

describe('removeMember', () => {
  it('deletes the member and revalidates', async () => {
    const { removeMember } = await import('../members')
    const result = await removeMember('u1')
    expect(result).toEqual({})
    expect(mockDeleteMember).toHaveBeenCalled()
    expect(mockDeleteMemberEq).toHaveBeenCalledWith('user_id', 'u1')
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error on DB failure', async () => {
    mockDeleteMemberEq.mockReturnValueOnce({ error: { message: 'Constraint violation' } })
    const { removeMember } = await import('../members')
    const result = await removeMember('u1')
    expect(result).toEqual({ error: 'Constraint violation' })
  })
})
