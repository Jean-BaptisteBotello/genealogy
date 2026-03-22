import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/server-actions/search', () => ({
  searchPersons: vi.fn().mockResolvedValue([]),
}))

import { searchPersons } from '@/server-actions/search'

const defaultProps = {
  onClose: vi.fn(),
  onSelectPerson: vi.fn(),
}

async function renderOverlay(props = defaultProps) {
  const { SearchOverlay } = await import('../SearchOverlay')
  return render(<SearchOverlay {...props} />)
}

describe('SearchOverlay', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders a search input', async () => {
    await renderOverlay()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('shows "Aucun résultat" when search returns empty', async () => {
    vi.mocked(searchPersons).mockResolvedValue([])
    const user = userEvent.setup()
    await renderOverlay()

    await user.type(screen.getByRole('searchbox'), 'xyz')
    await waitFor(() => {
      expect(screen.getByText(/aucun résultat/i)).toBeInTheDocument()
    })
  })

  it('displays search results', async () => {
    vi.mocked(searchPersons).mockResolvedValue([
      {
        id: 'p1', prenom: 'Marie', nom: 'Curie',
        date_naissance: '1867-11-07', lieu_naissance: 'Warsaw',
        lat_naissance: null, lon_naissance: null,
        date_deces: '1934-07-04', lieu_deces: 'Sceaux',
        lat_deces: null, lon_deces: null,
        notes: null, created_at: '', updated_at: '',
      },
    ])
    const user = userEvent.setup()
    await renderOverlay()

    await user.type(screen.getByRole('searchbox'), 'Marie')
    await waitFor(() => {
      expect(screen.getByText('Marie Curie')).toBeInTheDocument()
    })
  })

  it('calls onSelectPerson and onClose when a result is clicked', async () => {
    const onSelectPerson = vi.fn()
    const onClose = vi.fn()
    vi.mocked(searchPersons).mockResolvedValue([
      {
        id: 'p1', prenom: 'Marie', nom: 'Curie',
        date_naissance: null, lieu_naissance: null,
        lat_naissance: null, lon_naissance: null,
        date_deces: null, lieu_deces: null,
        lat_deces: null, lon_deces: null,
        notes: null, created_at: '', updated_at: '',
      },
    ])
    const user = userEvent.setup()
    const { SearchOverlay } = await import('../SearchOverlay')
    render(<SearchOverlay onClose={onClose} onSelectPerson={onSelectPerson} />)

    await user.type(screen.getByRole('searchbox'), 'Marie')
    await waitFor(() => screen.getByText('Marie Curie'))
    await user.click(screen.getByText('Marie Curie'))

    expect(onSelectPerson).toHaveBeenCalledWith('p1')
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    const { SearchOverlay } = await import('../SearchOverlay')
    render(<SearchOverlay onClose={onClose} onSelectPerson={vi.fn()} />)

    const backdrop = screen.getByTestId('search-backdrop')
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { SearchOverlay } = await import('../SearchOverlay')
    render(<SearchOverlay onClose={onClose} onSelectPerson={vi.fn()} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
