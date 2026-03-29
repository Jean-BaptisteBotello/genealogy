import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { CosmosNode } from '../CosmosNode'

const baseProps = {
  id: 'p1',
  cx: 350, cy: 350, orbit: 1,
  prenom: 'Jacques',
  deceased: false,
  mode: 'mono' as const,
  branchColor: '#7c9cbf',
  shadowDx: -20, shadowDy: 0,
  onClick: vi.fn(), onHover: vi.fn(),
}

function renderInSvg(node: React.ReactElement) {
  const { container } = render(
    <svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="nodeGlow"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      {node}
    </svg>
  )
  return container
}

describe('CosmosNode', () => {
  it('renders a circle with fill purple in mono mode (alive)', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('#7c3aed')
  })

  it('renders dashed circle (no fill) in mono mode (deceased)', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} deceased={true} />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('none')
    expect(circle?.getAttribute('stroke-dasharray')).toBeTruthy()
  })

  it('renders circle with branch color in branch mode (alive)', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} mode="branch" />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('#7c9cbf')
  })

  it('renders dashed circle with branch stroke in branch mode (deceased)', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} mode="branch" deceased={true} />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('none')
    expect(circle?.getAttribute('stroke')).toBe('#7c9cbf')
    expect(circle?.getAttribute('stroke-dasharray')).toBeTruthy()
  })

  it('renders a shadow line', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} />)
    expect(container.querySelector('.shadow-line')).toBeTruthy()
  })

  it('calls onHover with id on mouseenter', () => {
    const onHover = vi.fn()
    const container = renderInSvg(<CosmosNode {...baseProps} onHover={onHover} />)
    const g = container.querySelector('g[style]')
    if (g) g.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    expect(onHover).toHaveBeenCalledWith('p1')
  })

  it('calls onClick with id on click', () => {
    const onClick = vi.fn()
    const container = renderInSvg(<CosmosNode {...baseProps} onClick={onClick} />)
    const g = container.querySelector('g[style]')
    if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClick).toHaveBeenCalledWith('p1')
  })
})
