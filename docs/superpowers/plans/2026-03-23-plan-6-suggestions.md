# Suggestions de modifications Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux VIEWERs de proposer des modifications (personnes, relations), et aux ADMIN/EDITOR de les valider ou rejeter via un panneau dédié avec badge dans la Topbar.

**Architecture:** Une table `suggestion` (JSONB payload + status PENDING/APPROVED/REJECTED) centralise toutes les propositions. Les server actions valident le payload via Zod avant application. AppShell orchestre les modals ; TreeContext expose `pendingSuggestionsCount` pour le badge.

**Tech Stack:** Next.js 14 Server Actions, Supabase, Zod, React, Vitest + RTL.

---

## File Map

| Status | File | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/002_suggestions.sql` | Migration SQL |
| Create | `src/lib/validation/suggestions.ts` | Zod schemas + parsePayload |
| Create | `src/server-actions/suggestions.ts` | 6 server actions |
| Create | `src/server-actions/__tests__/suggestions.test.ts` | Tests |
| Create | `src/components/suggestions/SuggestionModal.tsx` | Formulaire de proposition (5 modes) |
| Create | `src/components/suggestions/__tests__/SuggestionModal.test.tsx` | |
| Create | `src/components/suggestions/SuggestionsPanel.tsx` | Panneau ADMIN/EDITOR |
| Create | `src/components/suggestions/__tests__/SuggestionsPanel.test.tsx` | |
| Create | `src/components/suggestions/MySuggestionsPanel.tsx` | Panneau VIEWER |
| Create | `src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx` | |
| Modify | `src/lib/types/database.ts` | Ajouter Suggestion types |
| Modify | `src/lib/context/tree-context.tsx` | Ajouter pendingSuggestionsCount |
| Modify | `src/app/(app)/layout.tsx` | Fetch pending suggestions |
| Modify | `src/components/layout/AppShell.tsx` | State + modals + pass-through |
| Modify | `src/components/layout/Topbar.tsx` | Badge + boutons suggestion |
| Modify | `src/components/layout/DetailPanel.tsx` | Boutons VIEWER + section ADMIN/EDITOR |

---

## Chunk 1: Foundation

### Task C6-1: Migration SQL + Types

**Files:**
- Create: `supabase/migrations/002_suggestions.sql`
- Modify: `src/lib/types/database.ts`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/002_suggestions.sql

CREATE TYPE suggestion_type AS ENUM (
  'EDIT_PERSON', 'ADD_PERSON', 'DELETE_PERSON',
  'ADD_RELATIONSHIP', 'DELETE_RELATIONSHIP'
);

CREATE TYPE suggestion_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE suggestion (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             suggestion_type NOT NULL,
  target_id        UUID,
  payload          JSONB NOT NULL DEFAULT '{}',
  status           suggestion_status NOT NULL DEFAULT 'PENDING',
  suggested_by     UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by      UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ
);

CREATE INDEX suggestion_status_idx ON suggestion(status);
CREATE INDEX suggestion_suggested_by_idx ON suggestion(suggested_by);

-- Anti-doublon pour EDIT/DELETE (target_id non null)
CREATE UNIQUE INDEX suggestion_no_duplicate_pending
  ON suggestion (suggested_by, type, target_id)
  WHERE status = 'PENDING' AND target_id IS NOT NULL;

ALTER TABLE suggestion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suggestion_insert" ON suggestion
  FOR INSERT WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "suggestion_select_own" ON suggestion
  FOR SELECT USING (auth.uid() = suggested_by);

CREATE POLICY "suggestion_select_reviewers" ON suggestion
  FOR SELECT USING (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY "suggestion_update_reviewers" ON suggestion
  FOR UPDATE USING (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY "suggestion_delete_own_pending" ON suggestion
  FOR DELETE USING (
    auth.uid() = suggested_by AND status = 'PENDING'
  );
```

- [ ] **Step 2: Add types to `src/lib/types/database.ts`**

Read the file first. Append at the end:

```typescript
export type SuggestionType =
  | 'EDIT_PERSON'
  | 'ADD_PERSON'
  | 'DELETE_PERSON'
  | 'ADD_RELATIONSHIP'
  | 'DELETE_RELATIONSHIP'

export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Suggestion {
  id: string
  type: SuggestionType
  target_id: string | null
  payload: Record<string, unknown>
  status: SuggestionStatus
  suggested_by: string
  reviewed_by: string | null
  rejection_reason: string | null
  created_at: string
  reviewed_at: string | null
}

export interface SuggestionWithProposer extends Suggestion {
  users: { email: string; display_name: string } | null
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/user/Genealogy && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd /Users/user/Genealogy && git add supabase/migrations/002_suggestions.sql src/lib/types/database.ts && git commit -m "feat(suggestions): migration SQL + Suggestion types"
```

---

### Task C6-2: Zod validation schemas

**Files:**
- Create: `src/lib/validation/suggestions.ts`

- [ ] **Step 1: Check if zod is installed**

```bash
cat /Users/user/Genealogy/package.json | grep '"zod"'
```

If not present:
```bash
cd /Users/user/Genealogy && npm install zod
```

- [ ] **Step 2: Create `src/lib/validation/suggestions.ts`**

```typescript
// src/lib/validation/suggestions.ts
import { z } from 'zod'
import type { SuggestionType } from '@/lib/types/database'

export const editPersonPayloadSchema = z.object({
  prenom: z.string().optional(),
  nom: z.string().optional(),
  date_naissance: z.string().nullable().optional(),
  lieu_naissance: z.string().nullable().optional(),
  date_deces: z.string().nullable().optional(),
  lieu_deces: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const addPersonPayloadSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  date_naissance: z.string().nullable().optional(),
  lieu_naissance: z.string().nullable().optional(),
  date_deces: z.string().nullable().optional(),
  lieu_deces: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const addRelationshipPayloadSchema = z.object({
  person_a_id: z.string().uuid(),
  person_b_id: z.string().uuid(),
  type: z.enum(['PARENT_CHILD', 'UNION', 'ADOPTION', 'SIBLING', 'HALF_SIBLING', 'STEP']),
  metadata: z.record(z.unknown()).optional(),
})

export type EditPersonPayload = z.infer<typeof editPersonPayloadSchema>
export type AddPersonPayload = z.infer<typeof addPersonPayloadSchema>
export type AddRelationshipPayload = z.infer<typeof addRelationshipPayloadSchema>

type ParseResult =
  | { ok: true; data: EditPersonPayload | AddPersonPayload | AddRelationshipPayload | Record<string, never> }
  | { ok: false; error: string }

export function parsePayload(type: SuggestionType, payload: Record<string, unknown>): ParseResult {
  try {
    switch (type) {
      case 'EDIT_PERSON':
        return { ok: true, data: editPersonPayloadSchema.parse(payload) }
      case 'ADD_PERSON':
        return { ok: true, data: addPersonPayloadSchema.parse(payload) }
      case 'ADD_RELATIONSHIP':
        return { ok: true, data: addRelationshipPayloadSchema.parse(payload) }
      case 'DELETE_PERSON':
      case 'DELETE_RELATIONSHIP':
        return { ok: true, data: {} }
    }
  } catch (e) {
    const msg = e instanceof z.ZodError ? (e.errors[0]?.message ?? 'Payload invalide.') : 'Payload invalide.'
    return { ok: false, error: msg }
  }
}
```

- [ ] **Step 3: Write tests for parsePayload**

Create `src/lib/validation/__tests__/suggestions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parsePayload } from '../suggestions'

describe('parsePayload', () => {
  it('validates EDIT_PERSON with partial fields', () => {
    const result = parsePayload('EDIT_PERSON', { prenom: 'Marie' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({ prenom: 'Marie' })
  })

  it('validates ADD_PERSON with required fields', () => {
    const result = parsePayload('ADD_PERSON', { prenom: 'Jean', nom: 'Dupont' })
    expect(result.ok).toBe(true)
  })

  it('rejects ADD_PERSON missing nom', () => {
    const result = parsePayload('ADD_PERSON', { prenom: 'Jean' })
    expect(result.ok).toBe(false)
  })

  it('validates ADD_RELATIONSHIP', () => {
    const result = parsePayload('ADD_RELATIONSHIP', {
      person_a_id: '00000000-0000-0000-0000-000000000001',
      person_b_id: '00000000-0000-0000-0000-000000000002',
      type: 'UNION',
    })
    expect(result.ok).toBe(true)
  })

  it('returns empty object for DELETE_PERSON', () => {
    const result = parsePayload('DELETE_PERSON', {})
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({})
  })

  it('returns empty object for DELETE_RELATIONSHIP', () => {
    const result = parsePayload('DELETE_RELATIONSHIP', {})
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual({})
  })

  it('rejects invalid ADD_RELATIONSHIP type', () => {
    const result = parsePayload('ADD_RELATIONSHIP', {
      person_a_id: '00000000-0000-0000-0000-000000000001',
      person_b_id: '00000000-0000-0000-0000-000000000002',
      type: 'INVALID',
    })
    expect(result.ok).toBe(false)
  })
})
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/user/Genealogy && npx vitest run src/lib/validation/__tests__/suggestions.test.ts 2>&1 | tail -10
```

Expected: 7/7 PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/user/Genealogy && git add src/lib/validation/ && git commit -m "feat(suggestions): Zod validation schemas + parsePayload"
```

---

### Task C6-3: Server actions — failing tests

**Files:**
- Create: `src/server-actions/__tests__/suggestions.test.ts`

- [ ] **Step 1: Write the failing test file**

```typescript
// src/server-actions/__tests__/suggestions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/role-guard', () => ({ getCurrentRole: vi.fn() }))
vi.mock('@/lib/geocode', () => ({ geocodeLieu: vi.fn().mockResolvedValue(null) }))
vi.mock('@/lib/validation/suggestions', () => ({
  parsePayload: vi.fn().mockReturnValue({ ok: true, data: { prenom: 'Marie' } }),
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentRole } from '@/lib/auth/role-guard'
import { parsePayload } from '@/lib/validation/suggestions'

// ── Suggestion table mocks ───────────────────────────────────────────────
const mockSuggestionSingle = vi.fn()
const mockSuggestionOrder = vi.fn()
const mockSuggestionInsert = vi.fn()
const mockSuggestionUpdateFinalEq = vi.fn()
const mockSuggestionUpdate = vi.fn(() => ({ eq: mockSuggestionUpdateFinalEq }))
const mockSuggestionDeleteFinalEq = vi.fn()
const mockSuggestionDeleteEq2 = vi.fn(() => ({ eq: mockSuggestionDeleteFinalEq }))
const mockSuggestionDeleteEq1 = vi.fn(() => ({ eq: mockSuggestionDeleteEq2 }))
const mockSuggestionDelete = vi.fn(() => ({ eq: mockSuggestionDeleteEq1 }))

// select chain: .select() → .eq(1) → .eq(2) → .eq(3) → .single()
//                                   .eq(1) → .order()
const mockSuggestionSelectEq3 = vi.fn(() => ({ single: mockSuggestionSingle }))
const mockSuggestionSelectEq2 = vi.fn(() => ({
  eq: mockSuggestionSelectEq3,
  single: mockSuggestionSingle,
}))
const mockSuggestionSelectEq1 = vi.fn(() => ({
  eq: mockSuggestionSelectEq2,
  order: mockSuggestionOrder,
  single: mockSuggestionSingle,
}))
const mockSuggestionSelect = vi.fn(() => ({ eq: mockSuggestionSelectEq1 }))

// ── Person table mocks ───────────────────────────────────────────────────
const mockPersonUpdateFinalEq = vi.fn()
const mockPersonUpdate = vi.fn(() => ({ eq: mockPersonUpdateFinalEq }))
const mockPersonInsert = vi.fn()
const mockPersonDeleteFinalEq = vi.fn()
const mockPersonDelete = vi.fn(() => ({ eq: mockPersonDeleteFinalEq }))

// ── Relationship table mocks ─────────────────────────────────────────────
const mockRelInsert = vi.fn()
const mockRelDeleteFinalEq = vi.fn()
const mockRelDelete = vi.fn(() => ({ eq: mockRelDeleteFinalEq }))

// ── Supabase client ──────────────────────────────────────────────────────
const mockFrom = vi.fn((table: string) => {
  if (table === 'suggestion') return {
    select: mockSuggestionSelect,
    insert: mockSuggestionInsert,
    update: mockSuggestionUpdate,
    delete: mockSuggestionDelete,
  }
  if (table === 'person') return {
    insert: mockPersonInsert,
    update: mockPersonUpdate,
    delete: mockPersonDelete,
  }
  if (table === 'relationship') return {
    insert: mockRelInsert,
    delete: mockRelDelete,
  }
  return {}
})

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } })
const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  vi.mocked(getCurrentRole).mockResolvedValue('ADMIN')
  mockSuggestionSingle.mockResolvedValue({ data: null, error: null })
  mockSuggestionOrder.mockResolvedValue({ data: [], error: null })
  mockSuggestionInsert.mockResolvedValue({ error: null })
  mockSuggestionUpdateFinalEq.mockResolvedValue({ error: null })
  mockSuggestionDeleteFinalEq.mockResolvedValue({ error: null })
  mockPersonUpdateFinalEq.mockResolvedValue({ error: null })
  mockPersonInsert.mockResolvedValue({ error: null })
  mockPersonDeleteFinalEq.mockResolvedValue({ error: null })
  mockRelInsert.mockResolvedValue({ error: null })
  mockRelDeleteFinalEq.mockResolvedValue({ error: null })
})

// ── createSuggestion ─────────────────────────────────────────────────────
describe('createSuggestion', () => {
  it('creates a suggestion and revalidates', async () => {
    const { createSuggestion } = await import('../suggestions')
    const result = await createSuggestion('EDIT_PERSON', { prenom: 'Marie' }, 'person-1')
    expect(result).toEqual({})
    expect(mockSuggestionInsert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'EDIT_PERSON', target_id: 'person-1', suggested_by: 'admin-1' })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { createSuggestion } = await import('../suggestions')
    const result = await createSuggestion('EDIT_PERSON', { prenom: 'Marie' }, 'p1')
    expect(result).toEqual({ error: 'Non authentifié.' })
  })

  it('returns error on DB insert failure', async () => {
    mockSuggestionInsert.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const { createSuggestion } = await import('../suggestions')
    const result = await createSuggestion('EDIT_PERSON', { prenom: 'Marie' }, 'p1')
    expect(result).toEqual({ error: 'DB error' })
  })

  it('rejects duplicate ADD_PERSON suggestion', async () => {
    mockSuggestionSingle.mockResolvedValueOnce({ data: { id: 'existing' }, error: null })
    const { createSuggestion } = await import('../suggestions')
    const result = await createSuggestion('ADD_PERSON', { prenom: 'Jean', nom: 'Dupont' })
    expect(result.error).toBeTruthy()
    expect(mockSuggestionInsert).not.toHaveBeenCalled()
  })
})

// ── getSuggestionsPending ────────────────────────────────────────────────
describe('getSuggestionsPending', () => {
  it('returns pending suggestions', async () => {
    mockSuggestionOrder.mockResolvedValueOnce({
      data: [{ id: 's1', type: 'EDIT_PERSON', status: 'PENDING', users: { email: 'a@b.com', display_name: 'Alice' } }],
      error: null,
    })
    const { getSuggestionsPending } = await import('../suggestions')
    const result = await getSuggestionsPending()
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('PENDING')
  })

  it('returns empty array on error', async () => {
    mockSuggestionOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const { getSuggestionsPending } = await import('../suggestions')
    const result = await getSuggestionsPending()
    expect(result).toEqual([])
  })
})

// ── getMySuggestions ─────────────────────────────────────────────────────
describe('getMySuggestions', () => {
  it('returns suggestions for current user', async () => {
    mockSuggestionOrder.mockResolvedValueOnce({
      data: [{ id: 's1', type: 'EDIT_PERSON', status: 'PENDING', suggested_by: 'admin-1', users: null }],
      error: null,
    })
    const { getMySuggestions } = await import('../suggestions')
    const result = await getMySuggestions()
    expect(result).toHaveLength(1)
  })

  it('returns empty array when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { getMySuggestions } = await import('../suggestions')
    const result = await getMySuggestions()
    expect(result).toEqual([])
  })
})

// ── rejectSuggestion ─────────────────────────────────────────────────────
describe('rejectSuggestion', () => {
  it('rejects a suggestion with reason', async () => {
    const { rejectSuggestion } = await import('../suggestions')
    const result = await rejectSuggestion('s1', 'Données incorrectes')
    expect(result).toEqual({})
    expect(mockSuggestionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'REJECTED',
        rejection_reason: 'Données incorrectes',
        reviewed_by: 'admin-1',
      })
    )
    // reviewed_at should be a recent ISO string
    const updateCall = mockSuggestionUpdate.mock.calls[0][0]
    expect(typeof updateCall.reviewed_at).toBe('string')
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error for non-ADMIN/EDITOR', async () => {
    vi.mocked(getCurrentRole).mockResolvedValueOnce('VIEWER')
    const { rejectSuggestion } = await import('../suggestions')
    const result = await rejectSuggestion('s1', 'raison')
    expect(result).toEqual({ error: 'Permission refusée.' })
  })
})

// ── cancelSuggestion ─────────────────────────────────────────────────────
describe('cancelSuggestion', () => {
  it('deletes own pending suggestion', async () => {
    const { cancelSuggestion } = await import('../suggestions')
    const result = await cancelSuggestion('s1')
    expect(result).toEqual({})
    expect(mockSuggestionDelete).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { cancelSuggestion } = await import('../suggestions')
    const result = await cancelSuggestion('s1')
    expect(result).toEqual({ error: 'Non authentifié.' })
  })
})

// ── approveSuggestion ────────────────────────────────────────────────────
describe('approveSuggestion', () => {
  it('approves EDIT_PERSON: updates person and marks APPROVED', async () => {
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's1', type: 'EDIT_PERSON', target_id: 'p1', payload: { prenom: 'Marie' }, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s1')
    expect(result).toEqual({})
    expect(mockPersonUpdate).toHaveBeenCalled()
    expect(mockSuggestionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'APPROVED' })
    )
  })

  it('approves ADD_PERSON: inserts person and marks APPROVED', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: true, data: { prenom: 'Jean', nom: 'Dupont' } })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's2', type: 'ADD_PERSON', target_id: null, payload: { prenom: 'Jean', nom: 'Dupont' }, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s2')
    expect(result).toEqual({})
    expect(mockPersonInsert).toHaveBeenCalled()
  })

  it('approves DELETE_PERSON: deletes person', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: true, data: {} })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's3', type: 'DELETE_PERSON', target_id: 'p1', payload: {}, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s3')
    expect(result).toEqual({})
    expect(mockPersonDelete).toHaveBeenCalled()
  })

  it('approves ADD_RELATIONSHIP', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: true, data: { person_a_id: 'p1', person_b_id: 'p2', type: 'UNION' } })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's4', type: 'ADD_RELATIONSHIP', target_id: null, payload: {}, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s4')
    expect(result).toEqual({})
    expect(mockRelInsert).toHaveBeenCalled()
  })

  it('approves DELETE_RELATIONSHIP', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: true, data: {} })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's5', type: 'DELETE_RELATIONSHIP', target_id: 'r1', payload: {}, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s5')
    expect(result).toEqual({})
    expect(mockRelDelete).toHaveBeenCalled()
  })

  it('returns error when suggestion not found', async () => {
    mockSuggestionSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('missing')
    expect(result.error).toBeTruthy()
    expect(mockPersonUpdate).not.toHaveBeenCalled()
  })

  it('returns error when payload invalid', async () => {
    vi.mocked(parsePayload).mockReturnValueOnce({ ok: false, error: 'Payload invalide.' })
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's1', type: 'EDIT_PERSON', target_id: 'p1', payload: {}, status: 'PENDING' },
      error: null,
    })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s1')
    expect(result).toEqual({ error: 'Payload invalide.' })
  })

  it('returns error for non-ADMIN/EDITOR', async () => {
    vi.mocked(getCurrentRole).mockResolvedValueOnce('VIEWER')
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s1')
    expect(result).toEqual({ error: 'Permission refusée.' })
  })

  it('returns error when suggestion is already APPROVED (not PENDING)', async () => {
    // The .eq('status', 'PENDING') filter means already-approved returns not found
    mockSuggestionSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('already-approved')
    expect(result.error).toBeTruthy()
    expect(mockPersonUpdate).not.toHaveBeenCalled()
  })

  it('returns error when business action fails, leaves suggestion PENDING', async () => {
    mockSuggestionSingle.mockResolvedValueOnce({
      data: { id: 's1', type: 'EDIT_PERSON', target_id: 'p1', payload: { prenom: 'Marie' }, status: 'PENDING' },
      error: null,
    })
    mockPersonUpdateFinalEq.mockResolvedValueOnce({ error: { message: 'Person not found' } })
    const { approveSuggestion } = await import('../suggestions')
    const result = await approveSuggestion('s1')
    expect(result).toEqual({ error: 'Person not found' })
    // Suggestion NOT marked APPROVED
    expect(mockSuggestionUpdate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/user/Genealogy && npx vitest run src/server-actions/__tests__/suggestions.test.ts 2>&1 | tail -10
```

Expected: FAIL — `../suggestions` module not found.

- [ ] **Step 3: Commit failing tests**

```bash
cd /Users/user/Genealogy && git add src/server-actions/__tests__/suggestions.test.ts && git commit -m "test(suggestions): failing tests for all server actions"
```

---

### Task C6-4: Server actions — implementation

**Files:**
- Create: `src/server-actions/suggestions.ts`

- [ ] **Step 1: Create `src/server-actions/suggestions.ts`**

```typescript
// src/server-actions/suggestions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentRole } from '@/lib/auth/role-guard'
import { parsePayload } from '@/lib/validation/suggestions'
import type { EditPersonPayload, AddPersonPayload, AddRelationshipPayload } from '@/lib/validation/suggestions'
import { geocodeLieu } from '@/lib/geocode'
import type { SuggestionType, SuggestionWithProposer } from '@/lib/types/database'

export async function createSuggestion(
  type: SuggestionType,
  payload: Record<string, unknown>,
  targetId?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Application-level anti-doublon pour ADD_PERSON (target_id null, pas de contrainte DB)
  if (type === 'ADD_PERSON') {
    const { data: existing } = await supabase
      .from('suggestion')
      .select('id')
      .eq('suggested_by', user.id)
      .eq('type', 'ADD_PERSON')
      .eq('status', 'PENDING')
      .single()
    if (existing) return { error: 'Vous avez déjà une proposition identique en attente.' }
  }

  const { error } = await supabase.from('suggestion').insert({
    type,
    payload,
    target_id: targetId ?? null,
    suggested_by: user.id,
  })
  if (error) return { error: error.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function getSuggestionsPending(): Promise<SuggestionWithProposer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suggestion')
    .select('*, users(email, display_name)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data as SuggestionWithProposer[]
}

export async function getMySuggestions(): Promise<SuggestionWithProposer[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('suggestion')
    .select('*, users(email, display_name)')
    .eq('suggested_by', user.id)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as SuggestionWithProposer[]
}

export async function rejectSuggestion(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const role = await getCurrentRole(supabase, user.id)
  if (!['ADMIN', 'EDITOR'].includes(role)) return { error: 'Permission refusée.' }

  const { error } = await supabase
    .from('suggestion')
    .update({
      status: 'REJECTED',
      rejection_reason: reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function cancelSuggestion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('suggestion')
    .delete()
    .eq('id', id)
    .eq('suggested_by', user.id)
    .eq('status', 'PENDING')
  if (error) return { error: error.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function approveSuggestion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const role = await getCurrentRole(supabase, user.id)
  if (!['ADMIN', 'EDITOR'].includes(role)) return { error: 'Permission refusée.' }

  const { data: suggestion, error: loadError } = await supabase
    .from('suggestion')
    .select('*')
    .eq('id', id)
    .eq('status', 'PENDING')
    .single()
  if (loadError || !suggestion) return { error: 'Suggestion introuvable ou déjà traitée.' }

  const parsed = parsePayload(suggestion.type as SuggestionType, suggestion.payload)
  if (!parsed.ok) return { error: parsed.error }

  let applyError: string | undefined

  switch (suggestion.type as SuggestionType) {
    case 'EDIT_PERSON': {
      const data = parsed.data as EditPersonPayload
      const updates: Record<string, unknown> = { ...data }
      if ('lieu_naissance' in data) {
        const geo = data.lieu_naissance ? await geocodeLieu(data.lieu_naissance) : null
        updates.lat_naissance = geo?.lat ?? null
        updates.lon_naissance = geo?.lon ?? null
      }
      if ('lieu_deces' in data) {
        const geo = data.lieu_deces ? await geocodeLieu(data.lieu_deces) : null
        updates.lat_deces = geo?.lat ?? null
        updates.lon_deces = geo?.lon ?? null
      }
      const { error } = await supabase.from('person').update(updates).eq('id', suggestion.target_id)
      applyError = error?.message
      break
    }
    case 'ADD_PERSON': {
      const data = parsed.data as AddPersonPayload
      const [geoN, geoD] = await Promise.all([
        data.lieu_naissance ? geocodeLieu(data.lieu_naissance) : null,
        data.lieu_deces ? geocodeLieu(data.lieu_deces) : null,
      ])
      const { error } = await supabase.from('person').insert({
        ...data,
        lat_naissance: geoN?.lat ?? null,
        lon_naissance: geoN?.lon ?? null,
        lat_deces: geoD?.lat ?? null,
        lon_deces: geoD?.lon ?? null,
      })
      applyError = error?.message
      break
    }
    case 'DELETE_PERSON': {
      const { error } = await supabase.from('person').delete().eq('id', suggestion.target_id)
      applyError = error?.message
      break
    }
    case 'ADD_RELATIONSHIP': {
      const data = parsed.data as AddRelationshipPayload
      const { error } = await supabase.from('relationship').insert({
        person_a_id: data.person_a_id,
        person_b_id: data.person_b_id,
        type: data.type,
        metadata: data.metadata ?? {},
      })
      applyError = error?.message
      break
    }
    case 'DELETE_RELATIONSHIP': {
      const { error } = await supabase.from('relationship').delete().eq('id', suggestion.target_id)
      applyError = error?.message
      break
    }
  }

  if (applyError) return { error: applyError }

  const { error: updateError } = await supabase
    .from('suggestion')
    .update({ status: 'APPROVED', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (updateError) return { error: updateError.message }

  revalidatePath('/tree', 'layout')
  return {}
}
```

**Design note — why `approveSuggestion` calls Supabase directly:**
The existing write actions (`updatePerson`, `createPerson`, etc.) accept `FormData` and are tightly coupled to form state. Calling them from `approveSuggestion` would require constructing fake `FormData` objects, which is fragile and error-prone. Instead, `approveSuggestion` calls Supabase directly with the validated payload. This is an intentional deviation from the "always go through server actions" pattern — documented here so reviewers don't flag it as a missed call.

**Design note — cycle detection for ADD_RELATIONSHIP:**
Cycle detection (preventing circular parent-child chains) is currently implemented inside `branches.ts`. `approveSuggestion` bypasses that check when applying an ADD_RELATIONSHIP approval. This is acceptable for V1: the ADMIN/EDITOR reviewing the suggestion is expected to verify validity. A future iteration can extract cycle detection into a shared utility and call it here.

- [ ] **Step 2: Run tests**

```bash
cd /Users/user/Genealogy && npx vitest run src/server-actions/__tests__/suggestions.test.ts 2>&1 | tail -20
```

Expected: all tests PASS. Fix any failures by adjusting mock chains to match the actual implementation call sequence.

- [ ] **Step 3: Run full suite**

```bash
cd /Users/user/Genealogy && npx vitest run 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd /Users/user/Genealogy && git add src/server-actions/suggestions.ts src/lib/types/database.ts && git commit -m "feat(suggestions): server actions (create, get, approve, reject, cancel)"
```

---

## Chunk 2: UI + Wiring

### Task C6-5: SuggestionModal

**Files:**
- Create: `src/components/suggestions/__tests__/SuggestionModal.test.tsx`
- Create: `src/components/suggestions/SuggestionModal.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/suggestions/__tests__/SuggestionModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/server-actions/suggestions', () => ({ createSuggestion: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { createSuggestion } from '@/server-actions/suggestions'
import { SuggestionModal } from '../SuggestionModal'
import type { Person, Relationship } from '@/lib/types/database'

const mockPerson: Person = {
  id: 'p1', prenom: 'Jean', nom: 'Dupont',
  date_naissance: null, lieu_naissance: null, lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null, lat_deces: null, lon_deces: null,
  notes: null, created_at: '', updated_at: '',
}

const mockRel: Relationship = {
  id: 'r1', person_a_id: 'p1', person_b_id: 'p2', type: 'UNION', metadata: {},
}

beforeEach(() => { vi.clearAllMocks() })

describe('SuggestionModal — EDIT_PERSON', () => {
  it('renders with pre-filled fields', () => {
    render(<SuggestionModal mode={{ type: 'EDIT_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Jean')).toBeTruthy()
    expect(screen.getByDisplayValue('Dupont')).toBeTruthy()
  })

  it('calls createSuggestion with only modified fields', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(<SuggestionModal mode={{ type: 'EDIT_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('Jean'), { target: { value: 'Marie' } })
    fireEvent.click(screen.getByRole('button', { name: /proposer/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith(
        'EDIT_PERSON',
        expect.objectContaining({ prenom: 'Marie' }),
        'p1'
      )
    })
  })

  it('closes on cancel', () => {
    const onClose = vi.fn()
    render(<SuggestionModal mode={{ type: 'EDIT_PERSON', person: mockPerson }} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('SuggestionModal — ADD_PERSON', () => {
  it('renders empty form', () => {
    render(<SuggestionModal mode={{ type: 'ADD_PERSON' }} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText(/prénom/i)).toBeTruthy()
  })

  it('calls createSuggestion with full payload', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(<SuggestionModal mode={{ type: 'ADD_PERSON' }} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/prénom/i), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText(/nom/i), { target: { value: 'Martin' } })
    fireEvent.click(screen.getByRole('button', { name: /proposer/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith(
        'ADD_PERSON',
        expect.objectContaining({ prenom: 'Alice', nom: 'Martin' }),
        undefined
      )
    })
  })
})

describe('SuggestionModal — DELETE_PERSON', () => {
  it('renders confirmation message', () => {
    render(<SuggestionModal mode={{ type: 'DELETE_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    expect(screen.getByText(/Jean Dupont/i)).toBeTruthy()
  })

  it('calls createSuggestion with DELETE_PERSON', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(<SuggestionModal mode={{ type: 'DELETE_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /proposer la suppression/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith('DELETE_PERSON', {}, 'p1')
    })
  })
})

describe('SuggestionModal — DELETE_RELATIONSHIP', () => {
  it('renders confirmation', () => {
    render(
      <SuggestionModal
        mode={{ type: 'DELETE_RELATIONSHIP', relationship: mockRel, persons: [mockPerson] }}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(/supprimer cette relation/i)).toBeTruthy()
  })

  it('calls createSuggestion with DELETE_RELATIONSHIP', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({})
    render(
      <SuggestionModal
        mode={{ type: 'DELETE_RELATIONSHIP', relationship: mockRel, persons: [mockPerson] }}
        onClose={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /proposer la suppression/i }))
    await waitFor(() => {
      expect(createSuggestion).toHaveBeenCalledWith('DELETE_RELATIONSHIP', {}, 'r1')
    })
  })
})

describe('SuggestionModal — error handling', () => {
  it('shows error when createSuggestion fails', async () => {
    vi.mocked(createSuggestion).mockResolvedValue({ error: 'Doublon détecté' })
    render(<SuggestionModal mode={{ type: 'DELETE_PERSON', person: mockPerson }} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /proposer la suppression/i }))
    await waitFor(() => {
      expect(screen.getByText('Doublon détecté')).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/suggestions/__tests__/SuggestionModal.test.tsx 2>&1 | tail -5
```

- [ ] **Step 3: Implement SuggestionModal**

```typescript
// src/components/suggestions/SuggestionModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSuggestion } from '@/server-actions/suggestions'
import type { Person, Relationship } from '@/lib/types/database'

export type SuggestionModalMode =
  | { type: 'EDIT_PERSON'; person: Person }
  | { type: 'ADD_PERSON' }
  | { type: 'DELETE_PERSON'; person: Person }
  | { type: 'ADD_RELATIONSHIP'; persons: Person[] }
  | { type: 'DELETE_RELATIONSHIP'; relationship: Relationship; persons: Person[] }

interface SuggestionModalProps {
  mode: SuggestionModalMode
  onClose: () => void
}

export function SuggestionModal({ mode, onClose }: SuggestionModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // State for EDIT_PERSON and ADD_PERSON forms
  const initial = mode.type === 'EDIT_PERSON' ? mode.person : null
  const [prenom, setPrenom] = useState(initial?.prenom ?? '')
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [dateNaissance, setDateNaissance] = useState(initial?.date_naissance ?? '')
  const [lieuNaissance, setLieuNaissance] = useState(initial?.lieu_naissance ?? '')
  const [dateDeces, setDateDeces] = useState(initial?.date_deces ?? '')
  const [lieuDeces, setLieuDeces] = useState(initial?.lieu_deces ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  // State for ADD_RELATIONSHIP form
  const [relPersonAId, setRelPersonAId] = useState('')
  const [relPersonBId, setRelPersonBId] = useState('')
  const [relType, setRelType] = useState('UNION')

  function handleSubmitPerson(targetId?: string) {
    setError(null)
    let payload: Record<string, unknown>

    if (mode.type === 'EDIT_PERSON') {
      // Only include changed fields
      const p = mode.person
      payload = {}
      if (prenom !== p.prenom) payload.prenom = prenom
      if (nom !== p.nom) payload.nom = nom
      if (dateNaissance !== (p.date_naissance ?? '')) payload.date_naissance = dateNaissance || null
      if (lieuNaissance !== (p.lieu_naissance ?? '')) payload.lieu_naissance = lieuNaissance || null
      if (dateDeces !== (p.date_deces ?? '')) payload.date_deces = dateDeces || null
      if (lieuDeces !== (p.lieu_deces ?? '')) payload.lieu_deces = lieuDeces || null
      if (notes !== (p.notes ?? '')) payload.notes = notes || null
    } else {
      payload = {
        prenom,
        nom,
        date_naissance: dateNaissance || null,
        lieu_naissance: lieuNaissance || null,
        date_deces: dateDeces || null,
        lieu_deces: lieuDeces || null,
        notes: notes || null,
      }
    }

    startTransition(async () => {
      const result = await createSuggestion(
        mode.type === 'EDIT_PERSON' ? 'EDIT_PERSON' : 'ADD_PERSON',
        payload,
        targetId
      )
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  function handleDelete(type: 'DELETE_PERSON' | 'DELETE_RELATIONSHIP', targetId: string) {
    setError(null)
    startTransition(async () => {
      const result = await createSuggestion(type, {}, targetId)
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  function handleAddRelationship() {
    setError(null)
    startTransition(async () => {
      const result = await createSuggestion('ADD_RELATIONSHIP', {
        person_a_id: relPersonAId,
        person_b_id: relPersonBId,
        type: relType,
      })
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080d16] border border-[#1e3a5f] rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">
            {mode.type === 'EDIT_PERSON' && 'Proposer une modification'}
            {mode.type === 'ADD_PERSON' && 'Proposer une nouvelle personne'}
            {mode.type === 'DELETE_PERSON' && 'Proposer la suppression'}
            {mode.type === 'ADD_RELATIONSHIP' && 'Proposer une relation'}
            {mode.type === 'DELETE_RELATIONSHIP' && 'Proposer la suppression de la relation'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Annuler" className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {(mode.type === 'EDIT_PERSON' || mode.type === 'ADD_PERSON') && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                placeholder="Prénom"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600"
              />
              <input
                placeholder="Nom"
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <input type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5" />
              <input placeholder="Lieu naissance" value={lieuNaissance} onChange={e => setLieuNaissance(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600" />
            </div>
            <div className="flex gap-2">
              <input type="date" value={dateDeces} onChange={e => setDateDeces(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5" />
              <input placeholder="Lieu décès" value={lieuDeces} onChange={e => setLieuDeces(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600" />
            </div>
            <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600 resize-none" />
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Annuler</button>
              <button type="button" disabled={isPending}
                onClick={() => handleSubmitPerson(mode.type === 'EDIT_PERSON' ? mode.person.id : undefined)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                Proposer
              </button>
            </div>
          </div>
        )}

        {mode.type === 'DELETE_PERSON' && (
          <div>
            <p className="text-xs text-gray-400 mb-4">
              Proposer la suppression de <strong className="text-white">{mode.person.prenom} {mode.person.nom}</strong> ?
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Annuler</button>
              <button type="button" disabled={isPending} onClick={() => handleDelete('DELETE_PERSON', mode.person.id)}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                Proposer la suppression
              </button>
            </div>
          </div>
        )}

        {mode.type === 'DELETE_RELATIONSHIP' && (
          <div>
            <p className="text-xs text-gray-400 mb-4">Supprimer cette relation ?</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Annuler</button>
              <button type="button" disabled={isPending} onClick={() => handleDelete('DELETE_RELATIONSHIP', mode.relationship.id)}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                Proposer la suppression
              </button>
            </div>
          </div>
        )}

        {mode.type === 'ADD_RELATIONSHIP' && (
          <div className="space-y-2">
            <select value={relPersonAId} onChange={e => setRelPersonAId(e.target.value)}
              className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5">
              <option value="">Parent / Personne A</option>
              {mode.persons.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>
            <select value={relPersonBId} onChange={e => setRelPersonBId(e.target.value)}
              className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5">
              <option value="">Enfant / Personne B</option>
              {mode.persons.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>
            <select value={relType} onChange={e => setRelType(e.target.value)}
              className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5">
              {['PARENT_CHILD', 'UNION', 'ADOPTION', 'SIBLING', 'HALF_SIBLING', 'STEP'].map(t =>
                <option key={t} value={t}>{t}</option>
              )}
            </select>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Annuler</button>
              <button type="button" disabled={isPending} onClick={handleAddRelationship}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                Proposer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/suggestions/__tests__/SuggestionModal.test.tsx 2>&1 | tail -15
```

Expected: all PASS. Fix any failures.

- [ ] **Step 5: Commit**

```bash
cd /Users/user/Genealogy && git add src/components/suggestions/ && git commit -m "feat(suggestions): SuggestionModal (5 modes)"
```

---

### Task C6-6: SuggestionsPanel

**Files:**
- Create: `src/components/suggestions/__tests__/SuggestionsPanel.test.tsx`
- Create: `src/components/suggestions/SuggestionsPanel.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/suggestions/__tests__/SuggestionsPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/server-actions/suggestions', () => ({
  approveSuggestion: vi.fn(),
  rejectSuggestion: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { approveSuggestion, rejectSuggestion } from '@/server-actions/suggestions'
import { SuggestionsPanel } from '../SuggestionsPanel'
import type { SuggestionWithProposer } from '@/lib/types/database'

const mockSuggestion: SuggestionWithProposer = {
  id: 's1',
  type: 'EDIT_PERSON',
  target_id: 'p1',
  payload: { prenom: 'Marie' },
  status: 'PENDING',
  suggested_by: 'u1',
  reviewed_by: null,
  rejection_reason: null,
  created_at: '2026-03-23T10:00:00Z',
  reviewed_at: null,
  users: { email: 'alice@example.com', display_name: 'alice' },
}

beforeEach(() => { vi.clearAllMocks() })

describe('SuggestionsPanel', () => {
  it('renders title and suggestion list', () => {
    render(<SuggestionsPanel suggestions={[mockSuggestion]} onClose={vi.fn()} />)
    expect(screen.getByText(/suggestions en attente/i)).toBeTruthy()
    expect(screen.getByText('alice@example.com')).toBeTruthy()
  })

  it('shows empty state when no suggestions', () => {
    render(<SuggestionsPanel suggestions={[]} onClose={vi.fn()} />)
    expect(screen.getByText(/aucune suggestion/i)).toBeTruthy()
  })

  it('calls approveSuggestion on click', async () => {
    vi.mocked(approveSuggestion).mockResolvedValue({})
    render(<SuggestionsPanel suggestions={[mockSuggestion]} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /approuver/i }))
    await waitFor(() => expect(approveSuggestion).toHaveBeenCalledWith('s1'))
  })

  it('shows rejection form and calls rejectSuggestion', async () => {
    vi.mocked(rejectSuggestion).mockResolvedValue({})
    render(<SuggestionsPanel suggestions={[mockSuggestion]} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /rejeter/i }))
    const textarea = screen.getByPlaceholderText(/raison/i)
    fireEvent.change(textarea, { target: { value: 'Données incorrectes' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmer le rejet/i }))
    await waitFor(() => expect(rejectSuggestion).toHaveBeenCalledWith('s1', 'Données incorrectes'))
  })

  it('calls onClose on close button', () => {
    const onClose = vi.fn()
    render(<SuggestionsPanel suggestions={[]} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/suggestions/__tests__/SuggestionsPanel.test.tsx 2>&1 | tail -5
```

- [ ] **Step 3: Implement SuggestionsPanel**

```typescript
// src/components/suggestions/SuggestionsPanel.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveSuggestion, rejectSuggestion } from '@/server-actions/suggestions'
import type { SuggestionWithProposer } from '@/lib/types/database'

interface SuggestionsPanelProps {
  suggestions: SuggestionWithProposer[]
  onClose: () => void
}

const TYPE_LABEL: Record<string, string> = {
  EDIT_PERSON: 'Modifier une personne',
  ADD_PERSON: 'Ajouter une personne',
  DELETE_PERSON: 'Supprimer une personne',
  ADD_RELATIONSHIP: 'Ajouter une relation',
  DELETE_RELATIONSHIP: 'Supprimer une relation',
}

function SuggestionDiff({ suggestion }: { suggestion: SuggestionWithProposer }) {
  if (suggestion.type === 'EDIT_PERSON') {
    const fields = Object.entries(suggestion.payload).map(([k, v]) => (
      <span key={k} className="text-xs text-blue-400">{k}: <span className="text-white">{String(v ?? '—')}</span> </span>
    ))
    return <div className="flex flex-wrap gap-1 mt-1">{fields}</div>
  }
  if (suggestion.type === 'ADD_PERSON') {
    const p = suggestion.payload as any
    return <span className="text-xs text-green-400">{p.prenom} {p.nom}</span>
  }
  if (suggestion.type === 'ADD_RELATIONSHIP') {
    const r = suggestion.payload as any
    return <span className="text-xs text-yellow-400">{r.type}</span>
  }
  return <span className="text-xs text-red-400">Suppression</span>
}

export function SuggestionsPanel({ suggestions, onClose }: SuggestionsPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleApprove(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await approveSuggestion(id)
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function handleRejectConfirm(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await rejectSuggestion(id, rejectReason)
      if (result.error) { setError(result.error); return }
      setRejectingId(null)
      setRejectReason('')
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080d16] border border-[#1e3a5f] rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">Suggestions en attente ({suggestions.length})</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

        <div className="flex-1 overflow-y-auto space-y-3">
          {suggestions.length === 0 && (
            <p className="text-xs text-gray-600 italic">Aucune suggestion en attente.</p>
          )}
          {suggestions.map(s => (
            <div key={s.id} className="border border-[#1e3a5f]/40 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">
                    <span className="text-white">{TYPE_LABEL[s.type]}</span>
                    {' · '}
                    <span>{s.users?.email ?? s.suggested_by}</span>
                    {' · '}
                    <span>{new Date(s.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <SuggestionDiff suggestion={s} />
                </div>
                <div className="flex gap-1 shrink-0">
                  {rejectingId === s.id ? null : (
                    <>
                      <button type="button" disabled={isPending}
                        onClick={() => handleApprove(s.id)}
                        className="px-2 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded text-xs hover:bg-green-600/30 disabled:opacity-50">
                        Approuver
                      </button>
                      <button type="button" disabled={isPending}
                        onClick={() => { setRejectingId(s.id); setRejectReason('') }}
                        className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded text-xs hover:bg-red-600/30 disabled:opacity-50">
                        Rejeter
                      </button>
                    </>
                  )}
                </div>
              </div>
              {rejectingId === s.id && (
                <div className="mt-2 space-y-2">
                  <textarea
                    placeholder="Raison du refus…"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setRejectingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-300">Annuler</button>
                    <button type="button" disabled={isPending}
                      onClick={() => handleRejectConfirm(s.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                      Confirmer le rejet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/suggestions/__tests__/SuggestionsPanel.test.tsx 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
cd /Users/user/Genealogy && git add src/components/suggestions/SuggestionsPanel.tsx src/components/suggestions/__tests__/SuggestionsPanel.test.tsx && git commit -m "feat(suggestions): SuggestionsPanel for ADMIN/EDITOR"
```

---

### Task C6-7: MySuggestionsPanel

**Files:**
- Create: `src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx`
- Create: `src/components/suggestions/MySuggestionsPanel.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/server-actions/suggestions', () => ({
  getMySuggestions: vi.fn(),
  cancelSuggestion: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { getMySuggestions, cancelSuggestion } from '@/server-actions/suggestions'
import { MySuggestionsPanel } from '../MySuggestionsPanel'
import type { SuggestionWithProposer } from '@/lib/types/database'

const mockPending: SuggestionWithProposer = {
  id: 's1', type: 'EDIT_PERSON', target_id: 'p1',
  payload: { prenom: 'Marie' }, status: 'PENDING',
  suggested_by: 'u1', reviewed_by: null, rejection_reason: null,
  created_at: '2026-03-23T10:00:00Z', reviewed_at: null, users: null,
}

const mockRejected: SuggestionWithProposer = {
  ...mockPending, id: 's2', status: 'REJECTED', rejection_reason: 'Données incorrectes',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getMySuggestions).mockResolvedValue([mockPending, mockRejected])
})

describe('MySuggestionsPanel', () => {
  it('loads and displays suggestions', async () => {
    render(<MySuggestionsPanel onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('PENDING')).toBeTruthy())
    expect(screen.getByText('REJECTED')).toBeTruthy()
  })

  it('shows rejection reason for REJECTED suggestions', async () => {
    render(<MySuggestionsPanel onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Données incorrectes')).toBeTruthy())
  })

  it('shows cancel button for PENDING suggestions', async () => {
    render(<MySuggestionsPanel onClose={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('button', { name: /annuler/i })).toBeTruthy())
  })

  it('calls cancelSuggestion on cancel click', async () => {
    vi.mocked(cancelSuggestion).mockResolvedValue({})
    render(<MySuggestionsPanel onClose={vi.fn()} />)
    await waitFor(() => screen.getByRole('button', { name: /annuler/i }))
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    await waitFor(() => expect(cancelSuggestion).toHaveBeenCalledWith('s1'))
  })

  it('calls onClose on close button', async () => {
    const onClose = vi.fn()
    render(<MySuggestionsPanel onClose={onClose} />)
    await waitFor(() => screen.getByRole('button', { name: /fermer/i }))
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx 2>&1 | tail -5
```

**Design note — why MySuggestionsPanel self-fetches:**
`SuggestionsPanel` (for ADMIN/EDITOR) receives its data as a prop (server-fetched in layout.tsx) because the data is needed for the badge count on every page load. `MySuggestionsPanel` (for VIEWER) self-fetches client-side because the VIEWER's own suggestions are only needed when they open the panel — not on every load. This asymmetry is intentional and not a mistake.

- [ ] **Step 3: Implement MySuggestionsPanel**

```typescript
// src/components/suggestions/MySuggestionsPanel.tsx
'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getMySuggestions, cancelSuggestion } from '@/server-actions/suggestions'
import type { SuggestionWithProposer } from '@/lib/types/database'

interface MySuggestionsPanelProps {
  onClose: () => void
}

const TYPE_LABEL: Record<string, string> = {
  EDIT_PERSON: 'Modifier une personne',
  ADD_PERSON: 'Ajouter une personne',
  DELETE_PERSON: 'Supprimer une personne',
  ADD_RELATIONSHIP: 'Ajouter une relation',
  DELETE_RELATIONSHIP: 'Supprimer une relation',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-yellow-400',
  APPROVED: 'text-green-400',
  REJECTED: 'text-red-400',
}

export function MySuggestionsPanel({ onClose }: MySuggestionsPanelProps) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<SuggestionWithProposer[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getMySuggestions().then(data => {
      setSuggestions(data)
      setLoading(false)
    })
  }, [])

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelSuggestion(id)
      setSuggestions(prev => prev.filter(s => s.id !== id))
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080d16] border border-[#1e3a5f] rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">Mes propositions</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading && <p className="text-xs text-gray-600 italic">Chargement…</p>}
          {!loading && suggestions.length === 0 && (
            <p className="text-xs text-gray-600 italic">Aucune proposition pour l'instant.</p>
          )}
          {suggestions.map(s => (
            <div key={s.id} className="border border-[#1e3a5f]/40 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-white">{TYPE_LABEL[s.type]}</div>
                  <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString('fr-FR')}</div>
                  <div className={`text-xs font-medium mt-1 ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </div>
                  {s.status === 'REJECTED' && s.rejection_reason && (
                    <div className="text-xs text-gray-400 mt-1 italic">"{s.rejection_reason}"</div>
                  )}
                </div>
                {s.status === 'PENDING' && (
                  <button type="button" disabled={isPending}
                    onClick={() => handleCancel(s.id)}
                    className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50">
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/user/Genealogy && npx vitest run src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
cd /Users/user/Genealogy && git add src/components/suggestions/MySuggestionsPanel.tsx src/components/suggestions/__tests__/MySuggestionsPanel.test.tsx && git commit -m "feat(suggestions): MySuggestionsPanel for VIEWER"
```

---

### Task C6-8: Wire everything

**Files:**
- Modify: `src/lib/context/tree-context.tsx`
- Modify: `src/lib/types/database.ts`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/components/layout/DetailPanel.tsx`

Read all files before modifying them.

- [ ] **Step 1: Add `pendingSuggestionsCount` to TreeContext**

In `src/lib/context/tree-context.tsx`, add to `TreeContextValue`:

```typescript
pendingSuggestionsCount: number
```

- [ ] **Step 2: Fetch pending suggestions in layout.tsx**

Read `src/app/(app)/layout.tsx`. Import `getSuggestionsPending` at the top:

```typescript
import { getSuggestionsPending } from '@/server-actions/suggestions'
import type { SuggestionWithProposer } from '@/lib/types/database'
```

Add to the Promise.all (alongside the existing queries):

```typescript
getSuggestionsPending(),
```

Destructure as `pendingSuggestionsData`. Pass to AppShell:
```tsx
initialPendingSuggestions={pendingSuggestionsData as SuggestionWithProposer[]}
```

Note: Using `getSuggestionsPending()` instead of a raw Supabase query keeps the query logic in one place (the server action).

- [ ] **Step 3: Update AppShell**

Read `src/components/layout/AppShell.tsx`. Add:

```typescript
import type { SuggestionWithProposer } from '@/lib/types/database'
import { SuggestionModal, type SuggestionModalMode } from '@/components/suggestions/SuggestionModal'
import { SuggestionsPanel } from '@/components/suggestions/SuggestionsPanel'
import { MySuggestionsPanel } from '@/components/suggestions/MySuggestionsPanel'
```

Add to `AppShellProps`:
```typescript
initialPendingSuggestions: SuggestionWithProposer[]
```

Add state:
```typescript
const [pendingSuggestions, setPendingSuggestions] = useState<SuggestionWithProposer[]>(initialPendingSuggestions)
const [suggestionsOpen, setSuggestionsOpen] = useState(false)
const [mySuggestionsOpen, setMySuggestionsOpen] = useState(false)
const [suggestionModalMode, setSuggestionModalMode] = useState<SuggestionModalMode | null>(null)

useEffect(() => {
  setPendingSuggestions(initialPendingSuggestions)
}, [initialPendingSuggestions])
```

Pass to TreeContext.Provider value:
```typescript
pendingSuggestionsCount: pendingSuggestions.length,
```

Update Topbar:
```tsx
<Topbar
  userEmail={userEmail}
  activeView={activeView}
  onViewChange={setActiveView}
  onAddPerson={currentRole !== 'VIEWER' ? openAddPerson : undefined}
  onProposePerson={currentRole === 'VIEWER' ? () => setSuggestionModalMode({ type: 'ADD_PERSON' }) : undefined}
  onSearchOpen={() => setSearchOpen(true)}
  pendingSuggestionsCount={currentRole !== 'VIEWER' ? pendingSuggestions.length : 0}
  onSuggestionsOpen={currentRole !== 'VIEWER' ? () => setSuggestionsOpen(true) : undefined}
  onMySuggestionsOpen={() => setMySuggestionsOpen(true)}
/>
```

Pass to DetailPanel:
```tsx
onProposeSuggestion={(mode) => setSuggestionModalMode(mode)}
pendingSuggestions={pendingSuggestions.filter(s => s.target_id === selectedPersonId)}
```

Add modals rendering after MembersModal:
```tsx
{suggestionsOpen && (
  <SuggestionsPanel
    suggestions={pendingSuggestions}
    onClose={() => setSuggestionsOpen(false)}
  />
)}
{mySuggestionsOpen && (
  <MySuggestionsPanel onClose={() => setMySuggestionsOpen(false)} />
)}
{suggestionModalMode !== null && (
  <SuggestionModal
    mode={suggestionModalMode}
    onClose={() => setSuggestionModalMode(null)}
  />
)}
```

- [ ] **Step 4: Update Topbar**

Read `src/components/layout/Topbar.tsx`. Add props:

```typescript
pendingSuggestionsCount?: number
onSuggestionsOpen?: () => void
onMySuggestionsOpen?: () => void
onProposePerson?: () => void
```

Add buttons in the header, between the search icon and the signout button:

```tsx
{/* Bouton "+ Ajouter" ou "Proposer une personne" */}
{onAddPerson && (
  <button type="button" onClick={onAddPerson}
    className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors">
    + Ajouter
  </button>
)}
{onProposePerson && (
  <button type="button" onClick={onProposePerson}
    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs hover:bg-blue-500/30 transition-colors">
    + Proposer
  </button>
)}

{/* Badge suggestions pour ADMIN/EDITOR */}
{onSuggestionsOpen && (
  <button type="button" onClick={onSuggestionsOpen}
    className="relative text-gray-500 hover:text-gray-300 text-sm"
    aria-label="Suggestions en attente">
    💡
    {(pendingSuggestionsCount ?? 0) > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
        {pendingSuggestionsCount}
      </span>
    )}
  </button>
)}

{/* Mes propositions */}
{onMySuggestionsOpen && (
  <button type="button" onClick={onMySuggestionsOpen}
    className="text-gray-500 hover:text-gray-300 text-xs"
    aria-label="Mes propositions">
    📋
  </button>
)}
```

- [ ] **Step 5: Update DetailPanel**

Read `src/components/layout/DetailPanel.tsx`. Add imports:

```typescript
import type { SuggestionWithProposer } from '@/lib/types/database'
import type { SuggestionModalMode } from '@/components/suggestions/SuggestionModal'
```

Add props:

```typescript
onProposeSuggestion?: (mode: SuggestionModalMode) => void
pendingSuggestions?: SuggestionWithProposer[]
```

Read the file to check how DetailPanel receives the full persons list (look for a `persons` prop or `useTree()` call). It likely already receives all persons via TreeContext or a prop. Use that same variable below — call it `persons` if it's a prop, or `treeData.persons` if from context.

For VIEWER — add below the person header (before documents section), guarded by `currentRole === 'VIEWER'`:

```tsx
{currentRole === 'VIEWER' && onProposeSuggestion && person && (
  <div className="flex gap-2 mt-2">
    <button type="button"
      onClick={() => onProposeSuggestion({ type: 'EDIT_PERSON', person })}
      className="text-xs text-blue-400 hover:text-blue-300">
      ✏️ Proposer une modification
    </button>
    <button type="button"
      onClick={() => onProposeSuggestion({ type: 'DELETE_PERSON', person })}
      className="text-xs text-red-400 hover:text-red-300">
      🗑 Proposer la suppression
    </button>
  </div>
)}
```

For each relation row rendered, add for VIEWER (`allPersons` is already a prop in this component):
```tsx
{currentRole === 'VIEWER' && onProposeSuggestion && (
  <button type="button"
    onClick={() => onProposeSuggestion({ type: 'DELETE_RELATIONSHIP', relationship: rel, persons: allPersons })}
    className="text-xs text-gray-600 hover:text-red-400 ml-2">✕</button>
)}
```

For ADMIN/EDITOR — add a pending suggestions section if `pendingSuggestions?.length > 0`, after the relations section:

```tsx
{currentRole !== 'VIEWER' && pendingSuggestions && pendingSuggestions.length > 0 && (
  <div className="mt-4 border-t border-[#1e3a5f]/40 pt-3">
    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">
      {pendingSuggestions.length} suggestion{pendingSuggestions.length > 1 ? 's' : ''} en attente
    </p>
    {pendingSuggestions.map(s => (
      <div key={s.id} className="text-xs text-gray-400 py-1 border-b border-[#1e3a5f]/20 flex items-center justify-between">
        <span>{s.type} · {s.users?.email ?? s.suggested_by}</span>
      </div>
    ))}
    <p className="text-xs text-gray-600 mt-2 italic">Gérez-les depuis le panneau 💡 dans la barre du haut.</p>
  </div>
)}
```

- [ ] **Step 6: Update existing test mocks for TreeContext**

Since `pendingSuggestionsCount` is now required in `TreeContextValue`, search for all test files mocking `useTree` and add `pendingSuggestionsCount: 0` to each mock. Use grep:

```bash
cd /Users/user/Genealogy && grep -rl "useTree" src --include="*.test.tsx" | head -20
```

For each file found, add `pendingSuggestionsCount: 0` to every `mockReturnValue({...})` call.

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/user/Genealogy && npx tsc --noEmit 2>&1 | head -30
```

Fix all errors.

- [ ] **Step 8: Run full test suite**

```bash
cd /Users/user/Genealogy && npx vitest run 2>&1 | tail -15
```

Fix any regressions.

- [ ] **Step 9: Commit**

```bash
cd /Users/user/Genealogy && git add src/lib/context/tree-context.tsx src/app/(app)/layout.tsx src/components/layout/AppShell.tsx src/components/layout/Topbar.tsx src/components/layout/DetailPanel.tsx && git commit -m "feat(suggestions): wire Topbar badge + DetailPanel buttons + AppShell"
```

---

### Task C6-9: Full verification

- [ ] **Step 1: Full test suite**

```bash
cd /Users/user/Genealogy && npx vitest run 2>&1 | tail -15
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/user/Genealogy && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Next.js build**

```bash
cd /Users/user/Genealogy && npx next build 2>&1 | tail -20
```

- [ ] **Step 4: Fix any issues and commit**

If there were any issues to fix above, commit the changes (skip if everything was clean):

```bash
cd /Users/user/Genealogy && git add -u && git commit -m "fix(suggestions): resolve build/type issues"
```
