import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

import { useTree } from '@/lib/context/tree-context'
import { TimelineView } from '../TimelineView'
import type { Person } from '@/lib/types/database'

const mkPerson = (id: string, prenom: string, nom: string, date_naissance: string | null = null): Person => ({
  id, prenom, nom, date_naissance,
  lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TimelineView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<TimelineView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('renders cards when persons with dates exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont', '1920-01-01')],
      relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<TimelineView />)
    expect(screen.getByText('Jean Dupont')).toBeTruthy()
  })

  it('shows person name on the timeline', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont', '1920-01-01')],
      relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<TimelineView />)
    expect(screen.getByText('Jean Dupont')).toBeTruthy()
  })

  it('excludes persons without date_naissance from SVG but shows count', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [
        mkPerson('p1', 'Jean', 'Dupont', '1920-01-01'),
        mkPerson('p2', 'Marie', 'Martin', null),
      ],
      relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<TimelineView />)
    expect(screen.getByText('Jean Dupont')).toBeTruthy()
    expect(screen.queryByText('Marie Martin')).toBeNull()
    expect(screen.getByText(/1 sans date de naissance/i)).toBeTruthy()
  })

  it('calls selectPerson when a person label is clicked', () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont', '1920-01-01')],
      relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
      showFamily: true, setShowFamily: vi.fn(), showExtendedFamily: false, setShowExtendedFamily: vi.fn(), filteredRelationships: [],
    })
    render(<TimelineView />)
    screen.getByText('Jean Dupont').click()
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })
})
