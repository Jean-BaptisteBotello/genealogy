import { describe, it, expect } from 'vitest'
import { parsePayload } from '../suggestions'

describe('parsePayload', () => {
  it('validates EDIT_PERSON with partial fields', () => {
    const result = parsePayload('EDIT_PERSON', { prenom: 'Marie' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({ prenom: 'Marie' })
  })

  it('validates ADD_PERSON with required fields', () => {
    const result = parsePayload('ADD_PERSON', { prenom: 'Jean', nom: 'Dupont' })
    expect(result.ok).toBe(true)
  })

  it('rejects ADD_PERSON missing nom', () => {
    const result = parsePayload('ADD_PERSON', { prenom: 'Jean' })
    expect(result.ok).toBe(false)
  })

  it('validates ADD_RELATIONSHIP', () => {
    const result = parsePayload('ADD_RELATIONSHIP', {
      person_a_id: '123e4567-e89b-12d3-a456-426614174000',
      person_b_id: '123e4567-e89b-12d3-a456-426614174001',
      type: 'UNION',
    })
    expect(result.ok).toBe(true)
  })

  it('returns empty object for DELETE_PERSON', () => {
    const result = parsePayload('DELETE_PERSON', {})
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({})
  })

  it('returns empty object for DELETE_RELATIONSHIP', () => {
    const result = parsePayload('DELETE_RELATIONSHIP', {})
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({})
  })

  it('rejects invalid ADD_RELATIONSHIP type', () => {
    const result = parsePayload('ADD_RELATIONSHIP', {
      person_a_id: '123e4567-e89b-12d3-a456-426614174000',
      person_b_id: '123e4567-e89b-12d3-a456-426614174001',
      type: 'INVALID',
    })
    expect(result.ok).toBe(false)
  })
})
