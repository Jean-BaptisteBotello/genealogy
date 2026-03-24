import { describe, it, expect } from 'vitest'
import { deriveRelationship } from '@/lib/relationship-roles'

const CURRENT = 'person-current'
const OTHER = 'person-other'

describe('deriveRelationship', () => {
  describe('ascendants directs → PARENT_CHILD, other→current', () => {
    it.each(['père', 'mère', 'grand-père', 'grand-mère',
             'arrière-grand-père', 'arrière-grand-mère',
             'arrière-arrière-grand-père', 'arrière-arrière-grand-mère'] as const)(
      '%s',
      (role) => {
        const r = deriveRelationship(role, CURRENT, OTHER)
        expect(r.type).toBe('PARENT_CHILD')
        expect(r.person_a_id).toBe(OTHER)
        expect(r.person_b_id).toBe(CURRENT)
        expect(r.metadata.role).toBe(role)
      }
    )
  })

  describe('descendants → PARENT_CHILD, current→other', () => {
    it.each(['fils', 'fille'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('PARENT_CHILD')
      expect(r.person_a_id).toBe(CURRENT)
      expect(r.person_b_id).toBe(OTHER)
      expect(r.metadata.role).toBe(role)
    })
  })

  it('enfant adopté(e) → ADOPTION, current→other', () => {
    const r = deriveRelationship('enfant adopté(e)', CURRENT, OTHER)
    expect(r.type).toBe('ADOPTION')
    expect(r.person_a_id).toBe(CURRENT)
    expect(r.person_b_id).toBe(OTHER)
  })

  describe('fratrie → SIBLING, current→other', () => {
    it.each(['frère', 'sœur'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('SIBLING')
      expect(r.person_a_id).toBe(CURRENT)
      expect(r.person_b_id).toBe(OTHER)
    })
  })

  describe('demi-fratrie → HALF_SIBLING, current→other', () => {
    it.each(['demi-frère', 'demi-sœur'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('HALF_SIBLING')
      expect(r.person_a_id).toBe(CURRENT)
      expect(r.person_b_id).toBe(OTHER)
    })
  })

  describe('oncle/tante → SIBLING, other→current (pas PARENT_CHILD = pas de cycle check)', () => {
    it.each(['oncle', 'tante'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('SIBLING')
      expect(r.person_a_id).toBe(OTHER)   // other (oncle/tante) → current
      expect(r.person_b_id).toBe(CURRENT)
      expect(r.metadata.role).toBe(role)
    })
  })

  it('époux/épouse → UNION, current→other', () => {
    const r = deriveRelationship('époux/épouse', CURRENT, OTHER)
    expect(r.type).toBe('UNION')
    expect(r.person_a_id).toBe(CURRENT)
    expect(r.person_b_id).toBe(OTHER)
  })

  describe('beaux-parents → STEP, other→current', () => {
    it.each(['beau-père', 'belle-mère'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('STEP')
      expect(r.person_a_id).toBe(OTHER)
      expect(r.person_b_id).toBe(CURRENT)
    })
  })
})
