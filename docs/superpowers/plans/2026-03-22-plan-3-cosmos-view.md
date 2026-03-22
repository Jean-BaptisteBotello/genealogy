# Cosmos View Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the person grid on `/tree` with an interactive SVG orbital visualization where a selected person is centered and relatives orbit at distances that reflect relationship proximity.

**Architecture:** Pure SVG rendered in a `'use client'` React component. A pure-function layout engine (`cosmosLayout.ts`) takes persons, relationships, and a center ID and returns (x, y) positions via BFS orbit assignment. CosmosView wires context data into the layout engine and renders nodes, edges, and tooltips as SVG elements.

**Tech Stack:** React 19, TypeScript, SVG (no external graph library), Vitest + @testing-library/react

---

## Chunk 1: Layout Algorithm + Node + Edge

### Task C3-1: Layout algorithm tests

**Files:**
- Create: `src/components/cosmos/__tests__/cosmosLayout.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/cosmos/__tests__/cosmosLayout.test.ts
import { describe, it, expect } from 'vitest'
import { computeCosmosLayout, ORBIT_RADII } from '../cosmosLayout'
import type { Relationship } from '@/lib/types/database'

const REL = (a: string, b: string, type: Relationship['type'], meta: Record<string, unknown> = {}): Relationship => ({
  id: `${a}-${b}`,
  person_a_id: a,
  person_b_id: b,
  type,
  metadata: meta,
})

describe('ORBIT_RADII', () => {
  it('defines radii for orbits 0–4', () => {
    expect(ORBIT_RADII[0]).toBe(0)
    expect(ORBIT_RADII[1]).toBe(80)
    expect(ORBIT_RADII[2]).toBe(130)
    expect(ORBIT_RADII[3]).toBe(200)
    expect(ORBIT_RADII[4]).toBe(280)
  })
})

describe('computeCosmosLayout', () => {
  it('places the center person at orbit 0', () => {
    const result = computeCosmosLayout(['p1', 'p2'], [REL('p1', 'p2', 'PARENT_CHILD')], 'p1')
    const center = result.nodes.find(n => n.id === 'p1')
    expect(center?.orbit).toBe(0)
    expect(center?.x).toBe(0)
    expect(center?.y).toBe(0)
  })

  it('places active UNION partner at orbit 1', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'UNION', { ended: false })],
      'p1'
    )
    const partner = result.nodes.find(n => n.id === 'p2')
    expect(partner?.orbit).toBe(1)
  })

  it('places ended UNION partner at orbit 2', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'UNION', { ended: true })],
      'p1'
    )
    const partner = result.nodes.find(n => n.id === 'p2')
    expect(partner?.orbit).toBe(2)
  })

  it('places 1-hop PARENT_CHILD at orbit 2', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'PARENT_CHILD')],
      'p1'
    )
    const child = result.nodes.find(n => n.id === 'p2')
    expect(child?.orbit).toBe(2)
  })

  it('places 1-hop SIBLING at orbit 2', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'SIBLING')],
      'p1'
    )
    const sibling = result.nodes.find(n => n.id === 'p2')
    expect(sibling?.orbit).toBe(2)
  })

  it('places 2-hop relatives at orbit 3', () => {
    // p1 → p2 (parent) → p3 (grandparent)
    const result = computeCosmosLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2', 'PARENT_CHILD'), REL('p2', 'p3', 'PARENT_CHILD')],
      'p1'
    )
    const grandparent = result.nodes.find(n => n.id === 'p3')
    expect(grandparent?.orbit).toBe(3)
  })

  it('places 3+ hop relatives at orbit 4', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2', 'p3', 'p4'],
      [
        REL('p1', 'p2', 'PARENT_CHILD'),
        REL('p2', 'p3', 'PARENT_CHILD'),
        REL('p3', 'p4', 'PARENT_CHILD'),
      ],
      'p1'
    )
    const great = result.nodes.find(n => n.id === 'p4')
    expect(great?.orbit).toBe(4)
  })

  it('places nodes evenly around their orbit', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2', 'PARENT_CHILD'), REL('p1', 'p3', 'PARENT_CHILD')],
      'p1'
    )
    const orbit2Nodes = result.nodes.filter(n => n.orbit === 2)
    expect(orbit2Nodes).toHaveLength(2)
    // Both should be at radius 130
    orbit2Nodes.forEach(n => {
      const dist = Math.sqrt(n.x ** 2 + n.y ** 2)
      expect(dist).toBeCloseTo(ORBIT_RADII[2], 0)
    })
  })

  it('lists persons with no relationships as orphans', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2', 'PARENT_CHILD')],
      'p1'
    )
    expect(result.orphans).toContain('p3')
    expect(result.orphans).not.toContain('p1')
    expect(result.orphans).not.toContain('p2')
  })

  it('returns empty nodes and orphans for empty input', () => {
    const result = computeCosmosLayout([], [], 'p1')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toEqual([])
  })

  it('handles center not in personIds gracefully', () => {
    const result = computeCosmosLayout(['p1', 'p2'], [REL('p1', 'p2', 'PARENT_CHILD')], 'unknown')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toHaveLength(2)
  })

  it('treats UNION without metadata.ended as active (orbit 1)', () => {
    const result = computeCosmosLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'UNION')],
      'p1'
    )
    const partner = result.nodes.find(n => n.id === 'p2')
    expect(partner?.orbit).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/cosmos/__tests__/cosmosLayout.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Commit failing tests**

```bash
cd /Users/user/Genealogy && git add src/components/cosmos/__tests__/cosmosLayout.test.ts && git commit -m "test(cosmos): failing tests for cosmosLayout BFS algorithm"
```

---

### Task C3-2: Layout algorithm implementation

**Files:**
- Create: `src/components/cosmos/cosmosLayout.ts`

- [ ] **Step 1: Write the implementation**

```typescript
// src/components/cosmos/cosmosLayout.ts
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

function getOrbitForHop(hop: number, rel: Relationship): number {
  if (hop === 0) return 0
  if (hop === 1 && rel.type === 'UNION' && !rel.metadata?.ended) return 1
  if (hop === 1) return 2
  if (hop === 2) return 3
  return 4
}

export function computeCosmosLayout(
  personIds: string[],
  relationships: Relationship[],
  centerId: string
): CosmosLayoutResult {
  if (!personIds.includes(centerId)) {
    return { nodes: [], orphans: personIds.slice() }
  }

  // BFS from center
  const orbitMap = new Map<string, number>()
  const relUsedForOrbit = new Map<string, Relationship>()
  const queue: { id: string; hop: number; rel: Relationship | null }[] = [
    { id: centerId, hop: 0, rel: null },
  ]
  orbitMap.set(centerId, 0)

  while (queue.length > 0) {
    const { id, hop } = queue.shift()!
    for (const rel of relationships) {
      const neighbor =
        rel.person_a_id === id
          ? rel.person_b_id
          : rel.person_b_id === id
          ? rel.person_a_id
          : null
      if (!neighbor || orbitMap.has(neighbor)) continue
      if (!personIds.includes(neighbor)) continue

      const orbit = getOrbitForHop(hop + 1, rel)
      orbitMap.set(neighbor, orbit)
      relUsedForOrbit.set(neighbor, rel)
      queue.push({ id: neighbor, hop: hop + 1, rel })
    }
  }

  // Group nodes by orbit for even angle distribution
  const byOrbit = new Map<number, string[]>()
  for (const [id, orbit] of orbitMap) {
    if (!byOrbit.has(orbit)) byOrbit.set(orbit, [])
    byOrbit.get(orbit)!.push(id)
  }

  const nodes: PositionedNode[] = []
  for (const [orbit, ids] of byOrbit) {
    const radius = ORBIT_RADII[orbit] ?? ORBIT_RADII[4]
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length
      nodes.push({
        id,
        orbit,
        x: orbit === 0 ? 0 : Math.cos(angle) * radius,
        y: orbit === 0 ? 0 : Math.sin(angle) * radius,
      })
    })
  }

  const connected = new Set(orbitMap.keys())
  const orphans = personIds.filter(id => !connected.has(id))

  return { nodes, orphans }
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/cosmos/__tests__/cosmosLayout.test.ts
```

Expected: 12/12 PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/user/Genealogy && git add src/components/cosmos/cosmosLayout.ts && git commit -m "feat(cosmos): BFS layout algorithm with orbital distance"
```

---

### Task C3-3: CosmosNode tests

**Files:**
- Create: `src/components/cosmos/__tests__/CosmosNode.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/cosmos/__tests__/CosmosNode.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CosmosNode } from '../CosmosNode'

const defaultProps = {
  id: 'p1',
  x: 100,
  y: 80,
  prenom: 'Jean',
  nom: 'Dupont',
  isSelected: false,
  isCenter: false,
  branchColor: '#3b82f6',
  onClick: vi.fn(),
  onHover: vi.fn(),
}

describe('CosmosNode', () => {
  it('renders a circle at (x, y)', () => {
    const { container } = render(
      <svg><CosmosNode {...defaultProps} /></svg>
    )
    const circle = container.querySelector('circle')
    expect(circle).toBeTruthy()
    expect(circle?.getAttribute('cx')).toBe('100')
    expect(circle?.getAttribute('cy')).toBe('80')
  })

  it('shows initials inside the circle', () => {
    render(<svg><CosmosNode {...defaultProps} /></svg>)
    expect(screen.getByText('JD')).toBeTruthy()
  })

  it('applies selected styling when isSelected=true', () => {
    const { container } = render(
      <svg><CosmosNode {...defaultProps} isSelected={true} /></svg>
    )
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('stroke-width')).toBe('3')
  })

  it('applies center styling when isCenter=true', () => {
    const { container } = render(
      <svg><CosmosNode {...defaultProps} isCenter={true} /></svg>
    )
    const circle = container.querySelector('circle')
    // Center node has a larger radius
    const r = Number(circle?.getAttribute('r'))
    expect(r).toBeGreaterThan(22)
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<svg><CosmosNode {...defaultProps} onClick={onClick} /></svg>)
    fireEvent.click(screen.getByText('JD'))
    expect(onClick).toHaveBeenCalledWith('p1')
  })

  it('calls onHover with id when mouse enters', () => {
    const onHover = vi.fn()
    const { container } = render(<svg><CosmosNode {...defaultProps} onHover={onHover} /></svg>)
    const group = container.querySelector('g')!
    fireEvent.mouseEnter(group)
    expect(onHover).toHaveBeenCalledWith('p1')
  })

  it('calls onHover with null when mouse leaves', () => {
    const onHover = vi.fn()
    const { container } = render(<svg><CosmosNode {...defaultProps} onHover={onHover} /></svg>)
    const group = container.querySelector('g')!
    fireEvent.mouseLeave(group)
    expect(onHover).toHaveBeenCalledWith(null)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/cosmos/__tests__/CosmosNode.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Commit failing tests**

```bash
cd /Users/user/Genealogy && git add src/components/cosmos/__tests__/CosmosNode.test.tsx && git commit -m "test(cosmos): failing tests for CosmosNode SVG component"
```

---

### Task C3-4: CosmosNode implementation

**Files:**
- Create: `src/components/cosmos/CosmosNode.tsx`

- [ ] **Step 1: Write the implementation**

```typescript
// src/components/cosmos/CosmosNode.tsx
interface CosmosNodeProps {
  id: string
  x: number
  y: number
  prenom: string
  nom: string
  isSelected: boolean
  isCenter: boolean
  branchColor: string
  onClick: (id: string) => void
  onHover: (id: string | null) => void
}

export function CosmosNode({
  id, x, y, prenom, nom, isSelected, isCenter, branchColor, onClick, onHover,
}: CosmosNodeProps) {
  const radius = isCenter ? 30 : 22
  const initials = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
  const strokeWidth = isSelected ? 3 : 1.5

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(id)}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      <circle
        cx={x === 0 && y === 0 ? 0 : 0}
        r={radius}
        fill={branchColor}
        stroke={isSelected ? '#ffffff' : branchColor}
        strokeWidth={strokeWidth}
        fillOpacity={0.85}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={isCenter ? 13 : 11}
        fontWeight="600"
        pointerEvents="none"
      >
        {initials}
      </text>
    </g>
  )
}
```

- [ ] **Step 2: Fix circle cx/cy — they should be 0 since we use transform**

The `cx` and `cy` should be `0` since the `<g>` uses `transform`. Check the test for `getAttribute('cx')` — it checks the raw SVG attribute. Adjust: since we render with transform on `<g>` and `cx={0}`, the test checks `cx="100"` which would fail.

Correct approach: don't use transform, put `cx={x}` and `cy={y}` directly on the circle:

```typescript
// src/components/cosmos/CosmosNode.tsx
interface CosmosNodeProps {
  id: string
  x: number
  y: number
  prenom: string
  nom: string
  isSelected: boolean
  isCenter: boolean
  branchColor: string
  onClick: (id: string) => void
  onHover: (id: string | null) => void
}

export function CosmosNode({
  id, x, y, prenom, nom, isSelected, isCenter, branchColor, onClick, onHover,
}: CosmosNodeProps) {
  const radius = isCenter ? 30 : 22
  const initials = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
  const strokeWidth = isSelected ? 3 : 1.5

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(id)}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={branchColor}
        stroke={isSelected ? '#ffffff' : branchColor}
        strokeWidth={strokeWidth}
        fillOpacity={0.85}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={isCenter ? 13 : 11}
        fontWeight="600"
        pointerEvents="none"
      >
        {initials}
      </text>
    </g>
  )
}
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/cosmos/__tests__/CosmosNode.test.tsx
```

Expected: 7/7 PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/user/Genealogy && git add src/components/cosmos/CosmosNode.tsx && git commit -m "feat(cosmos): CosmosNode SVG circle with initials and hover"
```

---

### Task C3-5: CosmosEdge implementation (no separate test file — covered by CosmosView tests)

**Files:**
- Create: `src/components/cosmos/CosmosEdge.tsx`

- [ ] **Step 1: Write the implementation**

```typescript
// src/components/cosmos/CosmosEdge.tsx
import type { RelationshipType } from '@/lib/types/database'

interface CosmosEdgeProps {
  x1: number
  y1: number
  x2: number
  y2: number
  type: RelationshipType
}

const STROKE_BY_TYPE: Record<RelationshipType, string> = {
  UNION: '#60a5fa',
  PARENT_CHILD: '#6b7280',
  ADOPTION: '#a78bfa',
  SIBLING: '#6b7280',
  HALF_SIBLING: '#6b7280',
  STEP: '#6b7280',
}

const DASH_BY_TYPE: Record<RelationshipType, string | undefined> = {
  UNION: undefined,
  PARENT_CHILD: undefined,
  ADOPTION: '4 2',
  SIBLING: '2 2',
  HALF_SIBLING: '2 2',
  STEP: '4 4',
}

export function CosmosEdge({ x1, y1, x2, y2, type }: CosmosEdgeProps) {
  // Quadratic bezier: midpoint slightly offset
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2 - 20

  return (
    <path
      d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
      fill="none"
      stroke={STROKE_BY_TYPE[type] ?? '#6b7280'}
      strokeWidth={1.5}
      strokeDasharray={DASH_BY_TYPE[type]}
      opacity={0.6}
      pointerEvents="none"
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/user/Genealogy && git add src/components/cosmos/CosmosEdge.tsx && git commit -m "feat(cosmos): CosmosEdge SVG bezier path by relationship type"
```

---

## Chunk 2: Tooltip + CosmosView + Integration

### Task C3-6: CosmosTooltip implementation

**Files:**
- Create: `src/components/cosmos/CosmosTooltip.tsx`

- [ ] **Step 1: Write the implementation**

```typescript
// src/components/cosmos/CosmosTooltip.tsx
import type { Person } from '@/lib/types/database'

interface CosmosTooltipProps {
  person: Person
  x: number
  y: number
}

function formatYear(date: string | null): string {
  if (!date) return ''
  return new Date(date).getFullYear().toString()
}

export function CosmosTooltip({ person, x, y }: CosmosTooltipProps) {
  const birthYear = formatYear(person.date_naissance)
  const deathYear = formatYear(person.date_deces)
  const dates = [birthYear, deathYear].filter(Boolean).join(' – ')

  const W = 160
  const H = 60
  // Shift tooltip so it doesn't overflow
  const tx = x + 30
  const ty = y - H / 2

  return (
    <foreignObject x={tx} y={ty} width={W} height={H} style={{ overflow: 'visible', pointerEvents: 'none' }}>
      <div
        style={{
          background: '#0d1117',
          border: '1px solid #1e3a5f',
          borderRadius: 6,
          padding: '6px 10px',
          color: 'white',
          fontSize: 12,
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ fontWeight: 600 }}>{person.prenom} {person.nom}</div>
        {dates && <div style={{ color: '#9ca3af' }}>{dates}</div>}
        {person.lieu_naissance && <div style={{ color: '#6b7280', fontSize: 11 }}>{person.lieu_naissance}</div>}
      </div>
    </foreignObject>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/user/Genealogy && git add src/components/cosmos/CosmosTooltip.tsx && git commit -m "feat(cosmos): CosmosTooltip foreignObject overlay"
```

---

### Task C3-7: CosmosView tests

**Files:**
- Create: `src/components/cosmos/__tests__/CosmosView.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/cosmos/__tests__/CosmosView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

import { useTree } from '@/lib/context/tree-context'
import { CosmosView } from '../CosmosView'
import type { Person, Relationship } from '@/lib/types/database'

const mockPerson = (id: string, prenom: string, nom: string): Person => ({
  id, prenom, nom,
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

const mockRel = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD'): Relationship => ({
  id: `${a}-${b}`, person_a_id: a, person_b_id: b, type, metadata: {},
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CosmosView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('shows add-person prompt with button when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByRole('button', { name: /ajouter une personne/i })).toBeTruthy()
  })

  it('renders SVG canvas when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    const { container } = render(<CosmosView />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders a CosmosNode for each connected person', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mockRel('p1', 'p2')],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText('JD')).toBeTruthy() // Jean Dupont
    expect(screen.getByText('MM')).toBeTruthy() // Marie Martin
  })

  it('selects a new center when node is clicked', () => {
    const selectPerson = vi.fn()
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mockRel('p1', 'p2')],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CosmosView />)
    fireEvent.click(screen.getByText('MM'))
    expect(selectPerson).toHaveBeenCalledWith('p2')
  })

  it('auto-selects first person when selectedPersonId is null', () => {
    const selectPerson = vi.fn()
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1],
      relationships: [],
      branches: [], personBranches: [],
      selectedPersonId: null, selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CosmosView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })

  it('renders edges for relationships between visible nodes', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mockRel('p1', 'p2')],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    const { container } = render(<CosmosView />)
    expect(container.querySelector('path')).toBeTruthy()
  })

  it('shows orphan count badge when there are unconnected persons', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [], // no relationship → p2 is orphan
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText(/1 non connecté/i)).toBeTruthy()
  })

  it('uses branch color for node fill when person is in a branch', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1],
      relationships: [],
      branches: [{ id: 'b1', nom: 'Branche A', couleur: '#ff0000', description: null, created_by: 'u1', created_at: '2024-01-01' }],
      personBranches: [{ person_id: 'p1', branch_id: 'b1' }],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    const { container } = render(<CosmosView />)
    const circles = container.querySelectorAll('circle')
    const hasBranchColor = Array.from(circles).some(c => c.getAttribute('fill') === '#ff0000')
    expect(hasBranchColor).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/cosmos/__tests__/CosmosView.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Commit failing tests**

```bash
cd /Users/user/Genealogy && git add src/components/cosmos/__tests__/CosmosView.test.tsx && git commit -m "test(cosmos): failing tests for CosmosView canvas"
```

---

### Task C3-8: CosmosView implementation

**Files:**
- Create: `src/components/cosmos/CosmosView.tsx`

- [ ] **Step 1: Write the implementation**

```typescript
// src/components/cosmos/CosmosView.tsx
'use client'
import { useEffect, useState } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { computeCosmosLayout } from './cosmosLayout'
import { CosmosNode } from './CosmosNode'
import { CosmosEdge } from './CosmosEdge'
import { CosmosTooltip } from './CosmosTooltip'
import type { Person } from '@/lib/types/database'

const DEFAULT_COLOR = '#3b82f6'
const VIEWBOX_SIZE = 700

export function CosmosView() {
  const { persons, relationships, branches, personBranches, selectedPersonId, selectPerson, openAddPerson } = useTree()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Auto-select first person if none selected
  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌳</div>
          <h2 className="text-xl font-semibold text-white mb-2">Votre arbre vous attend</h2>
          <p className="text-sm text-gray-500 mb-6">Commencez par ajouter la première personne.</p>
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

  const centerId = selectedPersonId ?? persons[0].id
  const personMap = new Map<string, Person>(persons.map(p => [p.id, p]))

  // Build branch color map
  const personColor = new Map<string, string>()
  for (const pb of personBranches) {
    const branch = branches.find(b => b.id === pb.branch_id)
    if (branch) personColor.set(pb.person_id, branch.couleur)
  }

  const { nodes, orphans } = computeCosmosLayout(
    persons.map(p => p.id),
    relationships,
    centerId
  )

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const cx = VIEWBOX_SIZE / 2
  const cy = VIEWBOX_SIZE / 2

  // Determine which relationships to draw (both endpoints are in nodes)
  const visibleEdges = relationships.filter(
    r => nodeMap.has(r.person_a_id) && nodeMap.has(r.person_b_id)
  )

  const hoveredPerson = hoveredId ? personMap.get(hoveredId) : null
  const hoveredNode = hoveredId ? nodeMap.get(hoveredId) : null

  return (
    <div className="w-full h-full relative">
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      >
        {/* Edges */}
        {visibleEdges.map(rel => {
          const a = nodeMap.get(rel.person_a_id)!
          const b = nodeMap.get(rel.person_b_id)!
          return (
            <CosmosEdge
              key={rel.id}
              x1={cx + a.x}
              y1={cy + a.y}
              x2={cx + b.x}
              y2={cy + b.y}
              type={rel.type}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const person = personMap.get(node.id)
          if (!person) return null
          return (
            <CosmosNode
              key={node.id}
              id={node.id}
              x={cx + node.x}
              y={cy + node.y}
              prenom={person.prenom}
              nom={person.nom}
              isSelected={node.id === centerId}
              isCenter={node.id === centerId}
              branchColor={personColor.get(node.id) ?? DEFAULT_COLOR}
              onClick={selectPerson}
              onHover={setHoveredId}
            />
          )
        })}

        {/* Tooltip */}
        {hoveredPerson && hoveredNode && (
          <CosmosTooltip
            person={hoveredPerson}
            x={cx + hoveredNode.x}
            y={cy + hoveredNode.y}
          />
        )}
      </svg>

      {/* Orphan badge */}
      {orphans.length > 0 && (
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-[#0d1117] border border-[#1e3a5f] rounded px-2 py-1">
          {orphans.length} non connecté{orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/cosmos/__tests__/CosmosView.test.tsx
```

Expected: 9/9 PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/user/Genealogy && git add src/components/cosmos/CosmosView.tsx && git commit -m "feat(cosmos): CosmosView SVG orbital canvas"
```

---

### Task C3-9: Wire tree/page.tsx

**Files:**
- Modify: `src/app/(app)/tree/page.tsx`

- [ ] **Step 1: Replace grid with CosmosView**

```typescript
// src/app/(app)/tree/page.tsx
'use client'
import { CosmosView } from '@/components/cosmos/CosmosView'

export default function TreePage() {
  return <CosmosView />
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/user/Genealogy && git add src/app/(app)/tree/page.tsx && git commit -m "feat(cosmos): wire CosmosView into tree page"
```

---

### Task C3-10: Full test suite + build verification

**Files:** None new

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/user/Genealogy && npx vitest run
```

Expected: All tests pass (no regressions)

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/user/Genealogy && npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Run Next.js build**

```bash
cd /Users/user/Genealogy && npx next build
```

Expected: Build succeeds

- [ ] **Step 4: Commit if any fixes were needed, then tag**

```bash
cd /Users/user/Genealogy && git log --oneline -10
```
