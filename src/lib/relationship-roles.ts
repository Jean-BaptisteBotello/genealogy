import type { Relationship, RelationshipType } from '@/lib/types/database'

// Roles that represent indirect/extended family links (skip generations or lateral)
const INDIRECT_ROLES = new Set([
  'grand-père', 'grand-mère',
  'arrière-grand-père', 'arrière-grand-mère',
  'arrière-arrière-grand-père', 'arrière-arrière-grand-mère',
  'oncle', 'tante',
  'cousin', 'cousine',
])

export function isIndirectRelationship(rel: Relationship): boolean {
  const meta = rel.metadata as { role?: unknown }
  if (typeof meta?.role === 'string') {
    return INDIRECT_ROLES.has(meta.role)
  }
  return false
}

export type RelationshipRole =
  | 'père' | 'mère'
  | 'fils' | 'fille'
  | 'frère' | 'sœur'
  | 'demi-frère' | 'demi-sœur'
  | 'époux/épouse'
  | 'beau-père' | 'belle-mère'
  | 'grand-père' | 'grand-mère'
  | 'arrière-grand-père' | 'arrière-grand-mère'
  | 'arrière-arrière-grand-père' | 'arrière-arrière-grand-mère'
  | 'oncle' | 'tante'
  | 'enfant adopté(e)'

export interface RelationshipDerivation {
  person_a_id: string
  person_b_id: string
  type: RelationshipType
  metadata: { role: RelationshipRole }
}

export function deriveRelationship(
  role: RelationshipRole,
  currentPersonId: string,
  otherPersonId: string
): RelationshipDerivation {
  const metadata = { role }

  const otherToCurrent = (type: RelationshipType): RelationshipDerivation => ({
    person_a_id: otherPersonId,
    person_b_id: currentPersonId,
    type,
    metadata,
  })

  const currentToOther = (type: RelationshipType): RelationshipDerivation => ({
    person_a_id: currentPersonId,
    person_b_id: otherPersonId,
    type,
    metadata,
  })

  switch (role) {
    case 'père':
    case 'mère':
    case 'grand-père':
    case 'grand-mère':
    case 'arrière-grand-père':
    case 'arrière-grand-mère':
    case 'arrière-arrière-grand-père':
    case 'arrière-arrière-grand-mère':
      return otherToCurrent('PARENT_CHILD')

    case 'beau-père':
    case 'belle-mère':
      return otherToCurrent('STEP')

    case 'oncle':
    case 'tante':
      return otherToCurrent('SIBLING')

    case 'fils':
    case 'fille':
      return currentToOther('PARENT_CHILD')

    case 'enfant adopté(e)':
      return currentToOther('ADOPTION')

    case 'frère':
    case 'sœur':
      return currentToOther('SIBLING')

    case 'demi-frère':
    case 'demi-sœur':
      return currentToOther('HALF_SIBLING')

    case 'époux/épouse':
      return currentToOther('UNION')

    default: {
      const _exhaustive: never = role
      throw new Error(`Unhandled RelationshipRole: ${_exhaustive}`)
    }
  }
}

export const ROLES_FAMILLE_DIRECTE: RelationshipRole[] = [
  'père', 'mère', 'fils', 'fille',
  'frère', 'sœur', 'demi-frère', 'demi-sœur',
  'époux/épouse', 'beau-père', 'belle-mère',
  'enfant adopté(e)',
]

export const ROLES_FAMILLE_ETENDUE: RelationshipRole[] = [
  'grand-père', 'grand-mère',
  'arrière-grand-père', 'arrière-grand-mère',
  'arrière-arrière-grand-père', 'arrière-arrière-grand-mère',
  'oncle', 'tante',
]
