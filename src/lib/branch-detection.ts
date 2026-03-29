import type { Relationship } from '@/lib/types/database'

interface MinPerson {
  id: string
  prenom: string
  nom: string
}

export interface DetectedBranch {
  name: string
  members: string[]
  color: string
}

const BRANCH_COLORS = ['#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']

/**
 * Auto-detect family branches from a center person.
 * Strategy: find parents of center person, then trace each parent's
 * ancestry separately. Each parent's lineage = one branch, named by surname.
 */
export function detectBranches(
  persons: MinPerson[],
  relationships: Relationship[],
  centerId: string
): DetectedBranch[] {
  const personMap = new Map(persons.map(p => [p.id, p]))

  // Find direct parents of center person
  const parentIds = relationships
    .filter(r => r.type === 'PARENT_CHILD' && r.person_b_id === centerId)
    .map(r => r.person_a_id)
    .filter(id => personMap.has(id))

  if (parentIds.length === 0) return []

  const branches: DetectedBranch[] = []

  parentIds.forEach((parentId, index) => {
    const parent = personMap.get(parentId)!
    const members = new Set<string>()

    // BFS up from this parent
    const queue = [parentId]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (members.has(current)) continue
      members.add(current)

      for (const rel of relationships) {
        // Find parents of current
        if (rel.type === 'PARENT_CHILD' && rel.person_b_id === current) {
          if (personMap.has(rel.person_a_id) && !members.has(rel.person_a_id)) {
            queue.push(rel.person_a_id)
          }
        }
        // Include spouses
        if (rel.type === 'UNION') {
          const spouseId =
            rel.person_a_id === current ? rel.person_b_id :
            rel.person_b_id === current ? rel.person_a_id : null
          if (spouseId && personMap.has(spouseId) && !members.has(spouseId)) {
            queue.push(spouseId)
          }
        }
      }
    }

    branches.push({
      name: `Côté ${parent.nom}`,
      members: [...members],
      color: BRANCH_COLORS[index % BRANCH_COLORS.length],
    })
  })

  return branches
}
