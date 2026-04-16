import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LinkPersonForm } from '../LinkPersonForm'

vi.mock('@/server-actions/relationships', () => ({
  createRelationship: vi.fn(),
}))

const persons = [
  { id: 'a', prenom: 'Alice', nom: 'A', date_naissance: null, date_deces: null } as any,
  { id: 'b', prenom: 'Bob', nom: 'B', date_naissance: null, date_deces: null } as any,
]

describe('LinkPersonForm — famille étendue visible', () => {
  it('affiche les titres « Directe » et « Étendue » sans interaction utilisateur', () => {
    render(<LinkPersonForm currentPersonId="a" persons={persons} onClose={vi.fn()} />)
    expect(screen.getByText(/Directe/i)).toBeInTheDocument()
    expect(screen.getByText(/Étendue/i)).toBeInTheDocument()
  })

  it('les rôles étendus (oncle) sont visibles d\'emblée', () => {
    render(<LinkPersonForm currentPersonId="a" persons={persons} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /oncle/i })).toBeInTheDocument()
  })
})
