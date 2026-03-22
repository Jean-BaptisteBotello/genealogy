import type { Relationship } from '@/lib/types/database'

export const ROW_HEIGHT = 120
export const COL_WIDTH = 200

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

export function computeSablierLayout(
  personIds: string[],
  relationships: Relationship[],
  centerId: string
): SablierLayoutResult {
  if (!personIds.includes(centerId)) {
    return { nodes: [], orphans: personIds.slice() }
  }

  const generationMap = new Map<string, number>()
  generationMap.set(centerId, 0)

  const queue: { id: string; gen: number }[] = [{ id: centerId, gen: 0 }]

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!

    for (const rel of relationships) {
      if (rel.type === 'PARENT_CHILD') {
        // id is child → parent is one generation above
        if (rel.person_b_id === id) {
          const parentId = rel.person_a_id
          if (personIds.includes(parentId) && !generationMap.has(parentId)) {
            generationMap.set(parentId, gen - 1)
            queue.push({ id: parentId, gen: gen - 1 })
          }
        }
        // id is parent → child is one generation below
        if (rel.person_a_id === id) {
          const childId = rel.person_b_id
          if (personIds.includes(childId) && !generationMap.has(childId)) {
            generationMap.set(childId, gen + 1)
            queue.push({ id: childId, gen: gen + 1 })
          }
        }
      }

      if (rel.type === 'UNION' && rel.metadata?.ended !== true) {
        const partnerId =
          rel.person_a_id === id ? rel.person_b_id :
          rel.person_b_id === id ? rel.person_a_id : null
        if (partnerId && personIds.includes(partnerId) && !generationMap.has(partnerId)) {
          generationMap.set(partnerId, gen)
          queue.push({ id: partnerId, gen })
        }
      }
    }
  }

  // Group by generation for horizontal positioning
  const byGeneration = new Map<number, string[]>()
  for (const [id, gen] of generationMap) {
    if (!byGeneration.has(gen)) byGeneration.set(gen, [])
    byGeneration.get(gen)!.push(id)
  }

  const nodes: SablierNode[] = []
  for (const [gen, ids] of byGeneration) {
    const totalWidth = (ids.length - 1) * COL_WIDTH
    ids.forEach((id, i) => {
      nodes.push({
        id,
        generation: gen,
        x: ids.length === 1 ? 0 : -totalWidth / 2 + i * COL_WIDTH,
        y: gen * ROW_HEIGHT,
      })
    })
  }

  const connected = new Set(generationMap.keys())
  const orphans = personIds.filter(id => !connected.has(id))

  return { nodes, orphans }
}
