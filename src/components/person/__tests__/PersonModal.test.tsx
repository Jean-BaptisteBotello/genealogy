// src/components/person/__tests__/PersonModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/server-actions/persons', () => ({
  createPerson: vi.fn().mockResolvedValue({}),
  updatePerson: vi.fn().mockResolvedValue({}),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { createPerson, updatePerson } from '@/server-actions/persons'

const defaultProps = {
  mode: 'add' as const,
  onClose: vi.fn(),
}

async function renderModal(props = defaultProps) {
  const { PersonModal } = await import('../PersonModal')
  return render(<PersonModal {...props} />)
}

describe('PersonModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the add form with prenom and nom fields', async () => {
    await renderModal()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
  })

  it('shows "Ajouter une personne" title in add mode', async () => {
    await renderModal()
    expect(screen.getByText(/ajouter une personne/i)).toBeInTheDocument()
  })

  it('shows "Modifier" title in edit mode', async () => {
    const editPerson = {
      id: 'p1', prenom: 'Marie', nom: 'Curie',
      date_naissance: null, lieu_naissance: null, lat_naissance: null,
      lon_naissance: null, date_deces: null, lieu_deces: null,
      lat_deces: null, lon_deces: null, notes: null,
      created_at: '', updated_at: '',
    }
    const { PersonModal } = await import('../PersonModal')
    render(<PersonModal mode={{ type: 'edit', person: editPerson }} onClose={vi.fn()} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('pre-fills form fields in edit mode', async () => {
    const editPerson = {
      id: 'p1', prenom: 'Marie', nom: 'Curie',
      date_naissance: '1867-11-07', lieu_naissance: 'Warsaw',
      lat_naissance: null, lon_naissance: null,
      date_deces: null, lieu_deces: null,
      lat_deces: null, lon_deces: null, notes: null,
      created_at: '', updated_at: '',
    }
    const { PersonModal } = await import('../PersonModal')
    render(<PersonModal mode={{ type: 'edit', person: editPerson }} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Marie')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Curie')).toBeInTheDocument()
  })

  it('calls createPerson with form data on submit in add mode', async () => {
    vi.mocked(createPerson).mockResolvedValue({ id: 'new-id' })
    const user = userEvent.setup()
    await renderModal()

    await user.type(screen.getByLabelText(/prénom/i), 'Jean')
    await user.type(screen.getByLabelText(/nom/i), 'Dupont')
    await user.click(screen.getByRole('button', { name: /ajouter/i }))

    await waitFor(() => {
      expect(createPerson).toHaveBeenCalled()
    })
  })

  it('displays an error message when server action returns error', async () => {
    vi.mocked(createPerson).mockResolvedValue({ error: 'Champ requis' })
    const user = userEvent.setup()
    await renderModal()

    await user.type(screen.getByLabelText(/prénom/i), 'Jean')
    await user.type(screen.getByLabelText(/nom/i), 'Dupont')
    await user.click(screen.getByRole('button', { name: /ajouter/i }))

    await waitFor(() => {
      expect(screen.getByText('Champ requis')).toBeInTheDocument()
    })
  })

  it('calls onClose when the cancel button is clicked', async () => {
    const onClose = vi.fn()
    const { PersonModal } = await import('../PersonModal')
    render(<PersonModal mode="add" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
