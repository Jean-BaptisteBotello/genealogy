import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

import { useTree } from '@/lib/context/tree-context'
import { EventailView } from '../EventailView'
import type { Person, Relationship } from '@/lib/types/database'

const mkPerson = (id: string, prenom: string, nom: string): Person => ({
  id, prenom, nom,
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

// person_a_id = parent, person_b_id = child
const mkRel = (parentId: string, childId: string): Relationship => ({
  id: `${parentId}-${childId}`,
  person_a_id: parentId, person_b_id: childId,
  type: 'PARENT_CHILD', metadata: {},
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EventailView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<EventailView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('renders an SVG when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    const { container } = render(<EventailView />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('shows initials of center person', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<EventailView />)
    expect(screen.getByText('JD')).toBeTruthy()
  })

  it('shows initials of ancestors', () => {
    const p1 = mkPerson('p1', 'Jean', 'Dupont')
    const p2 = mkPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mkRel('p2', 'p1')], // p2 is parent of p1
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<EventailView />)
    expect(screen.getByText('JD')).toBeTruthy()
    expect(screen.getByText('MM')).toBeTruthy()
  })

  it('auto-selects first person when selectedPersonId is null', () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<EventailView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })

  it('calls selectPerson when an ancestor label is clicked', () => {
    const selectPerson = vi.fn()
    const p1 = mkPerson('p1', 'Jean', 'Dupont')
    const p2 = mkPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mkRel('p2', 'p1')], // p2 is parent of p1
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<EventailView />)
    screen.getByText('MM').click()
    expect(selectPerson).toHaveBeenCalledWith('p2')
  })
})
