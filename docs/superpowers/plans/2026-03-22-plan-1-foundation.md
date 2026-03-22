# Genealogy App — Plan 1: Foundation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a working Next.js 14 app with Supabase auth, the full DB schema, and the UI shell (topbar, sidebar, layout) — no tree data yet, just the skeleton that every other plan builds on.

**Architecture:** Next.js 14 App Router with TypeScript. Supabase for auth (via `@supabase/ssr`), database (PostgreSQL), and storage. Auth is enforced via Next.js middleware. The UI shell renders on the server; interactive pieces (sidebar state, panels) are client components.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Vitest + React Testing Library (unit), Playwright (E2E)

---

## Chunk 1: Project Bootstrapping & Tooling

### File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies |
| `tsconfig.json` | TypeScript config |
| `tailwind.config.ts` | Tailwind setup |
| `vitest.config.ts` | Unit test runner |
| `playwright.config.ts` | E2E test runner |
| `.env.local.example` | Env var template |
| `.gitignore` | Exclude secrets + build artifacts |

---

### Task 1: Init Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`

- [ ] **Step 1: Scaffold project**

```bash
cd /Users/jbbotello/Genealogy
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
```

- [ ] **Step 2: Install Supabase + test dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @playwright/test
```

- [ ] **Step 3: Create `.env.local.example`**

```bash
cat > .env.local.example << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF
```

- [ ] **Step 4: Add `.env.local` to `.gitignore`**

Verify `.gitignore` contains `.env.local`. If not, add it.

- [ ] **Step 5: Create `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 6: Create test setup file**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create `playwright.config.ts`**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 8: Add test scripts to `package.json`**

Add to the `scripts` section:
```json
"test": "vitest",
"test:run": "vitest run",
"test:e2e": "playwright test"
```

- [ ] **Step 9: Verify setup compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js 14 + Supabase + Vitest + Playwright"
```

---

### Task 2: Supabase project setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/types/database.ts`

- [ ] **Step 1: Create `.env.local` from example**

Copy `.env.local.example` to `.env.local` and fill in your Supabase project URL and keys from your Supabase dashboard.

- [ ] **Step 2: Write failing test for Supabase client**

```typescript
// src/lib/supabase/__tests__/client.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ auth: {}, from: vi.fn() })),
}))

describe('createClient', () => {
  it('creates a browser Supabase client', async () => {
    const { createClient } = await import('../client')
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/lib/supabase/__tests__/client.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 4: Implement browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Run tests to verify both pass**

```bash
npx vitest run src/lib/supabase/__tests__/
```
Expected: PASS.

- [ ] **Step 5d: Write failing test for server client**

```typescript
// src/lib/supabase/__tests__/server.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ auth: {}, from: vi.fn() })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [], set: vi.fn() })),
}))

describe('createClient (server)', () => {
  it('creates a server Supabase client', async () => {
    const { createClient } = await import('../server')
    const client = await createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })
})
```

- [ ] **Step 5e: Run test to verify it fails**

```bash
npx vitest run src/lib/supabase/__tests__/server.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 6: Create server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 7: Create middleware helper**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicPaths = ['/login', '/signup', '/auth/callback', '/accept-invite']
  const isPublicPath = publicPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

- [ ] **Step 8: Create Next.js middleware**

```typescript
// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 9: Create base TypeScript types for DB**

```typescript
// src/lib/types/database.ts
export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER'

export type RelationshipType =
  | 'PARENT_CHILD'
  | 'UNION'
  | 'ADOPTION'
  | 'SIBLING'
  | 'HALF_SIBLING'
  | 'STEP'

export type DocumentType =
  | 'ACTE_NAISSANCE'
  | 'ACTE_MARIAGE'
  | 'ACTE_DECES'
  | 'AUTRE'

export interface Person {
  id: string
  prenom: string
  nom: string
  date_naissance: string | null
  lieu_naissance: string | null
  lat_naissance: number | null
  lon_naissance: number | null
  date_deces: string | null
  lieu_deces: string | null
  lat_deces: number | null
  lon_deces: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Relationship {
  id: string
  person_a_id: string
  person_b_id: string
  type: RelationshipType
  metadata: Record<string, unknown>
}

export interface Branch {
  id: string
  nom: string
  couleur: string
  description: string | null
  created_by: string
  created_at: string
}

export interface PersonBranch {
  person_id: string
  branch_id: string
}

export interface Document {
  id: string
  person_id: string
  nom: string
  type: DocumentType
  url_stockage: string
  taille_bytes: number
  uploaded_by: string
  created_at: string
}

export interface TreeMember {
  user_id: string
  role: Role
  invited_at: string
  invited_by: string
}

// Graph representation for views
export interface GraphNode {
  id: string
  data: Person & { branches: Branch[] }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: RelationshipType
  metadata: Record<string, unknown>
}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add Supabase clients, middleware auth guard, and base DB types"
```

---

## Chunk 2: Database Schema

### File Map

| File | Responsibility |
|------|---------------|
| `supabase/migrations/001_initial_schema.sql` | All tables, enums, indexes |
| `supabase/migrations/002_rls_policies.sql` | Row Level Security policies |
| `supabase/migrations/003_storage_bucket.sql` | Supabase Storage bucket for documents |

---

### Task 3: Database migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/migrations/002_rls_policies.sql`
- Create: `supabase/migrations/003_storage_bucket.sql`

- [ ] **Step 1: Create migrations directory**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Write initial schema migration**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enums
CREATE TYPE relationship_type AS ENUM (
  'PARENT_CHILD', 'UNION', 'ADOPTION', 'SIBLING', 'HALF_SIBLING', 'STEP'
);

CREATE TYPE document_type AS ENUM (
  'ACTE_NAISSANCE', 'ACTE_MARIAGE', 'ACTE_DECES', 'AUTRE'
);

CREATE TYPE member_role AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- Person
CREATE TABLE person (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom          TEXT NOT NULL,
  nom             TEXT NOT NULL,
  date_naissance  DATE,
  lieu_naissance  TEXT,
  lat_naissance   DOUBLE PRECISION,
  lon_naissance   DOUBLE PRECISION,
  date_deces      DATE,
  lieu_deces      TEXT,
  lat_deces       DOUBLE PRECISION,
  lon_deces       DOUBLE PRECISION,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relationship
CREATE TABLE relationship (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_a_id  UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  person_b_id  UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  type         relationship_type NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT no_self_relation CHECK (person_a_id <> person_b_id)
);

CREATE INDEX idx_relationship_a ON relationship(person_a_id);
CREATE INDEX idx_relationship_b ON relationship(person_b_id);

-- Branch
CREATE TABLE branch (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         TEXT NOT NULL,
  couleur     TEXT NOT NULL DEFAULT '#7ec8e3',
  description TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Person ↔ Branch (many-to-many)
CREATE TABLE person_branch (
  person_id  UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  branch_id  UUID NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, branch_id)
);

-- Document
CREATE TABLE document (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id      UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  type           document_type NOT NULL,
  url_stockage   TEXT NOT NULL,
  taille_bytes   INTEGER NOT NULL CHECK (taille_bytes <= 20971520),
  uploaded_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_person ON document(person_id);

-- Tree members (permissions)
CREATE TABLE tree_member (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        member_role NOT NULL DEFAULT 'VIEWER',
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by  UUID REFERENCES auth.users(id)
);

-- Auto-update updated_at on person
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER person_updated_at
  BEFORE UPDATE ON person
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 3: Write RLS policies migration**

```sql
-- supabase/migrations/002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE person ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_branch ENABLE ROW LEVEL SECURITY;
ALTER TABLE document ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_member ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS member_role AS $$
  SELECT role FROM tree_member WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PERSON policies
-- SELECT: any tree member
CREATE POLICY person_select ON person FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

-- INSERT: ADMIN or EDITOR
CREATE POLICY person_insert ON person FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

-- UPDATE: ADMIN or EDITOR
CREATE POLICY person_update ON person FOR UPDATE
  USING (current_user_role() IN ('ADMIN', 'EDITOR'))
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

-- DELETE: ADMIN only
CREATE POLICY person_delete ON person FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- RELATIONSHIP policies (same pattern)
CREATE POLICY relationship_select ON relationship FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY relationship_insert ON relationship FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY relationship_update ON relationship FOR UPDATE
  USING (current_user_role() IN ('ADMIN', 'EDITOR'))
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY relationship_delete ON relationship FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- BRANCH policies
CREATE POLICY branch_select ON branch FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY branch_insert ON branch FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY branch_update ON branch FOR UPDATE
  USING (current_user_role() IN ('ADMIN', 'EDITOR'))
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY branch_delete ON branch FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- PERSON_BRANCH policies (follow branch permissions)
CREATE POLICY person_branch_select ON person_branch FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY person_branch_insert ON person_branch FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY person_branch_delete ON person_branch FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- DOCUMENT policies
CREATE POLICY document_select ON document FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY document_insert ON document FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY document_delete ON document FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- TREE_MEMBER policies
-- SELECT: any authenticated user can see if they're a member
CREATE POLICY tree_member_select ON tree_member FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: ADMIN only
CREATE POLICY tree_member_insert ON tree_member FOR INSERT
  WITH CHECK (current_user_role() = 'ADMIN');

-- UPDATE: ADMIN only
CREATE POLICY tree_member_update ON tree_member FOR UPDATE
  USING (current_user_role() = 'ADMIN')
  WITH CHECK (current_user_role() = 'ADMIN');

-- DELETE: ADMIN only
CREATE POLICY tree_member_delete ON tree_member FOR DELETE
  USING (current_user_role() = 'ADMIN');
```

- [ ] **Step 4: Write Storage bucket migration**

```sql
-- supabase/migrations/003_storage_bucket.sql

-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage RLS: tree members can read
CREATE POLICY documents_read ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid())
  );

-- Storage RLS: EDITOR and ADMIN can upload
CREATE POLICY documents_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND current_user_role() IN ('ADMIN', 'EDITOR')
  );

-- Storage RLS: ADMIN can delete
CREATE POLICY documents_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND current_user_role() = 'ADMIN'
  );
```

- [ ] **Step 5: Apply migrations to Supabase**

```bash
# Option A — Supabase Cloud dashboard: paste each migration in the SQL editor
# Option B — Supabase CLI (if installed):
npx supabase db push
# OR run each file manually:
# npx supabase db execute --file supabase/migrations/001_initial_schema.sql
```

Expected: no errors. Tables visible in the Supabase dashboard Table Editor.

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migrations (tables, RLS, storage)"
```

---

## Chunk 3: Auth Pages & UI Shell

### File Map

| File | Responsibility |
|------|---------------|
| `src/app/(auth)/login/page.tsx` | Login form |
| `src/app/(auth)/signup/page.tsx` | Signup form |
| `src/app/(auth)/accept-invite/page.tsx` | Accept invite, set password |
| `src/app/auth/callback/route.ts` | Supabase OAuth callback handler |
| `src/app/(app)/layout.tsx` | Protected layout (topbar + sidebar + detail panel slot) |
| `src/app/(app)/tree/page.tsx` | Main tree page (empty canvas for now) |
| `src/app/page.tsx` | Root redirect → /tree |
| `src/components/layout/Topbar.tsx` | Top navigation bar |
| `src/components/layout/Sidebar.tsx` | Left sidebar (branches + filters) |
| `src/components/layout/DetailPanel.tsx` | Right detail panel (context-driven) |
| `src/components/ui/Button.tsx` | Base button component |
| `src/components/ui/Input.tsx` | Base input component |
| `src/server-actions/auth.ts` | Login, signup, signout server actions |

---

### Task 4: Auth pages

**Files:**
- Create: `src/server-actions/auth.ts`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/accept-invite/page.tsx`
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Write failing test for auth server actions**

```typescript
// src/server-actions/__tests__/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  })),
}))

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('auth server actions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('login calls signInWithPassword with correct credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    const { login } = await import('../auth')
    const form = new FormData()
    form.set('email', 'test@example.com')
    form.set('password', 'password123')
    await login(form)
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('login returns error message on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    const { login } = await import('../auth')
    const form = new FormData()
    form.set('email', 'bad@example.com')
    form.set('password', 'wrong')
    const result = await login(form)
    expect(result).toEqual({ error: 'Invalid credentials' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/server-actions/__tests__/auth.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement auth server actions**

```typescript
// src/server-actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/tree')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  return { success: 'Vérifiez votre email pour confirmer votre compte.' }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/server-actions/__tests__/auth.test.ts
```
Expected: PASS.

- [ ] **Step 5: Install utility dependencies first**

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 5b: Create `cn` utility**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5c: Create base UI components**

```typescript
// src/components/ui/Button.tsx
'use client'
import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-red-500 text-white hover:bg-red-600',
        variant === 'ghost' && 'text-gray-400 hover:text-white hover:bg-white/10',
        variant === 'danger' && 'bg-red-900/50 text-red-400 hover:bg-red-900',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

```typescript
// src/components/ui/Input.tsx
import { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs text-gray-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'bg-[#0d1117] border border-[#1e3a5f] rounded-md px-3 py-2 text-sm text-white',
          'placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition-colors',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 6: Create login page**

```typescript
// src/app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { login } from '@/server-actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await login(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-[#080d16] border border-[#1e3a5f] rounded-xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🌳</div>
          <h1 className="text-xl font-bold text-white">Généalogie</h1>
          <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre arbre</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" id="email" name="email" type="email" required placeholder="vous@exemple.com" />
          <Input label="Mot de passe" id="password" name="password" type="password" required placeholder="••••••••" />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-blue-400 hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create signup page**

```typescript
// src/app/(auth)/signup/page.tsx
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { signup } from '@/server-actions/auth'
import Link from 'next/link'

export default function SignupPage() {
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const result = await signup(new FormData(e.currentTarget))
    setMessage(result ?? null)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-[#080d16] border border-[#1e3a5f] rounded-xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🌳</div>
          <h1 className="text-xl font-bold text-white">Créer un compte</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" id="email" name="email" type="email" required placeholder="vous@exemple.com" />
          <Input label="Mot de passe" id="password" name="password" type="password" required placeholder="8 caractères minimum" minLength={8} />
          {message?.error && <p className="text-sm text-red-400 text-center">{message.error}</p>}
          {message?.success && <p className="text-sm text-green-400 text-center">{message.success}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create accept-invite page**

```typescript
// src/app/(auth)/accept-invite/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/tree')
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-[#080d16] border border-[#1e3a5f] rounded-xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🌳</div>
          <h1 className="text-xl font-bold text-white">Bienvenue !</h1>
          <p className="text-sm text-gray-500 mt-1">Choisissez votre mot de passe pour accéder à l'arbre.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nouveau mot de passe" id="password" type="password" required
            value={password} onChange={e => setPassword(e.target.value)} minLength={8} />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Accéder à l\'arbre'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Create auth callback route**

```typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/tree`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add auth pages (login, signup, accept-invite) and callback route"
```

---

### Task 5: App layout & UI shell

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/tree/page.tsx`
- Create: `src/components/layout/Topbar.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/DetailPanel.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Write failing test for Topbar**

```typescript
// src/components/layout/__tests__/Topbar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Topbar } from '../Topbar'

vi.mock('@/server-actions/auth', () => ({ signout: vi.fn() }))

describe('Topbar', () => {
  it('renders app name', () => {
    render(<Topbar userEmail="test@example.com" />)
    expect(screen.getByText(/généalogie/i)).toBeInTheDocument()
  })

  it('renders all view tabs', () => {
    render(<Topbar userEmail="test@example.com" />)
    expect(screen.getByText(/cosmos/i)).toBeInTheDocument()
    expect(screen.getByText(/sablier/i)).toBeInTheDocument()
    expect(screen.getByText(/timeline/i)).toBeInTheDocument()
    expect(screen.getByText(/carte/i)).toBeInTheDocument()
    expect(screen.getByText(/éventail/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/layout/__tests__/Topbar.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement Topbar**

```typescript
// src/components/layout/Topbar.tsx
'use client'
import { signout } from '@/server-actions/auth'

type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'

interface TopbarProps {
  userEmail: string
  activeView?: View
  onViewChange?: (view: View) => void
}

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'cosmos', label: 'Cosmos', icon: '🌌' },
  { id: 'sablier', label: 'Sablier', icon: '⧖' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'carte', label: 'Carte', icon: '🗺' },
  { id: 'eventail', label: 'Éventail', icon: '🌀' },
]

export function Topbar({ userEmail, activeView = 'cosmos', onViewChange }: TopbarProps) {
  const initials = userEmail.slice(0, 2).toUpperCase()

  return (
    <header className="h-12 bg-[#0d1117] border-b border-[#1e3a5f] flex items-center px-4 gap-4 shrink-0">
      {/* Logo */}
      <div className="text-red-500 font-bold text-sm tracking-widest uppercase mr-2">
        🌳 Généalogie
      </div>

      {/* View tabs */}
      <nav className="flex items-center gap-1">
        {VIEWS.map(view => (
          <button
            key={view.id}
            onClick={() => onViewChange?.(view.id)}
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

      {/* Add button */}
      <button className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors">
        + Ajouter
      </button>

      {/* Search */}
      <button className="text-gray-500 hover:text-gray-300 text-sm">🔍</button>

      {/* Avatar + signout — Server Action must be called via form action */}
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

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/layout/__tests__/Topbar.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Implement Sidebar**

```typescript
// src/components/layout/Sidebar.tsx
'use client'

export function Sidebar() {
  return (
    <aside className="w-48 bg-[#080d16] border-r border-[#1e3a5f] flex flex-col gap-1 p-3 overflow-y-auto shrink-0">
      {/* Branches section */}
      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Branches</div>
      <button className="text-left text-xs text-blue-300 bg-blue-900/20 px-2 py-1.5 rounded border-l-2 border-blue-400">
        🌿 Toutes les branches
      </button>

      {/* Branch list — populated dynamically in Plan 2 */}
      <div className="text-xs text-gray-600 px-2 py-1 italic">Aucune branche</div>
      <button className="text-left text-[10px] text-gray-600 px-2 py-1 hover:text-gray-400">
        + Nouvelle branche
      </button>

      <div className="flex-1" />

      {/* Filters section */}
      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 mt-3">Filtres</div>
      <label className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input type="checkbox" className="accent-green-500" /> Vivants
      </label>
      <label className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input type="checkbox" className="accent-gray-400" /> Décédés
      </label>
      <label className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input type="checkbox" className="accent-yellow-500" /> Avec documents
      </label>

      <div className="border-t border-[#1e3a5f] mt-3 pt-3">
        <button className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">👥 Gérer les accès</button>
        <button className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">⚙️ Paramètres</button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Implement DetailPanel**

```typescript
// src/components/layout/DetailPanel.tsx
'use client'

interface DetailPanelProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
}

export function DetailPanel({ isOpen, onClose, children }: DetailPanelProps) {
  if (!isOpen) return null

  return (
    <aside className="w-56 bg-[#080d16] border-l border-[#1e3a5f] flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b border-[#1e3a5f]">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Détail</span>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xs">✕</button>
      </div>
      <div className="p-3 flex-1">
        {children ?? (
          <p className="text-xs text-gray-600 italic">Sélectionnez une personne</p>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 7: Create root redirect**

```typescript
// src/app/page.tsx
import { redirect } from 'next/navigation'
export default function RootPage() { redirect('/tree') }
```

- [ ] **Step 8: Create root layout**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Généalogie',
  description: 'Arbre généalogique collaboratif',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#050a14] text-white antialiased">{children}</body>
    </html>
  )
}
```

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
html, body { height: 100%; }
```

- [ ] **Step 9: Create app layout (protected)**

```typescript
// src/app/(app)/layout.tsx
'use client'
// Note: auth check is handled by middleware (src/middleware.ts).
// This layout provides the persistent UI shell.
// DetailPanel visibility and selected person state will be wired in Plan 2.
// View switching (activeView) will be wired in Plan 3.
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { DetailPanel } from '@/components/layout/DetailPanel'
import { useState } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar userEmail="" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">{children}</main>
        <DetailPanel isOpen={detailOpen} onClose={() => setDetailOpen(false)} />
      </div>
    </div>
  )
}
```

> **Note:** `userEmail` is passed as empty string here; Plan 2 will lift user state via a React context or server component wrapper once we have the full data layer.
```

- [ ] **Step 10: Create tree page (empty canvas)**

```typescript
// src/app/(app)/tree/page.tsx
export default function TreePage() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🌳</div>
        <h2 className="text-xl font-semibold text-white mb-2">Votre arbre vous attend</h2>
        <p className="text-sm text-gray-500 mb-6">Commencez par ajouter la première personne.</p>
        <button className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors">
          + Ajouter une personne
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 11: Run all tests**

```bash
npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 12: Start dev server and verify visually**

```bash
npm run dev
```

Navigate to `http://localhost:3000`:
- Should redirect to `/login`
- Login form should render with dark theme
- After login: should show topbar + sidebar + empty tree canvas
- All 5 view tabs visible in topbar

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add app layout shell (topbar, sidebar, detail panel, empty tree page)"
```

---

## End of Plan 1

**Plan 1 delivers:**
- ✅ Next.js 14 project with TypeScript + Tailwind
- ✅ Supabase schema (all tables, RLS policies, storage bucket)
- ✅ Auth flow (login, signup, invite acceptance, middleware guard)
- ✅ UI shell (topbar, sidebar, detail panel, empty tree canvas)
- ✅ Base TypeScript types for all DB entities

**Next:** Plan 2 — Core CRUD (Person, Relationship, Branch, Document)
