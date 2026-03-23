import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

import { useTree } from '@/lib/context/tree-context'
import { CosmosView } from '../CosmosView'
import type { Person, Relationship } from '@/lib/types/database'

const mockPerson = (id: string, prenom: string, nom: string): Person => ({
  id, prenom, nom,
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

const mockRel = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD'): Relationship => ({
  id: `${a}-${b}`, person_a_id: a, person_b_id: b, type, metadata: {},
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CosmosView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<CosmosView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('shows add-person button when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<CosmosView />)
    expect(screen.getByRole('button', { name: /ajouter une personne/i })).toBeTruthy()
  })

  it('renders SVG canvas when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    const { container } = render(<CosmosView />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders initials for each connected person', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mockRel('p1', 'p2')],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<CosmosView />)
    expect(screen.getByText('JD')).toBeTruthy()
    expect(screen.getByText('MM')).toBeTruthy()
  })

  it('calls selectPerson when a node is clicked', () => {
    const selectPerson = vi.fn()
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mockRel('p1', 'p2')],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<CosmosView />)
    fireEvent.click(screen.getByText('MM'))
    expect(selectPerson).toHaveBeenCalledWith('p2')
  })

  it('auto-selects first person when selectedPersonId is null', () => {
    const selectPerson = vi.fn()
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1],
      relationships: [],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<CosmosView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })

  it('renders edges for relationships between visible nodes', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mockRel('p1', 'p2')],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    const { container } = render(<CosmosView />)
    expect(container.querySelector('path')).toBeTruthy()
  })

  it('shows orphan count badge for unconnected persons', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<CosmosView />)
    expect(screen.getByText(/1 non connecté/i)).toBeTruthy()
  })

  it('uses branch color for node fill when person is in a branch', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1],
      relationships: [],
      branches: [{ id: 'b1', nom: 'A', couleur: '#ff0000', description: null, created_by: 'u1', created_at: '2024-01-01' }],
      personBranches: [{ person_id: 'p1', branch_id: 'b1' }],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    const { container } = render(<CosmosView />)
    const circles = container.querySelectorAll('circle')
    const hasBranchColor = Array.from(circles).some(c => c.getAttribute('fill') === '#ff0000')
    expect(hasBranchColor).toBe(true)
  })
})
