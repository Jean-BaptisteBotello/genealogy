import { describe, it, expect } from 'vitest'
import { computeFlowLayout } from '../sablier/sablierFlowLayout'
import type { Relationship } from '@/lib/types/database'

const rel = (id: string, a: string, b: string, type: string, meta: Record<string, unknown> = {}): Relationship => ({
  id, person_a_id: a, person_b_id: b, type: type as any, metadata: meta
})

const person = (id: string, prenom: string, nom: string) => ({
  id, prenom, nom,
  date_naissance: '1990-01-01' as string | null,
  date_deces: null as string | null,
  lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '', updated_at: '',
})

describe('computeFlowLayout', () => {
  it('places center person at generation 0', () => {
    const result = computeFlowLayout([person('jb', 'JB', 'B')], [], 'jb')
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].generation).toBe(0)
  })

  it('places parents at generation -1 with smaller y', () => {
    const persons = [person('jb', 'JB', 'B'), person('dad', 'Michel', 'B')]
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD')]
    const result = computeFlowLayout(persons, rels, 'jb')
    const dad = result.nodes.find(n => n.id === 'dad')!
    const jb = result.nodes.find(n => n.id === 'jb')!
    expect(dad.generation).toBe(-1)
    expect(dad.y).toBeLessThan(jb.y)
  })

  it('groups union partners', () => {
    const persons = [person('jb', 'JB', 'B'), person('dad', 'S', 'B'), person('mom', 'L', 'P')]
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'mom', 'jb', 'PARENT_CHILD'),
      rel('r3', 'dad', 'mom', 'UNION'),
    ]
    const result = computeFlowLayout(persons, rels, 'jb')
    expect(result.unions).toHaveLength(1)
    const ids = [result.unions[0].personA.id, result.unions[0].personB.id].sort()
    expect(ids).toEqual(['dad', 'mom'])
  })

  it('generates connections between parent and child', () => {
    const persons = [person('jb', 'JB', 'B'), person('dad', 'S', 'B')]
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD')]
    const result = computeFlowLayout(persons, rels, 'jb')
    const conn = result.connections.find(c => c.fromId === 'dad' && c.toId === 'jb')
    expect(conn).toBeDefined()
    expect(conn!.fromY).toBeLessThan(conn!.toY)
  })

  it('detects siblings at gen 0', () => {
    const persons = [person('jb', 'JB', 'B'), person('sis', 'Jade', 'B'), person('dad', 'S', 'B')]
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'dad', 'sis', 'PARENT_CHILD'),
    ]
    const result = computeFlowLayout(persons, rels, 'jb')
    expect(result.siblings.some(s => s.id === 'sis')).toBe(true)
  })

  it('identifies orphans', () => {
    const persons = [person('jb', 'JB', 'B'), person('stranger', 'X', 'Y')]
    const result = computeFlowLayout(persons, [], 'jb')
    expect(result.orphans).toContain('stranger')
  })

  it('computes totalHeight and totalWidth > 0', () => {
    const result = computeFlowLayout([person('jb', 'JB', 'B')], [], 'jb')
    expect(result.totalHeight).toBeGreaterThan(0)
    expect(result.totalWidth).toBeGreaterThan(0)
  })

  it('includes role from metadata', () => {
    const persons = [person('jb', 'JB', 'B'), person('dad', 'S', 'B')]
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD', { role: 'Père' })]
    const result = computeFlowLayout(persons, rels, 'jb')
    const dad = result.nodes.find(n => n.id === 'dad')!
    expect(dad.role).toBe('Père')
  })

  it('generates genLabels', () => {
    const persons = [person('jb', 'JB', 'B'), person('dad', 'S', 'B')]
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD')]
    const result = computeFlowLayout(persons, rels, 'jb')
    expect(result.genLabels.length).toBeGreaterThanOrEqual(2)
  })
})
