import { describe, it, expect } from 'vitest'
import { detectBranches } from '../branch-detection'
import type { Relationship } from '@/lib/types/database'

const rel = (id: string, a: string, b: string, type: string): Relationship => ({
  id, person_a_id: a, person_b_id: b, type: type as any, metadata: {}
})

describe('detectBranches', () => {
  it('detects paternal and maternal sides from a center person', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'mom', 'jb', 'PARENT_CHILD'),
      rel('r3', 'grandpa_dad', 'dad', 'PARENT_CHILD'),
      rel('r4', 'grandma_mom', 'mom', 'PARENT_CHILD'),
    ]
    const persons = [
      { id: 'jb', prenom: 'Pierre', nom: 'Dupont' },
      { id: 'dad', prenom: 'Michel', nom: 'Dupont' },
      { id: 'mom', prenom: 'Catherine', nom: 'Lefebvre' },
      { id: 'grandpa_dad', prenom: 'Jacques', nom: 'Dupont' },
      { id: 'grandma_mom', prenom: 'Marie', nom: 'Lefebvre' },
    ]

    const branches = detectBranches(persons, rels, 'jb')

    expect(branches.length).toBeGreaterThanOrEqual(2)
    const branchNames = branches.map(b => b.name)
    expect(branchNames.some(n => n.includes('Dupont'))).toBe(true)
    expect(branchNames.some(n => n.includes('Lefebvre'))).toBe(true)
  })

  it('assigns each parent to a branch', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'mom', 'jb', 'PARENT_CHILD'),
    ]
    const persons = [
      { id: 'jb', prenom: 'JB', nom: 'B' },
      { id: 'dad', prenom: 'D', nom: 'B' },
      { id: 'mom', prenom: 'M', nom: 'P' },
    ]
    const branches = detectBranches(persons, rels, 'jb')
    const allMembers = branches.flatMap(b => b.members)
    expect(allMembers).toContain('dad')
    expect(allMembers).toContain('mom')
  })

  it('includes spouses in their partner branch', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'grandpa', 'dad', 'PARENT_CHILD'),
      rel('r3', 'grandpa', 'grandma', 'UNION'),
    ]
    const persons = [
      { id: 'jb', prenom: 'JB', nom: 'B' },
      { id: 'dad', prenom: 'D', nom: 'B' },
      { id: 'grandpa', prenom: 'GP', nom: 'B' },
      { id: 'grandma', prenom: 'GM', nom: 'X' },
    ]
    const branches = detectBranches(persons, rels, 'jb')
    const dadBranch = branches.find(b => b.members.includes('dad'))!
    expect(dadBranch.members).toContain('grandma')
  })

  it('returns empty array if no relationships', () => {
    const branches = detectBranches([{ id: 'jb', prenom: 'JB', nom: 'B' }], [], 'jb')
    expect(branches).toEqual([])
  })

  it('returns empty array if no parents found', () => {
    const rels = [rel('r1', 'jb', 'child', 'PARENT_CHILD')]
    const persons = [
      { id: 'jb', prenom: 'JB', nom: 'B' },
      { id: 'child', prenom: 'C', nom: 'B' },
    ]
    const branches = detectBranches(persons, rels, 'jb')
    expect(branches).toEqual([])
  })
})
