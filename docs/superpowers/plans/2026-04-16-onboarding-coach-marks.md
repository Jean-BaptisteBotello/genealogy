# Onboarding Coach Marks Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guide first-time users through a 4-step coach mark flow that connects tree-building to form pre-filling, with the "wow" moment at step 2.

**Architecture:** A `useOnboarding` hook manages step state in localStorage and auto-advances on person count changes. A `CoachMark` presentational component renders the dark tooltip with arrow, badge, CTA, and optional children (form preview). A `FormPreviewCard` shows a mini 3-field preview of the selected person's data. AppShell orchestrates by reading hook state and rendering coach marks at the right positions per step.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library, CSS (no external animation libs), localStorage.

**Spec:** `docs/superpowers/specs/2026-04-16-onboarding-coach-marks-design.md`

**Branch:** `feat/onboarding-coach-marks` from `main`

**Pré-requis:** Read `node_modules/next/dist/docs/` before using any Next.js API (see AGENTS.md).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/hooks/useOnboarding.ts` | Hook: step state, localStorage, advance/skip, auto-transitions |
| `src/lib/hooks/__tests__/useOnboarding.test.ts` | Hook tests |
| `src/components/onboarding/CoachMark.tsx` | Presentational tooltip component (dark bubble, arrow, badge, CTA, skip) |
| `src/components/onboarding/coach-mark.css` | Styles + pulse animation |
| `src/components/onboarding/__tests__/CoachMark.test.tsx` | Component tests |
| `src/components/onboarding/FormPreviewCard.tsx` | Mini form preview (3 fields) for step 2 |
| `src/components/layout/AppShell.tsx` | Wire hook + render coach marks per step |

---

## Chunk 1: Hook + CoachMark component

### Task 1: `useOnboarding` hook

**Files:**
- Create: `src/lib/hooks/useOnboarding.ts`
- Test: `src/lib/hooks/__tests__/useOnboarding.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/hooks/__tests__/useOnboarding.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnboarding } from '../useOnboarding'

const LS_KEY = 'genealogy_onboarding_step'

beforeEach(() => {
  localStorage.clear()
})

describe('useOnboarding', () => {
  it('starts at step 1 when localStorage empty and personCount is 0', () => {
    const { result } = renderHook(() => useOnboarding(0))
    expect(result.current.step).toBe(1)
    expect(result.current.isActive).toBe(true)
  })

  it('starts as done when personCount > 0 and no localStorage', () => {
    const { result } = renderHook(() => useOnboarding(3))
    expect(result.current.step).toBe('done')
    expect(result.current.isActive).toBe(false)
  })

  it('resumes from localStorage', () => {
    localStorage.setItem(LS_KEY, '3')
    const { result } = renderHook(() => useOnboarding(1))
    expect(result.current.step).toBe(3)
  })

  it('advance() moves 1 → 2', () => {
    const { result } = renderHook(() => useOnboarding(0))
    act(() => result.current.advance())
    expect(result.current.step).toBe(2)
    expect(localStorage.getItem(LS_KEY)).toBe('2')
  })

  it('advance() from 4 → done', () => {
    localStorage.setItem(LS_KEY, '4')
    const { result } = renderHook(() => useOnboarding(2))
    act(() => result.current.advance())
    expect(result.current.step).toBe('done')
    expect(result.current.isActive).toBe(false)
  })

  it('skip() sets skipped', () => {
    const { result } = renderHook(() => useOnboarding(0))
    act(() => result.current.skip())
    expect(result.current.step).toBe('skipped')
    expect(result.current.isActive).toBe(false)
  })

  it('auto-advances 1 → 2 when personCount goes from 0 to 1', () => {
    const { result, rerender } = renderHook(
      ({ count }) => useOnboarding(count),
      { initialProps: { count: 0 } }
    )
    expect(result.current.step).toBe(1)
    rerender({ count: 1 })
    expect(result.current.step).toBe(2)
  })

  it('auto-advances 3 → 4 when personCount goes from 1 to 2', () => {
    localStorage.setItem(LS_KEY, '3')
    const { result, rerender } = renderHook(
      ({ count }) => useOnboarding(count),
      { initialProps: { count: 1 } }
    )
    expect(result.current.step).toBe(3)
    rerender({ count: 2 })
    expect(result.current.step).toBe(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/hooks/__tests__/useOnboarding.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

```ts
// src/lib/hooks/useOnboarding.ts
import { useState, useEffect, useCallback, useRef } from 'react'

export type OnboardingStep = 1 | 2 | 3 | 4 | 'done' | 'skipped'

const LS_KEY = 'genealogy_onboarding_step'
const STEP_ORDER: OnboardingStep[] = [1, 2, 3, 4, 'done']

function readStep(): OnboardingStep | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return null
  if (raw === 'done' || raw === 'skipped') return raw
  const n = Number(raw)
  if (n >= 1 && n <= 4) return n as 1 | 2 | 3 | 4
  return null
}

function writeStep(step: OnboardingStep) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, String(step))
}

export function useOnboarding(personCount: number) {
  const [step, setStep] = useState<OnboardingStep>(() => {
    const saved = readStep()
    if (saved) return saved
    return personCount > 0 ? 'done' : 1
  })

  const prevCount = useRef(personCount)

  useEffect(() => {
    const prev = prevCount.current
    prevCount.current = personCount
    if (step === 1 && prev === 0 && personCount >= 1) {
      setStep(2)
      writeStep(2)
    } else if (step === 3 && prev <= 1 && personCount >= 2) {
      setStep(4)
      writeStep(4)
    }
  }, [personCount, step])

  const advance = useCallback(() => {
    setStep(current => {
      const idx = STEP_ORDER.indexOf(current)
      const next = idx >= 0 && idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : 'done'
      writeStep(next)
      return next
    })
  }, [])

  const skip = useCallback(() => {
    setStep('skipped')
    writeStep('skipped')
  }, [])

  const isActive = step !== 'done' && step !== 'skipped'

  return { step, advance, skip, isActive }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/hooks/__tests__/useOnboarding.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/useOnboarding.ts src/lib/hooks/__tests__/useOnboarding.test.ts
git commit -m "feat(onboarding): add useOnboarding hook with localStorage persistence

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `CoachMark` component + CSS

**Files:**
- Create: `src/components/onboarding/CoachMark.tsx`
- Create: `src/components/onboarding/coach-mark.css`
- Test: `src/components/onboarding/__tests__/CoachMark.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/onboarding/__tests__/CoachMark.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CoachMark } from '../CoachMark'

const base = {
  step: 1,
  totalSteps: 4,
  title: 'Test title',
  description: 'Test description',
  ctaLabel: 'Go',
  onCtaClick: vi.fn(),
  onSkip: vi.fn(),
  position: 'bottom' as const,
}

describe('CoachMark', () => {
  it('renders title, description, badge, CTA, and skip', () => {
    render(<CoachMark {...base} />)
    expect(screen.getByText('Test title')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('1 / 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Go/i })).toBeInTheDocument()
    expect(screen.getByText(/Passer le guide/i)).toBeInTheDocument()
  })

  it('calls onCtaClick when CTA clicked', () => {
    render(<CoachMark {...base} />)
    fireEvent.click(screen.getByRole('button', { name: /Go/i }))
    expect(base.onCtaClick).toHaveBeenCalled()
  })

  it('calls onSkip when skip clicked', () => {
    render(<CoachMark {...base} />)
    fireEvent.click(screen.getByText(/Passer le guide/i))
    expect(base.onSkip).toHaveBeenCalled()
  })

  it('renders children when provided', () => {
    render(<CoachMark {...base}><div data-testid="child">Custom</div></CoachMark>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies arrow position class', () => {
    const { container } = render(<CoachMark {...base} position="top" />)
    expect(container.querySelector('.coach-mark--arrow-top')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test → FAIL**

Run: `npx vitest run src/components/onboarding/__tests__/CoachMark.test.tsx`

- [ ] **Step 3: Create CSS**

```css
/* src/components/onboarding/coach-mark.css */
.coach-mark {
  position: absolute;
  background: #1a1a1a;
  color: #fff;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.5;
  max-width: 280px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 40;
  font-family: Inter, system-ui, sans-serif;
}

.coach-mark::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background: #1a1a1a;
  transform: rotate(45deg);
}

.coach-mark--arrow-top::after { top: -5px; left: 24px; }
.coach-mark--arrow-bottom::after { bottom: -5px; left: 24px; }
.coach-mark--arrow-left::after { left: -5px; top: 16px; }
.coach-mark--arrow-right::after { right: -5px; top: 16px; }

.coach-mark__badge {
  display: inline-block;
  background: #7c3aed;
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.coach-mark__title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.coach-mark__desc {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}

.coach-mark__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.coach-mark__cta {
  display: inline-block;
  background: #7c3aed;
  color: white;
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.coach-mark__skip {
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

@keyframes coach-pulse {
  0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); }
  100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
}

.coach-pulse {
  animation: coach-pulse 2s ease-out infinite;
}
```

- [ ] **Step 4: Implement the component**

```tsx
// src/components/onboarding/CoachMark.tsx
import './coach-mark.css'

interface CoachMarkProps {
  step: number
  totalSteps: number
  title: string
  description: string
  ctaLabel: string
  onCtaClick: () => void
  onSkip: () => void
  position: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
}

export function CoachMark({
  step,
  totalSteps,
  title,
  description,
  ctaLabel,
  onCtaClick,
  onSkip,
  position,
  children,
}: CoachMarkProps) {
  return (
    <div className={`coach-mark coach-mark--arrow-${position}`}>
      <div className="coach-mark__badge">{step} / {totalSteps}</div>
      <div className="coach-mark__title">{title}</div>
      <div className="coach-mark__desc">{description}</div>
      {children}
      <div className="coach-mark__actions">
        <button type="button" className="coach-mark__cta" onClick={onCtaClick}>
          {ctaLabel}
        </button>
        <button type="button" className="coach-mark__skip" onClick={onSkip}>
          Passer le guide
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test → PASS (5 tests)**

Run: `npx vitest run src/components/onboarding/__tests__/CoachMark.test.tsx`

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/CoachMark.tsx src/components/onboarding/coach-mark.css src/components/onboarding/__tests__/CoachMark.test.tsx
git commit -m "feat(onboarding): add CoachMark component with pulse animation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `FormPreviewCard` for step 2

**Files:**
- Create: `src/components/onboarding/FormPreviewCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/onboarding/FormPreviewCard.tsx
import type { Person } from '@/lib/types/database'

interface FormPreviewCardProps {
  person: Person
}

export function FormPreviewCard({ person }: FormPreviewCardProps) {
  const dateNaissance = person.date_naissance
    ? new Date(person.date_naissance).toLocaleDateString('fr-FR')
    : null
  const lieu = person.lieu_naissance

  const fields = [
    { label: 'Nom', value: person.nom.toUpperCase() },
    { label: 'Prénoms', value: person.prenom },
    {
      label: 'Naissance',
      value: [dateNaissance, lieu ? `à ${lieu}` : null].filter(Boolean).join(' '),
    },
  ]

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e2dd',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 10,
        color: '#8a8580',
        marginTop: 10,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: 11, marginBottom: 6 }}>
        Cerfa 3233 — Aperçu
      </div>
      {fields.map(f => (
        <div
          key={f.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '3px 0',
            borderBottom: '1px solid #f0eeeb',
          }}
        >
          <span>{f.label}</span>
          <span style={{ color: '#7c3aed', fontWeight: 500 }}>{f.value || '—'}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/FormPreviewCard.tsx
git commit -m "feat(onboarding): add FormPreviewCard for step 2 wow moment

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 2: Wire into AppShell

### Task 4: Integrate onboarding in AppShell

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Read current AppShell**

Run: Read `src/components/layout/AppShell.tsx` fully to understand imports, state, and render tree before modifying.

- [ ] **Step 2: Add imports**

At the top of AppShell.tsx, add:

```tsx
import { useOnboarding } from '@/lib/hooks/useOnboarding'
import { CoachMark } from '@/components/onboarding/CoachMark'
import { FormPreviewCard } from '@/components/onboarding/FormPreviewCard'
```

- [ ] **Step 3: Call the hook**

Inside the `AppShell` function body, after the existing state declarations, add:

```tsx
const onboarding = useOnboarding(initialPersons.length)
```

- [ ] **Step 4: Add coach mark for steps 1 and 3 in the context bar area**

Pass onboarding state to Topbar via new props. Add to the `<Topbar>` call:

```tsx
onboardingStep={onboarding.isActive ? onboarding.step : null}
onOnboardingAdvance={onboarding.advance}
onOnboardingSkip={onboarding.skip}
firstPerson={initialPersons.length > 0 ? initialPersons[0] : null}
```

- [ ] **Step 5: Add coach mark for step 4 in the main area**

After the `<ViewRouter>` component inside the `<main>` tag, add:

```tsx
{onboarding.step === 4 && (
  <div style={{ position: 'absolute', top: '50%', right: 80, transform: 'translateY(-50%)', zIndex: 40 }}>
    <CoachMark
      step={4}
      totalSteps={4}
      title="Votre arbre est lancé 🎉"
      description="Cliquez sur n'importe qui pour lancer une recherche sur cette personne. Chaque ajout enrichit vos formulaires."
      ctaLabel="C'est parti !"
      onCtaClick={onboarding.advance}
      onSkip={onboarding.skip}
      position="left"
    />
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat(onboarding): wire useOnboarding hook and step 4 coach mark into AppShell

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Render coach marks in Topbar (steps 1, 2, 3)

**Files:**
- Modify: `src/components/layout/Topbar.tsx`

- [ ] **Step 1: Read current Topbar**

Read `src/components/layout/Topbar.tsx` fully.

- [ ] **Step 2: Add new props to TopbarProps**

```tsx
import type { Person } from '@/lib/types/database'
import type { OnboardingStep } from '@/lib/hooks/useOnboarding'
import { CoachMark } from '@/components/onboarding/CoachMark'
import { FormPreviewCard } from '@/components/onboarding/FormPreviewCard'
```

Add to `TopbarProps`:

```tsx
onboardingStep?: OnboardingStep | null
onOnboardingAdvance?: () => void
onOnboardingSkip?: () => void
firstPerson?: Person | null
```

- [ ] **Step 3: Add pulse class on « + Ajouter » for steps 1 and 3**

On the `+ Ajouter` button, add dynamic className:

```tsx
className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors${
  (onboardingStep === 1 || onboardingStep === 3) ? ' coach-pulse' : ''
}`}
```

Import the CSS at top of file:

```tsx
import '@/components/onboarding/coach-mark.css'
```

- [ ] **Step 4: Add coach mark bubble for step 1 next to « + Ajouter »**

Right after the `+ Ajouter` button in the context bar, render conditionally:

```tsx
{onboardingStep === 1 && onOnboardingAdvance && onOnboardingSkip && (
  <div style={{ position: 'absolute', top: '100%', right: 14, marginTop: 8, zIndex: 40 }}>
    <CoachMark
      step={1}
      totalSteps={4}
      title="Ajoutez votre premier ancêtre"
      description="Son nom pré-remplira automatiquement les formulaires de recherche foncière."
      ctaLabel="Ajouter →"
      onCtaClick={() => { onAddPerson?.(); onOnboardingAdvance() }}
      onSkip={onOnboardingSkip}
      position="top"
    />
  </div>
)}
```

Wait — for step 1, the CTA should trigger `onAddPerson` but NOT advance yet. The auto-advance happens when `personCount` goes from 0 to 1 (in the hook). So just call `onAddPerson?.()`:

```tsx
onCtaClick={() => onAddPerson?.()}
```

- [ ] **Step 5: Add pulse on « Recherches » + coach mark for step 2**

On the `RechercheDropdown` wrapper area, conditionally add pulse:

Wrap the `<RechercheDropdown>` in a div with dynamic class:

```tsx
{onOpen3233 && onOpen3236 && (
  <div className={onboardingStep === 2 ? 'coach-pulse' : ''} style={{ position: 'relative', borderRadius: 8 }}>
    <RechercheDropdown onOpen3233={onOpen3233} onOpen3236={onOpen3236} />
    {onboardingStep === 2 && onOnboardingAdvance && onOnboardingSkip && firstPerson && (
      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 40 }}>
        <CoachMark
          step={2}
          totalSteps={4}
          title="Le formulaire est déjà pré-rempli ✨"
          description={`Cliquez sur Recherches pour voir le formulaire 3233 avec les données de ${firstPerson.prenom}.`}
          ctaLabel="Voir le formulaire →"
          onCtaClick={onOnboardingAdvance}
          onSkip={onOnboardingSkip}
          position="top"
        >
          <FormPreviewCard person={firstPerson} />
        </CoachMark>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 6: Add coach mark for step 3**

Same position as step 1 (next to `+ Ajouter`), but different copy:

```tsx
{onboardingStep === 3 && onOnboardingAdvance && onOnboardingSkip && firstPerson && (
  <div style={{ position: 'absolute', top: '100%', right: 14, marginTop: 8, zIndex: 40 }}>
    <CoachMark
      step={3}
      totalSteps={4}
      title="Complétez votre arbre"
      description={`Ajoutez le père ou la mère de ${firstPerson.prenom}. Plus votre arbre est riche, plus vos recherches seront précises.`}
      ctaLabel="Ajouter quelqu'un →"
      onCtaClick={() => onAddPerson?.()}
      onSkip={onOnboardingSkip}
      position="top"
    />
  </div>
)}
```

- [ ] **Step 7: Verify context bar has `position: relative`**

Ensure the context bar `<div>` has `style={{ position: 'relative' }}` so absolute-positioned coach marks anchor correctly. Check and add if missing.

- [ ] **Step 8: Run full tests**

Run: `npm run test:run`
Expected: all tests pass.

- [ ] **Step 9: Run typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/layout/Topbar.tsx
git commit -m "feat(onboarding): render coach marks for steps 1-3 in topbar

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Chunk 3: Verification

### Task 6: Manual verification + push

- [ ] **Step 1: Tests + typecheck**

Run: `npm run test:run` — 0 failures.
Run: `npx tsc --noEmit` — 0 errors.

- [ ] **Step 2: Manual test on http://localhost:3001**

Checklist:
- [ ] Nouvel utilisateur (arbre vide) → bulle step 1 visible sur « + Ajouter », bouton pulse
- [ ] Clic « Ajouter → » → PersonModal s'ouvre
- [ ] Créer une personne → bulle step 2 avec aperçu formulaire, « Recherches » pulse
- [ ] Clic CTA step 2 → bulle step 3, « + Ajouter » pulse à nouveau
- [ ] Créer 2e personne → bulle step 4 dans Cosmos
- [ ] Clic « C'est parti ! » → plus de bulles
- [ ] Refresh page → pas de bulles (localStorage = done)
- [ ] Clear localStorage → bulles recommencent
- [ ] « Passer le guide » → plus de bulles, persiste au refresh

- [ ] **Step 3: Push**

```bash
git push -u origin feat/onboarding-coach-marks
```

---

## Parking lot

- Bouton « ? » pour re-déclencher le guide
- Onboarding VIEWER (proposer au lieu d'ajouter)
- Animations fade-in/out entre steps
- Analytics : tracking de quel step provoque le drop-off
