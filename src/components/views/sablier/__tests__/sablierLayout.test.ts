import { describe, it, expect } from 'vitest'
import { computeSablierLayout, ROW_HEIGHT, COL_WIDTH } from '../sablierLayout'
import type { Relationship } from '@/lib/types/database'

const REL = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD', meta: Record<string, unknown> = {}): Relationship => ({
  id: `${a}-${b}`,
  person_a_id: a,
  person_b_id: b,
  type,
  metadata: meta,
})

describe('computeSablierLayout', () => {
  it('places center person at generation 0, position (0, 0) when alone', () => {
    const result = computeSablierLayout(['p1'], [], 'p1')
    const center = result.nodes.find(n => n.id === 'p1')
    expect(center?.generation).toBe(0)
    expect(center?.x).toBe(0)
    expect(center?.y).toBe(0)
  })

  it('places parent at generation -1 (above center)', () => {
    const result = computeSablierLayout(['p1', 'p2'], [REL('p1', 'p2')], 'p2')
    const parent = result.nodes.find(n => n.id === 'p1')
    const child = result.nodes.find(n => n.id === 'p2')
    expect(parent?.generation).toBe(-1)
    // Parent at top (y=0), child below (y=ROW_HEIGHT)
    expect(parent?.y).toBe(0)
    expect(child?.y).toBe(ROW_HEIGHT)
  })

  it('places child at generation +1 (below center)', () => {
    const result = computeSablierLayout(['p1', 'p2'], [REL('p1', 'p2')], 'p1')
    const child = result.nodes.find(n => n.id === 'p2')
    expect(child?.generation).toBe(1)
    expect(child?.y).toBe(ROW_HEIGHT)
  })

  it('places grandparent at generation -2', () => {
    const result = computeSablierLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2'), REL('p2', 'p3')],
      'p3'
    )
    const grandparent = result.nodes.find(n => n.id === 'p1')
    expect(grandparent?.generation).toBe(-2)
    // Grandparent at top (y=0), parent at ROW_HEIGHT, child at 2*ROW_HEIGHT
    expect(grandparent?.y).toBe(0)
  })

  it('places grandchild at generation +2', () => {
    const result = computeSablierLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2'), REL('p2', 'p3')],
      'p1'
    )
    const grandchild = result.nodes.find(n => n.id === 'p3')
    expect(grandchild?.generation).toBe(2)
    expect(grandchild?.y).toBe(2 * ROW_HEIGHT)
  })

  it('spreads two parents horizontally at the same y', () => {
    const result = computeSablierLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p3'), REL('p2', 'p3')],
      'p3'
    )
    const parents = result.nodes.filter(n => n.generation === -1)
    expect(parents).toHaveLength(2)
    expect(parents[0].y).toBe(parents[1].y)
    expect(parents[0].x).not.toBe(parents[1].x)
  })

  it('includes active UNION partner at generation 0', () => {
    const result = computeSablierLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'UNION', { ended: false })],
      'p1'
    )
    const partner = result.nodes.find(n => n.id === 'p2')
    expect(partner?.generation).toBe(0)
  })

  it('lists unconnected persons as orphans', () => {
    const result = computeSablierLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2')],
      'p1'
    )
    expect(result.orphans).toContain('p3')
    expect(result.orphans).not.toContain('p1')
    expect(result.orphans).not.toContain('p2')
  })

  it('returns empty for empty input', () => {
    const result = computeSablierLayout([], [], 'p1')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toEqual([])
  })

  it('returns all as orphans if center not in personIds', () => {
    const result = computeSablierLayout(['p1', 'p2'], [REL('p1', 'p2')], 'unknown')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toHaveLength(2)
  })
})
