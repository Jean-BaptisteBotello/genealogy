import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/context/tree-context', () => ({
  useTree: vi.fn(),
}))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: { from: () => ({ createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: '' } }) }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  }),
}))
vi.mock('../../../components/person/LinkPersonForm', () => ({
  LinkPersonForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="link-form">
      <button onClick={onClose}>close-form</button>
    </div>
  ),
}))

import { useTree } from '@/lib/context/tree-context'

const mockPerson = {
  id: 'p1', prenom: 'Jean-Baptiste', nom: 'Botello',
  date_naissance: null, lieu_naissance: null,
  lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null,
  lat_deces: null, lon_deces: null,
  notes: null, created_at: '', updated_at: '',
}

function setupTree(role: 'ADMIN' | 'EDITOR' | 'VIEWER') {
  vi.mocked(useTree).mockReturnValue({
    currentRole: role,
    persons: [mockPerson],
    relationships: [],
    branches: [],
    personBranches: [],
    documents: {},
    suggestions: [],
    selectedPersonId: 'p1',
    selectPerson: vi.fn(),
    openAddPerson: vi.fn(),
  } as never)
}

async function renderPanel(role: 'ADMIN' | 'EDITOR' | 'VIEWER' = 'ADMIN') {
  setupTree(role)
  const { DetailPanel } = await import('../DetailPanel')
  return render(
    <DetailPanel
      persons={[mockPerson]}
      relationships={[]}
      branches={[]}
      personBranches={[]}
      documents={{}}
      allPersons={[mockPerson]}
      selectedPersonId="p1"
      onSelectPerson={vi.fn()}
      onClose={vi.fn()}
      currentRole={role}
      pendingSuggestions={[]}
    />
  )
}

describe('DetailPanel — lier une personne', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows [+] button in Relations section for ADMIN', async () => {
    await renderPanel('ADMIN')
    expect(screen.getByTitle(/lier/i)).toBeInTheDocument()
  })

  it('shows [+] button for EDITOR', async () => {
    await renderPanel('EDITOR')
    expect(screen.getByTitle(/lier/i)).toBeInTheDocument()
  })

  it('hides [+] button for VIEWER', async () => {
    await renderPanel('VIEWER')
    expect(screen.queryByTitle(/lier/i)).not.toBeInTheDocument()
  })

  it('shows LinkPersonForm after clicking [+]', async () => {
    await renderPanel('ADMIN')
    expect(screen.queryByTestId('link-form')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTitle(/lier/i))
    expect(screen.getByTestId('link-form')).toBeInTheDocument()
  })

  it('hides LinkPersonForm after onClose is called', async () => {
    await renderPanel('ADMIN')
    await userEvent.click(screen.getByTitle(/lier/i))
    expect(screen.getByTestId('link-form')).toBeInTheDocument()
    await userEvent.click(screen.getByText('close-form'))
    expect(screen.queryByTestId('link-form')).not.toBeInTheDocument()
  })

  it('displays metadata.role if present, otherwise falls back to type label', async () => {
    setupTree('ADMIN')
    const relWithRole = {
      id: 'r1', person_a_id: 'p2', person_b_id: 'p1',
      type: 'PARENT_CHILD' as const,
      metadata: { role: 'grand-père' },
    }
    const p2 = { ...mockPerson, id: 'p2', prenom: 'Pierre', nom: 'Botello' }
    const { DetailPanel } = await import('../DetailPanel')
    render(
      <DetailPanel
        persons={[mockPerson, p2]}
        relationships={[relWithRole]}
        branches={[]}
        personBranches={[]}
        documents={{}}
        allPersons={[mockPerson, p2]}
        selectedPersonId="p1"
        onSelectPerson={vi.fn()}
        onClose={vi.fn()}
        currentRole="ADMIN"
        pendingSuggestions={[]}
      />
    )
    expect(screen.getByText('grand-père')).toBeInTheDocument()
  })
})
