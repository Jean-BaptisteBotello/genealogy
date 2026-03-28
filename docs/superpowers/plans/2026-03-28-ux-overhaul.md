# UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken features, improve visual polish, refonte the Sablier layout, rework Timeline, auto-detect branches, and hide Eventail.

**Architecture:** 4 sections executed sequentially. Section 1 = quick fixes across multiple files. Section 2 = Sablier refonte (layout algorithm + view component + styles). Section 3 = Timeline rework. Section 4 = Branch auto-detection + hide Eventail.

**Tech Stack:** Next.js 14, TypeScript, ReactFlow, Tailwind, Vitest

**Spec:** `docs/superpowers/specs/2026-03-28-ux-overhaul-design.md`

---

## Chunk 1: Bug Fixes & Polish

### Task 1: Fix edges z-index in Sablier

The CSS override at line 168 of `SablierView.tsx` uses `!important` but ReactFlow may override it. Fix by using ReactFlow's `elevateEdgesOnSelect` and `style` props properly.

**Files:**
- Modify: `src/components/views/sablier/SablierView.tsx:166-181`

- [ ] **Step 1: Verify the bug**

Run: `cd ~/Genealogy && npm run dev` and open http://localhost:3001 → Sablier view. Confirm edges render on top of nodes.

- [ ] **Step 2: Fix z-index via ReactFlow props and CSS**

In `SablierView.tsx`, replace the inline `<style>` tag and ReactFlow block (lines 168-181):

```tsx
{/* Remove: <style>{`.react-flow__edge { z-index: 0 !important; } .react-flow__node { z-index: 10 !important; }`}</style> */}
<ReactFlow
  nodes={nodes}
  edges={rfEdges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onNodeDragStop={onNodeDragStop}
  onNodeClick={(_, node) => selectPerson(node.id)}
  nodesDraggable
  fitView
  style={{ zIndex: 0 }}
  elevateEdgesOnSelect={false}
>
  <Background variant={"dots" as any} color="rgba(0,0,0,0.35)" gap={30} size={1} />
  <Controls />
</ReactFlow>
```

Also add a global CSS rule in a `<style>` tag that targets the specific ReactFlow classes more aggressively:

```tsx
<style>{`
  .react-flow__edges { z-index: 0 !important; }
  .react-flow__edgeupdater { z-index: 0 !important; }
  .react-flow__nodes { z-index: 1 !important; }
  .react-flow__node { z-index: 10 !important; position: relative; }
`}</style>
```

- [ ] **Step 3: Verify visually**

Reload Sablier view. Nodes must render on top of edges.

- [ ] **Step 4: Run tests**

Run: `cd ~/Genealogy && npm run test:run`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/sablier/SablierView.tsx
git commit -m "fix(sablier): enforce nodes above edges with proper z-index"
```

---

### Task 2: Fix relationship management in DetailPanel

Investigate why delete/move links don't work. The `deleteRelationship` import exists (line 11) and is called at line ~button onClick. The issue may be that the data doesn't refresh after deletion.

**Files:**
- Modify: `src/components/layout/DetailPanel.tsx`
- Test: `src/components/views/__tests__/`

- [ ] **Step 1: Read DetailPanel relationship section**

Read lines 100-250 of `DetailPanel.tsx` to find the delete/move handlers and understand the refresh flow.

- [ ] **Step 2: Identify the bug**

Check if:
1. `deleteRelationship` is called correctly
2. The relationships list refreshes after mutation (does AppShell re-fetch?)
3. The `revalidatePath` is called in the server action

- [ ] **Step 3: Fix the bug**

Apply the fix based on diagnosis. Most likely: add `router.refresh()` after mutation or ensure `revalidatePath` is called in the server action.

- [ ] **Step 4: Verify manually**

Open app → select a person → try to delete a relationship → confirm it disappears.

- [ ] **Step 5: Run tests**

Run: `cd ~/Genealogy && npm run test:run`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix(detail-panel): fix relationship delete and move"
```

---

### Task 3: Fix or hide broken filters/roles in Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/AppShell.tsx` (if filter logic needs fixing)

- [ ] **Step 1: Read Sidebar filter section**

Read `Sidebar.tsx` to understand what "Vivants/Décédés/Avec documents" filters do and why they're broken.

- [ ] **Step 2: Assess fix complexity**

If the filters are just placeholder UI with no logic → hide them. If they have partial logic → either fix or hide.

- [ ] **Step 3: Hide non-functional filters**

Comment out or remove the "Vivants / Décédés / Avec documents" section. Keep the Famille / Famille étendue toggles (those use `showFamily` / `showExtendedFamily`).

- [ ] **Step 4: Verify the Famille/Famille étendue toggles work**

Toggle them and confirm the Sablier view updates.

- [ ] **Step 5: Run tests**

Run: `cd ~/Genealogy && npm run test:run`

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "fix(sidebar): hide non-functional filters, keep working family toggles"
```

---

### Task 4: Make "+ Ajouter" button opaque

**Files:**
- Modify: `src/components/layout/Topbar.tsx:66-73`

- [ ] **Step 1: Update button styles**

In `Topbar.tsx` line 69, replace the transparent background:

```tsx
// Before:
className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors"

// After:
className="px-3 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
```

- [ ] **Step 2: Verify visually**

Reload → button should be solid red with white text, clearly readable.

- [ ] **Step 3: Run tests**

Run: `cd ~/Genealogy && npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Topbar.tsx
git commit -m "fix(topbar): make Ajouter button opaque for readability"
```

---

### Task 5: Cosmos — move name text away from glow circle

**Files:**
- Modify: `src/components/cosmos/CosmosView.tsx:402-427`

- [ ] **Step 1: Adjust dy offset for center node text**

In `CosmosView.tsx`, the center node's name text uses `dy="-22"` (line 405) and `dy="-10"` (line 417). Increase the gap from the circle (r=10 at line 398):

```tsx
// Prénom line — move up from -22 to -28
<text
  x="50%"
  y="50%"
  dy="-28"
  ...
>
  {centerPerson.prenom}
</text>

// Nom · Année line — move up from -10 to -16
<text
  x="50%"
  y="50%"
  dy="-16"
  ...
>
  {centerPerson.nom}...
</text>
```

- [ ] **Step 2: Verify visually**

Reload Cosmos → the "Nom · Année" line should have clear space above the white circle.

- [ ] **Step 3: Run tests**

Run: `cd ~/Genealogy && npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add src/components/cosmos/CosmosView.tsx
git commit -m "fix(cosmos): increase text offset from center glow circle"
```

---

### Task 6: Cosmos — thicker orbit strokes

**Files:**
- Modify: `src/components/cosmos/CosmosView.tsx:18-25, 343-353`

- [ ] **Step 1: Increase stroke alphas and width**

In `CosmosView.tsx`, update `STROKE_ALPHAS` (lines 18-25):

```tsx
const STROKE_ALPHAS: Record<number, number> = {
  0: 0,
  1: 0.30,
  2: 0.22,
  3: 0.15,
  4: 0.10,
  5: 0.07,
}
```

And update the orbit ring `strokeWidth` from 1 to 1.5 (line 351):

```tsx
strokeWidth={1.5}
```

- [ ] **Step 2: Verify visually**

Reload Cosmos → orbits should be more visible against the gradient.

- [ ] **Step 3: Run tests**

Run: `cd ~/Genealogy && npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add src/components/cosmos/CosmosView.tsx
git commit -m "fix(cosmos): thicker and more visible orbit strokes"
```

---

## Chunk 2: Sablier Refonte

### Task 7: Rewrite sablierLayout.ts — vertical generation layout

The current layout places generation 0 in the center. New layout: generation 0 (user) at the bottom, ancestors going up. Also handle SIBLING, HALF_SIBLING, ADOPTION, STEP for generation computation.

**Files:**
- Modify: `src/components/views/sablier/sablierLayout.ts`
- Test: `src/components/views/__tests__/sablierLayout.test.ts` (create if doesn't exist)

- [ ] **Step 1: Write failing tests for new layout**

```typescript
// src/components/views/__tests__/sablierLayout.test.ts
import { describe, it, expect } from 'vitest'
import { computeSablierLayout } from '../sablier/sablierLayout'
import type { Relationship } from '@/lib/types/database'

const rel = (id: string, a: string, b: string, type: string, meta = {}): Relationship => ({
  id, person_a_id: a, person_b_id: b, type: type as any, metadata: meta, created_at: ''
})

describe('computeSablierLayout', () => {
  it('places center person at generation 0 (bottom)', () => {
    const { nodes } = computeSablierLayout(['jb'], [], 'jb')
    expect(nodes[0].generation).toBe(0)
    expect(nodes[0].y).toBeGreaterThanOrEqual(0) // bottom = largest y
  })

  it('places parents one generation above (smaller y)', () => {
    const rels = [rel('r1', 'dad', 'jb', 'PARENT_CHILD')]
    const { nodes } = computeSablierLayout(['jb', 'dad'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const dadNode = nodes.find(n => n.id === 'dad')!
    expect(dadNode.y).toBeLessThan(jbNode.y)
    expect(dadNode.generation).toBe(-1)
  })

  it('places grandparents two generations above', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'grandpa', 'dad', 'PARENT_CHILD'),
    ]
    const { nodes } = computeSablierLayout(['jb', 'dad', 'grandpa'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const gpNode = nodes.find(n => n.id === 'grandpa')!
    expect(gpNode.y).toBeLessThan(jbNode.y)
    expect(gpNode.generation).toBe(-2)
  })

  it('places spouses on same generation', () => {
    const rels = [rel('r1', 'jb', 'wife', 'UNION')]
    const { nodes } = computeSablierLayout(['jb', 'wife'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const wifeNode = nodes.find(n => n.id === 'wife')!
    expect(wifeNode.generation).toBe(jbNode.generation)
  })

  it('places siblings on same generation', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'dad', 'sis', 'PARENT_CHILD'),
    ]
    const { nodes } = computeSablierLayout(['jb', 'sis', 'dad'], rels, 'jb')
    const jbNode = nodes.find(n => n.id === 'jb')!
    const sisNode = nodes.find(n => n.id === 'sis')!
    expect(sisNode.generation).toBe(jbNode.generation)
  })

  it('identifies orphans (unconnected persons)', () => {
    const { orphans } = computeSablierLayout(['jb', 'stranger'], [], 'jb')
    expect(orphans).toContain('stranger')
  })

  it('inverts y-axis: max generation (oldest) gets smallest y', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'grandpa', 'dad', 'PARENT_CHILD'),
    ]
    const { nodes } = computeSablierLayout(['jb', 'dad', 'grandpa'], rels, 'jb')
    const sorted = [...nodes].sort((a, b) => a.generation - b.generation)
    // Most ancient (gen -2) should have smallest y
    expect(sorted[0].y).toBeLessThan(sorted[sorted.length - 1].y)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ~/Genealogy && npx vitest run src/components/views/__tests__/sablierLayout.test.ts`
Expected: Some tests fail (current layout uses gen*ROW_HEIGHT which doesn't place user at bottom).

- [ ] **Step 3: Rewrite sablierLayout.ts**

```typescript
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
      // PARENT_CHILD: person_a = parent, person_b = child
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

  // Find min/max generation
  const gens = [...byGeneration.keys()]
  const minGen = Math.min(...gens) // most ancient = smallest number (e.g., -4)
  const maxGen = Math.max(...gens) // most recent = largest number (e.g., 0 or 1)

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/Genealogy && npx vitest run src/components/views/__tests__/sablierLayout.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/sablier/sablierLayout.ts src/components/views/__tests__/sablierLayout.test.ts
git commit -m "feat(sablier): rewrite layout with vertical generation ordering"
```

---

### Task 8: Update SablierView — monochrome theme + dynamic handles

Apply the mockup design: monochrome background, generation labels, updated node styles, dynamic edge attachment.

**Files:**
- Modify: `src/components/views/sablier/SablierView.tsx`

- [ ] **Step 1: Rewrite SablierView with new design**

Key changes:
1. Replace `Background` with monochrome `#f0eded` (or use CSS var for theme support)
2. Update node styles: white background, subtle border, proper typography
3. Edge styles: solid gray for parent-child, dashed purple for union, dashed blue for sibling
4. Dynamic source/target handles based on relationship type AND relative position
5. Remove the old dark theme styles
6. Add generation labels as overlay divs

```tsx
// Updated node style (replace lines 82-91):
data: {
  label: person ? `${person.prenom} ${person.nom}` : n.id,
  dates: person?.date_naissance ? new Date(person.date_naissance).getFullYear().toString() : '',
  isSelected: n.id === centerId,
  isDeceased: person?.date_deces !== null,
  nodeStyle: {
    background: '#ffffff',
    color: '#3a3a3a',
    border: n.id === centerId ? '2px solid #7a5a8a' : '1.5px solid #d4cece',
    borderRadius: 8,
    fontSize: 13,
    padding: '10px 16px',
    minWidth: 120,
    textAlign: 'center' as const,
    boxShadow: n.id === centerId
      ? '0 0 0 2px rgba(122,90,138,0.2), 0 2px 8px rgba(0,0,0,0.1)'
      : '0 1px 4px rgba(0,0,0,0.06)',
  },
},
```

```tsx
// Updated ReactFlow background (replace line 179):
<Background variant={"dots" as any} color="rgba(0,0,0,0.08)" gap={30} size={1} style={{ background: '#f0eded' }} />
```

```tsx
// Updated edge styles (replace lines 119-123):
style: {
  stroke: isUnion ? '#b07aab' : isSibling ? '#7a9bb0' : '#8a8a8a',
  strokeWidth: isUnion ? 2 : isSibling ? 1.2 : 1.5,
  strokeDasharray: isDashed ? '6 4' : undefined,
},
```

- [ ] **Step 2: Verify visually**

Reload Sablier → should match the mockup: white cards, monochrome background, visible edges.

- [ ] **Step 3: Run tests**

Run: `cd ~/Genealogy && npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add src/components/views/sablier/SablierView.tsx
git commit -m "feat(sablier): monochrome theme, updated node styles, clearer edges"
```

---

## Chunk 3: Timeline Rework

### Task 9: Rework Timeline with alternating rows

Replace the single-line layout with alternating above/below placement to avoid text overlap.

**Files:**
- Modify: `src/components/views/timeline/TimelineView.tsx`
- Test: `src/components/views/__tests__/TimelineView.test.tsx` (if exists)

- [ ] **Step 1: Create Timeline mockup for validation**

Create `public/timeline-v2-mockup.html` with the alternating row approach. Share with user for validation.

- [ ] **Step 2: Rewrite TimelineView.tsx**

Key changes:
1. Increase `SVG_H` to 400 to accommodate two rows
2. Sort persons by birth year
3. Alternate placement: even index above axis, odd index below
4. Offset text vertically to avoid overlap
5. Add connecting line from circle to text label
6. Better date formatting and spacing

```tsx
const SVG_H = 400
const AXIS_Y = 200
const LABEL_OFFSET_UP = -50
const LABEL_OFFSET_DOWN = 50

// Sort by year, then alternate placement
const sorted = [...withDate].sort((a, b) =>
  new Date(a.date_naissance!).getFullYear() - new Date(b.date_naissance!).getFullYear()
)

sorted.map((person, index) => {
  const year = new Date(person.date_naissance!).getFullYear()
  const cx = toX(year)
  const isAbove = index % 2 === 0
  const labelY = isAbove ? AXIS_Y + LABEL_OFFSET_UP : AXIS_Y + LABEL_OFFSET_DOWN
  // ... render circle at AXIS_Y, text at labelY, connecting line between
})
```

- [ ] **Step 3: Verify visually**

Reload Timeline → names should alternate above/below the axis, no overlap.

- [ ] **Step 4: Run tests**

Run: `cd ~/Genealogy && npm run test:run`

- [ ] **Step 5: Commit**

```bash
git add src/components/views/timeline/TimelineView.tsx
git commit -m "feat(timeline): alternating row layout to prevent text overlap"
```

---

## Chunk 4: Branches Auto-Detection & Hide Eventail

### Task 10: Hide Eventail tab

**Files:**
- Modify: `src/components/layout/Topbar.tsx:20-26`

- [ ] **Step 1: Remove Eventail from VIEWS array**

In `Topbar.tsx`, remove the eventail entry from `VIEWS`:

```tsx
const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'cosmos', label: 'Cosmos', icon: '🌌' },
  { id: 'sablier', label: 'Sablier', icon: '⧖' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'carte', label: 'Carte', icon: '🗺' },
  // Éventail masqué — à repenser
]
```

- [ ] **Step 2: Verify the tab is gone**

Reload → only 4 tabs visible.

- [ ] **Step 3: Run tests**

Run: `cd ~/Genealogy && npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Topbar.tsx
git commit -m "feat(topbar): hide Éventail tab pending redesign"
```

---

### Task 11: Auto-detect family branches

Create a utility that analyzes PARENT_CHILD relationships to automatically detect family branches (maternal side, paternal side, alliances via UNION).

**Files:**
- Create: `src/lib/branch-detection.ts`
- Create: `src/lib/__tests__/branch-detection.test.ts`
- Modify: `src/components/layout/Sidebar.tsx` (add auto-detect button)

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/__tests__/branch-detection.test.ts
import { describe, it, expect } from 'vitest'
import { detectBranches } from '../branch-detection'
import type { Relationship } from '@/lib/types/database'

const rel = (id: string, a: string, b: string, type: string): Relationship => ({
  id, person_a_id: a, person_b_id: b, type: type as any, metadata: {}, created_at: ''
})

describe('detectBranches', () => {
  it('detects paternal and maternal sides from a center person', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'mom', 'jb', 'PARENT_CHILD'),
      rel('r3', 'grandpa_dad', 'dad', 'PARENT_CHILD'),
      rel('r4', 'grandma_mom', 'mom', 'PARENT_CHILD'),
    ]
    const persons = [
      { id: 'jb', prenom: 'Pierre', nom: 'Dupont' },
      { id: 'dad', prenom: 'Michel', nom: 'Dupont' },
      { id: 'mom', prenom: 'Catherine', nom: 'Lefebvre' },
      { id: 'grandpa_dad', prenom: 'Jacques', nom: 'Dupont' },
      { id: 'grandma_mom', prenom: 'Marie', nom: 'Lefebvre' },
    ]

    const branches = detectBranches(persons, rels, 'jb')

    expect(branches.length).toBeGreaterThanOrEqual(2)
    const branchNames = branches.map(b => b.name)
    // Should detect at least two sides based on parent surnames
    expect(branchNames.some(n => n.includes('Dupont'))).toBe(true)
    expect(branchNames.some(n => n.includes('Lefebvre'))).toBe(true)
  })

  it('assigns each person to a branch', () => {
    const rels = [
      rel('r1', 'dad', 'jb', 'PARENT_CHILD'),
      rel('r2', 'mom', 'jb', 'PARENT_CHILD'),
    ]
    const persons = [
      { id: 'jb', prenom: 'JB', nom: 'B' },
      { id: 'dad', prenom: 'D', nom: 'B' },
      { id: 'mom', prenom: 'M', nom: 'P' },
    ]
    const branches = detectBranches(persons, rels, 'jb')
    const allMembers = branches.flatMap(b => b.members)
    expect(allMembers).toContain('dad')
    expect(allMembers).toContain('mom')
  })

  it('returns empty array if no relationships', () => {
    const branches = detectBranches([{ id: 'jb', prenom: 'JB', nom: 'B' }], [], 'jb')
    expect(branches).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ~/Genealogy && npx vitest run src/lib/__tests__/branch-detection.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement branch-detection.ts**

```typescript
// src/lib/branch-detection.ts
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

      // Find parents of current
      for (const rel of relationships) {
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/Genealogy && npx vitest run src/lib/__tests__/branch-detection.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/branch-detection.ts src/lib/__tests__/branch-detection.test.ts
git commit -m "feat: auto-detect family branches from parent lineages"
```

- [ ] **Step 6: Integrate into Sidebar**

Add a "Détecter les branches" button in the Sidebar that calls `detectBranches` and creates the branches in the database. This step depends on the existing branch CRUD — read the server actions first to understand how branches are created.

- [ ] **Step 7: Run all tests**

Run: `cd ~/Genealogy && npm run test:run`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): add auto-detect branches button"
```
