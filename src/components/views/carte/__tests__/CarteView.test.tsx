import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

// Mock next/dynamic to render a simple placeholder synchronously
vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, _opts?: unknown) => {
    return function DynamicMap(props: Record<string, unknown>) {
      return <div data-testid="dynamic-map" />
    }
  },
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { useTree } from '@/lib/context/tree-context'
import { CarteView } from '../CarteView'
import type { Person } from '@/lib/types/database'

const mkPerson = (id: string, lat: number | null = null, lon: number | null = null): Person => ({
  id, prenom: 'Jean', nom: 'Dupont',
  date_naissance: null, lieu_naissance: lat !== null ? 'Paris' : null,
  lat_naissance: lat, lon_naissance: lon,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CarteView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CarteView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('shows non-geolocated badge when persons have no coordinates', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', null, null)],
      relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CarteView />)
    expect(screen.getByText(/1 lieu non géolocalisé/i)).toBeTruthy()
  })

  it('shows correct count for multiple non-geolocated persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', null, null), mkPerson('p2', null, null)],
      relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CarteView />)
    expect(screen.getByText(/2 lieux non géolocalisés/i)).toBeTruthy()
  })

  it('renders the dynamic map wrapper when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 48.8566, 2.3522)],
      relationships: [], branches: [], personBranches: [],
      currentRole: 'ADMIN',
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CarteView />)
    expect(screen.getByTestId('dynamic-map')).toBeTruthy()
  })
})
