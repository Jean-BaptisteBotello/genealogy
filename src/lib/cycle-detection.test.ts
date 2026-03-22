import { describe, it, expect } from 'vitest'

type R = { person_a_id: string; person_b_id: string; type: string }

function parentChild(parentId: string, childId: string): R {
  return { person_a_id: parentId, person_b_id: childId, type: 'PARENT_CHILD' }
}

describe('hasAncestorCycle', () => {
  it('returns false for an empty relationship list', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    expect(hasAncestorCycle('child', 'parent', [])).toBe(false)
  })

  it('returns false when there is no cycle risk', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [parentChild('grandpa', 'parent')]
    expect(hasAncestorCycle('child', 'parent', rels)).toBe(false)
  })

  it('returns true for a direct cycle (A → B, propose B → A)', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [parentChild('A', 'B')]
    expect(hasAncestorCycle('A', 'B', rels)).toBe(true)
  })

  it('returns true for a transitive cycle (A→B→C, propose C→A)', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [parentChild('A', 'B'), parentChild('B', 'C')]
    expect(hasAncestorCycle('A', 'C', rels)).toBe(true)
  })

  it('treats ADOPTION the same as PARENT_CHILD', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [
      { person_a_id: 'A', person_b_id: 'B', type: 'ADOPTION' },
    ]
    expect(hasAncestorCycle('A', 'B', rels)).toBe(true)
  })

  it('ignores UNION relationships for cycle detection', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [
      { person_a_id: 'A', person_b_id: 'B', type: 'UNION' },
    ]
    expect(hasAncestorCycle('A', 'B', rels)).toBe(false)
  })

  it('returns true when personId equals proposedParentId (self-loop)', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    expect(hasAncestorCycle('A', 'A', [])).toBe(true)
  })
})
