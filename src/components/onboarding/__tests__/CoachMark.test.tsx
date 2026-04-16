import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CoachMark } from '../CoachMark'

const base = {
  step: 1,
  totalSteps: 4,
  title: 'Test title',
  description: 'Test description',
  ctaLabel: 'Go',
  onCtaClick: vi.fn(),
  onSkip: vi.fn(),
  position: 'bottom' as const,
}

describe('CoachMark', () => {
  it('renders title, description, badge, CTA, and skip', () => {
    render(<CoachMark {...base} />)
    expect(screen.getByText('Test title')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('1 / 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Go/i })).toBeInTheDocument()
    expect(screen.getByText(/Passer le guide/i)).toBeInTheDocument()
  })

  it('calls onCtaClick when CTA clicked', () => {
    render(<CoachMark {...base} />)
    fireEvent.click(screen.getByRole('button', { name: /Go/i }))
    expect(base.onCtaClick).toHaveBeenCalled()
  })

  it('calls onSkip when skip clicked', () => {
    render(<CoachMark {...base} />)
    fireEvent.click(screen.getByText(/Passer le guide/i))
    expect(base.onSkip).toHaveBeenCalled()
  })

  it('renders children when provided', () => {
    render(<CoachMark {...base}><div data-testid="child">Custom</div></CoachMark>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies arrow position class', () => {
    const { container } = render(<CoachMark {...base} position="top" />)
    expect(container.querySelector('.coach-mark--arrow-top')).toBeTruthy()
  })
})
