// src/components/suggestions/__tests__/SuggestionsPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/server-actions/suggestions', () => ({
  approveSuggestion: vi.fn(),
  rejectSuggestion: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { approveSuggestion, rejectSuggestion } from '@/server-actions/suggestions'
import { SuggestionsPanel } from '../SuggestionsPanel'
import type { SuggestionWithProposer } from '@/lib/types/database'

const mockSuggestion: SuggestionWithProposer = {
  id: 's1',
  type: 'EDIT_PERSON',
  target_id: 'p1',
  payload: { prenom: 'Marie' },
  status: 'PENDING',
  suggested_by: 'u1',
  reviewed_by: null,
  rejection_reason: null,
  created_at: '2026-03-23T10:00:00Z',
  reviewed_at: null,
  users: { email: 'alice@example.com', display_name: 'alice' },
}

beforeEach(() => { vi.clearAllMocks() })

describe('SuggestionsPanel', () => {
  it('renders title and suggestion list', () => {
    render(<SuggestionsPanel suggestions={[mockSuggestion]} onClose={vi.fn()} />)
    expect(screen.getByText(/suggestions en attente/i)).toBeTruthy()
    expect(screen.getByText('alice@example.com')).toBeTruthy()
  })

  it('shows empty state when no suggestions', () => {
    render(<SuggestionsPanel suggestions={[]} onClose={vi.fn()} />)
    expect(screen.getByText(/aucune suggestion/i)).toBeTruthy()
  })

  it('calls approveSuggestion on click', async () => {
    vi.mocked(approveSuggestion).mockResolvedValue({})
    render(<SuggestionsPanel suggestions={[mockSuggestion]} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /approuver/i }))
    await waitFor(() => expect(approveSuggestion).toHaveBeenCalledWith('s1'))
  })

  it('shows rejection form and calls rejectSuggestion', async () => {
    vi.mocked(rejectSuggestion).mockResolvedValue({})
    render(<SuggestionsPanel suggestions={[mockSuggestion]} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /rejeter/i }))
    const textarea = screen.getByPlaceholderText(/raison/i)
    fireEvent.change(textarea, { target: { value: 'Données incorrectes' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmer le rejet/i }))
    await waitFor(() => expect(rejectSuggestion).toHaveBeenCalledWith('s1', 'Données incorrectes'))
  })

  it('calls onClose on close button', () => {
    const onClose = vi.fn()
    render(<SuggestionsPanel suggestions={[]} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
