import { describe, it, expect } from 'vitest'
import { computeSablierLayout } from '../sablier/sablierLayout'
import type { Relationship } from '@/lib/types/database'

const rel = (id: string, a: string, b: string, type: string, meta = {}): Relationship => ({
  id, person_a_id: a, person_b_id: b, type: type as any, metadata: meta
})

describe('computeSablierLayout', () => {
  it('places center person at generation 0', () => {
    const { nodes } = computeSablierLayout(['jb'], [], 'jb')
    expect(nodes[0].generation).toBe(0)
  })

  it('places parents one generation above (smaller y)', () => {
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD')]
    const { nodes } = computeSablierLayout(['jb', 'dad'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const dadNode = nodes.find(n => n.id === 'dad')!
    expect(dadNode.y).toBeLessThan(jbNode.y)
    expect(dadNode.generation).toBe(-1)
  })

  it('places grandparents two generations above', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'grandpa', 'dad', 'PARENT_CHILD'),
    ]
    const { nodes } = computeSablierLayout(['jb', 'dad', 'grandpa'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const gpNode = nodes.find(n => n.id === 'grandpa')!
    expect(gpNode.y).toBeLessThan(jbNode.y)
    expect(gpNode.generation).toBe(-2)
  })

  it('places spouses on same generation', () => {
    const rels = [rel('r1', 'jb', 'wife', 'UNION')]
    const { nodes } = computeSablierLayout(['jb', 'wife'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const wifeNode = nodes.find(n => n.id === 'wife')!
    expect(wifeNode.generation).toBe(jbNode.generation)
  })

  it('places siblings on same generation via shared parent', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'dad', 'sis', 'PARENT_CHILD'),
    ]
    const { nodes } = computeSablierLayout(['jb', 'sis', 'dad'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const sisNode = nodes.find(n => n.id === 'sis')!
    expect(sisNode.generation).toBe(jbNode.generation)
  })

  it('handles SIBLING relationship type', () => {
    const rels = [rel('r1', 'jb', 'sis', 'SIBLING')]
    const { nodes } = computeSablierLayout(['jb', 'sis'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const sisNode = nodes.find(n => n.id === 'sis')!
    expect(sisNode.generation).toBe(jbNode.generation)
  })

  it('handles ADOPTION as parent-child', () => {
    const rels = [rel('r1', 'adoptive_dad', 'jb', 'ADOPTION')]
    const { nodes } = computeSablierLayout(['jb', 'adoptive_dad'], rels, 'jb')
    const dadNode = nodes.find(n => n.id === 'adoptive_dad')!
    expect(dadNode.generation).toBe(-1)
  })

  it('identifies orphans (unconnected persons)', () => {
    const { orphans } = computeSablierLayout(['jb', 'stranger'], [], 'jb')
    expect(orphans).toContain('stranger')
  })

  it('oldest generation gets smallest y value', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'grandpa', 'dad', 'PARENT_CHILD'),
    ]
    const { nodes } = computeSablierLayout(['jb', 'dad', 'grandpa'], rels, 'jb')
    const sorted = [...nodes].sort((a, b) => a.generation - b.generation)
    expect(sorted[0].y).toBeLessThan(sorted[sorted.length - 1].y)
  })
})
