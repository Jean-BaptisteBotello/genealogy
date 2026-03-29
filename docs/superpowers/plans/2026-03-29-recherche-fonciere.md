# Recherche foncière Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pre-filled PDF generation for Cerfa 3233-SD and 3236-SD forms, with SPF auto-detection and guided flow, accessible via a "Recherches" menu in the Topbar.

**Architecture:** Menu dropdown in Topbar opens modals for each form type. Modals use tree data (persons) to pre-fill fields and auto-detect the SPF. PDF generation uses pdf-lib client-side to fill the official Cerfa PDF forms. SPF directory is a static TypeScript file mapping départements to SPF offices.

**Tech Stack:** React, TypeScript, pdf-lib, Vitest

**Spec:** `docs/superpowers/specs/2026-03-29-recherche-fonciere-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `public/forms/cerfa-3233-sd.pdf` | Already downloaded | Official PDF source |
| `public/forms/cerfa-3236-sd.pdf` | Already downloaded | Official PDF source |
| `src/lib/spf-directory.ts` | Create | SPF data + findSPFByLieu function |
| `src/lib/pdf-filler.ts` | Create | Fill PDF fields with pdf-lib |
| `src/components/recherche/RechercheDropdown.tsx` | Create | Topbar dropdown menu |
| `src/components/recherche/PersonSelector.tsx` | Create | Inline person search/select |
| `src/components/recherche/SPFSelector.tsx` | Create | SPF auto-detect + manual select |
| `src/components/recherche/Formulaire3233Modal.tsx` | Create | Modal for 3233 form |
| `src/components/recherche/Formulaire3236Modal.tsx` | Create | Guidance + modal for 3236 form |
| `src/components/layout/Topbar.tsx` | Modify | Add Recherches button |
| `src/components/layout/AppShell.tsx` | Modify | Add modal state for recherche |

---

## Chunk 1: Foundation (SPF directory + PDF filler + install pdf-lib)

### Task 1: Install pdf-lib

- [ ] **Step 1: Install pdf-lib**

Run: `cd ~/Genealogy && npm install pdf-lib`

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install pdf-lib for PDF form filling"
```

---

### Task 2: Create SPF directory

**Files:**
- Create: `src/lib/spf-directory.ts`
- Create: `src/lib/__tests__/spf-directory.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/__tests__/spf-directory.test.ts
import { describe, it, expect } from 'vitest'
import { findSPFByLieu, SPF_DIRECTORY } from '../spf-directory'

describe('SPF directory', () => {
  it('has entries for all metropolitan départements', () => {
    expect(SPF_DIRECTORY.length).toBeGreaterThan(90)
  })

  it('finds SPF by lieu with département in parentheses', () => {
    const spf = findSPFByLieu('Toulon (83)')
    expect(spf).not.toBeNull()
    expect(spf!.departement).toBe('83')
  })

  it('finds SPF by lieu with département number', () => {
    const spf = findSPFByLieu('Paris 75')
    expect(spf).not.toBeNull()
    expect(spf!.departement).toBe('75')
  })

  it('returns null for unknown lieu', () => {
    const spf = findSPFByLieu('Unknown Place')
    expect(spf).toBeNull()
  })

  it('handles Corsica départements (2A, 2B)', () => {
    const spf = findSPFByLieu('Ajaccio (2A)')
    expect(spf).not.toBeNull()
  })

  it('handles DOM départements', () => {
    const spf = findSPFByLieu('Fort-de-France (972)')
    expect(spf).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

Run: `cd ~/Genealogy && npx vitest run src/lib/__tests__/spf-directory.test.ts`

- [ ] **Step 3: Implement spf-directory.ts**

Create `src/lib/spf-directory.ts` with:
- `SPF` interface (nom, departement, departementNom, email)
- `SPF_DIRECTORY` array with all ~100 metropolitan + DOM SPF offices
- `findSPFByLieu(lieu: string): SPF | null` — extracts département from lieu string using regex patterns like `(XX)`, ` XX`, then looks up in directory

The SPF data can be sourced from the annuaire at service-public.fr. For V1, include at least the major départements. The function should try these patterns in order:
1. `(XX)` or `(XXX)` in parentheses
2. `(2A)` or `(2B)` for Corsica
3. Trailing number after comma or space

- [ ] **Step 4: Run tests**

Run: `cd ~/Genealogy && npx vitest run src/lib/__tests__/spf-directory.test.ts`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/spf-directory.ts src/lib/__tests__/spf-directory.test.ts
git commit -m "feat: add SPF directory with auto-detection by lieu"
```

---

### Task 3: Create PDF filler

**Files:**
- Create: `src/lib/pdf-filler.ts`
- Create: `src/lib/__tests__/pdf-filler.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/__tests__/pdf-filler.test.ts
import { describe, it, expect } from 'vitest'
import { fill3233PDF, fill3236PDF } from '../pdf-filler'

describe('PDF filler', () => {
  it('fill3233PDF returns a Uint8Array', async () => {
    const result = await fill3233PDF({
      nom: 'DUPONT',
      prenoms: 'Jean Pierre Marcel',
      dateNaissance: '1860',
      lieuNaissance: 'Lyon (69)',
      dateDeces: null,
      lieuDeces: null,
      typeRecherche: 'personne',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('fill3236PDF returns a Uint8Array', async () => {
    const result = await fill3236PDF({
      nom: 'DUPONT',
      prenoms: 'Jean Pierre Marcel',
      dateNaissance: '1860',
      lieuNaissance: 'Lyon (69)',
      dateDeces: null,
      lieuDeces: null,
      volume: '1234',
      numero: '56',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

Run: `cd ~/Genealogy && npx vitest run src/lib/__tests__/pdf-filler.test.ts`

- [ ] **Step 3: Implement pdf-filler.ts**

```typescript
// src/lib/pdf-filler.ts
import { PDFDocument } from 'pdf-lib'

export interface Fill3233Data {
  nom: string
  prenoms: string
  dateNaissance: string | null
  lieuNaissance: string | null
  dateDeces: string | null
  lieuDeces: string | null
  typeRecherche: 'personne' | 'immeuble'
  commune?: string
  section?: string
  parcelle?: string
}

export interface Fill3236Data {
  nom: string
  prenoms: string
  dateNaissance: string | null
  lieuNaissance: string | null
  dateDeces: string | null
  lieuDeces: string | null
  volume: string
  numero: string
}

async function loadPDF(path: string): Promise<PDFDocument> {
  const response = await fetch(path)
  const bytes = await response.arrayBuffer()
  return PDFDocument.load(bytes)
}

/**
 * Fill Cerfa 3233-SD form fields.
 * Field names must be inspected from the actual PDF — this implementation
 * writes text directly onto the first page as a fallback if form fields
 * are not found (some Cerfa PDFs use flattened fields).
 */
export async function fill3233PDF(data: Fill3233Data): Promise<Uint8Array> {
  const pdf = await loadPDF('/forms/cerfa-3233-sd.pdf')
  const form = pdf.getForm()

  // Try to fill AcroForm fields if they exist
  const fields = form.getFields()
  if (fields.length > 0) {
    // Map known field patterns — exact names depend on the PDF
    for (const field of fields) {
      const name = field.getName().toLowerCase()
      try {
        const textField = form.getTextField(field.getName())
        if (name.includes('nom') && !name.includes('prenom')) textField.setText(data.nom)
        else if (name.includes('prenom') || name.includes('prénom')) textField.setText(data.prenoms)
        else if (name.includes('naissance') && name.includes('date')) textField.setText(data.dateNaissance ?? '')
        else if (name.includes('naissance') && name.includes('lieu')) textField.setText(data.lieuNaissance ?? '')
        else if (name.includes('deces') && name.includes('date')) textField.setText(data.dateDeces ?? '')
        else if (name.includes('deces') && name.includes('lieu')) textField.setText(data.lieuDeces ?? '')
      } catch {
        // Not a text field, skip
      }
    }
  } else {
    // Fallback: write text directly on the page
    const page = pdf.getPage(0)
    const { height } = page.getSize()
    const fontSize = 10
    // Approximate positions — to be refined with actual PDF layout
    page.drawText(data.nom, { x: 200, y: height - 280, size: fontSize })
    page.drawText(data.prenoms, { x: 200, y: height - 300, size: fontSize })
    if (data.dateNaissance) page.drawText(data.dateNaissance, { x: 200, y: height - 320, size: fontSize })
    if (data.lieuNaissance) page.drawText(data.lieuNaissance, { x: 200, y: height - 340, size: fontSize })
  }

  return pdf.save()
}

export async function fill3236PDF(data: Fill3236Data): Promise<Uint8Array> {
  const pdf = await loadPDF('/forms/cerfa-3236-sd.pdf')
  const form = pdf.getForm()

  const fields = form.getFields()
  if (fields.length > 0) {
    for (const field of fields) {
      const name = field.getName().toLowerCase()
      try {
        const textField = form.getTextField(field.getName())
        if (name.includes('nom') && !name.includes('prenom')) textField.setText(data.nom)
        else if (name.includes('prenom') || name.includes('prénom')) textField.setText(data.prenoms)
        else if (name.includes('naissance') && name.includes('date')) textField.setText(data.dateNaissance ?? '')
        else if (name.includes('naissance') && name.includes('lieu')) textField.setText(data.lieuNaissance ?? '')
        else if (name.includes('volume')) textField.setText(data.volume)
        else if (name.includes('numero') || name.includes('numéro')) textField.setText(data.numero)
      } catch {
        // Not a text field, skip
      }
    }
  } else {
    const page = pdf.getPage(0)
    const { height } = page.getSize()
    const fontSize = 10
    page.drawText(data.nom, { x: 200, y: height - 280, size: fontSize })
    page.drawText(data.prenoms, { x: 200, y: height - 300, size: fontSize })
    if (data.dateNaissance) page.drawText(data.dateNaissance, { x: 200, y: height - 320, size: fontSize })
    if (data.lieuNaissance) page.drawText(data.lieuNaissance, { x: 200, y: height - 340, size: fontSize })
    page.drawText(`Volume: ${data.volume}`, { x: 200, y: height - 380, size: fontSize })
    page.drawText(`Numéro: ${data.numero}`, { x: 200, y: height - 400, size: fontSize })
  }

  return pdf.save()
}

/** Trigger browser download of a PDF */
export function downloadPDF(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run tests**

Run: `cd ~/Genealogy && npx vitest run src/lib/__tests__/pdf-filler.test.ts`
Expected: All pass (tests run in jsdom, fetch needs mocking — may need to adjust test setup)

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf-filler.ts src/lib/__tests__/pdf-filler.test.ts
git commit -m "feat: add PDF filler for Cerfa 3233 and 3236 forms"
```

---

## Chunk 2: UI Components

### Task 4: Create PersonSelector component

**Files:**
- Create: `src/components/recherche/PersonSelector.tsx`

- [ ] **Step 1: Implement PersonSelector**

A small inline search that shows matching persons from the tree. Props:
- `persons: Person[]`
- `selectedPerson: Person | null`
- `onSelect: (person: Person) => void`

Shows the selected person with initials + name + date, and a "Changer" button that reveals a search input with filtered results.

- [ ] **Step 2: Commit**

```bash
git add src/components/recherche/PersonSelector.tsx
git commit -m "feat: add PersonSelector component for recherche modals"
```

---

### Task 5: Create SPFSelector component

**Files:**
- Create: `src/components/recherche/SPFSelector.tsx`

- [ ] **Step 1: Implement SPFSelector**

Props:
- `lieu: string | null` — lieu de naissance for auto-detection
- `selectedSPF: SPF | null`
- `onSelect: (spf: SPF) => void`

Auto-detects SPF from lieu on mount. Shows the detected SPF with name + département + email. "Choisir un autre SPF" link opens a dropdown with all SPFs.

- [ ] **Step 2: Commit**

```bash
git add src/components/recherche/SPFSelector.tsx
git commit -m "feat: add SPFSelector component with auto-detection"
```

---

### Task 6: Create Formulaire3233Modal

**Files:**
- Create: `src/components/recherche/Formulaire3233Modal.tsx`

- [ ] **Step 1: Implement the modal**

Uses PersonSelector, SPFSelector, and pdf-filler. Sections:
1. Personne concernée (PersonSelector)
2. Type de recherche (toggle personne/immeuble)
3. SPF (SPFSelector)
4. Données pré-remplies (read-only grid)
5. Bouton "Générer le PDF"

On click: calls `fill3233PDF()` with person data, then `downloadPDF()`.

- [ ] **Step 2: Commit**

```bash
git add src/components/recherche/Formulaire3233Modal.tsx
git commit -m "feat: add Formulaire3233Modal with PDF pre-fill"
```

---

### Task 7: Create Formulaire3236Modal

**Files:**
- Create: `src/components/recherche/Formulaire3236Modal.tsx`

- [ ] **Step 1: Implement the modal with guidance screen**

Two states:
- **Guidance**: explains the 3236 needs references, two buttons: "Oui, j'ai les références" / "Non, commencer par un 3233"
- **Form**: same as 3233 modal but with Volume + Numéro fields instead of type de recherche

"Non" button calls `onSwitch3233()` prop to switch to the 3233 modal.

- [ ] **Step 2: Commit**

```bash
git add src/components/recherche/Formulaire3236Modal.tsx
git commit -m "feat: add Formulaire3236Modal with guidance flow"
```

---

### Task 8: Create RechercheDropdown

**Files:**
- Create: `src/components/recherche/RechercheDropdown.tsx`

- [ ] **Step 1: Implement the dropdown**

A button "📋 Recherches" that toggles a dropdown with two items:
- "📋 Formulaire 3233 — Renseignements immobiliers"
- "📄 Formulaire 3236 — Copie de documents fonciers"

Each item calls `onOpen3233()` or `onOpen3236()` prop. Dropdown closes on click outside.

- [ ] **Step 2: Commit**

```bash
git add src/components/recherche/RechercheDropdown.tsx
git commit -m "feat: add RechercheDropdown for Topbar"
```

---

## Chunk 3: Wiring into app

### Task 9: Wire into Topbar + AppShell

**Files:**
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Add recherche state to AppShell**

Add state: `rechercheModal: '3233' | '3236' | null`
Pass callbacks to Topbar: `onOpen3233`, `onOpen3236`
Render modals conditionally.

- [ ] **Step 2: Add RechercheDropdown to Topbar**

Add `RechercheDropdown` between the search button and the avatar, passing `onOpen3233` and `onOpen3236` props.

- [ ] **Step 3: Run all tests**

Run: `cd ~/Genealogy && npm run test:run`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Topbar.tsx src/components/layout/AppShell.tsx
git commit -m "feat: wire recherche modals into Topbar and AppShell"
```

---

### Task 10: Commit PDF files + final test

- [ ] **Step 1: Commit PDF source files**

```bash
git add public/forms/cerfa-3233-sd.pdf public/forms/cerfa-3236-sd.pdf
git commit -m "chore: add official Cerfa 3233-SD and 3236-SD PDF forms"
```

- [ ] **Step 2: Run all tests**

Run: `cd ~/Genealogy && npm run test:run`
Expected: All pass

- [ ] **Step 3: Manual verification**

Open http://localhost:3001 → click "📋 Recherches" → select 3233 → verify modal opens with pre-filled data → click "Générer" → verify PDF downloads.
