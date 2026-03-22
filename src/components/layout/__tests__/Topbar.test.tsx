import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Topbar } from '../Topbar'

vi.mock('@/server-actions/auth', () => ({ signout: vi.fn() }))

describe('Topbar', () => {
  it('renders app name', () => {
    render(<Topbar userEmail="test@example.com" />)
    expect(screen.getByText(/généalogie/i)).toBeInTheDocument()
  })

  it('renders all view tabs', () => {
    render(<Topbar userEmail="test@example.com" />)
    expect(screen.getByText(/cosmos/i)).toBeInTheDocument()
    expect(screen.getByText(/sablier/i)).toBeInTheDocument()
    expect(screen.getByText(/timeline/i)).toBeInTheDocument()
    expect(screen.getByText(/carte/i)).toBeInTheDocument()
    expect(screen.getByText(/éventail/i)).toBeInTheDocument()
  })
})
