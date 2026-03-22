# Collaboration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add role-based access control (ADMIN/EDITOR/VIEWER) with email invitations, a member management modal, and role-gated UI throughout the app.

**Architecture:** `layout.tsx` fetches the current user's role from `tree_member` and passes it into AppShell → TreeContext. A new `members.ts` server action file handles CRUD via a Supabase admin client (service role key). `MembersModal` is wired to the existing "Gérer les accès" button in the Sidebar. UI elements (add/edit/delete buttons) are conditionally rendered based on `currentRole` from context.

**Tech Stack:** Next.js 16 Server Actions, Supabase admin client (`SUPABASE_SERVICE_ROLE_KEY`), React context, Vitest + RTL.

---

## File Map

| Status | File | Purpose |
|--------|------|---------|
| Create | `src/lib/supabase/admin.ts` | Supabase admin client (service role, server-only) |
| Create | `src/server-actions/members.ts` | getMembers, inviteMember, updateMemberRole, removeMember |
| Create | `src/server-actions/__tests__/members.test.ts` | |
| Create | `src/components/members/MembersModal.tsx` | Member list + invite form + role management |
| Create | `src/components/members/__tests__/MembersModal.test.tsx` | |
| Modify | `src/lib/context/tree-context.tsx` | Add `currentRole?: Role` |
| Modify | `src/app/(app)/layout.tsx` | Fetch currentRole + members list |
| Modify | `src/components/layout/AppShell.tsx` | Accept currentRole + members, provide in context, hide "+ Ajouter" for VIEWER |
| Modify | `src/components/layout/Sidebar.tsx` | Accept role prop, wire "Gérer les accès", hide write actions for VIEWER |
| Modify | `src/components/layout/DetailPanel.tsx` | Hide edit/delete buttons based on role |
| Modify | `src/app/auth/callback/route.ts` | Create TreeMember on invite acceptance |

---

## Chunk 1: Context + Server Actions

### Task C5-1: Add currentRole to TreeContext + layout.tsx + AppShell

**Files:**
- Modify: `src/lib/context/tree-context.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Add `currentRole` to TreeContextValue**

In `src/lib/context/tree-context.tsx`, add `currentRole` as optional to avoid breaking existing mocks:

```typescript
'use client'
import { createContext, useContext } from 'react'
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER'

export interface TreeContextValue {
  persons: Person[]
  branches: Branch[]
  relationships: Relationship[]
  personBranches: PersonBranch[]
  selectedPersonId: string | null
  selectPerson: (id: string | null) => void
  openAddPerson: () => void
  openEditPerson: (id: string) => void
  showToast: (message: string, type?: 'error' | 'info') => void
  currentRole: Role   // required — defaults to 'ADMIN' in AppShell if not in tree_member
}

export const TreeContext = createContext<TreeContextValue | null>(null)

export function useTree(): TreeContextValue {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error('useTree must be used inside AppShell')
  return ctx
}
```

Note: `Role` is already defined in `src/lib/types/database.ts`. Import from there instead of redefining:
```typescript
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'
// Role is already exported from database.ts — no need to redefine
```

Check `src/lib/types/database.ts` — it already exports `type Role = 'ADMIN' | 'EDITOR' | 'VIEWER'`. Import it.

- [ ] **Step 2: Fetch currentRole in layout.tsx**

In `src/app/(app)/layout.tsx`, add a query for the current user's role:

```typescript
const [
  { data: persons },
  { data: branches },
  { data: relationships },
  { data: personBranches },
  { data: memberRow },
] = await Promise.all([
  supabase.from('person').select('*').order('nom'),
  supabase.from('branch').select('*').order('nom'),
  supabase.from('relationship').select('*'),
  supabase.from('person_branch').select('*'),
  supabase.from('tree_member').select('role').eq('user_id', user.id).single(),
])

// If no row: user is the tree creator → ADMIN
const currentRole: Role = (memberRow?.role as Role) ?? 'ADMIN'
```

Add the `Role` import: `import type { Person, Branch, Relationship, PersonBranch, Role } from '@/lib/types/database'`

Pass `currentRole` to AppShell:
```tsx
<AppShell
  userEmail={user.email ?? ''}
  initialPersons={...}
  initialBranches={...}
  initialRelationships={...}
  initialPersonBranches={...}
  currentRole={currentRole}
/>
```

- [ ] **Step 3: AppShell accepts and provides currentRole**

In `src/components/layout/AppShell.tsx`:

Add to `AppShellProps`:
```typescript
currentRole: Role
```

Add import: `import type { Role } from '@/lib/types/database'`

Add to the TreeContext.Provider value:
```tsx
<TreeContext.Provider
  value={{
    ...
    currentRole,
  }}
>
```

- [ ] **Step 4: Update existing test mocks that mock useTree**

Search for all files mocking `useTree` and add `currentRole: 'ADMIN'` to each mock return value. Files to update:
- `src/components/cosmos/__tests__/CosmosView.test.tsx`
- `src/components/views/sablier/__tests__/SablierView.test.tsx`
- `src/components/views/timeline/__tests__/TimelineView.test.tsx`
- `src/components/views/carte/__tests__/CarteView.test.tsx`
- `src/components/views/eventail/__tests__/EventailView.test.tsx`
- `src/components/search/__tests__/SearchOverlay.test.tsx` (if it mocks useTree)

For each, add `currentRole: 'ADMIN'` to the mock return value object.

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/jbbotello/Genealogy && npx tsc --noEmit 2>&1 | head -30
```

Fix any errors.

- [ ] **Step 6: Run full test suite**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run 2>&1 | tail -10
```

Expected: all existing tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add -A && git commit -m "feat(collab): add currentRole to TreeContext and layout"
```

---

### Task C5-2: Supabase admin client + members server action tests

**Files:**
- Create: `src/lib/supabase/admin.ts`
- Create: `src/server-actions/__tests__/members.test.ts`

- [ ] **Step 1: Create admin client**

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

// Server-only — never import this in client components
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- [ ] **Step 2: Write failing tests**

```typescript
// src/server-actions/__tests__/members.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Supabase regular client mocks ──────────────────────────────────────
const mockMembersSingle = vi.fn()
const mockMembersSelectEq = vi.fn(() => ({ single: mockMembersSingle }))
const mockMembersSelect = vi.fn(() => ({ eq: mockMembersSelectEq }))

const mockUpdateRoleEq = vi.fn(() => ({ error: null }))
const mockUpdateRole = vi.fn(() => ({ eq: mockUpdateRoleEq }))

const mockDeleteMemberEq = vi.fn(() => ({ error: null }))
const mockDeleteMember = vi.fn(() => ({ eq: mockDeleteMemberEq }))

const mockInsertMember = vi.fn(() => ({ error: null }))
const mockUpsertUser = vi.fn(() => ({ error: null }))

const mockFrom = vi.fn((table: string) => {
  if (table === 'tree_member') {
    return {
      select: mockMembersSelect,
      update: mockUpdateRole,
      delete: mockDeleteMember,
      insert: mockInsertMember,
    }
  }
  if (table === 'users') {
    return { upsert: mockUpsertUser }
  }
  return {}
})

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } })
const mockSupabase = { from: mockFrom, auth: { getUser: mockGetUser } }

// ── Supabase admin client mocks ────────────────────────────────────────
const mockInvite = vi.fn()
const mockAdminClient = {
  auth: { admin: { inviteUserByEmail: mockInvite } },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as any)
})

describe('getMembers', () => {
  it('returns list of members with user info', async () => {
    mockMembersSelectEq.mockReturnValueOnce({
      data: [
        { user_id: 'u1', role: 'EDITOR', invited_at: '2026-01-01', invited_by: 'admin-1', users: { email: 'a@b.com', display_name: 'Alice' } },
      ],
      error: null,
    })
    // getMembers does not filter by user_id — it returns all tree_member rows
    // Reset mock to return plain select
    mockMembersSelect.mockReturnValueOnce({
      data: [
        { user_id: 'u1', role: 'EDITOR', invited_at: '2026-01-01', invited_by: 'admin-1', users: { email: 'a@b.com', display_name: 'Alice' } },
      ],
      error: null,
    })

    const { getMembers } = await import('../members')
    const result = await getMembers()
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('EDITOR')
  })

  it('returns empty array on error', async () => {
    mockMembersSelect.mockReturnValueOnce({ data: null, error: { message: 'DB error' } })
    const { getMembers } = await import('../members')
    const result = await getMembers()
    expect(result).toEqual([])
  })
})

describe('inviteMember', () => {
  it('invites user and creates tree_member row', async () => {
    mockInvite.mockResolvedValue({
      data: { user: { id: 'new-user-1' } },
      error: null,
    })

    const { inviteMember } = await import('../members')
    const result = await inviteMember('alice@example.com', 'EDITOR')
    expect(result).toEqual({})
    expect(mockInvite).toHaveBeenCalledWith('alice@example.com', expect.objectContaining({ data: { role: 'EDITOR' } }))
    expect(mockInsertMember).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'new-user-1', role: 'EDITOR', invited_by: 'admin-1' })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { inviteMember } = await import('../members')
    const result = await inviteMember('alice@example.com', 'EDITOR')
    expect(result).toEqual({ error: 'Non authentifié.' })
    expect(mockInvite).not.toHaveBeenCalled()
  })

  it('returns error when invite API fails', async () => {
    mockInvite.mockResolvedValue({ data: { user: null }, error: { message: 'Email already registered' } })
    const { inviteMember } = await import('../members')
    const result = await inviteMember('existing@example.com', 'EDITOR')
    expect(result).toEqual({ error: 'Email already registered' })
  })
})

describe('updateMemberRole', () => {
  it('updates the role and revalidates', async () => {
    const { updateMemberRole } = await import('../members')
    const result = await updateMemberRole('u1', 'VIEWER')
    expect(result).toEqual({})
    expect(mockUpdateRole).toHaveBeenCalledWith({ role: 'VIEWER' })
    expect(mockUpdateRoleEq).toHaveBeenCalledWith('user_id', 'u1')
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error on DB failure', async () => {
    mockUpdateRoleEq.mockReturnValueOnce({ error: { message: 'Not found' } })
    const { updateMemberRole } = await import('../members')
    const result = await updateMemberRole('u999', 'VIEWER')
    expect(result).toEqual({ error: 'Not found' })
  })
})

describe('removeMember', () => {
  it('deletes the member and revalidates', async () => {
    const { removeMember } = await import('../members')
    const result = await removeMember('u1')
    expect(result).toEqual({})
    expect(mockDeleteMember).toHaveBeenCalled()
    expect(mockDeleteMemberEq).toHaveBeenCalledWith('user_id', 'u1')
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error on DB failure', async () => {
    mockDeleteMemberEq.mockReturnValueOnce({ error: { message: 'Constraint violation' } })
    const { removeMember } = await import('../members')
    const result = await removeMember('u1')
    expect(result).toEqual({ error: 'Constraint violation' })
  })
})
```

- [ ] **Step 3: Run tests to confirm FAIL**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/members.test.ts 2>&1 | tail -10
```

Expected: FAIL — module not found

- [ ] **Step 4: Commit failing tests**

```bash
cd /Users/jbbotello/Genealogy && git add src/lib/supabase/admin.ts src/server-actions/__tests__/members.test.ts && git commit -m "test(collab): failing tests for members server actions"
```

---

### Task C5-3: members.ts implementation

**Files:**
- Create: `src/server-actions/members.ts`

- [ ] **Step 1: Implement**

```typescript
// src/server-actions/members.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Role } from '@/lib/types/database'

export interface MemberWithUser {
  user_id: string
  role: Role
  invited_at: string
  invited_by: string
  users: { email: string; display_name: string } | null
}

export async function getMembers(): Promise<MemberWithUser[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tree_member')
    .select('*, users(email, display_name)')
  if (error || !data) return []
  return data as MemberWithUser[]
}

export async function inviteMember(
  email: string,
  role: Role
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const admin = createAdminClient()
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { data: { role } }
  )
  if (inviteError || !inviteData.user) return { error: inviteError?.message ?? 'Erreur invitation.' }

  const newUserId = inviteData.user.id

  // Upsert the user in the public users table
  await supabase.from('users').upsert({
    id: newUserId,
    email,
    display_name: email.split('@')[0],
  })

  // Create tree_member
  const { error: memberError } = await supabase.from('tree_member').insert({
    user_id: newUserId,
    role,
    invited_by: user.id,
  })
  if (memberError) return { error: memberError.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function updateMemberRole(
  userId: string,
  role: Role
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tree_member')
    .update({ role })
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}

export async function removeMember(
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tree_member')
    .delete()
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/server-actions/__tests__/members.test.ts 2>&1 | tail -15
```

The `getMembers` tests use a non-standard mock pattern — adjust the mock if needed so `from('tree_member').select(...)` returns the right shape (no `.eq()` chained). Fix mocks or implementation to make all tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/server-actions/members.ts && git commit -m "feat(collab): members server actions (invite, list, update, remove)"
```

---

## Chunk 2: MembersModal + Role-gated UI + Callback

### Task C5-4: MembersModal tests + implementation

**Files:**
- Create: `src/components/members/__tests__/MembersModal.test.tsx`
- Create: `src/components/members/MembersModal.tsx`

**Context:** MembersModal is opened by clicking "Gérer les accès" in the Sidebar. It shows the list of members, an invite form (ADMIN only), and per-member role change + remove buttons (ADMIN only). It receives `members` and `currentRole` as props.

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/members/__tests__/MembersModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/server-actions/members', () => ({
  inviteMember: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
}))

import { inviteMember, updateMemberRole, removeMember } from '@/server-actions/members'
import { MembersModal } from '../MembersModal'
import type { MemberWithUser } from '@/server-actions/members'

const mockMember: MemberWithUser = {
  user_id: 'u1',
  role: 'EDITOR',
  invited_at: '2026-01-01T00:00:00Z',
  invited_by: 'admin-1',
  users: { email: 'alice@example.com', display_name: 'alice' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MembersModal', () => {
  it('renders the modal title', () => {
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={vi.fn()} />)
    expect(screen.getByText(/gérer les accès/i)).toBeTruthy()
  })

  it('lists members with their email and role', () => {
    render(<MembersModal members={[mockMember]} currentRole="ADMIN" onClose={vi.fn()} />)
    expect(screen.getByText('alice@example.com')).toBeTruthy()
    expect(screen.getByText('EDITOR')).toBeTruthy()
  })

  it('shows invite form for ADMIN', () => {
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText(/email/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /inviter/i })).toBeTruthy()
  })

  it('hides invite form for non-ADMIN', () => {
    render(<MembersModal members={[]} currentRole="EDITOR" onClose={vi.fn()} />)
    expect(screen.queryByPlaceholderText(/email/i)).toBeNull()
  })

  it('calls inviteMember with email and role on form submit', async () => {
    vi.mocked(inviteMember).mockResolvedValue({})
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'bob@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /inviter/i }))

    await waitFor(() => {
      expect(inviteMember).toHaveBeenCalledWith('bob@example.com', expect.any(String))
    })
  })

  it('shows error message when inviteMember fails', async () => {
    vi.mocked(inviteMember).mockResolvedValue({ error: 'Email déjà enregistré' })
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'bob@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /inviter/i }))

    await waitFor(() => {
      expect(screen.getByText('Email déjà enregistré')).toBeTruthy()
    })
  })

  it('calls removeMember when remove button clicked', async () => {
    vi.mocked(removeMember).mockResolvedValue({})
    render(<MembersModal members={[mockMember]} currentRole="ADMIN" onClose={vi.fn()} />)

    fireEvent.click(screen.getByTitle(/supprimer/i))
    await waitFor(() => {
      expect(removeMember).toHaveBeenCalledWith('u1')
    })
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<MembersModal members={[]} currentRole="ADMIN" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/members/__tests__/MembersModal.test.tsx 2>&1 | tail -10
```

- [ ] **Step 3: Implement MembersModal**

```typescript
// src/components/members/MembersModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { inviteMember, updateMemberRole, removeMember } from '@/server-actions/members'
import type { MemberWithUser } from '@/server-actions/members'
import type { Role } from '@/lib/types/database'
import { useRouter } from 'next/navigation'

const ROLES: Role[] = ['ADMIN', 'EDITOR', 'VIEWER']

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: '👑 Admin',
  EDITOR: '✏️ Éditeur',
  VIEWER: '👁 Lecteur',
}

interface MembersModalProps {
  members: MemberWithUser[]
  currentRole: Role
  onClose: () => void
}

export function MembersModal({ members, currentRole, onClose }: MembersModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('EDITOR')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleInvite() {
    if (!email.trim()) return
    setInviteError(null)
    startTransition(async () => {
      const result = await inviteMember(email.trim(), inviteRole)
      if (result.error) {
        setInviteError(result.error)
      } else {
        setEmail('')
        router.refresh()
      }
    })
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeMember(userId)
      router.refresh()
    })
  }

  function handleRoleChange(userId: string, role: Role) {
    startTransition(async () => {
      await updateMemberRole(userId, role)
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080d16] border border-[#1e3a5f] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">👥 Gérer les accès</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-gray-500 hover:text-gray-300 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Member list */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {members.length === 0 && (
            <p className="text-xs text-gray-600 italic">Aucun membre pour l'instant.</p>
          )}
          {members.map(m => (
            <div key={m.user_id} className="flex items-center gap-2 py-1.5 border-b border-[#1e3a5f]/40">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">
                  {m.users?.email ?? m.user_id}
                </div>
              </div>
              {currentRole === 'ADMIN' ? (
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.user_id, e.target.value as Role)}
                  className="text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-1 py-0.5"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-500">{m.role}</span>
              )}
              {currentRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleRemove(m.user_id)}
                  title="Supprimer ce membre"
                  className="text-gray-600 hover:text-red-400 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite form (ADMIN only) */}
        {currentRole === 'ADMIN' && (
          <div className="border-t border-[#1e3a5f] pt-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Inviter un membre</p>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as Role)}
                className="text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-1 py-1.5"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {inviteError && (
              <p className="text-xs text-red-400 mb-2">{inviteError}</p>
            )}
            <button
              type="button"
              onClick={handleInvite}
              disabled={isPending || !email.trim()}
              className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Envoi...' : 'Inviter'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run src/components/members/__tests__/MembersModal.test.tsx
```

Expected: 8/8 PASS. Fix any failures.

- [ ] **Step 5: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/components/members/ && git commit -m "feat(collab): MembersModal with invite, role change, remove"
```

---

### Task C5-5: Wire sidebar + role-based UI

**Files:**
- Modify: `src/app/(app)/layout.tsx` (add members fetch)
- Modify: `src/components/layout/AppShell.tsx` (pass members to Sidebar)
- Modify: `src/components/layout/Sidebar.tsx` (wire modal, hide write actions for VIEWER)
- Modify: `src/components/layout/DetailPanel.tsx` (hide edit/delete for VIEWER)

**Note:** No separate test file for this task — existing tests cover the components, and role-gating is verified via the full suite + manual check.

- [ ] **Step 1: Fetch members in layout.tsx**

Add to the Promise.all in `src/app/(app)/layout.tsx`:
```typescript
{ data: membersData },
```

Add the query:
```typescript
supabase.from('tree_member').select('*, users(email, display_name)'),
```

Import `MemberWithUser`:
```typescript
import type { MemberWithUser } from '@/server-actions/members'
```

Cast and pass to AppShell:
```tsx
initialMembers={(membersData ?? []) as MemberWithUser[]}
```

- [ ] **Step 2: Update AppShell to accept and pass members**

Add to `AppShellProps`:
```typescript
initialMembers: MemberWithUser[]
```

Add import:
```typescript
import type { MemberWithUser } from '@/server-actions/members'
import { MembersModal } from '@/components/members/MembersModal'
```

Add state:
```typescript
const [membersModalOpen, setMembersModalOpen] = useState(false)
```

Pass to Sidebar:
```tsx
<Sidebar
  branches={initialBranches}
  currentRole={currentRole}
  onManageMembers={() => setMembersModalOpen(true)}
/>
```

Add MembersModal rendering (after PersonModal):
```tsx
{membersModalOpen && (
  <MembersModal
    members={initialMembers}
    currentRole={currentRole}
    onClose={() => setMembersModalOpen(false)}
  />
)}
```

Also hide the "+ Ajouter" button in Topbar for VIEWER:
In the JSX where Topbar is rendered, pass `onAddPerson` only if not VIEWER:
```tsx
<Topbar
  userEmail={userEmail}
  activeView={activeView}
  onViewChange={setActiveView}
  onAddPerson={currentRole !== 'VIEWER' ? openAddPerson : undefined}
  onSearchOpen={() => setSearchOpen(true)}
/>
```

- [ ] **Step 3: Update Sidebar**

Add props:
```typescript
interface SidebarProps {
  branches: Branch[]
  currentRole: Role
  onManageMembers: () => void
}
```

Import `Role` from `@/lib/types/database`.

Wire the "Gérer les accès" button:
```tsx
<button
  type="button"
  onClick={onManageMembers}
  className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full"
>
  👥 Gérer les accès
</button>
```

Hide write actions for VIEWER — wrap these elements conditionally:
- "+ Nouvelle branche" button: only show if `currentRole !== 'VIEWER'`
- Edit (✎) and Delete (✕) buttons on branches: only show if `currentRole === 'ADMIN'` (for delete) or `currentRole !== 'VIEWER'` (for edit)

```tsx
{currentRole !== 'VIEWER' && (
  <button type="button" onClick={() => setBranchModalMode('add')} ...>
    + Nouvelle branche
  </button>
)}
```

For branch edit/delete buttons, wrap in:
```tsx
{currentRole !== 'VIEWER' && (
  <button ... onClick={() => setBranchModalMode({ type: 'edit', branch })}>✎</button>
)}
{currentRole === 'ADMIN' && (
  <button ... onClick={() => handleDeleteBranch(branch)}>✕</button>
)}
```

- [ ] **Step 4: Update DetailPanel**

Read `src/components/layout/DetailPanel.tsx` to find where the Edit and Delete buttons are rendered.

Add a `currentRole` prop (or read from useTree if it's available in context — check if DetailPanel already uses useTree).

If DetailPanel doesn't import useTree, add:
```typescript
import { useTree } from '@/lib/context/tree-context'
// inside component:
const { currentRole } = useTree()
```

Then wrap the edit button:
```tsx
{currentRole !== 'VIEWER' && (
  <button onClick={onEditPerson}>Modifier</button>
)}
```

And the delete button:
```tsx
{currentRole === 'ADMIN' && (
  <button onClick={() => onDeletePerson(person.id)}>Supprimer</button>
)}
```

Also hide the "Ajouter un document" button for VIEWER:
```tsx
{currentRole !== 'VIEWER' && (
  <button onClick={handleFileSelected}>Ajouter un document</button>
)}
```

And the delete document button:
```tsx
{currentRole === 'ADMIN' && (
  <button onClick={() => handleDeleteDoc(doc.id, doc.url_stockage)}>✕</button>
)}
```

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/jbbotello/Genealogy && npx tsc --noEmit 2>&1 | head -30
```

Fix any errors.

- [ ] **Step 6: Run full test suite**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run 2>&1 | tail -10
```

Fix any regressions.

- [ ] **Step 7: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add -A && git commit -m "feat(collab): wire MembersModal + role-based UI gating"
```

---

### Task C5-6: Auth callback — create TreeMember on invite acceptance

**Files:**
- Modify: `src/app/auth/callback/route.ts`

**Context:** When an invited user clicks the link in their email, Supabase redirects to `/auth/callback?code=xxx`. After `exchangeCodeForSession`, the user is authenticated and `user.user_metadata` contains `{ role: 'EDITOR' }` (set when calling `inviteUserByEmail`). At this point, if no `tree_member` row exists yet for this user, we create one. This is a safety net — `inviteMember` already creates the row, but handles edge cases.

- [ ] **Step 1: Update the callback route**

```typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Role } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const user = data.user
      const invitedRole = user.user_metadata?.role as Role | undefined

      if (invitedRole) {
        // Ensure user is in public users table
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email ?? '',
          display_name: (user.email ?? '').split('@')[0],
        })

        // Create tree_member if it doesn't exist yet (idempotent)
        await supabase.from('tree_member').upsert(
          { user_id: user.id, role: invitedRole },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
      }

      return NextResponse.redirect(`${origin}/tree`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/jbbotello/Genealogy && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /Users/jbbotello/Genealogy && git add src/app/auth/callback/route.ts && git commit -m "feat(collab): create TreeMember on invite acceptance in auth callback"
```

---

### Task C5-7: Full test suite + build verification

**Files:** None new

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/jbbotello/Genealogy && npx vitest run 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/jbbotello/Genealogy && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Next.js build**

```bash
cd /Users/jbbotello/Genealogy && npx next build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 4: Fix any issues and commit**

If there were fixes:
```bash
cd /Users/jbbotello/Genealogy && git add -A && git commit -m "fix(collab): resolve build/type issues"
```

---

## Environment Variable Note

`inviteMember` requires `SUPABASE_SERVICE_ROLE_KEY` (server-only). Add to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Find this in your Supabase dashboard → Project Settings → API → service_role key. **Never expose this to the client.**
