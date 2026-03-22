import type { Relationship } from '@/lib/types/database'

export const ORBIT_RADII: Record<number, number> = {
  0: 0,
  1: 80,
  2: 130,
  3: 200,
  4: 280,
}

export interface PositionedNode {
  id: string
  orbit: number
  x: number
  y: number
}

export interface CosmosLayoutResult {
  nodes: PositionedNode[]
  orphans: string[]
}

export function computeCosmosLayout(
  personIds: string[],
  relationships: Relationship[],
  centerId: string
): CosmosLayoutResult {
  if (personIds.length === 0) {
    return { nodes: [], orphans: [] }
  }

  if (!personIds.includes(centerId)) {
    return { nodes: [], orphans: personIds.slice() }
  }

  // Build adjacency: for each person, list { neighborId, orbit offset based on relationship type }
  // BFS to assign orbit levels
  // orbit 0 = center
  // 1-hop active UNION → orbit 1
  // 1-hop ended UNION or any other relationship → orbit 2
  // 2-hop → orbit 3
  // 3+ hop → orbit 4

  // Map: personId → assigned orbit
  const orbitMap = new Map<string, number>()
  orbitMap.set(centerId, 0)

  // BFS queue entries: { id, hopCount }
  // We track hop count and for the first hop we distinguish UNION vs non-UNION
  const queue: Array<{ id: string; hopCount: number }> = [{ id: centerId, hopCount: 0 }]
  const visited = new Set<string>([centerId])

  while (queue.length > 0) {
    const { id: current, hopCount } = queue.shift()!

    for (const rel of relationships) {
      let neighbor: string | null = null

      if (rel.person_a_id === current) {
        neighbor = rel.person_b_id
      } else if (rel.person_b_id === current) {
        neighbor = rel.person_a_id
      }

      if (neighbor === null || !personIds.includes(neighbor) || visited.has(neighbor)) {
        continue
      }

      visited.add(neighbor)

      let orbit: number
      if (hopCount === 0) {
        // Direct neighbor of center
        const isActiveUnion =
          rel.type === 'UNION' && rel.metadata?.ended !== true
        orbit = isActiveUnion ? 1 : 2
      } else if (hopCount === 1) {
        orbit = 3
      } else {
        orbit = 4
      }

      orbitMap.set(neighbor, orbit)
      queue.push({ id: neighbor, hopCount: hopCount + 1 })
    }
  }

  // Collect orphans: persons not visited via BFS
  const orphans: string[] = personIds.filter(id => !orbitMap.has(id))

  // Group visited nodes by orbit
  const orbitGroups = new Map<number, string[]>()
  for (const [id, orbit] of orbitMap.entries()) {
    if (!orbitGroups.has(orbit)) {
      orbitGroups.set(orbit, [])
    }
    orbitGroups.get(orbit)!.push(id)
  }

  // Position nodes
  const nodes: PositionedNode[] = []

  for (const [orbit, ids] of orbitGroups.entries()) {
    const radius = ORBIT_RADII[orbit] ?? ORBIT_RADII[4]
    const count = ids.length

    ids.forEach((id, i) => {
      let x: number
      let y: number

      if (orbit === 0) {
        x = 0
        y = 0
      } else {
        const angle = (2 * Math.PI * i) / count
        x = Math.cos(angle) * radius
        y = Math.sin(angle) * radius
      }

      nodes.push({ id, orbit, x, y })
    })
  }

  return { nodes, orphans }
}
