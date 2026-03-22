/**
 * Returns true if making `proposedParentId` a parent of `personId` would create
 * an ancestry cycle. A cycle exists if `personId` is already an ancestor of
 * `proposedParentId`.
 * Convention: PARENT_CHILD/ADOPTION — person_a_id is the parent, person_b_id is the child.
 */
export function hasAncestorCycle(
  personId: string,
  proposedParentId: string,
  relationships: { person_a_id: string; person_b_id: string; type: string }[]
): boolean {
  const parentOf: Record<string, string[]> = {}
  for (const r of relationships) {
    if (r.type === 'PARENT_CHILD' || r.type === 'ADOPTION') {
      if (!parentOf[r.person_b_id]) parentOf[r.person_b_id] = []
      parentOf[r.person_b_id].push(r.person_a_id)
    }
  }

  const visited = new Set<string>()
  visited.add(proposedParentId)
  const queue = [proposedParentId]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === personId) return true
    for (const parent of parentOf[current] ?? []) {
      if (!visited.has(parent)) {
        visited.add(parent)
        queue.push(parent)
      }
    }
  }
  return false
}
