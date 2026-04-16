import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PersonModal } from '../PersonModal'
import { TreeContext } from '@/lib/context/tree-context'

vi.mock('@/server-actions/persons', () => ({
  createPerson: vi.fn(async () => ({ id: 'new-person-id' })),
  updatePerson: vi.fn(async () => ({ id: 'edit-id' })),
}))
vi.mock('@/server-actions/relationships', () => ({
  createRelationship: vi.fn(async () => ({})),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

function wrap(ui: React.ReactElement) {
  const ctx: any = {
    persons: [], branches: [], relationships: [], personBranches: [],
    currentRole: 'ADMIN',
    selectedPersonId: null, selectPerson: vi.fn(),
    openAddPerson: vi.fn(), openEditPerson: vi.fn(),
    pendingSuggestionsCount: 0,
    showToast: vi.fn(),
    showFamily: true, setShowFamily: vi.fn(),
    showExtendedFamily: false, setShowExtendedFamily: vi.fn(),
    filteredRelationships: [],
  }
  return render(<TreeContext.Provider value={ctx}>{ui}</TreeContext.Provider>)
}

describe('PersonModal — créer puis lier', () => {
  it('après création, affiche l\'étape « Lier {Nom} à… » avec bouton « Plus tard »', async () => {
    wrap(<PersonModal mode="add" onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/^Prénom$/i), { target: { value: 'Jean' } })
    fireEvent.change(screen.getByLabelText(/^Nom$/i), { target: { value: 'Dupont' } })
    fireEvent.submit(screen.getByRole('button', { name: /Ajouter/i }).closest('form')!)
    await waitFor(() => {
      expect(screen.getByText(/Lier Jean Dupont à/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Plus tard/i })).toBeInTheDocument()
  })

  it('bouton « Plus tard » ferme la modale', async () => {
    const onClose = vi.fn()
    wrap(<PersonModal mode="add" onClose={onClose} />)
    fireEvent.change(screen.getByLabelText(/^Prénom$/i), { target: { value: 'Jean' } })
    fireEvent.change(screen.getByLabelText(/^Nom$/i), { target: { value: 'Dupont' } })
    fireEvent.submit(screen.getByRole('button', { name: /Ajouter/i }).closest('form')!)
    await waitFor(() => screen.getByRole('button', { name: /Plus tard/i }))
    fireEvent.click(screen.getByRole('button', { name: /Plus tard/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('en mode edit, pas de step 2 (close direct)', async () => {
    const onClose = vi.fn()
    const person = {
      id: 'p1', prenom: 'A', nom: 'B',
      date_naissance: null, lieu_naissance: null,
      date_deces: null, lieu_deces: null, notes: null,
    } as any
    wrap(<PersonModal mode={{ type: 'edit', person }} onClose={onClose} />)
    fireEvent.submit(screen.getByRole('button', { name: /Enregistrer/i }).closest('form')!)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(screen.queryByText(/Lier A B à/i)).not.toBeInTheDocument()
  })
})
