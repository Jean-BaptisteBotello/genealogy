# Secondary Views Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four secondary visualization views (Sablier/hourglass, Timeline, Carte/map, Éventail/fan chart) behind a working view switcher wired to the existing Topbar.

**Architecture:** AppShell gains `activeView` state and wires it to the Topbar. A new `ViewRouter` component renders the correct view based on that prop. Each view is an independent `'use client'` component reading from `TreeContext`. Sablier uses React Flow; Carte uses Leaflet via `next/dynamic { ssr: false }`; Timeline and Éventail are custom SVG.

**Tech Stack:** React 19, TypeScript, Vitest + RTL, React Flow (`reactflow@11`), Leaflet + `react-leaflet` + `@types/leaflet`, SVG (no extra lib for Timeline/Éventail), Next.js dynamic import.

---

## File Map

| Status | File | Purpose |
|--------|------|---------|
| Modify | `src/components/layout/AppShell.tsx` | Add `activeView` state, wire Topbar `onViewChange` |
| Modify | `src/app/(app)/tree/page.tsx` | Remove CosmosView — AppShell now owns rendering |
| Create | `src/components/views/ViewRouter.tsx` | Renders correct view for `activeView` prop |
| Create | `src/components/views/__tests__/ViewRouter.test.tsx` | |
| Create | `src/components/views/sablier/sablierLayout.ts` | BFS ancestry/descent layout for React Flow |
| Create | `src/components/views/sablier/__tests__/sablierLayout.test.ts` | |
| Create | `src/components/views/sablier/SablierView.tsx` | React Flow hourglass canvas |
| Create | `src/components/views/sablier/__tests__/SablierView.test.tsx` | |
| Create | `src/components/views/timeline/TimelineView.tsx` | SVG horizontal timeline by birth year |
| Create | `src/components/views/timeline/__tests__/TimelineView.test.tsx` | |
| Create | `src/components/views/carte/CarteViewInner.tsx` | Leaflet MapContainer (client-only) |
| Create | `src/components/views/carte/CarteView.tsx` | `next/dynamic` SSR wrapper |
| Create | `src/components/views/carte/__tests__/CarteView.test.tsx` | |
| Create | `src/components/views/eventail/EventailView.tsx` | SVG fan chart — ancestors in concentric arcs |
| Create | `src/components/views/eventail/__tests__/EventailView.test.tsx` | |

---

## Chunk 1: View Switching + Sablier

### Task C4-1: Install dependencies + wire view switching

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/app/(app)/tree/page.tsx`

- [ ] **Step 1: Install React Flow and Leaflet**

```bash
cd /Users/jbbotello/Genealogy && npm install reactflow react-leaflet leaflet @types/leaflet
```

Expected: packages installed, no peer dep errors

- [ ] **Step 2: Modify AppShell to manage activeView**

In `src/components/layout/AppShell.tsx`:

Add `View` type import at top:
```typescript
type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'
```

Add state inside the component (after existing `useState` calls):
```typescript
const [activeView, setActiveView] = useState<View>('cosmos')
```

Wire the Topbar (replace the existing `<Topbar ...>` element):
```tsx
<Topbar
  userEmail={userEmail}
  activeView={activeView}
  onViewChange={setActiveView}
  onAddPerson={openAddPerson}
  onSearchOpen={() => setSearchOpen(true)}
/>
```

Replace `{children}` in `<main>` with the ViewRouter:
```tsx
import { ViewRouter } from '@/components/views/ViewRouter'

// inside JSX, replace:
<main className="flex-1 overflow-hidden relative">{children}</main>
// with:
<main className="flex-1 overflow-hidden relative">
  <ViewRouter activeView={activeView} />
</main>
```

Remove `children` from `AppShellProps` and the function signature.

- [ ] **Step 3: Update tree/page.tsx**

Replace content of `src/app/(app)/tree/page.tsx` with:
```typescript
// src/app/(app)/tree/page.tsx
// AppShell now owns view rendering — this page intentionally empty.
export default function TreePage() {
  return null
}
```

- [ ] **Step 4: Update layout.tsx to remove children prop**

`src/app/(app)/layout.tsx` passes `{children}` to AppShell. Remove it:
```tsx
return (
  <AppShell
    userEmail={user.email ?? ''}
    initialPersons={(persons ?? []) as Person[]}
    initialBranches={(branches ?? []) as Branch[]}
    initialRelationships={(relationships ?? []) as Relationship[]}
    initialPersonBranches={(personBranches ?? []) as PersonBranch[]}
  />
)
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/jbbotello/Genealogy && npx tsc --noEmit 2>&1 | head -20
```

Expected: only errors about missing ViewRouter (not yet created) — or none if you create a stub.

- [ ] **Step 6: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/layout/AppShell.tsx src/app/(app)/tree/page.tsx src/app/(app)/layout.tsx && git commit -m "feat(views): wire activeView state into AppShell + Topbar"
```

---

### Task C4-2: ViewRouter tests + implementation

**Files:**
- Create: `src/components/views/__tests__/ViewRouter.test.tsx`
- Create: `src/components/views/ViewRouter.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/views/__tests__/ViewRouter.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/cosmos/CosmosView', () => ({
  CosmosView: () => <div data-testid="cosmos-view" />,
}))
vi.mock('@/components/views/sablier/SablierView', () => ({
  SablierView: () => <div data-testid="sablier-view" />,
}))
vi.mock('@/components/views/timeline/TimelineView', () => ({
  TimelineView: () => <div data-testid="timeline-view" />,
}))
vi.mock('@/components/views/carte/CarteView', () => ({
  CarteView: () => <div data-testid="carte-view" />,
}))
vi.mock('@/components/views/eventail/EventailView', () => ({
  EventailView: () => <div data-testid="eventail-view" />,
}))

import { ViewRouter } from '../ViewRouter'

describe('ViewRouter', () => {
  it('renders CosmosView for cosmos', () => {
    render(<ViewRouter activeView="cosmos" />)
    expect(screen.getByTestId('cosmos-view')).toBeTruthy()
  })

  it('renders SablierView for sablier', () => {
    render(<ViewRouter activeView="sablier" />)
    expect(screen.getByTestId('sablier-view')).toBeTruthy()
  })

  it('renders TimelineView for timeline', () => {
    render(<ViewRouter activeView="timeline" />)
    expect(screen.getByTestId('timeline-view')).toBeTruthy()
  })

  it('renders CarteView for carte', () => {
    render(<ViewRouter activeView="carte" />)
    expect(screen.getByTestId('carte-view')).toBeTruthy()
  })

  it('renders EventailView for eventail', () => {
    render(<ViewRouter activeView="eventail" />)
    expect(screen.getByTestId('eventail-view')).toBeTruthy()
  })

  it('renders only one view at a time', () => {
    render(<ViewRouter activeView="sablier" />)
    expect(screen.queryByTestId('cosmos-view')).toBeNull()
    expect(screen.queryByTestId('timeline-view')).toBeNull()
    expect(screen.getByTestId('sablier-view')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to confirm FAIL**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/__tests__/ViewRouter.test.tsx 2>&1 | tail -10
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement ViewRouter**

```typescript
// src/components/views/ViewRouter.tsx
import { CosmosView } from '@/components/cosmos/CosmosView'
import { SablierView } from '@/components/views/sablier/SablierView'
import { TimelineView } from '@/components/views/timeline/TimelineView'
import { CarteView } from '@/components/views/carte/CarteView'
import { EventailView } from '@/components/views/eventail/EventailView'

type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'

interface ViewRouterProps {
  activeView: View
}

export function ViewRouter({ activeView }: ViewRouterProps) {
  switch (activeView) {
    case 'cosmos': return <CosmosView />
    case 'sablier': return <SablierView />
    case 'timeline': return <TimelineView />
    case 'carte': return <CarteView />
    case 'eventail': return <EventailView />
  }
}
```

- [ ] **Step 4: Create stub implementations** so ViewRouter compiles

Create each stub file (they will be replaced by real implementations in later tasks):

`src/components/views/sablier/SablierView.tsx`:
```typescript
'use client'
export function SablierView() { return <div>Sablier</div> }
```

`src/components/views/timeline/TimelineView.tsx`:
```typescript
'use client'
export function TimelineView() { return <div>Timeline</div> }
```

`src/components/views/carte/CarteView.tsx`:
```typescript
'use client'
export function CarteView() { return <div>Carte</div> }
```

`src/components/views/eventail/EventailView.tsx`:
```typescript
'use client'
export function EventailView() { return <div>Éventail</div> }
```

- [ ] **Step 5: Run tests to verify 6/6 pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/__tests__/ViewRouter.test.tsx
```

Expected: 6/6 PASS

- [ ] **Step 6: Run full suite to check no regressions**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run 2>&1 | tail -5
```

Expected: all previous tests still pass

- [ ] **Step 7: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/views/ && git commit -m "feat(views): ViewRouter + stub views"
```

---

### Task C4-3: sablierLayout tests

**Files:**
- Create: `src/components/views/sablier/__tests__/sablierLayout.test.ts`

**Context:** The sablier (hourglass) layout positions ancestors above the center (negative Y) and descendants below (positive Y). Each generation is a horizontal row. Persons in the same generation are spread evenly.

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/views/sablier/__tests__/sablierLayout.test.ts
import { describe, it, expect } from 'vitest'
import { computeSablierLayout, ROW_HEIGHT } from '../sablierLayout'
import type { Relationship } from '@/lib/types/database'

const REL = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD', meta: Record<string, unknown> = {}): Relationship => ({
  id: `${a}-${b}`,
  person_a_id: a,
  person_b_id: b,
  type,
  metadata: meta,
})

describe('computeSablierLayout', () => {
  it('places center person at generation 0, position (0, 0)', () => {
    const result = computeSablierLayout(['p1'], [], 'p1')
    const center = result.nodes.find(n => n.id === 'p1')
    expect(center?.generation).toBe(0)
    expect(center?.x).toBe(0)
    expect(center?.y).toBe(0)
  })

  it('places parent at generation -1 (above center)', () => {
    // p1 is parent of p2, so p1 = person_a_id, p2 = person_b_id
    const result = computeSablierLayout(['p1', 'p2'], [REL('p1', 'p2')], 'p2')
    const parent = result.nodes.find(n => n.id === 'p1')
    expect(parent?.generation).toBe(-1)
    expect(parent?.y).toBe(-ROW_HEIGHT)
  })

  it('places child at generation +1 (below center)', () => {
    // p1 is parent of p2
    const result = computeSablierLayout(['p1', 'p2'], [REL('p1', 'p2')], 'p1')
    const child = result.nodes.find(n => n.id === 'p2')
    expect(child?.generation).toBe(1)
    expect(child?.y).toBe(ROW_HEIGHT)
  })

  it('places grandparent at generation -2', () => {
    // p1 parent of p2, p2 parent of p3; center = p3
    const result = computeSablierLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2'), REL('p2', 'p3')],
      'p3'
    )
    const grandparent = result.nodes.find(n => n.id === 'p1')
    expect(grandparent?.generation).toBe(-2)
    expect(grandparent?.y).toBe(-2 * ROW_HEIGHT)
  })

  it('places grandchild at generation +2', () => {
    const result = computeSablierLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2'), REL('p2', 'p3')],
      'p1'
    )
    const grandchild = result.nodes.find(n => n.id === 'p3')
    expect(grandchild?.generation).toBe(2)
    expect(grandchild?.y).toBe(2 * ROW_HEIGHT)
  })

  it('spreads two parents horizontally at the same y', () => {
    // p1 and p2 both parents of p3
    const result = computeSablierLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p3'), REL('p2', 'p3')],
      'p3'
    )
    const parents = result.nodes.filter(n => n.generation === -1)
    expect(parents).toHaveLength(2)
    expect(parents[0].y).toBe(parents[1].y)
    expect(parents[0].x).not.toBe(parents[1].x)
  })

  it('includes active UNION partner at generation 0', () => {
    const result = computeSablierLayout(
      ['p1', 'p2'],
      [REL('p1', 'p2', 'UNION', { ended: false })],
      'p1'
    )
    const partner = result.nodes.find(n => n.id === 'p2')
    expect(partner?.generation).toBe(0)
  })

  it('lists unconnected persons as orphans', () => {
    const result = computeSablierLayout(
      ['p1', 'p2', 'p3'],
      [REL('p1', 'p2')],
      'p1'
    )
    expect(result.orphans).toContain('p3')
    expect(result.orphans).not.toContain('p1')
    expect(result.orphans).not.toContain('p2')
  })

  it('returns empty for empty input', () => {
    const result = computeSablierLayout([], [], 'p1')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toEqual([])
  })

  it('returns all as orphans if center not in personIds', () => {
    const result = computeSablierLayout(['p1', 'p2'], [REL('p1', 'p2')], 'unknown')
    expect(result.nodes).toEqual([])
    expect(result.orphans).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/sablier/__tests__/sablierLayout.test.ts 2>&1 | tail -10
```

Expected: FAIL — module not found

- [ ] **Step 3: Commit failing tests**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/views/sablier/__tests__/sablierLayout.test.ts && git commit -m "test(sablier): failing tests for sablierLayout"
```

---

### Task C4-4: sablierLayout implementation

**Files:**
- Create: `src/components/views/sablier/sablierLayout.ts`

- [ ] **Step 1: Implement**

```typescript
// src/components/views/sablier/sablierLayout.ts
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

  // BFS upward (ancestors): PARENT_CHILD where person_b_id = current → person_a_id is parent
  // BFS downward (descendants): PARENT_CHILD where person_a_id = current → person_b_id is child
  // Also include UNION partners at generation 0

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
        // active UNION partner at same generation
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
```

- [ ] **Step 2: Run tests to verify 9/9 pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/sablier/__tests__/sablierLayout.test.ts
```

Expected: 9/9 PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/views/sablier/sablierLayout.ts && git commit -m "feat(sablier): BFS layout algorithm for hourglass tree"
```

---

### Task C4-5: SablierView tests + implementation

**Files:**
- Create: `src/components/views/sablier/__tests__/SablierView.test.tsx`
- Modify: `src/components/views/sablier/SablierView.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/views/sablier/__tests__/SablierView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))
vi.mock('reactflow', () => ({
  default: ({ nodes }: { nodes: { id: string }[] }) => (
    <div data-testid="react-flow">
      {nodes.map(n => <div key={n.id} data-testid={`rf-node-${n.id}`} />)}
    </div>
  ),
  Background: () => null,
  Controls: () => null,
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom' },
}))

import { useTree } from '@/lib/context/tree-context'
import { SablierView } from '../SablierView'
import type { Person, Relationship } from '@/lib/types/database'

const mkPerson = (id: string): Person => ({
  id, prenom: 'A', nom: 'B',
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

const mkRel = (a: string, b: string, type: Relationship['type'] = 'PARENT_CHILD'): Relationship => ({
  id: `${a}-${b}`, person_a_id: a, person_b_id: b, type, metadata: {},
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SablierView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<SablierView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('renders React Flow when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1')],
      relationships: [],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<SablierView />)
    expect(screen.getByTestId('react-flow')).toBeTruthy()
  })

  it('creates a React Flow node for each reachable person', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1'), mkPerson('p2')],
      relationships: [mkRel('p1', 'p2')],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<SablierView />)
    expect(screen.getByTestId('rf-node-p1')).toBeTruthy()
    expect(screen.getByTestId('rf-node-p2')).toBeTruthy()
  })

  it('shows orphan badge when there are unconnected persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1'), mkPerson('p2'), mkPerson('p3')],
      relationships: [mkRel('p1', 'p2')],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<SablierView />)
    expect(screen.getByText(/1 non connecté/i)).toBeTruthy()
  })

  it('auto-selects first person when selectedPersonId is null', () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1')],
      relationships: [],
      branches: [], personBranches: [],
      selectedPersonId: null, selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<SablierView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/sablier/__tests__/SablierView.test.tsx 2>&1 | tail -15
```

Expected: FAIL

- [ ] **Step 3: Implement SablierView**

```typescript
// src/components/views/sablier/SablierView.tsx
'use client'
import { useEffect } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { useTree } from '@/lib/context/tree-context'
import { computeSablierLayout } from './sablierLayout'

export function SablierView() {
  const { persons, relationships, selectedPersonId, selectPerson, openAddPerson } = useTree()

  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⧖</div>
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
  const personMap = new Map(persons.map(p => [p.id, p]))

  const { nodes: layoutNodes, orphans } = computeSablierLayout(
    persons.map(p => p.id),
    relationships,
    centerId
  )

  const CENTER_X = 400
  const CENTER_Y = 400

  const rfNodes = layoutNodes.map(n => {
    const person = personMap.get(n.id)
    return {
      id: n.id,
      position: { x: CENTER_X + n.x, y: CENTER_Y + n.y },
      data: {
        label: person ? `${person.prenom} ${person.nom}` : n.id,
        isCenter: n.id === centerId,
      },
      style: {
        background: n.id === centerId ? '#1e3a5f' : '#0d1117',
        color: 'white',
        border: n.id === centerId ? '2px solid #3b82f6' : '1px solid #1e3a5f',
        borderRadius: 6,
        fontSize: 12,
        padding: '4px 8px',
        minWidth: 120,
      },
    }
  })

  const nodeIds = new Set(layoutNodes.map(n => n.id))
  const rfEdges = relationships
    .filter(r => nodeIds.has(r.person_a_id) && nodeIds.has(r.person_b_id))
    .map(r => ({
      id: r.id,
      source: r.person_a_id,
      target: r.person_b_id,
      style: { stroke: r.type === 'UNION' ? '#60a5fa' : '#4b5563' },
    }))

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        fitView
        onNodeClick={(_, node) => selectPerson(node.id)}
      >
        <Background color="#1e3a5f" gap={40} />
        <Controls />
      </ReactFlow>

      {orphans.length > 0 && (
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-[#0d1117] border border-[#1e3a5f] rounded px-2 py-1">
          {orphans.length} non connecté{orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify 5/5 pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/sablier/__tests__/SablierView.test.tsx
```

Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/views/sablier/SablierView.tsx && git commit -m "feat(sablier): React Flow hourglass tree view"
```

---

## Chunk 2: Timeline + Carte + Éventail + Verification

### Task C4-6: TimelineView tests + implementation

**Files:**
- Create: `src/components/views/timeline/__tests__/TimelineView.test.tsx`
- Modify: `src/components/views/timeline/TimelineView.tsx`

**Spec:** SVG horizontal timeline. Persons sorted and placed by `date_naissance`. Persons without `date_naissance` are NOT shown on the timeline but listed in a "Non placées" badge. SVG viewBox scales to the year range. Each person is a dot on the axis with their name.

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/views/timeline/__tests__/TimelineView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

import { useTree } from '@/lib/context/tree-context'
import { TimelineView } from '../TimelineView'
import type { Person } from '@/lib/types/database'

const mkPerson = (id: string, prenom: string, nom: string, date_naissance: string | null = null): Person => ({
  id, prenom, nom, date_naissance,
  lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TimelineView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<TimelineView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('renders an SVG when persons with dates exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont', '1920-01-01')],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    const { container } = render(<TimelineView />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('shows person name on the timeline', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont', '1920-01-01')],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<TimelineView />)
    expect(screen.getByText('Jean Dupont')).toBeTruthy()
  })

  it('excludes persons without date_naissance from SVG but shows count', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [
        mkPerson('p1', 'Jean', 'Dupont', '1920-01-01'),
        mkPerson('p2', 'Marie', 'Martin', null),
      ],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<TimelineView />)
    // Jean appears, Marie does not (no date)
    expect(screen.getByText('Jean Dupont')).toBeTruthy()
    expect(screen.queryByText('Marie Martin')).toBeNull()
    // Badge shows 1 unplaced
    expect(screen.getByText(/1 non placée/i)).toBeTruthy()
  })

  it('shows all persons as unplaced when none have dates', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont', null)],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<TimelineView />)
    expect(screen.getByText(/1 non placée/i)).toBeTruthy()
  })

  it('calls selectPerson when a person label is clicked', () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont', '1920-01-01')],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<TimelineView />)
    screen.getByText('Jean Dupont').click()
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/timeline/__tests__/TimelineView.test.tsx 2>&1 | tail -10
```

- [ ] **Step 3: Implement TimelineView**

```typescript
// src/components/views/timeline/TimelineView.tsx
'use client'
import { useTree } from '@/lib/context/tree-context'

const SVG_W = 1200
const SVG_H = 200
const AXIS_Y = 100
const PADDING = 60

export function TimelineView() {
  const { persons, selectedPersonId, selectPerson, openAddPerson } = useTree()

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📅</div>
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

  const withDate = persons.filter(p => p.date_naissance !== null)
  const unplaced = persons.filter(p => p.date_naissance === null)

  const years = withDate.map(p => new Date(p.date_naissance!).getFullYear())
  const minYear = Math.min(...years, new Date().getFullYear() - 100)
  const maxYear = Math.max(...years, new Date().getFullYear())
  const range = maxYear - minYear || 1

  const toX = (year: number) =>
    PADDING + ((year - minYear) / range) * (SVG_W - PADDING * 2)

  return (
    <div className="w-full h-full overflow-auto p-6">
      {withDate.length > 0 && (
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ minHeight: SVG_H }}
        >
          {/* Axis line */}
          <line
            x1={PADDING} y1={AXIS_Y}
            x2={SVG_W - PADDING} y2={AXIS_Y}
            stroke="#1e3a5f" strokeWidth={2}
          />

          {/* Year labels at start/end */}
          <text x={PADDING} y={AXIS_Y + 20} fill="#6b7280" fontSize={11} textAnchor="middle">
            {minYear}
          </text>
          <text x={SVG_W - PADDING} y={AXIS_Y + 20} fill="#6b7280" fontSize={11} textAnchor="middle">
            {maxYear}
          </text>

          {/* Person dots */}
          {withDate.map(person => {
            const year = new Date(person.date_naissance!).getFullYear()
            const cx = toX(year)
            const isSelected = person.id === selectedPersonId
            return (
              <g
                key={person.id}
                style={{ cursor: 'pointer' }}
                onClick={() => selectPerson(person.id)}
              >
                <circle
                  cx={cx}
                  cy={AXIS_Y}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? '#3b82f6' : '#60a5fa'}
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={2}
                />
                <text
                  x={cx}
                  y={AXIS_Y - 12}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                >
                  {person.prenom} {person.nom}
                </text>
                <text
                  x={cx}
                  y={AXIS_Y + 32}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize={9}
                >
                  {year}
                </text>
              </g>
            )
          })}
        </svg>
      )}

      {unplaced.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 bg-[#0d1117] border border-[#1e3a5f] rounded px-3 py-2 inline-block">
          {unplaced.length} non placée{unplaced.length > 1 ? 's' : ''} sur la timeline (sans date de naissance)
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify 5/5 pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/timeline/__tests__/TimelineView.test.tsx
```

Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/views/timeline/ && git commit -m "feat(timeline): SVG horizontal timeline by birth year"
```

---

### Task C4-7: CarteView tests + implementation

**Files:**
- Create: `src/components/views/carte/__tests__/CarteView.test.tsx`
- Modify: `src/components/views/carte/CarteView.tsx`
- Create: `src/components/views/carte/CarteViewInner.tsx`

**Spec:** Leaflet map. Markers at `lat_naissance`/`lon_naissance` and `lat_deces`/`lon_deces`. Persons without coordinates are excluded and listed in a badge. Uses `next/dynamic` with `ssr: false` to avoid SSR crashes.

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/views/carte/__tests__/CarteView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

// Mock next/dynamic to render the inner component synchronously in tests
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Synchronously resolve the inner component for testing
    let Component: React.ComponentType | null = null
    loader().then(m => { Component = m.default })
    return function DynamicComponent(props: Record<string, unknown>) {
      // In test env we need to use a simple placeholder
      return <div data-testid="dynamic-map" {...props} />
    }
  },
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { useTree } from '@/lib/context/tree-context'
import { CarteView } from '../CarteView'
import type { Person } from '@/lib/types/database'

const mkPerson = (id: string, lat: number | null = null, lon: number | null = null): Person => ({
  id, prenom: 'Jean', nom: 'Dupont',
  date_naissance: null, lieu_naissance: lat !== null ? 'Paris' : null,
  lat_naissance: lat, lon_naissance: lon,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CarteView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CarteView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('shows non-geolocated badge when persons have no coordinates', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', null, null)],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CarteView />)
    expect(screen.getByText(/1 lieu non géolocalisé/i)).toBeTruthy()
  })

  it('shows non-geolocated badge count correctly', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', null, null), mkPerson('p2', null, null)],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CarteView />)
    expect(screen.getByText(/2 lieux non géolocalisés/i)).toBeTruthy()
  })

  it('renders the dynamic map wrapper when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 48.8566, 2.3522)],
      relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<CarteView />)
    // The dynamic wrapper renders something
    expect(screen.getByTestId('dynamic-map')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/carte/__tests__/CarteView.test.tsx 2>&1 | tail -15
```

- [ ] **Step 3: Implement CarteViewInner (actual Leaflet component)**

```typescript
// src/components/views/carte/CarteViewInner.tsx
'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Person } from '@/lib/types/database'

// Fix Leaflet default icon in Next.js
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface CarteViewInnerProps {
  geoPersons: { person: Person; lat: number; lon: number; type: 'birth' | 'death' }[]
  onSelect: (id: string) => void
  selectedPersonId: string | null
}

export default function CarteViewInner({ geoPersons, onSelect, selectedPersonId }: CarteViewInnerProps) {
  const center: [number, number] = geoPersons.length > 0
    ? [geoPersons[0].lat, geoPersons[0].lon]
    : [46.6, 2.2] // France center

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {geoPersons.map((gp, i) => (
        <Marker key={`${gp.person.id}-${gp.type}-${i}`} position={[gp.lat, gp.lon]}>
          <Popup>
            <button
              type="button"
              onClick={() => onSelect(gp.person.id)}
              style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
            >
              <strong>{gp.person.prenom} {gp.person.nom}</strong>
              <br />
              {gp.type === 'birth' ? '🟢 Naissance' : '⚫ Décès'}
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

- [ ] **Step 4: Implement CarteView (SSR wrapper)**

```typescript
// src/components/views/carte/CarteView.tsx
'use client'
import dynamic from 'next/dynamic'
import { useTree } from '@/lib/context/tree-context'
import type { Person } from '@/lib/types/database'

const CarteViewInner = dynamic(() => import('./CarteViewInner'), { ssr: false })

type GeoPoint = { person: Person; lat: number; lon: number; type: 'birth' | 'death' }

export function CarteView() {
  const { persons, selectedPersonId, selectPerson, openAddPerson } = useTree()

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🗺</div>
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

  const geoPoints: GeoPoint[] = []
  const nonGeoPersonIds = new Set<string>()

  for (const p of persons) {
    const hasBirth = p.lat_naissance !== null && p.lon_naissance !== null
    const hasDeath = p.lat_deces !== null && p.lon_deces !== null

    if (hasBirth) {
      geoPoints.push({ person: p, lat: p.lat_naissance!, lon: p.lon_naissance!, type: 'birth' })
    }
    if (hasDeath) {
      geoPoints.push({ person: p, lat: p.lat_deces!, lon: p.lon_deces!, type: 'death' })
    }
    if (!hasBirth && !hasDeath) {
      nonGeoPersonIds.add(p.id)
    }
  }

  const nonGeoCount = nonGeoPersonIds.size

  return (
    <div className="w-full h-full relative">
      <CarteViewInner
        geoPersons={geoPoints}
        onSelect={selectPerson}
        selectedPersonId={selectedPersonId}
      />

      {nonGeoCount > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] text-xs text-gray-500 bg-[#0d1117] border border-[#1e3a5f] rounded px-2 py-1">
          {nonGeoCount} lieu{nonGeoCount > 1 ? 'x' : ''} non géolocalisé{nonGeoCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/carte/__tests__/CarteView.test.tsx
```

If tests fail due to the `next/dynamic` mock not rendering the inner component synchronously, adjust the test to check for what IS rendered (the wrapper div). The key tests are: empty state, non-geo badge counts.

- [ ] **Step 6: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/views/carte/ && git commit -m "feat(carte): Leaflet map view with birth/death markers"
```

---

### Task C4-8: EventailView tests + implementation

**Files:**
- Create: `src/components/views/eventail/__tests__/EventailView.test.tsx`
- Modify: `src/components/views/eventail/EventailView.tsx`

**Spec:** SVG fan chart. Selected person at center. Ancestors in concentric arc rings, one ring per generation. Generation 1 (parents): 2 sectors. Generation 2 (grandparents): 4 sectors. Each sector shows initials. Orphans (no ancestry connection) excluded from this view.

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/views/eventail/__tests__/EventailView.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/context/tree-context', () => ({ useTree: vi.fn() }))

import { useTree } from '@/lib/context/tree-context'
import { EventailView } from '../EventailView'
import type { Person, Relationship } from '@/lib/types/database'

const mkPerson = (id: string, prenom: string, nom: string): Person => ({
  id, prenom, nom,
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '2024-01-01', updated_at: '2024-01-01',
})

const mkRel = (parentId: string, childId: string): Relationship => ({
  id: `${parentId}-${childId}`,
  person_a_id: parentId, person_b_id: childId,
  type: 'PARENT_CHILD', metadata: {},
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EventailView', () => {
  it('shows empty state when no persons', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [], relationships: [], branches: [], personBranches: [],
      selectedPersonId: null, selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<EventailView />)
    expect(screen.getByText(/votre arbre vous attend/i)).toBeTruthy()
  })

  it('renders an SVG when persons exist', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    const { container } = render(<EventailView />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('shows initials of center person', () => {
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<EventailView />)
    expect(screen.getByText('JD')).toBeTruthy()
  })

  it('shows initials of ancestors', () => {
    const p1 = mkPerson('p1', 'Jean', 'Dupont')
    const p2 = mkPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mkRel('p2', 'p1')], // p2 is parent of p1
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson: vi.fn(),
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<EventailView />)
    expect(screen.getByText('JD')).toBeTruthy()
    expect(screen.getByText('MM')).toBeTruthy()
  })

  it('auto-selects first person when selectedPersonId is null', () => {
    const selectPerson = vi.fn()
    vi.mocked(useTree).mockReturnValue({
      persons: [mkPerson('p1', 'Jean', 'Dupont')],
      relationships: [],
      branches: [], personBranches: [],
      selectedPersonId: null, selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<EventailView />)
    expect(selectPerson).toHaveBeenCalledWith('p1')
  })

  it('calls selectPerson when an ancestor sector is clicked', () => {
    const selectPerson = vi.fn()
    const p1 = mkPerson('p1', 'Jean', 'Dupont')
    const p2 = mkPerson('p2', 'Marie', 'Martin')
    vi.mocked(useTree).mockReturnValue({
      persons: [p1, p2],
      relationships: [mkRel('p2', 'p1')],
      branches: [], personBranches: [],
      selectedPersonId: 'p1', selectPerson,
      openAddPerson: vi.fn(), openEditPerson: vi.fn(), showToast: vi.fn(),
    })
    render(<EventailView />)
    screen.getByText('MM').click()
    expect(selectPerson).toHaveBeenCalledWith('p2')
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/eventail/__tests__/EventailView.test.tsx 2>&1 | tail -10
```

- [ ] **Step 3: Implement EventailView**

```typescript
// src/components/views/eventail/EventailView.tsx
'use client'
import { useEffect } from 'react'
import { useTree } from '@/lib/context/tree-context'
import type { Person, Relationship } from '@/lib/types/database'

const CX = 350
const CY = 350
const CENTER_R = 35
const RING_GAP = 70

// BFS upward: find ancestors of centerId, returns Map<personId, generation>
function buildAncestorMap(
  personIds: string[],
  relationships: Relationship[],
  centerId: string
): Map<string, number> {
  const gen = new Map<string, number>()
  gen.set(centerId, 0)
  const queue = [{ id: centerId, g: 0 }]
  while (queue.length > 0) {
    const { id, g } = queue.shift()!
    for (const rel of relationships) {
      if (rel.type !== 'PARENT_CHILD') continue
      if (rel.person_b_id !== id) continue // id must be the child
      const parentId = rel.person_a_id
      if (!personIds.includes(parentId) || gen.has(parentId)) continue
      gen.set(parentId, g + 1)
      queue.push({ id: parentId, g: g + 1 })
    }
  }
  return gen
}

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  const innerR = r - RING_GAP + 4
  const ix1 = cx + innerR * Math.cos(toRad(endAngle))
  const iy1 = cy + innerR * Math.sin(toRad(endAngle))
  const ix2 = cx + innerR * Math.cos(toRad(startAngle))
  const iy2 = cy + innerR * Math.sin(toRad(startAngle))
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`
}

function initials(p: Person): string {
  return `${p.prenom[0] ?? ''}${p.nom[0] ?? ''}`.toUpperCase()
}

export function EventailView() {
  const { persons, relationships, selectedPersonId, selectPerson, openAddPerson } = useTree()

  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌀</div>
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
  const personMap = new Map(persons.map(p => [p.id, p]))
  const centerPerson = personMap.get(centerId)

  const ancestorGen = buildAncestorMap(persons.map(p => p.id), relationships, centerId)

  // Group ancestors by generation (exclude center gen=0)
  const byGen = new Map<number, string[]>()
  for (const [id, g] of ancestorGen) {
    if (g === 0) continue
    if (!byGen.has(g)) byGen.set(g, [])
    byGen.get(g)!.push(id)
  }

  const maxGen = byGen.size > 0 ? Math.max(...byGen.keys()) : 0
  const COLORS = ['#1e3a5f', '#1a3550', '#163045', '#122b3a', '#0e2630']

  return (
    <div className="w-full h-full overflow-auto flex items-center justify-center p-6">
      <svg viewBox="0 0 700 700" className="w-full max-w-2xl">
        {/* Ancestor rings */}
        {Array.from(byGen.entries()).map(([gen, ids]) => {
          const r = CENTER_R + gen * RING_GAP
          const sectorAngle = 360 / ids.length
          return ids.map((id, i) => {
            const startAngle = -90 + i * sectorAngle
            const endAngle = startAngle + sectorAngle - 2
            const midAngle = (startAngle + endAngle) / 2
            const midRad = (midAngle * Math.PI) / 180
            const textR = r - RING_GAP / 2
            const tx = CX + textR * Math.cos(midRad)
            const ty = CY + textR * Math.sin(midRad)
            const person = personMap.get(id)
            return (
              <g
                key={id}
                style={{ cursor: 'pointer' }}
                onClick={() => selectPerson(id)}
              >
                <path
                  d={describeArc(CX, CY, r, startAngle, endAngle)}
                  fill={COLORS[Math.min(gen - 1, COLORS.length - 1)]}
                  stroke="#0d1117"
                  strokeWidth={1}
                />
                {person && (
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize={10}
                    pointerEvents="none"
                  >
                    {initials(person)}
                  </text>
                )}
              </g>
            )
          })
        })}

        {/* Center circle */}
        {centerPerson && (
          <g>
            <circle cx={CX} cy={CY} r={CENTER_R} fill="#3b82f6" />
            <text
              x={CX}
              y={CY}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={13}
              fontWeight="600"
            >
              {initials(centerPerson)}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify 5/5 pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/views/eventail/__tests__/EventailView.test.tsx
```

Expected: 5/5 PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/views/eventail/ && git commit -m "feat(eventail): SVG fan chart with ancestor rings"
```

---

### Task C4-9: Full test suite + build verification

**Files:** None new

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run 2>&1 | tail -10
```

Expected: all tests pass (no regressions)

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/jbbotello/Genealogy && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Next.js build**

```bash
cd /Users/jbbotello/Genealogy && npx next build 2>&1 | tail -20
```

Expected: build succeeds

- [ ] **Step 4: Fix any issues found, then commit**

If any test failures: fix the implementation, not the test (unless the test has a bug).
If tsc errors: fix types.
If build errors: likely a Leaflet or ReactFlow import issue — add to `transpilePackages` in `next.config.ts` if needed:
```typescript
const nextConfig = {
  transpilePackages: ['reactflow', 'react-leaflet'],
}
```

- [ ] **Step 5: Final commit**

```bash
cd /Users/jbbotello/Genealogy && git add -A && git commit -m "fix(views): resolve any build/type issues"
```

(Only if there were fixes — skip if everything was clean from the start.)
