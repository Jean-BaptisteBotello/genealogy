import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('calls onViewChange with the correct view id when a tab is clicked', async () => {
    const onViewChange = vi.fn()
    render(<Topbar userEmail="test@example.com" onViewChange={onViewChange} />)
    await userEvent.click(screen.getByText(/timeline/i))
    expect(onViewChange).toHaveBeenCalledOnce()
    expect(onViewChange).toHaveBeenCalledWith('timeline')
  })

  it('displays correct initials from userEmail prop', () => {
    render(<Topbar userEmail="alice@example.com" />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('displays fallback initials when userEmail is empty', () => {
    render(<Topbar userEmail="" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
