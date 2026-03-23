// src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/server-actions/suggestions', () => ({
  getMySuggestions: vi.fn(),
  cancelSuggestion: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { getMySuggestions, cancelSuggestion } from '@/server-actions/suggestions'
import { MySuggestionsPanel } from '../MySuggestionsPanel'
import type { SuggestionWithProposer } from '@/lib/types/database'

const mockPending: SuggestionWithProposer = {
  id: 's1', type: 'EDIT_PERSON', target_id: 'p1',
  payload: { prenom: 'Marie' }, status: 'PENDING',
  suggested_by: 'u1', reviewed_by: null, rejection_reason: null,
  created_at: '2026-03-23T10:00:00Z', reviewed_at: null, users: null,
}

const mockRejected: SuggestionWithProposer = {
  ...mockPending, id: 's2', status: 'REJECTED', rejection_reason: 'Données incorrectes',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getMySuggestions).mockResolvedValue([mockPending, mockRejected])
})

describe('MySuggestionsPanel', () => {
  it('loads and displays suggestions', async () => {
    render(<MySuggestionsPanel onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('PENDING')).toBeTruthy())
    expect(screen.getByText('REJECTED')).toBeTruthy()
  })

  it('shows rejection reason for REJECTED suggestions', async () => {
    render(<MySuggestionsPanel onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Données incorrectes')).toBeTruthy())
  })

  it('shows cancel button for PENDING suggestions', async () => {
    render(<MySuggestionsPanel onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('button', { name: /annuler/i })).toBeTruthy())
  })

  it('calls cancelSuggestion on cancel click', async () => {
    vi.mocked(cancelSuggestion).mockResolvedValue({})
    render(<MySuggestionsPanel onClose={vi.fn()} />)
    await waitFor(() => screen.getByRole('button', { name: /annuler/i }))
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    await waitFor(() => expect(cancelSuggestion).toHaveBeenCalledWith('s1'))
  })

  it('calls onClose on close button', async () => {
    const onClose = vi.fn()
    render(<MySuggestionsPanel onClose={onClose} />)
    await waitFor(() => screen.getByRole('button', { name: /fermer/i }))
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
