import { describe, it, expect } from 'vitest'
import { computeCosmosLayout, ORBIT_RADII } from '../cosmosLayout'
import type { Relationship } from '@/lib/types/database'

const REL = (a: string, b: string, type: Relationship['type'], meta: Record<string, unknown> = {}): Relationship => ({
  id: `${a}-${b}`,
  person_a_id: a,
  person_b_id: b,
  type,
  metadata: meta,
})

describe('ORBIT_RADII', () => {
  it('defines radii for orbits 0–4', () => {
    expect(ORBIT_RADII[0]).toBe(0)
    expect(ORBIT_RADII[1]).toBe(80)
    expect(ORBIT_RADII[2]).toBe(130)
    expect(ORBIT_RADII[3]).toBe(200)
    expect(ORBIT_RADII[4]).toBe(280)
  })
})

describe('computeCosmosLayout', () => {
  it('places the center person at orbit 0', () => {
    const result = computeCosmosLayout(['p1', 'p2'], [REL('p1', 'p2', 'PARENT_CHILD')], 'p1')
    const center = result.nodes.find(n => n.id === 'p1')
    expect(center?.orbit).toBe(0)
    expect(center?.x).toBe(0)
    expect(center?.y).toBe(0)
  })

  it('places active UNION partner at orbit 1', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'UNION', { ended: false })],
      'p1'
    )
    const partner = result.nodes.find(n => n.id === 'p2')
    expect(partner?.orbit).toBe(1)
  })

  it('places ended UNION partner at orbit 2', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'UNION', { ended: true })],
      'p1'
    )
    const partner = result.nodes.find(n => n.id === 'p2')
    expect(partner?.orbit).toBe(2)
  })

  it('places 1-hop PARENT_CHILD at orbit 2', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'PARENT_CHILD')],
      'p1'
    )
    const child = result.nodes.find(n => n.id === 'p2')
    expect(child?.orbit).toBe(2)
  })

  it('places 1-hop SIBLING at orbit 2', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'SIBLING')],
      'p1'
    )
    const sibling = result.nodes.find(n => n.id === 'p2')
    expect(sibling?.orbit).toBe(2)
  })

  it('places 2-hop relatives at orbit 3', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2', 'PARENT_CHILD'), REL('p2', 'p3', 'PARENT_CHILD')],
      'p1'
    )
    const grandparent = result.nodes.find(n => n.id === 'p3')
    expect(grandparent?.orbit).toBe(3)
  })

  it('places 3+ hop relatives at orbit 4', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2', 'p3', 'p4'],
      [
        REL('p1', 'p2', 'PARENT_CHILD'),
        REL('p2', 'p3', 'PARENT_CHILD'),
        REL('p3', 'p4', 'PARENT_CHILD'),
      ],
      'p1'
    )
    const great = result.nodes.find(n => n.id === 'p4')
    expect(great?.orbit).toBe(4)
  })

  it('places nodes evenly around their orbit', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2', 'PARENT_CHILD'), REL('p1', 'p3', 'PARENT_CHILD')],
      'p1'
    )
    const orbit2Nodes = result.nodes.filter(n => n.orbit === 2)
    expect(orbit2Nodes).toHaveLength(2)
    orbit2Nodes.forEach(n => {
      const dist = Math.sqrt(n.x ** 2 + n.y ** 2)
      expect(dist).toBeCloseTo(ORBIT_RADII[2], 0)
    })
  })

  it('lists persons with no relationships as orphans', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2', 'PARENT_CHILD')],
      'p1'
    )
    expect(result.orphans).toContain('p3')
    expect(result.orphans).not.toContain('p1')
    expect(result.orphans).not.toContain('p2')
  })

  it('returns empty nodes and orphans for empty input', () => {
    const result = computeCosmosLayout([], [], 'p1')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toEqual([])
  })

  it('handles center not in personIds gracefully', () => {
    const result = computeCosmosLayout(['p1', 'p2'], [REL('p1', 'p2', 'PARENT_CHILD')], 'unknown')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toHaveLength(2)
  })

  it('treats UNION without metadata.ended as active (orbit 1)', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'UNION')],
      'p1'
    )
    const partner = result.nodes.find(n => n.id === 'p2')
    expect(partner?.orbit).toBe(1)
  })
})
