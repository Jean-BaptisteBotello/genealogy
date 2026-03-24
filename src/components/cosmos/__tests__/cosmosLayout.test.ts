import { describe, it, expect } from 'vitest'
import { getMetadataRole, getOrbitForRole, computeCosmosLayout, ORBIT_RADII } from '../cosmosLayout'
import type { Relationship } from '@/lib/types/database'

const rel = (overrides: Partial<Relationship> = {}): Relationship => ({
  id: 'r1', person_a_id: 'a', person_b_id: 'b',
  type: 'PARENT_CHILD', metadata: {},
  ...overrides,
})

describe('getMetadataRole', () => {
  it('returns string role when present', () => {
    expect(getMetadataRole(rel({ metadata: { role: 'père' } }))).toBe('père')
  })
  it('returns undefined when role is absent', () => {
    expect(getMetadataRole(rel({ metadata: {} }))).toBeUndefined()
  })
  it('returns undefined when role is not a string', () => {
    expect(getMetadataRole(rel({ metadata: { role: 42 } }))).toBeUndefined()
  })
  it('returns undefined when metadata is empty', () => {
    expect(getMetadataRole(rel())).toBeUndefined()
  })
})

describe('getOrbitForRole', () => {
  it.each(['père', 'mère', 'beau-père', 'belle-mère'])('role %s → orbit 1', (role) => {
    expect(getOrbitForRole(role, 'PARENT_CHILD', false)).toBe(1)
  })
  it.each(['époux/épouse', 'fils', 'fille', 'enfant adopté(e)'])('role %s → orbit 2', (role) => {
    expect(getOrbitForRole(role, 'UNION', true)).toBe(2)
  })
  it.each(['frère', 'sœur', 'demi-frère', 'demi-sœur', 'grand-père', 'grand-mère'])('role %s → orbit 3', (role) => {
    expect(getOrbitForRole(role, 'SIBLING', true)).toBe(3)
  })
  it.each(['oncle', 'tante', 'cousin', 'cousine'])('role %s → orbit 4', (role) => {
    expect(getOrbitForRole(role, 'SIBLING', true)).toBe(4)
  })
  it.each(['arrière-grand-père', 'arrière-grand-mère', 'arrière-arrière-grand-père', 'arrière-arrière-grand-mère'])('role %s → orbit 5', (role) => {
    expect(getOrbitForRole(role, 'PARENT_CHILD', false)).toBe(5)
  })
  it('UNION without role → orbit 2', () => {
    expect(getOrbitForRole(undefined, 'UNION', true)).toBe(2)
  })
  it('PARENT_CHILD isPersonA=true (centre=parent) → orbit 2', () => {
    expect(getOrbitForRole(undefined, 'PARENT_CHILD', true)).toBe(2)
  })
  it('PARENT_CHILD isPersonA=false (centre=enfant) → orbit 3', () => {
    expect(getOrbitForRole(undefined, 'PARENT_CHILD', false)).toBe(3)
  })
  it('SIBLING → orbit 3', () => {
    expect(getOrbitForRole(undefined, 'SIBLING', true)).toBe(3)
  })
  it('HALF_SIBLING → orbit 3', () => {
    expect(getOrbitForRole(undefined, 'HALF_SIBLING', false)).toBe(3)
  })
  it('STEP isPersonA=false → orbit 1', () => {
    expect(getOrbitForRole(undefined, 'STEP', false)).toBe(1)
  })
  it('STEP isPersonA=true → orbit 4', () => {
    expect(getOrbitForRole(undefined, 'STEP', true)).toBe(4)
  })
  it('ADOPTION isPersonA=true → orbit 2', () => {
    expect(getOrbitForRole(undefined, 'ADOPTION', true)).toBe(2)
  })
  it('ADOPTION isPersonA=false → orbit 4', () => {
    expect(getOrbitForRole(undefined, 'ADOPTION', false)).toBe(4)
  })
  it('unknown role string → orbit 5', () => {
    expect(getOrbitForRole('cousin-germain', 'SIBLING', true)).toBe(5)
  })
})

const mockRel = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD', role?: string): Relationship => ({
  id: `${a}-${b}`, person_a_id: a, person_b_id: b, type,
  metadata: role ? { role } : {},
})

describe('computeCosmosLayout', () => {
  it('returns empty when personIds is empty', () => {
    const result = computeCosmosLayout([], [], 'any')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toEqual([])
  })
  it('places center at orbit 0', () => {
    const result = computeCosmosLayout(['p1'], [], 'p1')
    expect(result.nodes[0]).toMatchObject({ id: 'p1', orbit: 0, angle: 0 })
  })
  it('places père at orbit 1', () => {
    const result = computeCosmosLayout(
      ['centre', 'pere'],
      [mockRel('pere', 'centre', 'PARENT_CHILD', 'père')],
      'centre'
    )
    expect(result.nodes.find(n => n.id === 'pere')?.orbit).toBe(1)
  })
  it('distributes angles uniformly', () => {
    const rels = [
      mockRel('a', 'centre', 'PARENT_CHILD', 'père'),
      mockRel('b', 'centre', 'PARENT_CHILD', 'mère'),
    ]
    const result = computeCosmosLayout(['centre', 'a', 'b'], rels, 'centre')
    const orbit1 = result.nodes.filter(n => n.orbit === 1)
    expect(orbit1).toHaveLength(2)
    const angles = orbit1.map(n => n.angle).sort((x, y) => x - y)
    expect(Math.abs(angles[1] - angles[0])).toBeCloseTo(Math.PI, 5)
  })
  it('marks unconnected persons as orphans', () => {
    const result = computeCosmosLayout(['p1', 'p2'], [], 'p1')
    expect(result.orphans).toContain('p2')
  })
  it('ORBIT_RADII has keys 0 through 5', () => {
    for (let i = 0; i <= 5; i++) {
      expect(ORBIT_RADII[i]).toBeGreaterThanOrEqual(0)
    }
  })
})
