# Genealogy App — Plan 2: Core CRUD

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the full data layer — graph loader, geocoding, person/relationship/branch/document CRUD with server actions, a TreeContext-driven AppShell, a wired DetailPanel, and a search overlay — so the tree canvas has real data to render in Plan 3.

**Architecture:** `(app)/layout.tsx` becomes a Server Component that fetches all data and hands it to a `'use client'` `AppShell` via props. `AppShell` owns all interactive state and exposes it through `TreeContext`. Server Actions handle all mutations and call `revalidatePath('/tree', 'layout')` so `router.refresh()` in the client delivers fresh data without a full page reload. Geocoding (Nominatim) is server-side only, called at save time and stored on the row.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), TypeScript, Supabase (`@supabase/ssr`), Tailwind CSS v4, Vitest + React Testing Library

---

## Chunk 1: AppShell Rewire, Geocode, Person CRUD, Relationship CRUD

### File Map — Chunk 1

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/geocode.ts` | Create | Nominatim geocoding, server-side only |
| `src/lib/cycle-detection.ts` | Create | BFS ancestor cycle check for PARENT_CHILD/ADOPTION |
| `src/lib/context/tree-context.tsx` | Create | TreeContext — data + UI state shared across the shell |
| `src/components/layout/AppShell.tsx` | Create | `'use client'` shell: state, context provider, layout render |
| `src/app/(app)/layout.tsx` | Modify | Convert to Server Component; fetch data; render AppShell |
| `src/app/(app)/tree/page.tsx` | Modify | `'use client'`; consume TreeContext; CTA or person list |
| `src/components/person/PersonModal.tsx` | Create | Add/Edit modal form for a person |
| `src/server-actions/persons.ts` | Create | createPerson, updatePerson, deletePerson |
| `src/server-actions/relationships.ts` | Create | createRelationship, deleteRelationship |
| `src/lib/geocode.test.ts` | Create | Tests for geocodeLieu |
| `src/lib/cycle-detection.test.ts` | Create | Tests for hasAncestorCycle |
| `src/server-actions/__tests__/persons.test.ts` | Create | Tests for person server actions |
| `src/server-actions/__tests__/relationships.test.ts` | Create | Tests for relationship server actions |
| `src/components/person/__tests__/PersonModal.test.tsx` | Create | Tests for PersonModal UI |

---

### Task 1: Geocoding utility

**Files:**
- Create: `src/lib/geocode.ts`
- Create: `src/lib/geocode.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/geocode.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('geocodeLieu', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns lat/lon for a valid place name', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '48.8566', lon: '2.3522' }],
    } as Response)

    const { geocodeLieu } = await import('./geocode')
    const result = await geocodeLieu('Paris')
    expect(result).toEqual({ lat: 48.8566, lon: 2.3522 })
  })

  it('returns null when the API returns an empty array', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const { geocodeLieu } = await import('./geocode')
    const result = await geocodeLieu('XYZ_NONEXISTENT')
    expect(result).toBeNull()
  })

  it('returns null when the API responds with !ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => [],
    } as Response)

    const { geocodeLieu } = await import('./geocode')
    const result = await geocodeLieu('Paris')
    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { geocodeLieu } = await import('./geocode')
    const result = await geocodeLieu('Paris')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/lib/geocode.test.ts
```

Expected: FAIL — module `./geocode` not found.

- [ ] **Step 3: Implement geocodeLieu**

```typescript
// src/lib/geocode.ts
// Server-side only — never import this in client components.
export async function geocodeLieu(
  lieu: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lieu)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Genealogy-App/1.0' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run test to verify all 4 pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/lib/geocode.test.ts
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/lib/geocode.ts src/lib/geocode.test.ts
git commit -m "feat: add Nominatim geocoding utility"
```

---

### Task 2: Cycle detection utility

**Files:**
- Create: `src/lib/cycle-detection.ts`
- Create: `src/lib/cycle-detection.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/cycle-detection.test.ts
import { describe, it, expect } from 'vitest'

// Relationship fixture helper
type R = { person_a_id: string; person_b_id: string; type: string }

function parentChild(parentId: string, childId: string): R {
  return { person_a_id: parentId, person_b_id: childId, type: 'PARENT_CHILD' }
}

describe('hasAncestorCycle', () => {
  it('returns false for an empty relationship list', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    expect(hasAncestorCycle('child', 'parent', [])).toBe(false)
  })

  it('returns false when there is no cycle risk', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [parentChild('grandpa', 'parent')]
    // proposedParentId = 'parent', personId = 'child' — no cycle
    expect(hasAncestorCycle('child', 'parent', rels)).toBe(false)
  })

  it('returns true for a direct cycle (A → B, propose B → A)', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    // A is already parent of B. Now we try to make B a parent of A.
    const rels: R[] = [parentChild('A', 'B')]
    expect(hasAncestorCycle('A', 'B', rels)).toBe(true)
  })

  it('returns true for a transitive cycle (A→B→C, propose C→A)', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [parentChild('A', 'B'), parentChild('B', 'C')]
    expect(hasAncestorCycle('A', 'C', rels)).toBe(true)
  })

  it('treats ADOPTION the same as PARENT_CHILD', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [
      { person_a_id: 'A', person_b_id: 'B', type: 'ADOPTION' },
    ]
    expect(hasAncestorCycle('A', 'B', rels)).toBe(true)
  })

  it('ignores UNION relationships for cycle detection', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    const rels: R[] = [
      { person_a_id: 'A', person_b_id: 'B', type: 'UNION' },
    ]
    // UNION does not create ancestry — should be false
    expect(hasAncestorCycle('A', 'B', rels)).toBe(false)
  })

  it('returns false when personId equals proposedParentId (self-reference guard)', async () => {
    const { hasAncestorCycle } = await import('./cycle-detection')
    // Trying to make A a parent of itself — BFS starts at A, visits A immediately
    // Our BFS checks `current === personId` which would fire on the first step.
    // This is actually a cycle (self-loop) — expect true.
    expect(hasAncestorCycle('A', 'A', [])).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/lib/cycle-detection.test.ts
```

Expected: FAIL — module `./cycle-detection` not found.

- [ ] **Step 3: Implement hasAncestorCycle**

```typescript
// src/lib/cycle-detection.ts
/**
 * Returns true if making `proposedParentId` a parent of `personId` would create
 * an ancestry cycle. A cycle exists if `personId` is already an ancestor of
 * `proposedParentId` (i.e. it appears in proposedParentId's upward chain).
 *
 * Convention: PARENT_CHILD/ADOPTION — person_a_id is the parent, person_b_id is the child.
 */
export function hasAncestorCycle(
  personId: string,
  proposedParentId: string,
  relationships: { person_a_id: string; person_b_id: string; type: string }[]
): boolean {
  // Build a parent-lookup: for each child, who are its parents?
  const parentOf: Record<string, string[]> = {}
  for (const r of relationships) {
    if (r.type === 'PARENT_CHILD' || r.type === 'ADOPTION') {
      if (!parentOf[r.person_b_id]) parentOf[r.person_b_id] = []
      parentOf[r.person_b_id].push(r.person_a_id)
    }
  }

  // BFS upward from proposedParentId. If we reach personId, there is a cycle.
  const visited = new Set<string>()
  const queue = [proposedParentId]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === personId) return true
    if (visited.has(current)) continue
    visited.add(current)
    for (const parent of parentOf[current] ?? []) {
      queue.push(parent)
    }
  }
  return false
}
```

- [ ] **Step 4: Run test to verify all 7 pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/lib/cycle-detection.test.ts
```

Expected: PASS — 7 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/lib/cycle-detection.ts src/lib/cycle-detection.test.ts
git commit -m "feat: add BFS ancestry cycle detection"
```

---

### Task 3: TreeContext

**Files:**
- Create: `src/lib/context/tree-context.tsx`

No direct unit test — context is tested through AppShell and consumer components. The context itself is a thin wrapper with no logic.

- [ ] **Step 1: Create the context file**

```typescript
// src/lib/context/tree-context.tsx
'use client'
import { createContext, useContext } from 'react'
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'

export interface TreeContextValue {
  // Data (fed from Server Component via AppShell props)
  persons: Person[]
  branches: Branch[]
  relationships: Relationship[]
  personBranches: PersonBranch[]
  // Selection
  selectedPersonId: string | null
  selectPerson: (id: string | null) => void
  // Modals
  openAddPerson: () => void
  openEditPerson: (id: string) => void
  // Toast
  showToast: (message: string, type?: 'error' | 'info') => void
}

export const TreeContext = createContext<TreeContextValue | null>(null)

export function useTree(): TreeContextValue {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTree must be used inside AppShell')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/lib/context/tree-context.tsx
git commit -m "feat: add TreeContext for shared tree state"
```

---

### Task 4: Person server actions

**Files:**
- Create: `src/server-actions/persons.ts`
- Create: `src/server-actions/__tests__/persons.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/server-actions/__tests__/persons.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/geocode', () => ({
  geocodeLieu: vi.fn().mockResolvedValue(null),
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { geocodeLieu } from '@/lib/geocode'

const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockUpdate = vi.fn(() => ({ eq: () => ({ select: () => ({ single: mockSingle }) }) }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockDeleteEq = vi.fn(() => ({ error: null }))
const mockFrom = vi.fn((table: string) => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })),
}))

const mockSupabase = { from: mockFrom }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
})

describe('createPerson', () => {
  it('inserts a person and returns their id on success', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'uuid-123' }, error: null })

    const { createPerson } = await import('../persons')
    const form = new FormData()
    form.set('prenom', 'Marie')
    form.set('nom', 'Curie')
    form.set('date_naissance', '1867-11-07')
    form.set('lieu_naissance', 'Warsaw')

    const result = await createPerson(form)
    expect(result).toEqual({ id: 'uuid-123' })
    expect(mockFrom).toHaveBeenCalledWith('person')
  })

  it('returns error message when insert fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const { createPerson } = await import('../persons')
    const form = new FormData()
    form.set('prenom', 'Marie')
    form.set('nom', 'Curie')

    const result = await createPerson(form)
    expect(result).toEqual({ error: 'DB error' })
  })

  it('geocodes lieu_naissance and stores lat/lon', async () => {
    vi.mocked(geocodeLieu).mockResolvedValueOnce({ lat: 52.23, lon: 21.01 })
    mockSingle.mockResolvedValue({ data: { id: 'uuid-456' }, error: null })

    const { createPerson } = await import('../persons')
    const form = new FormData()
    form.set('prenom', 'Marie')
    form.set('nom', 'Curie')
    form.set('lieu_naissance', 'Warsaw')

    await createPerson(form)
    expect(geocodeLieu).toHaveBeenCalledWith('Warsaw')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ lat_naissance: 52.23, lon_naissance: 21.01 })
    )
  })

  it('calls revalidatePath on success', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'uuid-789' }, error: null })

    const { createPerson } = await import('../persons')
    const form = new FormData()
    form.set('prenom', 'Marie')
    form.set('nom', 'Curie')
    await createPerson(form)

    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })
})

describe('updatePerson', () => {
  it('returns error when update fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const { updatePerson } = await import('../persons')
    const form = new FormData()
    form.set('id', 'uuid-123')
    form.set('prenom', 'Maria')
    form.set('nom', 'Curie')

    const result = await updatePerson(form)
    expect(result).toEqual({ error: 'Not found' })
  })

  it('returns updated id on success', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'uuid-123' }, error: null })

    const { updatePerson } = await import('../persons')
    const form = new FormData()
    form.set('id', 'uuid-123')
    form.set('prenom', 'Maria')
    form.set('nom', 'Curie')

    const result = await updatePerson(form)
    expect(result).toEqual({ id: 'uuid-123' })
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })
})

describe('deletePerson', () => {
  it('returns error when delete fails', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: { message: 'Cannot delete' } })

    const { deletePerson } = await import('../persons')
    const result = await deletePerson('uuid-123')
    expect(result).toEqual({ error: 'Cannot delete' })
  })

  it('returns empty object on success', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: null })

    const { deletePerson } = await import('../persons')
    const result = await deletePerson('uuid-123')
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/persons.test.ts
```

Expected: FAIL — module `../persons` not found.

- [ ] **Step 3: Implement person server actions**

```typescript
// src/server-actions/persons.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { geocodeLieu } from '@/lib/geocode'

export async function createPerson(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const lieu_naissance = (formData.get('lieu_naissance') as string) || null
  const lieu_deces = (formData.get('lieu_deces') as string) || null

  const [geoNaissance, geoDeces] = await Promise.all([
    lieu_naissance ? geocodeLieu(lieu_naissance) : null,
    lieu_deces ? geocodeLieu(lieu_deces) : null,
  ])

  const { data, error } = await supabase
    .from('person')
    .insert({
      prenom: formData.get('prenom') as string,
      nom: formData.get('nom') as string,
      date_naissance: (formData.get('date_naissance') as string) || null,
      lieu_naissance,
      lat_naissance: geoNaissance?.lat ?? null,
      lon_naissance: geoNaissance?.lon ?? null,
      date_deces: (formData.get('date_deces') as string) || null,
      lieu_deces,
      lat_deces: geoDeces?.lat ?? null,
      lon_deces: geoDeces?.lon ?? null,
      notes: (formData.get('notes') as string) || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function updatePerson(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const lieu_naissance = (formData.get('lieu_naissance') as string) || null
  const lieu_deces = (formData.get('lieu_deces') as string) || null

  const [geoNaissance, geoDeces] = await Promise.all([
    lieu_naissance ? geocodeLieu(lieu_naissance) : null,
    lieu_deces ? geocodeLieu(lieu_deces) : null,
  ])

  const { data, error } = await supabase
    .from('person')
    .update({
      prenom: formData.get('prenom') as string,
      nom: formData.get('nom') as string,
      date_naissance: (formData.get('date_naissance') as string) || null,
      lieu_naissance,
      lat_naissance: geoNaissance?.lat ?? null,
      lon_naissance: geoNaissance?.lon ?? null,
      date_deces: (formData.get('date_deces') as string) || null,
      lieu_deces,
      lat_deces: geoDeces?.lat ?? null,
      lon_deces: geoDeces?.lon ?? null,
      notes: (formData.get('notes') as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function deletePerson(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('person').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/persons.test.ts
```

Expected: PASS — 7 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/server-actions/persons.ts src/server-actions/__tests__/persons.test.ts
git commit -m "feat: add createPerson/updatePerson/deletePerson server actions"
```

---

### Task 5: Relationship server actions

**Files:**
- Create: `src/server-actions/relationships.ts`
- Create: `src/server-actions/__tests__/relationships.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/server-actions/__tests__/relationships.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/cycle-detection', () => ({
  hasAncestorCycle: vi.fn().mockReturnValue(false),
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasAncestorCycle } from '@/lib/cycle-detection'

// Mock chain for select('*') on relationship table used for cycle check
const mockSelectAll = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockDeleteEq = vi.fn(() => ({ error: null }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))

// The select used to fetch existing relationships for cycle detection
const mockSelectForCycle = vi.fn()

const mockFrom = vi.fn((table: string) => {
  if (table === 'relationship') {
    return {
      insert: mockInsert,
      delete: mockDelete,
      select: mockSelectForCycle,
    }
  }
  return {}
})

const mockSupabase = { from: mockFrom }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  // Default: existing relationships is empty
  mockSelectForCycle.mockReturnValue({ data: [], error: null })
})

describe('createRelationship', () => {
  it('inserts a UNION relationship without cycle check', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'rel-001' }, error: null })

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'p1')
    form.set('person_b_id', 'p2')
    form.set('type', 'UNION')

    const result = await createRelationship(form)
    expect(result).toEqual({ id: 'rel-001' })
    expect(hasAncestorCycle).not.toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('inserts a PARENT_CHILD relationship when no cycle', async () => {
    vi.mocked(hasAncestorCycle).mockReturnValue(false)
    mockSingle.mockResolvedValue({ data: { id: 'rel-002' }, error: null })

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'parent')
    form.set('person_b_id', 'child')
    form.set('type', 'PARENT_CHILD')

    const result = await createRelationship(form)
    expect(result).toEqual({ id: 'rel-002' })
    // person_a_id='parent' is the proposed parent, person_b_id='child' is the child.
    // Correct call: hasAncestorCycle(child, proposedParent, rels)
    expect(hasAncestorCycle).toHaveBeenCalledWith('child', 'parent', [])
  })

  it('returns error when PARENT_CHILD would create a cycle', async () => {
    vi.mocked(hasAncestorCycle).mockReturnValue(true)

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'child')
    form.set('person_b_id', 'parent')
    form.set('type', 'PARENT_CHILD')

    const result = await createRelationship(form)
    expect(result).toEqual({ error: 'Cette relation créerait un cycle dans l\'arbre généalogique.' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns error when ADOPTION would create a cycle', async () => {
    vi.mocked(hasAncestorCycle).mockReturnValue(true)

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'child')
    form.set('person_b_id', 'parent')
    form.set('type', 'ADOPTION')

    const result = await createRelationship(form)
    expect(result).toEqual({ error: 'Cette relation créerait un cycle dans l\'arbre généalogique.' })
  })

  it('returns error when insert fails', async () => {
    vi.mocked(hasAncestorCycle).mockReturnValue(false)
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'p1')
    form.set('person_b_id', 'p2')
    form.set('type', 'SIBLING')

    const result = await createRelationship(form)
    expect(result).toEqual({ error: 'Insert failed' })
  })

  it('parses metadata JSON when provided', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'rel-003' }, error: null })

    const { createRelationship } = await import('../relationships')
    const form = new FormData()
    form.set('person_a_id', 'p1')
    form.set('person_b_id', 'p2')
    form.set('type', 'UNION')
    form.set('metadata', JSON.stringify({ date_debut: '2000-06-01' }))

    await createRelationship(form)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { date_debut: '2000-06-01' } })
    )
  })
})

describe('deleteRelationship', () => {
  it('deletes a relationship by id', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: null })

    const { deleteRelationship } = await import('../relationships')
    const result = await deleteRelationship('rel-001')
    expect(result).toEqual({})
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'rel-001')
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when delete fails', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: { message: 'Not found' } })

    const { deleteRelationship } = await import('../relationships')
    const result = await deleteRelationship('rel-999')
    expect(result).toEqual({ error: 'Not found' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/relationships.test.ts
```

Expected: FAIL — module `../relationships` not found.

- [ ] **Step 3: Implement relationship server actions**

```typescript
// src/server-actions/relationships.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasAncestorCycle } from '@/lib/cycle-detection'

const CYCLE_CHECKED_TYPES = new Set(['PARENT_CHILD', 'ADOPTION'])

export async function createRelationship(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const person_a_id = formData.get('person_a_id') as string
  const person_b_id = formData.get('person_b_id') as string
  const type = formData.get('type') as string
  const metadataRaw = formData.get('metadata') as string | null

  const metadata = metadataRaw ? JSON.parse(metadataRaw) : {}

  // Cycle check only for hierarchical types.
  // Convention: person_a_id = proposed parent, person_b_id = child.
  // A cycle exists if person_b_id is already an ancestor of person_a_id.
  // hasAncestorCycle(personId, proposedParentId, rels) → BFS upward from proposedParentId;
  // returns true if personId appears in that chain.
  if (CYCLE_CHECKED_TYPES.has(type)) {
    const { data: existingRels } = await supabase
      .from('relationship')
      .select('*')

    const rels = (existingRels ?? []) as {
      person_a_id: string
      person_b_id: string
      type: string
    }[]

    if (hasAncestorCycle(person_b_id, person_a_id, rels)) {
      return {
        error:
          "Cette relation créerait un cycle dans l'arbre généalogique.",
      }
    }
  }

  const { data, error } = await supabase
    .from('relationship')
    .insert({ person_a_id, person_b_id, type, metadata })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function deleteRelationship(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('relationship').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/relationships.test.ts
```

Expected: PASS — 7 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/server-actions/relationships.ts src/server-actions/__tests__/relationships.test.ts
git commit -m "feat: add createRelationship/deleteRelationship server actions with cycle detection"
```

---

### Task 6: PersonModal UI component

**Files:**
- Create: `src/components/person/PersonModal.tsx`
- Create: `src/components/person/__tests__/PersonModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/person/__tests__/PersonModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/server-actions/persons', () => ({
  createPerson: vi.fn().mockResolvedValue({}),
  updatePerson: vi.fn().mockResolvedValue({}),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { createPerson, updatePerson } from '@/server-actions/persons'

const defaultProps = {
  mode: 'add' as const,
  onClose: vi.fn(),
}

// Lazily import to pick up mocks
async function renderModal(props = defaultProps) {
  const { PersonModal } = await import('../PersonModal')
  return render(<PersonModal {...props} />)
}

describe('PersonModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the add form with prenom and nom fields', async () => {
    await renderModal()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
  })

  it('shows "Ajouter une personne" title in add mode', async () => {
    await renderModal()
    expect(screen.getByText(/ajouter une personne/i)).toBeInTheDocument()
  })

  it('shows "Modifier" title in edit mode', async () => {
    const editPerson = {
      id: 'p1', prenom: 'Marie', nom: 'Curie',
      date_naissance: null, lieu_naissance: null, lat_naissance: null,
      lon_naissance: null, date_deces: null, lieu_deces: null,
      lat_deces: null, lon_deces: null, notes: null,
      created_at: '', updated_at: '',
    }
    const { PersonModal } = await import('../PersonModal')
    render(<PersonModal mode={{ type: 'edit', person: editPerson }} onClose={vi.fn()} />)
    expect(screen.getByText(/modifier/i)).toBeInTheDocument()
  })

  it('pre-fills form fields in edit mode', async () => {
    const editPerson = {
      id: 'p1', prenom: 'Marie', nom: 'Curie',
      date_naissance: '1867-11-07', lieu_naissance: 'Warsaw',
      lat_naissance: null, lon_naissance: null,
      date_deces: null, lieu_deces: null,
      lat_deces: null, lon_deces: null, notes: null,
      created_at: '', updated_at: '',
    }
    const { PersonModal } = await import('../PersonModal')
    render(<PersonModal mode={{ type: 'edit', person: editPerson }} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Marie')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Curie')).toBeInTheDocument()
  })

  it('calls createPerson with form data on submit in add mode', async () => {
    vi.mocked(createPerson).mockResolvedValue({ id: 'new-id' })
    const user = userEvent.setup()
    await renderModal()

    await user.type(screen.getByLabelText(/prénom/i), 'Jean')
    await user.type(screen.getByLabelText(/nom/i), 'Dupont')
    await user.click(screen.getByRole('button', { name: /ajouter/i }))

    await waitFor(() => {
      expect(createPerson).toHaveBeenCalled()
    })
  })

  it('displays an error message when server action returns error', async () => {
    vi.mocked(createPerson).mockResolvedValue({ error: 'Champ requis' })
    const user = userEvent.setup()
    await renderModal()

    await user.type(screen.getByLabelText(/prénom/i), 'Jean')
    await user.type(screen.getByLabelText(/nom/i), 'Dupont')
    await user.click(screen.getByRole('button', { name: /ajouter/i }))

    await waitFor(() => {
      expect(screen.getByText('Champ requis')).toBeInTheDocument()
    })
  })

  it('calls onClose when the cancel button is clicked', async () => {
    const onClose = vi.fn()
    const { PersonModal } = await import('../PersonModal')
    render(<PersonModal mode="add" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/person/__tests__/PersonModal.test.tsx
```

Expected: FAIL — module `../PersonModal` not found.

- [ ] **Step 3: Implement PersonModal**

```typescript
// src/components/person/PersonModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createPerson, updatePerson } from '@/server-actions/persons'
import type { Person } from '@/lib/types/database'

type AddMode = 'add'
type EditMode = { type: 'edit'; person: Person }

interface PersonModalProps {
  mode: AddMode | EditMode
  onClose: () => void
}

export function PersonModal({ mode, onClose }: PersonModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEdit = mode !== 'add'
  const person = isEdit ? (mode as EditMode).person : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updatePerson(formData)
        : await createPerson(formData)

      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-lg w-full max-w-md p-6 flex flex-col gap-4">
        <h2 className="text-white font-semibold text-base">
          {isEdit ? 'Modifier' : 'Ajouter une personne'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isEdit && (
            <input type="hidden" name="id" value={person!.id} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="prenom"
              name="prenom"
              label="Prénom"
              defaultValue={person?.prenom ?? ''}
              required
              autoFocus
            />
            <Input
              id="nom"
              name="nom"
              label="Nom"
              defaultValue={person?.nom ?? ''}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="date_naissance"
              name="date_naissance"
              label="Date de naissance"
              type="date"
              defaultValue={person?.date_naissance ?? ''}
            />
            <Input
              id="lieu_naissance"
              name="lieu_naissance"
              label="Lieu de naissance"
              defaultValue={person?.lieu_naissance ?? ''}
              placeholder="ex. Paris, France"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="date_deces"
              name="date_deces"
              label="Date de décès"
              type="date"
              defaultValue={person?.date_deces ?? ''}
            />
            <Input
              id="lieu_deces"
              name="lieu_deces"
              label="Lieu de décès"
              defaultValue={person?.lieu_deces ?? ''}
              placeholder="ex. Sceaux, France"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-xs text-gray-400 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={person?.notes ?? ''}
              rows={3}
              className="bg-[#0d1117] border border-[#1e3a5f] rounded-md px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
              placeholder="Informations complémentaires…"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? '…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/person/__tests__/PersonModal.test.tsx
```

Expected: PASS — 7 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/person/PersonModal.tsx src/components/person/__tests__/PersonModal.test.tsx
git commit -m "feat: add PersonModal for add/edit person"
```

---

### Task 7: AppShell client component

**Files:**
- Create: `src/components/layout/AppShell.tsx`

No isolated unit test — AppShell is tested via integration in tree/page tests (Plan 3). Its behavior is verified by the full render path.

- [ ] **Step 1: Create AppShell**

```typescript
// src/components/layout/AppShell.tsx
'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { DetailPanel } from '@/components/layout/DetailPanel'
import { PersonModal } from '@/components/person/PersonModal'
import { TreeContext } from '@/lib/context/tree-context'
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'

interface AppShellProps {
  userEmail: string
  initialPersons: Person[]
  initialBranches: Branch[]
  initialRelationships: Relationship[]
  initialPersonBranches: PersonBranch[]
  children: React.ReactNode
}

type PersonModalMode = 'add' | { type: 'edit'; person: Person } | null

interface Toast {
  message: string
  type: 'error' | 'info'
}

export function AppShell({
  userEmail,
  initialPersons,
  initialBranches,
  initialRelationships,
  initialPersonBranches,
  children,
}: AppShellProps) {
  const router = useRouter()
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [personModalMode, setPersonModalMode] = useState<PersonModalMode>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const selectPerson = useCallback((id: string | null) => {
    setSelectedPersonId(id)
    setDetailOpen(id !== null)
  }, [])

  const openAddPerson = useCallback(() => {
    setPersonModalMode('add')
  }, [])

  const openEditPerson = useCallback((id: string) => {
    const person = initialPersons.find(p => p.id === id)
    if (!person) return
    setPersonModalMode({ type: 'edit', person })
  }, [initialPersons])

  const showToast = useCallback((message: string, type: 'error' | 'info' = 'info') => {
    setToast({ message, type })
  }, [])

  const selectedPerson = selectedPersonId
    ? initialPersons.find(p => p.id === selectedPersonId) ?? null
    : null

  return (
    <TreeContext.Provider
      value={{
        persons: initialPersons,
        branches: initialBranches,
        relationships: initialRelationships,
        personBranches: initialPersonBranches,
        selectedPersonId,
        selectPerson,
        openAddPerson,
        openEditPerson,
        showToast,
      }}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <Topbar
          userEmail={userEmail}
          onAddPerson={openAddPerson}
          onSearchOpen={() => setSearchOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar branches={initialBranches} />
          <main className="flex-1 overflow-hidden relative">{children}</main>
          <DetailPanel
            isOpen={detailOpen}
            onClose={() => { setDetailOpen(false); setSelectedPersonId(null) }}
            person={selectedPerson}
            personBranches={initialPersonBranches}
            branches={initialBranches}
            relationships={initialRelationships}
            allPersons={initialPersons}
            onSelectPerson={selectPerson}
            onEditPerson={openEditPerson}
            onDeletePerson={async (id) => {
              const { deletePerson } = await import('@/server-actions/persons')
              const result = await deletePerson(id)
              if (result.error) {
                showToast(result.error, 'error')
              } else {
                setDetailOpen(false)
                setSelectedPersonId(null)
                router.refresh()
              }
            }}
          />
        </div>
      </div>

      {personModalMode !== null && (
        <PersonModal
          mode={personModalMode === 'add' ? 'add' : personModalMode}
          onClose={() => setPersonModalMode(null)}
        />
      )}

      {toast && (
        <div
          role="status"
          className={[
            'fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg text-sm shadow-lg',
            toast.type === 'error'
              ? 'bg-red-900/90 text-red-200 border border-red-700'
              : 'bg-[#0d1117]/90 text-gray-200 border border-[#1e3a5f]',
          ].join(' ')}
        >
          {toast.message}
        </div>
      )}

      {searchOpen && (
        // SearchOverlay is wired in Chunk 2 Task 8
        // For now render a placeholder that can be closed
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setSearchOpen(false)}
        />
      )}
    </TreeContext.Provider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/layout/AppShell.tsx
git commit -m "feat: add AppShell client component with TreeContext provider"
```

---

### Task 8: Rewire (app)/layout.tsx and tree/page.tsx

**Files:**
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/app/(app)/tree/page.tsx`
- Modify: `src/components/layout/Topbar.tsx` (add `onAddPerson` + `onSearchOpen` props)
- Modify: `src/components/layout/Sidebar.tsx` (add `branches` prop)
- Modify: `src/components/layout/DetailPanel.tsx` (add person data props)

- [ ] **Step 1: Update Topbar to accept onAddPerson and onSearchOpen**

Replace `src/components/layout/Topbar.tsx` with:

```typescript
// src/components/layout/Topbar.tsx
'use client'
import { signout } from '@/server-actions/auth'

type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'

interface TopbarProps {
  userEmail: string
  activeView?: View
  onViewChange?: (view: View) => void
  onAddPerson?: () => void
  onSearchOpen?: () => void
}

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'cosmos', label: 'Cosmos', icon: '🌌' },
  { id: 'sablier', label: 'Sablier', icon: '⧖' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'carte', label: 'Carte', icon: '🗺' },
  { id: 'eventail', label: 'Éventail', icon: '🌀' },
]

export function Topbar({
  userEmail,
  activeView = 'cosmos',
  onViewChange,
  onAddPerson,
  onSearchOpen,
}: TopbarProps) {
  const initials = userEmail.slice(0, 2).toUpperCase() || '?'

  return (
    <header className="h-12 bg-[#0d1117] border-b border-[#1e3a5f] flex items-center px-4 gap-4 shrink-0">
      <div className="text-red-500 font-bold text-sm tracking-widest uppercase mr-2">
        🌳 Généalogie
      </div>
      <nav className="flex items-center gap-1">
        {VIEWS.map(view => (
          <button
            key={view.id}
            type="button"
            onClick={() => onViewChange?.(view.id)}
            aria-pressed={activeView === view.id}
            className={[
              'px-3 py-1.5 rounded text-xs transition-colors',
              activeView === view.id
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
            ].join(' ')}
          >
            {view.icon} {view.label}
          </button>
        ))}
      </nav>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onAddPerson}
        className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors"
      >
        + Ajouter
      </button>
      <button
        type="button"
        onClick={onSearchOpen}
        className="text-gray-500 hover:text-gray-300 text-sm"
        aria-label="Rechercher"
      >
        🔍
      </button>
      <form action={signout}>
        <button
          type="submit"
          className="w-7 h-7 rounded-full bg-[#1e3a5f] text-[#7ec8e3] text-xs font-bold flex items-center justify-center hover:bg-[#2a4f7f] transition-colors"
          title={`Déconnexion (${userEmail})`}
        >
          {initials}
        </button>
      </form>
    </header>
  )
}
```

- [ ] **Step 2: Update Sidebar to accept branches prop**

Replace `src/components/layout/Sidebar.tsx` with:

```typescript
// src/components/layout/Sidebar.tsx
'use client'
import type { Branch } from '@/lib/types/database'

interface SidebarProps {
  branches: Branch[]
}

export function Sidebar({ branches }: SidebarProps) {
  return (
    <aside className="w-48 bg-[#080d16] border-r border-[#1e3a5f] flex flex-col gap-1 p-3 overflow-y-auto shrink-0">
      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Branches</div>
      <button
        type="button"
        className="text-left text-xs text-blue-300 bg-blue-900/20 px-2 py-1.5 rounded border-l-2 border-blue-400"
      >
        🌿 Toutes les branches
      </button>
      {branches.length === 0 ? (
        <div className="text-xs text-gray-600 px-2 py-1 italic">Aucune branche</div>
      ) : (
        branches.map(branch => (
          <button
            key={branch.id}
            type="button"
            className="text-left text-xs text-gray-300 px-2 py-1.5 rounded hover:bg-white/5 flex items-center gap-2"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: branch.couleur }}
            />
            {branch.nom}
          </button>
        ))
      )}
      <button
        type="button"
        className="text-left text-[10px] text-gray-600 px-2 py-1 hover:text-gray-400"
      >
        + Nouvelle branche
      </button>
      <div className="flex-1" />
      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 mt-3">Filtres</div>
      <label htmlFor="filter-vivants" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input id="filter-vivants" name="filter-vivants" type="checkbox" className="accent-green-500" /> Vivants
      </label>
      <label htmlFor="filter-decedes" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input id="filter-decedes" name="filter-decedes" type="checkbox" className="accent-gray-400" /> Décédés
      </label>
      <label htmlFor="filter-avec-documents" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input id="filter-avec-documents" name="filter-avec-documents" type="checkbox" className="accent-yellow-500" /> Avec documents
      </label>
      <div className="border-t border-[#1e3a5f] mt-3 pt-3">
        <button type="button" className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">👥 Gérer les accès</button>
        <button type="button" className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">⚙️ Paramètres</button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Update DetailPanel to accept person data props**

Replace `src/components/layout/DetailPanel.tsx` with:

```typescript
// src/components/layout/DetailPanel.tsx
'use client'
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'

interface DetailPanelProps {
  isOpen: boolean
  onClose: () => void
  person: Person | null
  personBranches: PersonBranch[]
  branches: Branch[]
  relationships: Relationship[]
  allPersons: Person[]
  onSelectPerson: (id: string | null) => void
  onEditPerson: (id: string) => void
  onDeletePerson: (id: string) => Promise<void>
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const RELATION_LABEL: Record<string, string> = {
  PARENT_CHILD: 'Parent / Enfant',
  UNION: 'Union',
  ADOPTION: 'Adoption',
  SIBLING: 'Frère / Sœur',
  HALF_SIBLING: 'Demi-frère / Demi-sœur',
  STEP: 'Beau-parent / Bel-enfant',
}

export function DetailPanel({
  isOpen,
  onClose,
  person,
  personBranches,
  branches,
  relationships,
  allPersons,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
}: DetailPanelProps) {
  if (!isOpen) return null

  const personBranchIds = person
    ? personBranches
        .filter(pb => pb.person_id === person.id)
        .map(pb => pb.branch_id)
    : []

  const personBranchList = branches.filter(b => personBranchIds.includes(b.id))

  const personRelationships = person
    ? relationships.filter(
        r => r.person_a_id === person.id || r.person_b_id === person.id
      )
    : []

  function getOtherPerson(rel: Relationship): Person | undefined {
    if (!person) return undefined
    const otherId =
      rel.person_a_id === person.id ? rel.person_b_id : rel.person_a_id
    return allPersons.find(p => p.id === otherId)
  }

  return (
    <aside className="w-64 bg-[#080d16] border-l border-[#1e3a5f] flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b border-[#1e3a5f]">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Détail</span>
        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xs">
          ✕
        </button>
      </div>

      {!person ? (
        <div className="p-3">
          <p className="text-xs text-gray-600 italic">Sélectionnez une personne</p>
        </div>
      ) : (
        <div className="p-3 flex flex-col gap-4 flex-1">
          {/* Identity */}
          <div>
            <h3 className="text-white font-semibold text-sm">
              {person.prenom} {person.nom}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(person.date_naissance)}
              {person.lieu_naissance ? ` · ${person.lieu_naissance}` : ''}
            </p>
            {person.date_deces && (
              <p className="text-xs text-gray-600">
                † {formatDate(person.date_deces)}
                {person.lieu_deces ? ` · ${person.lieu_deces}` : ''}
              </p>
            )}
            {person.notes && (
              <p className="text-xs text-gray-500 mt-2 italic">{person.notes}</p>
            )}
          </div>

          {/* Branches */}
          {personBranchList.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
                Branches
              </div>
              <div className="flex flex-wrap gap-1">
                {personBranchList.map(b => (
                  <span
                    key={b.id}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${b.couleur}22`,
                      color: b.couleur,
                      border: `1px solid ${b.couleur}44`,
                    }}
                  >
                    {b.nom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Relations */}
          {personRelationships.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
                Relations
              </div>
              <div className="flex flex-col gap-1">
                {personRelationships.map(rel => {
                  const other = getOtherPerson(rel)
                  if (!other) return null
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectPerson(other.id)}
                      className="text-left text-xs text-blue-300 hover:text-blue-200 py-0.5 flex items-center gap-1"
                    >
                      <span className="text-[10px] text-gray-600">
                        {RELATION_LABEL[rel.type] ?? rel.type}
                      </span>
                      <span>{other.prenom} {other.nom}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents placeholder — wired in Chunk 2 */}
          <div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
              Documents
            </div>
            <p className="text-xs text-gray-600 italic">Chargement en Chunk 2…</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-2 border-t border-[#1e3a5f]">
            <button
              type="button"
              onClick={() => onEditPerson(person.id)}
              className="flex-1 text-xs py-1.5 bg-white/5 text-gray-300 hover:bg-white/10 rounded transition-colors"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={() => onDeletePerson(person.id)}
              className="flex-1 text-xs py-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
```

- [ ] **Step 4: Rewrite (app)/layout.tsx as Server Component**

Replace `src/app/(app)/layout.tsx` with:

```typescript
// src/app/(app)/layout.tsx
// Server Component — no 'use client' directive
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: persons },
    { data: branches },
    { data: relationships },
    { data: personBranches },
  ] = await Promise.all([
    supabase.from('person').select('*').order('nom'),
    supabase.from('branch').select('*').order('nom'),
    supabase.from('relationship').select('*'),
    supabase.from('person_branch').select('*'),
  ])

  return (
    <AppShell
      userEmail={user.email ?? ''}
      initialPersons={(persons ?? []) as Person[]}
      initialBranches={(branches ?? []) as Branch[]}
      initialRelationships={(relationships ?? []) as Relationship[]}
      initialPersonBranches={(personBranches ?? []) as PersonBranch[]}
    >
      {children}
    </AppShell>
  )
}
```

- [ ] **Step 5: Rewrite tree/page.tsx to consume TreeContext**

Replace `src/app/(app)/tree/page.tsx` with:

```typescript
// src/app/(app)/tree/page.tsx
'use client'
import { useTree } from '@/lib/context/tree-context'

function formatYear(date: string | null): string {
  if (!date) return ''
  return new Date(date).getFullYear().toString()
}

export default function TreePage() {
  const { persons, openAddPerson, selectPerson } = useTree()

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌳</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Votre arbre vous attend
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Commencez par ajouter la première personne.
          </p>
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

  return (
    <div className="w-full h-full overflow-auto p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {persons.map(person => {
          const birthYear = formatYear(person.date_naissance)
          const deathYear = formatYear(person.date_deces)
          const dates = [birthYear, deathYear].filter(Boolean).join(' – ')
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => selectPerson(person.id)}
              className="text-left bg-[#0d1117] border border-[#1e3a5f] rounded-lg p-3 hover:border-blue-500/50 transition-colors"
            >
              <p className="text-white text-sm font-medium">
                {person.prenom} {person.nom}
              </p>
              {dates && (
                <p className="text-xs text-gray-500 mt-0.5">{dates}</p>
              )}
              {person.lieu_naissance && (
                <p className="text-xs text-gray-600 mt-0.5">
                  {person.lieu_naissance}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/jbbotello/Genealogy && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add \
  src/app/(app)/layout.tsx \
  src/app/(app)/tree/page.tsx \
  src/components/layout/Topbar.tsx \
  src/components/layout/Sidebar.tsx \
  src/components/layout/DetailPanel.tsx
git commit -m "feat: rewire AppLayout as Server Component + wire AppShell + update tree page"
```

---

### Task 9: Run full Chunk 1 test suite

- [ ] **Step 1: Run all tests**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run
```

Expected output (all pass):
```
 ✓ src/lib/geocode.test.ts (4 tests)
 ✓ src/lib/cycle-detection.test.ts (7 tests)
 ✓ src/server-actions/__tests__/persons.test.ts (7 tests)
 ✓ src/server-actions/__tests__/relationships.test.ts (7 tests)
 ✓ src/components/person/__tests__/PersonModal.test.tsx (7 tests)
 ✓ src/lib/supabase/__tests__/client.test.ts (1 test)
 ✓ src/lib/supabase/__tests__/server.test.ts (1 test)
 ✓ src/server-actions/__tests__/auth.test.ts (2 tests)

Test Files  8 passed (8)
Tests       36 passed (36)
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
cd /Users/jbbotello/Genealogy && npx next build 2>&1 | tail -20
```

Expected: build completes with no TypeScript or module errors.

---

*End of Chunk 1*

---

## Chunk 2: Branch CRUD + Sidebar, Document Upload, DetailPanel Documents, Search Overlay

### File Map — Chunk 2

| File | Action | Responsibility |
|------|--------|----------------|
| `src/server-actions/branches.ts` | Create | createBranch, updateBranch, deleteBranch, assignPersonToBranch, removePersonFromBranch |
| `src/server-actions/documents.ts` | Create | uploadDocument, deleteDocument, getSignedUrl |
| `src/server-actions/search.ts` | Create | searchPersons (ilike, max 10 results) |
| `src/components/branch/BranchModal.tsx` | Create | Add/Edit modal form for a branch |
| `src/components/search/SearchOverlay.tsx` | Create | Search input + results overlay |
| `src/components/layout/AppShell.tsx` | Modify | Wire SearchOverlay; wire branch modal open state |
| `src/components/layout/Sidebar.tsx` | Modify | Wire branch CRUD actions and branch modal |
| `src/components/layout/DetailPanel.tsx` | Modify | Replace documents placeholder with real document list + upload |
| `src/server-actions/__tests__/branches.test.ts` | Create | Tests for branch server actions |
| `src/server-actions/__tests__/documents.test.ts` | Create | Tests for document server actions |
| `src/server-actions/__tests__/search.test.ts` | Create | Tests for searchPersons |
| `src/components/branch/__tests__/BranchModal.test.tsx` | Create | Tests for BranchModal UI |
| `src/components/search/__tests__/SearchOverlay.test.tsx` | Create | Tests for SearchOverlay UI |

---

### Task 1: Branch server actions

**Files:**
- Create: `src/server-actions/branches.ts`
- Create: `src/server-actions/__tests__/branches.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/server-actions/__tests__/branches.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockUpdateEq = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockDeleteEq = vi.fn(() => ({ error: null }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockInsertJunction = vi.fn(() => ({ error: null }))
const mockDeleteJunctionEq = vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
const mockDeleteJunction = vi.fn(() => ({ eq: mockDeleteJunctionEq }))

const mockFrom = vi.fn((table: string) => {
  if (table === 'person_branch') {
    return { insert: mockInsertJunction, delete: mockDeleteJunction }
  }
  return { insert: mockInsert, update: mockUpdate, delete: mockDelete }
})

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
})

describe('createBranch', () => {
  it('inserts a branch and returns its id', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'branch-1' }, error: null })

    const { createBranch } = await import('../branches')
    const form = new FormData()
    form.set('nom', 'Côté Maternel')
    form.set('couleur', '#3b82f6')

    const result = await createBranch(form)
    expect(result).toEqual({ id: 'branch-1' })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ nom: 'Côté Maternel', couleur: '#3b82f6', created_by: 'user-1' })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const { createBranch } = await import('../branches')
    const form = new FormData()
    form.set('nom', 'Test')
    form.set('couleur', '#ff0000')

    const result = await createBranch(form)
    expect(result).toEqual({ error: 'Non authentifié.' })
  })

  it('returns error when insert fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const { createBranch } = await import('../branches')
    const form = new FormData()
    form.set('nom', 'Test')
    form.set('couleur', '#ff0000')

    const result = await createBranch(form)
    expect(result).toEqual({ error: 'DB error' })
  })
})

describe('updateBranch', () => {
  it('updates a branch and returns its id', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'branch-1' }, error: null })

    const { updateBranch } = await import('../branches')
    const form = new FormData()
    form.set('id', 'branch-1')
    form.set('nom', 'Nouveau Nom')
    form.set('couleur', '#ef4444')

    const result = await updateBranch(form)
    expect(result).toEqual({ id: 'branch-1' })
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when update fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const { updateBranch } = await import('../branches')
    const form = new FormData()
    form.set('id', 'branch-999')
    form.set('nom', 'X')
    form.set('couleur', '#000')

    const result = await updateBranch(form)
    expect(result).toEqual({ error: 'Not found' })
  })
})

describe('deleteBranch', () => {
  it('deletes a branch by id', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: null })

    const { deleteBranch } = await import('../branches')
    const result = await deleteBranch('branch-1')
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when delete fails', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: { message: 'Constraint violation' } })

    const { deleteBranch } = await import('../branches')
    const result = await deleteBranch('branch-1')
    expect(result).toEqual({ error: 'Constraint violation' })
  })
})

describe('assignPersonToBranch', () => {
  it('inserts a person_branch row', async () => {
    mockInsertJunction.mockReturnValue({ error: null })

    const { assignPersonToBranch } = await import('../branches')
    const result = await assignPersonToBranch('person-1', 'branch-1')
    expect(result).toEqual({})
    expect(mockInsertJunction).toHaveBeenCalledWith({
      person_id: 'person-1',
      branch_id: 'branch-1',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when insert fails', async () => {
    mockInsertJunction.mockReturnValue({ error: { message: 'Already assigned' } })

    const { assignPersonToBranch } = await import('../branches')
    const result = await assignPersonToBranch('person-1', 'branch-1')
    expect(result).toEqual({ error: 'Already assigned' })
  })
})

describe('removePersonFromBranch', () => {
  it('deletes the person_branch row', async () => {
    const mockSecondEq = vi.fn(() => ({ error: null }))
    mockDeleteJunctionEq.mockReturnValue({ eq: mockSecondEq })

    const { removePersonFromBranch } = await import('../branches')
    const result = await removePersonFromBranch('person-1', 'branch-1')
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/branches.test.ts
```

Expected: FAIL — module `../branches` not found.

- [ ] **Step 3: Implement branch server actions**

```typescript
// src/server-actions/branches.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBranch(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data, error } = await supabase
    .from('branch')
    .insert({
      nom: formData.get('nom') as string,
      couleur: formData.get('couleur') as string,
      description: (formData.get('description') as string) || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function updateBranch(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { data, error } = await supabase
    .from('branch')
    .update({
      nom: formData.get('nom') as string,
      couleur: formData.get('couleur') as string,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function deleteBranch(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('branch').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}

export async function assignPersonToBranch(
  personId: string,
  branchId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('person_branch')
    .insert({ person_id: personId, branch_id: branchId })
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}

export async function removePersonFromBranch(
  personId: string,
  branchId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('person_branch')
    .delete()
    .eq('person_id', personId)
    .eq('branch_id', branchId)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/branches.test.ts
```

Expected: PASS — 9 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/server-actions/branches.ts src/server-actions/__tests__/branches.test.ts
git commit -m "feat: add branch CRUD + person-branch assignment server actions"
```

---

### Task 2: BranchModal UI component

**Files:**
- Create: `src/components/branch/BranchModal.tsx`
- Create: `src/components/branch/__tests__/BranchModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/branch/__tests__/BranchModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/server-actions/branches', () => ({
  createBranch: vi.fn().mockResolvedValue({}),
  updateBranch: vi.fn().mockResolvedValue({}),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { createBranch, updateBranch } from '@/server-actions/branches'

const defaultProps = { mode: 'add' as const, onClose: vi.fn() }

async function renderModal(props = defaultProps) {
  const { BranchModal } = await import('../BranchModal')
  return render(<BranchModal {...props} />)
}

describe('BranchModal', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders nom and couleur fields in add mode', async () => {
    await renderModal()
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/couleur/i)).toBeInTheDocument()
  })

  it('shows "Nouvelle branche" title in add mode', async () => {
    await renderModal()
    expect(screen.getByText(/nouvelle branche/i)).toBeInTheDocument()
  })

  it('pre-fills fields in edit mode', async () => {
    const branch = {
      id: 'b1', nom: 'Côté Paternel', couleur: '#3b82f6',
      description: 'Branche paternelle', created_by: 'u1', created_at: '',
    }
    const { BranchModal } = await import('../BranchModal')
    render(<BranchModal mode={{ type: 'edit', branch }} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Côté Paternel')).toBeInTheDocument()
  })

  it('calls createBranch on submit in add mode', async () => {
    vi.mocked(createBranch).mockResolvedValue({ id: 'new-b' })
    const user = userEvent.setup()
    await renderModal()

    await user.type(screen.getByLabelText(/nom/i), 'Maternel')
    await user.click(screen.getByRole('button', { name: /créer/i }))

    await waitFor(() => {
      expect(createBranch).toHaveBeenCalled()
    })
  })

  it('displays error when server action returns error', async () => {
    vi.mocked(createBranch).mockResolvedValue({ error: 'Nom requis' })
    const user = userEvent.setup()
    await renderModal()

    await user.type(screen.getByLabelText(/nom/i), 'X')
    await user.click(screen.getByRole('button', { name: /créer/i }))

    await waitFor(() => {
      expect(screen.getByText('Nom requis')).toBeInTheDocument()
    })
  })

  it('calls onClose on cancel', async () => {
    const onClose = vi.fn()
    const { BranchModal } = await import('../BranchModal')
    render(<BranchModal mode="add" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/branch/__tests__/BranchModal.test.tsx
```

Expected: FAIL — module `../BranchModal` not found.

- [ ] **Step 3: Implement BranchModal**

```typescript
// src/components/branch/BranchModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createBranch, updateBranch } from '@/server-actions/branches'
import type { Branch } from '@/lib/types/database'

type AddMode = 'add'
type EditMode = { type: 'edit'; branch: Branch }

interface BranchModalProps {
  mode: AddMode | EditMode
  onClose: () => void
}

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

export function BranchModal({ mode, onClose }: BranchModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEdit = mode !== 'add'
  const branch = isEdit ? (mode as EditMode).branch : null
  const [selectedColor, setSelectedColor] = useState(branch?.couleur ?? PRESET_COLORS[0])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('couleur', selectedColor)

    startTransition(async () => {
      const result = isEdit
        ? await updateBranch(formData)
        : await createBranch(formData)

      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 className="text-white font-semibold text-base">
          {isEdit ? 'Modifier la branche' : 'Nouvelle branche'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isEdit && <input type="hidden" name="id" value={branch!.id} />}

          <Input
            id="nom"
            name="nom"
            label="Nom"
            defaultValue={branch?.nom ?? ''}
            required
            autoFocus
            placeholder="ex. Côté Maternel"
          />

          <Input
            id="description"
            name="description"
            label="Description (optionnel)"
            defaultValue={branch?.description ?? ''}
            placeholder="ex. Famille du côté de la mère"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="couleur-display" className="text-xs text-gray-400 uppercase tracking-wider">
              Couleur
            </label>
            <div className="flex gap-2 flex-wrap" id="couleur-display" aria-label="Couleur">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={[
                    'w-6 h-6 rounded-full border-2 transition-all',
                    selectedColor === color ? 'border-white scale-110' : 'border-transparent',
                  ].join(' ')}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                  aria-pressed={selectedColor === color}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? '…' : isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/branch/__tests__/BranchModal.test.tsx
```

Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/branch/BranchModal.tsx src/components/branch/__tests__/BranchModal.test.tsx
git commit -m "feat: add BranchModal for add/edit branch"
```

---

### Task 3: Document server actions

**Files:**
- Create: `src/server-actions/documents.ts`
- Create: `src/server-actions/__tests__/documents.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/server-actions/__tests__/documents.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Storage mock
const mockStorageUpload = vi.fn()
const mockStorageRemove = vi.fn()
const mockStorageCreateSignedUrl = vi.fn()
const mockStorageFrom = vi.fn(() => ({
  upload: mockStorageUpload,
  remove: mockStorageRemove,
  createSignedUrl: mockStorageCreateSignedUrl,
}))

// DB mock
const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockDeleteEq = vi.fn(() => ({ error: null }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockFrom = vi.fn(() => ({ insert: mockInsert, delete: mockDelete }))

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
const mockSupabase = {
  from: mockFrom,
  storage: { from: mockStorageFrom },
  auth: { getUser: mockGetUser },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
})

describe('uploadDocument', () => {
  function makeFile(name: string, type: string, size: number): File {
    const content = new Uint8Array(size)
    return new File([content], name, { type })
  }

  it('uploads a PDF and inserts metadata, returns document id', async () => {
    const file = makeFile('acte.pdf', 'application/pdf', 1024)
    mockStorageUpload.mockResolvedValue({ data: { path: 'user-1/doc-id.pdf' }, error: null })
    mockSingle.mockResolvedValue({ data: { id: 'doc-1' }, error: null })

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Acte de naissance')
    form.set('type', 'ACTE_NAISSANCE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ id: 'doc-1' })
    expect(mockStorageUpload).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        person_id: 'person-1',
        nom: 'Acte de naissance',
        type: 'ACTE_NAISSANCE',
        taille_bytes: 1024,
        uploaded_by: 'user-1',
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when file is not a PDF', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Photo')
    form.set('type', 'AUTRE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'Seuls les fichiers PDF sont acceptés.' })
    expect(mockStorageUpload).not.toHaveBeenCalled()
  })

  it('returns error when file exceeds 20 MB', async () => {
    const file = makeFile('big.pdf', 'application/pdf', 20971521)

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Gros fichier')
    form.set('type', 'AUTRE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'Le fichier dépasse la limite de 20 Mo.' })
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const file = makeFile('acte.pdf', 'application/pdf', 512)
    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Acte')
    form.set('type', 'ACTE_NAISSANCE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'Non authentifié.' })
  })

  it('returns error when storage upload fails', async () => {
    const file = makeFile('acte.pdf', 'application/pdf', 1024)
    mockStorageUpload.mockResolvedValue({ data: null, error: { message: 'Storage full' } })

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Acte')
    form.set('type', 'ACTE_NAISSANCE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'Storage full' })
  })
})

describe('deleteDocument', () => {
  it('removes from storage and deletes DB row', async () => {
    mockStorageRemove.mockResolvedValue({ error: null })
    mockDeleteEq.mockReturnValueOnce({ error: null })

    const { deleteDocument } = await import('../documents')
    const result = await deleteDocument('doc-1', 'user-1/doc-1.pdf')
    expect(result).toEqual({})
    expect(mockStorageRemove).toHaveBeenCalledWith(['user-1/doc-1.pdf'])
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when storage remove fails', async () => {
    mockStorageRemove.mockResolvedValue({ error: { message: 'Not found' } })

    const { deleteDocument } = await import('../documents')
    const result = await deleteDocument('doc-1', 'user-1/doc-1.pdf')
    expect(result).toEqual({ error: 'Not found' })
  })
})

describe('getSignedUrl', () => {
  it('returns a signed URL for a storage path', async () => {
    mockStorageCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null,
    })

    const { getSignedUrl } = await import('../documents')
    const result = await getSignedUrl('user-1/doc-1.pdf')
    expect(result).toEqual({ url: 'https://example.com/signed-url' })
    // 7 days = 604800 seconds
    expect(mockStorageCreateSignedUrl).toHaveBeenCalledWith('user-1/doc-1.pdf', 604800)
  })

  it('returns error when createSignedUrl fails', async () => {
    mockStorageCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'Access denied' },
    })

    const { getSignedUrl } = await import('../documents')
    const result = await getSignedUrl('user-1/doc-1.pdf')
    expect(result).toEqual({ error: 'Access denied' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/documents.test.ts
```

Expected: FAIL — module `../documents` not found.

- [ ] **Step 3: Implement document server actions**

```typescript
// src/server-actions/documents.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB
const SIGNED_URL_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds
const BUCKET = 'documents'

export async function uploadDocument(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'Aucun fichier fourni.' }

  if (file.type !== 'application/pdf') {
    return { error: 'Seuls les fichiers PDF sont acceptés.' }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'Le fichier dépasse la limite de 20 Mo.' }
  }

  const documentId = randomUUID()
  const storagePath = `${user.id}/${documentId}.pdf`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: 'application/pdf' })

  if (uploadError) return { error: uploadError.message }

  const { data, error: dbError } = await supabase
    .from('document')
    .insert({
      id: documentId,
      person_id: formData.get('person_id') as string,
      nom: formData.get('nom') as string,
      type: formData.get('type') as string,
      url_stockage: storagePath,
      taille_bytes: file.size,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (dbError) {
    // Clean up orphaned storage file if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function deleteDocument(
  documentId: string,
  storagePath: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath])

  if (storageError) return { error: storageError.message }

  const { error: dbError } = await supabase
    .from('document')
    .delete()
    .eq('id', documentId)

  if (dbError) return { error: dbError.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function getSignedUrl(
  storagePath: string
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (error) return { error: error.message }
  return { url: data.signedUrl }
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/documents.test.ts
```

Expected: PASS — 8 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/server-actions/documents.ts src/server-actions/__tests__/documents.test.ts
git commit -m "feat: add uploadDocument/deleteDocument/getSignedUrl server actions"
```

---

### Task 4: Search server action

**Files:**
- Create: `src/server-actions/search.ts`
- Create: `src/server-actions/__tests__/search.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/server-actions/__tests__/search.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'

const mockLimit = vi.fn()
const mockOr = vi.fn(() => ({ limit: mockLimit }))
const mockSelect = vi.fn(() => ({ or: mockOr }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockSupabase = { from: mockFrom }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
})

describe('searchPersons', () => {
  it('returns empty array for blank query', async () => {
    const { searchPersons } = await import('../search')
    const result = await searchPersons('   ')
    expect(result).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns empty array for empty string', async () => {
    const { searchPersons } = await import('../search')
    const result = await searchPersons('')
    expect(result).toEqual([])
  })

  it('queries person table with ilike on all four fields', async () => {
    mockLimit.mockResolvedValue({ data: [{ id: 'p1', prenom: 'Marie', nom: 'Curie' }] })

    const { searchPersons } = await import('../search')
    const result = await searchPersons('Marie')

    expect(mockFrom).toHaveBeenCalledWith('person')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockOr).toHaveBeenCalledWith(
      'prenom.ilike.%Marie%,nom.ilike.%Marie%,lieu_naissance.ilike.%Marie%,lieu_deces.ilike.%Marie%'
    )
    expect(mockLimit).toHaveBeenCalledWith(10)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ prenom: 'Marie' })
  })

  it('returns empty array when data is null', async () => {
    mockLimit.mockResolvedValue({ data: null })

    const { searchPersons } = await import('../search')
    const result = await searchPersons('xyz')
    expect(result).toEqual([])
  })

  it('trims whitespace from query before building the filter', async () => {
    mockLimit.mockResolvedValue({ data: [] })

    const { searchPersons } = await import('../search')
    await searchPersons('  Dupont  ')

    expect(mockOr).toHaveBeenCalledWith(
      'prenom.ilike.%Dupont%,nom.ilike.%Dupont%,lieu_naissance.ilike.%Dupont%,lieu_deces.ilike.%Dupont%'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/search.test.ts
```

Expected: FAIL — module `../search` not found.

- [ ] **Step 3: Implement searchPersons**

```typescript
// src/server-actions/search.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import type { Person } from '@/lib/types/database'

export async function searchPersons(query: string): Promise<Person[]> {
  if (!query.trim()) return []
  const supabase = await createClient()
  const term = `%${query.trim()}%`
  const { data } = await supabase
    .from('person')
    .select('*')
    .or(
      `prenom.ilike.${term},nom.ilike.${term},lieu_naissance.ilike.${term},lieu_deces.ilike.${term}`
    )
    .limit(10)
  return data ?? []
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/search.test.ts
```

Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/server-actions/search.ts src/server-actions/__tests__/search.test.ts
git commit -m "feat: add searchPersons server action (ilike, max 10 results)"
```

---

### Task 5: SearchOverlay component

**Files:**
- Create: `src/components/search/SearchOverlay.tsx`
- Create: `src/components/search/__tests__/SearchOverlay.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/components/search/__tests__/SearchOverlay.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/server-actions/search', () => ({
  searchPersons: vi.fn().mockResolvedValue([]),
}))

import { searchPersons } from '@/server-actions/search'

const defaultProps = {
  onClose: vi.fn(),
  onSelectPerson: vi.fn(),
}

async function renderOverlay(props = defaultProps) {
  const { SearchOverlay } = await import('../SearchOverlay')
  return render(<SearchOverlay {...props} />)
}

describe('SearchOverlay', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders a search input', async () => {
    await renderOverlay()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('shows "Aucun résultat" when search returns empty', async () => {
    vi.mocked(searchPersons).mockResolvedValue([])
    const user = userEvent.setup()
    await renderOverlay()

    await user.type(screen.getByRole('searchbox'), 'xyz')
    await waitFor(() => {
      expect(screen.getByText(/aucun résultat/i)).toBeInTheDocument()
    })
  })

  it('displays search results', async () => {
    vi.mocked(searchPersons).mockResolvedValue([
      {
        id: 'p1', prenom: 'Marie', nom: 'Curie',
        date_naissance: '1867-11-07', lieu_naissance: 'Warsaw',
        lat_naissance: null, lon_naissance: null,
        date_deces: '1934-07-04', lieu_deces: 'Sceaux',
        lat_deces: null, lon_deces: null,
        notes: null, created_at: '', updated_at: '',
      },
    ])
    const user = userEvent.setup()
    await renderOverlay()

    await user.type(screen.getByRole('searchbox'), 'Marie')
    await waitFor(() => {
      expect(screen.getByText('Marie Curie')).toBeInTheDocument()
    })
  })

  it('calls onSelectPerson and onClose when a result is clicked', async () => {
    const onSelectPerson = vi.fn()
    const onClose = vi.fn()
    vi.mocked(searchPersons).mockResolvedValue([
      {
        id: 'p1', prenom: 'Marie', nom: 'Curie',
        date_naissance: null, lieu_naissance: null,
        lat_naissance: null, lon_naissance: null,
        date_deces: null, lieu_deces: null,
        lat_deces: null, lon_deces: null,
        notes: null, created_at: '', updated_at: '',
      },
    ])
    const user = userEvent.setup()
    const { SearchOverlay } = await import('../SearchOverlay')
    render(<SearchOverlay onClose={onClose} onSelectPerson={onSelectPerson} />)

    await user.type(screen.getByRole('searchbox'), 'Marie')
    await waitFor(() => screen.getByText('Marie Curie'))
    await user.click(screen.getByText('Marie Curie'))

    expect(onSelectPerson).toHaveBeenCalledWith('p1')
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    const { SearchOverlay } = await import('../SearchOverlay')
    render(<SearchOverlay onClose={onClose} onSelectPerson={vi.fn()} />)

    const backdrop = screen.getByTestId('search-backdrop')
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { SearchOverlay } = await import('../SearchOverlay')
    render(<SearchOverlay onClose={onClose} onSelectPerson={vi.fn()} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/search/__tests__/SearchOverlay.test.tsx
```

Expected: FAIL — module `../SearchOverlay` not found.

- [ ] **Step 3: Implement SearchOverlay**

```typescript
// src/components/search/SearchOverlay.tsx
'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { searchPersons } from '@/server-actions/search'
import type { Person } from '@/lib/types/database'

interface SearchOverlayProps {
  onClose: () => void
  onSelectPerson: (id: string) => void
}

export function SearchOverlay({ onClose, onSelectPerson }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Person[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Debounced search: 300ms after last keystroke
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const data = await searchPersons(query)
        setResults(data)
        setSearched(true)
      })
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function handleSelect(id: string) {
    onSelectPerson(id)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="search-backdrop"
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg">
        <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-[#1e3a5f]">
            <span className="text-gray-500 mr-2 text-sm">🔍</span>
            <input
              ref={inputRef}
              role="searchbox"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par nom, prénom, lieu…"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 focus:outline-none"
            />
            {isPending && (
              <span className="text-gray-600 text-xs ml-2 animate-pulse">…</span>
            )}
          </div>

          {query.trim() && (
            <ul className="max-h-72 overflow-y-auto">
              {results.length > 0 ? (
                results.map(person => (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(person.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex items-center gap-3 transition-colors"
                    >
                      <div>
                        <p className="text-white text-sm">
                          {person.prenom} {person.nom}
                        </p>
                        {(person.lieu_naissance || person.date_naissance) && (
                          <p className="text-xs text-gray-500">
                            {[person.lieu_naissance, person.date_naissance
                              ? new Date(person.date_naissance).getFullYear()
                              : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))
              ) : searched ? (
                <li className="px-4 py-6 text-center text-sm text-gray-500 italic">
                  Aucun résultat pour « {query.trim()} »
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/search/__tests__/SearchOverlay.test.tsx
```

Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/search/SearchOverlay.tsx src/components/search/__tests__/SearchOverlay.test.tsx
git commit -m "feat: add SearchOverlay with debounced search + keyboard dismiss"
```

---

### Task 6: Wire Sidebar with branch CRUD

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

No separate unit test — Sidebar interaction is tested via integration. The BranchModal is already covered by its own tests.

- [ ] **Step 1: Replace Sidebar with wired version**

Replace the full contents of `src/components/layout/Sidebar.tsx`:

```typescript
// src/components/layout/Sidebar.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Branch } from '@/lib/types/database'
import { BranchModal } from '@/components/branch/BranchModal'
import { deleteBranch } from '@/server-actions/branches'

interface SidebarProps {
  branches: Branch[]
}

export function Sidebar({ branches }: SidebarProps) {
  const router = useRouter()
  const [branchModalMode, setBranchModalMode] = useState<
    'add' | { type: 'edit'; branch: Branch } | null
  >(null)
  const [activeBranchId, setActiveBranchId] = useState<string | 'all'>('all')

  async function handleDeleteBranch(branch: Branch) {
    if (!confirm(`Supprimer la branche « ${branch.nom} » ?`)) return
    const result = await deleteBranch(branch.id)
    if (!result.error) router.refresh()
  }

  return (
    <>
      <aside className="w-48 bg-[#080d16] border-r border-[#1e3a5f] flex flex-col gap-1 p-3 overflow-y-auto shrink-0">
        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Branches</div>

        <button
          type="button"
          onClick={() => setActiveBranchId('all')}
          className={[
            'text-left text-xs px-2 py-1.5 rounded border-l-2 transition-colors',
            activeBranchId === 'all'
              ? 'text-blue-300 bg-blue-900/20 border-blue-400'
              : 'text-gray-500 bg-transparent border-transparent hover:text-gray-300 hover:bg-white/5',
          ].join(' ')}
        >
          🌿 Toutes les branches
        </button>

        {branches.length === 0 ? (
          <div className="text-xs text-gray-600 px-2 py-1 italic">Aucune branche</div>
        ) : (
          branches.map(branch => (
            <div key={branch.id} className="group flex items-center">
              <button
                type="button"
                onClick={() => setActiveBranchId(branch.id)}
                className={[
                  'flex-1 text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors',
                  activeBranchId === branch.id
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
                ].join(' ')}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: branch.couleur }}
                />
                <span className="truncate">{branch.nom}</span>
              </button>
              <button
                type="button"
                onClick={() => setBranchModalMode({ type: 'edit', branch })}
                className="hidden group-hover:flex text-gray-600 hover:text-gray-300 text-[10px] px-1"
                title="Modifier"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBranch(branch)}
                className="hidden group-hover:flex text-gray-600 hover:text-red-400 text-[10px] px-1"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={() => setBranchModalMode('add')}
          className="text-left text-[10px] text-gray-600 px-2 py-1 hover:text-gray-400 mt-1"
        >
          + Nouvelle branche
        </button>

        <div className="flex-1" />

        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 mt-3">Filtres</div>
        <label htmlFor="filter-vivants" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
          <input id="filter-vivants" name="filter-vivants" type="checkbox" className="accent-green-500" /> Vivants
        </label>
        <label htmlFor="filter-decedes" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
          <input id="filter-decedes" name="filter-decedes" type="checkbox" className="accent-gray-400" /> Décédés
        </label>
        <label htmlFor="filter-avec-documents" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
          <input id="filter-avec-documents" name="filter-avec-documents" type="checkbox" className="accent-yellow-500" /> Avec documents
        </label>

        <div className="border-t border-[#1e3a5f] mt-3 pt-3">
          <button type="button" className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">👥 Gérer les accès</button>
          <button type="button" className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">⚙️ Paramètres</button>
        </div>
      </aside>

      {branchModalMode !== null && (
        <BranchModal
          mode={branchModalMode}
          onClose={() => setBranchModalMode(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/layout/Sidebar.tsx
git commit -m "feat: wire Sidebar with branch CRUD — create/edit/delete + active filter"
```

---

### Task 7: Wire DetailPanel with documents

**Files:**
- Modify: `src/components/layout/DetailPanel.tsx`

This replaces the `"Chargement en Chunk 2…"` placeholder with a real document list. Documents are loaded on-demand via `getSignedUrl` when a download link is clicked.

- [ ] **Step 1: Update DetailPanel to load and display documents**

The `DetailPanel` needs to fetch the document list for the selected person. Because `DetailPanel` is a client component rendered by `AppShell`, we load documents via the Supabase browser client (using the existing `createBrowserClient` wrapper) when `person` changes. Signed URLs are fetched via server action only when the user clicks "Télécharger".

Replace the full contents of `src/components/layout/DetailPanel.tsx`:

```typescript
// src/components/layout/DetailPanel.tsx
'use client'
import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSignedUrl, uploadDocument, deleteDocument } from '@/server-actions/documents'
import type { Person, Branch, Relationship, PersonBranch, Document } from '@/lib/types/database'

interface DetailPanelProps {
  isOpen: boolean
  onClose: () => void
  person: Person | null
  personBranches: PersonBranch[]
  branches: Branch[]
  relationships: Relationship[]
  allPersons: Person[]
  onSelectPerson: (id: string | null) => void
  onEditPerson: (id: string) => void
  onDeletePerson: (id: string) => Promise<void>
  onShowToast?: (message: string, type?: 'error' | 'info') => void
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const RELATION_LABEL: Record<string, string> = {
  PARENT_CHILD: 'Parent / Enfant',
  UNION: 'Union',
  ADOPTION: 'Adoption',
  SIBLING: 'Frère / Sœur',
  HALF_SIBLING: 'Demi-frère / Demi-sœur',
  STEP: 'Beau-parent / Bel-enfant',
}

const DOC_TYPE_LABEL: Record<string, string> = {
  ACTE_NAISSANCE: 'Acte de naissance',
  ACTE_MARIAGE: 'Acte de mariage',
  ACTE_DECES: 'Acte de décès',
  AUTRE: 'Autre',
}

export function DetailPanel({
  isOpen,
  onClose,
  person,
  personBranches,
  branches,
  relationships,
  allPersons,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onShowToast,
}: DetailPanelProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isUploading, startUpload] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents when selected person changes
  useEffect(() => {
    if (!person) {
      setDocuments([])
      return
    }
    setDocsLoading(true)
    const supabase = createClient()
    supabase
      .from('document')
      .select('*')
      .eq('person_id', person.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDocuments((data ?? []) as Document[])
        setDocsLoading(false)
      })
  }, [person?.id])

  async function handleDownload(doc: Document) {
    setDownloadingId(doc.id)
    const result = await getSignedUrl(doc.url_stockage)
    setDownloadingId(null)
    if (result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } else if (result.error) {
      onShowToast?.(result.error, 'error')
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !person) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    startUpload(async () => {
      const form = new FormData()
      form.set('person_id', person.id)
      form.set('nom', file.name.replace(/\.pdf$/i, ''))
      form.set('type', 'AUTRE')
      form.set('file', file)
      const result = await uploadDocument(form)
      if (result.error) {
        onShowToast?.(result.error, 'error')
      } else {
        // Reload documents list
        const supabase = createClient()
        const { data } = await supabase
          .from('document')
          .select('*')
          .eq('person_id', person.id)
          .order('created_at', { ascending: false })
        setDocuments((data ?? []) as Document[])
      }
    })
  }

  async function handleDeleteDoc(doc: Document) {
    if (!confirm(`Supprimer « ${doc.nom} » ?`)) return
    const result = await deleteDocument(doc.id, doc.url_stockage)
    if (result.error) {
      onShowToast?.(result.error, 'error')
    } else {
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    }
  }

  if (!isOpen) return null

  const personBranchIds = person
    ? personBranches.filter(pb => pb.person_id === person.id).map(pb => pb.branch_id)
    : []
  const personBranchList = branches.filter(b => personBranchIds.includes(b.id))

  const personRelationships = person
    ? relationships.filter(r => r.person_a_id === person.id || r.person_b_id === person.id)
    : []

  function getOtherPerson(rel: Relationship): Person | undefined {
    if (!person) return undefined
    const otherId = rel.person_a_id === person.id ? rel.person_b_id : rel.person_a_id
    return allPersons.find(p => p.id === otherId)
  }

  return (
    <aside className="w-64 bg-[#080d16] border-l border-[#1e3a5f] flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b border-[#1e3a5f]">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Détail</span>
        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xs">
          ✕
        </button>
      </div>

      {!person ? (
        <div className="p-3">
          <p className="text-xs text-gray-600 italic">Sélectionnez une personne</p>
        </div>
      ) : (
        <div className="p-3 flex flex-col gap-4 flex-1">
          {/* Identity */}
          <div>
            <h3 className="text-white font-semibold text-sm">
              {person.prenom} {person.nom}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(person.date_naissance)}
              {person.lieu_naissance ? ` · ${person.lieu_naissance}` : ''}
            </p>
            {person.date_deces && (
              <p className="text-xs text-gray-600">
                † {formatDate(person.date_deces)}
                {person.lieu_deces ? ` · ${person.lieu_deces}` : ''}
              </p>
            )}
            {person.notes && (
              <p className="text-xs text-gray-500 mt-2 italic">{person.notes}</p>
            )}
          </div>

          {/* Branches */}
          {personBranchList.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Branches</div>
              <div className="flex flex-wrap gap-1">
                {personBranchList.map(b => (
                  <span
                    key={b.id}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${b.couleur}22`,
                      color: b.couleur,
                      border: `1px solid ${b.couleur}44`,
                    }}
                  >
                    {b.nom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Relations */}
          {personRelationships.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Relations</div>
              <div className="flex flex-col gap-1">
                {personRelationships.map(rel => {
                  const other = getOtherPerson(rel)
                  if (!other) return null
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectPerson(other.id)}
                      className="text-left text-xs text-blue-300 hover:text-blue-200 py-0.5 flex items-center gap-1"
                    >
                      <span className="text-[10px] text-gray-600 mr-1">
                        {RELATION_LABEL[rel.type] ?? rel.type}
                      </span>
                      {other.prenom} {other.nom}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">Documents</div>
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="text-[10px] text-gray-600 hover:text-gray-300 disabled:opacity-50"
                title="Ajouter un document PDF"
              >
                {isUploading ? '…' : '+ PDF'}
              </button>
            </div>
            {/* Hidden file input — PDF only */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelected}
            />
            {docsLoading ? (
              <p className="text-xs text-gray-600 animate-pulse">Chargement…</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-gray-600 italic">Aucun document</p>
            ) : (
              <div className="flex flex-col gap-1">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{doc.nom}</p>
                      <p className="text-[10px] text-gray-600">
                        {DOC_TYPE_LABEL[doc.type] ?? doc.type} ·{' '}
                        {(doc.taille_bytes / 1024).toFixed(0)} ko
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="text-[10px] text-blue-400 hover:text-blue-200 shrink-0 disabled:opacity-50"
                      title="Télécharger"
                    >
                      {downloadingId === doc.id ? '…' : '⬇'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc)}
                      className="text-[10px] text-gray-600 hover:text-red-400 shrink-0"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-2 border-t border-[#1e3a5f]">
            <button
              type="button"
              onClick={() => onEditPerson(person.id)}
              className="flex-1 text-xs py-1.5 bg-white/5 text-gray-300 hover:bg-white/10 rounded transition-colors"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={() => onDeletePerson(person.id)}
              className="flex-1 text-xs py-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/layout/DetailPanel.tsx
git commit -m "feat: wire DetailPanel with real document list and signed URL download"
```

---

### Task 8: Wire AppShell with SearchOverlay and BranchModal context

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

Replace the placeholder search backdrop in AppShell with the real `SearchOverlay` component, and wire `openAddPerson` through `TreeContext` to allow `Sidebar`'s "+ Nouvelle branche" button to trigger the branch modal independently (branch modal is owned by Sidebar itself, so no change needed in AppShell for that). The only AppShell change needed is replacing the `searchOpen` placeholder with `SearchOverlay`.

- [ ] **Step 1: Update AppShell to render SearchOverlay and pass onShowToast to DetailPanel**

In `src/components/layout/AppShell.tsx`:

**a)** Add this import at the top (with other imports):
```typescript
import { SearchOverlay } from '@/components/search/SearchOverlay'
```

**b)** Replace the placeholder search block:
```typescript
      {searchOpen && (
        // SearchOverlay is wired in Chunk 2 Task 8
        // For now render a placeholder that can be closed
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setSearchOpen(false)}
        />
      )}
```
With:
```typescript
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onSelectPerson={(id) => {
            selectPerson(id)
            setSearchOpen(false)
          }}
        />
      )}
```

**c)** Add `onShowToast={showToast}` to the `<DetailPanel>` JSX in AppShell. The DetailPanel usage looks like this — add the prop:
```typescript
          <DetailPanel
            isOpen={detailOpen}
            onClose={() => { setDetailOpen(false); setSelectedPersonId(null) }}
            person={selectedPerson}
            personBranches={initialPersonBranches}
            branches={initialBranches}
            relationships={initialRelationships}
            allPersons={initialPersons}
            onSelectPerson={selectPerson}
            onEditPerson={openEditPerson}
            onDeletePerson={async (id) => {
              const { deletePerson } = await import('@/server-actions/persons')
              const result = await deletePerson(id)
              if (result.error) {
                showToast(result.error, 'error')
              } else {
                setDetailOpen(false)
                setSelectedPersonId(null)
                router.refresh()
              }
            }}
            onShowToast={showToast}
          />
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jbbotello/Genealogy && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/layout/AppShell.tsx
git commit -m "feat: wire SearchOverlay into AppShell and pass onShowToast to DetailPanel"
```

---

### Task 9: Run full Chunk 2 test suite

- [ ] **Step 1: Run all tests**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run
```

Expected output (all pass):
```
 ✓ src/lib/geocode.test.ts (4 tests)
 ✓ src/lib/cycle-detection.test.ts (7 tests)
 ✓ src/server-actions/__tests__/persons.test.ts (7 tests)
 ✓ src/server-actions/__tests__/relationships.test.ts (7 tests)
 ✓ src/components/person/__tests__/PersonModal.test.tsx (7 tests)
 ✓ src/server-actions/__tests__/branches.test.ts (9 tests)
 ✓ src/components/branch/__tests__/BranchModal.test.tsx (6 tests)
 ✓ src/server-actions/__tests__/documents.test.ts (8 tests)
 ✓ src/server-actions/__tests__/search.test.ts (5 tests)
 ✓ src/components/search/__tests__/SearchOverlay.test.tsx (6 tests)
 ✓ src/lib/supabase/__tests__/client.test.ts (1 test)
 ✓ src/lib/supabase/__tests__/server.test.ts (1 test)
 ✓ src/server-actions/__tests__/auth.test.ts (2 tests)

Test Files  13 passed (13)
Tests       70 passed (70)
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/jbbotello/Genealogy && npx next build 2>&1 | tail -20
```

Expected: build completes with no TypeScript or module errors.

---

*End of Chunk 2*
