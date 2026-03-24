# Cosmos View Refactor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Cosmos view from a static SVG with colored/initials nodes to an animated orbital visualization with pastel gradient background, grain, radial glow, shadow trails, and a branch-color toggle.

**Architecture:** The layout algorithm is replaced with a role-based orbit mapping (`getOrbitForRole`) instead of BFS hop-count. `CosmosView` uses a `requestAnimationFrame` loop that mutates SVG `transform` attributes directly via refs — React renders nodes once, rAF animates them. The grain canvas and gradient background live in CSS/canvas outside the SVG.

**Tech Stack:** React 19, TypeScript, SVG (no D3), `requestAnimationFrame`, `ResizeObserver`, `localStorage`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/cosmos/cosmosLayout.ts` | Modify | Role→orbit mapping, layout algorithm, `ORBIT_RADII[0-5]` |
| `src/components/cosmos/CosmosNode.tsx` | Modify | Shadow line + circle, no initials, mono/branch modes |
| `src/components/cosmos/CosmosTooltip.tsx` | Modify | Light theme, `role` prop, absolute div (not foreignObject) |
| `src/components/cosmos/CosmosView.tsx` | Modify | rAF loop, grain canvas, gradient, glow disk, orbit rings, toggle |
| `src/components/cosmos/__tests__/cosmosLayout.test.ts` | Create | Unit tests for `getOrbitForRole`, `getMetadataRole`, layout |
| `src/components/cosmos/__tests__/CosmosView.test.tsx` | Modify | Remove initials/edge tests, add toggle/center label tests |

---

## Chunk 1: Layout algorithm

### Task 1: `cosmosLayout.ts` — role-based orbit mapping

**Files:**
- Modify: `src/components/cosmos/cosmosLayout.ts`
- Create: `src/components/cosmos/__tests__/cosmosLayout.test.ts`

- [ ] **Step 1: Create test file with failing tests for `getMetadataRole`**

```typescript
// src/components/cosmos/__tests__/cosmosLayout.test.ts
import { describe, it, expect } from 'vitest'
import { getMetadataRole, getOrbitForRole, computeCosmosLayout, ORBIT_RADII } from '../cosmosLayout'
import type { Relationship } from '@/lib/types/database'

const rel = (overrides: Partial<Relationship> = {}): Relationship => ({
  id: 'r1', person_a_id: 'a', person_b_id: 'b',
  type: 'PARENT_CHILD', metadata: {},
  ...overrides,
})

describe('getMetadataRole', () => {
  it('returns string role when present', () => {
    expect(getMetadataRole(rel({ metadata: { role: 'père' } }))).toBe('père')
  })
  it('returns undefined when role is absent', () => {
    expect(getMetadataRole(rel({ metadata: {} }))).toBeUndefined()
  })
  it('returns undefined when role is not a string', () => {
    expect(getMetadataRole(rel({ metadata: { role: 42 } }))).toBeUndefined()
  })
  it('returns undefined when metadata is empty', () => {
    expect(getMetadataRole(rel())).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run — expect FAIL (function not exported)**

```bash
cd ~/Genealogy && npx vitest run src/components/cosmos/__tests__/cosmosLayout.test.ts
```
Expected: FAIL `getMetadataRole is not a function` or similar.

- [ ] **Step 3: Add failing tests for `getOrbitForRole`**

Append to `cosmosLayout.test.ts`:

```typescript
describe('getOrbitForRole', () => {
  // Orbit 1 — by role
  it.each(['père', 'mère', 'beau-père', 'belle-mère'])('role %s → orbit 1', (role) => {
    expect(getOrbitForRole(role, 'PARENT_CHILD', false)).toBe(1)
  })

  // Orbit 2 — by role
  it.each(['époux/épouse', 'fils', 'fille', 'enfant adopté(e)'])('role %s → orbit 2', (role) => {
    expect(getOrbitForRole(role, 'UNION', true)).toBe(2)
  })

  // Orbit 3 — by role
  it.each(['frère', 'sœur', 'demi-frère', 'demi-sœur', 'grand-père', 'grand-mère'])('role %s → orbit 3', (role) => {
    expect(getOrbitForRole(role, 'SIBLING', true)).toBe(3)
  })

  // Orbit 4 — by role
  it.each(['oncle', 'tante', 'cousin', 'cousine'])('role %s → orbit 4', (role) => {
    expect(getOrbitForRole(role, 'SIBLING', true)).toBe(4)
  })

  // Orbit 5 — by role
  it.each(['arrière-grand-père', 'arrière-grand-mère', 'arrière-arrière-grand-père', 'arrière-arrière-grand-mère'])('role %s → orbit 5', (role) => {
    expect(getOrbitForRole(role, 'PARENT_CHILD', false)).toBe(5)
  })

  // Fallbacks — no role
  it('UNION without role → orbit 2', () => {
    expect(getOrbitForRole(undefined, 'UNION', true)).toBe(2)
  })
  it('PARENT_CHILD isPersonA=true (centre=parent) → orbit 2', () => {
    expect(getOrbitForRole(undefined, 'PARENT_CHILD', true)).toBe(2)
  })
  it('PARENT_CHILD isPersonA=false (centre=enfant) → orbit 3', () => {
    expect(getOrbitForRole(undefined, 'PARENT_CHILD', false)).toBe(3)
  })
  it('SIBLING → orbit 3', () => {
    expect(getOrbitForRole(undefined, 'SIBLING', true)).toBe(3)
  })
  it('HALF_SIBLING → orbit 3', () => {
    expect(getOrbitForRole(undefined, 'HALF_SIBLING', false)).toBe(3)
  })
  it('STEP isPersonA=false (centre=bel-enfant) → orbit 1', () => {
    expect(getOrbitForRole(undefined, 'STEP', false)).toBe(1)
  })
  it('STEP isPersonA=true → orbit 4', () => {
    expect(getOrbitForRole(undefined, 'STEP', true)).toBe(4)
  })
  it('ADOPTION isPersonA=true (centre=parent) → orbit 2', () => {
    expect(getOrbitForRole(undefined, 'ADOPTION', true)).toBe(2)
  })
  it('ADOPTION isPersonA=false → orbit 4', () => {
    expect(getOrbitForRole(undefined, 'ADOPTION', false)).toBe(4)
  })
  it('unknown role string → orbit 5 (default)', () => {
    expect(getOrbitForRole('cousin-germain', 'SIBLING', true)).toBe(5)
  })
})
```

- [ ] **Step 4: Add failing tests for `computeCosmosLayout`**

Append to `cosmosLayout.test.ts`:

```typescript
const mockRel = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD', role?: string): Relationship => ({
  id: `${a}-${b}`, person_a_id: a, person_b_id: b, type,
  metadata: role ? { role } : {},
})

describe('computeCosmosLayout', () => {
  it('returns empty nodes and all persons as orphans when personIds is empty', () => {
    const result = computeCosmosLayout([], [], 'any')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toEqual([])
  })

  it('places center person at orbit 0', () => {
    const result = computeCosmosLayout(['p1'], [], 'p1')
    expect(result.nodes[0]).toMatchObject({ id: 'p1', orbit: 0, angle: 0 })
  })

  it('places père at orbit 1', () => {
    const result = computeCosmosLayout(
      ['centre', 'pere'],
      [mockRel('pere', 'centre', 'PARENT_CHILD', 'père')],
      'centre'
    )
    const pereNode = result.nodes.find(n => n.id === 'pere')
    expect(pereNode?.orbit).toBe(1)
  })

  it('distributes angles uniformly within an orbit', () => {
    const rels = [
      mockRel('a', 'centre', 'PARENT_CHILD', 'père'),
      mockRel('b', 'centre', 'PARENT_CHILD', 'mère'),
    ]
    const result = computeCosmosLayout(['centre', 'a', 'b'], rels, 'centre')
    const orbit1 = result.nodes.filter(n => n.orbit === 1)
    expect(orbit1).toHaveLength(2)
    // Angles should be π apart (2π / 2 = π)
    const angles = orbit1.map(n => n.angle).sort((x, y) => x - y)
    expect(Math.abs(angles[1] - angles[0])).toBeCloseTo(Math.PI, 5)
  })

  it('marks persons with no relationship to center as orphans', () => {
    const result = computeCosmosLayout(['p1', 'p2'], [], 'p1')
    expect(result.orphans).toContain('p2')
    expect(result.nodes.find(n => n.id === 'p2')).toBeUndefined()
  })

  it('ORBIT_RADII has keys 0 through 5', () => {
    for (let i = 0; i <= 5; i++) {
      expect(ORBIT_RADII[i]).toBeGreaterThanOrEqual(0)
    }
  })
})
```

- [ ] **Step 5: Run all layout tests — expect FAIL**

```bash
npx vitest run src/components/cosmos/__tests__/cosmosLayout.test.ts
```
Expected: all failing.

- [ ] **Step 6: Implement `cosmosLayout.ts`**

Replace the entire file:

```typescript
// src/components/cosmos/cosmosLayout.ts
import type { Relationship, RelationshipType } from '@/lib/types/database'

export const ORBIT_RADII: Record<number, number> = {
  0: 0,
  1: 90,
  2: 155,
  3: 215,
  4: 265,
  5: 310,
}

export interface PositionedNode {
  id: string
  orbit: number   // 0 = centre, 1–5 = orbital rings
  angle: number   // initial angle in radians
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
    return 5  // unknown role → furthest orbit
  }

  // Fallback by type + direction
  switch (type) {
    case 'UNION':       return 2
    case 'PARENT_CHILD': return isPersonA ? 2 : 3  // isPersonA=true → centre is parent → enfant orbit 2
    case 'ADOPTION':    return isPersonA ? 2 : 4
    case 'SIBLING':     return 3
    case 'HALF_SIBLING': return 3
    case 'STEP':        return isPersonA ? 4 : 1   // isPersonA=false → centre is bel-enfant → beau-parent orbit 1
    default:            return 5
  }
}

export function computeCosmosLayout(
  personIds: string[],
  relationships: Relationship[],
  centerId: string
): CosmosLayoutResult {
  if (personIds.length === 0) return { nodes: [], orphans: [] }
  if (!personIds.includes(centerId)) return { nodes: [], orphans: personIds.slice() }

  // Assign orbit to each person connected to center
  const orbitMap = new Map<string, number>([[centerId, 0]])

  for (const rel of relationships) {
    let neighborId: string | null = null
    let isPersonA: boolean  // whether the CENTER is person_a_id

    if (rel.person_a_id === centerId && personIds.includes(rel.person_b_id)) {
      neighborId = rel.person_b_id
      isPersonA = true
    } else if (rel.person_b_id === centerId && personIds.includes(rel.person_a_id)) {
      neighborId = rel.person_a_id
      isPersonA = false
    } else {
      continue
    }

    if (orbitMap.has(neighborId)) continue  // already assigned (first relation wins)

    const role = getMetadataRole(rel)
    // When center is person_b (isPersonA=false), the role stored is relative to person_a.
    // e.g. rel.person_a_id=père, rel.person_b_id=centre → metadata.role='père' → centre sees père
    // The role is always the "role of the other person relative to center".
    const orbit = getOrbitForRole(role, rel.type, isPersonA)
    orbitMap.set(neighborId, orbit)
  }

  // Orphans: persons not reached
  const orphans = personIds.filter(id => !orbitMap.has(id))

  // Group by orbit
  const orbitGroups = new Map<number, string[]>()
  for (const [id, orbit] of orbitMap) {
    if (!orbitGroups.has(orbit)) orbitGroups.set(orbit, [])
    orbitGroups.get(orbit)!.push(id)
  }

  // Assign initial angles
  const nodes: PositionedNode[] = []
  for (const [orbit, ids] of orbitGroups) {
    ids.forEach((id, i) => {
      const angle = orbit === 0 ? 0 : (2 * Math.PI * i) / ids.length
      nodes.push({ id, orbit, angle })
    })
  }

  return { nodes, orphans }
}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
npx vitest run src/components/cosmos/__tests__/cosmosLayout.test.ts
```
Expected: all passing.

- [ ] **Step 8: Run full test suite — no regressions**

```bash
npm run test:run
```
Expected: all passing (the CosmosView test for 'renders edges' and 'renders initials' will still pass as CosmosView.tsx hasn't changed yet — that's fine).

- [ ] **Step 9: Commit**

```bash
git add src/components/cosmos/cosmosLayout.ts src/components/cosmos/__tests__/cosmosLayout.test.ts
git commit -m "feat(cosmos): role-based orbital layout, ORBIT_RADII 0-5"
```

---

## Chunk 2: Node and Tooltip components

### Task 2: `CosmosNode.tsx` — shadow + circle, no initials

**Files:**
- Modify: `src/components/cosmos/CosmosNode.tsx`

- [ ] **Step 1: Replace `CosmosNode.tsx`**

```typescript
// src/components/cosmos/CosmosNode.tsx
import { forwardRef } from 'react'

export interface CosmosNodeProps {
  id: string
  cx: number         // SVG center X (for shadow direction)
  cy: number         // SVG center Y
  orbit: number      // 1–5
  deceased: boolean
  mode: 'mono' | 'branch'
  branchColor: string
  onClick: (id: string) => void
  onHover: (id: string | null) => void
}

// Rendered inside <g transform="translate(x,y)">, so local coords: node = (0,0)
// cx/cy are SVG-space center — but since the group is translated to (x,y),
// we pass shadowDx/shadowDy (pre-computed direction * length from CosmosView)
export interface CosmosNodeRenderProps extends CosmosNodeProps {
  shadowDx: number    // x2 of shadow line in local coords
  shadowDy: number    // y2 of shadow line in local coords
  transform?: string  // SVG transform attribute — initial position set by CosmosView, updated by rAF
}

export const CosmosNode = forwardRef<SVGGElement, CosmosNodeRenderProps>(
  function CosmosNode({ id, deceased, mode, branchColor, shadowDx, shadowDy, transform, onClick, onHover }, ref) {
    const fill = mode === 'branch'
      ? (deceased ? 'none' : branchColor)
      : (deceased ? 'none' : 'white')

    const stroke = deceased
      ? (mode === 'branch' ? branchColor : 'rgba(140,100,120,0.6)')
      : 'none'

    const strokeOpacity = deceased ? (mode === 'branch' ? 0.7 : 1) : undefined
    const strokeDasharray = deceased ? '2 2' : undefined

    return (
      <g
        ref={ref}
        transform={transform}
        onMouseEnter={() => onHover(id)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onClick(id)}
        style={{ cursor: 'pointer' }}
      >
        {/* Shadow line — direction toward SVG center */}
        <line
          className="shadow-line"
          x1={0} y1={0}
          x2={shadowDx} y2={shadowDy}
          stroke="rgba(80,45,65,0.45)"
          strokeWidth={deceased ? 1 : 1.2}
          strokeLinecap="round"
        />
        {/* Node circle */}
        <circle
          r={5}
          fill={fill}
          stroke={stroke}
          strokeWidth={deceased ? 1 : undefined}
          strokeOpacity={strokeOpacity}
          strokeDasharray={strokeDasharray}
          filter={!deceased ? 'url(#nodeGlow)' : undefined}
        />
      </g>
    )
  }
)
```

- [ ] **Step 2: Run test suite — expect no new failures**

```bash
npm run test:run
```
Expected: same failures as before (CosmosView tests that depend on old CosmosNode still pass because CosmosView.tsx hasn't changed yet).

### Task 2b: `CosmosNode.tsx` — tests

**Files:**
- Create: `src/components/cosmos/__tests__/CosmosNode.test.tsx`

- [ ] **Step 1: Create test file**

```typescript
// src/components/cosmos/__tests__/CosmosNode.test.tsx
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { CosmosNode } from '../CosmosNode'

const baseProps = {
  id: 'p1',
  cx: 350, cy: 350, orbit: 1,
  deceased: false,
  mode: 'mono' as const,
  branchColor: '#7c9cbf',
  shadowDx: -20, shadowDy: 0,
  onClick: vi.fn(), onHover: vi.fn(),
}

// SVG filter elements need a container to render
function renderInSvg(node: React.ReactElement) {
  const { container } = render(
    <svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="nodeGlow"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      {node}
    </svg>
  )
  return container
}

describe('CosmosNode', () => {
  it('renders a circle with fill white in mono mode (alive)', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('white')
  })

  it('renders a dashed circle (no fill) in mono mode (deceased)', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} deceased={true} />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('none')
    expect(circle?.getAttribute('stroke-dasharray')).toBeTruthy()
  })

  it('renders circle with branch color fill in branch mode (alive)', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} mode="branch" />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('#7c9cbf')
  })

  it('renders dashed circle with branch color stroke in branch mode (deceased)', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} mode="branch" deceased={true} />)
    const circle = container.querySelector('circle')
    expect(circle?.getAttribute('fill')).toBe('none')
    expect(circle?.getAttribute('stroke')).toBe('#7c9cbf')
    expect(circle?.getAttribute('stroke-dasharray')).toBeTruthy()
  })

  it('renders a shadow line with className shadow-line', () => {
    const container = renderInSvg(<CosmosNode {...baseProps} />)
    expect(container.querySelector('.shadow-line')).toBeTruthy()
  })

  it('calls onHover with id on mouse enter', () => {
    const onHover = vi.fn()
    const container = renderInSvg(<CosmosNode {...baseProps} onHover={onHover} />)
    const g = container.querySelector('g')
    g?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    expect(onHover).toHaveBeenCalledWith('p1')
  })

  it('calls onClick with id on click', () => {
    const onClick = vi.fn()
    const container = renderInSvg(<CosmosNode {...baseProps} onClick={onClick} />)
    const g = container.querySelector('g')
    g?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClick).toHaveBeenCalledWith('p1')
  })
})
```

- [ ] **Step 2: Run — verify these tests pass**

```bash
npx vitest run src/components/cosmos/__tests__/CosmosNode.test.tsx
```
Expected: all passing.

- [ ] **Step 3: Commit**

```bash
git add src/components/cosmos/__tests__/CosmosNode.test.tsx
git commit -m "test(cosmos): add CosmosNode component tests"
```

---

### Task 3: `CosmosTooltip.tsx` — light theme + role prop

**Files:**
- Modify: `src/components/cosmos/CosmosTooltip.tsx`

- [ ] **Step 1: Replace `CosmosTooltip.tsx`**

The tooltip becomes a regular `<div>` positioned by the parent via `style`. CosmosView will pass absolute pixel coordinates (from `mousemove`) and control visibility.

```typescript
// src/components/cosmos/CosmosTooltip.tsx
import type { Person } from '@/lib/types/database'

interface CosmosTooltipProps {
  person: Person
  role: string
  x: number   // absolute pixel position (clientX + offset)
  y: number   // absolute pixel position
}

function formatYear(date: string | null): string {
  if (!date) return ''
  return new Date(date).getFullYear().toString()
}

export function CosmosTooltip({ person, role, x, y }: CosmosTooltipProps) {
  const birthYear = formatYear(person.date_naissance)
  const deathYear = formatYear(person.date_deces)
  const deceased = person.date_deces !== null

  return (
    <div
      style={{
        position: 'fixed',
        left: x + 14,
        top: y - 10,
        pointerEvents: 'none',
        zIndex: 20,
        background: 'rgba(255,245,250,0.92)',
        border: '1px solid rgba(160,110,130,0.25)',
        borderRadius: 6,
        padding: '7px 11px',
        backdropFilter: 'blur(8px)',
        minWidth: 120,
      }}
    >
      <div style={{ color: '#5a3545', fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>
        {person.prenom} {person.nom}
      </div>
      <div style={{ color: '#9c7888', fontSize: 10, marginTop: 2 }}>
        {birthYear}{deceased && deathYear ? ` – † ${deathYear}` : ''}
      </div>
      <div style={{ color: '#a06878', fontSize: 10, marginTop: 1 }}>{role}</div>
    </div>
  )
}
```

- [ ] **Step 2: Run test suite**

```bash
npm run test:run
```
Expected: same result as before.

- [ ] **Step 3: Commit components**

```bash
git add src/components/cosmos/CosmosNode.tsx src/components/cosmos/CosmosTooltip.tsx
git commit -m "feat(cosmos): new CosmosNode (shadow+circle), CosmosTooltip (light theme)"
```

---

## Chunk 3: CosmosView refactor

### Task 4: `CosmosView.tsx` — animated orbital view

**Files:**
- Modify: `src/components/cosmos/CosmosView.tsx`

- [ ] **Step 1: Replace `CosmosView.tsx`**

```typescript
// src/components/cosmos/CosmosView.tsx
'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { computeCosmosLayout, ORBIT_RADII, getMetadataRole, getOrbitForRole } from './cosmosLayout'
import { CosmosNode } from './CosmosNode'
import { CosmosTooltip } from './CosmosTooltip'
import type { Person } from '@/lib/types/database'

const DEFAULT_BRANCH_COLOR = '#c4909e'

const ORBIT_SPEEDS: Record<number, number> = {
  1: 0.16, 2: 0.12, 3: 0.09, 4: 0.07, 5: 0.05,
}

const RELATION_LABEL: Record<string, string> = {
  PARENT_CHILD: 'Parent / Enfant',
  UNION: 'Union',
  ADOPTION: 'Adoption',
  SIBLING: 'Frère / Sœur',
  HALF_SIBLING: 'Demi-frère / Demi-sœur',
  STEP: 'Beau-parent / Bel-enfant',
}

export function CosmosView() {
  const {
    persons, relationships, branches, personBranches,
    selectedPersonId, selectPerson, openAddPerson,
  } = useTree()

  // Auto-select first person when none selected
  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  // Branch color toggle
  const [branchMode, setBranchMode] = useState<'mono' | 'branch'>(() => {
    if (typeof window === 'undefined') return 'mono'
    return localStorage.getItem('cosmos_branch_colors') === 'true' ? 'branch' : 'mono'
  })

  const toggleBranchMode = useCallback(() => {
    setBranchMode(prev => {
      const next = prev === 'mono' ? 'branch' : 'mono'
      localStorage.setItem('cosmos_branch_colors', String(next === 'branch'))
      return next
    })
  }, [])

  // Tooltip state
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const grainRef = useRef<HTMLCanvasElement>(null)
  const cxRef = useRef(0)
  const cyRef = useRef(0)

  // Per-node refs for direct DOM mutation in rAF
  const nodeGroupRefs = useRef(new Map<string, SVGGElement>())
  // Per-node current angle (mutated each frame)
  const nodeAngles = useRef(new Map<string, number>())

  // Branch color map
  const branchColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const pb of personBranches) {
      const branch = branches.find(b => b.id === pb.branch_id)
      if (branch) map.set(pb.person_id, branch.couleur)
    }
    return map
  }, [personBranches, branches])

  // Role map for tooltip: personId → human-readable role
  const centerId = selectedPersonId ?? persons[0]?.id ?? ''
  const roleMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const rel of relationships) {
      const neighborId =
        rel.person_a_id === centerId ? rel.person_b_id :
        rel.person_b_id === centerId ? rel.person_a_id : null
      if (!neighborId) continue
      const role = getMetadataRole(rel) ?? RELATION_LABEL[rel.type] ?? rel.type
      if (!map.has(neighborId)) map.set(neighborId, role)
    }
    return map
  }, [relationships, centerId])

  const { nodes, orphans } = useMemo(
    () => computeCosmosLayout(persons.map(p => p.id), relationships, centerId),
    [persons, relationships, centerId]
  )

  // Draw grain once
  useEffect(() => {
    const canvas = grainRef.current
    if (!canvas) return
    const W = canvas.width = window.innerWidth
    const H = canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')!
    const img = ctx.createImageData(W, H)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }, [])

  // rAF loop + ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return

    // Init angles from layout
    for (const node of nodes) {
      if (!nodeAngles.current.has(node.id)) {
        nodeAngles.current.set(node.id, node.angle)
      }
    }

    const updateCenter = () => {
      if (!containerRef.current) return
      cxRef.current = containerRef.current.offsetWidth / 2
      cyRef.current = containerRef.current.offsetHeight / 2
    }
    updateCenter()

    let lastTs: number | null = null
    let rafId: number

    function tick(ts: number) {
      const dt = lastTs === null ? 0 : (ts - lastTs) / (1000 / 60)
      lastTs = ts

      const CX = cxRef.current
      const CY = cyRef.current

      for (const node of nodes) {
        if (node.orbit === 0) continue
        const speed = ORBIT_SPEEDS[node.orbit] ?? 0.05
        const current = nodeAngles.current.get(node.id) ?? node.angle
        const next = current + speed * dt * (Math.PI / 180)
        nodeAngles.current.set(node.id, next)

        const r = ORBIT_RADII[node.orbit] ?? ORBIT_RADII[5]
        const x = CX + r * Math.cos(next)
        const y = CY + r * Math.sin(next)

        const el = nodeGroupRefs.current.get(node.id)
        if (!el) continue

        el.setAttribute('transform', `translate(${x},${y})`)

        // Update shadow direction
        const shadowEl = el.querySelector('.shadow-line') as SVGLineElement | null
        if (shadowEl) {
          const dx = CX - x
          const dy = CY - y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const len = 24 + (5 - node.orbit) * 6
          shadowEl.setAttribute('x2', String((dx / dist) * len))
          shadowEl.setAttribute('y2', String((dy / dist) * len))
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    const observer = new ResizeObserver(updateCenter)
    observer.observe(containerRef.current)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [nodes])

  if (persons.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 16,
        background: 'linear-gradient(170deg, #b5c4d3 0%, #c4b8cf 45%, #c4909e 80%, #b07d8a 100%)',
        color: '#7a4555',
      }}>
        <div style={{ fontSize: 18 }}>🌳 Votre arbre vous attend</div>
        <button
          onClick={openAddPerson}
          style={{
            padding: '8px 16px', background: 'rgba(255,255,255,0.25)',
            color: '#5a3545', border: '1px solid rgba(160,110,130,0.3)',
            borderRadius: 6, cursor: 'pointer', fontSize: 14,
          }}
        >
          + Ajouter une personne
        </button>
      </div>
    )
  }

  const centerPerson = persons.find(p => p.id === centerId)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
        background: 'linear-gradient(170deg, #b5c4d3 0%, #c4b8cf 45%, #c4909e 80%, #b07d8a 100%)',
      }}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Grain */}
      <canvas
        ref={grainRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          opacity: 0.10, mixBlendMode: 'overlay',
        }}
      />

      {/* SVG */}
      <svg ref={svgRef} width="100%" height="100%">
        <defs>
          <radialGradient id="cosmosGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"/>
            <stop offset="20%"  stopColor="#f0e8f0" stopOpacity="0.7"/>
            <stop offset="55%"  stopColor="#d4b8c8" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#c4909e" stopOpacity="0"/>
          </radialGradient>
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Glow disk — centered via JS after mount, initial 50% */}
        <circle
          id="cosmos-glow-disk"
          cx="50%" cy="50%" r={200}
          fill="url(#cosmosGlow)"
        />

        {/* Orbit rings */}
        {[1, 2, 3, 4, 5].map(i => (
          <circle
            key={i}
            id={`cosmos-orbit-${i}`}
            cx="50%" cy="50%"
            r={ORBIT_RADII[i]}
            fill="none"
            stroke={`rgba(80,45,65,${[0, 0.14, 0.10, 0.06, 0.04, 0.03][i]})`}
            strokeWidth={0.6}
          />
        ))}

        {/* Orbital nodes — initial positions; rAF updates transform */}
        {nodes.filter(n => n.orbit > 0).map(node => {
          const person = persons.find(p => p.id === node.id)
          if (!person) return null
          const r = ORBIT_RADII[node.orbit] ?? ORBIT_RADII[5]
          const initX = (containerRef.current?.offsetWidth ?? 700) / 2 + r * Math.cos(node.angle)
          const initY = (containerRef.current?.offsetHeight ?? 700) / 2 + r * Math.sin(node.angle)
          const deceased = person.date_deces !== null
          const dx = 0  // shadow starts at (0,0) in local coords; rAF updates x2/y2
          return (
            <CosmosNode
              key={node.id}
              ref={(el) => {
                if (el) nodeGroupRefs.current.set(node.id, el)
                else nodeGroupRefs.current.delete(node.id)
              }}
              id={node.id}
              cx={cxRef.current}
              cy={cyRef.current}
              orbit={node.orbit}
              deceased={deceased}
              mode={branchMode}
              branchColor={branchColorMap.get(node.id) ?? DEFAULT_BRANCH_COLOR}
              shadowDx={dx}
              shadowDy={0}
              onClick={selectPerson}
              onHover={setHoveredId}
              transform={`translate(${initX},${initY})`}
            />
          )
        })}

        {/* Center node */}
        {centerPerson && (() => {
          const birthYear = centerPerson.date_naissance
            ? new Date(centerPerson.date_naissance).getFullYear()
            : null
          return (
            <g id="cosmos-center">
              <circle cx="50%" cy="50%" r={18} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1}/>
              <circle cx="50%" cy="50%" r={10} fill="white" filter="url(#nodeGlow)"/>
              <text x="50%" y="50%" dy="-22" textAnchor="middle"
                fill="white" fontSize={11} fontWeight={600} letterSpacing="0.04em">
                {centerPerson.prenom}
              </text>
              <text x="50%" y="50%" dy="-10" textAnchor="middle"
                fill="rgba(255,255,255,0.55)" fontSize={9} letterSpacing="0.04em">
                {centerPerson.nom}{birthYear ? ` · ${birthYear}` : ''}
              </text>
            </g>
          )
        })()}
      </svg>

      {/* Branch color toggle */}
      <div
        onClick={toggleBranchMode}
        data-testid="branch-toggle"
        style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,245,250,0.18)', border: '1px solid rgba(160,110,130,0.22)',
          borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
          backdropFilter: 'blur(8px)', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>
          Couleurs de branches
        </span>
        <div style={{
          width: 28, height: 15,
          background: branchMode === 'branch' ? 'rgba(200,140,160,0.75)' : 'rgba(160,110,130,0.3)',
          borderRadius: 8, position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            width: 11, height: 11, background: 'white', borderRadius: '50%',
            position: 'absolute', top: 2,
            left: branchMode === 'branch' ? 15 : 2,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}/>
        </div>
      </div>

      {/* Orphan badge */}
      {orphans.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          background: 'rgba(180,120,140,0.2)', color: 'rgba(100,65,80,0.7)',
          borderRadius: 6, padding: '4px 10px', fontSize: 12,
        }}>
          {orphans.length} non connecté{orphans.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Tooltip */}
      {hoveredId && (() => {
        const person = persons.find(p => p.id === hoveredId)
        if (!person) return null
        const role = roleMap.get(hoveredId) ?? ''
        return (
          <CosmosTooltip
            person={person}
            role={role}
            x={mousePos.x}
            y={mousePos.y}
          />
        )
      })()}
    </div>
  )
}
```

> **Note :** La position initiale est définie via l'attribut SVG `transform="translate(x,y)"` passé comme prop à `CosmosNode`. Le rAF écrase ensuite cet attribut à chaque frame via `setAttribute`. En jsdom (tests), `offsetWidth/offsetHeight = 0`, donc tous les nœuds s'initialisent à `(0 + r*cos(angle), 0 + r*sin(angle))` — acceptable pour les tests.

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```
Expected: quelques tests CosmosView échoueront (initials, edges) — c'est prévu, on les corrige dans la tâche suivante.

- [ ] **Step 3: Commit**

```bash
git add src/components/cosmos/CosmosView.tsx
git commit -m "feat(cosmos): animated orbital view, gradient background, grain, glow, toggle"
```

---

## Chunk 4: Update tests

### Task 5: Update `CosmosView.test.tsx`

**Files:**
- Modify: `src/components/cosmos/__tests__/CosmosView.test.tsx`

- [ ] **Step 1: Replace test file**

The tests for initials and edges are removed (those behaviors no longer exist). New tests check the center label, toggle, and orphan badge.

```typescript
// src/components/cosmos/__tests__/CosmosView.test.tsx
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

import { useTree } from '@/lib/context/tree-context'
import { CosmosView } from '../CosmosView'
import type { Person, Relationship } from '@/lib/types/database'

beforeAll(() => {
  // ResizeObserver not available in jsdom
  globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
  }))
})

const mockPerson = (id: string, prenom: string, nom: string, opts: Partial<Person> = {}): Person => ({
  id, prenom, nom,
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
  ...opts,
})

const mockRel = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD', role?: string): Relationship => ({
  id: `${a}-${b}`, person_a_id: a, person_b_id: b, type,
  metadata: role ? { role } : {},
})

const baseTree = {
  branches: [], personBranches: [], currentRole: 'ADMIN' as const,
  openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(), pendingSuggestionsCount: 0,
}

beforeEach(() => { vi.clearAllMocks() })

describe('CosmosView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [], relationships: [],
      selectedPersonId: null, selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('shows add-person button when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [], relationships: [],
      selectedPersonId: null, selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByRole('button', { name: /ajouter une personne/i })).toBeTruthy()
  })

  it('renders SVG when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    const { container } = render(<CosmosView />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders center person first name in SVG', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText('Jean')).toBeTruthy()
  })

  it('auto-selects first person when selectedPersonId is null', () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      selectedPersonId: null, selectPerson,
    })
    render(<CosmosView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })

  it('renders the branch color toggle button', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByTestId('branch-toggle')).toBeTruthy()
    expect(screen.getByText(/couleurs de branches/i)).toBeTruthy()
  })

  it('shows orphan count badge for unconnected persons', () => {
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [mockPerson('p1', 'Jean', 'Dupont'), mockPerson('p2', 'Marie', 'Martin')],
      relationships: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    render(<CosmosView />)
    expect(screen.getByText(/1 non connecté/i)).toBeTruthy()
  })

  it('renders a node group for each non-center connected person', () => {
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [p1, p2],
      relationships: [mockRel('p2', 'p1', 'PARENT_CHILD', 'père')],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
    })
    const { container } = render(<CosmosView />)
    // p2 is orbital node — should have a shadow line
    const shadowLines = container.querySelectorAll('.shadow-line')
    expect(shadowLines.length).toBe(1)
  })

  it('calls selectPerson when an orbital node is clicked', () => {
    const selectPerson = vi.fn()
    const p1 = mockPerson('p1', 'Jean', 'Dupont')
    const p2 = mockPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      ...baseTree,
      persons: [p1, p2],
      relationships: [mockRel('p2', 'p1', 'PARENT_CHILD', 'père')],
      selectedPersonId: 'p1', selectPerson,
    })
    const { container } = render(<CosmosView />)
    const nodeGroup = container.querySelector('g[style*="cursor"]')
    if (nodeGroup) fireEvent.click(nodeGroup)
    expect(selectPerson).toHaveBeenCalledWith('p2')
  })
})
```

- [ ] **Step 2: Run tests — expect all passing**

```bash
npm run test:run
```
Expected: 272+ tests passing, 0 failing.

- [ ] **Step 3: Commit**

```bash
git add src/components/cosmos/__tests__/CosmosView.test.tsx
git commit -m "test(cosmos): update tests for animated orbital view, remove initials/edge tests"
```

- [ ] **Step 4: Push**

```bash
git push
```

---

## Vérification finale

- [ ] Lancer `npm run dev` et ouvrir http://localhost:3000
- [ ] Vérifier que la vue Cosmos est la vue par défaut
- [ ] Vérifier : fond dégradé pastel, grain, glow central, orbites, nœuds animés, ombres
- [ ] Vérifier : clic sur un nœud → recentre
- [ ] Vérifier : toggle "Couleurs de branches" → change la couleur des nœuds
- [ ] Vérifier : badge orphelins visible si personnes non connectées
- [ ] Vérifier : tooltip au survol avec nom, année, rôle
