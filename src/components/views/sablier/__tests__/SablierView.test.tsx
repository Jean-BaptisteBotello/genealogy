import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))
vi.mock('reactflow', () => ({
  default: ({ nodes }: { nodes: { id: string }[] }) => (
    <div data-testid="react-flow">
      {nodes.map(n => <div key={n.id} data-testid={`rf-node-${n.id}`} />)}
    </div>
  ),
  Background: () => null,
  Controls: () => null,
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom' },
}))

import { useTree } from '@/lib/context/tree-context'
import { SablierView } from '../SablierView'
import type { Person, Relationship } from '@/lib/types/database'

const mkPerson = (id: string): Person => ({
  id, prenom: 'A', nom: 'B',
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

const mkRel = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD'): Relationship => ({
  id: `${a}-${b}`, person_a_id: a, person_b_id: b, type, metadata: {},
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SablierView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<SablierView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('renders React Flow when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1')],
      relationships: [],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<SablierView />)
    expect(screen.getByTestId('react-flow')).toBeTruthy()
  })

  it('creates a React Flow node for each reachable person', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1'), mkPerson('p2')],
      relationships: [mkRel('p1', 'p2')],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<SablierView />)
    expect(screen.getByTestId('rf-node-p1')).toBeTruthy()
    expect(screen.getByTestId('rf-node-p2')).toBeTruthy()
  })

  it('shows orphan badge when there are unconnected persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1'), mkPerson('p2'), mkPerson('p3')],
      relationships: [mkRel('p1', 'p2')],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<SablierView />)
    expect(screen.getByText(/1 non connecté/i)).toBeTruthy()
  })

  it('auto-selects first person when selectedPersonId is null', () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1')],
      relationships: [],
      branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
    })
    render(<SablierView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })
})
