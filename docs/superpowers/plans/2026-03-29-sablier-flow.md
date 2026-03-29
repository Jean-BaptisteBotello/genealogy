# Sablier Flow View Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ReactFlow-based Sablier view with a card-based flow layout using HTML/CSS + SVG connections.

**Architecture:** 3 new files (layout algorithm, React component, CSS). The layout algorithm computes positions via BFS, groups unions, and generates SVG connection coordinates. The React component renders cards, union containers, and an SVG layer. ViewRouter import is updated.

**Tech Stack:** React, TypeScript, CSS, SVG, Vitest

**Spec:** `docs/superpowers/specs/2026-03-29-sablier-flow-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/views/sablier/sablierFlowLayout.ts` | Create | BFS generation assignment, union grouping, x/y positioning, connection coords |
| `src/components/views/sablier/SablierFlowView.tsx` | Create | React component: cards, unions, SVG connections, interactions |
| `src/components/views/sablier/sablierFlow.css` | Create | All styles: cards, unions, grid background, gen labels |
| `src/components/views/ViewRouter.tsx` | Modify | Change import from SablierView to SablierFlowView |
| `src/components/views/__tests__/sablierFlowLayout.test.ts` | Create | Unit tests for layout algorithm |
| `src/components/views/__tests__/SablierFlowView.test.tsx` | Create | Component render tests |

---

## Chunk 1: Layout Algorithm + Tests

### Task 1: Write sablierFlowLayout.ts tests

**Files:**
- Create: `src/components/views/__tests__/sablierFlowLayout.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from 'vitest'
import { computeFlowLayout } from '../sablier/sablierFlowLayout'
import type { Relationship } from '@/lib/types/database'

const rel = (id: string, a: string, b: string, type: string, meta: Record<string, unknown> = {}): Relationship => ({
  id, person_a_id: a, person_b_id: b, type: type as any, metadata: meta, created_at: ''
})

const person = (id: string, prenom: string, nom: string, gender?: string) => ({
  id, prenom, nom,
  date_naissance: '1990-01-01' as string | null,
  date_deces: null as string | null,
})

describe('computeFlowLayout', () => {
  it('places center person at generation 0', () => {
    const persons = [person('jb', 'Pierre', 'Dupont')]
    const result = computeFlowLayout(persons, [], 'jb')
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].generation).toBe(0)
  })

  it('places parents at generation -1', () => {
    const persons = [
      person('jb', 'JB', 'B'),
      person('dad', 'Michel', 'B'),
    ]
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD')]
    const result = computeFlowLayout(persons, rels, 'jb')
    const dad = result.nodes.find(n => n.id === 'dad')!
    expect(dad.generation).toBe(-1)
    expect(dad.y).toBeLessThan(result.nodes.find(n => n.id === 'jb')!.y)
  })

  it('groups union partners', () => {
    const persons = [
      person('jb', 'JB', 'B'),
      person('dad', 'Michel', 'B'),
      person('mom', 'Catherine', 'P'),
    ]
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'mom', 'jb', 'PARENT_CHILD'),
      rel('r3', 'dad', 'mom', 'UNION'),
    ]
    const result = computeFlowLayout(persons, rels, 'jb')
    expect(result.unions).toHaveLength(1)
    expect(result.unions[0].personA.id).toBe('dad')
    expect(result.unions[0].personB.id).toBe('mom')
  })

  it('generates connections between parent and child', () => {
    const persons = [
      person('jb', 'JB', 'B'),
      person('dad', 'Michel', 'B'),
    ]
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD')]
    const result = computeFlowLayout(persons, rels, 'jb')
    expect(result.connections.length).toBeGreaterThan(0)
    const conn = result.connections.find(c => c.fromId === 'dad' && c.toId === 'jb')
    expect(conn).toBeDefined()
  })

  it('detects siblings at gen 0', () => {
    const persons = [
      person('jb', 'JB', 'B'),
      person('sis', 'Jade', 'B'),
      person('dad', 'Michel', 'B'),
    ]
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'dad', 'sis', 'PARENT_CHILD'),
    ]
    const result = computeFlowLayout(persons, rels, 'jb')
    expect(result.siblings.some(s => s.id === 'sis')).toBe(true)
  })

  it('identifies orphans', () => {
    const persons = [
      person('jb', 'JB', 'B'),
      person('stranger', 'X', 'Y'),
    ]
    const result = computeFlowLayout(persons, [], 'jb')
    expect(result.orphans).toContain('stranger')
  })

  it('computes totalHeight and totalWidth', () => {
    const persons = [person('jb', 'JB', 'B')]
    const result = computeFlowLayout(persons, [], 'jb')
    expect(result.totalHeight).toBeGreaterThan(0)
    expect(result.totalWidth).toBeGreaterThan(0)
  })

  it('includes role from metadata', () => {
    const persons = [
      person('jb', 'JB', 'B'),
      person('dad', 'Michel', 'B'),
    ]
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD', { role: 'Père' })]
    const result = computeFlowLayout(persons, rels, 'jb')
    const dad = result.nodes.find(n => n.id === 'dad')!
    expect(dad.role).toBe('Père')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ~/Genealogy && npx vitest run src/components/views/__tests__/sablierFlowLayout.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Commit test file**

```bash
git add src/components/views/__tests__/sablierFlowLayout.test.ts
git commit -m "test(sablier-flow): add layout algorithm tests"
```

---

### Task 2: Implement sablierFlowLayout.ts

**Files:**
- Create: `src/components/views/sablier/sablierFlowLayout.ts`

- [ ] **Step 1: Implement the layout algorithm**

```typescript
import type { Person, Relationship } from '@/lib/types/database'

const ROW_HEIGHT = 200
const COL_GAP = 40
const CARD_W = 280
const CARD_H = 70
const UNION_PAD = 20
const CANVAS_PAD = 80

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

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!
    for (const rel of relationships) {
      if (rel.type === 'PARENT_CHILD' || rel.type === 'ADOPTION') {
        if (rel.person_b_id === id && !genMap.has(rel.person_a_id)) {
          genMap.set(rel.person_a_id, gen - 1)
          queue.push({ id: rel.person_a_id, gen: gen - 1 })
          const role = (rel.metadata as { role?: string })?.role
          if (role) roleMap.set(rel.person_a_id, role)
        }
        if (rel.person_a_id === id && !genMap.has(rel.person_b_id)) {
          genMap.set(rel.person_b_id, gen + 1)
          queue.push({ id: rel.person_b_id, gen: gen + 1 })
          const role = (rel.metadata as { role?: string })?.role
          if (role) roleMap.set(rel.person_b_id, role)
        }
      }
      if (rel.type === 'UNION') {
        const partnerId = rel.person_a_id === id ? rel.person_b_id
          : rel.person_b_id === id ? rel.person_a_id : null
        if (partnerId && !genMap.has(partnerId)) {
          genMap.set(partnerId, gen)
          queue.push({ id: partnerId, gen })
        }
      }
      if (rel.type === 'SIBLING' || rel.type === 'HALF_SIBLING' || rel.type === 'STEP') {
        const sibId = rel.person_a_id === id ? rel.person_b_id
          : rel.person_b_id === id ? rel.person_a_id : null
        if (sibId && !genMap.has(sibId)) {
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

  // --- Detect siblings (gen 0 only, not center) ---
  const siblingIds = new Set<string>()
  for (const [id, gen] of genMap) {
    if (gen === 0 && id !== centerId) {
      siblingIds.add(id)
    }
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

    // Separate into: union groups, solo cards, siblings
    const unionGroupsInGen: [string, string][] = []
    const soloIds: string[] = []

    const processedInUnion = new Set<string>()
    for (const id of ids) {
      if (siblingIds.has(id)) continue // siblings handled separately
      if (inUnion.has(id) && !processedInUnion.has(id)) {
        for (const [a, b] of unionPairs.values()) {
          if ((a === id || b === id) && genMap.get(a) === gen && genMap.get(b) === gen) {
            unionGroupsInGen.push([a, b])
            processedInUnion.add(a)
            processedInUnion.add(b)
          }
        }
      } else if (!processedInUnion.has(id) && !siblingIds.has(id)) {
        soloIds.push(id)
      }
    }

    // Compute total width for this row
    const unionW = CARD_W + UNION_PAD * 2
    const totalItems = unionGroupsInGen.length + soloIds.length
    const totalWidth = unionGroupsInGen.length * unionW
      + soloIds.length * CARD_W
      + Math.max(0, totalItems - 1) * COL_GAP

    let curX = CANVAS_PAD + Math.max(0, (800 - totalWidth) / 2)

    // Place union groups
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

    // Place solo cards
    for (const id of soloIds) {
      const node: FlowNode = { id, generation: gen, x: curX, y: rowY, role: roleMap.get(id) }
      nodes.push(node)
      positioned.set(id, { x: curX + CARD_W / 2, y: rowY })
      curX += CARD_W + COL_GAP
    }
  }

  // --- Siblings (placed to the right of center at gen 0) ---
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
  const connections: FlowConnection[] = []
  for (const rel of relationships) {
    if (rel.type !== 'PARENT_CHILD' && rel.type !== 'ADOPTION') continue
    const parentPos = positioned.get(rel.person_a_id)
    const childPos = positioned.get(rel.person_b_id)
    if (!parentPos || !childPos) continue
    connections.push({
      fromId: rel.person_a_id,
      toId: rel.person_b_id,
      fromX: parentPos.x,
      fromY: parentPos.y + CARD_H,
      toX: childPos.x,
      toY: childPos.y,
    })
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
    totalWidth: maxX + CANVAS_PAD,
    totalHeight: maxY + CANVAS_PAD * 2,
    genLabels,
  }
}
```

- [ ] **Step 2: Run tests**

Run: `cd ~/Genealogy && npx vitest run src/components/views/__tests__/sablierFlowLayout.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/views/sablier/sablierFlowLayout.ts
git commit -m "feat(sablier-flow): implement flow layout algorithm"
```

---

## Chunk 2: CSS + React Component + Wiring

### Task 3: Create sablierFlow.css

**Files:**
- Create: `src/components/views/sablier/sablierFlow.css`

- [ ] **Step 1: Write CSS**

```css
.sablier-flow {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #f8f8f6;
  background-image: radial-gradient(circle, #e0ddd8 1px, transparent 1px);
  background-size: 20px 20px;
}

.sablier-flow__canvas {
  position: relative;
  min-width: 100%;
}

.sablier-flow__connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.sablier-flow__connections line {
  stroke: #d4d0cc;
  stroke-width: 1.5;
}

.sablier-flow__card {
  position: absolute;
  background: #ffffff;
  border: 1.5px solid #e5e2dd;
  border-radius: 12px;
  padding: 14px 20px;
  min-width: 200px;
  max-width: 320px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  z-index: 1;
}

.sablier-flow__card:hover {
  border-color: #c4c0ba;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.sablier-flow__card--selected {
  border-color: #7c3aed;
  box-shadow: 0 0 0 2px rgba(124,58,237,0.15), 0 2px 8px rgba(0,0,0,0.08);
}

.sablier-flow__card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sablier-flow__card-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.sablier-flow__card-icon--male { background: #2563eb; }
.sablier-flow__card-icon--female { background: #a855f7; }
.sablier-flow__card-icon--unknown { background: #6b7280; }

.sablier-flow__card-meta {
  font-size: 11px;
  color: #8a8580;
  padding-left: 30px;
  margin-top: 4px;
}

.sablier-flow__card-role {
  position: absolute;
  top: -10px;
  right: 12px;
  font-size: 10px;
  font-weight: 500;
  color: #7c3aed;
  background: rgba(124,58,237,0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.sablier-flow__union {
  position: absolute;
  border: 1.5px dashed #d4d0cc;
  border-radius: 16px;
  padding: 20px;
  background: rgba(124,58,237,0.02);
  z-index: 1;
}

.sablier-flow__union-label {
  position: absolute;
  top: -10px;
  left: 20px;
  background: #f8f8f6;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: #a855f7;
  letter-spacing: 0.3px;
}

.sablier-flow__gen-label {
  position: absolute;
  left: 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  z-index: 2;
}

.sablier-flow__gen-label--0 { color: #7c3aed; }
.sablier-flow__gen-label--1 { color: #2563eb; }
.sablier-flow__gen-label--2 { color: #0891b2; }
.sablier-flow__gen-label--3 { color: #059669; }
.sablier-flow__gen-label--4 { color: #d97706; }
.sablier-flow__gen-label--5 { color: #dc2626; }

.sablier-flow__empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f6;
}

.sablier-flow__empty-inner {
  text-align: center;
}

.sablier-flow__empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.sablier-flow__empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #3a3a3a;
  margin-bottom: 8px;
}

.sablier-flow__empty-text {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/views/sablier/sablierFlow.css
git commit -m "feat(sablier-flow): add CSS styles"
```

---

### Task 4: Create SablierFlowView.tsx

**Files:**
- Create: `src/components/views/sablier/SablierFlowView.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'
import { useEffect, useMemo } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { computeFlowLayout } from './sablierFlowLayout'
import './sablierFlow.css'

const GEN_LABELS: Record<number, string> = {
  0: 'Toi',
  '-1': 'Parents',
  '-2': 'Grands-parents',
  '-3': 'Arrière-grands-parents',
  '-4': 'Trisaïeuls',
  '-5': 'Quadrisaïeuls',
  1: 'Enfants',
  2: 'Petits-enfants',
}

function getInitials(prenom: string, nom: string): string {
  return (prenom[0] ?? '') + (nom[0] ?? '')
}

export function SablierFlowView() {
  const {
    persons, relationships, filteredRelationships,
    selectedPersonId, selectPerson, openAddPerson,
  } = useTree()

  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  const centerId = selectedPersonId ?? persons[0]?.id ?? ''
  const personMap = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons])

  const layout = useMemo(
    () => computeFlowLayout(persons, filteredRelationships, centerId),
    [persons, filteredRelationships, centerId]
  )

  if (persons.length === 0) {
    return (
      <div className="sablier-flow__empty">
        <div className="sablier-flow__empty-inner">
          <div className="sablier-flow__empty-icon">⧖</div>
          <h2 className="sablier-flow__empty-title">Votre arbre vous attend</h2>
          <p className="sablier-flow__empty-text">Commencez par ajouter la première personne.</p>
          <button
            type="button"
            onClick={openAddPerson}
            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
          >
            + Ajouter une personne
          </button>
        </div>
      </div>
    )
  }

  const renderCard = (nodeId: string, x: number, y: number, role?: string, isSelected?: boolean) => {
    const p = personMap.get(nodeId)
    if (!p) return null
    const deceased = p.date_deces != null
    const year = p.date_naissance ? new Date(p.date_naissance).getFullYear() : null
    const classes = `sablier-flow__card${isSelected ? ' sablier-flow__card--selected' : ''}`
    return (
      <div
        key={nodeId}
        className={classes}
        style={{ left: x, top: y }}
        onClick={() => selectPerson(nodeId)}
      >
        {role && <span className="sablier-flow__card-role">{role}</span>}
        <div className="sablier-flow__card-name">
          <span className="sablier-flow__card-icon sablier-flow__card-icon--unknown">
            {getInitials(p.prenom, p.nom)}
          </span>
          {p.prenom} {p.nom}
          {deceased && <span style={{ color: '#c4c0ba' }}>†</span>}
        </div>
        <div className="sablier-flow__card-meta">
          {year && <span>{year}</span>}
          {year && !deceased && <span> · Vivant</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="sablier-flow">
      <div
        className="sablier-flow__canvas"
        style={{ width: layout.totalWidth, height: layout.totalHeight }}
      >
        {/* SVG connections */}
        <svg
          className="sablier-flow__connections"
          viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {layout.connections.map((c, i) => (
            <g key={i}>
              <line x1={c.fromX} y1={c.fromY} x2={c.toX} y2={c.toY} />
              <circle cx={c.fromX} cy={c.fromY} r={4} fill="#7c3aed" />
              <circle cx={c.toX} cy={c.toY} r={3} fill="#d4d0cc" />
            </g>
          ))}
        </svg>

        {/* Generation labels */}
        {layout.genLabels.map(gl => {
          const idx = gl.generation
          const label = GEN_LABELS[idx] ?? `Gén. ${Math.abs(idx)}`
          const colorClass = `sablier-flow__gen-label--${Math.min(Math.abs(idx), 5)}`
          return (
            <div
              key={idx}
              className={`sablier-flow__gen-label ${colorClass}`}
              style={{ top: gl.y }}
            >
              {label}
            </div>
          )
        })}

        {/* Union groups */}
        {layout.unions.map((u, i) => (
          <div
            key={`union-${i}`}
            className="sablier-flow__union"
            style={{ left: u.x, top: u.y, width: u.width, height: u.height }}
          >
            <span className="sablier-flow__union-label">💍 Union</span>
          </div>
        ))}

        {/* Cards inside unions are rendered as absolute nodes */}
        {layout.nodes
          .filter(n => !layout.siblings.some(s => s.id === n.id))
          .map(n => renderCard(n.id, n.x, n.y, n.role, n.id === centerId))}

        {/* Siblings */}
        {layout.siblings.map(s => renderCard(s.id, s.x, s.y, 'Fratrie', false))}
      </div>

      {/* Orphan badge */}
      {layout.orphans.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            background: '#fff',
            border: '1px solid #e5e2dd',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            color: '#8a8580',
            zIndex: 10,
          }}
        >
          {layout.orphans.length} non connecté{layout.orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/views/sablier/SablierFlowView.tsx
git commit -m "feat(sablier-flow): add SablierFlowView component"
```

---

### Task 5: Wire up ViewRouter

**Files:**
- Modify: `src/components/views/ViewRouter.tsx`

- [ ] **Step 1: Update import and switch case**

Replace `SablierView` with `SablierFlowView`:

```tsx
// Change line 3:
import { SablierFlowView } from '@/components/views/sablier/SablierFlowView'

// Change line 17:
case 'sablier': return <SablierFlowView />
```

- [ ] **Step 2: Run all tests**

Run: `cd ~/Genealogy && npm run test:run`
Expected: All tests pass (existing SablierView tests may need updating or removal)

- [ ] **Step 3: Fix any broken tests**

If SablierView tests fail because the import changed, update them to test SablierFlowView instead, or remove tests that are specific to the old ReactFlow implementation.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/ViewRouter.tsx
git commit -m "feat(sablier-flow): wire SablierFlowView into ViewRouter"
```

---

### Task 6: Component tests

**Files:**
- Create: `src/components/views/__tests__/SablierFlowView.test.tsx`

- [ ] **Step 1: Write render tests**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({
  useTree: vi.fn(),
}))

import { useTree } from '@/lib/context/tree-context'

describe('SablierFlowView', () => {
  it('shows empty state when no persons', async () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [],
      relationships: [],
      filteredRelationships: [],
      selectedPersonId: null,
      selectPerson: vi.fn(),
      openAddPerson: vi.fn(),
    } as never)

    const { SablierFlowView } = await import('../sablier/SablierFlowView')
    render(<SablierFlowView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('renders person cards when data exists', async () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      persons: [
        { id: 'p1', prenom: 'Pierre', nom: 'Dupont', date_naissance: '1990-01-01', date_deces: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null, lieu_deces: null, lat_deces: null, lon_deces: null, notes: null, created_at: '', updated_at: '' },
      ],
      relationships: [],
      filteredRelationships: [],
      selectedPersonId: 'p1',
      selectPerson,
      openAddPerson: vi.fn(),
    } as never)

    const { SablierFlowView } = await import('../sablier/SablierFlowView')
    render(<SablierFlowView />)
    expect(screen.getByText(/Pierre Dupont/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `cd ~/Genealogy && npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/views/__tests__/SablierFlowView.test.tsx
git commit -m "test(sablier-flow): add component render tests"
```

---

### Task 7: Clean up old SablierView tests

**Files:**
- Modify/Remove: `src/components/views/sablier/__tests__/SablierView.test.tsx` (if exists)

- [ ] **Step 1: Check for old SablierView tests**

Run: `find src -name "SablierView.test*" -o -name "sablierView.test*"`

- [ ] **Step 2: Update or remove**

If tests reference `SablierView` (the old ReactFlow version), either remove them or update to test `SablierFlowView`.

- [ ] **Step 3: Run all tests and verify**

Run: `cd ~/Genealogy && npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: clean up old SablierView tests"
```
