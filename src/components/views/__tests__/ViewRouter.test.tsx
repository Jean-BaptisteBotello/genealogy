import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/cosmos/CosmosView', () => ({
  CosmosView: () => <div data-testid="cosmos-view" />,
}))
vi.mock('@/components/views/sablier/SablierFlowView', () => ({
  SablierFlowView: () => <div data-testid="sablier-view" />,
}))
vi.mock('@/components/views/timeline/TimelineView', () => ({
  TimelineView: () => <div data-testid="timeline-view" />,
}))
vi.mock('@/components/views/carte/CarteView', () => ({
  CarteView: () => <div data-testid="carte-view" />,
}))
vi.mock('@/components/views/eventail/EventailView', () => ({
  EventailView: () => <div data-testid="eventail-view" />,
}))

import { ViewRouter } from '../ViewRouter'

describe('ViewRouter', () => {
  it('renders CosmosView for cosmos', () => {
    render(<ViewRouter activeView="cosmos" />)
    expect(screen.getByTestId('cosmos-view')).toBeTruthy()
  })

  it('renders SablierView for sablier', () => {
    render(<ViewRouter activeView="sablier" />)
    expect(screen.getByTestId('sablier-view')).toBeTruthy()
  })

  it('renders TimelineView for timeline', () => {
    render(<ViewRouter activeView="timeline" />)
    expect(screen.getByTestId('timeline-view')).toBeTruthy()
  })

  it('renders CarteView for carte', () => {
    render(<ViewRouter activeView="carte" />)
    expect(screen.getByTestId('carte-view')).toBeTruthy()
  })

  it('renders EventailView for eventail', () => {
    render(<ViewRouter activeView="eventail" />)
    expect(screen.getByTestId('eventail-view')).toBeTruthy()
  })

  it('renders only one view at a time', () => {
    render(<ViewRouter activeView="sablier" />)
    expect(screen.queryByTestId('cosmos-view')).toBeNull()
    expect(screen.queryByTestId('timeline-view')).toBeNull()
    expect(screen.getByTestId('sablier-view')).toBeTruthy()
  })
})
