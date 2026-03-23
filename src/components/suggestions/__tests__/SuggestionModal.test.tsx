// src/components/suggestions/__tests__/SuggestionModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/server-actions/suggestions', () => ({ createSuggestion: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { createSuggestion } from '@/server-actions/suggestions'
import { SuggestionModal } from '../SuggestionModal'
import type { Person, Relationship } from '@/lib/types/database'

const mockPerson: Person = {
  id: 'p1', prenom: 'Jean', nom: 'Dupont',
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '', updated_at: '',
}

const mockPerson2: Person = {
  id: 'p2', prenom: 'Alice', nom: 'Martin',
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '', updated_at: '',
}

const mockRel: Relationship = {
  id: 'r1', person_a_id: 'p1', person_b_id: 'p2', type: 'UNION', metadata: {},
}

beforeEach(() => { vi.clearAllMocks() })

describe('SuggestionModal — EDIT_PERSON', () => {
  it('renders with pre-filled fields', () => {
    render(<SuggestionModal mode={{ type: 'EDIT_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Jean')).toBeTruthy()
    expect(screen.getByDisplayValue('Dupont')).toBeTruthy()
  })

  it('calls createSuggestion with only modified fields', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(<SuggestionModal mode={{ type: 'EDIT_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('Jean'), { target: { value: 'Marie' } })
    fireEvent.click(screen.getByRole('button', { name: /proposer/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith(
        'EDIT_PERSON',
        expect.objectContaining({ prenom: 'Marie' }),
        'p1'
      )
    })
  })

  it('closes on cancel', () => {
    const onClose = vi.fn()
    render(<SuggestionModal mode={{ type: 'EDIT_PERSON', person: mockPerson }} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('SuggestionModal — ADD_PERSON', () => {
  it('renders empty form', () => {
    render(<SuggestionModal mode={{ type: 'ADD_PERSON' }} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText(/prénom/i)).toBeTruthy()
  })

  it('calls createSuggestion with full payload', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(<SuggestionModal mode={{ type: 'ADD_PERSON' }} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/prénom/i), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText(/^nom$/i), { target: { value: 'Martin' } })
    fireEvent.click(screen.getByRole('button', { name: /proposer/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith(
        'ADD_PERSON',
        expect.objectContaining({ prenom: 'Alice', nom: 'Martin' }),
        undefined
      )
    })
  })
})

describe('SuggestionModal — DELETE_PERSON', () => {
  it('renders confirmation message', () => {
    render(<SuggestionModal mode={{ type: 'DELETE_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    expect(screen.getByText(/Jean Dupont/i)).toBeTruthy()
  })

  it('calls createSuggestion with DELETE_PERSON', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(<SuggestionModal mode={{ type: 'DELETE_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /proposer la suppression/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith('DELETE_PERSON', {}, 'p1')
    })
  })
})

describe('SuggestionModal — DELETE_RELATIONSHIP', () => {
  it('renders confirmation', () => {
    render(
      <SuggestionModal
        mode={{ type: 'DELETE_RELATIONSHIP', relationship: mockRel, persons: [mockPerson] }}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(/supprimer cette relation/i)).toBeTruthy()
  })

  it('calls createSuggestion with DELETE_RELATIONSHIP', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(
      <SuggestionModal
        mode={{ type: 'DELETE_RELATIONSHIP', relationship: mockRel, persons: [mockPerson] }}
        onClose={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /proposer la suppression/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith('DELETE_RELATIONSHIP', {}, 'r1')
    })
  })
})

describe('SuggestionModal — ADD_RELATIONSHIP', () => {
  it('renders person selects', () => {
    render(
      <SuggestionModal
        mode={{ type: 'ADD_RELATIONSHIP', persons: [mockPerson, mockPerson2] }}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(/Parent \/ Personne A/i)).toBeTruthy()
    expect(screen.getByText(/Enfant \/ Personne B/i)).toBeTruthy()
  })

  it('calls createSuggestion with ADD_RELATIONSHIP payload', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(
      <SuggestionModal
        mode={{ type: 'ADD_RELATIONSHIP', persons: [mockPerson, mockPerson2] }}
        onClose={vi.fn()}
      />
    )
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'p1' } })
    fireEvent.change(selects[1], { target: { value: 'p2' } })
    fireEvent.click(screen.getByRole('button', { name: /^proposer$/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith(
        'ADD_RELATIONSHIP',
        expect.objectContaining({ type: 'UNION', person_a_id: 'p1', person_b_id: 'p2' })
      )
    })
  })

  it('shows error when same person selected for A and B', async () => {
    render(
      <SuggestionModal
        mode={{ type: 'ADD_RELATIONSHIP', persons: [mockPerson, mockPerson2] }}
        onClose={vi.fn()}
      />
    )
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'p1' } })
    fireEvent.change(selects[1], { target: { value: 'p1' } })
    fireEvent.click(screen.getByRole('button', { name: /^proposer$/i }))
    await waitFor(() => {
      expect(screen.getByText(/Les deux personnes doivent être différentes/i)).toBeTruthy()
    })
  })
})

describe('SuggestionModal — error handling', () => {
  it('shows error when createSuggestion fails', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({ error: 'Doublon détecté' })
    render(<SuggestionModal mode={{ type: 'DELETE_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /proposer la suppression/i }))
    await waitFor(() => {
      expect(screen.getByText('Doublon détecté')).toBeTruthy()
    })
  })
})
