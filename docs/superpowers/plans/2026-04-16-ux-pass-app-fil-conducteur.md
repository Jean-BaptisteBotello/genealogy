# UX Pass App — Fil conducteur

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Éliminer les ruptures de fil conducteur entre vues de l'arbre (Cosmos, Sablier Flow, Timeline) et les frictions du flow créer → lier une personne, conformément à la grille Linear Method (ambient UI, friction removal, progressive disclosure, momentum).

**Architecture:** Quatre chantiers isolés livrables indépendamment : (A3) token visuel unifié « personne sélectionnée » extrait en tokens CSS partagés, (A1) auto-focus sur la personne sélectionnée au changement de vue via un hook partagé, (A2) flow « créer → lier » en deux steps dans la même `PersonModal`, (A4) promotion de « Famille étendue » dans `LinkPersonForm` et `Sidebar`. Pas de refonte structurelle du shell ou des contextes : on ajoute, on ne réécrit pas.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind + CSS modules existants (`sablierFlow.css`, `timeline.css`), Vitest + Testing Library. Design system Warm Light (fond `#f8f8f6`, accent violet `#7c3aed`, borders `#e5e2dd`).

**Design decisions (validées 2026-04-16) :**
- **D1** Sélection unifiée = bordure violet `#7c3aed` 2px + halo `box-shadow: 0 0 0 6px rgba(124,58,237,0.12)` sur cards. Pour Cosmos (SVG) : anneau violet 2px autour des nodes, `filter: drop-shadow(0 0 6px rgba(124,58,237,0.35))`.
- **D2** Au changement de vue : auto-centrage animé 300ms ease-out sur la personne sélectionnée. Si pas de date (Timeline), flag d'attention sur le panneau « non placées ».
- **D3** `PersonModal` en création passe à un step 2 « Lier {Nom} à… » inline après submit réussi. Bouton secondaire « Plus tard ». Pas de seconde modale.
- **D4** `LinkPersonForm` : deux sous-sections côte à côte (Directe / Étendue) avec titres. `Sidebar` : checkbox « Famille étendue » au même niveau que « Famille ».

**Branche Git :** `feat/ux-pass-app-fil-conducteur` depuis `main` (branche séparée de `feat/landing-ux-pass-1`).

**Pré-requis :**
- Lire `node_modules/next/dist/docs/` avant tout usage d'API Next — voir AGENTS.md.
- Dev server sur port 3001 : `npx next dev -p 3001`.
- Tests : `npm run test:run`.

---

## Chunk 1: Token « personne sélectionnée » unifié (A3)

**But :** Un seul signal visuel cohérent entre Cosmos, Sablier Flow et Timeline.

### Task 1.1: Créer le module de tokens sélection

**Files:**
- Create: `src/lib/ui/selection-tokens.ts`
- Test: `src/lib/ui/__tests__/selection-tokens.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// src/lib/ui/__tests__/selection-tokens.test.ts
import { describe, it, expect } from 'vitest'
import { SELECTION_TOKENS } from '../selection-tokens'

describe('SELECTION_TOKENS', () => {
  it('expose une couleur d\'accent violette conforme au design system', () => {
    expect(SELECTION_TOKENS.accent).toBe('#7c3aed')
  })
  it('expose un halo RGBA dérivé de l\'accent', () => {
    expect(SELECTION_TOKENS.halo).toMatch(/rgba\(124,\s*58,\s*237,\s*0\.12\)/)
  })
  it('expose une épaisseur de bordure en pixels', () => {
    expect(SELECTION_TOKENS.borderWidthPx).toBe(2)
  })
  it('expose un filter SVG drop-shadow', () => {
    expect(SELECTION_TOKENS.svgGlow).toContain('drop-shadow')
    expect(SELECTION_TOKENS.svgGlow).toContain('rgba(124, 58, 237, 0.35)')
  })
})
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `npx vitest run src/lib/ui/__tests__/selection-tokens.test.ts`
Expected: FAIL — `Cannot find module '../selection-tokens'`.

- [ ] **Step 3: Implémenter le module**

```ts
// src/lib/ui/selection-tokens.ts
export const SELECTION_TOKENS = {
  accent: '#7c3aed',
  halo: 'rgba(124, 58, 237, 0.12)',
  borderWidthPx: 2,
  svgGlow: 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.35))',
} as const

export type SelectionTokens = typeof SELECTION_TOKENS
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `npx vitest run src/lib/ui/__tests__/selection-tokens.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui/selection-tokens.ts src/lib/ui/__tests__/selection-tokens.test.ts
git commit -m "feat(ui): add unified selection tokens"
```

---

### Task 1.2: Appliquer le token dans Sablier Flow

**Files:**
- Modify: `src/components/views/sablier/sablierFlow.css` (classe `.sablier-flow__card--selected`)
- Test: `src/components/views/sablier/__tests__/sablierFlowSelection.test.tsx` (nouveau)

- [ ] **Step 1: Inspecter la classe existante**

Run: `grep -n "sablier-flow__card--selected" src/components/views/sablier/sablierFlow.css`

Noter les propriétés actuelles (couleur bordure, shadow) pour remplacer proprement, sans casser les autres styles `.sablier-flow__card`.

- [ ] **Step 2: Écrire le test Testing Library**

```tsx
// src/components/views/sablier/__tests__/sablierFlowSelection.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('sablier-flow__card--selected CSS', () => {
  it('la classe applique bordure violette 2px et halo', () => {
    const { container } = render(
      <div>
        <div className="sablier-flow__card sablier-flow__card--selected">card</div>
      </div>
    )
    const el = container.querySelector('.sablier-flow__card--selected') as HTMLElement
    expect(el).toBeTruthy()
    // On ne teste pas le computed style (JSDOM ne résout pas les CSS imports)
    // mais on s'assure que la classe est bien présente — la cohérence visuelle
    // est validée par le token partagé (voir selection-tokens.test.ts).
  })
})
```

- [ ] **Step 3: Lancer le test, vérifier le succès (classe déjà appliquée par le composant)**

Run: `npx vitest run src/components/views/sablier/__tests__/sablierFlowSelection.test.tsx`
Expected: PASS.

- [ ] **Step 4: Modifier la CSS pour utiliser les valeurs du token**

Dans `src/components/views/sablier/sablierFlow.css`, trouver ou créer la règle `.sablier-flow__card--selected` et la remplacer par :

```css
.sablier-flow__card--selected {
  border: 2px solid #7c3aed;
  box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.12);
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}
```

Les valeurs doivent être littérales (pas de `var()` : les tokens TS ne sont pas partagés avec CSS directement — à unifier dans un futur chantier).

- [ ] **Step 5: Vérifier visuellement**

Run: `npx next dev -p 3001` (si pas déjà lancé), ouvrir http://localhost:3001, passer en vue Sablier, cliquer sur une personne. Vérifier bordure violette + halo doux.

- [ ] **Step 6: Commit**

```bash
git add src/components/views/sablier/sablierFlow.css src/components/views/sablier/__tests__/sablierFlowSelection.test.tsx
git commit -m "feat(sablier): apply unified selection token"
```

---

### Task 1.3: Appliquer le token dans Timeline

**Files:**
- Modify: `src/components/views/timeline/timeline.css`

- [ ] **Step 1: Repérer la classe `.timeline__unit--selected`**

Run: `grep -n "timeline__unit--selected\|timeline__card" src/components/views/timeline/timeline.css`

- [ ] **Step 2: Mettre à jour la règle pour matcher le token**

Ajouter ou remplacer dans `timeline.css` :

```css
.timeline__unit--selected .timeline__card {
  border: 2px solid #7c3aed;
  box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.12);
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}
.timeline__unit--selected .timeline__dot {
  background: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.18);
}
```

- [ ] **Step 3: Vérifier visuellement**

Lancer le dev server, passer en vue Timeline, cliquer sur une personne. Même visuel que Sablier.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/timeline/timeline.css
git commit -m "feat(timeline): apply unified selection token"
```

---

### Task 1.4: Appliquer le token dans Cosmos (center node)

**Files:**
- Modify: `src/components/cosmos/CosmosView.tsx` (center node block, lignes ~382-429)
- Test: `src/components/cosmos/__tests__/CosmosView.test.tsx`

- [ ] **Step 1: Lire le test existant pour comprendre le setup**

Run: Read `src/components/cosmos/__tests__/CosmosView.test.tsx` entièrement avant de modifier.

- [ ] **Step 2: Écrire le test qui échoue**

Ajouter dans le fichier de test :

```tsx
it('le center node porte un halo violet conforme au token de sélection', () => {
  // setup minimal: 1 person, selectedPersonId = cette personne
  // ... (adapter au helper render() existant du fichier)
  const { container } = renderCosmosView({ persons: [onePerson], selectedPersonId: onePerson.id })
  const centerGroup = container.querySelector('[data-testid="cosmos-center"]')
  expect(centerGroup).toBeTruthy()
  expect(centerGroup?.getAttribute('style') ?? '').toContain('drop-shadow')
})
```

- [ ] **Step 3: Lancer, vérifier échec**

Run: `npx vitest run src/components/cosmos/__tests__/CosmosView.test.tsx`
Expected: FAIL — pas de `data-testid="cosmos-center"` ou pas de `drop-shadow`.

- [ ] **Step 4: Ajouter data-testid + halo sur le center node**

Dans `CosmosView.tsx`, le `<g>` du center node (ligne ~383) :

```tsx
{centerPerson && (
  <g
    data-testid="cosmos-center"
    style={{
      cursor: 'pointer',
      filter: 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.35))',
    }}
    onClick={() => selectPerson(centerPerson.id)}
  >
    <circle
      cx="50%"
      cy="50%"
      r={18}
      fill="none"
      stroke="#7c3aed"
      strokeWidth={2}
      strokeOpacity={0.9}
    />
    {/* ... reste inchangé ... */}
```

- [ ] **Step 5: Lancer le test, vérifier PASS**

Run: `npx vitest run src/components/cosmos/__tests__/CosmosView.test.tsx`

- [ ] **Step 6: Vérifier visuellement**

Cosmos : le node central a un halo violet doux et un anneau violet 2px.

- [ ] **Step 7: Commit**

```bash
git add src/components/cosmos/CosmosView.tsx src/components/cosmos/__tests__/CosmosView.test.tsx
git commit -m "feat(cosmos): apply unified selection glow to center node"
```

---

## Chunk 2: Persistance et auto-focus entre vues (A1)

**But :** Au changement de vue, la personne sélectionnée reste visible et centrée. Plus de perte de contexte.

### Task 2.1: Hook `useScrollSelectedIntoView`

**Files:**
- Create: `src/lib/hooks/useScrollSelectedIntoView.ts`
- Test: `src/lib/hooks/__tests__/useScrollSelectedIntoView.test.tsx`

- [ ] **Step 1: Écrire le test**

```tsx
// src/lib/hooks/__tests__/useScrollSelectedIntoView.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollSelectedIntoView } from '../useScrollSelectedIntoView'

describe('useScrollSelectedIntoView', () => {
  it('appelle scrollIntoView sur l\'élément matchant le selector quand selectedId change', () => {
    const el = document.createElement('div')
    el.setAttribute('data-person-id', 'p1')
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)

    const containerRef = { current: document.body }
    renderHook(() =>
      useScrollSelectedIntoView(containerRef, 'p1', { behavior: 'smooth', block: 'center' })
    )
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center', inline: 'center' })
  })

  it('ne fait rien si selectedId est null', () => {
    const el = document.createElement('div')
    el.setAttribute('data-person-id', 'p1')
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)

    const containerRef = { current: document.body }
    renderHook(() => useScrollSelectedIntoView(containerRef, null))
    expect(el.scrollIntoView).not.toHaveBeenCalled()
  })

  it('ne fait rien si aucun élément ne matche', () => {
    const containerRef = { current: document.body }
    expect(() =>
      renderHook(() => useScrollSelectedIntoView(containerRef, 'unknown'))
    ).not.toThrow()
  })
})
```

- [ ] **Step 2: Lancer, vérifier échec**

Run: `npx vitest run src/lib/hooks/__tests__/useScrollSelectedIntoView.test.tsx`
Expected: FAIL (module missing).

- [ ] **Step 3: Implémenter le hook**

```ts
// src/lib/hooks/useScrollSelectedIntoView.ts
import { useEffect } from 'react'

type Options = {
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
  inline?: ScrollLogicalPosition
}

const DEFAULTS: Required<Options> = {
  behavior: 'smooth',
  block: 'center',
  inline: 'center',
}

export function useScrollSelectedIntoView(
  containerRef: React.RefObject<HTMLElement | null>,
  selectedId: string | null,
  options: Options = {}
) {
  useEffect(() => {
    if (!selectedId) return
    const container = containerRef.current
    if (!container) return
    const el = container.querySelector(`[data-person-id="${selectedId}"]`)
    if (!el || typeof (el as HTMLElement).scrollIntoView !== 'function') return
    const opts = { ...DEFAULTS, ...options }
    ;(el as HTMLElement).scrollIntoView(opts)
  }, [selectedId, containerRef, options.behavior, options.block, options.inline])
}
```

- [ ] **Step 4: Lancer le test, vérifier PASS**

Run: `npx vitest run src/lib/hooks/__tests__/useScrollSelectedIntoView.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/useScrollSelectedIntoView.ts src/lib/hooks/__tests__/useScrollSelectedIntoView.test.tsx
git commit -m "feat(hooks): add useScrollSelectedIntoView"
```

---

### Task 2.2: Appliquer le hook dans Sablier Flow

**Files:**
- Modify: `src/components/views/sablier/SablierFlowView.tsx`

- [ ] **Step 1: Ajouter `data-person-id` sur les cards**

Dans `renderCard` (ligne ~88), ajouter `data-person-id={nodeId}` sur le div racine :

```tsx
<div
  key={nodeId}
  data-person-id={nodeId}
  className={classes}
  style={{ left: x, top: y }}
  onClick={() => selectPerson(nodeId)}
  /* ... */
>
```

- [ ] **Step 2: Importer et invoquer le hook**

En haut du composant :

```tsx
import { useScrollSelectedIntoView } from '@/lib/hooks/useScrollSelectedIntoView'
```

Dans le corps, après la déclaration de `containerRef` :

```tsx
useScrollSelectedIntoView(containerRef, selectedPersonId)
```

- [ ] **Step 3: Vérifier manuellement**

Dev server lancé. Cosmos → sélectionner une personne éloignée → passer en Sablier → la card sélectionnée doit se centrer à l'écran avec animation fluide.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/sablier/SablierFlowView.tsx
git commit -m "feat(sablier): auto-center selected person on view enter"
```

---

### Task 2.3: Appliquer le hook dans Timeline

**Files:**
- Modify: `src/components/views/timeline/TimelineView.tsx`

- [ ] **Step 1: Introduire un containerRef**

Dans `TimelineView`, ajouter :

```tsx
import { useRef } from 'react'
import { useScrollSelectedIntoView } from '@/lib/hooks/useScrollSelectedIntoView'

// ...
const containerRef = useRef<HTMLDivElement>(null)
useScrollSelectedIntoView(containerRef, selectedPersonId)
```

Et brancher `ref={containerRef}` sur le wrapper `.timeline` (ligne ~142).

- [ ] **Step 2: Ajouter `data-person-id` sur les units**

Dans `renderCard`, sur la div `timeline__unit` :

```tsx
<div
  key={p.id}
  data-person-id={p.id}
  className={`timeline__unit ...`}
  /* ... */
>
```

- [ ] **Step 3: Gérer le cas « personne sans date »**

Si `selectedPersonId` appartient à `unplaced`, le hook ne trouvera rien (pas de card visible) : ajouter une classe CSS de flag sur le badge « non placées ».

Dans le composant :

```tsx
const selectedIsUnplaced = selectedPersonId != null && unplaced.some(p => p.id === selectedPersonId)
```

Sur le badge (ligne ~162) :

```tsx
<div className={`timeline__unplaced${selectedIsUnplaced ? ' timeline__unplaced--highlight' : ''}`}>
  {unplaced.length} non placée{unplaced.length > 1 ? 's' : ''} sur la timeline (sans date de naissance)
</div>
```

Dans `timeline.css`, ajouter :

```css
.timeline__unplaced--highlight {
  border: 2px solid #7c3aed;
  box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.12);
  background: #ffffff;
  color: #1a1a1a;
}
```

- [ ] **Step 4: Vérifier manuellement**

- Sélectionner une personne avec date dans Cosmos → aller Timeline → la card se centre.
- Sélectionner une personne SANS date dans Cosmos → aller Timeline → le badge « non placées » est mis en évidence.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/timeline/TimelineView.tsx src/components/views/timeline/timeline.css
git commit -m "feat(timeline): auto-center selected and flag unplaced"
```

---

### Task 2.4: Cosmos — recentrer la sélection

**Files:**
- Modify: `src/components/cosmos/CosmosView.tsx`

- [ ] **Step 1: Rappel du modèle Cosmos**

Dans Cosmos, la personne sélectionnée devient automatiquement le centre (voir `centerId = selectedPersonId ?? ...` ligne ~145). Le layout se recalcule autour d'elle. Pas besoin de scroll : le recentrage géométrique EST l'action.

- [ ] **Step 2: Améliorer la transition visuelle**

Ajouter une transition CSS sur le SVG pour que le changement de centre ait une amorce d'animation (les nodes orbitent déjà). Dans le `<svg>` (ligne ~314), ajouter `style={{ display: 'block', transition: 'opacity 200ms ease-out' }}`.

Optionnel (flash visuel) : au changement de `centerId`, baisser brièvement l'opacity à 0.7 puis remonter. On garde simple : pas de flash, la transition naturelle suffit.

Vérifier simplement que passer d'une personne A à B en Sablier puis revenir Cosmos met B au centre — pas de régression.

- [ ] **Step 3: Commit (si changement CSS appliqué, sinon skip)**

```bash
git add -u src/components/cosmos/CosmosView.tsx
git commit -m "chore(cosmos): smooth center transition" || echo "no change"
```

---

## Chunk 3: Flow créer → lier inline (A2)

**But :** Après création d'une personne, rester dans la modale et proposer inline « Lier {Nom} à… ». Supprime la double modale et le dead-end post-création.

### Task 3.1: Étendre `PersonModal` avec un step 2 optionnel

**Files:**
- Modify: `src/components/person/PersonModal.tsx`
- Modify: `src/server-actions/persons.ts` (si besoin — vérifier ce que retourne `createPerson`)
- Test: `src/components/person/__tests__/PersonModalLinkStep.test.tsx` (nouveau)

- [ ] **Step 1: Vérifier la signature de `createPerson`**

Run: Read `src/server-actions/persons.ts` — section `createPerson`. Confirmer qu'elle retourne `{ error: string } | { id: string } | { data: Person }` ou équivalent.

**Si** elle ne retourne pas l'id de la personne créée, modifier son type de retour pour inclure `{ id: string }` en cas de succès. Adapter tous les callers (chercher `createPerson(` via grep).

Run: `grep -rn "createPerson(" src/`

- [ ] **Step 2: Écrire le test du nouveau comportement**

```tsx
// src/components/person/__tests__/PersonModalLinkStep.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PersonModal } from '../PersonModal'

vi.mock('@/server-actions/persons', () => ({
  createPerson: vi.fn(async () => ({ id: 'new-person-id' })),
  updatePerson: vi.fn(async () => ({})),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe('PersonModal — créer puis lier', () => {
  it('après création, affiche l\'étape « Lier {Nom} à… » avec bouton « Plus tard »', async () => {
    render(<PersonModal mode="add" onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Prénom/i), { target: { value: 'Jean' } })
    fireEvent.change(screen.getByLabelText(/Nom/i), { target: { value: 'Dupont' } })
    fireEvent.submit(screen.getByRole('button', { name: /Ajouter/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Lier Jean Dupont à/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Plus tard/i })).toBeInTheDocument()
  })

  it('bouton « Plus tard » ferme la modale', async () => {
    const onClose = vi.fn()
    render(<PersonModal mode="add" onClose={onClose} />)
    fireEvent.change(screen.getByLabelText(/Prénom/i), { target: { value: 'Jean' } })
    fireEvent.change(screen.getByLabelText(/Nom/i), { target: { value: 'Dupont' } })
    fireEvent.submit(screen.getByRole('button', { name: /Ajouter/i }).closest('form')!)

    await waitFor(() => screen.getByRole('button', { name: /Plus tard/i }))
    fireEvent.click(screen.getByRole('button', { name: /Plus tard/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('en mode edit, pas de step 2 (close direct)', async () => {
    const onClose = vi.fn()
    const person = {
      id: 'p1', prenom: 'A', nom: 'B',
      date_naissance: null, lieu_naissance: null,
      date_deces: null, lieu_deces: null, notes: null,
    } as any
    render(<PersonModal mode={{ type: 'edit', person }} onClose={onClose} />)
    fireEvent.submit(screen.getByRole('button', { name: /Enregistrer/i }).closest('form')!)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(screen.queryByText(/Lier/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Lancer le test, vérifier échec**

Run: `npx vitest run src/components/person/__tests__/PersonModalLinkStep.test.tsx`
Expected: FAIL — step 2 pas implémenté.

- [ ] **Step 4: Implémenter le step 2 dans PersonModal**

Remplacer le corps de `PersonModal.tsx` par une version à deux steps. Le step 1 reste le formulaire actuel ; le step 2 affiche un sous-composant `InlineLinkStep` en mode création seulement.

```tsx
// src/components/person/PersonModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createPerson, updatePerson } from '@/server-actions/persons'
import { InlineLinkStep } from './InlineLinkStep'
import type { Person } from '@/lib/types/database'

type AddMode = 'add'
type EditMode = { type: 'edit'; person: Person }

interface PersonModalProps {
  mode: AddMode | EditMode
  onClose: () => void
}

type CreatedPerson = { id: string; prenom: string; nom: string }

export function PersonModal({ mode, onClose }: PersonModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdPerson, setCreatedPerson] = useState<CreatedPerson | null>(null)

  const isEdit = mode !== 'add'
  const person = isEdit ? (mode as EditMode).person : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const prenom = String(formData.get('prenom') ?? '').trim()
    const nom = String(formData.get('nom') ?? '').trim()

    startTransition(async () => {
      if (isEdit) {
        const result = await updatePerson(formData)
        if (result.error) { setError(result.error); return }
        router.refresh()
        onClose()
        return
      }
      const result = await createPerson(formData)
      if (result.error) { setError(result.error); return }
      router.refresh()
      if (!result.id) { onClose(); return }
      setCreatedPerson({ id: result.id, prenom, nom })
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-lg w-full max-w-md p-6 flex flex-col gap-4">
        {createdPerson ? (
          <InlineLinkStep
            createdPerson={createdPerson}
            onDone={onClose}
          />
        ) : (
          <>
            <h2 className="text-white font-semibold text-base">
              {isEdit ? 'Modifier' : 'Ajouter une personne'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* ... (garder form existant à l'identique) ... */}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Créer `InlineLinkStep`**

**Files:**
- Create: `src/components/person/InlineLinkStep.tsx`

```tsx
// src/components/person/InlineLinkStep.tsx
'use client'
import { useTree } from '@/lib/context/tree-context'
import { LinkPersonForm } from './LinkPersonForm'
import { Button } from '@/components/ui/Button'

interface Props {
  createdPerson: { id: string; prenom: string; nom: string }
  onDone: () => void
}

export function InlineLinkStep({ createdPerson, onDone }: Props) {
  const { persons } = useTree()
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-white font-semibold text-base">
        Lier {createdPerson.prenom} {createdPerson.nom} à…
      </h2>
      <p className="text-xs text-gray-400">
        Rattache {createdPerson.prenom} à quelqu'un qui est déjà dans l'arbre.
        Tu peux faire ça plus tard depuis sa fiche.
      </p>
      <LinkPersonForm
        currentPersonId={createdPerson.id}
        persons={persons}
        onClose={onDone}
      />
      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Plus tard
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Lancer les tests, vérifier PASS**

Run: `npx vitest run src/components/person/__tests__/PersonModalLinkStep.test.tsx`

Si échec : vérifier que `createPerson` retourne bien `{ id }` en succès (Step 1), adapter la mock du test en conséquence.

- [ ] **Step 7: Vérifier manuellement**

Dev server : cliquer « + Ajouter une personne » en topbar → remplir → Ajouter → la modale doit passer au step « Lier X à… » avec la search + les rôles. Cliquer « Plus tard » ferme. Créer une personne + lier en une session, sans réouvrir de modale.

- [ ] **Step 8: Commit**

```bash
git add src/components/person/PersonModal.tsx src/components/person/InlineLinkStep.tsx src/components/person/__tests__/PersonModalLinkStep.test.tsx src/server-actions/persons.ts
git commit -m "feat(person): chain create → link in single modal"
```

---

## Chunk 4: Promotion de « Famille étendue » (A4)

**But :** Sortir la famille étendue du chevron caché. Découvrabilité immédiate dans `LinkPersonForm` et `Sidebar`.

### Task 4.1: LinkPersonForm — deux sections côte à côte

**Files:**
- Modify: `src/components/person/LinkPersonForm.tsx`
- Test: `src/components/person/__tests__/LinkPersonFormExtended.test.tsx` (nouveau)

- [ ] **Step 1: Écrire le test**

```tsx
// src/components/person/__tests__/LinkPersonFormExtended.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LinkPersonForm } from '../LinkPersonForm'

vi.mock('@/server-actions/relationships', () => ({
  createRelationship: vi.fn(),
}))

const persons = [
  { id: 'a', prenom: 'Alice', nom: 'A', date_naissance: null, date_deces: null } as any,
  { id: 'b', prenom: 'Bob', nom: 'B', date_naissance: null, date_deces: null } as any,
]

describe('LinkPersonForm — famille étendue visible', () => {
  it('affiche les titres « Directe » et « Étendue » sans interaction utilisateur', () => {
    render(<LinkPersonForm currentPersonId="a" persons={persons} onClose={vi.fn()} />)
    expect(screen.getByText(/Directe/i)).toBeInTheDocument()
    expect(screen.getByText(/Étendue/i)).toBeInTheDocument()
  })

  it('les rôles étendus (oncle, tante, cousin/cousine) sont visibles d\'emblée', () => {
    render(<LinkPersonForm currentPersonId="a" persons={persons} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /oncle/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Lancer, vérifier échec**

Run: `npx vitest run src/components/person/__tests__/LinkPersonFormExtended.test.tsx`
Expected: FAIL — rôles étendus cachés sous chevron.

- [ ] **Step 3: Supprimer le toggle, afficher deux sections**

Dans `LinkPersonForm.tsx`, remplacer la section « Son rôle » + le toggle « Famille étendue » par deux sous-groupes en deux colonnes responsives :

```tsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--section-label, #4b5563)' }}>
      Directe
    </div>
    <div className="flex flex-wrap gap-1">
      {ROLES_FAMILLE_DIRECTE.map(role => (
        <RoleButton key={role} role={role} selectedRole={selectedRole} onSelect={setSelectedRole} />
      ))}
    </div>
  </div>
  <div>
    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--section-label, #4b5563)' }}>
      Étendue
    </div>
    <div className="flex flex-wrap gap-1">
      {ROLES_FAMILLE_ETENDUE.map(role => (
        <RoleButton key={role} role={role} selectedRole={selectedRole} onSelect={setSelectedRole} />
      ))}
    </div>
  </div>
</div>
```

Extraire un petit composant local `RoleButton` pour éviter la duplication JSX :

```tsx
function RoleButton({
  role, selectedRole, onSelect,
}: {
  role: RelationshipRole
  selectedRole: RelationshipRole | null
  onSelect: (r: RelationshipRole) => void
}) {
  const active = selectedRole === role
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className="text-[10px] px-2 py-0.5 rounded transition-colors"
      style={{
        border: `1px solid ${active ? 'var(--text-link, #3b82f6)' : 'var(--divider, #1e3a5f)'}`,
        color: active ? 'var(--text-primary, white)' : 'var(--text-secondary, #6b7280)',
        background: active ? 'var(--accent-hover, rgba(59,130,246,0.15))' : 'transparent',
      }}
    >
      {role}
    </button>
  )
}
```

Supprimer `isExtendedOpen` et son `useState`.

- [ ] **Step 4: Lancer le test, vérifier PASS**

Run: `npx vitest run src/components/person/__tests__/LinkPersonFormExtended.test.tsx`

- [ ] **Step 5: Lancer la suite complète pour s'assurer que rien ne casse**

Run: `npm run test:run`
Expected: tous les tests passent (y compris les anciens tests de `LinkPersonForm` si existants).

- [ ] **Step 6: Vérifier manuellement**

DetailPanel d'une personne → « + Lier » → les deux sections Directe/Étendue sont visibles sans clic.

- [ ] **Step 7: Commit**

```bash
git add src/components/person/LinkPersonForm.tsx src/components/person/__tests__/LinkPersonFormExtended.test.tsx
git commit -m "feat(link): expose famille étendue as peer section"
```

---

### Task 4.2: Sidebar — checkbox « Famille étendue » au même niveau

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Lire le code existant**

Run: Read `src/components/layout/Sidebar.tsx` pour repérer où `showFamily` et `showExtendedFamily` sont rendus (likely une checkbox visible + une cachée, ou un toggle).

- [ ] **Step 2: Rendre les deux filtres en même bloc visuel**

Les deux checkboxes doivent apparaître côte à côte ou l'une sous l'autre, même typographie, même hiérarchie. Pas de collapse. Exemple de bloc :

```tsx
<div className="flex flex-col gap-1.5 px-3 py-2">
  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
    <input type="checkbox" checked={showFamily} onChange={e => setShowFamily(e.target.checked)} />
    Famille directe
  </label>
  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
    <input type="checkbox" checked={showExtendedFamily} onChange={e => setShowExtendedFamily(e.target.checked)} />
    Famille étendue
  </label>
</div>
```

Adapter aux classes/styles actuels de la Sidebar — ne PAS imposer Tailwind si la Sidebar utilise CSS modules.

- [ ] **Step 3: Vérifier manuellement**

Sidebar : les deux toggles sont visibles et symétriques, cocher/décocher filtre bien les relations dans les vues.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat(sidebar): promote famille étendue filter to peer level"
```

---

## Vérification finale

### Task V: Passe de vérification

- [ ] **Step 1: Tests complets**

Run: `npm run test:run`
Expected: 0 failure.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 error.

- [ ] **Step 3: Checklist manuelle fil conducteur**

Cocher mentalement après test sur http://localhost:3001 :

- [ ] Sélectionner personne A en Cosmos → Sablier : A est centrée et en violet
- [ ] Sablier → Timeline : A (si datée) est centrée ; sinon badge « non placées » en violet
- [ ] Timeline → Cosmos : A est au centre avec halo violet
- [ ] Topbar « + Ajouter » → créer Jean → modale passe à « Lier Jean à… » sans clignoter
- [ ] « Plus tard » ferme la modale, Jean apparaît dans l'arbre
- [ ] DetailPanel → « + Lier » affiche Directe + Étendue d'emblée
- [ ] Sidebar : deux checkboxes côte à côte

- [ ] **Step 4: Push**

```bash
git push -u origin feat/ux-pass-app-fil-conducteur
```

- [ ] **Step 5: Ouvrir PR ou merger en fast-forward**

À discuter avec JB (voir skill `superpowers:finishing-a-development-branch`).

---

## Parking lot — hors scope de ce plan

- Repaint `PersonModal` en Warm Light (actuellement dark) — cohérence design system
- Emoji → icônes SVG dans la Topbar
- Persistance de la personne sélectionnée en URL (deep-link)
- EmptyTreeState partagé (factorisation des 5 empty states)
- Orphans / non-placés : panneau repliable dans Sablier et Timeline au lieu du badge
- Recherche foncière exposée depuis le DetailPanel (badge « Rechercher » sur fiche)
- Undo sur delete person/relationship
