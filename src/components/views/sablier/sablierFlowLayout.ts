import type { Person, Relationship } from '@/lib/types/database'

const ROW_HEIGHT = 200
const COL_GAP = 40
const CARD_W = 360
const CARD_H = 70
const UNION_PAD = 20
const CANVAS_PAD = 80
const DEFAULT_CANVAS_W = 900

export interface FlowNode {
  id: string
  generation: number
  x: number
  y: number
  role?: string
}

export interface FlowUnion {
  personA: FlowNode
  personB: FlowNode
  x: number
  y: number
  width: number
  height: number
}

export interface FlowConnection {
  fromId: string
  toId: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

export interface FlowLayoutResult {
  nodes: FlowNode[]
  unions: FlowUnion[]
  connections: FlowConnection[]
  siblings: FlowNode[]
  orphans: string[]
  totalHeight: number
  totalWidth: number
  genLabels: { generation: number; y: number }[]
}

type MinPerson = Pick<Person, 'id' | 'prenom' | 'nom' | 'date_naissance' | 'date_deces'>

export function computeFlowLayout(
  persons: MinPerson[],
  relationships: Relationship[],
  centerId: string
): FlowLayoutResult {
  const empty: FlowLayoutResult = {
    nodes: [], unions: [], connections: [], siblings: [],
    orphans: [], totalHeight: 0, totalWidth: 0, genLabels: [],
  }

  if (!persons.some(p => p.id === centerId)) {
    return { ...empty, orphans: persons.map(p => p.id) }
  }

  // --- BFS to assign generations ---
  const genMap = new Map<string, number>()
  const roleMap = new Map<string, string>()
  genMap.set(centerId, 0)
  const queue: { id: string; gen: number }[] = [{ id: centerId, gen: 0 }]
  const personIds = new Set(persons.map(p => p.id))

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!
    for (const rel of relationships) {
      if (rel.type === 'PARENT_CHILD' || rel.type === 'ADOPTION') {
        if (rel.person_b_id === id && personIds.has(rel.person_a_id) && !genMap.has(rel.person_a_id)) {
          genMap.set(rel.person_a_id, gen - 1)
          queue.push({ id: rel.person_a_id, gen: gen - 1 })
          const role = (rel.metadata as { role?: string })?.role
          if (role) roleMap.set(rel.person_a_id, role)
        }
        if (rel.person_a_id === id && personIds.has(rel.person_b_id) && !genMap.has(rel.person_b_id)) {
          genMap.set(rel.person_b_id, gen + 1)
          queue.push({ id: rel.person_b_id, gen: gen + 1 })
          const role = (rel.metadata as { role?: string })?.role
          if (role) roleMap.set(rel.person_b_id, role)
        }
      }
      if (rel.type === 'UNION') {
        const partnerId = rel.person_a_id === id ? rel.person_b_id
          : rel.person_b_id === id ? rel.person_a_id : null
        if (partnerId && personIds.has(partnerId) && !genMap.has(partnerId)) {
          genMap.set(partnerId, gen)
          queue.push({ id: partnerId, gen })
        }
      }
      if (rel.type === 'SIBLING' || rel.type === 'HALF_SIBLING' || rel.type === 'STEP') {
        const sibId = rel.person_a_id === id ? rel.person_b_id
          : rel.person_b_id === id ? rel.person_a_id : null
        if (sibId && personIds.has(sibId) && !genMap.has(sibId)) {
          genMap.set(sibId, gen)
          queue.push({ id: sibId, gen })
        }
      }
    }
  }

  // --- Detect unions ---
  const unionPairs = new Map<string, [string, string]>()
  for (const rel of relationships) {
    if (rel.type === 'UNION' && genMap.has(rel.person_a_id) && genMap.has(rel.person_b_id)) {
      const key = [rel.person_a_id, rel.person_b_id].sort().join(':')
      if (!unionPairs.has(key)) {
        unionPairs.set(key, [rel.person_a_id, rel.person_b_id])
      }
    }
  }
  const inUnion = new Set<string>()
  for (const [a, b] of unionPairs.values()) {
    inUnion.add(a)
    inUnion.add(b)
  }

  // --- Siblings: gen 0, not center ---
  const siblingIds = new Set<string>()
  for (const [id, gen] of genMap) {
    if (gen === 0 && id !== centerId) siblingIds.add(id)
  }

  // --- Group by generation ---
  const byGen = new Map<number, string[]>()
  for (const [id, gen] of genMap) {
    if (!byGen.has(gen)) byGen.set(gen, [])
    byGen.get(gen)!.push(id)
  }

  const gens = [...byGen.keys()].sort((a, b) => a - b)
  const minGen = gens[0] ?? 0

  // --- Position elements ---
  const nodes: FlowNode[] = []
  const unions: FlowUnion[] = []
  const positioned = new Map<string, { x: number; y: number }>()

  for (const gen of gens) {
    const ids = byGen.get(gen)!
    const rowY = CANVAS_PAD + (gen - minGen) * ROW_HEIGHT

    const unionGroupsInGen: [string, string][] = []
    const soloIds: string[] = []
    const processedInUnion = new Set<string>()

    for (const id of ids) {
      if (siblingIds.has(id)) continue
      if (inUnion.has(id) && !processedInUnion.has(id)) {
        for (const [a, b] of unionPairs.values()) {
          if ((a === id || b === id) && genMap.get(a) === gen && genMap.get(b) === gen) {
            unionGroupsInGen.push([a, b])
            processedInUnion.add(a)
            processedInUnion.add(b)
          }
        }
      } else if (!processedInUnion.has(id)) {
        soloIds.push(id)
      }
    }

    const unionW = CARD_W + UNION_PAD * 2
    const totalItems = unionGroupsInGen.length + soloIds.length
    const totalWidth = unionGroupsInGen.length * unionW
      + soloIds.length * CARD_W
      + Math.max(0, totalItems - 1) * COL_GAP

    let curX = CANVAS_PAD + Math.max(0, (DEFAULT_CANVAS_W - CANVAS_PAD * 2 - totalWidth) / 2)

    for (const [aId, bId] of unionGroupsInGen) {
      const ux = curX
      const uy = rowY
      const nodeA: FlowNode = { id: aId, generation: gen, x: ux + UNION_PAD, y: uy + UNION_PAD, role: roleMap.get(aId) }
      const nodeB: FlowNode = { id: bId, generation: gen, x: ux + UNION_PAD, y: uy + UNION_PAD + CARD_H + 12, role: roleMap.get(bId) }
      nodes.push(nodeA, nodeB)
      positioned.set(aId, { x: nodeA.x + CARD_W / 2, y: nodeA.y })
      positioned.set(bId, { x: nodeB.x + CARD_W / 2, y: nodeB.y })
      unions.push({
        personA: nodeA, personB: nodeB,
        x: ux, y: uy,
        width: unionW, height: CARD_H * 2 + 12 + UNION_PAD * 2,
      })
      curX += unionW + COL_GAP
    }

    for (const id of soloIds) {
      const node: FlowNode = { id, generation: gen, x: curX, y: rowY, role: roleMap.get(id) }
      nodes.push(node)
      positioned.set(id, { x: curX + CARD_W / 2, y: rowY })
      curX += CARD_W + COL_GAP
    }
  }

  // --- Siblings ---
  const siblings: FlowNode[] = []
  const centerPos = positioned.get(centerId)
  if (centerPos) {
    let sibX = centerPos.x + CARD_W / 2 + COL_GAP + 60
    for (const id of siblingIds) {
      const node: FlowNode = { id, generation: 0, x: sibX, y: centerPos.y, role: undefined }
      siblings.push(node)
      positioned.set(id, { x: sibX + CARD_W / 2, y: centerPos.y })
      sibX += CARD_W + COL_GAP
    }
  }

  // --- Connections ---
  // Use a deduplicated set: one connection per parent→child pair
  const connections: FlowConnection[] = []
  const connSeen = new Set<string>()
  for (const rel of relationships) {
    if (rel.type !== 'PARENT_CHILD' && rel.type !== 'ADOPTION') continue
    const key = `${rel.person_a_id}→${rel.person_b_id}`
    if (connSeen.has(key)) continue
    connSeen.add(key)
    const parentPos = positioned.get(rel.person_a_id)
    const childPos = positioned.get(rel.person_b_id)
    if (!parentPos || !childPos) continue

    // For unions: connect from the center-bottom of the union group, not individual card
    // Find if parent is in a union group
    const parentUnion = unions.find(u => u.personA.id === rel.person_a_id || u.personB.id === rel.person_a_id)
    const childUnion = unions.find(u => u.personA.id === rel.person_b_id || u.personB.id === rel.person_b_id)

    const fromX = parentUnion ? parentUnion.x + parentUnion.width / 2 : parentPos.x
    const fromY = parentUnion ? parentUnion.y + parentUnion.height : parentPos.y + CARD_H
    const toX = childUnion ? childUnion.x + childUnion.width / 2 : childPos.x
    const toY = childUnion ? childUnion.y : childPos.y

    connections.push({ fromId: rel.person_a_id, toId: rel.person_b_id, fromX, fromY, toX, toY })
  }

  // --- Orphans ---
  const connected = new Set(genMap.keys())
  const orphans = persons.filter(p => !connected.has(p.id)).map(p => p.id)

  // --- Gen labels ---
  const genLabels = gens.map(gen => ({
    generation: gen,
    y: CANVAS_PAD + (gen - minGen) * ROW_HEIGHT,
  }))

  // --- Canvas dimensions ---
  let maxX = 0, maxY = 0
  for (const { x, y } of positioned.values()) {
    if (x + CARD_W > maxX) maxX = x + CARD_W
    if (y + CARD_H > maxY) maxY = y + CARD_H
  }

  return {
    nodes, unions, connections, siblings, orphans,
    totalWidth: Math.max(maxX + CANVAS_PAD, DEFAULT_CANVAS_W),
    totalHeight: maxY + CANVAS_PAD * 2,
    genLabels,
  }
}
