import type { Relationship, RelationshipType } from '@/lib/types/database'

export const ORBIT_RADII: Record<number, number> = {
  0: 0, 1: 90, 2: 155, 3: 215, 4: 265, 5: 310,
}

export interface PositionedNode {
  id: string
  orbit: number
  angle: number
}

export interface CosmosLayoutResult {
  nodes: PositionedNode[]
  orphans: string[]
}

export function getMetadataRole(rel: Relationship): string | undefined {
  const meta = rel.metadata as { role?: unknown }
  return typeof meta?.role === 'string' ? meta.role : undefined
}

const ORBIT_1_ROLES = new Set(['père', 'mère', 'beau-père', 'belle-mère'])
const ORBIT_2_ROLES = new Set(['époux/épouse', 'fils', 'fille', 'enfant adopté(e)'])
const ORBIT_3_ROLES = new Set(['frère', 'sœur', 'demi-frère', 'demi-sœur', 'grand-père', 'grand-mère'])
const ORBIT_4_ROLES = new Set(['oncle', 'tante', 'cousin', 'cousine'])
const ORBIT_5_ROLES = new Set([
  'arrière-grand-père', 'arrière-grand-mère',
  'arrière-arrière-grand-père', 'arrière-arrière-grand-mère',
])

export function getOrbitForRole(
  role: string | undefined,
  type: RelationshipType,
  isPersonA: boolean
): number {
  if (role !== undefined) {
    if (ORBIT_1_ROLES.has(role)) return 1
    if (ORBIT_2_ROLES.has(role)) return 2
    if (ORBIT_3_ROLES.has(role)) return 3
    if (ORBIT_4_ROLES.has(role)) return 4
    if (ORBIT_5_ROLES.has(role)) return 5
    return 5
  }
  switch (type) {
    case 'UNION':        return 2
    case 'PARENT_CHILD': return isPersonA ? 2 : 3
    case 'ADOPTION':     return isPersonA ? 2 : 4
    case 'SIBLING':      return 3
    case 'HALF_SIBLING':  return 3
    case 'STEP':         return isPersonA ? 4 : 1
    default:             return 5
  }
}

export function computeCosmosLayout(
  personIds: string[],
  relationships: Relationship[],
  centerId: string
): CosmosLayoutResult {
  if (personIds.length === 0) return { nodes: [], orphans: [] }
  if (!personIds.includes(centerId)) return { nodes: [], orphans: personIds.slice() }

  const orbitMap = new Map<string, number>([[centerId, 0]])

  for (const rel of relationships) {
    let neighborId: string | null = null
    let isPersonA: boolean

    if (rel.person_a_id === centerId && personIds.includes(rel.person_b_id)) {
      neighborId = rel.person_b_id
      isPersonA = true
    } else if (rel.person_b_id === centerId && personIds.includes(rel.person_a_id)) {
      neighborId = rel.person_a_id
      isPersonA = false
    } else {
      continue
    }

    if (orbitMap.has(neighborId)) continue

    const role = getMetadataRole(rel)
    const orbit = getOrbitForRole(role, rel.type, isPersonA)
    orbitMap.set(neighborId, orbit)
  }

  const orphans = personIds.filter(id => !orbitMap.has(id))

  const orbitGroups = new Map<number, string[]>()
  for (const [id, orbit] of orbitMap) {
    if (!orbitGroups.has(orbit)) orbitGroups.set(orbit, [])
    orbitGroups.get(orbit)!.push(id)
  }

  const nodes: PositionedNode[] = []
  for (const [orbit, ids] of orbitGroups) {
    ids.forEach((id, i) => {
      const angle = orbit === 0 ? 0 : (2 * Math.PI * i) / ids.length
      nodes.push({ id, orbit, angle })
    })
  }

  return { nodes, orphans }
}
