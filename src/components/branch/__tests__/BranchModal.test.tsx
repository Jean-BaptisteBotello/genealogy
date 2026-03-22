// src/components/branch/__tests__/BranchModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/server-actions/branches', () => ({
  createBranch: vi.fn().mockResolvedValue({}),
  updateBranch: vi.fn().mockResolvedValue({}),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { createBranch, updateBranch } from '@/server-actions/branches'

const defaultProps = { mode: 'add' as const, onClose: vi.fn() }

async function renderModal(props = defaultProps) {
  const { BranchModal } = await import('../BranchModal')
  return render(<BranchModal {...props} />)
}

describe('BranchModal', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders nom and couleur fields in add mode', async () => {
    await renderModal()
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /couleur/i })).toBeInTheDocument()
  })

  it('shows "Nouvelle branche" title in add mode', async () => {
    await renderModal()
    expect(screen.getByText(/nouvelle branche/i)).toBeInTheDocument()
  })

  it('pre-fills fields in edit mode', async () => {
    const branch = {
      id: 'b1', nom: 'Côté Paternel', couleur: '#3b82f6',
      description: 'Branche paternelle', created_by: 'u1', created_at: '',
    }
    const { BranchModal } = await import('../BranchModal')
    render(<BranchModal mode={{ type: 'edit', branch }} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Côté Paternel')).toBeInTheDocument()
  })

  it('calls createBranch on submit in add mode', async () => {
    vi.mocked(createBranch).mockResolvedValue({ id: 'new-b' })
    const user = userEvent.setup()
    await renderModal()

    await user.type(screen.getByLabelText(/nom/i), 'Maternel')
    await user.click(screen.getByRole('button', { name: /créer/i }))

    await waitFor(() => {
      expect(createBranch).toHaveBeenCalled()
    })
  })

  it('calls updateBranch on submit in edit mode', async () => {
    vi.mocked(updateBranch).mockResolvedValue({ id: 'b1' })
    const user = userEvent.setup()
    const branch = {
      id: 'b1', nom: 'Côté Paternel', couleur: '#3b82f6',
      description: '', created_by: 'u1', created_at: '',
    }
    const { BranchModal } = await import('../BranchModal')
    render(<BranchModal mode={{ type: 'edit', branch }} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => {
      expect(updateBranch).toHaveBeenCalled()
      expect(createBranch).not.toHaveBeenCalled()
    })
  })

  it('displays error when server action returns error', async () => {
    vi.mocked(createBranch).mockResolvedValue({ error: 'Nom requis' })
    const user = userEvent.setup()
    await renderModal()

    await user.type(screen.getByLabelText(/nom/i), 'X')
    await user.click(screen.getByRole('button', { name: /créer/i }))

    await waitFor(() => {
      expect(screen.getByText('Nom requis')).toBeInTheDocument()
    })
  })

  it('calls onClose on cancel', async () => {
    const onClose = vi.fn()
    const { BranchModal } = await import('../BranchModal')
    render(<BranchModal mode="add" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
