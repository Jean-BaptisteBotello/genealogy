# Lier des personnes — Implementation Plan (Plan 7)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline "Link person" form in the DetailPanel so ADMIN/EDITOR can create named relationships (père, mère, grand-père, oncle…) between any two persons.

**Architecture:** A pure mapping utility derives the correct DB type and direction from a human role label. `LinkPersonForm` uses this mapping and calls the existing `createRelationship` server action. `DetailPanel` gets an `isLinking` boolean state, a `[+]` button, and updated metadata.role display — consistent with existing internal state patterns (`isUploading`, `downloadingId`).

**Tech Stack:** Next.js 14, TypeScript, Vitest + React Testing Library, Tailwind CSS, Supabase (via existing server action)

---

## Chunk 1: Role mapping utility

### Task 1: `relationship-roles.ts` — mapping function + role lists

**Files:**
- Create: `src/lib/relationship-roles.ts`
- Create: `src/lib/__tests__/relationship-roles.test.ts`

---

- [ ] **Step 1.1 — Write the failing tests**

Create `src/lib/__tests__/relationship-roles.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { deriveRelationship } from '@/lib/relationship-roles'

const CURRENT = 'person-current'
const OTHER = 'person-other'

describe('deriveRelationship', () => {
  describe('ascendants directs → PARENT_CHILD, other→current', () => {
    it.each(['père', 'mère', 'grand-père', 'grand-mère',
             'arrière-grand-père', 'arrière-grand-mère',
             'arrière-arrière-grand-père', 'arrière-arrière-grand-mère'] as const)(
      '%s',
      (role) => {
        const r = deriveRelationship(role, CURRENT, OTHER)
        expect(r.type).toBe('PARENT_CHILD')
        expect(r.person_a_id).toBe(OTHER)
        expect(r.person_b_id).toBe(CURRENT)
        expect(r.metadata.role).toBe(role)
      }
    )
  })

  describe('descendants → PARENT_CHILD, current→other', () => {
    it.each(['fils', 'fille'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('PARENT_CHILD')
      expect(r.person_a_id).toBe(CURRENT)
      expect(r.person_b_id).toBe(OTHER)
      expect(r.metadata.role).toBe(role)
    })
  })

  it('enfant adopté(e) → ADOPTION, current→other', () => {
    const r = deriveRelationship('enfant adopté(e)', CURRENT, OTHER)
    expect(r.type).toBe('ADOPTION')
    expect(r.person_a_id).toBe(CURRENT)
    expect(r.person_b_id).toBe(OTHER)
  })

  describe('fratrie → SIBLING', () => {
    it.each(['frère', 'sœur'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('SIBLING')
    })
  })

  describe('demi-fratrie → HALF_SIBLING', () => {
    it.each(['demi-frère', 'demi-sœur'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('HALF_SIBLING')
    })
  })

  describe('oncle/tante → SIBLING, other→current (pas PARENT_CHILD = pas de cycle check)', () => {
    it.each(['oncle', 'tante'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('SIBLING')
      expect(r.person_a_id).toBe(OTHER)   // other (oncle/tante) → current
      expect(r.person_b_id).toBe(CURRENT)
      expect(r.metadata.role).toBe(role)
    })
  })

  it('époux/épouse → UNION, current→other', () => {
    const r = deriveRelationship('époux/épouse', CURRENT, OTHER)
    expect(r.type).toBe('UNION')
    expect(r.person_a_id).toBe(CURRENT)
    expect(r.person_b_id).toBe(OTHER)
  })

  describe('beaux-parents → STEP, other→current', () => {
    it.each(['beau-père', 'belle-mère'] as const)('%s', (role) => {
      const r = deriveRelationship(role, CURRENT, OTHER)
      expect(r.type).toBe('STEP')
      expect(r.person_a_id).toBe(OTHER)
      expect(r.person_b_id).toBe(CURRENT)
    })
  })
})
```

- [ ] **Step 1.2 — Run to confirm failure**

```bash
cd ~/Genealogy && npm run test -- src/lib/__tests__/relationship-roles.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/relationship-roles'`

- [ ] **Step 1.3 — Implement `relationship-roles.ts`**

Create `src/lib/relationship-roles.ts`:

```typescript
import type { RelationshipType } from '@/lib/types/database'

export type RelationshipRole =
  | 'père' | 'mère'
  | 'fils' | 'fille'
  | 'frère' | 'sœur'
  | 'demi-frère' | 'demi-sœur'
  | 'époux/épouse'
  | 'beau-père' | 'belle-mère'
  | 'grand-père' | 'grand-mère'
  | 'arrière-grand-père' | 'arrière-grand-mère'
  | 'arrière-arrière-grand-père' | 'arrière-arrière-grand-mère'
  | 'oncle' | 'tante'
  | 'enfant adopté(e)'

export interface RelationshipDerivation {
  person_a_id: string
  person_b_id: string
  type: RelationshipType
  metadata: { role: RelationshipRole }
}

export function deriveRelationship(
  role: RelationshipRole,
  currentPersonId: string,
  otherPersonId: string
): RelationshipDerivation {
  const metadata = { role }

  // other → current (other is the ascendant/superior)
  const otherToCurrent = (type: RelationshipType): RelationshipDerivation => ({
    person_a_id: otherPersonId,
    person_b_id: currentPersonId,
    type,
    metadata,
  })

  // current → other
  const currentToOther = (type: RelationshipType): RelationshipDerivation => ({
    person_a_id: currentPersonId,
    person_b_id: otherPersonId,
    type,
    metadata,
  })

  switch (role) {
    case 'père':
    case 'mère':
    case 'grand-père':
    case 'grand-mère':
    case 'arrière-grand-père':
    case 'arrière-grand-mère':
    case 'arrière-arrière-grand-père':
    case 'arrière-arrière-grand-mère':
      return otherToCurrent('PARENT_CHILD')

    case 'beau-père':
    case 'belle-mère':
      return otherToCurrent('STEP')

    case 'oncle':
    case 'tante':
      // SIBLING (not PARENT_CHILD) to avoid cycle detection interference
      return otherToCurrent('SIBLING')

    case 'fils':
    case 'fille':
      return currentToOther('PARENT_CHILD')

    case 'enfant adopté(e)':
      return currentToOther('ADOPTION')

    case 'frère':
    case 'sœur':
      return currentToOther('SIBLING')

    case 'demi-frère':
    case 'demi-sœur':
      return currentToOther('HALF_SIBLING')

    case 'époux/épouse':
      return currentToOther('UNION')
  }
}

export const ROLES_FAMILLE_DIRECTE: RelationshipRole[] = [
  'père', 'mère', 'fils', 'fille',
  'frère', 'sœur', 'demi-frère', 'demi-sœur',
  'époux/épouse', 'beau-père', 'belle-mère',
  'enfant adopté(e)',
]

export const ROLES_FAMILLE_ETENDUE: RelationshipRole[] = [
  'grand-père', 'grand-mère',
  'arrière-grand-père', 'arrière-grand-mère',
  'arrière-arrière-grand-père', 'arrière-arrière-grand-mère',
  'oncle', 'tante',
]
```

- [ ] **Step 1.4 — Run to confirm green**

```bash
cd ~/Genealogy && npm run test -- src/lib/__tests__/relationship-roles.test.ts
```

Expected: all tests PASS

- [ ] **Step 1.5 — Commit**

```bash
cd ~/Genealogy && git add src/lib/relationship-roles.ts src/lib/__tests__/relationship-roles.test.ts
git commit -m "feat: add relationship role mapping utility"
```

---

## Chunk 2: LinkPersonForm component

### Task 2: `LinkPersonForm` — inline form component

**Files:**
- Create: `src/components/person/LinkPersonForm.tsx`
- Create: `src/components/person/__tests__/LinkPersonForm.test.tsx`

---

- [ ] **Step 2.1 — Write the failing tests**

Create `src/components/person/__tests__/LinkPersonForm.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/server-actions/relationships', () => ({
  createRelationship: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/lib/context/tree-context', () => ({
  useTree: () => ({ currentRole: 'ADMIN' }),
}))

import { createRelationship } from '@/server-actions/relationships'

const CURRENT_ID = 'person-a'
const OTHER_ID = 'person-b'

const persons = [
  {
    id: CURRENT_ID, prenom: 'Pierre', nom: 'Dupont',
    date_naissance: '1990-04-26', lieu_naissance: null,
    lat_naissance: null, lon_naissance: null,
    date_deces: null, lieu_deces: null,
    lat_deces: null, lon_deces: null,
    notes: null, created_at: '', updated_at: '',
  },
  {
    id: OTHER_ID, prenom: 'Pierre', nom: 'Dupont',
    date_naissance: '1960-01-01', lieu_naissance: null,
    lat_naissance: null, lon_naissance: null,
    date_deces: null, lieu_deces: null,
    lat_deces: null, lon_deces: null,
    notes: null, created_at: '', updated_at: '',
  },
]

async function renderForm(onClose = vi.fn()) {
  const { LinkPersonForm } = await import('../LinkPersonForm')
  return render(
    <LinkPersonForm
      currentPersonId={CURRENT_ID}
      persons={persons}
      onClose={onClose}
    />
  )
}

describe('LinkPersonForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders search input and role buttons', async () => {
    await renderForm()
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument()
    expect(screen.getByText('père')).toBeInTheDocument()
    expect(screen.getByText('mère')).toBeInTheDocument()
  })

  it('excludes the current person from the list', async () => {
    await renderForm()
    expect(screen.queryByText(/pierre/i)).not.toBeInTheDocument()
    expect(screen.getByText(/pierre/i)).toBeInTheDocument()
  })

  it('filters persons by search query', async () => {
    await renderForm()
    const input = screen.getByPlaceholderText(/rechercher/i)
    await userEvent.type(input, 'zzz')
    expect(screen.queryByText(/pierre/i)).not.toBeInTheDocument()
  })

  it('submit button is disabled until both person and role are selected', async () => {
    await renderForm()
    const btn = screen.getByRole('button', { name: /lier/i })
    expect(btn).toBeDisabled()

    await userEvent.click(screen.getByText(/pierre/i))
    expect(btn).toBeDisabled()

    await userEvent.click(screen.getByText('père'))
    expect(btn).not.toBeDisabled()
  })

  it('calls createRelationship with correct FormData on submit', async () => {
    await renderForm()
    await userEvent.click(screen.getByText(/pierre/i))
    await userEvent.click(screen.getByText('père'))
    await userEvent.click(screen.getByRole('button', { name: /lier/i }))

    await waitFor(() => {
      expect(createRelationship).toHaveBeenCalledOnce()
      const fd = (createRelationship as ReturnType<typeof vi.fn>).mock.calls[0][0] as FormData
      expect(fd.get('type')).toBe('PARENT_CHILD')
      expect(fd.get('person_a_id')).toBe(OTHER_ID) // père = other→current
      expect(fd.get('person_b_id')).toBe(CURRENT_ID)
      expect(JSON.parse(fd.get('metadata') as string)).toEqual({ role: 'père' })
    })
  })

  it('calls onClose after successful submit', async () => {
    const onClose = vi.fn()
    await renderForm(onClose)
    await userEvent.click(screen.getByText(/pierre/i))
    await userEvent.click(screen.getByText('père'))
    await userEvent.click(screen.getByRole('button', { name: /lier/i }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })

  it('shows error message when createRelationship returns error', async () => {
    vi.mocked(createRelationship).mockResolvedValueOnce({ error: 'Cycle détecté' })
    await renderForm()
    await userEvent.click(screen.getByText(/pierre/i))
    await userEvent.click(screen.getByText('père'))
    await userEvent.click(screen.getByRole('button', { name: /lier/i }))
    await waitFor(() => expect(screen.getByText(/cycle détecté/i)).toBeInTheDocument())
  })

  it('shows famille étendue roles after expanding', async () => {
    await renderForm()
    expect(screen.queryByText('grand-père')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText(/famille étendue/i))
    expect(screen.getByText('grand-père')).toBeInTheDocument()
    expect(screen.getByText('oncle')).toBeInTheDocument()
  })

  it('calls onClose when Annuler is clicked', async () => {
    const onClose = vi.fn()
    await renderForm(onClose)
    await userEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2.2 — Run to confirm failure**

```bash
cd ~/Genealogy && npm run test -- src/components/person/__tests__/LinkPersonForm.test.tsx
```

Expected: FAIL — `Cannot find module '../LinkPersonForm'`

- [ ] **Step 2.3 — Implement `LinkPersonForm.tsx`**

Create `src/components/person/LinkPersonForm.tsx`:

```typescript
'use client'
import { useState, useTransition } from 'react'
import { createRelationship } from '@/server-actions/relationships'
import {
  deriveRelationship,
  ROLES_FAMILLE_DIRECTE,
  ROLES_FAMILLE_ETENDUE,
  type RelationshipRole,
} from '@/lib/relationship-roles'
import type { Person } from '@/lib/types/database'

interface LinkPersonFormProps {
  currentPersonId: string
  persons: Person[]
  onClose: () => void
}

export function LinkPersonForm({ currentPersonId, persons, onClose }: LinkPersonFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<RelationshipRole | null>(null)
  const [isExtendedOpen, setIsExtendedOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = persons
    .filter(p => p.id !== currentPersonId)
    .filter(p => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return p.prenom.toLowerCase().includes(q) || p.nom.toLowerCase().includes(q)
    })

  function handleSubmit() {
    if (!selectedPersonId || !selectedRole) return
    setError(null)

    const derived = deriveRelationship(selectedRole, currentPersonId, selectedPersonId)
    const formData = new FormData()
    formData.set('person_a_id', derived.person_a_id)
    formData.set('person_b_id', derived.person_b_id)
    formData.set('type', derived.type)
    formData.set('metadata', JSON.stringify(derived.metadata))

    startTransition(async () => {
      const result = await createRelationship(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  const canSubmit = selectedPersonId !== null && selectedRole !== null && !isPending

  return (
    <div className="mt-2 flex flex-col gap-2">
      <input
        autoFocus
        type="text"
        placeholder="Rechercher une personne…"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full bg-[#0d1117] border border-[#1e3a5f] rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
      />

      {filtered.length > 0 && (
        <div className="max-h-24 overflow-y-auto flex flex-col gap-0.5">
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPersonId(p.id)}
              className={`text-left text-xs px-2 py-1 rounded ${
                selectedPersonId === p.id
                  ? 'bg-blue-600/30 text-blue-200'
                  : 'text-gray-400 hover:bg-[#1e3a5f]/30'
              }`}
            >
              {p.prenom} {p.nom}
              {p.date_naissance ? ` · ${p.date_naissance.slice(0, 4)}` : ''}
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Son rôle</div>
        <div className="flex flex-wrap gap-1">
          {ROLES_FAMILLE_DIRECTE.map(role => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`text-[10px] px-2 py-0.5 rounded border ${
                selectedRole === role
                  ? 'border-blue-500 text-blue-200 bg-blue-600/20'
                  : 'border-[#1e3a5f] text-gray-500 hover:text-gray-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setIsExtendedOpen(v => !v)}
          className="text-[10px] text-gray-600 hover:text-gray-400"
        >
          {isExtendedOpen ? '▾' : '▸'} Famille étendue
        </button>
        {isExtendedOpen && (
          <div className="flex flex-wrap gap-1 mt-1">
            {ROLES_FAMILLE_ETENDUE.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  selectedRole === role
                    ? 'border-blue-500 text-blue-200 bg-blue-600/20'
                    : 'border-[#1e3a5f] text-gray-500 hover:text-gray-300'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-[10px] text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] text-gray-600 hover:text-gray-300"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="text-[10px] px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40 hover:bg-blue-500"
        >
          {isPending ? '…' : 'Lier →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2.4 — Run to confirm green**

```bash
cd ~/Genealogy && npm run test -- src/components/person/__tests__/LinkPersonForm.test.tsx
```

Expected: all 8 tests PASS

- [ ] **Step 2.5 — Commit**

```bash
cd ~/Genealogy && git add src/components/person/LinkPersonForm.tsx src/components/person/__tests__/LinkPersonForm.test.tsx
git commit -m "feat: add LinkPersonForm inline component"
```

---

## Chunk 3: DetailPanel modifications

### Task 3: Wire `LinkPersonForm` into `DetailPanel`

**Files:**
- Modify: `src/components/layout/DetailPanel.tsx`
- Create: `src/components/layout/__tests__/DetailPanel.test.tsx`

---

- [ ] **Step 3.1 — Write the failing tests**

Create `src/components/layout/__tests__/DetailPanel.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/context/tree-context', () => ({
  useTree: vi.fn(),
}))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: { from: () => ({ createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: '' } }) }) },
  }),
}))
vi.mock('../../../components/person/LinkPersonForm', () => ({
  LinkPersonForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="link-form">
      <button onClick={onClose}>close-form</button>
    </div>
  ),
}))

import { useTree } from '@/lib/context/tree-context'

const mockPerson = {
  id: 'p1', prenom: 'Pierre', nom: 'Dupont',
  date_naissance: null, lieu_naissance: null,
  lat_naissance: null, lon_naissance: null,
  date_deces: null, lieu_deces: null,
  lat_deces: null, lon_deces: null,
  notes: null, created_at: '', updated_at: '',
}

function setupTree(role: 'ADMIN' | 'EDITOR' | 'VIEWER') {
  vi.mocked(useTree).mockReturnValue({
    currentRole: role,
    persons: [mockPerson],
    relationships: [],
    branches: [],
    personBranches: [],
    documents: {},
    suggestions: [],
    selectedPersonId: 'p1',
    selectPerson: vi.fn(),
    openAddPerson: vi.fn(),
  } as never)
}

async function renderPanel(role: 'ADMIN' | 'EDITOR' | 'VIEWER' = 'ADMIN') {
  setupTree(role)
  const { DetailPanel } = await import('../DetailPanel')
  return render(
    <DetailPanel
      persons={[mockPerson]}
      relationships={[]}
      branches={[]}
      personBranches={[]}
      documents={{}}
      allPersons={[mockPerson]}
      selectedPersonId="p1"
      onSelectPerson={vi.fn()}
      onClose={vi.fn()}
      currentRole={role}
      pendingSuggestions={[]}
    />
  )
}

describe('DetailPanel — lier une personne', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows [+] button in Relations section for ADMIN', async () => {
    await renderPanel('ADMIN')
    expect(screen.getByTitle(/lier/i)).toBeInTheDocument()
  })

  it('shows [+] button for EDITOR', async () => {
    await renderPanel('EDITOR')
    expect(screen.getByTitle(/lier/i)).toBeInTheDocument()
  })

  it('hides [+] button for VIEWER', async () => {
    await renderPanel('VIEWER')
    expect(screen.queryByTitle(/lier/i)).not.toBeInTheDocument()
  })

  it('shows LinkPersonForm after clicking [+]', async () => {
    await renderPanel('ADMIN')
    expect(screen.queryByTestId('link-form')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTitle(/lier/i))
    expect(screen.getByTestId('link-form')).toBeInTheDocument()
  })

  it('hides LinkPersonForm after onClose is called', async () => {
    await renderPanel('ADMIN')
    await userEvent.click(screen.getByTitle(/lier/i))
    expect(screen.getByTestId('link-form')).toBeInTheDocument()
    await userEvent.click(screen.getByText('close-form'))
    expect(screen.queryByTestId('link-form')).not.toBeInTheDocument()
  })

  it('displays metadata.role if present, otherwise falls back to type label', async () => {
    setupTree('ADMIN')
    const relWithRole = {
      id: 'r1', person_a_id: 'p2', person_b_id: 'p1',
      type: 'PARENT_CHILD' as const,
      metadata: { role: 'grand-père' },
    }
    const p2 = { ...mockPerson, id: 'p2', prenom: 'Pierre', nom: 'Dupont' }
    const { DetailPanel } = await import('../DetailPanel')
    render(
      <DetailPanel
        persons={[mockPerson, p2]}
        relationships={[relWithRole]}
        branches={[]}
        personBranches={[]}
        documents={{}}
        allPersons={[mockPerson, p2]}
        selectedPersonId="p1"
        onSelectPerson={vi.fn()}
        onClose={vi.fn()}
        currentRole="ADMIN"
        pendingSuggestions={[]}
      />
    )
    expect(screen.getByText('grand-père')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3.2 — Run to confirm failure**

```bash
cd ~/Genealogy && npm run test -- src/components/layout/__tests__/DetailPanel.test.tsx
```

Expected: FAIL — tests about `[+]` button and `LinkPersonForm` rendering

- [ ] **Step 3.3 — Modify `DetailPanel.tsx`**

Open `src/components/layout/DetailPanel.tsx` and make 3 changes.
For Change C, search for the comment `{/* Relations */}` as the anchor to locate the section to replace.

**Change A** — Add import at top of file (after existing imports):

```typescript
import { LinkPersonForm } from '@/components/person/LinkPersonForm'
```

**Change B** — Add `isLinking` state alongside existing state declarations (near `isUploading`, `downloadingId`):

```typescript
const [isLinking, setIsLinking] = useState(false)
```

**Change C** — Update the Relations section header to add the `[+]` button, replace the type label with metadata.role display, and render `LinkPersonForm` when `isLinking`:

Replace the existing Relations section:

```typescript
{/* Relations */}
{(personRelationships.length > 0 || currentRole !== 'VIEWER') && (
  <div>
    <div className="flex items-center justify-between mb-1">
      <div className="text-[10px] text-gray-600 uppercase tracking-widest">Relations</div>
      {currentRole !== 'VIEWER' && !isLinking && (
        <button
          type="button"
          title="Lier une personne"
          onClick={() => setIsLinking(true)}
          className="text-[10px] text-gray-600 hover:text-gray-300"
        >
          +
        </button>
      )}
      {currentRole !== 'VIEWER' && isLinking && (
        <button
          type="button"
          onClick={() => setIsLinking(false)}
          className="text-[10px] text-gray-600 hover:text-gray-300"
        >
          ✕
        </button>
      )}
    </div>

    {isLinking && (
      <LinkPersonForm
        currentPersonId={person.id}
        persons={allPersons}
        onClose={() => setIsLinking(false)}
      />
    )}

    {personRelationships.length > 0 && (
      <div className="flex flex-col gap-1">
        {personRelationships.map(rel => {
          const other = getOtherPerson(rel)
          if (!other) return null
          const roleLabel =
            (rel.metadata as { role?: string })?.role ??
            RELATION_LABEL[rel.type] ??
            rel.type
          return (
            <div key={rel.id} className="flex items-center">
              <button
                type="button"
                onClick={() => onSelectPerson(other.id)}
                className="text-left text-xs text-blue-300 hover:text-blue-200 py-0.5 flex items-center gap-1 flex-1 min-w-0"
              >
                <span className="text-[10px] text-gray-600 mr-1">{roleLabel}</span>
                {other.prenom} {other.nom}
              </button>
              {currentRole === 'VIEWER' && onProposeSuggestion && (
                <button type="button"
                  onClick={() => onProposeSuggestion({ type: 'DELETE_RELATIONSHIP', relationship: rel, persons: allPersons })}
                  className="text-xs text-gray-600 hover:text-red-400 ml-2">✕</button>
              )}
            </div>
          )
        })}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3.4 — Run to confirm green**

```bash
cd ~/Genealogy && npm run test -- src/components/layout/__tests__/DetailPanel.test.tsx
```

Expected: all tests PASS

- [ ] **Step 3.5 — Run full test suite to confirm no regressions**

```bash
cd ~/Genealogy && npm run test:run
```

Expected: all existing tests still PASS

- [ ] **Step 3.6 — Commit**

```bash
cd ~/Genealogy && git add src/components/layout/DetailPanel.tsx src/components/layout/__tests__/DetailPanel.test.tsx
git commit -m "feat: wire LinkPersonForm into DetailPanel — lier une personne"
```

---

## Final verification

- [ ] **Step 4.1 — Build check**

```bash
cd ~/Genealogy && npm run build
```

Expected: build completes with no TypeScript errors

- [ ] **Step 4.2 — Manual smoke test**

1. `npm run dev`
2. Ajouter une deuxième personne (ex: Pierre Dupont, 1960)
3. Cliquer sur Pierre → DetailPanel → section Relations → cliquer `[+]`
4. Taper "Pierre" dans la recherche → sélectionner Pierre Dupont
5. Cliquer "père" → cliquer "Lier →"
6. Vérifier : la relation "père → Pierre Dupont" apparaît dans la liste avec le bon label
7. Rafraîchir la page → la relation persiste

- [ ] **Step 4.3 — Commit final**

```bash
cd ~/Genealogy && git commit --allow-empty -m "chore: plan 7 implementation complete"
```
