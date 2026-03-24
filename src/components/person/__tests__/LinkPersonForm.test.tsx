import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/server-actions/relationships', () => ({
  createRelationship: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/lib/context/tree-context', () => ({
  useTree: () => ({ currentRole: 'ADMIN' }),
}))

import { createRelationship } from '@/server-actions/relationships'

const CURRENT_ID = 'person-a'
const OTHER_ID = 'person-b'

const persons = [
  {
    id: CURRENT_ID, prenom: 'Pierre', nom: 'Dupont',
    date_naissance: '1990-04-26', lieu_naissance: null,
    lat_naissance: null, lon_naissance: null,
    date_deces: null, lieu_deces: null,
    lat_deces: null, lon_deces: null,
    notes: null, created_at: '', updated_at: '',
  },
  {
    id: OTHER_ID, prenom: 'Pierre', nom: 'Dupont',
    date_naissance: '1960-01-01', lieu_naissance: null,
    lat_naissance: null, lon_naissance: null,
    date_deces: null, lieu_deces: null,
    lat_deces: null, lon_deces: null,
    notes: null, created_at: '', updated_at: '',
  },
]

async function renderForm(onClose = vi.fn()) {
  const { LinkPersonForm } = await import('../LinkPersonForm')
  return render(
    <LinkPersonForm
      currentPersonId={CURRENT_ID}
      persons={persons}
      onClose={onClose}
    />
  )
}

describe('LinkPersonForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders search input and role buttons', async () => {
    await renderForm()
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
    expect(screen.getByText('père')).toBeInTheDocument()
    expect(screen.getByText('mère')).toBeInTheDocument()
  })

  it('excludes the current person from the list', async () => {
    await renderForm()
    const input = screen.getByPlaceholderText(/rechercher/i)
    await userEvent.type(input, 'dupont')
    expect(screen.queryByText(/jean-baptiste/i)).not.toBeInTheDocument()
    expect(screen.getByText(/pierre/i)).toBeInTheDocument()
  })

  it('filters persons by search query', async () => {
    await renderForm()
    const input = screen.getByPlaceholderText(/rechercher/i)
    await userEvent.type(input, 'zzz')
    expect(screen.queryByText(/pierre/i)).not.toBeInTheDocument()
  })

  it('submit button is disabled until both person and role are selected', async () => {
    await renderForm()
    const btn = screen.getByRole('button', { name: /lier/i })
    expect(btn).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText(/rechercher/i), 'pierre')
    await userEvent.click(screen.getByText(/pierre/i))
    expect(btn).toBeDisabled()

    await userEvent.click(screen.getByText('père'))
    expect(btn).not.toBeDisabled()
  })

  it('calls createRelationship with correct FormData on submit', async () => {
    await renderForm()
    await userEvent.type(screen.getByPlaceholderText(/rechercher/i), 'pierre')
    await userEvent.click(screen.getByText(/pierre/i))
    await userEvent.click(screen.getByText('père'))
    await userEvent.click(screen.getByRole('button', { name: /lier/i }))

    await waitFor(() => {
      expect(createRelationship).toHaveBeenCalledOnce()
      const fd = (createRelationship as ReturnType<typeof vi.fn>).mock.calls[0][0] as FormData
      expect(fd.get('type')).toBe('PARENT_CHILD')
      expect(fd.get('person_a_id')).toBe(OTHER_ID) // père = other→current
      expect(fd.get('person_b_id')).toBe(CURRENT_ID)
      expect(JSON.parse(fd.get('metadata') as string)).toEqual({ role: 'père' })
    })
  })

  it('calls onClose after successful submit', async () => {
    const onClose = vi.fn()
    await renderForm(onClose)
    await userEvent.type(screen.getByPlaceholderText(/rechercher/i), 'pierre')
    await userEvent.click(screen.getByText(/pierre/i))
    await userEvent.click(screen.getByText('père'))
    await userEvent.click(screen.getByRole('button', { name: /lier/i }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('shows error message when createRelationship returns error', async () => {
    vi.mocked(createRelationship).mockResolvedValueOnce({ error: 'Cycle détecté' })
    await renderForm()
    await userEvent.type(screen.getByPlaceholderText(/rechercher/i), 'pierre')
    await userEvent.click(screen.getByText(/pierre/i))
    await userEvent.click(screen.getByText('père'))
    await userEvent.click(screen.getByRole('button', { name: /lier/i }))
    await waitFor(() => expect(screen.getByText(/cycle détecté/i)).toBeInTheDocument())
  })

  it('shows famille étendue roles after expanding', async () => {
    await renderForm()
    expect(screen.queryByText('grand-père')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText(/famille étendue/i))
    expect(screen.getByText('grand-père')).toBeInTheDocument()
    expect(screen.getByText('oncle')).toBeInTheDocument()
  })

  it('calls onClose when Annuler is clicked', async () => {
    const onClose = vi.fn()
    await renderForm(onClose)
    await userEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('clears error state when form is closed and reopened', async () => {
    vi.mocked(createRelationship).mockResolvedValueOnce({ error: 'Cycle détecté' })
    const { unmount } = await renderForm()

    // trigger an error
    await userEvent.type(screen.getByPlaceholderText(/rechercher/i), 'pierre')
    await userEvent.click(screen.getByText(/pierre/i))
    await userEvent.click(screen.getByText('père'))
    await userEvent.click(screen.getByRole('button', { name: /lier/i }))
    await waitFor(() => expect(screen.getByText(/cycle détecté/i)).toBeInTheDocument())

    // close and reopen (simulate parent toggle without unmount)
    unmount()
    vi.mocked(createRelationship).mockResolvedValue({})
    await renderForm()

    // error should not appear on fresh open
    expect(screen.queryByText(/cycle détecté/i)).not.toBeInTheDocument()
  })
})
