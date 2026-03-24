import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

import { useTree } from '@/lib/context/tree-context'
import { CosmosView } from '../CosmosView'
import type { Person, Relationship } from '@/lib/types/database'

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

const mockPerson = (id: string, prenom: string, nom: string, opts: Partial<Person> = {}): Person => ({
  id, prenom, nom,
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
  ...opts,
})

const mockRel = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD', role?: string): Relationship => ({
  id: `${a}-${b}`, person_a_id: a, person_b_id: b, type,
  metadata: role ? { role } : {},
})

const baseTree = {
  branches: [], personBranches: [], currentRole: 'ADMIN' as const,
  openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
  showFamily: true, setShowFamily: vi.fn(),
  showExtendedFamily: true, setShowExtendedFamily: vi.fn(),
}

beforeEach(() => { vi.clearAllMocks() })

describe('CosmosView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [], relationships: [], filteredRelationships: [],
      selectedPersonId: null, selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('shows add-person button when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [], relationships: [], filteredRelationships: [],
      selectedPersonId: null, selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByRole('button', { name: /ajouter une personne/i })).toBeTruthy()
  })

  it('renders SVG when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [], filteredRelationships: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    const { container } = render(<CosmosView />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders center person first name in SVG', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [], filteredRelationships: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText('Jean')).toBeTruthy()
  })

  it('auto-selects first person when selectedPersonId is null', () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [], filteredRelationships: [],
      selectedPersonId: null, selectPerson,
    })
    render(<CosmosView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })

  it('renders the branch color toggle', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [], filteredRelationships: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByTestId('branch-toggle')).toBeTruthy()
    expect(screen.getByText(/couleurs de branches/i)).toBeTruthy()
  })

  it('shows orphan count badge for unconnected persons', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont'), mockPerson('p2', 'Marie', 'Martin')],
      relationships: [], filteredRelationships: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText(/1 non connecté/i)).toBeTruthy()
  })

  it('renders shadow line for connected non-center persons', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont'), mockPerson('p2', 'Marie', 'Martin')],
      relationships: [mockRel('p2', 'p1', 'PARENT_CHILD', 'père')],
      filteredRelationships: [mockRel('p2', 'p1', 'PARENT_CHILD', 'père')],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    const { container } = render(<CosmosView />)
    expect(container.querySelector('.shadow-line')).toBeTruthy()
  })
})
