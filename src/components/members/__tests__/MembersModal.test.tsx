import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/server-actions/members', () => ({
  inviteMember: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

import { inviteMember, updateMemberRole, removeMember } from '@/server-actions/members'
import { MembersModal } from '../MembersModal'
import type { MemberWithUser } from '@/server-actions/members'

const mockMember: MemberWithUser = {
  user_id: 'u1',
  role: 'EDITOR',
  invited_at: '2026-01-01T00:00:00Z',
  invited_by: 'admin-1',
  users: { email: 'alice@example.com', display_name: 'alice' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MembersModal', () => {
  it('renders the modal title', () => {
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={vi.fn()} />)
    expect(screen.getByText(/gérer les accès/i)).toBeTruthy()
  })

  it('lists members with their email and role', () => {
    render(<MembersModal members={[mockMember]} currentRole="ADMIN" onClose={vi.fn()} />)
    expect(screen.getByText('alice@example.com')).toBeTruthy()
    expect(screen.getByText('EDITOR')).toBeTruthy()
  })

  it('shows invite form for ADMIN', () => {
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText(/email/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /inviter/i })).toBeTruthy()
  })

  it('hides invite form for non-ADMIN', () => {
    render(<MembersModal members={[]} currentRole="EDITOR" onClose={vi.fn()} />)
    expect(screen.queryByPlaceholderText(/email/i)).toBeNull()
  })

  it('calls inviteMember with email and role on form submit', async () => {
    vi.mocked(inviteMember).mockResolvedValue({})
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'bob@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /inviter/i }))

    await waitFor(() => {
      expect(inviteMember).toHaveBeenCalledWith('bob@example.com', expect.any(String))
    })
  })

  it('shows error message when inviteMember fails', async () => {
    vi.mocked(inviteMember).mockResolvedValue({ error: 'Email déjà enregistré' })
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'bob@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /inviter/i }))

    await waitFor(() => {
      expect(screen.getByText('Email déjà enregistré')).toBeTruthy()
    })
  })

  it('calls removeMember when remove button clicked', async () => {
    vi.mocked(removeMember).mockResolvedValue({})
    render(<MembersModal members={[mockMember]} currentRole="ADMIN" onClose={vi.fn()} />)

    fireEvent.click(screen.getByTitle(/supprimer/i))
    await waitFor(() => {
      expect(removeMember).toHaveBeenCalledWith('u1')
    })
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
