import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({
  useTree: vi.fn(),
}))

import { useTree } from '@/lib/context/tree-context'

const mockPerson = {
  id: 'p1', prenom: 'Pierre', nom: 'Dupont',
  date_naissance: '1990-01-01', date_deces: null,
  lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '', updated_at: '',
}

describe('SablierFlowView', () => {
  it('shows empty state when no persons', async () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [],
      relationships: [],
      filteredRelationships: [],
      selectedPersonId: null,
      selectPerson: vi.fn(),
      openAddPerson: vi.fn(),
    } as never)

    const { SablierFlowView } = await import('../sablier/SablierFlowView')
    render(<SablierFlowView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('renders person cards when data exists', async () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mockPerson],
      relationships: [],
      filteredRelationships: [],
      selectedPersonId: 'p1',
      selectPerson: vi.fn(),
      openAddPerson: vi.fn(),
    } as never)

    const { SablierFlowView } = await import('../sablier/SablierFlowView')
    render(<SablierFlowView />)
    expect(screen.getByText(/Pierre Dupont/)).toBeTruthy()
  })

  it('auto-selects first person when none selected', async () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      persons: [mockPerson],
      relationships: [],
      filteredRelationships: [],
      selectedPersonId: null,
      selectPerson,
      openAddPerson: vi.fn(),
    } as never)

    const { SablierFlowView } = await import('../sablier/SablierFlowView')
    render(<SablierFlowView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })
})
