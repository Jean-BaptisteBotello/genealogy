import type { Relationship } from '@/lib/types/database'

export const ROW_HEIGHT = 140
export const COL_WIDTH = 220

export interface SablierNode {
  id: string
  generation: number
  x: number
  y: number
}

export interface SablierLayoutResult {
  nodes: SablierNode[]
  orphans: string[]
}

/**
 * Compute Sablier layout: center person at generation 0 (bottom),
 * ancestors going up (negative generations = smaller y).
 */
export function computeSablierLayout(
  personIds: string[],
  relationships: Relationship[],
  centerId: string
): SablierLayoutResult {
  if (!personIds.includes(centerId)) {
    return { nodes: [], orphans: personIds.slice() }
  }

  // BFS to assign generations
  const generationMap = new Map<string, number>()
  generationMap.set(centerId, 0)
  const queue: { id: string; gen: number }[] = [{ id: centerId, gen: 0 }]

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!

    for (const rel of relationships) {
      // PARENT_CHILD + ADOPTION: person_a = parent, person_b = child
      if (rel.type === 'PARENT_CHILD' || rel.type === 'ADOPTION') {
        if (rel.person_b_id === id) {
          const parentId = rel.person_a_id
          if (personIds.includes(parentId) && !generationMap.has(parentId)) {
            generationMap.set(parentId, gen - 1)
            queue.push({ id: parentId, gen: gen - 1 })
          }
        }
        if (rel.person_a_id === id) {
          const childId = rel.person_b_id
          if (personIds.includes(childId) && !generationMap.has(childId)) {
            generationMap.set(childId, gen + 1)
            queue.push({ id: childId, gen: gen + 1 })
          }
        }
      }

      // UNION: same generation
      if (rel.type === 'UNION') {
        const partnerId =
          rel.person_a_id === id ? rel.person_b_id :
          rel.person_b_id === id ? rel.person_a_id : null
        if (partnerId && personIds.includes(partnerId) && !generationMap.has(partnerId)) {
          generationMap.set(partnerId, gen)
          queue.push({ id: partnerId, gen })
        }
      }

      // SIBLING / HALF_SIBLING / STEP: same generation
      if (rel.type === 'SIBLING' || rel.type === 'HALF_SIBLING' || rel.type === 'STEP') {
        const siblingId =
          rel.person_a_id === id ? rel.person_b_id :
          rel.person_b_id === id ? rel.person_a_id : null
        if (siblingId && personIds.includes(siblingId) && !generationMap.has(siblingId)) {
          generationMap.set(siblingId, gen)
          queue.push({ id: siblingId, gen })
        }
      }
    }
  }

  // Group by generation
  const byGeneration = new Map<number, string[]>()
  for (const [id, gen] of generationMap) {
    if (!byGeneration.has(gen)) byGeneration.set(gen, [])
    byGeneration.get(gen)!.push(id)
  }

  // Find min generation (most ancient)
  const gens = [...byGeneration.keys()]
  const minGen = Math.min(...gens)

  // Position: oldest at top (y=0), youngest at bottom
  const nodes: SablierNode[] = []
  for (const [gen, ids] of byGeneration) {
    const totalWidth = (ids.length - 1) * COL_WIDTH
    ids.forEach((id, i) => {
      nodes.push({
        id,
        generation: gen,
        x: ids.length === 1 ? 0 : -totalWidth / 2 + i * COL_WIDTH,
        y: (gen - minGen) * ROW_HEIGHT,
      })
    })
  }

  const connected = new Set(generationMap.keys())
  const orphans = personIds.filter(id => !connected.has(id))

  return { nodes, orphans }
}
