# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public landing page at `/` for Genealogy's recherche foncière feature, with waitlist email collection and 6 editorial sections.

**Architecture:** The landing lives in an `(landing)/` route group with its own layout (Instrument Serif + Inter fonts, cream background, no ThemeProvider). Root layout is refactored to be neutral (no dark styles, no ThemeProvider) since `(app)/` already wraps its own auth + AppShell. A Supabase `waitlist_signups` table stores emails. Two client islands: `<HeroFormPreview />` (typewriter animation) and `<WaitlistForm />` (email submission with inline state). All other sections are server components.

**Tech Stack:** Next.js 16.2.1 (App Router), React 19, TypeScript, Tailwind CSS v4 (CSS-based config), Supabase (cloud Frankfurt), Vitest

**Spec:** `docs/superpowers/specs/2026-04-09-landing-page-design.md`

**Critical Next.js 16 notes:**
- Tailwind v4: no `tailwind.config.ts`. Tokens go in `src/app/globals.css` via `@theme { }` blocks.
- Fonts: `next/font/google` works as expected.
- Server actions: `'use server'` at top of file or function.
- Route groups: `(landing)/` isolates layout. Root layout still applies above it.
- Metadata: `export const metadata: Metadata = { ... }` or `generateMetadata()` — params are Promises.

---

## Chunk 1: Foundation

### Task 1: Refactor root layout — remove ThemeProvider and dark styles

The root layout currently wraps ALL routes in `ThemeProvider` with a dark body fallback `#050a14`. This must be neutralized so the landing page gets a clean canvas. Auth pages already hardcode their own dark styles. The `(app)/layout.tsx` already wraps in AppShell.

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Read the current root layout to confirm state**

Run: `cat src/app/layout.tsx`

- [ ] **Step 2: Modify root layout — remove ThemeProvider, neutralize body**

```tsx
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Wrap ThemeProvider inside (app)/layout.tsx**

At the top of `src/app/(app)/layout.tsx`, add:
```tsx
import { ThemeProvider } from '@/lib/context/theme-context'
```

Wrap the existing return value in ThemeProvider. The `(app)/layout.tsx` is a server component which is fine — server components can render client components as children. The full return becomes:

```tsx
return (
  <ThemeProvider>
    <AppShell
      userEmail={user.email ?? ''}
      initialPersons={(persons ?? []) as Person[]}
      initialBranches={(branches ?? []) as Branch[]}
      initialRelationships={(relationships ?? []) as Relationship[]}
      initialPersonBranches={(personBranches ?? []) as PersonBranch[]}
      currentRole={currentRole}
      initialMembers={(membersData ?? []) as MemberWithUser[]}
      initialPendingSuggestions={pendingSuggestionsData}
    />
  </ThemeProvider>
)
```

- [ ] **Step 4: Verify the app still works**

Run: `npx next dev -p 3001` and open http://localhost:3001/tree — verify AppShell renders with warm-light theme, no visual regression. Check `/login` still shows dark background (it hardcodes its own styles).

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/\(app\)/layout.tsx
git commit -m "refactor: move ThemeProvider from root layout into (app) layout

Root layout is now neutral (no theme, no dark body styles) so the
landing page route group can have its own visual identity.
Auth pages already hardcode their own dark styles."
```

---

### Task 2: Add landing Tailwind tokens via CSS @theme

Tailwind v4 uses CSS-based config. Add landing-specific tokens.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add landing tokens to globals.css**

Append after `@import "tailwindcss";`:

```css
@import "tailwindcss";

@theme {
  --color-landing-cream: #f4f1ea;
  --color-landing-cream-deep: #e6dfcf;
  --color-landing-ink: #1a1815;
  --color-landing-ink-soft: #4a4641;
  --color-landing-violet: #7c3aed;
  --color-landing-violet-soft: #ede9fe;
  --color-landing-bg: #d9d4c9;
}

* { box-sizing: border-box; }
html, body { height: 100%; }
```

These generate Tailwind utilities like `bg-landing-cream`, `text-landing-ink`, etc.

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add landing page Tailwind v4 color tokens"
```

---

### Task 3: Create landing lib files — brand, data, server action

**Files:**
- Create: `src/app/(landing)/lib/brand.ts`
- Create: `src/app/(landing)/data/typewriter-examples.ts`
- Create: `src/app/(landing)/lib/waitlist-action.ts`

- [ ] **Step 1: Create brand constant**

```ts
// src/app/(landing)/lib/brand.ts
export const BRAND_NAME = 'Genealogy'
```

- [ ] **Step 2: Create typewriter examples data**

```ts
// src/app/(landing)/data/typewriter-examples.ts
export interface TypewriterExample {
  demandeur: string
  personne: string
  immeuble: string
}

export const examples: TypewriterExample[] = [
  {
    demandeur: 'Pierre Dupont',
    personne: 'DUPONT Antoine — 12/03/1892 à Marseille',
    immeuble: 'MARSEILLE — 38 avenue Foch · section E n°68',
  },
  {
    demandeur: 'Camille Duval',
    personne: 'DUVAL Marguerite — 04/07/1923 à Lyon',
    immeuble: 'LYON 6e — 14 rue Vauban · section CK n°122',
  },
  {
    demandeur: 'Théo Lefebvre',
    personne: 'LEFEBVRE Henri — 22/11/1908 à Lille',
    immeuble: 'ROUBAIX — 7 place de la Liberté · section AB n°45',
  },
  {
    demandeur: 'Léa Martin',
    personne: 'MARTIN Jeanne — 18/05/1936 à Bordeaux',
    immeuble: 'BORDEAUX — 22 cours Pasteur · section MX n°9',
  },
]
```

- [ ] **Step 3: Create waitlist server action**

```ts
// src/app/(landing)/lib/waitlist-action.ts
'use server'

import { createClient } from '@/lib/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_SOURCES = ['hero', 'cta'] as const

type WaitlistResult = { ok: true } | { ok: false; error: 'invalid_email' | 'server_error' }

export async function submitWaitlist({
  email,
  source,
}: {
  email: string
  source: string
}): Promise<WaitlistResult> {
  const normalized = email.trim().toLowerCase()

  if (!EMAIL_REGEX.test(normalized)) {
    return { ok: false, error: 'invalid_email' }
  }

  const validSource = (VALID_SOURCES as readonly string[]).includes(source) ? source : 'hero'

  try {
    const supabase = await createClient()
    await supabase
      .from('waitlist_signups')
      .upsert(
        { email: normalized, source: validSource },
        { onConflict: 'email', ignoreDuplicates: true }
      )
    return { ok: true }
  } catch {
    return { ok: false, error: 'server_error' }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(landing\)/lib/ src/app/\(landing\)/data/
git commit -m "feat: add landing lib files (brand, typewriter data, waitlist action)"
```

---

### Task 4: Create Supabase waitlist_signups table

**Files:**
- Create: `supabase/migrations/20260410_waitlist_signups.sql` (or run directly via Supabase dashboard)

- [ ] **Step 1: Write and run migration**

```sql
-- Create waitlist_signups table
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text default 'hero',
  created_at timestamptz default now()
);

-- Plain unique constraint on email (emails are normalized to lowercase before insert)
alter table public.waitlist_signups
  add constraint waitlist_signups_email_unique unique (email);

-- RLS: anyone can insert, only service role can read/update/delete
alter table public.waitlist_signups enable row level security;

create policy "Anyone can insert waitlist signups"
  on public.waitlist_signups for insert
  to anon, authenticated
  with check (true);

create policy "Only service role can read waitlist signups"
  on public.waitlist_signups for select
  to service_role
  using (true);
```

Run this SQL via the Supabase dashboard SQL editor, or if using Supabase CLI:
```bash
npx supabase db push
```

- [ ] **Step 2: Test the insert works**

Via Supabase dashboard → SQL editor:
```sql
insert into waitlist_signups (email, source) values ('test@example.com', 'hero');
select * from waitlist_signups;
delete from waitlist_signups where email = 'test@example.com';
```

- [ ] **Step 3: Commit migration file (if using file-based migrations)**

```bash
git add supabase/
git commit -m "feat: add waitlist_signups table with RLS"
```

---

## Chunk 2: Landing Shell

### Task 5: Create landing layout with fonts

**Files:**
- Create: `src/app/(landing)/layout.tsx`
- Delete: `src/app/page.tsx` (the old redirect)

- [ ] **Step 1: Create (landing)/layout.tsx**

Check `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` for font API confirmation, then:

```tsx
// src/app/(landing)/layout.tsx
import type { Metadata } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import { BRAND_NAME } from './lib/brand'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Retrouvez les biens oubliés de votre famille`,
  description:
    'Genealogy digitalise les formulaires officiels du Service de Publicité Foncière pour vous aider à retrouver les biens immobiliers de votre famille — et leurs anciens propriétaires.',
  openGraph: {
    title: `${BRAND_NAME} — Retrouvez les biens oubliés de votre famille`,
    description:
      'Genealogy digitalise les formulaires officiels du Service de Publicité Foncière pour retrouver les biens immobiliers de votre famille.',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${instrumentSerif.variable} ${inter.variable} font-[family-name:var(--font-inter)]`}
      style={{ background: '#d9d4c9', minHeight: '100vh' }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Delete old root page.tsx and create landing page.tsx stub**

Delete `src/app/page.tsx` (the redirect).

Create `src/app/(landing)/page.tsx`:

```tsx
// src/app/(landing)/page.tsx
export default function LandingPage() {
  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px' }}>
      <h1 style={{ fontFamily: 'var(--font-instrument-serif)', fontSize: 48 }}>
        Landing page en construction
      </h1>
    </main>
  )
}
```

- [ ] **Step 3: Verify routing works**

Run: `npx next dev -p 3001`
- http://localhost:3001/ → should show "Landing page en construction" with Instrument Serif font on cream/beige background
- http://localhost:3001/tree → should still redirect to login (or show app if logged in)
- http://localhost:3001/login → should still show dark login page

- [ ] **Step 4: Commit**

```bash
git add src/app/\(landing\)/layout.tsx src/app/\(landing\)/page.tsx
git rm src/app/page.tsx
git commit -m "feat: add landing route group with layout and fonts"
```

---

### Task 6: Create WaitlistForm client component

**Files:**
- Create: `src/app/(landing)/components/WaitlistForm.tsx`

- [ ] **Step 1: Write the WaitlistForm component**

```tsx
// src/app/(landing)/components/WaitlistForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { submitWaitlist } from '../lib/waitlist-action'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: 'Cet email ne semble pas valide.',
  server_error: 'Une erreur est survenue, réessayez.',
}

export function WaitlistForm({ source = 'hero' }: { source?: 'hero' | 'cta' }) {
  const [state, setState] = useState<FormState>('idle')
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    const result = await submitWaitlist({ email, source })

    if (result.ok) {
      setState('success')
    } else {
      setState('error')
      setErrorMsg(ERROR_MESSAGES[result.error] || ERROR_MESSAGES.server_error)
    }
  }

  if (state === 'success') {
    return (
      <div
        className="flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-medium"
        style={{
          background: '#e6dfcf',
          color: '#1a1815',
          maxWidth: source === 'cta' ? 480 : 440,
        }}
      >
        ✓ Merci, on vous écrit dès l'ouverture.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: source === 'cta' ? 480 : 440 }}>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 rounded-full border p-1.5"
        style={{
          background: '#fff',
          borderColor: 'rgba(0,0,0,0.08)',
          boxShadow: '0 4px 14px -8px rgba(0,0,0,0.15)',
        }}
      >
        <label htmlFor={`waitlist-email-${source}`} className="sr-only">
          Votre email
        </label>
        <input
          id={`waitlist-email-${source}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@email.com"
          required
          className="flex-1 border-none bg-transparent px-4 py-3 text-sm outline-none"
          style={{ color: '#1a1815', fontFamily: 'var(--font-inter)' }}
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="rounded-full px-5 py-3 text-sm font-medium"
          style={{
            background: source === 'cta' ? '#1a1815' : '#1a1815',
            color: '#f4f1ea',
            fontFamily: 'var(--font-inter)',
            opacity: state === 'submitting' ? 0.7 : 1,
          }}
        >
          {state === 'submitting' ? 'Inscription…' : 'Rejoindre la waitlist'}
        </button>
      </form>
      {state === 'error' && (
        <p className="mt-2 text-xs" style={{ color: '#dc2626', paddingLeft: 18 }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(landing\)/components/WaitlistForm.tsx
git commit -m "feat: add WaitlistForm client component with inline states"
```

---

### Task 7: Create LandingTopbar with auth switch

**Files:**
- Create: `src/app/(landing)/components/LandingTopbar.tsx`

- [ ] **Step 1: Write the LandingTopbar component**

```tsx
// src/app/(landing)/components/LandingTopbar.tsx
import Link from 'next/link'
import { BRAND_NAME } from '../lib/brand'

interface LandingTopbarProps {
  isAuthenticated: boolean
}

export function LandingTopbar({ isAuthenticated }: LandingTopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-9 py-5"
      style={{ position: 'relative', zIndex: 10 }}
    >
      <div
        className="text-2xl"
        style={{ fontFamily: 'var(--font-instrument-serif)', color: '#1a1815' }}
      >
        {BRAND_NAME}
        <span style={{ color: '#7c3aed' }}>.</span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#4a4641' }}>
        <a href="#comment-ca-marche">Comment ça marche</a>
        <a href="#formulaires">Les formulaires</a>
        <a href="#faq">FAQ</a>
      </nav>
      {isAuthenticated ? (
        <Link
          href="/tree"
          className="rounded-full border px-4 py-2 text-xs font-medium"
          style={{ borderColor: '#1a1815', color: '#1a1815' }}
        >
          Accéder à mon arbre →
        </Link>
      ) : (
        <a
          href="#waitlist"
          className="rounded-full border px-4 py-2 text-xs font-medium"
          style={{ borderColor: '#1a1815', color: '#1a1815' }}
        >
          Rejoindre la waitlist →
        </a>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(landing\)/components/LandingTopbar.tsx
git commit -m "feat: add LandingTopbar with auth-aware CTA switch"
```

---

## Chunk 3: Hero Section

### Task 8: Create HeroFormPreview with typewriter animation

**Files:**
- Create: `src/app/(landing)/components/HeroFormPreview.tsx`

- [ ] **Step 1: Write the HeroFormPreview client component**

This is the most complex client component. It renders the stylized Cerfa 3233 card and runs the typewriter animation cycling through 4 example sets.

```tsx
// src/app/(landing)/components/HeroFormPreview.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { examples } from '../data/typewriter-examples'

function useTypewriterCycle() {
  const [fields, setFields] = useState({ demandeur: '', personne: '', immeuble: '' })
  const [activeCaret, setActiveCaret] = useState<string | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    // Disable on mobile or reduced-motion
    const mq = window.matchMedia('(min-width: 768px)')
    const rmq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mq.matches || rmq.matches) {
      setFields({
        demandeur: examples[0].demandeur,
        personne: examples[0].personne,
        immeuble: examples[0].immeuble,
      })
      return
    }
    setIsEnabled(true)
  }, [])

  useEffect(() => {
    if (!isEnabled) return
    cancelRef.current = false

    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

    const typeField = async (field: string, text: string) => {
      for (let i = 1; i <= text.length; i++) {
        if (cancelRef.current) return
        setActiveCaret(field)
        setFields((prev) => ({ ...prev, [field]: text.slice(0, i) }))
        await wait(28 + Math.random() * 30)
      }
      setActiveCaret(null)
    }

    const eraseField = async (field: string) => {
      setActiveCaret(field)
      const getText = () =>
        new Promise<string>((resolve) =>
          setFields((prev) => {
            resolve(prev[field as keyof typeof prev])
            return prev
          })
        )
      let text = await getText()
      while (text.length > 0) {
        if (cancelRef.current) return
        text = text.slice(0, -1)
        setFields((prev) => ({ ...prev, [field]: text }))
        await wait(14)
      }
      setActiveCaret(null)
    }

    async function loop() {
      let idx = 0
      while (!cancelRef.current) {
        const ex = examples[idx]
        await typeField('demandeur', ex.demandeur)
        await wait(180)
        await typeField('personne', ex.personne)
        await wait(180)
        await typeField('immeuble', ex.immeuble)
        await wait(3000)
        await eraseField('immeuble')
        await eraseField('personne')
        await eraseField('demandeur')
        await wait(250)
        idx = (idx + 1) % examples.length
      }
    }

    loop()
    return () => { cancelRef.current = true }
  }, [isEnabled])

  return { fields, activeCaret }
}

function Caret({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 1,
        height: '0.95em',
        background: '#7c3aed',
        verticalAlign: -2,
        marginLeft: 1,
        opacity: active ? 1 : 0,
        animation: active ? 'blink 1s steps(1) infinite' : 'none',
      }}
    />
  )
}

export function HeroFormPreview() {
  const { fields, activeCaret } = useTypewriterCycle()

  return (
    <>
      <style>{`@keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }`}</style>
      <div
        style={{
          background: '#fff',
          borderRadius: 10,
          padding: '22px 22px 26px',
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 30px 60px -30px rgba(0,0,0,0.18), 0 8px 24px -12px rgba(124,58,237,0.18)',
          transform: 'rotate(-1.4deg)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 18,
            paddingBottom: 14,
            borderBottom: '1px solid #ece9e2',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-instrument-serif)', fontSize: 22, color: '#1a1815' }}>
              Cerfa 3233
            </div>
            <div style={{ fontSize: 10, color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 6 }}>
              Demande de renseignements
            </div>
          </div>
          <span
            style={{
              background: '#ede9fe',
              color: '#7c3aed',
              fontSize: 10,
              padding: '4px 9px',
              borderRadius: 999,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Pré-rempli
          </span>
        </div>

        {/* Fields */}
        {[
          { label: 'Demandeur', key: 'demandeur' as const },
          { label: 'Personne recherchée', key: 'personne' as const },
          { label: 'Immeuble', key: 'immeuble' as const },
        ].map(({ label, key }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8a8680', marginBottom: 4 }}>
              {label}
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#7c3aed',
                fontWeight: 500,
                background: '#ede9fe',
                padding: '8px 12px',
                borderRadius: 5,
                border: '1px solid #ddd6fe',
                minHeight: '1.2em',
              }}
            >
              {fields[key]}
              <Caret active={activeCaret === key} />
            </div>
          </div>
        ))}

        {/* Static period field */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8a8680', marginBottom: 4 }}>
            Période de délivrance
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#1a1815',
              background: '#faf8f4',
              padding: '8px 12px',
              borderRadius: 5,
              border: '1px solid #ece9e2',
            }}
          >
            depuis le 1er janvier 1956
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid #ece9e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#7c3aed', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
            ✓ Prêt à envoyer
          </span>
          <span
            style={{
              background: '#1a1815',
              color: '#f4f1ea',
              fontSize: 11,
              padding: '6px 14px',
              borderRadius: 999,
              fontWeight: 500,
            }}
          >
            Envoyer au SPF
          </span>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify typewriter works**

Open http://localhost:3001/ — temporarily import HeroFormPreview in the stub page to test the animation plays and respects `prefers-reduced-motion`.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(landing\)/components/HeroFormPreview.tsx
git commit -m "feat: add HeroFormPreview with typewriter animation"
```

---

### Task 9: Create HeroSection and wire it

**Files:**
- Create: `src/app/(landing)/components/HeroSection.tsx`

- [ ] **Step 1: Write HeroSection (server component)**

```tsx
// src/app/(landing)/components/HeroSection.tsx
import { HeroFormPreview } from './HeroFormPreview'
import { WaitlistForm } from './WaitlistForm'

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden rounded-[14px]"
      style={{
        background: '#f4f1ea',
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.18)',
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div
        className="grid gap-14 px-9 py-10 md:py-14"
        style={{ gridTemplateColumns: '1.35fr 1fr', alignItems: 'end', position: 'relative', zIndex: 2 }}
      >
        {/* Left column */}
        <div>
          {/* Eyebrow */}
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] uppercase"
            style={{
              letterSpacing: '0.16em',
              color: '#4a4641',
              background: 'rgba(255,255,255,0.55)',
              borderColor: 'rgba(0,0,0,0.06)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#7c3aed' }} />
            Recherche foncière digitalisée
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: 'var(--font-instrument-serif)',
              fontSize: 92,
              lineHeight: 0.92,
              letterSpacing: '-0.025em',
              color: '#1a1815',
              margin: '0 0 28px',
              fontWeight: 400,
            }}
          >
            Et si votre famille
            <br />
            avait <em style={{ fontStyle: 'italic', color: '#7c3aed' }}>oublié</em>
            <br />
            un bien&nbsp;?
          </h1>

          {/* Lede */}
          <p className="mb-8 text-[17px] leading-relaxed" style={{ color: '#4a4641', maxWidth: 480 }}>
            Genealogy digitalise les formulaires officiels du Service de Publicité Foncière pour
            vous aider à retrouver les biens immobiliers de votre famille — et leurs anciens
            propriétaires.
          </p>

          {/* Waitlist form */}
          <WaitlistForm source="hero" />

          {/* RGPD mention */}
          <p className="mt-2 text-xs" style={{ color: '#4a4641', paddingLeft: 18 }}>
            En vous inscrivant, vous acceptez notre{' '}
            <a href="/privacy" className="underline underline-offset-4" style={{ textDecorationColor: 'rgba(124,58,237,0.35)' }}>
              politique de confidentialité
            </a>
            .
          </p>

          {/* Micro-benefits */}
          <p className="mt-3 text-[12px]" style={{ color: '#7a7670', paddingLeft: 18, letterSpacing: '0.02em' }}>
            Pré-rempli depuis votre arbre · Guidé pas à pas · Envoyé sans imprimer
          </p>
        </div>

        {/* Right column — Form preview */}
        <div className="hidden md:block">
          <HeroFormPreview />
        </div>
      </div>

      {/* Footnote */}
      <div
        className="flex justify-between px-9 py-4 text-[11px] uppercase"
        style={{
          letterSpacing: '0.1em',
          color: '#8a8680',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span>Données officielles SPF</span>
        <span style={{ color: '#1a1815' }}>100 services de publicité foncière couverts</span>
        <span>RGPD · Hébergement EU</span>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire HeroSection into landing page**

Update `src/app/(landing)/page.tsx`:

```tsx
// src/app/(landing)/page.tsx
import { createClient } from '@/lib/supabase/server'
import { LandingTopbar } from './components/LandingTopbar'
import { HeroSection } from './components/HeroSection'

export default async function LandingPage() {
  let isAuthenticated = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {}

  return (
    <main className="mx-auto" style={{ maxWidth: 1180, padding: '0 32px 64px' }}>
      <LandingTopbar isAuthenticated={isAuthenticated} />
      <HeroSection />
    </main>
  )
}
```

- [ ] **Step 3: Verify hero renders**

Open http://localhost:3001/ — verify the hero section renders with Instrument Serif font, typewriter animation, waitlist form, and all the editorial styling.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(landing\)/components/HeroSection.tsx src/app/\(landing\)/page.tsx
git commit -m "feat: add HeroSection with typewriter and wire into landing page"
```

---

## Chunk 4: Content Sections

### Task 10: Create visual sub-components

**Files:**
- Create: `src/app/(landing)/components/visuals/PagesStack.tsx`
- Create: `src/app/(landing)/components/visuals/SpfMap.tsx`
- Create: `src/app/(landing)/components/visuals/CalendarWait.tsx`
- Create: `src/app/(landing)/components/visuals/MiniTree.tsx`
- Create: `src/app/(landing)/components/visuals/FormFillBars.tsx`
- Create: `src/app/(landing)/components/visuals/EnvelopeSent.tsx`

These are all small, pure presentational server components. Each renders a CSS/SVG mini-illustration inside a 160px-high container with cream background.

- [ ] **Step 1: Create all 6 visual components**

Reference the validated mockup HTML in `.superpowers/brainstorm/3505-1775750616/` for exact CSS. Each component is a self-contained `div` styled with inline styles matching the mockup.

Key reference:
- `PagesStack` → section-2-problem.html `.v-pages`
- `SpfMap` → section-2-problem.html `.v-map`
- `CalendarWait` → section-2-problem.html `.v-calendar`
- `MiniTree` → section-3-howitworks.html `.v-tree` (SVG viewBox 240x130)
- `FormFillBars` → section-3-howitworks.html `.v-form`
- `EnvelopeSent` → section-3-howitworks.html `.v-send`

Each exports a single default function component. No props needed.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(landing\)/components/visuals/
git commit -m "feat: add 6 landing visual sub-components"
```

---

### Task 11: Create ProblemSection

**Files:**
- Create: `src/app/(landing)/components/ProblemSection.tsx`

- [ ] **Step 1: Write ProblemSection**

Server component. Uses the shared editorial structure (section wrapper, section head, 3 pain cards). Imports visual sub-components.

Reference the validated copy from `docs/superpowers/specs/2026-04-09-landing-page-design.md` §4 Section 2.

Key structure:
- Section wrapper: `rounded-[14px] bg-landing-cream` + dot texture + shadow
- Section head: 2-column grid (title left, lede right)
- 3 pain cards in a 3-column grid
- Footnote centered

Use inline styles for the editorial typography (Instrument Serif sizes, letter-spacing, line-height) as they're specific to this page. Use Tailwind utilities for layout (flex, grid, gap, padding).

- [ ] **Step 2: Wire into page.tsx**

Import and add `<ProblemSection />` after `<HeroSection />`.

- [ ] **Step 3: Verify**

Open http://localhost:3001/ — verify section 2 renders below hero with 3 pain cards.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(landing\)/components/ProblemSection.tsx src/app/\(landing\)/page.tsx
git commit -m "feat: add ProblemSection with 3 pain cards"
```

---

### Task 12: Create HowItWorksSection

**Files:**
- Create: `src/app/(landing)/components/HowItWorksSection.tsx`

- [ ] **Step 1: Write HowItWorksSection**

Same editorial structure as ProblemSection. 3 step cards with visual sub-components (MiniTree, FormFillBars, EnvelopeSent).

Reference copy from spec §4 Section 3. Add `id="comment-ca-marche"` to the section element for nav anchor.

- [ ] **Step 2: Wire into page.tsx**

Import and add `<HowItWorksSection />` after `<ProblemSection />`.

- [ ] **Step 3: Verify**

Open http://localhost:3001/ — verify section 3 renders below section 2 with 3 step cards and correct visuals.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(landing\)/components/HowItWorksSection.tsx src/app/\(landing\)/page.tsx
git commit -m "feat: add HowItWorksSection with 3 step cards"
```

---

### Task 13: Create FormsSection

**Files:**
- Create: `src/app/(landing)/components/FormsSection.tsx`

- [ ] **Step 1: Write FormsSection**

2-column grid with two large Cerfa form cards. Reference copy from spec §4 Section 4. Add `id="formulaires"` for nav anchor.

Each card: violet top border, large serif number, official badge, description, "À utiliser quand" box, chips, price footer.

- [ ] **Step 2: Wire into page.tsx**

Import and add `<FormsSection />` after `<HowItWorksSection />`.

- [ ] **Step 3: Verify**

Open http://localhost:3001/ — verify section 4 renders with 2 large form cards side by side.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(landing\)/components/FormsSection.tsx src/app/\(landing\)/page.tsx
git commit -m "feat: add FormsSection with Cerfa 3233 and 3236 cards"
```

---

### Task 14: Create FaqSection

**Files:**
- Create: `src/app/(landing)/components/FaqSection.tsx`

- [ ] **Step 1: Write FaqSection**

6 Q/A items, all open (no accordion in v1). Reference copy from spec §4 Section 5. Add `id="faq"` for nav anchor.

Each Q/A: question in Instrument Serif 26px, answer in Inter 14px, roman numeral marker. Sources strip at bottom.

- [ ] **Step 2: Wire into page.tsx**

Import and add `<FaqSection />` after `<FormsSection />`.

- [ ] **Step 3: Verify**

Open http://localhost:3001/ — verify section 5 renders with 6 Q/A items, sources strip at bottom, and all links functional.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(landing\)/components/FaqSection.tsx src/app/\(landing\)/page.tsx
git commit -m "feat: add FaqSection with 6 Q/A and sources strip"
```

---

## Chunk 5: CTA, Footer, Privacy & Polish

### Task 15: Create CtaSection

**Files:**
- Create: `src/app/(landing)/components/CtaSection.tsx`

- [ ] **Step 1: Write CtaSection**

Sépia deep background (`#e6dfcf`), centered content, second WaitlistForm instance with `source="cta"`. 3 hardcoded proof numbers. Add `id="waitlist"` for nav anchor.

Reference copy from spec §4 Section 6 CTA bloc.

- [ ] **Step 2: Wire into page.tsx and commit**

```bash
git add src/app/\(landing\)/components/CtaSection.tsx src/app/\(landing\)/page.tsx
git commit -m "feat: add CtaSection with second waitlist form"
```

---

### Task 16: Create LandingFooter

**Files:**
- Create: `src/app/(landing)/components/LandingFooter.tsx`

- [ ] **Step 1: Write LandingFooter**

4-column grid footer. Reference copy from spec §4 Section 6 Footer. Brand + tagline, Produit links, Sources officielles (3 external links), Légal links. Footer-bottom with copyright, contact, "Fait avec soin en France".

Note: Roadmap link points to `#` (no destination yet — parking lot item).

- [ ] **Step 2: Wire into page.tsx and commit**

```bash
git add src/app/\(landing\)/components/LandingFooter.tsx src/app/\(landing\)/page.tsx
git commit -m "feat: add LandingFooter with sources and legal links"
```

---

### Task 17: Create /privacy page

**Files:**
- Create: `src/app/privacy/page.tsx`

- [ ] **Step 1: Write minimal privacy page**

```tsx
// src/app/privacy/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Genealogy',
}

export default function PrivacyPage() {
  return (
    <main
      className="mx-auto px-6 py-16"
      style={{
        maxWidth: 720,
        fontFamily: 'system-ui, sans-serif',
        color: '#1a1815',
        lineHeight: 1.7,
      }}
    >
      <h1 className="mb-8 text-3xl font-bold">Politique de confidentialité</h1>

      <p className="mb-4">Dernière mise à jour : avril 2026</p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">Données collectées</h2>
      <p className="mb-4">
        Lorsque vous vous inscrivez à la waitlist, nous collectons uniquement votre adresse email.
        Cette donnée est utilisée exclusivement pour vous prévenir de l'ouverture du service.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">Hébergement et sécurité</h2>
      <p className="mb-4">
        Vos données sont hébergées en Allemagne (Frankfurt) via Supabase, conforme au RGPD.
        Les données ne sont jamais transférées hors de l'Union Européenne.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">Vos droits</h2>
      <p className="mb-4">
        Vous pouvez demander la suppression de vos données à tout moment en nous contactant
        à <a href="mailto:contact@genealogy.fr" className="underline">contact@genealogy.fr</a>.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">Cookies</h2>
      <p>
        Ce site n'utilise pas de cookies de suivi ni d'analytics.
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/privacy/
git commit -m "feat: add minimal privacy policy page"
```

---

### Task 18: Final wiring — complete landing page.tsx

**Files:**
- Modify: `src/app/(landing)/page.tsx`

- [ ] **Step 1: Wire all sections in order**

```tsx
// src/app/(landing)/page.tsx
import { createClient } from '@/lib/supabase/server'
import { LandingTopbar } from './components/LandingTopbar'
import { HeroSection } from './components/HeroSection'
import { ProblemSection } from './components/ProblemSection'
import { HowItWorksSection } from './components/HowItWorksSection'
import { FormsSection } from './components/FormsSection'
import { FaqSection } from './components/FaqSection'
import { CtaSection } from './components/CtaSection'
import { LandingFooter } from './components/LandingFooter'

export default async function LandingPage() {
  let isAuthenticated = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {}

  return (
    <main className="mx-auto flex flex-col gap-6" style={{ maxWidth: 1180, padding: '0 32px 32px' }}>
      <LandingTopbar isAuthenticated={isAuthenticated} />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FormsSection />
      <FaqSection />
      <CtaSection />
      <LandingFooter />
    </main>
  )
}
```

- [ ] **Step 2: Full visual check**

Open http://localhost:3001/ and scroll through all 6 sections + footer. Verify:
- All sections render with correct typography (Instrument Serif headlines, Inter body)
- Typewriter animation plays on desktop, static on mobile
- Both waitlist forms submit and show inline ✓ Merci state
- Nav anchors (#comment-ca-marche, #formulaires, #faq, #waitlist) scroll correctly
- Auth check: if logged in, topbar shows "Accéder à mon arbre"
- /privacy page loads and links back work
- External source links open in new tab

- [ ] **Step 3: Commit**

```bash
git add src/app/\(landing\)/page.tsx
git commit -m "feat: wire all 6 landing sections together"
```

---

### Task 19: Mobile responsive pass

**Files:**
- Modify: multiple section components

- [ ] **Step 1: Add responsive breakpoints**

Key adjustments needed (check each section):
- Hero H1: `92px` → `~44px` on mobile. Two-column grid → single column.
- Section heads: two-column → single column below `md`
- Pain/step cards: 3-column grid → single column on mobile
- Form cards: 2-column → single column
- FAQ: reduce Q font size
- CTA H2: `84px` → `~40px`
- Footer: 4-column → stack
- HeroFormPreview: hidden on mobile (already `hidden md:block`)

Use Tailwind responsive prefixes (`md:`) for layout changes. Use responsive font sizes via inline style + media queries or CSS classes.

- [ ] **Step 2: Test on 320px, 375px, 768px, 1024px widths**

Use browser DevTools responsive mode. Verify no horizontal overflow, all text readable.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(landing\)/components/
git commit -m "feat: add mobile responsive styles to landing page"
```

---

### Task 20: Final verification against success criteria

Run through spec §10 success criteria:

- [ ] **Step 1: Verify all 9 criteria**

1. ✅ Route `/` renders 6 sections without error — check browser console
2. ✅ Typewriter cycles 4 sets, respects reduced-motion — test in browser
3. ✅ Waitlist submit writes to Supabase — submit test email, check table
4. ✅ Lighthouse scores — run `npx lighthouse http://localhost:3001/ --view`
5. ✅ Source links work — click all 3, verify new tab
6. ✅ Mobile typewriter static — resize to <768px
7. ✅ Auth CTA switch — log in, visit `/`, check topbar
8. ✅ Waitlist states — valid/invalid/duplicate emails
9. ✅ Privacy page accessible — /privacy + links from forms and footer

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Final commit**

```bash
git add src/app/
git commit -m "fix: address final verification issues on landing page"
```
