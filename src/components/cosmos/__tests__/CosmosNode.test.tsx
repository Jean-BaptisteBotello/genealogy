import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CosmosNode } from '../CosmosNode'

const defaultProps = {
  id: 'p1',
  x: 100,
  y: 80,
  prenom: 'Jean',
  nom: 'Dupont',
  isSelected: false,
  isCenter: false,
  branchColor: '#3b82f6',
  onClick: vi.fn(),
  onHover: vi.fn(),
}

describe('CosmosNode', () => {
  it('renders a circle at (x, y)', () => {
    const { container } = render(
      <svg><CosmosNode {...defaultProps} /></svg>
    )
    const circle = container.querySelector('circle')
    expect(circle).toBeTruthy()
    expect(circle?.getAttribute('cx')).toBe('100')
    expect(circle?.getAttribute('cy')).toBe('80')
  })

  it('shows initials inside the circle', () => {
    render(<svg><CosmosNode {...defaultProps} /></svg>)
    expect(screen.getByText('JD')).toBeTruthy()
  })

  it('applies selected styling when isSelected=true', () => {
    const { container } = render(
      <svg><CosmosNode {...defaultProps} isSelected={true} /></svg>
    )
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('stroke-width')).toBe('3')
  })

  it('applies center styling when isCenter=true', () => {
    const { container } = render(
      <svg><CosmosNode {...defaultProps} isCenter={true} /></svg>
    )
    const circle = container.querySelector('circle')
    const r = Number(circle?.getAttribute('r'))
    expect(r).toBeGreaterThan(22)
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<svg><CosmosNode {...defaultProps} onClick={onClick} /></svg>)
    fireEvent.click(screen.getByText('JD'))
    expect(onClick).toHaveBeenCalledWith('p1')
  })

  it('calls onHover with id when mouse enters', () => {
    const onHover = vi.fn()
    const { container } = render(<svg><CosmosNode {...defaultProps} onHover={onHover} /></svg>)
    const group = container.querySelector('g')!
    fireEvent.mouseEnter(group)
    expect(onHover).toHaveBeenCalledWith('p1')
  })

  it('calls onHover with null when mouse leaves', () => {
    const onHover = vi.fn()
    const { container } = render(<svg><CosmosNode {...defaultProps} onHover={onHover} /></svg>)
    const group = container.querySelector('g')!
    fireEvent.mouseLeave(group)
    expect(onHover).toHaveBeenCalledWith(null)
  })
})
